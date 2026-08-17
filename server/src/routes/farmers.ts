import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res, next) => {
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

    // Field-officer delegation (Field #2): officers only see farms assigned to them.
    if (req.userRole === 'field_officer') where.assignedOfficerId = req.userId

    const [farmers, total] = await Promise.all([
      prisma.farmer.findMany({
        where, skip, take,
        include: {
          user: { select: { name: true, email: true } },
          assignedOfficer: { select: { id: true, name: true } },
        },
        orderBy: { enrolledAt: 'desc' },
      }),
      prisma.farmer.count({ where }),
    ])

    res.json({ farmers, total, page: parseInt(page) || 1, pages: Math.ceil(total / take) })
  } catch (err) { next(err) }
})

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { id: String(req.params.id) },
      include: {
        user: { select: { name: true, email: true } },
        assignedOfficer: { select: { id: true, name: true } },
        carbonRecords: { orderBy: { date: 'desc' }, take: 10 },
        baselineTests: { orderBy: { testDate: 'desc' } },
        alerts: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
    if (!farmer) { res.status(404).json({ error: 'Farmer not found' }); return }
    // Field officers can only open farms delegated to them.
    if (req.userRole === 'field_officer' && farmer.assignedOfficerId !== req.userId) {
      res.status(403).json({ error: 'This farm is not assigned to you' })
      return
    }
    res.json(farmer)
  } catch (err) { next(err) }
})

/* List field officers (for the admin assignment dropdown). */
router.get('/officers/all', requireRole('admin'), async (_req, res, next) => {
  try {
    const officers = await prisma.user.findMany({
      where: { role: 'field_officer' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    })
    res.json(officers)
  } catch (err) { next(err) }
})

/* Assign / unassign a field officer to a farm (admin only) — Field #2. */
router.patch('/:id/assign', requireRole('admin'), async (req, res, next) => {
  try {
    const { officerId } = z.object({ officerId: z.string().nullable() }).parse(req.body)
    if (officerId) {
      const officer = await prisma.user.findUnique({ where: { id: officerId } })
      if (!officer || officer.role !== 'field_officer') {
        res.status(422).json({ error: 'officerId must reference a field officer' })
        return
      }
    }
    const farmer = await prisma.farmer.update({
      where: { id: String(req.params.id) },
      data: { assignedOfficerId: officerId },
    })
    res.json(farmer)
  } catch (err) { next(err) }
})

/* Baseline soil test for a farm (Field #1) — captured before biochar. */
const baselineSchema = z.object({
  testDate: z.coerce.date(),
  soilPH: z.number().min(0).max(14),
  organicMatter: z.number().min(0),
  moisture: z.number().min(0).max(100),
  soilCarbon: z.number().min(0),
  temperature: z.number().optional(),
  labName: z.string().default('SGS'),
  testedBy: z.string().optional(),
  notes: z.string().optional(),
})

router.get('/:id/baseline', async (req, res, next) => {
  try {
    const tests = await prisma.baselineTest.findMany({
      where: { farmerId: String(req.params.id) },
      orderBy: { testDate: 'desc' },
    })
    res.json(tests)
  } catch (err) { next(err) }
})

router.post('/:id/baseline', requireRole('admin', 'field_officer'), async (req, res, next) => {
  try {
    const body = baselineSchema.parse(req.body)
    const test = await prisma.baselineTest.create({
      data: { ...body, farmerId: String(req.params.id) },
    })
    res.status(201).json(test)
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
