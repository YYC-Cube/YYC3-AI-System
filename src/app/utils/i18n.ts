/**
 * @file i18n.ts
 * @description YYC³便携式智能AI系统 - 国际化系统
 * Supports zh-CN and en-US with runtime switching
 * ALL user-facing strings are centralized here — zero hardcoded strings in components.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-04-04
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags i18n,internationalization,localization
 */

export type { I18nStrings, Language } from './i18n-types'

export { getI18n } from './i18n-data'

import type { Language, I18nStrings } from './i18n-types'

export function nextLanguage(current: Language): Language {
  const order: Language[] = ['zh', 'en', 'ja', 'ko']
  const idx = order.indexOf(current)
  return order[(idx + 1) % order.length]
}

export function resolveKey(i: I18nStrings, key: string): string {
  return (i as unknown as Record<string, string>)[key] ?? key
}
