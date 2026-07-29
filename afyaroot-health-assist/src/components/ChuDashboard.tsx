import React, { useState, useEffect } from 'react';
import { 
  ChuStats, CommunityHealthUnit, fetchChuStats, fetchCommunityHealthUnits 
} from '@/services/afyaApi';
import { 
  Users, Activity, CheckCircle2, AlertTriangle, XCircle, Filter, 
  Home, RefreshCw, ShieldCheck, MapPin, Building2, Search 
} from 'lucide-react';
import { COUNTIES } from './HeroLocationBanner';

interface ChuDashboardProps {
  userCoords: { lat: number; lng: number } | null;
  locationDetails: { ward: string; subCounty: string; county: string } | null;
}

export default function ChuDashboard({ userCoords, locationDetails }: ChuDashboardProps) {
  const [stats, setStats] = useState<ChuStats | null>(null);
  const [chuList, setChuList] = useState<CommunityHealthUnit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCounty, setSelectedCounty] = useState<string>('All');
  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadChuData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsData = await fetchChuStats({
        lat: userCoords?.lat,
        lng: userCoords?.lng,
        county: selectedCounty !== 'All' ? selectedCounty : locationDetails?.county,
        ward: selectedWard !== 'All' ? selectedWard : undefined,
      });
      setStats(statsData);

      const listData = await fetchCommunityHealthUnits({
        county: selectedCounty !== 'All' ? selectedCounty : undefined,
        ward: selectedWard !== 'All' ? selectedWard : undefined,
        search: searchQuery || undefined,
      });
      setChuList(listData);
    } catch (err: any) {
      console.error('Error loading CHU dashboard data:', err);
      setError('Could not load Community Health Units data from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChuData();
  }, [userCoords, selectedCounty, selectedWard, searchQuery]);

  const filteredChus = chuList.filter((chu) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        chu.name.toLowerCase().includes(q) ||
        chu.linked_facility_name.toLowerCase().includes(q) ||
        chu.ward.toLowerCase().includes(q) ||
        chu.code.toString().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-6 md:p-8 border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Community Health Strategy
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Community Health Units (CHU) Dashboard
            </h2>
            <p className="mt-1 text-slate-300 text-sm max-w-2xl">
              Track household health coverage, Community Health Volunteers (CHVs), and linked primary dispensaries across wards.
            </p>
          </div>

          <button
            onClick={loadChuData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-input hover:bg-slate-800 text-slate-200 font-semibold text-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh Stats</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total CHUs */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-semibold tracking-wider">
            <span>Total CHUs</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats ? stats.total_chu : '--'}</span>
            <span className="text-xs text-slate-400">units registered</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Active health units across region</p>
        </div>

        {/* Fully Functional */}
        <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-400 text-xs uppercase font-semibold tracking-wider">
            <span>Fully Functional</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-300">
              {stats ? stats.fully_functional : '--'}
            </span>
            <span className="text-xs font-bold text-emerald-400">
              ({stats ? stats.fully_functional_pct : 0}%)
            </span>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${stats ? stats.fully_functional_pct : 0}%` }}
            />
          </div>
        </div>

        {/* Semi Functional */}
        <div className="glass-card rounded-2xl p-5 border border-amber-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-400 text-xs uppercase font-semibold tracking-wider">
            <span>Semi Functional</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-300">
              {stats ? stats.semi_functional : '--'}
            </span>
            <span className="text-xs font-bold text-amber-400">
              ({stats ? stats.semi_functional_pct : 0}%)
            </span>
          </div>
          <div className="mt-3 w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${stats ? stats.semi_functional_pct : 0}%` }}
            />
          </div>
        </div>

        {/* Non Functional */}
        <div className="glass-card rounded-2xl p-5 border border-red-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between text-red-400 text-xs uppercase font-semibold tracking-wider">
            <span>Non Functional</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-300">
              {stats ? stats.non_functional : '--'}
            </span>
            <span className="text-xs font-bold text-red-400">
              ({stats ? stats.non_functional_pct : 0}%)
            </span>
          </div>
          <div className="mt-3 w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-red-400 rounded-full transition-all duration-500"
              style={{ width: `${stats ? stats.non_functional_pct : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar for CHUs */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search CHU unit name, ward, or linked dispensary..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-white text-sm placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* County Filter */}
          <select
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            className="py-3 px-3 rounded-2xl glass-input text-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500 w-full sm:w-auto"
          >
            <option value="All" className="bg-slate-900">All Counties</option>
            {COUNTIES.filter(c => c !== 'All').map(c => (
              <option key={c} value={c} className="bg-slate-900">{c} County</option>
            ))}
          </select>

          {/* Ward Filter */}
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="py-3 px-3 rounded-2xl glass-input text-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500 w-full sm:w-auto"
          >
            <option value="All" className="bg-slate-900">All Wards</option>
            <option value="Shirere Ward" className="bg-slate-900">Shirere Ward</option>
            <option value="Bukhungu" className="bg-slate-900">Bukhungu Ward</option>
            <option value="Mahiakhalo" className="bg-slate-900">Mahiakhalo Ward</option>
            <option value="Kibra" className="bg-slate-900">Kibra Ward</option>
            <option value="Kawangware" className="bg-slate-900">Kawangware Ward</option>
          </select>
        </div>
      </div>

      {/* CHU List */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>Registered Community Health Units</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {filteredChus.length} units
          </span>
        </h3>

        {loading ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <RefreshCw className="w-6 h-6 animate-spin text-teal-400 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Loading Community Health Units...</p>
          </div>
        ) : filteredChus.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <p className="text-slate-400 text-sm">No Community Health Units match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredChus.map((chu) => (
              <div
                key={chu.id}
                className="glass-card-hover rounded-2xl p-5 flex flex-col justify-between border border-white/10"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-400">#{chu.code}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        chu.status === 'Fully Functional'
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                          : chu.status === 'Semi Functional'
                          ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                          : 'bg-red-500/15 border border-red-500/30 text-red-400'
                      }`}
                    >
                      {chu.status}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white">{chu.name}</h4>

                  <div className="flex items-center gap-2 mt-1.5 text-slate-300 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>{chu.ward}, {chu.constituency}, {chu.county}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="glass-input p-2 rounded-xl">
                    <span className="block text-slate-400 text-[10px] uppercase font-medium">Linked Hospital</span>
                    <span className="font-semibold text-white truncate block mt-0.5" title={chu.linked_facility_name || (chu as any).linkedFacilityName || 'Dispensary'}>
                      {chu.linked_facility_name || (chu as any).linkedFacilityName || 'Dispensary'}
                    </span>
                  </div>

                  <div className="glass-input p-2 rounded-xl">
                    <span className="block text-slate-400 text-[10px] uppercase font-medium">Households</span>
                    <span className="font-bold text-emerald-300 block mt-0.5">
                      {(chu.households_covered ?? (chu as any).householdsCovered ?? 1200).toLocaleString()}
                    </span>
                  </div>

                  <div className="glass-input p-2 rounded-xl">
                    <span className="block text-slate-400 text-[10px] uppercase font-medium">CHVs</span>
                    <span className="font-bold text-blue-300 block mt-0.5">
                      {chu.chv_count ?? (chu as any).chvCount ?? 10} Volunteers
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
