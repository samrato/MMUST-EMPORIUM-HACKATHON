import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Calendar, AlertTriangle, Download, MapPin, MessageCircle, ShieldCheck, Stethoscope, Wifi } from 'lucide-react';
import PwaInstallButton from '@/components/PwaInstallButton';
import { usePwa } from '@/hooks/use-pwa';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import heroImage from '@/assets/hero-health.png';

const quickActions = [
  { to: '/symptoms', icon: Stethoscope, labelKey: 'checkSymptoms' as const, color: 'bg-primary text-primary-foreground', detail: 'Start AI triage in under a minute' },
  { to: '/emergency', icon: AlertTriangle, labelKey: 'emergencyHelp' as const, color: 'bg-emergency text-emergency-foreground', detail: 'Open urgent response tools and contacts' },
  { to: '/facilities', icon: MapPin, labelKey: 'findFacility' as const, color: 'bg-accent text-accent-foreground', detail: 'Browse nearby hospitals and clinics' },
  { to: '/chat', icon: MessageCircle, labelKey: 'talkToAI' as const, color: 'bg-warning text-warning-foreground', detail: 'Ask for guidance in plain language' },
  { to: '/analytics', icon: BarChart3, labelKey: 'liveAnalytics' as const, color: 'bg-secondary text-secondary-foreground', detail: 'Track cases and facility load' },
  { to: '/booking', icon: Calendar, labelKey: 'bookAppointment' as const, color: 'bg-success text-success-foreground', detail: 'Schedule an appointment or follow-up' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { canInstall, installLabel, isInstalled } = usePwa();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border bg-card/80 p-6 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr] xl:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Rural Health Intelligence</p>
            <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
              {t('appName', lang)} keeps every care pathway one tap away.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t('welcomeSubtitle', lang)}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/symptoms')}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition hover:bg-primary/90"
              >
                {t('checkSymptoms', lang)}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/emergency')}
                className="inline-flex items-center gap-2 rounded-2xl bg-emergency px-5 py-3 text-sm font-semibold text-emergency-foreground shadow-lg shadow-emergency/15 transition hover:bg-emergency/90"
              >
                <AlertTriangle className="h-4 w-4" />
                {t('emergencyHelp', lang)}
              </button>
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-primary/5 p-5">
            <img src={heroImage} alt="AFYAROOT Health" width={1280} height={640} className="h-44 w-full object-contain" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-background/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">System status</p>
                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-success">
                  <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
                  Online and ready
                </div>
              </div>
              <div className="rounded-2xl bg-background/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Coverage</p>
                <p className="mt-2 text-sm font-semibold text-foreground">Facilities, analytics, AI chat, and booking connected.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {(canInstall || isInstalled) && (
        <section className="rounded-[1.75rem] border border-primary/15 bg-primary/5 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Progressive Web App</p>
              <h2 className="mt-2 text-xl font-bold text-foreground">Use AFYAROOT like a native app.</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Install it to your home screen for faster access, offline support, and a cleaner full-screen experience.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-2">
                  <Download className="h-3.5 w-3.5 text-primary" />
                  Easy install
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-2">
                  <Wifi className="h-3.5 w-3.5 text-primary" />
                  Offline after first load
                </span>
              </div>
            </div>

            {isInstalled ? (
              <div className="inline-flex items-center gap-2 self-start rounded-2xl bg-success/10 px-4 py-3 text-sm font-semibold text-success">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                Installed and ready offline
              </div>
            ) : (
              <div className="flex flex-col gap-2 self-start lg:items-end">
                <PwaInstallButton className="min-w-[12rem]" />
                <p className="text-xs text-muted-foreground">{installLabel} to open faster next time.</p>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickActions.map(({ to, icon: Icon, labelKey, color, detail }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={`${color} card-hover flex min-h-[160px] flex-col justify-between rounded-[1.75rem] p-5 text-left shadow-sm`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Icon className="h-6 w-6" />
              </span>
              <ArrowRight className="h-5 w-5 opacity-80" />
            </div>
            <div>
              <p className="text-base font-semibold">{t(labelKey, lang)}</p>
              <p className="mt-2 text-sm leading-6 text-current/80">{detail}</p>
            </div>
          </button>
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Care triage</p>
              <p className="text-xs text-muted-foreground">Fast symptom checks and emergency escalation.</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Facility access</p>
              <p className="text-xs text-muted-foreground">Nearest hospitals and clinics stay easy to find.</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/10 text-success">
              <Calendar className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Appointments</p>
              <p className="text-xs text-muted-foreground">Book visits and follow-ups from the same dashboard.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
