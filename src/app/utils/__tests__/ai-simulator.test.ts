/**
 * @file ai-simulator.test.ts
 * @description YYC³便携式智能AI系统 - AI响应模拟器测试
 * AI Response Simulator Test
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-04-03
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,utils,ai,simulator,demo
 */

import { describe, test, expect, vi } from 'vitest'

import { simulateStreamResponse } from '../ai-simulator'

describe('AI Simulator - simulateStreamResponse', () => {
  test('should call onChunk with text chunks', async () => {
    const chunks: string[] = []
    const onChunk = vi.fn((chunk: string) => chunks.push(chunk))
    const onComplete = vi.fn()

    await simulateStreamResponse('test', onChunk, onComplete, 'zh')

    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks.join('').length).toBeGreaterThan(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  test('should handle empty input', async () => {
    const chunks: string[] = []
    const onChunk = vi.fn((chunk: string) => chunks.push(chunk))
    const onComplete = vi.fn()

    await simulateStreamResponse('', onChunk, onComplete, 'zh')

    expect(chunks.join('').length).toBeGreaterThan(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  test('should call onComplete after streaming', async () => {
    const chunks: string[] = []
    const onChunk = vi.fn((chunk: string) => chunks.push(chunk))
    const onComplete = vi.fn()

    await simulateStreamResponse('code', onChunk, onComplete, 'zh')

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  test('should return non-empty response', async () => {
    const chunks: string[] = []
    const onChunk = vi.fn((chunk: string) => chunks.push(chunk))
    const onComplete = vi.fn()

    await simulateStreamResponse('help', onChunk, onComplete, 'zh')

    const response = chunks.join('')
    expect(response.length).toBeGreaterThan(0)
    expect(response).toContain('帮助')
  })

  test('should handle Chinese language input', async () => {
    const chunks: string[] = []
    const onChunk = vi.fn((chunk: string) => chunks.push(chunk))
    const onComplete = vi.fn()

    await simulateStreamResponse('代码', onChunk, onComplete, 'zh')

    const response = chunks.join('')
    expect(response.length).toBeGreaterThan(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  test('should handle English language input', async () => {
    const chunks: string[] = []
    const onChunk = vi.fn((chunk: string) => chunks.push(chunk))
    const onComplete = vi.fn()

    await simulateStreamResponse('code', onChunk, onComplete, 'en')

    const response = chunks.join('')
    expect(response.length).toBeGreaterThan(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  test('should handle Japanese language input', async () => {
    const chunks: string[] = []
    const onChunk = vi.fn((chunk: string) => chunks.push(chunk))
    const onComplete = vi.fn()

    await simulateStreamResponse('コード', onChunk, onComplete, 'ja')

    const response = chunks.join('')
    expect(response.length).toBeGreaterThan(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  test('should handle Korean language input', async () => {
    const chunks: string[] = []
    const onChunk = vi.fn((chunk: string) => chunks.push(chunk))
    const onComplete = vi.fn()

    await simulateStreamResponse('코드', onChunk, onComplete, 'ko')

    const response = chunks.join('')
    expect(response.length).toBeGreaterThan(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  test('should generate multiple chunks', async () => {
    const chunks: string[] = []
    const onChunk = vi.fn((chunk: string) => chunks.push(chunk))
    const onComplete = vi.fn()

    await simulateStreamResponse('test', onChunk, onComplete, 'zh')

    expect(chunks.length).toBeGreaterThan(0)
  })
})
