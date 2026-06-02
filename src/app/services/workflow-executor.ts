/**
 * @file workflow-executor.ts
 * @description YYC³ 工作流执行器 - 执行引擎与状态持久化
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [workflow],[executor],[engine],[persistence],[recovery]
 *
 * @brief 工作流执行器，实现执行引擎与状态持久化
 *
 * @details
 * - 执行引擎
 * - 状态持久化
 * - 错误恢复
 * - 执行历史
 * - 并行执行
 */

import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowStatus,
  ConditionExpression,
  ConditionOperand,
} from './workflow-definition'

export interface ExecutionContext {
  workflowId: string
  executionId: string
  startTime: number
  variables: Map<string, unknown>
  nodeOutputs: Map<string, Map<string, unknown>>
  currentNodeId: string | null
  status: WorkflowStatus
  error?: string
}

export interface ExecutionLog {
  id: string
  executionId: string
  nodeId: string
  nodeName: string
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  data?: unknown
}

export interface ExecutionSnapshot {
  executionId: string
  workflowId: string
  workflowDefinition: WorkflowDefinition
  context: ExecutionContext
  logs: ExecutionLog[]
  createdAt: number
}

export interface NodeExecutor {
  type: string
  execute(node: WorkflowNode, context: ExecutionContext): Promise<unknown>
}

type ExecutionEventHandler = (event: ExecutionEvent) => void | Promise<void>

export interface ExecutionEvent {
  type: string
  executionId: string
  nodeId?: string
  timestamp: number
  data?: unknown
}

class WorkflowExecutor {
  private executions: Map<string, ExecutionContext> = new Map()
  private snapshots: Map<string, ExecutionSnapshot> = new Map()
  private logs: Map<string, ExecutionLog[]> = new Map()
  private executors: Map<string, NodeExecutor> = new Map()
  private eventHandlers: Map<string, Set<ExecutionEventHandler>> = new Map()
  private maxSnapshots = 100
  private maxLogsPerExecution = 1000

  constructor() {
    this.registerDefaultExecutors()
  }

  private registerDefaultExecutors(): void {
    this.registerExecutor({
      type: 'start',
      execute: async () => ({ started: true }),
    })

    this.registerExecutor({
      type: 'end',
      execute: async () => ({ ended: true }),
    })

    this.registerExecutor({
      type: 'delay',
      execute: async (node, _context) => {
        const delay = (node.config.delay as number) || 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
        return { delayed: delay }
      },
    })

    this.registerExecutor({
      type: 'script',
      execute: async (node, context) => {
        const script = node.config.script as string
        if (!script) return { result: null }

        const variables: Record<string, unknown> = {}
        context.variables.forEach((value, key) => {
          variables[key] = value
        })

        try {
          const fn = new Function('variables', script)
          const result = fn(variables)
          return { result }
        } catch (error) {
          throw new Error(`脚本执行错误: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
    })

    this.registerExecutor({
      type: 'condition',
      execute: async (node, context) => {
        const condition = node.config.condition as ConditionExpression
        if (!condition) return { result: false }

        const result = this.evaluateCondition(condition, context)
        return { result }
      },
    })

    this.registerExecutor({
      type: 'parallel',
      execute: async () => ({ parallel: true }),
    })

    this.registerExecutor({
      type: 'loop',
      execute: async (node, _context) => {
        const items = (node.config.items as unknown[]) || []
        const iterations = items.length
        return { iterations, items }
      },
    })

    this.registerExecutor({
      type: 'webhook',
      execute: async (node, _context) => {
        const url = node.config.url as string
        const method = (node.config.method as string) || 'GET'

        if (!url) {
          throw new Error('Webhook URL未配置')
        }

        try {
          const response = await fetch(url, { method })
          const data = await response.json()
          return { status: response.status, data }
        } catch (error) {
          throw new Error(`Webhook调用失败: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
    })
  }

  registerExecutor(executor: NodeExecutor): void {
    this.executors.set(executor.type, executor)
  }

  async execute(definition: WorkflowDefinition): Promise<ExecutionContext> {
    const executionId = this.generateId()
    const context: ExecutionContext = {
      workflowId: definition.id,
      executionId,
      startTime: Date.now(),
      variables: new Map(),
      nodeOutputs: new Map(),
      currentNodeId: null,
      status: 'running',
    }

    for (const variable of definition.variables) {
      context.variables.set(variable.name, variable.value)
    }

    this.executions.set(executionId, context)
    this.logs.set(executionId, [])

    this.addLog(executionId, 'system', '系统', 'info', '工作流开始执行')
    this.emit('execution:started', { executionId, workflowId: definition.id })

    try {
      await this.executeNodes(definition, context)

      context.status = 'completed'
      this.addLog(executionId, 'system', '系统', 'info', '工作流执行完成')
      this.emit('execution:completed', { executionId, workflowId: definition.id })
    } catch (error) {
      context.status = 'failed'
      context.error = error instanceof Error ? error.message : String(error)
      this.addLog(executionId, 'system', '系统', 'error', `工作流执行失败: ${context.error}`)
      this.emit('execution:failed', { executionId, workflowId: definition.id, error: context.error })
    }

    this.saveSnapshot(executionId, definition, context)

    return context
  }

  private async executeNodes(definition: WorkflowDefinition, context: ExecutionContext): Promise<void> {
    const startNode = definition.nodes.find((n) => n.type === 'start')
    if (!startNode) {
      throw new Error('未找到开始节点')
    }

    const visited = new Set<string>()
    const executing = new Set<string>()

    await this.executeNodeRecursive(startNode.id, definition, context, visited, executing)
  }

  private async executeNodeRecursive(
    nodeId: string,
    definition: WorkflowDefinition,
    context: ExecutionContext,
    visited: Set<string>,
    executing: Set<string>
  ): Promise<void> {
    if (visited.has(nodeId)) return
    if (executing.has(nodeId)) {
      throw new Error(`检测到循环依赖: ${nodeId}`)
    }

    executing.add(nodeId)

    const node = definition.nodes.find((n) => n.id === nodeId)
    if (!node) {
      throw new Error(`节点不存在: ${nodeId}`)
    }

    const incomingEdges = definition.edges.filter((e) => e.target === nodeId)
    for (const edge of incomingEdges) {
      if (!visited.has(edge.source)) {
        await this.executeNodeRecursive(edge.source, definition, context, visited, executing)
      }
    }

    await this.executeNode(node, context)

    executing.delete(nodeId)
    visited.add(nodeId)

    const outgoingEdges = definition.edges.filter((e) => e.source === nodeId)

    if (node.type === 'condition') {
      const conditionResult = context.nodeOutputs.get(nodeId)?.get('result')
      for (const edge of outgoingEdges) {
        const shouldExecute =
          (conditionResult === true && edge.type === 'condition_true') ||
          (conditionResult === false && edge.type === 'condition_false')

        if (shouldExecute) {
          await this.executeNodeRecursive(edge.target, definition, context, visited, executing)
        }
      }
    } else if (node.type === 'parallel') {
      const parallelTargets = outgoingEdges.map((e) => e.target)
      await Promise.all(
        parallelTargets.map((targetId) =>
          this.executeNodeRecursive(targetId, definition, context, visited, executing)
        )
      )
    } else {
      for (const edge of outgoingEdges) {
        if (edge.type === 'default' || edge.type === 'condition_true') {
          await this.executeNodeRecursive(edge.target, definition, context, visited, executing)
        }
      }
    }
  }

  private async executeNode(node: WorkflowNode, context: ExecutionContext): Promise<void> {
    context.currentNodeId = node.id
    node.status = 'running'

    this.addLog(context.executionId, node.id, node.name, 'info', '节点开始执行')
    this.emit('node:started', { executionId: context.executionId, nodeId: node.id })

    try {
      const executor = this.executors.get(node.type)
      if (!executor) {
        throw new Error(`未找到节点执行器: ${node.type}`)
      }

      const result = await this.executeWithTimeout(
        executor.execute(node, context),
        (node.config.timeout as number) || 30000
      )

      if (!context.nodeOutputs.has(node.id)) {
        context.nodeOutputs.set(node.id, new Map())
      }
      if (result && typeof result === 'object') {
        Object.entries(result as Record<string, unknown>).forEach(([key, value]) => {
          context.nodeOutputs.get(node.id)!.set(key, value)
        })
      }

      node.status = 'completed'
      this.addLog(context.executionId, node.id, node.name, 'info', '节点执行完成', result)
      this.emit('node:completed', { executionId: context.executionId, nodeId: node.id, result })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (node.config.retryCount && node.config.retryCount > 0) {
        let retries = 0
        const maxRetries = node.config.retryCount as number
        const retryDelay = (node.config.retryDelay as number) || 1000

        while (retries < maxRetries) {
          retries++
          this.addLog(context.executionId, node.id, node.name, 'warn', `重试 ${retries}/${maxRetries}`)

          await new Promise((resolve) => setTimeout(resolve, retryDelay))

          try {
            const executor = this.executors.get(node.type)
            if (executor) {
              const result = await this.executeWithTimeout(
                executor.execute(node, context),
                (node.config.timeout as number) || 30000
              )

              if (!context.nodeOutputs.has(node.id)) {
                context.nodeOutputs.set(node.id, new Map())
              }
              if (result && typeof result === 'object') {
                Object.entries(result as Record<string, unknown>).forEach(([key, value]) => {
                  context.nodeOutputs.get(node.id)!.set(key, value)
                })
              }

              node.status = 'completed'
              this.addLog(context.executionId, node.id, node.name, 'info', '节点执行完成(重试)')
              this.emit('node:completed', { executionId: context.executionId, nodeId: node.id, result })
              return
            }
          } catch (retryError) {
            continue
          }
        }
      }

      if (node.config.continueOnError) {
        node.status = 'completed'
        node.error = errorMessage
        this.addLog(context.executionId, node.id, node.name, 'warn', `节点执行失败但继续: ${errorMessage}`)
        this.emit('node:warning', { executionId: context.executionId, nodeId: node.id, error: errorMessage })
      } else {
        node.status = 'failed'
        node.error = errorMessage
        this.addLog(context.executionId, node.id, node.name, 'error', `节点执行失败: ${errorMessage}`)
        this.emit('node:failed', { executionId: context.executionId, nodeId: node.id, error: errorMessage })
        throw error
      }
    }
  }

  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`执行超时: ${timeout}ms`)), timeout)
      }),
    ])
  }

  private evaluateCondition(condition: ConditionExpression, context: ExecutionContext): boolean {
    switch (condition.type) {
      case 'equals':
        return this.getOperandValue(condition.left, context) === this.getOperandValue(condition.right, context)

      case 'not_equals':
        return this.getOperandValue(condition.left, context) !== this.getOperandValue(condition.right, context)

      case 'contains':
        const left = String(this.getOperandValue(condition.left, context))
        const right = String(this.getOperandValue(condition.right, context))
        return left.includes(right)

      case 'greater_than':
        return Number(this.getOperandValue(condition.left, context)) > Number(this.getOperandValue(condition.right, context))

      case 'less_than':
        return Number(this.getOperandValue(condition.left, context)) < Number(this.getOperandValue(condition.right, context))

      case 'and':
        return (condition.operands || []).every((op) => this.evaluateCondition(op, context))

      case 'or':
        return (condition.operands || []).some((op) => this.evaluateCondition(op, context))

      case 'not':
        return !this.evaluateCondition((condition.operands || [])[0], context)

      case 'custom':
        if (condition.customExpression) {
          try {
            const fn = new Function('context', `return ${condition.customExpression}`)
            return fn(context)
          } catch {
            return false
          }
        }
        return false

      default:
        return false
    }
  }

  private getOperandValue(operand: ConditionOperand | undefined, context: ExecutionContext): unknown {
    if (!operand) return undefined

    switch (operand.type) {
      case 'value':
        return operand.value

      case 'variable':
        return context.variables.get(operand.variableName || '')

      case 'node_output':
        if (operand.nodeId && operand.outputName) {
          return context.nodeOutputs.get(operand.nodeId)?.get(operand.outputName)
        }
        return undefined

      default:
        return undefined
    }
  }

  pause(executionId: string): boolean {
    const context = this.executions.get(executionId)
    if (!context || context.status !== 'running') return false

    context.status = 'paused'
    this.addLog(executionId, 'system', '系统', 'info', '工作流已暂停')
    this.emit('execution:paused', { executionId })
    return true
  }

  resume(executionId: string): boolean {
    const context = this.executions.get(executionId)
    if (!context || context.status !== 'paused') return false

    context.status = 'running'
    this.addLog(executionId, 'system', '系统', 'info', '工作流已恢复')
    this.emit('execution:resumed', { executionId })
    return true
  }

  cancel(executionId: string): boolean {
    const context = this.executions.get(executionId)
    if (!context || context.status === 'completed' || context.status === 'failed') return false

    context.status = 'cancelled'
    this.addLog(executionId, 'system', '系统', 'info', '工作流已取消')
    this.emit('execution:cancelled', { executionId })
    return true
  }

  getExecution(executionId: string): ExecutionContext | undefined {
    return this.executions.get(executionId)
  }

  getLogs(executionId: string): ExecutionLog[] {
    return this.logs.get(executionId) || []
  }

  getSnapshot(executionId: string): ExecutionSnapshot | undefined {
    return this.snapshots.get(executionId)
  }

  getAllSnapshots(): ExecutionSnapshot[] {
    return Array.from(this.snapshots.values()).sort((a, b) => b.createdAt - a.createdAt)
  }

  restoreFromSnapshot(snapshotId: string): ExecutionContext | null {
    const snapshot = this.snapshots.get(snapshotId)
    if (!snapshot) return null

    const context: ExecutionContext = {
      ...snapshot.context,
      variables: new Map(snapshot.context.variables),
      nodeOutputs: new Map(
        Array.from(snapshot.context.nodeOutputs.entries()).map(([key, value]) => [
          key,
          new Map(value),
        ])
      ),
    }

    this.executions.set(context.executionId, context)
    this.logs.set(context.executionId, [...snapshot.logs])

    return context
  }

  on(eventType: string, handler: ExecutionEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set())
    }
    this.eventHandlers.get(eventType)!.add(handler)

    return () => {
      this.eventHandlers.get(eventType)?.delete(handler)
    }
  }

  private addLog(
    executionId: string,
    nodeId: string,
    nodeName: string,
    level: ExecutionLog['level'],
    message: string,
    data?: unknown
  ): void {
    const logs = this.logs.get(executionId) || []
    const log: ExecutionLog = {
      id: this.generateId(),
      executionId,
      nodeId,
      nodeName,
      timestamp: Date.now(),
      level,
      message,
      data,
    }

    logs.push(log)

    if (logs.length > this.maxLogsPerExecution) {
      logs.shift()
    }

    this.logs.set(executionId, logs)
  }

  private saveSnapshot(
    executionId: string,
    definition: WorkflowDefinition,
    context: ExecutionContext
  ): void {
    const snapshot: ExecutionSnapshot = {
      executionId,
      workflowId: definition.id,
      workflowDefinition: definition,
      context: {
        ...context,
        variables: new Map(context.variables),
        nodeOutputs: new Map(
          Array.from(context.nodeOutputs.entries()).map(([key, value]) => [key, new Map(value)])
        ),
      },
      logs: this.logs.get(executionId) || [],
      createdAt: Date.now(),
    }

    this.snapshots.set(executionId, snapshot)

    if (this.snapshots.size > this.maxSnapshots) {
      const oldest = Array.from(this.snapshots.entries())
        .sort((a, b) => a[1].createdAt - b[1].createdAt)[0]
      this.snapshots.delete(oldest[0])
    }
  }

  private emit(eventType: string, data?: unknown): void {
    const event: ExecutionEvent = {
      type: eventType,
      executionId: (data as { executionId?: string })?.executionId || '',
      timestamp: Date.now(),
      data,
    }

    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event)
        } catch (error) {
          console.error(`事件处理器错误 [${eventType}]:`, error)
        }
      }
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }
}

export const workflowExecutor = new WorkflowExecutor()

export { WorkflowExecutor }

export default WorkflowExecutor
