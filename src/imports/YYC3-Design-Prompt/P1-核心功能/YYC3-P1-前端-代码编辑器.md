---
file: YYC3-P1-前端-代码编辑器.md
description: Monaco Editor 集成，多标签页代码编辑器
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p1,frontend,editor,monaco
---

# YYC³ P1-前端-代码编辑器

## 组件架构

- MonacoEditor.tsx (核心编辑器)
- EditorTabs.tsx (标签栏)
- EditorToolbar.tsx (工具栏: Save/SaveAll/Search/Undo/Redo/Settings)
- SearchReplace.tsx (搜索替换面板)
- EditorStatusBar.tsx

## useEditorStore (Zustand)

- files: EditorFile[] (id, name, path, content, language, isDirty, readOnly)
- activeFileId, editorConfig, searchState
- Actions: openFile, closeFile, activateFile, updateFileContent, saveFile, search/replace/replaceAll

## EditorConfig

- fontSize: 14, tabSize: 2, showLineNumbers: true, showMinimap: true
- enableAutocomplete: true, enableSyntaxHighlight: true, enableAutoFormat: true
- theme: 'vs-dark' | 'vs-light' | 'hc-black'

## Monaco 集成要点

- automaticLayout: true, wordWrap: 'on'
- onDidChangeModelContent -> onChange callback
- 动态更新 language/theme/config via useEffect
