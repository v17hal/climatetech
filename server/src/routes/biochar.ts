import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { nextBatchNumber } from '../lib/ids'
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth'
import { gatePyrolysisTemp } from '../services/validationGates'
import {
  grossCO2e,
  transportDeductions,
  netCO2e,
  massBalance,
  carsOffRoadEquivalent,
} from '../services/carbonEngine'

const router = Router()
router.use(authenticate)

const STAFF = ['admin', 'field_officer', 'lab_technician', 'vvb_auditor']

const batchSchema = z.object({
  productionDate: z.coerce.date(),
  feedstockType: z.string().min(2),
  pyrolysisTemp: z.number(),
  rawWeightTonnes: z.number().positive(),
  region: z.string().min(2),
})

const shipmentSchema = z.object({
  date: z.coerce.date(),
  weightTonnes: z.number().positive(),
  destination: z.string().min(2),
  waybillNumber: z.string().min(3),
  mileageKm: z.number().min(0),
})

const applicationSchema = z.object({
  farmerId: z.string().min(1),
  date: z.coerce.date(),
  weightTonnes: z.number().positive(),
  notes: z.string().optional(),
})

function batchTotals(batch: {
  rawWeightTonnes: number
  cOrgPercent: number | null
  issuanceEligible: boolean
  shipments: { weightTonnes: number; mileageKm: number }[]
  applications: { weightTonnes: number }[]
}) {
  const shipped = batch.shipments.reduce((s, x) => s + x.weightTonnes, 0)
  const applied = batch.applications.reduce((s, x) => s + x.weightTonnes, 0)
  const gross = batch.cOrgPercent != null ? grossCO2e(batch.rawWeightTonnes, batch.cOrgPercent) : 0
  const deductions = transportDeductions(batch.shipments)
  const net = netCO2e(gross, deductions)
  return {
    massBalance: massBalance(batch.rawWeightTonnes, shipped, applied),
    grossCO2e: gross,
    deductionsCO2e: deductions,
    netCO2e: net,
    creditableCO2e: batch.issuanceEligible ? net : 0,
  }
}

/* List batches with computed mass balance + carbon figures */
router.get('/', requireRole(...STAFF), async (_req, res, next) => {
  try {
    const batches = await prisma.biocharBatch.findMany({
      include: { shipments: true, applications: true, samples: { include: { labResult: true } } },
      orderBy: { productionDate: 'desc' },
    })
    res.json(batches.map((b) => ({ ...b, computed: batchTotals(b) })))
  } catch (err) { next(err) }
})

/* Aggregate mass balance across all batches (Auditor requirement: proves no leakage) */
router.get('/mass-balance', requireRole(...STAFF), async (_req, res, next) => {
  try {
    const [produced, shipped, applied] = await Promise.all([
      prisma.biocharBatch.aggregate({ _sum: { rawWeightTonnes: true } }),
      prisma.shipment.aggregate({ _sum: { weightTonnes: true } }),
      prisma.applicationRecord.aggregate({ _sum: { weightTonnes: true } }),
    ])
    res.json(
      massBalance(
        produced._sum.rawWeightTonnes ?? 0,
        shipped._sum.weightTonnes ?? 0,
        applied._sum.weightTonnes ?? 0
      )
    )
  } catch (err) { next(err) }
})

/* Carbon Calculation Ledger — per-batch gross/deduction/net + portfolio totals */
router.get('/ledger', requireRole(...STAFF), async (_req, res, next) => {
  try {
    const batches = await prisma.biocharBatch.findMany({
      include: { shipments: true, applications: true },
      orderBy: { productionDate: 'desc' },
    })
    const rows = batches.map((b) => ({
      id: b.id,
      batchNumber: b.batchNumber,
      productionDate: b.productionDate,
      feedstockType: b.feedstockType,
      region: b.region,
      rawWeightTonnes: b.rawWeightTonnes,
      cOrgPercent: b.cOrgPercent,
      hcRatio: b.hcRatio,
      dcocStatus: b.dcocStatus,
      issuanceEligible: b.issuanceEligible,
      ...batchTotals(b),
    }))
    const totals = rows.reduce(
      (acc, r) => ({
        grossCO2e: acc.grossCO2e + r.grossCO2e,
        deductionsCO2e: acc.deductionsCO2e + r.deductionsCO2e,
        netCO2e: acc.netCO2e + r.netCO2e,
        creditableCO2e: acc.creditableCO2e + r.creditableCO2e,
      }),
      { grossCO2e: 0, deductionsCO2e: 0, netCO2e: 0, creditableCO2e: 0 }
    )
    res.json({
      rows,
      totals: { ...totals, carsOffRoad: carsOffRoadEquivalent(totals.creditableCO2e) },
    })
  } catch (err) { next(err) }
})

router.get('/:id', requireRole(...STAFF), async (req, res, next) => {
  try {
    const batch = await prisma.biocharBatch.findUnique({
      where: { id: String(req.params.id) },
      include: {
        shipments: { orderBy: { date: 'desc' } },
        applications: { include: { farmer: { select: { farmerId: true, farmName: true } } }, orderBy: { date: 'desc' } },
        samples: { include: { labResult: true, photo: true } },
      },
    })
    if (!batch) { res.status(404).json({ error: 'Batch not found' }); return }
    res.json({ ...batch, computed: batchTotals(batch) })
  } catch (err) { next(err) }
})

/* Production Log entry — Gate 1 enforced. Field officers and admins may create. */
router.post('/', requireRole('admin', 'field_officer'), async (req: AuthRequest, res, next) => {
  try {
    const body = batchSchema.parse(req.body)

    const gate = gatePyrolysisTemp(body.pyrolysisTemp)
    if (gate.action === 'reject') {
      res.status(422).json({ error: gate.message, gate: 'pyrolysis_threshold' })
      return
    }

    const batch = await prisma.biocharBatch.create({
      data: {
        batchNumber: await nextBatchNumber(body.productionDate),
        productionDate: body.productionDate,
        feedstockType: body.feedstockType,
        pyrolysisTemp: body.pyrolysisTemp,
        rawWeightTonnes: body.rawWeightTonnes,
        region: body.region,
        createdById: req.userId,
      },
    })
    res.status(201).json(batch)
  } catch (err) { next(err) }
})

/*
 * Batch edits: admin only (field officers cannot edit or delete historical
 * batches). Gate 1 re-runs — an admin cannot lower the temperature below
 * the registry threshold. Chemistry/issuance fields are lab-owned and are
 * NOT editable here (admins cannot alter calculations or bypass gates).
 */
router.patch('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const body = batchSchema.partial().parse(req.body)
    if (body.pyrolysisTemp !== undefined) {
      const gate = gatePyrolysisTemp(body.pyrolysisTemp)
      if (gate.action === 'reject') {
        res.status(422).json({ error: gate.message, gate: 'pyrolysis_threshold' })
        return
      }
    }
    const batch = await prisma.biocharBatch.update({ where: { id: String(req.params.id) }, data: body })
    res.json(batch)
  } catch (err) { next(err) }
})

/* Shipment log — feeds mass balance + transport deductions */
router.post('/:id/shipments', requireRole('admin', 'field_officer'), async (req, res, next) => {
  try {
    const body = shipmentSchema.parse(req.body)
    const batch = await prisma.biocharBatch.findUnique({
      where: { id: String(req.params.id) },
      include: { shipments: true, applications: true },
    })
    if (!batch) { res.status(404).json({ error: 'Batch not found' }); return }

    const { remaining } = batchTotals(batch).massBalance
    if (body.weightTonnes > remaining) {
      res.status(422).json({
        error: `Mass balance violation: only ${remaining}t remain in this batch — cannot ship ${body.weightTonnes}t.`,
        gate: 'mass_balance',
      })
      return
    }
    const shipment = await prisma.shipment.create({ data: { ...body, batchId: batch.id } })
    res.status(201).json(shipment)
  } catch (err) { next(err) }
})

/* Field application — biochar into farmer soil; completes the mass balance chain */
router.post('/:id/applications', requireRole('admin', 'field_officer'), async (req, res, next) => {
  try {
    const body = applicationSchema.parse(req.body)
    const batch = await prisma.biocharBatch.findUnique({
      where: { id: String(req.params.id) },
      include: { shipments: true, applications: true },
    })
    if (!batch) { res.status(404).json({ error: 'Batch not found' }); return }

    const farmer = await prisma.farmer.findUnique({ where: { id: body.farmerId } })
    if (!farmer) { res.status(404).json({ error: 'Farmer not found' }); return }

    const { remaining } = batchTotals(batch).massBalance
    if (body.weightTonnes > remaining) {
      res.status(422).json({
        error: `Mass balance violation: only ${remaining}t remain in this batch — cannot apply ${body.weightTonnes}t.`,
        gate: 'mass_balance',
      })
      return
    }
    const application = await prisma.applicationRecord.create({
      data: { ...body, batchId: batch.id },
    })
    res.status(201).json(application)
  } catch (err) { next(err) }
})

export default router
