/**
 * @file SystemDashboard.tsx
 * @description YYC³便携式智能AI系统 - 系统仪表板
 * System Dashboard
 * Panel usage stats, AI cost tracking, performance metrics,
 * error trend charts (Recharts), linked with PerfMon/FlameGraph data
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,dashboard,metrics,analytics
 */

import {
  X, BarChart3, Download, Cpu, HardDrive,
  Zap, AlertTriangle, TrendingUp, Activity, Clock,
  DollarSign, MessageSquare, Gauge, Layers
} from 'lucide-react'
import React, { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

type TabId = 'overview' | 'panels' | 'ai-cost' | 'performance' | 'errors'
type TimeRange = '24h' | '7d' | '30d'

// Mock data generators
const PANEL_USAGE = [
  { name: 'AI Chat', opens: 156, avgDuration: 12.3, labelKey: 'ptChat' },
  { name: 'Code Editor', opens: 142, avgDuration: 45.2, labelKey: 'ptCode' },
  { name: 'Preview', opens: 98, avgDuration: 8.7, labelKey: 'ptPreview' },
  { name: 'Terminal', opens: 87, avgDuration: 15.4, labelKey: 'ptTerminal' },
  { name: 'File Manager', opens: 76, avgDuration: 5.1, labelKey: 'ptFiles' },
  { name: 'Git Panel', opens: 45, avgDuration: 6.8, labelKey: 'gpTitle' },
  { name: 'Whiteboard', opens: 23, avgDuration: 22.1, labelKey: 'wbTitle' },
  { name: 'DB Manager', opens: 18, avgDuration: 18.5, labelKey: 'dbTitle' },
  { name: 'Snippet Mgr', opens: 34, avgDuration: 4.2, labelKey: 'snTitle' },
  { name: 'Dep Graph', opens: 12, avgDuration: 9.3, labelKey: 'dpTitle' },
]

const AI_COST_DATA = [
  { hour: '00:00', cost: 0.012, tokens: 2400, requests: 8 },
  { hour: '04:00', cost: 0.003, tokens: 600, requests: 2 },
  { hour: '08:00', cost: 0.045, tokens: 9000, requests: 28 },
  { hour: '10:00', cost: 0.068, tokens: 13500, requests: 42 },
  { hour: '12:00', cost: 0.052, tokens: 10400, requests: 35 },
  { hour: '14:00', cost: 0.078, tokens: 15600, requests: 48 },
  { hour: '16:00', cost: 0.091, tokens: 18200, requests: 56 },
  { hour: '18:00', cost: 0.065, tokens: 13000, requests: 40 },
  { hour: '20:00', cost: 0.043, tokens: 8600, requests: 27 },
  { hour: '22:00', cost: 0.028, tokens: 5600, requests: 18 },
]

const PERF_TIMELINE = [
  { time: '00:00', cpu: 12, memory: 45, fps: 60, latency: 42 },
  { time: '04:00', cpu: 8, memory: 42, fps: 60, latency: 38 },
  { time: '08:00', cpu: 35, memory: 58, fps: 58, latency: 65 },
  { time: '10:00', cpu: 52, memory: 65, fps: 55, latency: 88 },
  { time: '12:00', cpu: 48, memory: 62, fps: 56, latency: 82 },
  { time: '14:00', cpu: 61, memory: 71, fps: 52, latency: 105 },
  { time: '16:00', cpu: 55, memory: 68, fps: 54, latency: 95 },
  { time: '18:00', cpu: 42, memory: 60, fps: 57, latency: 72 },
  { time: '20:00', cpu: 28, memory: 52, fps: 59, latency: 55 },
  { time: '22:00', cpu: 18, memory: 48, fps: 60, latency: 45 },
]

const ERROR_TREND = [
  { day: 'Mon', network: 2, api: 1, auth: 0, rateLimit: 0, other: 1 },
  { day: 'Tue', network: 1, api: 3, auth: 1, rateLimit: 0, other: 0 },
  { day: 'Wed', network: 0, api: 2, auth: 0, rateLimit: 1, other: 1 },
  { day: 'Thu', network: 3, api: 1, auth: 0, rateLimit: 2, other: 0 },
  { day: 'Fri', network: 1, api: 4, auth: 1, rateLimit: 0, other: 2 },
  { day: 'Sat', network: 0, api: 0, auth: 0, rateLimit: 0, other: 0 },
  { day: 'Sun', network: 1, api: 1, auth: 0, rateLimit: 0, other: 1 },
]

const RECENT_ERRORS = [
  { id: 'e1', type: 'api', message: 'OpenAI rate limit exceeded (429)', time: Date.now() - 1800000, count: 3 },
  { id: 'e2', type: 'network', message: 'WebSocket connection timeout', time: Date.now() - 3600000, count: 1 },
  { id: 'e3', type: 'api', message: 'Invalid model: gpt-4-turbo-preview', time: Date.now() - 7200000, count: 2 },
  { id: 'e4', type: 'auth', message: 'Anthropic API key expired', time: Date.now() - 14400000, count: 1 },
]

const PIE_COLORS = ['#6366f1', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#22c55e', '#f97316', '#64748b']

export function SystemDashboard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')

  const totalCost = AI_COST_DATA.reduce((s, d) => s + d.cost, 0)
  const totalTokens = AI_COST_DATA.reduce((s, d) => s + d.tokens, 0)
  const totalRequests = AI_COST_DATA.reduce((s, d) => s + d.requests, 0)
  const avgLatency = Math.round(PERF_TIMELINE.reduce((s, d) => s + d.latency, 0) / PERF_TIMELINE.length)
  const totalErrors = ERROR_TREND.reduce((s, d) => s + d.network + d.api + d.auth + d.rateLimit + d.other, 0)
  const totalOpens = PANEL_USAGE.reduce((s, d) => s + d.opens, 0)

  const chartTextColor = t.isDark ? '#94a3b8' : '#64748b'
  const chartGridColor = t.isDark ? '#1e293b' : '#f1f5f9'

  const TABS: { id: TabId; icon: React.FC<{ className?: string }>; label: string }[] = [
    { id: 'overview', icon: BarChart3, label: i.sdOverview },
    { id: 'panels', icon: Layers, label: i.sdPanelUsage },
    { id: 'ai-cost', icon: DollarSign, label: i.sdAiCost },
    { id: 'performance', icon: Activity, label: i.sdPerformance },
    { id: 'errors', icon: AlertTriangle, label: i.sdErrors },
  ]

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    return `${Math.floor(diff / 3600000)}h`
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed inset-4 z-[61] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${t.border.subtle} flex-shrink-0`}>
          <div className="flex items-center space-x-2.5">
            <BarChart3 className={`w-5 h-5 ${t.accent.primary}`} />
            <div>
              <span className="text-[14px]" style={{ fontWeight: 600 }}>{i.sdTitle}</span>
              <span className={`ml-2 text-[11px] ${t.text.muted}`}>{i.sdSubtitle}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Time range selector */}
            {([
              { id: '24h' as TimeRange, label: i.sdLast24h },
              { id: '7d' as TimeRange, label: i.sdLast7d },
              { id: '30d' as TimeRange, label: i.sdLast30d },
            ]).map(tr => (
              <button
                key={tr.id}
                onClick={() => setTimeRange(tr.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] ${t.transition} ${
                  timeRange === tr.id ? `${t.accent.activeBg} ${t.accent.activeText}` : t.interactive.iconBtn
                }`}
                style={{ fontWeight: timeRange === tr.id ? 500 : 400 }}
              >
                {tr.label}
              </button>
            ))}
            <div className={`w-px h-4 ${t.border.dividerV}`} />
            <button className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} title={i.sdExport}>
              <Download className="w-4 h-4" />
            </button>
            <button onClick={onClose} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${t.border.subtle} px-2`}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-[11px] border-b-2 ${t.transition} ${
                activeTab === tab.id ? `${t.accent.activeText} border-indigo-500` : `${t.text.muted} border-transparent`
              }`}
              style={{ fontWeight: activeTab === tab.id ? 600 : 400 }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-5 space-y-5 ${t.scrollbar}`}>
          {/* ═══ OVERVIEW ═══ */}
          {activeTab === 'overview' && (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-6 gap-3">
                {[
                  { label: i.sdTotalPanels, value: '30+', icon: Layers, color: 'text-indigo-400' },
                  { label: i.sdOpenedToday, value: totalOpens.toString(), icon: TrendingUp, color: 'text-blue-400' },
                  { label: i.sdTotalCost, value: `$${totalCost.toFixed(3)}`, icon: DollarSign, color: 'text-emerald-400' },
                  { label: i.sdRequestCount, value: totalRequests.toString(), icon: MessageSquare, color: 'text-amber-400' },
                  { label: i.sdAvgLatency, value: `${avgLatency}ms`, icon: Clock, color: 'text-cyan-400' },
                  { label: i.sdErrors, value: totalErrors.toString(), icon: AlertTriangle, color: totalErrors > 10 ? 'text-red-400' : 'text-emerald-400' },
                ].map((kpi, idx) => (
                  <div key={idx} className={`p-3 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                    <div className="flex items-center space-x-1.5 mb-1">
                      <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                      <span className={`text-[9px] ${t.text.dimmed}`}>{kpi.label}</span>
                    </div>
                    <div className="text-[16px]" style={{ fontWeight: 700 }}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Panel usage pie */}
                <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                  <div className={`text-[11px] mb-3 ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.sdPanelUsage}</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={PANEL_USAGE.slice(0, 6)}
                        dataKey="opens"
                        nameKey="name"
                        cx="50%" cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                      >
                        {PANEL_USAGE.slice(0, 6).map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: t.isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px', fontSize: '11px' }}
                        itemStyle={{ color: chartTextColor }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* AI cost area chart */}
                <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                  <div className={`text-[11px] mb-3 ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.sdAiCost}</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={AI_COST_DATA}>
                      <defs>
                        <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                      <XAxis dataKey="hour" tick={{ fontSize: 10, fill: chartTextColor }} />
                      <YAxis tick={{ fontSize: 10, fill: chartTextColor }} tickFormatter={v => `$${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: t.isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px', fontSize: '11px' }}
                        formatter={(val: number) => [`$${val.toFixed(4)}`, 'Cost']}
                      />
                      <Area type="monotone" dataKey="cost" stroke="#6366f1" fill="url(#costGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Performance line chart */}
              <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                <div className={`text-[11px] mb-3 ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.sdPerformance}</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={PERF_TIMELINE}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: chartTextColor }} />
                    <YAxis tick={{ fontSize: 10, fill: chartTextColor }} />
                    <Tooltip contentStyle={{ backgroundColor: t.isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="cpu" stroke="#ef4444" strokeWidth={2} dot={false} name={i.sdCpuUsage} />
                    <Line type="monotone" dataKey="memory" stroke="#3b82f6" strokeWidth={2} dot={false} name={i.sdMemoryUsage} />
                    <Line type="monotone" dataKey="fps" stroke="#22c55e" strokeWidth={2} dot={false} name={i.sdFps} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* ═══ PANELS ═══ */}
          {activeTab === 'panels' && (
            <>
              <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={PANEL_USAGE} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: chartTextColor }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: chartTextColor }} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: t.isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="opens" fill="#6366f1" radius={[0, 4, 4, 0]} name="Opens" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                  <div className={`text-[10px] ${t.text.dimmed}`}>{i.sdMostUsed}</div>
                  <div className="text-[14px] mt-1" style={{ fontWeight: 600 }}>{PANEL_USAGE[0].name}</div>
                  <div className={`text-[10px] ${t.text.dimmed}`}>{PANEL_USAGE[0].opens} opens</div>
                </div>
                <div className={`p-3 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                  <div className={`text-[10px] ${t.text.dimmed}`}>{i.sdLeastUsed}</div>
                  <div className="text-[14px] mt-1" style={{ fontWeight: 600 }}>{PANEL_USAGE[PANEL_USAGE.length - 1].name}</div>
                  <div className={`text-[10px] ${t.text.dimmed}`}>{PANEL_USAGE[PANEL_USAGE.length - 1].opens} opens</div>
                </div>
              </div>
            </>
          )}

          {/* ═══ AI COST ═══ */}
          {activeTab === 'ai-cost' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                  <DollarSign className="w-5 h-5 text-emerald-400 mb-1" />
                  <div className={`text-[10px] ${t.text.dimmed}`}>{i.sdTotalCost}</div>
                  <div className="text-[18px]" style={{ fontWeight: 700 }}>${totalCost.toFixed(3)}</div>
                </div>
                <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                  <Zap className="w-5 h-5 text-amber-400 mb-1" />
                  <div className={`text-[10px] ${t.text.dimmed}`}>{i.sdTokensUsed}</div>
                  <div className="text-[18px]" style={{ fontWeight: 700 }}>{totalTokens.toLocaleString()}</div>
                </div>
                <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                  <MessageSquare className="w-5 h-5 text-blue-400 mb-1" />
                  <div className={`text-[10px] ${t.text.dimmed}`}>{i.sdRequestCount}</div>
                  <div className="text-[18px]" style={{ fontWeight: 700 }}>{totalRequests}</div>
                </div>
              </div>
              <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={AI_COST_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: chartTextColor }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: chartTextColor }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: chartTextColor }} />
                    <Tooltip contentStyle={{ backgroundColor: t.isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar yAxisId="left" dataKey="tokens" fill="#6366f1" radius={[4, 4, 0, 0]} name={i.sdTokensUsed} />
                    <Bar yAxisId="right" dataKey="requests" fill="#14b8a6" radius={[4, 4, 0, 0]} name={i.sdRequestCount} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* ═══ PERFORMANCE ═══ */}
          {activeTab === 'performance' && (
            <>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: i.sdCpuUsage, value: '42%', icon: Cpu, color: 'text-red-400' },
                  { label: i.sdMemoryUsage, value: '62%', icon: HardDrive, color: 'text-blue-400' },
                  { label: i.sdFps, value: '57', icon: Gauge, color: 'text-emerald-400' },
                  { label: i.sdAvgLatency, value: `${avgLatency}ms`, icon: Clock, color: 'text-amber-400' },
                ].map((m, idx) => (
                  <div key={idx} className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                    <m.icon className={`w-5 h-5 ${m.color} mb-1`} />
                    <div className={`text-[10px] ${t.text.dimmed}`}>{m.label}</div>
                    <div className="text-[18px]" style={{ fontWeight: 700 }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={PERF_TIMELINE}>
                    <defs>
                      <linearGradient id="cpuG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="memG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: chartTextColor }} />
                    <YAxis tick={{ fontSize: 10, fill: chartTextColor }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: t.isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Area type="monotone" dataKey="cpu" stroke="#ef4444" fill="url(#cpuG)" strokeWidth={2} name={i.sdCpuUsage} />
                    <Area type="monotone" dataKey="memory" stroke="#3b82f6" fill="url(#memG)" strokeWidth={2} name={i.sdMemoryUsage} />
                    <Line type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} dot={false} name={i.sdAvgLatency} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* ═══ ERRORS ═══ */}
          {activeTab === 'errors' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                  <div className={`text-[10px] ${t.text.dimmed}`}>{i.sdErrorRate}</div>
                  <div className="text-[18px]" style={{ fontWeight: 700 }}>{totalErrors} total</div>
                  <div className={`text-[10px] ${totalErrors > 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {totalErrors > 10 ? '↑ Above threshold' : '↓ Within normal range'}
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                  <div className={`text-[10px] ${t.text.dimmed}`}>{i.sdErrorTrend}</div>
                  <ResponsiveContainer width="100%" height={60}>
                    <AreaChart data={ERROR_TREND}>
                      <Area
                        type="monotone"
                        dataKey="api"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.15}
                        strokeWidth={1.5}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                <div className={`text-[11px] mb-3 ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.sdErrorTrend}</div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ERROR_TREND}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: chartTextColor }} />
                    <YAxis tick={{ fontSize: 10, fill: chartTextColor }} />
                    <Tooltip contentStyle={{ backgroundColor: t.isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="network" stackId="a" fill="#ef4444" name="Network" />
                    <Bar dataKey="api" stackId="a" fill="#f59e0b" name="API" />
                    <Bar dataKey="auth" stackId="a" fill="#ec4899" name="Auth" />
                    <Bar dataKey="rateLimit" stackId="a" fill="#8b5cf6" name="Rate Limit" />
                    <Bar dataKey="other" stackId="a" fill="#64748b" name="Other" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Recent errors */}
              <div>
                <div className={`text-[11px] uppercase tracking-wider mb-2 ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.sdRecentErrors}</div>
                <div className="space-y-1.5">
                  {RECENT_ERRORS.map(err => (
                    <div key={err.id} className={`flex items-center justify-between p-3 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                      <div className="flex items-center space-x-2.5">
                        <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${
                          err.type === 'api' ? 'text-amber-400' : err.type === 'network' ? 'text-red-400' : 'text-purple-400'
                        }`} />
                        <div>
                          <div className="text-[11px]" style={{ fontWeight: 500 }}>{err.message}</div>
                          <div className={`text-[9px] ${t.text.dimmed}`}>{err.type} · {timeAgo(err.time)} ago · {err.count}x</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
