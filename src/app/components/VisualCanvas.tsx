/**
 * @file VisualCanvas.tsx
 * @description YYC³便携式智能AI系统 - 拖放式可视化组件画布编辑器
 * Left sidebar: component palette with draggable items.
 * Center: free-form canvas with grid snap, zoom, and multi-select.
 * Right sidebar: property inspector for selected component.
 * Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,canvas,visual-editor,drag-drop
 */

import {
  MousePointer2, Square, Type, Image, Layout, CreditCard,
  List, Minus, Trash2, Copy,
  Lock, Unlock, Grid3x3, ZoomIn, ZoomOut, Maximize2,
  Undo2, Redo2, Code, Eraser, Plus, X, Layers,
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react'
import { motion } from 'motion/react'
import React, { useState, useCallback, useRef, useMemo } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

import { CanvasCodeSync, SyncCanvasElement } from './CanvasCodeSync'

/* ── Canvas element types ── */
type ElementType = 'button' | 'input' | 'text' | 'image' | 'container' | 'card' | 'list' | 'divider'

interface CanvasElement {
  id: string
  type: ElementType
  x: number
  y: number
  w: number
  h: number
  label: string
  locked: boolean
  zIndex: number
  props: {
    bgColor: string
    borderRadius: number
    padding: number
    fontSize: number
    textAlign: 'left' | 'center' | 'right'
  }
}

/* ── Component palette items ── */
const PALETTE_ITEMS: { type: ElementType; icon: typeof Square; labelKey: string; defaultW: number; defaultH: number; defaultBg: string }[] = [
  { type: 'button', icon: Square, labelKey: 'vcButton', defaultW: 120, defaultH: 40, defaultBg: '#6366f1' },
  { type: 'input', icon: Minus, labelKey: 'vcInput', defaultW: 200, defaultH: 36, defaultBg: '#1e293b' },
  { type: 'text', icon: Type, labelKey: 'vcText', defaultW: 160, defaultH: 24, defaultBg: 'transparent' },
  { type: 'image', icon: Image, labelKey: 'vcImage', defaultW: 160, defaultH: 120, defaultBg: '#374151' },
  { type: 'container', icon: Layout, labelKey: 'vcContainer', defaultW: 240, defaultH: 180, defaultBg: '#ffffff08' },
  { type: 'card', icon: CreditCard, labelKey: 'vcCard', defaultW: 200, defaultH: 140, defaultBg: '#ffffff0a' },
  { type: 'list', icon: List, labelKey: 'vcList', defaultW: 180, defaultH: 160, defaultBg: '#ffffff06' },
  { type: 'divider', icon: Minus, labelKey: 'vcDivider', defaultW: 200, defaultH: 2, defaultBg: '#ffffff20' },
]

let idCounter = 0
const genId = () => `el-${++idCounter}-${Date.now()}`

/* ══════════════════════════════════════════ */
/*  VisualCanvas Component                    */
/* ══════════════════════════════════════════ */

interface VisualCanvasProps {
  open: boolean
  onClose: () => void
}

export function VisualCanvas({ open, onClose }: VisualCanvasProps) {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [gridSnap, setGridSnap] = useState(true)
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const [history, setHistory] = useState<CanvasElement[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const canvasRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(() => elements.find(e => e.id === selectedId), [elements, selectedId])

  const snapToGrid = useCallback((v: number) => gridSnap ? Math.round(v / 16) * 16 : v, [gridSnap])

  const pushHistory = useCallback((newElements: CanvasElement[]) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newElements])
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setElements(history[historyIndex - 1])
    }
  }, [historyIndex, history])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setElements(history[historyIndex + 1])
    }
  }, [historyIndex, history])

  /* ── Add element from palette ── */
  const addElement = useCallback((type: ElementType) => {
    const palette = PALETTE_ITEMS.find(p => p.type === type)!
    const newEl: CanvasElement = {
      id: genId(), type,
      x: snapToGrid(80 + Math.random() * 200),
      y: snapToGrid(80 + Math.random() * 200),
      w: palette.defaultW, h: palette.defaultH,
      label: (i as unknown as Record<string, string>)[palette.labelKey] || type,
      locked: false, zIndex: elements.length,
      props: { bgColor: palette.defaultBg, borderRadius: 8, padding: 8, fontSize: 14, textAlign: 'center' },
    }
    const next = [...elements, newEl]
    setElements(next)
    setSelectedId(newEl.id)
    pushHistory(next)
  }, [elements, i, snapToGrid, pushHistory])

  /* ── Mouse handlers for canvas drag ── */
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent, elId: string) => {
    e.stopPropagation()
    const el = elements.find(ee => ee.id === elId)
    if (!el || el.locked) return
    setSelectedId(elId)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    setDragging({ id: elId, offsetX: e.clientX / zoom - el.x, offsetY: e.clientY / zoom - el.y })
  }, [elements, zoom])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const rawX = (e.clientX - rect.left) / zoom - dragging.offsetX + canvasRef.current!.scrollLeft / zoom
    const rawY = (e.clientY - rect.top) / zoom - dragging.offsetY + canvasRef.current!.scrollTop / zoom
    setElements(prev => prev.map(el =>
      el.id === dragging.id ? { ...el, x: snapToGrid(rawX), y: snapToGrid(rawY) } : el
    ))
  }, [dragging, zoom, snapToGrid])

  const handleCanvasMouseUp = useCallback(() => {
    if (dragging) {
      pushHistory(elements)
      setDragging(null)
    }
  }, [dragging, elements, pushHistory])

  /* ── Element operations ── */
  const deleteElement = useCallback((id: string) => {
    const next = elements.filter(e => e.id !== id)
    setElements(next)
    setSelectedId(null)
    pushHistory(next)
  }, [elements, pushHistory])

  const duplicateElement = useCallback((id: string) => {
    const el = elements.find(e => e.id === id)
    if (!el) return
    const dup = { ...el, id: genId(), x: el.x + 20, y: el.y + 20, zIndex: elements.length }
    const next = [...elements, dup]
    setElements(next)
    setSelectedId(dup.id)
    pushHistory(next)
  }, [elements, pushHistory])

  const updateProp = useCallback((key: string, value: unknown) => {
    if (!selectedId) return
    setElements(prev => prev.map(el =>
      el.id === selectedId ? { ...el, props: { ...el.props, [key]: value } } : el
    ))
  }, [selectedId])

  const updateElement = useCallback((key: string, value: unknown) => {
    if (!selectedId) return
    setElements(prev => prev.map(el =>
      el.id === selectedId ? { ...el, [key]: value } : el
    ))
  }, [selectedId])

  const handleExportCode = useCallback(() => {
    const code = elements.map(el => {
      const style = `style={{ position: 'absolute', left: ${el.x}, top: ${el.y}, width: ${el.w}, height: ${el.h}, backgroundColor: '${el.props.bgColor}', borderRadius: ${el.props.borderRadius}, padding: ${el.props.padding} }}`
      switch (el.type) {
        case 'button': return `<button ${style}>${el.label}</button>`
        case 'input': return `<input ${style} placeholder="${el.label}" />`
        case 'text': return `<span ${style}>${el.label}</span>`
        default: return `<div ${style}>{/* ${el.type}: ${el.label} */}</div>`
      }
    }).join('\n')
    navigator.clipboard.writeText(code)
    toast.success(i.vcExportCode)
  }, [elements, i])

  /* ── Render element on canvas ── */
  const renderElement = (el: CanvasElement) => {
    const isSelected = selectedId === el.id
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: el.x, top: el.y, width: el.w, height: el.h,
      zIndex: el.zIndex,
      backgroundColor: el.props.bgColor,
      borderRadius: el.props.borderRadius,
      padding: el.props.padding,
      fontSize: el.props.fontSize,
      textAlign: el.props.textAlign,
      cursor: el.locked ? 'not-allowed' : 'grab',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      userSelect: 'none',
      border: isSelected ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.08)',
      boxShadow: isSelected ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
      transition: 'box-shadow 0.15s',
    }

    return (
      <div
        key={el.id}
        style={baseStyle}
        onMouseDown={e => handleCanvasMouseDown(e, el.id)}
        onClick={e => { e.stopPropagation(); setSelectedId(el.id) }}
      >
        <span className={`text-[10px] truncate ${t.isDark ? 'text-white/60' : 'text-slate-500'}`} style={{ fontWeight: 500 }}>
          {el.label}
        </span>
        {el.locked && (
          <Lock className="w-2.5 h-2.5 absolute top-1 right-1 text-amber-400/50" />
        )}
        {/* Resize handle */}
        {isSelected && !el.locked && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white cursor-se-resize" />
        )}
      </div>
    )
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-6xl h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* ── Toolbar ── */}
          <div className={`flex items-center justify-between px-4 py-2 border-b ${t.border.subtle}`}>
            <div className="flex items-center gap-2">
              <Layers className={`w-4 h-4 ${t.isDark ? 'text-violet-400' : 'text-violet-500'}`} />
              <span className={`text-[12px] ${t.text.primary}`} style={{ fontWeight: 700 }}>{i.vcTitle}</span>
              <span className={`text-[9px] ${t.text.dimmed}`}>({elements.length} elements)</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleUndo} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`} title={i.vcUndo}>
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleRedo} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`} title={i.vcRedo}>
                <Redo2 className="w-3.5 h-3.5" />
              </button>
              <div className={`w-px h-4 mx-1 ${t.border.dividerV}`} />
              <button onClick={() => setGridSnap(!gridSnap)} className={`p-1 rounded ${t.transition} ${gridSnap ? t.accent.activeText : ''} ${t.interactive.iconBtn}`} title={i.vcGridSnap}>
                <Grid3x3 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`} title={i.vcZoomIn}>
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className={`text-[9px] w-8 text-center ${t.text.dimmed}`}>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`} title={i.vcZoomOut}>
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setZoom(1)} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`} title={i.vcZoomFit}>
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <div className={`w-px h-4 mx-1 ${t.border.dividerV}`} />
              <button onClick={handleExportCode} className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] ${t.transition} ${t.accent.solidBtn}`} style={{ fontWeight: 600 }}>
                <Code className="w-3 h-3" /> {i.vcExportCode}
              </button>
              <button onClick={() => { setElements([]); setSelectedId(null); pushHistory([]) }} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`} title={i.vcClearCanvas}>
                <Eraser className="w-3.5 h-3.5" />
              </button>
              <button onClick={onClose} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* ── Left: Component palette ── */}
            <div className={`w-40 flex-shrink-0 border-r ${t.border.subtle} p-2 space-y-1 overflow-y-auto`}>
              <div className={`text-[8px] uppercase tracking-wider px-2 py-1 ${t.text.dimmed}`} style={{ fontWeight: 600 }}>{i.vcComponents}</div>
              {PALETTE_ITEMS.map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.type}
                    onClick={() => addElement(item.type)}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[10px] ${t.transition} ${t.interactive.menuItem}`}
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${t.isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <span>{(i as unknown as Record<string, string>)[item.labelKey] || item.type}</span>
                    <Plus className={`w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-100 ${t.text.dimmed}`} />
                  </button>
                )
              })}
              <div className={`px-2 py-3 text-[8px] text-center ${t.text.dimmed}`}>
                {i.vcDragHint}
              </div>
            </div>

            {/* ── Center: Canvas + Code Sync ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div
                ref={canvasRef}
                className={`flex-1 overflow-auto relative ${t.isDark ? 'bg-[#080e1c]' : 'bg-slate-50'}`}
                style={{
                  backgroundImage: gridSnap
                    ? `radial-gradient(circle, ${t.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px)`
                    : 'none',
                  backgroundSize: `${16 * zoom}px ${16 * zoom}px`,
                }}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onClick={() => setSelectedId(null)}
              >
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: 1200, height: 900, position: 'relative' }}>
                  {elements.map(renderElement)}
                </div>
              </div>

              {/* Bidirectional Code Sync */}
              <div className="h-48 flex-shrink-0">
                <CanvasCodeSync
                  elements={elements as SyncCanvasElement[]}
                  onElementsUpdate={(parsed) => {
                    const mapped = parsed.map((el, idx) => ({
                      ...el,
                      locked: false,
                      zIndex: idx,
                      type: el.type as ElementType,
                      props: { ...el.props, textAlign: el.props.textAlign as 'left' | 'center' | 'right' },
                    }))
                    setElements(mapped)
                    pushHistory(mapped)
                  }}
                />
              </div>
            </div>

            {/* ── Right: Property panel ── */}
            <div className={`w-52 flex-shrink-0 border-l ${t.border.subtle} overflow-y-auto ${t.scrollbar}`}>
              {selected ? (
                <div className="p-3 space-y-3">
                  <div className={`text-[9px] uppercase tracking-wider ${t.text.dimmed}`} style={{ fontWeight: 600 }}>{i.vcProperties}</div>

                  {/* Name */}
                  <div>
                    <label className={`text-[8px] ${t.text.dimmed}`}>Label</label>
                    <input
                      value={selected.label}
                      onChange={e => updateElement('label', e.target.value)}
                      className={`w-full mt-0.5 px-2 py-1 rounded text-[10px] outline-none ${t.isDark ? 'bg-white/[0.04] text-white' : 'bg-slate-100 text-slate-800'} ${t.border.subtle} border`}
                    />
                  </div>

                  {/* Dimensions */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={`text-[8px] ${t.text.dimmed}`}>{i.vcWidth}</label>
                      <input type="number" value={selected.w} onChange={e => updateElement('w', Number(e.target.value))}
                        className={`w-full mt-0.5 px-2 py-1 rounded text-[10px] outline-none ${t.isDark ? 'bg-white/[0.04] text-white' : 'bg-slate-100 text-slate-800'} ${t.border.subtle} border`} />
                    </div>
                    <div>
                      <label className={`text-[8px] ${t.text.dimmed}`}>{i.vcHeight}</label>
                      <input type="number" value={selected.h} onChange={e => updateElement('h', Number(e.target.value))}
                        className={`w-full mt-0.5 px-2 py-1 rounded text-[10px] outline-none ${t.isDark ? 'bg-white/[0.04] text-white' : 'bg-slate-100 text-slate-800'} ${t.border.subtle} border`} />
                    </div>
                  </div>

                  {/* BgColor */}
                  <div>
                    <label className={`text-[8px] ${t.text.dimmed}`}>{i.vcBgColor}</label>
                    <div className="flex items-center gap-2 mt-0.5">
                      <input type="color" value={selected.props.bgColor === 'transparent' ? '#000000' : selected.props.bgColor}
                        onChange={e => updateProp('bgColor', e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                      <input value={selected.props.bgColor} onChange={e => updateProp('bgColor', e.target.value)}
                        className={`flex-1 px-2 py-1 rounded text-[9px] font-mono outline-none ${t.isDark ? 'bg-white/[0.04] text-white' : 'bg-slate-100 text-slate-800'} ${t.border.subtle} border`} />
                    </div>
                  </div>

                  {/* Border Radius */}
                  <div>
                    <label className={`text-[8px] ${t.text.dimmed}`}>{i.vcBorderRadius}: {selected.props.borderRadius}px</label>
                    <input type="range" min="0" max="32" value={selected.props.borderRadius}
                      onChange={e => updateProp('borderRadius', Number(e.target.value))}
                      className="w-full mt-0.5 accent-indigo-500" />
                  </div>

                  {/* Padding */}
                  <div>
                    <label className={`text-[8px] ${t.text.dimmed}`}>{i.vcPadding}: {selected.props.padding}px</label>
                    <input type="range" min="0" max="32" value={selected.props.padding}
                      onChange={e => updateProp('padding', Number(e.target.value))}
                      className="w-full mt-0.5 accent-indigo-500" />
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className={`text-[8px] ${t.text.dimmed}`}>{i.vcFontSize}: {selected.props.fontSize}px</label>
                    <input type="range" min="8" max="48" value={selected.props.fontSize}
                      onChange={e => updateProp('fontSize', Number(e.target.value))}
                      className="w-full mt-0.5 accent-indigo-500" />
                  </div>

                  {/* Text Align */}
                  <div>
                    <label className={`text-[8px] ${t.text.dimmed}`}>{i.vcAlign}</label>
                    <div className="flex gap-1 mt-0.5">
                      {(['left', 'center', 'right'] as const).map(a => {
                        const AlignIcon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight
                        return (
                          <button key={a} onClick={() => updateProp('textAlign', a)}
                            className={`flex-1 p-1.5 rounded ${t.transition} ${selected.props.textAlign === a ? t.accent.primaryBg + ' ' + t.accent.primary : t.interactive.iconBtn}`}>
                            <AlignIcon className="w-3 h-3 mx-auto" />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={`border-t pt-2 space-y-1 ${t.border.subtle}`}>
                    <button onClick={() => duplicateElement(selected.id)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[9px] ${t.transition} ${t.interactive.menuItem}`}>
                      <Copy className="w-3 h-3" /> {i.vcDuplicate}
                    </button>
                    <button onClick={() => updateElement('locked', !selected.locked)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[9px] ${t.transition} ${t.interactive.menuItem}`}>
                      {selected.locked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {selected.locked ? i.vcUnlock : i.vcLock}
                    </button>
                    <button onClick={() => deleteElement(selected.id)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[9px] text-red-400 ${t.transition} ${t.interactive.menuItem}`}>
                      <Trash2 className="w-3 h-3" /> {i.vcDelete}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center h-full gap-2 px-4 ${t.text.dimmed}`}>
                  <MousePointer2 className="w-6 h-6 opacity-20" />
                  <span className="text-[10px] text-center">{i.vcDragHint}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}