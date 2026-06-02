/**
 * file: types.ts
 * description: 核心类型定义 - 定义应用的核心数据结构和接口
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-03-19
 * updated: 2026-04-01
 * status: active
 * tags: [types],[core],[data-model]
 *
 * brief: 应用核心类型定义
 *
 * details:
 * - 设计根类型定义
 * - 面板规范类型
 * - 组件规范类型
 * - 样式规范类型
 * - AI服务类型
 * - 用户界面类型
 *
 * dependencies: TypeScript
 * exports: DesignRoot, PanelSpec, ComponentSpec, StyleSpec, AIProviderConfig等
 * notes: 与文档07数据模型架构设计对齐
 */

// ── Design Root ──

export interface DesignRoot {
  version: string
  theme: 'light' | 'dark'
  tokens: string
  panels: PanelSpec[]
  components: ComponentSpec[]
  styles: StyleSpec
}

// ── Panel ──

export interface PanelSpec {
  id: string
  type: 'container' | 'content' | 'preview'
  layout: {
    x: number
    y: number
    w: number
    h: number
    minW?: number
    minH?: number
    maxW?: number
    maxH?: number
  }
  style: PanelStyle
  children?: PanelSpec[]
  components?: ComponentSpec[]
}

export interface PanelStyle {
  background?: string
  border?: string
  borderRadius?: number
  padding?: number
  margin?: number
  shadow?: string
}

// ── Component ──

export interface ComponentSpec {
  id: string
  type: ComponentType
  props: Record<string, any>
  style: ComponentStyle
  children?: ComponentSpec[]
}

export type ComponentType =
  | 'Button' | 'Input' | 'Text' | 'Image'
  | 'Container' | 'List' | 'Card' | 'Modal'
  | 'Dropdown' | 'Checkbox' | 'Radio' | 'Switch'
  | 'Slider' | 'DatePicker' | 'TimePicker' | 'Upload'
  | 'Progress' | 'Spinner' | 'Badge' | 'Avatar'
  | 'Divider' | 'Tooltip' | 'Popover' | 'Tabs'
  | 'Accordion' | 'Breadcrumb' | 'Pagination' | 'Table'
  | 'Form' | 'Alert' | 'Message' | 'Notification'
  | 'Drawer' | 'Skeleton' | 'Empty' | 'Result'
  | 'Statistic' | 'Timeline' | 'Tree' | 'Transfer'
  | 'Calendar' | 'Carousel' | 'Collapse' | 'Comment'
  | 'Description' | 'Steps' | 'Tag' | 'Rate'
  | 'Space' | 'Layout' | 'Menu' | 'PageHeader'
  | 'BackTop' | 'Anchor' | 'Affix' | 'Parallax'
  | 'ScrollNumber' | 'Spin' | 'ConfigProvider'

export interface ComponentStyle {
  width?: string | number
  height?: string | number
  padding?: string | number
  margin?: string | number
  background?: string
  border?: string
  borderRadius?: string | number
  boxShadow?: string
  opacity?: number
  transform?: string
  transition?: string
  animation?: string
  cursor?: string
  display?: string
  flexDirection?: string
  justifyContent?: string
  alignItems?: string
  gap?: string | number
  flexWrap?: string
  position?: string
  top?: string | number
  left?: string | number
  right?: string | number
  bottom?: string | number
  zIndex?: number
  overflow?: string
  textOverflow?: string
  whiteSpace?: string
  wordBreak?: string
  fontSize?: string | number
  fontWeight?: string | number
  lineHeight?: string | number
  letterSpacing?: string | number
  textAlign?: string
  textDecoration?: string
  textTransform?: string
  color?: string
  backgroundColor?: string
  backgroundImage?: string
  backgroundSize?: string
  backgroundPosition?: string
  backgroundRepeat?: string
  borderStyle?: string
  borderWidth?: string | number
  borderColor?: string
  outline?: string
  outlineOffset?: string | number
  filter?: string
  backdropFilter?: string
  mixBlendMode?: string
  isolation?: string
  clipPath?: string
}

// ── Style ──

export interface StyleSpec {
  tokens?: Partial<DesignTokens>
  theme?: Record<string, unknown>
  components?: Record<string, unknown>
}

// ── Design Tokens (Doc 07 §3) ──

export interface DesignTokens {
  colors: ColorTokens
  spacing: SpacingTokens
  typography: TypographyTokens
  borderRadius: BorderRadiusTokens
  shadows: ShadowTokens
  transitions: TransitionTokens
}

export interface ColorTokens {
  primary: ColorScale
  secondary: ColorScale
  success: ColorScale
  warning: ColorScale
  error: ColorScale
  neutral: ColorScale
}

export interface ColorScale {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
}

export interface SpacingTokens {
  0: string
  1: string
  2: string
  3: string
  4: string
  5: string
  6: string
  8: string
  10: string
  12: string
  16: string
  20: string
  24: string
}

export interface TypographyTokens {
  fontFamily: {
    sans: string[]
    mono: string[]
  }
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
  }
  fontWeight: {
    normal: number
    medium: number
    semibold: number
    bold: number
  }
  lineHeight: {
    tight: number
    normal: number
    relaxed: number
  }
}

export interface BorderRadiusTokens {
  none: string
  sm: string
  base: string
  md: string
  lg: string
  xl: string
  '2xl': string
  full: string
}

export interface ShadowTokens {
  xs: string
  sm: string
  base: string
  md: string
  lg: string
  xl: string
}

export interface TransitionTokens {
  fast: string
  normal: string
  slow: string
}

// ── Message ──

export type MessageRole = 'user' | 'ai' | 'system'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: number
}

// ── AI Model Management ──

export type AIModelProvider = 'openai' | 'anthropic' | 'zhipuai' | 'baidu' | 'aliyun' | 'ollama' | 'deepseek' | 'custom'

export type AIModelStatus = 'idle' | 'testing' | 'connected' | 'error'

export type AIModelType = 'chat' | 'embedding' | 'fine-tune' | 'image' | 'audio'

export interface AIModel {
  id: string
  name: string
  provider: AIModelProvider
  endpoint: string
  apiKey: string
  isActive: boolean
  isDetected?: boolean
  status?: AIModelStatus
  lastTestResult?: string
  lastTestTime?: number
  // Extended fields per P1-AI spec
  displayName?: string
  type?: AIModelType
  contextLength?: number
  maxTokens?: number
  capabilities?: string[]
  parameters?: AIModelParameters
  benchmark?: AIModelBenchmark
}

export interface AIModelParameters {
  temperature: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
}

export interface AIModelBenchmark {
  latency: number
  throughput: number
  accuracy: number
}

// ── AI Provider Config (multi-provider architecture) ──

export interface AIProviderConfig {
  id: string
  name: string
  displayName: string
  type: 'cloud' | 'local'
  baseURL: string
  apiKey: string
  apiKeyURL?: string
  region?: string
  models: AIModel[]
  enabled: boolean
  priority: number
  rateLimit?: { requestsPerMinute: number; tokensPerMinute: number }
  pricing?: { inputPrice: number; outputPrice: number; currency: string }
}

// ── AI Chat Types ──

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stream?: boolean
}

export interface AIChatResponse {
  id: string
  model: string
  choices: { message: AIChatMessage; finishReason: string }[]
  usage: { promptTokens: number; completionTokens: number; totalTokens: number }
}

// ── AI Performance & Error ──

export interface AIPerformanceMetrics {
  providerId: string
  modelId: string
  timestamp: number
  latency: number
  throughput: number
  successRate: number
  errorCount: number
  totalRequests: number
}

export interface AIErrorAnalysis {
  providerId: string
  modelId: string
  errorType: 'network' | 'api' | 'rate_limit' | 'authentication' | 'unknown'
  errorMessage: string
  timestamp: number
  count: number
  suggestions: string[]
}

// ── Database Types (P2-数据库) ──

export type DatabaseType = 'postgresql' | 'mysql' | 'redis' | 'sqlite'

export interface DBConnectionProfile {
  id: string
  name: string
  type: DatabaseType
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
  pool?: { min: number; max: number; acquireTimeout: number; idleTimeout: number }
}

export interface DBConnectionStatus {
  connected: boolean
  lastConnected?: number
  lastError?: string
  poolSize: number
  activeConnections: number
  idleConnections: number
}

export interface DBTableInfo {
  name: string
  schema: string
  rowCount?: number
  columns: DBColumnInfo[]
}

export interface DBColumnInfo {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  defaultValue?: string
}

export interface DBQueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  duration: number
}

// ── Plugin System Types (P2-插件) ──

export type PluginPermission = 'storage' | 'network' | 'clipboard' | 'notification' | 'editor' | 'database' | 'ai'

export type PluginStatus = 'loading' | 'active' | 'inactive' | 'error' | 'activating' | 'deactivating'

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  main: string
  icon?: string
  permissions: PluginPermission[]
  dependencies?: string[]
  config?: PluginConfigField[]
}

export interface PluginConfigField {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select'
  default?: unknown
  options?: { label: string; value: string }[]
}

export interface PluginInstance {
  id: string
  manifest: PluginManifest
  status: PluginStatus
  activated: boolean
  error?: string
  activatedAt?: number
  activate?: () => Promise<void>
  deactivate?: () => Promise<void>
  execute?: (action: string, ...args: unknown[]) => Promise<unknown>
}

// ── Preview History Types (P2-预览历史) ──

export interface PreviewSnapshot {
  id: string
  name: string
  description?: string
  content: string
  createdAt: number
  createdBy: string
  tags: string[]
  size: number
  isAuto: boolean
  metadata: PreviewSnapshotMetadata
}

export interface PreviewSnapshotMetadata {
  filePath?: string
  deviceConfig?: PreviewDeviceConfig
  performanceMetrics?: { loadTime: number; renderTime: number }
  screenshot?: string
}

export interface PreviewDeviceConfig {
  id: string
  name: string
  type: 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'custom'
  width: number
  height: number
  dpr: number
  userAgent?: string
  orientation?: 'portrait' | 'landscape'
}

// ── Multi-Panel Layout Types (P1-多面板) ──

export type IDEPanelType =
  | 'code-editor' | 'file-browser' | 'preview' | 'terminal'
  | 'debug' | 'output' | 'search' | 'ai-chat'
  | 'database' | 'version-control'

export interface IDEPanel {
  id: string
  type: IDEPanelType
  title: string
  size: { width: number; height: number }
  position: { x: number; y: number }
  isLocked: boolean
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
}

export interface IDETab {
  id: string
  panelId: string
  title: string
  isPinned: boolean
  isModified: boolean
  isUnsaved: boolean
  hasError: boolean
  isActive: boolean
}

export interface IDELayout {
  id: string
  name: string
  panels: IDEPanel[]
  activePanel: string | null
  createdAt: number
  updatedAt: number
}

// ── Service Layer Interfaces (P0/P1 架构) ──

export interface FileServiceInterface {
  browse(dir?: string): Promise<FileNode[]>
  open(path: string): Promise<string>
  save(path: string, content: string): Promise<void>
  delete(path: string): Promise<void>
  rename(oldPath: string, newPath: string): Promise<void>
  createFile(path: string, init?: string): Promise<void>
  createFolder(path: string): Promise<void>
  getHistory(path: string): Promise<FileVersion[]>
  rollback(path: string, versionId: string): Promise<void>
}

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modifiedAt?: number
  children?: FileNode[]
}

export interface FileVersion {
  id: string
  path: string
  content: string
  createdAt: number
  createdBy: string
  diff?: string
}

export interface StorageServiceInterface {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
}

export interface SyncServiceInterface {
  status: 'idle' | 'syncing' | 'success' | 'error' | 'offline'
  sync(): Promise<void>
  resolveConflict(id: string, resolution: 'local' | 'remote'): Promise<void>
  getHistory(): Promise<SyncRecord[]>
}

export interface SyncRecord {
  id: string
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete'
  timestamp: number
  status: 'pending' | 'committed' | 'failed'
  errorMessage?: string
}

// ── Keyboard Shortcuts Registry (Doc 04 & 05) ──

export interface ShortcutDef {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  labelKey: string
  action: string
}

export const KEYBOARD_SHORTCUTS: ShortcutDef[] = [
  { key: 'Escape', labelKey: 'back', action: 'back' },
  { key: '1', ctrl: true, labelKey: 'preview', action: 'preview' },
  { key: '2', ctrl: true, labelKey: 'code', action: 'code' },
  { key: ',', ctrl: true, labelKey: 'settings', action: 'settings' },
  { key: 'f', ctrl: true, shift: true, labelKey: 'search', action: 'search' },
  { key: 'p', ctrl: true, shift: true, labelKey: 'projects', action: 'projects' },
  { key: 'n', ctrl: true, shift: true, labelKey: 'notifications', action: 'notifications' },
  { key: 'g', ctrl: true, shift: true, labelKey: 'github', action: 'github' },
  { key: 's', ctrl: true, shift: true, labelKey: 'share', action: 'share' },
  { key: 'd', ctrl: true, shift: true, labelKey: 'deploy', action: 'deploy' },
  { key: 'q', ctrl: true, shift: true, labelKey: 'quickActions', action: 'quickActions' },
  { key: 'l', ctrl: true, shift: true, labelKey: 'language', action: 'language' },
  { key: 'm', ctrl: true, shift: true, labelKey: 'more', action: 'more' },
  { key: 'a', ctrl: true, shift: true, labelKey: 'aiSettings', action: 'modelSettings' },
  { key: 't', ctrl: true, shift: true, labelKey: 'terminal', action: 'terminal' },
  { key: 'k', ctrl: true, labelKey: 'scCommandPalette', action: 'commandPalette' },
  // Ctrl+Alt feature panels
  { key: 'r', ctrl: true, alt: true, labelKey: 'rcTitle', action: 'realtimeCollab' },
  { key: 's', ctrl: true, alt: true, labelKey: 'sbTitle', action: 'codeSandbox' },
  { key: 'q', ctrl: true, alt: true, labelKey: 'vqTitle', action: 'visualQueryBuilder' },
]