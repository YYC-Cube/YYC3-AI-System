/**
 * @file ws-collab.ts
 * @description YYC³便携式智能AI系统 - WebSocket协作管理器
 * WebSocket Collaboration Manager
 * Simulated WebSocket connection with reconnection logic, presence heartbeat,
 * file lock/unlock, edit operation broadcast, and connection status.
 * In production, replace SimulatedWS with a real WebSocket to a yjs server.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,websocket,collaboration,realtime
 */

/* ── Types ── */

export type WSConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

export type WSSyncStatus = 'synced' | 'syncing' | 'conflict' | 'offline';

export interface WSPeer {
  id: string;
  name: string;
  color: string;
  file: string | null;
  cursor: { line: number; col: number } | null;
  online: boolean;
  lastSeen: number;
}

export interface WSFileLock {
  file: string;
  lockedBy: string;
  lockedAt: number;
}

export interface WSEditOperation {
  id: string;
  file: string;
  userId: string;
  type: 'insert' | 'delete' | 'replace';
  position: { line: number; col: number };
  content: string;
  timestamp: number;
}

export interface WSMessage {
  id: string;
  type: 'presence' | 'cursor' | 'edit' | 'lock' | 'unlock' | 'sync' | 'heartbeat' | 'conflict';
  senderId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export type WSEventHandler = (event: string, data: unknown) => void;

/* ── Simulated peers ── */
const DEMO_PEERS: WSPeer[] = [
  {
    id: 'peer-alice',
    name: 'Alice',
    color: '#6366f1',
    file: 'ChatInterface.tsx',
    cursor: { line: 42, col: 15 },
    online: true,
    lastSeen: Date.now(),
  },
  {
    id: 'peer-bob',
    name: 'Bob',
    color: '#f59e0b',
    file: 'store.ts',
    cursor: { line: 18, col: 8 },
    online: true,
    lastSeen: Date.now(),
  },
  {
    id: 'peer-carol',
    name: 'Carol',
    color: '#10b981',
    file: null,
    cursor: null,
    online: false,
    lastSeen: Date.now() - 300000,
  },
  {
    id: 'peer-dave',
    name: 'Dave',
    color: '#ec4899',
    file: 'App.tsx',
    cursor: { line: 7, col: 22 },
    online: true,
    lastSeen: Date.now(),
  },
];

const DEMO_FILES = [
  'ChatInterface.tsx',
  'store.ts',
  'App.tsx',
  'types.ts',
  'routes.ts',
  'IDELayout.tsx',
  'Header.tsx',
];

/* ══════════════════════════════════════════ */
/*  WebSocket Collaboration Manager          */
/* ══════════════════════════════════════════ */

export class WSCollabManager {
  // ── State ──
  private _status: WSConnectionStatus = 'disconnected';
  private _syncStatus: WSSyncStatus = 'offline';
  private _peers: Map<string, WSPeer> = new Map();
  private _fileLocks: Map<string, WSFileLock> = new Map();
  private _latency: number = 0;
  private _messageQueue: WSMessage[] = [];
  private _operationLog: WSEditOperation[] = [];

  // ── Handlers ──
  private _listeners: Map<string, Set<WSEventHandler>> = new Map();

  // ── Timers ──
  private _heartbeatInterval: number | null = null;
  private _reconnectTimeout: number | null = null;
  private _peerSimInterval: number | null = null;
  private _latencySimInterval: number | null = null;
  private _syncSimInterval: number | null = null;

  // ── Config ──
  private _reconnectAttempts = 0;
  private _maxReconnectAttempts = 5;
  private _heartbeatMs = 5000;
  private _reconnectDelayMs = 2000;

  // ── Local user ──
  private _localUser: { id: string; name: string; color: string } = {
    id: 'local-user',
    name: 'You',
    color: '#818cf8',
  };

  // ── Real WebSocket ──
  private _ws: WebSocket | null = null;
  private _realMode: boolean = false;
  private _serverUrl: string = '';

  /* ── Public getters ── */
  get status(): WSConnectionStatus {
    return this._status;
  }
  get syncStatus(): WSSyncStatus {
    return this._syncStatus;
  }
  get latency(): number {
    return this._latency;
  }
  get peers(): WSPeer[] {
    return Array.from(this._peers.values());
  }
  get onlinePeers(): WSPeer[] {
    return this.peers.filter((p) => p.online);
  }
  get fileLocks(): WSFileLock[] {
    return Array.from(this._fileLocks.values());
  }
  get operationLog(): WSEditOperation[] {
    return this._operationLog.slice(-50);
  }
  get queueSize(): number {
    return this._messageQueue.length;
  }
  get isRealMode(): boolean {
    return this._realMode;
  }
  get serverUrl(): string {
    return this._serverUrl;
  }

  /* ── Event system ── */
  on(event: string, handler: WSEventHandler) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event)!.add(handler);
  }

  off(event: string, handler: WSEventHandler) {
    this._listeners.get(event)?.delete(handler);
  }

  private emit(event: string, data: unknown = null) {
    this._listeners.get(event)?.forEach((fn) => fn(event, data));
    this._listeners.get('*')?.forEach((fn) => fn(event, data));
  }

  /* ── Connection lifecycle ── */
  async connect() {
    if (this._status === 'connected') return;

    // If real mode and we have a server URL, use real WebSocket
    if (this._realMode && this._serverUrl) {
      return this._connectRealWebSocket();
    }

    this._setStatus('connecting');

    // Simulate WebSocket handshake
    await this._simulateDelay(800 + Math.random() * 400);

    // 95% success rate
    if (Math.random() > 0.05) {
      this._setStatus('connected');
      this._setSyncStatus('synced');
      this._reconnectAttempts = 0;

      // Initialize peers
      DEMO_PEERS.forEach((p) => this._peers.set(p.id, { ...p }));
      this.emit('peers-updated', this.peers);

      // Start heartbeat
      this._startHeartbeat();
      // Start peer simulation
      this._startPeerSimulation();
      // Start latency simulation
      this._startLatencySimulation();
      // Start sync simulation
      this._startSyncSimulation();
      // Flush queued messages
      this._flushQueue();

      this.emit('connected', { latency: this._latency });
    } else {
      this._setStatus('disconnected');
      this.emit('connection-failed', { attempt: this._reconnectAttempts });
      this._scheduleReconnect();
    }
    return undefined;
  }

  disconnect() {
    // Close real WebSocket if active
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    this._setStatus('disconnected');
    this._setSyncStatus('offline');
    this._stopAllTimers();
    this._peers.clear();
    this._fileLocks.clear();
    this.emit('disconnected');
  }

  /* ── Cursor updates ── */
  updateCursor(file: string, line: number, col: number) {
    const msg: WSMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'cursor',
      senderId: this._localUser.id,
      payload: { userId: this._localUser.id, file, line, col },
      timestamp: Date.now(),
    };

    if (this._status === 'connected') {
      this._send(msg);
    } else {
      this._messageQueue.push(msg);
    }
  }

  /* ── Edit operations ── */
  broadcastEdit(
    file: string,
    type: 'insert' | 'delete' | 'replace',
    line: number,
    col: number,
    content: string
  ) {
    const op: WSEditOperation = {
      id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      file,
      userId: this._localUser.id,
      type,
      position: { line, col },
      content,
      timestamp: Date.now(),
    };

    this._operationLog.push(op);

    const msg: WSMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'edit',
      senderId: this._localUser.id,
      payload: op as unknown as Record<string, unknown>,
      timestamp: Date.now(),
    };

    if (this._status === 'connected') {
      this._send(msg);
      this._setSyncStatus('syncing');
      // Simulate sync completion
      setTimeout(
        () => {
          if (this._status === 'connected') {
            this._setSyncStatus('synced');
          }
        },
        200 + Math.random() * 300
      );
    } else {
      this._messageQueue.push(msg);
      this._setSyncStatus('offline');
    }
  }

  /* ── File locks ── */
  lockFile(file: string): boolean {
    if (this._fileLocks.has(file)) {
      this.emit('lock-failed', { file, reason: 'already-locked' });
      return false;
    }

    const lock: WSFileLock = {
      file,
      lockedBy: this._localUser.name,
      lockedAt: Date.now(),
    };
    this._fileLocks.set(file, lock);
    this.emit('file-locked', lock);
    return true;
  }

  unlockFile(file: string) {
    if (this._fileLocks.has(file)) {
      this._fileLocks.delete(file);
      this.emit('file-unlocked', { file });
    }
  }

  isFileLocked(file: string): WSFileLock | null {
    return this._fileLocks.get(file) || null;
  }

  /* ── Internal: Status setters ── */
  private _setStatus(status: WSConnectionStatus) {
    this._status = status;
    this.emit('status-changed', { status });
  }

  private _setSyncStatus(status: WSSyncStatus) {
    this._syncStatus = status;
    this.emit('sync-changed', { syncStatus: status });
  }

  /* ── Internal: Timers ── */
  private _startHeartbeat() {
    this._heartbeatInterval = window.setInterval(() => {
      if (this._status !== 'connected') return;
      this._send({
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'heartbeat',
        senderId: this._localUser.id,
        payload: { userId: this._localUser.id },
        timestamp: Date.now(),
      });
    }, this._heartbeatMs);
  }

  private _startPeerSimulation() {
    this._peerSimInterval = window.setInterval(() => {
      if (this._status !== 'connected') return;

      // Simulate cursor movements
      this._peers.forEach((peer, id) => {
        if (!peer.online || id === this._localUser.id) return;
        if (Math.random() < 0.25) {
          const file = DEMO_FILES[Math.floor(Math.random() * DEMO_FILES.length)];
          const line = Math.floor(Math.random() * 80) + 1;
          const col = Math.floor(Math.random() * 40) + 1;
          this._peers.set(id, { ...peer, file, cursor: { line, col }, lastSeen: Date.now() });
        }
      });

      // Simulate Carol going online/offline
      const carol = this._peers.get('peer-carol');
      if (carol && Math.random() < 0.1) {
        this._peers.set('peer-carol', { ...carol, online: !carol.online, lastSeen: Date.now() });
      }

      this.emit('peers-updated', this.peers);
    }, 3000);
  }

  private _startLatencySimulation() {
    this._latencySimInterval = window.setInterval(() => {
      // Simulate realistic latency between 12-85ms
      this._latency = Math.floor(12 + Math.random() * 73);
      this.emit('latency-updated', { latency: this._latency });

      // Rare spike (>200ms)
      if (Math.random() < 0.02) {
        this._latency = Math.floor(200 + Math.random() * 300);
        this.emit('latency-updated', { latency: this._latency });
      }
    }, 2000);
  }

  private _startSyncSimulation() {
    this._syncSimInterval = window.setInterval(() => {
      if (this._status !== 'connected') return;

      // Simulate rare conflict
      if (Math.random() < 0.005) {
        this._setSyncStatus('conflict');
        this.emit('conflict-detected', {
          file: DEMO_FILES[Math.floor(Math.random() * DEMO_FILES.length)],
          users: ['Alice', 'You'],
        });
        // Auto-resolve after 3s
        setTimeout(() => {
          if (this._syncStatus === 'conflict') {
            this._setSyncStatus('synced');
            this.emit('conflict-resolved');
          }
        }, 3000);
      }

      // Simulate brief syncing
      if (Math.random() < 0.08 && this._syncStatus === 'synced') {
        this._setSyncStatus('syncing');
        setTimeout(
          () => {
            if (this._status === 'connected') {
              this._setSyncStatus('synced');
            }
          },
          500 + Math.random() * 1000
        );
      }

      // Simulate rare disconnection + reconnection
      if (Math.random() < 0.003) {
        this._setStatus('reconnecting');
        this._setSyncStatus('offline');
        this.emit('connection-lost');

        setTimeout(
          () => {
            this._setStatus('connected');
            this._setSyncStatus('synced');
            this.emit('reconnected', { latency: this._latency });
          },
          2000 + Math.random() * 3000
        );
      }
    }, 5000);
  }

  private _stopAllTimers() {
    if (this._heartbeatInterval) window.clearInterval(this._heartbeatInterval);
    if (this._peerSimInterval) window.clearInterval(this._peerSimInterval);
    if (this._latencySimInterval) window.clearInterval(this._latencySimInterval);
    if (this._syncSimInterval) window.clearInterval(this._syncSimInterval);
    if (this._reconnectTimeout) window.clearTimeout(this._reconnectTimeout);
  }

  private _scheduleReconnect() {
    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      this._setStatus('disconnected');
      this.emit('max-reconnect-reached');
      return;
    }

    this._reconnectAttempts++;
    const delay = this._reconnectDelayMs * Math.pow(1.5, this._reconnectAttempts - 1);
    this._setStatus('reconnecting');

    this._reconnectTimeout = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  private _send(msg: WSMessage) {
    // Use real WebSocket if in real mode and connected
    if (this._realMode && this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(msg));
      return;
    }
    // Simulate network transmission in simulation mode
    // In production: ws.send(JSON.stringify(msg))
  }

  private _flushQueue() {
    while (this._messageQueue.length > 0) {
      const msg = this._messageQueue.shift()!;
      this._send(msg);
    }
    if (this._messageQueue.length === 0) {
      this._setSyncStatus('synced');
    }
  }

  private async _simulateDelay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* ── Cleanup ── */
  destroy() {
    this.disconnect();
    this._listeners.clear();
    this._messageQueue = [];
    this._operationLog = [];
  }

  /* ── Real WebSocket connection ── */
  async connectToServer(url: string): Promise<boolean> {
    this._serverUrl = url;
    this._realMode = true;
    this.disconnect();
    return this._connectRealWebSocket();
  }

  disconnectFromServer() {
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    this._realMode = false;
    this._serverUrl = '';
    this._setStatus('disconnected');
    this._setSyncStatus('offline');
    this._stopAllTimers();
    this._peers.clear();
    this.emit('disconnected');
  }

  setSimulatedMode() {
    this.disconnectFromServer();
    this._realMode = false;
    this.connect();
  }

  private async _connectRealWebSocket(): Promise<boolean> {
    return new Promise((resolve) => {
      this._setStatus('connecting');

      try {
        this._ws = new WebSocket(this._serverUrl);

        const timeout = window.setTimeout(() => {
          if (this._status === 'connecting') {
            this._ws?.close();
            this._setStatus('disconnected');
            this.emit('connection-failed', { reason: 'timeout' });
            resolve(false);
          }
        }, 5000);

        this._ws.onopen = () => {
          window.clearTimeout(timeout);
          this._setStatus('connected');
          this._setSyncStatus('synced');
          this._reconnectAttempts = 0;

          // Send initial presence
          this._ws?.send(
            JSON.stringify({
              type: 'presence',
              payload: {
                userId: this._localUser.id,
                name: this._localUser.name,
                color: this._localUser.color,
              },
              timestamp: Date.now(),
            })
          );

          this._startHeartbeat();
          this.emit('connected', { mode: 'real', url: this._serverUrl });
          resolve(true);
        };

        this._ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            this._handleRealMessage(msg);
          } catch {
            // ignore malformed messages
          }
        };

        this._ws.onclose = () => {
          window.clearTimeout(timeout);
          if (this._status === 'connected') {
            this._setStatus('reconnecting');
            this._setSyncStatus('offline');
            this.emit('connection-lost');
            this._scheduleReconnect();
          }
        };

        this._ws.onerror = () => {
          window.clearTimeout(timeout);
          this._setStatus('disconnected');
          this.emit('connection-failed', { reason: 'error' });
          resolve(false);
        };
      } catch {
        this._setStatus('disconnected');
        this.emit('connection-failed', { reason: 'exception' });
        resolve(false);
      }
    });
  }

  private _handleRealMessage(msg: WSMessage) {
    switch (msg.type) {
      case 'presence': {
        const p = msg.payload as unknown as WSPeer;
        if (p.id !== this._localUser.id) {
          this._peers.set(p.id, { ...p, online: true, lastSeen: Date.now() });
          this.emit('peers-updated', this.peers);
        }
        break;
      }
      case 'cursor': {
        const c = msg.payload as { userId: string; file: string; line: number; col: number };
        const peer = this._peers.get(c.userId);
        if (peer) {
          this._peers.set(c.userId, {
            ...peer,
            file: c.file,
            cursor: { line: c.line, col: c.col },
            lastSeen: Date.now(),
          });
          this.emit('peers-updated', this.peers);
        }
        break;
      }
      case 'edit': {
        const op = msg.payload as unknown as WSEditOperation;
        this._operationLog.push(op);
        this.emit('remote-edit', op);
        break;
      }
      case 'sync': {
        this._setSyncStatus((msg.payload as { status?: WSSyncStatus }).status || 'synced');
        break;
      }
      case 'conflict': {
        this._setSyncStatus('conflict');
        this.emit('conflict-detected', msg.payload);
        break;
      }
      case 'heartbeat': {
        // Measure latency from server response
        const sent = (msg.payload as { sentAt?: number }).sentAt;
        if (sent) {
          this._latency = Date.now() - sent;
          this.emit('latency-updated', { latency: this._latency });
        }
        break;
      }
    }
  }

  /* ── Public API for tests ── */
  isConnected(): boolean {
    return this._status === 'connected';
  }

  send(message: { type: string; data?: unknown }): void {
    const msg: WSMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: message.type as WSMessage['type'],
      senderId: this._localUser.id,
      payload: message.data as Record<string, unknown>,
      timestamp: Date.now(),
    };
    this._send(msg);
  }

  broadcast(message: { type: string; data?: unknown }): void {
    const msg: WSMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: message.type as WSMessage['type'],
      senderId: this._localUser.id,
      payload: message.data as Record<string, unknown>,
      timestamp: Date.now(),
    };
    this._send(msg);
  }

  getPeers(): WSPeer[] {
    return this.peers;
  }

  emitPublic(event: string, data: unknown): void {
    this.emit(event, data);
  }
}

/* ── Singleton export ── */
export const wsCollab = new WSCollabManager();
export default wsCollab;
