const classModel = require('../models/classModel');

const STATUSES = ['active', 'inactive'];

function parseId(id) {
  const parsed = Number.parseInt(id, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const getAllClasses = asyncHandler(async (req, res) => {
  try {
    const classes = await classModel.getAllClasses();
    return res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch classes.',
      error: error.message,
    });
  }
});

const getMyClasses = asyncHandler(async (req, res) => {
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

const getClassById = asyncHandler(async (req, res) => {
  try {
      const { id } = req.params;
  
      const classes = await classModel.getClassById(id);
  
      if (!classes) {
        return res.status(404).json({
          success: false,
          message: 'Class not found.',
        });
      }
  
      return res.status(200).json({
        success: true,
        data: classes,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch class.',
        error: error.message,
      });
    }
});

const createClass = asyncHandler(async (req, res) => {
   try {
      const { name, academic_year_id, subject_id, room, day, start_time, end_time, status } = req.body;
  
      if (!name || !academic_year_id || !subject_id || !day || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required.',
        });
      }
      const data = {
        name,
        academic_year_id: academic_year_id,
        subject_id: subject_id,
        room: room || null,
        day: day,
        start_time: start_time,
        end_time: end_time,
        status: status || 'active',
      };
      const classes = await classModel.createClass(data);
      return res.status(201).json({
        success: true,
        message: 'Class created successfully.',
        data: classes,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create class.',
        error: error.message,
      });
    }
});

const updateClass = async (req, res) => {
  try {
      const { id } = req.params;
      const { name, academic_year_id, subject_id, room, day, start_time, end_time, status } = req.body;
  
      const updates = Object.fromEntries(
        Object.entries({ name, academic_year_id, subject_id, room, day, start_time, end_time, status }).filter(([, value]) => value !== undefined),
      );
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update.' });
      }
      const classes = await classModel.updateClass(
        id,
        updates,
        { new: true, runValidators: true }
      );
  
      if (!classes) {
        return res.status(404).json({
          success: false,
          message: 'Class not found.',
        });
      }
  
      return res.status(200).json({
        success: true,
        message: 'Class updated successfully.',
        data: classes,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update class.',
        error: error.message,
      });
    }
};

const deleteClass = asyncHandler(async (req, res) => {
  try {
      const { id } = req.params;
  
      const classes = await classModel.deleteClass(id);
  
      if (!classes) {
        return res.status(404).json({
          success: false,
          message: 'Class not found.',
        });
      }
  
      return res.status(200).json({
        success: true,
        message: 'Class deleted successfully.',
        data: classes,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete class.',
        error: error.message,
      });
    }
});

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
}
