export interface DiagnosisResult {
  condition: string;
  confidence: number;
  urgency: 'emergency' | 'high' | 'normal';
  description: string;
  recommendations: string[];
  suggestedFacility: string;
}

interface SymptomRule {
  keywords: string[];
  condition: string;
  urgency: 'emergency' | 'high' | 'normal';
  description: string;
  recommendations: string[];
}

const symptomRules: SymptomRule[] = [
  {
    keywords: ['chest pain', 'heart', 'breathing difficulty', 'cannot breathe', 'suffocating'],
    condition: 'Possible Cardiac Event',
    urgency: 'emergency',
    description: 'Chest pain with breathing difficulty may indicate a cardiac emergency.',
    recommendations: ['Call emergency services immediately', 'Chew an aspirin if available', 'Sit upright', 'Do not exert yourself'],
  },
  {
    keywords: ['bleeding', 'blood', 'wound', 'cut', 'injury', 'accident'],
    condition: 'Trauma / Bleeding',
    urgency: 'emergency',
    description: 'Active bleeding or traumatic injury requires immediate attention.',
    recommendations: ['Apply direct pressure to wound', 'Elevate injured area', 'Seek emergency care immediately'],
  },
  {
    keywords: ['seizure', 'convulsion', 'unconscious', 'fainted', 'collapsed'],
    condition: 'Neurological Emergency',
    urgency: 'emergency',
    description: 'Loss of consciousness or seizures require immediate medical evaluation.',
    recommendations: ['Clear area around patient', 'Do not restrain', 'Place in recovery position', 'Call emergency services'],
  },
  {
    keywords: ['fever', 'high temperature', 'chills', 'sweating', 'malaria'],
    condition: 'Possible Malaria / Fever',
    urgency: 'high',
    description: 'High fever with chills is common in malaria-endemic areas.',
    recommendations: ['Take paracetamol for fever', 'Stay hydrated', 'Visit clinic for malaria test', 'Use mosquito net'],
  },
  {
    keywords: ['diarrhea', 'vomiting', 'stomach', 'nausea', 'dehydration'],
    condition: 'Gastrointestinal Illness',
    urgency: 'high',
    description: 'Diarrhea and vomiting can lead to dangerous dehydration.',
    recommendations: ['Drink ORS solution', 'Stay hydrated', 'Avoid solid food temporarily', 'Visit clinic if persists >24hrs'],
  },
  {
    keywords: ['pregnant', 'pregnancy', 'labor', 'contractions', 'water broke'],
    condition: 'Pregnancy Complication',
    urgency: 'emergency',
    description: 'Pregnancy-related symptoms require immediate maternal care.',
    recommendations: ['Go to nearest maternity facility', 'Lie on left side', 'Monitor contractions', 'Call for transport'],
  },
  {
    keywords: ['cough', 'cold', 'sore throat', 'runny nose', 'sneezing'],
    condition: 'Upper Respiratory Infection',
    urgency: 'normal',
    description: 'Common cold symptoms usually resolve on their own.',
    recommendations: ['Rest well', 'Drink warm fluids', 'Take paracetamol if needed', 'Visit clinic if persists >7 days'],
  },
  {
    keywords: ['headache', 'migraine', 'head pain'],
    condition: 'Headache / Migraine',
    urgency: 'normal',
    description: 'Headaches are common and usually treatable with rest and medication.',
    recommendations: ['Rest in a dark quiet room', 'Take paracetamol', 'Stay hydrated', 'Visit clinic if severe or recurring'],
  },
  {
    keywords: ['skin', 'rash', 'itching', 'swelling', 'allergy'],
    condition: 'Skin Condition / Allergy',
    urgency: 'normal',
    description: 'Skin reactions may be caused by allergies or infections.',
    recommendations: ['Avoid scratching', 'Apply calamine lotion', 'Take antihistamine', 'Visit clinic if spreading'],
  },
  {
    keywords: ['eye', 'vision', 'blind', 'red eye'],
    condition: 'Eye Condition',
    urgency: 'high',
    description: 'Eye symptoms should be evaluated to prevent vision loss.',
    recommendations: ['Do not rub eyes', 'Rinse with clean water', 'Visit eye clinic', 'Avoid bright light'],
  },
];

export function analyzeSymptoms(input: string): DiagnosisResult {
  const lower = input.toLowerCase();
  let bestMatch: SymptomRule | null = null;
  let bestScore = 0;

  for (const rule of symptomRules) {
    const score = rule.keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = rule;
    }
  }

  if (!bestMatch) {
    return {
      condition: 'General Health Concern',
      confidence: 0.4,
      urgency: 'normal',
      description: 'Your symptoms could not be matched to a specific condition. Please visit your nearest health facility for proper evaluation.',
      recommendations: ['Visit nearest clinic', 'Keep track of your symptoms', 'Stay hydrated and rest'],
      suggestedFacility: 'Nearest Health Center',
    };
  }

  const facilities: Record<string, string> = {
    emergency: 'County Referral Hospital',
    high: 'Sub-County Health Center',
    normal: 'Local Dispensary',
  };

  return {
    condition: bestMatch.condition,
    confidence: Math.min(0.95, 0.5 + bestScore * 0.15),
    urgency: bestMatch.urgency,
    description: bestMatch.description,
    recommendations: bestMatch.recommendations,
    suggestedFacility: facilities[bestMatch.urgency],
  };
}

export function getAIChatResponse(message: string): string {
  const diagnosis = analyzeSymptoms(message);
  if (diagnosis.confidence < 0.5) {
    return `I understand you're not feeling well. Could you describe your symptoms in more detail? For example: "I have a headache and fever" or "I feel chest pain". This helps me guide you better.`;
  }
  const urgencyEmoji = { emergency: '🚨', high: '🟠', normal: '🟢' };
  return `${urgencyEmoji[diagnosis.urgency]} **${diagnosis.condition}** (${Math.round(diagnosis.confidence * 100)}% match)\n\n${diagnosis.description}\n\n**Recommendations:**\n${diagnosis.recommendations.map(r => `• ${r}`).join('\n')}\n\n**Suggested Facility:** ${diagnosis.suggestedFacility}`;
}
