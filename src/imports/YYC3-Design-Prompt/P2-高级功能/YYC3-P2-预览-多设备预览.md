---
file: YYC3-P2-预览-多设备预览.md
description: 多设备预览系统
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p2,preview,multi-device
---

# YYC³ P2-预览-多设备预览

## 核心功能

### DeviceConfig 类型

```typescript
interface DeviceConfig {
  id: string;
  name: string;
  type: DeviceType; // desktop|laptop|tablet|mobile|custom
  width: number;
  height: number;
  dpr: number;
  userAgent: string;
  icon: string;
  rotatable: boolean;
  orientation: 'portrait' | 'landscape';
}
```

### 预设设备

- Desktop 1920x1080 (dpr:1), Laptop 1366x768
- iPad Pro 1024x1366 (dpr:2), iPhone 14 390x844 (dpr:3), Android 360x800 (dpr:2)

### DeviceManager

- getAllDevices/getDevice/addCustomDevice/removeDevice
- activateDevice/deactivateDevice/getActiveDevices
- rotateDevice: 交换 width/height, 切换 orientation

### PreviewContainer 组件

- iframe (sandbox: allow-scripts allow-same-origin allow-forms allow-popups)
- contentDocument.write(content) 注入
- loading/error 状态, 交互事件捕获转发

### PreviewGrid 组件

- 多设备同时预览, 布局: grid|horizontal|vertical
- 滚轮缩放 (scale 0.1~3)

### DeviceSelector 组件

- 按 type 分组显示, checkbox 多选, 搜索过滤, 全选按钮

### PreviewSyncManager

- WebSocket 连接管理 (每设备一个)
- broadcast: 广播内容更新到所有设备
- 交互同步: 设备间交互事件转发

### PerformanceMonitor

- recordMetric/getMetrics/getAverageMetrics(loadTime/renderTime/interactionTime/memoryUsage)

### ResponsiveBreakpointTest

- 按断点宽度创建 iframe 测试
- detectResponsiveIssues: 检查元素溢出/绝对定位超出/滚动条

### PreviewExporter

- exportScreenshot (html2canvas)
- exportPerformanceReport (JSON)
- exportResponsiveReport (JSON)
