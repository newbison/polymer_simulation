## 2026-05-05

- Complete frontend redesign with "Mineral Lab" aesthetic (copper + cobalt on deep navy)
- Landing page: animated particle background, staggered entrance animations, redesigned sim cards
- Sim pages: observation-window canvas frame, glass-morphism panels, custom copper sliders, pill badges
- Typography: DM Mono (UI) + DM Sans (display) via Google Fonts
- Installed top 20 skills from skills.sh marketplace

## 2026-05-04

- Added chain-length-dependent mobility: polymers slow down as they grow (diffusion physics)
- Added CLAUDE.md with full project documentation
- Reduced default monomer count to 1000 (was 5000 in HTML slider)
- Added `/resume` and `/close-session` skills for session continuity
- Published to GitHub
- **Multi-sim platform:** extracted shared lib/ with generic Renderer (theme-parameterized) and UIBase class
- **Copolymerization simulator:** Mayo-Lewis kinetics with two monomer types (M₁=2EHA/blue, M₂=AA/orange), reactivity ratios from Q-e estimates (r₁=0.35, r₂=2.5), 95/5 default feed, composition drift tracking, 4 presets
- **Landing page** at root with sim cards linking to each simulator
- Free-radical sim restructured into free-radical/ directory
- Speed default increased to 10× (max 30×), monomer counts pinned at init time for stats accuracy
