export function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: isProd ? 'Internal server error' : err.message,
    code:  err.code || 'INTERNAL',
  });
}
