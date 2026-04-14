import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, MapPin, Loader2, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import { getNearbyHospitals, NearbyFacility, calculateDistance } from '@/services/placesService';
import {
  buildEmergencyVoiceScript,
  buildFallbackEmergencyRoute,
  getEmergencyRouteInstructions,
} from '@/services/directionsService';
import type { EmergencyRouteInstructions } from '@/services/directionsService';
import { useVoice } from '@/hooks/use-voice';
import { useUser } from '@/hooks/use-user';
import { logAiInteraction } from '@/services/dataService';

interface UserCoordinates {
  lat: number;
  lng: number;
}

function rankHospitalsByDistance(source: UserCoordinates, facilities: NearbyFacility[]) {
  return facilities
    .map((facility) => ({
      ...facility,
      distance: parseFloat(calculateDistance(source.lat, source.lng, facility.location.lat, facility.location.lng).toFixed(1)),
    }))
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

async function findNearestHospital(source: UserCoordinates) {
  const data = await getNearbyHospitals(source.lat, source.lng);
  if (data.length === 0) return null;
  return rankHospitalsByDistance(source, data)[0] || null;
}

function requestBrowserLocation(timeoutMs = 7000) {
  if (!navigator.geolocation) return Promise.resolve(null as UserCoordinates | null);

  return new Promise<UserCoordinates | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (error) => {
        console.error('Emergency geolocation request failed:', error);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 1000 }
    );
  });
}

export default function EmergencyPanel() {
  const { lang } = useLanguage();
  const { patientId } = useUser();
  const { speak, stopSpeaking, isSpeaking } = useVoice();
  const [dispatched, setDispatched] = useState(false);
  const [dispatchTime, setDispatchTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<UserCoordinates | null>(null);
  const [nearestHospital, setNearestHospital] = useState<NearbyFacility | null>(null);
  const [route, setRoute] = useState<EmergencyRouteInstructions | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLoc(loc);
          try {
            const nearest = await findNearestHospital(loc);
            if (nearest) setNearestHospital(nearest);
          } catch (err) {
            console.error(err);
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error(err);
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!dispatched || !nearestHospital || !userLoc) return;

    let isCancelled = false;
    const startedAt = Date.now();
    setRouteLoading(true);
    setRouteError(null);

    getEmergencyRouteInstructions(userLoc, nearestHospital.location, lang)
      .then((result) => {
        if (isCancelled) return;
        setRoute(result);

        void logAiInteraction({
          patientId,
          messageType: "navigation",
          language: lang,
          inputText: `Emergency route request to ${nearestHospital.name}`,
          responseText: `${result.totalDistance}, ${result.totalDuration}, first step: ${result.steps[0]?.instruction || "N/A"}`,
          durationMs: Date.now() - startedAt,
        }).catch((error: unknown) => {
          console.error("Failed to store emergency route event:", error);
        });
      })
      .catch((error) => {
        if (isCancelled) return;
        const fallbackRoute = buildFallbackEmergencyRoute(userLoc, nearestHospital.location, nearestHospital.name, lang);
        setRoute(fallbackRoute);
        const fallbackMessage = error instanceof Error
          ? `${error.message} Using emergency fallback guidance.`
          : "Directions API was unavailable. Using emergency fallback guidance.";
        setRouteError(fallbackMessage);

        void logAiInteraction({
          patientId,
          messageType: "navigation",
          language: lang,
          inputText: `Emergency route request to ${nearestHospital.name}`,
          responseText: fallbackMessage,
          durationMs: Date.now() - startedAt,
        }).catch((eventError: unknown) => {
          console.error("Failed to store emergency fallback event:", eventError);
        });
      })
      .finally(() => {
        if (!isCancelled) setRouteLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [dispatched, nearestHospital, userLoc, lang, patientId]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  const handleEmergencyDispatch = async () => {
    if (dispatched) return;

    setDispatched(true);
    const nowIso = new Date().toISOString();
    setDispatchTime(nowIso);

    let resolvedLocation = userLoc;
    let resolvedHospital = nearestHospital;

    if (!resolvedLocation) {
      resolvedLocation = await requestBrowserLocation();
      if (resolvedLocation) {
        setUserLoc(resolvedLocation);
      }
    }

    if (resolvedLocation && !resolvedHospital) {
      try {
        resolvedHospital = await findNearestHospital(resolvedLocation);
        if (resolvedHospital) {
          setNearestHospital(resolvedHospital);
        }
      } catch (error: unknown) {
        console.error('Failed to resolve nearest hospital on emergency dispatch:', error);
      }
    }

    const coordinateSummary = resolvedLocation
      ? `${resolvedLocation.lat.toFixed(4)}, ${resolvedLocation.lng.toFixed(4)}`
      : "Unavailable";
    const destinationSummary = resolvedHospital
      ? `${resolvedHospital.name} (${resolvedHospital.location.lat.toFixed(4)}, ${resolvedHospital.location.lng.toFixed(4)})`
      : "Nearest facility pending";

    void logAiInteraction({
      patientId,
      messageType: "emergency_alert",
      language: lang,
        inputText: `Emergency call button pressed. Coordinates: ${coordinateSummary}.`,
        responseText: `Emergency workflow activated. Destination target: ${destinationSummary}.`,
        durationMs: 0,
      }).catch((error: unknown) => {
      console.error("Failed to store emergency alert event:", error);
    });
  };

  const handleVoiceGuidance = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    if (!route || !nearestHospital) return;

    const voiceScript = buildEmergencyVoiceScript(nearestHospital.name, route, lang);
    speak(voiceScript, lang);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full px-2">
      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">🚨 {t('emergency', lang)}</h1>

      {/* Big Emergency Button */}
      <button
        onClick={() => { void handleEmergencyDispatch(); }}
        disabled={loading}
        className={`w-full rounded-[40px] py-16 flex flex-col items-center gap-6 font-black text-3xl transition-all shadow-2xl relative overflow-hidden group active:scale-95 ${
          dispatched
            ? 'bg-emergency/10 border-4 border-emergency text-emergency'
            : 'bg-emergency text-emergency-foreground emergency-pulse'
        }`}
      >
        <AlertTriangle className={`h-24 w-24 ${dispatched ? 'text-emergency' : 'text-white'}`} />
        <div className="flex flex-col items-center">
          <span className="uppercase tracking-widest text-sm opacity-80 mb-1">Click for</span>
          {dispatched ? '🚑 HELP IS COMING' : `🚨 EMERGENCY CALL`}
        </div>
        {!dispatched && (
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]" />
        )}
      </button>

      {dispatched && (
        <div className="fade-slide-up space-y-6 animate-in slide-in-from-bottom-6 duration-500">
          {/* Emergency Status */}
          <div className="bg-emergency/20 border-2 border-emergency rounded-3xl p-6 text-center shadow-lg ring-1 ring-emergency/50">
            <p className="text-xl font-black text-emergency uppercase tracking-wider">Help Request Sent</p>
            <p className="text-xs font-bold text-emergency/80 mt-2">
              Stay reachable. Follow the voice/text guidance below while calling emergency lines.
            </p>
            {dispatchTime && (
              <p className="text-[10px] font-black uppercase tracking-widest text-emergency/70 mt-3">
                Logged at {new Date(dispatchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {/* Nearest Hospital Card */}
          {loading ? (
            <div className="bg-card border border-border rounded-3xl p-8 flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Locating nearest ER...</p>
            </div>
          ) : nearestHospital && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5 shadow-xl ring-1 ring-black/5 animate-in zoom-in-95">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-emergency uppercase tracking-widest mb-1">Emergency Facility Ready</p>
                  <h3 className="font-black text-xl text-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-emergency" />
                    {nearestHospital.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">{nearestHospital.address}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emergency">{nearestHospital.distance} km</span>
                  <p className="text-[10px] font-bold text-muted-foreground">DIRECT DISTANCE</p>
                </div>
              </div>

              <div className="flex gap-3">
                <a 
                  href={`tel:${nearestHospital.id}`} // Using ID as placeholder if phone isn't available
                  className="flex-[2] bg-emergency text-white rounded-2xl py-5 flex items-center justify-center gap-3 font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  <Phone className="h-5 w-5" /> CALL HOSPITAL
                </a>
                <button
                  onClick={handleVoiceGuidance}
                  disabled={!route || routeLoading}
                  className="flex-1 bg-secondary text-secondary-foreground rounded-2xl py-5 flex items-center justify-center gap-3 font-black text-sm border border-border/50 hover:bg-secondary/80 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  {isSpeaking ? 'STOP' : 'VOICE'}
                </button>
              </div>

              <div className="bg-secondary/40 border border-border rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Emergency Voice + Text Directions</p>

                {routeLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Preparing route guidance...</p>
                  </div>
                ) : route ? (
                  <>
                    <p className="text-xs font-bold text-foreground">
                      {route.startAddress} → {route.endAddress}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {route.totalDistance} • {route.totalDuration}
                    </p>
                    <ol className="space-y-2">
                      {route.steps.slice(0, 6).map((step, index) => (
                        <li key={`${index}-${step.instruction}`} className="text-xs text-foreground/85 flex gap-2">
                          <span className="font-black text-primary">{index + 1}.</span>
                          <div>
                            <p>{step.instruction}</p>
                            {(step.distance || step.duration) && (
                              <p className="text-[10px] text-muted-foreground">{[step.distance, step.duration].filter(Boolean).join(' • ')}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Route guidance is not available yet.</p>
                )}

                {routeError && (
                  <p className="text-[11px] text-warning font-bold">{routeError}</p>
                )}
              </div>
            </div>
          )}

          {/* Emergency Backup */}
          <div className="grid grid-cols-2 gap-3">
            <a href="tel:999" className="bg-foreground text-background rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest shadow-lg">
              <Phone className="h-5 w-5" /> 999
            </a>
            <a href="tel:911" className="bg-foreground text-background rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest shadow-lg">
              <Phone className="h-5 w-5" /> 911
            </a>
          </div>

          {/* Immediate Actions */}
          <div className="bg-warning/10 border-2 border-warning/30 rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-sm uppercase tracking-widest mb-4 text-warning flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> WHILE YOU WAIT:
            </h3>
            <ul className="space-y-4">
              {[
                "Stay calm and keep the patient still",
                "Clear the airway if patient is unconscious",
                "Apply direct pressure to any active bleeding",
                "Do NOT move the patient if spinal injury is suspected"
              ].map((text, i) => (
                <li key={i} className="text-xs font-bold text-foreground/80 flex items-start gap-3">
                  <span className="mt-1 w-2 h-2 rounded-full bg-warning flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
