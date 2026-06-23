const routingEngine = require('../services/routingEngine');
const dataStore = require('../models/dataStore');

/**
 * Perform System Routing & Scoring to determine the best facility
 * POST /api/route
 */
exports.getRoutes = async (req, res) => {
  try {
    const { userLat, userLng, requiredServices = [], isEmergency = false, sessionId } = req.body;

    // Validate coordinates
    if (userLat === undefined || userLng === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing parameters: 'userLat' and 'userLng' coordinates are required."
      });
    }

    const lat = parseFloat(userLat);
    const lng = parseFloat(userLng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: "Coordinates ('userLat', 'userLng') must be valid numbers."
      });
    }

    // Resolving symptoms triage parameters
    let services = [...requiredServices];
    let emergency = !!isEmergency;
    let enrichedQueryDetails = null;

    // Connects the Doctor Triage Session database to Routing Engine
    if (sessionId) {
      const session = await dataStore.getTriageSession(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: `Triage session ID ${sessionId} was not found.`
        });
      }

      if (!session.finalized) {
        return res.status(400).json({
          success: false,
          error: "Triage session is still in progress. Please answer all diagnostic questions prior to routing.",
          current_interrogation_state: {
            sessionId: session.id,
            nextQuestion: session.questions[session.currentIndex],
            currentIndex: session.currentIndex,
            totalQuestions: session.questions.length
          }
        });
      }

      // Populate triage criteria from the database session
      services = session.requiredServices || [];
      emergency = session.risk === 'critical';
      enrichedQueryDetails = {
        sessionId: session.id,
        initial_symptoms: session.initialSymptoms,
        risk_class: session.risk,
        urgency: session.urgency
      };
    }

    if (!Array.isArray(services)) {
      return res.status(400).json({
        success: false,
        error: "'requiredServices' must be an array of strings."
      });
    }

    // Call the engine to rank facilities based on scoring algorithm
    const routingResult = await routingEngine.routeAndScore({
      userLat: lat,
      userLng: lng,
      requiredServices: services,
      isEmergency: emergency
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      query: {
        coordinates: { lat, lng },
        required_services: services,
        is_emergency: emergency,
        triage_session_details: enrichedQueryDetails
      },
      results: routingResult
    });

  } catch (error) {
    console.error("Error in routing controller:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error in the routing and scoring engine."
    });
  }
};
