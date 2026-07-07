import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireRole } from '../middleware/auth'

const router = Router()
router.use(authenticate)

const STAFF = ['admin', 'field_officer', 'lab_technician', 'vvb_auditor']

router.get('/', requireRole(...STAFF), async (req, res, next) => {
  try {
    const { region, year } = req.query as Record<string, string>
    const where: Record<string, unknown> = {}
    if (region) where.region = region
    if (year) where.year = parseInt(year)
    const plans = await prisma.seasonalityPlan.findMany({
      where,
      orderBy: [{ region: 'asc' }, { cropType: 'asc' }],
    })
    res.json(plans)
  } catch (err) { next(err) }
})

const planSchema = z.object({
  region: z.string().min(2),
  cropType: z.string().min(2),
  year: z.number().int().min(2020).max(2100),
  plannedPlantingDate: z.coerce.date(),
  actualPlantingDate: z.coerce.date().optional(),
  windowStart: z.coerce.date(),
  windowEnd: z.coerce.date(),
})

/* Seasonality planner is admin-managed (CSSA Admin permission matrix). */
router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const body = planSchema.parse(req.body)
    if (body.windowEnd <= body.windowStart) {
      res.status(422).json({ error: 'Harvest window end must be after window start.' })
      return
    }
    const plan = await prisma.seasonalityPlan.upsert({
      where: {
        region_cropType_year: { region: body.region, cropType: body.cropType, year: body.year },
      },
      create: body,
      update: body,
    })
    res.status(201).json(plan)
  } catch (err) { next(err) }
})

/* Record actual planting date ("Planned vs Actual"). */
router.patch('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const body = planSchema.partial().parse(req.body)
    const plan = await prisma.seasonalityPlan.update({ where: { id: String(req.params.id) }, data: body })
    res.json(plan)
  } catch (err) { next(err) }
})

export default router
