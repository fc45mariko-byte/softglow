"""Build src/data/timeline.json, beats.json and out/vampire-hunters.fr.srt.

- Reads music from public/assets/music/{hunt,party}.mp3 and runs
  librosa.beat.beat_track on each -> beats.json.
- Snaps every cut to the nearest beat within +/-6 frames, keeping 75 s total.
- Places voice lines using their real durations (public/assets/vo/*.mp3),
  falling back to a length estimate when a file is missing.
- Writes French subtitles (start = line start, end = line end + 8 frames),
  wrapped to max 2 lines x 38 characters.

Re-run after any audio changes: python3 scripts/build_timeline.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
FPS = 30
TOTAL = 75 * FPS
SNAP = 6
NB = " "  # French spacing before ? ! and inside guillemets

# (shot, planned start s, planned end s)
SHOTS = [
    (1, 0, 4), (2, 4, 9), (3, 9, 13), (4, 13, 18), (5, 18, 21), (6, 21, 25),
    (7, 25, 28), (8, 28, 33), (9, 33, 36), (10, 36, 42), (11, 42, 46),
    (12, 46, 51), (13, 51, 57), (14, 57, 62), (15, 62, 68), (16, 68, 75),
]
MUSIC_SWITCH_SHOT = 11

# shot, speaker, files (layered), english, french, delay after shot start or previous line (s)
LINES = [
    (2, "vampire", ["shot02_vampire"], "Four little hunters… out past curfew?", "Quatre petits chasseurs… dehors après le couvre-feu ?", 0.4),
    (3, "luca", ["shot03_luca"], "Curfew's for the living.", "Le couvre-feu, c'est pour les vivants.", 0.6),
    (4, "cara", ["shot04_cara"], "Hold still. This only hurts forever.", "Ne bouge pas. Ça ne fait mal que pour l'éternité.", 0.4),
    (6, "tara", ["shot06_tara"], "Missed me? I didn't miss you.", "Je t'ai manqué ? Moi, je ne t'ai pas raté.", 0.5),
    (7, "luca", ["shot07_luca"], "Too slow.", "Trop lent.", 0.8),
    (8, "luna", ["shot08_luna"], "Shh… sweet dreams, darling.", "Chut… fais de beaux rêves, mon chéri.", 0.3),
    (10, "cara", ["shot10_cara"], "That's four tonight.", "Ça fait quatre ce soir.", 0.5),
    (10, "tara", ["shot10_tara"], "Then drinks are on Luca.", "Alors c'est Luca qui paie les verres.", 0.3),
    (11, "luca", ["shot11_luca"], "Why is it always me?", "Pourquoi c'est toujours moi ?", 1.0),
    (12, "luna", ["shot12_luna"], "Because you lost the bet, babe.", "Parce que t'as perdu le pari, mon cœur.", 0.5),
    (13, "tara", ["shot13_tara"], "To dead things staying dead!", "Aux morts qui restent morts !", 0.5),
    (13, "all", ["shot13_cheers_tara", "shot13_cheers_luna", "shot13_cheers_cara", "shot13_cheers_luca"], "Cheers!", "Santé !", 0.15),
    (15, "cara", ["shot15_cara"], "Same time tomorrow?", "Même heure demain ?", 1.2),
    (16, "luna", ["shot16_luna"], "Obviously.", "Évidemment.", 1.0),
]

# shot, sfx file, offset as fraction of shot duration, volume multiplier
SFX = [
    (1, "wind_bell", 0.0), (3, "boots", 0.0), (4, "crossbow", 0.85), (5, "bolt_impact", 0.0),
    (6, "daggers", 0.15), (7, "katana", 0.05), (8, "stake", 0.4), (9, "ash", 0.0),
    (11, "neon", 0.0), (12, "bottles", 0.5), (13, "glasses", 0.75), (13, "cheer", 0.8),
    (14, "crowd", 0.0), (15, "crowd", 0.0), (16, "birds", 0.0),
]


def duration(path: pathlib.Path, fallback: float) -> float:
    """Seconds until speech ends (eleven_v3 takes carry up to 4 s of trailing silence)."""
    if path.exists():
        import librosa
        import numpy as np
        y, sr = librosa.load(str(path), sr=16000, mono=True)
        rms = librosa.feature.rms(y=y, frame_length=640, hop_length=160)[0]
        voiced = np.where(rms > rms.max() * 0.06)[0]
        # Split into runs separated by >= 0.2 s; drop trailing clicks shorter than 0.1 s.
        runs = np.split(voiced, np.where(np.diff(voiced) > 20)[0] + 1)
        while len(runs) > 1 and len(runs[-1]) < 10:
            runs.pop()
        return float((runs[-1][-1] + 1) * 160 / sr) + 0.1
    return fallback


def beats(path: pathlib.Path) -> list[float]:
    if not path.exists():
        return []
    import librosa
    y, sr = librosa.load(str(path), sr=None, mono=True)
    _, frames = librosa.beat.beat_track(y=y, sr=sr)
    return [float(t) for t in librosa.frames_to_time(frames, sr=sr)]


def snap(frame: int, beat_frames: list[int]) -> int:
    best = min(beat_frames, key=lambda b: abs(b - frame), default=None)
    if best is not None and abs(best - frame) <= SNAP:
        return best
    return frame


def fr_typo(s: str) -> str:
    for p in "?!:;":
        s = s.replace(" " + p, NB + p)
    return f"«{NB}{s}{NB}»"


def wrap(s: str) -> str:
    # One line if it fits; otherwise break at the normal space (never an NBSP)
    # that gives the most balanced pair of lines, each at most 38 characters.
    if len(s) <= 38:
        return s
    cuts = [i for i, c in enumerate(s) if c == " " and i <= 38 and len(s) - i - 1 <= 38]
    if not cuts:
        raise ValueError(f"subtitle does not fit 2 x 38: {s!r}")
    i = min(cuts, key=lambda i: abs(i - (len(s) - i - 1)))
    return s[:i] + "\n" + s[i + 1:]


def srt_time(frame: int) -> str:
    ms = round(frame * 1000 / FPS)
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main() -> None:
    hunt = beats(PUBLIC / "assets/music/hunt.mp3")
    party = beats(PUBLIC / "assets/music/party.mp3")
    (ROOT / "src/data").mkdir(parents=True, exist_ok=True)
    (ROOT / "src/data/beats.json").write_text(json.dumps({"hunt": hunt, "party": party}, indent=1))

    # Snap cuts. Cuts up to and including the music switch follow hunt beats;
    # later cuts follow party beats offset by the (snapped) switch point.
    hunt_f = [round(t * FPS) for t in hunt]
    starts = [s * FPS for _, s, _ in SHOTS]
    switch = None
    for i, (shot, _, _) in enumerate(SHOTS):
        if i == 0:
            continue
        if switch is None:
            starts[i] = snap(starts[i], hunt_f)
            if shot == MUSIC_SWITCH_SHOT:
                switch = starts[i]
        else:
            party_f = [switch + round(t * FPS) for t in party]
            starts[i] = snap(starts[i], party_f)
    ends = starts[1:] + [TOTAL]
    shots = [{"id": s, "from": f, "dur": e - f} for (s, _, _), f, e in zip(SHOTS, starts, ends)]
    by_id = {s["id"]: s for s in shots}

    vo, subs = [], []
    cursor = {}
    for shot, speaker, files, en, fr, delay in LINES:
        base = cursor.get(shot, by_id[shot]["from"])
        start = base + round(delay * FPS)
        est = 0.4 + 0.065 * len(en)
        durs = [duration(PUBLIC / f"assets/vo/{f}.mp3", est) for f in files]
        dur = round(max(durs) * FPS)
        for f, d in zip(files, durs):
            vo.append({"file": f"assets/vo/{f}.mp3", "speaker": speaker, "from": start, "dur": round(d * FPS)})
        subs.append({"from": start, "to": start + dur + 8, "speaker": speaker, "text": wrap(fr_typo(fr)), "en": en})
        cursor[shot] = start + dur
        shot_end = by_id[shot]["from"] + by_id[shot]["dur"]
        if start + dur > shot_end:
            print(f"warning: shot {shot} line '{en}' runs {start + dur - shot_end} frames past the cut")

    sfx = []
    for shot, name, frac in SFX:
        s = by_id[shot]
        sfx.append({"file": f"assets/sfx/{name}.mp3", "from": s["from"] + round(frac * s["dur"]), "shot": shot})

    timeline = {
        "fps": FPS,
        "total": TOTAL,
        "musicSwitch": switch,
        "shots": shots,
        "vo": vo,
        "subs": subs,
        "sfx": sfx,
        # Without the party track, fall back to a 120 BPM grid so shot 14's strobe still fires.
        "partyBeats": [switch + round(t * FPS) for t in party] if party else list(range(switch, TOTAL, FPS // 2)),
        "beatSource": {"hunt": "librosa" if hunt else "missing", "party": "librosa" if party else "missing (120 BPM grid)"},
    }
    (ROOT / "src/data/timeline.json").write_text(json.dumps(timeline, indent=1, ensure_ascii=False))

    srt = []
    for i, s in enumerate(subs, 1):
        srt.append(f"{i}\n{srt_time(s['from'])} --> {srt_time(s['to'])}\n{s['text']}\n")
    (ROOT / "out").mkdir(exist_ok=True)
    (ROOT / "subtitles.fr.srt").write_text("\n".join(srt), encoding="utf-8")
    (ROOT / "out/vampire-hunters.fr.srt").write_text("\n".join(srt), encoding="utf-8")
    print(f"shots={len(shots)} vo={len(vo)} subs={len(subs)} beats hunt={len(hunt)} party={len(party)} switch={switch}")


if __name__ == "__main__":
    main()
