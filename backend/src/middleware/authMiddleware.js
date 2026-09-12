const userModel = require('../models/userModel');
const { verifyToken } = require('../utils/token');

function parseBearer(header) {
  if (typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function requireAuth(req, res, next) {
  const token = parseBearer(req.get('authorization'));
  if (!token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = await userModel.findById(Number.parseInt(payload.sub, 10));
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'Invalid or inactive user' });
  }

  req.user = user;
  next();
}

module.exports = { requireAuth };
