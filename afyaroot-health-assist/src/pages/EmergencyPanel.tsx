import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, MapPin, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import { getRecommendedFacility } from '@/services/facilityData';

export default function EmergencyPanel() {
  const { lang } = useLanguage();
  const [countdown, setCountdown] = useState(30);
  const [dispatched, setDispatched] = useState(false);
  const facility = getRecommendedFacility('emergency');

  useEffect(() => {
    if (dispatched && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [dispatched, countdown]);

  return (
    <div className="space-y-5">
      {/* Big Emergency Button */}
      <button
        onClick={() => setDispatched(true)}
        className={`w-full rounded-3xl py-10 flex flex-col items-center gap-4 font-bold text-2xl transition-all ${
          dispatched
            ? 'bg-emergency/20 border-4 border-emergency text-emergency'
            : 'bg-emergency text-emergency-foreground emergency-pulse'
        }`}
      >
        <AlertTriangle className="h-16 w-16" />
        {dispatched ? '🚑 Help is on the way' : `🚨 ${t('callEmergency', lang)}`}
      </button>

      {dispatched && (
        <div className="fade-slide-up space-y-4">
          {/* Countdown */}
          <div className="bg-emergency/10 border-2 border-emergency rounded-2xl p-6 text-center">
            <Clock className="h-8 w-8 mx-auto text-emergency mb-2" />
            <p className="text-4xl font-bold text-emergency">{countdown > 0 ? `${countdown}s` : 'Arrived'}</p>
            <p className="text-sm text-muted-foreground mt-1">Estimated response time</p>
          </div>

          {/* Nearest Hospital */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emergency" />
              {facility.name}
            </h3>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{facility.distance} km away</span>
              <span>{facility.beds - Math.round(facility.beds * facility.occupancy / 100)} beds available</span>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${facility.phone}`} className="flex-1 bg-emergency text-emergency-foreground rounded-xl py-3 flex items-center justify-center gap-2 font-semibold">
                <Phone className="h-4 w-4" /> Call Hospital
              </a>
              <a href="tel:999" className="bg-foreground text-background rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-semibold">
                <Phone className="h-4 w-4" /> 999
              </a>
            </div>
          </div>

          {/* Emergency Instructions */}
          <div className="bg-warning/10 border border-warning rounded-2xl p-4">
            <h3 className="font-bold text-foreground mb-2">⚠️ While waiting:</h3>
            <ul className="space-y-1 text-sm text-foreground/80">
              <li>• Stay calm and keep the patient still</li>
              <li>• Clear the airway if unconscious</li>
              <li>• Apply pressure to any bleeding</li>
              <li>• Do NOT move if spinal injury suspected</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
