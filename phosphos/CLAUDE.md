# PHOSPHOS — project brief for Claude Code

Animated story by Fati. This folder continues work started in the Claude app.
Read this file before doing anything.

## Working rules (from Fati)
- Execute the task as stated. Interpret instructions literally; ask a clarifying question when needed.
- No meta-commentary about what she "should" want; no reframing the task.
- Linguistic precision matters. Do not use "we" to include Claude when it doesn't apply.
- **Do not generate paid AI video** (Magnific video costs 4,000–19,000 credits per clip; she declined).
  Animation is done in code: panels + camera moves + effects, rendered with Python/ffmpeg.
- Check Magnific credit cost (`simulate_cost`) before any paid generation and tell her.

## Story
Phosphos, a tropical futuristic metropolis. Ashoka and Demetria, two vampires ~2,000 years old,
run an exclusive courtesan house where wealthy men become their prey. Neither remembers how they met.
Themes: immortality, memory, intimacy, deception, predation, historical change.

Narrative fragments, in order 4 → 6 → 8 → 12:
- 4 The Joke Nobody Understands — shared laugh whose origin they forgot.
- 6 The Portraits — paintings of the two across eras: close, distant, one alone.
- 8 The Almost-Murder — Demetria remembers Ashoka bloodied above her; saving or killing? Staged ambiguous (undecided).
- 12 The Missing Beginning — their bond began with a decision they no longer remember.

Scene 1 "The House Always Wins" is written: see `scene1_script.txt`.

## Visual style (locked — match `source/original_artwork.png` and `source/visual_bible.png`)
- Hand-inked bande-dessinée linework, fine black contours, aged cream paper, thin black panel borders.
- Palette: olive, sepia, ochre, warm gold; present-day night adds teal and phosphorescent green-gold glow.
- Ashoka: black hair in low bun, sheer olive top with mandarin collar, folding fan.
- Demetria: dark skin, curly updo, gold headband, large gold earrings, gold-patterned draped dress.
- Memory eras: warm sepia / faded crimson-brown / oldest = dissolving linework, blank faces.
- Recurring objects: folding fan, gold earring (+ the ring from Scene 1 — not yet in the bible).
- Feeding is never shown directly; a little stylized blood is OK (drop, thin trail, glint, trace on lip).

## Assets in Magnific (Personal project)
Model used for stills: Google Nano Banana Pro (`imagen-nano-banana-2`), 16:9, 2k, ~75 credits each,
references = original artwork + visual bible v1.
- Original artwork upload: IMG_6262
- Visual bible v1: https://www.magnific.com/app/creation/XmsFUgUBfo  (v2: …/UPD2XdOwny)
- Fragment storyboards: 4 …/XmsFRjQBfo · 6 …/mE7kniThJQ · 8 …/vQOrWY8a47 · 12 …/1lzPIHPr4r
- Scene 1 storyboard (6 panels per page, 3x2 grid, labelled shots):
  - 1/4 https://www.magnific.com/app/creation/aFyxd2TfSh
  - 2/4 https://www.magnific.com/app/creation/vQOrecpa47
  - 3/4 with blood (use this one) https://www.magnific.com/app/creation/xSY95HsjfW  (old, no blood: …/SyMZKrVUb8)
  - 4/4 https://www.magnific.com/app/creation/SyMZkweUb8
Download these into `storyboards/` (scene1_p1.png … scene1_p4.png) — the cloud workspace could not.

## Pipeline
1. Download Scene 1 pages → `storyboards/`.
2. Cut each page into its 6 panels (adapt `crop_panels.py`; detect the 3x2 grid, drop labels/borders) → `panels/scene1/`.
3. Build the Scene 1 animatic from `render_test.py`: one shot per panel in script order, camera move per shot,
   rain (salon/courtyard exterior), lantern flicker, red glint on the earring (3/4 panel 5), crossfades,
   dialogue from the script as subtitles, title card at the end. Output `renders/scene1_animatic.mp4`.
4. Optional later: sound (rain, strings) mixed with ffmpeg.

## Files
- `render_test.py` — working 20 s test (Ken Burns, rain particles, flicker, grain, vignette, crossfades, title). Needs Pillow, numpy, ffmpeg.
- `crop_panels.py` — crops the 5 panels from the original artwork.
- `renders/animatic_test.mp4` — result of the test (compressed).
- Encoding note: grain makes files huge; final encode with `-vf hqdn3d=1.5:1.5:4:4 -crf 24 -preset slow`.
