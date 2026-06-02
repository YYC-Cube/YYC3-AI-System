/**
 * @file PluginSystem.tsx
 * @description YYC³便携式智能AI系统 - 插件API系统
 * Plugin API System
 * registerPlugin(name, api) registry, sandbox loading, plugin list UI,
 * permissions management, hooks system (per Guidelines §Extensibility)
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,plugin,api,extensibility
 */

import {
  X, Puzzle, Search, Download, Trash2, ToggleLeft, ToggleRight,
  Shield, Code, CheckCircle, AlertTriangle, Loader2,
  Package, Zap, Lock
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

type TabId = 'installed' | 'available'

interface PluginPermission {
  id: string
  name: string
  granted: boolean
}

interface PluginHook {
  name: string
  description: string
  type: 'before' | 'after' | 'filter'
}

interface Plugin {
  id: string
  name: string
  displayName: string
  version: string
  author: string
  description: string
  status: 'active' | 'inactive' | 'loading' | 'error'
  enabled: boolean
  installed: boolean
  permissions: PluginPermission[]
  hooks: PluginHook[]
  apiEndpoints: string[]
  size: string
  downloads: number
  rating: number
  tags: string[]
}

const MOCK_PLUGINS: Plugin[] = [
  {
    id: 'pl-1', name: 'code-analyzer', displayName: 'AI Code Analyzer',
    version: '2.1.0', author: 'YYC3 Team', description: '智能代码质量分析，支持 TypeScript/React，检测性能瓶颈和安全漏洞',
    status: 'active', enabled: true, installed: true,
    permissions: [
      { id: 'fs-read', name: 'File System (Read)', granted: true },
      { id: 'ai-api', name: 'AI API Access', granted: true },
      { id: 'network', name: 'Network', granted: false },
    ],
    hooks: [
      { name: 'onFileSave', description: 'Triggers analysis on save', type: 'after' },
      { name: 'beforeBuild', description: 'Pre-build quality check', type: 'before' },
    ],
    apiEndpoints: ['analyzeFile', 'getReport', 'fixIssue'],
    size: '2.4 MB', downloads: 12500, rating: 4.8, tags: ['analysis', 'quality', 'ai'],
  },
  {
    id: 'pl-2', name: 'design-sync', displayName: 'Figma Design Sync',
    version: '1.5.2', author: 'YYC3 Team', description: '从 Figma 实时同步设计稿到代码组件，支持 token 映射和响应式转换',
    status: 'active', enabled: true, installed: true,
    permissions: [
      { id: 'fs-write', name: 'File System (Write)', granted: true },
      { id: 'network', name: 'Network', granted: true },
      { id: 'clipboard', name: 'Clipboard', granted: true },
    ],
    hooks: [
      { name: 'onDesignUpdate', description: 'Triggered on Figma push', type: 'after' },
      { name: 'filterTokens', description: 'Filter design tokens', type: 'filter' },
    ],
    apiEndpoints: ['syncDesign', 'mapTokens', 'generateComponent'],
    size: '3.1 MB', downloads: 8900, rating: 4.6, tags: ['design', 'figma', 'sync'],
  },
  {
    id: 'pl-3', name: 'test-generator', displayName: 'AI Test Generator',
    version: '1.2.0', author: 'Community', description: '基于 AI 自动生成单元测试和集成测试，支持 Vitest/Jest',
    status: 'inactive', enabled: false, installed: true,
    permissions: [
      { id: 'fs-read', name: 'File System (Read)', granted: true },
      { id: 'fs-write', name: 'File System (Write)', granted: true },
      { id: 'ai-api', name: 'AI API Access', granted: true },
    ],
    hooks: [
      { name: 'onTestRun', description: 'After test execution', type: 'after' },
    ],
    apiEndpoints: ['generateTest', 'runTests', 'getCoverage'],
    size: '1.8 MB', downloads: 5200, rating: 4.3, tags: ['testing', 'ai', 'vitest'],
  },
  {
    id: 'pl-4', name: 'doc-writer', displayName: 'Smart Doc Writer',
    version: '1.0.3', author: 'Community', description: '自动为函数、组件、模块生成 JSDoc/TSDoc 文档和 README',
    status: 'error', enabled: true, installed: true,
    permissions: [
      { id: 'fs-read', name: 'File System (Read)', granted: true },
      { id: 'ai-api', name: 'AI API Access', granted: true },
    ],
    hooks: [
      { name: 'onFileOpen', description: 'Check docs on file open', type: 'after' },
    ],
    apiEndpoints: ['generateDocs', 'updateReadme'],
    size: '1.2 MB', downloads: 3400, rating: 4.1, tags: ['docs', 'ai', 'readme'],
  },
  {
    id: 'pl-5', name: 's3-storage', displayName: 'S3 Cloud Storage',
    version: '2.0.0', author: 'Cloud Team', description: '将项目文件备份到 AWS S3/阿里 OSS，支持版本管理和增量同步',
    status: 'inactive', enabled: false, installed: false,
    permissions: [
      { id: 'fs-read', name: 'File System (Read)', granted: false },
      { id: 'network', name: 'Network', granted: false },
      { id: 'keychain', name: 'Keychain', granted: false },
    ],
    hooks: [
      { name: 'onFileSave', description: 'Auto-sync on save', type: 'after' },
      { name: 'beforeBackup', description: 'Pre-backup hook', type: 'before' },
    ],
    apiEndpoints: ['upload', 'download', 'listVersions', 'restore'],
    size: '1.6 MB', downloads: 7800, rating: 4.5, tags: ['storage', 'cloud', 's3'],
  },
  {
    id: 'pl-6', name: 'sqlite-backend', displayName: 'SQLite Backend',
    version: '1.1.0', author: 'Community', description: '本地 SQLite 数据库后端，适用于轻量级数据存储和离线应用',
    status: 'inactive', enabled: false, installed: false,
    permissions: [
      { id: 'fs-read', name: 'File System (Read)', granted: false },
      { id: 'fs-write', name: 'File System (Write)', granted: false },
    ],
    hooks: [
      { name: 'onDbQuery', description: 'Query interceptor', type: 'filter' },
    ],
    apiEndpoints: ['query', 'exec', 'backup', 'migrate'],
    size: '0.8 MB', downloads: 4100, rating: 4.2, tags: ['database', 'sqlite', 'local'],
  },
]

// Plugin registry API (simulated)
const pluginRegistry = {
  register: (name: string, api: Record<string, Function>) => {
    console.log(`[PluginRegistry] Registered plugin: ${name}`, Object.keys(api))
  },
  unregister: (name: string) => {
    console.log(`[PluginRegistry] Unregistered plugin: ${name}`)
  },
}

export function PluginSystem({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const [plugins, setPlugins] = useState<Plugin[]>(MOCK_PLUGINS)
  const [activeTab, setActiveTab] = useState<TabId>('installed')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [detailTab, setDetailTab] = useState<'info' | 'permissions' | 'hooks' | 'api'>('info')

  const filteredPlugins = useMemo(() => {
    let result = plugins
    if (activeTab === 'installed') result = result.filter(p => p.installed)
    else result = result.filter(p => !p.installed)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.displayName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q))
      )
    }
    return result
  }, [plugins, activeTab, searchQuery])

  const togglePlugin = (id: string) => {
    setPlugins(prev => prev.map(p => {
      if (p.id !== id) return p
      const newEnabled = !p.enabled
      if (newEnabled) {
        pluginRegistry.register(p.name, {})
        return { ...p, enabled: true, status: 'active' as const }
      } else {
        pluginRegistry.unregister(p.name)
        return { ...p, enabled: false, status: 'inactive' as const }
      }
    }))
  }

  const installPlugin = (id: string) => {
    setPlugins(prev => prev.map(p =>
      p.id === id ? { ...p, installed: true, status: 'loading' as const } : p
    ))
    setTimeout(() => {
      setPlugins(prev => prev.map(p =>
        p.id === id ? { ...p, status: 'inactive' as const, permissions: p.permissions.map(pm => ({ ...pm, granted: true })) } : p
      ))
      pluginRegistry.register(plugins.find(p => p.id === id)!.name, {})
      toast.success(i.plInstallSuccess)
    }, 1500)
  }

  const uninstallPlugin = (id: string) => {
    if (!confirm(i.plConfirmUninstall)) return
    const plugin = plugins.find(p => p.id === id)
    if (plugin) pluginRegistry.unregister(plugin.name)
    setPlugins(prev => prev.map(p =>
      p.id === id ? { ...p, installed: false, enabled: false, status: 'inactive' as const } : p
    ))
    if (selectedPlugin?.id === id) setSelectedPlugin(null)
    toast.success(i.plUninstallSuccess)
  }

  const togglePermission = (pluginId: string, permId: string) => {
    setPlugins(prev => prev.map(p =>
      p.id === pluginId ? {
        ...p,
        permissions: p.permissions.map(pm => pm.id === permId ? { ...pm, granted: !pm.granted } : pm)
      } : p
    ))
  }

  const statusIcon = (status: Plugin['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
      case 'inactive': return <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
      case 'loading': return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
      case 'error': return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed inset-6 z-[81] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${t.border.subtle} flex-shrink-0`}>
          <div className="flex items-center space-x-2.5">
            <Puzzle className={`w-5 h-5 ${t.accent.primary}`} />
            <div>
              <span className="text-[14px]" style={{ fontWeight: 600 }}>{i.plTitle}</span>
              <span className={`ml-2 text-[11px] ${t.text.muted}`}>{i.plSubtitle}</span>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Plugin List */}
          <div className={`w-80 border-r ${t.border.subtle} flex flex-col flex-shrink-0`}>
            {/* Search */}
            <div className={`p-3 border-b ${t.border.subtle}`}>
              <div className="relative">
                <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${t.text.dimmed}`} />
                <input
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder={i.plSearch}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-[12px] border ${t.border.subtle} bg-transparent ${t.text.primary} outline-none focus:ring-1 focus:ring-indigo-500/50`}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className={`flex border-b ${t.border.subtle}`}>
              {([
                { id: 'installed' as TabId, label: i.plInstalled, count: plugins.filter(p => p.installed).length },
                { id: 'available' as TabId, label: i.plAvailable, count: plugins.filter(p => !p.installed).length },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 text-[11px] border-b-2 ${t.transition} ${
                    activeTab === tab.id ? `${t.accent.activeText} border-indigo-500` : `${t.text.muted} border-transparent`
                  }`}
                  style={{ fontWeight: activeTab === tab.id ? 600 : 400 }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Plugin list */}
            <div className={`flex-1 overflow-y-auto p-2 space-y-1 ${t.scrollbar}`}>
              {filteredPlugins.length === 0 ? (
                <div className={`text-center py-8 text-[12px] ${t.text.muted}`}>{i.plNoPlugins}</div>
              ) : filteredPlugins.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => { setSelectedPlugin(pl); setDetailTab('info') }}
                  className={`w-full text-left p-3 rounded-lg ${t.transition} ${
                    selectedPlugin?.id === pl.id ? `${t.accent.activeBg} ${t.accent.activeText}` : t.interactive.menuItem
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      {statusIcon(pl.status)}
                      <span className="text-[12px] truncate" style={{ fontWeight: 500 }}>{pl.displayName}</span>
                    </div>
                    <span className={`text-[9px] ${t.text.dimmed}`}>v{pl.version}</span>
                  </div>
                  <div className={`text-[10px] ${t.text.dimmed} line-clamp-2`}>{pl.description}</div>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <span className={`text-[9px] ${t.text.dimmed}`}>{pl.author}</span>
                    <span className={`text-[9px] ${t.text.dimmed}`}>{pl.size}</span>
                    <span className={`text-[9px] ${t.text.dimmed}`}>★ {pl.rating}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {pl.tags.map(tag => (
                      <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">{tag}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Detail */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedPlugin ? (
              <>
                {/* Plugin header */}
                <div className={`flex items-center justify-between px-5 py-3 border-b ${t.border.subtle}`}>
                  <div className="flex items-center space-x-3">
                    <Package className={`w-8 h-8 p-1.5 rounded-lg ${t.isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`} />
                    <div>
                      <div className="text-[14px]" style={{ fontWeight: 600 }}>{selectedPlugin.displayName}</div>
                      <div className={`text-[11px] ${t.text.muted}`}>v{selectedPlugin.version} · {selectedPlugin.author} · {selectedPlugin.downloads.toLocaleString()} downloads</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedPlugin.installed ? (
                      <>
                        <button
                          onClick={() => togglePlugin(selectedPlugin.id)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] flex items-center space-x-1.5 ${t.transition} ${
                            selectedPlugin.enabled ? 'bg-emerald-500/15 text-emerald-400' : t.interactive.iconBtn
                          }`}
                        >
                          {selectedPlugin.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          <span>{selectedPlugin.enabled ? i.plDisable : i.plEnable}</span>
                        </button>
                        <button onClick={() => uninstallPlugin(selectedPlugin.id)} className={`px-3 py-1.5 rounded-lg text-[11px] flex items-center space-x-1 hover:bg-red-500/15 text-red-400 ${t.transition}`}>
                          <Trash2 className="w-3.5 h-3.5" /><span>{i.plUninstall}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => installPlugin(selectedPlugin.id)}
                        className={`px-4 py-1.5 rounded-lg text-[11px] flex items-center space-x-1.5 ${t.accent.activeBg} ${t.accent.activeText}`}
                      >
                        <Download className="w-3.5 h-3.5" /><span>{i.plInstall}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Detail tabs */}
                <div className={`flex border-b ${t.border.subtle}`}>
                  {([
                    { id: 'info' as const, label: i.plDescription, icon: Package },
                    { id: 'permissions' as const, label: i.plPermissions, icon: Shield },
                    { id: 'hooks' as const, label: i.plHooks, icon: Zap },
                    { id: 'api' as const, label: i.plApi, icon: Code },
                  ]).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailTab(tab.id)}
                      className={`flex items-center space-x-1.5 px-4 py-2 text-[11px] border-b-2 ${t.transition} ${
                        detailTab === tab.id ? `${t.accent.activeText} border-indigo-500` : `${t.text.muted} border-transparent`
                      }`}
                      style={{ fontWeight: detailTab === tab.id ? 600 : 400 }}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Detail content */}
                <div className={`flex-1 overflow-y-auto p-5 space-y-4 ${t.scrollbar}`}>
                  {detailTab === 'info' && (
                    <>
                      <div className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                        <div className={`text-[12px] ${t.text.secondary}`}>{selectedPlugin.description}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className={`p-3 rounded-xl text-center ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                          <div className={`text-[10px] ${t.text.dimmed}`}>{i.plStatus}</div>
                          <div className="flex items-center justify-center space-x-1.5 mt-1">
                            {statusIcon(selectedPlugin.status)}
                            <span className="text-[12px]" style={{ fontWeight: 500 }}>{selectedPlugin.status === 'active' ? i.plActive : selectedPlugin.status === 'error' ? i.plError : i.plInactive}</span>
                          </div>
                        </div>
                        <div className={`p-3 rounded-xl text-center ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                          <div className={`text-[10px] ${t.text.dimmed}`}>{i.plVersion}</div>
                          <div className="text-[12px] mt-1" style={{ fontWeight: 500 }}>v{selectedPlugin.version}</div>
                        </div>
                        <div className={`p-3 rounded-xl text-center ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                          <div className={`text-[10px] ${t.text.dimmed}`}>{i.plSandbox}</div>
                          <div className="flex items-center justify-center space-x-1 mt-1">
                            <Lock className="w-3 h-3 text-emerald-400" />
                            <span className="text-[12px] text-emerald-400" style={{ fontWeight: 500 }}>Isolated</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider mb-2 ${t.text.muted}`} style={{ fontWeight: 600 }}>registerPlugin API</div>
                        <pre className={`p-3 rounded-xl text-[11px] font-mono ${t.isDark ? 'bg-slate-900/60 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
{`registerPlugin('${selectedPlugin.name}', {
${selectedPlugin.apiEndpoints.map(ep => `  ${ep}: async (params) => { /* ... */ },`).join('\n')}
})`}
                        </pre>
                      </div>
                    </>
                  )}

                  {detailTab === 'permissions' && (
                    <div className="space-y-2">
                      {selectedPlugin.permissions.map(perm => (
                        <div key={perm.id} className={`flex items-center justify-between p-3 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                          <div className="flex items-center space-x-2.5">
                            <Shield className={`w-4 h-4 ${perm.granted ? 'text-emerald-400' : 'text-slate-400'}`} />
                            <span className="text-[12px]">{perm.name}</span>
                          </div>
                          <button
                            onClick={() => togglePermission(selectedPlugin.id, perm.id)}
                            className={`p-1 rounded ${t.transition}`}
                          >
                            {perm.granted
                              ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                              : <ToggleLeft className="w-5 h-5 text-slate-400" />
                            }
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailTab === 'hooks' && (
                    <div className="space-y-2">
                      {selectedPlugin.hooks.map(hook => (
                        <div key={hook.name} className={`p-3 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                          <div className="flex items-center space-x-2 mb-1">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <code className="text-[12px] text-indigo-400" style={{ fontWeight: 500 }}>{hook.name}</code>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${t.isDark ? 'bg-slate-700/60' : 'bg-slate-200'}`}>{hook.type}</span>
                          </div>
                          <div className={`text-[11px] ${t.text.dimmed} ml-5.5`}>{hook.description}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailTab === 'api' && (
                    <div className="space-y-2">
                      {selectedPlugin.apiEndpoints.map(ep => (
                        <div key={ep} className={`flex items-center space-x-2.5 p-3 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                          <Code className="w-3.5 h-3.5 text-blue-400" />
                          <code className="text-[12px] text-blue-400">{selectedPlugin.name}.{ep}()</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Puzzle className={`w-12 h-12 mx-auto mb-3 ${t.text.dimmed}`} />
                  <div className={`text-[13px] ${t.text.muted}`}>{i.plNoPlugins}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
