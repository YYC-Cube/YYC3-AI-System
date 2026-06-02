/**
 * file: Header.tsx
 * description: 顶部导航栏 - 包含全局按钮、图标和导航功能
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-03-19
 * updated: 2026-04-01
 * status: active
 * tags: [component],[header],[navigation],[ui]
 *
 * brief: 顶部导航栏，提供全局导航和功能入口
 *
 * details:
 * - 顶部导航栏布局
 * - 全局按钮和图标功能
 * - 弹出框和对话框支持
 * - Toast通知功能
 * - 国际化支持
 *
 * dependencies: React, React Router, Lucide React, Sonner
 * exports: Header
 * notes: 需要在布局组件中使用
 */

import {
  Folder, Bell, Settings, Github, Share, Rocket,
  User, Zap, ChevronDown, Palette, Languages,
  Plus, Trash2, ExternalLink, Link, Copy,
  Mail, Cloud, CheckCircle, GitBranch,
  Terminal, Play, TestTube, Search, Globe,
  Brain, Activity, Gauge,
  PenTool, FlaskConical, BookOpen, Keyboard,
  Pencil, GitFork, Code2,
  Puzzle, Wifi, BarChart3,
  AppWindow, Box, TableProperties, Sparkles, Layers,
  Download, Upload, FolderPlus, HardDrive, Database, LayoutGrid, Users, CheckSquare
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { useWindowManagerStore } from '../services/multi-instance'
import { useTaskStore } from '../services/task-store'
import { useAppStore } from '../store'
import { getI18n, resolveKey } from '../utils/i18n'
import { getThemeTokens, THEME_PRESETS } from '../utils/theme'

const logoImg = '/yyc3-icons/Web App/favicon-32.png'

export function Header() {
  const {
    theme, setTheme, openThemeCustomizer, collaborators,
    language, toggleLanguage, recentProjects, addProject, removeProject,
    toggleTerminal,
    setShortcutsDialogOpen,
    setSearchPanelOpen, setNotificationCenterOpen,
    setAiCodeIntelOpen, setActivityTimelineOpen, setPerformanceMonitorOpen
  } = useAppStore()
  const navigate = useNavigate()
  const [showUserPanel, setShowUserPanel] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const [showGithub, setShowGithub] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showDeploy, setShowDeploy] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const closeAll = () => {
    setShowProjects(false)
    setShowGithub(false)
    setShowShare(false)
    setShowDeploy(false)
    setShowQuickActions(false)
    setShowNotifications(false)
    setShowUserPanel(false)
    setShowThemePicker(false)
  }

  const togglePanel = (setter: (v: boolean) => void, current: boolean) => {
    closeAll()
    setter(!current)
  }

  const [notifications, setNotifications] = useState([
    { id: '1', textKey: 'notifAutoSaved' as const, time: '2m', read: false },
    { id: '2', textKey: 'notifAiConnected' as const, time: '5m', read: false },
    { id: '3', textKey: 'notifBuildComplete' as const, time: '15m', read: true },
    { id: '4', textKey: 'notifUpdateAvailable' as const, time: '1h', read: true },
  ])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success(i.toastMarkAllRead)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  // Include unread task reminders in badge count
  const taskReminders = useTaskStore(s => s.reminders)
  const unreadTaskReminders = taskReminders.filter(r => r.isTriggered && !r.isRead).length
  const [taskReminderEventCount, setTaskReminderEventCount] = useState(0)

  useEffect(() => {
    const handler = () => setTaskReminderEventCount(prev => prev + 1)
    window.addEventListener('task-reminder', handler)
    return () => window.removeEventListener('task-reminder', handler)
  }, [])

  const totalBadge = unreadCount + unreadTaskReminders + taskReminderEventCount

  // Multi-instance count badge
  const instanceCount = useWindowManagerStore(s => s.instances.length)

  // Header icon definitions with full actions
  const headerIcons = [
    {
      icon: Folder, label: i.projects, shortcut: 'Ctrl+Shift+P',
      onClick: () => togglePanel(setShowProjects, showProjects),
      active: showProjects
    },
    {
      icon: Bell, label: i.notifications, shortcut: 'Ctrl+Shift+N',
      onClick: () => { closeAll(); setNotificationCenterOpen(true); setTaskReminderEventCount(0); useTaskStore.getState().markAllTriggeredRemindersRead() },
      badge: totalBadge > 0 ? totalBadge : undefined
    },
    {
      icon: Settings, label: i.settings, shortcut: 'Ctrl+,',
      onClick: () => { closeAll(); navigate('/settings') }
    },
    {
      icon: Github, label: i.github, shortcut: 'Ctrl+Shift+G',
      onClick: () => { closeAll(); useAppStore.getState().setGitPanelOpen(true) },
    },
    {
      icon: Share, label: i.share, shortcut: 'Ctrl+Shift+S',
      onClick: () => togglePanel(setShowShare, showShare),
      active: showShare
    },
    {
      icon: Rocket, label: i.deploy, shortcut: 'Ctrl+Shift+D',
      onClick: () => togglePanel(setShowDeploy, showDeploy),
      active: showDeploy
    },
    {
      icon: Zap, label: i.quickActions, shortcut: 'Ctrl+Shift+Q',
      onClick: () => togglePanel(setShowQuickActions, showQuickActions),
      active: showQuickActions
    },
    {
      icon: Layers, label: i.miTitle || 'Multi-Instance', shortcut: 'Ctrl+Shift+I',
      onClick: () => { closeAll(); useAppStore.getState().setMultiInstancePanelOpen(true) },
      badge: instanceCount > 1 ? instanceCount : undefined
    },
  ]

  const popoverClass = `absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`

  return (
    <header className={`h-12 flex items-center justify-between px-4 border-b sticky top-0 z-50 ${t.transition} ${t.border.medium} ${t.surface.glassHeader}`}>
      {/* Left: Logo + Project Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/')}
          className={`flex items-center justify-center w-8 h-8 rounded-lg ${t.transition} overflow-hidden`}
          title={i.home}
        >
          <img src={logoImg} alt="YYC3" className="w-8 h-8 object-contain" />
        </button>
        <div className="flex items-center space-x-2">
          <span className="text-[13px] tracking-tight" style={{ fontWeight: 600 }}>{i.brandName}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.accent.badge}`} style={{ fontWeight: 500 }}>YYC3</span>
        </div>
      </div>

      {/* Right: Action Icons + Language + Theme + Collaborators + User */}
      <div className="flex items-center space-x-1">
        {headerIcons.map(({ icon: Icon, label, shortcut, onClick, active, badge }) => (
          <div key={label} className="relative">
            <button
              onClick={onClick}
              className={`p-1.5 rounded-lg ${t.transition} ${active ? t.interactive.iconActive : t.interactive.headerBtn}`}
              aria-label={label}
              title={shortcut ? `${label} (${shortcut})` : label}
            >
              <Icon className="w-4 h-4" />
              {badge !== undefined && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center" style={{ fontWeight: 700 }}>
                  {badge}
                </span>
              )}
            </button>
          </div>
        ))}

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.headerBtn}`}
          aria-label={i.language}
          title={`${i.language} (Ctrl+Shift+L)`}
        >
          <Languages className="w-4 h-4" />
        </button>

        {/* Theme Picker */}
        <div className="relative">
          <button
            onClick={() => togglePanel(setShowThemePicker, showThemePicker)}
            className={`p-1.5 rounded-lg ${t.transition} ${showThemePicker ? t.interactive.iconActive : t.interactive.headerBtn}`}
            aria-label={i.themeSwitch}
            title={i.themeSwitch}
          >
            <Palette className="w-4 h-4" />
          </button>

          {showThemePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={closeAll} />
              <div className={`${popoverClass} w-48 p-1.5`}>
                <div className={`px-3 py-1.5 text-[10px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>
                  {i.selectTheme}
                </div>
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => { setTheme(preset.id); closeAll() }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${
                      theme === preset.id
                        ? `${t.accent.activeBg} ${t.accent.activeText}`
                        : t.interactive.menuItem
                    }`}
                    style={{ fontWeight: theme === preset.id ? 500 : 400 }}
                  >
                    <span className="text-[14px]">{preset.icon}</span>
                    <span>{resolveKey(i, preset.labelKey)}</span>
                    <div className="ml-auto w-3 h-3 rounded-full border" style={{ backgroundColor: preset.accent, borderColor: preset.accent + '60' }} />
                  </button>
                ))}
                <div className={`my-1 h-px mx-2 ${t.border.divider}`} />
                <button
                  onClick={() => { closeAll(); openThemeCustomizer() }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
                  style={{ fontWeight: 400 }}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>{i.themeCustomize}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Collaborators Presence */}
        <div className="flex items-center -space-x-1.5 ml-1">
          {collaborators.filter(c => c.online).map(c => (
            <div key={c.id}
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] text-white"
              style={{ backgroundColor: c.color, borderColor: t.isDark ? '#0f172a' : '#f8fafc', fontWeight: 600 }}
              title={`${c.name} — ${c.cursor ? `${i.editing} ${c.cursor.file} ${i.lineNumber.replace('{n}', String(c.cursor.line))}` : i.idle}`}>
              {c.name[0]}
            </div>
          ))}
          {collaborators.filter(c => !c.online).length > 0 && (
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] ${t.isDark ? 'bg-slate-700 text-slate-400 border-slate-900' : 'bg-slate-200 text-slate-500 border-white'}`}
              title={i.offlineCount.replace('{n}', String(collaborators.filter(c => !c.online).length))}>
              +{collaborators.filter(c => !c.online).length}
            </div>
          )}
        </div>

        <div className={`w-px h-4 mx-1 ${t.border.dividerV}`} />

        {/* User Avatar */}
        <div className="relative">
          <button
            onClick={() => togglePanel(setShowUserPanel, showUserPanel)}
            className={`flex items-center space-x-1.5 p-1 rounded-lg ${t.transition} ${t.isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-200/30'}`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white">
              <User className="w-3.5 h-3.5" />
            </div>
            <ChevronDown className={`w-3 h-3 ${t.transition} ${showUserPanel ? 'rotate-180' : ''} ${t.text.muted}`} />
          </button>

          {showUserPanel && (
            <>
              <div className="fixed inset-0 z-40" onClick={closeAll} />
              <div className={`${popoverClass} w-56`}>
                <div className="p-4 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[13px]" style={{ fontWeight: 600 }}>YYC3 Developer</p>
                    <div className="flex items-center space-x-1.5">
                      <div className={`w-2 h-2 rounded-full ${t.status.online}`} />
                      <span className={`text-[11px] ${t.status.success}`} style={{ fontWeight: 500 }}>{i.online}</span>
                    </div>
                  </div>
                </div>
                <div className={`border-t ${t.border.subtle}`}>
                  {[
                    { label: i.preferences, icon: Settings, action: () => { navigate('/settings'); closeAll() } },
                    { label: i.shortcuts, icon: Keyboard, action: () => { setShortcutsDialogOpen(true); closeAll() } },
                    { label: i.language, icon: Globe, action: () => { toggleLanguage(); closeAll() } },
                    { label: i.profile, icon: User, action: () => { toast.info(i.featureComingSoon); closeAll() } },
                  ].map(({ label, icon: Icon, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className={`w-full flex items-center space-x-3 px-4 py-2.5 text-[13px] ${t.transition} ${t.interactive.menuItem}`}
                      style={{ fontWeight: 400 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Popover Panels (positioned absolute from header) ── */}

      {/* Projects Panel */}
      {showProjects && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeAll} />
          <div className={`fixed right-48 top-14 w-80 rounded-xl overflow-hidden z-50 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}>
            <div className={`px-4 py-3 border-b ${t.border.subtle} flex items-center justify-between`}>
              <span className="text-[13px]" style={{ fontWeight: 600 }}>{i.projects}</span>
              <button
                onClick={() => {
                  addProject({
                    name: `New Project ${Date.now() % 1000}`,
                    description: i.newProject,
                    updatedAt: Date.now(),
                    status: 'draft',
                    color: ['#6366f1', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)]
                  })
                  toast.success(i.toastProjectCreated)
                }}
                className={`p-1 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
                title={i.createProject}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto space-y-0.5">
              {recentProjects.map(p => (
                <div key={p.id} className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${t.transition} ${t.interactive.menuItem} group`}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: p.color + '20' }}>
                    <Folder className="w-3.5 h-3.5" style={{ color: p.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] truncate" style={{ fontWeight: 500 }}>{p.name}</p>
                    <p className={`text-[10px] ${t.text.dimmed}`}>{resolveKey(i, p.description)}</p>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate('/ide'); closeAll() }}
                      className={`p-1 rounded ${t.interactive.hoverBg}`}
                      title={i.openProject}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeProject(p.id)
                        toast.success(i.toastProjectDeleted)
                      }}
                      className="p-1 rounded hover:bg-red-500/10"
                      title={i.deleteProject}
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeAll} />
          <div className={`fixed right-52 top-14 w-80 rounded-xl overflow-hidden z-50 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}>
            <div className={`px-4 py-3 border-b ${t.border.subtle} flex items-center justify-between`}>
              <div className="flex items-center space-x-2">
                <span className="text-[13px]" style={{ fontWeight: 600 }}>{i.notifications}</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px]" style={{ fontWeight: 600 }}>{unreadCount}</span>
                )}
              </div>
              <button onClick={markAllRead} className={`text-[11px] ${t.accent.primary} hover:underline`} style={{ fontWeight: 500 }}>
                {i.toastMarkAllRead}
              </button>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto space-y-0.5">
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${t.transition} ${t.interactive.menuItem}`}
                >
                  <div className="flex items-center space-x-2.5">
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />}
                    <span className={`text-[12px] ${n.read ? t.text.muted : t.text.secondary}`}>{i[n.textKey]}</span>
                  </div>
                  <span className={`text-[10px] flex-shrink-0 ml-2 ${t.text.dimmed}`}>{n.time}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* GitHub Panel */}
      {showGithub && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeAll} />
          <div className={`fixed right-36 top-14 w-64 rounded-xl overflow-hidden z-50 p-1.5 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}>
            <div className={`px-3 py-1.5 text-[10px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>GitHub</div>
            {[
              { label: i.githubConnect, icon: Github, action: () => toast.success(i.toastGithubConnected) },
              { label: i.githubClone, icon: Download, action: () => toast.info(i.toastCloneDialogOpened) },
              { label: i.githubPush, icon: Upload, action: () => toast.success(i.toastCodePushed) },
              { label: i.githubPull, icon: Download, action: () => toast.success(i.toastCodePulled) },
              { label: i.githubRepo, icon: ExternalLink, action: () => toast.info(i.toastRepoOpened) },
            ].map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                onClick={() => { action(); closeAll() }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
                style={{ fontWeight: 400 }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Share Panel */}
      {showShare && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeAll} />
          <div className={`fixed right-28 top-14 w-64 rounded-xl overflow-hidden z-50 p-1.5 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}>
            <div className={`px-3 py-1.5 text-[10px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.share}</div>
            {[
              { label: i.shareCopyLink, icon: Link, action: () => { navigator.clipboard.writeText('https://yyc3.app/project/demo'); toast.success(i.toastLinkCopied) } },
              { label: i.shareInvite, icon: Mail, action: () => toast.info(i.toastInviteSent) },
              { label: i.shareExport, icon: Download, action: () => toast.success(i.toastExportedZip) },
              { label: i.shareEmbedCode, icon: Copy, action: () => { navigator.clipboard.writeText('<iframe src="https://yyc3.app/embed/demo"></iframe>'); toast.success(i.toastEmbedCopied) } },
            ].map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                onClick={() => { action(); closeAll() }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
                style={{ fontWeight: 400 }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Deploy Panel */}
      {showDeploy && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeAll} />
          <div className={`fixed right-20 top-14 w-64 rounded-xl overflow-hidden z-50 p-1.5 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}>
            <div className={`px-3 py-1.5 text-[10px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.deploy}</div>
            {[
              { label: i.deployPreview, icon: Cloud, status: '✓', action: () => toast.success(i.toastPreviewDeploy) },
              { label: i.deployProduction, icon: Rocket, status: '', action: () => toast.info(i.toastProductionDeploy) },
              { label: i.deployStatus, icon: CheckCircle, status: '', action: () => toast.info(i.toastDeployReady) },
            ].map(({ label, icon: Icon, status, action }) => (
              <button
                key={label}
                onClick={() => { action(); closeAll() }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
                style={{ fontWeight: 400 }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="flex-1 text-left">{label}</span>
                {status && <span className="text-emerald-400 text-[10px]">{status}</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Quick Actions Panel */}
      {showQuickActions && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeAll} />
          <div className={`fixed right-12 top-14 w-56 rounded-xl overflow-hidden z-50 p-1.5 max-h-[70vh] overflow-y-auto ${t.surface.popover} ${t.border.popover} ${t.shadow.popover} ${t.scrollbar}`}>
            <div className={`px-3 py-1.5 text-[10px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.quickActions}</div>
            {[
              { label: i.newProject, icon: FolderPlus, shortcut: '', action: () => { addProject({ name: `Project ${Date.now() % 1000}`, description: i.newProject, updatedAt: Date.now(), status: 'draft', color: '#6366f1' }); toast.success(i.toastProjectCreated) } },
              { label: i.openTerminal, icon: Terminal, shortcut: 'Ctrl+Shift+T', action: () => { toggleTerminal(); navigate('/ide') } },
              { label: i.runBuild, icon: Play, shortcut: '', action: () => toast.success(i.toastBuildStarted) },
              { label: i.runTests, icon: TestTube, shortcut: '', action: () => toast.info(i.toastTestsRunning) },
              { label: i.gitCommit, icon: GitBranch, shortcut: '', action: () => toast.success(i.toastAllCommitted) },
              { label: i.search, icon: Search, shortcut: 'Ctrl+Shift+F', action: () => { setSearchPanelOpen(true); navigate('/ide') } },
              { label: i.shortcuts, icon: Keyboard, shortcut: '', action: () => setShortcutsDialogOpen(true) },
              { label: i.aciTitle, icon: Brain, shortcut: '', action: () => { setAiCodeIntelOpen(true); navigate('/ide') } },
              { label: i.gpTitle, icon: GitBranch, shortcut: 'Ctrl+Shift+G', action: () => { useAppStore.getState().setGitPanelOpen(true); navigate('/ide') } },
              { label: i.atTitle, icon: Activity, shortcut: '', action: () => { setActivityTimelineOpen(true); navigate('/ide') } },
              { label: i.pmTitle, icon: Gauge, shortcut: '', action: () => { setPerformanceMonitorOpen(true); navigate('/ide') } },
              { label: i.erTitle, icon: PenTool, shortcut: '', action: () => { useAppStore.getState().setErDiagramOpen(true); navigate('/ide') } },
              { label: i.apiTitle, icon: FlaskConical, shortcut: '', action: () => { useAppStore.getState().setApiTesterOpen(true); navigate('/ide') } },
              { label: i.dgTitle, icon: BookOpen, shortcut: '', action: () => { useAppStore.getState().setDocGeneratorOpen(true); navigate('/ide') } },
              { label: i.wmTitle, icon: HardDrive, shortcut: '', action: () => { useAppStore.getState().setWorkspaceManagerOpen(true); navigate('/ide') } },
              { label: i.dbTitle, icon: Database, shortcut: '', action: () => { useAppStore.getState().setDatabaseManagerOpen(true); navigate('/ide') } },
              { label: i.lmTitle, icon: LayoutGrid, shortcut: '', action: () => { useAppStore.getState().setLayoutManagerOpen(true); navigate('/ide') } },
              { label: i.wbTitle, icon: Pencil, shortcut: '', action: () => { useAppStore.getState().setWhiteboardOpen(true); navigate('/ide') } },
              { label: i.dpTitle, icon: GitFork, shortcut: '', action: () => { useAppStore.getState().setDependencyGraphOpen(true); navigate('/ide') } },
              { label: i.snTitle, icon: Code2, shortcut: '', action: () => { useAppStore.getState().setSnippetManagerOpen(true); navigate('/ide') } },
              { label: i.plTitle, icon: Puzzle, shortcut: '', action: () => { useAppStore.getState().setPluginSystemOpen(true); navigate('/ide') } },
              { label: i.swTitle, icon: Wifi, shortcut: '', action: () => { useAppStore.getState().setOfflineCacheOpen(true); navigate('/ide') } },
              { label: i.sdTitle, icon: BarChart3, shortcut: '', action: () => { useAppStore.getState().setSystemDashboardOpen(true); navigate('/ide') } },
              { label: i.tmTitle, icon: Palette, shortcut: '', action: () => { useAppStore.getState().setThemeManagerOpen(true); navigate('/ide') } },
              { label: i.mwTitle, icon: AppWindow, shortcut: '', action: () => { useAppStore.getState().setMultiWindowOpen(true); navigate('/ide') } },
              { label: i.rcTitle, icon: Users, shortcut: 'Ctrl+Alt+R', action: () => { useAppStore.getState().setRealtimeCollabEnhancedOpen(true); navigate('/ide') } },
              { label: i.sbTitle, icon: Box, shortcut: 'Ctrl+Alt+S', action: () => { useAppStore.getState().setCodeSandboxOpen(true); navigate('/ide') } },
              { label: i.vqTitle, icon: TableProperties, shortcut: 'Ctrl+Alt+Q', action: () => { useAppStore.getState().setVisualQueryBuilderOpen(true); navigate('/ide') } },
            ].map(({ label, icon: Icon, shortcut, action }) => (
              <button
                key={label}
                onClick={() => { action(); closeAll() }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
                style={{ fontWeight: 400 }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="flex-1 text-left">{label}</span>
                {shortcut && <span className={`text-[9px] ${t.text.dimmed}`}>{shortcut}</span>}
              </button>
            ))}
            {/* AI Quick Actions Panel Launcher */}
            <div className={`border-t my-1 ${t.isDark ? 'border-white/5' : 'border-slate-200/50'}`} />
            <button
              onClick={() => { useAppStore.getState().setTaskBoardOpen(true); navigate('/ide'); closeAll() }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 text-[12px] rounded-lg ${t.transition} ${t.isDark ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}
              style={{ fontWeight: 500 }}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="flex-1 text-left">{i.tbTitle || 'AI Task Board'}</span>
            </button>
            <button
              onClick={() => { useAppStore.getState().setQuickActionsPanelOpen(true); navigate('/ide'); closeAll() }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 text-[12px] rounded-lg ${t.transition} ${t.isDark ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'}`}
              style={{ fontWeight: 500 }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="flex-1 text-left">{i.qaTitle || 'AI Quick Actions'}</span>
              <span className={`text-[9px] ${t.text.dimmed}`}>Ctrl+Shift+Q</span>
            </button>
          </div>
        </>
      )}
    </header>
  )
}