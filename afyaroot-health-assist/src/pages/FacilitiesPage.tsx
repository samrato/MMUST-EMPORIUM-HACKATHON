import React, { useState, useEffect } from 'react';
import { Facility, fetchFacilities } from '@/services/afyaApi';
import HeroLocationBanner from '@/components/HeroLocationBanner';
import FacilityCard from '@/components/FacilityCard';
import DoctorTriageModal from '@/components/DoctorTriageModal';
import BookingModal from '@/components/BookingModal';
import FacilityDetailModal from '@/components/FacilityDetailModal';
import { 
  Building2, MapPin, RefreshCw, Search, ShieldCheck, Stethoscope 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FacilitiesPage() {
  const { toast } = useToast();

  // GPS & Location
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDetails, setLocationDetails] = useState<{ ward: string; subCounty: string; county: string } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCounty, setSelectedCounty] = useState<string>('All');
  const [selectedKephLevel, setSelectedKephLevel] = useState<string>('All');
  const [selectedService, setSelectedService] = useState<string>('All');

  // Facilities data
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Modals
  const [isTriageModalOpen, setIsTriageModalOpen] = useState<boolean>(false);
  const [selectedFacilityForBooking, setSelectedFacilityForBooking] = useState<Facility | null>(null);
  const [selectedFacilityForDetail, setSelectedFacilityForDetail] = useState<Facility | null>(null);

  const loadFacilities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFacilities({
        lat: userCoords?.lat,
        lng: userCoords?.lng,
        search: searchQuery || undefined,
        county: selectedCounty !== 'All' ? selectedCounty : undefined,
        minKephLevel: selectedKephLevel !== 'All' ? selectedKephLevel : undefined,
        service: selectedService !== 'All' ? selectedService : undefined,
      });
      setFacilities(data);
    } catch (err: any) {
      console.error('Error fetching facilities:', err);
      setError('Could not load facilities from KMHFR registry backend on http://localhost:5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, [userCoords, searchQuery, selectedCounty, selectedKephLevel, selectedService]);

  const handleSyncKmhfr = async () => {
    setSyncing(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/facilities/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'KMHFR Sync Complete',
          description: `Synced ${data.data?.synced || 0} facilities with live registry.`,
        });
        loadFacilities();
      } else {
        toast({
          title: 'Sync Warning',
          description: data.error || 'Using local registry cache.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Sync Error',
        description: 'Failed to connect to backend on port 5000.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleGetDirections = (facility: Facility) => {
    if (facility.coordinates?.lat && facility.coordinates?.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.coordinates.lat},${facility.coordinates.lng}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.name + ' ' + facility.county)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner with Auto-GPS Location */}
      <HeroLocationBanner
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCounty={selectedCounty}
        setSelectedCounty={setSelectedCounty}
        selectedKephLevel={selectedKephLevel}
        setSelectedKephLevel={setSelectedKephLevel}
        selectedService={selectedService}
        setSelectedService={setSelectedService}
        onOpenTriageModal={() => setIsTriageModalOpen(true)}
        userCoords={userCoords}
        setUserCoords={setUserCoords}
        locationDetails={locationDetails}
        setLocationDetails={setLocationDetails}
        isLocating={isLocating}
        setIsLocating={setIsLocating}
      />

      {/* Facilities Page Header & Sync Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              Distance-Sorted List
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              {facilities.length} Facilities Found
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">KMHFR Hospital Directory</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncKmhfr}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-input hover:bg-slate-800 text-slate-200 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{syncing ? 'Syncing KMHFR...' : 'Sync Registry'}</span>
          </button>

          <button
            onClick={() => setIsTriageModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition"
          >
            <Stethoscope className="w-4 h-4 animate-pulse" />
            <span>Doctor Brain Triage</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 glass-card rounded-3xl">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold text-sm">Querying KMHFR Hospital Directory...</p>
        </div>
      ) : facilities.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-3xl">
          <Building2 className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-white font-bold text-base">No matching facilities found</p>
          <p className="text-slate-400 text-xs mt-1">Try resetting your search query or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((fac) => (
            <FacilityCard
              key={fac.id}
              facility={fac}
              onViewDetails={(facility) => setSelectedFacilityForDetail(facility)}
              onBookAppointment={(facility) => setSelectedFacilityForBooking(facility)}
              onGetDirections={handleGetDirections}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <DoctorTriageModal
        isOpen={isTriageModalOpen}
        onClose={() => setIsTriageModalOpen(false)}
        userCoords={userCoords}
        locationDetails={locationDetails}
        onBookAppointment={(facility) => setSelectedFacilityForBooking(facility)}
        onGetDirections={handleGetDirections}
      />

      <BookingModal
        isOpen={!!selectedFacilityForBooking}
        onClose={() => setSelectedFacilityForBooking(null)}
        facility={selectedFacilityForBooking}
      />

      <FacilityDetailModal
        isOpen={!!selectedFacilityForDetail}
        onClose={() => setSelectedFacilityForDetail(null)}
        facility={selectedFacilityForDetail}
        onBookAppointment={(facility) => setSelectedFacilityForBooking(facility)}
        onGetDirections={handleGetDirections}
      />
    </div>
  );
}
