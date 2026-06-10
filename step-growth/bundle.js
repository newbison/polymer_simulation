class Renderer {
  constructor(canvas, theme) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = theme;
    this.resize();
    this._resizeHandler = () => this.resize();
    window.addEventListener('resize', this._resizeHandler);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * devicePixelRatio;
    this.canvas.height = rect.height * devicePixelRatio;
    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    this.w = rect.width;
    this.h = rect.height;
  }

  draw(particles) {
    const ctx = this.ctx;
    const { colors, radii, glowColors, bgColor } = this.theme;
    ctx.clearRect(0, 0, this.w, this.h);

    // Background
    ctx.fillStyle = bgColor || colors.bg || '#0f0f23';
    ctx.fillRect(0, 0, this.w, this.h);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < this.w; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.h); ctx.stroke();
    }
    for (let y = 0; y < this.h; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.w, y); ctx.stroke();
    }

    // Draw bonds between chain segments
    for (const p of particles) {
      if ((p.type === 'chainRadical' || p.type === 'deadChain') && p.segments?.length > 1) {
        for (let i = 0; i < p.segments.length - 1; i++) {
          const a = p.segments[i];
          const b = p.segments[i + 1];
          const alpha = p.type === 'chainRadical' ? 0.4 : 0.2;
          const bondColor = colors.chainRadical || '#4ecdc4';
          const deadColor = colors.deadChain || '#555';
          ctx.strokeStyle = p.type === 'chainRadical'
            ? `rgba(${this._hexToRgb(bondColor)},${alpha})`
            : `rgba(${this._hexToRgb(deadColor)},${alpha})`;
          ctx.lineWidth = p.type === 'chainRadical' ? 2.5 : 1.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    for (const p of particles) {
      const pos = p.type === 'chainRadical' || p.type === 'deadChain'
        ? p.segments[p.segments.length - 1]
        : p;

      // Glow for radicals
      if (glowColors && (p.type === 'primaryRadical' || p.type === 'chainRadical')) {
        const glowColor = p.type === 'primaryRadical'
          ? (glowColors.primaryRadical || 'rgba(255,107,107,0.6)')
          : (glowColors.chainRadical || 'rgba(78,205,196,0.6)');
        const r = radii?.[p.type] ?? (p.type === 'primaryRadical' ? 4 : 6);
        const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r * 3);
        grad.addColorStop(0, glowColor);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Body
      const r = radii?.[p.type] ?? 5;
      const color = this._colorForParticle(p, colors);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Draw chain body segments
      if ((p.type === 'chainRadical' || p.type === 'deadChain') && p.segments?.length > 1) {
        for (let i = 0; i < p.segments.length - 1; i++) {
          const seg = p.segments[i];
          const segColor = this._segmentColor(p, seg, i, colors);
          ctx.fillStyle = segColor;
          ctx.beginPath();
          ctx.arc(seg.x, seg.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        // Head
        const head = p.segments[p.segments.length - 1];
        const headColor = this._segmentColor(p, head, p.segments.length - 1, colors);
        ctx.fillStyle = headColor;
        ctx.beginPath();
        ctx.arc(head.x, head.y, radii?.[p.type] ?? 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _colorForParticle(p, colors) {
    if ((p.type === 'chainRadical' || p.type === 'deadChain') && p.segments?.length) {
      const head = p.segments[p.segments.length - 1];
      if (this.theme.segmentColor && head.monomerType !== undefined) {
        return this.theme.segmentColor(head.monomerType, p.type);
      }
    }
    return colors[p.type] || '#fff';
  }

  _segmentColor(p, seg, idx, colors) {
    if (this.theme.segmentColor && seg.monomerType !== undefined) {
      return this.theme.segmentColor(seg.monomerType, p.type);
    }
    return colors[p.type] || '#fff';
  }

  _hexToRgb(hex) {
    if (hex.startsWith('#')) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r},${g},${b}`;
    }
    return '255,255,255';
  }

  drawCallout(title, drawFn) {
    const calloutEl = document.getElementById('callout');
    const titleEl = document.getElementById('callout-title');
    const calloutCanvas = document.getElementById('callout-canvas');
    const ctx = calloutCanvas.getContext('2d');

    if (!drawFn) {
      calloutEl.classList.add('hidden');
      return;
    }

    calloutEl.classList.remove('hidden');
    ctx.clearRect(0, 0, calloutCanvas.width, calloutCanvas.height);

    if (title) {
      titleEl.textContent = title;
    }

    drawFn(ctx, calloutCanvas.width, calloutCanvas.height);
  }

  _scheduleCalloutClear() {
    if (this._calloutTimer) clearTimeout(this._calloutTimer);
    this._calloutTimer = setTimeout(() => {
      document.getElementById('callout').classList.add('hidden');
    }, 2500);
  }

  dispose() {
    window.removeEventListener('resize', this._resizeHandler);
  }
}
class UIBase {
  constructor() {
    this._callbacks = {};
  }

  on(event, fn) {
    this._callbacks[event] = fn;
  }

  _cb(event, data) {
    if (this._callbacks[event]) this._callbacks[event](data);
  }

  // Bind a button element to a callback event
  bindButton(id, event) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => this._cb(event));
    }
  }

  // Bind a slider: sets up display value update and param-change callback
  // onChange receives the parsed slider value
  bindSlider(id, valueId, format, paramKey, onChange) {
    const slider = document.getElementById(id);
    const display = document.getElementById(valueId);
    if (!slider) return;

    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      if (display) {
        display.textContent = typeof format === 'function' ? format(val) : val + format;
      }
      if (onChange) {
        onChange(paramKey, val);
      }
      this._cb('paramChange', this._getParams());
    });
  }

  // Set initial display value for a slider
  setSliderValue(id, valueId, value, format) {
    const display = document.getElementById(valueId);
    if (display) {
      display.textContent = typeof format === 'function' ? format(value) : value + format;
    }
  }

  // Register a readout spec: { id, key, format }
  setReadoutSpec(specs) {
    this._readoutSpecs = specs;
  }

  updateReadouts(data) {
    if (!this._readoutSpecs) return;
    for (const spec of this._readoutSpecs) {
      const el = document.getElementById(spec.id);
      if (!el) continue;
      const val = data[spec.key];
      if (val === undefined || val === null) {
        el.textContent = '—';
      } else if (spec.format) {
        el.textContent = typeof spec.format === 'function' ? spec.format(val) : val;
      } else {
        el.textContent = String(val);
      }
    }
  }

  // Badge toggling
  setBadge(id, active) {
    const el = document.getElementById(id);
    if (!el) return;
    if (active) {
      el.classList.add('active');
      el.textContent = el.textContent.replace('○', '●');
    } else {
      el.classList.remove('active');
      el.textContent = el.textContent.replace('●', '○');
    }
  }

  // Override in subclass to collect all param values
  _getParams() {
    return {};
  }
}
class Simulation {
  constructor() {
    this.particles = [];
    this.time = 0;
    this.params = {
      monomerACount: 500,
      monomerBCount: 500,
      rateMultiplier: 5.0,
      speedMultiplier: 10.0,
    };
    this.stats = {
      conversion: 0,
      dp: 0,
      chains: 0,
      deadChains: 0,
      freeMonomerA: 0,
      freeMonomerB: 0,
      byproductCount: 0,
      maxDP: 0,
    };
    this._dpHistory = [];
    this._totalBonds = 0;
    this._initMonomerACount = 0;
    this._initMonomerBCount = 0;
    this._byproductParticles = [];
    this.calloutEvent = null;
    this._canvasW = 800;
    this._canvasH = 500;
    this._tickCounter = 0;
  }

  setCanvasSize(w, h) {
    this._canvasW = w;
    this._canvasH = h;
  }

  setParams(p) {
    Object.assign(this.params, p);
  }

  reset() {
    this.particles = [];
    this.time = 0;
    this._dpHistory = [];
    this._totalBonds = 0;
    this._byproductParticles = [];
    this._tickCounter = 0;
    this.calloutEvent = null;
    this._initParticles();
  }

  _initParticles() {
    const { monomerACount, monomerBCount } = this.params;
    this._initMonomerACount = monomerACount;
    this._initMonomerBCount = monomerBCount;
    this.particles = [];
    const minDist = 15;

    const tooClose = (x, y, existing) => {
      for (const p of existing) {
        const px = p.x;
        const py = p.y;
        if (Math.hypot(x - px, y - py) < minDist) return true;
      }
      return false;
    };

    for (let i = 0; i < monomerACount; i++) {
      let x, y, attempts = 0;
      do {
        x = Math.random() * this._canvasW;
        y = Math.random() * this._canvasH;
        attempts++;
      } while (tooClose(x, y, this.particles) && attempts < 100);

      this.particles.push({
        type: 'monomerA', x, y,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
        radius: 5,
        freeA: 2,
        freeB: 0,
        segments: [{ x, y, monomerType: 0 }],
      });
    }

    for (let i = 0; i < monomerBCount; i++) {
      let x, y, attempts = 0;
      do {
        x = Math.random() * this._canvasW;
        y = Math.random() * this._canvasH;
        attempts++;
      } while (tooClose(x, y, this.particles) && attempts < 100);

      this.particles.push({
        type: 'monomerB', x, y,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
        radius: 5,
        freeA: 0,
        freeB: 2,
        segments: [{ x, y, monomerType: 1 }],
      });
    }

    this._updateStats();
  }

  _chainMobility(chainLength) {
    return 1 / Math.sqrt(1 + (chainLength - 1) * 0.3);
  }

  _moveParticles(dt) {
    const w = this._canvasW;
    const h = this._canvasH;

    for (const p of this.particles) {
      if (p.type === 'byproduct') continue;

      const chainLength = p.segments ? p.segments.length : 1;
      const mobility = this._chainMobility(chainLength);

      p.vx += (Math.random() - 0.5) * 0.5 * Math.sqrt(mobility);
      p.vy += (Math.random() - 0.5) * 0.5 * Math.sqrt(mobility);

      p.vx *= 0.98;
      p.vy *= 0.98;

      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const maxSpeed = 3 * mobility;
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      if (p.segments && p.segments.length > 1) {
        const head = p.segments[p.segments.length - 1];
        head.x += p.vx * dt * 60;
        head.y += p.vy * dt * 60;

        if (head.x < 5) { head.x = 5; p.vx *= -0.5; }
        if (head.x > w - 5) { head.x = w - 5; p.vx *= -0.5; }
        if (head.y < 5) { head.y = 5; p.vy *= -0.5; }
        if (head.y > h - 5) { head.y = h - 5; p.vy *= -0.5; }

        for (let i = 0; i < p.segments.length - 1; i++) {
          const seg = p.segments[i];
          const leader = p.segments[i + 1];
          const dx = leader.x - seg.x;
          const dy = leader.y - seg.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const targetDist = 10;
          if (dist > targetDist) {
            const ratio = (dist - targetDist) / dist;
            seg.x += dx * ratio * 0.8;
            seg.y += dy * ratio * 0.8;
          }
        }
      } else {
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;

        if (p.x < p.radius) { p.x = p.radius; p.vx *= -0.5; }
        if (p.x > w - p.radius) { p.x = w - p.radius; p.vx *= -0.5; }
        if (p.y < p.radius) { p.y = p.radius; p.vy *= -0.5; }
        if (p.y > h - p.radius) { p.y = h - p.radius; p.vy *= -0.5; }
      }
    }
  }

  _processReactions(dt) {
    const rate = this.params.rateMultiplier;
    const k = 8.0 * rate;
    const reactDist = 18;

    const aCandidates = [];
    const bCandidates = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.type === 'byproduct') continue;
      if (p.type === 'oligomer' && p.freeA === 0 && p.freeB === 0) continue;
      if (p.freeA > 0) aCandidates.push(i);
      if (p.freeB > 0) bCandidates.push(i);
    }

    const reacted = new Set();

    for (const ai of aCandidates) {
      if (reacted.has(ai)) continue;
      const particleA = this.particles[ai];
      if (particleA.freeA < 1) continue;

      for (const bi of bCandidates) {
        if (reacted.has(bi)) continue;
        if (ai === bi) continue;
        const particleB = this.particles[bi];
        if (particleB.freeB < 1) continue;

        const posA = particleA.segments
          ? particleA.segments[particleA.segments.length - 1]
          : particleA;
        const posB = particleB.segments
          ? particleB.segments[particleB.segments.length - 1]
          : particleB;

        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < reactDist && Math.random() < k * dt) {
          const newSegments = [
            ...particleA.segments,
            ...particleB.segments,
          ];
          const newFreeA = particleA.freeA + particleB.freeA - 1;
          const newFreeB = particleA.freeB + particleB.freeB - 1;

          const midX = (posA.x + posB.x) / 2;
          const midY = (posA.y + posB.y) / 2;

          const chainLength = newSegments.length;
          const mob = this._chainMobility(chainLength);

          reacted.add(ai);
          reacted.add(bi);

          this.particles.push({
            type: 'oligomer',
            segments: newSegments,
            freeA: newFreeA,
            freeB: newFreeB,
            vx: (particleA.vx + particleB.vx) / 2 + (Math.random() - 0.5) * 0.5 * mob,
            vy: (particleA.vy + particleB.vy) / 2 + (Math.random() - 0.5) * 0.5 * mob,
            radius: 5,
          });

          this._emitByproduct(midX, midY);
          this._totalBonds++;

          this.calloutEvent = {
            title: `Step-growth: bond formed (n=${chainLength})`,
            drawFn: (ctx, cw, ch) => {
              const cx = cw / 2, cy = ch / 2;
              const colors = ['#d97742', '#4888dd'];
              const segCount = Math.min(newSegments.length, 6);
              for (let i = 0; i < segCount; i++) {
                const offsetX = -15 + i * 7;
                ctx.fillStyle = colors[newSegments[i].monomerType];
                ctx.beginPath();
                ctx.arc(cx + offsetX, cy, 5, 0, Math.PI * 2);
                ctx.fill();
              }
              if (newSegments.length > 6) {
                ctx.fillStyle = '#fff';
                ctx.font = '8px sans-serif';
                ctx.fillText('...', cx + 30, cy + 3);
              }
              ctx.fillStyle = '#6abf69';
              ctx.font = '9px sans-serif';
              ctx.fillText(`A:${newFreeA} B:${newFreeB}`, cx - 10, cy - 14);
            },
          };

          break;
        }
      }
    }

    const toRemove = [...reacted].sort((a, b) => b - a);
    for (const idx of toRemove) {
      this.particles.splice(idx, 1);
    }
  }

  _emitByproduct(x, y) {
    this._byproductParticles.push({
      type: 'byproduct',
      x, y,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.5 - Math.random() * 1.0,
      radius: 2,
      alpha: 0.3,
      age: 0,
    });

    if (this._byproductParticles.length > 200) {
      this._byproductParticles.shift();
    }
  }

  _updateByproducts(dt) {
    for (const bp of this._byproductParticles) {
      bp.age += dt;
      bp.alpha = Math.max(0, 0.3 - bp.age * 0.8);
      bp.x += bp.vx * dt * 60;
      bp.y += bp.vy * dt * 60;
      bp.vx += (Math.random() - 0.5) * 0.1;
    }
  }

  _cleanupByproducts() {
    this._byproductParticles = this._byproductParticles.filter(bp => bp.alpha > 0);
  }

  _sampleDPData() {
    const p = this.stats.conversion;
    const dpActual = this.stats.dp;
    const dpTheory = p < 1 ? 1 / (1 - p) : 0;

    this._dpHistory.push({ p, dpTheory, dpActual });

    if (this._dpHistory.length > 200) {
      this._dpHistory = this._dpHistory.filter((_, i) => i % 2 === 0);
    }
  }

  _updateStats() {
    const totalA = this._initMonomerACount;
    const totalB = this._initMonomerBCount;
    const totalGroups = totalA * 2 + totalB * 2;

    const freeA = this._countFree('monomerA') * 2 + this._countFreeGroups('oligomer', 'freeA');
    const freeB = this._countFree('monomerB') * 2 + this._countFreeGroups('oligomer', 'freeB');
    const consumedGroups = totalGroups - freeA - freeB;
    const p = totalGroups > 0 ? consumedGroups / totalGroups : 0;

    const chains = this.particles.filter(p => p.type === 'oligomer' && (p.freeA + p.freeB > 0)).length;
    const deadChains = this.particles.filter(p => p.type === 'oligomer' && p.freeA === 0 && p.freeB === 0).length;
    const totalChains = chains + deadChains;
    const totalSegments = this.particles
      .filter(p => p.type === 'oligomer')
      .reduce((sum, p) => sum + p.segments.length, 0);

    const freeMonomerA = this._countFree('monomerA');
    const freeMonomerB = this._countFree('monomerB');

    // Carothers max DP from stoichiometric imbalance
    const ratio = Math.min(totalA, totalB) / Math.max(totalA, totalB, 1);
    const maxDP = ratio > 0 && ratio < 1 ? Math.round((1 + ratio) / (1 - ratio)) : 0;

    this.stats = {
      conversion: p,
      dp: totalChains > 0 ? totalSegments / totalChains : 0,
      chains,
      deadChains,
      freeMonomerA,
      freeMonomerB,
      byproductCount: this._totalBonds,
      maxDP,
    };
  }

  _countFree(type) {
    return this.particles.filter(p => p.type === type).length;
  }

  _countFreeGroups(type, field) {
    return this.particles
      .filter(p => p.type === type)
      .reduce((sum, p) => sum + (p[field] || 0), 0);
  }

  tick(dt) {
    const speed = this.params.speedMultiplier;
    const scaledDt = dt * speed;
    this.time += scaledDt;

    this._moveParticles(scaledDt);
    this._processReactions(scaledDt);
    this._updateByproducts(dt);
    this._cleanupByproducts();
    this._updateStats();

    this._tickCounter++;
    if (this._tickCounter % 10 === 0) {
      this._sampleDPData();
    }
  }

  getState() {
    const allParticles = [...this.particles, ...this._byproductParticles];
    return { particles: allParticles, stats: this.stats, dpHistory: this._dpHistory };
  }

  getStats() {
    return this.stats;
  }
}
const THEME = {
  bgColor: '#0f0f23',
  colors: {
    monomerA: '#d97742',
    monomerB: '#4888dd',
    oligomer: '#6abf69',
    deadChain: '#444',
    byproduct: 'rgba(120, 200, 255, 0.3)',
    bg: '#0f0f23',
  },
  radii: {
    monomerA: 5,
    monomerB: 5,
    byproduct: 2,
  },
  glowColors: {},
  segmentColor: (monomerType, chainType) => {
    if (chainType === 'deadChain') {
      return monomerType === 0 ? '#8a5530' : '#2a5590';
    }
    return monomerType === 0 ? '#d97742' : '#4888dd';
  },
};

class UI extends UIBase {
  constructor() {
    super();

    this.btnPlay = document.getElementById('btn-play');
    this.btnPause = document.getElementById('btn-pause');
    this.btnReset = document.getElementById('btn-reset');
    this.sliderMonomerA = document.getElementById('slider-monomer-a');
    this.sliderMonomerB = document.getElementById('slider-monomer-b');
    this.sliderRate = document.getElementById('slider-rate');
    this.sliderSpeed = document.getElementById('slider-speed');
    this.presetSelect = document.getElementById('preset-select');
    this.badgeMonomers = document.getElementById('badge-monomers');
    this.badgeReacting = document.getElementById('badge-reacting');
    this.badgeChains = document.getElementById('badge-chains');
    this.badgeSaturated = document.getElementById('badge-saturated');

    this._bindEvents();

    this.setReadoutSpec([
      { id: 'ro-time',       key: 'time',          format: v => v.toFixed(1) + 's' },
      { id: 'ro-conversion', key: 'conversion',    format: v => (v * 100).toFixed(1) + '%' },
      { id: 'ro-dp',         key: 'dp',            format: v => v.toFixed(1) },
      { id: 'ro-chains',     key: 'chains',        format: v => String(v) },
      { id: 'ro-dead',       key: 'deadChains',    format: v => String(v) },
      { id: 'ro-free-a',     key: 'freeMonomerA',  format: v => String(v) },
      { id: 'ro-free-b',     key: 'freeMonomerB',  format: v => String(v) },
      { id: 'ro-byproduct',  key: 'byproductCount', format: v => String(v) },
      { id: 'ro-max-dp',     key: 'maxDP',         format: v => v || '∞' },
    ]);
  }

  _bindEvents() {
    this.bindButton('btn-play', 'play');
    this.bindButton('btn-pause', 'pause');
    this.bindButton('btn-reset', 'reset');

    this.bindSlider('slider-monomer-a', 'val-monomer-a', '', 'monomerACount');
    this.bindSlider('slider-monomer-b', 'val-monomer-b', '', 'monomerBCount');
    this.bindSlider('slider-rate', 'val-rate', '×', 'rateMultiplier',
      (key, val) => document.getElementById('val-rate').textContent = val.toFixed(1) + '×'
    );

    // Speed slider — fires speedChange
    const speedSlider = document.getElementById('slider-speed');
    const speedDisplay = document.getElementById('val-speed');
    if (speedSlider) {
      speedSlider.addEventListener('input', () => {
        const val = parseFloat(speedSlider.value);
        speedDisplay.textContent = val + '×';
        this._cb('speedChange', val);
      });
    }

    // Preset dropdown
    if (this.presetSelect) {
      this.presetSelect.addEventListener('change', () => {
        const preset = this.presetSelect.value;
        this._applyPreset(preset);
      });
    }
  }

  _applyPreset(name) {
    const presets = {
      'equal':    { monomerACount: 500, monomerBCount: 500 },
      'nylon66':  { monomerACount: 500, monomerBCount: 500 },
      'b-excess': { monomerACount: 400, monomerBCount: 600 },
      'a-excess': { monomerACount: 600, monomerBCount: 400 },
    };

    const p = presets[name];
    if (!p) return;

    const sliderA = document.getElementById('slider-monomer-a');
    const sliderB = document.getElementById('slider-monomer-b');
    sliderA.value = p.monomerACount;
    sliderB.value = p.monomerBCount;
    document.getElementById('val-monomer-a').textContent = p.monomerACount;
    document.getElementById('val-monomer-b').textContent = p.monomerBCount;

    this._cb('paramChange', this._getParams());
  }

  _getParams() {
    return {
      monomerACount: parseInt(this.sliderMonomerA.value),
      monomerBCount: parseInt(this.sliderMonomerB.value),
      rateMultiplier: parseFloat(this.sliderRate.value),
    };
  }

  updateStageBadges(stats) {
    const p = stats.conversion;
    const freeMonomers = stats.freeMonomerA + stats.freeMonomerB;
    const totalInit = this._initTotal || 1000;

    this.setBadge('badge-monomers', freeMonomers > totalInit * 0.5);
    this.setBadge('badge-reacting', p < 0.5 && p > 0.01);
    this.setBadge('badge-chains', p >= 0.5 && p < 0.9);
    this.setBadge('badge-saturated', p >= 0.9);
  }

  setInitTotal(total) {
    this._initTotal = total;
  }
}

const canvas = document.getElementById('sim-canvas');
const sim = new Simulation();
const renderer = new Renderer(canvas, THEME);
const ui = new UI();

function syncSize() {
  sim.setCanvasSize(renderer.w, renderer.h);
}

let running = false;
let lastTime = 0;
let animId = null;

function loop(timestamp) {
  if (!running) return;

  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.1) : 0.016;
  lastTime = timestamp;

  syncSize();
  sim.tick(dt);

  const { particles, stats, dpHistory } = sim.getState();
  stats.time = sim.time;

  // Draw Carothers chart as the persistent callout
  if (dpHistory && dpHistory.length > 1) {
    renderer.drawCallout('DP vs Conversion', (ctx, w, h) => {
      const pad = { top: 14, bottom: 16, left: 20, right: 8 };
      const plotW = w - pad.left - pad.right;
      const plotH = h - pad.top - pad.bottom;

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, w, h);

      // Find max DP for log scaling
      let maxDP = 2;
      for (const d of dpHistory) {
        if (d.dpTheory > maxDP) maxDP = d.dpTheory;
        if (d.dpActual > maxDP) maxDP = d.dpActual;
      }
      const logMax = Math.log10(maxDP);

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(pad.left, pad.top);
      ctx.lineTo(pad.left, h - pad.bottom);
      ctx.lineTo(w - pad.right, h - pad.bottom);
      ctx.stroke();

      // Grid lines
      for (let i = 0; i <= 4; i++) {
        const x = pad.left + (i / 4) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, h - pad.bottom);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.stroke();
      }

      // Theoretical curve (teal)
      ctx.strokeStyle = 'rgba(78,205,196,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let first = true;
      for (const d of dpHistory) {
        const x = pad.left + d.p * plotW;
        const yLog = d.dpTheory > 0 ? Math.log10(d.dpTheory) / logMax : 0;
        const y = h - pad.bottom - yLog * plotH;
        if (first) { ctx.moveTo(x, y); first = false; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Actual curve (copper)
      ctx.strokeStyle = 'rgba(217,119,66,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      first = true;
      for (const d of dpHistory) {
        const x = pad.left + d.p * plotW;
        const yLog = d.dpActual > 0 ? Math.log10(d.dpActual) / logMax : 0;
        const y = h - pad.bottom - yLog * plotH;
        if (first) { ctx.moveTo(x, y); first = false; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '6px sans-serif';
      ctx.fillText('p=0', pad.left, h - 2);
      ctx.fillText('p=1', w - pad.right - 8, h - 2);

      // Legend
      ctx.fillStyle = 'rgba(78,205,196,0.7)';
      ctx.fillRect(w - 48, 2, 6, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '5px sans-serif';
      ctx.fillText('theory', w - 40, 7);
      ctx.fillStyle = 'rgba(217,119,66,0.8)';
      ctx.fillRect(w - 48, 10, 6, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('actual', w - 40, 15);

      // Current values
      const latest = dpHistory[dpHistory.length - 1];
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '6px sans-serif';
      ctx.fillText(`p=${latest.p.toFixed(2)} DP=${latest.dpActual.toFixed(1)}`, pad.left, h - 5);
    });
  }

  // Bond callout event: temporarily override the title (chart stays)
  if (sim.calloutEvent) {
    document.getElementById('callout-title').textContent = sim.calloutEvent.title;
    renderer._scheduleCalloutClear();
    sim.calloutEvent = null;
  }

  renderer.draw(particles);
  ui.updateReadouts(stats);
  ui.updateStageBadges(stats);

  animId = requestAnimationFrame(loop);
}

function play() {
  if (running) return;
  running = true;
  lastTime = 0;
  animId = requestAnimationFrame(loop);
}

function pause() {
  running = false;
  if (animId) cancelAnimationFrame(animId);
}

ui.on('play', play);
ui.on('pause', pause);
ui.on('reset', () => {
  pause();
  sim.reset();
  const { particles, stats } = sim.getState();
  const initTotal = sim.params.monomerACount + sim.params.monomerBCount;
  ui.setInitTotal(initTotal);
  stats.time = sim.time;
  syncSize();
  renderer.draw(particles);
  ui.updateReadouts(stats);
  ui.updateStageBadges(stats);
  play();
});
ui.on('paramChange', (params) => {
  sim.setParams(params);
});
ui.on('speedChange', (speed) => {
  sim.setParams({ speedMultiplier: speed });
});

syncSize();
sim.reset();
const { particles, stats } = sim.getState();
const initTotal = sim.params.monomerACount + sim.params.monomerBCount;
ui.setInitTotal(initTotal);
stats.time = sim.time;
renderer.draw(particles);
ui.updateReadouts(stats);
