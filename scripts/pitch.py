#!/usr/bin/env python3
"""Personal first screen for a lead: pitches/<slug>/ → https://…/p/<slug>/

  python3 scripts/pitch.py new promboklet --demo tipografiya --brand "ПромБуклет" --city Владивосток [--phone "+7 914 …"] [--price-k 0.9]
  python3 scripts/pitch.py names tipografiya             which demo images can be replaced
  python3 scripts/pitch.py photo promboklet hero photo.jpg   their photo instead of the demo image "hero"
  python3 scripts/pitch.py logo promboklet logo.png [--accent auto|#1e7be0]
  python3 scripts/pitch.py set promboklet phone "+7 914 000-12-34"     any field: brand, city, phone, accent, priceK
  python3 scripts/pitch.py shots promboklet              build, screenshot desktop + phone into pitches/<slug>/shot-*.png
  python3 scripts/pitch.py link promboklet

Photos and logo are converted here (Pillow), so the build only copies files. The page is noindex.
Delete pitches/<slug>/ when the lead says no or stays silent for a week.
"""
import argparse
import colorsys
import json
import re
import subprocess
import sys
import time
from collections import Counter
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PITCHES = ROOT / "pitches"
DEMOS = ["remont", "potolki", "mebel", "kuhni", "vyveski", "kuzov", "tipografiya"]
SITE = "https://olpest22.github.io/turch-portfolio/"


def cfg_path(slug):
    return PITCHES / slug / "pitch.json"


def load(slug):
    p = cfg_path(slug)
    if not p.exists():
        sys.exit(f"нет питча {slug}: сначала `new`")
    return json.loads(p.read_text())


def save(slug, cfg):
    cfg_path(slug).write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n")


def names(demo):
    src = (ROOT / f"src/sites/{demo}/App.tsx").read_text()
    found = sorted(set(re.findall(r"(?:IMG|MD)\('([a-z0-9-]+)'\)", src)) | set(re.findall(r"img: '([a-z0-9-]+)'", src)) | set(re.findall(r"\['([a-z0-9-]+)', '[^']+'(?:, '[^']*')?\]", src)))
    return [n for n in found if (ROOT / f"public/img/{demo}/{n}.webp").exists()]


def dominant(im):
    """Most common saturated colour of the logo, for the accent."""
    im = im.convert("RGBA").resize((120, 120))
    c = Counter()
    for r, g, b, a in im.getdata():
        if a < 200:
            continue
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if s > 0.35 and 0.2 < l < 0.75:
            c[(r // 16 * 16, g // 16 * 16, b // 16 * 16)] += 1
    if not c:
        return None
    r, g, b = c.most_common(1)[0][0]
    return f"#{r:02x}{g:02x}{b:02x}"


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    n = sub.add_parser("new"); n.add_argument("slug"); n.add_argument("--demo", required=True, choices=DEMOS)
    n.add_argument("--brand", required=True); n.add_argument("--city", default=""); n.add_argument("--phone", default="")
    n.add_argument("--accent", default=""); n.add_argument("--price-k", type=float, default=1)
    sub.add_parser("names").add_argument("demo", choices=DEMOS)
    ph = sub.add_parser("photo"); ph.add_argument("slug"); ph.add_argument("name"); ph.add_argument("file")
    lg = sub.add_parser("logo"); lg.add_argument("slug"); lg.add_argument("file"); lg.add_argument("--accent", default="auto")
    st = sub.add_parser("set"); st.add_argument("slug"); st.add_argument("key"); st.add_argument("value")
    sub.add_parser("shots").add_argument("slug")
    sub.add_parser("link").add_argument("slug")
    a = ap.parse_args()

    if a.cmd == "new":
        if not re.fullmatch(r"[a-z0-9-]{2,40}", a.slug):
            sys.exit("slug: латиница, цифры и дефис, например promboklet")
        (PITCHES / a.slug).mkdir(parents=True, exist_ok=True)
        cfg = {"demo": a.demo, "brand": a.brand, "city": a.city, "phone": a.phone, "accent": a.accent, "priceK": a.price_k, "images": {}}
        save(a.slug, {k: v for k, v in cfg.items() if v not in ("", None)})
        print(f"создан pitches/{a.slug}/pitch.json")
    elif a.cmd == "names":
        print("\n".join(names(a.demo)) or "в этом шаблоне фото нет")
    elif a.cmd == "photo":
        cfg = load(a.slug)
        if a.name not in names(cfg["demo"]):
            sys.exit(f"в шаблоне {cfg['demo']} нет картинки «{a.name}»: {', '.join(names(cfg['demo']))}")
        im = ImageOps.exif_transpose(Image.open(a.file)).convert("RGB")
        im.thumbnail((2000, 2000))
        out = f"{a.name}.webp"
        im.save(PITCHES / a.slug / out, quality=82)
        cfg.setdefault("images", {})[a.name] = out
        save(a.slug, cfg)
        print(f"{a.name} ← {a.file} ({im.width}×{im.height})")
    elif a.cmd == "logo":
        cfg = load(a.slug)
        im = Image.open(a.file).convert("RGBA")
        bbox = im.getbbox()
        if bbox:
            im = im.crop(bbox)
        im.thumbnail((640, 200))
        im.save(PITCHES / a.slug / "logo.png")
        cfg["logo"] = "logo.png"
        if a.accent == "auto":
            c = dominant(im)
            if c:
                cfg["accent"] = c
        elif a.accent:
            cfg["accent"] = a.accent
        save(a.slug, cfg)
        print(f"логотип {im.width}×{im.height}, цвет {cfg.get('accent', 'не задан')}")
    elif a.cmd == "set":
        cfg = load(a.slug)
        cfg[a.key] = float(a.value) if a.key == "priceK" else a.value
        save(a.slug, cfg)
        print(json.dumps(cfg, ensure_ascii=False))
    elif a.cmd == "shots":
        load(a.slug)
        subprocess.run(["npx", "vite", "build"], cwd=ROOT, check=True, capture_output=True)
        srv = subprocess.Popen(["npx", "vite", "preview", "--port", "4179", "--strictPort"], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            time.sleep(3)
            out = PITCHES / a.slug
            js = f"""
const {{ chromium }} = require('playwright');
(async () => {{
  const b = await chromium.launch();
  for (const [tag, vp, dsf] of [['d', {{ width: 1440, height: 900 }}, 1], ['m', {{ width: 390, height: 844 }}, 2]]) {{
    const p = await b.newPage({{ viewport: vp, deviceScaleFactor: dsf }});
    await p.goto('http://localhost:4179/p/{a.slug}/', {{ waitUntil: 'networkidle' }});
    await p.addStyleTag({{ content: '.fixed.bottom-4.left-4{{display:none!important}}' }});
    await p.waitForTimeout(2800);
    await p.screenshot({{ path: '{out}/shot-' + tag + '.png' }});
    await p.close();
  }}
  await b.close();
}})();"""
            subprocess.run(["node", "-e", js], cwd=ROOT, check=True)
        finally:
            srv.terminate()
        print(f"скриншоты: {out}/shot-d.png, {out}/shot-m.png")
    elif a.cmd == "link":
        load(a.slug)
        print(f"{SITE}p/{a.slug}/")


if __name__ == "__main__":
    main()
