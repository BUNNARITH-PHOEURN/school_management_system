const subjectFeeModel = require('../models/subjectFeeModel');
const subjectModel = require('../models/subjectModel');
const academicYearModel = require('../models/academicYearModel');
const { paginate, pageResponse } = require('../utils/pagination');

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function parseId(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

exports.listFees = asyncHandler(async (req, res) => {
  const hasPaging = req.query.page !== undefined || req.query.limit !== undefined;
  if (hasPaging) {
    const { page, limit, offset } = paginate(req.query);
    const [fees, total] = await Promise.all([
      subjectFeeModel.listFees({ limit, offset }),
      subjectFeeModel.countFees(),
    ]);
    return res.json(pageResponse(fees, total, { page, limit }));
  }
  const fees = await subjectFeeModel.listFees();
  res.json({ fees });
});

exports.upsertFee = asyncHandler(async (req, res) => {
  const subjectId = parseId(req.body?.subject_id);
  const academicYearId = parseId(req.body?.academic_year_id);
  const fee = req.body?.fee;

  if (!subjectId || !academicYearId) {
    return res.status(400).json({ error: 'subject_id and academic_year_id are required' });
  }

  const subject = await subjectModel.getSubjectById(subjectId);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  const year = await academicYearModel.getAcademicYearById(academicYearId);
  if (!year) return res.status(404).json({ error: 'Academic year not found' });

  const feeRow = await subjectFeeModel.upsertFee(subjectId, academicYearId, fee);
  res.json({ fee: feeRow });
});

exports.deleteFee = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid fee id' });

  const deleted = await subjectFeeModel.deleteFee(id);
  if (!deleted) return res.status(404).json({ error: 'Fee not found' });
  res.json({ message: 'Fee removed' });
});

module.exports = exports;