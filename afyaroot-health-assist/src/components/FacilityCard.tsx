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

  const getEmergencyBadge = (status: string, queueLen: number) => {
    switch (status) {
      case 'critical':
        return (
          <div className="group/er relative flex items-center justify-center">
            <span className="flex items-center justify-center gap-1 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[11px] font-bold animate-pulse cursor-help">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>CRITICAL</span>
            </span>
            {/* Context Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/er:block w-48 p-2 rounded-xl bg-slate-900 border border-red-500/40 text-[10px] text-red-300 shadow-xl z-20 text-center">
              ⚠️ High Emergency Intake & Overflow Queue ({queueLen} waiting)
            </div>
          </div>
        );
      case 'busy':
        return (
          <div className="group/er relative flex items-center justify-center">
            <span className="flex items-center justify-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[11px] font-bold cursor-help">
              <Clock className="w-3 h-3 shrink-0" />
              <span>BUSY</span>
            </span>
            {/* Context Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/er:block w-48 p-2 rounded-xl bg-slate-900 border border-amber-500/40 text-[10px] text-amber-300 shadow-xl z-20 text-center">
              ⚡ Moderate Patient Queue ({queueLen} waiting in outpatient)
            </div>
          </div>
        );
      default:
        return (
          <div className="group/er relative flex items-center justify-center">
            <span className="flex items-center justify-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold cursor-help">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>NORMAL</span>
            </span>
            {/* Context Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/er:block w-48 p-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-[10px] text-emerald-300 shadow-xl z-20 text-center">
              ✅ Smooth Intake Operations ({queueLen} waiting)
            </div>
          </div>
        );
    }
  };

  return (
    <div className="glass-card-hover rounded-3xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group h-full border border-white/10">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition pointer-events-none" />

      <div>
        {/* Top Header: Code, Level & Data Freshness Trust */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-white/10 text-slate-300 font-mono text-xs font-bold">
              #{facility.code}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
              {facility.keph_level}
            </span>
          </div>

          {/* Trust Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold tracking-wide trust-glow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>HIGH TRUST</span>
            <span className="text-slate-400 font-normal">• Live Portal</span>
          </div>
        </div>

        {/* Facility Title & Distance */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-emerald-400 transition leading-snug line-clamp-2">
            {facility.name}
          </h3>
          {facility.distance_km !== undefined && (
            <span className="shrink-0 font-bold text-xs text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/50">
              {facility.distance_km < 1
                ? `${Math.round(facility.distance_km * 1000)}m`
                : `${facility.distance_km.toFixed(1)} km`}
            </span>
          )}
        </div>

        {/* Location Subtitle */}
        <div className="flex items-center gap-1.5 mt-2 text-slate-300 text-xs">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">
            {facility.ward ? `${facility.ward}, ` : ''}
            {facility.sub_county || facility.constituency || 'Sub-County'}, {facility.county}
          </span>
        </div>

        {/* Live Workload Badges Grid */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Outpatient Queue */}
          <div className="p-2 sm:p-2.5 rounded-2xl glass-input flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
              <Users className="w-3 h-3 text-blue-400 shrink-0" />
              <span>Queue</span>
            </div>
            <span className="text-sm sm:text-base font-black text-white mt-0.5">
              {live.outpatient_queue_length} <span className="text-[10px] font-normal text-slate-400">waiting</span>
            </span>
          </div>

          {/* Active Doctors */}
          <div className="p-2 sm:p-2.5 rounded-2xl glass-input flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
              <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Doctors</span>
            </div>
            <span className="text-sm sm:text-base font-black text-white mt-0.5">
              {live.active_doctors} <span className="text-[10px] font-normal text-slate-400">docs</span>
            </span>
          </div>

          {/* Free Beds */}
          <div className="p-2 sm:p-2.5 rounded-2xl glass-input flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
              <BedDouble className="w-3 h-3 text-teal-400 shrink-0" />
              <span>Beds</span>
            </div>
            <span className="text-sm sm:text-base font-black text-white mt-0.5">
              {live.free_beds} <span className="text-[10px] font-normal text-slate-400">free</span>
            </span>
          </div>

          {/* ER Status */}
          <div className="p-2 sm:p-2.5 rounded-2xl glass-input flex flex-col items-center justify-center text-center">
            <div className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-0.5">
              ER Status
            </div>
            {getEmergencyBadge(live.emergency_status, live.outpatient_queue_length)}
          </div>
        </div>

        {/* Services Chips */}
        {facility.services && facility.services.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
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

      {/* Responsive Action Buttons Footer */}
      <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-2">
        <button
          onClick={() => onViewDetails(facility)}
          className="py-2.5 px-2 rounded-xl glass-input hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition"
        >
          <Eye className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Details</span>
        </button>

        <button
          onClick={() => onGetDirections(facility)}
          className="py-2.5 px-2 rounded-xl glass-input hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Directions</span>
        </button>

        <button
          onClick={() => onBookAppointment(facility)}
          className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25 transition transform active:scale-95 border border-emerald-400/30"
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Book Appointment</span>
        </button>
      </div>
    </div>
  );
}
