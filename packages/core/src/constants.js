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
