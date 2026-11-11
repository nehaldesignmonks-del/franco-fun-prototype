/* 10 · FAQ — accordion (works in every mode; animated only when motion is on) + drifting character strip. */
(function () {
  function initAccordion() {
    const sec = document.getElementById('faq');
    if (!sec) return;
    const root = document.documentElement;
    const items = Array.from(sec.querySelectorAll('.s-faq__item'));
    const animated = () => !!window.gsap && !root.classList.contains('motion-off');

    function setOpen(item, open) {
      if (item.classList.contains('is-open') === open) return;
      const btn = item.querySelector('.s-faq__btn');
      const panel = item.querySelector('.s-faq__panel');
      const answer = item.querySelector('.s-faq__answer');
      const from = panel.getBoundingClientRect().height;
      if (animated()) gsap.killTweensOf([panel, answer]);
      panel.style.height = '';
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      if (!animated()) return;
      if (open) {
        const to = panel.offsetHeight; // natural height (CSS: auto when open)
        gsap.fromTo(panel, { height: from }, { height: to, duration: 0.6, ease: 'power3.out', clearProps: 'height' });
        gsap.fromTo(answer, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.08, ease: 'power2.out', clearProps: 'opacity,visibility,transform' });
      } else {
        gsap.fromTo(panel, { height: from, visibility: 'visible' }, { height: 0, duration: 0.45, ease: 'power3.inOut', clearProps: 'height,visibility' });
      }
    }

    items.forEach((item) => {
      item.querySelector('.s-faq__btn').addEventListener('click', () => {
        const open = !item.classList.contains('is-open');
        items.forEach((other) => { if (other !== item) setOpen(other, false); });
        setOpen(item, open);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAccordion);
  else initAccordion();
})();

FF.onReady((FF) => {
  if (FF.motionOff) return;
  const sec = document.getElementById('faq');
  const track = sec && sec.querySelector('.s-faq__chars-track');
  if (!track) return;

  /* Seamless drift: one loop = 6 characters (measured, so it fits each breakpoint). Scrolling gives it a little push. */
  let drift = null, boost = 0;
  const build = () => {
    const period = track.children[6].offsetLeft - track.children[0].offsetLeft;
    drift = gsap.to(track, { x: -period, duration: 44 * period / 1044, ease: 'none', repeat: -1, paused: true });
    ScrollTrigger.create({
      trigger: sec, start: 'top bottom', end: 'bottom+=200 top',
      onToggle: (s) => (s.isActive ? drift.play() : drift.pause()),
      onUpdate: (s) => { boost = Math.max(boost, Math.min(Math.abs(s.getVelocity()) / 250, 6)); },
    });
    return () => { drift = null; };
  };
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', build);
  mm.add('(max-width: 1023px)', build);
  gsap.ticker.add(() => {
    boost *= 0.94;
    if (drift) drift.timeScale(1 + boost);
  });
});
