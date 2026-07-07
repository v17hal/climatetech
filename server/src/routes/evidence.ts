import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import multer from 'multer'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth'
import { verifyFieldEvidence, roundGps } from '../services/validationGates'

const router = Router()
router.use(authenticate)

const STAFF = ['admin', 'field_officer', 'lab_technician', 'vvb_auditor']

export const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads')
const PHOTO_DIR = path.join(UPLOADS_ROOT, 'photos')
const CERT_DIR = path.join(UPLOADS_ROOT, 'certificates')
for (const dir of [PHOTO_DIR, CERT_DIR]) fs.mkdirSync(dir, { recursive: true })

function storageFor(dir: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
      cb(null, `${Date.now()}-${safe}`)
    },
  })
}

const photoUpload = multer({
  storage: storageFor(PHOTO_DIR),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype))
  },
})

const certUpload = multer({
  storage: storageFor(CERT_DIR),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === 'application/pdf')
  },
})

const photoMetaSchema = z.object({
  utcTimestamp: z.coerce.date(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  deviceId: z.string().min(2),
  farmerId: z.string().optional(),
  photoType: z.enum(['field', 'sample', 'before', 'after']).default('field'),
  caption: z.string().optional(),
})

/*
 * Camera log — grid of all field photos with UTC timestamp, GPS (5 dp)
 * and device ID. Filterable by farmer and verification status.
 */
router.get('/photos', requireRole(...STAFF), async (req, res, next) => {
  try {
    const { farmerId, verificationStatus } = req.query as Record<string, string>
    const where: Record<string, unknown> = {}
    if (farmerId) where.farmerId = farmerId
    if (verificationStatus) where.verificationStatus = verificationStatus

    const photos = await prisma.fieldPhoto.findMany({
      where,
      include: {
        farmer: { select: { farmerId: true, farmName: true } },
        uploadedBy: { select: { name: true, role: true } },
      },
      orderBy: { utcTimestamp: 'desc' },
    })
    res.json(photos)
  } catch (err) { next(err) }
})

/*
 * Field photo upload (Required Evidence). Metadata is mandatory; the
 * Automated Geospatial Trust Verifier runs immediately: if the GPS point
 * falls outside the farmer's registered boundary the photo is flagged and
 * an admin audit alert is raised.
 */
router.post(
  '/photos',
  requireRole('admin', 'field_officer'),
  photoUpload.single('photo'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.file) {
        res.status(422).json({ error: 'Evidence lock: a photo file (JPEG/PNG/WebP) is required.' })
        return
      }
      const meta = photoMetaSchema.parse(req.body)

      let isVerified = false
      let verificationStatus = 'pending'
      let alertMessage: string | undefined

      if (meta.farmerId) {
        const farmer = await prisma.farmer.findUnique({ where: { id: meta.farmerId } })
        if (!farmer) { res.status(404).json({ error: 'Farmer not found' }); return }
        const boundary = farmer.boundary ? (JSON.parse(farmer.boundary) as [number, number][]) : null
        const verdict = verifyFieldEvidence([meta.latitude, meta.longitude], boundary)
        isVerified = verdict.isVerified
        verificationStatus = verdict.verificationStatus
        alertMessage = verdict.alert
      }

      const photo = await prisma.fieldPhoto.create({
        data: {
          filePath: `/uploads/photos/${req.file.filename}`,
          utcTimestamp: meta.utcTimestamp,
          latitude: roundGps(meta.latitude),
          longitude: roundGps(meta.longitude),
          deviceId: meta.deviceId,
          photoType: meta.photoType,
          caption: meta.caption,
          farmerId: meta.farmerId,
          isVerified,
          verificationStatus,
          uploadedById: req.userId,
        },
      })

      if (alertMessage) {
        await prisma.alert.create({
          data: {
            type: 'compliance',
            severity: 'high',
            title: 'Boundary mismatch flagged',
            message: alertMessage,
            farmerId: meta.farmerId,
          },
        })
      }

      res.status(201).json(photo)
    } catch (err) { next(err) }
  }
)

/*
 * Lab certificate PDF upload — returns the stored path, which the lab
 * technician then attaches when entering results (evidence lock for Green).
 */
router.post(
  '/certificates',
  requireRole('admin', 'lab_technician'),
  certUpload.single('certificate'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(422).json({ error: 'Evidence lock: a PDF lab certificate is required.' })
        return
      }
      res.status(201).json({ certificatePath: `/uploads/certificates/${req.file.filename}` })
    } catch (err) { next(err) }
  }
)

export default router
