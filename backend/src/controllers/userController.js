const userModel = require('../models/userModel');
const { hashPassword } = require('../utils/password');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const toUser = (row) => ({ id: row.id, name: row.name, email: row.email, role: row.role, status: row.status, createdAt: row.created_at, lastLogin: row.last_login, teacherId: row.teacher_id ?? null });

exports.list = asyncHandler(async (req, res) => res.json({ users: (await userModel.list()).map(toUser) }));

exports.create = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'moderator' } = req.body || {};
  if (!name || !email || !password)
    return res.status(400).
    json({ errors: ['name, email and password are required'] });

  if (!['admin', 'moderator'].includes(role)) 
    return res.status(400).json({ error: 'Invalid role' });
  if (password.length < 8) return res.status(400).
  json({ error: 'Password must be at least 8 characters' });

  const user = await userModel.create({ name: name.trim(), email: email.trim(), passwordHash: hashPassword(password), role });
  res.status(201).json({ user: toUser(user) });
});

exports.update = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body || {};
  if (!name || !email || !['admin', 'moderator'].includes(role)) 
    return res.status(400).
    json({ error: 'name, email and a valid role are required' });
  const user = await userModel.update(req.params.id, { name: name.trim(), email: email.trim(), role });
  res.json({ user: toUser(user) });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const status = req.body?.status;
  if (!['active', 'inactive'].includes(status)) 
    return res.status(400).json({ error: 'Invalid status' });
  const user = await userModel.update(req.params.id, { status });
  res.json({ user: toUser(user) });
});

module.exports = exports;