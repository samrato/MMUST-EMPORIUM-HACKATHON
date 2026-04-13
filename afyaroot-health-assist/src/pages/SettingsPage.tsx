import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, languages, Language } from '@/services/languageService';
import { Globe, Info } from 'lucide-react';

export default function SettingsPage() {
  const { lang, setLang } = useLanguage();
  const patientId = useMemo(() => `AFR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">⚙️ {t('settings', lang)}</h1>

      {/* Language */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" /> {t('language', lang)}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(languages) as [Language, string][]).map(([code, name]) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`rounded-xl py-3 text-sm font-medium transition-all ${
                lang === code ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Patient ID */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
        <h3 className="font-semibold text-foreground">Anonymous Patient ID</h3>
        <p className="text-sm font-mono bg-secondary text-secondary-foreground rounded-lg px-3 py-2">
          {patientId}
        </p>
        <p className="text-xs text-muted-foreground">No login required. Your data stays on this device.</p>
      </div>

      {/* About */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Info className="h-5 w-5 text-accent" /> About AFYAROOT
        </h3>
        <p className="text-sm text-muted-foreground">
          AI Rural Health Intelligence System. Designed for rural healthcare environments with low connectivity.
          Works offline after first load.
        </p>
        <p className="text-xs text-muted-foreground">Version 1.0.0 • Built with ❤️ for rural communities</p>
      </div>
    </div>
  );
}
