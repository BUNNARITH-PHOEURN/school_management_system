const express = require('express');
const controller = require('../controllers/teacherAssignmentController');

const router = express.Router();

router.get('/', controller.list);
router.post('/', controller.create);
router.delete('/:classId/:teacherId', controller.remove);

module.exports = router;
