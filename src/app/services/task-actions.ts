/**
 * @file task-actions.ts
 * @description YYC³便携式智能AI系统 - 任务快速操作服务
 * Task Quick Actions Service
 * Copy (clipboard), export (Markdown/code comment), split, merge, duplicate
 * and batch operations for Task Board.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,task-actions,clipboard
 */

import { useTaskStore, type Task, type TaskPriority } from './task-store'

// Track which tasks have been synced to code
const syncedToCode = new Map<string, { fileId: string; lineNumber: number }>()

class TaskActionsService {
  /**
   * Sync task status to code comment
   * Updates the original TODO/FIXME comment with status emoji
   */
  syncTaskToCode(taskId: string, code: string, filePath: string): string {
    const task = this.findTask(taskId)
    const syncInfo = syncedToCode.get(taskId)
    
    // If task was already synced, update the existing comment
    if (syncInfo && syncInfo.fileId === filePath) {
      const lines = code.split('\n')
      const lineNumber = syncInfo.lineNumber - 1 // 0-indexed
      
      if (lineNumber >= 0 && lineNumber < lines.length) {
        const line = lines[lineNumber]
        const statusEmoji = task.status === 'done' ? '✅' : task.status === 'in-progress' ? '🔄' : '☐'
        
        // Update comment with status
        const updatedLine = line.replace(/☐|✅|🔄/, statusEmoji)
        lines[lineNumber] = updatedLine
        
        console.log(`[TaskActions] Synced task "${task.title}" status to ${filePath}:${lineNumber + 1}`)
        return lines.join('\n')
      }
    }
    
    // First time sync - find the TODO comment and add status
    const taskIndex = code.toLowerCase().indexOf(task.title.toLowerCase())
    if (taskIndex !== -1) {
      const lineNumber = code.substring(0, taskIndex).split('\n').length
      const lines = code.split('\n')
      const lineIndex = lineNumber - 1
      
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex]
        const statusEmoji = task.status === 'done' ? '✅' : task.status === 'in-progress' ? '🔄' : '☐'
        
        // Add status emoji to comment
        const updatedLine = line.replace(/(TODO|FIXME|BUG|HACK|XXX)/, `${statusEmoji} $1`)
        lines[lineIndex] = updatedLine
        
        syncedToCode.set(taskId, { fileId: filePath, lineNumber: lineNumber })
        console.log(`[TaskActions] First sync of task "${task.title}" to ${filePath}:${lineNumber}`)
        return lines.join('\n')
      }
    }
    
    console.warn(`[TaskActions] Could not find task "${task.title}" in ${filePath}`)
    return code
  }

  /**
   * Extract tasks from code and mark them as synced
   */
  scanAndSyncCode(filePath: string, code: string): void {
    const { inferTasksFromCode } = require('./task-inference')
    const inferences = inferTasksFromCode(code, undefined, filePath)
    
    for (const inf of inferences) {
      // Mark as synced
      const task = useTaskStore.getState().tasks.find(t => t.title === inf.task.title)
      if (task && inf.metadata?.lineNumber) {
        syncedToCode.set(task.id, { fileId: filePath, lineNumber: inf.metadata.lineNumber })
      }
    }
  }

  /** Clear sync tracking for a file */
  clearFileSync(filePath: string): void {
    for (const [taskId, info] of syncedToCode.entries()) {
      if (info.fileId === filePath) {
        syncedToCode.delete(taskId)
      }
    }
  }
  /** Copy full task details to clipboard (plain text) */
  async copyTask(taskId: string): Promise<void> {
    const task = this.findTask(taskId)
    await navigator.clipboard.writeText(this.formatTaskPlain(task))
  }

  /** Copy task as Markdown checkbox */
  async copyTaskAsMarkdown(taskId: string): Promise<void> {
    const task = this.findTask(taskId)
    await navigator.clipboard.writeText(this.formatTaskMarkdown(task))
  }

  /** Copy task as code comment */
  async copyTaskAsCodeComment(taskId: string, language = 'typescript'): Promise<void> {
    const task = this.findTask(taskId)
    await navigator.clipboard.writeText(this.formatTaskComment(task, language))
  }

  /** Split a task into multiple tasks (one per uncompleted subtask) */
  splitTask(taskId: string): string[] {
    const task = this.findTask(taskId)
    const { addTask, updateTask } = useTaskStore.getState()
    const newIds: string[] = []

    const subs = task.subtasks?.filter(s => !s.isCompleted) || []
    if (subs.length === 0) return newIds

    for (const sub of subs) {
      const id = addTask({
        title: sub.title,
        description: task.description,
        status: 'todo',
        priority: task.priority,
        type: task.type,
        estimatedHours: task.estimatedHours ? task.estimatedHours / subs.length : undefined,
        relatedFiles: task.relatedFiles,
        tags: task.tags,
        source: 'manual',
      })
      newIds.push(id)
    }

    updateTask(taskId, { status: 'done' })
    return newIds
  }

  /** Merge multiple tasks into one */
  mergeTasks(taskIds: string[]): string | null {
    const { tasks, addTask, deleteTask } = useTaskStore.getState()
    const toMerge = tasks.filter(t => taskIds.includes(t.id))
    if (toMerge.length < 2) return null

    const merged = addTask({
      title: `合并: ${toMerge.map(t => t.title).join(' + ')}`,
      description: toMerge.map(t => `- ${t.title}: ${t.description || ''}`).join('\n'),
      status: 'todo',
      priority: this.highestPriority(toMerge.map(t => t.priority)),
      type: toMerge[0].type,
      estimatedHours: toMerge.reduce((s, t) => s + (t.estimatedHours || 0), 0) || undefined,
      relatedFiles: [...new Set(toMerge.flatMap(t => t.relatedFiles || []))],
      tags: [...new Set(toMerge.flatMap(t => t.tags || []))],
      source: 'manual',
    })

    for (const id of taskIds) deleteTask(id)
    return merged
  }

  /** Export all tasks as Markdown list */
  exportAllAsMarkdown(): string {
    const { tasks } = useTaskStore.getState()
    const active = tasks.filter(t => !t.isArchived)
    const lines = ['# YYC³ Task Board\n']
    const groups: Record<string, Task[]> = {}
    for (const t of active) {
      const key = t.status
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    }
    for (const [status, items] of Object.entries(groups)) {
      lines.push(`\n## ${status.toUpperCase()}\n`)
      for (const t of items) lines.push(this.formatTaskMarkdown(t))
    }
    return lines.join('\n')
  }

  // ── Formatters ──

  private formatTaskPlain(task: Task): string {
    const lines = [`# ${task.title}`]
    if (task.description) lines.push(`\n${task.description}`)
    lines.push(`\nStatus: ${task.status} | Priority: ${task.priority} | Type: ${task.type}`)
    if (task.dueDate) lines.push(`Due: ${new Date(task.dueDate).toLocaleDateString('zh-CN')}`)
    if (task.estimatedHours) lines.push(`Estimated: ${task.estimatedHours}h`)
    if (task.tags?.length) lines.push(`Tags: ${task.tags.join(', ')}`)
    if (task.subtasks?.length) {
      lines.push('\nSubtasks:')
      task.subtasks.forEach((s, i) => lines.push(`  ${i + 1}. [${s.isCompleted ? 'x' : ' '}] ${s.title}`))
    }
    return lines.join('\n')
  }

  private formatTaskMarkdown(task: Task): string {
    const check = task.status === 'done' ? 'x' : ' '
    const emoji: Record<TaskPriority, string> = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }
    let md = `- [${check}] ${emoji[task.priority]} ${task.title}`
    if (task.dueDate) md += ` 📅 ${new Date(task.dueDate).toLocaleDateString('zh-CN')}`
    if (task.subtasks?.length) {
      for (const s of task.subtasks) md += `\n  - [${s.isCompleted ? 'x' : ' '}] ${s.title}`
    }
    return md
  }

  private formatTaskComment(task: Task, language: string): string {
    const prefix = ['python', 'ruby', 'bash', 'sh'].includes(language) ? '# ' : '// '
    let comment = `${prefix}TODO: ${task.title}`
    if (task.description) comment += ` - ${task.description}`
    comment += ` [${task.priority}]`
    return comment
  }

  private highestPriority(priorities: TaskPriority[]): TaskPriority {
    const order: TaskPriority[] = ['critical', 'high', 'medium', 'low']
    for (const p of order) if (priorities.includes(p)) return p
    return 'medium'
  }

  private findTask(taskId: string): Task {
    const task = useTaskStore.getState().tasks.find(t => t.id === taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)
    return task
  }
}

export const taskActionsService = new TaskActionsService()
