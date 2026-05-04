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
