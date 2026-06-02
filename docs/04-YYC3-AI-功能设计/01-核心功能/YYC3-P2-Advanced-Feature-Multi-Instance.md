---
file: YYC3-P2-Advanced-Feature-Multi-Instance.md
description: YYC³便携式智能AI系统 - P2多实例功能设计文档
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-17
updated: 2026-03-18
status: stable
tags: p2,multi-instance,workspace,window-management,design-doc,zh-CN
category: design
language: zh-CN
design_type: feature
review_status: approved
audience: developers,architects
complexity: advanced
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC3-P2 Multi-Instance Feature Design

## Implementation Status

| Component | Store | File | Status |
|-----------|-------|------|--------|
| WindowManager | `useWindowManagerStore` | `services/multi-instance.ts` | Implemented |
| WorkspaceManager | `useWorkspaceManagerStore` | `services/multi-instance.ts` | Implemented |
| SessionManager | `useSessionManagerStore` | `services/multi-instance.ts` | Implemented |
| IPCManager | `ipcManager` singleton | `services/multi-instance.ts` | Implemented |

## Architecture

```
User Action → WindowManagerStore → IPC Broadcast → Other Listeners
                    ↓
            WorkspaceManagerStore ←→ SessionManagerStore
                    ↓
            Persistence (localStorage via Zustand persist)
```

## Key APIs

### Window Manager
- `createInstance(type, config?)` → AppInstance
- `closeInstance(id)` / `activateInstance(id)`
- `minimizeInstance(id)` / `maximizeInstance(id)` / `restoreInstance(id)`
- `moveInstance(id, pos)` / `resizeInstance(id, size)`

### Workspace Manager
- `createWorkspace(name, type, config?)` → Workspace
- `activateWorkspace(id)` / `deleteWorkspace(id)`
- `duplicateWorkspace(id)` / `exportWorkspace(id)` / `importWorkspace(json)`

### Session Manager
- `createSession(name, type, workspaceId, data?)` → Session
- `activateSession(id)` / `suspendSession(id)` / `resumeSession(id)`
- `getWorkspaceSessions(workspaceId)` / `getSessionStats()`

### IPC Manager
- `on(type, handler)` → unsubscribe function
- `broadcast(type, data)` / `sendToInstance(id, type, data)`
- `getMessageLog()` / `clearLog()`

## Tauri Migration Path

Replace `ipcManager.broadcast()` with `invoke('broadcast_message', ...)` when deploying to Tauri desktop.
All store logic remains unchanged — only the IPC transport layer changes.

---

> YanYuCloudCube Team | admin@0379.email
