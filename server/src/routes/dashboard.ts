import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/stats', async (_req, res, next) => {
  try {
    const [totalFarmers, activeFarms, carbonStats] = await Promise.all([
      prisma.farmer.count(),
      prisma.farmer.count({ where: { status: 'active' } }),
      prisma.carbonRecord.aggregate({ _sum: { carbonLevel: true } }),
    ])

    res.json({
      totalFarmers,
      activeFarms,
      carbonTracked: carbonStats._sum.carbonLevel ?? 0,
      complianceRate: totalFarmers > 0 ? Math.round((activeFarms / totalFarmers) * 100) : 0,
    })
  } catch (err) { next(err) }
})

/* Soil monitoring metrics over time — avg pH, moisture, temperature (Field #9). */
router.get('/soil-metrics', async (_req, res, next) => {
  try {
    const records = await prisma.carbonRecord.findMany({
      select: { date: true, soilPH: true, moisture: true, temperature: true },
      orderBy: { date: 'asc' },
    })
    const byMonth = new Map<string, { ph: number[]; moisture: number[]; temp: number[] }>()
    for (const r of records) {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`
      if (!byMonth.has(key)) byMonth.set(key, { ph: [], moisture: [], temp: [] })
      const b = byMonth.get(key)!
      b.ph.push(r.soilPH)
      b.moisture.push(r.moisture)
      if (r.temperature != null) b.temp.push(r.temperature)
    }
    const avg = (a: number[]) => (a.length ? Math.round((a.reduce((s, x) => s + x, 0) / a.length) * 10) / 10 : null)
    const series = [...byMonth.entries()].map(([month, b]) => ({
      month,
      soilPH: avg(b.ph),
      moisture: avg(b.moisture),
      temperature: avg(b.temp),
    }))
    const latest = series[series.length - 1] ?? null
    res.json({ series, latest })
  } catch (err) { next(err) }
})

export default router
