/**
 * Multi-Agent AI Orchestrator Service
 * Coordinates specialized AI agents: Medical Orchestrator, Hospital Recommendation AI,
 * GBV Detection, GBV Counselor, and Fake Medicine Verification.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const dataStore = require('../models/dataStore');
const routingEngine = require('./routingEngine');
const kmhfrService = require('./kmhfrService');
const aiTriageService = require('./aiTriageService');

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

const candidateModels = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview"];

function safeParseJson(text, fallback = null) {
  try {
    const trimmed = (text || "").trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) return JSON.parse(trimmed);
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      return JSON.parse(trimmed.slice(first, last + 1));
    }
    return JSON.parse(text);
  } catch (e) {
    if (fallback !== null) return fallback;
    throw e;
  }
}

/**
 * Helper to call Gemini model with system instructions & multi-model fallback
 */
async function callAgent(systemPrompt, userPrompt, jsonMode = false) {
  if (!aiEnabled || !genAI) {
    throw new Error("AI is not configured. Add your API key to .env.");
  }

  let lastError = null;
  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: jsonMode ? "application/json" : "text/plain"
        }
      });

      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      return response.text().trim();
    } catch (err) {
      lastError = err;
      if (err.message && (err.message.includes('429') || err.message.includes('Quota') || err.message.includes('limit') || err.message.includes('not found') || err.message.includes('503'))) {
        console.warn(`[AI Orchestrator] Model ${modelName} rate limited or unavailable, switching to next fallback...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("All AI models unavailable.");
}

// ============================================================================
// AGENT DEFINITIONS & PROMPTS
// ============================================================================

/**
 * Agent 1: Medical Triage AI (Orchestrator)
 * Evaluates message and returns classification & service requirements JSON
 */
async function runMedicalOrchestrator(messageText, historyText) {
  const systemPrompt = `You are AFYAROOT AI, a friendly, intelligent healthcare triage companion designed for Kenya.
Your mission is to provide warm, empathetic, safe, and actionable healthcare guidance to patients.

Key Rules:
1. Conversational Triage & Symptom Accumulation:
   - CRITICAL: Read the Conversation History Context carefully. When the user previously reported symptoms (e.g. "I have a headache") and now adds more symptoms (e.g. "fever", "diarrhea"), COMBINE and SYNTHESIZE ALL reported symptoms into a unified, cumulative triage assessment.
   - Multi-symptom mappings:
     * Headache alone -> Tension Headache or Migraine (Urgency: LOW).
     * Fever alone -> Acute Febrile Illness / Possible Malaria (Urgency: MEDIUM).
     * Headache + Fever -> Acute Febrile Illness / Possible Malaria or Viral Infection (Urgency: MEDIUM).
     * Headache + Fever + Diarrhea / Vomiting -> Acute Gastroenteritis, Typhoid, or Systemic Infection with dehydration risk (Urgency: MEDIUM or HIGH).
     * Diarrhea / Vomiting alone -> Gastroenteritis / Dehydration risk (Urgency: MEDIUM).
     * Chest pain / severe breathlessness / severe bleeding / unconsciousness -> Emergency Care (Urgency: CRITICAL).
   - If this is the FIRST message (no prior conversation history) and the user provided only a brief vague single symptom (e.g. "I have a headache", "Ninaumwa"), ask 1-2 friendly, brief clarifying questions in "clarification_questions" (e.g. duration of symptoms and current location/town).
   - If conversation history exists (the user has answered or replied with duration, location, or additional symptoms), DO NOT ask questions. Set "clarification_questions": [] and synthesize a final assessment immediately.
2. Clinical Safety:
   - Always classify accurate urgency: LOW, MEDIUM, HIGH, or CRITICAL.
   - Identify required services (e.g. Outpatient, Maternity, Emergency Care, Pediatrics, Internal Medicine, Laboratory, Pharmacy, Inpatient).
   - Never prescribe prescription medications. Never invent fake hospitals.
3. Keep all responses compassionate, clear, and actionable.

JSON Schema:
{
  "category": "NORMAL_HEALTH | GBV | EMERGENCY | MENTAL_HEALTH | MEDICINE_VERIFICATION | FACILITY_SEARCH | GENERAL",
  "urgency": "LOW | MEDIUM | HIGH | CRITICAL",
  "required_services": ["Emergency Care", "Maternity", "Pediatrics", "Internal Medicine", "Oncology", "Orthopaedics", "Mental Health Services", "TB Clinic", "HIV Care", "Cardiology", "Neurology", "Burn Care", "Outpatient", "Laboratory", "Pharmacy", "Inpatient"],
  "possible_conditions": ["Condition Name"],
  "needs_hospital": true,
  "needs_followup": false,
  "clarification_questions": []
}`;

  const cleanMsg = (messageText || "").trim();
  const isGreeting = /^(hello|hi|hey|jambo|habari|mambo|sasa|hallo|good\s*(morning|afternoon|evening|day)|niaje|vipi)[\s\.,!?:-]*$/i.test(cleanMsg) ||
                     (/^(hello|hi|hey|jambo|habari|mambo|sasa|hallo|good\s*(morning|afternoon|evening))\b/i.test(cleanMsg) && cleanMsg.split(/\s+/).length <= 4);
  const isReset = /^(reset|clear|start|restart|anza\s*upya)[\s\.,!?:-]*$/i.test(cleanMsg);

  if (isGreeting || isReset) {
    return {
      category: "GENERAL",
      urgency: "LOW",
      required_services: ["Outpatient"],
      possible_conditions: ["General Health Inquiry"],
      needs_hospital: false,
      needs_followup: false,
      is_greeting: true,
      clarification_questions: []
    };
  }

  const userPrompt = `Conversation History Context (if any):\n${historyText}\n\nIncoming message to process:\n"${messageText}"`;

  try {
    const rawJson = await callAgent(systemPrompt, userPrompt, true);
    return safeParseJson(rawJson);
  } catch (err) {
    const currentContext = messageText.toLowerCase();
    const historyContext = (historyText || "").toLowerCase();
    // Combine full session context to accumulate all reported symptoms across turns
    const combinedContext = `${historyContext} ${currentContext}`;

    const isEmergency = /chest pain|bleeding|breath|pumzi|damu|kifua|unconscious|zirai|convuls/i.test(combinedContext);
    const isGbv = /violence|beaten|abuse|assault|piga|bakwa|tishi|tishia/i.test(combinedContext);

    if (isGbv) {
      return {
        category: "GBV",
        urgency: "HIGH",
        required_services: ["Mental Health Services", "Emergency Care"],
        possible_conditions: ["Gender-Based Violence Support"],
        needs_hospital: true,
        needs_followup: true,
        clarification_questions: []
      };
    }

    if (isEmergency) {
      return {
        category: "EMERGENCY",
        urgency: "CRITICAL",
        required_services: ["Emergency Care", "Inpatient"],
        possible_conditions: ["Severe Acute Medical Concern (Dharura)"],
        needs_hospital: true,
        needs_followup: true,
        clarification_questions: []
      };
    }

    // Comprehensive symptom detection with typo tolerance
    const hasHeadache = /head\s*ache|headache|headaches|kichwa|migraine/i.test(combinedContext);
    const hasFever = /fever|fevers|high\s*temp|temperature|homa|joto|malaria/i.test(combinedContext);
    const hasDiarrhea = /diarrhea|diarrhoea|dirhoes|dirrhea|diarhea|diarrea|kuhara|running\s*stomach|loose\s*stool|watery\s*stool/i.test(combinedContext);
    const hasVomiting = /vomit|vomiting|tapika|kutapika|nausea|chefuchefu/i.test(combinedContext);
    const hasStomachPain = /stomach|tumbo|abdominal|cramps|tummy/i.test(combinedContext);
    const hasDizziness = /dizzy|dizziness|kizunguzungu|lightheaded|faint/i.test(combinedContext);
    const hasCough = /cough|kukohoa|flu|mafua|cold|kikooa|kukooa/i.test(combinedContext);

    let detectedCondition = "General Health Inquiry";
    let detectedServices = ["Outpatient", "Internal Medicine"];
    let detectedUrgency = "LOW";

    // Multi-symptom synthesis hierarchy
    if (hasHeadache && hasFever && (hasDiarrhea || hasVomiting || hasStomachPain)) {
      detectedCondition = "Acute Gastroenteritis, Typhoid, or Systemic Infection with Diarrhea (Homa, Kichwa na Kuhara)";
      detectedServices = ["Outpatient", "Laboratory", "Pharmacy", "Inpatient"];
      detectedUrgency = "MEDIUM";
    } else if (hasHeadache && hasFever) {
      detectedCondition = "Acute Febrile Illness / Possible Malaria or Viral Infection (Homa Kali na Kichwa)";
      detectedServices = ["Outpatient", "Laboratory", "Pharmacy"];
      detectedUrgency = "MEDIUM";
    } else if (hasFever && (hasDiarrhea || hasVomiting || hasStomachPain)) {
      detectedCondition = "Gastroenteritis with Fever / Enteric Infection (Homa na Kuhara)";
      detectedServices = ["Outpatient", "Laboratory", "Pharmacy"];
      detectedUrgency = "MEDIUM";
    } else if (hasDiarrhea || hasVomiting || hasStomachPain) {
      detectedCondition = "Gastroenteritis / Stomach Infection (Maumivu ya Tumbo na Kuhara)";
      detectedServices = ["Outpatient", "Laboratory", "Pharmacy"];
      detectedUrgency = "MEDIUM";
    } else if (hasFever) {
      detectedCondition = "Acute Febrile Illness / Possible Malaria (Homa Kali)";
      detectedServices = ["Outpatient", "Laboratory"];
      detectedUrgency = "MEDIUM";
    } else if (hasHeadache) {
      detectedCondition = "Tension Headache or Migraine (Kuumwa na Kichwa)";
      detectedServices = ["Outpatient", "Pharmacy"];
      detectedUrgency = "LOW";
    } else if (hasDizziness) {
      detectedCondition = "Dehydration, Low Blood Pressure, or Vertigo (Kizunguzungu)";
      detectedServices = ["Outpatient"];
      detectedUrgency = "LOW";
    } else if (hasCough) {
      detectedCondition = "Upper Respiratory Infection / Flu (Kikohozi na Mafua)";
      detectedServices = ["Outpatient", "Pharmacy"];
      detectedUrgency = "LOW";
    }

    // Check if brief initial message that needs location/duration clarification (only if no history exists yet)
    const hasLocationOrDuration = /siku|days|hours|masaa|kakamega|lurambi|mmust|nairobi|clinic|hospital|karibu/i.test(combinedContext);
    const hasHistory = historyText && historyText.trim().length > 0;
    const isInitialShort = !hasHistory && !hasLocationOrDuration && messageText.trim().split(/\s+/).length <= 5;

    return {
      category: "NORMAL_HEALTH",
      urgency: detectedUrgency,
      required_services: detectedServices,
      possible_conditions: [detectedCondition],
      needs_hospital: detectedUrgency !== "LOW",
      needs_followup: false,
      clarification_questions: isInitialShort && detectedCondition !== "General Health Inquiry" ? [
        "How long have you felt this way (hours or days)?",
        "Which town or area are you currently located in?"
      ] : []
    };
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

  const compactList = (Array.isArray(hospitalsList) ? hospitalsList : []).slice(0, 4).map(h => {
    const rawDist = typeof h.distance_km === 'number' ? h.distance_km : (typeof h.distance === 'number' ? h.distance : null);
    let distStr = 'Nearby';
    if (rawDist !== null) {
      if (rawDist < 0.05) distStr = '< 50m (Walking distance)';
      else if (rawDist < 1) distStr = `${Math.max(50, Math.round(rawDist * 1000))}m`;
      else distStr = `${rawDist.toFixed(1)} km`;
    } else if (typeof h.distance === 'string' && h.distance.trim()) {
      distStr = h.distance;
    }
    return {
      name: h.name,
      keph_level: h.keph_level || h.kephLevel || '4',
      distance: distStr,
      services: (Array.isArray(h.services) ? h.services : []).slice(0, 4)
    };
  });

  const userPrompt = `REAL BACKEND HOSPITALS LIST:\n${JSON.stringify(compactList, null, 2)}\n\nUser query details:\n"${userQuery}"`;

  try {
    const rawJson = await callAgent(systemPrompt, userPrompt, true);
    const parsed = safeParseJson(rawJson);
    if (parsed && Array.isArray(parsed.recommended_hospitals) && parsed.recommended_hospitals.length > 0) {
      return parsed;
    }
    throw new Error("Empty recommendation array");
  } catch (err) {
    console.warn(`[Hospital Recommendation AI] Local fallback: ${err.message}`);
    return {
      recommended_hospitals: compactList.slice(0, 2).map(h => ({
        name: h.name,
        reason: `Level ${h.keph_level} facility offering ${h.services.join(', ') || 'Outpatient care'}.`,
        distance: h.distance,
        services: h.services.length > 0 ? h.services : ['Outpatient']
      }))
    };
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
    return safeParseJson(rawJson);
  } catch (err) {
    console.warn(`[GBV Detector] Local fallback: ${err.message}`);
    return {
      gbv_detected: /violence|beaten|abuse|assault|piga|bakwa|tishi|tishia/i.test(messageText),
      type: "Domestic / Personal Safety Alert",
      risk: "HIGH",
      needs_immediate_help: true,
      confidence: 0.95
    };
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
    console.warn(`[GBV Counselor] Local fallback: ${err.message}`);
    return "Pole sana. Usalama wako ni muhimu zaidi. Tuko hapa kukusaidia. Piga simu ya dharura ya bure 1195 kwa usaidizi wa haraka, ushauri, au ulinzi. Tafadhali hakikisha uko mahali salama.";
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
    return safeParseJson(rawJson);
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
 * Shortens text to fit standard SMS limitations (< 320 characters) with warm empathy
 */
async function runSmsFormatter(responseText, userLanguage = "English") {
  const systemPrompt = `You are the AFYAROOT Friendly SMS Health Assistant in Kenya.
Your job is to convert clinical triage information into a warm, empathetic, clear, and user-friendly SMS message for a patient on a basic mobile phone.

Rules:
1. Empathy & Tone: Start with a caring greeting (e.g. "Pole sana" in Swahili or "Hello, sorry to hear that" in English).
2. Plain Text Only: Strictly NO markdown symbols (no asterisks **, no headers #, no underscores _, no bullet dashes -).
3. Brevity: Keep the total length strictly under 320 characters so it fits on standard mobile SMS screens.
4. Content Structure:
   - Brief assessment/empathy (e.g. "Likely Malaria/Fever").
   - 1 helpful self-care tip (e.g. "Drink plenty of water and rest").
   - Recommended facility name and level if available (e.g. "Recommended: Kakamega County Referral (Level 5) for lab check.").
   - Emergency advice if high urgency (e.g. "If severe, visit casualty immediately or call 999.").
5. Language: Match the detected language (${userLanguage} - Swahili, Sheng, or English).`;

  try {
    return await callAgent(systemPrompt, `Rewrite this text into a warm, friendly SMS:\n"${responseText}"`, false);
  } catch (err) {
    // Check if clarification questions
    if (/please answer|jibu maswali|1\.\s*How long|1\.\s*Je|clarification/i.test(responseText)) {
      if (userLanguage === "Swahili") {
        return "Pole sana. Ili kupata kituo sahihi: 1. Umeugua muda gani (masaa/siku)? 2. Uko mtaa au mji gani kwa sasa?";
      }
      return "Pole sana. To help find the best clinic for you: 1) How many days/hours have you felt this? 2) Which town/area are you located in?";
    }

    // Check if greeting
    if (/Habari! Mimi ni AFYAROOT|Hello! I am AFYAROOT/i.test(responseText)) {
      return responseText.replace(/[\*\#\_]/g, "").trim();
    }

    // Clean offline fallback without raw markdown or pipes
    const cleanText = responseText
      .replace(/[\*\#\_]/g, "")
      .replace(/###\s*🏥\s*/g, "")
      .replace(/Triage Assessment:\s*/gi, "Assessment: ")
      .replace(/Action Guidance:\s*/gi, "")
      .replace(/Self-Care & Home Guidance:\s*/gi, "Advice: ")
      .replace(/•\s*/g, "")
      .trim();

    // Extract first hospital mention if present
    let hospName = "";
    const hospMatch = cleanText.match(/\d+\.\s*([A-Za-z0-9\s\-]+(?:\([^\)]+\))?)/);
    if (hospMatch && !hospMatch[1].toLowerCase().includes("how long")) {
      hospName = hospMatch[1].trim();
    }

    const parts = cleanText.split('\n').map(p => p.trim()).filter(Boolean);
    let summary = parts.slice(0, 2).join('. ');
    if (hospName && !summary.includes(hospName)) {
      summary += `. Recommended Clinic: ${hospName}`;
    }
    return summary.length > 315 ? summary.slice(0, 310) + "..." : summary;
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

  const isSwahili = /homa|kichwa|tumbo|dawa|mgonjwa|hospitali|kuumwa|kuhara|asante|jambo|habari|pole|nisaidie|wapi|hali|mwili|daktari|kliniki|naumwa|sana|mambo|sasa|niaje|vipi/i.test(text);
  const detectedLang = isSwahili ? "Swahili" : "English";

  const cleanText = text.trim();
  const isGreetingInput = /^(hello|hi|hey|jambo|habari|mambo|sasa|hallo|good\s*(morning|afternoon|evening|day)|niaje|vipi)[\s\.,!?:-]*$/i.test(cleanText) ||
                          (/^(hello|hi|hey|jambo|habari|mambo|sasa|hallo|good\s*(morning|afternoon|evening))\b/i.test(cleanText) && cleanText.split(/\s+/).length <= 4);
  const isResetInput = /^(reset|clear|start|restart|anza\s*upya)[\s\.,!?:-]*$/i.test(cleanText);

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

  // 2. Load recent conversation history with 2-hour inactivity session expiration
  const previousMessages = await dataStore.getMessagesByConversationId(conversation.id);
  const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
  let recentHistory = [];

  if (previousMessages && previousMessages.length > 0) {
    const lastMsg = previousMessages[previousMessages.length - 1];
    const lastMsgTime = lastMsg.timestamp ? new Date(lastMsg.timestamp).getTime() : 0;
    const now = Date.now();

    // Only attach past history if within the 2-hour session window and not an explicit greeting / reset
    if (now - lastMsgTime < SESSION_TIMEOUT_MS && !isGreetingInput && !isResetInput) {
      recentHistory = previousMessages.slice(-8); // Keep last 8 turns of current active session
    }
  }

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
  if (triageResult.is_greeting || isGreetingInput || isResetInput) {
    // Welcoming greeting / session restart response without fake diagnoses
    if (isSwahili) {
      finalRawResponse = "Habari! Mimi ni AFYAROOT Msaidizi wa Afya. Unaendeleaje leo? Tafadhali niambie dalili unazohisi (kama vile homa, kikohozi, au maumivu ya tumbo) ili nikusaidie.";
    } else {
      finalRawResponse = "Hello! I am AFYAROOT Health Assistant. How are you feeling today? Please describe your symptoms (such as fever, cough, or stomach pain) so I can help guide you.";
    }
  } else if (triageResult.category === "GBV") {
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
    // Count previous user turns to strictly prevent repetitive question loops
    const priorUserMessagesCount = recentHistory.filter(m => m.sender === 'user').length;
    // Conclude immediately if user has already exchanged at least 1 turn or if message has enough details
    const forceConclusion = priorUserMessagesCount >= 1;
    const hasClarification = !forceConclusion && triageResult.clarification_questions && triageResult.clarification_questions.length > 0;
    const isExplicitHospitalSearch = triageResult.category === "FACILITY_SEARCH" || /hospital|clinic|dispensary|doctor|route|directions|where to go/i.test(text);
    const isMinorLowUrgency = (triageResult.urgency === "LOW" || triageResult.urgency === "LOW_RISK") && !isExplicitHospitalSearch;

    if (hasClarification) {
      // 1. Gather context first (1-2 friendly questions, only on initial message)
      const limitedQuestions = triageResult.clarification_questions.slice(0, 2);
      if (isSwahili) {
        finalRawResponse = `Pole sana kwa kuugua. Ili nikupe ushauri sahihi na hospitali ya karibu:\n` + 
                           limitedQuestions.map((q, i) => `${i+1}. ${q}`).join('\n');
      } else {
        finalRawResponse = `Pole sana! To help recommend the best nearby clinic and care for you, please answer:\n` + 
                           limitedQuestions.map((q, i) => `${i+1}. ${q}`).join('\n');
      }
    } else if (isMinorLowUrgency) {
      // 2. Minor symptom advice - supportive home care
      finalRawResponse = `**Triage Assessment:** ${triageResult.possible_conditions.join(', ') || 'Minor Symptom'}\n` +
                         `**Urgency:** Normal / Low Urgency\n\n` +
                         `**Self-Care & Home Guidance:**\n` +
                         `• Rest in a comfortable, quiet environment and stay well-hydrated.\n` +
                         `• Monitor your symptoms closely over the next 24 hours.\n` +
                         `• If symptoms persist, worsen, or if you develop high fever, severe pain, or difficulty breathing, visit a nearby clinic.`;
    } else {
      // 3. Moderate / High / Emergency or explicit hospital search - Clear diagnosis & immediate action
      finalRawResponse = `**Triage Assessment:** ${triageResult.possible_conditions.join(', ') || 'Health Assessment'}\n` +
                         `**Urgency Level:** ${triageResult.urgency}\n\n` +
                         `**Action Guidance:**\n` +
                         (triageResult.required_services && triageResult.required_services.length > 0 ? `• Recommended Clinical Services: ${triageResult.required_services.join(', ')}\n` : '') +
                         `• Please proceed to the recommended healthcare facility below for evaluation.\n` +
                         `• If symptoms worsen suddenly, seek immediate emergency care.`;
    }

    // Default to Kakamega central coordinates if not provided (e.g. over SMS)
    const defaultLat = 0.2828;
    const defaultLng = 34.7519;
    const lat = (userLat !== null && userLat !== undefined) ? parseFloat(userLat) : defaultLat;
    const lng = (userLng !== null && userLng !== undefined) ? parseFloat(userLng) : defaultLng;

    // Always attach hospital recommendations for completed assessments
    const isGreetingOrReset = triageResult.is_greeting || isGreetingInput || isResetInput;
    const shouldAttachHospitals = !isGreetingOrReset && !hasClarification && (channel === "SMS" || !isMinorLowUrgency || isExplicitHospitalSearch || triageResult.needs_hospital);

    if (shouldAttachHospitals) {
      console.log(`[KMHFR Query] Fetching clinics near (${lat}, ${lng})`);

      const isEmergency = triageResult.category === "EMERGENCY" || triageResult.urgency === "CRITICAL" || triageResult.urgency === "HIGH";

      // Query database facilities
      const facilities = await routingEngine.routeAndScore({
        userLat: lat,
        userLng: lng,
        requiredServices: (triageResult.required_services && triageResult.required_services.length > 0) ? triageResult.required_services : ["Outpatient"],
        isEmergency: isEmergency
      });

      // Extract options
      const rawOptions = isEmergency ? (facilities.all_emergency_options || []) : facilities;
      matchedHospitals = (Array.isArray(rawOptions) ? rawOptions : []).slice(0, 5); // Fetch top 5 for recommendation AI

      if (matchedHospitals.length > 0) {
        // Run Agent 2: Hospital Recommendation AI to select and rank top 3
        const recommendations = await runHospitalRecommendationAI(matchedHospitals, text);
        
        if (recommendations.recommended_hospitals && recommendations.recommended_hospitals.length > 0) {
          hospitalText = `\n\n### 🏥 Recommended Medical Facilities (Best fit for your symptoms):\n` +
            recommendations.recommended_hospitals.map((h, i) => 
              `**${i+1}. ${h.name}** (${h.distance || 'Nearby'})\n` +
              `* **Why:** ${h.reason}\n` +
              `* **Services:** ${(h.services || []).join(', ')}`
            ).join('\n\n');
        }
      }
    }

    // Append hospital details if appropriate
    if (hospitalText) {
      finalRawResponse += hospitalText;
    }
  }

  // 6. Format response based on input channel
  let formattedResponse = "";
  if (channel === "SMS") {
    // Run Agent 6: SMS Formatter
    formattedResponse = await runSmsFormatter(finalRawResponse, detectedLang);
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
