/* 03 · Is your child… — the page's ONE pinned section.
   Pins for ~380px of scroll per question and steps through the six questions (snapping to each,
   with a light, directional snap so it never feels like scroll-jacking). Each swap: old question
   fades out, the new one rises in (clean fade, no bounce on text), the progress pill advances, the image
   does a squash-and-settle and the soft background tint shifts. "Scroll down" advances one question,
   then leaves for the next section. */
FF.onReady((FF) => {
  const sec = document.querySelector('.s-iyc');
  if (!sec) return;
  const btn = sec.querySelector('.s-iyc__next');

  // The pin is a CSS sticky inside .s-iyc-track (not a ScrollTrigger pin: position:fixed pins break
  // under the root fit-to-width zoom). The section that follows is the track's next sibling.
  const track = sec.parentElement && sec.parentElement.classList.contains('s-iyc-track') ? sec.parentElement : null;
  const nextSection = () => (track || sec).nextElementSibling;

  if (FF.motionOff || !window.gsap) {
    // Static mode: question 1 only; the button simply goes to the next section.
    if (btn) btn.addEventListener('click', () => { const n = nextSection(); if (n) n.scrollIntoView(); });
    return;
  }

  const qs = Array.from(sec.querySelectorAll('.s-iyc__q'));
  const N = qs.length;
  const dots = Array.from(sec.querySelectorAll('.s-iyc__progress li'));
  const img = sec.querySelector('.s-iyc__img');
  const bg = sec.querySelector('.s-iyc__bg');
  const bgs = (sec.dataset.bgs || '').split(',').map((s) => s.trim()).filter(Boolean);
  // Design px of scroll per question (× FF.zoom on 1024–1439). Phones/tablets (FF.mobile) use a shorter pin.
  const step = () => (FF.mobile ? 260 : 380);
  const CONTENT_MID = 515;    // vertical centre of the content (title top 140 → button bottom 890)
  const LABEL = sec.getAttribute('data-cursor-label') || 'Start scrolling';

  /* ---------- Questions → words ---------- */
  const words = qs.map((q) => SplitText.create(q, { type: 'words', wordsClass: 's-iyc__w' }).words);
  qs.forEach((q, i) => {
    gsap.set(q, { visibility: 'visible' });
    if (i) gsap.set(words[i], { autoAlpha: 0 });
  });

  let cur = 0;
  let squash = null;
  const inTw = [], outTw = []; // per-question tween handles

  function show(i, dir) {
    if (i === cur) return;
    const prev = cur;
    cur = i;
    qs.forEach((q, k) => {
      q.classList.toggle('is-active', k === i);
      q.setAttribute('aria-hidden', k === i ? 'false' : 'true');
    });
    dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
    // Cursor chip: "Start scrolling" while there are more questions; none on the last one.
    sec.setAttribute('data-cursor-label', i < N - 1 ? LABEL : '');

    // Out: every other question's own in/out tweens are killed by handle first (killTweensOf misses staggered
    // tweens), so a delayed fade-in from a fast scroll — or scrolling back up — can never surface on top of the
    // current question. Visible ones lift/sink away; the rest are hidden at once.
    words.forEach((w, k) => {
      if (k === i) return;
      if (inTw[k]) { inTw[k].kill(); inTw[k] = null; }
      if (outTw[k]) { outTw[k].kill(); outTw[k] = null; }
      if (k === prev && w.some((el) => gsap.getProperty(el, 'opacity') > 0.01)) { // only the question we just left fades out
        outTw[k] = gsap.to(w, { y: -dir * 26, autoAlpha: 0, duration: 0.22, ease: 'power2.in', stagger: 0.012 });
      } else {
        gsap.set(w, { autoAlpha: 0, y: 0 });
      }
    });
    // In: the new question rises (forward) or drops (backward) into place with a clean fade.
    if (outTw[i]) { outTw[i].kill(); outTw[i] = null; }
    if (inTw[i]) inTw[i].kill();
    inTw[i] = gsap.fromTo(words[i],
      { y: dir * 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out', stagger: 0.035, delay: 0.16 });

    // Image squash-and-settle.
    if (squash) squash.kill();
    squash = gsap.timeline()
      .to(img, { scaleX: 1.04, scaleY: 0.94, duration: 0.14, ease: 'power2.out' })
      .to(img, { scaleX: 1, scaleY: 1, duration: 0.9, ease: 'elastic.out(1, 0.35)' });

    // Background tint.
    if (bg && bgs.length) gsap.to(bg, { backgroundColor: bgs[i] || '#fff', duration: 0.6, ease: 'power2.out', overwrite: true });
  }

  /* ---------- Pin (sticky) ----------
     Lengths in CSS px are design px; scroll positions are viewport px = CSS px × FF.zoom. */
  const zoom = () => FF.zoom || 1;
  // CSS px: desktop centres the 1030px frame's content in the viewport; under 1024 the section is one
  // viewport tall (CSS) with its content already centred, so it simply sticks at the top.
  const stickOffset = () => (FF.mobile ? 0 : CONTENT_MID - window.innerHeight / zoom() / 2);
  function layout() {
    if (!track) return;
    const secH = parseFloat(getComputedStyle(sec).height) || 1030;
    track.style.height = secH + step() * (N - 1) + 'px';
    track.style.setProperty('--iyc-top', -Math.round(stickOffset()) + 'px');
    track.classList.add('is-pinning');
  }
  layout();
  ScrollTrigger.addEventListener('refreshInit', layout);

  let settled = 0; // last question we snapped to
  const st = ScrollTrigger.create({
    trigger: track || sec,
    start: () => {
      const off = Math.round(stickOffset() * zoom());
      return off >= 0 ? `top+=${off} top` : `top-=${-off} top`;
    },
    end: () => `+=${Math.round(step() * (N - 1) * zoom())}`,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const i = Math.round(self.progress * (N - 1));
      if (i !== cur) show(i, i > cur ? 1 : -1);
    },
    onEnter: () => { settled = 0; },
    onEnterBack: () => { settled = N - 1; },
  });
  // The track's extra height arrived after other triggers were measured: refresh once every section is set up.
  requestAnimationFrame(() => ScrollTrigger.refresh());

  const yFor = (k) => st.start + (k / (N - 1)) * (st.end - st.start);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const scrollTo = (target, duration) => {
    if (FF.lenis) FF.lenis.scrollTo(target, { duration, easing: easeOut });
    else window.scrollTo({ top: typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' });
  };

  /* ---------- Light directional snap (after the scroll comes to rest) ---------- */
  let timer = null;
  function trySnap() {
    if (!st.isActive) return;
    const f = st.progress * (N - 1);
    const d = f - settled;
    let t;
    if (Math.abs(d) > 1) t = Math.round(f);                 // big flick: nearest question
    else if (d > 0.18) t = settled + 1;                      // nudged forward → next question
    else if (d < -0.18) t = settled - 1;                     // nudged back → previous question
    else t = settled;                                        // tiny move → settle back
    t = gsap.utils.clamp(0, N - 1, t);
    settled = t;
    const y = yFor(t);
    if (Math.abs(window.scrollY - y) > 2) scrollTo(y, 0.55);
  }
  const onScroll = () => { clearTimeout(timer); timer = setTimeout(trySnap, 140); };
  if (FF.lenis) FF.lenis.on('scroll', onScroll);
  else window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- "Scroll down": next question, then the next section ---------- */
  if (btn) btn.addEventListener('click', () => {
    if (cur < N - 1) {
      settled = cur + 1;
      scrollTo(yFor(cur + 1), 0.75);
    } else {
      const n = nextSection();
      scrollTo(n || st.end + window.innerHeight * 0.6, 1);
    }
  });
});
