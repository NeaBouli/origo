// Grid utilities — shared between client and server

export const CONWAY_RULES = { survive: [2, 3], born: [3] };

/**
 * Apply a delta patch to a local grid copy.
 * Delta format: [[row, col, factionId], ...]
 * factionId 0 = dead cell
 */
export function applyDelta(grid, cols, delta) {
  const next = new Uint8Array(grid);
  for (const [r, c, fid] of delta) {
    next[r * cols + c] = fid;
  }
  return next;
}

/**
 * Serialize grid to base64 for snapshot transfer.
 */
export function serializeGrid(grid) {
  return btoa(String.fromCharCode(...grid));
}

/**
 * Deserialize base64 snapshot back to Uint8Array.
 */
export function deserializeGrid(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

/**
 * Count cells per faction from grid.
 * Returns { factionId: count, ... }
 */
export function countFactions(grid) {
  const counts = {};
  for (let i = 0; i < grid.length; i++) {
    const fid = grid[i];
    if (fid !== 0) counts[fid] = (counts[fid] || 0) + 1;
  }
  return counts;
}

export function fossilAlpha(decayDay) {
  if (decayDay >= 30) return 0;
  return 1 - (decayDay / 30);
}
