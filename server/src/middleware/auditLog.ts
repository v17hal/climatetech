import type { Response, NextFunction } from 'express'
import type { AuthRequest } from './auth'

export interface AuditEntry {
  id: string
  userId: string
  userRole: string
  action: string
  resource: string
  resourceId?: string
  method: string
  path: string
  statusCode: number
  ip: string
  timestamp: string
  durationMs: number
}

/* In-memory store for demo — replace with DB insert in production */
export const auditLog: AuditEntry[] = []

export function auditMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const start = Date.now()

  res.on('finish', () => {
    if (!req.userId) { next(); return }

    const ipAddress: string = Array.isArray(req.ip) ? req.ip[0] : (req.ip || 'unknown')
    const resourceId: string | undefined = Array.isArray(req.params?.id) ? req.params.id[0] : req.params?.id

    const entry: AuditEntry = {
      id: crypto.randomUUID(),
      userId: req.userId ?? 'anonymous',
      userRole: req.userRole ?? 'unknown',
      action: resolveAction(req.method, req.path),
      resource: resolveResource(req.path),
      resourceId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      ip: ipAddress,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
    }

    auditLog.unshift(entry)
    if (auditLog.length > 500) auditLog.pop()
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
