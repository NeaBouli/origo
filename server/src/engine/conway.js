// Conway Engine — pure JS for Phase 1
// Replace with Rust/WASM in Phase 2 for performance
// Interface is identical — drop-in replacement

import { GRID_COLS, GRID_ROWS } from '@origo/core/src/constants.js';

export class ConwayEngine {
  constructor(cols = GRID_COLS, rows = GRID_ROWS) {
    this.cols = cols;
    this.rows = rows;
    this.grid = new Uint8Array(rows * cols);
    this.generation = 0;
    this.customRules = {}; // { factionId: { survive: [], born: [] } }
  }

  get(r, c) {
    return this.grid[r * this.cols + ((c + this.cols) % this.cols)];
  }

  set(r, c, fid) {
    this.grid[r * this.cols + c] = fid;
  }

  seed(pattern, startRow, startCol, factionId) {
    for (const [dr, dc] of pattern) {
      const r = startRow + dr;
      const c = startCol + dc;
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        this.set(r, c, factionId);
      }
    }
  }

  setCustomRule(factionId, survive, born) {
    this.customRules[factionId] = { survive, born };
  }

  /**
   * Compute next generation.
   * Returns delta: [[row, col, newFactionId], ...]
   */
  tick() {
    const next    = new Uint8Array(this.grid);
    const delta   = [];
    const SURVIVE = new Set([2, 3]);
    const BORN    = new Set([3]);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const neighbors = this._neighbors(r, c);
        const count     = neighbors.length;
        const alive     = this.get(r, c) !== 0;
        const fid       = this.get(r, c);

        // Per-faction custom rule or default Conway
        const rule    = this.customRules[fid] || null;
        const survive = rule ? new Set(rule.survive) : SURVIVE;
        const born    = rule ? new Set(rule.born)    : BORN;

        let nextFid = 0;

        if (alive && survive.has(count)) {
          nextFid = fid; // survives
        } else if (!alive && born.has(count)) {
          nextFid = this._majority(neighbors); // born — majority wins
        }

        if (nextFid !== fid) {
          next[r * this.cols + c] = nextFid;
          delta.push([r, c, nextFid]);
        }
      }
    }

    this.grid = next;
    this.generation++;
    return delta;
  }

  _neighbors(r, c) {
    const ids = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = (r + dr + this.rows) % this.rows;
        const nc = (c + dc + this.cols) % this.cols;
        const fid = this.get(nr, nc);
        if (fid !== 0) ids.push(fid);
      }
    }
    return ids;
  }

  _majority(neighbors) {
    if (neighbors.length === 0) return 0;
    const freq = {};
    for (const id of neighbors) freq[id] = (freq[id] || 0) + 1;
    return parseInt(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
  }

  snapshot() {
    return { grid: Buffer.from(this.grid).toString('base64'), gen: this.generation };
  }

  serialize() {
    return { grid: Array.from(this.grid), gen: this.generation };
  }

  load(data) {
    this.grid = new Uint8Array(data.grid);
    this.generation = data.gen;
  }
}

// Known patterns library (row, col offsets from origin)
export const PATTERNS = {
  glider:    [[0,1],[1,2],[2,0],[2,1],[2,2]],
  blinker:   [[0,0],[0,1],[0,2]],
  block:     [[0,0],[0,1],[1,0],[1,1]],
  beehive:   [[0,1],[0,2],[1,0],[1,3],[2,1],[2,2]],
  pulsar:    [[0,2],[0,3],[0,4],[0,8],[0,9],[0,10],[2,0],[2,5],[2,7],[2,12],[3,0],[3,5],[3,7],[3,12],[4,0],[4,5],[4,7],[4,12],[5,2],[5,3],[5,4],[5,8],[5,9],[5,10]],
  rpentomino:[[0,1],[0,2],[1,0],[1,1],[2,1]],
  acorn:     [[0,1],[1,3],[2,0],[2,1],[2,4],[2,5],[2,6]],
  spaceship: [[0,1],[0,4],[1,0],[2,0],[2,4],[3,0],[3,1],[3,2],[3,3]],
};
