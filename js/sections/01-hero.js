/* 01 · Hero — fixed nav (hide on scroll down / show on scroll up), on-load staged entrance,
   layered cursor parallax for the 3D scene. Idle float + scroll drift come from the shared
   data-float / data-scroll attributes in the markup. */
FF.onReady((FF) => {
  const root = document.querySelector('.s-hero');
  if (!root) return;
  const nav = root.querySelector('.s-hero__nav');

  /* ---------- Nav: hide on scroll down, slide back on scroll up ---------- */
  if (nav) {
    let hidden = false;
    let menuOpen = false;
    const setHidden = (h) => { if (h !== hidden) { hidden = h; nav.classList.toggle('is-hidden', h); } };

    /* Under 1024: menu button opens the drop-down panel (close on link tap, outside tap, Esc, or resize to desktop) */
    const burger = nav.querySelector('.s-hero__burger');
    const menu = nav.querySelector('.s-hero__menu');
    const setMenu = (open) => {
      menuOpen = open;
      nav.classList.toggle('is-menu-open', open);
      if (burger) burger.setAttribute('aria-expanded', String(open));
      if (open) setHidden(false);
    };
    if (burger && menu) {
      burger.addEventListener('click', () => setMenu(!menuOpen));
      menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
      document.addEventListener('click', (e) => { if (menuOpen && !nav.contains(e.target)) setMenu(false); });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); }
      });
      matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
    }

    const onScroll = (y, dir) => {
      nav.classList.toggle('is-scrolled', y > 8);
      if (menuOpen) setHidden(false);
      else if (y < 140) setHidden(false);
      else if (dir > 0) setHidden(true);
      else if (dir < 0) setHidden(false);
    };
    if (FF.lenis) {
      FF.lenis.on('scroll', (l) => onScroll(l.scroll, l.direction));
    } else {
      let last = window.scrollY;
      window.addEventListener('scroll', () => {
        const y = window.scrollY; onScroll(y, Math.sign(y - last)); last = y;
      }, { passive: true });
    }
    nav.addEventListener('focusin', () => setHidden(false));
    // Pointer near the top edge peeks the nav back in.
    window.addEventListener('mousemove', (e) => { if (e.clientY < 64 && hidden) setHidden(false); }, { passive: true });
  }

  if (FF.motionOff) return; // static mode: final layout untouched

  const $ = (s) => root.querySelector(s);
  const $$ = (s) => Array.from(root.querySelectorAll(s));
  const pop = (sel) => $(sel + ' .s-hero__pop');

  /* ---------- On-load staged entrance ---------- */
  const tl = gsap.timeline({ defaults: { ease: FF.ease.out } });

  // Nav drops in
  tl.fromTo(nav, { yPercent: -110 }, { yPercent: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform' }, 0.05);

  // Scene settles: the colour-burn wave drifts into place
  tl.fromTo('.s-hero__wave', { scale: 1.18, autoAlpha: 0, yPercent: 8 },
    { scale: 1, autoAlpha: 0.5, yPercent: 0, duration: 1.6, ease: 'power3.out' }, 0);

  // Trust row
  tl.fromTo('.s-hero__trust-item', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.12);
  tl.from('.s-hero__avatars img', { scale: 0.3, duration: 0.9, ease: FF.ease.pop, stagger: 0.06 }, 0.16);

  // Title: lines rise behind their (generous) masks; the masks are removed once the lines land,
  // so nothing can be clipped afterwards. The orange pill is the section's one bouncy highlight.
  const lines = root.querySelectorAll('.s-hero__line');
  tl.fromTo('.s-hero__line-in', { yPercent: 140 }, {
    yPercent: 0, duration: 0.9, ease: FF.ease.reveal, stagger: 0.1,
    onComplete: () => lines.forEach((l) => l.classList.add('is-open')),
  }, 0.14);
  tl.fromTo('.s-hero__pill', { autoAlpha: 0, scaleX: 0.25, scaleY: 0.5 },
    { autoAlpha: 1, scaleX: 1, scaleY: 1, duration: 1, ease: 'elastic.out(1, 0.7)' }, 0.2);

  // Subtitle + CTAs
  tl.fromTo('.s-hero__sub', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.42);
  tl.fromTo('.s-hero__cta', { autoAlpha: 0, scale: 0.94, y: 18 },
    { autoAlpha: 1, scale: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, 0.55);

  // 3D scene pops in (inner element only, so float / parallax on the wrappers stay free)
  tl.fromTo(pop('.s-hero__sun'), { autoAlpha: 0, yPercent: 38, scale: 0.75, rotation: -12 },
    { autoAlpha: 1, yPercent: 0, scale: 1, rotation: 0, duration: 1.3, ease: 'back.out(1.5)' }, 0.32);

  const pops = [
    ['.s-hero__cloud--2', 0.42, -6], ['.s-hero__cloud--3', 0.5, 6],
    ['.s-hero__bcard-wrap', 0.5, -10], ['.s-hero__card-wrap--right', 0.6, 10],
    ['.s-hero__card-wrap--bottom', 0.66, -8], ['.s-hero__cloud--1', 0.7, -6],
    ['.s-hero__cloud--4', 0.76, 6], ['.s-hero__clay--c', 0.86, -40], ['.s-hero__clay--e', 0.94, 40],
  ];
  pops.forEach(([sel, at, rot]) => {
    const el = pop(sel);
    if (!el) return;
    tl.fromTo(el, { autoAlpha: 0, scale: 0.4, rotation: rot },
      { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.2, ease: FF.ease.pop }, at);
  });

  // From-states are rendered; reveal the pre-hidden elements.
  gsap.set($$('[data-hero]'), { visibility: 'visible' });

  /* ---------- Layered cursor parallax (stronger than the global data-depth, hero only) ---------- */
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const layers = $$('[data-hdepth]').map((el) => ({
    d: parseFloat(el.dataset.hdepth) || 0,
    x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3.out' }),
    y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3.out' }),
  }));
  const wave = $('.s-hero__wave');
  const waveX = gsap.quickTo(wave, 'x', { duration: 1.6, ease: 'power3.out' });
  const waveY = gsap.quickTo(wave, 'y', { duration: 1.6, ease: 'power3.out' });

  let inView = true;
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(root);

  const move = (mx, my) => {
    layers.forEach((l) => { l.x(mx * 44 * l.d); l.y(my * 30 * l.d); });
    waveX(mx * -14); waveY(my * -10);
  };
  window.addEventListener('mousemove', (e) => {
    if (!inView) return;
    move((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });
  document.addEventListener('mouseleave', () => move(0, 0));
});
