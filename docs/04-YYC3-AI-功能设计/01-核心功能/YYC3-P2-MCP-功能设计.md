# MCP (Model Context Protocol) 功能文档

## 📋 概述

MCP (Model Context Protocol) 是一种允许 AI 模型与外部工具和服务交互的协议。YYC³ 系统现在支持 MCP，让 AI 能够：

- 📁 读写文件
- 🔍 搜索代码
- 🖥️ 执行命令
- 📚 访问资源
- 💬 使用预定义提示

---

## 🚀 快速开始

### 1. 添加 MCP 服务器

**方式一：通过设置页面**

1. 点击右上角 **设置** 图标
2. 选择左侧 **MCP** 菜单
3. 点击 **添加 MCP 服务器**
4. 填写服务器信息：
   - **名称**: 服务器标识名称
   - **Endpoint**: 服务器地址
   - **类型**: 选择连接类型 (Stdio / SSE / HTTP)
5. 点击 **测试连接** 验证
6. 点击 **保存**

**方式二：通过代码配置**

```typescript
import { useSettingsStore } from './settingsStore'

const { addMcp } = useSettingsStore()

addMcp({
  id: 'my-mcp-server',
  name: 'My MCP Server',
  endpoint: 'http://localhost:3000/mcp',
  type: 'streamable-http',
  enabled: true,
  isProject: false,
})
```

---

## 🔌 支持的连接类型

### Stdio (标准输入输出)

适用于本地进程，通过标准输入输出通信。

```typescript
{
  id: 'local-filesystem',
  name: 'Local Filesystem',
  endpoint: 'npx -y @mcp/server-filesystem /path/to/dir',
  type: 'stdio',
  enabled: true,
}
```

### SSE (Server-Sent Events)

适用于服务器推送事件。

```typescript
{
  id: 'remote-server',
  name: 'Remote MCP Server',
  endpoint: 'http://localhost:3000/sse',
  type: 'sse',
  enabled: true,
}
```

### Streamable HTTP

适用于 HTTP 流式通信。

```typescript
{
  id: 'http-server',
  name: 'HTTP MCP Server',
  endpoint: 'http://localhost:3000/mcp',
  type: 'streamable-http',
  enabled: true,
}
```

---

## 🛠️ 可用工具

MCP 服务器提供以下标准工具：

### 1. read_file

读取文件内容。

**参数：**
- `path` (string, 必需): 文件路径

**示例：**
```typescript
import { useMCP } from './services/hooks-mcp'

const { callTool } = useMCP()

const result = await callTool('server-id', 'read_file', {
  path: '/path/to/file.txt'
})

console.log(result.data) // 文件内容
```

### 2. write_file

写入文件内容。

**参数：**
- `path` (string, 必需): 文件路径
- `content` (string, 必需): 文件内容

**示例：**
```typescript
const result = await callTool('server-id', 'write_file', {
  path: '/path/to/file.txt',
  content: 'Hello, World!'
})
```

### 3. list_directory

列出目录内容。

**参数：**
- `path` (string, 必需): 目录路径

**示例：**
```typescript
const result = await callTool('server-id', 'list_directory', {
  path: '/path/to/dir'
})

console.log(result.data.files) // ['file1.txt', 'file2.txt']
```

### 4. execute_command

执行 shell 命令。

**参数：**
- `command` (string, 必需): 命令内容
- `cwd` (string, 可选): 工作目录

**示例：**
```typescript
const result = await callTool('server-id', 'execute_command', {
  command: 'npm install',
  cwd: '/path/to/project'
})

console.log(result.data.output) // 命令输出
console.log(result.data.exitCode) // 退出码
```

### 5. search_code

搜索代码模式。

**参数：**
- `pattern` (string, 必需): 搜索模式
- `path` (string, 可选): 搜索路径

**示例：**
```typescript
const result = await callTool('server-id', 'search_code', {
  pattern: 'function.*test',
  path: '/path/to/src'
})

console.log(result.data.results)
// [{ file: 'test.ts', line: 10, match: 'function test()' }]
```

---

## 💬 AI 集成

MCP 已与 AI 聊天集成。AI 可以自动调用 MCP 工具来完成任务。

### 示例对话

**用户：** "帮我读取 package.json 文件"

**AI:** (自动调用 `read_file` 工具)
```json
{
  "name": "my-project",
  "version": "1.0.0",
  ...
}
```

**用户：** "在项目目录中搜索所有测试文件"

**AI:** (自动调用 `search_code` 工具)
```json
{
  "results": [
    { "file": "src/test.ts", ... },
    { "file": "src/utils.test.ts", ... }
  ]
}
```

**用户：** "运行 npm install"

**AI:** (自动调用 `execute_command` 工具)
```json
{
  "output": "added 123 packages in 5s",
  "exitCode": 0
}
```

---

## 🔧 使用 React Hook

### 基本用法

```typescript
import { useMCP } from './services/hooks-mcp'

function MyComponent() {
  const {
    // 状态
    loading,      // MCP 初始化中
    executing,    // 当前执行的工具名
    
    // 服务器管理
    getServers,   // 获取所有服务器
    getServer,    // 获取单个服务器状态
    refresh,      // 刷新服务器
    
    // 工具执行
    listTools,    // 列出所有可用工具
    callTool,     // 调用工具
    executeWithAI,// AI 辅助执行
  } = useMCP()
  
  const handleReadFile = async () => {
    try {
      const result = await callTool('server-id', 'read_file', {
        path: './package.json'
      })
      
      if (result.success) {
        console.log('File content:', result.data)
      } else {
        console.error('Error:', result.error)
      }
    } catch (error) {
      console.error('Tool call failed:', error)
    }
  }
  
  return (
    <button onClick={handleReadFile}>
      {executing ? 'Executing...' : 'Read File'}
    </button>
  )
}
```

### 列出所有工具

```typescript
const tools = await listTools()
console.log('Available tools:', tools)
// [
//   { serverId: 'server-1', tool: { name: 'read_file', ... } },
//   { serverId: 'server-1', tool: { name: 'write_file', ... } },
//   ...
// ]
```

### AI 辅助执行

```typescript
const result = await executeWithAI(
  'server-id',
  'execute_command',
  '安装项目依赖并运行测试'
)
// AI 会自动提取参数并调用工具
```

---

## 📊 服务器状态

MCP 服务器有以下状态：

- **disconnected**: 未连接
- **connecting**: 连接中
- **connected**: 已连接 ✅
- **error**: 连接错误 ❌

### 检查服务器状态

```typescript
const server = getServer('server-id')
if (server?.status === 'connected') {
  console.log('Server is ready')
  console.log('Tools:', server.tools)
  console.log('Resources:', server.resources)
}
```

---

## 🧪 测试连接

在添加服务器后，建议测试连接：

```typescript
import { testMcpConnection } from './services/settings-integration'

const result = await testMcpConnection(
  'http://localhost:3000/mcp',
  'streamable-http'
)

if (result.ok) {
  console.log(`Connected in ${result.latency}ms`)
} else {
  console.error('Connection failed:', result.error)
}
```

---

## 🔐 安全注意事项

### 1. 命令执行安全

`execute_command` 工具可能执行任意命令。建议：

- 限制可执行的命令
- 使用白名单
- 在沙箱环境中运行

### 2. 文件系统访问

文件读写工具可能访问敏感文件。建议：

- 限制访问目录
- 使用相对路径
- 实施权限检查

### 3. 服务器验证

连接外部 MCP 服务器时：

- 验证服务器身份
- 使用 HTTPS
- 实施认证机制

---

## 🐛 故障排查

### 问题 1: 服务器无法连接

**症状：** 状态一直显示 "connecting" 或 "error"

**解决方案：**
1. 检查服务器是否运行
2. 验证 endpoint URL
3. 检查网络连接
4. 查看服务器日志

### 问题 2: 工具调用失败

**症状：** `callTool` 返回错误

**解决方案：**
1. 确认服务器已连接
2. 检查工具名称是否正确
3. 验证参数格式
4. 查看错误信息

### 问题 3: AI 不调用工具

**症状：** AI 响应但不执行工具调用

**解决方案：**
1. 确认 MCP 服务器已启用
2. 检查 AI 模型是否支持工具调用
3. 在提示中明确说明可以使用工具

---

## 📚 参考资料

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP GitHub](https://github.com/modelcontextprotocol)
- [MCP 服务器示例](https://github.com/modelcontextprotocol/servers)

---

## 🎯 最佳实践

1. **命名规范**: 使用描述性的服务器名称
2. **错误处理**: 始终捕获和处理工具调用错误
3. **超时设置**: 为长时间运行的工具设置超时
4. **日志记录**: 记录工具调用以便调试
5. **权限最小化**: 只授予必要的权限

---

**最后更新:** 2026-03-19
**版本:** v1.0.0
