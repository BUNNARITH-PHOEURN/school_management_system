const enrollmentModel = require('../models/enrollmentModel');

const MODERATOR_ROLES = ['admin', 'moderator'];
const STATUSES = ['pending', 'approved', 'rejected', 'dropped'];

function parseId(id) {
  const parsed = Number.parseInt(id, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isModerator(user) {
  return MODERATOR_ROLES.includes(user?.role);
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
  const user = req.user;

  let studentId;
  if (user.role === 'student') {
    studentId = user.student_id;
    if (!studentId) {
      return res.status(403).json({ error: 'Your account is not linked to a student record' });
    }
  } else {
    studentId = parseId(body.student_id);
  }

  const classId = parseId(body.class_id);

  if (!studentId || !classId) {
    return res.status(400).json({ errors: ['student_id and class_id are required'] });
  }

  const existing = await enrollmentModel.findEnrollment(studentId, classId);
  if (existing) {
    if (existing.status === 'pending') {
      return res.status(409).json({ error: 'Enrollment request is already pending review' });
    }
    if (existing.status === 'approved') {
      return res.status(400).json({ error: 'Student is already enrolled in this class' });
    }
    if (existing.status === 'rejected' || existing.status === 'dropped') {
      await enrollmentModel.resetToPending(existing.id);
      const updated = await enrollmentModel.getEnrollmentById(existing.id);
      return res.status(201).json(updated);
    }
  }

  const enrollment = await enrollmentModel.createEnrollment(studentId, classId);
  res.status(201).json(enrollment);
});

// All enrollments are created as pending; only a moderator can approve/reject.
async function reviewEnrollment(req, res, status) {
  if (!isModerator(req.user)) {
    return res.status(403).json({ error: 'Only a moderator can review enrollment requests' });
  }

  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid enrollment id' });
  }

  const current = await enrollmentModel.getEnrollmentById(id);
  if (!current) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }
  if (current.status !== 'pending') {
    return res.status(400).json({ error: `Enrollment has already been ${current.status === 'approved' ? 'approved' : 'reviewed'}` });
  }

  const enrollment = await enrollmentModel.review(id, status, req.user.id);
  res.json(enrollment);
}

exports.approveEnrollment = asyncHandler(async (req, res) => {
  await reviewEnrollment(req, res, 'approved');
});

exports.rejectEnrollment = asyncHandler(async (req, res) => {
  await reviewEnrollment(req, res, 'rejected');
});

exports.updateEnrollment = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid enrollment id' });
  }

  const enrollment = await enrollmentModel.getEnrollmentById(id);
  if (!enrollment) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }

  const body = req.body || {};
  const updates = {};

  // Status transitions allowed:
  //  - moderator: approve/reject/drop any enrollment
  //  - student:   drop their own approved enrollment only
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return res.status(400).json({ errors: [`status must be one of: ${STATUSES.join(', ')}`] });
    }

    if (isModerator(req.user)) {
      if (body.status === 'approved' || body.status === 'rejected') {
        if (enrollment.status !== 'pending') {
          return res.status(400).json({ error: 'Enrollment must be pending before it can be approved or rejected' });
        }
        updates.status = body.status;
        updates.reviewed_by = req.user.id;
        updates.reviewed_at = new Date();
      } else if (body.status === 'dropped') {
        if (enrollment.status !== 'approved') {
          return res.status(400).json({ error: 'Only approved enrollments can be dropped' });
        }
        updates.status = 'dropped';
      } else if (body.status === 'pending') {
        updates.status = 'pending';
        updates.reviewed_by = null;
        updates.reviewed_at = null;
      }
    } else if (req.user.role === 'student') {
      if (enrollment.student_id !== req.user.student_id) {
        return res.status(403).json({ error: 'You can only update your own enrollments' });
      }
      if (body.status !== 'dropped') {
        return res.status(403).json({ error: 'Students can only drop their own approved enrollments' });
      }
      if (enrollment.status !== 'approved') {
        return res.status(400).json({ error: 'Only approved enrollments can be dropped' });
      }
      updates.status = 'dropped';
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  if (body.enrolled_at !== undefined) updates.enrolled_at = body.enrolled_at || null;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const updated = await enrollmentModel.updateEnrollment(id, updates);
  res.json(updated);
});

exports.deleteEnrollment = asyncHandler(async (req, res) => {
  if (!isModerator(req.user)) {
    return res.status(403).json({ error: 'Only a moderator can delete enrollments' });
  }

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
