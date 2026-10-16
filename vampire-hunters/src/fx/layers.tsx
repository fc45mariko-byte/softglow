import {AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, has, src} from '../assets';

const cover: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover'};

// Full-frame keyframe, or a flat labelled placeholder if not downloaded yet.
export const Plate: React.FC<{path: string; label: string; tint?: string; style?: React.CSSProperties}> = ({path, label, tint = COLORS.red, style}) => {
  if (has(path)) {
    return (
      <AbsoluteFill style={style}>
        <Img src={src(path)} style={cover} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{...style, background: COLORS.ink, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 640, height: 640, borderRadius: '50%', background: tint, opacity: 0.85}} />
      <div
        style={{
          position: 'absolute',
          top: 220,
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 600,
          fontSize: 48,
          color: COLORS.cream,
          letterSpacing: 4,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};

// Cutout foreground layer (transparent PNG); renders nothing if missing.
export const Cutout: React.FC<{path: string; style?: React.CSSProperties}> = ({path, style}) =>
  has(path) ? (
    <AbsoluteFill style={style}>
      <Img src={src(path)} style={cover} />
    </AbsoluteFill>
  ) : null;

// Background = full keyframe scaled 108% + 2px blur; foreground cutout on top.
// Layers drift by different amounts; offsets stay within 3% of width so the
// subject duplicated in the background never shows.
export const Parallax: React.FC<{
  bg: string;
  fg: string;
  label: string;
  tint?: string;
  dir?: 1 | -1;
  amount?: number; // fraction of width, max 0.03
  fgStyle?: (frame: number) => React.CSSProperties;
}> = ({bg, fg, label, tint, dir = 1, amount = 0.03, fgStyle}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, width} = useVideoConfig();
  const max = Math.min(amount, 0.03) * width;
  const t = interpolate(frame, [0, durationInFrames - 1], [-0.5, 0.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fgOn = has(fg);
  return (
    <AbsoluteFill>
      <Plate
        path={bg}
        label={label}
        tint={tint}
        style={{
          transform: `translateX(${-t * max * 0.4 * dir}px) scale(${fgOn ? 1.08 : 1})`,
          filter: fgOn ? 'blur(2px)' : undefined,
        }}
      />
      <Cutout path={fg} style={{transform: `translateX(${t * max * dir}px)`, ...(fgStyle?.(frame) ?? {})}} />
    </AbsoluteFill>
  );
};
