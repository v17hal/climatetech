import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth'
import farmerRoutes from './routes/farmers'
import carbonRoutes from './routes/carbon'
import dashboardRoutes from './routes/dashboard'
import alertRoutes from './routes/alerts'
import inventoryRoutes from './routes/inventory'
import auditRoutes from './routes/audit'
import { errorHandler } from './middleware/errorHandler'
import { auditMiddleware } from './middleware/auditLog'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(helmet())
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(morgan('dev'))
app.use(express.json())

/* Rate limiting */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again in 15 minutes' },
})
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts — please try again in 15 minutes' },
})

app.use('/api/', limiter)
app.use('/api/v1/auth/login', authLimiter)
app.use('/api/v1/auth/register', authLimiter)

/* Audit logging */
app.use(auditMiddleware)

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/farmers', farmerRoutes)
app.use('/api/v1/carbon', carbonRoutes)
app.use('/api/v1/dashboard', dashboardRoutes)
app.use('/api/v1/alerts', alertRoutes)
app.use('/api/v1/inventory', inventoryRoutes)
app.use('/api/v1/audit', auditRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CarbonSmart API', version: '1.0.0' })
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🌱 CarbonSmart API running on http://localhost:${PORT}`)
})

export default app
