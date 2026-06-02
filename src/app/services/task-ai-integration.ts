/**
 * @file task-ai-integration.ts
 * @description YYC³便携式智能AI系统 - AI与任务看板集成
 * AI ↔ Task Board Integration
 * Hooks into ChatInterface messages to auto-extract tasks, provides
 * AI-assisted decomposition, priority assessment and time estimation.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,ai-integration,task-board
 */

import { taskInferenceEngine, type TaskInference } from './task-inference'
import { useTaskStore } from './task-store'

class AITaskIntegration {
  /** Auto-extract tasks from latest AI conversation exchange */
  extractTasksFromMessages(
    messages: Array<{ role: string; content: string }>,
    options?: { minConfidence?: number; autoAdd?: boolean }
  ): TaskInference[] {
    const minConf = options?.minConfidence ?? 0.7
    const autoAdd = options?.autoAdd ?? true

    const inferences = taskInferenceEngine.inferTasksFromConversation(messages)
    const highConf = inferences.filter(inf => inf.confidence >= minConf)

    if (autoAdd) {
      for (const inf of highConf) {
        // Avoid duplicates by checking title similarity
        const { tasks } = useTaskStore.getState()
        const isDup = tasks.some(t => {
          const a = t.title.toLowerCase()
          const b = inf.task.title.toLowerCase()
          return a === b || (a.length > 10 && b.includes(a.substring(0, 20)))
        })
        if (!isDup) {
          useTaskStore.getState().addTask({
            ...inf.task,
            source: 'ai-inferred',
            confidence: inf.confidence,
          })
        }
      }
    }

    return highConf
  }

  /** Extract tasks from code content (TODO/FIXME etc.) */
  extractTasksFromCode(code: string, language?: string, filePath?: string): TaskInference[] {
    const inferences = taskInferenceEngine.inferTasksFromCode(code, language, filePath)
    for (const inf of inferences) {
      const { tasks } = useTaskStore.getState()
      const isDup = tasks.some(t => t.title.toLowerCase() === inf.task.title.toLowerCase())
      if (!isDup) {
        useTaskStore.getState().addTask({
          ...inf.task,
          source: 'code-comment',
          confidence: inf.confidence,
          metadata: inf.metadata,
        })
      }
    }
    return inferences
  }

  /** Check if file has new TODO comments and auto-add tasks */
  scanFileForTasks(filePath: string, code: string): boolean {
    const hasNew = taskInferenceEngine.hasNewTasks(code, filePath)
    if (hasNew) {
      this.extractTasksFromCode(code, undefined, filePath)
    }
    return hasNew
  }

  /** Clear file tracking when file is closed or deleted */
  clearFileTracking(filePath: string): void {
    taskInferenceEngine.clearFileTracking(filePath)
  }

  /** Infer and apply dependency ordering between existing tasks */
  applyDependencyInference(): void {
    const { tasks, updateTask } = useTaskStore.getState()
    const todoTasks = tasks.filter(t => t.status === 'todo' && !t.isArchived)
    if (todoTasks.length < 2) return

    const deps = taskInferenceEngine.inferDependencies(todoTasks.map(t => t.id))
    for (const [taskId, depIds] of deps.entries()) {
      updateTask(taskId, { dependencies: depIds })
    }
  }

  /** Get task board summary for AI context injection */
  getTaskBoardSummary(): string {
    const stats = useTaskStore.getState().getTaskStats()
    const tasks = useTaskStore.getState().tasks.filter(t => !t.isArchived)
    const inProgress = tasks.filter(t => t.status === 'in-progress').map(t => `- ${t.title}`).join('\n')
    const blocked = tasks.filter(t => t.status === 'blocked').map(t => `- ${t.title}`).join('\n')
    const overdue = tasks.filter(t => t.dueDate && t.dueDate < Date.now() && t.status !== 'done').map(t => `- ${t.title}`).join('\n')

    return [
      `## Task Board Status`,
      `Total: ${stats.total} | Done: ${stats.done} | In Progress: ${stats.inProgress} | Blocked: ${stats.blocked}`,
      inProgress ? `\n### In Progress:\n${inProgress}` : '',
      blocked ? `\n### Blocked:\n${blocked}` : '',
      overdue ? `\n### Overdue:\n${overdue}` : '',
    ].filter(Boolean).join('\n')
  }
}

export const aiTaskIntegration = new AITaskIntegration()
