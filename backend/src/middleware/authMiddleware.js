const userModel = require('../models/userModel');

function parseId(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function requireAuth(req, res, next) {
  const userId = parseId(req.get('x-user-id'));
  if (!userId) {
    return res.status(401).json({ error: 'Missing x-user-id header' });
  }

  const user = await userModel.findById(userId);
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'Invalid or inactive user' });
  }

  req.user = user;
  next();
}

module.exports = { requireAuth };