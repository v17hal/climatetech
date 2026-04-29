import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { z } from 'zod'

const router = Router()

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(10),
  nationalId: z.string().min(6),
  farmName: z.string().min(2),
  farmSize: z.number().positive(),
  province: z.string().min(2),
  district: z.string().min(2),
  cropTypes: z.array(z.string()).default([]),
  farmingPractices: z.array(z.string()).default([]),
})

function generateFarmerId(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0')
  return `CSA-${year}-${rand}`
}

function signTokens(userId: string, role: string) {
  const access = jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '15m' })
  const refresh = jwt.sign({ userId, role }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' })
  return { access, refresh }
}

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body)
    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) { res.status(409).json({ error: 'Email already registered' }); return }

    const hashed = await bcrypt.hash(body.password, 12)
    const farmerId = generateFarmerId()

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashed,
        role: 'farmer',
        farmer: {
          create: {
            farmerId,
            phone: body.phone,
            nationalId: body.nationalId,
            farmName: body.farmName,
            farmSize: body.farmSize,
            province: body.province,
            district: body.district,
            cropTypes: body.cropTypes,
            farmingPractices: body.farmingPractices,
            status: 'pending',
          },
        },
      },
      include: { farmer: true },
    })

    const tokens = signTokens(user.id, user.role)
    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, farmerId },
      ...tokens,
    })
  } catch (err) { next(err) }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email }, include: { farmer: true } })
    if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) { res.status(401).json({ error: 'Invalid credentials' }); return }

    const tokens = signTokens(user.id, user.role)
    res.json({
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        farmerId: user.farmer?.farmerId,
      },
      ...tokens,
    })
  } catch (err) { next(err) }
})

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) { res.status(401).json({ error: 'No refresh token' }); return }
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string; role: string }
    const tokens = signTokens(payload.userId, payload.role)
    res.json(tokens)
  } catch (err) { next(err) }
})

export default router
