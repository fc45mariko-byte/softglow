# Voice file identification

The user-supplied `audio_N.mp3` files carry no tags. Each was matched to its Magnific
voice take by (1) Magnific's recorded duration (ceil of the real length), (2) speech end
and pause pattern against `audio_timing_get` word timings, and (3) MFCC timbre similarity
to takes already identified.

| File | Line | Basis |
|---|---|---|
| audio_4 | shot02_vampire | 5.84 s, pause at 2.1–3.0 s, f0 81 Hz |
| audio_6 | shot04_cara | 6.32 s, 3 phrases ending 4.30 s |
| audio_8 | shot06_tara | 3.44 s, 2 phrases |
| audio_9 | shot07_luca | speech ends 1.14 s (timing 1.12 s) |
| audio_10 | shot08_luna | pause 0.64–1.30 s, ends 2.52 s (timing 2.48 s) |
| audio_11 | shot10_cara | ends 1.42 s (timing 1.36 s) |
| audio_12 | shot15_cara | ends 1.07 s (timing 1.28 s); least certain, by elimination |
| audio_13 | shot11_luca | ends 1.64 s (timing 1.68 s); timbre closest to the male voices |
| audio_15 | shot13_tara | 3.44 s, timbre closest to Tara |
| audio_17 | shot16_luna | ends 0.90 s (timing 0.88 s), timbre closest to Luna |
| audio_20 | shot13_cheers_tara | ~0.55 s of speech, length rounds up to 3 s, timbre closest to Tara |
| audio_21 | shot13_cheers_luca | ~0.4 s of speech, length rounds up to 4 s (only the Luca take is 4 s) |
