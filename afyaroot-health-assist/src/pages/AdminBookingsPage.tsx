import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getFacilityBookings, getRecentBookings } from '@/services/adminService';
import { Calendar, MapPin, Phone, AlertTriangle, Check, Loader2 } from 'lucide-react';

interface Booking {
  id: string;
  patient_id: string;
  full_name: string;
  phone: string;
  age: number;
  gender?: string;
  location: string;
  symptoms: string;
  appointment_date: string;
  appointment_time: string;
  urgency: string;
  facility_name: string;
  created_at: string;
}

export default function AdminBookingsPage() {
  const { isAuthenticated, currentFacilityId, currentFacilityName } = useAdminAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterUrgency, setFilterUrgency] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [debugShowAll, setDebugShowAll] = useState(false);
  const [debugSample, setDebugSample] = useState<Booking | null>(null);

  const loadBookings = useCallback(async () => {
    if (!currentFacilityId) return;

    setLoading(true);
    setError(null);
    setDebugSample(null);

    try {
      const data = debugShowAll
        ? await getRecentBookings(200)
        : await getFacilityBookings(currentFacilityId, currentFacilityName, 200);
      setBookings(data);
      setFilteredBookings(data);
      setDebugSample((data?.[0] as Booking | undefined) ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load bookings';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentFacilityId, currentFacilityName, debugShowAll]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  // Apply filters
  useEffect(() => {
    let filtered = bookings;

    if (filterUrgency) {
      filtered = filtered.filter((b) => b.urgency === filterUrgency);
    }

    if (filterDate) {
      filtered = filtered.filter((b) => b.appointment_date === filterDate);
    }

    setFilteredBookings(filtered);
  }, [bookings, filterUrgency, filterDate]);

  const markAcknowledged = (bookingId: string) => {
    setAcknowledgedIds((previous) => (previous.includes(bookingId) ? previous : [...previous, bookingId]));
  };

  if (!isAuthenticated) {
    return <p className="text-muted-foreground">Please log in first.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-8 w-8 text-primary" />
          Appointment Management
        </h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {currentFacilityName}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl bg-emergency/10 border border-emergency/30 p-4 flex gap-2">
          <AlertTriangle className="h-5 w-5 text-emergency flex-shrink-0" />
          <p className="text-sm text-emergency">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold text-foreground">Filters</h3>
        {import.meta.env.DEV && (
          <div className="rounded-xl border border-border bg-secondary/20 p-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={debugShowAll}
                onChange={(event) => setDebugShowAll(event.target.checked)}
              />
              Debug: show all recent bookings (ignore facility filter)
            </label>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Facility filter uses admin facility id <span className="font-mono">{currentFacilityId}</span> and name{" "}
              <span className="font-mono">{currentFacilityName}</span>.
            </p>
            {debugSample && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Latest booking in DB: facility_id=<span className="font-mono">{(debugSample as any).facility_id ?? "null"}</span>{" "}
                facility_name=<span className="font-mono">{(debugSample as any).facility_name ?? "null"}</span>
              </p>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Urgency Level</label>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm"
            >
              <option value="">-- All Urgencies --</option>
              <option value="emergency">🔴 Emergency</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-card border border-border rounded-2xl p-4 overflow-auto">
        <h3 className="font-semibold text-foreground mb-4">
          Total: {filteredBookings.length} Bookings
        </h3>

        {loading ? (
          <div className="flex items-center gap-2 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No bookings match your filters</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30 border-b border-border">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Patient</th>
                  <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Contact</th>
                  <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Date & Time</th>
                  <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Symptoms</th>
                  <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Urgency</th>
                  <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{booking.full_name}</p>
                        <p className="text-xs text-muted-foreground">{booking.age}y {booking.gender || ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <a
                          href={`tel:${booking.phone}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {booking.phone}
                        </a>
                        <p className="text-xs text-muted-foreground">{booking.location}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-medium">{booking.appointment_date}</p>
                      <p className="text-muted-foreground">{booking.appointment_time}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                      {booking.symptoms}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${getUrgencyBadge(
                          booking.urgency
                        )}`}
                      >
                        {booking.urgency.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2 flex items-center">
                      <button
                        onClick={() => markAcknowledged(booking.id)}
                        disabled={acknowledgedIds.includes(booking.id)}
                        className="p-1 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50"
                        title="Mark as acknowledged"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <a
                        href={`tel:${booking.phone}`}
                        className="rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                        title="Call patient"
                      >
                        Call
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getUrgencyBadge(urgency: string): string {
  const badges: Record<string, string> = {
    emergency: 'bg-emergency/20 text-emergency',
    high: 'bg-warning/20 text-warning',
    medium: 'bg-accent/20 text-accent',
    normal: 'bg-primary/20 text-primary',
    low: 'bg-success/20 text-success',
  };
  return badges[urgency] || badges['normal'];
}
