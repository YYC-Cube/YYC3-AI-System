/**
 * @file task-inference.ts
 * @description YYC³便携式智能AI系统 - 任务推理引擎
 * Task Inference Engine
 * Smart local extraction of tasks from conversations, code comments (TODO/FIXME/HACK),
 * and free-text descriptions. Combines regex heuristics with optional AI-powered deep analysis.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,task-inference,ai
 */

import type { TaskPriority, TaskType, TaskStatus } from './task-store'

// ── Task Inference Result ──

export interface TaskInference {
  task: {
    title: string
    description?: string
    status: TaskStatus
    priority: TaskPriority
    type: TaskType
    estimatedHours?: number
    relatedFiles?: string[]
    tags?: string[]
  }
  confidence: number
  reasoning: string
  context: string
  metadata?: {
    lineNumber?: number
    filePath?: string
  }
}

// ── Patterns ──

const TODO_PATTERNS = [
  /(?:\/\/|#|--|\/\*)\s*TODO\s*[:\-]?\s*(.+?)(?:\*\/)?$/gim,
  /(?:\/\/|#|--|\/\*)\s*FIXME\s*[:\-]?\s*(.+?)(?:\*\/)?$/gim,
  /(?:\/\/|#|--|\/\*)\s*HACK\s*[:\-]?\s*(.+?)(?:\*\/)?$/gim,
  /(?:\/\/|#|--|\/\*)\s*BUG\s*[:\-]?\s*(.+?)(?:\*\/)?$/gim,
  /(?:\/\/|#|--|\/\*)\s*XXX\s*[:\-]?\s*(.+?)(?:\*\/)?$/gim,
  /(?:\/\/|#|--|\/\*)\s*NOTE\s*[:\-]?\s*(.+?)(?:\*\/)?$/gim,
]

const KEYWORD_TYPE_MAP: Record<string, TaskType> = {
  'todo': 'feature', 'fixme': 'bug', 'bug': 'bug', 'hack': 'refactor',
  'xxx': 'refactor', 'note': 'documentation',
}
const KEYWORD_PRIORITY_MAP: Record<string, TaskPriority> = {
  'todo': 'medium', 'fixme': 'high', 'bug': 'critical', 'hack': 'medium',
  'xxx': 'low', 'note': 'low',
}

const TASK_ACTION_VERBS = /\b(需要|必须|应该|请|要求|实现|完成|修复|添加|创建|优化|重构|升级|迁移|编写|测试|审查|部署|配置|移除|删除|清理|implement|fix|add|create|build|refactor|optimize|write|test|review|deploy|configure|remove|delete|clean|migrate|upgrade|setup)\b/i

const PRIORITY_KEYWORDS = {
  critical: /\b(紧急|立即|马上|ASAP|critical|urgent|immediately|blocking|崩溃|crash)\b/i,
  high: /\b(重要|尽快|优先|high|important|soon|priority)\b/i,
  low: /\b(以后|低优|有空|later|low|eventually|nice-to-have|可选)\b/i,
}

// ── Task Inference Engine ──

class TaskInferenceEngine {
  // Track which files have been scanned for TODO comments
  private scannedFiles = new Map<string, { hash: string; tasks: string[] }>()

  /**
   * Extract tasks from code comments (TODO/FIXME/HACK/BUG)
   */
  inferTasksFromCode(code: string, language?: string, filePath?: string): TaskInference[] {
    const results: TaskInference[] = []

    for (const pattern of TODO_PATTERNS) {
      pattern.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = pattern.exec(code)) !== null) {
        const fullMatch = match[0].toLowerCase()
        const title = match[1].trim()
        if (!title || title.length < 3) continue

        const keyword = fullMatch.includes('fixme') ? 'fixme'
          : fullMatch.includes('bug') ? 'bug'
          : fullMatch.includes('hack') ? 'hack'
          : fullMatch.includes('xxx') ? 'xxx'
          : fullMatch.includes('note') ? 'note'
          : 'todo'

        const lineNumber = code.substring(0, match.index).split('\n').length

        results.push({
          task: {
            title,
            status: 'todo',
            priority: KEYWORD_PRIORITY_MAP[keyword] || 'medium',
            type: KEYWORD_TYPE_MAP[keyword] || 'feature',
            tags: [keyword, language || 'code'],
            relatedFiles: filePath ? [filePath] : undefined,
          },
          confidence: 0.95,
          reasoning: `Found ${keyword.toUpperCase()} comment in code${filePath ? ` at ${filePath}:${lineNumber}` : ''}`,
          context: match[0].trim(),
          metadata: { lineNumber, filePath },
        })
      }
    }

    return results
  }

  /**
   * Check if code has new TODO comments since last scan
   */
  hasNewTasks(code: string, filePath: string): boolean {
    const currentHash = this.hash(code)
    const previous = this.scannedFiles.get(filePath)
    
    // First time scanning this file
    if (!previous) {
      this.scannedFiles.set(filePath, { hash: currentHash, tasks: [] })
      return true
    }
    
    // File hasn't changed
    if (previous.hash === currentHash) {
      return false
    }
    
    // Extract new tasks
    const tasks = this.inferTasksFromCode(code, undefined, filePath)
    const newTasks = tasks.filter(t => !previous.tasks.includes(t.task.title))
    
    // Update tracking
    this.scannedFiles.set(filePath, {
      hash: currentHash,
      tasks: tasks.map(t => t.task.title),
    })
    
    return newTasks.length > 0
  }

  /**
   * Clear tracking for a file
   */
  clearFileTracking(filePath: string): void {
    this.scannedFiles.delete(filePath)
  }

  /**
   * Simple hash function for change detection
   */
  private hash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  /**
   * Extract tasks from conversational text / AI messages
   */
  inferTasksFromConversation(
    messages: Array<{ role: string; content: string }>
  ): TaskInference[] {
    const results: TaskInference[] = []
    const combined = messages.map(m => m.content).join('\n')

    // Strategy 1: numbered lists ("1. xxx", "- xxx")
    const listItems = combined.match(/(?:^|\n)\s*(?:\d+[.)]\s+|-\s+|\*\s+|✅\s*|☐\s*|□\s*)(.{8,120})/gm) || []
    for (const item of listItems) {
      const text = item.replace(/^\s*(?:\d+[.)]\s+|-\s+|\*\s+|✅\s*|☐\s*|□\s*)/, '').trim()
      if (!text || text.length < 5) continue
      if (!TASK_ACTION_VERBS.test(text)) continue

      results.push({
        task: {
          title: text.length > 80 ? text.substring(0, 77) + '...' : text,
          description: text.length > 80 ? text : undefined,
          status: item.includes('✅') ? 'done' : 'todo',
          priority: this.inferPriority(text),
          type: this.inferType(text),
          tags: ['conversation'],
        },
        confidence: 0.75,
        reasoning: 'Extracted from numbered/bulleted list with action verb',
        context: text,
      })
    }

    // Strategy 2: sentences containing strong action verbs + "need/should/must"
    const sentences = combined.split(/[。\n.!！]/).filter(s => s.trim().length > 10)
    for (const sentence of sentences) {
      const s = sentence.trim()
      if (results.some(r => r.context === s)) continue
      if (!/\b(需要|必须|应该|要求|implement|fix|must|should|need to|have to)\b/i.test(s)) continue
      if (!TASK_ACTION_VERBS.test(s)) continue

      results.push({
        task: {
          title: s.length > 80 ? s.substring(0, 77) + '...' : s,
          description: s.length > 80 ? s : undefined,
          status: 'todo',
          priority: this.inferPriority(s),
          type: this.inferType(s),
          tags: ['conversation'],
        },
        confidence: 0.65,
        reasoning: 'Sentence contains imperative/obligation verb pattern',
        context: s,
      })
    }

    // Deduplicate by similarity
    return this.deduplicateInferences(results)
  }

  /**
   * Extract tasks from free-text description
   */
  inferTasksFromDescription(description: string): TaskInference[] {
    return this.inferTasksFromConversation([{ role: 'user', content: description }])
  }

  /**
   * Infer dependency graph between tasks (heuristic: ordered tasks depend on previous)
   */
  inferDependencies(taskIds: string[]): Map<string, string[]> {
    const deps = new Map<string, string[]>()
    for (let i = 1; i < taskIds.length; i++) {
      deps.set(taskIds[i], [taskIds[i - 1]])
    }
    return deps
  }

  // ── Helpers ──

  private inferPriority(text: string): TaskPriority {
    if (PRIORITY_KEYWORDS.critical.test(text)) return 'critical'
    if (PRIORITY_KEYWORDS.high.test(text)) return 'high'
    if (PRIORITY_KEYWORDS.low.test(text)) return 'low'
    return 'medium'
  }

  private inferType(text: string): TaskType {
    const lower = text.toLowerCase()
    if (/\b(bug|fix|修复|崩溃|crash|error|异常)\b/.test(lower)) return 'bug'
    if (/\b(test|测试|spec|assert)\b/.test(lower)) return 'test'
    if (/\b(refactor|重构|优化|clean|cleanup)\b/.test(lower)) return 'refactor'
    if (/\b(doc|文档|注释|comment|readme)\b/.test(lower)) return 'documentation'
    return 'feature'
  }

  private deduplicateInferences(items: TaskInference[]): TaskInference[] {
    const seen = new Set<string>()
    return items.filter(item => {
      const key = item.task.title.toLowerCase().substring(0, 40)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
}

export const taskInferenceEngine = new TaskInferenceEngine()
