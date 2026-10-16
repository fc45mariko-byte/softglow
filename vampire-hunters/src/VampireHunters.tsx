import {AbsoluteFill, Sequence} from 'remotion';
import {AudioMix} from './AudioMix';
import timeline from './data/timeline.json';
import {Grade} from './fx/special';
import {
  FadeIn,
  Shot01,
  Shot02,
  Shot03,
  Shot04,
  Shot05,
  Shot06,
  Shot07,
  Shot08,
  Shot09,
  Shot10,
  Shot11,
  Shot12,
  Shot13,
  Shot14,
  Shot15,
  Shot16,
  ShotProps,
} from './shots/Shots';
import {Subtitles} from './Subtitles';

const SHOTS: Record<number, React.FC<ShotProps>> = {
  1: Shot01,
  2: Shot02,
  3: Shot03,
  4: Shot04,
  5: Shot05,
  6: Shot06,
  7: Shot07,
  8: Shot08,
  9: Shot09,
  10: Shot10,
  11: Shot11,
  12: Shot12,
  13: Shot13,
  14: Shot14,
  15: Shot15,
};

const DAWN_FADE = 12;
const TITLE_AT = 71 * timeline.fps; // 1:11
const TITLE_HOLD = 3 * timeline.fps;

export const VampireHunters: React.FC = () => {
  const s16 = timeline.shots.find((s) => s.id === 16)!;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {/* Hard cuts by default; transitions (flashes, whip-pan) live inside the shots. */}
      {timeline.shots
        .filter((s) => s.id !== 16)
        .map((s) => {
          const Shot = SHOTS[s.id];
          const beats = timeline.partyBeats.filter((b) => b >= s.from && b < s.from + s.dur).map((b) => b - s.from);
          return (
            <Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={`Shot ${s.id}`}>
              <Shot dur={s.dur} beats={beats} />
            </Sequence>
          );
        })}
      {/* 12-frame fade to dawn: shot 16 starts early and fades in over shot 15. */}
      <Sequence from={s16.from - DAWN_FADE} durationInFrames={s16.dur + DAWN_FADE} name="Shot 16">
        <FadeIn frames={DAWN_FADE}>
          <Shot16
            dur={s16.dur + DAWN_FADE}
            beats={[]}
            titleAt={TITLE_AT - (s16.from - DAWN_FADE)}
            blackAt={TITLE_AT + TITLE_HOLD - (s16.from - DAWN_FADE)}
          />
        </FadeIn>
      </Sequence>
      <Grade />
      <Subtitles subs={timeline.subs} />
      <AudioMix vo={timeline.vo} sfx={timeline.sfx} musicSwitch={timeline.musicSwitch} total={timeline.total} />
    </AbsoluteFill>
  );
};
