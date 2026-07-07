import { useEffect, useState } from 'react'
import {
  Camera, AlertTriangle, CheckCircle2, Clock, MapPin, Smartphone, User,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { api, fileUrl } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'
import type { FieldPhoto } from '@/types'

type Filter = 'all' | 'verified' | 'flagged_boundary_mismatch' | 'pending'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'verified', label: 'Verified' },
  { key: 'flagged_boundary_mismatch', label: 'Flagged' },
  { key: 'pending', label: 'Pending' },
]

const TYPE_VARIANT: Record<FieldPhoto['photoType'], 'green' | 'cyan' | 'blue' | 'orange'> = {
  field: 'green', sample: 'cyan', before: 'blue', after: 'orange',
}

function VerificationBadge({ status }: { status: FieldPhoto['verificationStatus'] }) {
  if (status === 'verified') return <Badge variant="green"><CheckCircle2 size={10} /> Verified Location</Badge>
  if (status === 'flagged_boundary_mismatch') return <Badge variant="red"><AlertTriangle size={10} /> Boundary Mismatch</Badge>
  return <Badge variant="gray">Pending</Badge>
}

export default function CameraLogPage() {
  const role = useAuthStore((s) => s.user?.role)
  const readOnly = role === 'vvb_auditor' || role === 'viewer'

  const [photos, setPhotos] = useState<FieldPhoto[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    api.get<FieldPhoto[]>('/api/v1/evidence/photos')
      .then((data) => { setPhotos(data); setLoadError(null) })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Network error — backend unreachable'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? photos : photos.filter((p) => p.verificationStatus === filter)
  const verifiedCount = photos.filter((p) => p.verificationStatus === 'verified').length
  const flaggedCount = photos.filter((p) => p.verificationStatus === 'flagged_boundary_mismatch').length
  const pendingCount = photos.filter((p) => p.verificationStatus === 'pending').length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#06192C]">Camera Log Review</h1>
          <p className="text-sm text-gray-400">Geotagged field evidence with UTC timestamp, GPS coordinates and device ID</p>
        </div>
        {readOnly && <Badge variant="gray">Read-only audit access</Badge>}
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
            <StatCard title="Total Photos" value={photos.length}
              icon={<Camera size={20} className="text-[#40BBB9]" />} iconBg="bg-[#40BBB9]/12" />
            <StatCard title="Verified" value={verifiedCount}
              icon={<CheckCircle2 size={20} className="text-[#98CF59]" />} iconBg="bg-[#98CF59]/15" />
            <StatCard title="Flagged" value={flaggedCount}
              icon={<AlertTriangle size={20} className="text-red-500" />} iconBg="bg-red-100" />
            <StatCard title="Pending" value={pendingCount}
              icon={<Clock size={20} className="text-gray-400" />} iconBg="bg-gray-100" />
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
                  filter === f.key
                    ? 'bg-[#40BBB9] text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-[#40BBB9]/50 hover:text-[#40BBB9]'
                )}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Photo grid */}
          {filtered.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 py-10 text-center">
              <Camera size={24} className="text-gray-300" />
              <p className="text-xs text-gray-400">No photos match this filter.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <Card key={p.id} padding="none" className="overflow-hidden flex flex-col">
                  <img src={fileUrl(p.filePath)} alt={p.caption ?? `Field photo ${p.id}`}
                    className="w-full h-44 object-cover bg-gray-100" />
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={TYPE_VARIANT[p.photoType]} className="capitalize">{p.photoType}</Badge>
                      <VerificationBadge status={p.verificationStatus} />
                    </div>
                    {p.caption && <p className="text-xs text-gray-500">{p.caption}</p>}
                    <div className="flex flex-col gap-1.5 text-xs text-gray-500">
                      <p className="flex items-center gap-1.5">
                        <Clock size={12} className="text-[#40BBB9] shrink-0" />
                        <span className="font-mono">{new Date(p.utcTimestamp).toISOString()}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-[#40BBB9] shrink-0" />
                        <span className="font-mono">{p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Smartphone size={12} className="text-[#40BBB9] shrink-0" />
                        <span className="font-mono">{p.deviceId}</span>
                      </p>
                      {p.farmer && (
                        <p className="flex items-center gap-1.5">
                          <User size={12} className="text-[#40BBB9] shrink-0" />
                          <span>{p.farmer.farmName} ({p.farmer.farmerId})</span>
                        </p>
                      )}
                    </div>
                    {p.uploadedBy && (
                      <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-2">
                        Uploaded by {p.uploadedBy.name} · {p.uploadedBy.role.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
