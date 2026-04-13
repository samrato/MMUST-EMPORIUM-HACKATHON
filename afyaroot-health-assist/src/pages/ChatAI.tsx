import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Bot, User, MapPin, Navigation } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import { getAIChatResponse } from '@/services/mockAI';
import { facilities } from '@/services/facilityData';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  time: string;
  facilityLink?: { name: string; lat: number; lng: number };
}

interface UserLocation {
  lat: number;
  lng: number;
  label: string;
}

export default function ChatAI() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStep, setLocationStep] = useState<'prompt' | 'detecting' | 'done'>('prompt');
  const [manualLocation, setManualLocation] = useState('');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const detectLocation = () => {
    setLocationStep('detecting');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` };
          setUserLocation(loc);
          setLocationStep('done');
          initChat(loc);
        },
        () => {
          setLocationStep('prompt');
          alert('Could not detect location. Please enter manually.');
        }
      );
    } else {
      setLocationStep('prompt');
    }
  };

  const submitManualLocation = () => {
    if (!manualLocation.trim()) return;
    const loc = { lat: 0, lng: 0, label: manualLocation.trim() };
    setUserLocation(loc);
    setLocationStep('done');
    initChat(loc);
  };

  const initChat = (loc: UserLocation) => {
    const nearest = [...facilities].sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.location.lat - loc.lat, 2) + Math.pow(a.location.lng - loc.lng, 2));
      const distB = Math.sqrt(Math.pow(b.location.lat - loc.lat, 2) + Math.pow(b.location.lng - loc.lng, 2));
      return distA - distB;
    })[0];

    setMessages([
      {
        id: '0', role: 'ai',
        text: `Hello! 👋 I'm your AFYAROOT AI health assistant.\n\n📍 Your location: ${loc.label}\n🏥 Nearest facility: ${nearest.name} (${nearest.distance} km)\n\nDescribe your symptoms and I'll help guide you to the right care.`,
        time: now(),
        facilityLink: { name: nearest.name, lat: nearest.location.lat, lng: nearest.location.lng },
      },
    ]);
  };

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIChatResponse(userMsg.text);

      // Check if response suggests a facility
      const keywords = ['hospital', 'facility', 'clinic', 'emergency', 'visit'];
      const suggestFacility = keywords.some(k => response.toLowerCase().includes(k));
      const nearest = userLocation
        ? [...facilities].sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.location.lat - userLocation.lat, 2) + Math.pow(a.location.lng - userLocation.lng, 2));
            const distB = Math.sqrt(Math.pow(b.location.lat - userLocation.lat, 2) + Math.pow(b.location.lng - userLocation.lng, 2));
            return distA - distB;
          })[0]
        : facilities[0];

      const directionText = suggestFacility
        ? `\n\n🏥 Recommended: ${nearest.name}\n📍 ${nearest.distance} km away • ${nearest.availability}% available`
        : '';

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: response + directionText,
        time: now(),
        ...(suggestFacility ? { facilityLink: { name: nearest.name, lat: nearest.location.lat, lng: nearest.location.lng } } : {}),
      }]);
      setIsTyping(false);
    }, 1200);
  };

  // Location capture screen
  if (locationStep !== 'done') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] fade-slide-up space-y-5">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
          <MapPin className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground text-center">Share Your Location</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          We need your location to find the nearest facilities and give you accurate health guidance.
        </p>

        {locationStep === 'detecting' ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Detecting location...
          </div>
        ) : (
          <>
            <button onClick={detectLocation} className="w-full max-w-xs bg-primary text-primary-foreground rounded-xl py-3.5 font-bold flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5" /> Auto-Detect My Location
            </button>
            <div className="flex items-center gap-3 w-full max-w-xs">
              <hr className="flex-1 border-border" /><span className="text-xs text-muted-foreground">or</span><hr className="flex-1 border-border" />
            </div>
            <div className="w-full max-w-xs space-y-2">
              <input
                value={manualLocation}
                onChange={e => setManualLocation(e.target.value)}
                placeholder="Enter your area (e.g. Kapsabet, Nandi)"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <button onClick={submitManualLocation} disabled={!manualLocation.trim()} className="w-full bg-secondary text-secondary-foreground rounded-xl py-3 font-semibold disabled:opacity-40">
                Continue with this location
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-10rem)] min-h-[34rem] max-h-[56rem] flex-col">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-foreground">💬 {t('chat', lang)}</h1>
        {userLocation && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-secondary rounded-full px-2 py-1">
            <MapPin className="h-3 w-3" /> {userLocation.label.slice(0, 20)}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2 fade-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
              {msg.role === 'ai' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card border border-border text-foreground rounded-bl-md'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              {msg.facilityLink && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${msg.facilityLink.lat},${msg.facilityLink.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-primary bg-primary/10 rounded-lg px-2.5 py-1.5"
                >
                  <Navigation className="h-3 w-3" /> Get Directions to {msg.facilityLink.name.split(' ').slice(0, 2).join(' ')}
                </a>
              )}
              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{msg.time}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2 items-end">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <button className="bg-secondary text-secondary-foreground rounded-xl px-3">
          <Mic className="h-5 w-5" />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder={t('typeMessage', lang)}
          className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <button onClick={sendMessage} disabled={!input.trim()} className="bg-primary text-primary-foreground rounded-xl px-4 disabled:opacity-50">
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
