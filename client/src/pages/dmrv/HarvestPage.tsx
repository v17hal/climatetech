import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Wheat, Plus, X, AlertTriangle, TrendingUp, Flag, Sprout,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { Input } from '@/components/ui/Input'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import type { HarvestRecord, YieldSummaryRow } from '@/types'

interface FarmerOption {
  id: string
  farmerId: string
  farmName: string
  province: string
  user: { name: string; email: string }
}

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
]

const fmtDate = (d: string) => new Date(d).toISOString().slice(0, 10)
const fmt1 = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

const selectCls = 'w-full bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40 focus:border-[#40BBB9]'
const labelCls = 'text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide'

const emptyForm = {
  farmerId: '',
  region: 'Gauteng',
  cropType: '',
  harvestDate: new Date().toISOString().slice(0, 10),
  weightTonnes: '',
  moisturePercent: '',
  plotType: 'project' as 'project' | 'control',
}

export default function HarvestPage() {
  const role = useAuthStore((s) => s.user?.role)
  const readOnly = role === 'vvb_auditor' || role === 'viewer'
  const canCreate = role === 'admin' || role === 'field_officer' || role === 'agri_officer'

  const [harvests, setHarvests] = useState<HarvestRecord[]>([])
  const [summary, setSummary] = useState<YieldSummaryRow[]>([])
  const [farmers, setFarmers] = useState<FarmerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [gateMessage, setGateMessage] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [h, s] = await Promise.all([
        api.get<HarvestRecord[]>('/api/v1/harvests'),
        api.get<YieldSummaryRow[]>('/api/v1/harvests/yield-summary'),
      ])
      setHarvests(h)
      setSummary(s)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Network error — backend unreachable')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (!canCreate) return
    api.get<{ farmers: FarmerOption[] }>('/api/v1/farmers?limit=200')
      .then((r) => setFarmers(r.farmers))
      .catch(() => { /* best-effort */ })
  }, [canCreate])

  const totalProject = summary.reduce((s, r) => s + r.projectTonnes, 0)
  const totalControl = summary.reduce((s, r) => s + r.controlTonnes, 0)
  const flaggedCount = harvests.filter((h) => h.flagged).length
  const best = summary
    .filter((r) => r.yieldIncreasePercent != null)
    .reduce<YieldSummaryRow | null>((acc, r) => (acc == null || r.yieldIncreasePercent! > acc.yieldIncreasePercent! ? r : acc), null)

  /* Aggregate project vs control tonnes per region for the chart */
  const chartData = Object.values(
    summary.reduce<Record<string, { region: string; project: number; control: number }>>((acc, r) => {
      acc[r.region] ??= { region: r.region, project: 0, control: 0 }
      acc[r.region].project += r.projectTonnes
      acc[r.region].control += r.controlTonnes
      return acc
    }, {})
  )

  const recordHarvest = async () => {
    setSaving(true)
    try {
      const res = await api.post<{ harvest: HarvestRecord; gateMessage: string | null }>('/api/v1/harvests', {
        farmerId: form.farmerId || undefined,
        region: form.region,
        cropType: form.cropType,
        harvestDate: form.harvestDate,
        weightTonnes: parseFloat(form.weightTonnes),
        moisturePercent: parseFloat(form.moisturePercent),
        plotType: form.plotType,
      })
      setShowModal(false)
      setForm(emptyForm)
      if (res.gateMessage) {
        setGateMessage(res.gateMessage)
        toast(res.gateMessage, { icon: '⚠️' })
      } else {
        setGateMessage(null)
        toast.success('Harvest recorded')
      }
      fetchAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record harvest')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#06192C]">Yield &amp; Harvest Reconciliation</h1>
          <p className="text-sm text-gray-400">Project vs control plot yields — Gold Standard Co-benefits evidence</p>
        </div>
        {readOnly ? (
          <Badge variant="gray">Read-only audit access</Badge>
        ) : canCreate ? (
          <Button size="sm" onClick={() => { setForm(emptyForm); setShowModal(true) }}>
            <Plus size={14} /> Record Harvest
          </Button>
        ) : null}
      </div>

      {/* Gate 2 message from last save */}
      {gateMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-700">Out-of-Season Audit Required (Gate 2)</p>
            <p className="text-xs text-amber-700">{gateMessage}</p>
          </div>
          <button onClick={() => setGateMessage(null)} className="p-1 hover:bg-amber-100 rounded-lg text-amber-500"><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-8 h-8 border-4 border-[#40BBB9] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : loadError ? (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <AlertTriangle size={24} className="text-orange-400" />
          <p className="text-sm font-bold text-[#06192C]">Data unavailable</p>
          <p className="text-xs text-gray-400">{loadError}</p>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Project Plot Tonnes" value={fmt1(totalProject)} suffix="t"
              icon={<Sprout size={20} className="text-[#98CF59]" />} iconBg="bg-[#98CF59]/15" />
            <StatCard title="Control Plot Tonnes" value={fmt1(totalControl)} suffix="t"
              icon={<Wheat size={20} className="text-[#336599]" />} iconBg="bg-[#336599]/12" />
            <StatCard title="Best Yield Increase" value={best?.yieldIncreasePercent != null ? `${best.yieldIncreasePercent.toFixed(1)}%` : '—'}
              suffix={best ? best.region : undefined}
              icon={<TrendingUp size={20} className="text-[#40BBB9]" />} iconBg="bg-[#40BBB9]/12" />
            <StatCard title="Flagged Entries" value={flaggedCount}
              icon={<Flag size={20} className="text-amber-500" />} iconBg="bg-amber-100" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Yield summary */}
            <Card padding="none">
              <div className="px-6 py-4 border-b border-gray-100">
                <CardTitle>Yield Summary by Region &amp; Crop</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Yield Increase % is the Gold Standard Co-benefits metric</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {['Region', 'Crop', 'Project Plots', 'Control Plots', 'Project t', 'Control t', 'Yield Increase', 'Flagged'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summary.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-xs text-gray-400">No harvest data yet.</td></tr>
                    )}
                    {summary.map((r) => (
                      <tr key={`${r.region}-${r.cropType}`} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                        <td className="px-4 py-3 text-xs font-semibold text-[#06192C] whitespace-nowrap">{r.region}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 capitalize whitespace-nowrap">{r.cropType}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{r.projectPlots}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{r.controlPlots}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{fmt1(r.projectTonnes)}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{fmt1(r.controlTonnes)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {r.yieldIncreasePercent != null ? (
                            <span className={`text-xs font-bold ${r.yieldIncreasePercent > 0 ? 'text-[#4a7a1e]' : 'text-red-500'}`}>
                              {r.yieldIncreasePercent > 0 ? '+' : ''}{r.yieldIncreasePercent.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">n/a</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.flaggedEntries > 0
                            ? <Badge variant="orange">{r.flaggedEntries}</Badge>
                            : <span className="text-xs text-gray-300">0</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Chart */}
            <Card>
              <CardHeader><CardTitle>Project vs Control Tonnes per Region</CardTitle></CardHeader>
              {chartData.length === 0 ? (
                <p className="text-xs text-gray-400 py-10 text-center">No data to chart yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} formatter={(v) => `${fmt1(Number(v))} t`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="project" name="Project plots (t)" fill="#98CF59" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="control" name="Control plots (t)" fill="#336599" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Harvest entries */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100">
              <CardTitle>Harvest Entries ({harvests.length})</CardTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Date', 'Region', 'Crop', 'Farm', 'Weight', 'Moisture', 'Plot Type', 'Flag'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {harvests.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-8 text-center text-xs text-gray-400">No harvest entries yet.</td></tr>
                  )}
                  {harvests.map((h) => (
                    <tr key={h.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(h.harvestDate)}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-[#06192C] whitespace-nowrap">{h.region}</td>
                      <td className="px-5 py-3 text-xs text-gray-500 capitalize whitespace-nowrap">{h.cropType}</td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {h.farmer ? `${h.farmer.farmName} (${h.farmer.farmerId})` : '—'}
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-[#06192C] whitespace-nowrap">{fmt1(h.weightTonnes)} t</td>
                      <td className="px-5 py-3 text-xs text-gray-600">{h.moisturePercent}%</td>
                      <td className="px-5 py-3">
                        <Badge variant={h.plotType === 'project' ? 'green' : 'blue'} className="capitalize">{h.plotType}</Badge>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {h.flagged ? (
                          <span title={h.flagReason ?? 'Out-of-Season Audit Required'}>
                            <Badge variant="orange"><AlertTriangle size={10} /> Out-of-Season Audit Required</Badge>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Record Harvest modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#06192C]/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-sm font-bold text-[#06192C]">Record Harvest</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Farmer (optional)</label>
                <select className={selectCls} value={form.farmerId}
                  onChange={(e) => setForm({ ...form, farmerId: e.target.value })}>
                  <option value="">No farmer linked</option>
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>{f.farmerId} — {f.farmName} ({f.user.name})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Region</label>
                  <select className={selectCls} value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}>
                    {SA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <Input label="Crop Type" placeholder="maize" value={form.cropType}
                  onChange={(e) => setForm({ ...form, cropType: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Harvest Date" type="date" value={form.harvestDate}
                  onChange={(e) => setForm({ ...form, harvestDate: e.target.value })} />
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Plot Type</label>
                  <select className={selectCls} value={form.plotType}
                    onChange={(e) => setForm({ ...form, plotType: e.target.value as 'project' | 'control' })}>
                    <option value="project">Project</option>
                    <option value="control">Control</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Weight (tonnes)" type="number" placeholder="4.2" value={form.weightTonnes}
                  onChange={(e) => setForm({ ...form, weightTonnes: e.target.value })} />
                <Input label="Moisture %" type="number" placeholder="12.5" value={form.moisturePercent}
                  onChange={(e) => setForm({ ...form, moisturePercent: e.target.value })} />
              </div>
              <p className="text-xs text-gray-400">Gate 2: out-of-window harvests are accepted but flagged "Out-of-Season Audit Required" against the seasonality planner.</p>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={recordHarvest} loading={saving} className="flex-1"
                  disabled={!form.cropType || !form.weightTonnes || !form.moisturePercent}>
                  Record Harvest
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
