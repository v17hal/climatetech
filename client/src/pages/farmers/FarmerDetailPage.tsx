import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, MapPin, Phone, Mail, Leaf, Droplets, BarChart3, ShieldCheck, Calendar } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/format'
import { mockFarmers, generateCarbonRecords } from '@/data/mockFarmers'
import { FarmerFormModal } from './components/FarmerFormModal'
import type { Farmer } from '@/types'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const LSM_COLORS: Record<string, 'green' | 'cyan' | 'blue' | 'orange' | 'red'> = {
  LSM1: 'red', LSM2: 'orange', LSM3: 'cyan', LSM4: 'blue', LSM5: 'green',
}
const STATUS_COLORS: Record<string, 'green' | 'orange' | 'gray'> = {
  active: 'green', pending: 'orange', inactive: 'gray',
}

export default function FarmerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [farmers, setFarmers] = useState(mockFarmers)
  const [showEdit, setShowEdit] = useState(false)

  const farmer = farmers.find((f) => f.id === id)
  if (!farmer) return (
    <div className="text-center py-20 text-gray-400">
      <p className="text-lg font-bold mb-2">Farmer not found</p>
      <Button variant="outline" onClick={() => navigate('/farmers')}>
        <ArrowLeft size={14} /> Back to Farmers
      </Button>
    </div>
  )

  const carbonRecords = generateCarbonRecords(farmer.id)
  const latestCarbon = carbonRecords[carbonRecords.length - 1]

  const chartData = carbonRecords.map((r) => ({
    month: new Date(r.date).toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' }),
    carbon: r.carbonLevel,
    moisture: r.moisture,
    ph: r.soilPH,
  }))

  const handleSave = (data: Partial<Farmer>) => {
    setFarmers((prev) => prev.map((f) => f.id === farmer.id ? { ...f, ...data } : f))
    setShowEdit(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/farmers')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#06192C] transition-colors font-medium"
        >
          <ArrowLeft size={16} /> Back to Farmers
        </button>
        <Button size="sm" onClick={() => setShowEdit(true)}>
          <Edit2 size={14} /> Edit Profile
        </Button>
      </div>

      {/* Profile header */}
      <div className="bg-gradient-to-r from-[#06192C] to-[#0d2d4a] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#40BBB9]/10" />
        <div className="absolute right-32 bottom-0 w-32 h-32 rounded-full bg-[#98CF59]/8" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#98CF59] to-[#40BBB9] flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {farmer.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-white text-xl font-bold">{farmer.name}</h1>
              <Badge variant={STATUS_COLORS[farmer.status]}>{farmer.status}</Badge>
              {farmer.lsmCategory && <Badge variant={LSM_COLORS[farmer.lsmCategory]}>{farmer.lsmCategory}</Badge>}
            </div>
            <p className="text-[#40BBB9] font-mono text-sm font-semibold">{farmer.farmerId}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-white/50 text-xs">
              <span className="flex items-center gap-1.5"><Mail size={11} />{farmer.email}</span>
              <span className="flex items-center gap-1.5"><Phone size={11} />{farmer.phone}</span>
              <span className="flex items-center gap-1.5"><MapPin size={11} />{farmer.district}, {farmer.province}</span>
              <span className="flex items-center gap-1.5"><Calendar size={11} />Enrolled {formatDate(farmer.enrolledAt)}</span>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-3 shrink-0">
            {[
              { label: 'Farm Size', value: `${farmer.farmSize} ${farmer.farmSizeUnit}`, icon: <Leaf size={14} /> },
              { label: 'Carbon (tCO₂/ha)', value: latestCarbon.carbonLevel.toFixed(2), icon: <BarChart3 size={14} /> },
              { label: 'Soil pH', value: latestCarbon.soilPH.toFixed(1), icon: <Droplets size={14} /> },
              { label: 'LSM Score', value: farmer.lsmScore ?? 'N/A', icon: <ShieldCheck size={14} /> },
            ].map((s) => (
              <div key={s.label} className="bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 text-center min-w-24">
                <div className="text-[#40BBB9] flex justify-center mb-1">{s.icon}</div>
                <p className="text-white font-bold text-sm">{s.value}</p>
                <p className="text-white/40 text-[10px]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Carbon trend */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Carbon Sequestration History</CardTitle>
            <span className="text-xs text-gray-400">tCO₂ per hectare</span>
          </CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#40BBB9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#40BBB9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f0f0f0' }} />
              <Area type="monotone" dataKey="carbon" name="Carbon (tCO₂/ha)" stroke="#40BBB9" strokeWidth={2.5} fill="url(#cGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Farm info */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Farm Details</CardTitle></CardHeader>
            <div className="flex flex-col gap-2.5 text-sm">
              {[
                { label: 'Farm Name', value: farmer.farmName },
                { label: 'Size', value: `${farmer.farmSize} ${farmer.farmSizeUnit}` },
                { label: 'Province', value: farmer.province },
                { label: 'District', value: farmer.district },
              ].map((r) => (
                <div key={r.label} className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-gray-400 text-xs">{r.label}</span>
                  <span className="text-xs font-semibold text-[#06192C]">{r.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Crops & Practices</CardTitle></CardHeader>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Crops</p>
                <div className="flex flex-wrap gap-1.5">
                  {farmer.cropTypes.map((c) => (
                    <span key={c} className="text-[10px] bg-[#98CF59]/12 text-[#4a7a1e] px-2 py-0.5 rounded-full font-semibold">{c}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Practices</p>
                <div className="flex flex-wrap gap-1.5">
                  {farmer.farmingPractices.map((p) => (
                    <span key={p} className="text-[10px] bg-[#40BBB9]/12 text-[#1e7a79] px-2 py-0.5 rounded-full font-semibold">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent carbon readings */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100">
          <CardTitle>Carbon Readings</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {['Date', 'Carbon (tCO₂/ha)', 'Soil pH', 'Organic Matter', 'Moisture %', 'Method'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...carbonRecords].reverse().slice(0, 6).map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                  <td className="px-5 py-3 text-xs font-medium text-[#06192C]">{formatDate(r.date)}</td>
                  <td className="px-5 py-3 text-xs font-bold text-[#40BBB9]">{r.carbonLevel}</td>
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

      {showEdit && (
        <FarmerFormModal farmer={farmer} onClose={() => setShowEdit(false)} onSave={handleSave} />
      )}
    </div>
  )
}
