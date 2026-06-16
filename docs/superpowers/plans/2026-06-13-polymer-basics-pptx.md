# Polymer Basics PPTX — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a 17-slide "Polymer Science: An Interactive Introduction" PPTX using pptxgenjs, with screenshots from the live Polymer Simulation Lab website.

**Architecture:** Single Node.js script (`scripts/build-polymer-pptx.js`) using pptxgenjs to build all 17 slides. Screenshots captured via browser-use from running simulators. Output overwrites `Polymer-Simulation-Lab.pptx` in project root.

**Tech Stack:** Node.js + pptxgenjs, browser-use CLI for screenshots

---

### Task 1: Setup & Verify Prerequisites

**Files:**
- Create: `scripts/build-polymer-pptx.js` (scaffold only — imports and constants)

- [ ] **Step 1: Install pptxgenjs globally**

Run: `npm install -g pptxgenjs`
Expected: pptxgenjs installed without errors

- [ ] **Step 2: Verify the simulation server is running**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8765/`
Expected: `200`
If not running, start with: `cd d:/coding_is_fun/polymer_simulation && python -m http.server 8765 &`

- [ ] **Step 3: Verify browser-use is available**

Run: `browser-use doctor 2>&1 | head -5`
Expected: Shows CLI version, no critical errors. If unavailable, install per browser-use skill instructions.

- [ ] **Step 4: Create scaffold script with visual constants**

Write `scripts/build-polymer-pptx.js`:

```javascript
const pptxgen = require("pptxgenjs");

// ── Color Palette ──
const C = {
  bgLight:     "F8F6F0",
  bgDark:      "0B0E17",
  primary:     "2C5F7C",
  copper:      "D97742",
  bodyDark:    "2D2D2D",
  bodyLight:   "ECE8E0",
  // Sim accent dots
  dotRadical:  "4ECDC4",
  dotCopolymer:"4DA6FF",
  dotStep:     "D9A040",
  dotCrosslink:"FF4499",
  // Card backgrounds
  cardBg:      "FFFFFF",
  mutedText:   "7F8C8D",
};

// ── Font Constants ──
const F = {
  title: "Georgia",
  body: "Calibri",
};

// ── Slide dimensions (LAYOUT_16x9: 10" × 5.625") ──
const SW = 10;
const SH = 5.625;
const MARGIN = 0.6;
const CONTENT_W = SW - 2 * MARGIN;

// ── Helper: thin copper rule under title ──
function addCopperRule(slide, y) {
  slide.addShape("rect", {
    x: MARGIN, y, w: 1.2, h: 0.03,
    fill: { color: C.copper },
  });
}

// ── Helper: dark slide background ──
function darkSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: C.bgDark };
  return slide;
}

// ── Helper: light slide background ──
function lightSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: C.bgLight };
  return slide;
}

// ── Helper: sim color dot ──
function addSimDot(slide, x, y, color, size = 0.18) {
  slide.addShape(pres.shapes.OVAL, {
    x, y, w: size, h: size,
    fill: { color },
  });
}
// Wait — pres isn't available in helpers. Move helpers inside the build function.

console.log("Scaffold ready — helpers and constants defined.");
```

- [ ] **Step 5: Commit scaffold**

```bash
git add scripts/build-polymer-pptx.js
git commit -m "chore: scaffold pptx build script with color constants"
```

---

### Task 2: Capture Screenshots from Live Simulators

**Files:**
- Create: `scripts/screenshots/` directory

- [ ] **Step 1: Create screenshots directory**

Run: `mkdir -p d:/coding_is_fun/polymer_simulation/scripts/screenshots`

- [ ] **Step 2: Start the simulation server (if not already running)**

Run: `cd d:/coding_is_fun/polymer_simulation && python -m http.server 8765 &`

- [ ] **Step 3: Capture free-radical screenshot (Slide 5)**

Run:
```bash
browser-use open http://localhost:8765/free-radical/ && \
sleep 1 && \
browser-use click 5 && \
sleep 3 && \
browser-use screenshot scripts/screenshots/free-radical.png
```
The `click 5` target may vary — first run `browser-use state` to find the Play button index.

- [ ] **Step 4: Capture free-radical close-up screenshot (Slide 6)**

Let the simulation run longer for visible chains:
```bash
sleep 5 && \
browser-use screenshot scripts/screenshots/free-radical-closeup.png
```

- [ ] **Step 5: Capture copolymer screenshot (Slide 7)**

```bash
browser-use open http://localhost:8765/copolymer/ && \
sleep 1 && \
# Find Play button index from state, then click it
browser-use state && \
# (note the Play button index, then:)
browser-use click <play-index> && \
sleep 4 && \
browser-use screenshot scripts/screenshots/copolymer.png
```

- [ ] **Step 6: Capture step-growth screenshot (Slide 9)**

```bash
browser-use open http://localhost:8765/step-growth/ && \
sleep 1 && \
browser-use state && \
browser-use click <play-index> && \
sleep 4 && \
browser-use screenshot scripts/screenshots/step-growth.png
```

- [ ] **Step 7: Capture crosslink screenshot (Slide 11)**

```bash
browser-use open http://localhost:8765/crosslink/ && \
sleep 1 && \
browser-use state && \
browser-use click <play-index> && \
sleep 8 && \
browser-use screenshot scripts/screenshots/crosslink.png
```
Note: crosslink sim needs more time (~8s) for visible crosslink bridges to form.

- [ ] **Step 8: Capture landing page screenshot (Slide 14)**

```bash
browser-use open http://localhost:8765/ && \
sleep 1 && \
browser-use screenshot scripts/screenshots/landing.png
```

- [ ] **Step 9: Verify all screenshots exist**

Run: `ls -la d:/coding_is_fun/polymer_simulation/scripts/screenshots/`
Expected: 6 PNG files with non-zero sizes.

- [ ] **Step 10: Commit screenshots**

```bash
git add scripts/screenshots/
git commit -m "feat: capture screenshots from all 4 simulators for PPTX"
```

---

### Task 3: Build the Complete PPTX Script

**Files:**
- Modify: `scripts/build-polymer-pptx.js`

This task writes the entire slide-building script. Each substep adds one act's slides.

- [ ] **Step 1: Rewrite scaffold with full structure**

Overwrite `scripts/build-polymer-pptx.js` with the complete script below:

```javascript
const pptxgen = require("pptxgenjs");
const path = require("path");

const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

// ── Color Palette ──
const C = {
  bgLight:     "F8F6F0",
  bgDark:      "0B0E17",
  primary:     "2C5F7C",
  copper:      "D97742",
  bodyDark:    "2D2D2D",
  bodyLight:   "ECE8E0",
  cardBg:      "FFFFFF",
  mutedText:   "7F8C8D",
  dotRadical:  "4ECDC4",
  dotCopolymer:"4DA6FF",
  dotStep:     "D9A040",
  dotCrosslink:"FF4499",
  cardBorder:  "E8E4DB",
};

// ── Font Constants ──
const F = {
  title: "Georgia",
  body: "Calibri",
};

// ── Slide dimensions (LAYOUT_16x9: 10" × 5.625") ──
const SW = 10;
const SH = 5.625;
const MX = 0.7;  // margin
const CW = SW - 2 * MX;  // content width

// ── Helpers ──
function addCopperRule(slide, x, y, w) {
  slide.addShape(slide._pres.shapes.RECTANGLE, {
    x, y, w: w || 1.0, h: 0.025,
    fill: { color: C.copper },
  });
}

function addTitle(slide, text, y) {
  slide.addText(text, {
    x: MX, y: y || 0.35, w: CW, h: 0.6,
    fontSize: 32, fontFace: F.title, color: C.primary, bold: true,
    margin: 0,
  });
  addCopperRule(slide, MX, (y || 0.35) + 0.58, 1.0);
}

function addBody(slide, textArray, x, y, w, fontSize, lineSpacing) {
  slide.addText(textArray, {
    x: x || MX, y: y || 1.2, w: w || CW, h: SH - (y || 1.2) - 0.4,
    fontSize: fontSize || 15, fontFace: F.body, color: C.bodyDark,
    paraSpaceAfter: lineSpacing || 8,
    margin: 0,
  });
}

function addCard(slide, x, y, w, h, title, body, accentColor) {
  // Card background
  slide.addShape(slide._pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: C.cardBg },
    shadow: { type: "outer", blur: 4, offset: 2, angle: 135, color: "000000", opacity: 0.08 },
  });
  // Left accent bar
  slide.addShape(slide._pres.shapes.RECTANGLE, {
    x, y, w: 0.05, h,
    fill: { color: accentColor || C.primary },
  });
  // Card title
  slide.addText(title, {
    x: x + 0.2, y: y + 0.12, w: w - 0.35, h: 0.35,
    fontSize: 14, fontFace: F.title, color: accentColor || C.primary, bold: true,
    margin: 0,
  });
  // Card body
  slide.addText(body, {
    x: x + 0.2, y: y + 0.45, w: w - 0.35, h: h - 0.6,
    fontSize: 12, fontFace: F.body, color: C.bodyDark,
    margin: 0,
  });
}

function addSimScreenshot(slide, filename, x, y, w, h) {
  const filePath = path.join(SCREENSHOT_DIR, filename);
  try {
    slide.addImage({ path: filePath, x, y, w, h, sizing: { type: "contain", w, h } });
  } catch (e) {
    slide.addShape(slide._pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: "EEEEEE" } });
    slide.addText("[Screenshot]", { x, y, w, h, fontSize: 11, color: C.mutedText, align: "center", valign: "middle" });
  }
}

// ── Build Presentation ──
async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Polymer Simulation Lab";
  pres.title = "Polymer Science: An Interactive Introduction";

  // Store pres reference for helpers that need shapes
  // (We'll inject it into helpers by redefining them inside build or passing pres)

  // ══════════════════════════════════════════
  // ACT 1: WHAT ARE POLYMERS? (Slides 1–4)
  // ══════════════════════════════════════════

  // ── Slide 1: Title ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgDark };
    // Title
    s.addText("Polymer Science:", {
      x: MX, y: 1.4, w: CW, h: 0.9, fontSize: 42, fontFace: F.title,
      color: C.bodyLight, bold: true, margin: 0,
    });
    s.addText("An Interactive Introduction", {
      x: MX, y: 2.2, w: CW, h: 0.8, fontSize: 36, fontFace: F.title,
      color: C.copper, bold: false, margin: 0,
    });
    // Copper rule
    addCopperRule(s, MX, 3.15, 2.0);
    // Subtitle
    s.addText("Understanding how molecules become materials", {
      x: MX, y: 3.5, w: CW, h: 0.5, fontSize: 16, fontFace: F.body,
      color: C.mutedText, margin: 0,
    });
    // Footer
    s.addText("Polymer Simulation Lab  ·  2026", {
      x: MX, y: 4.8, w: CW, h: 0.4, fontSize: 11, fontFace: F.body,
      color: "5A5865", margin: 0,
    });
  }

  // ── Slide 2: What Is a Polymer? ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    addTitle(s, "What Is a Polymer?");

    // Left column: text
    const leftX = MX, leftW = 5.0;
    s.addText([
      { text: '"Many repeat units"', options: { fontSize: 18, fontFace: F.title, color: C.copper, breakLine: true } },
      { text: "", options: { fontSize: 10, breakLine: true } },
      { text: "A polymer is a long chain molecule made by linking together many smaller molecules called ", options: { fontSize: 15, breakLine: false } },
      { text: "monomers", options: { fontSize: 15, bold: true, breakLine: false } },
      { text: ".", options: { fontSize: 15, breakLine: true } },
      { text: "", options: { fontSize: 10, breakLine: true } },
      { text: "Everyday examples:", options: { fontSize: 13, fontFace: F.title, color: C.primary, bold: true, breakLine: true } },
      { text: "🧬  DNA — nature's polymer, stores genetic code", options: { fontSize: 14, breakLine: true } },
      { text: "🧴  Plastic bottles — polyethylene terephthalate (PET)", options: { fontSize: 14, breakLine: true } },
      { text: "🚗  Rubber tires — natural and synthetic elastomers", options: { fontSize: 14, breakLine: true } },
      { text: "💪  Proteins — amino acid chains that build your body", options: { fontSize: 14, breakLine: false } },
    ], {
      x: leftX, y: 1.2, w: leftW, h: 4.0,
      fontFace: F.body, color: C.bodyDark, margin: 0,
    });

    // Right column: monomer → polymer diagram (built with shapes)
    const rightX = 6.0, rightW = 3.4;
    // Diagram box
    s.addShape(pres.shapes.RECTANGLE, { x: rightX, y: 1.2, w: rightW, h: 3.8, fill: { color: C.cardBg } });

    // Monomers (small circles in a row)
    const circleY = 2.2, circleR = 0.25, circleGap = 0.55, startX = rightX + 0.5;
    for (let i = 0; i < 5; i++) {
      s.addShape(pres.shapes.OVAL, {
        x: startX + i * circleGap, y: circleY, w: circleR * 2, h: circleR * 2,
        fill: { color: "E8D5B7" },
      });
      s.addText("M", {
        x: startX + i * circleGap, y: circleY, w: circleR * 2, h: circleR * 2,
        fontSize: 9, fontFace: F.body, color: C.bodyDark, align: "center", valign: "middle",
      });
    }
    // Arrow
    s.addText("→", { x: rightX + 0.1, y: 2.7, w: 3.2, h: 0.35, fontSize: 16, align: "center", color: C.copper });

    // Polymer chain (connected circles)
    const chainY = 3.1;
    for (let i = 0; i < 5; i++) {
      s.addShape(pres.shapes.OVAL, {
        x: startX + i * circleGap, y: chainY, w: circleR * 2, h: circleR * 2,
        fill: { color: C.copper },
      });
    }
    // Connecting lines between circles
    for (let i = 0; i < 4; i++) {
      s.addShape(pres.shapes.LINE, {
        x: startX + i * circleGap + circleR * 2, y: chainY + circleR,
        w: circleGap - circleR * 2, h: 0,
        line: { color: C.copper, width: 2 },
      });
    }
    // Label
    s.addText("monomers  →  polymer chain", {
      x: rightX, y: 3.7, w: rightW, h: 0.35, fontSize: 11, fontFace: F.body,
      color: C.mutedText, align: "center", margin: 0,
    });
    // Caption
    s.addText("A polymer is a chain of repeating monomer units", {
      x: rightX, y: 4.3, w: rightW, h: 0.35, fontSize: 11, fontFace: F.body,
      color: C.primary, align: "center", italic: true, margin: 0,
    });
  }

  // ── Slide 3: Why Polymers Matter ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    addTitle(s, "Why Polymers Matter");

    const cardW = (CW - 0.3) / 2;
    const cardH = 1.6;
    const startY = 1.3;
    const gapX = 0.3;
    const gapY = 0.25;

    const apps = [
      { title: "Medicine", body: "Drug delivery systems, biodegradable sutures, contact lenses, and tissue engineering scaffolds.", icon: "💊", color: C.primary },
      { title: "Materials", body: "Lightweight composites for aircraft, carbon fiber, bulletproof vests. Stronger than steel at a fraction of the weight.", icon: "✈️", color: C.copper },
      { title: "Sustainability", body: "Biodegradable plastics from corn starch, recycled PET bottles into clothing, water-soluble packaging.", icon: "🌱", color: C.dotStep },
      { title: "Everyday Life", body: "Adhesives, paints, phone cases, clothing fibers, non-stick cookware. Polymers are everywhere.", icon: "🏠", color: C.dotRadical },
    ];

    apps.forEach((app, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = MX + col * (cardW + gapX);
      const cy = startY + row * (cardH + gapY);

      // Card bg
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: cy, w: cardW, h: cardH,
        fill: { color: C.cardBg },
        shadow: { type: "outer", blur: 3, offset: 1, angle: 135, color: "000000", opacity: 0.06 },
      });
      // Left accent
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: cy, w: 0.05, h: cardH,
        fill: { color: app.color },
      });
      // Icon
      s.addText(app.icon, {
        x: cx + 0.2, y: cy + 0.15, w: 0.5, h: 0.5,
        fontSize: 28, align: "center", valign: "middle", margin: 0,
      });
      // Title
      s.addText(app.title, {
        x: cx + 0.75, y: cy + 0.15, w: cardW - 1.0, h: 0.35,
        fontSize: 15, fontFace: F.title, color: app.color, bold: true, margin: 0,
      });
      // Body
      s.addText(app.body, {
        x: cx + 0.2, y: cy + 0.65, w: cardW - 0.5, h: 0.8,
        fontSize: 12, fontFace: F.body, color: C.bodyDark, margin: 0,
      });
    });
  }

  // ── Slide 4: Two Big Families ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    addTitle(s, "Two Big Families of Polymerization");

    const colW = (CW - 0.5) / 2;
    const colY = 1.3;

    // Left column: Chain-Growth
    s.addShape(pres.shapes.RECTANGLE, {
      x: MX, y: colY, w: colW, h: 3.6,
      fill: { color: C.cardBg },
      shadow: { type: "outer", blur: 3, offset: 1, angle: 135, color: "000000", opacity: 0.06 },
    });
    s.addText("Chain-Growth", {
      x: MX + 0.2, y: colY + 0.15, w: colW - 0.4, h: 0.4,
      fontSize: 18, fontFace: F.title, color: C.dotRadical, bold: true, margin: 0,
    });
    s.addText([
      { text: "One monomer at a time", options: { fontSize: 14, bold: true, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "▪ Needs an initiator to start", options: { fontSize: 13, breakLine: true } },
      { text: "▪ Monomers add to an active chain end", options: { fontSize: 13, breakLine: true } },
      { text: "▪ Chains grow one at a time", options: { fontSize: 13, breakLine: true } },
      { text: "▪ Fast — high MW forms quickly", options: { fontSize: 13, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Examples: Polyethylene (PE), Polystyrene (PS), Acrylics", options: { fontSize: 12, italic: true, color: C.mutedText } },
    ], {
      x: MX + 0.2, y: colY + 0.6, w: colW - 0.4, h: 2.6,
      fontFace: F.body, color: C.bodyDark, margin: 0,
    });

    // Chain-growth mini diagram
    const cgDiagX = MX + 0.3;
    const cgDiagY = colY + 3.0;
    // Monomer dots
    for (let i = 0; i < 6; i++) {
      s.addShape(pres.shapes.OVAL, {
        x: cgDiagX + i * 0.4, y: cgDiagY, w: 0.2, h: 0.2, fill: { color: "E8D5B7" },
      });
    }
    s.addText("→  →  →", {
      x: cgDiagX + 2.4, y: cgDiagY - 0.05, w: 1.0, h: 0.3,
      fontSize: 11, color: C.dotRadical, margin: 0,
    });

    // Right column: Step-Growth
    const rightX = MX + colW + 0.5;
    s.addShape(pres.shapes.RECTANGLE, {
      x: rightX, y: colY, w: colW, h: 3.6,
      fill: { color: C.cardBg },
      shadow: { type: "outer", blur: 3, offset: 1, angle: 135, color: "000000", opacity: 0.06 },
    });
    s.addText("Step-Growth", {
      x: rightX + 0.2, y: colY + 0.15, w: colW - 0.4, h: 0.4,
      fontSize: 18, fontFace: F.title, color: C.dotStep, bold: true, margin: 0,
    });
    s.addText([
      { text: "Any two molecules can react", options: { fontSize: 14, bold: true, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "▪ No initiator needed", options: { fontSize: 13, breakLine: true } },
      { text: "▪ Complementary ends find each other", options: { fontSize: 13, breakLine: true } },
      { text: "▪ Chains merge together, release byproduct", options: { fontSize: 13, breakLine: true } },
      { text: "▪ Slow — high MW needs >99% conversion", options: { fontSize: 13, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Examples: Nylon, Kevlar, PET (plastic bottles)", options: { fontSize: 12, italic: true, color: C.mutedText } },
    ], {
      x: rightX + 0.2, y: colY + 0.6, w: colW - 0.4, h: 2.6,
      fontFace: F.body, color: C.bodyDark, margin: 0,
    });

    // Step-growth mini diagram
    const sgDiagX = rightX + 0.3;
    const sgDiagY = colY + 3.0;
    s.addShape(pres.shapes.OVAL, { x: sgDiagX, y: sgDiagY, w: 0.22, h: 0.22, fill: { color: C.copper } });
    s.addShape(pres.shapes.OVAL, { x: sgDiagX + 0.35, y: sgDiagY, w: 0.22, h: 0.22, fill: { color: C.primary } });
    s.addText("+", { x: sgDiagX + 0.55, y: sgDiagY - 0.02, w: 0.3, h: 0.25, fontSize: 11, color: C.dotStep, margin: 0 });
    s.addShape(pres.shapes.OVAL, { x: sgDiagX + 0.85, y: sgDiagY, w: 0.22, h: 0.22, fill: { color: C.copper } });
    s.addShape(pres.shapes.OVAL, { x: sgDiagX + 1.2, y: sgDiagY, w: 0.22, h: 0.22, fill: { color: C.primary } });
    s.addText("→", { x: sgDiagX + 1.5, y: sgDiagY - 0.02, w: 0.5, h: 0.25, fontSize: 13, color: C.dotStep, margin: 0 });
  }

  // ══════════════════════════════════════════
  // ACT 2: CHAIN-GROWTH (Slides 5–8)
  // ══════════════════════════════════════════

  // ── Slide 5: Free-Radical Polymerization ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    addTitle(s, "Free-Radical Polymerization");

    // Sim dot
    s.addShape(pres.shapes.OVAL, { x: MX, y: 1.1, w: 0.18, h: 0.18, fill: { color: C.dotRadical } });

    // Left: mechanism text
    s.addText([
      { text: "The Three Stages", options: { fontSize: 16, fontFace: F.title, color: C.primary, bold: true, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "① Initiation", options: { fontSize: 15, bold: true, color: C.dotRadical, breakLine: true } },
      { text: "Initiator (I₂) splits into two reactive radicals:   I₂ → 2 I•", options: { fontSize: 14, breakLine: true } },
      { text: "Each radical captures a monomer to start a chain.", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "② Propagation", options: { fontSize: 15, bold: true, color: C.dotRadical, breakLine: true } },
      { text: "The chain radical adds monomer after monomer. Each new unit adds to the active chain end. The chain grows one unit at a time.", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "③ Termination", options: { fontSize: 15, bold: true, color: C.dotRadical, breakLine: true } },
      { text: "Two growing chains meet and stop each other — the radical ends combine or transfer, making dead (finished) polymer.", options: { fontSize: 14 } },
    ], {
      x: MX, y: 1.4, w: 5.3, h: 3.8,
      fontFace: F.body, color: C.bodyDark, margin: 0,
    });

    // Right: screenshot
    addSimScreenshot(s, "free-radical.png", 5.5, 1.2, 3.9, 3.5);

    // Caption
    s.addText("Screenshot from the live Polymer Simulation Lab — let it run and watch the stages in action", {
      x: MX, y: 5.1, w: CW, h: 0.3, fontSize: 10, fontFace: F.body, color: C.mutedText, italic: true, margin: 0,
    });
  }

  // ── Slide 6: Inside the Free-Radical Simulator ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    addTitle(s, "Inside the Free-Radical Simulator");

    // Large screenshot
    addSimScreenshot(s, "free-radical-closeup.png", MX, 1.15, CW, 2.8);

    // Annotation callouts below
    const calloutY = 4.1;
    const calloutW = (CW - 0.4) / 3;

    const callouts = [
      { title: "Yellow dots", body: "Initiator molecules (I₂). Decompose into primary radicals to start chains.", color: "FFD93D" },
      { title: "Teal chains", body: "Growing chain radicals — the active end keeps adding monomers. Watch them wiggle!", color: C.dotRadical },
      { title: "Gray chains", body: "Dead (terminated) polymer. No longer growing. Mn, Mw, and PDI track molecular weight.", color: "999999" },
    ];

    callouts.forEach((c, i) => {
      const cx = MX + i * (calloutW + 0.2);
      // Color dot
      s.addShape(pres.shapes.OVAL, {
        x: cx, y: calloutY, w: 0.15, h: 0.15, fill: { color: c.color },
      });
      // Title
      s.addText(c.title, {
        x: cx + 0.22, y: calloutY - 0.02, w: calloutW - 0.3, h: 0.25,
        fontSize: 12, fontFace: F.title, color: C.primary, bold: true, margin: 0,
      });
      // Body
      s.addText(c.body, {
        x: cx, y: calloutY + 0.3, w: calloutW, h: 0.9,
        fontSize: 11, fontFace: F.body, color: C.bodyDark, margin: 0,
      });
    });
  }

  // ── Slide 7: Copolymerization — Two Monomers ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    addTitle(s, "Copolymerization — Two Monomers");

    s.addShape(pres.shapes.OVAL, { x: MX, y: 1.1, w: 0.18, h: 0.18, fill: { color: C.dotCopolymer } });

    // Left: explanation
    s.addText([
      { text: "Building with Two Different Blocks", options: { fontSize: 16, fontFace: F.title, color: C.primary, bold: true, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "M₁ = 2EHA (soft, flexible)", options: { fontSize: 14, bold: true, color: C.dotCopolymer, breakLine: true } },
      { text: "Gives the polymer its flexibility and tack. Think of it as the 'stretchy' component.", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "M₂ = Acrylic Acid (hard, polar)", options: { fontSize: 14, bold: true, color: "FF9F43", breakLine: true } },
      { text: "Provides strength and adhesion. The 'sticky' component that grabs surfaces.", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Who adds to whom? Mayo-Lewis kinetics:", options: { fontSize: 13, fontFace: F.title, color: C.primary, bold: true, breakLine: true } },
      { text: "Each chain end has a preference — it's more likely to add one monomer type over the other. This controls the final polymer composition.", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Real example: Pressure-sensitive adhesives use 95% 2EHA + 5% AA — soft enough to stick, strong enough to hold.", options: { fontSize: 13, italic: true, color: C.mutedText } },
    ], {
      x: MX, y: 1.4, w: 5.3, h: 3.8,
      fontFace: F.body, color: C.bodyDark, margin: 0,
    });

    // Right: screenshot
    addSimScreenshot(s, "copolymer.png", 5.5, 1.2, 3.9, 3.5);
    s.addText("Screenshot from the live Polymer Simulation Lab", {
      x: MX, y: 5.1, w: CW, h: 0.3, fontSize: 10, fontFace: F.body, color: C.mutedText, italic: true, margin: 0,
    });
  }

  // ── Slide 8: Tuning Material Properties ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    addTitle(s, "Tuning Material Properties");

    s.addText("The monomer ratio determines the final material behavior", {
      x: MX, y: 1.15, w: CW, h: 0.35, fontSize: 14, fontFace: F.body, color: C.mutedText, italic: true, margin: 0,
    });

    // Gradient bar from soft to hard
    const barX = MX + 0.5;
    const barY = 1.8;
    const barW = CW - 1.0;
    const barH = 0.5;

    // Gradient approximation with multiple slim rects
    const segments = 20;
    for (let i = 0; i < segments; i++) {
      const ratio = i / (segments - 1);
      const r = Math.round(77 + (255 - 77) * ratio);
      const g = Math.round(166 + (159 - 166) * ratio);
      const b = Math.round(255 - 188 * ratio);
      s.addShape(pres.shapes.RECTANGLE, {
        x: barX + (i / segments) * barW, y: barY,
        w: barW / segments, h: barH,
        fill: { color: `${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}` },
        line: { color: `${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`, width: 0 },
      });
    }

    // Labels
    s.addText("Soft & Flexible", { x: barX, y: barY + barH + 0.1, w: 2, h: 0.3, fontSize: 11, fontFace: F.body, color: C.mutedText });
    s.addText("Hard & Rigid", { x: barX + barW - 2, y: barY + barH + 0.1, w: 2, h: 0.3, fontSize: 11, fontFace: F.body, color: C.mutedText, align: "right" });

    // Three example cards
    const cardW2 = (CW - 0.6) / 3;
    const cardY = 2.8;

    const examples = [
      { ratio: "95% 2EHA / 5% AA", desc: "Soft pressure-sensitive adhesive. Sticky notes and tape.", color: C.dotCopolymer },
      { ratio: "70% 2EHA / 30% AA", desc: "Balanced copolymer. Labels, decals, general-purpose adhesive.", color: C.primary },
      { ratio: "50% 2EHA / 50% AA", desc: "Hard, polar material. High-strength bonding applications.", color: "FF9F43" },
    ];

    examples.forEach((ex, i) => {
      const cx = MX + i * (cardW2 + 0.3);
      addCard(s, cx, cardY, cardW2, 2.1, ex.ratio, ex.desc, ex.color);
    });
  }

  // ══════════════════════════════════════════
  // ACT 3: STEP-GROWTH & CROSSLINKING (Slides 9–13)
  // ══════════════════════════════════════════

  // ── Slide 9: Step-Growth Polymerization ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    addTitle(s, "Step-Growth Polymerization");

    s.addShape(pres.shapes.OVAL, { x: MX, y: 1.1, w: 0.18, h: 0.18, fill: { color: C.dotStep } });

    s.addText([
      { text: "AA + BB → Polymer + H₂O", options: { fontSize: 16, fontFace: F.title, color: C.primary, bold: true, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Two types of monomers, each with two reactive ends:", options: { fontSize: 14, breakLine: true } },
      { text: "▪ Diamine (AA) — two -NH₂ amine groups", options: { fontSize: 14, breakLine: true } },
      { text: "▪ Diacid (BB) — two -COOH acid groups", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "No initiator. Any molecule can react with any other — chains merge together. Every bond formed releases a water molecule (H₂O).", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "The Catch: Need >99% Conversion", options: { fontSize: 14, fontFace: F.title, color: C.copper, bold: true, breakLine: true } },
      { text: "Carothers equation: DP = 1/(1−p). At 90% conversion you only get DP=10. You need 99%+ for high molecular weight. Every unreacted end counts.", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Stoichiometric imbalance (too much A or B) deliberately caps molecular weight.", options: { fontSize: 13, italic: true, color: C.mutedText } },
    ], {
      x: MX, y: 1.4, w: 5.3, h: 3.8,
      fontFace: F.body, color: C.bodyDark, margin: 0,
    });

    addSimScreenshot(s, "step-growth.png", 5.5, 1.2, 3.9, 3.5);
    s.addText("Screenshot from the live Polymer Simulation Lab", {
      x: MX, y: 5.1, w: CW, h: 0.3, fontSize: 10, fontFace: F.body, color: C.mutedText, italic: true, margin: 0,
    });
  }

  // ── Slide 10: Nylon & Step-Growth Materials ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    addTitle(s, "Step-Growth Polymers in the Real World");

    const cardW4 = (CW - 0.6) / 2;
    const cardH4 = 1.5;
    const gridY = 1.3;

    const materials = [
      { title: "Nylon-6,6", body: "The first synthetic fiber. Used in clothing, carpets, and rope. Made from hexamethylene diamine + adipic acid.", icon: "🧦", color: C.dotStep },
      { title: "PET (Polyester)", body: "Plastic bottles and clothing fibers. The most recycled plastic. Made from terephthalic acid + ethylene glycol.", icon: "🧴", color: C.dotCopolymer },
      { title: "Polycarbonate", body: "Impact-resistant eyeglass lenses, CDs, and aircraft windows. Transparent and tough.", icon: "👓", color: C.primary },
      { title: "Kevlar", body: "Bulletproof vests and aerospace composites. 5× stronger than steel by weight. Aromatic polyamide.", icon: "🛡️", color: C.copper },
    ];

    materials.forEach((m, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = MX + col * (cardW4 + 0.6);
      const cy = gridY + row * (cardH4 + 0.3);

      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: cy, w: cardW4, h: cardH4,
        fill: { color: C.cardBg },
        shadow: { type: "outer", blur: 3, offset: 1, angle: 135, color: "000000", opacity: 0.06 },
      });
      s.addShape(pres.shapes.RECTANGLE, { x: cx, y: cy, w: 0.05, h: cardH4, fill: { color: m.color } });
      s.addText(m.icon, { x: cx + 0.2, y: cy + 0.2, w: 0.5, h: 0.5, fontSize: 28, margin: 0 });
      s.addText(m.title, { x: cx + 0.75, y: cy + 0.2, w: cardW4 - 1.0, h: 0.35, fontSize: 15, fontFace: F.title, color: m.color, bold: true, margin: 0 });
      s.addText(m.body, { x: cx + 0.2, y: cy + 0.7, w: cardW4 - 0.5, h: 0.7, fontSize: 12, fontFace: F.body, color: C.bodyDark, margin: 0 });
    });

    // Note at bottom
    s.addText("Key insight: The A:B monomer ratio controls molecular weight. A slight imbalance (e.g., 1% extra B) caps the maximum chain length. Industry uses this to target specific material properties.", {
      x: MX, y: 4.6, w: CW, h: 0.7, fontSize: 12, fontFace: F.body, color: C.mutedText, italic: true, margin: 0,
    });
  }

  // ── Slide 11: Crosslinking — Building a Network ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    addTitle(s, "Crosslinking — Building a 3D Network");

    s.addShape(pres.shapes.OVAL, { x: MX, y: 1.1, w: 0.18, h: 0.18, fill: { color: C.dotCrosslink } });

    s.addText([
      { text: "From Linear Chains to a 3D Network", options: { fontSize: 16, fontFace: F.title, color: C.primary, bold: true, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Start with a 2EHA/AA copolymer. Add a bifunctional crosslinker that reacts with AA (-COOH) groups on different chains:", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Chain A — AA — Crosslinker — AA — Chain B", options: { fontSize: 14, bold: true, color: C.dotCrosslink, align: "center", breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Each bridge connects two separate chains. As more bridges form, the material transforms from a viscous liquid into a solid gel. The crosslinked AA units are marked in hot pink.", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Why crosslink? Linear polymers can flow and creep. Crosslinked networks are dimensionally stable — they don't dissolve, they swell. This is the chemistry behind superabsorbents, coatings, and hydrogels.", options: { fontSize: 14, breakLine: true } },
    ], {
      x: MX, y: 1.4, w: 5.3, h: 3.8,
      fontFace: F.body, color: C.bodyDark, margin: 0,
    });

    addSimScreenshot(s, "crosslink.png", 5.5, 1.2, 3.9, 3.5);
    s.addText("Hot pink = crosslinked AA segments and bridges between chains", {
      x: MX, y: 5.1, w: CW, h: 0.3, fontSize: 10, fontFace: F.body, color: C.mutedText, italic: true, margin: 0,
    });
  }

  // ── Slide 12: Crosslinking in the Real World ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    addTitle(s, "Crosslinking in the Real World");

    const cardW4b = (CW - 0.6) / 2;
    const cardH4b = 1.5;
    const gridY2 = 1.3;

    const apps = [
      { title: "PSA — Pressure-Sensitive Adhesive", xl: "1%", body: "Sticky notes, removable tape, labels. Just enough crosslinking to hold shape but stay tacky.", icon: "📝", color: C.dotRadical },
      { title: "SAP — Superabsorbent Polymer", xl: "10%", body: "Diapers, water-retention gels. Crosslinks trap water inside the network without dissolving.", icon: "💧", color: C.dotCopolymer },
      { title: "Hard Coatings", xl: "30%", body: "Automotive clear coat, protective finishes. Dense crosslinking = scratch resistance and chemical durability.", icon: "🚗", color: C.copper },
      { title: "Hydrogels", xl: "5%", body: "Contact lenses, wound dressings, drug delivery. Absorb water while maintaining shape and flexibility.", icon: "🩹", color: C.dotCrosslink },
    ];

    apps.forEach((app, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = MX + col * (cardW4b + 0.6);
      const cy = gridY2 + row * (cardH4b + 0.25);

      s.addShape(pres.shapes.RECTANGLE, { x: cx, y: cy, w: cardW4b, h: cardH4b, fill: { color: C.cardBg }, shadow: { type: "outer", blur: 3, offset: 1, angle: 135, color: "000000", opacity: 0.06 } });
      s.addShape(pres.shapes.RECTANGLE, { x: cx, y: cy, w: 0.05, h: cardH4b, fill: { color: app.color } });
      s.addText(app.icon, { x: cx + 0.15, y: cy + 0.15, w: 0.5, h: 0.5, fontSize: 28, margin: 0 });
      s.addText(app.title, { x: cx + 0.7, y: cy + 0.12, w: cardW4b - 1.0, h: 0.3, fontSize: 14, fontFace: F.title, color: app.color, bold: true, margin: 0 });
      // XL percentage badge
      s.addShape(pres.shapes.RECTANGLE, { x: cx + cardW4b - 1.1, y: cy + 0.15, w: 0.9, h: 0.28, fill: { color: app.color } });
      s.addText(app.xl + " XL", { x: cx + cardW4b - 1.1, y: cy + 0.15, w: 0.9, h: 0.28, fontSize: 10, fontFace: F.body, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
      s.addText(app.body, { x: cx + 0.2, y: cy + 0.65, w: cardW4b - 0.5, h: 0.75, fontSize: 12, fontFace: F.body, color: C.bodyDark, margin: 0 });
    });

    s.addText("Adjust the crosslinker percentage in the simulator to see the network tighten in real time", {
      x: MX, y: 4.7, w: CW, h: 0.4, fontSize: 11, fontFace: F.body, color: C.mutedText, italic: true, margin: 0,
    });
  }

  // ── Slide 13: The Gel Point ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    addTitle(s, "The Gel Point — When Everything Connects");

    s.addText("Before the gel point, the system is a liquid with growing clusters. At the gel point, one giant connected network spans the entire system. After — a solid gel that won't dissolve.", {
      x: MX, y: 1.2, w: CW, h: 0.7, fontSize: 14, fontFace: F.body, color: C.bodyDark, margin: 0,
    });

    // Before/After comparison
    const panelW = (CW - 0.5) / 2;
    const panelY = 2.1;
    const panelH = 2.5;

    // Before
    s.addShape(pres.shapes.RECTANGLE, { x: MX, y: panelY, w: panelW, h: panelH, fill: { color: C.cardBg }, shadow: { type: "outer", blur: 3, offset: 1, angle: 135, color: "000000", opacity: 0.06 } });
    s.addText("Before Gel Point", {
      x: MX + 0.2, y: panelY + 0.1, w: panelW - 0.4, h: 0.35,
      fontSize: 16, fontFace: F.title, color: C.mutedText, bold: true, margin: 0,
    });

    // Small disconnected clusters (circles)
    const clusters = [
      [MX + 0.6, panelY + 1.0], [MX + 2.2, panelY + 0.9],
      [MX + 0.4, panelY + 1.9], [MX + 1.3, panelY + 1.5], [MX + 2.8, panelY + 1.8],
    ];
    clusters.forEach(([cx, cy]) => {
      s.addShape(pres.shapes.OVAL, { x: cx, y: cy, w: 0.4, h: 0.4, fill: { color: C.mutedText, transparency: 40 } });
    });
    s.addText("Small, disconnected clusters", {
      x: MX + 0.2, y: panelY + panelH - 0.6, w: panelW - 0.4, h: 0.35,
      fontSize: 11, fontFace: F.body, color: C.mutedText, italic: true, margin: 0,
    });

    // After
    const afterX = MX + panelW + 0.5;
    s.addShape(pres.shapes.RECTANGLE, { x: afterX, y: panelY, w: panelW, h: panelH, fill: { color: C.cardBg }, shadow: { type: "outer", blur: 3, offset: 1, angle: 135, color: "000000", opacity: 0.06 } });
    s.addShape(pres.shapes.RECTANGLE, { x: afterX, y: panelY, w: 0.05, h: panelH, fill: { color: C.dotCrosslink } });
    s.addText("After Gel Point", {
      x: afterX + 0.2, y: panelY + 0.1, w: panelW - 0.4, h: 0.35,
      fontSize: 16, fontFace: F.title, color: C.dotCrosslink, bold: true, margin: 0,
    });

    // One large connected network (big oval)
    s.addShape(pres.shapes.OVAL, { x: afterX + 0.8, y: panelY + 0.7, w: 2.2, h: 1.5, fill: { color: C.dotCrosslink, transparency: 30 } });
    // Connecting lines
    s.addShape(pres.shapes.LINE, { x: afterX + 0.6, y: panelY + 1.0, w: 2.6, h: 0.2, line: { color: C.dotCrosslink, width: 2 } });
    s.addShape(pres.shapes.LINE, { x: afterX + 1.0, y: panelY + 0.8, w: 1.8, h: 1.0, line: { color: C.dotCrosslink, width: 2 } });

    s.addText("One giant connected network", {
      x: afterX + 0.2, y: panelY + panelH - 0.6, w: panelW - 0.4, h: 0.35,
      fontSize: 11, fontFace: F.body, color: C.dotCrosslink, italic: true, margin: 0,
    });

    // Bottom note
    s.addText("In the crosslinking simulator, the gel point is detected when >50% of all chains are connected into a single network. The gel point is latched — once reached, the material is permanently gelled.", {
      x: MX, y: panelY + panelH + 0.2, w: CW, h: 0.6, fontSize: 12, fontFace: F.body, color: C.bodyDark, margin: 0,
    });
  }

  // ══════════════════════════════════════════
  // ACT 4: PLATFORM & TRY IT (Slides 14–17)
  // ══════════════════════════════════════════

  // ── Slide 14: The Polymer Simulation Lab ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    addTitle(s, "The Polymer Simulation Lab");

    s.addText("Four interactive experiments. Zero install. Runs in your browser.", {
      x: MX, y: 1.15, w: CW, h: 0.35, fontSize: 14, fontFace: F.body, color: C.mutedText, italic: true, margin: 0,
    });

    // Screenshot of landing page
    addSimScreenshot(s, "landing.png", MX, 1.6, CW, 2.5);

    // 4 sim cards in a row below screenshot
    const miniCardW = (CW - 0.6) / 4;
    const miniCardY = 4.3;

    const sims = [
      { name: "Free-Radical", desc: "Chain-growth kinetics", color: C.dotRadical },
      { name: "Copolymer", desc: "Mayo-Lewis two monomers", color: C.dotCopolymer },
      { name: "Step-Growth", desc: "AA+BB condensation", color: C.dotStep },
      { name: "Crosslinking", desc: "3D network formation", color: C.dotCrosslink },
    ];

    sims.forEach((sim, i) => {
      const sx = MX + i * (miniCardW + 0.2);
      // Dot
      s.addShape(pres.shapes.OVAL, { x: sx, y: miniCardY, w: 0.14, h: 0.14, fill: { color: sim.color } });
      // Name
      s.addText(sim.name, { x: sx + 0.2, y: miniCardY - 0.03, w: miniCardW - 0.3, h: 0.25, fontSize: 12, fontFace: F.title, color: sim.color, bold: true, margin: 0 });
      // Desc
      s.addText(sim.desc, { x: sx, y: miniCardY + 0.3, w: miniCardW, h: 0.3, fontSize: 10, fontFace: F.body, color: C.mutedText, margin: 0 });
    });
  }

  // ── Slide 15: How It's Built ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    addTitle(s, "How the Simulator Is Built");

    const colW3 = (CW - 0.8) / 3;
    const colY = 1.5;
    const colH = 3.0;

    const cols = [
      { title: "Zero Dependencies", body: "Pure vanilla JavaScript. No frameworks, no npm install, no build step. ES modules in source files, concatenated bundles for file:// compatibility.", color: C.dotRadical },
      { title: "Canvas 2D Rendering", body: "Hardware-accelerated drawing via HTML5 Canvas. devicePixelRatio-aware for sharp Retina/HiDPI displays. 60fps requestAnimationFrame loop.", color: C.dotCopolymer },
      { title: "Modular Architecture", body: "Shared lib/ with generic Renderer and UIBase. Each simulator in its own directory. Theme-parameterized — same renderer drives all 4 sims.", color: C.dotStep },
    ];

    cols.forEach((col, i) => {
      const cx = MX + i * (colW3 + 0.4);

      s.addShape(pres.shapes.RECTANGLE, { x: cx, y: colY, w: colW3, h: colH, fill: { color: C.cardBg }, shadow: { type: "outer", blur: 3, offset: 1, angle: 135, color: "000000", opacity: 0.06 } });

      // Number circle
      s.addShape(pres.shapes.OVAL, { x: cx + colW3 / 2 - 0.3, y: colY + 0.2, w: 0.6, h: 0.6, fill: { color: col.color } });
      s.addText(String(i + 1), { x: cx + colW3 / 2 - 0.3, y: colY + 0.2, w: 0.6, h: 0.6, fontSize: 18, fontFace: F.title, color: "FFFFFF", bold: true, align: "center", valign: "middle" });

      // Title
      s.addText(col.title, { x: cx + 0.2, y: colY + 1.0, w: colW3 - 0.4, h: 0.35, fontSize: 14, fontFace: F.title, color: col.color, bold: true, align: "center", margin: 0 });

      // Body
      s.addText(col.body, { x: cx + 0.2, y: colY + 1.45, w: colW3 - 0.4, h: colH - 1.6, fontSize: 12, fontFace: F.body, color: C.bodyDark, align: "center", margin: 0 });
    });

    s.addText("Open source · GitHub · Built for chemistry education", {
      x: MX, y: 4.9, w: CW, h: 0.35, fontSize: 11, fontFace: F.body, color: C.mutedText, align: "center", margin: 0,
    });
  }

  // ── Slide 16: Try It Yourself ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgDark };

    s.addText("Try It Yourself", {
      x: MX, y: 1.2, w: CW, h: 0.9, fontSize: 36, fontFace: F.title, color: C.bodyLight, bold: true, align: "center", margin: 0,
    });

    addCopperRule(s, SW / 2 - 0.8, 2.1, 1.6);

    // QR code placeholder — we use a text box with URL prominently displayed
    // (QR code would need a QR generation library; URL display is the fallback)
    s.addShape(pres.shapes.RECTANGLE, {
      x: SW / 2 - 1.5, y: 2.4, w: 3.0, h: 1.8,
      fill: { color: "FFFFFF" },
    });
    s.addText("🔗\n\nScan QR or visit:", {
      x: SW / 2 - 1.5, y: 2.4, w: 3.0, h: 1.0,
      fontSize: 14, fontFace: F.body, color: C.bodyDark, align: "center", valign: "middle", margin: 0,
    });
    s.addText("localhost:8765", {
      x: SW / 2 - 1.5, y: 3.3, w: 3.0, h: 0.5,
      fontSize: 18, fontFace: F.body, color: C.copper, bold: true, align: "center", valign: "middle", margin: 0,
    });

    s.addText([
      { text: "Open in any modern browser", options: { breakLine: true } },
      { text: "No install · No signup · No setup", options: { breakLine: true } },
      { text: "Start experimenting with polymers right now", options: { breakLine: false } },
    ], {
      x: MX, y: 4.5, w: CW, h: 0.8, fontSize: 13, fontFace: F.body, color: C.mutedText, align: "center", margin: 0,
    });
  }

  // ── Slide 17: Thank You ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgDark };

    s.addText("Thank You", {
      x: MX, y: 1.6, w: CW, h: 1.0, fontSize: 44, fontFace: F.title, color: C.bodyLight, bold: true, align: "center", margin: 0,
    });

    addCopperRule(s, SW / 2 - 0.8, 2.65, 1.6);

    s.addText("Questions?", {
      x: MX, y: 3.0, w: CW, h: 0.6, fontSize: 20, fontFace: F.body, color: C.copper, align: "center", margin: 0,
    });

    s.addText([
      { text: "Polymer Simulation Lab", options: { breakLine: true } },
      { text: "Open in your browser to explore polymerization interactively", options: { breakLine: false } },
    ], {
      x: MX, y: 4.0, w: CW, h: 0.7, fontSize: 13, fontFace: F.body, color: C.mutedText, align: "center", margin: 0,
    });
  }

  // ── Write file ──
  const outPath = path.join(__dirname, "..", "Polymer-Simulation-Lab.pptx");
  await pres.writeFile({ fileName: outPath });
  console.log("✅ PPTX written to:", outPath);
}

build().catch(err => { console.error("❌ Build failed:", err); process.exit(1); });
```

- [ ] **Step 2: Commit the script**

```bash
git add scripts/build-polymer-pptx.js
git commit -m "feat: complete 17-slide polymer basics PPTX build script"
```

---

### Task 4: Generate and QA

**Files:**
- Output: `Polymer-Simulation-Lab.pptx`

- [ ] **Step 1: Run the build script**

Run: `cd d:/coding_is_fun/polymer_simulation && node scripts/build-polymer-pptx.js`
Expected: `✅ PPTX written to: d:\coding_is_fun\polymer_simulation\Polymer-Simulation-Lab.pptx`

- [ ] **Step 2: Text content QA**

Run: `cd d:/coding_is_fun/polymer_simulation && python -m markitdown Polymer-Simulation-Lab.pptx`
Checklist:
- All 17 slides present
- All titles match the design spec
- No "undefined", "NaN", or "[Screenshot]" placeholder text (unless image file was missing)
- No leftover placeholder text, typos, or garbled content

- [ ] **Step 3: Placeholder scan**

Run: `cd d:/coding_is_fun/polymer_simulation && python -m markitdown Polymer-Simulation-Lab.pptx | grep -iE "xxxx|lorem|ipsum|undefined|placeholder|TBD|TODO"`
Expected: No matches. If any matches, fix the corresponding slide in the script.

- [ ] **Step 4: Visual QA — Convert to images**

```bash
cd d:/coding_is_fun/polymer_simulation
python C:/Users/DELL/.claude/skills/pptx/scripts/office/soffice.py --headless --convert-to pdf Polymer-Simulation-Lab.pptx
pdftoppm -jpeg -r 150 Polymer-Simulation-Lab.pdf slide
```

Check that all 17 slide images are created (`slide-01.jpg` through `slide-17.jpg`).

- [ ] **Step 5: Visual QA — Inspect slides**

Inspect slide images for issues:
- Text overflow or cutoff at slide edges
- Elements overlapping or colliding
- Low contrast (e.g., light text on light background)
- Uneven spacing or alignment
- Leftover placeholder content
- Copper rule positioning under each title
- Card accent bars aligned with card backgrounds
- Screenshots rendering correctly (not blank, not distorted)

- [ ] **Step 6: Fix issues found in QA**

Fix any issues found in steps 2-5 by editing `scripts/build-polymer-pptx.js`, re-running, and re-inspecting affected slides.

- [ ] **Step 7: Final commit**

```bash
git add Polymer-Simulation-Lab.pptx scripts/build-polymer-pptx.js
git commit -m "feat: polymer basics PPTX presentation — 17 slides with sim screenshots"
```
