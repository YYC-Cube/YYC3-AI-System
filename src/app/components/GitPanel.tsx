/**
 * @file GitPanel.tsx
 * @description YYC³便携式智能AI系统 - Git集成面板
 * Git Integration Panel
 * Full visual Git workflow: branches, staging area, commit history, push/pull.
 * 3-tab layout (Changes / Commits / Branches) with Liquid Glass aesthetic.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,git,version-control,workflow
 */

import {
  X, GitBranch, GitCommit,
  Plus, Minus, ChevronDown, ChevronRight, Check, Upload,
  Download, RefreshCw, Trash2, FileCode, FilePlus,
  FileEdit, Circle, MoreHorizontal, ArrowUpRight, ArrowDownLeft,
  GitCompare
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import React, { useState, useMemo } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

/* ── Types ── */
type FileStatus = 'modified' | 'added' | 'deleted' | 'renamed'
type GitTab = 'changes' | 'commits' | 'branches'

interface GitFile {
  id: string
  name: string
  path: string
  status: FileStatus
  staged: boolean
  additions: number
  deletions: number
}

interface Commit {
  id: string
  hash: string
  message: string
  author: string
  time: string
  branch: string
  avatar: string
}

interface Branch {
  name: string
  current: boolean
  ahead: number
  behind: number
  lastCommit: string
}

/* ── Mock data ── */
const MOCK_FILES: GitFile[] = [
  { id: 'g1', name: 'IDELayout.tsx', path: 'src/app/components/', status: 'modified', staged: true, additions: 42, deletions: 8 },
  { id: 'g2', name: 'store.ts', path: 'src/app/', status: 'modified', staged: true, additions: 18, deletions: 3 },
  { id: 'g3', name: 'i18n-data.ts', path: 'src/app/utils/', status: 'modified', staged: false, additions: 95, deletions: 0 },
  { id: 'g4', name: 'AiCodeIntel.tsx', path: 'src/app/components/', status: 'added', staged: false, additions: 280, deletions: 0 },
  { id: 'g5', name: 'GitPanel.tsx', path: 'src/app/components/', status: 'added', staged: false, additions: 350, deletions: 0 },
  { id: 'g6', name: 'old-utils.ts', path: 'src/app/utils/', status: 'deleted', staged: false, additions: 0, deletions: 45 },
]

const MOCK_COMMITS: Commit[] = [
  { id: 'c1', hash: 'a3f21b9', message: 'feat: add Command Palette and Search Panel', author: 'You', time: '2h ago', branch: 'main', avatar: 'Y' },
  { id: 'c2', hash: 'e8d4c12', message: 'fix: resolve i18n key sync issues', author: 'You', time: '4h ago', branch: 'main', avatar: 'Y' },
  { id: 'c3', hash: 'b7a6e03', message: 'feat: implement Notification Center', author: 'DevBot', time: '6h ago', branch: 'main', avatar: 'D' },
  { id: 'c4', hash: '9c5f8d1', message: 'refactor: migrate (i as any) to resolveKey', author: 'You', time: '1d ago', branch: 'main', avatar: 'Y' },
  { id: 'c5', hash: '2d1e4a7', message: 'feat: theme customizer with presets', author: 'Alice', time: '2d ago', branch: 'feature/themes', avatar: 'A' },
  { id: 'c6', hash: 'f6b3c89', message: 'chore: update dependencies', author: 'CI Bot', time: '3d ago', branch: 'main', avatar: 'C' },
]

const MOCK_BRANCHES: Branch[] = [
  { name: 'main', current: true, ahead: 2, behind: 0, lastCommit: '2h ago' },
  { name: 'feature/advanced-panels', current: false, ahead: 5, behind: 1, lastCommit: '30m ago' },
  { name: 'feature/themes', current: false, ahead: 0, behind: 3, lastCommit: '2d ago' },
  { name: 'fix/i18n-sync', current: false, ahead: 0, behind: 0, lastCommit: '4h ago' },
  { name: 'develop', current: false, ahead: 8, behind: 2, lastCommit: '1d ago' },
]

/* ── File status icon/color helpers ── */
function getStatusIcon(status: FileStatus) {
  switch (status) {
    case 'modified': return FileEdit
    case 'added': return FilePlus
    case 'deleted': return Trash2
    case 'renamed': return FileCode
  }
}

function getStatusColor(status: FileStatus, isDark: boolean): string {
  const map: Record<FileStatus, string> = {
    modified: isDark ? 'text-amber-400' : 'text-amber-600',
    added: isDark ? 'text-emerald-400' : 'text-emerald-600',
    deleted: isDark ? 'text-red-400' : 'text-red-500',
    renamed: isDark ? 'text-blue-400' : 'text-blue-600',
  }
  return map[status]
}

function getStatusBadge(status: FileStatus): string {
  const map: Record<FileStatus, string> = {
    modified: 'M',
    added: 'A',
    deleted: 'D',
    renamed: 'R',
  }
  return map[status]
}

/* ══════════════════════════════════════════════════ */
/*  GitPanel — Main Component                        */
/* ══════════════════════════════════════════════════ */

export function GitPanel() {
  const { theme, language, gitPanelOpen, setGitPanelOpen } = useAppStore()
  const t = getThemeTokens(theme)
  const ig = getI18n(language)

  const [activeTab, setActiveTab] = useState<GitTab>('changes')
  const [files, setFiles] = useState<GitFile[]>(MOCK_FILES)
  const [commitMsg, setCommitMsg] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['staged', 'unstaged']))

  const staged = useMemo(() => files.filter(f => f.staged), [files])
  const unstaged = useMemo(() => files.filter(f => !f.staged), [files])

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const stageFile = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, staged: true } : f))
  }

  const unstageFile = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, staged: false } : f))
  }

  const stageAll = () => {
    setFiles(prev => prev.map(f => ({ ...f, staged: true })))
  }

  const handleCommit = () => {
    if (!commitMsg.trim() || staged.length === 0) return
    toast.success(`${ig.gpCommit}: ${commitMsg}`)
    setFiles(prev => prev.filter(f => !f.staged))
    setCommitMsg('')
  }

  if (!gitPanelOpen) return null

  const tabs: { key: GitTab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'changes', label: ig.gpChanges, icon: FileEdit, count: files.length },
    { key: 'commits', label: ig.gpCommits, icon: GitCommit, count: MOCK_COMMITS.length },
    { key: 'branches', label: ig.gpBranches, icon: GitBranch, count: MOCK_BRANCHES.length },
  ]

  return (
    <AnimatePresence>
      {gitPanelOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setGitPanelOpen(false)}
          />

          <motion.div
            className={`fixed top-0 right-0 bottom-0 z-[61] w-[400px] max-w-[90vw] flex flex-col ${t.surface.popover} border-l ${t.border.subtle} shadow-2xl`}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${t.border.subtle}`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${t.isDark ? 'bg-orange-500/15' : 'bg-orange-50'}`}>
                  <GitBranch className={`w-5 h-5 ${t.isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                </div>
                <div>
                  <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 600 }}>{ig.gpTitle}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
                    <span className={`text-[10px] ${t.text.muted}`}>main</span>
                    {MOCK_BRANCHES[0].ahead > 0 && (
                      <span className={`text-[9px] px-1 rounded ${t.isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                        <ArrowUpRight className="w-2.5 h-2.5 inline" /> {MOCK_BRANCHES[0].ahead} {ig.gpAhead}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toast.success(ig.gpFetch)} className={`p-1.5 rounded-lg ${t.interactive.iconBtn} ${t.transition}`} title={ig.gpFetch}>
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => setGitPanelOpen(false)} className={`p-1.5 rounded-lg ${t.interactive.iconBtn} ${t.transition}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick actions bar */}
            <div className={`flex items-center gap-1.5 px-4 py-2 border-b ${t.border.subtle}`}>
              <button onClick={() => toast.success(ig.gpPull)} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] ${t.interactive.iconBtn} ${t.transition}`} style={{ fontWeight: 500 }}>
                <Download className="w-3 h-3" /> {ig.gpPull}
              </button>
              <button onClick={() => toast.success(ig.gpPush)} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] ${t.interactive.iconBtn} ${t.transition}`} style={{ fontWeight: 500 }}>
                <Upload className="w-3 h-3" /> {ig.gpPush}
              </button>
              <button onClick={() => toast.success(ig.gpStash)} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] ${t.interactive.iconBtn} ${t.transition}`} style={{ fontWeight: 500 }}>
                <MoreHorizontal className="w-3 h-3" /> {ig.gpStash}
              </button>
            </div>

            {/* Tabs */}
            <div className={`flex items-center border-b ${t.border.subtle}`}>
              {tabs.map(tab => {
                const isActive = activeTab === tab.key
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] border-b-2 ${t.transition} ${
                      isActive
                        ? `${t.accent.activeText} border-current`
                        : `${t.text.muted} border-transparent hover:${t.text.secondary}`
                    }`}
                    style={{ fontWeight: isActive ? 600 : 400 }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={`px-1.5 py-px rounded-full text-[8px] ${isActive ? 'opacity-80' : 'opacity-50'}`} style={{ fontWeight: 700 }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <div className={`flex-1 overflow-y-auto ${t.scrollbar}`}>
              {/* ── Changes Tab ── */}
              {activeTab === 'changes' && (
                <div className="flex flex-col h-full">
                  {/* Commit message input */}
                  <div className={`p-3 border-b ${t.border.subtle}`}>
                    <textarea
                      value={commitMsg}
                      onChange={(e) => setCommitMsg(e.target.value)}
                      placeholder={ig.gpCommitMsg}
                      rows={2}
                      className={`w-full px-3 py-2 rounded-lg text-[11px] resize-none ${t.input.base} ${t.text.placeholder}`}
                    />
                    <button
                      onClick={handleCommit}
                      disabled={!commitMsg.trim() || staged.length === 0}
                      className={`w-full mt-2 py-1.5 rounded-lg text-[11px] ${t.transition} ${
                        commitMsg.trim() && staged.length > 0
                          ? t.accent.solidBtn
                          : `${t.isDark ? 'bg-slate-700/50 text-slate-500' : 'bg-slate-200 text-slate-400'} cursor-not-allowed`
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      <Check className="w-3.5 h-3.5 inline mr-1" />
                      {ig.gpCommit} ({staged.length})
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                    {/* Staged section */}
                    <div>
                      <button onClick={() => toggleSection('staged')} className={`flex items-center justify-between w-full py-1.5 text-[10px] ${t.text.muted}`} style={{ fontWeight: 600 }}>
                        <div className="flex items-center gap-1">
                          {expandedSections.has('staged') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          {ig.gpStaged} ({staged.length})
                        </div>
                      </button>
                      <AnimatePresence>
                        {expandedSections.has('staged') && staged.map(f => {
                          const Icon = getStatusIcon(f.status)
                          return (
                            <motion.div
                              key={f.id}
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${t.interactive.hoverBg} ${t.transition} group`}
                            >
                              <Icon className={`w-3.5 h-3.5 ${getStatusColor(f.status, t.isDark)}`} />
                              <span className={`flex-1 text-[11px] ${t.text.secondary} truncate`}>{f.name}</span>
                              <span className={`text-[9px] ${t.isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>+{f.additions}</span>
                              {f.deletions > 0 && <span className={`text-[9px] ${t.isDark ? 'text-red-400' : 'text-red-500'}`}>-{f.deletions}</span>}
                              <button onClick={() => useAppStore.getState().setGitDiffFile(f.name)} className={`opacity-0 group-hover:opacity-100 p-0.5 rounded ${t.interactive.iconBtn} ${t.transition}`} title={ig.gdViewDiff}>
                                <GitCompare className="w-3 h-3" />
                              </button>
                              <button onClick={() => unstageFile(f.id)} className={`opacity-0 group-hover:opacity-100 p-0.5 rounded ${t.interactive.iconBtn} ${t.transition}`}>
                                <Minus className="w-3 h-3" />
                              </button>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>

                    {/* Unstaged section */}
                    <div>
                      <button onClick={() => toggleSection('unstaged')} className={`flex items-center justify-between w-full py-1.5 text-[10px] ${t.text.muted}`} style={{ fontWeight: 600 }}>
                        <div className="flex items-center gap-1">
                          {expandedSections.has('unstaged') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          {ig.gpUnstaged} ({unstaged.length})
                        </div>
                        {unstaged.length > 0 && (
                          <button onClick={(e) => { e.stopPropagation(); stageAll() }} className={`text-[9px] ${t.accent.activeText} hover:underline`}>
                            {ig.gpStageAll}
                          </button>
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedSections.has('unstaged') && unstaged.map(f => {
                          const Icon = getStatusIcon(f.status)
                          return (
                            <motion.div
                              key={f.id}
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${t.interactive.hoverBg} ${t.transition} group`}
                            >
                              <Icon className={`w-3.5 h-3.5 ${getStatusColor(f.status, t.isDark)}`} />
                              <span className={`flex-1 text-[11px] ${t.text.secondary} truncate`}>{f.path}{f.name}</span>
                              <span className={`text-[9px] px-1 rounded ${t.isDark ? 'bg-white/5' : 'bg-slate-100'} ${getStatusColor(f.status, t.isDark)}`} style={{ fontWeight: 600 }}>
                                {getStatusBadge(f.status)}
                              </span>
                              <button onClick={() => useAppStore.getState().setGitDiffFile(f.name)} className={`opacity-0 group-hover:opacity-100 p-0.5 rounded ${t.interactive.iconBtn} ${t.transition}`} title={ig.gdViewDiff}>
                                <GitCompare className="w-3 h-3" />
                              </button>
                              <button onClick={() => stageFile(f.id)} className={`opacity-0 group-hover:opacity-100 p-0.5 rounded ${t.interactive.iconBtn} ${t.transition}`}>
                                <Plus className="w-3 h-3" />
                              </button>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Commits Tab ── */}
              {activeTab === 'commits' && (
                <div className="px-3 py-2 space-y-0.5">
                  {MOCK_COMMITS.map((c, idx) => (
                    <div key={c.id} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg ${t.interactive.hoverBg} ${t.transition}`}>
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center gap-0.5 pt-0.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] ${
                          idx === 0 ? t.accent.solidBtn : t.isDark ? 'bg-slate-700/80 text-slate-400' : 'bg-slate-200 text-slate-500'
                        }`} style={{ fontWeight: 700 }}>
                          {c.avatar}
                        </div>
                        {idx < MOCK_COMMITS.length - 1 && (
                          <div className={`w-px flex-1 min-h-[16px] ${t.border.divider}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[11px] ${t.text.primary} break-words`} style={{ fontWeight: 500 }}>
                          {c.message}
                        </div>
                        <div className={`flex items-center gap-2 mt-1 text-[9px] ${t.text.dimmed}`}>
                          <code className={`px-1 py-px rounded ${t.isDark ? 'bg-white/5' : 'bg-slate-100'}`}>{c.hash}</code>
                          <span>{c.author}</span>
                          <span>{c.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Branches Tab ── */}
              {activeTab === 'branches' && (
                <div className="px-3 py-2 space-y-1">
                  <button className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed ${t.border.medium} ${t.interactive.hoverBg} ${t.transition} text-[11px] ${t.text.muted}`} style={{ fontWeight: 500 }}>
                    <Plus className="w-3.5 h-3.5" />
                    {ig.gpCreateBranch}
                  </button>

                  {MOCK_BRANCHES.map(b => (
                    <div
                      key={b.name}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${t.transition} ${
                        b.current
                          ? `${t.accent.activeBg} border ${t.isDark ? 'border-indigo-500/20' : 'border-indigo-200'}`
                          : `${t.interactive.hoverBg} border border-transparent`
                      }`}
                    >
                      <GitBranch className={`w-4 h-4 ${b.current ? t.accent.activeText : t.text.muted}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-[11px] ${b.current ? t.accent.activeText : t.text.primary}`} style={{ fontWeight: b.current ? 600 : 400 }}>
                          {b.name}
                          {b.current && (
                            <span className={`ml-1.5 text-[8px] px-1.5 py-px rounded-full ${t.isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`} style={{ fontWeight: 700 }}>
                              HEAD
                            </span>
                          )}
                        </div>
                        <div className={`flex items-center gap-2 mt-0.5 text-[9px] ${t.text.dimmed}`}>
                          <span>{b.lastCommit}</span>
                          {b.ahead > 0 && (
                            <span className={`${t.isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              <ArrowUpRight className="w-2.5 h-2.5 inline" /> {b.ahead}
                            </span>
                          )}
                          {b.behind > 0 && (
                            <span className={`${t.isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                              <ArrowDownLeft className="w-2.5 h-2.5 inline" /> {b.behind}
                            </span>
                          )}
                        </div>
                      </div>
                      {!b.current && (
                        <button className={`p-1 rounded-md text-[9px] ${t.interactive.iconBtn} ${t.transition}`} title={ig.gpSwitchBranch}>
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}