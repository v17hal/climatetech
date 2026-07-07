import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Factory, Plus, X, AlertTriangle, Truck, Sprout, Package, Scale,
  CheckCircle2, XCircle,
} from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { Input } from '@/components/ui/Input'
import { api, ApiError } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import type { BiocharBatch, DcocStatus } from '@/types'

interface MassBalanceTotals {
  produced: number
  shipped: number
  applied: number
  remaining: number
}

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

const FEEDSTOCKS = ['rice_husk', 'wood_waste', 'maize_stover', 'sugarcane_bagasse', 'other']

const FEEDSTOCK_VARIANT: Record<string, 'green' | 'cyan' | 'blue' | 'orange' | 'gray'> = {
  rice_husk: 'green', wood_waste: 'orange', maize_stover: 'cyan', sugarcane_bagasse: 'blue', other: 'gray',
}

const DCOC_BADGE: Record<DcocStatus, { variant: 'green' | 'orange' | 'red' | 'gray'; label: string }> = {
  produced: { variant: 'gray', label: 'Produced' },
  sampled: { variant: 'orange', label: 'Yellow — Sampled' },
  lab_received: { variant: 'orange', label: 'Orange — Lab Received' },
  results_entered: { variant: 'green', label: 'Green — Results Entered' },
  rejected: { variant: 'red', label: 'Rejected' },
}

const feedstockLabel = (f: string) => f.replace(/_/g, ' ')
const fmtDate = (d: string) => new Date(d).toISOString().slice(0, 10)
const fmt1 = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

const selectCls = 'w-full bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40 focus:border-[#40BBB9]'
const labelCls = 'text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide'

const emptyBatchForm = {
  productionDate: new Date().toISOString().slice(0, 10),
  feedstockType: 'rice_husk',
  pyrolysisTemp: '',
  rawWeightTonnes: '',
  region: 'Gauteng',
}

const emptyShipForm = { date: new Date().toISOString().slice(0, 10), weightTonnes: '', destination: '', waybillNumber: '', mileageKm: '' }
const emptyAppForm = { farmerId: '', date: new Date().toISOString().slice(0, 10), weightTonnes: '', notes: '' }

export default function BiocharPage() {
  const role = useAuthStore((s) => s.user?.role)
  const readOnly = role === 'vvb_auditor' || role === 'viewer'
  const canCreate = role === 'admin' || role === 'field_officer' || role === 'agri_officer'

  const [batches, setBatches] = useState<BiocharBatch[]>([])
  const [balance, setBalance] = useState<MassBalanceTotals | null>(null)
  const [farmers, setFarmers] = useState<FarmerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  /* New production log modal */
  const [showNewModal, setShowNewModal] = useState(false)
  const [batchForm, setBatchForm] = useState(emptyBatchForm)
  const [gateError, setGateError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  /* Manage batch modal */
  const [manageBatch, setManageBatch] = useState<BiocharBatch | null>(null)
  const [shipForm, setShipForm] = useState(emptyShipForm)
  const [appForm, setAppForm] = useState(emptyAppForm)
  const [shipGateError, setShipGateError] = useState<string | null>(null)
  const [appGateError, setAppGateError] = useState<string | null>(null)
  const [shipSaving, setShipSaving] = useState(false)
  const [appSaving, setAppSaving] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [list, mb] = await Promise.all([
        api.get<BiocharBatch[]>('/api/v1/biochar'),
        api.get<MassBalanceTotals>('/api/v1/biochar/mass-balance'),
      ])
      setBatches(list)
      setBalance(mb)
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
      .catch(() => { /* farmer dropdown is best-effort */ })
  }, [canCreate])

  const openManage = async (id: string) => {
    try {
      const detail = await api.get<BiocharBatch>(`/api/v1/biochar/${id}`)
      setManageBatch(detail)
      setShipForm(emptyShipForm)
      setAppForm(emptyAppForm)
      setShipGateError(null)
      setAppGateError(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load batch')
    }
  }

  const createBatch = async () => {
    setGateError(null)
    setSaving(true)
    try {
      await api.post('/api/v1/biochar', {
        productionDate: batchForm.productionDate,
        feedstockType: batchForm.feedstockType,
        pyrolysisTemp: parseFloat(batchForm.pyrolysisTemp),
        rawWeightTonnes: parseFloat(batchForm.rawWeightTonnes),
        region: batchForm.region,
      })
      toast.success('Production log created')
      setShowNewModal(false)
      setBatchForm(emptyBatchForm)
      fetchAll()
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setGateError(err.message)
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to create batch')
      }
    } finally {
      setSaving(false)
    }
  }

  const logShipment = async () => {
    if (!manageBatch) return
    setShipGateError(null)
    setShipSaving(true)
    try {
      await api.post(`/api/v1/biochar/${manageBatch.id}/shipments`, {
        date: shipForm.date,
        weightTonnes: parseFloat(shipForm.weightTonnes),
        destination: shipForm.destination,
        waybillNumber: shipForm.waybillNumber,
        mileageKm: parseFloat(shipForm.mileageKm) || 0,
      })
      toast.success('Shipment logged')
      setShipForm(emptyShipForm)
      await Promise.all([openManage(manageBatch.id), fetchAll()])
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setShipGateError(err.message)
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to log shipment')
      }
    } finally {
      setShipSaving(false)
    }
  }

  const logApplication = async () => {
    if (!manageBatch) return
    setAppGateError(null)
    setAppSaving(true)
    try {
      await api.post(`/api/v1/biochar/${manageBatch.id}/applications`, {
        farmerId: appForm.farmerId,
        date: appForm.date,
        weightTonnes: parseFloat(appForm.weightTonnes),
        notes: appForm.notes || undefined,
      })
      toast.success('Field application logged')
      setAppForm(emptyAppForm)
      await Promise.all([openManage(manageBatch.id), fetchAll()])
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setAppGateError(err.message)
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to log application')
      }
    } finally {
      setAppSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#06192C]">Biochar Inventory &amp; Logistics</h1>
          <p className="text-sm text-gray-400">Production log, shipments and field applications with full mass balance</p>
        </div>
        {readOnly ? (
          <Badge variant="gray">Read-only audit access</Badge>
        ) : canCreate ? (
          <Button size="sm" onClick={() => { setBatchForm(emptyBatchForm); setGateError(null); setShowNewModal(true) }}>
            <Plus size={14} /> New Production Log
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
          {/* Mass balance stats */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard title="Total Produced" value={fmt1(balance?.produced ?? 0)} suffix="t"
                icon={<Factory size={20} className="text-[#40BBB9]" />} iconBg="bg-[#40BBB9]/12" />
              <StatCard title="Total Shipped" value={fmt1(balance?.shipped ?? 0)} suffix="t"
                icon={<Truck size={20} className="text-[#336599]" />} iconBg="bg-[#336599]/12" />
              <StatCard title="Total Applied" value={fmt1(balance?.applied ?? 0)} suffix="t"
                icon={<Sprout size={20} className="text-[#98CF59]" />} iconBg="bg-[#98CF59]/15" />
              <StatCard title="Remaining Inventory" value={fmt1(balance?.remaining ?? 0)} suffix="t"
                icon={<Package size={20} className="text-[#22B3DB]" />} iconBg="bg-[#22B3DB]/12" />
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
              <Scale size={12} className="text-[#40BBB9]" /> Mass balance proves no leakage — every tonne produced is accounted for as shipped, applied or remaining.
            </p>
          </div>

          {/* Production log table */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100">
              <CardTitle>Production Log</CardTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Batch #', 'Production Date', 'Feedstock', 'Pyrolysis Temp', 'Raw Weight', 'Region', 'dCoC Status', 'Eligible', 'Remaining', ''].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {batches.length === 0 && (
                    <tr><td colSpan={10} className="px-5 py-8 text-center text-xs text-gray-400">No production logs yet.</td></tr>
                  )}
                  {batches.map((b) => (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                      <td className="px-5 py-3 text-xs font-semibold text-[#06192C] whitespace-nowrap">{b.batchNumber}</td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(b.productionDate)}</td>
                      <td className="px-5 py-3"><Badge variant={FEEDSTOCK_VARIANT[b.feedstockType] ?? 'gray'} className="capitalize">{feedstockLabel(b.feedstockType)}</Badge></td>
                      <td className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap">{b.pyrolysisTemp} °C</td>
                      <td className="px-5 py-3 text-xs font-semibold text-[#06192C] whitespace-nowrap">{fmt1(b.rawWeightTonnes)} t</td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{b.region}</td>
                      <td className="px-5 py-3 whitespace-nowrap"><Badge variant={DCOC_BADGE[b.dcocStatus].variant}>{DCOC_BADGE[b.dcocStatus].label}</Badge></td>
                      <td className="px-5 py-3">
                        {b.issuanceEligible
                          ? <CheckCircle2 size={16} className="text-[#98CF59]" />
                          : <XCircle size={16} className="text-gray-300" />}
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-[#40BBB9] whitespace-nowrap">{fmt1(b.computed?.massBalance.remaining ?? 0)} t</td>
                      <td className="px-5 py-3">
                        <Button variant="ghost" size="sm" onClick={() => openManage(b.id)}>Manage</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* New Production Log modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#06192C]/50 backdrop-blur-sm" onClick={() => setShowNewModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-sm font-bold text-[#06192C]">New Production Log</h2>
              <button onClick={() => setShowNewModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {gateError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs font-semibold text-red-700">{gateError}</p>
                </div>
              )}
              <Input label="Production Date" type="date" value={batchForm.productionDate}
                onChange={(e) => setBatchForm({ ...batchForm, productionDate: e.target.value })} />
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Feedstock Type</label>
                <select className={selectCls} value={batchForm.feedstockType}
                  onChange={(e) => setBatchForm({ ...batchForm, feedstockType: e.target.value })}>
                  {FEEDSTOCKS.map((f) => <option key={f} value={f}>{feedstockLabel(f)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Pyrolysis Temp (°C)" type="number" placeholder="450" value={batchForm.pyrolysisTemp}
                  onChange={(e) => setBatchForm({ ...batchForm, pyrolysisTemp: e.target.value })} />
                <Input label="Raw Weight (tonnes)" type="number" placeholder="12.5" value={batchForm.rawWeightTonnes}
                  onChange={(e) => setBatchForm({ ...batchForm, rawWeightTonnes: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Region</label>
                <select className={selectCls} value={batchForm.region}
                  onChange={(e) => setBatchForm({ ...batchForm, region: e.target.value })}>
                  {SA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Button variant="outline" onClick={() => setShowNewModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={createBatch} loading={saving} className="flex-1"
                  disabled={!batchForm.pyrolysisTemp || !batchForm.rawWeightTonnes}>
                  Create Batch
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage batch modal */}
      {manageBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#06192C]/50 backdrop-blur-sm" onClick={() => setManageBatch(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-5 border-b border-gray-100 rounded-t-2xl">
              <div>
                <h2 className="text-sm font-bold text-[#06192C]">{manageBatch.batchNumber}</h2>
                <p className="text-xs text-gray-400">{feedstockLabel(manageBatch.feedstockType)} · {manageBatch.region} · {fmtDate(manageBatch.productionDate)}</p>
              </div>
              <button onClick={() => setManageBatch(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16} /></button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              {/* Mass balance mini-cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  ['Produced', manageBatch.computed?.massBalance.produced ?? 0, 'text-[#06192C]'],
                  ['Shipped', manageBatch.computed?.massBalance.shipped ?? 0, 'text-[#336599]'],
                  ['Applied', manageBatch.computed?.massBalance.applied ?? 0, 'text-[#4a7a1e]'],
                  ['Remaining', manageBatch.computed?.massBalance.remaining ?? 0, 'text-[#40BBB9]'],
                ] as [string, number, string][]).map(([label, val, colour]) => (
                  <div key={label} className="bg-[#F4F8F6] rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className={`text-lg font-bold ${colour}`}>{fmt1(val)} t</p>
                  </div>
                ))}
              </div>

              {/* Carbon figures */}
              <div className="bg-[#06192C] rounded-xl p-4 grid grid-cols-3 gap-3">
                {([
                  ['Gross CO₂e', manageBatch.computed?.grossCO2e ?? 0],
                  ['Deductions', manageBatch.computed?.deductionsCO2e ?? 0],
                  ['Net CO₂e', manageBatch.computed?.netCO2e ?? 0],
                ] as [string, number][]).map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wide">{label}</p>
                    <p className="text-base font-bold text-[#40BBB9]">{fmt1(val)} t</p>
                  </div>
                ))}
              </div>

              {/* Shipments */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Truck size={14} className="text-[#336599]" />
                  <p className="text-xs font-bold text-[#06192C] uppercase tracking-wide">Shipments ({manageBatch.shipments?.length ?? 0})</p>
                </div>
                {(manageBatch.shipments?.length ?? 0) === 0 ? (
                  <p className="text-xs text-gray-400 mb-3">No shipments logged.</p>
                ) : (
                  <div className="flex flex-col gap-2 mb-3">
                    {manageBatch.shipments!.map((s) => (
                      <div key={s.id} className="flex items-center justify-between bg-[#F4F8F6] rounded-xl px-3 py-2">
                        <div>
                          <p className="text-xs font-semibold text-[#06192C]">{s.destination} · {fmt1(s.weightTonnes)} t</p>
                          <p className="text-[10px] text-gray-400">{fmtDate(s.date)} · waybill {s.waybillNumber} · {s.mileageKm} km</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {canCreate && (
                  <div className="border border-gray-100 rounded-xl p-3 flex flex-col gap-3">
                    {shipGateError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-start gap-2">
                        <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                        <p className="text-xs font-semibold text-red-700">{shipGateError}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Date" type="date" value={shipForm.date} onChange={(e) => setShipForm({ ...shipForm, date: e.target.value })} />
                      <Input label="Weight (t)" type="number" placeholder="5.0" value={shipForm.weightTonnes} onChange={(e) => setShipForm({ ...shipForm, weightTonnes: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Destination" placeholder="Depot / farm" value={shipForm.destination} onChange={(e) => setShipForm({ ...shipForm, destination: e.target.value })} />
                      <Input label="Waybill #" placeholder="WB-00123" value={shipForm.waybillNumber} onChange={(e) => setShipForm({ ...shipForm, waybillNumber: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 items-end">
                      <Input label="Mileage (km)" type="number" placeholder="120" value={shipForm.mileageKm} onChange={(e) => setShipForm({ ...shipForm, mileageKm: e.target.value })} />
                      <Button size="sm" onClick={logShipment} loading={shipSaving}
                        disabled={!shipForm.weightTonnes || !shipForm.destination || !shipForm.waybillNumber}>
                        <Truck size={13} /> Log Shipment
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Applications */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sprout size={14} className="text-[#98CF59]" />
                  <p className="text-xs font-bold text-[#06192C] uppercase tracking-wide">Field Applications ({manageBatch.applications?.length ?? 0})</p>
                </div>
                {(manageBatch.applications?.length ?? 0) === 0 ? (
                  <p className="text-xs text-gray-400 mb-3">No field applications logged.</p>
                ) : (
                  <div className="flex flex-col gap-2 mb-3">
                    {manageBatch.applications!.map((a) => (
                      <div key={a.id} className="flex items-center justify-between bg-[#F4F8F6] rounded-xl px-3 py-2">
                        <div>
                          <p className="text-xs font-semibold text-[#06192C]">
                            {a.farmer ? `${a.farmer.farmName} (${a.farmer.farmerId})` : 'Farmer'} · {fmt1(a.weightTonnes)} t
                          </p>
                          <p className="text-[10px] text-gray-400">{fmtDate(a.date)}{a.notes ? ` · ${a.notes}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {canCreate && (
                  <div className="border border-gray-100 rounded-xl p-3 flex flex-col gap-3">
                    {appGateError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-start gap-2">
                        <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                        <p className="text-xs font-semibold text-red-700">{appGateError}</p>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <label className={labelCls}>Farmer</label>
                      <select className={selectCls} value={appForm.farmerId}
                        onChange={(e) => setAppForm({ ...appForm, farmerId: e.target.value })}>
                        <option value="">Select a farmer…</option>
                        {farmers.map((f) => (
                          <option key={f.id} value={f.id}>{f.farmerId} — {f.farmName} ({f.user.name})</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Date" type="date" value={appForm.date} onChange={(e) => setAppForm({ ...appForm, date: e.target.value })} />
                      <Input label="Weight (t)" type="number" placeholder="2.5" value={appForm.weightTonnes} onChange={(e) => setAppForm({ ...appForm, weightTonnes: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 items-end">
                      <Input label="Notes (optional)" placeholder="North field, 2 ha" value={appForm.notes} onChange={(e) => setAppForm({ ...appForm, notes: e.target.value })} />
                      <Button size="sm" variant="secondary" onClick={logApplication} loading={appSaving}
                        disabled={!appForm.farmerId || !appForm.weightTonnes}>
                        <Sprout size={13} /> Log Application
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
