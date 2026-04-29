import { useState } from 'react'
import { Leaf, Plus, Download, TrendingUp, Droplets, FlaskConical, Wind, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { formatDate } from '@/utils/format'
import { mockFarmers, generateCarbonRecords } from '@/data/mockFarmers'
import { CarbonEntryModal } from './components/CarbonEntryModal'
import type { CarbonRecord } from '@/types'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, BarChart, Bar, Legend,
} from 'recharts'

const allRecords = mockFarmers.flatMap((f) => generateCarbonRecords(f.id))

const monthlyAvg = Array.from({ length: 10 }, (_, i) => {
  const base = 3.2 + i * 0.35
  return {
    month: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'][i],
    avg: parseFloat(base.toFixed(2)),
    target: parseFloat((4.0 + i * 0.2).toFixed(2)),
    sequestered: parseFloat((base * 120).toFixed(0)),
  }
})

const provinceData = [
  { province: 'Limpopo', carbon: 6.2, farms: 3 },
  { province: 'KZN', carbon: 5.8, farms: 2 },
  { province: 'North West', carbon: 4.9, farms: 1 },
  { province: 'Mpumalanga', carbon: 5.4, farms: 2 },
  { province: 'Eastern Cape', carbon: 4.7, farms: 1 },
  { province: 'Western Cape', carbon: 7.1, farms: 1 },
]

const radarData = [
  { metric: 'Carbon Level', value: 78 },
  { metric: 'Soil pH', value: 82 },
  { metric: 'Organic Matter', value: 65 },
  { metric: 'Moisture', value: 71 },
  { metric: 'Compliance', value: 94 },
]

const recentReadings = allRecords
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 10)
  .map((r) => ({
    ...r,
    farmerName: mockFarmers.find((f) => f.id === r.farmerId)?.name ?? 'Unknown',
    farmerId: mockFarmers.find((f) => f.id === r.farmerId)?.farmerId ?? '-',
  }))

export default function CarbonPage() {
  const [showEntry, setShowEntry] = useState(false)
  const [records, setRecords] = useState(allRecords)

  const totalCarbon = records.reduce((s, r) => s + r.carbonLevel, 0)
  const avgCarbon = totalCarbon / records.length
  const avgPH = records.reduce((s, r) => s + r.soilPH, 0) / records.length
  const avgMoisture = records.reduce((s, r) => s + r.moisture, 0) / records.length

  const handleAdd = (record: Omit<CarbonRecord, 'id'>) => {
    setRecords((prev) => [{ ...record, id: crypto.randomUUID() }, ...prev])
    setShowEntry(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#40BBB9]/12 rounded-xl flex items-center justify-center">
            <Leaf size={16} className="text-[#40BBB9]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#06192C]">{records.length} Total Readings</p>
            <p className="text-xs text-gray-400">Across {mockFarmers.length} farms</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download size={14} /> Export Report</Button>
          <Button size="sm" onClick={() => setShowEntry(true)}><Plus size={14} /> Add Reading</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Avg Carbon Level" value={avgCarbon.toFixed(2)} suffix="tCO₂/ha"
          trend={12.4} icon={<Leaf size={20} className="text-[#40BBB9]" />} iconBg="bg-[#40BBB9]/12" />
        <StatCard title="Total Sequestered" value={(totalCarbon / 1000).toFixed(1)} suffix="ktCO₂"
          trend={8.1} icon={<TrendingUp size={20} className="text-[#98CF59]" />} iconBg="bg-[#98CF59]/15" />
        <StatCard title="Avg Soil pH" value={avgPH.toFixed(1)}
          trend={1.2} icon={<FlaskConical size={20} className="text-[#22B3DB]" />} iconBg="bg-[#22B3DB]/12" />
        <StatCard title="Avg Moisture" value={avgMoisture.toFixed(1)} suffix="%"
          trend={-2.3} icon={<Droplets size={20} className="text-[#336599]" />} iconBg="bg-[#336599]/12" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Carbon trend */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Carbon Sequestration Trend</CardTitle>
            <Badge variant="green"><TrendingUp size={10} /> +52% YTD</Badge>
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyAvg} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#40BBB9" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#40BBB9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#98CF59" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#98CF59" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f0f0f0' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="target" name="Target" stroke="#98CF59" strokeWidth={1.5} strokeDasharray="5 3" fill="url(#cg2)" />
              <Area type="monotone" dataKey="avg" name="Avg Carbon" stroke="#40BBB9" strokeWidth={2.5} fill="url(#cg1)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Soil health radar */}
        <Card>
          <CardHeader><CardTitle>Soil Health Score</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#f0f0f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="value" stroke="#40BBB9" fill="#40BBB9" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Province breakdown + compliance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Carbon by Province</CardTitle>
            <span className="text-xs text-gray-400">Average tCO₂/ha</span>
          </CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={provinceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="province" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f0f0f0' }} />
              <Bar dataKey="carbon" name="Carbon (tCO₂/ha)" fill="#40BBB9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Compliance summary */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <FileText size={16} className="text-gray-400" />
          </CardHeader>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Carbon Credits Eligible', value: '8,412', color: 'bg-[#98CF59]', pct: 68 },
              { label: 'Under Review', value: '2,104', color: 'bg-orange-400', pct: 17 },
              { label: 'Non-Compliant', value: '1,925', color: 'bg-red-400', pct: 15 },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">{s.label}</span>
                  <span className="text-xs font-bold text-[#06192C]">{s.value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-2 w-full text-xs">
              <FileText size={13} /> Generate Compliance Report
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent readings table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <CardTitle>Recent Carbon Readings</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-[#40BBB9]" onClick={() => setShowEntry(true)}>
            <Plus size={13} /> Add Reading
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {['Farmer', 'Farm ID', 'Date', 'Carbon tCO₂/ha', 'Soil pH', 'Organic Matter', 'Moisture', 'Method'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentReadings.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                  <td className="px-5 py-3 text-xs font-semibold text-[#06192C]">{r.farmerName}</td>
                  <td className="px-5 py-3 text-xs font-mono text-[#40BBB9]">{r.farmerId}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{formatDate(r.date)}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold text-[#40BBB9]">{r.carbonLevel}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600">{r.soilPH}</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{r.organicMatter}%</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{r.moisture}%</td>
                  <td className="px-5 py-3">
                    <Badge variant={r.inputMethod === 'sensor' ? 'cyan' : 'gray'}>{r.inputMethod}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showEntry && (
        <CarbonEntryModal
          farmers={mockFarmers}
          onClose={() => setShowEntry(false)}
          onSave={handleAdd}
        />
      )}
    </div>
  )
}
