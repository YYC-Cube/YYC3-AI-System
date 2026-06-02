/**
 * @file ActivityTimeline.tsx
 * @description YYC³便携式智能AI系统 - 活动时间线面板
 * Activity Timeline Panel
 * Real-time team collaboration feed: edits, comments, reviews, deploys.
 * Filterable by category with animated entries and avatars.
 * Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,activity,timeline,collaboration
 */

import {
  X, Activity, FileEdit, MessageSquare, Eye, Rocket,
  GitBranch, GitMerge, CheckCircle2, Heart, Reply,
  Filter
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import React, { useState, useMemo } from 'react'

import { useAppStore } from '../store'
import { getI18n, resolveKey } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

/* ── Types ── */
type ActivityType = 'edit' | 'comment' | 'review' | 'deploy' | 'branch' | 'merge' | 'resolve' | 'reaction'
type FilterType = 'all' | 'edit' | 'comment' | 'review' | 'deploy'

interface TimelineEntry {
  id: string
  type: ActivityType
  user: { name: string; avatar: string; color: string }
  action: string
  target: string
  detail?: string
  time: number // minutes ago
}

/* ── Mock data ── */
const MOCK_ENTRIES: TimelineEntry[] = [
  { id: 'a1', type: 'edit', user: { name: 'You', avatar: 'Y', color: '#818cf8' }, action: 'atEditedFile', target: 'IDELayout.tsx', detail: '+42 -8', time: 2 },
  { id: 'a2', type: 'comment', user: { name: 'Alice', avatar: 'A', color: '#f472b6' }, action: 'atCommentedOn', target: 'store.ts:148', detail: 'Should we persist the new panel states?', time: 8 },
  { id: 'a3', type: 'deploy', user: { name: 'CI Bot', avatar: 'CI', color: '#22c55e' }, action: 'atDeployedTo', target: 'atStaging', detail: 'Build #247 successful', time: 15 },
  { id: 'a4', type: 'review', user: { name: 'Bob', avatar: 'B', color: '#f97316' }, action: 'atReviewedPR', target: '#42 Advanced Features', detail: 'Approved with suggestions', time: 25 },
  { id: 'a5', type: 'branch', user: { name: 'You', avatar: 'Y', color: '#818cf8' }, action: 'atCreatedBranch', target: 'feature/advanced-panels', time: 40 },
  { id: 'a6', type: 'edit', user: { name: 'Alice', avatar: 'A', color: '#f472b6' }, action: 'atEditedFile', target: 'ThemeCustomizer.tsx', detail: '+18 -5', time: 55 },
  { id: 'a7', type: 'merge', user: { name: 'Bob', avatar: 'B', color: '#f97316' }, action: 'atMergedPR', target: '#41 i18n Fixes', time: 80 },
  { id: 'a8', type: 'resolve', user: { name: 'You', avatar: 'Y', color: '#818cf8' }, action: 'atResolvedIssue', target: '#15 Type safety', time: 95 },
  { id: 'a9', type: 'comment', user: { name: 'DevBot', avatar: 'D', color: '#a78bfa' }, action: 'atCommentedOn', target: 'CommandPalette.tsx:67', detail: 'Consider adding fuzzy matching threshold config', time: 120 },
  { id: 'a10', type: 'deploy', user: { name: 'CI Bot', avatar: 'CI', color: '#22c55e' }, action: 'atDeployedTo', target: 'atProduction', detail: 'Build #246 — v2.1.0', time: 180 },
  { id: 'a11', type: 'reaction', user: { name: 'Alice', avatar: 'A', color: '#f472b6' }, action: 'atAddedReaction', target: 'PR #42 comment', time: 200 },
]

/* ── Activity icon map ── */
function getActivityIcon(type: ActivityType): React.ElementType {
  const map: Record<ActivityType, React.ElementType> = {
    edit: FileEdit,
    comment: MessageSquare,
    review: Eye,
    deploy: Rocket,
    branch: GitBranch,
    merge: GitMerge,
    resolve: CheckCircle2,
    reaction: Heart,
  }
  return map[type]
}

function getActivityBg(type: ActivityType, isDark: boolean): string {
  const map: Record<ActivityType, string> = {
    edit: isDark ? 'bg-blue-500/15' : 'bg-blue-50',
    comment: isDark ? 'bg-purple-500/15' : 'bg-purple-50',
    review: isDark ? 'bg-amber-500/15' : 'bg-amber-50',
    deploy: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50',
    branch: isDark ? 'bg-cyan-500/15' : 'bg-cyan-50',
    merge: isDark ? 'bg-indigo-500/15' : 'bg-indigo-50',
    resolve: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50',
    reaction: isDark ? 'bg-pink-500/15' : 'bg-pink-50',
  }
  return map[type]
}

function getActivityColor(type: ActivityType, isDark: boolean): string {
  const map: Record<ActivityType, string> = {
    edit: isDark ? 'text-blue-400' : 'text-blue-600',
    comment: isDark ? 'text-purple-400' : 'text-purple-600',
    review: isDark ? 'text-amber-400' : 'text-amber-600',
    deploy: isDark ? 'text-emerald-400' : 'text-emerald-600',
    branch: isDark ? 'text-cyan-400' : 'text-cyan-600',
    merge: isDark ? 'text-indigo-400' : 'text-indigo-600',
    resolve: isDark ? 'text-emerald-400' : 'text-emerald-600',
    reaction: isDark ? 'text-pink-400' : 'text-pink-600',
  }
  return map[type]
}

/* ══════════════════════════════════════════════════ */
/*  ActivityTimeline — Main Component                */
/* ══════════════════════════════════════════════════ */

export function ActivityTimeline() {
  const { theme, language, activityTimelineOpen, setActivityTimelineOpen } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return MOCK_ENTRIES
    const map: Record<FilterType, ActivityType[]> = {
      all: [],
      edit: ['edit'],
      comment: ['comment'],
      review: ['review'],
      deploy: ['deploy'],
    }
    return MOCK_ENTRIES.filter(e => map[filter].includes(e.type))
  }, [filter])

  const formatTime = (mins: number): string => {
    if (mins < 1) return i.atJustNow
    if (mins < 60) return i.atMinutesAgo.replace('{n}', String(mins))
    return i.atHoursAgo.replace('{n}', String(Math.floor(mins / 60)))
  }

  const resolveActionTarget = (entry: TimelineEntry): { actionText: string; targetText: string } => {
    const actionText = resolveKey(i, entry.action)
    const targetText = resolveKey(i, entry.target)
    return { actionText, targetText }
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: i.atAll },
    { key: 'edit', label: i.atEdits },
    { key: 'comment', label: i.atComments },
    { key: 'review', label: i.atReviews },
    { key: 'deploy', label: i.atDeploys },
  ]

  if (!activityTimelineOpen) return null

  return (
    <AnimatePresence>
      {activityTimelineOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setActivityTimelineOpen(false)}
          />

          <motion.div
            className={`fixed top-0 right-0 bottom-0 z-[61] w-[380px] max-w-[90vw] flex flex-col ${t.surface.popover} border-l ${t.border.subtle} shadow-2xl`}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${t.border.subtle}`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${t.isDark ? 'bg-cyan-500/15' : 'bg-cyan-50'}`}>
                  <Activity className={`w-5 h-5 ${t.isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                </div>
                <div>
                  <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 600 }}>{i.atTitle}</h2>
                  <p className={`text-[10px] ${t.text.muted}`}>{i.atSubtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setActivityTimelineOpen(false)}
                className={`p-1.5 rounded-lg ${t.interactive.iconBtn} ${t.transition}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter bar */}
            <div className={`flex items-center gap-1 px-4 py-2.5 border-b ${t.border.subtle}`}>
              <Filter className={`w-3 h-3 ${t.text.muted} mr-1`} />
              {filters.map(f => {
                const isActive = filter === f.key
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] ${t.transition} ${
                      isActive
                        ? `${t.accent.activeBg} ${t.accent.activeText}`
                        : `${t.text.muted} ${t.interactive.hoverBg}`
                    }`}
                    style={{ fontWeight: isActive ? 600 : 400 }}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>

            {/* Timeline entries */}
            <div className={`flex-1 overflow-y-auto ${t.scrollbar} px-4 py-3`}>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Activity className={`w-10 h-10 ${t.text.dimmed}`} />
                  <span className={`text-[12px] ${t.text.muted}`}>{i.atNoActivity}</span>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className={`absolute left-[17px] top-4 bottom-4 w-px ${t.border.divider}`} />

                  <div className="space-y-0.5">
                    {filtered.map((entry, idx) => {
                      const Icon = getActivityIcon(entry.type)
                      const { actionText, targetText } = resolveActionTarget(entry)
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className={`relative flex items-start gap-3 pl-1 py-2.5 rounded-lg ${t.transition}`}
                        >
                          {/* Icon dot */}
                          <div className={`relative z-10 w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0 ${getActivityBg(entry.type, t.isDark)}`}>
                            <Icon className={`w-4 h-4 ${getActivityColor(entry.type, t.isDark)}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className={`text-[11px] ${t.text.primary}`}>
                              <span style={{ fontWeight: 600, color: entry.user.color }}>{entry.user.name}</span>
                              {' '}
                              <span className={t.text.secondary}>{actionText}</span>
                              {' '}
                              <span className={`${t.accent.activeText}`} style={{ fontWeight: 500 }}>{targetText}</span>
                            </div>

                            {/* Detail / comment body */}
                            {entry.detail && (
                              <div className={`mt-1 px-2.5 py-1.5 rounded-lg text-[10px] ${
                                entry.type === 'comment'
                                  ? t.isDark ? 'bg-white/[0.03] border border-white/5' : 'bg-slate-50 border border-slate-100'
                                  : `${t.text.dimmed}`
                              } ${entry.type === 'comment' ? t.text.secondary : ''}`}>
                                {entry.type === 'comment' ? (
                                  <>
                                    <span>{entry.detail}</span>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <button className={`flex items-center gap-0.5 text-[9px] ${t.text.muted} hover:${t.accent.activeText} ${t.transition}`}>
                                        <Reply className="w-2.5 h-2.5" /> {i.atReply}
                                      </button>
                                      <button className={`flex items-center gap-0.5 text-[9px] ${t.text.muted} hover:text-pink-400 ${t.transition}`}>
                                        <Heart className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <span>{entry.detail}</span>
                                )}
                              </div>
                            )}

                            {/* Timestamp */}
                            <div className={`mt-1 text-[9px] ${t.text.dimmed}`}>
                              {formatTime(entry.time)}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}