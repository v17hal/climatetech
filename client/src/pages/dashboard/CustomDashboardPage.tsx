import { useState, useCallback } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  rectSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, X, Plus, RotateCcw, Users, Leaf, Map,
  ShieldCheck, TrendingUp, DollarSign, BarChart3, CloudSun,
  Droplets, Bug, Package,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { mockFarmers, generateCarbonRecords } from '@/data/mockFarmers'
import { cn } from '@/utils/cn'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

/* ── widget definitions ── */
type WidgetId =
  | 'stat-farmers' | 'stat-carbon' | 'stat-farms' | 'stat-compliance'
  | 'stat-revenue' | 'stat-lsm' | 'stat-inventory' | 'stat-pest'
  | 'chart-carbon-trend' | 'chart-enrollment' | 'chart-lsm-dist'
  | 'table-recent-farmers' | 'table-carbon-readings'
  | 'weather-summary' | 'activity-feed'

interface WidgetDef {
  id: WidgetId
  title: string
  description: string
  category: 'stats' | 'charts' | 'tables' | 'misc'
  size: 'sm' | 'md' | 'lg'
  icon: React.ReactNode
}

const WIDGET_DEFS: WidgetDef[] = [
  { id: 'stat-farmers',    title: 'Farmers Enrolled',  description: 'Total enrolled farmers with trend', category: 'stats',  size: 'sm', icon: <Users size={14} /> },
  { id: 'stat-carbon',     title: 'Carbon Tracked',    description: 'Total tCO₂ sequestered with trend', category: 'stats',  size: 'sm', icon: <Leaf size={14} /> },
  { id: 'stat-farms',      title: 'Active Farms',      description: 'Number of active farm operations',  category: 'stats',  size: 'sm', icon: <Map size={14} /> },
  { id: 'stat-compliance', title: 'Compliance Rate',   description: 'MRV compliance percentage',          category: 'stats',  size: 'sm', icon: <ShieldCheck size={14} /> },
  { id: 'stat-revenue',    title: 'Revenue YTD',       description: 'Total estimated income year-to-date',category: 'stats',  size: 'sm', icon: <DollarSign size={14} /> },
  { id: 'stat-lsm',        title: 'Avg LSM Score',     description: 'Average lifestyle metric score',     category: 'stats',  size: 'sm', icon: <BarChart3 size={14} /> },
  { id: 'stat-inventory',  title: 'Low Stock Items',   description: 'Items below reorder level',          category: 'stats',  size: 'sm', icon: <Package size={14} /> },
  { id: 'stat-pest',       title: 'Active Outbreaks',  description: 'Unresolved pest/disease reports',    category: 'stats',  size: 'sm', icon: <Bug size={14} /> },
  { id: 'chart-carbon-trend', title: 'Carbon Trend',  description: 'Monthly carbon sequestration area chart', category: 'charts', size: 'lg', icon: <TrendingUp size={14} /> },
  { id: 'chart-enrollment',   title: 'Enrollment Growth', description: 'Monthly farmer enrollment bar chart',  category: 'charts', size: 'md', icon: <Users size={14} /> },
  { id: 'chart-lsm-dist',     title: 'LSM Distribution',  description: 'Pie chart of farm LSM categories',    category: 'charts', size: 'md', icon: <BarChart3 size={14} /> },
  { id: 'table-recent-farmers',   title: 'Recent Farmers',   description: 'Last 5 enrolled farmers',      category: 'tables', size: 'lg', icon: <Users size={14} /> },
  { id: 'table-carbon-readings',  title: 'Carbon Readings',  description: 'Latest carbon measurements',   category: 'tables', size: 'lg', icon: <Leaf size={14} /> },
  { id: 'weather-summary', title: 'Weather Summary',  description: 'Current conditions across provinces', category: 'misc', size: 'md', icon: <CloudSun size={14} /> },
  { id: 'activity-feed',   title: 'Activity Feed',    description: 'Live platform activity stream',       category: 'misc', size: 'md', icon: <Droplets size={14} /> },
]

const DEFAULT_LAYOUT: WidgetId[] = [
  'stat-farmers', 'stat-carbon', 'stat-farms', 'stat-compliance',
  'chart-carbon-trend', 'chart-enrollment',
  'table-recent-farmers', 'weather-summary',
]

const STORAGE_KEY = 'cs-dashboard-layout'

const carbonData = [
  { month: 'Jul', carbon: 4.2 }, { month: 'Aug', carbon: 4.6 },
  { month: 'Sep', carbon: 4.9 }, { month: 'Oct', carbon: 5.3 },
  { month: 'Nov', carbon: 5.8 }, { month: 'Dec', carbon: 6.4 },
  { month: 'Jan', carbon: 6.9 }, { month: 'Feb', carbon: 7.2 },
  { month: 'Mar', carbon: 7.8 }, { month: 'Apr', carbon: 8.4 },
]

const enrollData = [
  { month: 'Jan', farmers: 780 }, { month: 'Feb', farmers: 840 },
  { month: 'Mar', farmers: 910 }, { month: 'Apr', farmers: 998 },
]

const lsmPie = [
  { name: 'LSM1', value: 1 }, { name: 'LSM2', value: 1 },
  { name: 'LSM3', value: 2 }, { name: 'LSM4', value: 4 }, { name: 'LSM5', value: 2 },
]
const PIE_COLORS = ['#ef4444', '#f97316', '#40BBB9', '#336599', '#98CF59']

const weatherSnap = [
  { province: 'Limpopo', temp: 32, condition: '⛅', risk: 'moderate' },
  { province: 'KwaZulu-Natal', temp: 27, condition: '⛈️', risk: 'high' },
  { province: 'Western Cape', temp: 19, condition: '💨', risk: 'high' },
  { province: 'Free State', temp: 26, condition: '☀️', risk: 'low' },
]

const activity = [
  { msg: 'Thabo Mokoena enrolled — CSA-2024-12441', time: '2m ago', dot: 'bg-[#98CF59]' },
  { msg: 'Carbon reading: Farm CSA-2024-11203 — 8.4 tCO₂/ha', time: '18m ago', dot: 'bg-[#40BBB9]' },
  { msg: 'Pest alert: Fall Armyworm (Limpopo)', time: '1h ago', dot: 'bg-red-400' },
  { msg: 'Monthly compliance report generated', time: '2h ago', dot: 'bg-[#336599]' },
]

/* ── widget content renderer ── */
function WidgetContent({ id }: { id: WidgetId }) {
  const allRecords = mockFarmers.flatMap((f) => generateCarbonRecords(f.id))
  const recent = allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  switch (id) {
    case 'stat-farmers':    return <StatCard title="Farmers Enrolled" value="12,441" trend={8.2}  icon={<Users size={20} className="text-[#336599]" />} iconBg="bg-[#336599]/12" />
    case 'stat-carbon':     return <StatCard title="Carbon Tracked" value="84.2k" suffix="tCO₂" trend={12.5} icon={<Leaf size={20} className="text-[#40BBB9]" />} iconBg="bg-[#40BBB9]/12" />
    case 'stat-farms':      return <StatCard title="Active Farms" value="9,814" trend={5.1}   icon={<Map size={20} className="text-[#98CF59]" />} iconBg="bg-[#98CF59]/15" />
    case 'stat-compliance': return <StatCard title="Compliance Rate" value="94%" trend={2.3}  icon={<ShieldCheck size={20} className="text-[#66C390]" />} iconBg="bg-[#66C390]/15" />
    case 'stat-revenue':    return <StatCard title="Revenue YTD" value="R1.1M" trend={22.4}   icon={<DollarSign size={20} className="text-[#98CF59]" />} iconBg="bg-[#98CF59]/15" />
    case 'stat-lsm':        return <StatCard title="Avg LSM Score" value="68" suffix="/ 100" trend={5.2} icon={<BarChart3 size={20} className="text-[#336599]" />} iconBg="bg-[#336599]/12" />
    case 'stat-inventory':  return <StatCard title="Low Stock Items" value="3" trend={-2}      icon={<Package size={20} className="text-orange-500" />} iconBg="bg-orange-100" />
    case 'stat-pest':       return <StatCard title="Active Outbreaks" value="3" trend={-15}    icon={<Bug size={20} className="text-red-500" />} iconBg="bg-red-100" />

    case 'chart-carbon-trend':
      return (
        <div>
          <p className="text-sm font-bold text-[#06192C] mb-3">Carbon Sequestration Trend</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={carbonData} margin={{ top: 4, right: 4, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#40BBB9" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#40BBB9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10 }} />
              <Area type="monotone" dataKey="carbon" name="tCO₂/ha" stroke="#40BBB9" strokeWidth={2.5} fill="url(#wg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )

    case 'chart-enrollment':
      return (
        <div>
          <p className="text-sm font-bold text-[#06192C] mb-3">Farmer Enrollment Growth</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={enrollData} margin={{ top: 4, right: 4, left: -25, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10 }} />
              <Bar dataKey="farmers" name="Farmers" fill="#98CF59" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )

    case 'chart-lsm-dist':
      return (
        <div>
          <p className="text-sm font-bold text-[#06192C] mb-3">LSM Distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={lsmPie} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={65} innerRadius={40} paddingAngle={4}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {lsmPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )

    case 'table-recent-farmers':
      return (
        <div>
          <p className="text-sm font-bold text-[#06192C] mb-3">Recent Enrollments</p>
          <div className="flex flex-col gap-2">
            {mockFarmers.slice(0,5).map((f) => (
              <div key={f.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#98CF59] to-[#40BBB9] flex items-center justify-center text-white text-[9px] font-bold">{f.name.charAt(0)}</div>
                  <div>
                    <p className="text-xs font-semibold text-[#06192C]">{f.name}</p>
                    <p className="text-[10px] font-mono text-[#40BBB9]">{f.farmerId}</p>
                  </div>
                </div>
                <Badge variant={f.status === 'active' ? 'green' : 'orange'}>{f.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )

    case 'table-carbon-readings':
      return (
        <div>
          <p className="text-sm font-bold text-[#06192C] mb-3">Latest Carbon Readings</p>
          <div className="flex flex-col gap-2">
            {recent.map((r) => {
              const farmer = mockFarmers.find((f) => f.id === r.farmerId)
              return (
                <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 text-xs">
                  <span className="font-semibold text-[#06192C]">{farmer?.name ?? '—'}</span>
                  <span className="font-bold text-[#40BBB9]">{r.carbonLevel} tCO₂/ha</span>
                  <Badge variant={r.inputMethod === 'sensor' ? 'cyan' : 'gray'}>{r.inputMethod}</Badge>
                </div>
              )
            })}
          </div>
        </div>
      )

    case 'weather-summary':
      return (
        <div>
          <p className="text-sm font-bold text-[#06192C] mb-3">Weather by Province</p>
          <div className="flex flex-col gap-2">
            {weatherSnap.map((w) => (
              <div key={w.province} className="flex items-center justify-between py-1 text-xs">
                <span className="font-medium text-gray-500">{w.province}</span>
                <span className="text-lg">{w.condition}</span>
                <span className="font-bold text-orange-500">{w.temp}°C</span>
                <Badge variant={w.risk === 'high' ? 'orange' : w.risk === 'low' ? 'green' : 'cyan'}>{w.risk}</Badge>
              </div>
            ))}
          </div>
        </div>
      )

    case 'activity-feed':
      return (
        <div>
          <p className="text-sm font-bold text-[#06192C] mb-3">Live Activity</p>
          <div className="flex flex-col gap-3">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.dot}`} />
                <div>
                  <p className="text-xs text-[#06192C] font-medium leading-snug">{a.msg}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    default:
      return <p className="text-xs text-gray-400">Widget not found</p>
  }
}

/* ── sortable widget wrapper ── */
function SortableWidget({ id, onRemove, editMode }: { id: WidgetId; onRemove: (id: WidgetId) => void; editMode: boolean }) {
  const def = WIDGET_DEFS.find((w) => w.id === id)!
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: def.size === 'lg' ? 'span 2' : def.size === 'md' ? 'span 1' : 'span 1',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm transition-shadow',
        isDragging && 'shadow-xl opacity-80 rotate-1 z-50',
        editMode && 'border-dashed border-[#40BBB9]/40'
      )}
    >
      {/* Widget header when in edit mode */}
      {editMode && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-[#F4F8F6] rounded-t-2xl">
          <div className="flex items-center gap-2">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-[#06192C] touch-none">
              <GripVertical size={14} />
            </button>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{def.title}</span>
          </div>
          <button onClick={() => onRemove(id)} className="text-gray-300 hover:text-red-500 transition-colors p-0.5">
            <X size={13} />
          </button>
        </div>
      )}
      <div className="p-5">
        <WidgetContent id={id} />
      </div>
    </div>
  )
}

/* ── add widget panel ── */
function AddWidgetPanel({ activeIds, onAdd, onClose }: { activeIds: WidgetId[]; onAdd: (id: WidgetId) => void; onClose: () => void }) {
  const categories = ['stats', 'charts', 'tables', 'misc'] as const
  const labels: Record<string, string> = { stats: 'Stat Cards', charts: 'Charts', tables: 'Tables', misc: 'Misc' }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#06192C]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-sm font-bold text-[#06192C]">Add Widgets</h2>
            <p className="text-xs text-gray-400 mt-0.5">{WIDGET_DEFS.length - activeIds.length} available</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={16} /></button>
        </div>
        <div className="p-6 flex flex-col gap-5">
          {categories.map((cat) => {
            const widgets = WIDGET_DEFS.filter((w) => w.category === cat)
            return (
              <div key={cat}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{labels[cat]}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {widgets.map((w) => {
                    const active = activeIds.includes(w.id)
                    return (
                      <button
                        key={w.id}
                        onClick={() => !active && onAdd(w.id)}
                        disabled={active}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                          active ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-100' : 'bg-white border-gray-100 hover:border-[#40BBB9] hover:shadow-sm'
                        )}
                      >
                        <div className="w-8 h-8 rounded-xl bg-[#40BBB9]/12 flex items-center justify-center text-[#40BBB9] shrink-0">
                          {w.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#06192C]">{w.title}</p>
                          <p className="text-[10px] text-gray-400 truncate">{w.description}</p>
                        </div>
                        {active
                          ? <Badge variant="gray">Added</Badge>
                          : <Plus size={14} className="text-[#40BBB9] shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── main page ── */
export default function CustomDashboardPage() {
  const saved = localStorage.getItem(STORAGE_KEY)
  const [layout, setLayout] = useState<WidgetId[]>(
    saved ? JSON.parse(saved) : DEFAULT_LAYOUT
  )
  const [editMode, setEditMode] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const saveLayout = useCallback((newLayout: WidgetId[]) => {
    setLayout(newLayout)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout))
  }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = layout.indexOf(active.id as WidgetId)
      const newIdx = layout.indexOf(over.id as WidgetId)
      saveLayout(arrayMove(layout, oldIdx, newIdx))
    }
  }

  const removeWidget = (id: WidgetId) => saveLayout(layout.filter((w) => w !== id))
  const addWidget = (id: WidgetId) => { saveLayout([...layout, id]); setShowAdd(false) }
  const resetLayout = () => saveLayout(DEFAULT_LAYOUT)

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-[#06192C]">{layout.length} widgets</p>
          {editMode && <Badge variant="cyan">Edit mode</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {editMode && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
                <Plus size={13} /> Add Widget
              </Button>
              <Button variant="ghost" size="sm" onClick={resetLayout} className="text-gray-400">
                <RotateCcw size={13} /> Reset
              </Button>
            </>
          )}
          <Button
            variant={editMode ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Done' : '✦ Customise'}
          </Button>
        </div>
      </div>

      {/* Edit mode hint */}
      {editMode && (
        <div className="flex items-center gap-2.5 bg-[#40BBB9]/8 border border-[#40BBB9]/20 rounded-xl px-4 py-2.5">
          <GripVertical size={14} className="text-[#40BBB9]" />
          <p className="text-xs text-[#40BBB9] font-medium">
            Drag widgets to reorder · Click <X size={11} className="inline" /> to remove · Layout auto-saved
          </p>
        </div>
      )}

      {/* Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layout} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 auto-rows-auto">
            {layout.map((id) => (
              <SortableWidget key={id} id={id} onRemove={removeWidget} editMode={editMode} />
            ))}

            {/* Empty state */}
            {layout.length === 0 && (
              <div className="col-span-4 text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                <p className="text-gray-400 text-sm font-medium mb-3">Your dashboard is empty</p>
                <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} /> Add Widgets</Button>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {showAdd && (
        <AddWidgetPanel activeIds={layout} onAdd={addWidget} onClose={() => setShowAdd(false)} />
      )}
    </div>
  )
}
