import { useEffect, useState } from 'react'
import {
  Calculator, Download, AlertTriangle, CheckCircle2, XCircle, Leaf, Truck, Car,
} from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'
import type { DcocStatus } from '@/types'

interface LedgerRow {
  id: string
  batchNumber: string
  productionDate: string
  feedstockType: string
  region: string
  rawWeightTonnes: number
  cOrgPercent: number | null
  hcRatio: number | null
  dcocStatus: DcocStatus
  issuanceEligible: boolean
  massBalance: { produced: number; shipped: number; applied: number; remaining: number }
  grossCO2e: number
  deductionsCO2e: number
  netCO2e: number
  creditableCO2e: number
}

interface LedgerTotals {
  grossCO2e: number
  deductionsCO2e: number
  netCO2e: number
  creditableCO2e: number
  carsOffRoad: number
}

const DCOC_BADGE: Record<DcocStatus, { variant: 'green' | 'orange' | 'red' | 'gray'; label: string }> = {
  produced: { variant: 'gray', label: 'Produced' },
  sampled: { variant: 'orange', label: 'Yellow — Sampled' },
  lab_received: { variant: 'orange', label: 'Orange — Lab Received' },
  results_entered: { variant: 'green', label: 'Green — Results Entered' },
  rejected: { variant: 'red', label: 'Rejected' },
}

const fmt1 = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export default function LedgerPage() {
  const role = useAuthStore((s) => s.user?.role)
  const readOnly = role === 'vvb_auditor' || role === 'viewer'

  const [rows, setRows] = useState<LedgerRow[]>([])
  const [totals, setTotals] = useState<LedgerTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    api.get<{ rows: LedgerRow[]; totals: LedgerTotals }>('/api/v1/biochar/ledger')
      .then((data) => { setRows(data.rows); setTotals(data.totals); setLoadError(null) })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Network error — backend unreachable'))
      .finally(() => setLoading(false))
  }, [])

  const exportCsv = () => {
    const header = [
      'Batch Number', 'Production Date', 'Region', 'Feedstock', 'Raw Weight (t)', 'C-org %', 'H:C Ratio',
      'Gross CO2e (t)', 'Deductions CO2e (t)', 'Net CO2e (t)', 'Creditable CO2e (t)', 'dCoC Status', 'Issuance Eligible',
    ]
    const escape = (v: string | number) => {
      const s = String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const lines = rows.map((r) => [
      r.batchNumber,
      new Date(r.productionDate).toISOString().slice(0, 10),
      r.region,
      r.feedstockType,
      r.rawWeightTonnes,
      r.cOrgPercent ?? '',
      r.hcRatio ?? '',
      r.grossCO2e,
      r.deductionsCO2e,
      r.netCO2e,
      r.creditableCO2e,
      r.dcocStatus,
      r.issuanceEligible ? 'yes' : 'no',
    ].map(escape).join(','))
    const csv = [header.map(escape).join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `carbon-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#06192C]">Carbon Calculation Ledger</h1>
          <p className="text-sm text-gray-400">Per-batch gross, deductions and net CO₂e — the audit trail behind every credit</p>
        </div>
        <div className="flex items-center gap-3">
          {readOnly && <Badge variant="gray">Read-only audit access</Badge>}
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download size={14} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Explainer */}
      <Card className="bg-[#06192C] border-none">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-[#40BBB9]/20 rounded-xl flex items-center justify-center shrink-0">
            <Calculator size={16} className="text-[#40BBB9]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white mb-1">How the ledger is calculated</p>
            <div className="text-xs text-white/60 flex flex-col gap-0.5">
              <p><span className="font-semibold text-[#98CF59]">Gross CO₂e</span> = raw weight × C-org % × 3.67 (carbon → CO₂ conversion)</p>
              <p><span className="font-semibold text-[#22B3DB]">Deductions</span> = truck kilometres × diesel emission factor</p>
              <p><span className="font-semibold text-[#40BBB9]">Net CO₂e</span> = Gross − Deductions</p>
              <p>Credits only issue for <span className="font-semibold text-white">issuance-eligible</span> batches (passed the SGS lab quality gate).</p>
            </div>
          </div>
        </div>
      </Card>

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
          {/* Totals */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard title="Gross CO₂e" value={fmt1(totals?.grossCO2e ?? 0)} suffix="t"
                icon={<Leaf size={20} className="text-[#98CF59]" />} iconBg="bg-[#98CF59]/15" />
              <StatCard title="Deductions" value={fmt1(totals?.deductionsCO2e ?? 0)} suffix="t"
                icon={<Truck size={20} className="text-[#22B3DB]" />} iconBg="bg-[#22B3DB]/12" />
              <StatCard title="Net CO₂e" value={fmt1(totals?.netCO2e ?? 0)} suffix="t"
                icon={<Calculator size={20} className="text-[#336599]" />} iconBg="bg-[#336599]/12" />
              <StatCard title="Creditable CO₂e" value={fmt1(totals?.creditableCO2e ?? 0)} suffix="t"
                icon={<CheckCircle2 size={20} className="text-[#40BBB9]" />} iconBg="bg-[#40BBB9]/12" />
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
              <Car size={12} className="text-[#40BBB9]" />
              ≈ {Math.round(totals?.carsOffRoad ?? 0).toLocaleString()} cars off the road for a year
            </p>
          </div>

          {/* Ledger table */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100">
              <CardTitle>Batch Ledger ({rows.length})</CardTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Batch #', 'Region', 'Raw Weight', 'C-org %', 'H:C', 'Gross CO₂e', 'Deductions', 'Net CO₂e', 'Creditable', 'dCoC Status', 'Eligible'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={11} className="px-4 py-8 text-center text-xs text-gray-400">No batches in the ledger yet.</td></tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.id}
                      className={cn(
                        'border-b border-gray-50 transition-colors',
                        r.dcocStatus === 'rejected' ? 'bg-red-50 hover:bg-red-50/70' : 'hover:bg-[#F4F8F6]'
                      )}>
                      <td className="px-4 py-3 text-xs font-semibold text-[#06192C] whitespace-nowrap">{r.batchNumber}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{r.region}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{fmt1(r.rawWeightTonnes)} t</td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{r.cOrgPercent != null ? `${r.cOrgPercent}%` : '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{r.hcRatio ?? '—'}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-[#4a7a1e] whitespace-nowrap">{fmt1(r.grossCO2e)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">−{fmt1(r.deductionsCO2e)}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-[#06192C] whitespace-nowrap">{fmt1(r.netCO2e)}</td>
                      <td className="px-4 py-3 text-xs font-bold text-[#40BBB9] whitespace-nowrap">{fmt1(r.creditableCO2e)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={DCOC_BADGE[r.dcocStatus].variant}>{DCOC_BADGE[r.dcocStatus].label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {r.issuanceEligible
                          ? <CheckCircle2 size={16} className="text-[#98CF59]" />
                          : <XCircle size={16} className="text-gray-300" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
