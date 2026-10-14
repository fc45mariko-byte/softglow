"""Cut Scene 1 storyboard pages (3x2 grid, labels under panels) into clean panels.

usage: python crop_scene1.py storyboards/scene1_p1.png ... -> panels/scene1/p{page}_{n}.png + panels/scene1/contact.png
Grid is detected from the image: panel interiors are "ink-dense", gutters/labels/header are mostly bare paper.
"""
import sys, os, re
import numpy as np
from PIL import Image, ImageDraw

OUT = "panels/scene1/"
INSET = 6  # extra trim inside the detected black border


def runs(mask, min_len):
    """[start, end) runs of True in a 1-D bool array, at least min_len long."""
    out, s = [], None
    for i, v in enumerate(list(mask) + [False]):
        if v and s is None:
            s = i
        elif not v and s is not None:
            if i - s >= min_len:
                out.append((s, i))
            s = None
    return out


def paper_mask(a):
    """True where the pixel is bare paper (bright, low saturation)."""
    mx, mn = a.max(2), a.min(2)
    return (mx > 0.70 * 255) & ((mx - mn) < 0.22 * 255)


def best_k(profile, k, min_len):
    """Find exactly k ink-dense runs by raising the threshold until k runs exist (largest k kept)."""
    for thr in np.linspace(0.35, 0.9, 23):
        r = runs(profile > thr, min_len)
        if len(r) >= k:
            r = sorted(r, key=lambda ab: ab[1] - ab[0], reverse=True)[:k]
            return sorted(r)
    raise RuntimeError(f"could not find {k} panel runs")


def gaps_to_bounds(rs, total):
    """Turn k ink runs into k [lo, hi) slots split at the middle of each gutter."""
    cuts = [0] + [(rs[i][1] + rs[i + 1][0]) // 2 for i in range(len(rs) - 1)] + [total]
    return list(zip(cuts[:-1], cuts[1:]))


def first_line(prof, maxw, thr=0.6):
    """Index just past the first border-dark run (scanning from index 0), capped at maxw px so dark art
    touching the border is not swallowed; None if no border found."""
    for i, v in enumerate(prof):
        if v > thr:
            j = i
            while j < len(prof) and prof[j] > thr and j - i < maxw:
                j += 1
            return j
    return None


def tighten(dark, x0, x1, y0, y1):
    """Within the slot, scan inward from each side to the black panel border, then step inside it."""
    sub = dark[y0:y1, x0:x1]
    cols, rows = sub.mean(0), sub.mean(1)
    mw = max(3, dark.shape[1] // 300)  # thin border: ~9 px on a 2752 px page
    l, r = first_line(cols, mw), first_line(cols[::-1], mw)
    t, b = first_line(rows, mw), first_line(rows[::-1], mw)
    return (x0 + (l or 0) + INSET, x1 - (r or 0) - INSET, y0 + (t or 0) + INSET, y1 - (b or 0) - INSET)


def cut(path):
    page = int(re.search(r"p(\d)", os.path.basename(path)).group(1))
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.int16)
    H, W = a.shape[:2]
    content = ~paper_mask(a)
    dark = a.max(2) < 70

    # columns: average over full height; panel columns are dense, gutters are paper
    cols = gaps_to_bounds(best_k(content.mean(0) / max(content.mean(0).max(), 1e-6), 3, W // 8), W)
    boxes = []
    for x0, x1 in cols:
        band = content[:, x0:x1].mean(1)
        for y0, y1 in gaps_to_bounds(best_k(band / max(band.max(), 1e-6), 2, H // 6), H):
            boxes.append((x0, x1, y0, y1))
    # reading order: row-major (top row left->right, then bottom row)
    boxes.sort(key=lambda b: (round(b[2] / (H / 3)), b[0]))
    crops = []
    for n, (x0, x1, y0, y1) in enumerate(boxes, 1):
        X0, X1, Y0, Y1 = tighten(dark, x0, x1, y0, y1)
        c = im.crop((X0, Y0, X1, Y1))
        name = f"{OUT}p{page}_{n}.png"
        c.save(name)
        crops.append(c)
        print(name, (X0, Y0, X1, Y1), c.size)
    return page, im, crops


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    sheet_rows = []
    for p in sys.argv[1:]:
        sheet_rows.append(cut(p))
    # contact sheet: one row per page, 6 thumbs
    tw, th = 300, 190
    sheet = Image.new("RGB", (6 * (tw + 8) + 8, len(sheet_rows) * (th + 8) + 8), (40, 40, 40))
    for r, (page, _, crops) in enumerate(sheet_rows):
        for c, im in enumerate(crops):
            t = im.copy(); t.thumbnail((tw, th))
            sheet.paste(t, (8 + c * (tw + 8), 8 + r * (th + 8)))
    sheet.save(OUT + "contact.png")
