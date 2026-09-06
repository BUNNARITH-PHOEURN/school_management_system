const assignmentModel = require('../models/teacherAssignmentModel');

function positiveId(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

exports.list = async (req, res, next) => {
  try {
    res.json({ assignments: await assignmentModel.list() });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  const classId = positiveId(req.body?.class_id);
  const teacherId = positiveId(req.body?.teacher_id);
  if (!classId || !teacherId) {
    return res.status(400).json({ error: 'class_id and teacher_id are required' });
  }

  try {
    const assignment = await assignmentModel.create(classId, teacherId);
    res.status(201).json({ assignment });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'This teacher is already assigned to the class' });
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'The selected class or teacher does not exist' });
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  const classId = positiveId(req.params.classId);
  const teacherId = positiveId(req.params.teacherId);
  if (!classId || !teacherId) return res.status(400).json({ error: 'Invalid class or teacher id' });

  try {
    const removed = await assignmentModel.remove(classId, teacherId);
    if (!removed) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ message: 'Teacher removed from class' });
  } catch (error) {
    next(error);
  }
};
