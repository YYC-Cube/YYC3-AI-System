/**
 * @file ConflictResolutionDialog.tsx
 * @description YYC³便携式智能AI系统 - 冲突解决对话框组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,sync,conflict,ui
 */

import * as LucideIcons from 'lucide-react'
import React, { useState, useCallback, useEffect } from 'react'

import { ConflictResolutionService } from '../../services/conflict-resolution-service'
import { SyncQueueService } from '../../services/sync-queue-service'
import { SyncOperationStatus } from '../../types/sync'
import type { ConflictInfo } from '../../types/sync'

/**
 * 冲突解决对话框组件属性
 */
interface ConflictResolutionDialogProps {
  /** 冲突信息 */
  conflict: ConflictInfo
  /** 解决成功回调 */
  onResolved?: (resolvedData: Record<string, unknown>) => void
  /** 取消回调 */
  onCancelled?: () => void
  /** 是否显示 */
  open?: boolean
}

/**
 * 冲突解决对话框组件
 * 提供可视化的冲突解决界面
 */
export function ConflictResolutionDialog({
  conflict,
  onResolved,
  onCancelled,
  open = true,
}: ConflictResolutionDialogProps) {
  const [selectedResolution, setSelectedResolution] = useState<
    'local' | 'server' | 'merge'
  >(conflict.suggestedResolution)
  const [selectedStrategy, setSelectedStrategy] = useState<string>(
    conflict.suggestedResolution === 'merge' ? 'merge-version' : ''
  )
  const [diffView, setDiffView] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  const resolutionService = ConflictResolutionService.getInstance()
  const queueService = SyncQueueService.getInstance()

  // 获取可用的解决策略
  const availableStrategies = resolutionService.getAvailableResolutions(conflict.type)

  // 计算冲突差异
  const diff = resolutionService.getConflictDiff(
    conflict.localVersion.data,
    conflict.serverVersion.data
  )

  /**
   * 预览解决结果
   */
  const previewResolution = useCallback(() => {
    resolutionService
      .resolveConflict(conflict, selectedResolution, selectedStrategy)
      .then((data) => {
        setPreviewData(data)
      })
      .catch((error) => {
        console.error('预览解决结果失败:', error)
      })
  }, [conflict, selectedResolution, selectedStrategy, resolutionService])

  /**
   * 确认解决冲突
   */
  const handleResolve = useCallback(async () => {
    setIsResolving(true)
    try {
      const resolvedData = await resolutionService.resolveConflict(
        conflict,
        selectedResolution,
        selectedStrategy
      )

      // 更新队列中的操作
      const operation = queueService.getOperation(conflict.resourceId)
      if (operation) {
        operation.localData = resolvedData
        await queueService.updateOperationStatus(operation.id, SyncOperationStatus.SYNCING, { localData: resolvedData })
      }

      onResolved?.(resolvedData)
    } catch (error) {
      console.error('解决冲突失败:', error)
    } finally {
      setIsResolving(false)
    }
  }, [conflict, selectedResolution, selectedStrategy, resolutionService, queueService, onResolved])

  /**
   * 尝试自动解决
   */
  const handleAutoResolve = useCallback(async () => {
    if (!conflict.autoResolve) {
      return
    }

    setIsResolving(true)
    try {
      const resolvedData = await resolutionService.autoResolveConflict(conflict)

      // 更新队列中的操作
      const operation = queueService.getOperation(conflict.resourceId)
      if (operation) {
        operation.localData = resolvedData
        await queueService.updateOperationStatus(operation.id, SyncOperationStatus.SYNCING, { localData: resolvedData })
      }

      onResolved?.(resolvedData)
    } catch (error) {
      console.error('自动解决失败:', error)
    } finally {
      setIsResolving(false)
    }
  }, [conflict, resolutionService, queueService, onResolved])

  /**
   * 格式化数据展示
   */
  const formatData = (data: Record<string, unknown>): string => {
    return JSON.stringify(data, null, 2)
  }

  // 当选择变化时预览
  useEffect(() => {
    previewResolution()
  }, [selectedResolution, selectedStrategy, previewResolution])

  // 初始预览
  useEffect(() => {
    previewResolution()
  }, [])

  if (!open) {
    return null
  }

  const Icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
              <Icons.AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">冲突检测</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {conflict.description}
              </p>
            </div>
          </div>
          <button
            onClick={onCancelled}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Icons.X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 本地版本 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Icons.HardDrive className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">本地版本</span>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  v{conflict.localVersion.version}
                </span>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3 max-h-[300px] overflow-auto">
                <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
                  {formatData(conflict.localVersion.data)}
                </pre>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                更新时间: {new Date(conflict.localVersion.timestamp).toLocaleString()}
              </div>
            </div>

            {/* 服务器版本 */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <Icons.Cloud className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-900 dark:text-green-100">服务器版本</span>
                <span className="text-xs text-green-600 dark:text-green-400">
                  v{conflict.serverVersion.version}
                </span>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3 max-h-[300px] overflow-auto">
                <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
                  {formatData(conflict.serverVersion.data)}
                </pre>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                更新时间: {new Date(conflict.serverVersion.timestamp).toLocaleString()}
              </div>
            </div>
          </div>

          {/* 差异视图 */}
          {diffView && (
            <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">差异详情</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
                    删除 ({Object.keys(diff.removed).length})
                  </div>
                  <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                    {Object.keys(diff.removed).length > 0
                      ? formatData(diff.removed)
                      : '无'}
                  </pre>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">
                    新增 ({Object.keys(diff.added).length})
                  </div>
                  <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                    {Object.keys(diff.added).length > 0
                      ? formatData(diff.added)
                      : '无'}
                  </pre>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
                    修改 ({Object.keys(diff.modified).length})
                  </div>
                  <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                    {Object.keys(diff.modified).length > 0
                      ? formatData(diff.modified)
                      : '无'}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* 预览解决结果 */}
          {previewData && (
            <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-3">
                解决结果预览
              </h3>
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3 max-h-[200px] overflow-auto">
                <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
                  {formatData(previewData)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col gap-4">
            {/* 解决方式选择 */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">选择解决方式:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedResolution('local')
                    setDiffView(false)
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedResolution === 'local'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icons.HardDrive className="w-4 h-4 inline mr-1" />
                  保留本地
                </button>
                <button
                  onClick={() => {
                    setSelectedResolution('server')
                    setDiffView(false)
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedResolution === 'server'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icons.Cloud className="w-4 h-4 inline mr-1" />
                  保留服务器
                </button>
                <button
                  onClick={() => {
                    setSelectedResolution('merge')
                    setDiffView(false)
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedResolution === 'merge'
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icons.Merge className="w-4 h-4 inline mr-1" />
                  合并
                </button>
              </div>
            </div>

            {/* 合并策略选择 */}
            {selectedResolution === 'merge' && availableStrategies.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">合并策略:</span>
                <div className="flex gap-2 flex-wrap">
                  {availableStrategies.map((strategy) => (
                    <button
                      key={strategy.name}
                      onClick={() => setSelectedStrategy(strategy.name)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        selectedStrategy === strategy.name
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-2 border-purple-500'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-purple-300'
                      }`}
                    >
                      {strategy.description}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 底部按钮 */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setDiffView(!diffView)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
              >
                <Icons.Diff className="w-4 h-4" />
                {diffView ? '隐藏差异' : '查看差异'}
              </button>

              <div className="flex gap-3">
                {conflict.autoResolve && (
                  <button
                    onClick={handleAutoResolve}
                    disabled={isResolving}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Icons.Zap className="w-4 h-4" />
                    自动解决
                  </button>
                )}
                <button
                  onClick={onCancelled}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleResolve}
                  disabled={isResolving}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isResolving ? (
                    <>
                      <Icons.Loader2 className="w-4 h-4 animate-spin" />
                      解决中...
                    </>
                  ) : (
                    <>
                      <Icons.Check className="w-4 h-4" />
                      确认解决
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
