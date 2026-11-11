# Apprendre Franco-fun! — homepage prototype

An animated, responsive prototype of the redesigned Apprendre Franco-fun! homepage (French tutoring for kids K–12), plus the pricing → checkout → Franco-fun! Club flow. Built from the approved Figma design with plain HTML/CSS/JS, [GSAP 3.13](https://gsap.com) and [Lenis](https://lenis.darkroom.engineering) smooth scroll.

## View it

**Live:** https://nehaldesignmonks-del.github.io/franco-fun-prototype/

- The pricing buttons lead to the checkout, membership and Club pages.
- Add `?static=1` to any URL to see the final layout with motion off.

To run it on your own computer instead, start a local server in this folder and open http://localhost:5180:

```bash
python3 -m http.server 5180
```

**Layouts**
- **1440px and wider:** the design at full size.
- **1024–1439px:** the desktop layout, scaled to fit.
- **Under 1024px:** phone and tablet layouts.

A screen recording of the desktop homepage is in `video/`.

## Structure

| Path | What it is |
|---|---|
| `src/sections/NN-name.html` | Homepage sections, assembled in order |
| `src/pages/*.html` | Flow pages (checkout, membership, club-unlocked) |
| `css/tokens.css`, `css/base.css` | Brand tokens, type, buttons, custom cursor, shared motion hooks |
| `css/sections/`, `css/pages/` | Styles per section or page |
| `js/motion.js` | Shared motion system (see below) |
| `js/sections/`, `js/pages/` | Section- and page-specific interactions |
| `assets/` | Images, 3D illustrations, SVGs |
| `index.html`, `checkout.html`, … | **Generated** — don't edit by hand |

## Edit and rebuild

Edit files in `src/`, `css/` or `js/`, then run:

```bash
python3 build.py
```

This regenerates `index.html` and the flow pages. `python3 build.py --only 05` builds a single-section preview.

## Motion system

`js/motion.js` drives every section through data attributes:

| Attribute | Effect |
|---|---|
| `data-reveal` | Heading lines rise in |
| `data-fade` | Text fades up |
| `data-pop` | Visuals pop in with a bounce |
| `data-pop="soft"` | Cards rise in calmly (text never bounces) |
| `data-float` | Idle float |
| `data-depth` | Cursor parallax |
| `data-scroll` | Scroll parallax |
| `data-count` | Number counts up |

It also handles the Lenis smooth scroll, the custom cursor (including `data-cursor-label` chips) and the button hovers. Visitors who prefer reduced motion get the static layout.

## QA helpers

- `shot.py`: headless-Chrome screenshot of a section or page.
- `mshot.py`: full-page screenshot at any width, plus a horizontal-overflow report. Needs Playwright.
