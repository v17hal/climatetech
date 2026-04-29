import { useLocation } from 'react-router-dom'

const pageMeta: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Climate Solutions Rooted in African Soil' },
  '/dashboard/custom': { title: 'My Dashboard', subtitle: 'Drag, drop and customise your widgets' },
  '/farmers': { title: 'Farmers', subtitle: 'Manage farmer enrollments and profiles' },
  '/farmers/:id': { title: 'Farmer Profile', subtitle: 'Detailed farmer and farm information' },
  '/carbon': { title: 'Carbon Tracking', subtitle: 'Soil health and carbon sequestration data' },
  '/mapping': { title: 'Farm Map', subtitle: 'GPS boundaries and field monitoring' },
  '/lsm': { title: 'LSM Profiles', subtitle: 'Lifestyle metrics and farm categorisation' },
  '/smart/irrigation': { title: 'Irrigation Management', subtitle: 'Water usage tracking and scheduling' },
  '/smart/pest': { title: 'Pest & Disease', subtitle: 'Outbreak alerts and remedies' },
  '/smart/weather': { title: 'Weather', subtitle: 'Forecasts and climate risk assessment' },
  '/smart/inventory': { title: 'Inventory', subtitle: 'Stock tracking and procurement' },
  '/smart/financials': { title: 'Financials', subtitle: 'Cost-benefit analysis and projections' },
  '/analytics': { title: 'Analytics & Reports', subtitle: 'Customisable dashboards · PDF, CSV, XLS export' },
  '/settings': { title: 'Settings', subtitle: 'Profile, security and platform configuration' },
  '/settings/audit': { title: 'Audit Log', subtitle: 'All platform actions tracked for compliance' },
  '/help': { title: 'Help & Support', subtitle: 'Documentation, FAQs, and contact' },
  '/forgot-password': { title: 'Reset Password', subtitle: undefined },
}

export function usePageMeta() {
  const { pathname } = useLocation()
  return pageMeta[pathname] ?? { title: 'CarbonSmart', subtitle: undefined }
}
