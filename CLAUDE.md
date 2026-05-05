# Polymer Simulation

Interactive browser-based polymer simulation platform for chemistry education. Zero dependencies, vanilla JS. Multiple simulators share a generic renderer and UI base class from `lib/`.

## Project layout

```
polymer_simulation/
├── index.html                  ← landing page linking to each sim
├── css/style.css               ← dark theme, layout, sim cards
├── lib/
│   ├── renderer.js             ← generic Canvas 2D renderer (theme-parameterized)
│   └── ui-base.js              ← generic UI base class (sliders, readouts, badges)
├── free-radical/
│   ├── index.html              ← free-radical sim entry point
│   ├── simulation.js           ← chain-growth kinetics engine
│   ├── theme.js                ← colors, radii, glow for free-radical
│   ├── ui.js                   ← extends UIBase with sim-specific controls
│   ├── main.js                 ← RAF loop + module wiring
│   └── bundle.js               ← concatenated bundle for file://
├── copolymer/
│   ├── index.html              ← copolymer sim entry point
│   ├── simulation.js           ← Mayo-Lewis kinetics engine
│   ├── theme.js                ← colors (blue M₁/orange M₂), segmentColor callback
│   ├── ui.js                   ← extends UIBase with r₁/r₂ sliders, preset dropdown
│   ├── main.js                 ← RAF loop + module wiring
│   └── bundle.js               ← concatenated bundle for file://
├── js/                         ← DEPRECATED: backward-compat wrappers
│   ├── simulation.js, renderer.js, ui.js, main.js
│   └── bundle.js               ← same as free-radical/bundle.js
├── CLAUDE.md
├── CHANGELOG.md
└── README.md
```

## How to run

```bash
# Serve from root — landing page at /
npx --yes serve -p 3456 -s .
python -m http.server 8765
```

## Architecture

**Shared lib/ (generic):**
- **Renderer** (`lib/renderer.js`) — Takes a `theme` object at construction: `{ bgColor, colors, radii, glowColors, segmentColor }`. `draw(particles)` uses theme for all styling. `drawCallout(title, drawFn)` takes a draw callback — no chemistry-specific event types.
- **UIBase** (`lib/ui-base.js`) — Callback system (`on`/`_cb`), `bindButton`, `bindSlider`, `setReadoutSpec`/`updateReadouts`, `setBadge`. Sim UIs extend this.

**Per-sim directories:**
- **simulation.js** — Pure state machine. Owns the particle array. `tick(dt)` runs one timestep. Exposes `getState()`, `reset()`, `setParams()`.
- **theme.js** — Exports `THEME` object with all visual constants.
- **ui.js** — Extends `UIBase`, wires sim-specific DOM elements.
- **main.js** — `requestAnimationFrame` loop, wires UI callbacks to sim methods.

## Simulations

### Free-Radical Polymerization

Models chain-growth: initiation (I₂ → 2I• → RM•), propagation (RM• + M → R-M•), termination (combination or disproportionation).

| Constant | Default | Meaning |
|----------|---------|---------|
| kd | 25.0 × rate | Initiator decomposition probability per second |
| kp | 12.5 × rate | Propagation probability |
| kt | 3.75 × rate | Termination probability |
| rate multiplier | 5.0 | Global scalar for all k values |
| speed | 10.0 | Simulation speed multiplier |

Particle types: `initiator`, `primaryRadical`, `monomer`, `chainRadical`, `deadChain`

### Copolymerization

Mayo-Lewis kinetics with two monomer types: M₁ (2EHA, blue) and M₂ (AA, orange). Propagation probability depends on chain head type and remaining monomer concentrations:

```
Head=M₁: P(add M₁) = r₁[M₁] / (r₁[M₁] + [M₂])
Head=M₂: P(add M₁) = [M₁] / ([M₁] + r₂[M₂])
```

Default: 95/5 2EHA/AA feed ratio, r₁=0.35, r₂=2.5 (Q-e estimates). AA preferentially incorporates despite low feed.

Stats: cumulative F₁, instantaneous F₁ (sliding window), free M₁/M₂ counts. Presets for ideal, alternating, and styrene/acrylonitrile.

Particle types add: `monomerA`, `monomerB` (segments have `monomerType: 0|1`)

## The bundle

Each sim's `bundle.js` is concatenated source (not minified). Order: lib/renderer.js → lib/ui-base.js → simulation.js → theme.js → ui.js → main.js. `export`/`import` keywords stripped via `sed`. When editing, modify the individual source files, then regenerate the bundle.

## Coding conventions

- No external JS dependencies — keep it that way. Web fonts (Google Fonts via CSS @import) are acceptable
- ES module syntax in source files (`export class`, `import from`)
- Dark theme CSS variables in `:root` (see `css/style.css`)
- Particle state is mutated in place — no immutability
- `dt` is clamped to max 0.1s to avoid physics explosions on tab-away
- Canvas uses `devicePixelRatio` scaling for sharp rendering
- `lib/` classes are generic; sim-specific logic stays in sim directories
- Theme objects define all visual constants — no hardcoded colors in renderer
- Callout events use `{ title, drawFn(ctx, w, h) }` shape

## Session workflow

- `/resume` — run at session start. Reads CLAUDE.md, CHANGELOG.md, session memory, and git status.
- `/close-session` — run at session end. Updates CLAUDE.md, saves session memory, logs to CHANGELOG.md, commits and pushes.

Session memory: `C:\Users\DELL\.claude\projects\D--coding-is-fun-polymer-simulation\memory\`
