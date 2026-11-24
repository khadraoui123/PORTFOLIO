document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('cyber-globe-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let t0 = performance.now();

    const resize = () => {
        const parent = canvas.parentElement;
        w = parent.clientWidth;
        h = parent.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    window.addEventListener('resize', resize);
    resize();

    const NODE_COUNT = 100;
    const nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
        const y = 1 - (i / (NODE_COUNT - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = Math.PI * (3 - Math.sqrt(5)) * i;
        nodes.push({
            x: Math.cos(theta) * radius,
            y: y,
            z: Math.sin(theta) * radius,
            alert: Math.random() < 0.15
        });
    }

    const draw = (now) => {
        const t = (now - t0) * 0.001;
        ctx.clearRect(0, 0, w, h);
        
        const cx = w * 0.5, cy = h * 0.5, r = Math.min(w, h) * 0.35;
        const rotY = t * 0.3, rotX = 0.4 + Math.sin(t * 0.1) * 0.1;

        const projected = nodes.map(n => {
            let x1 = n.x * Math.cos(rotY) + n.z * Math.sin(rotY);
            let z1 = -n.x * Math.sin(rotY) + n.z * Math.cos(rotY);
            let y2 = n.y * Math.cos(rotX) - z1 * Math.sin(rotX);
            let z2 = n.y * Math.sin(rotX) + z1 * Math.cos(rotX);
            const scale = 2.5 / (2.5 - z2);
            return { x: cx + x1 * r * scale, y: cy + y2 * r * scale, z: z2, alert: n.alert, scale };
        });

        // Radar Sweep
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.8);
        const grad = ctx.createConicGradient(0, 0, 0);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
        grad.addColorStop(0.1, 'rgba(0, 240, 255, 0)');
        grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Lines
        ctx.lineWidth = 0.8;
        for (let i = 0; i < projected.length; i++) {
            for (let j = i + 1; j < projected.length; j++) {
                const a = projected[i], b = projected[j];
                const dist = Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
                if (dist < 70) {
                    const alpha = (1 - dist / 70) * 0.4 * Math.max(0, (a.z + b.z) / 2);
                    ctx.strokeStyle = (a.alert && b.alert) ? `rgba(255, 42, 109, ${alpha})` : `rgba(0, 240, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        // Nodes
        projected.forEach(n => {
            const alpha = Math.max(0.1, (n.z + 1) / 2);
            ctx.fillStyle = n.alert ? `rgba(255, 42, 109, ${alpha})` : `rgba(0, 240, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(n.x, n.y, (n.alert ? 2 : 1.5) * n.scale, 0, Math.PI * 2);
            ctx.fill();
        });

        requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
});