import { openDB, type IDBPDatabase } from 'idb'

interface QueuedRequest {
  id: string
  url: string
  method: string
  body: unknown
  headers: Record<string, string>
  queuedAt: string
  retries: number
  description: string
}

const DB_NAME = 'carbonsmart-offline'
const STORE = 'queue'
const DB_VERSION = 1

let db: IDBPDatabase | null = null

async function getDB() {
  if (db) return db
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: 'id' })
      }
    },
  })
  return db
}

export async function enqueue(request: Omit<QueuedRequest, 'id' | 'queuedAt' | 'retries'>): Promise<void> {
  const store = await getDB()
  await store.put(STORE, {
    ...request,
    id: crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
    retries: 0,
  })
}

export async function getPendingCount(): Promise<number> {
  const store = await getDB()
  return store.count(STORE)
}

export async function getQueue(): Promise<QueuedRequest[]> {
  const store = await getDB()
  return store.getAll(STORE)
}

export async function removeFromQueue(id: string): Promise<void> {
  const store = await getDB()
  await store.delete(STORE, id)
}

export async function clearQueue(): Promise<void> {
  const store = await getDB()
  await store.clear(STORE)
}

export async function syncQueue(token: string): Promise<{ synced: number; failed: number }> {
  const queue = await getQueue()
  let synced = 0, failed = 0

  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...item.headers },
        body: item.method !== 'GET' ? JSON.stringify(item.body) : undefined,
      })
      if (res.ok) {
        await removeFromQueue(item.id)
        synced++
      } else {
        failed++
      }
    } catch {
      failed++
    }
  }
  return { synced, failed }
}
