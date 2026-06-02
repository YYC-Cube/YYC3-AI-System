---
file: YYC3-P0-Ollama-CORS 配置指南.md
description: Ollama服务CORS跨域配置指南，解决浏览器访问本地Ollama服务的跨域问题
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-20
updated: 2026-03-20
status: stable
tags: guide,ollama,cors,configuration,zh-CN
category: guide
language: zh-CN
audience: developers
complexity: basic
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# Ollama CORS 配置指南

## 问题描述

在浏览器中直接访问本地 Ollama 服务 (`http://localhost:11434`) 时，会被浏览器的 CORS (Cross-Origin Resource Sharing) 策略阻止。

**错误信息：**
```
Access to fetch at 'http://localhost:11434/api/tags' from origin 'http://localhost:3156' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 解决方案

### 方案 1: 配置 Ollama CORS 环境变量（推荐）

#### macOS / Linux

```bash
# 临时设置（当前终端会话有效）
export OLLAMA_ORIGINS="*"
ollama serve

# 永久设置（添加到 shell 配置文件）
echo 'export OLLAMA_ORIGINS="*"' >> ~/.zshrc  # macOS Zsh
echo 'export OLLAMA_ORIGINS="*"' >> ~/.bashrc  # Linux Bash
source ~/.zshrc  # 或 source ~/.bashrc
```

#### Windows

```powerscmd
# PowerShell
$env:OLLAMA_ORIGINS="*"
ollama serve

# 或者添加到系统环境变量
setx OLLAMA_ORIGINS "*"
```

#### macOS LaunchAgent（系统级配置）

```bash
# 创建 launch agent
launchctl setenv OLLAMA_ORIGINS "*"

# 或者编辑 plist 文件
nano ~/Library/LaunchAgents/com.ollama.ollama.plist
```

添加环境变量配置：
```xml
<key>EnvironmentVariables</key>
<dict>
    <key>OLLAMA_ORIGINS</key>
    <string>*</string>
</dict>
```

### 方案 2: 指定允许的域名（生产环境推荐）

```bash
# 只允许特定域名访问
export OLLAMA_ORIGINS="http://localhost:3156,https://yyc3.ai"
ollama serve
```

### 方案 3: 使用 Tauri 后端代理（长期方案）

通过 Tauri 的 Rust 后端发起请求，绕过浏览器 CORS 限制。

**实现步骤：**

1. 在 `src-tauri/src/main.rs` 中添加 API 端点：
```rust
#[tauri::command]
async fn ollama_proxy(endpoint: String, body: serde_json::Value) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let response = client
        .post(format!("http://localhost:11434/{}", endpoint))
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    let json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    Ok(json)
}
```

2. 在前端调用：
```typescript
// 不再直接 fetch Ollama，而是通过 Tauri API
import { invoke } from '@tauri-apps/api/core'

const response = await invoke('ollama_proxy', { 
  endpoint: 'api/tags',
  body: {}
})
```

### 方案 4: 使用浏览器插件（开发环境临时方案）

安装允许 CORS 的浏览器插件：
- Chrome: "Allow CORS: Access-Control-Allow-Origin"
- Firefox: "CORS Everywhere"

**注意：** 仅用于开发测试，不建议生产环境使用。

## 验证配置

配置完成后，在浏览器控制台测试：

```javascript
// 打开浏览器控制台 (F12)
fetch('http://localhost:11434/api/tags')
  .then(r => r.json())
  .then(data => console.log('✅ Ollama CORS 配置成功:', data))
  .catch(err => console.error('❌ Ollama CORS 配置失败:', err))
```

**成功输出：**
```json
✅ Ollama CORS 配置成功：{
  "models": [
    { "name": "qwen2.5:7b", ... },
    { "name": "llama3.2:latest", ... }
  ]
}
```

**失败输出：**
```
❌ Ollama CORS 配置失败：TypeError: Failed to fetch
```

## 安全注意事项

⚠️ **重要：** `OLLAMA_ORIGINS="*"` 允许任何网页访问你的本地 Ollama 服务，可能存在安全风险。

**生产环境建议：**
1. 使用具体的域名列表
2. 添加 API Key 认证
3. 使用反向代理（Nginx/Apache）
4. 限制访问 IP 范围

## 故障排查

### 问题 1: 配置后仍然报错

**检查项：**
1. 确认 Ollama 已重启（环境变量在启动时读取）
2. 检查终端输出是否有 `OLLAMA_ORIGINS` 变量
3. 确认没有其他 Ollama 实例在运行

```bash
# 检查环境变量
echo $OLLAMA_ORIGINS  # macOS/Linux
echo %OLLAMA_ORIGINS%  # Windows

# 检查运行中的 Ollama 进程
ps aux | grep ollama  # macOS/Linux
tasklist | findstr ollama  # Windows
```

### 问题 2: 多个终端冲突

如果多个终端都启动 Ollama，只有第一个生效。

**解决方案：**
```bash
# 停止所有 Ollama 进程
pkill ollama  # macOS/Linux
taskkill /F /IM ollama.exe  # Windows

# 重新启动
export OLLAMA_ORIGINS="*"
ollama serve
```

## 参考资料

- [Ollama 官方文档 - CORS](https://github.com/ollama/ollama/blob/main/docs/faq.md#cors-issues)
- [MDN CORS 指南](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [Tauri 后端代理](https://tauri.app/v1/guides/features/command/)

---

**最后更新：** 2026-03-19
**适用版本：** Ollama 0.1.x+
