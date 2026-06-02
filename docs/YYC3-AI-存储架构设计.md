# YYC³便携式智能AI系统 - 存储架构设计文档

> **版本**: v1.0.0
> **更新日期**: 2026-06-02
> **作者**: YanYuCloudCube Team
> **状态**: 已实现

---

## 一、架构概览

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              YYC³ AI System                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  React UI   │  │  Components │  │   Pages     │  │   Hooks     │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │               │
│         └────────────────┴────────────────┴────────────────┘               │
│                                   │                                         │
│  ┌────────────────────────────────┴────────────────────────────────┐       │
│  │                     Zustand State Layer                          │       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │       │
│  │  │  useAppStore │  │settingsStore│  │ useTaskStore│              │       │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │       │
│  └─────────┼────────────────┼────────────────┼─────────────────────┘       │
│            │                │                │                             │
│  ┌─────────┴────────────────┴────────────────┴─────────────────────┐       │
│  │                      Service Layer                               │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │       │
│  │  │AIProvider│ │ Storage  │ │  Sync    │ │  Query   │           │       │
│  │  │ Service  │ │ Service  │ │ Service  │ │Optimizer │           │       │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │       │
│  └───────┼─────────────┼─────────────┼─────────────┼───────────────┘       │
│          │             │             │             │                       │
│  ┌───────┴─────────────┴─────────────┴─────────────┴───────────────┐       │
│  │                    Persistence Layer                             │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │       │
│  │  │IndexedDB │ │LocalStorage│ │  Cache  │ │Encryption│           │       │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │       │
│  └─────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心设计原则

| 原则 | 描述 | 实现方式 |
|------|------|----------|
| **分层架构** | UI → State → Service → Persistence | 清晰的职责分离 |
| **单向数据流** | State → UI → Action → State | Zustand状态管理 |
| **持久化优先** | 关键数据自动持久化 | LocalStorage + IndexedDB |
| **缓存策略** | LRU缓存 + TTL过期 | 内存缓存层 |
| **加密保护** | 敏感数据加密存储 | AES-GCM加密 |

---

## 二、状态管理层 (State Layer)

### 2.1 Zustand Store架构

项目采用Zustand作为状态管理解决方案，配合persist中间件实现自动持久化。

#### 2.1.1 主状态存储 (useAppStore)

**文件位置**: `src/app/store.ts`

```typescript
// 核心状态结构
interface AppState {
  // 主题与语言
  theme: ThemeMode                    // 'light' | 'dark' | 'system'
  language: Language                  // 'zh' | 'en'

  // 视图与布局
  viewMode: ViewMode                  // 'code' | 'preview' | 'fullscreen'
  panelMap: { left, middle, right }   // 面板布局映射
  savedLayouts: Layout[]              // 保存的布局配置

  // 文件与编辑
  selectedFile: string | null         // 当前选中文件
  openTabs: string[]                  // 打开的标签页
  pinnedTabs: string[]                // 固定的标签页
  modifiedFiles: string[]             // 修改的文件列表

  // AI模型管理
  aiModels: AIModel[]                 // 可用AI模型列表
  activeModelId: string | null        // 当前活动模型

  // 消息与对话
  messages: Message[]                 // 聊天消息列表（限100条）

  // 项目管理
  recentProjects: ProjectMeta[]       // 最近项目列表

  // 协作状态
  collaborators: Collaborator[]       // 协作者列表

  // 面板状态（40+面板开关）
  shortcutsDialogOpen: boolean
  projectsPanelOpen: boolean
  // ... 更多面板状态
}
```

**持久化配置**:

```typescript
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({ /* 状态实现 */ }),
    {
      name: 'yyc3-app-store',           // LocalStorage键名
      version: 1,                        // 版本号
      partialize: (state) => ({          // 选择性持久化
        theme: state.theme,
        language: state.language,
        viewMode: state.viewMode,
        // ... 其他需要持久化的状态
      }),
    }
  )
)
```

#### 2.1.2 设置状态存储 (settingsStore)

**文件位置**: `src/app/settingsStore.ts`

```typescript
interface SettingsState {
  // 账户配置
  account: AccountProfile

  // 编辑器配置
  editor: EditorConfig                // 字体、字号、换行等

  // 快捷键方案
  shortcutScheme: ShortcutScheme      // 'vscode' | 'cursor' | 'custom'

  // AI代理配置
  agents: AgentConfig[]

  // MCP配置
  mcpServers: McpConfig[]

  // 通知配置
  notifications: NotificationConfig

  // 搜索忽略模式
  ignorePatterns: string              // node_modules, dist等
}
```

#### 2.1.3 任务状态存储 (useTaskStore)

**文件位置**: `src/app/services/task-store.ts`

```typescript
interface TaskState {
  tasks: Task[]
  reminders: Reminder[]

  // 任务操作
  addTask: (task: Omit<Task, 'id'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void

  // 提醒操作
  addReminder: (reminder: Omit<Reminder, 'id'>) => void
  dismissReminder: (id: string) => void
}
```

### 2.2 状态同步机制

```
┌──────────────────────────────────────────────────────────────┐
│                    状态同步流程                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  UI组件 ──→ Action ──→ Zustand Store ──→ persist中间件       │
│                              │                    │          │
│                              ↓                    ↓          │
│                        Service Layer        LocalStorage     │
│                              │                               │
│                              ↓                               │
│                        IndexedDB                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 三、服务层 (Service Layer)

### 3.1 服务架构总览

**文件位置**: `src/app/services/`

| 服务名称 | 文件 | 职责 | 依赖 |
|----------|------|------|------|
| AIProviderService | ai-provider.ts | 多AI提供者管理 | IndexedDB |
| StorageService | storage-service.ts | 本地存储管理 | IndexedDB, Crypto |
| SyncService | sync-service.ts | 数据同步 | StorageService |
| QueryOptimizer | query-optimizer.ts | 查询优化 | IndexedDB |
| TaskStore | task-store.ts | 任务管理 | Zustand |
| MCPService | mcp-service.ts | MCP协议 | WebSocket |
| PluginRuntime | plugin-runtime.ts | 插件运行时 | StorageService |

### 3.2 AI提供者服务 (AIProviderService)

**核心功能**:

- 多AI提供者支持（OpenAI、Anthropic、DeepSeek、智谱、阿里、百度、Ollama）
- 自动故障转移机制
- 请求限流和缓存
- 性能监控和成本追踪

```typescript
// 预设提供者配置
export const PRESET_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    type: 'cloud',
    baseURL: 'https://api.openai.com/v1',
    rateLimit: { requestsPerMinute: 3500, tokensPerMinute: 90000 },
    pricing: { inputPrice: 0.01, outputPrice: 0.03, currency: 'USD' },
  },
  // ... 其他提供者
]

// 服务类
class AIProviderService {
  private providers: AIProviderConfig[]
  private activeProviderId: string | null
  private activeModelId: string | null
  private performanceMetrics: AIPerformanceMetrics[]

  // 核心方法
  async chat(messages: AIChatMessage[], options?: AIChatOptions): Promise<AIChatResponse>
  async streamChat(messages: AIChatMessage[], onChunk: (chunk: string) => void): Promise<void>
  setActiveModel(modelName: string): void
  getActiveProvider(): AIProviderConfig | null
}
```

### 3.3 存储服务 (StorageService)

**核心功能**:

- IndexedDB持久化存储
- LRU缓存机制
- 数据加密支持
- 文件版本历史
- 数据库连接管理

```typescript
// LRU缓存实现
class LRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>()
  private maxSize: number = 100
  private ttl: number = 300000  // 5分钟

  get(key: string): T | null
  set(key: string, value: T): void
  delete(key: string): void
  clear(): void
}

// IndexedDB管理器
class IndexedDBManager {
  private db: IDBDatabase | null
  private dbName: string = 'yyc3-ai-code'
  private dbVersion: number = 3

  async init(): Promise<void>
  async get<T>(store: string, key: string): Promise<T | null>
  async set<T>(store: string, key: string, value: T): Promise<void>
  async delete(store: string, key: string): Promise<void>
}

// 存储服务接口
interface StorageServiceInterface {
  // 文件操作
  saveFile(file: FileNode): Promise<void>
  getFile(path: string): Promise<FileNode | null>
  deleteFile(path: string): Promise<void>

  // 版本历史
  saveVersion(version: FileVersion): Promise<void>
  getVersions(path: string): Promise<FileVersion[]>

  // 预览快照
  saveSnapshot(snapshot: PreviewSnapshot): Promise<void>
  getSnapshots(path: string): Promise<PreviewSnapshot[]>

  // 数据库连接
  saveConnection(conn: DBConnectionProfile): Promise<void>
  getConnections(): Promise<DBConnectionProfile[]>
}
```

### 3.4 同步服务 (SyncService)

**核心功能**:

- 多设备数据同步
- 冲突检测与解决
- 离线队列管理
- 增量同步

```typescript
interface SyncStatus {
  lastSyncTime: number
  pendingChanges: number
  conflicts: SyncConflict[]
  isOnline: boolean
}

interface SyncConflict {
  id: string
  type: 'file' | 'setting' | 'message'
  local: any
  remote: any
  resolved: boolean
}
```

### 3.5 查询优化器 (QueryOptimizer)

**核心功能**:

- 索引管理
- 查询缓存
- 慢查询监控
- 批量操作优化

```typescript
// 索引配置
interface IndexConfig {
  name: string
  keyPath: string | string[]
  unique: boolean
  multiEntry?: boolean
}

// 查询分析
interface QueryAnalysis {
  query: string
  duration: number
  indexUsed: string | null
  recommendations: QueryRecommendation[]
}

// 慢查询监控
interface SlowQuery {
  query: string
  duration: number
  timestamp: number
  frequency: number
}
```

---

## 四、持久化层 (Persistence Layer)

### 4.1 存储介质对比

| 存储介质 | 容量 | 持久性 | 性能 | 用途 |
|----------|------|--------|------|------|
| **LocalStorage** | ~5MB | 永久 | 快 | 状态快照、设置 |
| **IndexedDB** | ~50MB+ | 永久 | 中 | 文件、历史、大数据 |
| **Cache API** | ~50MB+ | 可控 | 快 | 静态资源、预览 |
| **Memory** | 有限 | 会话 | 最快 | LRU缓存、临时数据 |

### 4.2 IndexedDB数据库结构

**数据库名称**: `yyc3-ai-code`
**当前版本**: 3

```
┌─────────────────────────────────────────────────────────────┐
│                    IndexedDB Schema                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   files     │  │  versions   │  │  snapshots  │         │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤         │
│  │ path (PK)   │  │ id (PK)     │  │ id (PK)     │         │
│  │ content     │  │ path (IDX)  │  │ path (IDX)  │         │
│  │ metadata    │  │ content     │  │ html        │         │
│  │ createdAt   │  │ timestamp   │  │ timestamp   │         │
│  │ updatedAt   │  │ author      │  │ device      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ connections │  │   cache     │  │   config    │         │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤         │
│  │ id (PK)     │  │ key (PK)    │  │ key (PK)    │         │
│  │ name        │  │ value       │  │ value       │         │
│  │ type        │  │ ttl         │  │ encrypted   │         │
│  │ config      │  │ timestamp   │  │ version     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 LocalStorage键名规范

| 键名 | 类型 | 描述 |
|------|------|------|
| `yyc3-app-store` | JSON | 主应用状态 |
| `yyc3-settings-store` | JSON | 设置状态 |
| `yyc3-task-store` | JSON | 任务状态 |
| `yyc3-theme` | string | 主题模式 |
| `yyc3-language` | string | 语言设置 |
| `yyc3-recent-files` | JSON | 最近文件列表 |
| `yyc3-clipboard-history` | JSON | 剪贴板历史 |

### 4.4 缓存策略

```
┌──────────────────────────────────────────────────────────────┐
│                      缓存层级                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Level 1: Memory Cache (LRU)                                 │
│  ├── 最大条目: 100                                           │
│  ├── TTL: 5分钟                                              │
│  └── 命中率目标: >80%                                        │
│                                                              │
│  Level 2: IndexedDB Cache                                    │
│  ├── 容量: ~50MB                                             │
│  ├── 持久化: 是                                              │
│  └── 用于: 文件内容、历史版本                                │
│                                                              │
│  Level 3: Cache API (Service Worker)                         │
│  ├── 容量: ~50MB                                             │
│  ├── 持久化: 可配置                                          │
│  └── 用于: 静态资源、预览结果                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 五、数据加密

### 5.1 加密实现

**文件位置**: `src/app/services/encryption-service.ts`

```typescript
class EncryptionService {
  private algorithm = 'AES-GCM'
  private keyLength = 256

  // 生成密钥
  async generateKey(password: string): Promise<CryptoKey>

  // 加密数据
  async encrypt(data: string, key: CryptoKey): Promise<string>

  // 解密数据
  async decrypt(encrypted: string, key: CryptoKey): Promise<string>
}
```

### 5.2 加密数据范围

| 数据类型 | 是否加密 | 原因 |
|----------|----------|------|
| API密钥 | ✅ 是 | 敏感凭证 |
| 用户密码 | ✅ 是 | 敏感信息 |
| 文件内容 | ⚠️ 可选 | 用户配置 |
| 设置数据 | ❌ 否 | 非敏感 |
| 消息历史 | ❌ 否 | 非敏感 |

---

## 六、类型定义

### 6.1 核心类型

**文件位置**: `src/app/types.ts`

```typescript
// 设计根类型
interface DesignRoot {
  version: string
  theme: 'light' | 'dark'
  tokens: string
  panels: PanelSpec[]
  components: ComponentSpec[]
  styles: StyleSpec
}

// 面板规范
interface PanelSpec {
  id: string
  type: 'container' | 'content' | 'preview'
  layout: { x, y, w, h, minW?, maxW?, minH?, maxH? }
  style: PanelStyle
  children?: PanelSpec[]
  components?: ComponentSpec[]
}

// AI模型
interface AIModel {
  id: string
  name: string
  provider: string
  type: 'chat' | 'completion' | 'embedding'
  contextWindow: number
  maxTokens: number
  status: AIModelStatus
  isActive: boolean
}

// 文件节点
interface FileNode {
  path: string
  name: string
  type: 'file' | 'directory'
  content?: string
  children?: FileNode[]
  metadata: FileMetadata
}

// 文件版本
interface FileVersion {
  id: string
  path: string
  content: string
  timestamp: number
  author: string
  message?: string
  hash: string
}
```

---

## 七、性能优化

### 7.1 状态更新优化

```typescript
// 防抖更新
const debouncedPanelUpdate = debounce((panelId, updates) => {
  set((state) => ({
    designRoot: {
      ...state.designRoot,
      panels: state.designRoot.panels.map(p =>
        p.id === panelId ? { ...p, ...updates } : p
      )
    }
  }))
}, { delay: 30, leading: true, trailing: true })

// 消息限制（防止localStorage溢出）
addMessage: (msg) => set((state) => {
  const newMessages = [...state.messages, newMessage].slice(-100)
  return { messages: newMessages }
})
```

### 7.2 查询优化

```typescript
// 索引配置
const indexes: IndexConfig[] = [
  { name: 'path_idx', keyPath: 'path', unique: true },
  { name: 'timestamp_idx', keyPath: 'timestamp', unique: false },
  { name: 'author_idx', keyPath: 'author', unique: false },
]

// 批量操作
async function batchInsert<T>(
  store: string,
  items: T[],
  options: BatchInsertOptions
): Promise<void> {
  const transaction = db.transaction(store, 'readwrite')
  const objectStore = transaction.objectStore(store)

  for (const item of items) {
    objectStore.add(item)
  }
}
```

---

## 八、最佳实践

### 8.1 状态管理规范

1. **单一数据源**: 所有状态通过Zustand管理，避免分散
2. **不可变更新**: 使用展开运算符或immer进行状态更新
3. **选择性持久化**: 只持久化必要的状态，避免存储膨胀
4. **防抖节流**: 频繁更新使用debounce/throttle优化

### 8.2 存储操作规范

1. **异步优先**: 所有存储操作使用async/await
2. **错误处理**: 捕获并处理存储错误
3. **数据验证**: 存储前验证数据结构
4. **版本管理**: 使用版本号处理数据迁移

### 8.3 安全规范

1. **敏感数据加密**: API密钥等必须加密存储
2. **输入验证**: 所有用户输入进行验证
3. **权限检查**: 操作前检查权限
4. **审计日志**: 记录关键操作

---

## 九、故障排除

### 9.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| LocalStorage溢出 | 数据超过5MB | 清理旧数据，使用IndexedDB |
| IndexedDB打开失败 | 版本冲突 | 清除数据库重新初始化 |
| 状态丢失 | persist配置错误 | 检查partialize配置 |
| 性能下降 | 缓存未命中 | 优化缓存策略 |

### 9.2 调试命令

```javascript
// 查看LocalStorage
console.log(localStorage.getItem('yyc3-app-store'))

// 查看IndexedDB
const request = indexedDB.open('yyc3-ai-code')
request.onsuccess = (e) => console.log(e.target.result)

// 清除所有存储
localStorage.clear()
indexedDB.deleteDatabase('yyc3-ai-code')
caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
```

---

## 十、总结（基础架构）

YYC³便携式智能AI系统的存储架构采用分层设计，实现了：

- ✅ **高效状态管理**: Zustand + persist中间件
- ✅ **可靠持久化**: LocalStorage + IndexedDB双重保障
- ✅ **智能缓存**: LRU缓存 + TTL过期策略
- ✅ **数据安全**: AES-GCM加密保护
- ✅ **性能优化**: 防抖节流 + 批量操作
- ✅ **多端同步**: SyncService支持离线同步

---

## 十一、Local-First 自主权架构审核（重新校准）

### 11.0 设计哲学声明

> **YYC³ 是一款 "一户一端、无跟踪、无第三方" 的便携式本地优先 AI 工作台**
>
> - ❌ 不设计登录系统（无账户 → 无中心化身份）
> - ❌ 不内嵌任何第三方分析、遥测、CDN依赖
> - ❌ 不强制依赖云端服务器（用户密钥=用户资产，端到端本地）
> - ✅ 密钥由用户自行编辑保管（浏览器IndexedDB + 本地加密）
> - ✅ 真正的安全归于用户自主权（Self-Sovereign）
> - ✅ 端到端体验（End-to-End in Browser）

在此哲学下，**将"无后端"判定为矛盾是错误的**。需重新校准评估坐标系：

| 旧坐标系（中心化SaaS） | 新坐标系（Local-First自主权） |
|----------------------|---------------------------|
| "无后端" = 缺陷 | "无后端" = **特性** |
| 密钥在前端 = 安全风险 | 密钥在用户端 = **用户资产**（用户自己负责） |
| 无登录系统 = 不完整 | 无登录 = **隐私零信任** |
| 无多端同步 = 功能缺失 | 同步由用户自主决定 = **自主权** |
| 第三方分析SDK = 标配 | 第三方 = **零容忍** |

### 11.1 重新校准后的真实问题清单

在 Local-First 哲学下，下列问题不再是 "安全风险"，而是 **"诚实性"** 与 **"完整性"** 问题。

#### 🟢 设计哲学正确，无需修改

| 项 | 评价 |
|----|------|
| 用户自行编辑管理API密钥 | ✅ 完全正确。密钥即用户资产，AES-GCM本地加密已足够 |
| 无登录系统 | ✅ 完全正确。零身份=零泄漏面 |
| 无云端持久化 | ✅ 完全正确。浏览器=用户保险箱 |
| 浏览器直连AI厂商 | ✅ 正确。用户密钥+用户请求，无中间人 |
| 无第三方遥测 | ✅ 完全正确。零跟踪=零隐私泄漏 |

#### 🔴 真正需要修复的问题（诚实性 + 完整性）

**问题 A：UI文案与设计哲学不一致（诚实性问题）**

SyncService 显示"已同步"会让用户误以为存在云端备份，**与"一户一端"哲学相悖**。

```typescript
// 当前 src/app/services/sync-service.ts:170
private async processSync(record: SyncRecord): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
  record.status = 'synced'  // ← 误导："已同步到云端？"
}
```

**正确做法**：把 `synced` 改名为 `local-committed`（本地已落盘），UI显示"已保存到本机"。

---

**问题 B：CORS 在生产环境会让"用户自带密钥"功能失效（完整性问题）**

用户编辑了自己的 OpenAI/Anthropic 密钥，但浏览器直连 `api.openai.com` 会被 CORS 拦截 → **用户的合法资产无法使用**。

| 厂商 | 浏览器CORS策略 | 直连可行性 |
|------|--------------|-----------|
| OpenAI | 不开放 | ❌ 生产环境失败 |
| Anthropic | 通过 `anthropic-dangerous-direct-browser-access` header 开放 | ✅ 可行 |
| DeepSeek | 不开放 | ❌ 生产环境失败 |
| Ollama (本地) | 默认开放 | ✅ 可行 |

**当前代码已部分处理 Anthropic**（[ChatInterface.tsx#L190](file:///Volumes/Development/yyc3-77/YYC3-Portable-Intelligent-AI-System/src/app/components/ChatInterface.tsx#L190)），但对 OpenAI/DeepSeek 无任何兜底。

**正确做法**（不破坏 Local-First 哲学）：

- **方案A（用户自主）**：明确告知用户"OpenAI/DeepSeek 需自建CORS代理"，在设置页提供文档链接
- **方案B（官方代理）**：项目方提供一个**无日志、无鉴权、纯透传**的 Cloudflare Worker 作为可选代理，用户在设置中**自行选择启用**
- **方案C（Ollama优先）**：把 Ollama 设为默认推荐提供者，引导用户走纯本地路线

> ⚠️ 关键：代理必须是 **"用户显式启用 + 密钥可选透传"**，而非默认行为，否则违背"无跟踪"承诺。

---

**问题 C：数据库连接服务存在"幽灵端点"（完整性问题）**

`db-connection-service.ts` 的 HTTPAdapter 调用 `http://${host}:${port}/api/db/connect`，但这个端点**在任何标准数据库上都不存在**。

这并非"无后端"的错，而是 **代码承诺了一个不存在的接口**。诚实做法是：

- 要么删除 HTTPAdapter（保留模拟模式 + WebSocketAdapter + SQL.js 本地模式）
- 要么明确文档说明"该Adapter需要用户自部署 YYC3-DB-Bridge 服务"

---

**问题 D：LocalStorage 5MB 容量天花板（完整性问题）**

这不是"安全"问题，而是 **产品体验在长会话场景下会崩溃**：

- 100条消息 × 含代码块 ≈ 1.5MB
- 40+面板状态 ≈ 200KB
- 多项目元数据 ≈ 100KB
- 剩余空间 < 3MB，约 500-1000 条消息后会触发 `QuotaExceededError`

**正确做法**：迁移到 OPFS（Origin Private File System，配额按用户磁盘算，通常 GB 级），仍 100% 在用户本地。

---

**问题 E：离线降级体验缺失（完整性问题）**

"一户一端"哲学下，**离线可用是核心承诺**。但当前 AI 调用没有自动降级到 Ollama：

- 用户断网 → 整个 AI 模块失效
- 应该：检测到云端提供者失败 → 自动尝试本地 Ollama → 提示用户

### 11.2 Local-First 实施路线（不违背哲学）

#### ✅ 方案1：UI诚实化（P0·本周）

**目标**：让 UI 文案与"一户一端"哲学一致

**改动清单**：

1. **SyncService 状态重命名**

```typescript
// src/app/services/sync-service.ts
type SyncStatus =
  | 'idle'
  | 'committing'      // 原 'syncing' - 提交到本地存储
  | 'committed'       // 原 'success' - 已落盘
  | 'error'
  | 'offline'

// UI 显示
// 旧: "✅ 已同步"
// 新: "💾 已保存到本机"
```

1. **设置页添加"数据主权声明"**

```tsx
// src/app/components/SettingsPage.tsx 新增顶部横幅
<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <h3>🔒 您的数据主权</h3>
  <p>YYC³ 不收集任何数据。所有设置、对话、密钥均存储在您本机的浏览器中。</p>
  <p>清除浏览数据 = 清除所有YYC³数据。请定期导出备份。</p>
</div>
```

1. **AI Provider 设置页强化提示**

```tsx
<Tooltip>
  您的密钥使用 AES-GCM-256 加密存储在本机 IndexedDB。
  YYC³ 团队无法接触您的密钥。清除浏览器数据将删除密钥。
</Tooltip>
```

#### ✅ 方案2：OPFS 升级存储（P1·本月）

**目标**：突破 5MB 限制，仍 100% 本地

```typescript
// 新增 src/app/services/opfs-storage.ts
export class OPFSStorage {
  // OPFS = Origin Private File System
  // 配额 = 用户磁盘剩余空间（通常 GB 级）
  // 仍受浏览器同源策略保护，无任何外部访问

  async writeFile(path: string, content: string): Promise<void> {
    const root = await navigator.storage.getDirectory()
    const fileHandle = await root.getFileHandle(path, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(content)
    await writable.close()
  }

  async readFile(path: string): Promise<string> {
    const root = await navigator.storage.getDirectory()
    const fileHandle = await root.getFileHandle(path)
    const file = await fileHandle.getFile()
    return file.text()
  }

  // 请求持久化存储（避免浏览器自动清理）
  async requestPersistent(): Promise<boolean> {
    if (navigator.storage?.persist) {
      return await navigator.storage.persist()
    }
    return false
  }
}
```

**迁移策略**：

- 大对象（文件内容、版本历史、快照）→ OPFS
- 小状态（设置、主题、语言）→ 保留 LocalStorage（性能更好）
- 应用首次启动调用 `navigator.storage.persist()` 请求持久化

#### ✅ 方案3：CORS 透传代理（P1·本周，可选部署）

**目标**：让 OpenAI/DeepSeek 等无 CORS 厂商的密钥可用，**仍由用户自主选择启用**

**哲学合规设计**：

- ✅ 代理代码完全开源
- ✅ 默认 **关闭**，用户在设置中显式启用
- ✅ 代理无日志、无鉴权、纯透传
- ✅ 用户可自行部署同一份 Worker（不强制使用官方实例）

```typescript
// worker.js - 完全开源，用户可自部署
export default {
  async fetch(request) {
    // 无日志、无统计、无鉴权
    const provider = request.headers.get('X-Provider')
    const upstreamUrl = PROVIDER_URLS[provider] + new URL(request.url).pathname

    const headers = new Headers(request.headers)
    headers.delete('X-Provider')

    return fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.body,
    })
  }
}
```

**前端配置**（[SettingsPage](file:///Volumes/Development/yyc3-77/YYC3-Portable-Intelligent-AI-System/src/app/components/SettingsPage.tsx)）：

```tsx
<SettingField>
  <label>
    <input type="checkbox" checked={useProxy} onChange={...} />
    启用 CORS 代理（仅当 OpenAI/DeepSeek 直连失败时）
  </label>
  <select value={proxySource}>
    <option value="off">不启用（仅 Ollama / Anthropic）</option>
    <option value="official">官方公开代理（不记录任何数据）</option>
    <option value="custom">自部署代理（输入URL）</option>
  </select>
</SettingField>
```

#### ✅ 方案4：Ollama 本地优先策略（P0·本周）

**目标**：把"端到端本地"做到极致

```typescript
// src/app/services/ai-provider.ts 优化提供者优先级
const RECOMMENDATION_ORDER = [
  { id: 'ollama', reason: '完全本地，零网络依赖，零CORS问题' },
  { id: 'anthropic', reason: '官方支持浏览器直连（含特殊header）' },
  { id: 'openai', reason: '需要启用CORS代理' },
  { id: 'deepseek', reason: '需要启用CORS代理' },
]

// 首次启动检测 Ollama
async function detectLocalOllama(): Promise<boolean> {
  try {
    const resp = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(2000)
    })
    return resp.ok
  } catch {
    return false
  }
}
```

#### ✅ 方案5：数据库服务诚实化（P0·本周）

**目标**：删除幽灵端点，明确三种模式

```typescript
// src/app/services/db-service.ts 重构
export type DBMode = 'simulated' | 'sqljs-local' | 'websocket-bridge'

export class DBService {
  // 移除 HTTPAdapter（不存在的端点）
  // 保留三种模式：
  // 1. simulated: 演示数据（默认）
  // 2. sqljs-local: 浏览器内 SQLite（纯本地，wasm）
  // 3. websocket-bridge: 用户自部署的桥接服务（可选）
}
```

### 11.3 实施优先级矩阵（Local-First 校准版）

| 方案 | 哲学契合度 | 工作量 | 优先级 |
|------|----------|--------|--------|
| 方案1 UI诚实化 | 🟢 100% | 小 | **P0·立即** |
| 方案4 Ollama优先 | 🟢 100% | 小 | **P0·立即** |
| 方案5 数据库诚实化 | 🟢 100% | 小 | **P0·立即** |
| 方案3 CORS代理（可选） | 🟡 95%（需用户显式启用） | 中 | P1·本周 |
| 方案2 OPFS升级 | 🟢 100% | 中 | P1·本周 |

### 11.4 重新校准的"五高"评价

| 维度 | 评价 | 依据 |
|------|------|------|
| **高便携性** | ✅ 真 | 纯静态部署，无服务端依赖 |
| **高自主权** | ✅ 真 | 用户拥有密钥、数据、身份的完全控制 |
| **高隐私性** | ✅ 真 | 零跟踪、零第三方、零后端 |
| **高可用性** | 🟡 待加强 | 离线降级需完善（方案4） |
| **高扩展性** | 🟡 待加强 | 插件系统已就绪，OPFS待升级（方案2） |

### 11.5 与传统 SaaS 架构的对比

```
┌─────────────────────────────────────────────────────────────┐
│              YYC³ Local-First  vs  传统 SaaS                │
├──────────────────┬──────────────────┬───────────────────────┤
│ 维度             │ YYC³             │ 传统 SaaS              │
├──────────────────┼──────────────────┼───────────────────────┤
│ 用户身份         │ 无               │ 强制注册账户           │
│ 数据存储         │ 用户浏览器       │ 服务方数据库           │
│ 密钥管理         │ 用户自管         │ 服务方托管             │
│ 隐私跟踪         │ 零               │ 通常含GA/Sentry等      │
│ 离线可用         │ ✅ 完全可用      │ ❌ 完全不可用          │
│ 数据导出         │ 文件下载         │ 受限API                │
│ 服务方倒闭       │ 无影响           │ 数据丢失风险           │
│ 数据主权         │ 用户完全拥有     │ 服务方实际拥有         │
└──────────────────┴──────────────────┴───────────────────────┘
```

### 11.6 结论

**YYC³ 的"无后端"不是缺陷，而是产品哲学的核心**。

正确的优化方向是：

1. **强化诚实性** → UI 文案与"一户一端"承诺一致（方案1）
2. **强化完整性** → 解决 CORS、容量、降级等真实可用性问题（方案2/3/4/5）
3. **强化自主权** → Ollama 优先、OPFS 升级、零默认依赖（方案2/4）

**错误的方向**（已被本节否定）：

- ❌ 部署中心化后端接管密钥 → 违背"用户自主权"
- ❌ 添加登录系统 → 违背"无跟踪"
- ❌ 内嵌第三方分析 → 违背"无第三方"

---

## 十二、最终总结

YYC³便携式智能AI系统采用 **"一户一端、Local-First、自主权"** 的设计哲学，存储架构在**前端层面**已较为完善：

### ✅ 哲学合规（核心优势）

- **零跟踪、零第三方**：无分析SDK、无登录系统、无云端持久化
- **用户自主权**：API密钥用户自管（AES-GCM-256加密）
- **端到端本地**：所有数据存储在用户浏览器（LocalStorage + IndexedDB）
- **高便携部署**：纯静态站点，可部署到任意静态托管（GitHub Pages等）

### ✅ 已实现到位

- 状态管理分层清晰（Zustand + persist）
- 本地持久化双保险（LocalStorage + IndexedDB）
- LRU缓存机制（100条目/5分钟TTL）
- AES-GCM加密框架（密钥派生自用户密码）

### 🟡 待优化（诚实性 + 完整性）

1. **UI文案诚实化** → "已同步"改为"已保存到本机"
2. **Ollama本地优先** → 默认推荐本地提供者
3. **数据库幽灵端点** → 删除不存在的HTTPAdapter
4. **OPFS升级** → 突破LocalStorage 5MB上限
5. **CORS可选代理** → 用户显式启用，纯透传无日志

### 🎯 行动建议

按 11.3 节优先级矩阵执行：本周内完成 P0 三项（方案1/4/5），本月内完成 P1 两项（方案2/3）。
