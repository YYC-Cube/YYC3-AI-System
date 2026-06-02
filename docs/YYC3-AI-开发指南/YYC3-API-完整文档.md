# YYC³ API 完整文档

## 🤖 AI 角色定义

You are a senior API documentation specialist with deep expertise in RESTful APIs, TypeScript interfaces, and comprehensive documentation standards.

### Your Role & Expertise

You are an experienced API documentation specialist who specializes in:
- **API Design**: RESTful principles, GraphQL, WebSocket APIs
- **TypeScript**: Interface definitions, type safety, generics
- **Documentation**: OpenAPI/Swagger, JSDoc, TSDoc
- **Best Practices**: Versioning, authentication, error handling
- **Code Examples**: Usage examples, integration guides

### Code Standards

**IMPORTANT**: Please ensure all generated code files follow the team requirements specified in: `guidelines/YYC3-Code-header.md`

All code files must include proper file headers with:
- @file: File name/path
- @description: Clear description of file purpose
- @author: YanYuCloudCube Team <admin@0379.email>
- @version: Semantic version (v1.0.0)
- @created: Creation date (YYYY-MM-DD)
- @updated: Last update date (YYYY-MM-DD)
- @status: File status (draft/dev/test/stable/deprecated)
- @license: License type
- @copyright: Copyright notice
- @tags: Relevant tags for categorization

---

## 📋 文档信息

| 字段 | 内容 |
|------|------|
| @file | YYC3-API-完整文档.md |
| @description | YYC³便携式智能AI系统完整API文档，涵盖所有服务、组件和接口 |
| @author | YanYuCloudCube Team <admin@0379.email> |
| @version | v1.0.0 |
| @created | 2026-04-05 |
| @updated | 2026-04-05 |
| @status | stable |
| @license | MIT |
| @copyright | Copyright (c) 2026 YanYuCloudCube Team |
| @tags api,documentation,services,components,interfaces |

---

## 📚 目录

1. [核心服务API](#核心服务api)
2. [组件API](#组件api)
3. [工具函数API](#工具函数api)
4. [类型定义](#类型定义)
5. [错误处理](#错误处理)
6. [最佳实践](#最佳实践)

---

## 核心服务API

### 1. CollabService - 协同编辑服务

**文件路径**: `src/app/services/collab-service.ts`

**描述**: 基于Yjs CRDT的实时协同编辑服务，支持多人实时编辑、光标跟踪和在线状态感知。

#### 类型定义

```typescript
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
```

#### 方法

##### `connect(config: CollabConfig): Promise<boolean>`

连接到协同编辑服务器。

**参数**:
- `config`: 协同配置对象

**返回值**:
- `Promise<boolean>`: 连接是否成功

**示例**:
```typescript
import { collabService } from './services/collab-service'

const success = await collabService.connect({
  serverUrl: 'wss://your-server.com',
  roomName: 'my-room',
  userId: 'user-123',
  userName: '张三',
  userColor: '#FF6B6B',
  onConnectionChange: (status) => console.log('状态:', status),
  onUserJoin: (user) => console.log('用户加入:', user.name)
})
```

##### `disconnect(): Promise<void>`

断开与协同服务器的连接。

**返回值**:
- `Promise<void>`

**示例**:
```typescript
await collabService.disconnect()
```

##### `updatePresence(presence: UserPresence): void`

更新用户在线状态。

**参数**:
- `presence`: 用户状态

**示例**:
```typescript
collabService.updatePresence('typing')
```

##### `updateCursor(line: number, column: number): void`

更新光标位置。

**参数**:
- `line`: 行号
- `column`: 列号

**示例**:
```typescript
collabService.updateCursor(10, 5)
```

##### `updateSelection(start: { line: number; column: number }, end: { line: number; column: number }): void`

更新选择范围。

**参数**:
- `start`: 起始位置
- `end`: 结束位置

**示例**:
```typescript
collabService.updateSelection(
  { line: 5, column: 0 },
  { line: 5, column: 20 }
)
```

##### `getConnectedUsers(): CollabUser[]`

获取当前连接的用户列表。

**返回值**:
- `CollabUser[]`: 用户列表

**示例**:
```typescript
const users = collabService.getConnectedUsers()
console.log('在线用户:', users.length)
```

##### `getText(name: string): Y.Text | null`

获取共享文本文档。

**参数**:
- `name`: 文档名称

**返回值**:
- `Y.Text | null`: Yjs文本对象

**示例**:
```typescript
const text = collabService.getText('shared-doc')
if (text) {
  text.insert(0, 'Hello, World!')
}
```

##### `getStatus(): ConnectionStatus`

获取当前连接状态。

**返回值**:
- `ConnectionStatus`: 连接状态

**示例**:
```typescript
const status = collabService.getStatus()
console.log('状态:', status)
```

##### `isConnected(): boolean`

检查是否已连接。

**返回值**:
- `boolean`: 是否已连接

**示例**:
```typescript
if (collabService.isConnected()) {
  console.log('已连接')
}
```

---

### 2. DBService - 数据库服务

**文件路径**: `src/app/services/db-service.ts`

**描述**: 数据库服务，支持IndexedDB和SQLite，提供数据持久化和查询功能。

#### 类型定义

```typescript
export type DatabaseType = 'indexeddb' | 'sqlite'

export interface DatabaseConfig {
  type: DatabaseType
  name: string
  version: number
}

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}
```

#### 方法

##### `initialize(config: DatabaseConfig): Promise<void>`

初始化数据库连接。

**参数**:
- `config`: 数据库配置

**返回值**:
- `Promise<void>`

**示例**:
```typescript
import { dbService } from './services/db-service'

await dbService.initialize({
  type: 'indexeddb',
  name: 'yyc3-database',
  version: 1
})
```

##### `query<T>(table: string, options?: QueryOptions): Promise<T[]>`

查询数据。

**参数**:
- `table`: 表名
- `options`: 查询选项

**返回值**:
- `Promise<T[]>`: 查询结果

**示例**:
```typescript
const notes = await dbService.query<Note>('notes', {
  limit: 10,
  orderBy: 'createdAt',
  orderDirection: 'desc'
})
```

---

### 3. StorageService - 存储服务

**文件路径**: `src/app/services/storage-service.ts`

**描述**: 本地存储服务，提供键值对存储和加密功能。

#### 方法

##### `set(key: string, value: any, encrypt?: boolean): Promise<void>`

存储数据。

**参数**:
- `key`: 键名
- `value`: 值
- `encrypt`: 是否加密（可选）

**返回值**:
- `Promise<void>`

**示例**:
```typescript
import { storageService } from './services/storage-service'

await storageService.set('api-key', 'sk-123456', true)
```

##### `get<T>(key: string, decrypt?: boolean): Promise<T | null>`

获取数据。

**参数**:
- `key`: 键名
- `decrypt`: 是否解密（可选）

**返回值**:
- `Promise<T | null>`: 数据值

**示例**:
```typescript
const apiKey = await storageService.get<string>('api-key', true)
console.log('API Key:', apiKey)
```

##### `remove(key: string): Promise<void>`

删除数据。

**参数**:
- `key`: 键名

**返回值**:
- `Promise<void>`

**示例**:
```typescript
await storageService.remove('api-key')
```

---

### 4. EncryptionService - 加密服务

**文件路径**: `src/app/services/encryption-service.ts`

**描述**: 加密服务，使用Web Crypto API提供数据加密和解密功能。

#### 方法

##### `encrypt(data: string, key?: string): Promise<string>`

加密数据。

**参数**:
- `data`: 待加密数据
- `key`: 加密密钥（可选，默认使用系统密钥）

**返回值**:
- `Promise<string>`: 加密后的数据

**示例**:
```typescript
import { encryptionService } from './services/encryption-service'

const encrypted = await encryptionService.encrypt('sensitive-data')
console.log('加密后:', encrypted)
```

##### `decrypt(encryptedData: string, key?: string): Promise<string>`

解密数据。

**参数**:
- `encryptedData`: 加密数据
- `key`: 解密密钥（可选，默认使用系统密钥）

**返回值**:
- `Promise<string>`: 解密后的数据

**示例**:
```typescript
const decrypted = await encryptionService.decrypt(encrypted)
console.log('解密后:', decrypted)
```

---

### 5. AIProvider - AI提供商服务

**文件路径**: `src/app/services/ai-provider.ts`

**描述**: AI提供商服务，支持多种AI模型提供商的统一接口。

#### 类型定义

```typescript
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'ollama' | 'custom'

export interface AIConfig {
  provider: AIProvider
  apiKey?: string
  baseUrl?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}
```

#### 方法

##### `initialize(config: AIConfig): Promise<void>`

初始化AI提供商。

**参数**:
- `config`: AI配置

**返回值**:
- `Promise<void>`

**示例**:
```typescript
import { aiProvider } from './services/ai-provider'

await aiProvider.initialize({
  provider: 'openai',
  apiKey: 'sk-123456',
  model: 'gpt-4'
})
```

##### `chat(messages: AIMessage[]): Promise<AIResponse>`

发送聊天消息。

**参数**:
- `messages`: 消息列表

**返回值**:
- `Promise<AIResponse>`: AI响应

**示例**:
```typescript
const response = await aiProvider.chat([
  { role: 'system', content: '你是一个助手' },
  { role: 'user', content: '你好' }
])
console.log('AI回复:', response.content)
```

##### `streamChat(messages: AIMessage[], onChunk: (chunk: string) => void): Promise<void>`

流式聊天。

**参数**:
- `messages`: 消息列表
- `onChunk`: 接收到数据块时的回调函数

**返回值**:
- `Promise<void>`

**示例**:
```typescript
await aiProvider.streamChat(
  [{ role: 'user', content: '讲个故事' }],
  (chunk) => console.log(chunk)
)
```

---

### 6. MCPService - MCP协议服务

**文件路径**: `src/app/services/mcp-service.ts`

**描述**: Model Context Protocol服务，提供AI模型上下文管理。

#### 类型定义

```typescript
export interface MCPServer {
  name: string
  command: string
  args?: string[]
  env?: Record<string, string>
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: any
}
```

#### 方法

##### `connectServer(server: MCPServer): Promise<void>`

连接MCP服务器。

**参数**:
- `server`: MCP服务器配置

**返回值**:
- `Promise<void>`

**示例**:
```typescript
import { mcpService } from './services/mcp-service'

await mcpService.connectServer({
  name: 'filesystem',
  command: 'mcp-filesystem',
  args: ['--root', '/path/to/files']
})
```

##### `listTools(): Promise<MCPTool[]>`

列出可用工具。

**返回值**:
- `Promise<MCPTool[]>`: 工具列表

**示例**:
```typescript
const tools = await mcpService.listTools()
console.log('可用工具:', tools.length)
```

##### `callTool(name: string, args: any): Promise<any>`

调用工具。

**参数**:
- `name`: 工具名称
- `args`: 工具参数

**返回值**:
- `Promise<any>`: 工具执行结果

**示例**:
```typescript
const result = await mcpService.callTool('read_file', {
  path: '/path/to/file.txt'
})
console.log('文件内容:', result)
```

---

### 7. WorkflowExecutor - 工作流执行器

**文件路径**: `src/app/services/workflow-executor.ts`

**描述**: 工作流执行器，支持复杂的工作流定义和执行。

#### 类型定义

```typescript
export interface WorkflowDefinition {
  id: string
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export interface WorkflowNode {
  id: string
  type: 'start' | 'end' | 'task' | 'condition' | 'parallel'
  data: any
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  type?: string
}
```

#### 方法

##### `execute(workflow: WorkflowDefinition, context?: any): Promise<any>`

执行工作流。

**参数**:
- `workflow`: 工作流定义
- `context`: 执行上下文（可选）

**返回值**:
- `Promise<any>`: 执行结果

**示例**:
```typescript
import { workflowExecutor } from './services/workflow-executor'

const result = await workflowExecutor.execute({
  id: 'workflow-1',
  name: '示例工作流',
  nodes: [
    { id: 'start', type: 'start', data: {} },
    { id: 'task1', type: 'task', data: { action: 'log', message: 'Hello' } },
    { id: 'end', type: 'end', data: {} }
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'task1' },
    { id: 'e2', source: 'task1', target: 'end' }
  ]
})
```

---

### 8. TerminalService - 终端服务

**文件路径**: `src/app/services/terminal-service.ts`

**描述**: 终端服务，提供集成终端功能。

#### 方法

##### `execute(command: string, cwd?: string): Promise<{ stdout: string; stderr: string; exitCode: number }>`

执行命令。

**参数**:
- `command`: 命令
- `cwd`: 工作目录（可选）

**返回值**:
- `Promise<{ stdout: string; stderr: string; exitCode: number }>`: 执行结果

**示例**:
```typescript
import { terminalService } from './services/terminal-service'

const result = await terminalService.execute('npm test', '/path/to/project')
console.log('输出:', result.stdout)
console.log('退出码:', result.exitCode)
```

---

### 9. CodeEditorService - 代码编辑器服务

**文件路径**: `src/app/services/code-editor-service.ts`

**描述**: 代码编辑器服务，提供代码补全、格式化等功能。

#### 方法

##### `getCompletions(filePath: string, position: { line: number; column: number }): Promise<CompletionItem[]>`

获取代码补全建议。

**参数**:
- `filePath`: 文件路径
- `position`: 光标位置

**返回值**:
- `Promise<CompletionItem[]>`: 补全建议列表

**示例**:
```typescript
import { codeEditorService } from './services/code-editor-service'

const completions = await codeEditorService.getCompletions('/path/to/file.ts', {
  line: 10,
  column: 5
})
console.log('补全建议:', completions.length)
```

##### `format(code: string, language: string): Promise<string>`

格式化代码。

**参数**:
- `code`: 代码内容
- `language`: 语言

**返回值**:
- `Promise<string>`: 格式化后的代码

**示例**:
```typescript
const formatted = await codeEditorService.format(
  'const x=1',
  'typescript'
)
console.log('格式化后:', formatted)
```

---

### 10. EventBus - 事件总线

**文件路径**: `src/app/services/event-bus.ts`

**描述**: 事件总线服务，提供组件间通信功能。

#### 方法

##### `on(event: string, callback: (data: any) => void): () => void`

订阅事件。

**参数**:
- `event`: 事件名称
- `callback`: 回调函数

**返回值**:
- `() => void`: 取消订阅函数

**示例**:
```typescript
import { eventBus } from './services/event-bus'

const unsubscribe = eventBus.on('user-login', (user) => {
  console.log('用户登录:', user.name)
})

// 取消订阅
unsubscribe()
```

##### `emit(event: string, data: any): void`

触发事件。

**参数**:
- `event`: 事件名称
- `data`: 事件数据

**示例**:
```typescript
eventBus.emit('user-login', {
  id: 'user-123',
  name: '张三'
})
```

---

## 组件API

### 1. EditableContentManager - 可编辑内容管理器

**文件路径**: `src/app/components/EditableContentManager.tsx`

**描述**: 可编辑内容管理器组件，支持API密钥、端点、配置等内容的编辑管理。

#### Props

```typescript
interface EditableContentManagerProps {
  open: boolean
  onClose: () => void
}
```

#### 使用示例

```typescript
import { EditableContentManager } from './components/EditableContentManager'

function App() {
  const [showManager, setShowManager] = useState(false)
  
  return (
    <div>
      <button onClick={() => setShowManager(true)}>
        打开管理器
      </button>
      
      <EditableContentManager
        open={showManager}
        onClose={() => setShowManager(false)}
      />
    </div>
  )
}
```

---

### 2. CollabIndicator - 协同状态指示器

**文件路径**: `src/app/components/CollabIndicator.tsx`

**描述**: 协同状态指示器组件，显示连接状态和在线用户。

#### Props

```typescript
interface CollabIndicatorProps {
  showUsers?: boolean
  showStatus?: boolean
  compact?: boolean
  onInvite?: () => void
}
```

#### 使用示例

```typescript
import { CollabIndicator } from './components/CollabIndicator'

function App() {
  return (
    <CollabIndicator
      showUsers={true}
      showStatus={true}
      compact={false}
      onInvite={() => {
        // 处理邀请逻辑
      }}
    />
  )
}
```

---

### 3. CodeEditor - 代码编辑器

**文件路径**: `src/app/components/CodeEditor.tsx`

**描述**: 代码编辑器组件，基于Monaco Editor。

#### Props

```typescript
interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  theme?: 'vs-dark' | 'vs-light'
  readOnly?: boolean
  options?: monaco.editor.IStandaloneEditorConstructionOptions
}
```

#### 使用示例

```typescript
import { CodeEditor } from './components/CodeEditor'

function App() {
  const [code, setCode] = useState('console.log("Hello")')
  
  return (
    <CodeEditor
      value={code}
      onChange={setCode}
      language="javascript"
      theme="vs-dark"
    />
  )
}
```

---

### 4. ChatInterface - 聊天界面

**文件路径**: `src/app/components/ChatInterface.tsx`

**描述**: 聊天界面组件，支持AI对话。

#### Props

```typescript
interface ChatInterfaceProps {
  onSendMessage: (message: string) => void
  messages: ChatMessage[]
  isLoading?: boolean
  placeholder?: string
}
```

#### 使用示例

```typescript
import { ChatInterface } from './components/ChatInterface'

function App() {
  const [messages, setMessages] = useState([])
  
  const handleSend = async (message: string) => {
    const response = await aiProvider.chat([
      { role: 'user', content: message }
    ])
    setMessages([...messages, { role: 'assistant', content: response.content }])
  }
  
  return (
    <ChatInterface
      messages={messages}
      onSendMessage={handleSend}
      placeholder="输入消息..."
    />
  )
}
```

---

### 5. FileManager - 文件管理器

**文件路径**: `src/app/components/FileManager.tsx`

**描述**: 文件管理器组件，支持文件浏览、编辑和管理。

#### Props

```typescript
interface FileManagerProps {
  rootPath?: string
  onFileSelect?: (file: FileInfo) => void
  onFileCreate?: (path: string) => void
  onFileDelete?: (path: string) => void
  onFileRename?: (oldPath: string, newPath: string) => void
}
```

#### 使用示例

```typescript
import { FileManager } from './components/FileManager'

function App() {
  return (
    <FileManager
      rootPath="/path/to/project"
      onFileSelect={(file) => console.log('选中文件:', file.path)}
      onFileCreate={(path) => console.log('创建文件:', path)}
    />
  )
}
```

---

### 6. PreviewPanel - 预览面板

**文件路径**: `src/app/components/PreviewPanel.tsx`

**描述**: 预览面板组件，支持实时预览。

#### Props

```typescript
interface PreviewPanelProps {
  url?: string
  html?: string
  onRefresh?: () => void
  device?: 'desktop' | 'tablet' | 'mobile'
}
```

#### 使用示例

```typescript
import { PreviewPanel } from './components/PreviewPanel'

function App() {
  return (
    <PreviewPanel
      url="http://localhost:3000"
      device="desktop"
      onRefresh={() => console.log('刷新预览')}
    />
  )
}
```

---

### 7. ModelSettings - 模型设置

**文件路径**: `src/app/components/ModelSettings.tsx`

**描述**: 模型设置组件，配置AI模型参数。

#### Props

```typescript
interface ModelSettingsProps {
  onSave?: (settings: ModelSettings) => void
  initialSettings?: ModelSettings
}
```

#### 使用示例

```typescript
import { ModelSettings } from './components/ModelSettings'

function App() {
  return (
    <ModelSettings
      onSave={(settings) => {
        console.log('保存设置:', settings)
      }}
    />
  )
}
```

---

### 8. ThemeManager - 主题管理器

**文件路径**: `src/app/components/ThemeManager.tsx`

**描述**: 主题管理器组件，支持自定义主题。

#### Props

```typescript
interface ThemeManagerProps {
  onThemeChange?: (theme: Theme) => void
  initialTheme?: Theme
}
```

#### 使用示例

```typescript
import { ThemeManager } from './components/ThemeManager'

function App() {
  return (
    <ThemeManager
      onThemeChange={(theme) => {
        console.log('主题变更:', theme.name)
      }}
    />
  )
}
```

---

## 工具函数API

### 1. 文件验证

**文件路径**: `src/app/utils/file-validator.ts`

#### `validateFileName(name: string): boolean`

验证文件名是否合法。

**参数**:
- `name`: 文件名

**返回值**:
- `boolean`: 是否合法

**示例**:
```typescript
import { validateFileName } from './utils/file-validator'

if (validateFileName('my-file.ts')) {
  console.log('文件名合法')
}
```

#### `sanitizeFileName(name: string): string`

清理文件名中的非法字符。

**参数**:
- `name`: 文件名

**返回值**:
- `string`: 清理后的文件名

**示例**:
```typescript
import { sanitizeFileName } from './utils/file-validator'

const clean = sanitizeFileName('my<>file?.ts')
console.log('清理后:', clean) // 'my_file_.ts'
```

---

### 2. 防抖和节流

**文件路径**: `src/app/utils/debounce.ts`

#### `debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void`

防抖函数。

**参数**:
- `fn`: 目标函数
- `delay`: 延迟时间（毫秒）

**返回值**:
- `(...args: Parameters<T>) => void`: 防抖后的函数

**示例**:
```typescript
import { debounce } from './utils/debounce'

const debouncedSearch = debounce((query: string) => {
  console.log('搜索:', query)
}, 300)

debouncedSearch('test')
```

#### `throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void`

节流函数。

**参数**:
- `fn`: 目标函数
- `limit`: 时间限制（毫秒）

**返回值**:
- `(...args: Parameters<T>) => void`: 节流后的函数

**示例**:
```typescript
import { throttle } from './utils/debounce'

const throttledScroll = throttle(() => {
  console.log('滚动事件')
}, 100)

window.addEventListener('scroll', throttledScroll)
```

---

### 3. 国际化

**文件路径**: `src/app/utils/i18n.ts`

#### `getI18n(lang: string): I18nText`

获取国际化文本。

**参数**:
- `lang`: 语言代码

**返回值**:
- `I18nText`: 国际化文本对象

**示例**:
```typescript
import { getI18n } from './utils/i18n'

const i = getI18n('zh-CN')
console.log(i.ecTitle) // '可编辑内容管理'
```

---

### 4. 主题

**文件路径**: `src/app/utils/theme.ts`

#### `getThemeTokens(theme: string): ThemeTokens`

获取主题令牌。

**参数**:
- `theme`: 主题名称

**返回值**:
- `ThemeTokens`: 主题令牌对象

**示例**:
```typescript
import { getThemeTokens } from './utils/theme'

const t = getThemeTokens('dark')
console.log(t.bg.primary) // 'bg-slate-900'
```

---

## 类型定义

### 全局类型

```typescript
// 用户类型
interface User {
  id: string
  name: string
  email?: string
  avatar?: string
}

// 文件信息
interface FileInfo {
  path: string
  name: string
  type: 'file' | 'directory'
  size?: number
  modifiedAt?: number
  createdAt?: number
}

// 聊天消息
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

// 主题配置
interface Theme {
  name: string
  mode: 'light' | 'dark'
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
  }
}

// 模型设置
interface ModelSettings {
  provider: string
  model: string
  temperature: number
  maxTokens: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}
```

---

## 错误处理

### 错误类型

```typescript
// 基础错误
class YYC3Error extends Error {
  code: string
  details?: any
}

// API错误
class APIError extends YYC3Error {
  statusCode: number
}

// 网络错误
class NetworkError extends YYC3Error {
  url: string
}

// 验证错误
class ValidationError extends YYC3Error {
  field: string
}
```

### 错误码

| 错误码 | 描述 |
|--------|------|
| `E001` | 未授权访问 |
| `E002` | 资源未找到 |
| `E003` | 参数验证失败 |
| `E004` | 网络连接失败 |
| `E005` | 数据库错误 |
| `E006` | 文件操作失败 |
| `E007` | AI服务错误 |
| `E008` | 协同服务错误 |

### 错误处理示例

```typescript
import { errorHandler } from './services/error-handler'

try {
  await someOperation()
} catch (error) {
  const handled = errorHandler.handle(error)
  console.error('错误:', handled.message)
  console.error('错误码:', handled.code)
}
```

---

## 最佳实践

### 1. 错误处理

```typescript
// ✅ 好的做法
try {
  const result = await api.call()
  return result
} catch (error) {
  logger.error('API调用失败', { error, context })
  throw new APIError('API调用失败', { cause: error })
}

// ❌ 不好的做法
const result = await api.call() // 不处理错误
```

### 2. 类型安全

```typescript
// ✅ 好的做法
interface Config {
  apiKey: string
  baseUrl?: string
}

function initialize(config: Config): void {
  // ...
}

// ❌ 不好的做法
function initialize(config: any): void {
  // ...
}
```

### 3. 异步操作

```typescript
// ✅ 好的做法
async function fetchData(): Promise<Data> {
  const response = await fetch('/api/data')
  if (!response.ok) {
    throw new APIError('请求失败')
  }
  return response.json()
}

// ❌ 不好的做法
async function fetchData(): Promise<any> {
  return fetch('/api/data').then(r => r.json())
}
```

### 4. 组件设计

```typescript
// ✅ 好的做法
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

export function Button({ label, onClick, disabled, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  )
}

// ❌ 不好的做法
export function Button(props: any) {
  return <button {...props} />
}
```

### 5. 性能优化

```typescript
// ✅ 好的做法
import { useMemo, useCallback } from 'react'

function ExpensiveComponent({ data, onItemClick }) {
  const processedData = useMemo(() => {
    return data.map(item => processItem(item))
  }, [data])

  const handleClick = useCallback((id: string) => {
    onItemClick(id)
  }, [onItemClick])

  return <List data={processedData} onItemClick={handleClick} />
}

// ❌ 不好的做法
function ExpensiveComponent({ data, onItemClick }) {
  const processedData = data.map(item => processItem(item)) // 每次渲染都重新计算

  return <List data={processedData} onItemClick={onItemClick} />
}
```

---

## 版本历史

### v1.0.0 (2026-04-05)

- ✨ 初始版本发布
- ✨ 包含所有核心服务API
- ✨ 包含所有组件API
- ✨ 包含工具函数API
- ✨ 包含完整类型定义
- ✨ 包含错误处理机制
- ✨ 包含最佳实践指南

---

## 贡献者

- **YanYuCloudCube Team** - 核心开发
- **AI Assistant** - 文档生成

---

## 许可证

MIT License

Copyright (c) 2026 YanYuCloudCube Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
