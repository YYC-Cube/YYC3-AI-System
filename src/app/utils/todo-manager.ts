/**
 * @file todo-manager.ts
 * @description YYC³便携式智能AI系统 - TODO注释管理工具
 * TODO Comment Management Utility
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,todo,management,code-quality
 */

export interface TodoItem {
  id: string
  file: string
  line: number
  column: number
  type: 'TODO' | 'FIXME' | 'HACK' | 'BUG' | 'XXX' | 'NOTE'
  message: string
  priority: 'high' | 'medium' | 'low'
  author?: string
  date?: string
  status: 'open' | 'in_progress' | 'resolved' | 'wontfix'
}

export interface TodoStats {
  total: number
  byType: Record<string, number>
  byPriority: Record<string, number>
  byStatus: Record<string, number>
  byFile: Record<string, number>
}

const TODO_PATTERNS = {
  TODO: /(?:\/\/|#|\/\*|<!--)\s*TODO\s*[:\-]?\s*(.+?)(?:\*\/|-->|$)/gi,
  FIXME: /(?:\/\/|#|\/\*|<!--)\s*FIXME\s*[:\-]?\s*(.+?)(?:\*\/|-->|$)/gi,
  HACK: /(?:\/\/|#|\/\*|<!--)\s*HACK\s*[:\-]?\s*(.+?)(?:\*\/|-->|$)/gi,
  BUG: /(?:\/\/|#|\/\*|<!--)\s*BUG\s*[:\-]?\s*(.+?)(?:\*\/|-->|$)/gi,
  XXX: /(?:\/\/|#|\/\*|<!--)\s*XXX\s*[:\-]?\s*(.+?)(?:\*\/|-->|$)/gi,
  NOTE: /(?:\/\/|#|\/\*|<!--)\s*NOTE\s*[:\-]?\s*(.+?)(?:\*\/|-->|$)/gi,
}

const PRIORITY_KEYWORDS = {
  high: ['urgent', 'critical', 'important', 'asap', 'high', '紧急', '重要'],
  medium: ['medium', 'normal', 'should', '中'],
  low: ['low', 'nice to have', 'maybe', 'later', '低', '可选'],
}

function detectPriority(message: string): 'high' | 'medium' | 'low' {
  const lowerMessage = message.toLowerCase()
  
  for (const keyword of PRIORITY_KEYWORDS.high) {
    if (lowerMessage.includes(keyword)) return 'high'
  }
  
  for (const keyword of PRIORITY_KEYWORDS.low) {
    if (lowerMessage.includes(keyword)) return 'low'
  }
  
  return 'medium'
}

function extractMetadata(message: string): { author?: string; date?: string; cleanMessage: string } {
  const authorMatch = message.match(/\(@?([^)]+)\)/)
  const dateMatch = message.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/)
  
  const cleanMessage = message
    .replace(/\(@?([^)]+)\)/, '')
    .replace(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/, '')
    .trim()
  
  return {
    author: authorMatch?.[1]?.trim(),
    date: dateMatch?.[1],
    cleanMessage,
  }
}

export function parseTodoComment(
  line: string,
  lineNumber: number,
  filePath: string
): TodoItem | null {
  for (const [type, pattern] of Object.entries(TODO_PATTERNS)) {
    pattern.lastIndex = 0
    const match = pattern.exec(line)
    
    if (match) {
      const rawMessage = match[1]?.trim() || ''
      const { author, date, cleanMessage } = extractMetadata(rawMessage)
      
      return {
        id: `${filePath}:${lineNumber}:${type}`,
        file: filePath,
        line: lineNumber,
        column: match.index,
        type: type as TodoItem['type'],
        message: cleanMessage,
        priority: detectPriority(rawMessage),
        author,
        date,
        status: 'open',
      }
    }
  }
  
  return null
}

export function scanFileForTodos(content: string, filePath: string): TodoItem[] {
  const todos: TodoItem[] = []
  const lines = content.split('\n')
  
  lines.forEach((line, index) => {
    const todo = parseTodoComment(line, index + 1, filePath)
    if (todo) {
      todos.push(todo)
    }
  })
  
  return todos
}

export function calculateStats(todos: TodoItem[]): TodoStats {
  const stats: TodoStats = {
    total: todos.length,
    byType: {},
    byPriority: {},
    byStatus: {},
    byFile: {},
  }
  
  for (const todo of todos) {
    stats.byType[todo.type] = (stats.byType[todo.type] || 0) + 1
    stats.byPriority[todo.priority] = (stats.byPriority[todo.priority] || 0) + 1
    stats.byStatus[todo.status] = (stats.byStatus[todo.status] || 0) + 1
    stats.byFile[todo.file] = (stats.byFile[todo.file] || 0) + 1
  }
  
  return stats
}

export function generateTodoReport(todos: TodoItem[]): string {
  const stats = calculateStats(todos)
  
  let report = '# TODO Report\n\n'
  report += `Generated: ${new Date().toISOString()}\n\n`
  
  report += '## Summary\n\n'
  report += `- Total Items: ${stats.total}\n`
  report += `- By Type: ${Object.entries(stats.byType).map(([k, v]) => `${k}: ${v}`).join(', ')}\n`
  report += `- By Priority: ${Object.entries(stats.byPriority).map(([k, v]) => `${k}: ${v}`).join(', ')}\n`
  report += `- By Status: ${Object.entries(stats.byStatus).map(([k, v]) => `${k}: ${v}`).join(', ')}\n\n`
  
  const groupedByPriority = {
    high: todos.filter(t => t.priority === 'high'),
    medium: todos.filter(t => t.priority === 'medium'),
    low: todos.filter(t => t.priority === 'low'),
  }
  
  for (const [priority, items] of Object.entries(groupedByPriority)) {
    if (items.length === 0) continue
    
    report += `## ${priority.toUpperCase()} Priority (${items.length})\n\n`
    
    for (const item of items) {
      report += `### ${item.type}: ${item.message}\n`
      report += `- File: ${item.file}:${item.line}\n`
      if (item.author) report += `- Author: ${item.author}\n`
      if (item.date) report += `- Date: ${item.date}\n`
      report += `- Status: ${item.status}\n\n`
    }
  }
  
  return report
}

export function formatTodoForDisplay(todo: TodoItem): string {
  const priorityEmoji = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  }
  
  const statusEmoji = {
    open: '⭕',
    in_progress: '🔄',
    resolved: '✅',
    wontfix: '❌',
  }
  
  return `${priorityEmoji[todo.priority]} ${statusEmoji[todo.status]} [${todo.type}] ${todo.message} (${todo.file}:${todo.line})`
}

export function isFunctionalTodo(todo: TodoItem): boolean {
  const functionalPatterns = [
    /extract.*todo/i,
    /todo.*pattern/i,
    /todo.*comment/i,
    /parse.*todo/i,
    /scan.*todo/i,
  ]
  
  return functionalPatterns.some(pattern => pattern.test(todo.message))
}

export function filterActionableTodos(todos: TodoItem[]): TodoItem[] {
  return todos.filter(todo => !isFunctionalTodo(todo))
}

export function sortTodosByPriority(todos: TodoItem[]): TodoItem[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return [...todos].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

export function groupTodosByFile(todos: TodoItem[]): Record<string, TodoItem[]> {
  const grouped: Record<string, TodoItem[]> = {}
  
  for (const todo of todos) {
    if (!grouped[todo.file]) {
      grouped[todo.file] = []
    }
    grouped[todo.file].push(todo)
  }
  
  return grouped
}

export function updateTodoStatus(
  todos: TodoItem[],
  id: string,
  status: TodoItem['status']
): TodoItem[] {
  return todos.map(todo =>
    todo.id === id ? { ...todo, status } : todo
  )
}
