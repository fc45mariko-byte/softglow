"""Phosphos animatic test: camera moves, rain, flicker, grain, crossfades -> MP4."""
import subprocess, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1280, 720, 24
P = "panels/"
rng = np.random.default_rng(7)
random.seed(7)

def load(name, up=2):
    im = Image.open(P + name).convert("RGB")
    return im.resize((im.width * up, im.height * up), Image.LANCZOS)

def ease(t):
    return 0.5 - 0.5 * math.cos(math.pi * max(0, min(1, t)))

def view(src, cx, cy, zoom):
    """Crop a W:H window centred at (cx,cy) in src-fraction coords; zoom = window height / src height."""
    sw, sh = src.size
    h = sh * zoom
    w = h * W / H
    if w > sw:  # keep inside horizontally
        w = sw; h = w * H / W
    x0 = min(max(cx * sw - w / 2, 0), sw - w)
    y0 = min(max(cy * sh - h / 2, 0), sh - h)
    s = w / W
    return src.transform((W, H), Image.AFFINE, (s, 0, x0, 0, s, y0), Image.BICUBIC)

def portrait_frame(src, t, push=(1.0, 1.12), focus=0.38):
    """Portrait panel on a blurred, darkened extension of itself, slow push-in."""
    tone = np.asarray(src.resize((1, 1), Image.BOX)).reshape(3).astype(np.float32) * 0.55
    bg = Image.fromarray(np.broadcast_to(tone, (H, W, 3)).astype(np.uint8))
    z = push[0] + (push[1] - push[0]) * ease(t)
    ph = int(H * 0.96 * z)
    pw = int(ph * src.width / src.height)
    fg = src.resize((pw, ph), Image.BICUBIC)
    ox = (W - pw) // 2
    oy = int((H - ph) * focus * 2) if ph > H else (H - ph) // 2
    bg.paste(fg, (ox, oy))
    return bg

class Rain:
    def __init__(s, n=380):
        s.p = np.c_[rng.uniform(-200, W, n), rng.uniform(-H, H, n), rng.uniform(18, 34, n), rng.uniform(0.25, 1, n)]
    def draw(s, img, strength=1.0):
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        for i, (x, y, v, a) in enumerate(s.p):
            L = v * 1.1
            d.line([(x, y), (x + L * 0.22, y + L)], fill=(225, 230, 210, int(70 * a * strength)), width=1)
            s.p[i, 0] += v * 0.22; s.p[i, 1] += v
            if s.p[i, 1] > H:
                s.p[i, 0] = rng.uniform(-200, W); s.p[i, 1] = rng.uniform(-60, 0)
        return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")

GRAIN = [rng.normal(0, 7, (H, W, 1)).astype(np.float32) for _ in range(6)]
yy, xx = np.mgrid[0:H, 0:W]
VIG = (1 - 0.42 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) ** 1.2).clip(0.35, 1)[..., None].astype(np.float32)

def finish(img, f, flicker=0.0, warm_mask=None):
    a = np.asarray(img).astype(np.float32)
    if flicker:
        k = 1 + flicker * (0.6 * math.sin(f * 0.9) + 0.4 * math.sin(f * 2.3 + 1) + rng.normal(0, 0.35))
        if warm_mask is not None:
            a = a * (1 + (k - 1) * warm_mask)
        else:
            a = a * k
    a = a * VIG + GRAIN[f % len(GRAIN)]
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))

def right_glow_mask():
    m = np.clip((xx - W * 0.55) / (W * 0.45), 0, 1) * np.clip(1 - abs(yy - H * 0.5) / (H * 0.6), 0, 1)
    return m[..., None].astype(np.float32)

# ---------- shots ----------
city, ashoka, deme, two = load("city.png"), load("ashoka.png", 3), load("demetria.png", 3), load("twoshot.png")
rain = Rain()
glow = right_glow_mask()

def shot_city(f, n):
    t = ease(f / n)
    img = view(city, 0.18 + 0.64 * t, 0.5, 1.0 - 0.06 * t)
    img = rain.draw(img, 1.0)
    return finish(img, f, flicker=0.05, warm_mask=glow * (t))

def shot_ashoka(f, n):
    return finish(rain.draw(portrait_frame(ashoka, f / n, focus=0.0), 0.35), f, flicker=0.03)

def shot_deme(f, n):
    return finish(rain.draw(portrait_frame(deme, f / n, focus=0.0), 0.35), f, flicker=0.03)

def shot_two(f, n):
    t = ease(f / n)
    img = view(two, 0.5, 0.45, 0.98 - 0.22 * t)
    return finish(rain.draw(img, 0.5), f, flicker=0.04)

FONT = None
for fp in ["/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"]:
    try:
        FONT = ImageFont.truetype(fp, 54); SUB = ImageFont.truetype(fp, 22); break
    except OSError:
        pass

def shot_title(f, n):
    img = Image.new("RGB", (W, H), (8, 8, 6))
    a = min(1, f / (n * 0.35)) * min(1, (n - f) / (n * 0.25))
    d = ImageDraw.Draw(img)
    c = tuple(int(v * a) for v in (214, 186, 112))
    c2 = tuple(int(v * a) for v in (150, 140, 110))
    d.text((W / 2, H / 2 - 14), "P H O S P H O S", font=FONT, fill=c, anchor="mm")
    d.text((W / 2, H / 2 + 44), "Two thousand years together. Neither remembers the beginning.", font=SUB, fill=c2, anchor="mm")
    return finish(img, f)

SHOTS = [(shot_city, 7.0), (shot_ashoka, 3.6), (shot_deme, 3.6), (shot_two, 5.0), (shot_title, 4.0)]
XF = int(0.7 * FPS)

ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                       "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", "-movflags", "+faststart", "renders/animatic_test_full.mp4"], stdin=subprocess.PIPE)

prev_tail = []
gf = 0
for i, (fn, dur) in enumerate(SHOTS):
    n = int(dur * FPS)
    frames_iter = range(n)
    for f in frames_iter:
        fr = fn(f, n)
        if f < len(prev_tail):  # crossfade with previous shot's tail
            fr = Image.blend(prev_tail[f], fr, (f + 1) / (len(prev_tail) + 1))
        if f >= n - XF and i < len(SHOTS) - 1:
            prev_tail.append(fr) if f > n - XF else None
            if f == n - XF:
                prev_tail = [fr]
            continue
        ff.stdin.write(fr.tobytes()); gf += 1
    if i == len(SHOTS) - 1:
        prev_tail = []
ff.stdin.close(); ff.wait()
print("frames", gf, "seconds", gf / FPS)
