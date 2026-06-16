const pptxgen = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

// ── Color Palette (no # prefix — pptxgenjs requirement) ──
const C = {
  bgLight:      "F8F6F0",
  bgDark:       "0B0E17",
  primary:      "2C5F7C",
  copper:       "D97742",
  bodyDark:     "2D2D2D",
  bodyLight:    "ECE8E0",
  cardBg:       "FFFFFF",
  mutedText:    "7F8C8D",
  dotRadical:   "4ECDC4",
  dotCopolymer: "4DA6FF",
  dotStep:      "D9A040",
  dotCrosslink: "FF4499",
  monomerB:     "FF9F43",
  monomerBg:    "E8D5B7",
};

// ── Font Constants ──
const F = {
  title: "Georgia",
  body: "Calibri",
};

// ── Slide dimensions (LAYOUT_16x9: 10" × 5.625") ──
const SW = 10;
const SH = 5.625;
const MX = 0.7;
const CW = SW - 2 * MX;

// ── Helpers ──
function copperRule(x, y, w) {
  return { x, y, w: w || 1.0, h: 0.025, fill: { color: C.copper } };
}

function titleOpts(y) {
  return { x: MX, y: y || 0.35, w: CW, h: 0.6, fontSize: 32, fontFace: F.title, color: C.primary, bold: true, margin: 0 };
}

function addTitle(slide, text, y) {
  slide.addText(text, titleOpts(y));
}

function addRule(slide, y) {
  slide.addShape("rect", copperRule(MX, y || 0.9, 1.0));
}

function titleAndRule(slide, text) {
  addTitle(slide, text);
  addRule(slide, (text.length > 35 ? 0.95 : 0.85));
}

// Standard card shadow factory (fresh object each call)
function cardShadow() {
  return { type: "outer", blur: 3, offset: 1, angle: 135, color: "000000", opacity: 0.06 };
}

// 2-column card with left accent bar
function addCard(slide, x, y, w, h, title, body, accentColor) {
  slide.addShape("rect", { x, y, w, h, fill: { color: C.cardBg }, shadow: cardShadow() });
  slide.addShape("rect", { x, y, w: 0.05, h, fill: { color: accentColor || C.primary } });
  slide.addText(title, {
    x: x + 0.2, y: y + 0.12, w: w - 0.35, h: 0.35,
    fontSize: 14, fontFace: F.title, color: accentColor || C.primary, bold: true, margin: 0,
  });
  slide.addText(body, {
    x: x + 0.2, y: y + 0.5, w: w - 0.35, h: h - 0.65,
    fontSize: 12, fontFace: F.body, color: C.bodyDark, margin: 0,
  });
}

function addScreenshot(slide, filename, x, y, w, h) {
  const filePath = path.join(SCREENSHOT_DIR, filename);
  if (fs.existsSync(filePath)) {
    slide.addImage({ path: filePath, x, y, w, h, sizing: { type: "contain", w, h } });
  } else {
    slide.addShape("rect", { x, y, w, h, fill: { color: "EEEEEE" } });
    slide.addText(`[Screenshot: ${filename}]`, { x, y, w, h, fontSize: 11, color: C.mutedText, align: "center", valign: "middle" });
  }
}

function screenshotCaption(slide, text) {
  slide.addText(text || "Screenshot from the live Polymer Simulation Lab", {
    x: MX, y: 5.1, w: CW, h: 0.3, fontSize: 10, fontFace: F.body, color: C.mutedText, italic: true, margin: 0,
  });
}

function simDot(slide, x, y, color) {
  slide.addShape("ellipse", { x, y, w: 0.18, h: 0.18, fill: { color } });
}

function bodyText(slide, textArray, x, y, w, h) {
  slide.addText(textArray, {
    x: x || MX, y: y || 1.2, w: w || CW, h: h || (SH - (y || 1.2) - 0.4),
    fontSize: 14, fontFace: F.body, color: C.bodyDark, paraSpaceAfter: 6, margin: 0,
  });
}

// ── Build ──
async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Polymer Simulation Lab";
  pres.title = "Polymer Science: An Interactive Introduction";

  // ══════════════════════════════════════════
  // ACT 1: WHAT ARE POLYMERS? (Slides 1–4)
  // ══════════════════════════════════════════

  // ── Slide 1: Title ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgDark };

    s.addText("Polymer Science:", {
      x: MX, y: 1.4, w: CW, h: 0.9, fontSize: 42, fontFace: F.title,
      color: C.bodyLight, bold: true, margin: 0,
    });
    s.addText("An Interactive Introduction", {
      x: MX, y: 2.2, w: CW, h: 0.8, fontSize: 36, fontFace: F.title,
      color: C.copper, margin: 0,
    });
    s.addShape("rect", copperRule(MX, 3.15, 2.0));
    s.addText("Understanding how molecules become materials", {
      x: MX, y: 3.5, w: CW, h: 0.5, fontSize: 16, fontFace: F.body,
      color: C.mutedText, margin: 0,
    });
    s.addText("Polymer Simulation Lab  ·  2026", {
      x: MX, y: 4.8, w: CW, h: 0.4, fontSize: 11, fontFace: F.body,
      color: "5A5865", margin: 0,
    });
  }

  // ── Slide 2: What Is a Polymer? ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    titleAndRule(s, "What Is a Polymer?");

    const leftX = MX, leftW = 5.0;
    s.addText([
      { text: "\"Many repeat units\"", options: { fontSize: 18, fontFace: F.title, color: C.copper, breakLine: true } },
      { text: "", options: { fontSize: 10, breakLine: true } },
      { text: "A polymer is a long chain molecule made by linking together many smaller molecules called ", options: { fontSize: 15, breakLine: false } },
      { text: "monomers", options: { fontSize: 15, bold: true, breakLine: false } },
      { text: ".", options: { fontSize: 15, breakLine: true } },
      { text: "", options: { fontSize: 10, breakLine: true } },
      { text: "Everyday examples:", options: { fontSize: 13, fontFace: F.title, color: C.primary, bold: true, breakLine: true } },
      { text: "  DNA — nature’s polymer, stores genetic code", options: { fontSize: 14, breakLine: true } },
      { text: "  Plastic bottles — polyethylene terephthalate (PET)", options: { fontSize: 14, breakLine: true } },
      { text: "  Rubber tires — natural and synthetic elastomers", options: { fontSize: 14, breakLine: true } },
      { text: "  Proteins — amino acid chains that build your body", options: { fontSize: 14 } },
    ], {
      x: leftX, y: 1.2, w: leftW, h: 4.0,
      fontFace: F.body, color: C.bodyDark, margin: 0,
    });

    // Right: monomer-to-polymer diagram
    const rightX = 6.0, rightW = 3.4;
    s.addShape("rect", { x: rightX, y: 1.2, w: rightW, h: 3.8, fill: { color: C.cardBg } });

    const circleY = 2.2, circleR = 0.22, circleGap = 0.52, startX = rightX + 0.45;
    // Monomers row
    for (let i = 0; i < 5; i++) {
      s.addShape("ellipse", { x: startX + i * circleGap, y: circleY, w: circleR * 2, h: circleR * 2, fill: { color: C.monomerBg } });
      s.addText("M", { x: startX + i * circleGap, y: circleY, w: circleR * 2, h: circleR * 2, fontSize: 9, fontFace: F.body, color: C.bodyDark, align: "center", valign: "middle" });
    }
    s.addText("→", { x: rightX + 0.1, y: 2.7, w: 3.2, h: 0.35, fontSize: 18, align: "center", color: C.copper });

    // Polymer chain row
    const chainY = 3.1;
    for (let i = 0; i < 5; i++) {
      s.addShape("ellipse", { x: startX + i * circleGap, y: chainY, w: circleR * 2, h: circleR * 2, fill: { color: C.copper } });
    }
    for (let i = 0; i < 4; i++) {
      s.addShape("line", {
        x: startX + i * circleGap + circleR * 2, y: chainY + circleR,
        w: circleGap - circleR * 2, h: 0, line: { color: C.copper, width: 2 },
      });
    }
    s.addText("monomers → polymer chain", { x: rightX, y: 3.7, w: rightW, h: 0.35, fontSize: 11, fontFace: F.body, color: C.mutedText, align: "center", margin: 0 });
    s.addText("A polymer is a chain of repeating monomer units", { x: rightX, y: 4.3, w: rightW, h: 0.35, fontSize: 11, fontFace: F.body, color: C.primary, align: "center", italic: true, margin: 0 });
  }

  // ── Slide 3: Why Polymers Matter ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    titleAndRule(s, "Why Polymers Matter");

    const cardW = (CW - 0.3) / 2;
    const cardH = 1.6;
    const startY = 1.3;

    const apps = [
      { title: "Medicine", body: "Drug delivery systems, biodegradable sutures, contact lenses, and tissue engineering scaffolds.", emoji: "💊", color: C.primary },
      { title: "Materials", body: "Lightweight composites for aircraft, carbon fiber, bulletproof vests. Stronger than steel at a fraction of the weight.", emoji: "✈️", color: C.copper },
      { title: "Sustainability", body: "Biodegradable plastics from corn starch, recycled PET bottles into clothing, water-soluble packaging.", emoji: "🌱", color: C.dotStep },
      { title: "Everyday Life", body: "Adhesives, paints, phone cases, clothing fibers, non-stick cookware. Polymers are everywhere.", emoji: "🏠", color: C.dotRadical },
    ];

    apps.forEach((app, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const cx = MX + col * (cardW + 0.3);
      const cy = startY + row * (cardH + 0.25);

      s.addShape("rect", { x: cx, y: cy, w: cardW, h: cardH, fill: { color: C.cardBg }, shadow: cardShadow() });
      s.addShape("rect", { x: cx, y: cy, w: 0.05, h: cardH, fill: { color: app.color } });
      s.addText(app.emoji, { x: cx + 0.2, y: cy + 0.15, w: 0.5, h: 0.5, fontSize: 28, align: "center", valign: "middle", margin: 0 });
      s.addText(app.title, { x: cx + 0.75, y: cy + 0.15, w: cardW - 1.0, h: 0.35, fontSize: 15, fontFace: F.title, color: app.color, bold: true, margin: 0 });
      s.addText(app.body, { x: cx + 0.2, y: cy + 0.65, w: cardW - 0.5, h: 0.8, fontSize: 12, fontFace: F.body, color: C.bodyDark, margin: 0 });
    });
  }

  // ── Slide 4: Two Big Families ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    titleAndRule(s, "Two Big Families of Polymerization");

    const colW = (CW - 0.5) / 2;
    const colY = 1.3;
    const colH = 3.6;

    // Chain-Growth column
    s.addShape("rect", { x: MX, y: colY, w: colW, h: colH, fill: { color: C.cardBg }, shadow: cardShadow() });
    s.addText("Chain-Growth", { x: MX + 0.2, y: colY + 0.15, w: colW - 0.4, h: 0.4, fontSize: 18, fontFace: F.title, color: C.dotRadical, bold: true, margin: 0 });
    s.addText([
      { text: "One monomer at a time", options: { fontSize: 14, bold: true, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "▪ Needs an initiator to start", options: { fontSize: 13, breakLine: true } },
      { text: "▪ Monomers add to an active chain end", options: { fontSize: 13, breakLine: true } },
      { text: "▪ Chains grow one unit at a time", options: { fontSize: 13, breakLine: true } },
      { text: "▪ Fast — high MW forms early", options: { fontSize: 13, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Examples: Polyethylene, Polystyrene, Acrylics", options: { fontSize: 12, italic: true, color: C.mutedText } },
    ], { x: MX + 0.2, y: colY + 0.6, w: colW - 0.4, h: 2.8, fontFace: F.body, color: C.bodyDark, margin: 0 });

    // Chain-growth mini diagram
    const cgY = colY + 3.0;
    for (let i = 0; i < 6; i++) {
      s.addShape("ellipse", { x: MX + 0.35 + i * 0.4, y: cgY, w: 0.2, h: 0.2, fill: { color: C.monomerBg } });
    }
    s.addText("→  →  →", { x: MX + 2.5, y: cgY - 0.02, w: 1.0, h: 0.25, fontSize: 11, color: C.dotRadical, margin: 0 });

    // Step-Growth column
    const rightX = MX + colW + 0.5;
    s.addShape("rect", { x: rightX, y: colY, w: colW, h: colH, fill: { color: C.cardBg }, shadow: cardShadow() });
    s.addText("Step-Growth", { x: rightX + 0.2, y: colY + 0.15, w: colW - 0.4, h: 0.4, fontSize: 18, fontFace: F.title, color: C.dotStep, bold: true, margin: 0 });
    s.addText([
      { text: "Any two molecules can react", options: { fontSize: 14, bold: true, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "▪ No initiator needed", options: { fontSize: 13, breakLine: true } },
      { text: "▪ Complementary ends find each other", options: { fontSize: 13, breakLine: true } },
      { text: "▪ Chains merge, releasing byproduct (H₂O)", options: { fontSize: 13, breakLine: true } },
      { text: "▪ Slow — high MW needs >99% conversion", options: { fontSize: 13, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Examples: Nylon, Kevlar, PET bottles", options: { fontSize: 12, italic: true, color: C.mutedText } },
    ], { x: rightX + 0.2, y: colY + 0.6, w: colW - 0.4, h: 2.8, fontFace: F.body, color: C.bodyDark, margin: 0 });

    // Step-growth mini diagram
    const sgY = colY + 3.0;
    s.addShape("ellipse", { x: rightX + 0.35, y: sgY, w: 0.22, h: 0.22, fill: { color: C.copper } });
    s.addShape("ellipse", { x: rightX + 0.7, y: sgY, w: 0.22, h: 0.22, fill: { color: C.primary } });
    s.addText("+", { x: rightX + 1.0, y: sgY, w: 0.3, h: 0.25, fontSize: 12, color: C.dotStep, margin: 0 });
    s.addShape("ellipse", { x: rightX + 1.3, y: sgY, w: 0.22, h: 0.22, fill: { color: C.copper } });
    s.addShape("ellipse", { x: rightX + 1.65, y: sgY, w: 0.22, h: 0.22, fill: { color: C.primary } });
    s.addText("→", { x: rightX + 1.95, y: sgY, w: 0.5, h: 0.25, fontSize: 14, color: C.dotStep, margin: 0 });
  }

  // ══════════════════════════════════════════
  // ACT 2: CHAIN-GROWTH (Slides 5–8)
  // ══════════════════════════════════════════

  // ── Slide 5: Free-Radical Polymerization ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    titleAndRule(s, "Free-Radical Polymerization");
    simDot(s, MX, 1.05, C.dotRadical);

    bodyText(s, [
      { text: "The Three Stages", options: { fontSize: 16, fontFace: F.title, color: C.primary, bold: true, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "① Initiation", options: { fontSize: 15, bold: true, color: C.dotRadical, breakLine: true } },
      { text: "Initiator (I₂) splits into two reactive radicals:  I₂ → 2 I•. Each radical captures a monomer to start a chain.", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "② Propagation", options: { fontSize: 15, bold: true, color: C.dotRadical, breakLine: true } },
      { text: "The chain radical adds monomer after monomer. Each new unit attaches to the active chain end. The chain grows one unit at a time.", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "③ Termination", options: { fontSize: 15, bold: true, color: C.dotRadical, breakLine: true } },
      { text: "Two growing chains meet and stop each other — the radical ends combine or transfer, making dead (finished) polymer.", options: { fontSize: 14 } },
    ], MX, 1.35, 5.3, 3.7);

    addScreenshot(s, "free-radical.png", 5.5, 1.2, 3.9, 3.5);
    screenshotCaption(s);
  }

  // ── Slide 6: Inside the Free-Radical Simulator ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    titleAndRule(s, "Inside the Free-Radical Simulator");

    addScreenshot(s, "free-radical-closeup.png", MX, 1.1, CW, 2.75);

    const calloutY = 4.05;
    const calloutW = (CW - 0.4) / 3;
    const callouts = [
      { title: "Yellow dots", body: "Initiator molecules. Decompose into primary radicals to start chains.", color: "FFD93D" },
      { title: "Teal chains", body: "Growing chain radicals — the active end keeps adding monomers. Watch them wiggle!", color: C.dotRadical },
      { title: "Gray chains", body: "Dead (terminated) polymer. No longer growing. Mn, Mw, and PDI track molecular weight.", color: "999999" },
    ];

    callouts.forEach((c, i) => {
      const cx = MX + i * (calloutW + 0.2);
      s.addShape("ellipse", { x: cx, y: calloutY, w: 0.15, h: 0.15, fill: { color: c.color } });
      s.addText(c.title, { x: cx + 0.22, y: calloutY - 0.02, w: calloutW - 0.3, h: 0.25, fontSize: 12, fontFace: F.title, color: C.primary, bold: true, margin: 0 });
      s.addText(c.body, { x: cx, y: calloutY + 0.3, w: calloutW, h: 0.9, fontSize: 11, fontFace: F.body, color: C.bodyDark, margin: 0 });
    });
  }

  // ── Slide 7: Copolymerization ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    titleAndRule(s, "Copolymerization — Two Monomers");
    simDot(s, MX, 1.05, C.dotCopolymer);

    bodyText(s, [
      { text: "Building with Two Different Blocks", options: { fontSize: 16, fontFace: F.title, color: C.primary, bold: true, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "M₁ = 2EHA (soft, flexible)", options: { fontSize: 14, bold: true, color: C.dotCopolymer, breakLine: true } },
      { text: "Gives the polymer its flexibility and tack. Think of it as the ‘stretchy’ component.", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "M₂ = Acrylic Acid (hard, polar)", options: { fontSize: 14, bold: true, color: C.monomerB, breakLine: true } },
      { text: "Provides strength and adhesion. The ‘sticky’ component that grabs surfaces.", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Who adds to whom? Mayo-Lewis kinetics:", options: { fontSize: 13, fontFace: F.title, color: C.primary, bold: true, breakLine: true } },
      { text: "Each chain end has a preference — it’s more likely to add one monomer type over the other. This controls the final polymer composition.", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Real example: Pressure-sensitive adhesives use 95% 2EHA + 5% AA — soft enough to stick, strong enough to hold.", options: { fontSize: 13, italic: true, color: C.mutedText } },
    ], MX, 1.35, 5.3, 3.7);

    addScreenshot(s, "copolymer.png", 5.5, 1.2, 3.9, 3.5);
    screenshotCaption(s);
  }

  // ── Slide 8: Tuning Material Properties ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    titleAndRule(s, "Tuning Material Properties");

    s.addText("The monomer ratio determines the final material behavior", {
      x: MX, y: 1.1, w: CW, h: 0.35, fontSize: 14, fontFace: F.body, color: C.mutedText, italic: true, margin: 0,
    });

    // Gradient bar (soft blue → hard orange)
    const barX = MX + 0.5, barY = 1.8, barW = CW - 1.0, barH = 0.4;
    const segments = 20;
    for (let i = 0; i < segments; i++) {
      const t = i / (segments - 1);
      const r = Math.round(77 + t * (255 - 77));
      const g = Math.round(166 + t * (159 - 166));
      const b = Math.round(255 + t * (67 - 255)); // 255 → 67
      const hex = [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
      s.addShape("rect", { x: barX + (i / segments) * barW, y: barY, w: barW / segments, h: barH, fill: { color: hex } });
    }
    s.addText("Soft & Flexible", { x: barX, y: barY + barH + 0.08, w: 2, h: 0.28, fontSize: 11, fontFace: F.body, color: C.mutedText });
    s.addText("Hard & Rigid", { x: barX + barW - 2, y: barY + barH + 0.08, w: 2, h: 0.28, fontSize: 11, fontFace: F.body, color: C.mutedText, align: "right" });

    const cardW2 = (CW - 0.6) / 3, cardY2 = 2.7;
    const examples = [
      { ratio: "95% 2EHA / 5% AA", desc: "Soft pressure-sensitive adhesive. Ideal for sticky notes and removable tape.", color: C.dotCopolymer },
      { ratio: "70% 2EHA / 30% AA", desc: "Balanced copolymer. Labels, decals, and general-purpose adhesives.", color: C.primary },
      { ratio: "50% 2EHA / 50% AA", desc: "Hard, polar material. High-strength bonding. Less tack, more durability.", color: C.monomerB },
    ];
    examples.forEach((ex, i) => {
      addCard(s, MX + i * (cardW2 + 0.3), cardY2, cardW2, 2.2, ex.ratio, ex.desc, ex.color);
    });
  }

  // ══════════════════════════════════════════
  // ACT 3: STEP-GROWTH & CROSSLINKING (Slides 9–13)
  // ══════════════════════════════════════════

  // ── Slide 9: Step-Growth Polymerization ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    titleAndRule(s, "Step-Growth Polymerization");
    simDot(s, MX, 1.05, C.dotStep);

    bodyText(s, [
      { text: "AA + BB → Polymer + H₂O", options: { fontSize: 16, fontFace: F.title, color: C.primary, bold: true, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Two types of monomers, each with two reactive ends:", options: { fontSize: 14, breakLine: true } },
      { text: "▪ Diamine (AA) — two –NH₂ amine groups", options: { fontSize: 14, breakLine: true } },
      { text: "▪ Diacid (BB) — two –COOH acid groups", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "No initiator. Any molecule can react with any other — chains merge together. Every bond formed releases a water molecule (H₂O).", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "The Catch: Need >99% Conversion", options: { fontSize: 14, fontFace: F.title, color: C.copper, bold: true, breakLine: true } },
      { text: "Carothers equation: DP = 1/(1-p). At 90% conversion you only get DP=10. You need 99%+ for high molecular weight.", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Stoichiometric imbalance (too much A or B) deliberately caps molecular weight — a useful industrial control knob.", options: { fontSize: 13, italic: true, color: C.mutedText } },
    ], MX, 1.35, 5.3, 3.7);

    addScreenshot(s, "step-growth.png", 5.5, 1.2, 3.9, 3.5);
    screenshotCaption(s);
  }

  // ── Slide 10: Nylon & Step-Growth Materials ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    titleAndRule(s, "Step-Growth Polymers in the Real World");

    const cardW4 = (CW - 0.6) / 2, cardH4 = 1.5, gridY = 1.35;
    const materials = [
      { title: "Nylon-6,6", body: "The first synthetic fiber. Used in clothing, carpets, and rope. Made from hexamethylene diamine + adipic acid.", emoji: "🧦", color: C.dotStep },
      { title: "PET (Polyester)", body: "Plastic bottles and clothing fibers. The most recycled plastic. Made from terephthalic acid + ethylene glycol.", emoji: "🧴", color: C.dotCopolymer },
      { title: "Polycarbonate", body: "Impact-resistant eyeglass lenses, CDs, and aircraft windows. Transparent and exceptionally tough.", emoji: "👓", color: C.primary },
      { title: "Kevlar", body: "Bulletproof vests and aerospace composites. 5× stronger than steel by weight. Aromatic polyamide.", emoji: "🛡️", color: C.copper },
    ];

    materials.forEach((m, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const cx = MX + col * (cardW4 + 0.6);
      const cy = gridY + row * (cardH4 + 0.3);

      s.addShape("rect", { x: cx, y: cy, w: cardW4, h: cardH4, fill: { color: C.cardBg }, shadow: cardShadow() });
      s.addShape("rect", { x: cx, y: cy, w: 0.05, h: cardH4, fill: { color: m.color } });
      s.addText(m.emoji, { x: cx + 0.2, y: cy + 0.2, w: 0.5, h: 0.5, fontSize: 28, margin: 0 });
      s.addText(m.title, { x: cx + 0.75, y: cy + 0.2, w: cardW4 - 1.0, h: 0.35, fontSize: 15, fontFace: F.title, color: m.color, bold: true, margin: 0 });
      s.addText(m.body, { x: cx + 0.2, y: cy + 0.7, w: cardW4 - 0.5, h: 0.7, fontSize: 12, fontFace: F.body, color: C.bodyDark, margin: 0 });
    });

    s.addText("Key insight: The A:B monomer ratio controls molecular weight. A slight imbalance caps the maximum chain length — industry uses this to target specific material properties.", {
      x: MX, y: 4.6, w: CW, h: 0.7, fontSize: 12, fontFace: F.body, color: C.mutedText, italic: true, margin: 0,
    });
  }

  // ── Slide 11: Crosslinking ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    titleAndRule(s, "Crosslinking — Building a 3D Network");
    simDot(s, MX, 1.05, C.dotCrosslink);

    bodyText(s, [
      { text: "From Linear Chains to a 3D Network", options: { fontSize: 16, fontFace: F.title, color: C.primary, bold: true, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Start with a 2EHA/AA copolymer. Add a bifunctional crosslinker that reacts with AA (-COOH) groups on different chains:", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Chain A — AA — Crosslinker — AA — Chain B", options: { fontSize: 14, bold: true, color: C.dotCrosslink, align: "center", breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Each bridge connects two separate chains. As more bridges form, the material transforms from a viscous liquid into a solid gel. Crosslinked AA units are marked in hot pink.", options: { fontSize: 14, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Why crosslink? Linear polymers can flow and creep. Crosslinked networks are dimensionally stable — they don’t dissolve, they swell. This is the chemistry behind superabsorbents, coatings, and hydrogels.", options: { fontSize: 14 } },
    ], MX, 1.35, 5.3, 3.7);

    addScreenshot(s, "crosslink.png", 5.5, 1.2, 3.9, 3.5);
    s.addText("Hot pink = crosslinked AA segments and bridges between chains", {
      x: MX, y: 5.1, w: CW, h: 0.3, fontSize: 10, fontFace: F.body, color: C.mutedText, italic: true, margin: 0,
    });
  }

  // ── Slide 12: Crosslinking in the Real World ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    titleAndRule(s, "Crosslinking in the Real World");

    const cardW4 = (CW - 0.6) / 2, cardH4 = 1.5, gridY = 1.35;
    const apps = [
      { title: "PSA — Pressure-Sensitive Adhesive", xl: "1%", body: "Sticky notes, removable tape, labels. Just enough crosslinking to hold shape while staying tacky.", emoji: "📝", color: C.dotRadical },
      { title: "SAP — Superabsorbent Polymer", xl: "10%", body: "Diapers, water-retention gels. Crosslinks trap water inside the network without dissolving.", emoji: "💧", color: C.dotCopolymer },
      { title: "Hard Coatings", xl: "30%", body: "Automotive clear coat, protective finishes. Dense crosslinking = scratch resistance and chemical durability.", emoji: "🚗", color: C.copper },
      { title: "Hydrogels", xl: "5%", body: "Contact lenses, wound dressings, drug delivery. Absorb water while maintaining shape and flexibility.", emoji: "🩹", color: C.dotCrosslink },
    ];

    apps.forEach((app, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const cx = MX + col * (cardW4 + 0.6);
      const cy = gridY + row * (cardH4 + 0.25);

      s.addShape("rect", { x: cx, y: cy, w: cardW4, h: cardH4, fill: { color: C.cardBg }, shadow: cardShadow() });
      s.addShape("rect", { x: cx, y: cy, w: 0.05, h: cardH4, fill: { color: app.color } });
      s.addText(app.emoji, { x: cx + 0.15, y: cy + 0.15, w: 0.5, h: 0.5, fontSize: 28, margin: 0 });
      s.addText(app.title, { x: cx + 0.7, y: cy + 0.12, w: cardW4 - 1.6, h: 0.3, fontSize: 14, fontFace: F.title, color: app.color, bold: true, margin: 0 });
      // XL badge
      s.addShape("rect", { x: cx + cardW4 - 1.15, y: cy + 0.15, w: 0.95, h: 0.28, fill: { color: app.color } });
      s.addText(app.xl + " XL", { x: cx + cardW4 - 1.15, y: cy + 0.15, w: 0.95, h: 0.28, fontSize: 10, fontFace: F.body, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
      s.addText(app.body, { x: cx + 0.2, y: cy + 0.65, w: cardW4 - 0.5, h: 0.75, fontSize: 12, fontFace: F.body, color: C.bodyDark, margin: 0 });
    });

    s.addText("Adjust the crosslinker percentage in the simulator to see the network tighten in real time", {
      x: MX, y: 4.7, w: CW, h: 0.4, fontSize: 11, fontFace: F.body, color: C.mutedText, italic: true, margin: 0,
    });
  }

  // ── Slide 13: The Gel Point ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    titleAndRule(s, "The Gel Point — When Everything Connects");

    s.addText("Before the gel point, the system is a liquid with growing clusters. At the gel point, one giant connected network spans the entire system. After — a solid gel that won’t dissolve.", {
      x: MX, y: 1.15, w: CW, h: 0.65, fontSize: 14, fontFace: F.body, color: C.bodyDark, margin: 0,
    });

    const panelW = (CW - 0.5) / 2, panelY = 2.0, panelH = 2.6;

    // Before gel
    s.addShape("rect", { x: MX, y: panelY, w: panelW, h: panelH, fill: { color: C.cardBg }, shadow: cardShadow() });
    s.addText("Before Gel Point", { x: MX + 0.2, y: panelY + 0.1, w: panelW - 0.4, h: 0.35, fontSize: 16, fontFace: F.title, color: C.mutedText, bold: true, margin: 0 });

    const clusters = [[MX+0.6, panelY+1.0], [MX+2.2, panelY+0.9], [MX+0.4, panelY+1.8], [MX+1.4, panelY+1.5], [MX+2.8, panelY+1.8]];
    clusters.forEach(([cx, cy]) => {
      s.addShape("ellipse", { x: cx, y: cy, w: 0.4, h: 0.4, fill: { color: C.mutedText, transparency: 40 } });
    });
    s.addText("Small, disconnected clusters", { x: MX + 0.2, y: panelY + panelH - 0.6, w: panelW - 0.4, h: 0.35, fontSize: 11, fontFace: F.body, color: C.mutedText, italic: true, margin: 0 });

    // After gel
    const afterX = MX + panelW + 0.5;
    s.addShape("rect", { x: afterX, y: panelY, w: panelW, h: panelH, fill: { color: C.cardBg }, shadow: cardShadow() });
    s.addShape("rect", { x: afterX, y: panelY, w: 0.05, h: panelH, fill: { color: C.dotCrosslink } });
    s.addText("After Gel Point", { x: afterX + 0.2, y: panelY + 0.1, w: panelW - 0.4, h: 0.35, fontSize: 16, fontFace: F.title, color: C.dotCrosslink, bold: true, margin: 0 });

    // Network diagram
    s.addShape("ellipse", { x: afterX + 0.8, y: panelY + 0.7, w: 2.3, h: 1.5, fill: { color: C.dotCrosslink, transparency: 30 } });
    s.addShape("line", { x: afterX + 0.5, y: panelY + 1.0, w: 2.8, h: 0.2, line: { color: C.dotCrosslink, width: 2 } });
    s.addShape("line", { x: afterX + 1.0, y: panelY + 0.8, w: 1.8, h: 1.0, line: { color: C.dotCrosslink, width: 2 } });
    s.addText("One giant connected network", { x: afterX + 0.2, y: panelY + panelH - 0.6, w: panelW - 0.4, h: 0.35, fontSize: 11, fontFace: F.body, color: C.dotCrosslink, italic: true, margin: 0 });

    // Bottom note
    s.addText("In the crosslinking simulator, the gel point is detected when >50% of all chains are connected into a single network. The gel point is latched — once reached, the material is permanently gelled.", {
      x: MX, y: panelY + panelH + 0.15, w: CW, h: 0.55, fontSize: 12, fontFace: F.body, color: C.bodyDark, margin: 0,
    });
  }

  // ══════════════════════════════════════════
  // ACT 4: PLATFORM & TRY IT (Slides 14–17)
  // ══════════════════════════════════════════

  // ── Slide 14: The Polymer Simulation Lab ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    titleAndRule(s, "The Polymer Simulation Lab");

    s.addText("Four interactive experiments. Zero install. Runs in your browser.", {
      x: MX, y: 1.1, w: CW, h: 0.35, fontSize: 14, fontFace: F.body, color: C.mutedText, italic: true, margin: 0,
    });

    addScreenshot(s, "landing.png", MX, 1.55, CW, 2.4);

    const miniW = (CW - 0.6) / 4, miniY = 4.2;
    const sims = [
      { name: "Free-Radical", desc: "Chain-growth kinetics", color: C.dotRadical },
      { name: "Copolymer", desc: "Mayo-Lewis two monomers", color: C.dotCopolymer },
      { name: "Step-Growth", desc: "AA+BB condensation", color: C.dotStep },
      { name: "Crosslinking", desc: "3D network formation", color: C.dotCrosslink },
    ];
    sims.forEach((sim, i) => {
      const sx = MX + i * (miniW + 0.2);
      s.addShape("ellipse", { x: sx, y: miniY, w: 0.14, h: 0.14, fill: { color: sim.color } });
      s.addText(sim.name, { x: sx + 0.2, y: miniY - 0.03, w: miniW - 0.3, h: 0.25, fontSize: 12, fontFace: F.title, color: sim.color, bold: true, margin: 0 });
      s.addText(sim.desc, { x: sx, y: miniY + 0.3, w: miniW, h: 0.3, fontSize: 10, fontFace: F.body, color: C.mutedText, margin: 0 });
    });
  }

  // ── Slide 15: How It's Built ──
  {
    const s = pres.addSlide();
    s.background = { color: C.bgLight };
    titleAndRule(s, "How the Simulator Is Built");

    const colW3 = (CW - 0.8) / 3, colY = 1.5, colH = 3.0;
    const cols = [
      { title: "Zero Dependencies", body: "Pure vanilla JavaScript. No frameworks, no npm install, no build step. ES modules in source files, concatenated bundles for file:// compatibility.", color: C.dotRadical },
      { title: "Canvas 2D Rendering", body: "Hardware-accelerated drawing via HTML5 Canvas. devicePixelRatio-aware for sharp Retina/HiDPI displays. Smooth 60fps requestAnimationFrame loop.", color: C.dotCopolymer },
      { title: "Modular Architecture", body: "Shared lib/ with generic Renderer and UIBase. Each simulator in its own directory. Theme-parameterized — the same renderer drives all 4 simulators.", color: C.dotStep },
    ];

    cols.forEach((col, i) => {
      const cx = MX + i * (colW3 + 0.4);

      s.addShape("rect", { x: cx, y: colY, w: colW3, h: colH, fill: { color: C.cardBg }, shadow: cardShadow() });
      s.addShape("ellipse", { x: cx + colW3 / 2 - 0.3, y: colY + 0.2, w: 0.6, h: 0.6, fill: { color: col.color } });
      s.addText(String(i + 1), { x: cx + colW3 / 2 - 0.3, y: colY + 0.2, w: 0.6, h: 0.6, fontSize: 18, fontFace: F.title, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
      s.addText(col.title, { x: cx + 0.2, y: colY + 1.0, w: colW3 - 0.4, h: 0.35, fontSize: 14, fontFace: F.title, color: col.color, bold: true, align: "center", margin: 0 });
      s.addText(col.body, { x: cx + 0.2, y: colY + 1.45, w: colW3 - 0.4, h: colH - 1.6, fontSize: 12, fontFace: F.body, color: C.bodyDark, align: "center", margin: 0 });
    });

    s.addText("Open source  ·  GitHub  ·  Built for chemistry education", {
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
    s.addShape("rect", copperRule(SW / 2 - 0.8, 2.1, 1.6));

    // URL display box
    s.addShape("rect", { x: SW / 2 - 1.8, y: 2.4, w: 3.6, h: 1.8, fill: { color: "FFFFFF" } });
    s.addText("Open in your browser:", {
      x: SW / 2 - 1.8, y: 2.55, w: 3.6, h: 0.45, fontSize: 13, fontFace: F.body, color: C.bodyDark, align: "center", valign: "middle", margin: 0,
    });
    s.addText("localhost:8765", {
      x: SW / 2 - 1.8, y: 3.05, w: 3.6, h: 0.6, fontSize: 22, fontFace: F.body, color: C.copper, bold: true, align: "center", valign: "middle", margin: 0,
    });
    s.addText("No install needed", {
      x: SW / 2 - 1.8, y: 3.65, w: 3.6, h: 0.4, fontSize: 12, fontFace: F.body, color: C.mutedText, align: "center", valign: "middle", margin: 0,
    });

    s.addText([
      { text: "Open in any modern browser", options: { breakLine: true } },
      { text: "No install  ·  No signup  ·  No setup", options: { breakLine: true } },
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
    s.addShape("rect", copperRule(SW / 2 - 0.8, 2.65, 1.6));
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

  // ── Write ──
  const outPath = path.join(__dirname, "..", "Polymer-Simulation-Lab.pptx");
  await pres.writeFile({ fileName: outPath });
  console.log("Done: " + outPath);
}

build().catch(err => { console.error("Build failed:", err); process.exit(1); });
