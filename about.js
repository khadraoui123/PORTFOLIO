/* ============================================================
   ABOUT PAGE - PAGE-SPECIFIC ANIMATIONS
   Uses GSAP + ScrollTrigger (loaded globally in about.html)
   Works with Lenis smooth scrolling and custom cursor from Phase 1.
   ============================================================ */

(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ------------------------------------------------------------
     1. PAGE LOAD ANIMATIONS
     Sequence: "type out" the title -> fade/slide in ID card + bio.
     Triggered after preloader completes.
     ------------------------------------------------------------ */
  function initPageLoadAnimations() {
    const eyebrow = $('#about-eyebrow');
    const title = $('#about-title');
    const heroMeta = $('.page-hero__meta');
    const idCard = $('#id-card');
    const bio = $('#dossier-bio');

    // Reduced motion: show everything immediately
    if (prefersReduced) {
      [eyebrow, heroMeta, idCard, bio].forEach((el) => {
        if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
      });
      if (title) { title.style.opacity = '1'; }
      return;
    }

    // Set initial states
    if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 20 });
    if (heroMeta) gsap.set(heroMeta, { opacity: 0, y: 20 });
    if (idCard) gsap.set(idCard, { opacity: 0, y: 40, scale: 0.98 });
    if (bio) gsap.set(bio, { opacity: 0, y: 40 });
    if (title) gsap.set(title, { opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Eyebrow fades in
    if (eyebrow) {
      tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.6 });
    }

    // "Type out" the title using a clip-path reveal + scramble-like character feel.
    // We implement a clean type-out: reveal characters progressively.
    if (title) {
      tl.add(() => typeOutTitle(title), '-=0.2');
    }

    // Hero meta
    if (heroMeta) {
      tl.to(heroMeta, { opacity: 1, y: 0, duration: 0.6 }, '-=0.2');
    }

    // ID card and bio slide in
    if (idCard) {
      tl.to(idCard, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out' }, '-=0.2');
    }
    if (bio) {
      tl.to(bio, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.7');
    }
  }

  /**
   * Type-out effect for the title.
   * Reveals the text character by character with a cursor feel.
   * Keeps the final text as the real content (accessible via sr-only in HTML).
   */
  function typeOutTitle(el) {
    const finalText = el.getAttribute('data-text') || el.textContent.trim();
    const chars = finalText.split('');
    let currentIndex = 0;

    // Make element visible and start empty
    el.style.opacity = '1';
    el.textContent = '';

    // Add a temporary cursor
    const cursor = document.createElement('span');
    cursor.className = 'type-cursor';
    cursor.textContent = '_';
    cursor.style.color = 'var(--cyan)';
    cursor.style.textShadow = '0 0 10px rgba(0,240,255,0.4)';
    cursor.style.animation = 'caretBlink 1s steps(1, end) infinite';
    cursor.style.marginLeft = '0.05em';
    el.appendChild(cursor);

    function typeNext() {
      if (currentIndex < chars.length) {
        // Insert character before cursor
        const charNode = document.createTextNode(chars[currentIndex]);
        el.insertBefore(charNode, cursor);
        currentIndex++;

        // Variable speed for natural feel
        const delay = chars[currentIndex - 1] === ' ' ? 60 : 55 + Math.random() * 45;
        setTimeout(typeNext, delay);
      } else {
        // Typing complete: remove cursor after a brief pause
        setTimeout(() => {
          cursor.remove();
          // Ensure final text is clean
          el.textContent = finalText;
        }, 400);
      }
    }

    // Small initial delay before typing starts
    setTimeout(typeNext, 150);
  }

  /* ------------------------------------------------------------
     2. SCROLLTRIGGER - PHILOSOPHY CARDS
     Staggered fade-up reveal when the section enters viewport.
     ------------------------------------------------------------ */
  function initPhilosophyReveal() {
    const cards = $$('.philosophy-card');
    if (!cards.length) return;

    if (prefersReduced) {
      cards.forEach((card) => { card.style.opacity = '1'; card.style.transform = 'none'; });
      return;
    }

    gsap.set(cards, { opacity: 0, y: 40 });

    gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#philosophy-grid',
        start: 'top 82%',
        once: true
      }
    });
  }

  /* ------------------------------------------------------------
     3. CONTRAST PANEL REVEAL
     Subtle fade-up for the web dev hobby section.
     ------------------------------------------------------------ */
  function initContrastReveal() {
    const panel = $('.contrast-panel');
    if (!panel) return;

    if (prefersReduced) {
      panel.style.opacity = '1';
      panel.style.transform = 'none';
      return;
    }

    gsap.set(panel, { opacity: 0, y: 30 });
    gsap.to(panel, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: panel,
        start: 'top 85%',
        once: true
      }
    });
  }

  /* ------------------------------------------------------------
     4. ID CARD HOVER ENHANCEMENT (JS fallback / extra polish)
     CSS handles scale + glow; this adds a subtle brightness lift
     to inner text values for extra "alive" feel.
     ------------------------------------------------------------ */
  function initIdCardHover() {
    const card = $('#id-card');
    if (!card || prefersReduced) return;

    const values = $$('.id-card__value', card);

    card.addEventListener('mouseenter', () => {
      gsap.to(values, {
        filter: 'brightness(1.15)',
        duration: 0.3,
        ease: 'power2.out',
        stagger: 0.02
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(values, {
        filter: 'brightness(1)',
        duration: 0.3,
        ease: 'power2.out',
        stagger: 0.02
      });
    });
  }

  /* ------------------------------------------------------------
     5. INIT
     Wait for preloader to complete, then run page animations.
     ------------------------------------------------------------ */
  function init() {
    if (typeof gsap === 'undefined') {
      console.warn('[about.js] GSAP not found. Skipping animations.');
      return;
    }
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    const run = () => {
      initPageLoadAnimations();
      initPhilosophyReveal();
      initContrastReveal();
      initIdCardHover();
      // Refresh ScrollTrigger after layout settles
      setTimeout(() => {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      }, 200);
    };

    // If preloader already finished or not present
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