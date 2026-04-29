import { useState } from 'react'
import { BarChart3, Users, TrendingUp, Star, ChevronRight, X, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import { mockFarmers } from '@/data/mockFarmers'
import { cn } from '@/utils/cn'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts'

type LSMCategory = 'LSM1' | 'LSM2' | 'LSM3' | 'LSM4' | 'LSM5'

const LSM_CONFIG: Record<LSMCategory, { label: string; color: string; bg: string; range: string; description: string; services: string[] }> = {
  LSM1: {
    label: 'Subsistence', color: '#ef4444', bg: 'bg-red-100',
    range: '0–20 pts', description: 'Minimal resources, subsistence farming, high vulnerability',
    services: ['Free soil testing kits', 'Basic crop training', 'Emergency food security support', 'Micro-grant access'],
  },
  LSM2: {
    label: 'Emerging', color: '#f97316', bg: 'bg-orange-100',
    range: '21–40 pts', description: 'Small-scale farming, limited market access, moderate support needed',
    services: ['Subsidised inputs', 'Group buying cooperatives', 'Market linkage support', 'Mobile advisory service'],
  },
  LSM3: {
    label: 'Developing', color: '#40BBB9', bg: 'bg-[#40BBB9]/15',
    range: '41–60 pts', description: 'Growing capacity, some market access, improving practices',
    services: ['Carbon credit onboarding', 'Irrigation planning', 'Pest management advisory', 'Financial literacy training'],
  },
  LSM4: {
    label: 'Established', color: '#336599', bg: 'bg-[#336599]/12',
    range: '61–80 pts', description: 'Commercial operations, good infrastructure, MRV-ready',
    services: ['Full MRV system access', 'Carbon credit verification', 'Precision agriculture tools', 'Export market support'],
  },
  LSM5: {
    label: 'Commercial', color: '#98CF59', bg: 'bg-[#98CF59]/15',
    range: '81–100 pts', description: 'Large-scale commercial, high-value crops, premium services',
    services: ['Carbon bond eligibility', 'International buyer matching', 'ESG reporting suite', 'Dedicated agri-adviser'],
  },
}

const LSM_BADGE_COLORS: Record<LSMCategory, 'red' | 'orange' | 'cyan' | 'blue' | 'green'> = {
  LSM1: 'red', LSM2: 'orange', LSM3: 'cyan', LSM4: 'blue', LSM5: 'green',
}

const LSM_QUESTIONS = [
  { id: 'income', label: 'Annual Farm Income', options: ['< R20,000', 'R20k–R80k', 'R80k–R250k', 'R250k–R750k', '> R750,000'], scores: [4, 12, 28, 48, 80] },
  { id: 'land', label: 'Farm Size', options: ['< 5 ha', '5–20 ha', '20–100 ha', '100–500 ha', '> 500 ha'], scores: [4, 10, 20, 40, 60] },
  { id: 'water', label: 'Water Access', options: ['Rain-fed only', 'Basic borehole', 'Canal/river', 'Irrigation system', 'Full irrigation + storage'], scores: [2, 6, 12, 20, 28] },
  { id: 'equipment', label: 'Equipment Level', options: ['Hand tools only', 'Basic animal traction', 'Small tractor', 'Full mechanised', 'Precision/GPS machinery'], scores: [2, 6, 14, 24, 36] },
  { id: 'market', label: 'Market Access', options: ['Subsistence only', 'Local informal', 'Local formal', 'Regional market', 'National/export market'], scores: [2, 6, 12, 20, 28] },
  { id: 'finance', label: 'Financial Services Access', options: ['None', 'Basic savings account', 'Credit access', 'Business banking', 'Investment & insurance'], scores: [2, 6, 12, 20, 28] },
]

const distributionData = [
  { category: 'LSM1', count: 1 },
  { category: 'LSM2', count: 1 },
  { category: 'LSM3', count: 2 },
  { category: 'LSM4', count: 4 },
  { category: 'LSM5', count: 2 },
]

const PIE_COLORS = ['#ef4444', '#f97316', '#40BBB9', '#336599', '#98CF59']

const provinceData = [
  { province: 'Limpopo', LSM3: 1, LSM4: 1, LSM5: 1 },
  { province: 'KZN', LSM4: 0, LSM5: 1, LSM3: 1 },
  { province: 'North West', LSM3: 1, LSM4: 0, LSM5: 0 },
  { province: 'Western Cape', LSM5: 1, LSM4: 0, LSM3: 0 },
  { province: 'Free State', LSM4: 1, LSM3: 0, LSM5: 0 },
]

function calculateLSM(scores: number[]): { total: number; category: LSMCategory } {
  const total = Math.min(100, Math.round(scores.reduce((a, b) => a + b, 0) / 2.6))
  const category: LSMCategory = total <= 20 ? 'LSM1' : total <= 40 ? 'LSM2' : total <= 60 ? 'LSM3' : total <= 80 ? 'LSM4' : 'LSM5'
  return { total, category }
}

export default function LSMPage() {
  const [showScorer, setShowScorer] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<{ total: number; category: LSMCategory } | null>(null)
  const [activeCategory, setActiveCategory] = useState<LSMCategory | null>(null)

  const answered = Object.keys(answers).length
  const allAnswered = answered === LSM_QUESTIONS.length

  const handleAnswer = (id: string, score: number) => setAnswers((prev) => ({ ...prev, [id]: score }))

  const handleCalculate = () => {
    const scores = LSM_QUESTIONS.map((q) => answers[q.id] ?? 0)
    setResult(calculateLSM(scores))
  }

  const radarData = LSM_QUESTIONS.map((q) => ({
    metric: q.label.split(' ')[0],
    score: answers[q.id] ? Math.round((answers[q.id] / Math.max(...q.scores)) * 100) : 0,
  }))

  return (
    <div className="flex flex-col gap-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#336599]/12 rounded-xl flex items-center justify-center">
            <BarChart3 size={16} className="text-[#336599]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#06192C]">Lifestyle Metrics Scoring</p>
            <p className="text-xs text-gray-400">Categorise farms for targeted service delivery</p>
          </div>
        </div>
        <Button size="sm" onClick={() => { setShowScorer(true); setResult(null); setAnswers({}) }}>
          <Star size={14} /> Score a Farm
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Farms Scored" value={mockFarmers.filter((f) => f.lsmCategory).length}
          trend={15.4} icon={<Users size={20} className="text-[#336599]" />} iconBg="bg-[#336599]/12" />
        <StatCard title="Avg LSM Score" value="68" suffix="/ 100"
          trend={5.2} icon={<Star size={20} className="text-[#40BBB9]" />} iconBg="bg-[#40BBB9]/12" />
        <StatCard title="Carbon-Eligible (LSM3+)" value={mockFarmers.filter((f) => f.lsmCategory && ['LSM3','LSM4','LSM5'].includes(f.lsmCategory)).length}
          trend={18.7} icon={<TrendingUp size={20} className="text-[#98CF59]" />} iconBg="bg-[#98CF59]/15" />
        <StatCard title="Commercial (LSM5)" value={mockFarmers.filter((f) => f.lsmCategory === 'LSM5').length}
          trend={33.3} icon={<BarChart3 size={20} className="text-[#66C390]" />} iconBg="bg-[#66C390]/15" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Distribution pie */}
        <Card>
          <CardHeader><CardTitle>Farm Distribution by LSM</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={distributionData} dataKey="count" nameKey="category" cx="50%" cy="50%"
                outerRadius={80} innerRadius={48} paddingAngle={3} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {distributionData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Province stacked bar */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>LSM Distribution by Province</CardTitle>
            <span className="text-xs text-gray-400">Farm count</span>
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={provinceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="province" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f0f0f0' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="LSM3" name="LSM3" stackId="a" fill="#40BBB9" radius={[0,0,0,0]} />
              <Bar dataKey="LSM4" name="LSM4" stackId="a" fill="#336599" radius={[0,0,0,0]} />
              <Bar dataKey="LSM5" name="LSM5" stackId="a" fill="#98CF59" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* LSM Category cards */}
      <div>
        <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">LSM Category Breakdown</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {(Object.entries(LSM_CONFIG) as [LSMCategory, typeof LSM_CONFIG[LSMCategory]][]).map(([key, cfg]) => {
            const count = mockFarmers.filter((f) => f.lsmCategory === key).length
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(activeCategory === key ? null : key)}
                className={cn(
                  'text-left rounded-2xl p-4 border-2 transition-all',
                  activeCategory === key
                    ? 'border-current shadow-md scale-[1.02]'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                )}
                style={activeCategory === key ? { borderColor: cfg.color } : {}}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold" style={{ color: cfg.color }}>{key}</span>
                  <span className="text-lg font-bold text-[#06192C]">{count}</span>
                </div>
                <p className="text-xs font-semibold text-[#06192C]">{cfg.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{cfg.range}</p>
                <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(count / mockFarmers.length) * 100}%`, background: cfg.color }} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Expanded category detail */}
      {activeCategory && (
        <Card className="border-2" style={{ borderColor: LSM_CONFIG[activeCategory].color + '40' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Badge variant={LSM_BADGE_COLORS[activeCategory]}>{activeCategory}</Badge>
              <div>
                <p className="text-sm font-bold text-[#06192C]">{LSM_CONFIG[activeCategory].label}</p>
                <p className="text-xs text-gray-400">{LSM_CONFIG[activeCategory].description}</p>
              </div>
            </div>
            <button onClick={() => setActiveCategory(null)} className="text-gray-400 hover:text-[#06192C] p-1 hover:bg-gray-100 rounded-lg">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">Targeted Services</p>
              <div className="flex flex-col gap-2">
                {LSM_CONFIG[activeCategory].services.map((s) => (
                  <div key={s} className="flex items-center gap-2.5">
                    <CheckCircle size={14} style={{ color: LSM_CONFIG[activeCategory].color }} className="shrink-0" />
                    <span className="text-sm text-[#06192C]">{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">Farms in this Category</p>
              <div className="flex flex-col gap-2">
                {mockFarmers.filter((f) => f.lsmCategory === activeCategory).map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div>
                      <p className="text-xs font-semibold text-[#06192C]">{f.name}</p>
                      <p className="text-[10px] text-gray-400">{f.farmName} · {f.province}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: LSM_CONFIG[activeCategory].color }}>{f.lsmScore}</p>
                      <p className="text-[10px] text-gray-400">score</p>
                    </div>
                  </div>
                ))}
                {mockFarmers.filter((f) => f.lsmCategory === activeCategory).length === 0 && (
                  <p className="text-xs text-gray-400 py-2">No farms in this category yet</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Farmer LSM table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100">
          <CardTitle>All Farmers — LSM Scores</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {['Farmer', 'Farm', 'Province', 'Size (ha)', 'LSM Score', 'Category', 'Income Level', 'Services'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockFarmers.map((f) => {
                const cfg = f.lsmCategory ? LSM_CONFIG[f.lsmCategory] : null
                return (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-[#F4F8F6] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#98CF59] to-[#40BBB9] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {f.name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-[#06192C]">{f.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{f.farmName}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{f.province}</td>
                    <td className="px-5 py-3 text-xs text-gray-600 font-medium">{f.farmSize}</td>
                    <td className="px-5 py-3">
                      {f.lsmScore ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                            <div className="h-full rounded-full" style={{ width: `${f.lsmScore}%`, background: cfg?.color }} />
                          </div>
                          <span className="text-xs font-bold text-[#06192C]">{f.lsmScore}</span>
                        </div>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {f.lsmCategory
                        ? <Badge variant={LSM_BADGE_COLORS[f.lsmCategory]}>{f.lsmCategory} · {cfg?.label}</Badge>
                        : <span className="text-xs text-gray-300">Not scored</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{cfg?.range ?? '—'}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setActiveCategory(f.lsmCategory ?? null)}
                        className="flex items-center gap-1 text-[10px] font-semibold text-[#40BBB9] hover:underline"
                      >
                        View <ChevronRight size={11} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* LSM Scorer modal */}
      {showScorer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#06192C]/50 backdrop-blur-sm" onClick={() => setShowScorer(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="text-sm font-bold text-[#06192C]">LSM Scoring Tool</h2>
                <p className="text-xs text-gray-400">{answered} of {LSM_QUESTIONS.length} questions answered</p>
              </div>
              <button onClick={() => setShowScorer(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              {/* Progress */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#40BBB9] rounded-full transition-all" style={{ width: `${(answered / LSM_QUESTIONS.length) * 100}%` }} />
              </div>

              {!result ? (
                <>
                  {LSM_QUESTIONS.map((q) => (
                    <div key={q.id}>
                      <p className="text-xs font-bold text-[#06192C] mb-2">{q.label}</p>
                      <div className="flex flex-col gap-2">
                        {q.options.map((opt, i) => (
                          <label key={opt} className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                            answers[q.id] === q.scores[i]
                              ? 'border-[#40BBB9] bg-[#40BBB9]/8'
                              : 'border-gray-100 hover:border-gray-200'
                          )}>
                            <input type="radio" name={q.id} value={q.scores[i]} className="accent-[#40BBB9]"
                              checked={answers[q.id] === q.scores[i]}
                              onChange={() => handleAnswer(q.id, q.scores[i])} />
                            <span className="text-sm text-[#06192C]">{opt}</span>
                            <span className="ml-auto text-[10px] text-gray-400 font-mono">{q.scores[i]} pts</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button onClick={handleCalculate} disabled={!allAnswered} className="w-full">
                    Calculate LSM Score
                  </Button>
                  {!allAnswered && (
                    <p className="text-center text-xs text-gray-400">Answer all {LSM_QUESTIONS.length} questions to continue</p>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6 text-left">
                    <div>
                      <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-4"
                        style={{ background: LSM_CONFIG[result.category].color + '20' }}>
                        <span className="text-3xl font-bold" style={{ color: LSM_CONFIG[result.category].color }}>
                          {result.total}
                        </span>
                      </div>
                      <p className="text-center text-sm font-bold text-[#06192C] mb-1">{result.category} — {LSM_CONFIG[result.category].label}</p>
                      <p className="text-center text-xs text-gray-400">{LSM_CONFIG[result.category].description}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">Recommended Services</p>
                      {LSM_CONFIG[result.category].services.map((s) => (
                        <div key={s} className="flex items-center gap-2 mb-2">
                          <CheckCircle size={14} style={{ color: LSM_CONFIG[result.category].color }} />
                          <span className="text-xs text-[#06192C]">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#f0f0f0" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Score" dataKey="score" stroke={LSM_CONFIG[result.category].color}
                        fill={LSM_CONFIG[result.category].color} fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" onClick={() => { setResult(null); setAnswers({}) }} className="flex-1">Re-score</Button>
                    <Button onClick={() => setShowScorer(false)} className="flex-1">Save & Close</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
