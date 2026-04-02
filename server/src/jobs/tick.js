// Conway tick job — drives simulation at TICK_MS interval
import { ConwayEngine, PATTERNS } from '../engine/conway.js';
import { redis } from '../cache/redis.js';
import { TICK_MS, GRID_COLS, GRID_ROWS, WS } from '@origo/core/src/constants.js';

const engine = new ConwayEngine(GRID_COLS, GRID_ROWS);
let tickInterval = null;

export async function startTick(broker) {
  // Load persisted grid from Redis if exists
  const saved = await redis.get('grid:state');
  if (saved) {
    engine.load(JSON.parse(saved));
    console.log(`[Tick] Restored grid at generation ${engine.generation}`);
  } else {
    // Seed initial world with demo factions
    _seedInitialWorld();
    console.log('[Tick] Fresh world seeded');
  }

  tickInterval = setInterval(async () => {
    const delta = engine.tick();

    // Broadcast delta to all connected clients
    if (delta.length > 0) {
      broker.broadcast({
        type: WS.DELTA,
        cells: delta,
        gen:   engine.generation,
      });
    }

    // Persist to Redis every 100 ticks (~10 seconds)
    if (engine.generation % 100 === 0) {
      await redis.set('grid:state',   JSON.stringify(engine.serialize()));
      await redis.set('grid:gen',     engine.generation);
    }
  }, TICK_MS);

  console.log(`[Tick] Running at ${TICK_MS}ms interval`);
}

export function stopTick() {
  clearInterval(tickInterval);
}

export function getEngine() {
  return engine;
}

export function getSnapshot() {
  return engine.snapshot();
}

// Place cells for a faction (called from WS handler)
export function placeCells(cells, factionId) {
  for (const [r, c] of cells) {
    if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
      engine.set(r, c, factionId);
    }
  }
}

function _seedInitialWorld() {
  // Seed a few starter patterns to make the world feel alive from day 1
  const seeds = [
    { pattern: PATTERNS.glider,     r: 10,  c: 10,  fid: 1 },
    { pattern: PATTERNS.rpentomino, r: 20,  c: 50,  fid: 2 },
    { pattern: PATTERNS.acorn,      r: 50,  c: 20,  fid: 3 },
    { pattern: PATTERNS.spaceship,  r: 30,  c: 80,  fid: 1 },
    { pattern: PATTERNS.pulsar,     r: 60,  c: 60,  fid: 2 },
  ];

  for (const { pattern, r, c, fid } of seeds) {
    engine.seed(pattern, r, c, fid);
  }
}
