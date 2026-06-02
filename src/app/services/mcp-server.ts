/**
 * @file mcp-server.ts
 * @description YYC³ MCP服务端 - 资源提供与工具注册
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [mcp],[server],[resources],[tools],[prompts]
 *
 * @brief MCP服务端，实现资源提供与工具注册
 *
 * @details
 * - 资源提供
 * - 工具注册
 * - 提示词管理
 * - 能力协商
 */

import type {
  MCPTransport,
  MCPResource,
  MCPResourceContent,
  MCPTool,
  MCPToolCall,
  MCPToolResult,
  MCPPrompt,
  MCPPromptResult,
  MCPCapabilities,
  MCPInitializeParams,
  MCPInitializeResult,
  MCPMessage,
} from './mcp-protocol'
import { MCP_VERSION, MCPProtocolHandler, MCPErrorCodes } from './mcp-protocol'

export interface MCPServerConfig {
  name: string
  version: string
  capabilities?: MCPCapabilities['capabilities']
}

export interface ResourceProvider {
  list(): Promise<MCPResource[]>
  read(uri: string): Promise<MCPResourceContent>
  subscribe?(uri: string, callback: (content: MCPResourceContent) => void): () => void
}

export interface ToolExecutor {
  (call: MCPToolCall): Promise<MCPToolResult>
}

export interface PromptProvider {
  list(): Promise<MCPPrompt[]>
  get(name: string, args: Record<string, string>): Promise<MCPPromptResult>
}

type MCPServerEventHandler = (event: { type: string; data?: unknown }) => void

class MCPServer {
  private config: MCPServerConfig
  private protocolHandler: MCPProtocolHandler
  private transport: MCPTransport | null = null
  private resources: Map<string, ResourceProvider> = new Map()
  private tools: Map<string, { tool: MCPTool; executor: ToolExecutor }> = new Map()
  private prompts: Map<string, PromptProvider> = new Map()
  private resourceSubscriptions: Map<string, Set<(content: MCPResourceContent) => void>> = new Map()
  private clientCapabilities: MCPCapabilities['capabilities'] | null = null
  private eventHandlers: Set<MCPServerEventHandler> = new Set()
  private initialized = false

  constructor(config: MCPServerConfig) {
    this.config = config
    this.protocolHandler = new MCPProtocolHandler()
    this.setupHandlers()
  }

  private setupHandlers(): void {
    this.protocolHandler.registerRequestHandler('initialize', async (params) => {
      return this.handleInitialize(params as unknown as MCPInitializeParams)
    })

    this.protocolHandler.registerRequestHandler('resources/list', async () => {
      return this.handleResourcesList()
    })

    this.protocolHandler.registerRequestHandler('resources/read', async (params) => {
      return this.handleResourcesRead(params as { uri: string })
    })

    this.protocolHandler.registerRequestHandler('resources/subscribe', async (params) => {
      return this.handleResourcesSubscribe(params as { uri: string })
    })

    this.protocolHandler.registerRequestHandler('resources/unsubscribe', async (params) => {
      return this.handleResourcesUnsubscribe(params as { uri: string })
    })

    this.protocolHandler.registerRequestHandler('tools/list', async () => {
      return this.handleToolsList()
    })

    this.protocolHandler.registerRequestHandler('tools/call', async (params) => {
      return this.handleToolsCall(params as unknown as MCPToolCall)
    })

    this.protocolHandler.registerRequestHandler('prompts/list', async () => {
      return this.handlePromptsList()
    })

    this.protocolHandler.registerRequestHandler('prompts/get', async (params) => {
      return this.handlePromptsGet(params as { name: string; arguments: Record<string, string> })
    })

    this.protocolHandler.registerNotificationHandler('notifications/initialized', () => {
      this.initialized = true
      this.emit({ type: 'initialized' })
    })

    this.protocolHandler.registerNotificationHandler('notifications/cancelled', (params) => {
      this.emit({ type: 'cancelled', data: params })
    })
  }

  async connect(transport: MCPTransport): Promise<void> {
    this.transport = transport

    transport.on('onMessage', async (message: MCPMessage) => {
      await this.protocolHandler.handleIncomingMessage(message, transport)
    })

    transport.on('onError', (error: Error) => {
      this.emit({ type: 'error', data: error })
    })

    transport.on('onClose', () => {
      this.emit({ type: 'disconnected' })
    })

    await transport.connect()
    this.emit({ type: 'connected' })
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.disconnect()
      this.transport = null
    }
    this.initialized = false
  }

  registerResourceProvider(uriPrefix: string, provider: ResourceProvider): void {
    this.resources.set(uriPrefix, provider)
  }

  unregisterResourceProvider(uriPrefix: string): void {
    this.resources.delete(uriPrefix)
  }

  registerTool(tool: MCPTool, executor: ToolExecutor): void {
    this.tools.set(tool.name, { tool, executor })
  }

  unregisterTool(name: string): void {
    this.tools.delete(name)
  }

  registerPromptProvider(name: string, provider: PromptProvider): void {
    this.prompts.set(name, provider)
  }

  unregisterPromptProvider(name: string): void {
    this.prompts.delete(name)
  }

  async notifyResourceUpdated(uri: string, content: MCPResourceContent): Promise<void> {
    const subscribers = this.resourceSubscriptions.get(uri)
    if (subscribers) {
      for (const callback of subscribers) {
        callback(content)
      }
    }

    if (this.transport && this.clientCapabilities?.resources?.subscribe) {
      await this.protocolHandler.sendNotification(this.transport, 'notifications/resources/updated', {
        uri,
        content,
      })
    }
  }

  async notifyToolsListChanged(): Promise<void> {
    if (this.transport && this.clientCapabilities?.tools?.listChanged) {
      await this.protocolHandler.sendNotification(this.transport, 'notifications/tools/list_changed')
    }
  }

  async notifyPromptsListChanged(): Promise<void> {
    if (this.transport && this.clientCapabilities?.prompts?.listChanged) {
      await this.protocolHandler.sendNotification(this.transport, 'notifications/prompts/list_changed')
    }
  }

  on(handler: MCPServerEventHandler): () => void {
    this.eventHandlers.add(handler)
    return () => this.eventHandlers.delete(handler)
  }

  private emit(event: { type: string; data?: unknown }): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event)
      } catch (error) {
        console.error('事件处理器错误:', error)
      }
    }
  }

  private handleInitialize(params: MCPInitializeParams): MCPInitializeResult {
    this.clientCapabilities = params.capabilities

    return {
      protocolVersion: MCP_VERSION,
      capabilities: {
        resources: {
          subscribe: true,
          listChanged: true,
        },
        tools: {
          listChanged: true,
        },
        prompts: {
          listChanged: true,
        },
        logging: {
          level: 'info',
        },
        ...this.config.capabilities,
      },
      serverInfo: {
        name: this.config.name,
        version: this.config.version,
      },
    }
  }

  private async handleResourcesList(): Promise<{ resources: MCPResource[] }> {
    const allResources: MCPResource[] = []

    for (const provider of this.resources.values()) {
      const resources = await provider.list()
      allResources.push(...resources)
    }

    return { resources: allResources }
  }

  private async handleResourcesRead(params: { uri: string }): Promise<{ contents: MCPResourceContent[] }> {
    const { uri } = params

    for (const [prefix, provider] of this.resources) {
      if (uri.startsWith(prefix)) {
        try {
          const content = await provider.read(uri)
          return { contents: [content] }
        } catch (error) {
          throw {
            code: MCPErrorCodes.RESOURCE_NOT_FOUND,
            message: error instanceof Error ? error.message : '资源读取失败',
          }
        }
      }
    }

    throw {
      code: MCPErrorCodes.RESOURCE_NOT_FOUND,
      message: `资源未找到: ${uri}`,
    }
  }

  private async handleResourcesSubscribe(params: { uri: string }): Promise<{ subscribed: boolean }> {
    const { uri } = params

    if (!this.resourceSubscriptions.has(uri)) {
      this.resourceSubscriptions.set(uri, new Set())
    }

    return { subscribed: true }
  }

  private async handleResourcesUnsubscribe(params: { uri: string }): Promise<{ unsubscribed: boolean }> {
    const { uri } = params
    this.resourceSubscriptions.delete(uri)
    return { unsubscribed: true }
  }

  private async handleToolsList(): Promise<{ tools: MCPTool[] }> {
    const tools = Array.from(this.tools.values()).map((t) => t.tool)
    return { tools }
  }

  private async handleToolsCall(params: MCPToolCall): Promise<MCPToolResult> {
    const { name, arguments: args } = params

    const toolEntry = this.tools.get(name)
    if (!toolEntry) {
      return {
        content: [
          {
            type: 'text',
            text: `工具未找到: ${name}`,
          },
        ],
        isError: true,
      }
    }

    try {
      return await toolEntry.executor({ name, arguments: args })
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: error instanceof Error ? error.message : '工具执行失败',
          },
        ],
        isError: true,
      }
    }
  }

  private async handlePromptsList(): Promise<{ prompts: MCPPrompt[] }> {
    const prompts: MCPPrompt[] = []

    for (const provider of this.prompts.values()) {
      const providerPrompts = await provider.list()
      prompts.push(...providerPrompts)
    }

    return { prompts }
  }

  private async handlePromptsGet(params: {
    name: string
    arguments: Record<string, string>
  }): Promise<MCPPromptResult> {
    const { name, arguments: args } = params

    const provider = this.prompts.get(name)
    if (!provider) {
      throw {
        code: MCPErrorCodes.PROMPT_NOT_FOUND,
        message: `提示词未找到: ${name}`,
      }
    }

    return provider.get(name, args)
  }

  getServerInfo(): { name: string; version: string } {
    return {
      name: this.config.name,
      version: this.config.version,
    }
  }

  getTools(): MCPTool[] {
    return Array.from(this.tools.values()).map((t) => t.tool)
  }

  isInitialized(): boolean {
    return this.initialized
  }
}

class FileResourceProvider implements ResourceProvider {
  private _basePath: string
  private resources: Map<string, MCPResource> = new Map()

  constructor(basePath: string) {
    this._basePath = basePath
    void this._basePath
  }

  addResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource)
  }

  removeResource(uri: string): void {
    this.resources.delete(uri)
  }

  async list(): Promise<MCPResource[]> {
    return Array.from(this.resources.values())
  }

  async read(uri: string): Promise<MCPResourceContent> {
    const resource = this.resources.get(uri)
    if (!resource) {
      throw new Error(`资源未找到: ${uri}`)
    }

    return {
      uri,
      mimeType: resource.mimeType,
      text: `Content of ${resource.name}`,
    }
  }
}

class SimplePromptProvider implements PromptProvider {
  private prompts: Map<string, { prompt: MCPPrompt; handler: (args: Record<string, string>) => MCPPromptResult }> = new Map()

  register(prompt: MCPPrompt, handler: (args: Record<string, string>) => MCPPromptResult): void {
    this.prompts.set(prompt.name, { prompt, handler })
  }

  unregister(name: string): void {
    this.prompts.delete(name)
  }

  async list(): Promise<MCPPrompt[]> {
    return Array.from(this.prompts.values()).map((p) => p.prompt)
  }

  async get(name: string, args: Record<string, string>): Promise<MCPPromptResult> {
    const entry = this.prompts.get(name)
    if (!entry) {
      throw new Error(`提示词未找到: ${name}`)
    }

    return entry.handler(args)
  }
}

export const createMCPServer = (config: MCPServerConfig): MCPServer => {
  return new MCPServer(config)
}

export { MCPServer, FileResourceProvider, SimplePromptProvider }

export default MCPServer
