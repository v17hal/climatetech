import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { nextSampleCode } from '../lib/ids'
import { authenticate, requireRole } from '../middleware/auth'
import { evidenceLockForStatus, gateLabQuality } from '../services/validationGates'

const router = Router()
router.use(authenticate)

const STAFF = ['admin', 'field_officer', 'lab_technician', 'vvb_auditor']

/* dCoC tracker — every sample with its traffic-light status + evidence */
router.get('/', requireRole(...STAFF), async (_req, res, next) => {
  try {
    const samples = await prisma.soilSample.findMany({
      include: {
        photo: true,
        labResult: true,
        batch: { select: { batchNumber: true, region: true } },
        farmer: { select: { farmerId: true, farmName: true } },
      },
      orderBy: { sampledAt: 'desc' },
    })
    res.json(samples)
  } catch (err) { next(err) }
})

const createSchema = z.object({
  batchId: z.string().optional(),
  farmerId: z.string().optional(),
  photoId: z.string().min(1),
  assignedLabTechId: z.string().optional(),
  // Custody chain (Admin #4)
  sampledByName: z.string().optional(),
  packagingType: z.string().optional(),
  packagingTempC: z.number().optional(),
})

/*
 * Log a field sample (Yellow). Evidence lock: requires an uploaded,
 * geotagged photo. Field officers write new logs only.
 */
router.post('/', requireRole('admin', 'field_officer'), async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body)

    const photo = await prisma.fieldPhoto.findUnique({ where: { id: body.photoId } })
    const lock = evidenceLockForStatus('sampled', {
      hasPhoto: !!photo,
      hasWaybill: false,
      hasLabPdf: false,
    })
    if (!lock.ok) { res.status(422).json({ error: lock.message, gate: 'evidence_lock' }); return }

    const sample = await prisma.soilSample.create({
      data: {
        sampleCode: await nextSampleCode(),
        batchId: body.batchId,
        farmerId: body.farmerId ?? photo!.farmerId,
        photoId: body.photoId,
        assignedLabTechId: body.assignedLabTechId,
        sampledByName: body.sampledByName,
        packagingType: body.packagingType,
        packagingTempC: body.packagingTempC,
        status: 'sampled',
      },
      include: { photo: true },
    })

    if (body.batchId) {
      await prisma.biocharBatch.updateMany({
        where: { id: body.batchId, dcocStatus: 'produced' },
        data: { dcocStatus: 'sampled' },
      })
    }
    res.status(201).json(sample)
  } catch (err) { next(err) }
})

/* Custody stage: collected from the field (Admin #4). */
router.patch('/:id/collect', requireRole('admin', 'field_officer'), async (req, res, next) => {
  try {
    const body = z.object({
      collectedByName: z.string().min(2),
      packagingType: z.string().optional(),
      packagingTempC: z.number().optional(),
    }).parse(req.body)
    const sample = await prisma.soilSample.findUnique({ where: { id: String(req.params.id) } })
    if (!sample) { res.status(404).json({ error: 'Sample not found' }); return }
    const updated = await prisma.soilSample.update({
      where: { id: sample.id },
      data: {
        collectedByName: body.collectedByName,
        collectedAt: new Date(),
        ...(body.packagingType ? { packagingType: body.packagingType } : {}),
        ...(body.packagingTempC != null ? { packagingTempC: body.packagingTempC } : {}),
      },
    })
    res.json(updated)
  } catch (err) { next(err) }
})

/* Custody stage: delivered to the lab (Admin #4). */
router.patch('/:id/deliver', requireRole('admin', 'field_officer'), async (req, res, next) => {
  try {
    const body = z.object({ deliveredByName: z.string().min(2) }).parse(req.body)
    const sample = await prisma.soilSample.findUnique({ where: { id: String(req.params.id) } })
    if (!sample) { res.status(404).json({ error: 'Sample not found' }); return }
    const updated = await prisma.soilSample.update({
      where: { id: sample.id },
      data: { deliveredByName: body.deliveredByName, deliveredAt: new Date() },
    })
    res.json(updated)
  } catch (err) { next(err) }
})

/*
 * Advance to "Received by Lab" (Orange). Evidence lock: waybill/tracking #.
 * Done by the lab technician on intake (admin may correct).
 */
router.patch('/:id/receive', requireRole('admin', 'lab_technician'), async (req, res, next) => {
  try {
    const { waybillNumber } = z.object({ waybillNumber: z.string().min(3) }).parse(req.body)

    const sample = await prisma.soilSample.findUnique({ where: { id: String(req.params.id) } })
    if (!sample) { res.status(404).json({ error: 'Sample not found' }); return }
    if (sample.status === 'rejected') {
      res.status(422).json({ error: 'Sample is permanently rejected and cannot advance.' })
      return
    }

    const lock = evidenceLockForStatus('lab_received', {
      hasPhoto: !!sample.photoId,
      hasWaybill: !!waybillNumber,
      hasLabPdf: false,
    })
    if (!lock.ok) { res.status(422).json({ error: lock.message, gate: 'evidence_lock' }); return }

    const updated = await prisma.soilSample.update({
      where: { id: sample.id },
      data: { status: 'lab_received', waybillNumber, labReceivedAt: new Date() },
    })
    if (sample.batchId) {
      await prisma.biocharBatch.updateMany({
        where: { id: sample.batchId, dcocStatus: { in: ['produced', 'sampled'] } },
        data: { dcocStatus: 'lab_received' },
      })
    }
    res.json(updated)
  } catch (err) { next(err) }
})

const resultsSchema = z.object({
  cOrgPercent: z.number().min(0).max(100),
  hcRatio: z.number().min(0),
  heavyMetalsPass: z.boolean(),
  soilPH: z.number().min(0).max(14).optional(),
  electricalConductivity: z.number().min(0).optional(),
  bulkDensity: z.number().min(0).optional(),
  specificSurfaceArea: z.number().min(0).optional(),
  waterHoldingCapacity: z.number().min(0).max(100).optional(),
  certificatePath: z.string().min(1),
})

/*
 * Enter lab results (Green — or Rejected). Lab technicians only.
 * Evidence lock: certificate PDF must be attached. Gate 3 (EBC/IBI): the
 * entry is SAVED either way, but a failing H:C ratio or heavy-metal test
 * permanently rejects the sample and locks batch issuance.
 */
router.post('/:id/results', requireRole('lab_technician'), async (req, res, next) => {
  try {
    const body = resultsSchema.parse(req.body)
    const userId = (req as { userId?: string }).userId!

    const sample = await prisma.soilSample.findUnique({
      where: { id: String(req.params.id) },
      include: { labResult: true },
    })
    if (!sample) { res.status(404).json({ error: 'Sample not found' }); return }
    if (sample.labResult) {
      res.status(409).json({ error: 'Results already entered for this sample — historical records are immutable.' })
      return
    }
    if (sample.status !== 'lab_received') {
      res.status(422).json({ error: 'Sample must be received by the lab (waybill logged) before results can be entered.' })
      return
    }

    const lock = evidenceLockForStatus('results_entered', {
      hasPhoto: !!sample.photoId,
      hasWaybill: !!sample.waybillNumber,
      hasLabPdf: !!body.certificatePath,
    })
    if (!lock.ok) { res.status(422).json({ error: lock.message, gate: 'evidence_lock' }); return }

    const gate = gateLabQuality(body.hcRatio, body.heavyMetalsPass)
    const newStatus = gate.ok ? 'results_entered' : 'rejected'

    const result = await prisma.labResult.create({
      data: { ...body, sampleId: sample.id, enteredById: userId },
    })
    await prisma.soilSample.update({ where: { id: sample.id }, data: { status: newStatus } })

    if (sample.batchId) {
      await prisma.biocharBatch.update({
        where: { id: sample.batchId },
        data: {
          cOrgPercent: body.cOrgPercent,
          hcRatio: body.hcRatio,
          heavyMetalsPass: body.heavyMetalsPass,
          dcocStatus: newStatus,
          issuanceEligible: gate.ok,
        },
      })
    }
    if (!gate.ok) {
      await prisma.alert.create({
        data: {
          type: 'compliance',
          severity: 'critical',
          title: 'Batch permanently locked',
          message: gate.message!,
          farmerId: sample.farmerId,
        },
      })
    }

    res.status(201).json({ result, status: newStatus, gateMessage: gate.message ?? null })
  } catch (err) { next(err) }
})

export default router
