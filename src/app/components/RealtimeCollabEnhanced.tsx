/**
 * @file RealtimeCollabEnhanced.tsx
 * @description YYC³便携式智能AI系统 - 增强实时协作面板
 * Enhanced Realtime Collaboration Panel
 * Deep y-websocket integration: conflict resolution UI, user cursor tracking,
 * operation history replay, awareness protocol visualization, CRDT merge view.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,collaboration,realtime,websocket,crdt
 */

import {
  X,
  Users,
  Radio,
  GitMerge,
  History,
  Eye,
  MousePointer2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Wifi,
  WifiOff,
  Shield,
  Zap,
  Activity,
  ChevronDown,
  ChevronRight,
  FileText,
  Lock,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { useAppStore } from '../store';
import { collabManager, type CollabUser } from '../utils/collaboration';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';
import { wsCollab, type WSPeer, type WSEditOperation, type WSFileLock } from '../utils/ws-collab';

type CollabTab = 'presence' | 'conflicts' | 'history' | 'cursors';

interface ConflictEntry {
  id: string;
  file: string;
  users: string[];
  timestamp: number;
  status: 'active' | 'resolved' | 'auto-resolved';
  localContent: string;
  remoteContent: string;
  resolvedContent?: string;
}

interface OperationReplayState {
  isPlaying: boolean;
  speed: number;
  currentIndex: number;
  operations: WSEditOperation[];
}

export function RealtimeCollabEnhanced({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, language } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const [activeTab, setActiveTab] = useState<CollabTab>('presence');
  const [peers, setPeers] = useState<WSPeer[]>([]);
  const [collabUsers, setCollabUsers] = useState<CollabUser[]>([]);
  const [conflicts, setConflicts] = useState<ConflictEntry[]>([]);
  const [operations, setOperations] = useState<WSEditOperation[]>([]);
  const [fileLocks, setFileLocks] = useState<WSFileLock[]>([]);
  const [connectionStatus, setConnectionStatus] = useState(wsCollab.status);
  const [syncStatus, setSyncStatus] = useState(wsCollab.syncStatus);
  const [latency, setLatency] = useState(wsCollab.latency);
  const [followingUser, setFollowingUser] = useState<string | null>(null);
  const [expandedConflict, setExpandedConflict] = useState<string | null>(null);

  // ── Real server connection state ──
  const [connectionMode, setConnectionMode] = useState<'simulated' | 'real'>(
    wsCollab.isRealMode ? 'real' : 'simulated'
  );
  const [serverUrl, setServerUrl] = useState(wsCollab.serverUrl || 'ws://localhost:1234');
  const [isConnectingServer, setIsConnectingServer] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [showConnectionPanel, setShowConnectionPanel] = useState(false);

  const [replay, setReplay] = useState<OperationReplayState>({
    isPlaying: false,
    speed: 1,
    currentIndex: 0,
    operations: [],
  });

  const replayTimerRef = useRef<number | null>(null);

  // Connect and listen to ws-collab events
  useEffect(() => {
    if (!open) return;

    const handlePeers = (_: string, data: unknown) => {
      setPeers(data as WSPeer[]);
    };
    const handleStatus = (_: string, data: unknown) => {
      setConnectionStatus(
        (data as { status: import('../utils/ws-collab').WSConnectionStatus }).status
      );
    };
    const handleSync = (_: string, data: unknown) => {
      setSyncStatus((data as { syncStatus: import('../utils/ws-collab').WSSyncStatus }).syncStatus);
    };
    const handleLatency = (_: string, data: unknown) => {
      setLatency((data as { latency: number }).latency);
    };
    const handleConflict = (_: string, data: unknown) => {
      const d = data as { file: string; users: string[] };
      setConflicts((prev) => [
        ...prev,
        {
          id: `conflict-${Date.now()}`,
          file: d.file,
          users: d.users,
          timestamp: Date.now(),
          status: 'active',
          localContent: '// Local changes\nconst x = 1;',
          remoteContent: '// Remote changes\nconst x = 2;',
        },
      ]);
    };
    const handleConflictResolved = () => {
      setConflicts((prev) =>
        prev.map((c) => (c.status === 'active' ? { ...c, status: 'auto-resolved' as const } : c))
      );
    };

    wsCollab.on('peers-updated', handlePeers);
    wsCollab.on('status-changed', handleStatus);
    wsCollab.on('sync-changed', handleSync);
    wsCollab.on('latency-updated', handleLatency);
    wsCollab.on('conflict-detected', handleConflict);
    wsCollab.on('conflict-resolved', handleConflictResolved);

    // Ensure connected
    if (wsCollab.status !== 'connected') {
      wsCollab.connect();
    }

    // Sync initial state
    setPeers(wsCollab.peers);
    setOperations(wsCollab.operationLog);
    setFileLocks(wsCollab.fileLocks);
    setLatency(wsCollab.latency);
    setConnectionStatus(wsCollab.status);
    setSyncStatus(wsCollab.syncStatus);

    // Sync collab users
    const collabInterval = window.setInterval(() => {
      setCollabUsers(collabManager.getUsers());
      setOperations(wsCollab.operationLog);
      setFileLocks(wsCollab.fileLocks);
    }, 2000);

    // Demo conflicts
    const demoConflictTimer = window.setTimeout(() => {
      setConflicts((prev) =>
        prev.length === 0
          ? [
              {
                id: 'demo-conflict-1',
                file: 'store.ts',
                users: ['Alice', 'You'],
                timestamp: Date.now() - 5000,
                status: 'resolved',
                localContent: 'export const count = 0;',
                remoteContent: 'export const count = 1;',
                resolvedContent: 'export const count = 1; // merged',
              },
              {
                id: 'demo-conflict-2',
                file: 'App.tsx',
                users: ['Bob', 'You'],
                timestamp: Date.now() - 120000,
                status: 'auto-resolved',
                localContent: 'import React from "react";\nimport { Header } from "./Header";',
                remoteContent: 'import React from "react";\nimport { Footer } from "./Footer";',
                resolvedContent:
                  'import React from "react";\nimport { Header } from "./Header";\nimport { Footer } from "./Footer";',
              },
            ]
          : prev
      );
    }, 1000);

    return () => {
      wsCollab.off('peers-updated', handlePeers);
      wsCollab.off('status-changed', handleStatus);
      wsCollab.off('sync-changed', handleSync);
      wsCollab.off('latency-updated', handleLatency);
      wsCollab.off('conflict-detected', handleConflict);
      wsCollab.off('conflict-resolved', handleConflictResolved);
      window.clearInterval(collabInterval);
      window.clearTimeout(demoConflictTimer);
      if (replayTimerRef.current) window.clearInterval(replayTimerRef.current);
    };
  }, [open]);

  // Replay logic
  const startReplay = useCallback(() => {
    const ops = wsCollab.operationLog;
    if (ops.length === 0) return;
    setReplay({ isPlaying: true, speed: 1, currentIndex: 0, operations: ops });
    replayTimerRef.current = window.setInterval(() => {
      setReplay((prev) => {
        if (prev.currentIndex >= prev.operations.length - 1) {
          if (replayTimerRef.current) window.clearInterval(replayTimerRef.current);
          return { ...prev, isPlaying: false };
        }
        return { ...prev, currentIndex: prev.currentIndex + 1 };
      });
    }, 1000);
  }, []);

  const pauseReplay = useCallback(() => {
    if (replayTimerRef.current) window.clearInterval(replayTimerRef.current);
    setReplay((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const resolveConflict = (id: string, resolution: 'local' | 'remote' | 'both') => {
    setConflicts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        let resolved = '';
        if (resolution === 'local') resolved = c.localContent;
        else if (resolution === 'remote') resolved = c.remoteContent;
        else resolved = `${c.localContent}\n${c.remoteContent}`;
        return { ...c, status: 'resolved', resolvedContent: resolved };
      })
    );
  };

  if (!open) return null;

  const onlinePeers = peers.filter((p) => p.online);
  const offlinePeers = peers.filter((p) => !p.online);
  const activeConflicts = conflicts.filter((c) => c.status === 'active');

  const statusColor =
    connectionStatus === 'connected'
      ? 'text-emerald-400'
      : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
        ? 'text-amber-400'
        : 'text-red-400';

  const syncColor =
    syncStatus === 'synced'
      ? 'text-emerald-400'
      : syncStatus === 'syncing'
        ? 'text-amber-400'
        : syncStatus === 'conflict'
          ? 'text-red-400'
          : 'text-slate-500';

  const tabs: {
    id: CollabTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'presence', label: i.rcPresence, icon: Users, badge: onlinePeers.length },
    { id: 'conflicts', label: i.rcConflicts, icon: GitMerge, badge: activeConflicts.length },
    { id: 'history', label: i.rcOpHistory, icon: History, badge: operations.length },
    { id: 'cursors', label: i.rcCursors, icon: MousePointer2 },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        data-testid="collab-backdrop"
      />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div
          data-testid="collab-panel"
          className={`w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-6 py-4 border-b ${t.border.subtle} flex-shrink-0`}
          >
            <div className="flex items-center space-x-3">
              <Radio className={`w-5 h-5 ${t.accent.primary}`} />
              <div>
                <h2 className="text-[15px]" style={{ fontWeight: 600 }}>
                  {i.rcTitle}
                </h2>
                <p className={`text-[11px] ${t.text.muted}`}>{i.rcSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Connection status */}
              <div
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] ${t.isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}
              >
                {connectionStatus === 'connected' ? (
                  <Wifi className="w-3 h-3 text-emerald-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-400" />
                )}
                <span className={statusColor} style={{ fontWeight: 500 }}>
                  {i[
                    `ws${connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}` as keyof typeof i
                  ] || connectionStatus}
                </span>
              </div>
              {/* Latency */}
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] ${t.isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}
              >
                <Zap
                  className={`w-3 h-3 ${latency < 50 ? 'text-emerald-400' : latency < 150 ? 'text-amber-400' : 'text-red-400'}`}
                />
                <span className={t.text.secondary}>{latency}ms</span>
              </div>
              {/* Sync status */}
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] ${t.isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}
              >
                <Activity className={`w-3 h-3 ${syncColor}`} />
                <span className={syncColor} style={{ fontWeight: 500 }}>
                  {i[
                    `ws${syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}` as keyof typeof i
                  ] || syncStatus}
                </span>
              </div>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
                data-testid="collab-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Connection Mode Panel */}
          <div
            data-testid="collab-connection-mode"
            className={`flex items-center justify-between px-6 py-2 border-b ${t.border.subtle} flex-shrink-0`}
          >
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] ${t.text.muted}`} style={{ fontWeight: 600 }}>
                {i.rcConnectionMode}:
              </span>
              <button
                onClick={() => {
                  if (connectionMode === 'real') {
                    wsCollab.setSimulatedMode();
                    setConnectionMode('simulated');
                    setConnectError(null);
                  } else {
                    setShowConnectionPanel(!showConnectionPanel);
                  }
                }}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] ${t.transition} ${
                  connectionMode === 'simulated'
                    ? t.isDark
                      ? 'bg-amber-900/20 text-amber-400'
                      : 'bg-amber-50 text-amber-700'
                    : t.isDark
                      ? 'bg-emerald-900/20 text-emerald-400'
                      : 'bg-emerald-50 text-emerald-700'
                }`}
                style={{ fontWeight: 500 }}
              >
                {connectionMode === 'simulated' ? (
                  <>
                    <Shield className="w-3 h-3" />
                    <span>{i.rcSimulated}</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3 h-3" />
                    <span>{i.rcRealMode}</span>
                  </>
                )}
              </button>
              {connectionMode === 'real' && (
                <button
                  onClick={() => {
                    wsCollab.setSimulatedMode();
                    setConnectionMode('simulated');
                    setConnectError(null);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] ${t.interactive.menuItem}`}
                >
                  {i.rcDisconnectServer}
                </button>
              )}
            </div>
            {showConnectionPanel && connectionMode === 'simulated' && (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder={i.rcServerPlaceholder}
                  data-testid="collab-server-url-input"
                  className={`px-2.5 py-1 rounded-lg text-[11px] w-52 outline-none ${t.isDark ? 'bg-slate-800 text-slate-300 placeholder:text-slate-600' : 'bg-white text-slate-700 placeholder:text-slate-400'} border ${t.border.subtle} focus:border-indigo-500/50`}
                />
                <button
                  onClick={async () => {
                    if (!serverUrl.trim()) return;
                    setIsConnectingServer(true);
                    setConnectError(null);
                    const ok = await wsCollab.connectToServer(serverUrl.trim());
                    setIsConnectingServer(false);
                    if (ok) {
                      setConnectionMode('real');
                      setShowConnectionPanel(false);
                    } else {
                      setConnectError(i.rcFailedConnect);
                    }
                  }}
                  disabled={isConnectingServer}
                  data-testid="collab-connect-btn"
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-[10px] ${t.transition} ${
                    isConnectingServer ? 'opacity-50 cursor-not-allowed' : ''
                  } bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30`}
                  style={{ fontWeight: 500 }}
                >
                  {isConnectingServer ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>{i.rcConnectingServer}</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3 h-3" />
                      <span>{i.rcConnectReal}</span>
                    </>
                  )}
                </button>
                {connectError && <span className="text-[10px] text-red-400">{connectError}</span>}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div
            className={`flex items-center space-x-1 px-6 py-2 border-b ${t.border.subtle} flex-shrink-0`}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`collab-tab-${tab.id}`}
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
                      className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                        tab.id === 'conflicts' && tab.badge > 0
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-indigo-500/20 text-indigo-400'
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* ── Presence Tab ── */}
            {activeTab === 'presence' && (
              <div className="space-y-4">
                {/* Online peers */}
                <div>
                  <h3 className={`text-[12px] mb-2 ${t.text.muted}`} style={{ fontWeight: 600 }}>
                    {i.rcOnline} ({onlinePeers.length})
                  </h3>
                  <div className="space-y-2">
                    {onlinePeers.map((peer) => (
                      <div
                        key={peer.id}
                        className={`flex items-center justify-between p-3 rounded-xl ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] text-white"
                              style={{ background: peer.color, fontWeight: 600 }}
                            >
                              {peer.name.charAt(0)}
                            </div>
                            <div
                              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2"
                              style={{ borderColor: t.isDark ? '#0f172a' : '#ffffff' }}
                            />
                          </div>
                          <div>
                            <p className="text-[13px]" style={{ fontWeight: 500 }}>
                              {peer.name}
                            </p>
                            <p className={`text-[10px] ${t.text.muted}`}>
                              {peer.file ? `${i.rcEditing} ${peer.file}` : i.rcIdle}
                              {peer.cursor && ` • L${peer.cursor.line}:${peer.cursor.col}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              setFollowingUser(followingUser === peer.id ? null : peer.id)
                            }
                            className={`px-2 py-1 rounded-lg text-[10px] ${t.transition} ${
                              followingUser === peer.id
                                ? `${t.accent.activeBg} ${t.accent.activeText}`
                                : t.interactive.menuItem
                            }`}
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Offline peers */}
                {offlinePeers.length > 0 && (
                  <div>
                    <h3 className={`text-[12px] mb-2 ${t.text.muted}`} style={{ fontWeight: 600 }}>
                      {i.rcOfflinePeers} ({offlinePeers.length})
                    </h3>
                    <div className="space-y-2">
                      {offlinePeers.map((peer) => (
                        <div
                          key={peer.id}
                          className={`flex items-center space-x-3 p-3 rounded-xl opacity-50 ${t.isDark ? 'bg-slate-800/20' : 'bg-slate-50'}`}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] text-white/60"
                            style={{ background: peer.color, fontWeight: 600 }}
                          >
                            {peer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[13px]" style={{ fontWeight: 500 }}>
                              {peer.name}
                            </p>
                            <p className={`text-[10px] ${t.text.muted}`}>
                              {i.rcLastSeen} {Math.floor((Date.now() - peer.lastSeen) / 60000)}m
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Locks */}
                {fileLocks.length > 0 && (
                  <div>
                    <h3 className={`text-[12px] mb-2 ${t.text.muted}`} style={{ fontWeight: 600 }}>
                      {i.rcFileLocks} ({fileLocks.length})
                    </h3>
                    <div className="space-y-1">
                      {fileLocks.map((lock) => (
                        <div
                          key={lock.file}
                          className={`flex items-center justify-between p-2 rounded-lg text-[11px] ${t.isDark ? 'bg-amber-900/10' : 'bg-amber-50'}`}
                        >
                          <div className="flex items-center space-x-2">
                            <Lock className="w-3 h-3 text-amber-500" />
                            <span>{lock.file}</span>
                          </div>
                          <span className={t.text.muted}>{lock.lockedBy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Conflicts Tab ── */}
            {activeTab === 'conflicts' && (
              <div className="space-y-3">
                {conflicts.length === 0 ? (
                  <div className={`text-center py-12 ${t.text.muted}`}>
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                    <p className="text-[13px]">{i.rcNoConflicts}</p>
                  </div>
                ) : (
                  conflicts.map((conflict) => (
                    <div
                      key={conflict.id}
                      className={`rounded-xl overflow-hidden ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}
                    >
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() =>
                          setExpandedConflict(expandedConflict === conflict.id ? null : conflict.id)
                        }
                      >
                        <div className="flex items-center space-x-3">
                          {conflict.status === 'active' ? (
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                          <div>
                            <p className="text-[13px]" style={{ fontWeight: 500 }}>
                              {conflict.file}
                            </p>
                            <p className={`text-[10px] ${t.text.muted}`}>
                              {conflict.users.join(' & ')} •{' '}
                              {new Date(conflict.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] ${
                              conflict.status === 'active'
                                ? 'bg-red-500/20 text-red-400'
                                : conflict.status === 'resolved'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-blue-500/20 text-blue-400'
                            }`}
                            style={{ fontWeight: 600 }}
                          >
                            {conflict.status === 'active'
                              ? i.rcActive
                              : conflict.status === 'resolved'
                                ? i.rcResolved
                                : i.rcAutoResolved}
                          </span>
                          {expandedConflict === conflict.id ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>

                      {expandedConflict === conflict.id && (
                        <div className={`border-t ${t.border.subtle} p-3 space-y-3`}>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p
                                className={`text-[10px] mb-1 ${t.text.muted}`}
                                style={{ fontWeight: 600 }}
                              >
                                {i.rcLocalChanges}
                              </p>
                              <pre
                                className={`p-2 rounded-lg text-[10px] overflow-x-auto ${t.isDark ? 'bg-blue-900/10 text-blue-300' : 'bg-blue-50 text-blue-700'}`}
                              >
                                {conflict.localContent}
                              </pre>
                            </div>
                            <div>
                              <p
                                className={`text-[10px] mb-1 ${t.text.muted}`}
                                style={{ fontWeight: 600 }}
                              >
                                {i.rcRemoteChanges}
                              </p>
                              <pre
                                className={`p-2 rounded-lg text-[10px] overflow-x-auto ${t.isDark ? 'bg-purple-900/10 text-purple-300' : 'bg-purple-50 text-purple-700'}`}
                              >
                                {conflict.remoteContent}
                              </pre>
                            </div>
                          </div>

                          {conflict.resolvedContent && (
                            <div>
                              <p
                                className={`text-[10px] mb-1 ${t.text.muted}`}
                                style={{ fontWeight: 600 }}
                              >
                                {i.rcMergedResult}
                              </p>
                              <pre
                                className={`p-2 rounded-lg text-[10px] overflow-x-auto ${t.isDark ? 'bg-emerald-900/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}
                              >
                                {conflict.resolvedContent}
                              </pre>
                            </div>
                          )}

                          {conflict.status === 'active' && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => resolveConflict(conflict.id, 'local')}
                                className={`px-3 py-1.5 rounded-lg text-[11px] ${t.isDark ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-700'} ${t.transition}`}
                              >
                                {i.rcAcceptLocal}
                              </button>
                              <button
                                onClick={() => resolveConflict(conflict.id, 'remote')}
                                className={`px-3 py-1.5 rounded-lg text-[11px] ${t.isDark ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30' : 'bg-purple-100 text-purple-700'} ${t.transition}`}
                              >
                                {i.rcAcceptRemote}
                              </button>
                              <button
                                onClick={() => resolveConflict(conflict.id, 'both')}
                                className={`px-3 py-1.5 rounded-lg text-[11px] ${t.isDark ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-700'} ${t.transition}`}
                              >
                                {i.rcAcceptBoth}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── History Tab ── */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {/* Replay controls */}
                <div
                  className={`flex items-center justify-between p-3 rounded-xl ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}
                >
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setReplay((prev) => ({ ...prev, currentIndex: 0 }))}
                      className={`p-1.5 rounded-lg ${t.interactive.iconBtn}`}
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={replay.isPlaying ? pauseReplay : startReplay}
                      className={`p-1.5 rounded-lg ${t.interactive.iconBtn}`}
                    >
                      {replay.isPlaying ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setReplay((prev) => ({ ...prev, currentIndex: prev.operations.length - 1 }))
                      }
                      className={`p-1.5 rounded-lg ${t.interactive.iconBtn}`}
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-[10px] ${t.text.muted}`}>
                      {i.rcSpeed}: {replay.speed}x
                    </span>
                    <span className={`text-[10px] ${t.text.muted}`}>
                      {replay.currentIndex + 1}/{replay.operations.length || operations.length}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                {replay.operations.length > 0 && (
                  <div
                    className={`h-1.5 rounded-full overflow-hidden ${t.isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
                  >
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{
                        width: `${((replay.currentIndex + 1) / replay.operations.length) * 100}%`,
                      }}
                    />
                  </div>
                )}

                {/* Operation log */}
                <div className="space-y-1">
                  {(replay.operations.length > 0 ? replay.operations : operations).map(
                    (op, idx) => (
                      <div
                        key={op.id}
                        className={`flex items-center space-x-3 p-2 rounded-lg text-[11px] ${t.transition} ${
                          replay.isPlaying && idx === replay.currentIndex
                            ? `${t.accent.activeBg} ${t.accent.activeText}`
                            : idx <= replay.currentIndex
                              ? t.isDark
                                ? 'bg-slate-800/20'
                                : 'bg-slate-50'
                              : 'opacity-40'
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] ${
                            op.type === 'insert'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : op.type === 'delete'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-amber-500/20 text-amber-400'
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {op.type}
                        </span>
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        <span className="flex-shrink-0">{op.file}</span>
                        <span className={t.text.muted}>
                          L{op.position.line}:{op.position.col}
                        </span>
                        <ArrowRight className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate flex-1">{op.content.substring(0, 40)}</span>
                        <span className={`text-[9px] flex-shrink-0 ${t.text.dimmed}`}>
                          {new Date(op.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    )
                  )}

                  {operations.length === 0 && (
                    <div className={`text-center py-8 ${t.text.muted}`}>
                      <History className="w-6 h-6 mx-auto mb-2 opacity-40" />
                      <p className="text-[12px]">{i.rcNoOps}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Cursors Tab ── */}
            {activeTab === 'cursors' && (
              <div className="space-y-4">
                <p className={`text-[11px] ${t.text.muted}`}>{i.rcCursorDesc}</p>

                {/* Cursor map visualization */}
                <div className={`rounded-xl p-4 ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                  <div className="relative" style={{ height: '300px' }}>
                    {/* Simulated editor lines */}
                    {Array.from({ length: 20 }).map((_, lineIdx) => (
                      <div
                        key={lineIdx}
                        className={`flex items-center h-[15px] text-[9px] ${t.text.dimmed}`}
                      >
                        <span className="w-6 text-right mr-2">{lineIdx + 1}</span>
                        <div className="flex-1 relative">
                          <div
                            className={`h-px ${t.isDark ? 'bg-slate-700/30' : 'bg-slate-200/50'}`}
                          />
                          {/* User cursors on this line */}
                          {collabUsers
                            .filter((u) => u.cursor && u.cursor.line === lineIdx + 1)
                            .map((user) => (
                              <div
                                key={user.id}
                                className="absolute top-0 flex items-start"
                                style={{ left: `${(user.cursor?.col || 0) * 6}px` }}
                              >
                                <div className="w-0.5 h-3.5" style={{ background: user.color }} />
                                <span
                                  className="px-1 py-0.5 rounded text-[7px] text-white -mt-3 ml-0.5 whitespace-nowrap"
                                  style={{ background: user.color, fontWeight: 600 }}
                                >
                                  {user.name}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Following indicator */}
                {followingUser && (
                  <div
                    className={`flex items-center justify-between p-3 rounded-xl ${t.isDark ? 'bg-indigo-900/20' : 'bg-indigo-50'}`}
                  >
                    <div className="flex items-center space-x-2 text-[12px]">
                      <Eye className="w-4 h-4 text-indigo-400" />
                      <span>
                        {i.rcFollowing}: {peers.find((p) => p.id === followingUser)?.name || '—'}
                      </span>
                    </div>
                    <button
                      onClick={() => setFollowingUser(null)}
                      className={`px-2 py-1 rounded-lg text-[10px] ${t.interactive.menuItem}`}
                    >
                      {i.rcStopFollowing}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className={`flex items-center justify-between px-6 py-3 border-t ${t.border.subtle} text-[10px] ${t.text.dimmed} flex-shrink-0`}
          >
            <div className="flex items-center space-x-3">
              <span>{i.rcProvider}: yjs CRDT</span>
              <span>•</span>
              <span>{i.rcProtocol}: y-websocket</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>
                {i.rcQueueSize}: {wsCollab.queueSize}
              </span>
              <span>•</span>
              <span>
                {i.rcPeerCount}: {onlinePeers.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
