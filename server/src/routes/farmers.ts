import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireRole } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res, next) => {
  try {
    const { page = '1', limit = '20', search, province, status } = req.query as Record<string, string>
    const take = Math.min(parseInt(limit) || 20, 200)
    const skip = ((parseInt(page) || 1) - 1) * take

    const where: Record<string, unknown> = {}
    // SQLite LIKE is case-insensitive for ASCII, so plain `contains` suffices
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { farmName: { contains: search } },
        { farmerId: { contains: search } },
      ]
    }
    if (province) where.province = province
    if (status) where.status = status

    const [farmers, total] = await Promise.all([
      prisma.farmer.findMany({
        where, skip, take,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { enrolledAt: 'desc' },
      }),
      prisma.farmer.count({ where }),
    ])

    res.json({ farmers, total, page: parseInt(page) || 1, pages: Math.ceil(total / take) })
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { id: String(req.params.id) },
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

const updateSchema = z.object({
  phone: z.string().min(10).optional(),
  farmName: z.string().min(2).optional(),
  farmSize: z.number().positive().optional(),
  farmSizeUnit: z.string().optional(),
  province: z.string().min(2).optional(),
  district: z.string().min(2).optional(),
  cropTypes: z.array(z.string()).optional(),
  farmingPractices: z.array(z.string()).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  boundary: z.array(z.tuple([z.number(), z.number()])).min(3).optional(),
  lsmScore: z.number().int().min(0).max(100).optional(),
  lsmCategory: z.string().optional(),
})

/* Profile updates — staff only (registered farm data is audit evidence). */
router.patch('/:id', requireRole('admin', 'field_officer'), async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body)
    const data: Record<string, unknown> = { ...body }
    if (body.cropTypes) data.cropTypes = JSON.stringify(body.cropTypes)
    if (body.farmingPractices) data.farmingPractices = JSON.stringify(body.farmingPractices)
    if (body.boundary) data.boundary = JSON.stringify(body.boundary)

    const farmer = await prisma.farmer.update({ where: { id: String(req.params.id) }, data })
    res.json(farmer)
  } catch (err) { next(err) }
})

router.patch('/:id/status', requireRole('admin', 'field_officer'), async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['active', 'inactive', 'pending']) }).parse(req.body)
    const farmer = await prisma.farmer.update({
      where: { id: String(req.params.id) },
      data: { status },
    })
    res.json(farmer)
  } catch (err) { next(err) }
})

export default router
