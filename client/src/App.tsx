import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppLayout } from '@/components/layout/AppLayout'

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

          {/* Module 9: Analytics & Reporting */}
          <Route path="/analytics" element={<AnalyticsPage />} />

          {/* Settings + Audit */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/audit" element={<AuditLogPage />} />

          {/* Help & Support */}
          <Route path="/help" element={<HelpPage />} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
