/**
 * @file ai-simulator.ts
 * @description YYC³便携式智能AI系统 - AI响应模拟器
 * AI Response Simulator
 * Simulates streaming AI responses for demonstration
 * i18n-aware: accepts language parameter to return localized responses
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,ai,simulator,demo
 */

import type { Language } from './i18n'
import { getI18n } from './i18n'

function getResponseForInput(input: string, lang: Language): string {
  const i = getI18n(lang)
  const lower = input.toLowerCase()
  if (lower.includes('代码') || lower.includes('code') || lower.includes('/code'))
    return i.simCode
  if (lower.includes('架构') || lower.includes('arch') || lower.includes('/arch'))
    return i.simArchitecture
  if (lower.includes('帮助') || lower.includes('help') || lower.includes('/help'))
    return i.simHelp
  return i.simDefault
}

export async function simulateStreamResponse(
  input: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  lang: Language = 'zh'
): Promise<void> {
  const fullResponse = getResponseForInput(input, lang)
  const chars = [...fullResponse]
  let index = 0

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (index < chars.length) {
        const chunkSize = Math.floor(Math.random() * 3) + 1
        const chunk = chars.slice(index, index + chunkSize).join('')
        onChunk(chunk)
        index += chunkSize
      } else {
        clearInterval(interval)
        onComplete()
        resolve()
      }
    }, 20)
  })
}
