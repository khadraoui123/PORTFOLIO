/* ============================================================
   DEFENSE PAGE - SOC DASHBOARD ANIMATIONS & TELEMETRY FEED
   GSAP + ScrollTrigger: hero reveal, panel stagger.
   JS: continuous real-time telemetry typing feed.
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
     2. DASHBOARD PANEL STAGGER REVEAL
     ------------------------------------------------------------ */
  function initPanelReveal() {
    const panels = $$('[data-panel]');
    if (!panels.length) return;

    if (prefersReduced) {
      panels.forEach((p) => { p.style.opacity = '1'; p.style.transform = 'none'; });
      return;
    }

    gsap.set(panels, { opacity: 0, y: 32, scale: 0.985 });
    gsap.to(panels, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.75,
      stagger: 0.12,
      ease: 'power3.out',
      clearProps: 'transform',
      scrollTrigger: {
        trigger: '.dashboard-grid',
        start: 'top 82%',
        once: true
      }
    });
  }

  /* ------------------------------------------------------------
     3. LIVE TELEMETRY FEED (typing, continuous, auto-scroll)
     ------------------------------------------------------------ */
  function initTelemetryFeed() {
    const screen = $('#telemetry-screen');
    const output = $('#telemetry-output');
    const current = $('#telemetry-current');
    if (!screen || !output || !current) return;

    // Log pool with severity type for coloring
    const logPool = [
      { type: 'info', text: '[INFO] Process started...' },
      { type: 'ok',   text: '[OK] System integrity check passed' },
      { type: 'warn', text: '[WARN] Unusual port activity...' },
      { type: 'sys',  text: '[SYS] Telemetry agent handshake established' },
      { type: 'info', text: '[INFO] Collecting endpoint metrics...' },
      { type: 'ok',   text: '[OK] Log ingestion pipeline stable' },
      { type: 'info', text: '[INFO] Parsing network event stream...' },
      { type: 'warn', text: '[WARN] Repeated failed login attempt detected' },
      { type: 'ok',   text: '[OK] Firewall ruleset verified' },
      { type: 'sys',  text: '[SYS] Correlation engine heartbeat: NORMAL' },
      { type: 'info', text: '[INFO] New telemetry packet batch received' },
      { type: 'warn', text: '[WARN] Anomalous outbound connection flagged' },
      { type: 'ok',   text: '[OK] Endpoint baseline within threshold' },
      { type: 'info', text: '[INFO] Archiving event logs to local store...' },
      { type: 'sys',  text: '[SYS] Analysis engine queue: 3 pending tasks' }
    ];

    const maxLines = 24;
    let poolIndex = 0;
    let charIndex = 0;
    let activeLog = null;
    let typingTimer = null;
    let paused = false;

    function typeClass(type) {
      switch (type) {
        case 'ok': return 'telemetry-line--ok';
        case 'warn': return 'telemetry-line--warn';
        case 'sys': return 'telemetry-line--sys';
        default: return 'telemetry-line--info';
      }
    }

    function scrollToBottom() {
      screen.scrollTop = screen.scrollHeight;
    }

    function appendLine(log) {
      const line = document.createElement('p');
      line.className = `telemetry-line ${typeClass(log.type)}`;
      line.textContent = log.text;
      output.appendChild(line);

      // Cap DOM size
      while (output.children.length > maxLines) {
        output.removeChild(output.firstChild);
      }
      scrollToBottom();
    }

    function nextLog() {
      activeLog = logPool[poolIndex % logPool.length];
      poolIndex += 1;
      charIndex = 0;
      current.textContent = '';
      current.className = `telemetry-terminal__line ${typeClass(activeLog.type)}`;
    }

    function scheduleNextChar(delay) {
      clearTimeout(typingTimer);
      typingTimer = setTimeout(typeStep, delay);
    }

    function typeStep() {
      if (paused) return;

      if (!activeLog) nextLog();

      // Type next character
      if (charIndex < activeLog.text.length) {
        charIndex += 1;
        current.textContent = activeLog.text.slice(0, charIndex);
        scrollToBottom();

        // Slightly variable typing speed for realism
        const ch = activeLog.text.charAt(charIndex - 1);
        let delay = 28 + Math.random() * 34;
        if (ch === '.' || ch === ':' || ch === ']') delay += 55;
        if (ch === ' ') delay += 10;
        scheduleNextChar(delay);
        return;
      }

      // Line complete: push to output and pause before next
      const completed = activeLog;
      activeLog = null;
      current.textContent = '';
      current.className = 'telemetry-terminal__line';
      appendLine(completed);

      const pause = 550 + Math.random() * 900;
      scheduleNextChar(pause);
    }

    // Reduced motion: render static log lines, no typing
    if (prefersReduced) {
      logPool.slice(0, 8).forEach(appendLine);
      current.textContent = '';
      return;
    }

    // Seed with a couple of instant lines for immediate visual density
    appendLine(logPool[0]);
    appendLine(logPool[1]);
    poolIndex = 2;

    // Start typing after a short delay
    scheduleNextChar(600);

    // Pause when tab hidden to avoid backlog bursts
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        paused = true;
        clearTimeout(typingTimer);
      } else {
        if (paused) {
          paused = false;
          scheduleNextChar(300);
        }
      }
    });
  }

  /* ------------------------------------------------------------
     4. CUSTOM CURSOR HOVER FOR PANELS
     ------------------------------------------------------------ */
  function initPanelCursorHover() {
    const dot = $('#cursor-dot');
    const ring = $('#cursor-ring');
    if (!dot || !ring) return;

    const targets = $$('.dash-panel, .interactive');
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
    if (typeof gsap === 'undefined') {
      console.warn('[defense.js] GSAP not found. Skipping animations.');
      // Still start telemetry feed without GSAP
      initTelemetryFeed();
      return;
    }
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    const run = () => {
      initHeroReveal();
      initPanelReveal();
      initTelemetryFeed();
      initPanelCursorHover();
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