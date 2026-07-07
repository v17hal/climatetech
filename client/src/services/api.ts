import { useAuthStore } from '@/store/authStore'
import { enqueue } from '@/services/offlineQueue'

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

/** Thrown when a mutation was queued to IndexedDB because the API is unreachable. */
export class OfflineQueuedError extends Error {
  constructor() {
    super('Saved offline — will sync when connection returns')
  }
}

let refreshing: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState()
  if (!refreshToken) return false
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) { logout(); return false }
      const data = await res.json()
      setTokens(data.access, data.refresh)
      return true
    } catch {
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

interface RequestOptions {
  /** Queue the request offline if the network is down (mutations only). */
  offlineQueue?: boolean
  description?: string
}

async function requestRaw(method: string, path: string, body?: unknown, retry = true): Promise<Response> {
  const token = useAuthStore.getState().token
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(isForm ? {} : body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401 && retry && (await tryRefresh())) {
    return requestRaw(method, path, body, false)
  }
  return res
}

async function request<T>(method: string, path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
  let res: Response
  try {
    res = await requestRaw(method, path, body)
  } catch (err) {
    /* Network failure — queue mutations for background sync if asked */
    if (opts.offlineQueue && method !== 'GET' && !(body instanceof FormData)) {
      await enqueue({
        url: `${API_BASE}${path}`,
        method,
        body,
        headers: {},
        description: opts.description ?? `${method} ${path}`,
      })
      throw new OfflineQueuedError()
    }
    throw err
  }

  if (!res.ok) {
    let payload: { error?: string } = {}
    try { payload = await res.json() } catch { /* non-JSON error body */ }
    throw new ApiError(res.status, payload.error ?? `Request failed (${res.status})`, payload)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', path, body, opts),
  delete: <T>(path: string) => request<T>('DELETE', path),
  /** Multipart upload (field photos, lab certificates). */
  upload: <T>(path: string, form: FormData) => request<T>('POST', path, form),
}

/** Resolve a server-stored file path (e.g. /uploads/…) to a full URL. */
export function fileUrl(path: string): string {
  return path.startsWith('http') ? path : `${API_BASE}${path}`
}
