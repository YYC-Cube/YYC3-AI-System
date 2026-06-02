---
file: YYC3-P2-数据库-连接管理.md
description: 数据库连接管理功能 (PostgreSQL/MySQL/MongoDB)
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p2,database,connection,management
---

# YYC³ P2-数据库-连接管理

## 功能目标

1. 多数据库支持 (PostgreSQL/MySQL/MongoDB)
2. 连接池管理 (min/max/acquireTimeout/idleTimeout)
3. 连接监控 (5s 间隔健康检查)
4. 自动重连
5. 连接安全 (SSL/TLS)

## ConnectionManager

```typescript
interface ConnectionConfig {
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pool?: { min: number; max: number; acquireTimeout: number; idleTimeout: number };
}
interface ConnectionStatus {
  connected: boolean;
  lastConnected?: Date;
  lastError?: string;
  poolSize: number;
  activeConnections: number;
  idleConnections: number;
}
```

- createConnection: 根据 type 创建 pg.Pool / mysql2.createPool / MongoClient
- getConnection / releaseConnection: 连接池获取/释放
- closeConnection: drain + clear pool
- getConnectionStatus: 尝试 acquire 测试连接
- startMonitoring: 5s 间隔健康检查

## DatabaseProvider

- connect/disconnect/getStatus
- query(config, sql, params): 获取连接 -> execute -> 释放
- transaction(config, callback): beginTransaction -> callback -> commit/rollback

## QueryBuilder (链式调用)

- select(fields).from(table).where(condition, param).join(table, on, type)
- orderBy(column, direction).groupBy(column).limit(count).offset(count)
- build(): { sql: string; params: any[] }
