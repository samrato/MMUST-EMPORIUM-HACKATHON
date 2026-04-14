import { useState } from 'react';
import { Send, Mic, MicOff, AlertTriangle, Loader2, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import { analyzeSymptomsWithAI, type SymptomAnalysisResult } from '@/services/geminiService';
import { useVoice } from '@/hooks/use-voice';
import { useUser } from '@/hooks/use-user';
import { logAiInteraction, persistDecisionCase } from '@/services/dataService';

const urgencyConfig = {
  emergency: { emoji: '🚨', bg: 'bg-emergency/10 border-emergency', text: 'text-emergency', label: 'urgencyEmergency' as const },
  high: { emoji: '🟥', bg: 'bg-warning/10 border-warning', text: 'text-warning', label: 'urgencyHigh' as const },
  medium: { emoji: '🟠', bg: 'bg-warning/10 border-warning', text: 'text-warning', label: 'urgencyHigh' as const },
  low: { emoji: '🟢', bg: 'bg-success/10 border-success', text: 'text-success', label: 'urgencyNormal' as const },
  normal: { emoji: '🟢', bg: 'bg-success/10 border-success', text: 'text-success', label: 'urgencyNormal' as const },
};

function SafeMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const formattedLine = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-extrabold text-foreground">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2 pl-2 py-0.5">
              <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
              <p className="text-sm leading-relaxed font-medium">{formattedLine.map(p => typeof p === 'string' ? p.replace(/^[*-\s]+/, '') : p)}</p>
            </div>
          );
        }

        return (
          <p key={i} className="text-sm leading-relaxed font-medium min-h-[1em]">
            {formattedLine}
          </p>
        );
      })}
    </div>
  );
}

export default function SymptomChecker() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<SymptomAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { patientId } = useUser();
  const { isListening, startListening, stopListening, speak } = useVoice();

  const handleSubmit = async (text?: string) => {
    const symptomText = text || input;
    if (!symptomText.trim()) return;
    const startedAt = Date.now();
    
    setIsAnalyzing(true);
    setResult(null);
    
    const aiResult = await analyzeSymptomsWithAI(symptomText, { language: lang });
    if (aiResult) {
      setResult(aiResult);
      // Auto-speak the summary
      const voiceSummary =
        lang === "sw"
          ? `Uchambuzi wa data: ${aiResult.condition}. Kiwango cha hatari ni ${aiResult.urgency}. ${aiResult.guidance.slice(0, 2).join(" ")}`
          : `Data analysis: ${aiResult.condition}. Urgency is ${aiResult.urgency}. ${aiResult.guidance.slice(0, 2).join(" ")}`;
      speak(voiceSummary, lang);

      void logAiInteraction({
        patientId,
        messageType: "symptom_analysis",
        language: lang,
        inputText: symptomText,
        responseText: `${aiResult.condition} | ${aiResult.description}`,
        durationMs: Date.now() - startedAt,
      }).catch((error: unknown) => {
        console.error("Failed to store symptom analysis:", error);
      });

      void persistDecisionCase({
        patientId,
        language: lang,
        inputText: symptomText,
        result: aiResult.structuredResult,
      }).catch((error: unknown) => {
        console.error("Failed to persist decision case:", error);
      });
    } else {
      alert("AI analysis failed. Please try again.");
    }
    setIsAnalyzing(false);
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((text) => {
        setInput(text);
        handleSubmit(text);
      });
    }
  };

  const cfg = result ? urgencyConfig[result.urgency] : null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full px-2">
      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">🧠 {t('symptoms', lang)}</h1>

      {/* Input */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-4 ring-1 ring-black/5">
        <div className="relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe how you feel (e.g., 'I have a sharp headache and fever for 2 days')..."
            className="w-full min-h-[120px] bg-transparent text-foreground placeholder:text-muted-foreground/50 resize-none outline-none text-base font-medium leading-relaxed"
            rows={4}
          />
          {isListening && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg animate-in fade-in">
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-emergency animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-emergency animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-emergency animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-xs font-bold text-emergency uppercase tracking-widest">Listening...</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={toggleMic}
            className={`p-3.5 rounded-xl transition-all ${isListening ? 'bg-emergency text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button
            className="flex-1 bg-primary text-primary-foreground rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-all disabled:opacity-40"
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isAnalyzing}
          >
            {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
            {isAnalyzing ? "AI is Analyzing..." : "Analyze Symptoms"}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && !isAnalyzing && cfg && (
        <div className={`fade-slide-up rounded-2xl border-2 ${cfg.bg} p-6 shadow-lg animate-in zoom-in-95 duration-500`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{cfg.emoji}</span>
                <h2 className="text-xl font-extrabold text-foreground">{result.condition}</h2>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${cfg.text} bg-background border border-current/20`}>
                Urgency: {result.urgency} • {Math.round(result.confidence * 100)}% Match
              </span>
            </div>
            <button 
              onClick={() => speak(`${result.condition}. ${result.description}`, lang)}
              className="p-2 rounded-full bg-background/50 text-primary hover:bg-background transition-all"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mb-6">
            <SafeMarkdown content={result.description} />
          </div>

          {result.matchedSymptoms.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-xs uppercase tracking-wider mb-2 text-foreground opacity-70">Matched Symptoms</h3>
              <div className="flex flex-wrap gap-2">
                {result.matchedSymptoms.map((symptom) => (
                  <span key={symptom} className="text-[11px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.possibleConditions.length > 1 && (
            <div className="mb-4">
              <h3 className="font-bold text-xs uppercase tracking-wider mb-2 text-foreground opacity-70">Possible Conditions</h3>
              <p className="text-sm text-foreground/80 font-semibold">
                {result.possibleConditions.join(" • ")}
              </p>
            </div>
          )}

          <div className="mb-6 bg-background/50 border border-border rounded-xl p-3">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-2 text-foreground opacity-70">Recommended Facility</h3>
            <p className="text-sm font-bold text-foreground">{result.recommendedFacility.name}</p>
            <p className="text-xs text-muted-foreground">
              {result.recommendedFacility.type} • {result.recommendedFacility.distance_km.toFixed(1)} km
            </p>
            <p className="text-xs text-foreground/70 mt-2">{result.explanation}</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider mb-3 text-foreground opacity-70">Step-by-Step Guidance:</h3>
              <ul className="space-y-3">
                {result.guidance.map((r, i) => (
                  <li key={i} className="text-sm text-foreground/90 font-semibold flex items-start gap-3 bg-background/40 p-3 rounded-xl">
                    <span className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => navigate('/facilities')}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-4 text-sm font-bold shadow-md hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                📍 Find Nearest {result.suggestedFacilityType}
              </button>
              {result.urgency === 'emergency' && (
                <button
                  onClick={() => navigate('/emergency')}
                  className="bg-emergency text-emergency-foreground rounded-xl px-5 py-4 emergency-pulse shadow-lg"
                >
                  <AlertTriangle className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
