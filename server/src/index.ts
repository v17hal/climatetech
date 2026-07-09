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
import biocharRoutes from './routes/biochar'
import sampleRoutes from './routes/samples'
import evidenceRoutes, { UPLOADS_ROOT } from './routes/evidence'
import harvestRoutes from './routes/harvests'
import seasonalityRoutes from './routes/seasonality'
import payoutRoutes from './routes/payouts'
import impactRoutes from './routes/impact'
import passportRoutes from './routes/passport'
import { errorHandler } from './middleware/errorHandler'
import { auditMiddleware } from './middleware/auditLog'
import { authenticate, enforceReadOnlyAuditor } from './middleware/auth'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true }))
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'))
app.use(express.json())

/* Rate limiting */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again in 15 minutes' },
  skip: () => process.env.NODE_ENV === 'test',
})
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Configurable — kept generous for demo/QA (many logins across 5 roles).
  // Tighten via AUTH_RATE_LIMIT for production.
  max: Number(process.env.AUTH_RATE_LIMIT ?? 200),
  message: { error: 'Too many auth attempts — please try again in 15 minutes' },
  skip: () => process.env.NODE_ENV === 'test',
})

app.use('/api/', limiter)
app.use('/api/v1/auth/login', authLimiter)
app.use('/api/v1/auth/register', authLimiter)

/* Audit logging (persisted to DB) */
app.use(auditMiddleware)

/* Public routes — no auth: login/register + the Sustainable Farm Passport */
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/passport', passportRoutes)

/* VVB Auditor accounts are read-only platform-wide */
const guarded = [authenticate, enforceReadOnlyAuditor]

app.use('/api/v1/farmers', guarded, farmerRoutes)
app.use('/api/v1/carbon', guarded, carbonRoutes)
app.use('/api/v1/dashboard', guarded, dashboardRoutes)
app.use('/api/v1/alerts', guarded, alertRoutes)
app.use('/api/v1/inventory', guarded, inventoryRoutes)
app.use('/api/v1/audit', guarded, auditRoutes)
app.use('/api/v1/biochar', guarded, biocharRoutes)
app.use('/api/v1/samples', guarded, sampleRoutes)
app.use('/api/v1/evidence', guarded, evidenceRoutes)
app.use('/api/v1/harvests', guarded, harvestRoutes)
app.use('/api/v1/seasonality', guarded, seasonalityRoutes)
app.use('/api/v1/payouts', guarded, payoutRoutes)
app.use('/api/v1/impact', guarded, impactRoutes)

/* Uploaded evidence files (photos, lab certificates) */
app.use('/uploads', express.static(UPLOADS_ROOT))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CarbonSmart API', version: '2.0.0' })
})

app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🌱 CarbonSmart API running on http://localhost:${PORT}`)
  })
}

export default app
