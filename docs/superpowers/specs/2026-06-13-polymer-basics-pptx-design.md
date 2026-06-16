# Polymer Basics Presentation — Design Spec

**Date:** 2026-06-13
**Status:** Approved
**Output:** `Polymer-Simulation-Lab.pptx` (overwrite existing May 2026 version)

## Overview

A 17-slide, self-contained PowerPoint presentation that explains the basics of polymerization using screenshots and content from the Polymer Simulation Lab website. Designed for a mixed audience (general science outreach) — heavy on visuals and real-world applications, light on equations. Ends with a "try it yourself" CTA linking to the simulators.

## Audience & Style

- **Audience:** Mixed — curious general public, high school students, science outreach events
- **Tone:** Accessible, visual, application-driven. No prior chemistry knowledge assumed.
- **Integration:** Standalone with screenshots. Website URL + QR code at the end. No live switching.
- **Length:** ~17 slides, ~12-15 minutes

## Visual System

**Style:** "Scientific Textbook" — light, clean, structured with warm off-white backgrounds.

| Element | Choice |
|---------|--------|
| Background (content slides) | Warm off-white `#F8F6F0` |
| Background (title/closer) | Deep navy `#0B0E17` |
| Primary (headings, section markers) | Slate blue `#2C5F7C` |
| Accent (callouts, key numbers, rule) | Copper `#D97742` — links back to website Mineral Lab brand |
| Body text (content slides) | Charcoal `#2D2D2D` |
| Body text (dark slides) | Warm white `#ECE8E0` |
| Header font | Georgia (serif), 36-40pt titles |
| Body font | Calibri (sans-serif), 15-16pt body, 11pt captions |
| Visual motif | Thin copper horizontal rule beneath each title |
| Sim color dots | Teal (free-radical), blue (copolymer), amber-green (step-growth), rose (crosslinking) |

### Color Palette

```
Background (light): #F8F6F0
Background (dark):  #0B0E17
Primary:            #2C5F7C
Accent/Copper:      #D97742
Body (light bg):    #2D2D2D
Body (dark bg):     #ECE8E0
Free-Radical dot:   #4ECDC4 (teal)
Copolymer dot:      #4DA6FF (blue)
Step-Growth dot:    #D9A040 (amber)
Crosslinking dot:   #FF4499 (rose/ hot pink)
```

## Slide-by-Slide Breakdown

### Act 1: What Are Polymers? (Slides 1–4)

**1. Title Slide**
- Layout: Full-bleed dark background `#0B0E17`
- Content: "Polymer Science: An Interactive Introduction" (40pt Georgia, `#ECE8E0`), subtitle "Understanding how molecules become materials", thin copper rule
- No screenshot

**2. What Is a Polymer?**
- Layout: 2-column (text left, diagram right)
- Content: "Many repeat units" concept. Monomer → Polymer chain visual. Everyday examples listed: DNA, plastic bottles, rubber tires, proteins. Icon for each.
- Visual: Simple monomer-to-polymer diagram (text-based shapes in PPTX)

**3. Why Polymers Matter**
- Layout: 2×2 grid of application cards
- Content: Medicine (drug delivery systems), Materials (lightweight composites), Sustainability (biodegradable plastics), Everyday (adhesives, coatings, packaging)
- Each card: icon in slate-blue circle, bold header, 1-line description

**4. Two Big Families**
- Layout: Side-by-side comparison columns
- Content: Chain-growth (one monomer at a time, active chain end) vs Step-growth (any two molecules with complementary ends). Simple diagram for each.
- Visual: Diverging-arrows diagram showing the conceptual difference

### Act 2: Chain-Growth (Slides 5–8)

**5. Free-Radical Polymerization**
- Layout: 2-column (mechanism text left, sim screenshot right)
- Content: 3-stage mechanism — Initiation (I₂ → 2I•), Propagation (chain grows), Termination (two chains stop). Stage badges shown visually.
- Sim color dot: Teal `#4ECDC4`
- Screenshot: Free-radical sim mid-reaction showing particles

**6. Inside the Free-Radical Simulator**
- Layout: Large screenshot with annotation overlay callouts
- Content: What you're seeing — yellow initiators decomposing, teal chain radicals growing, gray dead chains, monomers as small dots. Mn/Mw/PDI readouts explained in plain language.
- Screenshot: Free-radical sim with visible chain activity

**7. Copolymerization — Two Monomers**
- Layout: 2-column (explanation left, screenshot right)
- Content: Two building blocks (2EHA = soft/flexible, AA = hard/polar). "Who adds to whom?" — Mayo-Lewis concept in plain language: each chain end prefers one monomer over the other. Blue M₁ / orange M₂ color coding.
- Sim color dot: Blue `#4DA6FF`
- Screenshot: Copolymer sim showing both monomer types and the Mayo-Lewis diagram

**8. Tuning Material Properties**
- Layout: 3-column cards
- Content: How changing the monomer ratio changes the final material. Reference the sim's preset examples (95/5 2EHA/AA, 50/50, etc.). Soft and sticky vs hard and rigid.
- Visual: Gradient bar showing the property spectrum

### Act 3: Step-Growth & Crosslinking (Slides 9–13)

**9. Step-Growth Polymerization**
- Layout: 2-column (explanation left, screenshot right)
- Content: AA + BB → polymer + H₂O. "Any molecule can react with any other" — no initiators needed. Carothers equation explained visually (need >99% conversion for high MW). The DP-vs-conversion chart.
- Sim color dot: Amber `#D9A040`
- Screenshot: Step-growth sim showing copper/cobalt alternating segments, byproduct H₂O particles

**10. Nylon & Step-Growth Materials**
- Layout: 2×2 grid of real-world examples
- Content: Nylon-6,6 (fibers), PET (bottles), Polycarbonate (eyeglasses), Kevlar (body armor). Brief note on stoichiometric control — "dial in the molecular weight by adjusting the ratio."
- Visual: Icons for each material

**11. Crosslinking — Building a Network**
- Layout: 2-column (explanation left, screenshot right)
- Content: Chains + bifunctional crosslinker → 3D network. "Bridges between chains turn a liquid resin into a solid." Crosslinked AA segments turn hot pink. The network tightens over time.
- Sim color dot: Rose `#FF4499`
- Screenshot: Crosslink sim showing hot pink crosslink bridges and crosslinked AA segments

**12. Crosslinking in the Real World**
- Layout: 4 cards in 2×2 grid
- Content: PSA — sticky notes/tape (1% XL), SAP — diapers/water absorption (10% XL), Hard Coatings — automotive clear coat (30% XL), Hydrogels — wound dressings/drug delivery (5% XL)
- Each card: application name, crosslink %, icon, real-world example

**13. The Gel Point**
- Layout: Diagram-focused slide
- Content: "The moment everything connects." Before/after gel point visual. Small clusters → one giant connected network. Why this matters for manufacturing and material design.

### Act 4: Platform & Try It (Slides 14–17)

**14. The Polymer Simulation Lab**
- Layout: 4 cards in a row
- Content: All 4 simulators with icons, one-line descriptions, and per-sim colored dots. "Four interactive experiments in your browser."
- Visual: Card grid with accent dots matching each sim

**15. How It's Built**
- Layout: 3-column with icons
- Content: (1) Zero Dependencies — vanilla JS, no frameworks, (2) Canvas 2D — hardware-accelerated, 60fps, (3) Modular — shared lib/ + per-sim directories, easy to extend
- Visual: Icons in slate-blue circles above each column

**16. Try It Yourself**
- Layout: Dark slide, centered content
- Content: Large QR code, URL, "Open in any browser. No install. No signup. Start experimenting."
- Screenshot: None — QR code is the visual

**17. Thank You / Q&A**
- Layout: Full-bleed dark, centered
- Content: "Thank You" — subtitle "Questions?", website URL, copper rule
- No screenshot

## Screenshot Plan

Screenshots to capture from the live simulators at `http://localhost:8765`:

| Slide | Sim | What to capture |
|-------|-----|-----------------|
| 5 | free-radical/ | Mid-reaction with visible chains, initiators, monomers |
| 6 | free-radical/ | Close-up with stage badges lit, readouts visible |
| 7 | copolymer/ | Both monomer types visible, Mayo-Lewis diagram active |
| 9 | step-growth/ | Copper/cobalt chains, byproduct H₂O visible |
| 11 | crosslink/ | Hot pink crosslink bridges between chains |
| 14 | index.html | Landing page with all 4 sim cards |

## Implementation

Built with **pptxgenjs** (create from scratch — no template). Output: overwrites existing `Polymer-Simulation-Lab.pptx` in project root.

### Build Steps

1. Create PPTX with pptxgenjs using the visual system defined above
2. Capture screenshots from live simulators (running at localhost)
3. Place screenshots into slides
4. QA: markitdown text extraction, visual inspection (thumbnail conversion)
5. Fix issues, re-verify

## Deferred (Not in Scope)

- Embedded video/GIF of simulations
- Speaker notes for each slide
- Chinese language version
- Google Slides / non-PPTX export
