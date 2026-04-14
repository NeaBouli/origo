// Patterns API — library, voting, discovery
import { Router } from 'express';
import { db } from '../db/client.js';
import { authenticateJWT } from './auth.js';
import { getBalance } from './ghifr.js';

export const patternsRouter = Router();

// GET /api/patterns/library
patternsRouter.get('/library', async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, bitmask, status FROM patterns WHERE status = 'library' ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[Patterns] Library error:', err.message);
    res.status(500).json({ error: 'Failed to fetch patterns' });
  }
});

// GET /api/patterns/unnamed
patternsRouter.get('/unnamed', async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT p.id, p.bitmask, p.discovered_by, p.vote_deadline,
              COUNT(pv.id) AS total_votes
       FROM patterns p LEFT JOIN pattern_votes pv ON pv.pattern_id = p.id
       WHERE p.status = 'unnamed'
       GROUP BY p.id ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[Patterns] Unnamed error:', err.message);
    res.status(500).json({ error: 'Failed to fetch unnamed patterns' });
  }
});

// POST /api/patterns/vote — Quadratic Voting
patternsRouter.post('/vote', authenticateJWT, async (req, res) => {
  try {
    if (!req.user.factionId) return res.status(400).json({ error: 'No faction' });

    const { patternId, proposedName } = req.body;
    if (!patternId || !proposedName || proposedName.length < 2 || proposedName.length > 64) {
      return res.status(400).json({ error: 'patternId and proposedName (2-64 chars) required' });
    }

    // Check pattern exists and is unnamed
    const pattern = await db.query(
      "SELECT id FROM patterns WHERE id = $1 AND status = 'unnamed'",
      [patternId]
    );
    if (pattern.rows.length === 0) {
      return res.status(404).json({ error: 'Pattern not found or not voteable' });
    }

    // Count existing votes by this faction on this pattern
    const existingVotes = await db.query(
      'SELECT COALESCE(SUM(vote_weight), 0) AS total FROM pattern_votes WHERE pattern_id = $1 AND faction_id = $2',
      [patternId, req.user.factionId]
    );
    const currentVotes = parseFloat(existingVotes.rows[0].total);
    const cost = (currentVotes + 1) ** 2; // quadratic cost

    // Check GHIFR balance
    const balance = await getBalance(req.user.factionId);
    if (balance < cost) {
      return res.status(400).json({ error: `Insufficient GHIFR. Cost: ${cost}, balance: ${balance}` });
    }

    // Deduct GHIFR
    await db.query(
      `INSERT INTO ghifr_ledger (faction_id, amount, type) VALUES ($1, $2, 'penalty')`,
      [req.user.factionId, -cost]
    );

    // Insert or update vote
    await db.query(
      `INSERT INTO pattern_votes (pattern_id, faction_id, proposed_name, vote_weight)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (pattern_id, faction_id) DO UPDATE SET
         proposed_name = EXCLUDED.proposed_name,
         vote_weight = pattern_votes.vote_weight + 1`,
      [patternId, req.user.factionId, proposedName]
    );

    res.json({ ok: true, cost, newVoteWeight: currentVotes + 1 });
  } catch (err) {
    console.error('[Patterns] Vote error:', err.message);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// GET /api/patterns/votes/:patternId
patternsRouter.get('/votes/:patternId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT pv.proposed_name, pv.vote_weight, f.name AS faction_name, f.color
       FROM pattern_votes pv JOIN factions f ON f.id = pv.faction_id
       WHERE pv.pattern_id = $1 ORDER BY pv.vote_weight DESC`,
      [req.params.patternId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[Patterns] Votes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
});
