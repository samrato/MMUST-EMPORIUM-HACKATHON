const express = require('express');
const router = express.Router();
const intelligenceController = require('../controllers/intelligenceController');

// GET /api/intelligence/dashboard - Retrieve aggregate demand metrics & regional gaps
router.get('/dashboard', intelligenceController.getDashboardInsights);

// POST /api/intelligence/chw/sync - Upload household referral logs synced offline by health workers
router.post('/chw/sync', intelligenceController.syncChwReferral);

// GET /api/intelligence/chw/referrals - View all synced CHW referral logs
router.get('/chw/referrals', intelligenceController.getChwReferrals);

module.exports = router;
