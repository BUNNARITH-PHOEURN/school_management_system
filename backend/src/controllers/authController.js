const userModel = require('../models/userModel');
const { hashPassword } = require('../utils/password');

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function toSessionUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,

    phone: row.phone || '',
    bio: row.bio || '',
    avatarUrl: row.avatar_url || '',
    
    role: row.role,
    status: row.status,

    createdAt: row.created_at,
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


exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, bio, avatarUrl } = req.body || {};
  if (!name || !email) return res.status(400).json({ errors: ['name and email are required'] });
  if (avatarUrl && (!/^data:image\/(jpeg|png|webp|gif);base64,/.test(avatarUrl) || avatarUrl.length > 3_000_000)) {
    return res.status(400).json({ error: 'Photo must be a valid image smaller than 2 MB' });
  }
  const user = await userModel.update(req.user.id, { name: name.trim(), email: email.trim(), phone: phone || null, bio: bio || null, avatar_url: avatarUrl || null });
  res.json({ user: toSessionUser(user) });
});

exports.updatePassword = asyncHandler(async (req, res) => {
  const { current, next } = req.body || {};
  const user = await userModel.findByEmail(req.user.email);
  if (!current || !next || user.password_hash !== hashPassword(current)) return res.status(400).json({ error: 'Current password is incorrect' });
  if (next.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  await userModel.update(req.user.id, { password_hash: hashPassword(next) });
  res.json({ message: 'Password updated' });
});

exports.deactivate = asyncHandler(async (req, res) => {
  await userModel.update(req.user.id, { status: 'inactive' });
  res.json({ message: 'Account deactivated' });
});