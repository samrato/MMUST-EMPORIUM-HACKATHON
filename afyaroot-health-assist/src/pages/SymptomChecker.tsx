import { useState } from 'react';
import { Send, Mic, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import { analyzeSymptoms, DiagnosisResult } from '@/services/mockAI';

const urgencyConfig = {
  emergency: { emoji: '🚨', bg: 'bg-emergency/10 border-emergency', text: 'text-emergency', label: 'urgencyEmergency' as const },
  high: { emoji: '🟠', bg: 'bg-warning/10 border-warning', text: 'text-warning', label: 'urgencyHigh' as const },
  normal: { emoji: '🟢', bg: 'bg-success/10 border-success', text: 'text-success', label: 'urgencyNormal' as const },
};

export default function SymptomChecker() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const handleSubmit = () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setResult(analyzeSymptoms(input));
      setIsAnalyzing(false);
    }, 1500);
  };

  const cfg = result ? urgencyConfig[result.urgency] : null;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground">🧠 {t('symptoms', lang)}</h1>

      {/* Input */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('enterSymptom', lang)}
          className="w-full min-h-[100px] bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-base"
          rows={4}
        />
        <div className="flex gap-2">
          <button
            className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!input.trim() || isAnalyzing}
          >
            <Send className="h-4 w-4" />
            {isAnalyzing ? t('analyzing', lang) : t('send', lang)}
          </button>
          <button className="bg-secondary text-secondary-foreground rounded-xl px-4 py-3">
            <Mic className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Loading */}
      {isAnalyzing && (
        <div className="flex items-center justify-center gap-3 p-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">{t('analyzing', lang)}</span>
        </div>
      )}

      {/* Result */}
      {result && !isAnalyzing && cfg && (
        <div className={`fade-slide-up rounded-2xl border-2 ${cfg.bg} p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">{cfg.emoji} {result.condition}</h2>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.text} bg-background`}>
              {t(cfg.label, lang)} • {Math.round(result.confidence * 100)}%
            </span>
          </div>
          <p className="text-sm text-foreground/80">{result.description}</p>
          <div>
            <h3 className="font-semibold text-sm mb-2 text-foreground">Recommendations:</h3>
            <ul className="space-y-1">
              {result.recommendations.map((r, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => navigate('/facilities')}
              className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold"
            >
              📍 {result.suggestedFacility}
            </button>
            {result.urgency === 'emergency' && (
              <button
                onClick={() => navigate('/emergency')}
                className="bg-emergency text-emergency-foreground rounded-xl px-4 py-3 emergency-pulse"
              >
                <AlertTriangle className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
