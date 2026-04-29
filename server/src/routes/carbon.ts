import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/farmer/:farmerId', async (req, res, next) => {
  try {
    const records = await prisma.carbonRecord.findMany({
      where: { farmerId: req.params.farmerId },
      orderBy: { date: 'desc' },
    })
    res.json(records)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { farmerId, date, carbonLevel, soilPH, organicMatter, moisture, inputMethod, notes } = req.body
    const record = await prisma.carbonRecord.create({
      data: { farmerId, date: new Date(date), carbonLevel, soilPH, organicMatter, moisture, inputMethod, notes },
    })
    res.status(201).json(record)
  } catch (err) { next(err) }
})

router.get('/stats', async (_req, res, next) => {
  try {
    const result = await prisma.carbonRecord.aggregate({
      _sum: { carbonLevel: true },
      _avg: { carbonLevel: true, soilPH: true, organicMatter: true },
      _count: true,
    })
    res.json(result)
  } catch (err) { next(err) }
})

export default router
