/**
 * @file SettingsPage.tsx
 * @description YYC³便携式智能AI系统 - 完整设置页面
 * Full Settings Page (Liquid Glass)
 * Sections: Account, General, Agents, MCP, Models, Context, ChatFlow, Rules & Skills
 * Integrates with global Zustand store (theme/language/models) + settingsStore
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,settings,page,ui
 */

import {
  ArrowLeft,
  Search,
  User,
  Settings2,
  Bot,
  Plug,
  Cpu,
  BookOpen,
  MessageSquareMore,
  ScrollText,
  ChevronRight,
  Moon,
  Keyboard,
  Download,
  Plus,
  Trash2,
  Check,
  ToggleLeft,
  ToggleRight,
  Play,
  Volume2,
  Shield,
  Zap,
  FileText,
  Code2,
  Pencil,
  X,
  RefreshCw,
  FolderOpen,
  Star,
  Loader2,
  CheckCircle,
  XCircle,
  Wifi,
  AlertTriangle,
  Cloud,
} from 'lucide-react';
import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { aiProviderService } from '../services/ai-provider';
import {
  initializeSettingsIntegration,
  deepSearchSettings,
  testMcpConnection,
  getActiveKeybindings,
  detectShortcutConflicts,
  SHORTCUT_ACTION_LABELS,
} from '../services/settings-integration';
import { useSettingsStore } from '../settingsStore';
import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import type { Language } from '../utils/i18n';
import { getThemeTokens, THEME_PRESETS } from '../utils/theme';
import type { ThemeMode } from '../utils/theme';

// 动态加载ModelSettings组件（代码分割）
const ModelSettings = lazy(() =>
  import('./ModelSettings').then((m) => ({ default: m.ModelSettings }))
);

type SettingsTab =
  | 'account'
  | 'general'
  | 'agents'
  | 'mcp'
  | 'models'
  | 'context'
  | 'chatflow'
  | 'rules';

const TAB_ICONS: Record<SettingsTab, React.ReactNode> = {
  account: <User size={18} />,
  general: <Settings2 size={18} />,
  agents: <Bot size={18} />,
  mcp: <Plug size={18} />,
  models: <Cpu size={18} />,
  context: <BookOpen size={18} />,
  chatflow: <MessageSquareMore size={18} />,
  rules: <ScrollText size={18} />,
};

// ── Toggle Component ──
function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 cursor-pointer"
      type="button"
    >
      {value ? (
        <ToggleRight size={22} className="text-indigo-400" />
      ) : (
        <ToggleLeft size={22} className="text-slate-500" />
      )}
      {label && <span className="text-[13px]">{label}</span>}
    </button>
  );
}

// ── Glass Card ──
function GlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const t = getThemeTokens(useAppStore((s) => s.theme));
  return (
    <div
      className={`rounded-xl border ${t.isDark ? 'bg-slate-800/40 border-white/8' : 'bg-white/60 border-slate-200/50'} backdrop-blur-xl p-5 ${className}`}
    >
      {children}
    </div>
  );
}

// ── Section Header ──
function SectionHeader({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
}) {
  const t = getThemeTokens(useAppStore((s) => s.theme));
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 rounded-lg ${t.isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-[15px]" style={{ fontWeight: 600 }}>
          {title}
        </h3>
        {desc && <p className={`text-[12px] mt-0.5 ${t.text.tertiary}`}>{desc}</p>}
      </div>
    </div>
  );
}

// ─────────── Tab Panels ───────────

function AccountPanel() {
  const lang = useAppStore((s) => s.language);
  const i = getI18n(lang);
  const { account, updateAccount } = useSettingsStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(account);

  const save = () => {
    updateAccount(draft);
    setEditing(false);
    toast.success(i.stSaved);
  };

  return (
    <GlassCard>
      <SectionHeader
        icon={<User size={18} className="text-indigo-400" />}
        title={i.stAccount}
        desc={i.stAccountDesc}
      />
      <div className="flex items-center gap-5 mt-4">
        <div
          className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-[22px]"
          style={{ fontWeight: 700 }}
        >
          {account.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <label className="text-[12px] opacity-50 mb-1 block">{i.stUsername}</label>
            {editing ? (
              <input
                value={draft.username}
                onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-black/20 border border-white/10 text-[13px] outline-none"
              />
            ) : (
              <p className="text-[14px]">{account.username}</p>
            )}
          </div>
          <div>
            <label className="text-[12px] opacity-50 mb-1 block">{i.stEmail}</label>
            {editing ? (
              <input
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-black/20 border border-white/10 text-[13px] outline-none"
              />
            ) : (
              <p className="text-[14px]">{account.email}</p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        {editing ? (
          <>
            <button
              onClick={save}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] flex items-center gap-1.5"
            >
              <Check size={14} />
              {i.stSaveProfile}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setDraft(account);
              }}
              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[13px] flex items-center gap-1.5"
            >
              <X size={14} />
              {i.msCancel}
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setDraft(account);
              setEditing(true);
            }}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[13px] flex items-center gap-1.5"
          >
            <Pencil size={14} />
            {i.stEditProfile}
          </button>
        )}
      </div>
    </GlassCard>
  );
}

function GeneralPanel() {
  const lang = useAppStore((s) => s.language);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const i = getI18n(lang);
  const t = getThemeTokens(theme);
  const {
    editor,
    updateEditor,
    shortcutScheme,
    setShortcutScheme,
    customKeybindings,
    setCustomKeybinding,
    resetCustomKeybindings,
    linkOpenMethod,
    setLinkOpenMethod,
    markdownOpenMethod,
    setMarkdownOpenMethod,
    nodeVersions,
    activeNodeVersion,
    addNodeVersion,
    removeNodeVersion,
    setActiveNodeVersion,
  } = useSettingsStore();
  const [newNode, setNewNode] = useState('');
  const [recordingAction, setRecordingAction] = useState<string | null>(null);

  /** Convert a KeyboardEvent to a human-readable shortcut string */
  const eventToShortcutStr = useCallback((e: KeyboardEvent): string | null => {
    const key = e.key;
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return null;
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    const keyName = key.length === 1 ? key.toUpperCase() : key === ' ' ? 'Space' : key;
    parts.push(keyName);
    return parts.join('+');
  }, []);

  // Global keydown listener for recording mode
  useEffect(() => {
    if (!recordingAction) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setRecordingAction(null);
        return;
      }
      const str = eventToShortcutStr(e);
      if (str) {
        setCustomKeybinding(recordingAction, str);
        setRecordingAction(null);
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [recordingAction, eventToShortcutStr, setCustomKeybinding]);

  // Compute active bindings and conflicts (re-derive on scheme/custom changes)
  const activeBindings = useMemo(() => getActiveKeybindings(), [shortcutScheme, customKeybindings]);
  const conflicts = useMemo(() => detectShortcutConflicts(), [shortcutScheme, customKeybindings]);
  const conflictActions = useMemo(() => {
    const set = new Set<string>();
    for (const actions of conflicts.values()) actions.forEach((a) => set.add(a));
    return set;
  }, [conflicts]);

  const langOptions: { id: Language; label: string }[] = [
    { id: 'zh', label: '中文' },
    { id: 'en', label: 'English' },
    { id: 'ja', label: '日本語' },
    { id: 'ko', label: '한국어' },
  ];

  const importConfig = (source: string) => {
    if (confirm(i.stImportWarning)) {
      toast.success(`${i.stImportConfig}: ${source}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Theme */}
      <GlassCard>
        <SectionHeader
          icon={<Moon size={18} className="text-indigo-400" />}
          title={i.stBasicSettings}
        />
        <div className="space-y-4">
          <div>
            <label className="text-[12px] opacity-50 mb-2 block">{i.stTheme}</label>
            <div className="flex gap-2 flex-wrap">
              {THEME_PRESETS.map((tp) => (
                <button
                  key={tp.id}
                  onClick={() => setTheme(tp.id as ThemeMode)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] flex items-center gap-1.5 transition-all ${theme === tp.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : t.isDark ? 'bg-white/8 hover:bg-white/12' : 'bg-slate-100 hover:bg-slate-200'}`}
                >
                  <span>{tp.icon}</span>
                  {i[tp.labelKey as keyof typeof i] as string}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[12px] opacity-50 mb-2 block">{i.stLanguageSetting}</label>
            <div className="flex gap-2">
              {langOptions.map((lo) => (
                <button
                  key={lo.id}
                  onClick={() => {
                    setLanguage(lo.id);
                    toast.success(i.toastLanguageSwitched);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${lang === lo.id ? 'bg-indigo-600 text-white' : t.isDark ? 'bg-white/8 hover:bg-white/12' : 'bg-slate-100 hover:bg-slate-200'}`}
                >
                  {lo.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Editor */}
      <GlassCard>
        <SectionHeader
          icon={<Code2 size={18} className="text-blue-400" />}
          title={i.stEditorSettings}
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] opacity-50 mb-1 block">{i.stFontFamily}</label>
            <input
              value={editor.fontFamily}
              onChange={(e) => updateEditor({ fontFamily: e.target.value })}
              className={`w-full px-3 py-1.5 rounded-lg text-[13px] outline-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white/60 border border-slate-200'}`}
            />
          </div>
          <div>
            <label className="text-[12px] opacity-50 mb-1 block">{i.stFontSize}</label>
            <input
              type="number"
              value={editor.fontSize}
              onChange={(e) => updateEditor({ fontSize: Number(e.target.value) })}
              className={`w-full px-3 py-1.5 rounded-lg text-[13px] outline-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white/60 border border-slate-200'}`}
            />
          </div>
          <div>
            <label className="text-[12px] opacity-50 mb-1 block">{i.stTabSize}</label>
            <select
              value={editor.tabSize}
              onChange={(e) => updateEditor({ tabSize: Number(e.target.value) })}
              className={`w-full px-3 py-1.5 rounded-lg text-[13px] outline-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white/60 border border-slate-200'}`}
            >
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={8}>8</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 justify-center">
            <Toggle
              value={editor.wordWrap}
              onChange={(v) => updateEditor({ wordWrap: v })}
              label={i.stWordWrap}
            />
            <Toggle
              value={editor.minimap}
              onChange={(v) => updateEditor({ minimap: v })}
              label={i.stMinimap}
            />
            <Toggle
              value={editor.lineNumbers}
              onChange={(v) => updateEditor({ lineNumbers: v })}
              label={i.stLineNumbers}
            />
          </div>
        </div>
      </GlassCard>

      {/* Shortcuts */}
      <GlassCard>
        <SectionHeader
          icon={<Keyboard size={18} className="text-amber-400" />}
          title={i.stShortcutSettings}
        />
        <div className="flex gap-2 mb-4">
          {(['vscode', 'cursor', 'custom'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setShortcutScheme(s)}
              className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${shortcutScheme === s ? 'bg-indigo-600 text-white' : t.isDark ? 'bg-white/8 hover:bg-white/12' : 'bg-slate-100 hover:bg-slate-200'}`}
            >
              {s === 'vscode'
                ? i.stVscodeScheme
                : s === 'cursor'
                  ? i.stCursorScheme
                  : i.stCustomScheme}
            </button>
          ))}
        </div>

        {/* ── Custom Keybinding Editor ── */}
        {shortcutScheme === 'custom' && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px]" style={{ fontWeight: 500 }}>
                  {i.stCustomShortcutEditor}
                </p>
                <p className={`text-[11px] mt-0.5 ${t.text.muted}`}>{i.stCustomShortcutDesc}</p>
              </div>
              <button
                onClick={() => {
                  resetCustomKeybindings();
                  toast.success(i.stSaved);
                }}
                className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 text-[11px] hover:bg-red-500/25 flex items-center gap-1"
              >
                <RefreshCw size={11} /> {i.stShortcutReset}
              </button>
            </div>

            {/* Conflict warnings */}
            {conflicts.size > 0 && (
              <div
                className={`rounded-lg px-3 py-2.5 ${t.isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                  <span className="text-[12px] text-amber-500" style={{ fontWeight: 600 }}>
                    {i.stShortcutConflict}
                  </span>
                </div>
                <p
                  className={`text-[11px] mb-1.5 ${t.isDark ? 'text-amber-400/70' : 'text-amber-700/70'}`}
                >
                  {i.stShortcutConflictDesc}
                </p>
                <div className="space-y-1">
                  {Array.from(conflicts.entries()).map(([shortcut, actions]) => (
                    <div
                      key={shortcut}
                      className={`flex items-center gap-2 text-[11px] px-2 py-1 rounded ${t.isDark ? 'bg-amber-500/10' : 'bg-amber-100/60'}`}
                    >
                      <kbd
                        className={`px-1.5 py-0.5 rounded text-[10px] ${t.isDark ? 'bg-black/30 text-amber-300' : 'bg-white text-amber-700'}`}
                      >
                        {shortcut}
                      </kbd>
                      <span className="text-amber-500">&rarr;</span>
                      <span className={t.isDark ? 'text-amber-300/80' : 'text-amber-700/80'}>
                        {actions.map((a) => SHORTCUT_ACTION_LABELS[a] || a).join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keybinding table */}
            <div
              className={`rounded-lg overflow-hidden border ${t.isDark ? 'border-white/8' : 'border-slate-200/60'}`}
            >
              <div
                className={`grid grid-cols-[1fr_160px] gap-0 ${t.isDark ? 'bg-white/5' : 'bg-slate-100/80'}`}
              >
                <div className="px-3 py-2 text-[11px] opacity-60" style={{ fontWeight: 600 }}>
                  {i.stShortcutAction}
                </div>
                <div className="px-3 py-2 text-[11px] opacity-60" style={{ fontWeight: 600 }}>
                  {i.stShortcutBinding}
                </div>
              </div>
              <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                {Object.entries(SHORTCUT_ACTION_LABELS).map(([actionId, label]) => {
                  const binding = activeBindings[actionId] || '';
                  const isRecording = recordingAction === actionId;
                  const hasConflict = conflictActions.has(actionId);
                  return (
                    <div
                      key={actionId}
                      className={`grid grid-cols-[1fr_160px] gap-0 border-t ${t.isDark ? 'border-white/5' : 'border-slate-100'} ${hasConflict ? (t.isDark ? 'bg-amber-500/5' : 'bg-amber-50/50') : ''}`}
                    >
                      <div className="px-3 py-2 text-[12px] flex items-center gap-1.5">
                        {hasConflict && (
                          <AlertTriangle size={11} className="text-amber-500 shrink-0" />
                        )}
                        {label}
                      </div>
                      <div className="px-3 py-1.5 flex items-center">
                        <button
                          onClick={() => setRecordingAction(isRecording ? null : actionId)}
                          className={`px-2 py-1 rounded text-[11px] font-mono transition-all w-full text-center ${
                            isRecording
                              ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 animate-pulse'
                              : hasConflict
                                ? t.isDark
                                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20'
                                  : 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                                : t.isDark
                                  ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                                  : 'bg-white border border-slate-200 hover:bg-slate-50'
                          }`}
                          title={isRecording ? i.stShortcutPressKeys : binding}
                        >
                          {isRecording ? i.stShortcutRecording : binding || '\u2014'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-[12px] opacity-50 mb-1.5 block">{i.stImportConfig}</label>
            <p className={`text-[11px] mb-2 ${t.text.muted}`}>{i.stImportConfigDesc}</p>
            <div className="flex gap-2">
              <button
                onClick={() => importConfig('VS Code')}
                className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 text-[12px] hover:bg-blue-500/25 flex items-center gap-1.5"
              >
                <Download size={13} />
                {i.stImportVscode}
              </button>
              <button
                onClick={() => importConfig('Cursor')}
                className="px-3 py-1.5 rounded-lg bg-purple-500/15 text-purple-400 text-[12px] hover:bg-purple-500/25 flex items-center gap-1.5"
              >
                <Download size={13} />
                {i.stImportCursor}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] opacity-50 mb-1 block">{i.stLinkOpenMethod}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLinkOpenMethod('system')}
                  className={`px-3 py-1 rounded-lg text-[12px] ${linkOpenMethod === 'system' ? 'bg-indigo-600 text-white' : t.isDark ? 'bg-white/8' : 'bg-slate-100'}`}
                >
                  {i.stSystemBrowser}
                </button>
                <button
                  onClick={() => setLinkOpenMethod('builtin')}
                  className={`px-3 py-1 rounded-lg text-[12px] ${linkOpenMethod === 'builtin' ? 'bg-indigo-600 text-white' : t.isDark ? 'bg-white/8' : 'bg-slate-100'}`}
                >
                  {i.stBuiltinBrowser}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[12px] opacity-50 mb-1 block">{i.stMarkdownOpenMethod}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMarkdownOpenMethod('editor')}
                  className={`px-3 py-1 rounded-lg text-[12px] ${markdownOpenMethod === 'editor' ? 'bg-indigo-600 text-white' : t.isDark ? 'bg-white/8' : 'bg-slate-100'}`}
                >
                  {i.stCodeEditorOpen}
                </button>
                <button
                  onClick={() => setMarkdownOpenMethod('preview')}
                  className={`px-3 py-1 rounded-lg text-[12px] ${markdownOpenMethod === 'preview' ? 'bg-indigo-600 text-white' : t.isDark ? 'bg-white/8' : 'bg-slate-100'}`}
                >
                  {i.stMarkdownPreview}
                </button>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Node.js */}
      <GlassCard>
        <SectionHeader
          icon={<Zap size={18} className="text-emerald-400" />}
          title={i.stNodeVersion}
        />
        <div className="space-y-2">
          {nodeVersions.map((v) => (
            <div
              key={v}
              className={`flex items-center justify-between px-3 py-2 rounded-lg ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
            >
              <span className="text-[13px] flex items-center gap-2">
                {v === activeNodeVersion && <Star size={13} className="text-amber-400" />}
                {v}
              </span>
              <div className="flex gap-1.5">
                {v !== activeNodeVersion && (
                  <button
                    onClick={() => setActiveNodeVersion(v)}
                    className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25"
                  >
                    {i.stCurrentNode}
                  </button>
                )}
                <button
                  onClick={() => removeNodeVersion(v)}
                  className="text-[11px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              placeholder="v22.0.0"
              value={newNode}
              onChange={(e) => setNewNode(e.target.value)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-[13px] outline-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white/60 border border-slate-200'}`}
            />
            <button
              onClick={() => {
                if (newNode.trim()) {
                  addNodeVersion(newNode.trim());
                  setNewNode('');
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-[12px] hover:bg-emerald-500/25 flex items-center gap-1"
            >
              <Plus size={13} />
              {i.stAddNodeVersion}
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function AgentsPanel() {
  const lang = useAppStore((s) => s.language);
  const theme = useAppStore((s) => s.theme);
  const t = getThemeTokens(theme);
  const i = getI18n(lang);
  const { agents, addAgent, updateAgent, removeAgent } = useSettingsStore();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', description: '', prompt: '' });

  const builtinAgents = agents.filter((a) => a.builtin);
  const customAgents = agents.filter((a) => !a.builtin);

  const handleAdd = () => {
    if (!draft.name.trim()) return;
    addAgent({ ...draft, builtin: false, enabled: true });
    setDraft({ name: '', description: '', prompt: '' });
    setAdding(false);
    toast.success(i.stSaved);
  };

  return (
    <div className="space-y-5">
      <GlassCard>
        <SectionHeader
          icon={<Bot size={18} className="text-purple-400" />}
          title={i.stBuiltinAgents}
        />
        <div className="space-y-2">
          {builtinAgents.map((a) => (
            <div
              key={a.id}
              className={`flex items-center justify-between px-4 py-3 rounded-lg ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
            >
              <div className="flex-1">
                <p className="text-[13px]" style={{ fontWeight: 500 }}>
                  {a.name}
                </p>
                <p className={`text-[11px] mt-0.5 ${t.text.muted}`}>{a.description}</p>
              </div>
              <Toggle value={a.enabled} onChange={(v) => updateAgent(a.id, { enabled: v })} />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            icon={<Bot size={18} className="text-indigo-400" />}
            title={i.stCustomAgents}
          />
          <button
            onClick={() => setAdding(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 text-[12px] hover:bg-indigo-500/25 flex items-center gap-1.5"
          >
            <Plus size={13} />
            {i.stAddAgent}
          </button>
        </div>
        {adding && (
          <div
            className={`p-4 rounded-lg mb-3 space-y-3 ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
          >
            <input
              placeholder={i.stAgentName}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={`w-full px-3 py-1.5 rounded-lg text-[13px] outline-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white border border-slate-200'}`}
            />
            <input
              placeholder={i.stAgentDesc}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className={`w-full px-3 py-1.5 rounded-lg text-[13px] outline-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white border border-slate-200'}`}
            />
            <textarea
              placeholder={i.stAgentPrompt}
              value={draft.prompt}
              onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
              rows={3}
              className={`w-full px-3 py-1.5 rounded-lg text-[13px] outline-none resize-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white border border-slate-200'}`}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[12px]"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => setAdding(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-[12px]"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}
        {customAgents.length === 0 && !adding && (
          <p className={`text-[13px] text-center py-6 ${t.text.muted}`}>{i.stNoAgents}</p>
        )}
        {customAgents.map((a) => (
          <div
            key={a.id}
            className={`flex items-center justify-between px-4 py-3 rounded-lg mb-2 ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
          >
            <div className="flex-1">
              <p className="text-[13px]" style={{ fontWeight: 500 }}>
                {a.name}
              </p>
              <p className={`text-[11px] mt-0.5 ${t.text.muted}`}>{a.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Toggle value={a.enabled} onChange={(v) => updateAgent(a.id, { enabled: v })} />
              <button
                onClick={() => removeAgent(a.id)}
                className="p-1 rounded hover:bg-red-500/15 text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

function McpPanel() {
  const lang = useAppStore((s) => s.language);
  const theme = useAppStore((s) => s.theme);
  const t = getThemeTokens(theme);
  const i = getI18n(lang);
  const { mcpServers, addMcp, removeMcp, updateMcp, projectMcpAutoLoad, setProjectMcpAutoLoad } =
    useSettingsStore();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', endpoint: '', type: 'stdio' as const });
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testProgress, setTestProgress] = useState<Record<string, number>>({});
  const [testResults, setTestResults] = useState<
    Record<string, { ok: boolean; latency: number; error?: string }>
  >({});

  const handleAdd = () => {
    if (!draft.name.trim()) return;
    addMcp({ ...draft, enabled: true, isProject: false });
    setDraft({ name: '', endpoint: '', type: 'stdio' });
    setAdding(false);
    toast.success(i.stSaved);
  };

  const handleTestConnection = async (mcpId: string, endpoint: string, type: string) => {
    setTestingId(mcpId);
    setTestProgress((prev) => ({ ...prev, [mcpId]: 0 }));

    // 模拟进度动画
    const progressInterval = setInterval(() => {
      setTestProgress((prev) => {
        const current = prev[mcpId] || 0;
        const newProgress = Math.min(current + 10, 90);
        return { ...prev, [mcpId]: newProgress };
      });
    }, 200);

    try {
      const result = await testMcpConnection(endpoint, type);
      clearInterval(progressInterval);
      setTestProgress((prev) => ({ ...prev, [mcpId]: 100 }));
      setTestResults((prev) => ({ ...prev, [mcpId]: result }));
      if (result.ok) {
        toast.success(`${i.toastConnected} (${result.latency}ms)`);
      } else {
        toast.error(result.error || i.toastConnectionFailed);
      }
    } catch {
      clearInterval(progressInterval);
      setTestProgress((prev) => ({ ...prev, [mcpId]: 0 }));
      toast.error(i.toastConnectionFailed);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <GlassCard>
        <SectionHeader
          icon={<Plug size={18} className="text-emerald-400" />}
          title={i.stProjectMcp}
          desc={i.stProjectMcpDesc}
        />
        <Toggle
          value={projectMcpAutoLoad}
          onChange={setProjectMcpAutoLoad}
          label={i.stProjectMcpDesc}
        />
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            icon={<Plug size={18} className="text-indigo-400" />}
            title={i.stMcpList}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setAdding(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 text-[12px] hover:bg-indigo-500/25 flex items-center gap-1.5"
            >
              <Plus size={13} />
              {i.stAddManually}
            </button>
          </div>
        </div>
        {adding && (
          <div
            className={`p-4 rounded-lg mb-3 space-y-3 ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
          >
            <input
              placeholder={i.stMcpName}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={`w-full px-3 py-1.5 rounded-lg text-[13px] outline-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white border border-slate-200'}`}
            />
            <input
              placeholder={i.stMcpEndpoint}
              value={draft.endpoint}
              onChange={(e) => setDraft({ ...draft, endpoint: e.target.value })}
              className={`w-full px-3 py-1.5 rounded-lg text-[13px] outline-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white border border-slate-200'}`}
            />
            <select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value as any })}
              className={`w-full px-3 py-1.5 rounded-lg text-[13px] outline-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white border border-slate-200'}`}
            >
              <option value="stdio">stdio</option>
              <option value="sse">SSE</option>
              <option value="streamable-http">Streamable HTTP</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[12px] flex items-center gap-1"
              >
                <Check size={13} />
                {i.msAdd}
              </button>
              <button
                onClick={() => setAdding(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-[12px]"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}
        {mcpServers.length === 0 && !adding && (
          <p className={`text-[13px] text-center py-6 ${t.text.muted}`}>{i.stNoMcp}</p>
        )}
        {mcpServers.map((m) => {
          const testResult = testResults[m.id];
          const isTesting = testingId === m.id;
          return (
            <React.Fragment key={m.id}>
              <div
                className={`flex items-center justify-between px-4 py-3 rounded-lg mb-2 ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
              >
                <div className="flex-1">
                  <p className="text-[13px] flex items-center gap-2" style={{ fontWeight: 500 }}>
                    {m.name}
                    {testResult &&
                      (testResult.ok ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle size={10} />
                          {testResult.latency}ms
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 flex items-center gap-0.5">
                          <XCircle size={10} />
                          Error
                        </span>
                      ))}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${t.text.muted}`}>
                    {m.endpoint} ({m.type})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestConnection(m.id, m.endpoint, m.type)}
                    disabled={isTesting}
                    className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 ${t.isDark ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} disabled:opacity-50`}
                  >
                    {isTesting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Wifi size={12} />
                    )}
                    Test
                  </button>
                  <Toggle value={m.enabled} onChange={(v) => updateMcp(m.id, { enabled: v })} />
                  <button
                    onClick={() => removeMcp(m.id)}
                    className="p-1 rounded hover:bg-red-500/15 text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {isTesting && (
                <div className="px-4 pb-2 -mt-4">
                  <div
                    className={`h-1.5 rounded-full overflow-hidden ${t.isDark ? 'bg-white/10' : 'bg-slate-200'}`}
                  >
                    <div
                      className={`h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all ${isTesting ? 'animate-pulse' : ''}`}
                      style={{ width: `${testProgress[m.id] || 0}%` }}
                    />
                  </div>
                  <p className={`text-[10px] mt-1 ${t.text.muted}`}>
                    Testing connection... {testProgress[m.id] || 0}%
                  </p>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </GlassCard>
    </div>
  );
}

function ModelsPanel() {
  const lang = useAppStore((s) => s.language);
  const theme = useAppStore((s) => s.theme);
  const t = getThemeTokens(theme);
  const i = getI18n(lang);
  const { activeModelId, activateAIModel, openModelSettings } = useAppStore();
  const providers = aiProviderService.listProviders();

  // Get configured providers (with API keys or local Ollama)
  const configuredProviders = providers.filter((p) => p.apiKey || p.id === 'ollama');

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            icon={<Cpu size={18} className="text-blue-400" />}
            title={i.stModels}
            desc={i.stModelsDesc}
          />
          <button
            onClick={openModelSettings}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 text-[12px] hover:bg-indigo-500/25 flex items-center gap-1.5"
          >
            <Settings2 size={13} />
            {i.modelManagement}
          </button>
        </div>

        {configuredProviders.length === 0 ? (
          <div className={`text-center py-8 ${t.text.muted}`}>
            <Cpu size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-[13px]">{i.stModelsDesc}</p>
            <button
              onClick={openModelSettings}
              className="mt-3 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-[12px]"
            >
              {i.stAddModel}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {configuredProviders.map((provider) => {
              const hasModels = provider.models.length > 0;
              const isOllama = provider.id === 'ollama';
              return (
                <div
                  key={provider.id}
                  className={`p-4 rounded-xl border ${t.isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOllama ? 'bg-amber-500/10' : 'bg-indigo-500/10'}`}
                      >
                        {isOllama ? (
                          <Plug size={16} className="text-amber-400" />
                        ) : (
                          <Cloud size={16} className="text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-[13px] text-white/80" style={{ fontWeight: 500 }}>
                          {provider.displayName || provider.name}
                        </p>
                        <p className="text-[11px] text-white/30">
                          {isOllama
                            ? hasModels
                              ? `${provider.models.length} models detected`
                              : 'Click Auto Detect in Model Management'
                            : `${provider.models.length} models`}
                        </p>
                      </div>
                    </div>
                    {provider.apiKey && <CheckCircle size={16} className="text-emerald-400/60" />}
                    {isOllama && <CheckCircle size={16} className="text-emerald-400/60" />}
                  </div>
                  {hasModels && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {provider.models.slice(0, 6).map((model) => {
                        const modelKey = typeof model === 'string' ? model : model.id;
                        const modelName = typeof model === 'string' ? model : model.name;
                        const isActive = activeModelId === modelKey;
                        return (
                          <button
                            key={modelKey}
                            onClick={() => activateAIModel(modelKey)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                              isActive
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : t.isDark
                                  ? 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08] border border-white/[0.06]'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {modelName}
                            {isActive && <span className="ml-1">✓</span>}
                          </button>
                        );
                      })}
                      {provider.models.length > 6 && (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] text-white/30">
                          +{provider.models.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                  {isOllama && !hasModels && (
                    <div
                      className={`mt-3 p-3 rounded-lg border border-dashed ${t.isDark ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-500/30 bg-amber-50'}`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={14} className="text-amber-400/60 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-[11px] text-amber-400/80" style={{ fontWeight: 500 }}>
                            No models detected yet
                          </p>
                          <p className="text-[10px] text-amber-400/50 mt-0.5">
                            Click "Auto Detect" in Model Management to scan for locally installed
                            Ollama models
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Quick stats */}
      {configuredProviders.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="p-3 text-center">
            <div className="text-[24px] text-indigo-400" style={{ fontWeight: 700 }}>
              {configuredProviders.length}
            </div>
            <div className="text-[11px] text-white/30 mt-0.5">Providers</div>
          </GlassCard>
          <GlassCard className="p-3 text-center">
            <div className="text-[24px] text-emerald-400" style={{ fontWeight: 700 }}>
              {providers.reduce((sum, p) => sum + p.models.length, 0)}
            </div>
            <div className="text-[11px] text-white/30 mt-0.5">Models</div>
          </GlassCard>
          <GlassCard className="p-3 text-center">
            <div className="text-[24px] text-amber-400" style={{ fontWeight: 700 }}>
              {activeModelId ? '✓' : '-'}
            </div>
            <div className="text-[11px] text-white/30 mt-0.5">Active</div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function ContextPanel() {
  const lang = useAppStore((s) => s.language);
  const theme = useAppStore((s) => s.theme);
  const t = getThemeTokens(theme);
  const i = getI18n(lang);
  const {
    codeIndexEnabled,
    setCodeIndexEnabled,
    indexProgress,
    ignorePatterns,
    setIgnorePatterns,
    docSets,
    addDocSet,
    removeDocSet,
  } = useSettingsStore();
  const [docDraft, setDocDraft] = useState({ name: '', url: '' });

  return (
    <div className="space-y-5">
      <GlassCard>
        <SectionHeader
          icon={<FolderOpen size={18} className="text-blue-400" />}
          title={i.stCodeIndex}
          desc={i.stCodeIndexDesc}
        />
        <div className="space-y-3">
          <Toggle value={codeIndexEnabled} onChange={setCodeIndexEnabled} label={i.stCodeIndex} />
          {codeIndexEnabled && (
            <div>
              <label className="text-[12px] opacity-50 mb-1 block">{i.stIndexProgress}</label>
              <div
                className={`h-2 rounded-full overflow-hidden ${t.isDark ? 'bg-white/10' : 'bg-slate-200'}`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
                  style={{ width: `${indexProgress}%` }}
                />
              </div>
              <p className={`text-[11px] mt-1 ${t.text.muted}`}>{indexProgress}%</p>
              <div className="flex gap-2 mt-2">
                <button className="px-3 py-1 rounded-lg bg-blue-500/15 text-blue-400 text-[11px] flex items-center gap-1">
                  <RefreshCw size={12} />
                  {i.stRefreshIndex}
                </button>
                <button className="px-3 py-1 rounded-lg bg-red-500/15 text-red-400 text-[11px] flex items-center gap-1">
                  <Trash2 size={12} />
                  {i.stDeleteIndex}
                </button>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader
          icon={<Shield size={18} className="text-amber-400" />}
          title={i.stIgnoreFiles}
          desc={i.stIgnoreFilesDesc}
        />
        <textarea
          value={ignorePatterns}
          onChange={(e) => setIgnorePatterns(e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 rounded-lg text-[12px] font-mono outline-none resize-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white/60 border border-slate-200'}`}
        />
      </GlassCard>

      <GlassCard>
        <SectionHeader
          icon={<FileText size={18} className="text-emerald-400" />}
          title={i.stDocSets}
          desc={i.stDocSetsDesc}
        />
        {docSets.length === 0 && (
          <p className={`text-[13px] py-4 text-center ${t.text.muted}`}>{i.stNoDocSets}</p>
        )}
        {docSets.map((d) => (
          <div
            key={d.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg mb-2 ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
          >
            <div>
              <p className="text-[13px]">{d.name}</p>
              <p className={`text-[11px] ${t.text.muted}`}>{d.url}</p>
            </div>
            <button
              onClick={() => removeDocSet(d.id)}
              className="text-red-400 hover:bg-red-500/15 p-1 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <div className="flex gap-2 mt-3">
          <input
            placeholder={i.stDocUrl}
            value={docDraft.url}
            onChange={(e) =>
              setDocDraft({
                ...docDraft,
                url: e.target.value,
                name: e.target.value.split('/').pop() || '',
              })
            }
            className={`flex-1 px-3 py-1.5 rounded-lg text-[13px] outline-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white/60 border border-slate-200'}`}
          />
          <button
            onClick={() => {
              if (docDraft.url.trim()) {
                addDocSet({ name: docDraft.name || docDraft.url, url: docDraft.url, type: 'url' });
                setDocDraft({ name: '', url: '' });
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-[12px] flex items-center gap-1"
          >
            <Plus size={13} />
            {i.stAddDocSet}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

function ChatFlowPanel() {
  const lang = useAppStore((s) => s.language);
  const theme = useAppStore((s) => s.theme);
  const t = getThemeTokens(theme);
  const i = getI18n(lang);
  const ss = useSettingsStore();

  return (
    <div className="space-y-5">
      <GlassCard>
        <SectionHeader
          icon={<MessageSquareMore size={18} className="text-indigo-400" />}
          title={i.stChatFlow}
        />
        <div className="space-y-3">
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-lg ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
          >
            <div>
              <p className="text-[13px]">{i.stTodoList}</p>
              <p className={`text-[11px] ${t.text.muted}`}>{i.stTodoListDesc}</p>
            </div>
            <Toggle value={ss.todoListEnabled} onChange={ss.setTodoListEnabled} />
          </div>
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-lg ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
          >
            <div>
              <p className="text-[13px]">{i.stAutoCollapse}</p>
              <p className={`text-[11px] ${t.text.muted}`}>{i.stAutoCollapseDesc}</p>
            </div>
            <Toggle value={ss.autoCollapse} onChange={ss.setAutoCollapse} />
          </div>
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-lg ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
          >
            <div>
              <p className="text-[13px]">{i.stAutoFixCode}</p>
              <p className={`text-[11px] ${t.text.muted}`}>{i.stAutoFixCodeDesc}</p>
            </div>
            <Toggle value={ss.autoFixCode} onChange={ss.setAutoFixCode} />
          </div>
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-lg ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
          >
            <div>
              <p className="text-[13px]">{i.stAgentAsk}</p>
              <p className={`text-[11px] ${t.text.muted}`}>{i.stAgentAskDesc}</p>
            </div>
            <Toggle value={ss.agentAsk} onChange={ss.setAgentAsk} />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader
          icon={<Code2 size={18} className="text-blue-400" />}
          title={i.stCodeReview}
        />
        <div className="space-y-3">
          <div>
            <label className="text-[12px] opacity-50 mb-2 block">{i.stReviewScope}</label>
            <div className="flex gap-2">
              {(['none', 'all', 'changed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => ss.setReviewScope(s)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] ${ss.reviewScope === s ? 'bg-indigo-600 text-white' : t.isDark ? 'bg-white/8' : 'bg-slate-100'}`}
                >
                  {s === 'none' ? i.stReviewNone : s === 'all' ? i.stReviewAll : i.stReviewChanged}
                </button>
              ))}
            </div>
          </div>
          <Toggle
            value={ss.reviewAfterJump}
            onChange={ss.setReviewAfterJump}
            label={i.stReviewAfterJump}
          />
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader icon={<Zap size={18} className="text-amber-400" />} title={i.stAutoRun} />
        <div className="space-y-3">
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-lg ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
          >
            <div>
              <p className="text-[13px]">{i.stAutoRunMcp}</p>
              <p className={`text-[11px] ${t.text.muted}`}>{i.stAutoRunMcpDesc}</p>
            </div>
            <Toggle value={ss.autoRunMcp} onChange={ss.setAutoRunMcp} />
          </div>
          <div>
            <label className="text-[12px] opacity-50 mb-2 block">{i.stCommandRunMode}</label>
            <div className="flex gap-2">
              <button
                onClick={() => ss.setCommandRunMode('sandbox')}
                className={`px-3 py-1.5 rounded-lg text-[12px] ${ss.commandRunMode === 'sandbox' ? 'bg-indigo-600 text-white' : t.isDark ? 'bg-white/8' : 'bg-slate-100'}`}
              >
                {i.stSandboxRun}
              </button>
              <button
                onClick={() => ss.setCommandRunMode('direct')}
                className={`px-3 py-1.5 rounded-lg text-[12px] ${ss.commandRunMode === 'direct' ? 'bg-indigo-600 text-white' : t.isDark ? 'bg-white/8' : 'bg-slate-100'}`}
              >
                {i.stDirectRun}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[12px] opacity-50 mb-1 block">{i.stWhitelistCommands}</label>
            <textarea
              value={ss.whitelistCommands}
              onChange={(e) => ss.setWhitelistCommands(e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 rounded-lg text-[12px] font-mono outline-none resize-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white/60 border border-slate-200'}`}
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader
          icon={<Volume2 size={18} className="text-emerald-400" />}
          title={i.stTaskNotification}
        />
        <div className="space-y-3">
          <div className="flex gap-4">
            <Toggle
              value={ss.notifications.banner}
              onChange={(v) => ss.updateNotifications({ banner: v })}
              label={i.stNotifyBanner}
            />
            <Toggle
              value={ss.notifications.sound}
              onChange={(v) => ss.updateNotifications({ sound: v })}
              label={i.stNotifySound}
            />
            <Toggle
              value={ss.notifications.menuBar}
              onChange={(v) => ss.updateNotifications({ menuBar: v })}
              label={i.stNotifyMenuBar}
            />
          </div>
          {ss.notifications.sound && (
            <div>
              <label className="text-[12px] opacity-50 mb-1 block">
                {i.stVolume}: {ss.notifications.volume}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={ss.notifications.volume}
                onChange={(e) => ss.updateNotifications({ volume: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
              <div className="flex gap-3 mt-2">
                {[
                  { k: 'soundComplete', l: i.stSoundComplete },
                  { k: 'soundWaiting', l: i.stSoundWaiting },
                  { k: 'soundError', l: i.stSoundError },
                ].map((s) => (
                  <button
                    key={s.k}
                    className={`px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1 ${t.isDark ? 'bg-white/8 hover:bg-white/12' : 'bg-slate-100 hover:bg-slate-200'}`}
                  >
                    <Play size={11} />
                    {s.l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function RulesPanel() {
  const lang = useAppStore((s) => s.language);
  const theme = useAppStore((s) => s.theme);
  const t = getThemeTokens(theme);
  const i = getI18n(lang);
  const ss = useSettingsStore();
  const [addingRule, setAddingRule] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [ruleDraft, setRuleDraft] = useState({ name: '', content: '', scope: 'personal' as const });
  const [skillDraft, setSkillDraft] = useState({ name: '', content: '', scope: 'global' as const });

  const handleAddRule = () => {
    if (!ruleDraft.name.trim()) return;
    ss.addRule(ruleDraft);
    setRuleDraft({ name: '', content: '', scope: 'personal' });
    setAddingRule(false);
    toast.success(i.stSaved);
  };

  const handleAddSkill = () => {
    if (!skillDraft.name.trim()) return;
    ss.addSkill(skillDraft);
    setSkillDraft({ name: '', content: '', scope: 'global' });
    setAddingSkill(false);
    toast.success(i.stSaved);
  };

  return (
    <div className="space-y-5">
      <GlassCard>
        <SectionHeader
          icon={<Download size={18} className="text-purple-400" />}
          title={i.stImportSettings}
        />
        <div className="space-y-2">
          <Toggle
            value={ss.includeAgentsMd}
            onChange={ss.setIncludeAgentsMd}
            label={i.stIncludeAgentsMd}
          />
          <Toggle
            value={ss.includeClaudeMd}
            onChange={ss.setIncludeClaudeMd}
            label={i.stIncludeClaudeMd}
          />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            icon={<ScrollText size={18} className="text-indigo-400" />}
            title={i.stPersonalRules}
            desc={i.stPersonalRulesDesc}
          />
          <button
            onClick={() => setAddingRule(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 text-[12px] hover:bg-indigo-500/25 flex items-center gap-1.5"
          >
            <Plus size={13} />
            {i.stAddRule}
          </button>
        </div>
        {addingRule && (
          <div
            className={`p-4 rounded-lg mb-3 space-y-3 ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
          >
            <input
              placeholder={i.stRuleName}
              value={ruleDraft.name}
              onChange={(e) => setRuleDraft({ ...ruleDraft, name: e.target.value })}
              className={`w-full px-3 py-1.5 rounded-lg text-[13px] outline-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white border border-slate-200'}`}
            />
            <textarea
              placeholder={i.stRuleContent}
              value={ruleDraft.content}
              onChange={(e) => setRuleDraft({ ...ruleDraft, content: e.target.value })}
              rows={3}
              className={`w-full px-3 py-1.5 rounded-lg text-[13px] outline-none resize-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white border border-slate-200'}`}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddRule}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[12px]"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => setAddingRule(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-[12px]"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}
        {ss.rules.filter((r) => r.scope === 'personal').length === 0 && !addingRule && (
          <p className={`text-[13px] text-center py-4 ${t.text.muted}`}>{i.stNoRules}</p>
        )}
        {ss.rules
          .filter((r) => r.scope === 'personal')
          .map((r) => (
            <div
              key={r.id}
              className={`flex items-center justify-between px-4 py-3 rounded-lg mb-2 ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
            >
              <div className="flex-1">
                <p className="text-[13px]" style={{ fontWeight: 500 }}>
                  {r.name}
                </p>
                <p className={`text-[11px] mt-0.5 ${t.text.muted} line-clamp-1`}>{r.content}</p>
              </div>
              <button
                onClick={() => ss.removeRule(r.id)}
                className="text-red-400 hover:bg-red-500/15 p-1 rounded"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader icon={<Zap size={18} className="text-amber-400" />} title={i.stSkills} />
          <button
            onClick={() => setAddingSkill(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 text-[12px] hover:bg-amber-500/25 flex items-center gap-1.5"
          >
            <Plus size={13} />
            {i.stAddSkill}
          </button>
        </div>
        {addingSkill && (
          <div
            className={`p-4 rounded-lg mb-3 space-y-3 ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
          >
            <input
              placeholder={i.stSkillName}
              value={skillDraft.name}
              onChange={(e) => setSkillDraft({ ...skillDraft, name: e.target.value })}
              className={`w-full px-3 py-1.5 rounded-lg text-[13px] outline-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white border border-slate-200'}`}
            />
            <textarea
              placeholder={i.stSkillContent}
              value={skillDraft.content}
              onChange={(e) => setSkillDraft({ ...skillDraft, content: e.target.value })}
              rows={3}
              className={`w-full px-3 py-1.5 rounded-lg text-[13px] outline-none resize-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white border border-slate-200'}`}
            />
            <div className="flex gap-2">
              <select
                value={skillDraft.scope}
                onChange={(e) => setSkillDraft({ ...skillDraft, scope: e.target.value as any })}
                className={`px-3 py-1.5 rounded-lg text-[12px] outline-none ${t.isDark ? 'bg-black/20 border border-white/10' : 'bg-white border border-slate-200'}`}
              >
                <option value="global">{i.stGlobalSkills}</option>
                <option value="project">{i.stProjectSkills}</option>
              </select>
              <button
                onClick={handleAddSkill}
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[12px]"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => setAddingSkill(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-[12px]"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}
        {ss.skills.length === 0 && !addingSkill && (
          <p className={`text-[13px] text-center py-4 ${t.text.muted}`}>{i.stNoSkills}</p>
        )}
        {ss.skills.map((sk) => (
          <div
            key={sk.id}
            className={`flex items-center justify-between px-4 py-3 rounded-lg mb-2 ${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`}
          >
            <div className="flex-1">
              <p className="text-[13px] flex items-center gap-2" style={{ fontWeight: 500 }}>
                {sk.name}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${sk.scope === 'global' ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400'}`}
                >
                  {sk.scope === 'global' ? i.stGlobalSkills : i.stProjectSkills}
                </span>
              </p>
              <p className={`text-[11px] mt-0.5 ${t.text.muted} line-clamp-1`}>{sk.content}</p>
            </div>
            <button
              onClick={() => ss.removeSkill(sk.id)}
              className="text-red-400 hover:bg-red-500/15 p-1 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

// ─────────── Main Settings Page ───────────

export function SettingsPage() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.language);
  const theme = useAppStore((s) => s.theme);
  const t = getThemeTokens(theme);
  const i = getI18n(lang);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize settings integration (keyboard shortcuts, etc.)
  useEffect(() => {
    const cleanup = initializeSettingsIntegration();
    return cleanup;
  }, []);

  // Deep search results
  const searchHits = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return deepSearchSettings(searchQuery);
  }, [searchQuery]);

  const tabs: { id: SettingsTab; label: string; desc: string }[] = [
    { id: 'account', label: i.stAccount, desc: i.stAccountDesc },
    { id: 'general', label: i.stGeneral, desc: i.stGeneralDesc },
    { id: 'agents', label: i.stAgents, desc: i.stAgentsDesc },
    { id: 'mcp', label: i.stMcp, desc: i.stMcpDesc },
    { id: 'models', label: i.stModels, desc: i.stModelsDesc },
    { id: 'context', label: i.stContext, desc: i.stContextDesc },
    { id: 'chatflow', label: i.stChatFlow, desc: i.stChatFlowDesc },
    { id: 'rules', label: i.stRules, desc: i.stRulesDesc },
  ];

  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return tabs;
    const q = searchQuery.toLowerCase();
    // Include tabs that match by name/desc OR have deep search hits
    const hitSections = new Set(searchHits.map((h) => h.sectionId));
    return tabs.filter(
      (tab) =>
        tab.label.toLowerCase().includes(q) ||
        tab.desc.toLowerCase().includes(q) ||
        hitSections.has(tab.id)
    );
  }, [searchQuery, tabs, searchHits]);

  const renderPanel = () => {
    switch (activeTab) {
      case 'account':
        return <AccountPanel />;
      case 'general':
        return <GeneralPanel />;
      case 'agents':
        return <AgentsPanel />;
      case 'mcp':
        return <McpPanel />;
      case 'models':
        return <ModelsPanel />;
      case 'context':
        return <ContextPanel />;
      case 'chatflow':
        return <ChatFlowPanel />;
      case 'rules':
        return <RulesPanel />;
    }
  };

  return (
    <div className={`h-screen flex flex-col ${t.surface.app} ${t.surface.appGradient}`}>
      {/* Header */}
      <div
        className={`flex items-center gap-4 px-6 py-3 border-b ${t.border.subtle} ${t.surface.glassHeader}`}
      >
        <button
          onClick={() => navigate('/ide')}
          className={`p-2 rounded-lg ${t.interactive.headerBtn} transition-colors`}
          title={i.stBackToIde}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-[18px]" style={{ fontWeight: 700 }}>
            {i.stTitle}
          </h1>
          <p className={`text-[12px] ${t.text.tertiary}`}>{i.stSubtitle}</p>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${t.input.search} max-w-[280px]`}
        >
          <Search size={14} className="opacity-40 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={i.stSearchPlaceholder}
            className="bg-transparent outline-none text-[13px] w-full"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={`w-[240px] border-r ${t.border.subtle} ${t.surface.glass} p-3 overflow-y-auto custom-scrollbar shrink-0`}
        >
          <div className="space-y-1">
            {filteredTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  activeTab === tab.id
                    ? `${t.accent.activeBg} ${t.accent.activeText}`
                    : `${t.interactive.menuItem} hover:${t.isDark ? 'bg-white/5' : 'bg-slate-50'}`
                }`}
              >
                <span className={activeTab === tab.id ? '' : 'opacity-60'}>
                  {TAB_ICONS[tab.id]}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[13px] truncate"
                    style={{ fontWeight: activeTab === tab.id ? 600 : 400 }}
                  >
                    {tab.label}
                  </p>
                  <p className={`text-[10px] truncate ${t.text.muted}`}>{tab.desc}</p>
                </div>
                {activeTab === tab.id && <ChevronRight size={14} className="opacity-50 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-[720px] mx-auto">
            {/* Deep search results */}
            {searchHits.length > 0 && (
              <GlassCard className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Search size={15} className="text-indigo-400" />
                  <span className="text-[13px]" style={{ fontWeight: 600 }}>
                    {i.stSearch || 'Search Results'} ({searchHits.length})
                  </span>
                </div>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {searchHits.slice(0, 10).map((hit, idx) => (
                    <button
                      key={`${hit.fieldPath}-${idx}`}
                      onClick={() => {
                        setActiveTab(hit.sectionId as SettingsTab);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${t.isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] truncate">{hit.label}</p>
                        {hit.matchedValue && (
                          <p className={`text-[10px] truncate ${t.text.muted}`}>
                            {hit.matchedValue.slice(0, 80)}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ml-2 ${t.isDark ? 'bg-white/8' : 'bg-slate-100'}`}
                      >
                        {hit.section}
                      </span>
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}
            {renderPanel()}
          </div>
        </div>
      </div>

      {/* Model Settings Modal */}
      <Suspense fallback={null}>
        <ModelSettings />
      </Suspense>
    </div>
  );
}
