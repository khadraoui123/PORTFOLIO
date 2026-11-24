/* =========================================================
   COMMAND CENTER HERO - STEP 1
   - Custom crosshair cursor (target box on project cards)
   - GSAP text scramble reveal
   - Hero boot-up animations (after preloader)
   - Radar canvas (right panel)
   - Interactive terminal typing
   Depends on: GSAP, ScrollTrigger (optional), CCPreloader
   ========================================================= */
(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const gsap = window.gsap;

  /* -------------------------------------------------------
     1) CUSTOM CROSSHAIR CURSOR
     Expands into targeting box on project cards / .target-hover
  ------------------------------------------------------- */
  function initCursor() {
    const dot = document.querySelector('.cc-cursor-dot');
    const ring = document.querySelector('.cc-cursor-ring');
    if (!dot || !ring || !finePointer || prefersReduced) return;

    document.body.classList.add('cc-has-cursor');
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    function render() {
      rx += (mx - rx) * 0.22;
      ry += (my - ry) * 0.22;
      dot.style.transform = `translate(${mx}px,${my}px)`;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(render);
    }

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.opacity = '1'; ring.style.opacity = '1';
    }, { passive: true });
    window.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });

    // Targeting box on project cards / explicit targets
    const targets = document.querySelectorAll('a, button, .project-card, .target-hover, .cc-panel');
    targets.forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-target'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-target'));
    });

    requestAnimationFrame(render);
  }

  /* -------------------------------------------------------
     2) TEXT SCRAMBLE UTILITY
     Reveals text by scrambling characters then resolving.
  ------------------------------------------------------- */
  class TextScramble {
    constructor(el) {
      this.el = el;
      this.chars = '!<>-_\\/[]{}â€”=+*^?#_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      this.frame = 0;
      this.queue = [];
      this.raf = null;
      this.resolve = null;
    }
    setText(newText) {
      const oldText = this.el.textContent || '';
      const length = Math.max(oldText.length, newText.length);
      this.queue = [];
      for (let i = 0; i < length; i++) {
        const from = oldText[i] || '';
        const to = newText[i] || '';
        const start = Math.floor(Math.random() * 18);
        const end = start + Math.floor(Math.random() * 24) + 10;
        this.queue.push({ from, to, start, end, char: '' });
      }
      cancelAnimationFrame(this.raf);
      this.frame = 0;
      return new Promise((resolve) => { this.resolve = resolve; this.update(); });
    }
    update() {
      let output = '';
      let complete = 0;
      for (let i = 0; i < this.queue.length; i++) {
        let { from, to, start, end, char } = this.queue[i];
        if (this.frame >= end) {
          complete++; output += to;
        } else if (this.frame >= start) {
          if (!char || Math.random() < 0.28) char = this.chars[Math.floor(Math.random() * this.chars.length)];
          this.queue[i].char = char;
          output += `<span class="cc-scramble-char">${char}</span>`;
        } else {
          output += from;
        }
      }
      this.el.innerHTML = output;
      if (complete === this.queue.length) { this.resolve(); }
      else { this.raf = requestAnimationFrame(() => { this.frame++; this.update(); }); }
    }
  }

  function initScramble() {
    const els = document.querySelectorAll('[data-scramble]');
    if (!els.length) return;
    els.forEach((el) => {
      const finalText = el.getAttribute('data-scramble') || el.textContent || '';
      el.textContent = finalText;
      if (prefersReduced) return;
      // Scramble on hover/focus for micro-interaction
      const scrambler = new TextScramble(el);
      let busy = false;
      const run = async () => {
        if (busy) return;
        busy = true;
        await scrambler.setText(finalText);
        busy = false;
      };
      el.addEventListener('mouseenter', run);
      el.addEventListener('focus', run);
    });
  }

  function revealScramble() {
    const headline = document.getElementById('cc-headline-scramble');
    if (!headline) return Promise.resolve();
    const text = headline.getAttribute('data-scramble') || headline.textContent || '';
    if (prefersReduced || !gsap) { headline.textContent = text; return Promise.resolve(); }
    headline.textContent = '';
    const scrambler = new TextScramble(headline);
    return scrambler.setText(text);
  }

  /* -------------------------------------------------------
     3) RADAR CANVAS (right panel)
     Simple rotating sweep + blips for SOC/radar feel.
  ------------------------------------------------------- */
  function initRadar() {
    const canvas = document.getElementById('radar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w, h, dpr, raf, angle = 0;
    const blips = Array.from({ length: 5 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.25 + Math.random() * 0.6,
      life: Math.random(),
      speed: 0.002 + Math.random() * 0.004
    }));

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const radius = Math.min(w, h) * 0.42;

      // Rings
      ctx.strokeStyle = 'rgba(245,245,245,0.07)';
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1].forEach((k) => {
        ctx.beginPath(); ctx.arc(cx, cy, radius * k, 0, Math.PI * 2); ctx.stroke();
      });
      // Cross lines
      ctx.beginPath(); ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius); ctx.stroke();

      // Sweep
      angle += 0.012;
      const grad = ctx.createConicGradient(angle - 0.7, cx, cy);
      grad.addColorStop(0, 'rgba(0,255,65,0)');
      grad.addColorStop(0.75, 'rgba(0,255,65,0.02)');
      grad.addColorStop(1, 'rgba(0,255,65,0.18)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, radius, angle - 0.7, angle); ctx.closePath(); ctx.fill();

      // Sweep line
      ctx.strokeStyle = 'rgba(0,255,65,0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius); ctx.stroke();

      // Blips
      blips.forEach((b) => {
        b.life += b.speed;
        if (b.life > 1) { b.life = 0; b.a = Math.random() * Math.PI * 2; b.r = 0.25 + Math.random() * 0.65; }
        const alpha = Math.sin(b.life * Math.PI) * 0.9;
        const x = cx + Math.cos(b.a) * radius * b.r;
        const y = cy + Math.sin(b.a) * radius * b.r;
        ctx.fillStyle = `rgba(255,0,60,${alpha})`;
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(255,0,60,${alpha * 0.35})`;
        ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();
      });

      // Center
      ctx.fillStyle = 'rgba(0,255,65,0.9)';
      ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();

      raf = requestAnimationFrame(draw);
    }

    resize();
    if (prefersReduced) { draw(); cancelAnimationFrame(raf); }
    else draw();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => {
      if (prefersReduced) return;
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(draw);
    });
  }

  /* -------------------------------------------------------
     4) HERO TERMINAL TYPING (right panel widget)
  ------------------------------------------------------- */
  function initTerminal() {
    const out = document.getElementById('cc-terminal-output');
    if (!out) return;
    const lines = [
      { prompt: 'whoami', response: 'cybersecurity_professional // ethical_hacker' },
      { prompt: 'cat mission.txt', response: 'Identify vulnerabilities. Harden systems. Report clearly.' },
      { prompt: 'status --check', response: 'FIREWALL: ACTIVE | VPN: SECURED | MONITOR: RUNNING', cls: 'ok' }
    ];
    if (prefersReduced) {
      out.innerHTML = lines.map(l => `<div><span class="t-prompt">$</span> <span class="t-cmd">${l.prompt}</span></div><div class="t-out ${l.cls||''}">${l.response}</div>`).join('');
      return;
    }
    let li = 0, ci = 0, phase = 'cmd';
    let currentCmd = '';
    function render() {
      let html = '';
      for (let i = 0; i < li; i++) {
        const l = lines[i];
        html += `<div><span class="t-prompt">$</span> <span class="t-cmd">${l.prompt}</span></div><div class="t-out ${l.cls||''}">${l.response}</div>`;
      }
      if (li < lines.length) {
        const l = lines[li];
        if (phase === 'cmd') {
          html += `<div><span class="t-prompt">$</span> <span class="t-cmd">${currentCmd}</span><span class="t-caret">_</span></div>`;
        } else {
          html += `<div><span class="t-prompt">$</span> <span class="t-cmd">${l.prompt}</span></div><div class="t-out ${l.cls||''}">${l.response}</div>`;
        }
      }
      out.innerHTML = html;
    }
    function step() {
      if (li >= lines.length) { render(); return; }
      const l = lines[li];
      if (phase === 'cmd') {
        if (ci < l.prompt.length) { currentCmd += l.prompt[ci++]; render(); setTimeout(step, 35 + Math.random()*35); }
        else { phase = 'resp'; render(); setTimeout(step, 220); }
      } else {
        phase = 'cmd'; ci = 0; currentCmd = ''; li++; render(); setTimeout(step, 380);
      }
    }
    render(); setTimeout(step, 600);
  }

  /* -------------------------------------------------------
     5) GSAP HERO REVEAL (after preloader)
  ------------------------------------------------------- */
  async function initHeroReveal() {
    const waitPreloader = window.CCPreloader && window.CCPreloader.done ? window.CCPreloader.done : Promise.resolve();
    await waitPreloader;

    initRadar();
    initTerminal();
    initScramble();

    const heroEls = document.querySelectorAll('.cc-reveal');
    if (prefersReduced || !gsap) {
      heroEls.forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
      await revealScramble();
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(heroEls, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 });
    tl.add(() => { revealScramble(); }, '-=0.35');
  }

  function init() {
    initCursor();
    initHeroReveal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

