import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getFacilityProfile, updateFacilityProfile } from '@/services/adminService';
import { Settings, MapPin, Phone, Mail, Save, AlertTriangle } from 'lucide-react';

export default function AdminSettingsPage() {
  const { isAuthenticated, currentFacilityId, currentFacilityName } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: 50,
    operating_hours: '08:00-17:00',
    phone: '',
    email: '',
    services: [] as string[],
  });

  useEffect(() => {
    if (!currentFacilityId) return;

    const loadFacility = async () => {
      setLoading(true);
      try {
        const facility = await getFacilityProfile(currentFacilityId);
        if (facility) {
          setFormData({
            name: facility.name,
            location: facility.location,
            capacity: facility.capacity,
            operating_hours: facility.operating_hours,
            phone: facility.phone,
            email: facility.email,
            services: facility.services,
          });
        }
      } catch (err) {
        console.error('Failed to load facility:', err);
      } finally {
        setLoading(false);
      }
    };

    void loadFacility();
  }, [currentFacilityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFacilityId) return;

    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await updateFacilityProfile(currentFacilityId, formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save changes';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return <p className="text-muted-foreground">Please log in first.</p>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Facility Settings
        </h1>
        <p className="text-muted-foreground mt-1">{currentFacilityName}</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl bg-emergency/10 border border-emergency/30 p-4 flex gap-2">
          <AlertTriangle className="h-5 w-5 text-emergency flex-shrink-0" />
          <p className="text-sm text-emergency">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-success/10 border border-success/30 p-4">
          <p className="text-sm text-success font-medium">✓ Changes saved successfully</p>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-6">
        {/* Facility Name */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">Facility Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={loading}
            className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-foreground disabled:opacity-50"
            placeholder="Health Center Name"
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            disabled={loading}
            className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-foreground disabled:opacity-50"
            placeholder="District, County"
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={loading}
              className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-foreground disabled:opacity-50"
              placeholder="+254..."
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
              className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-foreground disabled:opacity-50"
              placeholder="health@center.org"
            />
          </div>
        </div>

        {/* Capacity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-foreground block mb-2">Daily Capacity</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              disabled={loading}
              min="1"
              className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-foreground disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground mt-1">Patients per day</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-2">Operating Hours</label>
            <input
              type="text"
              value={formData.operating_hours}
              onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
              disabled={loading}
              placeholder="08:00-17:00"
              className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-foreground disabled:opacity-50"
            />
          </div>
        </div>

        {/* Services */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-3">Services Available</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { id: 'emergency', label: '🚨 Emergency' },
              { id: 'maternity', label: '👶 Maternity' },
              { id: 'surgery', label: '🏥 Surgery' },
              { id: 'icu', label: '🛏️ ICU' },
              { id: 'mental', label: '🧠 Mental Health' },
              { id: 'pediatric', label: '👨‍👧‍👦 Pediatric' },
            ].map(({ id, label }) => (
              <label key={id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.services.includes(id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        services: [...formData.services, id],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        services: formData.services.filter((s) => s !== id),
                      });
                    }
                  }}
                  disabled={loading}
                  className="rounded"
                />
                <span className="text-sm text-foreground">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Info Card */}
      <div className="rounded-xl bg-accent/10 border border-accent/30 p-4">
        <p className="text-xs font-semibold text-accent uppercase tracking-wide">ℹ️ Note</p>
        <p className="text-xs text-muted-foreground mt-1">
          These settings affect how your facility appears in the app and help admins manage capacity
          and resources effectively.
        </p>
      </div>
    </div>
  );
}
