/* 11 · Footer — card rises in, contents stagger, socials pop;
   cloud bank + sky ribbon get scroll parallax (cursor depth comes from data-depth in the markup). */
FF.onReady((FF) => {
  if (FF.motionOff) return;
  const foot = document.getElementById('footer');
  if (!foot) return;

  const card = foot.querySelector('.s-footer__card');
  const reveals = foot.querySelectorAll('.s-footer__reveal');
  const rule = foot.querySelector('.s-footer__rule');
  const socials = foot.querySelectorAll('.s-footer__social a');

  /* ---------- Card rises in ---------- */
  gsap.set(card, { y: 120, autoAlpha: 0 }); // the card is all text: rise + fade, no scale/overshoot
  gsap.set(reveals, { y: 24, autoAlpha: 0 });
  gsap.set(rule, { scaleX: 0 });
  gsap.set(socials, { scale: 0, rotation: -25 });
  ScrollTrigger.create({
    trigger: foot, start: 'top+=300 bottom', once: true,
    onEnter: () => {
      const tl = gsap.timeline();
      tl.to(card, { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out' })
        .to(reveals, { y: 0, autoAlpha: 1, duration: 0.7, ease: FF.ease.out, stagger: 0.07 }, 0.3)
        .to(rule, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 0.45)
        .to(socials, { scale: 1, rotation: 0, duration: 1, ease: FF.ease.pop, stagger: 0.08 }, 0.7);
    },
  });

  /* ---------- Scroll parallax (scrubbed, no pinning) ----------
     Footer is the last thing on the page, so the range ends when its bottom meets the viewport bottom —
     and ends at 0 so the resting state at the very bottom is exactly the Figma layout. */
  const scrub = (el, px) => gsap.fromTo(el, { '--sy': px + 'px' }, {
    '--sy': '0px', ease: 'none',
    scrollTrigger: { trigger: foot, start: 'top bottom', end: 'bottom bottom', scrub: true },
  });
  scrub(foot.querySelector('.s-footer__ribbon'), 70);
  const puffSpeeds = [18, 26, 12, 30, 16, 8, 28, 14, 22, 16]; // varied so the scallops shift against each other
  foot.querySelectorAll('.s-footer__puff').forEach((p, i) => scrub(p, puffSpeeds[i % puffSpeeds.length]));
});
