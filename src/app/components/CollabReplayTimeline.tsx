/**
 * @file CollabReplayTimeline.tsx
 * @description YYC³便携式智能AI系统 - 实时协作操作日志回放时间线
 * Real-time Collaboration Operation Log Replay Timeline
 * Full-screen overlay with playback controls, operation timeline, speed control,
 * and user-colored operation markers. Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,collaboration,replay,timeline
 */

import {
  Play, Pause, SkipBack, SkipForward, X,
  Rewind, FastForward, Radio,
  FileCode, MousePointer2, Type, Trash2,
  ArrowRightLeft, Eye, Clock, ChevronDown
} from 'lucide-react'
import { motion } from 'motion/react'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

/* ── Operation types ── */
type OpType = 'insert' | 'delete' | 'replace' | 'cursor-move' | 'file-switch' | 'selection'

interface ReplayOperation {
  id: string
  timestamp: number
  userId: string
  userName: string
  userColor: string
  type: OpType
  file: string
  line: number
  col: number
  content: string
  endLine?: number
  endCol?: number
}

/* ── Mock operation log ── */
function generateMockOps(): ReplayOperation[] {
  const baseTime = Date.now() - 600000 // 10 min ago
  const ops: ReplayOperation[] = []

  const users = [
    { id: 'local', name: 'You', color: '#818cf8' },
    { id: 'alice', name: 'Alice', color: '#6366f1' },
    { id: 'bob', name: 'Bob', color: '#f59e0b' },
    { id: 'dave', name: 'Dave', color: '#ec4899' },
  ]

  const events: { dt: number; uid: number; type: OpType; file: string; line: number; col: number; content: string; endLine?: number; endCol?: number }[] = [
    { dt: 0, uid: 0, type: 'file-switch', file: 'ChatInterface.tsx', line: 1, col: 1, content: 'Opened ChatInterface.tsx' },
    { dt: 5000, uid: 0, type: 'cursor-move', file: 'ChatInterface.tsx', line: 56, col: 1, content: 'Navigated to ChatInterface component' },
    { dt: 8000, uid: 1, type: 'file-switch', file: 'ChatInterface.tsx', line: 1, col: 1, content: 'Alice opened ChatInterface.tsx' },
    { dt: 12000, uid: 1, type: 'cursor-move', file: 'ChatInterface.tsx', line: 33, col: 7, content: 'Alice moved to scrollRef declaration' },
    { dt: 18000, uid: 0, type: 'insert', file: 'ChatInterface.tsx', line: 57, col: 3, content: 'const [isStreaming, setIsStreaming] = useState(false)' },
    { dt: 25000, uid: 1, type: 'selection', file: 'ChatInterface.tsx', line: 88, col: 3, content: 'Selected processSlashCommand function', endLine: 100, endCol: 4 },
    { dt: 30000, uid: 2, type: 'file-switch', file: 'store.ts', line: 1, col: 1, content: 'Bob opened store.ts' },
    { dt: 35000, uid: 2, type: 'cursor-move', file: 'store.ts', line: 35, col: 23, content: 'Bob navigated to initialDesignRoot' },
    { dt: 42000, uid: 1, type: 'delete', file: 'ChatInterface.tsx', line: 88, col: 3, content: 'Deleted old switch statement (lines 88-100)' },
    { dt: 48000, uid: 1, type: 'insert', file: 'ChatInterface.tsx', line: 88, col: 3, content: 'const COMMANDS: Record<string, () => void> = {\n  \'/code\': () => addMessage({ role: \'system\', content: \'Generating code...\' }),\n  \'/arch\': () => addMessage({ role: \'system\', content: \'Loading architecture...\' }),\n}' },
    { dt: 55000, uid: 2, type: 'replace', file: 'store.ts', line: 35, col: 23, content: 'designRoot: createDefaultDesignRoot()' },
    { dt: 60000, uid: 3, type: 'file-switch', file: 'App.tsx', line: 1, col: 1, content: 'Dave opened App.tsx' },
    { dt: 68000, uid: 0, type: 'insert', file: 'ChatInterface.tsx', line: 60, col: 3, content: 'const messagesEndRef = useRef<HTMLDivElement>(null)' },
    { dt: 75000, uid: 3, type: 'cursor-move', file: 'App.tsx', line: 7, col: 10, content: 'Dave navigated to RouterProvider' },
    { dt: 82000, uid: 0, type: 'cursor-move', file: 'ChatInterface.tsx', line: 112, col: 1, content: 'Moved to return statement' },
    { dt: 90000, uid: 1, type: 'insert', file: 'ChatInterface.tsx', line: 91, col: 3, content: 'const processCommand = (cmd: string) => {\n  const handler = COMMANDS[cmd.split(\' \')[0]]\n  handler ? handler() : addMessage({ role: \'system\', content: `Unknown: ${cmd}` })\n  setInput(\'\')\n}' },
    { dt: 100000, uid: 2, type: 'insert', file: 'store.ts', line: 5, col: 1, content: 'import { createDefaultDesignRoot } from \'./defaults\'' },
    { dt: 110000, uid: 0, type: 'selection', file: 'ChatInterface.tsx', line: 102, col: 3, content: 'Selected simulateAIResponse function', endLine: 109, endCol: 4 },
    { dt: 120000, uid: 0, type: 'replace', file: 'ChatInterface.tsx', line: 102, col: 3, content: 'const simulateAIResponse = async (userInput: string) => {\n  try {\n    await new Promise(r => setTimeout(r, 500))\n    addMessage({ role: \'ai\', content: `Response to: ${userInput}` })\n  } catch (err) {\n    console.error(err)\n  }\n}' },
  ]

  events.forEach((ev, idx) => {
    const u = users[ev.uid]
    ops.push({
      id: `op-${idx}`,
      timestamp: baseTime + ev.dt,
      userId: u.id,
      userName: u.name,
      userColor: u.color,
      type: ev.type,
      file: ev.file,
      line: ev.line,
      col: ev.col,
      content: ev.content,
      endLine: (ev as any).endLine,
      endCol: (ev as any).endCol,
    })
  })

  return ops
}

/* ── Op type icon + color ── */
const OP_CONFIG: Record<OpType, { icon: typeof Type; label: string; color: string }> = {
  'insert': { icon: Type, label: 'rtInsert', color: 'text-emerald-400' },
  'delete': { icon: Trash2, label: 'rtDelete', color: 'text-red-400' },
  'replace': { icon: ArrowRightLeft, label: 'rtReplace', color: 'text-amber-400' },
  'cursor-move': { icon: MousePointer2, label: 'rtCursorMove', color: 'text-blue-400' },
  'file-switch': { icon: FileCode, label: 'rtFileSwitch', color: 'text-violet-400' },
  'selection': { icon: Eye, label: 'rtSelection', color: 'text-cyan-400' },
}

const SPEED_OPTIONS = [0.5, 1, 2, 4, 8]

/* ══════════════════════════════════════════ */
/*  CollabReplayTimeline Component            */
/* ══════════════════════════════════════════ */

interface CollabReplayTimelineProps {
  open: boolean
  onClose: () => void
}

export function CollabReplayTimeline({ open, onClose }: CollabReplayTimelineProps) {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const [operations] = useState<ReplayOperation[]>(() => generateMockOps())
  const [playing, setPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [speed, setSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [filterUser, setFilterUser] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const totalDuration = useMemo(() => {
    if (operations.length < 2) return 0
    return operations[operations.length - 1].timestamp - operations[0].timestamp
  }, [operations])

  const uniqueUsers = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>()
    operations.forEach(op => map.set(op.userId, { name: op.userName, color: op.userColor }))
    return Array.from(map.entries())
  }, [operations])

  const filteredOps = useMemo(() =>
    filterUser ? operations.filter(op => op.userId === filterUser) : operations,
  [operations, filterUser])

  const progress = useMemo(() => {
    if (currentIndex < 0 || operations.length === 0) return 0
    if (currentIndex >= operations.length - 1) return 100
    const elapsed = operations[currentIndex].timestamp - operations[0].timestamp
    return totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0
  }, [currentIndex, operations, totalDuration])

  // Playback engine
  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }

    const next = currentIndex + 1
    if (next >= operations.length) {
      setPlaying(false)
      return
    }

    const delay = next === 0
      ? 200
      : (operations[next].timestamp - operations[Math.max(0, currentIndex)].timestamp) / speed

    timerRef.current = window.setTimeout(() => {
      setCurrentIndex(next)
    }, Math.max(50, Math.min(delay, 3000)))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [playing, currentIndex, operations, speed])

  // Auto-scroll to current op
  useEffect(() => {
    if (currentIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${currentIndex}"]`)
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [currentIndex])

  const togglePlay = useCallback(() => {
    if (!playing && currentIndex >= operations.length - 1) {
      setCurrentIndex(-1) // Reset if at end
    }
    setPlaying(!playing)
  }, [playing, currentIndex, operations.length])

  const jumpTo = useCallback((idx: number) => {
    setCurrentIndex(idx)
    setPlaying(false)
  }, [])

  const formatRelative = (ts: number) => {
    if (operations.length === 0) return '0s'
    const elapsed = ts - operations[0].timestamp
    const secs = Math.floor(elapsed / 1000)
    const mins = Math.floor(secs / 60)
    return mins > 0 ? `${mins}m ${secs % 60}s` : `${secs}s`
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`w-full max-w-4xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-3 border-b ${t.border.subtle}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.isDark ? 'bg-gradient-to-br from-cyan-500/20 to-violet-500/20' : 'bg-gradient-to-br from-cyan-50 to-violet-50'}`}>
                <Radio className={`w-4 h-4 ${playing ? 'text-red-400 animate-pulse' : (t.isDark ? 'text-cyan-400' : 'text-cyan-500')}`} />
              </div>
              <div>
                <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 700 }}>{i.rtTitle}</h2>
                <p className={`text-[10px] ${t.text.dimmed}`}>{i.rtSubtitle} · {operations.length} {i.rtOperation}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Live indicator */}
              {!playing && currentIndex < 0 && (
                <span className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full ${t.isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {i.rtLive}
                </span>
              )}
              {(playing || currentIndex >= 0) && (
                <span className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full ${t.isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                  <Play className="w-2.5 h-2.5" /> {i.rtReplay}
                </span>
              )}
              <button onClick={onClose} className={`p-2 rounded-xl ${t.transition} ${t.interactive.iconBtn}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress bar + controls */}
          <div className={`px-6 py-3 border-b ${t.border.subtle}`}>
            {/* Progress bar */}
            <div className={`relative h-2 rounded-full overflow-hidden mb-3 cursor-pointer ${t.isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const pct = (e.clientX - rect.left) / rect.width
                const idx = Math.floor(pct * operations.length)
                jumpTo(Math.max(0, Math.min(idx, operations.length - 1)))
              }}
            >
              <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
              {/* Operation markers */}
              {operations.map((op, idx) => {
                const pct = totalDuration > 0 ? ((op.timestamp - operations[0].timestamp) / totalDuration) * 100 : 0
                return (
                  <div
                    key={op.id}
                    className={`absolute top-0 w-1 h-full opacity-60 ${idx <= currentIndex ? 'opacity-100' : 'opacity-30'}`}
                    style={{ left: `${pct}%`, backgroundColor: op.userColor }}
                    title={`${op.userName}: ${(i as unknown as Record<string, string>)[OP_CONFIG[op.type].label]}`}
                  />
                )
              })}
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => jumpTo(0)} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} title={i.rtJumpToStart}>
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => jumpTo(Math.max(0, currentIndex - 5))} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} title={i.rtRewind}>
                  <Rewind className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={togglePlay}
                  className={`p-2 rounded-xl ${t.transition} ${t.accent.solidBtn}`}
                >
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => jumpTo(Math.min(operations.length - 1, currentIndex + 5))} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} title={i.rtForward}>
                  <FastForward className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => jumpTo(operations.length - 1)} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} title={i.rtJumpToEnd}>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>

                {/* Speed */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] ${t.transition} ${t.interactive.iconBtn}`}
                  >
                    {i.rtSpeed}: {speed}x <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                  {showSpeedMenu && (
                    <div className={`absolute bottom-full left-0 mb-1 rounded-lg overflow-hidden ${t.surface.popover} ${t.border.popover} shadow-xl z-10`}>
                      {SPEED_OPTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => { setSpeed(s); setShowSpeedMenu(false) }}
                          className={`block w-full px-3 py-1 text-[9px] text-left ${t.transition} ${speed === s ? t.accent.primaryBg + ' ' + t.accent.primary : t.interactive.menuItem}`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Current position */}
                <span className={`text-[9px] font-mono ${t.text.muted}`}>
                  {currentIndex >= 0 ? formatRelative(operations[currentIndex].timestamp) : '0s'}
                  {' / '}
                  {formatRelative(operations[operations.length - 1]?.timestamp || 0)}
                </span>
                {/* User filter */}
                <div className="flex items-center gap-1">
                  {uniqueUsers.map(([uid, u]) => (
                    <button
                      key={uid}
                      onClick={() => setFilterUser(filterUser === uid ? null : uid)}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] text-white transition-all ${
                        filterUser && filterUser !== uid ? 'opacity-30 scale-90' : 'opacity-100'
                      }`}
                      style={{ backgroundColor: u.color, fontWeight: 700 }}
                      title={u.name}
                    >
                      {u.name[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Operation list */}
          <div ref={listRef} className={`flex-1 overflow-y-auto ${t.scrollbar}`}>
            {filteredOps.length === 0 && (
              <div className={`flex flex-col items-center justify-center gap-2 py-12 ${t.text.dimmed}`}>
                <Clock className="w-6 h-6 opacity-20" />
                <span className="text-[11px]">{i.rtNoOps}</span>
              </div>
            )}

            {filteredOps.map((op, idx) => {
              const originalIdx = operations.indexOf(op)
              const isActive = originalIdx === currentIndex
              const isPast = originalIdx <= currentIndex
              const config = OP_CONFIG[op.type]
              const Icon = config.icon

              return (
                <button
                  key={op.id}
                  data-idx={originalIdx}
                  onClick={() => jumpTo(originalIdx)}
                  className={`w-full flex items-start gap-3 px-6 py-2.5 text-left border-b ${t.border.subtle} ${t.transition} ${
                    isActive
                      ? (t.isDark ? 'bg-indigo-500/10' : 'bg-indigo-50/80')
                      : isPast
                        ? (t.isDark ? 'bg-white/[0.01]' : 'bg-white')
                        : (t.isDark ? 'opacity-40' : 'opacity-50')
                  } ${t.interactive.menuItem}`}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-0.5">
                    <div
                      className={`w-3 h-3 rounded-full border-2 ${isActive ? 'scale-125' : ''} transition-transform`}
                      style={{ borderColor: op.userColor, backgroundColor: isPast ? op.userColor : 'transparent' }}
                    />
                    {idx < filteredOps.length - 1 && (
                      <div className={`w-px flex-1 min-h-[16px] ${t.isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3 h-3 flex-shrink-0 ${config.color}`} />
                      <span className={`text-[9px] ${t.text.primary}`} style={{ fontWeight: 600 }}>
                        {(i as unknown as Record<string, string>)[config.label] || op.type}
                      </span>
                      <span className={`text-[8px] px-1 py-0 rounded`} style={{ color: op.userColor, fontWeight: 500 }}>
                        {op.userName}
                      </span>
                      <span className={`text-[7px] ${t.text.dimmed}`}>{op.file}:{op.line}</span>
                    </div>
                    <p className={`text-[8px] mt-0.5 truncate ${t.text.muted}`}>{op.content}</p>
                  </div>

                  {/* Time */}
                  <span className={`text-[7px] font-mono flex-shrink-0 ${t.text.dimmed}`}>
                    {formatRelative(op.timestamp)}
                  </span>
                </button>
              )
            })}
          </div>
        </motion.div>
      </div>
    </>
  )
}
