---
file: YYC3-P0-架构-宿主机桥接.md
description: P0-核心架构 - 宿主机桥接（Tauri）提示词
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
updated: 2026-03-14
status: stable
tags: p0,architecture,host-bridge,tauri
---

# YYC³ P0-架构 - 宿主机桥接

- **阶段编号**: P0-02
- **优先级**: P0-Critical
- **预计时间**: 2-3小时

## 阶段目标

实现统一的宿主机原生能力桥接层，封装文件系统、对话框、系统通知等原生 API，提供 Promise-based、Type-safe 的接口。

## Bridge API 设计

### 1. HostBridge (文件系统)

- pickAndReadFile(): 选择并读取文件
- readFile(path): 读取文件内容
- writeFile(filename, data): 写入文件
- readDir(path): 读取目录
- createDir/removeDir/removeFile/renameFile
- fileExists(path): 检查文件存在
- watchFile(path, callback): 监控文件变化

### 2. DialogBridge (对话框)

- openFile(options): 打开文件对话框
- saveFile(options): 保存文件对话框
- selectDirectory(options): 选择目录对话框

### 3. NotificationBridge (通知)

- send(options): 发送系统通知
- success/error/warning/info 快捷方法

### 4. SystemBridge (系统)

- getSystemInfo(): 获取系统信息
- execCommand(cmd, args): 执行系统命令
- openUrl(url): 打开外部链接
- readClipboard/writeClipboard: 剪贴板操作

## Rust Backend (src-tauri/src/main.rs)

Commands: pick_file, save_file, watch_file, send_notification, get_system_info, exec_command, open_url, read_clipboard, write_clipboard, watch_resources

Dependencies: tauri 1.5, serde, tokio, notify 6.0, chrono, sysinfo, arboard

## Tauri Allowlist

fs (readFile/writeFile/readDir/createDir/removeDir/removeFile/renameFile/exists), dialog (open/save), notification (send), shell (execute/open), clipboard (readText/writeText)

## 验收标准

- 文件系统 API 正常工作
- 对话框 API 正常工作
- 通知 API 正常工作
- 系统 API 正常工作
- Rust backend 编译成功
