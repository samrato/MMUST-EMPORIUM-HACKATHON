const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

// POST /api/conversations/message - Send a message to the AI Orchestrator
router.post('/message', conversationController.sendMessage);

// GET /api/conversations/lookup - Lookup conversation details and history by phone/webUserId
router.get('/lookup', conversationController.lookupConversation);

// GET /api/conversations/classified - Get messages list filtered by classification category
router.get('/classified', conversationController.getClassifiedMessages);

// GET /api/conversations/:id/history - Get messages list in a conversation
router.get('/:id/history', conversationController.getHistory);

module.exports = router;
