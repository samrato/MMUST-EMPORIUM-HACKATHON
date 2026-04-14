import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getFacilityStats, AdminStats, getEmergencyAlerts, AdminEmergencyAlert } from '@/services/adminService';
import { AlertTriangle, BarChart3, Clock, Users, TrendingUp, LogOut, MapPin } from 'lucide-react';

export default function AdminDashboardPage() {
  const { isAuthenticated, currentFacilityId, currentFacilityName, logout } = useAdminAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [emergencyAlerts, setEmergencyAlerts] = useState<AdminEmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!currentFacilityId) return;

    setLoading(true);
    setError(null);

    try {
      const [statsData, alertsData] = await Promise.all([
        getFacilityStats(currentFacilityId, currentFacilityName),
        getEmergencyAlerts(currentFacilityId, 10),
      ]);

      setStats(statsData);
      setEmergencyAlerts(alertsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentFacilityId, currentFacilityName]);

  useEffect(() => {
    void loadData();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      void loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadData]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to access admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {currentFacilityName}
          </p>
        </div>
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl bg-emergency/10 border border-emergency/30 p-4 flex gap-2">
          <AlertTriangle className="h-5 w-5 text-emergency flex-shrink-0" />
          <p className="text-sm text-emergency">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !stats ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-card border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Today's Bookings"
              value={stats.totalBookingsToday}
              icon={<Users className="h-5 w-5" />}
              color="primary"
            />
            <StatCard
              label="Emergency Cases"
              value={stats.emergencyBookingsToday}
              icon={<AlertTriangle className="h-5 w-5" />}
              color="emergency"
              highlight={stats.emergencyBookingsToday > 0}
            />
            <StatCard
              label="Facility Capacity"
              value={`${stats.facilityCapacityUsage}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              color="accent"
            />
            <StatCard
              label="Avg Wait Time"
              value={`${stats.averageWaitTime}m`}
              icon={<Clock className="h-5 w-5" />}
              color="warning"
            />
          </div>

          {/* Emergency Queue */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-emergency" />
                Emergency Alert Queue
              </h2>
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-emergency/10 text-emergency">
                {emergencyAlerts.length} Open
              </span>
            </div>

            {emergencyAlerts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active emergency alerts</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {emergencyAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="border border-emergency/30 bg-emergency/5 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs text-primary">{alert.patientId}</p>
                        <p className="text-sm font-medium text-foreground">{alert.symptoms}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-emergency text-emergency-foreground">
                        {alert.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      📍 {alert.location} • {new Date(alert.createdAt).toLocaleTimeString()}
                    </p>
                    {!alert.assignedAmbulance && (
                      <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emergency text-emergency-foreground hover:brightness-110 transition-all">
                        Assign Ambulance
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Bookings Preview */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Today's Appointments</h2>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              <p className="text-sm text-muted-foreground">
                👉 Go to <span className="font-mono font-semibold text-primary">/admin/bookings</span> to manage appointments
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionCard
              title="View Bookings"
              description="Manage all appointments"
              link="/admin/bookings"
              icon="📅"
            />
            <QuickActionCard
              title="Facility Settings"
              description="Update facility info"
              link="/admin/settings"
              icon="⚙️"
            />
            <QuickActionCard
              title="View Analytics"
              description="Detailed health trends"
              link="/admin/analytics"
              icon="📊"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: 'primary' | 'emergency' | 'accent' | 'warning';
  highlight?: boolean;
}

function StatCard({ label, value, icon, color, highlight }: StatCardProps) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    emergency: 'bg-emergency/10 text-emergency',
    accent: 'bg-accent/10 text-accent',
    warning: 'bg-warning/10 text-warning',
  };

  return (
    <div
      className={`bg-card border ${highlight ? 'border-emergency/50 shadow-lg shadow-emergency/20' : 'border-border'} rounded-2xl p-4 space-y-2`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  link: string;
  icon: string;
}

function QuickActionCard({ title, description, link, icon }: QuickActionCardProps) {
  return (
    <Link
      to={link}
      className="bg-card border border-border rounded-2xl p-4 hover:border-primary hover:bg-card/80 transition-all group"
    >
      <p className="text-2xl mb-2">{icon}</p>
      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </Link>
  );
}
