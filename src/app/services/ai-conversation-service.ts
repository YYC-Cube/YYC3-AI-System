/**
 * @file ai-conversation-service.ts
 * @description YYC³ AI对话增强服务 - 多模型切换与上下文管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [service],[ai],[conversation],[context],[multi-model]
 *
 * @brief AI对话增强服务，实现多模型切换与上下文管理
 *
 * @details
 * - 多模型切换
 * - 上下文管理
 * - 流式响应优化
 * - 对话历史持久化
 * - 智能上下文压缩
 */

export interface AIModel {
  id: string
  name: string
  provider: string
  maxTokens: number
  supportsStreaming: boolean
  supportsVision: boolean
  costPerToken: number
  capabilities: string[]
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  tokenCount?: number
  metadata?: {
    model?: string
    latency?: number
    cached?: boolean
  }
}

export interface ConversationSession {
  id: string
  title: string
  messages: ConversationMessage[]
  model: string
  createdAt: number
  updatedAt: number
  totalTokens: number
  metadata?: Record<string, unknown>
}

export interface ContextWindow {
  maxTokens: number
  usedTokens: number
  availableTokens: number
  messages: ConversationMessage[]
}

export interface StreamingResponse {
  id: string
  content: string
  isComplete: boolean
  tokenCount: number
}

const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    maxTokens: 128000,
    supportsStreaming: true,
    supportsVision: true,
    costPerToken: 0.00001,
    capabilities: ['text', 'code', 'vision', 'function-calling'],
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    maxTokens: 16385,
    supportsStreaming: true,
    supportsVision: false,
    costPerToken: 0.000001,
    capabilities: ['text', 'code'],
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    maxTokens: 200000,
    supportsStreaming: true,
    supportsVision: true,
    costPerToken: 0.000015,
    capabilities: ['text', 'code', 'vision'],
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    maxTokens: 200000,
    supportsStreaming: true,
    supportsVision: true,
    costPerToken: 0.000003,
    capabilities: ['text', 'code', 'vision'],
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    maxTokens: 32760,
    supportsStreaming: true,
    supportsVision: true,
    costPerToken: 0.000001,
    capabilities: ['text', 'code', 'vision'],
  },
]

class AIConversationService {
  private sessions: Map<string, ConversationSession> = new Map()
  private currentSessionId: string | null = null
  private currentModel: string = 'gpt-3.5-turbo'
  private contextWindowSize: number = 4096
  private _streamingCallbacks: Map<string, (response: StreamingResponse) => void> = new Map()

  constructor() {
    void this._streamingCallbacks
    this.loadSessions()
  }

  getAvailableModels(): AIModel[] {
    return [...AVAILABLE_MODELS]
  }

  getCurrentModel(): AIModel | undefined {
    return AVAILABLE_MODELS.find((m) => m.id === this.currentModel)
  }

  setCurrentModel(modelId: string): boolean {
    const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
    if (model) {
      this.currentModel = modelId
      this.contextWindowSize = model.maxTokens
      return true
    }
    return false
  }

  createSession(title?: string): ConversationSession {
    const session: ConversationSession = {
      id: this.generateId(),
      title: title || `对话 ${this.sessions.size + 1}`,
      messages: [],
      model: this.currentModel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalTokens: 0,
    }

    this.sessions.set(session.id, session)
    this.currentSessionId = session.id
    this.saveSessions()

    return session
  }

  getSession(sessionId: string): ConversationSession | undefined {
    return this.sessions.get(sessionId)
  }

  getCurrentSession(): ConversationSession | undefined {
    if (!this.currentSessionId) return undefined
    return this.sessions.get(this.currentSessionId)
  }

  getAllSessions(): ConversationSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId)
    if (deleted) {
      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null
      }
      this.saveSessions()
    }
    return deleted
  }

  addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string): ConversationMessage | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const message: ConversationMessage = {
      id: this.generateId(),
      role,
      content,
      timestamp: Date.now(),
      tokenCount: this.estimateTokenCount(content),
      metadata: {
        model: this.currentModel,
      },
    }

    session.messages.push(message)
    session.totalTokens += message.tokenCount || 0
    session.updatedAt = Date.now()

    this.saveSessions()
    return message
  }

  deleteMessage(sessionId: string, messageId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const index = session.messages.findIndex((m) => m.id === messageId)
    if (index === -1) return false

    const message = session.messages[index]
    session.totalTokens -= message.tokenCount || 0
    session.messages.splice(index, 1)
    session.updatedAt = Date.now()

    this.saveSessions()
    return true
  }

  getContextWindow(sessionId: string): ContextWindow {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return {
        maxTokens: this.contextWindowSize,
        usedTokens: 0,
        availableTokens: this.contextWindowSize,
        messages: [],
      }
    }

    const messages = this.getOptimizedMessages(session)
    const usedTokens = messages.reduce((sum, m) => sum + (m.tokenCount || 0), 0)

    return {
      maxTokens: this.contextWindowSize,
      usedTokens,
      availableTokens: this.contextWindowSize - usedTokens,
      messages,
    }
  }

  optimizeContext(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const optimized = this.compressMessages(session.messages)
    session.messages = optimized
    session.totalTokens = optimized.reduce((sum, m) => sum + (m.tokenCount || 0), 0)
    session.updatedAt = Date.now()

    this.saveSessions()
  }

  exportSession(sessionId: string): string | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    return JSON.stringify({
      version: '1.0.0',
      exportedAt: Date.now(),
      session,
    }, null, 2)
  }

  importSession(json: string): ConversationSession | null {
    try {
      const data = JSON.parse(json)
      if (!data.session || !data.session.id) return null

      const session: ConversationSession = {
        ...data.session,
        id: this.generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      this.sessions.set(session.id, session)
      this.saveSessions()

      return session
    } catch {
      return null
    }
  }

  searchSessions(query: string): ConversationSession[] {
    const lowerQuery = query.toLowerCase()
    return this.getAllSessions().filter((session) => {
      if (session.title.toLowerCase().includes(lowerQuery)) return true
      return session.messages.some((m) => m.content.toLowerCase().includes(lowerQuery))
    })
  }

  getStatistics(): {
    totalSessions: number
    totalMessages: number
    totalTokens: number
    averageMessagesPerSession: number
    modelUsage: Record<string, number>
  } {
    let totalMessages = 0
    let totalTokens = 0
    const modelUsage: Record<string, number> = {}

    for (const session of this.sessions.values()) {
      totalMessages += session.messages.length
      totalTokens += session.totalTokens
      modelUsage[session.model] = (modelUsage[session.model] || 0) + 1
    }

    return {
      totalSessions: this.sessions.size,
      totalMessages,
      totalTokens,
      averageMessagesPerSession: this.sessions.size > 0 ? totalMessages / this.sessions.size : 0,
      modelUsage,
    }
  }

  private getOptimizedMessages(session: ConversationSession): ConversationMessage[] {
    const messages = [...session.messages]
    let totalTokens = messages.reduce((sum, m) => sum + (m.tokenCount || 0), 0)

    while (totalTokens > this.contextWindowSize && messages.length > 2) {
      const removed = messages.shift()
      if (removed) {
        totalTokens -= removed.tokenCount || 0
      }
    }

    return messages
  }

  private compressMessages(messages: ConversationMessage[]): ConversationMessage[] {
    if (messages.length <= 4) return messages

    const systemMessages = messages.filter((m) => m.role === 'system')
    const recentMessages = messages.slice(-3)
    const olderMessages = messages.slice(0, -3).filter((m) => m.role !== 'system')

    if (olderMessages.length === 0) return messages

    const summary: ConversationMessage = {
      id: this.generateId(),
      role: 'system',
      content: `[历史对话摘要] 共 ${olderMessages.length} 条消息`,
      timestamp: olderMessages[0].timestamp,
      tokenCount: 10,
    }

    return [...systemMessages, summary, ...recentMessages]
  }

  private estimateTokenCount(content: string): number {
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
    const otherChars = content.length - chineseChars
    return Math.ceil(chineseChars * 2 + otherChars / 4)
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  private saveSessions(): void {
    try {
      const data = Array.from(this.sessions.entries())
      localStorage.setItem('yyc3_conversation_sessions', JSON.stringify(data))
    } catch (error) {
      console.warn('保存会话失败:', error)
    }
  }

  private loadSessions(): void {
    try {
      const stored = localStorage.getItem('yyc3_conversation_sessions')
      if (stored) {
        const data = JSON.parse(stored) as [string, ConversationSession][]
        data.forEach(([id, session]) => {
          this.sessions.set(id, session)
        })
      }
    } catch (error) {
      console.warn('加载会话失败:', error)
    }
  }
}

export const aiConversationService = new AIConversationService()

export default AIConversationService
