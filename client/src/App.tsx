import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuthStore } from '@/store/authStore'
import { landingPathForRole } from '@/utils/roleLanding'

/* Redirect "/" and unknown paths to the user's role-appropriate landing page
   (or /login if not authenticated). */
function RoleLanding() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={landingPathForRole(user?.role)} replace />
}

/* Auth */
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'

/* Core modules */
import DashboardPage from '@/pages/dashboard/DashboardPage'
import CustomDashboardPage from '@/pages/dashboard/CustomDashboardPage'
import FarmersPage from '@/pages/farmers/FarmersPage'
import FarmerDetailPage from '@/pages/farmers/FarmerDetailPage'
import CarbonPage from '@/pages/carbon/CarbonPage'
import MappingPage from '@/pages/mapping/MappingPage'
import LSMPage from '@/pages/lsm/LSMPage'

/* Smart Farming */
import IrrigationPage from '@/pages/smart-farming/IrrigationPage'
import PestPage from '@/pages/smart-farming/PestPage'
import WeatherPage from '@/pages/smart-farming/WeatherPage'
import InventoryPage from '@/pages/smart-farming/InventoryPage'
import FinancialsPage from '@/pages/smart-farming/FinancialsPage'

/* Analytics, Settings, Help, Audit */
import AnalyticsPage from '@/pages/analytics/AnalyticsPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import AuditLogPage from '@/pages/settings/AuditLogPage'
import HelpPage from '@/pages/help/HelpPage'

/* dMRV — Biochar Registry & Operations */
import BiocharPage from '@/pages/dmrv/BiocharPage'
import DCoCPage from '@/pages/dmrv/DCoCPage'
import CameraLogPage from '@/pages/dmrv/CameraLogPage'
import HarvestPage from '@/pages/dmrv/HarvestPage'
import SeasonalityPage from '@/pages/dmrv/SeasonalityPage'
import LedgerPage from '@/pages/dmrv/LedgerPage'

/* Farmer Value & Impact, Lab Portal, Public Passport */
import FarmerImpactPage from '@/pages/impact/FarmerImpactPage'
import PassportPublicPage from '@/pages/impact/PassportPublicPage'
import LabPortalPage from '@/pages/lab/LabPortalPage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Montserrat, Arial, sans-serif',
            fontSize: '13px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          },
          success: { iconTheme: { primary: '#40BBB9', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Public Sustainable Farm Passport (QR target — no auth) */}
        <Route path="/passport/:farmerId" element={<PassportPublicPage />} />

        {/* Protected app — guarded by AppLayout (redirects to /login if unauthenticated) */}
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/custom" element={<CustomDashboardPage />} />

          {/* Module 4: Farmer Management */}
          <Route path="/farmers" element={<FarmersPage />} />
          <Route path="/farmers/:id" element={<FarmerDetailPage />} />

          {/* Module 5: Carbon Tracking */}
          <Route path="/carbon" element={<CarbonPage />} />

          {/* Module 6: Geolocation & Mapping */}
          <Route path="/mapping" element={<MappingPage />} />

          {/* Module 7: LSM Profiles */}
          <Route path="/lsm" element={<LSMPage />} />

          {/* Module 8: Smart Farming */}
          <Route path="/smart/irrigation" element={<IrrigationPage />} />
          <Route path="/smart/pest" element={<PestPage />} />
          <Route path="/smart/weather" element={<WeatherPage />} />
          <Route path="/smart/inventory" element={<InventoryPage />} />
          <Route path="/smart/financials" element={<FinancialsPage />} />

          {/* dMRV: Biochar Registry & Operations */}
          <Route path="/dmrv/biochar" element={<BiocharPage />} />
          <Route path="/dmrv/dcoc" element={<DCoCPage />} />
          <Route path="/dmrv/camera-log" element={<CameraLogPage />} />
          <Route path="/dmrv/harvest" element={<HarvestPage />} />
          <Route path="/dmrv/seasonality" element={<SeasonalityPage />} />
          <Route path="/dmrv/ledger" element={<LedgerPage />} />

          {/* Farmer Value & Impact + Lab Portal */}
          <Route path="/impact" element={<FarmerImpactPage />} />
          <Route path="/lab" element={<LabPortalPage />} />

          {/* Module 9: Analytics & Reporting */}
          <Route path="/analytics" element={<AnalyticsPage />} />

          {/* Settings + Audit */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/audit" element={<AuditLogPage />} />

          {/* Help & Support */}
          <Route path="/help" element={<HelpPage />} />
        </Route>

        {/* Root + catch-all → role-appropriate landing page */}
        <Route path="/" element={<RoleLanding />} />
        <Route path="*" element={<RoleLanding />} />
      </Routes>
    </BrowserRouter>
  )
}
