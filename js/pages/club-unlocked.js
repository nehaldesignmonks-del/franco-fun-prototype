/* Club unlocked — celebration on load + flow params.
   ?from=membership hides the "class-pack buyers" card; ?plan=essential|progression|intensive sets its class count. */
(function () {
  const q = new URLSearchParams(location.search);
  const from = (q.get('from') || '').toLowerCase();
  const COUNTS = { essential: 5, progression: 10, intensive: 20 };
  const next = document.querySelector('[data-cu="next"]');
  if (next && from === 'membership') next.hidden = true;
  const n = COUNTS[(q.get('plan') || '').toLowerCase()];
  const classes = document.querySelector('[data-cu="classes"]');
  if (classes && n) classes.textContent = `Your ${n} individual classes are ready`;

  // Placeholder links (parent portal / calendar) shouldn't jump the page to the top.
  document.querySelectorAll('.pg a[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

  FF.onReady((FF) => {
    if (FF.motionOff) return;
    const $ = (s) => document.querySelector(s);
    const shown = (els) => els.filter((el) => el && !el.closest('[hidden]'));
    const disc = $('.cu-badge__disc'), tick = $('.cu-badge__tick'), ring = $('.cu-badge__ring');
    const week = $('.cu-week');
    const rows = gsap.utils.toArray('.cu-row');
    const pills = gsap.utils.toArray('.cu-pill');
    const lower = shown([$('.cu-next'), $('.cu__ctas')]);
    const badge = shown([$('.cu-next__badge')]);

    // Start states (CSS keeps these hidden until now).
    gsap.set([week, ...lower], { autoAlpha: 0, y: 60, scale: 0.92 });
    gsap.set(rows, { autoAlpha: 0, y: 18 });
    gsap.set([...pills, ...badge], { autoAlpha: 0, scale: 0.4, rotation: () => gsap.utils.random(-14, 14, 1) });

    // Plays on load (no scroll trigger) so the whole confirmation is always seen.
    const tl = gsap.timeline({ delay: 0.1 });
    tl.set(disc, { visibility: 'visible' }, 0)
      // badge pops in with a bounce…
      .fromTo(disc, { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 1.1, ease: 'elastic.out(1, 0.5)' }, 0)
      .fromTo(disc, { y: -36 }, { y: 0, duration: 0.8, ease: 'ffBounce' }, 0)
      // …the check draws itself and snaps into place…
      .fromTo(tick, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.42, ease: 'power2.inOut' }, 0.32)
      .fromTo(tick, { scale: 0.7, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.9, ease: 'elastic.out(1.2, 0.4)' }, 0.5)
      // …with one soft ring ripple.
      .fromTo(ring, { scale: 1, opacity: 0.9 }, { scale: 1.9, opacity: 0, duration: 0.9, ease: 'power2.out', immediateRender: false }, 0.6)
      // schedule card lands, its rows stagger in, pills pop
      .to(week, { autoAlpha: 1, y: 0, scale: 1, duration: 0.95, ease: FF.ease.soft }, 0.45)
      .to(rows, { autoAlpha: 1, y: 0, duration: 0.65, ease: FF.ease.soft, stagger: 0.12 }, 0.8)
      .to(pills, { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.1, ease: FF.ease.pop, stagger: 0.12 }, 0.95)
      // what's next + buttons
      .to(lower, { autoAlpha: 1, y: 0, scale: 1, duration: 0.95, ease: FF.ease.soft, stagger: 0.1 }, 0.6)
      .to(badge, { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.1, ease: FF.ease.pop }, 1.0);
  });
})();
