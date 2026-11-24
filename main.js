(() => {
  'use strict';

  /* 0. CYBER ATMOSPHERE - additive shared background loader */
  if (!window.__cyberAtmosphereLoaded && !document.querySelector('script[data-cyber-atmosphere]')) {
    const atmosphereScript = document.createElement('script');
    atmosphereScript.src = 'atmosphere.js';
    atmosphereScript.defer = true;
    atmosphereScript.dataset.cyberAtmosphere = 'true';
    document.head.appendChild(atmosphereScript);
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* 1. LENIS - SMOOTH SCROLLING */
  let lenis = null;
  function initLenis() {
    if (prefersReduced || typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    if (typeof ScrollTrigger !== 'undefined') lenis.on('scroll', ScrollTrigger.update);
    if (typeof gsap !== 'undefined') {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    window.__lenis = lenis;
  }

  /* 2. PRELOADER */
  function initPreloader() {
    const preloader = $('#preloader');
    const bar = $('#preloader-bar');
    const percent = $('#preloader-percent');
    const status = $('#preloader-status');
    const body = document.body;

    const done = () => {
      if (preloader) preloader.style.display = 'none';
      body.classList.remove('is-loading');
      window.dispatchEvent(new CustomEvent('preloaderComplete'));
    };

    if (!preloader) { done(); return; }

    if (prefersReduced || typeof gsap === 'undefined') {
      if (bar) bar.style.width = '100%';
      if (percent) percent.textContent = '100%';
      if (status) status.textContent = 'SYSTEM READY';
      done();
      return;
    }

    const statusMessages = ['INITIALIZING MODULES', 'LOADING PROTOCOLS', 'VERIFYING INTEGRITY', 'SYSTEM READY'];
    let msgIndex = 0;
    const tl = gsap.timeline({ onComplete: revealSite });

    tl.to({ val: 0 }, {
      val: 100, duration: 2.0, ease: 'power2.inOut',
      onUpdate: function () {
        const progress = Math.round(this.targets()[0].val);
        if (bar) bar.style.width = progress + '%';
        if (percent) percent.textContent = progress + '%';
        const newIndex = Math.min(statusMessages.length - 1, Math.floor((progress / 100) * statusMessages.length));
        if (newIndex !== msgIndex && status) {
          msgIndex = newIndex;
          status.textContent = statusMessages[msgIndex];
        }
      }
    });
    tl.to({}, { duration: 0.25 });

    function revealSite() {
      const revealTl = gsap.timeline({ onComplete: done });
      revealTl.to('.preloader__inner', { opacity: 0, y: -16, duration: 0.45, ease: 'power2.out' });
      revealTl.to(preloader, { yPercent: -100, duration: 0.9, ease: 'power3.inOut' }, '-=0.15');
    }
  }

  /* 3. ADVANCED CONTEXTUAL CURSOR */
  function initCustomCursor() {
    const dot = $('#cursor-dot') || document.querySelector('.cursor-dot');
    const ring = $('#cursor-ring') || document.querySelector('.cursor-ring');
    if (!dot || !ring || !finePointer || prefersReduced || typeof gsap === 'undefined') return;

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
    const CLICK_SELECTOR = 'a, button, [role="button"], .btn, .filter-btn, .submit-btn, .navbar__link, .mobile-nav__link, .case-file__link, summary';
    const READ_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, dt, dd';

    const RANK = { read: 1, interactive: 2, type: 3, card: 4 };
    const CONTEXT_CLASSES = ['is-context-interactive', 'is-context-card', 'is-context-read', 'is-context-type'];

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
        dot.classList.remove('is-hovering');
        ring.classList.remove('is-hovering');
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

  /* 3b. INTERACTIVE HERO TERMINAL */
  function initInteractiveTerminal() {
    const terminal = $('#hero-terminal');
    const terminalBody = terminal ? terminal.querySelector('.terminal__body') : null;
    const activeLine = $('#terminal-active-line');
    const input = $('#terminal-input');
    const mirror = $('#terminal-input-mirror');
    if (!terminal || !terminalBody || !activeLine || !input || !mirror || input.dataset.terminalReady) return;

    input.dataset.terminalReady = 'true';
    terminal.classList.add('is-interactive');

    const COMMANDS = ['help', 'about', 'skills', 'projects', 'contact', 'clear', 'whoami'];
    const history = [];
    const queue = [];
    let historyIndex = 0;
    let busy = false;
    let enabled = false;

    function setInputValue(value) {
      input.value = value;
      mirror.textContent = value;
      requestAnimationFrame(() => {
        try { input.setSelectionRange(value.length, value.length); } catch (err) { /* noop */ }
      });
    }

    function scrollToBottom() {
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    function appendCommandLine(command) {
      const line = document.createElement('div');
      line.className = 'terminal__line';

      const prompt = document.createElement('span');
      prompt.className = 'terminal__prompt';
      prompt.setAttribute('aria-hidden', 'true');
      prompt.textContent = '$';

      const cmd = document.createElement('span');
      cmd.className = 'terminal__cmd';
      cmd.textContent = command;

      line.appendChild(prompt);
      line.appendChild(cmd);
      terminalBody.insertBefore(line, activeLine);
    }

    function typeOutput(container, lines, done) {
      let lineIndex = 0;

      function nextLine() {
        if (lineIndex >= lines.length) { done(); return; }

        const line = document.createElement('span');
        line.className = 'terminal__output-line';
        container.appendChild(line);

        const text = lines[lineIndex];
        let charIndex = 0;

        function typeChar() {
          if (charIndex >= text.length) {
            lineIndex += 1;
            setTimeout(nextLine, prefersReduced ? 0 : 35);
            return;
          }
          line.textContent += text.charAt(charIndex);
          charIndex += 1;
          scrollToBottom();
          setTimeout(typeChar, prefersReduced ? 0 : 10);
        }

        typeChar();
      }

      nextLine();
    }

    function responseFor(command) {
      switch (command) {
        case 'help':
          return [
            'help       Show all available commands',
            'about      Short introduction about the developer',
            'skills     Technical skills and areas of expertise',
            'projects   Available public projects',
            'contact    Contact information and social links',
            'whoami     Developer identity description',
            'clear      Clear the terminal screen'
          ];
        case 'about':
          return [
            'Wajih Khadraoui — cybersecurity enthusiast focused on security research,',
            'ethical hacking, defensive security, and specialized security tooling.',
            'Web development remains a personal hobby.'
          ];
        case 'skills':
          return [
            'SECURITY   : Ethical Hacking, Vulnerability Assessment, OSINT, Network Security',
            'PROGRAMMING: Python, JavaScript, PHP (learning), Bash (learning)',
            'SYSTEMS    : Linux (Kali/Ubuntu), Windows Server (learning), Nmap, Wireshark',
            'EMERGING   : LLMs, RAG, FAISS, AI-driven Security (learning)'
          ];
        case 'projects':
          return [
            '[ PUBLIC FILES ]',
            '01  Defensive Security System          [ IN DEVELOPMENT ]',
            '02  Automated OSINT Recon Tool         [ ACTIVE ]',
            '03  Web Vulnerability Scanner          [ COMPLETED ]',
            '04  AI-Driven Log Analyzer             [ PRIVATE RESEARCH ]',
            '05  Device Control & Exploitation Lab  [ RESTRICTED ]',
            '06  Advanced Penetration Testing Suite [ PROHIBITED ]',
            'Full dossier => projects.html'
          ];
        case 'contact':
          return [
            'EMAIL    : khadraouiwajih3@gmail.com',
            'GITHUB   : https://github.com/X7-VANTHOR',
            'LINKEDIN : https://www.linkedin.com/in/wajih-khadraoui-2067b4359/'
          ];
        case 'whoami':
          return [
            'wajih_khadraoui // Security Researcher & Tool Developer',
            'CLEARANCE: Authorized   MODE: Research & Development   POSTURE: Defensive'
          ];
        default:
          return ['command not found: ' + command + " — type 'help' for available commands."];
      }
    }

    function processQueue() {
      if (busy || !queue.length || !enabled) return;
      busy = true;

      const raw = queue.shift();
      const command = raw.trim().toLowerCase();

      if (command === 'clear') {
        $$('.terminal__line:not(.terminal__line--active), .terminal__output', terminalBody).forEach((el) => el.remove());
        busy = false;
        scrollToBottom();
        processQueue();
        return;
      }

      appendCommandLine(raw);

      const output = document.createElement('div');
      output.className = 'terminal__output';
      if (!COMMANDS.includes(command)) output.classList.add('terminal__output--error');
      terminalBody.insertBefore(output, activeLine);

      typeOutput(output, responseFor(command), () => {
        busy = false;
        scrollToBottom();
        processQueue();
      });
    }

    input.addEventListener('input', () => {
      mirror.textContent = input.value;
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const raw = input.value.trim();
        setInputValue('');
        if (!raw) return;
        history.push(raw);
        historyIndex = history.length;
        queue.push(raw);
        processQueue();
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (!history.length) return;
        historyIndex = Math.max(0, historyIndex - 1);
        setInputValue(history[historyIndex]);
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!history.length) return;
        historyIndex = Math.min(history.length, historyIndex + 1);
        setInputValue(historyIndex === history.length ? '' : history[historyIndex]);
      }
    });

    terminal.addEventListener('click', (event) => {
      if (!enabled) return;
      if (event.target instanceof Element && event.target.closest('a, button')) return;
      if (String(window.getSelection() || '').length) return;
      input.focus({ preventScroll: true });
    });

    function enable() {
      if (enabled) return;
      enabled = true;
      input.disabled = false;
      scrollToBottom();
    }

    function arm() {
      setTimeout(() => {
        const ready = () => activeLine.style.opacity === '1' ||
          (!activeLine.style.opacity && window.getComputedStyle(activeLine).opacity === '1');

        if (ready()) { enable(); return; }

        let observer = null;
        if (typeof MutationObserver !== 'undefined') {
          observer = new MutationObserver(() => {
            if (ready()) { enable(); observer.disconnect(); }
          });
          observer.observe(activeLine, { attributes: true, attributeFilter: ['style'] });
        }

        setTimeout(() => {
          if (observer) observer.disconnect();
          enable();
        }, 15000);
      }, 0);
    }

    if (document.body.classList.contains('is-loading')) {
      window.addEventListener('preloaderComplete', arm, { once: true });
    } else {
      arm();
    }
    setTimeout(enable, 30000);
  }

  /* 4. SCROLL PROGRESS */
  function initScrollProgress() {
    const bar = $('#scroll-progress-bar');
    if (!bar || document.body.classList.contains('has-reading-progress')) return;
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
    }, { passive: true });
  }

  /* 5. NAVBAR */
  function initNavbar() {
    const navbar = $('#navbar');
    window.addEventListener('scroll', () => {
      if (navbar) navbar.classList.toggle('is-scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  /* 6. PAGE TRANSITION */
  function initPageTransition() {
    let overlay = document.querySelector('.page-transition');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'page-transition';
      overlay.innerHTML = '<div class="page-transition__inner"><p class="page-transition__text">[ INITIALIZING... ]<span class="caret">_</span></p></div>';
      document.body.appendChild(overlay);
    }
    if (prefersReduced) return;
    
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a || a.hasAttribute('download') || a.getAttribute('href').startsWith('#') || a.href.startsWith('blob:') || a.href.startsWith('data:') || a.getAttribute('target') === '_blank') return;
      if (new URL(a.href).origin !== window.location.origin) return;
      
      e.preventDefault();
      overlay.style.visibility = 'visible';
      overlay.classList.add('is-active');
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.6, onComplete: () => { window.location.href = a.href; } });
    });
  }

  /* 7. CYBER DATA MAP (Cinematic 3D Wireframe Globe) - Fixed */
  function initCyberDataMap() {
    const wraps = document.querySelectorAll('.cyber-data-map'); // Fix: Added querySelectorAll
    if (!wraps.length) return;

    wraps.forEach((wrap) => {
      if (wrap.dataset.init) return;
      wrap.dataset.init = 'true';

      const canvas = wrap.querySelector('canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let w = 0, h = 0, dpr = 1, raf = null;
      let t0 = performance.now();

      const NODE_COUNT = 170;
      const CONNECTION_DIST = 0.45;
      const nodes = [];
      const packets = [];

      for (let i = 0; i < NODE_COUNT; i++) {
        const y = 1 - (i / (NODE_COUNT - 1)) * 2;
        const radius = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = Math.PI * (3 - Math.sqrt(5)) * i;
        nodes.push({ x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius, alert: Math.random() < 0.14, pulse: Math.random() * Math.PI * 2 });
      }
      for (let i = 0; i < 18; i++) {
        packets.push({ a: Math.floor(Math.random()*NODE_COUNT), b: Math.floor(Math.random()*NODE_COUNT), t: Math.random(), speed: 0.002 + Math.random()*0.004, magenta: Math.random() < 0.35 });
      }

      const resize = () => {
        const rect = wrap.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = Math.max(1, Math.floor(rect.width));
        h = Math.max(1, Math.floor(rect.height));
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      const rotateY = (p, a) => { const c=Math.cos(a), s=Math.sin(a); return { x:p.x*c+p.z*s, y:p.y, z:-p.x*s+p.z*c }; };
      const rotateX = (p, a) => { const c=Math.cos(a), s=Math.sin(a); return { x:p.x, y:p.y*c-p.z*s, z:p.y*s+p.z*c }; };
      const project = (p, cx, cy, r) => { const persp = 2.6 / (2.6 - p.z); return { sx: cx + p.x*r*persp, sy: cy + p.y*r*persp, z: p.z, scale: persp }; };

      const draw = (now) => {
        const t = (now - t0) * 0.001;
        ctx.clearRect(0, 0, w, h);
        const cx = w * 0.5, cy = h * 0.5, R = Math.min(w, h) * 0.35; // Adjusted to center in right column
        const rotY = t * 0.24, rotX = 0.42 + Math.sin(t * 0.14) * 0.07;

        const P = nodes.map((n) => { let p = rotateX(rotateY(n, rotY), rotX); return { ...n, ...p, ...project(p, cx, cy, R) }; });

        // Radar sweep
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(t*0.65);
        const cone = ctx.createConicGradient(0,0,0);
        cone.addColorStop(0,'rgba(0,240,255,0.15)'); cone.addColorStop(0.06,'rgba(0,240,255,0.05)'); cone.addColorStop(0.16,'rgba(0,240,255,0)'); cone.addColorStop(1,'rgba(0,240,255,0)');
        ctx.fillStyle=cone; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,R*1.22,0,Math.PI*2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle='rgba(0,240,255,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(R*1.22,0); ctx.stroke(); ctx.restore();

        // Connections
        ctx.lineWidth=1;
        for(let i=0;i<P.length;i++){
          const a=P[i]; 
          for(let j=i+1;j<P.length;j++){
            const b=P[j]; 
            const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z; 
            const dist=Math.sqrt(dx*dx+dy*dy+dz*dz);
            if(dist<CONNECTION_DIST){
              const depth=(a.z+b.z)*0.5; 
              const alpha=(1-dist/CONNECTION_DIST)*(0.05+Math.max(0,depth)*0.15); 
              if(alpha<=0.005) continue;
              
              const mag = (a.alert && b.alert);
              // Fix: Corrected rgba strings
              ctx.strokeStyle = mag ? `rgba(255,42,109,${alpha})` : `rgba(0,240,255,${alpha})`; 
              ctx.beginPath(); ctx.moveTo(a.sx,a.sy); ctx.lineTo(b.sx,b.sy); ctx.stroke(); 
            }
          }
        }

        // Packets
        packets.forEach((pk)=>{ 
          pk.t+=pk.speed; 
          if(pk.t>=1||pk.a===pk.b){
            pk.a=Math.floor(Math.random()*NODE_COUNT); 
            pk.b=Math.floor(Math.random()*NODE_COUNT); 
            if(pk.a===pk.b)pk.b=(pk.b+1)%NODE_COUNT; 
            pk.t=0; 
            pk.magenta=Math.random()<0.35;
          }
          const a=P[pk.a], b=P[pk.b]; 
          const x=a.sx+(b.sx-a.sx)*pk.t, y=a.sy+(b.sy-a.sy)*pk.t, z=a.z+(b.z-a.z)*pk.t; 
          const alpha=0.3+Math.max(0,z)*0.7; 
          const rgb=pk.magenta?'255,42,109':'0,240,255';
          
          // Fix: Corrected rgba strings
          ctx.beginPath(); ctx.fillStyle=`rgba(${rgb},${alpha})`; ctx.arc(x,y,2,0,Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.fillStyle=`rgba(${rgb},${alpha*0.3})`; ctx.arc(x,y,6,0,Math.PI*2); ctx.fill(); 
        });

        // Nodes
        for(const n of P){
          const depthAlpha=0.2+Math.max(0,n.z)*0.8; 
          const size=(n.alert?2:1.4)*(0.7+n.scale*0.45); 
          const rgb=n.alert?'255,42,109':'0,240,255';
          
          // Fix: Corrected rgba strings
          ctx.beginPath(); ctx.fillStyle=`rgba(${rgb},${depthAlpha*0.2})`; ctx.arc(n.sx,n.sy,size*3,0,Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.fillStyle=`rgba(${rgb},${depthAlpha})`; ctx.arc(n.sx,n.sy,size,0,Math.PI*2); ctx.fill(); 
        }

        raf = requestAnimationFrame(draw);
      };

      resize(); draw(performance.now());
      let resizeTimer; window.addEventListener('resize', ()=>{ clearTimeout(resizeTimer); resizeTimer=setTimeout(resize,50); }, {passive:true});
      document.addEventListener('visibilitychange', ()=>{ if(document.hidden){ if(raf){cancelAnimationFrame(raf); raf=null;} } else if(!raf){ raf=requestAnimationFrame(draw); } });
    });
  }



  /* 8. GLOBAL ANIMATION SYSTEM (additive, safe) */
  function initGlobalAnimations() {
    if (prefersReduced) {
      $$('.reveal, [data-reveal], .stagger').forEach(el => el.classList.add('is-visible'));
      return;
    }

    // Add subtle ambient scanline once
    if (!document.querySelector('.ambient-scanline')) {
      const scan = document.createElement('div');
      scan.className = 'ambient-scanline';
      scan.setAttribute('aria-hidden', 'true');
      document.body.appendChild(scan);
    }

    // Auto-mark common elements for reveal (without touching existing ones)
    const autoSelectors = [
      '.section-heading', '.section-subtitle', '.case-file', '.project-card',
      '.module-card', '.expertise-card', '.stat-card', '.info-card', '.panel',
      '.contact-card', '.timeline-item', '.research-card', '.footer__inner > *'
    ];
    autoSelectors.forEach(sel => {
      $$(sel).forEach((el, i) => {
        if (el.closest('.preloader, .navbar, .page-transition, .cyber-anim-container')) return;
        if (el.classList.contains('reveal') || el.hasAttribute('data-reveal')) return;
        if (el.dataset.gsapAnimated || el.dataset.animInit) return;
        el.classList.add('reveal');
        el.style.transitionDelay = Math.min(i * 60, 360) + 'ms';
      });
    });

    const revealEls = $$('.reveal, [data-reveal], .stagger');
    if (!revealEls.length) return;

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      revealEls.forEach(el => io.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('is-visible'));
    }
  }

  /* INIT ALL */
  function init() {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }
    initPageTransition();
    initLenis();
    initScrollProgress();
    initCustomCursor();
    initInteractiveTerminal();
    initNavbar();
    initCyberDataMap(); 
    initGlobalAnimations();
    initPreloader();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();