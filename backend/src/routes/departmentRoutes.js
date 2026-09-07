const express = require('express');
const controller = require('../controllers/departmentController');
const { requireAuth } = require('../middleware/authMiddleware');
const router = express.Router();
router.get('/', controller.list);
router.post('/', requireAuth, controller.create);
router.put('/:id', requireAuth, controller.update);
router.patch('/:id/status', requireAuth, controller.updateStatus);
module.exports = router;