const enrollmentModel = require('../models/enrollmentModel');
const classModel = require('../models/classModel');
const subjectFeeModel = require('../models/subjectFeeModel');
const { paginate, pageResponse } = require('../utils/pagination');

const MODERATOR_ROLES = ['admin', 'moderator'];
const STATUSES = ['pending', 'approved', 'rejected', 'dropped'];
const DOC_FIELDS = ['doc_grade12', 'doc_transcript', 'doc_idcopy'];

function parseId(id) {
  const parsed = Number.parseInt(id, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isModerator(user) {
  return MODERATOR_ROLES.includes(user?.role);
}

async function resolveAmount(classId) {
  const cls = await classModel.getClassById(classId);
  if (!cls || !cls.subject_id || !cls.academic_year_id) return 0;
  const fee = await subjectFeeModel.getFee(cls.subject_id, cls.academic_year_id);
  return fee ? Number(fee.fee) : 0;
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

exports.getAllEnrollments = asyncHandler(async (req, res) => {
  const hasPaging = req.query.page !== undefined || req.query.limit !== undefined;
  if (hasPaging) {
    const { page, limit, offset } = paginate(req.query);
    const filters = {
      search: typeof req.query.search === 'string' ? req.query.search.trim() : undefined,
      status: req.query.status,
      payment_status: req.query.payment_status,
      class_id: req.query.class_id,
    };
    const [enrollments, total] = await Promise.all([
      enrollmentModel.getAllEnrollments({ limit, offset, ...filters }),
      enrollmentModel.countEnrollments(filters),
    ]);
    return res.json(pageResponse(enrollments, total, { page, limit }));
  }
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

  const amount = await resolveAmount(classId);
  const enrollment = await enrollmentModel.createEnrollment(studentId, classId, {
    notes: body.notes ?? null,
    docs_declared: body.docs_declared ? 1 : 0,
    amount,
  });
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

  if (status === 'approved') {
    // Persist the verified document flags before approving, and gate on them.
    const flags = {};
    for (const field of DOC_FIELDS) {
      if (req.body && req.body[field] !== undefined) {
        flags[field] = req.body[field] ? 1 : 0;
      }
    }
    if (Object.keys(flags).length > 0) {
      await enrollmentModel.updateEnrollment(id, flags);
    }
    const fresh = await enrollmentModel.getEnrollmentById(id);
    const allDocs = DOC_FIELDS.every((f) => Number(fresh[f]) === 1);
    if (!allDocs) {
      return res.status(400).json({ error: 'All required documents must be verified before approval' });
    }
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

exports.payEnrollment = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid enrollment id' });
  }

  const enrollment = await enrollmentModel.getEnrollmentById(id);
  if (!enrollment) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }

  const isOwner = req.user.role === 'student' && req.user.student_id === enrollment.student_id;
  if (!isModerator(req.user) && !isOwner) {
    return res.status(403).json({ error: 'You can only pay for your own enrollments' });
  }
  if (enrollment.status !== 'approved') {
    return res.status(400).json({ error: 'Only approved enrollments can be paid' });
  }
  if (enrollment.payment_status === 'paid') {
    return res.status(400).json({ error: 'Enrollment has already been paid' });
  }

  const body = req.body || {};
  const method = typeof body.method === 'string' && body.method.trim() ? body.method.trim().slice(0, 50) : null;
  const reference = typeof body.reference === 'string' && body.reference.trim() ? body.reference.trim().slice(0, 100) : null;
  if (!method) {
    return res.status(400).json({ error: 'payment method is required' });
  }

  const updated = await enrollmentModel.markPaid(id, method, reference);
  res.json(updated);
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

  // A student can update their own PENDING enrollment's document declaration and
  // notes (save a draft / complete documents before the deadline).
  if (req.user.role === 'student' && enrollment.status === 'pending') {
    if (enrollment.student_id !== req.user.student_id) {
      return res.status(403).json({ error: 'You can only update your own enrollments' });
    }
    for (const field of DOC_FIELDS) {
      if (body[field] !== undefined) updates[field] = body[field] ? 1 : 0;
    }
    if (body.docs_declared !== undefined) updates.docs_declared = body.docs_declared ? 1 : 0;
    if (body.notes !== undefined) updates.notes = body.notes || null;
  }

  if (body.enrolled_at !== undefined) updates.enrolled_at = body.enrolled_at || null;

  // Moderator can update document-verification flags and notes at any time.
  if (isModerator(req.user)) {
    for (const field of DOC_FIELDS) {
      if (body[field] !== undefined) updates[field] = body[field] ? 1 : 0;
    }
    if (body.notes !== undefined) updates.notes = body.notes || null;
    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        return res.status(400).json({ error: 'amount must be a non-negative number' });
      }
      updates.amount = amount;
    }
  }

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
