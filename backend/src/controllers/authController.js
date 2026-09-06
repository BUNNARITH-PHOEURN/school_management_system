const userModel = require('../models/userModel');
const { hashPassword } = require('../utils/password');

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function toSessionUser(row) {
  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    lastLogin: row.last_login,
  };

  if (row.phone != null) user.phone = row.phone;
  if (row.bio != null) user.bio = row.bio;
  if (row.avatar_url != null) user.avatarUrl = row.avatar_url;
  if (row.created_at != null) user.createdAt = row.created_at;

  return user;
}

function validateRegistration({ name, email, password }) {
  const errors = [];
  if (typeof name !== 'string' || name.trim().length < 2) errors.push('name must be at least 2 characters');
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) errors.push('a valid email is required');
  if (typeof password !== 'string' || password.length < 8) errors.push('password must be at least 8 characters');
  return errors;
}

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  const errors = validateRegistration({ name, email, password });
  if (errors.length) return res.status(400).json({ errors });

  const normalizedEmail = email.trim().toLowerCase();
  if (await userModel.findByEmail(normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  try {
    const user = await userModel.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
    });
    return res.status(201).json({ user: toSessionUser(user) });
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    throw error;
  }
});

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
