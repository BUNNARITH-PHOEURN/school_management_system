const subjectModel = require('../models/subjectModel');

const allowedStatuses = ['active', 'inactive'];

function validate(body, partial = false) {
  const data = {};
  if (!partial || body.name !== undefined) {
    if (!String(body.name || '').trim()) return 'name is required';
    data.name = String(body.name).trim();
  }
  if (!partial || body.code !== undefined) {
    if (!String(body.code || '').trim()) return 'code is required';
    data.code = String(body.code).trim().toUpperCase();
  }
  if (!partial || body.department_id !== undefined) {
    const departmentId = Number(body.department_id);
    if (!Number.isInteger(departmentId) || departmentId <= 0) return 'a valid department is required';
    data.department_id = departmentId;
  }
  if (body.credits !== undefined) {
    const credits = Number(body.credits);
    if (!Number.isInteger(credits) || credits < 1 || credits > 6) return 'credits must be between 1 and 6';
    data.credits = credits;
  }
  if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
  if (body.status !== undefined) {
    if (!allowedStatuses.includes(body.status)) return 'Invalid status';
    data.status = body.status;
  }
  return { data };
}

exports.list = async (req, res, next) => {
  try {
    res.json({ subjects: await subjectModel.getAllSubjects() });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const result = validate(req.body || {});
    if (typeof result === 'string') return res.status(400).json({ error: result });
    res.status(201).json({ subject: await subjectModel.createSubject(result.data) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'A subject with this code already exists' });
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'The selected department does not exist' });
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const result = validate(req.body || {}, true);
    if (typeof result === 'string') return res.status(400).json({ error: result });
    const subject = await subjectModel.updateSubject(req.params.id, result.data);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json({ subject });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'A subject with this code already exists' });
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'The selected department does not exist' });
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    if (!allowedStatuses.includes(req.body?.status)) return res.status(400).json({ error: 'Invalid status' });
    const subject = await subjectModel.updateSubject(req.params.id, { status: req.body.status });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json({ subject });
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await subjectModel.deleteSubject(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Subject not found' });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) { next(error); }
};
