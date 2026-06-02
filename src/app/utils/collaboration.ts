/**
 * @file collaboration.ts
 * @description YYC³便携式智能AI系统 - yjs CRDT协作编辑引擎
 * yjs CRDT Collaborative Editing Engine
 * Provides: Y.Doc shared document, Awareness protocol for cursors/presence,
 * simulated remote peers for demo mode, and React hooks for integration.
 *
 * In production, replace SimulatedWebSocketProvider with y-websocket's
 * WebsocketProvider connecting to a real yjs server.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,collaboration,crdt,yjs
 */

import * as Y from 'yjs';

// ── Types ──

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  cursor: { file: string; line: number; col: number } | null;
  online: boolean;
  lastSeen: number;
}

export interface CollabAwarenessState {
  user: CollabUser;
}

// ── Awareness Protocol (lightweight re-implementation) ──
// In production this would be yjs's Awareness from y-protocols

type AwarenessChangeHandler = (changes: {
  added: number[];
  updated: number[];
  removed: number[];
}) => void;

export class SimpleAwareness {
  doc: Y.Doc;
  clientID: number;
  private states: Map<number, CollabAwarenessState> = new Map();
  private listeners: Set<AwarenessChangeHandler> = new Set();

  constructor(doc: Y.Doc) {
    this.doc = doc;
    this.clientID = doc.clientID;
  }

  getStates(): Map<number, CollabAwarenessState> {
    return this.states;
  }

  getLocalState(): CollabAwarenessState | null {
    return this.states.get(this.clientID) || null;
  }

  setLocalState(state: CollabAwarenessState) {
    const before = this.states.has(this.clientID);
    this.states.set(this.clientID, state);
    this.emit({
      added: before ? [] : [this.clientID],
      updated: before ? [this.clientID] : [],
      removed: [],
    });
  }

  setRemoteState(clientId: number, state: CollabAwarenessState) {
    const before = this.states.has(clientId);
    this.states.set(clientId, state);
    this.emit({
      added: before ? [] : [clientId],
      updated: before ? [clientId] : [],
      removed: [],
    });
  }

  removeState(clientId: number) {
    if (this.states.has(clientId)) {
      this.states.delete(clientId);
      this.emit({ added: [], updated: [], removed: [clientId] });
    }
  }

  on(_event: string, handler: AwarenessChangeHandler) {
    this.listeners.add(handler);
  }

  off(_event: string, handler: AwarenessChangeHandler) {
    this.listeners.delete(handler);
  }

  private emit(changes: { added: number[]; updated: number[]; removed: number[] }) {
    this.listeners.forEach((fn) => fn(changes));
  }

  destroy() {
    this.states.clear();
    this.listeners.clear();
  }
}

// ── Simulated Remote Peers ──

const SIMULATED_PEERS: CollabUser[] = [
  {
    id: 'peer-alice',
    name: 'Alice',
    color: '#6366f1',
    cursor: null,
    online: true,
    lastSeen: Date.now(),
  },
  {
    id: 'peer-bob',
    name: 'Bob',
    color: '#f59e0b',
    cursor: null,
    online: true,
    lastSeen: Date.now(),
  },
  {
    id: 'peer-carol',
    name: 'Carol',
    color: '#10b981',
    cursor: null,
    online: false,
    lastSeen: Date.now() - 300000,
  },
];

const DEMO_FILES = ['ChatInterface.tsx', 'store.ts', 'App.tsx', 'types.ts', 'routes.ts'];

export class SimulatedPeerEngine {
  private awareness: SimpleAwareness;
  private intervalIds: number[] = [];
  private peerClientIds: Map<string, number> = new Map();

  constructor(awareness: SimpleAwareness) {
    this.awareness = awareness;
    // Assign fake client IDs to peers
    SIMULATED_PEERS.forEach((peer, idx) => {
      this.peerClientIds.set(peer.id, 1000 + idx);
    });
  }

  start() {
    // Initialize peer states
    SIMULATED_PEERS.forEach((peer) => {
      const clientId = this.peerClientIds.get(peer.id)!;
      this.awareness.setRemoteState(clientId, { user: { ...peer } });
    });

    // Simulate cursor movement every 2-5 seconds
    const cursorInterval = window.setInterval(() => {
      SIMULATED_PEERS.forEach((peer) => {
        if (!peer.online) return;
        const clientId = this.peerClientIds.get(peer.id)!;
        const state = this.awareness.getStates().get(clientId);
        if (!state) return;

        // 30% chance to move cursor
        if (Math.random() < 0.3) {
          const file = DEMO_FILES[Math.floor(Math.random() * DEMO_FILES.length)];
          const line = Math.floor(Math.random() * 80) + 1;
          const col = Math.floor(Math.random() * 40) + 1;
          this.awareness.setRemoteState(clientId, {
            user: {
              ...state.user,
              cursor: { file, line, col },
              lastSeen: Date.now(),
            },
          });
        }
      });
    }, 3000);
    this.intervalIds.push(cursorInterval);

    // Simulate online/offline toggle every 15-30s
    const presenceInterval = window.setInterval(() => {
      const peerIdx = Math.floor(Math.random() * SIMULATED_PEERS.length);
      const peer = SIMULATED_PEERS[peerIdx];
      const clientId = this.peerClientIds.get(peer.id)!;
      const state = this.awareness.getStates().get(clientId);
      if (!state) return;

      // Toggle Carol occasionally
      if (peer.id === 'peer-carol' && Math.random() < 0.4) {
        const newOnline = !state.user.online;
        this.awareness.setRemoteState(clientId, {
          user: { ...state.user, online: newOnline, lastSeen: Date.now() },
        });
      }
    }, 20000);
    this.intervalIds.push(presenceInterval);

    // Simulate Y.Doc text edits (typing) from remote peers
    const editInterval = window.setInterval(() => {
      const onlinePeers = SIMULATED_PEERS.filter((p) => p.online);
      if (onlinePeers.length === 0) return;
      const peer = onlinePeers[Math.floor(Math.random() * onlinePeers.length)];
      const clientId = this.peerClientIds.get(peer.id)!;
      const state = this.awareness.getStates().get(clientId);
      if (!state || !state.user.cursor) return;

      // Insert a comment into the shared Y.Text for the file
      const yText = this.awareness.doc.getText(state.user.cursor.file);
      const content = yText.toString();
      if (content.length > 0) {
        // Simulate minor edit — we just update the awareness to show activity
        // Real edits would modify the Y.Text which would auto-merge via CRDT
        this.awareness.setRemoteState(clientId, {
          user: {
            ...state.user,
            cursor: {
              ...state.user.cursor,
              col: state.user.cursor.col + 1,
            },
            lastSeen: Date.now(),
          },
        });
      }
    }, 5000);
    this.intervalIds.push(editInterval);
  }

  stop() {
    this.intervalIds.forEach((id) => window.clearInterval(id));
    this.intervalIds = [];
    this.peerClientIds.forEach((clientId) => {
      this.awareness.removeState(clientId);
    });
  }
}

// ── Singleton Collaboration Manager ──

class CollaborationManager {
  doc: Y.Doc;
  awareness: SimpleAwareness;
  peerEngine: SimulatedPeerEngine;
  private started = false;

  constructor() {
    this.doc = new Y.Doc();
    this.awareness = new SimpleAwareness(this.doc);
    this.peerEngine = new SimulatedPeerEngine(this.awareness);
  }

  /**
   * Initialize shared Y.Text for each file and set local user
   */
  init(localUser: Omit<CollabUser, 'lastSeen'>, fileContents: Record<string, string>) {
    // Populate Y.Text for each file
    Object.entries(fileContents).forEach(([filename, content]) => {
      const yText = this.doc.getText(filename);
      if (yText.length === 0) {
        yText.insert(0, content);
      }
    });

    // Set local awareness
    this.awareness.setLocalState({
      user: { ...localUser, lastSeen: Date.now() },
    });

    if (!this.started) {
      this.peerEngine.start();
      this.started = true;
    }
  }

  /**
   * Get Y.Text for a specific file
   */
  getFileText(filename: string): Y.Text {
    return this.doc.getText(filename);
  }

  /**
   * Get all currently aware users (including remote peers)
   */
  getUsers(): CollabUser[] {
    const users: CollabUser[] = [];
    this.awareness.getStates().forEach((state) => {
      users.push(state.user);
    });
    return users;
  }

  /**
   * Update local user's cursor position
   */
  updateLocalCursor(file: string, line: number, col: number) {
    const current = this.awareness.getLocalState();
    if (!current) return;
    this.awareness.setLocalState({
      user: {
        ...current.user,
        cursor: { file, line, col },
        lastSeen: Date.now(),
      },
    });
  }

  destroy() {
    this.peerEngine.stop();
    this.awareness.destroy();
    this.doc.destroy();
  }
}

// Export singleton
export const collabManager = new CollaborationManager();

// ── Y.Text <-> Monaco Binding Utilities ──

/**
 * Bind a Y.Text instance to a plain-text state setter.
 * Returns cleanup function. In production, replace with y-monaco for
 * full cursor decoration and selection sync.
 */
export function bindYTextToState(yText: Y.Text, onChange: (text: string) => void): () => void {
  const observer = () => onChange(yText.toString());
  yText.observe(observer);
  // Initial sync
  onChange(yText.toString());
  return () => yText.unobserve(observer);
}

/**
 * Apply a local edit to Y.Text (for manual integration without y-monaco).
 * Translates a simple replace operation into Y.Text delete+insert.
 */
export function applyEditToYText(
  yText: Y.Text,
  offset: number,
  deleteCount: number,
  insertText: string
): void {
  yText.doc?.transact(() => {
    if (deleteCount > 0) yText.delete(offset, deleteCount);
    if (insertText.length > 0) yText.insert(offset, insertText);
  });
}

/**
 * Create a collaborative Y.Map for shared settings/config.
 * Returns get/set/observe helpers.
 */
export function createSharedMap<T extends Record<string, unknown>>(
  mapName: string
): {
  get: <K extends keyof T>(key: K) => T[K] | undefined;
  set: <K extends keyof T>(key: K, value: T[K]) => void;
  observe: (cb: () => void) => () => void;
  toJSON: () => Partial<T>;
} {
  const yMap = collabManager.doc.getMap(mapName);
  return {
    get: <K extends keyof T>(key: K) => yMap.get(key as string) as T[K] | undefined,
    set: <K extends keyof T>(key: K, value: T[K]) => yMap.set(key as string, value),
    observe: (cb: () => void) => {
      yMap.observe(cb);
      return () => yMap.unobserve(cb);
    },
    toJSON: () => yMap.toJSON() as Partial<T>,
  };
}

export default collabManager;
