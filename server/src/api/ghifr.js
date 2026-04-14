// BUG-001-C — GHIFR Economy API
import { Router } from 'express';
import { db } from '../db/client.js';
import { redis } from '../cache/redis.js';
import { authenticateJWT } from './auth.js';

export const ghifrRouter = Router();

// GET /api/ghifr/balance
ghifrRouter.get('/balance', authenticateJWT, async (req, res) => {
  try {
    if (!req.user.factionId) return res.status(404).json({ error: 'No faction' });
    const balance = await getBalance(req.user.factionId);
    res.json({ factionId: req.user.factionId, balance });
  } catch (err) {
    console.error('[GHIFR] Balance error:', err.message);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// GET /api/ghifr/history
ghifrRouter.get('/history', authenticateJWT, async (req, res) => {
  try {
    if (!req.user.factionId) return res.status(404).json({ error: 'No faction' });
    const result = await db.query(
      `SELECT amount, type, tick, created_at FROM ghifr_ledger
       WHERE faction_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.user.factionId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[GHIFR] History error:', err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/ghifr/pool
ghifrRouter.get('/pool', async (_req, res) => {
  try {
    const totalResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM ghifr_ledger WHERE type = 'earn'`
    );
    const activeResult = await db.query(
      'SELECT COUNT(*) AS count FROM factions WHERE active = true'
    );
    const gen = await redis.get('grid:gen') || 0;

    res.json({
      totalDistributed: parseFloat(totalResult.rows[0].total),
      activeFactions: parseInt(activeResult.rows[0].count),
      currentGeneration: parseInt(gen),
      ratePerTick: 1.0, // base rate — 1 GHIFR per tick distributed proportionally
    });
  } catch (err) {
    console.error('[GHIFR] Pool error:', err.message);
    res.status(500).json({ error: 'Failed to fetch pool info' });
  }
});

// Helper: get balance for a faction
export async function getBalance(factionId) {
  const result = await db.query(
    'SELECT COALESCE(SUM(amount), 0) AS balance FROM ghifr_ledger WHERE faction_id = $1',
    [factionId]
  );
  return parseFloat(result.rows[0].balance);
}
