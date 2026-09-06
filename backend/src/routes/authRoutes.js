const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', authController.login);
router.get('/me', authController.me);
router.put('/me', requireAuth, authController.updateProfile);
router.put('/password', requireAuth, authController.updatePassword);
router.delete('/me', requireAuth, authController.deactivate);

module.exports = router;