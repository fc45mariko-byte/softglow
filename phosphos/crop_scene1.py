"""Cut Scene 1 storyboard pages into clean panels (no border, no labels).

usage: python crop_scene1.py storyboards/scene1_p1.png ... -> panels/scene1/p{page}_{n}.png + panels/scene1/contact.png
Panels are found as large connected blocks of non-paper pixels (works for irregular layouts, e.g. page 1's tall
first panel), ordered in reading order, snapped inside their black border, and stripped of label boxes drawn inside
the panel's top-left corner (page 1 shot labels, page 3 numbers). Labels outside panels sit on bare paper and drop out.
"""
import sys, os, re
import numpy as np
from PIL import Image
from scipy import ndimage

OUT = "panels/scene1/"
INSET = 4        # trim just inside the black border
SKIP = {(1, 5)}  # page 1, block 5 (bottom-left): duplicate of panel 3, mislabelled "4. MEDIUM — DEMETRIA"


def paper(a):
    mx, mn = a.max(2), a.min(2)
    return (mx > 200) & ((mx - mn) < 60)


def blocks(a):
    """Bounding boxes of big non-paper blocks, reading order."""
    H, W = a.shape[:2]
    m = ndimage.binary_opening(~paper(a), iterations=3)  # drop thin text strokes
    m = ndimage.binary_fill_holes(m)
    lab, _ = ndimage.label(m)
    boxes = []
    for sl in ndimage.find_objects(lab):
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        if (x1 - x0) > W * 0.1 and (y1 - y0) > H * 0.1:
            boxes.append((x0, y0, x1, y1))
    boxes.sort(key=lambda b: (int(b[1] // (H / 6)), b[0]))
    return boxes


def snap(dark, x0, y0, x1, y1):
    """Move each edge inward past the black border line (border capped at 12 px)."""
    sub = dark[y0:y1, x0:x1]
    cols, rows = sub.mean(0), sub.mean(1)
    def past(prof):
        for i in range(min(25, len(prof))):
            if prof[i] > 0.5:
                j = i
                while j < len(prof) and prof[j] > 0.5 and j - i < 12:
                    j += 1
                return j
        return 0
    return x0 + past(cols), y0 + past(rows), x1 - past(cols[::-1]), y1 - past(rows[::-1])


def label_box(a):
    """Height of a cream label box in the panel's top-left corner, or 0."""
    p = (a.max(2) > 245) & (a.min(2) > 160)  # label fill: pale cream, lighter than any panel wash
    if p[6:30, 6:50].mean() < 0.5:
        return 0
    hh = 6
    while hh < a.shape[0] // 4 and p[hh, 6:40].mean() > 0.25:
        hh += 1
    return hh


def cut(path):
    page = int(re.search(r"p(\d)", os.path.basename(path)).group(1))
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.int16)
    dark = a.max(2) < 80
    crops, n = [], 0
    for k, (x0, y0, x1, y1) in enumerate(blocks(a), 1):
        if (page, k) in SKIP:
            print(f"page {page} block {k} {(x0, y0, x1, y1)}: skipped (duplicate)")
            continue
        n += 1
        X0, Y0, X1, Y1 = snap(dark, x0, y0, x1, y1)
        X0, Y0, X1, Y1 = X0 + INSET, Y0 + INSET, X1 - INSET, Y1 - INSET
        hh = label_box(a[Y0:Y1, X0:X1])
        if hh:
            Y0 += hh + 8  # drop the strip holding the label box
        c = im.crop((X0, Y0, X1, Y1))
        name = f"{OUT}p{page}_{n}.png"
        c.save(name)
        crops.append(c)
        print(name, (X0, Y0, X1, Y1), c.size, f"label strip {hh}px" if hh else "")
    return page, crops


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    rows = [cut(p) for p in sys.argv[1:]]
    tw, th = 300, 190
    sheet = Image.new("RGB", (6 * (tw + 8) + 8, len(rows) * (th + 8) + 8), (40, 40, 40))
    for r, (_, crops) in enumerate(rows):
        for c, im in enumerate(crops):
            t = im.copy(); t.thumbnail((tw, th))
            sheet.paste(t, (8 + c * (tw + 8), 8 + r * (th + 8)))
    sheet.save(OUT + "contact.png")
