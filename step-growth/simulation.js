export class Simulation {
  constructor() {
    this.particles = [];
    this.time = 0;
    this.params = {
      monomerACount: 500,
      monomerBCount: 500,
      rateMultiplier: 5.0,
      speedMultiplier: 10.0,
    };
    this.stats = {
      conversion: 0,
      dp: 0,
      chains: 0,
      deadChains: 0,
      freeMonomerA: 0,
      freeMonomerB: 0,
      byproductCount: 0,
      maxDP: 0,
    };
    this._dpHistory = [];
    this._totalBonds = 0;
    this._initMonomerACount = 0;
    this._initMonomerBCount = 0;
    this._byproductParticles = [];
    this.calloutEvent = null;
    this._canvasW = 800;
    this._canvasH = 500;
    this._tickCounter = 0;
  }

  setCanvasSize(w, h) {
    this._canvasW = w;
    this._canvasH = h;
  }

  setParams(p) {
    Object.assign(this.params, p);
  }

  reset() {
    this.particles = [];
    this.time = 0;
    this._dpHistory = [];
    this._totalBonds = 0;
    this._byproductParticles = [];
    this._tickCounter = 0;
    this.calloutEvent = null;
    this._initParticles();
  }

  _initParticles() {
    const { monomerACount, monomerBCount } = this.params;
    this._initMonomerACount = monomerACount;
    this._initMonomerBCount = monomerBCount;
    this.particles = [];
    const minDist = 15;

    const tooClose = (x, y, existing) => {
      for (const p of existing) {
        const px = p.x;
        const py = p.y;
        if (Math.hypot(x - px, y - py) < minDist) return true;
      }
      return false;
    };

    for (let i = 0; i < monomerACount; i++) {
      let x, y, attempts = 0;
      do {
        x = Math.random() * this._canvasW;
        y = Math.random() * this._canvasH;
        attempts++;
      } while (tooClose(x, y, this.particles) && attempts < 100);

      this.particles.push({
        type: 'monomerA', x, y,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
        radius: 5,
        freeA: 2,
        freeB: 0,
        segments: [{ x, y, monomerType: 0 }],
      });
    }

    for (let i = 0; i < monomerBCount; i++) {
      let x, y, attempts = 0;
      do {
        x = Math.random() * this._canvasW;
        y = Math.random() * this._canvasH;
        attempts++;
      } while (tooClose(x, y, this.particles) && attempts < 100);

      this.particles.push({
        type: 'monomerB', x, y,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
        radius: 5,
        freeA: 0,
        freeB: 2,
        segments: [{ x, y, monomerType: 1 }],
      });
    }

    this._updateStats();
  }

  _chainMobility(chainLength) {
    return 1 / Math.sqrt(1 + (chainLength - 1) * 0.3);
  }

  _moveParticles(dt) {
    const w = this._canvasW;
    const h = this._canvasH;

    for (const p of this.particles) {
      if (p.type === 'byproduct') continue;

      const chainLength = p.segments ? p.segments.length : 1;
      const mobility = this._chainMobility(chainLength);

      p.vx += (Math.random() - 0.5) * 0.5 * Math.sqrt(mobility);
      p.vy += (Math.random() - 0.5) * 0.5 * Math.sqrt(mobility);

      p.vx *= 0.98;
      p.vy *= 0.98;

      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const maxSpeed = 3 * mobility;
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      if (p.segments && p.segments.length > 1) {
        const head = p.segments[p.segments.length - 1];
        head.x += p.vx * dt * 60;
        head.y += p.vy * dt * 60;

        if (head.x < 5) { head.x = 5; p.vx *= -0.5; }
        if (head.x > w - 5) { head.x = w - 5; p.vx *= -0.5; }
        if (head.y < 5) { head.y = 5; p.vy *= -0.5; }
        if (head.y > h - 5) { head.y = h - 5; p.vy *= -0.5; }

        for (let i = 0; i < p.segments.length - 1; i++) {
          const seg = p.segments[i];
          const leader = p.segments[i + 1];
          const dx = leader.x - seg.x;
          const dy = leader.y - seg.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const targetDist = 10;
          if (dist > targetDist) {
            const ratio = (dist - targetDist) / dist;
            seg.x += dx * ratio * 0.8;
            seg.y += dy * ratio * 0.8;
          }
        }
      } else {
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;

        if (p.x < p.radius) { p.x = p.radius; p.vx *= -0.5; }
        if (p.x > w - p.radius) { p.x = w - p.radius; p.vx *= -0.5; }
        if (p.y < p.radius) { p.y = p.radius; p.vy *= -0.5; }
        if (p.y > h - p.radius) { p.y = h - p.radius; p.vy *= -0.5; }
      }
    }
  }

  _processReactions(dt) {
    const rate = this.params.rateMultiplier;
    const k = 8.0 * rate;
    const reactDist = 18;

    const aCandidates = [];
    const bCandidates = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.type === 'byproduct') continue;
      if (p.type === 'oligomer' && p.freeA === 0 && p.freeB === 0) continue;
      if (p.freeA > 0) aCandidates.push(i);
      if (p.freeB > 0) bCandidates.push(i);
    }

    const reacted = new Set();

    for (const ai of aCandidates) {
      if (reacted.has(ai)) continue;
      const particleA = this.particles[ai];
      if (particleA.freeA < 1) continue;

      for (const bi of bCandidates) {
        if (reacted.has(bi)) continue;
        if (ai === bi) continue;
        const particleB = this.particles[bi];
        if (particleB.freeB < 1) continue;

        const posA = particleA.segments
          ? particleA.segments[particleA.segments.length - 1]
          : particleA;
        const posB = particleB.segments
          ? particleB.segments[particleB.segments.length - 1]
          : particleB;

        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < reactDist && Math.random() < k * dt) {
          const newSegments = [
            ...particleA.segments,
            ...particleB.segments,
          ];
          const newFreeA = particleA.freeA + particleB.freeA - 1;
          const newFreeB = particleA.freeB + particleB.freeB - 1;

          const midX = (posA.x + posB.x) / 2;
          const midY = (posA.y + posB.y) / 2;

          const chainLength = newSegments.length;
          const mob = this._chainMobility(chainLength);

          reacted.add(ai);
          reacted.add(bi);

          this.particles.push({
            type: 'oligomer',
            segments: newSegments,
            freeA: newFreeA,
            freeB: newFreeB,
            vx: (particleA.vx + particleB.vx) / 2 + (Math.random() - 0.5) * 0.5 * mob,
            vy: (particleA.vy + particleB.vy) / 2 + (Math.random() - 0.5) * 0.5 * mob,
            radius: 5,
          });

          this._emitByproduct(midX, midY);
          this._totalBonds++;

          this.calloutEvent = {
            title: `Step-growth: bond formed (n=${chainLength})`,
            drawFn: (ctx, cw, ch) => {
              const cx = cw / 2, cy = ch / 2;
              const colors = ['#d97742', '#4888dd'];
              const segCount = Math.min(newSegments.length, 6);
              for (let i = 0; i < segCount; i++) {
                const offsetX = -15 + i * 7;
                ctx.fillStyle = colors[newSegments[i].monomerType];
                ctx.beginPath();
                ctx.arc(cx + offsetX, cy, 5, 0, Math.PI * 2);
                ctx.fill();
              }
              if (newSegments.length > 6) {
                ctx.fillStyle = '#fff';
                ctx.font = '8px sans-serif';
                ctx.fillText('...', cx + 30, cy + 3);
              }
              ctx.fillStyle = '#6abf69';
              ctx.font = '9px sans-serif';
              ctx.fillText(`A:${newFreeA} B:${newFreeB}`, cx - 10, cy - 14);
            },
          };

          break;
        }
      }
    }

    const toRemove = [...reacted].sort((a, b) => b - a);
    for (const idx of toRemove) {
      this.particles.splice(idx, 1);
    }
  }

  _emitByproduct(x, y) {
    this._byproductParticles.push({
      type: 'byproduct',
      x, y,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.5 - Math.random() * 1.0,
      radius: 2,
      alpha: 0.3,
      age: 0,
    });

    if (this._byproductParticles.length > 200) {
      this._byproductParticles.shift();
    }
  }

  _updateByproducts(dt) {
    for (const bp of this._byproductParticles) {
      bp.age += dt;
      bp.alpha = Math.max(0, 0.3 - bp.age * 0.8);
      bp.x += bp.vx * dt * 60;
      bp.y += bp.vy * dt * 60;
      bp.vx += (Math.random() - 0.5) * 0.1;
    }
  }

  _cleanupByproducts() {
    this._byproductParticles = this._byproductParticles.filter(bp => bp.alpha > 0);
  }

  _sampleDPData() {
    const p = this.stats.conversion;
    const dpActual = this.stats.dp;
    const dpTheory = p < 1 ? 1 / (1 - p) : 0;

    this._dpHistory.push({ p, dpTheory, dpActual });

    if (this._dpHistory.length > 200) {
      this._dpHistory = this._dpHistory.filter((_, i) => i % 2 === 0);
    }
  }

  _updateStats() {
    const totalA = this._initMonomerACount;
    const totalB = this._initMonomerBCount;
    const totalGroups = totalA * 2 + totalB * 2;

    const freeA = this._countFree('monomerA') * 2 + this._countFreeGroups('oligomer', 'freeA');
    const freeB = this._countFree('monomerB') * 2 + this._countFreeGroups('oligomer', 'freeB');
    const consumedGroups = totalGroups - freeA - freeB;
    const p = totalGroups > 0 ? consumedGroups / totalGroups : 0;

    const chains = this.particles.filter(p => p.type === 'oligomer' && (p.freeA + p.freeB > 0)).length;
    const deadChains = this.particles.filter(p => p.type === 'oligomer' && p.freeA === 0 && p.freeB === 0).length;
    const totalChains = chains + deadChains;
    const totalSegments = this.particles
      .filter(p => p.type === 'oligomer')
      .reduce((sum, p) => sum + p.segments.length, 0);

    const freeMonomerA = this._countFree('monomerA');
    const freeMonomerB = this._countFree('monomerB');

    // Carothers max DP from stoichiometric imbalance
    const ratio = Math.min(totalA, totalB) / Math.max(totalA, totalB, 1);
    const maxDP = ratio > 0 && ratio < 1 ? Math.round((1 + ratio) / (1 - ratio)) : 0;

    this.stats = {
      conversion: p,
      dp: totalChains > 0 ? totalSegments / totalChains : 0,
      chains,
      deadChains,
      freeMonomerA,
      freeMonomerB,
      byproductCount: this._totalBonds,
      maxDP,
    };
  }

  _countFree(type) {
    return this.particles.filter(p => p.type === type).length;
  }

  _countFreeGroups(type, field) {
    return this.particles
      .filter(p => p.type === type)
      .reduce((sum, p) => sum + (p[field] || 0), 0);
  }

  tick(dt) {
    const speed = this.params.speedMultiplier;
    const scaledDt = dt * speed;
    this.time += scaledDt;

    this._moveParticles(scaledDt);
    this._processReactions(scaledDt);
    this._updateByproducts(dt);
    this._cleanupByproducts();
    this._updateStats();

    this._tickCounter++;
    if (this._tickCounter % 10 === 0) {
      this._sampleDPData();
    }
  }

  getState() {
    const allParticles = [...this.particles, ...this._byproductParticles];
    return { particles: allParticles, stats: this.stats, dpHistory: this._dpHistory };
  }

  getStats() {
    return this.stats;
  }
}
