import { api } from '@/services/api'
import type { Farmer } from '@/types'

/** Farmer row as returned by the backend (GET /api/v1/farmers). */
export interface ApiFarmer {
  id: string
  farmerId: string
  userId: string
  phone: string
  nationalId: string
  farmName: string
  farmSize: number
  farmSizeUnit: 'ha' | 'acres'
  province: string
  district: string
  /** JSON-encoded string array */
  cropTypes: string
  /** JSON-encoded string array */
  farmingPractices: string
  latitude: number | null
  longitude: number | null
  lsmScore: number | null
  lsmCategory: Farmer['lsmCategory'] | null
  status: Farmer['status']
  enrolledAt: string
  user: { name: string; email: string }
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Map a backend farmer record onto the frontend Farmer type. */
export function mapApiFarmer(f: ApiFarmer): Farmer {
  return {
    id: f.id,
    farmerId: f.farmerId,
    name: f.user?.name ?? '',
    email: f.user?.email ?? '',
    phone: f.phone,
    nationalId: f.nationalId,
    province: f.province,
    district: f.district,
    farmName: f.farmName,
    farmSize: f.farmSize,
    farmSizeUnit: f.farmSizeUnit,
    cropTypes: parseJsonArray(f.cropTypes),
    farmingPractices: parseJsonArray(f.farmingPractices),
    lsmScore: f.lsmScore ?? undefined,
    lsmCategory: f.lsmCategory ?? undefined,
    enrolledAt: f.enrolledAt,
    status: f.status,
    coordinates:
      f.latitude != null && f.longitude != null
        ? [f.latitude, f.longitude]
        : undefined,
  }
}

/** Fetch the live farmers list, mapped to the frontend Farmer type. */
export function fetchFarmers(limit = 200): Promise<Farmer[]> {
  return api
    .get<{ farmers: ApiFarmer[]; total: number }>(`/api/v1/farmers?limit=${limit}`)
    .then((d) => d.farmers.map(mapApiFarmer))
}
