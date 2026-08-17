import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  FlaskConical, Truck, X, FileText, AlertTriangle, CheckCircle2, Upload, Lock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api, fileUrl, ApiError } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/utils/format'
import type { SoilSample } from '@/types'

const STATUS_BADGE: Record<SoilSample['status'], { variant: 'orange' | 'green' | 'red' | 'gray'; label: string; className?: string }> = {
  sampled: { variant: 'orange', label: 'Awaiting receipt', className: 'bg-yellow-100 text-yellow-700' },
  lab_received: { variant: 'orange', label: 'Awaiting results' },
  results_entered: { variant: 'green', label: 'Results entered' },
  rejected: { variant: 'red', label: 'Rejected' },
}

interface ResultsResponse {
  result: unknown
  status: 'results_entered' | 'rejected'
  gateMessage: string | null
}

/* ── Log Receipt modal ─────────────────────────────────────────── */

function ReceiptModal({ sample, onClose, onDone }: {
  sample: SoilSample
  onClose: () => void
  onDone: () => void
}) {
  const [waybill, setWaybill] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!waybill.trim()) {
      toast.error('Enter the waybill / tracking number')
      return
    }
    setSaving(true)
    try {
      await api.patch(`/api/v1/samples/${sample.id}/receive`, { waybillNumber: waybill.trim() })
      toast.success(`Receipt logged for ${sample.sampleCode}`)
      onDone()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not log receipt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#06192C]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#40BBB9]/12 rounded-xl flex items-center justify-center">
              <Truck size={16} className="text-[#40BBB9]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#06192C]">Log Sample Receipt</h2>
              <p className="text-xs text-gray-400">{sample.sampleCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-[#06192C] transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <Input
            label="Waybill / Tracking Number"
            placeholder="e.g. WB-2026-004512"
            icon={<Truck size={14} />}
            value={waybill}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setWaybill(e.target.value)}
          />
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="button" loading={saving} onClick={submit} className="flex-1">Confirm Receipt</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Enter Results modal ───────────────────────────────────────── */

function ResultsModal({ sample, onClose, onDone }: {
  sample: SoilSample
  onClose: () => void
  onDone: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [cOrgPercent, setCOrgPercent] = useState('')
  const [hcRatio, setHcRatio] = useState('')
  const [heavyMetalsPass, setHeavyMetalsPass] = useState(false)
  const [soilPH, setSoilPH] = useState('')
  const [ec, setEc] = useState('')
  const [bulkDensity, setBulkDensity] = useState('')
  const [ssa, setSsa] = useState('')
  const [whc, setWhc] = useState('')
  const [saving, setSaving] = useState(false)
  const [gateMessage, setGateMessage] = useState<string | null>(null)

  const submit = async () => {
    const cOrg = parseFloat(cOrgPercent)
    const hc = parseFloat(hcRatio)
    if (!file) { toast.error('Attach the lab certificate PDF'); return }
    if (Number.isNaN(cOrg)) { toast.error('Enter C-org %'); return }
    if (Number.isNaN(hc)) { toast.error('Enter H/C ratio'); return }

    setSaving(true)
    setGateMessage(null)
    try {
      /* 1. Upload certificate PDF */
      const form = new FormData()
      form.append('certificate', file)
      const { certificatePath } = await api.upload<{ certificatePath: string }>(
        '/api/v1/evidence/certificates', form
      )

      /* 2. Post results */
      const optional = (v: string) => {
        const n = parseFloat(v)
        return Number.isNaN(n) ? undefined : n
      }
      const res = await api.post<ResultsResponse>(`/api/v1/samples/${sample.id}/results`, {
        cOrgPercent: cOrg,
        hcRatio: hc,
        heavyMetalsPass,
        soilPH: optional(soilPH),
        electricalConductivity: optional(ec),
        bulkDensity: optional(bulkDensity),
        specificSurfaceArea: optional(ssa),
        waterHoldingCapacity: optional(whc),
        certificatePath,
      })

      if (res.status === 'rejected') {
        /* Gate 3 — keep modal open, show verbatim message */
        setGateMessage(res.gateMessage ?? 'Batch rejected by quality gate.')
        onDone()
      } else {
        toast.success('Results entered — sample verified (Green)')
        onDone()
        onClose()
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) toast.error('Results are immutable — this sample already has results.')
        else toast.error(err.message)
      } else {
        toast.error('Could not submit results')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#06192C]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#22B3DB]/12 rounded-xl flex items-center justify-center">
              <FlaskConical size={16} className="text-[#22B3DB]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#06192C]">Enter Lab Results</h2>
              <p className="text-xs text-gray-400">
                {sample.sampleCode}{sample.batch ? ` — batch ${sample.batch.batchNumber}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-[#06192C] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {gateMessage && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Critical — Gate 3</p>
                <p className="text-sm text-red-700 mt-1">{gateMessage}</p>
                <p className="text-xs text-red-500 mt-1.5">
                  Entry saved, but the batch is locked from credit issuance.
                </p>
              </div>
            </div>
          )}

          {/* Certificate upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">
              Lab Certificate (PDF) *
            </label>
            <label className="flex items-center gap-3 bg-[#F4F8F6] border border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:border-[#40BBB9] transition-colors">
              <Upload size={16} className="text-[#40BBB9] shrink-0" />
              <span className="text-sm text-gray-500 truncate">
                {file ? file.name : 'Choose certificate PDF…'}
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* Required metrics */}
          <div>
            <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">Required Chemistry</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="C-org (%)" type="number" step="0.01" placeholder="62.5"
                value={cOrgPercent} onChange={(e: ChangeEvent<HTMLInputElement>) => setCOrgPercent(e.target.value)} />
              <Input label="H/C Ratio" type="number" step="0.01" placeholder="0.42"
                value={hcRatio} onChange={(e: ChangeEvent<HTMLInputElement>) => setHcRatio(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={heavyMetalsPass}
                onChange={(e) => setHeavyMetalsPass(e.target.checked)}
                className="accent-[#40BBB9] w-4 h-4"
              />
              <span className="text-sm text-gray-600">
                Heavy metals within SGS soil-safety limits
                <span className="block text-xs text-gray-400">
                  Confirms biochar is free of toxic metal contamination before it can be applied to farmland
                </span>
              </span>
            </label>
          </div>

          {/* Optional metrics */}
          <div>
            <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">Optional Soil Metrics</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Soil pH" type="number" step="0.1" placeholder="6.5"
                value={soilPH} onChange={(e: ChangeEvent<HTMLInputElement>) => setSoilPH(e.target.value)} />
              <Input label="EC (dS/m)" type="number" step="0.01" placeholder="1.2"
                value={ec} onChange={(e: ChangeEvent<HTMLInputElement>) => setEc(e.target.value)} />
              <Input label="Bulk Density (g/cm³)" type="number" step="0.01" placeholder="1.25"
                value={bulkDensity} onChange={(e: ChangeEvent<HTMLInputElement>) => setBulkDensity(e.target.value)} />
              <Input label="Specific Surface Area" type="number" step="0.1" placeholder="180"
                value={ssa} onChange={(e: ChangeEvent<HTMLInputElement>) => setSsa(e.target.value)} />
              <Input label="Water Holding Cap. (%)" type="number" step="0.1" placeholder="42"
                value={whc} onChange={(e: ChangeEvent<HTMLInputElement>) => setWhc(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {gateMessage ? 'Close' : 'Cancel'}
            </Button>
            {!gateMessage && (
              <Button type="button" loading={saving} onClick={submit} className="flex-1">
                Submit Results
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function LabPortalPage() {
  const user = useAuthStore((s) => s.user)
  const canAct = user?.role === 'lab_technician' || user?.role === 'admin'

  const [samples, setSamples] = useState<SoilSample[]>([])
  const [loading, setLoading] = useState(true)
  const [receiptFor, setReceiptFor] = useState<SoilSample | null>(null)
  const [resultsFor, setResultsFor] = useState<SoilSample | null>(null)

  const load = useCallback(() => {
    api.get<SoilSample[]>('/api/v1/samples')
      .then(setSamples)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Could not load samples'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const queue = samples.filter((s) => s.status === 'sampled' || s.status === 'lab_received')
  const completed = samples.filter((s) => s.status === 'results_entered' || s.status === 'rejected')

  const statusBadge = (s: SoilSample) => {
    const cfg = STATUS_BADGE[s.status]
    return <Badge variant={cfg.variant} className={cfg.className}>{cfg.label}</Badge>
  }

  const sampleRowMeta = (s: SoilSample) => (
    <>
      <td className="px-5 py-3 text-xs font-mono font-semibold text-[#40BBB9] whitespace-nowrap">{s.sampleCode}</td>
      <td className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap">
        {s.batch ? `${s.batch.batchNumber} (${s.batch.region})` : '—'}
      </td>
      <td className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap">
        {s.farmer ? `${s.farmer.farmName} (${s.farmer.farmerId})` : '—'}
      </td>
      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(s.sampledAt)}</td>
    </>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#06192C]">Laboratory Portal</h1>
          <p className="text-sm text-gray-400">
            Secure upload portal — log sample tracking numbers and chemical test data.
          </p>
        </div>
        <div className="w-10 h-10 bg-[#22B3DB]/12 rounded-xl flex items-center justify-center shrink-0">
          <FlaskConical size={18} className="text-[#22B3DB]" />
        </div>
      </div>

      {!canAct && (
        <div className="bg-[#336599]/8 border border-[#336599]/20 rounded-2xl p-4 flex items-center gap-3">
          <Lock size={16} className="text-[#336599] shrink-0" />
          <p className="text-sm text-[#336599]">
            Read-only view — only laboratory technicians can log receipts or enter results.
          </p>
        </div>
      )}

      {loading ? (
        <Card className="flex items-center justify-center py-16">
          <span className="w-6 h-6 border-2 border-[#40BBB9] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-400">Loading samples…</span>
        </Card>
      ) : (
        <>
          {/* Incoming queue */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <CardTitle>Sample Queue</CardTitle>
              <span className="text-xs text-gray-400">{queue.length} awaiting action</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Sample Code', 'Batch', 'Farm', 'Sampled', 'Status', 'Waybill', canAct ? 'Action' : ''].filter(Boolean).map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queue.length === 0 && (
                    <tr>
                      <td colSpan={canAct ? 7 : 6} className="px-5 py-8 text-center text-sm text-gray-400">
                        No samples awaiting receipt or results.
                      </td>
                    </tr>
                  )}
                  {queue.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                      {sampleRowMeta(s)}
                      <td className="px-5 py-3">{statusBadge(s)}</td>
                      <td className="px-5 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">{s.waybillNumber ?? '—'}</td>
                      {canAct && (
                        <td className="px-5 py-3 whitespace-nowrap">
                          {s.status === 'sampled' ? (
                            <Button size="sm" variant="outline" onClick={() => setReceiptFor(s)}>
                              <Truck size={13} /> Log Receipt
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => setResultsFor(s)}>
                              <FlaskConical size={13} /> Enter Results
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Completed */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <CardTitle>Completed Samples</CardTitle>
              <span className="text-xs text-gray-400">{completed.length} processed</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Sample Code', 'Batch', 'Farm', 'Sampled', 'Status', 'C-org %', 'H/C', 'Heavy Metals', 'Certificate'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {completed.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-8 text-center text-sm text-gray-400">
                        No completed samples yet.
                      </td>
                    </tr>
                  )}
                  {completed.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                      {sampleRowMeta(s)}
                      <td className="px-5 py-3">{statusBadge(s)}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-[#06192C]">{s.labResult?.cOrgPercent ?? '—'}</td>
                      <td className="px-5 py-3 text-xs text-gray-600">{s.labResult?.hcRatio ?? '—'}</td>
                      <td className="px-5 py-3">
                        {s.labResult ? (
                          s.labResult.heavyMetalsPass ? (
                            <Badge variant="green"><CheckCircle2 size={10} /> Pass</Badge>
                          ) : (
                            <Badge variant="red"><AlertTriangle size={10} /> Fail</Badge>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {s.labResult?.certificatePath ? (
                          <a
                            href={fileUrl(s.labResult.certificatePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#40BBB9] hover:underline"
                          >
                            <FileText size={12} /> Certificate
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
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

      {receiptFor && (
        <ReceiptModal
          sample={receiptFor}
          onClose={() => setReceiptFor(null)}
          onDone={() => { setReceiptFor(null); load() }}
        />
      )}
      {resultsFor && (
        <ResultsModal
          sample={resultsFor}
          onClose={() => setResultsFor(null)}
          onDone={load}
        />
      )}
    </div>
  )
}
