/**
 * @file ErrorDiagnostics.tsx
 * @description YYC³便携式智能AI系统 - 实时错误诊断与一键修复
 * Real-time Error Diagnostics + One-Click Fix
 * Displays all diagnostics for the current file with severity indicators,
 * quick fix suggestions, and one-click auto-fix.
 * Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,diagnostics,error-fixing,ide
 */

import {
  AlertCircle, AlertTriangle, Info, Wrench,
  ChevronDown, ChevronRight, Zap, Shield, Eye, EyeOff,
  RefreshCw, Loader2, CheckCircle2, Ban
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

/* ── Diagnostic types ── */
type DiagSeverity = 'error' | 'warning' | 'info'

interface QuickFix {
  id: string
  labelKey: keyof ReturnType<typeof getI18n>
  label: string
  description: string
  codeChange: string
}

interface Diagnostic {
  id: string
  file: string
  line: number
  col: number
  endCol: number
  severity: DiagSeverity
  message: string
  source: string
  quickFixes: QuickFix[]
}

/* ── Mock diagnostics database ── */
function getDiagnostics(file: string): Diagnostic[] {
  const diags: Diagnostic[] = []

  if (file === 'ChatInterface.tsx') {
    diags.push(
      {
        id: 'd1', file, line: 33, col: 7, endCol: 16, severity: 'warning',
        message: "Variable 'scrollRef' is declared but its value is never read in this scope.",
        source: 'typescript(6133)',
        quickFixes: [
          { id: 'f1', labelKey: 'edRemoveUnusedVar', label: 'Remove unused variable', description: 'Remove the declaration of scrollRef', codeChange: '// Removed: const scrollRef = useRef<HTMLDivElement>(null)' },
          { id: 'f2', labelKey: 'edIgnore', label: 'Add @ts-ignore', description: 'Suppress this warning with @ts-ignore comment', codeChange: '// @ts-ignore\nconst scrollRef = useRef<HTMLDivElement>(null)' },
        ],
      },
      {
        id: 'd2', file, line: 68, col: 5, endCol: 20, severity: 'info',
        message: "Consider using optional chaining: cmd?.split(' ') instead of cmd.split(' ')",
        source: 'yyc3-ai-lint',
        quickFixes: [
          { id: 'f3', labelKey: 'edConvertToOptional', label: 'Convert to optional chaining', description: 'Replace with cmd?.split(\' \')', codeChange: "const command = cmd?.split(' ')[0] ?? ''" },
        ],
      },
      {
        id: 'd3', file, line: 102, col: 3, endCol: 45, severity: 'warning',
        message: "Async function 'simulateAIResponse' should have error handling.",
        source: 'yyc3-ai-lint',
        quickFixes: [
          { id: 'f4', labelKey: 'edWrapInTryCatch', label: 'Wrap in try-catch', description: 'Add try-catch block around async operations', codeChange: 'const simulateAIResponse = async (userInput: string) => {\n  try {\n    await new Promise(r => setTimeout(r, 500))\n    addMessage({ ... })\n  } catch (error) {\n    console.error(\'AI response failed:\', error)\n  }\n}' },
        ],
      },
    )
  }

  if (file === 'store.ts') {
    diags.push(
      {
        id: 'd4', file, line: 35, col: 23, endCol: 39, severity: 'error',
        message: "Cannot find name 'initialDesignRoot'. Did you mean to define it?",
        source: 'typescript(2304)',
        quickFixes: [
          { id: 'f5', labelKey: 'edAddMissingImport', label: 'Add missing import', description: 'Import initialDesignRoot from ./defaults', codeChange: "import { initialDesignRoot } from './defaults'" },
          { id: 'f6', labelKey: 'edAddTypeAnnotation', label: 'Define inline', description: 'Define initialDesignRoot as a local constant', codeChange: "const initialDesignRoot: DesignRoot = {\n  version: '1.0.0',\n  theme: 'dark',\n  panels: [],\n  components: [],\n  styles: {}\n}" },
        ],
      },
    )
  }

  if (file === 'types.ts') {
    diags.push(
      {
        id: 'd5', file, line: 12, col: 1, endCol: 30, severity: 'info',
        message: "Interface 'PanelStyle' is declared but not exported. Other modules cannot access it.",
        source: 'yyc3-ai-lint',
        quickFixes: [
          { id: 'f7', labelKey: 'edAddTypeAnnotation', label: 'Add export keyword', description: 'Export the interface for use in other modules', codeChange: 'export interface PanelStyle { ... }' },
        ],
      },
    )
  }

  return diags
}

/* ══════════════════════════════════════════ */
/*  ErrorDiagnostics Component               */
/* ══════════════════════════════════════════ */

export function ErrorDiagnostics() {
  const { theme, language, selectedFile } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const currentFile = selectedFile || 'ChatInterface.tsx'
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [scanning, setScanning] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [fixedIds, setFixedIds] = useState<Set<string>>(new Set())
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set())
  const [showIgnored, setShowIgnored] = useState(false)

  // Scan on file change
  useEffect(() => {
    setScanning(true)
    setFixedIds(new Set())
    setIgnoredIds(new Set())
    setExpandedId(null)
    const timer = setTimeout(() => {
      setDiagnostics(getDiagnostics(currentFile))
      setScanning(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [currentFile])

  const visibleDiags = useMemo(() =>
    diagnostics.filter(d => !fixedIds.has(d.id) && (showIgnored || !ignoredIds.has(d.id))),
  [diagnostics, fixedIds, ignoredIds, showIgnored])

  const counts = useMemo(() => ({
    errors: diagnostics.filter(d => d.severity === 'error' && !fixedIds.has(d.id)).length,
    warnings: diagnostics.filter(d => d.severity === 'warning' && !fixedIds.has(d.id)).length,
    infos: diagnostics.filter(d => d.severity === 'info' && !fixedIds.has(d.id)).length,
  }), [diagnostics, fixedIds])

  const handleFix = useCallback((diagId: string) => {
    setFixedIds(prev => new Set([...prev, diagId]))
    toast.success(i.edFixApplied)
  }, [i])

  const handleIgnore = useCallback((id: string) => {
    setIgnoredIds(prev => new Set([...prev, id]))
  }, [])

  const handleFixAll = useCallback(() => {
    const fixable = diagnostics.filter(d => !fixedIds.has(d.id) && d.quickFixes.length > 0)
    setFixedIds(prev => new Set([...prev, ...fixable.map(d => d.id)]))
    toast.success(`${i.edFixAll}: ${fixable.length}`)
  }, [diagnostics, fixedIds, i])

  const handleRescan = useCallback(() => {
    setScanning(true)
    setFixedIds(new Set())
    setIgnoredIds(new Set())
    setTimeout(() => {
      setDiagnostics(getDiagnostics(currentFile))
      setScanning(false)
    }, 1000)
  }, [currentFile])

  const severityIcon = (s: DiagSeverity) => {
    switch (s) {
      case 'error': return <AlertCircle className="w-3.5 h-3.5 text-red-400" />
      case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      case 'info': return <Info className="w-3.5 h-3.5 text-blue-400" />
    }
  }

  const severityBorder = (s: DiagSeverity) => {
    switch (s) {
      case 'error': return t.isDark ? 'border-l-red-400/40' : 'border-l-red-400'
      case 'warning': return t.isDark ? 'border-l-amber-400/40' : 'border-l-amber-400'
      case 'info': return t.isDark ? 'border-l-blue-400/40' : 'border-l-blue-400'
    }
  }

  return (
    <div className={`flex flex-col h-full overflow-hidden ${t.surface.glass}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border.subtle}`}>
        <div className="flex items-center gap-2">
          <Shield className={`w-3.5 h-3.5 ${t.isDark ? 'text-cyan-400' : 'text-cyan-500'}`} />
          <span className={`text-[11px] ${t.text.secondary}`} style={{ fontWeight: 600 }}>{i.edTitle}</span>
          {/* Counts */}
          <div className="flex items-center gap-1.5">
            {counts.errors > 0 && (
              <span className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full ${t.isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'}`}>
                <AlertCircle className="w-2.5 h-2.5" /> {counts.errors}
              </span>
            )}
            {counts.warnings > 0 && (
              <span className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full ${t.isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                <AlertTriangle className="w-2.5 h-2.5" /> {counts.warnings}
              </span>
            )}
            {counts.infos > 0 && (
              <span className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full ${t.isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <Info className="w-2.5 h-2.5" /> {counts.infos}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Fix all */}
          {counts.errors + counts.warnings > 0 && (
            <button
              onClick={handleFixAll}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] ${t.transition} ${t.accent.solidBtn}`}
              style={{ fontWeight: 600 }}
            >
              <Wrench className="w-2.5 h-2.5" /> {i.edFixAll}
            </button>
          )}
          {/* Toggle ignored */}
          <button
            onClick={() => setShowIgnored(!showIgnored)}
            className={`p-1 rounded ${t.transition} ${showIgnored ? t.accent.activeText : ''} ${t.interactive.iconBtn}`}
            title={showIgnored ? 'Hide ignored' : 'Show ignored'}
          >
            {showIgnored ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
          {/* Rescan */}
          <button onClick={handleRescan} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}>
            <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Diagnostics list */}
      <div className={`flex-1 overflow-y-auto ${t.scrollbar} p-2 space-y-1.5`}>
        {scanning && (
          <div className={`flex items-center justify-center gap-2 py-8 ${t.text.muted}`}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[11px]">{i.arAnalyzing}</span>
          </div>
        )}

        {!scanning && visibleDiags.length === 0 && (
          <div className={`flex flex-col items-center justify-center gap-2 py-8 ${t.text.dimmed}`}>
            <CheckCircle2 className="w-6 h-6 opacity-30" />
            <span className="text-[11px]">{i.edNoErrors}</span>
          </div>
        )}

        <AnimatePresence>
          {!scanning && visibleDiags.map(d => {
            const isExpanded = expandedId === d.id
            const isIgnored = ignoredIds.has(d.id)

            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: isIgnored ? 0.4 : 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`rounded-xl overflow-hidden border-l-2 ${severityBorder(d.severity)} ${t.isDark ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-white/60 border border-slate-200/60'}`}
              >
                {/* Summary */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : d.id)}
                  className={`w-full flex items-start gap-2 px-3 py-2 text-left ${t.transition} ${t.interactive.menuItem}`}
                >
                  {isExpanded ? <ChevronDown className="w-3 h-3 mt-0.5 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                  {severityIcon(d.severity)}
                  <div className="flex-1 min-w-0">
                    <div className={`text-[10px] ${t.text.primary}`} style={{ fontWeight: 500 }}>{d.message}</div>
                    <div className={`flex items-center gap-2 mt-0.5 text-[8px] ${t.text.dimmed}`}>
                      <span>{d.source}</span>
                      <span>{i.edLine} {d.line}:{d.col}</span>
                      {d.quickFixes.length > 0 && (
                        <span className={`flex items-center gap-0.5 ${t.isDark ? 'text-emerald-400' : 'text-emerald-500'}`}>
                          <Zap className="w-2 h-2" /> {d.quickFixes.length} {i.edFixAvailable}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded: Quick fixes */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <div className={`px-3 pb-3 space-y-1.5 ml-7`}>
                      {d.quickFixes.map(fix => (
                        <div
                          key={fix.id}
                          className={`flex items-center gap-2 p-2 rounded-lg ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-50/80'}`}
                        >
                          <Wrench className={`w-3 h-3 flex-shrink-0 ${t.isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                          <div className="flex-1 min-w-0">
                            <div className={`text-[9px] ${t.text.primary}`} style={{ fontWeight: 500 }}>{fix.label}</div>
                            <div className={`text-[8px] ${t.text.dimmed}`}>{fix.description}</div>
                          </div>
                          <button
                            onClick={() => handleFix(d.id)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] flex-shrink-0 ${t.transition} ${
                              t.isDark
                                ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                            style={{ fontWeight: 600 }}
                          >
                            <Zap className="w-2.5 h-2.5" /> {i.edQuickFix}
                          </button>
                        </div>
                      ))}

                      {/* Ignore button */}
                      <button
                        onClick={() => handleIgnore(d.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[8px] ${t.transition} ${t.interactive.iconBtn}`}
                      >
                        <Ban className="w-2.5 h-2.5" /> {i.edIgnore}
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
