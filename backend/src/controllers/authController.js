const userModel = require('../models/userModel');
const studentModel = require('../models/studentModel');
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
  if (row.student_id != null) user.studentId = row.student_id;

  return user;
}

function validateRegistration({ name, email, password }) {
  const errors = [];
  if (typeof name !== 'string' || name.trim().length < 2) errors.push('name must be at least 2 characters');
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) errors.push('a valid email is required');
  if (typeof password !== 'string' || password.length < 8) errors.push('password must be at least 8 characters');
  return errors;
}

function validateStudentRegistration({ department_id, gender, date_of_birth, photo }) {
  const errors = [];
  if (department_id != null && department_id !== '') {
    const n = Number.parseInt(department_id, 10);
    if (!Number.isInteger(n) || n <= 0) errors.push('department_id must be a positive integer');
  }
  if (gender != null && gender !== '') {
    const g = String(gender).toLowerCase();
    if (!['male', 'female', 'other'].includes(g)) errors.push('gender must be one of: male, female, other');
  }
  if (date_of_birth != null && date_of_birth !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)) {
    errors.push('date_of_birth must be in YYYY-MM-DD format');
  }
  if (photo != null && photo !== '' &&
    (typeof photo !== 'string' || !/^data:image\/(jpeg|png|gif);base64,/.test(photo) || photo.length > 4_000_000)) {
    errors.push('photo must be a valid JPG, PNG or GIF image smaller than 3 MB');
  }
  return errors;
}

function isStudentRegistration(body) {
  return body && (
    body.student_code !== undefined ||
    body.department_id !== undefined ||
    body.date_of_birth !== undefined ||
    body.gender !== undefined
  );
}

exports.register = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { name, email, password } = body;
  const errors = validateRegistration({ name, email, password });
  if (errors.length) return res.status(400).json({ errors });

  const normalizedEmail = email.trim().toLowerCase();
  if (await userModel.findByEmail(normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  if (isStudentRegistration(body)) {
    const studentErrors = validateStudentRegistration(body);
    if (studentErrors.length) return res.status(400).json({ errors: studentErrors });

    const fullName = name.trim();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    try {
      const user = await userModel.create({
        name: fullName,
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        role: 'student',
        avatarUrl: body.photo && body.photo !== '' ? body.photo : null,
      });

      let student;
      try {
        student = await studentModel.createStudent({
          code: body.student_code && body.student_code !== '' ? String(body.student_code).trim() : undefined,
          first_name: firstName,
          last_name: lastName,
          email: normalizedEmail,
          phone: body.phone || null,
          department_id: body.department_id && body.department_id !== '' ? Number.parseInt(body.department_id, 10) : null,
          gender: body.gender || null,
          date_of_birth: body.date_of_birth || null,
          address: body.address || null,
        });
        await userModel.update(user.id, { student_id: student.id });
      } catch (error) {
        await userModel.remove(user.id);
        throw error;
      }

      const fresh = await userModel.findById(user.id);
      return res.status(201).json({ user: toSessionUser(fresh) });
    } catch (error) {
      if (error && error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'An account with this email or student code already exists' });
      }
      if (error && error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ error: 'The selected department does not exist' });
      }
      throw error;
    }
  }

  try {
    const user = await userModel.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
    });
    await studentModel.ensureStudentForUser(user);
    const fresh = await userModel.findById(user.id);
    return res.status(201).json({ user: toSessionUser(fresh) });
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
