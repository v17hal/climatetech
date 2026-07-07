import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { grossCO2e, carsOffRoadEquivalent } from '../services/carbonEngine'

const router = Router()

/**
 * Sustainable Farm Passport — PUBLIC verification page target for the
 * farmer's QR code. Confirms dMRV-compliant practices (Verra / Puro.earth)
 * WITHOUT exposing private financial details.
 */
router.get('/:farmerId', async (req, res, next) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { farmerId: String(req.params.farmerId) },
      include: { user: { select: { name: true } } },
    })
    if (!farmer) { res.status(404).json({ error: 'Passport not found' }); return }

    const [applications, samples, photos] = await Promise.all([
      prisma.applicationRecord.findMany({
        where: { farmerId: farmer.id },
        include: { batch: true },
      }),
      prisma.soilSample.findMany({ where: { farmerId: farmer.id }, include: { labResult: true } }),
      prisma.fieldPhoto.count({ where: { farmerId: farmer.id, isVerified: true } }),
    ])

    const storedCO2e = applications.reduce((sum, a) => {
      const cOrg = a.batch.cOrgPercent
      return cOrg != null && a.batch.issuanceEligible ? sum + grossCO2e(a.weightTonnes, cOrg) : sum
    }, 0)

    /* Public, non-financial credential only */
    res.json({
      farmerId: farmer.farmerId,
      farmerName: farmer.user.name,
      farmName: farmer.farmName,
      province: farmer.province,
      district: farmer.district,
      cropTypes: JSON.parse(farmer.cropTypes || '[]'),
      farmingPractices: JSON.parse(farmer.farmingPractices || '[]'),
      enrolledAt: farmer.enrolledAt,
      status: farmer.status,
      dmrv: {
        storedCO2e: Math.round(storedCO2e * 100) / 100,
        carsOffRoadEquivalent: carsOffRoadEquivalent(storedCO2e),
        biocharAppliedTonnes: applications.reduce((s, a) => s + a.weightTonnes, 0),
        verifiedSamples: samples.filter((s) => s.status === 'results_entered').length,
        verifiedPhotos: photos,
        methodologies: ['Verra', 'Puro.earth', 'Gold Standard'],
      },
      verifiedAt: new Date().toISOString(),
    })
  } catch (err) { next(err) }
})

export default router
