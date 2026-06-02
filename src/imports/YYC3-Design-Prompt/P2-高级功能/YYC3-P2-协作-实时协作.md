---
file: YYC3-P2-协作-实时协作.md
description: 实时协作功能设计和实现，使用 Yjs 实现 CRDT
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p2,collaboration,real-time,crdt
---

# YYC³ P2-协作-实时协作

## 功能目标
1. 实时同步：多用户实时编辑同步 (Yjs CRDT)
2. 冲突解决：自动解决编辑冲突
3. 光标追踪：显示其他用户光标位置
4. 用户状态：显示用户在线状态
5. 权限控制：细粒度权限管理

## 架构
```
YjsProvider -> WebSocketProvider -> AwarenessProvider -> CursorTracker -> ConflictResolver -> VersionHistory
```

## 核心实现

### YjsProvider (Context)
```typescript
interface YjsContextType {
  ydoc: Y.Doc | null;
  provider: WebsocketProvider | null;
  connected: boolean;
  collaborators: Map<string, Collaborator>;
  connect: () => void;
  disconnect: () => void;
}
```
- Y.Doc 创建 + WebsocketProvider 连接 (y-websocket)
- awareness.on('change') 监听用户光标/状态
- roomId 变化时重新连接

### CursorTracker 组件
- 监听 mousemove 更新本地光标位置到 awareness
- 渲染远程用户光标 (彩色标签 + 用户名)

### CollaborativeEditor 组件
- Y.Doc.getText(documentId) 获取共享文本
- ytext.observe() 监听变化 -> onChange callback
- doc.transact() 批量更新
- 离线状态指示器

## 样式
- .remote-cursor: 2px 宽彩色光标线 + 用户名标签
- .connection-status: 离线时红色脉冲动画
- .collaborative-editor: Monaco 等宽字体, 行高 1.6
