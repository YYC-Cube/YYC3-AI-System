/**
 * @file GitDiffViewer.tsx
 * @description YYC³便携式智能AI系统 - 内联Git差异查看器
 * Inline Git Diff Viewer
 * Shows side-by-side or unified diff for Git-changed files.
 * Triggered from GitPanel when clicking "View Diff" on a changed file.
 * Liquid Glass modal overlay, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,git,diff,version-control
 */

import {
  X, GitCompare, Plus, Minus, FileEdit, Copy, Check,
  Columns, AlignJustify, RotateCcw, CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

/* ── Mock diff data per file ── */
interface DiffLine {
  type: 'context' | 'addition' | 'deletion' | 'header'
  lineOld?: number
  lineNew?: number
  content: string
}

const MOCK_DIFFS: Record<string, DiffLine[]> = {
  'IDELayout.tsx': [
    { type: 'header', content: '@@ -48,6 +48,10 @@' },
    { type: 'context', lineOld: 48, lineNew: 48, content: "import { NotificationCenter } from './NotificationCenter'" },
    { type: 'addition', lineNew: 49, content: "import { AiCodeIntel } from './AiCodeIntel'" },
    { type: 'addition', lineNew: 50, content: "import { GitPanel } from './GitPanel'" },
    { type: 'addition', lineNew: 51, content: "import { ActivityTimeline } from './ActivityTimeline'" },
    { type: 'addition', lineNew: 52, content: "import { PerformanceMonitor } from './PerformanceMonitor'" },
    { type: 'context', lineOld: 49, lineNew: 53, content: "import { getI18n } from '../utils/i18n'" },
    { type: 'context', lineOld: 50, lineNew: 54, content: '' },
    { type: 'header', content: '@@ -290,6 +294,10 @@' },
    { type: 'context', lineOld: 290, lineNew: 294, content: '        <SearchPanel />' },
    { type: 'context', lineOld: 291, lineNew: 295, content: '        <NotificationCenter />' },
    { type: 'addition', lineNew: 296, content: '        <AiCodeIntel />' },
    { type: 'addition', lineNew: 297, content: '        <GitPanel />' },
    { type: 'addition', lineNew: 298, content: '        <ActivityTimeline />' },
    { type: 'addition', lineNew: 299, content: '        <PerformanceMonitor />' },
    { type: 'context', lineOld: 292, lineNew: 300, content: '' },
  ],
  'store.ts': [
    { type: 'header', content: '@@ -152,6 +152,18 @@' },
    { type: 'context', lineOld: 152, lineNew: 152, content: '  notificationCenterOpen: false,' },
    { type: 'context', lineOld: 153, lineNew: 153, content: '  setNotificationCenterOpen: (open) => set({ notificationCenterOpen: open }),' },
    { type: 'addition', lineNew: 154, content: '' },
    { type: 'addition', lineNew: 155, content: '  // ── Advanced Feature Panels ──' },
    { type: 'addition', lineNew: 156, content: '  aiCodeIntelOpen: false,' },
    { type: 'addition', lineNew: 157, content: '  setAiCodeIntelOpen: (open) => set({ aiCodeIntelOpen: open }),' },
    { type: 'addition', lineNew: 158, content: '  activityTimelineOpen: false,' },
    { type: 'addition', lineNew: 159, content: '  setActivityTimelineOpen: (open) => set({ activityTimelineOpen: open }),' },
    { type: 'addition', lineNew: 160, content: '  performanceMonitorOpen: false,' },
    { type: 'addition', lineNew: 161, content: '  setPerformanceMonitorOpen: (open) => set({ performanceMonitorOpen: open }),' },
    { type: 'context', lineOld: 154, lineNew: 162, content: '    }),' },
  ],
  'i18n-data.ts': [
    { type: 'header', content: '@@ -487,6 +487,95 @@' },
    { type: 'context', lineOld: 487, lineNew: 487, content: "  ncViewDetails: '\\u67E5\\u770B\\u8BE6\\u60C5'," },
    { type: 'addition', lineNew: 488, content: "  aciTitle: 'AI \\u4EE3\\u7801\\u667A\\u80FD'," },
    { type: 'addition', lineNew: 489, content: "  aciSubtitle: '\\u667A\\u80FD\\u5206\\u6790\\u5F53\\u524D\\u6587\\u4EF6'," },
    { type: 'addition', lineNew: 490, content: "  aciAnalyze: '\\u5F00\\u59CB\\u5206\\u6790'," },
    { type: 'addition', lineNew: 491, content: "  aciAnalyzing: '\\u5206\\u6790\\u4E2D...'," },
    { type: 'addition', lineNew: 492, content: '  // ... +91 more i18n keys' },
    { type: 'context', lineOld: 488, lineNew: 493, content: '}' },
  ],
  'AiCodeIntel.tsx': [
    { type: 'header', content: '--- /dev/null' },
    { type: 'header', content: '+++ b/src/app/components/AiCodeIntel.tsx' },
    { type: 'addition', lineNew: 1, content: '/**' },
    { type: 'addition', lineNew: 2, content: ' * @file AiCodeIntel.tsx' },
    { type: 'addition', lineNew: 3, content: ' * @description YYC3 PortAISys - AI Code Intelligence Panel' },
    { type: 'addition', lineNew: 4, content: ' */' },
    { type: 'addition', lineNew: 5, content: '' },
    { type: 'addition', lineNew: 6, content: "import React, { useState, useMemo } from 'react'" },
    { type: 'addition', lineNew: 7, content: '// ... +273 lines (new file)' },
  ],
  'GitPanel.tsx': [
    { type: 'header', content: '--- /dev/null' },
    { type: 'header', content: '+++ b/src/app/components/GitPanel.tsx' },
    { type: 'addition', lineNew: 1, content: '/**' },
    { type: 'addition', lineNew: 2, content: ' * @file GitPanel.tsx' },
    { type: 'addition', lineNew: 3, content: ' * @description YYC3 PortAISys - Git Integration Panel' },
    { type: 'addition', lineNew: 4, content: ' */' },
    { type: 'addition', lineNew: 5, content: '// ... +340 lines (new file)' },
  ],
  'old-utils.ts': [
    { type: 'header', content: '--- a/src/app/utils/old-utils.ts' },
    { type: 'header', content: '+++ /dev/null' },
    { type: 'deletion', lineOld: 1, content: '/**' },
    { type: 'deletion', lineOld: 2, content: ' * @file old-utils.ts (deprecated)' },
    { type: 'deletion', lineOld: 3, content: ' */' },
    { type: 'deletion', lineOld: 4, content: '// ... -42 lines (deleted file)' },
  ],
}

/* ══════════════════════════════════════════════════ */
/*  GitDiffViewer — Main Component                   */
/* ══════════════════════════════════════════════════ */

export function GitDiffViewer() {
  const { theme, language, gitDiffFile, setGitDiffFile } = useAppStore()
  const t = getThemeTokens(theme)
  const ig = getI18n(language)

  const [viewMode, setViewMode] = useState<'unified' | 'side'>('unified')
  const [copied, setCopied] = useState(false)

  const diffLines = useMemo(() => {
    if (!gitDiffFile) return []
    return MOCK_DIFFS[gitDiffFile] || []
  }, [gitDiffFile])

  const stats = useMemo(() => {
    const additions = diffLines.filter(l => l.type === 'addition').length
    const deletions = diffLines.filter(l => l.type === 'deletion').length
    return { additions, deletions }
  }, [diffLines])

  const handleCopyDiff = () => {
    const text = diffLines.map(l => {
      const prefix = l.type === 'addition' ? '+' : l.type === 'deletion' ? '-' : ' '
      return l.type === 'header' ? l.content : `${prefix} ${l.content}`
    }).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(ig.codeCopied)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!gitDiffFile) return null

  return (
    <AnimatePresence>
      {gitDiffFile && (
        <>
          <motion.div
            className="fixed inset-0 z-[62] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setGitDiffFile(null)}
          />

          <motion.div
            className={`fixed inset-6 sm:inset-10 md:inset-y-10 md:inset-x-20 z-[63] flex flex-col rounded-2xl overflow-hidden ${t.surface.popover} ${t.border.popover} shadow-2xl`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-3 border-b ${t.border.subtle}`}>
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${t.isDark ? 'bg-amber-500/15' : 'bg-amber-50'}`}>
                  <GitCompare className={`w-4 h-4 ${t.isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                </div>
                <div>
                  <h3 className={`text-[13px] ${t.text.primary}`} style={{ fontWeight: 600 }}>
                    {ig.gdViewDiff}: {gitDiffFile}
                  </h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`flex items-center gap-1 text-[10px] ${t.isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      <Plus className="w-3 h-3" /> {stats.additions} {ig.gdAdditions}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] ${t.isDark ? 'text-red-400' : 'text-red-500'}`}>
                      <Minus className="w-3 h-3" /> {stats.deletions} {ig.gdDeletions}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View mode toggle */}
                <div className={`flex items-center rounded-lg border ${t.border.subtle} overflow-hidden`}>
                  <button
                    onClick={() => setViewMode('unified')}
                    className={`flex items-center gap-1 px-2 py-1 text-[9px] ${t.transition} ${
                      viewMode === 'unified'
                        ? `${t.accent.activeBg} ${t.accent.activeText}`
                        : `${t.text.muted} ${t.interactive.hoverBg}`
                    }`}
                    style={{ fontWeight: viewMode === 'unified' ? 600 : 400 }}
                  >
                    <AlignJustify className="w-3 h-3" /> {ig.gdInline}
                  </button>
                  <button
                    onClick={() => setViewMode('side')}
                    className={`flex items-center gap-1 px-2 py-1 text-[9px] ${t.transition} ${
                      viewMode === 'side'
                        ? `${t.accent.activeBg} ${t.accent.activeText}`
                        : `${t.text.muted} ${t.interactive.hoverBg}`
                    }`}
                    style={{ fontWeight: viewMode === 'side' ? 600 : 400 }}
                  >
                    <Columns className="w-3 h-3" /> {ig.gdSideBySide}
                  </button>
                </div>

                {/* Copy diff */}
                <button
                  onClick={handleCopyDiff}
                  className={`p-1.5 rounded-lg ${t.interactive.iconBtn} ${t.transition}`}
                  title={ig.codeCopied}
                >
                  {copied ? <Check className={`w-3.5 h-3.5 ${t.status.success}`} /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {/* Close */}
                <button
                  onClick={() => setGitDiffFile(null)}
                  className={`p-1.5 rounded-lg ${t.interactive.iconBtn} ${t.transition}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Diff content */}
            <div className={`flex-1 overflow-auto ${t.scrollbar} font-mono`}>
              {diffLines.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <CheckCircle2 className={`w-10 h-10 ${t.status.success}`} />
                  <span className={`text-[12px] ${t.text.muted}`}>{ig.gdNoDiff}</span>
                </div>
              ) : (
                <table className="w-full border-collapse text-[11px]" style={{ lineHeight: '20px' }}>
                  <tbody>
                    {diffLines.map((line, idx) => {
                      if (line.type === 'header') {
                        return (
                          <tr key={idx}>
                            <td colSpan={3} className={`px-4 py-1 ${t.isDark ? 'bg-blue-500/8 text-blue-400' : 'bg-blue-50 text-blue-600'} border-b ${t.border.subtle}`}>
                              {line.content}
                            </td>
                          </tr>
                        )
                      }

                      const bgClass = line.type === 'addition'
                        ? t.isDark ? 'bg-emerald-500/8' : 'bg-emerald-50'
                        : line.type === 'deletion'
                          ? t.isDark ? 'bg-red-500/8' : 'bg-red-50'
                          : ''

                      const textClass = line.type === 'addition'
                        ? t.isDark ? 'text-emerald-300' : 'text-emerald-700'
                        : line.type === 'deletion'
                          ? t.isDark ? 'text-red-300' : 'text-red-600'
                          : t.text.secondary

                      const prefix = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' '

                      return (
                        <tr key={idx} className={`${bgClass} border-b ${t.isDark ? 'border-white/[0.02]' : 'border-slate-100'} hover:brightness-110`}>
                          {/* Old line number */}
                          <td className={`w-[50px] text-right px-2 select-none ${t.text.dimmed} ${t.isDark ? 'border-r border-white/[0.03]' : 'border-r border-slate-100'}`}>
                            {line.lineOld || ''}
                          </td>
                          {/* New line number */}
                          <td className={`w-[50px] text-right px-2 select-none ${t.text.dimmed} ${t.isDark ? 'border-r border-white/[0.03]' : 'border-r border-slate-100'}`}>
                            {line.lineNew || ''}
                          </td>
                          {/* Content */}
                          <td className={`px-3 ${textClass} whitespace-pre`}>
                            <span className={`inline-block w-3 ${line.type === 'addition' ? 'text-emerald-400' : line.type === 'deletion' ? 'text-red-400' : 'text-transparent'}`} style={{ fontWeight: 700 }}>
                              {prefix}
                            </span>
                            {line.content}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between px-5 py-2.5 border-t ${t.border.subtle}`}>
              <div className={`flex items-center gap-4 text-[10px] ${t.text.muted}`}>
                <span className="flex items-center gap-1">
                  <FileEdit className="w-3 h-3" /> {gitDiffFile}
                </span>
                <span>
                  {stats.additions + stats.deletions} {ig.gpChanges.toLowerCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { toast.success(ig.gdRevert); setGitDiffFile(null) }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] ${t.transition} ${
                    t.isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  <RotateCcw className="w-3 h-3" /> {ig.gdRevert}
                </button>
                <button
                  onClick={() => { toast.success(ig.gdApply); setGitDiffFile(null) }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] ${t.accent.solidBtn} ${t.transition}`}
                  style={{ fontWeight: 600 }}
                >
                  <CheckCircle2 className="w-3 h-3" /> {ig.gdApply}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
