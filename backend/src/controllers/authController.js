const userModel = require('../models/userModel');
const { hashPassword } = require('../utils/password');

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function toSessionUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    lastLogin: row.last_login,
  };
}

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ errors: ['email and password are required'] });
  }

  const user = await userModel.findByEmail(email.trim());
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.password_hash || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  await userModel.updateLastLogin(user.id, new Date());

  const sessionUser = toSessionUser(user);
  sessionUser.lastLogin = new Date();
  res.json({ user: sessionUser });
});

exports.me = asyncHandler(async (req, res) => {
  const id = Number.parseInt(req.headers['x-user-id'] || '', 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await userModel.findById(id);
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({ user: toSessionUser(user) });
});