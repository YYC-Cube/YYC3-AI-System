/**
 * @file workflow-engine.test.ts
 * @description YYC³ 工作流引擎测试 - 确保工作流系统可靠性
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [test],[workflow],[definition],[executor],[visualization]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('工作流引擎测试', () => {
  describe('工作流定义', () => {
    let WorkflowDefinitionBuilder: import('../workflow-definition').WorkflowDefinitionBuilder
    let WorkflowValidator: import('../workflow-definition').WorkflowValidator
    let WorkflowTemplateManager: import('../workflow-definition').WorkflowTemplateManager

    beforeEach(async () => {
      const module = await import('../workflow-definition')
      WorkflowDefinitionBuilder = module.WorkflowDefinitionBuilder
      WorkflowValidator = module.WorkflowValidator
      WorkflowTemplateManager = module.WorkflowTemplateManager
    })

    describe('工作流构建器', () => {
      it('应该正确创建工作流定义', () => {
        const builder = new WorkflowDefinitionBuilder()
        const definition = builder
          .setName('测试工作流')
          .setDescription('这是一个测试工作流')
          .setVersion('1.0.0')
          .build()

        expect(definition.name).toBe('测试工作流')
        expect(definition.description).toBe('这是一个测试工作流')
        expect(definition.version).toBe('1.0.0')
        expect(definition.status).toBe('draft')
      })

      it('应该正确添加节点', () => {
        const builder = new WorkflowDefinitionBuilder()
        builder.addNode({
          id: 'start-1',
          type: 'start',
          name: '开始',
          position: { x: 100, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })

        const definition = builder.build()

        expect(definition.nodes.length).toBe(1)
        expect(definition.nodes[0].id).toBe('start-1')
        expect(definition.nodes[0].status).toBe('pending')
      })

      it('应该正确添加边', () => {
        const builder = new WorkflowDefinitionBuilder()
        builder
          .addNode({
            id: 'start-1',
            type: 'start',
            name: '开始',
            position: { x: 100, y: 100 },
            config: {},
            inputs: [],
            outputs: [],
          })
          .addNode({
            id: 'end-1',
            type: 'end',
            name: '结束',
            position: { x: 300, y: 100 },
            config: {},
            inputs: [],
            outputs: [],
          })
          .addEdge({ source: 'start-1', target: 'end-1', type: 'default' })

        const definition = builder.build()

        expect(definition.edges.length).toBe(1)
        expect(definition.edges[0].source).toBe('start-1')
        expect(definition.edges[0].target).toBe('end-1')
      })

      it('应该正确添加变量', () => {
        const builder = new WorkflowDefinitionBuilder()
        builder.addVariable({
          name: 'testVar',
          type: 'string',
          value: 'test',
          scope: 'workflow',
        })

        const definition = builder.build()

        expect(definition.variables.length).toBe(1)
        expect(definition.variables[0].name).toBe('testVar')
      })

      it('应该正确移除节点', () => {
        const builder = new WorkflowDefinitionBuilder()
        builder
          .addNode({
            id: 'start-1',
            type: 'start',
            name: '开始',
            position: { x: 100, y: 100 },
            config: {},
            inputs: [],
            outputs: [],
          })
          .removeNode('start-1')

        const definition = builder.build()

        expect(definition.nodes.length).toBe(0)
      })
    })

    describe('工作流验证器', () => {
      it('应该检测缺少开始节点', () => {
        const validator = new WorkflowValidator()
        const result = validator.validate({
          id: 'test-wf',
          name: '测试',
          version: '1.0.0',
          status: 'draft',
          nodes: [],
          edges: [],
          variables: [],
          triggers: [],
          metadata: { createdAt: Date.now(), updatedAt: Date.now(), tags: [] },
        })

        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.code === 'NO_START_NODE')).toBe(true)
      })

      it('应该检测多个开始节点', () => {
        const validator = new WorkflowValidator()
        const result = validator.validate({
          id: 'test-wf',
          name: '测试',
          version: '1.0.0',
          status: 'draft',
          nodes: [
            { id: 'start-1', type: 'start', name: '开始1', position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [], status: 'pending' },
            { id: 'start-2', type: 'start', name: '开始2', position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [], status: 'pending' },
          ],
          edges: [],
          variables: [],
          triggers: [],
          metadata: { createdAt: Date.now(), updatedAt: Date.now(), tags: [] },
        })

        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.code === 'MULTIPLE_START_NODES')).toBe(true)
      })

      it('应该检测无效的边', () => {
        const validator = new WorkflowValidator()
        const result = validator.validate({
          id: 'test-wf',
          name: '测试',
          version: '1.0.0',
          status: 'draft',
          nodes: [
            { id: 'start-1', type: 'start', name: '开始', position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [], status: 'pending' },
          ],
          edges: [
            { id: 'edge-1', source: 'non-existent', target: 'start-1', type: 'default' },
          ],
          variables: [],
          triggers: [],
          metadata: { createdAt: Date.now(), updatedAt: Date.now(), tags: [] },
        })

        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.code === 'INVALID_EDGE_SOURCE')).toBe(true)
      })

      it('应该验证有效的工作流', () => {
        const validator = new WorkflowValidator()
        const result = validator.validate({
          id: 'test-wf',
          name: '测试',
          version: '1.0.0',
          status: 'draft',
          nodes: [
            { id: 'start-1', type: 'start', name: '开始', position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [], status: 'pending' },
            { id: 'end-1', type: 'end', name: '结束', position: { x: 100, y: 0 }, config: {}, inputs: [], outputs: [], status: 'pending' },
          ],
          edges: [
            { id: 'edge-1', source: 'start-1', target: 'end-1', type: 'default' },
          ],
          variables: [],
          triggers: [],
          metadata: { createdAt: Date.now(), updatedAt: Date.now(), tags: [] },
        })

        expect(result.valid).toBe(true)
        expect(result.errors.length).toBe(0)
      })
    })

    describe('工作流模板管理器', () => {
      it('应该获取所有模板', () => {
        const manager = new WorkflowTemplateManager()
        const templates = manager.getAll()

        expect(templates.length).toBeGreaterThan(0)
      })

      it('应该正确获取模板', () => {
        const manager = new WorkflowTemplateManager()
        const template = manager.get('template-empty')

        expect(template).toBeDefined()
        expect(template?.name).toBe('空白工作流')
      })

      it('应该从模板创建工作流', () => {
        const manager = new WorkflowTemplateManager()
        const definition = manager.createFromTemplate('template-linear')

        expect(definition).toBeDefined()
        expect(definition?.nodes.length).toBeGreaterThan(0)
      })

      it('应该按类别获取模板', () => {
        const manager = new WorkflowTemplateManager()
        const templates = manager.getByCategory('basic')

        expect(templates.length).toBeGreaterThan(0)
        expect(templates.every((t) => t.category === 'basic')).toBe(true)
      })
    })
  })

  describe('工作流执行器', () => {
    let WorkflowExecutor: typeof import('../workflow-executor').WorkflowExecutor
    let WorkflowDefinitionBuilder: import('../workflow-definition').WorkflowDefinitionBuilder

    beforeEach(async () => {
      const executorModule = await import('../workflow-executor')
      const definitionModule = await import('../workflow-definition')
      WorkflowExecutor = executorModule.WorkflowExecutor
      WorkflowDefinitionBuilder = definitionModule.WorkflowDefinitionBuilder
    })

    it('应该正确执行简单工作流', async () => {
      const executor = new WorkflowExecutor()
      const builder = new WorkflowDefinitionBuilder()

      const definition = builder
        .setName('简单工作流')
        .addNode({
          id: 'start-1',
          type: 'start',
          name: '开始',
          position: { x: 100, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .addNode({
          id: 'end-1',
          type: 'end',
          name: '结束',
          position: { x: 300, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .addEdge({ source: 'start-1', target: 'end-1', type: 'default' })
        .build()

      const context = await executor.execute(definition)

      expect(context.status).toBe('completed')
      expect(context.currentNodeId).toBe('end-1')
    })

    it('应该正确执行带延迟的工作流', async () => {
      const executor = new WorkflowExecutor()
      const builder = new WorkflowDefinitionBuilder()

      const definition = builder
        .setName('延迟工作流')
        .addNode({
          id: 'start-1',
          type: 'start',
          name: '开始',
          position: { x: 100, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .addNode({
          id: 'delay-1',
          type: 'delay',
          name: '延迟',
          position: { x: 300, y: 100 },
          config: { delay: 100 },
          inputs: [],
          outputs: [],
        })
        .addNode({
          id: 'end-1',
          type: 'end',
          name: '结束',
          position: { x: 500, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .addEdge({ source: 'start-1', target: 'delay-1', type: 'default' })
        .addEdge({ source: 'delay-1', target: 'end-1', type: 'default' })
        .build()

      const startTime = Date.now()
      const context = await executor.execute(definition)
      const duration = Date.now() - startTime

      expect(context.status).toBe('completed')
      expect(duration).toBeGreaterThanOrEqual(90)
    })

    it('应该正确执行条件分支', async () => {
      const executor = new WorkflowExecutor()
      const builder = new WorkflowDefinitionBuilder()

      const definition = builder
        .setName('条件分支工作流')
        .addVariable({ name: 'status', type: 'string', value: 'success', scope: 'workflow' })
        .addNode({
          id: 'start-1',
          type: 'start',
          name: '开始',
          position: { x: 100, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .addNode({
          id: 'condition-1',
          type: 'condition',
          name: '条件判断',
          position: { x: 300, y: 100 },
          config: {
            condition: {
              type: 'equals',
              left: { type: 'variable', variableName: 'status' },
              right: { type: 'value', value: 'success' },
            },
          },
          inputs: [],
          outputs: [],
        })
        .addNode({
          id: 'end-1',
          type: 'end',
          name: '结束',
          position: { x: 500, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .addEdge({ source: 'start-1', target: 'condition-1', type: 'default' })
        .addEdge({ source: 'condition-1', target: 'end-1', type: 'condition_true' })
        .build()

      const context = await executor.execute(definition)

      expect(context.status).toBe('completed')
    })

    it('应该正确记录执行日志', async () => {
      const executor = new WorkflowExecutor()
      const builder = new WorkflowDefinitionBuilder()

      const definition = builder
        .setName('日志测试工作流')
        .addNode({
          id: 'start-1',
          type: 'start',
          name: '开始',
          position: { x: 100, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .addNode({
          id: 'end-1',
          type: 'end',
          name: '结束',
          position: { x: 300, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .addEdge({ source: 'start-1', target: 'end-1', type: 'default' })
        .build()

      const context = await executor.execute(definition)
      const logs = executor.getLogs(context.executionId)

      expect(logs.length).toBeGreaterThan(0)
      expect(logs.some((l) => l.message.includes('开始执行'))).toBe(true)
    })

    it('应该正确保存执行快照', async () => {
      const executor = new WorkflowExecutor()
      const builder = new WorkflowDefinitionBuilder()

      const definition = builder
        .setName('快照测试工作流')
        .addNode({
          id: 'start-1',
          type: 'start',
          name: '开始',
          position: { x: 100, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .addNode({
          id: 'end-1',
          type: 'end',
          name: '结束',
          position: { x: 300, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .addEdge({ source: 'start-1', target: 'end-1', type: 'default' })
        .build()

      const context = await executor.execute(definition)
      const snapshot = executor.getSnapshot(context.executionId)

      expect(snapshot).toBeDefined()
      expect(snapshot?.workflowId).toBe(definition.id)
      expect(snapshot?.context.status).toBe('completed')
    })

    it('应该正确注册自定义执行器', async () => {
      const executor = new WorkflowExecutor()
      const builder = new WorkflowDefinitionBuilder()

      executor.registerExecutor({
        type: 'custom',
        execute: async () => ({ customResult: 'success' }),
      })

      const definition = builder
        .setName('自定义执行器工作流')
        .addNode({
          id: 'start-1',
          type: 'start',
          name: '开始',
          position: { x: 100, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .addNode({
          id: 'custom-1',
          type: 'custom',
          name: '自定义节点',
          position: { x: 300, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .addNode({
          id: 'end-1',
          type: 'end',
          name: '结束',
          position: { x: 500, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .addEdge({ source: 'start-1', target: 'custom-1', type: 'default' })
        .addEdge({ source: 'custom-1', target: 'end-1', type: 'default' })
        .build()

      const context = await executor.execute(definition)

      expect(context.status).toBe('completed')
      expect(context.nodeOutputs.get('custom-1')?.get('customResult')).toBe('success')
    })
  })

  describe('工作流可视化', () => {
    let WorkflowVisualizationService: typeof import('../workflow-visualization').WorkflowVisualizationService
    let WorkflowDefinitionBuilder: import('../workflow-definition').WorkflowDefinitionBuilder

    beforeEach(async () => {
      const vizModule = await import('../workflow-visualization')
      const definitionModule = await import('../workflow-definition')
      WorkflowVisualizationService = vizModule.WorkflowVisualizationService
      WorkflowDefinitionBuilder = definitionModule.WorkflowDefinitionBuilder
    })

    it('应该正确生成可视化数据', () => {
      const viz = new WorkflowVisualizationService()
      const builder = new WorkflowDefinitionBuilder()

      const definition = builder
        .setName('可视化测试')
        .addNode({
          id: 'start-1',
          type: 'start',
          name: '开始',
          position: { x: 100, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .addNode({
          id: 'end-1',
          type: 'end',
          name: '结束',
          position: { x: 300, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .addEdge({ source: 'start-1', target: 'end-1', type: 'default' })
        .build()

      const vizData = viz.generateVisualization(definition)

      expect(vizData.nodes.length).toBe(2)
      expect(vizData.edges.length).toBe(1)
      expect(vizData.layout.type).toBe('dagre')
    })

    it('应该正确创建监控器', () => {
      const viz = new WorkflowVisualizationService()
      const builder = new WorkflowDefinitionBuilder()

      const definition = builder
        .setName('监控测试')
        .addNode({
          id: 'start-1',
          type: 'start',
          name: '开始',
          position: { x: 100, y: 100 },
          config: {},
          inputs: [],
          outputs: [],
        })
        .build()

      const monitor = viz.createMonitor(definition.id, definition)

      expect(monitor.workflowId).toBe(definition.id)
      expect(monitor.status).toBe('idle')
      expect(monitor.progress).toBe(0)
    })

    it('应该正确计算指标', () => {
      const viz = new WorkflowVisualizationService()

      const metrics = viz.calculateMetrics('test-workflow', [
        {
          executionId: 'exec-1',
          workflowId: 'test-workflow',
          workflowDefinition: {
            id: 'test-workflow',
            name: '测试',
            version: '1.0.0',
            status: 'completed',
            nodes: [
              { id: 'start-1', type: 'start', name: '开始', position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [], status: 'completed' },
            ],
            edges: [],
            variables: [],
            triggers: [],
            metadata: { createdAt: Date.now(), updatedAt: Date.now(), tags: [] },
          },
          context: {
            workflowId: 'test-workflow',
            executionId: 'exec-1',
            startTime: Date.now() - 1000,
            variables: new Map(),
            nodeOutputs: new Map(),
            currentNodeId: null,
            status: 'completed',
          },
          logs: [],
          createdAt: Date.now(),
        },
      ])

      expect(metrics.totalExecutions).toBe(1)
      expect(metrics.successfulExecutions).toBe(1)
    })

    it('应该正确存储和查询日志', () => {
      const viz = new WorkflowVisualizationService()

      viz.storeLogs([
        {
          id: 'log-1',
          executionId: 'exec-1',
          nodeId: 'start-1',
          nodeName: '开始',
          timestamp: Date.now(),
          level: 'info',
          message: '测试日志',
        },
      ])

      const logs = viz.queryLogs({ executionId: 'exec-1' })

      expect(logs.length).toBe(1)
      expect(logs[0].message).toBe('测试日志')
    })

    it('应该正确导出日志', () => {
      const viz = new WorkflowVisualizationService()

      viz.storeLogs([
        {
          id: 'log-1',
          executionId: 'exec-1',
          nodeId: 'start-1',
          nodeName: '开始',
          timestamp: Date.now(),
          level: 'info',
          message: '测试日志',
        },
      ])

      const jsonExport = viz.exportLogs('json')
      const parsed = JSON.parse(jsonExport)

      expect(parsed.length).toBe(1)
    })
  })
})

describe('工作流系统集成测试', () => {
  it('工作流定义到执行的完整流程', async () => {
    const { WorkflowDefinitionBuilder } = await import('../workflow-definition')
    const { WorkflowExecutor } = await import('../workflow-executor')
    const { WorkflowVisualizationService } = await import('../workflow-visualization')

    const builder = new WorkflowDefinitionBuilder()
    const executor = new WorkflowExecutor()
    const viz = new WorkflowVisualizationService()

    const definition = builder
      .setName('集成测试工作流')
      .setDescription('完整的集成测试')
      .addNode({
        id: 'start-1',
        type: 'start',
        name: '开始',
        position: { x: 100, y: 100 },
        config: {},
        inputs: [],
        outputs: [],
      })
      .addNode({
        id: 'delay-1',
        type: 'delay',
        name: '延迟',
        position: { x: 300, y: 100 },
        config: { delay: 50 },
        inputs: [],
        outputs: [],
      })
      .addNode({
        id: 'end-1',
        type: 'end',
        name: '结束',
        position: { x: 500, y: 100 },
        config: {},
        inputs: [],
        outputs: [],
      })
      .addEdge({ source: 'start-1', target: 'delay-1', type: 'default' })
      .addEdge({ source: 'delay-1', target: 'end-1', type: 'default' })
      .build()

    const validation = builder.validate()
    expect(validation.valid).toBe(true)

    const context = await executor.execute(definition)
    expect(context.status).toBe('completed')

    const logs = executor.getLogs(context.executionId)
    expect(logs.length).toBeGreaterThan(0)

    const vizData = viz.generateVisualization(definition, context)
    expect(vizData.nodes.length).toBe(3)

    const monitor = viz.createMonitor(definition.id, definition)
    expect(monitor.workflowId).toBe(definition.id)
  })
})
