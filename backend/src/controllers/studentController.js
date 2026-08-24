const studentModel = require('../models/studentModel');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateStudent(body) {
  const errors = [];

  if (!body.first_name || !String(body.first_name).trim()) {
    errors.push('first_name is required');
  }
  if (!body.last_name || !String(body.last_name).trim()) {
    errors.push('last_name is required');
  }
  if (!body.email || !EMAIL_REGEX.test(String(body.email))) {
    errors.push('a valid email is required');
  }
  if (body.date_of_birth && !DATE_REGEX.test(String(body.date_of_birth))) {
    errors.push('date_of_birth must be in YYYY-MM-DD format');
  }
  if (body.gender && !['male', 'female', 'other'].includes(String(body.gender).toLowerCase())) {
    errors.push("gender must be one of: male, female, other");
  }

  return errors;
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
  const errors = validateStudent(req.body || {});
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const student = await studentModel.createStudent({
    first_name: String(req.body.first_name).trim(),
    last_name: String(req.body.last_name).trim(),
    email: String(req.body.email).trim(),
    date_of_birth: req.body.date_of_birth,
    gender: req.body.gender,
  });
  res.status(201).json(student);
});

exports.updateStudent = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid student id' });
  }

  const errors = validateStudent(req.body || {});
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const student = await studentModel.updateStudent(id, {
    first_name: String(req.body.first_name).trim(),
    last_name: String(req.body.last_name).trim(),
    email: String(req.body.email).trim(),
    date_of_birth: req.body.date_of_birth,
    gender: req.body.gender,
  });
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
