/**
 * @file event-bus.ts
 * @description YYC³ 事件总线系统 - 组件间解耦通信
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [service],[event-bus],[pub-sub],[communication],[decoupling]
 *
 * @brief 事件总线系统，实现组件间解耦通信
 *
 * @details
 * - 事件订阅/发布模式
 * - 类型安全的事件系统
 * - 事件历史记录
 * - 异步事件处理
 * - 事件过滤与转换
 */

export type EventHandler<T = unknown> = (event: T) => void | Promise<void>

export interface EventSubscription {
  id: string
  eventType: string
  handler: EventHandler
  once: boolean
  priority: number
  createdAt: number
}

export interface EventHistoryEntry {
  id: string
  eventType: string
  payload: unknown
  timestamp: number
  source?: string
}

export interface EventBusOptions {
  enableHistory?: boolean
  maxHistorySize?: number
  debug?: boolean
  asyncHandler?: boolean
}

export interface EventBusStats {
  totalEvents: number
  totalSubscriptions: number
  eventTypes: string[]
  historySize: number
}

const DEFAULT_OPTIONS: Required<EventBusOptions> = {
  enableHistory: true,
  maxHistorySize: 100,
  debug: false,
  asyncHandler: false,
}

type EventMap = Record<string, unknown>

class EventBus<TEventMap extends EventMap = EventMap> {
  private subscriptions: Map<string, EventSubscription[]> = new Map()
  private history: EventHistoryEntry[] = []
  private options: Required<EventBusOptions>
  private eventIdCounter = 0
  private subscriptionIdCounter = 0

  constructor(options: EventBusOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  on<K extends keyof TEventMap>(
    eventType: K,
    handler: EventHandler<TEventMap[K]>,
    options?: { priority?: number }
  ): string {
    return this.subscribe(eventType as string, handler as EventHandler, false, options?.priority ?? 0)
  }

  once<K extends keyof TEventMap>(
    eventType: K,
    handler: EventHandler<TEventMap[K]>,
    options?: { priority?: number }
  ): string {
    return this.subscribe(eventType as string, handler as EventHandler, true, options?.priority ?? 0)
  }

  off(subscriptionId: string): boolean {
    for (const [eventType, subs] of this.subscriptions) {
      const index = subs.findIndex((sub) => sub.id === subscriptionId)
      if (index !== -1) {
        subs.splice(index, 1)
        if (subs.length === 0) {
          this.subscriptions.delete(eventType)
        }
        return true
      }
    }
    return false
  }

  emit<K extends keyof TEventMap>(
    eventType: K,
    payload: TEventMap[K],
    source?: string
  ): void {
    const eventTypeStr = eventType as string

    if (this.options.enableHistory) {
      this.addToHistory(eventTypeStr, payload, source)
    }

    if (this.options.debug) {
      console.log(`[EventBus] Emit: ${eventTypeStr}`, payload)
    }

    const subs = this.subscriptions.get(eventTypeStr)
    if (!subs || subs.length === 0) return

    const sortedSubs = [...subs].sort((a, b) => b.priority - a.priority)

    for (const sub of sortedSubs) {
      try {
        if (this.options.asyncHandler) {
          Promise.resolve(sub.handler(payload)).catch((error) => {
            console.error(`[EventBus] Handler error for ${eventTypeStr}:`, error)
          })
        } else {
          sub.handler(payload)
        }
      } catch (error) {
        console.error(`[EventBus] Handler error for ${eventTypeStr}:`, error)
      }

      if (sub.once) {
        this.off(sub.id)
      }
    }
  }

  async emitAsync<K extends keyof TEventMap>(
    eventType: K,
    payload: TEventMap[K],
    source?: string
  ): Promise<void> {
    const eventTypeStr = eventType as string

    if (this.options.enableHistory) {
      this.addToHistory(eventTypeStr, payload, source)
    }

    if (this.options.debug) {
      console.log(`[EventBus] EmitAsync: ${eventTypeStr}`, payload)
    }

    const subs = this.subscriptions.get(eventTypeStr)
    if (!subs || subs.length === 0) return

    const sortedSubs = [...subs].sort((a, b) => b.priority - a.priority)

    for (const sub of sortedSubs) {
      try {
        await Promise.resolve(sub.handler(payload))
      } catch (error) {
        console.error(`[EventBus] Async handler error for ${eventTypeStr}:`, error)
      }

      if (sub.once) {
        this.off(sub.id)
      }
    }
  }

  clear(eventType?: string): void {
    if (eventType) {
      this.subscriptions.delete(eventType)
    } else {
      this.subscriptions.clear()
    }
  }

  clearHistory(): void {
    this.history = []
  }

  getHistory(eventType?: string): EventHistoryEntry[] {
    if (eventType) {
      return this.history.filter((entry) => entry.eventType === eventType)
    }
    return [...this.history]
  }

  getStats(): EventBusStats {
    const eventTypes = new Set<string>()
    let totalSubscriptions = 0

    for (const [type, subs] of this.subscriptions) {
      eventTypes.add(type)
      totalSubscriptions += subs.length
    }

    return {
      totalEvents: this.history.length,
      totalSubscriptions,
      eventTypes: Array.from(eventTypes),
      historySize: this.history.length,
    }
  }

  hasSubscribers<K extends keyof TEventMap>(eventType: K): boolean {
    const subs = this.subscriptions.get(eventType as string)
    return subs !== undefined && subs.length > 0
  }

  subscriberCount<K extends keyof TEventMap>(eventType: K): number {
    const subs = this.subscriptions.get(eventType as string)
    return subs?.length ?? 0
  }

  private subscribe(
    eventType: string,
    handler: EventHandler,
    once: boolean,
    priority: number
  ): string {
    const subscriptionId = `sub-${++this.subscriptionIdCounter}`

    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      handler,
      once,
      priority,
      createdAt: Date.now(),
    }

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, [])
    }

    this.subscriptions.get(eventType)!.push(subscription)

    if (this.options.debug) {
      console.log(`[EventBus] Subscribe: ${eventType}`, subscriptionId)
    }

    return subscriptionId
  }

  private addToHistory(eventType: string, payload: unknown, source?: string): void {
    const entry: EventHistoryEntry = {
      id: `evt-${++this.eventIdCounter}`,
      eventType,
      payload,
      timestamp: Date.now(),
      source,
    }

    this.history.push(entry)

    if (this.history.length > this.options.maxHistorySize) {
      this.history.shift()
    }
  }
}

export function createEventBus<TEventMap extends EventMap = EventMap>(
  options?: EventBusOptions
): EventBus<TEventMap> {
  return new EventBus<TEventMap>(options)
}

export interface YYC3Events extends Record<string, unknown> {
  'file:created': { path: string; content: string }
  'file:updated': { path: string; content: string; previousContent?: string }
  'file:deleted': { path: string }
  'file:renamed': { oldPath: string; newPath: string }
  'editor:content-changed': { path: string; content: string }
  'editor:selection-changed': { path: string; selection: { start: number; end: number } }
  'editor:cursor-moved': { path: string; position: { line: number; column: number } }
  'theme:changed': { theme: string }
  'language:changed': { language: string }
  'panel:resized': { panelId: string; size: number }
  'panel:swapped': { from: string; to: string }
  'ai:message-sent': { content: string }
  'ai:message-received': { content: string; model?: string }
  'ai:model-changed': { modelId: string }
  'terminal:command-executed': { command: string; output?: string }
  'terminal:session-created': { sessionId: string }
  'storage:exported': { format: string; size: number }
  'storage:imported': { format: string; itemsCount: number }
  'state:saved': { timestamp: number }
  'state:restored': { timestamp: number }
  'error:occurred': { error: Error; context?: string }
  'notification:show': { message: string; type: 'info' | 'success' | 'warning' | 'error' }
}

export const globalEventBus = createEventBus<YYC3Events>({
  enableHistory: true,
  maxHistorySize: 200,
  debug: process.env.NODE_ENV === 'development',
})

export default EventBus
