/**
 * @file MultiInstancePanel.tsx
 * @description YYC³便携式智能AI系统 - 多实例管理面板UI
 * Multi-Instance Management Panel UI
 * Visual management for windows, workspaces, and sessions with full CRUD,
 * Liquid Glass styling, and 4-language i18n.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,multi-instance,window-manager,workspace,session
 */

import {
  X,
  Plus,
  Monitor,
  FolderOpen,
  MessageSquare,
  Settings,
  Trash2,
  Copy,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Eye,
  ArrowUpRight,
  Activity,
  Terminal,
  Code,
  Bot,
  Bug,
  Layers,
  RefreshCw,
  Download,
  Upload,
  Search,
} from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';

import {
  useWindowManagerStore,
  useWorkspaceManagerStore,
  useSessionManagerStore,
  ipcManager,
  type WindowType,
  type WorkspaceType,
  type SessionType,
} from '../services/multi-instance';
import { useAppStore } from '../store';
import { getI18n, type I18nStrings } from '../utils/i18n';
import { getThemeTokens, type ThemeTokens } from '../utils/theme';

// ── Tab types ──
type MITab = 'windows' | 'workspaces' | 'sessions' | 'ipc';

const WINDOW_TYPE_ICONS: Record<WindowType, React.ReactNode> = {
  main: <Monitor className="w-3.5 h-3.5" />,
  editor: <Code className="w-3.5 h-3.5" />,
  preview: <Eye className="w-3.5 h-3.5" />,
  terminal: <Terminal className="w-3.5 h-3.5" />,
  'ai-chat': <Bot className="w-3.5 h-3.5" />,
  settings: <Settings className="w-3.5 h-3.5" />,
};

const SESSION_TYPE_ICONS: Record<SessionType, React.ReactNode> = {
  'ai-chat': <Bot className="w-3.5 h-3.5" />,
  'code-edit': <Code className="w-3.5 h-3.5" />,
  debug: <Bug className="w-3.5 h-3.5" />,
  preview: <Eye className="w-3.5 h-3.5" />,
  terminal: <Terminal className="w-3.5 h-3.5" />,
};

export function MultiInstancePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useAppStore((s) => s.theme);
  const language = useAppStore((s) => s.language);
  const t = getThemeTokens(theme);
  const i = getI18n(language) as I18nStrings;

  const [activeTab, setActiveTab] = useState<MITab>('windows');
  const [searchQuery, setSearchQuery] = useState('');

  if (!open) return null;

  const tabs: { id: MITab; label: string; icon: React.ReactNode }[] = [
    { id: 'windows', label: i.miWindows || 'Windows', icon: <Monitor className="w-3.5 h-3.5" /> },
    {
      id: 'workspaces',
      label: i.miWorkspaces || 'Workspaces',
      icon: <FolderOpen className="w-3.5 h-3.5" />,
    },
    {
      id: 'sessions',
      label: i.miSessions || 'Sessions',
      icon: <MessageSquare className="w-3.5 h-3.5" />,
    },
    { id: 'ipc', label: i.miIpcLog || 'IPC Log', icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className={`relative w-full max-w-5xl h-[75vh] rounded-2xl border overflow-hidden flex flex-col ${
          t.isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-200'
        } backdrop-blur-xl shadow-2xl`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-3 border-b ${t.isDark ? 'border-white/5' : 'border-slate-100'}`}
        >
          <div className="flex items-center gap-3">
            <Layers className={`w-5 h-5 ${t.isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <span
              className={`text-[13px] ${t.isDark ? 'text-white' : 'text-slate-800'}`}
              style={{ fontWeight: 600 }}
            >
              {i.miTitle || 'Multi-Instance Manager'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg ${t.isDark ? 'bg-white/5' : 'bg-slate-100'}`}
            >
              <Search className={`w-3 h-3 ${t.text.muted}`} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={i.miSearch || 'Search...'}
                className={`bg-transparent outline-none text-[11px] w-32 ${t.isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-800 placeholder:text-slate-400'}`}
              />
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg ${t.isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className={`flex gap-1 px-5 py-2 border-b ${t.isDark ? 'border-white/5' : 'border-slate-100'}`}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all ${
                activeTab === tab.id
                  ? t.isDark
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'bg-indigo-50 text-indigo-700'
                  : t.isDark
                    ? 'text-slate-400 hover:bg-white/5'
                    : 'text-slate-500 hover:bg-slate-50'
              }`}
              style={{ fontWeight: activeTab === tab.id ? 600 : 400 }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 custom-scrollbar">
          {activeTab === 'windows' && <WindowsTab t={t} i={i} search={searchQuery} />}
          {activeTab === 'workspaces' && <WorkspacesTab t={t} i={i} search={searchQuery} />}
          {activeTab === 'sessions' && <SessionsTab t={t} i={i} search={searchQuery} />}
          {activeTab === 'ipc' && <IPCLogTab t={t} i={i} search={searchQuery} />}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Windows Tab ──

function WindowsTab({ t, i, search }: { t: ThemeTokens; i: I18nStrings; search: string }) {
  const {
    instances,
    createInstance,
    closeInstance,
    activateInstance,
    minimizeInstance,
    restoreInstance,
  } = useWindowManagerStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newType, setNewType] = useState<WindowType>('editor');
  const [newTitle, setNewTitle] = useState('');

  const filtered = useMemo(
    () =>
      instances.filter(
        (inst) =>
          !search ||
          inst.title.toLowerCase().includes(search.toLowerCase()) ||
          inst.windowType.includes(search.toLowerCase())
      ),
    [instances, search]
  );

  const handleCreate = () => {
    createInstance(newType, { title: newTitle || `YYC3 - ${newType}` });
    toast.success(i.miWindowCreated || 'Window created');
    setShowCreate(false);
    setNewTitle('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={`text-[11px] ${t.text.muted}`}>
          {filtered.length} {i.miInstances || 'instances'}
        </span>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] ${t.isDark ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
        >
          <Plus className="w-3 h-3" /> {i.miNewWindow || 'New Window'}
        </button>
      </div>

      {showCreate && (
        <div
          className={`p-3 rounded-xl border ${t.isDark ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as WindowType)}
              className={`text-[11px] rounded-lg px-2 py-1 ${t.isDark ? 'bg-slate-700 text-white border-white/10' : 'bg-white text-slate-800 border-slate-200'} border`}
            >
              {(
                ['main', 'editor', 'preview', 'terminal', 'ai-chat', 'settings'] as WindowType[]
              ).map((wt) => (
                <option key={wt} value={wt}>
                  {wt}
                </option>
              ))}
            </select>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={i.miWindowTitle || 'Title...'}
              className={`flex-1 text-[11px] rounded-lg px-2 py-1 ${t.isDark ? 'bg-slate-700 text-white border-white/10' : 'bg-white text-slate-800 border-slate-200'} border outline-none`}
            />
            <button
              onClick={handleCreate}
              className="px-3 py-1 rounded-lg bg-indigo-500 text-white text-[11px] hover:bg-indigo-600"
            >
              {i.miCreate || 'Create'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((inst) => (
          <div
            key={inst.id}
            className={`p-3 rounded-xl border transition-all ${t.isDark ? 'bg-slate-800/40 border-white/5 hover:border-indigo-500/30' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {WINDOW_TYPE_ICONS[inst.windowType]}
                <span
                  className={`text-[11px] ${t.isDark ? 'text-white' : 'text-slate-800'}`}
                  style={{ fontWeight: 600 }}
                >
                  {inst.title}
                </span>
                {inst.isMain && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                    MAIN
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => activateInstance(inst.id)}
                  title="Focus"
                  className={`p-1 rounded ${t.isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                >
                  <ArrowUpRight className="w-3 h-3" />
                </button>
                {inst.isMinimized ? (
                  <button
                    onClick={() => restoreInstance(inst.id)}
                    className={`p-1 rounded ${t.isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => minimizeInstance(inst.id)}
                    className={`p-1 rounded ${t.isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                  >
                    <Minimize2 className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => {
                    closeInstance(inst.id);
                    toast.info(i.miWindowClosed || 'Window closed');
                  }}
                  className={`p-1 rounded ${t.isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[9px] ${t.text.dimmed}`}>{inst.windowType}</span>
              <span className={`text-[9px] ${t.text.dimmed}`}>
                {inst.size.width}x{inst.size.height}
              </span>
              <span
                className={`text-[9px] ${inst.isVisible ? 'text-green-400' : 'text-slate-500'}`}
              >
                {inst.isVisible ? i.miVisible || 'Visible' : i.miHidden || 'Hidden'}
              </span>
              {inst.isMinimized && (
                <span className="text-[9px] text-amber-400">{i.miMinimized || 'Min'}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={`text-center py-8 text-[12px] ${t.text.muted}`}>
          {i.miNoWindows || 'No windows. Create one to get started.'}
        </div>
      )}
    </div>
  );
}

// ── Workspaces Tab ──

function WorkspacesTab({ t, i, search }: { t: ThemeTokens; i: I18nStrings; search: string }) {
  const {
    workspaces,
    activeWorkspaceId,
    createWorkspace,
    activateWorkspace,
    deleteWorkspace,
    duplicateWorkspace,
    exportWorkspace,
    importWorkspace,
  } = useWorkspaceManagerStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<WorkspaceType>('project');

  const filtered = useMemo(
    () =>
      workspaces.filter(
        (ws) =>
          !search ||
          ws.name.toLowerCase().includes(search.toLowerCase()) ||
          ws.type.includes(search.toLowerCase())
      ),
    [workspaces, search]
  );

  const handleCreate = () => {
    createWorkspace(newName || 'New Workspace', newType);
    toast.success(i.miWorkspaceCreated || 'Workspace created');
    setShowCreate(false);
    setNewName('');
  };

  const handleExport = (wsId: string) => {
    const json = exportWorkspace(wsId);
    navigator.clipboard.writeText(json);
    toast.success(i.miExported || 'Exported to clipboard');
  };

  const handleImport = () => {
    const json = prompt(i.miPasteJson || 'Paste workspace JSON:');
    if (json) {
      try {
        importWorkspace(json);
        toast.success(i.miImported || 'Workspace imported');
      } catch {
        toast.error(i.miImportFailed || 'Invalid JSON');
      }
    }
  };

  const WS_ICONS: Record<WorkspaceType, React.ReactNode> = {
    project: <FolderOpen className="w-3.5 h-3.5" />,
    'ai-session': <Bot className="w-3.5 h-3.5" />,
    debug: <Bug className="w-3.5 h-3.5" />,
    custom: <Settings className="w-3.5 h-3.5" />,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={`text-[11px] ${t.text.muted}`}>
          {filtered.length} {i.miWorkspaceCount || 'workspaces'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImport}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] ${t.isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Upload className="w-3 h-3" /> {i.miImport || 'Import'}
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] ${t.isDark ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
          >
            <Plus className="w-3 h-3" /> {i.miNewWorkspace || 'New'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div
          className={`p-3 rounded-xl border ${t.isDark ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}
        >
          <div className="flex items-center gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as WorkspaceType)}
              className={`text-[11px] rounded-lg px-2 py-1 ${t.isDark ? 'bg-slate-700 text-white border-white/10' : 'bg-white text-slate-800 border-slate-200'} border`}
            >
              {(['project', 'ai-session', 'debug', 'custom'] as WorkspaceType[]).map((wt) => (
                <option key={wt} value={wt}>
                  {wt}
                </option>
              ))}
            </select>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={i.miWorkspaceName || 'Name...'}
              className={`flex-1 text-[11px] rounded-lg px-2 py-1 ${t.isDark ? 'bg-slate-700 text-white border-white/10' : 'bg-white text-slate-800 border-slate-200'} border outline-none`}
            />
            <button
              onClick={handleCreate}
              className="px-3 py-1 rounded-lg bg-indigo-500 text-white text-[11px] hover:bg-indigo-600"
            >
              {i.miCreate || 'Create'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((ws) => (
          <div
            key={ws.id}
            className={`p-3 rounded-xl border transition-all ${ws.id === activeWorkspaceId ? (t.isDark ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-indigo-300 bg-indigo-50/50') : t.isDark ? 'bg-slate-800/40 border-white/5 hover:border-white/10' : 'bg-white border-slate-200 hover:border-slate-300'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {WS_ICONS[ws.type]}
                <span
                  className={`text-[12px] ${t.isDark ? 'text-white' : 'text-slate-800'}`}
                  style={{ fontWeight: 600 }}
                >
                  {ws.name}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded ${t.isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}
                >
                  {ws.type}
                </span>
                {ws.isActive && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => {
                    activateWorkspace(ws.id);
                    toast.success(i.miActivated || 'Activated');
                  }}
                  className={`p-1 rounded ${t.isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                  title="Activate"
                >
                  <Play className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    duplicateWorkspace(ws.id);
                    toast.success(i.miDuplicated || 'Duplicated');
                  }}
                  className={`p-1 rounded ${t.isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                  title="Duplicate"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleExport(ws.id)}
                  className={`p-1 rounded ${t.isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                  title="Export"
                >
                  <Download className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    deleteWorkspace(ws.id);
                    toast.info(i.miDeleted || 'Deleted');
                  }}
                  className={`p-1 rounded ${t.isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className={`text-[9px] ${t.text.dimmed}`}>
                {ws.sessionIds.length} {i.miSessionCount || 'sessions'}
              </span>
              <span className={`text-[9px] ${t.text.dimmed}`}>
                {new Date(ws.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={`text-center py-8 text-[12px] ${t.text.muted}`}>
          {i.miNoWorkspaces || 'No workspaces.'}
        </div>
      )}
    </div>
  );
}

// ── Sessions Tab ──

function SessionsTab({ t, i, search }: { t: ThemeTokens; i: I18nStrings; search: string }) {
  const {
    sessions,
    activeSessionId,
    createSession,
    deleteSession,
    activateSession,
    suspendSession,
    resumeSession,
    getSessionStats,
  } = useSessionManagerStore();
  const workspaces = useWorkspaceManagerStore((s) => s.workspaces);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<SessionType>('ai-chat');
  const [newWsId, setNewWsId] = useState('');

  const stats = getSessionStats();

  const filtered = useMemo(
    () =>
      sessions.filter(
        (s) =>
          !search ||
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.type.includes(search.toLowerCase())
      ),
    [sessions, search]
  );

  const handleCreate = () => {
    const wsId = newWsId || workspaces[0]?.id || 'default';
    createSession(newName || 'New Session', newType, wsId);
    toast.success(i.miSessionCreated || 'Session created');
    setShowCreate(false);
    setNewName('');
  };

  const STATUS_COLORS: Record<string, string> = {
    active: 'text-green-400',
    idle: 'text-amber-400',
    suspended: 'text-orange-400',
    closed: 'text-slate-500',
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex items-center gap-4">
        {[
          {
            label: i.miTotal || 'Total',
            value: stats.total,
            color: t.isDark ? 'text-white' : 'text-slate-800',
          },
          { label: i.miActive || 'Active', value: stats.active, color: 'text-green-400' },
          { label: i.miIdle || 'Idle', value: stats.idle, color: 'text-amber-400' },
          { label: i.miSuspended || 'Suspended', value: stats.suspended, color: 'text-orange-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`px-3 py-1.5 rounded-lg ${t.isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}
          >
            <span className={`text-[14px] ${stat.color}`} style={{ fontWeight: 700 }}>
              {stat.value}
            </span>
            <span className={`text-[9px] ${t.text.dimmed} ml-1`}>{stat.label}</span>
          </div>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] ${t.isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}
        >
          <Plus className="w-3 h-3" /> {i.miNewSession || 'New'}
        </button>
      </div>

      {showCreate && (
        <div
          className={`p-3 rounded-xl border ${t.isDark ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}
        >
          <div className="flex items-center gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as SessionType)}
              className={`text-[11px] rounded-lg px-2 py-1 ${t.isDark ? 'bg-slate-700 text-white border-white/10' : 'bg-white text-slate-800 border-slate-200'} border`}
            >
              {(['ai-chat', 'code-edit', 'debug', 'preview', 'terminal'] as SessionType[]).map(
                (st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                )
              )}
            </select>
            {workspaces.length > 0 && (
              <select
                value={newWsId}
                onChange={(e) => setNewWsId(e.target.value)}
                className={`text-[11px] rounded-lg px-2 py-1 ${t.isDark ? 'bg-slate-700 text-white border-white/10' : 'bg-white text-slate-800 border-slate-200'} border`}
              >
                <option value="">{i.miSelectWorkspace || 'Workspace...'}</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            )}
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={i.miSessionName || 'Name...'}
              className={`flex-1 text-[11px] rounded-lg px-2 py-1 ${t.isDark ? 'bg-slate-700 text-white border-white/10' : 'bg-white text-slate-800 border-slate-200'} border outline-none`}
            />
            <button
              onClick={handleCreate}
              className="px-3 py-1 rounded-lg bg-indigo-500 text-white text-[11px] hover:bg-indigo-600"
            >
              {i.miCreate || 'Create'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((ses) => (
          <div
            key={ses.id}
            className={`p-3 rounded-xl border transition-all ${ses.id === activeSessionId ? (t.isDark ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-indigo-300 bg-indigo-50/50') : t.isDark ? 'bg-slate-800/40 border-white/5' : 'bg-white border-slate-200'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {SESSION_TYPE_ICONS[ses.type]}
                <span
                  className={`text-[12px] ${t.isDark ? 'text-white' : 'text-slate-800'}`}
                  style={{ fontWeight: 500 }}
                >
                  {ses.name}
                </span>
                <span
                  className={`text-[8px] px-1.5 py-0.5 rounded ${STATUS_COLORS[ses.status]} ${t.isDark ? 'bg-white/5' : 'bg-slate-100'}`}
                >
                  {ses.status}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {ses.status === 'suspended' ? (
                  <button
                    onClick={() => {
                      resumeSession(ses.id);
                      toast.success(i.miResumed || 'Resumed');
                    }}
                    className={`p-1 rounded ${t.isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                    title="Resume"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                ) : ses.status === 'active' ? (
                  <button
                    onClick={() => {
                      suspendSession(ses.id);
                      toast.info(i.miSuspendedAction || 'Suspended');
                    }}
                    className={`p-1 rounded ${t.isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                    title="Suspend"
                  >
                    <Pause className="w-3 h-3" />
                  </button>
                ) : null}
                <button
                  onClick={() => {
                    activateSession(ses.id);
                    toast.success(i.miFocused || 'Focused');
                  }}
                  className={`p-1 rounded ${t.isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                  title="Focus"
                >
                  <ArrowUpRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    deleteSession(ses.id);
                    toast.info(i.miDeleted || 'Deleted');
                  }}
                  className={`p-1 rounded ${t.isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-[9px] ${t.text.dimmed}`}>{ses.type}</span>
              <span className={`text-[9px] ${t.text.dimmed}`}>
                {new Date(ses.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={`text-center py-8 text-[12px] ${t.text.muted}`}>
          {i.miNoSessions || 'No sessions.'}
        </div>
      )}
    </div>
  );
}

// ── IPC Log Tab ──

function IPCLogTab({ t, i, search }: { t: ThemeTokens; i: I18nStrings; search: string }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const messages = useMemo(() => {
    const log = ipcManager.getMessageLog();
    if (!search) return log.slice(-50).reverse();
    return log
      .filter(
        (m) =>
          m.type.includes(search.toLowerCase()) ||
          JSON.stringify(m.data).toLowerCase().includes(search.toLowerCase())
      )
      .slice(-50)
      .reverse();
  }, [search, refreshKey]);

  const MSG_COLORS: Record<string, string> = {
    'instance-created': 'text-green-400',
    'instance-closed': 'text-red-400',
    'workspace-created': 'text-blue-400',
    'workspace-closed': 'text-orange-400',
    'session-created': 'text-emerald-400',
    'session-closed': 'text-amber-400',
    'state-sync': 'text-indigo-400',
    'resource-share': 'text-purple-400',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={`text-[11px] ${t.text.muted}`}>
          {messages.length} {i.miMessages || 'messages'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] ${t.isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <RefreshCw className="w-3 h-3" /> {i.miRefresh || 'Refresh'}
          </button>
          <button
            onClick={() => {
              ipcManager.clearLog();
              setRefreshKey((k) => k + 1);
              toast.info(i.miCleared || 'Log cleared');
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] ${t.isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}
          >
            <Trash2 className="w-3 h-3" /> {i.miClear || 'Clear'}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 p-2 rounded-lg ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}
          >
            <span
              className={`text-[9px] flex-shrink-0 mt-0.5 ${MSG_COLORS[msg.type] || t.text.dimmed}`}
              style={{ fontWeight: 600 }}
            >
              {msg.type}
            </span>
            <span className={`text-[9px] ${t.text.dimmed} flex-1 truncate font-mono`}>
              {typeof msg.data === 'object'
                ? JSON.stringify(msg.data).substring(0, 120)
                : String(msg.data)}
            </span>
            <span className={`text-[8px] ${t.text.dimmed} flex-shrink-0`}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      {messages.length === 0 && (
        <div className={`text-center py-8 text-[12px] ${t.text.muted}`}>
          {i.miNoMessages || 'No IPC messages yet.'}
        </div>
      )}
    </div>
  );
}
