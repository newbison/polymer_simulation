# Polymer Simulation

Interactive browser-based free-radical polymerization simulator for chemistry education. Zero dependencies, vanilla JS.

## Project layout

```
polymer_simulation/
├── index.html              ← entry point, loads js/bundle.js
├── css/style.css           ← dark theme, layout, controls
├── js/
│   ├── main.js             ← animation loop + module wiring (ES modules)
│   ├── simulation.js       ← particle system + kinetics engine
│   ├── renderer.js         ← Canvas 2D drawing + callout overlay
│   ├── ui.js               ← control panel DOM + events
│   └── bundle.js           ← all JS modules bundled for file:// compatibility
└── README.md
```

## How to run

```bash
# Quick: open index.html directly (file:// URLs need bundle.js, not ES modules)
# Or serve via any static server:
npx --yes serve -p 3456 -s .
python -m http.server 8765
```

## Architecture

Four modules wired together in `js/main.js`:

- **Simulation** (`js/simulation.js`) — Pure state machine. Owns the particle array. `tick(dt)` runs one timestep: movement → initiation → radical capture → propagation → termination → cleanup. Exposes `getState()`, `reset()`, `setParams()`.
- **Renderer** (`js/renderer.js`) — Stateless Canvas 2D drawing. `draw(particles)` clears and redraws everything each frame (grid, bonds, particles with glow). `drawCallout(event)` renders the bottom-right ball-and-stick callout.
- **UI** (`js/ui.js`) — Wraps DOM elements. Fires callbacks (`play`, `pause`, `reset`, `paramChange`, `speedChange`) and provides `updateReadouts()` / `updateStageBadges()`.
- **main.js** — `requestAnimationFrame` loop, wires UI callbacks to sim methods, drives renderer each frame.

## Key constants & defaults

| Constant | Default | Meaning |
|----------|---------|---------|
| kd | 25.0 × rate | Initiator decomposition probability per second |
| kp | 12.5 × rate | Propagation probability |
| kt | 3.75 × rate | Termination probability |
| rate multiplier | 5.0 | Global scalar for all k values |
| speed | 5.0 | Simulation speed multiplier |

## Particle types

- `initiator` — I₂ molecule, decomposes into 2 primary radicals
- `primaryRadical` — I•, captures a monomer to become a chain radical
- `monomer` — M, free monomer (has `consumed` flag)
- `chainRadical` — Growing chain with radical at head (`segments` array)
- `deadChain` — Terminated chain (`segments` array), inert

## The bundle

`js/bundle.js` is concatenated ES module source (not a minified build). When editing, modify the individual files in `js/`, then regenerate the bundle so `file://` mode still works. Check the repo for the bundling approach — it's a simple concatenation that handles `import`/`export` removal.

## Coding conventions

- No external dependencies — keep it that way
- ES module syntax in source files (`export class`, `import from`)
- Dark theme CSS variables in `:root` (see `css/style.css`)
- Particle state is mutated in place — no immutability
- `dt` is clamped to max 0.1s to avoid physics explosions on tab-away
- Canvas uses `devicePixelRatio` scaling for sharp rendering
