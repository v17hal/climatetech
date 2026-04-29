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

export default router
