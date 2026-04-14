// BUG-001-A — Auth API
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from '../db/client.js';

export const authRouter = Router();

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRY = '30d';
const SALT_ROUNDS = 10;

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Email and password (min 8 chars) required' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, hash]
    );
    const userId = result.rows[0].id;

    const token = jwt.sign({ userId, factionId: null }, JWT_SECRET(), { expiresIn: JWT_EXPIRY });
    res.status(201).json({ token, userId });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await db.query(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get faction if exists
    const factionResult = await db.query(
      'SELECT id FROM factions WHERE user_id = $1 AND active = true LIMIT 1',
      [user.id]
    );
    const factionId = factionResult.rows[0]?.id || null;

    const token = jwt.sign({ userId: user.id, factionId }, JWT_SECRET(), { expiresIn: JWT_EXPIRY });
    res.json({ token, userId: user.id, factionId });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticateJWT, async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, created_at FROM users WHERE id = $1', [req.user.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Auth] Me error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Middleware: authenticateJWT
export function authenticateJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET());
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
