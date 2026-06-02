/**
 * @file ApiTester.tsx
 * @description YYC³便携式智能AI系统 - 实时API测试/调试面板(Postman风格)
 * Real-time API Testing / Debug Panel (Postman-like)
 * HTTP method selector, URL bar, Headers/Body/Params/Auth tabs,
 * simulated response with status/time/size, request history.
 * Liquid Glass aesthetic, fully i18n-driven. Prefix: api*
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,api,testing,debug
 */

import {
  Globe, X, Send, Plus, Trash2, Clock, Copy,
  ChevronDown, Loader2, CheckCircle2, XCircle,
  History, Lock
} from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

/* ── Types ── */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type AuthType = 'none' | 'bearer' | 'basic'
type ReqTab = 'headers' | 'body' | 'params' | 'auth'
type ResTab = 'body' | 'headers'

interface KVPair { key: string; value: string; enabled: boolean }

interface ApiResponse {
  status: number
  statusText: string
  time: number
  size: string
  headers: KVPair[]
  body: string
}

interface HistoryEntry {
  id: string
  method: HttpMethod
  url: string
  status: number
  time: number
  timestamp: number
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#10b981', POST: '#f59e0b', PUT: '#3b82f6', PATCH: '#8b5cf6', DELETE: '#ef4444',
}

/* ── Mock responses ── */
const MOCK_RESPONSES: Record<string, ApiResponse> = {
  'GET:/api/v2/users': {
    status: 200, statusText: 'OK', time: 142, size: '2.3 KB',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'X-Request-Id', value: 'req-a1b2c3d4', enabled: true },
      { key: 'X-RateLimit-Remaining', value: '98', enabled: true },
    ],
    body: JSON.stringify({
      data: [
        { id: 'u1', name: 'Alice', email: 'alice@yyc3.dev', role: 'admin', online: true },
        { id: 'u2', name: 'Bob', email: 'bob@yyc3.dev', role: 'editor', online: false },
        { id: 'u3', name: 'Carol', email: 'carol@yyc3.dev', role: 'viewer', online: true },
      ],
      meta: { total: 3, page: 1, perPage: 20 },
    }, null, 2),
  },
  'POST:/api/v2/projects': {
    status: 201, statusText: 'Created', time: 287, size: '0.8 KB',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'Location', value: '/api/v2/projects/p-new123', enabled: true },
    ],
    body: JSON.stringify({
      data: { id: 'p-new123', name: 'New Project', status: 'active', created_at: new Date().toISOString() },
    }, null, 2),
  },
  'DELETE:/api/v2/projects/p1': {
    status: 204, statusText: 'No Content', time: 98, size: '0 B',
    headers: [{ key: 'X-Request-Id', value: 'req-del456', enabled: true }],
    body: '',
  },
}

const DEFAULT_RESPONSE: ApiResponse = {
  status: 404, statusText: 'Not Found', time: 56, size: '0.2 KB',
  headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
  body: JSON.stringify({ error: 'Not Found', message: 'The requested endpoint does not exist' }, null, 2),
}

/* ══════════════════════════════════════════ */

interface ApiTesterProps { open: boolean; onClose: () => void }

export function ApiTester({ open, onClose }: ApiTesterProps) {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const ii = getI18n(language)

  const [method, setMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState('https://api.yyc3.dev/api/v2/users')
  const [reqTab, setReqTab] = useState<ReqTab>('headers')
  const [resTab, setResTab] = useState<ResTab>('body')
  const [headers, setHeaders] = useState<KVPair[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: 'Authorization', value: 'Bearer sk-yyc3-dev-test1234', enabled: true },
    { key: 'Accept', value: 'application/json', enabled: true },
  ])
  const [params, setParams] = useState<KVPair[]>([
    { key: 'page', value: '1', enabled: true },
    { key: 'per_page', value: '20', enabled: true },
  ])
  const [body, setBody] = useState('{\n  "name": "New Project",\n  "description": "Created via API Tester"\n}')
  const [authType, setAuthType] = useState<AuthType>('bearer')
  const [authToken, setAuthToken] = useState('sk-yyc3-dev-test1234')
  const [sending, setSending] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showMethodDrop, setShowMethodDrop] = useState(false)

  const sendRequest = useCallback(() => {
    if (sending) return
    setSending(true)
    setResponse(null)

    const path = url.replace(/^https?:\/\/[^/]+/, '')
    const key = `${method}:${path}`

    setTimeout(() => {
      const res = MOCK_RESPONSES[key] || DEFAULT_RESPONSE
      setResponse(res)
      setSending(false)
      setHistory(prev => [{
        id: `h-${Date.now()}`, method, url, status: res.status, time: res.time, timestamp: Date.now(),
      }, ...prev.slice(0, 19)])
    }, 800 + Math.random() * 600)
  }, [method, url, sending])

  const addHeader = useCallback(() => {
    setHeaders(prev => [...prev, { key: '', value: '', enabled: true }])
  }, [])

  const addParam = useCallback(() => {
    setParams(prev => [...prev, { key: '', value: '', enabled: true }])
  }, [])

  const statusColor = (s: number) => s < 300 ? '#10b981' : s < 400 ? '#f59e0b' : '#ef4444'

  const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  const REQ_TABS: { tab: ReqTab; labelKey: string }[] = [
    { tab: 'headers', labelKey: 'apiHeaders' },
    { tab: 'body', labelKey: 'apiBody' },
    { tab: 'params', labelKey: 'apiParams' },
    { tab: 'auth', labelKey: 'apiAuth' },
  ]

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-3 border-b ${t.border.subtle}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.isDark ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20' : 'bg-gradient-to-br from-orange-50 to-red-50'}`}>
                <Globe className={`w-4 h-4 ${t.isDark ? 'text-orange-400' : 'text-orange-500'}`} />
              </div>
              <div>
                <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 700 }}>{ii.apiTitle}</h2>
                <p className={`text-[10px] ${t.text.dimmed}`}>{ii.apiSubtitle}</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl ${t.transition} ${t.interactive.iconBtn}`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* URL bar */}
          <div className={`flex items-center gap-2 px-6 py-3 border-b ${t.border.subtle}`}>
            {/* Method selector */}
            <div className="relative">
              <button onClick={() => setShowMethodDrop(!showMethodDrop)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] ${t.isDark ? 'bg-white/[0.04]' : 'bg-slate-100'} border ${t.border.subtle}`}
                style={{ color: METHOD_COLORS[method], fontWeight: 700, minWidth: 85 }}>
                {method} <ChevronDown className="w-3 h-3" />
              </button>
              {showMethodDrop && (
                <div className={`absolute top-full left-0 mt-1 z-10 rounded-lg overflow-hidden ${t.surface.popover} ${t.border.popover} shadow-xl`}>
                  {METHODS.map(m => (
                    <button key={m} onClick={() => { setMethod(m); setShowMethodDrop(false) }}
                      className={`w-full px-4 py-1.5 text-[10px] text-left ${t.transition} ${method === m ? t.accent.primaryBg : t.interactive.menuItem}`}
                      style={{ color: METHOD_COLORS[m], fontWeight: 700 }}>{m}</button>
                  ))}
                </div>
              )}
            </div>
            {/* URL input */}
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendRequest() }}
              placeholder={ii.apiUrl}
              className={`flex-1 text-[11px] font-mono px-3 py-2 rounded-lg outline-none ${t.isDark ? 'bg-white/[0.04] text-slate-200' : 'bg-slate-100 text-slate-700'} border ${t.border.subtle}`}
            />
            {/* Send */}
            <button onClick={sendRequest} disabled={sending}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[11px] ${t.transition} ${sending ? 'opacity-50 cursor-not-allowed' : t.accent.solidBtn + ' text-white'}`}
              style={{ fontWeight: 700 }}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? ii.apiSending : ii.apiSend}
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left: Request config */}
            <div className={`flex-1 flex flex-col border-r ${t.border.subtle}`}>
              {/* Tabs */}
              <div className={`flex items-center gap-0 px-4 border-b ${t.border.subtle}`}>
                {REQ_TABS.map(rt => (
                  <button key={rt.tab} onClick={() => setReqTab(rt.tab)}
                    className={`px-3 py-2 text-[9px] ${t.transition} border-b-2 ${
                      reqTab === rt.tab ? `${t.accent.primary} border-current` : `${t.text.muted} border-transparent`
                    }`} style={{ fontWeight: reqTab === rt.tab ? 600 : 400 }}>
                    {(ii as unknown as Record<string, string>)[rt.labelKey]}
                    {rt.tab === 'headers' && <span className={`ml-1 text-[7px] ${t.text.dimmed}`}>{headers.length}</span>}
                  </button>
                ))}
              </div>

              <div className={`flex-1 overflow-y-auto p-4 ${t.scrollbar}`}>
                {reqTab === 'headers' && (
                  <div className="space-y-1">
                    {headers.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input checked={h.enabled} onChange={e => { const next = [...headers]; next[idx] = { ...h, enabled: e.target.checked }; setHeaders(next) }} type="checkbox" className="w-3 h-3" />
                        <input value={h.key} onChange={e => { const next = [...headers]; next[idx] = { ...h, key: e.target.value }; setHeaders(next) }}
                          placeholder="Key" className={`flex-1 font-mono text-[9px] px-2 py-1.5 rounded outline-none ${t.isDark ? 'bg-white/[0.03] text-slate-300' : 'bg-slate-50 text-slate-600'} border ${t.border.subtle}`} />
                        <input value={h.value} onChange={e => { const next = [...headers]; next[idx] = { ...h, value: e.target.value }; setHeaders(next) }}
                          placeholder="Value" className={`flex-1 font-mono text-[9px] px-2 py-1.5 rounded outline-none ${t.isDark ? 'bg-white/[0.03] text-slate-300' : 'bg-slate-50 text-slate-600'} border ${t.border.subtle}`} />
                        <button onClick={() => setHeaders(prev => prev.filter((_, i) => i !== idx))} className={`p-0.5 rounded ${t.transition} text-red-400 hover:bg-red-500/10`}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button onClick={addHeader} className={`w-full flex items-center justify-center gap-1 py-1.5 rounded text-[9px] border border-dashed ${t.border.subtle} ${t.transition} ${t.interactive.menuItem}`}>
                      <Plus className="w-3 h-3" /> {ii.apiAddHeader}
                    </button>
                  </div>
                )}
                {reqTab === 'body' && (
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    className={`w-full h-full font-mono text-[9px] p-2 rounded-lg resize-none outline-none ${t.isDark ? 'bg-white/[0.03] text-slate-300' : 'bg-slate-50 text-slate-600'} border ${t.border.subtle}`}
                    spellCheck={false}
                  />
                )}
                {reqTab === 'params' && (
                  <div className="space-y-1">
                    {params.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input checked={p.enabled} onChange={e => { const next = [...params]; next[idx] = { ...p, enabled: e.target.checked }; setParams(next) }} type="checkbox" className="w-3 h-3" />
                        <input value={p.key} onChange={e => { const next = [...params]; next[idx] = { ...p, key: e.target.value }; setParams(next) }}
                          placeholder="Key" className={`flex-1 font-mono text-[9px] px-2 py-1.5 rounded outline-none ${t.isDark ? 'bg-white/[0.03] text-slate-300' : 'bg-slate-50 text-slate-600'} border ${t.border.subtle}`} />
                        <input value={p.value} onChange={e => { const next = [...params]; next[idx] = { ...p, value: e.target.value }; setParams(next) }}
                          placeholder="Value" className={`flex-1 font-mono text-[9px] px-2 py-1.5 rounded outline-none ${t.isDark ? 'bg-white/[0.03] text-slate-300' : 'bg-slate-50 text-slate-600'} border ${t.border.subtle}`} />
                        <button onClick={() => setParams(prev => prev.filter((_, i) => i !== idx))} className={`p-0.5 rounded ${t.transition} text-red-400 hover:bg-red-500/10`}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button onClick={addParam} className={`w-full flex items-center justify-center gap-1 py-1.5 rounded text-[9px] border border-dashed ${t.border.subtle} ${t.transition} ${t.interactive.menuItem}`}>
                      <Plus className="w-3 h-3" /> {ii.apiAddParam}
                    </button>
                  </div>
                )}
                {reqTab === 'auth' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {(['none', 'bearer', 'basic'] as AuthType[]).map(at => (
                        <button key={at} onClick={() => setAuthType(at)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] ${t.transition} ${authType === at ? t.accent.primaryBg + ' ' + t.accent.primary : t.interactive.iconBtn}`}
                          style={{ fontWeight: authType === at ? 600 : 400 }}>
                          {at === 'none' ? ii.apiNone : at === 'bearer' ? ii.apiBearer : ii.apiBasic}
                        </button>
                      ))}
                    </div>
                    {authType === 'bearer' && (
                      <div className="flex items-center gap-2">
                        <Lock className={`w-3 h-3 ${t.text.muted}`} />
                        <input value={authToken} onChange={e => setAuthToken(e.target.value)}
                          placeholder="Token" className={`flex-1 font-mono text-[9px] px-2 py-1.5 rounded outline-none ${t.isDark ? 'bg-white/[0.03] text-slate-300' : 'bg-slate-50 text-slate-600'} border ${t.border.subtle}`} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Response */}
            <div className="flex-1 flex flex-col">
              {/* Status bar */}
              {response && (
                <div className={`flex items-center gap-3 px-4 py-2 border-b ${t.border.subtle}`}>
                  <span className="flex items-center gap-1 text-[10px]" style={{ color: statusColor(response.status), fontWeight: 700 }}>
                    {response.status < 300 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {response.status} {response.statusText}
                  </span>
                  <span className={`flex items-center gap-1 text-[9px] ${t.text.muted}`}>
                    <Clock className="w-2.5 h-2.5" /> {response.time}ms
                  </span>
                  <span className={`text-[9px] ${t.text.dimmed}`}>{response.size}</span>
                  <div className="flex-1" />
                  <button onClick={() => { navigator.clipboard.writeText(response.body); toast.success(ii.codeCopied) }}
                    className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}>
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Response tabs */}
              {response && (
                <div className={`flex items-center gap-0 px-4 border-b ${t.border.subtle}`}>
                  {(['body', 'headers'] as ResTab[]).map(rt => (
                    <button key={rt} onClick={() => setResTab(rt)}
                      className={`px-3 py-2 text-[9px] ${t.transition} border-b-2 ${
                        resTab === rt ? `${t.accent.primary} border-current` : `${t.text.muted} border-transparent`
                      }`} style={{ fontWeight: resTab === rt ? 600 : 400 }}>
                      {rt === 'body' ? ii.apiBody : ii.apiHeaders}
                    </button>
                  ))}
                </div>
              )}

              {/* Response body */}
              <div className={`flex-1 overflow-auto ${t.scrollbar}`}>
                {sending ? (
                  <div className={`flex flex-col items-center justify-center h-full gap-3 ${t.text.dimmed}`}>
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    <span className="text-[11px]">{ii.apiSending}</span>
                  </div>
                ) : response ? (
                  resTab === 'body' ? (
                    <pre className={`p-4 font-mono text-[9px] whitespace-pre-wrap ${t.isDark ? 'text-emerald-300/80' : 'text-slate-700'}`}>
                      {response.body || '(empty)'}
                    </pre>
                  ) : (
                    <div className="p-4 space-y-1">
                      {response.headers.map((h, idx) => (
                        <div key={idx} className={`flex items-center gap-2 px-2 py-1.5 rounded ${t.isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                          <span className={`text-[9px] font-mono ${t.isDark ? 'text-cyan-400' : 'text-cyan-600'}`} style={{ fontWeight: 600 }}>{h.key}</span>
                          <span className={`text-[9px] font-mono ${t.text.muted}`}>{h.value}</span>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className={`flex flex-col items-center justify-center h-full gap-2 ${t.text.dimmed}`}>
                    <Globe className="w-6 h-6 opacity-20" />
                    <span className="text-[10px]">Send a request to see the response</span>
                  </div>
                )}
              </div>

              {/* History */}
              {history.length > 0 && (
                <div className={`border-t ${t.border.subtle} max-h-28 overflow-y-auto ${t.scrollbar}`}>
                  <div className={`flex items-center gap-1 px-4 py-1.5 ${t.text.dimmed}`}>
                    <History className="w-3 h-3" />
                    <span className="text-[8px] uppercase tracking-wider" style={{ fontWeight: 600 }}>{ii.apiHistory}</span>
                  </div>
                  {history.slice(0, 5).map(h => (
                    <button key={h.id} onClick={() => { setMethod(h.method); setUrl(h.url) }}
                      className={`w-full flex items-center gap-2 px-4 py-1 text-[8px] text-left ${t.transition} ${t.interactive.menuItem}`}>
                      <span style={{ color: METHOD_COLORS[h.method], fontWeight: 700, width: 40 }}>{h.method}</span>
                      <span className={`flex-1 font-mono truncate ${t.text.muted}`}>{h.url.replace(/^https?:\/\/[^/]+/, '')}</span>
                      <span style={{ color: statusColor(h.status), fontWeight: 600 }}>{h.status}</span>
                      <span className={t.text.dimmed}>{h.time}ms</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
