/**
 * @file DatabaseManager.tsx
 * @description YYC³便携式智能AI系统 - 本地数据库管理器
 * Local Database Manager (Live Service Integration)
 * Connection profiles via dbService + storageService (IndexedDB persistence),
 * auto-detect engines, Monaco SQL editor, VirtualTable results grid,
 * Table Explorer, backup/restore, query history.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,database,sql,manager,service,virtual-scroll
 */

import Editor from '@monaco-editor/react';
import {
  Database,
  X,
  Plus,
  Trash2,
  Play,
  ChevronRight,
  ChevronDown,
  Table2,
  RefreshCw,
  Download,
  Upload,
  Loader2,
  Copy,
  Plug,
  HardDrive,
  Zap,
  Clock,
  ArrowUpDown,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { dbService, type DetectedEngine } from '../services/db-service';
import {
  indexManager,
  queryAnalyzer,
  slowQueryMonitor,
  queryCache,
  type IndexStats,
  type QueryAnalysis,
  type SlowQuery,
} from '../services/query-optimizer';
import type { IndexConfig } from '../services/query-optimizer';
import { storageService } from '../services/storage-service';
import { useAppStore } from '../store';
import type { DBConnectionProfile, DBTableInfo, DBColumnInfo, DBConnectionStatus } from '../types';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

import { VirtualTable } from './VirtualList';

/* ── Types ── */
type DbEngine = 'postgresql' | 'mysql' | 'redis' | 'sqlite';
type MainTab = 'console' | 'explorer' | 'history' | 'indexes' | 'performance';

interface QueryHistoryEntry {
  id: string;
  sql: string;
  timestamp: number;
  duration: number;
  rows: number;
}

const ENGINE_META: Record<string, { color: string; icon: string; defaultPort: number }> = {
  postgresql: { color: '#336791', icon: '🐘', defaultPort: 5432 },
  mysql: { color: '#00758F', icon: '🐬', defaultPort: 3306 },
  redis: { color: '#DC382D', icon: '🔴', defaultPort: 6379 },
  sqlite: { color: '#003B57', icon: '📦', defaultPort: 0 },
};

const SQL_TEMPLATES = [
  { label: 'SELECT', sql: 'SELECT * FROM {table} LIMIT 20;' },
  { label: 'INSERT', sql: "INSERT INTO {table} (name) VALUES ('value');" },
  { label: 'UPDATE', sql: "UPDATE {table} SET name = 'new_value' WHERE id = 'xxx';" },
  { label: 'DELETE', sql: "DELETE FROM {table} WHERE id = 'xxx';" },
  { label: 'COUNT', sql: 'SELECT COUNT(*) AS total FROM {table};' },
  {
    label: 'CREATE',
    sql: 'CREATE TABLE new_table (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name VARCHAR(255) NOT NULL,\n  created_at TIMESTAMP DEFAULT NOW()\n);',
  },
];

const SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'CREATE',
  'TABLE',
  'DROP',
  'ALTER',
  'INDEX',
  'JOIN',
  'LEFT',
  'RIGHT',
  'INNER',
  'OUTER',
  'ON',
  'AND',
  'OR',
  'NOT',
  'IN',
  'LIKE',
  'ORDER',
  'BY',
  'GROUP',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'AS',
  'COUNT',
  'SUM',
  'AVG',
  'MAX',
  'MIN',
  'DISTINCT',
  'NULL',
  'DEFAULT',
  'PRIMARY',
  'KEY',
  'FOREIGN',
  'REFERENCES',
  'CASCADE',
  'CONSTRAINT',
  'UNIQUE',
  'CHECK',
  'EXISTS',
  'BETWEEN',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
];

/* ═══════════════════════════════════════════ */

interface DatabaseManagerProps {
  open: boolean;
  onClose: () => void;
}

export function DatabaseManager({ open, onClose }: DatabaseManagerProps) {
  const { theme, language } = useAppStore();
  const t = getThemeTokens(theme);
  const ii = getI18n(language);

  // ── Connection state ──
  const [connections, setConnections] = useState<DBConnectionProfile[]>([]);
  const [connStatuses, setConnStatuses] = useState<Record<string, DBConnectionStatus>>({});
  const [activeConn, setActiveConn] = useState<string | null>(null);
  const [showAddConn, setShowAddConn] = useState(false);
  const [newConn, setNewConn] = useState<Partial<DBConnectionProfile>>({
    name: '',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false,
  });

  // ── Engine detection ──
  const [engines, setEngines] = useState<DetectedEngine[]>([]);
  const [detecting, setDetecting] = useState(false);

  // ── SQL Console ──
  const [mainTab, setMainTab] = useState<MainTab>('console');
  const [sql, setSql] = useState('SELECT * FROM users LIMIT 20;');
  const [executing, setExecuting] = useState(false);
  const [resultColumns, setResultColumns] = useState<string[]>([]);
  const [resultRows, setResultRows] = useState<Record<string, unknown>[]>([]);
  const [resultMeta, setResultMeta] = useState<{ rowCount: number; duration: number } | null>(null);

  // ── History ──
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);

  // ── Table Explorer ──
  const [schemas, setSchemas] = useState<string[]>([]);
  const [expandedSchema, setExpandedSchema] = useState<string>('public');
  const [tables, setTables] = useState<DBTableInfo[]>([]);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [tableColumns, setTableColumns] = useState<Record<string, DBColumnInfo[]>>({});
  const [explorerLoading, setExplorerLoading] = useState(false);

  // ── Backup ──
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // ── Dynamic schema cache for Monaco completion (mutable ref to avoid stale closures) ──
  const schemaCache = useRef<{
    tables: { name: string; rowCount: number }[];
    columnsByTable: Record<string, { name: string; type: string }[]>;
  }>({ tables: [], columnsByTable: {} });

  // Load schema data for completion whenever active connection changes
  useEffect(() => {
    if (!activeConn || !open) return;
    let cancelled = false;

    const loadSchema = async () => {
      try {
        const tbs = await dbService.listTables(activeConn, 'public');
        if (cancelled) return;
        schemaCache.current.tables = tbs.map((t) => ({ name: t.name, rowCount: t.rowCount ?? 0 }));

        // Load columns for each table in parallel
        const colResults = await Promise.all(
          tbs.map(async (tb) => {
            const cols = await dbService.getTableColumns(activeConn, 'public', tb.name);
            return { table: tb.name, cols: cols.map((c) => ({ name: c.name, type: c.type })) };
          })
        );
        if (cancelled) return;
        const byTable: Record<string, { name: string; type: string }[]> = {};
        for (const { table, cols } of colResults) byTable[table] = cols;
        schemaCache.current.columnsByTable = byTable;
      } catch {
        /* ignore — will use empty schema */
      }
    };

    loadSchema();
    return () => {
      cancelled = true;
    };
  }, [activeConn, open]);

  // ── Load profiles from IndexedDB ──
  useEffect(() => {
    if (!open) return;
    storageService.getDBProfiles().then((profiles) => {
      if (profiles.length > 0) {
        setConnections(profiles);
        setActiveConn(profiles[0].id);
      } else {
        // Seed with demo profiles
        const demos: DBConnectionProfile[] = [
          {
            id: 'c1',
            name: 'YYC3 Dev',
            type: 'postgresql',
            host: 'localhost',
            port: 5432,
            username: 'yyc3_dev',
            password: '',
            database: 'yyc3_development',
            ssl: false,
          },
          {
            id: 'c2',
            name: 'Cache Server',
            type: 'redis',
            host: 'localhost',
            port: 6379,
            username: '',
            password: '',
            database: '0',
            ssl: false,
          },
        ];
        setConnections(demos);
        setActiveConn('c1');
        demos.forEach((d) => storageService.saveDBProfile(d));
      }
    });
  }, [open]);

  // ── Load query history from dbService ──
  useEffect(() => {
    if (!open) return;
    const h = dbService.getQueryHistory();
    setHistory(
      h.map((e, i) => ({
        id: `h-${i}`,
        sql: e.sql,
        timestamp: e.timestamp,
        duration: e.duration,
        rows: e.rowCount,
      }))
    );
  }, [open]);

  const activeConnection = useMemo(
    () => connections.find((c) => c.id === activeConn),
    [connections, activeConn]
  );

  // ── Auto detect engines ──
  const autoDetect = useCallback(async () => {
    setDetecting(true);
    try {
      const detected = await dbService.detectEngines();
      setEngines(detected);
      toast.success(
        `${ii.dbDetected}: ${detected
          .filter((e) => e.status === 'running')
          .map((e) => `${e.type} ${e.version}`)
          .join(', ')}`
      );
    } catch {
      toast.error('Detection failed');
    }
    setDetecting(false);
  }, [ii]);

  // ── Test connection ──
  const testConnection = useCallback(
    async (profile: DBConnectionProfile) => {
      try {
        const status = await dbService.testConnection(profile);
        setConnStatuses((prev) => ({ ...prev, [profile.id]: status }));
        if (status.connected) {
          toast.success(ii.dbTestSuccess);
        } else {
          toast.error(status.lastError || 'Connection failed');
        }
      } catch {
        toast.error('Test failed');
      }
    },
    [ii]
  );

  // ── Add connection ──
  const addConnection = useCallback(async () => {
    const profile: DBConnectionProfile = {
      id: `conn-${Date.now()}`,
      name: newConn.name || 'New Connection',
      type: (newConn.type as DbEngine) || 'postgresql',
      host: newConn.host || 'localhost',
      port: newConn.port || 5432,
      database: newConn.database || '',
      username: newConn.username || '',
      password: newConn.password || '',
      ssl: newConn.ssl || false,
    };
    await storageService.saveDBProfile(profile);
    setConnections((prev) => [...prev, profile]);
    setActiveConn(profile.id);
    setShowAddConn(false);
    setNewConn({
      name: '',
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: '',
      username: '',
      password: '',
      ssl: false,
    });
    toast.success('Connection added');
  }, [newConn]);

  // ── Delete connection ──
  const deleteConnection = useCallback(
    async (id: string) => {
      await storageService.deleteDBProfile(id);
      setConnections((prev) => prev.filter((c) => c.id !== id));
      if (activeConn === id) setActiveConn(connections[0]?.id ?? null);
      toast.success('Connection removed');
    },
    [activeConn, connections]
  );

  // ── Execute query via dbService ──
  const executeQuery = useCallback(async () => {
    if (executing || !sql.trim() || !activeConn) return;
    setExecuting(true);
    setResultColumns([]);
    setResultRows([]);
    setResultMeta(null);
    try {
      const result = await dbService.executeQuery(activeConn, sql.trim(), { limit: 100 });
      setResultColumns(result.columns);
      setResultRows(result.rows);
      setResultMeta({ rowCount: result.rowCount, duration: result.duration });
      setHistory((prev) => [
        {
          id: `q-${Date.now()}`,
          sql: sql.trim(),
          timestamp: Date.now(),
          duration: result.duration,
          rows: result.rowCount,
        },
        ...prev.slice(0, 49),
      ]);
      toast.success(`${ii.dbResults}: ${result.rowCount} ${ii.dbRows} (${result.duration}ms)`);
    } catch (err) {
      toast.error(`Query error: ${err}`);
    }
    setExecuting(false);
  }, [sql, executing, activeConn, ii]);

  // ── Load schemas / tables for explorer ──
  const loadExplorer = useCallback(async () => {
    if (!activeConn) return;
    setExplorerLoading(true);
    try {
      const s = await dbService.listSchemas(activeConn);
      setSchemas(s);
      if (s.includes('public')) {
        const tbs = await dbService.listTables(activeConn, 'public');
        setTables(tbs);
      }
    } catch {
      /* ignore */
    }
    setExplorerLoading(false);
  }, [activeConn]);

  useEffect(() => {
    if (mainTab === 'explorer' && activeConn) loadExplorer();
  }, [mainTab, activeConn, loadExplorer]);

  // ── Load columns for a table ──
  const loadColumns = useCallback(
    async (tableName: string) => {
      if (!activeConn || tableColumns[tableName]) return;
      try {
        const cols = await dbService.getTableColumns(activeConn, 'public', tableName);
        setTableColumns((prev) => ({ ...prev, [tableName]: cols }));
      } catch {
        /* ignore */
      }
    },
    [activeConn, tableColumns]
  );

  const toggleTable = useCallback(
    (name: string) => {
      if (expandedTable === name) {
        setExpandedTable(null);
      } else {
        setExpandedTable(name);
        loadColumns(name);
      }
    },
    [expandedTable, loadColumns]
  );

  // ── Backup / Restore ──
  const handleBackup = useCallback(async () => {
    if (!activeConn) return;
    setBackingUp(true);
    try {
      const result = await dbService.dumpDatabase(activeConn, '/backup/dump.sql');
      toast.success(
        `Backup complete: ${(result.size / 1024 / 1024).toFixed(1)}MB in ${(result.duration / 1000).toFixed(1)}s`
      );
    } catch {
      toast.error('Backup failed');
    }
    setBackingUp(false);
  }, [activeConn]);

  const handleRestore = useCallback(async () => {
    if (!activeConn) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sql,.db,.sqlite';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setRestoring(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const result = await dbService.restoreDatabase(activeConn, uint8Array);
        toast.success(
          `Restore complete: ${result.tablesRestored} tables in ${(result.duration / 1000).toFixed(1)}s`
        );
      } catch {
        toast.error('Restore failed');
      }
      setRestoring(false);
    };
    input.click();
  }, [activeConn]);

  const connStatus = (id: string): 'connected' | 'testing' | 'disconnected' => {
    const s = connStatuses[id];
    if (!s) return 'disconnected';
    return s.connected ? 'connected' : 'disconnected';
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-6xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-6 py-3 border-b ${t.border.subtle}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.isDark ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' : 'bg-gradient-to-br from-blue-50 to-cyan-50'}`}
              >
                <Database className={`w-4 h-4 ${t.isDark ? 'text-blue-400' : 'text-blue-500'}`} />
              </div>
              <div>
                <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 700 }}>
                  {ii.dbTitle}
                </h2>
                <p className={`text-[10px] ${t.text.dimmed}`}>
                  {ii.dbSubtitle} · {Object.values(connStatuses).filter((s) => s.connected).length}/
                  {connections.length} {ii.dbConnections}
                  {engines.length > 0 &&
                    ` · ${engines.filter((e) => e.status === 'running').length} engines detected`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={autoDetect}
                disabled={detecting}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] ${t.transition} ${t.interactive.iconBtn}`}
              >
                {detecting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Zap className="w-3 h-3" />
                )}
                {detecting ? ii.dbDetecting : ii.dbAutoDetect}
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl ${t.transition} ${t.interactive.iconBtn}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Detected engines bar */}
          {engines.length > 0 && (
            <div
              className={`flex items-center gap-2 px-6 py-1.5 border-b ${t.border.subtle} overflow-x-auto`}
            >
              <span className={`text-[8px] ${t.text.dimmed}`}>Detected:</span>
              {engines.map((eng) => (
                <div
                  key={eng.type}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] ${
                    eng.status === 'running'
                      ? t.isDark
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-emerald-50 text-emerald-600'
                      : t.isDark
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-red-50 text-red-600'
                  }`}
                >
                  <span>{ENGINE_META[eng.type]?.icon ?? '?'}</span>
                  <span style={{ fontWeight: 500 }}>
                    {eng.type} {eng.version}
                  </span>
                  <span>:{eng.defaultPort}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${eng.status === 'running' ? 'bg-emerald-400' : 'bg-red-400'}`}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-1 overflow-hidden">
            {/* Left: Connections */}
            <div className={`w-56 flex-shrink-0 flex flex-col border-r ${t.border.subtle}`}>
              <div
                className={`flex items-center justify-between px-3 py-2 border-b ${t.border.subtle}`}
              >
                <span
                  className={`text-[9px] uppercase tracking-wider ${t.text.dimmed}`}
                  style={{ fontWeight: 600 }}
                >
                  {ii.dbConnections}
                </span>
                <button
                  onClick={() => setShowAddConn(!showAddConn)}
                  className={`p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
                  title={ii.dbAddConnection}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Add connection form */}
              {showAddConn && (
                <div className={`p-2 border-b ${t.border.subtle} space-y-1.5`}>
                  <input
                    value={newConn.name || ''}
                    onChange={(e) => setNewConn((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Connection name"
                    className={`w-full px-2 py-1 rounded text-[9px] outline-none ${t.input.base}`}
                  />
                  <select
                    value={newConn.type || 'postgresql'}
                    onChange={(e) =>
                      setNewConn((p) => ({
                        ...p,
                        type: e.target.value as DbEngine,
                        port: ENGINE_META[e.target.value]?.defaultPort ?? 5432,
                      }))
                    }
                    className={`w-full px-2 py-1 rounded text-[9px] outline-none ${t.input.base}`}
                  >
                    {Object.keys(ENGINE_META).map((k) => (
                      <option key={k} value={k}>
                        {ENGINE_META[k].icon} {k}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1">
                    <input
                      value={newConn.host || ''}
                      onChange={(e) => setNewConn((p) => ({ ...p, host: e.target.value }))}
                      placeholder="Host"
                      className={`flex-1 px-2 py-1 rounded text-[9px] outline-none ${t.input.base}`}
                    />
                    <input
                      type="number"
                      value={newConn.port || 5432}
                      onChange={(e) =>
                        setNewConn((p) => ({ ...p, port: parseInt(e.target.value) }))
                      }
                      placeholder="Port"
                      className={`w-16 px-2 py-1 rounded text-[9px] outline-none ${t.input.base}`}
                    />
                  </div>
                  <input
                    value={newConn.database || ''}
                    onChange={(e) => setNewConn((p) => ({ ...p, database: e.target.value }))}
                    placeholder="Database"
                    className={`w-full px-2 py-1 rounded text-[9px] outline-none ${t.input.base}`}
                  />
                  <div className="flex gap-1">
                    <input
                      value={newConn.username || ''}
                      onChange={(e) => setNewConn((p) => ({ ...p, username: e.target.value }))}
                      placeholder="Username"
                      className={`flex-1 px-2 py-1 rounded text-[9px] outline-none ${t.input.base}`}
                    />
                    <input
                      type="password"
                      value={newConn.password || ''}
                      onChange={(e) => setNewConn((p) => ({ ...p, password: e.target.value }))}
                      placeholder="Password"
                      className={`flex-1 px-2 py-1 rounded text-[9px] outline-none ${t.input.base}`}
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={addConnection}
                      className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[8px] ${t.accent.solidBtn} text-white`}
                    >
                      <Plus className="w-2.5 h-2.5" /> Add
                    </button>
                    <button
                      onClick={() => setShowAddConn(false)}
                      className={`px-2 py-1 rounded text-[8px] ${t.interactive.iconBtn}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className={`flex-1 overflow-y-auto ${t.scrollbar}`}>
                {connections.map((conn) => {
                  const meta = ENGINE_META[conn.type] || ENGINE_META.postgresql;
                  const status = connStatus(conn.id);
                  return (
                    <div
                      key={conn.id}
                      className={`group w-full flex items-center gap-2 px-3 py-2.5 text-left border-b ${t.border.subtle} ${t.transition} cursor-pointer ${
                        activeConn === conn.id
                          ? t.isDark
                            ? 'bg-indigo-500/10'
                            : 'bg-indigo-50/80'
                          : t.interactive.menuItem
                      }`}
                      onClick={() => setActiveConn(conn.id)}
                    >
                      <span className="text-[14px]">{meta.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-[10px] truncate ${t.text.primary}`}
                          style={{ fontWeight: 500 }}
                        >
                          {conn.name}
                        </div>
                        <div className={`text-[8px] ${t.text.dimmed}`}>
                          {conn.host}:{conn.port}
                        </div>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          status === 'connected'
                            ? 'bg-emerald-500'
                            : status === 'testing'
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-slate-500'
                        }`}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConnection(conn.id);
                        }}
                        className={`p-0.5 rounded opacity-0 group-hover:opacity-100 ${t.transition} text-red-400/50 hover:text-red-400`}
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Connection actions */}
              {activeConnection && (
                <div className={`border-t ${t.border.subtle} p-3 space-y-1.5`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px]">
                      {ENGINE_META[activeConnection.type]?.icon ?? '?'}
                    </span>
                    <span className={`text-[10px] ${t.text.primary}`} style={{ fontWeight: 600 }}>
                      {activeConnection.name}
                    </span>
                  </div>
                  {[
                    { label: ii.dbHost, value: activeConnection.host },
                    { label: ii.dbPort, value: String(activeConnection.port) },
                    { label: ii.dbDatabase, value: activeConnection.database },
                    { label: ii.dbUsername, value: activeConnection.username },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className={`text-[7px] w-10 flex-shrink-0 ${t.text.dimmed}`}>
                        {f.label}
                      </span>
                      <span className={`text-[8px] font-mono ${t.text.muted}`}>{f.value}</span>
                    </div>
                  ))}
                  {connStatuses[activeConnection.id] && (
                    <div
                      className={`text-[7px] px-2 py-1 rounded ${
                        connStatuses[activeConnection.id].connected
                          ? t.isDark
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-emerald-50 text-emerald-600'
                          : t.isDark
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {connStatuses[activeConnection.id].connected
                        ? `Pool: ${connStatuses[activeConnection.id].activeConnections}/${connStatuses[activeConnection.id].poolSize}`
                        : connStatuses[activeConnection.id].lastError}
                    </div>
                  )}
                  <div className="flex items-center gap-1 pt-1">
                    <button
                      onClick={() => testConnection(activeConnection)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[8px] ${t.transition} ${t.interactive.iconBtn}`}
                    >
                      <Plug className="w-2.5 h-2.5" /> {ii.dbTestConnection}
                    </button>
                    <button
                      onClick={handleBackup}
                      disabled={backingUp}
                      className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[8px] ${t.transition} ${t.interactive.iconBtn}`}
                    >
                      {backingUp ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <Download className="w-2.5 h-2.5" />
                      )}{' '}
                      {ii.dbBackup}
                    </button>
                  </div>
                  <button
                    onClick={handleRestore}
                    disabled={restoring}
                    className={`w-full flex items-center justify-center gap-1 py-1 rounded-lg text-[8px] ${t.transition} ${t.interactive.iconBtn}`}
                  >
                    {restoring ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                      <Upload className="w-2.5 h-2.5" />
                    )}{' '}
                    Restore
                  </button>
                </div>
              )}
            </div>

            {/* Right: Console / Explorer / History */}
            <div className="flex-1 flex flex-col">
              {/* Tabs */}
              <div className={`flex items-center gap-0 px-4 border-b ${t.border.subtle}`}>
                {(
                  [
                    { tab: 'console' as MainTab, label: ii.dbSqlConsole, icon: Play },
                    { tab: 'explorer' as MainTab, label: ii.dbTableExplorer, icon: Table2 },
                    { tab: 'indexes' as MainTab, label: ii.dbIndexes, icon: ArrowUpDown },
                    { tab: 'performance' as MainTab, label: ii.dbQueryAnalyzer, icon: Zap },
                    { tab: 'history' as MainTab, label: ii.dbQueryHistory, icon: Clock },
                  ] as const
                ).map((mt) => (
                  <button
                    key={mt.tab}
                    onClick={() => setMainTab(mt.tab)}
                    className={`flex items-center gap-1 px-3 py-2 text-[9px] ${t.transition} border-b-2 ${
                      mainTab === mt.tab
                        ? `${t.accent.primary} border-current`
                        : `${t.text.muted} border-transparent`
                    }`}
                    style={{ fontWeight: mainTab === mt.tab ? 600 : 400 }}
                  >
                    <mt.icon className="w-3 h-3" /> {mt.label}
                    {mt.tab === 'history' && history.length > 0 && (
                      <span
                        className={`ml-1 text-[7px] px-1 rounded-full ${t.isDark ? 'bg-white/5' : 'bg-slate-100'}`}
                      >
                        {history.length}
                      </span>
                    )}
                  </button>
                ))}
                <div className="flex-1" />
                {/* SQL templates */}
                {mainTab === 'console' && (
                  <div className="flex items-center gap-0.5">
                    {SQL_TEMPLATES.slice(0, 4).map((tmpl) => (
                      <button
                        key={tmpl.label}
                        onClick={() =>
                          setSql(tmpl.sql.replace('{table}', expandedTable || 'users'))
                        }
                        className={`px-1.5 py-0.5 rounded text-[7px] ${t.transition} ${t.interactive.iconBtn}`}
                      >
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Console Tab ── */}
              {mainTab === 'console' && (
                <>
                  {/* Monaco SQL Editor */}
                  <div className={`relative border-b ${t.border.subtle}`}>
                    <div style={{ height: 160 }}>
                      <Editor
                        language="sql"
                        theme={t.isDark ? 'vs-dark' : 'light'}
                        value={sql}
                        onChange={(v) => setSql(v || '')}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 12,
                          lineNumbers: 'on',
                          lineNumbersMinChars: 3,
                          scrollBeyondLastLine: false,
                          wordWrap: 'on',
                          automaticLayout: true,
                          padding: { top: 8, bottom: 8 },
                          suggestOnTriggerCharacters: true,
                          quickSuggestions: true,
                          tabSize: 2,
                          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                          overviewRulerLanes: 0,
                          hideCursorInOverviewRuler: true,
                          renderLineHighlight: 'line',
                          folding: false,
                          glyphMargin: false,
                        }}
                        onMount={(editor, monaco) => {
                          // Register SQL table/column completions with dynamic schema
                          monaco.languages.registerCompletionItemProvider('sql', {
                            triggerCharacters: ['.', ' '],
                             
                            provideCompletionItems: (model: any, position: any) => {
                              const word = model.getWordUntilPosition(position);
                              const range = {
                                startLineNumber: position.lineNumber,
                                endLineNumber: position.lineNumber,
                                startColumn: word.startColumn,
                                endColumn: word.endColumn,
                              };

                              // Detect table context from SQL text (e.g. FROM users, JOIN projects)
                              const lineContent = model.getLineContent(position.lineNumber);

                              // Check if cursor is after "tablename." for column completion
                              const dotMatch = lineContent
                                .substring(0, position.column - 1)
                                .match(/(\w+)\.\s*$/);
                              if (dotMatch) {
                                const tableName = dotMatch[1].toLowerCase();
                                const cols = schemaCache.current.columnsByTable[tableName] || [];
                                return {
                                  suggestions: cols.map((c) => ({
                                    label: c.name,
                                    kind: monaco.languages.CompletionItemKind.Field,
                                    insertText: c.name,
                                    detail: `${c.type} (${tableName})`,
                                    sortText: `0-${c.name}`,
                                    range,
                                  })),
                                };
                              }

                              // Detect table name from FROM/JOIN/INTO/UPDATE clauses for contextual columns
                              const fullText = model.getValue().toUpperCase();
                              const fromMatch = fullText.match(
                                /(?:FROM|JOIN|INTO|UPDATE)\s+(\w+)/gi
                              );
                              const contextTables = new Set<string>();
                              if (fromMatch) {
                                fromMatch.forEach((m: string) => {
                                  const parts = m.split(/\s+/);
                                  if (parts.length >= 2) contextTables.add(parts[1].toLowerCase());
                                });
                              }

                              // Build suggestions
                              const { tables, columnsByTable } = schemaCache.current;
                              const suggestions: unknown[] = [];

                              // Table suggestions
                              tables.forEach((tb) => {
                                suggestions.push({
                                  label: tb.name,
                                  kind: monaco.languages.CompletionItemKind.Class,
                                  insertText: tb.name,
                                  detail: `Table (${tb.rowCount.toLocaleString()} rows)`,
                                  sortText: `1-${tb.name}`,
                                  range,
                                });
                              });

                              // Column suggestions (from context tables, or all if no context)
                              const colTables =
                                contextTables.size > 0
                                  ? Array.from(contextTables)
                                  : Object.keys(columnsByTable);
                              const seenCols = new Set<string>();
                              colTables.forEach((tbl) => {
                                const cols = columnsByTable[tbl] || [];
                                cols.forEach((c) => {
                                  if (!seenCols.has(c.name)) {
                                    seenCols.add(c.name);
                                    suggestions.push({
                                      label: c.name,
                                      kind: monaco.languages.CompletionItemKind.Field,
                                      insertText: c.name,
                                      detail: `${c.type} (${tbl})`,
                                      sortText: `2-${c.name}`,
                                      range,
                                    });
                                  }
                                });
                              });

                              // SQL keyword suggestions
                              SQL_KEYWORDS.forEach((kw) => {
                                suggestions.push({
                                  label: kw,
                                  kind: monaco.languages.CompletionItemKind.Keyword,
                                  insertText: kw + ' ',
                                  detail: 'Keyword',
                                  sortText: `3-${kw}`,
                                  range,
                                });
                              });

                              return { suggestions };
                            },
                          });
                          // Ctrl+Enter to execute
                          editor.addAction({
                            id: 'execute-query',
                            label: 'Execute Query',
                            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
                            run: () => executeQuery(),
                          });
                        }}
                      />
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 border-t ${t.border.subtle}`}
                    >
                      <button
                        onClick={executeQuery}
                        disabled={executing || !activeConn}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] ${t.transition} ${executing || !activeConn ? 'opacity-50' : t.accent.solidBtn + ' text-white'}`}
                        style={{ fontWeight: 600 }}
                      >
                        {executing ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        {executing ? ii.dbExecuting : ii.dbExecute}
                      </button>
                      <span className={`text-[8px] ${t.text.dimmed}`}>⌘+Enter</span>
                      {!activeConn && (
                        <span className={`text-[8px] text-amber-400 flex items-center gap-1`}>
                          <AlertTriangle className="w-2.5 h-2.5" /> Select a connection
                        </span>
                      )}
                      <div className="flex-1" />
                      {resultMeta && (
                        <div className="flex items-center gap-3">
                          <span className={`text-[8px] ${t.text.dimmed}`}>
                            {resultMeta.rowCount} {ii.dbRows}
                          </span>
                          <span className={`text-[8px] ${t.text.dimmed}`}>
                            {resultMeta.duration}ms
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Results — VirtualTable */}
                  <div className={`flex-1 overflow-hidden`}>
                    {executing ? (
                      <div
                        className={`flex flex-col items-center justify-center h-full gap-2 ${t.text.dimmed}`}
                      >
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                        <span className="text-[10px]">{ii.dbExecuting}</span>
                      </div>
                    ) : resultColumns.length > 0 ? (
                      <VirtualTable
                        columns={resultColumns}
                        rows={resultRows}
                        rowHeight={30}
                        className="h-full"
                        isDark={t.isDark}
                        onRowClick={(row) => {
                          navigator.clipboard.writeText(JSON.stringify(row, null, 2));
                          toast.success('Row copied to clipboard');
                        }}
                      />
                    ) : (
                      <div
                        className={`flex flex-col items-center justify-center h-full gap-2 ${t.text.dimmed}`}
                      >
                        <Database className="w-6 h-6 opacity-15" />
                        <span className="text-[10px]">{ii.dbNoData}</span>
                        <span className={`text-[8px] ${t.text.muted}`}>
                          Write a SQL query above and press Execute
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Explorer Tab ── */}
              {mainTab === 'explorer' && (
                <div className={`flex-1 overflow-y-auto ${t.scrollbar} p-2`}>
                  {explorerLoading ? (
                    <div className={`flex items-center justify-center py-8 ${t.text.dimmed}`}>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading schemas...
                    </div>
                  ) : schemas.length === 0 ? (
                    <div
                      className={`flex flex-col items-center justify-center py-8 ${t.text.dimmed} gap-2`}
                    >
                      <HardDrive className="w-5 h-5 opacity-20" />
                      <span className="text-[10px]">No schemas found</span>
                      <button onClick={loadExplorer} className={`text-[9px] ${t.accent.primary}`}>
                        Refresh
                      </button>
                    </div>
                  ) : (
                    schemas.map((schema) => (
                      <div key={schema}>
                        <button
                          onClick={() => setExpandedSchema(expandedSchema === schema ? '' : schema)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 text-[10px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
                        >
                          {expandedSchema === schema ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                          <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                          <span className={t.text.primary} style={{ fontWeight: 600 }}>
                            {schema}
                          </span>
                          {schema === 'public' && (
                            <span className={`text-[8px] ${t.text.dimmed}`}>
                              {tables.length} {ii.dbTables}
                            </span>
                          )}
                        </button>

                        {expandedSchema === schema &&
                          tables.map((table) => (
                            <div key={table.name} className="ml-5">
                              <button
                                onClick={() => toggleTable(table.name)}
                                className={`group w-full flex items-center gap-2 px-2 py-1 text-[9px] rounded-lg ${t.transition} ${
                                  expandedTable === table.name
                                    ? t.isDark
                                      ? 'bg-indigo-500/10'
                                      : 'bg-indigo-50'
                                    : t.interactive.menuItem
                                }`}
                              >
                                {expandedTable === table.name ? (
                                  <ChevronDown className="w-2.5 h-2.5" />
                                ) : (
                                  <ChevronRight className="w-2.5 h-2.5" />
                                )}
                                <Table2 className="w-3 h-3 text-cyan-400" />
                                <span className={t.text.primary} style={{ fontWeight: 500 }}>
                                  {table.name}
                                </span>
                                <span
                                  className={`text-[7px] px-1 rounded ${t.isDark ? 'bg-white/[0.04]' : 'bg-slate-100'} ${t.text.dimmed}`}
                                >
                                  {(table.rowCount ?? 0).toLocaleString()} {ii.dbRows}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSql(`SELECT * FROM ${table.name} LIMIT 20;`);
                                    setMainTab('console');
                                  }}
                                  className={`ml-auto p-0.5 rounded opacity-0 group-hover:opacity-100 ${t.interactive.iconBtn}`}
                                >
                                  <Play className="w-2.5 h-2.5" />
                                </button>
                              </button>

                              {expandedTable === table.name && (
                                <div className="ml-6 my-1 space-y-0.5">
                                  {(tableColumns[table.name] || table.columns).map((col) => (
                                    <div
                                      key={col.name}
                                      className={`flex items-center gap-2 px-2 py-1 rounded text-[8px] ${t.isDark ? 'bg-white/[0.01]' : 'bg-slate-50/50'}`}
                                    >
                                      {col.primaryKey && (
                                        <span
                                          className="text-[6px] px-1 rounded bg-amber-500/15 text-amber-400"
                                          style={{ fontWeight: 700 }}
                                        >
                                          PK
                                        </span>
                                      )}
                                      <span
                                        className={`font-mono ${t.text.primary}`}
                                        style={{ fontWeight: 500 }}
                                      >
                                        {col.name}
                                      </span>
                                      <span
                                        className={`font-mono ${t.isDark ? 'text-cyan-400/50' : 'text-cyan-600/50'}`}
                                      >
                                        {col.type}
                                      </span>
                                      {col.nullable && (
                                        <span className={`text-[6px] ${t.text.dimmed}`}>NULL</span>
                                      )}
                                      {col.defaultValue && (
                                        <span className={`text-[7px] ${t.text.dimmed}`}>
                                          = {col.defaultValue}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  <div className="flex items-center gap-1 px-2 pt-1">
                                    {SQL_TEMPLATES.slice(0, 3).map((tmpl) => (
                                      <button
                                        key={tmpl.label}
                                        onClick={() => {
                                          setSql(tmpl.sql.replace('{table}', table.name));
                                          setMainTab('console');
                                        }}
                                        className={`flex items-center gap-0.5 text-[7px] px-1.5 py-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
                                      >
                                        <Play className="w-2 h-2" /> {tmpl.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── History Tab ── */}
              {mainTab === 'history' && (
                <div className={`flex-1 overflow-y-auto ${t.scrollbar}`}>
                  {history.length === 0 ? (
                    <div
                      className={`flex flex-col items-center justify-center h-full gap-2 ${t.text.dimmed}`}
                    >
                      <Clock className="w-5 h-5 opacity-15" />
                      <span className="text-[10px]">No query history yet</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {history.map((h) => (
                        <button
                          key={h.id}
                          onClick={() => {
                            setSql(h.sql);
                            setMainTab('console');
                          }}
                          className={`w-full flex items-start gap-3 px-4 py-2.5 text-left ${t.transition} ${t.interactive.menuItem}`}
                        >
                          <Play className={`w-3 h-3 mt-0.5 flex-shrink-0 ${t.text.dimmed}`} />
                          <div className="flex-1 min-w-0">
                            <div className={`font-mono text-[9px] ${t.text.primary} line-clamp-2`}>
                              {h.sql}
                            </div>
                            <div
                              className={`flex items-center gap-3 mt-1 text-[7px] ${t.text.dimmed}`}
                            >
                              <span>{new Date(h.timestamp).toLocaleTimeString()}</span>
                              <span>{h.rows} rows</span>
                              <span>{h.duration}ms</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(h.sql);
                              toast.success('SQL copied');
                            }}
                            className={`p-1 rounded ${t.interactive.iconBtn}`}
                          >
                            <Copy className="w-2.5 h-2.5" />
                          </button>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Indexes Tab ── */}
              {mainTab === 'indexes' && <IndexesTab connId={activeConn} t={t} ii={ii} />}

              {/* ── Performance Tab ── */}
              {mainTab === 'performance' && (
                <PerformanceTab connId={activeConn} sql={sql} t={t} ii={ii} />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/* ── IndexesTab                                                  */
/* ═══════════════════════════════════════════════════════════════ */

function IndexesTab({
  connId,
  t,
  ii,
}: {
  connId: string | null;
  t: ReturnType<typeof getThemeTokens>;
  ii: ReturnType<typeof getI18n>;
}) {
  const [indexes, setIndexes] = useState<IndexStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<
    { table: string; configs: { table: string; columns: string[]; type?: string }[] }[]
  >([]);

  const load = useCallback(async () => {
    if (!connId) return;
    setLoading(true);
    try {
      setIndexes(await indexManager.getIndexes(connId));
    } catch {}
    setLoading(false);
  }, [connId]);

  useEffect(() => {
    load();
  }, [load]);

  const recommend = useCallback(
    async (table: string) => {
      if (!connId) return;
      const cfgs = await indexManager.recommendIndexes(connId, table);
      setRecs((prev) => [
        ...prev.filter((r) => r.table !== table),
        ...(cfgs.length ? [{ table, configs: cfgs }] : []),
      ]);
      toast.success(cfgs.length ? `${cfgs.length} ${ii.dbIndexRecommendations}` : ii.dbNoIndexes);
    },
    [connId, ii]
  );

  const create = useCallback(
    async (cfg: IndexConfig) => {
      if (!connId) return;
      await indexManager.createIndex(connId, cfg);
      toast.success(`${ii.dbIndexCreated}: ${cfg.table}(${cfg.columns.join(', ')})`);
      load();
    },
    [connId, load, ii]
  );

  const drop = useCallback(
    async (name: string) => {
      if (!connId) return;
      await indexManager.dropIndex(connId, name);
      toast.success(`${ii.dbIndexDropped}: ${name}`);
      load();
    },
    [connId, load, ii]
  );

  const rebuild = useCallback(
    async (name: string) => {
      if (!connId) return;
      await indexManager.reindex(connId, name);
      toast.success(`${ii.dbIndexRebuilt}: ${name}`);
      load();
    },
    [connId, load, ii]
  );

  const tables = [...new Set(indexes.map((i) => i.table))];

  return (
    <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${t.scrollbar}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-[12px] ${t.text.primary}`} style={{ fontWeight: 700 }}>
            {ii.dbIndexManager}
          </h3>
          <p className={`text-[9px] ${t.text.dimmed}`}>
            {indexes.length} {ii.dbIndexes} · {tables.length} {ii.dbTables}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] ${t.transition} ${t.interactive.iconBtn}`}
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}{' '}
          {ii.dbRefresh}
        </button>
      </div>

      {tables.map((table) => (
        <div key={table} className={`rounded-xl border ${t.border.subtle} overflow-hidden`}>
          <div
            className={`flex items-center justify-between px-3 py-2 ${t.isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}
          >
            <div className="flex items-center gap-2">
              <Table2 className={`w-3.5 h-3.5 ${t.isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span className={`text-[10px] ${t.text.primary}`} style={{ fontWeight: 600 }}>
                {table}
              </span>
              <span
                className={`text-[8px] px-1.5 rounded ${t.isDark ? 'bg-white/[0.04]' : 'bg-slate-100'} ${t.text.dimmed}`}
              >
                {indexes.filter((i) => i.table === table).length} idx
              </span>
            </div>
            <button
              onClick={() => recommend(table)}
              className={`flex items-center gap-1 text-[8px] px-2 py-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
            >
              <Zap className="w-2.5 h-2.5" /> {ii.dbIndexRecommend}
            </button>
          </div>
          <div className={`divide-y ${t.isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
            {indexes
              .filter((i) => i.table === table)
              .map((idx) => (
                <div
                  key={idx.name}
                  className={`flex items-center gap-3 px-3 py-2 group ${t.transition} ${t.interactive.menuItem}`}
                >
                  <ArrowUpDown className={`w-3 h-3 flex-shrink-0 ${t.text.dimmed}`} />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[9px] font-mono ${t.text.primary}`}
                      style={{ fontWeight: 500 }}
                    >
                      {idx.name}
                    </div>
                    <div className={`flex items-center gap-3 text-[7px] ${t.text.dimmed}`}>
                      <span>{idx.columns.join(', ')}</span>
                      <span>{idx.sizeFormatted}</span>
                      <span>
                        {ii.dbIndexScans}: {idx.scans.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => rebuild(idx.name)}
                      className={`p-1 rounded ${t.interactive.iconBtn}`}
                      title={ii.dbIndexRebuild}
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => drop(idx.name)}
                      className="p-1 rounded text-red-400/60 hover:text-red-400"
                      title={ii.dbIndexDrop}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
          {recs
            .filter((r) => r.table === table)
            .flatMap((r) => r.configs)
            .map((cfg, i) => (
              <div
                key={`rec-${i}`}
                className={`flex items-center gap-3 px-3 py-2 border-t ${t.border.subtle} ${t.isDark ? 'bg-amber-500/[0.03]' : 'bg-amber-50/50'}`}
              >
                <AlertTriangle className="w-3 h-3 flex-shrink-0 text-amber-400" />
                <span
                  className={`flex-1 text-[9px] ${t.isDark ? 'text-amber-300' : 'text-amber-700'}`}
                >
                  {cfg.type?.toUpperCase()} on ({cfg.columns.join(', ')})
                </span>
                <button
                  onClick={() => create(cfg as IndexConfig)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] ${t.isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}
                >
                  <Plus className="w-2.5 h-2.5" /> {ii.dbIndexCreate}
                </button>
              </div>
            ))}
        </div>
      ))}

      {indexes.length === 0 && !loading && (
        <div className={`flex flex-col items-center justify-center py-12 gap-2 ${t.text.dimmed}`}>
          <ArrowUpDown className="w-6 h-6 opacity-15" />
          <span className="text-[10px]">{ii.dbNoIndexes}</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/* ── PerformanceTab                                              */
/* ═══════════════════════════════════════════════════════════════ */

function PerformanceTab({
  connId,
  sql,
  t,
  ii,
}: {
  connId: string | null;
  sql: string;
  t: ReturnType<typeof getThemeTokens>;
  ii: ReturnType<typeof getI18n>;
}) {
  const [analysis, setAnalysis] = useState<QueryAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const cacheStats = queryCache.getStats();
  const slowStats = slowQueryMonitor.getStats();

  useEffect(() => {
    setSlowQueries(slowQueryMonitor.getSlowQueries());
  }, []);

  const analyze = useCallback(async () => {
    if (!connId || !sql.trim()) return;
    setAnalyzing(true);
    try {
      setAnalysis(await queryAnalyzer.analyzeQuery(connId, sql.trim()));
    } catch {
      toast.error(ii.dbAnalyzingQuery + ' ✗');
    }
    setAnalyzing(false);
  }, [connId, sql, ii]);

  const sevCls = (s: string) =>
    s === 'critical'
      ? t.isDark
        ? 'text-red-400 bg-red-500/10'
        : 'text-red-600 bg-red-50'
      : s === 'warning'
        ? t.isDark
          ? 'text-amber-400 bg-amber-500/10'
          : 'text-amber-600 bg-amber-50'
        : t.isDark
          ? 'text-blue-400 bg-blue-500/10'
          : 'text-blue-600 bg-blue-50';

  return (
    <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${t.scrollbar}`}>
      {/* Analyzer */}
      <div className={`rounded-xl border ${t.border.subtle} overflow-hidden`}>
        <div
          className={`flex items-center justify-between px-4 py-2.5 ${t.isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}
        >
          <div>
            <h3 className={`text-[11px] ${t.text.primary}`} style={{ fontWeight: 700 }}>
              {ii.dbQueryAnalyzer}
            </h3>
            <p className={`text-[8px] ${t.text.dimmed}`}>EXPLAIN ANALYZE — {ii.dbAnalyzeSql}</p>
          </div>
          <button
            onClick={analyze}
            disabled={analyzing || !connId}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] ${t.transition} ${analyzing || !connId ? 'opacity-50' : t.accent.solidBtn + ' text-white'}`}
            style={{ fontWeight: 600 }}
          >
            {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {analyzing ? ii.dbAnalyzingQuery : ii.dbAnalyzeSql}
          </button>
        </div>
        {analysis && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  label: ii.dbExecTime,
                  value: `${analysis.executionTime}ms`,
                  cls: analysis.executionTime > 100 ? 'text-amber-400' : 'text-emerald-400',
                },
                {
                  label: ii.dbRowsScanned,
                  value: analysis.rowsScanned.toLocaleString(),
                  cls: analysis.rowsScanned > 1000 ? 'text-amber-400' : 'text-emerald-400',
                },
                {
                  label: ii.dbRowsReturned,
                  value: analysis.rowsReturned.toLocaleString(),
                  cls: '',
                },
                {
                  label: ii.dbIndexUsed,
                  value: analysis.indexUsed || 'None',
                  cls: analysis.indexUsed ? 'text-emerald-400' : 'text-red-400',
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className={`px-3 py-2 rounded-lg ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}
                >
                  <div className={`text-[7px] ${t.text.dimmed}`}>{m.label}</div>
                  <div
                    className={`text-[11px] font-mono ${m.cls || t.text.primary}`}
                    style={{ fontWeight: 600 }}
                  >
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
            <div className={`p-3 rounded-lg ${t.isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
              <div className={`text-[8px] ${t.text.dimmed} mb-1`} style={{ fontWeight: 600 }}>
                {ii.dbQueryPlan}
              </div>
              <div className={`font-mono text-[9px] ${t.text.muted} space-y-0.5`}>
                <div>
                  {analysis.plan.nodeType} on {analysis.plan.relation || '?'} (cost=
                  {analysis.plan.cost.startup.toFixed(2)}..{analysis.plan.cost.total.toFixed(2)}{' '}
                  rows={analysis.plan.rows})
                </div>
                {analysis.plan.indexName && (
                  <div className="ml-4">Index: {analysis.plan.indexName}</div>
                )}
                {analysis.plan.filter && <div className="ml-4">Filter: {analysis.plan.filter}</div>}
                {analysis.plan.children?.map((c, i) => (
                  <div key={i} className="ml-6">
                    → {c.nodeType} (cost={c.cost.total.toFixed(2)} rows={c.rows})
                  </div>
                ))}
              </div>
            </div>
            {analysis.recommendations.length > 0 && (
              <div className="space-y-1.5">
                <div className={`text-[8px] ${t.text.dimmed}`} style={{ fontWeight: 600 }}>
                  {ii.dbQueryRecommendations}
                </div>
                {analysis.recommendations.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 px-3 py-2 rounded-lg ${sevCls(r.severity)}`}
                  >
                    <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[9px]" style={{ fontWeight: 500 }}>
                        {r.message}
                      </div>
                      {r.detail && <div className="text-[8px] mt-0.5 opacity-70">{r.detail}</div>}
                      {r.suggestedSql && (
                        <div
                          className={`font-mono text-[8px] mt-1 px-2 py-1 rounded ${t.isDark ? 'bg-black/20' : 'bg-white/60'}`}
                        >
                          {r.suggestedSql}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cache Stats */}
      <div className={`rounded-xl border ${t.border.subtle} overflow-hidden`}>
        <div className={`px-4 py-2.5 ${t.isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
          <h3 className={`text-[11px] ${t.text.primary}`} style={{ fontWeight: 700 }}>
            {ii.dbQueryCache}
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-2 p-3">
          {[
            { label: ii.dbCacheEntries, value: `${cacheStats.size}/${cacheStats.maxSize}` },
            { label: ii.dbCacheHitRate, value: `${(cacheStats.hitRate * 100).toFixed(1)}%` },
            { label: ii.dbCacheHits, value: cacheStats.hitCount.toLocaleString() },
            { label: ii.dbCacheMisses, value: cacheStats.missCount.toLocaleString() },
          ].map((s) => (
            <div
              key={s.label}
              className={`px-3 py-2 rounded-lg ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}
            >
              <div className={`text-[7px] ${t.text.dimmed}`}>{s.label}</div>
              <div
                className={`text-[11px] font-mono ${t.text.primary}`}
                style={{ fontWeight: 600 }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slow Queries */}
      <div className={`rounded-xl border ${t.border.subtle} overflow-hidden`}>
        <div
          className={`flex items-center justify-between px-4 py-2.5 ${t.isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}
        >
          <div>
            <h3 className={`text-[11px] ${t.text.primary}`} style={{ fontWeight: 700 }}>
              {ii.dbSlowQueries}
            </h3>
            <p className={`text-[8px] ${t.text.dimmed}`}>
              {ii.dbSlowThreshold}: {slowQueryMonitor.getThreshold()}ms · {ii.dbSlowTotal}:{' '}
              {slowStats.total} · {ii.dbSlowAvg}: {slowStats.avgDuration}ms
            </p>
          </div>
          <button
            onClick={() => {
              slowQueryMonitor.clear();
              setSlowQueries([]);
            }}
            className={`text-[8px] px-2 py-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
          >
            {ii.dbSlowClear}
          </button>
        </div>
        <div
          className={`divide-y ${t.isDark ? 'divide-white/[0.04]' : 'divide-slate-100'} max-h-[200px] overflow-y-auto`}
        >
          {slowQueries.length === 0 ? (
            <div className={`flex items-center justify-center py-6 ${t.text.dimmed} text-[10px]`}>
              {ii.dbNoSlowQueries}
            </div>
          ) : (
            slowQueries.map((sq) => (
              <div
                key={sq.id}
                className={`flex items-start gap-3 px-4 py-2 ${t.interactive.menuItem}`}
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] font-mono flex-shrink-0 ${
                    sq.duration > 1000
                      ? t.isDark
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-red-50 text-red-600'
                      : t.isDark
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-amber-50 text-amber-600'
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {sq.duration}ms
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`font-mono text-[8px] ${t.text.primary} line-clamp-2`}>
                    {sq.sql}
                  </div>
                  <div className={`text-[7px] ${t.text.dimmed} mt-0.5`}>
                    {new Date(sq.timestamp).toLocaleTimeString()} · {sq.rowsReturned} rows
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
