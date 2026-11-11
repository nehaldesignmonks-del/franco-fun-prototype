/* Checkout — plan from ?plan=essential|progression|intensive (default progression),
   optional Club add-on that updates the order summary (line in/out + animated total). */
(function () {
  // Plan names, per-class prices and totals from the pricing section (Figma 2134:11821).
  const PLANS = {
    essential:   { name: 'ESSENTIAL',   classes: 5,  per: '$21',    total: 105 },
    progression: { name: 'PROGRESSION', classes: 10, per: '$19.50', total: 195 },
    intensive:   { name: 'INTENSIVE',   classes: 20, per: '$18.50', total: 370 },
  };
  const DISCOUNT = 10;          // "Register now discount −$10"
  const CLUB_1_2 = 24.99;       // "1–2 classes a week · $24.99/month" (3+ is Free)

  const q = new URLSearchParams(location.search);
  const planKey = PLANS[(q.get('plan') || '').toLowerCase()] ? q.get('plan').toLowerCase() : 'progression';
  const plan = PLANS[planKey];

  const $ = (k) => document.querySelector(`[data-co="${k}"]`);
  const el = {
    chip: $('chip'), classes: $('classes'), per: $('per'), pack: $('pack'),
    clubLine: $('clubLine'), clubSub: $('clubSub'), clubPrice: $('clubPrice'),
    total: $('total'), note: $('note'), pay: $('pay'), payLink: $('payLink'),
    bar: $('bar'), barChip: $('barChip'), barTotal: $('barTotal'),
  };
  const addon = document.querySelector('.co-addon');
  const club = document.getElementById('co-club');
  const tiers = Array.from(document.querySelectorAll('input[name="co-tier"]'));
  const tick = document.querySelector('.co-box__tick');
  const box = document.querySelector('.co-box');

  const money = (v, cents) => '$' + (cents ? v.toFixed(2) : String(Math.round(v)));
  const hasCents = (v) => Math.round(v * 100) % 100 !== 0;

  // ---- Static plan details (before first paint of the summary) ----
  el.chip.textContent = plan.name;
  if (el.barChip) el.barChip.textContent = plan.name;
  el.classes.textContent = plan.classes + ' individual classes';
  el.per.textContent = plan.per + ' per class';
  el.pack.textContent = money(plan.total);
  el.payLink.href = 'club-unlocked.html?from=checkout&plan=' + planKey;

  const state = () => {
    const on = club.checked;
    const tier = (tiers.find((t) => t.checked) || {}).value || '3+';
    const clubCost = on && tier === '1-2' ? CLUB_1_2 : 0;
    return { on, tier, total: plan.total - DISCOUNT + clubCost };
  };

  let shownTotal = state().total;
  let totalTween = null;
  const paintTotal = (v, cents) => {
    const s = money(v, cents);
    el.total.textContent = s;
    el.pay.textContent = 'Pay ' + s;
    if (el.barTotal) el.barTotal.textContent = s;
  };
  paintTotal(shownTotal, hasCents(shownTotal));

  const canAnimate = () => !!(window.gsap && window.FF && FF.inited && !FF.motionOff);

  // Collapse/expand a summary block. The summary is a flex column with a 16px gap,
  // so a collapsed block also pulls up by -16px to cancel its gap.
  function showBlock(node, show, animate) {
    if (!animate) {
      if (window.gsap) gsap.set(node, { clearProps: 'height,marginTop,opacity,visibility,overflow' });
      node.hidden = !show;
      return;
    }
    gsap.killTweensOf(node);
    if (show) {
      if (node.hidden) { node.hidden = false; gsap.set(node, { height: 0, marginTop: -16, autoAlpha: 0 }); }
      gsap.set(node, { overflow: 'hidden' });
      gsap.to(node, {
        height: 'auto', marginTop: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out',
        onComplete: () => gsap.set(node, { clearProps: 'height,marginTop,opacity,visibility,overflow' }),
      });
      gsap.fromTo(node.firstElementChild, { y: -10 }, { y: 0, duration: 0.7, ease: FF.ease.soft, clearProps: 'transform' });
    } else {
      if (node.hidden) return;
      gsap.set(node, { overflow: 'hidden' });
      gsap.to(node, {
        height: 0, marginTop: -16, autoAlpha: 0, duration: 0.38, ease: 'power2.inOut',
        onComplete: () => { node.hidden = true; gsap.set(node, { clearProps: 'height,marginTop,opacity,visibility,overflow' }); },
      });
    }
  }

  // Quick vertical flip for a short text change ("Free" → "$24.99").
  function swapText(node, text, animate) {
    if (node.textContent === text) return;
    if (!animate) { node.textContent = text; return; }
    gsap.killTweensOf(node);
    gsap.to(node, {
      yPercent: -70, autoAlpha: 0, duration: 0.14, ease: 'power2.in',
      onComplete: () => {
        node.textContent = text;
        gsap.fromTo(node, { yPercent: 70, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: 'back.out(2.2)' });
      },
    });
  }

  function setTotal(v, animate) {
    if (totalTween) totalTween.kill();
    const cents = hasCents(v) || hasCents(shownTotal);
    if (!animate || v === shownTotal) { shownTotal = v; paintTotal(v, hasCents(v)); return; }
    const o = { v: shownTotal };
    totalTween = gsap.to(o, {
      v, duration: 0.6, ease: 'power2.out',
      onUpdate: () => { shownTotal = o.v; paintTotal(o.v, cents); },
      onComplete: () => { shownTotal = v; paintTotal(v, hasCents(v)); },
    });
    gsap.fromTo([el.total, el.barTotal].filter(Boolean), { scale: 1.16 }, { scale: 1, duration: 0.9, ease: FF.ease.pop, overwrite: 'auto' });
  }

  function render(animate) {
    const s = state();
    addon.classList.toggle('is-off', !s.on);
    showBlock(el.clubLine, s.on, animate);
    showBlock(el.note, s.on, animate);
    swapText(el.clubSub, s.tier === '1-2' ? '1–2 classes a week' : '3+ classes a week', animate && s.on);
    swapText(el.clubPrice, s.tier === '1-2' ? '$24.99' : 'Free', animate && s.on);
    el.clubPrice.parentElement.classList.toggle('is-paid', s.tier === '1-2');
    setTotal(s.total, animate);
  }
  render(false);

  club.addEventListener('change', () => {
    const animate = canAnimate();
    if (animate) {
      gsap.killTweensOf(tick);
      if (club.checked) {
        gsap.fromTo(tick, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.35, ease: 'power2.out' });
        gsap.fromTo(box, { scale: 0.7 }, { scale: 1, duration: 0.8, ease: FF.ease.pop, clearProps: 'transform' });
      } else {
        gsap.set(tick, { clearProps: 'all' });
      }
    }
    render(animate);
  });

  tiers.forEach((t) => t.addEventListener('change', () => {
    if (!club.checked) {               // picking a plan option re-adds the Club
      club.checked = true;
      club.dispatchEvent(new Event('change'));
      return;
    }
    render(canAnimate());
  }));
  // Phones/tablets: the compact total bar slides away while the order summary itself is on screen.
  const sum = document.getElementById('co-summary');
  if (el.bar && sum && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => el.bar.classList.toggle('is-away', e.isIntersecting), { threshold: 0.15 }).observe(sum);
  }

  // Clicking an option while the add-on is off should re-enable it even if that option is already selected.
  document.querySelectorAll('.co-opt').forEach((opt) => opt.addEventListener('click', (e) => {
    if (e.target.tagName === 'INPUT') return; // the label's forwarded click; "change" covers that case
    if (!club.checked && opt.querySelector('input').checked) {
      club.checked = true;
      club.dispatchEvent(new Event('change'));
    }
  }));
})();
