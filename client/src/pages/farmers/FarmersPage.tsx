import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Plus, Download, Eye, Edit2, MapPin, Leaf, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'
import { mockFarmers, provinceOptions } from '@/data/mockFarmers'
import type { Farmer } from '@/types'
import { FarmerFormModal } from './components/FarmerFormModal'

const STATUS_COLORS = {
  active: 'green' as const,
  pending: 'orange' as const,
  inactive: 'gray' as const,
}

const LSM_COLORS = {
  LSM1: 'red' as const,
  LSM2: 'orange' as const,
  LSM3: 'cyan' as const,
  LSM4: 'blue' as const,
  LSM5: 'green' as const,
}

export default function FarmersPage() {
  const navigate = useNavigate()
  const [farmers, setFarmers] = useState<Farmer[]>(mockFarmers)
  const [search, setSearch] = useState('')
  const [province, setProvince] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editFarmer, setEditFarmer] = useState<Farmer | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const PER_PAGE = 8

  const filtered = useMemo(() => {
    return farmers.filter((f) => {
      const q = search.toLowerCase()
      const matchSearch = !q || f.name.toLowerCase().includes(q) || f.farmerId.toLowerCase().includes(q) || f.farmName.toLowerCase().includes(q)
      const matchProvince = !province || f.province === province
      const matchStatus = !status || f.status === status
      return matchSearch && matchProvince && matchStatus
    })
  }, [farmers, search, province, status])

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  const handleSave = (data: Partial<Farmer>) => {
    if (editFarmer) {
      setFarmers((prev) => prev.map((f) => f.id === editFarmer.id ? { ...f, ...data } : f))
    } else {
      const newFarmer: Farmer = {
        id: crypto.randomUUID(),
        farmerId: `CSA-${new Date().getFullYear()}-${String(farmers.length + 1).padStart(5, '0')}`,
        enrolledAt: new Date().toISOString(),
        status: 'pending',
        ...data,
      } as Farmer
      setFarmers((prev) => [newFarmer, ...prev])
    }
    setShowModal(false)
    setEditFarmer(null)
  }

  const openEdit = (f: Farmer) => { setEditFarmer(f); setShowModal(true) }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {[
            { label: 'Total', value: farmers.length, color: 'text-[#06192C]' },
            { label: 'Active', value: farmers.filter((f) => f.status === 'active').length, color: 'text-[#40BBB9]' },
            { label: 'Pending', value: farmers.filter((f) => f.status === 'pending').length, color: 'text-orange-500' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download size={14} /> Export
          </Button>
          <Button size="sm" onClick={() => { setEditFarmer(null); setShowModal(true) }}>
            <Plus size={14} /> Enroll Farmer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Search by name, ID, or farm..."
              icon={<Search size={14} />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={province}
              onChange={(e) => { setProvince(e.target.value); setPage(1) }}
              className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40"
            >
              <option value="">All Provinces</option>
              {provinceOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            {(['table', 'grid'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={cn(
                  'px-3 py-2 text-xs font-semibold transition-colors',
                  viewMode === m ? 'bg-[#40BBB9] text-white' : 'bg-white text-gray-400 hover:text-[#06192C]'
                )}
              >
                {m === 'table' ? '≡ Table' : '⊞ Grid'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Results count */}
      <p className="text-xs text-gray-400 -mt-2">
        Showing {paginated.length} of {filtered.length} farmers
      </p>

      {/* Table view */}
      {viewMode === 'table' && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Farmer ID', 'Name', 'Farm', 'Province', 'Size', 'Crops', 'LSM', 'Status', 'Enrolled', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((f) => (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono font-semibold text-[#40BBB9]">{f.farmerId}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#98CF59] to-[#40BBB9] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {f.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#06192C]">{f.name}</p>
                          <p className="text-[10px] text-gray-400">{f.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-medium text-[#06192C]">{f.farmName}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={11} className="text-[#40BBB9]" />
                        {f.province}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {f.farmSize} {f.farmSizeUnit}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {f.cropTypes.slice(0, 2).map((c) => (
                          <span key={c} className="text-[10px] bg-[#98CF59]/12 text-[#4a7a1e] px-1.5 py-0.5 rounded-full font-medium">{c}</span>
                        ))}
                        {f.cropTypes.length > 2 && (
                          <span className="text-[10px] text-gray-400">+{f.cropTypes.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {f.lsmCategory && (
                        <Badge variant={LSM_COLORS[f.lsmCategory]}>{f.lsmCategory}</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={STATUS_COLORS[f.status]}>{f.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(f.enrolledAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/farmers/${f.id}`)}
                          className="p-1.5 hover:bg-[#40BBB9]/12 rounded-lg text-gray-400 hover:text-[#40BBB9] transition-colors"
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => openEdit(f)}
                          className="p-1.5 hover:bg-[#98CF59]/12 rounded-lg text-gray-400 hover:text-[#66C390] transition-colors"
                          title="Edit farmer"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginated.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Users size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No farmers found</p>
                <p className="text-xs mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={cn(
                      'w-8 h-8 text-xs font-semibold rounded-lg transition-colors',
                      n === page
                        ? 'bg-[#40BBB9] text-white'
                        : 'text-gray-400 hover:bg-gray-100'
                    )}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/farmers/${f.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#98CF59] to-[#40BBB9] flex items-center justify-center text-white font-bold">
                    {f.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#06192C]">{f.name}</p>
                    <p className="text-[10px] font-mono text-[#40BBB9]">{f.farmerId}</p>
                  </div>
                </div>
                <Badge variant={STATUS_COLORS[f.status]}>{f.status}</Badge>
              </div>
              <div className="flex flex-col gap-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-2"><Leaf size={12} className="text-[#98CF59]" />{f.farmName}</div>
                <div className="flex items-center gap-2"><MapPin size={12} className="text-[#40BBB9]" />{f.district}, {f.province}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold text-[#06192C]">{f.farmSize} {f.farmSizeUnit}</span>
                  {f.lsmCategory && <Badge variant={LSM_COLORS[f.lsmCategory]}>{f.lsmCategory}</Badge>}
                </div>
              </div>
              <div className="flex gap-1 mt-3">
                {f.cropTypes.slice(0, 3).map((c) => (
                  <span key={c} className="text-[10px] bg-[#98CF59]/12 text-[#4a7a1e] px-2 py-0.5 rounded-full font-medium">{c}</span>
                ))}
              </div>
              <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); openEdit(f) }}>
                  <Edit2 size={12} /> Edit
                </Button>
                <Button size="sm" className="flex-1 text-xs">
                  <Eye size={12} /> View
                </Button>
              </div>
            </Card>
          ))}

          {paginated.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No farmers found</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <FarmerFormModal
          farmer={editFarmer}
          onClose={() => { setShowModal(false); setEditFarmer(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
