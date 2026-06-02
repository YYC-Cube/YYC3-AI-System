/**
 * @file WebSocketStatusPanel.tsx
 * @description YYC³便携式智能AI系统 - WebSocket状态面板组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,websocket,ui,realtime
 */

import * as LucideIcons from 'lucide-react'
import React, { useState, useEffect, useCallback } from 'react'

import { WebSocketService } from '../../services/websocket-service'
import type {
  WebSocketConnectionState,
  WebSocketStatistics,
  RetryStrategy,
} from '../../types/websocket'
import { WebSocketConnectionState as WSState, WebSocketEventType as WSEventType } from '../../types/websocket'

/**
 * WebSocket状态面板组件属性
 */
interface WebSocketStatusPanelProps {
  /** 是否显示详细信息 */
  showDetails?: boolean
  /** 是否可折叠 */
  collapsible?: boolean
  /** 自定义类名 */
  className?: string
}

/**
 * WebSocket状态面板组件
 * 实时显示WebSocket连接状态和统计信息
 */
export function WebSocketStatusPanel({
  showDetails = false,
  collapsible = true,
  className = '',
}: WebSocketStatusPanelProps) {
  const [state, setState] = useState<WebSocketConnectionState>(WSState.DISCONNECTED)
  const [statistics, setStatistics] = useState<WebSocketStatistics | null>(null)
  const [retryStrategy, setRetryStrategy] = useState<RetryStrategy | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(!showDetails)
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now())

  const wsService = WebSocketService.getInstance()
  const Icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>

  /**
   * 更新状态和统计
   */
  const updateState = useCallback(() => {
    setState(wsService.getState())
    setStatistics(wsService.getStatistics())
    setRetryStrategy(wsService.getRetryStrategy())
    setLastUpdated(Date.now())
  }, [wsService])

  /**
   * 手动连接
   */
  const handleConnect = useCallback(() => {
    wsService.connect()
  }, [wsService])

  /**
   * 手动断开
   */
  const handleDisconnect = useCallback(() => {
    wsService.disconnect()
  }, [wsService])

  /**
   * 初始化和事件监听
   */
  useEffect(() => {
    // 初始更新
    updateState()

    // 监听WebSocket事件
    const handleOpen = () => updateState()
    const handleClose = () => updateState()
    const handleError = () => updateState()
    const handleStateChange = () => updateState()
    const handleReconnectStart = () => updateState()
    const handleReconnectSuccess = () => updateState()
    const handleHeartbeatSend = () => updateState()
    const handleHeartbeatReceive = () => updateState()

    wsService.on(WSEventType.OPEN, handleOpen)
    wsService.on(WSEventType.CLOSE, handleClose)
    wsService.on(WSEventType.ERROR, handleError)
    wsService.on(WSEventType.STATE_CHANGE, handleStateChange)
    wsService.on(WSEventType.RECONNECT_START, handleReconnectStart)
    wsService.on(WSEventType.RECONNECT_SUCCESS, handleReconnectSuccess)
    wsService.on(WSEventType.HEARTBEAT_SEND, handleHeartbeatSend)
    wsService.on(WSEventType.HEARTBEAT_RECEIVE, handleHeartbeatReceive)

    // 定时更新状态
    const interval = setInterval(updateState, 5000)

    return () => {
      wsService.off(WSEventType.OPEN, handleOpen)
      wsService.off(WSEventType.CLOSE, handleClose)
      wsService.off(WSEventType.ERROR, handleError)
      wsService.off(WSEventType.STATE_CHANGE, handleStateChange)
      wsService.off(WSEventType.RECONNECT_START, handleReconnectStart)
      wsService.off(WSEventType.RECONNECT_SUCCESS, handleReconnectSuccess)
      wsService.off(WSEventType.HEARTBEAT_SEND, handleHeartbeatSend)
      wsService.off(WSEventType.HEARTBEAT_RECEIVE, handleHeartbeatReceive)
      clearInterval(interval)
    }
  }, [wsService, updateState])

  if (!statistics) {
    return null
  }

  const isConnected = state === WSState.CONNECTED
  const isConnecting = state === WSState.CONNECTING || state === WSState.RECONNECTING
  const hasError = state === WSState.ERROR

  /**
   * 获取状态颜色
   */
  const getStateColor = () => {
    switch (state) {
      case WSState.CONNECTED:
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
      case WSState.CONNECTING:
      case WSState.RECONNECTING:
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
      case WSState.DISCONNECTED:
      case WSState.CLOSED:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      case WSState.ERROR:
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  /**
   * 获取状态图标
   */
  const getStateIcon = () => {
    switch (state) {
      case WSState.CONNECTED:
        return Icons.Wifi
      case WSState.CONNECTING:
      case WSState.RECONNECTING:
        return Icons.Loader2
      case WSState.DISCONNECTED:
      case WSState.CLOSED:
        return Icons.WifiOff
      case WSState.ERROR:
        return Icons.AlertCircle
      default:
        return Icons.Wifi
    }
  }

  const StateIcon = getStateIcon()

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* 主状态栏 */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {/* 连接状态 */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getStateColor()}`}>
            <StateIcon className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">
              {state === WSState.CONNECTED && '已连接'}
              {state === WSState.CONNECTING && '连接中...'}
              {state === WSState.RECONNECTING && '重连中...'}
              {(state === WSState.DISCONNECTED || state === WSState.CLOSED) && '已断开'}
              {state === WSState.ERROR && '连接错误'}
            </span>
          </div>

          {/* 重连信息 */}
          {isConnecting && retryStrategy && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Icons.RefreshCw className="w-4 h-4 animate-spin" />
              <span>
                重连 {retryStrategy.currentAttempt}/{retryStrategy.nextRetryTime ? Math.ceil((retryStrategy.nextRetryTime - Date.now()) / 1000) : 0}s
              </span>
            </div>
          )}

          {/* 统计信息 */}
          {isConnected && (
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Icons.MessageSquare className="w-4 h-4" />
                <span>{statistics.messagesReceived} 消息</span>
              </div>
              <div className="flex items-center gap-1">
                <Icons.Activity className="w-4 h-4" />
                <span>{Math.round(statistics.averageMessageSize / 1024)} KB</span>
              </div>
            </div>
          )}

          {/* 错误信息 */}
          {hasError && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <Icons.AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {statistics.errorCount} 错误
              </span>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {!isConnected && (
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Icons.Plug className="w-4 h-4" />
              连接
            </button>
          )}

          {isConnected && (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Icons.Plug className="w-4 h-4" />
              断开
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
          {/* 连接统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icons.Clock className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  连接时长
                </span>
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {statistics.connectionTime > 0
                  ? Math.floor((Date.now() - statistics.connectionTime) / 60000)
                  : 0}
              </div>
              <div className="text-xs text-gray-500">分钟</div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icons.RefreshCw className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  重连次数
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {statistics.reconnectCount}
              </div>
              <div className="text-xs text-gray-500">次</div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icons.MessageSquare className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  消息收发
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {statistics.messagesSent + statistics.messagesReceived}
              </div>
              <div className="text-xs text-gray-500">条</div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icons.Database className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  数据传输
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {Math.round((statistics.bytesSent + statistics.bytesReceived) / 1024)}
              </div>
              <div className="text-xs text-gray-500">KB</div>
            </div>
          </div>

          {/* 详细统计 */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              详细统计
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">发送消息</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {statistics.messagesSent}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">接收消息</div>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {statistics.messagesReceived}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">发送字节</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {statistics.bytesSent}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">接收字节</div>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {statistics.bytesReceived}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">断开次数</div>
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {statistics.disconnectCount}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">错误次数</div>
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {statistics.errorCount}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">平均消息</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {Math.round(statistics.averageMessageSize / 1024)} KB
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">最后连接</div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white">
                  {statistics.lastConnectedTime > 0
                    ? new Date(statistics.lastConnectedTime).toLocaleString()
                    : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* 重连策略信息 */}
          {retryStrategy && !isConnected && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                重连策略
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">当前尝试</div>
                  <div className="text-amber-900 dark:text-amber-100">
                    {retryStrategy.currentAttempt}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">重试间隔</div>
                  <div className="text-amber-900 dark:text-amber-100">
                    {Math.round(retryStrategy.retryInterval / 1000)}s
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">下次重试</div>
                  <div className="text-amber-900 dark:text-amber-100">
                    {retryStrategy.nextRetryTime
                      ? `${Math.ceil((retryStrategy.nextRetryTime - Date.now()) / 1000)}s`
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">是否重试</div>
                  <div className={retryStrategy.shouldRetry ? 'text-green-600' : 'text-red-600'}>
                    {retryStrategy.shouldRetry ? '是' : '否'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 最后更新信息 */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>最后更新: {new Date(lastUpdated).toLocaleString()}</span>
            <span>
              更新: {Math.floor((Date.now() - lastUpdated) / 1000)}秒前
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
