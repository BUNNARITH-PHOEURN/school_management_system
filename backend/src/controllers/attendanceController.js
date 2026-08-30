const attendanceModel = require('../models/attendanceModel');

const STATUSES = ['present', 'absent', 'late', 'permission'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseId(id) {
  const parsed = Number.parseInt(id, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

exports.getAllAttendance = asyncHandler(async (req, res) => {
  const classId = req.query.class_id ? parseId(req.query.class_id) : null;
  const date = typeof req.query.date === 'string' && DATE_REGEX.test(req.query.date) ? req.query.date : null;

  const records = await attendanceModel.getAttendance({ classId, date });
  res.json(records);
});

exports.getAttendanceById = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid attendance id' });
  }

  const record = await attendanceModel.getAttendanceById(id);
  if (!record) {
    return res.status(404).json({ error: 'Attendance record not found' });
  }
  res.json(record);
});

exports.createAttendance = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const studentId = parseId(body.student_id);
  const classId = parseId(body.class_id);

  const errors = [];
  if (!studentId) errors.push('student_id is required');
  if (!classId) errors.push('class_id is required');
  if (!body.date || !DATE_REGEX.test(body.date)) errors.push('date must be in YYYY-MM-DD format');
  if (!body.status) errors.push('status is required');
  else if (!STATUSES.includes(body.status)) errors.push(`status must be one of: ${STATUSES.join(', ')}`);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const record = await attendanceModel.createAttendance({
    student_id: studentId,
    class_id: classId,
    date: body.date,
    status: body.status,
    remarks: body.remarks ?? null,
  });
  res.status(201).json(record);
});

exports.saveBatch = asyncHandler(async (req, res) => {
  const records = req.body || [];
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ errors: ['records must be a non-empty array'] });
  }

  const cleaned = [];
  for (const r of records) {
    const studentId = parseId(r.student_id);
    const classId = parseId(r.class_id);
    if (!studentId || !classId || !r.date || !DATE_REGEX.test(r.date) ||
        !r.status || !STATUSES.includes(r.status)) {
      return res.status(400).json({
        errors: ['each record needs student_id, class_id, date (YYYY-MM-DD) and a valid status'],
      });
    }
    cleaned.push({
      student_id: studentId,
      class_id: classId,
      date: r.date,
      status: r.status,
      remarks: r.remarks ?? null,
    });
  }

  await attendanceModel.saveBatch(cleaned);
  res.json({ message: `${cleaned.length} attendance record(s) saved` });
});

exports.updateAttendance = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid attendance id' });
  }

  const body = req.body || {};
  const updates = {};

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return res.status(400).json({ errors: [`status must be one of: ${STATUSES.join(', ')}`] });
    }
    updates.status = body.status;
  }
  if (body.remarks !== undefined) updates.remarks = body.remarks || null;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const record = await attendanceModel.updateAttendance(id, updates);
  if (!record) {
    return res.status(404).json({ error: 'Attendance record not found' });
  }
  res.json(record);
});

exports.deleteAttendance = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid attendance id' });
  }

  const deleted = await attendanceModel.deleteAttendance(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Attendance record not found' });
  }
  res.json({ message: 'Attendance record deleted successfully' });
});