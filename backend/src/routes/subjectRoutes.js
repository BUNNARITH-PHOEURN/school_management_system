const express = require('express');
const subjectController = require('../controllers/subjectController');

const router = express.Router();

router.get('/', subjectController.list);
router.post('/', subjectController.create);
router.put('/:id', subjectController.update);
router.patch('/:id/status', subjectController.updateStatus);
router.delete('/:id', subjectController.remove);

module.exports = router;
