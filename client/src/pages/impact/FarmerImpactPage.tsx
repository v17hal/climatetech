import { useCallback, useEffect, useState } from 'react'
import {
  Leaf, Droplets, FlaskConical, TrendingUp, TrendingDown, Car, Wallet,
  Camera, ShieldCheck, CheckCircle2, Printer, ExternalLink, Sprout, MapPin,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { api, fileUrl, ApiError } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/utils/format'
import type { FarmerImpact, FieldPhoto } from '@/types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface FarmerOption {
  id: string
  farmerId: string
  farmName: string
  user: { name: string }
}

const PHOTO_BADGE: Record<FieldPhoto['photoType'], 'orange' | 'green' | 'cyan' | 'blue'> = {
  before: 'orange',
  after: 'green',
  sample: 'cyan',
  field: 'blue',
}

function phAdvice(ph: number): string {
  if (ph < 6) return `Your soil is slightly acidic (pH ${ph}). Consider lime or acid-tolerant crops.`
  if (ph <= 7.5) return 'Great balance — maintain current biochar application rates.'
  return 'Alkaline soil — choose tolerant crops.'
}

function ecLabel(ec: number): { label: string; variant: 'green' | 'cyan' | 'orange' } {
  if (ec > 1.5) return { label: 'High', variant: 'green' }
  if (ec >= 0.5) return { label: 'Moderate', variant: 'cyan' }
  return { label: 'Low', variant: 'orange' }
}

export default function FarmerImpactPage() {
  const user = useAuthStore((s) => s.user)
  const isFarmer = user?.role === 'farmer'

  const [farmers, setFarmers] = useState<FarmerOption[]>([])
  const [selectedId, setSelectedId] = useState<string>(isFarmer ? user?.farmerDbId ?? '' : '')
  const [impact, setImpact] = useState<FarmerImpact | null>(null)
  const [loading, setLoading] = useState(false)

  /* Staff/auditor: load farm list for the picker */
  useEffect(() => {
    if (isFarmer) return
    api.get<{ farmers: FarmerOption[] }>('/api/v1/farmers?limit=200')
      .then((res) => setFarmers(res.farmers))
      .catch(() => toast.error('Could not load farm list'))
  }, [isFarmer])

  const loadImpact = useCallback((id: string) => {
    setLoading(true)
    api.get<FarmerImpact>(`/api/v1/impact/${id}`)
      .then(setImpact)
      .catch((err) => {
        setImpact(null)
        toast.error(err instanceof ApiError ? err.message : 'Could not load impact data')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedId) loadImpact(selectedId)
  }, [selectedId, loadImpact])

  /* Farmer with no linked farm profile */
  if (isFarmer && !user?.farmerDbId) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-[#06192C]">My Farm Value &amp; Impact</h1>
          <p className="text-sm text-gray-400">Your soil health, carbon bank and evidence locker</p>
        </div>
        <Card className="flex flex-col items-center text-center py-12">
          <div className="w-14 h-14 bg-[#98CF59]/15 rounded-2xl flex items-center justify-center mb-4">
            <Sprout size={26} className="text-[#98CF59]" />
          </div>
          <p className="text-base font-semibold text-[#06192C]">No farm profile linked yet</p>
          <p className="text-sm text-gray-400 mt-2 max-w-md">
            Your account is not connected to a farm profile. Please contact your CarbonSmart
            field officer to link your farm — your impact dashboard will appear here as soon
            as it is set up.
          </p>
        </Card>
      </div>
    )
  }

  const soil = impact?.soilHealth
  const latest = soil?.latest ?? null
  const first = soil?.first ?? null
  const bank = impact?.carbonBank
  const photos = impact
    ? [...impact.evidence.photos].sort(
        (a, b) => new Date(a.utcTimestamp).getTime() - new Date(b.utcTimestamp).getTime()
      )
    : []

  const bdSeries = (soil?.series ?? [])
    .filter((p) => p.bulkDensity !== null)
    .map((p) => ({ date: formatDate(p.date), bulkDensity: p.bulkDensity }))
  const bdImproving =
    latest?.bulkDensity != null && first?.bulkDensity != null && latest.bulkDensity < first.bulkDensity

  const waterPercent = soil?.waterSavingPercent ?? latest?.waterHoldingCapacity ?? null
  const phValue = latest?.soilPH ?? null
  const phPos = phValue !== null ? Math.min(100, Math.max(0, ((phValue - 4) / 5) * 100)) : null

  const passportUrl = impact
    ? `${window.location.origin}/passport/${impact.farmer.farmerId}`
    : ''

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#06192C]">My Farm Value &amp; Impact</h1>
          <p className="text-sm text-gray-400">
            {impact
              ? `${impact.farmer.farmName} — ${impact.farmer.province}`
              : 'Your soil health, carbon bank and evidence locker'}
          </p>
        </div>
        {!isFarmer && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">
              Select Farm
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#06192C] min-w-64 focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40"
            >
              <option value="">Choose a farm…</option>
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.user.name} — {f.farmName} ({f.farmerId})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && (
        <Card className="flex items-center justify-center py-16">
          <span className="w-6 h-6 border-2 border-[#40BBB9] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-400">Loading impact data…</span>
        </Card>
      )}

      {!loading && !impact && !isFarmer && (
        <Card className="flex flex-col items-center text-center py-12">
          <div className="w-14 h-14 bg-[#40BBB9]/12 rounded-2xl flex items-center justify-center mb-4">
            <MapPin size={26} className="text-[#40BBB9]" />
          </div>
          <p className="text-base font-semibold text-[#06192C]">Pick a farm to view its impact</p>
          <p className="text-sm text-gray-400 mt-1">Use the selector above to load a farmer dashboard.</p>
        </Card>
      )}

      {!loading && impact && (
        <>
          {/* ── Section A: MY SOIL HEALTH PROFILE ─────────────────── */}
          <div>
            <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">
              My Soil Health Profile
            </p>
            {soil && soil.series.length === 0 ? (
              <Card className="flex flex-col items-center text-center py-10">
                <div className="w-12 h-12 bg-[#40BBB9]/12 rounded-2xl flex items-center justify-center mb-3">
                  <FlaskConical size={22} className="text-[#40BBB9]" />
                </div>
                <p className="text-sm font-semibold text-[#06192C]">
                  No lab results yet — your first soil sample is on its way
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Once the laboratory verifies your soil, your health profile will appear here.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* pH gauge */}
                <Card>
                  <CardHeader>
                    <CardTitle>Soil pH Balance</CardTitle>
                    <FlaskConical size={16} className="text-[#40BBB9]" />
                  </CardHeader>
                  {phValue !== null ? (
                    <div className="flex flex-col gap-3">
                      <p className="text-3xl font-bold text-[#06192C]">pH {phValue}</p>
                      <div className="relative pt-3 pb-1">
                        <div
                          className="h-3 rounded-full"
                          style={{ background: 'linear-gradient(to right, #ef4444, #98CF59, #22B3DB)' }}
                        />
                        <div
                          className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                          style={{ left: `${phPos}%` }}
                        >
                          <div className="w-3.5 h-3.5 bg-white border-2 border-[#06192C] rounded-full mt-2.5 shadow" />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 font-semibold uppercase tracking-wide">
                          <span>Acidic</span>
                          <span>Neutral</span>
                          <span>Alkaline</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{phAdvice(phValue)}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No pH reading in your latest lab result.</p>
                  )}
                </Card>

                {/* Nutrient availability (EC) */}
                <Card>
                  <CardHeader>
                    <CardTitle>Nutrient Availability</CardTitle>
                    <Leaf size={16} className="text-[#98CF59]" />
                  </CardHeader>
                  {latest?.electricalConductivity != null ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-end gap-3">
                        <p className="text-3xl font-bold text-[#06192C]">
                          {latest.electricalConductivity}
                          <span className="text-sm font-semibold text-gray-400 ml-1">dS/m</span>
                        </p>
                        <Badge variant={ecLabel(latest.electricalConductivity).variant}>
                          {ecLabel(latest.electricalConductivity).label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        Fertiliser is locked in the root zone rather than washing away.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No conductivity reading yet.</p>
                  )}
                </Card>

                {/* Bulk density trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Root Room &amp; Aeration</CardTitle>
                    {bdSeries.length > 1 && (
                      <Badge variant={bdImproving ? 'green' : 'gray'}>
                        {bdImproving ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                        {bdImproving ? 'Improving' : 'Stable'}
                      </Badge>
                    )}
                  </CardHeader>
                  {bdSeries.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={bdSeries} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f0f0f0' }} />
                          <Line type="monotone" dataKey="bulkDensity" name="Bulk density (g/cm³)" stroke="#336599" strokeWidth={2.5} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                      <p className="text-xs text-gray-500 mt-2">
                        Lower is better — biochar makes soil lighter so roots spread deeper.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">No bulk density readings yet.</p>
                  )}
                </Card>

                {/* Water holding */}
                <Card>
                  <CardHeader>
                    <CardTitle>Water Holding</CardTitle>
                    <Droplets size={16} className="text-[#22B3DB]" />
                  </CardHeader>
                  {waterPercent !== null ? (
                    <div className="flex flex-col gap-3">
                      <p className={`text-4xl font-bold ${waterPercent >= 0 ? 'text-[#22B3DB]' : 'text-orange-500'}`}>
                        {waterPercent > 0 ? '+' : ''}{waterPercent}%
                        <span className="text-sm font-semibold text-gray-400 ml-2">Water Retention</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {waterPercent >= 0
                          ? 'Your soil holds more water — you can irrigate less.'
                          : 'Water retention is being monitored across your next soil samples.'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No water holding data yet.</p>
                  )}
                </Card>
              </div>
            )}
          </div>

          {/* ── Section B: MY CARBON BANK ──────────────────────────── */}
          {bank && (
            <div>
              <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">
                My Carbon Bank
              </p>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Stored carbon counter */}
                <Card className="bg-[#06192C] border-[#06192C] flex flex-col justify-center items-center text-center py-8">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                    Stored Carbon Counter
                  </p>
                  <p className="text-4xl font-bold text-[#98CF59] font-mono tabular-nums">
                    {bank.storedCO2e.toLocaleString('en-ZA')}
                    <span className="text-lg text-white/60 ml-2">tCO₂e</span>
                  </p>
                  <p className="text-xs text-white/50 mt-2">Permanently stored in your soil</p>
                </Card>

                {/* Relatable comparison */}
                <Card className="flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#40BBB9]/12 rounded-xl flex items-center justify-center">
                      <Car size={18} className="text-[#40BBB9]" />
                    </div>
                    <CardTitle>What that means</CardTitle>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    You have stored{' '}
                    <span className="font-bold text-[#06192C]">
                      {bank.storedCO2e.toLocaleString('en-ZA')} tonnes of CO₂e
                    </span>{' '}
                    — that matches taking{' '}
                    <span className="font-bold text-[#40BBB9]">{bank.carsOffRoad}</span> cars off
                    the road for a year.
                  </p>
                  <p className="text-xs text-gray-400 mt-3">
                    Biochar applied to your fields:{' '}
                    <span className="font-semibold text-[#06192C]">
                      {bank.biocharAppliedTonnes.toLocaleString('en-ZA')} t
                    </span>
                  </p>
                </Card>

                {/* Financial tracker */}
                <Card padding="none">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet size={16} className="text-[#98CF59]" />
                      <CardTitle>Financial &amp; Benefit Tracker</CardTitle>
                    </div>
                  </div>
                  <div className="px-6 py-3 border-b border-gray-50">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Total Value Earned</p>
                    <p className="text-2xl font-bold text-[#06192C]">
                      R {bank.totalEarned.toLocaleString('en-ZA')}
                    </p>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {bank.payouts.length === 0 ? (
                      <p className="px-6 py-4 text-sm text-gray-400">No payouts recorded yet.</p>
                    ) : (
                      bank.payouts.map((p) => (
                        <div key={p.id} className="px-6 py-2.5 flex items-center justify-between border-b border-gray-50 last:border-0">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#06192C] truncate">{p.description}</p>
                            <p className="text-[10px] text-gray-400">{formatDate(p.date)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <Badge variant={p.type === 'payment' ? 'green' : 'cyan'}>{p.type}</Badge>
                            <span className="text-xs font-bold text-[#4a7a1e]">
                              +R {p.amount.toLocaleString('en-ZA')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ── Section C: EVIDENCE LOCKER & PASSPORT ──────────────── */}
          <div>
            <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">
              My Evidence Locker &amp; Sustainable Passport
            </p>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Field history timeline */}
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle>Field History</CardTitle>
                  <span className="text-xs text-gray-400">Visual proof of change — before &amp; after</span>
                </CardHeader>
                {photos.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-8">
                    <Camera size={24} className="text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">No field photos yet.</p>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {photos.map((ph) => (
                      <div key={ph.id} className="shrink-0 w-44">
                        <div className="relative">
                          <img
                            src={fileUrl(ph.filePath)}
                            alt={ph.caption ?? ph.photoType}
                            className="w-44 h-32 object-cover rounded-xl border border-gray-100"
                          />
                          <span className="absolute top-2 left-2">
                            <Badge variant={PHOTO_BADGE[ph.photoType]}>{ph.photoType}</Badge>
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-[10px] text-gray-400">{formatDate(ph.utcTimestamp)}</p>
                          {ph.isVerified && (
                            <Badge variant="green">
                              <CheckCircle2 size={10} /> Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Passport card */}
              <Card className="flex flex-col items-center text-center gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#98CF59]" />
                  <CardTitle>Sustainable Farm Passport</CardTitle>
                </div>
                <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <QRCodeSVG value={passportUrl} size={140} fgColor="#06192C" />
                </div>
                <p className="text-sm font-mono font-bold text-[#40BBB9]">{impact.farmer.farmerId}</p>
                <p className="text-xs text-gray-400">
                  Verra • Puro.earth • Gold Standard compliant dMRV
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-bold text-[#06192C]">{impact.evidence.verifiedCount}</span>{' '}
                  verified field photos on record
                </p>
                <div className="flex gap-2 w-full mt-1">
                  <a
                    href={`/passport/${impact.farmer.farmerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 border border-[#40BBB9] text-[#40BBB9] hover:bg-[#40BBB9]/10 font-semibold px-3 py-1.5 text-xs rounded-lg transition-all"
                  >
                    <ExternalLink size={13} /> Open public page
                  </a>
                  <Button size="sm" className="flex-1" onClick={() => window.print()}>
                    <Printer size={13} /> Download certificate
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
