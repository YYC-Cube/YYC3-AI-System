/**
 * @file FlameGraph.tsx
 * @description YYC³便携式智能AI系统 - 实时性能火焰图
 * Real-time Performance Flame Graph
 * SVG-based flame graph with CPU/Memory/Render profiling modes,
 * zoom, search, frame focus, and call stack detail panel.
 * Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,performance,profiling,visualization
 */

import {
  Flame, X, Cpu, HardDrive, MonitorDot, ZoomIn, ZoomOut,
  RotateCcw, Search, ChevronRight, Layers, Play
} from 'lucide-react'
import { motion } from 'motion/react'
import { useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

/* ── Types ── */
type ProfileMode = 'cpu' | 'memory' | 'render'

interface FlameFrame {
  id: string
  name: string
  module: string
  selfTime: number  // ms
  totalTime: number // ms
  samples: number
  depth: number
  children: FlameFrame[]
}

/* ── Mock flame data ── */
function createFlameData(): FlameFrame {
  return {
    id: 'root', name: '(root)', module: 'runtime', selfTime: 2, totalTime: 842, samples: 4210, depth: 0,
    children: [
      {
        id: 'react-render', name: 'React.render()', module: 'react-dom', selfTime: 8, totalTime: 680, samples: 3400, depth: 1,
        children: [
          {
            id: 'ide-layout', name: 'IDELayout()', module: 'components', selfTime: 12, totalTime: 520, samples: 2600, depth: 2,
            children: [
              {
                id: 'chat', name: 'ChatInterface()', module: 'components', selfTime: 45, totalTime: 180, samples: 900, depth: 3,
                children: [
                  { id: 'msg-list', name: 'MessageList()', module: 'components', selfTime: 35, totalTime: 95, samples: 475, depth: 4, children: [
                    { id: 'md-render', name: 'markdownParse()', module: 'markdown', selfTime: 60, totalTime: 60, samples: 300, depth: 5, children: [] },
                  ]},
                  { id: 'input', name: 'ChatInput()', module: 'components', selfTime: 25, totalTime: 40, samples: 200, depth: 4, children: [
                    { id: 'debounce', name: 'useDebounce()', module: 'hooks', selfTime: 15, totalTime: 15, samples: 75, depth: 5, children: [] },
                  ]},
                ]
              },
              {
                id: 'code-editor', name: 'CodeEditor()', module: 'components', selfTime: 18, totalTime: 220, samples: 1100, depth: 3,
                children: [
                  { id: 'monaco', name: 'MonacoEditor()', module: 'monaco-editor', selfTime: 120, totalTime: 150, samples: 750, depth: 4, children: [
                    { id: 'syntax', name: 'tokenize()', module: 'monaco-editor', selfTime: 30, totalTime: 30, samples: 150, depth: 5, children: [] },
                  ]},
                  { id: 'ai-complete', name: 'AICompletion()', module: 'ai-completion', selfTime: 35, totalTime: 52, samples: 260, depth: 4, children: [
                    { id: 'context', name: 'getContext()', module: 'ai-completion', selfTime: 17, totalTime: 17, samples: 85, depth: 5, children: [] },
                  ]},
                ]
              },
              {
                id: 'file-mgr', name: 'FileManager()', module: 'components', selfTime: 22, totalTime: 80, samples: 400, depth: 3,
                children: [
                  { id: 'tree', name: 'FileTree()', module: 'components', selfTime: 38, totalTime: 58, samples: 290, depth: 4, children: [
                    { id: 'icons', name: 'resolveIcon()', module: 'utils', selfTime: 20, totalTime: 20, samples: 100, depth: 5, children: [] },
                  ]},
                ]
              },
            ]
          },
          {
            id: 'header', name: 'Header()', module: 'components', selfTime: 15, totalTime: 45, samples: 225, depth: 2,
            children: [
              { id: 'collab-bar', name: 'CollabStatusBar()', module: 'components', selfTime: 18, totalTime: 30, samples: 150, depth: 3, children: [
                { id: 'ws-poll', name: 'wsHeartbeat()', module: 'ws-collab', selfTime: 12, totalTime: 12, samples: 60, depth: 4, children: [] },
              ]},
            ]
          },
          {
            id: 'zustand', name: 'useAppStore()', module: 'zustand', selfTime: 35, totalTime: 65, samples: 325, depth: 2,
            children: [
              { id: 'persist', name: 'persistMiddleware()', module: 'zustand', selfTime: 30, totalTime: 30, samples: 150, depth: 3, children: [] },
            ]
          },
        ]
      },
      {
        id: 'gc', name: 'GarbageCollect()', module: 'v8', selfTime: 45, totalTime: 45, samples: 225, depth: 1, children: []
      },
      {
        id: 'idle', name: '(idle)', module: 'runtime', selfTime: 115, totalTime: 115, samples: 575, depth: 1, children: []
      },
    ]
  }
}

/* ── Flatten tree for rendering ── */
interface FlatFrame {
  id: string
  name: string
  module: string
  selfTime: number
  totalTime: number
  samples: number
  depth: number
  x: number      // 0..1 normalized
  width: number   // 0..1 normalized
  children: FlameFrame[]
}

function flattenTree(node: FlameFrame, x: number, parentWidth: number, rootTotal: number): FlatFrame[] {
  const width = (node.totalTime / rootTotal) * parentWidth
  const flat: FlatFrame = {
    id: node.id, name: node.name, module: node.module,
    selfTime: node.selfTime, totalTime: node.totalTime,
    samples: node.samples, depth: node.depth,
    x, width, children: node.children,
  }
  const result: FlatFrame[] = [flat]
  let childX = x
  for (const child of node.children) {
    result.push(...flattenTree(child, childX, width, rootTotal))
    childX += (child.totalTime / rootTotal) * parentWidth
  }
  return result
}

/* ── Heat color ── */
function heatColor(selfTime: number, maxSelfTime: number, isDark: boolean): string {
  const ratio = Math.min(selfTime / maxSelfTime, 1)
  if (ratio > 0.7) return isDark ? '#ef4444' : '#dc2626'
  if (ratio > 0.4) return isDark ? '#f59e0b' : '#d97706'
  if (ratio > 0.2) return isDark ? '#eab308' : '#ca8a04'
  return isDark ? '#22c55e' : '#16a34a'
}

/* ══════════════════════════════════════════ */

interface FlameGraphProps { open: boolean; onClose: () => void }

export function FlameGraph({ open, onClose }: FlameGraphProps) {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const [mode, setMode] = useState<ProfileMode>('cpu')
  const [rootData] = useState(() => createFlameData())
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [focusedFrame, setFocusedFrame] = useState<FlatFrame | null>(null)
  const [capturing, setCapturing] = useState(false)

  const maxSelfTime = useMemo(() => {
    const flat = flattenTree(rootData, 0, 1, rootData.totalTime)
    return Math.max(...flat.map(f => f.selfTime))
  }, [rootData])

  const frames = useMemo(() =>
    flattenTree(rootData, 0, 1, rootData.totalTime),
  [rootData])

  const filteredFrames = useMemo(() =>
    searchTerm ? frames.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())) : frames,
  [frames, searchTerm])

  const maxDepth = useMemo(() => Math.max(...frames.map(f => f.depth)), [frames])

  const FRAME_H = 22
  const SVG_W = 900
  const SVG_H = (maxDepth + 2) * FRAME_H + 20

  const handleCapture = useCallback(() => {
    setCapturing(true)
    setTimeout(() => {
      setCapturing(false)
      toast.success(i.fgCapture)
    }, 2000)
  }, [i])

  const handleReset = useCallback(() => {
    setZoom(1); setPanX(0); setSearchTerm(''); setFocusedFrame(null)
  }, [])

  const MODES: { mode: ProfileMode; icon: typeof Cpu; labelKey: string }[] = [
    { mode: 'cpu', icon: Cpu, labelKey: 'fgCpuProfile' },
    { mode: 'memory', icon: HardDrive, labelKey: 'fgMemProfile' },
    { mode: 'render', icon: MonitorDot, labelKey: 'fgRenderProfile' },
  ]

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-6xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-3 border-b ${t.border.subtle}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.isDark ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20' : 'bg-gradient-to-br from-red-50 to-orange-50'}`}>
                <Flame className={`w-4 h-4 ${t.isDark ? 'text-orange-400' : 'text-orange-500'}`} />
              </div>
              <div>
                <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 700 }}>{i.fgTitle}</h2>
                <p className={`text-[10px] ${t.text.dimmed}`}>{i.fgSubtitle} · {frames.length} frames · {rootData.totalTime}ms</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mode selector */}
              {MODES.map(m => {
                const MIcon = m.icon
                return (
                  <button
                    key={m.mode}
                    onClick={() => setMode(m.mode)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] ${t.transition} ${mode === m.mode ? t.accent.primaryBg + ' ' + t.accent.primary : t.interactive.iconBtn}`}
                  >
                    <MIcon className="w-3 h-3" />
                    {(i as unknown as Record<string, string>)[m.labelKey]}
                  </button>
                )
              })}
              <div className={`w-px h-4 mx-1 ${t.border.dividerV}`} />
              <button onClick={handleCapture} disabled={capturing}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] ${t.transition} ${capturing ? 'opacity-50' : t.accent.solidBtn + ' text-white'}`}
                style={{ fontWeight: 600 }}>
                <Play className="w-3 h-3" /> {capturing ? i.fgCapturing : i.fgCapture}
              </button>
              <button onClick={onClose} className={`p-2 rounded-xl ${t.transition} ${t.interactive.iconBtn}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className={`flex items-center gap-2 px-6 py-2 border-b ${t.border.subtle}`}>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${t.border.subtle} flex-1 max-w-xs`}>
              <Search className={`w-3 h-3 ${t.text.muted}`} />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={i.fgSearch}
                className={`flex-1 text-[10px] bg-transparent outline-none ${t.text.primary} ${t.text.placeholder}`}
              />
              {searchTerm && (
                <span className={`text-[8px] ${t.text.dimmed}`}>{filteredFrames.length} / {frames.length}</span>
              )}
            </div>
            <button onClick={() => setZoom(z => Math.min(z * 1.5, 5))} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`} title={i.fgZoomIn}>
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setZoom(z => Math.max(z / 1.5, 0.5))} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`} title={i.fgZoomOut}>
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleReset} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`} title={i.fgReset}>
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className={`text-[8px] ${t.text.dimmed}`}>Zoom: {(zoom * 100).toFixed(0)}%</span>
            {/* Legend */}
            <div className="flex items-center gap-3 ml-auto">
              <span className="flex items-center gap-1 text-[8px] text-emerald-400"><span className="w-2 h-2 rounded-sm bg-emerald-500" />{i.fgCold}</span>
              <span className="flex items-center gap-1 text-[8px] text-amber-400"><span className="w-2 h-2 rounded-sm bg-amber-500" />{i.fgHot}</span>
              <span className="flex items-center gap-1 text-[8px] text-red-400"><span className="w-2 h-2 rounded-sm bg-red-500" />{i.fgHot}!</span>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Flame graph SVG */}
            <div className={`flex-1 overflow-auto ${t.scrollbar}`}>
              <svg
                width={SVG_W * zoom}
                height={SVG_H}
                viewBox={`${panX} 0 ${SVG_W / zoom} ${SVG_H}`}
                className={t.isDark ? 'bg-[#080e1c]' : 'bg-slate-50'}
              >
                {frames.map(frame => {
                  const fx = frame.x * SVG_W
                  const fw = frame.width * SVG_W
                  const fy = SVG_H - (frame.depth + 1) * FRAME_H - 10
                  if (fw < 1) return null

                  const isHighlighted = searchTerm && frame.name.toLowerCase().includes(searchTerm.toLowerCase())
                  const isFocused = focusedFrame?.id === frame.id
                  const color = heatColor(frame.selfTime, maxSelfTime, t.isDark)

                  return (
                    <g key={frame.id} onClick={() => setFocusedFrame(isFocused ? null : frame)} className="cursor-pointer">
                      <rect
                        x={fx} y={fy} width={fw - 0.5} height={FRAME_H - 2}
                        rx={2}
                        fill={color}
                        opacity={searchTerm ? (isHighlighted ? 1 : 0.2) : 0.85}
                        stroke={isFocused ? '#fff' : 'transparent'}
                        strokeWidth={isFocused ? 1.5 : 0}
                      />
                      {fw > 30 && (
                        <text
                          x={fx + 4} y={fy + FRAME_H / 2 + 1}
                          fontSize={9} fill="#fff" dominantBaseline="middle"
                          style={{ pointerEvents: 'none', fontFamily: 'monospace' }}
                        >
                          {frame.name.length > fw / 6 ? frame.name.slice(0, Math.floor(fw / 6)) + '...' : frame.name}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Detail panel */}
            {focusedFrame && (
              <div className={`w-64 flex-shrink-0 border-l ${t.border.subtle} overflow-y-auto p-4 space-y-3 ${t.scrollbar}`}>
                <div className="flex items-center gap-2">
                  <Layers className={`w-4 h-4 ${t.accent.primary}`} />
                  <span className={`text-[11px] ${t.text.primary}`} style={{ fontWeight: 700 }}>{i.fgFocusFrame}</span>
                </div>
                <div>
                  <label className={`text-[7px] uppercase tracking-wider ${t.text.dimmed}`} style={{ fontWeight: 600 }}>Function</label>
                  <p className={`text-[10px] font-mono mt-0.5 ${t.isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{focusedFrame.name}</p>
                </div>
                <div>
                  <label className={`text-[7px] uppercase tracking-wider ${t.text.dimmed}`} style={{ fontWeight: 600 }}>{i.fgModule}</label>
                  <p className={`text-[9px] mt-0.5 ${t.text.muted}`}>{focusedFrame.module}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded-lg ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                    <label className={`text-[7px] uppercase ${t.text.dimmed}`}>{i.fgSelfTime}</label>
                    <p className={`text-[12px] mt-0.5 ${t.text.primary}`} style={{ fontWeight: 700 }}>{focusedFrame.selfTime}ms</p>
                  </div>
                  <div className={`p-2 rounded-lg ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                    <label className={`text-[7px] uppercase ${t.text.dimmed}`}>{i.fgTotalTime}</label>
                    <p className={`text-[12px] mt-0.5 ${t.text.primary}`} style={{ fontWeight: 700 }}>{focusedFrame.totalTime}ms</p>
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                  <label className={`text-[7px] uppercase ${t.text.dimmed}`}>{i.fgSamples}</label>
                  <p className={`text-[11px] mt-0.5 ${t.text.primary}`} style={{ fontWeight: 600 }}>{focusedFrame.samples.toLocaleString()}</p>
                </div>
                <div className={`p-2 rounded-lg ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                  <label className={`text-[7px] uppercase ${t.text.dimmed}`}>{i.fgDepth}</label>
                  <p className={`text-[11px] mt-0.5 ${t.text.primary}`}>{focusedFrame.depth}</p>
                </div>
                {/* Percentage */}
                <div className={`p-2 rounded-lg ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                  <label className={`text-[7px] uppercase ${t.text.dimmed}`}>% of Total</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${t.isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-red-500" style={{ width: `${(focusedFrame.totalTime / rootData.totalTime * 100)}%` }} />
                    </div>
                    <span className={`text-[10px] ${t.text.primary}`} style={{ fontWeight: 600 }}>{(focusedFrame.totalTime / rootData.totalTime * 100).toFixed(1)}%</span>
                  </div>
                </div>
                {/* Call stack */}
                {focusedFrame.children.length > 0 && (
                  <div>
                    <label className={`text-[7px] uppercase tracking-wider ${t.text.dimmed}`} style={{ fontWeight: 600 }}>{i.fgCallStack} ({focusedFrame.children.length})</label>
                    <div className="mt-1 space-y-0.5">
                      {focusedFrame.children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => {
                            const f = frames.find(ff => ff.id === child.id)
                            if (f) setFocusedFrame(f)
                          }}
                          className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left text-[8px] ${t.transition} ${t.interactive.menuItem}`}
                        >
                          <ChevronRight className="w-2 h-2" />
                          <span className={`font-mono truncate ${t.text.primary}`}>{child.name}</span>
                          <span className={`ml-auto text-[7px] ${t.text.dimmed}`}>{child.totalTime}ms</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  )
}
