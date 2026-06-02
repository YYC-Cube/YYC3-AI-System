/**
 * @file CollabStatusBar.tsx
 * @description YYC³便携式智能AI系统 - 协作状态指示器
 * Collaboration Status Indicator
 * Shows WebSocket connection status, sync state, peer count, latency,
 * file locks, and AI completion toggle in editor status bar.
 * Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,collaboration,status,websocket
 */

import {
  Wifi, WifiOff, RefreshCw, Cloud, CloudOff,
  Users, Sparkles,
  AlertTriangle, Loader2, Zap
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'
import { wsCollab, type WSConnectionStatus, type WSSyncStatus, type WSPeer } from '../utils/ws-collab'


export function CollabStatusBar() {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const [connStatus, setConnStatus] = useState<WSConnectionStatus>('disconnected')
  const [syncStatus, setSyncStatus] = useState<WSSyncStatus>('offline')
  const [latency, setLatency] = useState(0)
  const [peerCount, setPeerCount] = useState(0)
  const [aiCompletionOn, setAiCompletionOn] = useState(true)

  useEffect(() => {
    const handleAll = (event: string, data: unknown) => {
      const d = data as Record<string, unknown> | null
      switch (event) {
        case 'status-changed':
          setConnStatus(d?.status as WSConnectionStatus)
          break
        case 'sync-changed':
          setSyncStatus(d?.syncStatus as WSSyncStatus)
          break
        case 'latency-updated':
          setLatency(d?.latency as number)
          break
        case 'peers-updated': {
          const peers = data as WSPeer[]
          setPeerCount(peers.filter(p => p.online).length)
          break
        }
        case 'conflict-detected':
          toast.warning(`${i.wsConflict}: ${(d?.file as string) || ''}`)
          break
        case 'conflict-resolved':
          toast.success(i.wsResolved)
          break
        case 'connection-lost':
          toast.error(i.wsDisconnected)
          break
        case 'reconnected':
          toast.success(i.wsConnected)
          break
      }
    }

    wsCollab.on('*', handleAll)

    // Auto-connect on mount
    if (wsCollab.status === 'disconnected') {
      wsCollab.connect()
    } else {
      setConnStatus(wsCollab.status)
      setSyncStatus(wsCollab.syncStatus)
      setLatency(wsCollab.latency)
      setPeerCount(wsCollab.onlinePeers.length)
    }

    return () => {
      wsCollab.off('*', handleAll)
    }
  }, [i])

  const handleReconnect = useCallback(() => {
    wsCollab.disconnect()
    wsCollab.connect()
  }, [])

  const toggleAiCompletion = useCallback(() => {
    const next = !aiCompletionOn
    setAiCompletionOn(next)
    toast.info(next ? i.aicEnabled : i.aicDisabled)
  }, [aiCompletionOn, i])

  /* ── Connection status indicator ── */
  const connIcon = (() => {
    switch (connStatus) {
      case 'connected': return <Wifi className={`w-3 h-3 ${t.isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
      case 'connecting': return <Loader2 className={`w-3 h-3 animate-spin ${t.isDark ? 'text-amber-400' : 'text-amber-500'}`} />
      case 'reconnecting': return <RefreshCw className={`w-3 h-3 animate-spin ${t.isDark ? 'text-amber-400' : 'text-amber-500'}`} />
      case 'disconnected': return <WifiOff className={`w-3 h-3 ${t.isDark ? 'text-red-400' : 'text-red-500'}`} />
    }
  })()

  const connLabel = (() => {
    switch (connStatus) {
      case 'connected': return i.wsConnected
      case 'connecting': return i.wsConnecting
      case 'reconnecting': return i.wsReconnecting
      case 'disconnected': return i.wsDisconnected
    }
  })()

  /* ── Sync status indicator ── */
  const syncIcon = (() => {
    switch (syncStatus) {
      case 'synced': return <Cloud className={`w-3 h-3 ${t.isDark ? 'text-emerald-400/50' : 'text-emerald-600/50'}`} />
      case 'syncing': return <RefreshCw className={`w-3 h-3 animate-spin ${t.isDark ? 'text-blue-400/60' : 'text-blue-500/60'}`} />
      case 'conflict': return <AlertTriangle className={`w-3 h-3 ${t.isDark ? 'text-amber-400' : 'text-amber-500'}`} />
      case 'offline': return <CloudOff className={`w-3 h-3 ${t.isDark ? 'text-slate-500' : 'text-slate-400'}`} />
    }
  })()

  const syncLabel = (() => {
    switch (syncStatus) {
      case 'synced': return i.wsSynced
      case 'syncing': return i.wsSyncing
      case 'conflict': return i.wsConflict
      case 'offline': return i.wsOffline
    }
  })()

  /* ── Latency color ── */
  const latencyColor = latency < 50
    ? t.isDark ? 'text-emerald-400/50' : 'text-emerald-600/50'
    : latency < 150
      ? t.isDark ? 'text-amber-400/50' : 'text-amber-500/50'
      : t.isDark ? 'text-red-400/50' : 'text-red-500/50'

  return (
    <div className="flex items-center gap-3">
      {/* Connection status */}
      <button
        onClick={connStatus === 'disconnected' ? handleReconnect : undefined}
        className={`flex items-center gap-1 ${connStatus === 'disconnected' ? 'cursor-pointer' : 'cursor-default'}`}
        title={connLabel}
      >
        {connIcon}
        <span className={`text-[9px] ${t.text.dimmed}`}>{connLabel}</span>
      </button>

      {/* Sync status */}
      <div className="flex items-center gap-1" title={`${i.wsSyncStatus}: ${syncLabel}`}>
        {syncIcon}
        <span className={`text-[9px] ${t.text.dimmed}`}>{syncLabel}</span>
      </div>

      {/* Peers */}
      {connStatus === 'connected' && (
        <div className="flex items-center gap-1" title={`${i.wsPeers}: ${peerCount}`}>
          <Users className={`w-3 h-3 ${t.isDark ? 'text-indigo-400/50' : 'text-indigo-500/50'}`} />
          <span className={`text-[9px] ${t.text.dimmed}`}>{peerCount}</span>
        </div>
      )}

      {/* Latency */}
      {connStatus === 'connected' && (
        <div className="flex items-center gap-1" title={`${i.wsLatency}: ${latency}ms`}>
          <Zap className={`w-3 h-3 ${latencyColor}`} />
          <span className={`text-[9px] ${latencyColor}`}>{latency}ms</span>
        </div>
      )}

      {/* AI Completion toggle */}
      <button
        onClick={toggleAiCompletion}
        className={`flex items-center gap-1 px-1 py-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
        title={i.aicToggle}
      >
        <Sparkles className={`w-3 h-3 ${aiCompletionOn
          ? (t.isDark ? 'text-violet-400' : 'text-violet-500')
          : t.text.dimmed
        }`} />
        <span className={`text-[9px] ${aiCompletionOn
          ? (t.isDark ? 'text-violet-400/70' : 'text-violet-500/70')
          : t.text.dimmed
        }`}>{i.aicProviderLabel}</span>
      </button>
    </div>
  )
}
