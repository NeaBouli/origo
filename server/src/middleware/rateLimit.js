const store = new Map();

export function rateLimit({ windowMs = 60000, max = 100, keyFn = (req) => req.ip }) {
  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    const entry = store.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
    entry.count++;
    store.set(key, entry);
    if (entry.count > max) {
      return res.status(429).json({ error: 'Too many requests', code: 'RATE_LIMIT' });
    }
    next();
  };
}

export const defaultLimiter = rateLimit({ windowMs: 60000, max: 100 });
export const voucherLimiter = rateLimit({
  windowMs: 3600000, max: 5,
  keyFn: (req) => `voucher:${req.user?.factionId || req.ip}`,
});
export const placeLimiter = rateLimit({
  windowMs: 60000, max: 10,
  keyFn: (req) => `place:${req.user?.factionId || req.ip}`,
});
