/**
 * @file intent-router.ts
 * @description YYC³ 意图识别路由引擎
 * Intent Router Engine
 * 双层意图识别：AI（Ollama 直连）优先，降级到本地关键词匹配。
 * 根据用户输入识别意图并映射到对应页面/面板。
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-06-02
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,intent,router,ai,navigation
 */

// ── Intent Types ──

export type IntentAction =
  | 'chat' // 通用聊天 → IDE chat 面板
  | 'code' // 代码生成/编辑 → IDE code 面板
  | 'debug' // 调试/修复 → IDE code 面板 + AI 分析
  | 'explain' // 解释代码 → IDE chat 面板
  | 'refactor' // 重构 → IDE code 面板
  | 'test' // 生成测试 → IDE code 面板
  | 'document' // 生成文档 → IDE chat 面板
  | 'translate' // 翻译 → IDE chat 面板
  | 'project' // 项目管理 → IDE 首页
  | 'settings' // 设置 → Settings 页面
  | 'deploy' // 部署 → IDE deploy 面板
  | 'database' // 数据库 → IDE database 面板
  | 'help'; // 帮助 → 快捷键面板

export interface IntentResult {
  action: IntentAction;
  confidence: number; // 0-1
  route: string; // 目标路由
  panel?: string; // IDE 内目标面板
  searchParams?: Record<string, string>; // URL 参数
  source: 'ai' | 'local'; // 识别来源
}

// ── AI Intent Recognition Prompt ──

const AI_INTENT_PROMPT = `You are an intent classifier for a coding IDE app. Given the user's message, classify it into exactly ONE of these intents:

- chat: General conversation, greetings, casual talk
- code: Code generation, writing code, creating components/functions
- debug: Fixing bugs, error analysis, troubleshooting
- explain: Explaining code, concepts, how things work
- refactor: Improving code structure, performance optimization
- test: Writing tests, test generation
- document: Writing documentation, comments, README
- translate: Translating text or code
- project: Project management, creating/opening/deleting projects
- settings: App settings, configuration, API keys, model setup
- deploy: Deployment, publishing, hosting
- database: Database operations, SQL, data management
- help: Help requests, keyboard shortcuts, how to use the app

Reply with ONLY a JSON object: {"intent":"<action>","confidence":0.95}
No other text.`;

// ── Local Keyword Patterns ──

interface LocalPattern {
  action: IntentAction;
  keywords: RegExp;
  route: string;
  panel?: string;
  searchParams?: Record<string, string>;
}

const LOCAL_PATTERNS: LocalPattern[] = [
  // code
  {
    action: 'code',
    keywords:
      /\b(写|生成|创建|实现|编写|开发|build|write|generate|create|implement|code|代码|组件|函数|function|component|module|模块|脚本|script)\b/i,
    route: '/ide',
    panel: 'code',
    searchParams: { action: 'code-gen' },
  },
  // debug
  {
    action: 'debug',
    keywords:
      /\b(调试|修复|bug|错误|报错|崩溃|debug|fix|error|crash|broken|issue|问题|异常|exception|traceback|fail|失败)\b/i,
    route: '/ide',
    panel: 'code',
    searchParams: { action: 'debug' },
  },
  // explain
  {
    action: 'explain',
    keywords:
      /\b(解释|说明|什么意思|explain|what does|how does|是什么|怎么工作|tell me about|讲解)\b/i,
    route: '/ide',
    panel: 'chat',
  },
  // refactor
  {
    action: 'refactor',
    keywords: /\b(重构|优化|改进|refactor|optimize|improve|clean up|整理|性能优化)\b/i,
    route: '/ide',
    panel: 'code',
    searchParams: { action: 'refactor' },
  },
  // test
  {
    action: 'test',
    keywords: /\b(测试|test|spec|unit test|单元测试|集成测试|测试用例|test case|vitest|jest)\b/i,
    route: '/ide',
    panel: 'code',
    searchParams: { action: 'test-gen' },
  },
  // document
  {
    action: 'document',
    keywords: /\b(文档|注释|readme|document|doc|comment|说明文档|使用指南)\b/i,
    route: '/ide',
    panel: 'chat',
  },
  // translate
  {
    action: 'translate',
    keywords: /\b(翻译|translate|翻译成|convert to|转成)\b/i,
    route: '/ide',
    panel: 'chat',
  },
  // project
  {
    action: 'project',
    keywords: /\b(项目|工程|project|新建项目|打开项目|创建项目|管理项目)\b/i,
    route: '/ide',
    panel: 'files',
  },
  // settings
  {
    action: 'settings',
    keywords: /\b(设置|配置|setting|config|API.?key|密钥|模型设置|model|preference|偏好)\b/i,
    route: '/settings',
  },
  // deploy
  {
    action: 'deploy',
    keywords: /\b(部署|发布|上线|deploy|publish|hosting|发布到|上线到)\b/i,
    route: '/ide',
    searchParams: { action: 'deploy' },
  },
  // database
  {
    action: 'database',
    keywords: /\b(数据库|SQL|查询|database|table|表|字段|field|query|select|insert|CRUD)\b/i,
    route: '/ide',
    panel: 'database',
  },
  // help
  {
    action: 'help',
    keywords: /\b(帮助|help|快捷键|shortcut|怎么用|使用方法|how to use|guide|指南)\b/i,
    route: '/ide',
    searchParams: { action: 'help' },
  },
];

// ── Intent Router ──

class IntentRouter {
  private ollamaBaseUrl = 'http://localhost:11434';
  private aiTimeout = 2000; // ms - 快速失败降级到本地

  /**
   * 设置 Ollama 基础 URL
   */
  setOllamaBaseUrl(url: string): void {
    this.ollamaBaseUrl = url.replace(/\/+$/, '');
  }

  /**
   * 主入口：AI 优先，降级到本地
   */
  async recognize(input: string): Promise<IntentResult> {
    const trimmed = input.trim();
    if (!trimmed) {
      return {
        action: 'chat',
        confidence: 0,
        route: '/ide',
        panel: 'chat',
        source: 'local',
      };
    }

    // 1. 尝试 AI 识别（Ollama 直连）
    const aiResult = await this.recognizeWithAI(trimmed);
    if (aiResult && aiResult.confidence >= 0.7) {
      return aiResult;
    }

    // 2. 降级到本地关键词匹配
    return this.recognizeLocal(trimmed);
  }

  /**
   * AI 意图识别（通过 Ollama API 直连）
   */
  private async recognizeWithAI(input: string): Promise<IntentResult | null> {
    try {
      // 获取当前激活的模型
      const { aiProviderService } = await import('./ai-provider');
      const provider = aiProviderService.getActiveProvider();
      if (!provider) return null;

      const modelId = aiProviderService.getActiveModelId();
      if (!modelId) return null;

      // 构建请求
      const isOllama = provider.id === 'ollama';
      const baseUrl = isOllama ? this.ollamaBaseUrl : provider.baseURL;
      const endpoint = isOllama ? `${baseUrl}/api/chat` : `${baseUrl}/chat/completions`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (!isOllama && provider.apiKey) {
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
      }

      const body = isOllama
        ? {
            model: modelId,
            messages: [
              { role: 'system', content: AI_INTENT_PROMPT },
              { role: 'user', content: input },
            ],
            stream: false,
            options: { temperature: 0.1, num_predict: 50 },
          }
        : {
            model: modelId,
            messages: [
              { role: 'system', content: AI_INTENT_PROMPT },
              { role: 'user', content: input },
            ],
            max_tokens: 50,
            temperature: 0.1,
          };

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.aiTimeout),
      });

      if (!resp.ok) return null;

      const data = await resp.json();

      // 解析响应（兼容 Ollama/OpenAI 格式）
      const content = data?.message?.content || data?.choices?.[0]?.message?.content || '';

      // 提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*?"intent"[\s\S]*?\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      const action = this.validateAction(parsed.intent);
      const confidence = Math.min(Math.max(Number(parsed.confidence) || 0.5, 0), 1);

      return this.buildResult(action, confidence, 'ai');
    } catch {
      // AI 不可用，降级到本地
      return null;
    }
  }

  /**
   * 本地关键词意图识别
   */
  private recognizeLocal(input: string): IntentResult {
    const lower = input.toLowerCase();

    // 按优先级匹配（更具体的模式排前面）
    let bestMatch: LocalPattern | null = null;
    let bestScore = 0;

    for (const pattern of LOCAL_PATTERNS) {
      const match = lower.match(pattern.keywords);
      if (match) {
        // 匹配的关键词数量越多，置信度越高
        const allMatches = lower.match(new RegExp(pattern.keywords.source, 'gi'));
        const score = (allMatches?.length || 1) * 0.2 + 0.3;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = pattern;
        }
      }
    }

    if (bestMatch && bestScore >= 0.3) {
      return {
        action: bestMatch.action,
        confidence: Math.min(bestScore, 0.85),
        route: bestMatch.route,
        panel: bestMatch.panel,
        searchParams: bestMatch.searchParams,
        source: 'local',
      };
    }

    // 默认：通用聊天
    return {
      action: 'chat',
      confidence: 0.3,
      route: '/ide',
      panel: 'chat',
      source: 'local',
    };
  }

  /**
   * 验证 action 合法性
   */
  private validateAction(raw: string): IntentAction {
    const valid: IntentAction[] = [
      'chat',
      'code',
      'debug',
      'explain',
      'refactor',
      'test',
      'document',
      'translate',
      'project',
      'settings',
      'deploy',
      'database',
      'help',
    ];
    if (valid.includes(raw as IntentAction)) return raw as IntentAction;
    return 'chat';
  }

  /**
   * 根据 action 构建 IntentResult
   */
  private buildResult(
    action: IntentAction,
    confidence: number,
    source: 'ai' | 'local'
  ): IntentResult {
    const localPattern = LOCAL_PATTERNS.find((p) => p.action === action);
    return {
      action,
      confidence,
      route: localPattern?.route ?? '/ide',
      panel: localPattern?.panel ?? 'chat',
      searchParams: localPattern?.searchParams,
      source,
    };
  }
}

export const intentRouter = new IntentRouter();
