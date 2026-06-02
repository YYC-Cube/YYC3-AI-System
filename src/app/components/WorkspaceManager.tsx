/**
 * @file WorkspaceManager.tsx
 * @description YYC³便携式智能AI系统 - 主机文件系统管理器
 * Host File System Manager
 * Workspace folder browser with file tree, version history panel with timeline,
 * rollback capability, recent files, file operations (create/rename/delete),
 * drag-drop upload zone, context menus, file info panel.
 * Guidelines §Host-File-System Manager. Prefix: wm*
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,workspace,file-system,manager
 */

import {
  FolderOpen, X, Plus, Trash2, FileText, Folder, ChevronRight,
  ChevronDown, Clock, RotateCcw, Upload, Download, Edit3, Copy,
  Search, GitBranch, File, HardDrive, Eye,
  FileCode2, Image, FileJson, FileType, FolderPlus
} from 'lucide-react'
import { motion } from 'motion/react'
import React, { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

/* ── Types ── */
interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  modified?: number
  encoding?: string
  children?: FileNode[]
  expanded?: boolean
  versions?: FileVersion[]
}

interface FileVersion {
  id: string
  timestamp: number
  size: number
  author: string
  message: string
  hash: string
}

/* ── Mock workspace data ── */
const MOCK_WORKSPACE: FileNode[] = [
  {
    name: 'src', path: '/src', type: 'folder', expanded: true, children: [
      {
        name: 'app', path: '/src/app', type: 'folder', expanded: true, children: [
          {
            name: 'components', path: '/src/app/components', type: 'folder', children: [
              { name: 'ChatInterface.tsx', path: '/src/app/components/ChatInterface.tsx', type: 'file', size: 12840, modified: Date.now() - 3600000, encoding: 'UTF-8',
                versions: [
                  { id: 'v5', timestamp: Date.now() - 3600000, size: 12840, author: 'You', message: 'Add streaming response handler', hash: 'a3f2e1d' },
                  { id: 'v4', timestamp: Date.now() - 7200000, size: 11200, author: 'Alice', message: 'Refactor message rendering', hash: 'b4c3d2e' },
                  { id: 'v3', timestamp: Date.now() - 86400000, size: 10500, author: 'You', message: 'Add slash command support', hash: 'c5d4e3f' },
                  { id: 'v2', timestamp: Date.now() - 172800000, size: 8900, author: 'Bob', message: 'Implement auto-scroll', hash: 'd6e5f4a' },
                  { id: 'v1', timestamp: Date.now() - 604800000, size: 6200, author: 'You', message: 'Initial chat interface', hash: 'e7f6a5b' },
                ]
              },
              { name: 'IDELayout.tsx', path: '/src/app/components/IDELayout.tsx', type: 'file', size: 18600, modified: Date.now() - 1800000, encoding: 'UTF-8',
                versions: [
                  { id: 'v3', timestamp: Date.now() - 1800000, size: 18600, author: 'You', message: 'Add database manager panel', hash: 'f1a2b3c' },
                  { id: 'v2', timestamp: Date.now() - 86400000, size: 16400, author: 'You', message: 'Integrate workspace manager', hash: 'a2b3c4d' },
                  { id: 'v1', timestamp: Date.now() - 604800000, size: 12000, author: 'Alice', message: 'Initial multi-panel layout', hash: 'b3c4d5e' },
                ]
              },
              { name: 'PreviewPanel.tsx', path: '/src/app/components/PreviewPanel.tsx', type: 'file', size: 15200, modified: Date.now() - 7200000, encoding: 'UTF-8' },
              { name: 'CodeEditor.tsx', path: '/src/app/components/CodeEditor.tsx', type: 'file', size: 9800, modified: Date.now() - 14400000, encoding: 'UTF-8' },
              { name: 'FileManager.tsx', path: '/src/app/components/FileManager.tsx', type: 'file', size: 7600, modified: Date.now() - 28800000, encoding: 'UTF-8' },
            ]
          },
          {
            name: 'utils', path: '/src/app/utils', type: 'folder', children: [
              { name: 'theme.ts', path: '/src/app/utils/theme.ts', type: 'file', size: 8400, modified: Date.now() - 43200000, encoding: 'UTF-8' },
              { name: 'i18n.ts', path: '/src/app/utils/i18n.ts', type: 'file', size: 28000, modified: Date.now() - 3600000, encoding: 'UTF-8' },
              { name: 'i18n-data.ts', path: '/src/app/utils/i18n-data.ts', type: 'file', size: 62000, modified: Date.now() - 1800000, encoding: 'UTF-8' },
              { name: 'preview-engine.ts', path: '/src/app/utils/preview-engine.ts', type: 'file', size: 14500, modified: Date.now() - 7200000, encoding: 'UTF-8' },
            ]
          },
          { name: 'store.ts', path: '/src/app/store.ts', type: 'file', size: 21000, modified: Date.now() - 900000, encoding: 'UTF-8' },
          { name: 'types.ts', path: '/src/app/types.ts', type: 'file', size: 3200, modified: Date.now() - 86400000, encoding: 'UTF-8' },
          { name: 'App.tsx', path: '/src/app/App.tsx', type: 'file', size: 1200, modified: Date.now() - 604800000, encoding: 'UTF-8' },
        ]
      },
      {
        name: 'styles', path: '/src/styles', type: 'folder', children: [
          { name: 'theme.css', path: '/src/styles/theme.css', type: 'file', size: 4200, modified: Date.now() - 86400000 },
          { name: 'fonts.css', path: '/src/styles/fonts.css', type: 'file', size: 800, modified: Date.now() - 604800000 },
        ]
      },
    ]
  },
  {
    name: 'public', path: '/public', type: 'folder', children: [
      { name: 'favicon.ico', path: '/public/favicon.ico', type: 'file', size: 4286 },
      { name: 'logo.svg', path: '/public/logo.svg', type: 'file', size: 2100 },
    ]
  },
  { name: 'package.json', path: '/package.json', type: 'file', size: 2800, modified: Date.now() - 172800000, encoding: 'UTF-8' },
  { name: 'tsconfig.json', path: '/tsconfig.json', type: 'file', size: 680, modified: Date.now() - 604800000, encoding: 'UTF-8' },
  { name: 'vite.config.ts', path: '/vite.config.ts', type: 'file', size: 920, modified: Date.now() - 604800000, encoding: 'UTF-8' },
]

const RECENT_FILES = [
  { name: 'i18n-data.ts', path: '/src/app/utils/i18n-data.ts', time: Date.now() - 120000 },
  { name: 'store.ts', path: '/src/app/store.ts', time: Date.now() - 900000 },
  { name: 'IDELayout.tsx', path: '/src/app/components/IDELayout.tsx', time: Date.now() - 1800000 },
  { name: 'ChatInterface.tsx', path: '/src/app/components/ChatInterface.tsx', time: Date.now() - 3600000 },
  { name: 'preview-engine.ts', path: '/src/app/utils/preview-engine.ts', time: Date.now() - 7200000 },
]

type SideTab = 'files' | 'recent' | 'versions'

const getFileIcon = (name: string) => {
  if (name.endsWith('.tsx') || name.endsWith('.jsx')) return <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
  if (name.endsWith('.ts') || name.endsWith('.js')) return <FileCode2 className="w-3.5 h-3.5 text-yellow-400" />
  if (name.endsWith('.json')) return <FileJson className="w-3.5 h-3.5 text-amber-400" />
  if (name.endsWith('.css') || name.endsWith('.scss')) return <FileType className="w-3.5 h-3.5 text-purple-400" />
  if (name.endsWith('.svg') || name.endsWith('.png') || name.endsWith('.ico')) return <Image className="w-3.5 h-3.5 text-green-400" />
  if (name.endsWith('.md')) return <FileText className="w-3.5 h-3.5 text-slate-400" />
  return <File className="w-3.5 h-3.5 text-slate-400" />
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function countFiles(nodes: FileNode[]): { files: number; size: number } {
  let files = 0, size = 0
  for (const n of nodes) {
    if (n.type === 'file') { files++; size += n.size || 0 }
    if (n.children) { const r = countFiles(n.children); files += r.files; size += r.size }
  }
  return { files, size }
}

/* ══════════════════════════════════════════ */

interface WorkspaceManagerProps { open: boolean; onClose: () => void }

export function WorkspaceManager({ open, onClose }: WorkspaceManagerProps) {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const ii = getI18n(language)

  const [files, setFiles] = useState<FileNode[]>(MOCK_WORKSPACE)
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
  const [sideTab, setSideTab] = useState<SideTab>('files')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDragZone, setShowDragZone] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null)

  const stats = useMemo(() => countFiles(files), [files])

  const toggleExpand = useCallback((path: string) => {
    const toggle = (nodes: FileNode[]): FileNode[] =>
      nodes.map(n => n.path === path ? { ...n, expanded: !n.expanded } : { ...n, children: n.children ? toggle(n.children) : undefined })
    setFiles(prev => toggle(prev))
  }, [])

  const handleRollback = useCallback((file: FileNode, versionId: string) => {
    const version = file.versions?.find(v => v.id === versionId)
    if (version) {
      toast.success(`${ii.wmRollbackSuccess}: ${file.name} → ${version.hash}`)
    }
  }, [ii])

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }, [])

  const renderTree = (nodes: FileNode[], depth: number = 0): React.ReactNode =>
    nodes.filter(n => !searchQuery || n.name.toLowerCase().includes(searchQuery.toLowerCase()) || (n.type === 'folder' && n.children?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())))).map(node => (
      <div key={node.path}>
        <button
          onClick={() => { node.type === 'folder' ? toggleExpand(node.path) : setSelectedFile(node) }}
          onContextMenu={(e) => handleContextMenu(e, node)}
          className={`w-full flex items-center gap-1.5 py-1 px-2 text-[10px] text-left ${t.transition} ${
            selectedFile?.path === node.path ? (t.isDark ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-600') : t.interactive.menuItem
          }`}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
        >
          {node.type === 'folder' ? (
            <>
              {node.expanded ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
              <Folder className={`w-3.5 h-3.5 flex-shrink-0 ${node.expanded ? 'text-indigo-400' : 'text-slate-400'}`} />
            </>
          ) : (
            <>
              <span className="w-3 flex-shrink-0" />
              {getFileIcon(node.name)}
            </>
          )}
          <span className={`truncate ${t.text.primary}`} style={{ fontWeight: node.type === 'folder' ? 500 : 400 }}>{node.name}</span>
          {node.type === 'file' && node.versions && node.versions.length > 0 && (
            <GitBranch className="w-2.5 h-2.5 ml-auto flex-shrink-0 text-emerald-400" />
          )}
        </button>
        {node.type === 'folder' && node.expanded && node.children && renderTree(node.children, depth + 1)}
      </div>
    ))

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={() => { onClose(); setContextMenu(null) }} />
      {/* Context Menu */}
      {contextMenu && (
        <div className={`fixed z-[80] w-44 rounded-xl overflow-hidden ${t.surface.popover} ${t.border.popover} shadow-2xl`} style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}>
          {[
            { icon: Eye, label: ii.wmFileInfo, action: () => setSelectedFile(contextMenu.node) },
            { icon: Edit3, label: ii.wmRename, action: () => toast.success(ii.wmRename) },
            { icon: Copy, label: ii.wmCopyPath, action: () => { navigator.clipboard.writeText(contextMenu.node.path); toast.success(ii.codeCopied) } },
            { icon: Download, label: ii.wmDownload, action: () => toast.success(ii.wmDownload) },
            { icon: Trash2, label: ii.wmDelete, action: () => toast.success(ii.wmDelete), danger: true },
          ].map((item, _idx) => (
            <button key={_idx} onClick={item.action}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[9px] text-left ${t.transition} ${(item as any).danger ? 'text-red-400 hover:bg-red-500/10' : t.interactive.menuItem}`}>
              <item.icon className="w-3 h-3" /> {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4" onClick={() => setContextMenu(null)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-3 border-b ${t.border.subtle}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.isDark ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20' : 'bg-gradient-to-br from-emerald-50 to-teal-50'}`}>
                <FolderOpen className={`w-4 h-4 ${t.isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
              </div>
              <div>
                <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 700 }}>{ii.wmTitle}</h2>
                <p className={`text-[10px] ${t.text.dimmed}`}>{ii.wmSubtitle} · {stats.files} {ii.wmTotalFiles} · {formatSize(stats.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-50'} ${t.text.dimmed}`}>
                <HardDrive className="w-2.5 h-2.5" /> ~/Documents/YYC3-AI-Code
              </div>
              <button onClick={onClose} className={`p-2 rounded-xl ${t.transition} ${t.interactive.iconBtn}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left: File tree */}
            <div className={`w-64 flex-shrink-0 flex flex-col border-r ${t.border.subtle}`}>
              {/* Tabs */}
              <div className={`flex items-center gap-0 px-2 border-b ${t.border.subtle}`}>
                {([
                  { tab: 'files' as SideTab, label: ii.wmBrowse, icon: Folder },
                  { tab: 'recent' as SideTab, label: ii.wmRecent, icon: Clock },
                ] as const).map(st => (
                  <button key={st.tab} onClick={() => setSideTab(st.tab)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-[9px] ${t.transition} border-b-2 ${
                      sideTab === st.tab ? `${t.accent.primary} border-current` : `${t.text.muted} border-transparent`
                    }`} style={{ fontWeight: sideTab === st.tab ? 600 : 400 }}>
                    <st.icon className="w-3 h-3" /> {st.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className={`px-2 py-1.5 border-b ${t.border.subtle}`}>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                  <Search className={`w-3 h-3 ${t.text.dimmed}`} />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder={ii.wmSearchFiles}
                    className={`flex-1 text-[9px] bg-transparent outline-none ${t.text.primary}`} />
                </div>
              </div>

              {/* Tree / Recent */}
              <div className={`flex-1 overflow-y-auto ${t.scrollbar}`}>
                {sideTab === 'files' ? (
                  renderTree(files)
                ) : (
                  RECENT_FILES.map(rf => (
                    <button key={rf.path} onClick={() => { /* select file */ }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left ${t.transition} ${t.interactive.menuItem}`}>
                      {getFileIcon(rf.name)}
                      <div className="flex-1 min-w-0">
                        <div className={`text-[10px] truncate ${t.text.primary}`}>{rf.name}</div>
                        <div className={`text-[8px] truncate ${t.text.dimmed}`}>{rf.path}</div>
                      </div>
                      <span className={`text-[7px] flex-shrink-0 ${t.text.dimmed}`}>{timeAgo(rf.time)}</span>
                    </button>
                  ))
                )}
              </div>

              {/* Actions */}
              <div className={`flex items-center gap-1 px-2 py-1.5 border-t ${t.border.subtle}`}>
                <button className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`} title={ii.wmCreateFile}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`} title={ii.wmCreateFolder}>
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowDragZone(!showDragZone)} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`} title={ii.wmUpload}>
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right: File detail / Version history */}
            <div className="flex-1 flex flex-col">
              {selectedFile ? (
                <>
                  {/* File info header */}
                  <div className={`flex items-center gap-3 px-4 py-3 border-b ${t.border.subtle}`}>
                    {getFileIcon(selectedFile.name)}
                    <div className="flex-1 min-w-0">
                      <div className={`text-[12px] font-mono ${t.text.primary}`} style={{ fontWeight: 600 }}>{selectedFile.name}</div>
                      <div className={`text-[9px] ${t.text.dimmed}`}>{selectedFile.path}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedFile.size && <div className={`text-[8px] ${t.text.dimmed}`}>{ii.wmSize}: {formatSize(selectedFile.size)}</div>}
                      {selectedFile.encoding && <div className={`text-[8px] ${t.text.dimmed}`}>{selectedFile.encoding}</div>}
                      {selectedFile.modified && <div className={`text-[8px] ${t.text.dimmed}`}>{ii.wmModified}: {timeAgo(selectedFile.modified)}</div>}
                    </div>
                  </div>

                  {/* Version history */}
                  <div className={`px-4 py-2 border-b ${t.border.subtle}`}>
                    <span className={`text-[10px] ${t.text.primary}`} style={{ fontWeight: 600 }}>{ii.wmVersionHistory}</span>
                    <span className={`text-[8px] ml-2 ${t.text.dimmed}`}>{selectedFile.versions?.length || 0} {ii.wmVersions}</span>
                  </div>

                  <div className={`flex-1 overflow-y-auto ${t.scrollbar}`}>
                    {selectedFile.versions && selectedFile.versions.length > 0 ? (
                      <div className="p-4 space-y-0">
                        {selectedFile.versions.map((ver, idx) => (
                          <div key={ver.id} className="flex gap-3">
                            {/* Timeline */}
                            <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
                              <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${idx === 0 ? 'bg-indigo-500 border-indigo-400' : (t.isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-200 border-slate-300')}`} />
                              {idx < (selectedFile.versions?.length || 0) - 1 && (
                                <div className={`w-px flex-1 min-h-[32px] ${t.isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                              )}
                            </div>
                            {/* Content */}
                            <div className={`flex-1 pb-4 ${idx === 0 ? '' : ''}`}>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${t.isDark ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>{ver.hash}</span>
                                {idx === 0 && <span className={`text-[7px] px-1.5 py-0.5 rounded-full ${t.isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>{ii.wmCurrentVersion}</span>}
                              </div>
                              <div className={`text-[10px] mt-1 ${t.text.primary}`}>{ver.message}</div>
                              <div className={`flex items-center gap-3 mt-1`}>
                                <span className={`text-[8px] ${t.text.dimmed}`}>{ver.author}</span>
                                <span className={`text-[8px] ${t.text.dimmed}`}>{timeAgo(ver.timestamp)}</span>
                                <span className={`text-[8px] ${t.text.dimmed}`}>{formatSize(ver.size)}</span>
                                {idx > 0 && (
                                  <button onClick={() => handleRollback(selectedFile, ver.id)}
                                    className={`flex items-center gap-0.5 text-[8px] text-amber-400 hover:text-amber-300 ${t.transition}`}>
                                    <RotateCcw className="w-2.5 h-2.5" /> {ii.wmRollback}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`flex flex-col items-center justify-center h-full gap-2 ${t.text.dimmed}`}>
                        <GitBranch className="w-6 h-6 opacity-20" />
                        <span className="text-[10px]">{ii.wmNoVersions}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : showDragZone ? (
                <div className={`flex-1 flex items-center justify-center p-8`}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); toast.success(ii.wmUpload); setShowDragZone(false) }}>
                  <div className={`w-full max-w-md border-2 border-dashed rounded-2xl p-12 text-center ${t.isDark ? 'border-indigo-500/30' : 'border-indigo-200'}`}>
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${t.isDark ? 'text-indigo-400/40' : 'text-indigo-300'}`} />
                    <p className={`text-[12px] ${t.text.muted}`}>{ii.wmDragDrop}</p>
                  </div>
                </div>
              ) : (
                <div className={`flex-1 flex flex-col items-center justify-center gap-2 ${t.text.dimmed}`}>
                  <FolderOpen className="w-8 h-8 opacity-15" />
                  <span className="text-[11px]">{ii.wmBrowse}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
