/**
 * @file CodeEditor.tsx
 * @description YYC³便携式智能AI系统 - Monaco编辑器集成
 * Monaco Editor Integration
 * Features: IntelliSense, multi-cursor, TypeScript, yjs collaboration cursors,
 * AI code injection diff view with accept/reject, theme-driven styling.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,editor,monaco,code
 */

import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react'
import {
  AlertCircle, AlertTriangle, Info, Copy, Check,
  GitCompare, X, CheckCheck, XCircle, Sparkles, Shield, MessageSquare, Bot
} from 'lucide-react'
import type { editor as MonacoEditor } from 'monaco-editor'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Y from 'yjs'

import { initializeMonaco, loadLanguageOnDemand } from '../../utils/monaco-config'
import { useTaskStore } from '../services/task-store'
import { useAppStore } from '../store'
import { registerAICompletionProvider } from '../utils/ai-completion'
import { collabManager } from '../utils/collaboration'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'


import { AiRefactorPanel } from './AiRefactorPanel'
import { BreadcrumbNav } from './BreadcrumbNav'
import { CodeReviewPanel } from './CodeReviewPanel'
import { CollabCursors } from './CollabCursors'
import { CollabStatusBar } from './CollabStatusBar'
import { ErrorDiagnostics } from './ErrorDiagnostics'
import { FileTabs } from './FileTabs'
import { InlineAIChat } from './InlineAIChat'
import { SystemReport } from './SystemReport'


// ── Mock file contents ──
const FILE_CONTENTS: Record<string, string> = {
  'ChatInterface.tsx': `/**
 * @file ChatInterface.tsx
 * @description YYC3 PortAISys - Left Panel AI Chat Interface
 * @author YYC3 Team
 * @version 1.0.0
 */

import { useAppStore } from '../store'
import type { Message } from '../types'
import { Send, Bot, User, Code, Sparkles } from 'lucide-react'

/** AI model options available for selection */
const AI_MODELS = ['YYC3-Pro', 'GPT-4o', 'Claude-3.5']

interface ChatInputProps {
  /** Callback when user sends a message */
  onSend: (text: string) => void
  /** Whether AI is currently streaming a response */
  isStreaming: boolean
  /** Placeholder text for input */
  placeholder?: string
}

/**
 * ChatInterface component - Main AI interaction panel
 * Supports slash commands, markdown rendering, and streaming responses
 */
export function ChatInterface() {
  const { theme, messages, addMessage } = useAppStore()
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  /**
   * Handle sending a message
   * Supports slash commands: /code, /arch, /help
   */
  const handleSend = () => {
    if (!input.trim()) return

    // Check for slash commands
    if (input.startsWith('/')) {
      processSlashCommand(input)
      return
    }

    addMessage({ role: 'user', content: input })
    setInput('')
    simulateAIResponse(input)
  }

  const processSlashCommand = (cmd: string) => {
    const command = cmd.split(' ')[0]
    switch (command) {
      case '/code':
        addMessage({ role: 'system', content: 'Generating code...' })
        break
      case '/arch':
        addMessage({ role: 'system', content: 'Loading architecture...' })
        break
      default:
        addMessage({ role: 'system', content: \`Unknown: \${command}\` })
    }
    setInput('')
  }

  const simulateAIResponse = async (userInput: string) => {
    // Simulate streaming response
    await new Promise(r => setTimeout(r, 500))
    addMessage({
      role: 'ai',
      content: \`Based on your request: "\${userInput}"\\n\\nHere is my analysis...\`
    })
  }

  return (
    <div className="flex flex-col h-full backdrop-blur-xl">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg: Message) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
      {/* Input area */}
      <div className="border-t p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Ask AI anything..."
          className="w-full resize-none rounded-lg p-2"
          rows={3}
        />
      </div>
    </div>
  )
}`,
  'App.tsx': `import React, { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { router } from './routes'
import { useAppStore } from './store'

export default function App() {
  const { theme } = useAppStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return <RouterProvider router={router} />
}`,
  'store.ts': `/**
 * @file store.ts
 * @description Global state management using Zustand with persist middleware
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Message, DesignRoot, PanelSpec } from './types'

export type ViewMode = 'code' | 'preview' | 'fullscreen'

/** Project metadata for recent projects list */
export interface ProjectMeta {
  id: string
  name: string
  description: string
  updatedAt: number
  status: 'active' | 'archived' | 'draft'
  color: string
}

interface AppState {
  theme: 'light' | 'dark'
  viewMode: ViewMode
  selectedFile: string | null
  messages: Message[]
  designRoot: DesignRoot
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setViewMode: (mode: ViewMode) => void
  setSelectedFile: (file: string | null) => void
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void
  updatePanel: (id: string, updates: Partial<PanelSpec>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      viewMode: 'code',
      selectedFile: 'ChatInterface.tsx',
      messages: [],
      designRoot: initialDesignRoot,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setViewMode: (mode) => set({ viewMode: mode }),
      setSelectedFile: (file) => set({ selectedFile: file }),
      addMessage: (msg) => set((s) => ({
        messages: [...s.messages, { ...msg, id: crypto.randomUUID(), timestamp: Date.now() }]
      })),
      updatePanel: (id, updates) => set((s) => ({
        designRoot: {
          ...s.designRoot,
          panels: s.designRoot.panels.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        },
      })),
    }),
    { name: 'yyc3-storage' }
  )
)`,
  'types.ts': `/**
 * @file types.ts
 * @description Core type definitions for YYC3 PortAISys
 */

export interface DesignRoot {
  version: string
  theme: 'light' | 'dark'
  tokens: string
  panels: PanelSpec[]
  components: ComponentSpec[]
  styles: StyleSpec
}

export interface PanelSpec {
  id: string
  type: 'container' | 'content' | 'preview'
  layout: {
    x: number; y: number; w: number; h: number
    minW?: number; maxW?: number
  }
  style: PanelStyle
}

export type MessageRole = 'user' | 'ai' | 'system'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: number
}

export type ComponentType =
  | 'Button' | 'Input' | 'Text' | 'Image'
  | 'Container' | 'List' | 'Card' | 'Modal'`,
  'routes.ts': `import { createBrowserRouter } from 'react-router'
import { HomePage } from './components/HomePage'
import { IDELayout } from './components/IDELayout'

export const router = createBrowserRouter([
  { path: '/', Component: HomePage },
  { path: '/ide', Component: IDELayout },
])`,
}

// ── File → language mapping ──
function getLanguage(filename: string): string {
  if (filename.endsWith('.tsx')) return 'typescript'
  if (filename.endsWith('.ts')) return 'typescript'
  if (filename.endsWith('.jsx')) return 'javascript'
  if (filename.endsWith('.js')) return 'javascript'
  if (filename.endsWith('.css')) return 'css'
  if (filename.endsWith('.json')) return 'json'
  if (filename.endsWith('.md')) return 'markdown'
  return 'typescript'
}

// ── Diagnostic mock ──
interface DiagItem {
  line: number
  type: 'error' | 'warning' | 'info'
  message: string
  col?: number
  endCol?: number
}

const FILE_DIAGNOSTICS: Record<string, DiagItem[]> = {
  'ChatInterface.tsx': [
    { line: 33, type: 'warning', message: "Variable 'scrollRef' is declared but its value is never read in this scope.", col: 7, endCol: 16 },
    { line: 68, type: 'info', message: "Consider using optional chaining: cmd?.split(' ')", col: 5, endCol: 20 },
  ],
  'store.ts': [
    { line: 35, type: 'error', message: "Cannot find name 'initialDesignRoot'.", col: 23, endCol: 39 },
  ],
}

// ══════════════════════════════════════════
// ── CodeEditor Component ──
// ══════════════════════════════════════════
export function CodeEditor() {
  const {
    theme, selectedFile, collaborators,
    pendingCodeInjection, clearCodeInjection, setSelectedFile,
  } = useAppStore()
  const t = getThemeTokens(theme)
  const { language: lang } = useAppStore()
  const i = getI18n(lang)

  const [activeView, setActiveView] = useState<'code' | 'diff' | 'report'>('code')
  const [copied, setCopied] = useState(false)
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [injectionToast, setInjectionToast] = useState<string | null>(null)
  const [sidePanel, setSidePanel] = useState<'none' | 'refactor' | 'diagnostics' | 'review'>('none')
  const [inlineChatVisible, setInlineChatVisible] = useState(false)
  const [inlineChatLine, setInlineChatLine] = useState(1)

  // Define currentFile first before using it
  const currentFile = selectedFile || 'ChatInterface.tsx'
  const fileContent = FILE_CONTENTS[currentFile] || `// ${currentFile}\n// File content not available`
  const language = getLanguage(currentFile)
  const diagnostics = FILE_DIAGNOSTICS[currentFile] || []

  // Get tasks related to current file
  const { tasks } = useTaskStore.getState()
  const relatedTasks = tasks.filter(t =>
    t.relatedFiles?.includes(currentFile) &&
    t.status !== 'done' &&
    !t.isArchived
  )

  // Diff state
  const [diffOriginal, setDiffOriginal] = useState('')
  const [diffModified, setDiffModified] = useState('')
  const [diffFilename, setDiffFilename] = useState('')

  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<any>(null)
  const decorationsRef = useRef<string[]>([])
  const aiCompletionRef = useRef<ReturnType<typeof registerAICompletionProvider> | null>(null)
  /** Tracks whether model changes originated from Yjs sync (prevents echo loops) */
  const isYjsSyncRef = useRef(false)
  /** Yjs text instance for current file */
  const yTextRef = useRef<Y.Text | null>(null)
  /** Monaco初始化状态 */
  const [monacoInitialized, setMonacoInitialized] = useState(false)

  const diagCounts = useMemo(() => ({
    errors: diagnostics.filter(d => d.type === 'error').length,
    warnings: diagnostics.filter(d => d.type === 'warning').length,
    infos: diagnostics.filter(d => d.type === 'info').length,
  }), [diagnostics])

  // ── Collaborator cursors on current file ──
  const activeCollabCursors = useMemo(() => {
    return collaborators.filter(c => c.online && c.cursor && c.cursor.file === currentFile)
  }, [collaborators, currentFile])

  // ── Initialize Monaco with lazy loading ──
  useEffect(() => {
    if (!monacoInitialized) {
      initializeMonaco(true)
        .then(() => {
          console.log('[CodeEditor] Monaco initialized successfully')
          setMonacoInitialized(true)
        })
        .catch(err => {
          console.error('[CodeEditor] Failed to initialize Monaco:', err)
        })
    }
  }, [monacoInitialized])

  // ── Load language on demand when file changes ──
  useEffect(() => {
    if (monacoInitialized) {
      loadLanguageOnDemand(language)
        .then(() => {
          console.log(`[CodeEditor] Language loaded: ${language}`)
        })
        .catch(err => {
          console.error(`[CodeEditor] Failed to load language ${language}:`, err)
        })
    }
  }, [language, monacoInitialized])

  // ── Monaco theme definition ──
  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    monacoRef.current = monaco

    // Define YYC3 dark theme
    monaco.editor.defineTheme('yyc3-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c586c0' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'function', foreground: 'dcdcaa' },
        { token: 'variable', foreground: '9cdcfe' },
        { token: 'tag', foreground: '569cd6' },
      ],
      colors: {
        'editor.background': '#0c1222',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#ffffff08',
        'editor.selectionBackground': '#6366f140',
        'editor.inactiveSelectionBackground': '#6366f120',
        'editorCursor.foreground': '#818cf8',
        'editorLineNumber.foreground': '#374151',
        'editorLineNumber.activeForeground': '#9ca3af',
        'editorGutter.background': '#0c1222',
        'editor.selectionHighlightBackground': '#6366f115',
        'editorBracketMatch.background': '#6366f125',
        'editorBracketMatch.border': '#6366f140',
        'editorWidget.background': '#111827',
        'editorWidget.border': '#ffffff15',
        'editorSuggestWidget.background': '#111827',
        'editorSuggestWidget.border': '#ffffff10',
        'editorSuggestWidget.selectedBackground': '#6366f130',
        'editorHoverWidget.background': '#111827',
        'editorHoverWidget.border': '#ffffff15',
        'minimap.background': '#0c1222',
        'scrollbarSlider.background': '#ffffff10',
        'scrollbarSlider.hoverBackground': '#ffffff20',
        'scrollbarSlider.activeBackground': '#ffffff30',
      },
    })

    // Define YYC3 light theme
    monaco.editor.defineTheme('yyc3-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'af00db' },
        { token: 'string', foreground: 'a31515' },
        { token: 'number', foreground: '098658' },
        { token: 'type', foreground: '267f99' },
        { token: 'function', foreground: '795e26' },
        { token: 'variable', foreground: '001080' },
      ],
      colors: {
        'editor.background': '#f8fafc',
        'editor.foreground': '#1e293b',
        'editor.lineHighlightBackground': '#f1f5f9',
        'editor.selectionBackground': '#6366f130',
        'editorCursor.foreground': '#6366f1',
        'editorLineNumber.foreground': '#cbd5e1',
        'editorLineNumber.activeForeground': '#64748b',
        'editorGutter.background': '#f8fafc',
        'minimap.background': '#f8fafc',
      },
    })
  }, [])

  // ── Monaco editor mount ──
  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column })
      // Update yjs local cursor
      collabManager.updateLocalCursor(currentFile, e.position.lineNumber, e.position.column)
    })

    // Set diagnostics as markers
    setEditorMarkers(monaco, currentFile, diagnostics)

    // Register AI inline completion provider
    if (!aiCompletionRef.current) {
      aiCompletionRef.current = registerAICompletionProvider(monaco as typeof import('monaco-editor'), { enabled: true, debounceMs: 600 })
    }
  }, [currentFile, diagnostics])

  // ── Cleanup AI completion on unmount ──
  useEffect(() => {
    return () => {
      aiCompletionRef.current?.dispose()
      aiCompletionRef.current = null
    }
  }, [])

  // ── Update markers when file changes ──
  useEffect(() => {
    if (monacoRef.current) {
      setEditorMarkers(monacoRef.current, currentFile, diagnostics)
    }
  }, [currentFile, diagnostics])

  // ── Collaborator cursor decorations ──
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const newDecorations: MonacoEditor.IModelDeltaDecoration[] = activeCollabCursors.map(c => ({
      range: {
        startLineNumber: c.cursor!.line,
        startColumn: 1,
        endLineNumber: c.cursor!.line,
        endColumn: 1,
      },
      options: {
        isWholeLine: false,
        afterContentClassName: `collab-cursor-${c.id}`,
        className: `collab-line-${c.id}`,
        glyphMarginClassName: `collab-glyph-${c.id}`,
        overviewRuler: {
          color: c.color,
          position: 4, // Right
        },
        minimap: {
          color: c.color,
          position: 1, // Inline
        },
        stickiness: 1,
      },
    }))

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations)
  }, [activeCollabCursors])

  // ── Yjs CRDT Binding: Bidirectional sync between Monaco model and Y.Text ──
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    // Get or create Y.Text for the current file
    const yText = collabManager.doc.getText(`file:${currentFile}`)
    yTextRef.current = yText

    // If yText is empty, initialize from current editor content
    if (yText.length === 0) {
      const content = editor.getValue()
      if (content) {
        collabManager.doc.transact(() => {
          yText.insert(0, content)
        })
      }
    } else {
      // yText has content from another peer — apply it to editor
      isYjsSyncRef.current = true
      editor.setValue(yText.toString())
      isYjsSyncRef.current = false
    }

    // Monaco → Yjs: forward local edits to Y.Text
    const modelChangeDisposable = editor.onDidChangeModelContent((e) => {
      if (isYjsSyncRef.current) return // Ignore changes from Yjs sync

      collabManager.doc.transact(() => {
        // Process changes in reverse order to maintain correct offsets
        const changes = [...e.changes].sort((a, b) => b.rangeOffset - a.rangeOffset)
        for (const change of changes) {
          if (change.rangeLength > 0) {
            yText.delete(change.rangeOffset, change.rangeLength)
          }
          if (change.text.length > 0) {
            yText.insert(change.rangeOffset, change.text)
          }
        }
      })
    })

    // Yjs → Monaco: apply remote changes to editor
    const yTextObserver = (event: Y.YTextEvent) => {
      if (event.transaction.local) return // Ignore our own transactions

      isYjsSyncRef.current = true
      try {
        const model = editor.getModel()
        if (!model) return

        let offset = 0
        const edits: MonacoEditor.IIdentifiedSingleEditOperation[] = []

        for (const delta of event.delta) {
          if (delta.retain !== undefined) {
            offset += delta.retain
          } else if (delta.insert !== undefined) {
            const pos = model.getPositionAt(offset)
            edits.push({
              range: {
                startLineNumber: pos.lineNumber,
                startColumn: pos.column,
                endLineNumber: pos.lineNumber,
                endColumn: pos.column,
              },
              text: typeof delta.insert === 'string' ? delta.insert : '',
            })
            offset += (typeof delta.insert === 'string' ? delta.insert.length : 0)
          } else if (delta.delete !== undefined) {
            const startPos = model.getPositionAt(offset)
            const endPos = model.getPositionAt(offset + delta.delete)
            edits.push({
              range: {
                startLineNumber: startPos.lineNumber,
                startColumn: startPos.column,
                endLineNumber: endPos.lineNumber,
                endColumn: endPos.column,
              },
              text: '',
            })
          }
        }

        if (edits.length > 0) {
          model.pushEditOperations([], edits, () => null)
        }
      } finally {
        isYjsSyncRef.current = false
      }
    }

    yText.observe(yTextObserver)

    return () => {
      modelChangeDisposable.dispose()
      yText.unobserve(yTextObserver)
      yTextRef.current = null
    }
  }, [currentFile]) // Re-bind when file changes

  // ── Code injection → Diff view ──
  useEffect(() => {
    if (pendingCodeInjection) {
      const { filename, code } = pendingCodeInjection
      const originalContent = FILE_CONTENTS[filename] || `// ${filename}\n// New file`
      setDiffOriginal(originalContent)
      setDiffModified(code)
      setDiffFilename(filename)
      setActiveView('diff')

      if (filename !== currentFile) {
        setSelectedFile(filename)
      }

      clearCodeInjection()
    }
  }, [pendingCodeInjection, currentFile, setSelectedFile, clearCodeInjection])

  const handleAcceptDiff = useCallback(() => {
    // Apply the modified code to FILE_CONTENTS
    if (diffFilename) {
      FILE_CONTENTS[diffFilename] = diffModified
    }
    setActiveView('code')
    setInjectionToast(`${i.ceAcceptedChanges} → ${diffFilename}`)
    setTimeout(() => setInjectionToast(null), 3000)
  }, [diffFilename, diffModified])

  const handleRejectDiff = useCallback(() => {
    setActiveView('code')
    setInjectionToast(null)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const monacoTheme = t.isDark ? 'yyc3-dark' : 'yyc3-light'

  // ── Report view ──
  if (activeView === 'report') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className={`h-7 flex items-center px-2 border-b flex-shrink-0 ${t.border.subtle} ${t.surface.inset}`}>
          <button
            onClick={() => setActiveView('code')}
            className={`text-[11px] px-2 py-0.5 rounded ${t.transition} ${t.accent.link} ${t.isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'}`}
            style={{ fontWeight: 500 }}
          >
            ← {i.backToCode}
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SystemReport />
        </div>
      </div>
    )
  }

  // ── Diff view ──
  if (activeView === 'diff') {
    return (
      <div className={`flex flex-col h-full overflow-hidden ${t.transition} ${t.surface.glass}`}>
        {/* Diff toolbar */}
        <div className={`h-8 flex items-center px-3 justify-between border-b flex-shrink-0 ${t.border.subtle} ${t.surface.toolbar}`}>
          <div className="flex items-center gap-2">
            <GitCompare className={`w-3.5 h-3.5 ${t.accent.primary}`} />
            <span className={`text-[11px] ${t.text.secondary}`} style={{ fontWeight: 500 }}>
              {i.aiCodeInjection} · {diffFilename}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${t.isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
              {i.diffPreview}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleAcceptDiff}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] ${t.transition} ${
                t.isDark
                  ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
              }`}
              style={{ fontWeight: 500 }}
            >
              <CheckCheck className="w-3 h-3" /> {i.acceptChanges}
            </button>
            <button
              onClick={handleRejectDiff}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] ${t.transition} ${
                t.isDark
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/15'
                  : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              }`}
              style={{ fontWeight: 500 }}
            >
              <XCircle className="w-3 h-3" /> {i.reject}
            </button>
            <button
              onClick={() => setActiveView('code')}
              className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Monaco Diff Editor */}
        <div className="flex-1 overflow-hidden">
          <DiffEditorWrapper
            original={diffOriginal}
            modified={diffModified}
            language={language}
            theme={monacoTheme}
            onBeforeMount={handleBeforeMount}
          />
        </div>
      </div>
    )
  }

  // ── Code view (Monaco Editor) ──
  return (
    <div className={`flex flex-col h-full overflow-hidden ${t.transition} ${t.surface.glass}`}>
      {/* File Tabs Bar */}
      <FileTabs />

      {/* Editor Toolbar with Breadcrumb */}
      <div className={`h-7 flex items-center px-2 justify-between border-b flex-shrink-0 ${t.border.subtle} ${t.surface.toolbar}`}>
        <div className="flex items-center min-w-0 flex-1">
          <BreadcrumbNav />
          {/* Collab indicators */}
          {activeCollabCursors.length > 0 && (
            <div className="flex items-center -space-x-1 ml-2 flex-shrink-0">
              {activeCollabCursors.map(c => (
                <div
                  key={c.id}
                  className="w-4 h-4 rounded-full border flex items-center justify-center text-[7px] text-white"
                  style={{ backgroundColor: c.color, borderColor: t.isDark ? '#0f172a' : '#f8fafc', fontWeight: 700 }}
                  title={`${c.name} · ${i.ceAtLine.replace('{n}', String(c.cursor!.line))}`}
                >
                  {c.name[0]}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-0.5 flex-shrink-0">
          <button
            onClick={() => setActiveView('report')}
            className={`p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
            title={i.systemReport}
          >
            <Info className="w-3 h-3" />
          </button>
          <button
            onClick={() => setSidePanel(sidePanel === 'refactor' ? 'none' : 'refactor')}
            className={`p-0.5 rounded ${t.transition} ${sidePanel === 'refactor' ? t.accent.activeText : ''} ${t.interactive.iconBtn}`}
            title={i.arTitle}
          >
            <Sparkles className="w-3 h-3" />
          </button>
          <button
            onClick={() => setSidePanel(sidePanel === 'diagnostics' ? 'none' : 'diagnostics')}
            className={`p-0.5 rounded ${t.transition} ${sidePanel === 'diagnostics' ? t.accent.activeText : ''} ${t.interactive.iconBtn}`}
            title={i.edTitle}
          >
            <Shield className="w-3 h-3" />
          </button>
          <button
            onClick={() => setSidePanel(sidePanel === 'review' ? 'none' : 'review')}
            className={`p-0.5 rounded ${t.transition} ${sidePanel === 'review' ? t.accent.activeText : ''} ${t.interactive.iconBtn}`}
            title={i.crTitle}
          >
            <MessageSquare className="w-3 h-3" />
          </button>
          <button
            onClick={() => { setInlineChatLine(cursorPos.line); setInlineChatVisible(!inlineChatVisible) }}
            className={`p-0.5 rounded ${t.transition} ${inlineChatVisible ? t.accent.activeText : ''} ${t.interactive.iconBtn}`}
            title={i.icTitle}
          >
            <Bot className="w-3 h-3" />
          </button>
          <button
            onClick={handleCopy}
            className={`p-0.5 rounded ${t.transition} ${t.interactive.icon}`}
            title={i.copyCode}
          >
            {copied ? <Check className={`w-3 h-3 ${t.status.success}`} /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Monaco Editor + Side Panel */}
      <div className="flex-1 overflow-hidden flex">
        {/* Editor area */}
        <div className={`${sidePanel !== 'none' ? 'flex-1 min-w-0' : 'w-full'} overflow-hidden relative`}>
          <Editor
            key={currentFile}
            defaultValue={fileContent}
            language={language}
            theme={monacoTheme}
            beforeMount={handleBeforeMount}
            onMount={handleEditorMount}
            options={{
              fontSize: 13,
              lineHeight: 20,
              fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
              fontLigatures: true,
              minimap: { enabled: true, scale: 1, maxColumn: 80, renderCharacters: false },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'all',
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true, indentation: true },
              suggest: { preview: true, showStatusBar: true },
              quickSuggestions: true,
              parameterHints: { enabled: true },
              folding: true,
              foldingStrategy: 'auto',
              wordWrap: 'off',
              padding: { top: 4, bottom: 4 },
              overviewRulerBorder: false,
              overviewRulerLanes: 2,
              hideCursorInOverviewRuler: false,
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
              },
              readOnly: false,
              automaticLayout: true,
            }}
          />

          {/* Multi-cursor collaboration visualization */}
          <CollabCursors currentFile={currentFile} lineHeight={20} />

          {/* Collab cursor overlay labels */}
          {activeCollabCursors.map(c => (
            <div
              key={c.id}
              className="absolute pointer-events-none z-10 flex items-center gap-0.5"
              style={{
                top: `${(c.cursor!.line - 1) * 20 + 4}px`,
                right: 8,
              }}
            >
              <div className="w-0.5 h-4 rounded animate-pulse" style={{ backgroundColor: c.color }} />
              <span
                className="text-[8px] px-1 py-0 rounded text-white whitespace-nowrap"
                style={{ backgroundColor: c.color, fontWeight: 600, opacity: 0.85 }}
              >
                {c.name}
              </span>
            </div>
          ))}
        </div>

        {/* Monaco Editor加载状态提示 */}
        {!monacoInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-sm text-slate-400">
                正在初始化编辑器...
              </div>
              <div className="text-xs text-slate-500">
                懒加载语言服务以提升性能
              </div>
            </div>
          </div>
        )}

        {/* Inline AI Chat Bubble */}
        <InlineAIChat
          visible={inlineChatVisible}
          onClose={() => setInlineChatVisible(false)}
          anchorLine={inlineChatLine}
          currentFile={currentFile}
        />

        {/* Side Panel: AI Refactor or Error Diagnostics */}
        {sidePanel !== 'none' && (
          <div className={`w-72 flex-shrink-0 border-l overflow-hidden ${t.border.subtle}`}>
            {sidePanel === 'refactor' && <AiRefactorPanel />}
            {sidePanel === 'diagnostics' && <ErrorDiagnostics />}
            {sidePanel === 'review' && <CodeReviewPanel />}
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className={`h-6 border-t flex items-center justify-between px-3 flex-shrink-0 ${t.border.subtle} ${t.surface.toolbar}`}>
        <div className="flex items-center space-x-3">
          {diagCounts.errors > 0 && (
            <span className={`flex items-center space-x-1 text-[10px] ${t.status.error}`}>
              <AlertCircle className="w-3 h-3" />
              <span>{diagCounts.errors}</span>
            </span>
          )}
          {diagCounts.warnings > 0 && (
            <span className={`flex items-center space-x-1 text-[10px] ${t.status.warning}`}>
              <AlertTriangle className="w-3 h-3" />
              <span>{diagCounts.warnings}</span>
            </span>
          )}
          {diagCounts.infos > 0 && (
            <span className={`flex items-center space-x-1 text-[10px] ${t.status.info}`}>
              <Info className="w-3 h-3" />
              <span>{diagCounts.infos}</span>
            </span>
          )}
          {relatedTasks.length > 0 && (
            <span className={`flex items-center space-x-1 text-[10px] ${t.isDark ? 'text-indigo-400/60' : 'text-indigo-500/60'}`}>
              <MessageSquare className="w-3 h-3" />
              <span>{relatedTasks.length} tasks in this file</span>
            </span>
          )}
          {activeCollabCursors.length > 0 && (
            <span className={`flex items-center space-x-1 text-[10px] ${t.isDark ? 'text-indigo-400/60' : 'text-indigo-500/60'}`}>
              <span>{i.ceCollabCount.replace('{n}', String(activeCollabCursors.length))}</span>
            </span>
          )}
        </div>
        <div className={`flex items-center space-x-4 text-[10px] ${t.text.dimmed}`}>
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>UTF-8</span>
          <span>TypeScript React</span>
          <CollabStatusBar />
        </div>
      </div>

      {/* Injection toast */}
      {injectionToast && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/25 backdrop-blur-sm z-30"
          style={{ animation: 'yyc3ModalIn 0.2s ease-out' }}>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] text-emerald-300">{injectionToast}</span>
        </div>
      )}
    </div>
  )
}

// ── Monaco markers from diagnostics ──
function setEditorMarkers(monaco: typeof import('monaco-editor'), filename: string, diagnostics: DiagItem[]) {
  const model = monaco.editor.getModels().find((m) => {
    const uri = m.uri.toString()
    return uri.includes(filename)
  })
  if (!model) return

  const markers = diagnostics.map(d => ({
    severity: d.type === 'error'
      ? monaco.MarkerSeverity.Error
      : d.type === 'warning'
        ? monaco.MarkerSeverity.Warning
        : monaco.MarkerSeverity.Info,
    startLineNumber: d.line,
    startColumn: d.col || 1,
    endLineNumber: d.line,
    endColumn: d.endCol || 100,
    message: d.message,
    source: 'YYC3 TypeChecker',
  }))

  monaco.editor.setModelMarkers(model, 'yyc3', markers)
}

// ── Diff Editor Wrapper ──
function DiffEditorWrapper({
  original, modified, language, theme, onBeforeMount,
}: {
  original: string; modified: string; language: string; theme: string
  onBeforeMount: BeforeMount
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const diffEditorRef = useRef<MonacoEditor.IStandaloneDiffEditor | null>(null)

  useEffect(() => {
    let editor: MonacoEditor.IStandaloneDiffEditor | null = null

    const init = async () => {
      const monaco = await import('monaco-editor')
      onBeforeMount(monaco as unknown)

      if (!containerRef.current) return

      const originalModel = monaco.editor.createModel(original, language)
      const modifiedModel = monaco.editor.createModel(modified, language)

      editor = monaco.editor.createDiffEditor(containerRef.current, {
        theme,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
        fontLigatures: true,
        renderSideBySide: true,
        readOnly: true,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        minimap: { enabled: false },
        overviewRulerBorder: false,
        automaticLayout: true,
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
      })

      editor.setModel({ original: originalModel, modified: modifiedModel })
      diffEditorRef.current = editor
    }

    init()

    return () => {
      if (editor) editor.dispose()
    }
  }, [original, modified, language, theme, onBeforeMount])

  return <div ref={containerRef} className="w-full h-full" />
}