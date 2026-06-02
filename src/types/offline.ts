/**
 * @file offline.ts
 * @description YYC³便携式智能AI系统 - 离线降级相关类型定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags type,offline,degradation,configuration
 */

/**
 * 离线状态枚举
 */
export enum OfflineState {
  /** 在线 - 完全在线，所有功能可用 */
  ONLINE = 'online',
  /** 离线 - 完全离线，只使用本地缓存 */
  OFFLINE = 'offline',
  /** 降级 - 部分功能不可用，使用降级策略 */
  DEGRADED = 'degraded',
  /** 同步中 - 正在从离线恢复到在线 */
  SYNCING = 'syncing',
  /** 重连中 - 正在尝试重新连接 */
  RECONNECTING = 'reconnecting',
}

/**
 * 降级策略类型枚举
 */
export enum DegradationStrategy {
  /** 静默降级 - 不显示错误，使用本地数据 */
  SILENT = 'silent',
  /** 警告降级 - 显示警告消息，使用本地数据 */
  WARNING = 'warning',
  /** 错误降级 - 显示错误消息，阻止操作 */
  ERROR = 'error',
  /** 队列降级 - 将操作加入队列，等待在线时执行 */
  QUEUE = 'queue',
  /** 重试降级 - 自动重试失败的操作 */
  RETRY = 'retry',
}

/**
 * 功能可用性枚举
 */
export enum FeatureAvailability {
  /** 完全可用 */
  AVAILABLE = 'available',
  /** 降级可用 */
  DEGRADED = 'degraded',
  /** 不可用 */
  UNAVAILABLE = 'unavailable',
  /** 需要同步 */
  SYNC_REQUIRED = 'sync_required',
}

/**
 * 操作类型枚举
 */
export enum OfflineOperationType {
  /** 创建操作 */
  CREATE = 'create',
  /** 更新操作 */
  UPDATE = 'update',
  /** 删除操作 */
  DELETE = 'delete',
  /** 查询操作 */
  QUERY = 'query',
  /** 同步操作 */
  SYNC = 'sync',
  /** 批量操作 */
  BATCH = 'batch',
}

/**
 * 离线配置接口
 */
export interface OfflineConfig {
  /** 是否启用离线模式 */
  enabled: boolean
  /** 是否自动检测在线状态 */
  autoDetectOnline: boolean
  /** 在线检测间隔（毫秒） */
  onlineCheckInterval: number
  /** 离线操作队列最大长度 */
  maxQueueSize: number
  /** 操作重试次数 */
  maxRetryCount: number
  /** 操作重试间隔（毫秒） */
  retryInterval: number
  /** 是否启用自动同步 */
  autoSyncEnabled: boolean
  /** 自动同步间隔（毫秒） */
  autoSyncInterval: number
  /** 默认降级策略 */
  defaultDegradationStrategy: DegradationStrategy
  /** 功能降级策略映射 */
  featureStrategies: Record<string, DegradationStrategy>
  /** 是否显示离线通知 */
  showOfflineNotification: boolean
  /** 通知显示时长（毫秒） */
  notificationDuration: number
  /** 是否记录离线日志 */
  enableLogging: boolean
}

/**
 * 离线操作接口
 */
export interface OfflineOperation {
  /** 操作ID */
  id: string
  /** 操作类型 */
  type: OfflineOperationType
  /** 资源类型 */
  resource: string
  /** 资源ID */
  resourceId?: string
  /** 操作数据 */
  data: unknown
  /** 优先级 */
  priority: number
  /** 重试次数 */
  retryCount: number
  /** 最大重试次数 */
  maxRetryCount: number
  /** 创建时间 */
  createdAt: number
  /** 最后执行时间 */
  lastExecutedAt?: number
  /** 状态 */
  status: OfflineOperationStatus
  /** 错误信息 */
  error?: string
  /** 降级策略 */
  strategy: DegradationStrategy
}

/**
 * 离线操作状态枚举
 */
export enum OfflineOperationStatus {
  /** 待处理 */
  PENDING = 'pending',
  /** 处理中 */
  PROCESSING = 'processing',
  /** 成功 */
  SUCCESS = 'success',
  /** 失败 */
  FAILED = 'failed',
  /** 已取消 */
  CANCELLED = 'cancelled',
}

/**
 * 离线状态信息接口
 */
export interface OfflineStatus {
  /** 当前离线状态 */
  state: OfflineState
  /** 在线状态 */
  isOnline: boolean
  /** 网络延迟（毫秒） */
  latency?: number
  /** 网络质量 */
  networkQuality?: NetworkQuality
  /** 队列中的操作数量 */
  queuedOperations: number
  /** 成功的操作数量 */
  succeededOperations: number
  /** 失败的操作数量 */
  failedOperations: number
  /** 最后更新时间 */
  lastUpdated: number
  /** 下次在线检测时间 */
  nextOnlineCheck?: number
}

/**
 * 网络质量枚举
 */
export enum NetworkQuality {
  /** 优秀 */
  EXCELLENT = 'excellent',
  /** 良好 */
  GOOD = 'good',
  /** 一般 */
  FAIR = 'fair',
  /** 较差 */
  POOR = 'poor',
  /** 未知 */
  UNKNOWN = 'unknown',
}

/**
 * 功能状态接口
 */
export interface FeatureStatus {
  /** 功能名称 */
  name: string
  /** 功能ID */
  id: string
  /** 可用性 */
  availability: FeatureAvailability
  /** 降级策略 */
  strategy: DegradationStrategy
  /** 最后检查时间 */
  lastChecked: number
  /** 离线是否可用 */
  availableOffline: boolean
  /** 本地缓存状态 */
  cacheStatus?: CacheStatus
}

/**
 * 缓存状态接口
 */
export interface CacheStatus {
  /** 是否有缓存 */
  hasCache: boolean
  /** 缓存大小（字节） */
  cacheSize: number
  /** 缓存时间 */
  cachedAt?: number
  /** 是否过期 */
  isExpired: boolean
}

/**
 * 离线统计信息接口
 */
export interface OfflineStatistics {
  /** 总离线时长（毫秒） */
  totalOfflineTime: number
  /** 总离线次数 */
  totalOfflineCount: number
  /** 总队列操作数 */
  totalQueueOperations: number
  /** 成功操作数 */
  successOperations: number
  /** 失败操作数 */
  failedOperations: number
  /** 平均队列大小 */
  averageQueueSize: number
  /** 最大队列大小 */
  maxQueueSize: number
  /** 当前队列大小 */
  currentQueueSize: number
  /** 最后离线时间 */
  lastOfflineTime?: number
  /** 最后在线时间 */
  lastOnlineTime?: number
  /** 最后同步时间 */
  lastSyncTime?: number
}

/**
 * 离线事件类型枚举
 */
export enum OfflineEventType {
  /** 离线状态变化 */
  STATE_CHANGED = 'state_changed',
  /** 在线 */
  ONLINE = 'online',
  /** 离线 */
  OFFLINE = 'offline',
  /** 降级 */
  DEGRADED = 'degraded',
  /** 同步开始 */
  SYNC_START = 'sync_start',
  /** 同步完成 */
  SYNC_COMPLETE = 'sync_complete',
  /** 同步失败 */
  SYNC_FAILED = 'sync_failed',
  /** 操作入队 */
  OPERATION_QUEUED = 'operation_queued',
  /** 操作成功 */
  OPERATION_SUCCESS = 'operation_success',
  /** 操作失败 */
  OPERATION_FAILED = 'operation_failed',
  /** 网络质量变化 */
  NETWORK_QUALITY_CHANGED = 'network_quality_changed',
}

/**
 * 离线事件数据接口
 */
export interface OfflineEventData {
  /** 事件类型 */
  type: OfflineEventType
  /** 时间戳 */
  timestamp: number
  /** 旧状态 */
  oldState?: OfflineState
  /** 新状态 */
  newState?: OfflineState
  /** 操作ID */
  operationId?: string
  /** 操作类型 */
  operationType?: OfflineOperationType
  /** 错误信息 */
  error?: unknown
  /** 网络质量 */
  networkQuality?: NetworkQuality
  /** 额外数据 */
  data?: any
}

/**
 * 离线事件监听器类型
 */
export type OfflineEventListener = (data: OfflineEventData) => void

/**
 * 离线降级结果接口
 */
export interface OfflineDegradationResult {
  /** 是否成功 */
  success: boolean
  /** 是否降级 */
  degraded: boolean
  /** 降级策略 */
  strategy: DegradationStrategy
  /** 操作是否已入队 */
  queued: boolean
  /** 操作ID */
  operationId?: string
  /** 错误信息 */
  error?: unknown
  /** 本地数据 */
  localData?: unknown
  /** 额外信息 */
  meta?: unknown
}
