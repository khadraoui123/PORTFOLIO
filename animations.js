/* ============================================================
   CYBER_SEC PORTFOLIO - ANIMATIONS.JS (Clean Cinematic)
   Smooth, comfortable text reveals. No aggressive glitch/scramble.
   ============================================================ */

(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ------------------------------------------------------------
     0. UTILITIES
     ------------------------------------------------------------ */
  function killExistingTweens() {
    if (typeof gsap === 'undefined') return;
    const targets = [
      '.main-title',
      'h1', 'h2',
      '.hero__title', '.page-hero__title', '.access-title',
      '.hero__title .glitch', '.page-hero__title .glitch', '.access-title .glitch',
      '.hero__eyebrow', '.page-hero__eyebrow', '.access-eyebrow',
      '.hero__description', '.page-hero__subtitle', '.access-subtitle',
      '.hero__actions', '.hero__meta', '.page-hero__meta',
      '[data-animate="hero"]', '[data-reveal="hero"]',
      '[data-animate="terminal"]'
    ].join(', ');
    gsap.killTweensOf(targets);
  }

  function setVisible(els) {
    els.forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.clipPath = 'none';
    });
  }

  /* ------------------------------------------------------------
     1. CLEAN TEXT REVEALS (Cinematic Fade Up)
     Headlines: opacity 0->1, y 30->0, power3.out, duration 1.2, stagger
     Subtitles/paragraphs/support: delay 0.3, duration 1.0, power2.out
     ------------------------------------------------------------ */
  function initTextReveals() {
    const headlines = $$([
      'h1',
      'h2.section-heading',
      '.hero__title .glitch',
      '.page-hero__title .glitch',
      '.access-title .glitch',
      '.main-title'
    ].join(', ')).filter((el, i, arr) => arr.indexOf(el) === i);

    const subtitles = $$([
      '.hero__eyebrow',
      '.page-hero__eyebrow',
      '.access-eyebrow',
      '.hero__description',
      '.page-hero__subtitle',
      '.access-subtitle',
      '.hero__actions',
      '.hero__meta',
      '.page-hero__meta',
      '.warning-banner',
      '.section-tag'
    ].join(', ')).filter((el, i, arr) => arr.indexOf(el) === i);

    // Filter out elements inside terminal or hidden utility regions
    const filterVisibleTargets = (els) => els.filter((el) =>
      !el.closest('.terminal__body') &&
      !el.closest('.preloader') &&
      !el.closest('.page-transition')
    );

    // Exclude glitch/main titles handled by initHackerGlitch to avoid conflicts
    const headlineTargets = filterVisibleTargets(headlines).filter((el) => {
      if (el.dataset.glitchBound) return false;
      if (el.classList.contains('glitch') || el.classList.contains('main-title')) return false;
      // If an h1 contains glitch children that will be handled by hacker glitch, skip the h1 container animation
      if (el.matches('h1') && el.querySelector('.glitch, .main-title')) return false;
      return true;
    });
    const subtitleTargets = filterVisibleTargets(subtitles);

    if (prefersReduced || typeof gsap === 'undefined') {
      setVisible(headlineTargets);
      setVisible(subtitleTargets);
      return;
    }

    // Kill any previous/conflicting tweens first
    killExistingTweens();

    // Headlines: clean fade up
    if (headlineTargets.length) {
      gsap.set(headlineTargets, { opacity: 0, y: 30 });
      gsap.to(headlineTargets, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        stagger: 0.1,
        clearProps: 'transform'
      });
    }

    // Subtitles & paragraphs: fade up with longer delay
    if (subtitleTargets.length) {
      gsap.set(subtitleTargets, { opacity: 0, y: 24 });
      gsap.to(subtitleTargets, {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: 'power2.out',
        delay: 0.3,
        stagger: 0.08,
        clearProps: 'transform'
      });
    }
  }

  /* ------------------------------------------------------------
     2. HERO TERMINAL ENTRANCE (smooth)
     ------------------------------------------------------------ */
  function initHeroTerminalEntrance() {
    const terminal = $('[data-animate="terminal"]');
    if (!terminal) return;

    if (prefersReduced || typeof gsap === 'undefined') {
      terminal.style.opacity = '1';
      terminal.style.transform = 'none';
      return;
    }

    gsap.killTweensOf(terminal);
    gsap.set(terminal, { opacity: 0, y: 30 });
    gsap.to(terminal, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: 'power3.out',
      delay: 0.15,
      clearProps: 'transform',
      onComplete: initTerminalFloat
    });
  }

  /* ------------------------------------------------------------
     3. TERMINAL FLOATING (subtle)
     ------------------------------------------------------------ */
  function initTerminalFloat() {
    if (prefersReduced || typeof gsap === 'undefined') return;
    const terminal = $('#hero-terminal');
    if (!terminal) return;
    gsap.killTweensOf(terminal);
    gsap.to(terminal, {
      y: -8,
      duration: 4,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    });
  }

  /* ------------------------------------------------------------
     4. HERO TERMINAL TYPING (comfortable, slow)
     60ms per char, 500ms delay between command and output.
     ------------------------------------------------------------ */
  function initTerminalTyping() {
    const terminalBody = document.querySelector('#hero-terminal .terminal__body');
    if (!terminalBody) return;

    const lines = $$('.terminal__line', terminalBody);
    const outputs = $$('.terminal__output', terminalBody);
    const cmdSpans = $$('.terminal__cmd', terminalBody);

    if (prefersReduced) {
      setVisible([...lines, ...outputs]);
      return;
    }

    lines.forEach((l) => { l.style.opacity = '1'; l.style.transform = 'none'; });

    const commands = cmdSpans.map((span) => {
      const text = (span.textContent || '').trim();
      span.textContent = '';
      return { span, text };
    });

    outputs.forEach((out) => {
      out.style.opacity = '0';
      out.style.transform = 'translateY(6px)';
    });

    const activeLine = terminalBody.querySelector('.terminal__line--active');
    if (activeLine) activeLine.style.opacity = '0';

    const CHAR_DELAY = 60;
    const OUTPUT_DELAY = 500;
    const NEXT_CMD_DELAY = 420;

    let cmdIndex = 0;
    let charIndex = 0;

    function revealOutputsAfter(lineEl) {
      let next = lineEl ? lineEl.nextElementSibling : null;
      while (next && !next.classList.contains('terminal__line')) {
        if (next.classList.contains('terminal__output')) {
          next.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
          next.style.opacity = '1';
          next.style.transform = 'translateY(0)';
        }
        next = next.nextElementSibling;
      }
    }

    function typeCommand() {
      if (cmdIndex >= commands.length) {
        if (activeLine) {
          activeLine.style.transition = 'opacity 0.4s ease';
          activeLine.style.opacity = '1';
        }
        return;
      }

      const { span, text } = commands[cmdIndex];
      const lineEl = span.closest('.terminal__line');

      if (charIndex < text.length) {
        span.textContent += text.charAt(charIndex);
        charIndex += 1;
        setTimeout(typeCommand, CHAR_DELAY);
      } else {
        setTimeout(() => {
          revealOutputsAfter(lineEl);
          cmdIndex += 1;
          charIndex = 0;
          setTimeout(typeCommand, NEXT_CMD_DELAY);
        }, OUTPUT_DELAY);
      }
    }

    setTimeout(typeCommand, 1000);
  }

  /* ------------------------------------------------------------
     5. SMOOTH SCROLL REVEALS (generic, non-conflicting)
     ------------------------------------------------------------ */
  function initScrollReveals() {
    if (prefersReduced || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const selector = [
      '[data-reveal="panel"]',
      '[data-reveal="item"]',
      '[data-animate="reveal"]'
    ].join(', ');

    const elements = $$(selector).filter((el) => {
      if (el.dataset.scrollRevealBound) return false;
      if (el.closest('#hero-terminal')) return false;
      if (el.closest('.hero') || el.closest('.page-hero')) return false;
      if (el.style.opacity === '0') return false;
      return true;
    });

    if (!elements.length) return;

    const groups = new Map();
    elements.forEach((el) => {
      const parent = el.parentElement || document.body;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });

    groups.forEach((group) => {
      group.forEach((el) => { el.dataset.scrollRevealBound = 'true'; });
      gsap.set(group, { opacity: 0, y: 30 });
      gsap.to(group, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        stagger: group.length > 1 ? 0.1 : 0,
        clearProps: 'transform',
        scrollTrigger: { trigger: group[0], start: 'top 88%', once: true }
      });
    });
  }

  /* ------------------------------------------------------------
     6. INIT
     ------------------------------------------------------------ */
  function init() {
    if (typeof gsap === 'undefined') {
      $$('h1, h2, [data-animate="hero"], [data-reveal="hero"], [data-animate="terminal"]').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    const run = () => {
      initTextReveals();
      initHeroTerminalEntrance();
      initTerminalTyping();
      initScrollReveals();
      if (typeof ScrollTrigger !== 'undefined') {
        setTimeout(() => ScrollTrigger.refresh(), 250);
      }
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