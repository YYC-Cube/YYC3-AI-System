# YYC³ 高优先级组件开发指南

## 📋 目录
- [ChatInterface 组件](#chatinterface-组件)
- [CodeEditor 组件](#codeeditor-组件)
- [FileManager 组件](#filemanager-组件)
- [通用开发规范](#通用开发规范)

---

## 💬 ChatInterface 组件

### 功能需求
1. **消息显示**
   - 用户消息和AI消息的区分显示
   - 支持Markdown渲染
   - 代码块语法高亮
   - 时间戳显示

2. **输入功能**
   - 多行文本输入
   - 快捷键支持（Enter发送，Shift+Enter换行）
   - 输入历史记录
   - 自动保存草稿

3. **AI集成**
   - 与AIProvider集成
   - 流式响应显示
   - 响应中可中断
   - 错误处理和重试

4. **交互功能**
   - 消息复制
   - 代码块复制
   - 消息重新生成
   - 对话清空

### 技术栈
```json
{
  "dependencies": {
    "react-markdown": "^9.0.0",
    "react-syntax-highlighter": "^15.5.0",
    "remark-gfm": "^4.0.0"
  },
  "types": {
    "@types/react-syntax-highlighter": "^15.5.0"
  }
}
```

### 文件结构
```
src/app/components/chat/
├── ChatInterface.tsx           # 主组件
├── MessageList.tsx             # 消息列表
├── MessageItem.tsx             # 单条消息
├── ChatInput.tsx               # 输入框
├── MessageInput.tsx            # 消息输入包装器
├── MessageActions.tsx          # 消息操作按钮
├── CodeBlock.tsx               # 代码块渲染
├── MarkdownRenderer.tsx        # Markdown渲染器
├── useChatHistory.ts           # 历史记录Hook
├── useInputState.ts            # 输入状态Hook
├── useAIResponse.ts            # AI响应Hook
└── __tests__/
    ├── chat-interface.test.tsx
    ├── message-item.test.tsx
    └── chat-input.test.tsx
```

### 最小实现（MVP）

```tsx
// src/app/components/chat/ChatInterface.tsx
import React, { useState } from 'react'
import { useAIProvider } from '../../services/ai-provider'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { generateResponse } = useAIProvider()

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await generateResponse(input)
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to generate response:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p>{msg.content}</p>
              <span className="text-xs opacity-70">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isLoading && <div className="text-gray-500">AI正在思考...</div>}
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="flex-1 p-2 border rounded-lg resize-none"
            rows={3}
            placeholder="输入消息..."
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 测试模板

```tsx
// src/app/components/chat/__tests__/chat-interface.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ChatInterface } from '../ChatInterface'

vi.mock('../../services/ai-provider', () => ({
  useAIProvider: () => ({
    generateResponse: vi.fn().mockResolvedValue('Test response'),
  }),
}))

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render chat interface', () => {
    render(<ChatInterface />)
    expect(screen.getByPlaceholderText('输入消息...')).toBeInTheDocument()
  })

  it('should send message on button click', async () => {
    render(<ChatInterface />)

    const input = screen.getByPlaceholderText('输入消息...')
    const sendButton = screen.getByRole('button', { name: '发送' })

    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })
  })

  it('should show loading state', async () => {
    render(<ChatInterface />)

    const input = screen.getByPlaceholderText('输入消息...')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.submit(input.closest('form') || input.parentElement!)

    expect(screen.getByText('AI正在思考...')).toBeInTheDocument()
  })
})
```

---

## 📝 CodeEditor 组件

### 功能需求
1. **编辑功能**
   - 语法高亮
   - 代码补全
   - 自动缩进
   - 多光标编辑
   - 查找替换

2. **文件支持**
   - 支持多种语言
   - 文件标签页
   - 最近文件列表
   - 文件状态指示

3. **集成功能**
   - 与文件管理器集成
   - 与预览功能集成
   - 与AI辅助集成
   - 代码片段插入

### 技术栈
```json
{
  "dependencies": {
    "@monaco-editor/react": "^4.6.0",
    "monaco-editor": "^0.45.0"
  }
}
```

### 文件结构
```
src/app/components/editor/
├── CodeEditor.tsx              # 主组件（Monaco Editor包装）
├── EditorTabs.tsx              # 文件标签页
├── EditorTab.tsx               # 单个标签页
├── EditorToolbar.tsx           # 工具栏
├── EditorStatus.tsx            # 状态栏
├── useEditorState.ts           # 编辑器状态Hook
├── useEditorFiles.ts           # 文件管理Hook
├── useEditorTheme.ts           # 主题切换Hook
└── __tests__/
    ├── code-editor.test.tsx
    └── editor-tabs.test.tsx
```

### 最小实现（MVP）

```tsx
// src/app/components/editor/CodeEditor.tsx
import React, { useState } from 'react'
import Editor from '@monaco-editor/react'

export interface EditorFile {
  id: string
  name: string
  language: string
  content: string
}

export function CodeEditor() {
  const [files, setFiles] = useState<EditorFile[]>([
    {
      id: '1',
      name: 'example.ts',
      language: 'typescript',
      content: 'const greet = (name: string) => `Hello, ${name}!`',
    },
  ])
  const [activeFileId, setActiveFileId] = useState('1')
  const [content, setContent] = useState(files[0].content)

  const activeFile = files.find(f => f.id === activeFileId)

  const handleContentChange = (value: string | undefined) => {
    const newContent = value || ''
    setContent(newContent)

    // Update file content
    setFiles(prev =>
      prev.map(f => (f.id === activeFileId ? { ...f, content: newContent } : f))
    )
  }

  if (!activeFile) return null

  return (
    <div className="flex flex-col h-screen">
      {/* File Tabs */}
      <div className="flex border-b bg-gray-100">
        {files.map((file) => (
          <button
            key={file.id}
            onClick={() => {
              setActiveFileId(file.id)
              setContent(file.content)
            }}
            className={`px-4 py-2 text-sm ${
              file.id === activeFileId
                ? 'bg-white border-b-2 border-blue-500'
                : 'hover:bg-gray-200'
            }`}
          >
            {file.name}
          </button>
        ))}
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={activeFile.language}
          value={content}
          onChange={handleContentChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            tabSize: 2,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}
```

---

## 📁 FileManager 组件

### 功能需求
1. **文件浏览**
   - 树形视图
   - 列表视图
   - 面包屑导航
   - 文件类型图标

2. **文件操作**
   - 创建文件/文件夹
   - 重命名
   - 删除
   - 移动/复制
   - 拖拽上传

3. **集成功能**
   - 与编辑器集成
   - 与AI集成
   - 文件预览
   - 文件搜索

### 技术栈
```json
{
  "dependencies": {
    "react-icons": "^5.0.0",
    "lucide-react": "^0.300.0"
  }
}
```

### 文件结构
```
src/app/components/filemanager/
├── FileManager.tsx             # 主组件
├── FileTree.tsx               # 文件树
├── FileNode.tsx               # 文件节点
├── FileList.tsx               # 文件列表
├── FileBreadcrumb.tsx         # 面包屑
├── FileToolbar.tsx            # 工具栏
├── FileContextMenu.tsx        # 右键菜单
├── FilePreview.tsx            # 文件预览
├── useFileTree.ts             # 文件树Hook
├── useFileOperations.ts       # 文件操作Hook
└── __tests__/
    ├── file-manager.test.tsx
    ├── file-tree.test.tsx
    └── file-operations.test.tsx
```

### 最小实现（MVP）

```tsx
// src/app/components/filemanager/FileManager.tsx
import React, { useState } from 'react'
import { File, Folder, FileText, Image, Code } from 'lucide-react'

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  content?: string
}

export function FileManager() {
  const [fileTree] = useState<FileNode[]>([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      children: [
        { id: '2', name: 'App.tsx', type: 'file' },
        { id: '3', name: 'index.tsx', type: 'file' },
      ],
    },
    {
      id: '4',
      name: 'public',
      type: 'folder',
      children: [
        { id: '5', name: 'index.html', type: 'file' },
      ],
    },
  ])

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedFolders(newExpanded)
  }

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext || '')) {
      return <Code className="w-4 h-4" />
    }
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext || '')) {
      return <Image className="w-4 h-4" />
    }
    return <FileText className="w-4 h-4" />
  }

  const renderNode = (node: FileNode, level: number = 0) => {
    const paddingLeft = `${level * 16}px`

    if (node.type === 'folder') {
      const isExpanded = expandedFolders.has(node.id)
      return (
        <div key={node.id}>
          <div
            className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer"
            style={{ paddingLeft }}
            onClick={() => toggleFolder(node.id)}
          >
            <Folder className="w-4 h-4 text-blue-500" />
            <span className="text-sm">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>{node.children.map((child) => renderNode(child, level + 1))}</div>
          )}
        </div>
      )
    }

    return (
      <div
        key={node.id}
        className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer"
        style={{ paddingLeft }}
      >
        {getFileIcon(node.name)}
        <span className="text-sm">{node.name}</span>
      </div>
    )
  }

  return (
    <div className="h-full bg-white border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">文件管理器</h2>
      </div>
      <div className="p-2">{fileTree.map((node) => renderNode(node))}</div>
    </div>
  )
}
```

---

## 🎨 通用开发规范

### TypeScript 规范

1. **类型定义**
```typescript
// ✅ 使用 interface 定义对象类型
interface UserProfile {
  id: string
  name: string
  email: string
}

// ✅ 使用 type 定义联合类型或映射类型
type Status = 'active' | 'inactive' | 'pending'
type UserMap = Record<string, UserProfile>
```

2. **Props 类型**
```typescript
// ✅ 明确定义组件Props
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  onClick?: () => void
}

export function Button({ children, variant = 'primary', ...rest }: ButtonProps) {
  // ...
}
```

3. **泛型使用**
```typescript
// ✅ 合理使用泛型提高复用性
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  keyExtractor: (item: T) => string
}

export function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <div>
      {items.map((item) => (
        <div key={keyExtractor(item)}>{renderItem(item)}</div>
      ))}
    </div>
  )
}
```

### React Hooks 规范

1. **自定义Hook**
```typescript
// ✅ 以 'use' 开头
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : initialValue
  })

  const setValue = (value: T) => {
    setStoredValue(value)
    localStorage.setItem(key, JSON.stringify(value))
  }

  return [storedValue, setValue] as const
}
```

2. **Hook 依赖**
```typescript
// ✅ 正确使用依赖数组
useEffect(() => {
  const subscription = subscribe()
  return () => subscription.unsubscribe()
}, [/* 依赖项 */])

// ❌ 避免
useEffect(() => {
  // ...
}, []) // 如果依赖动态内容，应该包含在依赖数组中
```

### 组件命名规范

```
✅ PascalCase: MyComponent, UserProfile
✅ camelCase: useMyHook, handleSomething
✅ kebab-case: file-name.ts, component-name.test.tsx
❌ snake_case: my_component
❌ mixedCase: myComponent
```

### 文件组织规范

```
src/app/components/[component-name]/
├── index.ts                    # 导出入口（可选）
├── ComponentName.tsx           # 主组件
├── SubComponent.tsx            # 子组件
├── useComponentName.ts         # 自定义Hook
├── types.ts                    # 类型定义
└── __tests__/                  # 测试目录
    ├── component-name.test.tsx
    └── helpers.test.ts
```

### 性能优化建议

1. **React.memo**
```typescript
// ✅ 对复杂组件使用 memo
export const ExpensiveComponent = React.memo(({ data }) => {
  // ...
})
```

2. **useMemo / useCallback**
```typescript
// ✅ 缓存计算结果
const sortedItems = useMemo(
  () => items.sort((a, b) => a.value - b.value),
  [items]
)

// ✅ 缓存回调函数
const handleClick = useCallback(() => {
  onClick(item)
}, [item, onClick])
```

3. **代码分割**
```typescript
// ✅ 使用 lazy loading
const HeavyComponent = React.lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <React.Suspense fallback={<Loading />}>
      <HeavyComponent />
    </React.Suspense>
  )
}
```

---

## 📊 测试覆盖率目标

| 组件 | 当前 | 目标 |
|------|------|------|
| ChatInterface | 0% | 80% |
| CodeEditor | 0% | 80% |
| FileManager | 0% | 80% |

## 🚀 下一步行动

1. **立即开始** (优先级1)
   - [ ] 实现 ChatInterface MVP
   - [ ] 编写基础测试用例
   - [ ] 集成到主应用

2. **短期计划** (1-2周)
   - [ ] 实现 CodeEditor MVP
   - [ ] 实现 FileManager MVP
   - [ ] 完成组件间集成

3. **中期计划** (2-4周)
   - [ ] 添加高级功能
   - [ ] 性能优化
   - [ ] 测试覆盖率达标

---

**文档版本**: v1.0.0
**更新时间**: 2026-03-25
**维护者**: YYC³ Team
