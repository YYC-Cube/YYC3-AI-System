/**
 * @file DependencyGraph.tsx
 * @description YYC³便携式智能AI系统 - 项目依赖关系图
 * Project Dependency Graph
 * Parses import statements to build file dependency DAG,
 * force-directed / tree visualization (SVG), cycle detection, heatmap
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,dependency-graph,visualization,analysis
 */

import {
  X, GitFork, RefreshCw, TreePine, Network, Flame,
  AlertTriangle, ExternalLink, FileCode, ArrowRight
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

type ViewMode = 'force' | 'tree' | 'heatmap'

interface FileNode {
  id: string
  name: string
  size: number
  imports: string[]
  exports: string[]
  x?: number
  y?: number
  vx?: number
  vy?: number
}

interface Edge {
  source: string
  target: string
  isCyclic: boolean
}

// Mock project files with import relationships
const MOCK_FILES: FileNode[] = [
  { id: 'App.tsx', name: 'App.tsx', size: 2400, imports: ['store', 'routes', 'theme'], exports: ['default'] },
  { id: 'store.ts', name: 'store.ts', size: 8200, imports: ['types', 'theme', 'i18n'], exports: ['useAppStore'] },
  { id: 'routes.ts', name: 'routes.ts', size: 1200, imports: ['IDELayout', 'HomePage'], exports: ['router'] },
  { id: 'types.ts', name: 'types.ts', size: 3500, imports: [], exports: ['Message', 'DesignRoot', 'AIModel'] },
  { id: 'theme.ts', name: 'theme.ts', size: 6800, imports: [], exports: ['getThemeTokens', 'THEME_PRESETS'] },
  { id: 'i18n.ts', name: 'i18n.ts', size: 1100, imports: ['i18n-data'], exports: ['I18nStrings', 'resolveKey'] },
  { id: 'i18n-data.ts', name: 'i18n-data.ts', size: 42000, imports: ['i18n'], exports: ['zh', 'en', 'getI18n'] },
  { id: 'IDELayout.tsx', name: 'IDELayout.tsx', size: 12500, imports: ['store', 'theme', 'Header', 'ChatInterface', 'FileManager', 'CodeEditor', 'PreviewPanel'], exports: ['IDELayout'] },
  { id: 'HomePage.tsx', name: 'HomePage.tsx', size: 9800, imports: ['store', 'theme', 'i18n'], exports: ['HomePage'] },
  { id: 'Header.tsx', name: 'Header.tsx', size: 11000, imports: ['store', 'theme', 'i18n'], exports: ['Header'] },
  { id: 'ChatInterface.tsx', name: 'ChatInterface.tsx', size: 7200, imports: ['store', 'theme', 'i18n'], exports: ['ChatInterface'] },
  { id: 'FileManager.tsx', name: 'FileManager.tsx', size: 5400, imports: ['store', 'theme'], exports: ['FileManager'] },
  { id: 'CodeEditor.tsx', name: 'CodeEditor.tsx', size: 8500, imports: ['store', 'theme', 'collaboration'], exports: ['CodeEditor'] },
  { id: 'PreviewPanel.tsx', name: 'PreviewPanel.tsx', size: 15000, imports: ['store', 'theme', 'i18n'], exports: ['PreviewPanel'] },
  { id: 'collaboration.ts', name: 'collaboration.ts', size: 4200, imports: ['store'], exports: ['collabManager'] },
  { id: 'ModelSettings.tsx', name: 'ModelSettings.tsx', size: 9500, imports: ['store', 'theme', 'i18n'], exports: ['ModelSettings'] },
]

function detectCycles(files: FileNode[]): Set<string> {
  const adjMap: Record<string, string[]> = {}
  for (const f of files) {
    adjMap[f.id] = f.imports.filter(imp => files.some(ff => ff.id === imp || ff.id === imp + '.ts' || ff.id === imp + '.tsx'))
  }

  const cyclicEdges = new Set<string>()
  const visited = new Set<string>()
  const recStack = new Set<string>()

  function dfs(node: string, path: string[]) {
    visited.add(node)
    recStack.add(node)
    for (const neighbor of (adjMap[node] || [])) {
      const resolvedNeighbor = files.find(f => f.id === neighbor || f.id === neighbor + '.ts' || f.id === neighbor + '.tsx')?.id
      if (!resolvedNeighbor) continue
      if (recStack.has(resolvedNeighbor)) {
        cyclicEdges.add(`${node}->${resolvedNeighbor}`)
        cyclicEdges.add(`${resolvedNeighbor}->${node}`)
      } else if (!visited.has(resolvedNeighbor)) {
        dfs(resolvedNeighbor, [...path, resolvedNeighbor])
      }
    }
    recStack.delete(node)
  }

  for (const f of files) {
    if (!visited.has(f.id)) dfs(f.id, [f.id])
  }
  return cyclicEdges
}

function resolveTarget(imp: string, files: FileNode[]): string | null {
  return files.find(f => f.id === imp || f.id === imp + '.ts' || f.id === imp + '.tsx')?.id || null
}

export function DependencyGraph({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)
  const svgRef = useRef<SVGSVGElement>(null)

  const [viewMode, setViewMode] = useState<ViewMode>('force')
  const [highlightCycles, setHighlightCycles] = useState(true)
  const [showExternal, setShowExternal] = useState(false)
  const [filter, setFilter] = useState('')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const cycleEdges = useMemo(() => detectCycles(MOCK_FILES), [])

  const filteredFiles = useMemo(() => {
    if (!filter) return MOCK_FILES
    return MOCK_FILES.filter(f => f.name.toLowerCase().includes(filter.toLowerCase()))
  }, [filter])

  const edges = useMemo(() => {
    const result: Edge[] = []
    for (const file of filteredFiles) {
      for (const imp of file.imports) {
        const target = resolveTarget(imp, MOCK_FILES)
        if (target && filteredFiles.some(f => f.id === target)) {
          result.push({
            source: file.id,
            target,
            isCyclic: cycleEdges.has(`${file.id}->${target}`)
          })
        }
      }
    }
    return result
  }, [filteredFiles, cycleEdges])

  const cycleCount = useMemo(() => {
    return edges.filter(e => e.isCyclic).length
  }, [edges])

  // Simple force layout positions
  const nodePositions = useMemo(() => {
    const W = 700, H = 500
    const positions: Record<string, { x: number; y: number }> = {}

    if (viewMode === 'tree') {
      // Layer-based tree layout
      const layers: string[][] = []
      const placed = new Set<string>()
      // Root nodes (no incoming edges)
      const hasIncoming = new Set(edges.map(e => e.target))
      const roots = filteredFiles.filter(f => !hasIncoming.has(f.id))
      if (roots.length > 0) layers.push(roots.map(r => r.id))
      else layers.push([filteredFiles[0]?.id].filter(Boolean))
      layers[0].forEach(id => placed.add(id))

      for (let depth = 0; depth < 8; depth++) {
        const nextLayer: string[] = []
        for (const nodeId of (layers[depth] || [])) {
          const file = MOCK_FILES.find(f => f.id === nodeId)
          if (!file) continue
          for (const imp of file.imports) {
            const target = resolveTarget(imp, MOCK_FILES)
            if (target && !placed.has(target) && filteredFiles.some(f => f.id === target)) {
              nextLayer.push(target)
              placed.add(target)
            }
          }
        }
        if (nextLayer.length > 0) layers.push(nextLayer)
      }

      layers.forEach((layer, li) => {
        layer.forEach((nodeId, ni) => {
          positions[nodeId] = {
            x: 80 + (W - 160) / Math.max(layer.length - 1, 1) * ni + (layer.length === 1 ? (W - 160) / 2 : 0),
            y: 60 + li * 80
          }
        })
      })
    } else {
      // Force layout (simplified circular + jitter)
      const n = filteredFiles.length
      filteredFiles.forEach((f, idx) => {
        const angle = (2 * Math.PI * idx) / n
        const radius = Math.min(W, H) * 0.35
        positions[f.id] = {
          x: W / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 30,
          y: H / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 30,
        }
      })
    }
    return positions
  }, [filteredFiles, edges, viewMode])

  const handleAnalyze = () => {
    setAnalyzing(true)
    setTimeout(() => setAnalyzing(false), 1200)
  }

  // Heatmap color
  const getHeatColor = (size: number) => {
    const maxSize = Math.max(...MOCK_FILES.map(f => f.size))
    const ratio = size / maxSize
    if (ratio > 0.7) return '#ef4444'
    if (ratio > 0.4) return '#f59e0b'
    return '#22c55e'
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed inset-6 z-[61] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${t.border.subtle} flex-shrink-0`}>
          <div className="flex items-center space-x-2.5">
            <GitFork className={`w-5 h-5 ${t.accent.primary}`} />
            <div>
              <span className="text-[14px]" style={{ fontWeight: 600 }}>{i.dpTitle}</span>
              <span className={`ml-2 text-[11px] ${t.text.muted}`}>{i.dpSubtitle}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* View mode toggles */}
            {([
              { id: 'force' as ViewMode, icon: Network, label: i.dpForceView },
              { id: 'tree' as ViewMode, icon: TreePine, label: i.dpTreeView },
              { id: 'heatmap' as ViewMode, icon: Flame, label: i.dpHeatmap },
            ]).map(v => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] flex items-center space-x-1 ${t.transition} ${viewMode === v.id ? `${t.accent.activeBg} ${t.accent.activeText}` : t.interactive.iconBtn}`}
              >
                <v.icon className="w-3.5 h-3.5" />
                <span>{v.label}</span>
              </button>
            ))}
            <div className={`w-px h-4 ${t.border.dividerV}`} />
            <button onClick={handleAnalyze} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} title={i.dpRefresh}>
              <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar */}
          <div className={`w-56 border-r ${t.border.subtle} flex flex-col flex-shrink-0`}>
            {/* Filter */}
            <div className={`p-3 border-b ${t.border.subtle}`}>
              <input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder={i.dpFilter}
                className={`w-full px-3 py-1.5 rounded-lg text-[12px] border ${t.border.subtle} bg-transparent ${t.text.primary} outline-none focus:ring-1 focus:ring-indigo-500/50`}
              />
            </div>

            {/* Stats */}
            <div className={`p-3 border-b ${t.border.subtle} space-y-1.5`}>
              <div className="flex justify-between text-[11px]">
                <span className={t.text.muted}>{i.dpFiles}</span>
                <span className={t.text.secondary} style={{ fontWeight: 600 }}>{filteredFiles.length}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className={t.text.muted}>{i.dpDependencies}</span>
                <span className={t.text.secondary} style={{ fontWeight: 600 }}>{edges.length}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className={cycleCount > 0 ? 'text-red-400' : t.text.muted}>{i.dpCircular}</span>
                <span className={cycleCount > 0 ? 'text-red-400' : t.text.secondary} style={{ fontWeight: 600 }}>{cycleCount}</span>
              </div>
            </div>

            {/* Toggles */}
            <div className={`p-3 border-b ${t.border.subtle} space-y-2`}>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={highlightCycles} onChange={e => setHighlightCycles(e.target.checked)} className="accent-indigo-500" />
                <span className={`text-[11px] ${t.text.secondary}`}>{i.dpHighlightCycles}</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={showExternal} onChange={e => setShowExternal(e.target.checked)} className="accent-indigo-500" />
                <span className={`text-[11px] ${t.text.secondary}`}>{i.dpShowExternal}</span>
              </label>
            </div>

            {/* File list */}
            <div className={`flex-1 overflow-y-auto p-2 space-y-0.5 ${t.scrollbar}`}>
              {filteredFiles.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedNode(selectedNode === f.id ? null : f.id)}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-[11px] ${t.transition} ${
                    selectedNode === f.id ? `${t.accent.activeBg} ${t.accent.activeText}` : t.interactive.menuItem
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate flex-1 text-left">{f.name}</span>
                  {viewMode === 'heatmap' && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getHeatColor(f.size) }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Graph SVG */}
          <div className="flex-1 relative overflow-hidden" style={{ background: t.isDark ? '#0f172a' : '#f8fafc' }}>
            {cycleCount > 0 && highlightCycles && (
              <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[11px] text-red-400" style={{ fontWeight: 500 }}>{i.dpCyclicWarning} ({cycleCount})</span>
              </div>
            )}

            <svg ref={svgRef} className="w-full h-full">
              <defs>
                <marker id="arrowhead" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="6" markerHeight="5" orient="auto-start-reverse">
                  <polygon points="0 0, 10 3.5, 0 7" fill={t.isDark ? '#64748b' : '#94a3b8'} />
                </marker>
                <marker id="arrowhead-cycle" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="6" markerHeight="5" orient="auto-start-reverse">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
              </defs>

              {/* Edges */}
              {edges.map((e, idx) => {
                const s = nodePositions[e.source]
                const tgt = nodePositions[e.target]
                if (!s || !tgt) return null
                const isCyclic = e.isCyclic && highlightCycles
                return (
                  <line
                    key={idx}
                    x1={s.x} y1={s.y} x2={tgt.x} y2={tgt.y}
                    stroke={isCyclic ? '#ef4444' : t.isDark ? '#475569' : '#cbd5e1'}
                    strokeWidth={isCyclic ? 2 : 1}
                    strokeDasharray={isCyclic ? '5,3' : 'none'}
                    markerEnd={`url(#${isCyclic ? 'arrowhead-cycle' : 'arrowhead'})`}
                    opacity={selectedNode ? (e.source === selectedNode || e.target === selectedNode ? 1 : 0.15) : 0.6}
                  />
                )
              })}

              {/* Nodes */}
              {filteredFiles.map(f => {
                const pos = nodePositions[f.id]
                if (!pos) return null
                const isSelected = selectedNode === f.id
                const isConnected = selectedNode ? edges.some(e => (e.source === selectedNode && e.target === f.id) || (e.target === selectedNode && e.source === f.id)) : true
                const nodeColor = viewMode === 'heatmap' ? getHeatColor(f.size) : (isSelected ? '#6366f1' : t.isDark ? '#334155' : '#e2e8f0')
                const radius = viewMode === 'heatmap' ? Math.max(12, Math.min(28, f.size / 1000)) : 18

                return (
                  <g key={f.id} onClick={() => setSelectedNode(isSelected ? null : f.id)} className="cursor-pointer"
                    opacity={selectedNode && !isSelected && !isConnected ? 0.2 : 1}>
                    <circle
                      cx={pos.x} cy={pos.y} r={radius}
                      fill={nodeColor}
                      stroke={isSelected ? '#818cf8' : 'transparent'}
                      strokeWidth={isSelected ? 3 : 0}
                    />
                    <text
                      x={pos.x} y={pos.y + radius + 14}
                      textAnchor="middle"
                      fill={t.isDark ? '#94a3b8' : '#64748b'}
                      fontSize={10}
                      style={{ fontWeight: isSelected ? 600 : 400 }}
                    >
                      {f.name}
                    </text>
                    {viewMode === 'heatmap' && (
                      <text
                        x={pos.x} y={pos.y + 4}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={8}
                        style={{ fontWeight: 600 }}
                      >
                        {(f.size / 1000).toFixed(1)}k
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Right: Selected node details */}
          {selectedNode && (() => {
            const file = MOCK_FILES.find(f => f.id === selectedNode)
            if (!file) return null
            return (
              <div className={`w-52 border-l ${t.border.subtle} p-3 space-y-3 flex-shrink-0 overflow-y-auto ${t.scrollbar}`}>
                <div>
                  <div className="text-[13px]" style={{ fontWeight: 600 }}>{file.name}</div>
                  <div className={`text-[10px] ${t.text.dimmed}`}>{(file.size / 1000).toFixed(1)} KB</div>
                </div>
                <div>
                  <div className={`text-[10px] uppercase tracking-wider mb-1.5 ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.dpImports} ({file.imports.length})</div>
                  {file.imports.map(imp => (
                    <div key={imp} className={`flex items-center space-x-1.5 px-2 py-1 rounded text-[11px] ${t.text.secondary}`}>
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className={`text-[10px] uppercase tracking-wider mb-1.5 ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.dpExports} ({file.exports.length})</div>
                  {file.exports.map(exp => (
                    <div key={exp} className={`flex items-center space-x-1.5 px-2 py-1 rounded text-[11px] ${t.text.secondary}`}>
                      <ExternalLink className="w-3 h-3 text-emerald-400" />
                      <span>{exp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </>
  )
}
