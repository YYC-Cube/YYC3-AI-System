---
file: YYC3-P2-高级-文档编辑器.md
description: 高级文档编辑器 (TipTap + Monaco + Markdown)
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p2,advanced,editor,markdown,code-highlight
---

# YYC³ P2-高级-文档编辑器

## 技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| TipTap | 2.1.12 | 富文本编辑器 |
| ProseMirror | 1.32.1 | 编辑器核心 |
| Monaco Editor | 0.45.0 | 代码编辑器 |
| React-Markdown | 9.0.1 | Markdown 渲染 |
| Prism.js | 1.29.0 | 代码高亮 |
| Yjs | 13.6.10 | 实时协作 |

## 架构分层
```
UI层 (工具栏/状态栏) -> 编辑器层 (TipTap/Monaco/Markdown) -> 协作层 (Yjs CRDT) -> 存储层 (IndexedDB/版本历史)
```

## TipTapEditor 组件
- 扩展: StarterKit, Placeholder, Image, Link, Table (可调整大小), CodeBlockLowlight, Collaboration(Yjs)
- editorProps.attributes.class: prose 样式
- Ctrl+S 快捷键保存

## EditorToolbar 组件
- 文本格式: Bold/Italic/Strike/Code
- 标题: H1/H2/H3
- 列表: 无序/有序/任务
- 对齐: 左/中/右
- 插入: 链接/图片/表格/代码块
- 表格操作: 添加/删除列行
- 撤销/重做

## MonacoEditor 组件
- Ctrl+S 快捷键, 2s 自动保存
- minimap, lineNumbers, automaticLayout, wordWrap

## MarkdownEditor 组件
- 分屏: 左侧 textarea + 右侧 ReactMarkdown 预览
- remarkGfm + remarkMath + rehypeKatex
- SyntaxHighlighter (vscDarkPlus 主题)

## CollaborativeEditor 组件
- Y.Doc + WebsocketProvider 连接
- awareness 用户计数
- 离线降级为本地编辑

## VersionHistory 组件
- 从 storageService 加载版本列表
- 恢复指定版本

## SearchReplace 组件
- 搜索/替换/全部替换
- 区分大小写 + 正则表达式选项

## 样式: Liquid Glass 毛玻璃风格
- backdrop-filter: blur(10px)
- background: rgba(0,0,0,0.3)
- border: 1px solid rgba(255,255,255,0.1)
- .toolbar-button.active: rgba(102,126,234,0.3)
