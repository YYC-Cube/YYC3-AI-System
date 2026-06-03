/**
 * file: i18n-data.ts
 * description: 国际化数据入口 — 按语言拆分，聚合导出
 * author: YanYuCloudCube Team
 * version: v2.0.0
 * created: 2026-03-19
 * updated: 2026-06-03
 * status: stable
 * tags: [i18n],[data],[translations]
 *
 * brief: 多语言翻译数据聚合，支持中/英/日/韩四语言
 *
 * details:
 * - 中文翻译 → i18n-zh.ts (2130 行)
 * - 英文翻译 → i18n-en.ts (2125 行)
 * - 日文翻译 → i18n-ja.ts (覆盖英文)
 * - 韩文翻译 → i18n-ko.ts (覆盖英文)
 * - getI18n 函数导出
 *
 * dependencies: TypeScript
 * exports: zh, en, getI18n
 * notes: 拆分自 4306 行单体文件，按语言独立维护
 */

import { en } from './i18n-en';
import { jaOverrides } from './i18n-ja';
import { koOverrides } from './i18n-ko';
import type { I18nStrings, Language } from './i18n-types';
import { zh } from './i18n-zh';

export { en, zh };

let _ja: I18nStrings | null = null;
let _ko: I18nStrings | null = null;

export function getI18n(lang: Language): I18nStrings {
  switch (lang) {
    case 'zh':
      return zh;
    case 'ja':
      if (!_ja) {
        _ja = { ...en, ...jaOverrides } as I18nStrings;
      }
      return _ja;
    case 'ko':
      if (!_ko) {
        _ko = { ...en, ...koOverrides } as I18nStrings;
      }
      return _ko;
    default:
      return en;
  }
}
