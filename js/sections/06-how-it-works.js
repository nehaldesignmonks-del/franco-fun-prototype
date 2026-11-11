/* 06 · How it works — the signature route.
   Desktop (≥ 1024): the route draws itself as you scroll (scrubbed, not pinned) from when its top reaches
   70% of the viewport to when its end reaches 60%. A small node-style traveller rides the drawing tip
   (MotionPathPlugin). Each step node bounces in (elastic pop + CustomBounce squash) the moment the tip
   reaches it, then its text slides in (no bounce); clay characters pop just before the tip arrives;
   the CTA rises in at the end. Nodes, step text and characters un-reveal tidily when the tip retreats
   on scroll up (the CTA stays once shown).
   Run-in / run-off: the route's first segment is continued up-right to just beyond the viewport's right
   edge, and its last segment left to just beyond the left edge (any width / FF.zoom; recomputed on
   resize). They are separate paths drawn before / after the route, each over a little extra scroll
   (at the route's average line speed), so the route/node/character scroll mapping is unchanged.

   Mobile (< 1024): the same idea in one column. A gently waving line runs down the left lane through
   the nodes (built from the live layout, rebuilt on resize), enters from the left edge above step 1
   and leaves bottom-left past Omar. Same draw / traveller / node / text / character behaviour.

   gsap.matchMedia builds the right version and reverts it cleanly when the window crosses 1024.

   Node timing: the path is sampled along its length (getPointAtLength); each node's trigger is the
   length fraction of the sample closest to the node's centre (characters: closest to their feet). */
FF.onReady((FF) => {
  const sec = document.getElementById('how-it-works');
  if (!sec) return;
  const q = (s, el = sec) => el.querySelector(s);
  const qa = (s, el = sec) => Array.from(el.querySelectorAll(s));
  const frame = q('.ff-frame');
  const nodes = qa('.s-hiw__node');
  const cta = q('.s-hiw__cta-pop');

  /* ---------- Shared helpers ---------- */
  // Sample a path along its length: closest-point lookup + an optional pacing curve.
  function sampler(path, N, ox = 0, oy = 0) {
    const len = path.getTotalLength();
    const xs = new Float64Array(N + 1), ys = new Float64Array(N + 1);
    for (let i = 0; i <= N; i++) {
      const p = path.getPointAtLength((len * i) / N);
      xs[i] = p.x + ox; ys[i] = p.y + oy;
    }
    const fracAt = (cx, cy) => { // length fraction (0–1) of the route point closest to (cx, cy)
      let best = 0, bd = Infinity;
      for (let i = 0; i <= N; i++) {
        const d = (xs[i] - cx) ** 2 + (ys[i] - cy) ** 2;
        if (d < bd) { bd = d; best = i; }
      }
      return best / N;
    };
    return { len, xs, ys, N, fracAt };
  }
  // Offset of el inside the frame (layout px, ignores transforms).
  function inFrame(el) {
    let x = 0, y = 0;
    for (let e = el; e && e !== frame; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }
  const debounce = (fn, ms) => { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; };

  // Reveal / un-reveal machinery shared by both layouts.
  function revealer({ steps, chars, tipDot, drop }) {
    let ctaOn = false, tipOn = false;
    const R = {
      showStep(st) {
        st.on = true;
        if (st.anim) st.anim.kill();
        st.anim = gsap.timeline()
          .fromTo(st.node, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 1, ease: FF.ease.pop }, 0)
          .fromTo(st.body, { y: -drop }, { y: 0, duration: 0.8, ease: 'ffBounce' }, 0)
          .fromTo(st.body, { scaleX: 1, scaleY: 1 }, { scaleX: 1.2, scaleY: 0.8, duration: 0.8, ease: 'ffBounce-squash', transformOrigin: '50% 100%' }, 0)
          .fromTo(st.lines, { autoAlpha: 0, x: 28 * st.dir }, { autoAlpha: 1, x: 0, duration: 0.6, ease: FF.ease.out, stagger: 0.07 }, 0.16);
      },
      hideStep(st) {
        st.on = false;
        if (st.anim) st.anim.kill();
        st.anim = gsap.timeline()
          .to(st.lines, { autoAlpha: 0, x: 16 * st.dir, duration: 0.25, ease: 'power2.in', stagger: { each: 0.04, from: 'end' } }, 0)
          .to(st.node, { autoAlpha: 0, scale: 0.3, duration: 0.3, ease: 'back.in(2)' }, 0.05)
          .set(st.body, { y: 0, scaleX: 1, scaleY: 1 });
      },
      popChar(c) { c.on = true; gsap.to(c.pop, { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.2, ease: FF.ease.pop, overwrite: true }); },
      hideChar(c) { c.on = false; gsap.to(c.pop, { autoAlpha: 0, scale: 0.4, rotation: gsap.utils.random(-14, 14, 1), duration: 0.3, ease: 'back.in(1.7)', overwrite: true }); },
      popCta() {
        if (ctaOn) return;
        ctaOn = true;
        gsap.to(cta, { autoAlpha: 1, y: 0, duration: 0.8, ease: FF.ease.out, overwrite: true }); // a button is text: calm rise, no bounce
      },
      setTip(v) {
        if (v === tipOn) return;
        tipOn = v;
        gsap.to(tipDot, v ? { scale: 1, duration: 0.5, ease: 'back.out(2.5)', overwrite: true }
          : { scale: 0, duration: 0.25, ease: 'power2.in', overwrite: true });
      },
      start() { // start states
        gsap.set(tipDot, { scale: 0, transformOrigin: '50% 50%' });
        steps.forEach((st) => { gsap.set(st.node, { autoAlpha: 0, scale: 0.3 }); gsap.set(st.lines, { autoAlpha: 0, x: 28 * st.dir }); });
        chars.forEach((c) => gsap.set(c.pop, { autoAlpha: 0, scale: 0.4, rotation: gsap.utils.random(-14, 14, 1), transformOrigin: '50% 100%' }));
        gsap.set(cta, { autoAlpha: 0, y: 18 });
      },
      update(f) { // f = drawn fraction of the route
        for (const st of steps) {
          if (f >= st.f && !st.on) R.showStep(st); // revealed steps stay: no slide-out/in when nudging the scroll
        }
        for (const c of chars) {
          if (f >= c.f && !c.on) R.popChar(c);
        }
        if (!ctaOn && f >= 0.95) R.popCta();
      },
      teardown() { // undo everything the (non-context) reveal tweens touched
        steps.forEach((st) => st.anim && st.anim.kill());
        const els = [...steps.flatMap((st) => [st.node, st.body, ...st.lines]), ...chars.map((c) => c.pop), cta, tipDot];
        gsap.killTweensOf(els);
        gsap.set(els, { clearProps: 'opacity,visibility,transform' });
      },
    };
    return R;
  }
  const stepParts = (node) => {
    const li = node.closest('.s-hiw__step');
    const info = q('.s-hiw__info', li);
    return { li, node, info, body: q('.s-hiw__node-body', li), lines: Array.from(info.children), on: false, anim: null };
  };

  /* ---------- One build per layout; matchMedia reverts the other ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', () => desktop());
  mm.add('(max-width: 1023px)', () => mobile());

  /* ======================= Desktop ======================= */
  function desktop() {
    const svg = q('.s-hiw__route');
    const path = q('.s-hiw__route-path');
    const pre = q('.s-hiw__route-pre');
    const ext = q('.s-hiw__route-ext');
    const tip = q('.s-hiw__tip');
    const tipDot = q('.s-hiw__tip-dot', tip);

    /* Run-in (right edge) and run-off (left edge) */
    const A = { x: 1443.3, y: 7 };        // route start, svg units
    const AD = { x: 325.8, y: -37.76 };    // first segment's start tangent, reversed (points up-right, off the route)
    const ADn = Math.hypot(AD.x, AD.y);
    const X0 = 7, Y0 = 1954.34;            // route end, svg units (its last tangent is horizontal, heading left)
    const EXIT = 80;                       // how far past the viewport edges the lines go (frame px)
    const edge = { inLen: 0, inX: A.x, inY: A.y, outLen: 0, outX: X0 };
    const docLeft = (el) => { let x = 0; for (; el; el = el.offsetParent) x += el.offsetLeft; return x; };
    function updateEdges() {
      // Viewport edges in svg units. offsetLeft/clientWidth are unzoomed CSS px, so FF.zoom is accounted for;
      // the section is full-bleed, so its box is the viewport's width.
      const svgX = docLeft(frame) + (parseFloat(getComputedStyle(svg).left) || 0); // svg origin, document px
      const secX = docLeft(sec);
      const vpL = secX - svgX;
      const vpR = secX + sec.clientWidth - svgX;
      edge.outX = vpL - EXIT;
      edge.outLen = Math.max(0, X0 - edge.outX);
      ext.setAttribute('d', `M${X0} ${Y0}H${edge.outX.toFixed(1)}`);
      edge.inLen = Math.max(0, (vpR + EXIT - A.x) / (AD.x / ADn));
      edge.inX = A.x + (AD.x / ADn) * edge.inLen;
      edge.inY = A.y + (AD.y / ADn) * edge.inLen;
      pre.setAttribute('d', `M${edge.inX.toFixed(1)} ${edge.inY.toFixed(1)}L${A.x} ${A.y}`); // drawn from the edge in
    }
    updateEdges();

    if (FF.motionOff) { // static: fully drawn; just keep the edge lines sized to the window
      const onResize = debounce(updateEdges, 200);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    let R = null;
    const listeners = [];
    try {
      R = buildDesktop();
    } catch (err) {
      console.error('[06-how-it-works]', err);
      const els = [path, pre, ext, ...qa('.s-hiw__node, .s-hiw__node-body, .s-hiw__info > *, .s-hiw__char-pop, .s-hiw__cta-pop')];
      gsap.killTweensOf(els);
      gsap.set(els, { clearProps: 'opacity,visibility,transform,strokeDasharray,strokeDashoffset' });
      gsap.set(els, { visibility: 'visible' });
      gsap.set(tip, { visibility: 'hidden' });
    }
    return () => { // leaving desktop
      listeners.forEach(([t, fn]) => ScrollTrigger.removeEventListener(t, fn));
      if (R) R.teardown();
      [path, pre, ext].forEach((el) => { el.style.visibility = ''; el.style.strokeDasharray = ''; el.style.strokeDashoffset = ''; });
      tip.style.visibility = ''; gsap.set(tip, { clearProps: 'transform' });
    };

    function buildDesktop() {
      /* 1. Sample the route (svg units = frame px, offset by the svg's CSS position) */
      const cs = getComputedStyle(svg);
      const S = sampler(path, 1200, parseFloat(cs.left) || 0, parseFloat(cs.top) || 0);
      const { len, ys, N } = S;

      /* 2. Pacing: blend length with "how far down the route has reached so far" so the tip stays in a
            calmer band of the viewport on long horizontal runs (PACE = 1 would be plain linear). */
      const PACE = 0.6;
      const s = new Float64Array(N + 1);
      const yTop = ys[0];
      let yMax = yTop;
      for (let i = 0; i <= N; i++) yMax = Math.max(yMax, ys[i]);
      let reach = ys[0]; // lowest point reached so far
      for (let i = 0; i <= N; i++) {
        reach = Math.max(reach, ys[i]);
        s[i] = PACE * (i / N) + (1 - PACE) * ((reach - yTop) / (yMax - yTop || 1));
      }
      const pace = (p) => {
        if (p <= 0) return 0;
        if (p >= 1) return 1;
        let lo = 0, hi = N;
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (s[mid] <= p) lo = mid; else hi = mid; }
        return (lo + (p - s[lo]) / (s[hi] - s[lo] || 1)) / N;
      };

      /* 3. Steps, characters */
      const steps = nodes.map((node) => {
        const st = stepParts(node);
        const nx = node.offsetLeft + node.offsetWidth / 2, ny = node.offsetTop + node.offsetHeight / 2;
        st.dir = st.info.offsetLeft + st.info.offsetWidth / 2 < nx ? 1 : -1; // text starts nudged towards its node
        st.f = S.fracAt(nx, ny);
        return st;
      });
      const LEAD = 0.03; // characters pop slightly before the tip reaches them, so they "wait" for it
      const chars = qa('.s-hiw__char').map((el) => ({
        pop: q('.s-hiw__char-pop', el),
        f: Math.max(0.01, S.fracAt(el.offsetLeft + el.offsetWidth / 2, el.offsetTop + el.offsetHeight) - LEAD),
        on: false,
      }));
      const R = revealer({ steps, chars, tipDot, drop: 30 });

      /* 4. Start states */
      gsap.set(path, { drawSVG: '0% 0%', visibility: 'hidden' });
      gsap.set([pre, ext], { visibility: 'hidden' });
      gsap.set(tip, { visibility: 'visible' });
      R.start();

      /* 5. The scrubbed draw
         One linear driver u (0–1) is scrubbed over [route start − run-in room, route end + run-off room].
         Route time t = u·(1 + inDur + outDur) − inDur: t < 0 run-in, 0–1 the route (paced), t > 1 run-off.
         inDur/outDur are the edge lengths at the route's average line speed, so for t in 0–1 the scroll
         mapping is exactly the original one (route top at 70% → route end at 60%). */
      const draw = gsap.fromTo(path, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', ease: 'none', paused: true });
      const ride = gsap.to(tip, { motionPath: { path }, ease: 'none', paused: true }); // tip <g> shares the svg: raw path coords = its x/y
      const inDur = () => (edge.inLen > 0 ? Math.max(0.015, edge.inLen / len) : 0);
      const outDur = () => (edge.outLen > 0 ? Math.max(0.015, edge.outLen / len) : 0);
      const vis = new Map();
      const show = (el, v) => { if (vis.get(el) !== v) { vis.set(el, v); el.style.visibility = v ? 'visible' : 'hidden'; } };
      const dash = (el, d, l) => { el.style.strokeDasharray = `${d.toFixed(2)}px ${(l + 40).toFixed(0)}px`; };

      function sync(u) {
        const di = inDur(), dout = outDur();
        const t = u * (1 + di + dout) - di;
        const ein = t >= 0 ? 1 : di ? Math.max(0, 1 + t / di) : 0;   // run-in drawn fraction
        const f = pace(Math.min(Math.max(t, 0), 1));                 // route drawn fraction
        const eout = t > 1 && dout ? Math.min(1, (t - 1) / dout) : 0; // run-off drawn fraction

        show(pre, ein > 0); if (ein > 0) dash(pre, ein * edge.inLen, edge.inLen);
        show(path, f > 0.0004); draw.progress(f);                     // hidden at 0 so no round-cap dot shows
        show(ext, eout > 0); if (eout > 0) dash(ext, eout * edge.outLen, edge.outLen);

        if (t < 0) gsap.set(tip, { x: edge.inX + (A.x - edge.inX) * ein, y: edge.inY + (A.y - edge.inY) * ein }); // rides in from the edge
        else if (t <= 1) ride.progress(f);
        else gsap.set(tip, { x: X0 + (edge.outX - X0) * eout, y: Y0 });                                        // rides out of view
        R.setTip(u > 0.0005);
        R.update(f);
      }

      // Scroll positions where the route's top reaches 70% / its end reaches 60% (the original range).
      const routeRange = () => {
        const r = svg.getBoundingClientRect();
        const y = window.scrollY;
        return [r.top + y - 0.7 * window.innerHeight, r.bottom + y - 0.6 * window.innerHeight];
      };
      const driver = { u: 0 };
      gsap.to(driver, {
        u: 1, ease: 'none',
        scrollTrigger: {
          trigger: svg, scrub: 0.9,
          start: () => { const [s0, s1] = routeRange(); return s0 - (s1 - s0) * inDur(); },
          end: () => { const [s0, s1] = routeRange(); return s1 + (s1 - s0) * outDur(); },
        },
        onUpdate: () => sync(driver.u),
      });

      // Resize / FF.zoom change: resize the edge lines before ScrollTrigger recomputes positions.
      const onInit = () => updateEdges();
      const onRefresh = () => sync(driver.u);
      ScrollTrigger.addEventListener('refreshInit', onInit);
      ScrollTrigger.addEventListener('refresh', onRefresh);
      listeners.push(['refreshInit', onInit], ['refresh', onRefresh]);

      // The CTA must never be missed: also pop it when it comes into view on its own.
      ScrollTrigger.create({ trigger: cta, start: 'top 85%', once: true, onEnter: R.popCta });
      return R;
    }
  }

  /* ======================= Mobile ======================= */
  function mobile() {
    const svg = q('.s-hiw__mroute');
    const path = q('.s-hiw__mroute-path');
    const grad = q('#s-hiw-mgrad');
    const tip = q('.s-hiw__mtip');
    const tipDot = q('.s-hiw__tip-dot', tip);
    const omar = q('.s-hiw__mchar--omar');
    const geo = { top: 0, bottom: 0 };

    // Build the lane route from the live layout: in from the left edge above step 1, a gentle S-wave
    // through the node centres, down past Omar, out bottom-left.
    function layout() {
      const W = frame.clientWidth, H = frame.clientHeight;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const c = nodes.map((n) => { const r = inFrame(n); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; });
      const x = c[0].x;
      const o = inFrame(omar);
      const yIn = c[0].y - 72, yOut = o.y + o.h - 8;
      const A = Math.min(18, x - 8); // wave amplitude (peak ≈ 0.75 · A off the lane)
      let d = `M-30 ${yIn}C${(x * 0.55).toFixed(1)} ${yIn} ${x} ${c[0].y - 48} ${x} ${c[0].y}`;
      const wave = (y0, y1, s) => { const dy = y1 - y0; return `C${x + s * A} ${(y0 + dy * 0.3).toFixed(1)} ${x + s * A} ${(y0 + dy * 0.7).toFixed(1)} ${x} ${y1}`; };
      for (let i = 1; i < c.length; i++) d += wave(c[i - 1].y, c[i].y, i % 2 ? 1 : -1);
      const yTurn = yOut - 34;
      d += wave(c[c.length - 1].y, yTurn, c.length % 2 ? 1 : -1);
      d += `C${x} ${yOut - 10} ${x - 22} ${yOut} ${x - 46} ${yOut}H-40`;
      path.setAttribute('d', d);
      grad.setAttribute('y1', yIn);
      grad.setAttribute('y2', (yIn + (yOut - yIn) * 0.6).toFixed(1));
      geo.top = yIn; geo.bottom = yOut;

      // Stand each small character centred on the line: the wave moves the line off the lane between
      // nodes, so find where the line actually is at the character's height and centre it there.
      const total = path.getTotalLength();
      const pts = [];
      for (let i = 0; i <= 400; i++) pts.push(path.getPointAtLength((total * i) / 400));
      qa('.s-hiw__mchar').forEach((el) => {
        el.style.left = ''; // back to the CSS spot before measuring
        const r = inFrame(el);
        const cy = r.y + r.h * 0.55;
        let best = null, bd = Infinity;
        for (const p of pts) { if (p.x < 0) continue; const dd = Math.abs(p.y - cy); if (dd < bd) { bd = dd; best = p; } }
        if (!best) return;
        const left = parseFloat(getComputedStyle(el).left) || 0;
        el.style.left = (left + best.x - (r.x + r.w / 2)).toFixed(1) + 'px';
      });
    }
    layout();

    if (FF.motionOff) { // static: fully drawn; rebuild when the layout reflows
      const onResize = debounce(layout, 200);
      window.addEventListener('resize', onResize);
      return () => { window.removeEventListener('resize', onResize); path.removeAttribute('d'); };
    }

    let S, len = 1, ride = null;
    const steps = nodes.map((node) => Object.assign(stepParts(node), { dir: -1, f: 1 }));
    const chars = qa('.s-hiw__mchar').map((el) => ({ el, pop: q('.s-hiw__char-pop', el), f: 1, on: false }));
    const R = revealer({ steps, chars, tipDot, drop: 20 });
    function measure() { // trigger fractions + traveller path for the current layout
      S = sampler(path, 600);
      len = S.len;
      steps.forEach((st) => { const r = inFrame(st.node); st.f = S.fracAt(r.x + r.w / 2, r.y + r.h / 2); });
      chars.forEach((ch) => { const r = inFrame(ch.el); ch.f = Math.max(0.01, S.fracAt(r.x + r.w / 2, r.y + r.h * 0.25) - 0.02); });
      if (ride) ride.kill();
      ride = gsap.to(tip, { motionPath: { path }, ease: 'none', paused: true });
    }
    measure();

    path.style.visibility = 'hidden';
    tip.style.visibility = 'visible';
    R.start();

    let pathOn = false;
    function sync(f) {
      if ((f > 0.0005) !== pathOn) { pathOn = f > 0.0005; path.style.visibility = pathOn ? 'visible' : 'hidden'; }
      path.style.strokeDasharray = `${(f * len).toFixed(1)}px ${(len + 40).toFixed(0)}px`;
      ride.progress(f);
      R.setTip(f > 0.002);
      R.update(f);
    }

    // Draw from when the route's top reaches 80% of the viewport to when its exit reaches 60%.
    const docTop = () => svg.getBoundingClientRect().top + window.scrollY;
    const driver = { u: 0 };
    gsap.to(driver, {
      u: 1, ease: 'none',
      scrollTrigger: {
        trigger: svg, scrub: 0.8,
        start: () => docTop() + geo.top - 0.8 * window.innerHeight,
        end: () => docTop() + geo.bottom - 0.6 * window.innerHeight,
      },
      onUpdate: () => sync(driver.u),
    });
    const onInit = () => { layout(); measure(); };
    const onRefresh = () => sync(driver.u);
    ScrollTrigger.addEventListener('refreshInit', onInit);
    ScrollTrigger.addEventListener('refresh', onRefresh);
    ScrollTrigger.create({ trigger: cta, start: 'top 90%', once: true, onEnter: R.popCta });

    return () => { // leaving mobile
      ScrollTrigger.removeEventListener('refreshInit', onInit);
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      if (ride) ride.kill();
      R.teardown();
      path.removeAttribute('d');
      path.style.visibility = ''; path.style.strokeDasharray = '';
      tip.style.visibility = ''; gsap.set(tip, { clearProps: 'transform' });
    };
  }
});
