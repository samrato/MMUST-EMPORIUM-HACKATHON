const routingEngine = require('../services/routingEngine');
const dataStore = require('../models/dataStore');

const aiTriageService = require('../services/aiTriageService');

/**
 * Perform System Routing & Scoring to determine the best facility
 * POST /api/route or GET /api/route?symptom={symptom}&lat={lat}&lng={lng}
 */
exports.getRoutes = async (req, res) => {
  try {
    const rawLat = req.body?.userLat ?? req.body?.lat ?? req.query?.lat ?? req.query?.userLat;
    const rawLng = req.body?.userLng ?? req.query?.lng ?? req.query?.userLng;
    const symptom = req.body?.symptom ?? req.query?.symptom;
    const sessionId = req.body?.sessionId ?? req.query?.sessionId;
    let requiredServices = req.body?.requiredServices ?? (req.query?.service ? [req.query.service] : []);
    let isEmergency = req.body?.isEmergency ?? (req.query?.isEmergency === 'true');

    // Validate coordinates
    if (rawLat === undefined || rawLng === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing parameters: 'userLat' (or 'lat') and 'userLng' (or 'lng') coordinates are required."
      });
    }

    const lat = parseFloat(rawLat);
    const lng = parseFloat(rawLng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: "Coordinates must be valid numbers."
      });
    }

    // Resolving symptoms triage parameters
    let services = Array.isArray(requiredServices) ? [...requiredServices] : [];
    let emergency = !!isEmergency;
    let enrichedQueryDetails = null;

    if (symptom && services.length === 0) {
      const triage = aiTriageService.performTriage(symptom);
      services = triage.required_services || [];
      if (triage.is_emergency) emergency = true;
      enrichedQueryDetails = {
        symptom,
        risk_class: triage.risk,
        urgency: triage.urgency
      };
    }

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
