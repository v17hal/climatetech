import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, type AuthRequest } from '../middleware/auth'
import { grossCO2e, carsOffRoadEquivalent } from '../services/carbonEngine'

const router = Router()
router.use(authenticate)

/**
 * Farmer "Value & Impact" dashboard feed: soil health profile (translated
 * lab data), Carbon Bank (stored CO₂e + payout ledger) and Evidence Locker.
 * Farmers see their own farm; staff and auditors can view any farm.
 */
router.get('/:farmerId', async (req: AuthRequest, res, next) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { id: String(req.params.farmerId) },
      include: { user: { select: { name: true } } },
    })
    if (!farmer) { res.status(404).json({ error: 'Farmer not found' }); return }
    if (req.userRole === 'farmer' && farmer.userId !== req.userId) {
      res.status(403).json({ error: 'Farmers may only view their own dashboard' })
      return
    }

    const [samples, applications, payouts, photos] = await Promise.all([
      prisma.soilSample.findMany({
        where: { farmerId: farmer.id },
        include: { labResult: true },
        orderBy: { sampledAt: 'asc' },
      }),
      prisma.applicationRecord.findMany({
        where: { farmerId: farmer.id },
        include: { batch: true },
      }),
      prisma.payout.findMany({ where: { farmerId: farmer.id }, orderBy: { date: 'desc' } }),
      prisma.fieldPhoto.findMany({
        where: { farmerId: farmer.id },
        orderBy: { utcTimestamp: 'asc' },
      }),
    ])

    /* Soil health — lab results over time (bulk density trend, latest gauges) */
    const labSeries = samples
      .filter((s) => s.labResult)
      .map((s) => ({
        date: s.labResult!.enteredAt,
        soilPH: s.labResult!.soilPH,
        electricalConductivity: s.labResult!.electricalConductivity,
        bulkDensity: s.labResult!.bulkDensity,
        waterHoldingCapacity: s.labResult!.waterHoldingCapacity,
        specificSurfaceArea: s.labResult!.specificSurfaceArea,
      }))
    const latest = labSeries[labSeries.length - 1] ?? null
    const first = labSeries[0] ?? null
    const waterSavingPercent =
      latest?.waterHoldingCapacity != null && first?.waterHoldingCapacity != null && first.waterHoldingCapacity > 0
        ? Math.round(((latest.waterHoldingCapacity - first.waterHoldingCapacity) / first.waterHoldingCapacity) * 100)
        : null

    /* Carbon Bank — CO₂e permanently stored via biochar applied to this farm */
    const storedCO2e = applications.reduce((sum, a) => {
      const cOrg = a.batch.cOrgPercent
      return cOrg != null && a.batch.issuanceEligible ? sum + grossCO2e(a.weightTonnes, cOrg) : sum
    }, 0)
    const totalEarned = payouts.reduce((s, p) => s + p.amount, 0)

    res.json({
      farmer: {
        id: farmer.id,
        farmerId: farmer.farmerId,
        name: farmer.user.name,
        farmName: farmer.farmName,
        province: farmer.province,
        cropTypes: JSON.parse(farmer.cropTypes || '[]'),
      },
      soilHealth: { latest, first, series: labSeries, waterSavingPercent },
      carbonBank: {
        storedCO2e: Math.round(storedCO2e * 100) / 100,
        carsOffRoad: carsOffRoadEquivalent(storedCO2e),
        biocharAppliedTonnes: applications.reduce((s, a) => s + a.weightTonnes, 0),
        totalEarned,
        payouts,
      },
      evidence: {
        photos,
        verifiedCount: photos.filter((p) => p.isVerified).length,
      },
    })
  } catch (err) { next(err) }
})

export default router
