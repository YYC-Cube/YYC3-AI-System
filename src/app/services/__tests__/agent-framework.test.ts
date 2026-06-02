/**
 * @file agent-framework.test.ts
 * @description YYC³ Agent框架测试 - 确保Agent系统可靠性
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [test],[agent],[core],[protocol],[skills]
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Agent框架测试', () => {
  describe('Agent核心框架', () => {
    let agentManager: import('../agent-core').AgentManager

    beforeEach(async () => {
      const { AgentManager } = await import('../agent-core')
      agentManager = new AgentManager()
    })

    afterEach(async () => {
      await agentManager.terminateAll()
    })

    it('应该正确创建Agent', () => {
      const agent = agentManager.createAgent({
        id: 'test-agent-1',
        name: '测试Agent',
        priority: 'normal',
        maxConcurrentTasks: 3,
        timeout: 30000,
        retryCount: 2,
        retryDelay: 1000,
      })

      expect(agent.id).toBe('test-agent-1')
      expect(agent.name).toBe('测试Agent')
      expect(agent.currentState).toBe('idle')
    })

    it('应该拒绝重复创建相同ID的Agent', () => {
      agentManager.createAgent({
        id: 'duplicate-agent',
        name: 'Agent 1',
        priority: 'normal',
        maxConcurrentTasks: 3,
        timeout: 30000,
        retryCount: 2,
        retryDelay: 1000,
      })

      expect(() => {
        agentManager.createAgent({
          id: 'duplicate-agent',
          name: 'Agent 2',
          priority: 'normal',
          maxConcurrentTasks: 3,
          timeout: 30000,
          retryCount: 2,
          retryDelay: 1000,
        })
      }).toThrow()
    })

    it('应该正确初始化Agent', async () => {
      const agent = agentManager.createAgent({
        id: 'init-test-agent',
        name: '初始化测试',
        priority: 'normal',
        maxConcurrentTasks: 3,
        timeout: 30000,
        retryCount: 2,
        retryDelay: 1000,
      })

      await agent.initialize()

      expect(agent.currentState).toBe('running')
    })

    it('应该正确注册任务执行器', async () => {
      const agent = agentManager.createAgent({
        id: 'executor-test-agent',
        name: '执行器测试',
        priority: 'normal',
        maxConcurrentTasks: 3,
        timeout: 30000,
        retryCount: 2,
        retryDelay: 1000,
      })

      const executor = vi.fn().mockResolvedValue({ result: 'success' })
      agent.registerExecutor('test-task', executor)

      await agent.initialize()
      const taskId = agent.submitTask({
        name: 'test-task',
        priority: 'normal',
        payload: { data: 'test' },
        maxRetries: 0,
        timeout: 5000,
        dependencies: [],
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(executor).toHaveBeenCalled()
    })

    it('应该正确暂停和恢复Agent', async () => {
      const agent = agentManager.createAgent({
        id: 'pause-test-agent',
        name: '暂停测试',
        priority: 'normal',
        maxConcurrentTasks: 3,
        timeout: 30000,
        retryCount: 2,
        retryDelay: 1000,
      })

      await agent.initialize()
      await agent.pause()

      expect(agent.currentState).toBe('paused')

      await agent.resume()

      expect(agent.currentState).toBe('running')
    })

    it('应该正确终止Agent', async () => {
      const agent = agentManager.createAgent({
        id: 'terminate-test-agent',
        name: '终止测试',
        priority: 'normal',
        maxConcurrentTasks: 3,
        timeout: 30000,
        retryCount: 2,
        retryDelay: 1000,
      })

      await agent.initialize()
      await agent.terminate()

      expect(agent.currentState).toBe('terminated')
    })

    it('应该正确获取Agent统计信息', async () => {
      const agent = agentManager.createAgent({
        id: 'stats-test-agent',
        name: '统计测试',
        priority: 'normal',
        maxConcurrentTasks: 3,
        timeout: 30000,
        retryCount: 2,
        retryDelay: 1000,
      })

      await agent.initialize()

      const stats = agent.getStats()

      expect(stats.totalTasks).toBe(0)
      expect(stats.completedTasks).toBe(0)
    })

    it('应该正确获取全局统计信息', async () => {
      agentManager.createAgent({
        id: 'global-stats-1',
        name: 'Agent 1',
        priority: 'normal',
        maxConcurrentTasks: 3,
        timeout: 30000,
        retryCount: 2,
        retryDelay: 1000,
      })

      agentManager.createAgent({
        id: 'global-stats-2',
        name: 'Agent 2',
        priority: 'normal',
        maxConcurrentTasks: 3,
        timeout: 30000,
        retryCount: 2,
        retryDelay: 1000,
      })

      const stats = agentManager.getGlobalStats()

      expect(stats.totalAgents).toBe(2)
    })
  })

  describe('Agent通信协议', () => {
    let protocol: import('../agent-protocol').AgentProtocol

    beforeEach(async () => {
      const { AgentProtocol } = await import('../agent-protocol')
      protocol = new AgentProtocol()
    })

    afterEach(() => {
      protocol.clearHistory()
    })

    it('应该正确订阅主题', () => {
      const handler = vi.fn()
      const subscriptionId = protocol.subscribe('test-topic', 'agent-1', handler)

      expect(subscriptionId).toBeDefined()
    })

    it('应该正确发布消息', () => {
      const handler = vi.fn()
      protocol.subscribe('publish-topic', 'agent-1', handler)

      protocol.publish('publish-topic', { message: 'hello' })

      expect(handler).toHaveBeenCalled()
    })

    it('应该正确取消订阅', () => {
      const handler = vi.fn()
      const subscriptionId = protocol.subscribe('unsubscribe-topic', 'agent-1', handler)

      protocol.unsubscribe(subscriptionId)
      protocol.publish('unsubscribe-topic', { message: 'test' })

      expect(handler).not.toHaveBeenCalled()
    })

    it('应该正确发送请求并等待响应', async () => {
      protocol.subscribe('request-topic', 'agent-2', async (message) => {
        protocol.respond(message.id, { response: 'ok' }, { from: 'agent-2' })
      })

      const response = await protocol.request('agent-2', { request: 'test' }, { topic: 'request-topic', timeout: 5000 })

      expect(response.success).toBe(true)
      expect(response.payload).toEqual({ response: 'ok' })
    })

    it('应该正确广播消息', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      protocol.subscribe('broadcast-topic', 'agent-1', handler1)
      protocol.subscribe('broadcast-topic', 'agent-2', handler2)

      protocol.broadcast('broadcast-topic', { message: 'broadcast' })

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('应该正确过滤消息', () => {
      const handler = vi.fn()
      protocol.subscribe('filter-topic', 'agent-1', handler, {
        from: 'allowed-agent',
      })

      protocol.publish('filter-topic', { message: 'test' }, { from: 'allowed-agent' })
      protocol.publish('filter-topic', { message: 'test' }, { from: 'blocked-agent' })

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('应该正确获取消息历史', () => {
      protocol.publish('history-topic', { message: 'msg1' })
      protocol.publish('history-topic', { message: 'msg2' })

      const history = protocol.getMessageHistory({ topic: 'history-topic' })

      expect(history.length).toBe(2)
    })

    it('应该正确获取队列统计', () => {
      protocol.publish('stats-topic', { message: 'test' })

      const stats = protocol.getQueueStats()

      expect(stats.pending).toBeDefined()
      expect(stats.completed).toBeDefined()
    })
  })

  describe('Agent能力扩展', () => {
    let skillRegistry: import('../agent-skills').SkillRegistry
    let toolRegistry: import('../agent-skills').ToolRegistry
    let knowledgeBase: import('../agent-skills').KnowledgeBase

    beforeEach(async () => {
      const { SkillRegistry, ToolRegistry, KnowledgeBase } = await import('../agent-skills')
      skillRegistry = new SkillRegistry()
      toolRegistry = new ToolRegistry()
      knowledgeBase = new KnowledgeBase()
    })

    describe('技能注册系统', () => {
      it('应该正确注册技能', () => {
        const skillId = skillRegistry.register({
          name: '测试技能',
          description: '用于测试的技能',
          version: '1.0.0',
          category: 'utility',
          tags: ['test'],
          inputSchema: { type: 'object', properties: {} },
          outputSchema: { type: 'object', properties: {} },
          handler: async () => ({ success: true }),
          enabled: true,
          priority: 1,
        })

        expect(skillId).toBeDefined()
        expect(skillRegistry.get(skillId)).toBeDefined()
      })

      it('应该正确注销技能', () => {
        const skillId = skillRegistry.register({
          name: '待注销技能',
          description: '将被注销',
          version: '1.0.0',
          category: 'utility',
          tags: ['test'],
          inputSchema: { type: 'object', properties: {} },
          outputSchema: { type: 'object', properties: {} },
          handler: async () => ({ success: true }),
          enabled: true,
          priority: 1,
        })

        const result = skillRegistry.unregister(skillId)

        expect(result).toBe(true)
        expect(skillRegistry.get(skillId)).toBeUndefined()
      })

      it('应该正确按类别获取技能', () => {
        skillRegistry.register({
          name: '分析技能',
          description: '分析类',
          version: '1.0.0',
          category: 'analysis',
          tags: ['test'],
          inputSchema: { type: 'object', properties: {} },
          outputSchema: { type: 'object', properties: {} },
          handler: async () => ({ success: true }),
          enabled: true,
          priority: 1,
        })

        const skills = skillRegistry.getByCategory('analysis')

        expect(skills.length).toBeGreaterThan(0)
        expect(skills[0].category).toBe('analysis')
      })

      it('应该正确搜索技能', () => {
        skillRegistry.register({
          name: '代码生成',
          description: '生成代码的技能',
          version: '1.0.0',
          category: 'generation',
          tags: ['code', 'generation'],
          inputSchema: { type: 'object', properties: {} },
          outputSchema: { type: 'object', properties: {} },
          handler: async () => ({ success: true }),
          enabled: true,
          priority: 1,
        })

        const results = skillRegistry.search('代码')

        expect(results.length).toBeGreaterThan(0)
      })

      it('应该正确执行技能', async () => {
        const skillId = skillRegistry.register({
          name: '执行测试',
          description: '执行测试',
          version: '1.0.0',
          category: 'utility',
          tags: ['test'],
          inputSchema: { type: 'object', properties: {} },
          outputSchema: { type: 'object', properties: {} },
          handler: async () => ({ success: true, data: { result: 'ok' } }),
          enabled: true,
          priority: 1,
        })

        const context = {
          agentId: 'test-agent',
          sessionId: 'test-session',
          environment: {},
          resources: new Map(),
          logger: {
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
          },
        }

        const result = await skillRegistry.execute(skillId, {}, context)

        expect(result.success).toBe(true)
        expect(result.data).toEqual({ result: 'ok' })
      })

      it('应该正确获取技能统计', () => {
        skillRegistry.register({
          name: '统计测试',
          description: '统计测试',
          version: '1.0.0',
          category: 'utility',
          tags: ['test'],
          inputSchema: { type: 'object', properties: {} },
          outputSchema: { type: 'object', properties: {} },
          handler: async () => ({ success: true }),
          enabled: true,
          priority: 1,
        })

        const stats = skillRegistry.getStats()

        expect(stats.total).toBeGreaterThan(0)
        expect(stats.enabled).toBeGreaterThan(0)
      })
    })

    describe('工具注册系统', () => {
      it('应该正确注册工具', () => {
        const toolId = toolRegistry.register({
          name: '测试工具',
          description: '用于测试的工具',
          type: 'api',
          config: {},
          handler: async () => ({ result: 'ok' }),
          enabled: true,
        })

        expect(toolId).toBeDefined()
        expect(toolRegistry.get(toolId)).toBeDefined()
      })

      it('应该正确调用工具', async () => {
        const toolId = toolRegistry.register({
          name: '调用测试',
          description: '调用测试',
          type: 'custom',
          config: {},
          handler: async (params) => ({ received: params }),
          enabled: true,
        })

        const result = await toolRegistry.invoke(toolId, { test: 'data' })

        expect(result).toEqual({ received: { test: 'data' } })
      })

      it('应该正确按类型获取工具', () => {
        toolRegistry.register({
          name: 'API工具',
          description: 'API工具',
          type: 'api',
          config: {},
          handler: async () => null,
          enabled: true,
        })

        const tools = toolRegistry.getByType('api')

        expect(tools.length).toBeGreaterThan(0)
        expect(tools[0].type).toBe('api')
      })
    })

    describe('知识库系统', () => {
      it('应该正确添加知识条目', () => {
        const entryId = knowledgeBase.add({
          title: '测试知识',
          content: '这是测试知识内容',
          category: 'test',
          tags: ['test'],
          metadata: {},
        })

        expect(entryId).toBeDefined()
        expect(knowledgeBase.get(entryId)).toBeDefined()
      })

      it('应该正确查询知识', () => {
        knowledgeBase.add({
          title: 'Python知识',
          content: 'Python是一种编程语言',
          category: 'programming',
          tags: ['python', 'language'],
          metadata: {},
        })

        const results = knowledgeBase.query({ query: 'Python' })

        expect(results.length).toBeGreaterThan(0)
        expect(results[0].title).toContain('Python')
      })

      it('应该正确按类别获取知识', () => {
        knowledgeBase.add({
          title: '分类测试',
          content: '分类测试内容',
          category: 'category-test',
          tags: ['test'],
          metadata: {},
        })

        const entries = knowledgeBase.getByCategory('category-test')

        expect(entries.length).toBeGreaterThan(0)
      })

      it('应该正确更新知识条目', () => {
        const entryId = knowledgeBase.add({
          title: '待更新知识',
          content: '原始内容',
          category: 'test',
          tags: ['test'],
          metadata: {},
        })

        knowledgeBase.update(entryId, { content: '更新后的内容' })

        const entry = knowledgeBase.get(entryId)
        expect(entry?.content).toBe('更新后的内容')
      })

      it('应该正确删除知识条目', () => {
        const entryId = knowledgeBase.add({
          title: '待删除知识',
          content: '将被删除',
          category: 'test',
          tags: ['test'],
          metadata: {},
        })

        knowledgeBase.remove(entryId)

        expect(knowledgeBase.get(entryId)).toBeUndefined()
      })

      it('应该正确获取知识库统计', () => {
        knowledgeBase.add({
          title: '统计测试',
          content: '统计测试内容',
          category: 'stats-test',
          tags: ['test'],
          metadata: {},
        })

        const stats = knowledgeBase.getStats()

        expect(stats.total).toBeGreaterThan(0)
      })
    })
  })
})

describe('Agent系统集成测试', () => {
  it('Agent核心与通信协议集成', async () => {
    const { AgentManager } = await import('../agent-core')
    const { AgentProtocol } = await import('../agent-protocol')

    const manager = new AgentManager()
    const protocol = new AgentProtocol()

    const agent = manager.createAgent({
      id: 'integration-agent',
      name: '集成测试Agent',
      priority: 'normal',
      maxConcurrentTasks: 3,
      timeout: 30000,
      retryCount: 2,
      retryDelay: 1000,
    })

    const handler = vi.fn()
    protocol.subscribe('agent-events', 'integration-agent', handler)

    agent.on('initialized', async () => {
      protocol.publish('agent-events', { type: 'initialized', agentId: agent.id })
    })

    await agent.initialize()

    expect(handler).toHaveBeenCalled()

    await manager.terminateAll()
  })

  it('Agent核心与技能系统集成', async () => {
    const { AgentManager } = await import('../agent-core')
    const { SkillRegistry } = await import('../agent-skills')

    const manager = new AgentManager()
    const skillRegistry = new SkillRegistry()

    const skillId = skillRegistry.register({
      name: '集成测试技能',
      description: '集成测试',
      version: '1.0.0',
      category: 'utility',
      tags: ['integration'],
      inputSchema: { type: 'object', properties: {} },
      outputSchema: { type: 'object', properties: {} },
      handler: async () => ({ success: true, data: 'integrated' }),
      enabled: true,
      priority: 1,
    })

    const agent = manager.createAgent({
      id: 'skill-integration-agent',
      name: '技能集成测试',
      priority: 'normal',
      maxConcurrentTasks: 3,
      timeout: 30000,
      retryCount: 2,
      retryDelay: 1000,
    })

    agent.registerExecutor('skill-task', async (task) => {
      const context = {
        agentId: agent.id,
        sessionId: 'test-session',
        environment: {},
        resources: new Map(),
        logger: {
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
        },
      }
      return skillRegistry.execute(skillId, task.payload, context)
    })

    await agent.initialize()

    const taskId = agent.submitTask({
      name: 'skill-task',
      priority: 'normal',
      payload: { test: true },
      maxRetries: 0,
      timeout: 5000,
      dependencies: [],
    })

    expect(taskId).toBeDefined()

    await manager.terminateAll()
  })
})
