import { useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight, X } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { Input } from '@/components/ui/Input'
import { mockFarmers } from '@/data/mockFarmers'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line,
} from 'recharts'

type TxType = 'income' | 'expense'

interface Transaction {
  id: string; farmName: string; type: TxType; category: string;
  description: string; amount: number; currency: string; date: string
}

const incomeData = [
  { month: 'Jul', income: 84000, expenses: 52000, profit: 32000 },
  { month: 'Aug', income: 96000, expenses: 58000, profit: 38000 },
  { month: 'Sep', income: 78000, expenses: 61000, profit: 17000 },
  { month: 'Oct', income: 112000, expenses: 64000, profit: 48000 },
  { month: 'Nov', income: 143000, expenses: 72000, profit: 71000 },
  { month: 'Dec', income: 167000, expenses: 68000, profit: 99000 },
  { month: 'Jan', income: 89000, expenses: 55000, profit: 34000 },
  { month: 'Feb', income: 94000, expenses: 59000, profit: 35000 },
  { month: 'Mar', income: 118000, expenses: 63000, profit: 55000 },
  { month: 'Apr', income: 131000, expenses: 67000, profit: 64000 },
]

const projectionData = [
  { month: 'May', projected: 145000, optimistic: 162000, conservative: 128000 },
  { month: 'Jun', projected: 158000, optimistic: 180000, conservative: 138000 },
  { month: 'Jul', projected: 172000, optimistic: 198000, conservative: 148000 },
  { month: 'Aug', projected: 168000, optimistic: 192000, conservative: 145000 },
  { month: 'Sep', projected: 155000, optimistic: 175000, conservative: 136000 },
  { month: 'Oct', projected: 181000, optimistic: 208000, conservative: 158000 },
]

const expenseBreakdown = [
  { category: 'Seeds', amount: 82000, pct: 18 },
  { category: 'Fertiliser', amount: 114000, pct: 25 },
  { category: 'Labour', amount: 136000, pct: 30 },
  { category: 'Equipment', amount: 59000, pct: 13 },
  { category: 'Pesticides', amount: 41000, pct: 9 },
  { category: 'Other', amount: 23000, pct: 5 },
]

const transactions: Transaction[] = [
  { id: '1', farmName: 'Bello Sugar Estate', type: 'income', category: 'Crop Sales', description: 'Sugar cane — Illovo Sugar sale', amount: 48500, currency: 'ZAR', date: '2025-04-20' },
  { id: '2', farmName: 'Asante Grain Farm', type: 'income', category: 'Carbon Credits', description: 'Q1 2025 carbon credit payment — Verra', amount: 22800, currency: 'ZAR', date: '2025-04-18' },
  { id: '3', farmName: 'Mokoena Green Farm', type: 'expense', category: 'Inputs', description: 'Fertilizer — LAN 50kg x 48 bags', amount: 13440, currency: 'ZAR', date: '2025-04-16' },
  { id: '4', farmName: 'Khumalo Citrus Farm', type: 'income', category: 'Crop Sales', description: 'Citrus — Subtropico export batch', amount: 31200, currency: 'ZAR', date: '2025-04-14' },
  { id: '5', farmName: 'Mutua Wheat & Maize', type: 'expense', category: 'Labour', description: 'Seasonal harvest workers — April', amount: 18600, currency: 'ZAR', date: '2025-04-12' },
  { id: '6', farmName: 'Diallo Fruit Estate', type: 'income', category: 'Grants', description: 'DRDLR smallholder support grant', amount: 15000, currency: 'ZAR', date: '2025-04-10' },
  { id: '7', farmName: 'Osei Soybean Fields', type: 'expense', category: 'Equipment', description: 'Tractor service and repairs', amount: 8900, currency: 'ZAR', date: '2025-04-08' },
]

const INCOME_CATEGORIES = ['Crop Sales', 'Carbon Credits', 'Grants', 'Livestock', 'Equipment Rental', 'Other']
const EXPENSE_CATEGORIES = ['Seeds', 'Fertiliser', 'Pesticides', 'Labour', 'Equipment', 'Transport', 'Irrigation', 'Other']

export default function FinancialsPage() {
  const [txs, setTxs] = useState<Transaction[]>(transactions)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ farmId: '', type: 'income' as TxType, category: '', description: '', amount: '', date: '' })

  const totalIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const netProfit = totalIncome - totalExpense
  const margin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0

  const addTx = () => {
    const farm = mockFarmers.find((f) => f.id === form.farmId)
    if (!farm || !form.amount) return
    setTxs((prev) => [{
      id: crypto.randomUUID(), farmName: farm.farmName, type: form.type,
      category: form.category || (form.type === 'income' ? 'Other' : 'Other'),
      description: form.description, amount: parseFloat(form.amount),
      currency: 'ZAR', date: form.date || new Date().toISOString().split('T')[0],
    }, ...prev])
    setShowModal(false)
    setForm({ farmId: '', type: 'income', category: '', description: '', amount: '', date: '' })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#98CF59]/15 rounded-xl flex items-center justify-center"><DollarSign size={16} className="text-[#66C390]" /></div>
          <div><p className="text-sm font-bold text-[#06192C]">Financial Management</p><p className="text-xs text-gray-400">Cost-benefit analysis and financial projections</p></div>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}><Plus size={14} /> Record Transaction</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Income (YTD)" value={`R${(totalIncome / 1000).toFixed(0)}k`} trend={22.4}
          icon={<TrendingUp size={20} className="text-[#98CF59]" />} iconBg="bg-[#98CF59]/15" />
        <StatCard title="Total Expenses (YTD)" value={`R${(totalExpense / 1000).toFixed(0)}k`} trend={-8.1}
          icon={<TrendingDown size={20} className="text-red-500" />} iconBg="bg-red-100" />
        <StatCard title="Net Profit" value={`R${(netProfit / 1000).toFixed(0)}k`} trend={38.6}
          icon={<DollarSign size={20} className="text-[#40BBB9]" />} iconBg="bg-[#40BBB9]/12" />
        <StatCard title="Profit Margin" value={`${margin}%`} trend={12.3}
          icon={<TrendingUp size={20} className="text-[#336599]" />} iconBg="bg-[#336599]/12" />
      </div>

      {/* Income vs Expenses chart */}
      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses vs Profit (R)</CardTitle>
          <Badge variant="green"><TrendingUp size={10} /> +22% YTD</Badge>
        </CardHeader>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={incomeData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `R${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f0f0f0' }}
              formatter={(v: number) => [`R${v.toLocaleString()}`, '']} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="income" name="Income" fill="#98CF59" radius={[4,4,0,0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#f97316" radius={[4,4,0,0]} />
            <Bar dataKey="profit" name="Profit" fill="#40BBB9" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Projections */}
        <Card>
          <CardHeader><CardTitle>6-Month Revenue Projection (R)</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={projectionData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `R${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f0f0f0' }}
                formatter={(v: number) => [`R${v.toLocaleString()}`, '']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="optimistic" name="Optimistic" stroke="#98CF59" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
              <Line type="monotone" dataKey="projected" name="Projected" stroke="#40BBB9" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="conservative" name="Conservative" stroke="#336599" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Expense breakdown */}
        <Card>
          <CardHeader><CardTitle>Expense Breakdown</CardTitle><span className="text-xs text-gray-400">YTD</span></CardHeader>
          <div className="flex flex-col gap-2.5">
            {expenseBreakdown.map((e) => (
              <div key={e.category}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#06192C]">{e.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{e.pct}%</span>
                    <span className="font-bold text-[#06192C]">R{e.amount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#40BBB9] rounded-full" style={{ width: `${e.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Transactions */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-[#40BBB9]" onClick={() => setShowModal(true)}>
            <Plus size={13} /> Record
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {['Farm', 'Type', 'Category', 'Description', 'Date', 'Amount'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                  <td className="px-5 py-3 text-xs font-semibold text-[#06192C]">{t.farmName}</td>
                  <td className="px-5 py-3">
                    <div className={cn('flex items-center gap-1.5 text-xs font-semibold',
                      t.type === 'income' ? 'text-[#98CF59]' : 'text-red-500')}>
                      {t.type === 'income' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {t.type}
                    </div>
                  </td>
                  <td className="px-5 py-3"><Badge variant={t.type === 'income' ? 'green' : 'orange'}>{t.category}</Badge></td>
                  <td className="px-5 py-3 text-xs text-gray-500 max-w-xs truncate">{t.description}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{formatDate(t.date)}</td>
                  <td className="px-5 py-3">
                    <span className={cn('text-sm font-bold', t.type === 'income' ? 'text-[#98CF59]' : 'text-red-500')}>
                      {t.type === 'income' ? '+' : '-'}R{t.amount.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
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
              <h2 className="text-sm font-bold text-[#06192C]">Record Transaction</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex gap-3">
                {(['income', 'expense'] as TxType[]).map((t) => (
                  <button key={t} onClick={() => setForm({ ...form, type: t, category: '' })}
                    className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold capitalize transition-all',
                      form.type === t
                        ? t === 'income' ? 'bg-[#98CF59] text-white border-[#98CF59]' : 'bg-red-500 text-white border-red-500'
                        : 'bg-[#F4F8F6] text-gray-500 border-gray-200')}>
                    {t === 'income' ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Farm</label>
                <select className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40"
                  value={form.farmId} onChange={(e) => setForm({ ...form, farmId: e.target.value })}>
                  <option value="">Select farm...</option>
                  {mockFarmers.map((f) => <option key={f.id} value={f.id}>{f.farmName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Category</label>
                  <select className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40"
                    value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select...</option>
                    {(form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <Input label="Amount (R)" type="number" placeholder="15000" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Description</label>
                <textarea rows={2} placeholder="Brief description of the transaction..."
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40" />
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={addTx} className="flex-1">Save Transaction</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
