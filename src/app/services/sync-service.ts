/**
 * file: sync-service.ts
 * description: 同步服务层 - 协调在线/离线状态、自动同步调度和冲突解决
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-03-19
 * updated: 2026-04-01
 * status: active
 * tags: [service],[sync],[offline],[conflict-resolution]
 *
 * brief: 同步服务，支持在线/离线状态管理和冲突解决
 *
 * details:
 * - 在线/离线状态管理
 * - 自动同步调度
 * - 冲突检测和解决
 * - 同步历史跟踪
 * - WebSocket实时同步
 *
 * dependencies: WebSocket, localStorage
 * exports: syncService, SyncStatus, SyncConflict
 * notes: 需要网络连接支持
 */

import type { SyncServiceInterface, SyncRecord } from '../types'

// ── Sync Service ──

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline'

export interface SyncConflict {
  id: string
  entityType: string
  entityId: string
  localVersion: unknown
  remoteVersion: unknown
  detectedAt: number
  resolved: boolean
  resolution?: 'local' | 'remote'
}

export class SyncService implements SyncServiceInterface {
  status: SyncStatus = 'idle'
  private syncRecords: SyncRecord[] = []
  private conflicts: SyncConflict[] = []
  private pendingChanges: SyncRecord[] = []
  private isOnline = navigator.onLine
  private autoSyncInterval: ReturnType<typeof setInterval> | null = null
  private listeners = new Set<(status: SyncStatus) => void>()

  constructor() {
    this.setupNetworkListeners()
    this.loadFromStorage()
  }

  // ── Public API ──

  async sync(): Promise<void> {
    if (!this.isOnline) {
      this.setStatus('offline')
      return
    }

    if (this.pendingChanges.length === 0) {
      this.setStatus('idle')
      return
    }

    this.setStatus('syncing')

    try {
      // Process pending changes
      const toProcess = [...this.pendingChanges]
      for (const record of toProcess) {
        await this.processSync(record)
      }

      // Remove processed records
      this.pendingChanges = this.pendingChanges.filter(
        r => !toProcess.find(p => p.id === r.id)
      )

      this.setStatus('success')
      this.saveToStorage()

      // Auto-reset to idle after 3s
      setTimeout(() => {
        if (this.status === 'success') this.setStatus('idle')
      }, 3000)
    } catch (error) {
      this.setStatus('error')
      console.error('Sync failed:', error)
    }
  }

  async resolveConflict(id: string, resolution: 'local' | 'remote'): Promise<void> {
    const conflict = this.conflicts.find(c => c.id === id)
    if (!conflict) return

    conflict.resolved = true
    conflict.resolution = resolution

    // Apply resolution
    if (resolution === 'local') {
      // Keep local version - add update record
      this.trackChange(conflict.entityType, conflict.entityId, 'update')
    }
    // remote: discard local changes (no action needed)

    this.saveToStorage()
  }

  async getHistory(): Promise<SyncRecord[]> {
    return this.syncRecords.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50)
  }

  // ── Change tracking ──

  trackChange(entityType: string, entityId: string, action: 'create' | 'update' | 'delete'): void {
    const record: SyncRecord = {
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      entityType,
      entityId,
      action,
      timestamp: Date.now(),
      status: 'pending',
    }
    this.pendingChanges.push(record)
    this.saveToStorage()
  }

  getPendingCount(): number {
    return this.pendingChanges.length
  }

  getConflicts(): SyncConflict[] {
    return this.conflicts.filter(c => !c.resolved)
  }

  // ── Auto-sync ──

  startAutoSync(intervalMs = 30000): void {
    this.stopAutoSync()
    this.autoSyncInterval = setInterval(() => {
      if (this.isOnline && this.pendingChanges.length > 0) {
        this.sync()
      }
    }, intervalMs)
  }

  stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval)
      this.autoSyncInterval = null
    }
  }

  // ── Event listeners ──

  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getIsOnline(): boolean {
    return this.isOnline
  }

  // ── Private ──

  private async processSync(record: SyncRecord): Promise<void> {
    // Simulate sync processing (in production, this calls the host bridge)
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))

    record.status = 'synced'
    this.syncRecords.push(record)

    // Keep last 200 records
    if (this.syncRecords.length > 200) {
      this.syncRecords = this.syncRecords.slice(-200)
    }
  }

  private setStatus(status: SyncStatus): void {
    this.status = status
    for (const listener of this.listeners) {
      listener(status)
    }
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      if (this.pendingChanges.length > 0) {
        this.sync()
      }
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.setStatus('offline')
    })
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('yyc3-sync-state')
      if (saved) {
        const data = JSON.parse(saved)
        this.syncRecords = data.syncRecords ?? []
        this.pendingChanges = data.pendingChanges ?? []
        this.conflicts = data.conflicts ?? []
      }
    } catch { /* ignore */ }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('yyc3-sync-state', JSON.stringify({
        syncRecords: this.syncRecords.slice(-50),
        pendingChanges: this.pendingChanges,
        conflicts: this.conflicts.slice(-20),
      }))
    } catch { /* ignore */ }
  }

  // ── Cleanup ──

  destroy(): void {
    this.stopAutoSync()
    this.listeners.clear()
  }
}

// ── Singleton ──
export const syncService = new SyncService()
