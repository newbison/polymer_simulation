import { Simulation } from './simulation.js';
import { Renderer } from './renderer.js';

const canvas = document.getElementById('sim-canvas');
const sim = new Simulation();
const renderer = new Renderer(canvas);

// Sync canvas size to simulation
function syncSize() {
  const w = renderer.w;
  const h = renderer.h;
  sim.setCanvasSize(w, h);
}

let running = false;
let lastTime = 0;
let animId = null;

function loop(timestamp) {
  if (!running) return;

  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.1) : 0.016; // cap at 100ms
  lastTime = timestamp;

  syncSize();
  sim.tick(dt);
  const { particles, stats } = sim.getState();
  renderer.draw(particles);

  animId = requestAnimationFrame(loop);
}

function play() {
  if (running) return;
  running = true;
  lastTime = 0;
  animId = requestAnimationFrame(loop);
}

function pause() {
  running = false;
  if (animId) cancelAnimationFrame(animId);
}

// Initial setup
syncSize();
sim.reset();
const { particles, stats } = sim.getState();
renderer.draw(particles); // draw initial state

// Auto-play for development verification
play();
