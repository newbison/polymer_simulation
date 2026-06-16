# Polymer Simulation

Interactive browser-based polymer simulation platform for chemistry education. Zero dependencies, vanilla JS. Four simulators sharing a generic renderer and UI base class from `lib/`. Visual design: "Mineral Lab" — copper, cobalt, amber, and rose on deep navy.

## Project layout

```text
polymer_simulation/
├── index.html                  ← landing page (animated particle bg, 4 sim cards)
├── css/style.css               ← DM Mono/Sans fonts, copper/cobalt CSS vars, glass panels
├── lib/
│   ├── renderer.js             ← generic Canvas 2D renderer (theme-parameterized, bonds, grid)
│   └── ui-base.js              ← generic UI base class (sliders, readouts, badges, presets)
├── free-radical/
│   ├── index.html              ← chain-growth sim (stage badges, lab journal)
│   ├── simulation.js           ← initiation/propagation/termination engine
│   ├── theme.js                ← colors (teal chains, red radicals)
│   ├── ui.js                   ← extends UIBase, stage badges, Mn/Mw/PDI readouts
│   ├── main.js                 ← RAF loop + kinetics chart overlay + lab journal
│   └── bundle.js               ← concatenated bundle for file://
├── copolymer/
│   ├── index.html              ← copolymer sim (Mayo-Lewis diagram canvas)
│   ├── simulation.js           ← Mayo-Lewis kinetics + alternating + chain transfer
│   ├── theme.js                ← colors (blue M₁/orange M₂), segmentColor callback
│   ├── ui.js                   ← extends UIBase with r₁/r₂ sliders, preset dropdown, Ct/alt
│   ├── main.js                 ← RAF loop + Mayo-Lewis composition diagram
│   └── bundle.js               ← concatenated bundle for file://
├── step-growth/
│   ├── index.html              ← step-growth sim (4 stage badges, presets)
│   ├── simulation.js           ← AA+BB condensation (segment-based, byproduct physics)
│   ├── theme.js                ← colors (copper A/cobalt B, green oligomer), segmentColor
│   ├── ui.js                   ← extends UIBase, A/B sliders, presets, stage badges
│   ├── main.js                 ← RAF loop + semi-log DP-vs-conversion Carothers chart
│   └── bundle.js               ← concatenated bundle for file://
├── crosslink/
│   ├── index.html              ← crosslinking sim (3 stage badges, 4 application presets)
│   ├── simulation.js           ← Mayo-Lewis copolymer + bifunctional crosslinker bridging AA
│   ├── theme.js                ← colors (blue M₁/orange M₂/amber XL/rose bridges), segmentColor
│   ├── ui.js                   ← extends UIBase, XL amount/rate sliders, PSA/SAP/hard-coat/hydrogel presets
│   ├── main.js                 ← RAF loop + crosslink bridge rendering + XL density diagram + lab journal
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

- **Renderer** (`lib/renderer.js`) — Takes a `theme` object at construction: `{ bgColor, colors, radii, glowColors, segmentColor }`. Features:
  - Subtle grid (40px, `rgba(255,255,255,0.03)`)
  - Bond lines drawn between chain segments (varies by type: chainRadical=0.4α, oligomer=0.35α, deadChain=0.2α)
  - `draw(particles)` does full rendering with segmentColor callbacks
  - `drawCallout(title, drawFn)` — auto-hides after 2500ms
  - `_scheduleCalloutClear()`, `dispose()` for cleanup
  - `devicePixelRatio` scaling, `ResizeObserver` on canvas container

- **UIBase** (`lib/ui-base.js`) — Callback system (`on`/`_cb`), `bindButton`, `bindSlider`, `setSliderValue(id, valueId, value, format)`, `setReadoutSpec`/`updateReadouts`, `setBadge`. Base `_getParams()` returns `{}` — subclasses override.

**Per-sim directories:**

- **simulation.js** — Pure state machine. Owns the particle array. `tick(dt)` runs one timestep. Exposes `getState()`, `reset()`, `setParams()`. Calls `setCanvasSize(w, h)` for renderer coordination.
- **theme.js** — Exports `THEME` object with all visual constants.
- **ui.js** — Extends `UIBase`, wires sim-specific DOM elements and stage badges.
- **main.js** — `requestAnimationFrame` loop, wires UI callbacks to sim methods, renders charts/diagrams.

## Simulations

### Free-Radical Polymerization

Chain-growth: initiation (I₂ → 2I• → RM•), propagation (RM• + M → R-M•), termination (combination or disproportionation at 50/50). Chain movement uses the **Rouse bead-spring model**: every segment gets independent Brownian kicks, adjacent segments connected by harmonic springs (target distance 10px). This replaces the old "head-led" model — CM diffusion ∝ 1/N emerges naturally rather than being hand-tuned.

| Constant | Default | Meaning |
|----------|---------|---------|
| kd | 25.0 × rate | Initiator decomposition probability per second |
| kp | 12.5 × rate | Propagation probability |
| kt | 3.75 × rate | Termination probability |
| rate multiplier | 5.0 | Global scalar for all k values |
| speed | 10.0 | Simulation speed multiplier (range 0.25–30) |

Particle types: `initiator`, `primaryRadical`, `monomer`, `chainRadical`, `deadChain`

Stats: conversion, Mn, Mw, PDI, activeChains, deadChains, freeMonomers. Mn = ΣDP/nDead, Mw = ΣDP²/ΣDP, PDI = Mw/Mn.

**UI features:**

- Three **stage badges** (Initiation / Propagation / Termination) — driven by `updateStageBadges(stats)` in ui.js
- **Kinetics chart** overlay — conversion-vs-time with theoretical first-order fit (kEff = -ln(1-p)/t), rendered top-right on main canvas
- **Lab journal** — event log panel (`#lab-journal-list`) showing last 5 reaction events in reverse-chronological order, color-coded: init=yellow, prop=teal, term=red
- Conversion history sampled every 0.1 sim-seconds, max 250 points
- Callout events for initiation, radical capture, propagation, and termination with rich drawFns

### Copolymerization

Mayo-Lewis kinetics with two monomer types: M₁ (2EHA, blue) and M₂ (AA, orange).

```text
Head=M₁: P(add M₁) = r₁[M₁] / (r₁[M₁] + [M₂])
Head=M₂: P(add M₁) =  [M₁] / ( [M₁] + r₂[M₂])
```

Default: 950/50 (95/5) 2EHA/AA feed, r₁=0.35, r₂=2.5 (Q-e estimates). r₁·r₂ ≈ 0.875 (near-ideal, random). No azeotrope in physical range — AA preferentially incorporates at all feed ratios.

| Parameter | Default | Meaning |
|-----------|---------|---------|
| r₁ | 0.35 | M₁ reactivity ratio (k₁₁/k₁₂) |
| r₂ | 2.5 | M₂ reactivity ratio (k₂₂/k₂₁) |
| kd | 25.0 × rate | Initiator decomposition |
| kp (capture) | 12.5 × rate | Primary radical monomer capture |
| kp | 12.5 × rate | Propagation probability (distance-limited encounter) |
| kt | 3.75 × rate | Termination |
| rate multiplier | 5.0 | Global scalar |
| speed | 10.0 | Simulation speed (0.25–30) |
| alternating | false | Strict ABABAB pattern (checkbox) |
| chain transfer Ct | 0 | Fraction (0–0.5), P* + S → P(dead) + S* |

Particle types: `initiator`, `primaryRadical`, `monomerA`, `monomerB`, `chainRadical`, `deadChain`. Segments carry `monomerType: 0|1`. Chain radicals store initiator residual position (`p.initiator`). Chain transfer uses temporary `_ct_dead` type, promoted to `deadChain` at end of tick.

Stats: conversion, Mn (consumed/deadChains), activeChains, deadChains, freeMonomerA, freeMonomerB, cumulativeF₁, instantaneousF₁ (sliding window with 0.95 decay).

**UI features:**

- **Presets**: 2EHA/AA (r₁=0.35, r₂=2.5), Ideal (r₁=r₂=1), Alternating (r₁=r₂=0.01), Styrene/AN (r₁=0.40, r₂=0.04)
- **Alternating checkbox** — bypasses Mayo-Lewis, always adds opposite type (ABABAB)
- **Chain transfer slider** (0–0.5, step 0.01)
- **Mayo-Lewis composition diagram** — live f₁ vs F₁ plot on `<canvas id="diagram-canvas">` (240×200), orange Mayo-Lewis curve, dashed diagonal reference, crosshair at current (f₁, F₁) scaling with conversion

### Step-Growth Condensation

AA + BB condensation. Two monomers (diamine A, diacid B) each with 2 functional end-groups. Any particle with free ends reacts with any other — chains **merge** (not extend). B segments reversed on merge to maintain alternating pattern. Byproduct (H₂O) particles have physics: rise upward, age, and fade.

| Parameter | Default | Meaning |
|-----------|---------|---------|
| k | 8.0 × rate | Reaction probability per second |
| rate multiplier | 5.0 | Global scalar (0.5–20 range) |
| speed | 10.0 | Simulation speed (0.25–30) |
| monomer A count | 500 | Diamine (AA) molecules (100–2000) |
| monomer B count | 500 | Diacid (BB) molecules (100–2000) |

Particle types: `monomerA`, `monomerB`, `oligomer`, `byproduct`. Even single monomers have `segments: [{ x, y, monomerType }]`. `_freeA(p)` and `_freeB(p)` count functional end-groups from segment ends. Byproduct particles stored in separate `_byproductParticles` list, merged in `getState()`.

Stats: conversion (p = consumed groups / total groups), DP, chain count, freeMonomerA/B, byproductCount (total bonds), maxDP (Carothers: (1+r)/(1-r) at p→1). DP history sampled every 10 ticks (200-point cap, decimates by 2× when full).

**UI features:**

- **Four stage badges** (Monomers / Reacting / Chains / Saturated) — p-based thresholds
- **Presets**: Equal A/B, Nylon-6,6 (balanced), B in Excess (MW limited: 500 A / 700 B, r=0.71, max DP≈6), A in Excess (MW limited: 700 A / 500 B, r=0.71)
- **Carothers chart** — persistent callout showing DP vs conversion on semi-log axes: theoretical curve (teal, 1/(1-p)) and actual curve (copper, from sim); current values annotated

### Crosslinking Polymerization

2EHA/AA copolymer (Mayo-Lewis, r₁=0.35, r₂=2.5) with concurrent bifunctional crosslinker bridging. Crosslinker molecules (amber) react with -COOH groups on AA (M₂) units across **different** chains, forming a polymer network. Three-stage progression: Copolymerization → Crosslinking → Gelation.

| Parameter | Default | Meaning |
|-----------|---------|---------|
| r₁ | 0.35 | M₁ reactivity ratio (k₁₁/k₁₂) |
| r₂ | 2.5 | M₂ reactivity ratio (k₂₂/k₂₁) |
| kd | 25.0 × rate | Initiator decomposition |
| kp (capture) | 12.5 × rate | Primary radical monomer capture |
| kp | 12.5 × rate | Propagation probability |
| kt | 3.75 × rate | Termination |
| crosslinker amount | 1% | Crosslinker count as % of AA monomer count (0–50) |
| crosslink rate | 0.5 | Crosslink attachment probability per encounter |
| rate multiplier | 5.0 | Global scalar |
| speed | 10.0 | Simulation speed (0.25–30) |

Particle types: `initiator`, `primaryRadical`, `monomerA`, `monomerB`, `crosslinker`, `chainRadical`, `deadChain`. Each chain gets a persistent `chainId`. Crosslinks tracked as `{ aChainId, aSegIdx, bChainId, bSegIdx }` — survives particle array reshuffling. AA segments carry `isCrosslinked: bool` for visual distinction (orange → rose).

Chain movement uses the **Rouse bead-spring model** (D₀=2.0, springK=0.15, springPasses=2). Crosslinked segments connected by additional weak springs (0.3× intra-chain springK) pulling bridged chains toward each other.

Gel point detected via Union-Find on the crosslink graph: largest connected component > 50% of all chains → gel point latched permanently.

Stats: conversion, Mn, Mw, PDI, activeChains, deadChains, freeMonomerA, freeMonomerB, crosslinkDensity (% of AA crosslinked), crosslinkedAA, totalAAinChains, networkChains, gelPointReached.

**UI features:**

- **Four application presets**: PSA (1% XL — tape/sticky notes), SAP (10% XL — diapers/water retention), Hard Coating (30% XL — automotive clear coat), Hydrogel (5% XL — drug delivery/wound dressings)
- **Three stage badges** (Copolymerization / Crosslinking / Gelation) — xlDensity-based thresholds with gel point override
- **Crosslink density diagram** — live crosslink density vs conversion on `<canvas id="diagram-canvas">` (240×200), rose curve, gel point dashed line
- **Lab journal** — last 6 events in reverse-chronological order, color-coded: init=yellow, prop=teal, term=red, xlink=rose
- **Crosslink bridge rendering** — rose gradient lines with glow connecting crosslinked AA segments, diamond endpoints
- Crosslinked AA segments rendered in rose (vs orange for uncrosslinked) via `segmentColor(monomerType, chainType, segment)` callback

## Bundles

Each sim's `bundle.js` is concatenated source (not minified). Order: `lib/renderer.js` → `lib/ui-base.js` → `simulation.js` → `theme.js` → `ui.js` → `main.js`. `export`/`import` keywords stripped via `sed`. When editing, modify individual source files, then regenerate the bundle.

Per-directory `_build.ps1` scripts automate this:

```text
copolymer/_build.ps1
free-radical/_build.ps1
step-growth/_build.ps1
crosslink/_build.ps1
```

## Coding conventions

- No external JS dependencies. Web fonts (Google Fonts DM Mono + DM Sans via CSS `@import`) are acceptable
- ES module syntax in source files (`export class`, `import from`)
- CSS custom properties in `:root` — copper/cobalt/amber/rose on deep navy (`--bg-deep: #0d1117`)
- Particle state is mutated in place — no immutability
- `dt` is clamped to max 0.1s to avoid physics explosions on tab-away
- Canvas uses `devicePixelRatio` scaling for sharp rendering
- `lib/` classes are generic; sim-specific logic stays in sim directories
- Theme objects define all visual constants — no hardcoded colors in renderer
- Callout events use `{ title, drawFn(ctx, w, h) }` shape
- All four sims share the same chain mobility model: `1/√(1 + (n-1)·0.3)`

## Session workflow

- `/resume` — run at session start. Reads CLAUDE.md, CHANGELOG.md, session memory, and git status.
- `/close-session` — run at session end. Updates CLAUDE.md, saves session memory, logs to CHANGELOG.md, commits and pushes.

Session memory: `~/.claude/projects/polymer-simulation/memory/`
