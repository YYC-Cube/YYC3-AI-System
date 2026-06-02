/**
 * @file SystemReport.tsx
 * @description YYC³便携式智能AI系统 - 系统实现分析报告
 * System Implementation Analysis Report
 * Fully theme-aware using unified token system
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,report,analysis,system
 */

import { Activity, Code, Zap, Database, GitMerge } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

const mockPerformanceData = [
  { time: '10:00', cpu: 12, memory: 45, latency: 120 },
  { time: '10:05', cpu: 15, memory: 48, latency: 115 },
  { time: '10:10', cpu: 22, memory: 52, latency: 130 },
  { time: '10:15', cpu: 18, memory: 50, latency: 125 },
  { time: '10:20', cpu: 28, memory: 55, latency: 140 },
  { time: '10:25', cpu: 25, memory: 54, latency: 135 },
  { time: '10:30', cpu: 30, memory: 58, latency: 145 },
];

const mockGenerations = [
  { name: 'React Components', value: 400 },
  { name: 'Types/Interfaces', value: 300 },
  { name: 'Styles/CSS', value: 300 },
  { name: 'Utils/Hooks', value: 200 },
];

const COLORS = ['#6366f1', '#3b82f6', '#14b8a6', '#f59e0b'];

export function SystemReport() {
  const { theme, language } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const gridStroke = t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const axisStroke = t.isDark ? '#64748b' : '#94a3b8';
  const tooltipBg = t.isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.95)';
  const tooltipBorder = t.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const tooltipText = t.isDark ? '#e2e8f0' : '#334155';

  return (
    <div
      className={`flex flex-col h-full relative overflow-y-auto p-5 ${t.scrollbar} ${t.surface.glass} ${t.text.primary}`}
    >
      <div className="flex items-center space-x-3 mb-8">
        <Activity className={`w-8 h-8 ${t.accent.primary}`} />
        <div>
          <h2 className={`text-2xl tracking-tight ${t.text.primary}`} style={{ fontWeight: 700 }}>
            {i.systemReport}
          </h2>
          <p className={`text-sm ${t.text.tertiary}`}>{i.brandSlogan}</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: i.reportLayoutReady, value: '100%', icon: GitMerge, color: t.status.success },
          { label: i.reportSyncLatency, value: '12ms', icon: Zap, color: t.status.warning },
          { label: 'AI Code Gen', value: '1,240', icon: Code, color: t.accent.primary },
          { label: i.reportDesignParsing, value: 'Deep', icon: Database, color: t.status.info },
        ].map((stat, i) => (
          <div
            key={i}
            className={`${t.surface.widget} rounded-xl p-4 flex flex-col relative overflow-hidden group hover:opacity-90 transition-colors`}
          >
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="w-20 h-20" />
            </div>
            <span className={`text-xs mb-2 ${t.text.tertiary}`} style={{ fontWeight: 500 }}>
              {stat.label}
            </span>
            <span className={`text-2xl ${stat.color}`} style={{ fontWeight: 700 }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Line Chart */}
        <div className={`${t.surface.widget} rounded-xl p-5`}>
          <h3 className={`text-sm mb-4 ${t.text.secondary}`} style={{ fontWeight: 600 }}>
            {i.srResourceTrend}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" stroke={axisStroke} fontSize={12} tickMargin={10} />
                <YAxis stroke={axisStroke} fontSize={12} tickMargin={10} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: tooltipText }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  name="CPU (%)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  name="Memory (%)"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  name="Latency (ms)"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className={`${t.surface.widget} rounded-xl p-5 flex flex-col`}>
          <h3 className={`text-sm mb-4 ${t.text.secondary}`} style={{ fontWeight: 600 }}>
            {i.srCodeGenMatrix}
          </h3>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockGenerations}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockGenerations.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: tooltipText }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Implementation Details */}
      <div className={`${t.surface.widget} rounded-xl p-6`}>
        <h3 className={`text-lg mb-4 ${t.text.primary}`} style={{ fontWeight: 600 }}>
          {i.srChecklist}
        </h3>
        <div className="space-y-4">
          {[
            {
              title: i.srDataModelTitle,
              desc: i.srDataModelDesc,
            },
            {
              title: i.srPanelMgmtTitle,
              desc: i.srPanelMgmtDesc,
            },
            {
              title: i.srAiStateTitle,
              desc: i.srAiStateDesc,
            },
            {
              title: i.srLiquidGlassTitle,
              desc: i.srLiquidGlassDesc,
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div
                className={`w-5 h-5 rounded ${t.status.successBg} ${t.status.success} flex items-center justify-center flex-shrink-0 mt-0.5`}
              >
                <span className="text-[11px]">✓</span>
              </div>
              <div>
                <h4 className={`text-sm ${t.text.secondary}`} style={{ fontWeight: 500 }}>
                  {item.title}
                </h4>
                <p className={`text-xs mt-1 ${t.text.muted}`}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
