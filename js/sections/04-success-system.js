/* 04 · Success System
   · Intro: step cards soft-pop left→right; each STEP tag fades up just after its card (text: no bounce).
   · Click a card (Daydream-style fan): it comes to the front, straightens, lifts and scales up; the others
     ease back and spread a little. Click it again, press Esc or click outside to settle; another card swaps.
   · Papumba-style hand-off: this section holds (CSS sticky, zoom-safe) from when its bottom meets the viewport
     bottom until Programs (05) has slid up over it; it stays exactly as it is (no scale, no dim). */
FF.onReady((FF) => {
  const sec = document.querySelector('.s-success');
  if (!sec) return;

  const steps = gsap.utils.toArray('.s-success__step', sec);
  const cards = steps.map((s) => s.querySelector('.s-success__card'));
  const tags = cards.map((c) => c.querySelector('.s-success__tag'));
  // Current design tilt per card (0 on phones/tablets, where the cards sit flat in a swipe row).
  const tiltOf = (i) => parseFloat(getComputedStyle(steps[i]).getPropertyValue('--tilt')) || 0;
  const mq = matchMedia('(max-width: 1023px)');
  const row = sec.querySelector('.s-success__steps');
  let active = -1;

  /* ---------- Click / keyboard pop ---------- */
  const zTimers = [];
  function setActive(a) {
    if (mq.matches && a !== -1) return; // phones/tablets: a simple flat swipe row, no pop
    if (a === active) a = -1;
    const prev = active;
    active = a;
    cards.forEach((card, i) => {
      card.setAttribute('aria-pressed', i === a ? 'true' : 'false');
      steps[i].classList.toggle('is-active', i === a);
    });
    if (FF.motionOff) return; // static / reduced motion: CSS handles the (instant) state

    // Stacking: the active card in front; the one it replaces stays above the rest until it has settled.
    steps.forEach((s, i) => {
      if (zTimers[i]) { zTimers[i].kill(); zTimers[i] = null; }
      if (i === a) s.style.zIndex = 10;
      else if (i === prev) {
        s.style.zIndex = 5;
        zTimers[i] = gsap.delayedCall(0.7, () => { if (active !== i) s.style.zIndex = ''; });
      } else s.style.zIndex = '';
    });

    // Phones/tablets: the cards sit in a swipe row, so the pop is smaller (it must stay inside the row's padding).
    const m = mq.matches;
    const lift = m ? -14 : -34, grow = m ? 1.06 : 1.1, near = m ? 18 : 42, far = m ? 10 : 24;
    cards.forEach((card, i) => {
      if (a === -1) {
        gsap.to(card, { x: 0, y: 0, scale: 1, rotation: tiltOf(i), duration: 0.75, ease: 'back.out(1.5)', overwrite: 'auto' });
      } else if (i === a) {
        gsap.to(card, { x: 0, y: lift, scale: grow, rotation: 0, duration: 0.8, ease: 'back.out(1.8)', overwrite: 'auto' });
      } else {
        const d = i - a;
        const n = Math.abs(d);
        gsap.to(card, {
          x: Math.sign(d) * (n === 1 ? near : far), y: m ? 6 : 12, scale: m ? 0.96 : 0.95, rotation: tiltOf(i) * 1.15,
          duration: 0.65, ease: 'power3.out', overwrite: 'auto',
        });
      }
    });
    // In the swipe row, bring the tapped card to the middle.
    if (m && a !== -1 && row.scrollWidth > row.clientWidth + 1) {
      const li = steps[a];
      row.scrollTo({ left: li.offsetLeft + li.offsetWidth / 2 - row.clientWidth / 2, behavior: 'smooth' });
    }
  }

  cards.forEach((card, i) => card.addEventListener('click', () => setActive(i)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && active !== -1) setActive(-1); });
  document.addEventListener('click', (e) => {
    if (active !== -1 && !(e.target instanceof Element && e.target.closest('.s-success__card'))) setActive(-1);
  });
  // Crossing the 1024 breakpoint swaps the layout: settle any popped card.
  mq.addEventListener('change', () => {
    if (active !== -1) setActive(-1);
    if (!FF.motionOff) gsap.set(cards, { x: 0, y: 0, scale: 1, rotation: (i) => tiltOf(i) }); // flat on mobile, fanned on desktop
  });

  if (FF.motionOff) return; // static mode: leave the final layout untouched

  /* ---------- Intro ---------- */
  gsap.set(cards, { autoAlpha: 0, y: 70, scale: 0.9 });
  gsap.set(tags, { autoAlpha: 0, y: 10 });
  const tl = gsap.timeline({ paused: true });
  cards.forEach((card, i) => {
    const at = i * 0.12; // reading order, left → right
    tl.to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.95, ease: FF.ease.soft }, at);
    tl.to(tags[i], { autoAlpha: 1, y: 0, duration: 0.6, ease: FF.ease.out }, at + 0.3);
  });
  ScrollTrigger.create({
    trigger: sec.querySelector('.s-success__steps'),
    start: 'top 90%',
    once: true,
    onEnter: () => tl.play(),
  });

  /* ---------- Hold while Programs slides over (Papumba-style) ----------
     CSS sticky inside .s-success-wrap (a ScrollTrigger pin uses position:fixed, which breaks under the root
     fit-zoom). The wrapper gets the extra hold distance D plus margin-bottom −D, so 05 and everything below keep
     their positions; the section's sticky top makes it hold once its bottom meets the viewport bottom. */
  const wrap = sec.parentElement && sec.parentElement.classList.contains('s-success-wrap') ? sec.parentElement : null;
  const next = document.querySelector('.s-programs');
  if (wrap && next) {
    const size = () => {
      const vh = window.innerHeight / (FF.zoom || 1); // viewport height in layout px
      const H = sec.offsetHeight;
      const D = Math.min(vh, H);                      // 05 travels this far to cover us completely
      wrap.style.height = H + D + 'px';
      wrap.style.marginBottom = -D + 'px';
      sec.style.top = Math.min(0, vh - H) + 'px';
    };
    size();
    ScrollTrigger.addEventListener('refreshInit', size);

    // No scale or dim on the covered section (user feedback): it simply holds while 05 and its clouds rise over it.

    // Keep trigger order top-to-bottom (03 pins above us) and recalc once everything is set up.
    requestAnimationFrame(() => { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
  }
});
