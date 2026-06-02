/**
 * @file ModelSettings.tsx
 * @description YYC³便携式智能AI系统 - AI模型服务管理模态框
 * Multi-provider (OpenAI / Claude / 智谱 / 通义千问 / DeepSeek / Ollama)
 * 4 Tabs: Providers / Ollama / MCP Tools / Smart Diagnostics
 * Fully token-driven via getThemeTokens — Liquid Glass aesthetic
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,ai,models,settings
 */

import {
  X, Plus, Trash2, Edit3, Check, ChevronDown, ChevronRight,
  Server, Cloud, Bot, Sparkles, RefreshCw, ExternalLink,
  Eye, EyeOff, AlertCircle, CheckCircle2, Copy, Search,
  Zap, Loader2, XCircle, Clock, Settings2,
  Shield, Globe, Cpu, Activity, Plug, BarChart3,
  FileCode2, PlusCircle, MinusCircle, Lightbulb, Bug,
  ArrowRight, Terminal, Wifi
} from 'lucide-react'
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { aiProviderService } from '../services/ai-provider'
import { useAppStore } from '../store'
import type { AIModelProvider, AIPerformanceMetrics, AIErrorAnalysis } from '../types'
import { getI18n, resolveKey } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'


/* ================================================================
   Types
   ================================================================ */

interface ProviderDef {
  id: string
  name: string
  shortName: string
  icon: React.ElementType
  color: string
  colorBg: string
  colorBorder: string
  description: string
  baseURL: string
  apiKeyUrl: string
  apiKeyPlaceholder: string
  models: ModelDef[]
  openaiCompatible: boolean
  docsUrl: string
}

interface ModelDef {
  id: string
  name: string
  description: string
  contextWindow?: string
  pricing?: string
}

interface MCPServerConfig {
  id: string
  name: string
  description: string
  command: string
  args: string[]
  env: Record<string, string>
  enabled: boolean
}

interface DiagnosticResult {
  providerId: string
  modelName: string
  status: 'idle' | 'testing' | 'success' | 'error'
  latency?: number
  message: string
  modelResponse?: string
  timestamp?: number
}

interface OllamaDetectedModel {
  name: string
  size: string
  status: 'online' | 'offline'
  quantization: string
}

/* ================================================================
   Provider Definitions — 6 providers
   ================================================================ */

const PROVIDERS: ProviderDef[] = [
  {
    id: 'openai', name: 'OpenAI', shortName: 'GPT', icon: Cloud,
    color: 'text-emerald-400', colorBg: 'bg-emerald-500/10', colorBorder: 'border-emerald-500/20',
    description: 'GPT-4o / o3 / o4-mini',
    baseURL: 'https://api.openai.com/v1/chat/completions',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    apiKeyPlaceholder: 'sk-proj-...', openaiCompatible: true,
    docsUrl: 'https://platform.openai.com/docs',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: 'msDescGpt4o', contextWindow: '128K', pricing: '$2.5/1M input' },
      { id: 'gpt-4o-mini', name: 'GPT-4o-mini', description: 'msDescGpt4oMini', contextWindow: '128K', pricing: '$0.15/1M input' },
      { id: 'o3-mini', name: 'o3-mini', description: 'msDescO3Mini', contextWindow: '128K', pricing: '$1.1/1M input' },
      { id: 'o4-mini', name: 'o4-mini', description: 'msDescO4Mini', contextWindow: '200K', pricing: '$1.1/1M input' },
    ],
  },
  {
    id: 'claude', name: 'Anthropic', shortName: 'Claude', icon: Shield,
    color: 'text-orange-400', colorBg: 'bg-orange-500/10', colorBorder: 'border-orange-500/20',
    description: 'Claude Sonnet / Haiku',
    baseURL: 'https://api.anthropic.com/v1/messages',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    apiKeyPlaceholder: 'sk-ant-...', openaiCompatible: false,
    docsUrl: 'https://docs.anthropic.com',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'msDescSonnet4', contextWindow: '200K', pricing: '$3/1M input' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'msDescHaiku', contextWindow: '200K', pricing: '$0.8/1M input' },
    ],
  },
  {
    id: 'zhipu', name: 'Zhipu AI', shortName: 'GLM', icon: Cpu,
    color: 'text-blue-400', colorBg: 'bg-blue-500/10', colorBorder: 'border-blue-500/20',
    description: 'GLM-5 / GLM-4 Series',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    apiKeyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    apiKeyPlaceholder: 'Enter Zhipu API Key...', openaiCompatible: true,
    docsUrl: 'https://open.bigmodel.cn/dev/api/normal-model/glm-4',
    models: [
      { id: 'glm-5', name: 'GLM-5', description: 'msDescGlm5', contextWindow: '128K' },
      { id: 'glm-4.5', name: 'GLM-4.5', description: 'msDescGlm45', contextWindow: '128K' },
      { id: 'glm-4.5-air', name: 'GLM-4.5-Air', description: 'msDescGlm45Air' },
    ],
  },
  {
    id: 'qwen', name: 'Qwen (Alibaba)', shortName: 'QWEN', icon: Globe,
    color: 'text-purple-400', colorBg: 'bg-purple-500/10', colorBorder: 'border-purple-500/20',
    description: 'DashScope OpenAI Compatible',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiKeyUrl: 'https://dashscope.console.aliyun.com/apiKey',
    apiKeyPlaceholder: 'sk-...', openaiCompatible: true,
    docsUrl: 'https://help.aliyun.com/zh/model-studio/getting-started/first-api-call-to-qwen',
    models: [
      { id: 'qwen3-max', name: 'Qwen3-Max', description: 'msDescQwen3Max', contextWindow: '128K' },
      { id: 'qwen-plus', name: 'Qwen-Plus', description: 'msDescQwenPlus', contextWindow: '128K' },
      { id: 'qwen3-coder-plus', name: 'Qwen3-Coder-Plus', description: 'msDescQwen3CoderPlus', contextWindow: '128K' },
    ],
  },
  {
    id: 'deepseek', name: 'DeepSeek', shortName: 'DS', icon: Zap,
    color: 'text-cyan-400', colorBg: 'bg-cyan-500/10', colorBorder: 'border-cyan-500/20',
    description: 'DeepSeek V3.2 / R1',
    baseURL: 'https://api.deepseek.com/v1/chat/completions',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    apiKeyPlaceholder: 'sk-...', openaiCompatible: true,
    docsUrl: 'https://api-docs.deepseek.com',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3.2', description: 'msDescDeepseekV3', contextWindow: '128K', pricing: '$0.27/1M input' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', description: 'msDescDeepseekR1', contextWindow: '128K', pricing: '$0.55/1M input' },
    ],
  },
  {
    id: 'ollama', name: 'Ollama (Local)', shortName: 'Local', icon: Server,
    color: 'text-amber-400', colorBg: 'bg-amber-500/10', colorBorder: 'border-amber-500/20',
    description: 'Local deploy · Private data',
    baseURL: 'http://localhost:11434/api/chat',
    apiKeyUrl: '', apiKeyPlaceholder: '', openaiCompatible: false,
    docsUrl: 'https://ollama.com',
    models: [
      { id: 'llama3.1:8b', name: 'Llama 3.1 8B', description: 'msDescLlama31' },
      { id: 'codellama:13b', name: 'CodeLlama 13B', description: 'msDescCodellama' },
      { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B', description: 'msDescQwen25Local' },
    ],
  },
]

const DEFAULT_MCP_SERVERS: MCPServerConfig[] = [
  { id: 'mcp-filesystem', name: 'Filesystem', description: 'msDescFilesystem', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '/app/designs'], env: {}, enabled: true },
  { id: 'mcp-fetch', name: 'Fetch', description: 'HTTP request tool', command: 'npx', args: ['-y', '@modelcontextprotocol/server-fetch'], env: {}, enabled: true },
  { id: 'mcp-postgres', name: 'PostgreSQL', description: 'msDescPostgres', command: 'npx', args: ['-y', '@modelcontextprotocol/server-postgres'], env: { DATABASE_URL: 'postgresql://user:pwd@localhost:5432/yanyucloud' }, enabled: false },
]

const SIMULATED_OLLAMA_MODELS: OllamaDetectedModel[] = [
  { name: 'llama3.1:8b', size: '4.7 GB', status: 'online', quantization: 'Q4_K_M' },
  { name: 'codellama:13b', size: '7.4 GB', status: 'online', quantization: 'Q4_0' },
  { name: 'qwen2.5:7b', size: '4.4 GB', status: 'online', quantization: 'Q4_K_M' },
  { name: 'deepseek-coder:6.7b', size: '3.8 GB', status: 'offline', quantization: 'Q5_K_M' },
  { name: 'mistral:7b', size: '4.1 GB', status: 'online', quantization: 'Q4_0' },
  { name: 'glm4:9b', size: '5.5 GB', status: 'online', quantization: 'Q4_K_M' },
]

/* ================================================================
   LocalStorage helpers
   ================================================================ */

const STORAGE_KEYS = {
  providerKeys: 'yyc3-provider-api-keys',
  providerUrls: 'yyc3-provider-urls',
  mcpServers: 'yyc3-mcp-servers',
  customProviders: 'yyc3-custom-providers',
}

function loadJSON<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback }
}
function saveJSON(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* quota */ }
}

/* ================================================================
   Sub-components
   ================================================================ */

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

/* ================================================================
   Provider Card — one per provider
   ================================================================ */

function ProviderCard({
  provider, apiKey, customUrl, onApiKeyChange, onUrlChange, onTestConnection,
  onSelectModel, activeModelKey, diagnostics, expanded, onToggle, onRemoveProvider, isCustom,
  onAddModel, onRemoveModel,
}: {
  provider: ProviderDef; apiKey: string; customUrl: string
  onApiKeyChange: (k: string) => void; onUrlChange: (u: string) => void
  onTestConnection: (modelId: string) => void
  onSelectModel: (modelId: string) => void
  activeModelKey: string | null
  diagnostics: Record<string, DiagnosticResult>
  expanded: boolean; onToggle: () => void
  onRemoveProvider?: () => void; isCustom?: boolean
  onAddModel?: (model: ModelDef) => void
  onRemoveModel?: (modelId: string) => void
}) {
  const { language } = useAppStore()
  const i = getI18n(language)
  const [showKey, setShowKey] = useState(false)
  const [editingUrl, setEditingUrl] = useState(false)
  const [urlDraft, setUrlDraft] = useState(customUrl || provider.baseURL)
  const [addingModel, setAddingModel] = useState(false)
  const [newModelName, setNewModelName] = useState('')
  const [newModelId, setNewModelId] = useState('')
  const Icon = provider.icon
  const activeUrl = customUrl || provider.baseURL
  const hasActiveModel = activeModelKey ? activeModelKey.startsWith(provider.id + ':') : false
  const hasAnyOnline = Object.values(diagnostics).some(d => d.status === 'success')
  const hasAnyError = Object.values(diagnostics).some(d => d.status === 'error')
  const isTesting = Object.values(diagnostics).some(d => d.status === 'testing')

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      hasActiveModel
        ? 'border-indigo-500/25 bg-indigo-500/[0.02]'
        : 'border-white/[0.06] bg-white/[0.02]'
    }`}
      style={{
        boxShadow: hasActiveModel
          ? '0 0 20px -6px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.04)'
          : 'inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
    >
      {/* Header */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-all">
        <div className={`w-8 h-8 rounded-lg ${provider.colorBg} border ${provider.colorBorder} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${provider.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-white/85" style={{ fontWeight: 500 }}>{provider.name}</span>
            {provider.openaiCompatible && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400/50 border border-indigo-500/10">
                OpenAI Compatible
              </span>
            )}
          </div>
          <div className="text-[10px] text-white/25 mt-0.5">{provider.description}</div>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveModel && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400/70 border border-indigo-500/15 shrink-0">
              {i.msUse}
            </span>
          )}
          {apiKey && <div className="w-2 h-2 rounded-full bg-emerald-400/60" title="API Key configured" />}
          {hasAnyOnline && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60" />}
          {hasAnyError && !hasAnyOnline && <AlertCircle className="w-3.5 h-3.5 text-red-400/60" />}
          {isTesting && <Loader2 className="w-3.5 h-3.5 text-cyan-400/60 animate-spin" />}
          <span className="text-[10px] text-white/20">{provider.models.length} {i.msModels}</span>
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-white/20" /> : <ChevronRight className="w-3.5 h-3.5 text-white/20" />}
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04]">
          {/* API Endpoint */}
          <div className="pt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white/30 uppercase tracking-wider">API Endpoint</label>
              <div className="flex items-center gap-1">
                {!editingUrl ? (
                  <button onClick={() => { setEditingUrl(true); setUrlDraft(activeUrl) }}
                    className="text-[9px] text-white/20 hover:text-white/50 px-1.5 py-0.5 rounded hover:bg-white/[0.04] transition-all">
                    <Edit3 className="w-3 h-3 inline mr-1" />{i.snEdit}
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { onUrlChange(urlDraft); setEditingUrl(false) }}
                      className="text-[9px] text-emerald-400/70 hover:text-emerald-400 px-1.5 py-0.5 rounded hover:bg-emerald-500/10 transition-all">
                      <Check className="w-3 h-3 inline mr-0.5" />{i.snSave}
                    </button>
                    <button onClick={() => setEditingUrl(false)}
                      className="text-[9px] text-white/20 hover:text-white/50 px-1.5 py-0.5 rounded hover:bg-white/[0.04] transition-all">
                      {i.msCancel}
                    </button>
                  </div>
                )}
                <CopyBtn text={activeUrl} />
              </div>
            </div>
            {editingUrl ? (
              <input value={urlDraft} onChange={e => setUrlDraft(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono focus:outline-none focus:border-indigo-500/40" />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[11px] text-white/40 font-mono truncate flex-1">{activeUrl}</span>
              </div>
            )}
          </div>

          {/* API Key */}
          {provider.id !== 'ollama' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-white/30 uppercase tracking-wider">API Key</label>
                {provider.apiKeyUrl && (
                  <a href={provider.apiKeyUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[9px] text-indigo-400/60 hover:text-indigo-400 transition-all">
                    <ExternalLink className="w-3 h-3" /> {i.msGetApiKey}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => onApiKeyChange(e.target.value)}
                    placeholder={provider.apiKeyPlaceholder}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 pr-8 text-[11px] text-white/70 font-mono focus:outline-none focus:border-indigo-500/40 placeholder:text-white/10" />
                  <button onClick={() => setShowKey(p => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/40 transition-all">
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              {!apiKey && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400/50">
                  <AlertCircle className="w-3 h-3" /> API Key not configured
                </div>
              )}
            </div>
          )}

          {/* Models */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white/30 uppercase tracking-wider">{i.msModelList}</label>
              <button onClick={() => setAddingModel(true)}
                className="flex items-center gap-1 text-[9px] text-white/25 hover:text-white/50 px-1.5 py-0.5 rounded hover:bg-white/[0.04] transition-all">
                <PlusCircle className="w-3 h-3" /> {i.msAddModel}
              </button>
            </div>
            <div className="space-y-1">
              {provider.models.map(model => {
                const diag = diagnostics[model.id]
                const modelKey = provider.id + ':' + model.id
                const isActive = activeModelKey === modelKey
                return (
                  <div key={model.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all group ${
                    isActive
                      ? 'bg-indigo-500/[0.08] border border-indigo-500/25'
                      : 'bg-white/[0.01] hover:bg-white/[0.03] border border-transparent'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isActive ? 'bg-indigo-400' :
                      diag?.status === 'success' ? 'bg-emerald-400' :
                      diag?.status === 'error' ? 'bg-red-400' :
                      diag?.status === 'testing' ? 'bg-cyan-400 animate-pulse' :
                      'bg-white/10'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] ${isActive ? 'text-indigo-300' : 'text-white/60'}`}>{model.name}</span>
                        {isActive && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400/80 border border-indigo-500/20">{i.msCurrentUse}</span>}
                        {model.contextWindow && <span className="text-[8px] text-white/15 bg-white/[0.03] px-1 py-0.5 rounded">{model.contextWindow}</span>}
                      </div>
                      <div className="text-[9px] text-white/20 truncate">{resolveKey(i, model.description)}</div>
                    </div>
                    {model.pricing && <span className="text-[8px] text-white/15">{model.pricing}</span>}
                    {diag?.status === 'success' && diag.latency != null && <span className="text-[9px] text-emerald-400/50">{diag.latency}ms</span>}
                    <div className="flex items-center gap-0.5">
                      {!isActive && (
                        <button onClick={() => onSelectModel(model.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] text-indigo-400/60 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-indigo-500/15">
                          <ArrowRight className="w-3 h-3" /> {i.msUse}
                        </button>
                      )}
                      <button onClick={() => onTestConnection(model.id)}
                        disabled={diag?.status === 'testing'}
                        className="p-1 rounded text-white/15 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all opacity-0 group-hover:opacity-100">
                        {diag?.status === 'testing' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                      </button>
                      {onRemoveModel && (
                        <button onClick={() => onRemoveModel(model.id)}
                          className="p-1 rounded text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                          title={i.msRemoveModel}>
                          <MinusCircle className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Inline add model form */}
            {addingModel && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-indigo-500/20 bg-indigo-500/[0.03]">
                <input value={newModelId} onChange={e => setNewModelId(e.target.value)}
                  placeholder="Model ID (e.g. gpt-4o)"
                  className="flex-1 bg-transparent text-[11px] text-white/70 font-mono placeholder:text-white/15 focus:outline-none" />
                <input value={newModelName} onChange={e => setNewModelName(e.target.value)}
                  placeholder="Display Name"
                  className="flex-1 bg-transparent text-[11px] text-white/70 placeholder:text-white/15 focus:outline-none" />
                <button
                  onClick={() => {
                    if (newModelId && newModelName && onAddModel) {
                      onAddModel({ id: newModelId, name: newModelName, description: 'msCustomModel' })
                      setNewModelId(''); setNewModelName(''); setAddingModel(false)
                    }
                  }}
                  disabled={!newModelId || !newModelName}
                  className="p-1 text-emerald-400/60 hover:text-emerald-400 disabled:opacity-30 transition-all">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setAddingModel(false); setNewModelId(''); setNewModelName('') }}
                  className="p-1 text-white/20 hover:text-white/50 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Test all + docs */}
          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => provider.models.forEach(m => onTestConnection(m.id))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] transition-all border ${provider.colorBg} ${provider.colorBorder} ${provider.color}`}>
              <Activity className="w-3 h-3" /> {i.msTestAll}
            </button>
            {provider.docsUrl && (
              <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all border border-white/[0.04]">
                <FileCode2 className="w-3 h-3" /> {i.msApiDocs}
              </a>
            )}
            {isCustom && onRemoveProvider && (
              <button onClick={onRemoveProvider}
                className="flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg text-[10px] text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all border border-red-500/10">
                <Trash2 className="w-3 h-3" /> {i.msRemoveProvider}
              </button>
            )}
          </div>

          {/* Diag error details */}
          {Object.entries(diagnostics).filter(([, d]) => d.status === 'error').map(([modelId, diag]) => (
            <div key={modelId} className="px-3 py-2 rounded-lg bg-red-500/[0.04] border border-red-500/10 space-y-1">
              <div className="flex items-center gap-1.5">
                <XCircle className="w-3 h-3 text-red-400/60" />
                <span className="text-[10px] text-red-400/70">{diag.modelName}</span>
                {diag.latency != null && <span className="text-[9px] text-white/15 ml-auto">{diag.latency}ms</span>}
              </div>
              <div className="text-[9px] text-white/30 pl-5">{diag.message}</div>
            </div>
          ))}
          {Object.entries(diagnostics).filter(([, d]) => d.status === 'success' && d.modelResponse).map(([modelId, diag]) => (
            <div key={modelId} className="px-3 py-2 rounded-lg bg-emerald-500/[0.03] border border-emerald-500/10 space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400/60" />
                <span className="text-[10px] text-emerald-400/70">{diag.modelName}</span>
                <span className="text-[9px] text-emerald-400/30 ml-auto">{diag.latency}ms</span>
              </div>
              <div className="text-[9px] text-white/25 pl-5 font-mono">{diag.modelResponse}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ================================================================
   MCP Config Panel
   ================================================================ */

function MCPConfigPanel() {
  const { language } = useAppStore()
  const i = getI18n(language)
  const [servers, setServers] = useState<MCPServerConfig[]>(() => loadJSON(STORAGE_KEYS.mcpServers, DEFAULT_MCP_SERVERS))
  const [addingServer, setAddingServer] = useState(false)
  const [newServer, setNewServer] = useState({ name: '', command: '', args: '', env: '', description: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [jsonMode, setJsonMode] = useState(false)
  const [jsonDraft, setJsonDraft] = useState('')
  const [jsonError, setJsonError] = useState('')

  useEffect(() => { saveJSON(STORAGE_KEYS.mcpServers, servers) }, [servers])

  const handleToggle = (id: string) => setServers(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  const handleRemove = (id: string) => setServers(prev => prev.filter(s => s.id !== id))
  const handleAdd = () => {
    if (!newServer.name || !newServer.command) return
    let envObj: Record<string, string> = {}
    try { if (newServer.env) envObj = JSON.parse(newServer.env) } catch { /* ignore */ }
    setServers(prev => [...prev, {
      id: 'mcp-' + Date.now(), name: newServer.name, description: newServer.description || newServer.name,
      command: newServer.command, args: newServer.args ? newServer.args.split(/\s+/) : [], env: envObj, enabled: true,
    }])
    setNewServer({ name: '', command: '', args: '', env: '', description: '' })
    setAddingServer(false)
  }
  const handleExportJson = () => {
    const mcpConfig: Record<string, any> = { mcpServers: {} }
    servers.filter(s => s.enabled).forEach(s => {
      mcpConfig.mcpServers[s.name.toLowerCase()] = { command: s.command, args: s.args, ...(Object.keys(s.env).length > 0 ? { env: s.env } : {}) }
    })
    setJsonDraft(JSON.stringify(mcpConfig, null, 2))
    setJsonMode(true); setJsonError('')
  }
  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft)
      const mcpServers = parsed.mcpServers || parsed
      const imported: MCPServerConfig[] = Object.entries(mcpServers).map(([name, conf]: [string, unknown]) => ({
        id: 'mcp-' + Date.now() + '-' + name, name, description: (conf as Record<string, unknown>).description as string || name,
        command: (conf as Record<string, unknown>).command as string || '', args: (conf as Record<string, unknown>).args as string[] || [], env: (conf as Record<string, unknown>).env as Record<string, string> || {}, enabled: true,
      }))
      setServers(imported); setJsonMode(false); setJsonError('')
    } catch (e: unknown) { setJsonError('JSON parse error: ' + (e as Error).message) }
  }

  const inputCls = "bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-[10px] text-white/70 font-mono focus:outline-none focus:border-violet-500/40 placeholder:text-white/10"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plug className="w-4 h-4 text-violet-400" />
          <span className="text-[12px] text-white/70">MCP Server Config</span>
          <span className="text-[9px] text-white/20 bg-white/[0.03] px-1.5 py-0.5 rounded">
            {servers.filter(s => s.enabled).length}/{servers.length} active
          </span>
        </div>
        <button onClick={handleExportJson}
          className="flex items-center gap-1 px-2 py-1 rounded text-[9px] text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all">
          <Terminal className="w-3 h-3" /> {jsonMode ? 'List' : 'JSON'}
        </button>
      </div>

      {jsonMode && (
        <div className="space-y-2">
          <textarea value={jsonDraft} onChange={e => { setJsonDraft(e.target.value); setJsonError('') }} rows={10}
            className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-[10px] text-white/60 font-mono focus:outline-none focus:border-violet-500/40 resize-none"
            placeholder='{"mcpServers": { "filesystem": { "command": "npx", "args": [...] } }}' />
          {jsonError && <div className="text-[10px] text-red-400/70 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{jsonError}</div>}
          <div className="flex items-center gap-2">
            <button onClick={handleImportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/20 text-violet-400 text-[10px] hover:bg-violet-500/25 transition-all">
              <Check className="w-3 h-3" /> Import JSON
            </button>
            <button onClick={() => setJsonMode(false)} className="px-3 py-1.5 rounded-lg text-white/30 text-[10px] hover:bg-white/[0.04] transition-all">Cancel</button>
            <CopyBtn text={jsonDraft} />
          </div>
          <div className="text-[9px] text-white/20 px-1">Standard MCP JSON format, compatible with Claude Desktop / Cursor / Windsurf</div>
        </div>
      )}

      {!jsonMode && (
        <div className="space-y-2">
          {servers.map(server => (
            <div key={server.id} className={`rounded-xl border p-3 space-y-2 transition-all ${
              server.enabled ? 'border-white/[0.06] bg-white/[0.02]' : 'border-white/[0.03] bg-white/[0.01] opacity-50'
            }`}>
              <div className="flex items-center gap-2.5">
                <button onClick={() => handleToggle(server.id)} className="shrink-0">
                  <div className={`w-8 h-4 rounded-full transition-all ${server.enabled ? 'bg-violet-500/30' : 'bg-white/[0.06]'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full transition-all mt-[1px] ${
                      server.enabled ? 'bg-violet-400 ml-[17px]' : 'bg-white/20 ml-[1px]'
                    }`} />
                  </div>
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-white/60">{server.name}</div>
                  <div className="text-[9px] text-white/20">{server.description}</div>
                </div>
                <button onClick={() => setEditingId(editingId === server.id ? null : server.id)}
                  className="p-1 rounded text-white/15 hover:text-white/40 hover:bg-white/[0.04] transition-all">
                  <Settings2 className="w-3 h-3" />
                </button>
                <button onClick={() => handleRemove(server.id)}
                  className="p-1 rounded text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {editingId === server.id && (
                <div className="space-y-2 pl-10">
                  <div className="text-[9px] text-white/20 space-y-1 font-mono">
                    <div className="flex items-center gap-2"><span className="text-white/30 w-16 shrink-0">command:</span><span className="text-white/50">{server.command}</span></div>
                    <div className="flex items-start gap-2"><span className="text-white/30 w-16 shrink-0">args:</span><span className="text-white/50 break-all">{JSON.stringify(server.args)}</span></div>
                    {Object.keys(server.env).length > 0 && (
                      <div className="flex items-start gap-2"><span className="text-white/30 w-16 shrink-0">env:</span><span className="text-white/50 break-all">{JSON.stringify(server.env)}</span></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {addingServer ? (
            <div className="rounded-xl border border-dashed border-violet-500/20 bg-violet-500/[0.03] p-3 space-y-2">
              <div className="text-[10px] text-violet-400/70 mb-1">{i.msAddMcpServer}</div>
              <div className="grid grid-cols-2 gap-2">
                <input value={newServer.name} onChange={e => setNewServer({ ...newServer, name: e.target.value })} placeholder={i.msMcpNamePlaceholder} className={inputCls} />
                <input value={newServer.command} onChange={e => setNewServer({ ...newServer, command: e.target.value })} placeholder={i.msMcpCommandPlaceholder} className={inputCls} />
              </div>
              <input value={newServer.args} onChange={e => setNewServer({ ...newServer, args: e.target.value })} placeholder={i.msMcpArgsPlaceholder} className={`w-full ${inputCls}`} />
              <input value={newServer.env} onChange={e => setNewServer({ ...newServer, env: e.target.value })} placeholder='Env JSON (e.g. {"KEY":"val"})' className={`w-full ${inputCls}`} />
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={!newServer.name || !newServer.command}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-400 text-[10px] hover:bg-violet-500/25 transition-all disabled:opacity-30 border border-violet-500/20">
                  <Plus className="w-3 h-3" /> {i.msAdd}
                </button>
                <button onClick={() => setAddingServer(false)} className="px-3 py-1.5 rounded-lg text-white/30 text-[10px] hover:bg-white/[0.04] transition-all">{i.msCancel}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingServer(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/[0.06] text-white/20 hover:text-white/40 hover:border-white/[0.12] transition-all text-[11px]">
              <Plus className="w-3.5 h-3.5" /> {i.msAddMcpServer}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ================================================================
   Smart Diagnostics Panel
   ================================================================ */

function SmartDiagnosticsPanel({
  providers, diagnostics, onRunDiagnostic, onSelectModel, activeModelKey,
}: {
  providers: ProviderDef[]
  diagnostics: Record<string, DiagnosticResult>
  onRunDiagnostic: (pid: string, mid: string) => void
  onSelectModel: (pid: string, mid: string) => void
  activeModelKey: string | null
}) {
  const { language } = useAppStore()
  const i = getI18n(language)
  const [running, setRunning] = useState(false)
  const allModels = useMemo(() => {
    const list: { providerId: string; providerName: string; modelId: string; modelName: string }[] = []
    providers.forEach(p => p.models.forEach(m => list.push({ providerId: p.id, providerName: p.shortName, modelId: m.id, modelName: m.name })))
    return list
  }, [providers])

  const handleRunAll = async () => {
    setRunning(true)
    for (const m of allModels) { onRunDiagnostic(m.providerId, m.modelId); await new Promise(r => setTimeout(r, 300)) }
    setTimeout(() => setRunning(false), 2000)
  }

  const totalModels = allModels.length
  const testedModels = Object.values(diagnostics).filter(d => d.status === 'success' || d.status === 'error').length
  const onlineModels = Object.values(diagnostics).filter(d => d.status === 'success').length
  const errorModels = Object.values(diagnostics).filter(d => d.status === 'error').length
  const avgLatency = (() => {
    const ls = Object.values(diagnostics).filter(d => d.latency != null).map(d => d.latency!)
    return ls.length > 0 ? Math.round(ls.reduce((a, b) => a + b, 0) / ls.length) : 0
  })()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: i.msTotalModels, value: String(totalModels), icon: Cpu, color: 'text-white/50' },
          { label: i.msTested, value: String(testedModels), icon: Activity, color: 'text-cyan-400' },
          { label: i.msOnline, value: String(onlineModels), icon: Wifi, color: 'text-emerald-400' },
          { label: i.msAvgLatency, value: avgLatency ? avgLatency + 'ms' : '-', icon: Clock, color: 'text-amber-400' },
        ].map(card => (
          <div key={card.label} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
            <card.icon className={`w-4 h-4 ${card.color} mx-auto mb-1`} />
            <div className={`text-[16px] ${card.color}`} style={{ fontWeight: 600 }}>{card.value}</div>
            <div className="text-[9px] text-white/20 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      <button onClick={handleRunAll} disabled={running}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/15 text-cyan-400 text-[12px] hover:from-cyan-500/20 hover:to-blue-500/20 transition-all disabled:opacity-50">
        {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
        {running ? i.msDiagRunning : i.msTestAll}
      </button>

      {providers.map(provider => {
        const providerDiags = provider.models.map(m => ({ model: m, diag: diagnostics[provider.id + ':' + m.id] })).filter(d => d.diag)
        if (providerDiags.length === 0) return null
        return (
          <div key={provider.id} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <provider.icon className={`w-3.5 h-3.5 ${provider.color}`} />
              <span className="text-[11px] text-white/50">{provider.name}</span>
              <span className="text-[9px] text-white/15">{providerDiags.filter(d => d.diag.status === 'success').length}/{providerDiags.length} {i.msOnline}</span>
            </div>
            {providerDiags.map(({ model, diag }) => {
              const modelKey = provider.id + ':' + model.id
              const isActive = activeModelKey === modelKey
              return (
                <div key={model.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all group ${
                  isActive ? 'bg-indigo-500/[0.06] border border-indigo-500/20' :
                  diag.status === 'success' ? 'bg-emerald-500/[0.03] border border-emerald-500/10 hover:border-emerald-500/20' :
                  diag.status === 'error' ? 'bg-red-500/[0.03] border border-red-500/10' :
                  'bg-white/[0.01] border border-white/[0.04]'
                }`}>
                  {isActive ? <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> :
                   diag.status === 'success' ? <CheckCircle2 className="w-3 h-3 text-emerald-400/60 shrink-0" /> :
                   diag.status === 'error' ? <XCircle className="w-3 h-3 text-red-400/60 shrink-0" /> :
                   <Loader2 className="w-3 h-3 text-cyan-400/60 animate-spin shrink-0" />}
                  <span className={`text-[10px] flex-1 ${isActive ? 'text-indigo-300' : 'text-white/50'}`}>{model.name}</span>
                  {isActive && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400/80 border border-indigo-500/20 shrink-0">{i.msCurrentUse}</span>}
                  {diag.latency != null && <span className={`text-[9px] ${isActive ? 'text-indigo-400/50' : diag.status === 'success' ? 'text-emerald-400/40' : 'text-white/20'}`}>{diag.latency}ms</span>}
                  {diag.status === 'error' && <span className="text-[9px] text-red-400/50 max-w-[180px] truncate">{diag.message}</span>}
                  {diag.status === 'success' && !isActive && (
                    <button onClick={() => onSelectModel(provider.id, model.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] text-indigo-400/60 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/15 transition-all opacity-0 group-hover:opacity-100 shrink-0">
                      <ArrowRight className="w-3 h-3" /> {i.msSelectUse}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {errorModels > 0 && (
        <div className="rounded-xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.04] to-orange-500/[0.02] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-[12px] text-amber-400/80" style={{ fontWeight: 500 }}>{i.arSuggestion}</span>
          </div>
          <div className="space-y-1.5 pl-6">
            {Object.values(diagnostics).filter(d => d.status === 'error').slice(0, 3).map((diag, idx) => (
              <div key={idx} className="text-[10px] text-white/35 flex items-start gap-1.5">
                <Bug className="w-3 h-3 text-amber-400/40 shrink-0 mt-0.5" />
                <span><strong className="text-amber-400/50">{diag.modelName}</strong>: {
                  diag.message.includes('401') ? i.msCheck401 :
                  diag.message.includes('429') ? i.msCheck429 :
                  diag.message.includes('fetch') ? i.msCheckNetwork :
                  i.msCheckGeneral
                }</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   Main: ModelSettings
   ================================================================ */

type TabKey = 'providers' | 'ollama' | 'mcp' | 'diagnostics' | 'performance'

/* ================================================================
   AI Performance & Cost Monitor Panel (ai-provider service)
   ================================================================ */

function AIPerformanceCostPanel({ t }: { t: ReturnType<typeof getThemeTokens> }) {
  const [metrics, setMetrics] = useState<AIPerformanceMetrics[]>([])
  const [errors, setErrors] = useState<AIErrorAnalysis[]>([])
  const [costData, setCostData] = useState<Map<string, { inputTokens: number; outputTokens: number; cost: number }>>(new Map())
  const [bestProvider, setBestProvider] = useState<string | null>(null)

  useEffect(() => {
    const refresh = () => {
      setMetrics(aiProviderService.getPerformanceMetrics())
      setErrors(aiProviderService.getErrorHistory())
      setCostData(aiProviderService.getCostReport())
      const best = aiProviderService.detectBestProvider()
      setBestProvider(best?.displayName ?? null)
    }
    refresh()
    const iv = setInterval(refresh, 3000)
    return () => clearInterval(iv)
  }, [])

  const providers = aiProviderService.listProviders()
  const totalCost = Array.from(costData.values()).reduce((s, c) => s + c.cost, 0)
  const totalTokens = Array.from(costData.values()).reduce((s, c) => s + c.inputTokens + c.outputTokens, 0)

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '活跃提供商', value: providers.filter(p => p.enabled).length.toString(), sub: `/ ${providers.length} 总计` },
          { label: '总成本', value: `$${totalCost.toFixed(4)}`, sub: `${totalTokens.toLocaleString()} tokens` },
          { label: '推荐提供商', value: bestProvider || '无数据', sub: '基于性能评分' },
          { label: '错误数', value: errors.length.toString(), sub: errors.length > 0 ? errors[0].errorType : '无错误' },
        ].map((c, idx) => (
          <div key={idx} className={`p-3 rounded-xl ${t.isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-slate-50 border border-slate-200'}`}>
            <div className={`text-[10px] ${t.text.dimmed}`}>{c.label}</div>
            <div className={`text-[16px] ${t.text.primary} mt-1`} style={{ fontWeight: 600 }}>{c.value}</div>
            <div className={`text-[9px] ${t.text.muted} mt-0.5`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Performance metrics table */}
      <div>
        <div className={`text-[12px] ${t.text.primary} mb-2`} style={{ fontWeight: 600 }}>性能指标</div>
        {metrics.length === 0 ? (
          <div className={`text-[11px] ${t.text.dimmed} text-center py-6`}>暂无性能数据 — 发送 AI 请求后将自动记录</div>
        ) : (
          <div className={`rounded-xl overflow-hidden border ${t.isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
            <table className="w-full text-[10px]">
              <thead>
                <tr className={t.isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}>
                  {['提供商', '模型', '延迟', '吞吐量', '成功率', '请求数'].map(h => (
                    <th key={h} className={`px-3 py-2 text-left ${t.text.dimmed}`} style={{ fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.slice(-10).map((m, idx) => (
                  <tr key={idx} className={`border-t ${t.isDark ? 'border-white/[0.04]' : 'border-slate-100'}`}>
                    <td className={`px-3 py-1.5 ${t.text.secondary}`}>{m.providerId}</td>
                    <td className={`px-3 py-1.5 ${t.text.secondary}`}>{m.modelId}</td>
                    <td className={`px-3 py-1.5 ${m.latency > 2000 ? 'text-amber-400' : 'text-emerald-400'}`}>{m.latency}ms</td>
                    <td className={`px-3 py-1.5 ${t.text.secondary}`}>{m.throughput.toFixed(1)} t/s</td>
                    <td className={`px-3 py-1.5 ${m.successRate >= 0.9 ? 'text-emerald-400' : 'text-red-400'}`}>{(m.successRate * 100).toFixed(0)}%</td>
                    <td className={`px-3 py-1.5 ${t.text.secondary}`}>{m.totalRequests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cost breakdown */}
      <div>
        <div className={`text-[12px] ${t.text.primary} mb-2`} style={{ fontWeight: 600 }}>成本明细</div>
        {costData.size === 0 ? (
          <div className={`text-[11px] ${t.text.dimmed} text-center py-4`}>暂无成本数据</div>
        ) : (
          <div className="space-y-1.5">
            {Array.from(costData.entries()).map(([key, data]) => (
              <div key={key} className={`flex items-center justify-between px-3 py-2 rounded-lg ${t.isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                <span className={`text-[11px] ${t.text.secondary}`}>{key}</span>
                <div className="flex items-center gap-4 text-[10px]">
                  <span className={t.text.dimmed}>入 {data.inputTokens.toLocaleString()}</span>
                  <span className={t.text.dimmed}>出 {data.outputTokens.toLocaleString()}</span>
                  <span className={`${t.text.primary}`} style={{ fontWeight: 600 }}>${data.cost.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error history */}
      {errors.length > 0 && (
        <div>
          <div className={`text-[12px] ${t.text.primary} mb-2`} style={{ fontWeight: 600 }}>错误历史</div>
          <div className="space-y-1.5">
            {errors.slice(-5).map((e, idx) => (
              <div key={idx} className={`px-3 py-2 rounded-lg border ${t.isDark ? 'bg-red-500/[0.04] border-red-500/10' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-100 text-red-600'}`}>{e.errorType}</span>
                  <span className={`text-[9px] ${t.text.dimmed}`}>{new Date(e.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className={`text-[10px] ${t.text.secondary} mt-1`}>{e.errorMessage}</div>
                {e.suggestions.length > 0 && (
                  <div className={`text-[9px] ${t.text.muted} mt-1`}>建议: {e.suggestions[0]}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ModelSettings() {
  const {
    theme, language, modelSettingsOpen, closeModelSettings, aiModels,
    addAIModel, updateAIModel, activateAIModel, activeModelId,
  } = useAppStore()

  const t = getThemeTokens(theme)
  const i = getI18n(language)
  const [activeTab, setActiveTab] = useState<TabKey>('providers')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedProvider, setExpandedProvider] = useState<string | null>('zhipu')

  // Provider API keys & URLs - synced from aiProviderService
  // These are now computed from the service state, not local storage
  const providers = aiProviderService.listProviders()

  const [customProviders, setCustomProviders] = useState<ProviderDef[]>(() => loadJSON(STORAGE_KEYS.customProviders, []))
  const [addingProvider, setAddingProvider] = useState(false)
  const [newProvider, setNewProvider] = useState({ name: '', baseURL: '', apiKeyUrl: '' })
  const [diagnostics, setDiagnostics] = useState<Record<string, DiagnosticResult>>({})
  const pendingActivationRef = useRef<string | null>(null)
  const [selectionToast, setSelectionToast] = useState<string | null>(null)

  // Ollama
  const [ollamaHost, setOllamaHost] = useState('http://localhost:11434')
  const [ollamaScanning, setOllamaScanning] = useState(false)
  const [ollamaModels, setOllamaModels] = useState<OllamaDetectedModel[]>([])
  const [ollamaConnected, setOllamaConnected] = useState(false)

  // Auto-activate pending model
  useEffect(() => {
    const pn = pendingActivationRef.current
    if (!pn) return
    const found = aiModels.find(m => m.name === pn && !m.isActive)
    if (found) { pendingActivationRef.current = null; activateAIModel(found.id) }
  }, [aiModels, activateAIModel])

  // Persist custom providers only (API keys/URLs are now in aiProviderService)
  useEffect(() => { saveJSON(STORAGE_KEYS.customProviders, customProviders) }, [customProviders])

  // Sync API keys from provider config → matching store models
  useEffect(() => {
    for (const provider of providers) {
      const key = provider.apiKey
      if (!key) continue
      const url = provider.baseURL
      for (const storeModel of aiModels) {
        if (storeModel.endpoint === url && storeModel.apiKey !== key) {
          const isMatch = PROVIDERS.some(p => p.id === provider.id && (p.models.some(m => m.id === storeModel.name || m.name === storeModel.name)))
          if (isMatch) updateAIModel(storeModel.id, { apiKey: key })
        }
      }
    }
  }, [providers, aiModels, updateAIModel])

  // Provider-scoped model mutations
  const handleProviderAddModel = useCallback((providerId: string, model: ModelDef) => {
    setCustomProviders(prev => prev.map(p =>
      p.id === providerId ? { ...p, models: [...p.models, model] } : p
    ))
  }, [])
  const handleProviderRemoveModel = useCallback((providerId: string, modelId: string) => {
    setCustomProviders(prev => prev.map(p =>
      p.id === providerId ? { ...p, models: p.models.filter(m => m.id !== modelId) } : p
    ))
  }, [])

  const allProviders = useMemo(() => [...PROVIDERS, ...customProviders], [customProviders])
  const filteredProviders = useMemo(() => {
    if (!searchQuery) return allProviders
    const q = searchQuery.toLowerCase()
    return allProviders.filter(p => p.name.toLowerCase().includes(q) || p.shortName.toLowerCase().includes(q) || p.models.some(m => m.name.toLowerCase().includes(q)))
  }, [allProviders, searchQuery])

  // Real HTTP diagnostic test
  const handleTestConnection = useCallback(async (providerId: string, modelId: string) => {
    const provider = allProviders.find(p => p.id === providerId)
    if (!provider) return
    const model = provider.models.find(m => m.id === modelId)
    if (!model) return
    const diagKey = providerId + ':' + modelId

    // Get config from aiProviderService
    const providerConfig = aiProviderService.getProvider(providerId)
    const apiKey = providerConfig?.apiKey || ''
    const baseUrl = providerConfig?.baseURL || provider.baseURL

    // Check API key
    if (providerId !== 'ollama' && !apiKey) {
      setDiagnostics(prev => ({ ...prev, [diagKey]: { providerId, modelName: model.name, status: 'error', message: 'API Key not configured', timestamp: Date.now() } }))
      return
    }

    setDiagnostics(prev => ({ ...prev, [diagKey]: { providerId, modelName: model.name, status: 'testing', message: 'Sending test request...', timestamp: Date.now() } }))

    const startTime = Date.now()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)

    try {
      let resp: Response
      if (providerId === 'ollama') {
        // Ollama endpoint
        const chatUrl = baseUrl.includes('/api/chat') ? baseUrl : baseUrl.replace(/\/api\/.*$/, '').replace(/\/+$/, '') + '/api/chat'
        resp = await fetch(chatUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model.id, messages: [{ role: 'user', content: 'Hi, respond with: YYC3_OK' }], stream: false }),
          signal: controller.signal,
        })
      } else if (providerId === 'claude' || baseUrl.includes('anthropic.com')) {
        // Claude endpoint
        resp = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({ model: model.id, max_tokens: 20, messages: [{ role: 'user', content: 'Hi, respond with: YYC3_OK' }] }),
          signal: controller.signal,
        })
      } else {
        // OpenAI compatible endpoint
        const chatUrl = baseUrl.includes('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`
        resp = await fetch(chatUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model: model.id, messages: [{ role: 'user', content: 'Hi, respond with: YYC3_OK' }], stream: false, max_tokens: 20 }),
          signal: controller.signal,
        })
      }

      clearTimeout(timer)
      const latency = Date.now() - startTime

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '')
        let detail = ''
        try { const j = JSON.parse(errText); detail = j.error?.message || j.message || errText.slice(0, 200) } catch { detail = errText.slice(0, 200) }
        const statusMsg = resp.status === 401 ? 'Invalid API Key (401)' : resp.status === 404 ? 'Endpoint not found (404)' : resp.status === 429 ? 'Rate limited (429)' : `HTTP ${resp.status}`
        setDiagnostics(prev => ({ ...prev, [diagKey]: { providerId, modelName: model.name, status: 'error', message: statusMsg + (detail ? ': ' + detail : ''), latency } }))
        return
      }

      const data = await resp.json().catch(() => null)
      let reply = ''
      if (providerId === 'ollama') reply = data?.message?.content || ''
      else if (providerId === 'claude') reply = data?.content?.[0]?.text || ''
      else reply = data?.choices?.[0]?.message?.content || ''

      setDiagnostics(prev => ({ ...prev, [diagKey]: { providerId, modelName: model.name, status: 'success', message: 'Connected', latency, modelResponse: reply.slice(0, 100) } }))
    } catch (err: unknown) {
      clearTimeout(timer)
      const latency = Date.now() - startTime
      const error = err as Error
      if (error.name === 'AbortError') {
        setDiagnostics(prev => ({ ...prev, [diagKey]: { providerId, modelName: model.name, status: 'error', message: 'Timeout (10s)', latency } }))
      } else {
        const msg = (error.message || '').includes('fetch') || (error.message || '').includes('NetworkError') ? 'Network error, check CORS or service status' : 'Test error: ' + (error.message || '').slice(0, 200)
        setDiagnostics(prev => ({ ...prev, [diagKey]: { providerId, modelName: model.name, status: 'error', message: msg, latency } }))
      }
    }
  }, [allProviders])

  // Select model → add to store + activate
  const handleSelectModel = useCallback((providerId: string, modelId: string) => {
    console.log('[ModelSettings] handleSelectModel called:', { providerId, modelId })

    const provider = allProviders.find(p => p.id === providerId)
    if (!provider) {
      console.error('[ModelSettings] Provider not found:', providerId)
      return
    }
    const model = provider.models.find(m => m.id === modelId)
    if (!model) {
      console.error('[ModelSettings] Model not found:', modelId)
      return
    }

    // Get config from aiProviderService
    const providerConfig = aiProviderService.getProvider(providerId)
    const url = providerConfig?.baseURL || provider.baseURL
    const key = providerConfig?.apiKey || ''

    const providerType: AIModelProvider = providerId === 'openai' ? 'openai' : providerId === 'ollama' ? 'ollama' : 'custom'

    console.log('[ModelSettings] Looking for existing model:', { name: model.id, provider: providerType })

    // Check if model exists in store by name (match both model.id and model.name)
    const existing = aiModels.find(m => 
      (m.name === model.id || m.name === model.name) && m.provider === providerType
    )
    if (existing) {
      console.log('[ModelSettings] Found existing model, activating:', existing.id)
      // Just activate existing model
      activateAIModel(existing.id)
    } else {
      console.log('[ModelSettings] No existing model found, adding new model')
      // Add new model - it will be activated via auto-activate effect
      pendingActivationRef.current = model.id
      addAIModel({ name: model.id, provider: providerType, endpoint: url, apiKey: key, isActive: false })
    }
    setSelectionToast(model.name)
    setTimeout(() => setSelectionToast(null), 2500)
  }, [allProviders, aiModels, activateAIModel, addAIModel])

  // Compute active model key
  const activeModelKey = useMemo(() => {
    if (!activeModelId) return null
    const active = aiModels.find(m => m.id === activeModelId)
    if (!active) return null
    
    // Try to match by model name or ID
    for (const provider of allProviders) {
      for (const model of provider.models) {
        // Match by model ID
        if (active.name === model.id) return provider.id + ':' + model.id
        // Match by model name
        if (active.name === model.name) return provider.id + ':' + model.id
        // Match by lowercase comparison
        if (active.name.toLowerCase() === model.name.toLowerCase()) return provider.id + ':' + model.id
      }
    }
    return null
  }, [activeModelId, aiModels, allProviders])

  // Add custom provider
  const handleAddProvider = useCallback(() => {
    if (!newProvider.name || !newProvider.baseURL) return
    const id = 'custom-' + Date.now()
    setCustomProviders(prev => [...prev, {
      id, name: newProvider.name, shortName: newProvider.name.slice(0, 4), icon: Bot,
      color: 'text-pink-400', colorBg: 'bg-pink-500/10', colorBorder: 'border-pink-500/20',
      description: 'Custom OpenAI-compatible service', baseURL: newProvider.baseURL,
      apiKeyUrl: newProvider.apiKeyUrl, apiKeyPlaceholder: 'sk-...', openaiCompatible: true, docsUrl: '', models: [],
    }])
    setNewProvider({ name: '', baseURL: '', apiKeyUrl: '' }); setAddingProvider(false); setExpandedProvider(id)
  }, [newProvider])

  // Ollama scan
  const handleScanOllama = useCallback(() => {
    setOllamaScanning(true); setOllamaModels([]); setOllamaConnected(false)
    const url = ollamaHost.replace(/\/+$/, '') + '/api/tags'
    
    console.log('[ModelSettings] Scanning Ollama:', url)
    
    fetch(url, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    })
      .then(r => { 
        console.log('[ModelSettings] Ollama response status:', r.status)
        if (!r.ok) throw new Error('HTTP ' + r.status)
        return r.json() 
      })
      .then(data => {
        console.log('[ModelSettings] Ollama models found:', data.models?.length || 0)
        const models: OllamaDetectedModel[] = (data.models || []).map((m: Record<string, unknown>) => ({
          name: (m.name || m.model) as string, size: m.size ? ((m.size as number) / 1e9).toFixed(1) + ' GB' : 'N/A',
          status: 'online' as const, quantization: ((m.details as Record<string, unknown>)?.quantization_level || (m.details as Record<string, unknown>)?.family || 'N/A') as string,
        }))
        setOllamaModels(models); setOllamaConnected(true); setOllamaScanning(false)
        toast.success(`Detected ${models.length} Ollama models`)
      })
      .catch((err: unknown) => {
        console.error('[ModelSettings] Ollama scan failed:', err)
        setOllamaScanning(false)
        
        const error = err as Error
        const isCorsError = error.message?.includes('CORS') || error.message?.includes('fetch') || error.name === 'TypeError'
        
        if (isCorsError) {
          toast.error('CORS blocked - see docs/YYC3-P0-Ollama-CORS 配置指南.md')
          // Still show simulated models for demo
          let idx = 0
          const interval = setInterval(() => {
            if (idx < SIMULATED_OLLAMA_MODELS.length) {
              const m = SIMULATED_OLLAMA_MODELS[idx]; if (m) setOllamaModels(prev => [...prev, m]); idx++
            } else { clearInterval(interval); setOllamaConnected(false) }
          }, 350)
        } else if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          toast.error('Ollama connection timeout - ensure "ollama serve" is running')
        } else {
          toast.error('Ollama scan failed: ' + error.message)
        }
      })
  }, [ollamaHost])

  const handleImportOllama = useCallback((model: OllamaDetectedModel) => {
    console.log('[ModelSettings] Importing Ollama model:', model.name)
    
    // Check if model already exists in aiModels
    const existing = aiModels.find(m => m.name === model.name && m.provider === 'ollama')
    if (existing) {
      console.log('[ModelSettings] Model already exists, activating:', existing.id)
      activateAIModel(existing.id)
      toast.success(`Model ${model.name} already imported`)
      return
    }
    
    // Add model to aiProviderService directly with stable ID
    const endpoint = ollamaHost.replace(/\/+$/, '') + '/api/chat'
    const modelId = 'ollama-' + model.name.replace(/[^a-zA-Z0-9]/g, '-')
    
    console.log('[ModelSettings] Adding model to aiProviderService:', { modelId, name: model.name })
    
    // Add to aiProviderService's ollama provider
    aiProviderService.addModel('ollama', {
      id: modelId,
      name: model.name,
      provider: 'ollama',
      endpoint: endpoint,
      apiKey: '',
      isActive: false,
      isDetected: true,
    })
    
    // Force sync to appStore immediately (no setTimeout)
    aiProviderService.syncToAppStore()
    
    // Activate the model immediately
    const added = useAppStore.getState().aiModels.find(m => m.name === model.name && m.provider === 'ollama')
    if (added) {
      console.log('[ModelSettings] Found added model, activating:', added.id)
      activateAIModel(added.id)
    }
    
    toast.success(`Imported ${model.name}`)
  }, [ollamaHost, aiModels, activateAIModel, toast])

  if (!modelSettingsOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className={`absolute inset-0 ${t.surface.modalBackdrop} backdrop-blur-md`} onClick={closeModelSettings} />
      <div className={`relative w-[920px] max-h-[88vh] ${t.surface.modal} rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl`}
        style={{ boxShadow: t.shadow.modal, animation: 'yyc3ModalIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${t.border.subtle}`}>
          <div className={`w-9 h-9 rounded-xl ${t.accent.primaryBg} border border-indigo-500/20 flex items-center justify-center`}>
            <Sparkles className={`w-4 h-4 ${t.accent.primary}`} />
          </div>
          <div className="flex-1">
            <div className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 600 }}>{i.msTitle}</div>
            <div className={`text-[11px] ${t.text.label}`}>{i.msSubtitle}</div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${t.isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-slate-50 border border-slate-200'} w-48`}>
            <Search className={`w-3.5 h-3.5 ${t.text.dimmed}`} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={i.msSearchPlaceholder}
              className={`bg-transparent text-[11px] ${t.text.secondary} placeholder:${t.text.dimmed} focus:outline-none w-full`} />
          </div>
          <button onClick={closeModelSettings} className={`p-2 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 px-5 pt-3 pb-0 border-b ${t.border.subtle} overflow-x-auto`}>
          {([
            { key: 'providers' as const, label: i.msProviders, icon: Cloud },
            { key: 'ollama' as const, label: 'Ollama', icon: Server },
            { key: 'mcp' as const, label: 'MCP', icon: Plug },
            { key: 'diagnostics' as const, label: i.msDiagnostics, icon: Activity },
            { key: 'performance' as const, label: '性能/成本', icon: BarChart3 },
          ]).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[11px] ${t.transition} border-b-2 whitespace-nowrap -mb-px ${
                activeTab === key
                  ? `${t.accent.activeText} border-current ${t.isDark ? 'bg-white/3' : 'bg-slate-50'}`
                  : `${t.text.muted} border-transparent ${t.isDark ? 'hover:text-white/50' : 'hover:text-slate-600'}`
              }`} style={{ fontWeight: activeTab === key ? 500 : 400 }}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 custom-scrollbar">
          {/* Providers Tab */}
          {activeTab === 'providers' && (
            <div className="space-y-3">
              {/* Active model banner */}
              {activeModelId && (() => {
                const activeModel = aiModels.find(m => m.id === activeModelId)
                const matchedProvider = activeModelKey ? allProviders.find(p => activeModelKey.startsWith(p.id + ':')) : null
                return (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-indigo-500/[0.06] border border-indigo-500/15 mb-1"
                    style={{ boxShadow: '0 0 16px -4px rgba(99,102,241,0.1)' }}>
                    {matchedProvider ? (
                      <div className={`w-6 h-6 rounded-lg ${matchedProvider.colorBg} border ${matchedProvider.colorBorder} flex items-center justify-center`}>
                        <matchedProvider.icon className={`w-3 h-3 ${matchedProvider.color}`} />
                      </div>
                    ) : <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-indigo-300" style={{ fontWeight: 500 }}>{activeModel?.name || i.msUnknown}</span>
                        {matchedProvider && <span className="text-[9px] text-white/20">{matchedProvider.name}</span>}
                      </div>
                      <div className="text-[9px] text-white/15 font-mono truncate">{activeModel?.endpoint}</div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400/70 border border-indigo-500/15 shrink-0">Active</span>
                  </div>
                )
              })()}

              {filteredProviders.map(provider => {
                const providerDiags: Record<string, DiagnosticResult> = {}
                provider.models.forEach(m => { const d = diagnostics[provider.id + ':' + m.id]; if (d) providerDiags[m.id] = d })
                // Get API key from aiProviderService
                const providerConfig = aiProviderService.getProvider(provider.id)
                const apiKey = providerConfig?.apiKey || ''
                const baseUrl = providerConfig?.baseURL || provider.baseURL
                return (
                  <ProviderCard key={provider.id} provider={provider} apiKey={apiKey} customUrl={baseUrl}
                    onApiKeyChange={key => aiProviderService.setApiKey(provider.id, key)}
                    onUrlChange={url => aiProviderService.updateProvider(provider.id, { baseURL: url })}
                    onTestConnection={modelId => handleTestConnection(provider.id, modelId)}
                    onSelectModel={modelId => handleSelectModel(provider.id, modelId)}
                    activeModelKey={activeModelKey} diagnostics={providerDiags}
                    expanded={expandedProvider === provider.id}
                    onToggle={() => setExpandedProvider(prev => prev === provider.id ? null : provider.id)}
                    isCustom={!PROVIDERS.find(p => p.id === provider.id)}
                    onRemoveProvider={!PROVIDERS.find(p => p.id === provider.id) ? () => setCustomProviders(prev => prev.filter(p => p.id !== provider.id)) : undefined}
                    onAddModel={model => handleProviderAddModel(provider.id, model)}
                    onRemoveModel={!PROVIDERS.find(p => p.id === provider.id) ? (modelId => handleProviderRemoveModel(provider.id, modelId)) : undefined} />
                )
              })}

              {/* Add custom provider */}
              {addingProvider ? (
                <div className="rounded-xl border border-dashed border-pink-500/20 bg-pink-500/[0.03] p-4 space-y-3">
                  <div className="text-[11px] text-pink-400/70 mb-1" style={{ fontWeight: 500 }}>{i.msAddCustomProvider}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={newProvider.name} onChange={e => setNewProvider(p => ({ ...p, name: e.target.value }))} placeholder={i.msProviderName}
                      className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[11px] text-white/70 placeholder:text-white/10 focus:outline-none focus:border-pink-500/40" />
                    <input value={newProvider.apiKeyUrl} onChange={e => setNewProvider(p => ({ ...p, apiKeyUrl: e.target.value }))} placeholder={i.msApiKeyUrl}
                      className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[11px] text-white/70 placeholder:text-white/10 focus:outline-none focus:border-pink-500/40 font-mono" />
                  </div>
                  <input value={newProvider.baseURL} onChange={e => setNewProvider(p => ({ ...p, baseURL: e.target.value }))} placeholder={i.msBaseUrlPlaceholder}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[11px] text-white/70 placeholder:text-white/10 focus:outline-none focus:border-pink-500/40 font-mono" />
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleAddProvider} disabled={!newProvider.name || !newProvider.baseURL}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-pink-500/15 text-pink-400 text-[11px] hover:bg-pink-500/25 transition-all disabled:opacity-30 border border-pink-500/20">
                      <Plus className="w-3 h-3" /> {i.msAddProvider}
                    </button>
                    <button onClick={() => setAddingProvider(false)} className="px-4 py-2 rounded-lg text-white/30 text-[11px] hover:bg-white/[0.04] transition-all">{i.msCancel}</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingProvider(true)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed text-[12px] transition-all ${
                    t.isDark ? 'border-white/[0.08] text-white/25 hover:text-white/50 hover:border-white/[0.15]' : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                  }`}>
                  <Plus className="w-4 h-4" /> {i.msAddProvider}
                </button>
              )}

              <div className="px-4 py-2.5 rounded-xl bg-indigo-500/[0.03] border border-indigo-500/10 flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-indigo-400/50 shrink-0 mt-0.5" />
                <div className="text-[10px] text-white/25">
                  <strong className="text-indigo-400/40">{i.msTip}:</strong> {i.msTipContent}
                </div>
              </div>
            </div>
          )}

          {/* Ollama Tab */}
          {activeTab === 'ollama' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-amber-400" />
                  <span className={`text-[12px] ${t.text.secondary}`}>{i.msOllamaHint}</span>
                  <div className={`ml-auto flex items-center gap-1.5 text-[10px] ${ollamaConnected ? 'text-emerald-400' : t.text.dimmed}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${ollamaConnected ? 'bg-emerald-400' : 'bg-white/15'}`} />
                    {ollamaConnected ? i.wsConnected : i.wsDisconnected}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input value={ollamaHost} onChange={e => setOllamaHost(e.target.value)}
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/70 font-mono focus:outline-none focus:border-amber-500/40" />
                  <button onClick={handleScanOllama} disabled={ollamaScanning}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/15 text-amber-400 text-[11px] hover:bg-amber-500/25 transition-all disabled:opacity-50 border border-amber-500/20">
                    <RefreshCw className={`w-3.5 h-3.5 ${ollamaScanning ? 'animate-spin' : ''}`} />
                    {ollamaScanning ? i.pvScanning : i.pvAutoDetect}
                  </button>
                </div>
                <div className={`text-[10px] ${t.text.dimmed}`}>{i.msOllamaHint} (<code className="text-amber-400/30">ollama serve</code>)</div>
              </div>

              {ollamaModels.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`text-[10px] ${t.text.muted} uppercase tracking-wider`}>{i.msDetectedModels} ({ollamaModels.length})</div>
                    {!ollamaConnected && <span className="text-[9px] text-amber-400/40">{i.msMockData}</span>}
                  </div>
                  {ollamaModels.map(model => {
                    const alreadyImported = aiModels.some(m => m.name === model.name && m.provider === 'ollama')
                    return (
                      <div key={model.name} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-amber-500/15 transition-all">
                        <div className={`w-2 h-2 rounded-full ${model.status === 'online' ? 'bg-emerald-400' : 'bg-white/15'}`} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-[12px] ${t.text.secondary}`} style={{ fontWeight: 500 }}>{model.name}</div>
                          <div className={`text-[10px] ${t.text.muted}`}>{model.size} · {model.quantization}</div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${model.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-white/20'}`}>
                          {model.status === 'online' ? i.msOnline : i.msOffline}
                        </span>
                        {alreadyImported ? (
                          <span className={`text-[10px] ${t.text.dimmed} flex items-center gap-1`}><Check className="w-3 h-3" /> {i.msImported}</span>
                        ) : (
                          <button onClick={() => handleImportOllama(model)} disabled={model.status === 'offline'}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[10px] hover:bg-amber-500/20 transition-all disabled:opacity-30 border border-amber-500/20">
                            <Plus className="w-3 h-3" /> {i.msImport}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {ollamaModels.length === 0 && !ollamaScanning && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className={`w-16 h-16 rounded-2xl ${t.isDark ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-slate-50 border border-slate-200'} flex items-center justify-center mb-4`}>
                    <Server className={`w-7 h-7 ${t.text.dimmed}`} />
                  </div>
                  <p className={`text-[12px] ${t.text.muted} mb-1`}>{i.msNoOllamaModels}</p>
                  <p className={`text-[10px] ${t.text.dimmed}`}>{i.msClickAutoDetect}</p>
                </div>
              )}
              {ollamaScanning && ollamaModels.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/[0.06] border border-amber-500/15 flex items-center justify-center mb-4 relative">
                    <Server className="w-7 h-7 text-amber-400/40" />
                    <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/30 animate-ping" />
                  </div>
                  <p className="text-[12px] text-amber-400/60 mb-1">{i.pvScanningOllama}</p>
                  <p className={`text-[10px] ${t.text.dimmed}`}>{ollamaHost}/api/tags</p>
                </div>
              )}
            </div>
          )}

          {/* MCP Tab */}
          {activeTab === 'mcp' && <MCPConfigPanel />}

          {/* Diagnostics Tab */}
          {activeTab === 'diagnostics' && (
            <SmartDiagnosticsPanel providers={allProviders} diagnostics={diagnostics}
              onRunDiagnostic={handleTestConnection} onSelectModel={handleSelectModel} activeModelKey={activeModelKey} />
          )}

          {/* Performance & Cost Tab */}
          {activeTab === 'performance' && (
            <AIPerformanceCostPanel t={t} />
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-5 py-3 border-t ${t.border.subtle} ${t.surface.inset}`}>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] ${t.text.dimmed}`}>
              {allProviders.length} {i.msProviders} · {allProviders.reduce((sum, p) => sum + p.models.length, 0)} {i.msModels}
            </span>
            {Object.values(diagnostics).filter(d => d.status === 'success').length > 0 && (
              <span className="text-[10px] text-emerald-400/40">{Object.values(diagnostics).filter(d => d.status === 'success').length} {i.msOnline}</span>
            )}
          </div>
          <button onClick={closeModelSettings}
            className={`px-4 py-1.5 rounded-lg text-[11px] ${t.transition} ${t.isDark ? 'bg-white/6 text-white/50 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {i.msDone}
          </button>
        </div>

        {/* Selection toast */}
        {selectionToast && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/25 backdrop-blur-sm"
            style={{ boxShadow: '0 4px 20px rgba(99,102,241,0.15)' }}>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span className="text-[12px] text-indigo-300">{i.msSwitchedTo} <strong>{selectionToast}</strong></span>
          </div>
        )}
      </div>
    </div>
  )
}
