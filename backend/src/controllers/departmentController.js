const departmentModel = require('../models/departmentModel');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function validate(body) {
  if (!body?.name || !body?.code) return 'name and code are required';
  return null;
}

exports.list = asyncHandler(async (req, res) => res.json({ departments: await departmentModel.list() }));

exports.create = asyncHandler(async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  res.status(201).json({ department: await departmentModel.create({ ...req.body, code: req.body.code.trim().toUpperCase(), name: req.body.name.trim() }) });
});
exports.update = asyncHandler(async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  res.json({ department: await departmentModel.update(req.params.id, { ...req.body, code: req.body.code.trim().toUpperCase(), name: req.body.name.trim() }) });
});
exports.updateStatus = asyncHandler(async (req, res) => {
  if (!['active', 'inactive'].includes(req.body?.status)) return res.status(400).json({ error: 'Invalid status' });
  res.json({ department: await departmentModel.updateStatus(req.params.id, req.body.status) });
});