import {getStaticFiles, staticFile} from 'remotion';

// Files present in public/ at bundle time. Anything missing (not downloaded
// yet) renders as a placeholder instead of failing the render.
const present = new Set(getStaticFiles().map((f) => f.name));

export const has = (path: string) => present.has(path);
export const src = (path: string) => staticFile(path);

export const shotPath = (n: number) => `assets/shots/shot${String(n).padStart(2, '0')}.png`;
export const fgPath = (n: number) => `assets/layers/shot${String(n).padStart(2, '0')}_fg.png`;

export const COLORS = {
  ink: '#0b0b0b',
  red: '#b3121d',
  cream: '#f2e8d5',
  sage: '#8fa38a',
  pink: '#ff3d8b',
  neonRed: '#ff1f3d',
};
