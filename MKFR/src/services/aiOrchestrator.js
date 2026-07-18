/**
 * Multi-Agent AI Orchestrator Service
 * Coordinates specialized AI agents: Medical Orchestrator, Hospital Recommendation AI,
 * GBV Detection, GBV Counselor, and Fake Medicine Verification.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const dataStore = require('../models/dataStore');
const routingEngine = require('./routingEngine');
const kmhfrService = require('./kmhfrService');

// Retrieve Gemini API Key from environment configurations
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.VERTEX_API_KEY || process.env.VITE_VERTEX_API_KEY;

let genAI = null;
let aiEnabled = false;

if (apiKey && apiKey.trim() !== "") {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    aiEnabled = true;
    console.log("🤖 [AI Orchestrator] Google Generative AI loaded successfully.");
  } catch (err) {
    console.error("⚠️ [AI Orchestrator] Error initializing GenAI SDK:", err.message);
  }
} else {
  console.warn("⚠️ [AI Orchestrator] VITE_GEMINI_API_KEY / VERTEX_API_KEY not set. Operating in rule-based mode.");
}

/**
 * Helper to call Gemini model with system instructions
 */
async function callAgent(systemPrompt, userPrompt, jsonMode = false) {
  if (!aiEnabled || !genAI) {
    throw new Error("AI is not configured. Add your API key to .env.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: jsonMode ? "application/json" : "text/plain"
    }
  });

  const result = await model.generateContent(userPrompt);
  const response = await result.response;
  return response.text().trim();
}

// ============================================================================
// AGENT DEFINITIONS & PROMPTS
// ============================================================================

/**
 * Agent 1: Medical Triage AI (Orchestrator)
 * Evaluates message and returns classification & service requirements JSON
 */
async function runMedicalOrchestrator(messageText, historyText) {
  const systemPrompt = `You are AFYAROOT AI, an intelligent healthcare orchestration system designed specifically for Kenya.
Your mission is NOT simply to answer questions.
Your responsibility is to guide the user through their healthcare journey while prioritizing safety, empathy, accessibility, and continuity of care.
You are the first point of contact for rural and urban communities.

You must determine:
• What the user needs
• How urgent the situation is
• Whether emergency care is required
• Whether GBV may be involved
• Whether counterfeit medicine verification is requested
• Whether the user is searching for a healthcare facility
• Whether follow-up is required
• Whether additional clarification questions are needed

Never immediately assume a diagnosis.
Always collect enough information before suggesting possible causes.
If symptoms are incomplete, ask follow-up questions.
Always explain information in simple language.
Never prescribe medication.
Never invent hospitals.
Never invent medical facts.
If confidence is low, say you are unsure.
If symptoms suggest a medical emergency, immediately recommend emergency care.
Always maintain conversation memory.
Always continue previous conversations when available.

You support:
• SMS
• Voice
• Web
• Community Health Worker mode

Return JSON only matching the schema.

JSON Schema:
{
  "category": "NORMAL_HEALTH | GBV | EMERGENCY | MENTAL_HEALTH | MEDICINE_VERIFICATION | FACILITY_SEARCH | GENERAL",
  "urgency": "LOW | MEDIUM | HIGH | CRITICAL",
  "required_services": ["Emergency Care", "Maternity", "Pediatrics", "Internal Medicine", "Oncology", "Orthopaedics", "Mental Health Services", "TB Clinic", "HIV Care", "Cardiology", "Neurology", "Burn Care", "Outpatient"],
  "possible_conditions": [],
  "needs_hospital": true,
  "needs_followup": true,
  "clarification_questions": []
}`;

  const userPrompt = `Conversation History Context (if any):\n${historyText}\n\nIncoming message to process:\n"${messageText}"`;
  
  try {
    const rawJson = await callAgent(systemPrompt, userPrompt, true);
    return JSON.parse(rawJson);
  } catch (err) {
    throw new Error(`Medical Orchestrator failed: ${err.message}`);
  }
}

/**
 * Agent 2: Hospital Recommendation AI
 * Receives facilities supplied by backend, selects and ranks top 3
 */
async function runHospitalRecommendationAI(hospitalsList, userQuery) {
  const systemPrompt = `You are the AFYAROOT Hospital Recommendation AI.
Your responsibility is selecting the most appropriate healthcare facility.
You NEVER invent hospitals.
You ONLY use facilities supplied by the backend.

Each hospital includes:
• Name
• County
• GPS Coordinates
• KEPH Level
• Services
• Specialties
• Opening Status
• Contact Information
• Distance

Your objective is NOT to recommend the closest hospital.
Instead, recommend the hospital most capable of treating the user's condition.

Prioritize in this order:
1. Required clinical service
2. Emergency capability
3. Hospital level
4. Availability of specialty
5. Distance
6. Operating status

Never recommend facilities that do not provide the required service.
Always explain WHY each hospital was selected.
Return maximum three hospitals.
Return JSON.

Example Output:
{
  "recommended_hospitals": [
      {
          "name": "Kakamega County General Referral Hospital",
          "reason": "Offers 24-hour Emergency Obstetric Care, Level 5 support, and has a dedicated blood bank for maternity emergencies.",
          "distance": "1.8 km",
          "services": ["Emergency Care", "Maternity"]
      }
  ]
}`;

  const userPrompt = `REAL BACKEND HOSPITALS LIST:\n${JSON.stringify(hospitalsList, null, 2)}\n\nUser query details:\n"${userQuery}"`;

  try {
    const rawJson = await callAgent(systemPrompt, userPrompt, true);
    return JSON.parse(rawJson);
  } catch (err) {
    throw new Error(`Hospital Recommendation AI failed: ${err.message}`);
  }
}

/**
 * Agent 3: GBV Detection Agent
 * Specifically parses message to identify GBV severity
 */
async function runGbvDetection(messageText) {
  const systemPrompt = `You are AFYAROOT GBV Protection AI.
Your only responsibility is detecting Gender Based Violence.
Detect: Domestic violence, Sexual assault, Threats, Forced marriage, Emotional abuse, Financial abuse, Child abuse, Human trafficking, Online harassment, Stalking.
Return JSON only matching the schema of the example.
Never expose your reasoning in the JSON keys.

Example Output:
{
 "gbv_detected": true,
 "type": "Domestic Violence",
 "risk": "HIGH",
 "needs_immediate_help": true,
 "confidence": 0.98
 }`;

  try {
    const rawJson = await callAgent(systemPrompt, `Message: "${messageText}"`, true);
    return JSON.parse(rawJson);
  } catch (err) {
    throw new Error(`GBV Detector offline: ${err.message}`);
  }
}

/**
 * Agent 4: GBV Counselor
 * Empathetic response builder for GBV cases
 */
async function runGbvCounselor(messageText, historyText) {
  const systemPrompt = `You are an empathetic Gender-Based Violence (GBV) Counselor and Support Agent.
Your mission is to validate, support, and safely gather information to understand the situation so that human social workers and emergency coordinators can intervene effectively.

Rules:
1. Never blame, judge, or pressure the survivor.
2. Maintain a calm, supportive, and validating tone.
3. Gently and step-by-step gather information to investigate the case details:
   - Ask if they are currently safe and if they need urgent medical attention or shelter.
   - Ask about when the incident occurred.
   - Ask if children are present or in danger.
   - Ask about the nature of the threat or assault.
4. Explain clearly to the user: "I am asking these questions so we can gather the necessary details to help coordinate immediate protection, counseling, or medical care with local responders."
5. Provide the Kenya national helpline 1195.
6. Advise the user to clear their chat history if they believe the perpetrator has access to their device.`;

  const userPrompt = `Conversation History Context:\n${historyText}\n\nUser message:\n"${messageText}"`;
  
  try {
    return await callAgent(systemPrompt, userPrompt, false);
  } catch (err) {
    throw new Error(`GBV Counselor offline: ${err.message}`);
  }
}

/**
 * Agent 5: Fake Medicine Detection
 * Checks details to flags potential counterfeit medications
 */
async function runMedicineVerification(messageText, historyText) {
  const systemPrompt = `You are AFYAROOT Medicine Verification AI.
Your task: Determine whether a medicine might be counterfeit.
Inputs evaluated: Medicine name, Manufacturer, Batch number, Expiry date, Packaging details, barcode.
Return JSON only matching the schema of the example.
If uncertain, return status: "UNKNOWN". Never guess.

Example Output:
{
 "status": "LIKELY_GENUINE",
 "confidence": 0.91,
 "reason": "Packaging and batch structure matches registered manufacturer details"
 }`;

  const userPrompt = `History Context:\n${historyText}\n\nUser Input details:\n"${messageText}"`;

  try {
    const rawJson = await callAgent(systemPrompt, userPrompt, true);
    return JSON.parse(rawJson);
  } catch (err) {
    return {
      status: "UNKNOWN",
      confidence: 0.5,
      reason: "Local AI system offline. Please cross-examine with the Pharmacy and Poisons Board (PPB) registry."
    };
  }
}

/**
 * Agent 6: SMS Formatter
 * Shortens text to fit standard SMS limitations (< 320 characters)
 */
async function runSmsFormatter(responseText) {
  const systemPrompt = `You are AFYAROOT SMS Assistant.
Your task is to rewrite the input response to fit SMS limits.
Rules:
1. Keep replies under 320 characters.
2. Avoid markdown (no bold, asterisks, headers, or bullet lists).
3. Avoid long explanations.
4. Always prioritize actionable information.
5. Emergency recommendations must come first.`;

  try {
    return await callAgent(systemPrompt, `Rewrite this text for SMS:\n"${responseText}"`, false);
  } catch (err) {
    return responseText.replace(/[\*\#\_]/g, "").slice(0, 310) + "...";
  }
}

/**
 * Agent 7: Web Chat Formatter
 * Enriches response for standard web/app client browsers
 */
async function runChatFormatter(responseText) {
  const systemPrompt = `You are AFYAROOT Chat Assistant for Web.
Format the response text beautifully for a browser chat client.
You can include:
- Markdown formatting (bold, italic, code tags).
- Bullet lists.
- Structured emergency warnings.
- Hospital details organized in clean blocks.`;

  try {
    return await callAgent(systemPrompt, `Format this text for Web Chat:\n"${responseText}"`, false);
  } catch (err) {
    return responseText;
  }
}

// ============================================================================
// CORE ORCHESTRATOR WORKFLOW
// ============================================================================

/**
 * Processes an incoming user message, classifies, routes, saves state, and formats output.
 * 
 * @param {object} params
 * @param {string} params.text - Incoming user message text
 * @param {string} [params.phoneNumber] - Patient phone number (for SMS/WhatsApp channel)
 * @param {string} [params.webUserId] - Web client unique UUID (for Web channel)
 * @param {'SMS'|'WEB'|'WHATSAPP'|'VOICE'} params.channel - Connection channel
 * @param {number} [params.userLat] - Latitude coordinates (for location search)
 * @param {number} [params.userLng] - Longitude coordinates (for location search)
 */
async function processUserMessage(params) {
  const { text, phoneNumber = null, webUserId = null, channel, userLat = null, userLng = null } = params;

  if (!text || text.trim() === "") {
    throw new Error("Message text cannot be empty.");
  }

  // 1. Resolve or create unified conversation thread
  let conversation = await dataStore.getConversationByPhoneOrWebId(phoneNumber, webUserId);
  if (!conversation) {
    const conversationId = "CONV-" + Math.floor(100000 + Math.random() * 900000);
    conversation = await dataStore.createConversation({
      id: conversationId,
      phoneNumber,
      webUserId,
      channel
    });
  }

  // 2. Load recent conversation history for memory context
  const previousMessages = await dataStore.getMessagesByConversationId(conversation.id);
  const recentHistory = previousMessages.slice(-10); // Keep last 10 turns
  const historyText = recentHistory.map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.message}`).join('\n');

  // 3. Save incoming user message
  const userMessageId = "MSG-" + Math.floor(100000 + Math.random() * 900000);
  await dataStore.createMessage({
    id: userMessageId,
    conversationId: conversation.id,
    sender: 'user',
    message: text,
    channel,
    classification: null,
    aiModel: null,
    status: 'received'
  });

  // 4. Run Agent 1: Medical Triage AI (Orchestrator)
  const triageResult = await runMedicalOrchestrator(text, historyText);
  console.log(`[AI Orchestrator] Routed category: ${triageResult.category} (Urgency: ${triageResult.urgency})`);

  let finalRawResponse = "";
  let matchedHospitals = [];
  let modelName = "gemini-2.5-flash-lite";

  // 5. Orchestrate based on triage category
  if (triageResult.category === "GBV") {
    // Run Agent 3: specialized GBV Detection Check
    const gbvDetails = await runGbvDetection(text);
    console.log(`[GBV Detection] Detected? ${gbvDetails.gbv_detected} (${gbvDetails.type})`);
    
    if (gbvDetails.gbv_detected) {
      // Route to Agent 4: GBV Counselor
      finalRawResponse = await runGbvCounselor(text, historyText);
    } else {
      // Fall back to Medical Orchestrator triage text if false positive
      finalRawResponse = `Based on triage analysis, we noticed concerns but no ongoing GBV details. Urgency is ${triageResult.urgency}.`;
    }
  } else if (triageResult.category === "MEDICINE_VERIFICATION") {
    // Route to Agent 5: Fake Medicine Verification
    const medVerification = await runMedicineVerification(text, historyText);
    finalRawResponse = `**Medicine Verification Result:**\nStatus: ${medVerification.status}\nConfidence: ${(medVerification.confidence * 100).toFixed(0)}%\nReason: ${medVerification.reason}`;
  } else {
    // Medical/Triage search flow
    let hospitalText = "";

    // If clarification questions are requested, ask them
    if (triageResult.clarification_questions && triageResult.clarification_questions.length > 0) {
      finalRawResponse = `I understand you are reporting symptoms. To help me triage your situation, please answer these questions:\n\n` + 
                         triageResult.clarification_questions.map((q, i) => `${i+1}. ${q}`).join('\n');
    } else {
      // General triage advice
      finalRawResponse = `**Triage Category:** ${triageResult.category}\n` +
                         `**Urgency Level:** ${triageResult.urgency}\n` +
                         `**Possible Conditions under consideration:** ${triageResult.possible_conditions.join(', ') || 'N/A'}\n\n` +
                         `Please consult a medical professional for actual diagnosis.`;
    }

    // Check if hospital is needed and location is supplied
    if (triageResult.needs_hospital && userLat && userLng) {
      console.log(`[KMHFR Query] Fetching clinics near (${userLat}, ${userLng})`);
      const lat = parseFloat(userLat);
      const lng = parseFloat(userLng);

      const isEmergency = triageResult.category === "EMERGENCY" || triageResult.urgency === "CRITICAL";

      // Query database facilities
      const facilities = await routingEngine.routeAndScore({
        userLat: lat,
        userLng: lng,
        requiredServices: triageResult.required_services,
        isEmergency: isEmergency
      });

      // Extract options
      const rawOptions = isEmergency ? (facilities.all_emergency_options || []) : facilities;
      matchedHospitals = rawOptions.slice(0, 5); // Fetch top 5 for recommendation AI

      if (matchedHospitals.length > 0) {
        // Run Agent 2: Hospital Recommendation AI to select and rank top 3
        const recommendations = await runHospitalRecommendationAI(matchedHospitals, text);
        
        if (recommendations.recommended_hospitals && recommendations.recommended_hospitals.length > 0) {
          hospitalText = `\n\n### 🏥 Recommended Medical Facilities (Best fit for your symptoms):\n` +
            recommendations.recommended_hospitals.map((h, i) => 
              `**${i+1}. ${h.name}** (${h.distance})\n` +
              `* **Why:** ${h.reason}\n` +
              `* **Services:** ${h.services.join(', ')}`
            ).join('\n\n');
        }
      }
    }

    // Append hospital details if any
    if (hospitalText) {
      finalRawResponse += hospitalText;
    }
  }

  // 6. Format response based on input channel
  let formattedResponse = "";
  if (channel === "SMS") {
    // Run Agent 6: SMS Formatter
    formattedResponse = await runSmsFormatter(finalRawResponse);
    modelName += " + sms-assistant";
  } else if (channel === "VOICE") {
    // Formats for voice (short natural sentences)
    formattedResponse = finalRawResponse.split('.')[0] + ". Please check your PWA screen for clinic route details.";
    modelName += " + voice-assistant";
  } else {
    // Run Agent 7: Chat Formatter
    formattedResponse = await runChatFormatter(finalRawResponse);
    modelName += " + web-chat-assistant";
  }

  // 7. Save agent response message
  const agentMessageId = "MSG-" + Math.floor(100000 + Math.random() * 900000);
  const savedMsg = await dataStore.createMessage({
    id: agentMessageId,
    conversationId: conversation.id,
    sender: 'agent',
    message: formattedResponse,
    channel,
    classification: {
      category: triageResult.category,
      urgency: triageResult.urgency,
      confidence: 1.0,
      reason: triageResult.possible_conditions.join(', ') || 'Medical Orchestration',
      intent: triageResult.required_services.join(', '),
      language_detected: 'English'
    },
    aiModel: modelName,
    status: 'sent'
  });

  return {
    conversationId: conversation.id,
    message: savedMsg
  };
}

module.exports = {
  processUserMessage
};
