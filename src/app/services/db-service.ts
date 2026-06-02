/**
 * @file db-service.ts
 * @description YYC³便携式智能AI系统 - 数据库服务层
 * Database Service Layer
 * Connection management, schema browsing, query execution,
 * and backup/restore operations for local database engines.
 * Supports both simulated mode and real database connections via SQL.js, WebSocket, and HTTP.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-19
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,database,sql,connection
 */

import type {
  DBConnectionProfile,
  DBConnectionStatus,
  DBTableInfo,
  DBColumnInfo,
  DBQueryResult,
} from '../types';

import { realDBService } from './db-connection-service';
import { storageService } from './storage-service';

export interface DetectedEngine {
  type: 'postgresql' | 'mysql' | 'redis' | 'sqlite';
  version: string;
  defaultPort: number;
  status: 'running' | 'stopped' | 'unknown';
}

const SIMULATED_ENGINES: DetectedEngine[] = [
  { type: 'postgresql', version: '16.2', defaultPort: 5432, status: 'running' },
  { type: 'mysql', version: '8.4.0', defaultPort: 3306, status: 'stopped' },
  { type: 'redis', version: '7.2.4', defaultPort: 6379, status: 'running' },
  { type: 'sqlite', version: '3.45.0', defaultPort: 0, status: 'running' },
];

const SIMULATED_SCHEMAS = ['public', 'information_schema', 'pg_catalog'];

const SIMULATED_TABLES: DBTableInfo[] = [
  {
    name: 'users',
    schema: 'public',
    rowCount: 1250,
    columns: [
      { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
      { name: 'email', type: 'varchar(255)', nullable: false, primaryKey: false },
      { name: 'name', type: 'varchar(100)', nullable: true, primaryKey: false },
      {
        name: 'created_at',
        type: 'timestamp',
        nullable: false,
        primaryKey: false,
        defaultValue: 'now()',
      },
      {
        name: 'role',
        type: 'varchar(20)',
        nullable: false,
        primaryKey: false,
        defaultValue: "'user'",
      },
    ],
  },
  {
    name: 'projects',
    schema: 'public',
    rowCount: 342,
    columns: [
      { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
      { name: 'name', type: 'varchar(200)', nullable: false, primaryKey: false },
      { name: 'owner_id', type: 'uuid', nullable: false, primaryKey: false },
      {
        name: 'created_at',
        type: 'timestamp',
        nullable: false,
        primaryKey: false,
        defaultValue: 'now()',
      },
      { name: 'updated_at', type: 'timestamp', nullable: true, primaryKey: false },
      {
        name: 'status',
        type: 'varchar(20)',
        nullable: false,
        primaryKey: false,
        defaultValue: "'active'",
      },
    ],
  },
  {
    name: 'files',
    schema: 'public',
    rowCount: 8420,
    columns: [
      { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
      { name: 'project_id', type: 'uuid', nullable: false, primaryKey: false },
      { name: 'path', type: 'text', nullable: false, primaryKey: false },
      { name: 'content', type: 'text', nullable: true, primaryKey: false },
      { name: 'size', type: 'integer', nullable: false, primaryKey: false, defaultValue: '0' },
      { name: 'mime_type', type: 'varchar(100)', nullable: true, primaryKey: false },
      {
        name: 'created_at',
        type: 'timestamp',
        nullable: false,
        primaryKey: false,
        defaultValue: 'now()',
      },
    ],
  },
  {
    name: 'ai_sessions',
    schema: 'public',
    rowCount: 5670,
    columns: [
      { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
      { name: 'user_id', type: 'uuid', nullable: false, primaryKey: false },
      { name: 'provider', type: 'varchar(50)', nullable: false, primaryKey: false },
      { name: 'model', type: 'varchar(100)', nullable: false, primaryKey: false },
      {
        name: 'input_tokens',
        type: 'integer',
        nullable: false,
        primaryKey: false,
        defaultValue: '0',
      },
      {
        name: 'output_tokens',
        type: 'integer',
        nullable: false,
        primaryKey: false,
        defaultValue: '0',
      },
      {
        name: 'cost',
        type: 'decimal(10,6)',
        nullable: false,
        primaryKey: false,
        defaultValue: '0',
      },
      {
        name: 'created_at',
        type: 'timestamp',
        nullable: false,
        primaryKey: false,
        defaultValue: 'now()',
      },
    ],
  },
];

// ── DB Service ──

/**
 * Local-First 数据库三种模式
 * - simulated: 演示模式（mock数据，默认）
 * - sqljs-local: 浏览器内 SQLite (sql.js + WASM, 100% 本地)
 * - websocket-bridge: 用户自部署的桥接服务（可选）
 *
 * 注意：原 HTTPAdapter 已移除（指向不存在的 /api/db 端点）
 */
export type DBMode = 'simulated' | 'sqljs-local' | 'websocket-bridge';

export class DBService {
  private connections = new Map<string, DBConnectionStatus>();
  private queryHistory: { sql: string; timestamp: number; duration: number; rowCount: number }[] =
    [];
  private useRealConnection = false;

  /**
   * 获取当前数据库工作模式
   */
  getMode(): DBMode {
    if (!this.useRealConnection) return 'simulated';
    return 'sqljs-local';
  }

  /**
   * 是否处于模拟模式（演示数据）
   */
  isSimulated(): boolean {
    return !this.useRealConnection;
  }

  enableRealConnection(enabled: boolean = true): void {
    this.useRealConnection = enabled;
  }

  isRealConnectionEnabled(): boolean {
    return this.useRealConnection;
  }

  // ── Engine Detection ──

  async detectEngines(): Promise<DetectedEngine[]> {
    if (this.useRealConnection) {
      const engines: DetectedEngine[] = [
        { type: 'sqlite', version: '3.45.0 (SQL.js)', defaultPort: 0, status: 'running' },
      ];
      return engines;
    }
    await new Promise((r) => setTimeout(r, 500));
    return SIMULATED_ENGINES;
  }

  // ── Connection Management ──

  async getProfiles(): Promise<DBConnectionProfile[]> {
    return storageService.getDBProfiles();
  }

  async saveProfile(profile: DBConnectionProfile): Promise<void> {
    await storageService.saveDBProfile(profile);
  }

  async deleteProfile(id: string): Promise<void> {
    await storageService.deleteDBProfile(id);
    this.connections.delete(id);
    if (this.useRealConnection) {
      await realDBService.disconnect(id);
    }
  }

  async testConnection(profile: DBConnectionProfile): Promise<DBConnectionStatus> {
    if (this.useRealConnection) {
      const status = await realDBService.connect(profile);
      this.connections.set(profile.id, status);
      return status;
    }

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
    const success = profile.host === 'localhost' || profile.host === '127.0.0.1';
    const status: DBConnectionStatus = {
      connected: success,
      lastConnected: success ? Date.now() : undefined,
      lastError: success ? undefined : `Connection refused: ${profile.host}:${profile.port}`,
      poolSize: success ? (profile.pool?.max ?? 10) : 0,
      activeConnections: success ? Math.floor(Math.random() * 3) : 0,
      idleConnections: success ? Math.floor(Math.random() * 5) + 1 : 0,
    };
    this.connections.set(profile.id, status);
    return status;
  }

  async connect(profile: DBConnectionProfile): Promise<DBConnectionStatus> {
    return this.testConnection(profile);
  }

  async disconnect(profileId: string): Promise<void> {
    if (this.useRealConnection) {
      await realDBService.disconnect(profileId);
    }
    this.connections.delete(profileId);
  }

  getConnectionStatus(profileId: string): DBConnectionStatus | undefined {
    if (this.useRealConnection) {
      return realDBService.getConnectionStatus(profileId);
    }
    return this.connections.get(profileId);
  }

  isConnected(profileId: string): boolean {
    if (this.useRealConnection) {
      return realDBService.isConnected(profileId);
    }
    return this.connections.get(profileId)?.connected ?? false;
  }

  // ── Schema Browsing ──

  async listSchemas(connId: string): Promise<string[]> {
    if (this.useRealConnection && this.isConnected(connId)) {
      return realDBService.listSchemas(connId);
    }
    await new Promise((r) => setTimeout(r, 200));
    return SIMULATED_SCHEMAS;
  }

  async listTables(connId: string, schema: string): Promise<DBTableInfo[]> {
    if (this.useRealConnection && this.isConnected(connId)) {
      return realDBService.listTables(connId, schema);
    }
    await new Promise((r) => setTimeout(r, 300));
    return schema === 'public' ? SIMULATED_TABLES : [];
  }

  async getTableColumns(
    connId: string,
    schema: string,
    tableName: string
  ): Promise<DBColumnInfo[]> {
    if (this.useRealConnection && this.isConnected(connId)) {
      return realDBService.getTableColumns(connId, schema, tableName);
    }
    await new Promise((r) => setTimeout(r, 150));
    const table = SIMULATED_TABLES.find((t) => t.name === tableName);
    return table?.columns ?? [];
  }

  // ── Query Execution ──

  async executeQuery(
    connId: string,
    sql: string,
    options?: { limit?: number; offset?: number }
  ): Promise<DBQueryResult> {
    if (this.useRealConnection && this.isConnected(connId)) {
      try {
        const result = await realDBService.execute(connId, sql, options);
        this.queryHistory.push({
          sql,
          timestamp: Date.now(),
          duration: result.duration,
          rowCount: result.rowCount,
        });
        if (this.queryHistory.length > 100) this.queryHistory = this.queryHistory.slice(-100);
        return result;
      } catch (error) {
        throw new Error(
          `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    const start = Date.now();
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));

    const limit = options?.limit ?? 50;
    const sqlLower = sql.trim().toLowerCase();

    let result: DBQueryResult;

    if (sqlLower.startsWith('select')) {
      const tableName = this.extractTableName(sql);
      const table = SIMULATED_TABLES.find((t) => t.name === tableName);
      const columns = table?.columns.map((c) => c.name) ?? ['result'];
      const rows = Array.from({ length: Math.min(limit, table?.rowCount ?? 10) }, (_, i) =>
        Object.fromEntries(columns.map((col) => [col, this.generateValue(col, i)]))
      );
      result = { columns, rows, rowCount: rows.length, duration: Date.now() - start };
    } else if (
      sqlLower.startsWith('insert') ||
      sqlLower.startsWith('update') ||
      sqlLower.startsWith('delete')
    ) {
      const affected = Math.floor(Math.random() * 10) + 1;
      result = {
        columns: ['affected_rows'],
        rows: [{ affected_rows: affected }],
        rowCount: affected,
        duration: Date.now() - start,
      };
    } else {
      result = {
        columns: ['result'],
        rows: [{ result: 'Query executed successfully' }],
        rowCount: 1,
        duration: Date.now() - start,
      };
    }

    this.queryHistory.push({
      sql,
      timestamp: Date.now(),
      duration: result.duration,
      rowCount: result.rowCount,
    });
    if (this.queryHistory.length > 100) this.queryHistory = this.queryHistory.slice(-100);

    return result;
  }

  getQueryHistory() {
    return [...this.queryHistory];
  }

  // ── Backup / Restore ──

  async dumpDatabase(
    connId: string,
    _destPath: string
  ): Promise<{ size: number; duration: number }> {
    if (this.useRealConnection && this.isConnected(connId)) {
      const start = Date.now();
      const data = await realDBService.exportDatabase(connId);
      if (data) {
        return { size: data.length, duration: Date.now() - start };
      }
    }
    await new Promise((r) => setTimeout(r, 2000));
    return {
      size: Math.floor(Math.random() * 50000000) + 1000000,
      duration: 1800 + Math.random() * 500,
    };
  }

  async restoreDatabase(
    connId: string,
    dumpFile: Uint8Array
  ): Promise<{ tablesRestored: number; duration: number }> {
    if (this.useRealConnection && this.isConnected(connId)) {
      const start = Date.now();
      await realDBService.importDatabase(connId, dumpFile);
      return { tablesRestored: 0, duration: Date.now() - start };
    }
    await new Promise((r) => setTimeout(r, 3000));
    return { tablesRestored: SIMULATED_TABLES.length, duration: 2500 + Math.random() * 1000 };
  }

  async exportToUint8Array(connId: string): Promise<Uint8Array | null> {
    if (this.useRealConnection && this.isConnected(connId)) {
      return realDBService.exportDatabase(connId);
    }
    return null;
  }

  async importFromUint8Array(connId: string, data: Uint8Array): Promise<void> {
    if (this.useRealConnection) {
      await realDBService.importDatabase(connId, data);
    }
  }

  // ── Helpers ──

  private extractTableName(sql: string): string {
    const match =
      sql.match(/from\s+(\w+)/i) || sql.match(/into\s+(\w+)/i) || sql.match(/update\s+(\w+)/i);
    return match?.[1] ?? 'users';
  }

  private generateValue(col: string, index: number): unknown {
    if (col === 'id') return `${crypto.randomUUID?.() ?? `id-${index}`}`;
    if (col.includes('email')) return `user${index + 1}@example.com`;
    if (col.includes('name')) return ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'][index % 5];
    if (col.includes('role') || col.includes('status'))
      return ['admin', 'user', 'editor', 'viewer', 'active'][index % 5];
    if (col.includes('created') || col.includes('updated'))
      return new Date(Date.now() - index * 86400000).toISOString();
    if (col.includes('token') || col.includes('size') || col.includes('cost'))
      return Math.floor(Math.random() * 10000);
    if (col.includes('path')) return `/src/app/components/file${index}.tsx`;
    if (col.includes('content')) return `// File content ${index}`;
    if (col.includes('provider')) return ['openai', 'anthropic', 'zhipuai', 'deepseek'][index % 4];
    if (col.includes('model'))
      return ['gpt-4o', 'claude-sonnet-4', 'glm-5', 'deepseek-v3'][index % 4];
    if (col.includes('mime')) return 'text/typescript';
    return `value_${index}`;
  }
}

// ── Singleton ──
export const dbService = new DBService();
