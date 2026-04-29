import { useState, useEffect } from 'react'
import { CloudSun, Wind, Droplets, Thermometer, AlertTriangle, MapPin, Eye, CloudRain, RefreshCw } from 'lucide-react'
import { fetchWeather, type LiveWeather } from '@/services/weatherApi'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { mockFarmers } from '@/data/mockFarmers'
import { cn } from '@/utils/cn'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'

const WEATHER_BY_PROVINCE: Record<string, {
  temp: number; humidity: number; rainfall: number; wind: number; condition: string; riskScore: number; riskLevel: 'low' | 'moderate' | 'high' | 'extreme'
}> = {
  'Limpopo': { temp: 32, humidity: 48, rainfall: 8, wind: 14, condition: 'Partly Cloudy', riskScore: 42, riskLevel: 'moderate' },
  'KwaZulu-Natal': { temp: 27, humidity: 78, rainfall: 22, wind: 19, condition: 'Thunderstorms', riskScore: 74, riskLevel: 'high' },
  'North West': { temp: 29, humidity: 42, rainfall: 4, wind: 22, condition: 'Sunny', riskScore: 28, riskLevel: 'low' },
  'Mpumalanga': { temp: 24, humidity: 72, rainfall: 18, wind: 11, condition: 'Overcast', riskScore: 55, riskLevel: 'moderate' },
  'Eastern Cape': { temp: 22, humidity: 65, rainfall: 12, wind: 28, condition: 'Windy & Cloudy', riskScore: 61, riskLevel: 'high' },
  'Western Cape': { temp: 19, humidity: 58, rainfall: 5, wind: 32, condition: 'Strong Winds', riskScore: 68, riskLevel: 'high' },
  'Free State': { temp: 26, humidity: 35, rainfall: 2, wind: 16, condition: 'Sunny', riskScore: 22, riskLevel: 'low' },
  'Gauteng': { temp: 28, humidity: 55, rainfall: 14, wind: 12, condition: 'Afternoon Storm Risk', riskScore: 48, riskLevel: 'moderate' },
  'Northern Cape': { temp: 36, humidity: 18, rainfall: 0, wind: 25, condition: 'Hot & Dry', riskScore: 82, riskLevel: 'extreme' },
}

const RISK_COLORS: Record<string, 'green' | 'cyan' | 'orange' | 'red'> = { low: 'green', moderate: 'cyan', high: 'orange', extreme: 'red' }

const WEATHER_ICONS: Record<string, string> = {
  'Sunny': '☀️', 'Partly Cloudy': '⛅', 'Overcast': '☁️',
  'Thunderstorms': '⛈️', 'Windy & Cloudy': '🌬️', 'Strong Winds': '💨',
  'Hot & Dry': '🌵', 'Afternoon Storm Risk': '🌩️',
}

const forecast7Day = [
  { day: 'Thu', high: 32, low: 18, rain: 0, condition: '☀️' },
  { day: 'Fri', high: 30, low: 19, rain: 5, condition: '⛅' },
  { day: 'Sat', high: 27, low: 17, rain: 18, condition: '🌧️' },
  { day: 'Sun', high: 24, low: 15, rain: 28, condition: '⛈️' },
  { day: 'Mon', high: 26, low: 16, rain: 8, condition: '🌦️' },
  { day: 'Tue', high: 29, low: 18, rain: 2, condition: '⛅' },
  { day: 'Wed', high: 31, low: 19, rain: 0, condition: '☀️' },
]

const rainfallHistory = [
  { month: 'Oct', actual: 68, avg: 55 },
  { month: 'Nov', actual: 82, avg: 72 },
  { month: 'Dec', actual: 95, avg: 88 },
  { month: 'Jan', actual: 110, avg: 92 },
  { month: 'Feb', actual: 74, avg: 80 },
  { month: 'Mar', actual: 58, avg: 65 },
  { month: 'Apr', actual: 42, avg: 48 },
]

export default function WeatherPage() {
  const [selectedProvince, setSelectedProvince] = useState('Limpopo')
  const [liveWeather, setLiveWeather] = useState<LiveWeather | null>(null)
  const [loading, setLoading] = useState(false)
  const staticWeather = WEATHER_BY_PROVINCE[selectedProvince]

  const loadWeather = async (province: string) => {
    setLoading(true)
    const data = await fetchWeather(province)
    setLiveWeather(data)
    setLoading(false)
  }

  useEffect(() => { loadWeather(selectedProvince) }, [selectedProvince])

  /* Merge live data over static fallback */
  const weather = liveWeather
    ? { ...staticWeather, temp: liveWeather.temp, humidity: liveWeather.humidity, rainfall: liveWeather.rainfall, wind: liveWeather.windSpeed, condition: liveWeather.condition, riskScore: liveWeather.riskScore, riskLevel: liveWeather.riskLevel }
    : staticWeather

  const farmsInProvince = mockFarmers.filter((f) => f.province === selectedProvince)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#70C3E8]/20 rounded-xl flex items-center justify-center"><CloudSun size={16} className="text-[#22B3DB]" /></div>
          <div><p className="text-sm font-bold text-[#06192C]">Weather Intelligence</p><p className="text-xs text-gray-400">Forecasts and climate risk assessment per region</p></div>
        </div>
        <div className="flex items-center gap-2">
          {import.meta.env.VITE_OPENWEATHER_API_KEY
            ? <span className="text-[10px] font-bold bg-[#98CF59]/15 text-[#4a7a1e] px-2 py-0.5 rounded-full">● Live</span>
            : <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Mock data</span>}
          <MapPin size={14} className="text-gray-400" />
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40"
          >
            {Object.keys(WEATHER_BY_PROVINCE).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={() => loadWeather(selectedProvince)} disabled={loading}
            className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-[#06192C] hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Current conditions */}
      <div className="bg-gradient-to-r from-[#06192C] to-[#0d2d4a] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#22B3DB]/10" />
        <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-[#40BBB9]/8" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={13} className="text-[#40BBB9]" />
              <p className="text-[#40BBB9] text-sm font-semibold">{selectedProvince} Province</p>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-6xl">{WEATHER_ICONS[weather.condition] ?? '🌤️'}</span>
              <div>
                <p className="text-white text-4xl font-bold">{weather.temp}°C</p>
                <p className="text-white/50 text-sm">{weather.condition}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <Droplets size={14} />, label: 'Humidity', value: `${weather.humidity}%` },
              { icon: <CloudRain size={14} />, label: 'Rainfall', value: `${weather.rainfall} mm` },
              { icon: <Wind size={14} />, label: 'Wind', value: `${weather.wind} km/h` },
              { icon: <Eye size={14} />, label: 'Visibility', value: '12 km' },
            ].map((s) => (
              <div key={s.label} className="bg-white/8 border border-white/10 rounded-xl px-3 py-2.5">
                <div className="text-[#40BBB9] mb-1">{s.icon}</div>
                <p className="text-white font-bold text-sm">{s.value}</p>
                <p className="text-white/40 text-[10px]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Climate risk */}
        <div className="flex items-center gap-3 mt-4 relative">
          <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold',
            weather.riskLevel === 'extreme' ? 'bg-red-500/20 text-red-300' :
            weather.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-300' :
            weather.riskLevel === 'moderate' ? 'bg-[#40BBB9]/20 text-[#40BBB9]' :
            'bg-[#98CF59]/20 text-[#98CF59]'
          )}>
            <AlertTriangle size={12} />
            Climate Risk: {weather.riskLevel.toUpperCase()} ({weather.riskScore}/100)
          </div>
          {farmsInProvince.length > 0 && (
            <span className="text-white/40 text-xs">{farmsInProvince.length} farm{farmsInProvince.length > 1 ? 's' : ''} in this region</span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Climate Risk Score" value={weather.riskScore} suffix="/ 100"
          trend={weather.riskLevel === 'low' ? -5 : 8}
          icon={<AlertTriangle size={20} className={weather.riskScore > 60 ? 'text-red-500' : 'text-orange-400'} />}
          iconBg={weather.riskScore > 60 ? 'bg-red-100' : 'bg-orange-100'} />
        <StatCard title="Temp Today" value={`${weather.temp}°C`} trend={-2}
          icon={<Thermometer size={20} className="text-[#40BBB9]" />} iconBg="bg-[#40BBB9]/12" />
        <StatCard title="Rainfall (24h)" value={`${weather.rainfall} mm`} trend={weather.rainfall > 15 ? 40 : -10}
          icon={<CloudRain size={20} className="text-[#22B3DB]" />} iconBg="bg-[#22B3DB]/12" />
        <StatCard title="Wind Speed" value={`${weather.wind} km/h`} trend={5}
          icon={<Wind size={20} className="text-[#336599]" />} iconBg="bg-[#336599]/12" />
      </div>

      {/* 7-day forecast */}
      <Card>
        <CardHeader><CardTitle>7-Day Forecast</CardTitle><span className="text-xs text-gray-400">{selectedProvince}</span></CardHeader>
        <div className="grid grid-cols-7 gap-2">
          {forecast7Day.map((d) => (
            <div key={d.day} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-[#F4F8F6] transition-colors">
              <p className="text-xs font-semibold text-gray-400">{d.day}</p>
              <span className="text-2xl">{d.condition}</span>
              <p className="text-sm font-bold text-[#06192C]">{d.high}°</p>
              <p className="text-xs text-gray-400">{d.low}°</p>
              {d.rain > 0 && (
                <div className="flex items-center gap-0.5 text-[#22B3DB]">
                  <CloudRain size={10} />
                  <span className="text-[10px] font-semibold">{d.rain}mm</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Rainfall History (mm)</CardTitle><Badge variant="blue">vs Long-term Avg</Badge></CardHeader>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={rainfallHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f0f0f0' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="actual" name="Actual" fill="#22B3DB" radius={[4,4,0,0]} />
              <Bar dataKey="avg" name="Long-term Avg" fill="#98CF59" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader><CardTitle>Temperature Trend (°C)</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart
              data={[
                { time: '00:00', temp: 18 }, { time: '03:00', temp: 16 }, { time: '06:00', temp: 17 },
                { time: '09:00', temp: 22 }, { time: '12:00', temp: 28 }, { time: '15:00', temp: 32 },
                { time: '18:00', temp: 29 }, { time: '21:00', temp: 24 }, { time: '24:00', temp: 20 },
              ]}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f0f0f0' }} />
              <Area type="monotone" dataKey="temp" name="Temp (°C)" stroke="#f97316" strokeWidth={2.5} fill="url(#tGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Regional risk table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100"><CardTitle>Regional Climate Risk Overview</CardTitle></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {['Province', 'Condition', 'Temp', 'Humidity', 'Rainfall', 'Wind', 'Risk Level', 'Farms'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(WEATHER_BY_PROVINCE).map(([prov, w]) => (
                <tr key={prov}
                  className={cn('border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors cursor-pointer', selectedProvince === prov && 'bg-[#40BBB9]/5')}
                  onClick={() => setSelectedProvince(prov)}
                >
                  <td className="px-5 py-3 text-xs font-semibold text-[#06192C]">{prov}</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{WEATHER_ICONS[w.condition] ?? ''} {w.condition}</td>
                  <td className="px-5 py-3 text-xs font-bold text-orange-500">{w.temp}°C</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{w.humidity}%</td>
                  <td className="px-5 py-3 text-xs text-[#22B3DB] font-semibold">{w.rainfall} mm</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{w.wind} km/h</td>
                  <td className="px-5 py-3"><Badge variant={RISK_COLORS[w.riskLevel]}>{w.riskLevel}</Badge></td>
                  <td className="px-5 py-3 text-xs font-semibold text-[#06192C]">{mockFarmers.filter((f) => f.province === prov).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
