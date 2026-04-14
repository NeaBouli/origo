// BUG-001-B — Faction API
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/client.js';
import { redis } from '../cache/redis.js';
import { authenticateJWT } from './auth.js';
import { getEngine } from '../jobs/tick.js';
import { PATTERNS } from '../engine/conway.js';

export const factionRouter = Router();

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev-secret-change-me';

// POST /api/faction/create
factionRouter.post('/create', authenticateJWT, async (req, res) => {
  try {
    const { name, color, patternId } = req.body;

    if (!name || name.length < 2 || name.length > 24) {
      return res.status(400).json({ error: 'Name must be 2-24 characters' });
    }
    if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return res.status(400).json({ error: 'Color must be valid hex (#RRGGBB)' });
    }
    const pattern = PATTERNS[patternId];
    if (!pattern) {
      return res.status(400).json({ error: `Unknown pattern: ${patternId}`, available: Object.keys(PATTERNS) });
    }

    // Check if user already has a faction
    const existing = await db.query(
      'SELECT id FROM factions WHERE user_id = $1 AND active = true',
      [req.user.userId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You already have an active faction' });
    }

    // Random spawn offset
    const seedRow = 10 + Math.floor(Math.random() * 200);
    const seedCol = 10 + Math.floor(Math.random() * 200);

    const result = await db.query(
      `INSERT INTO factions (user_id, name, color, seed_pattern, seed_row, seed_col)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, color, layer`,
      [req.user.userId, name, color, patternId, seedRow, seedCol]
    );
    const faction = result.rows[0];

    // Seed pattern in Conway engine
    const engine = getEngine();
    const factionIdNum = faction.id.charCodeAt(0); // Simple mapping for engine (uint8)
    engine.seed(pattern, seedRow, seedCol, factionIdNum);

    // Create initial GHIFR ledger entry
    await db.query(
      `INSERT INTO ghifr_ledger (faction_id, amount, type, tick) VALUES ($1, 0, 'bonus', 0)`,
      [faction.id]
    );

    // Issue new JWT with factionId
    const token = jwt.sign(
      { userId: req.user.userId, factionId: faction.id },
      JWT_SECRET(),
      { expiresIn: '30d' }
    );

    res.status(201).json({ token, faction });
  } catch (err) {
    console.error('[Faction] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create faction' });
  }
});

// GET /api/faction/me
factionRouter.get('/me', authenticateJWT, async (req, res) => {
  try {
    if (!req.user.factionId) return res.status(404).json({ error: 'No faction' });

    const result = await db.query(
      `SELECT f.*, COALESCE(SUM(g.amount), 0) AS balance
       FROM factions f LEFT JOIN ghifr_ledger g ON g.faction_id = f.id
       WHERE f.id = $1 GROUP BY f.id`,
      [req.user.factionId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Faction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Faction] Me error:', err.message);
    res.status(500).json({ error: 'Failed to fetch faction' });
  }
});

// GET /api/faction/leaderboard
factionRouter.get('/leaderboard', async (_req, res) => {
  try {
    // Try Redis cache first
    const cached = await redis.get('leaderboard:top50');
    if (cached) return res.json(JSON.parse(cached));

    const result = await db.query(
      `SELECT f.id, f.name, f.color, f.layer, COALESCE(SUM(g.amount), 0) AS balance
       FROM factions f LEFT JOIN ghifr_ledger g ON g.faction_id = f.id
       WHERE f.active = true
       GROUP BY f.id ORDER BY balance DESC LIMIT 50`
    );

    await redis.set('leaderboard:top50', JSON.stringify(result.rows), 'EX', 30);
    res.json(result.rows);
  } catch (err) {
    console.error('[Faction] Leaderboard error:', err.message);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/faction/all
factionRouter.get('/all', async (_req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, color, layer FROM factions WHERE active = true ORDER BY created_at'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[Faction] All error:', err.message);
    res.status(500).json({ error: 'Failed to fetch factions' });
  }
});
