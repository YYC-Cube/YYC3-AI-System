---
file: YYC3-P0-架构-类型定义.md
description: TypeScript 类型定义，包含核心数据模型和接口
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
updated: 2026-03-14
status: stable
tags: p0,architecture,typescript,types
---

# YYC³ P0-架构 - 类型定义

## 核心类型

### AppConfig

- appName, appVersion, environment, apiBaseUrl, wsUrl, debugMode, defaultLanguage

### User

- id, username, email, avatar?, role (admin|user|guest), status (active|inactive|suspended|deleted), createdAt, updatedAt

### Project

- id, name, description?, ownerId, status (draft|active|archived|deleted), visibility (private|public|shared), settings: ProjectSettings

### ProjectSettings

- autoSave, autoSaveInterval, defaultEditor (richtext|code|markdown), enableCollaboration, enableVersionControl, theme

### EditorState

- type (richtext|code|markdown), content, isDirty, cursorPosition, selection?, readOnly

### Panel

- id, type (editor|preview|terminal|explorer|search|git), title, position, size, minSize?, resizable?, draggable?, closable?, minimized?, maximized?

### AI Types

- AIProvider: openai | anthropic | zhipu | baidu | aliyun | ollama
- AIModel: id, name, provider, maxContextLength, supportsStreaming
- AIMessage: id, role (system|user|assistant|tool), content, timestamp
- AIRequestConfig: provider, model, messages, temperature?, maxTokens?, stream?
- AIResponse: id, provider, model, content, usage?, finishReason?

### Collaboration

- Collaborator: userId, username, cursor?, selection?, color, online
- CollaborationState: documentId, collaborators[], connected, syncStatus

### Storage

- Note: id, title, content, encryptedContent?, tags?, isEncrypted, syncStatus, version
- FileRecord: id, name, path, content, size, type
- SyncRecord: id, entityType, entityId, action, timestamp, status

## 工具类型

- OptionalKeys<T, K>: 指定键变为可选
- RequiredKeys<T, K>: 指定键变为必需
- DeepPartial<T>: 深度可选
- DeepReadonly<T>: 深度只读
