import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  Home,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Settings,
  ShieldPlus,
  Stethoscope,
} from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import PwaInstallButton from '@/components/PwaInstallButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, labelKey: 'home' as const, description: 'Overview and care shortcuts' },
  { to: '/symptoms', icon: Stethoscope, labelKey: 'symptoms' as const, description: 'AI-guided symptom triage' },
  { to: '/emergency', icon: AlertTriangle, labelKey: 'emergency' as const, description: 'Urgent response and ambulance flow' },
  { to: '/chat', icon: MessageCircle, labelKey: 'chat' as const, description: 'Ask the health assistant anything' },
  { to: '/facilities', icon: MapPin, labelKey: 'facilities' as const, description: 'Nearby hospitals and clinics' },
  { to: '/booking', icon: Calendar, labelKey: 'booking' as const, description: 'Book appointments and follow-ups' },
  { to: '/contact', icon: Mail, labelKey: 'contact' as const, description: 'Get in touch with our support team' },
  { to: '/settings', icon: Settings, labelKey: 'settings' as const, description: 'Language and device preferences' },
];

function SidebarPanel({ mobile = false }: { mobile?: boolean }) {
  const { lang } = useLanguage();

  return (
    <div className="flex h-full flex-col bg-[#08060d] text-white">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00dc33] text-black shadow-lg shadow-[#00dc33]/30">
            <ShieldPlus className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#00dc33]">AFYAROOT</p>
              <span className="h-1.5 w-1.5 rounded-full bg-[#00dc33] animate-ping" />
            </div>
            <h1 className="text-lg font-extrabold text-white font-heading">Health Assist</h1>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-400 font-medium">
          Rural health triage, emergency routing, facility search, analytics, booking, and settings in one place.
        </p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-5 font-sans">
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
                      ? 'border-red-500 bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : isActive
                      ? 'border-[#00dc33] bg-[#00dc33] text-black shadow-lg shadow-[#00dc33]/25'
                      : 'border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/5',
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
                          ? 'bg-white/20 text-white'
                          : 'bg-red-500/20 text-red-400'
                        : isActive
                          ? 'bg-black/20 text-black'
                          : 'bg-white/10 text-[#00dc33]',
                    )}
                  >
                    <Icon className={cn('h-5 w-5', labelKey === 'emergency' && !isActive && 'animate-pulse')} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold">{t(labelKey, lang)}</span>
                    <span
                      className={cn(
                        'mt-0.5 block text-xs leading-4 font-medium',
                        labelKey === 'emergency'
                          ? isActive
                            ? 'text-white/90'
                            : 'text-red-300/80'
                          : isActive
                            ? 'text-black/80'
                            : 'text-slate-400',
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
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#00dc33]">System</p>
              <p className="mt-0.5 text-sm font-bold text-white">Services online</p>
            </div>
            <span className="flex items-center gap-2 rounded-full bg-[#00dc33]/15 px-3 py-1 text-xs font-bold text-[#00dc33] border border-[#00dc33]/30">
              <span className="h-2 w-2 rounded-full bg-[#00dc33] animate-pulse" />
              Ready
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400 font-medium">
            Multilingual care triage for homes, clinics, and emergency cases across Kenya.
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
    <div className="min-h-screen bg-[#fcfbf9] text-[#08060d]">
      <div className="mx-auto flex min-h-screen max-w-[1560px]">
        <aside className="hidden w-80 shrink-0 border-r border-[#00dc33]/20 bg-[#08060d] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col shadow-2xl">
          <SidebarPanel />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-[#00dc33]/20 bg-[#08060d]/95 backdrop-blur-xl text-white">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-sm transition hover:bg-white/20 lg:hidden"
                      aria-label="Open navigation"
                    >
                      <Menu className="h-5 w-5" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[86vw] max-w-sm border-r border-white/10 bg-[#08060d] p-0">
                    <SheetHeader className="sr-only">
                      <SheetTitle>AFYAROOT Navigation</SheetTitle>
                      <SheetDescription>
                        Access Home, Symptoms, Emergency, Chat AI, Facilities, Analytics, Booking, Contact, and Settings.
                      </SheetDescription>
                    </SheetHeader>
                    <SidebarPanel mobile />
                  </SheetContent>
                </Sheet>

                <div
                  className={cn(
                    'hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-white/10 shadow-sm lg:flex',
                    currentItem.labelKey === 'emergency'
                      ? 'border-red-500/40 text-red-400'
                      : 'border-white/15 text-[#00dc33]',
                  )}
                >
                  <CurrentIcon className="h-5 w-5 stroke-[2.5]" />
                </div>

                <div className="min-w-0 font-sans">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[11px] font-black uppercase tracking-[0.24em] text-[#00dc33]">AFYAROOT</p>
                    {currentItem.labelKey === 'emergency' && (
                      <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-red-400">
                        Priority
                      </span>
                    )}
                  </div>
                  <p className="truncate text-base font-extrabold text-white sm:text-lg font-heading">{t(currentItem.labelKey, lang)}</p>
                  <p className="hidden truncate text-xs font-medium text-slate-300 sm:block">{currentItem.description}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <PwaInstallButton compact className="hidden sm:inline-flex" />
                <a
                  href="tel:999"
                  className="hidden items-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-400 shadow-sm transition hover:bg-red-600 hover:text-white sm:inline-flex"
                >
                  <Phone className="h-4 w-4 animate-bounce" />
                  Emergency 999
                </a>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#00dc33]/15 border border-[#00dc33]/30 px-3 py-1.5 text-xs font-bold text-[#00dc33]">
                  <span className="h-2 w-2 rounded-full bg-[#00dc33] animate-pulse" />
                  Online
                </span>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-[#00dc33]/40 to-transparent" />
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
