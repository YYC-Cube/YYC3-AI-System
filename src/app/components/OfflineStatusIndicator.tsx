/**
 * @file OfflineStatusIndicator.tsx
 * @description YYC³便携式智能AI系统 - 离线状态指示器组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,offline,indicator,ui
 */

import React, { useState, useEffect } from 'react'

import { OfflineDegradationService } from '../../services/offline-degradation-service'
import { OfflineEventType } from '../../types/offline'
import type {
  OfflineState,
  OfflineStatus,
  OfflineStatistics,
  NetworkQuality,
} from '../../types/offline'

/**
 * 离线状态指示器属性接口
 */
interface OfflineStatusIndicatorProps {
  /** 是否显示详细信息 */
  showDetails?: boolean
  /** 是否可点击展开 */
  clickable?: boolean
  /** 自定义类名 */
  className?: string
  /** 状态变化回调 */
  onStateChange?: (state: OfflineState) => void
}

/**
 * 离线状态指示器组件
 */
export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({
  showDetails = false,
  clickable = true,
  className = '',
  onStateChange,
}) => {
  const [offlineService] = useState(() =>
    OfflineDegradationService.getInstance(),
  )
  const [status, setStatus] = useState<OfflineStatus | null>(null)
  const [statistics, setStatistics] = useState<OfflineStatistics | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [_networkQuality, _setNetworkQuality] = useState<NetworkQuality | null>(
    null,
  )

  useEffect(() => {
    // 初始化服务
    offlineService.initialize()

    // 获取初始状态
    const initialStatus = offlineService.getOfflineStatus()
    const initialStatistics = offlineService.getStatistics()
    setStatus(initialStatus)
    setStatistics(initialStatistics)

    // 监听状态变化
    const handleStateChange = (data: any) => {
      const newStatus = offlineService.getOfflineStatus()
      const newStatistics = offlineService.getStatistics()

      setStatus(newStatus)
      setStatistics(newStatistics)

      if (onStateChange && data.newState) {
        onStateChange(data.newState)
      }
    }

    const events = [
      OfflineEventType.STATE_CHANGED,
      OfflineEventType.ONLINE,
      OfflineEventType.OFFLINE,
      OfflineEventType.DEGRADED,
      OfflineEventType.SYNC_START,
      OfflineEventType.SYNC_COMPLETE,
      OfflineEventType.SYNC_FAILED,
      OfflineEventType.OPERATION_QUEUED,
      OfflineEventType.OPERATION_SUCCESS,
      OfflineEventType.OPERATION_FAILED,
    ]
    events.forEach(e => offlineService.on(e, handleStateChange))

    // 定期更新状态
    const updateInterval = setInterval(() => {
      const currentStatus = offlineService.getOfflineStatus()
      const currentStatistics = offlineService.getStatistics()
      setStatus(currentStatus)
      setStatistics(currentStatistics)
    }, 5000)

    return () => {
      events.forEach(e => offlineService.off(e, handleStateChange))
      clearInterval(updateInterval)
    }
  }, [offlineService, onStateChange])

  // 获取状态颜色
  const getStatusColor = (state: OfflineState): string => {
    switch (state) {
      case 'online':
        return 'bg-green-500'
      case 'offline':
        return 'bg-red-500'
      case 'degraded':
      case 'syncing':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  // 获取状态文本
  const getStatusText = (state: OfflineState): string => {
    switch (state) {
      case 'online':
        return '在线'
      case 'offline':
        return '离线'
      case 'degraded':
        return '降级'
      case 'syncing':
        return '同步中'
      default:
        return '未知'
    }
  }

  // 获取状态图标
  const getStatusIcon = (state: OfflineState): string => {
    switch (state) {
      case 'online':
        return '✅'
      case 'offline':
        return '❌'
      case 'degraded':
        return '⚠️'
      case 'syncing':
        return '🔄'
      default:
        return '❓'
    }
  }

  // 格式化时间
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`
    } else {
      return `${seconds}秒`
    }
  }

  // 格式化时间戳
  const formatTimestamp = (timestamp?: number): string => {
    if (!timestamp) return '-'
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  }

  // 手动触发同步
  const handleSyncNow = async () => {
    try {
      await offlineService.syncNow()
    } catch (error) {
      console.error('同步失败:', error)
    }
  }

  // 清空队列
  const handleClearQueue = () => {
    offlineService.clearQueue()
  }

  if (!status) {
    return null
  }

  return (
    <div
      className={`offline-status-indicator ${className}`}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
      }}
    >
      {/* 状态指示器 */}
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg cursor-pointer transition-all hover:shadow-xl ${
          clickable ? 'bg-white' : ''
        }`}
        onClick={() => clickable && setExpanded(!expanded)}
      >
        {/* 状态点 */}
        <div
          className={`w-3 h-3 rounded-full ${getStatusColor(
            status.state,
          )} animate-pulse`}
        />

        {/* 状态图标和文本 */}
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon(status.state)}</span>
          <span className="font-medium text-gray-800">
            {getStatusText(status.state)}
          </span>
        </div>

        {/* 队列数量 */}
        {status.queuedOperations > 0 && (
          <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-yellow-100 rounded-full">
            <span className="text-xs text-yellow-800">队列</span>
            <span className="text-sm font-bold text-yellow-800">
              {status.queuedOperations}
            </span>
          </div>
        )}

        {/* 展开/收起图标 */}
        {clickable && (
          <div
            className={`transform transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        )}
      </div>

      {/* 详细信息面板 */}
      {(expanded || showDetails) && (
        <div className="mt-2 p-4 bg-white rounded-lg shadow-lg">
          {/* 状态信息 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">连接状态</span>
              <span className="text-sm font-bold text-gray-900">
                {status.isOnline ? '已连接' : '未连接'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">操作状态</span>
              <span className="text-sm font-bold text-gray-900">
                {getStatusText(status.state)}
              </span>
            </div>

            {/* 统计信息 */}
            {statistics && (
              <>
                <div className="border-t pt-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    统计信息
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">总离线时长:</span>
                      <span className="font-medium text-gray-900">
                        {formatDuration(statistics.totalOfflineTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">离线次数:</span>
                      <span className="font-medium text-gray-900">
                        {statistics.totalOfflineCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">总操作数:</span>
                      <span className="font-medium text-gray-900">
                        {statistics.totalQueueOperations}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">成功操作:</span>
                      <span className="font-medium text-green-600">
                        {statistics.successOperations}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">失败操作:</span>
                      <span className="font-medium text-red-600">
                        {statistics.failedOperations}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">当前队列:</span>
                      <span className="font-medium text-blue-600">
                        {statistics.currentQueueSize}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">平均队列:</span>
                      <span className="font-medium text-gray-900">
                        {statistics.averageQueueSize.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">最大队列:</span>
                      <span className="font-medium text-gray-900">
                        {statistics.maxQueueSize}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 时间信息 */}
                <div className="border-t pt-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    时间信息
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">最后离线:</span>
                      <span className="text-gray-900">
                        {formatTimestamp(statistics.lastOfflineTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">最后在线:</span>
                      <span className="text-gray-900">
                        {formatTimestamp(statistics.lastOnlineTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">最后同步:</span>
                      <span className="text-gray-900">
                        {formatTimestamp(statistics.lastSyncTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 操作按钮 */}
            <div className="border-t pt-3 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSyncNow()
                }}
                disabled={status.state !== 'online'}
                className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                立即同步
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClearQueue()
                }}
                disabled={status.queuedOperations === 0}
                className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                清空队列
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
