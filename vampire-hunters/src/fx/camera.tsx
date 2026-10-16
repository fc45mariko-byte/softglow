import {AbsoluteFill, Easing, Freeze, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';

const ease = Easing.bezier(0.45, 0, 0.55, 1);

// Scale + translate over the sequence duration, eased.
export const KenBurns: React.FC<{
  from?: number;
  to?: number;
  x?: [number, number];
  y?: [number, number];
  children: React.ReactNode;
}> = ({from = 1, to = 1.08, x = [0, 0], y = [0, 0], children}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames - 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const s = from + (to - from) * t;
  const tx = x[0] + (x[1] - x[0]) * t;
  const ty = y[0] + (y[1] - y[0]) * t;
  return <AbsoluteFill style={{transform: `translate(${tx}px, ${ty}px) scale(${s})`}}>{children}</AbsoluteFill>;
};

// Seeded camera shake. Intensity in px, decays linearly over `duration` frames.
export const Shake: React.FC<{at: number; duration: number; intensity?: number; seed?: string; children: React.ReactNode}> = ({
  at,
  duration,
  intensity = 18,
  seed = 'shake',
  children,
}) => {
  const frame = useCurrentFrame();
  const local = frame - at;
  let tx = 0;
  let ty = 0;
  let rot = 0;
  if (local >= 0 && local < duration) {
    const k = intensity * (1 - local / duration);
    tx = (random(`${seed}x${local}`) * 2 - 1) * k;
    ty = (random(`${seed}y${local}`) * 2 - 1) * k;
    rot = (random(`${seed}r${local}`) * 2 - 1) * k * 0.04;
  }
  return <AbsoluteFill style={{transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg)`}}>{children}</AbsoluteFill>;
};

// Freeze children for `frames` frames starting at `at` (impact hit-stop).
export const HitStop: React.FC<{at: number; frames: number; children: React.ReactNode}> = ({at, frames, children}) => {
  const frame = useCurrentFrame();
  if (frame >= at && frame < at + frames) {
    return <Freeze frame={at}>{children}</Freeze>;
  }
  return <>{children}</>;
};

// Whip-pan in: horizontal slide with motion blur over the first `frames` frames.
export const WhipIn: React.FC<{frames?: number; children: React.ReactNode}> = ({frames = 6, children}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const t = interpolate(frame, [0, frames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{transform: `translateX(${t * width * 0.6}px)`, filter: t > 0.01 ? `blur(${t * 28}px)` : undefined}}>
      {children}
    </AbsoluteFill>
  );
};

// Linear opacity ramp in over `frames` frames.
export const FadeIn: React.FC<{frames: number; children: React.ReactNode}> = ({frames, children}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, frames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};
