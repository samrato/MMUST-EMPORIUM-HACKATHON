import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Check, User, Phone, MapPin, FileText, ChevronRight, ChevronLeft, Loader2, Navigation, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { getNearbyHospitals, NearbyFacility, calculateDistance } from '@/services/placesService';
import { AppointmentRecord, createAppointment, getAppointmentsByPatientId, logAiInteraction, normalizeText } from '@/services/dataService';

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
  const { patientId } = useUser();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('info');
  const [facilities, setFacilities] = useState<NearbyFacility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [booked, setBooked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [myAppointments, setMyAppointments] = useState<AppointmentRecord[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [lookupPatientId, setLookupPatientId] = useState(patientId);
  const [activePatientId, setActivePatientId] = useState(patientId);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    fullName: '', phone: '', age: '', gender: '', location: '',
    symptoms: '', medicalHistory: '', emergencyContact: '',
  });

  const loadMyAppointments = useCallback(async (idToLookup: string) => {
    const normalizedId = normalizeText(idToLookup);
    const startedAt = Date.now();
    if (!normalizedId) {
      toast({
        variant: "destructive",
        title: "Missing ID",
        description: "Please provide an anonymous patient ID.",
      });
      return;
    }

    setLoadingAppointments(true);
    try {
      const data = await getAppointmentsByPatientId(normalizedId);
      setActivePatientId(normalizedId);
      setMyAppointments(data);

      void logAiInteraction({
        patientId: normalizedId,
        messageType: "appointment_lookup",
        language: lang,
        inputText: `Appointment history lookup for ${normalizedId}`,
        responseText: `Found ${data.length} appointment records.`,
        durationMs: Date.now() - startedAt,
      }).catch((error: unknown) => {
        console.error("Failed to store appointment lookup event:", error);
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load appointments.";
      toast({
        variant: "destructive",
        title: "Error loading appointments",
        description: message,
      });

      void logAiInteraction({
        patientId: normalizedId,
        messageType: "appointment_lookup",
        language: lang,
        inputText: `Appointment history lookup for ${normalizedId}`,
        responseText: `Lookup failed: ${message}`,
        durationMs: Date.now() - startedAt,
      }).catch((eventError: unknown) => {
        console.error("Failed to store appointment lookup failure event:", eventError);
      });
    } finally {
      setLoadingAppointments(false);
    }
  }, [lang, toast]);

  useEffect(() => {
    if (showAppointments) {
      void loadMyAppointments(activePatientId);
    }
  }, [showAppointments, activePatientId, loadMyAppointments]);

  const [locating, setLocating] = useState(false);

  const loadNearbyFacilities = useCallback(() => {
    setLoadingFacilities(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const data = await getNearbyHospitals(pos.coords.latitude, pos.coords.longitude);
        const withDistance = data.map(f => ({
          ...f,
          distance: parseFloat(calculateDistance(pos.coords.latitude, pos.coords.longitude, f.location.lat, f.location.lng).toFixed(1))
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
        setFacilities(withDistance);
        setLoadingFacilities(false);
      }, () => setLoadingFacilities(false));
    } else {
      setLoadingFacilities(false);
    }
  }, []);

  useEffect(() => {
    if (step === 'facility' && facilities.length === 0) {
      loadNearbyFacilities();
    }
  }, [step, facilities.length, loadNearbyFacilities]);

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
  const canProceedFacility = !!selectedFacilityId;
  const canProceedSchedule = selectedDate && selectedTime;

  const stepIndex = STEPS.indexOf(step);

  const selectedFacilityData = facilities.find(f => f.id === selectedFacilityId);

  const handleBook = async () => {
    if (!canProceedSchedule || !canProceedFacility || !canProceedInfo) return;
    
    const startedAt = Date.now();
    setIsSubmitting(true);
    try {
      await createAppointment({
        patientId,
        fullName: patientInfo.fullName,
        phone: patientInfo.phone,
        age: parseInt(patientInfo.age, 10),
        gender: patientInfo.gender,
        location: patientInfo.location,
        symptoms: patientInfo.symptoms,
        medicalHistory: patientInfo.medicalHistory,
        emergencyContact: patientInfo.emergencyContact,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        urgency: 'normal',
        facilityName: selectedFacilityData?.name,
        facilityId: selectedFacilityData?.id,
      });

      setBooked(true);
      toast({
        title: "Appointment Booked",
        description: "Your appointment has been synced with AfyaRoot cloud.",
      });

      void logAiInteraction({
        patientId,
        messageType: "booking_request",
        language: lang,
        inputText: `Booking requested for ${selectedDate} at ${selectedTime}`,
        responseText: `Appointment booked with ${selectedFacilityData?.name || "selected facility"}.`,
        durationMs: Date.now() - startedAt,
      }).catch((error: unknown) => {
        console.error("Failed to store booking event:", error);
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to sync with database.";
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: message,
      });

      void logAiInteraction({
        patientId,
        messageType: "booking_request",
        language: lang,
        inputText: `Booking requested for ${selectedDate} at ${selectedTime}`,
        responseText: `Booking failed: ${message}`,
        durationMs: Date.now() - startedAt,
      }).catch((eventError: unknown) => {
        console.error("Failed to store booking failure event:", eventError);
      });
    } finally {
      setIsSubmitting(false);
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

  if (booked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6 shadow-lg">
          <Check className="h-12 w-12 text-success" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">Success!</h2>
        <p className="text-muted-foreground text-sm mb-6">Your appointment is confirmed.</p>
        
        <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-xl ring-1 ring-black/5 space-y-4">
          <div className="border-b border-border/50 pb-3">
            <p className="text-[10px] uppercase font-bold text-primary mb-1">Patient</p>
            <p className="text-base font-bold text-foreground">{patientInfo.fullName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-primary mb-1">Date</p>
              <p className="text-sm font-bold text-foreground">{selectedDate}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-primary mb-1">Time</p>
              <p className="text-sm font-bold text-foreground">{selectedTime}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-primary mb-1">Facility</p>
            <p className="text-sm font-bold text-foreground">{selectedFacilityData?.name}</p>
            <p className="text-xs text-muted-foreground">{selectedFacilityData?.address}</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 mt-8 w-full max-w-sm">
          <button
            onClick={() => { setBooked(false); setStep('info'); setSelectedFacilityId(''); setSelectedDate(''); setSelectedTime(''); setPatientInfo({ fullName: '', phone: '', age: '', gender: '', location: '', symptoms: '', medicalHistory: '', emergencyContact: '' }); }}
            className="bg-primary text-primary-foreground rounded-2xl w-full py-4 font-black shadow-lg hover:scale-105 transition-transform active:scale-95"
          >
            Book Another Appointment
          </button>
          <button
            onClick={() => {
              setBooked(false);
              setLookupPatientId(patientId);
              setActivePatientId(patientId);
              setShowAppointments(true);
            }}
            className="bg-secondary text-secondary-foreground rounded-2xl w-full py-4 font-black"
          >
            View My Appointments
          </button>
        </div>
      </div>
    );
  }

  if (showAppointments) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto w-full px-2 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">📋 My Appointments</h1>
          <button 
            onClick={() => setShowAppointments(false)}
            className="text-xs font-black text-primary uppercase bg-primary/10 px-4 py-2 rounded-xl"
          >
            + New Booking
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">
            Search by Anonymous ID
          </p>
          <div className="flex gap-2">
            <input
              value={lookupPatientId}
              onChange={(event) => setLookupPatientId(event.target.value)}
              placeholder="AFR-XXXXXX"
              className="flex-1 bg-secondary/40 border border-transparent rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
            />
            <button
              onClick={() => void loadMyAppointments(lookupPatientId)}
              disabled={loadingAppointments}
              className="bg-primary text-primary-foreground rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest disabled:opacity-50"
            >
              Search
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Showing records for: <span className="font-bold text-foreground">{activePatientId}</span></p>
        </div>

        {loadingAppointments ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-bold text-muted-foreground">Retrieving your medical bookings...</p>
          </div>
        ) : myAppointments.length === 0 ? (
          <div className="bg-card border border-border rounded-[2.5rem] p-10 text-center space-y-4 shadow-sm ring-1 ring-black/5">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground">No bookings yet</h3>
              <p className="text-sm text-muted-foreground">Your future appointments will appear here.</p>
            </div>
            <button 
              onClick={() => setShowAppointments(false)}
              className="bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-primary/20"
            >
              Book Now
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {myAppointments.map((app) => (
              <div key={app.id} className="bg-card border border-border rounded-[2rem] p-6 shadow-sm ring-1 ring-black/5 hover:ring-primary/20 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Appointment ID: {app.id.substring(0, 8)}</p>
                    <h3 className="text-lg font-black text-foreground">{app.facility_name}</h3>
                  </div>
                  <div className="bg-success/10 text-success text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    Confirmed
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Date</p>
                      <p className="text-sm font-bold text-foreground">{app.appointment_date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Time</p>
                      <p className="text-sm font-bold text-foreground">{app.appointment_time}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground/80">{app.full_name}</span>
                  </div>
                  {app.facility_id && (
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${app.facility_name}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[10px] font-black text-primary uppercase flex items-center gap-1.5"
                    >
                      <Navigation className="h-3 w-3" /> Get Route
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full px-2 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">📅 {t('bookAppointment', lang)}</h1>
        <button 
          onClick={() => {
            setLookupPatientId(patientId);
            setActivePatientId(patientId);
            setShowAppointments(true);
          }}
          className="text-[10px] font-black text-primary uppercase bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20"
        >
          My History
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${i <= stepIndex ? 'bg-primary shadow-sm' : 'bg-secondary'}`} />
          </div>
        ))}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-primary text-center">
        Step {stepIndex + 1} of {STEPS.length} — {step.toUpperCase()}
      </p>

      {/* Step 1: Patient Info */}
      {step === 'info' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground/70 flex items-center gap-2 uppercase tracking-wider"><User className="h-3.5 w-3.5 text-primary" /> Full Name *</label>
              <input value={patientInfo.fullName} onChange={e => updateInfo('fullName', e.target.value)} placeholder="Enter full name" className="w-full bg-secondary/30 border border-transparent rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:bg-background transition-all font-medium" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/70 flex items-center gap-2 uppercase tracking-wider"><Phone className="h-3.5 w-3.5 text-primary" /> Phone *</label>
                <input value={patientInfo.phone} onChange={e => updateInfo('phone', e.target.value)} placeholder="+254..." type="tel" className="w-full bg-secondary/30 border border-transparent rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:bg-background transition-all font-medium" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Age *</label>
                <input value={patientInfo.age} onChange={e => updateInfo('age', e.target.value)} placeholder="Age" type="number" className="w-full bg-secondary/30 border border-transparent rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:bg-background transition-all font-medium" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Gender</label>
              <div className="flex gap-2">
                {['Male', 'Female', 'Other'].map(g => (
                  <button key={g} onClick={() => updateInfo('gender', g)} className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${patientInfo.gender === g ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground/70 flex items-center gap-2 uppercase tracking-wider"><MapPin className="h-3.5 w-3.5 text-primary" /> Your Location</label>
              <div className="flex gap-2">
                <input value={patientInfo.location} onChange={e => updateInfo('location', e.target.value)} placeholder="Village or City" className="flex-1 bg-secondary/30 border border-transparent rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:bg-background transition-all font-medium" />
                <button onClick={detectLocation} disabled={locating} className="bg-accent/10 text-accent rounded-xl px-4 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-accent/20 transition-all border border-accent/20">
                  {locating ? '...' : 'GPS'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground/70 flex items-center gap-2 uppercase tracking-wider"><FileText className="h-3.5 w-3.5 text-primary" /> Symptoms / Reason</label>
              <textarea value={patientInfo.symptoms} onChange={e => updateInfo('symptoms', e.target.value)} placeholder="Describe your health concern..." rows={3} className="w-full bg-secondary/30 border border-transparent rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:bg-background transition-all resize-none font-medium" />
            </div>
          </div>
          
          <button onClick={nextStep} disabled={!canProceedInfo} className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-black flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg hover:opacity-95 transition-all active:scale-[0.98]">
            Next: Choose Facility <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Step 2: Facility */}
      {step === 'facility' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-widest text-foreground/60">{t('selectFacility', lang)}</label>
            <button onClick={loadNearbyFacilities} className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-1 rounded-md">Refresh</button>
          </div>
          
          {loadingFacilities ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-bold text-muted-foreground animate-pulse">Finding nearest hospitals...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {facilities.map((f, i) => (
                <button 
                  key={f.id} 
                  onClick={() => setSelectedFacilityId(f.id)} 
                  className={`w-full text-left rounded-2xl p-4 border-2 transition-all duration-300 group ${
                    selectedFacilityId === f.id 
                      ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-base text-foreground group-hover:text-primary transition-colors">{f.name}</p>
                      {i === 0 && (
                        <span className="bg-success text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                          Best Choice
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{f.distance} km</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 flex items-start gap-1">
                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {f.address}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-warning">
                      <Star className="h-3 w-3 fill-current" />
                      {f.rating || 'N/A'}
                    </div>
                    {f.open_now && <span className="text-[10px] font-bold text-success uppercase">Open Now</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          <div className="flex gap-3">
            <button onClick={prevStep} className="flex-1 bg-secondary text-secondary-foreground rounded-2xl py-4 font-black flex items-center justify-center gap-2 hover:bg-secondary/80">
              <ChevronLeft className="h-5 w-5" /> Back
            </button>
            <button onClick={nextStep} disabled={!canProceedFacility} className="flex-1 bg-primary text-primary-foreground rounded-2xl py-4 font-black flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg active:scale-95">
              Next <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Schedule */}
      {step === 'schedule' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-foreground/60 flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {t('selectDate', lang)}</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-secondary/30 border border-transparent rounded-xl px-4 py-4 text-foreground outline-none focus:border-primary focus:bg-background transition-all font-bold" />
            </div>
            
            {selectedDate && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <label className="text-xs font-black uppercase tracking-widest text-foreground/60 flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Select Time</label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map(time => (
                    <button key={time} onClick={() => setSelectedTime(time)} className={`rounded-xl py-3.5 text-xs font-black transition-all ${selectedTime === time ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'}`}>
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button onClick={prevStep} className="flex-1 bg-secondary text-secondary-foreground rounded-2xl py-4 font-black flex items-center justify-center gap-2">
              <ChevronLeft className="h-5 w-5" /> Back
            </button>
            <button onClick={nextStep} disabled={!canProceedSchedule} className="flex-1 bg-primary text-primary-foreground rounded-2xl py-4 font-black flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg">
              Review <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 'review' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xl ring-1 ring-black/5 space-y-6">
            <h3 className="font-black text-foreground text-sm uppercase tracking-widest border-b border-border/50 pb-3">Booking Summary</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase">Patient</p>
                <p className="text-sm font-bold text-foreground">{patientInfo.fullName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase">Phone</p>
                <p className="text-sm font-bold text-foreground">{patientInfo.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase">Age/Gender</p>
                <p className="text-sm font-bold text-foreground">{patientInfo.age} • {patientInfo.gender || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase">Appointment</p>
                <p className="text-sm font-bold text-foreground">{selectedDate} @ {selectedTime}</p>
              </div>
            </div>
            
            <div className="space-y-1 bg-secondary/30 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-primary uppercase">Facility Details</p>
              <p className="text-sm font-bold text-foreground">{selectedFacilityData?.name}</p>
              <p className="text-[10px] text-muted-foreground">{selectedFacilityData?.address}</p>
              {selectedFacilityData && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacilityData.location.lat},${selectedFacilityData.location.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[10px] font-black text-primary mt-3 uppercase tracking-tighter"
                >
                  <Navigation className="h-3 w-3" /> Get Directions
                </a>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button onClick={prevStep} disabled={isSubmitting} className="flex-1 bg-secondary text-secondary-foreground rounded-2xl py-4 font-black flex items-center justify-center gap-2">
              <ChevronLeft className="h-5 w-5" /> Back
            </button>
            <button onClick={handleBook} disabled={isSubmitting} className="flex-1 bg-primary text-primary-foreground rounded-2xl py-4 font-black text-base flex items-center justify-center gap-3 shadow-lg hover:opacity-95 active:scale-95 transition-all">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5" /> {t('confirm', lang)} Booking</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
