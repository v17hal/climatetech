import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { GDPRBanner } from '@/components/ui/GDPRBanner'
import { cn } from '@/utils/cn'
import { usePageMeta } from '@/hooks/usePageMeta'

export function AppLayout() {
  const { isAuthenticated } = useAuthStore()
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore()
  const { title, subtitle } = usePageMeta()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-[#F4F8F6]">
      {/* Mobile overlay backdrop */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <Sidebar />

      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 min-w-0',
          /* On mobile sidebar is overlay so no margin; on lg+ use margin */
          'ml-0 lg:ml-64',
          sidebarCollapsed && 'lg:ml-16'
        )}
      >
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      <GDPRBanner />
    </div>
  )
}
