/**
 * AI Clinical Triage Layer ("Doctor Brain")
 * Implements symptom analysis, risk level classification, service mapping,
 * Swahili translation/mapping, and dynamic clarification questions.
 */

// Simple dictionary of English & Swahili keywords mapped to triage risk profiles
const CLINICAL_KNOWLEDGE_BASE = [
  {
    keywords: ["chest pain", "maumivu ya kifua", "heart attack", "kifua", "moyo", "sweating"],
    risk: "critical",
    urgency: "emergency",
    required_services: ["Emergency Care", "Cardiology", "Inpatient"],
    clarification_questions: [
      "Does the pain radiate to your left arm, neck, or jaw?",
      "Are you experiencing shortness of breath or heavy sweating?",
      "Is the pain sharp, stabbing, or does it feel like a heavy weight on your chest?"
    ],
    is_emergency: true
  },
  {
    keywords: ["bleeding", "damu", "kuvuja damu", "jeraha kubwa"],
    risk: "critical",
    urgency: "emergency",
    required_services: ["Emergency Care", "General Surgery", "Inpatient"],
    clarification_questions: [
      "Is the bleeding continuous and pulsing, or slow?",
      "Have you applied direct pressure, and did it stop the bleeding?",
      "Are you feeling lightheaded, dizzy, or faint?"
    ],
    is_emergency: true
  },
  {
    keywords: ["unconscious", "haajitambui", "hazirai", "zirai", "collapsed", "fainted", "unresponsive"],
    risk: "critical",
    urgency: "emergency",
    required_services: ["Emergency Care", "Inpatient"],
    clarification_questions: [
      "Is the person breathing at all?",
      "Did they hit their head when falling?",
      "How long have they been unresponsive?"
    ],
    is_emergency: true
  },
  {
    keywords: ["convulsing", "convulsion", "degedege", "spasms", "fits", "spasm"],
    risk: "critical",
    urgency: "emergency",
    required_services: ["Emergency Care", "Pediatrics", "Inpatient"],
    clarification_questions: [
      "Is the patient breathing or turning blue around the lips?",
      "How long has the convulsion lasted?",
      "Is there a high fever associated with the convulsion?"
    ],
    is_emergency: true
  },
  {
    keywords: ["breathing", "shida ya kupumua", "pumzi", "breath", "asthma", "pumu", "shortness of breath"],
    risk: "high",
    urgency: "emergency",
    required_services: ["Emergency Care", "Inpatient"],
    clarification_questions: [
      "Are you able to speak full sentences without gasping for breath?",
      "Are your lips or fingernails turning blue?",
      "Do you hear a wheezing sound when breathing?"
    ],
    is_emergency: true
  },
  {
    keywords: ["labor", "uchungu wa uzazi", "pregnancy", "mimba", "water broke", "kujifungua"],
    risk: "high",
    urgency: "urgent",
    required_services: ["Maternity", "Outpatient", "Inpatient"],
    clarification_questions: [
      "How far apart are the contractions (in minutes)?",
      "Has your amniotic fluid ('water') broken?",
      "Are you experiencing any spotting or bleeding?"
    ],
    is_emergency: false
  },
  {
    keywords: ["kidney pain", "dialysis", "renal", "figo", "maumivu ya figo", "kidney"],
    risk: "high/moderate",
    urgency: "non-emergency",
    required_services: ["Nephrology", "Laboratory", "Inpatient"],
    clarification_questions: [
      "Are you experiencing difficulty or pain when urinating?",
      "Do you have swelling in your legs, ankles, or feet?",
      "Have you been diagnosed with chronic kidney disease or renal failure?"
    ],
    is_emergency: false
  },
  {
    keywords: ["cancer", "oncology", "tumor", "saratani", "chemotherapy"],
    risk: "high/moderate",
    urgency: "non-emergency",
    required_services: ["Oncology", "Outpatient", "Laboratory"],
    clarification_questions: [
      "Have you noticed any unexplained lumps, severe fatigue, or weight loss?",
      "Have you received a staging or referral request from a physician?"
    ],
    is_emergency: false
  },
  {
    keywords: ["diabetes", "kisukari", "blood sugar", "insulin"],
    risk: "moderate",
    urgency: "non-emergency",
    required_services: ["Outpatient", "Laboratory", "Pharmacy"],
    clarification_questions: [
      "Are you experiencing extreme thirst, frequent urination, or blurred vision?",
      "Do you have a personal monitor showing high blood glucose levels?"
    ],
    is_emergency: false
  },
  {
    keywords: ["back pain", "spine", "orthopedic", "mgongo", "maumivu ya mgongo"],
    risk: "low/moderate",
    urgency: "non-emergency",
    required_services: ["Outpatient", "Orthopedic"],
    clarification_questions: [
      "Did the pain occur after heavy lifting, falling, or twisting your back?",
      "Do you feel pain, numbness, or weakness shooting down your legs?"
    ],
    is_emergency: false
  },
  {
    keywords: ["headache", "kichwa", "maumivu ya kichwa"],
    risk: "low/moderate",
    urgency: "non-emergency",
    required_services: ["Outpatient", "Laboratory"],
    clarification_questions: [
      "Is the headache accompanied by a stiff neck, high fever, or confusion?",
      "Is this the worst headache of your life?",
      "Is the pain throbbing on one side, or a dull ache all over?"
    ],
    is_emergency: false
  },
  {
    keywords: ["fever", "homa", "joto la mwili", "malaria"],
    risk: "low/moderate",
    urgency: "non-emergency",
    required_services: ["Outpatient", "Laboratory", "Pharmacy"],
    clarification_questions: [
      "How many days has the fever lasted?",
      "Is there a history of travel to malaria-endemic regions recently?",
      "Are you experiencing chills, joint pain, or sweating?"
    ],
    is_emergency: false
  },
  {
    keywords: ["stomach", "tumbo", "maumivu ya tumbo", "diarrhea", "kuhara", "tapika", "vomit"],
    risk: "moderate",
    urgency: "non-emergency",
    required_services: ["Outpatient", "Laboratory", "Pharmacy"],
    clarification_questions: [
      "Is the stomach pain sharp and localized in the lower right side?",
      "Are you able to keep fluids down, or are you vomiting constantly?",
      "Have you noticed any blood in your stool or vomit?"
    ],
    is_emergency: false
  }
];

/**
 * Normalizes input text by converting to lowercase and stripping punctuation
 */
function cleanText(text) {
  return text ? text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim() : "";
}

/**
 * Detects whether the primary language used is likely Swahili or English
 */
function detectLanguage(cleanedText) {
  const swahiliKeywords = ["kichwa", "homa", "tumbo", "kifua", "damu", "pumzi", "moyo", "kuhara", "tapika", "maumivu", "ninaumwa", "uzazi", "mimba", "kujifungua", "mgongo", "saratani", "figo", "kisukari"];
  for (const word of swahiliKeywords) {
    if (cleanedText.includes(word)) {
      return "sw";
    }
  }
  return "en";
}

/**
 * Checks if the text is asking for direct diagnostic conclusions (e.g. "Do I have cancer?")
 * and returns specialized safety warnings.
 */
function checkDiagnosticRequest(cleanText) {
  // Cancer query check
  if (cleanText.includes("cancer") || cleanText.includes("saratani")) {
    return {
      is_check: true,
      message: "We cannot diagnose cancer. Determining oncology status requires laboratory histology, medical imaging, and biopsy reviews by a licensed oncologist.",
      required_services: ["Oncology", "Laboratory"]
    };
  }
  // Malaria query check
  if (cleanText.includes("malaria") || cleanText.includes("mbu")) {
    return {
      is_check: true,
      message: "We cannot diagnose malaria. Confirming malaria requires a rapid diagnostic blood test (RDT) or a laboratory blood smear examination.",
      required_services: ["Outpatient", "Laboratory"]
    };
  }
  // Mortality check
  if (cleanText.includes("die") || cleanText.includes("kufa") || cleanText.includes("dead")) {
    return {
      is_check: true,
      message: "If you are concerned about a critical health crisis or life-threatening event, please seek emergency medical attention at the nearest emergency unit immediately.",
      required_services: ["Emergency Care"]
    };
  }
  return { is_check: false };
}

/**
 * Analyzes client symptom descriptions and returns a structured triage object.
 * @param {string} symptomText - The user-reported symptoms (e.g. "I have a headache and a high fever")
 * @returns {object} Triage result structure
 */
function performTriage(symptomText) {
  const clean = cleanText(symptomText);
  const detectedLang = detectLanguage(clean);

  // Safe Triage Check: Address diagnostic queries directly
  const diagCheck = checkDiagnosticRequest(clean);
  if (diagCheck.is_check) {
    return {
      symptom_summary: symptomText,
      language_detected: detectedLang,
      risk: "advisory",
      urgency: "non-emergency",
      required_services: diagCheck.required_services,
      advisory_note: diagCheck.message,
      clarification_questions: [
        "What specific physical symptoms are you experiencing?",
        "Have you consulted a physician or had laboratory tests done?"
      ],
      is_emergency: clean.includes("die"),
      disclaimer: "⚠️ This is not a diagnosis. AFYAROOT cannot confirm disease diagnoses. Please consult a qualified doctor for clinical testing."
    };
  }

  // Match keyword rules
  let matchedRule = null;
  for (const rule of CLINICAL_KNOWLEDGE_BASE) {
    const hasKeyword = rule.keywords.some(keyword => clean.includes(keyword));
    if (hasKeyword) {
      if (!matchedRule || rule.is_emergency) {
        matchedRule = rule;
      }
    }
  }

  // Fallback if no matching keywords found in clinical knowledge base
  if (!matchedRule) {
    return {
      symptom_summary: symptomText,
      language_detected: detectedLang,
      risk: "low/moderate",
      urgency: "non-emergency",
      required_services: ["Outpatient", "Pharmacy"],
      clarification_questions: [
        "How long have you been experiencing these symptoms?",
        "Are there other symptoms you haven't mentioned, like fever or pain?",
        "Are you taking any current medications?"
      ],
      is_emergency: false,
      disclaimer: "⚠️ This is not a diagnosis. If your symptoms worsen, please visit the nearest health facility immediately."
    };
  }

  return {
    symptom_summary: symptomText,
    language_detected: detectedLang,
    risk: matchedRule.risk,
    urgency: matchedRule.urgency,
    required_services: matchedRule.required_services,
    clarification_questions: matchedRule.clarification_questions,
    is_emergency: matchedRule.is_emergency,
    disclaimer: "⚠️ This is not a diagnosis. If your symptoms worsen, please visit the nearest health facility immediately."
  };
}

module.exports = {
  performTriage
};
