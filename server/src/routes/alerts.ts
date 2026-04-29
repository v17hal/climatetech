import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (_req, res, next) => {
  try {
    const alerts = await prisma.alert.findMany({
      orderBy: { createdAt: 'desc' }, take: 50,
      include: { farmer: { select: { farmerId: true, farmName: true } } },
    })
    res.json(alerts)
  } catch (err) { next(err) }
})

router.patch('/:id/read', async (req, res, next) => {
  try {
    const alert = await prisma.alert.update({ where: { id: req.params.id }, data: { read: true } })
    res.json(alert)
  } catch (err) { next(err) }
})

export default router
