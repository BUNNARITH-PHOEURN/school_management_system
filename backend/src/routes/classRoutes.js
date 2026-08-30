const express = require('express');
const controller = require('../controllers/classController');

const router = express.Router();

router.get('/', controller.getAllClasses);
router.get('/:id', controller.getClassById);
router.post('/', controller.createClass);
router.put('/:id', controller.updateClass);
router.delete('/:id', controller.deleteClass);

module.exports = router;