/* Membership — ?tier= preselects a card (the 2px lime border):
     family (default) ← free | reduced | family | current | existing | 3plus | 1-2 | login
     new              ← new | new-family | monthly | register
   Focusing or clicking into a card selects it; Enter in a field follows that card's button. */
(function () {
  const cards = Array.from(document.querySelectorAll('.mb-opt'));
  if (!cards.length) return;
  const NEW = ['new', 'new-family', 'newfamily', 'monthly', 'register', 'new-families-monthly'];
  const tier = (new URLSearchParams(location.search).get('tier') || '').toLowerCase();
  const pick = NEW.includes(tier) ? 'new' : 'family';

  const canAnimate = () => !!(window.gsap && window.FF && FF.inited && !FF.motionOff);

  function select(card, animate) {
    if (card.classList.contains('is-selected')) return;
    cards.forEach((c) => c.classList.toggle('is-selected', c === card));
    if (animate) gsap.fromTo(card, { scale: 0.985 }, { scale: 1, duration: 0.7, ease: FF.ease.pop });
  }
  select(cards.find((c) => c.dataset.mb === pick) || cards[0], false);

  cards.forEach((card) => {
    card.addEventListener('focusin', () => select(card, canAnimate()));
    card.addEventListener('pointerdown', () => select(card, canAnimate()));
    const cta = card.querySelector('.mb-opt__cta');
    card.querySelectorAll('input').forEach((input) => input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && cta) { e.preventDefault(); location.href = cta.href; }
    }));
  });

  // Included row: near the bottom of a short page, so it plays on load instead of waiting for a scroll trigger.
  FF.onReady((FF) => {
    if (FF.motionOff) return;
    const items = gsap.utils.toArray('.mb__incl .pg-tick');
    const ticks = items.map((li) => li.querySelector('svg'));
    gsap.set(items, { autoAlpha: 0, y: 20 });
    gsap.set(ticks, { scale: 0.4, rotation: () => gsap.utils.random(-14, 14, 1) });
    // On phones/tablets the cards stack and the row sits well below the fold, so there it waits for its scroll.
    const st = FF.mobile ? { trigger: '.mb__incl', start: 'top 92%', once: true } : undefined;
    const d = FF.mobile ? 0 : 0.55;
    gsap.to(items, { autoAlpha: 1, y: 0, duration: 0.9, ease: FF.ease.out, stagger: 0.08, delay: d, scrollTrigger: st });
    gsap.to(ticks, { scale: 1, rotation: 0, duration: 1.2, ease: FF.ease.pop, stagger: 0.08, delay: d + 0.1, scrollTrigger: st && { ...st } });
  });
})();
