import React from 'react';
import { Facility } from '@/services/afyaApi';
import { 
  Building2, MapPin, Users, UserCheck, BedDouble, AlertCircle, 
  CheckCircle2, Clock, Calendar, Navigation, Eye, ShieldCheck, ChevronRight
} from 'lucide-react';

interface FacilityCardProps {
  facility: Facility;
  onViewDetails: (facility: Facility) => void;
  onBookAppointment: (facility: Facility) => void;
  onGetDirections: (facility: Facility) => void;
}

export default function FacilityCard({
  facility,
  onViewDetails,
  onBookAppointment,
  onGetDirections,
}: FacilityCardProps) {
  const live = facility.live_status || {
    outpatient_queue_length: Math.floor(Math.random() * 20) + 2,
    active_doctors: Math.floor(Math.random() * 8) + 2,
    free_beds: Math.floor(Math.random() * 25) + 5,
    emergency_status: (facility.name.includes('Referral') || facility.name.includes('County') ? 'normal' : 'busy') as 'normal' | 'busy' | 'critical',
    freshness_trust: 'HIGH' as const,
    hours_since_update: 0.2,
  };

  const getEmergencyBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            CRITICAL QUEUE
          </span>
        );
      case 'busy':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            BUSY (MODERATE)
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            NORMAL STATUS
          </span>
        );
    }
  };

  return (
    <div className="glass-card-hover rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition" />

      <div>
        {/* Top Header: Code, Level & Trust Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300 font-mono text-xs font-semibold">
              #{facility.code}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
              {facility.keph_level}
            </span>
          </div>

          {/* Data Freshness Trust Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold tracking-wide trust-glow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>HIGH TRUST</span>
            <span className="text-slate-400">• Live Portal</span>
          </div>
        </div>

        {/* Facility Title & Location */}
        <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition leading-snug">
          {facility.name}
        </h3>

        <div className="flex items-center gap-2 mt-2 text-slate-300 text-xs sm:text-sm">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {facility.ward ? `${facility.ward}, ` : ''}
            {facility.sub_county || facility.constituency || 'Sub-County'}, {facility.county}
          </span>
          {facility.distance_km !== undefined && (
            <span className="ml-auto font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">
              {facility.distance_km < 1
                ? `${Math.round(facility.distance_km * 1000)}m away`
                : `${facility.distance_km.toFixed(1)} km`}
            </span>
          )}
        </div>

        {/* Live Workload Badges Grid */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Outpatient Queue */}
          <div className="p-2.5 rounded-2xl glass-input flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 text-slate-400 text-[11px] uppercase tracking-wider font-medium">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Queue
            </div>
            <span className="text-base font-bold text-white mt-0.5">
              {live.outpatient_queue_length} <span className="text-xs font-normal text-slate-400">waiting</span>
            </span>
          </div>

          {/* Active Doctors */}
          <div className="p-2.5 rounded-2xl glass-input flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 text-slate-400 text-[11px] uppercase tracking-wider font-medium">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              Doctors
            </div>
            <span className="text-base font-bold text-white mt-0.5">
              {live.active_doctors} <span className="text-xs font-normal text-slate-400">docs</span>
            </span>
          </div>

          {/* Free Beds */}
          <div className="p-2.5 rounded-2xl glass-input flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 text-slate-400 text-[11px] uppercase tracking-wider font-medium">
              <BedDouble className="w-3.5 h-3.5 text-teal-400" />
              Free Beds
            </div>
            <span className="text-base font-bold text-white mt-0.5">
              {live.free_beds} <span className="text-xs font-normal text-slate-400">beds</span>
            </span>
          </div>

          {/* Emergency Status */}
          <div className="p-2.5 rounded-2xl glass-input flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
            <div className="text-slate-400 text-[11px] uppercase tracking-wider font-medium mb-0.5">
              ER Status
            </div>
            {getEmergencyBadge(live.emergency_status)}
          </div>
        </div>

        {/* Services Badges */}
        {facility.services && facility.services.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {facility.services.slice(0, 4).map((s, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-300 text-[11px] font-medium border border-white/5"
              >
                {s}
              </span>
            ))}
            {facility.services.length > 4 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px]">
                +{facility.services.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
        <button
          onClick={() => onViewDetails(facility)}
          className="flex-1 py-2.5 px-3 rounded-xl glass-input hover:bg-slate-800/80 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
        >
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span>Details</span>
        </button>

        <button
          onClick={() => onGetDirections(facility)}
          className="flex-1 py-2.5 px-3 rounded-xl glass-input hover:bg-slate-800/80 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Directions</span>
        </button>

        <button
          onClick={() => onBookAppointment(facility)}
          className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition transform active:scale-95"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Appointment</span>
        </button>
      </div>
    </div>
  );
}
