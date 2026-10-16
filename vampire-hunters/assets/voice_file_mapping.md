# Voice file identification

The user-supplied `audio_N.mp3` files carry no tags. Identical files reuse the same N across
batches, and N follows Magnific's creation order of the 17 takes: N = take index + 3
(audio_7 is a duplicate of audio_6). Each match was checked against Magnific's recorded
duration (ceil of the real length) and the speech end from `audio_timing_get`.

| File | Take # | Line | Speech end (file / Magnific timing) |
|---|---|---|---|
| audio_4 | 1 | shot02_vampire | 4.59 / 4.48 s |
| audio_5 | 2 | shot03_luca | 1.20 / 3.28 s (last word cell is stretched) |
| audio_6 | 3 | shot04_cara | 4.30 / 4.24 s |
| audio_8 | 4 | shot06_tara | 3.44 / 2.96 s |
| audio_9 | 5 | shot07_luca | 1.14 / 1.12 s |
| audio_10 | 6 | shot08_luna | 2.52 / 2.48 s |
| audio_11 | 7 | shot10_cara | 1.42 / 1.36 s |
| audio_12 | 8 | shot10_tara | 1.07 / 1.76 s (last word cell is stretched) |
| audio_13 | 9 | shot11_luca | 1.64 / 1.68 s |
| audio_14 | 10 | shot12_luna | 1.65 / 1.68 s |
| audio_15 | 11 | shot13_tara | 2.16 / 2.72 s |
| audio_16 | 12 | shot15_cara | 1.28 / 1.28 s |
| audio_17 | 13 | shot16_luna | 0.90 / 0.88 s |
| audio_18 | 14 | shot13_cheers_tara | 0.72 s |
| audio_19 | 15 | shot13_cheers_luna | supplied (Magnific timing 0.64 s) |
| audio_20 | 16 | shot13_cheers_cara | 0.65 / 0.80 s |
| audio_21 | 17 | shot13_cheers_luca | 0.50 s |
