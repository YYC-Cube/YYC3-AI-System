---
file: YYC3-P1-前端-实时预览.md
description: 实时预览功能设计
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p1,frontend,preview,real-time
---

# YYC³ P1-前端-实时预览

## 组件: PreviewContainer -> PreviewToolbar + DeviceSelector + PreviewFrame + PreviewError + PreviewLoading

## usePreviewStore

- content, device (desktop/tablet/mobile/custom), customDevice, isFullscreen
- autoRefresh (true), autoRefreshInterval (1000ms)
- Actions: setContent, setDevice, toggleFullscreen, toggleAutoRefresh, refresh

## Devices

- Desktop: 1920x1080, 1366x768
- Tablet: iPad Pro 1024x768, iPad Mini 768x1024
- Mobile: iPhone 14 Pro 393x852, iPhone SE 375x667, Galaxy S21 360x800

## PreviewFrame (iframe)

- sandbox="allow-scripts allow-same-origin"
- 通过 contentDocument.write() 注入 HTML
- 自动刷新间隔: 500ms / 1s / 2s / 5s 可选
