import '@fontsource/barlow-condensed/600.css';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLORS} from './assets';

export type Sub = {from: number; to: number; text: string; speaker: string};

// Burned-in French subtitles: Barlow Condensed SemiBold 54px, cream with a
// 3px black outline, centred, 300px above the bottom edge, red speaker bar.
export const Subtitles: React.FC<{subs: Sub[]}> = ({subs}) => {
  const frame = useCurrentFrame();
  const sub = subs.find((s) => frame >= s.from && frame < s.to);
  if (!sub) return null;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 300}}>
      <div style={{display: 'flex', alignItems: 'stretch', gap: 18, maxWidth: 1080 - 2 * 64}}>
        <div style={{width: 6, background: COLORS.red, flexShrink: 0}} />
        <div
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 600,
            fontSize: 54,
            lineHeight: 1.15,
            color: COLORS.cream,
            WebkitTextStroke: '6px #000',
            paintOrder: 'stroke fill',
            textAlign: 'center',
            whiteSpace: 'pre',
          }}
        >
          {sub.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
