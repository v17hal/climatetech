export type UserRole =
  | 'admin'
  | 'field_officer'
  | 'lab_technician'
  | 'vvb_auditor'
  | 'farmer'
  /** legacy aliases (accepted, normalised by the backend) */
  | 'agri_officer'
  | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  farmerId?: string
  /** Farmer DB id (for impact dashboard lookups) */
  farmerDbId?: string
  avatar?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface Farmer {
  id: string
  farmerId: string
  name: string
  email: string
  phone: string
  nationalId: string
  province: string
  district: string
  farmName: string
  farmSize: number
  farmSizeUnit: 'ha' | 'acres'
  cropTypes: string[]
  farmingPractices: string[]
  lsmScore?: number
  lsmCategory?: LSMCategory
  enrolledAt: string
  status: 'active' | 'inactive' | 'pending'
  coordinates?: [number, number]
}

export type LSMCategory = 'LSM1' | 'LSM2' | 'LSM3' | 'LSM4' | 'LSM5'

export interface CarbonRecord {
  id: string
  farmerId: string
  date: string
  carbonLevel: number
  soilPH: number
  organicMatter: number
  moisture: number
  inputMethod: 'sensor' | 'manual'
  notes?: string
}

export interface WeatherData {
  location: string
  temperature: number
  humidity: number
  rainfall: number
  windSpeed: number
  forecast: ForecastDay[]
  climateRiskScore: number
}

export interface ForecastDay {
  date: string
  high: number
  low: number
  condition: string
  icon: string
  rainfall: number
}

export interface InventoryItem {
  id: string
  name: string
  category: 'seed' | 'crop' | 'livestock' | 'other'
  quantity: number
  unit: string
  reorderLevel: number
  lastUpdated: string
}

export interface Alert {
  id: string
  type: 'pest' | 'weather' | 'low_stock' | 'carbon' | 'compliance' | 'info'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  farmerId?: string
  createdAt: string
  read: boolean
}

/* ── dMRV (biochar registry & operations) ─────────────────────── */

export type DcocStatus = 'produced' | 'sampled' | 'lab_received' | 'results_entered' | 'rejected'

export interface BiocharBatch {
  id: string
  batchNumber: string
  productionDate: string
  feedstockType: string
  pyrolysisTemp: number
  rawWeightTonnes: number
  region: string
  cOrgPercent: number | null
  hcRatio: number | null
  heavyMetalsPass: boolean | null
  dcocStatus: DcocStatus
  issuanceEligible: boolean
  shipments?: Shipment[]
  applications?: ApplicationRecord[]
  computed?: BatchComputed
}

export interface BatchComputed {
  massBalance: { produced: number; shipped: number; applied: number; remaining: number }
  grossCO2e: number
  deductionsCO2e: number
  netCO2e: number
  creditableCO2e: number
}

export interface Shipment {
  id: string
  batchId: string
  date: string
  weightTonnes: number
  destination: string
  waybillNumber: string
  mileageKm: number
}

export interface ApplicationRecord {
  id: string
  batchId: string
  farmerId: string
  date: string
  weightTonnes: number
  notes?: string
  farmer?: { farmerId: string; farmName: string }
}

export interface FieldPhoto {
  id: string
  filePath: string
  utcTimestamp: string
  latitude: number
  longitude: number
  deviceId: string
  photoType: 'field' | 'sample' | 'before' | 'after'
  caption?: string
  farmerId?: string
  isVerified: boolean
  verificationStatus: 'verified' | 'flagged_boundary_mismatch' | 'pending'
  farmer?: { farmerId: string; farmName: string }
  uploadedBy?: { name: string; role: string }
}

export interface SoilSample {
  id: string
  sampleCode: string
  batchId?: string
  farmerId?: string
  status: 'sampled' | 'lab_received' | 'results_entered' | 'rejected'
  photoId?: string
  photo?: FieldPhoto
  waybillNumber?: string
  // Custody chain (Admin #4)
  sampledByName?: string
  sampledAt: string
  collectedByName?: string
  collectedAt?: string
  deliveredByName?: string
  deliveredAt?: string
  labReceivedAt?: string
  packagingType?: string
  packagingTempC?: number
  labResult?: LabResult
  batch?: { batchNumber: string; region: string }
  farmer?: { farmerId: string; farmName: string }
}

export interface BaselineTest {
  id: string
  farmerId: string
  testDate: string
  soilPH: number
  organicMatter: number
  moisture: number
  soilCarbon: number
  temperature?: number
  labName: string
  testedBy?: string
  notes?: string
}

export interface LabResult {
  id: string
  sampleId: string
  cOrgPercent: number
  hcRatio: number
  heavyMetalsPass: boolean
  soilPH?: number
  electricalConductivity?: number
  bulkDensity?: number
  specificSurfaceArea?: number
  waterHoldingCapacity?: number
  certificatePath: string
  enteredAt: string
}

export interface SeasonalityPlan {
  id: string
  region: string
  cropType: string
  year: number
  plannedPlantingDate: string
  actualPlantingDate?: string
  windowStart: string
  windowEnd: string
}

export interface HarvestRecord {
  id: string
  farmerId?: string
  region: string
  cropType: string
  harvestDate: string
  weightTonnes: number
  moisturePercent: number
  plotType: 'project' | 'control'
  flagged: boolean
  flagReason?: string
  farmer?: { farmerId: string; farmName: string }
}

export interface YieldSummaryRow {
  region: string
  cropType: string
  projectPlots: number
  controlPlots: number
  projectTonnes: number
  controlTonnes: number
  flaggedEntries: number
  yieldIncreasePercent: number | null
}

export interface Payout {
  id: string
  farmerId: string
  date: string
  amount: number
  currency: string
  type: 'payment' | 'discount'
  description: string
}

export interface FarmerImpact {
  farmer: { id: string; farmerId: string; name: string; farmName: string; province: string; cropTypes: string[] }
  soilHealth: {
    latest: LabSeriesPoint | null
    first: LabSeriesPoint | null
    series: LabSeriesPoint[]
    waterSavingPercent: number | null
  }
  carbonBank: {
    storedCO2e: number
    carsOffRoad: number
    biocharAppliedTonnes: number
    totalEarned: number
    payouts: Payout[]
  }
  evidence: { photos: FieldPhoto[]; verifiedCount: number }
}

export interface LabSeriesPoint {
  date: string
  soilPH: number | null
  electricalConductivity: number | null
  bulkDensity: number | null
  waterHoldingCapacity: number | null
  specificSurfaceArea: number | null
}

export interface PassportData {
  farmerId: string
  farmerName: string
  farmName: string
  province: string
  district: string
  cropTypes: string[]
  farmingPractices: string[]
  enrolledAt: string
  status: string
  dmrv: {
    storedCO2e: number
    carsOffRoadEquivalent: number
    biocharAppliedTonnes: number
    verifiedSamples: number
    verifiedPhotos: number
    methodologies: string[]
  }
  verifiedAt: string
}

export interface DashboardStats {
  totalFarmers: number
  farmersGrowth: number
  carbonTracked: number
  carbonGrowth: number
  activeFarms: number
  activeFarmsGrowth: number
  complianceRate: number
  complianceGrowth: number
}
