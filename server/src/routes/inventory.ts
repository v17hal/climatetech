import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/farmer/:farmerId', async (req, res, next) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: { farmerId: req.params.farmerId },
      orderBy: { name: 'asc' },
    })
    res.json(items)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const item = await prisma.inventoryItem.create({ data: req.body })
    res.status(201).json(item)
  } catch (err) { next(err) }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const item = await prisma.inventoryItem.update({ where: { id: req.params.id }, data: req.body })
    res.json(item)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.inventoryItem.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) { next(err) }
})

export default router
