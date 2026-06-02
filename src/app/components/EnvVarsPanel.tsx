/**
 * @file EnvVarsPanel.tsx
 * @description YYC³便携式智能AI系统 - 项目级环境变量管理
 * Project-level Environment Variable Management
 * Multi-environment (dev/staging/prod), secret/plaintext toggle, import/export,
 * inherited/override indicators. Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,environment,variables,config
 */

import {
  KeyRound,
  X,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Download,
  Search,
  Lock,
  Unlock,
  Edit3,
  Check,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

/* ── Types ── */
type EnvScope = 'all' | 'dev' | 'staging' | 'prod';

interface EnvVar {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  scope: EnvScope;
  inherited: boolean;
  required: boolean;
  description?: string;
}

/* ── Mock env vars ── */
const MOCK_VARS: EnvVar[] = [
  {
    id: 'e1',
    key: 'VITE_API_URL',
    value: 'https://api.yyc3.dev/v2',
    isSecret: false,
    scope: 'all',
    inherited: false,
    required: true,
    description: 'Main API endpoint',
  },
  {
    id: 'e2',
    key: 'VITE_API_KEY',
    value: 'sk-yyc3-prod-a1b2c3d4e5f6',
    isSecret: true,
    scope: 'prod',
    inherited: false,
    required: true,
    description: 'API authentication key',
  },
  {
    id: 'e3',
    key: 'VITE_API_KEY',
    value: 'sk-yyc3-dev-test1234',
    isSecret: true,
    scope: 'dev',
    inherited: false,
    required: true,
    description: 'Dev API key',
  },
  {
    id: 'e4',
    key: 'VITE_WS_URL',
    value: 'wss://ws.yyc3.dev',
    isSecret: false,
    scope: 'all',
    inherited: false,
    required: true,
    description: 'WebSocket endpoint',
  },
  {
    id: 'e5',
    key: 'VITE_SENTRY_DSN',
    value: 'https://abc123@sentry.io/456',
    isSecret: true,
    scope: 'prod',
    inherited: false,
    required: false,
  },
  {
    id: 'e6',
    key: 'VITE_GA_ID',
    value: 'G-XXXXXXXXXX',
    isSecret: false,
    scope: 'prod',
    inherited: false,
    required: false,
    description: 'Google Analytics',
  },
  {
    id: 'e7',
    key: 'NODE_ENV',
    value: 'production',
    isSecret: false,
    scope: 'prod',
    inherited: true,
    required: true,
  },
  {
    id: 'e8',
    key: 'NODE_ENV',
    value: 'development',
    isSecret: false,
    scope: 'dev',
    inherited: true,
    required: true,
  },
  {
    id: 'e9',
    key: 'VITE_FEATURE_FLAGS',
    value: '{"canvas":true,"cicd":true,"collab":true}',
    isSecret: false,
    scope: 'all',
    inherited: false,
    required: false,
    description: 'Feature flag JSON',
  },
  {
    id: 'e10',
    key: 'VITE_MAX_UPLOAD_SIZE',
    value: '10485760',
    isSecret: false,
    scope: 'all',
    inherited: false,
    required: false,
  },
  {
    id: 'e11',
    key: 'DATABASE_URL',
    value: 'postgresql://user:pass@db.yyc3.dev:5432/main',
    isSecret: true,
    scope: 'prod',
    inherited: false,
    required: true,
  },
  {
    id: 'e12',
    key: 'REDIS_URL',
    value: 'redis://cache.yyc3.dev:6379',
    isSecret: true,
    scope: 'prod',
    inherited: false,
    required: false,
  },
];

const SCOPE_COLORS: Record<EnvScope, string> = {
  all: '#6366f1',
  dev: '#10b981',
  staging: '#f59e0b',
  prod: '#ef4444',
};

/* ══════════════════════════════════════════ */

interface EnvVarsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function EnvVarsPanel({ open, onClose }: EnvVarsPanelProps) {
  const { theme, language } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const [vars, setVars] = useState<EnvVar[]>(MOCK_VARS);
  const [filterScope, setFilterScope] = useState<EnvScope | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');

  const filteredVars = useMemo(() => {
    let result = vars;
    if (filterScope !== 'all') {
      result = result.filter((v) => v.scope === filterScope || v.scope === 'all');
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (v) => v.key.toLowerCase().includes(term) || v.value.toLowerCase().includes(term)
      );
    }
    return result;
  }, [vars, filterScope, searchTerm]);

  const scopeCounts = useMemo(() => {
    const c: Record<string, number> = { all: vars.length, dev: 0, staging: 0, prod: 0 };
    vars.forEach((v) => {
      if (v.scope !== 'all') c[v.scope] = (c[v.scope] || 0) + 1;
    });
    return c;
  }, [vars]);

  const toggleReveal = useCallback((id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const addVar = useCallback(() => {
    const newVar: EnvVar = {
      id: `e-${Date.now()}`,
      key: 'NEW_VARIABLE',
      value: '',
      isSecret: false,
      scope: filterScope === 'all' ? 'all' : (filterScope as EnvScope),
      inherited: false,
      required: false,
    };
    setVars((prev) => [newVar, ...prev]);
    setEditingId(newVar.id);
    setEditKey(newVar.key);
    setEditValue(newVar.value);
  }, [filterScope]);

  const removeVar = useCallback(
    (id: string) => {
      setVars((prev) => prev.filter((v) => v.id !== id));
      toast.success(i.evRemove);
    },
    [i]
  );

  const startEdit = useCallback((v: EnvVar) => {
    setEditingId(v.id);
    setEditKey(v.key);
    setEditValue(v.value);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId) return;
    setVars((prev) =>
      prev.map((v) => (v.id === editingId ? { ...v, key: editKey, value: editValue } : v))
    );
    setEditingId(null);
    toast.success(i.evSave);
  }, [editingId, editKey, editValue, i]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const toggleSecret = useCallback((id: string) => {
    setVars((prev) => prev.map((v) => (v.id === id ? { ...v, isSecret: !v.isSecret } : v)));
  }, []);

  const exportVars = useCallback(() => {
    const envContent = filteredVars
      .map((v) => `${v.key}=${v.isSecret ? '***' : v.value}`)
      .join('\n');
    navigator.clipboard.writeText(envContent);
    toast.success(i.evExport);
  }, [filteredVars, i]);

  const SCOPES: { scope: EnvScope | 'all'; labelKey: string }[] = [
    { scope: 'all', labelKey: 'evAllEnvs' },
    { scope: 'dev', labelKey: 'evDev' },
    { scope: 'staging', labelKey: 'evStaging' },
    { scope: 'prod', labelKey: 'evProd' },
  ];

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-4xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-6 py-3 border-b ${t.border.subtle}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.isDark ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20' : 'bg-gradient-to-br from-emerald-50 to-teal-50'}`}
              >
                <KeyRound
                  className={`w-4 h-4 ${t.isDark ? 'text-emerald-400' : 'text-emerald-500'}`}
                />
              </div>
              <div>
                <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 700 }}>
                  {i.evTitle}
                </h2>
                <p className={`text-[10px] ${t.text.dimmed}`}>
                  {i.evSubtitle} · {vars.length} vars
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={addVar}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] ${t.transition} ${t.accent.solidBtn} text-white`}
                style={{ fontWeight: 600 }}
              >
                <Plus className="w-3 h-3" /> {i.evAdd}
              </button>
              <button
                onClick={exportVars}
                className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
                title={i.evExport}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl ${t.transition} ${t.interactive.iconBtn}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scope tabs + search */}
          <div className={`flex items-center gap-2 px-6 py-2 border-b ${t.border.subtle}`}>
            {SCOPES.map((s) => (
              <button
                key={s.scope}
                onClick={() => setFilterScope(s.scope)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] ${t.transition} ${filterScope === s.scope ? t.accent.primaryBg + ' ' + t.accent.primary : t.interactive.iconBtn}`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: SCOPE_COLORS[s.scope === 'all' ? 'all' : s.scope] }}
                />
                {(i as unknown as Record<string, string>)[s.labelKey]}
                <span className={`text-[7px] ${t.text.dimmed}`}>{scopeCounts[s.scope] || 0}</span>
              </button>
            ))}
            <div className="flex-1" />
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${t.border.subtle} max-w-xs`}
            >
              <Search className={`w-3 h-3 ${t.text.muted}`} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={i.evFilter}
                className={`flex-1 text-[10px] bg-transparent outline-none ${t.text.primary} ${t.text.placeholder}`}
              />
            </div>
          </div>

          {/* Table header */}
          <div
            className={`grid gap-0 px-6 py-1.5 border-b ${t.border.subtle}`}
            style={{ gridTemplateColumns: '2fr 3fr auto auto auto' }}
          >
            <span
              className={`text-[7px] uppercase tracking-wider ${t.text.dimmed}`}
              style={{ fontWeight: 600 }}
            >
              {i.evKey}
            </span>
            <span
              className={`text-[7px] uppercase tracking-wider ${t.text.dimmed}`}
              style={{ fontWeight: 600 }}
            >
              {i.evValue}
            </span>
            <span
              className={`text-[7px] uppercase tracking-wider text-center ${t.text.dimmed}`}
              style={{ fontWeight: 600 }}
            >
              Env
            </span>
            <span
              className={`text-[7px] uppercase tracking-wider text-center ${t.text.dimmed}`}
              style={{ fontWeight: 600 }}
            >
              {i.evSecret}
            </span>
            <span />
          </div>

          {/* Var list */}
          <div className={`flex-1 overflow-y-auto ${t.scrollbar}`}>
            {filteredVars.length === 0 && (
              <div
                className={`flex flex-col items-center justify-center gap-2 py-12 ${t.text.dimmed}`}
              >
                <KeyRound className="w-6 h-6 opacity-20" />
                <span className="text-[11px]">{i.evNoVars}</span>
              </div>
            )}

            {filteredVars.map((v) => {
              const isEditing = editingId === v.id;
              const isRevealed = revealedIds.has(v.id);
              const displayValue =
                v.isSecret && !isRevealed ? '•'.repeat(Math.min(v.value.length, 20)) : v.value;

              return (
                <div
                  key={v.id}
                  className={`grid gap-0 px-6 py-2 border-b ${t.border.subtle} items-center ${t.transition} ${t.interactive.menuItem}`}
                  style={{ gridTemplateColumns: '2fr 3fr auto auto auto' }}
                >
                  {/* Key */}
                  {isEditing ? (
                    <input
                      value={editKey}
                      onChange={(e) => setEditKey(e.target.value)}
                      className={`font-mono text-[10px] px-2 py-1 rounded outline-none ${t.isDark ? 'bg-white/[0.04] text-cyan-400' : 'bg-slate-100 text-cyan-600'} border ${t.border.subtle}`}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-mono text-[10px] ${t.isDark ? 'text-cyan-400' : 'text-cyan-600'}`}
                        style={{ fontWeight: 600 }}
                      >
                        {v.key}
                      </span>
                      {v.required && <span className="text-[6px] text-red-400">*</span>}
                      {v.inherited && (
                        <span
                          className={`text-[7px] px-1 rounded ${t.isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-500'}`}
                        >
                          {i.evInherited}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Value */}
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className={`flex-1 font-mono text-[10px] px-2 py-1 rounded outline-none ${t.isDark ? 'bg-white/[0.04] text-white' : 'bg-slate-100 text-slate-700'} border ${t.border.subtle}`}
                      />
                      <button
                        onClick={saveEdit}
                        className={`p-1 rounded ${t.transition} text-emerald-400 hover:bg-emerald-500/10`}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className={`p-1 rounded ${t.transition} text-red-400 hover:bg-red-500/10`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className={`font-mono text-[9px] truncate ${t.text.muted}`}>
                        {displayValue}
                      </span>
                      {v.isSecret && (
                        <button
                          onClick={() => toggleReveal(v.id)}
                          className={`p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
                        >
                          {isRevealed ? (
                            <EyeOff className="w-2.5 h-2.5" />
                          ) : (
                            <Eye className="w-2.5 h-2.5" />
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Scope */}
                  <div className="flex justify-center">
                    <span
                      className="text-[7px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: SCOPE_COLORS[v.scope] + '20',
                        color: SCOPE_COLORS[v.scope],
                        fontWeight: 600,
                      }}
                    >
                      {v.scope === 'all' ? 'ALL' : v.scope.toUpperCase()}
                    </span>
                  </div>

                  {/* Secret toggle */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => toggleSecret(v.id)}
                      className={`p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
                    >
                      {v.isSecret ? (
                        <Lock className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Unlock className={`w-3 h-3 ${t.text.dimmed}`} />
                      )}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => startEdit(v)}
                      className={`p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${v.key}=${v.value}`);
                        toast.success(i.codeCopied);
                      }}
                      className={`p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeVar(v.id)}
                      className={`p-0.5 rounded ${t.transition} text-red-400 hover:bg-red-500/10`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </>
  );
}
