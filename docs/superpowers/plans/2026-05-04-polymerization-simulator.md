# Free-Radical Polymerization Simulator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive browser-based simulation of free-radical polymerization where students adjust parameters and watch initiation, propagation, and termination unfold on a 2D Canvas.

**Architecture:** Four vanilla JS ES modules — simulation.js (particle system + kinetics), renderer.js (Canvas 2D drawing + callout overlay), ui.js (control panel DOM), main.js (requestAnimationFrame loop + wiring). Zero dependencies. Agent-based particles with Brownian motion and proximity-triggered reactions.

**Tech Stack:** HTML5 Canvas 2D, vanilla JavaScript (ES modules), CSS Grid/Flexbox. No frameworks, no build tools.

---

### Task 1: Project Scaffold — HTML structure + CSS layout

**Files:**
- Create: `index.html`
- Create: `css/style.css`

- [ ] **Step 1: Create `index.html` with full DOM structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free-Radical Polymerization Simulator</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="app">
    <header id="header">
      <h1>🧪 Free-Radical Polymerization Simulator</h1>
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
            <label>Initiator count <span id="val-initiator">5</span></label>
            <input type="range" id="slider-initiator" min="1" max="20" value="5" step="1">
          </div>
          <div class="param">
            <label>Monomer count <span id="val-monomer">100</span></label>
            <input type="range" id="slider-monomer" min="20" max="300" value="100" step="10">
          </div>
          <div class="param">
            <label>Reaction rate <span id="val-rate">1.0×</span></label>
            <input type="range" id="slider-rate" min="0.1" max="5.0" value="1.0" step="0.1">
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
            <label>Speed <span id="val-speed">1×</span></label>
            <input type="range" id="slider-speed" min="0.25" max="4" value="1" step="0.25">
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
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `css/style.css` — dark theme, layout, all component styles**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0a0a1a;
  --bg-panel: #12122a;
  --bg-header: #12122a;
  --border: #2a2a4a;
  --text: #ddd;
  --text-secondary: #888;
  --accent: #4ecdc4;
  --red: #ff6b6b;
  --yellow: #ffd93d;
  --radius: 8px;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  height: 100vh;
  overflow: hidden;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

#header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: var(--bg-header);
  border-bottom: 1px solid var(--border);
}

#header h1 {
  font-size: 1.1rem;
  font-weight: 600;
}

#stage-badges { display: flex; gap: 12px; }

.badge {
  font-size: 0.8rem;
  padding: 3px 12px;
  border-radius: 12px;
  background: #1a1a3a;
  color: var(--text-secondary);
  transition: all 0.3s;
}

.badge.active { background: #1a3a1a; color: var(--accent); }

#main {
  display: flex;
  flex: 1;
  min-height: 0;
}

#canvas-container {
  flex: 1;
  position: relative;
  background: #0f0f23;
}

#sim-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

#callout {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 160px;
  height: 120px;
  background: rgba(18, 18, 42, 0.95);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 6px;
  transition: opacity 0.5s;
}

#callout.hidden { opacity: 0; pointer-events: none; }
#callout:not(.hidden) { opacity: 1; }

#callout-title {
  font-size: 0.65rem;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

#callout-canvas { display: block; border-radius: 4px; }

#panel {
  width: 220px;
  background: var(--bg-panel);
  border-left: 1px solid var(--border);
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-section h2 {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.param { margin-bottom: 10px; }

.param label {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  margin-bottom: 3px;
}

.param input[type="range"] {
  width: 100%;
  accent-color: var(--accent);
}

.btn-row { display: flex; gap: 6px; margin-bottom: 10px; }

button {
  background: #1a1a3a;
  color: var(--text);
  border: 1px solid var(--border);
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.78rem;
  flex: 1;
}

button:hover { background: #2a2a4a; }

#readouts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 12px;
  font-size: 0.75rem;
}

#readouts dt { color: var(--text-secondary); }

#readouts dd { text-align: right; font-variant-numeric: tabular-nums; }
```

- [ ] **Step 3: Open `index.html` in browser to verify layout**

Open the file directly in a browser. Expected: dark-themed layout with header, empty canvas area, side panel with sliders/buttons/readouts, and a hidden callout area. No errors in console.

- [ ] **Step 4: Commit**

```bash
git add index.html css/style.css
git commit -m "feat: scaffold HTML structure and CSS layout"
```

---

### Task 2: Renderer — Canvas setup + particle drawing

**Files:**
- Create: `js/renderer.js`
- Modify: `index.html` (add module script — already done in Task 1)

- [ ] **Step 1: Create `js/renderer.js` with canvas setup and draw function**

```js
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
```

- [ ] **Step 2: Verify the file has no syntax errors**

Run: `node --check js/renderer.js`
Expected: no output (exit code 0).

- [ ] **Step 3: Commit**

```bash
git add js/renderer.js
git commit -m "feat: add Canvas renderer with particle drawing and glow effects"
```

---

### Task 3: Simulation — data structures + Brownian motion

**Files:**
- Create: `js/simulation.js`

- [ ] **Step 1: Create `js/simulation.js` with particle init and motion**

```js
export class Simulation {
  constructor() {
    this.particles = [];
    this.time = 0;
    this.params = {
      initiatorCount: 5,
      monomerCount: 100,
      rateMultiplier: 1.0,
      speedMultiplier: 1.0,
    };
    this.stats = {
      conversion: 0,
      mn: 0,
      activeChains: 0,
      deadChains: 0,
      freeMonomers: 0,
    };
    this.calloutEvent = null;  // { type, data } for the current frame
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
    this._initParticles();
  }

  _initParticles() {
    const { initiatorCount, monomerCount } = this.params;
    this.particles = [];

    for (let i = 0; i < initiatorCount; i++) {
      this.particles.push({
        type: 'initiator',
        x: 20 + Math.random() * (this._canvasW - 40),
        y: 20 + Math.random() * (this._canvasH - 40),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: 7,
      });
    }

    for (let i = 0; i < monomerCount; i++) {
      this.particles.push({
        type: 'monomer',
        x: Math.random() * this._canvasW,
        y: Math.random() * this._canvasH,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
        radius: 5,
        consumed: false,
      });
    }

    this._updateStats();
  }

  _updateStats() {
    const totalMonomerInit = this.params.monomerCount;
    const free = this.particles.filter(p => p.type === 'monomer' && !p.consumed).length;
    const consumed = totalMonomerInit - free;
    const activeChains = this.particles.filter(p => p.type === 'chainRadical').length;
    const deadChains = this.particles.filter(p => p.type === 'deadChain').length;

    this.stats = {
      conversion: totalMonomerInit > 0 ? Math.round((consumed / totalMonomerInit) * 100) : 0,
      mn: deadChains > 0 ? Math.round(consumed / deadChains) : 0,
      activeChains,
      deadChains,
      freeMonomers: free,
    };
  }

  tick(dt) {
    const speed = this.params.speedMultiplier;
    const scaledDt = dt * speed;

    this.time += scaledDt;
    this._moveParticles(scaledDt);
    this._updateStats();
  }

  _moveParticles(dt) {
    const w = this._canvasW;
    const h = this._canvasH;

    for (const p of this.particles) {
      if (p.type === 'monomer' && p.consumed) continue;

      // Brownian perturbation
      p.vx += (Math.random() - 0.5) * 0.5;
      p.vy += (Math.random() - 0.5) * 0.5;

      // Damping
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Speed cap
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const maxSpeed = 3;
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      if (p.type === 'chainRadical' || p.type === 'deadChain') {
        // Move the head (last segment)
        const head = p.segments[p.segments.length - 1];
        head.x += p.vx * dt * 60;
        head.y += p.vy * dt * 60;

        // Bounce head off walls
        if (head.x < 5) { head.x = 5; p.vx *= -0.5; }
        if (head.x > w - 5) { head.x = w - 5; p.vx *= -0.5; }
        if (head.y < 5) { head.y = 5; p.vy *= -0.5; }
        if (head.y > h - 5) { head.y = h - 5; p.vy *= -0.5; }

        // Body follows leader with lag
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
        // Simple particle movement
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;

        // Bounce off walls
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

- [ ] **Step 2: Verify syntax**

Run: `node --check js/simulation.js`
Expected: no output (exit code 0).

- [ ] **Step 3: Commit**

```bash
git add js/simulation.js
git commit -m "feat: add simulation engine with particle init and Brownian motion"
```

---

### Task 4: Main — wire the animation loop (no reactions yet)

**Files:**
- Create: `js/main.js`

- [ ] **Step 1: Create `js/main.js` — import modules, set up loop, wire renderer + simulation**

```js
import { Simulation } from './simulation.js';
import { Renderer } from './renderer.js';

const canvas = document.getElementById('sim-canvas');
const sim = new Simulation();
const renderer = new Renderer(canvas);

// Sync canvas size to simulation
function syncSize() {
  const w = renderer.w;
  const h = renderer.h;
  sim.setCanvasSize(w, h);
}

let running = false;
let lastTime = 0;
let animId = null;

function loop(timestamp) {
  if (!running) return;

  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.1) : 0.016; // cap at 100ms
  lastTime = timestamp;

  syncSize();
  sim.tick(dt);
  const { particles, stats } = sim.getState();
  renderer.draw(particles, stats);

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

// Initial setup
syncSize();
sim.reset();
const { particles, stats } = sim.getState();
renderer.draw(particles, stats); // draw initial state

// Auto-play for development verification
play();
```

- [ ] **Step 2: Open `index.html` in browser to verify particles moving**

Expected: grey monomer circles and yellow initiator circles bouncing around the canvas with Brownian motion. No reactions happening yet. No console errors.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat: wire animation loop with simulation + renderer (motion only, no reactions)"
```

---

### Task 5: Simulation — initiation reactions

**Files:**
- Modify: `js/simulation.js` — add initiation logic to `tick()` and helper methods

- [ ] **Step 1: Add initiation reaction methods to `js/simulation.js`**

In `tick()`, after `this._moveParticles(scaledDt);` add `this._processInitiation(scaledDt);`. Then add these methods inside the class (before `_updateStats`):

```js
_processInitiation(dt) {
  const rate = this.params.rateMultiplier;
  const kd = 0.02 * rate; // initiator decomposition probability per second

  for (let i = this.particles.length - 1; i >= 0; i--) {
    const p = this.particles[i];
    if (p.type !== 'initiator') continue;

    // Probability of decomposition this frame
    if (Math.random() < kd * dt) {
      this._decomposeInitiator(i);
    }
  }
}

_decomposeInitiator(idx) {
  const initiator = this.particles[idx];
  const x = initiator.x;
  const y = initiator.y;

  // Remove initiator, add 2 primary radicals
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

  this.calloutEvent = { type: 'initiation', time: this.time };
}
```

- [ ] **Step 2: Add primary radical → monomer capture to initiation**

In `tick()`, after `this._processInitiation(scaledDt);` add `this._processRadicalCapture(scaledDt);`. Then add:

```js
_processRadicalCapture(dt) {
  const rate = this.params.rateMultiplier;
  const captureDist = 20; // pixels, generous for visual clarity
  const kCapture = 0.5 * rate; // high probability — diffusion-limited

  const primaryRadicals = [];
  const monomers = [];

  for (let i = 0; i < this.particles.length; i++) {
    const p = this.particles[i];
    if (p.type === 'primaryRadical') primaryRadicals.push(i);
    else if (p.type === 'monomer' && !p.consumed) monomers.push(i);
  }

  for (const ri of primaryRadicals) {
    const radical = this.particles[ri];
    for (const mi of monomers) {
      const monomer = this.particles[mi];
      if (monomer.consumed) continue;

      const dx = radical.x - monomer.x;
      const dy = radical.y - monomer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < captureDist && Math.random() < kCapture * dt) {
        // Convert to chain radical of length 1
        monomer.consumed = true;
        this.particles[ri] = {
          type: 'chainRadical',
          segments: [
            { x: monomer.x, y: monomer.y },
            { x: radical.x, y: radical.y },
          ],
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          radius: 6,
        };
        this.calloutEvent = { type: 'firstPropagation', time: this.time };
        break; // each radical captures one monomer per frame
      }
    }
  }
}
```

- [ ] **Step 3: Verify initiation in browser**

Open `index.html`. Expected: yellow initiators randomly decompose into pairs of red-glowing primary radicals. Red radicals drift toward grey monomers and, on contact, convert into teal-glowing chain radicals of length 1. The `calloutEvent` is set but not rendered yet. No console errors.

- [ ] **Step 4: Commit**

```bash
git add js/simulation.js
git commit -m "feat: add initiation — initiator decomposition and radical capture"
```

---

### Task 6: Simulation — propagation reactions

**Files:**
- Modify: `js/simulation.js` — add propagation logic

- [ ] **Step 1: Add propagation method**

In `tick()`, after `this._processRadicalCapture(scaledDt);` add `this._processPropagation(scaledDt);`. Then add:

```js
_processPropagation(dt) {
  const rate = this.params.rateMultiplier;
  const kp = 0.3 * rate; // propagation probability
  const reactDist = 18;

  const chainRadicals = [];
  const monomers = [];

  for (let i = 0; i < this.particles.length; i++) {
    const p = this.particles[i];
    if (p.type === 'chainRadical') chainRadicals.push(i);
    else if (p.type === 'monomer' && !p.consumed) monomers.push(i);
  }

  for (const ci of chainRadicals) {
    const chain = this.particles[ci];
    const head = chain.segments[chain.segments.length - 1];

    for (const mi of monomers) {
      const monomer = this.particles[mi];
      if (monomer.consumed) continue;

      const dx = head.x - monomer.x;
      const dy = head.y - monomer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < reactDist && Math.random() < kp * dt) {
        monomer.consumed = true;
        // Add monomer position as new head
        chain.segments.push({ x: monomer.x, y: monomer.y });
        // Small velocity kick
        chain.vx += (Math.random() - 0.5) * 0.5;
        chain.vy += (Math.random() - 0.5) * 0.5;
        this.calloutEvent = { type: 'propagation', time: this.time, chainLen: chain.segments.length };
        break; // one propagation per chain per frame
      }
    }
  }
}
```

- [ ] **Step 2: Verify propagation in browser**

Open `index.html`. Expected: chain radicals (teal glow) grow longer as they capture nearby monomers. The chain body (linked segments) is visible as connected dots with bonds. Chains wiggle with Brownian motion. Conversion % increases in the stats (visible via `console.log(sim.getStats())` at this point).

- [ ] **Step 3: Commit**

```bash
git add js/simulation.js
git commit -m "feat: add propagation — chain radicals capture monomers and grow"
```

---

### Task 7: Simulation — termination reactions

**Files:**
- Modify: `js/simulation.js` — add termination logic

- [ ] **Step 1: Add termination method**

In `tick()`, after `this._processPropagation(scaledDt);` add `this._processTermination(scaledDt);`. Then add:

```js
_processTermination(dt) {
  const rate = this.params.rateMultiplier;
  const kt = 0.15 * rate;
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

        // 50% combination, 50% disproportionation
        if (Math.random() < 0.5) {
          // Combination: join chains into one dead chain
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
          // Disproportionation: both become dead chains
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

        this.calloutEvent = { type: 'termination', time: this.time };
        break; // one termination pair per frame check
      }
    }
  }

  // Remove terminated chain radicals (highest indices first)
  const toRemove = [...terminated].sort((a, b) => b - a);
  for (const idx of toRemove) {
    this.particles.splice(idx, 1);
  }
}
```

- [ ] **Step 2: Verify termination in browser**

Open `index.html`. Expected: when two teal chain radicals get close, they react — their glow disappears and they become grey dead chains. Combination shows as two chains merging into one; disproportionation shows as two separate dead chains. Dead chain count increases.

- [ ] **Step 3: Commit**

```bash
git add js/simulation.js
git commit -m "feat: add termination — combination and disproportionation"
```

---

### Task 8: UI — wire controls, readouts, and stage badges

**Files:**
- Create: `js/ui.js`
- Modify: `js/main.js` — import and wire UI

- [ ] **Step 1: Create `js/ui.js` with full control wiring**

```js
export class UI {
  constructor() {
    this._callbacks = {};
    this._getElements();
    this._bindEvents();
  }

  _getElements() {
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
  }

  _bindEvents() {
    this.btnPlay.addEventListener('click', () => this._cb('play'));
    this.btnPause.addEventListener('click', () => this._cb('pause'));
    this.btnReset.addEventListener('click', () => this._cb('reset'));

    this.sliderInitiator.addEventListener('input', () => {
      document.getElementById('val-initiator').textContent = this.sliderInitiator.value;
      this._cb('paramChange', this._getParams());
    });
    this.sliderMonomer.addEventListener('input', () => {
      document.getElementById('val-monomer').textContent = this.sliderMonomer.value;
      this._cb('paramChange', this._getParams());
    });
    this.sliderRate.addEventListener('input', () => {
      document.getElementById('val-rate').textContent = parseFloat(this.sliderRate.value).toFixed(1) + '×';
      this._cb('paramChange', this._getParams());
    });
    this.sliderSpeed.addEventListener('input', () => {
      document.getElementById('val-speed').textContent = parseFloat(this.sliderSpeed.value) + '×';
      this._cb('speedChange', parseFloat(this.sliderSpeed.value));
    });
  }

  _getParams() {
    return {
      initiatorCount: parseInt(this.sliderInitiator.value),
      monomerCount: parseInt(this.sliderMonomer.value),
      rateMultiplier: parseFloat(this.sliderRate.value),
    };
  }

  on(event, fn) {
    this._callbacks[event] = fn;
  }

  _cb(event, data) {
    if (this._callbacks[event]) this._callbacks[event](data);
  }

  updateReadouts(stats) {
    document.getElementById('ro-time').textContent = stats.time.toFixed(1) + 's';
    document.getElementById('ro-conversion').textContent = stats.conversion + '%';
    document.getElementById('ro-mn').textContent = stats.mn || '—';
    document.getElementById('ro-chains').textContent = stats.activeChains;
    document.getElementById('ro-dead').textContent = stats.deadChains;
    document.getElementById('ro-monomers').textContent = stats.freeMonomers;
  }

  updateStageBadges(stats) {
    // Highlight based on what's happening
    const hasInitiators = stats.freeMonomers > stats.totalMonomers * 0.95; // early stage
    const hasActiveChains = stats.activeChains > 0;
    const hasDeadChains = stats.deadChains > 0;
    const highConversion = stats.conversion > 80;

    this._setBadge(this.badgeInit, !hasActiveChains && !hasDeadChains);
    this._setBadge(this.badgeProp, hasActiveChains && stats.conversion < 80);
    this._setBadge(this.badgeTerm, hasDeadChains > 0 || stats.conversion >= 80);
  }

  _setBadge(el, active) {
    if (active) {
      el.classList.add('active');
      el.textContent = el.textContent.replace('○', '●');
    } else {
      el.classList.remove('active');
      el.textContent = el.textContent.replace('●', '○');
    }
  }
}
```

- [ ] **Step 2: Update `js/main.js` to import and wire UI**

Replace the current `js/main.js` with:

```js
import { Simulation } from './simulation.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';

const canvas = document.getElementById('sim-canvas');
const sim = new Simulation();
const renderer = new Renderer(canvas);
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
  const { particles, stats } = sim.getState();
  stats.time = sim.time;
  renderer.draw(particles, stats);
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

// Wire UI callbacks
ui.on('play', play);
ui.on('pause', pause);
ui.on('reset', () => {
  pause();
  sim.reset();
  const { particles, stats } = sim.getState();
  stats.time = sim.time;
  syncSize();
  renderer.draw(particles, stats);
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

// Auto-start
syncSize();
sim.reset();
const { particles, stats } = sim.getState();
stats.time = sim.time;
renderer.draw(particles, stats);
ui.updateReadouts(stats);
play();
```

- [ ] **Step 3: Verify full interactivity in browser**

Open `index.html`. Expected:
- Play/Pause/Reset buttons work
- Sliders change values in real-time (labels update)
- Speed slider changes animation speed
- Readouts update every frame (time, conversion, Mn, chain counts)
- Stage badges highlight: Initiation early, Propagation during growth, Termination as chains die
- Reset clears and restarts with new parameter values

- [ ] **Step 4: Commit**

```bash
git add js/ui.js js/main.js
git commit -m "feat: wire UI controls, readouts, and stage badges"
```

---

### Task 9: Renderer — ball-and-stick callout overlay

**Files:**
- Modify: `js/renderer.js` — add callout drawing
- Modify: `js/main.js` — pass callout events to renderer

- [ ] **Step 1: Add callout rendering to `js/renderer.js`**

Add these imports and the `drawCallout` method inside the `Renderer` class:

```js
// Add these methods to the Renderer class

drawCallout(event) {
  const calloutEl = document.getElementById('callout');
  const titleEl = document.getElementById('callout-title');
  const calloutCanvas = document.getElementById('callout-canvas');
  const ctx = calloutCanvas.getContext('2d');

  if (!event) {
    calloutEl.classList.add('hidden');
    return;
  }

  calloutEl.classList.remove('hidden');
  ctx.clearRect(0, 0, calloutCanvas.width, calloutCanvas.height);

  const w = calloutCanvas.width;
  const h = calloutCanvas.height;

  if (event.type === 'initiation') {
    titleEl.textContent = 'Initiation: I₂ → 2 I•';
    // Draw initiator splitting
    const cx = w / 2, cy = h / 2;
    // Two atoms before split (fading)
    ctx.fillStyle = 'rgba(255,217,61,0.4)';
    ctx.beginPath(); ctx.arc(cx - 8, cy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 8, cy, 7, 0, Math.PI * 2); ctx.fill();
    // Dashed bond between
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy); ctx.stroke();
    ctx.setLineDash([]);
    // Two radicals moving apart
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath(); ctx.arc(cx - 22, cy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 22, cy, 5, 0, Math.PI * 2); ctx.fill();
    // Glow
    [cx - 22, cx + 22].forEach(rx => {
      const grad = ctx.createRadialGradient(rx, cy, 0, rx, cy, 10);
      grad.addColorStop(0, 'rgba(255,107,107,0.5)'); grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(rx, cy, 10, 0, Math.PI * 2); ctx.fill();
    });
    // Arrow
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText('→', cx - 4, cy + 20);
  }

  if (event.type === 'propagation' || event.type === 'firstPropagation') {
    titleEl.textContent = event.type === 'firstPropagation'
      ? 'Initiation: R• + M → RM•'
      : `Propagation: chain + M (n=${event.chainLen || '?'})`;
    const cx = w / 2, cy = h / 2;
    // Monomer (double bond)
    ctx.fillStyle = '#777';
    ctx.beginPath(); ctx.arc(cx + 25, cy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx + 25, cy, 8, 0, Math.PI * 2); ctx.stroke();
    // Chain radical
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath(); ctx.arc(cx - 15, cy, 7, 0, Math.PI * 2); ctx.fill();
    const grad = ctx.createRadialGradient(cx - 15, cy, 0, cx - 15, cy, 12);
    grad.addColorStop(0, 'rgba(78,205,196,0.5)'); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx - 15, cy, 12, 0, Math.PI * 2); ctx.fill();
    // Arrow
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('→', cx + 2, cy + 5);
    // Product chain
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath(); ctx.arc(cx + 50, cy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4ecdc4'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx + 50, cy - 8); ctx.lineTo(cx + 50, cy + 8); ctx.stroke();
    // Label n+1
    ctx.fillStyle = '#fff';
    ctx.font = '9px sans-serif';
    ctx.fillText('n+1', cx + 42, cy - 12);
  }

  if (event.type === 'termination') {
    titleEl.textContent = 'Termination';
    const cx = w / 2, cy = h / 2;
    // Two chain radicals approaching
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath(); ctx.arc(cx - 20, cy - 5, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 20, cy + 5, 7, 0, Math.PI * 2); ctx.fill();
    // Glows
    [cx - 20, cx + 20].forEach((rx, i) => {
      const grad = ctx.createRadialGradient(rx, cy - 5 + i * 10, 0, rx, cy - 5 + i * 10, 10);
      grad.addColorStop(0, 'rgba(78,205,196,0.5)'); grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(rx, cy - 5 + i * 10, 10, 0, Math.PI * 2); ctx.fill();
    });
    // X mark for termination
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + 5, cy - 15); ctx.lineTo(cx + 15, cy - 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 15, cy - 15); ctx.lineTo(cx + 5, cy - 5); ctx.stroke();
    // Dead chain result
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(cx + 45, cy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '9px sans-serif';
    ctx.fillText('dead', cx + 35, cy - 14);
  }
}

// Add a method to clear the callout after a delay
_scheduleCalloutClear() {
  if (this._calloutTimer) clearTimeout(this._calloutTimer);
  this._calloutTimer = setTimeout(() => {
    document.getElementById('callout').classList.add('hidden');
  }, 2500);
}
```

- [ ] **Step 2: Update `js/main.js` to pass callout events**

In the `loop` function, after `sim.tick(dt);` add:

```js
// Handle callout event
if (sim.calloutEvent) {
  renderer.drawCallout(sim.calloutEvent);
  renderer._scheduleCalloutClear();
  sim.calloutEvent = null;
}
```

- [ ] **Step 3: Verify callouts in browser**

Open `index.html`. Expected:
- When an initiator decomposes: bottom-right callout appears showing I₂ → 2 I•
- When a radical captures its first monomer: callout shows R• + M → RM•
- During propagation: callout shows chain growth
- When two chains terminate: callout shows termination event
- Callout auto-fades after ~2.5 seconds each time

- [ ] **Step 4: Commit**

```bash
git add js/renderer.js js/main.js
git commit -m "feat: add ball-and-stick callout overlay for key reaction events"
```

---

### Task 10: Polish — visual refinements

**Files:**
- Modify: `js/simulation.js` — prevent overcrowding, improve chain visibility
- Modify: `js/renderer.js` — improve glow, dead chain appearance
- Modify: `css/style.css` — minor tweaks

- [ ] **Step 1: Improve chain rendering in `js/renderer.js`**

Replace the bond-drawing loop and particle-drawing loop in `draw()` with this improved version (changes: thicker bonds for chains, gradient bonds, distinct dead chain color):

In `draw()`, replace the bond-drawing section with:

```js
// Draw bonds between chain segments
for (const p of particles) {
  if ((p.type === 'chainRadical' || p.type === 'deadChain') && p.segments.length > 1) {
    for (let i = 0; i < p.segments.length - 1; i++) {
      const a = p.segments[i];
      const b = p.segments[i + 1];
      const alpha = p.type === 'chainRadical' ? 0.4 : 0.2;
      ctx.strokeStyle = p.type === 'chainRadical'
        ? `rgba(78,205,196,${alpha})`
        : `rgba(150,150,150,${alpha})`;
      ctx.lineWidth = p.type === 'chainRadical' ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}
```

Replace the segment-drawing section (the inner loop for body segments) with:

```js
// Draw chain body segments
if ((p.type === 'chainRadical' || p.type === 'deadChain') && p.segments.length > 1) {
  for (let i = 0; i < p.segments.length - 1; i++) {
    const seg = p.segments[i];
    const color = p.type === 'chainRadical' ? COLORS.chainRadical : COLORS.deadChain;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Head with distinct color
  const head = p.segments[p.segments.length - 1];
  ctx.fillStyle = p.type === 'chainRadical' ? COLORS.chainRadical : COLORS.deadChain;
  ctx.beginPath();
  ctx.arc(head.x, head.y, RADII[p.type], 0, Math.PI * 2);
  ctx.fill();
}
```

- [ ] **Step 2: Add subtle background grid in `js/renderer.js`**

In `draw()`, after clearing the background, add:

```js
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
```

- [ ] **Step 3: Prevent initiator/monomer crowding in `js/simulation.js`**

In `_initParticles()`, replace the random placement of monomers with a minimum-distance placement:

```js
_initParticles() {
  const { initiatorCount, monomerCount } = this.params;
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

  for (let i = 0; i < monomerCount; i++) {
    let x, y, attempts = 0;
    do {
      x = Math.random() * this._canvasW;
      y = Math.random() * this._canvasH;
      attempts++;
    } while (tooClose(x, y, this.particles) && attempts < 100);

    this.particles.push({
      type: 'monomer', x, y,
      vx: (Math.random() - 0.5) * 1.0,
      vy: (Math.random() - 0.5) * 1.0,
      radius: 5,
      consumed: false,
    });
  }

  this._updateStats();
}
```

- [ ] **Step 4: Verify polish in browser**

Open `index.html`. Expected: subtle grid background, better chain visibility (thicker colored bonds for active chains, thin grey for dead), particles spaced apart on reset.

- [ ] **Step 5: Commit**

```bash
git add js/simulation.js js/renderer.js
git commit -m "polish: improve chain rendering, add background grid, prevent particle crowding"
```

---

### Task 11: README — documentation

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# Free-Radical Polymerization Simulator

An interactive browser-based simulation of free-radical polymerization for chemistry education.

## Quick Start

Open `index.html` in any modern browser. No installation, no dependencies.

## Controls

| Control | Effect |
|---|---|
| Initiator count | Number of initiator molecules (I₂) |
| Monomer count | Number of free monomer units |
| Reaction rate | Global multiplier for kd, kp, kt |
| Speed | Simulation speed multiplier |
| ▶ Play | Start/resume animation |
| ⏸ Pause | Freeze animation |
| ↺ Reset | Restart with current parameters |

## What You're Seeing

- **Yellow circles** — initiator molecules (I₂)
- **Red glowing dots** — primary radicals (I•) from initiator decomposition
- **Grey circles** — free monomers (M)
- **Teal glowing chains** — growing polymer chains with a radical at the end (~~~M•)
- **Grey chains** — dead polymer chains after termination

The bottom-right callout shows ball-and-stick diagrams of key reaction events.

## Chemistry

The simulation models the three stages of free-radical polymerization:

1. **Initiation** — Initiator decomposes into two primary radicals. Each radical captures a monomer to form a chain radical.
2. **Propagation** — Chain radicals repeatedly add monomers, growing the polymer chain.
3. **Termination** — Two chain radicals react to form dead chains, either by combination (one long chain) or disproportionation (two separate chains).

## Project Structure

```
polymer_simulation/
├── index.html          ← entry point
├── css/
│   └── style.css       ← dark theme, layout, controls
├── js/
│   ├── main.js         ← animation loop + module wiring
│   ├── simulation.js   ← particle system + kinetics engine
│   ├── renderer.js     ← Canvas 2D drawing + callout overlay
│   └── ui.js           ← control panel DOM + events
└── README.md
```

Zero dependencies. ES modules loaded directly in the browser.
```

- [ ] **Step 2: Verify README renders correctly**

Open `README.md` in a markdown previewer or just visually inspect the file.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README with usage and project overview"
```

---

### Task 12: Final verification — full workflow test

- [ ] **Step 1: Verify the complete simulation end-to-end**

Open `index.html` in a browser and run through this checklist:
1. Page loads without console errors
2. Particles are visible and moving with Brownian motion
3. Initiators decompose into red radicals (badge shows Initiation active)
4. Red radicals capture monomers → teal chain radicals form (badge switches to Propagation)
5. Chains grow by adding nearby monomers
6. Two chains terminate on contact → grey dead chains appear (badge shows Termination)
7. Conversion % climbs steadily, eventually reaching 80-100%
8. Play/Pause/Reset buttons work correctly
9. All sliders respond and affect the simulation
10. Speed slider changes simulation speed
11. Callout overlay appears for key events and fades
12. Readouts update in real-time

- [ ] **Step 2: Fix any issues found during verification**

Address any visual glitches, performance issues, or bugs found during end-to-end testing.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final verification and adjustments"
```

---

### Self-Review Checklist

**1. Spec coverage:**
- Architecture (4 modules) → Tasks 2-8 ✓
- Particle types + Brownian motion → Task 3 ✓
- Initiation kinetics → Task 5 ✓
- Propagation kinetics → Task 6 ✓
- Termination (combination + disproportionation) → Task 7 ✓
- UI: sliders, buttons, readouts, stage badges → Task 8 ✓
- Ball-and-stick callout overlay → Task 9 ✓
- Dark theme, layout → Task 1 ✓
- Performance (200+ particles) → Task 3 (O(n²) fine at this scale) ✓
- Deferred features properly excluded ✓

**2. Placeholder scan:** No TBDs, TODOs, or vague instructions. All code is complete. ✓

**3. Type consistency:**
- `sim.getState()` returns `{ particles, stats }` → used consistently in main.js ✓
- `stats` shape: `{ conversion, mn, activeChains, deadChains, freeMonomers }` → used consistently in UI and renderer ✓
- `calloutEvent` shape: `{ type, time, chainLen? }` → used in renderer.drawCallout() ✓
- Simulation param names match slider IDs ✓
