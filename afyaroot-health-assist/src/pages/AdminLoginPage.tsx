import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { ShieldCheck, AlertCircle, Lock, MapPin } from 'lucide-react';

// Sample facilities for rural Kenya - can be expanded
const FACILITIES = [
  { id: 'kapsabet', name: '🏥 Chepterit Mission Dispensary' },
  { id: 'nandi-hills', name: '🏥 Kilibwoni Health Centre' },
  { id: 'chepterit', name: '🏥 Kapsabet County Referral' },
  { id: 'kabiyet', name: '🏥 Baraton University Hospital' },
  { id: 'mosoriot', name: '🏥 St. Judes Medical Center' },
];

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAdminAuth();
  const [selectedFacility, setSelectedFacility] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedFacility || !accessCode) {
      setError('Please select facility and enter access code');
      setLoading(false);
      return;
    }

    const facility = FACILITIES.find((f) => f.id === selectedFacility);
    if (!facility) {
      setError('Invalid facility selection');
      setLoading(false);
      return;
    }

    const success = login(selectedFacility, facility.name, accessCode);
    setLoading(false);

    if (success) {
      navigate('/admin/dashboard');
    } else {
      setError('Invalid access code for this facility');
      setAccessCode('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">AFYAROOT Admin</h1>
          <p className="mt-2 text-muted-foreground">Rural Health System Management</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-3xl shadow-xl p-6 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Facility Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Select Your Facility
              </label>
              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="">-- Choose a facility --</option>
                {FACILITIES.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PIN Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Facility Access Code
              </label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter access code"
                disabled={loading}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                🔐 Each facility can use a dedicated code. A shared admin code also works.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="rounded-xl bg-emergency/10 border border-emergency/30 p-3 flex gap-2">
                <AlertCircle className="h-5 w-5 text-emergency flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emergency font-medium">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !selectedFacility || !accessCode}
              className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Authenticating...' : 'Enter Admin Portal'}
            </button>
          </form>

          {/* Info Section */}
          <div className="rounded-xl bg-accent/10 border border-accent/30 p-4 space-y-2">
            <p className="text-xs font-semibold text-accent uppercase tracking-wide">ℹ️ About Admin Access</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              • Each facility has a unique access code  
              • A shared admin code can also be configured  
              • Sessions last 8 hours  
              • Contact district health officer for code reset
            </p>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          AFYAROOT v1.0 • Powered by rural health insights
        </p>
      </div>
    </div>
  );
}
