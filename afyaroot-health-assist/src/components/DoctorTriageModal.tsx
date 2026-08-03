import React, { useState } from 'react';
import { 
  runTriage, getSmartRoute, TriageResponse, RouteResponse, Facility 
} from '@/services/afyaApi';
import { 
  X, Stethoscope, AlertTriangle, ShieldCheck, Sparkles, Navigation, 
  Calendar, CheckCircle2, RefreshCw, Activity, HeartPulse, ArrowRight, Brain 
} from 'lucide-react';

interface DoctorTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoords: { lat: number; lng: number } | null;
  locationDetails: { ward: string; subCounty: string; county: string } | null;
  onBookAppointment: (facility: Facility) => void;
  onGetDirections: (facility: Facility) => void;
}

export default function DoctorTriageModal({
  isOpen,
  onClose,
  userCoords,
  locationDetails,
  onBookAppointment,
  onGetDirections,
}: DoctorTriageModalProps) {
  const [symptomsInput, setSymptomsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResponse | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomsInput.trim()) return;

    setLoading(true);
    setError(null);
    setTriageResult(null);
    setRouteResult(null);

    const lat = userCoords?.lat || -0.2833;
    const lng = userCoords?.lng || 34.75;
    const county = locationDetails?.county || 'Kakamega';

    try {
      // Step 1: Run AI Clinical Triage
      const triageRes = await runTriage(symptomsInput, county);
      setTriageResult(triageRes);

      // Step 2: Run Smart Hospital Routing Engine
      const routeRes = await getSmartRoute(symptomsInput, lat, lng);
      setRouteResult(routeRes);
    } catch (err: any) {
      console.error('Triage submission error:', err);
      setError('AI Care Access service temporary error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'critical':
      case 'emergency':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-500/20 border border-red-500/50 text-red-300 font-bold text-sm animate-pulse">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>CRITICAL EMERGENCY RISK</span>
          </div>
        );
      case 'urgent':
      case 'high':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>URGENT CARE RECOMMENDED</span>
          </div>
        );
      case 'moderate':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500/20 border border-blue-500/50 text-blue-300 font-bold text-sm">
            <Activity className="w-5 h-5 text-blue-400" />
            <span>MODERATE RISK</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>LOW RISK — ROUTINE CARE</span>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl my-8 fade-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full glass-input text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Doctor Brain Triage Engine
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-semibold">
                Multilingual (Swahili / English)
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">AI Clinical Triage & Smart Routing</h2>
          </div>
        </div>

        {/* Symptom Input Form */}
        <form onSubmit={handleTriageSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Describe Patient Symptoms (e.g. "Kichwa kinaniuma na nina homa tangu jana", "Chest tightness and high fever")
            </label>
            <div className="relative">
              <textarea
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                placeholder="Type symptoms here in Swahili or English..."
                rows={3}
                className="w-full p-4 rounded-2xl glass-input text-white text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-500 resize-none"
              />
              <div className="absolute right-3 bottom-3 flex gap-2">
                {['kichwa', 'homa', 'kifua', 'stomach pain'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setSymptomsInput((prev) => (prev ? `${prev}, ${term}` : term))}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-white/10"
                  >
                    +{term}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-slate-400 italic">
              * Non-diagnostic clinical navigation based on KMHFR facility capability matching algorithms.
            </p>
            <button
              type="submit"
              disabled={loading || !symptomsInput.trim()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Clinical Triage...</span>
                </>
              ) : (
                <>
                  <Stethoscope className="w-4 h-4" />
                  <span>Run Doctor Triage</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Triage & Routing Results Section */}
        {triageResult && (
          <div className="space-y-6 pt-6 border-t border-white/10 fade-slide-up">
            {/* Risk Classification Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-5 rounded-2xl border border-white/10">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Evaluated Symptom Summary
                </span>
                <p className="text-white font-bold text-base mt-0.5">
                  "{triageResult.data?.symptom_summary || symptomsInput}"
                </p>
              </div>

              {getRiskBadge(triageResult.data?.risk || 'low')}
            </div>

            {/* Recommended Services Badges */}
            {triageResult.data?.required_services && triageResult.data.required_services.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Required Clinical Services
                </h4>
                <div className="flex flex-wrap gap-2">
                  {triageResult.data.required_services.map((srv, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {srv}
                    </span>
                  ))}
                  {triageResult.data.recommended_keph_level && (
                    <span className="px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                      Required: {triageResult.data.recommended_keph_level}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Top Recommended Hospitals Scored Grid */}
            {routeResult?.results?.ranked_facilities && routeResult.results.ranked_facilities.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Top Recommended Hospitals Scored & Ranked
                </h3>

                <div className="space-y-3">
                  {routeResult.results.ranked_facilities.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.facility.id || idx}
                      className={`p-5 rounded-2xl glass-card border transition ${
                        idx === 0 ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'border-white/10'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {idx === 0 && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                                #1 Match Choice
                              </span>
                            )}
                            <span className="text-xs font-mono text-slate-400">#{item.facility.code}</span>
                            <span className="text-xs font-semibold text-blue-300">{item.facility.keph_level}</span>
                          </div>

                          <h4 className="text-lg font-extrabold text-white">{item.facility.name}</h4>
                          <p className="text-xs text-slate-300 mt-1">
                            {item.recommendation_reason || `Distance: ${item.distance_km.toFixed(1)} km • ~${item.estimated_travel_minutes} mins travel`}
                          </p>
                        </div>

                        {/* Overall Score Badge */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-2xl font-black text-emerald-300">{item.total_score}%</span>
                            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Total Score</span>
                          </div>

                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                onBookAppointment(item.facility);
                                onClose();
                              }}
                              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Book Here</span>
                            </button>
                            <button
                              onClick={() => {
                                onGetDirections(item.facility);
                                onClose();
                              }}
                              className="px-4 py-2 rounded-xl glass-input hover:bg-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5"
                            >
                              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Route</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Score Breakdown Bar */}
                      {item.score_breakdown && (
                        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-1.5 rounded-lg bg-slate-900/60">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Match (40%)</span>
                            <span className="font-bold text-emerald-400">{item.score_breakdown.match_score}%</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-slate-900/60">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Distance (30%)</span>
                            <span className="font-bold text-blue-400">{item.score_breakdown.distance_score}%</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-slate-900/60">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Queue (20%)</span>
                            <span className="font-bold text-teal-400">{item.score_breakdown.queue_score}%</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-slate-900/60">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">KEPH (10%)</span>
                            <span className="font-bold text-indigo-400">{item.score_breakdown.level_score}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
