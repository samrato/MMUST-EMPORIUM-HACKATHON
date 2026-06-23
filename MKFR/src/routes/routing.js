const express = require('express');
const router = express.Router();
const routingController = require('../controllers/routingController');

// POST /api/route - Retrieve scored & ranked facility list based on user location and triage
router.post('/', routingController.getRoutes);

module.exports = router;
