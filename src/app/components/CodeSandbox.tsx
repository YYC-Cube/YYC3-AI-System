/**
 * @file CodeSandbox.tsx
 * @description YYC³便携式智能AI系统 - 增强代码执行沙箱
 * Enhanced Code Execution Sandbox
 * Iframe sandbox isolation, HMR hot update simulation, error boundary,
 * dependency management, resource limits, console capture, performance metrics.
 * Supports Sandbox ↔ PreviewPanel code sync via store.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,sandbox,preview,hmr,execution,security
 */

import {
  X,
  Shield,
  Play,
  RefreshCw,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  MemoryStick,
  Terminal,
  Eye,
  Trash2,
  Lock,
  Box,
  Layers,
  Loader2,
  ArrowRight,
  Link2,
  Unlink,
  Code,
  Settings,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { compileToHtml, type PreviewLanguage, type ConsoleEntry } from '../utils/preview-engine';
import { getThemeTokens } from '../utils/theme';

type SandboxTab = 'editor' | 'console' | 'resources' | 'deps';

interface SandboxConfig {
  memoryLimit: number; // MB
  cpuTimeout: number; // ms
  networkAccess: boolean;
  fileAccess: boolean;
  domAccess: boolean;
  autoRestart: boolean;
  hmrEnabled: boolean;
}

interface ExecutionResult {
  id: string;
  status: 'success' | 'error' | 'timeout' | 'killed';
  startTime: number;
  endTime: number;
  memoryUsed: number; // MB
  output: string;
  error?: string;
}

const DEMO_DEPS = [
  { name: 'react', version: '18.2.0', loaded: true, size: '42 KB' },
  { name: 'react-dom', version: '18.2.0', loaded: true, size: '120 KB' },
  { name: 'lucide-react', version: '0.263.1', loaded: true, size: '15 KB' },
  { name: 'sonner', version: '1.0.3', loaded: true, size: '8 KB' },
  { name: 'zustand', version: '4.3.6', loaded: false, size: '3 KB' },
];

const DEFAULT_CONFIG: SandboxConfig = {
  memoryLimit: 64,
  cpuTimeout: 5000,
  networkAccess: false,
  fileAccess: false,
  domAccess: true,
  autoRestart: true,
  hmrEnabled: true,
};

const DEMO_CODE = `// YYC\u00B3 Sandbox - Interactive Demo
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("=== YYC\u00B3 Code Sandbox ===");
console.log("Fibonacci sequence:");
for (let i = 0; i < 12; i++) {
  console.log(\`  F(\${i}) = \${fibonacci(i)}\`);
}

// Object manipulation
const config = {
  name: "YYC\u00B3 PortAISys",
  version: "2.0.0",
  features: ["Sandbox", "HMR", "CRDT"],
};
console.log("\\nConfig:", JSON.stringify(config, null, 2));

// Async simulation
console.log("\\n\u26A1 Execution complete!");`;

export function CodeSandbox({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, language, setSandboxPreviewCode } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const [activeTab, setActiveTab] = useState<SandboxTab>('editor');
  const [code, setCode] = useState(DEMO_CODE);
  const [lang, setLang] = useState<PreviewLanguage>('javascript');
  const [config, setConfig] = useState<SandboxConfig>(DEFAULT_CONFIG);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [execResults, setExecResults] = useState<ExecutionResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [hmrCount, setHmrCount] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(12);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [deps] = useState(DEMO_DEPS);

  // Sandbox <-> Preview sync
  const [linkedToPreview, setLinkedToPreview] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeRef = useRef(code);
  const hmrTimerRef = useRef<number | null>(null);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Sync to PreviewPanel when linked
  useEffect(() => {
    if (linkedToPreview && iframeSrc) {
      setSandboxPreviewCode(code, lang);
    }
  }, [linkedToPreview, iframeSrc, code, lang, setSandboxPreviewCode]);

  // Cleanup on close
  useEffect(() => {
    if (!open && linkedToPreview) {
      setSandboxPreviewCode(null, null);
    }
  }, [open, linkedToPreview, setSandboxPreviewCode]);

  // Listen for iframe messages
  useEffect(() => {
    if (!open) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'console') {
        const entry: ConsoleEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: e.data.level || 'log',
          message: e.data.message || '',
          timestamp: Date.now(),
        };
        setConsoleEntries((prev) => [...prev.slice(-100), entry]);
      }
      if (e.data?.type === 'metrics') {
        setMemoryUsage(Math.floor(10 + Math.random() * 30));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [open]);

  // Simulate CPU/memory usage
  useEffect(() => {
    if (!open) return;
    const interval = window.setInterval(() => {
      setCpuUsage((prev) => {
        if (isRunning) return Math.min(95, prev + Math.random() * 20);
        return Math.max(2, prev - Math.random() * 5);
      });
      setMemoryUsage((prev) =>
        Math.max(8, Math.min(config.memoryLimit * 0.8, prev + (Math.random() - 0.5) * 3))
      );
    }, 1000);
    return () => window.clearInterval(interval);
  }, [open, isRunning, config.memoryLimit]);

  const executeCode = useCallback(() => {
    setIsRunning(true);
    setCpuUsage(40);
    const startTime = Date.now();

    setConsoleEntries([]);

    // Compile and render
    const { html, error } = compileToHtml(codeRef.current, lang, t.isDark);

    if (error) {
      const result: ExecutionResult = {
        id: `exec-${Date.now()}`,
        status: 'error',
        startTime,
        endTime: Date.now(),
        memoryUsed: memoryUsage,
        output: '',
        error: error.message,
      };
      setExecResults((prev) => [...prev.slice(-20), result]);
      setIsRunning(false);
      return;
    }

    setIframeSrc(html);

    // Auto-timeout
    const timeout = window.setTimeout(() => {
      if (isRunning) {
        setIsRunning(false);
        setExecResults((prev) => [
          ...prev.slice(-20),
          {
            id: `exec-${Date.now()}`,
            status: 'timeout',
            startTime,
            endTime: Date.now(),
            memoryUsed: memoryUsage,
            output: '',
            error: `Execution exceeded ${config.cpuTimeout}ms limit`,
          },
        ]);
      }
    }, config.cpuTimeout);

    // Simulate execution completion
    window.setTimeout(
      () => {
        window.clearTimeout(timeout);
        setIsRunning(false);
        setCpuUsage(5);
        setHmrCount((prev) => prev + 1);
        setExecResults((prev) => [
          ...prev.slice(-20),
          {
            id: `exec-${Date.now()}`,
            status: 'success',
            startTime,
            endTime: Date.now(),
            memoryUsed: memoryUsage,
            output: 'Execution completed successfully',
          },
        ]);
      },
      300 + Math.random() * 200
    );
  }, [lang, t.isDark, config.cpuTimeout, memoryUsage, isRunning]);

  // HMR: auto-recompile on code change
  useEffect(() => {
    if (!open || !config.hmrEnabled) return;
    if (hmrTimerRef.current) window.clearTimeout(hmrTimerRef.current);
    hmrTimerRef.current = window.setTimeout(() => {
      if (codeRef.current.trim()) executeCode();
    }, 800);
    return () => {
      if (hmrTimerRef.current) window.clearTimeout(hmrTimerRef.current);
    };
  }, [code, open, config.hmrEnabled, executeCode]);

  const handleSyncToPreview = useCallback(() => {
    setSandboxPreviewCode(code, lang);
    toast.success(i.sbSyncedToPreview);
  }, [code, lang, setSandboxPreviewCode, i]);

  const toggleLinkPreview = useCallback(() => {
    const next = !linkedToPreview;
    setLinkedToPreview(next);
    if (next) {
      setSandboxPreviewCode(code, lang);
      toast.success(i.sbLinkedToPreview);
    } else {
      setSandboxPreviewCode(null, null);
    }
  }, [linkedToPreview, code, lang, setSandboxPreviewCode, i]);

  if (!open) return null;

  const tabs: {
    id: SandboxTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'editor', label: i.sbEditor, icon: Code },
    { id: 'console', label: i.sbConsole, icon: Terminal, badge: consoleEntries.length },
    { id: 'resources', label: i.sbResources, icon: Cpu },
    { id: 'deps', label: i.sbDeps, icon: Layers, badge: deps.filter((d) => d.loaded).length },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        data-testid="sandbox-backdrop"
      />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div
          data-testid="sandbox-panel"
          className={`w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-6 py-4 border-b ${t.border.subtle} flex-shrink-0`}
          >
            <div className="flex items-center space-x-3">
              <Shield className={`w-5 h-5 ${t.accent.primary}`} />
              <div>
                <h2 className="text-[15px]" style={{ fontWeight: 600 }}>
                  {i.sbTitle}
                </h2>
                <p className={`text-[11px] ${t.text.muted}`}>{i.sbSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* HMR indicator */}
              {config.hmrEnabled && (
                <div
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] ${t.isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}
                >
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400" style={{ fontWeight: 500 }}>
                    HMR #{hmrCount}
                  </span>
                </div>
              )}
              {/* Preview link toggle */}
              <button
                onClick={toggleLinkPreview}
                data-testid="sandbox-link-preview-btn"
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] ${t.transition} ${
                  linkedToPreview
                    ? t.isDark
                      ? 'bg-indigo-900/20 text-indigo-400'
                      : 'bg-indigo-50 text-indigo-700'
                    : t.interactive.menuItem
                }`}
                title={i.sbSyncToPreview}
              >
                {linkedToPreview ? <Link2 className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
                <span style={{ fontWeight: 500 }}>
                  {linkedToPreview ? i.sbLinkedToPreview : i.sbSyncToPreview}
                </span>
              </button>
              {/* Status */}
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] ${t.isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}
              >
                {isRunning ? (
                  <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                )}
                <span
                  className={isRunning ? 'text-amber-400' : 'text-emerald-400'}
                  style={{ fontWeight: 500 }}
                >
                  {isRunning ? i.sbRunning : i.sbReady}
                </span>
              </div>
              {/* Config toggle */}
              <button
                onClick={() => setShowConfig(!showConfig)}
                className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
                data-testid="sandbox-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Config panel (collapsible) */}
          {showConfig && (
            <div className={`px-6 py-3 border-b ${t.border.subtle} flex-shrink-0`}>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={`block text-[10px] mb-1 ${t.text.muted}`}>{i.sbMemLimit}</label>
                  <select
                    value={config.memoryLimit}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, memoryLimit: parseInt(e.target.value) }))
                    }
                    className={`w-full px-2 py-1 rounded-lg text-[11px] ${t.isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700'} border ${t.border.subtle}`}
                  >
                    <option value={32}>32 MB</option>
                    <option value={64}>64 MB</option>
                    <option value={128}>128 MB</option>
                    <option value={256}>256 MB</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[10px] mb-1 ${t.text.muted}`}>{i.sbTimeout}</label>
                  <select
                    value={config.cpuTimeout}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, cpuTimeout: parseInt(e.target.value) }))
                    }
                    className={`w-full px-2 py-1 rounded-lg text-[11px] ${t.isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700'} border ${t.border.subtle}`}
                  >
                    <option value={3000}>3s</option>
                    <option value={5000}>5s</option>
                    <option value={10000}>10s</option>
                    <option value={30000}>30s</option>
                  </select>
                </div>
                <div className="flex items-end space-x-2">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.hmrEnabled}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, hmrEnabled: e.target.checked }))
                      }
                      className="rounded accent-indigo-500"
                    />
                    <span className={`text-[11px] ${t.text.secondary}`}>{i.sbHmr}</span>
                  </label>
                </div>
                <div className="flex items-end space-x-2">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.networkAccess}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, networkAccess: e.target.checked }))
                      }
                      className="rounded accent-indigo-500"
                    />
                    <span className={`text-[11px] ${t.text.secondary}`}>{i.sbNetwork}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div
            className={`flex items-center justify-between px-6 py-2 border-b ${t.border.subtle} flex-shrink-0`}
          >
            <div className="flex items-center space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[12px] ${t.transition} ${
                      activeTab === tab.id
                        ? `${t.accent.activeBg} ${t.accent.activeText}`
                        : t.interactive.menuItem
                    }`}
                    style={{ fontWeight: activeTab === tab.id ? 500 : 400 }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[9px] bg-indigo-500/20 text-indigo-400"
                        style={{ fontWeight: 600 }}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as PreviewLanguage)}
                className={`px-2 py-1 rounded-lg text-[11px] ${t.isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700'} border ${t.border.subtle}`}
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="react">React</option>
                <option value="markdown">Markdown</option>
              </select>
              <button
                onClick={executeCode}
                disabled={isRunning}
                data-testid="sandbox-run-btn"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[12px] ${t.transition} ${
                  isRunning
                    ? 'bg-slate-600/20 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                }`}
                style={{ fontWeight: 500 }}
              >
                {isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>{isRunning ? i.sbRunning : i.sbRun}</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Left: Editor / Console / Resources / Deps */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'editor' && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    data-testid="sandbox-editor"
                    className={`flex-1 p-4 text-[12px] resize-none outline-none font-mono ${t.isDark ? 'bg-slate-900/50 text-slate-300' : 'bg-white text-slate-800'}`}
                    style={{
                      fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                      lineHeight: '1.6',
                      tabSize: 2,
                    }}
                    spellCheck={false}
                  />
                </div>
              )}

              {activeTab === 'console' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] ${t.text.muted}`}>
                      {i.sbConsoleOutput} ({consoleEntries.length})
                    </span>
                    <button
                      onClick={() => setConsoleEntries([])}
                      className={`text-[10px] px-2 py-0.5 rounded ${t.interactive.menuItem}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {consoleEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex items-start space-x-2 px-2 py-1 rounded text-[11px] font-mono ${
                        entry.type === 'error'
                          ? t.isDark
                            ? 'bg-red-900/10 text-red-300'
                            : 'bg-red-50 text-red-700'
                          : entry.type === 'warn'
                            ? t.isDark
                              ? 'bg-amber-900/10 text-amber-300'
                              : 'bg-amber-50 text-amber-700'
                            : entry.type === 'info'
                              ? t.isDark
                                ? 'bg-blue-900/10 text-blue-300'
                                : 'bg-blue-50 text-blue-700'
                              : t.isDark
                                ? 'text-slate-400'
                                : 'text-slate-600'
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 text-[9px] uppercase ${t.text.dimmed}`}
                        style={{ fontWeight: 600 }}
                      >
                        {entry.type}
                      </span>
                      <span className="whitespace-pre-wrap break-all">{entry.message}</span>
                    </div>
                  ))}
                  {consoleEntries.length === 0 && (
                    <div className={`text-center py-8 ${t.text.muted}`}>
                      <Terminal className="w-6 h-6 mx-auto mb-2 opacity-40" />
                      <p className="text-[12px]">{i.sbNoOutput}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Resource gauges */}
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-4 h-4 text-indigo-400" />
                          <span className="text-[12px]" style={{ fontWeight: 500 }}>
                            CPU
                          </span>
                        </div>
                        <span
                          className={`text-[12px] ${cpuUsage > 80 ? 'text-red-400' : cpuUsage > 50 ? 'text-amber-400' : 'text-emerald-400'}`}
                          style={{ fontWeight: 600 }}
                        >
                          {cpuUsage.toFixed(1)}%
                        </span>
                      </div>
                      <div
                        className={`h-2 rounded-full overflow-hidden ${t.isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
                      >
                        <div
                          className={`h-full rounded-full transition-all ${cpuUsage > 80 ? 'bg-red-500' : cpuUsage > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${cpuUsage}%` }}
                        />
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <MemoryStick className="w-4 h-4 text-cyan-400" />
                          <span className="text-[12px]" style={{ fontWeight: 500 }}>
                            {i.sbMemory}
                          </span>
                        </div>
                        <span
                          className={`text-[12px] ${memoryUsage > config.memoryLimit * 0.8 ? 'text-red-400' : 'text-cyan-400'}`}
                          style={{ fontWeight: 600 }}
                        >
                          {memoryUsage.toFixed(1)} / {config.memoryLimit} MB
                        </span>
                      </div>
                      <div
                        className={`h-2 rounded-full overflow-hidden ${t.isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
                      >
                        <div
                          className="h-full rounded-full transition-all bg-cyan-500"
                          style={{ width: `${(memoryUsage / config.memoryLimit) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Execution history */}
                  <div>
                    <h3 className={`text-[12px] mb-2 ${t.text.muted}`} style={{ fontWeight: 600 }}>
                      {i.sbExecHistory}
                    </h3>
                    <div className="space-y-1">
                      {execResults
                        .slice(-10)
                        .reverse()
                        .map((result) => (
                          <div
                            key={result.id}
                            className={`flex items-center justify-between p-2 rounded-lg text-[11px] ${t.isDark ? 'bg-slate-800/20' : 'bg-slate-50'}`}
                          >
                            <div className="flex items-center space-x-2">
                              {result.status === 'success' ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              ) : result.status === 'timeout' ? (
                                <Clock className="w-3 h-3 text-amber-400" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-red-400" />
                              )}
                              <span>{result.status}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={t.text.muted}>
                                {result.endTime - result.startTime}ms
                              </span>
                              <span className={t.text.muted}>{result.memoryUsed.toFixed(1)}MB</span>
                              <span className={`text-[9px] ${t.text.dimmed}`}>
                                {new Date(result.startTime).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Security restrictions */}
                  <div>
                    <h3 className={`text-[12px] mb-2 ${t.text.muted}`} style={{ fontWeight: 600 }}>
                      {i.sbSecurity}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: i.sbNetwork, enabled: config.networkAccess },
                        { label: i.sbFileAccess, enabled: config.fileAccess },
                        { label: i.sbDomAccess, enabled: config.domAccess },
                        { label: i.sbAutoRestart, enabled: config.autoRestart },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`flex items-center space-x-2 p-2 rounded-lg text-[11px] ${t.isDark ? 'bg-slate-800/20' : 'bg-slate-50'}`}
                        >
                          {item.enabled ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Lock className="w-3 h-3 text-red-400" />
                          )}
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'deps' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  <p className={`text-[11px] mb-3 ${t.text.muted}`}>{i.sbDepsDesc}</p>
                  {deps.map((dep) => (
                    <div
                      key={dep.name}
                      className={`flex items-center justify-between p-3 rounded-xl ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <Box
                          className={`w-4 h-4 ${dep.loaded ? 'text-emerald-400' : t.text.muted}`}
                        />
                        <div>
                          <p className="text-[12px]" style={{ fontWeight: 500 }}>
                            {dep.name}
                          </p>
                          <p className={`text-[10px] ${t.text.muted}`}>
                            v{dep.version} &bull; {dep.size}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] ${
                          dep.loaded
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {dep.loaded ? i.sbLoaded : i.sbNotLoaded}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Preview iframe */}
            <div className={`w-[45%] flex-shrink-0 border-l ${t.border.subtle} flex flex-col`}>
              <div
                className={`flex items-center justify-between px-3 py-2 border-b ${t.border.subtle}`}
              >
                <div className="flex items-center space-x-2">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px]" style={{ fontWeight: 500 }}>
                    {i.sbPreview}
                  </span>
                  {linkedToPreview && (
                    <span
                      className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[8px] bg-indigo-500/20 text-indigo-400"
                      style={{ fontWeight: 600 }}
                    >
                      <Link2 className="w-2.5 h-2.5" />
                      <span>SYNC</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {!linkedToPreview && (
                    <button
                      onClick={handleSyncToPreview}
                      data-testid="sandbox-sync-btn"
                      className={`flex items-center space-x-1 p-1 rounded-lg text-[9px] ${t.interactive.iconBtn}`}
                      title={i.sbSyncToPreview}
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={executeCode}
                    className={`p-1 rounded-lg ${t.interactive.iconBtn}`}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                {iframeSrc ? (
                  <iframe
                    ref={iframeRef}
                    srcDoc={iframeSrc}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-modals"
                    title="Code Sandbox Preview"
                    data-testid="sandbox-preview-iframe"
                  />
                ) : (
                  <div className={`flex items-center justify-center h-full ${t.text.muted}`}>
                    <div className="text-center">
                      <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-[12px]">{i.sbClickRun}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className={`flex items-center justify-between px-6 py-2 border-t ${t.border.subtle} text-[10px] ${t.text.dimmed} flex-shrink-0`}
          >
            <div className="flex items-center space-x-3">
              <span>{i.sbIsolation}: iframe sandbox</span>
              <span>&bull;</span>
              <span>CSP: script-src 'self'</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>
                {i.sbExecCount}: {execResults.length}
              </span>
              <span>&bull;</span>
              <span>HMR: {config.hmrEnabled ? 'ON' : 'OFF'}</span>
              {linkedToPreview && (
                <>
                  <span>&bull;</span>
                  <span className="text-indigo-400">{i.sbLinkedToPreview}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
