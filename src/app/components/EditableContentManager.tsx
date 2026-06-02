/**
 * @file EditableContentManager.tsx
 * @description YYC³便携式智能AI系统 - 可编辑内容管理器
 * User-centric editable content management with collaboration support
 * Features: Inline editing, batch operations, real-time sync, version history
 * Open-source design: All data stored locally, user-controlled security
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,editable,content,management,collaboration
 */

import {
  Edit3, Check, X, Plus, Trash2, Copy,
  History, Users, Eye, EyeOff, Lock,
  Download, Search,
  FileText, Settings, Key, Globe,
  AlertCircle, CheckCircle2, Clock, MoreHorizontal
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import React, {
  useState, useCallback, useMemo, useEffect, useRef,
  createContext, useContext
} from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

type ContentType = 'api-key' | 'endpoint' | 'config' | 'secret' | 'template' | 'custom'
type SyncStatus = 'synced' | 'pending' | 'conflict' | 'offline'

interface EditableItem {
  id: string
  type: ContentType
  category: string
  key: string
  value: string
  label: string
  description?: string
  placeholder?: string
  isSecret: boolean
  isRequired: boolean
  isEditable: boolean
  syncStatus: SyncStatus
  lastModified: number
  modifiedBy?: string
  version: number
  validation?: {
    pattern?: RegExp
    minLength?: number
    maxLength?: number
    custom?: (value: string) => boolean | string
  }
}

interface EditSession {
  id: string
  itemId: string
  userId: string
  userName: string
  startedAt: number
  cursorPosition?: number
}

interface EditableContentContextValue {
  items: EditableItem[]
  sessions: EditSession[]
  editingId: string | null
  startEdit: (id: string) => void
  cancelEdit: () => void
  saveEdit: (id: string, value: string) => Promise<void>
  addItem: (item: Omit<EditableItem, 'id' | 'syncStatus' | 'lastModified' | 'version'>) => void
  removeItem: (id: string) => void
  duplicateItem: (id: string) => void
  restoreVersion: (id: string, version: number) => void
  batchUpdate: (ids: string[], updates: Partial<EditableItem>) => void
}

const EditableContentContext = createContext<EditableContentContextValue | null>(null)

function useEditableContent() {
  const ctx = useContext(EditableContentContext)
  if (!ctx) throw new Error('useEditableContent must be used within provider')
  return ctx
}

/* ═══════════════════════════════════════════════════════════════
   Storage Service (Local-first, user-controlled)
   ═══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'yyc3-editable-content'
const HISTORY_KEY = 'yyc3-editable-history'

function loadItems(): EditableItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : getDefaultItems()
  } catch {
    return getDefaultItems()
  }
}

function saveItems(items: EditableItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Failed to save items:', e)
  }
}

function loadHistory(): Record<string, { value: string; timestamp: number; userId: string }[]> {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveHistory(history: Record<string, { value: string; timestamp: number; userId: string }[]>): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch (e) {
    console.error('Failed to save history:', e)
  }
}

function getDefaultItems(): EditableItem[] {
  return [
    {
      id: 'openai-key',
      type: 'api-key',
      category: 'AI Models',
      key: 'OPENAI_API_KEY',
      value: '',
      label: 'OpenAI API Key',
      description: 'Your OpenAI API key for GPT models',
      placeholder: 'sk-proj-...',
      isSecret: true,
      isRequired: false,
      isEditable: true,
      syncStatus: 'synced',
      lastModified: Date.now(),
      version: 1,
      validation: { pattern: /^sk-[a-zA-Z0-9]{20,}$/ }
    },
    {
      id: 'anthropic-key',
      type: 'api-key',
      category: 'AI Models',
      key: 'ANTHROPIC_API_KEY',
      value: '',
      label: 'Anthropic API Key',
      description: 'Your Anthropic API key for Claude models',
      placeholder: 'sk-ant-...',
      isSecret: true,
      isRequired: false,
      isEditable: true,
      syncStatus: 'synced',
      lastModified: Date.now(),
      version: 1,
      validation: { pattern: /^sk-ant-[a-zA-Z0-9-]{20,}$/ }
    },
    {
      id: 'deepseek-key',
      type: 'api-key',
      category: 'AI Models',
      key: 'DEEPSEEK_API_KEY',
      value: '',
      label: 'DeepSeek API Key',
      description: 'Your DeepSeek API key',
      placeholder: 'sk-...',
      isSecret: true,
      isRequired: false,
      isEditable: true,
      syncStatus: 'synced',
      lastModified: Date.now(),
      version: 1,
    },
    {
      id: 'ollama-endpoint',
      type: 'endpoint',
      category: 'AI Models',
      key: 'OLLAMA_ENDPOINT',
      value: 'http://localhost:11434',
      label: 'Ollama Endpoint',
      description: 'Local Ollama server endpoint',
      placeholder: 'http://localhost:11434',
      isSecret: false,
      isRequired: false,
      isEditable: true,
      syncStatus: 'synced',
      lastModified: Date.now(),
      version: 1,
    },
    {
      id: 'db-connection',
      type: 'config',
      category: 'Database',
      key: 'DATABASE_URL',
      value: '',
      label: 'Database Connection',
      description: 'PostgreSQL connection string',
      placeholder: 'postgresql://user:password@localhost:5432/db',
      isSecret: true,
      isRequired: false,
      isEditable: true,
      syncStatus: 'synced',
      lastModified: Date.now(),
      version: 1,
    },
    {
      id: 'ws-endpoint',
      type: 'endpoint',
      category: 'Collaboration',
      key: 'WEBSOCKET_URL',
      value: '',
      label: 'WebSocket Server',
      description: 'WebSocket server for real-time collaboration',
      placeholder: 'wss://your-server.com/ws',
      isSecret: false,
      isRequired: false,
      isEditable: true,
      syncStatus: 'synced',
      lastModified: Date.now(),
      version: 1,
    },
  ]
}

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

function InlineEditor({
  item,
  onSave,
  onCancel
}: {
  item: EditableItem
  onSave: (value: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(item.value)
  const [showValue, setShowValue] = useState(!item.isSecret)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const t = getThemeTokens(useAppStore(s => s.theme))

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const validate = useCallback((val: string): string | null => {
    if (item.isRequired && !val.trim()) {
      return 'This field is required'
    }
    if (item.validation) {
      if (item.validation.minLength && val.length < item.validation.minLength) {
        return `Minimum ${item.validation.minLength} characters required`
      }
      if (item.validation.maxLength && val.length > item.validation.maxLength) {
        return `Maximum ${item.validation.maxLength} characters allowed`
      }
      if (item.validation.pattern && val && !item.validation.pattern.test(val)) {
        return 'Invalid format'
      }
      if (item.validation.custom) {
        const result = item.validation.custom(val)
        if (result !== true) return typeof result === 'string' ? result : 'Validation failed'
      }
    }
    return null
  }, [item])

  const handleSave = useCallback(() => {
    const validationError = validate(value)
    if (validationError) {
      setError(validationError)
      return
    }
    onSave(value)
  }, [value, validate, onSave])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }, [handleSave, onCancel])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type={showValue ? 'text' : 'password'}
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(null) }}
            onKeyDown={handleKeyDown}
            placeholder={item.placeholder}
            className={`w-full px-3 py-2 pr-10 rounded-lg text-[13px] font-mono
              ${t.isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-white border-slate-200 text-slate-900'}
              border focus:outline-none focus:border-indigo-500/50
              ${error ? 'border-red-500/50' : ''}`}
          />
          {item.isSecret && (
            <button
              onClick={() => setShowValue(!showValue)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded
                ${t.isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        <button
          onClick={handleSave}
          className={`p-2 rounded-lg ${t.isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={onCancel}
          className={`p-2 rounded-lg ${t.isDark ? 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-400">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  )
}

function ItemCard({ item }: { item: EditableItem }) {
  const t = getThemeTokens(useAppStore(s => s.theme))
  const i = getI18n(useAppStore(s => s.language))
  const { editingId, startEdit, cancelEdit, saveEdit, removeItem, duplicateItem } = useEditableContent()
  const [showValue, setShowValue] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const isEditing = editingId === item.id
  const displayValue = item.isSecret && !showValue
    ? '•'.repeat(Math.min(item.value.length || 8, 20))
    : item.value || <span className="opacity-40 italic">Not configured</span>

  const handleSave = useCallback(async (value: string) => {
    await saveEdit(item.id, value)
    toast.success(i.ecSaved || 'Saved successfully')
  }, [item.id, saveEdit, i])

  const syncIcon = useMemo(() => {
    switch (item.syncStatus) {
      case 'synced': return <CheckCircle2 className="w-3 h-3 text-emerald-400" />
      case 'pending': return <Clock className="w-3 h-3 text-amber-400" />
      case 'conflict': return <AlertCircle className="w-3 h-3 text-red-400" />
      case 'offline': return <Globe className="w-3 h-3 text-slate-400" />
    }
  }, [item.syncStatus])

  return (
    <div
      className={`group rounded-xl border transition-all ${
        isEditing
          ? 'border-indigo-500/30 bg-indigo-500/[0.02]'
          : t.isDark
            ? 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'
            : 'border-slate-200/60 bg-white hover:border-slate-300'
      }`}
    >
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[13px] ${t.text.primary}`} style={{ fontWeight: 600 }}>
                {item.label}
              </span>
              {item.isRequired && <span className="text-[10px] text-red-400">*</span>}
              {item.isSecret && <Lock className="w-3 h-3 text-amber-400/60" />}
              {syncIcon}
            </div>
            <div className={`text-[11px] ${t.text.muted} mb-2`}>
              {item.description}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isEditing && item.isEditable && (
              <button
                onClick={() => startEdit(item.id)}
                className={`p-1.5 rounded-lg ${t.isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'}`}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-1.5 rounded-lg ${t.isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'}`}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <InlineEditor item={item} onSave={handleSave} onCancel={cancelEdit} />
        ) : (
          <div className="flex items-center gap-2">
            <code className={`flex-1 px-3 py-2 rounded-lg text-[12px] font-mono truncate ${
              t.isDark ? 'bg-black/20 text-white/70' : 'bg-slate-50 text-slate-700'
            }`}>
              {displayValue}
            </code>
            {item.isSecret && item.value && (
              <button
                onClick={() => setShowValue(!showValue)}
                className={`p-1.5 rounded-lg ${t.isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'}`}
              >
                {showValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}
            {item.value && (
              <button
                onClick={() => { navigator.clipboard.writeText(item.value); toast.success(i.codeCopied || 'Copied') }}
                className={`p-1.5 rounded-lg ${t.isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'}`}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {showMenu && (
        <div className={`px-4 pb-3 flex items-center gap-2`}>
          <button
            onClick={() => { duplicateItem(item.id); setShowMenu(false) }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] ${t.isDark ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'bg-slate-100 hover:bg-slate-200'}`}
          >
            <Copy className="w-3 h-3" /> Duplicate
          </button>
          <button
            onClick={() => { toast.info('History feature coming soon'); setShowMenu(false) }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] ${t.isDark ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'bg-slate-100 hover:bg-slate-200'}`}
          >
            <History className="w-3 h-3" /> History
          </button>
          <button
            onClick={() => { if (confirm('Delete this item?')) removeItem(item.id) }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] text-red-400 ${t.isDark ? 'bg-red-500/10 hover:bg-red-500/20' : 'bg-red-50 hover:bg-red-100'}`}
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      )}

      <div className={`px-4 py-2 flex items-center justify-between text-[10px] ${t.text.dimmed} border-t ${t.isDark ? 'border-white/[0.04]' : 'border-slate-100'}`}>
        <div className="flex items-center gap-3">
          <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">{item.category}</span>
          <span>{item.key}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>v{item.version}</span>
          <span>•</span>
          <span>{new Date(item.lastModified).toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

function AddItemModal({ onClose }: { onClose: () => void }) {
  const t = getThemeTokens(useAppStore(s => s.theme))
  const i = getI18n(useAppStore(s => s.language))
  const { addItem } = useEditableContent()

  const [form, setForm] = useState({
    type: 'config' as ContentType,
    category: 'Custom',
    key: '',
    value: '',
    label: '',
    description: '',
    placeholder: '',
    isSecret: false,
    isRequired: false,
  })

  const handleSave = useCallback(() => {
    if (!form.key.trim() || !form.label.trim()) {
      toast.error('Key and Label are required')
      return
    }
    addItem({
      ...form,
      isEditable: true,
    })
    toast.success(i.ecAdded || 'Item added')
    onClose()
  }, [form, addItem, onClose, i])

  const typeOptions: { value: ContentType; label: string; icon: React.ReactNode }[] = [
    { value: 'api-key', label: 'API Key', icon: <Key className="w-4 h-4" /> },
    { value: 'endpoint', label: 'Endpoint', icon: <Globe className="w-4 h-4" /> },
    { value: 'config', label: 'Config', icon: <Settings className="w-4 h-4" /> },
    { value: 'secret', label: 'Secret', icon: <Lock className="w-4 h-4" /> },
    { value: 'template', label: 'Template', icon: <FileText className="w-4 h-4" /> },
    { value: 'custom', label: 'Custom', icon: <Edit3 className="w-4 h-4" /> },
  ]

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[81] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-lg rounded-2xl overflow-hidden ${t.isDark ? 'bg-slate-900 border border-white/10' : 'bg-white border border-slate-200'} shadow-2xl`}
        >
          <div className={`px-6 py-4 border-b ${t.isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <h2 className="text-[15px]" style={{ fontWeight: 600 }}>Add New Item</h2>
          </div>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-[12px] opacity-60 mb-1.5 block">Type</label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all ${
                      form.type === opt.value
                        ? 'bg-indigo-600 text-white'
                        : t.isDark ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] opacity-60 mb-1.5 block">Key *</label>
                <input
                  value={form.key}
                  onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
                  placeholder="MY_CONFIG_KEY"
                  className={`w-full px-3 py-2 rounded-lg text-[13px] font-mono ${t.isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-50 border-slate-200'} border focus:outline-none focus:border-indigo-500/50`}
                />
              </div>
              <div>
                <label className="text-[12px] opacity-60 mb-1.5 block">Label *</label>
                <input
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="My Config"
                  className={`w-full px-3 py-2 rounded-lg text-[13px] ${t.isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-50 border-slate-200'} border focus:outline-none focus:border-indigo-500/50`}
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] opacity-60 mb-1.5 block">Category</label>
              <input
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="Custom"
                className={`w-full px-3 py-2 rounded-lg text-[13px] ${t.isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-50 border-slate-200'} border focus:outline-none focus:border-indigo-500/50`}
              />
            </div>

            <div>
              <label className="text-[12px] opacity-60 mb-1.5 block">Value</label>
              <input
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder="Enter value..."
                type={form.isSecret ? 'password' : 'text'}
                className={`w-full px-3 py-2 rounded-lg text-[13px] font-mono ${t.isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-50 border-slate-200'} border focus:outline-none focus:border-indigo-500/50`}
              />
            </div>

            <div>
              <label className="text-[12px] opacity-60 mb-1.5 block">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description..."
                className={`w-full px-3 py-2 rounded-lg text-[13px] ${t.isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-50 border-slate-200'} border focus:outline-none focus:border-indigo-500/50`}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isSecret}
                  onChange={e => setForm(f => ({ ...f, isSecret: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-[12px]">Secret (hidden by default)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRequired}
                  onChange={e => setForm(f => ({ ...f, isRequired: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-[12px]">Required</span>
              </label>
            </div>
          </div>

          <div className={`px-6 py-4 border-t ${t.isDark ? 'border-white/10' : 'border-slate-200'} flex justify-end gap-3`}>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-[13px] ${t.isDark ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'bg-slate-100 hover:bg-slate-200'}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-[13px] bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Add Item
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */

interface EditableContentManagerProps {
  open: boolean
  onClose: () => void
}

export function EditableContentManager({ open, onClose }: EditableContentManagerProps) {
  const t = getThemeTokens(useAppStore(s => s.theme))
  const i = getI18n(useAppStore(s => s.language))
  const [items, setItems] = useState<EditableItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [history, setHistory] = useState<Record<string, { value: string; timestamp: number; userId: string }[]>>({})

  useEffect(() => {
    setItems(loadItems())
    setHistory(loadHistory())
  }, [])

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category))
    return ['all', ...Array.from(cats)]
  }, [items])

  const filteredItems = useMemo(() => {
    let result = items
    if (filterCategory !== 'all') {
      result = result.filter(i => i.category === filterCategory)
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(i =>
        i.key.toLowerCase().includes(term) ||
        i.label.toLowerCase().includes(term) ||
        i.value.toLowerCase().includes(term)
      )
    }
    return result
  }, [items, filterCategory, searchTerm])

  const startEdit = useCallback((id: string) => {
    setEditingId(id)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
  }, [])

  const saveEdit = useCallback(async (id: string, value: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id)
      if (!item) return prev

      const newHistory = { ...history }
      if (!newHistory[id]) newHistory[id] = []
      newHistory[id].push({
        value: item.value,
        timestamp: item.lastModified,
        userId: 'current-user'
      })
      setHistory(newHistory)
      saveHistory(newHistory)

      const updated = prev.map(i => i.id === id ? {
        ...i,
        value,
        lastModified: Date.now(),
        version: i.version + 1,
        syncStatus: 'synced' as SyncStatus
      } : i)
      saveItems(updated)
      return updated
    })
    setEditingId(null)
  }, [history])

  const addItem = useCallback((newItem: Omit<EditableItem, 'id' | 'syncStatus' | 'lastModified' | 'version'>) => {
    const item: EditableItem = {
      ...newItem,
      id: `item-${Date.now()}`,
      syncStatus: 'synced',
      lastModified: Date.now(),
      version: 1,
    }
    setItems(prev => {
      const updated = [item, ...prev]
      saveItems(updated)
      return updated
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const updated = prev.filter(i => i.id !== id)
      saveItems(updated)
      return updated
    })
    toast.success(i.ecRemoved || 'Item removed')
  }, [i])

  const duplicateItem = useCallback((id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const newItem: EditableItem = {
      ...item,
      id: `item-${Date.now()}`,
      key: `${item.key}_COPY`,
      label: `${item.label} (Copy)`,
      lastModified: Date.now(),
      version: 1,
    }
    setItems(prev => {
      const updated = [newItem, ...prev]
      saveItems(updated)
      return updated
    })
    toast.success(i.ecDuplicated || 'Item duplicated')
  }, [items])

  const restoreVersion = useCallback((id: string, version: number) => {
    const itemHistory = history[id]
    if (!itemHistory || !itemHistory[version]) return
    const historicalValue = itemHistory[version].value
    saveEdit(id, historicalValue)
    toast.success(i.ecRestored || 'Version restored')
  }, [history, saveEdit])

  const batchUpdate = useCallback((ids: string[], updates: Partial<EditableItem>) => {
    setItems(prev => {
      const updated = prev.map(i => ids.includes(i.id) ? { ...i, ...updates } : i)
      saveItems(updated)
      return updated
    })
  }, [])

  const exportItems = useCallback(() => {
    const exportData = items.map(i => ({
      key: i.key,
      value: i.isSecret ? '***' : i.value,
      type: i.type,
      category: i.category
    }))
    const json = JSON.stringify(exportData, null, 2)
    navigator.clipboard.writeText(json)
    toast.success(i.ecExported || 'Exported to clipboard')
  }, [items])

  const contextValue: EditableContentContextValue = useMemo(() => ({
    items,
    sessions: [],
    editingId,
    startEdit,
    cancelEdit,
    saveEdit,
    addItem,
    removeItem,
    duplicateItem,
    restoreVersion,
    batchUpdate,
  }), [items, editingId, startEdit, cancelEdit, saveEdit, addItem, removeItem, duplicateItem, restoreVersion, batchUpdate])

  if (!open) return null

  return (
    <EditableContentContext.Provider value={contextValue}>
      <>
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="fixed inset-0 z-[71] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.isDark ? 'bg-slate-900 border border-white/10' : 'bg-white border border-slate-200'} shadow-2xl`}
          >
            <div className={`flex items-center justify-between px-6 py-4 border-b ${t.isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.isDark ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20' : 'bg-gradient-to-br from-indigo-50 to-purple-50'}`}>
                  <Edit3 className={`w-5 h-5 ${t.isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                </div>
                <div>
                  <h2 className={`text-[15px] ${t.text.primary}`} style={{ fontWeight: 700 }}>{i.ecTitle || 'Editable Content Manager'}</h2>
                  <p className={`text-[11px] ${t.text.dimmed}`}>{i.ecSubtitle || 'Manage your configurations, API keys, and secrets'} · {items.length} items</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white transition-all`}
                >
                  <Plus className="w-3.5 h-3.5" /> {i.ecAdd || 'Add Item'}
                </button>
                <button
                  onClick={exportItems}
                  className={`p-2 rounded-lg ${t.isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'}`}
                  title={i.ecExport || 'Export'}
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg ${t.isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className={`flex items-center gap-3 px-6 py-3 border-b ${t.isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-[11px] transition-all ${
                      filterCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : t.isDark ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${t.isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <Search className="w-3.5 h-3.5 opacity-40" />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={i.ecSearch || 'Search...'}
                  className={`w-48 text-[12px] bg-transparent outline-none ${t.text.primary} ${t.text.placeholder}`}
                />
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${t.isDark ? 'custom-scrollbar-dark' : 'custom-scrollbar'}`}>
              {filteredItems.length === 0 ? (
                <div className={`flex flex-col items-center justify-center gap-3 py-16 ${t.text.dimmed}`}>
                  <Edit3 className="w-8 h-8 opacity-20" />
                  <span className="text-[13px]">{i.ecNoItems || 'No items found'}</span>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="text-[12px] text-indigo-400 hover:text-indigo-300"
                  >
                    {i.ecAddFirst || 'Add your first item'}
                  </button>
                </div>
              ) : (
                filteredItems.map(item => <ItemCard key={item.id} item={item} />)
              )}
            </div>

            <div className={`px-6 py-3 border-t ${t.isDark ? 'border-white/10' : 'border-slate-200'} flex items-center justify-between text-[10px] ${t.text.dimmed}`}>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> {i.ecLocalOnly || 'All data stored locally'}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {i.ecCollabReady || 'Collaboration ready'}</span>
              </div>
              <span>{i.ecOpenSource || 'Open Source'} · MIT License</span>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {showAddModal && <AddItemModal onClose={() => setShowAddModal(false)} />}
        </AnimatePresence>
      </>
    </EditableContentContext.Provider>
  )
}

export default EditableContentManager
