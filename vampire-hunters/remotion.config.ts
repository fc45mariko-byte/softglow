import fs from 'node:fs';
import {Config} from '@remotion/cli/config';

// Cloud sessions cannot download Remotion's headless Chrome; use the
// preinstalled one when present, otherwise let Remotion fetch its own.
const preinstalled = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (fs.existsSync(preinstalled)) {
  Config.setBrowserExecutable(preinstalled);
}
