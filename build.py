#!/usr/bin/env python3
"""Assemble the prototype.

  python3 build.py              -> index.html (all src/sections/*.html in name order) + one page per src/pages/*.html
  python3 build.py --only 06    -> _preview-06.html with only the section(s) whose file name starts with "06"

Each section/page fragment automatically gets its matching css/<kind>/<stem>.css and js/<kind>/<stem>.js if they exist.
"""
import glob
import os
import sys
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(ROOT, "src", "index.template.html")
V = str(int(time.time()))


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def assets_for(kind, stems):
    css, js = [], []
    # Shared partials for a kind (e.g. css/pages/_flow.css) load first, before per-file styles/scripts.
    for p in sorted(glob.glob(os.path.join(ROOT, "css", kind, "_*.css"))):
        css.append(f'  <link rel="stylesheet" href="css/{kind}/{os.path.basename(p)}?v={V}">')
    for p in sorted(glob.glob(os.path.join(ROOT, "js", kind, "_*.js"))):
        js.append(f'  <script src="js/{kind}/{os.path.basename(p)}?v={V}"></script>')
    for s in stems:
        if os.path.exists(os.path.join(ROOT, "css", kind, s + ".css")):
            css.append(f'  <link rel="stylesheet" href="css/{kind}/{s}.css?v={V}">')
        if os.path.exists(os.path.join(ROOT, "js", kind, s + ".js")):
            js.append(f'  <script src="js/{kind}/{s}.js?v={V}"></script>')
    return "\n".join(css), "\n".join(js)


def render(title, kind, files, body_class=""):
    stems = [os.path.splitext(os.path.basename(f))[0] for f in files]
    css, js = assets_for(kind, stems)
    content = "\n".join(read(f) for f in files)
    out = read(TEMPLATE)
    for k, v in {"{{TITLE}}": title, "{{CSS}}": css, "{{JS}}": js, "{{CONTENT}}": content,
                 "{{V}}": V, "{{BODY_CLASS}}": body_class}.items():
        out = out.replace(k, v)
    return out


def write(name, html):
    with open(os.path.join(ROOT, name), "w", encoding="utf-8") as f:
        f.write(html)
    print("wrote", name)


def main():
    sections = sorted(glob.glob(os.path.join(ROOT, "src", "sections", "*.html")))
    if "--only" in sys.argv:
        pref = sys.argv[sys.argv.index("--only") + 1]
        sel = [f for f in sections if os.path.basename(f).startswith(pref)]
        if not sel:
            sys.exit(f"no section starting with {pref}")
        write(f"_preview-{pref}.html", render(f"Preview {pref}", "sections", sel))
        return
    pages = sorted(glob.glob(os.path.join(ROOT, "src", "pages", "*.html")))
    if "--page" in sys.argv:  # build just one page, e.g. --page checkout
        name = sys.argv[sys.argv.index("--page") + 1]
        pages = [p for p in pages if os.path.splitext(os.path.basename(p))[0] == name]
        if not pages:
            sys.exit(f"no page named {name}")
    else:
        write("index.html", render("Apprendre Franco-fun! — French tutoring for K–12", "sections", sections, "page-home"))
    for p in pages:
        stem = os.path.splitext(os.path.basename(p))[0]
        title = "Apprendre Franco-fun! — " + stem.replace("-", " ").title()
        write(stem + ".html", render(title, "pages", [p], "page-" + stem))


if __name__ == "__main__":
    main()
