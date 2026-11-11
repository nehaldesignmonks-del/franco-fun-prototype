/* Apprendre Franco-fun! — shared motion system.
   One file drives the whole site so every section moves the same way:
   smooth scroll (Lenis) · heading reveals · fade-ups · bouncy pop-ins · cursor parallax ·
   idle floating · scroll parallax · count-ups · custom cursor.
   Section scripts use window.FF (FF.onReady, FF.lenis, FF.motionOff, FF.ease). */
(function () {
  const root = document.documentElement;
  const motionOff = root.classList.contains('motion-off');
  const readyFns = [];
  let isReady = false;

  const FF = (window.FF = {
    motionOff,
    lenis: null,
    inited: false,
    // soft = anything carrying text (cards, panels): a calm rise, never an overshoot. Bounce is for visuals only.
    ease: { pop: 'elastic.out(1, 0.6)', soft: 'power3.out', out: 'power3.out', reveal: 'power4.out' },
    onReady(fn) { isReady ? fn(FF) : readyFns.push(fn); },
  });

  if (window.gsap) {
    gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, CustomEase, CustomBounce);
    CustomBounce.create('ffBounce', { strength: 0.45, squash: 1.6, endAtStart: false });
    CustomEase.create('ffPop', 'M0,0 C0.14,0.82 0.3,1.16 0.48,1.08 0.64,1.01 0.78,0.98 1,1');
  }

  /* ---------- Desktop-only prototype: fit the 1440 design into narrower windows ---------- */
  FF.zoom = 1;
  function fitZoom() {
    const w = window.innerWidth;
    // 1440+: design size · 1024–1439: scale the 1440 desktop design to fit · under 1024: responsive layouts (no zoom)
    FF.zoom = w < 1440 && w >= 1024 ? w / 1440 : 1;
    FF.mobile = w < 1024;
    root.classList.toggle('is-mobile', FF.mobile);
    root.style.zoom = FF.zoom === 1 ? '' : String(FF.zoom);
  }
  if (!/[?&]nofit/.test(location.search)) {
    fitZoom();
    let rz;
    window.addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(() => { fitZoom(); if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 150);
    });
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const el = document.createElement('div');
    el.className = 'ff-cursor';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="ff-cursor__inner"><svg viewBox="0 0 30 32">' +
      '<path class="shade" d="M5 5.6 L5 27.4 C5 28.6 6.4 29.2 7.3 28.4 L12.1 24 L15.6 31 C16 31.8 17 32.1 17.8 31.7 L20.6 30.4 C21.4 30 21.7 29 21.3 28.2 L17.9 21.4 L24.4 21.4 C25.6 21.4 26.2 20 25.4 19.1 L7.6 4.4 C6.7 3.7 5 4.3 5 5.6 Z" stroke-width="2" stroke-linejoin="round"/>' +
      '<path class="fill" d="M3 3.6 L3 25.4 C3 26.6 4.4 27.2 5.3 26.4 L10.1 22 L13.6 29 C14 29.8 15 30.1 15.8 29.7 L18.6 28.4 C19.4 28 19.7 27 19.3 26.2 L15.9 19.4 L22.4 19.4 C23.6 19.4 24.2 18 23.4 17.1 L5.6 2.4 C4.7 1.7 3 2.3 3 3.6 Z" stroke-width="2" stroke-linejoin="round"/>' +
      '<path class="spark" d="M26 0.5 L27.3 4.7 L31.5 6 L27.3 7.3 L26 11.5 L24.7 7.3 L20.5 6 L24.7 4.7 Z" stroke-linejoin="round"/>' +
      '</svg></div>' +
      // Chip beside the cursor, driven by data-cursor-label="…" on whatever is under the pointer.
      '<span class="ff-cursor__chip"><svg class="ff-cursor__mouse" viewBox="0 0 14 20" aria-hidden="true">' +
      '<rect x="1" y="1" width="12" height="18" rx="6" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      '<rect class="ff-cursor__wheel" x="6" y="4.5" width="2" height="4" rx="1" fill="currentColor"/></svg>' +
      '<span class="ff-cursor__chip-text"></span></span>';
    document.body.appendChild(el);
    root.classList.add('has-ff-cursor');
    const chipText = el.querySelector('.ff-cursor__chip-text');
    const HOVER = 'a, button, [role="button"], label, summary, select, input[type="checkbox"], input[type="radio"], input[type="submit"], [data-cursor="hover"]';
    const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]), textarea';
    const setX = gsap.quickSetter(el, 'x', 'px');
    const setY = gsap.quickSetter(el, 'y', 'px');
    let lx = -100, ly = -100, label = '';
    // Work out hover / text / chip state for whatever sits under the pointer.
    const evaluate = (t) => {
      const hover = !!(t && t.closest(HOVER));
      el.classList.toggle('is-hover', hover);
      el.classList.toggle('is-text', !!(t && t.closest(TEXT)));
      const host = t && t.closest('[data-cursor-label]');
      const next = host && !hover ? (host.getAttribute('data-cursor-label') || '').trim() : '';
      if (next !== label) {
        label = next;
        if (next) chipText.textContent = next;
        el.classList.toggle('has-chip', !!next);
      }
      el.classList.toggle('chip-left', lx > window.innerWidth - 220);
    };
    window.addEventListener('mousemove', (e) => {
      // Counter the root fit-zoom so the cursor stays full size and sits exactly on the pointer.
      const z = 1 / FF.zoom;
      if (el._z !== z) { el.style.zoom = z === 1 ? '' : String(z); el._z = z; }
      lx = e.clientX; ly = e.clientY;
      setX(lx - 3); setY(ly - 2);
      el.classList.add('is-visible');
      evaluate(e.target instanceof Element ? e.target : null);
    }, { passive: true });
    // Content scrolls under a still pointer (and labels change while pinned) — re-check once per frame while scrolling.
    let pending = false;
    window.addEventListener('scroll', () => {
      if (pending || lx < 0) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; evaluate(document.elementFromPoint(lx, ly)); });
    }, { passive: true });
    FF.refreshCursor = () => { if (lx >= 0) evaluate(document.elementFromPoint(lx, ly)); };
    document.addEventListener('mouseleave', () => el.classList.remove('is-visible'));
    window.addEventListener('mousedown', () => el.classList.add('is-down'));
    window.addEventListener('mouseup', () => el.classList.remove('is-down'));
  }

  /* ---------- Smooth scroll ---------- */
  function initLenis() {
    if (!window.Lenis) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    FF.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    // Sections change height after load (sticky wrappers, tab panels, clones) — keep Lenis's scroll limit in sync.
    ScrollTrigger.addEventListener('refreshInit', () => lenis.resize());
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length < 2) { e.preventDefault(); return; } // placeholder links: don't jump to the top
      const target = document.querySelector(id);
      if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -110, duration: 1.4 }); } // offset clears the fixed nav
    });
  }

  /* ---------- Headings: lines rise in behind a mask ---------- */
  function initReveals() {
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      const delay = parseFloat(el.dataset.revealDelay || 0);
      SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'ff-line', autoSplit: true,
        onSplit(self) {
          gsap.set(el, { visibility: 'visible' });
          if (el._ffRevealed) { self.revert(); return; } // already shown: keep the plain, unclipped heading
          return gsap.from(self.lines, {
            yPercent: 140, duration: 1, ease: FF.ease.reveal, stagger: 0.09, delay,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            // Remove the masks once the lines are in, so nothing (descenders, accents, highlights) stays clipped.
            onComplete() { el._ffRevealed = true; self.revert(); },
          });
        },
      });
    });
  }

  /* ---------- Fade-ups and pop-ins (batched so neighbours stagger together) ---------- */
  function initBatches() {
    const fades = gsap.utils.toArray('[data-fade]');
    if (fades.length) gsap.set(fades, { autoAlpha: 0, y: 20 });
    ScrollTrigger.batch(fades, {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.to(els, {
        autoAlpha: 1, y: 0, duration: 0.9, ease: FF.ease.out, overwrite: true,
        stagger: 0.08, delay: (i, t) => parseFloat(t.dataset.fadeDelay || 0),
      }),
    });

    // Bounce is for visuals and chosen highlights only. A [data-pop] that is just text (tags, pills, labels)
    // gets a calm rise instead — unless it opts in with data-pop="bounce".
    const isTextOnly = (el) => el.dataset.pop !== 'bounce' && el.textContent.trim().length > 0 &&
      !el.querySelector('img, svg, picture, canvas, video') && !/^(IMG|SVG|PICTURE|CANVAS|VIDEO)$/i.test(el.tagName);
    const all = gsap.utils.toArray('[data-pop]:not([data-pop="soft"])');
    const calm = all.filter(isTextOnly);
    if (calm.length) gsap.set(calm, { autoAlpha: 0, y: 18 });
    ScrollTrigger.batch(calm, {
      start: 'top 92%', once: true,
      onEnter: (els) => gsap.to(els, {
        autoAlpha: 1, y: 0, duration: 0.8, ease: FF.ease.out, stagger: 0.07, overwrite: true,
        delay: (i, t) => parseFloat(t.dataset.popDelay || 0),
      }),
    });

    const bouncy = all.filter((el) => !calm.includes(el));
    bouncy.forEach((el) => {
      el._ffRot = gsap.getProperty(el, 'rotation') || 0; // keep any design tilt set in CSS
      gsap.set(el, { autoAlpha: 0, scale: 0.4, rotation: el._ffRot + gsap.utils.random(-10, 10, 1) });
    });
    ScrollTrigger.batch(bouncy, {
      start: 'top 92%', once: true,
      onEnter: (els) => gsap.to(els, {
        autoAlpha: 1, scale: 1, rotation: (i, t) => t._ffRot,
        duration: 1.2, ease: FF.ease.pop, stagger: 0.09, overwrite: true,
        delay: (i, t) => parseFloat(t.dataset.popDelay || 0),
      }),
    });

    const soft = gsap.utils.toArray('[data-pop="soft"]');
    // Cards hold text: rise + fade only. No scale (scaling text blurs it) and no overshoot.
    if (soft.length) gsap.set(soft, { autoAlpha: 0, y: 40 });
    ScrollTrigger.batch(soft, {
      start: 'top 92%', once: true,
      onEnter: (els) => gsap.to(els, {
        autoAlpha: 1, y: 0, duration: 0.85, ease: FF.ease.soft, stagger: 0.1, overwrite: true,
        delay: (i, t) => parseFloat(t.dataset.popDelay || 0),
      }),
    });
  }

  /* ---------- Count-ups: the final value is the text already in the HTML ---------- */
  function initCounts() {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const m = el.textContent.trim().match(/^(\D*)([\d,.]+)(.*)$/);
      if (!m) return;
      const [, pre, num, post] = m;
      const target = parseFloat(num.replace(/,/g, ''));
      const obj = { v: 0 };
      el.textContent = pre + '0' + post;
      gsap.to(obj, {
        v: target, duration: 1.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => { el.textContent = pre + Math.round(obj.v).toLocaleString('en-US') + post; },
      });
    });
  }

  /* ---------- Ambient: idle float, scroll parallax, cursor parallax ---------- */
  function initAmbient() {
    gsap.utils.toArray('[data-float]').forEach((el) => {
      // Floats that carry text (e.g. the Numbers bubbles) bob gently but never rotate: rotating text shimmers.
      const hasText = el.textContent.trim().length > 0;
      const amp = Math.min(parseFloat(el.dataset.float) || 10, hasText ? 6 : 99);
      const rot = hasText ? 0 : 1.2;
      gsap.fromTo(el, { '--fy': amp * 0.5 + 'px', '--fr': -rot + 'deg' }, {
        '--fy': -amp * 0.5 + 'px', '--fr': rot + 'deg',
        duration: gsap.utils.random(2.6, 4.2), ease: 'sine.inOut', yoyo: true, repeat: -1,
        delay: gsap.utils.random(0, 1.5),
      });
    });

    gsap.utils.toArray('[data-scroll]').forEach((el) => {
      const s = parseFloat(el.dataset.scroll) || 0.15;
      const trigger = el.closest('section') || el;
      gsap.fromTo(el, { '--sy': s * 220 + 'px' }, {
        '--sy': -s * 220 + 'px', ease: 'none',
        scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    const depthEls = gsap.utils.toArray('[data-depth]');
    if (!depthEls.length || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const items = depthEls.map((el) => ({ el, d: parseFloat(el.dataset.depth) || 0.5, x: 0, y: 0, on: false }));
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      const it = items.find((i) => i.el === e.target); if (it) it.on = e.isIntersecting;
    }), { rootMargin: '200px' });
    items.forEach((i) => io.observe(i.el));
    let mx = 0, my = 0;
    window.addEventListener('mousemove', (e) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    gsap.ticker.add(() => {
      for (const it of items) {
        if (!it.on) continue;
        const tx = mx * 26 * it.d, ty = my * 20 * it.d;
        it.x += (tx - it.x) * 0.075; it.y += (ty - it.y) * 0.075;
        it.el.style.setProperty('--dx', it.x.toFixed(2) + 'px');
        it.el.style.setProperty('--dy', it.y.toFixed(2) + 'px');
      }
    });
  }

  /* ---------- Buttons: magnetic pull + label roll + springy press (one behaviour for every .btn) ---------- */
  function initButtons() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    root.classList.add('ff-btn-js');
    document.querySelectorAll('.btn').forEach((btn) => {
      const inner = btn.querySelector(':scope > span');
      if (!inner || btn._ffBtn) return;
      btn._ffBtn = true;
      // Label roll: the label slides up and an identical copy slides in from below (CSS does the move).
      const texts = [...inner.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
      if (texts.length === 1) {
        const label = texts[0].textContent.trim();
        const roll = document.createElement('span');
        roll.className = 'btn__roll';
        roll.innerHTML = '<span class="btn__roll-a"></span><span class="btn__roll-b" aria-hidden="true"></span>';
        roll.children[0].textContent = label;
        roll.children[1].textContent = label;
        inner.replaceChild(roll, texts[0]);
      }
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        gsap.to(btn, { x: dx * 10, y: dy * 8, scale: 1.04, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
        gsap.to(inner, { x: dx * 5, y: dy * 3, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
        gsap.to(inner, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
      });
      btn.addEventListener('mousedown', () => gsap.to(btn, { scale: 0.95, duration: 0.12, ease: 'power2.out', overwrite: 'auto' }));
      btn.addEventListener('mouseup', () => gsap.to(btn, { scale: 1.04, duration: 0.6, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' }));
    });
  }

  FF.initButtons = () => initButtons(); // sections that clone markup can call this again

  function start() {
    if (motionOff || !window.gsap) {
      FF.inited = true; isReady = true; readyFns.forEach((fn) => fn(FF));
      return;
    }
    initCursor();
    initButtons();
    initLenis();
    initReveals();
    initBatches();
    initCounts();
    initAmbient();
    FF.inited = true; isReady = true;
    readyFns.forEach((fn) => fn(FF));
    initBottomFallback();
    if (document.readyState === 'complete') requestAnimationFrame(() => ScrollTrigger.refresh());
    else window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ---------- Bottom-of-page safety net ----------
     A "once" trigger whose start lies beyond the max scroll can never fire (items in the last ~10% of a page).
     When the reader reaches the end — or the page can't scroll that far — fire whatever is still waiting. */
  function initBottomFallback() {
    let bottom = null;
    const fire = () => {
      const max = ScrollTrigger.maxScroll(window);
      ScrollTrigger.getAll().forEach((st) => {
        if (st === bottom || !st.vars.once || st.vars.scrub) return;
        if (st.start >= max - 2 && st.progress === 0) {
          if (st.animation) st.animation.play();
          else if (typeof st.vars.onEnter === 'function') st.vars.onEnter(st);
        }
      });
    };
    bottom = ScrollTrigger.create({
      start: () => Math.max(0, ScrollTrigger.maxScroll(window) - 2),
      end: () => ScrollTrigger.maxScroll(window),
      onEnter: fire,
    });
    ScrollTrigger.addEventListener('refresh', () => { if (window.scrollY >= bottom.start) fire(); });
  }

  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const domReady = new Promise((r) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', r) : r()));
  Promise.all([domReady, Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))])]).then(start);
})();
