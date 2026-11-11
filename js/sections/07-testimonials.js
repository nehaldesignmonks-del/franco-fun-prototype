/* 07 · Testimonials — carousel loop, star pops, sun details.
   Static / reduced motion: nothing here runs, the row stays in its Figma-aligned layout. */
(function () {
  /* Clone the card+photo set once, before motion.js wires up the pop-ins, so the row can loop seamlessly.
     Runs at parse time; the clone sits to the RIGHT of the original set, so the visible layout is unchanged
     even if the animation never starts, and the row can drift leftwards into it. */
  const root = document.documentElement;
  if (root.classList.contains('motion-off')) return;
  const track = document.querySelector('#testimonials .s-testi__track');
  if (!track || track.dataset.looped) return;
  const items = Array.from(track.children);
  const frag = document.createDocumentFragment();
  items.forEach((el) => {
    const c = el.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.classList.add('is-clone');
    [c, ...c.querySelectorAll('[data-pop]')].forEach((n) => { n.removeAttribute('data-pop'); n.removeAttribute('data-pop-delay'); });
    frag.appendChild(c);
  });
  const firstClone = frag.firstElementChild;
  track.appendChild(frag);
  track.dataset.looped = '1';
  const loopW = firstClone.offsetLeft - items[0].offsetLeft;
  track.style.setProperty('--loop', loopW + 'px');
  track.classList.add('is-looping');
})();

FF.onReady((FF) => {
  if (FF.motionOff) return;
  const sec = document.getElementById('testimonials');
  if (!sec) return;
  const track = sec.querySelector('.s-testi__track');

  /* ---- Carousel: continuous drift right-to-left. Eases to a stop while a mouse pointer rests on a card or photo,
     or while a finger is down on the row (touch). Rebuilt per breakpoint so the loop width matches the layout. ---- */
  if (track && track.classList.contains('is-looping')) {
    const SPEED = 30; // px per second — calm enough to read while it moves
    const originals = track.querySelectorAll(':scope > :not(.is-clone)').length;
    const build = () => {
      const loopW = track.children[originals].offsetLeft - track.children[0].offsetLeft;
      track.style.setProperty('--loop', loopW + 'px');
      const loop = gsap.fromTo(track, { x: 0 }, { x: -loopW, duration: loopW / SPEED, ease: 'none', repeat: -1, paused: true });
      let inView = false, hover = false, held = false, px = -1, py = -1;
      const ease = () => {
        const stop = hover || held;
        gsap.to(loop, { timeScale: stop ? 0 : 1, duration: stop ? 0.6 : 0.9, ease: stop ? 'power2.out' : 'power1.inOut', overwrite: true });
      };
      const setHover = (h) => { if (h !== hover) { hover = h; ease(); } };
      const setHeld = (h) => { if (h !== held) { held = h; ease(); } };
      const onMove = (e) => { if (e.pointerType === 'mouse') { px = e.clientX; py = e.clientY; } };
      const onLeave = () => { px = py = -1; setHover(false); };
      const onTouch = () => setHeld(true);
      const onRelease = () => setHeld(false);
      sec.addEventListener('pointermove', onMove, { passive: true });
      sec.addEventListener('pointerleave', onLeave);
      track.addEventListener('touchstart', onTouch, { passive: true });
      window.addEventListener('touchend', onRelease, { passive: true });
      window.addEventListener('touchcancel', onRelease, { passive: true });
      // Items slide under a resting mouse, so hit-test on the ticker (only while in view and the mouse is inside).
      const tick = () => {
        if (!inView || px < 0) return;
        const el = document.elementFromPoint(px, py);
        setHover(!!(el && el.closest('.s-testi__card, .s-testi__photo')));
      };
      gsap.ticker.add(tick);
      ScrollTrigger.create({
        trigger: sec, start: 'top bottom', end: 'bottom top',
        onToggle: (s) => { inView = s.isActive; s.isActive ? loop.play() : loop.pause(); },
      });
      return () => {
        gsap.ticker.remove(tick);
        sec.removeEventListener('pointermove', onMove);
        sec.removeEventListener('pointerleave', onLeave);
        track.removeEventListener('touchstart', onTouch);
        window.removeEventListener('touchend', onRelease);
        window.removeEventListener('touchcancel', onRelease);
      };
    };
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', build);
    mm.add('(max-width: 1023px)', build);
  }

  /* ---- Star icons light up one by one once each card has popped in (clones are already lit) ---- */
  sec.querySelectorAll('.s-testi__card:not(.is-clone)').forEach((card) => {
    const stars = card.querySelectorAll('.s-testi__stars span');
    gsap.set(stars, { scale: 0, rotation: -45, transformOrigin: '50% 55%' });
    ScrollTrigger.create({
      trigger: card, start: 'top 88%', once: true,
      onEnter: () => gsap.to(stars, { scale: 1, rotation: 0, duration: 0.9, ease: FF.ease.pop, stagger: 0.07, delay: 0.35 }),
    });
  });

  /* ---- Soleil: rays turn slowly, eyes blink now and then (paused while off-screen) ---- */
  const rays = sec.querySelector('.s-testi__rays');
  const eyes = sec.querySelectorAll('.s-testi__eye');
  if (!rays) return;
  const spin = gsap.to(rays, { rotation: 360, svgOrigin: '81.62 70.82', duration: 40, ease: 'none', repeat: -1, paused: true });
  const blink = gsap.timeline({ repeat: -1, repeatDelay: 2.6, delay: 1.2, paused: true })
    .to(eyes, { scaleY: 0.12, transformOrigin: '50% 50%', duration: 0.08, ease: 'power1.in' })
    .to(eyes, { scaleY: 1, duration: 0.16, ease: 'power1.out' })
    .to(eyes, { scaleY: 0.12, duration: 0.08, ease: 'power1.in' }, '+=3.2')
    .to(eyes, { scaleY: 1, duration: 0.16, ease: 'power1.out' })
    .to(eyes, { scaleY: 0.12, duration: 0.07, ease: 'power1.in' }, '+=0.12')
    .to(eyes, { scaleY: 1, duration: 0.14, ease: 'power1.out' });
  ScrollTrigger.create({
    trigger: sec, start: 'top bottom', end: 'bottom top',
    onToggle: (s) => [spin, blink].forEach((t) => (s.isActive ? t.play() : t.pause())),
  });
});
