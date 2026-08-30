const express = require('express');
const controller = require('../controllers/attendanceController');

const router = express.Router();

router.get('/', controller.getAllAttendance);
router.post('/batch', controller.saveBatch);
router.get('/:id', controller.getAttendanceById);
router.post('/', controller.createAttendance);
router.put('/:id', controller.updateAttendance);
router.delete('/:id', controller.deleteAttendance);

module.exports = router;