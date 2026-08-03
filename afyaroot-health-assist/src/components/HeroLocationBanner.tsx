import React, { useState, useEffect } from 'react';
import { MapPin, Search, Filter, Stethoscope, Sparkles, Navigation, RefreshCw, ShieldCheck } from 'lucide-react';
import { reverseGeocode } from '@/services/afyaApi';

interface HeroLocationBannerProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCounty: string;
  setSelectedCounty: (c: string) => void;
  selectedKephLevel: string;
  setSelectedKephLevel: (l: string) => void;
  selectedService: string;
  setSelectedService: (s: string) => void;
  onOpenTriageModal: () => void;
  userCoords: { lat: number; lng: number } | null;
  setUserCoords: (coords: { lat: number; lng: number }) => void;
  locationDetails: { ward: string; subCounty: string; county: string } | null;
  setLocationDetails: (loc: { ward: string; subCounty: string; county: string }) => void;
  isLocating: boolean;
  setIsLocating: (l: boolean) => void;
}

export const COUNTIES = [
  'All',
  'Kakamega',
  'Nairobi',
  'Kisumu',
  'Nakuru',
  'Kiambu',
  'Mombasa',
  'Uasin Gishu',
  'Nyeri',
  'Machakos',
];

export const KEPH_LEVELS = [
  'All',
  'Level 2 (Dispensary)',
  'Level 3 (Health Centre)',
  'Level 4 (Sub-County Hospital)',
  'Level 5 (County Referral Hospital)',
  'Level 6 (National Referral Hospital)',
];

export const SERVICES = [
  'All',
  'Emergency',
  'Maternity',
  'Orthopedics',
  'Intensive Care (ICU)',
  'Pediatric Care',
  'Radiology & Imaging',
  'Surgical Services',
];

export default function HeroLocationBanner({
  searchQuery,
  setSearchQuery,
  selectedCounty,
  setSelectedCounty,
  selectedKephLevel,
  setSelectedKephLevel,
  selectedService,
  setSelectedService,
  onOpenTriageModal,
  userCoords,
  setUserCoords,
  locationDetails,
  setLocationDetails,
  isLocating,
  setIsLocating,
}: HeroLocationBannerProps) {
  const [showFilters, setShowFilters] = useState(false);

  const requestLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserCoords({ lat, lng });

          const geocoded = await reverseGeocode(lat, lng);
          setLocationDetails(geocoded);
          setIsLocating(false);
        },
        async (error) => {
          console.warn('Geolocation permission denied or timed out:', error);
          // Default fallback Kakamega / Shirere Ward
          const defaultLat = -0.2833;
          const defaultLng = 34.75;
          setUserCoords({ lat: defaultLat, lng: defaultLng });
          const geocoded = await reverseGeocode(defaultLat, defaultLng);
          setLocationDetails(geocoded);
          setIsLocating(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#08060d] p-6 md:p-10 mb-8 border border-[#00dc33]/20 shadow-2xl">
      {/* Background glow effects */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#00dc33]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#00dc33]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6 font-sans">
        {/* Top Badges Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00dc33]/10 border border-[#00dc33]/30 text-[#00dc33] text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              KMHFR Registry Integration
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#00dc33]" />
              AI Care Access
            </span>
          </div>

          {/* Auto-GPS Location Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm font-medium text-slate-200">
            <MapPin className="w-4 h-4 text-[#00dc33] animate-bounce" />
            <span>
              {isLocating ? (
                <span className="flex items-center gap-2 text-slate-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00dc33]" />
                  Detecting GPS Location...
                </span>
              ) : locationDetails ? (
                <span className="text-white font-bold">
                  📍 {locationDetails.ward}, {locationDetails.subCounty}, {locationDetails.county}
                </span>
              ) : (
                <span>Shirere Ward, Lurambi, Kakamega</span>
              )}
            </span>
            <button
              onClick={requestLocation}
              title="Refresh GPS Location"
              className="ml-2 text-slate-400 hover:text-[#00dc33] transition"
            >
              <Navigation className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hero Title & Intro */}
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight font-heading">
            Navigate Health Facilities &<br />
            <span className="text-[#00dc33]">
              Access Real-Time AI Doctor Care
            </span>
          </h1>
          <p className="mt-3 text-slate-300 text-sm md:text-base max-w-3xl leading-relaxed font-medium">
            Search verified Kenya Master Health Facility Registry (KMHFR) hospitals, view live workload queues, doctor availability, free bed capacity, and launch instant AI symptom triage.
          </p>
        </div>

        {/* Action & Search Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hospital name, code, service, or location (e.g. Kakamega County Hospital, #30386)..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#00dc33] focus:ring-1 focus:ring-[#00dc33]/30 transition shadow-inner font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-2 py-1 bg-white/10 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold border transition ${
                showFilters || selectedCounty !== 'All' || selectedKephLevel !== 'All' || selectedService !== 'All'
                  ? 'border-[#00dc33] bg-[#00dc33]/20 text-[#00dc33]'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {(selectedCounty !== 'All' || selectedKephLevel !== 'All' || selectedService !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-[#00dc33]" />
              )}
            </button>

            {/* AI Doctor Triage Launcher Button */}
            <button
              onClick={onOpenTriageModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#00dc33] hover:bg-[#00dc33]/90 text-black font-extrabold text-sm shadow-lg shadow-[#00dc33]/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Stethoscope className="w-4 h-4 stroke-[2.5]" />
              <span>Doctor Brain Triage</span>
            </button>
          </div>

          {/* Filter Dropdowns Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10 fade-slide-up">
              {/* County Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  County
                </label>
                <select
                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl glass-input text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                >
                  {COUNTIES.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* KEPH Level Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  KEPH Level
                </label>
                <select
                  value={selectedKephLevel}
                  onChange={(e) => setSelectedKephLevel(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl glass-input text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                >
                  {KEPH_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl} className="bg-slate-900 text-white">
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* Services Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Service Capability
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl glass-input text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                >
                  {SERVICES.map((s) => (
                    <option key={s} value={s} className="bg-slate-900 text-white">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
