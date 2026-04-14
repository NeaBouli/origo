// BUG-001-E — Fossil decay job (daily cron)
import cron from 'node-cron';
import { db } from '../db/client.js';

const DECAY_LIMIT = 30;
const EXTINCTION_DENSITY = 0.35; // 35% fossil density triggers extinction event

export function startFossilJob() {
  // Run daily at 02:00 UTC
  cron.schedule('0 2 * * *', async () => {
    console.log('[Fossil] Daily decay job running...');
    try {
      // Increment decay_day for all active fossils
      const decayed = await db.query(
        `UPDATE fossils SET decay_day = decay_day + 1
         WHERE status = 'active' RETURNING id, decay_day`
      );
      console.log(`[Fossil] Decayed ${decayed.rowCount} fossils`);

      // Expire fossils past limit
      const expired = await db.query(
        `UPDATE fossils SET status = 'expired'
         WHERE status = 'active' AND decay_day >= $1 RETURNING id`,
        [DECAY_LIMIT]
      );
      if (expired.rowCount > 0) {
        console.log(`[Fossil] Expired ${expired.rowCount} fossils (>= ${DECAY_LIMIT} days)`);
      }

      // Check extinction density per planet
      await _checkExtinction();
    } catch (err) {
      console.error('[Fossil] Job error:', err.message);
    }
  });

  console.log('[Fossil] Cron scheduled: daily 02:00 UTC');
}

async function _checkExtinction() {
  const result = await db.query(
    `SELECT planet, COUNT(*) AS fossil_count FROM fossils
     WHERE status = 'active' GROUP BY planet`
  );

  for (const row of result.rows) {
    // Rough density check (fossils vs grid size)
    // Real implementation would compare against active cells
    const density = row.fossil_count / 1000000; // rough estimate
    if (density > EXTINCTION_DENSITY) {
      console.warn(`[Fossil] EXTINCTION EVENT on ${row.planet}! Density: ${(density * 100).toFixed(1)}%`);
      await db.query(
        `UPDATE fossils SET status = 'expired' WHERE planet = $1 AND status = 'active'`,
        [row.planet]
      );
    }
  }
}
