export function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const [key, rule] of Object.entries(schema)) {
      const val = req.body[key];
      if (rule.required && (val === undefined || val === null)) {
        errors.push(`${key} is required`);
        continue;
      }
      if (val !== undefined) {
        if (rule.type === 'string') {
          if (typeof val !== 'string') errors.push(`${key} must be a string`);
          else {
            if (rule.min && val.length < rule.min) errors.push(`${key} min length ${rule.min}`);
            if (rule.max && val.length > rule.max) errors.push(`${key} max length ${rule.max}`);
            req.body[key] = val.replace(/<[^>]*>/g, '').trim();
          }
        }
        if (rule.type === 'number') {
          const n = Number(val);
          if (isNaN(n)) errors.push(`${key} must be a number`);
          else {
            if (rule.min !== undefined && n < rule.min) errors.push(`${key} min ${rule.min}`);
            if (rule.max !== undefined && n > rule.max) errors.push(`${key} max ${rule.max}`);
            req.body[key] = n;
          }
        }
        if (rule.hex6) {
          if (!/^#[0-9A-Fa-f]{6}$/.test(val)) errors.push(`${key} must be a valid hex color`);
        }
      }
    }
    if (errors.length) return res.status(400).json({ error: errors.join(', '), code: 'VALIDATION' });
    next();
  };
}
