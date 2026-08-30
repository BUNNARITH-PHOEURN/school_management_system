const express = require('express');
const controller = require('../controllers/attendanceController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', controller.getAllAttendance);
router.post('/batch', requireAuth, controller.saveBatch);
router.get('/:id', controller.getAttendanceById);
router.post('/', requireAuth, controller.createAttendance);
router.put('/:id', requireAuth, controller.updateAttendance);
router.delete('/:id', requireAuth, controller.deleteAttendance);

module.exports = router;