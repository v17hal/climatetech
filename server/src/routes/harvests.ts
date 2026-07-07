import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireRole } from '../middleware/auth'
import { gateSeasonality } from '../services/validationGates'
import { yieldIncreasePercent } from '../services/carbonEngine'

const router = Router()
router.use(authenticate)

const STAFF = ['admin', 'field_officer', 'lab_technician', 'vvb_auditor']

router.get('/', requireRole(...STAFF), async (_req, res, next) => {
  try {
    const harvests = await prisma.harvestRecord.findMany({
      include: { farmer: { select: { farmerId: true, farmName: true } } },
      orderBy: { harvestDate: 'desc' },
    })
    res.json(harvests)
  } catch (err) { next(err) }
})

/*
 * Yield & Harvest Reconciliation — automated Yield Increase % per
 * region + crop, comparing project plots against control (baseline) plots.
 * Primary metric for Gold Standard "Co-benefits".
 */
router.get('/yield-summary', requireRole(...STAFF), async (_req, res, next) => {
  try {
    const harvests = await prisma.harvestRecord.findMany()
    const groups = new Map<string, { region: string; cropType: string; project: typeof harvests; control: typeof harvests }>()
    for (const h of harvests) {
      const key = `${h.region}::${h.cropType.toLowerCase()}`
      if (!groups.has(key)) groups.set(key, { region: h.region, cropType: h.cropType, project: [], control: [] })
      groups.get(key)![h.plotType === 'control' ? 'control' : 'project'].push(h)
    }
    const summary = [...groups.values()].map((g) => ({
      region: g.region,
      cropType: g.cropType,
      projectPlots: g.project.length,
      controlPlots: g.control.length,
      projectTonnes: g.project.reduce((s, h) => s + h.weightTonnes, 0),
      controlTonnes: g.control.reduce((s, h) => s + h.weightTonnes, 0),
      flaggedEntries: [...g.project, ...g.control].filter((h) => h.flagged).length,
      yieldIncreasePercent: yieldIncreasePercent(
        g.project.map((h) => ({ weightTonnes: h.weightTonnes, moisturePercent: h.moisturePercent })),
        g.control.map((h) => ({ weightTonnes: h.weightTonnes, moisturePercent: h.moisturePercent }))
      ),
    }))
    res.json(summary)
  } catch (err) { next(err) }
})

const harvestSchema = z.object({
  farmerId: z.string().optional(),
  region: z.string().min(2),
  cropType: z.string().min(2),
  harvestDate: z.coerce.date(),
  weightTonnes: z.number().positive(),
  moisturePercent: z.number().min(0).max(100),
  plotType: z.enum(['project', 'control']).default('project'),
})

/*
 * Manual harvest entry — Gate 2 (Gold Standard) cross-references the
 * seasonality planner: out-of-window or off-baseline crops are ACCEPTED
 * but flagged "Out-of-Season Audit Required" and a VVB notification logged.
 */
router.post('/', requireRole('admin', 'field_officer'), async (req, res, next) => {
  try {
    const body = harvestSchema.parse(req.body)

    const plans = await prisma.seasonalityPlan.findMany({ where: { region: body.region } })
    const gate = gateSeasonality(
      body.harvestDate,
      body.cropType,
      plans.map((p) => ({ cropType: p.cropType, windowStart: p.windowStart, windowEnd: p.windowEnd }))
    )

    const harvest = await prisma.harvestRecord.create({
      data: {
        ...body,
        flagged: gate.action === 'flag',
        flagReason: gate.action === 'flag' ? 'Out-of-Season Audit Required' : null,
      },
    })

    if (gate.action === 'flag') {
      await prisma.alert.create({
        data: {
          type: 'compliance',
          severity: 'medium',
          title: 'Out-of-Season Audit Required',
          message: gate.message!,
          farmerId: body.farmerId,
        },
      })
    }

    res.status(201).json({ harvest, gateMessage: gate.message ?? null })
  } catch (err) { next(err) }
})

export default router
