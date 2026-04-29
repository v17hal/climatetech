import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import {
  LayoutDashboard, Users, Leaf, Map, BarChart3,
  Droplets, Bug, CloudSun, Package, DollarSign,
  FileBarChart, Settings, HelpCircle, LogOut, ChevronLeft, Shield,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Farmers', icon: Users, to: '/farmers' },
  { label: 'Carbon Tracking', icon: Leaf, to: '/carbon' },
  { label: 'Farm Map', icon: Map, to: '/mapping' },
  { label: 'LSM Profiles', icon: BarChart3, to: '/lsm' },
]

const smartFarmingItems = [
  { label: 'Irrigation', icon: Droplets, to: '/smart/irrigation' },
  { label: 'Pest & Disease', icon: Bug, to: '/smart/pest' },
  { label: 'Weather', icon: CloudSun, to: '/smart/weather' },
  { label: 'Inventory', icon: Package, to: '/smart/inventory' },
  { label: 'Financials', icon: DollarSign, to: '/smart/financials' },
]

const bottomItems = [
  { label: 'Analytics', icon: FileBarChart, to: '/analytics' },
  { label: 'Audit Log', icon: Shield, to: '/settings/audit' },
  { label: 'Settings', icon: Settings, to: '/settings' },
  { label: 'Help', icon: HelpCircle, to: '/help' },
]

interface NavItemProps {
  to: string
  icon: React.ElementType
  label: string
  collapsed: boolean
}

function NavItem({ to, icon: Icon, label, collapsed }: NavItemProps) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative',
          isActive
            ? 'bg-[#40BBB9]/20 text-[#40BBB9]'
            : 'text-white/60 hover:bg-white/8 hover:text-white'
        )
      }
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
      {collapsed && (
        <span className="absolute left-full ml-3 px-2 py-1 bg-[#06192C] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-white/10">
          {label}
        </span>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-[#06192C] flex flex-col z-40 transition-all duration-300',
        /* On mobile: full sidebar slides in/out; on lg+: always visible, collapses to icon strip */
        sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#40BBB9] to-[#22B3DB] flex items-center justify-center text-white font-bold text-sm shrink-0">
              CS
            </div>
            <div className="leading-tight">
              <p className="text-white font-bold text-xs">CarbonSmart</p>
              <p className="text-[#66C390] text-[10px] font-medium">Solutions Africa</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#40BBB9] to-[#22B3DB] flex items-center justify-center text-white font-bold text-sm mx-auto">
            CS
          </div>
        )}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Collapse toggle when collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mt-2 text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={14} className="rotate-180" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} collapsed={sidebarCollapsed} />
        ))}

        {!sidebarCollapsed && (
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-3 mt-4 mb-1">
            Smart Farming
          </p>
        )}
        {sidebarCollapsed && <div className="border-t border-white/10 my-2" />}

        {smartFarmingItems.map((item) => (
          <NavItem key={item.to} {...item} collapsed={sidebarCollapsed} />
        ))}

        {!sidebarCollapsed && (
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-3 mt-4 mb-1">
            System
          </p>
        )}
        {sidebarCollapsed && <div className="border-t border-white/10 my-2" />}

        {bottomItems.map((item) => (
          <NavItem key={item.to} {...item} collapsed={sidebarCollapsed} />
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl p-2',
            !sidebarCollapsed && 'hover:bg-white/8 cursor-pointer'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#98CF59] to-[#40BBB9] flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name ?? 'User'}</p>
              <p className="text-white/40 text-[10px] truncate capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="text-white/40 hover:text-red-400 transition-colors p-1 rounded-lg"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
        {sidebarCollapsed && (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center mt-2 text-white/40 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </aside>
  )
}
