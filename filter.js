/* ============================================================
   PROJECTS PAGE - FILTER LOGIC
   Handles category filtering for case file cards.
   Uses GSAP for smooth fade-out/fade-in transitions when available.
   ============================================================ */

(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function initProjectFilter() {
    const filterBar = $('.filter-bar');
    const cards = $$('.case-file');
    if (!filterBar || !cards.length) return;

    const buttons = $$('.filter-btn', filterBar);
    let activeFilter = 'all';
    let isAnimating = false;

    /**
     * Check if a card matches the active filter.
     */
    function matchesFilter(card, filter) {
      if (filter === 'all') return true;
      const categories = (card.getAttribute('data-categories') || '').toLowerCase().split(/\s+/);
      return categories.includes(filter);
    }

    /**
     * Update button active states and aria-pressed.
     */
    function setActiveButton(activeBtn) {
      buttons.forEach((btn) => {
        const isActive = btn === activeBtn;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });
    }

    /**
     * Animate filtering with GSAP (preferred) or simple fallback.
     */
    function applyFilter(filter) {
      if (isAnimating || filter === activeFilter) return;
      isAnimating = true;
      activeFilter = filter;

      const toShow = [];
      const toHide = [];

      cards.forEach((card) => {
        const match = matchesFilter(card, filter);
        const isCurrentlyHidden = card.classList.contains('is-hidden');
        if (match && isCurrentlyHidden) toShow.push(card);
        if (!match && !isCurrentlyHidden) toHide.push(card);
      });

      // Reduced motion or no GSAP: instant toggle
      if (prefersReduced || typeof gsap === 'undefined') {
        toHide.forEach((c) => c.classList.add('is-hidden'));
        toShow.forEach((c) => { c.classList.remove('is-hidden'); c.style.opacity = '1'; c.style.transform = 'none'; });
        isAnimating = false;
        // Refresh ScrollTrigger if present
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        return;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating = false;
          if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        }
      });

      // Fade out cards that should hide
      if (toHide.length) {
        tl.to(toHide, {
          opacity: 0,
          y: 16,
          duration: 0.28,
          stagger: 0.04,
          ease: 'power2.in',
          onComplete: () => {
            toHide.forEach((c) => {
              c.classList.add('is-hidden');
              gsap.set(c, { clearProps: 'opacity,transform' });
            });
          }
        });
      }

      // Reveal cards that should show
      if (toShow.length) {
        // Prepare hidden cards for reveal
        tl.add(() => {
          toShow.forEach((c) => {
            c.classList.remove('is-hidden');
            gsap.set(c, { opacity: 0, y: 20 });
          });
        });

        tl.to(toShow, {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.06,
          ease: 'power2.out',
          clearProps: 'opacity,transform'
        }, toHide.length ? '-=0.05' : 0);
      }

      // If nothing changes, unlock immediately
      if (!toHide.length && !toShow.length) {
        isAnimating = false;
      }
    }

    // Bind click events
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter') || 'all';
        setActiveButton(btn);
        applyFilter(filter);
      });
    });
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjectFilter);
  } else {
    initProjectFilter();
  }
})();