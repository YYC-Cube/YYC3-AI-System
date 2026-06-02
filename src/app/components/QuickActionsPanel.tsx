/**
 * @file QuickActionsPanel.tsx
 * @description YYC³便携式智能AI系统 - AI快速操作面板
 * AI Quick Actions Panel (Liquid Glass)
 * Full-featured panel for code/document/text/AI one-click operations,
 * clipboard history, and context-aware intelligent transformations.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,quick-actions,ai,clipboard
 */

import {
  X, Copy, FileCode, FileType, AlignLeft, RefreshCw, Zap, FileText,
  ListCollapse, ArrowRightLeft, Languages, Pencil, Maximize2, SpellCheck,
  HelpCircle, TestTube, BookOpen, Bug, MessageSquarePlus, Clipboard,
  Trash2, Clock, CheckCircle, Loader2,
  Code2, FileEdit, Brain, Sparkles, Search, ArrowUpRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'

import {
  quickActionsService, QUICK_ACTIONS,
  getClipboardHistory, clearClipboardHistory, removeClipboardItem,
  type QuickAction, type ActionContext, type ActionResult, type ActionCategory,
  type ClipboardHistoryItem,
} from '../services/quick-actions'
import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

// ── Icon Map ──
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Copy, FileCode, FileType, AlignLeft, RefreshCw, Zap, FileText,
  ListCollapse, ArrowRightLeft, Languages, Pencil, Maximize2, SpellCheck,
  HelpCircle, TestTube, BookOpen, Bug, MessageSquarePlus,
}

function getActionIcon(iconName: string) {
  return ICON_MAP[iconName] || Sparkles
}

// ── Category Config ──
const CATEGORIES: { id: ActionCategory; labelKey: string; icon: React.ComponentType<any>; color: string }[] = [
  { id: 'code', labelKey: 'qaCatCode', icon: Code2, color: 'text-blue-400' },
  { id: 'document', labelKey: 'qaCatDocument', icon: FileEdit, color: 'text-emerald-400' },
  { id: 'text', labelKey: 'qaCatText', icon: Pencil, color: 'text-amber-400' },
  { id: 'ai', labelKey: 'qaCatAI', icon: Brain, color: 'text-purple-400' },
]

// ── Main Component ──
export function QuickActionsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, language, selectedFile, aiModels, activeModelId } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const [activeTab, setActiveTab] = useState<'actions' | 'clipboard'>('actions')
  const [activeCategory, setActiveCategory] = useState<ActionCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectionText, setSelectionText] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<ActionResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardHistoryItem[]>([])
  const [translateTarget, setTranslateTarget] = useState('en')

  const hasActiveModel = useMemo(() => {
    if (!activeModelId) return false
    const model = aiModels.find(m => m.id === activeModelId)
    return model?.status === 'connected'
  }, [aiModels, activeModelId])

  // Load clipboard history when tab switches
  useEffect(() => {
    if (activeTab === 'clipboard') {
      setClipboardHistory(getClipboardHistory())
    }
  }, [activeTab])

  // Try to read current selection from the page
  useEffect(() => {
    if (open) {
      const sel = window.getSelection()?.toString() || ''
      setSelectionText(sel)
    }
  }, [open])

  const filteredActions = useMemo(() => {
    let actions = QUICK_ACTIONS
    if (activeCategory !== 'all') {
      actions = actions.filter(a => a.category === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      actions = actions.filter(a => {
        const title = (i as unknown as Record<string, string>)[a.titleKey] || a.titleKey
        const desc = (i as unknown as Record<string, string>)[a.descKey] || a.descKey
        return title.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || a.type.includes(q)
      })
    }
    return actions
  }, [activeCategory, searchQuery, i])

  const handleExecuteAction = useCallback(async (action: QuickAction) => {
    const text = selectionText.trim()
    if (action.requiresSelection && !text) {
      toast.error(i.qaNoSelection || 'No text selected. Select text in the editor first.')
      return
    }

    setProcessing(action.id)
    setShowResult(false)

    const context: ActionContext = {
      selection: { text },
      file: selectedFile ? { path: selectedFile, name: selectedFile, language: inferLanguage(selectedFile) } : undefined,
    }

    const params: Record<string, string> = {}
    if (action.type === 'translate') {
      params.toLanguage = translateTarget
    }

    const result = await quickActionsService.executeAction(action, context, params)

    setProcessing(null)
    setLastResult(result)

    if (result.status === 'success') {
      if (['copy', 'copy-markdown', 'copy-html'].includes(action.type)) {
        toast.success(i.qaCopied || 'Copied to clipboard!')
        setClipboardHistory(getClipboardHistory())
      } else if (result.content) {
        setShowResult(true)
        toast.success(`${(i as unknown as Record<string, string>)[action.titleKey] || action.type} completed (${result.duration}ms)`)
      }
    } else {
      toast.error(result.error || 'Action failed')
    }
  }, [selectionText, selectedFile, i, translateTarget])

  const handleCopyResult = useCallback(async () => {
    if (lastResult?.content) {
      await navigator.clipboard.writeText(lastResult.content)
      toast.success(i.qaCopied || 'Copied!')
    }
  }, [lastResult, i])

  const handleApplyResult = useCallback(() => {
    if (lastResult?.content) {
      const file = selectedFile || 'snippet.tsx'
      const lang = inferLanguage(file)
      useAppStore.getState().injectCode(file, lastResult.content, lang)
      toast.success(i.qaApplied || 'Applied to editor!')
      setShowResult(false)
    }
  }, [lastResult, selectedFile])

  const handleClipboardPaste = useCallback(async (item: ClipboardHistoryItem) => {
    await navigator.clipboard.writeText(item.content)
    toast.success(i.qaCopied || 'Copied to clipboard!')
  }, [i])

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[720px] max-w-[92vw] max-h-[85vh] rounded-2xl overflow-hidden border flex flex-col ${
              t.isDark
                ? 'bg-slate-900/95 border-white/10 shadow-2xl shadow-black/40'
                : 'bg-white/95 border-slate-200 shadow-2xl shadow-slate-300/30'
            } backdrop-blur-xl`}
          >
            {/* ── Header ── */}
            <div className={`flex items-center justify-between px-5 py-3.5 border-b ${t.isDark ? 'border-white/8' : 'border-slate-200/60'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${t.isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>
                  <Zap className={`w-4.5 h-4.5 ${t.isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                </div>
                <div>
                  <h2 className={`text-[15px] ${t.isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 600 }}>
                    {i.qaTitle || 'AI Quick Actions'}
                  </h2>
                  <p className={`text-[11px] ${t.text.muted}`}>
                    {i.qaSubtitle || 'One-click intelligent code, text & document operations'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* AI Status Badge */}
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] ${
                  hasActiveModel
                    ? t.isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                    : t.isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${hasActiveModel ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                  {hasActiveModel ? 'AI Connected' : 'Mock Mode'}
                </div>
                <button onClick={onClose} className={`p-1.5 rounded-lg ${t.interactive.iconBtn}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Tab Switcher ── */}
            <div className={`flex items-center gap-1 px-5 pt-3 pb-2`}>
              {[
                { id: 'actions' as const, label: i.qaActionsTab || 'Actions', icon: Sparkles },
                { id: 'clipboard' as const, label: i.qaClipboardTab || 'Clipboard', icon: Clipboard },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all ${
                    activeTab === tab.id
                      ? t.isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                      : t.isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  style={{ fontWeight: activeTab === tab.id ? 600 : 400 }}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}

              {activeTab === 'actions' && (
                <div className="flex-1 flex justify-end">
                  <div className="relative">
                    <Search className={`absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 ${t.text.muted}`} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={i.qaSearchPlaceholder || 'Search actions...'}
                      className={`pl-7 pr-3 py-1.5 w-44 rounded-lg text-[11px] outline-none ${
                        t.isDark ? 'bg-white/5 text-slate-200 placeholder-slate-500 border border-white/8' : 'bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-4">
              {activeTab === 'actions' ? (
                <>
                  {/* Category Filter */}
                  <div className="flex items-center gap-1 mb-3">
                    <button
                      onClick={() => setActiveCategory('all')}
                      className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                        activeCategory === 'all'
                          ? t.isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                          : t.isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                      style={{ fontWeight: activeCategory === 'all' ? 600 : 400 }}
                    >
                      {i.qaAll || 'All'}
                    </button>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] transition-all ${
                          activeCategory === cat.id
                            ? t.isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                            : t.isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                        style={{ fontWeight: activeCategory === cat.id ? 600 : 400 }}
                      >
                        <cat.icon className={`w-3 h-3 ${activeCategory === cat.id ? '' : cat.color}`} />
                        {(i as unknown as Record<string, string>)[cat.labelKey] || cat.id}
                      </button>
                    ))}
                  </div>

                  {/* Selection Input */}
                  <div className={`mb-3 rounded-xl border p-3 ${t.isDark ? 'bg-slate-800/40 border-white/8' : 'bg-slate-50/80 border-slate-200/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>
                        {i.qaSelectionLabel || 'Selection / Input'}
                      </span>
                      <span className={`text-[10px] ${t.text.dimmed}`}>{selectionText.length} chars</span>
                    </div>
                    <textarea
                      value={selectionText}
                      onChange={e => setSelectionText(e.target.value)}
                      placeholder={i.qaSelectionPlaceholder || 'Paste or type code/text here, or select text in the editor...'}
                      className={`w-full h-20 resize-none rounded-lg px-3 py-2 text-[12px] outline-none font-mono ${
                        t.isDark
                          ? 'bg-slate-900/60 text-slate-200 placeholder-slate-600 border border-white/5'
                          : 'bg-white text-slate-800 placeholder-slate-400 border border-slate-200'
                      }`}
                    />
                    {/* Translate target language selector — visible only when translate is active category */}
                    {(activeCategory === 'text' || activeCategory === 'all') && (
                      <div className="flex items-center gap-2 mt-2">
                        <Languages className={`w-3 h-3 ${t.text.muted}`} />
                        <span className={`text-[10px] ${t.text.muted}`}>{i.qaTranslateTo || 'Translate to'}:</span>
                        <select
                          value={translateTarget}
                          onChange={e => setTranslateTarget(e.target.value)}
                          className={`text-[11px] px-2 py-0.5 rounded-md outline-none ${
                            t.isDark ? 'bg-slate-800 text-slate-200 border border-white/10' : 'bg-white text-slate-800 border border-slate-200'
                          }`}
                        >
                          <option value="en">English</option>
                          <option value="zh">中文</option>
                          <option value="ja">日本語</option>
                          <option value="ko">한국어</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {filteredActions.map(action => {
                      const Icon = getActionIcon(action.icon)
                      const isProcessing = processing === action.id
                      const title = (i as unknown as Record<string, string>)[action.titleKey] || action.type
                      const desc = (i as unknown as Record<string, string>)[action.descKey] || ''

                      return (
                        <button
                          key={action.id}
                          onClick={() => handleExecuteAction(action)}
                          disabled={!!processing}
                          className={`group flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                            isProcessing
                              ? t.isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'
                              : t.isDark
                                ? 'bg-slate-800/30 border-white/5 hover:bg-slate-800/60 hover:border-white/10'
                                : 'bg-white/60 border-slate-200/50 hover:bg-white hover:border-slate-300'
                          } ${processing && !isProcessing ? 'opacity-50' : ''}`}
                        >
                          <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                            action.category === 'code' ? t.isDark ? 'bg-blue-500/15' : 'bg-blue-50'
                              : action.category === 'document' ? t.isDark ? 'bg-emerald-500/15' : 'bg-emerald-50'
                              : action.category === 'text' ? t.isDark ? 'bg-amber-500/15' : 'bg-amber-50'
                              : t.isDark ? 'bg-purple-500/15' : 'bg-purple-50'
                          }`}>
                            {isProcessing
                              ? <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                              : <Icon className={`w-3.5 h-3.5 ${
                                  action.category === 'code' ? 'text-blue-400'
                                    : action.category === 'document' ? 'text-emerald-400'
                                    : action.category === 'text' ? 'text-amber-400'
                                    : 'text-purple-400'
                                }`}
                              />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[12px] ${t.isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 500 }}>
                                {title}
                              </span>
                              {action.requiresAI && (
                                <span className={`text-[8px] px-1 py-0.5 rounded ${t.isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-600'}`}>AI</span>
                              )}
                            </div>
                            <p className={`text-[10px] ${t.text.dimmed} truncate`}>{desc}</p>
                          </div>
                          {action.shortcut && (
                            <span className={`text-[9px] ${t.text.dimmed} flex-shrink-0 self-center`}>{action.shortcut}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {filteredActions.length === 0 && (
                    <div className={`text-center py-8 text-[13px] ${t.text.muted}`}>
                      {i.qaNoResults || 'No actions match your search.'}
                    </div>
                  )}

                  {/* Result Display */}
                  <AnimatePresence>
                    {showResult && lastResult?.content && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`mt-3 rounded-xl border overflow-hidden ${t.isDark ? 'bg-slate-800/50 border-white/8' : 'bg-white border-slate-200'}`}
                      >
                        <div className={`flex items-center justify-between px-3 py-2 border-b ${t.isDark ? 'border-white/5' : 'border-slate-100'}`}>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span className={`text-[11px] ${t.isDark ? 'text-slate-200' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
                              {i.qaResultTitle || 'Result'}
                            </span>
                            <span className={`text-[10px] ${t.text.dimmed}`}>{lastResult.duration}ms</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={handleCopyResult}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] ${t.isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-50 text-slate-500'}`}
                            >
                              <Copy className="w-3 h-3" /> {i.qaCopyResult || 'Copy'}
                            </button>
                            <button
                              onClick={handleApplyResult}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] ${t.isDark ? 'bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                            >
                              <ArrowUpRight className="w-3 h-3" /> {i.qaApplyResult || 'Apply'}
                            </button>
                            <button
                              onClick={() => setShowResult(false)}
                              className={`p-1 rounded-md ${t.isDark ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-50 text-slate-400'}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className={`p-3 max-h-48 overflow-y-auto custom-scrollbar`}>
                          <pre className={`text-[11px] font-mono whitespace-pre-wrap ${t.isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {lastResult.content}
                          </pre>
                          {lastResult.explanation && (
                            <div className={`mt-2 pt-2 border-t text-[11px] ${t.isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                              {lastResult.explanation}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                /* ── Clipboard History Tab ── */
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[11px] ${t.text.muted}`}>
                      {clipboardHistory.length} {i.qaClipboardItems || 'items'}
                    </span>
                    {clipboardHistory.length > 0 && (
                      <button
                        onClick={() => { clearClipboardHistory(); setClipboardHistory([]) }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] ${t.isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}
                      >
                        <Trash2 className="w-3 h-3" />
                        {i.qaClipboardClear || 'Clear All'}
                      </button>
                    )}
                  </div>

                  {clipboardHistory.length === 0 ? (
                    <div className={`text-center py-12 ${t.text.muted}`}>
                      <Clipboard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-[12px]">{i.qaClipboardEmpty || 'Clipboard history is empty'}</p>
                      <p className="text-[10px] mt-1 opacity-60">{i.qaClipboardHint || 'Use Copy actions to build your history'}</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {clipboardHistory.map(item => (
                        <div
                          key={item.id}
                          className={`group flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                            t.isDark
                              ? 'bg-slate-800/30 border-white/5 hover:bg-slate-800/60'
                              : 'bg-white/60 border-slate-200/50 hover:bg-white'
                          }`}
                          onClick={() => handleClipboardPaste(item)}
                        >
                          <div className={`p-1 rounded-md flex-shrink-0 mt-0.5 ${
                            item.type === 'code' ? t.isDark ? 'bg-blue-500/15' : 'bg-blue-50'
                              : item.type === 'markdown' ? t.isDark ? 'bg-emerald-500/15' : 'bg-emerald-50'
                              : t.isDark ? 'bg-slate-700/50' : 'bg-slate-100'
                          }`}>
                            {item.type === 'code' ? <Code2 className="w-3 h-3 text-blue-400" />
                              : item.type === 'markdown' ? <FileCode className="w-3 h-3 text-emerald-400" />
                              : item.type === 'html' ? <FileType className="w-3 h-3 text-orange-400" />
                              : <FileText className="w-3 h-3 text-slate-400" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[10px] ${t.isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {item.type}{item.language ? ` / ${item.language}` : ''}
                              </span>
                              <span className={`text-[9px] ${t.text.dimmed}`}>{item.size} chars</span>
                              {item.sourceFile && (
                                <span className={`text-[9px] ${t.text.dimmed} truncate max-w-24`}>{item.sourceFile}</span>
                              )}
                            </div>
                            <p className={`text-[11px] font-mono truncate ${t.isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              {item.preview}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className={`w-2.5 h-2.5 ${t.text.dimmed}`} />
                              <span className={`text-[9px] ${t.text.dimmed}`}>
                                {formatTimeAgo(item.copiedAt, language)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); removeClipboardItem(item.id); setClipboardHistory(prev => prev.filter(h => h.id !== item.id)) }}
                            className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${t.isDark ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className={`flex items-center justify-between px-5 py-2.5 border-t text-[10px] ${t.isDark ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
              <span>{i.qaFooterHint || 'Select text in editor, then use actions. AI actions require a connected model.'}</span>
              <span className={`${t.text.dimmed}`}>Ctrl+Shift+Q</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Helpers ──

function inferLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    tsx: 'typescript', ts: 'typescript', jsx: 'javascript', js: 'javascript',
    css: 'css', html: 'html', json: 'json', md: 'markdown',
    py: 'python', rs: 'rust', go: 'go', java: 'java', rb: 'ruby',
    vue: 'vue', svelte: 'svelte', sql: 'sql', yaml: 'yaml', yml: 'yaml',
  }
  return map[ext] || ext || 'text'
}

function formatTimeAgo(timestamp: number, lang: string): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (lang === 'zh') {
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return `${days}天前`
  }
  if (lang === 'ja') {
    if (minutes < 1) return 'たった今'
    if (minutes < 60) return `${minutes}分前`
    if (hours < 24) return `${hours}時間前`
    return `${days}日前`
  }
  if (lang === 'ko') {
    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    return `${days}일 전`
  }
  // en
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
