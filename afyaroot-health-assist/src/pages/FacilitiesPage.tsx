import { useState, useEffect } from 'react';
import { MapPin, Phone, Navigation, Star, Loader2, Search, Volume2, AlertTriangle, Mic, MicOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import { getNearbyHospitals, NearbyFacility, calculateDistance } from '@/services/placesService';
import { useVoice } from '@/hooks/use-voice';
import { getVoiceDirections } from '@/services/geminiService';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { logAiInteraction } from '@/services/dataService';

export default function FacilitiesPage() {
  const { lang } = useLanguage();
  const { patientId } = useUser();
  const { isListening, startListening, stopListening, speak } = useVoice();
  const { toast } = useToast();
  const [facilities, setFacilities] = useState<NearbyFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [navLoading, setNavLoading] = useState<string | null>(null);
  const [activeDirections, setActiveDirections] = useState<{ [key: string]: string }>({});

  const [error, setError] = useState<string | null>(null);

  const getLocationAndHospitals = () => {
    setLoading(true);
    setError(null);
    if (navigator.geolocation) {
      // Try to get cached position first for speed
      navigator.geolocation.getCurrentPosition(
        (pos) => processLocation(pos),
        () => {
          // Fallback to a fresh request if cache fails
          navigator.geolocation.getCurrentPosition(
            (pos) => processLocation(pos),
            (err) => {
              setError("Location access denied. Please enable GPS to find nearest facilities.");
              setLoading(false);
            },
            { timeout: 5000, enableHighAccuracy: false }
          );
        },
        { timeout: 2000, maximumAge: 600000 } // 10 minutes cache
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  };

  const processLocation = async (pos: GeolocationPosition) => {
    const startedAt = Date.now();
    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setUserLoc(loc);
    try {
      const data = await getNearbyHospitals(loc.lat, loc.lng);
      const withDistance = data.map(f => ({
        ...f,
        distance: parseFloat(calculateDistance(loc.lat, loc.lng, f.location.lat, f.location.lng).toFixed(1))
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      setFacilities(withDistance);
      
      // Automatic summary for voice accessibility
      if (withDistance.length > 0) {
        const nearest = withDistance[0];
        const summary = lang === 'sw' 
          ? `Nimepata hospitali ${withDistance.length} karibu nawe. Hospitali ya karibu zaidi ni ${nearest.name}, kilomita ${nearest.distance} kutoka hapa.`
          : `I found ${withDistance.length} hospitals nearby. The closest is ${nearest.name}, which is ${nearest.distance} kilometers away.`;
        speak(summary, lang);
      }

      void logAiInteraction({
        patientId,
        messageType: "facility_lookup",
        language: lang,
        inputText: `Facility lookup at ${loc.lat}, ${loc.lng}`,
        responseText: `Found ${withDistance.length} nearby facilities.`,
        durationMs: Date.now() - startedAt,
      }).catch((error: unknown) => {
        console.error("Failed to store facility lookup event:", error);
      });
    } catch (err) {
      setError("Could not fetch hospitals. Please check your internet.");
      void logAiInteraction({
        patientId,
        messageType: "facility_lookup",
        language: lang,
        inputText: `Facility lookup at ${loc.lat}, ${loc.lng}`,
        responseText: "Facility lookup failed.",
        durationMs: Date.now() - startedAt,
      }).catch((error: unknown) => {
        console.error("Failed to store failed facility lookup event:", error);
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocationAndHospitals();
  }, []);

  const handleVoiceDirections = async (facility: NearbyFacility) => {
    if (!userLoc) return;

    const startedAt = Date.now();
    setNavLoading(facility.id);
    try {
      const directions = await getVoiceDirections(userLoc, facility, lang);
      setActiveDirections(prev => ({ ...prev, [facility.id]: directions }));
      speak(directions, lang);
      toast({
        title: "AI Voice Navigation",
        description: "Giving you directions to " + facility.name,
      });

      void logAiInteraction({
        patientId,
        messageType: "navigation",
        language: lang,
        inputText: `Voice directions requested for ${facility.name}.`,
        responseText: directions,
        durationMs: Date.now() - startedAt,
      }).catch((error: unknown) => {
        console.error("Failed to store navigation event:", error);
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to get AI directions.",
        variant: "destructive",
      });

      void logAiInteraction({
        patientId,
        messageType: "navigation",
        language: lang,
        inputText: `Voice directions requested for ${facility.name}.`,
        responseText: "Navigation request failed.",
        durationMs: Date.now() - startedAt,
      }).catch((error: unknown) => {
        console.error("Failed to store navigation failure event:", error);
      });
    } finally {
      setNavLoading(null);
    }
  };

  const handleVoiceCommand = () => {
    if (isListening) {
      stopListening();
      return;
    }

    startListening(async (text) => {
      const lowerText = text.toLowerCase();
      // Look for facility names in the voice input
      const matchedFacility = facilities.find(f => 
        lowerText.includes(f.name.toLowerCase()) || 
        (f.name.toLowerCase().split(' ')[0] !== '' && lowerText.includes(f.name.toLowerCase().split(' ')[0]))
      );

      if (matchedFacility) {
        handleVoiceDirections(matchedFacility);
      } else if (lowerText.includes('nearest') || lowerText.includes('closest') || lowerText.includes('karibu')) {
        if (facilities.length > 0) handleVoiceDirections(facilities[0]);
      } else {
        toast({
          title: "Voice Command",
          description: `I heard: "${text}", but couldn't find a matching hospital.`,
        });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full px-2 pb-20 relative">
      <div className="flex items-center justify-between bg-background/80 backdrop-blur-sm py-2 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">📍 {t('nearestFacilities', lang)}</h1>
        {userLoc && !error && (
          <div className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">
            GPS Active
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <MapPin className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-sm text-muted-foreground font-bold animate-pulse uppercase tracking-widest">Detecting Your Location...</p>
        </div>
      ) : error ? (
        <div className="bg-card border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-4">
          <div className="bg-emergency/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-emergency" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{error}</p>
          <button 
            onClick={getLocationAndHospitals}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {facilities.length === 0 && (
            <div className="text-center py-10 bg-card border border-border rounded-2xl">
              <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No facilities found nearby. Try increasing your search area.</p>
            </div>
          )}
          
          {facilities.map(f => (
            <div key={f.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-extrabold text-foreground text-base leading-tight">{f.name}</h3>
                    {f.open_now && (
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" title="Open Now" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {f.address}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-primary block">{f.distance} km</span>
                  <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-warning mt-1">
                    <Star className="h-3 w-3 fill-current" />
                    {f.rating || 'N/A'} ({f.user_ratings_total || 0})
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-border/50 mt-4">
                {activeDirections[f.id] && (
                  <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 mb-2 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] font-black text-primary uppercase mb-1 flex items-center gap-1">
                      <Navigation className="h-3 w-3" /> AI Route Description:
                    </p>
                    <p className="text-[11px] font-medium leading-relaxed italic text-foreground/80">"{activeDirections[f.id]}"</p>
                  </div>
                )}
                <button 
                  onClick={() => handleVoiceDirections(f)}
                  disabled={navLoading === f.id}
                  className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {navLoading === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                  AI Voice Directions
                </button>
                <div className="flex gap-2 w-full">
                  <button className="flex-1 bg-secondary text-secondary-foreground rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-2 hover:bg-secondary/80 transition-all shadow-sm active:scale-95">
                    <MapPin className="h-4 w-4" /> View Details
                  </button>
                  <button className="bg-secondary/50 text-secondary-foreground rounded-xl px-5 py-3 hover:bg-secondary/80 transition-all">
                    <Phone className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Voice Command Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <button 
          onClick={handleVoiceCommand}
          className={`h-16 w-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isListening ? 'bg-emergency animate-pulse' : 'bg-primary'}`}
        >
          {isListening ? <MicOff className="h-8 w-8 text-white" /> : <Mic className="h-8 w-8 text-white" />}
          {isListening && (
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emergency text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter whitespace-nowrap">
              Listening...
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
