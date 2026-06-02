/**
 * @file ChatInterface.tsx
 * @description YYC³便携式智能AI系统 - 左侧面板AI聊天界面
 * Fixed: removed react-syntax-highlighter deep ESM subpath imports
 * that caused "Failed to fetch dynamically imported module" in Vite + pnpm.
 * Now uses lazy-loaded SyntaxHighlighter with inline theme objects as fallback.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,chat,ai,interface
 */

import { clsx, type ClassValue } from 'clsx'
import {
  AlertCircle,
  ArrowUpRight,
  Bot,
  Clipboard,
  Code,
  FileUp,
  Github,
  Image as ImageIcon,
  Palette,
  Plus,
  Send,
  Sparkles,
  Terminal,
  User
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import { aiProviderService } from '../services/ai-provider'
import { buildSystemPromptWithRules } from '../services/settings-integration'
import type { Message } from '../store'
import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens, type ThemeMode } from '../utils/theme'



// ── Utility ──
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Inline syntax themes (avoid deep ESM subpath imports) ──
const DARK_CODE_THEME: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': { color: '#d4d4d4', background: 'transparent', fontFamily: "'Fira Code', Consolas, Monaco, monospace", fontSize: '12px', textAlign: 'left', whiteSpace: 'pre', wordSpacing: 'normal', wordBreak: 'normal', lineHeight: '1.6', tabSize: 4 },
  'pre[class*="language-"]': { color: '#d4d4d4', background: 'rgba(0,0,0,0.3)', fontFamily: "'Fira Code', Consolas, Monaco, monospace", fontSize: '12px', textAlign: 'left', whiteSpace: 'pre', wordSpacing: 'normal', wordBreak: 'normal', lineHeight: '1.6', tabSize: 4, padding: '1em', margin: '0', overflow: 'auto', borderRadius: '8px' },
  comment: { color: '#6a9955' }, prolog: { color: '#6a9955' }, doctype: { color: '#6a9955' }, cdata: { color: '#6a9955' },
  punctuation: { color: '#d4d4d4' }, property: { color: '#9cdcfe' }, tag: { color: '#569cd6' },
  boolean: { color: '#569cd6' }, number: { color: '#b5cea8' }, constant: { color: '#9cdcfe' },
  symbol: { color: '#b5cea8' }, deleted: { color: '#ce9178' }, selector: { color: '#d7ba7d' },
  'attr-name': { color: '#9cdcfe' }, string: { color: '#ce9178' }, char: { color: '#ce9178' },
  builtin: { color: '#4ec9b0' }, inserted: { color: '#b5cea8' }, operator: { color: '#d4d4d4' },
  entity: { color: '#569cd6' }, url: { color: '#9cdcfe' }, atrule: { color: '#c586c0' },
  'attr-value': { color: '#ce9178' }, keyword: { color: '#c586c0' }, function: { color: '#dcdcaa' },
  'class-name': { color: '#4ec9b0' }, regex: { color: '#d16969' },
  important: { color: '#569cd6', fontWeight: 'bold' }, variable: { color: '#9cdcfe' },
}

const LIGHT_CODE_THEME: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': { color: '#000000', background: 'transparent', fontFamily: "'Fira Code', Consolas, Monaco, monospace", fontSize: '12px', textAlign: 'left', whiteSpace: 'pre', wordSpacing: 'normal', wordBreak: 'normal', lineHeight: '1.6', tabSize: 4 },
  'pre[class*="language-"]': { color: '#000000', background: 'rgba(0,0,0,0.04)', fontFamily: "'Fira Code', Consolas, Monaco, monospace", fontSize: '12px', textAlign: 'left', whiteSpace: 'pre', wordSpacing: 'normal', wordBreak: 'normal', lineHeight: '1.6', tabSize: 4, padding: '1em', margin: '0', overflow: 'auto', borderRadius: '8px' },
  comment: { color: '#008000' }, prolog: { color: '#008000' }, doctype: { color: '#008000' }, cdata: { color: '#008000' },
  punctuation: { color: '#393a34' }, property: { color: '#001080' }, tag: { color: '#800000' },
  boolean: { color: '#0000ff' }, number: { color: '#098658' }, constant: { color: '#001080' },
  symbol: { color: '#098658' }, deleted: { color: '#a31515' }, selector: { color: '#800000' },
  'attr-name': { color: '#e50000' }, string: { color: '#a31515' }, char: { color: '#a31515' },
  builtin: { color: '#267f99' }, inserted: { color: '#098658' }, operator: { color: '#000000' },
  entity: { color: '#0000ff' }, url: { color: '#001080' }, atrule: { color: '#af00db' },
  'attr-value': { color: '#a31515' }, keyword: { color: '#af00db' }, function: { color: '#795e26' },
  'class-name': { color: '#267f99' }, regex: { color: '#811f3f' },
  important: { color: '#0000ff', fontWeight: 'bold' }, variable: { color: '#001080' },
}

// ── Lazy-load SyntaxHighlighter (avoids static ESM deep path import) ──
type SyntaxHighlighterProps = {
  language?: string
  children?: string
  style?: unknown
  PreTag?: string
  customStyle?: React.CSSProperties
}

let _SyntaxHL: React.ComponentType<SyntaxHighlighterProps> | null = null
let _loadPromise: Promise<void> | null = null

function getSyntaxHighlighter(): React.ComponentType<SyntaxHighlighterProps> | null {
  if (_SyntaxHL) return _SyntaxHL
  if (!_loadPromise) {
    _loadPromise = import('react-syntax-highlighter')
      .then((mod) => {
        _SyntaxHL = (mod as Record<string, unknown>).Prism as React.ComponentType<SyntaxHighlighterProps> || mod.default as React.ComponentType<SyntaxHighlighterProps>
      })
      .catch(() => { /* fallback to <pre><code> */ })
  }
  return null
}

// ── Slash Commands ──
const SLASH_COMMANDS = [
  { command: '/code', description: 'cmdCodeDesc', icon: Code },
  { command: '/arch', description: 'cmdArchDesc', icon: Terminal },
  { command: '/help', description: 'cmdHelpDesc', icon: Sparkles },
]

// ── Real API call helper ──
async function callModelAPI(
  model: { provider: string; endpoint: string; apiKey: string; name: string },
  userMessage: string,
  history: { role: string; content: string }[],
  emptyLabel = '(empty response)'
): Promise<string> {
  const BASE_PROMPT = 'You are YYC³ AI, a helpful coding assistant. Respond concisely in the user\'s language. Use Markdown.'
  const systemPrompt = buildSystemPromptWithRules(BASE_PROMPT)
  const msgs = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  // Get real config from aiProviderService if modelId matches
  const providerConfig = aiProviderService.getActiveProvider()
  const apiKey = providerConfig?.apiKey || model.apiKey
  const endpoint = providerConfig?.baseURL ? `${providerConfig.baseURL}/chat/completions` : model.endpoint

  if (model.provider === 'ollama') {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model.name, messages: msgs, stream: false }),
      signal: AbortSignal.timeout(30000),
    })
    if (!resp.ok) throw new Error(`Ollama HTTP ${resp.status}`)
    const data = await resp.json()
    return data?.message?.content || emptyLabel
  } else {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: model.name, messages: msgs, stream: false, max_tokens: 2048 }),
      signal: AbortSignal.timeout(30000),
    })
    if (!resp.ok) throw new Error(`API HTTP ${resp.status}`)
    const data = await resp.json()
    return data?.choices?.[0]?.message?.content || emptyLabel
  }
}

// ── SSE Streaming API call ──
async function callModelAPIStream(
  model: { provider: string; endpoint: string; apiKey: string; name: string },
  userMessage: string,
  history: { role: string; content: string }[],
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const BASE_PROMPT = 'You are YYC³ AI, a helpful coding assistant. Respond concisely in the user\'s language. Use Markdown.'
  const systemPrompt = buildSystemPromptWithRules(BASE_PROMPT)
  const msgs = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  // Get real config from aiProviderService
  const providerConfig = aiProviderService.getActiveProvider()
  const apiKey = providerConfig?.apiKey || model.apiKey
  const endpoint = providerConfig?.baseURL ? `${providerConfig.baseURL}/chat/completions` : model.endpoint

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  // Claude uses different headers and response format
  const isClaude = endpoint.includes('anthropic.com')
  if (isClaude) {
    headers['x-api-key'] = apiKey
    headers['anthropic-version'] = '2023-06-01'
    headers['anthropic-dangerous-direct-browser-access'] = 'true'
    delete headers['Authorization']
  }

  const body = model.provider === 'ollama'
    ? JSON.stringify({ model: model.name, messages: msgs, stream: true })
    : isClaude
      ? JSON.stringify({ model: model.name, messages: msgs.filter(m => m.role !== 'system'), system: msgs[0].content, max_tokens: 2048, stream: true })
      : JSON.stringify({ model: model.name, messages: msgs, stream: true, max_tokens: 2048 })

  const resp = await fetch(endpoint, { method: 'POST', headers, body, signal })
  if (!resp.ok) throw new Error(`API HTTP ${resp.status}`)
  if (!resp.body) throw new Error('No stream body')

  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // Parse SSE lines
    const lines = buffer.split('\n')
    buffer = lines.pop() || '' // keep incomplete line

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed === 'data: [DONE]') continue

      if (model.provider === 'ollama') {
        // Ollama streams JSON per line (no "data: " prefix)
        try {
          const json = JSON.parse(trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed)
          const content = json?.message?.content || json?.response || ''
          if (content) onChunk(content)
        } catch { /* skip malformed */ }
      } else if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6))
          // OpenAI format
          const content = json?.choices?.[0]?.delta?.content
          // Claude format
          const claudeContent = json?.delta?.text || (json?.type === 'content_block_delta' ? json?.delta?.text : '')
          const chunk = content || claudeContent || ''
          if (chunk) onChunk(chunk)
        } catch { /* skip */ }
      } else if (trimmed.startsWith('event: ')) {
        // Claude SSE events — skip, data line follows
      } else {
        // Try parsing as raw JSON (Ollama format)
        try {
          const json = JSON.parse(trimmed)
          const content = json?.message?.content || json?.response || ''
          if (content) onChunk(content)
        } catch { /* skip */ }
      }
    }
  }
}

// ── Mock streaming simulator ──
async function mockStreamResponse(text: string, onChunk: (text: string) => void, signal?: AbortSignal): Promise<void> {
  const words = text.split('')
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) break
    onChunk(words[i])
    await new Promise(r => setTimeout(r, 12 + Math.random() * 18))
  }
}

// ══════════════════════════════════════════
// ── ChatInterface Component ──
// ══════════════════════════════════════════
export function ChatInterface() {
  const { theme, language, messages, addMessage, aiModels, activeModelId, openModelSettings } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)
  const [input, setInput] = useState('')
  const [showCommands, setShowCommands] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [, forceUpdate] = useState(0) // for re-render after lazy load
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      toast.error(i.toastInvalidImage)
      return
    }
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      const imageMarkdown = `![${file.name}](${dataUrl})\n`
      setInput(prev => prev + imageMarkdown)
      toast.success(i.toastImageUploaded)
      inputRef.current?.focus()
    }
    reader.onerror = () => toast.error(i.toastImageUploadFailed)
    reader.readAsDataURL(file)
    
    e.target.value = ''
  }, [i])

  // Handle file import
  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const ext = file.name.split('.').pop()?.toLowerCase() || 'txt'
      
      let formattedContent = ''
      if (['js', 'jsx', 'ts', 'tsx', 'json', 'css', 'html', 'py', 'java', 'go', 'rs', 'c', 'cpp', 'h'].includes(ext)) {
        formattedContent = `\`\`\`${ext}\n${content}\n\`\`\`\n`
      } else {
        formattedContent = `\`\`\`\n${content}\n\`\`\`\n`
      }
      
      setInput(prev => prev + formattedContent)
      toast.success(i.toastFileImported)
      inputRef.current?.focus()
    }
    reader.onerror = () => toast.error(i.toastFileImportFailed)
    reader.readAsText(file)
    
    e.target.value = ''
  }, [i])

  // Get active model info
  const activeModel = aiModels.find(m => m.id === activeModelId)

  // Kick off lazy load of SyntaxHighlighter on mount
  useEffect(() => {
    getSyntaxHighlighter()
    // Re-render once loaded so code blocks pick it up
    const timer = setTimeout(() => forceUpdate(n => n + 1), 500)
    return () => clearTimeout(timer)
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)
    if (val === '/') {
      setShowCommands(true)
    } else if (showCommands && !val.startsWith('/')) {
      setShowCommands(false)
    }
  }

  const handleCommandSelect = (command: string) => {
    setInput(command + ' ')
    setShowCommands(false)
    inputRef.current?.focus()
  }

  const processMessage = useCallback(async (text: string) => {
    addMessage({ role: 'user', content: text })
    setIsStreaming(true)
    setStreamingContent('')

    const trimmedText = text.trim()

    // Handle slash commands locally
    if (trimmedText === '/help') {
      addMessage({ role: 'system', content: i.ciHelpContent })
      setIsStreaming(false)
      return
    }
    if (trimmedText === '/arch') {
      addMessage({ role: 'system', content: i.ciArchContent })
      setIsStreaming(false)
      return
    }

    // Try real model API with streaming if active model is connected
    const activeModel = activeModelId ? aiModels.find(m => m.id === activeModelId) : null
    if (activeModel && activeModel.status === 'connected') {
      const controller = new AbortController()
      abortRef.current = controller
      let accumulated = ''
      try {
        const history = messages.filter(m => m.role === 'user' || m.role === 'ai').map(m => ({ role: m.role, content: m.content }))
        await callModelAPIStream(activeModel, text, history, (chunk) => {
          accumulated += chunk
          setStreamingContent(accumulated)
        }, controller.signal)
        // Add the final accumulated message
        if (accumulated) {
          addMessage({ role: 'ai', content: accumulated })
          // Auto-extract tasks from AI response
          try {
            const { aiTaskIntegration } = await import('../services/task-ai-integration')
            aiTaskIntegration.extractTasksFromMessages([
              { role: 'user', content: text },
              { role: 'assistant', content: accumulated },
            ], { minConfidence: 0.75, autoAdd: true })
          } catch { /* task extraction is best-effort */ }
        } else {
          addMessage({ role: 'ai', content: i.ciEmptyResponse })
        }
      } catch (err: unknown) {
        const error = err as Error
        if (error.name === 'AbortError') {
          if (accumulated) addMessage({ role: 'ai', content: accumulated + '\n\n' + i.ciInterrupted })
        } else {
          // Fallback to non-streaming
          try {
            const history = messages.filter(m => m.role === 'user' || m.role === 'ai').map(m => ({ role: m.role, content: m.content }))
            const reply = await callModelAPI(activeModel, text, history, i.ciEmptyResponse)
            addMessage({ role: 'ai', content: reply })
          } catch (err2: unknown) {
            const error2 = err2 as Error
            addMessage({ role: 'system', content: `${i.ciModelCallFailed}: ${error2.message || error.message || i.ciUnknownError}\n\n${i.ciFallbackMsg}` })
            addMessage({ role: 'ai', content: `${i.ciReceived}：**${text}**\n\n${i.ciAnalyzing}` })
          }
        }
      }
      abortRef.current = null
    } else {
      // Fallback: simulated streaming response
      let mockText = ''
      if (trimmedText.startsWith('/code')) {
        mockText = '```tsx\nexport function GlassButton({ children, onClick }) {\n  return (\n    <button\n      onClick={onClick}\n      className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-6 py-3 text-white shadow-xl hover:bg-white/30 transition-all active:scale-95"\n    >\n      {children}\n    </button>\n  )\n}\n```\n\n' + i.ciCodeSynced
      } else {
        const noModelHint = aiModels.length === 0 ? '\n\n' + i.ciNoModelHint : activeModel && activeModel.status !== 'connected' ? '\n\n' + i.ciModelNotTested : ''
        mockText = `${i.ciReceived}：**${text}**\n\n${i.ciAnalyzingFull}${noModelHint}`
      }

      // Stream the mock response character by character
      let accumulated = ''
      await mockStreamResponse(mockText, (chunk) => {
        accumulated += chunk
        setStreamingContent(accumulated)
      })
      addMessage({ role: 'ai', content: accumulated })
    }
    setIsStreaming(false)
    setStreamingContent('')
  }, [addMessage, aiModels, activeModelId, messages, i])

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    const currentInput = input
    setInput('')
    setShowCommands(false)
    processMessage(currentInput)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`flex flex-col h-full relative overflow-hidden ${t.isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar scroll-smooth"
        role="log"
        aria-live="polite"
      >
        <AnimatePresence>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} theme={theme} />
          ))}
        </AnimatePresence>

        {/* Streaming indicator */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start space-x-2"
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${t.accent.primaryBg}`}>
              <Bot className={`w-3.5 h-3.5 ${t.accent.primary}`} />
            </div>
            <div className={`rounded-xl rounded-tl-sm px-3 py-2.5 max-w-[85%] ${t.surface.chatBubble} border ${t.isDark ? 'border-white/5' : 'border-slate-200/50'}`}>
              {streamingContent ? (
                <div>
                  <div className="flex items-center space-x-1.5 mb-1.5">
                    <span className={cn("text-[10px]", t.accent.primary)} style={{ fontWeight: 600 }}>YYC³ AI</span>
                    <span className="text-[9px] text-amber-400/60 animate-pulse">{i.ciStreaming}</span>
                  </div>
                  <div className={`prose-sm max-w-none leading-relaxed text-[13px] ${t.isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}
                      components={{
                        p({ children }) { return <p className="mb-2 last:mb-0" style={{ lineHeight: '1.6' }}>{children}</p> },
                        code({ children, className }) {
                          const match = /language-(\w+)/.exec(className || '')
                          if (match) {
                            return <pre style={{ margin: '8px 0', borderRadius: '8px', padding: '1em', overflow: 'auto', background: t.codeBlock.bg, fontSize: '12px', lineHeight: '1.6' }}><code>{children}</code></pre>
                          }
                          return <code className={cn(t.codeBlock.inlineClass, "rounded px-1 py-0.5 text-[12px]", className)}>{children}</code>
                        },
                        strong({ children }) { return <strong style={{ fontWeight: 600 }}>{children}</strong> },
                      }}
                    >
                      {streamingContent}
                    </ReactMarkdown>
                    <span className="inline-block w-0.5 h-4 bg-current opacity-60 animate-pulse ml-0.5 -mb-0.5" />
                  </div>
                </div>
              ) : (
                <div className="flex space-x-1">
                  {[0, 1, 2].map(dotIdx => (
                    <motion.div
                      key={dotIdx}
                      className={`w-1.5 h-1.5 rounded-full ${t.isDark ? 'bg-slate-400' : 'bg-slate-500'}`}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: dotIdx * 0.12 }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className={`p-3 border-t relative ${t.border.subtle} ${t.isDark ? 'bg-slate-900/50' : 'bg-white/30'} backdrop-blur-md z-10`}>

        {/* Model Status Indicator */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            {activeModel ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-white/60">{activeModel.name}</span>
                <span className="text-[9px] text-white/30">({activeModel.provider})</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[10px] text-amber-400/80">No AI Model Configured</span>
              </>
            )}
          </div>
          {!activeModel && (
            <button
              onClick={openModelSettings}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 text-[9px] hover:bg-indigo-500/25 transition-all"
            >
              <AlertCircle className="w-2.5 h-2.5" />
              Configure
            </button>
          )}
        </div>

        {/* Slash Command Popover */}
        <AnimatePresence>
          {showCommands && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className={`absolute bottom-full left-3 right-3 mb-2 rounded-xl overflow-hidden p-1 z-50 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
            >
              <div className={`px-3 py-1.5 text-[10px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.slashCommands}</div>
              {SLASH_COMMANDS.map((cmd) => (
                <button
                  key={cmd.command}
                  onClick={() => handleCommandSelect(cmd.command)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left text-[12px] rounded-lg ${t.transition} ${t.isDark ? 'hover:bg-indigo-500/15 text-slate-200' : 'hover:bg-indigo-50 text-slate-700'}`}
                >
                  <cmd.icon className={`w-3.5 h-3.5 ${t.accent.primary}`} />
                  <span className="font-mono" style={{ fontWeight: 500 }}>{cmd.command}</span>
                  <span className={`text-[11px] ${t.text.muted}`}>{i[cmd.description as keyof typeof i]}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? i.chatStreamingPlaceholder : i.chatPlaceholder}
            disabled={isStreaming}
            aria-label={i.ciInputLabel}
            className={`w-full h-20 resize-none py-2.5 pl-10 pr-12 rounded-xl outline-none text-[13px] ${t.transition} ${t.input.chat} disabled:opacity-50`}
            style={{ fontWeight: 400 }}
          />
          <div className="absolute bottom-2 left-2 flex items-center space-x-0.5 z-10 pointer-events-auto">
            <div className="relative pointer-events-auto">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAttachMenu(!showAttachMenu) }}
                className={`p-1 rounded ${t.transition} ${showAttachMenu ? t.interactive.iconActive : t.interactive.iconBtn} cursor-pointer`}
                aria-label={i.addAttachment}
                type="button"
              >
                <Plus className="w-3.5 h-3.5 pointer-events-none" />
              </button>
              <AnimatePresence>
                {showAttachMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      className={`absolute bottom-full left-0 mb-2 w-48 rounded-xl overflow-hidden p-1 z-50 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
                    >
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md,.json,.js,.jsx,.ts,.tsx,.css,.html,.py,.java,.go,.rs,.c,.cpp,.h"
                        onChange={handleFileImport}
                        className="hidden"
                      />
                      {[
                        { label: i.attachImage, icon: ImageIcon, action: () => imageInputRef.current?.click() },
                        { label: i.attachFile, icon: FileUp, action: () => fileInputRef.current?.click() },
                        { label: i.attachGithub, icon: Github, action: () => toast.info(i.toastGithubLinkOpened) },
                        { label: i.attachFigma, icon: Palette, action: () => toast.info(i.toastFigmaImport) },
                        { label: i.attachCode, icon: Code, action: () => { setInput(input + '```tsx\n\n```'); inputRef.current?.focus() } },
                        { label: i.attachClipboard, icon: Clipboard, action: () => { navigator.clipboard.readText().then(text => { if (text) { setInput(input + text); toast.success(i.toastClipboardPasted) } }).catch(() => toast.error(i.toastClipboardError)) } },
                      ].map(({ label, icon: Icon, action }) => (
                        <button
                          key={label}
                          onClick={() => { action(); setShowAttachMenu(false) }}
                          className={`w-full flex items-center space-x-2.5 px-3 py-1.5 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
                          style={{ fontWeight: 400 }}
                          type="button"
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast.info(i.toastImageUpload) }}
              className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn} cursor-pointer`}
              aria-label={i.uploadImage}
              type="button"
            >
              <ImageIcon className="w-3.5 h-3.5 pointer-events-none" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const snippet = '```tsx\n// Your code here\n```'
                setInput(input + snippet)
                inputRef.current?.focus()
                toast.info(i.toastCodeTemplateInserted)
              }}
              className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn} cursor-pointer`}
              aria-label={i.insertCode}
              type="button"
            >
              <Code className="w-3.5 h-3.5 pointer-events-none" />
            </button>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSend() }}
            disabled={!input.trim() || isStreaming}
            className={`absolute bottom-2 right-2 p-2 ${t.accent.solidBtn} disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg shadow-lg ${t.transition} flex items-center justify-center z-10 cursor-pointer`}
            aria-label={i.ciSendLabel}
            type="button"
          >
            <Send className="w-3.5 h-3.5 pointer-events-none" />
          </button>
        </div>

        {/* Hints */}
        <div className="flex items-center justify-center mt-1.5">
          <p className={`text-[10px] ${t.text.dimmed}`}>
            <kbd className={`px-1 py-0.5 rounded text-[9px] ${t.kbd}`}>Enter</kbd> {i.enterToSend} ·{' '}
            <kbd className={`px-1 py-0.5 rounded text-[9px] ${t.kbd}`}>Shift+Enter</kbd> {i.shiftEnterNewline} ·{' '}
            <kbd className={`px-1 py-0.5 rounded text-[9px] ${t.kbd}`}>/</kbd> {i.slashShortcut}
          </p>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// ── MessageBubble Sub-component ──
// ══════════════════════════════════════════
function MessageBubble({ msg, theme }: { msg: Message, theme: string }) {
  const isUser = msg.role === 'user'
  const isSystem = msg.role === 'system'
  const t = getThemeTokens(theme as ThemeMode)
  const { injectCode, language } = useAppStore()
  const i = getI18n(language)

  const SynHL = getSyntaxHighlighter()

  // Extract code blocks from message for "Apply to Editor" functionality
  const handleApplyCode = useCallback((code: string, lang: string) => {
    const filenameMap: Record<string, string> = {
      tsx: 'ChatInterface.tsx', ts: 'store.ts', css: 'theme.css',
      jsx: 'App.tsx', json: 'package.json', javascript: 'App.tsx', typescript: 'store.ts',
    }
    const filename = filenameMap[lang] || `snippet.${lang || 'tsx'}`
    injectCode(filename, code, lang)
  }, [injectCode])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className="flex items-start space-x-2 max-w-[90%]">
        {!isUser && (
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isSystem
            ? t.isDark ? 'bg-cyan-500/20' : 'bg-cyan-500/10'
            : t.accent.primaryBg
            }`}>
            {isSystem
              ? <Terminal className="w-3.5 h-3.5 text-cyan-500" />
              : <Bot className={`w-3.5 h-3.5 ${t.accent.primary}`} />
            }
          </div>
        )}

        <div className={cn(
          "rounded-xl p-3 text-[13px]",
          isUser
            ? `${t.surface.chatBubbleUser} rounded-tr-sm`
            : isSystem
              ? `${t.surface.chatBubbleSystem} rounded-tl-sm border ${t.isDark ? 'border-slate-700/50 text-slate-200' : 'border-slate-200 text-slate-700'}`
              : `${t.surface.chatBubble} rounded-tl-sm border ${t.isDark ? 'border-white/5 text-slate-200' : 'border-slate-200/50 text-slate-800'}`
        )}>
          {!isUser && (
            <div className="flex items-center space-x-1.5 mb-1.5">
              <span className={cn(
                "text-[10px]",
                isSystem ? "text-cyan-500" : t.accent.primary
              )} style={{ fontWeight: 600 }}>
                {isSystem ? 'System' : 'YYC³ AI'}
              </span>
            </div>
          )}
          <div className="prose-sm max-w-none leading-relaxed" style={{ fontSize: '13px' }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code(props) {
                  const { children, className } = props as { children?: React.ReactNode; className?: string }
                  const match = /language-(\w+)/.exec(className || '')
                  const codeStr = String(children).replace(/\n$/, '')
                  if (match && SynHL) {
                    return (
                      <div className="relative group/code">
                        <SynHL
                          PreTag="div"
                          language={match[1]}
                          style={t.isDark ? DARK_CODE_THEME : LIGHT_CODE_THEME}
                          customStyle={{
                            margin: '8px 0',
                            borderRadius: '8px',
                            background: t.codeBlock.bg,
                            fontSize: '12px',
                          }}
                        >
                          {codeStr}
                        </SynHL>
                        <button
                          onClick={() => handleApplyCode(codeStr, match[1])}
                          className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] opacity-0 group-hover/code:opacity-100 transition-all ${t.isDark
                            ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/20'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                            }`}
                          title={i.ciApplyToEditor}
                        >
                          <ArrowUpRight className="w-3 h-3" /> {i.ciApplyToEditor}
                        </button>
                      </div>
                    )
                  }
                  if (match) {
                    return (
                      <div className="relative group/code">
                        <pre style={{
                          margin: '8px 0', borderRadius: '8px', padding: '1em', overflow: 'auto',
                          background: t.codeBlock.bg,
                          fontSize: '12px', lineHeight: '1.6',
                        }}>
                          <code>{children}</code>
                        </pre>
                        <button
                          onClick={() => handleApplyCode(codeStr, match[1])}
                          className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] opacity-0 group-hover/code:opacity-100 transition-all ${t.isDark
                            ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/20'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                            }`}
                          title={i.ciApplyToEditor}
                        >
                          <ArrowUpRight className="w-3 h-3" /> {i.ciApplyToEditor}
                        </button>
                      </div>
                    )
                  }
                  return (
                    <code className={cn(
                      t.codeBlock.inlineClass,
                      "rounded px-1 py-0.5 text-[12px]",
                      className
                    )}>
                      {children}
                    </code>
                  )
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0" style={{ lineHeight: '1.6' }}>{children}</p>
                },
                ul({ children }) {
                  return <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>
                },
                li({ children }) {
                  return <li style={{ lineHeight: '1.5' }}>{children}</li>
                },
                strong({ children }) {
                  return <strong style={{ fontWeight: 600 }}>{children}</strong>
                },
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
          <div className={cn(
            "text-[9px] mt-1.5 text-right",
            isUser ? "text-indigo-200" : t.text.muted
          )}>
            {new Intl.DateTimeFormat(language === 'en' ? 'en-US' : language === 'ja' ? 'ja-JP' : language === 'ko' ? 'ko-KR' : 'zh-CN', { hour: '2-digit', minute: '2-digit' }).format(msg.timestamp)}
          </div>
        </div>

        {isUser && (
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
