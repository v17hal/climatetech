import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, requireRole } from '../middleware/auth'

const router = Router()
router.use(authenticate)
/* Admins manage the trail; VVB auditors get full read access to it. */
router.use(requireRole('admin', 'vvb_auditor'))

router.get('/', async (req, res, next) => {
  try {
    const { page = '1', limit = '100' } = req.query as Record<string, string>
    const take = Math.min(parseInt(limit), 500)
    const skip = (parseInt(page) - 1) * take
    const [entries, total] = await Promise.all([
      prisma.auditEntry.findMany({ orderBy: { timestamp: 'desc' }, take, skip }),
      prisma.auditEntry.count(),
    ])
    res.json({ entries, total })
  } catch (err) { next(err) }
})

router.get('/user/:userId', async (req, res, next) => {
  try {
    const entries = await prisma.auditEntry.findMany({
      where: { userId: String(req.params.userId) },
      orderBy: { timestamp: 'desc' },
      take: 200,
    })
    res.json({ entries, total: entries.length })
  } catch (err) { next(err) }
})

export default router
