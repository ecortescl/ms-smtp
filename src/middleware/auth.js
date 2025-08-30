export function authMiddleware(req, res, next) {
  const provided = req.header('x-api-token');
  const expected = process.env.API_TOKEN;

  if (!expected) {
    return res.status(500).json({ error: 'API token not configured. Set API_TOKEN env var.' });
  }
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing x-api-token' });
  }
  next();
}
