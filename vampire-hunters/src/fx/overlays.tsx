import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../assets';

// Full-frame colour flash: solid for `hold` frames, then fades over `fade`.
export const Flash: React.FC<{at: number; color?: string; hold?: number; fade?: number; max?: number}> = ({
  at,
  color = COLORS.red,
  hold = 2,
  fade = 4,
  max = 1,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + hold, at + hold + fade], [max, max, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (frame < at || o <= 0) return null;
  return <AbsoluteFill style={{background: color, opacity: o, mixBlendMode: color === COLORS.cream || color === '#fff' ? 'screen' : 'normal'}} />;
};

// Radial speed lines converging on a point (px). Visible from `from` to `to`.
export const SpeedLines: React.FC<{cx: number; cy: number; from: number; to: number; count?: number; color?: string; seed?: string}> = ({
  cx,
  cy,
  from,
  to,
  count = 48,
  color = COLORS.cream,
  seed = 'sl',
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  if (frame < from || frame > to) return null;
  const o = interpolate(frame, [from, from + 3, to - 4, to], [0, 0.85, 0.85, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const R = Math.hypot(width, height);
  const lines = Array.from({length: count}, (_, i) => {
    const a = (i / count) * Math.PI * 2 + random(`${seed}a${i}`) * 0.12;
    const jitter = random(`${seed}${i}-${frame}`);
    const inner = R * (0.18 + jitter * 0.12);
    const w = 3 + random(`${seed}w${i}`) * 9;
    const x1 = cx + Math.cos(a) * inner;
    const y1 = cy + Math.sin(a) * inner;
    const x2 = cx + Math.cos(a) * R;
    const y2 = cy + Math.sin(a) * R;
    const nx = -Math.sin(a) * w;
    const ny = Math.cos(a) * w;
    return <polygon key={i} points={`${x1},${y1} ${x2 + nx},${y2 + ny} ${x2 - nx},${y2 - ny}`} fill={color} />;
  });
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={width} height={height}>{lines}</svg>
    </AbsoluteFill>
  );
};

// Animated slash arc: SVG stroke drawn on with stroke-dashoffset.
export const SlashArc: React.FC<{at: number; frames?: number; d?: string; color?: string; width?: number}> = ({
  at,
  frames = 5,
  d = 'M -60 1500 Q 540 700 1140 420',
  color = COLORS.cream,
  width = 34,
}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  if (frame < at) return null;
  const draw = interpolate(frame, [at, at + frames], [1, 0], {extrapolateRight: 'clamp'});
  const o = interpolate(frame, [at + frames + 6, at + frames + 16], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={W} height={H}>
        <path d={d} pathLength={1} stroke={COLORS.ink} strokeWidth={width + 14} fill="none" strokeLinecap="round" strokeDasharray={1} strokeDashoffset={draw} />
        <path d={d} pathLength={1} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeDasharray={1} strokeDashoffset={draw} />
      </svg>
    </AbsoluteFill>
  );
};

type ParticleKind = 'ash' | 'dust' | 'ember' | 'foam';

// Seeded, deterministic flat-shape particles.
export const Particles: React.FC<{
  kind: ParticleKind;
  count?: number;
  seed?: string;
  from?: number;
  origin?: {x: number; y: number}; // burst origin (dust/foam); omit for full-frame drift
  speed?: number;
}> = ({kind, count = 60, seed = kind, from = 0, origin, speed = 1}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = frame - from;
  if (t < 0) return null;
  const palette: Record<ParticleKind, string[]> = {
    ash: [COLORS.ink, COLORS.red, '#3a0a0e'],
    dust: [COLORS.cream, '#d9cbb0'],
    ember: [COLORS.red, '#ff6a2a'],
    foam: [COLORS.cream, '#fff8ea'],
  };
  const items = Array.from({length: count}, (_, i) => {
    const r = (k: string) => random(`${seed}-${k}-${i}`);
    const size = (kind === 'foam' ? 6 : 8) + r('s') * (kind === 'ash' ? 22 : 14);
    const color = palette[kind][Math.floor(r('c') * palette[kind].length)];
    let x: number;
    let y: number;
    let op = 1;
    if (origin) {
      const a = r('a') * Math.PI * 2;
      const v = (6 + r('v') * 22) * speed;
      x = origin.x + Math.cos(a) * v * t;
      y = origin.y + Math.sin(a) * v * t * 0.6 + 0.35 * t * t * (kind === 'foam' ? 1 : 0.15);
      op = interpolate(t, [0, 30 + r('l') * 30], [1, 0], {extrapolateRight: 'clamp'});
    } else {
      const vy = (kind === 'ash' || kind === 'ember' ? -1 : 1) * (1.2 + r('vy') * 2.4) * speed;
      x = (r('x') * width + Math.sin((t + r('p') * 100) / 18) * 30) % width;
      y = (((r('y') * height + vy * t) % height) + height) % height;
    }
    const rot = r('rot') * 360 + t * (r('rs') * 6 - 3);
    return (
      <rect
        key={i}
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size * (kind === 'ash' ? 0.6 : 1)}
        fill={color}
        opacity={op}
        transform={`rotate(${rot} ${x} ${y})`}
        rx={kind === 'foam' ? size / 2 : 0}
      />
    );
  });
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={width} height={height}>{items}</svg>
    </AbsoluteFill>
  );
};

// Beat-synced red/pink overlays. `beats` are frames relative to the sequence.
export const Strobe: React.FC<{beats: number[]; length?: number}> = ({beats, length = 4}) => {
  const frame = useCurrentFrame();
  const idx = beats.findIndex((b) => frame >= b && frame < b + length);
  if (idx < 0) return null;
  const o = interpolate(frame - beats[idx], [0, length], [0.45, 0]);
  return <AbsoluteFill style={{background: idx % 2 ? COLORS.pink : COLORS.neonRed, opacity: o, mixBlendMode: 'screen'}} />;
};

// Beat-synced zoom pulse 1.00 -> 1.03 -> 1.00.
export const BeatPulse: React.FC<{beats: number[]; children: React.ReactNode}> = ({beats, children}) => {
  const frame = useCurrentFrame();
  const last = [...beats].reverse().find((b) => b <= frame);
  const s = last === undefined ? 1 : interpolate(frame - last, [0, 3, 9], [1, 1.03, 1], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{transform: `scale(${s})`}}>{children}</AbsoluteFill>;
};

// Sweeping light-beam overlays.
export const LightBeams: React.FC<{count?: number; seed?: string}> = ({count = 4, seed = 'beam'}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: 0.35}}>
      <svg width={width} height={height}>
        {Array.from({length: count}, (_, i) => {
          const base = random(`${seed}${i}`) * 80 - 40;
          const a = base + Math.sin((frame + i * 23) / 14) * 28;
          const x = width * ((i + 0.5) / count);
          return (
            <polygon
              key={i}
              points={`${x},0 ${x - 60},${height * 1.2} ${x + 60},${height * 1.2}`}
              fill={i % 2 ? COLORS.pink : COLORS.neonRed}
              transform={`rotate(${a} ${x} 0)`}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// Neon flicker: returns an opacity driven by an explicit on/off pattern.
// Pattern frames: flicker twice then stay on.
export const useNeonFlicker = (start = 0) => {
  const f = useCurrentFrame() - start;
  if (f < 0) return 0;
  const offs = [
    [3, 6],
    [9, 11],
  ];
  return offs.some(([a, b]) => f >= a && f < b) ? 0.15 : 1;
};

export const NeonFlicker: React.FC<{start?: number; color?: string}> = ({start = 0, color = COLORS.neonRed}) => {
  const o = useNeonFlicker(start);
  return <AbsoluteFill style={{background: color, opacity: 0.18 * o, mixBlendMode: 'screen'}} />;
};

// Glow pulse (radial) at a point, e.g. the moon or the dawn sun.
export const Glow: React.FC<{x: number; y: number; r: number; color: string; opacity: number}> = ({x, y, r, color, opacity}) => (
  <AbsoluteFill style={{background: `radial-gradient(circle at ${x}px ${y}px, ${color} 0, transparent ${r}px)`, opacity, mixBlendMode: 'screen'}} />
);
