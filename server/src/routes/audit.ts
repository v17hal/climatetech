import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import { auditLog } from '../middleware/auditLog'

const router = Router()
router.use(authenticate)
router.use(requireRole('admin'))

router.get('/', (_req, res) => {
  res.json({ entries: auditLog, total: auditLog.length })
})

router.get('/user/:userId', (req, res) => {
  const entries = auditLog.filter((e) => e.userId === req.params.userId)
  res.json({ entries, total: entries.length })
})

export default router
