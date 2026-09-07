const express = require('express');

const {
    getAllAcademicYears,
    getAcademicYearById,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear
} = require('../controllers/academicYearController');

const router = express.Router();

router.get('/', getAllAcademicYears);
router.get('/:id', getAcademicYearById);
router.post('/', createAcademicYear);
router.put('/:id', updateAcademicYear);
router.delete('/:id', deleteAcademicYear);

module.exports = router;