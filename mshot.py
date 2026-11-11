#!/usr/bin/env python3
"""Full-page screenshot at any width + horizontal-overflow report (for the responsive pass).

Run with a Python that has Playwright installed (pip install playwright; it drives your installed Google Chrome):
  V=/path/to/venv/bin/python
  "$V" mshot.py 05 --w 390            -> builds _preview-05.html, saves shots/05-w390.png (static/final state)
  "$V" mshot.py checkout --w 390      -> run `python3 build.py --page checkout` first
  "$V" mshot.py index --w 768
  add --live to load with motion on (waits ~2.5s, scrolls through the page so reveals fire)
Needs the local server on http://127.0.0.1:5180 (serves this folder).
"""
import os, subprocess, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[1:]
if not args:
    sys.exit(__doc__)
target = args[0]
w = int(args[args.index("--w") + 1]) if "--w" in args else 390
h = int(args[args.index("--h") + 1]) if "--h" in args else 844
live = "--live" in args
if target[:2].isdigit():
    subprocess.run([sys.executable if False else "python3", os.path.join(ROOT, "build.py"), "--only", target], check=True, stdout=subprocess.DEVNULL)
    page_name = f"_preview-{target}.html"
else:
    page_name = f"{target}.html"
url = f"http://127.0.0.1:5180/{page_name}" + ("" if live else "?static=1")
out = os.path.join(ROOT, "shots", f"{target}-w{w}{'-live' if live else ''}.png")
os.makedirs(os.path.dirname(out), exist_ok=True)

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    is_touch = w < 1024
    ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2 if w < 800 else 1,
                        has_touch=is_touch, is_mobile=False)
    pg = ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(url)
    pg.wait_for_timeout(1500)
    if live:
        H = pg.evaluate("document.documentElement.scrollHeight")
        y = 0
        while y < H:
            pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(120); y += h // 2
        pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(1200)
    report = pg.evaluate("""() => {
      const vw = document.documentElement.clientWidth, out = [];
      const clipped = (el) => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const s = getComputedStyle(a); if (s.overflowX !== 'visible') { const r = a.getBoundingClientRect(); return r.right <= vw + 1 && r.left >= -1; } } return false; };
      for (const el of document.querySelectorAll('main *, body > *')) {
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
        if ((r.right > vw + 1 || r.left < -1) && !clipped(el)) out.push(((el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || el.tagName).toString().slice(0, 50) + ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']');
      }
      return { vw, scrollW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight, overflow: out.slice(0, 15) };
    }""")
    # Chrome can't capture taller than ~16k device px; drop to 1x for long pages so the image doesn't repeat.
    if report["docH"] * (2 if w < 800 else 1) > 16000:
        b2 = ctx.browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, has_touch=is_touch)
        pg2 = b2.new_page(); pg2.goto(url); pg2.wait_for_timeout(1500)
        pg2.screenshot(path=out, full_page=True); b2.close()
    else:
        pg.screenshot(path=out, full_page=True)
    b.close()
print(out)
print("viewport", report["vw"], "scrollWidth", report["scrollW"], "height", report["docH"])
print("overflowing (unclipped):", report["overflow"] or "none")
if errors:
    print("page errors:", errors[:5])
