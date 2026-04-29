import type { Farmer, CarbonRecord } from '@/types'

export const mockFarmers: Farmer[] = [
  {
    id: 'f001', farmerId: 'CSA-2024-00001', name: 'Thabo Mokoena', email: 'thabo@example.com',
    phone: '+27 82 456 7890', nationalId: '8001015001087', province: 'Limpopo',
    district: 'Capricorn', farmName: 'Mokoena Green Farm', farmSize: 45, farmSizeUnit: 'ha',
    cropTypes: ['Maize', 'Sorghum'], farmingPractices: ['Crop Rotation', 'Composting'],
    lsmScore: 72, lsmCategory: 'LSM4', enrolledAt: '2024-01-15', status: 'active',
    coordinates: [-23.9045, 29.4689],
  },
  {
    id: 'f002', farmerId: 'CSA-2024-00002', name: 'Amina Bello', email: 'amina@example.com',
    phone: '+27 73 123 4567', nationalId: '8503025002081', province: 'KwaZulu-Natal',
    district: 'uMgungundlovu', farmName: 'Bello Sugar Estate', farmSize: 120, farmSizeUnit: 'ha',
    cropTypes: ['Sugar Cane'], farmingPractices: ['Drip Irrigation', 'No-Till'],
    lsmScore: 85, lsmCategory: 'LSM5', enrolledAt: '2024-01-22', status: 'active',
    coordinates: [-29.5947, 30.3977],
  },
  {
    id: 'f003', farmerId: 'CSA-2024-00003', name: 'Samuel Osei', email: 'samuel@example.com',
    phone: '+27 61 789 0123', nationalId: '9202101003086', province: 'North West',
    district: 'Bojanala', farmName: 'Osei Soybean Fields', farmSize: 30, farmSizeUnit: 'ha',
    cropTypes: ['Soybeans', 'Sunflower'], farmingPractices: ['Mulching'],
    lsmScore: 54, lsmCategory: 'LSM3', enrolledAt: '2024-02-03', status: 'pending',
    coordinates: [-25.6544, 27.2343],
  },
  {
    id: 'f004', farmerId: 'CSA-2024-00004', name: 'Grace Mutua', email: 'grace@example.com',
    phone: '+27 84 321 6543', nationalId: '7811055004083', province: 'Mpumalanga',
    district: 'Ehlanzeni', farmName: 'Mutua Wheat & Maize', farmSize: 78, farmSizeUnit: 'ha',
    cropTypes: ['Wheat', 'Maize'], farmingPractices: ['Crop Rotation', 'Cover Crops'],
    lsmScore: 68, lsmCategory: 'LSM4', enrolledAt: '2024-02-14', status: 'active',
    coordinates: [-25.4752, 30.9694],
  },
  {
    id: 'f005', farmerId: 'CSA-2024-00005', name: 'Emmanuel Ndlovu', email: 'emmanuel@example.com',
    phone: '+27 71 654 3210', nationalId: '8607195005088', province: 'Eastern Cape',
    district: 'OR Tambo', farmName: 'Ndlovu Vegetable Farm', farmSize: 55, farmSizeUnit: 'ha',
    cropTypes: ['Vegetables', 'Fruit'], farmingPractices: ['Organic Farming', 'Composting'],
    lsmScore: 61, lsmCategory: 'LSM3', enrolledAt: '2024-02-28', status: 'active',
    coordinates: [-31.5897, 28.7847],
  },
  {
    id: 'f006', farmerId: 'CSA-2024-00006', name: 'Fatima Diallo', email: 'fatima@example.com',
    phone: '+27 79 876 5432', nationalId: '9512310006080', province: 'Western Cape',
    district: 'Cape Winelands', farmName: 'Diallo Fruit Estate', farmSize: 200, farmSizeUnit: 'ha',
    cropTypes: ['Fruit', 'Vegetables'], farmingPractices: ['Integrated Pest Management', 'Drip Irrigation'],
    lsmScore: 91, lsmCategory: 'LSM5', enrolledAt: '2024-03-05', status: 'active',
    coordinates: [-33.9249, 18.4241],
  },
  {
    id: 'f007', farmerId: 'CSA-2024-00007', name: 'Kwame Asante', email: 'kwame@example.com',
    phone: '+27 82 111 2222', nationalId: '8804150007085', province: 'Free State',
    district: 'Thabo Mofutsanyana', farmName: 'Asante Grain Farm', farmSize: 350, farmSizeUnit: 'ha',
    cropTypes: ['Maize', 'Wheat', 'Soybeans'], farmingPractices: ['Precision Agriculture', 'No-Till'],
    lsmScore: 79, lsmCategory: 'LSM4', enrolledAt: '2024-03-18', status: 'active',
    coordinates: [-28.3667, 27.4833],
  },
  {
    id: 'f008', farmerId: 'CSA-2024-00008', name: 'Nomsa Dlamini', email: 'nomsa@example.com',
    phone: '+27 63 999 8877', nationalId: '9001230008082', province: 'Gauteng',
    district: 'Sedibeng', farmName: 'Dlamini Urban Farm', farmSize: 8, farmSizeUnit: 'ha',
    cropTypes: ['Vegetables'], farmingPractices: ['Hydroponic', 'Organic Farming'],
    lsmScore: 45, lsmCategory: 'LSM2', enrolledAt: '2024-04-01', status: 'inactive',
    coordinates: [-26.5225, 27.8631],
  },
  {
    id: 'f009', farmerId: 'CSA-2024-00009', name: 'Ibrahim Koné', email: 'ibrahim@example.com',
    phone: '+27 74 444 5555', nationalId: '8302140009089', province: 'Northern Cape',
    district: 'Frances Baard', farmName: 'Koné Arid Agriculture', farmSize: 600, farmSizeUnit: 'ha',
    cropTypes: ['Cotton', 'Sorghum'], farmingPractices: ['Water Harvesting', 'Minimal Tillage'],
    lsmScore: 58, lsmCategory: 'LSM3', enrolledAt: '2024-04-10', status: 'active',
    coordinates: [-28.7282, 24.7499],
  },
  {
    id: 'f010', farmerId: 'CSA-2024-00010', name: 'Zanele Khumalo', email: 'zanele@example.com',
    phone: '+27 81 333 4455', nationalId: '9708290010084', province: 'Limpopo',
    district: 'Mopani', farmName: 'Khumalo Citrus Farm', farmSize: 95, farmSizeUnit: 'ha',
    cropTypes: ['Fruit', 'Sugar Cane'], farmingPractices: ['Drip Irrigation', 'Mulching'],
    lsmScore: 74, lsmCategory: 'LSM4', enrolledAt: '2024-04-22', status: 'active',
    coordinates: [-23.7000, 30.4000],
  },
]

export const generateCarbonRecords = (farmerId: string): CarbonRecord[] => {
  const months = ['2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04']
  return months.map((month, i) => ({
    id: `cr-${farmerId}-${i}`,
    farmerId,
    date: `${month}-15`,
    carbonLevel: parseFloat((3.2 + i * 0.35 + Math.random() * 0.5).toFixed(2)),
    soilPH: parseFloat((6.2 + Math.random() * 0.8).toFixed(1)),
    organicMatter: parseFloat((2.1 + i * 0.12 + Math.random() * 0.3).toFixed(2)),
    moisture: parseFloat((28 + Math.random() * 15).toFixed(1)),
    inputMethod: i % 3 === 0 ? 'sensor' : 'manual',
    notes: i % 4 === 0 ? 'Post-rainfall reading' : undefined,
  }))
}

export const provinceOptions = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
]

export const cropOptions = ['Maize', 'Wheat', 'Sorghum', 'Sunflower', 'Soybeans', 'Vegetables', 'Fruit', 'Cotton', 'Sugar Cane', 'Other']

export const practiceOptions = [
  'Crop Rotation', 'Composting', 'Drip Irrigation', 'No-Till', 'Mulching',
  'Organic Farming', 'Cover Crops', 'Precision Agriculture', 'Integrated Pest Management',
  'Water Harvesting', 'Minimal Tillage', 'Hydroponic',
]
