/* ============================================================
   EXPERTISE PAGE - PAGE-SPECIFIC ANIMATIONS
   GSAP + ScrollTrigger: staggered panel reveal (clip-path + y)
   Also binds custom cursor hover state for module panels.
   ============================================================ */

(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ------------------------------------------------------------
     1. PAGE HERO ENTRANCE
     Simple fade-up sequence for header elements.
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
     2. MODULE PANEL REVEAL (ScrollTrigger)
     Staggered reveal: clip-path curtain opening + slight y translation.
     ------------------------------------------------------------ */
  function initModuleReveal() {
    const panels = $$('.module-panel');
    if (!panels.length) return;

    if (prefersReduced) {
      panels.forEach((p) => {
        p.style.opacity = '1';
        p.style.transform = 'none';
        p.style.clipPath = 'none';
      });
      return;
    }

    // Initial state: hidden, shifted down, clipped from top
    gsap.set(panels, {
      opacity: 0,
      y: 40,
      clipPath: 'inset(0 0 100% 0)'
    });

    // Animate to visible with stagger
    gsap.to(panels, {
      opacity: 1,
      y: 0,
      clipPath: 'inset(0 0 0% 0)',
      duration: 0.9,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#matrix-grid',
        start: 'top 82%',
        once: true
      }
    });
  }

  /* ------------------------------------------------------------
     3. CUSTOM CURSOR HOVER FOR PANELS
     Phase 1 main.js binds cursor hover to a,b,button,input,textarea,select,[role=button],.btn.
     Module panels need the same expand/color behavior.
     ------------------------------------------------------------ */
  function initPanelCursorHover() {
    const dot = $('#cursor-dot');
    const ring = $('#cursor-ring');
    const panels = $$('.module-panel');
    if (!dot || !ring || !panels.length) return;

    // Also handle any .interactive elements on this page
    const targets = $$('.module-panel, .interactive');
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
     4. INIT - wait for preloader
     ------------------------------------------------------------ */
  function init() {
    if (typeof gsap === 'undefined') {
      console.warn('[expertise.js] GSAP not found. Skipping animations.');
      return;
    }
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    const run = () => {
      initHeroReveal();
      initModuleReveal();
      initPanelCursorHover();
      // Refresh ScrollTrigger after layout settles
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