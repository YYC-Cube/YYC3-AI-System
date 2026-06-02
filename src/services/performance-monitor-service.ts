/**
 * @file performance-monitor-service.ts
 * @description YYC³便携式智能AI系统 - 性能监控服务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,performance,monitoring
 */

/**
 * Performance API 类型扩展
 */
interface LargestContentfulPaintEntry extends PerformanceEntry {
  startTime: number
  size: number
  element: Element | null
  id: string
  url: string
}

interface FirstInputEntry extends PerformanceEntry {
  startTime: number
  processingStart: number
  processingEnd: number
  duration: number
  name: string
  cancelable: boolean
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
  lastInputTime: number
  sources: Array<{ node: Node | null; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }>
}

interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory
}

/**
 * 性能指标类型定义
 */

export interface PerformanceMetrics {
  // 核心指标
  fcp: number // First Contentful Paint (ms)
  lcp: number // Largest Contentful Paint (ms)
  fid: number // First Input Delay (ms)
  cls: number // Cumulative Layout Shift (score)
  ttfb: number // Time to First Byte (ms)
  
  // 自定义指标
  pageLoadTime: number // 页面加载时间 (ms)
  firstRenderTime: number // 首次渲染时间 (ms)
  interactiveTime: number // 可交互时间 (ms)
  
  // 资源指标
  resourceCount: number // 资源数量
  resourceSize: number // 资源大小 (bytes)
  scriptCount: number // 脚本数量
  scriptSize: number // 脚本大小 (bytes)
  
  // 内存指标
  usedMemory: number // 已用内存 (MB)
  totalMemory: number // 总内存 (MB)
  memoryLimit: number // 内存限制 (MB)
  
  // 渲染指标
  frameRate: number // 帧率 (fps)
  droppedFrames: number // 掉帧数
  longTasks: number // 长任务数量
  
  // 时间戳
  timestamp: number // 记录时间戳
}

export interface PerformanceThreshold {
  fcp: { warning: number, critical: number }
  lcp: { warning: number, critical: number }
  fid: { warning: number, critical: number }
  cls: { warning: number, critical: number }
  ttfb: { warning: number, critical: number }
  pageLoadTime: { warning: number, critical: number }
  frameRate: { warning: number, critical: number }
}

export interface PerformanceWarning {
  type: 'warning' | 'critical'
  metric: keyof PerformanceMetrics
  value: number
  threshold: number
  timestamp: number
}

export interface PerformanceHistory {
  metrics: PerformanceMetrics[]
  warnings: PerformanceWarning[]
  summary: {
    avgFCP: number
    avgLCP: number
    avgFID: number
    avgCLS: number
    avgPageLoadTime: number
    avgFrameRate: number
    warningCount: number
    criticalCount: number
  }
}

export type PerformanceEventType = 'metric' | 'warning' | 'threshold'

export interface PerformanceEventData {
  type: PerformanceEventType
  data: PerformanceMetrics | PerformanceWarning | PerformanceThreshold
  timestamp: number
}

export interface PerformanceConfig {
  enableMetrics: boolean
  enableWarnings: boolean
  enableHistory: boolean
  historyLimit: number
  enableAutoReport: boolean
  reportInterval: number
  thresholds: PerformanceThreshold
}

/**
 * 性能监控服务类
 * 提供核心性能指标收集、分析和可视化功能
 */
class PerformanceMonitorService {
  private static instance: PerformanceMonitorService | null = null
  
  private config: PerformanceConfig = {
    enableMetrics: true,
    enableWarnings: true,
    enableHistory: true,
    historyLimit: 100,
    enableAutoReport: false,
    reportInterval: 30000,
    thresholds: {
      fcp: { warning: 1800, critical: 3000 },
      lcp: { warning: 2500, critical: 4000 },
      fid: { warning: 100, critical: 300 },
      cls: { warning: 0.1, critical: 0.25 },
      ttfb: { warning: 600, critical: 800 },
      pageLoadTime: { warning: 2500, critical: 3500 },
      frameRate: { warning: 50, critical: 30 },
    }
  }
  
  private history: PerformanceMetrics[] = []
  private warnings: PerformanceWarning[] = []
  private listeners: Map<string, (data: PerformanceEventData) => void> = new Map()
  private reportTimer: NodeJS.Timeout | null = null
  private metricsObserver: PerformanceObserver | null = null
  private frameRateMonitor: number | null = null
  private lastFrameTime: number = 0
  private frameCount: number = 0
  private droppedFrames: number = 0
  private isInitialized: boolean = false
  
  private constructor() {}
  
  /**
   * 获取单例实例
   */
  static getInstance(): PerformanceMonitorService {
    if (!PerformanceMonitorService.instance) {
      PerformanceMonitorService.instance = new PerformanceMonitorService()
    }
    return PerformanceMonitorService.instance
  }
  
  /**
   * 初始化性能监控服务
   */
  async initialize(config?: Partial<PerformanceConfig>): Promise<void> {
    if (this.isInitialized) {
      console.warn('[PerformanceMonitor] Service already initialized')
      return
    }
    
    // 合并配置
    if (config) {
      this.config = { ...this.config, ...config }
    }
    
    try {
      // 初始化Web Vitals观察器
      await this.setupPerformanceObserver()
      
      // 初始化帧率监控
      this.setupFrameRateMonitor()
      
      // 初始化自动报告
      if (this.config.enableAutoReport) {
        this.startAutoReport()
      }
      
      this.isInitialized = true
      console.log('[PerformanceMonitor] Service initialized successfully')
      
      // 触发初始化事件
      this.emit('initialized', {
        type: 'metric',
        data: this.getCurrentMetrics(),
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to initialize:', error)
      throw error
    }
  }
  
  /**
   * 设置PerformanceObserver
   */
  private async setupPerformanceObserver(): Promise<void> {
    if (!('PerformanceObserver' in window)) {
      console.warn('[PerformanceMonitor] PerformanceObserver not supported')
      return
    }
    
    this.metricsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processPerformanceEntry(entry)
      }
    })
    
    // 观察所有性能指标
    try {
      this.metricsObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation', 'resource'] })
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to observe performance entries:', error)
    }
  }
  
  /**
   * 处理性能条目
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    if (entry.entryType === 'paint') {
      const paintEntry = entry as PerformancePaintTiming
      if (paintEntry.name === 'first-contentful-paint') {
        this.updateMetric('fcp', paintEntry.startTime)
      }
    } else if (entry.entryType === 'largest-contentful-paint') {
      const lcpEntry = entry as LargestContentfulPaintEntry
      this.updateMetric('lcp', lcpEntry.startTime)
    } else if (entry.entryType === 'first-input') {
      const fidEntry = entry as FirstInputEntry
      this.updateMetric('fid', fidEntry.processingStart - fidEntry.startTime)
    } else if (entry.entryType === 'layout-shift') {
      const clsEntry = entry as LayoutShiftEntry
      if (!clsEntry.hadRecentInput) {
        this.updateMetric('cls', (this.getCurrentMetrics().cls || 0) + clsEntry.value)
      }
    } else if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming
      this.updateMetric('ttfb', navEntry.responseStart - navEntry.requestStart)
      this.updateMetric('pageLoadTime', navEntry.loadEventEnd - navEntry.startTime)
    } else if (entry.entryType === 'resource') {
      this.updateResourceMetrics()
    }
  }
  
  /**
   * 更新资源指标
   */
  private updateResourceMetrics(): void {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const resourceCount = resources.length
    const resourceSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
    const scripts = resources.filter(r => r.initiatorType === 'script')
    
    this.updateMetric('resourceCount', resourceCount)
    this.updateMetric('resourceSize', resourceSize)
    this.updateMetric('scriptCount', scripts.length)
    this.updateMetric('scriptSize', scripts.reduce((sum, s) => sum + (s.transferSize || 0), 0))
  }
  
  /**
   * 设置帧率监控
   */
  private setupFrameRateMonitor(): void {
    this.lastFrameTime = performance.now()
    this.frameCount = 0
    this.droppedFrames = 0
    
    const measureFrameRate = () => {
      const now = performance.now()
      const delta = now - this.lastFrameTime
      this.frameCount++
      
      // 如果帧间隔大于33.3ms（30fps），则视为掉帧
      if (delta > 33.3) {
        this.droppedFrames++
      }
      
      // 每秒更新一次帧率
      if (now - this.lastFrameTime >= 1000) {
        const fps = this.frameCount
        this.updateMetric('frameRate', fps)
        this.updateMetric('droppedFrames', this.droppedFrames)
        
        // 检查长任务
        const longTasks = performance.getEntriesByType('longtask')
        this.updateMetric('longTasks', longTasks.length)
        
        // 重置计数器
        this.frameCount = 0
        this.droppedFrames = 0
        this.lastFrameTime = now
      }
      
      this.frameRateMonitor = requestAnimationFrame(measureFrameRate)
    }
    
    this.frameRateMonitor = requestAnimationFrame(measureFrameRate)
  }
  
  /**
   * 更新指标
   */
  private updateMetric(metric: keyof PerformanceMetrics, value: number): void {
    const currentMetrics = this.getCurrentMetrics()
    ;(currentMetrics as unknown as Record<string, number>)[metric] = value
    currentMetrics.timestamp = Date.now()
    
    // 检查阈值
    this.checkThresholds(metric, value)
    
    // 保存历史
    if (this.config.enableHistory) {
      this.history.push({ ...currentMetrics })
      if (this.history.length > this.config.historyLimit) {
        this.history.shift()
      }
    }
    
    // 触发事件
    this.emit('metric', {
      type: 'metric',
      data: currentMetrics,
      timestamp: Date.now()
    })
  }
  
  /**
   * 检查阈值
   */
  private checkThresholds(metric: keyof PerformanceMetrics, value: number): void {
    if (!this.config.enableWarnings) return
    
    const threshold = this.config.thresholds[metric as keyof PerformanceThreshold]
    if (!threshold) return
    
    if (value >= threshold.critical) {
      const warning: PerformanceWarning = {
        type: 'critical',
        metric: metric as PerformanceWarning['metric'],
        value,
        threshold: threshold.critical,
        timestamp: Date.now()
      }
      this.warnings.push(warning)
      this.emit('warning', {
        type: 'warning',
        data: warning,
        timestamp: Date.now()
      })
    } else if (value >= threshold.warning) {
      const warning: PerformanceWarning = {
        type: 'warning',
        metric: metric as PerformanceWarning['metric'],
        value,
        threshold: threshold.warning,
        timestamp: Date.now()
      }
      this.warnings.push(warning)
      this.emit('warning', {
        type: 'warning',
        data: warning,
        timestamp: Date.now()
      })
    }
  }
  
  /**
   * 获取当前指标
   */
  getCurrentMetrics(): PerformanceMetrics {
    return {
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      ttfb: 0,
      pageLoadTime: 0,
      firstRenderTime: 0,
      interactiveTime: 0,
      resourceCount: 0,
      resourceSize: 0,
      scriptCount: 0,
      scriptSize: 0,
      usedMemory: this.getMemoryMetrics().used,
      totalMemory: this.getMemoryMetrics().total,
      memoryLimit: this.getMemoryMetrics().limit,
      frameRate: 60,
      droppedFrames: 0,
      longTasks: 0,
      timestamp: Date.now()
    }
  }
  
  /**
   * 获取内存指标
   */
  private getMemoryMetrics() {
    if ('memory' in performance) {
      const memory = (performance as PerformanceWithMemory).memory
      if (memory) {
        return {
          used: memory.usedJSHeapSize / 1024 / 1024,
          total: memory.totalJSHeapSize / 1024 / 1024,
          limit: memory.jsHeapSizeLimit / 1024 / 1024
        }
      }
    }
    return { used: 0, total: 0, limit: 0 }
  }
  
  /**
   * 获取历史记录
   */
  getHistory(limit?: number): PerformanceHistory {
    const metrics = limit ? this.history.slice(-limit) : this.history
    const warnings = limit ? this.warnings.slice(-limit) : this.warnings
    
    const summary = this.calculateSummary(metrics)
    
    return { metrics, warnings, summary }
  }
  
  /**
   * 计算摘要
   */
  private calculateSummary(metrics: PerformanceMetrics[]): PerformanceHistory['summary'] {
    if (metrics.length === 0) {
      return {
        avgFCP: 0,
        avgLCP: 0,
        avgFID: 0,
        avgCLS: 0,
        avgPageLoadTime: 0,
        avgFrameRate: 60,
        warningCount: 0,
        criticalCount: 0
      }
    }
    
    const sum = metrics.reduce((acc, m) => ({
      fcp: acc.fcp + m.fcp,
      lcp: acc.lcp + m.lcp,
      fid: acc.fid + m.fid,
      cls: acc.cls + m.cls,
      pageLoadTime: acc.pageLoadTime + m.pageLoadTime,
      frameRate: acc.frameRate + m.frameRate
    }), { fcp: 0, lcp: 0, fid: 0, cls: 0, pageLoadTime: 0, frameRate: 0 })
    
    const criticalCount = this.warnings.filter(w => w.type === 'critical').length
    const warningCount = this.warnings.filter(w => w.type === 'warning').length
    
    return {
      avgFCP: sum.fcp / metrics.length,
      avgLCP: sum.lcp / metrics.length,
      avgFID: sum.fid / metrics.length,
      avgCLS: sum.cls / metrics.length,
      avgPageLoadTime: sum.pageLoadTime / metrics.length,
      avgFrameRate: sum.frameRate / metrics.length,
      warningCount,
      criticalCount
    }
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config }
    
    // 如果启用了自动报告且没有定时器，则启动
    if (this.config.enableAutoReport && !this.reportTimer) {
      this.startAutoReport()
    }
    
    // 如果禁用了自动报告且有定时器，则停止
    if (!this.config.enableAutoReport && this.reportTimer) {
      this.stopAutoReport()
    }
  }
  
  /**
   * 获取配置
   */
  getConfig(): Readonly<PerformanceConfig> {
    return this.config
  }
  
  /**
   * 开始自动报告
   */
  private startAutoReport(): void {
    this.reportTimer = setInterval(() => {
      this.emit('metric', {
        type: 'metric',
        data: this.getCurrentMetrics(),
        timestamp: Date.now()
      })
    }, this.config.reportInterval)
  }
  
  /**
   * 停止自动报告
   */
  private stopAutoReport(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer)
      this.reportTimer = null
    }
  }
  
  /**
   * 添加事件监听器
   */
  on(event: string, listener: (data: PerformanceEventData) => void): void {
    this.listeners.set(event, listener)
  }
  
  /**
   * 移除事件监听器
   */
  off(event: string): void {
    this.listeners.delete(event)
  }
  
  /**
   * 触发事件
   */
  private emit(event: string, data: PerformanceEventData): void {
    const listener = this.listeners.get(event)
    if (listener) {
      listener(data)
    }
  }
  
  /**
   * 清空历史
   */
  clearHistory(): void {
    this.history = []
    this.warnings = []
  }
  
  /**
   * 销毁服务
   */
  destroy(): void {
    // 停止自动报告
    this.stopAutoReport()
    
    // 停止帧率监控
    if (this.frameRateMonitor) {
      cancelAnimationFrame(this.frameRateMonitor)
      this.frameRateMonitor = null
    }
    
    // 断开观察器
    if (this.metricsObserver) {
      this.metricsObserver.disconnect()
      this.metricsObserver = null
    }
    
    // 清空监听器
    this.listeners.clear()
    
    // 清空历史
    this.clearHistory()
    
    this.isInitialized = false
    console.log('[PerformanceMonitor] Service destroyed')
  }
}

// 导出单例
export const performanceMonitorService = PerformanceMonitorService.getInstance()
