# Step-Growth (Condensation) Polymerization Simulator — Design Spec

## Overview

Add a new **step-growth condensation polymerization** simulator to the Polymer Simulation Lab platform. This is the third simulator, covering the other major class of polymerization (contrasting with the existing chain-growth free-radical and copolymerization sims).

## Motivation

The platform currently covers chain-growth kinetics (free-radical, copolymerization). Step-growth is a fundamentally different mechanism where **any two molecules with complementary functional groups can react** — not just chain ends. This teaches distinct core concepts: Carothers equation, the need for >99% conversion to achieve high MW, stoichiometric imbalance as a MW control mechanism, and the Flory most-probable molecular weight distribution.

## Simulation Model

### Monomer System: AA + BB

Two monomer types with complementary difunctional groups:

| Monomer | Type | Functional Groups | Visual |
|---------|------|------------------|--------|
| Diamine (Mᴀ) | AA | Two -NH₂ groups | Copper (#d97742) |
| Diacid (Mʙ) | BB | Two -COOH groups | Cobalt (#4888dd) |

### Particle Types

| Type | Radius | Description | Color |
|------|--------|-------------|-------|
| `monomerA` | 5 | Free diamine monomer | #d97742 (copper) |
| `monomerB` | 5 | Free diacid monomer | #4888dd (cobalt) |
| `oligomer` | — | Chain of bonded A-B units | Segments alternate copper/cobalt; overall chain rendered amber-green |
| `byproduct` | 2 | H₂O released on each bond | Translucent cyan (rgba(120,200,255,0.3)), drifts upward and fades |

### Reaction Rules

A reaction occurs when:
1. Two particles are within reaction distance (`reactDist = 18px`)
2. One has at least one free A-end (`freeA > 0`)
3. The other has at least one free B-end (`freeB > 0`)
4. `Math.random() < k * dt` passes (where `k` is the reaction rate)

When a reaction occurs:
- **Both particles remain** (they merge into a single oligomer)
- The new particle's segments = `concat(particleA.segments, particleB.segments)`
- `freeA_new = freeA_A + freeA_B - 1`
- `freeB_new = freeB_A + freeB_B - 1` (one of each end is consumed forming the bond)
- A byproduct particle is spawned at the bond midpoint with upward velocity
- Both original particles are removed; the merged oligomer is added

### Particle State Shape

```js
{
  type: 'monomerA' | 'monomerB' | 'oligomer' | 'byproduct',
  // For monomers:
  x, y, vx, vy,
  // For oligomers:
  segments: [{ x, y, monomerType: 0|1 }, ...],
  freeA: 0|1|2,     // free amine end-groups remaining
  freeB: 0|1|2,     // free acid end-groups remaining
  // For all:
  vx, vy,
  radius: 5 | 3 | 2,
  // For byproduct:
  age: 0,           // increments each frame, removes when alpha reaches 0
  alpha: 0.3,
}
```

### Critical Difference from Existing Sims

- **No initiator particles** — no I₂ decomposition, no primary radicals
- **No propagation vs termination distinction** — every reaction is identical
- **Any molecule can react with any other** — not just chain ends with monomers
- **Two ends tracked per particle** — a particle can react at either end (or both)
- **Monomers are consumed, not "activated"** — no radical state needed

### Termination (Chain Saturation)

An oligomer is "dead" when both `freeA = 0` and `freeB = 0` — it can no longer react. Dead oligomers:
- Are visually dimmed (half-opacity segments)
- Still rendered on canvas but do not participate in reaction matching
- Are excluded from free-end reaction loops (optimization)

A particle with `freeA = 0` or `freeB = 0` but not both is **asymmetric** — it can still react on the remaining functional end.

## Kinetics & Carothers Equation

### Key Metrics

| Metric | Formula | Notes |
|--------|---------|-------|
| Conversion p | `1 - (freeA + freeB) / (initA + initB)` | Fraction of functional groups consumed |
| Degree of Polymerization | `totalSegments / chainCount` | Number-average across all oligomers |
| Theoretical DP | `DP = 1 / (1 - p)` | Carothers equation for AA+BB |
| Max DP (imbalance) | `DP_max ≈ (1 + r) / (1 - r)` where r = A/B, r ≤ 1 | Controlled by stoichiometric ratio |
| Chain Count | Number of particles with `type === 'oligomer'` | Decreases as chains merge |
| Byproduct Count | Total H₂O released | Equals number of bonds formed |

### Live Carothers Chart

Real-time plot in the callout area (168×120 canvas, bottom-right):

- X-axis: conversion p (0 → 1)
- Y-axis: DP (log scale recommended, 1 → ~1000)
- **Teal curve**: theoretical DP = 1/(1-p)
- **Copper curve**: actual measured DP from particle data
- Data sampled every N ticks, max ~200 points with downsampling
- The divergence at high p is the key pedagogical moment

## UI Design

### Panel Sections (240px right sidebar)

**Section 1: Monomer Controls**
- Diamine A slider (range 100–2000, default 500)
- Diacid B slider (range 100–2000, default 500)
- Auto-calculated ratio r = A/B displayed as readout
- Moving either slider instantly updates the ratio

**Section 2: Reaction Parameters**
- Reaction Rate slider (0.5–20.0, default 5.0)
- Speed slider (1×–30×, default 10×)
- Play / Pause / Reset buttons

**Section 3: Readouts** (2-column grid)

| Label | Example |
|-------|---------|
| Conversion (p) | 0.72 |
| Degree of Polym. | 3.6 |
| Free A | 140 |
| Free B | 140 |
| Chains | 127 |
| Byproduct | 373 |
| Max DP (theory) | 71 |
| Time | 2.4s |

### Stage Badges

Four stages in the header bar, lit sequentially as conversion increases:

| Badge | Active when |
|-------|-------------|
| Monomers | >50% free monomers remain |
| Reacting | p < 0.5 |
| Chains | p < 0.9, oligomers dominate |
| Saturated | p ≥ 0.9, chains plateau |

### Carothers Chart Callout

Bottom-right canvas overlay. Title: "DP vs Conversion". Draws the live chart via the existing `drawCallout` mechanism.

## File Structure

### New files (`step-growth/`)

```
step-growth/
├── index.html          ← Standard entry point template
├── simulation.js       ← Step-growth state machine
├── theme.js            ← Colors, radii, segmentColor callback
├── ui.js               ← Extends UIBase
├── main.js             ← RAF loop
└── bundle.js           ← Concatenated source
```

### Modified files

| File | Change |
|------|--------|
| `index.html` | Add third sim card for step-growth |
| `CHANGELOG.md` | Log the addition |
| `CLAUDE.md` | Add step-growth section to docs |

### Unchanged

- `lib/renderer.js` — fully reused via theme parameters
- `lib/ui-base.js` — fully reused
- `css/style.css` — no new styles needed (reuses existing component styles)
- `free-radical/` — untouched
- `copolymer/` — untouched

## Theme

```js
export const THEME = {
  bgColor: '#0f0f23',
  colors: {
    monomerA: '#d97742',     // copper — diamine
    monomerB: '#4888dd',     // cobalt — diacid
    oligomer: '#6abf69',     // amber-green — chain body
    deadChain: '#444',       // dim gray — saturated chains
    byproduct: 'rgba(120, 200, 255, 0.3)',  // translucent cyan
    bg: '#0f0f23',
  },
  radii: {
    monomerA: 5,
    monomerB: 5,
    byproduct: 2,
  },
  segmentColor: (monomerType, chainType) => {
    if (chainType === 'deadChain') {
      return monomerType === 0 ? '#8a5530' : '#2a5590';
    }
    return monomerType === 0 ? '#d97742' : '#4888dd';
  },
};
```

## Implementation Plan

### Phase 1: Simulation Engine (`simulation.js`)
1. Particle state shape and initialization (monomerA + monomerB counts, spaced placement)
2. Brownian motion (same mobility physics as existing sims)
3. Reaction matching — O(n²) over pairs with complementary free ends
4. Chain merge logic — segment concatenation, free-end bookkeeping
5. Byproduct emission — spawn, drift, fade, auto-remove
6. Dead chain detection and visual dimming
7. Stats computation (p, DP, chain count, byproduct count)
8. Carothers chart data collection (p vs DP history)

### Phase 2: Theme + UI (`theme.js`, `ui.js`)
1. Theme object with colors/radii/segmentColor
2. UI extends UIBase: monomer sliders, rate slider, speed slider
3. Readout specs for all stats
4. Stage badge logic for 4 phases
5. Preset dropdown (e.g., "Equal A/B", "Nylon-6,6", "B in Excess")

### Phase 3: Entry Point + Bundle (`main.js`, `index.html`, `bundle.js`)
1. Standard RAF loop (same pattern as free-radical/main.js)
2. Carothers chart drawFn for callout
3. Landing page sim card
4. Bundle concatenation

### Phase 4: Polish
1. Empty-state behavior (all monomers consumed, chains saturated)
2. Byproduct fade-out visual tuning
3. Chart axis scaling
4. Performance optimization for large particle counts

## Open Questions

1. **Chain mobility** — should oligomer mobility decrease with length (as in existing sims)? Yes — reuse `_chainMobility()`.
2. **Dead chain rendering** — keep on canvas as static particles, or let them drift slowly? Keep static/dim — shows the "frozen" network character.
3. **Byproduct accumulation** — should byproduct particles be capped to avoid filling the canvas? Yes — max ~200 alive at once, oldest removed first.
