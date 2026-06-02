/**
 * @file agent-core.ts
 * @description YYC³ Agent核心框架 - 生命周期管理与任务调度
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [agent],[core],[lifecycle],[scheduler],[state-machine]
 *
 * @brief Agent核心框架，实现生命周期管理与任务调度
 *
 * @details
 * - Agent生命周期管理
 * - 任务调度系统
 * - 状态机实现
 * - 优先级队列
 * - 并发控制
 */

export type AgentState =
  | 'idle'
  | 'initializing'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'terminated';

export type AgentPriority = 'low' | 'normal' | 'high' | 'critical';

export type TaskStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  priority: AgentPriority;
  maxConcurrentTasks: number;
  timeout: number;
  retryCount: number;
  retryDelay: number;
  metadata?: Record<string, unknown>;
}

export interface Task<T = unknown> {
  id: string;
  name: string;
  description?: string;
  priority: AgentPriority;
  status: TaskStatus;
  payload: T;
  result?: unknown;
  error?: Error;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  retryCount: number;
  maxRetries: number;
  timeout: number;
  dependencies: string[];
  metadata?: Record<string, unknown>;
}

export interface TaskResult<T = unknown> {
  taskId: string;
  success: boolean;
  result?: T;
  error?: Error;
  duration: number;
  retryCount: number;
}

export interface AgentEvent {
  type: string;
  agentId: string;
  timestamp: number;
  data?: unknown;
}

export interface StateTransition {
  from: AgentState;
  to: AgentState;
  timestamp: number;
  reason?: string;
}

export interface AgentStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskDuration: number;
  uptime: number;
  stateTransitions: number;
}

type AgentEventHandler = (event: AgentEvent) => void | Promise<void>;

interface TaskExecutor<T = unknown> {
  (task: Task<T>): Promise<unknown>;
}

const STATE_TRANSITIONS: Record<AgentState, AgentState[]> = {
  idle: ['initializing', 'terminated'],
  initializing: ['idle', 'running', 'failed'],
  running: ['paused', 'completed', 'failed', 'idle'],
  paused: ['running', 'terminated'],
  completed: ['idle', 'terminated'],
  failed: ['idle', 'terminated'],
  terminated: [],
};

class AgentCore {
  private config: AgentConfig;
  private state: AgentState = 'idle';
  private stateHistory: StateTransition[] = [];
  private taskQueue: Task[] = [];
  private runningTasks: Map<string, Task> = new Map();
  private completedTasks: Map<string, TaskResult> = new Map();
  private executors: Map<string, TaskExecutor> = new Map();
  private eventHandlers: Map<string, Set<AgentEventHandler>> = new Map();
  private startTime: number = 0;
  private pausePromise: { resolve: () => void } | null = null;

  constructor(config: AgentConfig) {
    this.config = config;
    this.transitionTo('idle');
  }

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get currentState(): AgentState {
    return this.state;
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  async initialize(): Promise<void> {
    if (this.state !== 'idle') {
      throw new Error(`无法初始化: 当前状态为 ${this.state}`);
    }

    this.transitionTo('initializing');
    this.startTime = Date.now();

    try {
      await this.emit('initializing', { agentId: this.id });
      this.transitionTo('running');
      await this.emit('initialized', { agentId: this.id });
    } catch (error) {
      this.transitionTo('failed');
      throw error;
    }
  }

  registerExecutor<T>(taskType: string, executor: TaskExecutor<T>): void {
    this.executors.set(taskType, executor as TaskExecutor<unknown>);
  }

  submitTask<T>(task: Omit<Task<T>, 'id' | 'status' | 'createdAt' | 'retryCount'>): string {
    const fullTask: Task = {
      ...task,
      id: this.generateId(),
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
    };

    this.taskQueue.push(fullTask);
    this.sortQueue();
    this.emit('task:submitted', { task: fullTask });

    if (this.state === 'running') {
      this.processQueue();
    }

    return fullTask.id;
  }

  cancelTask(taskId: string): boolean {
    const queueIndex = this.taskQueue.findIndex((t) => t.id === taskId);
    if (queueIndex !== -1) {
      const task = this.taskQueue.splice(queueIndex, 1)[0];
      task.status = 'cancelled';
      this.emit('task:cancelled', { task });
      return true;
    }

    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      runningTask.status = 'cancelled';
      this.emit('task:cancelled', { task: runningTask });
      return true;
    }

    return false;
  }

  async pause(): Promise<void> {
    if (this.state !== 'running') {
      throw new Error(`无法暂停: 当前状态为 ${this.state}`);
    }

    this.transitionTo('paused');
    await this.emit('paused', { agentId: this.id });

    return new Promise((resolve) => {
      this.pausePromise = { resolve };
    });
  }

  async resume(): Promise<void> {
    if (this.state !== 'paused') {
      throw new Error(`无法恢复: 当前状态为 ${this.state}`);
    }

    this.transitionTo('running');
    await this.emit('resumed', { agentId: this.id });

    if (this.pausePromise) {
      this.pausePromise.resolve();
      this.pausePromise = null;
    }

    this.processQueue();
  }

  async terminate(): Promise<void> {
    this.transitionTo('terminated');
    await this.emit('terminated', { agentId: this.id });

    this.taskQueue = [];
    this.runningTasks.clear();
  }

  getTask(taskId: string): Task | undefined {
    return (
      this.taskQueue.find((t) => t.id === taskId) ||
      this.runningTasks.get(taskId) ||
      (this.completedTasks.has(taskId) ? ({ id: taskId, status: 'completed' } as Task) : undefined)
    );
  }

  getTaskResult(taskId: string): TaskResult | undefined {
    return this.completedTasks.get(taskId);
  }

  getQueueLength(): number {
    return this.taskQueue.length;
  }

  getRunningCount(): number {
    return this.runningTasks.size;
  }

  getStats(): AgentStats {
    const results = Array.from(this.completedTasks.values());
    const completedTasks = results.filter((r) => r.success);
    const failedTasks = results.filter((r) => !r.success);
    const totalDuration = completedTasks.reduce((sum, r) => sum + r.duration, 0);

    return {
      totalTasks: results.length + this.taskQueue.length + this.runningTasks.size,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      averageTaskDuration: completedTasks.length > 0 ? totalDuration / completedTasks.length : 0,
      uptime: this.startTime > 0 ? Date.now() - this.startTime : 0,
      stateTransitions: this.stateHistory.length,
    };
  }

  on(eventType: string, handler: AgentEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
    };
  }

  private async processQueue(): Promise<void> {
    while (
      this.state === 'running' &&
      this.taskQueue.length > 0 &&
      this.runningTasks.size < this.config.maxConcurrentTasks
    ) {
      const task = this.taskQueue.shift();
      if (!task) break;

      if (task.dependencies.length > 0) {
        const allDependenciesMet = task.dependencies.every(
          (depId) => this.completedTasks.has(depId) && this.completedTasks.get(depId)?.success
        );

        if (!allDependenciesMet) {
          this.taskQueue.push(task);
          this.sortQueue();
          break;
        }
      }

      this.executeTask(task);
    }
  }

  private async executeTask(task: Task): Promise<void> {
    task.status = 'running';
    task.startedAt = Date.now();
    this.runningTasks.set(task.id, task);

    this.emit('task:started', { task });

    const startTime = Date.now();

    try {
      const executor = this.executors.get(task.name) || this.executors.get('default');
      if (!executor) {
        throw new Error(`未找到任务执行器: ${task.name}`);
      }

      const result = await Promise.race([executor(task), this.createTimeoutPromise(task.timeout)]);

      task.result = result;
      task.status = 'completed';
      task.completedAt = Date.now();

      const taskResult: TaskResult = {
        taskId: task.id,
        success: true,
        result,
        duration: Date.now() - startTime,
        retryCount: task.retryCount,
      };

      this.completedTasks.set(task.id, taskResult);
      this.emit('task:completed', { task, result: taskResult });
    } catch (error) {
      task.error = error instanceof Error ? error : new Error(String(error));

      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        task.status = 'pending';
        this.taskQueue.push(task);
        this.sortQueue();
        this.emit('task:retry', { task, error: task.error });
      } else {
        task.status = 'failed';
        task.completedAt = Date.now();

        const taskResult: TaskResult = {
          taskId: task.id,
          success: false,
          error: task.error,
          duration: Date.now() - startTime,
          retryCount: task.retryCount,
        };

        this.completedTasks.set(task.id, taskResult);
        this.emit('task:failed', { task, error: task.error });
      }
    } finally {
      this.runningTasks.delete(task.id);
      this.processQueue();
    }
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`任务超时: ${timeout}ms`)), timeout);
    });
  }

  private transitionTo(newState: AgentState, reason?: string): void {
    const allowedTransitions = STATE_TRANSITIONS[this.state];
    if (!allowedTransitions.includes(newState)) {
      throw new Error(`无效的状态转换: ${this.state} -> ${newState}`);
    }

    const transition: StateTransition = {
      from: this.state,
      to: newState,
      timestamp: Date.now(),
      reason,
    };

    this.stateHistory.push(transition);
    this.state = newState;

    this.emit('state:changed', { transition });
  }

  private sortQueue(): void {
    const priorityOrder: Record<AgentPriority, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    };

    this.taskQueue.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt - b.createdAt;
    });
  }

  private async emit(eventType: string, data?: unknown): Promise<void> {
    const event: AgentEvent = {
      type: eventType,
      agentId: this.id,
      timestamp: Date.now(),
      data,
    };

    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(event);
        } catch (error) {
          console.error(`事件处理器错误 [${eventType}]:`, error);
        }
      }
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

class AgentManager {
  private agents: Map<string, AgentCore> = new Map();
  private globalEventHandlers: Map<string, Set<AgentEventHandler>> = new Map();

  createAgent(config: AgentConfig): AgentCore {
    if (this.agents.has(config.id)) {
      throw new Error(`Agent已存在: ${config.id}`);
    }

    const agent = new AgentCore(config);
    this.agents.set(config.id, agent);

    agent.on('*', (event) => {
      this.emitGlobal(event.type, event);
    });

    return agent;
  }

  getAgent(agentId: string): AgentCore | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): AgentCore[] {
    return Array.from(this.agents.values());
  }

  async terminateAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    await agent.terminate();
    this.agents.delete(agentId);
    return true;
  }

  async terminateAll(): Promise<void> {
    const terminations = Array.from(this.agents.values()).map((agent) => agent.terminate());
    await Promise.all(terminations);
    this.agents.clear();
  }

  getGlobalStats(): {
    totalAgents: number;
    runningAgents: number;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
  } {
    let totalTasks = 0;
    let completedTasks = 0;
    let failedTasks = 0;
    let runningAgents = 0;

    for (const agent of this.agents.values()) {
      const stats = agent.getStats();
      totalTasks += stats.totalTasks;
      completedTasks += stats.completedTasks;
      failedTasks += stats.failedTasks;
      if (agent.currentState === 'running') runningAgents++;
    }

    return {
      totalAgents: this.agents.size,
      runningAgents,
      totalTasks,
      completedTasks,
      failedTasks,
    };
  }

  onGlobal(eventType: string, handler: AgentEventHandler): () => void {
    if (!this.globalEventHandlers.has(eventType)) {
      this.globalEventHandlers.set(eventType, new Set());
    }
    this.globalEventHandlers.get(eventType)!.add(handler);

    return () => {
      this.globalEventHandlers.get(eventType)?.delete(handler);
    };
  }

  private async emitGlobal(eventType: string, event: AgentEvent): Promise<void> {
    const handlers = this.globalEventHandlers.get(eventType);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(event);
        } catch (error) {
          console.error(`全局事件处理器错误 [${eventType}]:`, error);
        }
      }
    }
  }
}

export const agentManager = new AgentManager();

export { AgentCore, AgentManager };

export default AgentCore;
