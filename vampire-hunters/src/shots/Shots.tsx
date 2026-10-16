import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, fgPath, has, shotPath} from '../assets';
import {FadeIn, HitStop, KenBurns, Shake, WhipIn} from '../fx/camera';
import {Cutout, Parallax, Plate} from '../fx/layers';
import {BeatPulse, Flash, Glow, LightBeams, NeonFlicker, Particles, SlashArc, SpeedLines, Strobe, useNeonFlicker} from '../fx/overlays';
import {Bats, DissolveMask, FlyingDagger, MoonBackdrop} from '../fx/special';

export type ShotProps = {dur: number; beats: number[]};

const label = (n: number) => `SHOT ${String(n).padStart(2, '0')} · keyframe pending`;
const at = (dur: number, frac: number) => Math.round(dur * frac);

// 1 · Red moon: slow push-in, bats drift across, moon glow pulses once.
export const Shot01: React.FC<ShotProps> = ({dur}) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame, [at(dur, 0.35), at(dur, 0.55), at(dur, 0.8)], [0, 0.45, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <KenBurns from={1} to={1.08}>
      <Plate path={shotPath(1)} label={label(1)} />
      <Glow x={550} y={440} r={560} color={COLORS.red} opacity={pulse} />
      <Bats count={4} />
    </KenBurns>
  );
};

// 2 · Vampire on the rooftop: tilt up feet -> eyes, coat sways, eye glint.
export const Shot02: React.FC<ShotProps> = ({dur}) => {
  const frame = useCurrentFrame();
  const glintAt = at(dur, 0.6); // ~0:07 within 0:04-0:09
  const glint = interpolate(frame, [glintAt, glintAt + 3, glintAt + 10], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <KenBurns from={1.18} to={1.18} y={[-150, 150]}>
      <Parallax
        bg={shotPath(2)}
        fg={fgPath(2)}
        label={label(2)}
        amount={0.012}
        fgStyle={(f) => ({transformOrigin: '50% 0%', transform: `skewX(${Math.sin(f / 9) * 1.2}deg)`})}
      />
      <Glow x={392} y={300} r={90} color={COLORS.neonRed} opacity={glint} />
    </KenBurns>
  );
};

// 3 · Boots land: 4-frame shake, dust burst, slight zoom-out.
export const Shot03: React.FC<ShotProps> = () => (
  <Shake at={0} duration={4} intensity={26} seed="boots">
    <KenBurns from={1.07} to={1}>
      <Parallax bg={shotPath(3)} fg={fgPath(3)} label={label(3)} amount={0.01} />
    </KenBurns>
    <Particles kind="dust" count={50} origin={{x: 270, y: 1570}} seed="bootdustL" />
    <Particles kind="dust" count={50} origin={{x: 800, y: 1520}} seed="bootdustR" />
  </Shake>
);

// 4 · Cara aims: push-in on her eye, red glint sweeps the goggles, hair sways.
export const Shot04: React.FC<ShotProps> = ({dur}) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [at(dur, 0.3), at(dur, 0.55)], [560, 820], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <KenBurns from={1} to={1.14} x={[0, -17]} y={[0, 84]}>
      <Parallax bg={shotPath(4)} fg={fgPath(4)} label={label(4)} amount={0.015} fgStyle={(f) => ({transform: `rotate(${Math.sin(f / 14) * 0.4}deg)`})} />
      <AbsoluteFill style={{mixBlendMode: 'screen'}}>
        <svg width={1080} height={1920}>
          <polygon points={`${sweep},280 ${sweep + 50},280 ${sweep - 40},440 ${sweep - 90},440`} fill={COLORS.cream} opacity={0.6} />
        </svg>
      </AbsoluteFill>
    </KenBurns>
  );
};

// 5 · Bolt impact: 2 frames red flash, hit-stop 4 frames, shake, speed lines.
export const Shot05: React.FC<ShotProps> = ({dur}) => (
  <>
    <HitStop at={2} frames={4}>
      <Shake at={6} duration={10} intensity={22} seed="bolt">
        <KenBurns from={1.04} to={1.1}>
          <Parallax bg={shotPath(5)} fg={fgPath(5)} label={label(5)} amount={0.01} />
        </KenBurns>
      </Shake>
    </HitStop>
    <SpeedLines cx={545} cy={415} from={2} to={dur - 20} seed="bolt" />
    <Flash at={0} hold={2} fade={2} />
  </>
);

// 6 · Tara throws: daggers fly toward camera and exit, speed lines.
export const Shot06: React.FC<ShotProps> = ({dur}) => (
  <>
    <KenBurns from={1} to={1.05}>
      <Parallax bg={shotPath(6)} fg={fgPath(6)} label={label(6)} amount={0.02} />
    </KenBurns>
    <SpeedLines cx={540} cy={900} from={at(dur, 0.12)} to={at(dur, 0.55)} count={36} seed="dag" />
    <FlyingDagger from={at(dur, 0.12)} frames={18} startX={170} startY={1240} endX={-260} endY={1900} spin={900} />
    <FlyingDagger from={at(dur, 0.18)} frames={18} startX={700} startY={1080} endX={1350} endY={1700} spin={-800} />
  </>
);

// 7 · Luca slashes: whip-pan in (6 frames), slash arc draw-on, white flash.
export const Shot07: React.FC<ShotProps> = () => (
  <>
    <WhipIn frames={6}>
      <KenBurns from={1.02} to={1.08}>
        <Parallax bg={shotPath(7)} fg={fgPath(7)} label={label(7)} amount={0.02} dir={-1} />
      </KenBurns>
    </WhipIn>
    <SlashArc at={8} frames={5} d="M 60 1800 Q 1110 1330 870 480" width={22} />
    <Flash at={13} color="#fff" hold={1} fade={5} max={0.8} />
  </>
);

// 8 · Luna's stake: slow push-in, hit-stop at impact, red radial burst, shake.
export const Shot08: React.FC<ShotProps> = ({dur}) => {
  const frame = useCurrentFrame();
  const hit = at(dur, 0.4);
  const burst = interpolate(frame, [hit, hit + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <>
      <HitStop at={hit} frames={4}>
        <Shake at={hit + 4} duration={12} intensity={24} seed="stake">
          <KenBurns from={1} to={1.1}>
            <Parallax bg={shotPath(8)} fg={fgPath(8)} label={label(8)} amount={0.015} />
          </KenBurns>
        </Shake>
      </HitStop>
      {frame >= hit && burst < 1 && (
        <AbsoluteFill style={{opacity: 1 - burst}}>
          <svg width={1080} height={1920}>
            {Array.from({length: 14}, (_, i) => {
              const a = (i / 14) * Math.PI * 2;
              const r1 = 60 + burst * 300;
              const r2 = 160 + burst * 900;
              const cx = 425;
              const cy = 1160;
              return (
                <polygon
                  key={i}
                  points={`${cx + Math.cos(a - 0.08) * r1},${cy + Math.sin(a - 0.08) * r1} ${cx + Math.cos(a) * r2},${cy + Math.sin(a) * r2} ${cx + Math.cos(a + 0.08) * r1},${cy + Math.sin(a + 0.08) * r1}`}
                  fill={COLORS.red}
                />
              );
            })}
          </svg>
        </AbsoluteFill>
      )}
      <Flash at={0} hold={2} fade={2} />
    </>
  );
};

// 9 · Ash: top-to-bottom particle dissolve, ash drifts upward.
export const Shot09: React.FC<ShotProps> = ({dur}) => (
  <>
    <MoonBackdrop moonY={520} />
    <DissolveMask from={at(dur, 0.1)} to={at(dur, 0.85)}>
      <Plate path={shotPath(9)} label={label(9)} />
    </DissolveMask>
    <Particles kind="ash" count={40} seed="ash9" speed={1.4} />
  </>
);

// 10 · Group pose: slow pan left -> right, foreground ash, 3 parallax layers.
export const Shot10: React.FC<ShotProps> = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const pan = interpolate(frame, [0, durationInFrames], [80, -80]);
  return (
    <AbsoluteFill style={{transform: `scale(1.16) translateX(${pan}px)`}}>
      <Parallax bg={shotPath(10)} fg={fgPath(10)} label={label(10)} amount={0.03} />
      <AbsoluteFill style={{transform: `translateX(${pan * 0.8}px)`}}>
        <Particles kind="ash" count={50} seed="ash10" speed={-0.6} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 11 · Bar door: neon flickers twice then stays on, slow push to the door.
export const Shot11: React.FC<ShotProps> = () => {
  const neon = useNeonFlicker(0);
  return (
    <KenBurns from={1} to={1.07} y={[0, -30]}>
      <AbsoluteFill style={{filter: `brightness(${0.7 + 0.3 * neon})`}}>
        <Parallax bg={shotPath(11)} fg={fgPath(11)} label={label(11)} tint={COLORS.neonRed} amount={0.012} />
      </AbsoluteFill>
      <NeonFlicker start={0} />
    </KenBurns>
  );
};

// 12 · Beers clink: bottle layer pushes in, foam burst + flash on the clink.
export const Shot12: React.FC<ShotProps> = ({dur}) => {
  const clink = at(dur, 0.5);
  return (
    <>
      <Plate path={shotPath(12)} label={label(12)} tint={COLORS.pink} style={{transform: 'scale(1.08)', filter: has(fgPath(12)) ? 'blur(2px)' : undefined}} />
      <KenBurns from={1} to={1.12}>
        <Cutout path={fgPath(12)} />
      </KenBurns>
      <Particles kind="foam" count={70} origin={{x: 620, y: 520}} from={clink} seed="foam" />
      <Flash at={clink} color="#fff" hold={1} fade={4} max={0.6} />
    </>
  );
};

// 13 · Vodka shots: slow zoom-out, glasses rise, neon glow pulses on beats.
export const Shot13: React.FC<ShotProps> = ({beats}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const rise = interpolate(frame, [0, durationInFrames], [20, -30]);
  const last = [...beats].reverse().find((b) => b <= frame);
  const glow = last === undefined ? 0 : interpolate(frame - last, [0, 8], [0.25, 0], {extrapolateRight: 'clamp'});
  return (
    <KenBurns from={1.1} to={1}>
      <Parallax bg={shotPath(13)} fg={fgPath(13)} label={label(13)} tint={COLORS.pink} amount={0.01} fgStyle={() => ({transform: `translateY(${rise}px)`})} />
      <AbsoluteFill style={{background: COLORS.neonRed, opacity: glow, mixBlendMode: 'screen'}} />
    </KenBurns>
  );
};

// 14 · Dance floor: strobe on beats, zoom pulse, sweeping light beams.
export const Shot14: React.FC<ShotProps> = ({beats}) => (
  <>
    <BeatPulse beats={beats}>
      <Plate path={shotPath(14)} label={label(14)} tint={COLORS.pink} />
    </BeatPulse>
    <LightBeams />
    <Strobe beats={beats} />
  </>
);

// 15 · Sofa: slow drift right, parallax between table and sofa.
export const Shot15: React.FC<ShotProps> = () => (
  <KenBurns from={1.06} to={1.06} x={[-30, 30]}>
    <Parallax bg={shotPath(15)} fg={fgPath(15)} label={label(15)} tint={COLORS.red} amount={0.03} />
  </KenBurns>
);

// 16 · Dawn + title: slow push-in, sun glow grows, title card from 1:11.
export const Shot16: React.FC<ShotProps & {titleAt: number; blackAt: number}> = ({titleAt, blackAt}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const sun = interpolate(frame, [0, durationInFrames], [0.1, 0.55]);
  const title = interpolate(frame, [titleAt, titleAt + 15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (frame >= blackAt) return <AbsoluteFill style={{background: '#000'}} />;
  return (
    <>
      <KenBurns from={1} to={1.08}>
        <Parallax bg={shotPath(16)} fg={fgPath(16)} label={label(16)} tint={COLORS.cream} amount={0.008} />
        <Glow x={560} y={650} r={520} color="#fff4dc" opacity={sun} />
      </KenBurns>
      {title > 0 && (
        <AbsoluteFill style={{background: COLORS.ink, opacity: title, alignItems: 'center', justifyContent: 'center'}}>
          <div
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 600,
              fontSize: 150,
              lineHeight: 0.95,
              letterSpacing: 6,
              color: COLORS.cream,
              textAlign: 'center',
            }}
          >
            VAMPIRE
            <br />
            HUNTERS
          </div>
          <div style={{width: 520, height: 14, background: COLORS.red, marginTop: 34}} />
        </AbsoluteFill>
      )}
    </>
  );
};

export {FadeIn};
