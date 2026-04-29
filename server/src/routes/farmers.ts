import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res, next) => {
  try {
    const { page = '1', limit = '20', search, province, status } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where: Record<string, unknown> = {}
    if (search) where.user = { name: { contains: search, mode: 'insensitive' } }
    if (province) where.province = province
    if (status) where.status = status

    const [farmers, total] = await Promise.all([
      prisma.farmer.findMany({
        where, skip, take: parseInt(limit),
        include: { user: { select: { name: true, email: true } } },
        orderBy: { enrolledAt: 'desc' },
      }),
      prisma.farmer.count({ where }),
    ])

    res.json({ farmers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, email: true } },
        carbonRecords: { orderBy: { date: 'desc' }, take: 10 },
        alerts: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
    if (!farmer) { res.status(404).json({ error: 'Farmer not found' }); return }
    res.json(farmer)
  } catch (err) { next(err) }
})

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    const farmer = await prisma.farmer.update({
      where: { id: req.params.id },
      data: { status },
    })
    res.json(farmer)
  } catch (err) { next(err) }
})

export default router
