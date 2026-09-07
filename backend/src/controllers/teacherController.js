const teacherModel = require('../models/teacherModel');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const GENDERS = ['male', 'female', 'other'];
const STATUSES = ['active', 'inactive'];

function normalizeString(value) {
  if (value === undefined) return undefined;
  const stringValue = String(value).trim();
  return stringValue === '' ? null : stringValue;
}

function normalizeDate(value) {
  if (value === undefined || value === null || value === '') return null;
  return String(value);
}

function validateTeacher(body, { partial = false } = {}) {
  const errors = [];
  const data = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  if (!partial || has('first_name')) {
    const value = normalizeString(body.first_name);
    if (!value) errors.push('first_name is required');
    else data.first_name = value;
  }
  if (!partial || has('last_name')) {
    const value = normalizeString(body.last_name);
    if (!value) errors.push('last_name is required');
    else data.last_name = value;
  }
  if (!partial || has('email')) {
    const value = normalizeString(body.email);
    if (!value || !EMAIL_REGEX.test(value)) errors.push('a valid email is required');
    else data.email = value;
  }

  if (has('code')) data.code = normalizeString(body.code);
  if (has('phone')) data.phone = normalizeString(body.phone);
  if (has('specialization')) data.specialization = normalizeString(body.specialization);

  if (has('department_id')) {
    if (body.department_id === null || body.department_id === '') {
      data.department_id = null;
    } else {
      const departmentId = Number.parseInt(body.department_id, 10);
      if (!Number.isInteger(departmentId) || departmentId <= 0) {
        errors.push('department_id must be a positive integer');
      } else {
        data.department_id = departmentId;
      }
    }
  }

  if (has('joined_at')) {
    const value = normalizeDate(body.joined_at);
    if (value && !DATE_REGEX.test(value)) errors.push('joined_at must be in YYYY-MM-DD format');
    else data.joined_at = value;
  }
  if (has('gender')) {
    const value = normalizeString(body.gender);
    if (value && !GENDERS.includes(value.toLowerCase())) {
      errors.push(`gender must be one of: ${GENDERS.join(', ')}`);
    } else {
      data.gender = value ? value.toLowerCase() : null;
    }
  }
  if (has('status')) {
    const value = normalizeString(body.status);
    if (value && !STATUSES.includes(value.toLowerCase())) {
      errors.push(`status must be one of: ${STATUSES.join(', ')}`);
    } else {
      data.status = value ? value.toLowerCase() : 'active';
    }
  }

  if (has('user_id')) {
    if (body.user_id === null || body.user_id === '') {
      data.user_id = null;
    } else {
      const userId = Number.parseInt(body.user_id, 10);
      if (!Number.isInteger(userId) || userId <= 0) {
        errors.push('user_id must be a positive integer');
      } else {
        data.user_id = userId;
      }
    }
  }

  return { errors, data };
}

function parseId(id) {
  const parsed = Number.parseInt(id, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

exports.getAllTeachers = asyncHandler(async (req, res) => {
  const teachers = await teacherModel.getAllTeachers();
  res.json(teachers);
});

exports.getTeacherById = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid teacher id' });

  const teacher = await teacherModel.getTeacherById(id);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  res.json(teacher);
});

exports.createTeacher = asyncHandler(async (req, res) => {
  const { errors, data } = validateTeacher(req.body || {});
  if (errors.length > 0) return res.status(400).json({ errors });

  try {
    const teacher = await teacherModel.createTeacher(data);
    if (data.user_id !== undefined) {
      await teacherModel.linkUser(data.user_id, teacher.id);
    }
    res.status(201).json(teacher);
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Selected department does not exist. Create a department first.' });
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A teacher with this email or code already exists.' });
    }
    throw error;
  }
});

exports.updateTeacher = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid teacher id' });

  const { errors, data } = validateTeacher(req.body || {}, { partial: true });
  if (errors.length > 0) return res.status(400).json({ errors });
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const teacher = await teacherModel.updateTeacher(id, data);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  if (data.user_id !== undefined) {
    await teacherModel.linkUser(data.user_id, id);
  }

  res.json(teacher);
});

exports.deleteTeacher = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid teacher id' });

  const deleted = await teacherModel.deleteTeacher(id);
  if (!deleted) return res.status(404).json({ error: 'Teacher not found' });

  res.json({ message: 'Teacher deleted successfully' });
});
