/**
 * @file workflow-visualization.ts
 * @description YYC³ 工作流可视化 - 监控与日志追踪
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [workflow],[visualization],[monitoring],[logging],[metrics]
 *
 * @brief 工作流可视化，实现监控与日志追踪
 *
 * @details
 * - 实时监控
 * - 日志追踪
 * - 性能指标
 * - 执行统计
 * - 可视化数据
 */

import type { WorkflowDefinition, WorkflowNode, WorkflowEdge, NodeStatus } from './workflow-definition'
import type { ExecutionContext, ExecutionLog, ExecutionSnapshot } from './workflow-executor'

export interface WorkflowMetrics {
  workflowId: string
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageDuration: number
  minDuration: number
  maxDuration: number
  lastExecutionTime: number | null
  nodeMetrics: Map<string, NodeMetrics>
}

export interface NodeMetrics {
  nodeId: string
  nodeName: string
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageDuration: number
  errorRate: number
}

export interface ExecutionTimeline {
  executionId: string
  startTime: number
  endTime: number | null
  duration: number | null
  status: string
  nodes: TimelineNode[]
}

export interface TimelineNode {
  nodeId: string
  nodeName: string
  startTime: number | null
  endTime: number | null
  duration: number | null
  status: NodeStatus
}

export interface LogFilter {
  executionId?: string
  nodeId?: string
  level?: ExecutionLog['level'] | ExecutionLog['level'][]
  startTime?: number
  endTime?: number
  search?: string
  limit?: number
}

export interface VisualizationData {
  nodes: VisualizationNode[]
  edges: VisualizationEdge[]
  layout: LayoutConfig
}

export interface VisualizationNode {
  id: string
  type: string
  name: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  status: NodeStatus
  progress: number
  metrics?: NodeMetrics
  error?: string
}

export interface VisualizationEdge {
  id: string
  source: string
  target: string
  type: string
  animated: boolean
  status: 'idle' | 'active' | 'completed'
}

export interface LayoutConfig {
  type: 'dagre' | 'elk' | 'force' | 'manual'
  direction: 'TB' | 'LR' | 'BT' | 'RL'
  nodeSpacing: number
  rankSpacing: number
}

export interface WorkflowMonitor {
  workflowId: string
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed'
  currentExecutionId: string | null
  progress: number
  activeNodes: string[]
  completedNodes: string[]
  failedNodes: string[]
  startTime: number | null
  elapsedTime: number | null
  estimatedTimeRemaining: number | null
}

type MonitorEventHandler = (event: MonitorEvent) => void | Promise<void>

export interface MonitorEvent {
  type: string
  workflowId: string
  executionId?: string
  nodeId?: string
  timestamp: number
  data?: unknown
}

class WorkflowVisualizationService {
  private metrics: Map<string, WorkflowMetrics> = new Map()
  private monitors: Map<string, WorkflowMonitor> = new Map()
  private eventHandlers: Map<string, Set<MonitorEventHandler>> = new Map()
  private logStore: ExecutionLog[] = []
  private maxLogs = 10000

  calculateMetrics(workflowId: string, snapshots: ExecutionSnapshot[]): WorkflowMetrics {
    const workflowSnapshots = snapshots.filter((s) => s.workflowId === workflowId)

    const metrics: WorkflowMetrics = {
      workflowId,
      totalExecutions: workflowSnapshots.length,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      lastExecutionTime: null,
      nodeMetrics: new Map(),
    }

    let totalDuration = 0

    for (const snapshot of workflowSnapshots) {
      const duration = snapshot.context.status === 'completed' || snapshot.context.status === 'failed'
        ? snapshot.createdAt - snapshot.context.startTime
        : 0

      if (snapshot.context.status === 'completed') {
        metrics.successfulExecutions++
        totalDuration += duration
        metrics.minDuration = Math.min(metrics.minDuration, duration)
        metrics.maxDuration = Math.max(metrics.maxDuration, duration)
      } else if (snapshot.context.status === 'failed') {
        metrics.failedExecutions++
      }

      if (!metrics.lastExecutionTime || snapshot.createdAt > metrics.lastExecutionTime) {
        metrics.lastExecutionTime = snapshot.createdAt
      }

      for (const node of snapshot.workflowDefinition.nodes) {
        if (!metrics.nodeMetrics.has(node.id)) {
          metrics.nodeMetrics.set(node.id, {
            nodeId: node.id,
            nodeName: node.name,
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            averageDuration: 0,
            errorRate: 0,
          })
        }

        const nodeMetrics = metrics.nodeMetrics.get(node.id)!
        nodeMetrics.totalExecutions++

        if (node.status === 'completed') {
          nodeMetrics.successfulExecutions++
        } else if (node.status === 'failed') {
          nodeMetrics.failedExecutions++
        }

        nodeMetrics.errorRate = nodeMetrics.totalExecutions > 0
          ? nodeMetrics.failedExecutions / nodeMetrics.totalExecutions
          : 0
      }
    }

    metrics.averageDuration = metrics.successfulExecutions > 0
      ? totalDuration / metrics.successfulExecutions
      : 0

    this.metrics.set(workflowId, metrics)
    return metrics
  }

  getMetrics(workflowId: string): WorkflowMetrics | undefined {
    return this.metrics.get(workflowId)
  }

  createMonitor(workflowId: string, _definition: WorkflowDefinition): WorkflowMonitor {
    const monitor: WorkflowMonitor = {
      workflowId,
      status: 'idle',
      currentExecutionId: null,
      progress: 0,
      activeNodes: [],
      completedNodes: [],
      failedNodes: [],
      startTime: null,
      elapsedTime: null,
      estimatedTimeRemaining: null,
    }

    this.monitors.set(workflowId, monitor)
    return monitor
  }

  updateMonitor(workflowId: string, context: ExecutionContext, definition: WorkflowDefinition): WorkflowMonitor {
    const monitor = this.monitors.get(workflowId) || this.createMonitor(workflowId, definition)

    monitor.currentExecutionId = context.executionId
    monitor.status = context.status as WorkflowMonitor['status']
    monitor.startTime = context.startTime
    monitor.elapsedTime = Date.now() - context.startTime

    monitor.activeNodes = []
    monitor.completedNodes = []
    monitor.failedNodes = []

    let completedCount = 0
    const totalNodes = definition.nodes.length

    for (const node of definition.nodes) {
      if (node.status === 'running') {
        monitor.activeNodes.push(node.id)
      } else if (node.status === 'completed') {
        monitor.completedNodes.push(node.id)
        completedCount++
      } else if (node.status === 'failed') {
        monitor.failedNodes.push(node.id)
        completedCount++
      }
    }

    monitor.progress = totalNodes > 0 ? (completedCount / totalNodes) * 100 : 0

    const metrics = this.metrics.get(workflowId)
    if (metrics && metrics.averageDuration > 0) {
      const expectedTotal = metrics.averageDuration
      const remaining = expectedTotal - (monitor.elapsedTime || 0)
      monitor.estimatedTimeRemaining = remaining > 0 ? remaining : 0
    }

    this.monitors.set(workflowId, monitor)
    this.emit('monitor:updated', { workflowId, monitor })

    return monitor
  }

  getMonitor(workflowId: string): WorkflowMonitor | undefined {
    return this.monitors.get(workflowId)
  }

  generateVisualization(
    definition: WorkflowDefinition,
    context?: ExecutionContext
  ): VisualizationData {
    const nodes: VisualizationNode[] = definition.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      name: node.name,
      position: node.position,
      size: this.calculateNodeSize(node),
      status: node.status,
      progress: this.calculateNodeProgress(node, context),
      metrics: this.metrics.get(definition.id)?.nodeMetrics.get(node.id),
      error: node.error,
    }))

    const edges: VisualizationEdge[] = definition.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      animated: this.isEdgeActive(edge, context),
      status: this.getEdgeStatus(edge, definition, context),
    }))

    return {
      nodes,
      edges,
      layout: {
        type: 'dagre',
        direction: 'LR',
        nodeSpacing: 50,
        rankSpacing: 100,
      },
    }
  }

  private calculateNodeSize(node: WorkflowNode): { width: number; height: number } {
    const baseWidth = 150
    const baseHeight = 80

    const inputCount = node.inputs.length
    const outputCount = node.outputs.length

    const width = baseWidth + Math.max(inputCount, outputCount) * 20
    const height = baseHeight

    return { width, height }
  }

  private calculateNodeProgress(node: WorkflowNode, context?: ExecutionContext): number {
    if (!context) return 0

    if (node.status === 'completed') return 100
    if (node.status === 'failed') return 0
    if (node.status === 'running') return 50
    if (node.status === 'pending') return 0

    return 0
  }

  private isEdgeActive(edge: WorkflowEdge, context?: ExecutionContext): boolean {
    if (!context) return false
    return context.currentNodeId === edge.source
  }

  private getEdgeStatus(
    edge: WorkflowEdge,
    definition: WorkflowDefinition,
    context?: ExecutionContext
  ): 'idle' | 'active' | 'completed' {
    if (!context) return 'idle'

    const sourceNode = definition.nodes.find((n) => n.id === edge.source)
    const targetNode = definition.nodes.find((n) => n.id === edge.target)

    if (sourceNode?.status === 'completed' && targetNode?.status === 'completed') {
      return 'completed'
    }

    if (sourceNode?.status === 'completed' && targetNode?.status === 'running') {
      return 'active'
    }

    return 'idle'
  }

  generateTimeline(snapshots: ExecutionSnapshot[]): ExecutionTimeline[] {
    return snapshots.map((snapshot) => {
      const nodes: TimelineNode[] = snapshot.workflowDefinition.nodes.map((node) => ({
        nodeId: node.id,
        nodeName: node.name,
        startTime: null,
        endTime: null,
        duration: null,
        status: node.status,
      }))

      const endTime = snapshot.context.status === 'completed' || snapshot.context.status === 'failed'
        ? snapshot.createdAt
        : null

      return {
        executionId: snapshot.executionId,
        startTime: snapshot.context.startTime,
        endTime,
        duration: endTime ? endTime - snapshot.context.startTime : null,
        status: snapshot.context.status,
        nodes,
      }
    })
  }

  storeLogs(logs: ExecutionLog[]): void {
    this.logStore.push(...logs)

    if (this.logStore.length > this.maxLogs) {
      this.logStore = this.logStore.slice(-this.maxLogs)
    }
  }

  queryLogs(filter: LogFilter): ExecutionLog[] {
    let logs = [...this.logStore]

    if (filter.executionId) {
      logs = logs.filter((l) => l.executionId === filter.executionId)
    }

    if (filter.nodeId) {
      logs = logs.filter((l) => l.nodeId === filter.nodeId)
    }

    if (filter.level) {
      const levels = Array.isArray(filter.level) ? filter.level : [filter.level]
      logs = logs.filter((l) => levels.includes(l.level))
    }

    if (filter.startTime) {
      logs = logs.filter((l) => l.timestamp >= filter.startTime!)
    }

    if (filter.endTime) {
      logs = logs.filter((l) => l.timestamp <= filter.endTime!)
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      logs = logs.filter(
        (l) =>
          l.message.toLowerCase().includes(searchLower) ||
          l.nodeName.toLowerCase().includes(searchLower)
      )
    }

    const limit = filter.limit || 100
    return logs.slice(-limit)
  }

  getLogStats(workflowId?: string): {
    total: number
    byLevel: Record<ExecutionLog['level'], number>
    byNode: Record<string, number>
  } {
    let logs = this.logStore

    if (workflowId) {
      logs = logs.filter((l) => l.executionId.includes(workflowId))
    }

    const byLevel: Record<ExecutionLog['level'], number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    }

    const byNode: Record<string, number> = {}

    for (const log of logs) {
      byLevel[log.level]++
      byNode[log.nodeId] = (byNode[log.nodeId] || 0) + 1
    }

    return { total: logs.length, byLevel, byNode }
  }

  exportLogs(format: 'json' | 'csv' | 'txt'): string {
    const logs = this.logStore

    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2)

      case 'csv':
        const headers = ['timestamp', 'executionId', 'nodeId', 'nodeName', 'level', 'message']
        const rows = logs.map((l) => [
          new Date(l.timestamp).toISOString(),
          l.executionId,
          l.nodeId,
          l.nodeName,
          l.level,
          `"${l.message.replace(/"/g, '""')}"`,
        ])
        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

      case 'txt':
        return logs
          .map((l) => `[${new Date(l.timestamp).toISOString()}] [${l.level.toUpperCase()}] [${l.nodeName}] ${l.message}`)
          .join('\n')

      default:
        return ''
    }
  }

  on(eventType: string, handler: MonitorEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set())
    }
    this.eventHandlers.get(eventType)!.add(handler)

    return () => {
      this.eventHandlers.get(eventType)?.delete(handler)
    }
  }

  private emit(eventType: string, data?: unknown): void {
    const event: MonitorEvent = {
      type: eventType,
      workflowId: (data as { workflowId?: string })?.workflowId || '',
      timestamp: Date.now(),
      data,
    }

    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event)
        } catch (error) {
          console.error(`监控事件处理器错误 [${eventType}]:`, error)
        }
      }
    }
  }
}

export const workflowVisualization = new WorkflowVisualizationService()

export { WorkflowVisualizationService }

export default WorkflowVisualizationService
