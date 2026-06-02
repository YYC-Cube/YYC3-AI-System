---
file: YYC3-P0-架构-本地存储.md
description: 本地存储架构层实现，基于 Dexie.js + IndexedDB
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
updated: 2026-03-14
status: stable
tags: p0,architecture,storage,database,encryption
---

# YYC³ P0-架构 - 本地存储

## 架构目标

基于 Dexie.js + IndexedDB 的数据持久化与加密存储方案。

## 技术栈

| 技术           | 版本    | 用途          |
| -------------- | ------- | ------------- |
| Dexie.js       | 3.2.4   | IndexedDB ORM |
| Web Crypto API | Browser | 数据加密      |

## 数据库设计 (AppDB extends Dexie)

### Tables

- **notes**: id, title, content, encryptedContent?, tags?, isEncrypted, syncStatus, version, createdAt, updatedAt
- **projects**: id, name, description, settings, createdAt, updatedAt
- **files**: id, name, path, content, size, type, createdAt, updatedAt
- **syncRecords**: id, entityType, entityId, action, timestamp, status, errorMessage?

### 版本迁移

- v1: 初始结构
- v2: 添加加密支持 (isEncrypted index)
- v3: 添加版本控制 (version field)

## 加密服务 (encryption.ts)

- 算法: AES-GCM, 密钥长度: 256, IV: 12字节, Salt: 16字节
- deriveKey(): PBKDF2 从密码派生密钥, 100000 iterations
- encrypt(data, password): 加密数据
- decrypt(encryptedData, password, salt, iv): 解密数据

## 同步服务 (sync.ts)

- autoSync: 30秒间隔
- retryAttempts: 3, retryDelay: 5秒
- 按 entityType 分组同步 (note/project/file)
- 通过 HostBridge 写入宿主机文件系统

## 存储服务 (storage-service.ts)

- CRUD for Notes (含加密/解密)
- CRUD for Projects
- CRUD for Files
- searchNotes(query): 全文搜索
- getNotesByTag(tag): 按标签筛选
- exportData/importData: 数据导入导出

## 缓存 (cache.ts)

- LRU Cache: maxSize=100, ttl=5分钟
- 独立缓存实例: noteCache, projectCache, fileCache

## 性能目标

| 指标           | 目标值  |
| -------------- | ------- |
| 单条读取       | < 10ms  |
| 单条写入       | < 20ms  |
| 批量读取 100条 | < 100ms |
| 搜索 1000条    | < 50ms  |
| 缓存命中率     | > 80%   |
