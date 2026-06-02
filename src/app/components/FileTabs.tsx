/**
 * @file FileTabs.tsx
 * @description YYC³便携式智能AI系统 - 可拖拽文件标签栏
 * Draggable File Tab Bar
 * Features: DnD reorder via react-dnd, right-click context menu (close, close others,
 * close right, pin/unpin), modified indicator, Liquid Glass styling.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,tabs,drag-drop,file-management
 */

import {
  X, Pin, FileCode, FileJson, FileType, FileCog, Hash
} from 'lucide-react'
import React, { useState, useRef, useCallback } from 'react'
import { useDrag, useDrop } from 'react-dnd'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

/* ── File icon helper ── */
function getFileIcon(name: string): React.ElementType {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return FileCode
  if (name.endsWith('.json')) return FileJson
  if (name.endsWith('.css')) return FileType
  if (name.endsWith('.md')) return FileType
  if (name.endsWith('.config.ts') || name.endsWith('.config.js')) return FileCog
  return Hash
}

function getFileColor(name: string, isDark: boolean): string {
  if (name.endsWith('.tsx')) return isDark ? 'text-blue-400' : 'text-blue-600'
  if (name.endsWith('.ts')) return isDark ? 'text-sky-400' : 'text-sky-600'
  if (name.endsWith('.json')) return isDark ? 'text-amber-400' : 'text-amber-600'
  if (name.endsWith('.css')) return isDark ? 'text-pink-400' : 'text-pink-600'
  if (name.endsWith('.md')) return isDark ? 'text-slate-400' : 'text-slate-500'
  return isDark ? 'text-slate-400' : 'text-slate-500'
}

/* ── DnD item type ── */
const TAB_DND_TYPE = 'FILE_TAB'

interface DragItem {
  index: number
  file: string
}

/* ── Single Tab ── */
function Tab({
  file, index, isActive, isPinned, isModified, onSelect, onClose, onContextMenu,
  onReorder, t, isDark,
}: {
  file: string
  index: number
  isActive: boolean
  isPinned: boolean
  isModified: boolean
  onSelect: () => void
  onClose: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onReorder: (from: number, to: number) => void
  t: ReturnType<typeof getThemeTokens>
  isDark: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag({
    type: TAB_DND_TYPE,
    item: { index, file },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: TAB_DND_TYPE,
    hover: (item) => {
      if (item.index !== index) {
        onReorder(item.index, index)
        item.index = index
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

  drag(drop(ref))

  const Icon = getFileIcon(file)

  return (
    <div
      ref={ref}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      className={`group relative flex items-center gap-1.5 px-3 py-1.5 cursor-pointer select-none whitespace-nowrap min-w-0 ${t.transition} ${
        isDragging ? 'opacity-30' : ''
      } ${
        isActive
          ? `${t.isDark ? 'bg-white/[0.06]' : 'bg-white/70'} ${t.text.primary}`
          : `${t.isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-white/40'} ${t.text.muted}`
      } ${isOver ? `${t.isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}` : ''}`}
      style={{ borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'}` }}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${t.isDark ? 'bg-indigo-400' : 'bg-indigo-500'}`} />
      )}

      {/* Pin indicator */}
      {isPinned && (
        <Pin className={`w-2.5 h-2.5 flex-shrink-0 ${t.isDark ? 'text-amber-400/60' : 'text-amber-500/60'}`} />
      )}

      {/* File icon */}
      <Icon className={`w-3 h-3 flex-shrink-0 ${getFileColor(file, isDark)}`} />

      {/* File name */}
      <span className="text-[10px] truncate max-w-[100px]" style={{ fontWeight: isActive ? 500 : 400 }}>
        {file}
      </span>

      {/* Modified indicator */}
      {isModified && !isActive && (
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.isDark ? 'bg-amber-400' : 'bg-amber-500'}`} />
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className={`flex-shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 ${t.transition} ${
          isActive ? 'opacity-60' : ''
        } ${t.interactive.iconBtn}`}
      >
        {isModified && isActive ? (
          <div className={`w-2.5 h-2.5 rounded-full ${t.isDark ? 'bg-amber-400' : 'bg-amber-500'}`} />
        ) : (
          <X className="w-2.5 h-2.5" />
        )}
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════ */
/*  FileTabs — Main Component                        */
/* ══════════════════════════════════════════════════ */

export function FileTabs() {
  const {
    theme, language, selectedFile, setSelectedFile,
    openTabs, pinnedTabs, addOpenTab, removeOpenTab,
    reorderTabs, closeOtherTabs, closeRightTabs, closeAllTabs, togglePinTab,
    modifiedFiles,
  } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: string } | null>(null)

  // Ensure selected file is in open tabs
  React.useEffect(() => {
    if (selectedFile && !openTabs.includes(selectedFile)) {
      addOpenTab(selectedFile)
    }
  }, [selectedFile, openTabs, addOpenTab])

  const handleSelect = useCallback((file: string) => {
    setSelectedFile(file)
  }, [setSelectedFile])

  const handleClose = useCallback((e: React.MouseEvent, file: string) => {
    e.stopPropagation()
    const isPinned = pinnedTabs.includes(file)
    if (isPinned) return // Can't close pinned tabs via X

    removeOpenTab(file)
    // If closing active tab, switch to adjacent
    if (file === selectedFile) {
      const idx = openTabs.indexOf(file)
      const next = openTabs[idx - 1] || openTabs[idx + 1] || null
      setSelectedFile(next)
    }
  }, [openTabs, pinnedTabs, selectedFile, removeOpenTab, setSelectedFile])

  const handleContextMenu = useCallback((e: React.MouseEvent, file: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, file })
  }, [])

  const handleReorder = useCallback((from: number, to: number) => {
    reorderTabs(from, to)
  }, [reorderTabs])

  const ctxActions = contextMenu ? [
    { label: i.ftClose, action: () => { handleClose(new MouseEvent('click') as any, contextMenu.file); setContextMenu(null) } },
    { label: i.ftCloseOthers, action: () => { closeOtherTabs(contextMenu.file); setContextMenu(null) } },
    { label: i.ftCloseRight, action: () => { closeRightTabs(contextMenu.file); setContextMenu(null) } },
    { label: i.ftCloseAll, action: () => { closeAllTabs(); setContextMenu(null) } },
    null, // separator
    { label: pinnedTabs.includes(contextMenu.file) ? i.ftUnpin : i.ftPin, action: () => { togglePinTab(contextMenu.file); setContextMenu(null) } },
  ] : []

  if (openTabs.length === 0) return null

  return (
    <>
      <div className={`flex items-center h-[30px] overflow-x-auto ${t.scrollbar} ${t.isDark ? 'bg-slate-900/30' : 'bg-slate-50/40'} border-b ${t.border.subtle}`}>
        {/* Tab list */}
        {openTabs.map((file, idx) => (
          <Tab
            key={file}
            file={file}
            index={idx}
            isActive={file === selectedFile}
            isPinned={pinnedTabs.includes(file)}
            isModified={modifiedFiles.includes(file)}
            onSelect={() => handleSelect(file)}
            onClose={(e) => handleClose(e, file)}
            onContextMenu={(e) => handleContextMenu(e, file)}
            onReorder={handleReorder}
            t={t}
            isDark={t.isDark}
          />
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-[80]" onClick={() => setContextMenu(null)} />
          <div
            className={`fixed z-[81] rounded-xl overflow-hidden shadow-xl py-1 min-w-[160px] ${t.surface.popover} ${t.border.popover}`}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {ctxActions.map((item, _idx) =>
              item === null ? (
                <div key={_idx} className={`my-1 h-px mx-2 ${t.border.divider}`} />
              ) : (
                <button
                  key={_idx}
                  onClick={item.action}
                  className={`w-full text-left px-3 py-1.5 text-[11px] ${t.transition} ${t.interactive.menuItem}`}
                  style={{ fontWeight: 400 }}
                >
                  {item.label}
                </button>
              )
            )}
          </div>
        </>
      )}
    </>
  )
}