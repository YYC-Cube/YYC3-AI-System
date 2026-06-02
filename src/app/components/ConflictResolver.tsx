/**
 * @file ConflictResolver.tsx
 * @description YYC³便携式智能AI系统 - 多用户协作冲突可视化与解决
 * Multi-User Collaboration Conflict Visualization & Resolution
 * Full-screen overlay showing side-by-side diff of conflicting changes with
 * accept-incoming / keep-current / accept-both / manual-merge actions.
 * Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,collaboration,conflict-resolution,diff
 */

import {
  GitMerge, X, Check, ChevronDown,
  ArrowRight, ArrowLeft, ArrowDownUp, PenLine,
  ChevronUp, AlertTriangle, CheckCircle2,
  FileCode
} from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

/* ── Conflict types ── */
interface ConflictHunk {
  id: string
  file: string
  startLine: number
  endLine: number
  localLines: string[]
  incomingLines: string[]
  peerName: string
  peerColor: string
  resolved: boolean
  resolution: 'incoming' | 'current' | 'both' | 'manual' | null
  mergedLines?: string[]
}

/* ── Mock conflicts ── */
const MOCK_CONFLICTS: ConflictHunk[] = [
  {
    id: 'cf1', file: 'ChatInterface.tsx', startLine: 56, endLine: 62,
    localLines: [
      "export function ChatInterface() {",
      "  const { theme, messages, addMessage } = useAppStore()",
      "  const [input, setInput] = useState('')",
      "  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0])",
      "  const scrollRef = useRef<HTMLDivElement>(null)",
    ],
    incomingLines: [
      "export function ChatInterface({ onNavigate }: ChatInterfaceProps) {",
      "  const { theme, messages, addMessage, clearMessages } = useAppStore()",
      "  const [input, setInput] = useState('')",
      "  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0])",
      "  const [isStreaming, setIsStreaming] = useState(false)",
      "  const scrollRef = useRef<HTMLDivElement>(null)",
    ],
    peerName: 'Alice', peerColor: '#6366f1', resolved: false, resolution: null,
  },
  {
    id: 'cf2', file: 'ChatInterface.tsx', startLine: 88, endLine: 100,
    localLines: [
      "  const processSlashCommand = (cmd: string) => {",
      "    const command = cmd.split(' ')[0]",
      "    switch (command) {",
      "      case '/code':",
      "        addMessage({ role: 'system', content: 'Generating code...' })",
      "        break",
      "      case '/arch':",
      "        addMessage({ role: 'system', content: 'Loading architecture...' })",
      "        break",
      "      default:",
      "        addMessage({ role: 'system', content: `Unknown: ${command}` })",
      "    }",
      "  }",
    ],
    incomingLines: [
      "  const SLASH_COMMANDS: Record<string, () => void> = {",
      "    '/code': () => addMessage({ role: 'system', content: 'Generating code...' }),",
      "    '/arch': () => addMessage({ role: 'system', content: 'Loading architecture...' }),",
      "    '/help': () => addMessage({ role: 'system', content: HELP_TEXT }),",
      "    '/clear': () => clearMessages(),",
      "  }",
      "",
      "  const processSlashCommand = (cmd: string) => {",
      "    const handler = SLASH_COMMANDS[cmd.split(' ')[0]]",
      "    handler ? handler() : addMessage({ role: 'system', content: `Unknown: ${cmd}` })",
      "  }",
    ],
    peerName: 'Bob', peerColor: '#f59e0b', resolved: false, resolution: null,
  },
  {
    id: 'cf3', file: 'store.ts', startLine: 34, endLine: 36,
    localLines: [
      "      designRoot: initialDesignRoot,",
    ],
    incomingLines: [
      "      designRoot: createDefaultDesignRoot(),",
    ],
    peerName: 'Dave', peerColor: '#ec4899', resolved: false, resolution: null,
  },
]

/* ══════════════════════════════════════════ */
/*  ConflictResolver Component                */
/* ══════════════════════════════════════════ */

interface ConflictResolverProps {
  open: boolean
  onClose: () => void
}

export function ConflictResolver({ open, onClose }: ConflictResolverProps) {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const [conflicts, setConflicts] = useState<ConflictHunk[]>(MOCK_CONFLICTS)
  const [activeIndex, setActiveIndex] = useState(0)
  const [_expandedIds] = useState<Set<string>>(new Set(MOCK_CONFLICTS.map(c => c.id)))
  const [manualEditId, setManualEditId] = useState<string | null>(null)
  const [manualText, setManualText] = useState('')

  const counts = useMemo(() => ({
    total: conflicts.length,
    resolved: conflicts.filter(c => c.resolved).length,
    unresolved: conflicts.filter(c => !c.resolved).length,
  }), [conflicts])

  const activeConflict = conflicts[activeIndex]

  const resolveConflict = useCallback((id: string, resolution: 'incoming' | 'current' | 'both' | 'manual', mergedLines?: string[]) => {
    setConflicts(prev => prev.map(c =>
      c.id === id ? { ...c, resolved: true, resolution, mergedLines } : c
    ))
    toast.success(i.cfMarkResolved)
    setManualEditId(null)
  }, [i])

  const unresolveConflict = useCallback((id: string) => {
    setConflicts(prev => prev.map(c =>
      c.id === id ? { ...c, resolved: false, resolution: null, mergedLines: undefined } : c
    ))
  }, [])

  const navigateConflict = useCallback((dir: 1 | -1) => {
    setActiveIndex(prev => {
      const next = prev + dir
      if (next < 0) return conflicts.length - 1
      if (next >= conflicts.length) return 0
      return next
    })
  }, [conflicts.length])

  const resolutionLabel = (r: string | null) => {
    switch (r) {
      case 'incoming': return i.cfAcceptIncoming
      case 'current': return i.cfAcceptCurrent
      case 'both': return i.cfAcceptBoth
      case 'manual': return i.cfManualMerge
      default: return i.cfUnresolved
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* ── Header ── */}
          <div className={`flex items-center justify-between px-6 py-3 border-b ${t.border.subtle}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.isDark ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20' : 'bg-gradient-to-br from-red-50 to-orange-50'}`}>
                <GitMerge className={`w-4 h-4 ${t.isDark ? 'text-red-400' : 'text-red-500'}`} />
              </div>
              <div>
                <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 700 }}>{i.cfTitle}</h2>
                <p className={`text-[10px] ${t.text.dimmed}`}>{i.cfSubtitle}</p>
              </div>
              {/* Stats */}
              <div className="flex items-center gap-2 ml-4">
                {counts.unresolved > 0 && (
                  <span className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full ${t.isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'}`}>
                    <AlertTriangle className="w-2.5 h-2.5" /> {counts.unresolved} {i.cfUnresolved}
                  </span>
                )}
                {counts.resolved > 0 && (
                  <span className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full ${t.isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    <CheckCircle2 className="w-2.5 h-2.5" /> {counts.resolved} {i.cfResolved}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Navigation */}
              <button onClick={() => navigateConflict(-1)} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} title={i.cfPrevConflict}>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <span className={`text-[10px] ${t.text.muted}`}>{activeIndex + 1}/{conflicts.length}</span>
              <button onClick={() => navigateConflict(1)} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} title={i.cfNextConflict}>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button onClick={onClose} className={`p-2 rounded-xl ${t.transition} ${t.interactive.iconBtn}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Conflict list + Detail ── */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar: conflict list */}
            <div className={`w-56 flex-shrink-0 border-r ${t.border.subtle} overflow-y-auto ${t.scrollbar}`}>
              {conflicts.map((cf, idx) => (
                <button
                  key={cf.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left border-b ${t.border.subtle} ${t.transition} ${
                    idx === activeIndex
                      ? `${t.isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`
                      : t.interactive.menuItem
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cf.resolved ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <FileCode className={`w-3 h-3 flex-shrink-0 ${t.text.muted}`} />
                      <span className={`text-[9px] truncate ${t.text.primary}`} style={{ fontWeight: 500 }}>{cf.file}</span>
                    </div>
                    <div className={`text-[8px] ${t.text.dimmed}`}>
                      L{cf.startLine}-{cf.endLine} · <span style={{ color: cf.peerColor }}>{cf.peerName}</span>
                    </div>
                  </div>
                  {cf.resolved && <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                </button>
              ))}
            </div>

            {/* Main: conflict detail */}
            {activeConflict && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* File info bar */}
                <div className={`flex items-center justify-between px-4 py-2 border-b ${t.border.subtle}`}>
                  <div className="flex items-center gap-2">
                    <FileCode className={`w-3.5 h-3.5 ${t.accent.primary}`} />
                    <span className={`text-[11px] ${t.text.primary}`} style={{ fontWeight: 600 }}>{activeConflict.file}</span>
                    <span className={`text-[9px] ${t.text.dimmed}`}>L{activeConflict.startLine}-{activeConflict.endLine}</span>
                    <div className="flex items-center gap-1 ml-2">
                      <div className="w-3 h-3 rounded-full flex items-center justify-center text-[6px] text-white" style={{ backgroundColor: activeConflict.peerColor, fontWeight: 700 }}>
                        {activeConflict.peerName[0]}
                      </div>
                      <span className={`text-[9px]`} style={{ color: activeConflict.peerColor, fontWeight: 500 }}>{activeConflict.peerName}</span>
                    </div>
                  </div>
                  {activeConflict.resolved && (
                    <span className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded ${t.isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                      <CheckCircle2 className="w-2.5 h-2.5" /> {resolutionLabel(activeConflict.resolution)}
                    </span>
                  )}
                </div>

                {/* Side-by-side diff */}
                <div className="flex-1 overflow-auto">
                  <div className="grid grid-cols-2 h-full">
                    {/* Current (local) */}
                    <div className={`border-r ${t.border.subtle}`}>
                      <div className={`px-3 py-1.5 text-[9px] uppercase tracking-wider border-b ${t.border.subtle} ${t.isDark ? 'bg-blue-500/5 text-blue-400' : 'bg-blue-50 text-blue-600'}`} style={{ fontWeight: 700 }}>
                        {i.cfCurrent} ({i.cfLocalChange})
                      </div>
                      <div className="p-0.5">
                        {activeConflict.localLines.map((line, idx) => (
                          <div key={idx} className={`flex font-mono text-[10px] ${t.isDark ? 'hover:bg-blue-500/5' : 'hover:bg-blue-50/50'}`}>
                            <span className={`w-8 text-right pr-2 flex-shrink-0 select-none ${t.text.dimmed}`}>{activeConflict.startLine + idx}</span>
                            <span className={`flex-1 px-1 ${activeConflict.resolved && activeConflict.resolution === 'incoming' ? 'opacity-30 line-through' : ''} ${t.text.primary}`}>
                              {line}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Incoming (peer) */}
                    <div>
                      <div className={`px-3 py-1.5 text-[9px] uppercase tracking-wider border-b ${t.border.subtle} ${t.isDark ? 'bg-green-500/5 text-green-400' : 'bg-green-50 text-green-600'}`} style={{ fontWeight: 700 }}>
                        {i.cfIncoming} ({i.cfPeerChange}: {activeConflict.peerName})
                      </div>
                      <div className="p-0.5">
                        {activeConflict.incomingLines.map((line, idx) => (
                          <div key={idx} className={`flex font-mono text-[10px] ${t.isDark ? 'hover:bg-green-500/5' : 'hover:bg-green-50/50'}`}>
                            <span className={`w-8 text-right pr-2 flex-shrink-0 select-none ${t.text.dimmed}`}>{activeConflict.startLine + idx}</span>
                            <span className={`flex-1 px-1 ${activeConflict.resolved && activeConflict.resolution === 'current' ? 'opacity-30 line-through' : ''} ${t.text.primary}`}>
                              {line}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Manual merge editor */}
                  {manualEditId === activeConflict.id && (
                    <div className={`border-t ${t.border.subtle} p-3`}>
                      <div className={`text-[9px] uppercase tracking-wider mb-1 ${t.text.dimmed}`} style={{ fontWeight: 600 }}>{i.cfManualMerge}</div>
                      <textarea
                        value={manualText}
                        onChange={e => setManualText(e.target.value)}
                        rows={6}
                        className={`w-full font-mono text-[10px] p-2 rounded-lg outline-none resize-none ${t.isDark ? 'bg-white/[0.04] text-white' : 'bg-slate-100 text-slate-800'} border ${t.border.subtle}`}
                      />
                      <div className="flex justify-end gap-1 mt-1">
                        <button onClick={() => setManualEditId(null)} className={`px-2 py-0.5 rounded text-[9px] ${t.transition} ${t.interactive.iconBtn}`}>
                          <X className="w-2.5 h-2.5 inline mr-0.5" />Cancel
                        </button>
                        <button onClick={() => resolveConflict(activeConflict.id, 'manual', manualText.split('\n'))} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] ${t.transition} ${t.accent.solidBtn}`} style={{ fontWeight: 600 }}>
                          <Check className="w-2.5 h-2.5" /> Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className={`flex items-center justify-between px-4 py-3 border-t ${t.border.subtle}`}>
                  <div className="flex items-center gap-2">
                    {!activeConflict.resolved ? (
                      <>
                        <button
                          onClick={() => resolveConflict(activeConflict.id, 'incoming')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] ${t.transition} ${
                            t.isDark ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                          }`} style={{ fontWeight: 600 }}
                        >
                          <ArrowRight className="w-3 h-3" /> {i.cfAcceptIncoming}
                        </button>
                        <button
                          onClick={() => resolveConflict(activeConflict.id, 'current')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] ${t.transition} ${
                            t.isDark ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                          }`} style={{ fontWeight: 600 }}
                        >
                          <ArrowLeft className="w-3 h-3" /> {i.cfAcceptCurrent}
                        </button>
                        <button
                          onClick={() => resolveConflict(activeConflict.id, 'both')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] ${t.transition} ${
                            t.isDark ? 'bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 border border-violet-500/20' : 'bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200'
                          }`} style={{ fontWeight: 600 }}
                        >
                          <ArrowDownUp className="w-3 h-3" /> {i.cfAcceptBoth}
                        </button>
                        <button
                          onClick={() => { setManualEditId(activeConflict.id); setManualText([...activeConflict.localLines, '', ...activeConflict.incomingLines].join('\n')) }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] ${t.transition} ${t.interactive.iconBtn}`}
                          style={{ fontWeight: 500 }}
                        >
                          <PenLine className="w-3 h-3" /> {i.cfManualMerge}
                        </button>
                      </>
                    ) : (
                      <button onClick={() => unresolveConflict(activeConflict.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] ${t.transition} ${t.interactive.iconBtn}`}>
                        Undo Resolution
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigateConflict(-1)} className={`px-2 py-1 rounded-lg text-[9px] ${t.transition} ${t.interactive.iconBtn}`}>
                      ← {i.cfPrevConflict}
                    </button>
                    <button onClick={() => navigateConflict(1)} className={`px-2 py-1 rounded-lg text-[9px] ${t.transition} ${t.interactive.iconBtn}`}>
                      {i.cfNextConflict} →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  )
}
