/**
 * file: ai-provider.ts
 * description: AI提供器服务层 - 多提供者AI服务，支持自动故障转移、限流、缓存和性能监控
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-03-19
 * updated: 2026-04-01
 * status: active
 * tags: [service],[ai],[provider],[multi-provider]
 *
 * brief: 多提供者AI服务，支持自动故障转移和性能监控
 *
 * details:
 * - 多提供者支持（OpenAI、Anthropic、DeepSeek等）
 * - 自动故障转移机制
 * - 请求限流和缓存
 * - 性能监控和成本追踪
 * - 本地存储持久化
 *
 * dependencies: React, IndexedDB, localStorage
 * exports: AIProviderService, aiProviderService, PRESET_PROVIDERS
 * notes: 需要在应用初始化时配置
 */

import type {
  AIChatMessage,
  AIChatOptions,
  AIChatResponse,
  AIErrorAnalysis,
  AIModel,
  AIPerformanceMetrics,
  AIProviderConfig,
} from '../types';
import { createLogger } from '../utils/logger';

const log = createLogger('AIProvider');

// ── Default provider presets ──

export const PRESET_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    type: 'cloud',
    baseURL: 'https://api.openai.com/v1',
    apiKey: '',
    apiKeyURL: 'https://platform.openai.com/api-keys',
    models: [],
    enabled: true,
    priority: 5,
    rateLimit: { requestsPerMinute: 3500, tokensPerMinute: 90000 },
    pricing: { inputPrice: 0.01, outputPrice: 0.03, currency: 'USD' },
  },
  {
    id: 'anthropic',
    name: 'anthropic',
    displayName: 'Anthropic',
    type: 'cloud',
    baseURL: 'https://api.anthropic.com/v1',
    apiKey: '',
    apiKeyURL: 'https://console.anthropic.com/settings/keys',
    models: [],
    enabled: true,
    priority: 3,
    rateLimit: { requestsPerMinute: 50, tokensPerMinute: 40000 },
    pricing: { inputPrice: 0.015, outputPrice: 0.075, currency: 'USD' },
  },
  {
    id: 'deepseek',
    name: 'deepseek',
    displayName: 'DeepSeek',
    type: 'cloud',
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: '',
    apiKeyURL: 'https://platform.deepseek.com/api_keys',
    models: [],
    enabled: true,
    priority: 6,
    rateLimit: { requestsPerMinute: 100, tokensPerMinute: 60000 },
    pricing: { inputPrice: 0.001, outputPrice: 0.002, currency: 'USD' },
  },
  {
    id: 'zhipuai',
    name: 'zhipuai',
    displayName: '智谱 AI',
    type: 'cloud',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: '',
    apiKeyURL: 'https://open.bigmodel.cn/usercenter/apikeys',
    region: 'cn',
    models: [],
    enabled: true,
    priority: 7,
    rateLimit: { requestsPerMinute: 100, tokensPerMinute: 50000 },
    pricing: { inputPrice: 0.0001, outputPrice: 0.0001, currency: 'CNY' },
  },
  {
    id: 'aliyun',
    name: 'aliyun',
    displayName: '阿里通义',
    type: 'cloud',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: '',
    apiKeyURL: 'https://dashscope.console.aliyun.com/apiKey',
    region: 'cn',
    models: [],
    enabled: true,
    priority: 8,
    rateLimit: { requestsPerMinute: 100, tokensPerMinute: 60000 },
    pricing: { inputPrice: 0.00008, outputPrice: 0.00008, currency: 'CNY' },
  },
  {
    id: 'baidu',
    name: 'baidu',
    displayName: '百度文心',
    type: 'cloud',
    baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
    apiKey: '',
    apiKeyURL: 'https://console.bce.baidu.com/qianfan/ais/console/application/list',
    region: 'cn',
    models: [],
    enabled: true,
    priority: 9,
    rateLimit: { requestsPerMinute: 50, tokensPerMinute: 30000 },
    pricing: { inputPrice: 0.00012, outputPrice: 0.00012, currency: 'CNY' },
  },
  {
    id: 'ollama',
    name: 'ollama',
    displayName: 'Ollama (本地 · 推荐)',
    type: 'local',
    baseURL: 'http://localhost:11434',
    apiKey: 'ollama',
    models: [],
    enabled: true,
    priority: 1,
    pricing: { inputPrice: 0, outputPrice: 0, currency: 'USD' },
  },
];

// ── Local-First Recommendation Order ──
// YYC³ philosophy: 一户一端，零跟踪，Ollama 优先（完全本地）
export const RECOMMENDATION_ORDER = [
  { id: 'ollama', reason: '完全本地，零网络依赖，零CORS问题，零跟踪' },
  {
    id: 'anthropic',
    reason: '官方支持浏览器直连（含 anthropic-dangerous-direct-browser-access header）',
  },
  { id: 'openai', reason: '需要启用 CORS 代理（用户自带密钥）' },
  { id: 'deepseek', reason: '需要启用 CORS 代理（用户自带密钥）' },
  { id: 'zhipuai', reason: '需要启用 CORS 代理（用户自带密钥）' },
  { id: 'aliyun', reason: '需要启用 CORS 代理（用户自带密钥）' },
  { id: 'baidu', reason: '需要启用 CORS 代理（用户自带密钥）' },
];

// ── AI Provider Service ──

export class AIProviderService {
  private providers: AIProviderConfig[] = [];
  private activeProviderId: string | null = null;
  private activeModelId: string | null = null;
  private performanceMetrics: AIPerformanceMetrics[] = [];
  private errorHistory: AIErrorAnalysis[] = [];
  private cache: Map<string, { data: AIChatResponse; timestamp: number }> = new Map();
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> = new Map();
  private costTracker: Map<string, { inputTokens: number; outputTokens: number; cost: number }> =
    new Map();

  private cacheEnabled = true;
  private cacheTTL = 300; // seconds
  private cacheMaxSize = 100;
  private rateLimitEnabled = true;
  private maxRequestsPerMinute = 60;

  // ── Local-First CORS Proxy Config (用户显式启用) ──
  private corsProxyEnabled = false;
  private corsProxyUrl: string = '';

  /**
   * 启用/禁用 CORS 代理（用户在设置中显式选择）
   *
   * 哲学合规：
   *   - 默认关闭（零跟踪）
   *   - 代理无日志、无鉴权、纯透传
   *   - 用户可自部署同一份 Worker
   */
  setCORSProxy(enabled: boolean, url?: string): void {
    this.corsProxyEnabled = enabled;
    this.corsProxyUrl = url ?? '';
  }

  isCORSProxyEnabled(): boolean {
    return this.corsProxyEnabled;
  }

  /**
   * 构建请求 URL（根据 CORS 代理配置）
   */
  buildRequestUrl(providerId: string, originalUrl: string): string {
    if (!this.corsProxyEnabled || !this.corsProxyUrl) return originalUrl;

    // Ollama 不需要代理（本地）
    if (providerId === 'ollama') return originalUrl;

    // Anthropic 官方支持浏览器直连，不需要代理
    if (providerId === 'anthropic') return originalUrl;

    // OpenAI / DeepSeek / 其他云厂商需要代理
    const proxyBase = this.corsProxyUrl.replace(/\/$/, '');
    const path = originalUrl.replace(/^https?:\/\/[^/]+/, '');
    return `${proxyBase}${path}`;
  }

  constructor() {
    this.providers = [...PRESET_PROVIDERS];
    this.loadFromStorage();
    // Initial sync to appStore
    setTimeout(() => this.syncToAppStore(), 0);
  }

  // ── Provider CRUD ──

  listProviders(): AIProviderConfig[] {
    return this.providers;
  }

  getProvider(id: string): AIProviderConfig | undefined {
    return this.providers.find((p) => p.id === id);
  }

  addProvider(provider: AIProviderConfig): void {
    if (!this.providers.find((p) => p.id === provider.id)) {
      this.providers.push(provider);
      this.saveToStorage();
    }
  }

  updateProvider(id: string, updates: Partial<AIProviderConfig>): void {
    const idx = this.providers.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.providers[idx] = { ...this.providers[idx], ...updates };
      this.saveToStorage();
    }
  }

  removeProvider(id: string): void {
    this.providers = this.providers.filter((p) => p.id !== id);
    if (this.activeProviderId === id) this.activeProviderId = null;
    this.saveToStorage();
  }

  toggleProvider(id: string, enabled: boolean): void {
    this.updateProvider(id, { enabled });
  }

  // ── Model CRUD ──

  listModels(providerId: string): AIModel[] {
    return this.getProvider(providerId)?.models ?? [];
  }

  // ── Active selection ──

  setActiveProvider(id: string): void {
    this.activeProviderId = id;
    this.saveToStorage();
  }

  getActiveProvider(): AIProviderConfig | undefined {
    return this.providers.find((p) => p.id === this.activeProviderId);
  }

  getActiveProviderId(): string | null {
    return this.activeProviderId;
  }

  getActiveModelId(): string | null {
    return this.activeModelId;
  }

  // ── Get all models across providers ──

  private buildEndpoint(provider: AIProviderConfig): string {
    // Ollama uses /api/chat, others use /chat/completions (OpenAI-compatible)
    return provider.id === 'ollama'
      ? `${provider.baseURL}/api/chat`
      : `${provider.baseURL}/chat/completions`;
  }

  getAllModels(): AIModel[] {
    const allModels: AIModel[] = [];
    for (const provider of this.providers) {
      for (const model of provider.models) {
        allModels.push({
          ...model,
          provider: provider.id as any,
          endpoint: this.buildEndpoint(provider),
          apiKey: provider.apiKey,
          isActive: model.id === this.activeModelId,
          status: 'idle',
        });
      }
    }
    return allModels;
  }

  // ── Get model by ID ──

  getModelById(modelId: string): AIModel | undefined {
    for (const provider of this.providers) {
      const model = provider.models.find((m) => m.id === modelId);
      if (model) {
        return {
          ...model,
          provider: provider.id as any,
          endpoint: this.buildEndpoint(provider),
          apiKey: provider.apiKey,
          isActive: model.id === this.activeModelId,
          status: 'idle',
        };
      }
    }
    return undefined;
  }

  // ── API Key ──

  getApiKeyURL(providerId: string): string {
    return this.getProvider(providerId)?.apiKeyURL ?? '';
  }

  // ── Sync to appStore ──

  private syncInProgress = false;

  /**
   * Sync current state to useAppStore mirror
   * This should be called after any state change
   */
  syncToAppStore(): void {
    // Prevent concurrent sync operations
    if (this.syncInProgress) {
      log.info('Sync already in progress, skipping');
      return;
    }

    this.syncInProgress = true;
    log.info('Starting sync to appStore...');

    try {
      // Use dynamic import to avoid circular dependency in tests
      const storeModule = require('../store');
      const useAppStore = storeModule.useAppStore;
      const models = this.getAllModels();
      const { syncAIModelsFromProvider } = useAppStore.getState();
      if (syncAIModelsFromProvider) {
        syncAIModelsFromProvider(models, this.activeModelId);
        log.info('Sync completed:', {
          modelCount: models.length,
          activeModelId: this.activeModelId,
        });
      } else {
        log.warn('syncAIModelsFromProvider not available');
      }
    } catch (e: unknown) {
      // Silently handle errors in test environment
      const error = e as Error & { code?: string };
      if (error.code !== 'MODULE_NOT_FOUND') {
        log.warn('Failed to sync to appStore:', error.message || error);
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Override addModel to auto-sync
   */
  addModel(providerId: string, model: AIModel): void {
    log.info('addModel called:', { providerId, model });
    const provider = this.getProvider(providerId);
    if (provider) {
      // Check if model already exists in provider
      const existsInProvider = provider.models.some(
        (m) => m.id === model.id || m.name === model.name
      );
      if (!existsInProvider) {
        provider.models.push(model);
        this.saveToStorage();
        log.info('Model added to provider successfully');
      } else {
        log.info('Model already exists in provider, skipping');
      }
      // Always sync to appStore
      this.syncToAppStore();
    } else {
      log.warn('Provider not found:', providerId);
    }
  }

  /**
   * Override removeModel to auto-sync
   */
  removeModel(providerId: string, modelId: string): void {
    const provider = this.getProvider(providerId);
    if (provider) {
      provider.models = provider.models.filter((m) => m.id !== modelId);
      this.saveToStorage();
      this.syncToAppStore();
    }
  }

  /**
   * Override setActiveModel to auto-sync
   */
  setActiveModel(modelId: string): void {
    this.activeModelId = modelId;
    this.saveToStorage();
    this.syncToAppStore();
  }

  /**
   * Override setApiKey to auto-sync
   */
  setApiKey(providerId: string, apiKey: string): void {
    this.updateProvider(providerId, { apiKey });
    this.syncToAppStore();
  }

  // ── Chat (mock in browser sandbox) ──

  async chat(messages: AIChatMessage[], options?: AIChatOptions): Promise<AIChatResponse> {
    const provider = this.getActiveProvider() ?? this.providers.find((p) => p.enabled);
    if (!provider) throw new Error('No active AI provider configured');

    // Check cache
    const cacheKey = JSON.stringify({ messages, options });
    if (this.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL * 1000) {
        return cached.data;
      }
    }

    // Check rate limit
    if (this.rateLimitEnabled && !this.checkRateLimit(provider.id)) {
      throw new Error('Rate limit exceeded. Please wait before making more requests.');
    }

    const startTime = Date.now();
    try {
      // In browser sandbox, simulate response
      const response = this.simulateResponse(messages, provider);
      const latency = Date.now() - startTime;

      // Record metrics
      this.recordMetrics(
        provider.id,
        this.activeModelId ?? 'default',
        latency,
        true,
        response.usage.totalTokens
      );

      // Track cost
      this.trackCost(provider.id, response.usage.promptTokens, response.usage.completionTokens);

      // Cache response
      if (this.cacheEnabled) {
        this.cache.set(cacheKey, { data: response, timestamp: Date.now() });
        this.cleanupCache();
      }

      return response;
    } catch (error) {
      const latency = Date.now() - startTime;
      this.recordMetrics(provider.id, this.activeModelId ?? 'default', latency, false, 0);
      this.recordError(provider.id, this.activeModelId ?? 'default', error);

      // Attempt fallback
      const fallback = this.findFallbackProvider(provider.id);
      if (fallback) {
        log.warn(`Falling back to ${fallback.displayName}`);
        this.activeProviderId = fallback.id;
        return this.chat(messages, options);
      }
      throw error;
    }
  }

  // ── Performance Monitoring ──

  getPerformanceMetrics(): AIPerformanceMetrics[] {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return this.performanceMetrics.filter((m) => m.timestamp >= oneHourAgo);
  }

  getErrorHistory(): AIErrorAnalysis[] {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return this.errorHistory.filter((e) => e.timestamp >= oneHourAgo);
  }

  getCostReport(): Map<string, { inputTokens: number; outputTokens: number; cost: number }> {
    return new Map(this.costTracker);
  }

  // ── Intelligent Detection ──

  detectBestProvider(): AIProviderConfig | null {
    // Local-First: Ollama has highest priority by design (priority=1)
    // If Ollama is available locally, prefer it (零网络依赖、零CORS、零跟踪)
    const ollama = this.getProvider('ollama');
    if (ollama?.enabled) {
      return ollama;
    }

    const metrics = this.getPerformanceMetrics();
    if (metrics.length === 0) {
      // Fallback to lowest priority number (highest priority) among enabled
      const enabled = this.providers.filter((p) => p.enabled);
      return enabled.sort((a, b) => a.priority - b.priority)[0] ?? null;
    }

    const scores = new Map<string, number>();
    for (const m of metrics) {
      const current = scores.get(m.providerId) ?? 0;
      const score = m.successRate * 0.5 + (m.throughput / 100) * 0.3 - (m.latency / 10000) * 0.2;
      scores.set(m.providerId, current + score);
    }

    let bestId = '';
    let bestScore = -Infinity;
    for (const [id, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    }

    return this.getProvider(bestId) ?? this.providers.find((p) => p.enabled) ?? null;
  }

  // ── Local-First: Detect locally running Ollama instance ──
  async detectLocalOllama(customUrl?: string): Promise<boolean> {
    const url = customUrl || 'http://localhost:11434';
    try {
      const resp = await fetch(`${url}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  // ── Local-First: Auto-activate Ollama if running locally ──
  async autoActivateLocalOllama(): Promise<boolean> {
    const ollama = this.getProvider('ollama');
    if (!ollama?.enabled) return false;

    const isRunning = await this.detectLocalOllama(ollama.baseURL);
    if (isRunning && !this.activeProviderId) {
      this.setActiveProvider('ollama');
      return true;
    }
    return false;
  }

  // ── Local-First: Chat with automatic Ollama fallback on network failure ──
  async chatWithLocalFallback(messages: AIChatMessage[]): Promise<AIChatResponse> {
    const order = ['ollama', 'anthropic', 'openai', 'deepseek', 'zhipuai', 'aliyun', 'baidu'];
    const originalProviderId = this.activeProviderId;

    for (const providerId of order) {
      const provider = this.getProvider(providerId);
      if (!provider?.enabled) continue;

      // Skip cloud providers when offline
      if (provider.type === 'cloud' && !navigator.onLine) continue;

      try {
        // Temporarily switch to this provider for the call
        this.setActiveProvider(providerId);
        return await this.chat(messages);
      } catch (e) {
        log.warn(`Provider ${providerId} failed, trying next:`, e);
        continue;
      }
    }

    // Restore original provider
    if (originalProviderId) this.setActiveProvider(originalProviderId);

    throw new Error(
      '所有 AI 提供者均不可用。建议：1) 启动本地 Ollama  2) 检查网络连接  3) 配置 API 密钥'
    );
  }

  // ── Private helpers ──

  private simulateResponse(messages: AIChatMessage[], provider: AIProviderConfig): AIChatResponse {
    const lastMsg = messages[messages.length - 1]?.content ?? '';
    return {
      id: `resp-${Date.now()}`,
      model: this.activeModelId ?? 'default',
      choices: [
        {
          message: {
            role: 'assistant',
            content: `[${provider.displayName}] Response to: ${lastMsg.slice(0, 50)}...`,
          },
          finishReason: 'stop',
        },
      ],
      usage: {
        promptTokens: lastMsg.length,
        completionTokens: 50,
        totalTokens: lastMsg.length + 50,
      },
    };
  }

  private checkRateLimit(providerId: string): boolean {
    const key = providerId;
    const now = Date.now();
    const tracker = this.rateLimitTracker.get(key);
    if (!tracker || now > tracker.resetTime) {
      this.rateLimitTracker.set(key, { count: 1, resetTime: now + 60000 });
      return true;
    }
    if (tracker.count >= this.maxRequestsPerMinute) return false;
    tracker.count++;
    return true;
  }

  private findFallbackProvider(excludeId: string): AIProviderConfig | null {
    return (
      this.providers
        .filter((p) => p.enabled && p.id !== excludeId)
        .sort((a, b) => a.priority - b.priority)[0] ?? null
    );
  }

  private recordMetrics(
    providerId: string,
    modelId: string,
    latency: number,
    success: boolean,
    tokens: number
  ): void {
    this.performanceMetrics.push({
      providerId,
      modelId,
      timestamp: Date.now(),
      latency,
      throughput: tokens / Math.max(latency / 1000, 0.001),
      successRate: success ? 1 : 0,
      errorCount: success ? 0 : 1,
      totalRequests: 1,
    });
    // Keep last 500
    if (this.performanceMetrics.length > 500) {
      this.performanceMetrics = this.performanceMetrics.slice(-500);
    }
  }

  private recordError(providerId: string, modelId: string, error: unknown): void {
    const msg = error instanceof Error ? error.message : String(error);
    const errorType = this.classifyError(msg);
    this.errorHistory.push({
      providerId,
      modelId,
      errorType,
      errorMessage: msg,
      timestamp: Date.now(),
      count: 1,
      suggestions: this.getErrorSuggestions(errorType),
    });
    if (this.errorHistory.length > 500) {
      this.errorHistory = this.errorHistory.slice(-500);
    }
  }

  private classifyError(msg: string): AIErrorAnalysis['errorType'] {
    const lower = msg.toLowerCase();
    if (lower.includes('network') || lower.includes('fetch')) return 'network';
    if (lower.includes('rate limit') || lower.includes('429')) return 'rate_limit';
    if (lower.includes('auth') || lower.includes('401')) return 'authentication';
    if (lower.includes('api') || lower.includes('400')) return 'api';
    return 'unknown';
  }

  private getErrorSuggestions(type: AIErrorAnalysis['errorType']): string[] {
    const map: Record<string, string[]> = {
      network: ['检查网络连接', '确认 API 服务是否正常', '尝试使用代理'],
      rate_limit: ['降低请求频率', '升级 API 计划', '使用多密钥负载均衡'],
      authentication: ['检查 API 密钥', '重新生成密钥', '确认密钥权限'],
      api: ['检查请求参数', '确认模型名称', '查看 API 文档'],
      unknown: ['查看错误日志', '联系技术支持', '重启应用'],
    };
    return map[type] ?? map.unknown;
  }

  private trackCost(providerId: string, inputTokens: number, outputTokens: number): void {
    const provider = this.getProvider(providerId);
    if (!provider?.pricing) return;
    const cost =
      (inputTokens / 1000) * provider.pricing.inputPrice +
      (outputTokens / 1000) * provider.pricing.outputPrice;
    const key = providerId;
    const existing = this.costTracker.get(key) ?? { inputTokens: 0, outputTokens: 0, cost: 0 };
    existing.inputTokens += inputTokens;
    existing.outputTokens += outputTokens;
    existing.cost += cost;
    this.costTracker.set(key, existing);
  }

  private cleanupCache(): void {
    if (this.cache.size <= this.cacheMaxSize) return;
    const entries = [...this.cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    while (this.cache.size > this.cacheMaxSize && entries.length > 0) {
      const oldest = entries.shift();
      if (oldest) this.cache.delete(oldest[0]);
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('yyc3-ai-providers');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.providers) this.providers = data.providers;
        if (data.activeProviderId) this.activeProviderId = data.activeProviderId;
        if (data.activeModelId) this.activeModelId = data.activeModelId;
      }
    } catch {
      /* ignore */
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        'yyc3-ai-providers',
        JSON.stringify({
          providers: this.providers,
          activeProviderId: this.activeProviderId,
          activeModelId: this.activeModelId,
        })
      );
      // Auto-sync after save
      this.syncToAppStore();
    } catch {
      /* ignore */
    }
  }
}

// ── Singleton instance ──
export const aiProviderService = new AIProviderService();
