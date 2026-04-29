import { useState, useEffect, useCallback } from 'react'
import { getPendingCount, syncQueue } from '@/services/offlineQueue'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const { token } = useAuthStore()

  const refreshCount = useCallback(async () => {
    setPendingCount(await getPendingCount())
  }, [])

  const doSync = useCallback(async () => {
    if (!token || !isOnline || syncing) return
    setSyncing(true)
    const { synced, failed } = await syncQueue(token)
    await refreshCount()
    setSyncing(false)
    if (synced > 0) toast.success(`Synced ${synced} offline record${synced > 1 ? 's' : ''} successfully`)
    if (failed > 0) toast.error(`${failed} record${failed > 1 ? 's' : ''} failed to sync`)
  }, [token, isOnline, syncing, refreshCount])

  useEffect(() => {
    const goOnline = () => { setIsOnline(true); doSync() }
    const goOffline = () => setIsOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    /* Service worker sync message */
    const handleSWMessage = (e: MessageEvent) => {
      if (e.data?.type === 'SYNC_TRIGGERED') doSync()
    }
    navigator.serviceWorker?.addEventListener('message', handleSWMessage)

    refreshCount()

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage)
    }
  }, [doSync, refreshCount])

  /* Register service worker */
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* Silently ignore in dev if sw registration fails */
      })
    }
  }, [])

  return { isOnline, pendingCount, syncing, doSync, refreshCount }
}
