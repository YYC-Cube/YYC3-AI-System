/**
 * @file SnippetManager.tsx
 * @description YYC³便携式智能AI系统 - 智能代码片段管理器
 * Smart Code Snippet Manager
 * AI auto-tagging, search/filter, drag-insert, favorites, usage stats
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,snippets,code-reuse,ai
 */

import {
  X, Plus, Search, Star, Clock, TrendingUp, Tag,
  Copy, Code, Trash2, Sparkles,
  Check, Heart
} from 'lucide-react'
import React, { useState, useMemo } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

type TabId = 'all' | 'favorites' | 'recent' | 'frequent'

interface Snippet {
  id: string
  name: string
  description: string
  language: string
  code: string
  tags: string[]
  aiTags: string[]
  isFavorite: boolean
  usageCount: number
  lastUsed: number
  createdAt: number
}

const LANGUAGES = ['TypeScript', 'JavaScript', 'React', 'CSS', 'HTML', 'Python', 'Rust', 'SQL', 'Shell']
const AI_TAG_OPTIONS = ['utility', 'component', 'hook', 'api', 'state', 'style', 'config', 'test', 'animation', 'auth', 'form', 'data']

const MOCK_SNIPPETS: Snippet[] = [
  {
    id: 's1', name: 'useDebounce Hook',
    description: 'React hook for debouncing values with configurable delay',
    language: 'TypeScript', tags: ['react', 'hook', 'performance'],
    aiTags: ['hook', 'utility', 'state'],
    code: `function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}`,
    isFavorite: true, usageCount: 24, lastUsed: Date.now() - 3600000, createdAt: Date.now() - 86400000 * 7
  },
  {
    id: 's2', name: 'Zustand Store Template',
    description: 'Zustand store with persist middleware boilerplate',
    language: 'TypeScript', tags: ['zustand', 'state', 'template'],
    aiTags: ['state', 'config'],
    code: `import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface StoreState {
  count: number
  increment: () => void
  reset: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
      reset: () => set({ count: 0 }),
    }),
    { name: 'my-store' }
  )
)`,
    isFavorite: true, usageCount: 18, lastUsed: Date.now() - 7200000, createdAt: Date.now() - 86400000 * 14
  },
  {
    id: 's3', name: 'Fetch with Retry',
    description: 'Fetch wrapper with exponential backoff retry',
    language: 'TypeScript', tags: ['api', 'fetch', 'retry'],
    aiTags: ['api', 'utility'],
    code: `async function fetchWithRetry(
  url: string, options?: RequestInit, retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options)
      if (res.ok) return res
      throw new Error(\`HTTP \${res.status}\`)
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 2 ** i * 1000))
    }
  }
  throw new Error('Unreachable')
}`,
    isFavorite: false, usageCount: 12, lastUsed: Date.now() - 86400000, createdAt: Date.now() - 86400000 * 5
  },
  {
    id: 's4', name: 'Glass Card CSS',
    description: 'Liquid glass morphism card style with backdrop blur',
    language: 'CSS', tags: ['css', 'glass', 'design'],
    aiTags: ['style', 'component'],
    code: `.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}`,
    isFavorite: false, usageCount: 8, lastUsed: Date.now() - 172800000, createdAt: Date.now() - 86400000 * 10
  },
  {
    id: 's5', name: 'React Intersection Observer',
    description: 'Custom hook for lazy loading with IntersectionObserver',
    language: 'React', tags: ['react', 'hook', 'lazy-load'],
    aiTags: ['hook', 'component', 'animation'],
    code: `function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, inView }
}`,
    isFavorite: true, usageCount: 15, lastUsed: Date.now() - 43200000, createdAt: Date.now() - 86400000 * 3
  },
  {
    id: 's6', name: 'SQL Pagination Query',
    description: 'PostgreSQL cursor-based pagination pattern',
    language: 'SQL', tags: ['sql', 'pagination', 'postgres'],
    aiTags: ['data', 'api'],
    code: `SELECT id, name, created_at
FROM users
WHERE created_at < $1
ORDER BY created_at DESC
LIMIT $2;`,
    isFavorite: false, usageCount: 6, lastUsed: Date.now() - 259200000, createdAt: Date.now() - 86400000 * 20
  },
]

export function SnippetManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const ii = getI18n(language)

  const [snippets, setSnippets] = useState<Snippet[]>(MOCK_SNIPPETS)
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [langFilter, setLangFilter] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [aiTagging, setAiTagging] = useState(false)

  // New snippet form
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newLang, setNewLang] = useState('TypeScript')
  const [newCode, setNewCode] = useState('')
  const [newTags, setNewTags] = useState('')

  const filteredSnippets = useMemo(() => {
    let result = snippets
    if (activeTab === 'favorites') result = result.filter(s => s.isFavorite)
    if (activeTab === 'recent') result = [...result].sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 10)
    if (activeTab === 'frequent') result = [...result].sort((a, b) => b.usageCount - a.usageCount).slice(0, 10)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q)) ||
        s.aiTags.some(t => t.toLowerCase().includes(q))
      )
    }
    if (langFilter) result = result.filter(s => s.language === langFilter)
    if (tagFilter) result = result.filter(s => s.tags.includes(tagFilter) || s.aiTags.includes(tagFilter))
    return result
  }, [snippets, activeTab, searchQuery, langFilter, tagFilter])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    snippets.forEach(s => { s.tags.forEach(t => tags.add(t)); s.aiTags.forEach(t => tags.add(t)) })
    return Array.from(tags).sort()
  }, [snippets])

  const toggleFavorite = (id: string) => {
    setSnippets(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))
  }

  const deleteSnippet = (id: string) => {
    if (!confirm(ii.snDeleteConfirm)) return
    setSnippets(prev => prev.filter(s => s.id !== id))
    if (selectedSnippet?.id === id) setSelectedSnippet(null)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success(ii.snCopied)
  }

  const insertCode = (snippet: Snippet) => {
    setSnippets(prev => prev.map(s => s.id === snippet.id ? { ...s, usageCount: s.usageCount + 1, lastUsed: Date.now() } : s))
    useAppStore.getState().injectCode('snippet.tsx', snippet.code, snippet.language.toLowerCase())
    toast.success(ii.snInserted)
  }

  const handleAiTag = (snippet: Snippet) => {
    setAiTagging(true)
    setTimeout(() => {
      const possibleTags = AI_TAG_OPTIONS.filter(() => Math.random() > 0.6)
      if (possibleTags.length === 0) possibleTags.push('utility')
      setSnippets(prev => prev.map(s => s.id === snippet.id ? { ...s, aiTags: possibleTags } : s))
      setAiTagging(false)
      toast.success(ii.snAiTag)
    }, 1500)
  }

  const handleAddSnippet = () => {
    if (!newName || !newCode) return
    const snippet: Snippet = {
      id: 'sn-' + Date.now(),
      name: newName,
      description: newDesc,
      language: newLang,
      code: newCode,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      aiTags: [],
      isFavorite: false,
      usageCount: 0,
      lastUsed: Date.now(),
      createdAt: Date.now(),
    }
    setSnippets(prev => [snippet, ...prev])
    setShowAddForm(false)
    setNewName(''); setNewDesc(''); setNewCode(''); setNewTags('')
    toast.success(ii.snSaved)
  }

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return `${Math.floor(diff / 86400000)}d`
  }

  const TABS: { id: TabId; icon: React.FC<{ className?: string }>; label: string }[] = [
    { id: 'all', icon: Code, label: ii.snAll },
    { id: 'favorites', icon: Star, label: ii.snFavorites },
    { id: 'recent', icon: Clock, label: ii.snRecent },
    { id: 'frequent', icon: TrendingUp, label: ii.snFrequent },
  ]

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed inset-6 z-[61] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${t.border.subtle} flex-shrink-0`}>
          <div className="flex items-center space-x-2.5">
            <Code className={`w-5 h-5 ${t.accent.primary}`} />
            <div>
              <span className="text-[14px]" style={{ fontWeight: 600 }}>{ii.snTitle}</span>
              <span className={`ml-2 text-[11px] ${t.text.muted}`}>{ii.snSubtitle}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-3 py-1.5 rounded-lg text-[11px] flex items-center space-x-1.5 ${t.transition} ${t.accent.activeBg} ${t.accent.activeText}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{ii.snAdd}</span>
            </button>
            <button onClick={onClose} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar: Search + Tabs + List */}
          <div className={`w-80 border-r ${t.border.subtle} flex flex-col flex-shrink-0`}>
            {/* Search */}
            <div className={`p-3 border-b ${t.border.subtle}`}>
              <div className="relative">
                <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${t.text.dimmed}`} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={ii.snSearch}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-[12px] border ${t.border.subtle} bg-transparent ${t.text.primary} outline-none focus:ring-1 focus:ring-indigo-500/50`}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className={`flex border-b ${t.border.subtle}`}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-1 py-2 text-[10px] ${t.transition} border-b-2 ${
                    activeTab === tab.id ? `${t.accent.activeText} border-indigo-500` : `${t.text.muted} border-transparent hover:border-slate-400/30`
                  }`}
                  style={{ fontWeight: activeTab === tab.id ? 600 : 400 }}
                >
                  <tab.icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className={`flex items-center gap-1.5 p-2 border-b ${t.border.subtle} flex-wrap`}>
              {langFilter && (
                <button onClick={() => setLangFilter(null)} className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px]">
                  <span>{langFilter}</span><X className="w-2.5 h-2.5" />
                </button>
              )}
              {tagFilter && (
                <button onClick={() => setTagFilter(null)} className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
                  <span>{tagFilter}</span><X className="w-2.5 h-2.5" />
                </button>
              )}
              {!langFilter && !tagFilter && (
                <span className={`text-[10px] ${t.text.dimmed}`}>{filteredSnippets.length} {ii.snAll.toLowerCase()}</span>
              )}
            </div>

            {/* Snippet list */}
            <div className={`flex-1 overflow-y-auto p-2 space-y-1 ${t.scrollbar}`}>
              {filteredSnippets.length === 0 ? (
                <div className={`text-center py-8 text-[12px] ${t.text.muted}`}>{ii.snNoSnippets}</div>
              ) : filteredSnippets.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSnippet(s)}
                  className={`w-full text-left p-3 rounded-lg ${t.transition} ${
                    selectedSnippet?.id === s.id ? `${t.accent.activeBg} ${t.accent.activeText}` : t.interactive.menuItem
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] truncate" style={{ fontWeight: 500 }}>{s.name}</span>
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      {s.isFavorite && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${t.isDark ? 'bg-slate-700/60' : 'bg-slate-200/60'}`}>{s.language}</span>
                    </div>
                  </div>
                  <div className={`text-[10px] ${t.text.dimmed} truncate`}>{s.description}</div>
                  <div className="flex items-center space-x-3 mt-1.5">
                    <span className={`text-[9px] ${t.text.dimmed}`}>{ii.snUsageCount}: {s.usageCount}</span>
                    <span className={`text-[9px] ${t.text.dimmed}`}>{timeAgo(s.lastUsed)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {s.tags.map(tag => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">{tag}</span>
                    ))}
                    {s.aiTags.map(tag => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
                        <Sparkles className="w-2 h-2 inline mr-0.5" />{tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Detail / Add Form */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {showAddForm ? (
              /* Add snippet form */
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                <div className="text-[14px]" style={{ fontWeight: 600 }}>{ii.snAdd}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider ${t.text.muted} mb-1 block`} style={{ fontWeight: 600 }}>{ii.snName}</label>
                    <input value={newName} onChange={e => setNewName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-[12px] border ${t.border.subtle} bg-transparent ${t.text.primary} outline-none focus:ring-1 focus:ring-indigo-500/50`}
                    />
                  </div>
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider ${t.text.muted} mb-1 block`} style={{ fontWeight: 600 }}>{ii.snLanguage}</label>
                    <select value={newLang} onChange={e => setNewLang(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-[12px] border ${t.border.subtle} bg-transparent ${t.text.primary} outline-none`}
                    >
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`text-[10px] uppercase tracking-wider ${t.text.muted} mb-1 block`} style={{ fontWeight: 600 }}>{ii.snDescription}</label>
                  <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-[12px] border ${t.border.subtle} bg-transparent ${t.text.primary} outline-none focus:ring-1 focus:ring-indigo-500/50`}
                  />
                </div>
                <div>
                  <label className={`text-[10px] uppercase tracking-wider ${t.text.muted} mb-1 block`} style={{ fontWeight: 600 }}>{ii.snTags}</label>
                  <input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="tag1, tag2, tag3"
                    className={`w-full px-3 py-2 rounded-lg text-[12px] border ${t.border.subtle} bg-transparent ${t.text.primary} outline-none focus:ring-1 focus:ring-indigo-500/50`}
                  />
                </div>
                <div>
                  <label className={`text-[10px] uppercase tracking-wider ${t.text.muted} mb-1 block`} style={{ fontWeight: 600 }}>{ii.snCode}</label>
                  <textarea value={newCode} onChange={e => setNewCode(e.target.value)} rows={10}
                    className={`w-full px-3 py-2 rounded-lg text-[12px] border ${t.border.subtle} bg-transparent ${t.text.primary} outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono`}
                  />
                </div>
                <div className="flex space-x-2">
                  <button onClick={handleAddSnippet} className={`px-4 py-2 rounded-lg text-[12px] ${t.accent.activeBg} ${t.accent.activeText}`} style={{ fontWeight: 500 }}>
                    <Check className="w-3.5 h-3.5 inline mr-1.5" />{ii.snSaved}
                  </button>
                  <button onClick={() => setShowAddForm(false)} className={`px-4 py-2 rounded-lg text-[12px] ${t.interactive.iconBtn}`}>
                    {ii.msCancel}
                  </button>
                </div>
              </div>
            ) : selectedSnippet ? (
              /* Snippet detail view */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Snippet header */}
                <div className={`flex items-center justify-between px-5 py-3 border-b ${t.border.subtle}`}>
                  <div>
                    <div className="text-[14px]" style={{ fontWeight: 600 }}>{selectedSnippet.name}</div>
                    <div className={`text-[11px] ${t.text.muted}`}>{selectedSnippet.description}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleAiTag(selectedSnippet)} className={`px-2.5 py-1 rounded-lg text-[10px] flex items-center space-x-1 ${t.transition} ${t.interactive.iconBtn}`}>
                      <Sparkles className={`w-3 h-3 ${aiTagging ? 'animate-pulse text-purple-400' : ''}`} />
                      <span>{aiTagging ? ii.snAiTagging : ii.snAiTag}</span>
                    </button>
                    <button onClick={() => toggleFavorite(selectedSnippet.id)} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}>
                      <Heart className={`w-4 h-4 ${selectedSnippet.isFavorite ? 'fill-red-400 text-red-400' : ''}`} />
                    </button>
                    <button onClick={() => copyCode(selectedSnippet.code)} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} title={ii.snCopied}>
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => insertCode(selectedSnippet)} className={`px-3 py-1.5 rounded-lg text-[11px] flex items-center space-x-1 ${t.accent.activeBg} ${t.accent.activeText}`}>
                      <Code className="w-3.5 h-3.5" />
                      <span>{ii.snDragInsert}</span>
                    </button>
                    <button onClick={() => deleteSnippet(selectedSnippet.id)} className={`p-1.5 rounded-lg ${t.transition} hover:bg-red-500/15`}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Meta bar */}
                <div className={`flex items-center space-x-4 px-5 py-2 border-b ${t.border.subtle}`}>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${t.isDark ? 'bg-slate-700/60' : 'bg-slate-200/60'}`}>{selectedSnippet.language}</span>
                  <span className={`text-[10px] ${t.text.dimmed}`}>{ii.snUsageCount}: {selectedSnippet.usageCount}</span>
                  <span className={`text-[10px] ${t.text.dimmed}`}>{ii.snLastUsed}: {timeAgo(selectedSnippet.lastUsed)}</span>
                  <span className={`text-[10px] ${t.text.dimmed}`}>{ii.snCreated}: {timeAgo(selectedSnippet.createdAt)}</span>
                </div>

                {/* Tags */}
                <div className={`flex items-center flex-wrap gap-1.5 px-5 py-2 border-b ${t.border.subtle}`}>
                  {selectedSnippet.tags.map(tag => (
                    <button key={tag} onClick={() => setTagFilter(tag)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-colors">
                      <Tag className="w-2.5 h-2.5 inline mr-0.5" />{tag}
                    </button>
                  ))}
                  {selectedSnippet.aiTags.map(tag => (
                    <button key={tag} onClick={() => setTagFilter(tag)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-colors">
                      <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />{tag}
                    </button>
                  ))}
                </div>

                {/* Code */}
                <div className={`flex-1 overflow-auto p-5 ${t.scrollbar}`}>
                  <pre className={`p-4 rounded-xl text-[12px] leading-relaxed font-mono overflow-x-auto ${
                    t.isDark ? 'bg-slate-900/60 text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <code>{selectedSnippet.code}</code>
                  </pre>
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Code className={`w-12 h-12 mx-auto mb-3 ${t.text.dimmed}`} />
                  <div className={`text-[13px] ${t.text.muted}`}>{ii.snNoSnippets}</div>
                  <div className={`text-[11px] ${t.text.dimmed} mt-1`}>{ii.snDragInsert}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar: Tag cloud / Language filter */}
          <div className={`w-44 border-l ${t.border.subtle} flex flex-col flex-shrink-0`}>
            {/* Language filter */}
            <div className={`p-3 border-b ${t.border.subtle}`}>
              <div className={`text-[10px] uppercase tracking-wider mb-2 ${t.text.muted}`} style={{ fontWeight: 600 }}>{ii.snLanguage}</div>
              <div className="space-y-0.5">
                {LANGUAGES.filter(l => snippets.some(s => s.language === l)).map(l => {
                  const count = snippets.filter(s => s.language === l).length
                  return (
                    <button
                      key={l}
                      onClick={() => setLangFilter(langFilter === l ? null : l)}
                      className={`w-full flex items-center justify-between px-2 py-1 rounded text-[10px] ${t.transition} ${langFilter === l ? `${t.accent.activeBg} ${t.accent.activeText}` : t.interactive.menuItem}`}
                    >
                      <span>{l}</span>
                      <span className={t.text.dimmed}>{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tag cloud */}
            <div className={`flex-1 p-3 overflow-y-auto ${t.scrollbar}`}>
              <div className={`text-[10px] uppercase tracking-wider mb-2 ${t.text.muted}`} style={{ fontWeight: 600 }}>{ii.snTags}</div>
              <div className="flex flex-wrap gap-1">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                    className={`text-[9px] px-2 py-0.5 rounded-full ${t.transition} ${
                      tagFilter === tag
                        ? 'bg-indigo-500/30 text-indigo-300'
                        : `${t.isDark ? 'bg-slate-700/40 text-slate-400' : 'bg-slate-200/60 text-slate-500'} hover:bg-indigo-500/15`
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
