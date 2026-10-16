import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../assets';

// Top-to-bottom dissolve of `children` with a ragged edge; ash flakes shed
// from the moving edge and drift upward. `from`/`to` are frames.
export const DissolveMask: React.FC<{from: number; to: number; children: React.ReactNode; seed?: string}> = ({from, to, children, seed = 'dissolve'}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const p = interpolate(frame, [from, to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const edgeY = -0.1 * height + p * 1.2 * height;
  // Ragged edge as an SVG mask polygon (no soft gradient).
  const teeth = 36;
  const pts: string[] = [`0,${height}`, `${width},${height}`];
  for (let i = teeth; i >= 0; i--) {
    const x = (i / teeth) * width;
    const y = edgeY + (random(`${seed}t${i}`) - 0.5) * 90 + Math.sin(frame / 3 + i) * 10;
    pts.push(`${x},${y}`);
  }
  const maskSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'><polygon points='${pts.join(' ')}' fill='white'/></svg>`;
  const mask = `url("data:image/svg+xml;utf8,${encodeURIComponent(maskSvg)}")`;
  const flakes = Array.from({length: 90}, (_, i) => {
    const born = from + random(`${seed}b${i}`) * (to - from);
    const age = frame - born;
    if (age < 0) return null;
    const bornP = (born - from) / (to - from);
    const y0 = -0.1 * height + bornP * 1.2 * height;
    const x = random(`${seed}x${i}`) * width + Math.sin(age / 10 + i) * 24;
    const y = y0 - age * (3 + random(`${seed}v${i}`) * 5);
    const s = 8 + random(`${seed}s${i}`) * 20;
    const o = interpolate(age, [0, 40], [1, 0], {extrapolateRight: 'clamp'});
    return <rect key={i} x={x} y={y} width={s} height={s * 0.6} fill={i % 3 ? COLORS.ink : COLORS.red} opacity={o} transform={`rotate(${age * 7 + i * 31} ${x} ${y})`} />;
  });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{WebkitMaskImage: mask, maskImage: mask}}>{children}</AbsoluteFill>
      <AbsoluteFill>
        <svg width={width} height={height}>{flakes}</svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Flat poster backdrop: ink sky, giant red moon, spire silhouettes.
export const MoonBackdrop: React.FC<{moonY?: number}> = ({moonY = 760}) => {
  const {width, height} = useVideoConfig();
  const spires = [
    [80, 1350, 70],
    [260, 1180, 90],
    [420, 1420, 60],
    [640, 1100, 110],
    [860, 1300, 80],
    [1000, 1450, 60],
  ];
  return (
    <AbsoluteFill style={{background: COLORS.ink}}>
      <svg width={width} height={height}>
        <circle cx={width / 2} cy={moonY} r={430} fill={COLORS.red} />
        {spires.map(([x, top, w], i) => (
          <g key={i} fill={COLORS.ink}>
            <polygon points={`${x - w / 2},${height} ${x - w / 2},${top + 160} ${x},${top} ${x + w / 2},${top + 160} ${x + w / 2},${height}`} />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// Bats crossing the frame (flat ink silhouettes).
export const Bats: React.FC<{count?: number; seed?: string}> = ({count = 7, seed = 'bat'}) => {
  const frame = useCurrentFrame();
  const {width, durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill>
      <svg width={width} height={1920}>
        {Array.from({length: count}, (_, i) => {
          const r = (k: string) => random(`${seed}${k}${i}`);
          const t = frame / durationInFrames;
          const x = -120 + (t * (0.8 + r('v') * 0.6) + r('o') * 0.4) * (width + 240);
          const y = 520 + r('y') * 420 + Math.sin(frame / 6 + i) * 18;
          const s = 0.6 + r('s') * 0.8;
          const flap = Math.sin(frame * 0.9 + i * 2) * 0.6;
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${s})`} fill={COLORS.ink}>
              <ellipse cx={0} cy={0} rx={10} ry={14} />
              <polygon points={`0,0 -70,${-28 * flap - 6} -48,10 -30,4 -18,16`} />
              <polygon points={`0,0 70,${-28 * flap - 6} 48,10 30,4 18,16`} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// A flat dagger shape flying toward camera (scale up + rotate) and out of frame.
export const FlyingDagger: React.FC<{from: number; frames: number; startX: number; startY: number; endX: number; endY: number; spin?: number}> = ({
  from,
  frames,
  startX,
  startY,
  endX,
  endY,
  spin = 720,
}) => {
  const frame = useCurrentFrame();
  const t = (frame - from) / frames;
  if (t < 0 || t > 1) return null;
  const e = t * t;
  const x = startX + (endX - startX) * e;
  const y = startY + (endY - startY) * e;
  const s = 0.4 + e * 5;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <g transform={`translate(${x} ${y}) rotate(${t * spin}) scale(${s})`}>
          <polygon points="0,-90 14,-20 0,-10 -14,-20" fill="#c9c9c4" stroke={COLORS.ink} strokeWidth={4} />
          <rect x={-26} y={-12} width={52} height={10} fill={COLORS.ink} />
          <rect x={-7} y={-2} width={14} height={40} fill={COLORS.ink} />
          <polygon points="0,-24 6,-16 0,-8 -6,-16" fill={COLORS.red} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// Global grade: 2% film grain + light vignette.
export const Grade: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <>
      <AbsoluteFill style={{opacity: 0.02, mixBlendMode: 'overlay'}}>
        <svg width={width} height={height}>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={frame % 97} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)'}} />
    </>
  );
};
