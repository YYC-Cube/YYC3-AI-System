/**
 * @file db-connection-service.ts
 * @description YYC³便携式智能AI系统 - 真实数据库连接服务
 * Real Database Connection Service
 * Supports SQL.js (in-browser SQLite), WebSocket proxy, and HTTP API connections
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,database,connection,sqljs,websocket
 */

import type {
  DBConnectionProfile,
  DBConnectionStatus,
  DBTableInfo,
  DBColumnInfo,
  DBQueryResult,
} from '../types';

export type ConnectionType = 'sqljs' | 'websocket' | 'http' | 'indexeddb';

export interface SQLJsDatabase {
  run: (sql: string, params?: unknown[]) => { columns: string[]; values: unknown[][] };
  exec: (sql: string) => { columns: string[]; values: unknown[][] }[];
  close: () => void;
  export: () => Uint8Array;
}

export interface ConnectionAdapter {
  type: ConnectionType;
  connect: (profile: DBConnectionProfile) => Promise<DBConnectionStatus>;
  disconnect: () => Promise<void>;
  isConnected: () => boolean;
  execute: (sql: string, options?: { limit?: number; offset?: number }) => Promise<DBQueryResult>;
  listSchemas?: () => Promise<string[]>;
  listTables?: (schema: string) => Promise<DBTableInfo[]>;
  getTableColumns?: (schema: string, table: string) => Promise<DBColumnInfo[]>;
  close?: () => void;
}

class SQLJsAdapter implements ConnectionAdapter {
  type: ConnectionType = 'sqljs';
  private db: SQLJsDatabase | null = null;
  private SQL: unknown | null = null;

  async init(): Promise<void> {
    if (this.SQL) return;

    try {
      const initSqlJs = (await import('sql.js')).default;
      this.SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });
    } catch (error) {
      console.error('[SQLJsAdapter] Failed to load sql.js:', error);
      throw new Error('Failed to load SQL.js engine. Please check your network connection.');
    }
  }

  async connect(_profile: DBConnectionProfile): Promise<DBConnectionStatus> {
    try {
      await this.init();

      const SQLConstructor = this.SQL as new (data?: ArrayLike<number>) => SQLJsDatabase;
      this.db = new SQLConstructor();

      await this.initializeSchema();

      return {
        connected: true,
        lastConnected: Date.now(),
        poolSize: 1,
        activeConnections: 1,
        idleConnections: 0,
      };
    } catch (error) {
      return {
        connected: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        poolSize: 0,
        activeConnections: 0,
        idleConnections: 0,
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  isConnected(): boolean {
    return this.db !== null;
  }

  async execute(
    sql: string,
    options?: { limit?: number; offset?: number }
  ): Promise<DBQueryResult> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const start = Date.now();
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    try {
      const sqlTrimmed = sql.trim().toLowerCase();

      if (sqlTrimmed.startsWith('select') || sqlTrimmed.startsWith('with')) {
        const limitedSql = sql.replace(/;?\s*$/, ` LIMIT ${limit} OFFSET ${offset}`);
        const result = this.db.exec(limitedSql);

        if (result.length === 0) {
          return { columns: [], rows: [], rowCount: 0, duration: Date.now() - start };
        }

        const { columns, values } = result[0];
        const rows = values.map((row) =>
          Object.fromEntries(columns.map((col, i) => [col, row[i]]))
        );

        return { columns, rows, rowCount: rows.length, duration: Date.now() - start };
      } else {
        this.db.run(sql);
        const changes =
          (this.db as unknown as { getRowsModified: () => number }).getRowsModified?.() ?? 0;

        return {
          columns: ['affected_rows'],
          rows: [{ affected_rows: changes }],
          rowCount: changes,
          duration: Date.now() - start,
        };
      }
    } catch (error) {
      throw new Error(
        `SQL execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  listSchemas = async (): Promise<string[]> => {
    return ['main', 'temp'];
  };

  listTables = async (schema: string): Promise<DBTableInfo[]> => {
    if (!this.db) return [];

    const result = this.db.exec(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    );

    if (result.length === 0) return [];

    const tables: DBTableInfo[] = [];
    for (const row of result[0].values) {
      const tableName = row[0] as string;
      const columns = await this.getTableColumns(schema, tableName);

      const countResult = this.db!.exec(`SELECT COUNT(*) as count FROM "${tableName}"`);
      const rowCount = (countResult[0]?.values[0]?.[0] as number) ?? 0;

      tables.push({
        name: tableName,
        schema,
        rowCount,
        columns,
      });
    }

    return tables;
  };

  getTableColumns = async (_schema: string, tableName: string): Promise<DBColumnInfo[]> => {
    if (!this.db) return [];

    const result = this.db.exec(`PRAGMA table_info("${tableName}")`);

    if (result.length === 0) return [];

    return result[0].values.map((row) => ({
      name: row[1] as string,
      type: row[2] as string,
      nullable: row[3] === 0,
      primaryKey: row[5] === 1,
      defaultValue: row[4] as string | undefined,
    }));
  };

  private async initializeSchema(): Promise<void> {
    if (!this.db) return;

    const createTables = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL,
        owner_id TEXT NOT NULL REFERENCES users(id),
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        project_id TEXT NOT NULL REFERENCES projects(id),
        path TEXT NOT NULL,
        content TEXT,
        size INTEGER DEFAULT 0,
        mime_type TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS ai_sessions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL REFERENCES users(id),
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        cost REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_files_project ON files(project_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON ai_sessions(user_id);
    `;

    this.db.run(createTables);

    const userCount =
      (this.db.exec('SELECT COUNT(*) FROM users')[0]?.values[0]?.[0] as number) ?? 0;
    if (userCount === 0) {
      this.db.run(`
        INSERT INTO users (email, name, role) VALUES
        ('admin@yyc3.ai', '系统管理员', 'admin'),
        ('developer@yyc3.ai', '开发者', 'user'),
        ('viewer@yyc3.ai', '访客', 'viewer');
      `);
    }
  }

  export = (): Uint8Array | null => {
    return this.db?.export() ?? null;
  };

  import = async (data: Uint8Array): Promise<void> => {
    await this.init();
    const SQLConstructor = this.SQL as new (data: ArrayLike<number>) => SQLJsDatabase;
    this.db = new SQLConstructor(data);
  };
}

class WebSocketAdapter implements ConnectionAdapter {
  type: ConnectionType = 'websocket';
  private ws: WebSocket | null = null;
  private messageQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    type: string;
  }> = [];
  private messageId = 0;

  async connect(profile: DBConnectionProfile): Promise<DBConnectionStatus> {
    return new Promise((resolve) => {
      try {
        const wsUrl = profile.host.startsWith('ws')
          ? `${profile.host}:${profile.port}`
          : `ws://${profile.host}:${profile.port}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.sendMessage('auth', {
            database: profile.database,
            username: profile.username,
            password: profile.password,
          })
            .then(() => {
              resolve({
                connected: true,
                lastConnected: Date.now(),
                poolSize: 1,
                activeConnections: 1,
                idleConnections: 0,
              });
            })
            .catch((error) => {
              resolve({
                connected: false,
                lastError: error.message,
                poolSize: 0,
                activeConnections: 0,
                idleConnections: 0,
              });
            });
        };

        this.ws.onerror = () => {
          resolve({
            connected: false,
            lastError: 'WebSocket connection failed',
            poolSize: 0,
            activeConnections: 0,
            idleConnections: 0,
          });
        };

        this.ws.onmessage = (event) => {
          const response = JSON.parse(event.data);
          const pending = this.messageQueue.find((m) => m.type === response.type);
          if (pending) {
            if (response.error) {
              pending.reject(new Error(response.error));
            } else {
              pending.resolve(response.data);
            }
            this.messageQueue = this.messageQueue.filter((m) => m !== pending);
          }
        };
      } catch (error) {
        resolve({
          connected: false,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          poolSize: 0,
          activeConnections: 0,
          idleConnections: 0,
        });
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async execute(
    sql: string,
    options?: { limit?: number; offset?: number }
  ): Promise<DBQueryResult> {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    const start = Date.now();
    const result = (await this.sendMessage('query', { sql, ...options })) as DBQueryResult;
    result.duration = Date.now() - start;
    return result;
  }

  listSchemas = async (): Promise<string[]> => {
    return this.sendMessage('listSchemas', {}) as Promise<string[]>;
  };

  listTables = async (schema: string): Promise<DBTableInfo[]> => {
    return this.sendMessage('listTables', { schema }) as Promise<DBTableInfo[]>;
  };

  getTableColumns = async (schema: string, table: string): Promise<DBColumnInfo[]> => {
    return this.sendMessage('getTableColumns', { schema, table }) as Promise<DBColumnInfo[]>;
  };

  private sendMessage<T>(type: string, data: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = ++this.messageId;
      this.messageQueue.push({
        resolve: resolve as (value: unknown) => void,
        reject,
        type: `${type}_${id}`,
      });

      this.ws.send(JSON.stringify({ id, type, data }));

      setTimeout(() => {
        const pending = this.messageQueue.find((m) => m.type === `${type}_${id}`);
        if (pending) {
          pending.reject(new Error('Request timeout'));
          this.messageQueue = this.messageQueue.filter((m) => m !== pending);
        }
      }, 30000);
    });
  }
}

/**
 * @deprecated HTTPAdapter 已弃用
 *
 * Local-First 哲学下，HTTPAdapter 调用的 /api/db/connect 端点
 * 在标准数据库上不存在，需要用户自部署 YYC3-DB-Bridge 服务。
 *
 * 推荐使用：
 *   - SQLJsAdapter: 浏览器内 SQLite (100% 本地)
 *   - WebSocketAdapter: 用户自部署的桥接服务
 */
class HTTPAdapter implements ConnectionAdapter {
  type: ConnectionType = 'http';
  private baseUrl: string = '';
  private token: string | null = null;

  async connect(profile: DBConnectionProfile): Promise<DBConnectionStatus> {
    this.baseUrl = profile.host.startsWith('http')
      ? `${profile.host}:${profile.port}/api/db`
      : `http://${profile.host}:${profile.port}/api/db`;

    try {
      const response = await fetch(`${this.baseUrl}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database: profile.database,
          username: profile.username,
          password: profile.password,
        }),
      });

      if (!response.ok) {
        return {
          connected: false,
          lastError: `Connection failed: ${response.statusText}`,
          poolSize: 0,
          activeConnections: 0,
          idleConnections: 0,
        };
      }

      const data = await response.json();
      this.token = data.token;

      return {
        connected: true,
        lastConnected: Date.now(),
        poolSize: data.poolSize ?? 10,
        activeConnections: data.activeConnections ?? 0,
        idleConnections: data.idleConnections ?? 10,
      };
    } catch (error) {
      return {
        connected: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        poolSize: 0,
        activeConnections: 0,
        idleConnections: 0,
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.token) {
      try {
        await fetch(`${this.baseUrl}/disconnect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
        });
      } catch {
        // Ignore disconnect errors
      }
      this.token = null;
    }
  }

  isConnected(): boolean {
    return this.token !== null;
  }

  async execute(
    sql: string,
    options?: { limit?: number; offset?: number }
  ): Promise<DBQueryResult> {
    if (!this.token) {
      throw new Error('Not connected to database');
    }

    const start = Date.now();
    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ sql, ...options }),
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }

    const result = await response.json();
    result.duration = Date.now() - start;
    return result;
  }

  listSchemas = async (): Promise<string[]> => {
    if (!this.token) throw new Error('Not connected');

    const response = await fetch(`${this.baseUrl}/schemas`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });

    return response.json();
  };

  listTables = async (schema: string): Promise<DBTableInfo[]> => {
    if (!this.token) throw new Error('Not connected');

    const response = await fetch(`${this.baseUrl}/tables?schema=${schema}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });

    return response.json();
  };

  getTableColumns = async (schema: string, table: string): Promise<DBColumnInfo[]> => {
    if (!this.token) throw new Error('Not connected');

    const response = await fetch(`${this.baseUrl}/columns?schema=${schema}&table=${table}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });

    return response.json();
  };
}

export class RealDBService {
  private adapters = new Map<string, ConnectionAdapter>();
  private connections = new Map<string, DBConnectionStatus>();
  private queryHistory: Array<{
    connId: string;
    sql: string;
    timestamp: number;
    duration: number;
    rowCount: number;
  }> = [];

  getAdapter(profile: DBConnectionProfile): ConnectionAdapter {
    const connectionType = this.detectConnectionType(profile);

    switch (connectionType) {
      case 'sqljs':
        return new SQLJsAdapter();
      case 'websocket':
        return new WebSocketAdapter();
      case 'http':
        return new HTTPAdapter();
      default:
        return new SQLJsAdapter();
    }
  }

  private detectConnectionType(profile: DBConnectionProfile): ConnectionType {
    if (profile.type === 'sqlite' && (!profile.host || profile.host === 'local')) {
      return 'sqljs';
    }

    if (profile.host?.startsWith('ws') || profile.host?.startsWith('wss')) {
      return 'websocket';
    }

    if (profile.host?.startsWith('http') || profile.host?.startsWith('https')) {
      return 'http';
    }

    if (profile.host && profile.host !== 'localhost' && profile.host !== '127.0.0.1') {
      return 'http';
    }

    return 'sqljs';
  }

  async connect(profile: DBConnectionProfile): Promise<DBConnectionStatus> {
    let adapter = this.adapters.get(profile.id);

    if (!adapter || !adapter.isConnected()) {
      adapter = this.getAdapter(profile);
      this.adapters.set(profile.id, adapter);
    }

    const status = await adapter.connect(profile);
    this.connections.set(profile.id, status);

    return status;
  }

  async disconnect(profileId: string): Promise<void> {
    const adapter = this.adapters.get(profileId);
    if (adapter) {
      await adapter.disconnect();
      this.adapters.delete(profileId);
    }
    this.connections.delete(profileId);
  }

  getConnectionStatus(profileId: string): DBConnectionStatus | undefined {
    return this.connections.get(profileId);
  }

  isConnected(profileId: string): boolean {
    return this.connections.get(profileId)?.connected ?? false;
  }

  async execute(
    profileId: string,
    sql: string,
    options?: { limit?: number; offset?: number }
  ): Promise<DBQueryResult> {
    const adapter = this.adapters.get(profileId);
    if (!adapter || !adapter.isConnected()) {
      throw new Error('Database not connected');
    }

    const result = await adapter.execute(sql, options);

    this.queryHistory.push({
      connId: profileId,
      sql,
      timestamp: Date.now(),
      duration: result.duration,
      rowCount: result.rowCount,
    });

    if (this.queryHistory.length > 100) {
      this.queryHistory = this.queryHistory.slice(-100);
    }

    return result;
  }

  async listSchemas(profileId: string): Promise<string[]> {
    const adapter = this.adapters.get(profileId);
    if (!adapter?.listSchemas) {
      return ['main'];
    }
    return adapter.listSchemas();
  }

  async listTables(profileId: string, schema: string): Promise<DBTableInfo[]> {
    const adapter = this.adapters.get(profileId);
    if (!adapter?.listTables) {
      return [];
    }
    return adapter.listTables(schema);
  }

  async getTableColumns(profileId: string, schema: string, table: string): Promise<DBColumnInfo[]> {
    const adapter = this.adapters.get(profileId);
    if (!adapter?.getTableColumns) {
      return [];
    }
    return adapter.getTableColumns(schema, table);
  }

  getQueryHistory(profileId?: string) {
    if (profileId) {
      return this.queryHistory.filter((h) => h.connId === profileId);
    }
    return [...this.queryHistory];
  }

  async exportDatabase(profileId: string): Promise<Uint8Array | null> {
    const adapter = this.adapters.get(profileId);
    if (adapter instanceof SQLJsAdapter) {
      return adapter.export();
    }
    return null;
  }

  async importDatabase(profileId: string, data: Uint8Array): Promise<void> {
    const adapter = this.adapters.get(profileId);
    if (adapter instanceof SQLJsAdapter) {
      await adapter.import(data);
    } else {
      throw new Error('Import is only supported for local SQLite databases');
    }
  }

  async closeAll(): Promise<void> {
    for (const [, adapter] of this.adapters) {
      if (adapter.disconnect) {
        await adapter.disconnect();
      }
    }
    this.adapters.clear();
    this.connections.clear();
  }
}

export const realDBService = new RealDBService();
