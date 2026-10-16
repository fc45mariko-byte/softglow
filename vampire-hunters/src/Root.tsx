import {Composition} from 'remotion';
import {VampireHunters} from './VampireHunters';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="VampireHunters"
    component={VampireHunters}
    durationInFrames={2250}
    fps={30}
    width={1080}
    height={1920}
  />
);
