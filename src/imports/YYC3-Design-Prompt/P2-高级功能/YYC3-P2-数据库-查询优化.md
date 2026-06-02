---
file: YYC3-P2-数据库-查询优化.md
description: 数据库查询优化策略和实现
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p2,database,query,optimization
---

# YYC³ P2-数据库-查询优化

## 功能目标

1. 索引优化: 创建/删除/重建/推荐索引
2. 查询缓存: LRU Cache (ttl=60s, maxSize=1000)
3. 查询分析: EXPLAIN ANALYZE 解析
4. 慢查询监控: threshold=1000ms, maxQueries=100
5. 批量操作: batchInsert/batchUpdate/batchDelete (batchSize=1000)

## IndexManager

- createIndex(config, {table, columns, unique?, type?}): CREATE INDEX
- dropIndex/reindex/getIndexes/analyzeIndexUsage
- recommendIndexes: 基于 pg_stats 的 n_distinct + correlation 推荐

## QueryCache (LRU)

- generateKey(sql + params JSON)
- get/set/delete/clear/getStats/clearExpired

## QueryAnalyzer

- analyzeQuery(config, sql): EXPLAIN ANALYZE -> 解析执行计划
- 检测: Seq Scan(全表扫描) / Nested Loop / Sort -> 生成优化建议
- 提取 rows/loops 指标

## SlowQueryMonitor

- monitorQuery: 计时执行, 超阈值记录
- getSlowQueries/getSlowQueryStats(total/avg/max/min duration)

## BatchOperation

- batchInsert: 按 batchSize 分批, VALUES 拼接
- batchUpdate: CASE WHEN 批量更新
- batchDelete: WHERE id IN (...) 批量删除
