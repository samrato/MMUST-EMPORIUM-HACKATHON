const express = require('express');
const router = express.Router();
const triageController = require('../controllers/triageController');

// POST /api/triage/analyze (Legacy single-turn check)
router.post('/analyze', triageController.analyzeSymptoms);

// POST /api/triage/start (Conversational doctor interrogation start)
router.post('/start', triageController.startTriageSession);

// POST /api/triage/respond (conversational doctor response)
router.post('/respond', triageController.respondToTriage);

module.exports = router;
