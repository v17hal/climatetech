import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Leaf, CheckCircle2, ShieldCheck, MapPin, Calendar, Sprout, Car,
  FlaskConical, Camera, SearchX, Award,
} from 'lucide-react'
import { API_BASE } from '@/services/api'
import { formatDate } from '@/utils/format'
import type { PassportData } from '@/types'

export default function PassportPublicPage() {
  const { farmerId } = useParams<{ farmerId: string }>()
  const [data, setData] = useState<PassportData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading')

  useEffect(() => {
    if (!farmerId) {
      setStatus('notfound')
      return
    }
    let cancelled = false
    setStatus('loading')
    fetch(`${API_BASE}/api/v1/passport/${farmerId}`)
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 404) { setStatus('notfound'); return }
        if (!res.ok) { setStatus('error'); return }
        const body = (await res.json()) as PassportData
        if (!cancelled) { setData(body); setStatus('ready') }
      })
      .catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [farmerId])

  return (
    <div className="min-h-screen bg-[#F4F8F6]">
      {/* Dark hero */}
      <div className="bg-[#06192C] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#40BBB9]/10" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[#98CF59]/10" />
        <div className="max-w-3xl mx-auto px-6 pt-10 pb-20 relative">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#40BBB9] to-[#22B3DB] flex items-center justify-center">
              <Leaf size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">CarbonSmart</p>
              <p className="text-[#66C390] text-xs font-medium">Solutions Africa</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#98CF59]/20 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} className="text-[#98CF59]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Sustainable Farm Passport — Verified</h1>
              <p className="text-white/50 text-sm mt-0.5">
                Public dMRV verification record{farmerId ? ` for ${farmerId}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 -mt-10 pb-12 relative flex flex-col gap-4">
        {status === 'loading' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-[#40BBB9] border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-gray-400">Verifying passport…</span>
          </div>
        )}

        {(status === 'notfound' || status === 'error') && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <SearchX size={26} className="text-gray-400" />
            </div>
            <p className="text-base font-semibold text-[#06192C]">
              {status === 'notfound' ? 'Passport not found' : 'Verification temporarily unavailable'}
            </p>
            <p className="text-sm text-gray-400 mt-2 max-w-sm">
              {status === 'notfound'
                ? 'We could not find a Sustainable Farm Passport for this ID. Please check the code and try again.'
                : 'We could not reach the verification service. Please try again in a few minutes.'}
            </p>
          </div>
        )}

        {status === 'ready' && data && (
          <>
            {/* Farm identity card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono font-bold text-[#40BBB9]">{data.farmerId}</p>
                  <h2 className="text-xl font-bold text-[#06192C] mt-0.5">{data.farmerName}</h2>
                  <p className="text-sm text-gray-500">{data.farmName}</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#98CF59]/15 text-[#4a7a1e]">
                  <ShieldCheck size={12} /> {data.status}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#40BBB9] shrink-0" />
                  {data.district}, {data.province}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#40BBB9] shrink-0" />
                  Enrolled {formatDate(data.enrolledAt)}
                </div>
              </div>
              {data.cropTypes.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Crops</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.cropTypes.map((c) => (
                      <span key={c} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#98CF59]/15 text-[#4a7a1e]">
                        <Sprout size={11} /> {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {data.farmingPractices.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Practices</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.farmingPractices.map((p) => (
                      <span key={p} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#40BBB9]/15 text-[#1e7a79]">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* dMRV stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: 'Stored CO₂e', value: `${data.dmrv.storedCO2e.toLocaleString('en-ZA')} t`, icon: <Leaf size={16} className="text-[#40BBB9]" />, bg: 'bg-[#40BBB9]/12' },
                { label: 'Cars off road / yr', value: String(data.dmrv.carsOffRoadEquivalent), icon: <Car size={16} className="text-[#336599]" />, bg: 'bg-[#336599]/12' },
                { label: 'Biochar applied', value: `${data.dmrv.biocharAppliedTonnes.toLocaleString('en-ZA')} t`, icon: <Sprout size={16} className="text-[#98CF59]" />, bg: 'bg-[#98CF59]/15' },
                { label: 'Verified samples', value: String(data.dmrv.verifiedSamples), icon: <FlaskConical size={16} className="text-[#22B3DB]" />, bg: 'bg-[#22B3DB]/12' },
                { label: 'Verified photos', value: String(data.dmrv.verifiedPhotos), icon: <Camera size={16} className="text-[#40BBB9]" />, bg: 'bg-[#40BBB9]/12' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${s.bg}`}>
                    {s.icon}
                  </div>
                  <p className="text-lg font-bold text-[#06192C] leading-tight">{s.value}</p>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Methodology */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Award size={16} className="text-[#98CF59]" />
                <h3 className="text-base font-semibold text-[#06192C]">Methodology Compliance</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(data.dmrv.methodologies.length > 0
                  ? data.dmrv.methodologies
                  : ['Verra', 'Puro.earth', 'Gold Standard']
                ).map((m) => (
                  <span key={m} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#06192C] text-white">
                    <ShieldCheck size={12} className="text-[#98CF59]" /> {m}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                This page confirms dMRV-compliant practices without exposing private financial data.
              </p>
              <p className="text-[10px] text-gray-400 mt-2">
                Verified at {new Date(data.verifiedAt).toLocaleString('en-ZA')}
              </p>
            </div>
          </>
        )}

        <p className="text-center text-[10px] text-gray-400 mt-2">
          CarbonSmart Solutions Africa — Sustainable Farm Passport public verification
        </p>
      </div>
    </div>
  )
}
