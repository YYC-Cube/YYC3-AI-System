/**
 * @file mcp-protocol.ts
 * @description YYC³ MCP核心协议 - 协议定义与消息格式
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [mcp],[protocol],[message],[transport],[specification]
 *
 * @brief MCP核心协议，实现协议定义与消息格式
 *
 * @details
 * - 协议定义 (JSON-RPC 2.0)
 * - 消息格式
 * - 传输层抽象
 * - 能力协商
 */

export const MCP_VERSION = '2024-11-05';

export type MCPMessageType = 'request' | 'response' | 'notification';

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: MCPError;
}

export interface MCPNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export type MCPMessage = MCPRequest | MCPResponse | MCPNotification;

export interface MCPCapabilities {
  protocolVersion: string;
  capabilities: {
    resources?: {
      subscribe?: boolean;
      listChanged?: boolean;
    };
    tools?: {
      listChanged?: boolean;
    };
    prompts?: {
      listChanged?: boolean;
    };
    logging?: {
      level?:
        | 'debug'
        | 'info'
        | 'notice'
        | 'warning'
        | 'error'
        | 'critical'
        | 'alert'
        | 'emergency';
    };
    experimental?: Record<string, unknown>;
  };
  serverInfo?: {
    name: string;
    version: string;
  };
  clientInfo?: {
    name: string;
    version: string;
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

export interface MCPResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description?: string;
        enum?: string[];
        default?: unknown;
      }
    >;
    required?: string[];
  };
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    resource?: MCPResourceContent;
  }>;
  isError?: boolean;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface MCPPromptMessage {
  role: 'user' | 'assistant';
  content: {
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    resource?: MCPResourceContent;
  };
}

export interface MCPPromptResult {
  messages: MCPPromptMessage[];
}

export interface MCPInitializeParams {
  protocolVersion: string;
  capabilities: MCPCapabilities['capabilities'];
  clientInfo: MCPCapabilities['clientInfo'];
}

export interface MCPInitializeResult {
  protocolVersion: string;
  capabilities: MCPCapabilities['capabilities'];
  serverInfo: MCPCapabilities['serverInfo'];
}

export type MCPTransportState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MCPTransportEvents {
  onMessage: (message: MCPMessage) => void;
  onError: (error: Error) => void;
  onClose: () => void;
  onStateChange: (state: MCPTransportState) => void;
}

export interface MCPTransport {
  state: MCPTransportState;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: MCPMessage): Promise<void>;
  on(event: keyof MCPTransportEvents, handler: MCPTransportEvents[keyof MCPTransportEvents]): void;
  off(event: keyof MCPTransportEvents, handler: MCPTransportEvents[keyof MCPTransportEvents]): void;
}

export const MCPErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR_START: -32000,
  SERVER_ERROR_END: -32099,
  RESOURCE_NOT_FOUND: -32001,
  RESOURCE_ACCESS_DENIED: -32002,
  TOOL_EXECUTION_ERROR: -32003,
  PROMPT_NOT_FOUND: -32004,
} as const;

class MCPMessageBuilder {
  private idCounter = 0;

  createRequest(method: string, params?: Record<string, unknown>): MCPRequest {
    return {
      jsonrpc: '2.0',
      id: this.generateId(),
      method,
      params,
    };
  }

  createResponse(id: string | number, result?: unknown, error?: MCPError): MCPResponse {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id,
    };

    if (error) {
      response.error = error;
    } else {
      response.result = result;
    }

    return response;
  }

  createNotification(method: string, params?: Record<string, unknown>): MCPNotification {
    return {
      jsonrpc: '2.0',
      method,
      params,
    };
  }

  createError(code: number, message: string, data?: unknown): MCPError {
    return { code, message, data };
  }

  private generateId(): string {
    return `${Date.now()}-${++this.idCounter}`;
  }
}

class MCPProtocolHandler {
  private messageBuilder = new MCPMessageBuilder();
  private requestHandlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>> =
    new Map();
  private notificationHandlers: Map<string, (params: Record<string, unknown>) => void> = new Map();
  private pendingRequests: Map<
    string | number,
    {
      resolve: (result: unknown) => void;
      reject: (error: Error) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  > = new Map();
  private defaultTimeout = 30000;

  registerRequestHandler(
    method: string,
    handler: (params: Record<string, unknown>) => Promise<unknown>
  ): void {
    this.requestHandlers.set(method, handler);
  }

  unregisterRequestHandler(method: string): void {
    this.requestHandlers.delete(method);
  }

  registerNotificationHandler(
    method: string,
    handler: (params: Record<string, unknown>) => void
  ): void {
    this.notificationHandlers.set(method, handler);
  }

  unregisterNotificationHandler(method: string): void {
    this.notificationHandlers.delete(method);
  }

  async handleIncomingMessage(message: MCPMessage, transport: MCPTransport): Promise<void> {
    if (this.isRequest(message)) {
      await this.handleRequest(message, transport);
    } else if (this.isResponse(message)) {
      this.handleResponse(message);
    } else if (this.isNotification(message)) {
      this.handleNotification(message);
    }
  }

  private isRequest(message: MCPMessage): message is MCPRequest {
    return 'id' in message && 'method' in message;
  }

  private isResponse(message: MCPMessage): message is MCPResponse {
    return 'id' in message && !('method' in message);
  }

  private isNotification(message: MCPMessage): message is MCPNotification {
    return 'method' in message && !('id' in message);
  }

  private async handleRequest(request: MCPRequest, transport: MCPTransport): Promise<void> {
    const handler = this.requestHandlers.get(request.method);

    if (!handler) {
      const response = this.messageBuilder.createResponse(
        request.id,
        undefined,
        this.messageBuilder.createError(
          MCPErrorCodes.METHOD_NOT_FOUND,
          `方法未找到: ${request.method}`
        )
      );
      await transport.send(response);
      return;
    }

    try {
      const result = await handler(request.params || {});
      const response = this.messageBuilder.createResponse(request.id, result);
      await transport.send(response);
    } catch (error) {
      const response = this.messageBuilder.createResponse(
        request.id,
        undefined,
        this.messageBuilder.createError(
          MCPErrorCodes.INTERNAL_ERROR,
          error instanceof Error ? error.message : '内部错误',
          error instanceof Error ? { stack: error.stack } : error
        )
      );
      await transport.send(response);
    }
  }

  private handleResponse(response: MCPResponse): void {
    const pending = this.pendingRequests.get(response.id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.id);

    if (response.error) {
      pending.reject(new Error(response.error.message));
    } else {
      pending.resolve(response.result);
    }
  }

  private handleNotification(notification: MCPNotification): void {
    const handler = this.notificationHandlers.get(notification.method);
    if (handler) {
      try {
        handler(notification.params || {});
      } catch (error) {
        console.error(`通知处理器错误 [${notification.method}]:`, error);
      }
    }
  }

  async sendRequest(
    transport: MCPTransport,
    method: string,
    params?: Record<string, unknown>,
    timeout?: number
  ): Promise<unknown> {
    const request = this.messageBuilder.createRequest(method, params);

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(request.id);
        reject(new Error(`请求超时: ${method}`));
      }, timeout || this.defaultTimeout);

      this.pendingRequests.set(request.id, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      transport.send(request).catch((error) => {
        clearTimeout(timeoutHandle);
        this.pendingRequests.delete(request.id);
        reject(error);
      });
    });
  }

  async sendNotification(
    transport: MCPTransport,
    method: string,
    params?: Record<string, unknown>
  ): Promise<void> {
    const notification = this.messageBuilder.createNotification(method, params);
    await transport.send(notification);
  }

  getMessageBuilder(): MCPMessageBuilder {
    return this.messageBuilder;
  }
}

class StdioTransport implements MCPTransport {
  state: MCPTransportState = 'disconnected';
  private eventHandlers: Partial<MCPTransportEvents> = {};
  private buffer = '';

  async connect(): Promise<void> {
    this.setState('connecting');
    this.setState('connected');
  }

  async disconnect(): Promise<void> {
    this.setState('disconnected');
  }

  async send(message: MCPMessage): Promise<void> {
    const json = JSON.stringify(message);
    console.log(`[MCP SEND] ${json}`);
  }

  on<K extends keyof MCPTransportEvents>(event: K, handler: MCPTransportEvents[K]): void {
    this.eventHandlers[event] = handler;
  }

  off<K extends keyof MCPTransportEvents>(event: K, _handler: MCPTransportEvents[K]): void {
    delete this.eventHandlers[event];
  }

  receive(data: string): void {
    this.buffer += data;

    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line) as MCPMessage;
          this.eventHandlers.onMessage?.(message);
        } catch (error) {
          this.eventHandlers.onError?.(new Error(`解析消息失败: ${line}`));
        }
      }
    }
  }

  private setState(state: MCPTransportState): void {
    this.state = state;
    this.eventHandlers.onStateChange?.(state);
  }
}

class WebSocketTransport implements MCPTransport {
  state: MCPTransportState = 'disconnected';
  private eventHandlers: Partial<MCPTransportEvents> = {};
  private ws: WebSocket | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    this.setState('connecting');

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.setState('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as MCPMessage;
            this.eventHandlers.onMessage?.(message);
          } catch (error) {
            this.eventHandlers.onError?.(new Error(`解析消息失败`));
          }
        };

        this.ws.onerror = (error) => {
          this.setState('error');
          this.eventHandlers.onError?.(new Error('WebSocket错误'));
          reject(error);
        };

        this.ws.onclose = () => {
          this.setState('disconnected');
          this.eventHandlers.onClose?.();
        };
      } catch (error) {
        this.setState('error');
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState('disconnected');
  }

  async send(message: MCPMessage): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket未连接');
    }

    this.ws.send(JSON.stringify(message));
  }

  on<K extends keyof MCPTransportEvents>(event: K, handler: MCPTransportEvents[K]): void {
    this.eventHandlers[event] = handler;
  }

  off<K extends keyof MCPTransportEvents>(event: K, _handler: MCPTransportEvents[K]): void {
    delete this.eventHandlers[event];
  }

  private setState(state: MCPTransportState): void {
    this.state = state;
    this.eventHandlers.onStateChange?.(state);
  }
}

class InMemoryTransport implements MCPTransport {
  state: MCPTransportState = 'disconnected';
  private eventHandlers: Partial<MCPTransportEvents> = {};
  private otherEnd: InMemoryTransport | null = null;

  static createPair(): [InMemoryTransport, InMemoryTransport] {
    const client = new InMemoryTransport();
    const server = new InMemoryTransport();
    client.otherEnd = server;
    server.otherEnd = client;
    return [client, server];
  }

  async connect(): Promise<void> {
    this.setState('connected');
  }

  async disconnect(): Promise<void> {
    this.setState('disconnected');
  }

  async send(message: MCPMessage): Promise<void> {
    if (this.otherEnd && this.otherEnd.state === 'connected') {
      this.otherEnd.eventHandlers.onMessage?.(message);
    }
  }

  on<K extends keyof MCPTransportEvents>(event: K, handler: MCPTransportEvents[K]): void {
    this.eventHandlers[event] = handler;
  }

  off<K extends keyof MCPTransportEvents>(event: K, _handler: MCPTransportEvents[K]): void {
    delete this.eventHandlers[event];
  }

  private setState(state: MCPTransportState): void {
    this.state = state;
    this.eventHandlers.onStateChange?.(state);
  }
}

export const mcpMessageBuilder = new MCPMessageBuilder();
export const mcpProtocolHandler = new MCPProtocolHandler();

export {
  MCPMessageBuilder,
  MCPProtocolHandler,
  StdioTransport,
  WebSocketTransport,
  InMemoryTransport,
};

export default MCPProtocolHandler;
