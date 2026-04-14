export type EngineLanguage = "en" | "sw";
export type EngineUrgency = "low" | "medium" | "high" | "emergency";
export type FacilityType = "hospital" | "health_center" | "dispensary" | "clinic" | "unknown";

export interface SymptomDatasetEntry {
  id: string;
  symptom_en: string;
  symptom_sw: string;
  condition_en: string;
  condition_sw: string;
  urgency: EngineUrgency;
  recommended_facility_type: FacilityType;
  keywords_en: string[];
  keywords_sw: string[];
  guidance_en: string[];
  guidance_sw: string[];
}

export interface NearbyHospitalInput {
  name: string;
  distance_km: number;
  type?: string;
  types?: string[];
}

export interface MatchedDatasetEntry {
  entry: SymptomDatasetEntry;
  score: number;
}

export interface HealthcareDecisionJson {
  matched_symptoms: string[];
  possible_conditions: string[];
  urgency: EngineUrgency;
  recommended_facility: {
    name: string;
    type: string;
    distance_km: number;
  };
  guidance: string[];
  explanation: string;
}

export interface HealthcareDecisionResult extends HealthcareDecisionJson {
  language: EngineLanguage;
  translated_input: string;
  matched_entries: MatchedDatasetEntry[];
}

export interface VoiceInputExtraction {
  symptoms: string[];
  duration: string;
  severity_hint: string;
  language: EngineLanguage;
}

export interface SimulatedPatientCase {
  symptoms: string[];
  age: number;
  location: string;
  urgency: EngineUrgency;
}

const URGENCY_RANK: Record<EngineUrgency, number> = {
  low: 1,
  medium: 2,
  high: 3,
  emergency: 4,
};

const SWAHILI_MARKERS = [
  "nina",
  "na",
  "maumivu",
  "homa",
  "kupumua",
  "kifua",
  "kichwa",
  "kichefuchefu",
  "kuhara",
  "kutapika",
  "dharura",
  "siku",
  "wiki",
  "masaa",
];

export const symptomDataset: SymptomDatasetEntry[] = [
  {
    id: "cardiac-chest-pain",
    symptom_en: "Chest pain",
    symptom_sw: "Maumivu ya kifua",
    condition_en: "Possible Cardiac Event",
    condition_sw: "Tatizo la moyo linalowezekana",
    urgency: "emergency",
    recommended_facility_type: "hospital",
    keywords_en: ["chest pain", "tight chest", "heart pain", "pressure in chest"],
    keywords_sw: ["maumivu ya kifua", "kifua kubana", "moyo kuuma"],
    guidance_en: ["Sit upright and stay still.", "Seek emergency care immediately."],
    guidance_sw: ["Kaa wima na utulie.", "Nenda hospitali ya dharura mara moja."],
  },
  {
    id: "breathing-distress",
    symptom_en: "Breathing difficulty",
    symptom_sw: "Kupumua kwa shida",
    condition_en: "Respiratory Distress",
    condition_sw: "Shida kubwa ya kupumua",
    urgency: "emergency",
    recommended_facility_type: "hospital",
    keywords_en: ["cannot breathe", "breathing difficulty", "shortness of breath", "suffocating"],
    keywords_sw: ["siwezi kupumua", "kupumua kwa shida", "kupungukiwa na pumzi", "kuzimia kwa pumzi"],
    guidance_en: ["Loosen tight clothing.", "Go to emergency care now."],
    guidance_sw: ["Legeza nguo zinazobana.", "Nenda huduma ya dharura sasa."],
  },
  {
    id: "major-bleeding",
    symptom_en: "Severe bleeding",
    symptom_sw: "Kutokwa damu nyingi",
    condition_en: "Trauma with Active Bleeding",
    condition_sw: "Jeraha lenye damu nyingi",
    urgency: "emergency",
    recommended_facility_type: "hospital",
    keywords_en: ["heavy bleeding", "blood loss", "bleeding wound", "accident bleeding"],
    keywords_sw: ["damu nyingi", "kutokwa damu nyingi", "jeraha linavuja damu"],
    guidance_en: ["Apply direct pressure to the wound.", "Arrange immediate transport to hospital."],
    guidance_sw: ["Bonyeza jeraha moja kwa moja.", "Panga usafiri wa haraka kwenda hospitali."],
  },
  {
    id: "stroke-signs",
    symptom_en: "Stroke warning signs",
    symptom_sw: "Dalili za kiharusi",
    condition_en: "Possible Stroke",
    condition_sw: "Kiharusi kinachowezekana",
    urgency: "emergency",
    recommended_facility_type: "hospital",
    keywords_en: ["face drooping", "slurred speech", "weak arm", "sudden paralysis"],
    keywords_sw: ["uso kulegea", "kuongea kwa shida", "mkono dhaifu", "kupooza ghafla"],
    guidance_en: ["Do not delay.", "Take the patient to the nearest hospital immediately."],
    guidance_sw: ["Usichelewe.", "Mpeleke mgonjwa hospitali ya karibu mara moja."],
  },
  {
    id: "seizure",
    symptom_en: "Seizure",
    symptom_sw: "Degedege",
    condition_en: "Neurological Emergency",
    condition_sw: "Dharura ya mfumo wa fahamu",
    urgency: "emergency",
    recommended_facility_type: "hospital",
    keywords_en: ["seizure", "convulsion", "fits", "shaking episode"],
    keywords_sw: ["degedege", "mshtuko wa mwili", "kifafa"],
    guidance_en: ["Protect the person from injury.", "Go to emergency care after the episode."],
    guidance_sw: ["Mlinde mgonjwa asiumie.", "Nenda huduma ya dharura baada ya tukio."],
  },
  {
    id: "unconsciousness",
    symptom_en: "Unconsciousness",
    symptom_sw: "Kupoteza fahamu",
    condition_en: "Loss of Consciousness",
    condition_sw: "Kupoteza fahamu",
    urgency: "emergency",
    recommended_facility_type: "hospital",
    keywords_en: ["unconscious", "fainted", "collapsed", "not responding"],
    keywords_sw: ["amepoteza fahamu", "amezimia", "haamki", "haongei"],
    guidance_en: ["Check breathing.", "Call emergency support and transport urgently."],
    guidance_sw: ["Kagua kama anapumua.", "Piga simu ya dharura na mpeleke haraka."],
  },
  {
    id: "pregnancy-bleeding",
    symptom_en: "Bleeding in pregnancy",
    symptom_sw: "Kutokwa damu wakati wa ujauzito",
    condition_en: "Pregnancy Complication",
    condition_sw: "Tatizo la ujauzito",
    urgency: "emergency",
    recommended_facility_type: "hospital",
    keywords_en: ["pregnant bleeding", "bleeding in pregnancy", "pregnancy pain with blood"],
    keywords_sw: ["ujauzito damu", "damu wakati wa ujauzito", "maumivu na damu mjamzito"],
    guidance_en: ["Do not wait at home.", "Go to maternity emergency care now."],
    guidance_sw: ["Usikae nyumbani ukisubiri.", "Nenda huduma ya dharura ya uzazi sasa."],
  },
  {
    id: "labor-danger",
    symptom_en: "Labor danger signs",
    symptom_sw: "Hatari wakati wa uchungu",
    condition_en: "High-Risk Labor",
    condition_sw: "Uchungu wenye hatari",
    urgency: "emergency",
    recommended_facility_type: "hospital",
    keywords_en: ["labor pain with bleeding", "water broke with fever", "severe labor pain"],
    keywords_sw: ["uchungu na damu", "maji kutoka na homa", "uchungu mkali sana"],
    guidance_en: ["Keep the mother safe and calm.", "Move urgently to hospital maternity unit."],
    guidance_sw: ["Muweke mama salama na mtulivu.", "Mpelekeni haraka wodini ya uzazi hospitali."],
  },
  {
    id: "high-fever-malaria",
    symptom_en: "High fever with chills",
    symptom_sw: "Homa kali na baridi",
    condition_en: "Possible Malaria",
    condition_sw: "Malaria inayowezekana",
    urgency: "high",
    recommended_facility_type: "health_center",
    keywords_en: ["high fever", "chills", "malaria", "fever and sweating"],
    keywords_sw: ["homa kali", "baridi", "malaria", "homa na jasho"],
    guidance_en: ["Start hydration immediately.", "Visit a clinic for malaria testing today."],
    guidance_sw: ["Anza kunywa maji mara moja.", "Nenda kliniki kupima malaria leo."],
  },
  {
    id: "persistent-fever",
    symptom_en: "Persistent fever",
    symptom_sw: "Homa ya muda mrefu",
    condition_en: "Ongoing Infection Risk",
    condition_sw: "Hatari ya maambukizi yanayoendelea",
    urgency: "high",
    recommended_facility_type: "health_center",
    keywords_en: ["fever for days", "persistent fever", "fever not going down"],
    keywords_sw: ["homa kwa siku nyingi", "homa haishuki", "homa ya muda mrefu"],
    guidance_en: ["Monitor temperature.", "Seek same-day clinical review."],
    guidance_sw: ["Pima joto mara kwa mara.", "Nenda kliniki hiyo hiyo siku."],
  },
  {
    id: "severe-abdominal-pain",
    symptom_en: "Severe abdominal pain",
    symptom_sw: "Maumivu makali ya tumbo",
    condition_en: "Acute Abdominal Condition",
    condition_sw: "Tatizo kali la tumbo",
    urgency: "high",
    recommended_facility_type: "hospital",
    keywords_en: ["severe stomach pain", "sharp abdominal pain", "stomach pain cannot stand"],
    keywords_sw: ["maumivu makali ya tumbo", "tumbo linauma sana", "siwezi kusimama kwa maumivu ya tumbo"],
    guidance_en: ["Avoid heavy food.", "Go for urgent clinical examination."],
    guidance_sw: ["Epuka chakula kizito.", "Nenda uchunguzi wa haraka kliniki au hospitali."],
  },
  {
    id: "diarrhea-vomiting",
    symptom_en: "Diarrhea with vomiting",
    symptom_sw: "Kuhara na kutapika",
    condition_en: "Gastrointestinal Illness",
    condition_sw: "Ugonjwa wa tumbo",
    urgency: "high",
    recommended_facility_type: "health_center",
    keywords_en: ["diarrhea", "vomiting", "loose stool", "stomach infection"],
    keywords_sw: ["kuhara", "kutapika", "choo cha maji", "maambukizi ya tumbo"],
    guidance_en: ["Use oral rehydration solution.", "Visit clinic if symptoms continue today."],
    guidance_sw: ["Tumia ORS au maji yenye chumvi/sukari.", "Nenda kliniki dalili zikiendelea leo."],
  },
  {
    id: "dehydration-signs",
    symptom_en: "Dehydration signs",
    symptom_sw: "Dalili za upungufu wa maji",
    condition_en: "Moderate to Severe Dehydration",
    condition_sw: "Upungufu wa maji mwilini",
    urgency: "high",
    recommended_facility_type: "health_center",
    keywords_en: ["dry mouth", "sunken eyes", "very thirsty", "not urinating"],
    keywords_sw: ["mdomo mkavu", "macho kuzama", "kiu sana", "hakupi mkojo"],
    guidance_en: ["Take fluids in small frequent sips.", "Seek care quickly for fluid replacement."],
    guidance_sw: ["Kunywa maji kidogo kidogo mara nyingi.", "Tafuta huduma haraka kuongeza maji mwilini."],
  },
  {
    id: "eye-infection",
    symptom_en: "Eye redness and pain",
    symptom_sw: "Jicho jekundu na maumivu",
    condition_en: "Possible Eye Infection",
    condition_sw: "Maambukizi ya jicho yanayowezekana",
    urgency: "high",
    recommended_facility_type: "health_center",
    keywords_en: ["red eye", "eye pain", "eye discharge", "light hurts eyes"],
    keywords_sw: ["jicho jekundu", "jicho linauma", "uchafu jichoni", "mwanga unauma jicho"],
    guidance_en: ["Do not rub the eye.", "Get eye assessment at a clinic today."],
    guidance_sw: ["Usikune jicho.", "Pata uchunguzi wa jicho kliniki leo."],
  },
  {
    id: "urinary-burning",
    symptom_en: "Burning urination",
    symptom_sw: "Kukojoa kwa maumivu",
    condition_en: "Possible Urinary Tract Infection",
    condition_sw: "Maambukizi ya njia ya mkojo",
    urgency: "medium",
    recommended_facility_type: "health_center",
    keywords_en: ["burning urination", "pain when urinating", "frequent urination pain"],
    keywords_sw: ["kukojoa kwa maumivu", "mkojo unaunguza", "kukojoa mara kwa mara na maumivu"],
    guidance_en: ["Drink clean water frequently.", "Visit clinic for urine test and treatment."],
    guidance_sw: ["Kunywa maji safi mara kwa mara.", "Nenda kliniki kupima mkojo na matibabu."],
  },
  {
    id: "back-pain-fever",
    symptom_en: "Back pain with fever",
    symptom_sw: "Maumivu ya mgongo na homa",
    condition_en: "Possible Kidney Infection",
    condition_sw: "Maambukizi ya figo yanayowezekana",
    urgency: "high",
    recommended_facility_type: "hospital",
    keywords_en: ["back pain and fever", "kidney pain", "side pain with fever"],
    keywords_sw: ["mgongo unauma na homa", "maumivu ya figo", "ubavu unauma na homa"],
    guidance_en: ["Do not delay treatment.", "Go to hospital or high-level clinic today."],
    guidance_sw: ["Usichelewe matibabu.", "Nenda hospitali au kliniki kubwa leo."],
  },
  {
    id: "headache",
    symptom_en: "Headache",
    symptom_sw: "Maumivu ya kichwa",
    condition_en: "Common Headache",
    condition_sw: "Maumivu ya kichwa ya kawaida",
    urgency: "low",
    recommended_facility_type: "clinic",
    keywords_en: ["headache", "head ache", "head pain", "mild migraine"],
    keywords_sw: ["maumivu ya kichwa", "kichwa kinauma", "kipandauso chepesi"],
    guidance_en: ["Rest in a quiet place.", "Use safe pain relief and observe symptoms."],
    guidance_sw: ["Pumzika sehemu tulivu.", "Tumia dawa salama ya maumivu na fuatilia dalili."],
  },
  {
    id: "severe-headache",
    symptom_en: "Severe headache",
    symptom_sw: "Maumivu makali ya kichwa",
    condition_en: "Severe Headache Requiring Review",
    condition_sw: "Maumivu makali ya kichwa yanahitaji uchunguzi",
    urgency: "medium",
    recommended_facility_type: "health_center",
    keywords_en: ["severe headache", "severe head ache", "worst headache", "headache with vomiting"],
    keywords_sw: ["kichwa kinauma sana", "maumivu makali ya kichwa", "kichwa na kutapika"],
    guidance_en: ["Avoid bright light.", "Visit a clinic today for assessment."],
    guidance_sw: ["Epuka mwanga mkali.", "Nenda kliniki leo kwa uchunguzi."],
  },
  {
    id: "cough-cold",
    symptom_en: "Cough and cold",
    symptom_sw: "Kikohozi na mafua",
    condition_en: "Upper Respiratory Infection",
    condition_sw: "Maambukizi ya njia ya hewa ya juu",
    urgency: "low",
    recommended_facility_type: "clinic",
    keywords_en: ["cough", "cold", "runny nose", "sneezing", "sore throat"],
    keywords_sw: ["kikohozi", "mafua", "pua inatoka", "kupiga chafya", "koo linauma"],
    guidance_en: ["Drink warm fluids.", "Rest and monitor for worsening signs."],
    guidance_sw: ["Kunywa vinywaji vya uvuguvugu.", "Pumzika na uangalie dalili zisizidi."],
  },
  {
    id: "persistent-cough",
    symptom_en: "Persistent cough",
    symptom_sw: "Kikohozi kisichoisha",
    condition_en: "Persistent Respiratory Illness",
    condition_sw: "Ugonjwa wa njia ya hewa unaoendelea",
    urgency: "medium",
    recommended_facility_type: "health_center",
    keywords_en: ["cough for weeks", "persistent cough", "long cough"],
    keywords_sw: ["kikohozi cha wiki", "kikohozi kisichoisha", "kikohozi cha muda mrefu"],
    guidance_en: ["Use a mask when near others.", "Visit clinic for chest check-up."],
    guidance_sw: ["Vaa barakoa ukiwa karibu na wengine.", "Nenda kliniki kwa uchunguzi wa kifua."],
  },
  {
    id: "wheezing",
    symptom_en: "Wheezing",
    symptom_sw: "Kupiga mluzi kifuani",
    condition_en: "Possible Asthma Flare",
    condition_sw: "Pumu inayoongezeka",
    urgency: "high",
    recommended_facility_type: "hospital",
    keywords_en: ["wheezing", "whistling breath", "asthma attack"],
    keywords_sw: ["kupiga mluzi kifuani", "pumu", "pumu inashika"],
    guidance_en: ["Use reliever inhaler if available.", "Seek urgent respiratory care."],
    guidance_sw: ["Tumia inhaler ya haraka ikiwa ipo.", "Tafuta huduma ya haraka ya kupumua."],
  },
  {
    id: "child-fever",
    symptom_en: "Child fever",
    symptom_sw: "Homa kwa mtoto",
    condition_en: "Pediatric Fever",
    condition_sw: "Homa ya mtoto",
    urgency: "medium",
    recommended_facility_type: "health_center",
    keywords_en: ["child fever", "baby fever", "infant hot body"],
    keywords_sw: ["homa kwa mtoto", "mtoto ana homa", "mwili wa mtoto ni moto"],
    guidance_en: ["Keep child hydrated.", "Take the child to a clinic for review."],
    guidance_sw: ["Mpe mtoto maji ya kutosha.", "Mpeleke mtoto kliniki kwa uchunguzi."],
  },
  {
    id: "ear-pain",
    symptom_en: "Ear pain",
    symptom_sw: "Sikio kuuma",
    condition_en: "Possible Ear Infection",
    condition_sw: "Maambukizi ya sikio yanayowezekana",
    urgency: "low",
    recommended_facility_type: "clinic",
    keywords_en: ["ear pain", "ear discharge", "blocked ear"],
    keywords_sw: ["sikio linauma", "uchafu sikioni", "sikio limeziba"],
    guidance_en: ["Keep ear dry and clean.", "Visit clinic if pain continues."],
    guidance_sw: ["Weka sikio kavu na safi.", "Nenda kliniki maumivu yakiendelea."],
  },
  {
    id: "toothache",
    symptom_en: "Toothache",
    symptom_sw: "Jino kuuma",
    condition_en: "Dental Infection Risk",
    condition_sw: "Hatari ya maambukizi ya meno",
    urgency: "low",
    recommended_facility_type: "clinic",
    keywords_en: ["tooth pain", "toothache", "gum swelling"],
    keywords_sw: ["jino linauma", "maumivu ya jino", "fizi kuvimba"],
    guidance_en: ["Avoid very hot or cold foods.", "Seek dental care soon."],
    guidance_sw: ["Epuka chakula cha moto sana au baridi sana.", "Tafuta huduma ya meno mapema."],
  },
  {
    id: "skin-rash",
    symptom_en: "Skin rash",
    symptom_sw: "Upele wa ngozi",
    condition_en: "Skin Allergy or Infection",
    condition_sw: "Mzio au maambukizi ya ngozi",
    urgency: "low",
    recommended_facility_type: "clinic",
    keywords_en: ["skin rash", "itching skin", "skin allergy", "hives"],
    keywords_sw: ["upele", "ngozi kuwasha", "mzigo wa ngozi", "mzio wa ngozi"],
    guidance_en: ["Avoid scratching.", "Visit clinic if rash spreads or worsens."],
    guidance_sw: ["Usikune ngozi.", "Nenda kliniki upele ukienea au kuongezeka."],
  },
  {
    id: "burn-injury",
    symptom_en: "Burn injury",
    symptom_sw: "Kuungua",
    condition_en: "Burn Injury",
    condition_sw: "Jeraha la kuungua",
    urgency: "high",
    recommended_facility_type: "hospital",
    keywords_en: ["burn", "scald", "fire injury", "hot water burn"],
    keywords_sw: ["kuungua", "maji ya moto yameunguza", "moto umeunguza"],
    guidance_en: ["Cool the burn with clean running water.", "Seek urgent medical dressing and review."],
    guidance_sw: ["Poza sehemu iliyoungua kwa maji safi yanayotiririka.", "Nenda matibabu ya haraka kwa kufungwa jeraha."],
  },
  {
    id: "fracture-suspected",
    symptom_en: "Suspected fracture",
    symptom_sw: "Kushukiwa kuvunjika mfupa",
    condition_en: "Possible Bone Fracture",
    condition_sw: "Mfupa kuvunjika kunakowezekana",
    urgency: "high",
    recommended_facility_type: "hospital",
    keywords_en: ["broken bone", "cannot move limb", "severe limb pain", "swollen limb after fall"],
    keywords_sw: ["mfupa umevunjika", "siwezi kusogeza mguu", "maumivu makali ya kiungo", "kuvimba baada ya kuanguka"],
    guidance_en: ["Immobilize the limb.", "Go to hospital for X-ray and treatment."],
    guidance_sw: ["Zuia kiungo kisisonge.", "Nenda hospitali kwa X-ray na matibabu."],
  },
  {
    id: "mild-injury",
    symptom_en: "Minor injury",
    symptom_sw: "Jeraha dogo",
    condition_en: "Minor Soft Tissue Injury",
    condition_sw: "Jeraha dogo la tishu",
    urgency: "low",
    recommended_facility_type: "clinic",
    keywords_en: ["minor cut", "small wound", "mild sprain"],
    keywords_sw: ["jeraha dogo", "kidonda kidogo", "kuumia kidogo"],
    guidance_en: ["Clean the area with safe water.", "Visit clinic if swelling or pain increases."],
    guidance_sw: ["Safisha eneo kwa maji salama.", "Nenda kliniki uvimbe au maumivu yakiongezeka."],
  },
  {
    id: "hypertension-signs",
    symptom_en: "High blood pressure symptoms",
    symptom_sw: "Dalili za presha",
    condition_en: "Possible Hypertension Episode",
    condition_sw: "Tatizo la presha linalowezekana",
    urgency: "medium",
    recommended_facility_type: "health_center",
    keywords_en: ["high blood pressure", "pressure headache", "dizziness with pressure"],
    keywords_sw: ["presha", "shinikizo la damu", "kichwa kuuma kwa presha", "kizunguzungu na presha"],
    guidance_en: ["Rest and avoid stress.", "Check blood pressure at a clinic soon."],
    guidance_sw: ["Pumzika na epuka msongo.", "Pima presha kliniki mapema."],
  },
  {
    id: "diabetes-signs",
    symptom_en: "High blood sugar symptoms",
    symptom_sw: "Dalili za sukari juu",
    condition_en: "Possible Diabetes-Related Symptoms",
    condition_sw: "Dalili zinazoweza kuhusiana na kisukari",
    urgency: "medium",
    recommended_facility_type: "health_center",
    keywords_en: ["frequent urination", "excessive thirst", "weight loss", "high sugar"],
    keywords_sw: ["kukojoa mara kwa mara", "kiu kupita kiasi", "kupungua uzito", "sukari juu"],
    guidance_en: ["Drink water and avoid sugary drinks.", "Visit clinic for blood sugar test."],
    guidance_sw: ["Kunywa maji na epuka vinywaji vyenye sukari.", "Nenda kliniki kupima sukari."],
  },
  {
    id: "fatigue-general",
    symptom_en: "General fatigue",
    symptom_sw: "Uchovu wa mwili",
    condition_en: "General Fatigue Pattern",
    condition_sw: "Uchovu wa kawaida wa mwili",
    urgency: "low",
    recommended_facility_type: "clinic",
    keywords_en: ["tired all the time", "fatigue", "weak body", "no energy"],
    keywords_sw: ["uchovu", "mwili dhaifu", "sina nguvu", "nimechoka sana"],
    guidance_en: ["Rest and hydrate.", "If fatigue persists, seek clinic review."],
    guidance_sw: ["Pumzika na kunywa maji.", "Uchovu ukiendelea nenda kliniki."],
  },
  {
    id: "anemia-signs",
    symptom_en: "Possible anemia signs",
    symptom_sw: "Dalili za upungufu wa damu",
    condition_en: "Possible Anemia",
    condition_sw: "Upungufu wa damu unaowezekana",
    urgency: "medium",
    recommended_facility_type: "health_center",
    keywords_en: ["pale skin", "dizziness", "fatigue with breathlessness", "anemia"],
    keywords_sw: ["ngozi kupauka", "kizunguzungu", "uchovu na kupumua kwa shida", "upungufu wa damu"],
    guidance_en: ["Eat iron-rich foods if available.", "Visit clinic for blood check."],
    guidance_sw: ["Kula vyakula vyenye madini ya chuma ikiwa vinapatikana.", "Nenda kliniki kupima damu."],
  },
  {
    id: "mental-distress",
    symptom_en: "Anxiety and panic",
    symptom_sw: "Wasiwasi na hofu",
    condition_en: "Acute Anxiety Pattern",
    condition_sw: "Muundo wa wasiwasi mkali",
    urgency: "medium",
    recommended_facility_type: "clinic",
    keywords_en: ["panic", "anxiety attack", "racing heart with fear", "cannot calm down"],
    keywords_sw: ["hofu kali", "wasiwasi", "moyo kwenda mbio kwa hofu", "siwezi kutulia"],
    guidance_en: ["Sit down and breathe slowly.", "Seek same-day counseling or clinical support."],
    guidance_sw: ["Kaa chini na pumua polepole.", "Tafuta ushauri au huduma ya kliniki leo."],
  },
  {
    id: "depression-signs",
    symptom_en: "Low mood",
    symptom_sw: "Hali ya huzuni",
    condition_en: "Low Mood Pattern",
    condition_sw: "Hali ya huzuni inayoendelea",
    urgency: "low",
    recommended_facility_type: "clinic",
    keywords_en: ["sad all day", "no interest", "hopeless", "depressed"],
    keywords_sw: ["huzuni siku nzima", "sipendi chochote", "kukata tamaa", "msongo wa mawazo"],
    guidance_en: ["Talk to a trusted person.", "Visit a clinic for mental health support."],
    guidance_sw: ["Ongea na mtu unayemwamini.", "Nenda kliniki kupata msaada wa afya ya akili."],
  },
  {
    id: "allergic-reaction",
    symptom_en: "Allergic reaction",
    symptom_sw: "Mzio",
    condition_en: "Allergic Reaction",
    condition_sw: "Mzio",
    urgency: "medium",
    recommended_facility_type: "health_center",
    keywords_en: ["allergy", "itchy throat", "swollen lips", "hives after food"],
    keywords_sw: ["mzio", "koo kuwasha", "midomo kuvimba", "upele baada ya chakula"],
    guidance_en: ["Avoid the trigger if known.", "Go to clinic quickly for anti-allergy care."],
    guidance_sw: ["Epuka kisababishi kama unakijua.", "Nenda kliniki haraka kwa huduma ya mzio."],
  },
  {
    id: "severe-allergy-breath",
    symptom_en: "Severe allergy with breathing issue",
    symptom_sw: "Mzio mkali na shida ya kupumua",
    condition_en: "Anaphylaxis Risk",
    condition_sw: "Hatari ya mzio mkali",
    urgency: "emergency",
    recommended_facility_type: "hospital",
    keywords_en: ["allergy cannot breathe", "swollen throat", "severe allergic reaction"],
    keywords_sw: ["mzio na siwezi kupumua", "koo kuvimba", "mzigo mkali sana"],
    guidance_en: ["This is an emergency.", "Go to the nearest hospital now."],
    guidance_sw: ["Hii ni dharura.", "Nenda hospitali ya karibu sasa."],
  },
  {
    id: "neck-stiffness-fever",
    symptom_en: "Neck stiffness with fever",
    symptom_sw: "Shingo ngumu na homa",
    condition_en: "Serious Infection Warning",
    condition_sw: "Onyo la maambukizi makali",
    urgency: "emergency",
    recommended_facility_type: "hospital",
    keywords_en: ["stiff neck and fever", "cannot bend neck with fever"],
    keywords_sw: ["shingo ngumu na homa", "siwezi kukunja shingo na homa"],
    guidance_en: ["Seek emergency assessment immediately.", "Do not delay transport."],
    guidance_sw: ["Tafuta uchunguzi wa dharura mara moja.", "Usichelewe usafiri."],
  },
  {
    id: "chest-cough-blood",
    symptom_en: "Coughing blood",
    symptom_sw: "Kukohoa damu",
    condition_en: "Serious Respiratory Alert",
    condition_sw: "Onyo kubwa la njia ya hewa",
    urgency: "emergency",
    recommended_facility_type: "hospital",
    keywords_en: ["coughing blood", "blood in sputum"],
    keywords_sw: ["kukohoa damu", "damu kwenye makohozi"],
    guidance_en: ["Avoid exertion.", "Go to hospital immediately."],
    guidance_sw: ["Epuka shughuli nzito.", "Nenda hospitali mara moja."],
  },
  {
    id: "chronic-joint-pain",
    symptom_en: "Joint pain",
    symptom_sw: "Maumivu ya viungo",
    condition_en: "Joint Inflammation Pattern",
    condition_sw: "Muundo wa maumivu ya viungo",
    urgency: "low",
    recommended_facility_type: "clinic",
    keywords_en: ["joint pain", "knee pain", "elbow pain", "body joints pain"],
    keywords_sw: ["maumivu ya viungo", "goti linauma", "kiwiko kinauma"],
    guidance_en: ["Limit heavy activity.", "Book clinic review for pain control."],
    guidance_sw: ["Punguza shughuli nzito.", "Panga kliniki kwa usimamizi wa maumivu."],
  },
  {
    id: "leg-swelling",
    symptom_en: "Leg swelling",
    symptom_sw: "Mguu kuvimba",
    condition_en: "Leg Swelling Requiring Review",
    condition_sw: "Uvimbe wa mguu unaohitaji uchunguzi",
    urgency: "medium",
    recommended_facility_type: "health_center",
    keywords_en: ["leg swelling", "swollen leg", "ankle swelling"],
    keywords_sw: ["mguu kuvimba", "kifundo kuvimba", "uvimbe wa mguu"],
    guidance_en: ["Keep leg elevated while resting.", "Visit clinic for examination."],
    guidance_sw: ["Inua mguu unapopumzika.", "Nenda kliniki kwa uchunguzi."],
  },
  {
    id: "chest-burn-acid",
    symptom_en: "Acid reflux symptoms",
    symptom_sw: "Kiungulia",
    condition_en: "Acid Reflux Pattern",
    condition_sw: "Muundo wa kiungulia",
    urgency: "low",
    recommended_facility_type: "clinic",
    keywords_en: ["heartburn", "acid reflux", "burning chest after food"],
    keywords_sw: ["kiungulia", "asidi tumboni", "kifua kuwaka baada ya kula"],
    guidance_en: ["Avoid spicy late meals.", "Visit clinic if symptoms persist."],
    guidance_sw: ["Epuka chakula chenye pilipili usiku.", "Nenda kliniki dalili zikiendelea."],
  },
  {
    id: "constipation",
    symptom_en: "Constipation",
    symptom_sw: "Kufunga choo",
    condition_en: "Constipation Pattern",
    condition_sw: "Tatizo la kufunga choo",
    urgency: "low",
    recommended_facility_type: "clinic",
    keywords_en: ["constipation", "hard stool", "no bowel movement"],
    keywords_sw: ["kufunga choo", "choo kigumu", "sijapata choo"],
    guidance_en: ["Increase water and fiber intake.", "Seek clinic support if no improvement."],
    guidance_sw: ["Ongeza maji na vyakula vyenye nyuzinyuzi.", "Nenda kliniki kama hakuna nafuu."],
  },
  {
    id: "sore-throat-fever",
    symptom_en: "Sore throat with fever",
    symptom_sw: "Koo linauma na homa",
    condition_en: "Throat Infection Pattern",
    condition_sw: "Maambukizi ya koo",
    urgency: "medium",
    recommended_facility_type: "clinic",
    keywords_en: ["sore throat with fever", "throat pain and fever"],
    keywords_sw: ["koo linauma na homa", "maumivu ya koo na homa"],
    guidance_en: ["Drink warm fluids.", "Visit clinic for infection check."],
    guidance_sw: ["Kunywa vinywaji vya uvuguvugu.", "Nenda kliniki kupimwa maambukizi."],
  },
  {
    id: "body-aches-fever",
    symptom_en: "Body aches with fever",
    symptom_sw: "Mwili kuuma na homa",
    condition_en: "Flu-like Illness Pattern",
    condition_sw: "Muundo wa ugonjwa kama mafua makali",
    urgency: "medium",
    recommended_facility_type: "clinic",
    keywords_en: ["body pain and fever", "flu symptoms", "generalized body aches"],
    keywords_sw: ["mwili kuuma na homa", "dalili za mafua makali", "maumivu mwili mzima"],
    guidance_en: ["Rest and hydrate well.", "Visit clinic if no improvement in 24-48 hours."],
    guidance_sw: ["Pumzika na kunywa maji ya kutosha.", "Nenda kliniki kama hakuna nafuu ndani ya saa 24-48."],
  },
  {
    id: "animal-bite",
    symptom_en: "Animal bite",
    symptom_sw: "Kung'atwa na mnyama",
    condition_en: "Animal Bite Exposure",
    condition_sw: "Jeraha la kung'atwa na mnyama",
    urgency: "high",
    recommended_facility_type: "hospital",
    keywords_en: ["dog bite", "animal bite", "rabies concern"],
    keywords_sw: ["kung'atwa na mbwa", "kung'atwa na mnyama", "wasiwasi wa kichaa cha mbwa"],
    guidance_en: ["Wash wound with clean water and soap.", "Go to hospital quickly for rabies assessment."],
    guidance_sw: ["Osha jeraha kwa maji safi na sabuni.", "Nenda hospitali haraka kwa tathmini ya kichaa cha mbwa."],
  },
  {
    id: "snake-bite",
    symptom_en: "Snake bite",
    symptom_sw: "Kung'atwa na nyoka",
    condition_en: "Snake Bite Emergency",
    condition_sw: "Dharura ya kung'atwa na nyoka",
    urgency: "emergency",
    recommended_facility_type: "hospital",
    keywords_en: ["snake bite", "venom bite", "bite with severe swelling"],
    keywords_sw: ["kung'atwa na nyoka", "sumu ya nyoka", "kuvimba sana baada ya kung'atwa"],
    guidance_en: ["Keep the bitten limb still.", "Transport urgently to hospital."],
    guidance_sw: ["Usisongeze kiungo kilichong'atwa.", "Mpeleke mgonjwa hospitali haraka."],
  },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value).split(" ").filter(Boolean);
}

function urgencyToFacilityLabel(urgency: EngineUrgency, language: EngineLanguage) {
  if (language === "sw") {
    if (urgency === "emergency") return "hospitali";
    if (urgency === "high") return "hospitali au kituo cha afya";
    if (urgency === "medium") return "kituo cha afya/kliniki";
    return "kliniki ya karibu";
  }

  if (urgency === "emergency") return "hospital";
  if (urgency === "high") return "hospital or health center";
  if (urgency === "medium") return "clinic or hospital";
  return "nearby clinic";
}

export function detectInputLanguage(input: string): EngineLanguage {
  const normalized = normalizeText(input);
  const tokens = tokenize(normalized);
  const swCount = tokens.filter((token) => SWAHILI_MARKERS.includes(token)).length;
  return swCount >= 2 ? "sw" : "en";
}

export function translateToEnglishForProcessing(input: string, dataset: SymptomDatasetEntry[] = symptomDataset) {
  const language = detectInputLanguage(input);
  if (language === "en") {
    return { translated: input, language };
  }

  const swToEnPairs: Array<[string, string]> = [];
  dataset.forEach((entry) => {
    const englishFallback = entry.keywords_en[0] || entry.symptom_en;
    entry.keywords_sw.forEach((swKey) => {
      swToEnPairs.push([normalizeText(swKey), normalizeText(englishFallback)]);
    });
  });

  const sortedPairs = swToEnPairs.sort((a, b) => b[0].length - a[0].length);
  let translated = normalizeText(input);
  sortedPairs.forEach(([sw, en]) => {
    if (!sw) return;
    translated = translated.replace(new RegExp(`\\b${sw}\\b`, "g"), en);
  });

  return { translated, language };
}

function scoreKeywordMatch(normalizedInput: string, tokenSet: Set<string>, keyword: string) {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) return 0;

  if (normalizedInput.includes(normalizedKeyword)) {
    return normalizedKeyword.split(" ").length > 1 ? 4 : 3;
  }

  const keywordTokens = tokenize(normalizedKeyword);
  if (keywordTokens.length === 0) return 0;

  const overlap = keywordTokens.filter((token) => tokenSet.has(token)).length;
  if (overlap === keywordTokens.length) return 2;
  if (keywordTokens.length > 1 && overlap >= Math.ceil(keywordTokens.length * 0.6)) return 1;
  return 0;
}

export function matchSymptomsFromDataset(symptoms: string, dataset: SymptomDatasetEntry[] = symptomDataset) {
  const translated = translateToEnglishForProcessing(symptoms, dataset).translated;
  const normalizedInput = normalizeText(translated);
  const tokenSet = new Set(tokenize(normalizedInput));
  const matches: MatchedDatasetEntry[] = [];

  dataset.forEach((entry) => {
    let score = 0;
    [...entry.keywords_en, ...entry.keywords_sw].forEach((keyword) => {
      score = Math.max(score, scoreKeywordMatch(normalizedInput, tokenSet, keyword));
    });

    if (score >= 2) {
      matches.push({ entry, score });
    }
  });

  return matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return URGENCY_RANK[b.entry.urgency] - URGENCY_RANK[a.entry.urgency];
  });
}

function normalizeFacilityType(rawType: string | undefined, rawTypes: string[] | undefined): FacilityType {
  const candidates = [
    ...(rawType ? [rawType] : []),
    ...(rawTypes || []),
  ].map((item) => normalizeText(item));

  if (candidates.some((item) => item.includes("hospital"))) return "hospital";
  if (candidates.some((item) => item.includes("health_center") || item.includes("health center"))) return "health_center";
  if (candidates.some((item) => item.includes("dispensary"))) return "dispensary";
  if (candidates.some((item) => item.includes("clinic"))) return "clinic";
  return "unknown";
}

export function routePatientToFacility(urgency: EngineUrgency, hospitalList: NearbyHospitalInput[] = []) {
  const sorted = [...hospitalList]
    .map((item) => ({
      ...item,
      normalizedType: normalizeFacilityType(item.type, item.types),
      distance_km: Number.isFinite(item.distance_km) ? item.distance_km : 999,
    }))
    .sort((a, b) => a.distance_km - b.distance_km);

  const pickFirst = (predicate: (item: typeof sorted[number]) => boolean) => sorted.find(predicate) || sorted[0];

  let selected =
    urgency === "emergency"
      ? pickFirst((item) => item.normalizedType === "hospital")
      : urgency === "high"
        ? pickFirst((item) => item.normalizedType === "hospital" || item.normalizedType === "health_center")
        : urgency === "medium"
          ? pickFirst((item) => ["clinic", "health_center", "hospital"].includes(item.normalizedType))
          : pickFirst((item) => ["clinic", "health_center", "dispensary"].includes(item.normalizedType));

  if (!selected) {
    selected = {
      name: "Nearest available facility",
      distance_km: 0,
      normalizedType: "unknown",
      types: [],
    };
  }

  const reason =
    urgency === "emergency"
      ? "Emergency cases are routed to the nearest hospital."
      : urgency === "high"
        ? "High urgency cases are routed to nearest hospital/health center."
        : urgency === "medium"
          ? "Medium urgency cases are routed to nearest clinic or hospital."
          : "Low urgency cases are routed to the closest clinic.";

  return {
    selected: {
      name: selected.name,
      distance_km: Number.isFinite(selected.distance_km) ? selected.distance_km : 0,
      type: selected.normalizedType,
    },
    reason,
  };
}

function uniqueBy<T, K>(items: T[], keyFn: (item: T) => K) {
  const seen = new Set<K>();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function summarizeUrgency(matches: MatchedDatasetEntry[]): EngineUrgency {
  if (matches.length === 0) return "medium";
  return matches.reduce<EngineUrgency>((current, next) => {
    return URGENCY_RANK[next.entry.urgency] > URGENCY_RANK[current] ? next.entry.urgency : current;
  }, "low");
}

function toLanguageText(entry: SymptomDatasetEntry, language: EngineLanguage) {
  return {
    symptom: language === "sw" ? entry.symptom_sw : entry.symptom_en,
    condition: language === "sw" ? entry.condition_sw : entry.condition_en,
    guidance: language === "sw" ? entry.guidance_sw : entry.guidance_en,
  };
}

function buildGuidanceSteps(
  language: EngineLanguage,
  urgency: EngineUrgency,
  selectedFacility: { name: string; type: string; distance_km: number },
  matches: MatchedDatasetEntry[]
) {
  if (matches.length === 0) {
    if (language === "sw") {
      return [
        "Hatukupata mechi ya karibu kwenye dataset kwa dalili ulizoandika.",
        "Eleza tena dalili kwa undani: sehemu inauma, muda wa dalili, na ukali wake.",
        `Kwa sasa elekea ${selectedFacility.name} (${selectedFacility.distance_km.toFixed(1)} km) kwa uchunguzi wa daktari.`,
        "Pumzika, kunywa maji, na fuatilia dalili mpya.",
        "Ukipata maumivu ya kifua, kushindwa kupumua, damu nyingi, au kupoteza fahamu, piga 999 mara moja.",
      ];
    }

    return [
      "No close dataset match was found for the symptoms entered.",
      "Please re-enter symptoms with details: body part, duration, and severity.",
      `For safety, proceed to ${selectedFacility.name} (${selectedFacility.distance_km.toFixed(1)} km) for clinical assessment.`,
      "Rest, hydrate, and monitor for new warning signs.",
      "If chest pain, breathing difficulty, heavy bleeding, or unconsciousness occurs, call 999 immediately.",
    ];
  }

  const firstMatchGuidance = uniqueBy(
    matches.flatMap(({ entry }) => toLanguageText(entry, language).guidance),
    (item) => normalizeText(item)
  );

  if (language === "sw") {
    const steps = [
      `Tuliza hali, kisha elekea ${selectedFacility.name} (${selectedFacility.distance_km.toFixed(1)} km).`,
      ...firstMatchGuidance.slice(0, 2),
      urgency === "emergency"
        ? "Piga 999 mara moja ikiwa mgonjwa anazidi kuwa mbaya."
        : "Ikiwa dalili zinazidi, tafuta huduma ya dharura mara moja.",
      `Tumia huduma ya ${urgencyToFacilityLabel(urgency, language)} kwa uchunguzi kamili.`,
    ];
    return uniqueBy(steps, (item) => normalizeText(item)).slice(0, 5);
  }

  const steps = [
    `Stay calm, then proceed to ${selectedFacility.name} (${selectedFacility.distance_km.toFixed(1)} km).`,
    ...firstMatchGuidance.slice(0, 2),
    urgency === "emergency"
      ? "Call 999 immediately if the patient gets worse."
      : "If symptoms worsen, seek emergency help right away.",
    `Use a ${urgencyToFacilityLabel(urgency, language)} for full assessment.`,
  ];
  return uniqueBy(steps, (item) => normalizeText(item)).slice(0, 5);
}

function buildExplanation(
  language: EngineLanguage,
  matchedSymptoms: string[],
  possibleConditions: string[],
  urgency: EngineUrgency,
  routingReason: string
) {
  if (language === "sw") {
    if (matchedSymptoms.length === 0) {
      return "Hatukupata mechi ya karibu kwenye dataset. Tumechagua mwongozo salama wa kliniki/hospitali huku ukieleza dalili kwa undani zaidi.";
    }
    return `Tumeoanisha dalili zako (${matchedSymptoms.join(", ")}) na dataset na kupata hali zinazowezekana: ${possibleConditions.join(
      ", "
    )}. Kiwango cha hatari ni ${urgency}. ${routingReason}`;
  }

  if (matchedSymptoms.length === 0) {
    return "No close dataset match was found. A safe clinic/hospital-first path was selected while you provide more symptom detail.";
  }

  return `Symptoms (${matchedSymptoms.join(", ")}) were matched against the dataset. Likely conditions: ${possibleConditions.join(
    ", "
  )}. Urgency is ${urgency}. ${routingReason}`;
}

export function runHealthcareDecisionEngine(input: {
  user_input: string;
  symptom_dataset?: SymptomDatasetEntry[];
  nearby_hospitals?: NearbyHospitalInput[];
  preferred_language?: EngineLanguage;
}): HealthcareDecisionResult {
  const dataset = input.symptom_dataset?.length ? input.symptom_dataset : symptomDataset;
  const translation = translateToEnglishForProcessing(input.user_input, dataset);
  const language = input.preferred_language || translation.language;
  const matches = matchSymptomsFromDataset(translation.translated, dataset);
  const urgency = summarizeUrgency(matches);

  const matchedSymptoms = uniqueBy(
    matches.map(({ entry }) => toLanguageText(entry, language).symptom),
    (item) => normalizeText(item)
  ).slice(0, 6);

  const possibleConditions = uniqueBy(
    matches.map(({ entry }) => toLanguageText(entry, language).condition),
    (item) => normalizeText(item)
  ).slice(0, 4);

  const routing = routePatientToFacility(urgency, input.nearby_hospitals || []);
  const guidance = buildGuidanceSteps(language, urgency, routing.selected, matches);
  const explanation = buildExplanation(language, matchedSymptoms, possibleConditions, urgency, routing.reason);

  return {
    matched_symptoms: matchedSymptoms,
    possible_conditions: possibleConditions,
    urgency,
    recommended_facility: routing.selected,
    guidance,
    explanation,
    language,
    translated_input: translation.translated,
    matched_entries: matches,
  };
}

export function convertAnalysisToHumanGuidance(analysis: HealthcareDecisionJson, language: EngineLanguage = "en") {
  if (analysis.matched_symptoms.length === 0 || analysis.possible_conditions.length === 0) {
    if (language === "sw") {
      return {
        message:
          "Hatukupata mechi ya karibu kwenye dataset kwa sasa. Tutakupa mwongozo salama na unapaswa kupata uchunguzi wa daktari.",
        steps: analysis.guidance.slice(0, 5),
      };
    }

    return {
      message:
        "No close dataset match yet. We will keep guidance safe and you should get a clinician assessment.",
      steps: analysis.guidance.slice(0, 5),
    };
  }

  if (language === "sw") {
    const message = `Tumepata kiwango cha hatari: ${analysis.urgency}. Kituo kilichopendekezwa ni ${analysis.recommended_facility.name}.`;
    return { message, steps: analysis.guidance.slice(0, 5) };
  }

  const message = `Urgency level is ${analysis.urgency}. Recommended facility: ${analysis.recommended_facility.name}.`;
  return { message, steps: analysis.guidance.slice(0, 5) };
}

export function extractVoiceMedicalData(transcribedText: string, dataset: SymptomDatasetEntry[] = symptomDataset): VoiceInputExtraction {
  const language = detectInputLanguage(transcribedText);
  const matches = matchSymptomsFromDataset(transcribedText, dataset);
  const symptoms = uniqueBy(
    matches.map(({ entry }) => (language === "sw" ? entry.symptom_sw : entry.symptom_en)),
    (item) => normalizeText(item)
  ).slice(0, 5);

  const normalized = normalizeText(transcribedText);
  const durationMatch = normalized.match(
    /((\d+\s*(day|days|hour|hours|week|weeks|siku|masaa|wiki))|((siku|wiki|masaa)\s*\d+))/i
  );
  const duration = durationMatch ? durationMatch[1] : "";

  const severeMarkers = ["cannot breathe", "heavy bleeding", "unconscious", "siwezi kupumua", "damu nyingi", "amezimia"];
  const moderateMarkers = ["pain", "fever", "homa", "maumivu"];

  const severity_hint = severeMarkers.some((marker) => normalized.includes(marker))
    ? "severe"
    : moderateMarkers.some((marker) => normalized.includes(marker))
      ? "moderate"
      : "mild";

  return {
    symptoms,
    duration,
    severity_hint,
    language,
  };
}

export function generateSimulatedPatientCases(total = 50, dataset: SymptomDatasetEntry[] = symptomDataset): SimulatedPatientCase[] {
  const count = Math.max(1, total);
  let seed = 726381;
  const pseudoRandom = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const locations = ["Kapsabet", "Nandi Hills", "Mosoriot", "Chepterit", "Kabiyet", "Eldoret South"];
  const result: SimulatedPatientCase[] = [];

  for (let i = 0; i < count; i += 1) {
    const firstEntry = dataset[Math.floor(pseudoRandom() * dataset.length)];
    const secondEntry = dataset[Math.floor(pseudoRandom() * dataset.length)];
    const symptoms = uniqueBy(
      [firstEntry.symptom_en, secondEntry.symptom_en].filter(Boolean),
      (item) => item
    );

    const urgency =
      URGENCY_RANK[firstEntry.urgency] >= URGENCY_RANK[secondEntry.urgency]
        ? firstEntry.urgency
        : secondEntry.urgency;

    result.push({
      symptoms,
      age: 10 + Math.floor(pseudoRandom() * 75),
      location: locations[Math.floor(pseudoRandom() * locations.length)],
      urgency,
    });
  }

  return result;
}
