const userModel = require('../models/userModel');
const studentModel = require('../models/studentModel');
const teacherModel = require('../models/teacherModel');
const { hashPassword } = require('../utils/password');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const toUser = (row) => ({ id: row.id, name: row.name, email: row.email, role: row.role, status: row.status, createdAt: row.created_at, lastLogin: row.last_login, teacherId: row.teacher_id ?? null, studentId: row.student_id ?? null });

const VALID_ROLES = ['admin', 'moderator', 'student'];

// Link the user account to a matching student or teacher record using the email,
// so the account can act as that person. For students a record is auto-created
// when missing. Returns the link column/value pairs.
async function resolveLink(role, email, user) {
  if (role === 'student') {
    const student = await studentModel.ensureStudentForUser({ id: user.id, name: user.name, email });
    return { linked: true, type: 'student', fields: { student_id: student, teacher_id: null } };
  }
  if (role === 'moderator') {
    const teacher = await teacherModel.getTeacherByEmail(email);
    if (!teacher) return { linked: false, type: 'teacher' };
    return { linked: true, type: 'teacher', fields: { teacher_id: teacher.id, student_id: null } };
  }
  // admin (and any other role) — clear both links
  return { linked: false, type: null, fields: { teacher_id: null, student_id: null } };
}

exports.list = asyncHandler(async (req, res) => res.json({ users: (await userModel.list()).map(toUser) }));

exports.create = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'moderator' } = req.body || {};
  if (!name || !email || !password)
    return res.status(400).
    json({ errors: ['name, email and password are required'] });

  if (!VALID_ROLES.includes(role)) 
    return res.status(400).json({ error: 'Invalid role' });
  if (password.length < 8) return res.status(400).
  json({ error: 'Password must be at least 8 characters' });

  const normalizedEmail = email.trim().toLowerCase();
  const user = await userModel.create({ name: name.trim(), email: normalizedEmail, passwordHash: hashPassword(password), role });
  const link = await resolveLink(role, normalizedEmail, user);
  if (link.fields) await userModel.update(user.id, link.fields);

  res.status(201).json({ user: toUser(await userModel.findById(user.id)) });
});

exports.update = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body || {};
  if (!name || !email || !VALID_ROLES.includes(role)) 
    return res.status(400).
    json({ error: 'name, email and a valid role are required' });

  const normalizedEmail = email.trim().toLowerCase();
  const user = await userModel.update(req.params.id, { name: name.trim(), email: normalizedEmail, role });

  if (user) {
    const link = await resolveLink(role, normalizedEmail, user);
    if (link.fields) await userModel.update(user.id, link.fields);
  }

  res.json({ user: toUser(await userModel.findById(req.params.id)) });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const status = req.body?.status;
  if (!['active', 'inactive'].includes(status)) 
    return res.status(400).json({ error: 'Invalid status' });
  const user = await userModel.update(req.params.id, { status });
  res.json({ user: toUser(user) });
});

module.exports = exports;