"""Phosphos Scene 1 animatic: 24 storyboard panels in script order, camera moves, rain, lantern flicker,
earring glint, crossfades, subtitles, title card -> renders/scene1_animatic.mp4

usage:
  python render_scene1.py                 full render (master + compressed final)
  python render_scene1.py --samples       write sample stills to renders/samples/ only
"""
import subprocess, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1280, 720, 24
P = "panels/scene1/"
XF = int(0.7 * FPS)  # crossfade length in frames
rng = np.random.default_rng(7)


def ease(t):
    return 0.5 - 0.5 * math.cos(math.pi * max(0, min(1, t)))


def load(name):
    im = Image.open(P + name).convert("RGB")
    up = max(2, math.ceil(2 * H / im.height))  # headroom for push-ins
    return im.resize((im.width * up, im.height * up), Image.LANCZOS)


def window(src, cx, cy, zoom):
    """W:H window (x0, y0, w, h) centred at (cx,cy) in src fractions; zoom 1 = largest W:H window that fits."""
    sw, sh = src.size
    w = min(sw, sh * W / H) * zoom
    h = w * H / W
    x0 = min(max(cx * sw - w / 2, 0), sw - w)
    y0 = min(max(cy * sh - h / 2, 0), sh - h)
    return x0, y0, w, h


def view(src, cx, cy, zoom, resample=Image.BICUBIC):
    x0, y0, w, h = window(src, cx, cy, zoom)
    s = w / W
    return src.transform((W, H), Image.AFFINE, (s, 0, x0, 0, s, y0), resample)


# ---------- camera moves: (cx0, cy0, z0) -> (cx1, cy1, z1) ----------
def push(cx=0.5, cy=0.45, a=1.0, b=0.82):
    return ((cx, cy, a), (cx, cy, b))

def pull(cx=0.5, cy=0.45, a=0.8, b=1.0):
    return ((cx, cy, a), (cx, cy, b))

def pan(x0, x1, cy=0.5, z=0.85):
    return ((x0, cy, z), (x1, cy, z))

def tilt(y0, y1, cx=0.5, z=0.8):
    return ((cx, y0, z), (cx, y1, z))


# ---------- effects ----------
class Rain:
    def __init__(s, n=380):
        s.p = np.c_[rng.uniform(-200, W, n), rng.uniform(-H, H, n), rng.uniform(18, 34, n), rng.uniform(0.25, 1, n)]

    def draw(s, img, strength=1.0):
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        k = max(1, int(len(s.p) * min(1, strength)))
        for i in range(len(s.p)):
            x, y, v, a = s.p[i]
            if i < k:
                L = v * 1.1
                d.line([(x, y), (x + L * 0.22, y + L)], fill=(225, 230, 210, int(70 * a * max(strength, 0.5))), width=1)
            s.p[i, 0] += v * 0.22; s.p[i, 1] += v
            if s.p[i, 1] > H:
                s.p[i, 0] = rng.uniform(-200, W); s.p[i, 1] = rng.uniform(-60, 0)
        return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


GRAIN = [rng.normal(0, 7, (H, W, 1)).astype(np.float32) for _ in range(6)]
yy, xx = np.mgrid[0:H, 0:W]
VIG = (1 - 0.42 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) ** 1.2).clip(0.35, 1)[..., None].astype(np.float32)


def warm_light_mask(src):
    """Where the lamplight is: bright, warm pixels, blurred into pools (L image, src size)."""
    a = np.asarray(src.resize((src.width // 4, src.height // 4), Image.BILINEAR)).astype(np.float32)
    lum = a.mean(2)
    warm = np.clip((a[..., 0] - a[..., 2]) / 80, 0, 1) * np.clip((lum - 120) / 100, 0, 1)
    m = Image.fromarray((warm * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(src.width / 40))
    m = np.asarray(m).astype(np.float32); m = m / max(m.max(), 1) * 255
    return Image.fromarray(m.astype(np.uint8)).resize(src.size, Image.BILINEAR)


def flicker_k(f, amount):
    return 1 + amount * (0.6 * math.sin(f * 0.9) + 0.4 * math.sin(f * 2.3 + 1) + rng.normal(0, 0.35))


def find_red(src):
    """Centroid (fractions) of the red smear on the earring; falls back to brightest gold."""
    a = np.asarray(src).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    red = (r > 90) & (r > 1.6 * g) & (r > 1.6 * b)
    if red.sum() < 20:
        red = (r > 180) & (g > 140) & (b < 0.6 * g)
    ys, xs = np.nonzero(red)
    if len(xs) == 0:
        return 0.5, 0.5
    return float(np.median(xs)) / src.width, float(np.median(ys)) / src.height


def glint(img, pos, t):
    """Red-gold bloom + four-point star at pos (frame px), intensity peaks mid-shot."""
    I = max(0.0, math.sin(math.pi * min(1, max(0, (t - 0.25) / 0.5)))) ** 1.5
    if I <= 0.01:
        return img
    x, y = pos
    a = np.asarray(img).astype(np.float32)
    d2 = (xx - x) ** 2 + (yy - y) ** 2
    bloom = np.exp(-d2 / (2 * 38 ** 2))[..., None] * I
    core = np.exp(-d2 / (2 * 7 ** 2))[..., None] * I
    star = (np.exp(-((yy - y) ** 2) / 4) * np.exp(-abs(xx - x) / 70) +
            np.exp(-((xx - x) ** 2) / 4) * np.exp(-abs(yy - y) / 55))[..., None] * I
    a = a + bloom * np.array([150, 20, 15]) + core * np.array([255, 200, 170]) + star * np.array([220, 120, 90])
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


def finish(img, f, flicker=0.0, mask=None):
    a = np.asarray(img).astype(np.float32)
    if flicker:
        k = flicker_k(f, flicker)
        if mask is not None:
            m = np.asarray(mask).astype(np.float32)[..., None] / 255
            a = a * (1 + (k - 1) * (0.35 + 0.65 * m))
        else:
            a = a * k
    a = a * VIG + GRAIN[f % len(GRAIN)]
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


# ---------- subtitles ----------
def font(paths, size):
    for fp in paths:
        try:
            return ImageFont.truetype(fp, size)
        except OSError:
            pass
    return ImageFont.load_default()

SERIF = ["/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"]
SERIF_I = ["/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"]
TITLE, TAG = font(SERIF, 54), font(SERIF, 22)
SUBF, NAMEF = font(SERIF_I, 32), font(SERIF, 17)


def line_dur(text):
    return 1.1 + len(text) / 14.0


def subtitle(img, speaker, text, alpha):
    if alpha <= 0:
        return img
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    a = int(255 * alpha)
    y = H - 74
    d.text((W / 2, y - 30), speaker, font=NAMEF, fill=(214, 186, 112, a), anchor="mm", stroke_width=2, stroke_fill=(0, 0, 0, int(a * 0.8)))
    d.text((W / 2, y), text, font=SUBF, fill=(244, 236, 214, a), anchor="mm", stroke_width=3, stroke_fill=(0, 0, 0, int(a * 0.85)))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


# ---------- shot list (script order) ----------
# (panel, camera, rain strength, flicker, extra, [(speaker, line), ...], min seconds)
A, D, M = "ASHOKA", "DEMETRIA", "MAN"
SHOTS = [
    ("p1_1", tilt(0.0, 1.0, 0.5, 1.0), 1.0, 0.03, None, [], 5.5),             # EXT wide, rain over Phosphos
    ("p1_2", pan(0.12, 0.88, 0.5, 1.0), 0, 0.06, None, [], 4.5),             # INT the salon
    ("p1_3", push(0.4, 0.4, 1.0, 0.82), 0, 0.05, None, [], 4.0),            # Ashoka + merchant
    ("p1_4", push(0.72, 0.4, 1.0, 0.8), 0, 0.05, None,
     [(D, "He’s going to offer her a house."), (A, "He already owns three.")], 3.5),
    ("p1_5", pull(0.5, 0.45, 0.82, 1.0), 0, 0.05, None,
     [(D, "Then she’ll get four."), (A, "You always did have a weakness for optimistic men."),
      (D, "And you always did mistake boredom for intelligence.")], 4.0),
    ("p1_6", push(0.68, 0.4, 1.0, 0.8), 0, 0.05, None,
     [(D, "Do you think he’ll come back?"), (A, "Of course."), (D, "Why?"), (A, "I told him he was a good father.")], 4.0),
    ("p2_1", push(0.5, 0.4, 1.0, 0.86), 0, 0.05, None, [], 3.2),              # Demetria laughs
    ("p2_2", push(0.5, 0.4, 0.98, 0.78), 0, 0.03, None, [], 4.0),             # Ashoka looks; room falls away
    ("p2_3", pan(0.42, 0.58, 0.45, 0.9), 0, 0.05, None, [(D, "How unfortunate.")], 3.5),
    ("p2_4", push(0.5, 0.5, 1.0, 0.85), 0, 0.10, None, [], 4.0),              # private chamber, single lantern
    ("p2_5", push(0.5, 0.35, 1.0, 0.8), 0, 0.10, None, [], 3.2),               # Ashoka closes the door
    ("p2_6", push(0.5, 0.45, 1.0, 0.86), 0, 0.10, None,
     [(D, "Stay. You’ve paid for the evening."), (M, "I thought the evening was going rather well."), (A, "It was.")], 4.0),
    ("p3_1", push(0.35, 0.4, 1.0, 0.8), 0, 0.10, None,
     [(A, "Tell me something. When you came here tonight,"), (A, "what did you think you were buying?"),
      (M, "Your company."), (D, "And what did you think we were selling?")], 4.0),
    ("p3_2", push(0.5, 0.45, 0.95, 0.75), 0, 0.22, None, [], 3.0),            # INSERT the flame
    ("p3_3", push(0.5, 0.55, 0.95, 0.8), 0, 0.10, None, [], 2.6),             # untouched wine
    ("p3_4", pan(0.4, 0.6, 0.5, 0.85), 0, 0.10, None, [], 2.6),               # the sheet
    ("p3_5", push(None, None, 1.0, 0.75), 0, 0.10, "glint", [], 3.4),         # earring catches red
    ("p3_6", pull(0.5, 0.45, 0.85, 1.0), 0.35, 0.03, None, [], 3.8),          # courtyard, later
    ("p4_1", push(0.5, 0.5, 1.0, 0.86), 0.3, 0.03, None,
     [(D, "Do you remember when we first came here?"), (A, "To Phosphos?"), (D, "No. Here.")], 4.0),
    ("p4_2", push(0.35, 0.4, 1.0, 0.82), 0.3, 0.03, None,
     [(A, "We have lived in so many houses."), (D, "That’s not what I asked."), (A, "No.")], 4.0),
    ("p4_3", push(0.68, 0.4, 1.0, 0.84), 0.3, 0.03, None, [], 3.4),            # Demetria waits
    ("p4_4", push(0.5, 0.5, 0.98, 0.8), 0.3, 0.03, None,
     [(A, "Does it matter?"), (D, "I don’t know.")], 3.5),
    ("p4_5", pull(0.5, 0.55, 0.62, 1.0), 0.3, 0.03, None, [], 5.0),           # pulling away
    ("p4_6", pull(0.5, 0.5, 0.75, 1.0), 0.3, 0.02, None, [], 5.5),            # aerial
]
BLACK_SEC, TITLE_SEC = 1.0, 5.0


def plan_shot(spec):
    name, cam, rain_s, flick, extra, lines, min_s = spec
    talk = sum(line_dur(t) for _, t in lines)
    dur = max(min_s, talk + 1.2 + XF / FPS)
    # subtitle timeline (seconds from shot start), centred in the shot's clear part
    t0 = 0.6 + max(0, (dur - XF / FPS - 0.6 - talk) / 2) * 0.5
    cues = []
    for sp, t in lines:
        d = line_dur(t); cues.append((t0, t0 + d, sp, t)); t0 += d
    return dur, cues


class Shot:
    def __init__(s, spec, rain):
        s.name, s.cam, s.rain_s, s.flick, s.extra, s.lines, _ = spec
        s.dur, s.cues = plan_shot(spec)
        s.n = int(round(s.dur * FPS))
        s.src = load(s.name + ".png")
        s.mask_src = warm_light_mask(s.src) if s.flick >= 0.05 else None
        s.rain = rain
        if s.extra == "glint":
            s.gx, s.gy = find_red(s.src)
            (_, _, z0), (_, _, z1) = s.cam
            s.cam = ((s.gx, s.gy, z0), (s.gx, s.gy, z1))

    def frame(s, f, gf):
        t = ease(f / max(1, s.n - 1))
        (x0, y0, z0), (x1, y1, z1) = s.cam
        cx, cy, z = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t
        img = view(s.src, cx, cy, z)
        mask = view(s.mask_src, cx, cy, z, resample=Image.BILINEAR) if s.mask_src is not None else None
        if s.extra == "glint":
            xo, yo, w, h = window(s.src, cx, cy, z)
            sw, sh = s.src.size
            img = glint(img, ((s.gx * sw - xo) / w * W, (s.gy * sh - yo) / h * H), f / s.n)
        if s.rain_s:
            img = s.rain.draw(img, s.rain_s)
        img = finish(img, gf, flicker=s.flick, mask=mask)
        sec = f / FPS
        for a, b, sp, text in s.cues:
            if a <= sec < b:
                fade = min(1, (sec - a) / 0.2, (b - sec) / 0.2)
                img = subtitle(img, sp, text, fade)
        return img


def title_frame(f, n):
    img = Image.new("RGB", (W, H), (8, 8, 6))
    a = min(1, f / (n * 0.3)) * min(1, (n - f) / (n * 0.2))
    d = ImageDraw.Draw(img)
    c = tuple(int(v * a) for v in (214, 186, 112))
    c2 = tuple(int(v * a) for v in (150, 140, 110))
    d.text((W / 2, H / 2 - 14), "P H O S P H O S", font=TITLE, fill=c, anchor="mm")
    d.text((W / 2, H / 2 + 44), "Two thousand years together. Neither remembers the beginning.", font=TAG, fill=c2, anchor="mm")
    return finish(img, f)


def frames(shots):
    """Yield every output frame: shots crossfaded, then cut to black, then title card."""
    tail, gf = [], 0
    for i, s in enumerate(shots):
        last = i == len(shots) - 1
        for f in range(s.n):
            fr = s.frame(f, gf); gf += 1
            if f < len(tail):
                fr = Image.blend(tail[f], fr, (f + 1) / (len(tail) + 1))
            if not last and f >= s.n - XF:
                if f == s.n - XF:
                    tail = []
                tail.append(fr)
                continue
            yield fr
    black = Image.new("RGB", (W, H), (0, 0, 0))
    for _ in range(int(BLACK_SEC * FPS)):
        yield black
    n = int(TITLE_SEC * FPS)
    for f in range(n):
        yield title_frame(f, n)


def samples(shots):
    os.makedirs("renders/samples", exist_ok=True)
    rain = shots[0].rain
    for s in shots:
        f = int(s.n * 0.5)
        s.rain = rain
        for _ in range(12):  # let rain settle in
            if s.rain_s: rain.draw(Image.new("RGB", (W, H)), 0)
        img = s.frame(f, f)
        # show the first cue that is on screen around the middle, otherwise any cue
        if s.cues and not any(a <= f / FPS < b for a, b, _, _ in s.cues):
            a, b, sp, t = s.cues[0]
            img = subtitle(img, sp, t, 1)
        img.save(f"renders/samples/{s.name}.jpg", quality=88)
    title_frame(int(TITLE_SEC * FPS * 0.5), int(TITLE_SEC * FPS)).save("renders/samples/title.jpg", quality=88)
    # contact sheet
    files = [f"renders/samples/{s.name}.jpg" for s in shots] + ["renders/samples/title.jpg"]
    tw, th = 384, 216
    sheet = Image.new("RGB", (5 * tw + 6 * 6, 5 * th + 6 * 6), (20, 20, 20))
    for i, fn in enumerate(files):
        t = Image.open(fn).resize((tw, th), Image.LANCZOS)
        sheet.paste(t, (6 + (i % 5) * (tw + 6), 6 + (i // 5) * (th + 6)))
    sheet.save("renders/samples/contact.jpg", quality=88)
    print("samples ->", "renders/samples/")


if __name__ == "__main__":
    rain = Rain()
    shots = [Shot(sp, rain) for sp in SHOTS]
    total = sum(s.n for s in shots) - XF * (len(shots) - 1) + int((BLACK_SEC + TITLE_SEC) * FPS)
    print(f"{len(shots)} shots, {total} frames, {total / FPS:.1f} s")
    if "--samples" in sys.argv:
        samples(shots); sys.exit()
    os.makedirs("renders", exist_ok=True)
    master = "renders/scene1_animatic_master.mp4"
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16",
                           "-preset", "medium", master], stdin=subprocess.PIPE)
    k = 0
    for fr in frames(shots):
        ff.stdin.write(fr.tobytes()); k += 1
        if k % 240 == 0:
            print(f"  {k}/{total}", flush=True)
    ff.stdin.close(); ff.wait()
    out = "renders/scene1_animatic.mp4"
    crf = 28  # crf 24 and 26 both exceeded 30 MB on this scene
    while True:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", master, "-vf", "hqdn3d=1.5:1.5:4:4",
                        "-c:v", "libx264", "-crf", str(crf), "-preset", "slow", "-pix_fmt", "yuv420p",
                        "-movflags", "+faststart", out], check=True)
        mb = os.path.getsize(out) / 1e6
        print(f"crf {crf}: {mb:.1f} MB")
        if mb < 30 or crf >= 34:
            break
        crf += 2
