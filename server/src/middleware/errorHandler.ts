import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: 'Validation failed',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    })
    return
  }

  /* Prisma known request errors → client-safe messages */
  const code = (err as { code?: string }).code
  if (code === 'P2002') {
    res.status(409).json({ error: 'A record with this unique value already exists' })
    return
  }
  if (code === 'P2025') {
    res.status(404).json({ error: 'Record not found' })
    return
  }

  console.error(err.stack)
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  res.status(500).json({ error: 'Internal server error', message })
}
