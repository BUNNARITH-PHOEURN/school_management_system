const express = require('express');
const {
    getAllClasses,
    getMyClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass
} = require('../controllers/classController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getAllClasses);
router.get('/mine', requireAuth, getMyClasses);
router.get('/:id', getClassById);
router.post('/', createClass);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

module.exports = router;