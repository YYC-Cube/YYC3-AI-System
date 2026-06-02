/**
 * @file ThemeManager.tsx
 * @description YYC³便携式智能AI系统 - 主题导出/导入系统
 * Theme Export/Import System
 * Export theme config as JSON, import from JSON, share via URL,
 * manage custom saved themes
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,theme,export,import
 */

import {
  X, Palette, Download, Upload, Link, Trash2,
  CheckCircle, Save
} from 'lucide-react'
import React, { useState, useRef } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens, THEME_PRESETS } from '../utils/theme'

interface SavedTheme {
  id: string
  name: string
  config: any
  createdAt: number
}

export function ThemeManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, language, customThemeConfig, setTheme } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([
    {
      id: 'st-1', name: 'Cosmic Dark', createdAt: Date.now() - 86400000,
      config: { theme: 'dark', colors: { primary: '#8b5cf6', secondary: '#6366f1', accent: '#ec4899', background: '#0f0a1a', card: '#1a1030', border: '#2d1f4e' } }
    },
    {
      id: 'st-2', name: 'Ocean Breeze', createdAt: Date.now() - 172800000,
      config: { theme: 'midnight', colors: { primary: '#0ea5e9', secondary: '#06b6d4', accent: '#22d3ee', background: '#0c1929', card: '#132b42', border: '#1e3a5f' } }
    },
    {
      id: 'st-3', name: 'Forest Calm', createdAt: Date.now() - 259200000,
      config: { theme: 'forest', colors: { primary: '#10b981', secondary: '#059669', accent: '#34d399', background: '#0a1f14', card: '#122e1e', border: '#1a4a2e' } }
    },
  ])

  const [newThemeName, setNewThemeName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentConfig = {
    theme,
    customThemeConfig,
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    platform: 'YYC3 PortAISys',
  }

  const handleExport = () => {
    const json = JSON.stringify(currentConfig, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yyc3-theme-${theme}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(i.tmExportSuccess)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.theme) {
          setTheme(data.theme)
          toast.success(i.tmImportSuccess)
        } else {
          toast.error(i.tmImportError)
        }
      } catch {
        toast.error(i.tmImportError)
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleShareLink = () => {
    const encoded = btoa(JSON.stringify({ theme, ts: Date.now() }))
    const url = `${window.location.origin}?theme=${encoded}`
    navigator.clipboard.writeText(url)
    toast.success(i.tmLinkCopied)
  }

  const handleSaveTheme = () => {
    if (!newThemeName.trim()) return
    const st: SavedTheme = {
      id: 'st-' + Date.now(),
      name: newThemeName.trim(),
      config: { ...currentConfig },
      createdAt: Date.now(),
    }
    setSavedThemes(prev => [st, ...prev])
    setNewThemeName('')
    toast.success(i.tmSaveTheme)
  }

  const handleDeleteTheme = (id: string) => {
    if (!confirm(i.tmDeleteConfirm)) return
    setSavedThemes(prev => prev.filter(t => t.id !== id))
  }

  const handleApplyTheme = (st: SavedTheme) => {
    if (st.config.theme) setTheme(st.config.theme)
    toast.success(i.tmApply)
  }

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ko' ? 'ko-KR' : 'en-US')
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-8">
        <div className={`w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-3 border-b ${t.border.subtle} flex-shrink-0`}>
            <div className="flex items-center space-x-2.5">
              <Palette className={`w-5 h-5 ${t.accent.primary}`} />
              <div>
                <span className="text-[14px]" style={{ fontWeight: 600 }}>{i.tmTitle}</span>
                <span className={`ml-2 text-[11px] ${t.text.muted}`}>{i.tmSubtitle}</span>
              </div>
            </div>
            <button onClick={onClose} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className={`flex-1 overflow-y-auto p-5 space-y-5 ${t.scrollbar}`}>
            {/* Actions bar */}
            <div className="flex items-center space-x-2">
              <button onClick={handleExport} className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-[11px] ${t.transition} ${t.accent.activeBg} ${t.accent.activeText}`}>
                <Download className="w-3.5 h-3.5" /><span>{i.tmExportJson}</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-[11px] ${t.transition} ${t.interactive.iconBtn}`}>
                <Upload className="w-3.5 h-3.5" /><span>{i.tmImportJson}</span>
              </button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              <button onClick={handleShareLink} className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-[11px] ${t.transition} ${t.interactive.iconBtn}`}>
                <Link className="w-3.5 h-3.5" /><span>{i.tmShareLink}</span>
              </button>
            </div>

            {/* Current Config Preview */}
            <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
              <div className={`text-[11px] uppercase tracking-wider mb-3 ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.tmCurrentConfig}</div>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {THEME_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setTheme(preset.id)}
                    className={`p-2 rounded-lg text-[10px] text-center ${t.transition} ${
                      theme === preset.id ? `ring-2 ring-indigo-500 ${t.accent.activeBg}` : t.interactive.iconBtn
                    }`}
                  >
                    <div className="text-[16px] mb-1">{preset.icon}</div>
                    <div style={{ fontWeight: theme === preset.id ? 600 : 400 }}>{preset.id}</div>
                  </button>
                ))}
              </div>
              <pre className={`p-3 rounded-lg text-[10px] font-mono max-h-32 overflow-y-auto ${t.isDark ? 'bg-slate-900/60 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                {JSON.stringify(currentConfig, null, 2)}
              </pre>
            </div>

            {/* Save new theme */}
            <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
              <div className={`text-[11px] uppercase tracking-wider mb-2 ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.tmSaveTheme}</div>
              <div className="flex items-center space-x-2">
                <input
                  value={newThemeName}
                  onChange={e => setNewThemeName(e.target.value)}
                  placeholder={i.tmThemeName}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-[12px] border ${t.border.subtle} bg-transparent ${t.text.primary} outline-none focus:ring-1 focus:ring-indigo-500/50`}
                  onKeyDown={e => e.key === 'Enter' && handleSaveTheme()}
                />
                <button
                  onClick={handleSaveTheme}
                  disabled={!newThemeName.trim()}
                  className={`px-3 py-1.5 rounded-lg text-[11px] flex items-center space-x-1.5 ${t.transition} ${
                    newThemeName.trim() ? `${t.accent.activeBg} ${t.accent.activeText}` : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" /><span>{i.tmSaveTheme}</span>
                </button>
              </div>
            </div>

            {/* Saved themes */}
            <div>
              <div className={`text-[11px] uppercase tracking-wider mb-3 ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.tmCustomThemes}</div>
              {savedThemes.length === 0 ? (
                <div className={`text-center py-6 text-[12px] ${t.text.muted}`}>{i.tmNoCustom}</div>
              ) : (
                <div className="space-y-2">
                  {savedThemes.map(st => (
                    <div key={st.id} className={`flex items-center justify-between p-3 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          {Object.values(st.config.colors || {}).slice(0, 4).map((c: any, idx: number) => (
                            <div key={idx} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <div>
                          <div className="text-[12px]" style={{ fontWeight: 500 }}>{st.name}</div>
                          <div className={`text-[9px] ${t.text.dimmed}`}>{st.config.theme} · {formatDate(st.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button onClick={() => handleApplyTheme(st)} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} title={i.tmApply}>
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteTheme(st.id)} className={`p-1.5 rounded-lg ${t.transition} hover:bg-red-500/15 text-red-400`} title={i.tmDeleteTheme}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
