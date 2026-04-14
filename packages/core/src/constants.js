// Game constants — shared across web, mobile, server

export const GRID_COLS = 1000;
export const GRID_ROWS = 1000;
export const TICK_MS   = 100;      // Conway tick interval

// Layers → universe locations
export const LAYERS = {
  0: { name: 'Earth',           planet: 'earth'   },
  1: { name: 'Atmosphere',      planet: 'orbit'   },
  2: { name: 'Solar System',    planet: 'mars'    },
  3: { name: 'Deep Universe',   planet: 'alien'   },
};

// Fossil decay
export const FOSSIL_DECAY_DAYS   = 30;
export const FOSSIL_DECAY_STAGES = [
  { day: 0,  alpha: 1.0  },
  { day: 10, alpha: 0.7  },
  { day: 20, alpha: 0.3  },
  { day: 29, alpha: 0.05 },
  { day: 30, alpha: 0.0  },
];

// GHIFR economy
export const GHIFR_PER_CELL_PER_TICK = 0.08;
export const GHIFR_MIN_WEEKLY        = 10;
export const IFR_BUYBACK_RATIO       = 0.45;

// Pattern recognition
export const PATTERN_STABLE_GENS     = 50;   // gens required for layer transition
export const PATTERN_THRESHOLD_COUNT = 3;    // unique factions before community vote

// Layer transition
export const LAYER_TRANSITION_GENS = 50;

// Extinction
export const EXTINCTION_DENSITY_THRESHOLD = 0.35; // 35% fossil density

// Sector
export const SECTOR_SIZE   = 100;  // cells per sector side
export const BUFFER_CELLS  = 2;    // border buffer always active

// WebSocket message types
export const WS = {
  DELTA:    'delta',
  SNAPSHOT: 'snapshot',
  FACTION:  'faction',
  GHIFR:    'ghifr',
  EVENT:    'event',
  PING:     'ping',
  PONG:     'pong',
};

// ── Lenia constants ───────────────────────────────────────────────────────────

// Phase 1 — render pass only
export const LENIA_KERNEL_RADIUS  = 3;     // Gaussian R for shader
export const LENIA_SIGMA          = 1.2;   // Gaussian sigma

// Phase 3 — true Lenia layer (Layer 3+)
export const LENIA_LAYER_MINIMUM  = 3;     // first layer using Lenia rules
export const LENIA_GRID_W         = 512;   // Lenia grid width  (float32)
export const LENIA_GRID_H         = 512;   // Lenia grid height (float32)
export const LENIA_TICK_MS        = 3000;  // 3s tick (vs 1s Conway)
export const LENIA_DELTA_EPSILON  = 0.001; // min change to include in delta
export const LENIA_CREATURE_SIM_THRESHOLD = 0.92; // cosine sim for known match
export const LENIA_NOVEL_THRESHOLD        = 0.85; // below this = candidate
export const LENIA_STABLE_TICKS           = 50;   // ticks for novel confirmation

// Lenia WS message types (extend existing WS object)
export const WS_LENIA = {
  DELTA: 'lenia_delta',   // server → Layer3+ clients
  STAMP: 'lenia_stamp',   // client → server (player interaction)
};

// GHIFR earning multipliers for Lenia creatures (vs Conway base rate)
export const LENIA_EARN = {
  still:     1.0,  // velocity < 0.5 cells/tick for 10+ ticks
  oscillator:1.5,  // periodic state variance, stable centroid
  spaceship:  2.0, // velocity > 1.0 cells/tick, form maintained 20+ ticks
  novel:      5.0, // community-confirmed novel creature (one-time)
};
