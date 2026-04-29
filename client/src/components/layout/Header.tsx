import { Bell, Search, Menu, WifiOff, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import { useOfflineSync } from '@/hooks/useOfflineSync'

interface HeaderProps {
  title: string
  subtitle?: string
}

const mockAlerts = [
  { id: '1', title: 'Pest alert in Farm CSA-001', time: '2m ago', type: 'critical' },
  { id: '2', title: 'Low inventory: Fertilizer', time: '1h ago', type: 'warning' },
  { id: '3', title: '3 new farmer enrollments', time: '3h ago', type: 'info' },
]

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuthStore()
  const { toggleSidebar } = useUIStore()
  const [showAlerts, setShowAlerts] = useState(false)
  const unreadCount = mockAlerts.length
  const { isOnline, pendingCount, syncing, doSync } = useOfflineSync()

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-[#06192C] p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base font-bold text-[#06192C]">{title}</h1>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-[#F4F8F6] rounded-xl px-3 py-2 w-56 border border-transparent focus-within:border-[#40BBB9] transition-colors">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-[#06192C] placeholder:text-gray-400 outline-none w-full"
          />
        </div>

        {/* Online / offline indicator */}
        {!isOnline ? (
          <div className="hidden sm:flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-2.5 py-1.5">
            <WifiOff size={13} className="text-orange-500" />
            <span className="text-xs font-semibold text-orange-600">Offline</span>
            {pendingCount > 0 && (
              <span className="text-[10px] font-bold bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </div>
        ) : pendingCount > 0 ? (
          <button
            onClick={doSync}
            className="hidden sm:flex items-center gap-1.5 bg-[#40BBB9]/10 border border-[#40BBB9]/30 rounded-xl px-2.5 py-1.5 hover:bg-[#40BBB9]/20 transition-colors"
          >
            <RefreshCw size={13} className={cn('text-[#40BBB9]', syncing && 'animate-spin')} />
            <span className="text-xs font-semibold text-[#40BBB9]">Sync {pendingCount}</span>
          </button>
        ) : null}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-[#06192C]"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#40BBB9] rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-[#06192C]">Notifications</p>
                <span className="text-xs text-[#40BBB9] font-semibold cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              {mockAlerts.map((alert) => (
                <div key={alert.id} className="px-4 py-3 hover:bg-[#F4F8F6] cursor-pointer border-b border-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full mt-1.5 shrink-0',
                        alert.type === 'critical' ? 'bg-red-500' :
                        alert.type === 'warning' ? 'bg-orange-400' : 'bg-[#40BBB9]'
                      )}
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#06192C]">{alert.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="px-4 py-2.5 text-center">
                <span className="text-xs text-[#40BBB9] font-semibold cursor-pointer hover:underline">
                  View all notifications
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#98CF59] to-[#40BBB9] flex items-center justify-center text-white font-bold text-xs">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-xs font-semibold text-[#06192C]">{user?.name ?? 'User'}</p>
            <p className="text-[10px] text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
