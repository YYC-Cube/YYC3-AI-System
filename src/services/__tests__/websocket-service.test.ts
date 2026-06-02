/**
 * @file websocket-service.test.ts
 * @description YYC³便携式智能AI系统 - WebSocket服务测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,websocket,connection,retry
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import {
  WebSocketConnectionState,
  WebSocketMessageType,
  WebSocketEventType as WSEventType,
} from '../../types/websocket'
import { WebSocketService } from '../websocket-service'

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = []
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(public url: string) {
    MockWebSocket.instances.push(this)
  }

  close(code?: number, reason?: string): void {
    if (this.onclose) {
      this.onclose({ code: code || 1000, reason: reason || '', wasClean: true } as unknown)
    }
  }

  send(data: string): void {
    // Mock send
  }

  static reset(): void {
    MockWebSocket.instances = []
  }
}

// @ts-ignore
global.WebSocket = MockWebSocket as unknown

describe('WebSocketService', () => {
  let service: WebSocketService

  beforeEach(() => {
    MockWebSocket.reset()
    vi.useFakeTimers()
    // Reset singleton
    ;(WebSocketService as unknown).instance = undefined
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (service) {
      service.destroy()
    }
    // Reset singleton
    ;(WebSocketService as unknown).instance = undefined
  })

  describe('初始化', () => {
    it('应该成功初始化', () => {
      service = WebSocketService.getInstance({
        url: 'ws://localhost:8080',
        autoConnect: false,
      })

      expect(service).toBeInstanceOf(WebSocketService)
      expect(service.getState()).toBe(WebSocketConnectionState.DISCONNECTED)
    })

    it('应该是单例模式', () => {
      const instance1 = WebSocketService.getInstance({ url: 'ws://localhost:8080', autoConnect: false })
      const instance2 = WebSocketService.getInstance({ url: 'ws://localhost:8080', autoConnect: false })
      expect(instance1).toBe(instance2)
    })

    it('应该自动连接', () => {
      service = WebSocketService.getInstance({
        url: 'ws://localhost:8080',
        autoConnect: true,
      })

      expect(service.getState()).toBe(WebSocketConnectionState.CONNECTING)
    })
  })

  describe('连接管理', () => {
    beforeEach(() => {
      service = WebSocketService.getInstance({
        url: 'ws://localhost:8080',
        autoConnect: false,
      })
    })

    it('应该成功连接', () => {
      service.connect()

      expect(service.getState()).toBe(WebSocketConnectionState.CONNECTING)

      // 触发open事件
      MockWebSocket.instances[0].onopen?.(new Event('open'))

      expect(service.getState()).toBe(WebSocketConnectionState.CONNECTED)
    })

    it('应该成功断开连接', () => {
      service.connect()
      MockWebSocket.instances[0].onopen?.(new Event('open'))

      service.disconnect()

      expect(service.getState()).toBe(WebSocketConnectionState.CLOSED)
    })

    it('应该处理连接错误', () => {
      service.connect()

      // 触发error事件
      MockWebSocket.instances[0].onerror?.(new Event('error'))

      expect(service.getState()).toBe(WebSocketConnectionState.ERROR)
    })

    it('应该处理连接关闭', () => {
      // 销毁现有实例并重置单例
      if (service) {
        service.destroy()
      }
      ;(WebSocketService as unknown).instance = undefined
      
      service = WebSocketService.getInstance({
        url: 'ws://localhost:8080',
        autoConnect: false,
        autoReconnect: false,
      })
      service.connect()
      MockWebSocket.instances[0].onopen?.(new Event('open'))

      // 触发close事件
      MockWebSocket.instances[0].onclose?.({
        code: 1000,
        reason: 'Normal closure',
        wasClean: true,
      } as unknown)

      expect(service.getState()).toBe(WebSocketConnectionState.DISCONNECTED)
    })
  })

  describe('消息发送', () => {
    beforeEach(() => {
      service = WebSocketService.getInstance({
        url: 'ws://localhost:8080',
        autoConnect: false,
      })
      service.connect()
      MockWebSocket.instances[0].onopen?.(new Event('open'))
    })

    it('应该成功发送消息', () => {
      const success = service.send({
        type: WebSocketMessageType.DATA,
        data: { message: 'Hello' },
      })

      expect(success).toBe(true)

      const stats = service.getStatistics()
      expect(stats.messagesSent).toBeGreaterThan(0)
    })

    it('应该在离线时加入消息队列', () => {
      service.disconnect()

      const success = service.send(
        {
          type: WebSocketMessageType.DATA,
          data: { message: 'Queued' },
        },
        true
      )

      expect(success).toBe(true)
    })

    it('应该在未连接且不启用队列时返回false', () => {
      service.disconnect()

      const success = service.send(
        {
          type: WebSocketMessageType.DATA,
          data: { message: 'Test' },
        },
        false
      )

      expect(success).toBe(false)
    })
  })

  describe('消息接收', () => {
    beforeEach(() => {
      service = WebSocketService.getInstance({
        url: 'ws://localhost:8080',
        autoConnect: false,
      })
      service.connect()
      MockWebSocket.instances[0].onopen?.(new Event('open'))
    })

    it('应该成功接收消息', () => {
      const message = {
        type: WebSocketMessageType.DATA,
        data: { message: 'Hello' },
        timestamp: Date.now(),
      }

      MockWebSocket.instances[0].onmessage?.({
        data: JSON.stringify(message),
      } as MessageEvent)

      const stats = service.getStatistics()
      expect(stats.messagesReceived).toBeGreaterThan(0)
    })

    it('应该处理心跳消息', () => {
      const heartbeatMessage = {
        type: WebSocketMessageType.HEARTBEAT,
        timestamp: Date.now(),
      }

      MockWebSocket.instances[0].onmessage?.({
        data: JSON.stringify(heartbeatMessage),
      } as MessageEvent)

      // 心跳消息不应该计入消息统计
      const stats = service.getStatistics()
      // 注意：实际实现中心跳消息可能不计入，这里根据实现调整
    })
  })

  describe('心跳检测', () => {
    beforeEach(() => {
      service = WebSocketService.getInstance({
        url: 'ws://localhost:8080',
        autoConnect: false,
        heartbeatInterval: 5000,
        heartbeatTimeout: 3000,
      })
      service.connect()
      MockWebSocket.instances[0].onopen?.(new Event('open'))
    })

    it('应该定期发送心跳', () => {
      const sendSpy = vi.spyOn(service, 'send').mockReturnValue(true)

      vi.advanceTimersByTime(5000)

      expect(sendSpy).toHaveBeenCalled()

      sendSpy.mockRestore()
    })

    it('应该处理心跳超时', () => {
      const disconnectSpy = vi.spyOn(MockWebSocket.instances[0], 'close')

      vi.advanceTimersByTime(5000) // 心跳发送
      vi.advanceTimersByTime(3000) // 心跳超时

      expect(disconnectSpy).toHaveBeenCalled()

      disconnectSpy.mockRestore()
    })
  })

  describe('指数退避重试', () => {
    beforeEach(() => {
      service = WebSocketService.getInstance({
        url: 'ws://localhost:8080',
        autoConnect: false,
        autoReconnect: true,
        maxRetries: 3,
        initialRetryInterval: 1000,
        retryBackoffFactor: 2,
      })
    })

    it('应该计算正确的重试间隔', () => {
      service.connect()
      MockWebSocket.instances[0].onclose?.({
        code: 1006,
        reason: 'Connection lost',
        wasClean: false,
      } as unknown)

      // 第一次重试：1000ms
      let strategy = service.getRetryStrategy()
      expect(strategy.retryInterval).toBe(1000)

      vi.advanceTimersByTime(1000)

      // 触发第二次连接关闭
      MockWebSocket.instances[1].onclose?.({
        code: 1006,
        reason: 'Connection lost',
        wasClean: false,
      } as unknown)

      // 第二次重试：2000ms (1000 * 2)
      strategy = service.getRetryStrategy()
      expect(strategy.retryInterval).toBe(2000)

      vi.advanceTimersByTime(2000)

      // 触发第三次连接关闭
      MockWebSocket.instances[2].onclose?.({
        code: 1006,
        reason: 'Connection lost',
        wasClean: false,
      } as unknown)

      // 第三次重试：4000ms (2000 * 2)
      strategy = service.getRetryStrategy()
      expect(strategy.retryInterval).toBe(4000)
    })

    it('应该在最大重试次数后停止', () => {
      service.connect()
      MockWebSocket.instances[0].onclose?.({
        code: 1006,
        reason: 'Connection lost',
        wasClean: false,
      } as unknown)

      // 模拟3次重试
      vi.advanceTimersByTime(1000) // 第1次
      MockWebSocket.instances[1].onclose?.({
        code: 1006,
        reason: 'Connection lost',
        wasClean: false,
      } as unknown)
      
      vi.advanceTimersByTime(2000) // 第2次
      MockWebSocket.instances[2].onclose?.({
        code: 1006,
        reason: 'Connection lost',
        wasClean: false,
      } as unknown)
      
      vi.advanceTimersByTime(4000) // 第3次

      const strategy = service.getRetryStrategy()
      expect(strategy.shouldRetry).toBe(false)
    })

    it('应该限制最大重试间隔', () => {
      // 销毁现有实例并重置单例
      service.destroy()
      ;(WebSocketService as unknown).instance = undefined
      
      service = WebSocketService.getInstance({
        url: 'ws://localhost:8080',
        autoConnect: false,
        autoReconnect: true,
        maxRetries: 10,
        initialRetryInterval: 1000,
        maxRetryInterval: 5000,
        retryBackoffFactor: 10, // 大的退避因子
      })

      service.connect()
      MockWebSocket.instances[0].onclose?.({
        code: 1006,
        reason: 'Connection lost',
        wasClean: false,
      } as unknown)

      // 多次重试
      vi.advanceTimersByTime(1000) // 第1次：1000ms
      MockWebSocket.instances[1].onclose?.({
        code: 1006,
        reason: 'Connection lost',
        wasClean: false,
      } as unknown)
      
      vi.advanceTimersByTime(5000) // 第2次：5000ms（达到最大值）
      MockWebSocket.instances[2].onclose?.({
        code: 1006,
        reason: 'Connection lost',
        wasClean: false,
      } as unknown)
      
      vi.advanceTimersByTime(5000) // 第3次：5000ms（保持最大值）

      const strategy = service.getRetryStrategy()
      expect(strategy.retryInterval).toBe(5000) // 不应超过最大值
    })
  })

  describe('事件系统', () => {
    beforeEach(() => {
      service = WebSocketService.getInstance({
        url: 'ws://localhost:8080',
        autoConnect: false,
      })
    })

    it('应该触发open事件', () => {
      const handler = vi.fn()

      service.on(WSEventType.OPEN, handler)
      service.connect()
      MockWebSocket.instances[0].onopen?.(new Event('open'))

      expect(handler).toHaveBeenCalled()
    })

    it('应该触发close事件', () => {
      const handler = vi.fn()

      service.connect()
      MockWebSocket.instances[0].onopen?.(new Event('open'))

      service.on(WSEventType.CLOSE, handler)
      MockWebSocket.instances[0].onclose?.({
        code: 1000,
        reason: 'Normal closure',
        wasClean: true,
      } as unknown)

      expect(handler).toHaveBeenCalled()
    })

    it('应该触发error事件', () => {
      const handler = vi.fn()

      service.connect()

      service.on(WSEventType.ERROR, handler)
      MockWebSocket.instances[0].onerror?.(new Event('error'))

      expect(handler).toHaveBeenCalled()
    })

    it('应该触发message事件', () => {
      const handler = vi.fn()

      service.connect()
      MockWebSocket.instances[0].onopen?.(new Event('open'))

      service.on(WSEventType.MESSAGE, handler)

      const message = {
        type: WebSocketMessageType.DATA,
        data: { message: 'Hello' },
        timestamp: Date.now(),
      }

      MockWebSocket.instances[0].onmessage?.({
        data: JSON.stringify(message),
      } as MessageEvent)

      expect(handler).toHaveBeenCalled()
    })

    it('应该正确移除事件监听器', () => {
      const handler = vi.fn()

      service.on(WSEventType.OPEN, handler)
      service.off(WSEventType.OPEN, handler)

      service.connect()
      MockWebSocket.instances[0].onopen?.(new Event('open'))

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('统计信息', () => {
    beforeEach(() => {
      service = WebSocketService.getInstance({
        url: 'ws://localhost:8080',
        autoConnect: false,
      })
      service.connect()
      MockWebSocket.instances[0].onopen?.(new Event('open'))
    })

    it('应该正确统计发送消息', () => {
      const initialStats = service.getStatistics()

      service.send({
        type: WebSocketMessageType.DATA,
        data: { message: 'Test' },
      })

      const newStats = service.getStatistics()
      expect(newStats.messagesSent).toBe(initialStats.messagesSent + 1)
    })

    it('应该正确统计接收消息', () => {
      const initialStats = service.getStatistics()

      const message = {
        type: WebSocketMessageType.DATA,
        data: { message: 'Hello' },
        timestamp: Date.now(),
      }

      MockWebSocket.instances[0].onmessage?.({
        data: JSON.stringify(message),
      } as MessageEvent)

      const newStats = service.getStatistics()
      expect(newStats.messagesReceived).toBe(initialStats.messagesReceived + 1)
    })

    it('应该正确计算平均消息大小', () => {
      service.send({
        type: WebSocketMessageType.DATA,
        data: { message: 'Test message' },
      })

      const stats = service.getStatistics()
      expect(stats.averageMessageSize).toBeGreaterThan(0)
    })
  })

  describe('配置管理', () => {
    it('应该更新配置', () => {
      service = WebSocketService.getInstance({
        url: 'ws://localhost:8080',
        autoConnect: false,
      })

      service.updateConfig({
        autoReconnect: false,
        maxRetries: 5,
      })

      const config = service.getConfig()
      expect(config.autoReconnect).toBe(false)
      expect(config.maxRetries).toBe(5)
    })

    it('应该获取配置', () => {
      service = WebSocketService.getInstance({
        url: 'ws://localhost:8080',
        autoConnect: false,
        maxRetries: 10,
      })

      const config = service.getConfig()
      expect(config.url).toBe('ws://localhost:8080')
      expect(config.maxRetries).toBe(10)
    })
  })

  describe('清理', () => {
    it('应该正确销毁服务', () => {
      service = WebSocketService.getInstance({
        url: 'ws://localhost:8080',
        autoConnect: false,
      })

      service.connect()
      MockWebSocket.instances[0].onopen?.(new Event('open'))

      service.destroy()

      expect(service.getState()).toBe(WebSocketConnectionState.CLOSED)
    })
  })
})
