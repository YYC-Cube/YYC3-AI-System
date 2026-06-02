/**
 * @file websocket.ts
 * @description YYC³便携式智能AI系统 - WebSocket相关类型定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags types,websocket,connection,realtime
 */

/**
 * WebSocket连接状态
 */
export enum WebSocketConnectionState {
  /** 未连接 */
  DISCONNECTED = 'disconnected',
  /** 连接中 */
  CONNECTING = 'connecting',
  /** 已连接 */
  CONNECTED = 'connected',
  /** 重连中 */
  RECONNECTING = 'reconnecting',
  /** 关闭 */
  CLOSED = 'closed',
  /** 错误 */
  ERROR = 'error',
}

/**
 * WebSocket消息类型
 */
export enum WebSocketMessageType {
  /** 心跳 */
  HEARTBEAT = 'heartbeat',
  /** 数据传输 */
  DATA = 'data',
  /** 错误 */
  ERROR = 'error',
  /** 确认 */
  ACK = 'ack',
  /** 订阅 */
  SUBSCRIBE = 'subscribe',
  /** 取消订阅 */
  UNSUBSCRIBE = 'unsubscribe',
  /** 广播 */
  BROADCAST = 'broadcast',
  /** 私聊 */
  PRIVATE = 'private',
}

/**
 * WebSocket消息
 */
export interface WebSocketMessage<T = unknown> {
  /** 消息类型 */
  type: WebSocketMessageType;
  /** 消息ID */
  id?: string;
  /** 发送者ID */
  sender?: string;
  /** 接收者ID */
  receiver?: string;
  /** 消息数据 */
  data?: T;
  /** 时间戳 */
  timestamp: number;
  /** 元数据 */
  meta?: Record<string, unknown>;
}

/**
 * WebSocket配置
 */
export interface WebSocketConfig {
  /** WebSocket服务器URL */
  url: string;
  /** 是否自动连接 */
  autoConnect?: boolean;
  /** 是否自动重连 */
  autoReconnect?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 初始重试间隔（毫秒） */
  initialRetryInterval?: number;
  /** 最大重试间隔（毫秒） */
  maxRetryInterval?: number;
  /** 重试退避因子 */
  retryBackoffFactor?: number;
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number;
  /** 心跳超时（毫秒） */
  heartbeatTimeout?: number;
  /** 连接超时（毫秒） */
  connectionTimeout?: number;
  /** 是否启用消息队列 */
  enableMessageQueue?: boolean;
  /** 消息队列最大长度 */
  maxMessageQueueSize?: number;
  /** 是否启用压缩 */
  enableCompression?: boolean;
}

/**
 * WebSocket事件类型
 */
export enum WebSocketEventType {
  /** 连接打开 */
  OPEN = 'open',
  /** 连接关闭 */
  CLOSE = 'close',
  /** 连接错误 */
  ERROR = 'error',
  /** 消息接收 */
  MESSAGE = 'message',
  /** 消息发送 */
  SEND = 'send',
  /** 重连开始 */
  RECONNECT_START = 'reconnect_start',
  /** 重连成功 */
  RECONNECT_SUCCESS = 'reconnect_success',
  /** 重连失败 */
  RECONNECT_FAILED = 'reconnect_failed',
  /** 心跳发送 */
  HEARTBEAT_SEND = 'heartbeat_send',
  /** 心跳接收 */
  HEARTBEAT_RECEIVE = 'heartbeat_receive',
  /** 心跳超时 */
  HEARTBEAT_TIMEOUT = 'heartbeat_timeout',
  /** 状态变化 */
  STATE_CHANGE = 'state_change',
}

/**
 * WebSocket事件数据
 */
export interface WebSocketEventData {
  type: WebSocketEventType;
  timestamp: number;
  state?: WebSocketConnectionState;
  data?: Record<string, unknown>;
}

/**
 * WebSocket统计信息
 */
export interface WebSocketStatistics {
  /** 连接时间 */
  connectionTime: number;
  /** 最后连接时间 */
  lastConnectedTime: number;
  /** 断开连接次数 */
  disconnectCount: number;
  /** 重连次数 */
  reconnectCount: number;
  /** 发送消息数 */
  messagesSent: number;
  /** 接收消息数 */
  messagesReceived: number;
  /** 发送字节数 */
  bytesSent: number;
  /** 接收字节数 */
  bytesReceived: number;
  /** 平均消息大小（字节） */
  averageMessageSize: number;
  /** 错误次数 */
  errorCount: number;
  /** 最后错误时间 */
  lastErrorTime: number;
}

/**
 * 重试策略
 */
export interface RetryStrategy {
  /** 当前重试次数 */
  currentAttempt: number;
  /** 下次重试时间 */
  nextRetryTime: number;
  /** 重试间隔 */
  retryInterval: number;
  /** 是否应该重试 */
  shouldRetry: boolean;
}

/**
 * 消息队列项
 */
export interface MessageQueueItem {
  id: string;
  message: WebSocketMessage;
  timestamp: number;
  retryCount: number;
  priority: number;
}
