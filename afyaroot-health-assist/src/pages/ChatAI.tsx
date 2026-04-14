import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Mic, MicOff, Volume2, MapPin, Loader2, Navigation, AlertTriangle, Compass } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import { getGeminiResponse } from '@/services/geminiService';
import { getNearbyHospitals, NearbyFacility } from '@/services/placesService';
import { useVoice } from '@/hooks/use-voice';
import { useUser } from '@/hooks/use-user';
import { logAiInteraction } from '@/services/dataService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  facility?: NearbyFacility;
}

function SafeMarkdown({ content }: { content: string }) {
  // Simple markdown-to-React transformer for basic formatting
  const lines = content.split('\n');
  
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Handle bold text **bold**
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const formattedLine = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-extrabold text-foreground underline decoration-primary/30">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        // Handle list items starting with * or -
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2 pl-2 py-0.5">
              <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
              <p className="text-sm leading-relaxed font-medium">{formattedLine.map(p => typeof p === 'string' ? p.replace(/^[*-\s]+/, '') : p)}</p>
            </div>
          );
        }

        return (
          <p key={i} className="text-sm leading-relaxed font-medium min-h-[1em]">
            {formattedLine}
          </p>
        );
      })}
    </div>
  );
}

export default function ChatAI() {
  const { lang } = useLanguage();
  const { patientId } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'ready' | 'error'>('idle');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyHospitals, setNearbyHospitals] = useState<NearbyFacility[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { isListening, startListening, stopListening, speak } = useVoice();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const initLocation = () => {
    setLocationStatus('detecting');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          const hospitals = await getNearbyHospitals(loc.lat, loc.lng);
          setNearbyHospitals(hospitals);
          setLocationStatus('ready');
          
          setMessages([
            { 
              id: '0', 
              role: 'assistant', 
              content: `Hello! 👋 I have detected your location. I can see ${hospitals.length} medical facilities nearby. \n\nHow are you feeling? Describe your symptoms, or ask me for directions to the nearest hospital.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        },
        () => setLocationStatus('error'),
        { timeout: 10000 }
      );
    } else {
      setLocationStatus('error');
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;
    const startedAt = Date.now();

    const userMessage: Message = { 
      id: Date.now().toString(),
      role: 'user', 
      content: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const context = {
      language: lang,
      user_location: location,
      nearby_facilities: nearbyHospitals.slice(0, 5).map(h => ({
        name: h.name,
        address: h.address,
        distance: h.distance,
        open: h.open_now
      }))
    };

    const aiResponse = await getGeminiResponse(messageText, context);
    const mentionedHospital = nearbyHospitals.find(h => aiResponse.toLowerCase().includes(h.name.toLowerCase())) || nearbyHospitals[0];

    const assistantMessage: Message = { 
      id: (Date.now() + 1).toString(),
      role: 'assistant', 
      content: aiResponse,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...(aiResponse.toLowerCase().match(/direction|route|how to get|navigate|go to/) ? { facility: mentionedHospital } : {})
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setLoading(false);
    speak(aiResponse.replace(/[#*]/g, ''));

    void logAiInteraction({
      patientId,
      messageType: "chat",
      language: lang,
      inputText: messageText,
      responseText: aiResponse,
      durationMs: Date.now() - startedAt,
    }).catch((error: unknown) => {
      console.error("Failed to store chat interaction:", error);
    });
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((text) => handleSend(text));
    }
  };

  if (locationStatus !== 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-6">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${locationStatus === 'detecting' ? 'bg-primary/10 animate-pulse' : 'bg-secondary'}`}>
          <MapPin className={`h-12 w-12 ${locationStatus === 'detecting' ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">AI Health Assistant</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Before we start, I need your location to guide you to the right medical facilities.
          </p>
        </div>
        
        {locationStatus === 'idle' && (
          <button onClick={initLocation} className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black shadow-lg flex items-center gap-2 active:scale-95 transition-all">
            Start AI Consultation
          </button>
        )}
        
        {locationStatus === 'detecting' && (
          <div className="flex items-center gap-2 text-primary font-bold">
            <Loader2 className="h-5 w-5 animate-spin" /> Identifying Location...
          </div>
        )}
        
        {locationStatus === 'error' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emergency font-bold justify-center">
              <AlertTriangle className="h-5 w-5" /> Location Access Denied
            </div>
            <button onClick={initLocation} className="bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-bold">
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-2xl mx-auto w-full px-2">
      <div className="flex items-center justify-between mb-4 bg-background/80 backdrop-blur-sm py-2 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">🤖 {t('aiAssistant', lang)}</h1>
        <div className="flex items-center gap-1 text-[10px] bg-success/10 text-success px-3 py-1 rounded-full font-black uppercase tracking-widest">
          <Compass className="h-3 w-3" /> Navigation Active
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4 scrollbar-hide">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[90%] rounded-2xl p-4 shadow-sm ${
              m.role === 'user' 
                ? 'bg-primary text-primary-foreground rounded-tr-none' 
                : 'bg-card border border-border text-foreground rounded-tl-none'
            }`}>
              <div className="flex items-center gap-2 mb-1.5 opacity-60">
                {m.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                <span className="text-[10px] font-black uppercase tracking-widest">{m.role}</span>
              </div>
              {m.role === 'assistant' ? (
                <SafeMarkdown content={m.content} />
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{m.content}</p>
              )}
              
              {m.facility && (
                <div className="mt-3 p-3 bg-secondary/50 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Navigation className="h-3 w-3 text-primary" />
                    <p className="text-[10px] font-black uppercase text-primary">AI Route Guidance Active</p>
                  </div>
                  <p className="text-xs font-bold">{m.facility.name}</p>
                  <p className="text-[10px] text-muted-foreground">{m.facility.address}</p>
                  <button 
                    onClick={() => speak(`I am guiding you to ${m.facility?.name}. Please listen to the instructions I provided in the chat.`)}
                    className="mt-2 w-full bg-primary/10 text-primary py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Volume2 className="h-3 w-3" /> Replay Voice Guide
                  </button>
                </div>
              )}

              {m.role === 'assistant' && (
                <button onClick={() => speak(m.content.replace(/[#*]/g, ''))} className="mt-2 text-primary p-1">
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-tl-none p-4 flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground font-black uppercase tracking-widest animate-pulse">Calculating Route...</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2 items-center bg-card border border-border p-2 rounded-2xl shadow-lg">
        <button onClick={toggleMic} className={`p-4 rounded-xl transition-all ${isListening ? 'bg-emergency text-white animate-pulse shadow-lg scale-110' : 'bg-secondary text-secondary-foreground'}`}>
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask for a hospital or route..." className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-foreground font-bold" />
        <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="bg-primary text-primary-foreground p-4 rounded-xl shadow-md">
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
