/**
 * @file settingsStore.ts
 * @description YYC³便携式智能AI系统 - 设置页面Zustand存储
 * Settings Page Zustand Store
 * Persisted to localStorage, integrates with global theme/language/model stores
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags store,settings,zustand,persistence
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ──

export interface EditorConfig {
  fontFamily: string
  fontSize: number
  wordWrap: boolean
  tabSize: number
  minimap: boolean
  lineNumbers: boolean
}

export type ShortcutScheme = 'vscode' | 'cursor' | 'custom'
export type LinkOpenMethod = 'system' | 'builtin'
export type MarkdownOpenMethod = 'editor' | 'preview'
export type ReviewScope = 'none' | 'all' | 'changed'
export type CommandRunMode = 'sandbox' | 'direct'

export interface AgentConfig {
  id: string
  name: string
  description: string
  prompt: string
  builtin: boolean
  enabled: boolean
}

export interface McpConfig {
  id: string
  name: string
  endpoint: string
  type: 'stdio' | 'sse' | 'streamable-http'
  enabled: boolean
  isProject: boolean
}

export interface DocSet {
  id: string
  name: string
  url: string
  type: 'url' | 'upload'
}

export interface RuleItem {
  id: string
  name: string
  content: string
  scope: 'personal' | 'project'
}

export interface SkillItem {
  id: string
  name: string
  content: string
  scope: 'global' | 'project'
}

export interface AccountProfile {
  username: string
  email: string
  avatar: string
}

export interface NotificationConfig {
  banner: boolean
  sound: boolean
  menuBar: boolean
  volume: number
  soundComplete: string
  soundWaiting: string
  soundError: string
}

export interface SettingsState {
  // ── Account ──
  account: AccountProfile
  updateAccount: (u: Partial<AccountProfile>) => void

  // ── General ──
  editor: EditorConfig
  updateEditor: (u: Partial<EditorConfig>) => void
  shortcutScheme: ShortcutScheme
  setShortcutScheme: (s: ShortcutScheme) => void
  customKeybindings: Record<string, string>
  setCustomKeybinding: (actionId: string, shortcut: string) => void
  resetCustomKeybindings: () => void
  linkOpenMethod: LinkOpenMethod
  setLinkOpenMethod: (m: LinkOpenMethod) => void
  markdownOpenMethod: MarkdownOpenMethod
  setMarkdownOpenMethod: (m: MarkdownOpenMethod) => void
  nodeVersions: string[]
  activeNodeVersion: string
  addNodeVersion: (v: string) => void
  removeNodeVersion: (v: string) => void
  setActiveNodeVersion: (v: string) => void

  // ── Agents ──
  agents: AgentConfig[]
  addAgent: (a: Omit<AgentConfig, 'id'>) => void
  updateAgent: (id: string, u: Partial<AgentConfig>) => void
  removeAgent: (id: string) => void

  // ── MCP ──
  mcpServers: McpConfig[]
  addMcp: (m: Omit<McpConfig, 'id'>) => void
  updateMcp: (id: string, u: Partial<McpConfig>) => void
  removeMcp: (id: string) => void
  projectMcpAutoLoad: boolean
  setProjectMcpAutoLoad: (v: boolean) => void

  // ── Context ──
  codeIndexEnabled: boolean
  setCodeIndexEnabled: (v: boolean) => void
  indexProgress: number
  ignorePatterns: string
  setIgnorePatterns: (v: string) => void
  docSets: DocSet[]
  addDocSet: (d: Omit<DocSet, 'id'>) => void
  removeDocSet: (id: string) => void

  // ── Chat Flow ──
  todoListEnabled: boolean
  setTodoListEnabled: (v: boolean) => void
  autoCollapse: boolean
  setAutoCollapse: (v: boolean) => void
  autoFixCode: boolean
  setAutoFixCode: (v: boolean) => void
  agentAsk: boolean
  setAgentAsk: (v: boolean) => void
  reviewScope: ReviewScope
  setReviewScope: (v: ReviewScope) => void
  reviewAfterJump: boolean
  setReviewAfterJump: (v: boolean) => void
  autoRunMcp: boolean
  setAutoRunMcp: (v: boolean) => void
  commandRunMode: CommandRunMode
  setCommandRunMode: (v: CommandRunMode) => void
  whitelistCommands: string
  setWhitelistCommands: (v: string) => void
  notifications: NotificationConfig
  updateNotifications: (u: Partial<NotificationConfig>) => void

  // ── Rules & Skills ──
  includeAgentsMd: boolean
  setIncludeAgentsMd: (v: boolean) => void
  includeClaudeMd: boolean
  setIncludeClaudeMd: (v: boolean) => void
  rules: RuleItem[]
  addRule: (r: Omit<RuleItem, 'id'>) => void
  updateRule: (id: string, u: Partial<RuleItem>) => void
  removeRule: (id: string) => void
  skills: SkillItem[]
  addSkill: (s: Omit<SkillItem, 'id'>) => void
  updateSkill: (id: string, u: Partial<SkillItem>) => void
  removeSkill: (id: string) => void
}

const uid = () => Math.random().toString(36).substring(2, 11)

const defaultAgents: AgentConfig[] = [
  { id: 'agent-code', name: 'Code Assistant', description: 'General-purpose coding helper', prompt: 'You are a senior developer. Help the user write clean, efficient code.', builtin: true, enabled: true },
  { id: 'agent-review', name: 'Code Reviewer', description: 'Reviews code for quality and best practices', prompt: 'You are a code reviewer. Identify bugs, security issues, and suggest improvements.', builtin: true, enabled: true },
  { id: 'agent-arch', name: 'Architect', description: 'System architecture advisor', prompt: 'You are a software architect. Help design scalable systems and suggest architectural patterns.', builtin: true, enabled: false },
]

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // ── Account ──
      account: { username: 'YYC3 Developer', email: 'dev@yyc3.ai', avatar: '' },
      updateAccount: (u) => set((s) => ({ account: { ...s.account, ...u } })),

      // ── General ──
      editor: { fontFamily: "'Fira Code', monospace", fontSize: 14, wordWrap: true, tabSize: 2, minimap: true, lineNumbers: true },
      updateEditor: (u) => set((s) => ({ editor: { ...s.editor, ...u } })),
      shortcutScheme: 'vscode',
      setShortcutScheme: (s) => set({ shortcutScheme: s }),
      customKeybindings: {},
      setCustomKeybinding: (actionId, shortcut) => set((s) => ({ customKeybindings: { ...s.customKeybindings, [actionId]: shortcut } })),
      resetCustomKeybindings: () => set({ customKeybindings: {} }),
      linkOpenMethod: 'system',
      setLinkOpenMethod: (m) => set({ linkOpenMethod: m }),
      markdownOpenMethod: 'preview',
      setMarkdownOpenMethod: (m) => set({ markdownOpenMethod: m }),
      nodeVersions: ['v20.11.0', 'v18.19.0'],
      activeNodeVersion: 'v20.11.0',
      addNodeVersion: (v) => set((s) => ({ nodeVersions: s.nodeVersions.includes(v) ? s.nodeVersions : [...s.nodeVersions, v] })),
      removeNodeVersion: (v) => set((s) => ({ nodeVersions: s.nodeVersions.filter((n) => n !== v), activeNodeVersion: s.activeNodeVersion === v ? s.nodeVersions[0] || '' : s.activeNodeVersion })),
      setActiveNodeVersion: (v) => set({ activeNodeVersion: v }),

      // ── Agents ──
      agents: defaultAgents,
      addAgent: (a) => set((s) => ({ agents: [...s.agents, { ...a, id: 'agent-' + uid() }] })),
      updateAgent: (id, u) => set((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, ...u } : a)) })),
      removeAgent: (id) => set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),

      // ── MCP ──
      mcpServers: [],
      addMcp: (m) => set((s) => ({ mcpServers: [...s.mcpServers, { ...m, id: 'mcp-' + uid() }] })),
      updateMcp: (id, u) => set((s) => ({ mcpServers: s.mcpServers.map((m) => (m.id === id ? { ...m, ...u } : m)) })),
      removeMcp: (id) => set((s) => ({ mcpServers: s.mcpServers.filter((m) => m.id !== id) })),
      projectMcpAutoLoad: true,
      setProjectMcpAutoLoad: (v) => set({ projectMcpAutoLoad: v }),

      // ── Context ──
      codeIndexEnabled: true,
      setCodeIndexEnabled: (v) => set({ codeIndexEnabled: v }),
      indexProgress: 78,
      ignorePatterns: 'node_modules/\ndist/\n.git/\n*.lock',
      setIgnorePatterns: (v) => set({ ignorePatterns: v }),
      docSets: [],
      addDocSet: (d) => set((s) => ({ docSets: [...s.docSets, { ...d, id: 'doc-' + uid() }] })),
      removeDocSet: (id) => set((s) => ({ docSets: s.docSets.filter((d) => d.id !== id) })),

      // ── Chat Flow ──
      todoListEnabled: true,
      setTodoListEnabled: (v) => set({ todoListEnabled: v }),
      autoCollapse: true,
      setAutoCollapse: (v) => set({ autoCollapse: v }),
      autoFixCode: false,
      setAutoFixCode: (v) => set({ autoFixCode: v }),
      agentAsk: true,
      setAgentAsk: (v) => set({ agentAsk: v }),
      reviewScope: 'changed',
      setReviewScope: (v) => set({ reviewScope: v }),
      reviewAfterJump: true,
      setReviewAfterJump: (v) => set({ reviewAfterJump: v }),
      autoRunMcp: false,
      setAutoRunMcp: (v) => set({ autoRunMcp: v }),
      commandRunMode: 'sandbox',
      setCommandRunMode: (v) => set({ commandRunMode: v }),
      whitelistCommands: 'npm test\nnpm run build\nnpm run lint',
      setWhitelistCommands: (v) => set({ whitelistCommands: v }),
      notifications: { banner: true, sound: true, menuBar: false, volume: 70, soundComplete: 'chime', soundWaiting: 'soft-ping', soundError: 'alert' },
      updateNotifications: (u) => set((s) => ({ notifications: { ...s.notifications, ...u } })),

      // ── Rules & Skills ──
      includeAgentsMd: true,
      setIncludeAgentsMd: (v) => set({ includeAgentsMd: v }),
      includeClaudeMd: true,
      setIncludeClaudeMd: (v) => set({ includeClaudeMd: v }),
      rules: [],
      addRule: (r) => set((s) => ({ rules: [...s.rules, { ...r, id: 'rule-' + uid() }] })),
      updateRule: (id, u) => set((s) => ({ rules: s.rules.map((r) => (r.id === id ? { ...r, ...u } : r)) })),
      removeRule: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),
      skills: [],
      addSkill: (s2) => set((s) => ({ skills: [...s.skills, { ...s2, id: 'skill-' + uid() }] })),
      updateSkill: (id, u) => set((s) => ({ skills: s.skills.map((sk) => (sk.id === id ? { ...sk, ...u } : sk)) })),
      removeSkill: (id) => set((s) => ({ skills: s.skills.filter((sk) => sk.id !== id) })),
    }),
    { name: 'yyc3-settings' }
  )
)