const aiOrchestrator = require('../services/aiOrchestrator');
const dataStore = require('../models/dataStore');

/**
 * Handle sending a message through the AI Orchestration Layer
 * POST /api/conversations/message
 */
exports.sendMessage = async (req, res) => {
  try {
    const { text, phoneNumber, webUserId, channel, userLat, userLng } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: 'text' is mandatory."
      });
    }

    if (!channel || !['SMS', 'WEB', 'WHATSAPP', 'VOICE'].includes(channel)) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid 'channel'. Must be 'SMS', 'WEB', 'WHATSAPP', or 'VOICE'."
      });
    }

    const result = await aiOrchestrator.processUserMessage({
      text,
      phoneNumber,
      webUserId,
      channel,
      userLat,
      userLng
    });

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Error in Conversation message handler:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error in conversation handler."
    });
  }
};

/**
 * Retrieve messages for a specific conversation ID
 * GET /api/conversations/:id/history
 */
exports.getHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if conversation exists
    const messages = await dataStore.getMessagesByConversationId(id);
    
    return res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error fetching conversation history."
    });
  }
};

/**
 * Look up a conversation and its messages by phone number or web user ID
 * GET /api/conversations/lookup
 */
exports.lookupConversation = async (req, res) => {
  try {
    const { phoneNumber, webUserId } = req.query;

    if (!phoneNumber && !webUserId) {
      return res.status(400).json({
        success: false,
        error: "Provide either 'phoneNumber' or 'webUserId' query parameter."
      });
    }

    const conversation = await dataStore.getConversationByPhoneOrWebId(phoneNumber, webUserId);

    if (!conversation) {
      return res.status(200).json({
        success: true,
        conversation: null,
        messages: []
      });
    }

    const messages = await dataStore.getMessagesByConversationId(conversation.id);

    return res.status(200).json({
      success: true,
      conversation,
      messages
    });

  } catch (error) {
    console.error("Error looking up conversation:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error looking up conversation."
    });
  }
};

/**
 * Retrieve messages by category (e.g. category=GBV)
 * GET /api/conversations/classified
 */
exports.getClassifiedMessages = async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        error: "Missing query parameter 'category'."
      });
    }

    const messages = await dataStore.getMessagesByCategory(category);

    return res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error("Error fetching classified messages:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error fetching classified messages."
    });
  }
};
