/**
 * @file collab-service.ts
 * @description YYC³便携式智能AI系统 - 协同编辑服务
 * Real-time collaboration service with Yjs CRDT
 * Features: Presence awareness, cursor tracking, conflict resolution
 * Open-source design: User-controlled WebSocket server, no data collection
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,collaboration,realtime,yjs,crdt
 */

import * as Y from 'yjs'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error'
export type UserPresence = 'active' | 'idle' | 'typing' | 'viewing' | 'away'

export interface CollabUser {
  id: string
  name: string
  email?: string
  avatar?: string
  color: string
  presence: UserPresence
  cursor?: { line: number; column: number }
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } }
  lastActive: number
  currentFile?: string
}

export interface CollabConfig {
  serverUrl: string
  roomName: string
  userId: string
  userName: string
  userColor?: string
  onConnectionChange?: (status: ConnectionStatus) => void
  onUserJoin?: (user: CollabUser) => void
  onUserLeave?: (userId: string) => void
  onUserUpdate?: (user: CollabUser) => void
  onSync?: (state: unknown) => void
  onError?: (error: Error) => void
}

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FFD700'
]

function generateColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
}

export class CollabService {
  private doc: Y.Doc | null = null
  private ws: WebSocket | null = null
  private config: CollabConfig | null = null
  private status: ConnectionStatus = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private idleTimeout: ReturnType<typeof setTimeout> | null = null
  private currentUser: CollabUser | null = null
  private connectionCallbacks: Set<(status: ConnectionStatus) => void> = new Set()
  private users: Map<string, CollabUser> = new Map()

  onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionCallbacks.add(callback)
    return () => this.connectionCallbacks.delete(callback)
  }

  private notifyConnectionChange(status: ConnectionStatus): void {
    this.connectionCallbacks.forEach(cb => cb(status))
    this.config?.onConnectionChange?.(status)
  }

  async connect(config: CollabConfig): Promise<boolean> {
    if (this.ws) {
      await this.disconnect()
    }

    this.config = config
    this.status = 'connecting'
    this.notifyConnectionChange(this.status)

    try {
      this.doc = new Y.Doc()

      this.currentUser = {
        id: config.userId,
        name: config.userName,
        color: config.userColor || generateColor(),
        presence: 'active',
        lastActive: Date.now(),
      }

      const wsUrl = config.serverUrl.replace(/^http/, 'ws')
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.status = 'connected'
        this.reconnectAttempts = 0
        this.notifyConnectionChange(this.status)

        this.ws?.send(JSON.stringify({
          type: 'join',
          room: config.roomName,
          user: this.currentUser
        }))
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (e) {
          console.error('Failed to parse message:', e)
        }
      }

      this.ws.onclose = () => {
        this.status = 'disconnected'
        this.notifyConnectionChange(this.status)
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.status = 'error'
        this.notifyConnectionChange(this.status)
        this.config?.onError?.(new Error('WebSocket connection failed'))
      }

      this.startHeartbeat()
      this.startIdleDetection()

      return true
    } catch (error) {
      console.error('Collab connection failed:', error)
      this.status = 'error'
      this.notifyConnectionChange(this.status)
      this.config?.onError?.(error as Error)
      return false
    }
  }

  private handleMessage(data: { type: string; user?: CollabUser; userId?: string; state?: unknown }): void {
    switch (data.type) {
      case 'user-joined':
        if (data.user) {
          this.users.set(data.user.id, data.user)
          this.config?.onUserJoin?.(data.user)
        }
        break
      case 'user-left':
        if (data.userId) {
          const user = this.users.get(data.userId)
          this.users.delete(data.userId)
          if (user) this.config?.onUserLeave?.(data.userId)
        }
        break
      case 'user-update':
        if (data.user) {
          this.users.set(data.user.id, data.user)
          this.config?.onUserUpdate?.(data.user)
        }
        break
      case 'sync':
        if (data.state) {
          this.config?.onSync?.(data.state)
        }
        break
    }
  }

  async disconnect(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout)
      this.idleTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    if (this.doc) {
      this.doc.destroy()
      this.doc = null
    }

    this.users.clear()
    this.status = 'disconnected'
    this.notifyConnectionChange(this.status)
    this.config = null
    this.currentUser = null
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      this.status = 'error'
      this.notifyConnectionChange(this.status)
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      if (this.config && this.status === 'disconnected') {
        this.connect(this.config)
      }
    }, delay)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentUser) {
        this.ws.send(JSON.stringify({
          type: 'heartbeat',
          userId: this.currentUser.id
        }))
      }
    }, 30000)
  }

  private startIdleDetection(): void {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']

    const resetIdle = () => {
      if (this.idleTimeout) {
        clearTimeout(this.idleTimeout)
      }

      this.updatePresence('active')

      this.idleTimeout = setTimeout(() => {
        this.updatePresence('idle')
      }, 60000)
    }

    events.forEach(event => {
      document.addEventListener(event, resetIdle, { passive: true })
    })

    resetIdle()
  }

  updatePresence(presence: UserPresence): void {
    if (!this.currentUser) return

    this.currentUser.presence = presence
    this.currentUser.lastActive = Date.now()

    this.broadcastUpdate()
  }

  updateCursor(line: number, column: number): void {
    if (!this.currentUser) return

    this.currentUser.cursor = { line, column }
    this.currentUser.lastActive = Date.now()

    this.broadcastUpdate()
  }

  updateSelection(start: { line: number; column: number }, end: { line: number; column: number }): void {
    if (!this.currentUser) return

    this.currentUser.selection = { start, end }
    this.currentUser.lastActive = Date.now()

    this.broadcastUpdate()
  }

  updateCurrentFile(filePath: string): void {
    if (!this.currentUser) return

    this.currentUser.currentFile = filePath
    this.currentUser.lastActive = Date.now()

    this.broadcastUpdate()
  }

  private broadcastUpdate(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentUser) {
      this.ws.send(JSON.stringify({
        type: 'user-update',
        user: this.currentUser
      }))
    }
  }

  getConnectedUsers(): CollabUser[] {
    return Array.from(this.users.values())
  }

  getText(name: string): Y.Text | null {
    if (!this.doc) return null
    return this.doc.getText(name)
  }

  getMap(name: string): Y.Map<unknown> | null {
    if (!this.doc) return null
    return this.doc.getMap(name)
  }

  getArray(name: string): Y.Array<unknown> | null {
    if (!this.doc) return null
    return this.doc.getArray(name)
  }

  transact(fn: () => void): void {
    if (!this.doc) return
    this.doc.transact(fn)
  }

  observeText(name: string, callback: (event: Y.YTextEvent) => void): (() => void) | null {
    const text = this.getText(name)
    if (!text) return null

    const observer = (event: Y.YTextEvent) => callback(event)
    text.observe(observer)

    return () => text.unobserve(observer)
  }

  observeMap(name: string, callback: (event: Y.YMapEvent<unknown>) => void): (() => void) | null {
    const map = this.getMap(name)
    if (!map) return null

    const observer = (event: Y.YMapEvent<unknown>) => callback(event)
    map.observe(observer)

    return () => map.unobserve(observer)
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  isConnected(): boolean {
    return this.status === 'connected' || this.status === 'syncing'
  }

  getCurrentUser(): CollabUser | null {
    return this.currentUser
  }

  getRoomName(): string | null {
    return this.config?.roomName || null
  }
}

export const collabService = new CollabService()

export function createCollabService(): CollabService {
  return new CollabService()
}
