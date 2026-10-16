import {Audio, interpolate, Sequence} from 'remotion';
import {has, src} from './assets';

type Vo = {file: string; from: number; dur: number};
type Sfx = {file: string; from: number};

const db = (d: number) => Math.pow(10, d / 20);
const VOICE = db(-6);
const MUSIC = db(-14);
const SFX = db(-10);
const DUCK = db(-6);
const RAMP = 4;

// Music level at absolute frame f: ducked 6 dB while any voice line plays.
const musicGain = (f: number, vo: Vo[]) => {
  let duck = 0;
  for (const v of vo) {
    const d = interpolate(f, [v.from - RAMP, v.from, v.from + v.dur, v.from + v.dur + RAMP], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    duck = Math.max(duck, d);
  }
  return MUSIC * (1 - duck + duck * DUCK);
};

export const AudioMix: React.FC<{vo: Vo[]; sfx: Sfx[]; musicSwitch: number; total: number}> = ({vo, sfx, musicSwitch, total}) => (
  <>
    {/* Hard switch at shot 11, no crossfade. */}
    {has('assets/music/hunt.mp3') && (
      <Sequence from={0} durationInFrames={musicSwitch} layout="none">
        <Audio src={src('assets/music/hunt.mp3')} volume={(f) => musicGain(f, vo)} />
      </Sequence>
    )}
    {has('assets/music/party.mp3') && (
      <Sequence from={musicSwitch} durationInFrames={total - musicSwitch} layout="none">
        <Audio src={src('assets/music/party.mp3')} volume={(f) => musicGain(f + musicSwitch, vo)} />
      </Sequence>
    )}
    {vo.filter((v) => has(v.file)).map((v, i) => (
      <Sequence key={`vo${i}`} from={v.from} layout="none">
        <Audio src={src(v.file)} volume={VOICE} />
      </Sequence>
    ))}
    {sfx.filter((s) => has(s.file)).map((s, i) => (
      <Sequence key={`sfx${i}`} from={s.from} layout="none">
        <Audio src={src(s.file)} volume={s.file.includes('crowd') ? SFX * 0.6 : SFX} />
      </Sequence>
    ))}
  </>
);
