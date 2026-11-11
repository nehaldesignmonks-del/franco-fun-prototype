#!/usr/bin/env python3
"""Headless-Chrome screenshot of a section preview or a page, in static (final-state) mode.

  python3 shot.py 06 --h 2383            -> builds _preview-06.html, saves shots/06.png (1440 x 2383)
  python3 shot.py checkout --h 1300      -> shots/checkout.png from checkout.html (run build.py first)
  python3 shot.py index --h 12700        -> whole page
  add --live to screenshot with motion on (after ~4s of virtual time) instead of static mode
"""
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    target = sys.argv[1]
    h = int(sys.argv[sys.argv.index("--h") + 1]) if "--h" in sys.argv else 1200
    live = "--live" in sys.argv
    if target[:2].isdigit():
        subprocess.run([sys.executable, os.path.join(ROOT, "build.py"), "--only", target], check=True)
        html = os.path.join(ROOT, f"_preview-{target}.html")
    else:
        html = os.path.join(ROOT, f"{target}.html")
    os.makedirs(os.path.join(ROOT, "shots"), exist_ok=True)
    out = os.path.join(ROOT, "shots", f"{target}{'-live' if live else ''}.png")
    url = "file://" + html.replace(" ", "%20") + ("" if live else "?static=1")
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
           f"--window-size=1440,{h}", "--virtual-time-budget=5000", "--allow-file-access-from-files",
           f"--screenshot={out}", url]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
    print(out)


if __name__ == "__main__":
    main()
