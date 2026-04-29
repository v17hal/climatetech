import { useState } from 'react'
import { Droplets, Plus, Calendar, AlertTriangle, TrendingDown, X } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { Input } from '@/components/ui/Input'
import { mockFarmers } from '@/data/mockFarmers'
import { formatDate } from '@/utils/format'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'

const usageData = [
  { month: 'Jul', actual: 4200, target: 5000 },
  { month: 'Aug', actual: 5100, target: 5000 },
  { month: 'Sep', actual: 4800, target: 4500 },
  { month: 'Oct', actual: 3900, target: 4000 },
  { month: 'Nov', actual: 4600, target: 4500 },
  { month: 'Dec', actual: 5200, target: 5000 },
  { month: 'Jan', actual: 3800, target: 4000 },
  { month: 'Feb', actual: 3200, target: 3500 },
  { month: 'Mar', actual: 4100, target: 4000 },
  { month: 'Apr', actual: 3700, target: 4000 },
]

const farmUsage = mockFarmers.slice(0, 6).map((f) => ({
  farm: f.farmName.split(' ').slice(0, 2).join(' '),
  used: Math.round(f.farmSize * (28 + Math.random() * 20)),
  target: Math.round(f.farmSize * 40),
  efficiency: Math.round(70 + Math.random() * 25),
}))

const schedule = [
  { id: '1', farm: 'Mokoena Green Farm', zone: 'Zone A — Maize Field', date: '2025-04-24', time: '06:00', duration: '2h 30m', method: 'Drip', status: 'scheduled' },
  { id: '2', farm: 'Bello Sugar Estate', zone: 'North Block', date: '2025-04-24', time: '14:00', duration: '4h', method: 'Sprinkler', status: 'scheduled' },
  { id: '3', farm: 'Mutua Wheat & Maize', zone: 'East Fields', date: '2025-04-23', time: '07:00', duration: '3h', method: 'Flood', status: 'completed' },
  { id: '4', farm: 'Asante Grain Farm', zone: 'All Zones', date: '2025-04-25', time: '05:30', duration: '6h', method: 'Centre Pivot', status: 'scheduled' },
  { id: '5', farm: 'Khumalo Citrus Farm', zone: 'Citrus Grove', date: '2025-04-22', time: '18:00', duration: '1h 30m', method: 'Drip', status: 'completed' },
]

const STATUS_COLORS: Record<string, 'cyan' | 'green' | 'orange'> = { scheduled: 'cyan', completed: 'green', overdue: 'orange' }

export default function IrrigationPage() {
  const [showModal, setShowModal] = useState(false)
  const [newEntry, setNewEntry] = useState({ farmId: '', zone: '', date: '', time: '', duration: '', method: 'Drip' })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#22B3DB]/12 rounded-xl flex items-center justify-center"><Droplets size={16} className="text-[#22B3DB]" /></div>
          <div><p className="text-sm font-bold text-[#06192C]">Irrigation Management</p><p className="text-xs text-gray-400">Water usage tracking and scheduling</p></div>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}><Plus size={14} /> Schedule Irrigation</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Water Used" value="42.6k" suffix="L/month" trend={-8.2}
          icon={<Droplets size={20} className="text-[#22B3DB]" />} iconBg="bg-[#22B3DB]/12" />
        <StatCard title="Avg Efficiency" value="81%" trend={4.1}
          icon={<TrendingDown size={20} className="text-[#98CF59]" />} iconBg="bg-[#98CF59]/15" />
        <StatCard title="Scheduled Today" value={schedule.filter((s) => s.status === 'scheduled').length} trend={0}
          icon={<Calendar size={20} className="text-[#40BBB9]" />} iconBg="bg-[#40BBB9]/12" />
        <StatCard title="Alerts" value="2" trend={-1}
          icon={<AlertTriangle size={20} className="text-orange-500" />} iconBg="bg-orange-100" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Monthly Water Usage (Litres)</CardTitle><Badge variant="cyan"><TrendingDown size={10} /> -8% vs target</Badge></CardHeader>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={usageData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22B3DB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22B3DB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f0f0f0' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="target" name="Target (L)" stroke="#98CF59" strokeWidth={1.5} strokeDasharray="5 3" fill="none" />
              <Area type="monotone" dataKey="actual" name="Actual (L)" stroke="#22B3DB" strokeWidth={2.5} fill="url(#wGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader><CardTitle>Water Efficiency by Farm</CardTitle></CardHeader>
          <div className="flex flex-col gap-3">
            {farmUsage.map((f) => (
              <div key={f.farm}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#06192C] truncate max-w-[140px]">{f.farm}</span>
                  <span className="font-bold text-[#22B3DB]">{f.efficiency}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#22B3DB]" style={{ width: `${f.efficiency}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Farm Water Usage vs Target (L)</CardTitle></CardHeader>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={farmUsage} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="farm" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f0f0f0' }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="used" name="Used (L)" fill="#22B3DB" radius={[4,4,0,0]} />
            <Bar dataKey="target" name="Target (L)" fill="#98CF59" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <CardTitle>Irrigation Schedule</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-[#40BBB9]" onClick={() => setShowModal(true)}>
            <Plus size={13} /> Add
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {['Farm', 'Zone', 'Date', 'Time', 'Duration', 'Method', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                  <td className="px-5 py-3 text-xs font-semibold text-[#06192C]">{s.farm}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{s.zone}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{formatDate(s.date)}</td>
                  <td className="px-5 py-3 text-xs font-mono text-[#22B3DB]">{s.time}</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{s.duration}</td>
                  <td className="px-5 py-3"><span className="text-[10px] bg-[#22B3DB]/12 text-[#22B3DB] px-2 py-0.5 rounded-full font-semibold">{s.method}</span></td>
                  <td className="px-5 py-3"><Badge variant={STATUS_COLORS[s.status]}>{s.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#06192C]/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-sm font-bold text-[#06192C]">Schedule Irrigation</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Farm</label>
                <select className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40"
                  value={newEntry.farmId} onChange={(e) => setNewEntry({ ...newEntry, farmId: e.target.value })}>
                  <option value="">Select farm...</option>
                  {mockFarmers.map((f) => <option key={f.id} value={f.id}>{f.farmName}</option>)}
                </select>
              </div>
              <Input label="Zone / Field" placeholder="Zone A — Maize Field" value={newEntry.zone} onChange={(e) => setNewEntry({ ...newEntry, zone: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date" type="date" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} />
                <Input label="Time" type="time" value={newEntry.time} onChange={(e) => setNewEntry({ ...newEntry, time: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Duration" placeholder="2h 30m" value={newEntry.duration} onChange={(e) => setNewEntry({ ...newEntry, duration: e.target.value })} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Method</label>
                  <select className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40"
                    value={newEntry.method} onChange={(e) => setNewEntry({ ...newEntry, method: e.target.value })}>
                    {['Drip', 'Sprinkler', 'Flood', 'Centre Pivot', 'Furrow'].map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={() => setShowModal(false)} className="flex-1">Schedule</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
