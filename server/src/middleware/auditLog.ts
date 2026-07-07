import type { Response, NextFunction } from 'express'
import type { AuthRequest } from './auth'
import { prisma } from '../lib/prisma'

/**
 * Persists every authenticated request to the AuditEntry table so the
 * trail survives restarts and is queryable by VVB auditors.
 */
export function auditMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const start = Date.now()

  res.on('finish', () => {
    if (!req.userId) return

    prisma.auditEntry
      .create({
        data: {
          userId: req.userId,
          userRole: req.userRole ?? 'unknown',
          action: resolveAction(req.method, req.path),
          resource: resolveResource(req.path),
          resourceId: req.params?.id ? String(req.params.id) : undefined,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          ip: req.ip ?? 'unknown',
          durationMs: Date.now() - start,
        },
      })
      .catch((err) => console.error('Audit write failed:', err))
  })

  next()
}

function resolveAction(method: string, path: string): string {
  if (method === 'GET') return 'view'
  if (method === 'POST') return path.includes('login') ? 'login' : path.includes('register') ? 'register' : 'create'
  if (method === 'PUT' || method === 'PATCH') return 'update'
  if (method === 'DELETE') return 'delete'
  return 'action'
}

function resolveResource(path: string): string {
  const parts = path.split('/').filter(Boolean)
  return parts[2] ?? parts[1] ?? 'unknown'
}
