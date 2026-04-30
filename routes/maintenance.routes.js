const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { get, list, create, update, complete, remove } = require('../controllers/maintenance.controller');

const router = express.Router();

router.get('/', requireAuth, list);
router.get('/:id', requireAuth, get);
router.post('/', requireAuth, create);
router.patch('/:id', requireAuth, update);
router.post('/:id/complete', requireAuth, complete);
router.delete('/:id', requireAuth, remove);

module.exports = router;
