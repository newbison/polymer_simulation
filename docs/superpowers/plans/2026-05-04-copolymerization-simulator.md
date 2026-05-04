# Copolymerization Simulator + Shared-Lib Architecture

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the project into a multi-sim platform with shared `lib/` (renderer + UI base), move the existing free-radical sim into `free-radical/`, and build a new copolymerization simulator with Mayo-Lewis kinetics.

**Architecture:** Extract generic `Renderer` and `UIBase` classes into `lib/`, parameterized by theme/config objects. Each sim lives in its own directory with only its kinetics engine (`simulation.js`), thin wiring (`main.js`), and `index.html`. Root `index.html` becomes a landing page. Bundle via concatenation with `export`/`import` stripped — same pattern as current `js/bundle.js`.

**Tech Stack:** Zero dependencies, vanilla JS, Canvas 2D, ES modules in source, concatenated bundles for `file://` compatibility, CSS variables dark theme.

---

## Phase 1: Shared lib + free-radical restructure

### Task 1: Create directory structure

**Files:**
- Create: `lib/` (empty dir)
- Create: `free-radical/` (empty dir)
- Create: `copolymer/` (empty dir)

- [ ] **Step 1: Create directories**

```bash
mkdir -p lib free-radical copolymer
```

- [ ] **Step 2: Commit**

```bash
git add lib/ free-radical/ copolymer/
git commit -m "chore: create directories for multi-sim platform"
```

---

### Task 2: Extract lib/renderer.js

**Files:**
- Create: `lib/renderer.js`
- Modify: `js/renderer.js` (mark as deprecated — delete in Task 5)

- [ ] **Step 1: Write lib/renderer.js**

The generic renderer takes a `theme` object at construction instead of using module-level COLORS/RADII/GLOW_COLORS constants. The `drawCallout` method takes a title string and a draw callback instead of hardcoded event types.

```js
export class Renderer {
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
    // If there's a segmentColorFn, use it for chain radicals / dead chains (returns head color)
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/renderer.js
git commit -m "feat: extract generic Renderer to lib/renderer.js"
```

---

### Task 3: Extract lib/ui-base.js

**Files:**
- Create: `lib/ui-base.js`

- [ ] **Step 1: Write lib/ui-base.js**

Generic UI base class with callback system, slider/binding helpers, and readout rendering. Sim-specific UIs extend this.

```js
export class UIBase {
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/ui-base.js
git commit -m "feat: extract generic UIBase to lib/ui-base.js"
```

---

### Task 4: Create free-radical theme + main.js

**Files:**
- Create: `free-radical/theme.js`
- Create: `free-radical/main.js` (imports simulation, theme, renderer, UI; sets up RAF loop)

- [ ] **Step 1: Write free-radical/theme.js**

```js
export const THEME = {
  bgColor: '#0f0f23',
  colors: {
    initiator: '#ffd93d',
    primaryRadical: '#ff6b6b',
    monomer: '#777',
    chainRadical: '#4ecdc4',
    deadChain: '#555',
    bg: '#0f0f23',
  },
  radii: {
    initiator: 7,
    primaryRadical: 4,
    monomer: 5,
    chainRadical: 6,
    deadChain: 5,
  },
  glowColors: {
    primaryRadical: 'rgba(255,107,107,0.6)',
    chainRadical: 'rgba(78,205,196,0.6)',
  },
};
```

- [ ] **Step 2: Write free-radical/main.js**

```js
import { Simulation } from './simulation.js';
import { Renderer } from '../lib/renderer.js';
import { UI } from './ui.js';
import { THEME } from './theme.js';

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

  if (sim.calloutEvent) {
    renderer.drawCallout(sim.calloutEvent.title, sim.calloutEvent.drawFn);
    renderer._scheduleCalloutClear();
    sim.calloutEvent = null;
  }

  const { particles, stats } = sim.getState();
  stats.time = sim.time;
  renderer.draw(particles);
  ui.updateReadouts(stats);
  ui.updateStageBadges({ ...stats, totalMonomers: sim.params.monomerCount });

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
  stats.time = sim.time;
  syncSize();
  renderer.draw(particles);
  ui.updateReadouts(stats);
  ui.updateStageBadges({ ...stats, totalMonomers: sim.params.monomerCount });
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
stats.time = sim.time;
renderer.draw(particles);
ui.updateReadouts(stats);
```

Note: `sim.calloutEvent` now has `title` and `drawFn` instead of `type` and `data`. We'll update simulation.js in Task 5.

- [ ] **Step 3: Commit**

```bash
git add free-radical/theme.js free-radical/main.js
git commit -m "feat: add free-radical theme and main wiring"
```

---

### Task 5: Move and adapt free-radical simulation + UI

**Files:**
- Copy: `js/simulation.js` → `free-radical/simulation.js` (modify calloutEvent shape)
- Create: `free-radical/ui.js` (extend UIBase with free-radical-specific controls)
- Create: `free-radical/index.html` (copy of root index.html, update script path)
- Modify: `js/simulation.js` (add deprecation comment at top)

- [ ] **Step 1: Copy and adapt free-radical/simulation.js**

Copy `js/simulation.js` to `free-radical/simulation.js`, adding the `export` keyword back to `class Simulation` (it was stripped in bundle.js but exists in the source), then change the calloutEvent shape so each callout event provides `title` and `drawFn` instead of raw `type`/`data`:

In `_decomposeInitiator()`:
```js
this.calloutEvent = {
  title: 'Initiation: I₂ → 2 I•',
  drawFn: (ctx, w, h) => {
    const cx = w / 2, cy = h / 2;
    ctx.fillStyle = 'rgba(255,217,61,0.4)';
    ctx.beginPath(); ctx.arc(cx - 8, cy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 8, cy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath(); ctx.arc(cx - 22, cy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 22, cy, 5, 0, Math.PI * 2); ctx.fill();
    [cx - 22, cx + 22].forEach(rx => {
      const grad = ctx.createRadialGradient(rx, cy, 0, rx, cy, 10);
      grad.addColorStop(0, 'rgba(255,107,107,0.5)'); grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(rx, cy, 10, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText('→', cx - 4, cy + 20);
  },
};
```

In `_processRadicalCapture()`:
```js
this.calloutEvent = {
  title: 'Initiation: R• + M → RM•',
  drawFn: (ctx, w, h) => {
    const cx = w / 2, cy = h / 2;
    ctx.fillStyle = '#777';
    ctx.beginPath(); ctx.arc(cx + 25, cy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx + 25, cy, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath(); ctx.arc(cx - 15, cy, 7, 0, Math.PI * 2); ctx.fill();
    const grad = ctx.createRadialGradient(cx - 15, cy, 0, cx - 15, cy, 12);
    grad.addColorStop(0, 'rgba(78,205,196,0.5)'); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx - 15, cy, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('→', cx + 2, cy + 5);
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath(); ctx.arc(cx + 50, cy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4ecdc4'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx + 50, cy - 8); ctx.lineTo(cx + 50, cy + 8); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '9px sans-serif';
    ctx.fillText('n+1', cx + 42, cy - 12);
  },
};
```

In `_processPropagation()`:
```js
this.calloutEvent = {
  title: `Propagation: chain + M (n=${chain.segments.length})`,
  drawFn: (ctx, w, h) => {
    const cx = w / 2, cy = h / 2;
    ctx.fillStyle = '#777';
    ctx.beginPath(); ctx.arc(cx + 25, cy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx + 25, cy, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath(); ctx.arc(cx - 15, cy, 7, 0, Math.PI * 2); ctx.fill();
    const grad = ctx.createRadialGradient(cx - 15, cy, 0, cx - 15, cy, 12);
    grad.addColorStop(0, 'rgba(78,205,196,0.5)'); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx - 15, cy, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('→', cx + 2, cy + 5);
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath(); ctx.arc(cx + 50, cy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4ecdc4'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx + 50, cy - 8); ctx.lineTo(cx + 50, cy + 8); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '9px sans-serif';
    ctx.fillText('n+1', cx + 42, cy - 12);
  },
};
```

In `_processTermination()`:
```js
this.calloutEvent = {
  title: 'Termination',
  drawFn: (ctx, w, h) => {
    const cx = w / 2, cy = h / 2;
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath(); ctx.arc(cx - 20, cy - 5, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 20, cy + 5, 7, 0, Math.PI * 2); ctx.fill();
    [cx - 20, cx + 20].forEach((rx, i) => {
      const grad = ctx.createRadialGradient(rx, cy - 5 + i * 10, 0, rx, cy - 5 + i * 10, 10);
      grad.addColorStop(0, 'rgba(78,205,196,0.5)'); grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(rx, cy - 5 + i * 10, 10, 0, Math.PI * 2); ctx.fill();
    });
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + 5, cy - 15); ctx.lineTo(cx + 15, cy - 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 15, cy - 15); ctx.lineTo(cx + 5, cy - 5); ctx.stroke();
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(cx + 45, cy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '9px sans-serif';
    ctx.fillText('dead', cx + 35, cy - 14);
  },
};
```

The rest of `free-radical/simulation.js` is identical to the current `js/simulation.js` (unchanged constructor, tick, _moveParticles, _chainMobility, _updateStats, getState, getStats, reset, etc.).

> **Note for implementer:** The fastest approach is to read `js/simulation.js`, copy the whole file, then replace only the four `calloutEvent` assignments (lines ~125, ~165, ~205, ~276) with the versions above. Everything else stays the same.

- [ ] **Step 2: Write free-radical/ui.js**

Extends UIBase with free-radical-specific controls:

```js
import { UIBase } from '../lib/ui-base.js';

export class UI extends UIBase {
  constructor() {
    super();

    this.btnPlay = document.getElementById('btn-play');
    this.btnPause = document.getElementById('btn-pause');
    this.btnReset = document.getElementById('btn-reset');
    this.sliderInitiator = document.getElementById('slider-initiator');
    this.sliderMonomer = document.getElementById('slider-monomer');
    this.sliderRate = document.getElementById('slider-rate');
    this.sliderSpeed = document.getElementById('slider-speed');
    this.badgeInit = document.getElementById('badge-initiation');
    this.badgeProp = document.getElementById('badge-propagation');
    this.badgeTerm = document.getElementById('badge-termination');

    this._bindEvents();

    this.setReadoutSpec([
      { id: 'ro-time',       key: 'time',         format: v => v.toFixed(1) + 's' },
      { id: 'ro-conversion', key: 'conversion',   format: v => v + '%' },
      { id: 'ro-mn',         key: 'mn',           format: v => v || '—' },
      { id: 'ro-chains',     key: 'activeChains', format: v => String(v) },
      { id: 'ro-dead',       key: 'deadChains',   format: v => String(v) },
      { id: 'ro-monomers',   key: 'freeMonomers',  format: v => String(v) },
    ]);
  }

  _bindEvents() {
    this.bindButton('btn-play', 'play');
    this.bindButton('btn-pause', 'pause');
    this.bindButton('btn-reset', 'reset');

    this.bindSlider('slider-initiator', 'val-initiator', '', 'initiatorCount',
      () => {}  // paramChange handled by _getParams
    );
    this.bindSlider('slider-monomer', 'val-monomer', '', 'monomerCount',
      () => {}
    );
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
  }

  _getParams() {
    return {
      initiatorCount: parseInt(this.sliderInitiator.value),
      monomerCount: parseInt(this.sliderMonomer.value),
      rateMultiplier: parseFloat(this.sliderRate.value),
    };
  }

  updateStageBadges(stats) {
    const hasActiveChains = stats.activeChains > 0;
    const hasDeadChains = stats.deadChains > 0;

    this.setBadge('badge-initiation', !hasActiveChains && !hasDeadChains);
    this.setBadge('badge-propagation', hasActiveChains && stats.conversion < 80);
    this.setBadge('badge-termination', hasDeadChains > 0 || stats.conversion >= 80);
  }
}
```

- [ ] **Step 3: Write free-radical/index.html**

Copy the existing `index.html` into `free-radical/`, update the title, and change the script src:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free-Radical Polymerization Simulator</title>
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <div id="app">
    <header id="header">
      <h1>Free-Radical Polymerization Simulator</h1>
      <a href="../index.html" style="color:var(--text-secondary);text-decoration:none;font-size:0.8rem;">← All Simulations</a>
      <div id="stage-badges">
        <span id="badge-initiation" class="badge active">● Initiation</span>
        <span id="badge-propagation" class="badge">○ Propagation</span>
        <span id="badge-termination" class="badge">○ Termination</span>
      </div>
    </header>
    <main id="main">
      <div id="canvas-container">
        <canvas id="sim-canvas"></canvas>
        <div id="callout" class="hidden">
          <div id="callout-title"></div>
          <canvas id="callout-canvas" width="140" height="100"></canvas>
        </div>
      </div>
      <aside id="panel">
        <section class="panel-section">
          <h2>Parameters</h2>
          <div class="param">
            <label>Initiator count <span id="val-initiator">10</span></label>
            <input type="range" id="slider-initiator" min="1" max="20" value="10" step="1">
          </div>
          <div class="param">
            <label>Monomer count <span id="val-monomer">1000</span></label>
            <input type="range" id="slider-monomer" min="20" max="1000" value="1000" step="10">
          </div>
          <div class="param">
            <label>Reaction rate <span id="val-rate">5.0×</span></label>
            <input type="range" id="slider-rate" min="0.1" max="10.0" value="5.0" step="0.1">
          </div>
        </section>
        <section class="panel-section">
          <h2>Time Controls</h2>
          <div class="btn-row">
            <button id="btn-play">▶ Play</button>
            <button id="btn-pause">⏸ Pause</button>
            <button id="btn-reset">↺ Reset</button>
          </div>
          <div class="param">
            <label>Speed <span id="val-speed">5×</span></label>
            <input type="range" id="slider-speed" min="0.25" max="10" value="5" step="0.25">
          </div>
        </section>
        <section class="panel-section">
          <h2>Readouts</h2>
          <dl id="readouts">
            <dt>Time</dt><dd id="ro-time">0.0s</dd>
            <dt>Conversion</dt><dd id="ro-conversion">0%</dd>
            <dt>M<sub>n</sub></dt><dd id="ro-mn">—</dd>
            <dt>Active chains</dt><dd id="ro-chains">0</dd>
            <dt>Dead chains</dt><dd id="ro-dead">0</dd>
            <dt>Free monomers</dt><dd id="ro-monomers">0</dd>
          </dl>
        </section>
      </aside>
    </main>
  </div>
  <script src="bundle.js"></script>
</body>
</html>
```

Key differences from root `index.html`:
- `<title>` stays "Free-Radical Polymerization Simulator"
- Added `← All Simulations` link back to `../index.html`
- CSS path is `../css/style.css`
- Script path is `bundle.js` (local to free-radical/)

- [ ] **Step 4: Mark old files as deprecated**

Add a comment at the top of `js/simulation.js`:
```js
// DEPRECATED: use free-radical/simulation.js instead. This file kept for backward compat with js/bundle.js.
```

Add a comment at the top of `js/renderer.js`:
```js
// DEPRECATED: use lib/renderer.js instead. This file kept for backward compat with js/bundle.js.
```

Add a comment at the top of `js/ui.js`:
```js
// DEPRECATED: use free-radical/ui.js instead. This file kept for backward compat with js/bundle.js.
```

- [ ] **Step 5: Commit**

```bash
git add free-radical/simulation.js free-radical/ui.js free-radical/index.html
git add js/simulation.js js/renderer.js js/ui.js
git commit -m "feat: move free-radical sim to free-radical/ with adapted UI"
```

---

### Task 6: Generate free-radical/bundle.js

**Files:**
- Create: `free-radical/bundle.js`

- [ ] **Step 1: Build the bundle by concatenation**

The bundle order must respect dependency order: lib files first, then simulation, then UI (which extends UIBase), then main (which imports everything).

```bash
cd free-radical
echo "// ============================================================" > bundle.js
echo "// lib/renderer.js" >> bundle.js
echo "// ============================================================" >> bundle.js
cat ../lib/renderer.js | sed 's/^export class /class /' | sed 's/^export const /const /' | sed 's/^export function /function /' >> bundle.js

echo "" >> bundle.js
echo "// ============================================================" >> bundle.js
echo "// lib/ui-base.js" >> bundle.js
echo "// ============================================================" >> bundle.js
cat ../lib/ui-base.js | sed 's/^export class /class /' >> bundle.js

echo "" >> bundle.js
echo "// ============================================================" >> bundle.js
echo "// simulation.js" >> bundle.js
echo "// ============================================================" >> bundle.js
cat simulation.js | sed 's/^export class /class /' >> bundle.js

echo "" >> bundle.js
echo "// ============================================================" >> bundle.js
echo "// theme.js" >> bundle.js
echo "// ============================================================" >> bundle.js
cat theme.js | sed 's/^export const /const /' >> bundle.js

echo "" >> bundle.js
echo "// ============================================================" >> bundle.js
echo "// ui.js" >> bundle.js
echo "// ============================================================" >> bundle.js
cat ui.js | sed 's/^import .* from .*;//' | sed 's/^export class /class /' >> bundle.js

echo "" >> bundle.js
echo "// ============================================================" >> bundle.js
echo "// main.js" >> bundle.js
echo "// ============================================================" >> bundle.js
cat main.js | sed 's/^import .* from .*;//' >> bundle.js
```

- [ ] **Step 2: Verify the bundle is syntactically valid**

```bash
node --check free-radical/bundle.js
```

Expected: no output (no syntax errors).

- [ ] **Step 3: Test in browser**

Open `free-radical/index.html` via a static server:
```bash
npx --yes serve -p 3456 -s .
```
Navigate to `http://localhost:3456/free-radical/` and verify the sim loads, animates, and all controls work.

- [ ] **Step 4: Commit**

```bash
git add free-radical/bundle.js
git commit -m "feat: add free-radical bundle.js"
```

---

### Task 7: Create landing page

**Files:**
- Modify: `index.html` (root — replace with landing page)
- Modify: `css/style.css` (add card styles)

- [ ] **Step 1: Rewrite root index.html as landing page**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Polymer Simulation Lab</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="app">
    <header id="header">
      <h1>Polymer Simulation Lab</h1>
    </header>
    <main id="landing">
      <div class="sim-cards">
        <a href="free-radical/index.html" class="sim-card">
          <div class="sim-card-icon">🧪</div>
          <h2>Free-Radical Polymerization</h2>
          <p>Chain-growth polymerization: initiation, propagation, and termination. Watch initiators decompose, chains grow, and polymers terminate via combination or disproportionation.</p>
        </a>
        <a href="copolymer/index.html" class="sim-card">
          <div class="sim-card-icon">🧬</div>
          <h2>Copolymerization</h2>
          <p>Mayo-Lewis kinetics with two monomer types. Explore reactivity ratios, composition drift, and how feed ratio affects copolymer microstructure.</p>
        </a>
      </div>
    </main>
  </div>
</body>
</html>
```

- [ ] **Step 2: Add landing page styles to css/style.css**

Add these styles at the end of `css/style.css`:

```css
#landing {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  min-height: 0;
  overflow-y: auto;
}

.sim-cards {
  display: flex;
  gap: 24px;
  max-width: 700px;
  width: 100%;
  flex-wrap: wrap;
  justify-content: center;
}

.sim-card {
  display: block;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px 24px;
  width: 300px;
  text-decoration: none;
  color: var(--text);
  transition: border-color 0.2s, transform 0.15s;
}

.sim-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.sim-card-icon {
  font-size: 2rem;
  margin-bottom: 12px;
}

.sim-card h2 {
  font-size: 1rem;
  color: var(--accent);
  margin-bottom: 8px;
}

.sim-card p {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
}
```

- [ ] **Step 3: Verify landing page loads**

Open `index.html` directly or via server. Should show two cards side by side, each linking to its sim.

- [ ] **Step 4: Commit**

```bash
git add index.html css/style.css
git commit -m "feat: add landing page with sim cards"
```

---

### Task 8: Update root js/bundle.js for backward compat

**Files:**
- Modify: `js/bundle.js` (keep as backward-compat copy pointing to free-radical)

- [ ] **Step 1: Regenerate root js/bundle.js**

Same content as `free-radical/bundle.js` but with paths adjusted:

```bash
cd js
echo "// Backward-compat bundle for file:// mode. Use free-radical/bundle.js for the canonical version." > bundle.js
echo "// ============================================================" >> bundle.js
echo "// lib/renderer.js" >> bundle.js
echo "// ============================================================" >> bundle.js
cat ../lib/renderer.js | sed 's/^export class /class /' | sed 's/^export const /const /' | sed 's/^export function /function /' >> bundle.js

echo "" >> bundle.js
echo "// ============================================================" >> bundle.js
echo "// lib/ui-base.js" >> bundle.js
echo "// ============================================================" >> bundle.js
cat ../lib/ui-base.js | sed 's/^export class /class /' >> bundle.js

echo "" >> bundle.js
echo "// ============================================================" >> bundle.js
echo "// simulation.js (deprecated wrapper)" >> bundle.js
echo "// ============================================================" >> bundle.js
cat ../free-radical/simulation.js | sed 's/^export class /class /' >> bundle.js

echo "" >> bundle.js
echo "// ============================================================" >> bundle.js
echo "// theme.js" >> bundle.js
echo "// ============================================================" >> bundle.js
cat ../free-radical/theme.js | sed 's/^export const /const /' >> bundle.js

echo "" >> bundle.js
echo "// main.js (deprecated wrapper)" >> bundle.js
echo "// ============================================================" >> bundle.js
cat ../free-radical/main.js | sed 's/import { Renderer } from '..\/lib\/renderer.js';//' | sed 's/import { UI } from '.\/ui.js';/import { UI } from '..\/free-radical\/ui.js';/' | sed 's/import { UIBase } from '..\/lib\/ui-base.js';//'
```

Wait — this is getting complicated with path mangling. Simpler approach: just copy `free-radical/bundle.js` to `js/bundle.js`.

```bash
cp free-radical/bundle.js js/bundle.js
```

- [ ] **Step 2: Commit**

```bash
git add js/bundle.js
git commit -m "chore: update root bundle.js to use new lib/"
```

---

## Phase 2: Copolymerization simulator

### Task 9: Write copolymer simulation.js (Mayo-Lewis kinetics)

**Files:**
- Create: `copolymer/simulation.js`

- [ ] **Step 1: Write copolymer/simulation.js**

The copolymer simulation is structurally similar to free-radical but with two monomer types, Mayo-Lewis propagation probabilities, and composition tracking.

```js
export class Simulation {
  constructor() {
    this.particles = [];
    this.time = 0;
    this.params = {
      initiatorCount: 10,
      monomerACount: 500,    // M₁ (e.g. 2EHA)
      monomerBCount: 500,    // M₂ (e.g. Acrylic Acid)
      r1: 1.5,               // reactivity ratio for M₁
      r2: 0.3,               // reactivity ratio for M₂
      rateMultiplier: 5.0,
      speedMultiplier: 5.0,
    };
    this.stats = {
      conversion: 0,
      mn: 0,
      activeChains: 0,
      deadChains: 0,
      freeMonomerA: 0,
      freeMonomerB: 0,
      cumulativeF1: 0,      // cumulative M₁ fraction in copolymer
      instantaneousF1: 0,   // instantaneous M₁ fraction being incorporated
    };
    this._monomerAAdded = 0;
    this._monomerBAdded = 0;
    this._recentAAdded = 0;  // for instantaneous F1 tracking
    this._recentBAdded = 0;
    this.calloutEvent = null;
    this._canvasW = 800;
    this._canvasH = 500;
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
    this.calloutEvent = null;
    this._monomerAAdded = 0;
    this._monomerBAdded = 0;
    this._recentAAdded = 0;
    this._recentBAdded = 0;
    this._initParticles();
  }

  _initParticles() {
    const { initiatorCount, monomerACount, monomerBCount } = this.params;
    this.particles = [];
    const minDist = 15;

    const tooClose = (x, y, existing) => {
      for (const p of existing) {
        const px = p.type === 'chainRadical' || p.type === 'deadChain'
          ? p.segments[p.segments.length - 1].x : p.x;
        const py = p.type === 'chainRadical' || p.type === 'deadChain'
          ? p.segments[p.segments.length - 1].y : p.y;
        if (Math.hypot(x - px, y - py) < minDist) return true;
      }
      return false;
    };

    for (let i = 0; i < initiatorCount; i++) {
      let x, y, attempts = 0;
      do {
        x = 20 + Math.random() * (this._canvasW - 40);
        y = 20 + Math.random() * (this._canvasH - 40);
        attempts++;
      } while (tooClose(x, y, this.particles) && attempts < 50);

      this.particles.push({
        type: 'initiator', x, y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: 7,
      });
    }

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
        consumed: false,
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
        consumed: false,
      });
    }

    this._updateStats();
  }

  _processInitiation(dt) {
    const rate = this.params.rateMultiplier;
    const kd = 25.0 * rate;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.type !== 'initiator') continue;

      if (Math.random() < kd * dt) {
        this._decomposeInitiator(i);
      }
    }
  }

  _decomposeInitiator(idx) {
    const initiator = this.particles[idx];
    const x = initiator.x;
    const y = initiator.y;

    this.particles.splice(idx, 1);

    for (let i = 0; i < 2; i++) {
      this.particles.push({
        type: 'primaryRadical',
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 4,
      });
    }

    this.calloutEvent = {
      title: 'Initiation: I₂ → 2 I•',
      drawFn: (ctx, w, h) => {
        const cx = w / 2, cy = h / 2;
        ctx.fillStyle = 'rgba(255,217,61,0.4)';
        ctx.beginPath(); ctx.arc(cx - 8, cy, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 8, cy, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath(); ctx.arc(cx - 22, cy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 22, cy, 5, 0, Math.PI * 2); ctx.fill();
        [cx - 22, cx + 22].forEach(rx => {
          const grad = ctx.createRadialGradient(rx, cy, 0, rx, cy, 10);
          grad.addColorStop(0, 'rgba(255,107,107,0.5)'); grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(rx, cy, 10, 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText('→', cx - 4, cy + 20);
      },
    };
  }

  _processRadicalCapture(dt) {
    const rate = this.params.rateMultiplier;
    const captureDist = 20;
    const kCapture = 12.5 * rate;

    const primaryRadicals = [];
    const monomersA = [];
    const monomersB = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.type === 'primaryRadical') primaryRadicals.push(i);
      else if (p.type === 'monomerA' && !p.consumed) monomersA.push(i);
      else if (p.type === 'monomerB' && !p.consumed) monomersB.push(i);
    }

    for (const ri of primaryRadicals) {
      const radical = this.particles[ri];

      // Find closest monomer (A or B)
      let closestIdx = -1;
      let closestDist = captureDist;
      let closestType = null;

      for (const mi of monomersA) {
        const monomer = this.particles[mi];
        if (monomer.consumed) continue;
        const dx = radical.x - monomer.x;
        const dy = radical.y - monomer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = mi;
          closestType = 0;
        }
      }

      for (const mi of monomersB) {
        const monomer = this.particles[mi];
        if (monomer.consumed) continue;
        const dx = radical.x - monomer.x;
        const dy = radical.y - monomer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = mi;
          closestType = 1;
        }
      }

      if (closestIdx >= 0 && Math.random() < kCapture * dt) {
        const monomer = this.particles[closestIdx];
        monomer.consumed = true;

        this._monomerAAdded += (closestType === 0) ? 1 : 0;
        this._monomerBAdded += (closestType === 1) ? 1 : 0;
        this._recentAAdded += (closestType === 0) ? 1 : 0;
        this._recentBAdded += (closestType === 1) ? 1 : 0;

        const label = closestType === 0 ? 'M₁ (2EHA)' : 'M₂ (AA)';
        this.particles[ri] = {
          type: 'chainRadical',
          segments: [
            { x: monomer.x, y: monomer.y, monomerType: closestType },
            { x: radical.x, y: radical.y, monomerType: closestType },
          ],
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          radius: 6,
        };
        this.calloutEvent = {
          title: `Initiation: R• + ${label} → R${closestType === 0 ? 'M₁' : 'M₂'}•`,
          drawFn: (ctx, w, h) => {
            const cx = w / 2, cy = h / 2;
            ctx.fillStyle = closestType === 0 ? '#4da6ff' : '#ff9f43';
            ctx.beginPath(); ctx.arc(cx + 25, cy, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath(); ctx.arc(cx - 15, cy, 5, 0, Math.PI * 2); ctx.fill();
            const grad = ctx.createRadialGradient(cx - 15, cy, 0, cx - 15, cy, 10);
            grad.addColorStop(0, 'rgba(255,107,107,0.5)'); grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(cx - 15, cy, 10, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '14px sans-serif';
            ctx.fillText('→', cx + 4, cy + 5);
          },
        };
      }
    }
  }

  _processPropagation(dt) {
    const rate = this.params.rateMultiplier;
    const kpBase = 12.5 * rate;
    const r1 = this.params.r1;
    const r2 = this.params.r2;
    const reactDist = 18;

    const chainRadicals = [];
    const monomersA = [];
    const monomersB = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.type === 'chainRadical') chainRadicals.push(i);
      else if (p.type === 'monomerA' && !p.consumed) monomersA.push(i);
      else if (p.type === 'monomerB' && !p.consumed) monomersB.push(i);
    }

    const freeA = monomersA.length;
    const freeB = monomersB.length;

    for (const ci of chainRadicals) {
      const chain = this.particles[ci];
      const head = chain.segments[chain.segments.length - 1];
      const headType = head.monomerType;  // 0 = M₁, 1 = M₂

      // Mayo-Lewis: probability of adding M₁ vs M₂ based on head type and [M₁]/[M₂] ratio
      let probAddA;
      if (freeA + freeB === 0) continue;

      if (headType === 0) {
        // Head is M₁: P(add M₁) = r₁[M₁] / (r₁[M₁] + [M₂])
        const num = r1 * freeA;
        const den = num + freeB;
        probAddA = den > 0 ? num / den : 0;
      } else {
        // Head is M₂: P(add M₁) = [M₁] / ([M₁] + r₂[M₂])
        const num = freeA;
        const den = num + r2 * freeB;
        probAddA = den > 0 ? num / den : 0;
      }

      // Pick target monomer type based on Mayo-Lewis probability
      const targetType = Math.random() < probAddA ? 'monomerA' : 'monomerB';
      const targetMonomers = targetType === 'monomerA' ? monomersA : monomersB;

      // Find closest monomer of target type
      let closestIdx = -1;
      let closestDist = reactDist;

      for (const mi of targetMonomers) {
        const monomer = this.particles[mi];
        if (monomer.consumed) continue;
        const dx = head.x - monomer.x;
        const dy = head.y - monomer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = mi;
        }
      }

      if (closestIdx >= 0) {
        // Accept based on kp probability
        const effectiveKp = kpBase * Math.sqrt(freeA + freeB); // scale with local monomer density
        if (Math.random() < effectiveKp * dt) {
          const monomer = this.particles[closestIdx];
          monomer.consumed = true;

          const mType = targetType === 'monomerA' ? 0 : 1;
          chain.segments.push({ x: monomer.x, y: monomer.y, monomerType: mType });

          this._monomerAAdded += (mType === 0) ? 1 : 0;
          this._monomerBAdded += (mType === 1) ? 1 : 0;
          this._recentAAdded += (mType === 0) ? 1 : 0;
          this._recentBAdded += (mType === 1) ? 1 : 0;

          const mob = this._chainMobility(chain.segments.length);
          chain.vx += (Math.random() - 0.5) * 0.5 * mob;
          chain.vy += (Math.random() - 0.5) * 0.5 * mob;

          const label = mType === 0 ? 'M₁ (2EHA)' : 'M₂ (AA)';
          this.calloutEvent = {
            title: `Propagation: +${label} (n=${chain.segments.length})`,
            drawFn: (ctx, w, h) => {
              const cx = w / 2, cy = h / 2;
              ctx.fillStyle = mType === 0 ? '#4da6ff' : '#ff9f43';
              ctx.beginPath(); ctx.arc(cx + 25, cy, 8, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#4ecdc4';
              ctx.beginPath(); ctx.arc(cx - 15, cy, 7, 0, Math.PI * 2); ctx.fill();
              const grad = ctx.createRadialGradient(cx - 15, cy, 0, cx - 15, cy, 12);
              grad.addColorStop(0, 'rgba(78,205,196,0.5)'); grad.addColorStop(1, 'transparent');
              ctx.fillStyle = grad;
              ctx.beginPath(); ctx.arc(cx - 15, cy, 12, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#fff';
              ctx.font = '14px sans-serif';
              ctx.fillText('→', cx + 4, cy + 5);
            },
          };
        }
      }
    }
  }

  _processTermination(dt) {
    const rate = this.params.rateMultiplier;
    const kt = 3.75 * rate;
    const termDist = 16;

    const chainRadicals = [];
    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].type === 'chainRadical') chainRadicals.push(i);
    }

    const terminated = new Set();

    for (let i = 0; i < chainRadicals.length; i++) {
      const ai = chainRadicals[i];
      if (terminated.has(ai)) continue;
      const chainA = this.particles[ai];

      for (let j = i + 1; j < chainRadicals.length; j++) {
        const bi = chainRadicals[j];
        if (terminated.has(bi)) continue;
        const chainB = this.particles[bi];

        const headA = chainA.segments[chainA.segments.length - 1];
        const headB = chainB.segments[chainB.segments.length - 1];
        const dx = headA.x - headB.x;
        const dy = headA.y - headB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < termDist && Math.random() < kt * dt) {
          terminated.add(ai);
          terminated.add(bi);

          if (Math.random() < 0.5) {
            const combinedSegments = [
              ...chainA.segments,
              ...chainB.segments.slice().reverse(),
            ];
            this.particles.push({
              type: 'deadChain',
              segments: combinedSegments,
              vx: (chainA.vx + chainB.vx) / 2,
              vy: (chainA.vy + chainB.vy) / 2,
              radius: 5,
            });
          } else {
            this.particles.push({
              type: 'deadChain',
              segments: [...chainA.segments],
              vx: chainA.vx * 0.5,
              vy: chainA.vy * 0.5,
              radius: 5,
            });
            this.particles.push({
              type: 'deadChain',
              segments: [...chainB.segments],
              vx: chainB.vx * 0.5,
              vy: chainB.vy * 0.5,
              radius: 5,
            });
          }

          this.calloutEvent = {
            title: 'Termination',
            drawFn: (ctx, w, h) => {
              const cx = w / 2, cy = h / 2;
              ctx.fillStyle = '#4ecdc4';
              ctx.beginPath(); ctx.arc(cx - 20, cy - 5, 7, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.arc(cx + 20, cy + 5, 7, 0, Math.PI * 2); ctx.fill();
              [cx - 20, cx + 20].forEach((rx, i) => {
                const grad = ctx.createRadialGradient(rx, cy - 5 + i * 10, 0, rx, cy - 5 + i * 10, 10);
                grad.addColorStop(0, 'rgba(78,205,196,0.5)'); grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(rx, cy - 5 + i * 10, 10, 0, Math.PI * 2); ctx.fill();
              });
              ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(cx + 5, cy - 15); ctx.lineTo(cx + 15, cy - 5); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(cx + 15, cy - 15); ctx.lineTo(cx + 5, cy - 5); ctx.stroke();
              ctx.fillStyle = '#555';
              ctx.beginPath(); ctx.arc(cx + 45, cy, 8, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#fff';
              ctx.font = '9px sans-serif';
              ctx.fillText('dead', cx + 35, cy - 14);
            },
          };
          break;
        }
      }
    }

    const toRemove = [...terminated].sort((a, b) => b - a);
    for (const idx of toRemove) {
      this.particles.splice(idx, 1);
    }
  }

  _updateStats() {
    const totalA = this.params.monomerACount;
    const totalB = this.params.monomerBCount;
    const freeA = this.particles.filter(p => p.type === 'monomerA' && !p.consumed).length;
    const freeB = this.particles.filter(p => p.type === 'monomerB' && !p.consumed).length;
    const totalMonomers = totalA + totalB;
    const consumed = totalMonomers - freeA - freeB;
    const activeChains = this.particles.filter(p => p.type === 'chainRadical').length;
    const deadChains = this.particles.filter(p => p.type === 'deadChain').length;

    this.stats = {
      conversion: totalMonomers > 0 ? Math.round((consumed / totalMonomers) * 100) : 0,
      mn: deadChains > 0 ? Math.round(consumed / deadChains) : 0,
      activeChains,
      deadChains,
      freeMonomerA: freeA,
      freeMonomerB: freeB,
      cumulativeF1: (this._monomerAAdded + this._monomerBAdded) > 0
        ? this._monomerAAdded / (this._monomerAAdded + this._monomerBAdded)
        : this.params.monomerACount / totalMonomers,
      instantaneousF1: (this._recentAAdded + this._recentBAdded) > 0
        ? this._recentAAdded / (this._recentAAdded + this._recentBAdded)
        : this.params.monomerACount / totalMonomers,
    };

    // Decay recent counters for sliding window of instantaneous F1
    this._recentAAdded *= 0.95;
    this._recentBAdded *= 0.95;
  }

  tick(dt) {
    const speed = this.params.speedMultiplier;
    const scaledDt = dt * speed;

    this.time += scaledDt;
    this._moveParticles(scaledDt);
    this._processInitiation(scaledDt);
    this._processRadicalCapture(scaledDt);
    this._processPropagation(scaledDt);
    this._processTermination(scaledDt);
    this.particles = this.particles.filter(p =>
      !((p.type === 'monomerA' || p.type === 'monomerB') && p.consumed)
    );
    this._updateStats();
  }

  _chainMobility(chainLength) {
    return 1 / Math.sqrt(1 + (chainLength - 1) * 0.3);
  }

  _moveParticles(dt) {
    const w = this._canvasW;
    const h = this._canvasH;

    for (const p of this.particles) {
      if (p.consumed) continue;

      const mobility = (p.type === 'chainRadical' || p.type === 'deadChain')
        ? this._chainMobility(p.segments.length)
        : 1;

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

      if (p.type === 'chainRadical' || p.type === 'deadChain') {
        if (!p.segments || p.segments.length === 0) continue;
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

  getState() {
    return { particles: this.particles, stats: this.stats };
  }

  getStats() {
    return this.stats;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add copolymer/simulation.js
git commit -m "feat: add copolymer simulation with Mayo-Lewis kinetics"
```

---

### Task 10: Write copolymer theme + main.js + UI

**Files:**
- Create: `copolymer/theme.js`
- Create: `copolymer/ui.js`
- Create: `copolymer/main.js`

- [ ] **Step 1: Write copolymer/theme.js**

```js
export const THEME = {
  bgColor: '#0f0f23',
  colors: {
    initiator: '#ffd93d',
    primaryRadical: '#ff6b6b',
    monomerA: '#4da6ff',    // blue — 2EHA (M₁)
    monomerB: '#ff9f43',    // orange — Acrylic Acid (M₂)
    chainRadical: '#4ecdc4',
    deadChain: '#555',
    bg: '#0f0f23',
  },
  radii: {
    initiator: 7,
    primaryRadical: 4,
    monomerA: 5,
    monomerB: 5,
    chainRadical: 6,
    deadChain: 5,
  },
  glowColors: {
    primaryRadical: 'rgba(255,107,107,0.6)',
    chainRadical: 'rgba(78,205,196,0.6)',
  },
  // Segment color function: monomerType (0=M₁, 1=M₂) → color
  segmentColor: (monomerType, chainType) => {
    if (chainType === 'deadChain') return monomerType === 0 ? '#3d7ec4' : '#d08a38';
    return monomerType === 0 ? '#4da6ff' : '#ff9f43';
  },
};
```

- [ ] **Step 2: Write copolymer/ui.js**

```js
import { UIBase } from '../lib/ui-base.js';

export class UI extends UIBase {
  constructor() {
    super();

    this.btnPlay = document.getElementById('btn-play');
    this.btnPause = document.getElementById('btn-pause');
    this.btnReset = document.getElementById('btn-reset');
    this.sliderInitiator = document.getElementById('slider-initiator');
    this.sliderMonomerA = document.getElementById('slider-monomer-a');
    this.sliderMonomerB = document.getElementById('slider-monomer-b');
    this.sliderR1 = document.getElementById('slider-r1');
    this.sliderR2 = document.getElementById('slider-r2');
    this.sliderRate = document.getElementById('slider-rate');
    this.sliderSpeed = document.getElementById('slider-speed');
    this.presetSelect = document.getElementById('preset-select');

    this._bindEvents();

    this.setReadoutSpec([
      { id: 'ro-time',           key: 'time',           format: v => v.toFixed(1) + 's' },
      { id: 'ro-conversion',     key: 'conversion',     format: v => v + '%' },
      { id: 'ro-cumulative-f1',  key: 'cumulativeF1',   format: v => v.toFixed(3) },
      { id: 'ro-instant-f1',     key: 'instantaneousF1', format: v => v.toFixed(3) },
      { id: 'ro-mn',             key: 'mn',             format: v => v || '—' },
      { id: 'ro-chains',         key: 'activeChains',   format: v => String(v) },
      { id: 'ro-dead',           key: 'deadChains',     format: v => String(v) },
      { id: 'ro-free-a',         key: 'freeMonomerA',   format: v => String(v) },
      { id: 'ro-free-b',         key: 'freeMonomerB',   format: v => String(v) },
    ]);
  }

  _bindEvents() {
    this.bindButton('btn-play', 'play');
    this.bindButton('btn-pause', 'pause');
    this.bindButton('btn-reset', 'reset');

    this.bindSlider('slider-initiator', 'val-initiator', '', 'initiatorCount');
    this.bindSlider('slider-monomer-a', 'val-monomer-a', '', 'monomerACount');
    this.bindSlider('slider-monomer-b', 'val-monomer-b', '', 'monomerBCount');
    this.bindSlider('slider-r1', 'val-r1', '', 'r1');
    this.bindSlider('slider-r2', 'val-r2', '', 'r2');
    this.bindSlider('slider-rate', 'val-rate', '×', 'rateMultiplier',
      (key, val) => document.getElementById('val-rate').textContent = val.toFixed(1) + '×'
    );

    // Speed slider
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
      '2eha-aa':  { r1: 1.5, r2: 0.3 },
      'ideal':    { r1: 1.0, r2: 1.0 },
      'alternating': { r1: 0.01, r2: 0.01 },
      'styrene-an': { r1: 0.4, r2: 0.04 },
    };

    const p = presets[name];
    if (!p) return;

    // Update sliders
    const sliderR1 = document.getElementById('slider-r1');
    const sliderR2 = document.getElementById('slider-r2');
    sliderR1.value = p.r1;
    sliderR2.value = p.r2;
    document.getElementById('val-r1').textContent = p.r1.toFixed(2);
    document.getElementById('val-r2').textContent = p.r2.toFixed(2);

    this._cb('paramChange', this._getParams());
  }

  _getParams() {
    return {
      initiatorCount: parseInt(this.sliderInitiator.value),
      monomerACount: parseInt(this.sliderMonomerA.value),
      monomerBCount: parseInt(this.sliderMonomerB.value),
      r1: parseFloat(this.sliderR1.value),
      r2: parseFloat(this.sliderR2.value),
      rateMultiplier: parseFloat(this.sliderRate.value),
    };
  }
}
```

- [ ] **Step 3: Write copolymer/main.js**

```js
import { Simulation } from './simulation.js';
import { Renderer } from '../lib/renderer.js';
import { UI } from './ui.js';
import { THEME } from './theme.js';

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

  if (sim.calloutEvent) {
    renderer.drawCallout(sim.calloutEvent.title, sim.calloutEvent.drawFn);
    renderer._scheduleCalloutClear();
    sim.calloutEvent = null;
  }

  const { particles, stats } = sim.getState();
  stats.time = sim.time;
  renderer.draw(particles);
  ui.updateReadouts(stats);

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
  stats.time = sim.time;
  syncSize();
  renderer.draw(particles);
  ui.updateReadouts(stats);
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
stats.time = sim.time;
renderer.draw(particles);
ui.updateReadouts(stats);
```

- [ ] **Step 4: Commit**

```bash
git add copolymer/theme.js copolymer/ui.js copolymer/main.js
git commit -m "feat: add copolymer theme, UI, and main wiring"
```

---

### Task 11: Write copolymer/index.html

**Files:**
- Create: `copolymer/index.html`

- [ ] **Step 1: Write copolymer/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Copolymerization Simulator</title>
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <div id="app">
    <header id="header">
      <h1>Copolymerization Simulator</h1>
      <a href="../index.html" style="color:var(--text-secondary);text-decoration:none;font-size:0.8rem;">← All Simulations</a>
    </header>
    <main id="main">
      <div id="canvas-container">
        <canvas id="sim-canvas"></canvas>
        <div id="callout" class="hidden">
          <div id="callout-title"></div>
          <canvas id="callout-canvas" width="140" height="100"></canvas>
        </div>
      </div>
      <aside id="panel">
        <section class="panel-section">
          <h2>Preset</h2>
          <div class="param">
            <select id="preset-select" style="width:100%;background:#1a1a3a;color:var(--text);border:1px solid var(--border);padding:4px;border-radius:4px;">
              <option value="2eha-aa" selected>2EHA / Acrylic Acid</option>
              <option value="ideal">Ideal (r₁=r₂=1)</option>
              <option value="alternating">Alternating (r₁=r₂≈0)</option>
              <option value="styrene-an">Styrene / Acrylonitrile</option>
            </select>
          </div>
        </section>
        <section class="panel-section">
          <h2>Parameters</h2>
          <div class="param">
            <label>Initiator count <span id="val-initiator">10</span></label>
            <input type="range" id="slider-initiator" min="1" max="20" value="10" step="1">
          </div>
          <div class="param">
            <label>M₁ count (2EHA) <span id="val-monomer-a">500</span></label>
            <input type="range" id="slider-monomer-a" min="10" max="500" value="500" step="10">
          </div>
          <div class="param">
            <label>M₂ count (AA) <span id="val-monomer-b">500</span></label>
            <input type="range" id="slider-monomer-b" min="10" max="500" value="500" step="10">
          </div>
          <div class="param">
            <label>r₁ (k₁₁/k₁₂) <span id="val-r1">1.50</span></label>
            <input type="range" id="slider-r1" min="0.01" max="5.0" value="1.5" step="0.01">
          </div>
          <div class="param">
            <label>r₂ (k₂₂/k₂₁) <span id="val-r2">0.30</span></label>
            <input type="range" id="slider-r2" min="0.01" max="5.0" value="0.3" step="0.01">
          </div>
          <div class="param">
            <label>Reaction rate <span id="val-rate">5.0×</span></label>
            <input type="range" id="slider-rate" min="0.1" max="10.0" value="5.0" step="0.1">
          </div>
        </section>
        <section class="panel-section">
          <h2>Time Controls</h2>
          <div class="btn-row">
            <button id="btn-play">▶ Play</button>
            <button id="btn-pause">⏸ Pause</button>
            <button id="btn-reset">↺ Reset</button>
          </div>
          <div class="param">
            <label>Speed <span id="val-speed">5×</span></label>
            <input type="range" id="slider-speed" min="0.25" max="10" value="5" step="0.25">
          </div>
        </section>
        <section class="panel-section">
          <h2>Readouts</h2>
          <dl id="readouts">
            <dt>Time</dt><dd id="ro-time">0.0s</dd>
            <dt>Conversion</dt><dd id="ro-conversion">0%</dd>
            <dt>Cumulative F₁</dt><dd id="ro-cumulative-f1">0.500</dd>
            <dt>Instant F₁</dt><dd id="ro-instant-f1">0.500</dd>
            <dt>M<sub>n</sub></dt><dd id="ro-mn">—</dd>
            <dt>Active chains</dt><dd id="ro-chains">0</dd>
            <dt>Dead chains</dt><dd id="ro-dead">0</dd>
            <dt>Free M₁</dt><dd id="ro-free-a">0</dd>
            <dt>Free M₂</dt><dd id="ro-free-b">0</dd>
          </dl>
        </section>
      </aside>
    </main>
  </div>
  <script src="bundle.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add copolymer/index.html
git commit -m "feat: add copolymer index.html"
```

---

### Task 12: Build copolymer/bundle.js and verify

**Files:**
- Create: `copolymer/bundle.js`

- [ ] **Step 1: Build the copolymer bundle**

```bash
cd copolymer
echo "// ============================================================" > bundle.js
echo "// lib/renderer.js" >> bundle.js
echo "// ============================================================" >> bundle.js
cat ../lib/renderer.js | sed 's/^export class /class /' | sed 's/^export const /const /' | sed 's/^export function /function /' >> bundle.js

echo "" >> bundle.js
echo "// ============================================================" >> bundle.js
echo "// lib/ui-base.js" >> bundle.js
echo "// ============================================================" >> bundle.js
cat ../lib/ui-base.js | sed 's/^export class /class /' >> bundle.js

echo "" >> bundle.js
echo "// ============================================================" >> bundle.js
echo "// simulation.js" >> bundle.js
echo "// ============================================================" >> bundle.js
cat simulation.js | sed 's/^export class /class /' >> bundle.js

echo "" >> bundle.js
echo "// ============================================================" >> bundle.js
echo "// theme.js" >> bundle.js
echo "// ============================================================" >> bundle.js
cat theme.js | sed 's/^export const /const /' >> bundle.js

echo "" >> bundle.js
echo "// ============================================================" >> bundle.js
echo "// ui.js" >> bundle.js
echo "// ============================================================" >> bundle.js
cat ui.js | sed 's/^import .* from .*;//' | sed 's/^export class /class /' >> bundle.js

echo "" >> bundle.js
echo "// ============================================================" >> bundle.js
echo "// main.js" >> bundle.js
echo "// ============================================================" >> bundle.js
cat main.js | sed 's/^import .* from .*;//' >> bundle.js
```

- [ ] **Step 2: Verify syntax**

```bash
node --check copolymer/bundle.js
```

Expected: no output.

- [ ] **Step 3: Test in browser**

```bash
npx --yes serve -p 3456 -s .
```
Navigate to `http://localhost:3456/copolymer/` and verify:
- Two colors of monomers (blue M₁, orange M₂) appear
- Chains show mixed blue/orange segments reflecting copolymer composition
- Play, pause, reset work
- Preset dropdown changes r₁/r₂ sliders
- Readouts update (conversion, cumulative F₁, instantaneous F₁)
- Callout shows which monomer type was added on propagation

- [ ] **Step 4: Test landing page**

Navigate to `http://localhost:3456/` and verify two cards appear, both linking to the correct sims.

- [ ] **Step 5: Commit**

```bash
git add copolymer/bundle.js
git commit -m "feat: add copolymer bundle.js"
```

---

### Task 13: Final integration test

**Files:**
- All files in the project

- [ ] **Step 1: Test all entry points**

```bash
npx --yes serve -p 3456 -s .
```

Verify:
1. `http://localhost:3456/` — landing page with two cards
2. `http://localhost:3456/free-radical/` — free-radical sim loads, plays, resets
3. `http://localhost:3456/copolymer/` — copolymer sim loads, plays, resets
4. Navigation links (← All Simulations) work both ways

- [ ] **Step 2: Test file:// mode**

Open `index.html` directly in browser from file explorer. Landing page should render. Open `free-radical/index.html` and `copolymer/index.html` directly — both should load via their bundle.js.

- [ ] **Step 3: Regression check**

Verify the old root `js/bundle.js` still works (backward compat). The original `index.html` is now the landing page, but the old HTML structure still exists in `free-radical/index.html`.

- [ ] **Step 4: Final commit**

```bash
git add -A
git status  # review — shouldn't include .claude/settings.local.json
git commit -m "feat: complete copolymerization simulator and shared-lib architecture"
```

---

## Completion checklist

- [ ] Landing page loads at root
- [ ] Free-radical sim works in `free-radical/`
- [ ] Copolymer sim works in `copolymer/`
- [ ] Mayo-Lewis kinetics visible (composition drift, M₁/M₂ incorporation)
- [ ] Preset dropdown sets r₁/r₂
- [ ] Segments colored by monomerType in copolymer
- [ ] Callouts show correct monomer type labels
- [ ] Backward-compat `js/bundle.js` still works
- [ ] Both sims work in `file://` mode
