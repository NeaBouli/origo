// Layer transition detection — checks if factions qualify for promotion
import { db } from '../db/client.js';
import { PATTERNS } from './conway.js';

const CHECK_INTERVAL = 50; // ticks
const STABILITY_THRESHOLD = 50; // generations a pattern must be stable

// Track pattern stability per faction
const stabilityMap = new Map(); // factionId → { patternId, stableGens }

export function checkLayerTransition(engine, generation, broker) {
  if (generation % CHECK_INTERVAL !== 0) return;

  // Simple check: count alive cells per faction
  const cellCounts = {};
  for (let i = 0; i < engine.grid.length; i++) {
    const fid = engine.grid[i];
    if (fid > 0) cellCounts[fid] = (cellCounts[fid] || 0) + 1;
  }

  // Check each faction with significant cell count
  for (const [fid, count] of Object.entries(cellCounts)) {
    if (count < 20) continue; // too small to qualify

    const entry = stabilityMap.get(fid) || { stableGens: 0 };
    entry.stableGens += CHECK_INTERVAL;
    stabilityMap.set(fid, entry);

    if (entry.stableGens >= STABILITY_THRESHOLD * CHECK_INTERVAL) {
      _promoteLayer(fid, broker);
      stabilityMap.delete(fid);
    }
  }
}

async function _promoteLayer(factionId, broker) {
  try {
    const result = await db.query(
      'UPDATE factions SET layer = layer + 1 WHERE id = $1 RETURNING id, name, layer',
      [factionId]
    );
    if (result.rows.length > 0) {
      const faction = result.rows[0];
      console.log(`[Layer] ${faction.name} promoted to layer ${faction.layer}`);
      if (broker) {
        broker.broadcastEvent('layer_up', {
          factionId: faction.id,
          name: faction.name,
          layer: faction.layer,
        });
      }
    }
  } catch (err) {
    console.error('[Layer] Promotion error:', err.message);
  }
}
