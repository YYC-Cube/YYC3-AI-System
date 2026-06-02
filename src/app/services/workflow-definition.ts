/**
 * @file workflow-definition.ts
 * @description YYC³ 工作流定义 - DAG模型与节点类型
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [workflow],[dag],[definition],[nodes],[conditions]
 *
 * @brief 工作流定义，实现DAG模型与节点类型
 *
 * @details
 * - DAG工作流模型
 * - 节点类型定义
 * - 条件分支
 * - 变量系统
 * - 模板管理
 */

export type NodeType =
  | 'start'
  | 'end'
  | 'task'
  | 'condition'
  | 'parallel'
  | 'loop'
  | 'subworkflow'
  | 'delay'
  | 'webhook'
  | 'script';

export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting';

export type WorkflowStatus =
  | 'draft'
  | 'published'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

export interface Position {
  x: number;
  y: number;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  position: Position;
  config: NodeConfig;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  status: NodeStatus;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface NodeConfig {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  continueOnError?: boolean;
  condition?: ConditionExpression;
  [key: string]: unknown;
}

export interface NodeInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  required: boolean;
  default?: unknown;
  value?: unknown;
  source?: InputSource;
}

export interface InputSource {
  type: 'static' | 'variable' | 'node_output';
  nodeId?: string;
  outputName?: string;
  variableName?: string;
}

export interface NodeOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  description?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: ConditionExpression;
  type: 'default' | 'condition_true' | 'condition_false';
}

export interface ConditionExpression {
  type:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'greater_than'
    | 'less_than'
    | 'and'
    | 'or'
    | 'not'
    | 'custom';
  left: ConditionOperand;
  right?: ConditionOperand;
  operands?: ConditionExpression[];
  customExpression?: string;
}

export interface ConditionOperand {
  type: 'value' | 'variable' | 'node_output';
  value?: unknown;
  variableName?: string;
  nodeId?: string;
  outputName?: string;
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  value: unknown;
  scope: 'global' | 'workflow' | 'node';
  description?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: WorkflowVariable[];
  triggers: WorkflowTrigger[];
  metadata: WorkflowMetadata;
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'schedule' | 'webhook' | 'event' | 'api';
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface WorkflowMetadata {
  author?: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  category?: string;
  icon?: string;
  documentation?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  definition: Omit<WorkflowDefinition, 'id' | 'metadata'>;
  icon?: string;
  popularity: number;
}

class WorkflowValidator {
  validate(definition: WorkflowDefinition): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const startNodes = definition.nodes.filter((n) => n.type === 'start');
    if (startNodes.length === 0) {
      errors.push({ code: 'NO_START_NODE', message: '工作流必须包含开始节点' });
    } else if (startNodes.length > 1) {
      errors.push({ code: 'MULTIPLE_START_NODES', message: '工作流只能有一个开始节点' });
    }

    const endNodes = definition.nodes.filter((n) => n.type === 'end');
    if (endNodes.length === 0) {
      warnings.push({ code: 'NO_END_NODE', message: '建议添加结束节点' });
    }

    const nodeIds = new Set(definition.nodes.map((n) => n.id));
    for (const edge of definition.edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push({ code: 'INVALID_EDGE_SOURCE', message: `边的源节点不存在: ${edge.source}` });
      }
      if (!nodeIds.has(edge.target)) {
        errors.push({ code: 'INVALID_EDGE_TARGET', message: `边的目标节点不存在: ${edge.target}` });
      }
    }

    const cycles = this.detectCycles(definition);
    if (cycles.length > 0) {
      errors.push({ code: 'CYCLE_DETECTED', message: `检测到循环依赖: ${cycles.join(' -> ')}` });
    }

    for (const node of definition.nodes) {
      const nodeErrors = this.validateNode(node, definition);
      errors.push(...nodeErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateNode(node: WorkflowNode, definition: WorkflowDefinition): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!node.id || node.id.trim() === '') {
      errors.push({ code: 'EMPTY_NODE_ID', message: '节点ID不能为空' });
    }

    if (!node.name || node.name.trim() === '') {
      errors.push({ code: 'EMPTY_NODE_NAME', message: `节点名称不能为空: ${node.id}` });
    }

    if (node.type === 'task' && !node.config.executor) {
      errors.push({ code: 'MISSING_EXECUTOR', message: `任务节点缺少执行器配置: ${node.id}` });
    }

    if (node.type === 'condition') {
      if (!node.config.condition) {
        errors.push({ code: 'MISSING_CONDITION', message: `条件节点缺少条件表达式: ${node.id}` });
      }

      const outgoingEdges = definition.edges.filter((e) => e.source === node.id);
      if (outgoingEdges.length < 2) {
        warnings.push({
          code: 'INCOMPLETE_BRANCHES',
          message: `条件节点应至少有两个分支: ${node.id}`,
        });
      }
    }

    return errors;
  }

  private detectCycles(definition: WorkflowDefinition): string[] {
    const adjacencyList = new Map<string, string[]>();

    for (const node of definition.nodes) {
      adjacencyList.set(node.id, []);
    }

    for (const edge of definition.edges) {
      adjacencyList.get(edge.source)?.push(edge.target);
    }

    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    for (const node of definition.nodes) {
      const cycle = this.dfs(node.id, adjacencyList, visited, recursionStack, path);
      if (cycle.length > 0) {
        return cycle;
      }
    }

    return [];
  }

  private dfs(
    nodeId: string,
    adjacencyList: Map<string, string[]>,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): string[] {
    if (recursionStack.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      return path.slice(cycleStart);
    }

    if (visited.has(nodeId)) {
      return [];
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      const cycle = this.dfs(neighbor, adjacencyList, visited, recursionStack, path);
      if (cycle.length > 0) {
        return cycle;
      }
    }

    recursionStack.delete(nodeId);
    path.pop();

    return [];
  }
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  code: string;
  message: string;
  nodeId?: string;
}

interface ValidationWarning {
  code: string;
  message: string;
  nodeId?: string;
}

const warnings: ValidationWarning[] = [];

class WorkflowDefinitionBuilder {
  private definition: WorkflowDefinition;
  private validator: WorkflowValidator;

  constructor() {
    this.definition = {
      id: this.generateId(),
      name: '新工作流',
      version: '1.0.0',
      status: 'draft',
      nodes: [],
      edges: [],
      variables: [],
      triggers: [],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [],
      },
    };
    this.validator = new WorkflowValidator();
  }

  setId(id: string): this {
    this.definition.id = id;
    return this;
  }

  setName(name: string): this {
    this.definition.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.definition.description = description;
    return this;
  }

  setVersion(version: string): this {
    this.definition.version = version;
    return this;
  }

  addNode(node: Omit<WorkflowNode, 'status'> & { status?: NodeStatus }): this {
    const fullNode: WorkflowNode = {
      ...node,
      status: node.status || 'pending',
    };
    this.definition.nodes.push(fullNode);
    return this;
  }

  removeNode(nodeId: string): this {
    this.definition.nodes = this.definition.nodes.filter((n) => n.id !== nodeId);
    this.definition.edges = this.definition.edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );
    return this;
  }

  updateNode(nodeId: string, updates: Partial<WorkflowNode>): this {
    const index = this.definition.nodes.findIndex((n) => n.id === nodeId);
    if (index !== -1) {
      this.definition.nodes[index] = {
        ...this.definition.nodes[index],
        ...updates,
      };
    }
    return this;
  }

  addEdge(edge: Omit<WorkflowEdge, 'id'>): this {
    const fullEdge: WorkflowEdge = {
      ...edge,
      id: this.generateId(),
    };
    this.definition.edges.push(fullEdge);
    return this;
  }

  removeEdge(edgeId: string): this {
    this.definition.edges = this.definition.edges.filter((e) => e.id !== edgeId);
    return this;
  }

  addVariable(variable: WorkflowVariable): this {
    this.definition.variables.push(variable);
    return this;
  }

  removeVariable(name: string): this {
    this.definition.variables = this.definition.variables.filter((v) => v.name !== name);
    return this;
  }

  addTrigger(trigger: WorkflowTrigger): this {
    this.definition.triggers.push(trigger);
    return this;
  }

  removeTrigger(triggerId: string): this {
    this.definition.triggers = this.definition.triggers.filter((t) => t.id !== triggerId);
    return this;
  }

  setMetadata(metadata: Partial<WorkflowMetadata>): this {
    this.definition.metadata = {
      ...this.definition.metadata,
      ...metadata,
      updatedAt: Date.now(),
    };
    return this;
  }

  build(): WorkflowDefinition {
    this.definition.metadata.updatedAt = Date.now();
    return { ...this.definition };
  }

  validate(): ValidationResult {
    return this.validator.validate(this.definition);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

class WorkflowTemplateManager {
  private templates: Map<string, WorkflowTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    this.register({
      id: 'template-empty',
      name: '空白工作流',
      description: '从零开始创建工作流',
      category: 'basic',
      definition: {
        name: '空白工作流',
        version: '1.0.0',
        status: 'draft',
        nodes: [
          {
            id: 'start-1',
            type: 'start',
            name: '开始',
            position: { x: 100, y: 100 },
            config: {},
            inputs: [],
            outputs: [],
            status: 'pending',
          },
        ],
        edges: [],
        variables: [],
        triggers: [{ id: 'trigger-1', type: 'manual', config: {}, enabled: true }],
      },
      popularity: 100,
    });

    this.register({
      id: 'template-linear',
      name: '线性流程',
      description: '简单的线性执行流程',
      category: 'basic',
      definition: {
        name: '线性流程',
        version: '1.0.0',
        status: 'draft',
        nodes: [
          {
            id: 'start-1',
            type: 'start',
            name: '开始',
            position: { x: 100, y: 100 },
            config: {},
            inputs: [],
            outputs: [],
            status: 'pending',
          },
          {
            id: 'task-1',
            type: 'task',
            name: '处理任务',
            position: { x: 300, y: 100 },
            config: { executor: 'default' },
            inputs: [],
            outputs: [],
            status: 'pending',
          },
          {
            id: 'end-1',
            type: 'end',
            name: '结束',
            position: { x: 500, y: 100 },
            config: {},
            inputs: [],
            outputs: [],
            status: 'pending',
          },
        ],
        edges: [
          { id: 'edge-start-1-task-1', source: 'start-1', target: 'task-1', type: 'default' },
          { id: 'edge-task-1-end-1', source: 'task-1', target: 'end-1', type: 'default' },
        ],
        variables: [],
        triggers: [{ id: 'trigger-1', type: 'manual', config: {}, enabled: true }],
      },
      popularity: 90,
    });

    this.register({
      id: 'template-conditional',
      name: '条件分支',
      description: '包含条件判断的分支流程',
      category: 'control',
      definition: {
        name: '条件分支流程',
        version: '1.0.0',
        status: 'draft',
        nodes: [
          {
            id: 'start-1',
            type: 'start',
            name: '开始',
            position: { x: 100, y: 150 },
            config: {},
            inputs: [],
            outputs: [],
            status: 'pending',
          },
          {
            id: 'condition-1',
            type: 'condition',
            name: '条件判断',
            position: { x: 300, y: 150 },
            config: {
              condition: {
                type: 'equals',
                left: { type: 'variable', variableName: 'status' },
                right: { type: 'value', value: 'success' },
              },
            },
            inputs: [],
            outputs: [],
            status: 'pending',
          },
          {
            id: 'task-success',
            type: 'task',
            name: '成功处理',
            position: { x: 500, y: 50 },
            config: { executor: 'default' },
            inputs: [],
            outputs: [],
            status: 'pending',
          },
          {
            id: 'task-failure',
            type: 'task',
            name: '失败处理',
            position: { x: 500, y: 250 },
            config: { executor: 'default' },
            inputs: [],
            outputs: [],
            status: 'pending',
          },
          {
            id: 'end-1',
            type: 'end',
            name: '结束',
            position: { x: 700, y: 150 },
            config: {},
            inputs: [],
            outputs: [],
            status: 'pending',
          },
        ],
        edges: [
          {
            id: 'edge-start-1-condition-1',
            source: 'start-1',
            target: 'condition-1',
            type: 'default',
          },
          {
            id: 'edge-condition-1-task-success',
            source: 'condition-1',
            target: 'task-success',
            type: 'condition_true',
          },
          {
            id: 'edge-condition-1-task-failure',
            source: 'condition-1',
            target: 'task-failure',
            type: 'condition_false',
          },
          {
            id: 'edge-task-success-end-1',
            source: 'task-success',
            target: 'end-1',
            type: 'default',
          },
          {
            id: 'edge-task-failure-end-1',
            source: 'task-failure',
            target: 'end-1',
            type: 'default',
          },
        ],
        variables: [{ name: 'status', type: 'string', value: '', scope: 'workflow' }],
        triggers: [{ id: 'trigger-1', type: 'manual', config: {}, enabled: true }],
      },
      popularity: 85,
    });

    this.register({
      id: 'template-parallel',
      name: '并行处理',
      description: '多个任务并行执行',
      category: 'control',
      definition: {
        name: '并行处理流程',
        version: '1.0.0',
        status: 'draft',
        nodes: [
          {
            id: 'start-1',
            type: 'start',
            name: '开始',
            position: { x: 100, y: 150 },
            config: {},
            inputs: [],
            outputs: [],
            status: 'pending',
          },
          {
            id: 'parallel-1',
            type: 'parallel',
            name: '并行分支',
            position: { x: 300, y: 150 },
            config: {},
            inputs: [],
            outputs: [],
            status: 'pending',
          },
          {
            id: 'task-1',
            type: 'task',
            name: '任务A',
            position: { x: 500, y: 50 },
            config: { executor: 'default' },
            inputs: [],
            outputs: [],
            status: 'pending',
          },
          {
            id: 'task-2',
            type: 'task',
            name: '任务B',
            position: { x: 500, y: 150 },
            config: { executor: 'default' },
            inputs: [],
            outputs: [],
            status: 'pending',
          },
          {
            id: 'task-3',
            type: 'task',
            name: '任务C',
            position: { x: 500, y: 250 },
            config: { executor: 'default' },
            inputs: [],
            outputs: [],
            status: 'pending',
          },
          {
            id: 'parallel-join',
            type: 'parallel',
            name: '合并',
            position: { x: 700, y: 150 },
            config: {},
            inputs: [],
            outputs: [],
            status: 'pending',
          },
          {
            id: 'end-1',
            type: 'end',
            name: '结束',
            position: { x: 900, y: 150 },
            config: {},
            inputs: [],
            outputs: [],
            status: 'pending',
          },
        ],
        edges: [
          {
            id: 'edge-start-1-parallel-1',
            source: 'start-1',
            target: 'parallel-1',
            type: 'default',
          },
          { id: 'edge-parallel-1-task-1', source: 'parallel-1', target: 'task-1', type: 'default' },
          { id: 'edge-parallel-1-task-2', source: 'parallel-1', target: 'task-2', type: 'default' },
          { id: 'edge-parallel-1-task-3', source: 'parallel-1', target: 'task-3', type: 'default' },
          {
            id: 'edge-task-1-parallel-join',
            source: 'task-1',
            target: 'parallel-join',
            type: 'default',
          },
          {
            id: 'edge-task-2-parallel-join',
            source: 'task-2',
            target: 'parallel-join',
            type: 'default',
          },
          {
            id: 'edge-task-3-parallel-join',
            source: 'task-3',
            target: 'parallel-join',
            type: 'default',
          },
          {
            id: 'edge-parallel-join-end-1',
            source: 'parallel-join',
            target: 'end-1',
            type: 'default',
          },
        ],
        variables: [],
        triggers: [{ id: 'trigger-1', type: 'manual', config: {}, enabled: true }],
      },
      popularity: 80,
    });
  }

  register(template: WorkflowTemplate): void {
    this.templates.set(template.id, template);
  }

  get(templateId: string): WorkflowTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAll(): WorkflowTemplate[] {
    return Array.from(this.templates.values()).sort((a, b) => b.popularity - a.popularity);
  }

  getByCategory(category: string): WorkflowTemplate[] {
    return this.getAll().filter((t) => t.category === category);
  }

  createFromTemplate(templateId: string): WorkflowDefinition | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    return {
      ...template.definition,
      id: this.generateId(),
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [],
      },
    };
  }

  private generateId(): string {
    return `wf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const workflowValidator = new WorkflowValidator();
export const workflowTemplateManager = new WorkflowTemplateManager();

export { WorkflowValidator, WorkflowDefinitionBuilder, WorkflowTemplateManager };

export default WorkflowDefinition;
