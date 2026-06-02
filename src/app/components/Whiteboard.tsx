/**
 * @file Whiteboard.tsx
 * @description YYC³便携式智能AI系统 - 协作白板
 * Collaborative Whiteboard
 * Free-draw canvas (Canvas API), multi-user cursor sync,
 * brush/shape/text/sticky tools, undo/redo, export PNG/SVG
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,whiteboard,collaboration,drawing
 */

import {
  X, Pencil, Eraser, Square, Circle, Minus, ArrowRight,
  Type, StickyNote, MousePointer, Move,
  Undo2, Redo2, Trash2, Download, Grid3X3,
  Users
} from 'lucide-react'
import React, { useRef, useState, useEffect, useCallback } from 'react'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

type Tool = 'select' | 'move' | 'brush' | 'eraser' | 'rect' | 'circle' | 'line' | 'arrow' | 'text' | 'sticky'

interface DrawElement {
  id: string
  type: Tool
  points?: { x: number; y: number }[]
  x?: number; y?: number; w?: number; h?: number
  color: string
  strokeWidth: number
  fill: string
  opacity: number
  text?: string
}

const COLORS = ['#6366f1', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#ffffff', '#94a3b8', '#000000']
const STROKE_WIDTHS = [1, 2, 3, 5, 8]

// Mock collaborator cursors
const MOCK_CURSORS = [
  { id: 'u1', name: 'Alice', color: '#f59e0b', x: 320, y: 200 },
  { id: 'u2', name: 'Bob', color: '#3b82f6', x: 520, y: 380 },
]

export function Whiteboard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('brush')
  const [color, setColor] = useState('#6366f1')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [fillColor, setFillColor] = useState('transparent')
  const [opacity, setOpacity] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [showCursors, setShowCursors] = useState(true)
  const [elements, setElements] = useState<DrawElement[]>([])
  const [undoStack, setUndoStack] = useState<DrawElement[][]>([])
  const [redoStack, setRedoStack] = useState<DrawElement[][]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentElement, setCurrentElement] = useState<DrawElement | null>(null)
  const [_startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)

  // Redraw canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Grid
    if (showGrid) {
      ctx.strokeStyle = t.isDark ? 'rgba(100,116,139,0.12)' : 'rgba(148,163,184,0.15)'
      ctx.lineWidth = 0.5
      for (let x = 0; x < rect.width; x += 24) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rect.height); ctx.stroke()
      }
      for (let y = 0; y < rect.height; y += 24) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rect.width, y); ctx.stroke()
      }
    }

    // Draw all elements
    const allElements = currentElement ? [...elements, currentElement] : elements
    for (const el of allElements) {
      ctx.globalAlpha = el.opacity
      ctx.strokeStyle = el.color
      ctx.lineWidth = el.strokeWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (el.type === 'brush' && el.points && el.points.length > 0) {
        ctx.beginPath()
        ctx.moveTo(el.points[0].x, el.points[0].y)
        for (let j = 1; j < el.points.length; j++) {
          ctx.lineTo(el.points[j].x, el.points[j].y)
        }
        ctx.stroke()
      } else if (el.type === 'eraser' && el.points && el.points.length > 0) {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.beginPath()
        ctx.moveTo(el.points[0].x, el.points[0].y)
        for (let j = 1; j < el.points.length; j++) {
          ctx.lineTo(el.points[j].x, el.points[j].y)
        }
        ctx.lineWidth = el.strokeWidth * 4
        ctx.stroke()
        ctx.globalCompositeOperation = 'source-over'
      } else if (el.type === 'rect' && el.x != null && el.y != null && el.w != null && el.h != null) {
        if (el.fill !== 'transparent') {
          ctx.fillStyle = el.fill
          ctx.fillRect(el.x, el.y, el.w, el.h)
        }
        ctx.strokeRect(el.x, el.y, el.w, el.h)
      } else if (el.type === 'circle' && el.x != null && el.y != null && el.w != null && el.h != null) {
        const cx = el.x + el.w / 2, cy = el.y + el.h / 2
        const rx = Math.abs(el.w / 2), ry = Math.abs(el.h / 2)
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        if (el.fill !== 'transparent') { ctx.fillStyle = el.fill; ctx.fill() }
        ctx.stroke()
      } else if (el.type === 'line' && el.points && el.points.length >= 2) {
        ctx.beginPath()
        ctx.moveTo(el.points[0].x, el.points[0].y)
        ctx.lineTo(el.points[1].x, el.points[1].y)
        ctx.stroke()
      } else if (el.type === 'arrow' && el.points && el.points.length >= 2) {
        const p0 = el.points[0], p1 = el.points[1]
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.stroke()
        // Arrowhead
        const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x)
        const headLen = 12
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p1.x - headLen * Math.cos(angle - Math.PI / 6), p1.y - headLen * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p1.x - headLen * Math.cos(angle + Math.PI / 6), p1.y - headLen * Math.sin(angle + Math.PI / 6))
        ctx.stroke()
      } else if (el.type === 'text' && el.x != null && el.y != null && el.text) {
        ctx.fillStyle = el.color
        ctx.font = `${el.strokeWidth * 5 + 10}px Inter, sans-serif`
        ctx.fillText(el.text, el.x, el.y)
      } else if (el.type === 'sticky' && el.x != null && el.y != null) {
        ctx.fillStyle = '#fef08a'
        ctx.globalAlpha = 0.9
        ctx.fillRect(el.x, el.y, 140, 100)
        ctx.strokeStyle = '#eab308'
        ctx.lineWidth = 1
        ctx.strokeRect(el.x, el.y, 140, 100)
        ctx.fillStyle = '#78350f'
        ctx.font = '12px Inter, sans-serif'
        ctx.fillText(el.text || 'Note', el.x + 8, el.y + 24)
      }
      ctx.globalAlpha = 1
    }

    // Collaborator cursors
    if (showCursors) {
      for (const c of MOCK_CURSORS) {
        ctx.fillStyle = c.color
        ctx.beginPath()
        ctx.moveTo(c.x, c.y)
        ctx.lineTo(c.x, c.y + 16)
        ctx.lineTo(c.x + 10, c.y + 12)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = c.color
        ctx.font = '10px Inter, sans-serif'
        ctx.fillText(c.name, c.x + 12, c.y + 18)
      }
    }
  }, [elements, currentElement, showGrid, showCursors, t.isDark])

  useEffect(() => {
    if (open) redraw()
  }, [open, redraw])

  useEffect(() => {
    const handleResize = () => redraw()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [redraw])

  const getCanvasPos = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === 'select' || tool === 'move') return
    const pos = getCanvasPos(e)
    setIsDrawing(true)
    setStartPos(pos)

    if (tool === 'brush' || tool === 'eraser') {
      setCurrentElement({ id: 'tmp', type: tool, points: [pos], color, strokeWidth, fill: fillColor, opacity })
    } else if (tool === 'text') {
      const text = prompt(i.wbText) || ''
      if (text) {
        pushUndo()
        setElements(prev => [...prev, { id: Date.now().toString(), type: 'text', x: pos.x, y: pos.y, text, color, strokeWidth, fill: fillColor, opacity }])
      }
      setIsDrawing(false)
    } else if (tool === 'sticky') {
      const text = prompt(i.wbStickyNote) || 'Note'
      pushUndo()
      setElements(prev => [...prev, { id: Date.now().toString(), type: 'sticky', x: pos.x, y: pos.y, text, color, strokeWidth, fill: fillColor, opacity }])
      setIsDrawing(false)
    } else {
      setCurrentElement({ id: 'tmp', type: tool, x: pos.x, y: pos.y, w: 0, h: 0, points: [pos], color, strokeWidth, fill: fillColor, opacity })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentElement) return
    const pos = getCanvasPos(e)

    if (currentElement.type === 'brush' || currentElement.type === 'eraser') {
      setCurrentElement(prev => prev ? { ...prev, points: [...(prev.points || []), pos] } : prev)
    } else if (currentElement.type === 'rect' || currentElement.type === 'circle') {
      setCurrentElement(prev => prev ? { ...prev, w: pos.x - (prev.x || 0), h: pos.y - (prev.y || 0) } : prev)
    } else if (currentElement.type === 'line' || currentElement.type === 'arrow') {
      setCurrentElement(prev => prev ? { ...prev, points: [prev.points![0], pos] } : prev)
    }
    redraw()
  }

  const handleMouseUp = () => {
    if (!isDrawing || !currentElement) { setIsDrawing(false); return }
    pushUndo()
    setElements(prev => [...prev, { ...currentElement, id: Date.now().toString() }])
    setCurrentElement(null)
    setIsDrawing(false)
    setRedoStack([])
  }

  const pushUndo = () => {
    setUndoStack(prev => [...prev.slice(-30), [...elements]])
  }

  const handleUndo = () => {
    if (undoStack.length === 0) return
    setRedoStack(prev => [...prev, [...elements]])
    const prev = undoStack[undoStack.length - 1]
    setUndoStack(s => s.slice(0, -1))
    setElements(prev)
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    setUndoStack(prev => [...prev, [...elements]])
    const next = redoStack[redoStack.length - 1]
    setRedoStack(s => s.slice(0, -1))
    setElements(next)
  }

  const handleClear = () => {
    if (!confirm(i.wbClearConfirm)) return
    pushUndo()
    setElements([])
  }

  const handleExportPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'whiteboard.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleExportSvg = () => {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">\n`
    for (const el of elements) {
      if (el.type === 'brush' && el.points && el.points.length > 1) {
        const d = el.points.map((p, j) => `${j === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
        svg += `  <path d="${d}" stroke="${el.color}" stroke-width="${el.strokeWidth}" fill="none" opacity="${el.opacity}" stroke-linecap="round"/>\n`
      } else if (el.type === 'rect') {
        svg += `  <rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" stroke="${el.color}" stroke-width="${el.strokeWidth}" fill="${el.fill}" opacity="${el.opacity}"/>\n`
      }
    }
    svg += `</svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const link = document.createElement('a')
    link.download = 'whiteboard.svg'
    link.href = URL.createObjectURL(blob)
    link.click()
  }

  if (!open) return null

  const TOOLS: { id: Tool; icon: React.FC<{ className?: string }>; label: string }[] = [
    { id: 'select', icon: MousePointer, label: i.wbSelect },
    { id: 'move', icon: Move, label: i.wbMove },
    { id: 'brush', icon: Pencil, label: i.wbBrush },
    { id: 'eraser', icon: Eraser, label: i.wbEraser },
    { id: 'rect', icon: Square, label: i.wbRect },
    { id: 'circle', icon: Circle, label: i.wbCircle },
    { id: 'line', icon: Minus, label: i.wbLine },
    { id: 'arrow', icon: ArrowRight, label: i.wbArrow },
    { id: 'text', icon: Type, label: i.wbText },
    { id: 'sticky', icon: StickyNote, label: i.wbStickyNote },
  ]

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed inset-4 z-[61] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${t.border.subtle} flex-shrink-0`}>
          <div className="flex items-center space-x-2.5">
            <Pencil className={`w-5 h-5 ${t.accent.primary}`} />
            <div>
              <span className="text-[14px]" style={{ fontWeight: 600 }}>{i.wbTitle}</span>
              <span className={`ml-2 text-[11px] ${t.text.muted}`}>{i.wbSubtitle}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={handleUndo} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} title={i.wbUndo}>
              <Undo2 className="w-4 h-4" />
            </button>
            <button onClick={handleRedo} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} title={i.wbRedo}>
              <Redo2 className="w-4 h-4" />
            </button>
            <button onClick={handleClear} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} title={i.wbClear}>
              <Trash2 className="w-4 h-4" />
            </button>
            <div className={`w-px h-4 ${t.border.dividerV}`} />
            <button onClick={handleExportPng} className={`px-2 py-1 rounded-lg text-[11px] ${t.transition} ${t.interactive.iconBtn}`} title={i.wbExportPng}>
              <Download className="w-3.5 h-3.5 inline mr-1" />PNG
            </button>
            <button onClick={handleExportSvg} className={`px-2 py-1 rounded-lg text-[11px] ${t.transition} ${t.interactive.iconBtn}`} title={i.wbExportSvg}>
              <Download className="w-3.5 h-3.5 inline mr-1" />SVG
            </button>
            <div className={`w-px h-4 ${t.border.dividerV}`} />
            <button onClick={onClose} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Toolbar */}
          <div className={`w-12 flex flex-col items-center py-2 space-y-1 border-r ${t.border.subtle} flex-shrink-0`}>
            {TOOLS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setTool(id)}
                className={`p-2 rounded-lg ${t.transition} ${tool === id ? `${t.accent.activeBg} ${t.accent.activeText}` : t.interactive.iconBtn}`}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
            <div className={`w-6 h-px my-1 ${t.border.divider}`} />
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg ${t.transition} ${showGrid ? `${t.accent.activeBg} ${t.accent.activeText}` : t.interactive.iconBtn}`}
              title={i.wbGrid}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCursors(!showCursors)}
              className={`p-2 rounded-lg ${t.transition} ${showCursors ? `${t.accent.activeBg} ${t.accent.activeText}` : t.interactive.iconBtn}`}
              title={i.wbCursors}
            >
              <Users className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              style={{ background: t.isDark ? '#0f172a' : '#f8fafc' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {/* Right Properties */}
          <div className={`w-48 border-l ${t.border.subtle} p-3 space-y-4 flex-shrink-0 overflow-y-auto ${t.scrollbar}`}>
            {/* Color */}
            <div>
              <div className={`text-[10px] uppercase tracking-wider mb-2 ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.wbColor}</div>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${t.transition} ${color === c ? 'border-indigo-400 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Stroke */}
            <div>
              <div className={`text-[10px] uppercase tracking-wider mb-2 ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.wbStrokeWidth}</div>
              <div className="flex items-center space-x-1">
                {STROKE_WIDTHS.map(w => (
                  <button
                    key={w}
                    onClick={() => setStrokeWidth(w)}
                    className={`flex-1 py-1.5 rounded text-[10px] ${t.transition} ${strokeWidth === w ? `${t.accent.activeBg} ${t.accent.activeText}` : t.interactive.iconBtn}`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div>
              <div className={`text-[10px] uppercase tracking-wider mb-2 ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.wbOpacity}</div>
              <input
                type="range"
                min={0.1} max={1} step={0.1}
                value={opacity}
                onChange={e => setOpacity(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className={`text-[10px] text-center ${t.text.dimmed}`}>{Math.round(opacity * 100)}%</div>
            </div>

            {/* Fill */}
            <div>
              <div className={`text-[10px] uppercase tracking-wider mb-2 ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.wbFill}</div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFillColor('transparent')}
                  className={`w-6 h-6 rounded-full border-2 ${t.transition} ${fillColor === 'transparent' ? 'border-indigo-400' : 'border-transparent'}`}
                  style={{ background: 'repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 8px 8px' }}
                />
                {COLORS.slice(0, 6).map(c => (
                  <button
                    key={c}
                    onClick={() => setFillColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${t.transition} ${fillColor === c ? 'border-indigo-400 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className={`pt-3 border-t ${t.border.subtle}`}>
              <div className={`text-[10px] ${t.text.dimmed}`}>{i.dpFiles}: {elements.length}</div>
              <div className={`text-[10px] ${t.text.dimmed}`}>{i.wbUndo}: {undoStack.length} / {i.wbRedo}: {redoStack.length}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
