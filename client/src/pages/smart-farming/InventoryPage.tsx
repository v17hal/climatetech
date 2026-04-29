import { useState } from 'react'
import { Package, Plus, AlertTriangle, Edit2, Trash2, X, Search } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type Category = 'seed' | 'fertilizer' | 'pesticide' | 'equipment' | 'other'

interface Item {
  id: string; name: string; category: Category; quantity: number; unit: string;
  reorderLevel: number; costPerUnit: number; supplier: string; lastUpdated: string
}

const CATEGORY_COLORS: Record<Category, 'green' | 'blue' | 'orange' | 'cyan' | 'gray'> = {
  seed: 'green', fertilizer: 'blue', pesticide: 'orange', equipment: 'cyan', other: 'gray',
}

const CATEGORY_BG: Record<Category, string> = {
  seed: 'bg-[#98CF59]/15', fertilizer: 'bg-[#336599]/12', pesticide: 'bg-orange-100',
  equipment: 'bg-[#40BBB9]/12', other: 'bg-gray-100',
}

const initialItems: Item[] = [
  { id: '1', name: 'Maize Seed (SC403)', category: 'seed', quantity: 450, unit: 'kg', reorderLevel: 200, costPerUnit: 38, supplier: 'Pioneer Seeds SA', lastUpdated: '2025-04-20' },
  { id: '2', name: 'LAN Fertilizer', category: 'fertilizer', quantity: 2400, unit: 'kg', reorderLevel: 1000, costPerUnit: 12, supplier: 'Omnia Group', lastUpdated: '2025-04-18' },
  { id: '3', name: 'Glyphosate Herbicide', category: 'pesticide', quantity: 85, unit: 'L', reorderLevel: 100, costPerUnit: 142, supplier: 'Croplife SA', lastUpdated: '2025-04-15' },
  { id: '4', name: 'Soybean Seed (DM 6.2)', category: 'seed', quantity: 180, unit: 'kg', reorderLevel: 150, costPerUnit: 55, supplier: 'Sakata SA', lastUpdated: '2025-04-22' },
  { id: '5', name: 'Urea 46%', category: 'fertilizer', quantity: 3100, unit: 'kg', reorderLevel: 1500, costPerUnit: 9, supplier: 'Sasol Nitro', lastUpdated: '2025-04-10' },
  { id: '6', name: 'Cypermetrin Pesticide', category: 'pesticide', quantity: 42, unit: 'L', reorderLevel: 50, costPerUnit: 188, supplier: 'Croplife SA', lastUpdated: '2025-04-12' },
  { id: '7', name: 'Irrigation Pipes (50mm)', category: 'equipment', quantity: 120, unit: 'metres', reorderLevel: 80, costPerUnit: 24, supplier: 'Agriflex SA', lastUpdated: '2025-04-08' },
  { id: '8', name: 'Wheat Seed (SST 347)', category: 'seed', quantity: 60, unit: 'kg', reorderLevel: 200, costPerUnit: 42, supplier: 'Sensako SA', lastUpdated: '2025-04-19' },
]

const categoryChart = ['seed', 'fertilizer', 'pesticide', 'equipment'].map((c) => ({
  category: c.charAt(0).toUpperCase() + c.slice(1),
  items: initialItems.filter((i) => i.category === c).length,
  value: initialItems.filter((i) => i.category === c).reduce((s, i) => s + i.quantity * i.costPerUnit, 0),
}))

const emptyForm = { name: '', category: 'seed' as Category, quantity: '', unit: 'kg', reorderLevel: '', costPerUnit: '', supplier: '' }

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<Category | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [form, setForm] = useState(emptyForm)

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return (!q || i.name.toLowerCase().includes(q) || i.supplier.toLowerCase().includes(q))
      && (catFilter === 'all' || i.category === catFilter)
  })

  const lowStock = items.filter((i) => i.quantity <= i.reorderLevel)
  const totalValue = items.reduce((s, i) => s + i.quantity * i.costPerUnit, 0)

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (item: Item) => {
    setEditItem(item)
    setForm({ name: item.name, category: item.category, quantity: String(item.quantity), unit: item.unit, reorderLevel: String(item.reorderLevel), costPerUnit: String(item.costPerUnit), supplier: item.supplier })
    setShowModal(true)
  }

  const save = () => {
    const data: Item = {
      id: editItem?.id ?? crypto.randomUUID(),
      name: form.name, category: form.category,
      quantity: parseFloat(form.quantity) || 0,
      unit: form.unit,
      reorderLevel: parseFloat(form.reorderLevel) || 0,
      costPerUnit: parseFloat(form.costPerUnit) || 0,
      supplier: form.supplier,
      lastUpdated: new Date().toISOString().split('T')[0],
    }
    setItems((prev) => editItem ? prev.map((i) => i.id === editItem.id ? data : i) : [data, ...prev])
    setShowModal(false)
  }

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#40BBB9]/12 rounded-xl flex items-center justify-center"><Package size={16} className="text-[#40BBB9]" /></div>
          <div><p className="text-sm font-bold text-[#06192C]">Inventory Management</p><p className="text-xs text-gray-400">Stock tracking and procurement planning</p></div>
        </div>
        <Button size="sm" onClick={openAdd}><Plus size={14} /> Add Item</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Items" value={items.length} trend={5}
          icon={<Package size={20} className="text-[#40BBB9]" />} iconBg="bg-[#40BBB9]/12" />
        <StatCard title="Low Stock Alerts" value={lowStock.length} trend={-2}
          icon={<AlertTriangle size={20} className="text-orange-500" />} iconBg="bg-orange-100" />
        <StatCard title="Stock Value" value={`R${(totalValue / 1000).toFixed(0)}k`} trend={8.2}
          icon={<Package size={20} className="text-[#98CF59]" />} iconBg="bg-[#98CF59]/15" />
        <StatCard title="Categories" value={4} trend={0}
          icon={<Package size={20} className="text-[#336599]" />} iconBg="bg-[#336599]/12" />
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <p className="text-sm font-bold text-orange-700">Low Stock Alerts ({lowStock.length})</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((i) => (
              <div key={i.id} className="flex items-center gap-1.5 bg-orange-100 rounded-full px-3 py-1 text-xs text-orange-700 font-semibold">
                <span>{i.name}</span>
                <span className="text-orange-500">({i.quantity} {i.unit} — reorder at {i.reorderLevel})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Stock Value by Category (R)</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryChart} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} formatter={(v: number) => [`R${v.toLocaleString()}`, 'Value']} />
              <Bar dataKey="value" name="Stock Value (R)" fill="#40BBB9" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader><CardTitle>Category Summary</CardTitle></CardHeader>
          <div className="flex flex-col gap-3">
            {(['seed', 'fertilizer', 'pesticide', 'equipment', 'other'] as Category[]).map((c) => {
              const count = items.filter((i) => i.category === c).length
              return (
                <button key={c} onClick={() => setCatFilter(catFilter === c ? 'all' : c)}
                  className={cn('flex items-center justify-between p-2.5 rounded-xl transition-all text-left',
                    catFilter === c ? 'bg-[#40BBB9]/10 border border-[#40BBB9]/30' : 'hover:bg-[#F4F8F6]')}>
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full',
                      c === 'seed' ? 'bg-[#98CF59]' : c === 'fertilizer' ? 'bg-[#336599]' :
                      c === 'pesticide' ? 'bg-orange-400' : c === 'equipment' ? 'bg-[#40BBB9]' : 'bg-gray-400')} />
                    <span className="text-xs font-semibold text-[#06192C] capitalize">{c}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-400">{count} items</span>
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <CardTitle>Stock Items</CardTitle>
          <div className="flex-1 min-w-40 max-w-64 ml-auto">
            <Input placeholder="Search items..." icon={<Search size={13} />} value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {['Item', 'Category', 'Quantity', 'Reorder At', 'Unit Cost', 'Stock Value', 'Supplier', 'Status', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isLow = item.quantity <= item.reorderLevel
                return (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors group">
                    <td className="px-5 py-3 text-xs font-semibold text-[#06192C]">{item.name}</td>
                    <td className="px-5 py-3"><Badge variant={CATEGORY_COLORS[item.category]}>{item.category}</Badge></td>
                    <td className="px-5 py-3">
                      <span className={cn('text-xs font-bold', isLow ? 'text-orange-500' : 'text-[#06192C]')}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">{item.reorderLevel} {item.unit}</td>
                    <td className="px-5 py-3 text-xs text-gray-600">R{item.costPerUnit}</td>
                    <td className="px-5 py-3 text-xs font-semibold text-[#40BBB9]">R{(item.quantity * item.costPerUnit).toLocaleString()}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{item.supplier}</td>
                    <td className="px-5 py-3">
                      {isLow
                        ? <Badge variant="orange"><AlertTriangle size={10} /> Low Stock</Badge>
                        : <Badge variant="green">In Stock</Badge>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-[#40BBB9]/12 rounded-lg text-gray-400 hover:text-[#40BBB9]"><Edit2 size={13} /></button>
                        <button onClick={() => remove(item.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#06192C]/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-sm font-bold text-[#06192C]">{editItem ? 'Edit Item' : 'Add Inventory Item'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <Input label="Item Name" placeholder="Maize Seed (SC403)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Category</label>
                  <select className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40"
                    value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
                    {(['seed', 'fertilizer', 'pesticide', 'equipment', 'other'] as Category[]).map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Unit</label>
                  <select className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40"
                    value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                    {['kg', 'L', 'bags', 'metres', 'units', 'tonnes'].map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Quantity" type="number" placeholder="500" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                <Input label="Reorder Level" type="number" placeholder="200" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Cost per Unit (R)" type="number" placeholder="38" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} />
                <Input label="Supplier" placeholder="Pioneer Seeds SA" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={save} className="flex-1">{editItem ? 'Save Changes' : 'Add Item'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
