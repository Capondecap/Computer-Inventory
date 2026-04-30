const express = require('express');
const router = express.Router();

const assignmentController = require('../controllers/assignment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../config/multer');

router.post('/checkout', authenticate, upload.single('document'), assignmentController.checkout);
router.post('/checkin', authenticate, upload.single('document'), assignmentController.checkin);

module.exports = router;
