/**
 * @file agent-skills.ts
 * @description YYC³ Agent能力扩展 - 技能注册与工具调用
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [agent],[skills],[tools],[capabilities],[registry]
 *
 * @brief Agent能力扩展，实现技能注册与工具调用
 *
 * @details
 * - 技能注册系统
 * - 工具调用接口
 * - 知识库集成
 * - 能力发现
 * - 版本管理
 */

export interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  category: SkillCategory;
  tags: string[];
  inputSchema: SkillSchema;
  outputSchema: SkillSchema;
  handler: SkillHandler;
  metadata?: SkillMetadata;
  enabled: boolean;
  priority: number;
}

export type SkillCategory =
  | 'analysis'
  | 'generation'
  | 'transformation'
  | 'communication'
  | 'automation'
  | 'integration'
  | 'utility';

export interface SkillSchema {
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

export interface SchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

export interface SkillMetadata {
  author?: string;
  createdAt: number;
  updatedAt: number;
  dependencies?: string[];
  examples?: SkillExample[];
  documentation?: string;
}

export interface SkillExample {
  input: unknown;
  output: unknown;
  description?: string;
}

export interface SkillContext {
  agentId: string;
  sessionId: string;
  userId?: string;
  environment: Record<string, unknown>;
  resources: Map<string, unknown>;
  logger: SkillLogger;
}

export interface SkillLogger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

export interface SkillResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: SkillError;
  metadata?: Record<string, unknown>;
}

export interface SkillError {
  code: string;
  message: string;
  details?: unknown;
  recoverable: boolean;
}

export type SkillHandler<T = unknown, R = unknown> = (
  input: T,
  context: SkillContext
) => Promise<SkillResult<R>>;

export interface Tool {
  id: string;
  name: string;
  description: string;
  type: ToolType;
  config: ToolConfig;
  handler: ToolHandler;
  enabled: boolean;
}

export type ToolType = 'api' | 'cli' | 'file' | 'database' | 'web' | 'ai' | 'custom';

export interface ToolConfig {
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  authentication?: {
    type: 'none' | 'api_key' | 'oauth' | 'basic';
    credentials?: Record<string, string>;
  };
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoff: 'fixed' | 'exponential';
    initialDelay: number;
  };
}

export type ToolHandler<T = unknown, R = unknown> = (params: T, config: ToolConfig) => Promise<R>;

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  embedding?: number[];
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeQuery {
  query: string;
  category?: string;
  tags?: string[];
  limit?: number;
  threshold?: number;
}

class SkillRegistry {
  private skills: Map<string, Skill> = new Map();
  private categoryIndex: Map<SkillCategory, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  register(skill: Omit<Skill, 'id' | 'metadata'> & { id?: string }): string {
    const skillId = skill.id || this.generateId();

    const fullSkill: Skill = {
      ...skill,
      id: skillId,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    this.skills.set(skillId, fullSkill);

    if (!this.categoryIndex.has(skill.category)) {
      this.categoryIndex.set(skill.category, new Set());
    }
    this.categoryIndex.get(skill.category)!.add(skillId);

    for (const tag of skill.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(skillId);
    }

    return skillId;
  }

  unregister(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;

    this.skills.delete(skillId);
    this.categoryIndex.get(skill.category)?.delete(skillId);
    skill.tags.forEach((tag) => this.tagIndex.get(tag)?.delete(skillId));

    return true;
  }

  get(skillId: string): Skill | undefined {
    return this.skills.get(skillId);
  }

  getByCategory(category: SkillCategory): Skill[] {
    const ids = this.categoryIndex.get(category);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.skills.get(id))
      .filter((s): s is Skill => s !== undefined);
  }

  getByTag(tag: string): Skill[] {
    const ids = this.tagIndex.get(tag);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.skills.get(id))
      .filter((s): s is Skill => s !== undefined);
  }

  search(query: string): Skill[] {
    const lowerQuery = query.toLowerCase();
    const results: Array<{ skill: Skill; score: number }> = [];

    for (const skill of this.skills.values()) {
      let score = 0;

      if (skill.name.toLowerCase().includes(lowerQuery)) {
        score += 10;
      }
      if (skill.description.toLowerCase().includes(lowerQuery)) {
        score += 5;
      }
      if (skill.tags.some((t) => t.toLowerCase().includes(lowerQuery))) {
        score += 3;
      }

      if (score > 0) {
        results.push({ skill, score });
      }
    }

    return results.sort((a, b) => b.score - a.score).map((r) => r.skill);
  }

  async execute<T = unknown, R = unknown>(
    skillId: string,
    input: T,
    context: SkillContext
  ): Promise<SkillResult<R>> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return {
        success: false,
        error: {
          code: 'SKILL_NOT_FOUND',
          message: `技能不存在: ${skillId}`,
          recoverable: false,
        },
      };
    }

    if (!skill.enabled) {
      return {
        success: false,
        error: {
          code: 'SKILL_DISABLED',
          message: `技能已禁用: ${skill.name}`,
          recoverable: false,
        },
      };
    }

    const validation = this.validateInput(skill, input);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `输入验证失败: ${validation.errors.join(', ')}`,
          recoverable: true,
        },
      };
    }

    try {
      const result = await skill.handler(input, context);
      return result as SkillResult<R>;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : '执行错误',
          recoverable: true,
        },
      };
    }
  }

  enable(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;
    skill.enabled = true;
    return true;
  }

  disable(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;
    skill.enabled = false;
    return true;
  }

  getAll(): Skill[] {
    return Array.from(this.skills.values());
  }

  getStats(): {
    total: number;
    enabled: number;
    byCategory: Record<SkillCategory, number>;
  } {
    let enabled = 0;
    const byCategory: Record<SkillCategory, number> = {
      analysis: 0,
      generation: 0,
      transformation: 0,
      communication: 0,
      automation: 0,
      integration: 0,
      utility: 0,
    };

    for (const skill of this.skills.values()) {
      if (skill.enabled) enabled++;
      byCategory[skill.category]++;
    }

    return { total: this.skills.size, enabled, byCategory };
  }

  private validateInput(skill: Skill, input: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const schema = skill.inputSchema;

    if (typeof input !== 'object' || input === null) {
      errors.push('输入必须是对象');
      return { valid: false, errors };
    }

    const inputObj = input as Record<string, unknown>;

    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in inputObj)) {
          errors.push(`缺少必填字段: ${field}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private generateId(): string {
    return `skill-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Omit<Tool, 'id'> & { id?: string }): string {
    const toolId = tool.id || this.generateId();

    const fullTool: Tool = {
      ...tool,
      id: toolId,
    };

    this.tools.set(toolId, fullTool);
    return toolId;
  }

  unregister(toolId: string): boolean {
    return this.tools.delete(toolId);
  }

  get(toolId: string): Tool | undefined {
    return this.tools.get(toolId);
  }

  async invoke<T = unknown, R = unknown>(toolId: string, params: T): Promise<R> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`工具不存在: ${toolId}`);
    }

    if (!tool.enabled) {
      throw new Error(`工具已禁用: ${tool.name}`);
    }

    return tool.handler(params, tool.config) as Promise<R>;
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  getByType(type: ToolType): Tool[] {
    return Array.from(this.tools.values()).filter((t) => t.type === type);
  }

  private generateId(): string {
    return `tool-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

class KnowledgeBase {
  private entries: Map<string, KnowledgeEntry> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();

  add(entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): string {
    const entryId = entry.id || this.generateId();

    const fullEntry: KnowledgeEntry = {
      ...entry,
      id: entryId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.entries.set(entryId, fullEntry);

    if (!this.categoryIndex.has(entry.category)) {
      this.categoryIndex.set(entry.category, new Set());
    }
    this.categoryIndex.get(entry.category)!.add(entryId);

    return entryId;
  }

  update(entryId: string, updates: Partial<KnowledgeEntry>): boolean {
    const entry = this.entries.get(entryId);
    if (!entry) return false;

    Object.assign(entry, updates, { updatedAt: Date.now() });
    return true;
  }

  remove(entryId: string): boolean {
    const entry = this.entries.get(entryId);
    if (!entry) return false;

    this.entries.delete(entryId);
    this.categoryIndex.get(entry.category)?.delete(entryId);

    return true;
  }

  get(entryId: string): KnowledgeEntry | undefined {
    return this.entries.get(entryId);
  }

  query(query: KnowledgeQuery): KnowledgeEntry[] {
    let results = Array.from(this.entries.values());

    if (query.category) {
      results = results.filter((e) => e.category === query.category);
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter((e) => query.tags!.some((tag) => e.tags.includes(tag)));
    }

    if (query.query) {
      const lowerQuery = query.query.toLowerCase();
      results = results.filter(
        (e) =>
          e.title.toLowerCase().includes(lowerQuery) || e.content.toLowerCase().includes(lowerQuery)
      );
    }

    const limit = query.limit || 10;
    return results.slice(0, limit);
  }

  getByCategory(category: string): KnowledgeEntry[] {
    const ids = this.categoryIndex.get(category);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.entries.get(id))
      .filter((e): e is KnowledgeEntry => e !== undefined);
  }

  getAll(): KnowledgeEntry[] {
    return Array.from(this.entries.values());
  }

  getStats(): {
    total: number;
    byCategory: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};

    for (const [category, ids] of this.categoryIndex) {
      byCategory[category] = ids.size;
    }

    return { total: this.entries.size, byCategory };
  }

  private generateId(): string {
    return `kb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const skillRegistry = new SkillRegistry();
export const toolRegistry = new ToolRegistry();
export const knowledgeBase = new KnowledgeBase();

export { SkillRegistry, ToolRegistry, KnowledgeBase };

export default SkillRegistry;
