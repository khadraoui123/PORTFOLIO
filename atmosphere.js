/* ============================================================
   CYBER ATMOSPHERE - ELITE SECURITY ENVIRONMENT
   Additive full-screen canvas system. No dependencies.
   ============================================================ */

(() => {
  'use strict';

  if (window.__cyberAtmosphereLoaded) return;
  window.__cyberAtmosphereLoaded = true;

  const STYLE_ID = 'cyber-atmosphere-style';
  const CANVAS_CLASS = 'cyber-atmosphere';

  if (document.getElementById(STYLE_ID) || document.querySelector('.' + CANVAS_CLASS)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .cyber-atmosphere {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      height: 100dvh !important;
      z-index: 0 !important;
      pointer-events: none !important;
      display: block !important;
      opacity: 1;
    }

    body.has-cyber-atmosphere > main,
    body.has-cyber-atmosphere > footer,
    body.has-cyber-atmosphere > .footer,
    body.has-cyber-atmosphere > .site-footer {
      position: relative;
      z-index: 1;
    }

    @media (max-width: 700px) {
      .cyber-atmosphere { opacity: 0.82; }
    }

    @media (prefers-reduced-motion: reduce) {
      .cyber-atmosphere { opacity: 0.68; }
    }
  `;
  document.head.appendChild(style);

  const canvas = document.createElement('canvas');
  canvas.className = CANVAS_CLASS;
  canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);
  document.body.classList.add('has-cyber-atmosphere');

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    canvas.remove();
    return;
  }

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  const TAU = Math.PI * 2;
  const GREEN = '5, 255, 161';
  const CYAN = '0, 240, 255';
  const RED = '255, 42, 109';
  const FRAME_INTERVAL = 1000 / 45;
  const IP_PREFIXES = ['192.0.2', '198.51.100', '203.0.113'];
  const GLYPHS = '01ABCDEF<>[]{}/\\$#*+='.split('');
  const TAGS = ['TCP/443', 'UDP/53', 'TLS/1.3', 'SHA::A3F1', 'AES-256', 'TRACE::0C', 'PKT/ACK', 'SEC//NODE'];

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  let vw = 0;
  let vh = 0;
  let dpr = 1;
  let compact = false;
  let raf = 0;
  let resizeRaf = 0;
  let lastTime = 0;
  let intensity = 1;

  let ambient = [];
  let rain = [];
  let fragments = [];
  let topology = null;
  let baseLight = null;
  let secondaryLight = null;
  let coreGlow = null;
  let vignette = null;
  let topShade = null;

  let glitchUntil = 0;
  let nextGlitch = 0;
  let glitchBars = [];

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (list) => list[(Math.random() * list.length) | 0];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const rgba = (rgb, alpha) => 'rgba(' + rgb + ',' + clamp(alpha, 0, 1).toFixed(3) + ')';

  function randomIp() {
    return pick(IP_PREFIXES) + '.' + (10 + ((Math.random() * 240) | 0));
  }

  function randomHex() {
    const value = Math.floor(rand(0, 0xffff)).toString(16).toUpperCase();
    return '0x' + ('000' + value).slice(-4);
  }

  function randomFragment() {
    const roll = Math.random();
    if (roll < 0.28) return randomIp();
    if (roll < 0.58) return randomHex();
    if (roll < 0.78) return pick(TAGS);
    return 'ENC::' + randomHex().slice(2);
  }

  function makeNode(x, y, z) {
    return {
      x: x,
      y: y,
      baseX: x,
      baseY: y,
      rx: x,
      ry: y,
      vx: rand(-10, 10),
      vy: rand(-8, 8),
      z: z,
      r: rand(0.8, 2.1) * (0.55 + z * 0.7),
      alpha: rand(0.16, 0.52) * (0.6 + z * 0.5),
      phase: rand(0, TAU),
      pulse: 0,
      level: 0,
      branch: -1,
      parent: null
    };
  }

  function buildTopology() {
    const coreX = compact ? vw * 0.5 : vw * 0.72;
    const coreY = compact ? vh * 0.24 : vh * 0.48;
    const radius = Math.min(vw, vh) * (compact ? 0.19 : 0.3);
    const branchCount = compact ? 5 : 7;
    const levels = compact ? 4 : 6;

    const core = makeNode(coreX, coreY, 1);
    core.r = 4.2;
    core.alpha = 1;
    core.branch = -1;

    const nodes = [core];
    const edges = [];
    const branches = [];

    for (let b = 0; b < branchCount; b += 1) {
      const angle = (b / branchCount) * TAU + 0.35;
      const branchZ = rand(0.62, 1);
      const branchRadius = radius * rand(0.68, 0.92);
      const bx = coreX + Math.cos(angle) * branchRadius;
      const by = coreY + Math.sin(angle) * branchRadius * 0.78;
      const branchNode = makeNode(bx, by, branchZ);
      branchNode.branch = b;
      branchNode.level = 1;
      branchNode.parent = core;
      nodes.push(branchNode);
      branches.push(branchNode);
      edges.push({ a: core, b: branchNode, branch: b, phase: rand(0, TAU), depth: branchZ });

      let parent = branchNode;
      for (let level = 2; level <= levels; level += 1) {
        const spread = angle + rand(-0.26, 0.26) + (level - 2) * 0.05;
        const distance = branchRadius + level * radius * 0.155 + rand(-10, 14);
        const z = clamp(branchZ - level * 0.055 + rand(-0.08, 0.08), 0.32, 1);
        const node = makeNode(
          coreX + Math.cos(spread) * distance + rand(-14, 14),
          coreY + Math.sin(spread) * distance * 0.78 + rand(-14, 14),
          z
        );
        node.branch = b;
        node.level = level;
        node.parent = parent;
        nodes.push(node);
        edges.push({ a: parent, b: node, branch: b, phase: rand(0, TAU), depth: z });
        parent = node;
      }
    }

    const packetCount = compact ? 13 : Math.round(22 * clamp(vw * vh / (1440 * 900), 0.7, 1.2));
    const packets = Array.from({ length: packetCount }, () => ({
      edge: (Math.random() * edges.length) | 0,
      t: Math.random(),
      speed: rand(0.09, 0.26),
      dir: Math.random() > 0.5 ? 1 : -1,
      color: Math.random() > 0.24 ? GREEN : CYAN
    }));

    topology = {
      core: core,
      nodes: nodes,
      edges: edges,
      branches: branches,
      packets: packets,
      radius: radius,
      coreX: coreX,
      coreY: coreY
    };
  }

  function buildScene() {
    const area = Math.max(1, vw * vh);
    const density = clamp(area / (1440 * 900), 0.58, 1.22);

    ambient = Array.from({ length: Math.round((compact ? 76 : 156) * density) }, () => {
      const node = makeNode(rand(0, vw), rand(0, vh), rand(0.35, 1));
      node.glyph = pick(GLYPHS);
      return node;
    });

    rain = Array.from({ length: compact ? 16 : Math.round(26 * density) }, (_, i) => ({
      x: rand(0, vw),
      y: rand(-vh * 0.5, vh),
      speed: rand(20, 68),
      font: compact ? 9 : rand(9, 12),
      alpha: rand(0.055, 0.16),
      depth: rand(0.45, 1),
      trail: 3 + ((Math.random() * 3) | 0),
      offset: i * 0.71,
      glyphs: Array.from({ length: 18 }, () => pick(GLYPHS))
    }));

    fragments = Array.from({ length: compact ? 10 : Math.round(17 * density) }, () => ({
      text: randomFragment(),
      x: rand(0, vw),
      y: rand(0, vh),
      vx: rand(-6, 6),
      vy: rand(-13, -3),
      alpha: rand(0.045, 0.13),
      depth: rand(0.5, 1),
      size: compact ? 8 : rand(8, 10),
      phase: rand(0, TAU)
    }));

    baseLight = ctx.createRadialGradient(vw * 0.72, vh * 0.42, 0, vw * 0.72, vh * 0.42, Math.max(vw, vh) * 0.7);
    baseLight.addColorStop(0, rgba(GREEN, 0.055));
    baseLight.addColorStop(0.42, rgba(CYAN, 0.018));
    baseLight.addColorStop(1, 'rgba(0,0,0,0)');

    secondaryLight = ctx.createRadialGradient(vw * 0.12, vh * 0.82, 0, vw * 0.12, vh * 0.82, Math.max(vw, vh) * 0.58);
    secondaryLight.addColorStop(0, rgba(CYAN, 0.032));
    secondaryLight.addColorStop(0.5, rgba(RED, 0.014));
    secondaryLight.addColorStop(1, 'rgba(0,0,0,0)');

    coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, topology.radius * 1.25);
    coreGlow.addColorStop(0, rgba(GREEN, 0.2));
    coreGlow.addColorStop(0.35, rgba(GREEN, 0.08));
    coreGlow.addColorStop(0.72, rgba(CYAN, 0.025));
    coreGlow.addColorStop(1, 'rgba(0,0,0,0)');

    vignette = ctx.createRadialGradient(vw * 0.5, vh * 0.48, Math.min(vw, vh) * 0.15, vw * 0.5, vh * 0.48, Math.max(vw, vh) * 0.78);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.62, 'rgba(0,0,0,0.16)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.66)');

    topShade = ctx.createLinearGradient(0, 0, 0, vh);
    topShade.addColorStop(0, 'rgba(0,0,0,0.16)');
    topShade.addColorStop(0.2, 'rgba(0,0,0,0)');
    topShade.addColorStop(0.8, 'rgba(0,0,0,0)');
    topShade.addColorStop(1, 'rgba(0,0,0,0.2)');

    glitchBars = [];
    glitchUntil = 0;
    nextGlitch = performance.now() + rand(4200, 9000);
  }

  function resize() {
    const viewport = window.visualViewport;
    vw = Math.max(1, Math.round(viewport ? viewport.width : window.innerWidth));
    vh = Math.max(1, Math.round(viewport ? viewport.height : window.innerHeight));
    compact = vw < 700;
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);

    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    buildTopology();
    buildScene();
    render(performance.now(), true);
  }

  function update(dt, now) {
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
    intensity = 0.9 + Math.sin(now * 0.00017) * 0.1;

    ambient.forEach((node) => {
      node.x += node.vx * dt * (0.45 + node.z * 0.75);
      node.y += node.vy * dt * (0.45 + node.z * 0.75);
      const margin = 26;
      if (node.x < -margin) node.x = vw + margin;
      if (node.x > vw + margin) node.x = -margin;
      if (node.y < -margin) node.y = vh + margin;
      if (node.y > vh + margin) node.y = -margin;
      node.pulse *= 0.94;
      if (Math.random() < 0.00035) node.pulse = 1;
    });

    topology.nodes.forEach((node) => {
      const jitter = node === topology.core ? 0.8 : 4.5 * (1.15 - node.z);
      node.rx = node.baseX + Math.sin(now * 0.00062 + node.phase) * jitter;
      node.ry = node.baseY + Math.cos(now * 0.00054 + node.phase * 1.3) * jitter;
      node.pulse *= 0.93;
    });

    topology.packets.forEach((packet) => {
      packet.t += packet.speed * dt * packet.dir;
      if (packet.t > 1 || packet.t < 0) {
        const edge = topology.edges[packet.edge];
        const target = packet.dir > 0 ? edge.b : edge.a;
        target.pulse = 1;
        if (Math.random() < 0.14) {
          packet.edge = (Math.random() * topology.edges.length) | 0;
        }
        packet.t = packet.dir > 0 ? 0 : 1;
      }
    });

    rain.forEach((column) => {
      column.y += column.speed * dt;
      if (column.y - column.trail * column.font > vh + 20) {
        column.y = rand(-160, -12);
        column.x = rand(0, vw);
      }
      if (Math.random() < 0.015) {
        column.glyphs[(Math.random() * column.glyphs.length) | 0] = pick(GLYPHS);
      }
    });

    fragments.forEach((fragment) => {
      fragment.x += fragment.vx * dt;
      fragment.y += fragment.vy * dt;
      if (fragment.y < -40) {
        fragment.y = vh + 30;
        fragment.x = rand(0, vw);
        fragment.text = randomFragment();
      }
      if (fragment.x < -110) fragment.x = vw + 110;
      if (fragment.x > vw + 110) fragment.x = -110;
    });

    if (now > nextGlitch) {
      glitchUntil = now + rand(100, 220);
      nextGlitch = now + rand(4800, 10500);
      glitchBars = Array.from({ length: 3 + ((Math.random() * 3) | 0) }, () => ({
        x: rand(0, vw * 0.72),
        y: rand(vh * 0.1, vh * 0.9),
        w: rand(36, 150),
        h: rand(1, 3),
        color: Math.random() > 0.62 ? rgba(RED, 0.2) : rgba(GREEN, 0.16)
      }));
    }
  }

  function parallax(z, staticFrame) {
    if (staticFrame) return { x: 0, y: 0 };
    return { x: pointer.x * 16 * z, y: pointer.y * 11 * z };
  }

  function drawLighting() {
    ctx.fillStyle = baseLight;
    ctx.fillRect(0, 0, vw, vh);
    ctx.fillStyle = secondaryLight;
    ctx.fillRect(0, 0, vw, vh);
    ctx.fillStyle = 'rgba(7, 9, 9, 0.22)';
    ctx.fillRect(0, 0, vw, vh);
  }

  function drawGrid(now, staticFrame) {
    const offset = parallax(0.35, staticFrame);
    const horizon = vh * 0.44 + offset.y;
    const drift = staticFrame ? 0 : (now * 0.006) % 52;

    ctx.save();
    ctx.lineWidth = 1;

    ctx.strokeStyle = rgba(CYAN, 0.032 * intensity);
    const small = 64;
    const ox = (offset.x % small + small) % small;
    for (let x = -small; x < vw + small; x += small) {
      ctx.beginPath();
      ctx.moveTo(x + ox, 0);
      ctx.lineTo(x + ox, vh);
      ctx.stroke();
    }

    ctx.strokeStyle = rgba(GREEN, 0.05 * intensity);
    for (let i = 0; i < 11; i += 1) {
      const t = i / 10;
      const y = horizon + Math.pow(t, 1.65) * (vh - horizon) + drift * t;
      if (y > vh + 2) continue;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(vw, y);
      ctx.stroke();
    }

    const vpX = vw * 0.5 + offset.x;
    ctx.strokeStyle = rgba(GREEN, 0.038 * intensity);
    for (let i = -7; i <= 7; i += 1) {
      ctx.beginPath();
      ctx.moveTo(vpX, horizon);
      ctx.lineTo(vpX + i * (vw / 5.8), vh);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawRain(now, staticFrame) {
    ctx.save();
    ctx.textBaseline = 'top';
    rain.forEach((column) => {
      const offset = parallax(column.depth, staticFrame);
      const x = column.x + offset.x;
      const baseY = column.y + offset.y;
      const shift = staticFrame ? 0 : ((now / 760 + column.offset) | 0);

      ctx.font = column.font.toFixed(0) + 'px "JetBrains Mono", monospace';
      for (let i = 0; i < column.trail; i += 1) {
        const y = baseY - i * column.font * 1.32;
        if (y < -18 || y > vh + 18) continue;
        const alpha = column.alpha * (1 - i / (column.trail + 0.5)) * intensity;
        ctx.fillStyle = i === 0 ? rgba(GREEN, alpha * 1.35) : rgba(CYAN, alpha);
        ctx.fillText(column.glyphs[(i + shift + column.glyphs.length) % column.glyphs.length], x, y);
      }
    });
    ctx.restore();
  }

  function drawAmbientNetwork(now, staticFrame) {
    const cell = compact ? 104 : 128;
    const linkDistance = cell * 1.1;
    const linkSq = linkDistance * linkDistance;
    const cols = Math.ceil(vw / cell) + 2;
    const rows = Math.ceil(vh / cell) + 2;
    const buckets = new Array(cols * rows);

    for (let i = 0; i < buckets.length; i += 1) buckets[i] = [];
    ambient.forEach((node) => {
      const cx = Math.floor(node.x / cell) + 1;
      const cy = Math.floor(node.y / cell) + 1;
      const index = cy * cols + cx;
      if (buckets[index]) buckets[index].push(node);
    });

    ctx.save();
    ctx.lineWidth = 1;

    ambient.forEach((node) => {
      const cx = Math.floor(node.x / cell) + 1;
      const cy = Math.floor(node.y / cell) + 1;
      let links = 0;

      for (let gx = -1; gx <= 1 && links < 3; gx += 1) {
        for (let gy = -1; gy <= 1 && links < 3; gy += 1) {
          const bucket = buckets[(cy + gy) * cols + (cx + gx)];
          if (!bucket) continue;

          for (let i = 0; i < bucket.length && links < 3; i += 1) {
            const other = bucket[i];
            if (other === node || other.x < node.x) continue;
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const distSq = dx * dx + dy * dy;
            if (distSq > linkSq) continue;

            const dist = Math.sqrt(distSq);
            const flicker = 0.7 + 0.3 * Math.sin(now * 0.0021 + node.phase + other.phase);
            const alpha = (1 - dist / linkDistance) * 0.14 * Math.min(node.z, other.z) * flicker * intensity;
            ctx.strokeStyle = rgba(node.z > 0.78 || other.z > 0.9 ? GREEN : CYAN, alpha);
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
            links += 1;
          }
        }
      }
    });

    ambient.forEach((node) => {
      const offset = parallax(node.z, staticFrame);
      const x = node.x + offset.x;
      const y = node.y + offset.y;
      const pulse = staticFrame ? 0.25 : 0.5 + 0.5 * Math.sin(now * 0.0016 + node.phase);
      const alpha = (node.alpha * 0.45 + node.pulse * 0.5 + pulse * 0.12) * intensity;

      if (node.pulse > 0.25 || node.z > 0.92) {
        ctx.fillStyle = rgba(GREEN, alpha * 0.25);
        ctx.beginPath();
        ctx.arc(x, y, node.r * 3.4, 0, TAU);
        ctx.fill();
      }

      ctx.fillStyle = rgba(node.pulse > 0.25 ? GREEN : CYAN, alpha);
      ctx.beginPath();
      ctx.arc(x, y, node.r, 0, TAU);
      ctx.fill();
    });

    ctx.restore();
  }

  function drawRadar(now, staticFrame) {
    const core = topology.core;
    const offset = parallax(0.7, staticFrame);
    const x = core.rx + offset.x;
    const y = core.ry + offset.y;
    const radius = topology.radius * 1.45;
    const angle = staticFrame ? 0.7 : (now * 0.00032) % TAU;

    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = rgba(GREEN, 0.075 * intensity);
    ctx.lineWidth = 1;
    [0.38, 0.68, 1].forEach((scale, index) => {
      ctx.beginPath();
      ctx.arc(0, 0, radius * scale, 0, TAU);
      ctx.stroke();
      if (index === 1) {
        ctx.setLineDash([3, 9]);
        ctx.strokeStyle = rgba(CYAN, 0.06 * intensity);
        ctx.beginPath();
        ctx.arc(0, 0, radius * scale * 0.92, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    ctx.strokeStyle = rgba(CYAN, 0.05 * intensity);
    ctx.beginPath();
    ctx.moveTo(-radius, 0);
    ctx.lineTo(radius, 0);
    ctx.moveTo(0, -radius);
    ctx.lineTo(0, radius);
    ctx.stroke();

    const slices = 18;
    for (let i = 0; i < slices; i += 1) {
      const a0 = angle - i * 0.022;
      const a1 = angle - (i - 1) * 0.022;
      const alpha = 0.052 * (1 - i / slices) * intensity;
      ctx.fillStyle = rgba(GREEN, alpha);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, a0, a1);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawTopology(now, staticFrame) {
    const activeBranch = staticFrame ? 0 : Math.floor(now / 4600) % topology.branches.length;
    const edgeOffset = parallax(0.6, staticFrame);

    ctx.save();
    ctx.lineWidth = 1;

    topology.edges.forEach((edge) => {
      const a = edge.a;
      const b = edge.b;
      const aOffset = parallax(a.z, staticFrame);
      const bOffset = parallax(b.z, staticFrame);
      const ax = a.rx + aOffset.x;
      const ay = a.ry + aOffset.y;
      const bx = b.rx + bOffset.x;
      const by = b.ry + bOffset.y;
      const active = edge.branch === activeBranch ? 1.45 : 1;
      const flicker = staticFrame ? 0.85 : 0.72 + 0.28 * Math.sin(now * 0.0018 + edge.phase);
      const alpha = (0.1 + edge.depth * 0.16) * flicker * active * intensity;

      ctx.strokeStyle = rgba(GREEN, alpha);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();

      if (edge.depth > 0.78 && active > 1) {
        ctx.strokeStyle = rgba(CYAN, alpha * 0.45);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    });

    topology.nodes.forEach((node) => {
      if (node === topology.core) return;
      const offset = parallax(node.z, staticFrame);
      const x = node.rx + offset.x;
      const y = node.ry + offset.y;
      const pulse = staticFrame ? 0.3 : 0.5 + 0.5 * Math.sin(now * 0.002 + node.phase);
      const active = node.branch === activeBranch ? 1.4 : 1;
      const alpha = (0.16 + node.z * 0.24 + node.pulse * 0.45 + pulse * 0.1) * active * intensity;

      ctx.fillStyle = rgba(node.pulse > 0.2 ? GREEN : CYAN, alpha * 0.24);
      ctx.beginPath();
      ctx.arc(x, y, node.r * (3.6 + node.pulse * 2.4), 0, TAU);
      ctx.fill();

      ctx.fillStyle = rgba(node.pulse > 0.2 ? GREEN : '150, 235, 255', alpha);
      ctx.beginPath();
      ctx.arc(x, y, node.r * (1 + node.pulse * 0.45), 0, TAU);
      ctx.fill();

      if (node.level === 1) {
        ctx.strokeStyle = rgba(GREEN, alpha * 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, node.r * 3.2 + 3, 0, TAU);
        ctx.stroke();
      }
    });

    const core = topology.core;
    const cx = core.rx + edgeOffset.x;
    const cy = core.ry + edgeOffset.y;
    const pulse = staticFrame ? 0.45 : 0.5 + 0.5 * Math.sin(now * 0.0024);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(0, 0, topology.radius * 1.25, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = rgba(GREEN, 0.34 * intensity);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * TAU - Math.PI / 2;
      const px = Math.cos(a) * 18;
      const py = Math.sin(a) * 18;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    const spin = staticFrame ? 0 : now * 0.0007;
    ctx.strokeStyle = rgba(CYAN, 0.42 * intensity);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 27, spin, spin + 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 34, -spin * 0.7, -spin * 0.7 + 0.9);
    ctx.stroke();

    ctx.fillStyle = rgba(GREEN, 0.7 * intensity);
    ctx.beginPath();
    ctx.arc(0, 0, 4 + pulse * 3, 0, TAU);
    ctx.fill();

    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = rgba(GREEN, 0.3 * intensity);
    ctx.fillText('CORE//SEC', 42, -6);
    ctx.fillText('NODE_0x01', 42, 8);
    ctx.restore();
    ctx.restore();
  }

  function drawPackets(now, staticFrame) {
    ctx.save();
    topology.packets.forEach((packet) => {
      const edge = topology.edges[packet.edge];
      const aOffset = parallax(edge.a.z, staticFrame);
      const bOffset = parallax(edge.b.z, staticFrame);
      const ax = edge.a.rx + aOffset.x;
      const ay = edge.a.ry + aOffset.y;
      const bx = edge.b.rx + bOffset.x;
      const by = edge.b.ry + bOffset.y;
      const t = packet.t;
      const trailT = clamp(t - packet.dir * 0.075, 0, 1);
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      const tx = ax + (bx - ax) * trailT;
      const ty = ay + (by - ay) * trailT;

      ctx.strokeStyle = rgba(packet.color, 0.36 * intensity);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.fillStyle = rgba(packet.color, 0.78 * intensity);
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, TAU);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawFragments(staticFrame) {
    ctx.save();
    ctx.textBaseline = 'top';
    fragments.forEach((fragment) => {
      const offset = parallax(fragment.depth, staticFrame);
      const alpha = fragment.alpha * intensity;
      ctx.font = fragment.size.toFixed(0) + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = rgba(fragment.phase > 4.6 ? RED : CYAN, alpha);
      ctx.fillText(fragment.text, fragment.x + offset.x, fragment.y + offset.y);
    });
    ctx.restore();
  }

  function drawTelemetry(now, staticFrame) {
    ctx.save();
    const offset = parallax(0.25, staticFrame);

    const x = 34 + offset.x;
    const y = vh - 96 + offset.y;
    const width = compact ? 150 : 210;
    const height = 46;
    const points = 46;

    ctx.strokeStyle = rgba(GREEN, 0.14 * intensity);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();

    ctx.strokeStyle = rgba(CYAN, 0.2 * intensity);
    ctx.beginPath();
    for (let i = 0; i <= points; i += 1) {
      const px = x + (i / points) * width;
      const wave = Math.sin(i * 0.34 + (staticFrame ? 0 : now * 0.0022)) * height * 0.22;
      const wave2 = Math.sin(i * 0.11 + (staticFrame ? 0 : now * 0.0011)) * height * 0.12;
      const py = y + height * 0.5 + wave + wave2;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillStyle = rgba(GREEN, 0.2 * intensity);
    ctx.fillText('NET://TELEMETRY', x, y - 14);

    const barsX = vw - (compact ? 118 : 168) + offset.x;
    const barsY = 44 + offset.y;
    const barCount = compact ? 8 : 12;
    for (let i = 0; i < barCount; i += 1) {
      const level = 6 + Math.abs(Math.sin(i * 1.7 + (staticFrame ? 0 : now * 0.0018))) * 24;
      ctx.fillStyle = rgba(i === barCount - 3 ? RED : CYAN, 0.14 * intensity);
      ctx.fillRect(barsX + i * 9, barsY + 30 - level, 4, level);
    }
    ctx.fillStyle = rgba(CYAN, 0.18 * intensity);
    ctx.fillText('SYS/MON', barsX, barsY - 8);

    ctx.restore();
  }

  function drawScanBeams(now, staticFrame) {
    if (staticFrame) return;
    const hCycle = vh + 260;
    const vCycle = vw + 260;
    const hy = ((now * 0.028) % hCycle) - 130;
    const vx = ((now * 0.019) % vCycle) - 130;

    ctx.fillStyle = rgba(GREEN, 0.014 * intensity);
    ctx.fillRect(0, hy - 34, vw, 68);
    ctx.fillStyle = rgba(GREEN, 0.075 * intensity);
    ctx.fillRect(0, hy, vw, 1);

    ctx.fillStyle = rgba(CYAN, 0.01 * intensity);
    ctx.fillRect(vx - 24, 0, 48, vh);
    ctx.fillStyle = rgba(CYAN, 0.055 * intensity);
    ctx.fillRect(vx, 0, 1, vh);
  }

  function drawHud(staticFrame) {
    const offset = parallax(0.15, staticFrame);
    const pad = 20 + offset.x;
    const top = 20 + offset.y;
    const len = compact ? 18 : 28;
    const alpha = 0.13 * intensity;

    ctx.save();
    ctx.strokeStyle = rgba(GREEN, alpha);
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(pad, top + len); ctx.lineTo(pad, top); ctx.lineTo(pad + len, top);
    ctx.moveTo(vw - pad - len, top); ctx.lineTo(vw - pad, top); ctx.lineTo(vw - pad, top + len);
    ctx.moveTo(pad, vh - top - len); ctx.lineTo(pad, vh - top); ctx.lineTo(pad + len, vh - top);
    ctx.moveTo(vw - pad - len, vh - top); ctx.lineTo(vw - pad, vh - top); ctx.lineTo(vw - pad, vh - top - len);
    ctx.stroke();

    ctx.strokeStyle = rgba(CYAN, alpha * 0.6);
    for (let i = 0; i < 12; i += 1) {
      const y = top + 60 + i * 14;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(pad + (i % 3 === 0 ? 9 : 4), y);
      ctx.stroke();
    }

    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillStyle = rgba(GREEN, alpha);
    ctx.fillText('SECURE//ENV 0x7F', pad + 10, top + 16);
    ctx.fillText('RECON_ACTIVE', vw - pad - 104, vh - top - 12);
    ctx.restore();
  }

  function drawGlitch(now, staticFrame) {
    if (staticFrame || now > glitchUntil || !glitchBars.length) return;
    ctx.save();
    glitchBars.forEach((bar) => {
      ctx.fillStyle = bar.color;
      ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
    });

    const core = topology.core;
    ctx.strokeStyle = rgba(RED, 0.22);
    ctx.beginPath();
    ctx.arc(core.rx - 3, core.ry, 22, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(CYAN, 0.18);
    ctx.beginPath();
    ctx.arc(core.rx + 3, core.ry, 22, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawFinish() {
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, vw, vh);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, vw, vh);
  }

  function render(now, staticFrame) {
    if (!vw || !vh || !topology || !baseLight) return;
    ctx.clearRect(0, 0, vw, vh);
    drawLighting();
    drawGrid(now, Boolean(staticFrame));
    drawRain(now, Boolean(staticFrame));
    drawAmbientNetwork(now, Boolean(staticFrame));
    drawRadar(now, Boolean(staticFrame));
    drawTopology(now, Boolean(staticFrame));
    drawPackets(now, Boolean(staticFrame));
    drawFragments(Boolean(staticFrame));
    drawTelemetry(now, Boolean(staticFrame));
    drawScanBeams(now, Boolean(staticFrame));
    drawHud(Boolean(staticFrame));
    drawGlitch(now, Boolean(staticFrame));
    drawFinish();
  }

  function shouldAnimate() {
    return !motionQuery.matches && !document.hidden;
  }

  function loop(now) {
    if (!shouldAnimate()) {
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(loop);
    if (now - lastTime < FRAME_INTERVAL - 1) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    update(dt, now);
    render(now, false);
  }

  function start() {
    if (raf || !shouldAnimate()) return;
    lastTime = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function onMotionChange() {
    if (motionQuery.matches) {
      stop();
      render(performance.now(), true);
    } else {
      render(performance.now(), false);
      start();
    }
  }

  function onResize() {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      resize();
    });
  }

  window.addEventListener('resize', onResize, { passive: true });
  if (window.visualViewport && typeof window.visualViewport.addEventListener === 'function') {
    window.visualViewport.addEventListener('resize', onResize, { passive: true });
  }

  window.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || event.pointerType === 'touch' || !vw || !vh) return;
    pointer.tx = (event.clientX / vw - 0.5) * 2;
    pointer.ty = (event.clientY / vh - 0.5) * 2;
  }, { passive: true });

  window.addEventListener('pointerout', (event) => {
    if (!event.relatedTarget) {
      pointer.tx = 0;
      pointer.ty = 0;
    }
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else if (motionQuery.matches) {
      render(performance.now(), true);
    } else {
      start();
    }
  });

  if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', onMotionChange);
  } else if (typeof motionQuery.addListener === 'function') {
    motionQuery.addListener(onMotionChange);
  }

  resize();
  start();
})();
