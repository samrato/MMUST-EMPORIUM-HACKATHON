import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Check, Loader2, MapPin, Navigation, ShieldCheck } from 'lucide-react';
import {
  EmergencyAdminAlert,
  AnonymousRequestLog,
  AnonymousUserActivitySummary,
  getEmergencyAlertsForAdmin,
  getAnonymousUserActivity,
  getRecentAnonymousRequests,
} from '@/services/dataService';

const COLORS = ['hsl(0, 72%, 51%)', 'hsl(25, 95%, 53%)', 'hsl(122, 39%, 34%)', 'hsl(199, 89%, 48%)', 'hsl(142, 71%, 45%)'];

const weeklyData = [
  { day: 'Mon', emergency: 3, high: 8, normal: 22 },
  { day: 'Tue', emergency: 5, high: 12, normal: 18 },
  { day: 'Wed', emergency: 2, high: 6, normal: 25 },
  { day: 'Thu', emergency: 4, high: 9, normal: 20 },
  { day: 'Fri', emergency: 7, high: 15, normal: 16 },
  { day: 'Sat', emergency: 6, high: 11, normal: 12 },
  { day: 'Sun', emergency: 1, high: 4, normal: 28 },
];

const diseaseData = [
  { name: 'Malaria', cases: 245 },
  { name: 'Respiratory', cases: 189 },
  { name: 'Diarrhea', cases: 134 },
  { name: 'Skin', cases: 87 },
  { name: 'Eye', cases: 56 },
];

const facilityLoad = [
  { name: 'Kapsabet', value: 78 },
  { name: 'Nandi Hills', value: 62 },
  { name: 'Chepterit', value: 45 },
  { name: 'Kabiyet', value: 20 },
  { name: 'Mosoriot', value: 70 },
];

function formatDateTime(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const REVIEWED_ALERTS_STORAGE_KEY = 'afyaroot-reviewed-emergency-alerts';

function loadReviewedAlertIds() {
  if (typeof window === 'undefined' || !window.localStorage) return [] as string[];
  const raw = window.localStorage.getItem(REVIEWED_ALERTS_STORAGE_KEY);
  if (!raw) return [] as string[];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [] as string[];
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch (error: unknown) {
    console.error('Failed to parse reviewed emergency alerts from local storage:', error);
    return [] as string[];
  }
}

function persistReviewedAlertIds(alertIds: string[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(REVIEWED_ALERTS_STORAGE_KEY, JSON.stringify(alertIds));
}

function buildDirectionsLink(alert: EmergencyAdminAlert) {
  if (alert.coordinates && alert.destinationName) {
    return `https://www.google.com/maps/dir/?api=1&origin=${alert.coordinates.lat},${alert.coordinates.lng}&destination=${encodeURIComponent(alert.destinationName)}`;
  }
  if (alert.coordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${alert.coordinates.lat},${alert.coordinates.lng}`;
  }
  if (alert.destinationName) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alert.destinationName)}`;
  }
  return null;
}

export default function AnalyticsPage() {
  const { lang } = useLanguage();
  const [stats, setStats] = useState({ today: 0, emergency: 0, facilities: 6 });
  const [anonymousUsers, setAnonymousUsers] = useState<AnonymousUserActivitySummary[]>([]);
  const [recentRequests, setRecentRequests] = useState<AnonymousRequestLog[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAdminAlert[]>([]);
  const [reviewedAlertIds, setReviewedAlertIds] = useState<string[]>(() => loadReviewedAlertIds());
  const [loadingTracking, setLoadingTracking] = useState(true);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    const { count: todayCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', today);

    const { count: emergencyCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', today)
      .eq('urgency', 'emergency');

    setStats(prev => ({
      ...prev,
      today: todayCount || 0,
      emergency: emergencyCount || 0,
    }));
  }, []);

  const fetchTracking = useCallback(async () => {
    setLoadingTracking(true);
    setTrackingError(null);
    try {
      const [users, requests, alerts] = await Promise.all([
        getAnonymousUserActivity(30),
        getRecentAnonymousRequests(50),
        getEmergencyAlertsForAdmin(40),
      ]);
      setAnonymousUsers(users);
      setRecentRequests(requests);
      setEmergencyAlerts(alerts);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load admin tracking data.';
      setTrackingError(message);
    } finally {
      setLoadingTracking(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
    void fetchTracking();

    const channel = supabase
      .channel('realtime_analytics')
      .on('postgres_changes', { event: 'INSERT', table: 'appointments' }, () => {
        void fetchStats();
        void fetchTracking();
      })
      .on('postgres_changes', { event: 'INSERT', table: 'ai_interactions' }, () => {
        void fetchTracking();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats, fetchTracking]);

  const todayIsoDate = new Date().toISOString().split('T')[0];
  const requestsToday = useMemo(
    () => recentRequests.filter((request) => request.createdAt.startsWith(todayIsoDate)).length,
    [recentRequests, todayIsoDate]
  );
  const emergencyRequestsToday = useMemo(
    () =>
      recentRequests.filter(
        (request) => request.createdAt.startsWith(todayIsoDate) && request.messageType === 'emergency_alert'
      ).length,
    [recentRequests, todayIsoDate]
  );
  const reviewedAlertSet = useMemo(() => new Set(reviewedAlertIds), [reviewedAlertIds]);
  const openEmergencyAlerts = useMemo(
    () => emergencyAlerts.filter((alert) => !reviewedAlertSet.has(alert.id)),
    [emergencyAlerts, reviewedAlertSet]
  );

  const markAlertAsReviewed = useCallback((alertId: string) => {
    setReviewedAlertIds((previous) => {
      if (previous.includes(alertId)) return previous;
      const updated = [...previous, alertId];
      persistReviewedAlertIds(updated);
      return updated;
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">📊 {t('liveAnalytics', lang)}</h1>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {[
          { label: 'Today', value: stats.today.toString(), color: 'text-primary' },
          { label: 'Emergency', value: stats.emergency.toString(), color: 'text-emergency' },
          { label: 'Anonymous IDs', value: anonymousUsers.length.toString(), color: 'text-accent' },
          { label: 'Requests Today', value: requestsToday.toString(), color: 'text-warning' },
          { label: 'Facilities', value: stats.facilities.toString(), color: 'text-success' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center transition-all animate-in fade-in zoom-in duration-300">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Admin Monitoring: Anonymous User Activity
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Track anonymous patient IDs, request volume, and emergency signals for follow-up support.
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-emergency/10 text-emergency">
            Emergency Requests Today: {emergencyRequestsToday}
          </span>
        </div>

        {loadingTracking ? (
          <div className="flex items-center gap-2 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading anonymous user tracking...</p>
          </div>
        ) : trackingError ? (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <p>{trackingError}</p>
          </div>
        ) : anonymousUsers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No anonymous activity has been logged yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[680px] text-xs">
              <thead className="bg-secondary/30">
                <tr className="text-left">
                  <th className="px-3 py-2 font-black uppercase tracking-wider text-muted-foreground">Anonymous ID</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider text-muted-foreground">Requests</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider text-muted-foreground">Emergency Signals</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider text-muted-foreground">Bookings</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider text-muted-foreground">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {anonymousUsers.map((user) => (
                  <tr key={user.patientId} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-foreground">{user.patientId}</td>
                    <td className="px-3 py-2 font-semibold text-foreground">{user.requestCount}</td>
                    <td className="px-3 py-2 font-semibold text-emergency">{user.emergencyCount}</td>
                    <td className="px-3 py-2 font-semibold text-foreground">{user.bookingCount}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDateTime(user.lastActivityAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-emergency" />
              Emergency Alert Review Queue
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Admin can review emergency alerts, confirm patient location, and follow AI guidance for safe directions.
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-emergency/10 text-emergency">
            Open Alerts: {openEmergencyAlerts.length}
          </span>
        </div>

        {loadingTracking ? (
          <div className="flex items-center gap-2 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading emergency alert queue...</p>
          </div>
        ) : trackingError ? (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <p>{trackingError}</p>
          </div>
        ) : emergencyAlerts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No emergency alerts are waiting for admin review.</p>
        ) : (
          <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
            {emergencyAlerts.slice(0, 16).map((alert) => {
              const reviewed = reviewedAlertSet.has(alert.id);
              const directionsLink = buildDirectionsLink(alert);

              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-3 ${
                    reviewed ? 'border-success/30 bg-success/5' : 'border-emergency/30 bg-emergency/5'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-mono text-foreground">{alert.patientId}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {alert.sourceLabel} • {formatDateTime(alert.triggeredAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => markAlertAsReviewed(alert.id)}
                      disabled={reviewed}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest transition ${
                        reviewed
                          ? 'bg-success/20 text-success cursor-not-allowed'
                          : 'bg-emergency text-emergency-foreground hover:brightness-110'
                      }`}
                    >
                      {reviewed ? <Check className="h-3 w-3" /> : null}
                      {reviewed ? 'Reviewed' : 'Mark Reviewed'}
                    </button>
                  </div>

                  <div className="mt-2 space-y-1">
                    <p className="text-[11px] text-foreground/90 flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                      <span><span className="font-semibold">Patient location:</span> {alert.locationLabel}</span>
                    </p>
                    <p className="text-[11px] text-foreground/90">
                      <span className="font-semibold">Emergency destination:</span> {alert.destinationName || 'Nearest available emergency facility'}
                    </p>
                    {alert.routeSummary && (
                      <p className="text-[10px] text-muted-foreground">
                        <span className="font-semibold text-foreground/80">Latest route context:</span> {alert.routeSummary}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 rounded-lg border border-border bg-background/60 p-2.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                      AI Guidance
                    </p>
                    <ol className="space-y-1.5">
                      {alert.aiGuidance.slice(0, 3).map((step, index) => (
                        <li key={`${alert.id}-guidance-${index}`} className="text-[11px] text-foreground/85 flex gap-1.5">
                          <span className="font-black text-primary">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {directionsLink && (
                    <a
                      href={directionsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Open Directions
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="font-semibold text-sm mb-3 text-foreground">Recent Anonymous Requests</h3>
        {loadingTracking ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading request feed...</p>
          </div>
        ) : recentRequests.length === 0 ? (
          <p className="text-xs text-muted-foreground">No request feed data available.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {recentRequests.slice(0, 20).map((request, index) => (
              <div key={`${request.patientId}-${request.createdAt}-${index}`} className="rounded-xl border border-border p-3 bg-background/40">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">{request.messageType}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDateTime(request.createdAt)}</p>
                </div>
                <p className="text-[11px] font-mono text-foreground mb-1">{request.patientId}</p>
                <p className="text-xs text-foreground/80 line-clamp-2">{request.inputText || 'No input text.'}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Duration: {request.durationMs} ms</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="font-semibold text-sm mb-3 text-foreground">Disease Cases This Month</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={diseaseData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 20%, 88%)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="cases" fill="hsl(122, 39%, 34%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="font-semibold text-sm mb-3 text-foreground">Weekly Case Trends</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 20%, 88%)" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="emergency" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="high" stroke="hsl(25, 95%, 53%)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="normal" stroke="hsl(122, 39%, 34%)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="font-semibold text-sm mb-3 text-foreground">Facility Occupancy</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={facilityLoad} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}%`}>
              {facilityLoad.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
