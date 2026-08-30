const enrollmentModel = require('../models/enrollmentModel');

const STATUSES = ['enrolled', 'dropped'];

function parseId(id) {
  const parsed = Number.parseInt(id, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

exports.getAllEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await enrollmentModel.getAllEnrollments();
  res.json(enrollments);
});

exports.getEnrollmentById = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid enrollment id' });
  }

  const enrollment = await enrollmentModel.getEnrollmentById(id);
  if (!enrollment) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }
  res.json(enrollment);
});

exports.createEnrollment = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const studentId = parseId(body.student_id);
  const classId = parseId(body.class_id);

  if (!studentId || !classId) {
    return res.status(400).json({ errors: ['student_id and class_id are required'] });
  }

  const existing = await enrollmentModel.findEnrollment(studentId, classId);
  if (existing) {
    if (existing.status === 'dropped') {
      const updated = await enrollmentModel.updateEnrollment(existing.id, { status: 'enrolled' });
      return res.status(201).json(updated);
    }
    return res.status(400).json({ error: 'Student is already enrolled in this class' });
  }

  const enrollment = await enrollmentModel.createEnrollment(studentId, classId);
  res.status(201).json(enrollment);
});

exports.updateEnrollment = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid enrollment id' });
  }

  const body = req.body || {};
  const updates = {};

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return res.status(400).json({ errors: [`status must be one of: ${STATUSES.join(', ')}`] });
    }
    updates.status = body.status;
  }
  if (body.enrolled_at !== undefined) updates.enrolled_at = body.enrolled_at || null;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const enrollment = await enrollmentModel.updateEnrollment(id, updates);
  if (!enrollment) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }
  res.json(enrollment);
});

exports.deleteEnrollment = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid enrollment id' });
  }

  const deleted = await enrollmentModel.deleteEnrollment(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }
  res.json({ message: 'Enrollment deleted successfully' });
});