/**
 * @file query-optimizer.ts
 * @description YYC³便携式智能AI系统 - 数据库查询优化服务
 * Database Query Optimization Service
 * IndexManager, QueryCache, QueryAnalyzer, SlowQueryMonitor, BatchOperation.
 * Provides intelligent index recommendations, query plan analysis,
 * LRU cache for repeated queries, and slow query detection.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,database,optimization,index,cache,performance
 */

// ══════════════════════════════════════════
// ── Types
// ══════════════════════════════════════════

export interface IndexConfig {
  table: string;
  columns: string[];
  unique?: boolean;
  name?: string;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface IndexStats {
  name: string;
  table: string;
  columns: string[];
  size: number;
  sizeFormatted: string;
  scans: number;
  tuplesRead: number;
  tuplesFetched: number;
  lastUsed: number;
}

export interface QueryPlan {
  nodeType: string;
  strategy?: string;
  cost: { startup: number; total: number };
  rows: number;
  width: number;
  actualTime?: { start: number; end: number };
  actualRows?: number;
  loops?: number;
  indexName?: string;
  relation?: string;
  filter?: string;
  children?: QueryPlan[];
}

export interface QueryAnalysis {
  sql: string;
  executionTime: number;
  rowsReturned: number;
  rowsScanned: number;
  indexUsed: string | null;
  plan: QueryPlan;
  recommendations: QueryRecommendation[];
}

export interface QueryRecommendation {
  type: 'index' | 'rewrite' | 'cache' | 'limit' | 'partition';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  detail?: string;
  suggestedSql?: string;
}

export interface SlowQuery {
  id: string;
  sql: string;
  duration: number;
  timestamp: number;
  rowsReturned: number;
  connId: string;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  memoryUsage: number;
}

export interface BatchInsertOptions {
  table: string;
  columns: string[];
  data: unknown[][];
  batchSize?: number;
}

// ══════════════════════════════════════════
// ── IndexManager
// ══════════════════════════════════════════

const SIMULATED_INDEXES: IndexStats[] = [
  {
    name: 'users_pkey',
    table: 'users',
    columns: ['id'],
    size: 32768,
    sizeFormatted: '32 KB',
    scans: 4520,
    tuplesRead: 12800,
    tuplesFetched: 4520,
    lastUsed: Date.now() - 60000,
  },
  {
    name: 'users_email_idx',
    table: 'users',
    columns: ['email'],
    size: 24576,
    sizeFormatted: '24 KB',
    scans: 3100,
    tuplesRead: 3100,
    tuplesFetched: 3100,
    lastUsed: Date.now() - 120000,
  },
  {
    name: 'projects_pkey',
    table: 'projects',
    columns: ['id'],
    size: 16384,
    sizeFormatted: '16 KB',
    scans: 2340,
    tuplesRead: 6700,
    tuplesFetched: 2340,
    lastUsed: Date.now() - 300000,
  },
  {
    name: 'projects_owner_idx',
    table: 'projects',
    columns: ['owner_id'],
    size: 16384,
    sizeFormatted: '16 KB',
    scans: 1890,
    tuplesRead: 5400,
    tuplesFetched: 1890,
    lastUsed: Date.now() - 180000,
  },
  {
    name: 'files_project_idx',
    table: 'files',
    columns: ['project_id'],
    size: 40960,
    sizeFormatted: '40 KB',
    scans: 5600,
    tuplesRead: 28000,
    tuplesFetched: 5600,
    lastUsed: Date.now() - 45000,
  },
  {
    name: 'files_path_idx',
    table: 'files',
    columns: ['path'],
    size: 57344,
    sizeFormatted: '56 KB',
    scans: 8200,
    tuplesRead: 8200,
    tuplesFetched: 8200,
    lastUsed: Date.now() - 30000,
  },
  {
    name: 'ai_sessions_pkey',
    table: 'ai_sessions',
    columns: ['id'],
    size: 8192,
    sizeFormatted: '8 KB',
    scans: 340,
    tuplesRead: 1020,
    tuplesFetched: 340,
    lastUsed: Date.now() - 600000,
  },
  {
    name: 'ai_sessions_user_idx',
    table: 'ai_sessions',
    columns: ['user_id', 'created_at'],
    size: 16384,
    sizeFormatted: '16 KB',
    scans: 780,
    tuplesRead: 2340,
    tuplesFetched: 780,
    lastUsed: Date.now() - 240000,
  },
];

class IndexManager {
  async getIndexes(_connId: string, table?: string): Promise<IndexStats[]> {
    await new Promise((r) => setTimeout(r, 200));
    if (table) return SIMULATED_INDEXES.filter((i) => i.table === table);
    return [...SIMULATED_INDEXES];
  }

  async createIndex(_connId: string, config: IndexConfig): Promise<void> {
    await new Promise((r) => setTimeout(r, 500));
    const name = config.name || `idx_${config.table}_${config.columns.join('_')}`;
    SIMULATED_INDEXES.push({
      name,
      table: config.table,
      columns: config.columns,
      size: 8192,
      sizeFormatted: '8 KB',
      scans: 0,
      tuplesRead: 0,
      tuplesFetched: 0,
      lastUsed: Date.now(),
    });
  }

  async dropIndex(_connId: string, indexName: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 300));
    const idx = SIMULATED_INDEXES.findIndex((i) => i.name === indexName);
    if (idx >= 0) SIMULATED_INDEXES.splice(idx, 1);
  }

  async reindex(_connId: string, indexName: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 800));
    const index = SIMULATED_INDEXES.find((i) => i.name === indexName);
    if (index) {
      index.scans = 0;
      index.tuplesRead = 0;
      index.tuplesFetched = 0;
      index.lastUsed = Date.now();
    }
  }

  async recommendIndexes(_connId: string, table: string): Promise<IndexConfig[]> {
    await new Promise((r) => setTimeout(r, 400));
    const recommendations: IndexConfig[] = [];
    if (table === 'users') {
      recommendations.push({ table, columns: ['name', 'created_at'], type: 'btree' });
      recommendations.push({ table, columns: ['role'], type: 'hash' });
    }
    if (table === 'files') {
      recommendations.push({ table, columns: ['content'], type: 'gin' });
    }
    if (table === 'ai_sessions') {
      recommendations.push({ table, columns: ['model', 'created_at'], type: 'btree' });
    }
    return recommendations;
  }
}

// ══════════════════════════════════════════
// ── QueryCache
// ══════════════════════════════════════════

interface CacheEntry {
  result: unknown[];
  timestamp: number;
  hitCount: number;
  size: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttl: number;
  private _hitCount = 0;
  private _missCount = 0;

  constructor(ttl = 60000, maxSize = 500) {
    this.ttl = ttl;
    this.maxSize = maxSize;
  }

  private generateKey(sql: string, params?: unknown[]): string {
    return `${sql}::${JSON.stringify(params || [])}`;
  }

  get(sql: string, params?: unknown[]): unknown[] | null {
    const key = this.generateKey(sql, params);
    const entry = this.cache.get(key);
    if (!entry) {
      this._missCount++;
      return null;
    }
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this._missCount++;
      return null;
    }
    entry.hitCount++;
    this._hitCount++;
    return entry.result;
  }

  set(sql: string, result: unknown[], params?: unknown[]): void {
    const key = this.generateKey(sql, params);
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      hitCount: 0,
      size: JSON.stringify(result).length,
    });
    this.evictIfNeeded();
  }

  invalidate(sql?: string): void {
    if (sql) {
      for (const [key] of this.cache) {
        if (key.startsWith(sql)) this.cache.delete(key);
      }
    } else {
      this.cache.clear();
    }
  }

  getStats(): CacheStats {
    const total = this._hitCount + this._missCount;
    let memoryUsage = 0;
    for (const entry of this.cache.values()) memoryUsage += entry.size;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this._hitCount,
      missCount: this._missCount,
      hitRate: total > 0 ? this._hitCount / total : 0,
      memoryUsage,
    };
  }

  private evictIfNeeded(): void {
    while (this.cache.size > this.maxSize) {
      let oldestKey = '';
      let oldestTime = Infinity;
      for (const [key, entry] of this.cache) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = key;
        }
      }
      if (oldestKey) this.cache.delete(oldestKey);
    }
  }
}

// ══════════════════════════════════════════
// ── QueryAnalyzer
// ══════════════════════════════════════════

class QueryAnalyzer {
  async analyzeQuery(_connId: string, sql: string): Promise<QueryAnalysis> {
    await new Promise((r) => setTimeout(r, 600));

    const sqlUpper = sql.toUpperCase().trim();
    const recommendations: QueryRecommendation[] = [];
    let indexUsed: string | null = null;
    let rowsScanned = 0;
    let rowsReturned = 0;

    // Simulate query plan analysis
    const plan: QueryPlan = this.simulatePlan(sqlUpper);

    // Detect Seq Scan
    if (sqlUpper.includes('WHERE') && !sqlUpper.includes('LIMIT')) {
      if (Math.random() > 0.5) {
        recommendations.push({
          type: 'index',
          severity: 'warning',
          message: '检测到全表扫描 (Seq Scan)',
          detail: '考虑为 WHERE 条件中的列添加索引以避免全表扫描',
        });
        rowsScanned = 1250 + Math.floor(Math.random() * 5000);
        rowsReturned = Math.floor(rowsScanned * 0.1);
      } else {
        indexUsed = 'idx_auto_detected';
        rowsScanned = 50 + Math.floor(Math.random() * 200);
        rowsReturned = rowsScanned;
      }
    }

    // Detect missing LIMIT
    if (
      sqlUpper.startsWith('SELECT') &&
      !sqlUpper.includes('LIMIT') &&
      !sqlUpper.includes('COUNT')
    ) {
      recommendations.push({
        type: 'limit',
        severity: 'info',
        message: '查询缺少 LIMIT 子句',
        detail: '大表查询建议添加 LIMIT 限制返回行数',
        suggestedSql: `${sql.replace(/;?\s*$/, '')} LIMIT 100;`,
      });
    }

    // Detect SELECT *
    if (sqlUpper.includes('SELECT *')) {
      recommendations.push({
        type: 'rewrite',
        severity: 'info',
        message: '避免使用 SELECT *',
        detail: '明确指定需要的列可以减少 I/O 和网络传输',
      });
    }

    // Suggest caching for repeated patterns
    if (sqlUpper.includes('WHERE') && sqlUpper.includes('=')) {
      recommendations.push({
        type: 'cache',
        severity: 'info',
        message: '适合启用查询缓存',
        detail: '此查询模式稳定，结果可缓存以减少数据库负载',
      });
    }

    if (rowsReturned === 0) {
      rowsScanned = 100 + Math.floor(Math.random() * 500);
      rowsReturned = Math.floor(rowsScanned * 0.8);
    }

    return {
      sql,
      executionTime: 10 + Math.floor(Math.random() * 200),
      rowsReturned,
      rowsScanned,
      indexUsed,
      plan,
      recommendations,
    };
  }

  private simulatePlan(sql: string): QueryPlan {
    const hasWhere = sql.includes('WHERE');
    const hasJoin = sql.includes('JOIN');

    const basePlan: QueryPlan = {
      nodeType: hasJoin ? 'Hash Join' : hasWhere ? 'Index Scan' : 'Seq Scan',
      cost: { startup: hasWhere ? 0.28 : 0.0, total: hasWhere ? 12.45 : 245.0 },
      rows: hasWhere ? 50 : 1250,
      width: 120,
      actualTime: { start: 0.015, end: hasWhere ? 0.342 : 8.56 },
      actualRows: hasWhere ? 47 : 1250,
      loops: 1,
      relation: sql.match(/FROM\s+(\w+)/i)?.[1] || 'unknown',
    };

    if (hasWhere) {
      basePlan.indexName = `idx_${basePlan.relation}_auto`;
      basePlan.filter =
        sql.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|GROUP|$)/i)?.[1]?.trim() || undefined;
    }

    if (hasJoin) {
      basePlan.children = [
        { nodeType: 'Hash', cost: { startup: 4.25, total: 4.25 }, rows: 100, width: 64 },
        {
          nodeType: 'Seq Scan',
          cost: { startup: 0, total: 22.5 },
          rows: 1250,
          width: 120,
          relation: 'joined_table',
        },
      ];
    }

    return basePlan;
  }
}

// ══════════════════════════════════════════
// ── SlowQueryMonitor
// ══════════════════════════════════════════

class SlowQueryMonitor {
  private queries: SlowQuery[] = [];
  private threshold: number;
  private maxEntries: number;

  constructor(threshold = 500, maxEntries = 200) {
    this.threshold = threshold;
    this.maxEntries = maxEntries;
    this.seedDemoData();
  }

  private seedDemoData() {
    const demoQueries = [
      {
        sql: "SELECT * FROM files WHERE content ILIKE '%import%' ORDER BY updated_at DESC",
        duration: 1240,
        rows: 342,
      },
      {
        sql: 'SELECT u.*, COUNT(p.id) FROM users u LEFT JOIN projects p ON p.owner_id = u.id GROUP BY u.id',
        duration: 890,
        rows: 1250,
      },
      {
        sql: "SELECT * FROM ai_sessions WHERE created_at > NOW() - INTERVAL '7 days' ORDER BY tokens_used DESC",
        duration: 650,
        rows: 89,
      },
      {
        sql: 'UPDATE files SET content = $1 WHERE project_id = $2 AND path = $3',
        duration: 520,
        rows: 1,
      },
      {
        sql: 'SELECT f.*, p.name as project_name FROM files f JOIN projects p ON f.project_id = p.id WHERE f.size > 100000',
        duration: 780,
        rows: 56,
      },
    ];
    demoQueries.forEach((q, i) => {
      this.queries.push({
        id: `slow-${i}`,
        sql: q.sql,
        duration: q.duration,
        timestamp: Date.now() - i * 300000 - Math.random() * 600000,
        rowsReturned: q.rows,
        connId: 'c1',
      });
    });
  }

  record(sql: string, duration: number, rowsReturned: number, connId: string): void {
    if (duration >= this.threshold) {
      this.queries.push({
        id: `slow-${Date.now()}`,
        sql,
        duration,
        timestamp: Date.now(),
        rowsReturned,
        connId,
      });
      if (this.queries.length > this.maxEntries) this.queries.shift();
    }
  }

  getSlowQueries(): SlowQuery[] {
    return [...this.queries].sort((a, b) => b.timestamp - a.timestamp);
  }

  getStats(): { total: number; avgDuration: number; maxDuration: number; minDuration: number } {
    if (this.queries.length === 0)
      return { total: 0, avgDuration: 0, maxDuration: 0, minDuration: 0 };
    const durations = this.queries.map((q) => q.duration);
    return {
      total: this.queries.length,
      avgDuration: Math.round(durations.reduce((s, d) => s + d, 0) / durations.length),
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
    };
  }

  setThreshold(ms: number) {
    this.threshold = ms;
  }
  getThreshold(): number {
    return this.threshold;
  }

  clear(): void {
    this.queries = [];
  }
}

// ══════════════════════════════════════════
// ── BatchOperation
// ══════════════════════════════════════════

class BatchOperation {
  async batchInsert(
    _connId: string,
    options: BatchInsertOptions
  ): Promise<{ inserted: number; duration: number }> {
    const { data, batchSize = 1000 } = options;
    await new Promise((r) => setTimeout(r, Math.min(data.length * 0.5, 2000)));
    const batches = Math.ceil(data.length / batchSize);
    return { inserted: data.length, duration: batches * 50 + Math.random() * 100 };
  }

  async batchUpdate(
    _connId: string,
    _table: string,
    updates: { id: string; data: Record<string, unknown> }[]
  ): Promise<{ updated: number; duration: number }> {
    await new Promise((r) => setTimeout(r, Math.min(updates.length * 0.8, 3000)));
    return { updated: updates.length, duration: updates.length * 2 + Math.random() * 50 };
  }

  async batchDelete(
    _connId: string,
    _table: string,
    ids: string[]
  ): Promise<{ deleted: number; duration: number }> {
    await new Promise((r) => setTimeout(r, Math.min(ids.length * 0.3, 1500)));
    return { deleted: ids.length, duration: ids.length * 1.5 + Math.random() * 30 };
  }
}

// ══════════════════════════════════════════
// ── Singleton Exports
// ══════════════════════════════════════════

export const indexManager = new IndexManager();
export const queryCache = new QueryCache(60000, 500);
export const queryAnalyzer = new QueryAnalyzer();
export const slowQueryMonitor = new SlowQueryMonitor(500, 200);
export const batchOperation = new BatchOperation();
