import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, BarChart3, Calendar, AlertTriangle, Download, MapPin, 
  MessageCircle, ShieldCheck, Stethoscope, Wifi, Activity, Plus, Heart, 
  Smile, CheckCircle2, Camera, Mic, FileText, X, Navigation, Phone, 
  Droplets, Moon, Sparkles, Brain
} from 'lucide-react';
import PwaInstallButton from '@/components/PwaInstallButton';
import { usePwa } from '@/hooks/use-pwa';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import { useUser } from '@/hooks/use-user';

interface Goal {
  id: number;
  text: string;
  completed: boolean;
}

interface TimelineEvent {
  time: string;
  date?: string;
  icon: any;
  iconColor: string;
  bgClass: string;
  text: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { canInstall, installLabel, isInstalled } = usePwa();
  const { patientId } = useUser();

  // Dynamic user health metrics persisted in localStorage
  const [water, setWater] = useState<number>(1.25);
  const [sleep, setSleep] = useState<string>("6h 45m");
  const [bp, setBp] = useState<string>("120/80");
  const [mood, setMood] = useState<string>("");
  const [moodResponse, setMoodResponse] = useState<string>("");
  const [showEmergency, setShowEmergency] = useState<boolean>(false);
  const [uploadType, setUploadType] = useState<string | null>(null);

  // Today's goals
  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, text: "Drink 2L of water", completed: false },
    { id: 2, text: "Walk 30 minutes", completed: false },
    { id: 3, text: "Take current medical prescriptions", completed: false },
    { id: 4, text: "Record daily health metrics", completed: false },
    { id: 5, text: "Complete AI wellness check-in", completed: false },
  ]);

  // Dynamic timelines and suggestions from backend messages database
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<string>("");

  // ==========================================
  // DYNAMIC LOADING & STATE SYNCHRONIZATION
  // ==========================================
  useEffect(() => {
    // 1. Load metrics from localStorage
    const savedWater = localStorage.getItem(`afya_water_${patientId}`);
    if (savedWater) setWater(parseFloat(savedWater));

    const savedSleep = localStorage.getItem(`afya_sleep_${patientId}`);
    if (savedSleep) setSleep(savedSleep);

    const savedBp = localStorage.getItem(`afya_bp_${patientId}`);
    if (savedBp) setBp(savedBp);

    const savedGoals = localStorage.getItem(`afya_goals_${patientId}`);
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }

    // 2. Fetch real messages from backend to build timeline & suggestions
    const fetchHistory = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/conversations/lookup?webUserId=${patientId}`);
        if (res.ok) {
          const payload = await res.json();
          if (payload.success && payload.messages && payload.messages.length > 0) {
            // Map messages to timeline events
            const events: TimelineEvent[] = payload.messages
              .filter((m: any) => m.sender === 'user')
              .slice(-6) // Show last 6 messages
              .map((m: any) => {
                const category = m.classification?.category || '';
                const isEmergency = category === 'EMERGENCY' || category === 'GBV';
                const isMed = category === 'MEDICINE_VERIFICATION';
                
                let icon = MessageCircle;
                let iconColor = 'text-accent';
                let bgClass = 'bg-accent/15';

                if (isEmergency) {
                  icon = AlertTriangle;
                  iconColor = 'text-emergency';
                  bgClass = 'bg-emergency/15';
                } else if (isMed) {
                  icon = Camera;
                  iconColor = 'text-primary';
                  bgClass = 'bg-primary/15';
                }

                const timestamp = new Date(m.timestamp);
                return {
                  time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  date: timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                  icon,
                  iconColor,
                  bgClass,
                  text: m.message
                };
              })
              .reverse(); // Newest first

            setTimeline(events);

            // Find last agent reply for proactive companion card
            const agentMsgs = payload.messages.filter((m: any) => m.sender === 'agent');
            if (agentMsgs.length > 0) {
              setAiSuggestion(agentMsgs[agentMsgs.length - 1].message);
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch real timeline history from backend:", err);
      }
    };

    void fetchHistory();
  }, [patientId]);

  // Sync water goals when water increments
  useEffect(() => {
    setGoals(prev => {
      const updated = prev.map(g => g.id === 1 ? { ...g, completed: water >= 2.0 } : g);
      localStorage.setItem(`afya_goals_${patientId}`, JSON.stringify(updated));
      return updated;
    });
  }, [water, patientId]);

  // Handle Increments & Local Updates
  const handleWaterIncrement = () => {
    const nextWater = Math.min(4.0, water + 0.25);
    setWater(nextWater);
    localStorage.setItem(`afya_water_${patientId}`, nextWater.toString());
  };

  const handleSleepToggle = () => {
    const nextSleep = sleep === "6h 45m" ? "7h 15m" : "6h 45m";
    setSleep(nextSleep);
    localStorage.setItem(`afya_sleep_${patientId}`, nextSleep);
  };

  const handleBpToggle = () => {
    const nextBp = bp === "120/80" ? "124/82" : "120/80";
    setBp(nextBp);
    localStorage.setItem(`afya_bp_${patientId}`, nextBp);
  };

  const toggleGoal = (id: number) => {
    setGoals(prev => {
      const updated = prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
      localStorage.setItem(`afya_goals_${patientId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const completedCount = goals.filter(g => g.completed).length;

  const handleMoodSelect = (selectedMood: string, reply: string) => {
    setMood(selectedMood);
    setMoodResponse(reply);
    // Mark check-in goal completed
    setGoals(prev => {
      const updated = prev.map(g => g.id === 5 ? { ...g, completed: true } : g);
      localStorage.setItem(`afya_goals_${patientId}`, JSON.stringify(updated));
      return updated;
    });
    setTimeout(() => {
      setMoodResponse("");
    }, 8000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================== */}
      {/* EMERGENCY MODE CAPABILITY */}
      {/* ========================================== */}
      {showEmergency ? (
        <section className="relative overflow-hidden rounded-[2rem] border-2 border-emergency bg-emergency/10 p-6 shadow-xl backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <button 
            onClick={() => setShowEmergency(false)}
            className="absolute right-4 top-4 rounded-full bg-emergency/20 p-2 text-emergency hover:bg-emergency/35 transition"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emergency text-emergency-foreground animate-pulse">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emergency">Critical Emergency Active</p>
              <h2 className="text-2xl font-bold text-foreground mt-1">Symptom matches emergency criteria</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-card border border-emergency/25 p-5 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Recommended ER Unit</p>
              <h3 className="text-lg font-bold text-foreground mt-2">Kakamega County General Referral Hospital</h3>
              <p className="text-sm text-muted-foreground mt-1">Level 5 County Referral • Open 24 Hours</p>
              
              <div className="mt-4 flex gap-6 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-bold mt-1 text-foreground">1.8 km</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Queue Status</p>
                  <p className="font-bold text-success mt-1">10 min wait</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3">
              <button 
                onClick={() => navigate('/emergency')}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emergency py-4 text-sm font-bold text-emergency-foreground shadow-lg shadow-emergency/15 transition hover:bg-emergency/90 active:scale-95"
              >
                <Navigation className="h-4 w-4" />
                Navigate Now (Get Route)
              </button>
              
              <a 
                href="tel:1195"
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-emergency py-4 text-sm font-bold text-emergency hover:bg-emergency/5 active:scale-95 transition"
              >
                <Phone className="h-4 w-4" />
                Call GBV Helpline (1195)
              </a>

              <a 
                href="tel:999"
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-emergency/50 bg-background/50 py-4 text-sm font-bold text-foreground hover:bg-background active:scale-95 transition"
              >
                <Phone className="h-4 w-4" />
                Call Police / Ambulance (999)
              </a>
            </div>
          </div>
        </section>
      ) : (
        /* Top Banner & Emergency Activator */
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Rural Health Intelligence</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground flex items-center gap-2">
              Jambo! 
              <span className="font-mono text-sm px-3 py-1 rounded bg-secondary text-secondary-foreground font-semibold">
                Patient #{patientId.slice(0, 8)}
              </span>
            </h1>
          </div>
          <button 
            onClick={() => setShowEmergency(true)}
            className="flex items-center gap-2 rounded-2xl bg-emergency/10 border border-emergency/20 px-4 py-3 text-sm font-bold text-emergency hover:bg-emergency/20 active:scale-95 transition-all"
          >
            <AlertTriangle className="h-4.5 w-4.5 animate-pulse" />
            Emergency Mode
          </button>
        </div>
      )}

      {/* ========================================== */}
      {/* AFYAROOT COPILOT WORKSPACE (PROACTIVE AI) */}
      {/* ========================================== */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        
        {/* Proactive Companion Panel */}
        <div className="rounded-[2rem] border border-border bg-card/85 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Brain className="h-4 w-4 text-primary" />
              Proactive Health Companion
            </div>
            <h2 className="text-xl font-bold text-foreground">AI Suggestion & Alert</h2>
            <p className="text-sm leading-6 text-muted-foreground italic">
              {aiSuggestion ? `"${aiSuggestion.slice(0, 360)}..."` : `"Jambo! I am your AI Health Companion. Let's start tracking your health journey. Use the quick buttons below to scan medicine, ask questions, or record metrics!"`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/chat')}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/10 transition hover:bg-primary/95 active:scale-95"
            >
              Consult AI Companion
              <ArrowRight className="h-4 w-4" />
            </button>
            <button 
              onClick={() => navigate('/booking')}
              className="inline-flex items-center gap-2 rounded-2xl bg-success/15 border border-success/20 px-5 py-3.5 text-sm font-bold text-success hover:bg-success/25 transition active:scale-95"
            >
              Book Clinical Appointment
            </button>
          </div>
        </div>

        {/* Goal Missions Panel */}
        <div className="rounded-[2rem] border border-border bg-card/85 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">Today's Missions</h3>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                Progress: {completedCount} / {goals.length}
              </span>
            </div>
            
            {/* Live Progress Bar */}
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${(completedCount / goals.length) * 100}%` }}
              />
            </div>

            <div className="space-y-2 mt-4">
              {goals.map(g => (
                <button
                  key={g.id}
                  onClick={() => toggleGoal(g.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50 hover:bg-background/90 text-left transition group"
                >
                  <CheckCircle2 className={`h-5 w-5 transition ${g.completed ? 'text-primary' : 'text-muted-foreground opacity-60 group-hover:opacity-100'}`} />
                  <span className={`text-sm font-medium ${g.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {g.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* ========================================== */}
      {/* TODAY'S HEALTH SUMMARY (INTERACTIVE WORKSPACE) */}
      {/* ========================================== */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Water tracker */}
        <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm flex flex-col justify-between h-[150px]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Water Intake</p>
            <Droplets className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{water.toFixed(2)}L</p>
              <p className="text-xs text-muted-foreground mt-1">Goal: 2.00L</p>
            </div>
            <button 
              onClick={handleWaterIncrement}
              className="rounded-full bg-primary/10 text-primary p-2 hover:bg-primary/20 transition active:scale-90"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sleep tracker */}
        <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm flex flex-col justify-between h-[150px]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Sleep Analysis</p>
            <Moon className="h-5 w-5 text-accent" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{sleep}</p>
              <p className="text-xs text-success mt-1">✓ 7h target optimal</p>
            </div>
            <button 
              onClick={handleSleepToggle}
              className="text-xs font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-full hover:bg-accent/20 transition"
            >
              Adjust
            </button>
          </div>
        </div>

        {/* Blood pressure */}
        <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm flex flex-col justify-between h-[150px]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Blood Pressure</p>
            <Heart className="h-5 w-5 text-emergency" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{bp} mmHg</p>
              <p className="text-xs text-success mt-1">✓ Normal range</p>
            </div>
            <button 
              onClick={handleBpToggle}
              className="text-xs font-bold text-emergency bg-emergency/10 px-3 py-1.5 rounded-full hover:bg-emergency/20 transition"
            >
              Measure
            </button>
          </div>
        </div>

        {/* Medical Status Card */}
        <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm flex flex-col justify-between h-[150px]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Medical Follow-up</p>
            <Calendar className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">Active Case Sync</p>
            <p className="text-xs text-muted-foreground mt-1">Timeline mapped from central server logs</p>
          </div>
        </div>

      </section>

      {/* ========================================== */}
      {/* INTERACTIVE INPUT PATHWAYS (EMOJIS, SCAN, MIC) */}
      {/* ========================================== */}
      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">How are you feeling right now?</h3>
          <p className="text-sm text-muted-foreground">Select an emoji or upload inputs to query the health copilot.</p>
        </div>

        {/* Emoji selector */}
        <div className="grid grid-cols-5 gap-3 max-w-md">
          <button 
            onClick={() => handleMoodSelect("healthy", "Awesome! I'm glad you're feeling great. Keep up the good work and stay hydrated!")}
            className={`rounded-2xl p-3 border text-2xl flex justify-center items-center hover:scale-105 active:scale-95 transition-all ${mood === 'healthy' ? 'bg-primary/10 border-primary' : 'bg-background border-border'}`}
          >
            😊
          </button>
          <button 
            onClick={() => handleMoodSelect("sick", "I'm sorry you feel sick. If you have fever or headache, check symptoms or ask me what to do.")}
            className={`rounded-2xl p-3 border text-2xl flex justify-center items-center hover:scale-105 active:scale-95 transition-all ${mood === 'sick' ? 'bg-primary/10 border-primary' : 'bg-background border-border'}`}
          >
            🤢
          </button>
          <button 
            onClick={() => handleMoodSelect("tired", "Take some rest. Ensure you sleep well tonight, and I'll prompt you for your metrics tomorrow.")}
            className={`rounded-2xl p-3 border text-2xl flex justify-center items-center hover:scale-105 active:scale-95 transition-all ${mood === 'tired' ? 'bg-primary/10 border-primary' : 'bg-background border-border'}`}
          >
            😴
          </button>
          <button 
            onClick={() => handleMoodSelect("pain", "Headaches or other physical pain? Let me search for nearby clinics or ask questions to get context.")}
            className={`rounded-2xl p-3 border text-2xl flex justify-center items-center hover:scale-105 active:scale-95 transition-all ${mood === 'pain' ? 'bg-primary/10 border-primary' : 'bg-background border-border'}`}
          >
            🤕
          </button>
          <button 
            onClick={() => handleMoodSelect("anxious", "I hear you. Take a deep breath. I am here to help. If you ever feel unsafe, use emergency mode.")}
            className={`rounded-2xl p-3 border text-2xl flex justify-center items-center hover:scale-105 active:scale-95 transition-all ${mood === 'anxious' ? 'bg-primary/10 border-primary' : 'bg-background border-border'}`}
          >
            😰
          </button>
        </div>

        {/* Proactive Mood Feedback */}
        {moodResponse && (
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-sm text-foreground flex gap-2 items-start animate-in fade-in slide-in-from-top-4 duration-300">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <p>{moodResponse}</p>
          </div>
        )}

        {/* Multi-modal inputs */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <button 
            onClick={() => setUploadType(prev => prev === 'camera' ? null : 'camera')}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-border bg-background hover:bg-muted/30 transition-all active:scale-95 text-center"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Camera className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">Scan packaging</p>
              <p className="text-xs text-muted-foreground mt-1">Verify medicine labels</p>
            </div>
          </button>

          <button 
            onClick={() => setUploadType(prev => prev === 'voice' ? null : 'voice')}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-border bg-background hover:bg-muted/30 transition-all active:scale-95 text-center"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Mic className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">Speak naturally</p>
              <p className="text-xs text-muted-foreground mt-1">Simulate voice consultation</p>
            </div>
          </button>

          <button 
            onClick={() => setUploadType(prev => prev === 'doc' ? null : 'doc')}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-border bg-background hover:bg-muted/30 transition-all active:scale-95 text-center"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/10 text-success">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">Upload reports</p>
              <p className="text-xs text-muted-foreground mt-1">Scan blood work/lab reports</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/facilities')}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-border bg-background hover:bg-muted/30 transition-all active:scale-95 text-center"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-warning/10 text-warning">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">Share Location</p>
              <p className="text-xs text-muted-foreground mt-1">Coordinate closest clinics</p>
            </div>
          </button>
        </div>

        {/* Modal Simulators */}
        {uploadType === 'camera' && (
          <div className="p-5 rounded-2xl border border-border bg-background/50 flex flex-col items-center gap-3 animate-in fade-in duration-200">
            <p className="text-sm font-bold text-foreground">Camera Scan Simulator</p>
            <div className="h-44 w-full max-w-sm rounded-xl border border-dashed border-muted flex items-center justify-center text-xs text-muted-foreground bg-muted/10">
              [ Camera Feed Simulated ]
            </div>
            <button 
              onClick={() => {
                setUploadType(null);
                setGoals(prev => {
                  const updated = prev.map(g => g.id === 3 ? { ...g, completed: true } : g);
                  localStorage.setItem(`afya_goals_${patientId}`, JSON.stringify(updated));
                  return updated;
                });
                alert("Scan Simulated: Amoxicillin label recognized. Registered in your medication logs.");
              }}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              Simulate Scan Package (Amoxicillin)
            </button>
          </div>
        )}

        {uploadType === 'voice' && (
          <div className="p-5 rounded-2xl border border-border bg-background/50 flex flex-col items-center gap-3 animate-in fade-in duration-200">
            <p className="text-sm font-bold text-foreground">Voice Transcription Simulator</p>
            <button 
              onClick={() => {
                setUploadType(null);
                navigate('/chat', { state: { initialText: "I've had severe neck stiffness and fever since last night." } });
              }}
              className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-foreground"
            >
              Simulate Speaking: "Severe neck stiffness and fever"
            </button>
          </div>
        )}

        {uploadType === 'doc' && (
          <div className="p-5 rounded-2xl border border-border bg-background/50 flex flex-col items-center gap-3 animate-in fade-in duration-200">
            <p className="text-sm font-bold text-foreground">Lab PDF Scanner Simulator</p>
            <button 
              onClick={() => {
                setUploadType(null);
                alert("Simulated PDF parsing: Malaria Rapid Diagnostic Test (RDT) results parsed: Positive.");
                navigate('/chat', { state: { initialText: "My RDT report shows Positive. What are the next steps?" } });
              }}
              className="rounded-xl bg-success px-4 py-2 text-xs font-bold text-success-foreground"
            >
              Simulate Uploading PDF Lab Report (RDT positive)
            </button>
          </div>
        )}
      </section>

      {/* ========================================== */}
      {/* AI TIMELINE (HEALTH HISTORY WORKFLOW) */}
      {/* ========================================== */}
      <section className="grid gap-6 md:grid-cols-[1fr_1fr]">
        
        {/* Timeline View */}
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-foreground font-sans">Health Journey Timeline</h3>
          
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No recent queries in this conversation thread yet. Messages you send to the AI will populate your dynamic timeline.</p>
          ) : (
            <div className="relative border-l border-muted pl-6 space-y-6">
              {timeline.map((ev, i) => {
                const EvIcon = ev.icon;
                return (
                  <div key={i} className="relative group animate-in slide-in-from-left-4 duration-300">
                    {/* Timeline dot */}
                    <span className={`absolute -left-[37px] top-1.5 flex h-7.5 w-7.5 items-center justify-center rounded-full ${ev.bgClass} border border-background shadow-sm`}>
                      <EvIcon className={`h-4 w-4 ${ev.iconColor}`} />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-muted-foreground">
                        {ev.date ? `${ev.date} at ` : ''}{ev.time}
                      </span>
                      <p className="text-sm font-medium text-foreground mt-1 leading-5">"{ev.text}"</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PWA Install Promo or App Coverage */}
        <div className="flex flex-col justify-between gap-4">
          
          {(canInstall || isInstalled) && (
            <div className="rounded-[2rem] border border-primary/15 bg-primary/5 p-6 shadow-sm space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Progressive Web App</p>
              <h4 className="text-xl font-bold text-foreground">Use AFYAROOT like a native app.</h4>
              <p className="text-sm leading-6 text-muted-foreground">
                Install it to your home screen for faster access, offline support, and a cleaner experience.
              </p>
              {isInstalled ? (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-success/10 px-4 py-3 text-sm font-semibold text-success">
                  <span className="h-2.5 w-2.5 rounded-full bg-success" />
                  Installed and ready offline
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <PwaInstallButton className="w-full sm:w-auto" />
                  <p className="text-xs text-muted-foreground">{installLabel} to open faster next time.</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/symptoms')}
              className="rounded-2xl border border-border bg-card/60 p-4 text-left hover:bg-card hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
            >
              <Stethoscope className="h-5 w-5 text-primary" />
              <p className="text-sm font-bold text-foreground mt-3">Triage Engine</p>
              <p className="text-xs text-muted-foreground mt-1">Start Symptom Check</p>
            </button>
            <button 
              onClick={() => navigate('/facilities')}
              className="rounded-2xl border border-border bg-card/60 p-4 text-left hover:bg-card hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
            >
              <MapPin className="h-5 w-5 text-accent" />
              <p className="text-sm font-bold text-foreground mt-3">Hospitals</p>
              <p className="text-xs text-muted-foreground mt-1">Search KMHFR Clinics</p>
            </button>
            <button 
              onClick={() => navigate('/chat')}
              className="rounded-2xl border border-border bg-card/60 p-4 text-left hover:bg-card hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
            >
              <MessageCircle className="h-5 w-5 text-warning" />
              <p className="text-sm font-bold text-foreground mt-3">AI Consultation</p>
              <p className="text-xs text-muted-foreground mt-1">Chat in plain Swahili</p>
            </button>
            <button 
              onClick={() => navigate('/booking')}
              className="rounded-2xl border border-border bg-card/60 p-4 text-left hover:bg-card hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
            >
              <Calendar className="h-5 w-5 text-success" />
              <p className="text-sm font-bold text-foreground mt-3">Scheduler</p>
              <p className="text-xs text-muted-foreground mt-1">Book Appointments</p>
            </button>
          </div>

        </div>

      </section>
    </div>
  );
}
