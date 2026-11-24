/* ============================================================
   PROJECTS PAGE - PAGE-SPECIFIC ANIMATIONS
   GSAP + ScrollTrigger: hero reveal, staggered case file entrance.
   Also binds custom cursor hover state for case file cards/links.
   ============================================================ */

(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

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
     2. CASE FILE REVEAL (ScrollTrigger)
     Staggered entrance like data loading into a terminal.
     ------------------------------------------------------------ */
  function initCaseFileReveal() {
    const cards = $$('.case-file');
    if (!cards.length) return;

    if (prefersReduced) {
      cards.forEach((c) => { c.style.opacity = '1'; c.style.transform = 'none'; });
      return;
    }

    gsap.set(cards, { opacity: 0, y: 36, scale: 0.985 });

    gsap.to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.75,
      stagger: 0.12,
      ease: 'power3.out',
      clearProps: 'transform',
      scrollTrigger: {
        trigger: '#project-grid',
        start: 'top 82%',
        once: true
      }
    });
  }

  /* ------------------------------------------------------------
     3. CUSTOM CURSOR HOVER FOR CARDS
     ------------------------------------------------------------ */
  function initCardCursorHover() {
    const dot = $('#cursor-dot');
    const ring = $('#cursor-ring');
    if (!dot || !ring) return;

    const targets = $$('.case-file, .case-file__link, .filter-btn, .interactive');
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
      console.warn('[projects.js] GSAP not found. Skipping animations.');
      return;
    }
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    const run = () => {
      initHeroReveal();
      initCaseFileReveal();
      initCardCursorHover();
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