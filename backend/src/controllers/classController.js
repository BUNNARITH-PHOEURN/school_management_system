const classModel = require('../models/classModel');

const STATUSES = ['active', 'inactive'];

function parseId(id) {
  const parsed = Number.parseInt(id, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

exports.getAllClasses = asyncHandler(async (req, res) => {
  const classes = await classModel.getAllClasses();
  res.json(classes);
});

exports.getMyClasses = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') {
    const classes = await classModel.getAllClasses();
    return res.json(classes);
  }

  if (!req.user.teacher_id) {
    return res.json([]);
  }

  const classes = await classModel.getClassesByTeacher(req.user.teacher_id);
  res.json(classes);
});

exports.getClassById = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid class id' });
  }

  const cls = await classModel.getClassById(id);
  if (!cls) {
    return res.status(404).json({ error: 'Class not found' });
  }
  res.json(cls);
});

exports.createClass = asyncHandler(async (req, res) => {
  const body = req.body || {};

  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return res.status(400).json({ errors: ['name is required'] });
  }

  const data = {
    name: body.name.trim(),
    academic_year_id: body.academic_year_id ?? null,
    subject_id: body.subject_id ?? null,
    room: body.room ?? null,
    day: body.day ?? null,
    start_time: body.start_time ?? null,
    end_time: body.end_time ?? null,
    status: body.status ?? 'active',
  };

  if (!STATUSES.includes(data.status)) {
    return res.status(400).json({ errors: [`status must be one of: ${STATUSES.join(', ')}`] });
  }

  const cls = await classModel.createClass(data);
  res.status(201).json(cls);
});

exports.updateClass = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid class id' });
  }

  const body = req.body || {};
  if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) {
    return res.status(400).json({ errors: ['name is required'] });
  }
  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    return res.status(400).json({ errors: [`status must be one of: ${STATUSES.join(', ')}`] });
  }
  if (body.name !== undefined) body.name = body.name.trim();

  const cls = await classModel.updateClass(id, body);
  if (!cls) {
    return res.status(404).json({ error: 'Class not found' });
  }
  res.json(cls);
});

exports.deleteClass = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid class id' });
  }

  const deleted = await classModel.deleteClass(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Class not found' });
  }
  res.json({ message: 'Class deleted successfully' });
});