import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

/** Legacy role aliases kept for backwards compatibility with older tokens/UIs. */
const ROLE_ALIASES: Record<string, string> = {
  agri_officer: 'field_officer',
  viewer: 'vvb_auditor',
}

export function normalizeRole(role: string | undefined): string {
  if (!role) return ''
  return ROLE_ALIASES[role] ?? role
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    res.status(401).json({ error: 'No token provided' })
    return
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }
    req.userId = payload.userId
    req.userRole = normalizeRole(payload.role)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(...roles: string[]) {
  const allowed = roles.map(normalizeRole)
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !allowed.includes(req.userRole)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }
    next()
  }
}

/**
 * VVB Auditors have read-only access to everything: any mutating request
 * is blocked platform-wide, regardless of per-route role lists.
 */
export function enforceReadOnlyAuditor(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.userRole === 'vvb_auditor' && req.method !== 'GET') {
    res.status(403).json({ error: 'VVB Auditor access is strictly read-only' })
    return
  }
  next()
}
