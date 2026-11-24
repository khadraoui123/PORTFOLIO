/* ============================================================
   RESEARCH PAGE - PAGE-SPECIFIC ANIMATIONS
   GSAP + ScrollTrigger: hero reveal, sequential log "printing" reveal.
   Cursor hover binding for log entries.
   ============================================================ */

(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ------------------------------------------------------------
     0. READING PROGRESS (article content only)
     ------------------------------------------------------------ */
  function initReadingProgress() {
    const bar = $('#scroll-progress-bar');
    const article = $('.logs-section');
    if (!bar || !article) return;

    let ticking = false;

    function update() {
      ticking = false;
      const rect = article.getBoundingClientRect();
      const start = rect.top + window.scrollY;
      const end = start + article.offsetHeight - window.innerHeight;
      const distance = end - start;
      let progress;

      if (distance <= 0) {
        progress = window.scrollY >= start ? 1 : 0;
      } else {
        progress = (window.scrollY - start) / distance;
      }

      bar.style.width = (Math.min(1, Math.max(0, progress)) * 100).toFixed(2) + '%';
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    window.addEventListener('preloaderComplete', requestUpdate, { once: true });
    update();
  }

  /* ------------------------------------------------------------
     1. HERO ENTRANCE
     ------------------------------------------------------------ */
  function initHeroReveal() {
    const items = $$('[data-reveal="hero"]');
    if (!items.length) return;

    if (prefersReduced) {
      items.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }

    gsap.set(items, { opacity: 0, y: 28 });
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.14,
      ease: 'power3.out',
      delay: 0.1
    });
  }

  /* ------------------------------------------------------------
     2. RESEARCH LOGS - SEQUENTIAL "TERMINAL PRINT" REVEAL
     Reveals log entries one by one on scroll, like lines being printed.
     ------------------------------------------------------------ */
  function initLogReveal() {
    const logs = $$('.log-entry');
    if (!logs.length) return;

    if (prefersReduced) {
      logs.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }

    gsap.set(logs, {
      opacity: 0,
      y: 18,
      clipPath: 'inset(0 0 100% 0)'
    });

    gsap.to(logs, {
      opacity: 1,
      y: 0,
      clipPath: 'inset(0 0 0% 0)',
      duration: 0.65,
      stagger: 0.18,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#logs-list',
        start: 'top 82%',
        once: true
      }
    });
  }

  /* ------------------------------------------------------------
     3. CLEARANCE TERMINAL REVEAL
     Subtle entrance for the bottom terminal widget.
     ------------------------------------------------------------ */
  function initClearanceReveal() {
    const terminal = $('.clearance-terminal');
    if (!terminal) return;

    if (prefersReduced) {
      terminal.style.opacity = '1';
      terminal.style.transform = 'none';
      return;
    }

    gsap.set(terminal, { opacity: 0, y: 30 });
    gsap.to(terminal, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: terminal,
        start: 'top 85%',
        once: true
      }
    });
  }

  /* ------------------------------------------------------------
     4. CUSTOM CURSOR HOVER FOR LOG ENTRIES
     ------------------------------------------------------------ */
  function initLogCursorHover() {
    const dot = $('#cursor-dot');
    const ring = $('#cursor-ring');
    if (!dot || !ring) return;

    const targets = $$('.log-entry, .interactive');
    targets.forEach((el) => {
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = 'true';
      el.addEventListener('mouseenter', () => {
        dot.classList.add('is-hovering');
        ring.classList.add('is-hovering');
      });
      el.addEventListener('mouseleave', () => {
        dot.classList.remove('is-hovering');
        ring.classList.remove('is-hovering');
      });
    });
  }

  /* ------------------------------------------------------------
     5. INIT - wait for preloader
     ------------------------------------------------------------ */
  function init() {
    initReadingProgress();

    if (typeof gsap === 'undefined') {
      console.warn('[research.js] GSAP not found. Skipping animations.');
      return;
    }
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    const run = () => {
      initHeroReveal();
      initLogReveal();
      initClearanceReveal();
      initLogCursorHover();
      setTimeout(() => {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      }, 200);
    };

    if (!document.body.classList.contains('is-loading')) {
      run();
    } else {
      window.addEventListener('preloaderComplete', run, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();