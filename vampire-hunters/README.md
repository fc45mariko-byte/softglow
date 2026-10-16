# Vampire Hunters

Vertical animated short · 1080×1920 · 30 fps · 75 s · English voices, French subtitles burned in.
All motion is built in Remotion from still keyframes; no AI video.

## Status

| Phase | State |
|---|---|
| 1 Setup | done: Remotion project, ledger, reference sheets identified |
| 2 Keyframes | 16/16 generated in Magnific (`imagen-nano-banana-2`, 9:16) |
| 3 Layers | 13 foreground cutouts generated (shots 2–8, 10–13, 15, 16) |
| 4 Audio | 17 voice takes, 2 music tracks, 14 SFX generated; `voices.json` |
| 5 Animation | all 16 shots + effect library + transitions + grade |
| 6 Subtitles | `subtitles.fr.srt` + burned-in `Subtitles` component |
| 7 Mix/render | mix in `AudioMix.tsx`; render pipeline verified |

Credits: **1,883 / 4,000** (see `ledger.csv`, reconciled against the account balance).

**Assets are not in the repo yet.** The session that generated them could not reach
the Magnific CDN (`pikaso.cdnpk.net`), so everything renders with placeholders until
you fetch them. Every asset's creation id and signed URL is in `assets_manifest.json`.

## Build

```bash
npm install
npm run fetch      # downloads 62 assets into public/assets/
npm run render     # beat detection + timeline + subtitles, then out/vampire-hunters.mp4
```

The signed URLs expire on 2026-10-18 (`exp=1792368000`). After that, refresh them
with Magnific `creations_get` on the ids in the manifest.

`npm run timeline` (`scripts/build_timeline.py`):
- runs `librosa.beat.beat_track` on both tracks → `src/data/beats.json`
- snaps every cut to the nearest beat (±6 frames), total stays 2,250 frames
- places voice lines from their real durations
- writes `subtitles.fr.srt` and `out/vampire-hunters.fr.srt` (end = line end + 8 frames, ≤ 2 × 38 chars)

Re-time anything by editing `SHOTS`, `LINES` or `SFX` in that script and re-running; no credits needed.

## References

| Role | Magnific id |
|---|---|
| Style (group image) | `fH4uD3pCDY` |
| Luna sheet | `SyD7r9VUb8` |
| Tara sheet | `YMq0RElWeC` |
| Cara sheet | `1lnjF96r4r` |
| Unused restyle (same size as Cara's source; probably a second Cara) | `TdkDGuzVNR` |
| Luca sheet (uploaded from `assets/refs/luca_sheet.jpg`) | `Cq9FlhNEEy` |

## Voices (`voices.json`, ElevenLabs `eleven_v3`)

Vampire: Mortimer Nocturne (520) · Tara: Avery Grant (159) · Luna: Harper Olivia (261) ·
Cara: Cordelia Ashford (1047) · Luca: Alistair Ashford (1103).

## Deviations from the production plan

- **Keyframes are 768×1344**, not "2k": Nano Banana Pro returns 768×1344 at 9:16 even with
  `resolution: 2k`. Frames are scaled ~1.43× to cover 1080×1920. Upscaling would sharpen them
  (not done; check the cost with `simulate_cost` on `images_upscale` first).
- **Music uses `google-lyria-3-pro`** (160 credits/track): `google-lyria-3` is fixed at 30 s,
  shorter than both the 42 s and 33 s cues.
- **Sheets passed as `image` references**: Magnific's `character` type accepts only its
  library assets, not creations.
- **Shots 1 and 10 were not held for approval**: at the user's instruction, the whole batch was generated in one pass.
- **Separate dagger/bottle/glass cutouts**: daggers in shot 6 are drawn as flat SVG shapes
  flying at camera; in shots 12 and 13 the foreground cutout (hands + bottles/glasses) is the moving layer.
- **Shot 9 dissolve** masks the whole keyframe top-to-bottom over a flat moon/spire backdrop
  (no cutout was planned for shot 9).
- **"Cheers!"** is four separate takes (one per voice) layered.
- Effect positions (moon glow, eye glint, burst centres) were placed without seeing the keyframes;
  adjust the coordinates in `src/shots/Shots.tsx` after the first real render.
