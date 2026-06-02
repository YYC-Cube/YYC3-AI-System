---
file: YYC3-P3-国际化-多语言支持.md
description: 四语国际化支持 (zh-CN/en-US/ja-JP/ko-KR)
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p3,i18n,multilingual
---

# YYC³ P3-国际化-多语言支持

## 语言支持
| 语言 | 代码 | 状态 |
|------|------|------|
| 简体中文 | zh-CN | 主语言 (完整) |
| English | en-US | 完整翻译 |
| 日本語 | ja-JP | Partial 覆盖 |
| 한국어 | ko-KR | Partial 覆盖 |

## 架构
```
i18n.ts          - I18nStrings 接口定义 + useI18n hook + LangCode 类型
i18n-data.ts     - zh-CN + en-US 完整数据
i18n-ja.ts       - Partial<I18nStrings> 日语覆盖
i18n-ko.ts       - Partial<I18nStrings> 韩语覆盖
```

## 核心接口
```typescript
type LangCode = 'zh' | 'en' | 'ja' | 'ko';
interface I18nStrings {
  // 导航
  nav_home: string; nav_editor: string; nav_preview: string;
  nav_terminal: string; nav_settings: string; nav_ai: string;
  // 编辑器
  editor_save: string; editor_undo: string; editor_redo: string;
  editor_search: string; editor_replace: string;
  // AI
  ai_chat: string; ai_generate: string; ai_optimize: string;
  // 面板
  panel_add: string; panel_remove: string; panel_split: string;
  // 协作
  collab_users: string; collab_sync: string; collab_offline: string;
  // 数据库
  db_connect: string; db_query: string; db_backup: string;
  // 设置
  settings_theme: string; settings_language: string; settings_keybindings: string;
  // ... (所有 UI 文本键)
}
```

## useI18n Hook
```typescript
function useI18n() {
  const lang = useStore(s => s.language);
  const t = (key: keyof I18nStrings): string => {
    return translations[lang][key] ?? translations['zh'][key] ?? key;
  };
  return { t, lang, setLang };
}
```

## 规范
- 新增面板/功能时同步添加 i18n 键
- ja/ko 导出 Partial<I18nStrings>, 缺失键自动 fallback 到 zh
- 数字/日期格式使用 Intl API
- RTL 布局预留
