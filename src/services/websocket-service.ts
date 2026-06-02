/**
 * @file websocket-service.ts
 * @description YYC³便携式智能AI系统 - WebSocket连接管理服务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,websocket,connection,retry,critical
 */

import { v4 as uuidv4 } from 'uuid';

import type {
  WebSocketConnectionState,
  WebSocketMessage,
  WebSocketConfig,
  WebSocketEventType,
  WebSocketEventData,
  WebSocketStatistics,
  RetryStrategy,
  MessageQueueItem,
} from '../types/websocket';
import {
  WebSocketMessageType,
  WebSocketEventType as WSEventType,
  WebSocketConnectionState as WSState,
} from '../types/websocket';

/**
 * WebSocket连接管理服务类
 * 提供连接管理、重试机制、心跳检测等功能
 */
export class WebSocketService {
  private static instance: WebSocketService;

  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private state: WebSocketConnectionState = WSState.DISCONNECTED;

  // 重试相关
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private currentRetryInterval: number;
  private isManualDisconnect = false;

  // 心跳相关
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  // 消息队列
  private messageQueue: MessageQueueItem[] = [];
  private isProcessingQueue = false;

  // 事件监听器
  private eventListeners: Map<WebSocketEventType, Set<(data: WebSocketEventData) => void>> =
    new Map();

  // 统计信息
  private statistics: WebSocketStatistics = {
    connectionTime: 0,
    lastConnectedTime: 0,
    disconnectCount: 0,
    reconnectCount: 0,
    messagesSent: 0,
    messagesReceived: 0,
    bytesSent: 0,
    bytesReceived: 0,
    averageMessageSize: 0,
    errorCount: 0,
    lastErrorTime: 0,
  };

  // 默认配置
  private defaultConfig: Required<WebSocketConfig> = {
    url: '',
    autoConnect: true,
    autoReconnect: true,
    maxRetries: 10,
    initialRetryInterval: 1000, // 1秒
    maxRetryInterval: 30000, // 30秒
    retryBackoffFactor: 2, // 指数退避因子
    heartbeatInterval: 30000, // 30秒
    heartbeatTimeout: 5000, // 5秒
    connectionTimeout: 10000, // 10秒
    enableMessageQueue: true,
    maxMessageQueueSize: 100,
    enableCompression: false,
  };

  private constructor(config?: Partial<WebSocketConfig>) {
    this.config = { ...this.defaultConfig, ...config } as Required<WebSocketConfig>;
    this.currentRetryInterval = this.config.initialRetryInterval;

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<WebSocketConfig>): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService(config);
    }
    return WebSocketService.instance;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...config } as Required<WebSocketConfig>;
  }

  /**
   * 获取配置
   */
  getConfig(): Required<WebSocketConfig> {
    return { ...this.config };
  }

  /**
   * 获取连接状态
   */
  getState(): WebSocketConnectionState {
    return this.state;
  }

  /**
   * 获取统计信息
   */
  getStatistics(): WebSocketStatistics {
    return { ...this.statistics };
  }

  /**
   * 连接WebSocket
   */
  connect(): void {
    if (this.state === WSState.CONNECTING || this.state === WSState.CONNECTED) {
      console.warn('[WebSocketService] Already connected or connecting');
      return;
    }

    this.setState(WSState.CONNECTING);
    this.emitEvent(WSEventType.OPEN, { state: WSState.CONNECTING });

    try {
      this.ws = new WebSocket(this.config.url);

      // 设置连接超时
      const connectionTimeoutTimer = setTimeout(() => {
        if (this.state === WSState.CONNECTING) {
          console.error('[WebSocketService] Connection timeout');
          this.handleError(new Error('Connection timeout'));
        }
      }, this.config.connectionTimeout);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeoutTimer);
        this.handleOpen();
      };

      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeoutTimer);
        this.handleClose(event);
      };

      this.ws.onerror = (error) => {
        clearTimeout(connectionTimeoutTimer);
        this.handleError(error as Error | Event);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };

      console.log('[WebSocketService] Connecting to', this.config.url);
    } catch (error) {
      console.error('[WebSocketService] Connection failed:', error);
      this.handleError(error as Error | Event);
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    if (this.ws) {
      this.setState(WSState.CLOSED);
      this.ws.close();
      this.ws = null;
    }

    // 清理定时器
    this.cleanupTimers();
    console.log('[WebSocketService] Disconnected');
  }

  /**
   * 发送消息
   */
  send<T = unknown>(message: Partial<WebSocketMessage<T>>, queueIfOffline = true): boolean {
    const fullMessage: WebSocketMessage<T> = {
      type: message.type || WebSocketMessageType.DATA,
      id: message.id || uuidv4(),
      timestamp: Date.now(),
      ...message,
    };

    // 如果已连接，直接发送
    if (this.state === WSState.CONNECTED && this.ws) {
      try {
        const messageStr = JSON.stringify(fullMessage);
        this.ws.send(messageStr);

        // 更新统计
        this.statistics.messagesSent++;
        this.statistics.bytesSent += messageStr.length;
        this.updateAverageMessageSize();

        this.emitEvent(WSEventType.SEND, { data: { message: fullMessage } });
        return true;
      } catch (error) {
        console.error('[WebSocketService] Send failed:', error);
        this.handleError(error as Error | Event);
        return false;
      }
    }

    // 如果未连接且启用消息队列，加入队列
    if (queueIfOffline && this.config.enableMessageQueue) {
      this.addToQueue(fullMessage);
      return true;
    }

    console.warn('[WebSocketService] Cannot send message, not connected');
    return false;
  }

  /**
   * 添加事件监听器
   */
  on(event: WebSocketEventType, callback: (data: WebSocketEventData) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * 移除事件监听器
   */
  off(event: WebSocketEventType, callback: (data: WebSocketEventData) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * 处理连接打开
   */
  private handleOpen(): void {
    console.log('[WebSocketService] Connected');

    this.setState(WSState.CONNECTED);
    this.statistics.connectionTime = Date.now();
    this.statistics.lastConnectedTime = Date.now();
    this.retryCount = 0;
    this.currentRetryInterval = this.config.initialRetryInterval;
    this.isManualDisconnect = false;

    // 启动心跳
    this.startHeartbeat();

    // 处理消息队列
    if (this.config.enableMessageQueue) {
      this.processMessageQueue();
    }

    this.emitEvent(WSEventType.OPEN, { state: WSState.CONNECTED });
  }

  /**
   * 处理连接关闭
   */
  private handleClose(event: CloseEvent): void {
    console.log('[WebSocketService] Connection closed:', event.code, event.reason);

    // 如果是主动断开，不进行重连，状态已由disconnect()设置
    if (this.isManualDisconnect) {
      this.isManualDisconnect = false;
      this.statistics.disconnectCount++;
      this.stopHeartbeat();
      this.emitEvent(WSEventType.CLOSE, { data: { code: event.code, reason: event.reason } });
      return;
    }

    this.setState(WSState.DISCONNECTED);
    this.statistics.disconnectCount++;

    // 清理定时器
    this.stopHeartbeat();

    // 如果配置了自动重连，开始重连
    if (this.config.autoReconnect && this.retryCount < this.config.maxRetries) {
      this.scheduleReconnect();
    }

    this.emitEvent(WSEventType.CLOSE, { data: { code: event.code, reason: event.reason } });
  }

  /**
   * 处理错误
   */
  private handleError(error: Event | Error): void {
    console.error('[WebSocketService] Error:', error);

    this.statistics.errorCount++;
    this.statistics.lastErrorTime = Date.now();

    this.setState(WSState.ERROR);
    this.emitEvent(WSEventType.ERROR, { data: { error } });
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // 更新统计
      this.statistics.messagesReceived++;
      this.statistics.bytesReceived += event.data.length;
      this.updateAverageMessageSize();

      // 处理心跳消息
      if (message.type === WebSocketMessageType.HEARTBEAT) {
        this.handleHeartbeatResponse(message);
        return;
      }

      // 触发消息事件
      this.emitEvent(WSEventType.MESSAGE, { data: { message } });
    } catch (error) {
      console.error('[WebSocketService] Failed to parse message:', error);
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);

    console.log(
      `[WebSocketService] Heartbeat started (interval: ${this.config.heartbeatInterval}ms)`
    );
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  /**
   * 发送心跳
   */
  private sendHeartbeat(): void {
    const heartbeatMessage: WebSocketMessage = {
      type: WebSocketMessageType.HEARTBEAT,
      timestamp: Date.now(),
    };

    this.send(heartbeatMessage, false);

    // 设置心跳超时
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
    }
    this.heartbeatTimeoutTimer = setTimeout(() => {
      console.warn('[WebSocketService] Heartbeat timeout');
      this.handleHeartbeatTimeout();
    }, this.config.heartbeatTimeout);

    this.emitEvent(WSEventType.HEARTBEAT_SEND, {});
  }

  /**
   * 处理心跳响应
   */
  private handleHeartbeatResponse(_message: WebSocketMessage): void {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }

    this.emitEvent(WSEventType.HEARTBEAT_RECEIVE, {});
  }

  /**
   * 处理心跳超时
   */
  private handleHeartbeatTimeout(): void {
    this.emitEvent(WSEventType.HEARTBEAT_TIMEOUT, {});
    this.statistics.errorCount++;

    // 心跳超时，断开连接并重连
    if (this.ws) {
      this.ws.close();
    }
  }

  /**
   * 调度重连
   */
  private scheduleReconnect(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    this.setState(WSState.RECONNECTING);
    this.emitEvent(WSEventType.RECONNECT_START, {
      data: { retryCount: this.retryCount, retryInterval: this.currentRetryInterval },
    });

    console.log(
      `[WebSocketService] Reconnecting in ${this.currentRetryInterval}ms (attempt ${this.retryCount + 1}/${this.config.maxRetries})`
    );

    this.retryTimer = setTimeout(() => {
      this.reconnect();
    }, this.currentRetryInterval);
  }

  /**
   * 重连
   */
  private reconnect(): void {
    this.retryCount++;
    this.statistics.reconnectCount++;

    if (this.retryCount >= this.config.maxRetries) {
      console.error('[WebSocketService] Max retries reached');
      this.emitEvent(WSEventType.RECONNECT_FAILED, {
        data: { retryCount: this.retryCount },
      });
      this.setState(WSState.ERROR);
      return;
    }

    // 指数退避
    this.currentRetryInterval = Math.min(
      this.currentRetryInterval * this.config.retryBackoffFactor,
      this.config.maxRetryInterval
    );

    this.connect();
  }

  /**
   * 获取重试策略
   */
  getRetryStrategy(): RetryStrategy {
    return {
      currentAttempt: this.retryCount,
      nextRetryTime: Date.now() + this.currentRetryInterval,
      retryInterval: this.currentRetryInterval,
      shouldRetry: this.retryCount < this.config.maxRetries,
    };
  }

  /**
   * 添加到消息队列
   */
  private addToQueue(message: WebSocketMessage): void {
    // 如果队列已满，移除最旧的消息
    if (this.messageQueue.length >= this.config.maxMessageQueueSize) {
      this.messageQueue.shift();
    }

    const queueItem: MessageQueueItem = {
      id: uuidv4(),
      message,
      timestamp: Date.now(),
      retryCount: 0,
      priority: 1,
    };

    this.messageQueue.push(queueItem);
    console.log(`[WebSocketService] Message queued (${this.messageQueue.length} in queue)`);
  }

  /**
   * 处理消息队列
   */
  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0 && this.state === WSState.CONNECTED) {
      const queueItem = this.messageQueue.shift()!;
      const success = this.send(queueItem.message, false);

      if (!success) {
        // 发送失败，重新加入队列
        if (queueItem.retryCount < 3) {
          queueItem.retryCount++;
          this.messageQueue.unshift(queueItem);
        } else {
          console.warn('[WebSocketService] Message dropped after 3 retries');
        }
      }

      // 短暂延迟，避免阻塞
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    this.isProcessingQueue = false;
  }

  /**
   * 清理定时器
   */
  private cleanupTimers(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.stopHeartbeat();
  }

  /**
   * 设置状态
   */
  private setState(newState: WebSocketConnectionState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.emitEvent(WSEventType.STATE_CHANGE, {
        state: newState,
        data: { oldState, newState },
      });
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(type: WebSocketEventType, data?: Record<string, unknown>): void {
    const eventData: WebSocketEventData = {
      type,
      timestamp: Date.now(),
      state: this.state,
      data,
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(eventData);
        } catch (error) {
          console.error(`[WebSocketService] Event callback error:`, error);
        }
      });
    }
  }

  /**
   * 更新平均消息大小
   */
  private updateAverageMessageSize(): void {
    const totalMessages = this.statistics.messagesSent + this.statistics.messagesReceived;
    const totalBytes = this.statistics.bytesSent + this.statistics.bytesReceived;
    this.statistics.averageMessageSize = totalBytes / totalMessages;
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.disconnect();
    this.eventListeners.clear();
    this.messageQueue = [];
    console.log('[WebSocketService] Service destroyed');
  }
}
