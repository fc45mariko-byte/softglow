import {getStaticFiles, staticFile} from 'remotion';

// Files present in public/ at bundle time. Anything missing (not downloaded
// yet) renders as a placeholder instead of failing the render.
const present = new Set(getStaticFiles().map((f) => f.name));

export const has = (path: string) => present.has(path);
export const src = (path: string) => staticFile(path);

// Keyframes may be the CDN PNG (fetch_assets.py) or a committed JPEG copy.
export const shotPath = (n: number) => {
  const base = `assets/shots/shot${String(n).padStart(2, '0')}`;
  return has(`${base}.jpg`) ? `${base}.jpg` : `${base}.png`;
};
export const fgPath = (n: number) => `assets/layers/shot${String(n).padStart(2, '0')}_fg.png`;

export const COLORS = {
  ink: '#0b0b0b',
  red: '#b3121d',
  cream: '#f2e8d5',
  sage: '#8fa38a',
  pink: '#ff3d8b',
  neonRed: '#ff1f3d',
};
