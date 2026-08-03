import React, { useState } from 'react';
import { X, Navigation, MapPin, ExternalLink, ShieldCheck, Compass, Layers } from 'lucide-react';

interface RouteMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: {
    name: string;
    county?: string;
    ward?: string;
    sub_county?: string;
    coordinates?: { lat: number; lng: number };
  } | null;
  userCoords?: { lat: number; lng: number } | null;
}

export default function RouteMapModal({
  isOpen,
  onClose,
  facility,
  userCoords,
}: RouteMapModalProps) {
  const [mapType, setMapType] = useState<'directions' | 'place'>('directions');

  if (!isOpen || !facility) return null;

  const hasFacilityCoords =
    typeof facility.coordinates?.lat === 'number' &&
    typeof facility.coordinates?.lng === 'number' &&
    facility.coordinates.lat !== 0;

  const hasUserCoords =
    typeof userCoords?.lat === 'number' &&
    typeof userCoords?.lng === 'number' &&
    userCoords.lat !== 0;

  // Build embedded map URL
  let embedUrl = '';
  if (hasUserCoords && hasFacilityCoords) {
    embedUrl = `https://maps.google.com/maps?saddr=${userCoords!.lat},${userCoords!.lng}&daddr=${facility.coordinates!.lat},${facility.coordinates!.lng}&output=embed`;
  } else if (hasFacilityCoords) {
    embedUrl = `https://maps.google.com/maps?q=${facility.coordinates!.lat},${facility.coordinates!.lng}&t=m&z=15&output=embed`;
  } else {
    const queryStr = encodeURIComponent(`${facility.name}, ${facility.county || 'Kenya'}`);
    embedUrl = `https://maps.google.com/maps?q=${queryStr}&t=m&z=14&output=embed`;
  }

  // External fallback URL for native Google Maps app launch
  const externalUrl = hasFacilityCoords
    ? (hasUserCoords
        ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords!.lat},${userCoords!.lng}&destination=${facility.coordinates!.lat},${facility.coordinates!.lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${facility.coordinates!.lat},${facility.coordinates!.lng}`)
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(facility.name + ', ' + (facility.county || 'Kenya'))}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md font-sans overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#08060d] text-white rounded-3xl p-5 sm:p-7 border border-[#00dc33]/30 shadow-2xl my-6 fade-slide-up overflow-hidden">
        
        {/* Header bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#00dc33]/20 text-[#00dc33] border border-[#00dc33]/30">
              <Navigation className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00dc33]">
                In-App Interactive Route Navigation
              </span>
              <h2 className="text-xl font-extrabold text-white font-heading truncate max-w-xs sm:max-w-md">
                {facility.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition border border-white/10"
              title="Open in Native Google Maps App"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>External App</span>
            </a>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Location & Coordinates summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-white/5 border border-white/10 mb-4 text-xs font-medium text-slate-300">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#00dc33] shrink-0" />
            <span>
              {facility.ward ? `${facility.ward}, ` : ''}
              {facility.sub_county ? `${facility.sub_county}, ` : ''}
              {facility.county || 'Kenya'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            {hasUserCoords && (
              <span className="px-2 py-0.5 rounded-md bg-[#00dc33]/15 text-[#00dc33] font-bold border border-[#00dc33]/30">
                GPS Location Locked
              </span>
            )}
            <span className="text-slate-400">
              {hasFacilityCoords
                ? `Coords: ${facility.coordinates!.lat.toFixed(4)}, ${facility.coordinates!.lng.toFixed(4)}`
                : 'KMHFR Verified Location'}
            </span>
          </div>
        </div>

        {/* Embedded Interactive Google Map Iframe */}
        <div className="relative w-full h-[380px] sm:h-[480px] rounded-2xl overflow-hidden border border-[#00dc33]/30 bg-black/60 shadow-inner">
          <iframe
            title={`Route map to ${facility.name}`}
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full rounded-2xl filter brightness-95 contrast-105"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/10 text-xs">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Compass className="w-4 h-4 text-[#00dc33]" />
            Pinch/scroll on map to zoom and inspect turns directly inside AfyaRoot.
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center gap-2 border border-white/15 transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Launch Google Maps App</span>
            </a>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#00dc33] hover:bg-[#00dc33]/90 text-black font-extrabold shadow-md shadow-[#00dc33]/20 transition"
            >
              Close Map
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
