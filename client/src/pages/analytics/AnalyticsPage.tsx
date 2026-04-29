import { useState, useMemo } from 'react'
import {
  FileBarChart, Download, FileText, Table2, Filter,
  TrendingUp, Leaf, Users, ShieldCheck, DollarSign,
  BarChart3, RefreshCw, Eye, FileSpreadsheet,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { cn } from '@/utils/cn'
import { mockFarmers, generateCarbonRecords, provinceOptions } from '@/data/mockFarmers'
import { exportPDF, exportCSV, exportXLS } from '@/utils/exportReport'
import { formatDate } from '@/utils/format'
import toast from 'react-hot-toast'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar,
} from 'recharts'

/* ── report templates ── */
type ReportType = 'carbon' | 'financial' | 'performance' | 'compliance' | 'custom'

interface ReportTemplate {
  id: ReportType
  title: string
  description: string
  icon: React.ReactNode
  color: string
  columns: string[]
}

const TEMPLATES: ReportTemplate[] = [
  {
    id: 'carbon',
    title: 'Carbon Metrics Report',
    description: 'Soil carbon levels, sequestration trends, and compliance status per farm',
    icon: <Leaf size={18} />,
    color: '#40BBB9',
    columns: ['Farmer ID', 'Farmer Name', 'Farm', 'Province', 'Farm Size (ha)', 'Carbon (tCO₂/ha)', 'Soil pH', 'Organic Matter (%)', 'Moisture (%)', 'Method', 'Date'],
  },
  {
    id: 'financial',
    title: 'Financial Summary Report',
    description: 'Income, expenses, profit margins, and carbon credit earnings per farm',
    icon: <DollarSign size={18} />,
    color: '#98CF59',
    columns: ['Farmer ID', 'Farmer Name', 'Farm', 'Province', 'Farm Size (ha)', 'LSM Category', 'Est. Income (R)', 'Est. Expenses (R)', 'Net Profit (R)', 'Margin (%)'],
  },
  {
    id: 'performance',
    title: 'Farm Performance Report',
    description: 'Crop yield, irrigation efficiency, pest incidents, and overall farm health',
    icon: <BarChart3 size={18} />,
    color: '#336599',
    columns: ['Farmer ID', 'Farmer Name', 'Farm', 'Province', 'Crops', 'Farm Size (ha)', 'LSM Score', 'Status', 'Practices', 'Enrolled Date'],
  },
  {
    id: 'compliance',
    title: 'Compliance & MRV Report',
    description: 'Carbon credit eligibility, MRV status, and sustainability certifications',
    icon: <ShieldCheck size={18} />,
    color: '#66C390',
    columns: ['Farmer ID', 'Farmer Name', 'Province', 'LSM Category', 'Carbon Credits Eligible', 'Compliance Status', 'Last Reading', 'Avg Carbon (tCO₂/ha)'],
  },
]

/* ── chart data ── */
const monthlyTrend = [
  { month: 'Jul', carbon: 4.2, farmers: 420, income: 84 },
  { month: 'Aug', month2: 'Aug', carbon: 4.6, farmers: 480, income: 96 },
  { month: 'Sep', carbon: 4.9, farmers: 510, income: 78 },
  { month: 'Oct', carbon: 5.3, farmers: 560, income: 112 },
  { month: 'Nov', carbon: 5.8, farmers: 620, income: 143 },
  { month: 'Dec', carbon: 6.4, farmers: 710, income: 167 },
  { month: 'Jan', carbon: 6.9, farmers: 780, income: 89 },
  { month: 'Feb', carbon: 7.2, farmers: 840, income: 94 },
  { month: 'Mar', carbon: 7.8, farmers: 910, income: 118 },
  { month: 'Apr', carbon: 8.4, farmers: 998, income: 131 },
]

const provinceCarbon = mockFarmers.map((f) => ({
  name: f.province.split(' ').map((w) => w[0]).join(''),
  fullName: f.province,
  carbon: parseFloat((3.5 + Math.random() * 4).toFixed(2)),
  farms: 1,
})).reduce((acc: { name: string; fullName: string; carbon: number; farms: number }[], cur) => {
  const existing = acc.find((a) => a.name === cur.name)
  if (existing) { existing.farms += 1; existing.carbon = parseFloat(((existing.carbon + cur.carbon) / 2).toFixed(2)) }
  else acc.push(cur)
  return acc
}, [])

const PIE_COLORS = ['#40BBB9', '#98CF59', '#336599', '#66C390', '#22B3DB']

const lsmDist = [
  { name: 'LSM1', value: 1 }, { name: 'LSM2', value: 1 },
  { name: 'LSM3', value: 2 }, { name: 'LSM4', value: 4 }, { name: 'LSM5', value: 2 },
]

const radarMetrics = [
  { metric: 'Carbon', value: 78 }, { metric: 'Compliance', value: 94 },
  { metric: 'Irrigation', value: 81 }, { metric: 'LSM Score', value: 68 },
  { metric: 'Yield', value: 72 }, { metric: 'Soil Health', value: 85 },
]

/* ── row generators ── */
function generateCarbonRows() {
  return mockFarmers.flatMap((f) => {
    const records = generateCarbonRecords(f.id)
    const latest = records[records.length - 1]
    return [{
      'Farmer ID': f.farmerId,
      'Farmer Name': f.name,
      'Farm': f.farmName,
      'Province': f.province,
      'Farm Size (ha)': f.farmSize,
      'Carbon (tCO₂/ha)': latest.carbonLevel,
      'Soil pH': latest.soilPH,
      'Organic Matter (%)': latest.organicMatter,
      'Moisture (%)': latest.moisture,
      'Method': latest.inputMethod,
      'Date': formatDate(latest.date),
    }]
  })
}

function generateFinancialRows() {
  return mockFarmers.map((f) => {
    const income = Math.round(f.farmSize * (800 + Math.random() * 600))
    const expenses = Math.round(income * (0.45 + Math.random() * 0.2))
    const profit = income - expenses
    return {
      'Farmer ID': f.farmerId,
      'Farmer Name': f.name,
      'Farm': f.farmName,
      'Province': f.province,
      'Farm Size (ha)': f.farmSize,
      'LSM Category': f.lsmCategory ?? 'N/A',
      'Est. Income (R)': `R${income.toLocaleString()}`,
      'Est. Expenses (R)': `R${expenses.toLocaleString()}`,
      'Net Profit (R)': `R${profit.toLocaleString()}`,
      'Margin (%)': `${Math.round((profit / income) * 100)}%`,
    }
  })
}

function generatePerformanceRows() {
  return mockFarmers.map((f) => ({
    'Farmer ID': f.farmerId,
    'Farmer Name': f.name,
    'Farm': f.farmName,
    'Province': f.province,
    'Crops': f.cropTypes.join(', '),
    'Farm Size (ha)': f.farmSize,
    'LSM Score': f.lsmScore ?? 'N/A',
    'Status': f.status,
    'Practices': f.farmingPractices.join(', '),
    'Enrolled Date': formatDate(f.enrolledAt),
  }))
}

function generateComplianceRows() {
  return mockFarmers.map((f) => {
    const records = generateCarbonRecords(f.id)
    const avg = records.reduce((s, r) => s + r.carbonLevel, 0) / records.length
    return {
      'Farmer ID': f.farmerId,
      'Farmer Name': f.name,
      'Province': f.province,
      'LSM Category': f.lsmCategory ?? 'Not Scored',
      'Carbon Credits Eligible': f.status === 'active' ? 'Yes' : 'Pending',
      'Compliance Status': f.status === 'active' ? 'Compliant' : f.status === 'pending' ? 'Under Review' : 'Non-Compliant',
      'Last Reading': formatDate(records[records.length - 1].date),
      'Avg Carbon (tCO₂/ha)': avg.toFixed(2),
    }
  })
}

const ROW_GENERATORS = {
  carbon: generateCarbonRows,
  financial: generateFinancialRows,
  performance: generatePerformanceRows,
  compliance: generateComplianceRows,
  custom: generatePerformanceRows,
}

/* ── component ── */
export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'builder'>('overview')
  const [selectedTemplate, setSelectedTemplate] = useState<ReportType>('carbon')
  const [province, setProvince] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('2024-07-01')
  const [dateTo, setDateTo] = useState('2025-04-23')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [exporting, setExporting] = useState<'pdf' | 'csv' | 'xlsx' | null>(null)

  const template = TEMPLATES.find((t) => t.id === selectedTemplate)!

  const filteredFarmers = useMemo(() => {
    return mockFarmers.filter((f) =>
      (!province || f.province === province) &&
      (!status || f.status === status)
    )
  }, [province, status])

  const rows = useMemo(() => ROW_GENERATORS[selectedTemplate]().filter((row) => {
    if (province && (row['Province'] !== province)) return false
    return true
  }), [selectedTemplate, province])

  const doExport = async (format: 'pdf' | 'csv' | 'xlsx') => {
    setExporting(format)
    await new Promise((r) => setTimeout(r, 400))
    const filename = `carbonsmart-${selectedTemplate}-report-${new Date().toISOString().split('T')[0]}`
    try {
      if (format === 'pdf') exportPDF(template.title, `Province: ${province || 'All'} · Status: ${status || 'All'} · ${dateFrom} to ${dateTo}`, template.columns, rows, filename)
      else if (format === 'csv') exportCSV(template.columns, rows, filename)
      else exportXLS(template.title, template.columns, rows, filename)
      toast.success(`${format.toUpperCase()} exported successfully`)
    } catch {
      toast.error('Export failed — please try again')
    }
    setExporting(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#336599]/12 rounded-xl flex items-center justify-center">
            <FileBarChart size={16} className="text-[#336599]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#06192C]">Analytics & Reporting</p>
            <p className="text-xs text-gray-400">Customisable dashboards and multi-format exports</p>
          </div>
        </div>
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
          {(['overview', 'builder'] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={cn('px-4 py-2 text-xs font-semibold capitalize transition-colors',
                activeTab === t ? 'bg-[#06192C] text-white' : 'bg-white text-gray-400 hover:text-[#06192C]')}>
              {t === 'overview' ? '📊 Overview' : '🗂 Report Builder'}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Farmers Enrolled" value="12,441" trend={8.2}
              icon={<Users size={20} className="text-[#336599]" />} iconBg="bg-[#336599]/12" />
            <StatCard title="Avg Carbon" value="7.2" suffix="tCO₂/ha" trend={12.5}
              icon={<Leaf size={20} className="text-[#40BBB9]" />} iconBg="bg-[#40BBB9]/12" />
            <StatCard title="Compliance Rate" value="94%" trend={2.3}
              icon={<ShieldCheck size={20} className="text-[#98CF59]" />} iconBg="bg-[#98CF59]/15" />
            <StatCard title="Revenue YTD" value="R1.1M" trend={22.4}
              icon={<DollarSign size={20} className="text-[#66C390]" />} iconBg="bg-[#66C390]/15" />
          </div>

          {/* Main charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Multi-line trend */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Platform Growth — Carbon, Farmers & Revenue</CardTitle>
                <Badge variant="green"><TrendingUp size={10} /> All metrics up</Badge>
              </CardHeader>
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={monthlyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f0f0f0' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="left" type="monotone" dataKey="carbon" name="Carbon (tCO₂/ha)" stroke="#40BBB9" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="income" name="Revenue (R'000)" stroke="#98CF59" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* LSM distribution */}
            <Card>
              <CardHeader><CardTitle>LSM Distribution</CardTitle></CardHeader>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={lsmDist} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={60} innerRadius={36} paddingAngle={3}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {lsmDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2">
                <ResponsiveContainer width="100%" height={60}>
                  <RadarChart data={radarMetrics} cx="50%" cy="50%" outerRadius={26}>
                    <PolarGrid stroke="#f0f0f0" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 8, fill: '#9ca3af' }} />
                    <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                    <Radar dataKey="value" stroke="#40BBB9" fill="#40BBB9" fillOpacity={0.25} strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-center text-gray-400 mt-1">Platform Health Radar</p>
              </div>
            </Card>
          </div>

          {/* Province carbon + farmer enrollments */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Carbon by Province (tCO₂/ha)</CardTitle></CardHeader>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={provinceCarbon} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f0f0f0' }}
                    formatter={(v: number, _n: string, p: { payload: { fullName: string } }) => [v, p.payload.fullName]} />
                  <Bar dataKey="carbon" name="Carbon (tCO₂/ha)" fill="#40BBB9" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardHeader><CardTitle>Farmer Enrollment Growth</CardTitle></CardHeader>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={monthlyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#98CF59" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#98CF59" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f0f0f0' }} />
                  <Area type="monotone" dataKey="farmers" name="Farmers Enrolled" stroke="#98CF59" strokeWidth={2.5} fill="url(#fGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* KPI summary table */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <CardTitle>Farm KPI Summary</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setSelectedTemplate('performance'); setActiveTab('builder') }}>
                  <FileText size={13} /> Full Report
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Farm', 'Province', 'Size (ha)', 'LSM', 'Carbon (tCO₂/ha)', 'Status', 'Crops'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockFarmers.map((f) => {
                    const records = generateCarbonRecords(f.id)
                    const avg = (records.reduce((s, r) => s + r.carbonLevel, 0) / records.length).toFixed(2)
                    return (
                      <tr key={f.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                        <td className="px-5 py-3">
                          <div>
                            <p className="text-xs font-semibold text-[#06192C]">{f.farmName}</p>
                            <p className="text-[10px] font-mono text-[#40BBB9]">{f.farmerId}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">{f.province}</td>
                        <td className="px-5 py-3 text-xs font-medium text-[#06192C]">{f.farmSize}</td>
                        <td className="px-5 py-3">
                          {f.lsmCategory
                            ? <Badge variant={f.lsmCategory === 'LSM5' ? 'green' : f.lsmCategory === 'LSM4' ? 'blue' : 'cyan'}>{f.lsmCategory}</Badge>
                            : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3 text-xs font-bold text-[#40BBB9]">{avg}</td>
                        <td className="px-5 py-3">
                          <Badge variant={f.status === 'active' ? 'green' : f.status === 'pending' ? 'orange' : 'gray'}>{f.status}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {f.cropTypes.slice(0, 2).map((c) => (
                              <span key={c} className="text-[10px] bg-[#98CF59]/12 text-[#4a7a1e] px-1.5 py-0.5 rounded-full font-medium">{c}</span>
                            ))}
                            {f.cropTypes.length > 2 && <span className="text-[10px] text-gray-400">+{f.cropTypes.length - 2}</span>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ── REPORT BUILDER TAB ── */}
      {activeTab === 'builder' && (
        <>
          {/* Template picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                className={cn('text-left rounded-2xl p-4 border-2 transition-all',
                  selectedTemplate === t.id ? 'shadow-md scale-[1.01]' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm')}
                style={selectedTemplate === t.id ? { borderColor: t.color } : {}}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: t.color + '20', color: t.color }}>
                  {t.icon}
                </div>
                <p className="text-xs font-bold text-[#06192C] mb-1">{t.title}</p>
                <p className="text-[10px] text-gray-400 leading-relaxed">{t.description}</p>
              </button>
            ))}
          </div>

          {/* Filters */}
          <Card padding="sm">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mr-1">
                <Filter size={13} /> Filters
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Province</label>
                <select value={province} onChange={(e) => setProvince(e.target.value)}
                  className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40">
                  <option value="">All Provinces</option>
                  {provinceOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40">
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40" />
              </div>
              <button onClick={() => { setProvince(''); setStatus(''); setDateFrom('2024-07-01'); setDateTo('2025-04-23') }}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#06192C] px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                <RefreshCw size={12} /> Reset
              </button>
            </div>
          </Card>

          {/* Report summary + export */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Summary */}
            <Card className="flex-1" padding="sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: template.color + '20', color: template.color }}>
                  {template.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#06192C]">{template.title}</p>
                  <p className="text-xs text-gray-400">{rows.length} records · {template.columns.length} columns</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px]">
                {[
                  { label: 'Province', value: province || 'All' },
                  { label: 'Status', value: status || 'All' },
                  { label: 'Period', value: `${dateFrom} → ${dateTo}` },
                ].map((f) => (
                  <div key={f.label} className="bg-[#F4F8F6] rounded-lg px-2.5 py-1.5">
                    <span className="text-gray-400">{f.label}: </span>
                    <span className="font-semibold text-[#06192C]">{f.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Export buttons */}
            <Card padding="sm" className="shrink-0">
              <p className="text-xs font-bold text-[#06192C] mb-3">Export Report</p>
              <div className="flex flex-col gap-2">
                <Button variant="primary" className="w-full justify-start gap-3" loading={exporting === 'pdf'} onClick={() => doExport('pdf')}>
                  <FileText size={16} className="text-red-500" /> Export as PDF
                  <span className="ml-auto text-[10px] opacity-60">Branded layout</span>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3" loading={exporting === 'csv'} onClick={() => doExport('csv')}>
                  <Table2 size={16} /> Export as CSV
                  <span className="ml-auto text-[10px] text-gray-400">Spreadsheet</span>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3" loading={exporting === 'xlsx'} onClick={() => doExport('xlsx')}>
                  <FileSpreadsheet size={16} /> Export as Excel
                  <span className="ml-auto text-[10px] text-gray-400">.xlsx</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 text-[#40BBB9]" onClick={() => setPreviewOpen(true)}>
                  <Eye size={16} /> Preview Data
                </Button>
              </div>
            </Card>
          </div>

          {/* Column list */}
          <Card padding="sm">
            <p className="text-xs font-bold text-[#06192C] mb-3">Report Columns ({template.columns.length})</p>
            <div className="flex flex-wrap gap-2">
              {template.columns.map((col) => (
                <div key={col} className="flex items-center gap-1.5 bg-[#F4F8F6] border border-gray-100 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-[#06192C]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#40BBB9]" />
                  {col}
                </div>
              ))}
            </div>
          </Card>

          {/* Data preview table */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <CardTitle>Data Preview</CardTitle>
                <p className="text-[10px] text-gray-400 mt-0.5">Showing first 5 of {rows.length} records</p>
              </div>
              <Button size="sm" onClick={() => doExport('pdf')} loading={exporting === 'pdf'}>
                <Download size={13} /> Export PDF
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {template.columns.map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                      {template.columns.map((col) => (
                        <td key={col} className="px-4 py-3 text-xs text-[#06192C] whitespace-nowrap">{String(row[col] ?? '—')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Full preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#06192C]/50 backdrop-blur-sm" onClick={() => setPreviewOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-sm font-bold text-[#06192C]">{template.title} — Full Preview</h2>
                <p className="text-xs text-gray-400">{rows.length} records</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => doExport('csv')}>CSV</Button>
                <Button size="sm" variant="outline" onClick={() => doExport('xlsx')}>XLS</Button>
                <Button size="sm" onClick={() => doExport('pdf')} loading={exporting === 'pdf'}>
                  <Download size={13} /> PDF
                </Button>
                <button onClick={() => setPreviewOpen(false)} className="ml-2 p-2 hover:bg-gray-100 rounded-xl text-gray-400">✕</button>
              </div>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#06192C]">
                  <tr>
                    {template.columns.map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-[10px] font-semibold text-white uppercase tracking-wide whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={cn('border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-[#F4F8F6]/50')}>
                      {template.columns.map((col) => (
                        <td key={col} className="px-4 py-2.5 text-xs text-[#06192C] whitespace-nowrap">{String(row[col] ?? '—')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
