/* Main JS - navigation, cursor, shared behaviors */
(() => {
  'use strict';

  // Cyber Atmosphere - additive shared background loader
  if (!window.__cyberAtmosphereLoaded && !document.querySelector('script[data-cyber-atmosphere]')) {
    const atmosphereScript = document.createElement('script');
    atmosphereScript.src = 'atmosphere.js';
    atmosphereScript.defer = true;
    atmosphereScript.dataset.cyberAtmosphere = 'true';
    document.head.appendChild(atmosphereScript);
  }

  const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Header scroll state
  const header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  function closeNav() {
    if (!toggle || !navLinks) return;
    toggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
    document.body.classList.remove('nav-open');
  }
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      navLinks.classList.toggle('open', !open);
      document.body.classList.toggle('nav-open', !open);
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
    document.addEventListener('click', (e) => {
      if (toggle.getAttribute('aria-expanded') === 'true' && !navLinks.contains(e.target) && !toggle.contains(e.target)) closeNav();
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) closeNav(); });
  }

  // Active nav is set via aria-current in HTML; normalize path-based fallback
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-link[href]').forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (href === path || (path === '' && href === 'index.html')) {
      link.setAttribute('aria-current', 'page');
    }
  });

  // Page transition overlay
  const transitionEl = document.querySelector('.page-transition');
  function navigateWithTransition(href) {
    if (!transitionEl || prefersReduced() || !window.gsap) {
      window.location.href = href;
      return;
    }
    window.gsap.to(transitionEl, {
      scaleY: 1, transformOrigin: 'bottom', duration: 0.45, ease: 'power3.inOut',
      onComplete: () => { window.location.href = href; }
    });
  }
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http') || href.startsWith('tel:') || a.hasAttribute('download') || a.target === '_blank') return;
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      closeNav();
      navigateWithTransition(href);
    });
  });
  window.addEventListener('pageshow', () => {
    if (transitionEl && window.gsap) window.gsap.set(transitionEl, { scaleY: 0 });
  });

  // Advanced contextual cursor (desktop only)
  if (isFinePointer() && !prefersReduced() && typeof window.gsap !== 'undefined') {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (dot && ring) {
      let label = ring.querySelector('.cursor-label');
      if (!label) {
        label = document.createElement('span');
        label.className = 'cursor-label';
        label.setAttribute('aria-hidden', 'true');
        ring.appendChild(label);
      }
      document.body.classList.add('has-custom-cursor');

      const CARD_SELECTOR = '.case-file, .project-card, .lab-card, .module-card, .module-panel, .dash-panel, .channel-card:not(.is-placeholder), .skill-category, .research-card, .info-card, .stat-card, .expertise-card';
      const TYPE_SELECTOR = 'input, textarea, select, [contenteditable="true"]';
      const CLICK_SELECTOR = 'a, button, [role="button"], .btn, .filter-btn, .submit-btn, .navbar__link, .nav-link, summary';
      const READ_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, dt, dd';
      const RANK = { read: 1, interactive: 2, type: 3, card: 4 };
      const CONTEXT_CLASSES = ['is-context-interactive', 'is-context-card', 'is-context-read', 'is-context-type'];
      const gsap = window.gsap;

      function defaultText(kind, target) {
        if (kind === 'card') {
          return target && target.closest && target.closest('.project-card, .lab-card') ? '[ VIEW ]' : '[ DECRYPT ]';
        }
        if (kind === 'type') return '[ TYPE ]';
        if (kind === 'read') return '[ READ ]';
        return target && target.closest && target.closest('button, [role="button"], .btn, .filter-btn, .submit-btn')
          ? '[ CLICK ]' : '[ ACCESS ]';
      }

      function resolveContext(target) {
        let explicit = '';
        let kind = '';
        let rank = 0;
        let node = target instanceof Element ? target : null;
        while (node && node !== document.body) {
          if (!explicit && node.hasAttribute && node.hasAttribute('data-cursor')) {
            const value = String(node.getAttribute('data-cursor') || '').trim();
            if (value) explicit = value;
          }
          if (node.matches) {
            let found = '';
            if (node.matches(CARD_SELECTOR)) found = 'card';
            else if (node.matches(TYPE_SELECTOR)) found = 'type';
            else if (node.matches(CLICK_SELECTOR)) found = 'interactive';
            else if (node.matches(READ_SELECTOR)) found = 'read';
            if (found && RANK[found] > rank) { rank = RANK[found]; kind = found; }
          }
          node = node.parentElement;
        }
        if (!kind && explicit) {
          const value = explicit.toUpperCase();
          kind = /DECRYPT|VIEW|OPEN|INSPECT|CASE/.test(value) ? 'card'
            : /TYPE|EDIT|INPUT|WRITE/.test(value) ? 'type'
            : /READ|SCAN/.test(value) ? 'read'
            : 'interactive';
        }
        return { kind, text: explicit || defaultText(kind, target) };
      }

      const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3.out' });
      const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3.out' });
      const ringX = gsap.quickTo(ring, 'x', { duration: 0.42, ease: 'power3.out' });
      const ringY = gsap.quickTo(ring, 'y', { duration: 0.42, ease: 'power3.out' });
      const labelX = gsap.quickTo(label, 'x', { duration: 0.42, ease: 'power3.out' });
      const labelY = gsap.quickTo(label, 'y', { duration: 0.42, ease: 'power3.out' });
      const labelScale = gsap.quickTo(label, 'scale', { duration: 0.22, ease: 'power3.out' });
      gsap.set(label, { xPercent: -50, yPercent: -50, scale: 0.6, transformOrigin: '50% 50%' });

      let currentKind = '';
      function setContext(kind, text) {
        if (kind !== currentKind) {
          CONTEXT_CLASSES.forEach((name) => ring.classList.remove(name));
          dot.classList.remove('is-hovering', 'is-hover');
          ring.classList.remove('is-hovering', 'is-hover');
          if (kind) {
            ring.classList.add('is-context-' + kind);
            dot.classList.add('is-hovering');
            ring.classList.add('is-hovering');
          }
          currentKind = kind;
          labelScale(kind ? 1 : 0.6);
        }
        if (text && label.textContent !== text) label.textContent = text;
        label.classList.toggle('is-visible', Boolean(text));
      }

      function resetCursor() {
        dot.style.opacity = '0';
        ring.style.opacity = '0';
        setContext('', '');
      }

      window.addEventListener('mousemove', (event) => {
        const x = event.clientX;
        const y = event.clientY;
        dotX(x); dotY(y);
        ringX(x); ringY(y);
        const rx = parseFloat(gsap.getProperty(ring, 'x'));
        const ry = parseFloat(gsap.getProperty(ring, 'y'));
        const offsetX = Number.isFinite(rx) ? gsap.utils.clamp(-9, 9, (x - rx) * 0.12) : 0;
        const offsetY = Number.isFinite(ry) ? gsap.utils.clamp(-9, 9, (y - ry) * 0.12) : 0;
        labelX(offsetX + (currentKind === 'type' ? 26 : 0));
        labelY(offsetY);
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }, { passive: true });

      document.addEventListener('mouseover', (event) => {
        const next = resolveContext(event.target);
        setContext(next.kind, next.text);
      }, { passive: true });

      document.addEventListener('mouseout', (event) => {
        const related = event.relatedTarget;
        if (!related || related === document.documentElement || !(related instanceof Node)) resetCursor();
      }, { passive: true });

      document.documentElement.addEventListener('mouseleave', resetCursor, { passive: true });
      window.addEventListener('blur', resetCursor);
    }
  }

  // Contact form - no fake submission
  const form = document.querySelector('#contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const message = String(data.get('message') || '').trim();
      if (!name || !email || !message) {
        if (status) { status.textContent = 'Please complete the required fields before submitting.'; status.className = 'form-status is-error'; }
        return;
      }
      if (status) {
        status.textContent = 'Form endpoint not configured. Replace placeholders with your contact details or connect a form service.';
        status.className = 'form-status is-error';
      }
    });
  }

  // Project filters
  const filterBar = document.querySelector('[data-filter-bar]');
  if (filterBar) {
    const buttons = filterBar.querySelectorAll('[data-filter]');
    const cards = document.querySelectorAll('[data-category]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        buttons.forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
        cards.forEach(card => {
          const cat = card.getAttribute('data-category') || '';
          const show = filter === 'all' || cat === filter;
          card.style.display = show ? '' : 'none';
          card.setAttribute('aria-hidden', String(!show));
        });
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      });
    });
  }

  // Current year
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });

  // Same-page anchor smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 84;
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 20;
      if (prefersReduced()) { window.scrollTo(0, Math.max(0, top)); }
      else { window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' }); }
      history.pushState(null, '', id);
    });
  });

})();
