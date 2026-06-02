---
file: YYC3-P1-状态-服务端状态.md
description: React Query 服务端状态管理
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p1,state,server,api
---

# YYC³ P1-状态-服务端状态

## APIClient
- baseURL, timeout(30s), retryAttempts(3), retryDelay(1s)
- GET 请求缓存 (Map, ttl=60s)
- fetchWithRetry: exponential backoff
- AbortController 请求取消
- buildURL + params serialization

## React Query Config
- staleTime: 60s, cacheTime: 5min
- retry: 3, retryDelay: exponential (min 1s, max 30s)
- refetchOnWindowFocus: false, refetchOnReconnect: true

## API Hooks (TanStack React Query)
### User: useUsers, useUser, useCreateUser, useUpdateUser, useDeleteUser
### Project: useProjects, useProject, useCreateProject, useUpdateProject, useDeleteProject
### AI: useAIChat, useAICodeGeneration, useAICodeCompletion

## 所有 mutation 自动 invalidateQueries 刷新列表
