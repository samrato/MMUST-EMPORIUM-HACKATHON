import React, { useState, useEffect } from 'react';
import { 
  X, Navigation, MapPin, ExternalLink, ShieldCheck, Compass, 
  Volume2, VolumeX, Clock, Route, CheckCircle2, Locate, Radio
} from 'lucide-react';
import { buildFallbackEmergencyRoute, buildEmergencyVoiceScript } from '@/services/directionsService';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { lang } = useLanguage();
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'steps'>('map');
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(userCoords || null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  useEffect(() => {
    if (userCoords) {
      setLiveCoords(userCoords);
    } else if ('geolocation' in navigator && isOpen) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLiveCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        (err) => {
          console.warn('Live GPS lookup fallback:', err);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [userCoords, isOpen]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  if (!isOpen || !facility) return null;

  const hasFacilityCoords =
    typeof facility.coordinates?.lat === 'number' &&
    typeof facility.coordinates?.lng === 'number' &&
    facility.coordinates.lat !== 0;

  const hasLiveCoords =
    typeof liveCoords?.lat === 'number' &&
    typeof liveCoords?.lng === 'number' &&
    liveCoords.lat !== 0;

  // Origin coordinates (User's Current Location)
  const originCoords = hasLiveCoords
    ? liveCoords!
    : { lat: 0.3012066, lng: 34.7535487 }; // Default Kakamega coordinates

  // Destination coordinates (Hospital Location)
  const destCoords = hasFacilityCoords
    ? facility.coordinates!
    : { lat: 0.2829523, lng: 34.7548635 };

  // Compute step-by-step turn-by-turn route instructions
  const routeInstructions = buildFallbackEmergencyRoute(
    originCoords,
    destCoords,
    facility.name,
    lang
  );

  // Embedded Google Maps Directions URL connecting Origin -> Destination
  let embedUrl = `https://maps.google.com/maps?saddr=${originCoords.lat},${originCoords.lng}&daddr=${destCoords.lat},${destCoords.lng}&output=embed`;

  // External fallback URL for native Google Maps app
  const externalUrl = `https://www.google.com/maps/dir/?api=1&origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}`;

  const handleToggleVoice = () => {
    if (!('speechSynthesis' in window)) {
      alert('Voice synthesis not supported in browser.');
      return;
    }

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
    } else {
      const scriptText = buildEmergencyVoiceScript(facility.name, routeInstructions, lang);
      const utterance = new SpeechSynthesisUtterance(scriptText);
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlayingVoice(false);
      utterance.onerror = () => setIsPlayingVoice(false);
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setIsPlayingVoice(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md font-sans overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#08060d] text-white rounded-3xl p-5 sm:p-7 border border-[#00dc33]/30 shadow-2xl my-6 fade-slide-up overflow-hidden">
        
        {/* Header bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#00dc33]/20 text-[#00dc33] border border-[#00dc33]/30">
              <Navigation className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00dc33] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Live Route & Location Directions
              </span>
              <h2 className="text-xl font-extrabold text-white font-heading truncate max-w-xs sm:max-w-md">
                {facility.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleVoice}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition border ${
                isPlayingVoice
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                  : 'bg-[#00dc33]/15 text-[#00dc33] border-[#00dc33]/30 hover:bg-[#00dc33]/25'
              }`}
              title="Voice Route Assistant"
            >
              {isPlayingVoice ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isPlayingVoice ? 'Stop Voice' : 'Voice Guide'}</span>
            </button>

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

        {/* Live Location: Origin ("You Are Here") to Destination ("Hospital") Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/5 border border-[#00dc33]/25 mb-4 text-xs">
          
          {/* Origin: You Are Here */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/50 border border-emerald-500/30">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-4 h-4 rounded-full bg-[#00dc33]/40 animate-ping" />
              <Locate className="w-5 h-5 text-[#00dc33] relative z-10" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-[#00dc33] tracking-wider block">
                Start: You Are Here (Current GPS)
              </span>
              <p className="font-bold text-white text-xs mt-0.5 truncate">
                {isLocating ? 'Detecting your GPS position...' : `${originCoords.lat.toFixed(4)}, ${originCoords.lng.toFixed(4)}`}
              </p>
            </div>
          </div>

          {/* Destination: Hospital */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/50 border border-white/10">
            <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider block">
                End: Target Destination
              </span>
              <p className="font-bold text-white text-xs mt-0.5 truncate">
                {facility.name} ({facility.county || 'Kenya'})
              </p>
            </div>
          </div>

        </div>

        {/* Route Metrics Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 text-xs">
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Est. Distance</span>
            <span className="font-extrabold text-[#00dc33] text-sm mt-0.5 block">{routeInstructions.totalDistance}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Est. Duration</span>
            <span className="font-extrabold text-white text-sm mt-0.5 block">{routeInstructions.totalDuration}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Navigation Mode</span>
            <span className="font-extrabold text-white text-xs mt-0.5 block">Driving / Transit</span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">GPS Accuracy</span>
            <span className="font-extrabold text-[#00dc33] text-xs mt-0.5 block">
              {hasLiveCoords ? 'HIGH (Locked)' : 'Approximate'}
            </span>
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex items-center gap-2 mb-3 lg:hidden">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-2 rounded-xl font-extrabold text-xs transition border ${
              activeTab === 'map'
                ? 'bg-[#00dc33] text-black border-[#00dc33]'
                : 'bg-white/5 text-slate-300 border-white/10'
            }`}
          >
            Interactive Map & Route
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`flex-1 py-2 rounded-xl font-extrabold text-xs transition border ${
              activeTab === 'steps'
                ? 'bg-[#00dc33] text-black border-[#00dc33]'
                : 'bg-white/5 text-slate-300 border-white/10'
            }`}
          >
            Turn-by-Turn Steps ({routeInstructions.steps.length})
          </button>
        </div>

        {/* Main Content Area: Interactive Route Map + Turn-by-Turn Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[420px] sm:h-[480px]">
          
          {/* Left Column: Interactive Map Frame displaying Origin -> Destination route */}
          <div className={`lg:col-span-7 h-full ${activeTab === 'steps' ? 'hidden lg:block' : 'block'}`}>
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-[#00dc33]/30 bg-black/60 shadow-inner">
              <iframe
                title={`Route map from current location to ${facility.name}`}
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
          </div>

          {/* Right Column: Step-by-Step Directions */}
          <div className={`lg:col-span-5 h-full ${activeTab === 'map' ? 'hidden lg:block' : 'block'}`}>
            <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00dc33] flex items-center gap-1.5 font-heading">
                    <Compass className="w-4 h-4" />
                    Turn-By-Turn Route Steps
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {routeInstructions.steps.length} Steps
                  </span>
                </div>

                <div className="space-y-3 pr-1">
                  {/* Step 0: You Are Here */}
                  <div className="p-3 rounded-xl bg-[#00dc33]/15 border border-[#00dc33]/30 flex items-center gap-3">
                    <Locate className="w-5 h-5 text-[#00dc33] shrink-0" />
                    <div>
                      <h4 className="text-xs font-extrabold text-white">Start: You Are Here</h4>
                      <p className="text-[11px] text-slate-300 font-medium truncate">
                        GPS Location ({originCoords.lat.toFixed(4)}, {originCoords.lng.toFixed(4)})
                      </p>
                    </div>
                  </div>

                  {/* Route Steps */}
                  {routeInstructions.steps.map((step, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start gap-3 hover:border-[#00dc33]/40 transition"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#00dc33]/20 text-[#00dc33] border border-[#00dc33]/30 flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-200 font-medium leading-relaxed">
                          {step.instruction}
                        </p>
                        {(step.distance || step.duration) && (
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-[#00dc33]">
                            {step.distance && <span>{step.distance}</span>}
                            {step.distance && step.duration && <span>•</span>}
                            {step.duration && <span>{step.duration}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Final Destination Arrival */}
                  <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-extrabold text-white">Arrive at Hospital</h4>
                      <p className="text-[11px] text-slate-300 font-medium truncate max-w-[200px]">
                        {facility.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/10 text-xs">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Compass className="w-4 h-4 text-[#00dc33]" />
            Active GPS route path drawn live from your location.
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
              Close Navigation
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
