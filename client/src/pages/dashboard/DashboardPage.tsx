import { Users, Leaf, Map, ShieldCheck, Activity, TrendingUp, ArrowRight, LayoutGrid } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/utils/format'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'

const carbonData = [
  { month: 'Jan', carbon: 4200, target: 5000 },
  { month: 'Feb', carbon: 5800, target: 5000 },
  { month: 'Mar', carbon: 5100, target: 5500 },
  { month: 'Apr', carbon: 6400, target: 5500 },
  { month: 'May', carbon: 7200, target: 6000 },
  { month: 'Jun', carbon: 6800, target: 6000 },
  { month: 'Jul', carbon: 8100, target: 6500 },
  { month: 'Aug', carbon: 8900, target: 6500 },
  { month: 'Sep', carbon: 9200, target: 7000 },
  { month: 'Oct', carbon: 10400, target: 7000 },
  { month: 'Nov', carbon: 11200, target: 7500 },
  { month: 'Dec', carbon: 12800, target: 7500 },
]

const enrollmentData = [
  { month: 'Jul', small: 120, medium: 80, large: 30 },
  { month: 'Aug', small: 145, medium: 95, large: 42 },
  { month: 'Sep', small: 160, medium: 110, large: 38 },
  { month: 'Oct', small: 180, medium: 125, large: 55 },
  { month: 'Nov', small: 210, medium: 140, large: 48 },
  { month: 'Dec', small: 240, medium: 160, large: 62 },
]

const recentFarmers = [
  { id: 'CSA-2024-12441', name: 'Thabo Mokoena', province: 'Limpopo', farmSize: 45, crops: 'Maize, Sorghum', status: 'active', date: '2024-12-18' },
  { id: 'CSA-2024-12440', name: 'Amina Bello', province: 'KwaZulu-Natal', farmSize: 120, crops: 'Sugar Cane', status: 'active', date: '2024-12-17' },
  { id: 'CSA-2024-12439', name: 'Samuel Osei', province: 'North West', farmSize: 30, crops: 'Soybeans', status: 'pending', date: '2024-12-17' },
  { id: 'CSA-2024-12438', name: 'Grace Mutua', province: 'Mpumalanga', farmSize: 78, crops: 'Wheat, Maize', status: 'active', date: '2024-12-16' },
  { id: 'CSA-2024-12437', name: 'Emmanuel Ndlovu', province: 'Eastern Cape', farmSize: 55, crops: 'Vegetables', status: 'active', date: '2024-12-15' },
]

const recentActivity = [
  { id: '1', type: 'enrollment', message: 'Thabo Mokoena enrolled — CSA-2024-12441', time: '2 min ago', color: 'bg-[#98CF59]' },
  { id: '2', type: 'carbon', message: 'Carbon reading submitted: Farm CSA-2024-11203 — 8.4 tCO₂/ha', time: '18 min ago', color: 'bg-[#40BBB9]' },
  { id: '3', type: 'alert', message: 'Pest alert: Fall Armyworm detected in 3 farms (Limpopo)', time: '1h ago', color: 'bg-red-400' },
  { id: '4', type: 'report', message: 'Monthly compliance report generated — November 2024', time: '2h ago', color: 'bg-[#336599]' },
  { id: '5', type: 'weather', message: 'Climate risk advisory issued for KwaZulu-Natal region', time: '3h ago', color: 'bg-orange-400' },
]

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: {color: string; name: string; value: number}[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-xs">
        <p className="font-bold text-[#06192C] mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-500">{p.name}:</span>
            <span className="font-semibold text-[#06192C]">{p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const today = formatDate(new Date().toISOString())

  return (
    <div className="flex flex-col gap-6">
      {/* Custom dashboard link */}
      <div className="flex justify-end">
        <Link to="/dashboard/custom">
          <Button variant="outline" size="sm">
            <LayoutGrid size={13} /> Customise Dashboard
          </Button>
        </Link>
      </div>

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#06192C] to-[#0d2d4a] rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#40BBB9]/10" />
        <div className="absolute right-32 bottom-0 w-32 h-32 rounded-full bg-[#98CF59]/8" />
        <div className="relative">
          <p className="text-[#66C390] text-xs font-semibold mb-1">{today}</p>
          <h2 className="text-white text-xl font-bold">
            Good morning, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-white/50 text-sm mt-1">
            Here's what's happening across your farms today.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 relative">
          <div className="text-center bg-white/8 rounded-xl px-4 py-3 border border-white/10">
            <p className="text-[#98CF59] font-bold text-lg">94%</p>
            <p className="text-white/40 text-xs">Compliance</p>
          </div>
          <div className="text-center bg-white/8 rounded-xl px-4 py-3 border border-white/10">
            <p className="text-[#40BBB9] font-bold text-lg">12.8k</p>
            <p className="text-white/40 text-xs">tCO₂ Dec</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Farmers Enrolled"
          value="12,441"
          trend={8.2}
          icon={<Users size={20} className="text-[#336599]" />}
          iconBg="bg-[#336599]/12"
        />
        <StatCard
          title="Carbon Tracked"
          value="84.2k"
          suffix="tCO₂"
          trend={12.5}
          icon={<Leaf size={20} className="text-[#40BBB9]" />}
          iconBg="bg-[#40BBB9]/12"
        />
        <StatCard
          title="Active Farms"
          value="9,814"
          trend={5.1}
          icon={<Map size={20} className="text-[#98CF59]" />}
          iconBg="bg-[#98CF59]/15"
        />
        <StatCard
          title="Compliance Rate"
          value="94%"
          trend={2.3}
          icon={<ShieldCheck size={20} className="text-[#66C390]" />}
          iconBg="bg-[#66C390]/15"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Carbon trend */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Carbon Sequestration Trend (tCO₂)</CardTitle>
            <div className="flex items-center gap-2 text-xs text-[#40BBB9] font-semibold">
              <TrendingUp size={14} />
              +52% YTD
            </div>
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={carbonData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#40BBB9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#40BBB9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#98CF59" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#98CF59" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="target" name="Target" stroke="#98CF59" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#targetGrad)" />
              <Area type="monotone" dataKey="carbon" name="Actual" stroke="#40BBB9" strokeWidth={2.5} fill="url(#carbonGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Enrollment by farm size */}
        <Card>
          <CardHeader>
            <CardTitle>New Enrollments</CardTitle>
            <span className="text-xs text-gray-400">Last 6 months</span>
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={enrollmentData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="small" name="Small" fill="#98CF59" radius={[3, 3, 0, 0]} />
              <Bar dataKey="medium" name="Medium" fill="#40BBB9" radius={[3, 3, 0, 0]} />
              <Bar dataKey="large" name="Large" fill="#336599" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent farmers */}
        <Card className="xl:col-span-2" padding="none">
          <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
            <CardTitle>Recent Enrollments</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-[#40BBB9] gap-1">
              View all <ArrowRight size={13} />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {['Farmer ID', 'Name', 'Province', 'Farm Size', 'Status', 'Enrolled'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentFarmers.map((f) => (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                    <td className="px-6 py-3 text-xs font-mono font-semibold text-[#40BBB9]">{f.id}</td>
                    <td className="px-6 py-3 text-xs font-semibold text-[#06192C]">{f.name}</td>
                    <td className="px-6 py-3 text-xs text-gray-500">{f.province}</td>
                    <td className="px-6 py-3 text-xs text-gray-500">{f.farmSize} ha</td>
                    <td className="px-6 py-3">
                      <Badge variant={f.status === 'active' ? 'green' : 'orange'}>
                        {f.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400">{formatDate(f.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardHeader>
            <CardTitle>Live Activity</CardTitle>
            <Activity size={16} className="text-[#40BBB9]" />
          </CardHeader>
          <div className="flex flex-col gap-3">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.color}`} />
                <div>
                  <p className="text-xs text-[#06192C] font-medium leading-snug">{a.message}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
