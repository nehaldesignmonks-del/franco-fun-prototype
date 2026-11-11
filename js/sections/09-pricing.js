/* 09 · Pricing — real tabs (Individual classes | Franco-fun! Club) with a sliding thumb,
   panel cross-fade + section height tween, Club nudges, and scroll-in check pops. */
FF.onReady((FF) => {
  const sec = document.getElementById('pricing');
  if (!sec) return;

  const animate = !FF.motionOff && !!window.gsap;
  const toggle = sec.querySelector('.s-pricing__toggle');
  const thumb = sec.querySelector('.s-pricing__thumb');
  const wrap = sec.querySelector('.s-pricing__panels');
  const tabs = Array.from(sec.querySelectorAll('[role="tab"]'));
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  let current = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
  if (current < 0) current = 0;
  let tl = null;

  /* ---------- Thumb ---------- */
  function thumbTarget(i) { const t = tabs[i]; return { x: t.offsetLeft, width: t.offsetWidth }; }
  function placeThumb(i, smooth) {
    const p = thumbTarget(i);
    if (smooth && animate) {
      gsap.to(thumb, { x: p.x, width: p.width, duration: 0.8, ease: 'elastic.out(1, 0.72)', overwrite: true });
      // a little squash as it lands
      gsap.fromTo(thumb, { scaleY: 0.86 }, { scaleY: 1, duration: 0.7, ease: 'elastic.out(1.1, 0.5)', delay: 0.08 });
    } else if (window.gsap) {
      gsap.set(thumb, { x: p.x, width: p.width });
    } else {
      thumb.style.transform = `translateX(${p.x}px)`; thumb.style.width = p.width + 'px';
    }
  }
  toggle.classList.add('has-thumb');
  placeThumb(current, false);
  window.addEventListener('resize', () => placeThumb(current, false));

  /* ---------- Panel entrance pieces ---------- */
  function partsOf(panel) {
    if (panel.classList.contains('s-pricing__panel--individual')) {
      return {
        blocks: panel.querySelectorAll('.s-pricing__plan'),
        extra: panel.querySelectorAll('.s-pricing__note, .s-pricing__help'),
        checks: panel.querySelectorAll('.s-pricing__check'),
      };
    }
    return {
      blocks: panel.querySelectorAll('.s-pricing__about, .s-pricing__tiers, .s-pricing__schedule'),
      extra: panel.querySelectorAll('.s-pricing__tier, .s-pricing__table tbody tr'),
      checks: panel.querySelectorAll('.s-pricing__check'),
    };
  }

  function enter(panel) {
    const p = partsOf(panel);
    const t = gsap.timeline();
    // cards carry text: the shared soft rise, no elastic
    t.fromTo(p.blocks, { autoAlpha: 0, y: 46, scale: 0.97 }, {
      autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: FF.ease.soft, stagger: 0.09, clearProps: 'transform',
    }, 0);
    t.fromTo(p.extra, { autoAlpha: 0, y: 16 }, {
      autoAlpha: 1, y: 0, duration: 0.55, ease: FF.ease.out, stagger: 0.04, clearProps: 'transform',
    }, 0.22);
    t.fromTo(p.checks, { scale: 0, rotation: -40 }, {
      scale: 1, rotation: 0, duration: 0.9, ease: FF.ease.pop, stagger: 0.035, overwrite: true,
    }, 0.3);
    t.fromTo(panel.querySelectorAll('.s-pricing__check path'), { drawSVG: '0%' }, {
      drawSVG: '100%', duration: 0.4, ease: 'power2.out', stagger: 0.035, overwrite: true,
    }, 0.38);
    // deliberate highlight: the Club's "FREE!" price gets the one bouncy pop
    const free = panel.querySelector('.s-pricing__tier-amount--free');
    if (free) {
      t.fromTo(free, { autoAlpha: 0, scale: 0.5, rotation: -8 }, {
        autoAlpha: 1, scale: 1, rotation: 0, duration: 1.1, ease: FF.ease.pop, clearProps: 'transform',
      }, 0.4);
    }
    return t;
  }

  /* Natural height of a (hidden) panel, measured off-flow without a visible flash */
  function measure(panel) {
    const wasHidden = panel.hidden;
    panel.hidden = false;
    const prev = panel.style.cssText;
    panel.style.cssText += ';position:absolute;left:0;right:0;top:0;visibility:hidden;';
    const h = panel.offsetHeight;
    panel.style.cssText = prev;
    panel.hidden = wasHidden;
    return h;
  }

  /* ---------- Tab switching ---------- */
  function select(i, opts = {}) {
    if (i === current || i < 0 || i >= tabs.length) return;
    const from = panels[current], to = panels[i];
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (opts.focus) tabs[i].focus();
    current = i;
    placeThumb(i, true);

    if (!animate) {
      from.hidden = true; from.classList.remove('is-active');
      to.hidden = false; to.classList.add('is-active');
      return;
    }

    if (tl) tl.progress(1).kill();   // finish any switch in progress (swaps panels, releases height)
    gsap.killTweensOf(wrap);
    gsap.set(wrap, { clearProps: 'height' });
    const h0 = wrap.offsetHeight;
    const h1 = measure(to);
    // the section height starts easing right away, in parallel with the fade-out, so the incoming
    // panel never spills past the section's bottom edge (no clipping while it rises in)
    gsap.fromTo(wrap, { height: h0 }, { height: h1, duration: 0.7, ease: 'power3.inOut' });
    tl = gsap.timeline({
      onComplete: () => { gsap.set(wrap, { clearProps: 'height' }); ScrollTrigger.refresh(); tl = null; },
    });
    // outgoing panel fades and drops
    tl.to(from, { autoAlpha: 0, y: 26, duration: 0.28, ease: 'power2.in' });
    tl.add(() => {
      from.hidden = true; from.classList.remove('is-active');
      gsap.set(from, { clearProps: 'opacity,visibility,transform' });
      to.hidden = false; to.classList.add('is-active');
      enter(to);
    });
    tl.to({}, { duration: 0.45 }); // ends with the height tween (0.28 + 0.45 ≥ 0.7) before releasing the lock
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      let k = null;
      if (e.key === 'ArrowRight') k = (current + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') k = (current - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') k = 0;
      else if (e.key === 'End') k = tabs.length - 1;
      if (k === null) return;
      e.preventDefault();
      if (k === current) tabs[k].focus(); else select(k, { focus: true });
    });
  });

  /* Club nudges: jump to the Club tab and bring the toggle into view */
  sec.querySelectorAll('.s-pricing__nudge').forEach((btn) => {
    btn.addEventListener('click', () => {
      const clubIdx = tabs.findIndex((t) => t.id === 'pricing-tab-club');
      if (FF.lenis) FF.lenis.scrollTo(toggle, { offset: FF.mobile ? -110 : -160, duration: 1.1 });
      else toggle.scrollIntoView({ behavior: animate ? 'smooth' : 'auto', block: 'center' });
      select(clubIdx);
      tabs[clubIdx].focus({ preventScroll: true });
    });
  });

  if (!animate) return;

  /* ---------- Scroll-in: check icons pop (and draw) once their column has risen in ---------- */
  const ind = panels.find((p) => p.classList.contains('s-pricing__panel--individual'));
  const groups = Array.from(ind.querySelectorAll('.s-pricing__plan')).concat(ind.querySelector('.s-pricing__note'));
  groups.forEach((g, gi) => {
    const checks = g.querySelectorAll('.s-pricing__check');
    const paths = g.querySelectorAll('.s-pricing__check path');
    gsap.set(checks, { scale: 0, rotation: -40 });
    gsap.set(paths, { drawSVG: '0%' });
    ScrollTrigger.create({
      trigger: g, start: 'top 85%', once: true,
      onEnter: () => {
        const d = g.classList.contains('s-pricing__plan') ? 0.45 + gi * 0.1 : 0.25;
        gsap.to(checks, { scale: 1, rotation: 0, duration: 1, ease: FF.ease.pop, stagger: 0.07, delay: d });
        gsap.to(paths, { drawSVG: '100%', duration: 0.45, ease: 'power2.out', stagger: 0.07, delay: d + 0.08 });
      },
    });
  });
});
