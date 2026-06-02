/**
 * @file plugin-runtime.ts
 * @description YYC³便携式智能AI系统 - 插件运行时引擎
 * Plugin Runtime Engine
 * Manages plugin lifecycle: register, activate, deactivate, execute.
 * Provides sandbox API surface for plugins with permission checks.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,plugins,runtime,sandbox
 */

// ── Plugin Manifest Validation ──

const REQUIRED_PERMISSIONS: PluginPermission[] = ['storage'];
const OPTIONAL_PERMISSIONS: PluginPermission[] = [
  'editor',
  'ai',
  'ui',
  'network',
  'system',
  'notification',
  'database',
];
const ALL_PERMISSIONS: PluginPermission[] = [...REQUIRED_PERMISSIONS, ...OPTIONAL_PERMISSIONS];

/**
 * Validate plugin manifest
 */
function validateManifest(manifest: PluginManifest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!manifest.id || manifest.id.length < 3) {
    errors.push('Plugin ID must be at least 3 characters');
  }
  if (!manifest.name || manifest.name.length < 2) {
    errors.push('Plugin name must be at least 2 characters');
  }
  if (!manifest.version) {
    errors.push('Plugin version is required');
  }
  if (!manifest.description) {
    errors.push('Plugin description is required');
  }
  if (!manifest.author) {
    errors.push('Plugin author is required');
  }
  if (!manifest.main) {
    errors.push('Plugin main entry point is required');
  }

  // Validate permissions
  if (!manifest.permissions || manifest.permissions.length === 0) {
    errors.push('Plugin must have at least one permission');
  }

  for (const perm of manifest.permissions) {
    if (!ALL_PERMISSIONS.includes(perm)) {
      errors.push(`Invalid permission: ${perm}. Allowed: ${ALL_PERMISSIONS.join(', ')}`);
    }
  }

  // Check for minimum required permissions
  const hasMinPermissions = REQUIRED_PERMISSIONS.every((p) => manifest.permissions.includes(p));
  if (!hasMinPermissions) {
    errors.push(`Plugin must have at least these permissions: ${REQUIRED_PERMISSIONS.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if plugin has required permission for API call
 */
function hasPermission(manifest: PluginManifest, permission: PluginPermission): boolean {
  return manifest.permissions.includes(permission);
}

// ── Plugin API surface exposed to plugins ──

// ── Plugin Types ──

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  appVersion?: string;
  description: string;
  author: string;
  permissions: PluginPermission[];
  main: string;
  entry?: string;
  icon?: string;
  keywords?: string[];
  license?: string;
  homepage?: string;
  repository?: string;
}

export interface PluginInstance {
  id: string;
  manifest: PluginManifest;
  activated: boolean;
  status: 'inactive' | 'activating' | 'active' | 'deactivating' | 'loading' | 'error';
  error?: string;
  activatedAt?: number;
}

export type PluginPermission =
  | 'storage'
  | 'editor'
  | 'ai'
  | 'ui'
  | 'network'
  | 'system'
  | 'notification'
  | 'database';

export interface PluginAPI {
  storage: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
    delete: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    getAll: () => Promise<Record<string, unknown>>;
    onChange: (handler: (key: string, value: unknown) => void) => () => void;
  };
  editor: {
    getActiveFile: () => string | null;
    getContent: () => string;
    setContent: (content: string) => void;
    getSelection: () => string;
    setSelection: (text: string) => void;
    insertText: (text: string) => void;
    getLanguage: () => string;
    format: () => Promise<void>;
    onContentChange: (handler: (content: string) => void) => () => void;
  };
  ai: {
    generateCode: (
      prompt: string,
      options?: {
        provider?: string;
        model?: string;
        language?: string;
        maxTokens?: number;
        temperature?: number;
      }
    ) => Promise<string>;
    completeCode: (context: string, options?: { maxLength?: number }) => Promise<string[]>;
    optimizeCode: (code: string, options?: { goals?: string[] }) => Promise<string>;
    explainCode: (code: string, options?: { detailLevel?: string }) => Promise<string>;
    reviewCode: (code: string) => Promise<{
      score: number;
      issues: { severity: string; line: number; message: string }[];
      suggestions: string[];
    }>;
    getActiveModel: () => { name: string; provider: string } | null;
    isModelConfigured: () => boolean;
  };
  database: {
    listConnections: () => Promise<string[]>;
    executeQuery: (
      connId: string,
      sql: string
    ) => Promise<{ columns: string[]; rows: Record<string, unknown>[] }>;
    listTables: (connId: string, schema?: string) => Promise<string[]>;
  };
  collaboration: {
    getPeers: () => { id: string; name: string; online: boolean }[];
    getConnectionStatus: () => 'connected' | 'disconnected' | 'connecting';
  };
  notification: {
    info: (msg: string) => void;
    success: (msg: string) => void;
    warning: (msg: string) => void;
    error: (msg: string) => void;
  };
  ui: {
    showPanel: (id: string) => void;
    hidePanel: (id: string) => void;
    registerPanel: (config: {
      id: string;
      title: string;
      position: 'left' | 'right' | 'bottom';
      icon?: string;
    }) => void;
    registerButton: (config: {
      id: string;
      label: string;
      position: 'toolbar' | 'editor' | 'sidebar';
      onClick: () => void;
    }) => void;
    registerMenuItem: (config: {
      id: string;
      label: string;
      position: string;
      onClick: () => void;
    }) => void;
    showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    showDialog: (config: {
      title: string;
      message: string;
      confirmLabel?: string;
      cancelLabel?: string;
    }) => Promise<boolean>;
    showInputBox: (options: {
      title: string;
      placeholder?: string;
      value?: string;
    }) => Promise<string | undefined>;
  };
  logger: {
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
  };
  fetch: typeof fetch;
  sendMessage: (message: unknown) => Promise<unknown>;
  onMessage: (handler: (message: unknown) => void) => () => void;
}

// ── Plugin Runtime ──

export class PluginRuntime {
  private plugins = new Map<string, PluginInstance>();
  private handlers = new Map<string, Map<string, Function[]>>();
  private listeners = new Set<() => void>();

  constructor() {
    this.loadFromStorage();
  }

  // ── Plugin CRUD ──

  register(manifest: PluginManifest): PluginInstance {
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} already registered`);
    }

    // Validate manifest
    const validation = validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Invalid plugin manifest: ${validation.errors.join('; ')}`);
    }

    const instance: PluginInstance = {
      id: manifest.id,
      manifest,
      activated: false,
      status: 'inactive',
    };
    this.plugins.set(manifest.id, instance);
    this.saveToStorage();
    this.notify();
    return instance;
  }

  unregister(pluginId: string): void {
    const instance = this.plugins.get(pluginId);
    if (instance?.status === 'active') {
      this.deactivate(pluginId);
    }
    this.plugins.delete(pluginId);
    this.handlers.delete(pluginId);
    this.saveToStorage();
    this.notify();
  }

  async activate(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) throw new Error(`Plugin ${pluginId} not found`);
    if (instance.status === 'active') return;

    instance.status = 'loading';
    this.notify();

    try {
      // Validate permissions using new hasPermission helper
      const requiredPerms = instance.manifest.permissions;
      for (const perm of requiredPerms) {
        if (!hasPermission(instance.manifest, perm as PluginPermission)) {
          throw new Error(`Plugin missing required permission: ${perm}`);
        }
      }

      // Simulate plugin activation (in production, load and execute plugin code)
      await new Promise((resolve) => setTimeout(resolve, 300));

      instance.status = 'active';
      instance.activatedAt = Date.now();
      instance.error = undefined;
      this.saveToStorage();
      this.notify();
    } catch (err) {
      instance.status = 'error';
      instance.error = err instanceof Error ? err.message : String(err);
      this.notify();
      throw err;
    }
  }

  deactivate(pluginId: string): void {
    const instance = this.plugins.get(pluginId);
    if (!instance || instance.status !== 'active') return;

    // Clean up event handlers
    this.handlers.delete(pluginId);

    instance.status = 'inactive';
    instance.activatedAt = undefined;
    this.saveToStorage();
    this.notify();
  }

  // ── Query ──

  getPlugin(id: string): PluginInstance | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  getActivePlugins(): PluginInstance[] {
    return this.getAllPlugins().filter((p) => p.status === 'active');
  }

  // ── Event system ──

  on(pluginId: string, event: string, handler: Function): void {
    if (!this.handlers.has(pluginId)) {
      this.handlers.set(pluginId, new Map());
    }
    const pluginHandlers = this.handlers.get(pluginId)!;
    if (!pluginHandlers.has(event)) {
      pluginHandlers.set(event, []);
    }
    pluginHandlers.get(event)!.push(handler);
  }

  emit(event: string, data?: unknown): void {
    for (const [, pluginHandlers] of this.handlers) {
      const handlers = pluginHandlers.get(event);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(data);
          } catch (e) {
            console.error('Plugin handler error:', e);
          }
        }
      }
    }
  }

  // ── Change listener ──

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ── Preset plugins ──

  getPresetManifests(): PluginManifest[] {
    return [
      {
        id: 'plugin-code-analyzer',
        name: '代码分析器',
        version: '1.0.0',
        description: '静态代码分析与质量评分',
        author: 'YYC³ Team',
        appVersion: '1.0.0',
        main: 'index.ts',
        icon: '🔍',
        permissions: ['editor', 'notification'],
      },
      {
        id: 'plugin-design-sync',
        name: '设计同步',
        version: '1.0.0',
        description: 'Figma 设计稿自动同步',
        author: 'YYC³ Team',
        appVersion: '1.0.0',
        main: 'index.ts',
        icon: '🎨',
        permissions: ['network', 'editor', 'storage'],
      },
      {
        id: 'plugin-test-gen',
        name: '测试生成器',
        version: '1.0.0',
        description: 'AI 驱动自动生成单元测试',
        author: 'YYC³ Team',
        appVersion: '1.0.0',
        main: 'index.ts',
        icon: '🧪',
        permissions: ['editor', 'ai', 'storage'],
      },
      {
        id: 'plugin-doc-writer',
        name: '文档撰写',
        version: '1.0.0',
        description: 'AI 驱动自动生成 API 文档',
        author: 'YYC³ Team',
        appVersion: '1.0.0',
        main: 'index.ts',
        icon: '📝',
        permissions: ['editor', 'ai', 'notification'],
      },
      {
        id: 'plugin-i18n-helper',
        name: '国际化助手',
        version: '1.0.0',
        description: '自动提取和翻译 i18n 键值',
        author: 'YYC³ Team',
        appVersion: '1.0.0',
        main: 'index.ts',
        icon: '🌐',
        permissions: ['editor', 'ai', 'storage', 'notification'],
      },
    ];
  }

  // ── Private ──

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('yyc3-plugins');
      if (saved) {
        const data = JSON.parse(saved);
        for (const inst of data) {
          this.plugins.set(inst.manifest.id, { ...inst, status: 'inactive' });
        }
      }
    } catch {
      /* ignore */
    }
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.plugins.values()).map((p) => ({
        manifest: p.manifest,
        status: p.status === 'active' ? 'inactive' : p.status,
      }));
      localStorage.setItem('yyc3-plugins', JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }
}

// ── Singleton ──
export const pluginRuntime = new PluginRuntime();
