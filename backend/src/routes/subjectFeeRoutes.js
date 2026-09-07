const express = require('express');
const controller = require('../controllers/subjectFeeController');
const { requireAuth } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(requireAuth);
router.get('/', controller.listFees);
router.post('/', controller.upsertFee);
router.delete('/:id', controller.deleteFee);

module.exports = router;