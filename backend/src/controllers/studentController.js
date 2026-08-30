const studentModel = require('../models/studentModel');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const GENDERS = ['male', 'female', 'other'];
const STATUSES = ['active', 'inactive'];

function normalizeString(value) {
  if (value === undefined) return undefined;
  const str = String(value).trim();
  return str === '' ? null : str;
}

function normalizeDate(value) {
  if (value === undefined || value === null || value === '') return null;
  return String(value);
}

function validateStudent(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  // required on create
  if (!partial || has('first_name')) {
    const v = normalizeString(body.first_name);
    if (!v) errors.push('first_name is required');
    else data.first_name = v;
  }
  if (!partial || has('last_name')) {
    const v = normalizeString(body.last_name);
    if (!v) errors.push('last_name is required');
    else data.last_name = v;
  }
  if (!partial || has('email')) {
    const v = normalizeString(body.email);
    if (!v || !EMAIL_REGEX.test(v)) errors.push('a valid email is required');
    else data.email = v;
  }

  // optional fields — validated only when present
  if (has('code')) data.code = normalizeString(body.code);
  if (has('phone')) data.phone = normalizeString(body.phone);
  if (has('address')) data.address = normalizeString(body.address);
  if (has('department_id')) {
    if (body.department_id === null || body.department_id === '') {
      data.department_id = null;
    } else {
      const n = Number.parseInt(body.department_id, 10);
      if (!Number.isInteger(n) || n <= 0) errors.push('department_id must be a positive integer');
      else data.department_id = n;
    }
  }
  if (has('date_of_birth')) {
    const v = normalizeDate(body.date_of_birth);
    if (v && !DATE_REGEX.test(v)) errors.push('date_of_birth must be in YYYY-MM-DD format');
    else data.date_of_birth = v;
  }
  if (has('enrolled_at')) {
    const v = normalizeDate(body.enrolled_at);
    if (v && !DATE_REGEX.test(v)) errors.push('enrolled_at must be in YYYY-MM-DD format');
    else data.enrolled_at = v;
  }
  if (has('gender')) {
    const v = normalizeString(body.gender);
    if (v && !GENDERS.includes(v.toLowerCase())) {
      errors.push(`gender must be one of: ${GENDERS.join(', ')}`);
    } else {
      data.gender = v ? v.toLowerCase() : null;
    }
  }
  if (has('status')) {
    const v = normalizeString(body.status);
    if (v && !STATUSES.includes(v.toLowerCase())) {
      errors.push(`status must be one of: ${STATUSES.join(', ')}`);
    } else {
      data.status = v ? v.toLowerCase() : 'active';
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

exports.getAllStudents = asyncHandler(async (req, res) => {
  const students = await studentModel.getAllStudents();
  res.json(students);
});

exports.getStudentById = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid student id' });
  }

  const student = await studentModel.getStudentById(id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json(student);
});

exports.createStudent = asyncHandler(async (req, res) => {
  const { errors, data } = validateStudent(req.body || {});
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const student = await studentModel.createStudent(data);
  res.status(201).json(student);
});

exports.updateStudent = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid student id' });
  }

  const { errors, data } = validateStudent(req.body || {}, { partial: true });
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const student = await studentModel.updateStudent(id, data);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json(student);
});

exports.deleteStudent = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid student id' });
  }

  const deleted = await studentModel.deleteStudent(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json({ message: 'Student deleted successfully' });
});
