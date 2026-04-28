const express = require('express');
const router = express.Router();
const assignmentCtrl = require('../controllers/assignment.controller');

// ── Middleware owned by Person 1 ─────────────────────────────────────────────
const { requireJWT } = require('../middleware/auth.middleware');

// ── File upload config owned by Person 2 ─────────────────────────────────────
const upload = require('../config/multer');

// ─── JSON API  (mounted at /api/transactions in routes/index.js) ─────────────
const api = express.Router();

api.get('/',          requireJWT,                          assignmentCtrl.apiListAssignments);
api.get('/:id',       requireJWT,                          assignmentCtrl.apiGetAssignment);
api.post('/checkout', requireJWT, upload.single('document'), assignmentCtrl.apiCheckout);
api.post('/checkin',  requireJWT, upload.single('document'), assignmentCtrl.apiCheckin);

// ─── UI  (mounted at /assignments in routes/index.js) ────────────────────────
router.get('/',           requireJWT,                            assignmentCtrl.uiListAssignments);
router.get('/checkout',   requireJWT,                            assignmentCtrl.uiCheckoutForm);
router.get('/checkin',    requireJWT,                            assignmentCtrl.uiCheckinForm);
router.post('/checkout',  requireJWT, upload.single('document'), assignmentCtrl.uiCheckout);
router.post('/checkin',   requireJWT, upload.single('document'), assignmentCtrl.uiCheckin);

module.exports = { uiRouter: router, apiRouter: api };
