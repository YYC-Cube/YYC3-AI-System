/**
 * @file SyncStatusPanel.tsx
 * @description YYC³便携式智能AI系统 - 同步状态面板组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,sync,ui,offline
 */

import * as LucideIcons from 'lucide-react'
import React, { useState, useEffect, useCallback } from 'react'

import { SyncManagerService } from '../../services/sync-manager-service'
import { SyncEventType } from '../../types/sync'
import type { SyncStatus, SyncStatistics } from '../../types/sync'

/**
 * 同步状态面板组件属性
 */
interface SyncStatusPanelProps {
  /** 是否显示详细信息 */
  showDetails?: boolean
  /** 是否可折叠 */
  collapsible?: boolean
  /** 自定义类名 */
  className?: string
}

/**
 * 同步状态面板组件
 * 实时显示同步状态和统计信息
 */
export function SyncStatusPanel({
  showDetails = false,
  collapsible = true,
  className = '',
}: SyncStatusPanelProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [statistics, setStatistics] = useState<SyncStatistics | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(!showDetails)
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now())

  const syncManager = SyncManagerService.getInstance()
  const Icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>

  /**
   * 更新同步状态
   */
  const updateSyncStatus = useCallback(() => {
    const status = syncManager.getSyncStatus()
    const stats = syncManager.getStatistics()
    setSyncStatus(status)
    setStatistics(stats)
    setLastUpdated(Date.now())
  }, [syncManager])

  /**
   * 手动触发同步
   */
  const handleSyncNow = useCallback(() => {
    syncManager.syncNow()
  }, [syncManager])

  /**
   * 初始化和事件监听
   */
  useEffect(() => {
    // 初始更新
    updateSyncStatus()

    // 监听同步事件
    const syncEvents = [
      SyncEventType.SYNC_START,
      SyncEventType.SYNC_COMPLETE,
      SyncEventType.SYNC_ERROR,
      SyncEventType.OPERATION_STARTED,
      SyncEventType.OPERATION_COMPLETED,
      SyncEventType.ONLINE_STATUS_CHANGED,
    ]
    const handleSyncEvent = () => { updateSyncStatus() }
    syncEvents.forEach(e => syncManager.on(e, handleSyncEvent))

    // 定时更新状态
    const interval = setInterval(updateSyncStatus, 5000)

    return () => {
      syncEvents.forEach(e => syncManager.off(e, handleSyncEvent))
      clearInterval(interval)
    }
  }, [syncManager, updateSyncStatus])

  if (!syncStatus || !statistics) {
    return null
  }

  const isOnline = syncStatus.isOnline
  const isSyncing = syncStatus.isSyncing
  const pendingCount = syncStatus.pendingCount
  const failedCount = syncStatus.failedCount
  const conflictCount = syncStatus.conflictCount

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* 主状态栏 */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {/* 在线状态 */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              isOnline
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
            }`}
          >
            <Icons.Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isOnline ? '在线' : '离线'}
            </span>
          </div>

          {/* 同步状态 */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              isSyncing
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : pendingCount === 0
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
            }`}
          >
            {isSyncing ? (
              <>
                <Icons.Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">同步中...</span>
              </>
            ) : pendingCount === 0 ? (
              <>
                <Icons.CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">已同步</span>
              </>
            ) : (
              <>
                <Icons.Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{pendingCount} 待同步</span>
              </>
            )}
          </div>

          {/* 冲突和失败提示 */}
          {(conflictCount > 0 || failedCount > 0) && (
            <div className="flex items-center gap-2">
              {conflictCount > 0 && (
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <Icons.AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">{conflictCount} 冲突</span>
                </div>
              )}
              {failedCount > 0 && (
                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                  <Icons.XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{failedCount} 失败</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {isOnline && !isSyncing && pendingCount > 0 && (
            <button
              onClick={handleSyncNow}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Icons.RefreshCw className="w-4 h-4" />
              立即同步
            </button>
          )}

          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isCollapsed ? (
                <Icons.ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <Icons.ChevronUp className="w-5 h-5 text-gray-500" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* 详细信息 */}
      {!isCollapsed && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icons.Database className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">总同步</span>
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {statistics.totalSyncs}
              </div>
              <div className="text-xs text-gray-500">次</div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icons.CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">成功</span>
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {statistics.successCount}
              </div>
              <div className="text-xs text-gray-500">次</div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icons.XCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">失败</span>
              </div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                {statistics.failureCount}
              </div>
              <div className="text-xs text-gray-500">次</div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icons.Clock className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">平均耗时</span>
              </div>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {Math.round(statistics.averageSyncTime)}
              </div>
              <div className="text-xs text-gray-500">ms</div>
            </div>
          </div>

          {/* 队列详情 */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              操作队列详情
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">待同步</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {pendingCount}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">同步中</div>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {syncStatus.isSyncing ? '1' : '0'}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">冲突</div>
                <div className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                  {conflictCount}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">失败</div>
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {failedCount}
                </div>
              </div>
            </div>
          </div>

          {/* 最近同步信息 */}
          {syncStatus.lastSyncTime > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>最后同步: {new Date(syncStatus.lastSyncTime).toLocaleString()}</span>
              <span>
                更新: {Math.floor((Date.now() - lastUpdated) / 1000)}秒前
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
