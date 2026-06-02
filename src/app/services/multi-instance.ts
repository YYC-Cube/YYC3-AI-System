/**
 * @file multi-instance.ts
 * @description YYC³便携式智能AI系统 - 多实例管理服务
 * Multi-Instance Management Service
 * Window management, workspace isolation, session management, IPC communication.
 * Front-end-only implementation with Zustand stores and simulated Tauri bridge.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,multi-instance,window-manager,workspace,session,ipc
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ──

export type InstanceType = 'main' | 'secondary' | 'popup' | 'preview';
export type WindowType = 'main' | 'editor' | 'preview' | 'terminal' | 'ai-chat' | 'settings';
export type WorkspaceType = 'project' | 'ai-session' | 'debug' | 'custom';
export type SessionType = 'ai-chat' | 'code-edit' | 'debug' | 'preview' | 'terminal';
export type IPCMessageType =
  | 'instance-created'
  | 'instance-closed'
  | 'workspace-created'
  | 'workspace-updated'
  | 'workspace-closed'
  | 'session-created'
  | 'session-updated'
  | 'session-closed'
  | 'state-sync'
  | 'resource-share'
  | 'clipboard-share';

export interface AppInstance {
  id: string;
  type: InstanceType;
  windowId: string;
  windowType: WindowType;
  title: string;
  createdAt: number;
  lastActiveAt: number;
  isMain: boolean;
  isVisible: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  workspaceId?: string;
  sessionIds: string[];
  state: Record<string, any>;
}

export interface WorkspaceConfig {
  editor?: { fontSize?: number; tabSize?: number; theme?: string };
  ai?: { providerId?: string; modelId?: string };
  panelLayout?: string;
  theme?: string;
}

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  icon?: string;
  createdAt: number;
  updatedAt: number;
  projectPath?: string;
  config: WorkspaceConfig;
  sessionIds: string[];
  windowIds: string[];
  isActive: boolean;
}

export interface SessionData {
  aiMessages?: Array<{ role: string; content: string }>;
  editedFiles?: Array<{ path: string; content: string }>;
  terminalHistory?: Array<{ command: string; output: string }>;
  debugState?: unknown;
  previewUrl?: string;
}

export interface Session {
  id: string;
  type: SessionType;
  name: string;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'idle' | 'suspended' | 'closed';
  data: SessionData;
  workspaceId: string;
  windowId: string;
}

export interface IPCMessage {
  id: string;
  type: IPCMessageType;
  senderId: string;
  receiverId?: string;
  data: unknown;
  timestamp: number;
}

export interface WindowConfig {
  title?: string;
  size?: { width: number; height: number };
  position?: { x: number; y: number };
  resizable?: boolean;
  alwaysOnTop?: boolean;
  fullscreen?: boolean;
  workspaceId?: string;
}

// ── Window Manager Store ──

interface WindowState {
  instances: AppInstance[];
  activeInstanceId: string | null;
  mainInstanceId: string | null;
}

interface WindowActions {
  createInstance: (type: WindowType, config?: WindowConfig) => AppInstance;
  closeInstance: (instanceId: string) => void;
  activateInstance: (instanceId: string) => void;
  minimizeInstance: (instanceId: string) => void;
  maximizeInstance: (instanceId: string) => void;
  restoreInstance: (instanceId: string) => void;
  moveInstance: (instanceId: string, position: { x: number; y: number }) => void;
  resizeInstance: (instanceId: string, size: { width: number; height: number }) => void;
  updateInstanceState: (instanceId: string, updates: Partial<AppInstance>) => void;
  getAllInstances: () => AppInstance[];
}

export const useWindowManagerStore = create<WindowState & WindowActions>()(
  persist(
    (set, get) => ({
      instances: [],
      activeInstanceId: null,
      mainInstanceId: null,

      createInstance: (type, config = {}) => {
        const id = `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const windowId = `win-${id}`;
        const existing = get().instances;
        const instance: AppInstance = {
          id,
          type: existing.length === 0 ? 'main' : 'secondary',
          windowId,
          windowType: type,
          title: config.title || `YYC3 - ${type}`,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          isMain: existing.length === 0,
          isVisible: true,
          isMinimized: false,
          isMaximized: false,
          position: config.position || {
            x: 100 + existing.length * 40,
            y: 100 + existing.length * 40,
          },
          size: config.size || { width: 1200, height: 800 },
          workspaceId: config.workspaceId,
          sessionIds: [],
          state: {},
        };
        set((s) => ({
          instances: [...s.instances, instance],
          activeInstanceId: instance.id,
          mainInstanceId: s.mainInstanceId || instance.id,
        }));
        // Broadcast via IPC
        ipcManager.broadcast('instance-created', instance);
        return instance;
      },

      closeInstance: (instanceId) => {
        const instance = get().instances.find((i) => i.id === instanceId);
        if (instance) ipcManager.broadcast('instance-closed', instance);
        set((s) => ({
          instances: s.instances.filter((i) => i.id !== instanceId),
          activeInstanceId: s.activeInstanceId === instanceId ? null : s.activeInstanceId,
        }));
      },

      activateInstance: (instanceId) =>
        set((s) => ({
          activeInstanceId: instanceId,
          instances: s.instances.map((i) =>
            i.id === instanceId ? { ...i, lastActiveAt: Date.now() } : i
          ),
        })),

      minimizeInstance: (instanceId) =>
        set((s) => ({
          instances: s.instances.map((i) =>
            i.id === instanceId ? { ...i, isMinimized: true } : i
          ),
        })),

      maximizeInstance: (instanceId) =>
        set((s) => ({
          instances: s.instances.map((i) =>
            i.id === instanceId ? { ...i, isMaximized: true, isMinimized: false } : i
          ),
        })),

      restoreInstance: (instanceId) =>
        set((s) => ({
          instances: s.instances.map((i) =>
            i.id === instanceId ? { ...i, isMinimized: false, isMaximized: false } : i
          ),
        })),

      moveInstance: (instanceId, position) =>
        set((s) => ({
          instances: s.instances.map((i) => (i.id === instanceId ? { ...i, position } : i)),
        })),

      resizeInstance: (instanceId, size) =>
        set((s) => ({
          instances: s.instances.map((i) => (i.id === instanceId ? { ...i, size } : i)),
        })),

      updateInstanceState: (instanceId, updates) =>
        set((s) => ({
          instances: s.instances.map((i) => (i.id === instanceId ? { ...i, ...updates } : i)),
        })),

      getAllInstances: () => get().instances,
    }),
    { name: 'yyc3-window-manager', partialize: (s) => ({ instances: s.instances }) }
  )
);

// ── Workspace Manager Store ──

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
}

interface WorkspaceActions {
  createWorkspace: (name: string, type: WorkspaceType, config?: WorkspaceConfig) => Workspace;
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (workspaceId: string) => void;
  activateWorkspace: (workspaceId: string) => void;
  duplicateWorkspace: (workspaceId: string) => Workspace;
  exportWorkspace: (workspaceId: string) => string;
  importWorkspace: (data: string) => Workspace;
  addSessionToWorkspace: (workspaceId: string, sessionId: string) => void;
  removeSessionFromWorkspace: (workspaceId: string, sessionId: string) => void;
  getActiveWorkspace: () => Workspace | undefined;
}

export const useWorkspaceManagerStore = create<WorkspaceState & WorkspaceActions>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,

      createWorkspace: (name, type, config = {}) => {
        const ws: Workspace = {
          id: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name,
          type,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          sessionIds: [],
          windowIds: [],
          isActive: false,
        };
        set((s) => ({ workspaces: [...s.workspaces, ws] }));
        ipcManager.broadcast('workspace-created', ws);
        return ws;
      },

      updateWorkspace: (workspaceId, updates) =>
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === workspaceId ? { ...w, ...updates, updatedAt: Date.now() } : w
          ),
        })),

      deleteWorkspace: (workspaceId) => {
        ipcManager.broadcast('workspace-closed', { id: workspaceId });
        set((s) => ({
          workspaces: s.workspaces.filter((w) => w.id !== workspaceId),
          activeWorkspaceId: s.activeWorkspaceId === workspaceId ? null : s.activeWorkspaceId,
        }));
      },

      activateWorkspace: (workspaceId) =>
        set((s) => ({
          activeWorkspaceId: workspaceId,
          workspaces: s.workspaces.map((w) => ({ ...w, isActive: w.id === workspaceId })),
        })),

      duplicateWorkspace: (workspaceId) => {
        const orig = get().workspaces.find((w) => w.id === workspaceId);
        if (!orig) throw new Error('Workspace not found');
        const dup: Workspace = {
          ...orig,
          id: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: `${orig.name} (Copy)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          sessionIds: [],
          windowIds: [],
          isActive: false,
        };
        set((s) => ({ workspaces: [...s.workspaces, dup] }));
        return dup;
      },

      exportWorkspace: (workspaceId) => {
        const ws = get().workspaces.find((w) => w.id === workspaceId);
        if (!ws) throw new Error('Workspace not found');
        return JSON.stringify(ws, null, 2);
      },

      importWorkspace: (data) => {
        const ws = JSON.parse(data) as Workspace;
        ws.id = `ws-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        ws.createdAt = Date.now();
        ws.updatedAt = Date.now();
        ws.isActive = false;
        set((s) => ({ workspaces: [...s.workspaces, ws] }));
        return ws;
      },

      addSessionToWorkspace: (workspaceId, sessionId) =>
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === workspaceId
              ? { ...w, sessionIds: [...w.sessionIds, sessionId], updatedAt: Date.now() }
              : w
          ),
        })),

      removeSessionFromWorkspace: (workspaceId, sessionId) =>
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === workspaceId
              ? {
                  ...w,
                  sessionIds: w.sessionIds.filter((id) => id !== sessionId),
                  updatedAt: Date.now(),
                }
              : w
          ),
        })),

      getActiveWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get();
        return workspaces.find((w) => w.id === activeWorkspaceId);
      },
    }),
    { name: 'yyc3-workspace-manager', partialize: (s) => ({ workspaces: s.workspaces }) }
  )
);

// ── Session Manager Store ──

interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
}

interface SessionActions {
  createSession: (
    name: string,
    type: SessionType,
    workspaceId: string,
    data?: SessionData
  ) => Session;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  deleteSession: (sessionId: string) => void;
  activateSession: (sessionId: string) => void;
  suspendSession: (sessionId: string) => void;
  resumeSession: (sessionId: string) => void;
  updateSessionData: (sessionId: string, data: Partial<SessionData>) => void;
  getWorkspaceSessions: (workspaceId: string) => Session[];
  getSessionStats: () => { total: number; active: number; idle: number; suspended: number };
}

export const useSessionManagerStore = create<SessionState & SessionActions>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,

      createSession: (name, type, workspaceId, data = {}) => {
        const session: Session = {
          id: `ses-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name,
          type,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: 'active',
          data,
          workspaceId,
          windowId: '',
        };
        set((s) => ({ sessions: [...s.sessions, session] }));
        ipcManager.broadcast('session-created', session);
        return session;
      },

      updateSession: (sessionId, updates) =>
        set((s) => ({
          sessions: s.sessions.map((ses) =>
            ses.id === sessionId ? { ...ses, ...updates, updatedAt: Date.now() } : ses
          ),
        })),

      deleteSession: (sessionId) => {
        ipcManager.broadcast('session-closed', { id: sessionId });
        set((s) => ({
          sessions: s.sessions.filter((ses) => ses.id !== sessionId),
          activeSessionId: s.activeSessionId === sessionId ? null : s.activeSessionId,
        }));
      },

      activateSession: (sessionId) =>
        set((s) => ({
          activeSessionId: sessionId,
          sessions: s.sessions.map((ses) =>
            ses.id === sessionId ? { ...ses, status: 'active' as const } : ses
          ),
        })),

      suspendSession: (sessionId) =>
        set((s) => ({
          sessions: s.sessions.map((ses) =>
            ses.id === sessionId ? { ...ses, status: 'suspended' as const } : ses
          ),
        })),

      resumeSession: (sessionId) =>
        set((s) => ({
          sessions: s.sessions.map((ses) =>
            ses.id === sessionId ? { ...ses, status: 'active' as const } : ses
          ),
        })),

      updateSessionData: (sessionId, data) =>
        set((s) => ({
          sessions: s.sessions.map((ses) =>
            ses.id === sessionId
              ? { ...ses, data: { ...ses.data, ...data }, updatedAt: Date.now() }
              : ses
          ),
        })),

      getWorkspaceSessions: (workspaceId) =>
        get().sessions.filter((s) => s.workspaceId === workspaceId),

      getSessionStats: () => {
        const sessions = get().sessions;
        return {
          total: sessions.length,
          active: sessions.filter((s) => s.status === 'active').length,
          idle: sessions.filter((s) => s.status === 'idle').length,
          suspended: sessions.filter((s) => s.status === 'suspended').length,
        };
      },
    }),
    { name: 'yyc3-session-manager', partialize: (s) => ({ sessions: s.sessions }) }
  )
);

// ── IPC Manager (in-memory event bus for web environment) ──

class IPCManagerImpl {
  private handlers = new Map<IPCMessageType, Set<(msg: IPCMessage) => void>>();
  private instanceId = `ipc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  private messageLog: IPCMessage[] = [];

  on(type: IPCMessageType, handler: (msg: IPCMessage) => void): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  broadcast(type: IPCMessageType, data: unknown): void {
    const msg: IPCMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      senderId: this.instanceId,
      data,
      timestamp: Date.now(),
    };
    this.messageLog.push(msg);
    // Keep last 200 messages
    if (this.messageLog.length > 200) this.messageLog = this.messageLog.slice(-200);
    // Dispatch to handlers
    const handlers = this.handlers.get(type);
    if (handlers) handlers.forEach((h) => h(msg));
  }

  sendToInstance(receiverId: string, type: IPCMessageType, data: unknown): void {
    const msg: IPCMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      senderId: this.instanceId,
      receiverId,
      data,
      timestamp: Date.now(),
    };
    this.messageLog.push(msg);
    const handlers = this.handlers.get(type);
    if (handlers) handlers.forEach((h) => h(msg));
  }

  getInstanceId(): string {
    return this.instanceId;
  }
  getMessageLog(): IPCMessage[] {
    return [...this.messageLog];
  }
  clearLog(): void {
    this.messageLog = [];
  }
}

export const ipcManager = new IPCManagerImpl();
