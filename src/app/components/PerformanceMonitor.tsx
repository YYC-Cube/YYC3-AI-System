/**
 * @file PerformanceMonitor.tsx
 * @description YYC³便携式智能AI系统 - 性能监控可视化组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,performance,monitor,ui
 */

import { clsx, type ClassValue } from 'clsx'
import {
  Activity, AlertTriangle, XCircle, TrendingUp,
  TrendingDown, Clock, Cpu, HardDrive, Gauge, RefreshCw,
  BarChart3, Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { twMerge } from 'tailwind-merge'

import { performanceMonitorService, PerformanceMetrics, PerformanceHistory, PerformanceWarning } from '../../services/performance-monitor-service'
import { useAppStore } from '../store'
import { getThemeTokens } from '../utils/theme'


// ── Utility ──
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Metric Card Component ──
interface MetricCardProps {
  title: string
  value: number
  unit: string
  threshold: { warning: number, critical: number }
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
}

function MetricCard({ title, value, unit, threshold, icon, trend }: MetricCardProps) {
  const { theme } = useAppStore()
  const t = getThemeTokens(theme)
  
  const getStatus = () => {
    if (value >= threshold.critical) return 'critical'
    if (value >= threshold.warning) return 'warning'
    return 'good'
  }
  
  const status = getStatus()
  
  const statusColors = {
    good: 'text-emerald-400',
    warning: 'text-amber-400',
    critical: 'text-red-400'
  }
  
  const bgColors = {
    good: 'bg-emerald-500/10',
    warning: 'bg-amber-500/10',
    critical: 'bg-red-500/10'
  }
  
  const trendIcons = {
    up: <TrendingUp className="w-3 h-3 text-emerald-400" />,
    down: <TrendingDown className="w-3 h-3 text-red-400" />,
    stable: <Activity className="w-3 h-3 text-slate-400" />
  }
  
  return (
    <div className={`p-4 rounded-xl border ${bgColors[status]} ${t.isDark ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bgColors[status])}>
            {icon}
          </div>
          <span className={`text-[11px] font-medium ${statusColors[status]}`}>{title}</span>
        </div>
        {trend && trendIcons[trend]}
      </div>
      <div className="flex items-baseline space-x-1">
        <span className={`text-2xl font-bold ${statusColors[status]}`}>
          {typeof value === 'number' ? value.toFixed(value >= 100 ? 0 : 2) : value}
        </span>
        <span className={`text-xs ${statusColors[status]} opacity-70`}>{unit}</span>
      </div>
    </div>
  )
}

// ── Performance Monitor Component ──
export function PerformanceMonitor() {
  const { theme } = useAppStore()
  const t = getThemeTokens(theme)
  
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null)
  const [history, setHistory] = useState<PerformanceHistory | null>(null)
  const [warnings, setWarnings] = useState<PerformanceWarning[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [isMonitoring, setIsMonitoring] = useState(false)
  
  // 初始化性能监控
  useEffect(() => {
    const init = async () => {
      try {
        await performanceMonitorService.initialize({
          enableMetrics: true,
          enableWarnings: true,
          enableHistory: true,
          historyLimit: 100,
          enableAutoReport: true,
          reportInterval: 5000
        })
        setIsMonitoring(true)
        
        // 监听指标更新
        performanceMonitorService.on('metric', (data) => {
          setCurrentMetrics(data.data as PerformanceMetrics)
        })
        
        // 监听警告
        performanceMonitorService.on('warning', (data) => {
          setWarnings(prev => [...prev, data.data as PerformanceWarning])
        })
        
        // 获取初始指标
        setCurrentMetrics(performanceMonitorService.getCurrentMetrics())
      } catch (error) {
        console.error('[PerformanceMonitor] Failed to initialize:', error)
      }
    }
    
    init()
    
    return () => {
      performanceMonitorService.off('metric')
      performanceMonitorService.off('warning')
    }
  }, [])
  
  // 刷新历史数据
  const refreshHistory = useCallback(() => {
    const historyData = performanceMonitorService.getHistory()
    setHistory(historyData)
    setWarnings(historyData.warnings)
  }, [])
  
  // 刷新当前指标
  const refreshMetrics = useCallback(() => {
    setCurrentMetrics(performanceMonitorService.getCurrentMetrics())
  }, [])
  
  // 切换详细信息
  const toggleDetails = useCallback(() => {
    setShowDetails(!showDetails)
    if (!showDetails) {
      refreshHistory()
    }
  }, [showDetails, refreshHistory])
  
  // 计算性能分数
  const performanceScore = useMemo(() => {
    if (!history?.summary) return 0
    
    const { avgFCP, avgLCP, avgFID, avgCLS, avgPageLoadTime } = history.summary
    
    // 基于Google Core Web Vitals计算分数
    const fcpScore = Math.max(0, 100 - (avgFCP / 1800) * 100)
    const lcpScore = Math.max(0, 100 - (avgLCP / 2500) * 100)
    const fidScore = Math.max(0, 100 - (avgFID / 100) * 100)
    const clsScore = Math.max(0, 100 - (avgCLS / 0.1) * 100)
    const loadScore = Math.max(0, 100 - (avgPageLoadTime / 2500) * 100)
    
    return Math.round((fcpScore + lcpScore + fidScore + clsScore + loadScore) / 5)
  }, [history])
  
  if (!currentMetrics) {
    return (
      <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-900/50' : 'bg-white/50'} border ${t.border.subtle}`}>
        <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Initializing performance monitor...</span>
        </div>
      </div>
    )
  }
  
  const thresholds = performanceMonitorService.getConfig().thresholds
  
  return (
    <div className={`rounded-xl border ${t.isDark ? 'bg-slate-900/50' : 'bg-white/50'} ${t.border.subtle}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${t.text.primary}`}>
                Performance Monitor
              </h3>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className={`text-[10px] ${t.text.muted}`}>
                  Status: {isMonitoring ? 'Active' : 'Inactive'}
                </span>
                {isMonitoring && (
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] text-emerald-400">LIVE</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshMetrics}
              className={`p-2 rounded-lg ${t.isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100/50'} transition-colors`}
              title="Refresh metrics"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={toggleDetails}
              className={`p-2 rounded-lg ${t.isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100/50'} transition-colors`}
              title="Toggle details"
            >
              <BarChart3 className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Performance Score */}
      <div className="p-4 border-b border-slate-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              performanceScore >= 80 ? 'bg-emerald-500/20' :
              performanceScore >= 60 ? 'bg-amber-500/20' : 'bg-red-500/20'
            }`}>
              <Gauge className={`w-6 h-6 ${
                performanceScore >= 80 ? 'text-emerald-400' :
                performanceScore >= 60 ? 'text-amber-400' : 'text-red-400'
              }`} />
            </div>
            <div>
              <div className={`text-[10px] ${t.text.muted}`}>Overall Score</div>
              <div className={`text-2xl font-bold ${
                performanceScore >= 80 ? 'text-emerald-400' :
                performanceScore >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {performanceScore}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4 text-center">
            <div>
              <div className={`text-[10px] ${t.text.muted}`}>Warnings</div>
              <div className={`text-lg font-semibold ${(history?.summary.warningCount ?? 0) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {history?.summary.warningCount ?? 0}
              </div>
            </div>
            <div>
              <div className={`text-[10px] ${t.text.muted}`}>Critical</div>
              <div className={`text-lg font-semibold ${(history?.summary.criticalCount ?? 0) > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {history?.summary.criticalCount ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Core Metrics */}
      <div className="p-4 space-y-3">
        <div className={`text-xs font-semibold ${t.text.primary}`}>Core Metrics</div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="First Contentful Paint"
            value={currentMetrics.fcp}
            unit="ms"
            threshold={thresholds.fcp}
            icon={<Clock className="w-4 h-4" />}
          />
          <MetricCard
            title="Largest Contentful Paint"
            value={currentMetrics.lcp}
            unit="ms"
            threshold={thresholds.lcp}
            icon={<Clock className="w-4 h-4" />}
          />
          <MetricCard
            title="First Input Delay"
            value={currentMetrics.fid}
            unit="ms"
            threshold={thresholds.fid}
            icon={<Zap className="w-4 h-4" />}
          />
          <MetricCard
            title="Cumulative Layout Shift"
            value={currentMetrics.cls}
            unit=""
            threshold={thresholds.cls}
            icon={<Activity className="w-4 h-4" />}
          />
        </div>
      </div>
      
      {/* Resource Metrics */}
      <div className="p-4 space-y-3 border-t border-slate-700/30">
        <div className={`text-xs font-semibold ${t.text.primary}`}>Resource Metrics</div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Frame Rate"
            value={currentMetrics.frameRate}
            unit="fps"
            threshold={thresholds.frameRate}
            icon={<Activity className="w-4 h-4" />}
            trend="stable"
          />
          <MetricCard
            title="Memory Usage"
            value={currentMetrics.usedMemory}
            unit="MB"
            threshold={{ warning: 50, critical: 100 }}
            icon={<Cpu className="w-4 h-4" />}
          />
          <MetricCard
            title="Page Load Time"
            value={currentMetrics.pageLoadTime}
            unit="ms"
            threshold={thresholds.pageLoadTime}
            icon={<Clock className="w-4 h-4" />}
          />
          <MetricCard
            title="Time to First Byte"
            value={currentMetrics.ttfb}
            unit="ms"
            threshold={thresholds.ttfb}
            icon={<HardDrive className="w-4 h-4" />}
          />
        </div>
      </div>
      
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-4 border-t border-slate-700/30">
          <div className={`text-xs font-semibold ${t.text.primary} mb-3`}>
            Recent Warnings
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {warnings.slice(-10).map((warning) => (
                <motion.div
                  key={warning.timestamp}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex items-start space-x-2 p-2 rounded-lg ${
                    warning.type === 'critical' ? 'bg-red-500/10' : 'bg-amber-500/10'
                  }`}
                >
                  {warning.type === 'critical' ? (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={`text-[10px] font-medium ${
                      warning.type === 'critical' ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {warning.metric.toString()}
                    </div>
                    <div className={`text-[10px] ${t.text.muted}`}>
                      Value: {warning.value.toFixed(2)} exceeds {warning.threshold.toFixed(2)}
                    </div>
                  </div>
                  <div className={`text-[9px] ${t.text.dimmed}`}>
                    {new Date(warning.timestamp).toLocaleTimeString()}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      
      {/* Details Panel */}
      <AnimatePresence>
        {showDetails && history && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-700/30 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Summary */}
              <div>
                <div className={`text-xs font-semibold ${t.text.primary} mb-3`}>
                  Summary
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg ${t.isDark ? 'bg-slate-800/50' : 'bg-slate-100/50'}`}>
                    <div className={`text-[10px] ${t.text.muted}`}>Avg FCP</div>
                    <div className={`text-lg font-bold ${t.text.primary}`}>
                      {history.summary.avgFCP.toFixed(0)}ms
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${t.isDark ? 'bg-slate-800/50' : 'bg-slate-100/50'}`}>
                    <div className={`text-[10px] ${t.text.muted}`}>Avg LCP</div>
                    <div className={`text-lg font-bold ${t.text.primary}`}>
                      {history.summary.avgLCP.toFixed(0)}ms
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${t.isDark ? 'bg-slate-800/50' : 'bg-slate-100/50'}`}>
                    <div className={`text-[10px] ${t.text.muted}`}>Avg FID</div>
                    <div className={`text-lg font-bold ${t.text.primary}`}>
                      {history.summary.avgFID.toFixed(0)}ms
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${t.isDark ? 'bg-slate-800/50' : 'bg-slate-100/50'}`}>
                    <div className={`text-[10px] ${t.text.muted}`}>Avg CLS</div>
                    <div className={`text-lg font-bold ${t.text.primary}`}>
                      {history.summary.avgCLS.toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* History */}
              <div>
                <div className={`text-xs font-semibold ${t.text.primary} mb-3`}>
                  History
                </div>
                <div className={`max-h-64 overflow-y-auto custom-scrollbar ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-100/30'} rounded-lg p-2`}>
                  {history.metrics.slice(-20).map((metrics) => (
                    <div
                      key={metrics.timestamp}
                      className={`p-2 rounded ${t.isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-200/30'} transition-colors`}
                    >
                      <div className={`text-[10px] ${t.text.muted} mb-1`}>
                        {new Date(metrics.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-[10px]">
                        <div>
                          <span className={t.text.muted}>FCP: </span>
                          <span className={t.text.primary}>{metrics.fcp.toFixed(0)}ms</span>
                        </div>
                        <div>
                          <span className={t.text.muted}>LCP: </span>
                          <span className={t.text.primary}>{metrics.lcp.toFixed(0)}ms</span>
                        </div>
                        <div>
                          <span className={t.text.muted}>FID: </span>
                          <span className={t.text.primary}>{metrics.fid.toFixed(0)}ms</span>
                        </div>
                        <div>
                          <span className={t.text.muted}>FPS: </span>
                          <span className={t.text.primary}>{metrics.frameRate.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
