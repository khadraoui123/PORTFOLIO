/* =========================================================
   PRELOADER / SYSTEM BOOT - STEP 1
   High-tech boot sequence: log lines, hex scroll, progress,
   ACCESS GRANTED stamp, then reveal.
   Exposes window.CCPreloader.done (Promise) for hero sync.
   ========================================================= */
(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const preloader = document.getElementById('preloader');
  const logEl = document.getElementById('boot-log');
  const barEl = document.getElementById('boot-progress-bar');
  const pctEl = document.getElementById('boot-percent');
  const hexEl = document.getElementById('boot-hex');
  const stampEl = document.getElementById('access-stamp');
  const statusEl = document.getElementById('boot-status');

  // Resolve when preloader finishes; hero can await this.
  let resolveDone;
  const donePromise = new Promise((r) => { resolveDone = r; });
  window.CCPreloader = { done: donePromise };

  if (!preloader) { resolveDone(); return; }

  document.body.classList.add('cc-loading');

  const bootLines = [
    { text: 'Mounting secure filesystem...', cls: 'ok', tag: 'OK' },
    { text: 'Loading encryption modules...', cls: 'ok', tag: 'OK' },
    { text: 'Initializing network monitors...', cls: 'ok', tag: 'OK' },
    { text: 'Verifying integrity checksums...', cls: 'ok', tag: 'OK' },
    { text: 'Scanning for intrusion signatures...', cls: 'warn', tag: 'WARN' },
    { text: 'No active threats detected.', cls: 'ok', tag: 'OK' },
    { text: 'Establishing command interface...', cls: 'ok', tag: 'OK' },
    { text: 'Access control: authenticated.', cls: 'ok', tag: 'OK' }
  ];

  function randHex(len = 48) {
    const chars = '0123456789ABCDEF';
    let out = '';
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
    return out;
  }

  function appendLog(line) {
    if (!logEl) return;
    const div = document.createElement('div');
    div.className = 'boot-log-line';
    div.innerHTML = `<span class="${line.cls}">[${line.tag}]</span> ${line.text}`;
    logEl.appendChild(div);
    // Keep log trimmed
    while (logEl.children.length > 7) logEl.removeChild(logEl.firstChild);
  }

  function finish() {
    if (statusEl) statusEl.textContent = 'ACCESS GRANTED';
    const tl = window.gsap ? window.gsap.timeline() : null;

    if (prefersReduced || !tl) {
      if (stampEl) stampEl.style.opacity = '1';
      preloader.style.display = 'none';
      document.body.classList.remove('cc-loading');
      resolveDone();
      return;
    }

    tl.to(stampEl, { opacity: 1, duration: 0.15 })
      .fromTo(stampEl.querySelector('span'),
        { scale: 1.35, rotation: -12, opacity: 0 },
        { scale: 1, rotation: -8, opacity: 1, duration: 0.45, ease: 'back.out(2)' },
        0
      )
      .to(preloader.querySelector('.preloader-inner'), { opacity: 0.15, duration: 0.25 }, '+=0.45')
      .to(preloader, {
        yPercent: -100,
        duration: 0.75,
        ease: 'power4.inOut',
        onComplete: () => {
          preloader.classList.add('is-done');
          preloader.style.display = 'none';
          document.body.classList.remove('cc-loading');
          resolveDone();
        }
      });
  }

  function run() {
    if (prefersReduced) {
      bootLines.forEach(appendLog);
      if (barEl) barEl.style.width = '100%';
      if (pctEl) pctEl.textContent = '100%';
      finish();
      return;
    }

    let progress = 0;
    let lineIndex = 0;

    // Hex scramble ticker
    const hexTimer = window.setInterval(() => {
      if (hexEl) hexEl.textContent = `0x${randHex(16)}  ::  ${randHex(24)}  ::  ${randHex(16)}`;
    }, 70);

    // Boot log + progress
    const logTimer = window.setInterval(() => {
      if (lineIndex < bootLines.length) {
        appendLog(bootLines[lineIndex]);
        lineIndex++;
      }
      progress = Math.min(100, progress + Math.floor(Math.random() * 10) + 8);
      if (barEl) barEl.style.width = progress + '%';
      if (pctEl) pctEl.textContent = progress + '%';

      if (progress >= 100) {
        window.clearInterval(logTimer);
        window.clearInterval(hexTimer);
        if (barEl) barEl.style.width = '100%';
        if (pctEl) pctEl.textContent = '100%';
        window.setTimeout(finish, 350);
      }
    }, 220);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
