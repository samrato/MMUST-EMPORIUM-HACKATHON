import React, { useState, useEffect } from 'react';
import { 
  Facility, fetchFacilities 
} from '@/services/afyaApi';
import HeroLocationBanner from '@/components/HeroLocationBanner';
import FacilityCard from '@/components/FacilityCard';
import ChuDashboard from '@/components/ChuDashboard';
import DoctorTriageModal from '@/components/DoctorTriageModal';
import BookingModal from '@/components/BookingModal';
import FacilityDetailModal from '@/components/FacilityDetailModal';
import { 
  Building2, Users, Stethoscope, Sparkles, RefreshCw, AlertCircle, 
  Search, ShieldCheck, MapPin, Activity, HeartPulse 
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'facilities' | 'chu'>('facilities');

  // GPS & Location state
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDetails, setLocationDetails] = useState<{ ward: string; subCounty: string; county: string } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCounty, setSelectedCounty] = useState<string>('All');
  const [selectedKephLevel, setSelectedKephLevel] = useState<string>('All');
  const [selectedService, setSelectedService] = useState<string>('All');

  // Facilities data state
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState<boolean>(true);
  const [facilitiesError, setFacilitiesError] = useState<string | null>(null);

  // Modals state
  const [isTriageModalOpen, setIsTriageModalOpen] = useState<boolean>(false);
  const [selectedFacilityForBooking, setSelectedFacilityForBooking] = useState<Facility | null>(null);
  const [selectedFacilityForDetail, setSelectedFacilityForDetail] = useState<Facility | null>(null);

  // Load facilities from backend API (http://localhost:5000/api/facilities)
  const loadFacilities = async () => {
    setLoadingFacilities(true);
    setFacilitiesError(null);
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
      setFacilitiesError('Could not load facilities from backend API on http://localhost:5000.');
    } finally {
      setLoadingFacilities(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, [userCoords, searchQuery, selectedCounty, selectedKephLevel, selectedService]);

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
      {/* Auto-GPS Location Hero Banner */}
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

      {/* Primary Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-card border border-white/10">
          <button
            onClick={() => setActiveTab('facilities')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'facilities'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Facilities & Reality Cards</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-900/60 text-[10px] font-mono text-emerald-300">
              {facilities.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('chu')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'chu'
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>CHU Dashboard</span>
          </button>
        </div>

        {/* Quick Triage Trigger */}
        <button
          onClick={() => setIsTriageModalOpen(true)}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-card hover:border-emerald-500/40 text-emerald-300 text-xs font-semibold transition"
        >
          <Stethoscope className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Launch AI Symptom Checker</span>
        </button>
      </div>

      {/* Tab 1: Facilities & Hospital Reality Cards */}
      {activeTab === 'facilities' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>Verified Facilities</span>
                <span className="text-xs text-slate-400 font-normal">
                  (Sorted closest first by distance)
                </span>
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Real-time queue lengths, active doctor count, bed capacity, and data trust level.
              </p>
            </div>

            <button
              onClick={loadFacilities}
              className="p-2.5 rounded-xl glass-input hover:bg-slate-800 text-slate-300 transition"
              title="Refresh facility list"
            >
              <RefreshCw className={`w-4 h-4 ${loadingFacilities ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

          {facilitiesError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {facilitiesError}
            </div>
          )}

          {loadingFacilities ? (
            <div className="text-center py-16 glass-card rounded-3xl">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold text-sm">Querying KMHFR Hospital Registry...</p>
              <p className="text-slate-500 text-xs mt-1">Connecting to backend at http://localhost:5000</p>
            </div>
          ) : facilities.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl">
              <Building2 className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-white font-bold text-base">No matching facilities found</p>
              <p className="text-slate-400 text-xs mt-1">
                Try clearing your search query or adjusting county / level / service filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCounty('All');
                  setSelectedKephLevel('All');
                  setSelectedService('All');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold"
              >
                Reset All Filters
              </button>
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
        </div>
      )}

      {/* Tab 2: Community Health Units (CHU) Dashboard */}
      {activeTab === 'chu' && (
        <ChuDashboard userCoords={userCoords} locationDetails={locationDetails} />
      )}

      {/* AI Doctor Triage & Routing Modal */}
      <DoctorTriageModal
        isOpen={isTriageModalOpen}
        onClose={() => setIsTriageModalOpen(false)}
        userCoords={userCoords}
        locationDetails={locationDetails}
        onBookAppointment={(facility) => setSelectedFacilityForBooking(facility)}
        onGetDirections={handleGetDirections}
      />

      {/* Patient Appointment Booking Modal */}
      <BookingModal
        isOpen={!!selectedFacilityForBooking}
        onClose={() => setSelectedFacilityForBooking(null)}
        facility={selectedFacilityForBooking}
      />

      {/* Facility Detail Modal */}
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
