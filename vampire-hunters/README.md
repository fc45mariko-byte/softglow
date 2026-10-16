# Vampire Hunters

Vertical animated short · 1080×1920 · 30 fps · 75 s · English voices, French subtitles burned in.
All motion is built in Remotion from still keyframes; no AI video.

## Status

| Phase | State |
|---|---|
| 1 Setup | done: Remotion project, ledger, reference sheets identified |
| 2 Keyframes | 16/16 generated in Magnific (`imagen-nano-banana-2`, 9:16) |
| 3 Layers | 13 foreground cutouts generated; 8 in the repo (shots 5–8, 11, 12, 15, 16), 5 still to fetch (2, 3, 4, 10, 13) |
| 4 Audio | 17 voice takes, 2 music tracks, 14 SFX generated; `voices.json` |
| 5 Animation | all 16 shots + effect library + transitions + grade |
| 6 Subtitles | `subtitles.fr.srt` + burned-in `Subtitles` component |
| 7 Mix/render | mix in `AudioMix.tsx`; render pipeline verified |

Credits: **1,883 / 4,000** (see `ledger.csv`, reconciled against the account balance).

**The 16 keyframes are in the repo** (`public/assets/shots/shotNN.jpg`, 1536×2752, JPEG q93).
Cutouts for shots 5–8, 11, 12, 15 and 16 are in `public/assets/layers/`. The other 5 cutouts, voices, music and SFX are not: the generating session could not reach the Magnific
CDN (`pikaso.cdnpk.net`). Until `npm run fetch` gets them, shots render without parallax
cutouts and the film has no sound. Every asset's creation id and signed URL is in `assets_manifest.json`.

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

- **Keyframe size**: Magnific metadata reports 768×1344, but the delivered files are 1536×2752,
  so they are scaled down to 1080×1920 and no upscale is needed.
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
- Effect positions (moon glow, eye glint, goggle glint, impact points, dagger launch points,
  slash path, foam origin, dawn sun) are matched to the delivered keyframes in `src/shots/Shots.tsx`.

## Keyframe QA against the sheets (no retakes made)

| Shot | Note |
|---|---|
| 5 | A rifle-like object floats next to the vampire; the crossbow is drawn in his hand rather than as a bolt in his shoulder |
| 6, 10, 11, 13–16 | Tara's hair is rendered white rather than platinum blonde; in 6 and 16 her outfit is sage instead of black |
| 9 | The dissolving silhouette has spiky hair and a red-lined coat, closer to Luca than to the gaunt vampire |
| 11, 13, 15 | Neon signs contain pseudo-letters |
| 16 | Cara's outfit is red instead of black |
