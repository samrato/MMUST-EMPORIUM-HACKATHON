import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Facility, fetchFacilities } from '@/services/afyaApi';
import { ShieldCheck, AlertCircle, Lock, Building2, Globe2, RefreshCw } from 'lucide-react';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAdminAuth();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [counties, setCounties] = useState<string[]>(['All Counties']);
  const [selectedCounty, setSelectedCounty] = useState('All Counties');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingFacilities, setFetchingFacilities] = useState(true);

  // Load real facilities live from backend API on mount
  useEffect(() => {
    let isMounted = true;
    async function loadRealFacilities() {
      setFetchingFacilities(true);
      try {
        const realData = await fetchFacilities();
        if (isMounted && Array.isArray(realData) && realData.length > 0) {
          setFacilities(realData);
          // Extract unique counties dynamically
          const uniqueCounties = Array.from(
            new Set(realData.map((f) => f.county).filter(Boolean))
          ).sort();
          setCounties(['All Counties', ...uniqueCounties]);
        }
      } catch (err) {
        console.error('Error fetching real facilities for login:', err);
      } finally {
        if (isMounted) setFetchingFacilities(false);
      }
    }
    void loadRealFacilities();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Filter facilities by selected county
  const filteredFacilities = facilities.filter(
    (f) => selectedCounty === 'All Counties' || f.county === selectedCounty
  );

  const activeFacilityMeta = facilities.find((f) => f.id === selectedFacilityId || f.code?.toString() === selectedFacilityId);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedFacilityId || !accessCode) {
      setError('Please select a facility and enter your access code');
      setLoading(false);
      return;
    }

    const facility = facilities.find((f) => f.id === selectedFacilityId || f.code?.toString() === selectedFacilityId);
    const facilityName = facility ? facility.name : selectedFacilityId;

    const success = login(selectedFacilityId, facilityName, accessCode);
    setLoading(false);

    if (success) {
      navigate('/admin/dashboard');
    } else {
      setError('Invalid access code. Enter dedicated PIN or master admin key (AFYAROOT-ADMIN).');
      setAccessCode('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/5 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">AFYAROOT Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">KMHFR Real-Time County Health Operations Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">

            {/* County Filter Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-primary" />
                Filter by County Jurisdiction
              </label>
              <select
                value={selectedCounty}
                onChange={(e) => {
                  setSelectedCounty(e.target.value);
                  setSelectedFacilityId('');
                }}
                disabled={loading || fetchingFacilities}
                className="w-full px-4 py-3 bg-secondary/60 border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {counties.map((county) => (
                  <option key={county} value={county}>
                    {county === 'All Counties' ? `🇰🇪 All Counties (${facilities.length} Real Facilities)` : `🇰🇪 ${county} County`}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Real Facility Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Select Registered Facility
                </label>
                {fetchingFacilities && (
                  <span className="text-xs text-primary flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Loading KMHFR registry...
                  </span>
                )}
              </div>

              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                disabled={loading || fetchingFacilities}
                className="w-full px-4 py-3 bg-secondary/60 border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="">-- Choose Facility ({filteredFacilities.length} available) --</option>
                {filteredFacilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    🏥 {facility.name} ({facility.county} • KEPH Level {facility.keph_level || 3})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Real Metadata Preview */}
            {activeFacilityMeta && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">{activeFacilityMeta.name}</span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-primary text-primary-foreground">
                    KEPH Level {activeFacilityMeta.keph_level || 3}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  📍 {activeFacilityMeta.sub_county || activeFacilityMeta.ward || 'Main Sub-County'}, {activeFacilityMeta.county} County
                </p>
                {activeFacilityMeta.services && activeFacilityMeta.services.length > 0 && (
                  <p className="text-muted-foreground/90 text-[11px] pt-1 border-t border-primary/10">
                    🏥 Services: {activeFacilityMeta.services.slice(0, 4).join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Access Code Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Facility Access Code
              </label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter access code or AFYAROOT-ADMIN"
                disabled={loading}
                className="w-full px-4 py-3 bg-secondary/60 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 tracking-widest font-mono"
              />
              <p className="text-[11px] text-muted-foreground leading-normal">
                🔐 Enter dedicated facility PIN code or shared master key <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary">AFYAROOT-ADMIN</code>.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="rounded-xl bg-emergency/10 border border-emergency/30 p-3 flex gap-2">
                <AlertCircle className="h-5 w-5 text-emergency flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emergency font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedFacilityId || !accessCode}
              className="w-full py-3.5 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
            >
              {loading ? 'Authenticating Facility Portal...' : 'Enter Admin Portal'}
            </button>
          </form>

          {/* Info Section */}
          <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 space-y-2">
            <p className="text-xs font-bold text-accent uppercase tracking-wider">⚡ Dynamic KMHFR Integration</p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Data is pulled live from backend registry database at <code className="font-mono text-primary">/api/facilities</code>.</li>
              <li>Supports real-time facility search, county grouping, and live status scoring.</li>
              <li>Sessions persist for 8 hours with automatic renewal.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          AFYAROOT v1.0 • Connected to Kenya Master Health Facility Registry
        </p>
      </div>
    </div>
  );
}

