/**
 * @file mcp-client.ts
 * @description YYC³ MCP客户端 - 连接管理与工具调用
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [mcp],[client],[connection],[discovery],[invocation]
 *
 * @brief MCP客户端，实现连接管理与工具调用
 *
 * @details
 * - 连接管理
 * - 资源发现
 * - 工具调用
 * - 提示词获取
 */

import type {
  MCPTransport,
  MCPResource,
  MCPResourceContent,
  MCPTool,
  MCPToolResult,
  MCPPrompt,
  MCPPromptResult,
  MCPCapabilities,
  MCPMessage,
} from './mcp-protocol';
import { MCP_VERSION, MCPProtocolHandler } from './mcp-protocol';

export interface MCPClientConfig {
  name: string;
  version: string;
  capabilities?: MCPCapabilities['capabilities'];
  timeout?: number;
}

export interface ServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
  capabilities: MCPCapabilities['capabilities'];
}

type MCPClientEventHandler = (event: { type: string; data?: unknown }) => void;

class MCPClient {
  private config: MCPClientConfig;
  private protocolHandler: MCPProtocolHandler;
  private transport: MCPTransport | null = null;
  private serverInfo: ServerInfo | null = null;
  private eventHandlers: Set<MCPClientEventHandler> = new Set();
  private resourceCache: Map<string, MCPResource> = new Map();
  private toolCache: Map<string, MCPTool> = new Map();
  private promptCache: Map<string, MCPPrompt> = new Map();
  private initialized = false;

  constructor(config: MCPClientConfig) {
    this.config = config;
    this.protocolHandler = new MCPProtocolHandler();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.protocolHandler.registerNotificationHandler(
      'notifications/resources/updated',
      (params) => {
        this.emit({ type: 'resourceUpdated', data: params });
      }
    );

    this.protocolHandler.registerNotificationHandler('notifications/resources/list_changed', () => {
      this.refreshResources();
      this.emit({ type: 'resourcesChanged' });
    });

    this.protocolHandler.registerNotificationHandler('notifications/tools/list_changed', () => {
      this.refreshTools();
      this.emit({ type: 'toolsChanged' });
    });

    this.protocolHandler.registerNotificationHandler('notifications/prompts/list_changed', () => {
      this.refreshPrompts();
      this.emit({ type: 'promptsChanged' });
    });

    this.protocolHandler.registerNotificationHandler('notifications/message', (params) => {
      this.emit({ type: 'message', data: params });
    });

    this.protocolHandler.registerNotificationHandler('notifications/progress', (params) => {
      this.emit({ type: 'progress', data: params });
    });
  }

  async connect(transport: MCPTransport): Promise<ServerInfo> {
    this.transport = transport;

    transport.on('onMessage', async (message: MCPMessage) => {
      await this.protocolHandler.handleIncomingMessage(message, transport);
    });

    transport.on('onError', (error: Error) => {
      this.emit({ type: 'error', data: error });
    });

    transport.on('onClose', () => {
      this.initialized = false;
      this.emit({ type: 'disconnected' });
    });

    await transport.connect();
    this.emit({ type: 'connected' });

    const result = await this.protocolHandler.sendRequest(
      transport,
      'initialize',
      {
        protocolVersion: MCP_VERSION,
        capabilities: {
          resources: { subscribe: true, listChanged: true },
          tools: { listChanged: true },
          prompts: { listChanged: true },
          ...this.config.capabilities,
        },
        clientInfo: {
          name: this.config.name,
          version: this.config.version,
        },
      },
      this.config.timeout
    );

    const initResult = result as {
      protocolVersion: string;
      capabilities: MCPCapabilities['capabilities'];
      serverInfo: { name: string; version: string };
    };

    this.serverInfo = {
      name: initResult.serverInfo.name,
      version: initResult.serverInfo.version,
      protocolVersion: initResult.protocolVersion,
      capabilities: initResult.capabilities,
    };

    await this.protocolHandler.sendNotification(transport, 'notifications/initialized');

    this.initialized = true;
    this.emit({ type: 'initialized', data: this.serverInfo });

    await Promise.all([this.refreshResources(), this.refreshTools(), this.refreshPrompts()]);

    return this.serverInfo;
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.disconnect();
      this.transport = null;
    }
    this.initialized = false;
    this.serverInfo = null;
    this.resourceCache.clear();
    this.toolCache.clear();
    this.promptCache.clear();
  }

  private async refreshResources(): Promise<void> {
    if (!this.transport) return;

    try {
      const result = (await this.protocolHandler.sendRequest(
        this.transport,
        'resources/list',
        undefined,
        this.config.timeout
      )) as { resources: MCPResource[] };

      this.resourceCache.clear();
      for (const resource of result.resources) {
        this.resourceCache.set(resource.uri, resource);
      }
    } catch (error) {
      console.error('刷新资源列表失败:', error);
    }
  }

  private async refreshTools(): Promise<void> {
    if (!this.transport) return;

    try {
      const result = (await this.protocolHandler.sendRequest(
        this.transport,
        'tools/list',
        undefined,
        this.config.timeout
      )) as { tools: MCPTool[] };

      this.toolCache.clear();
      for (const tool of result.tools) {
        this.toolCache.set(tool.name, tool);
      }
    } catch (error) {
      console.error('刷新工具列表失败:', error);
    }
  }

  private async refreshPrompts(): Promise<void> {
    if (!this.transport) return;

    try {
      const result = (await this.protocolHandler.sendRequest(
        this.transport,
        'prompts/list',
        undefined,
        this.config.timeout
      )) as { prompts: MCPPrompt[] };

      this.promptCache.clear();
      for (const prompt of result.prompts) {
        this.promptCache.set(prompt.name, prompt);
      }
    } catch (error) {
      console.error('刷新提示词列表失败:', error);
    }
  }

  getResources(): MCPResource[] {
    return Array.from(this.resourceCache.values());
  }

  getResource(uri: string): MCPResource | undefined {
    return this.resourceCache.get(uri);
  }

  async readResource(uri: string): Promise<MCPResourceContent[]> {
    if (!this.transport) {
      throw new Error('未连接到服务器');
    }

    const result = (await this.protocolHandler.sendRequest(
      this.transport,
      'resources/read',
      { uri },
      this.config.timeout
    )) as { contents: MCPResourceContent[] };

    return result.contents;
  }

  async subscribeResource(uri: string): Promise<void> {
    if (!this.transport) {
      throw new Error('未连接到服务器');
    }

    if (!this.serverInfo?.capabilities.resources?.subscribe) {
      throw new Error('服务器不支持资源订阅');
    }

    await this.protocolHandler.sendRequest(
      this.transport,
      'resources/subscribe',
      { uri },
      this.config.timeout
    );
  }

  async unsubscribeResource(uri: string): Promise<void> {
    if (!this.transport) {
      throw new Error('未连接到服务器');
    }

    await this.protocolHandler.sendRequest(
      this.transport,
      'resources/unsubscribe',
      { uri },
      this.config.timeout
    );
  }

  getTools(): MCPTool[] {
    return Array.from(this.toolCache.values());
  }

  getTool(name: string): MCPTool | undefined {
    return this.toolCache.get(name);
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    if (!this.transport) {
      throw new Error('未连接到服务器');
    }

    const result = await this.protocolHandler.sendRequest(
      this.transport,
      'tools/call',
      { name, arguments: args } as Record<string, unknown>,
      this.config.timeout
    );

    return result as MCPToolResult;
  }

  getPrompts(): MCPPrompt[] {
    return Array.from(this.promptCache.values());
  }

  getPrompt(name: string): MCPPrompt | undefined {
    return this.promptCache.get(name);
  }

  async getPromptResult(name: string, args: Record<string, string> = {}): Promise<MCPPromptResult> {
    if (!this.transport) {
      throw new Error('未连接到服务器');
    }

    const result = await this.protocolHandler.sendRequest(
      this.transport,
      'prompts/get',
      { name, arguments: args },
      this.config.timeout
    );

    return result as MCPPromptResult;
  }

  getServerInfo(): ServerInfo | null {
    return this.serverInfo;
  }

  getServerCapabilities(): MCPCapabilities['capabilities'] | null {
    return this.serverInfo?.capabilities || null;
  }

  hasCapability(capability: keyof MCPCapabilities['capabilities']): boolean {
    return this.serverInfo?.capabilities?.[capability] !== undefined;
  }

  isConnected(): boolean {
    return this.transport?.state === 'connected' && this.initialized;
  }

  on(handler: MCPClientEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emit(event: { type: string; data?: unknown }): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('事件处理器错误:', error);
      }
    }
  }
}

class MCPClientPool {
  private clients: Map<string, MCPClient> = new Map();

  async createClient(
    id: string,
    config: MCPClientConfig,
    transport: MCPTransport
  ): Promise<MCPClient> {
    if (this.clients.has(id)) {
      throw new Error(`客户端已存在: ${id}`);
    }

    const client = new MCPClient(config);
    await client.connect(transport);
    this.clients.set(id, client);

    return client;
  }

  getClient(id: string): MCPClient | undefined {
    return this.clients.get(id);
  }

  async removeClient(id: string): Promise<void> {
    const client = this.clients.get(id);
    if (client) {
      await client.disconnect();
      this.clients.delete(id);
    }
  }

  async disconnectAll(): Promise<void> {
    const disconnections = Array.from(this.clients.values()).map((client) => client.disconnect());
    await Promise.all(disconnections);
    this.clients.clear();
  }

  getAllClients(): MCPClient[] {
    return Array.from(this.clients.values());
  }

  getConnectedClients(): MCPClient[] {
    return this.getAllClients().filter((c) => c.isConnected());
  }
}

export const createMCPClient = (config: MCPClientConfig): MCPClient => {
  return new MCPClient(config);
};

export { MCPClient, MCPClientPool };

export default MCPClient;
