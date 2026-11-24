const initCyberAnims = () => {
  const containers = document.querySelectorAll('.cyber-anim-container[data-anim]');
  if (!containers.length) return;

  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);

  class CyberAnim {
    constructor(container) {
      this.container = container;
      this.type = (container.dataset.anim || 'globe').toLowerCase();
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.container.appendChild(this.canvas);
      this.w = 0; this.h = 0; this.dpr = DPR();
      this.raf = null; this.last = performance.now();
      this.running = false;
      this.resize = this.resize.bind(this);
      this.loop = this.loop.bind(this);
      this.onVisibility = this.onVisibility.bind(this);
      this.initByType();
      this.resize();
      window.addEventListener('resize', this.resize, { passive: true });
      document.addEventListener('visibilitychange', this.onVisibility);
      this.start();
    }

    initByType() {
      if (this.type === 'matrix') this.initMatrix();
      else if (this.type === 'network') this.initNetwork();
      else { this.type = 'globe'; this.initGlobe(); }
    }

    resize() {
      const r = this.container.getBoundingClientRect();
      this.dpr = DPR();
      this.w = Math.max(1, Math.floor(r.width));
      this.h = Math.max(1, Math.floor(r.height));
      this.canvas.width = Math.floor(this.w * this.dpr);
      this.canvas.height = Math.floor(this.h * this.dpr);
      this.canvas.style.width = this.w + 'px';
      this.canvas.style.height = this.h + 'px';
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      if (this.type === 'matrix') this.initMatrixColumns();
      if (this.type === 'network') this.initNetworkNodes();
    }

    start() { if (!this.running) { this.running = true; this.raf = requestAnimationFrame(this.loop); } }
    stop() { this.running = false; if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; } }
    onVisibility() { if (document.hidden) this.stop(); else this.start(); }

    loop(now) {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.draw(now * 0.001, dt);
      this.raf = requestAnimationFrame(this.loop);
    }

    draw(t, dt) {
      if (this.type === 'matrix') this.drawMatrix(t, dt);
      else if (this.type === 'network') this.drawNetwork(t, dt);
      else this.drawGlobe(t, dt);
    }

    /* ---------- GLOBE ---------- */
    initGlobe() {
      this.nodes = [];
      const N = 160;
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2;
        const rr = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = Math.PI * (3 - Math.sqrt(5)) * i;
        this.nodes.push({
          x: Math.cos(theta) * rr, y, z: Math.sin(theta) * rr,
          alert: Math.random() < 0.12, p: Math.random() * Math.PI * 2
        });
      }
    }
    drawGlobe(t) {
      const ctx = this.ctx, w = this.w, h = this.h;
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.56, cy = h * 0.52, R = Math.min(w, h) * 0.28;
      const rotY = t * 0.25, rotX = 0.45 + Math.sin(t * 0.15) * 0.08;
      const cosY=Math.cos(rotY), sinY=Math.sin(rotY), cosX=Math.cos(rotX), sinX=Math.sin(rotX);
      const P = this.nodes.map(n => {
        let x = n.x*cosY + n.z*sinY; let z = -n.x*sinY + n.z*cosY; let y = n.y;
        let y2 = y*cosX - z*sinX; let z2 = y*sinX + z*cosX;
        const s = 2.7/(2.7-z2);
        return { ...n, sx: cx + x*R*s, sy: cy + y2*R*s, z: z2, s };
      });

      ctx.save(); ctx.translate(cx,cy); ctx.rotate(t*0.6);
      const g = ctx.createConicGradient(0,0,0);
      g.addColorStop(0,'rgba(0,240,255,0.18)'); g.addColorStop(0.08,'rgba(0,240,255,0.04)'); g.addColorStop(0.18,'rgba(0,240,255,0)'); g.addColorStop(1,'rgba(0,240,255,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,R*1.2,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(0,240,255,0.3)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(R*1.2,0); ctx.stroke();
      ctx.restore();

      for (let i=0;i<P.length;i++){
        for (let j=i+1;j<P.length;j++){
          const a=P[i], b=P[j]; const dx=a.x-b.x, dy=a.y-b.y, dz=a.z-b.z;
          const d=Math.sqrt(dx*dx+dy*dy+dz*dz);
          if(d<0.45){ const depth=(a.z+b.z)*0.5; const alpha=(1-d/0.45)*(0.08+Math.max(0,depth)*0.22); if(alpha<0.006) continue;
            ctx.strokeStyle = (a.alert && b.alert)
              ? `rgba(255,42,109,${alpha})`
              : `rgba(0,240,255,${alpha})`;
            ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(a.sx,a.sy); ctx.lineTo(b.sx,b.sy); ctx.stroke(); }
        }
      }
      for(const n of P){ const da=0.25+Math.max(0,n.z)*0.75; const sz=(n.alert?2.0:1.4)*(0.7+n.s*0.45); const rgb=n.alert?'255,42,109':'0,240,255';
        ctx.fillStyle = `rgba(${rgb},${da * 0.16})`;
        ctx.beginPath(); ctx.arc(n.sx,n.sy,sz*3,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = `rgba(${rgb},${da})`;
        ctx.beginPath(); ctx.arc(n.sx,n.sy,sz,0,Math.PI*2); ctx.fill(); }
      ctx.strokeStyle='rgba(0,240,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke();
    }

    /* ---------- MATRIX ---------- */
    initMatrix() { this.fontSize = 14; this.columns = []; this.chars = '01{}[]<>/\\|=+*-_#$%&@ABCDEFGHIJKLMNOPQRSTUVWXYZ'; }
    initMatrixColumns() {
      const cols = Math.max(1, Math.floor(this.w / this.fontSize));
      this.columns = Array.from({length: cols}, () => Math.floor(Math.random() * (this.h / this.fontSize)));
    }
    drawMatrix() {
      const ctx=this.ctx,w=this.w,h=this.h;
      ctx.fillStyle='rgba(5,5,5,0.12)'; ctx.fillRect(0,0,w,h);
      ctx.font = `${this.fontSize}px "JetBrains Mono", monospace`;
      ctx.textBaseline = 'top';
      for(let i=0;i<this.columns.length;i++){
        const x=i*this.fontSize; const y=this.columns[i]*this.fontSize;
        const ch=this.chars[Math.floor(Math.random()*this.chars.length)];
        ctx.fillStyle='rgba(180,255,255,0.9)';
        ctx.fillText(ch,x,y);
        ctx.fillStyle='rgba(0,240,255,0.55)';
        const ch2=this.chars[Math.floor(Math.random()*this.chars.length)];
        ctx.fillText(ch2,x,y-this.fontSize);
        if (y > h && Math.random() > 0.975) this.columns[i]=0;
        this.columns[i]++;
      }
    }

    /* ---------- NETWORK ---------- */
    initNetwork() { this.netNodes=[]; }
    initNetworkNodes() {
      const count = Math.max(24, Math.floor((this.w*this.h)/22000));
      this.netNodes = Array.from({length: count}, () => ({
        x: Math.random()*this.w, y: Math.random()*this.h,
        vx:(Math.random()-0.5)*0.35, vy:(Math.random()-0.5)*0.35,
        r: 1.2 + Math.random()*1.8
      }));
    }
    drawNetwork() {
      const ctx=this.ctx,w=this.w,h=this.h; ctx.clearRect(0,0,w,h);
      const maxD = 120;
      for(const n of this.netNodes){
        n.x+=n.vx; n.y+=n.vy;
        if(n.x<0||n.x>w) n.vx*=-1; if(n.y<0||n.y>h) n.vy*=-1;
        n.x=Math.max(0,Math.min(w,n.x)); n.y=Math.max(0,Math.min(h,n.y));
      }
      for(let i=0;i<this.netNodes.length;i++){
        for(let j=i+1;j<this.netNodes.length;j++){
          const a=this.netNodes[i], b=this.netNodes[j];
          const dx=a.x-b.x, dy=a.y-b.y; const d=Math.sqrt(dx*dx+dy*dy);
          if(d<maxD){ const a1=(1-d/maxD)*0.28; ctx.strokeStyle = `rgba(0,240,255,${a1})`; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
        }
      }
      for(const n of this.netNodes){
        ctx.fillStyle='rgba(0,240,255,0.85)'; ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(0,240,255,0.10)'; ctx.beginPath(); ctx.arc(n.x,n.y,n.r*3.2,0,Math.PI*2); ctx.fill();
      }
    }
  }

  containers.forEach(c => new CyberAnim(c));
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCyberAnims);
} else {
  initCyberAnims();
}
