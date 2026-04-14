// BUG-001-F — GHIFR pool distribution job
import { db } from '../db/client.js';
import { redis } from '../cache/redis.js';
import { getEngine } from './tick.js';
import { WS } from '@origo/core/src/constants.js';

const BASE_RATE = 1.0; // 1 GHIFR per tick to distribute
const BALANCE_BROADCAST_INTERVAL = 100; // ticks

export function startPoolJob(broker) {
  // Hook into tick cycle — called after each Conway generation
  const engine = getEngine();
  let lastProcessedGen = engine.generation;

  setInterval(async () => {
    const currentGen = engine.generation;
    if (currentGen <= lastProcessedGen) return;
    lastProcessedGen = currentGen;

    try {
      await distributeGHIFR(currentGen, broker);
    } catch (err) {
      console.error('[Pool] Distribution error:', err.message);
    }
  }, 1100); // Slightly longer than tick interval to avoid overlap

  console.log('[Pool] GHIFR distribution started');
}

async function distributeGHIFR(generation, broker) {
  // Count cells per faction from Redis cell counts (set by tick job)
  const countsRaw = await redis.get('grid:cell_counts');
  if (!countsRaw) return;

  let cellCounts;
  try { cellCounts = JSON.parse(countsRaw); } catch { return; }

  const totalCells = Object.values(cellCounts).reduce((a, b) => a + b, 0);
  if (totalCells === 0) return;

  // Proportional distribution
  const entries = [];
  for (const [factionId, count] of Object.entries(cellCounts)) {
    if (count <= 0) continue;
    const share = (count / totalCells) * BASE_RATE;
    if (share < 0.000001) continue;
    entries.push({ factionId, amount: share });
  }

  if (entries.length === 0) return;

  // Batch insert into ghifr_ledger
  const values = entries.map(
    (e, i) => `($${i * 4 + 1}, $${i * 4 + 2}, 'earn', $${i * 4 + 3})`
  ).join(', ');
  const params = entries.flatMap(e => [e.factionId, e.amount, generation]);

  if (params.length > 0) {
    await db.query(
      `INSERT INTO ghifr_ledger (faction_id, amount, type, tick) VALUES ${values}`,
      params
    );
  }

  // Broadcast balance update every N ticks
  if (generation % BALANCE_BROADCAST_INTERVAL === 0 && broker) {
    const balances = await db.query(
      `SELECT faction_id, SUM(amount) AS balance FROM ghifr_ledger
       GROUP BY faction_id`
    );
    broker.broadcast({
      type: WS.EVENT,
      event: 'ghifr_update',
      data: balances.rows,
    });
  }
}
