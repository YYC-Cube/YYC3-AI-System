---
file: YYC3-P1-AI-多提供商集成.md
description: AI 多提供商集成设计和实现
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p1,AI,provider,integration
---

# YYC³ P1-AI-多提供商集成

## 功能目标
1. 多提供商支持 (OpenAI, Anthropic, 智谱AI, 百度文心, 阿里通义, Ollama)
2. 统一 API 接口 (AIProviderInterface)
3. 自动故障切换 + 负载均衡
4. 流式输出支持
5. 完善错误处理

## 架构: AIProviderInterface
- name, isAvailable(), request(config), streamRequest(config, onChunk, onComplete, onError), getModels()

## 提供商实现
- OpenAIProvider: /v1/chat/completions, Bearer token, SSE streaming
- AnthropicProvider: /v1/messages, x-api-key header, content_block_delta streaming
- (ZhipuProvider, BaiduProvider, AliyunProvider, OllamaProvider - 同模式)

## AIProviderManager
- providers Map + config Map
- getCurrentProvider / setCurrentProvider / selectProvider (按 priority)
- request(config) / streamRequest(config) - 自动选择 provider
- addProvider / removeProvider 动态管理

## 全局实例
```ts
export const aiProviderManager = new AIProviderManager([
  { name: 'openai', apiKey: env.VITE_OPENAI_API_KEY, enabled: true, priority: 10 },
  { name: 'anthropic', apiKey: env.VITE_ANTHROPIC_API_KEY, enabled: true, priority: 9 },
]);
```
