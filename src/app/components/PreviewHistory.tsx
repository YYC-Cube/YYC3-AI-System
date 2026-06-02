/**
 * @file PreviewHistory.tsx
 * @description YYC³便携式智能AI系统 - 预览快照历史面板
 * Preview Snapshot History Panel
 * Persistent preview snapshots via IndexedDB, timeline view, restore, and diff.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,preview,history,snapshots,persistence
 */

import {
  Clock, Trash2, RotateCcw, Camera, X, ChevronDown,
  ChevronRight, Download
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { storageService } from '../services/storage-service'
import { useAppStore } from '../store'
import type { PreviewSnapshot } from '../types'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'


interface PreviewHistoryProps {
  open: boolean
  onClose: () => void
  onRestore: (code: string, language: string) => void
  currentCode: string
  currentLanguage: string
}

export function PreviewHistory({ open, onClose, onRestore, currentCode, currentLanguage }: PreviewHistoryProps) {
  const { theme, language: lang } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(lang)

  const [snapshots, setSnapshots] = useState<PreviewSnapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const snaps = await storageService.getSnapshots()
    setSnapshots(snaps)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  const handleSaveSnapshot = useCallback(async () => {
    const snap: PreviewSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `Snapshot ${new Date().toLocaleTimeString()}`,
      description: '',
      content: currentCode,
      createdAt: Date.now(),
      createdBy: 'local-user',
      tags: [currentLanguage],
      size: new Blob([currentCode]).size,
      isAuto: false,
      metadata: {
        filePath: undefined,
        performanceMetrics: undefined,
      },
    }
    await storageService.saveSnapshot(snap)
    toast.success(i.pvSnapshotSaved)
    refresh()
  }, [currentCode, currentLanguage, i, refresh])

  const handleDelete = useCallback(async (id: string) => {
    await storageService.deleteSnapshot(id)
    toast.success('快照已删除')
    refresh()
  }, [refresh])

  const handleRestore = useCallback((snap: PreviewSnapshot) => {
    onRestore(snap.content, snap.tags[0] || 'html')
    toast.success(`已恢复: ${snap.name}`)
  }, [onRestore])

  const handleExport = useCallback((snap: PreviewSnapshot) => {
    const blob = new Blob([snap.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${snap.name}.txt`; a.click()
    URL.revokeObjectURL(url)
  }, [])

  if (!open) return null

  const allTags = [...new Set(snapshots.flatMap(s => s.tags))]
  const filtered = filterTag ? snapshots.filter(s => s.tags.includes(filterTag)) : snapshots

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    const now = Date.now()
    const diff = now - ts
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return d.toLocaleDateString()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className={`flex flex-col h-full border-l ${t.border.medium} ${t.surface.glass}`} style={{ width: 280 }}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2.5 border-b ${t.border.subtle}`}>
        <div className="flex items-center gap-2">
          <Clock className={`w-3.5 h-3.5 ${t.accent.primary}`} />
          <span className={`text-[11px] ${t.text.primary}`} style={{ fontWeight: 600 }}>快照历史</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${t.isDark ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500'}`}>
            {snapshots.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleSaveSnapshot}
            className={`p-1 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} title="保存快照">
            <Camera className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose}
            className={`p-1 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className={`flex items-center gap-1 px-3 py-1.5 border-b ${t.border.subtle} overflow-x-auto`}>
          <button onClick={() => setFilterTag(null)}
            className={`px-2 py-0.5 rounded text-[8px] ${t.transition} ${!filterTag ? 'bg-indigo-500/15 text-indigo-400' : `${t.text.dimmed} hover:bg-white/5`}`}>
            全部
          </button>
          {allTags.map(tag => (
            <button key={tag} onClick={() => setFilterTag(tag)}
              className={`px-2 py-0.5 rounded text-[8px] ${t.transition} ${filterTag === tag ? 'bg-indigo-500/15 text-indigo-400' : `${t.text.dimmed} hover:bg-white/5`}`}>
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Snapshot list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className={`text-[10px] ${t.text.dimmed} text-center py-8`}>加载中...</div>
        ) : filtered.length === 0 ? (
          <div className={`text-[10px] ${t.text.dimmed} text-center py-8`}>
            <Camera className={`w-6 h-6 mx-auto mb-2 ${t.text.muted}`} />
            暂无快照<br />
            <span className="text-[9px]">点击相机图标保存当前预览</span>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filtered.map(snap => {
              const expanded = expandedId === snap.id
              return (
                <div key={snap.id}
                  className={`rounded-lg overflow-hidden ${t.isDark ? 'bg-white/[0.02] hover:bg-white/[0.04]' : 'bg-slate-50 hover:bg-slate-100'} ${t.transition}`}>
                  {/* Row */}
                  <button onClick={() => setExpandedId(expanded ? null : snap.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-left">
                    {expanded ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] ${t.text.secondary} truncate`} style={{ fontWeight: 500 }}>{snap.name}</div>
                      <div className={`text-[8px] ${t.text.dimmed} flex items-center gap-2 mt-0.5`}>
                        <span>{formatTime(snap.createdAt)}</span>
                        <span>{formatSize(snap.size)}</span>
                        {snap.tags.map(tag => (
                          <span key={tag} className={`px-1 py-0 rounded ${t.isDark ? 'bg-white/5' : 'bg-slate-200'}`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    {snap.isAuto && (
                      <span className={`text-[7px] px-1 py-0.5 rounded ${t.isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>自动</span>
                    )}
                  </button>

                  {/* Expanded actions */}
                  {expanded && (
                    <div className={`px-2.5 pb-2 pt-0 space-y-1.5`}>
                      {/* Code preview */}
                      <pre className={`text-[8px] ${t.text.dimmed} p-2 rounded-lg overflow-hidden max-h-16 ${t.isDark ? 'bg-black/20' : 'bg-white'}`}>
                        {snap.content.slice(0, 200)}...
                      </pre>
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleRestore(snap)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] ${t.transition} bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20`}>
                          <RotateCcw className="w-2.5 h-2.5" /> 恢复
                        </button>
                        <button onClick={() => handleExport(snap)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] ${t.transition} ${t.interactive.iconBtn}`}>
                          <Download className="w-2.5 h-2.5" /> 导出
                        </button>
                        <button onClick={() => handleDelete(snap.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] ${t.transition} text-red-400/60 hover:bg-red-500/10 hover:text-red-400`}>
                          <Trash2 className="w-2.5 h-2.5" /> 删除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
