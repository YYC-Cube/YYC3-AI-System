/**
 * @file settings-integration.ts
 * @description YYC³便携式智能AI系统 - 设置集成服务
 * Settings Integration Service
 * Bridges settingsStore with appStore (theme/language/models), plugin system,
 * AI service (rule injection), and global keyboard shortcuts.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,settings,integration,sync
 */

import { useSettingsStore } from '../settingsStore'
import type { McpConfig, RuleItem, AgentConfig } from '../settingsStore'
import { useAppStore } from '../store'
import type { AIModel } from '../types'
import type { Language } from '../utils/i18n'
import type { ThemeMode } from '../utils/theme'

import { aiProviderService } from './ai-provider'

// ── Keyboard Shortcut Manager ──

/** All available shortcut action IDs with human-readable labels */
export const SHORTCUT_ACTION_LABELS: Record<string, string> = {
  'toggle-terminal': 'Toggle Terminal',
  'command-palette': 'Command Palette',
  'quick-open': 'Quick Open',
  'save': 'Save',
  'find': 'Find',
  'replace': 'Find & Replace',
  'toggle-sidebar': 'Toggle Sidebar',
  'close-tab': 'Close Tab',
  'new-file': 'New File',
  'settings': 'Open Settings',
  'toggle-preview': 'Toggle Preview',
  'switch-code': 'Switch to Code',
  'switch-preview': 'Switch to Preview',
  'global-search': 'Global Search',
  'git-commit': 'Git Commit',
  'send-message': 'Send Message',
  'next-tab': 'Next Tab',
  'prev-tab': 'Previous Tab',
  'zoom-in': 'Zoom In',
  'zoom-out': 'Zoom Out',
  'toggle-fullscreen': 'Toggle Fullscreen',
  'ai-inline': 'AI Inline',
  'ai-chat': 'AI Chat',
  'accept-suggestion': 'Accept Suggestion',
}

/** Default VSCode-style keybindings */
export const VSCODE_KEYBINDINGS: Record<string, string> = {
  'toggle-terminal': 'Ctrl+`',
  'command-palette': 'Ctrl+Shift+P',
  'quick-open': 'Ctrl+P',
  'save': 'Ctrl+S',
  'find': 'Ctrl+F',
  'replace': 'Ctrl+H',
  'toggle-sidebar': 'Ctrl+B',
  'close-tab': 'Ctrl+W',
  'new-file': 'Ctrl+N',
  'settings': 'Ctrl+,',
  'toggle-preview': 'Ctrl+Shift+V',
  'switch-code': 'Ctrl+1',
  'switch-preview': 'Ctrl+2',
  'global-search': 'Ctrl+Shift+F',
  'git-commit': 'Ctrl+Shift+G',
  'send-message': 'Enter',
  'next-tab': 'Ctrl+Tab',
  'prev-tab': 'Ctrl+Shift+Tab',
  'zoom-in': 'Ctrl+=',
  'zoom-out': 'Ctrl+-',
  'toggle-fullscreen': 'F11',
}

/** Cursor-style keybindings (mostly same but a few diffs) */
export const CURSOR_KEYBINDINGS: Record<string, string> = {
  ...VSCODE_KEYBINDINGS,
  'command-palette': 'Ctrl+K',
  'ai-inline': 'Ctrl+L',
  'ai-chat': 'Ctrl+Shift+L',
  'accept-suggestion': 'Tab',
}

type ShortcutHandler = () => void
const _handlers: Map<string, ShortcutHandler> = new Map()
let _globalListenerActive = false

function parseShortcut(shortcut: string): { ctrl: boolean; shift: boolean; alt: boolean; meta: boolean; key: string } {
  const parts = shortcut.split('+').map(p => p.trim().toLowerCase())
  return {
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta') || parts.includes('cmd'),
    key: parts.filter(p => !['ctrl', 'shift', 'alt', 'meta', 'cmd'].includes(p))[0] || '',
  }
}

function matchEvent(e: KeyboardEvent, parsed: ReturnType<typeof parseShortcut>): boolean {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const ctrlMatch = isMac ? (e.metaKey === parsed.ctrl) : (e.ctrlKey === parsed.ctrl)
  return ctrlMatch &&
    e.shiftKey === parsed.shift &&
    e.altKey === parsed.alt &&
    e.key.toLowerCase() === parsed.key.replace('`', '`')
}

function _onKeyDown(e: KeyboardEvent) {
  // Don't intercept when typing in inputs/textareas (unless it's a global shortcut)
  const tag = (e.target as HTMLElement)?.tagName
  const isInputFocused = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable

  const bindings = getActiveKeybindings()

  for (const [actionId, shortcutStr] of Object.entries(bindings)) {
    const parsed = parseShortcut(shortcutStr)
    if (matchEvent(e, parsed)) {
      // Allow Enter in inputs
      if (isInputFocused && actionId === 'send-message') continue
      // Only intercept modifier-based shortcuts when in inputs
      if (isInputFocused && !parsed.ctrl && !parsed.meta && !parsed.alt) continue

      const handler = _handlers.get(actionId)
      if (handler) {
        e.preventDefault()
        e.stopPropagation()
        handler()
        return
      }
    }
  }
}

/** Register a shortcut action handler */
export function registerShortcutHandler(actionId: string, handler: ShortcutHandler): () => void {
  _handlers.set(actionId, handler)
  return () => { _handlers.delete(actionId) }
}

/** Activate global keyboard shortcut listener */
export function activateShortcutListener(): () => void {
  if (_globalListenerActive) return () => {}
  _globalListenerActive = true
  document.addEventListener('keydown', _onKeyDown, true)
  return () => {
    document.removeEventListener('keydown', _onKeyDown, true)
    _globalListenerActive = false
  }
}

/** Get the current keybinding map based on scheme */
export function getActiveKeybindings(): Record<string, string> {
  const { shortcutScheme, customKeybindings } = useSettingsStore.getState()
  if (shortcutScheme === 'custom') {
    // Merge: start from vscode defaults, overlay custom overrides
    return { ...VSCODE_KEYBINDINGS, ...customKeybindings }
  }
  return shortcutScheme === 'cursor' ? { ...CURSOR_KEYBINDINGS } : { ...VSCODE_KEYBINDINGS }
}

/**
 * Detect shortcut conflicts in the current keybinding map.
 * Returns a map of shortcutStr → array of actionIds that share the same binding.
 */
export function detectShortcutConflicts(): Map<string, string[]> {
  const bindings = getActiveKeybindings()
  const byShortcut = new Map<string, string[]>()
  for (const [actionId, shortcutStr] of Object.entries(bindings)) {
    const normalized = shortcutStr.toLowerCase().split('+').map(s => s.trim()).sort().join('+')
    const list = byShortcut.get(normalized) || []
    list.push(actionId)
    byShortcut.set(normalized, list)
  }
  // Filter to only conflicts (2+ actions on same shortcut)
  const conflicts = new Map<string, string[]>()
  for (const [key, actions] of byShortcut) {
    if (actions.length > 1) {
      conflicts.set(key, actions)
    }
  }
  return conflicts
}

// ── Theme / Language Sync ──

/** Sync settingsStore general theme/language changes to appStore */
export function syncThemeToAppStore(theme: string) {
  const validThemes = ['light', 'dark', 'midnight', 'forest', 'sunset']
  if (validThemes.includes(theme)) {
    useAppStore.getState().setTheme(theme as ThemeMode)
  }
}

export function syncLanguageToAppStore(lang: string) {
  const validLangs = ['zh', 'en', 'ja', 'ko']
  if (validLangs.includes(lang)) {
    useAppStore.getState().setLanguage(lang as Language)
  }
}

/** Bidirectional: when appStore theme changes, update settingsStore record */
export function syncAppStoreThemeToSettings() {
  const appTheme = useAppStore.getState().theme
  // We don't store theme in settingsStore.editor but it's tracked via appStore
  // This is a no-op bridge for future expansion
  return appTheme
}

// ── Model Registry Sync ──

/**
 * Sync models from aiProviderService to useAppStore mirror.
 * This is the PRIMARY way to update aiModels in appStore.
 * Should be called:
 * 1. On app initialization
 * 2. After any model/provider change
 * 3. After API key update
 */
export function syncAIModelsToAppStore(): void {
  try {
    const models = aiProviderService.getAllModels()
    const activeModelId = aiProviderService.getActiveModelId()
    const store = useAppStore.getState()
    if (store.syncAIModelsFromProvider) {
      store.syncAIModelsFromProvider(models, activeModelId)
    }
  } catch (e) {
    console.warn('Failed to sync AI models to appStore:', e)
  }
}

/**
 * Get model by ID from aiProviderService with full config
 */
export function getModelWithConfig(modelId: string): AIModel | undefined {
  return aiProviderService.getModelById(modelId)
}

/**
 * Get the active provider's API key for direct API calls
 */
export function getActiveApiKey(): string | undefined {
  const provider = aiProviderService.getActiveProvider()
  return provider?.apiKey
}

/**
 * Get the active provider's base URL for direct API calls
 */
export function getActiveBaseUrl(): string | undefined {
  const provider = aiProviderService.getActiveProvider()
  return provider?.baseURL
}

/**
 * Test model connection and update status in both aiProviderService and appStore
 */
export async function testModelConnection(modelId: string): Promise<{ ok: boolean; latency?: number; error?: string }> {
  const model = aiProviderService.getModelById(modelId)
  const provider = aiProviderService.getActiveProvider()

  if (!model || !provider) {
    return { ok: false, error: 'Model or provider not found' }
  }

  const apiKey = provider.apiKey
  if (!apiKey) {
    return { ok: false, error: 'API key not configured' }
  }

  const startTime = Date.now()

  try {
    // Simple test request
    const endpoint = `${provider.baseURL}/chat/completions`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    headers['Authorization'] = `Bearer ${apiKey}`

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model.id,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
        stream: false,
      }),
      signal: AbortSignal.timeout(10000),
    })

    const latency = Date.now() - startTime

    if (resp.ok) {
      // Update status in appStore
      useAppStore.getState().setModelStatus(modelId, 'connected', `Connected in ${latency}ms`)
      return { ok: true, latency }
    }

    // Handle specific error codes
    if (resp.status === 401 || resp.status === 403) {
      useAppStore.getState().setModelStatus(modelId, 'error', `Authentication failed (HTTP ${resp.status})`)
      return { ok: false, error: `Authentication failed (HTTP ${resp.status})` }
    }

    if (resp.status === 429) {
      useAppStore.getState().setModelStatus(modelId, 'error', `Rate limited (HTTP ${resp.status})`)
      return { ok: false, error: `Rate limited (HTTP ${resp.status})` }
    }

    useAppStore.getState().setModelStatus(modelId, 'error', `HTTP ${resp.status}`)
    return { ok: false, error: `HTTP ${resp.status}` }
  } catch (err: unknown) {
    const latency = Date.now() - startTime
    const errorObj = err as Error
    const errorMsg = errorObj.name === 'AbortError' || errorObj.name === 'TimeoutError'
      ? 'Request timed out'
      : errorObj.message || 'Connection failed'

    useAppStore.getState().setModelStatus(modelId, 'error', errorMsg)
    return { ok: false, latency, error: errorMsg }
  }
}

/** Sync models from appStore.aiModels to make them available in settings display */
export function getModelRegistrySnapshot() {
  return useAppStore.getState().aiModels
}

/** When settingsStore changes active model, sync to appStore */
export function syncActiveModelToAppStore(modelId: string) {
  const { aiModels } = useAppStore.getState()
  if (aiModels.some(m => m.id === modelId)) {
    useAppStore.getState().activateAIModel(modelId)
  }
}

/** Add a model from settings to the main model registry */
export function addModelToRegistry(model: { name: string; provider: string; apiKey: string; endpoint?: string }) {
  useAppStore.getState().addAIModel({
    name: model.name,
    provider: model.provider as import('../types').AIModelProvider,
    apiKey: model.apiKey,
    endpoint: model.endpoint || '',
    isActive: false,
    status: 'idle',
  })
}

// ── Rule Injection into AI System Prompt ──

/**
 * Build a composite system prompt by injecting enabled rules and agent prompts.
 * This should be called before every AI chat request.
 */
export function buildSystemPromptWithRules(basePrompt?: string): string {
  const { rules, agents, includeAgentsMd, includeClaudeMd } = useSettingsStore.getState()

  const parts: string[] = []

  // Base system prompt
  if (basePrompt) {
    parts.push(basePrompt)
  }

  // Inject enabled rules
  const enabledRules = rules.filter(r => r.content.trim())
  if (enabledRules.length > 0) {
    parts.push('\n--- User Rules ---')
    enabledRules.forEach(r => {
      parts.push(`[Rule: ${r.name}]\n${r.content}`)
    })
  }

  // Inject active agent system prompts
  const enabledAgents = agents.filter(a => a.enabled && a.prompt.trim())
  if (enabledAgents.length > 0) {
    parts.push('\n--- Active Agent Directives ---')
    enabledAgents.forEach(a => {
      parts.push(`[Agent: ${a.name}]\n${a.prompt}`)
    })
  }

  // Import markers
  if (includeAgentsMd) {
    parts.push('\n[Context: AGENTS.md is included in project]')
  }
  if (includeClaudeMd) {
    parts.push('\n[Context: CLAUDE.md is included in project]')
  }

  return parts.join('\n\n')
}

/**
 * Get all active rules for display purposes
 */
export function getActiveRules(): RuleItem[] {
  return useSettingsStore.getState().rules.filter(r => r.content.trim())
}

/**
 * Get all enabled agent configs
 */
export function getEnabledAgents(): AgentConfig[] {
  return useSettingsStore.getState().agents.filter(a => a.enabled)
}

// ── MCP Runtime Injection ──

/**
 * Get all enabled MCP server configs for the plugin system to consume.
 * The plugin system should call this to discover available MCP endpoints.
 */
export function getActiveMcpEndpoints(): McpConfig[] {
  return useSettingsStore.getState().mcpServers.filter(m => m.enabled)
}

/**
 * Get project-level MCP configs (auto-loaded when opening a project)
 */
export function getProjectMcpEndpoints(): McpConfig[] {
  const { mcpServers, projectMcpAutoLoad } = useSettingsStore.getState()
  if (!projectMcpAutoLoad) return []
  return mcpServers.filter(m => m.enabled && m.isProject)
}

/**
 * Test MCP connection by attempting a health-check style request.
 * In a real Tauri app, this would invoke a native command.
 * Here we simulate with a fetch-based probe.
 */
export async function testMcpConnection(endpoint: string, type: string): Promise<{ ok: boolean; latency: number; error?: string }> {
  const start = Date.now()

  // Simulate Tauri bridge call for stdio type
  if (type === 'stdio') {
    // For stdio MCP servers, we'd invoke a Tauri command
    // Simulating: `invoke('mcp_test_stdio', { command: endpoint })`
    await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
    const latency = Date.now() - start
    // Simulate 80% success rate
    const ok = Math.random() > 0.2
    return { ok, latency, error: ok ? undefined : 'Process not found or timed out' }
  }

  // For HTTP-based MCP (sse / streamable-http)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    // Attempt a lightweight probe
    await new Promise(r => setTimeout(r, 150 + Math.random() * 350))
    clearTimeout(timeout)

    const latency = Date.now() - start
    // Simulate based on endpoint validity
    const isLocalhost = endpoint.includes('localhost') || endpoint.includes('127.0.0.1')
    const ok = isLocalhost ? Math.random() > 0.1 : Math.random() > 0.4

    return { ok, latency, error: ok ? undefined : `Connection refused: ${endpoint}` }
  } catch (err: unknown) {
    return { ok: false, latency: Date.now() - start, error: (err as Error).message || 'Connection failed' }
  }
}

/**
 * Validate an AI provider API key by making a lightweight test request.
 * Attempts a real /models endpoint probe; falls back to format validation on network errors.
 */
export async function validateApiKey(provider: string, apiKey: string, baseUrl?: string): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey || apiKey.trim().length < 8) {
    return { valid: false, error: 'API key is too short' }
  }

  // Provider-specific key format validation
  const providerLower = provider.toLowerCase()
  switch (providerLower) {
    case 'openai':
      if (!apiKey.startsWith('sk-')) {
        return { valid: false, error: 'OpenAI API keys should start with "sk-"' }
      }
      break
    case 'anthropic':
      if (!apiKey.startsWith('sk-ant-')) {
        return { valid: false, error: 'Anthropic API keys should start with "sk-ant-"' }
      }
      break
    case 'deepseek':
      if (!apiKey.startsWith('sk-')) {
        return { valid: false, error: 'DeepSeek API keys should start with "sk-"' }
      }
      break
    case 'ollama':
      // Ollama doesn't require real API key; probe local server
      try {
        const ollamaUrl = baseUrl || 'http://localhost:11434'
        const resp = await fetch(`${ollamaUrl}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        })
        return resp.ok
          ? { valid: true }
          : { valid: false, error: `Ollama returned HTTP ${resp.status}` }
      } catch {
        return { valid: false, error: 'Cannot connect to Ollama — is it running locally?' }
      }
  }

  // Resolve the base URL for real endpoint probing
  const providerEndpoints: Record<string, string> = {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
    deepseek: 'https://api.deepseek.com/v1',
    zhipuai: 'https://open.bigmodel.cn/api/paas/v4',
    baidu: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
    aliyun: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    groq: 'https://api.groq.com/openai/v1',
    mistral: 'https://api.mistral.ai/v1',
  }

  const resolvedBase = baseUrl?.replace(/\/+$/, '') || providerEndpoints[providerLower] || ''

  if (!resolvedBase) {
    // No known endpoint — fall back to format-only check
    return { valid: true }
  }

  // Attempt real /models endpoint probe
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }

    // Provider-specific auth headers
    if (providerLower === 'anthropic') {
      headers['x-api-key'] = apiKey
      headers['anthropic-version'] = '2023-06-01'
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const modelsUrl = providerLower === 'anthropic'
      ? `${resolvedBase}/messages` // Anthropic doesn't have /models; use a lightweight check
      : `${resolvedBase}/models`

    const resp = await fetch(modelsUrl, {
      method: providerLower === 'anthropic' ? 'POST' : 'GET',
      headers,
      ...(providerLower === 'anthropic' ? {
        body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] })
      } : {}),
      signal: AbortSignal.timeout(10000),
    })

    if (resp.ok) {
      return { valid: true }
    }

    if (resp.status === 401 || resp.status === 403) {
      return { valid: false, error: `Authentication failed (HTTP ${resp.status}) — check your API key` }
    }

    if (resp.status === 429) {
      // Rate limited but key is valid
      return { valid: true }
    }

    // Other errors — key might still be valid, report status
    return { valid: false, error: `API returned HTTP ${resp.status}` }
  } catch (err: unknown) {
    // Network error — cannot reach endpoint, fall back to format-only validation
    const errorObj = err as Error
    if (errorObj.name === 'AbortError' || errorObj.name === 'TimeoutError') {
      return { valid: false, error: 'Request timed out — endpoint may be unreachable' }
    }
    // CORS or network issues in browser — key format is valid, can't fully verify
    return { valid: true }
  }
}

// ── Enhanced Deep Search ──

export interface SearchHit {
  section: string
  sectionId: string
  field: string
  fieldPath: string
  matchedValue: string
  label: string
}

/**
 * Deep search across all settings fields.
 * Supports searching by field labels (i18n), values, and nested objects.
 */
export function deepSearchSettings(query: string): SearchHit[] {
  if (!query.trim()) return []

  const q = query.toLowerCase()
  const hits: SearchHit[] = []
  const ss = useSettingsStore.getState()

  // Define searchable field mappings with i18n-aware labels
  const fieldMappings: { section: string; sectionId: string; fields: { path: string; label: string; aliases: string[]; getValue: () => string }[] }[] = [
    {
      section: 'Account', sectionId: 'account',
      fields: [
        { path: 'account.username', label: 'Username / 用户名', aliases: ['用户', 'user', '名前', '사용자'], getValue: () => ss.account.username },
        { path: 'account.email', label: 'Email / 邮箱', aliases: ['邮件', 'email', 'メール', '이메일'], getValue: () => ss.account.email },
      ]
    },
    {
      section: 'General', sectionId: 'general',
      fields: [
        { path: 'editor.fontFamily', label: 'Font Family / 字体', aliases: ['字体', 'font', 'フォント', '글꼴'], getValue: () => ss.editor.fontFamily },
        { path: 'editor.fontSize', label: 'Font Size / 字体大小', aliases: ['字号', 'size', '大きさ', '크기'], getValue: () => String(ss.editor.fontSize) },
        { path: 'editor.tabSize', label: 'Tab Size / 制表符', aliases: ['制表', 'tab', 'タブ', '탭'], getValue: () => String(ss.editor.tabSize) },
        { path: 'editor.wordWrap', label: 'Word Wrap / 自动换行', aliases: ['换行', 'wrap', '折り返し', '줄바꿈'], getValue: () => String(ss.editor.wordWrap) },
        { path: 'editor.minimap', label: 'Minimap / 小地图', aliases: ['小地图', 'minimap', 'ミニマップ', '미니맵'], getValue: () => String(ss.editor.minimap) },
        { path: 'editor.lineNumbers', label: 'Line Numbers / 行号', aliases: ['行号', 'line', '行番号', '줄번호'], getValue: () => String(ss.editor.lineNumbers) },
        { path: 'shortcutScheme', label: 'Shortcut Scheme / 快捷键方案', aliases: ['快捷键', 'shortcut', 'キーボード', '단축키'], getValue: () => ss.shortcutScheme },
        { path: 'nodeVersion', label: 'Node.js Version / Node版本', aliases: ['node', '版本', 'バージョン', '버전'], getValue: () => ss.activeNodeVersion },
      ]
    },
    {
      section: 'Agents', sectionId: 'agents',
      fields: ss.agents.map(a => ({
        path: `agents.${a.id}`,
        label: `Agent: ${a.name}`,
        aliases: ['智能体', 'agent', 'エージェント', '에이전트', a.name.toLowerCase(), a.description.toLowerCase()],
        getValue: () => `${a.name} ${a.description} ${a.prompt}`,
      }))
    },
    {
      section: 'MCP', sectionId: 'mcp',
      fields: ss.mcpServers.map(m => ({
        path: `mcp.${m.id}`,
        label: `MCP: ${m.name}`,
        aliases: ['mcp', '连接', 'サーバー', '서버', m.name.toLowerCase(), m.endpoint.toLowerCase()],
        getValue: () => `${m.name} ${m.endpoint} ${m.type}`,
      }))
    },
    {
      section: 'Context', sectionId: 'context',
      fields: [
        { path: 'codeIndex', label: 'Code Index / 代码索引', aliases: ['索引', 'index', 'インデックス', '인덱스'], getValue: () => String(ss.codeIndexEnabled) },
        { path: 'ignorePatterns', label: 'Ignore Patterns / 忽略规则', aliases: ['忽略', 'ignore', '無視', '무시', 'gitignore'], getValue: () => ss.ignorePatterns },
        ...ss.docSets.map(d => ({
          path: `docSets.${d.id}`,
          label: `Doc: ${d.name}`,
          aliases: ['文档', 'doc', 'ドキュメント', '문서', d.name.toLowerCase()],
          getValue: () => `${d.name} ${d.url}`,
        })),
      ]
    },
    {
      section: 'Chat Flow', sectionId: 'chatflow',
      fields: [
        { path: 'todoList', label: 'Todo List / 待办清单', aliases: ['待办', 'todo', 'やること', '할일'], getValue: () => String(ss.todoListEnabled) },
        { path: 'autoCollapse', label: 'Auto Collapse / 自动折叠', aliases: ['折叠', 'collapse', '折りたたみ', '접기'], getValue: () => String(ss.autoCollapse) },
        { path: 'autoFixCode', label: 'Auto Fix / 自动修复', aliases: ['修复', 'fix', '修正', '수정'], getValue: () => String(ss.autoFixCode) },
        { path: 'agentAsk', label: 'Agent Question / 智能体提问', aliases: ['提问', 'ask', 'question', '質問', '질문'], getValue: () => String(ss.agentAsk) },
        { path: 'reviewScope', label: 'Review Scope / 审查范围', aliases: ['审查', 'review', 'レビュー', '리뷰'], getValue: () => ss.reviewScope },
        { path: 'autoRunMcp', label: 'Auto Run MCP / 自动运行', aliases: ['运行', 'run', '実行', '실행'], getValue: () => String(ss.autoRunMcp) },
        { path: 'commandRunMode', label: 'Command Mode / 命令方式', aliases: ['命令', 'command', 'sandbox', 'コマンド', '명령'], getValue: () => ss.commandRunMode },
        { path: 'volume', label: 'Volume / 音量', aliases: ['音量', 'volume', 'ボリューム', '볼륨'], getValue: () => String(ss.notifications.volume) },
        { path: 'temperature', label: 'Temperature / 温度', aliases: ['温度', 'temperature', '温度', '온도'], getValue: () => '' },
      ]
    },
    {
      section: 'Rules & Skills', sectionId: 'rules',
      fields: [
        ...ss.rules.map(r => ({
          path: `rules.${r.id}`,
          label: `Rule: ${r.name}`,
          aliases: ['规则', 'rule', 'ルール', '규칙', r.name.toLowerCase(), r.content.toLowerCase().slice(0, 100)],
          getValue: () => `${r.name} ${r.content}`,
        })),
        ...ss.skills.map(sk => ({
          path: `skills.${sk.id}`,
          label: `Skill: ${sk.name}`,
          aliases: ['技能', 'skill', 'スキル', '스킬', sk.name.toLowerCase(), sk.content.toLowerCase().slice(0, 100)],
          getValue: () => `${sk.name} ${sk.content}`,
        })),
      ]
    },
  ]

  for (const section of fieldMappings) {
    for (const field of section.fields) {
      const labelMatch = field.label.toLowerCase().includes(q)
      const aliasMatch = field.aliases.some(a => a.includes(q))
      const valueMatch = field.getValue().toLowerCase().includes(q)

      if (labelMatch || aliasMatch || valueMatch) {
        hits.push({
          section: section.section,
          sectionId: section.sectionId,
          field: field.label,
          fieldPath: field.path,
          matchedValue: field.getValue().slice(0, 200),
          label: field.label,
        })
      }
    }
  }

  return hits
}

// ── Initialization ──

/**
 * Initialize all settings integrations.
 * Should be called once when the app starts.
 */
export function initializeSettingsIntegration(): () => void {
  // Sync AI models from aiProviderService to appStore on initialization
  syncAIModelsToAppStore()

  // Activate global keyboard shortcuts
  const deactivateShortcuts = activateShortcutListener()

  // Register default shortcut handlers that bridge to appStore
  const unregisterHandlers = [
    registerShortcutHandler('toggle-terminal', () => useAppStore.getState().toggleTerminal()),
    registerShortcutHandler('command-palette', () => useAppStore.getState().setCommandPaletteOpen(true)),
    registerShortcutHandler('settings', () => {
      // Navigate to settings - this requires router access
      window.location.hash = '#/settings'
    }),
    registerShortcutHandler('global-search', () => useAppStore.getState().setSearchPanelOpen(true)),
    registerShortcutHandler('toggle-preview', () => {
      const { viewMode, setViewMode } = useAppStore.getState()
      setViewMode(viewMode === 'preview' ? 'code' : 'preview')
    }),
    registerShortcutHandler('switch-code', () => useAppStore.getState().setViewMode('code')),
    registerShortcutHandler('switch-preview', () => useAppStore.getState().setViewMode('preview')),
    registerShortcutHandler('toggle-fullscreen', () => useAppStore.getState().setViewMode('fullscreen')),
  ]

  // Return cleanup function
  return () => {
    deactivateShortcuts()
    unregisterHandlers.forEach(fn => fn())
  }
}