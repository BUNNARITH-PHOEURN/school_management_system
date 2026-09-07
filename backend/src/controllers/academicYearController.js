const AcademicYear = require('../models/academicYearModel');

// Create a new academic year
const createAcademicYear = async (req, res) => {
  try {
    const { name, start_date, end_date, status } = req.body;

    if (!name || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'name, start_date and end_date are required.',
      });
    }
    const data = {
      name,
      start_date: start_date,
      end_date: end_date,
      status: status || 'inactive',
    };
    const academicYear = await AcademicYear.createAcademicYear(data);
    return res.status(201).json({
      success: true,
      message: 'Academic year created successfully.',
      data: academicYear,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create academic year.',
      error: error.message,
    });
  }
};

// Get all academic years
const getAllAcademicYears = async (req, res) => {
  try {
    const academicYears = await AcademicYear.getAllAcademicYears();
    return res.status(200).json({
      success: true,
      data: academicYears,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch academic years.',
      error: error.message,
    });
  }
};

// Get academic year by id
const getAcademicYearById = async (req, res) => {
  try {
    const { id } = req.params;

    const academicYear = await AcademicYear.getAcademicYearById(id);

    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: 'Academic year not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: academicYear,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch academic year.',
      error: error.message,
    });
  }
};

// Update academic year by id
const updateAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, start_date, end_date, status } = req.body;

    const updates = Object.fromEntries(
      Object.entries({ name, start_date, end_date, status }).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }
    const academicYear = await AcademicYear.updateAcademicYear(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: 'Academic year not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Academic year updated successfully.',
      data: academicYear,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update academic year.',
      error: error.message,
    });
  }
};

// Delete academic year by id
const deleteAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;

    const academicYear = await AcademicYear.deleteAcademicYear(id);

    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: 'Academic year not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Academic year deleted successfully.',
      data: academicYear,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete academic year.',
      error: error.message,
    });
  }
};

module.exports = {
  createAcademicYear,
  getAllAcademicYears,
  getAcademicYearById,
  updateAcademicYear,
  deleteAcademicYear,
}
