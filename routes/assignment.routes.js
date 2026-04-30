const express = require('express');
const router = express.Router();

const assignmentController = require('../controllers/assignment.controller');
const requireAuth = require('../middleware/requireAuth');
const upload = require('../config/multer');

router.post('/checkout', requireAuth, upload.single('document'), assignmentController.checkout);
router.post('/checkin', requireAuth, upload.single('document'), assignmentController.checkin);

module.exports = router;
