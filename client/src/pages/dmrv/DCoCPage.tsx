import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  FlaskConical, Plus, X, AlertTriangle, Camera, CheckCircle2,
  FileText, MapPin,
} from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { Input } from '@/components/ui/Input'
import { api, fileUrl } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'
import type { BiocharBatch, FieldPhoto, SoilSample } from '@/types'

type SampleStatus = SoilSample['status']

interface FarmerOption {
  id: string
  farmerId: string
  farmName: string
  province: string
  user: { name: string; email: string }
}

const STATUS_META: Record<SampleStatus, { dot: string; badge: string; label: string; legend: string }> = {
  sampled: {
    dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700', label: 'Yellow — Sampled',
    legend: 'Sampled in field (geotagged photo uploaded)',
  },
  lab_received: {
    dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700', label: 'Orange — Lab Received',
    legend: 'Received by Lab (waybill uploaded)',
  },
  results_entered: {
    dot: 'bg-[#98CF59]', badge: 'bg-[#98CF59]/15 text-[#4a7a1e]', label: 'Green — Results Entered',
    legend: 'Results Entered (lab PDF attached)',
  },
  rejected: {
    dot: 'bg-red-500', badge: 'bg-red-100 text-red-700', label: 'Red — Rejected',
    legend: 'Rejected (failed SGS lab quality gate)',
  },
}

const STATUS_ORDER: SampleStatus[] = ['sampled', 'lab_received', 'results_entered', 'rejected']

const fmtDate = (d: string) => new Date(d).toISOString().slice(0, 10)

const selectCls = 'w-full bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40 focus:border-[#40BBB9]'
const labelCls = 'text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide'

const emptyPhotoForm = { latitude: '', longitude: '', deviceId: '', farmerId: '' }

export default function DCoCPage() {
  const role = useAuthStore((s) => s.user?.role)
  const readOnly = role === 'vvb_auditor' || role === 'viewer'
  const canCreate = role === 'admin' || role === 'field_officer' || role === 'agri_officer'

  const [samples, setSamples] = useState<SoilSample[]>([])
  const [batches, setBatches] = useState<BiocharBatch[]>([])
  const [farmers, setFarmers] = useState<FarmerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  /* Log Field Sample modal (two steps) */
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoForm, setPhotoForm] = useState(emptyPhotoForm)
  const [uploadedPhoto, setUploadedPhoto] = useState<FieldPhoto | null>(null)
  const [batchId, setBatchId] = useState('')
  const [modalError, setModalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchSamples = useCallback(async () => {
    try {
      const data = await api.get<SoilSample[]>('/api/v1/samples')
      setSamples(data)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Network error — backend unreachable')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSamples() }, [fetchSamples])

  useEffect(() => {
    if (!canCreate) return
    api.get<{ farmers: FarmerOption[] }>('/api/v1/farmers?limit=200')
      .then((r) => setFarmers(r.farmers))
      .catch(() => { /* best-effort */ })
    api.get<BiocharBatch[]>('/api/v1/biochar')
      .then(setBatches)
      .catch(() => { /* best-effort */ })
  }, [canCreate])

  const counts = STATUS_ORDER.reduce<Record<SampleStatus, number>>((acc, s) => {
    acc[s] = samples.filter((x) => x.status === s).length
    return acc
  }, { sampled: 0, lab_received: 0, results_entered: 0, rejected: 0 })

  const openModal = () => {
    setStep(1)
    setPhotoFile(null)
    setPhotoForm(emptyPhotoForm)
    setUploadedPhoto(null)
    setBatchId('')
    setModalError(null)
    setShowModal(true)
  }

  const uploadPhoto = async () => {
    if (!photoFile) return
    setModalError(null)
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('photo', photoFile)
      fd.append('utcTimestamp', new Date().toISOString())
      fd.append('latitude', photoForm.latitude)
      fd.append('longitude', photoForm.longitude)
      fd.append('deviceId', photoForm.deviceId)
      if (photoForm.farmerId) fd.append('farmerId', photoForm.farmerId)
      fd.append('photoType', 'sample')
      const photo = await api.upload<FieldPhoto>('/api/v1/evidence/photos', fd)
      setUploadedPhoto(photo)
      setStep(2)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Photo upload failed')
    } finally {
      setSaving(false)
    }
  }

  const createSample = async () => {
    if (!uploadedPhoto) return
    setModalError(null)
    setSaving(true)
    try {
      await api.post('/api/v1/samples', {
        photoId: uploadedPhoto.id,
        batchId: batchId || undefined,
        farmerId: photoForm.farmerId || undefined,
      })
      toast.success('Field sample logged — dCoC status: Yellow')
      setShowModal(false)
      fetchSamples()
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to log sample')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#06192C]">dCoC Status Tracker</h1>
          <p className="text-sm text-gray-400">Field Officer Command Centre — digital Chain of Custody for soil samples</p>
        </div>
        {readOnly ? (
          <Badge variant="gray">Read-only audit access</Badge>
        ) : canCreate ? (
          <Button size="sm" onClick={openModal}><Plus size={14} /> Log Field Sample</Button>
        ) : null}
      </div>

      {/* Traffic-light legend */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span className={cn('w-2.5 h-2.5 rounded-full', STATUS_META[s].dot)} />
              <span className="text-xs text-gray-500"><span className="font-bold text-[#06192C]">{STATUS_META[s].label.split(' — ')[0]}</span> = {STATUS_META[s].legend}</span>
            </div>
          ))}
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
          {/* Status counts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Sampled (Yellow)" value={counts.sampled}
              icon={<FlaskConical size={20} className="text-amber-500" />} iconBg="bg-amber-100" />
            <StatCard title="Lab Received (Orange)" value={counts.lab_received}
              icon={<FlaskConical size={20} className="text-orange-500" />} iconBg="bg-orange-100" />
            <StatCard title="Results Entered (Green)" value={counts.results_entered}
              icon={<CheckCircle2 size={20} className="text-[#98CF59]" />} iconBg="bg-[#98CF59]/15" />
            <StatCard title="Rejected (Red)" value={counts.rejected}
              icon={<X size={20} className="text-red-500" />} iconBg="bg-red-100" />
          </div>

          {/* Samples table */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100">
              <CardTitle>Soil Samples ({samples.length})</CardTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Sample Code', 'Batch', 'Farmer', 'Status', 'Waybill #', 'GPS Coordinates', 'Sampled At', 'Photo', 'Lab Result', 'Certificate'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {samples.length === 0 && (
                    <tr><td colSpan={10} className="px-5 py-8 text-center text-xs text-gray-400">No samples logged yet.</td></tr>
                  )}
                  {samples.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                      <td className="px-5 py-3 text-xs font-semibold text-[#06192C] whitespace-nowrap">{s.sampleCode}</td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {s.batch ? <>{s.batch.batchNumber}<span className="text-gray-300"> · </span>{s.batch.region}</> : '—'}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {s.farmer ? `${s.farmer.farmName} (${s.farmer.farmerId})` : '—'}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={cn('w-2 h-2 rounded-full', STATUS_META[s.status].dot)} />
                          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', STATUS_META[s.status].badge)}>
                            {STATUS_META[s.status].label}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{s.waybillNumber ?? '—'}</td>
                      <td className="px-5 py-3 text-xs whitespace-nowrap">
                        {s.photo ? (
                          <a
                            href={`https://www.google.com/maps?q=${s.photo.latitude},${s.photo.longitude}`}
                            target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-[#22B3DB] hover:underline"
                            title="Open in Google Maps"
                          >
                            <MapPin size={11} />
                            {s.photo.latitude.toFixed(5)}, {s.photo.longitude.toFixed(5)}
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(s.sampledAt)}</td>
                      <td className="px-5 py-3">
                        {s.photo ? (
                          <img src={fileUrl(s.photo.filePath)} alt={s.sampleCode} className="h-10 w-14 object-cover rounded" />
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs whitespace-nowrap">
                        {s.labResult ? (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">C-org {s.labResult.cOrgPercent}% · H:C {s.labResult.hcRatio}</span>
                            <Badge variant={s.labResult.heavyMetalsPass ? 'green' : 'red'}>
                              {s.labResult.heavyMetalsPass ? 'Metals pass' : 'Metals fail'}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-300">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {s.labResult?.certificatePath ? (
                          <a href={fileUrl(s.labResult.certificatePath)} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#22B3DB] hover:underline">
                            <FileText size={12} /> Certificate
                          </a>
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

      {/* Log Field Sample modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#06192C]/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-sm font-bold text-[#06192C]">
                Log Field Sample — Step {step} of 2 {step === 1 ? '(Geotagged Photo)' : '(Sample Details)'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {modalError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs font-semibold text-red-700">{modalError}</p>
                </div>
              )}

              {step === 1 ? (
                <>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Camera size={13} className="text-[#40BBB9]" /> Evidence lock: a geotagged photo is required before a sample can be logged. UTC timestamp is captured automatically.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Photo (JPEG/PNG/WebP)</label>
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                      className="text-xs text-gray-500 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-[#40BBB9]/12 file:text-[#40BBB9] file:text-xs file:font-semibold file:cursor-pointer" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Latitude" type="number" placeholder="-26.20227" value={photoForm.latitude}
                      onChange={(e) => setPhotoForm({ ...photoForm, latitude: e.target.value })} />
                    <Input label="Longitude" type="number" placeholder="28.04363" value={photoForm.longitude}
                      onChange={(e) => setPhotoForm({ ...photoForm, longitude: e.target.value })} />
                  </div>
                  <Input label="Device ID" placeholder="FO-TAB-014" value={photoForm.deviceId}
                    onChange={(e) => setPhotoForm({ ...photoForm, deviceId: e.target.value })} />
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Farmer</label>
                    <select className={selectCls} value={photoForm.farmerId}
                      onChange={(e) => setPhotoForm({ ...photoForm, farmerId: e.target.value })}>
                      <option value="">No farmer linked</option>
                      {farmers.map((f) => (
                        <option key={f.id} value={f.id}>{f.farmerId} — {f.farmName} ({f.user.name})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                    <Button onClick={uploadPhoto} loading={saving} className="flex-1"
                      disabled={!photoFile || !photoForm.latitude || !photoForm.longitude || !photoForm.deviceId}>
                      Upload Photo
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {uploadedPhoto && (
                    <>
                      <div className="flex items-center gap-3">
                        <img src={fileUrl(uploadedPhoto.filePath)} alt="Uploaded evidence" className="h-16 w-24 object-cover rounded-xl" />
                        <div className="text-xs text-gray-500">
                          <p className="flex items-center gap-1"><MapPin size={11} className="text-[#40BBB9]" /> {uploadedPhoto.latitude.toFixed(5)}, {uploadedPhoto.longitude.toFixed(5)}</p>
                          <p>{new Date(uploadedPhoto.utcTimestamp).toISOString()}</p>
                          <p>Device: {uploadedPhoto.deviceId}</p>
                        </div>
                      </div>
                      {uploadedPhoto.verificationStatus === 'verified' && (
                        <div className="bg-[#98CF59]/15 border border-[#98CF59]/40 rounded-xl p-3 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-[#4a7a1e] shrink-0" />
                          <p className="text-xs font-semibold text-[#4a7a1e]">Verified Location — GPS point falls inside the farmer's registered boundary.</p>
                        </div>
                      )}
                      {uploadedPhoto.verificationStatus === 'flagged_boundary_mismatch' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                          <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                          <p className="text-xs font-semibold text-red-700">AUDIT ALERT — Boundary mismatch: the GPS point falls outside the farmer's registered boundary. An admin audit alert has been raised.</p>
                        </div>
                      )}
                      {uploadedPhoto.verificationStatus === 'pending' && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                          <p className="text-xs font-semibold text-gray-500">Verification pending — no farmer boundary linked to this photo.</p>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Biochar Batch (optional)</label>
                    <select className={selectCls} value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                      <option value="">No batch linked</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>{b.batchNumber} — {b.region}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                    <Button onClick={createSample} loading={saving} className="flex-1">Log Sample (Yellow)</Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
