import { useState } from 'react'
import { Bug, AlertTriangle, Plus, CheckCircle, Clock, X, MapPin, ShieldCheck } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { Input } from '@/components/ui/Input'
import { mockFarmers } from '@/data/mockFarmers'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

type Severity = 'low' | 'medium' | 'high' | 'critical'

interface PestReport {
  id: string
  farmName: string
  province: string
  pest: string
  severity: Severity
  affectedArea: number
  reportedAt: string
  remedy: string
  resolved: boolean
  notes: string
}

const SEVERITY_COLORS: Record<Severity, 'green' | 'cyan' | 'orange' | 'red'> = {
  low: 'green', medium: 'cyan', high: 'orange', critical: 'red',
}

const REMEDIES: Record<string, string[]> = {
  'Fall Armyworm': ['Apply Spinetoram or Lufenuron at first sign', 'Use pheromone traps for monitoring', 'Introduce natural predators (Trichogramma wasps)', 'Rotate with non-host crops next season'],
  'Aphids': ['Apply insecticidal soap or neem oil spray', 'Introduce ladybirds and lacewings', 'Remove heavily infested plant parts', 'Avoid excess nitrogen fertilisation'],
  'Red Spider Mite': ['Apply acaricide (e.g. Abamectin)', 'Increase irrigation — mites thrive in dry conditions', 'Use predatory mites (Phytoseiulus persimilis)', 'Remove and destroy affected leaves'],
  'Thrips': ['Apply Spinosad or Pyrethrin-based insecticide', 'Use blue sticky traps for monitoring', 'Introduce predatory mites', 'Avoid broad-spectrum pesticides'],
  'Stem Borer': ['Apply carbofuran granules at planting', 'Hand-pick egg masses where feasible', 'Use Beauveria bassiana biological control', 'Plant push-pull companion crops'],
  'Whitefly': ['Apply insecticidal soap or neem extract', 'Use yellow sticky traps', 'Introduce Encarsia formosa parasitic wasp', 'Avoid over-fertilisation with nitrogen'],
}

const PESTS = Object.keys(REMEDIES)

const initialReports: PestReport[] = [
  { id: '1', farmName: 'Mokoena Green Farm', province: 'Limpopo', pest: 'Fall Armyworm', severity: 'critical', affectedArea: 12, reportedAt: '2025-04-22', remedy: REMEDIES['Fall Armyworm'][0], resolved: false, notes: 'Larvae found in 3 maize rows. Spreading rapidly.' },
  { id: '2', farmName: 'Bello Sugar Estate', province: 'KwaZulu-Natal', pest: 'Aphids', severity: 'medium', affectedArea: 5, reportedAt: '2025-04-20', remedy: REMEDIES['Aphids'][0], resolved: false, notes: 'Concentrated on young shoots.' },
  { id: '3', farmName: 'Asante Grain Farm', province: 'Free State', pest: 'Red Spider Mite', severity: 'high', affectedArea: 28, reportedAt: '2025-04-18', remedy: REMEDIES['Red Spider Mite'][0], resolved: false, notes: 'Widespread across soybean fields. Very dry conditions contributing.' },
  { id: '4', farmName: 'Mutua Wheat & Maize', province: 'Mpumalanga', pest: 'Stem Borer', severity: 'low', affectedArea: 3, reportedAt: '2025-04-15', remedy: REMEDIES['Stem Borer'][0], resolved: true, notes: 'Early detection — treatment applied successfully.' },
  { id: '5', farmName: 'Khumalo Citrus Farm', province: 'Limpopo', pest: 'Thrips', severity: 'medium', affectedArea: 8, reportedAt: '2025-04-12', remedy: REMEDIES['Thrips'][0], resolved: true, notes: 'Citrus blossom period increased susceptibility.' },
]

export default function PestPage() {
  const [reports, setReports] = useState<PestReport[]>(initialReports)
  const [showModal, setShowModal] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ farmId: '', pest: PESTS[0], severity: 'medium' as Severity, affectedArea: '', notes: '' })

  const resolve = (id: string) => setReports((prev) => prev.map((r) => r.id === id ? { ...r, resolved: true } : r))

  const addReport = () => {
    const farm = mockFarmers.find((f) => f.id === form.farmId)
    if (!farm) return
    const newReport: PestReport = {
      id: crypto.randomUUID(),
      farmName: farm.farmName, province: farm.province,
      pest: form.pest, severity: form.severity,
      affectedArea: parseFloat(form.affectedArea) || 0,
      reportedAt: new Date().toISOString().split('T')[0],
      remedy: REMEDIES[form.pest]?.[0] ?? 'Consult local agri-adviser',
      resolved: false, notes: form.notes,
    }
    setReports((prev) => [newReport, ...prev])
    setShowModal(false)
    setForm({ farmId: '', pest: PESTS[0], severity: 'medium', affectedArea: '', notes: '' })
  }

  const active = reports.filter((r) => !r.resolved)
  const resolved = reports.filter((r) => r.resolved)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center"><Bug size={16} className="text-orange-500" /></div>
          <div><p className="text-sm font-bold text-[#06192C]">Pest & Disease Monitoring</p><p className="text-xs text-gray-400">Outbreak alerts and treatment recommendations</p></div>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}><Plus size={14} /> Report Outbreak</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Active Outbreaks" value={active.length} trend={-15}
          icon={<AlertTriangle size={20} className="text-red-500" />} iconBg="bg-red-100" />
        <StatCard title="Critical Alerts" value={active.filter((r) => r.severity === 'critical').length} trend={0}
          icon={<Bug size={20} className="text-orange-500" />} iconBg="bg-orange-100" />
        <StatCard title="Resolved This Month" value={resolved.length} trend={20}
          icon={<CheckCircle size={20} className="text-[#98CF59]" />} iconBg="bg-[#98CF59]/15" />
        <StatCard title="Affected Area" value={`${active.reduce((s, r) => s + r.affectedArea, 0)} ha`} trend={-8}
          icon={<ShieldCheck size={20} className="text-[#40BBB9]" />} iconBg="bg-[#40BBB9]/12" />
      </div>

      {/* Critical alert banner */}
      {active.some((r) => r.severity === 'critical') && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">Critical Outbreak Alert</p>
            <p className="text-xs text-red-600 mt-0.5">
              {active.filter((r) => r.severity === 'critical').map((r) => `${r.pest} at ${r.farmName}`).join(' · ')}
            </p>
            <p className="text-xs text-red-500 mt-1">Immediate intervention recommended. Contact your agri-adviser.</p>
          </div>
        </div>
      )}

      {/* Active outbreaks */}
      <div>
        <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">Active Outbreaks ({active.length})</p>
        <div className="flex flex-col gap-3">
          {active.map((r) => (
            <Card key={r.id} className={cn('border-l-4', r.severity === 'critical' ? 'border-l-red-500' : r.severity === 'high' ? 'border-l-orange-400' : r.severity === 'medium' ? 'border-l-[#40BBB9]' : 'border-l-[#98CF59]')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-[#06192C]">{r.pest}</span>
                    <Badge variant={SEVERITY_COLORS[r.severity]}>{r.severity}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1"><MapPin size={11} />{r.farmName} · {r.province}</span>
                    <span className="flex items-center gap-1"><Bug size={11} />{r.affectedArea} ha affected</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{formatDate(r.reportedAt)}</span>
                  </div>
                  {expandedId === r.id && (
                    <div className="mt-3 space-y-3">
                      {r.notes && <p className="text-xs text-gray-500 italic">&ldquo;{r.notes}&rdquo;</p>}
                      <div className="bg-[#F4F8F6] rounded-xl p-3">
                        <p className="text-xs font-bold text-[#06192C] mb-2">Recommended Treatments</p>
                        {(REMEDIES[r.pest] ?? [r.remedy]).map((rem, i) => (
                          <div key={i} className="flex items-start gap-2 mb-1.5">
                            <span className="text-[#40BBB9] font-bold text-xs shrink-0">{i + 1}.</span>
                            <span className="text-xs text-gray-600">{rem}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    className="text-xs font-semibold text-[#40BBB9] hover:underline">
                    {expandedId === r.id ? 'Less' : 'Remedies'}
                  </button>
                  <Button size="sm" variant="secondary" onClick={() => resolve(r.id)}>
                    <CheckCircle size={12} /> Resolve
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {active.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <ShieldCheck size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No active outbreaks</p>
            </div>
          )}
        </div>
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">Resolved ({resolved.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {resolved.map((r) => (
              <Card key={r.id} className="opacity-60">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={14} className="text-[#98CF59]" />
                  <span className="text-sm font-semibold text-[#06192C]">{r.pest}</span>
                </div>
                <p className="text-xs text-gray-400">{r.farmName} · {formatDate(r.reportedAt)}</p>
                <p className="text-[10px] text-gray-400 mt-1">{r.affectedArea} ha affected</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Report modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#06192C]/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-sm font-bold text-[#06192C]">Report Pest Outbreak</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Farm</label>
                <select className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40"
                  value={form.farmId} onChange={(e) => setForm({ ...form, farmId: e.target.value })}>
                  <option value="">Select farm...</option>
                  {mockFarmers.map((f) => <option key={f.id} value={f.id}>{f.farmName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Pest / Disease</label>
                  <select className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40"
                    value={form.pest} onChange={(e) => setForm({ ...form, pest: e.target.value })}>
                    {PESTS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Severity</label>
                  <select className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40"
                    value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}>
                    {(['low','medium','high','critical'] as Severity[]).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <Input label="Affected Area (ha)" type="number" placeholder="5" value={form.affectedArea}
                onChange={(e) => setForm({ ...form, affectedArea: e.target.value })} />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Field Notes</label>
                <textarea rows={3} placeholder="Describe what you observed..."
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40" />
              </div>
              {form.pest && (
                <div className="bg-[#40BBB9]/8 rounded-xl p-3 text-xs text-[#06192C]">
                  <p className="font-bold mb-1">Suggested remedy:</p>
                  <p>{REMEDIES[form.pest]?.[0] ?? 'Consult local agri-adviser'}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={addReport} className="flex-1">Submit Report</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
