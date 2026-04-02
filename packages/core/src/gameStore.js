// Zustand game store — shared between web and mobile
import { create } from 'zustand';
import { applyDelta, countFactions } from './grid.js';
import { GRID_COLS, GRID_ROWS } from './constants.js';

export const createGameStore = () => create((set, get) => ({
  // Grid state
  grid:       new Uint8Array(GRID_ROWS * GRID_COLS),
  generation: 0,
  cols:       GRID_COLS,
  rows:       GRID_ROWS,

  // Faction state
  myFactionId:   null,
  myFactionColor:'#00ff88',
  factions:      {},       // { id: { name, color, layer, cells } }

  // GHIFR
  ghifrBalance:  0,
  ghifrHistory:  [],

  // UI state
  zoom:          'macro',  // macro | meso | micro
  activePlanet:  'earth',
  loading:       true,
  connected:     false,

  // Events
  events:        [],

  // Actions
  setConnected: (v) => set({ connected: v, loading: false }),

  applySnapshot: (grid, gen) => {
    const counts = countFactions(grid);
    set(state => ({
      grid,
      generation: gen,
      factions: updateFactionCells(state.factions, counts),
    }));
  },

  applyDelta: (delta, gen) => {
    set(state => {
      const next = applyDelta(state.grid, state.cols, delta);
      const counts = countFactions(next);
      return {
        grid: next,
        generation: gen,
        factions: updateFactionCells(state.factions, counts),
      };
    });
  },

  updateGHIFR: (balance, delta) => {
    set(state => ({
      ghifrBalance: balance,
      ghifrHistory: [...state.ghifrHistory.slice(-99), { balance, delta, ts: Date.now() }],
    }));
  },

  setMyFaction: (faction) => set({
    myFactionId:    faction.id,
    myFactionColor: faction.color,
  }),

  setFactions: (factions) => set({ factions }),

  addEvent: (event) => set(state => ({
    events: [event, ...state.events.slice(0, 49)],
  })),

  setZoom: (zoom) => set({ zoom }),
  setPlanet: (planet) => set({ activePlanet: planet }),
}));

function updateFactionCells(factions, counts) {
  const updated = { ...factions };
  for (const [id, cells] of Object.entries(counts)) {
    if (updated[id]) updated[id] = { ...updated[id], cells };
  }
  return updated;
}
