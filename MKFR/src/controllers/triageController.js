const aiTriageService = require('../services/aiTriageService');
const dataStore = require('../models/dataStore');

/**
 * Start a conversational doctor-like triage session
 * POST /api/triage/start
 */
exports.startTriageSession = async (req, res) => {
  try {
    const { symptoms, county = "Unknown", language = "en" } = req.body;

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Symptoms description is required as a non-empty string."
      });
    }

    // Run Doctor Brain triage evaluation on initial complaint
    const initialTriage = aiTriageService.performTriage(symptoms);
    const sessionId = "TS-" + Math.floor(100000 + Math.random() * 900000);

    // If initial evaluation is an emergency or an advisory warning, finalize immediately
    const shouldFinalize = initialTriage.is_emergency || initialTriage.risk === 'advisory';

    const session = {
      id: sessionId,
      county,
      language: initialTriage.language_detected || language,
      initialSymptoms: symptoms,
      questions: initialTriage.clarification_questions || [],
      answers: [],
      currentIndex: 0,
      finalized: shouldFinalize,
      risk: initialTriage.risk,
      urgency: initialTriage.urgency,
      requiredServices: initialTriage.required_services
    };

    await dataStore.createTriageSession(session);

    // Log the triage event to population intelligence logs
    await dataStore.logTriageSession({
      symptom: symptoms,
      language: session.language,
      risk: session.risk,
      county: county,
      is_emergency: initialTriage.is_emergency
    });

    if (shouldFinalize) {
      return res.status(200).json({
        success: true,
        message: "Triage evaluation completed immediately due to clinical priority constraints.",
        data: {
          sessionId: session.id,
          finalized: true,
          risk: session.risk,
          urgency: session.urgency,
          requiredServices: session.requiredServices,
          disclaimer: initialTriage.disclaimer,
          advisory_note: initialTriage.advisory_note || null
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conversational triage session started.",
      data: {
        sessionId: session.id,
        finalized: false,
        nextQuestion: session.questions[0],
        totalQuestions: session.questions.length,
        currentIndex: 0
      }
    });

  } catch (error) {
    console.error("Error starting triage session:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error starting triage session."
    });
  }
};

/**
 * Respond to a triage question and advance the interrogation state
 * POST /api/triage/respond
 */
exports.respondToTriage = async (req, res) => {
  try {
    const { sessionId, answer } = req.body;

    if (!sessionId || answer === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: 'sessionId' and 'answer' are mandatory."
      });
    }

    const session = await dataStore.getTriageSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: `Triage session ID ${sessionId} not found.`
      });
    }

    if (session.finalized) {
      return res.status(400).json({
        success: false,
        error: "This triage session has already been finalized.",
        results: {
          risk: session.risk,
          urgency: session.urgency,
          requiredServices: session.requiredServices
        }
      });
    }

    // Save answer at current index
    const updatedAnswers = [...session.answers];
    updatedAnswers[session.currentIndex] = answer.trim();

    let nextIndex = session.currentIndex + 1;
    let finalized = false;
    let finalRisk = session.risk;
    let finalUrgency = session.urgency;
    let finalServices = session.requiredServices;
    let advisoryNote = null;

    // CLINICAL ESCALATION LOGIC (Doctor-like warning signs detection)
    // Evaluate patient answer for critical warnings.
    const cleanAnswer = answer.toLowerCase().trim();
    const indicatesWarning = cleanAnswer.includes("yes") || cleanAnswer.includes("ndio") || 
                            cleanAnswer.includes("stiff") || cleanAnswer.includes("heavy") ||
                            cleanAnswer.includes("severe") || cleanAnswer.includes("shida") ||
                            cleanAnswer.includes("breath");

    // Case 1: If patient answers "Yes" to a dangerous symptom (like stiff neck or arm pain), escalate to emergency immediately!
    if (indicatesWarning) {
      const currentQuestion = session.questions[session.currentIndex];
      
      // If the question is about warning signs (e.g., stiff neck, left arm pain, breath difficulties)
      if (currentQuestion.includes("stiff neck") || currentQuestion.includes("left arm") || currentQuestion.includes("fever") || currentQuestion.includes("breathing")) {
        finalized = true;
        finalRisk = "critical";
        finalUrgency = "emergency";
        finalServices = ["Emergency Care", "Inpatient", "Laboratory"];
        advisoryNote = `⚠️ CLINICAL ESCALATION: Patient confirmed warning indicator ("${answer}"). Redirecting immediately to Emergency routing.`;
        console.log(`[Clinical Triage] Escalating Session ${sessionId} to Emergency due to warning confirmation.`);
      }
    }

    // Case 2: Standard progression
    if (!finalized) {
      if (nextIndex >= session.questions.length) {
        finalized = true;
        // Finalize standard diagnosis mapping
        console.log(`[Clinical Triage] Finalizing Triage Session ${sessionId} after full question loop.`);
      }
    }

    // Update database session
    const updatedSession = await dataStore.updateTriageSession(sessionId, {
      currentIndex: nextIndex,
      answers: updatedAnswers,
      finalized,
      risk: finalRisk,
      urgency: finalUrgency,
      requiredServices: finalServices
    });

    if (finalized) {
      // Re-log updated finalized triage data to demand analytics
      await dataStore.logTriageSession({
        symptom: `Initial: ${session.initialSymptoms} | Clarified Answers: ${updatedAnswers.join('; ')}`,
        language: session.language,
        risk: finalRisk,
        county: session.county,
        is_emergency: finalRisk === 'critical'
      });

      return res.status(200).json({
        success: true,
        message: "Triage session complete. Results finalized.",
        data: {
          sessionId,
          finalized: true,
          risk: finalRisk,
          urgency: finalUrgency,
          requiredServices: finalServices,
          advisory_note: advisoryNote,
          disclaimer: "⚠️ This is not a diagnosis. If symptoms worsen, please travel to the closest care facility immediately."
        }
      });
    }

    // Otherwise, present next question
    return res.status(200).json({
      success: true,
      message: "Answer recorded. Advancing interrogation.",
      data: {
        sessionId,
        finalized: false,
        nextQuestion: session.questions[nextIndex],
        totalQuestions: session.questions.length,
        currentIndex: nextIndex
      }
    });

  } catch (error) {
    console.error("Error in respondToTriage controller:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error in conversational triage handler."
    });
  }
};

/**
 * Legacy single-turn fallback endpoint (retains standard compatibility)
 */
exports.analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms, county = "Unknown", language } = req.body;

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Symptoms description is required as a non-empty string."
      });
    }

    const triageResult = aiTriageService.performTriage(symptoms);

    if (language) {
      triageResult.language_detected = language;
    }

    await dataStore.logTriageSession({
      symptom: triageResult.symptom_summary,
      language: triageResult.language_detected,
      risk: triageResult.risk,
      county: county,
      is_emergency: triageResult.is_emergency
    });

    return res.status(200).json({
      success: true,
      data: triageResult
    });

  } catch (error) {
    console.error("Error in symptom triage controller:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error in clinical triage module."
    });
  }
};
