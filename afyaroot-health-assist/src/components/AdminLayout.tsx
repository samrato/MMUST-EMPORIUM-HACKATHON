import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Building2, Calendar, Home, LogOut, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { to: '/admin/settings', label: 'Facility Settings', icon: Building2 },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { currentFacilityName, logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">AFYAROOT ADMIN</p>
            <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{currentFacilityName ?? 'Facility'}</h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:px-8 lg:py-8">
        <aside className="w-full rounded-2xl border border-border bg-card p-3 lg:sticky lg:top-6 lg:w-72">
          <div className="mb-3 flex items-center gap-2 px-2 py-1 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Admin Actions
          </div>
          <nav className="space-y-1">
            {adminNavItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
