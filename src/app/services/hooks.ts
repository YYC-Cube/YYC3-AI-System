/**
 * @file hooks.ts
 * @description YYC³便携式智能AI系统 - 服务层React Hooks
 * Service Layer React Hooks
 * Provides React hooks to access service singletons with proper lifecycle.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,hooks,react
 */

import { useState, useEffect, useCallback, useRef } from 'react'

import type { AIProviderConfig, AIPerformanceMetrics, AIErrorAnalysis } from '../types'

import { aiProviderService } from './ai-provider'
import { storageService } from './storage-service'
import { syncService, type SyncStatus } from './sync-service'

// ── AI Provider Hook ──

export function useAIProvider() {
  const [providers, setProviders] = useState<AIProviderConfig[]>([])
  const [metrics, setMetrics] = useState<AIPerformanceMetrics[]>([])
  const [errors, setErrors] = useState<AIErrorAnalysis[]>([])

  const refresh = useCallback(() => {
    setProviders(aiProviderService.listProviders())
    setMetrics(aiProviderService.getPerformanceMetrics())
    setErrors(aiProviderService.getErrorHistory())
    // Sync to appStore mirror
    aiProviderService.syncToAppStore()
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  return {
    service: aiProviderService,
    providers,
    metrics,
    errors,
    costReport: aiProviderService.getCostReport(),
    refresh,
    addProvider: (p: AIProviderConfig) => { aiProviderService.addProvider(p); refresh() },
    removeProvider: (id: string) => { aiProviderService.removeProvider(id); refresh() },
    setApiKey: (id: string, key: string) => { aiProviderService.setApiKey(id, key); refresh() },
    setActiveProvider: (id: string) => { aiProviderService.setActiveProvider(id); refresh() },
    setActiveModel: (id: string) => { aiProviderService.setActiveModel(id); refresh() },
    detectBest: () => aiProviderService.detectBestProvider(),
    // New: direct model access
    getAllModels: () => aiProviderService.getAllModels(),
    getModelById: (id: string) => aiProviderService.getModelById(id),
  }
}

// ── Storage Hook ──

export function useStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    storageService.get<T>(key).then(stored => {
      if (mountedRef.current) {
        if (stored !== null) setValue(stored)
        setLoading(false)
      }
    })
    return () => { mountedRef.current = false }
  }, [key])

  const update = useCallback(async (newValue: T) => {
    setValue(newValue)
    await storageService.set(key, newValue)
  }, [key])

  const remove = useCallback(async () => {
    setValue(defaultValue)
    await storageService.delete(key)
  }, [key, defaultValue])

  return { value, update, remove, loading }
}

// ── Sync Hook ──

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>(syncService.status)
  const [pendingCount, setPendingCount] = useState(syncService.getPendingCount())
  const [isOnline, setIsOnline] = useState(syncService.getIsOnline())

  useEffect(() => {
    const unsubscribe = syncService.onStatusChange((newStatus) => {
      setStatus(newStatus)
      setPendingCount(syncService.getPendingCount())
      setIsOnline(syncService.getIsOnline())
    })

    const onlineHandler = () => setIsOnline(true)
    const offlineHandler = () => setIsOnline(false)
    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)

    return () => {
      unsubscribe()
      window.removeEventListener('online', onlineHandler)
      window.removeEventListener('offline', offlineHandler)
    }
  }, [])

  return {
    service: syncService,
    status,
    pendingCount,
    isOnline,
    sync: () => syncService.sync(),
    trackChange: (type: string, id: string, action: 'create' | 'update' | 'delete') =>
      syncService.trackChange(type, id, action),
    conflicts: syncService.getConflicts(),
    resolveConflict: (id: string, resolution: 'local' | 'remote') =>
      syncService.resolveConflict(id, resolution),
  }
}

// ── File Version Hook ──

export function useFileVersions(path: string | null) {
  const [versions, setVersions] = useState<Awaited<ReturnType<typeof storageService.getVersions>>>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!path) { setVersions([]); return }
    setLoading(true)
    const v = await storageService.getVersions(path)
    setVersions(v)
    setLoading(false)
  }, [path])

  useEffect(() => { refresh() }, [refresh])

  return { versions, loading, refresh }
}

// ── Preview Snapshots Hook ──

export function usePreviewSnapshots() {
  const [snapshots, setSnapshots] = useState<Awaited<ReturnType<typeof storageService.getSnapshots>>>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const s = await storageService.getSnapshots()
    setSnapshots(s)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const deleteSnapshot = useCallback(async (id: string) => {
    await storageService.deleteSnapshot(id)
    refresh()
  }, [refresh])

  return { snapshots, loading, refresh, deleteSnapshot }
}
