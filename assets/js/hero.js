/* =========================================================
   HERO MODULE - STEP 1
   Handles: typing effect, custom cursor, boot-up GSAP reveals,
   status clock, and hero canvas/network background.
   Depends on: GSAP (optional but recommended), existing canvas.
   ========================================================= */
(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* -------------------------------------------------------
     1) TYPING EFFECT
     Headline types character-by-character with a small pause
     after "Access Granted." for dramatic terminal pacing.
  ------------------------------------------------------- */
  const typedEl = document.getElementById('typed-headline');
  const cursorEl = document.querySelector('.typing-cursor');

  // Editable headline text. Replace [Your Name] with your handle/name if desired.
  const HEADLINE_TEXT = "> Initializing secure connection... Access Granted. Welcome to [Your Name]'s Terminal.";

  function renderTypedHTML(text) {
    // Add semantic color spans for key phrases while keeping plain text safe.
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped
      .replace(/^&gt;/, '<span class="prompt-char">&gt;</span>')
      .replace('Access Granted.', '<span class="access-granted">Access Granted.</span>');
  }

  function typeHeadline() {
    if (!typedEl) return;
    typedEl.dataset.text = HEADLINE_TEXT;
    typedEl.setAttribute('data-text', HEADLINE_TEXT);

    if (prefersReduced) {
      typedEl.innerHTML = renderTypedHTML(HEADLINE_TEXT);
      if (cursorEl) cursorEl.classList.add('done');
      return;
    }

    let i = 0;
    const baseDelay = 28; // ms per char
    const pauseAfterGranted = 420; // dramatic pause

    function tick() {
      i += 1;
      const current = HEADLINE_TEXT.slice(0, i);
      typedEl.innerHTML = renderTypedHTML(current);
      // Keep data-text in sync for glitch pseudo-elements
      // Keep full text for glitch pseudo-elements; only visible text types.

      if (i >= HEADLINE_TEXT.length) {
        if (cursorEl) cursorEl.classList.add('done');
        typedEl.setAttribute('data-text', HEADLINE_TEXT);
        return;
      }

      let delay = baseDelay + Math.random() * 22;
      // Slight pause at sentence boundaries for realism
      const ch = HEADLINE_TEXT[i - 1];
      if (ch === '.' || ch === '!') delay += 140;
      if (current.endsWith('Access Granted.')) delay += pauseAfterGranted;

      window.setTimeout(tick, delay);
    }

    // Small boot delay before typing starts
    window.setTimeout(tick, 550);
  }

  /* -------------------------------------------------------
     2) CUSTOM CURSOR (underscore + crosshair)
     Desktop/fine-pointer only. Respects reduced motion.
  ------------------------------------------------------- */
  function initCursor() {
    const core = document.querySelector('.cursor-core');
    const ring = document.querySelector('.cursor-crosshair');
    if (!core || !ring || !isFinePointer || prefersReduced) return;

    document.body.classList.add('has-custom-cursor');

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;

    const render = () => {
      // Crosshair trails slightly for a smooth tactical feel
      rx += (mx - rx) * 0.2;
      ry += (my - ry) * 0.2;
      core.style.transform = `translate(${mx}px, ${my}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      core.style.opacity = '1';
      ring.style.opacity = '1';
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      core.style.opacity = '0';
      ring.style.opacity = '0';
    });

    // Hover state for interactive elements
    const hoverTargets = document.querySelectorAll('a, button, .scan-hover, .glitch-hover, input, textarea');
    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });

    requestAnimationFrame(render);
  }

  /* -------------------------------------------------------
     3) SYSTEM CLOCK (small dashboard detail)
  ------------------------------------------------------- */
  function initClock() {
    const el = document.getElementById('system-time');
    if (!el) return;
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const d = new Date();
      el.textContent = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
    };
    tick();
    window.setInterval(tick, 1000);
  }

  /* -------------------------------------------------------
     4) GSAP BOOT-UP REVEALS
     Elements with .boot-seq "boot up" on load.
  ------------------------------------------------------- */
  function initBootSequence() {
    const items = document.querySelectorAll('.boot-seq');
    if (!items.length) return;

    if (prefersReduced || !window.gsap) {
      items.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }

    // Staggered boot-up reveal
    window.gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.75,
      ease: 'power3.out',
      stagger: 0.12,
      delay: 0.15
    });

    // Animate status bars filling in
    const bars = document.querySelectorAll('.status-bar span');
    window.gsap.from(bars, {
      scaleX: 0,
      duration: 1,
      ease: 'power2.out',
      stagger: 0.08,
      delay: 0.55,
      transformOrigin: 'left center'
    });
  }

  /* -------------------------------------------------------
     5) HERO CANVAS NETWORK (kept lightweight)
     Subtle node network; respects reduced motion.
  ------------------------------------------------------- */
  function initHeroCanvas() {
    const c = document.getElementById('hero-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1, pts = [], raf;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(22, Math.floor((w * h) / 30000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.4 + 0.4
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;

        ctx.fillStyle = 'rgba(0,255,65,0.35)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();

        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 14000) {
            const a = (1 - dist2 / 14000) * 0.10;
            ctx.strokeStyle = `rgba(255,48,48,${a})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    function drawStatic() {
      ctx.clearRect(0, 0, w, h);
      pts.forEach((p) => {
        ctx.fillStyle = 'rgba(0,255,65,0.35)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
    }

    resize();
    if (prefersReduced) drawStatic();
    else draw();

    window.addEventListener('resize', () => { resize(); if (prefersReduced) drawStatic(); });
    document.addEventListener('visibilitychange', () => {
      if (prefersReduced) return;
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(draw);
    });
  }

  /* -------------------------------------------------------
     INIT
  ------------------------------------------------------- */
  function init() {
    typeHeadline();
    initCursor();
    initClock();
    initBootSequence();
    initHeroCanvas();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

