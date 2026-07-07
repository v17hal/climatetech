import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { CalendarRange, Plus, X, AlertTriangle, Check } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { Input } from '@/components/ui/Input'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import type { SeasonalityPlan } from '@/types'

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
]

const fmtDate = (d: string) => new Date(d).toISOString().slice(0, 10)

const varianceDays = (planned: string, actual: string) =>
  Math.round((new Date(actual).getTime() - new Date(planned).getTime()) / 86_400_000)

const selectCls = 'w-full bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40 focus:border-[#40BBB9]'
const labelCls = 'text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide'

const emptyForm = {
  region: 'Gauteng',
  cropType: '',
  year: String(new Date().getFullYear()),
  plannedPlantingDate: '',
  windowStart: '',
  windowEnd: '',
  actualPlantingDate: '',
}

export default function SeasonalityPage() {
  const role = useAuthStore((s) => s.user?.role)
  const readOnly = role === 'vvb_auditor' || role === 'viewer'
  const isAdmin = role === 'admin'

  const [plans, setPlans] = useState<SeasonalityPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [modalError, setModalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  /* Inline "set actual planting date" state */
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [patching, setPatching] = useState(false)

  const fetchPlans = useCallback(async () => {
    try {
      const data = await api.get<SeasonalityPlan[]>('/api/v1/seasonality')
      setPlans(data)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Network error — backend unreachable')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const addPlan = async () => {
    setModalError(null)
    setSaving(true)
    try {
      await api.post('/api/v1/seasonality', {
        region: form.region,
        cropType: form.cropType,
        year: parseInt(form.year, 10),
        plannedPlantingDate: form.plannedPlantingDate,
        windowStart: form.windowStart,
        windowEnd: form.windowEnd,
        ...(form.actualPlantingDate ? { actualPlantingDate: form.actualPlantingDate } : {}),
      })
      toast.success('Seasonality plan saved')
      setShowModal(false)
      setForm(emptyForm)
      fetchPlans()
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  const setActual = async (id: string) => {
    if (!editDate) return
    setPatching(true)
    try {
      await api.patch(`/api/v1/seasonality/${id}`, { actualPlantingDate: editDate })
      toast.success('Actual planting date recorded')
      setEditingId(null)
      setEditDate('')
      fetchPlans()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update plan')
    } finally {
      setPatching(false)
    }
  }

  const withActual = plans.filter((p) => p.actualPlantingDate)
  const lateCount = withActual.filter((p) => Math.abs(varianceDays(p.plannedPlantingDate, p.actualPlantingDate!)) > 14).length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#06192C]">Seasonality Planner</h1>
          <p className="text-sm text-gray-400">Planned vs actual planting dates and harvest windows per region &amp; crop (Gate 2 baseline)</p>
        </div>
        {readOnly ? (
          <Badge variant="gray">Read-only audit access</Badge>
        ) : isAdmin ? (
          <Button size="sm" onClick={() => { setForm(emptyForm); setModalError(null); setShowModal(true) }}>
            <Plus size={14} /> Add Plan
          </Button>
        ) : null}
      </div>

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
            <StatCard title="Plans" value={plans.length}
              icon={<CalendarRange size={20} className="text-[#40BBB9]" />} iconBg="bg-[#40BBB9]/12" />
            <StatCard title="Regions Covered" value={new Set(plans.map((p) => p.region)).size}
              icon={<CalendarRange size={20} className="text-[#336599]" />} iconBg="bg-[#336599]/12" />
            <StatCard title="Actual Dates Recorded" value={withActual.length}
              icon={<Check size={20} className="text-[#98CF59]" />} iconBg="bg-[#98CF59]/15" />
            <StatCard title="Variance > 14 Days" value={lateCount}
              icon={<AlertTriangle size={20} className="text-amber-500" />} iconBg="bg-amber-100" />
          </div>

          {/* Plans table */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100">
              <CardTitle>Planting Plans ({plans.length})</CardTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Region', 'Crop', 'Year', 'Planned Planting', 'Actual Planting', 'Variance', 'Harvest Window'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plans.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-8 text-center text-xs text-gray-400">No seasonality plans yet.</td></tr>
                  )}
                  {plans.map((p) => {
                    const variance = p.actualPlantingDate ? varianceDays(p.plannedPlantingDate, p.actualPlantingDate) : null
                    return (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                        <td className="px-5 py-3 text-xs font-semibold text-[#06192C] whitespace-nowrap">{p.region}</td>
                        <td className="px-5 py-3 text-xs text-gray-500 capitalize whitespace-nowrap">{p.cropType}</td>
                        <td className="px-5 py-3 text-xs text-gray-600">{p.year}</td>
                        <td className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(p.plannedPlantingDate)}</td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          {p.actualPlantingDate ? (
                            <span className="text-xs text-gray-600">{fmtDate(p.actualPlantingDate)}</span>
                          ) : editingId === p.id ? (
                            <span className="inline-flex items-center gap-2">
                              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                                className="bg-[#F4F8F6] border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40" />
                              <Button size="sm" onClick={() => setActual(p.id)} loading={patching} disabled={!editDate}>Save</Button>
                              <button onClick={() => { setEditingId(null); setEditDate('') }}
                                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><X size={13} /></button>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <span className="text-xs text-gray-300">—</span>
                              {isAdmin && (
                                <Button variant="ghost" size="sm" onClick={() => { setEditingId(p.id); setEditDate('') }}>Set actual</Button>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          {variance != null ? (
                            <Badge variant={Math.abs(variance) > 14 ? 'orange' : 'green'}>
                              {variance > 0 ? '+' : ''}{variance} days
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {fmtDate(p.windowStart)} – {fmtDate(p.windowEnd)}
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

      {/* Add Plan modal (admin only) */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#06192C]/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-sm font-bold text-[#06192C]">Add Seasonality Plan</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {modalError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs font-semibold text-red-700">{modalError}</p>
                </div>
              )}
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
                <Input label="Year" type="number" placeholder="2026" value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })} />
                <Input label="Planned Planting Date" type="date" value={form.plannedPlantingDate}
                  onChange={(e) => setForm({ ...form, plannedPlantingDate: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Harvest Window Start" type="date" value={form.windowStart}
                  onChange={(e) => setForm({ ...form, windowStart: e.target.value })} />
                <Input label="Harvest Window End" type="date" value={form.windowEnd}
                  onChange={(e) => setForm({ ...form, windowEnd: e.target.value })} />
              </div>
              <Input label="Actual Planting Date (optional)" type="date" value={form.actualPlantingDate}
                onChange={(e) => setForm({ ...form, actualPlantingDate: e.target.value })} />
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={addPlan} loading={saving} className="flex-1"
                  disabled={!form.cropType || !form.plannedPlantingDate || !form.windowStart || !form.windowEnd}>
                  Save Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
