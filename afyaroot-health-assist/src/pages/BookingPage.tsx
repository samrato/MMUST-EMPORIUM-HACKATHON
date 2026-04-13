import { useState } from 'react';
import { Calendar, Clock, Check, User, Phone, MapPin, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import { facilities } from '@/services/facilityData';

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

interface PatientInfo {
  fullName: string;
  phone: string;
  age: string;
  gender: string;
  location: string;
  symptoms: string;
  medicalHistory: string;
  emergencyContact: string;
}

const STEPS = ['info', 'facility', 'schedule', 'review'] as const;
type Step = typeof STEPS[number];

export default function BookingPage() {
  const { lang } = useLanguage();
  const [step, setStep] = useState<Step>('info');
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [booked, setBooked] = useState(false);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    fullName: '', phone: '', age: '', gender: '', location: '',
    symptoms: '', medicalHistory: '', emergencyContact: '',
  });
  const [locating, setLocating] = useState(false);

  const updateInfo = (field: keyof PatientInfo, value: string) => {
    setPatientInfo(prev => ({ ...prev, [field]: value }));
  };

  const detectLocation = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateInfo('location', `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
          setLocating(false);
        },
        () => {
          updateInfo('location', 'Location unavailable – enter manually');
          setLocating(false);
        }
      );
    } else {
      updateInfo('location', 'Geolocation not supported');
      setLocating(false);
    }
  };

  const canProceedInfo = patientInfo.fullName && patientInfo.phone && patientInfo.age;
  const canProceedFacility = !!selectedFacility;
  const canProceedSchedule = selectedDate && selectedTime;

  const stepIndex = STEPS.indexOf(step);

  const handleBook = () => {
    if (canProceedSchedule && canProceedFacility && canProceedInfo) {
      setBooked(true);
    }
  };

  const nextStep = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const prevStep = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const selectedFacilityData = facilities.find(f => f.id === selectedFacility);

  if (booked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] fade-slide-up">
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4">
          <Check className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Appointment Booked!</h2>
        <div className="bg-card border border-border rounded-2xl p-4 mt-4 w-full max-w-sm space-y-2">
          <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Patient:</span> {patientInfo.fullName}</p>
          <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Phone:</span> {patientInfo.phone}</p>
          <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Facility:</span> {selectedFacilityData?.name}</p>
          <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Date:</span> {selectedDate} at {selectedTime}</p>
          {patientInfo.symptoms && <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Symptoms:</span> {patientInfo.symptoms}</p>}
        </div>
        <button
          onClick={() => { setBooked(false); setStep('info'); setSelectedFacility(''); setSelectedDate(''); setSelectedTime(''); setPatientInfo({ fullName: '', phone: '', age: '', gender: '', location: '', symptoms: '', medicalHistory: '', emergencyContact: '' }); }}
          className="mt-6 bg-primary text-primary-foreground rounded-xl px-6 py-3 font-semibold"
        >
          Book Another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">📅 {t('bookAppointment', lang)}</h1>

      {/* Step Indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`h-2 flex-1 rounded-full transition-all ${i <= stepIndex ? 'bg-primary' : 'bg-secondary'}`} />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Step {stepIndex + 1} of {STEPS.length} — {step === 'info' ? 'Patient Details' : step === 'facility' ? 'Choose Facility' : step === 'schedule' ? 'Pick Date & Time' : 'Review & Confirm'}
      </p>

      {/* Step 1: Patient Info */}
      {step === 'info' && (
        <div className="space-y-3 fade-slide-up">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2"><User className="h-4 w-4" /> Full Name *</label>
            <input value={patientInfo.fullName} onChange={e => updateInfo('fullName', e.target.value)} placeholder="Enter full name" className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2"><Phone className="h-4 w-4" /> Phone *</label>
              <input value={patientInfo.phone} onChange={e => updateInfo('phone', e.target.value)} placeholder="+254..." type="tel" className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Age *</label>
              <input value={patientInfo.age} onChange={e => updateInfo('age', e.target.value)} placeholder="Age" type="number" className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Gender</label>
            <div className="flex gap-2">
              {['Male', 'Female', 'Other'].map(g => (
                <button key={g} onClick={() => updateInfo('gender', g)} className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${patientInfo.gender === g ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</label>
            <div className="flex gap-2">
              <input value={patientInfo.location} onChange={e => updateInfo('location', e.target.value)} placeholder="Your location" className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring" />
              <button onClick={detectLocation} disabled={locating} className="bg-accent text-accent-foreground rounded-xl px-3 text-xs font-semibold disabled:opacity-50">
                {locating ? '...' : '📍 Detect'}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2"><FileText className="h-4 w-4" /> Symptoms / Reason</label>
            <textarea value={patientInfo.symptoms} onChange={e => updateInfo('symptoms', e.target.value)} placeholder="Briefly describe your symptoms or reason for visit..." rows={2} className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Emergency Contact Phone</label>
            <input value={patientInfo.emergencyContact} onChange={e => updateInfo('emergencyContact', e.target.value)} placeholder="+254..." type="tel" className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Medical History (optional)</label>
            <textarea value={patientInfo.medicalHistory} onChange={e => updateInfo('medicalHistory', e.target.value)} placeholder="Any allergies, chronic conditions, past surgeries..." rows={2} className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <button onClick={nextStep} disabled={!canProceedInfo} className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 disabled:opacity-40">
            Next: Choose Facility <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Step 2: Facility */}
      {step === 'facility' && (
        <div className="space-y-3 fade-slide-up">
          <label className="text-sm font-semibold text-foreground">{t('selectFacility', lang)}</label>
          <div className="space-y-2">
            {facilities.map(f => (
              <button key={f.id} onClick={() => setSelectedFacility(f.id)} className={`w-full text-left rounded-xl p-3 border-2 transition-all ${selectedFacility === f.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                <p className="font-semibold text-sm text-foreground">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.distance} km • {f.availability}% available • {f.specialties.slice(0, 2).join(', ')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">📞 {f.phone}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={prevStep} className="flex-1 bg-secondary text-secondary-foreground rounded-xl py-3.5 font-bold flex items-center justify-center gap-2">
              <ChevronLeft className="h-5 w-5" /> Back
            </button>
            <button onClick={nextStep} disabled={!canProceedFacility} className="flex-1 bg-primary text-primary-foreground rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 disabled:opacity-40">
              Next <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Schedule */}
      {step === 'schedule' && (
        <div className="space-y-3 fade-slide-up">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> {t('selectDate', lang)}</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {selectedDate && (
            <div className="space-y-1.5 fade-slide-up">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Select Time</label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(time => (
                  <button key={time} onClick={() => setSelectedTime(time)} className={`rounded-xl py-2.5 text-sm font-medium transition-all ${selectedTime === time ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={prevStep} className="flex-1 bg-secondary text-secondary-foreground rounded-xl py-3.5 font-bold flex items-center justify-center gap-2">
              <ChevronLeft className="h-5 w-5" /> Back
            </button>
            <button onClick={nextStep} disabled={!canProceedSchedule} className="flex-1 bg-primary text-primary-foreground rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 disabled:opacity-40">
              Review <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 'review' && (
        <div className="space-y-3 fade-slide-up">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2.5">
            <h3 className="font-bold text-foreground text-sm">📋 Booking Summary</h3>
            <div className="space-y-1.5 text-sm">
              <p className="text-muted-foreground"><span className="font-semibold text-foreground">Name:</span> {patientInfo.fullName}</p>
              <p className="text-muted-foreground"><span className="font-semibold text-foreground">Phone:</span> {patientInfo.phone}</p>
              <p className="text-muted-foreground"><span className="font-semibold text-foreground">Age:</span> {patientInfo.age} {patientInfo.gender && `• ${patientInfo.gender}`}</p>
              {patientInfo.location && <p className="text-muted-foreground"><span className="font-semibold text-foreground">Location:</span> {patientInfo.location}</p>}
              {patientInfo.symptoms && <p className="text-muted-foreground"><span className="font-semibold text-foreground">Symptoms:</span> {patientInfo.symptoms}</p>}
              {patientInfo.emergencyContact && <p className="text-muted-foreground"><span className="font-semibold text-foreground">Emergency Contact:</span> {patientInfo.emergencyContact}</p>}
              {patientInfo.medicalHistory && <p className="text-muted-foreground"><span className="font-semibold text-foreground">Medical History:</span> {patientInfo.medicalHistory}</p>}
            </div>
            <hr className="border-border" />
            <p className="text-muted-foreground text-sm"><span className="font-semibold text-foreground">Facility:</span> {selectedFacilityData?.name}</p>
            <p className="text-muted-foreground text-sm"><span className="font-semibold text-foreground">When:</span> {selectedDate} at {selectedTime}</p>
            {selectedFacilityData && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacilityData.location.lat},${selectedFacilityData.location.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-semibold text-primary mt-1"
              >
                <MapPin className="h-4 w-4" /> Get Directions →
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={prevStep} className="flex-1 bg-secondary text-secondary-foreground rounded-xl py-3.5 font-bold flex items-center justify-center gap-2">
              <ChevronLeft className="h-5 w-5" /> Back
            </button>
            <button onClick={handleBook} className="flex-1 bg-primary text-primary-foreground rounded-xl py-4 font-bold text-base">
              ✅ {t('confirm', lang)} Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
