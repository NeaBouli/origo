import jwt from 'jsonwebtoken';

export function authenticateJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token', code: 'AUTH_REQUIRED' });
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.user = payload; // { userId, factionId }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token', code: 'AUTH_INVALID' });
  }
}
