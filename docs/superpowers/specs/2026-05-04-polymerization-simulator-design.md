# Free-Radical Polymerization Simulator — Design Spec

**Date:** 2026-05-04
**Status:** Approved

## Overview

An interactive browser-based simulation of free-radical polymerization for educational use. Students adjust parameters (initiator concentration, monomer count, reaction rate) and watch the three-stage mechanism unfold in real time on a 2D Canvas.

## Audience & Goal

Chemistry students learning polymer chemistry. The simulation makes the molecular-level mechanism visible: initiator decomposition, chain propagation, and termination. Students build intuition by tuning parameters and seeing the effect on conversion, chain length, and reaction dynamics.

## Design Decisions

| Topic | Decision |
|---|---|
| Visualization | Hybrid — schematic circles/lines on the main canvas, ball-and-stick callout overlay for key reaction events |
| Interactivity | Full simulation — adjust parameters, play/pause, speed control, reset |
| Platform | Web — HTML5 Canvas 2D, vanilla JS, zero dependencies |
| Chemistry scope | Core three stages: initiation, propagation, termination (combination + disproportionation) |
| Architecture | 4 ES modules: main.js (loop), simulation.js (kinetics), renderer.js (Canvas), ui.js (controls) |
| Particle model | Agent-based — individual particles with Brownian motion, proximity-based reactions |

## Architecture

```
┌─────────────────────────────────────────┐
│              main.js                     │
│    Orchestrates loop, wires modules      │
└──────┬──────────┬──────────┬────────────┘
       │          │          │
  simulation.js  renderer.js   ui.js
  ┌──────┐    ┌──────┐    ┌──────┐
  │State │    │Canvas│    │Sliders│
  │Kinetics│   │Sche- │    │Buttons│
  │Particle│   │matic │    │Read-  │
  │System │    │Call- │    │outs   │
  │       │    │outs  │    │       │
  └──────┘    └──────┘    └──────┘
```

### Module Responsibilities

**simulation.js** — Owns all particle state and kinetics.
- `tick(dt)` — advance one frame: move particles, check proximity, fire reactions
- `getState()` — return all particle positions/types for rendering
- `getStats()` — return conversion, Mn, PDI, chain count, radical count
- `setParams(p)` — update rate constants from UI
- `reset()` — reinitialize with current parameters

Particle types: initiator molecules, primary radicals, free monomers, growing chain radicals, dead chains.

Reaction rules (proximity-based, probability scaled by rate constant × dt):
1. Initiator → 2 primary radicals (kd)
2. Primary radical + monomer → growing chain of length 1 (fast)
3. Chain radical + monomer → chain length +1 (kp)
4. Chain radical + chain radical → 2 dead chains (kt)

Particles move with Brownian displacement each frame. Chains move as connected segments with active wiggling at the radical end and drag along the body.

**renderer.js** — Owns the Canvas context and all drawing.
- `draw(state, stats)` — render one frame
- `resize(w, h)` — handle window resize, maintain aspect ratio

Schematic view: monomers as small grey circles, radicals as colored circles with glow (red for primary, teal for chain-end), dead chains as grey linked circles. The callout overlay shows a ball-and-stick inset in the bottom-right corner when key reaction events occur, auto-fading after ~2 seconds.

**ui.js** — Owns the DOM for the control panel.
- `onPlay(fn)`, `onPause(fn)`, `onReset(fn)` — button callbacks
- `onParamChange(fn)` — slider change callback
- `updateReadouts(stats)` — update time, conversion%, Mn, chain count display

Three sliders: initiator concentration, monomer count, reaction rate multiplier. Stage badges at the top highlight which stage is active.

**main.js** — Orchestrates the `requestAnimationFrame` loop.
- Calls `sim.tick(dt)` → gets state + stats
- Calls `renderer.draw(state, stats)`
- Responds to UI callbacks

## UI Layout

Dark theme (deep navy/charcoal). Full-width canvas on the left, 220px side panel on the right. Header bar with title and three stage badges (Initiation / Propagation / Termination — active one highlighted).

Side panel contains:
- Parameters section: 3 sliders with live values
- Time controls: Play, Pause, Reset buttons + speed slider
- Readouts: time, conversion %, Mn, chain count, radical count

Ball-and-stick callout inset at bottom-right of canvas, 140×100px, appears during key events and fades after 2s.

## File Structure

```
polymer_simulation/
├── index.html          ← entry point
├── css/
│   └── style.css       ← all styles (dark theme, layout, controls)
├── js/
│   ├── main.js         ← animation loop + module wiring
│   ├── simulation.js   ← particle system + kinetics engine
│   ├── renderer.js     ← Canvas 2D drawing + callout overlay
│   └── ui.js           ← control panel DOM + events
└── README.md           ← how to run and use
```

Zero dependencies. ES modules loaded directly in the browser. Open `index.html` to run locally. Deployable to any static host (GitHub Pages, Netlify).

## Build Order

1. **Scaffold** — HTML structure, CSS layout, dark theme, empty Canvas + side panel
2. **Renderer first** — draw particles on Canvas with Brownian motion (no reactions yet)
3. **Simulation core** — initiator decomposition, propagation, termination with proximity rules
4. **UI wiring** — sliders → params, play/pause/reset, live readouts updating
5. **Callout overlay** — ball-and-stick inset triggered by key reaction events
6. **Polish** — colors, glow effects, chain visualization improvements, transitions

## Deferred

- Chain transfer to monomer/solvent/polymer
- Inhibition/retardation (oxygen effect)
- Concentration vs. time chart in bottom bar
- Chain length distribution histogram
- Temperature/Arrhenius modeling (just use rate multiplier slider)

## Performance Target

Smooth 60fps animation with up to 200+ particles on any modern device. Collision detection is proximity-based (distance check), O(n²) worst case but fine at this scale.
