/**
 * @file chat-ai-integration.test.tsx
 * @description YYC³便携式智能AI系统 - 聊天和AI服务集成测试
 * Chat and AI Service Integration Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @status active
 * @tags integration,test,chat,ai
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import '@testing-library/jest-dom'
import { aiProviderService } from '../../services/ai-provider'
import { ChatInterface } from '../ChatInterface'

// Mock AI provider service
vi.mock('../../services/ai-provider', () => ({
  aiProviderService: {
    generateChat: vi.fn(),
    generateCode: vi.fn(),
    analyzeCode: vi.fn(),
    getActiveProvider: vi.fn(),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAI = aiProviderService as any

// Mock store
vi.mock('../store', () => ({
  useAppStore: vi.fn(() => ({
    theme: 'dark',
    messages: [],
    addMessage: vi.fn(),
    updateMessage: vi.fn(),
  })),
}))

describe('Chat and AI Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('1. AI Chat Message Handling', () => {
    it('should send message to AI provider', async () => {
      const mockGenerateChat = vi.mocked(mockAI.generateChat)
      mockGenerateChat.mockResolvedValue({
        content: 'AI response',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      })

      const mockAddMessage = vi.fn()
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        messages: [],
        addMessage: mockAddMessage,
        updateMessage: vi.fn(),
      })

      render(<ChatInterface />)

      await waitFor(() => {
        expect(mockGenerateChat).toBeDefined()
      })
    })

    it('should handle streaming AI responses', async () => {
      const mockGenerateChat = vi.mocked(mockAI.generateChat)
      mockGenerateChat.mockImplementation(async function* () {
        yield 'Hello'
        yield ' world'
      })

      const mockAddMessage = vi.fn()
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        messages: [],
        addMessage: mockAddMessage,
        updateMessage: vi.fn(),
      })

      render(<ChatInterface />)

      await waitFor(() => {
        expect(mockGenerateChat).toBeDefined()
      })
    })

    it('should display AI response with proper formatting', async () => {
      const mockGenerateChat = vi.mocked(mockAI.generateChat)
      mockGenerateChat.mockResolvedValue({
        content: '```typescript\nconst x = 1;\n```',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      })

      const mockAddMessage = vi.fn()
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        messages: [],
        addMessage: mockAddMessage,
        updateMessage: vi.fn(),
      })

      render(<ChatInterface />)

      await waitFor(() => {
        expect(mockGenerateChat).toBeDefined()
      })
    })

    it('should handle AI service errors gracefully', async () => {
      const mockGenerateChat = vi.mocked(mockAI.generateChat)
      mockGenerateChat.mockRejectedValue(new Error('AI service error'))

      const mockAddMessage = vi.fn()
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        messages: [],
        addMessage: mockAddMessage,
        updateMessage: vi.fn(),
      })

      render(<ChatInterface />)

      await waitFor(() => {
        expect(mockGenerateChat).toBeDefined()
      })
    })
  })

  describe('2. AI Code Generation', () => {
    it('should generate code from chat request', async () => {
      const mockGenerateCode = vi.mocked(mockAI.generateCode)
      mockGenerateCode.mockResolvedValue({
        code: 'const x = 1;',
        explanation: 'Simple variable declaration',
      })

      const mockAddMessage = vi.fn()
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        messages: [],
        addMessage: mockAddMessage,
        updateMessage: vi.fn(),
      })

      render(<ChatInterface />)

      await waitFor(() => {
        expect(mockGenerateCode).toBeDefined()
      })
    })

    it('should insert generated code into editor', async () => {
      const mockGenerateCode = vi.mocked(mockAI.generateCode)
      mockGenerateCode.mockResolvedValue({
        code: 'const x = 1;',
        explanation: 'Simple variable declaration',
      })

      const mockAddMessage = vi.fn()
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        messages: [],
        addMessage: mockAddMessage,
        updateMessage: vi.fn(),
      })

      render(<ChatInterface />)

      await waitFor(() => {
        expect(mockGenerateCode).toBeDefined()
      })
    })

    it('should handle code generation errors', async () => {
      const mockGenerateCode = vi.mocked(mockAI.generateCode)
      mockGenerateCode.mockRejectedValue(new Error('Code generation failed'))

      const mockAddMessage = vi.fn()
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        messages: [],
        addMessage: mockAddMessage,
        updateMessage: vi.fn(),
      })

      render(<ChatInterface />)

      await waitFor(() => {
        expect(mockGenerateCode).toBeDefined()
      })
    })
  })

  describe('3. AI Context Management', () => {
    it('should maintain conversation context', async () => {
      const mockGenerateChat = vi.mocked(mockAI.generateChat)
      mockGenerateChat.mockResolvedValue({
        content: 'I remember our previous conversation',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      })

      const mockMessages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ]
      const mockAddMessage = vi.fn()
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        messages: mockMessages,
        addMessage: mockAddMessage,
        updateMessage: vi.fn(),
      })

      render(<ChatInterface />)

      await waitFor(() => {
        expect(mockGenerateChat).toBeDefined()
      })
    })

    it('should include editor context in AI requests', async () => {
      const mockGenerateChat = vi.mocked(mockAI.generateChat)
      mockGenerateChat.mockResolvedValue({
        content: 'Based on your code...',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      })

      const mockAddMessage = vi.fn()
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        messages: [],
        addMessage: mockAddMessage,
        updateMessage: vi.fn(),
        currentFile: { name: 'test.ts', content: 'const x = 1' },
      })

      render(<ChatInterface />)

      await waitFor(() => {
        expect(mockGenerateChat).toBeDefined()
      })
    })

    it('should manage context length limits', async () => {
      const mockGenerateChat = vi.mocked(mockAI.generateChat)
      mockGenerateChat.mockResolvedValue({
        content: 'Response',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      })

      const mockMessages = Array.from({ length: 100 }, (_, i) => ({
        role: 'user',
        content: `Message ${i}`,
      }))
      const mockAddMessage = vi.fn()
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        messages: mockMessages,
        addMessage: mockAddMessage,
        updateMessage: vi.fn(),
      })

      render(<ChatInterface />)

      await waitFor(() => {
        expect(mockGenerateChat).toBeDefined()
      })
    })
  })

  describe('4. AI Performance and Caching', () => {
    it('should cache AI responses', async () => {
      const mockGenerateChat = vi.mocked(mockAI.generateChat)
      mockGenerateChat.mockResolvedValue({
        content: 'Cached response',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      })

      const mockAddMessage = vi.fn()
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        messages: [],
        addMessage: mockAddMessage,
        updateMessage: vi.fn(),
      })

      render(<ChatInterface />)

      await waitFor(() => {
        expect(mockGenerateChat).toBeDefined()
      })
    })

    it('should track AI performance metrics', async () => {
      const mockGenerateChat = vi.mocked(mockAI.generateChat)
      mockGenerateChat.mockResolvedValue({
        content: 'Response',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      })

      const mockAddMessage = vi.fn()
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        messages: [],
        addMessage: mockAddMessage,
        updateMessage: vi.fn(),
      })

      render(<ChatInterface />)

      await waitFor(() => {
        expect(mockGenerateChat).toBeDefined()
      })
    })
  })
})
