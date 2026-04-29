export type UserRole = 'admin' | 'agri_officer' | 'farmer' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  farmerId?: string
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
  category: 'seed' | 'fertilizer' | 'pesticide' | 'equipment' | 'other'
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
