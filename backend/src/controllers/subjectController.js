const subjectModel = require('../models/subjectModel');

exports.list = async (req, res, next) => {
  try {
    res.json({ subjects: await subjectModel.getAllSubjects() });
  } catch (error) {
    next(error);
  }
};
