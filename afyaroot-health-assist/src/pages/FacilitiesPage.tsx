import { MapPin, Phone, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import { facilities } from '@/services/facilityData';

const typeColors = {
  hospital: 'border-emergency bg-emergency/5',
  health_center: 'border-warning bg-warning/5',
  dispensary: 'border-success bg-success/5',
};
const typeLabels = { hospital: '🏥 Hospital', health_center: '🏨 Health Center', dispensary: '💊 Dispensary' };

export default function FacilitiesPage() {
  const { lang } = useLanguage();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">📍 {t('nearestFacilities', lang)}</h1>

      {/* Legend */}
      <div className="flex gap-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emergency" /> Emergency</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-warning" /> High</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-success" /> Normal</span>
      </div>

      {/* Facility Cards */}
      <div className="space-y-3">
        {[...facilities].sort((a, b) => a.distance - b.distance).map(f => (
          <div key={f.id} className={`rounded-2xl border-2 ${typeColors[f.type]} p-4 card-hover`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-foreground text-sm">{f.name}</h3>
                <p className="text-xs text-muted-foreground">{typeLabels[f.type]}</p>
              </div>
              <span className="text-sm font-bold text-primary">{f.distance} km</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {f.specialties.map(s => (
                <span key={s} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {f.occupancy}% full</span>
                <span>{f.beds} beds</span>
              </div>
              <a href={`tel:${f.phone}`} className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                <Phone className="h-3 w-3" /> Call
              </a>
            </div>
            {/* Occupancy bar */}
            <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${f.occupancy > 80 ? 'bg-emergency' : f.occupancy > 60 ? 'bg-warning' : 'bg-success'}`}
                style={{ width: `${f.occupancy}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
