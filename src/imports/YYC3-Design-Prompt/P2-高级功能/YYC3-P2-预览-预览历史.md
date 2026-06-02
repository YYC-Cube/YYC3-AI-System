---
file: YYC3-P2-预览-预览历史.md
description: 预览历史和版本管理
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p2,preview,history
---

# YYC³ P2-预览-预览历史

## 核心类型

### PreviewSnapshot
```typescript
interface PreviewSnapshot {
  id: string; name: string; description?: string; content: string;
  createdAt: number; createdBy: string; tags: string[];
  metadata: SnapshotMetadata; size: number; isAuto: boolean;
}
interface SnapshotMetadata {
  filePath?: string; deviceConfig?: DeviceConfig;
  browserInfo?: BrowserInfo; performanceMetrics?: PerformanceMetrics;
  screenshot?: string;
}
```

### SnapshotManager
- createSnapshot(name, content, options): 自动生成 ID, 记录大小
- getAllSnapshots: 按 createdAt 倒序
- getSnapshotsByTag/searchSnapshots
- startAutoSnapshot(interval=60s, getContent): 定时自动快照
- cleanupAutoSnapshots: 保留最近 maxAutoSnapshots(50) 个

### VersionComparator
- compareSnapshots(s1, s2): ContentDiff + MetadataDiff + summary
- LCS 算法计算 diff (add/remove/modify)
- Levenshtein 距离计算相似度 (0~1)

### RollbackManager
- rollbackToSnapshot(id, options): 回滚到指定快照
- getRollbackHistory: 回滚记录列表
- undoRollback(rollbackId): 撤销回滚

### UI 组件
- VersionTimeline: 按日期分组, 搜索过滤, 标签过滤
- DiffViewer: split/unified 视图, 显示空白字符, 相似度百分比

### HistoryExporter
- exportSnapshotAsJSON / exportAllSnapshots
- exportAsHTMLReport: 生成完整 HTML 报告 (快照列表 + 对比结果)
- exportAsPDF: html2pdf
