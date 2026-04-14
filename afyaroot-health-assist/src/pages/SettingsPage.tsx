import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, languages, Language } from '@/services/languageService';
import { Globe, Info, RefreshCw, ShieldCheck } from 'lucide-react';
import { useUser } from '@/hooks/use-user';

export default function SettingsPage() {
  const { lang, setLang } = useLanguage();
  const { patientId, resetId } = useUser();

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
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Anonymous Patient ID</h3>
          <button 
            onClick={resetId}
            className="text-primary hover:text-primary/80 transition-colors p-1"
            title="Reset Patient ID"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm font-mono bg-secondary text-secondary-foreground rounded-lg px-3 py-2">
          {patientId}
        </p>
        <p className="text-xs text-muted-foreground">This ID is stored locally on your device to keep your data persistent.</p>
      </div>

      {/* Admin Access */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Admin Portal
          </h3>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            All admin actions are managed in the dedicated admin side. Use the admin login to oversee emergency
            alerts, analytics, bookings, and facility settings.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/login"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground"
            >
              Open Admin Login
            </Link>
            <Link
              to="/admin"
              className="rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground"
            >
              Open Admin Home
            </Link>
          </div>
        </div>
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
