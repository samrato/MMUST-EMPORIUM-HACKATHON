import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/services/languageService';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const diseaseData = [
  { name: 'Malaria', cases: 245, trend: 'up' },
  { name: 'Respiratory', cases: 189, trend: 'down' },
  { name: 'Diarrhea', cases: 134, trend: 'up' },
  { name: 'Skin', cases: 87, trend: 'stable' },
  { name: 'Eye', cases: 56, trend: 'down' },
];

const weeklyData = [
  { day: 'Mon', emergency: 3, high: 8, normal: 22 },
  { day: 'Tue', emergency: 5, high: 12, normal: 18 },
  { day: 'Wed', emergency: 2, high: 6, normal: 25 },
  { day: 'Thu', emergency: 4, high: 9, normal: 20 },
  { day: 'Fri', emergency: 7, high: 15, normal: 16 },
  { day: 'Sat', emergency: 6, high: 11, normal: 12 },
  { day: 'Sun', emergency: 1, high: 4, normal: 28 },
];

const facilityLoad = [
  { name: 'Kapsabet', value: 78 },
  { name: 'Nandi Hills', value: 62 },
  { name: 'Chepterit', value: 45 },
  { name: 'Kabiyet', value: 20 },
  { name: 'Mosoriot', value: 70 },
];

const COLORS = ['hsl(0, 72%, 51%)', 'hsl(25, 95%, 53%)', 'hsl(122, 39%, 34%)', 'hsl(199, 89%, 48%)', 'hsl(142, 71%, 45%)'];

export default function AnalyticsPage() {
  const { lang } = useLanguage();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">📊 {t('liveAnalytics', lang)}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Today', value: '47', color: 'text-primary' },
          { label: 'Emergency', value: '5', color: 'text-emergency' },
          { label: 'Facilities', value: '6', color: 'text-accent' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Disease Cases Bar Chart */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="font-semibold text-sm mb-3 text-foreground">Disease Cases This Month</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={diseaseData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 20%, 88%)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="cases" fill="hsl(122, 39%, 34%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Trends */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="font-semibold text-sm mb-3 text-foreground">Weekly Case Trends</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 20%, 88%)" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="emergency" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="high" stroke="hsl(25, 95%, 53%)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="normal" stroke="hsl(122, 39%, 34%)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Facility Load Pie */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="font-semibold text-sm mb-3 text-foreground">Facility Occupancy</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={facilityLoad} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}%`}>
              {facilityLoad.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
