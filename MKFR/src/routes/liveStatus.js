const express = require('express');
const router = express.Router();
const liveStatusController = require('../controllers/liveStatusController');

// POST /api/live-status/update - Hospital Portal sends dynamic updates (Protected)
router.post('/update', liveStatusController.updateStatus);

// GET /api/live-status/:id - Retrieve live status & freshness score for a facility
router.get('/:id', liveStatusController.getStatusById);

module.exports = router;
