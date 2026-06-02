/**
 * @file agent-protocol.ts
 * @description YYC³ Agent通信协议 - 消息传递与事件订阅
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [agent],[protocol],[messaging],[pub-sub],[communication]
 *
 * @brief Agent通信协议，实现消息传递与事件订阅
 *
 * @details
 * - 消息传递机制
 * - 事件订阅/发布
 * - 结果回调
 * - 消息路由
 * - 消息持久化
 */

export type MessageType = 
  | 'request' 
  | 'response' 
  | 'notification' 
  | 'error' 
  | 'heartbeat'

export interface AgentMessage<T = unknown> {
  id: string
  type: MessageType
  from: string
  to: string | string[]
  topic?: string
  payload: T
  correlationId?: string
  timestamp: number
  ttl?: number
  priority: number
  metadata?: Record<string, unknown>
}

export interface MessageResponse<T = unknown> {
  id: string
  correlationId: string
  from: string
  to: string
  success: boolean
  payload?: T
  error?: MessageError
  timestamp: number
}

export interface MessageError {
  code: string
  message: string
  details?: unknown
}

export interface Subscription {
  id: string
  topic: string
  subscriberId: string
  handler: MessageHandler
  filter?: MessageFilter
  createdAt: number
}

export interface MessageFilter {
  from?: string | string[]
  type?: MessageType | MessageType[]
  priority?: { min?: number; max?: number }
  custom?: (message: AgentMessage) => boolean
}

export interface MessageQueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
}

type MessageHandler<T = unknown> = (message: AgentMessage<T>) => void | Promise<void | MessageResponse>

interface PendingRequest {
  message: AgentMessage
  resolve: (response: MessageResponse) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

class AgentProtocol {
  private subscriptions: Map<string, Subscription> = new Map()
  private topicSubscriptions: Map<string, Set<string>> = new Map()
  private messageQueue: AgentMessage[] = []
  private pendingRequests: Map<string, PendingRequest> = new Map()
  private messageHistory: AgentMessage[] = []
  private maxHistorySize = 1000
  private defaultTimeout = 30000
  private isProcessing = false

  subscribe(
    topic: string,
    subscriberId: string,
    handler: MessageHandler,
    filter?: MessageFilter
  ): string {
    const subscriptionId = this.generateId()

    const subscription: Subscription = {
      id: subscriptionId,
      topic,
      subscriberId,
      handler,
      filter,
      createdAt: Date.now(),
    }

    this.subscriptions.set(subscriptionId, subscription)

    if (!this.topicSubscriptions.has(topic)) {
      this.topicSubscriptions.set(topic, new Set())
    }
    this.topicSubscriptions.get(topic)!.add(subscriptionId)

    return subscriptionId
  }

  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return false

    this.subscriptions.delete(subscriptionId)
    this.topicSubscriptions.get(subscription.topic)?.delete(subscriptionId)

    return true
  }

  unsubscribeAll(subscriberId: string): number {
    let count = 0
    const toRemove: string[] = []

    for (const [id, sub] of this.subscriptions) {
      if (sub.subscriberId === subscriberId) {
        toRemove.push(id)
      }
    }

    for (const id of toRemove) {
      this.unsubscribe(id)
      count++
    }

    return count
  }

  publish<T>(
    topic: string,
    payload: T,
    options?: {
      from?: string
      priority?: number
      ttl?: number
      metadata?: Record<string, unknown>
    }
  ): string {
    const message: AgentMessage<T> = {
      id: this.generateId(),
      type: 'notification',
      from: options?.from || 'system',
      to: [],
      topic,
      payload,
      timestamp: Date.now(),
      priority: options?.priority || 0,
      ttl: options?.ttl,
      metadata: options?.metadata,
    }

    this.enqueueMessage(message)
    return message.id
  }

  async request<T, R = unknown>(
    to: string,
    payload: T,
    options?: {
      from?: string
      topic?: string
      timeout?: number
      priority?: number
    }
  ): Promise<MessageResponse<R>> {
    const message: AgentMessage<T> = {
      id: this.generateId(),
      type: 'request',
      from: options?.from || 'system',
      to,
      topic: options?.topic,
      payload,
      timestamp: Date.now(),
      priority: options?.priority || 0,
    }

    return new Promise((resolve, reject) => {
      const timeout = options?.timeout || this.defaultTimeout

      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(message.id)
        reject(new Error(`请求超时: ${timeout}ms`))
      }, timeout)

      this.pendingRequests.set(message.id, {
        message,
        resolve: resolve as (response: MessageResponse) => void,
        reject,
        timeout: timeoutHandle,
      })

      this.enqueueMessage(message)
    })
  }

  respond<T>(
    correlationId: string,
    payload: T,
    options?: {
      from?: string
      success?: boolean
      error?: MessageError
    }
  ): void {
    const originalMessage = this.findMessageById(correlationId)
    if (!originalMessage) {
      console.warn(`未找到原始消息: ${correlationId}`)
      return
    }

    const response: MessageResponse<T> = {
      id: this.generateId(),
      correlationId,
      from: options?.from || 'system',
      to: originalMessage.from as string,
      success: options?.success ?? true,
      payload,
      error: options?.error,
      timestamp: Date.now(),
    }

    const pending = this.pendingRequests.get(correlationId)
    if (pending) {
      clearTimeout(pending.timeout)
      pending.resolve(response)
      this.pendingRequests.delete(correlationId)
    }
  }

  send<T>(
    to: string | string[],
    payload: T,
    options?: {
      from?: string
      type?: MessageType
      topic?: string
      priority?: number
      ttl?: number
    }
  ): string {
    const message: AgentMessage<T> = {
      id: this.generateId(),
      type: options?.type || 'notification',
      from: options?.from || 'system',
      to,
      topic: options?.topic,
      payload,
      timestamp: Date.now(),
      priority: options?.priority || 0,
      ttl: options?.ttl,
    }

    this.enqueueMessage(message)
    return message.id
  }

  broadcast<T>(
    topic: string,
    payload: T,
    options?: {
      from?: string
      priority?: number
    }
  ): string[] {
    const subscriptionIds = this.topicSubscriptions.get(topic)
    if (!subscriptionIds || subscriptionIds.size === 0) {
      return []
    }

    const messageIds: string[] = []

    for (const subId of subscriptionIds) {
      const subscription = this.subscriptions.get(subId)
      if (subscription) {
        const message: AgentMessage<T> = {
          id: this.generateId(),
          type: 'notification',
          from: options?.from || 'system',
          to: subscription.subscriberId,
          topic,
          payload,
          timestamp: Date.now(),
          priority: options?.priority || 0,
        }
        this.enqueueMessage(message)
        messageIds.push(message.id)
      }
    }

    return messageIds
  }

  getQueueStats(): MessageQueueStats {
    return {
      pending: this.messageQueue.length,
      processing: this.pendingRequests.size,
      completed: this.messageHistory.filter((m) => m.type === 'response').length,
      failed: 0,
    }
  }

  getMessageHistory(filter?: {
    from?: string
    to?: string
    topic?: string
    type?: MessageType
    limit?: number
  }): AgentMessage[] {
    let history = [...this.messageHistory]

    if (filter) {
      if (filter.from) {
        history = history.filter((m) => m.from === filter.from)
      }
      if (filter.to) {
        history = history.filter((m) => {
          if (typeof m.to === 'string') return m.to === filter.to
          return m.to.includes(filter.to as string)
        })
      }
      if (filter.topic) {
        history = history.filter((m) => m.topic === filter.topic)
      }
      if (filter.type) {
        history = history.filter((m) => m.type === filter.type)
      }
    }

    const limit = filter?.limit || 100
    return history.slice(-limit)
  }

  clearHistory(): void {
    this.messageHistory = []
  }

  private enqueueMessage(message: AgentMessage): void {
    this.messageQueue.push(message)
    this.sortQueue()
    this.processQueue()
  }

  private sortQueue(): void {
    this.messageQueue.sort((a, b) => b.priority - a.priority)
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return
    this.isProcessing = true

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (!message) break

      if (message.ttl && Date.now() - message.timestamp > message.ttl) {
        continue
      }

      await this.deliverMessage(message)
    }

    this.isProcessing = false
  }

  private async deliverMessage(message: AgentMessage): Promise<void> {
    this.addToHistory(message)

    if (message.topic) {
      const subscriptionIds = this.topicSubscriptions.get(message.topic)
      if (subscriptionIds) {
        for (const subId of subscriptionIds) {
          const subscription = this.subscriptions.get(subId)
          if (subscription && this.matchesFilter(message, subscription.filter)) {
            try {
              const result = await subscription.handler(message)
              if (message.type === 'request' && result) {
                this.respond(message.id, result.payload, {
                  from: subscription.subscriberId,
                  success: result.success,
                  error: result.error,
                })
              }
            } catch (error) {
              console.error(`消息处理错误 [${message.id}]:`, error)
              if (message.type === 'request') {
                this.respond(message.id, undefined, {
                  from: subscription.subscriberId,
                  success: false,
                  error: {
                    code: 'HANDLER_ERROR',
                    message: error instanceof Error ? error.message : '处理错误',
                  },
                })
              }
            }
          }
        }
      }
    }
  }

  private matchesFilter(message: AgentMessage, filter?: MessageFilter): boolean {
    if (!filter) return true

    if (filter.from) {
      const fromList = Array.isArray(filter.from) ? filter.from : [filter.from]
      if (!fromList.includes(message.from)) return false
    }

    if (filter.type) {
      const typeList = Array.isArray(filter.type) ? filter.type : [filter.type]
      if (!typeList.includes(message.type)) return false
    }

    if (filter.priority) {
      if (filter.priority.min !== undefined && message.priority < filter.priority.min) {
        return false
      }
      if (filter.priority.max !== undefined && message.priority > filter.priority.max) {
        return false
      }
    }

    if (filter.custom && !filter.custom(message)) {
      return false
    }

    return true
  }

  private addToHistory(message: AgentMessage): void {
    this.messageHistory.push(message)
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift()
    }
  }

  private findMessageById(id: string): AgentMessage | undefined {
    return (
      this.messageHistory.find((m) => m.id === id) ||
      this.messageQueue.find((m) => m.id === id)
    )
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }
}

export const agentProtocol = new AgentProtocol()

export default AgentProtocol
