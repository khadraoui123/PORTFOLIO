/* Animations - GSAP + ScrollTrigger */
(() => {
  'use strict';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !window.gsap) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Page entry
  const transitionEl = document.querySelector('.page-transition');
  if (transitionEl) {
    gsap.set(transitionEl, { scaleY: 1, transformOrigin: 'top' });
    gsap.to(transitionEl, { scaleY: 0, duration: 0.7, ease: 'power3.inOut', delay: 0.05 });
  }

  // Hero title lines
  const heroLines = document.querySelectorAll('.hero-title .line span');
  if (heroLines.length) {
    gsap.from(heroLines, {
      yPercent: 115, opacity: 0, duration: 1.05, stagger: 0.12, ease: 'power4.out', delay: 0.25
    });
  }

  // Generic reveal
  gsap.utils.toArray('.reveal').forEach((el, i) => {
    const delay = parseFloat(el.dataset.delay || '0');
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', delay,
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true
      }
    });
  });

  // Stagger groups
  gsap.utils.toArray('[data-stagger]').forEach(group => {
    const items = group.querySelectorAll('[data-stagger-item]');
    if (!items.length) return;
    gsap.set(items, { opacity: 0, y: 24 });
    gsap.to(items, {
      opacity: 1, y: 0, duration: 0.75, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: group, start: 'top 84%', once: true }
    });
  });

  // Skill bars
  gsap.utils.toArray('.skill-fill').forEach(bar => {
    const level = bar.dataset.level || '0';
    gsap.to(bar, {
      width: level + '%', duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: bar.closest('.skill-category') || bar, start: 'top 82%', once: true }
    });
  });

  // Stats counter
  gsap.utils.toArray('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count || '0');
    const suffix = el.dataset.suffix || '';
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target, duration: 1.6, ease: 'power2.out',
      snap: target % 1 === 0 ? { val: 1 } : undefined,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: () => {
        const v = target % 1 === 0 ? Math.round(obj.val) : obj.val.toFixed(1);
        el.textContent = v + suffix;
      }
    });
  });

  // Parallax for elements with data-parallax
  gsap.utils.toArray('[data-parallax]').forEach(el => {
    const y = parseFloat(el.dataset.parallax || '40');
    gsap.to(el, {
      yPercent: y, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // Subtle hero background drift
  const heroGrid = document.querySelector('.hero .grid-bg');
  if (heroGrid) {
    gsap.to(heroGrid, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  // Page hero title
  const pageTitle = document.querySelector('.page-hero h1');
  if (pageTitle && !document.querySelector('.hero-title')) {
    gsap.from(pageTitle, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.2 });
  }
  const pageLead = document.querySelector('.page-hero .lead');
  if (pageLead) {
    gsap.from(pageLead, { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.35 });
  }
  const pageIndex = document.querySelector('.page-index');
  if (pageIndex) {
    gsap.from(pageIndex, { x: 30, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.3 });
  }

  // Refresh on load for accurate positions
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
