const COLORS = {
  initiator: '#ffd93d',
  primaryRadical: '#ff6b6b',
  monomer: '#777',
  chainRadical: '#4ecdc4',
  deadChain: '#555',
  bond: 'rgba(255,255,255,0.3)',
  bg: '#0f0f23',
};

const RADII = {
  initiator: 7,
  primaryRadical: 4,
  monomer: 5,
  chainRadical: 6,
  deadChain: 5,
};

const GLOW_COLORS = {
  primaryRadical: 'rgba(255,107,107,0.6)',
  chainRadical: 'rgba(78,205,196,0.6)',
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * devicePixelRatio;
    this.canvas.height = rect.height * devicePixelRatio;
    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    this.w = rect.width;
    this.h = rect.height;
  }

  draw(particles, stats) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, this.w, this.h);

    // Draw bonds between chain segments first (below particles)
    for (const p of particles) {
      if ((p.type === 'chainRadical' || p.type === 'deadChain') && p.segments.length > 1) {
        ctx.strokeStyle = COLORS.bond;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.segments[0].x, p.segments[0].y);
        for (let i = 1; i < p.segments.length; i++) {
          ctx.lineTo(p.segments[i].x, p.segments[i].y);
        }
        ctx.stroke();
      }
    }

    // Draw particles
    for (const p of particles) {
      const pos = p.type === 'chainRadical' || p.type === 'deadChain'
        ? p.segments[p.segments.length - 1]  // draw head
        : p;

      // Glow for radicals
      if (p.type === 'primaryRadical' || p.type === 'chainRadical') {
        const glowColor = p.type === 'primaryRadical'
          ? GLOW_COLORS.primaryRadical
          : GLOW_COLORS.chainRadical;
        const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, RADII[p.type] * 3);
        grad.addColorStop(0, glowColor);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, RADII[p.type] * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Body
      ctx.fillStyle = COLORS[p.type];
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, RADII[p.type], 0, Math.PI * 2);
      ctx.fill();

      // Chain body segments (smaller dots)
      if ((p.type === 'chainRadical' || p.type === 'deadChain') && p.segments.length > 1) {
        ctx.fillStyle = p.type === 'chainRadical' ? COLORS.chainRadical : COLORS.deadChain;
        for (let i = 0; i < p.segments.length - 1; i++) {
          const seg = p.segments[i];
          ctx.beginPath();
          ctx.arc(seg.x, seg.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        // Head dot
        const head = p.segments[p.segments.length - 1];
        ctx.fillStyle = p.type === 'chainRadical' ? COLORS.chainRadical : COLORS.deadChain;
        ctx.beginPath();
        ctx.arc(head.x, head.y, RADII[p.type], 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
