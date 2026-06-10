# Step-Growth (Condensation) Polymerization Simulator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a step-growth condensation polymerization simulator (AA + BB system) as the third simulator in the Polymer Simulation Lab platform.

**Architecture:** New `step-growth/` directory following the established 6-file pattern (simulation.js, theme.js, ui.js, main.js, index.html, bundle.js). Reuses shared lib/ classes (Renderer, UIBase) unchanged. Landing page gets a third sim card.

**Tech Stack:** Vanilla JS, Canvas 2D, zero dependencies.

---

### Task 1: Create step-growth directory and simulation.js (engine skeleton)

**Files:**
- Create: `step-growth/simulation.js`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "d:\coding_is_fun\polymer_simulation\step-growth"
```

- [ ] **Step 2: Write simulation.js with particle initialization and Brownian motion**

Write `d:\coding_is_fun\polymer_simulation\step-growth\simulation.js`:

```javascript
export class Simulation {
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
    this._dpHistory = [];  // [{ p, dpTheory, dpActual }]
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
        // Oligomer: move head, body follows
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
        // Monomer: simple movement
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;

        if (p.x < p.radius) { p.x = p.radius; p.vx *= -0.5; }
        if (p.x > w - p.radius) { p.x = w - p.radius; p.vx *= -0.5; }
        if (p.y < p.radius) { p.y = p.radius; p.vy *= -0.5; }
        if (p.y > h - p.radius) { p.y = h - p.radius; p.vy *= -0.5; }
      }
    }
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

    // Sample Carothers data every 10 ticks
    this._tickCounter++;
    if (this._tickCounter % 10 === 0) {
      this._sampleDPData();
    }
  }

  // --- Placeholder: reaction logic added in Task 2 ---
  _processReactions(dt) {}

  _updateByproducts(dt) {}

  _cleanupByproducts() {}

  _sampleDPData() {}

  _updateStats() {
    const totalA = this._initMonomerACount;
    const totalB = this._initMonomerBCount;
    const totalGroups = totalA * 2 + totalB * 2;

    const freeA = this._countFree('monomerA') + this._countFreeGroups('oligomer', 'freeA');
    const freeB = this._countFree('monomerB') + this._countFreeGroups('oligomer', 'freeB');
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

    // Max DP from stoichiometric imbalance (Carothers for AA+BB)
    const r = totalA > 0 ? totalB / totalA : 1;  // r ≤ 1 means B is limiting
    const ratio = totalA >= totalB ? totalB / totalA : totalA / totalB;
    const maxDP = ratio < 1 ? (1 + ratio) / (1 - ratio) : Infinity;

    this.stats = {
      conversion: p,
      dp: totalChains > 0 ? totalSegments / totalChains : 0,
      chains,
      deadChains,
      freeMonomerA,
      freeMonomerB,
      byproductCount: this._totalBonds,
      maxDP: maxDP === Infinity ? 0 : Math.round(maxDP),
    };
  }

  _countFree(type) {
    return this.particles.filter(p => p.type === type).length;
  }

  _countFreeGroups(type, groupField) {
    return this.particles
      .filter(p => p.type === type)
      .reduce((sum, p) => sum + (p[groupField] || 0), 0);
  }

  getState() {
    const allParticles = [...this.particles, ...this._byproductParticles];
    return { particles: allParticles, stats: this.stats, dpHistory: this._dpHistory };
  }

  getStats() {
    return this.stats;
  }
}
```

- [ ] **Step 3: Quick verification — check syntax**

Run: `node -c "d:\coding_is_fun\polymer_simulation\step-growth\simulation.js"`
Expected: `SyntaxError: Unexpected token 'export'` (expected — ES modules need a server)

Verify no other syntax errors by checking that `export` is the only issue:
```bash
node -e "const path = require('path'); const fs = require('fs'); const code = fs.readFileSync('d:/coding_is_fun/polymer_simulation/step-growth/simulation.js','utf8').replace(/export class/g,'class'); try { new Function(code); console.log('OK: no syntax errors'); } catch(e) { console.log('ERROR:', e.message); }"
```
Expected: `OK: no syntax errors`

---

### Task 2: Add reaction engine + chain merge logic + byproduct emission

**Files:**
- Modify: `step-growth/simulation.js` (replace the `_processReactions`, `_updateByproducts`, `_cleanupByproducts`, `_sampleDPData` placeholders)

- [ ] **Step 1: Replace `_processReactions(dt) {}` with the full reaction engine**

Find and replace the placeholder `_processReactions(dt) {}` in `simulation.js`:

```javascript
  _processReactions(dt) {
    const rate = this.params.rateMultiplier;
    const k = 8.0 * rate;  // base reaction probability
    const reactDist = 18;

    // Collect candidates with free ends
    const aCandidates = [];  // indices of particles with freeA > 0
    const bCandidates = [];  // indices of particles with freeB > 0

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.type === 'oligomer' && p.freeA === 0 && p.freeB === 0) continue; // dead chains
      if (p.type === 'byproduct') continue;
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
        if (ai === bi) continue; // same particle (can happen if both A and B ends)
        const particleB = this.particles[bi];
        if (particleB.freeB < 1) continue;

        // Get positions for distance check
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
          // Merge: particleB's segments go after particleA's
          const newSegments = [
            ...particleA.segments,
            ...particleB.segments,
          ];
          const newFreeA = particleA.freeA + particleB.freeA - 1;
          const newFreeB = particleA.freeB + particleB.freeB - 1;

          const headA = particleA.segments[particleA.segments.length - 1];
          const headB = particleB.segments[particleB.segments.length - 1];
          const midX = (headA.x + headB.x) / 2;
          const midY = (headA.y + headB.y) / 2;

          const chainLength = newSegments.length;
          const mob = this._chainMobility(chainLength);

          // Determine type label for callout
          const ends = newFreeA > 0 || newFreeB > 0 ? 'active' : 'saturated';

          // Reacted set tracks indices that will be removed
          reacted.add(ai);
          reacted.add(bi);

          // Create merged oligomer
          this.particles.push({
            type: 'oligomer',
            segments: newSegments,
            freeA: newFreeA,
            freeB: newFreeB,
            vx: (particleA.vx + particleB.vx) / 2 + (Math.random() - 0.5) * 0.5 * mob,
            vy: (particleA.vy + particleB.vy) / 2 + (Math.random() - 0.5) * 0.5 * mob,
            radius: 5,
          });

          // Emit byproduct
          this._emitByproduct(midX, midY);

          this._totalBonds++;

          // Callout event
          this.calloutEvent = {
            title: `Step-growth: bond formed (n=${chainLength})`,
            drawFn: (ctx, cw, ch) => {
              const cx = cw / 2, cy = ch / 2;
              // Show merged chain with A-B segments
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
              // Chain count display
              ctx.fillStyle = '#6abf69';
              ctx.font = '9px sans-serif';
              ctx.fillText(`A:${newFreeA} B:${newFreeB}`, cx - 10, cy - 14);
            },
          };

          // Only one reaction per particle per frame
          break;
        }
      }
    }

    // Remove reacted particles (highest indices first)
    const toRemove = [...reacted].sort((a, b) => b - a);
    for (const idx of toRemove) {
      this.particles.splice(idx, 1);
    }
  }
```

- [ ] **Step 2: Replace the `_emitByproduct` helper**

Add a new method after `_processReactions`:

```javascript
  _emitByproduct(x, y) {
    this._byproductParticles.push({
      type: 'byproduct',
      x, y,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.5 - Math.random() * 1.0,  // upward
      radius: 2,
      alpha: 0.3,
      age: 0,
    });

    // Cap at 200 byproduct particles
    if (this._byproductParticles.length > 200) {
      this._byproductParticles.shift();
    }
  }
```

- [ ] **Step 3: Replace `_updateByproducts(dt) {}`**

```javascript
  _updateByproducts(dt) {
    for (const bp of this._byproductParticles) {
      bp.age += dt;
      bp.alpha = Math.max(0, 0.3 - bp.age * 0.8);
      bp.x += bp.vx * dt * 60;
      bp.y += bp.vy * dt * 60;
      // Gentle drift
      bp.vx += (Math.random() - 0.5) * 0.1;
    }
  }
```

- [ ] **Step 4: Replace `_cleanupByproducts() {}`**

```javascript
  _cleanupByproducts() {
    this._byproductParticles = this._byproductParticles.filter(bp => bp.alpha > 0);
  }
```

- [ ] **Step 5: Replace `_sampleDPData() {}`**

```javascript
  _sampleDPData() {
    const p = this.stats.conversion;
    const dpActual = this.stats.dp;
    const dpTheory = p < 1 ? 1 / (1 - p) : 0;

    this._dpHistory.push({ p, dpTheory, dpActual });

    // Downsample: keep max 200 points
    if (this._dpHistory.length > 200) {
      // Keep every other point
      this._dpHistory = this._dpHistory.filter((_, i) => i % 2 === 0);
    }
  }
```

- [ ] **Step 6: Verify syntax again**

```bash
node -e "const fs = require('fs'); const code = fs.readFileSync('d:/coding_is_fun/polymer_simulation/step-growth/simulation.js','utf8').replace(/export class/g,'class'); try { new Function(code); console.log('OK: no syntax errors'); } catch(e) { console.log('ERROR:', e.message); }"
```
Expected: `OK: no syntax errors`

---

### Task 3: Create theme.js

**Files:**
- Create: `step-growth/theme.js`

- [ ] **Step 1: Write theme.js**

Write `d:\coding_is_fun\polymer_simulation\step-growth\theme.js`:

```javascript
export const THEME = {
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
```

---

### Task 4: Create ui.js

**Files:**
- Create: `step-growth/ui.js`

- [ ] **Step 1: Write ui.js**

Write `d:\coding_is_fun\polymer_simulation\step-growth\ui.js`:

```javascript
import { UIBase } from '../lib/ui-base.js';

export class UI extends UIBase {
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
      { id: 'ro-time',      key: 'time',      format: v => v.toFixed(1) + 's' },
      { id: 'ro-conversion', key: 'conversion', format: v => (v * 100).toFixed(1) + '%' },
      { id: 'ro-dp',         key: 'dp',         format: v => v.toFixed(1) },
      { id: 'ro-chains',     key: 'chains',     format: v => String(v) },
      { id: 'ro-dead',       key: 'deadChains', format: v => String(v) },
      { id: 'ro-free-a',     key: 'freeMonomerA', format: v => String(v) },
      { id: 'ro-free-b',     key: 'freeMonomerB', format: v => String(v) },
      { id: 'ro-byproduct',  key: 'byproductCount', format: v => String(v) },
      { id: 'ro-max-dp',     key: 'maxDP',      format: v => v || '∞' },
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
      'equal':     { monomerACount: 500, monomerBCount: 500 },
      'nylon66':   { monomerACount: 500, monomerBCount: 500 },
      'b-excess':  { monomerACount: 400, monomerBCount: 600 },
      'a-excess':  { monomerACount: 600, monomerBCount: 400 },
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
```

---

### Task 5: Create main.js

**Files:**
- Create: `step-growth/main.js`

- [ ] **Step 1: Write main.js**

Write `d:\coding_is_fun\polymer_simulation\step-growth\main.js`:

```javascript
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

  const { particles, stats, dpHistory } = sim.getState();

  // Always draw Carothers chart in callout if we have data
  if (dpHistory && dpHistory.length > 1) {
    renderer.drawCallout('DP vs Conversion', (ctx, w, h) => {
      const pad = { top: 14, bottom: 16, left: 20, right: 8 };
      const plotW = w - pad.left - pad.right;
      const plotH = h - pad.top - pad.bottom;

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, w, h);

      // Find max values for scaling
      let maxDP = 0;
      for (const d of dpHistory) {
        if (d.dpTheory > maxDP) maxDP = d.dpTheory;
        if (d.dpActual > maxDP) maxDP = d.dpActual;
      }
      maxDP = Math.max(maxDP, 2);
      // Log scale: y = log10(DP) / log10(maxDP)
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

      // Plot theoretical curve (teal)
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

      // Plot actual curve (copper)
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

      // Labels
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
    });
  }

  stats.time = sim.time;
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
```

---

### Task 6: Create index.html for step-growth

**Files:**
- Create: `step-growth/index.html`

- [ ] **Step 1: Write index.html**

Write `d:\coding_is_fun\polymer_simulation\step-growth\index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Step-Growth Condensation</title>
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <div id="app">
    <header id="header">
      <h1>Step-Growth Condensation</h1>
      <a href="../index.html" class="back-link">← Lab</a>
      <div id="stage-badges">
        <span id="badge-monomers" class="badge active">● Monomers</span>
        <span id="badge-reacting" class="badge">○ Reacting</span>
        <span id="badge-chains" class="badge">○ Chains</span>
        <span id="badge-saturated" class="badge">○ Saturated</span>
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
          <h2>Preset</h2>
          <div class="param">
            <select id="preset-select">
              <option value="equal" selected>Equal A / B (DP unlimited)</option>
              <option value="nylon66">Nylon-6,6 (balanced)</option>
              <option value="b-excess">B in Excess (MW limited)</option>
              <option value="a-excess">A in Excess (MW limited)</option>
            </select>
          </div>
        </section>
        <section class="panel-section">
          <h2>Parameters</h2>
          <div class="param">
            <label>Diamine A <span id="val-monomer-a">500</span></label>
            <input type="range" id="slider-monomer-a" min="100" max="2000" value="500" step="10">
          </div>
          <div class="param">
            <label>Diacid B <span id="val-monomer-b">500</span></label>
            <input type="range" id="slider-monomer-b" min="100" max="2000" value="500" step="10">
          </div>
          <div class="param">
            <label>Reaction rate <span id="val-rate">5.0×</span></label>
            <input type="range" id="slider-rate" min="0.5" max="20.0" value="5.0" step="0.1">
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
            <label>Speed <span id="val-speed">10×</span></label>
            <input type="range" id="slider-speed" min="0.25" max="30" value="10" step="0.25">
          </div>
        </section>
        <section class="panel-section">
          <h2>Readouts</h2>
          <dl id="readouts">
            <dt>Time</dt><dd id="ro-time">0.0s</dd>
            <dt>Conversion (p)</dt><dd id="ro-conversion">0.0%</dd>
            <dt>Degree of Polym.</dt><dd id="ro-dp">0.0</dd>
            <dt>Active chains</dt><dd id="ro-chains">0</dd>
            <dt>Saturated</dt><dd id="ro-dead">0</dd>
            <dt>Free A (diamine)</dt><dd id="ro-free-a">0</dd>
            <dt>Free B (diacid)</dt><dd id="ro-free-b">0</dd>
            <dt>Bonds (H₂O)</dt><dd id="ro-byproduct">0</dd>
            <dt>Max DP</dt><dd id="ro-max-dp">∞</dd>
          </dl>
        </section>
      </aside>
    </main>
  </div>
  <script src="bundle.js"></script>
</body>
</html>
```

---

### Task 7: Update landing page with step-growth sim card

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add the step-growth sim card after the copolymer card**

In `d:\coding_is_fun\polymer_simulation\index.html`, find the copolymer card closing `</a>` and add after it:

```html
          <a href="step-growth/index.html" class="sim-card card-stepgrowth">
            <div class="sim-card-accent"></div>
            <h2>Step-Growth Condensation</h2>
            <p>AA + BB condensation kinetics. Watch diamine and diacid monomers merge into chains with Carothers equation in action. Every bond releases H₂O.</p>
            <div class="sim-card-footer">
              Enter Lab <span class="arrow">→</span>
            </div>
          </a>
```

- [ ] **Step 2: Add `.card-stepgrowth` styles to `css/style.css`**

Append at the end of `d:\coding_is_fun\polymer_simulation\css\style.css`:

```css
.card-stepgrowth .sim-card-accent {
  background: var(--amber);
  box-shadow: 0 0 12px var(--amber-glow);
}

.card-stepgrowth::before {
  background: radial-gradient(ellipse at 30% 20%, rgba(106, 191, 105, 0.06), transparent 70%);
}

.card-stepgrowth .sim-card h2 {
  color: var(--amber);
}

.card-stepgrowth .sim-card-footer {
  color: var(--amber);
}
```

- [ ] **Step 3: Update animation-delay for the third card**

In `d:\coding_is_fun\polymer_simulation\css\style.css`, find the `.sim-card:nth-child(2) { animation-delay: 0.25s; }` line and add after it:

```css
.sim-card:nth-child(3) { animation-delay: 0.4s; }
```

---

### Task 8: Create bundle.js

**Files:**
- Create: `step-growth/bundle.js`

- [ ] **Step 1: Generate bundle.js by concatenating source files**

```bash
cd "d:\coding_is_fun\polymer_simulation"
cat \
  lib/renderer.js \
  lib/ui-base.js \
  step-growth/simulation.js \
  step-growth/theme.js \
  step-growth/ui.js \
  step-growth/main.js \
  | sed '/^import /d; /^export /s/^export //; /^  export /s/^  export //' \
  > step-growth/bundle.js
```

- [ ] **Step 2: Verify bundle structure**

```bash
head -5 "d:\coding_is_fun\polymer_simulation\step-growth\bundle.js"
```
Expected: `// ============================================================` comment block from renderer.js

```bash
grep -c "class " "d:\coding_is_fun\polymer_simulation\step-growth\bundle.js"
```
Expected: `4` (Renderer, UIBase, Simulation, UI)

- [ ] **Step 3: Quick functional test via browser**

```bash
# Kill any existing server first
npx --yes serve -p 3456 -s "d:\coding_is_fun\polymer_simulation" &
sleep 2
curl -s http://localhost:3456/step-growth/index.html | head -5
```
Expected: HTML document with "Step-Growth Condensation" title

---

### Task 9: Update project docs

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CHANGELOG.md**

Prepend to `d:\coding_is_fun\polymer_simulation\CHANGELOG.md`:

```markdown
## 2026-06-10

- **Step-growth condensation simulator:** AA + BB kinetics with diamine (copper) and diacid (cobalt) monomers. Any particle with free ends can react with any other — fundamentally different from chain-growth. Features Carothers equation (DP = 1/(1-p)), stoichiometric imbalance control, live DP-vs-conversion chart, and byproduct (H₂O) particle emission. Third simulator in the platform.
```

- [ ] **Step 2: Update CLAUDE.md**

In `d:\coding_is_fun\polymer_simulation\CLAUDE.md`, add under the "Simulations" section after copolymerization:

```markdown
### Step-Growth Condensation

AA + BB condensation polymerization. Two monomers (diamine A / diacid B) with complementary difunctional groups. Any molecule with free ends can react with any other — chains merge rather than extend. Byproduct (H₂O) particles drift away from each bond.

| Parameter | Default | Meaning |
|-----------|---------|---------|
| Rate | 5.0 × rate | Reaction probability per second |
| speed | 10.0 | Simulation speed multiplier |
| Stoichiometric ratio | 1.0 | N_A / N_B — imbalance limits max DP |

Particle types: `monomerA`, `monomerB`, `oligomer`, `byproduct`

Stats: conversion (p), DP, chain count, free A/B, byproduct count, max DP (Carothers)
```

Also update the project layout tree to include `step-growth/` directory.

---

### Task 10: Visual verification and polish

**Files:**
- None — verification only

- [ ] **Step 1: Serve the project and open in browser**

```bash
# Kill existing serve processes
pkill -f "serve -p 3456" 2>/dev/null || true
sleep 1
npx --yes serve -p 3456 -s "d:\coding_is_fun\polymer_simulation" &
```

- [ ] **Step 2: Verify landing page**
- Open `http://localhost:3456`
- Confirm three sim cards are visible (Free-Radical, Copolymerization, Step-Growth Condensation)
- Confirm the third card has amber/green accent styling
- Confirm animation-delay stagger works (card appears third)

- [ ] **Step 3: Verify step-growth sim loads**
- Click into Step-Growth Condensation or navigate to `http://localhost:3456/step-growth/index.html`
- Confirm the page loads without console errors
- Confirm canvas area, panel, and controls are visible
- Confirm four stage badges show in header

- [ ] **Step 4: Verify simulation runs**
- Click Play
- Watch: copper (diamine A) and cobalt (diacid B) monomers bouncing
- Within seconds: bonds should form, chains merge, byproduct droplets rise
- Confirm readouts update (conversion increases, DP rises, free A/B decrease)
- Confirm Carothers chart appears in callout with teal (theory) and copper (actual) curves

- [ ] **Step 5: Test interactions**
- Adjust monomer A/B sliders to create imbalance (e.g., A=500, B=800)
- Reset and observe that max DP is now limited
- Try Nylon-6,6 preset — balanced ratio
- Try "B in Excess" preset — observe DP ceiling
- Adjust reaction rate and speed — observe changes in kinetics

- [ ] **Step 6: Verify byproduct visual**
- Watch for small cyan-translucent particles rising from reaction sites
- Confirm they fade out after ~2 seconds
- Confirm canvas doesn't accumulate unlimited particles (cap of 200 works)

- [ ] **Step 7: Stage badge verification**
- Monitor badges as conversion progresses: Monomers → Reacting → Chains → Saturated
- Confirm only one badged is lit with "●" at a time (except early transition)

- [ ] **Step 8: Sync bundle with source if any fixes were needed**

If any source files were fixed during visual testing, regenerate the bundle:

```bash
cat \
  lib/renderer.js \
  lib/ui-base.js \
  step-growth/simulation.js \
  step-growth/theme.js \
  step-growth/ui.js \
  step-growth/main.js \
  | sed '/^import /d; /^export /s/^export //; /^  export /s/^  export //' \
  > step-growth/bundle.js
```

---

### Task 11: Final commit

**Files:**
- All new and modified files

- [ ] **Step 1: Stage all new and changed files**

```bash
cd "d:\coding_is_fun\polymer_simulation"
git add step-growth/ index.html css/style.css CHANGELOG.md CLAUDE.md .gitignore
git add docs/superpowers/specs/2026-06-10-step-growth-sim-design.md
git add docs/superpowers/plans/2026-06-10-step-growth-sim.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: add step-growth condensation polymerization simulator

- AA + BB step-growth kinetics with diamine (copper) and diacid (cobalt)
- Any molecule with free ends can react with any other (not chain-growth)
- Carothers equation: DP = 1/(1-p) with live chart in callout
- Stoichiometric imbalance slider controls max molecular weight
- Byproduct (H2O) particle emission on each bond
- 4 stage badges: Monomers → Reacting → Chains → Saturated
- Presets for balanced and imbalanced feed ratios
- Landing page updated with third sim card (amber-green accent)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 3: Verify commit**

```bash
git log --oneline -1
git status
```
Expected: Clean working tree, last commit message starts with "feat: add step-growth..."
