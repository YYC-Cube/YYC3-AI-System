/**
 * @file LayoutManager.tsx
 * @description YYC³便携式智能AI系统 - 面板布局持久化系统
 * Panel Layout Persistence System
 * Save/load/switch/delete multi-layout presets with LocalStorage persistence.
 * 5 preset layouts + custom saves, panel type selector for each column,
 * auto-save toggle, export/import. Guidelines §Layout Persistence. Prefix: lm*
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,layout,persistence,workspace
 */

import {
  LayoutGrid, X, Trash2, Save,
  Star, StarOff, Check, Edit3, RotateCcw,
  MessageSquare, FolderTree, Code2, Eye, Terminal, HardDrive,
  Database, ChevronDown, Zap
} from 'lucide-react'
import { motion } from 'motion/react'
import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n, type I18nStrings } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

/* ── Panel type registry ── */
export type PanelContentType = 'chat' | 'files' | 'code' | 'preview' | 'terminal' | 'workspace' | 'database'

export const PANEL_TYPES: { id: PanelContentType; labelKey: string; icon: React.ElementType; color: string }[] = [
  { id: 'chat', labelKey: 'ptChat', icon: MessageSquare, color: '#818cf8' },
  { id: 'files', labelKey: 'ptFiles', icon: FolderTree, color: '#60a5fa' },
  { id: 'code', labelKey: 'ptCode', icon: Code2, color: '#34d399' },
  { id: 'preview', labelKey: 'ptPreview', icon: Eye, color: '#f472b6' },
  { id: 'terminal', labelKey: 'ptTerminal', icon: Terminal, color: '#fbbf24' },
  { id: 'workspace', labelKey: 'ptWorkspace', icon: HardDrive, color: '#2dd4bf' },
  { id: 'database', labelKey: 'ptDatabase', icon: Database, color: '#a78bfa' },
]

/* ── Preset layouts ── */
const PRESET_LAYOUTS: { id: string; labelKey: string; icon: React.ElementType; panelMap: { left: string; middle: string; right: string }; viewMode: 'code' | 'preview' }[] = [
  { id: 'preset-dev', labelKey: 'lmLayoutDev', icon: Code2, panelMap: { left: 'chat', middle: 'files', right: 'code' }, viewMode: 'code' },
  { id: 'preset-write', labelKey: 'lmLayoutWrite', icon: Edit3, panelMap: { left: 'files', middle: 'code', right: 'preview' }, viewMode: 'code' },
  { id: 'preset-debug', labelKey: 'lmLayoutDebug', icon: Terminal, panelMap: { left: 'code', middle: 'terminal', right: 'preview' }, viewMode: 'code' },
  { id: 'preset-review', labelKey: 'lmLayoutReview', icon: Eye, panelMap: { left: 'chat', middle: 'code', right: 'preview' }, viewMode: 'code' },
  { id: 'preset-data', labelKey: 'lmLayoutData', icon: Database, panelMap: { left: 'database', middle: 'workspace', right: 'code' }, viewMode: 'code' },
]

function getPanelMeta(type: string) {
  return PANEL_TYPES.find(p => p.id === type) || PANEL_TYPES[0]
}

/* ── Panel Type Selector (used in IDELayout too) ── */
export function PanelTypeSelector({ current, onChange, t, i }: {
  current: string; onChange: (type: PanelContentType) => void
  t: ReturnType<typeof getThemeTokens>; i: I18nStrings
}) {
  const [open, setOpen] = useState(false)
  const meta = getPanelMeta(current)
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] ${t.transition} ${t.interactive.iconBtn}`}
        title={i.ptSelectPanel}>
        <meta.icon className="w-3 h-3" style={{ color: meta.color }} />
        <ChevronDown className="w-2 h-2" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute top-full left-0 mt-1 z-50 w-36 rounded-xl overflow-hidden ${t.surface.popover} ${t.border.popover} shadow-xl`}>
            <div className={`px-2 py-1 text-[7px] uppercase tracking-wider ${t.text.dimmed}`}>{i.ptSelectPanel}</div>
            {PANEL_TYPES.map(pt => (
              <button key={pt.id} onClick={() => { onChange(pt.id); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[9px] text-left ${t.transition} ${
                  current === pt.id ? `${t.isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'} ${t.accent.primary}` : t.interactive.menuItem
                }`}>
                <pt.icon className="w-3 h-3" style={{ color: pt.color }} />
                <span>{i[pt.labelKey as keyof I18nStrings] || pt.id}</span>
                {current === pt.id && <Check className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════ */

interface LayoutManagerProps { open: boolean; onClose: () => void }

export function LayoutManager({ open, onClose }: LayoutManagerProps) {
  const {
    theme, language, panelMap, setPanelMap, setViewMode,
    savedLayouts, activeLayoutId, layoutAutoSave,
    saveLayout, loadLayout, deleteLayout, renameLayout, setDefaultLayout, setLayoutAutoSave,
  } = useAppStore()
  const t = getThemeTokens(theme)
  const i: I18nStrings = getI18n(language)

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleSave = useCallback(() => {
    if (!newName.trim()) return
    saveLayout(newName.trim())
    setNewName('')
    toast.success(i.lmSaveSuccess)
  }, [newName, saveLayout, i])

  const handleLoadPreset = useCallback((preset: typeof PRESET_LAYOUTS[0]) => {
    setPanelMap(preset.panelMap)
    setViewMode(preset.viewMode)
    toast.success(i.lmLoadSuccess)
  }, [setPanelMap, setViewMode, i])

  const handleLoadSaved = useCallback((id: string) => {
    loadLayout(id)
    toast.success(i.lmLoadSuccess)
  }, [loadLayout, i])

  const handleDelete = useCallback((id: string) => {
    deleteLayout(id)
  }, [deleteLayout])

  const handleRename = useCallback((id: string) => {
    if (editName.trim()) {
      renameLayout(id, editName.trim())
      setEditingId(null)
    }
  }, [editName, renameLayout])

  const handleReset = useCallback(() => {
    setPanelMap({ left: 'chat', middle: 'files', right: 'code' })
    setViewMode('code')
    toast.success(i.lmLoadSuccess)
  }, [setPanelMap, setViewMode, i])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-3 border-b ${t.border.subtle}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.isDark ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' : 'bg-gradient-to-br from-purple-50 to-pink-50'}`}>
                <LayoutGrid className={`w-4 h-4 ${t.isDark ? 'text-purple-400' : 'text-purple-500'}`} />
              </div>
              <div>
                <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 700 }}>{i.lmTitle}</h2>
                <p className={`text-[10px] ${t.text.dimmed}`}>{i.lmSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setLayoutAutoSave(!layoutAutoSave); toast.success(layoutAutoSave ? i.lmAutoSaveOff : i.lmAutoSaveOn) }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] ${t.transition} ${layoutAutoSave ? (t.isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : t.interactive.iconBtn}`}>
                <Zap className="w-3 h-3" /> {i.lmAutoSave}
              </button>
              <button onClick={onClose} className={`p-2 rounded-xl ${t.transition} ${t.interactive.iconBtn}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto ${t.scrollbar} p-4 space-y-4`}>
            {/* Current layout indicator */}
            <div className={`flex items-center gap-3 p-3 rounded-xl ${t.isDark ? 'bg-white/[0.02] border border-white/[0.04]' : 'bg-slate-50 border border-slate-100'}`}>
              <span className={`text-[9px] uppercase tracking-wider ${t.text.dimmed}`} style={{ fontWeight: 600 }}>{i.lmCurrent}</span>
              <div className="flex items-center gap-2 flex-1">
                {(['left', 'middle', 'right'] as const).map(slot => {
                  const meta = getPanelMeta(panelMap[slot])
                  return (
                    <div key={slot} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] ${t.isDark ? 'bg-white/[0.04]' : 'bg-white'}`}>
                      <meta.icon className="w-3 h-3" style={{ color: meta.color }} />
                      <span className={t.text.muted}>{i[meta.labelKey as keyof I18nStrings]}</span>
                    </div>
                  )
                })}
              </div>
              <button onClick={handleReset} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`} title={i.lmResetLayout}>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Preset layouts */}
            <div>
              <span className={`text-[9px] uppercase tracking-wider ${t.text.dimmed}`} style={{ fontWeight: 600 }}>{i.lmPresets}</span>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {PRESET_LAYOUTS.map(preset => {
                  const isActive = panelMap.left === preset.panelMap.left && panelMap.middle === preset.panelMap.middle && panelMap.right === preset.panelMap.right
                  return (
                    <button key={preset.id} onClick={() => handleLoadPreset(preset)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${t.transition} ${
                        isActive ? (t.isDark ? 'bg-indigo-500/15 ring-1 ring-indigo-500/30' : 'bg-indigo-50 ring-1 ring-indigo-200') : (t.isDark ? 'bg-white/[0.02] hover:bg-white/[0.04]' : 'bg-white hover:bg-slate-50')
                      } border ${t.isDark ? 'border-white/[0.04]' : 'border-slate-100'}`}>
                      <preset.icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : t.text.muted}`} />
                      <span className={`text-[9px] ${isActive ? t.accent.primary : t.text.muted}`} style={{ fontWeight: isActive ? 600 : 400 }}>{i[preset.labelKey as keyof I18nStrings]}</span>
                      {/* Mini column preview */}
                      <div className="flex gap-0.5 w-full h-4 mt-0.5">
                        {(['left', 'middle', 'right'] as const).map(slot => {
                          const m = getPanelMeta(preset.panelMap[slot])
                          return <div key={slot} className="flex-1 rounded-sm" style={{ background: m.color + '30' }} />
                        })}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Saved layouts */}
            <div>
              <span className={`text-[9px] uppercase tracking-wider ${t.text.dimmed}`} style={{ fontWeight: 600 }}>{i.lmSaved} ({savedLayouts.length})</span>
              <div className="space-y-1.5 mt-2">
                {savedLayouts.length === 0 ? (
                  <div className={`flex items-center justify-center py-6 text-[10px] ${t.text.dimmed}`}>
                    <LayoutGrid className="w-4 h-4 mr-2 opacity-30" /> {i.lmCustom}
                  </div>
                ) : savedLayouts.map(layout => (
                  <div key={layout.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${t.transition} ${
                    activeLayoutId === layout.id ? (t.isDark ? 'bg-indigo-500/10 ring-1 ring-indigo-500/20' : 'bg-indigo-50 ring-1 ring-indigo-100') : (t.isDark ? 'bg-white/[0.02]' : 'bg-white')
                  } border ${t.isDark ? 'border-white/[0.04]' : 'border-slate-100'}`}>
                    {editingId === layout.id ? (
                      <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(layout.id); if (e.key === 'Escape') setEditingId(null) }}
                        className={`flex-1 text-[10px] bg-transparent outline-none ${t.text.primary}`} />
                    ) : (
                      <span className={`flex-1 text-[10px] ${t.text.primary}`} style={{ fontWeight: 500 }}>{layout.name}</span>
                    )}
                    {layout.isDefault && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                    <div className="flex items-center gap-0.5 ml-2">
                      {(['left', 'middle', 'right'] as const).map(slot => {
                        const m = getPanelMeta(layout.panelMap[slot])
                        return <div key={slot} className="w-2 h-2 rounded-sm" style={{ background: m.color }} />
                      })}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => handleLoadSaved(layout.id)} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}>
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={() => { setEditingId(layout.id); setEditName(layout.name) }} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}>
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button onClick={() => setDefaultLayout(layout.id)} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}>
                        {layout.isDefault ? <Star className="w-3 h-3 text-amber-400" /> : <StarOff className="w-3 h-3" />}
                      </button>
                      <button onClick={() => handleDelete(layout.id)} className={`p-1 rounded ${t.transition} text-red-400 hover:bg-red-500/10`}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save new layout */}
            <div className={`flex items-center gap-2 p-3 rounded-xl border ${t.isDark ? 'border-white/[0.04] bg-white/[0.01]' : 'border-slate-100 bg-slate-50'}`}>
              <Save className={`w-4 h-4 flex-shrink-0 ${t.text.dimmed}`} />
              <input value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                placeholder={i.lmLayoutName}
                className={`flex-1 text-[10px] bg-transparent outline-none ${t.text.primary}`} />
              <button onClick={handleSave} disabled={!newName.trim()}
                className={`px-3 py-1 rounded-lg text-[9px] ${t.transition} ${newName.trim() ? t.accent.solidBtn + ' text-white' : 'opacity-30'}`}
                style={{ fontWeight: 600 }}>
                {i.lmSaveLayout}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
