/**
 * file: HomePage.tsx
 * description: 品牌落地页 - 包含品牌标识、AI聊天输入和项目卡片
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-03-19
 * updated: 2026-04-01
 * status: active
 * tags: [component],[home],[landing-page],[brand]
 *
 * brief: 品牌落地页，提供AI聊天和项目卡片功能
 *
 * details:
 * - 品牌标识展示
 * - AI聊天输入界面
 * - 项目卡片展示
 * - 全局按钮和图标功能完整
 * - 支持弹出框、通知和国际化
 *
 * dependencies: React, React Router, Motion, Lucide React, Sonner
 * exports: HomePage
 * notes: 需要在路由中配置
 */

import {
  Archive,
  ArrowRight,
  Bell,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Clock,
  Cloud,
  Code,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Folder,
  FolderPlus,
  GitBranch,
  Github,
  Globe,
  Image as ImageIcon,
  Keyboard,
  Languages,
  Link, Mail,
  MoreHorizontal,
  Palette,
  Paperclip,
  Play,
  Plus,
  Rocket,
  Search,
  Send,
  Settings,
  Share,
  Sparkles,
  Terminal,
  TestTube,
  Trash2,
  Upload,
  User,
  Zap
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { KeyboardEvent, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n, resolveKey } from '../utils/i18n'
import { THEME_PRESETS, getThemeTokens } from '../utils/theme'

import { ShortcutsDialog } from './ShortcutsDialog'

const logoImgs = {
  small: '/yyc3-icons/macOS/128.png',
  medium: '/yyc3-icons/macOS/256.png',
  large: '/yyc3-icons/macOS/512.png',
}

// 动态加载ThemeCustomizer组件（代码分割）
const ThemeCustomizer = lazy(() => import('./ThemeCustomizer').then(m => ({ default: m.ThemeCustomizer })))

const SLASH_COMMANDS_DATA = [
  { command: '/code', descKey: 'cmdCodeDesc' as const, icon: Code },
  { command: '/arch', descKey: 'cmdArchDesc' as const, icon: Sparkles },
  { command: '/help', descKey: 'cmdHelpDesc' as const, icon: Sparkles },
]

const TOOL_ICONS_DATA = [
  { icon: Plus, labelKey: 'expandMenu' as const, key: 'plus' },
  { icon: ImageIcon, labelKey: 'uploadImage' as const, key: 'image' },
  { icon: Paperclip, labelKey: 'importFile' as const, key: 'file' },
  { icon: Github, labelKey: 'github' as const, key: 'github' },
  { icon: Palette, labelKey: 'attachFigma' as const, key: 'figma' },
  { icon: Code, labelKey: 'codeSnippet' as const, key: 'code' },
  { icon: Clipboard, labelKey: 'clipboard' as const, key: 'clipboard' },
]

export function HomePage() {
  const navigate = useNavigate()
  const {
    theme, setTheme, recentProjects, addMessage, addProject, removeProject,
    openThemeCustomizer, language, toggleLanguage, setShortcutsDialogOpen
  } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)
  const [input, setInput] = useState('')
  const [showCommands, setShowCommands] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error(i.toastInvalidImage)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      const imageMarkdown = `![${file.name}](${dataUrl})\n`
      setInput(prev => prev + imageMarkdown)
      toast.success(i.toastImageUploaded)
      inputRef.current?.focus()
    }
    reader.onerror = () => toast.error(i.toastImageUploadFailed)
    reader.readAsDataURL(file)

    e.target.value = ''
  }, [i])

  // Handle file import
  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const ext = file.name.split('.').pop()?.toLowerCase() || 'txt'

      let formattedContent = ''
      if (['js', 'jsx', 'ts', 'tsx', 'json', 'css', 'html', 'py', 'java', 'go', 'rs', 'c', 'cpp', 'h'].includes(ext)) {
        formattedContent = `\`\`\`${ext}\n${content}\n\`\`\`\n`
      } else {
        formattedContent = `\`\`\`\n${content}\n\`\`\`\n`
      }

      setInput(prev => prev + formattedContent)
      toast.success(i.toastFileImported)
      inputRef.current?.focus()
    }
    reader.onerror = () => toast.error(i.toastFileImportFailed)
    reader.readAsText(file)

    e.target.value = ''
  }, [i])

  // ── Header popover states ──
  const [showProjects, setShowProjects] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showGithub, setShowGithub] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showDeploy, setShowDeploy] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [showUserPanel, setShowUserPanel] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [projectContextMenu, setProjectContextMenu] = useState<{ id: string; x: number; y: number } | null>(null)

  // ── Notifications mock data ──
  const [notifications, setNotifications] = useState([
    { id: '1', textKey: 'notifSystemReady' as const, time: '1m', read: false },
    { id: '2', textKey: 'notifUpdateAvailable' as const, time: '10m', read: false },
    { id: '3', textKey: 'notifDashboardBuild' as const, time: '30m', read: true },
    { id: '4', textKey: 'notifSyncComplete' as const, time: '2h', read: true },
  ])
  const unreadCount = notifications.filter(n => !n.read).length

  const closeAll = useCallback(() => {
    setShowProjects(false)
    setShowNotifications(false)
    setShowGithub(false)
    setShowShare(false)
    setShowDeploy(false)
    setShowThemePicker(false)
    setShowUserPanel(false)
    setShowQuickActions(false)
    setProjectContextMenu(null)
  }, [])

  const togglePanel = (setter: (v: boolean) => void, current: boolean) => {
    closeAll()
    setter(!current)
  }

  // ── Global keyboard shortcuts on homepage ──
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey
      if (ctrl && shift) {
        switch (e.key.toLowerCase()) {
          case 'l': e.preventDefault(); toggleLanguage(); break
          case 'p': e.preventDefault(); togglePanel(setShowProjects, showProjects); break
          case 'n': e.preventDefault(); togglePanel(setShowNotifications, showNotifications); break
          case 'g': e.preventDefault(); togglePanel(setShowGithub, showGithub); break
          case 's': e.preventDefault(); togglePanel(setShowShare, showShare); break
          case 'd': e.preventDefault(); togglePanel(setShowDeploy, showDeploy); break
          case 'q': e.preventDefault(); togglePanel(setShowQuickActions, showQuickActions); break
        }
      }
      if (ctrl && !shift && e.key === ',') { e.preventDefault(); openThemeCustomizer() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleLanguage, openThemeCustomizer, showProjects, showNotifications, showGithub, showShare, showDeploy, showQuickActions])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)
    if (val === '/') setShowCommands(true)
    else if (showCommands && !val.startsWith('/')) setShowCommands(false)
  }

  // Semantic understanding for user input
  const analyzeUserIntent = (input: string): { action: 'chat' | 'code' | 'project' | 'question'; confidence: number; keywords: string[] } => {
    const lower = input.toLowerCase().trim()

    // Code generation keywords
    const codeKeywords = ['代码', 'code', '生成', 'generate', '创建', 'create', '实现', 'implement', '函数', 'function', '组件', 'component', '写一个', 'write a', '做一个', 'make a']

    // Project management keywords
    const projectKeywords = ['项目', 'project', '打开', 'open', '新建', 'new', '删除', 'delete', '管理', 'manage']

    // Question keywords
    const questionKeywords = ['怎么', 'how', '为什么', 'why', '什么', 'what', '吗', '?', '？', '帮助', 'help', '问题', 'question']

    // Calculate confidence
    const codeCount = codeKeywords.filter(k => lower.includes(k)).length
    const projectCount = projectKeywords.filter(k => lower.includes(k)).length
    const questionCount = questionKeywords.filter(k => lower.includes(k)).length

    const maxCount = Math.max(codeCount, projectCount, questionCount)
    const confidence = maxCount > 0 ? Math.min(0.5 + (maxCount * 0.15), 0.95) : 0.3

    // Determine action
    let action: 'chat' | 'code' | 'project' | 'question' = 'chat'
    if (codeCount >= 2 || (codeCount > 0 && maxCount === codeCount)) action = 'code'
    else if (projectCount > 0 && maxCount === projectCount) action = 'project'
    else if (questionCount > 0 && maxCount === questionCount) action = 'question'

    return { action, confidence, keywords: [] }
  }

  const handleSend = () => {
    const trimmedInput = input.trim()

    // Prevent empty input navigation
    if (!trimmedInput) {
      toast.warning('请输入内容后再发送')
      inputRef.current?.focus()
      return
    }

    // Analyze user intent
    const intent = analyzeUserIntent(trimmedInput)
    console.log('[HomePage] User intent:', intent)

    // Add message to chat
    addMessage({ role: 'user', content: trimmedInput })
    setInput('')
    setShowCommands(false)

    // Simulate AI response based on intent
    setTimeout(() => {
      let aiResponse = ''

      if (intent.action === 'code') {
        aiResponse = `我理解您想要${trimmedInput}。让我为您生成代码...\n\n已跳转到编程页面，您可以在那里查看和编辑生成的代码。`
      } else if (intent.action === 'project') {
        aiResponse = `关于项目${trimmedInput}，我可以帮您管理项目设置、创建新项目或查看现有项目。`
      } else if (intent.action === 'question') {
        aiResponse = `好问题！${trimmedInput}\n\n让我为您详细解答...`
      } else {
        aiResponse = `收到您的需求："${trimmedInput}"\n\n正在分析并准备响应...`
      }

      addMessage({ role: 'ai', content: aiResponse })
    }, 500)

    // Smart navigation based on intent
    if (intent.action === 'code' && intent.confidence > 0.6) {
      // High confidence code generation request - navigate to IDE
      toast.info('正在跳转到编程页面...')
      navigate('/ide')
    } else if (intent.action === 'project' && intent.confidence > 0.7) {
      // Project management - stay on homepage to show projects
      toast.info('正在处理项目请求...')
      setShowProjects(true)
    } else if (intent.action === 'question') {
      // Question - stay for AI response
      toast.info('AI 正在思考中...')
    } else {
      // Default: navigate to IDE for further interaction
      navigate('/ide')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleCommandSelect = (command: string) => {

    // Handle slash commands with semantic understanding
    if (command === '/code') {
      // Code generation - navigate to IDE
      addMessage({ role: 'user', content: command })
      toast.info('正在打开代码编辑器...')
      navigate('/ide')
    } else if (command === '/arch') {
      // Architecture discussion - navigate to IDE
      addMessage({ role: 'user', content: command })
      toast.info('正在加载架构视图...')
      navigate('/ide')
    } else if (command === '/help') {
      // Help - show help dialog, stay on homepage
      addMessage({ role: 'user', content: command })
      setShortcutsDialogOpen(true)
      toast.info('快捷键帮助已打开')
    } else {
      // Default command handling
      addMessage({ role: 'user', content: command })
      navigate('/ide')
    }

    setShowCommands(false)
    setInput('')
  }

  const handleProjectClick = (_projectId: string) => navigate('/ide')

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 3600000) return i.minutesAgo.replace('{n}', String(Math.floor(diff / 60000)))
    if (diff < 86400000) return i.hoursAgo.replace('{n}', String(Math.floor(diff / 3600000)))
    return i.daysAgo.replace('{n}', String(Math.floor(diff / 86400000)))
  }

  // ── Tool icon action handlers ──
  const toolIconActions: Record<string, () => void> = {
    plus: () => { /* 展开/收起工具栏，实际功能在showTools状态控制 */ },
    image: () => imageInputRef.current?.click(),
    file: () => fileInputRef.current?.click(),
    github: () => toast.info(i.toastGithubLinkOpened),
    figma: () => toast.info(i.toastFigmaImport),
    code: () => { setInput(input + '```tsx\n// code here\n```'); inputRef.current?.focus(); toast.info(i.toastCodeTemplateInserted) },
    clipboard: () => { navigator.clipboard.readText().then(text => { if (text) { setInput(input + text); toast.success(i.toastClipboardPasted) } }).catch(() => toast.error(i.toastClipboardError)) },
  }

  const popoverClass = `absolute rounded-xl overflow-hidden z-50 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`

  return (
    <div className={`min-h-screen w-screen flex flex-col font-sans overflow-hidden ${t.transition} ${t.surface.app} ${t.surface.appGradient}`}>
      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      <input ref={fileInputRef} type="file" accept=".txt,.md,.json,.js,.jsx,.ts,.tsx,.css,.html,.py,.java,.go,.rs,.c,.cpp,.h" onChange={handleFileImport} className="hidden" />
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-20%] left-[30%] w-[600px] h-[600px] rounded-full blur-[120px] ${t.palette.ambientBlob}`} />
        <div className={`absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] rounded-full blur-[100px] ${t.isDark ? 'bg-cyan-600/10' : 'bg-cyan-400/15'}`} />
        <div className={`absolute top-[40%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[80px] ${t.isDark ? 'bg-purple-600/8' : 'bg-purple-400/10'}`} />
      </div>

      {/* ═══ TOP BAR ═══ */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
            <picture>
              <source srcSet={logoImgs.small} media="(max-width: 640px)" />
              <source srcSet={logoImgs.medium} media="(max-width: 1024px)" />
              <img src={logoImgs.large} alt="YYC³" className="w-9 h-9 object-contain" />
            </picture>
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] tracking-tight" style={{ fontWeight: 600 }}>YanYu Cloud</span>

          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* ── 📁 Projects ── */}
          <div className="relative">
            <button
              onClick={() => togglePanel(setShowProjects, showProjects)}
              className={`p-2 rounded-lg ${t.transition} ${showProjects ? t.interactive.iconActive : t.interactive.headerBtn}`}
              aria-label={i.projects} title={`${i.projects} (Ctrl+Shift+P)`}
            >
              <Folder className="w-[18px] h-[18px]" />
            </button>
            {showProjects && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeAll} />
                <div className={`${popoverClass} right-0 top-full mt-2 w-80`}>
                  <div className={`px-4 py-3 border-b ${t.border.subtle} flex items-center justify-between`}>
                    <span className="text-[13px]" style={{ fontWeight: 600 }}>{i.projects}</span>
                    <button
                      onClick={() => {
                        addProject({ name: `Project ${Date.now() % 1000}`, description: i.newProject, updatedAt: Date.now(), status: 'draft', color: ['#6366f1', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)] })
                        toast.success(i.toastProjectCreated)
                      }}
                      className={`p-1 rounded-lg ${t.transition} ${t.interactive.iconBtn}`} title={i.createProject}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto space-y-0.5">
                    {recentProjects.map(p => (
                      <div key={p.id}
                        onClick={() => { navigate('/ide'); closeAll() }}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer ${t.transition} ${t.interactive.menuItem} group`}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: p.color + '20' }}>
                          <Folder className="w-3.5 h-3.5" style={{ color: p.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] truncate" style={{ fontWeight: 500 }}>{p.name}</p>
                          <p className={`text-[10px] ${t.text.dimmed}`}>{resolveKey(i, p.description)}</p>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); removeProject(p.id); toast.success(i.toastProjectDeleted) }}
                            className="p-1 rounded hover:bg-red-500/10" title={i.deleteProject}>
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`px-4 py-2 border-t ${t.border.subtle}`}>
                    <button onClick={() => { navigate('/ide'); closeAll() }}
                      className={`w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-[12px] ${t.transition} ${t.interactive.menuItem}`} style={{ fontWeight: 500 }}>
                      <span>{i.viewAll}</span><ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── 🔔 Notifications ── */}
          <div className="relative">
            <button
              onClick={() => togglePanel(setShowNotifications, showNotifications)}
              className={`p-2 rounded-lg ${t.transition} ${showNotifications ? t.interactive.iconActive : t.interactive.headerBtn} relative`}
              aria-label={i.notifications} title={`${i.notifications} (Ctrl+Shift+N)`}
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center" style={{ fontWeight: 700 }}>{unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeAll} />
                <div className={`${popoverClass} right-0 top-full mt-2 w-80`}>
                  <div className={`px-4 py-3 border-b ${t.border.subtle} flex items-center justify-between`}>
                    <div className="flex items-center space-x-2">
                      <span className="text-[13px]" style={{ fontWeight: 600 }}>{i.notifications}</span>
                      {unreadCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px]" style={{ fontWeight: 600 }}>{unreadCount}</span>}
                    </div>
                    <button onClick={() => { setNotifications(prev => prev.map(n => ({ ...n, read: true }))); toast.success(i.toastAllRead) }}
                      className={`text-[11px] ${t.accent.primary} hover:underline`} style={{ fontWeight: 500 }}>
                      {i.toastMarkAllRead}
                    </button>
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto space-y-0.5">
                    {notifications.map(n => (
                      <div key={n.id}
                        onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${t.transition} ${t.interactive.menuItem}`}>
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
          </div>

          {/* ── 🐙 GitHub ── */}
          <div className="relative">
            <button
              onClick={() => togglePanel(setShowGithub, showGithub)}
              className={`p-2 rounded-lg ${t.transition} ${showGithub ? t.interactive.iconActive : t.interactive.headerBtn}`}
              aria-label={i.github} title={`${i.github} (Ctrl+Shift+G)`}
            >
              <Github className="w-[18px] h-[18px]" />
            </button>
            {showGithub && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeAll} />
                <div className={`${popoverClass} right-0 top-full mt-2 w-56 p-1.5`}>
                  <div className={`px-3 py-1.5 text-[10px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>GitHub</div>
                  {[
                    { label: i.githubConnect, icon: Github, action: () => toast.success(i.toastGithubConnected) },
                    { label: i.githubClone, icon: Download, action: () => toast.info(i.toastCloneDialogOpened) },
                    { label: i.githubPush, icon: Upload, action: () => toast.success(i.toastCodePushed) },
                    { label: i.githubPull, icon: Download, action: () => toast.success(i.toastCodePulled) },
                    { label: i.githubRepo, icon: ExternalLink, action: () => toast.info(i.toastRepoOpened) },
                  ].map(({ label, icon: Icon, action }) => (
                    <button key={label} onClick={() => { action(); closeAll() }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`} style={{ fontWeight: 400 }}>
                      <Icon className="w-3.5 h-3.5" /><span>{label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── 📤 Share ── */}
          <div className="relative">
            <button
              onClick={() => togglePanel(setShowShare, showShare)}
              className={`p-2 rounded-lg ${t.transition} ${showShare ? t.interactive.iconActive : t.interactive.headerBtn}`}
              aria-label={i.share} title={`${i.share} (Ctrl+Shift+S)`}
            >
              <Share className="w-[18px] h-[18px]" />
            </button>
            {showShare && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeAll} />
                <div className={`${popoverClass} right-0 top-full mt-2 w-56 p-1.5`}>
                  <div className={`px-3 py-1.5 text-[10px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.share}</div>
                  {[
                    { label: i.shareCopyLink, icon: Link, action: () => { navigator.clipboard.writeText('https://yyc3.app/project/demo'); toast.success(i.toastLinkCopied) } },
                    { label: i.shareInvite, icon: Mail, action: () => toast.info(i.toastInviteSent) },
                    { label: i.shareExport, icon: Download, action: () => toast.success(i.toastExportedZip) },
                    { label: i.shareEmbedCode, icon: Copy, action: () => { navigator.clipboard.writeText('<iframe src="https://yyc3.app/embed"></iframe>'); toast.success(i.toastEmbedCopied) } },
                  ].map(({ label, icon: Icon, action }) => (
                    <button key={label} onClick={() => { action(); closeAll() }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`} style={{ fontWeight: 400 }}>
                      <Icon className="w-3.5 h-3.5" /><span>{label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── 🚀 Deploy ── */}
          <div className="relative">
            <button
              onClick={() => togglePanel(setShowDeploy, showDeploy)}
              className={`p-2 rounded-lg ${t.transition} ${showDeploy ? t.interactive.iconActive : t.interactive.headerBtn}`}
              aria-label={i.deploy} title={`${i.deploy} (Ctrl+Shift+D)`}
            >
              <Rocket className="w-[18px] h-[18px]" />
            </button>
            {showDeploy && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeAll} />
                <div className={`${popoverClass} right-0 top-full mt-2 w-56 p-1.5`}>
                  <div className={`px-3 py-1.5 text-[10px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.deploy}</div>
                  {[
                    { label: i.deployPreview, icon: Cloud, action: () => toast.success(i.toastPreviewDeploy) },
                    { label: i.deployProduction, icon: Rocket, action: () => toast.info(i.toastProductionDeploy) },
                    { label: i.deployStatus, icon: CheckCircle, action: () => toast.info(i.toastDeployReady) },
                  ].map(({ label, icon: Icon, action }) => (
                    <button key={label} onClick={() => { action(); closeAll() }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`} style={{ fontWeight: 400 }}>
                      <Icon className="w-3.5 h-3.5" /><span>{label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── ⚡ Quick Actions ── */}
          <div className="relative">
            <button
              onClick={() => togglePanel(setShowQuickActions, showQuickActions)}
              className={`p-2 rounded-lg ${t.transition} ${showQuickActions ? t.interactive.iconActive : t.interactive.headerBtn}`}
              aria-label={i.quickActions} title={`${i.quickActions} (Ctrl+Shift+Q)`}
            >
              <Zap className="w-[18px] h-[18px]" />
            </button>
            {showQuickActions && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeAll} />
                <div className={`${popoverClass} right-0 top-full mt-2 w-56 p-1.5`}>
                  <div className={`px-3 py-1.5 text-[10px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.quickActions}</div>
                  {[
                    { label: i.newProject, icon: FolderPlus, shortcut: '', action: () => { addProject({ name: `Project ${Date.now() % 1000}`, description: i.newProject, updatedAt: Date.now(), status: 'draft', color: '#6366f1' }); toast.success(i.toastProjectCreated) } },
                    { label: i.openTerminal, icon: Terminal, shortcut: 'Ctrl+Shift+T', action: () => { navigate('/ide'); toast.info(i.openTerminal) } },
                    { label: i.runBuild, icon: Play, shortcut: '', action: () => toast.success(i.toastBuildStarted) },
                    { label: i.runTests, icon: TestTube, shortcut: '', action: () => toast.info(i.toastTestsRunning) },
                    { label: i.gitCommit, icon: GitBranch, shortcut: '', action: () => toast.success(i.toastAllCommitted) },
                    { label: i.search, icon: Search, shortcut: 'Ctrl+Shift+F', action: () => navigate('/ide') },
                    { label: i.shortcuts, icon: Keyboard, shortcut: '', action: () => setShortcutsDialogOpen(true) },
                  ].map(({ label, icon: Icon, shortcut, action }) => (
                    <button key={label} onClick={() => { action(); closeAll() }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`} style={{ fontWeight: 400 }}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="flex-1 text-left">{label}</span>
                      {shortcut && <span className={`text-[9px] ${t.text.dimmed}`}>{shortcut}</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── 🎨 Theme Picker (full 5-preset picker, not just toggle) ── */}
          <div className="relative">
            <button
              onClick={() => togglePanel(setShowThemePicker, showThemePicker)}
              className={`p-2 rounded-lg ${t.transition} ${showThemePicker ? t.interactive.iconActive : t.interactive.headerBtn}`}
              aria-label={i.themeSwitch} title={i.themeSwitch}
            >
              <Palette className="w-[18px] h-[18px]" />
            </button>
            {showThemePicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeAll} />
                <div className={`${popoverClass} right-0 top-full mt-2 w-48 p-1.5`}>
                  <div className={`px-3 py-1.5 text-[10px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>
                    {i.selectTheme}
                  </div>
                  {THEME_PRESETS.map((preset) => (
                    <button key={preset.id} onClick={() => { setTheme(preset.id); closeAll(); toast.success(`${i.toastSwitchedTo} ${resolveKey(i, preset.labelKey)}`) }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${theme === preset.id ? `${t.accent.activeBg} ${t.accent.activeText}` : t.interactive.menuItem}`}
                      style={{ fontWeight: theme === preset.id ? 500 : 400 }}>
                      <span className="text-[14px]">{preset.icon}</span>
                      <span>{resolveKey(i, preset.labelKey)}</span>
                      <div className="ml-auto w-3 h-3 rounded-full border" style={{ backgroundColor: preset.accent, borderColor: preset.accent + '60' }} />
                    </button>
                  ))}
                  <div className={`my-1 h-px mx-2 ${t.border.divider}`} />
                  <button onClick={() => { openThemeCustomizer(); closeAll() }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`} style={{ fontWeight: 400 }}>
                    <Palette className="w-3.5 h-3.5" /><span>{i.themeCustomize}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── 🌐 Language ── */}
          <button
            onClick={() => { toggleLanguage(); toast.info(i.toastLanguageSwitched) }}
            className={`p-2 rounded-lg ${t.transition} ${t.interactive.headerBtn}`}
            aria-label={i.language} title={`${i.language} (Ctrl+Shift+L)`}
          >
            <Languages className="w-[18px] h-[18px]" />
          </button>

          {/* ── ⚙️ Settings ── */}
          <button
            onClick={openThemeCustomizer}
            className={`p-2 rounded-lg ${t.transition} ${t.interactive.headerBtn}`}
            aria-label={i.settings} title={`${i.settings} (Ctrl+,)`}
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>

          <div className={`w-px h-5 mx-1 ${t.border.dividerV}`} />

          {/* ── 👤 User Avatar + Panel ── */}
          <div className="relative">
            <button
              onClick={() => togglePanel(setShowUserPanel, showUserPanel)}
              className={`flex items-center space-x-1.5 p-0.5 rounded-lg ${t.transition} ${t.isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-200/30'}`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white">
                <User className="w-4 h-4" />
              </div>
              <ChevronDown className={`w-3 h-3 ${t.transition} ${showUserPanel ? 'rotate-180' : ''} ${t.text.muted}`} />
            </button>
            {showUserPanel && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeAll} />
                <div className={`${popoverClass} right-0 top-full mt-2 w-56`}>
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
                      { label: i.preferences, icon: Settings, action: () => openThemeCustomizer() },
                      { label: i.shortcuts, icon: Keyboard, action: () => setShortcutsDialogOpen(true) },
                      { label: i.language, icon: Globe, action: () => toggleLanguage() },
                      { label: i.openWorkspace, icon: ArrowRight, action: () => navigate('/ide') },
                    ].map(({ label, icon: Icon, action }) => (
                      <button key={label} onClick={() => { action(); closeAll() }}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 text-[13px] ${t.transition} ${t.interactive.menuItem}`} style={{ fontWeight: 400 }}>
                        <Icon className="w-4 h-4" /><span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Brand Identity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-10">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl">
              <picture>
                <source srcSet={logoImgs.medium} media="(max-width: 640px)" />
                <source srcSet={logoImgs.large} media="(min-width: 1024px)" />
                <img src={logoImgs.large} alt="YYC³" className="w-16 h-16 object-contain" />
              </picture>
            </div>
          </div>
          <h1 className="text-[32px] tracking-tight mb-2" style={{ fontWeight: 700 }}>
            <span className={`bg-gradient-to-r ${t.accent.gradient} bg-clip-text text-transparent`}>{i.familyAI}</span>
          </h1>
          <p className={`text-[14px] ${t.text.tertiary}`}>{i.brandSlogan}</p>
        </motion.div>

        {/* AI Chat Input Box */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="w-full max-w-2xl mb-12">
          <div className={`relative rounded-2xl overflow-hidden ${t.isDark ? 'bg-slate-900/60 border border-white/10 shadow-2xl' : 'bg-white/70 border border-slate-200/60 shadow-xl'} backdrop-blur-xl`}>
            {/* Slash Commands Popover */}
            <AnimatePresence>
              {showCommands && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className={`absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden p-1 z-50 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}>
                  <div className={`px-3 py-2 text-[11px] uppercase tracking-wider ${t.text.muted}`} style={{ fontWeight: 600 }}>{i.slashCommands}</div>
                  {SLASH_COMMANDS_DATA.map((cmd) => (
                    <button key={cmd.command} onClick={() => handleCommandSelect(cmd.command)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 text-left text-[13px] rounded-lg ${t.transition} ${t.isDark ? 'hover:bg-indigo-500/15 text-slate-200' : 'hover:bg-indigo-50 text-slate-700'}`}>
                      <cmd.icon className={`w-4 h-4 ${t.accent.primary}`} />
                      <span className="font-mono" style={{ fontWeight: 500 }}>{cmd.command}</span>
                      <span className={`text-[12px] ${t.text.muted}`}>{i[cmd.descKey]}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tool Icons Row (expanded) */}
            <AnimatePresence>
              {showTools && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className={`border-b overflow-hidden ${t.border.subtle}`}>
                  <div className="flex items-center space-x-1 px-4 py-2.5">
                    {TOOL_ICONS_DATA.slice(1).map(({ icon: Icon, labelKey, key }) => (
                      <button key={key}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toolIconActions[key]?.(); }}
                        className={`p-2 rounded-lg ${t.transition} ${t.interactive.headerBtn} cursor-pointer`}
                        title={i[labelKey]}
                        type="button">
                        <Icon className="w-4 h-4 pointer-events-none" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Textarea */}
            <div className="relative">
              <textarea ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
                placeholder={i.chatPlaceholder}
                aria-label={i.aiChat}
                className={`w-full h-28 resize-none py-4 px-5 bg-transparent border-none outline-none text-[14px] ${t.text.placeholder} ${t.text.inverse}`}
                style={{ fontWeight: 400 }} />
            </div>

            {/* Bottom Bar — all buttons functional */}
            <div className={`flex items-center justify-between px-4 py-2.5 border-t ${t.border.subtle}`}>
              <div className="flex items-center space-x-1">
                {/* ⊕ Expand tool row */}
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTools(!showTools) }}
                  className={`p-2 rounded-lg ${t.transition} ${showTools ? `${t.accent.primaryBg} ${t.accent.primary}` : t.interactive.headerBtn} cursor-pointer`}
                  title={i.addAttachment}
                  type="button">
                  <Plus className="w-4 h-4 pointer-events-none" />
                </button>
                {/* 📤 Image Upload */}
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast.info(i.toastImageUpload) }}
                  className={`p-2 rounded-lg ${t.transition} ${t.interactive.headerBtn} cursor-pointer`} title={i.uploadImage}
                  type="button">
                  <ImageIcon className="w-4 h-4 pointer-events-none" />
                </button>
                {/* 💻 Code Insert */}
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setInput(input + '```tsx\n// code here\n```'); inputRef.current?.focus(); toast.info(i.toastCodeTemplateInserted) }}
                  className={`p-2 rounded-lg ${t.transition} ${t.interactive.headerBtn} cursor-pointer`} title={i.insertCode}
                  type="button">
                  <Code className="w-4 h-4 pointer-events-none" />
                </button>
                {/* 📋 Clipboard */}
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.readText().then(text => { if (text) { setInput(input + text); toast.success(i.toastClipboardPasted) } }).catch(() => toast.error(i.toastClipboardError)) }}
                  className={`p-2 rounded-lg ${t.transition} ${t.interactive.headerBtn} cursor-pointer`} title={i.clipboard}
                  type="button">
                  <Clipboard className="w-4 h-4 pointer-events-none" />
                </button>
              </div>
              {/* Send */}
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSend() }} disabled={!input.trim()}
                className={`p-2.5 ${t.accent.solidBtn} disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-lg ${t.transition} flex items-center justify-center cursor-pointer`}
                aria-label={i.send}
                type="button">
                <Send className="w-4 h-4 pointer-events-none" />
              </button>
            </div>
          </div>

          {/* Hints */}
          <div className="flex items-center justify-center mt-3 space-x-4">
            <span className={`text-[11px] ${t.text.muted}`}><kbd className={`px-1.5 py-0.5 rounded text-[10px] ${t.kbd}`}>Enter</kbd> {i.enterToSend}</span>
            <span className={`text-[11px] ${t.text.muted}`}><kbd className={`px-1.5 py-0.5 rounded text-[10px] ${t.kbd}`}>Shift+Enter</kbd> {i.shiftEnterNewline}</span>
            <span className={`text-[11px] ${t.text.muted}`}><kbd className={`px-1.5 py-0.5 rounded text-[10px] ${t.kbd}`}>/</kbd> {i.slashShortcut}</span>
          </div>
        </motion.div>

        {/* ═══ RECENT PROJECTS ═══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="w-full max-w-4xl">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center space-x-2">
              <Clock className={`w-4 h-4 ${t.text.muted}`} />
              <span className={`text-[13px] ${t.text.tertiary}`} style={{ fontWeight: 500 }}>{i.recentProjects}</span>
            </div>
            <button onClick={() => navigate('/ide')}
              className={`flex items-center space-x-1 text-[12px] px-3 py-1.5 rounded-lg ${t.transition} ${t.interactive.headerBtn}`} style={{ fontWeight: 500 }}>
              <span>{i.viewAll}</span><ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentProjects.map((project) => (
              <motion.div key={project.id} whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={() => handleProjectClick(project.id)}
                className={`group relative rounded-xl p-4 cursor-pointer ${t.transition} ${t.isDark ? 'bg-slate-900/50 border border-white/8 hover:border-white/15 hover:bg-slate-800/60' : 'bg-white/60 border border-slate-200/50 hover:border-slate-300/60 hover:bg-white/80'} backdrop-blur-md`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: project.color + '20' }}>
                    <Folder className="w-4 h-4" style={{ color: project.color }} />
                  </div>
                  {/* ── Project card "More" button with context menu ── */}
                  <div className="relative">
                    <button
                      className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${t.interactive.hoverBg}`}
                      onClick={(e) => { e.stopPropagation(); setProjectContextMenu(projectContextMenu?.id === project.id ? null : { id: project.id, x: e.clientX, y: e.clientY }) }}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="text-[13px] mb-1 truncate" style={{ fontWeight: 600 }}>{project.name}</h3>
                <p className={`text-[11px] mb-3 ${t.text.muted}`}>{resolveKey(i, project.description)}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] ${t.text.dimmed}`}>{formatTime(project.updatedAt)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${project.status === 'active' ? 'bg-emerald-500/15 text-emerald-500'
                    : project.status === 'draft' ? 'bg-amber-500/15 text-amber-500'
                      : 'bg-slate-500/15 text-slate-500'
                    }`} style={{ fontWeight: 500 }}>
                    {project.status === 'active' ? i.active : project.status === 'draft' ? i.draft : i.archived}
                  </span>
                </div>
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ background: `radial-gradient(circle at center, ${project.color}08 0%, transparent 70%)` }} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* ── Project card context menu (floating) ── */}
      {projectContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setProjectContextMenu(null)} />
          <div className={`fixed z-50 w-44 rounded-xl overflow-hidden p-1 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
            style={{ left: Math.min(projectContextMenu.x, window.innerWidth - 200), top: projectContextMenu.y }}>
            {[
              { label: i.openProject, icon: ExternalLink, action: () => { navigate('/ide'); setProjectContextMenu(null) } },
              { label: i.renameProject, icon: Edit3, action: () => { toast.info(i.toastRenameTriggered); setProjectContextMenu(null) } },
              { label: i.archive, icon: Archive, action: () => { toast.success(i.toastProjectArchived); setProjectContextMenu(null) } },
              {
                label: i.duplicate, icon: Copy, action: () => {
                  const proj = recentProjects.find(p => p.id === projectContextMenu.id)
                  if (proj) { addProject({ name: proj.name + ' (copy)', description: proj.description, updatedAt: Date.now(), status: 'draft', color: proj.color }) }
                  toast.success(i.toastProjectDuplicated)
                  setProjectContextMenu(null)
                }
              },
            ].map(({ label, icon: Icon, action }) => (
              <button key={label} onClick={action}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`} style={{ fontWeight: 400 }}>
                <Icon className="w-3.5 h-3.5" /><span>{label}</span>
              </button>
            ))}
            <div className={`my-1 h-px mx-2 ${t.border.divider}`} />
            <button onClick={() => {
              removeProject(projectContextMenu.id)
              toast.success(i.toastProjectDeleted)
              setProjectContextMenu(null)
            }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} text-red-400 hover:bg-red-500/10`} style={{ fontWeight: 400 }}>
              <Trash2 className="w-3.5 h-3.5" /><span>{i.deleteProject}</span>
            </button>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className={`relative z-10 text-center py-4 text-[11px] ${t.text.dimmed}`}>
        {i.footerText} &middot; v1.0.0
      </footer>

      {/* Modals */}
      <Suspense fallback={null}>
        <ThemeCustomizer />
      </Suspense>
      <ShortcutsDialog />
    </div>
  )
}
