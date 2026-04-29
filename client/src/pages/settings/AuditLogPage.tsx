import { useState } from 'react'
import { Shield, Search, Filter, Download, Eye, Edit2, Trash2, LogIn, UserPlus } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/format'

type Action = 'login' | 'create' | 'update' | 'delete' | 'view' | 'register' | 'export'

interface AuditEntry {
  id: string; userId: string; userName: string; userRole: string
  action: Action; resource: string; resourceId?: string
  detail: string; ip: string; timestamp: string; durationMs: number; success: boolean
}

const ACTION_ICONS: Record<Action, React.ReactNode> = {
  login: <LogIn size={12} />, register: <UserPlus size={12} />,
  create: <UserPlus size={12} />, view: <Eye size={12} />,
  update: <Edit2 size={12} />, delete: <Trash2 size={12} />,
  export: <Download size={12} />,
}

const ACTION_COLORS: Record<Action, 'green' | 'blue' | 'cyan' | 'orange' | 'red' | 'gray'> = {
  login: 'green', register: 'green', create: 'cyan',
  view: 'gray', update: 'blue', delete: 'red', export: 'orange',
}

/* Mock audit entries */
const MOCK_ENTRIES: AuditEntry[] = [
  { id: '1', userId: 'u1', userName: 'Sipho Dlamini', userRole: 'admin', action: 'login', resource: 'auth', detail: 'Admin login — Chrome/Win11', ip: '196.35.11.42', timestamp: '2025-04-23T09:42:00Z', durationMs: 142, success: true },
  { id: '2', userId: 'u1', userName: 'Sipho Dlamini', userRole: 'admin', action: 'create', resource: 'farmer', resourceId: 'CSA-2025-00441', detail: 'Enrolled farmer: Thabo Mokoena', ip: '196.35.11.42', timestamp: '2025-04-23T09:48:12Z', durationMs: 312, success: true },
  { id: '3', userId: 'u2', userName: 'Amara Osei', userRole: 'agri_officer', action: 'login', resource: 'auth', detail: 'Officer login — Mobile Safari', ip: '102.67.88.5', timestamp: '2025-04-23T10:02:33Z', durationMs: 188, success: true },
  { id: '4', userId: 'u2', userName: 'Amara Osei', userRole: 'agri_officer', action: 'create', resource: 'carbon', resourceId: 'CSA-2024-00003', detail: 'Carbon reading submitted — 4.8 tCO₂/ha (manual)', ip: '102.67.88.5', timestamp: '2025-04-23T10:15:01Z', durationMs: 224, success: true },
  { id: '5', userId: 'u1', userName: 'Sipho Dlamini', userRole: 'admin', action: 'export', resource: 'analytics', detail: 'PDF export — Carbon Metrics Report (all provinces)', ip: '196.35.11.42', timestamp: '2025-04-23T10:32:44Z', durationMs: 1840, success: true },
  { id: '6', userId: 'u3', userName: 'John Mwangi', userRole: 'farmer', action: 'login', resource: 'auth', detail: 'Farmer login — Android Chrome', ip: '41.205.19.77', timestamp: '2025-04-23T11:00:15Z', durationMs: 165, success: true },
  { id: '7', userId: 'u3', userName: 'John Mwangi', userRole: 'farmer', action: 'view', resource: 'carbon', resourceId: 'CSA-2024-00001', detail: 'Viewed own carbon readings', ip: '41.205.19.77', timestamp: '2025-04-23T11:01:48Z', durationMs: 89, success: true },
  { id: '8', userId: 'u2', userName: 'Amara Osei', userRole: 'agri_officer', action: 'update', resource: 'farmer', resourceId: 'CSA-2024-00008', detail: 'Updated farmer status: inactive → active', ip: '102.67.88.5', timestamp: '2025-04-23T11:22:19Z', durationMs: 198, success: true },
  { id: '9', userId: 'unknown', userName: 'Unknown', userRole: '—', action: 'login', resource: 'auth', detail: 'Failed login attempt — wrong password', ip: '45.156.21.88', timestamp: '2025-04-23T11:35:02Z', durationMs: 410, success: false },
  { id: '10', userId: 'u1', userName: 'Sipho Dlamini', userRole: 'admin', action: 'delete', resource: 'inventory', resourceId: 'item-012', detail: 'Deleted inventory item: Glyphosate (expired batch)', ip: '196.35.11.42', timestamp: '2025-04-23T12:10:33Z', durationMs: 155, success: true },
  { id: '11', userId: 'u2', userName: 'Amara Osei', userRole: 'agri_officer', action: 'create', resource: 'pest', resourceId: 'CSA-2024-00001', detail: 'Filed pest report: Fall Armyworm (critical)', ip: '102.67.88.5', timestamp: '2025-04-23T13:44:09Z', durationMs: 280, success: true },
  { id: '12', userId: 'u1', userName: 'Sipho Dlamini', userRole: 'admin', action: 'export', resource: 'analytics', detail: 'XLS export — Financial Summary Report (Limpopo)', ip: '196.35.11.42', timestamp: '2025-04-23T14:20:55Z', durationMs: 920, success: true },
]

export default function AuditLogPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<Action | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState('')

  const filtered = MOCK_ENTRIES.filter((e) => {
    const q = search.toLowerCase()
    const matchSearch = !q || e.userName.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q) || e.resource.includes(q) || (e.ip.includes(q))
    const matchAction = actionFilter === 'all' || e.action === actionFilter
    const matchRole = !roleFilter || e.userRole === roleFilter
    return matchSearch && matchAction && matchRole
  })

  const stats = {
    total: MOCK_ENTRIES.length,
    failed: MOCK_ENTRIES.filter((e) => !e.success).length,
    exports: MOCK_ENTRIES.filter((e) => e.action === 'export').length,
    deletes: MOCK_ENTRIES.filter((e) => e.action === 'delete').length,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#336599]/12 rounded-xl flex items-center justify-center">
            <Shield size={16} className="text-[#336599]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#06192C]">Audit Log</p>
            <p className="text-xs text-gray-400">All platform actions tracked for compliance and security</p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Download size={13} /> Export Log
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: stats.total, color: 'text-[#06192C]' },
          { label: 'Failed Attempts', value: stats.failed, color: 'text-red-500' },
          { label: 'Data Exports', value: stats.exports, color: 'text-orange-500' },
          { label: 'Deletions', value: stats.deletes, color: 'text-[#336599]' },
        ].map((s) => (
          <Card key={s.label} padding="sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48">
            <Input placeholder="Search user, action, IP..." icon={<Search size={14} />}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-gray-400" />
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value as Action | 'all')}
              className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40">
              <option value="all">All Actions</option>
              {(['login', 'create', 'update', 'delete', 'view', 'export'] as Action[]).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="agri_officer">Agri Officer</option>
              <option value="farmer">Farmer</option>
            </select>
          </div>
          <p className="text-xs text-gray-400">{filtered.length} events</p>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Timestamp', 'User', 'Role', 'Action', 'Resource', 'Detail', 'IP', 'Duration', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">
                    {new Date(e.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    <span className="block text-[10px] text-gray-300">{formatDate(e.timestamp)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#98CF59] to-[#40BBB9] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                        {e.userName.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-[#06192C] whitespace-nowrap">{e.userName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={e.userRole === 'admin' ? 'blue' : e.userRole === 'agri_officer' ? 'cyan' : 'green'}>
                      {e.userRole}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border
                      ${e.action === 'delete' ? 'bg-red-50 text-red-600 border-red-100' :
                        e.action === 'login' || e.action === 'register' ? 'bg-[#98CF59]/12 text-[#4a7a1e] border-[#98CF59]/20' :
                        e.action === 'export' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        e.action === 'update' ? 'bg-[#336599]/12 text-[#336599] border-[#336599]/20' :
                        'bg-gray-50 text-gray-500 border-gray-100'}`}>
                      {ACTION_ICONS[e.action]}
                      {e.action}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-[#40BBB9]">{e.resource}{e.resourceId ? ` / ${e.resourceId.slice(0, 12)}` : ''}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{e.detail}</td>
                  <td className="px-4 py-3 text-[10px] font-mono text-gray-400">{e.ip}</td>
                  <td className="px-4 py-3 text-[10px] text-gray-400">{e.durationMs}ms</td>
                  <td className="px-4 py-3">
                    <Badge variant={e.success ? 'green' : 'red'}>{e.success ? 'OK' : 'FAIL'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
