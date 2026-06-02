/**
 * @file CollabIndicator.tsx
 * @description YYC³便携式智能AI系统 - 协同状态指示器
 * Real-time collaboration status indicator with user presence
 * Features: Connection status, user avatars, cursor visualization
 * Open-source design: User-controlled, privacy-first
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,collaboration,status,indicator
 */

import {
  Users, Wifi, WifiOff, Loader2, Circle, Eye,
  MousePointer, Edit3, Clock, UserPlus, Copy
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { collabService, ConnectionStatus, CollabUser, UserPresence } from '../services/collab-service'
import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

interface CollabIndicatorProps {
  showUsers?: boolean
  showStatus?: boolean
  compact?: boolean
  onInvite?: () => void
}

export function CollabIndicator({
  showUsers = true,
  showStatus = true,
  compact = false,
  onInvite
}: CollabIndicatorProps) {
  const t = getThemeTokens(useAppStore(s => s.theme))
  const i = getI18n(useAppStore(s => s.language))

  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [users, setUsers] = useState<CollabUser[]>([])
  const [showUserList, setShowUserList] = useState(false)

  useEffect(() => {
    const unsubscribe = collabService.onConnectionChange((newStatus) => {
      setStatus(newStatus)
    })
    
    const checkStatus = () => {
      setStatus(collabService.getStatus())
      setUsers(collabService.getConnectedUsers())
    }

    checkStatus()
    const interval = setInterval(checkStatus, 1000)

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [])

  const statusConfig = useMemo(() => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="w-3.5 h-3.5" />,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          label: i.collabOnline || 'Online',
          pulse: false
        }
      case 'connecting':
      case 'syncing':
        return {
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          label: i.collabSyncing || 'Syncing',
          pulse: true
        }
      case 'error':
        return {
          icon: <WifiOff className="w-3.5 h-3.5" />,
          color: 'text-red-400',
          bg: 'bg-red-500/10',
          label: 'Error',
          pulse: false
        }
      default:
        return {
          icon: <WifiOff className="w-3.5 h-3.5" />,
          color: 'text-slate-400',
          bg: 'bg-slate-500/10',
          label: i.collabOffline || 'Offline',
          pulse: false
        }
    }
  }, [status, i])

  const presenceIcon = useCallback((presence: UserPresence) => {
    switch (presence) {
      case 'typing':
        return <Edit3 className="w-3 h-3 text-green-400" />
      case 'viewing':
        return <Eye className="w-3 h-3 text-blue-400" />
      case 'idle':
        return <Clock className="w-3 h-3 text-amber-400" />
      default:
        return <Circle className="w-3 h-3 text-emerald-400 fill-current" />
    }
  }, [])

  const handleInvite = useCallback(() => {
    const roomName = collabService.getRoomName()
    if (roomName) {
      const inviteLink = `${window.location.origin}?room=${roomName}`
      navigator.clipboard.writeText(inviteLink)
      toast.success(i.collabInviteSent || 'Invite link copied')
    }
    onInvite?.()
  }, [i, onInvite])

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${statusConfig.bg} ${statusConfig.color}`}>
          {statusConfig.icon}
          {!showStatus && <span className="text-[10px]">{users.length}</span>}
        </div>
        {showUsers && users.length > 0 && (
          <div className="flex -space-x-2">
            {users.slice(0, 3).map(user => (
              <div
                key={user.id}
                className="w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] text-white"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {users.length > 3 && (
              <div className={`w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] ${t.isDark ? 'bg-slate-700 text-white' : 'bg-slate-300 text-slate-700'}`}>
                  +{users.length - 3}
                </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${t.isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
        {showStatus && (
          <div className="flex items-center gap-2">
            <div className={`relative ${statusConfig.color}`}>
              {statusConfig.icon}
              {statusConfig.pulse && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              )}
            </div>
            <span className={`text-[11px] ${statusConfig.color}`}>{statusConfig.label}</span>
          </div>
        )}

        {showUsers && (
          <div className="flex items-center gap-2">
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={() => setShowUserList(!showUserList)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Users className={`w-3.5 h-3.5 ${t.text.muted}`} />
              <span className={`text-[11px] ${t.text.secondary}`}>{users.length + 1}</span>
            </button>

            <div className="flex -space-x-2">
              {users.slice(0, 4).map(user => (
                <motion.div
                  key={user.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative group"
                >
                  <div
                    className="w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center text-[11px] text-white cursor-pointer"
                    style={{ backgroundColor: user.color }}
                    title={user.name}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    {presenceIcon(user.presence)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleInvite}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] ${t.isDark ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'} transition-colors`}
        >
          <UserPlus className="w-3 h-3" />
          {i.collabInvite || 'Invite'}
        </button>
      </div>

      <AnimatePresence>
        {showUserList && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute top-full right-0 mt-2 w-64 rounded-xl overflow-hidden ${t.isDark ? 'bg-slate-800 border border-white/10' : 'bg-white border border-slate-200'} shadow-xl z-50`}
          >
            <div className={`px-4 py-3 border-b ${t.isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <h3 className="text-[13px]" style={{ fontWeight: 600 }}>{i.collabUsers || 'Users'} ({users.length + 1})</h3>
            </div>

            <div className="max-h-64 overflow-y-auto">
              <div className={`flex items-center gap-3 px-4 py-2 ${t.isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] text-white"
                  style={{ backgroundColor: collabService.getCurrentUser()?.color || '#6366f1' }}
                >
                  {collabService.getCurrentUser()?.name?.charAt(0).toUpperCase() || 'Y'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px]" style={{ fontWeight: 500 }}>
                    {collabService.getCurrentUser()?.name || 'You'}
                    <span className={`ml-1.5 text-[9px] px-1 py-0.5 rounded ${t.isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                      {i.collabOwner || 'You'}
                    </span>
                  </div>
                  <div className={`text-[10px] ${t.text.muted}`}>{i.collabEditing || 'Editing'}</div>
                </div>
              </div>

              {users.map(user => (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 px-4 py-2 hover:${t.isDark ? 'bg-white/[0.04]' : 'bg-slate-50'} transition-colors`}
                >
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] text-white"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      {presenceIcon(user.presence)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px]" style={{ fontWeight: 500 }}>{user.name}</div>
                    <div className={`text-[10px] ${t.text.muted} flex items-center gap-1`}>
                      {user.currentFile ? (
                        <span className="truncate">{user.currentFile}</span>
                      ) : (
                        <span>{user.presence}</span>
                      )}
                    </div>
                  </div>
                  {user.cursor && (
                    <div className={`flex items-center gap-1 text-[10px] ${t.text.dimmed}`}>
                      <MousePointer className="w-3 h-3" />
                      <span>L{user.cursor.line}</span>
                    </div>
                  )}
                </div>
              ))}

              {users.length === 0 && (
                <div className={`flex flex-col items-center justify-center py-8 ${t.text.dimmed}`}>
                  <Users className="w-6 h-6 opacity-30 mb-2" />
                  <span className="text-[11px]">{i.collabInvite || 'Invite collaborators'}</span>
                </div>
              )}
            </div>

            <div className={`px-4 py-2 border-t ${t.isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <button
                onClick={handleInvite}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {i.collabInviteLink || 'Copy Invite Link'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CollabIndicator
