import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Home,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Settings,
  ShieldPlus,
  Stethoscope,
} from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, labelKey: 'home' as const, description: 'Overview and care shortcuts' },
  { to: '/symptoms', icon: Stethoscope, labelKey: 'symptoms' as const, description: 'AI-guided symptom triage' },
  { to: '/emergency', icon: AlertTriangle, labelKey: 'emergency' as const, description: 'Urgent response and ambulance flow' },
  { to: '/chat', icon: MessageCircle, labelKey: 'chat' as const, description: 'Ask the health assistant anything' },
  { to: '/facilities', icon: MapPin, labelKey: 'facilities' as const, description: 'Nearby hospitals and clinics' },
  { to: '/analytics', icon: BarChart3, labelKey: 'analytics' as const, description: 'Live case and capacity trends' },
  { to: '/booking', icon: Calendar, labelKey: 'booking' as const, description: 'Book appointments and follow-ups' },
  { to: '/settings', icon: Settings, labelKey: 'settings' as const, description: 'Language and device preferences' },
];

function SidebarPanel({ mobile = false }: { mobile?: boolean }) {
  const { pathname } = useLocation();
  const { lang } = useLanguage();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/70 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ShieldPlus className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">AFYAROOT</p>
            <h1 className="text-lg font-bold text-foreground">Health Assist</h1>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Rural health triage, emergency routing, facility search, analytics, booking, and settings in one place.
        </p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
        {navItems.map(({ to, icon: Icon, labelKey, description }) => {
          const link = (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'group flex items-start gap-3 rounded-2xl border px-4 py-3 transition-all',
                  labelKey === 'emergency'
                    ? isActive
                      ? 'border-emergency bg-emergency text-emergency-foreground shadow-lg shadow-emergency/20'
                      : 'border-emergency/25 bg-emergency/5 text-emergency hover:bg-emergency/10'
                    : isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15'
                      : 'border-transparent bg-transparent text-foreground hover:border-border hover:bg-card/80',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                      labelKey === 'emergency'
                        ? isActive
                          ? 'bg-white/15 text-emergency-foreground'
                          : 'bg-emergency/15 text-emergency'
                        : isActive
                          ? 'bg-white/15 text-primary-foreground'
                          : 'bg-secondary text-primary',
                    )}
                  >
                    <Icon className={cn('h-5 w-5', labelKey === 'emergency' && !isActive && 'animate-pulse')} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{t(labelKey, lang)}</span>
                    <span
                      className={cn(
                        'mt-1 block text-xs leading-5',
                        labelKey === 'emergency'
                          ? isActive
                            ? 'text-emergency-foreground/85'
                            : 'text-emergency/80'
                          : isActive
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground',
                      )}
                    >
                      {description}
                    </span>
                  </span>
                </>
              )}
            </NavLink>
          );

          return mobile ? (
            <SheetClose key={to} asChild>
              {link}
            </SheetClose>
          ) : (
            link
          );
        })}
      </div>

      <div className="p-4">
        <div className="rounded-3xl border border-border bg-background/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">System</p>
              <p className="mt-1 text-sm font-semibold text-foreground">Services online</p>
            </div>
            <span className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
              Ready
            </span>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Quick access to multilingual care support for homes, clinics, and emergency cases.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { lang } = useLanguage();
  const currentItem = navItems.find(({ to }) => pathname === to) ?? navItems[0];
  const CurrentIcon = currentItem.icon;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[1560px]">
        <aside className="hidden w-80 shrink-0 border-r border-border/70 bg-card/75 backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
          <SidebarPanel />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm transition hover:bg-secondary lg:hidden"
                      aria-label="Open navigation"
                    >
                      <Menu className="h-5 w-5" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[86vw] max-w-sm border-r border-border/70 bg-background p-0">
                    <SheetHeader className="sr-only">
                      <SheetTitle>AFYAROOT Navigation</SheetTitle>
                      <SheetDescription>
                        Access Home, Symptoms, Emergency, Chat AI, Facilities, Analytics, Booking, and Settings.
                      </SheetDescription>
                    </SheetHeader>
                    <SidebarPanel mobile />
                  </SheetContent>
                </Sheet>

                <div
                  className={cn(
                    'hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-card shadow-sm lg:flex',
                    currentItem.labelKey === 'emergency'
                      ? 'border-emergency/30 text-emergency'
                      : 'border-border text-primary',
                  )}
                >
                  <CurrentIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-semibold uppercase tracking-[0.24em] text-primary">AFYAROOT</p>
                    {currentItem.labelKey === 'emergency' && (
                      <span className="rounded-full bg-emergency/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emergency">
                        Priority
                      </span>
                    )}
                  </div>
                  <p className="truncate text-base font-semibold text-foreground sm:text-lg">{t(currentItem.labelKey, lang)}</p>
                  <p className="hidden truncate text-sm text-muted-foreground sm:block">{currentItem.description}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <a
                  href="tel:999"
                  className="hidden items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-secondary sm:inline-flex"
                >
                  <Phone className="h-4 w-4 text-emergency" />
                  Emergency 999
                </a>
                <span className="inline-flex items-center gap-2 rounded-2xl bg-success/10 px-3 py-2 text-xs font-semibold text-success">
                  <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
                  Online
                </span>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
