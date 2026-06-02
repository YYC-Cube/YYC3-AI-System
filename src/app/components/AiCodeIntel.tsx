/**
 * @file AiCodeIntel.tsx
 * @description YYC³便携式智能AI系统 - AI代码智能面板
 * AI Code Intelligence Panel
 * Smart code analysis: errors, warnings, performance, security, test suggestions.
 * Animated scoring system, categorized findings with severity badges.
 * Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,ai,code-intelligence,analysis
 */

import {
  X,
  Brain,
  AlertTriangle,
  Zap,
  Shield,
  Lightbulb,
  TestTube,
  ChevronDown,
  ChevronRight,
  Wrench,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Info,
  TrendingUp,
  Sparkles,
  FileCode,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

/* ── Types ── */
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type Category = 'error' | 'warning' | 'performance' | 'security' | 'suggestion' | 'test';

interface Finding {
  id: string;
  category: Category;
  severity: Severity;
  line: number;
  message: string;
  file: string;
  fix?: string;
}

/* ── Mock analysis data ── */
const MOCK_FINDINGS: Finding[] = [
  {
    id: 'f1',
    category: 'error',
    severity: 'critical',
    line: 42,
    message: 'Unhandled Promise rejection in async handler',
    file: 'ChatInterface.tsx',
    fix: 'Wrap in try/catch block',
  },
  {
    id: 'f2',
    category: 'error',
    severity: 'high',
    line: 118,
    message: 'Missing null check before property access',
    file: 'store.ts',
    fix: 'Add optional chaining (?.)',
  },
  {
    id: 'f3',
    category: 'warning',
    severity: 'medium',
    line: 67,
    message: 'useEffect missing dependency: setCollaborators',
    file: 'IDELayout.tsx',
    fix: 'Add to dependency array',
  },
  {
    id: 'f4',
    category: 'warning',
    severity: 'low',
    line: 203,
    message: 'Unused import: useState',
    file: 'Header.tsx',
    fix: 'Remove unused import',
  },
  {
    id: 'f5',
    category: 'performance',
    severity: 'medium',
    line: 89,
    message: 'Large component re-renders on every state change',
    file: 'FileManager.tsx',
    fix: 'Wrap with React.memo()',
  },
  {
    id: 'f6',
    category: 'performance',
    severity: 'low',
    line: 156,
    message: 'Inline object creation in JSX causes re-renders',
    file: 'CodeEditor.tsx',
    fix: 'Extract to useMemo()',
  },
  {
    id: 'f7',
    category: 'security',
    severity: 'high',
    line: 34,
    message: 'API key exposed in client-side code',
    file: 'utils/api.ts',
    fix: 'Move to environment variables',
  },
  {
    id: 'f8',
    category: 'security',
    severity: 'medium',
    line: 12,
    message: 'dangerouslySetInnerHTML without sanitization',
    file: 'PreviewPanel.tsx',
    fix: 'Use DOMPurify.sanitize()',
  },
  {
    id: 'f9',
    category: 'suggestion',
    severity: 'info',
    line: 1,
    message: 'Consider splitting into smaller components',
    file: 'ModelSettings.tsx',
  },
  {
    id: 'f10',
    category: 'suggestion',
    severity: 'info',
    line: 45,
    message: 'TypeScript strict mode can catch more errors',
    file: 'tsconfig.json',
  },
  {
    id: 'f11',
    category: 'test',
    severity: 'low',
    line: 0,
    message: 'Missing unit tests for useAppStore hooks',
    file: 'store.ts',
  },
  {
    id: 'f12',
    category: 'test',
    severity: 'medium',
    line: 0,
    message: 'No integration tests for ChatInterface flow',
    file: 'ChatInterface.tsx',
  },
];

const CATEGORY_CONFIG: Record<Category, { icon: React.ElementType; colorKey: string }> = {
  error: { icon: XCircle, colorKey: 'error' },
  warning: { icon: AlertTriangle, colorKey: 'warning' },
  performance: { icon: Zap, colorKey: 'perf' },
  security: { icon: Shield, colorKey: 'security' },
  suggestion: { icon: Lightbulb, colorKey: 'suggestion' },
  test: { icon: TestTube, colorKey: 'test' },
};

/* ── Severity color helpers ── */
function getSeverityClasses(severity: Severity, isDark: boolean): string {
  const map: Record<Severity, string> = {
    critical: isDark
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : 'bg-red-50 text-red-600 border-red-200',
    high: isDark
      ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      : 'bg-orange-50 text-orange-600 border-orange-200',
    medium: isDark
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      : 'bg-amber-50 text-amber-600 border-amber-200',
    low: isDark
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      : 'bg-blue-50 text-blue-600 border-blue-200',
    info: isDark
      ? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
      : 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return map[severity];
}

function getCategoryColor(cat: Category, isDark: boolean): string {
  const map: Record<Category, string> = {
    error: isDark ? 'text-red-400' : 'text-red-500',
    warning: isDark ? 'text-amber-400' : 'text-amber-500',
    performance: isDark ? 'text-cyan-400' : 'text-cyan-600',
    security: isDark ? 'text-purple-400' : 'text-purple-600',
    suggestion: isDark ? 'text-emerald-400' : 'text-emerald-600',
    test: isDark ? 'text-blue-400' : 'text-blue-600',
  };
  return map[cat];
}

/* ── Score ring component ── */
function ScoreRing({
  score,
  size = 80,
  isDark,
}: {
  score: number;
  size?: number;
  isDark: boolean;
}) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
          strokeWidth={6}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-[18px]"
          style={{ fontWeight: 700, color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════ */
/*  AiCodeIntel — Main Component                     */
/* ══════════════════════════════════════════════════ */

export function AiCodeIntel() {
  const { theme, language, aiCodeIntelOpen, setAiCodeIntelOpen } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const [analyzing, setAnalyzing] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());
  const [dismissedFindings, setDismissedFindings] = useState<Set<string>>(new Set());

  const runAnalysis = useCallback(() => {
    setAnalyzing(true);
    setFindings([]);
    setDismissedFindings(new Set());
    setTimeout(() => {
      setFindings(MOCK_FINDINGS);
      setAnalyzing(false);
    }, 1800);
  }, []);

  // Auto-analyze on open
  useEffect(() => {
    if (aiCodeIntelOpen && findings.length === 0) {
      runAnalysis();
    }
  }, [aiCodeIntelOpen]);

  const visibleFindings = useMemo(() => {
    return findings
      .filter((f) => !dismissedFindings.has(f.id))
      .filter((f) => activeCategory === 'all' || f.category === activeCategory);
  }, [findings, activeCategory, dismissedFindings]);

  const counts = useMemo(() => {
    const active = findings.filter((f) => !dismissedFindings.has(f.id));
    return {
      error: active.filter((f) => f.category === 'error').length,
      warning: active.filter((f) => f.category === 'warning').length,
      performance: active.filter((f) => f.category === 'performance').length,
      security: active.filter((f) => f.category === 'security').length,
      suggestion: active.filter((f) => f.category === 'suggestion').length,
      test: active.filter((f) => f.category === 'test').length,
      total: active.length,
    };
  }, [findings, dismissedFindings]);

  const score = useMemo(() => {
    if (findings.length === 0) return 100;
    const penalties: Record<Severity, number> = {
      critical: 15,
      high: 10,
      medium: 5,
      low: 2,
      info: 0,
    };
    const total = findings
      .filter((f) => !dismissedFindings.has(f.id))
      .reduce((sum, f) => sum + penalties[f.severity], 0);
    return Math.max(0, 100 - total);
  }, [findings, dismissedFindings]);

  const scoreLabel =
    score >= 80
      ? i.aciScoreExcellent
      : score >= 60
        ? i.aciScoreGood
        : score >= 40
          ? i.aciScoreFair
          : i.aciScorePoor;

  const toggleExpand = (id: string) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const dismissFinding = (id: string) => {
    setDismissedFindings((prev) => new Set(prev).add(id));
  };

  const categoryI18n: Record<Category, string> = {
    error: i.aciErrors,
    warning: i.aciWarnings,
    performance: i.aciPerformance,
    security: i.aciSecurity,
    suggestion: i.aciSuggestions,
    test: i.aciTestGen,
  };

  const severityI18n: Record<Severity, string> = {
    critical: i.aciSeverityCritical,
    high: i.aciSeverityHigh,
    medium: i.aciSeverityMedium,
    low: i.aciSeverityLow,
    info: i.aciSeverityInfo,
  };

  if (!aiCodeIntelOpen) return null;

  return (
    <AnimatePresence>
      {aiCodeIntelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAiCodeIntelOpen(false)}
          />

          {/* Panel — slides in from right */}
          <motion.div
            className={`fixed top-0 right-0 bottom-0 z-[61] w-[420px] max-w-[90vw] flex flex-col ${t.surface.popover} border-l ${t.border.subtle} shadow-2xl`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-5 py-4 border-b ${t.border.subtle}`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-1.5 rounded-lg ${t.isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}
                >
                  <Brain className={`w-5 h-5 ${t.accent.primary}`} />
                </div>
                <div>
                  <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 600 }}>
                    {i.aciTitle}
                  </h2>
                  <p className={`text-[10px] ${t.text.muted}`}>{i.aciSubtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={runAnalysis}
                  disabled={analyzing}
                  className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn} ${analyzing ? 'animate-spin' : ''}`}
                  title={i.aciRescan}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setAiCodeIntelOpen(false)}
                  className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Score section */}
            <div className={`px-5 py-4 border-b ${t.border.subtle} flex items-center gap-5`}>
              <ScoreRing score={analyzing ? 0 : score} isDark={t.isDark} />
              <div className="flex-1">
                <div
                  className={`text-[11px] ${t.text.muted} uppercase tracking-wider`}
                  style={{ fontWeight: 600 }}
                >
                  {i.aciOverallScore}
                </div>
                <div className={`text-[18px] ${t.text.primary} mt-0.5`} style={{ fontWeight: 700 }}>
                  {analyzing ? '...' : scoreLabel}
                </div>
                <div className={`text-[10px] ${t.text.muted} mt-1`}>
                  {i.aciLastScan}: {analyzing ? i.aciAnalyzing : new Date().toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {counts.error > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] ${t.isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}
                      style={{ fontWeight: 600 }}
                    >
                      {counts.error} {i.aciErrors}
                    </span>
                  )}
                  {counts.warning > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] ${t.isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600'}`}
                      style={{ fontWeight: 600 }}
                    >
                      {counts.warning} {i.aciWarnings}
                    </span>
                  )}
                  {counts.security > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] ${t.isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600'}`}
                      style={{ fontWeight: 600 }}
                    >
                      {counts.security} {i.aciSecurity}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Category filter tabs */}
            <div
              className={`flex items-center gap-1 px-4 py-2.5 border-b ${t.border.subtle} overflow-x-auto ${t.scrollbar}`}
            >
              {(
                [
                  'all',
                  'error',
                  'warning',
                  'performance',
                  'security',
                  'suggestion',
                  'test',
                ] as const
              ).map((cat) => {
                const isActive = activeCategory === cat;
                const count = cat === 'all' ? counts.total : counts[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] whitespace-nowrap ${t.transition} ${
                      isActive
                        ? `${t.accent.activeBg} ${t.accent.activeText}`
                        : `${t.text.muted} ${t.interactive.hoverBg}`
                    }`}
                    style={{ fontWeight: isActive ? 600 : 400 }}
                  >
                    {cat !== 'all' &&
                      React.createElement(CATEGORY_CONFIG[cat].icon, { className: 'w-3 h-3' })}
                    <span>{cat === 'all' ? i.atAll : categoryI18n[cat]}</span>
                    {count > 0 && (
                      <span
                        className={`px-1 py-px rounded text-[8px] ${isActive ? 'opacity-80' : 'opacity-60'}`}
                        style={{ fontWeight: 700 }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Findings list */}
            <div className={`flex-1 overflow-y-auto ${t.scrollbar} px-3 py-2`}>
              {analyzing ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className={`w-8 h-8 ${t.accent.primary}`} />
                  </motion.div>
                  <span className={`text-[12px] ${t.text.muted}`}>{i.aciAnalyzing}</span>
                </div>
              ) : visibleFindings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <CheckCircle2 className={`w-10 h-10 ${t.status.success}`} />
                  <span className={`text-[12px] ${t.text.muted}`}>{i.aciNoIssues}</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <AnimatePresence>
                    {visibleFindings.map((f) => {
                      const CatIcon = CATEGORY_CONFIG[f.category].icon;
                      const expanded = expandedFindings.has(f.id);
                      return (
                        <motion.div
                          key={f.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 60, height: 0 }}
                          className={`rounded-xl border overflow-hidden ${t.transition} ${
                            t.isDark
                              ? 'border-white/6 bg-white/[0.02] hover:bg-white/[0.04]'
                              : 'border-slate-200/50 bg-white/40 hover:bg-white/60'
                          }`}
                        >
                          {/* Finding header */}
                          <button
                            onClick={() => toggleExpand(f.id)}
                            className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left"
                          >
                            <CatIcon
                              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getCategoryColor(f.category, t.isDark)}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-[11px] ${t.text.primary} break-words`}
                                style={{ fontWeight: 500 }}
                              >
                                {f.message}
                              </div>
                              <div className={`flex items-center gap-2 mt-1`}>
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-px rounded text-[8px] border ${getSeverityClasses(f.severity, t.isDark)}`}
                                  style={{ fontWeight: 600 }}
                                >
                                  {severityI18n[f.severity]}
                                </span>
                                <span className={`text-[9px] ${t.text.dimmed}`}>
                                  <FileCode className="w-2.5 h-2.5 inline mr-0.5" />
                                  {f.file}
                                </span>
                                {f.line > 0 && (
                                  <span className={`text-[9px] ${t.text.dimmed}`}>
                                    {i.aciLine} {f.line}
                                  </span>
                                )}
                              </div>
                            </div>
                            {expanded ? (
                              <ChevronDown className={`w-3.5 h-3.5 mt-0.5 ${t.text.muted}`} />
                            ) : (
                              <ChevronRight className={`w-3.5 h-3.5 mt-0.5 ${t.text.muted}`} />
                            )}
                          </button>

                          {/* Expanded actions */}
                          <AnimatePresence>
                            {expanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className={`border-t ${t.border.subtle}`}
                              >
                                <div className="px-3 py-2.5 flex items-center gap-2">
                                  {f.fix && (
                                    <button
                                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] ${t.isDark ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'} ${t.transition}`}
                                      style={{ fontWeight: 500 }}
                                    >
                                      <Wrench className="w-3 h-3" />
                                      {i.aciQuickFix}
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dismissFinding(f.id);
                                    }}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] ${t.text.muted} ${t.interactive.hoverBg} ${t.transition}`}
                                    style={{ fontWeight: 500 }}
                                  >
                                    <Eye className="w-3 h-3" />
                                    {i.aciIgnore}
                                  </button>
                                  <button
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] ${t.text.muted} ${t.interactive.hoverBg} ${t.transition}`}
                                    style={{ fontWeight: 500 }}
                                  >
                                    <Info className="w-3 h-3" />
                                    {i.aciLearnMore}
                                  </button>
                                </div>
                                {f.fix && (
                                  <div
                                    className={`mx-3 mb-2.5 px-2.5 py-2 rounded-lg text-[10px] ${t.isDark ? 'bg-emerald-500/5 text-emerald-300/80' : 'bg-emerald-50 text-emerald-700'}`}
                                  >
                                    <TrendingUp className="w-3 h-3 inline mr-1" />
                                    {f.fix}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {!analyzing && counts.total > 0 && (
              <div
                className={`px-4 py-3 border-t ${t.border.subtle} flex items-center justify-between`}
              >
                <span className={`text-[10px] ${t.text.muted}`}>
                  {counts.total} {i.aciSuggestions.toLowerCase()}
                </span>
                <button
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] ${t.accent.solidBtn} ${t.transition}`}
                  style={{ fontWeight: 600 }}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  {i.aciFixAll}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
