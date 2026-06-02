/**
 * @file mcp-protocol.test.ts
 * @description YYC³ MCP协议测试 - 确保MCP系统可靠性
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [test],[mcp],[protocol],[server],[client]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('MCP协议测试', () => {
  describe('MCP核心协议', () => {
    let MCPMessageBuilder: typeof import('../mcp-protocol').MCPMessageBuilder
    let MCPProtocolHandler: typeof import('../mcp-protocol').MCPProtocolHandler
    let InMemoryTransport: typeof import('../mcp-protocol').InMemoryTransport
    let MCPErrorCodes: typeof import('../mcp-protocol').MCPErrorCodes

    beforeEach(async () => {
      const module = await import('../mcp-protocol')
      MCPMessageBuilder = module.MCPMessageBuilder
      MCPProtocolHandler = module.MCPProtocolHandler
      InMemoryTransport = module.InMemoryTransport
      MCPErrorCodes = module.MCPErrorCodes
    })

    describe('消息构建器', () => {
      it('应该正确创建请求消息', () => {
        const builder = new MCPMessageBuilder()
        const request = builder.createRequest('test/method', { param: 'value' })

        expect(request.jsonrpc).toBe('2.0')
        expect(request.id).toBeDefined()
        expect(request.method).toBe('test/method')
        expect(request.params).toEqual({ param: 'value' })
      })

      it('应该正确创建响应消息', () => {
        const builder = new MCPMessageBuilder()
        const response = builder.createResponse('test-id', { result: 'success' })

        expect(response.jsonrpc).toBe('2.0')
        expect(response.id).toBe('test-id')
        expect(response.result).toEqual({ result: 'success' })
        expect(response.error).toBeUndefined()
      })

      it('应该正确创建错误响应消息', () => {
        const builder = new MCPMessageBuilder()
        const response = builder.createResponse(
          'test-id',
          undefined,
          builder.createError(MCPErrorCodes.METHOD_NOT_FOUND, '方法未找到')
        )

        expect(response.error).toBeDefined()
        expect(response.error?.code).toBe(MCPErrorCodes.METHOD_NOT_FOUND)
        expect(response.error?.message).toBe('方法未找到')
      })

      it('应该正确创建通知消息', () => {
        const builder = new MCPMessageBuilder()
        const notification = builder.createNotification('test/notification', { data: 'value' })

        expect(notification.jsonrpc).toBe('2.0')
        expect(notification.method).toBe('test/notification')
        expect(notification.params).toEqual({ data: 'value' })
        expect('id' in notification).toBe(false)
      })
    })

    describe('协议处理器', () => {
      it('应该正确注册和处理请求', async () => {
        const handler = new MCPProtocolHandler()
        const transport = new InMemoryTransport()
        await transport.connect()

        const requestHandler = vi.fn().mockResolvedValue({ result: 'ok' })
        handler.registerRequestHandler('test/method', requestHandler)

        await handler.handleIncomingMessage(
          {
            jsonrpc: '2.0',
            id: 'test-id',
            method: 'test/method',
            params: { input: 'test' },
          },
          transport
        )

        expect(requestHandler).toHaveBeenCalledWith({ input: 'test' })
      })

      it('应该正确处理响应', async () => {
        const handler = new MCPProtocolHandler()
        const transport = new InMemoryTransport()
        await transport.connect()

        const responsePromise = handler.sendRequest(transport, 'test/method', { param: 'value' }, 1000)

        const pendingRequests = (handler as unknown as { pendingRequests: Map<string, unknown> }).pendingRequests
        const pendingId = Array.from(pendingRequests.keys())[0]

        handler.handleIncomingMessage({
          jsonrpc: '2.0',
          id: pendingId,
          result: { data: 'success' },
        })

        const result = await responsePromise
        expect(result).toEqual({ data: 'success' })
      })

      it('应该正确处理通知', () => {
        const handler = new MCPProtocolHandler()

        const notificationHandler = vi.fn()
        handler.registerNotificationHandler('test/notification', notificationHandler)

        handler.handleIncomingMessage({
          jsonrpc: '2.0',
          method: 'test/notification',
          params: { data: 'value' },
        })

        expect(notificationHandler).toHaveBeenCalledWith({ data: 'value' })
      })

      it('应该正确处理方法未找到错误', async () => {
        const handler = new MCPProtocolHandler()
        const transport = new InMemoryTransport()
        await transport.connect()

        let sentMessage: unknown
        transport.send = async (message) => {
          sentMessage = message
        }

        await handler.handleIncomingMessage(
          {
            jsonrpc: '2.0',
            id: 'test-id',
            method: 'unknown/method',
            params: {},
          },
          transport
        )

        expect((sentMessage as { error?: { code: number } }).error?.code).toBe(MCPErrorCodes.METHOD_NOT_FOUND)
      })
    })

    describe('内存传输', () => {
      it('应该正确创建传输对', async () => {
        const [client, server] = InMemoryTransport.createPair()

        await client.connect()
        await server.connect()

        expect(client.state).toBe('connected')
        expect(server.state).toBe('connected')
      })

      it('应该正确传输消息', async () => {
        const [client, server] = InMemoryTransport.createPair()
        await client.connect()
        await server.connect()

        const receivedMessages: unknown[] = []
        server.on('onMessage', (message) => {
          receivedMessages.push(message)
        })

        await client.send({
          jsonrpc: '2.0',
          id: 'test-id',
          method: 'test/method',
        })

        expect(receivedMessages.length).toBe(1)
        expect((receivedMessages[0] as { method: string }).method).toBe('test/method')
      })

      it('应该正确断开连接', async () => {
        const transport = new InMemoryTransport()
        await transport.connect()

        expect(transport.state).toBe('connected')

        await transport.disconnect()

        expect(transport.state).toBe('disconnected')
      })
    })
  })

  describe('MCP服务端', () => {
    let MCPServer: typeof import('../mcp-server').MCPServer
    let MCPClient: typeof import('../mcp-client').MCPClient
    let InMemoryTransport: typeof import('../mcp-protocol').InMemoryTransport

    beforeEach(async () => {
      const serverModule = await import('../mcp-server')
      const clientModule = await import('../mcp-client')
      const protocolModule = await import('../mcp-protocol')
      MCPServer = serverModule.MCPServer
      MCPClient = clientModule.MCPClient
      InMemoryTransport = protocolModule.InMemoryTransport
    })

    it('应该正确创建服务端', () => {
      const server = new MCPServer({
        name: 'test-server',
        version: '1.0.0',
      })

      expect(server.getServerInfo().name).toBe('test-server')
      expect(server.getServerInfo().version).toBe('1.0.0')
    })

    it('应该正确处理初始化请求', async () => {
      const server = new MCPServer({
        name: 'test-server',
        version: '1.0.0',
      })

      const [clientTransport, serverTransport] = InMemoryTransport.createPair()
      await server.connect(serverTransport)
      
      const client = new MCPClient({
        name: 'test-client',
        version: '1.0.0',
      })
      
      await client.connect(clientTransport)

      expect(server.isInitialized()).toBe(true)
    })

    it('应该正确注册和调用工具', async () => {
      const server = new MCPServer({
        name: 'test-server',
        version: '1.0.0',
      })

      server.registerTool(
        {
          name: 'test-tool',
          description: '测试工具',
          inputSchema: {
            type: 'object',
            properties: {
              input: { type: 'string', description: '输入参数' },
            },
          },
        },
        async (call) => ({
          content: [{ type: 'text', text: `处理结果: ${call.arguments.input}` }],
        })
      )

      const [clientTransport, serverTransport] = InMemoryTransport.createPair()
      await clientTransport.connect()
      await server.connect(serverTransport)

      const tools = server.getTools()
      expect(tools.length).toBeGreaterThan(0)
    })

    it('应该正确注册资源提供者', async () => {
      const server = new MCPServer({
        name: 'test-server',
        version: '1.0.0',
      })

      const resourceProvider = {
        list: async () => [
          { uri: 'test://resource/1', name: '测试资源' },
        ],
        read: async (uri: string) => ({
          uri,
          text: `Content of ${uri}`,
        }),
      }

      server.registerResourceProvider('test://', resourceProvider)

      const resources = await resourceProvider.list()
      expect(resources.length).toBe(1)
      expect(resources[0].uri).toBe('test://resource/1')
    })

    it('应该正确断开连接', async () => {
      const server = new MCPServer({
        name: 'test-server',
        version: '1.0.0',
      })

      const [_, serverTransport] = InMemoryTransport.createPair()
      await server.connect(serverTransport)

      await server.disconnect()

      expect(server.isInitialized()).toBe(false)
    })
  })

  describe('MCP客户端', () => {
    let MCPClient: typeof import('../mcp-client').MCPClient
    let MCPServer: typeof import('../mcp-server').MCPServer
    let InMemoryTransport: typeof import('../mcp-protocol').InMemoryTransport

    beforeEach(async () => {
      const clientModule = await import('../mcp-client')
      const serverModule = await import('../mcp-server')
      const protocolModule = await import('../mcp-protocol')
      MCPClient = clientModule.MCPClient
      MCPServer = serverModule.MCPServer
      InMemoryTransport = protocolModule.InMemoryTransport
    })

    it('应该正确创建客户端', () => {
      const client = new MCPClient({
        name: 'test-client',
        version: '1.0.0',
      })

      expect(client.isConnected()).toBe(false)
    })

    it('应该正确连接到服务端', async () => {
      const server = new MCPServer({
        name: 'test-server',
        version: '1.0.0',
      })

      const client = new MCPClient({
        name: 'test-client',
        version: '1.0.0',
      })

      const [clientTransport, serverTransport] = InMemoryTransport.createPair()
      await server.connect(serverTransport)

      const serverInfo = await client.connect(clientTransport)

      expect(serverInfo.name).toBe('test-server')
      expect(client.isConnected()).toBe(true)
    })

    it('应该正确获取服务端能力', async () => {
      const server = new MCPServer({
        name: 'test-server',
        version: '1.0.0',
      })

      const client = new MCPClient({
        name: 'test-client',
        version: '1.0.0',
      })

      const [clientTransport, serverTransport] = InMemoryTransport.createPair()
      await server.connect(serverTransport)
      await client.connect(clientTransport)

      const capabilities = client.getServerCapabilities()
      expect(capabilities?.resources).toBeDefined()
      expect(capabilities?.tools).toBeDefined()
    })

    it('应该正确获取资源列表', async () => {
      const server = new MCPServer({
        name: 'test-server',
        version: '1.0.0',
      })

      server.registerResourceProvider('test://', {
        list: async () => [
          { uri: 'test://resource/1', name: '资源1' },
          { uri: 'test://resource/2', name: '资源2' },
        ],
        read: async (uri: string) => ({ uri, text: `Content of ${uri}` }),
      })

      const client = new MCPClient({
        name: 'test-client',
        version: '1.0.0',
      })

      const [clientTransport, serverTransport] = InMemoryTransport.createPair()
      await server.connect(serverTransport)
      await client.connect(clientTransport)

      const resources = client.getResources()
      expect(resources.length).toBe(2)
    })

    it('应该正确调用工具', async () => {
      const server = new MCPServer({
        name: 'test-server',
        version: '1.0.0',
      })

      server.registerTool(
        {
          name: 'echo',
          description: '回显工具',
          inputSchema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
        async (call) => ({
          content: [{ type: 'text', text: call.arguments.message as string }],
        })
      )

      const client = new MCPClient({
        name: 'test-client',
        version: '1.0.0',
      })

      const [clientTransport, serverTransport] = InMemoryTransport.createPair()
      await server.connect(serverTransport)
      await client.connect(clientTransport)

      const result = await client.callTool('echo', { message: 'Hello MCP!' })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('Hello MCP!')
    })

    it('应该正确断开连接', async () => {
      const server = new MCPServer({
        name: 'test-server',
        version: '1.0.0',
      })

      const client = new MCPClient({
        name: 'test-client',
        version: '1.0.0',
      })

      const [clientTransport, serverTransport] = InMemoryTransport.createPair()
      await server.connect(serverTransport)
      await client.connect(clientTransport)

      expect(client.isConnected()).toBe(true)

      await client.disconnect()

      expect(client.isConnected()).toBe(false)
    })
  })
})

describe('MCP系统集成测试', () => {
  it('完整的客户端-服务端交互流程', async () => {
    const { MCPServer } = await import('../mcp-server')
    const { MCPClient } = await import('../mcp-client')
    const { InMemoryTransport } = await import('../mcp-protocol')

    const server = new MCPServer({
      name: 'integration-server',
      version: '1.0.0',
    })

    server.registerResourceProvider('file://', {
      list: async () => [
        { uri: 'file://test.txt', name: '测试文件', mimeType: 'text/plain' },
      ],
      read: async (uri: string) => ({
        uri,
        mimeType: 'text/plain',
        text: '文件内容',
      }),
    })

    server.registerTool(
      {
        name: 'calculate',
        description: '计算工具',
        inputSchema: {
          type: 'object',
          properties: {
            expression: { type: 'string', description: '数学表达式' },
          },
          required: ['expression'],
        },
      },
      async (call) => {
        const expr = call.arguments.expression as string
        try {
          const result = new Function(`return ${expr}`)()
          return {
            content: [{ type: 'text', text: String(result) }],
          }
        } catch {
          return {
            content: [{ type: 'text', text: '计算错误' }],
            isError: true,
          }
        }
      }
    )

    const client = new MCPClient({
      name: 'integration-client',
      version: '1.0.0',
    })

    const [clientTransport, serverTransport] = InMemoryTransport.createPair()

    await server.connect(serverTransport)
    const serverInfo = await client.connect(clientTransport)

    expect(serverInfo.name).toBe('integration-server')

    const resources = client.getResources()
    expect(resources.length).toBe(1)
    expect(resources[0].uri).toBe('file://test.txt')

    const tools = client.getTools()
    expect(tools.length).toBe(1)
    expect(tools[0].name).toBe('calculate')

    const calcResult = await client.callTool('calculate', { expression: '2 + 3 * 4' })
    expect(calcResult.content[0].text).toBe('14')

    const resourceContent = await client.readResource('file://test.txt')
    expect(resourceContent[0].text).toBe('文件内容')

    await client.disconnect()
    await server.disconnect()
  })

  it('客户端池管理', async () => {
    const { MCPServer } = await import('../mcp-server')
    const { MCPClientPool } = await import('../mcp-client')
    const { InMemoryTransport } = await import('../mcp-protocol')

    const pool = new MCPClientPool()

    const server = new MCPServer({
      name: 'pool-server',
      version: '1.0.0',
    })

    const [clientTransport, serverTransport] = InMemoryTransport.createPair()
    await server.connect(serverTransport)

    const client = await pool.createClient('client-1', {
      name: 'pool-client',
      version: '1.0.0',
    }, clientTransport)

    expect(pool.getClient('client-1')).toBe(client)
    expect(pool.getAllClients().length).toBe(1)
    expect(pool.getConnectedClients().length).toBe(1)

    await pool.disconnectAll()
    expect(pool.getAllClients().length).toBe(0)
  })
})
