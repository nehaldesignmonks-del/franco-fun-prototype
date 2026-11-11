/* 05 · Programs — section-specific motion:
   · cloud edge: attached to the top edge, rises together with the blue section over the held Success System
   · Soleil's star rays turn slowly (face stays upright) · sparkles twinkle
   · card hover: the 3D icon (or Mme Joëlle) floats up and follows the cursor inside the card
   · Mme Joëlle rises into the Oral card · LS tablet floats very gently · LS feature pills fade up in sequence
   · clay é drops in with a squashy bounce. (Clouds, icons, cards, headings use the shared data-attributes.) */
FF.onReady((FF) => {
  if (FF.motionOff) return;
  const sec = document.querySelector('.s-programs');
  if (!sec) return;

  /* Cloud edge (Papumba-style): the cloud bank is fixed to our top edge and rises together with the blue
     background as Programs slides up over the held Success System — no separate layer offsets, so the
     flat blue edge is never revealed. */

  /* Soleil: rotate only the star (it is a clip path over a fixed gradient, so the clay lighting stays put). */
  const rays = sec.querySelector('.s-programs__rays');
  if (rays) {
    const spin = { a: 0 };
    gsap.to(spin, {
      a: 360, duration: 40, ease: 'none', repeat: -1,
      onUpdate: () => rays.setAttribute('transform', `rotate(${spin.a.toFixed(2)} 99.115 85.995)`),
    });
  }

  /* Sparkles: gentle twinkle on the inner svg (the wrapper keeps pop/float/parallax). */
  sec.querySelectorAll('.s-programs__sparkle svg').forEach((svg, i) => {
    gsap.to(svg, {
      scale: 0.55, opacity: 0.65, transformOrigin: '50% 50%',
      duration: 1.3 + i * 0.35, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.2 + i * 0.6,
    });
  });

  /* Oral card: soft circle swells, Mme Joëlle rises in from the card's bottom edge (the card clips her). */
  const oral = sec.querySelector('.s-programs__card--oral');
  const joelle = sec.querySelector('.s-programs__joelle-in');
  const oralBg = sec.querySelector('.s-programs__oral-bg');
  if (oral && joelle) {
    gsap.set(joelle, { autoAlpha: 0, y: 120 });
    gsap.set(oralBg, { scale: 0.75, transformOrigin: '50% 50%' });
    ScrollTrigger.create({
      trigger: oral, start: 'top 90%', once: true,
      onEnter: () => {
        gsap.to(oralBg, { scale: 1, duration: 1.1, ease: FF.ease.soft, delay: 0.15 });
        gsap.to(joelle, { autoAlpha: 1, y: 0, duration: 1, ease: FF.ease.soft, delay: 0.3 });
      },
    });
  }

  /* Card hover (desktop + mouse only): the 3D object floats up a little and follows the cursor (±12px, tiny tilt),
     then settles back. On touch / under 1024 the icons just float. */
  gsap.matchMedia().add('(min-width: 1024px) and (hover: hover) and (pointer: fine)', () => {
    const offs = [];
    sec.querySelectorAll('.s-programs__card').forEach((card) => {
      const icon = card.querySelector('.s-programs__icon img');
      const target = icon || card.querySelector('.s-programs__joelle-img');
      if (!target) return;
      const big = !icon; // Mme Joëlle: smaller, slower moves, pivot at her base
      gsap.set(target, { transformOrigin: big ? '50% 80%' : '50% 50%' });
      const opts = { duration: big ? 0.9 : 0.6, ease: FF.ease.out };
      const qx = gsap.quickTo(target, 'x', opts);
      const qy = gsap.quickTo(target, 'y', opts);
      const qr = gsap.quickTo(target, 'rotation', opts);
      const amp = big ? 9 : 12;
      const lift = big ? -6 : -8;
      const move = (e) => {
        const r = card.getBoundingClientRect();
        const nx = gsap.utils.clamp(-1, 1, ((e.clientX - r.left) / r.width) * 2 - 1);
        const ny = gsap.utils.clamp(-1, 1, ((e.clientY - r.top) / r.height) * 2 - 1);
        qx(nx * amp); qy(lift + ny * amp * 0.75); qr(nx * (big ? 2 : 5));
      };
      const leave = () => { qx(0); qy(0); qr(0); };
      card.addEventListener('pointermove', move);
      card.addEventListener('pointerleave', leave);
      offs.push(() => {
        card.removeEventListener('pointermove', move);
        card.removeEventListener('pointerleave', leave);
        gsap.set(target, { x: 0, y: 0, rotation: 0 });
      });
    });
    return () => offs.forEach((off) => off());
  });

  /* LS tablet: very subtle idle float (its own vars, so it composes with the soft pop-in). */
  const tablet = sec.querySelector('.s-programs__tablet-float');
  if (tablet) {
    gsap.fromTo(tablet, { '--tab-y': '3px', '--tab-r': '-0.2deg' }, {
      '--tab-y': '-3px', '--tab-r': '0.2deg', duration: 3.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.6,
    });
  }

  /* Lecture Scientifique™ feature pills (text): fade up one after another — no bounce. */
  const pills = gsap.utils.toArray('.s-programs__pill', sec);
  if (pills.length) {
    gsap.set(pills, { autoAlpha: 0, y: 16 });
    ScrollTrigger.create({
      trigger: sec.querySelector('.s-programs__pills'), start: 'top 95%', once: true,
      onEnter: () => gsap.to(pills, {
        autoAlpha: 1, y: 0, duration: 0.7, ease: FF.ease.out, stagger: 0.08, delay: 0.15,
      }),
    });
  }

  /* Clay é: drops in with the shared squashy bounce (wrapper keeps float + parallax). */
  const eImg = sec.querySelector('.s-programs__e img');
  if (eImg) {
    gsap.set(eImg, { autoAlpha: 0, y: -170 });
    ScrollTrigger.create({
      trigger: sec.querySelector('.s-programs__e'), start: 'top 92%', once: true,
      onEnter: () => {
        gsap.timeline({ delay: 0.2 })
          .to(eImg, { autoAlpha: 1, duration: 0.2 }, 0)
          .to(eImg, { y: 0, duration: 1.15, ease: 'ffBounce' }, 0)
          .to(eImg, { scaleX: 1.22, scaleY: 0.8, transformOrigin: '50% 80%', duration: 1.15, ease: 'ffBounce-squash' }, 0);
      },
    });
  }
});
