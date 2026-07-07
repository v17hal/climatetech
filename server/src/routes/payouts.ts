import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

/* Farmer sees their own payout ledger; staff see any farmer's. */
router.get('/farmer/:farmerId', async (req: AuthRequest, res, next) => {
  try {
    const farmer = await prisma.farmer.findUnique({ where: { id: String(req.params.farmerId) } })
    if (!farmer) { res.status(404).json({ error: 'Farmer not found' }); return }

    if (req.userRole === 'farmer' && farmer.userId !== req.userId) {
      res.status(403).json({ error: 'Farmers may only view their own payout ledger' })
      return
    }

    const payouts = await prisma.payout.findMany({
      where: { farmerId: farmer.id },
      orderBy: { date: 'desc' },
    })
    const totalEarned = payouts.reduce((s, p) => s + p.amount, 0)
    res.json({ payouts, totalEarned })
  } catch (err) { next(err) }
})

const payoutSchema = z.object({
  farmerId: z.string().min(1),
  date: z.coerce.date(),
  amount: z.number().positive(),
  currency: z.string().default('ZAR'),
  type: z.enum(['payment', 'discount']).default('payment'),
  description: z.string().min(2),
})

/* Reward distributions are admin-recorded. */
router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const body = payoutSchema.parse(req.body)
    const payout = await prisma.payout.create({ data: body })
    res.status(201).json(payout)
  } catch (err) { next(err) }
})

export default router
