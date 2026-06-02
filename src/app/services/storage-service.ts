/**
 * file: storage-service.ts
 * description: 本地存储服务层 - 基于IndexedDB的持久化存储，支持LRU缓存和加密
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-03-19
 * updated: 2026-04-01
 * status: active
 * tags: [service],[storage],[indexeddb],[cache],[encryption]
 *
 * brief: 本地存储服务，支持持久化、缓存和加密
 *
 * details:
 * - IndexedDB持久化存储
 * - LRU缓存机制
 * - 数据加密支持
 * - 版本控制的文件历史
 * - 数据库连接配置管理
 *
 * dependencies: IndexedDB, Crypto API
 * exports: storageService, StorageServiceInterface
 * notes: 需要在应用初始化时启动
 */

import type {
  StorageServiceInterface,
  FileNode,
  FileVersion,
  PreviewSnapshot,
  DBConnectionProfile,
} from '../types';

import { encryptionService, isEncryptionReady } from './encryption-service';

// ── LRU Cache ──

class LRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private maxSize: number;
  private ttl: number; // ms

  constructor(maxSize = 100, ttlSeconds = 300) {
    this.maxSize = maxSize;
    this.ttl = ttlSeconds * 1000;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, { value, timestamp: Date.now() });
    this.evict();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  private evict(): void {
    while (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
  }
}

// ── IndexedDB Wrapper ──

const DB_NAME = 'yyc3-ai-code';
const DB_VERSION = 3;

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'path' });
          fileStore.createIndex('modifiedAt', 'modifiedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('versions')) {
          const versionStore = db.createObjectStore('versions', { keyPath: 'id' });
          versionStore.createIndex('path', 'path', { unique: false });
          versionStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('snapshots')) {
          const snapshotStore = db.createObjectStore('snapshots', { keyPath: 'id' });
          snapshotStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('dbProfiles')) {
          db.createObjectStore('dbProfiles', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('keyValue')) {
          db.createObjectStore('keyValue', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });

    return this.initPromise;
  }

  private async getStore(
    name: string,
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBObjectStore> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction(name, mode);
    return tx.objectStore(name);
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async put<T>(storeName: string, value: T): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllByIndex<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
    const store = await this.getStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const req = index.getAll(value);
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async keys(storeName: string): Promise<string[]> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const req = store.getAllKeys();
      req.onsuccess = () => resolve(req.result as string[]);
      req.onerror = () => reject(req.error);
    });
  }
}

// ── Storage Service ──

export class StorageService implements StorageServiceInterface {
  private idb = new IndexedDBManager();
  private kvCache = new LRUCache<unknown>(200, 300);
  private fileCache = new LRUCache<FileNode>(100, 600);
  private versionCache = new LRUCache<FileVersion[]>(50, 120);
  private encryptionEnabled = false;

  enableEncryption(enabled: boolean = true): void {
    this.encryptionEnabled = enabled && isEncryptionReady();
  }

  isEncryptionEnabled(): boolean {
    return this.encryptionEnabled && isEncryptionReady();
  }

  async get<T>(key: string): Promise<T | null> {
    // Check cache first
    const cached = this.kvCache.get(key) as T | null;
    if (cached !== null) return cached;

    const record = await this.idb.get<{ key: string; value: T }>('keyValue', key);
    if (record) {
      this.kvCache.set(key, record.value);
      return record.value;
    }
    return null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.idb.put('keyValue', { key, value, updatedAt: Date.now() });
    this.kvCache.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.idb.delete('keyValue', key);
    this.kvCache.delete(key);
  }

  async clear(): Promise<void> {
    await this.idb.clear('keyValue');
    this.kvCache.clear();
  }

  async keys(): Promise<string[]> {
    return this.idb.keys('keyValue');
  }

  // ── Encrypted storage operations ──

  async setEncrypted<T>(key: string, value: T): Promise<void> {
    if (!this.encryptionEnabled) {
      return this.set(key, value);
    }

    const json = JSON.stringify(value);
    const encrypted = await encryptionService.encrypt(json);
    await this.idb.put('keyValue', {
      key,
      value: encrypted,
      encrypted: true,
      updatedAt: Date.now(),
    });
    this.kvCache.delete(key);
  }

  async getEncrypted<T>(key: string): Promise<T | null> {
    if (!this.encryptionEnabled) {
      return this.get<T>(key);
    }

    const record = await this.idb.get<{ key: string; value: string; encrypted?: boolean }>(
      'keyValue',
      key
    );
    if (!record) return null;

    if (record.encrypted && typeof record.value === 'string') {
      try {
        const decrypted = await encryptionService.decrypt(JSON.parse(record.value));
        return JSON.parse(decrypted) as T;
      } catch {
        console.warn(`[StorageService] Failed to decrypt value for key: ${key}`);
        return null;
      }
    }

    return record.value as T;
  }

  async setSecure(key: string, value: string): Promise<void> {
    if (!this.encryptionEnabled) {
      await this.set(key, value);
      return;
    }

    const encrypted = await encryptionService.encrypt(value);
    await this.idb.put('keyValue', {
      key,
      value: JSON.stringify(encrypted),
      encrypted: true,
      updatedAt: Date.now(),
    });
  }

  async getSecure(key: string): Promise<string | null> {
    if (!this.encryptionEnabled) {
      const value = await this.get<string>(key);
      return value;
    }

    const record = await this.idb.get<{ key: string; value: string; encrypted?: boolean }>(
      'keyValue',
      key
    );
    if (!record) return null;

    if (record.encrypted && typeof record.value === 'string') {
      try {
        const encryptedData = JSON.parse(record.value);
        return await encryptionService.decrypt(encryptedData);
      } catch {
        console.warn(`[StorageService] Failed to decrypt secure value for key: ${key}`);
        return null;
      }
    }

    return record.value as string;
  }

  // ── File operations ──

  async saveFile(node: FileNode): Promise<void> {
    await this.idb.put('files', node);
    this.fileCache.set(node.path, node);
  }

  async getFile(path: string): Promise<FileNode | undefined> {
    const cached = this.fileCache.get(path);
    if (cached) return cached;
    const file = await this.idb.get<FileNode>('files', path);
    if (file) this.fileCache.set(path, file);
    return file;
  }

  async getAllFiles(): Promise<FileNode[]> {
    return this.idb.getAll<FileNode>('files');
  }

  async deleteFile(path: string): Promise<void> {
    await this.idb.delete('files', path);
    this.fileCache.delete(path);
  }

  // ── Version history ──

  async saveVersion(version: FileVersion): Promise<void> {
    await this.idb.put('versions', version);
    this.versionCache.delete(version.path); // Invalidate cache
  }

  async getVersions(path: string): Promise<FileVersion[]> {
    const cached = this.versionCache.get(path);
    if (cached) return cached;
    const versions = await this.idb.getAllByIndex<FileVersion>('versions', 'path', path);
    const sorted = versions.sort((a, b) => b.createdAt - a.createdAt);
    this.versionCache.set(path, sorted);
    return sorted;
  }

  // ── Preview snapshots ──

  async saveSnapshot(snapshot: PreviewSnapshot): Promise<void> {
    await this.idb.put('snapshots', snapshot);
  }

  async getSnapshots(): Promise<PreviewSnapshot[]> {
    const all = await this.idb.getAll<PreviewSnapshot>('snapshots');
    return all.sort((a, b) => b.createdAt - a.createdAt);
  }

  async deleteSnapshot(id: string): Promise<void> {
    await this.idb.delete('snapshots', id);
  }

  // ── DB connection profiles ──

  async saveDBProfile(profile: DBConnectionProfile): Promise<void> {
    await this.idb.put('dbProfiles', profile);
  }

  async getDBProfiles(): Promise<DBConnectionProfile[]> {
    return this.idb.getAll<DBConnectionProfile>('dbProfiles');
  }

  async deleteDBProfile(id: string): Promise<void> {
    await this.idb.delete('dbProfiles', id);
  }

  clearCaches(): void {
    this.kvCache.clear();
    this.fileCache.clear();
    this.versionCache.clear();
  }

  // ── Export / Import ──

  async exportAll(): Promise<string> {
    const [files, versions, snapshots, profiles, kv] = await Promise.all([
      this.idb.getAll('files'),
      this.idb.getAll('versions'),
      this.idb.getAll('snapshots'),
      this.idb.getAll('dbProfiles'),
      this.idb.getAll('keyValue'),
    ]);
    return JSON.stringify(
      { files, versions, snapshots, dbProfiles: profiles, keyValue: kv },
      null,
      2
    );
  }

  async importAll(jsonStr: string): Promise<void> {
    const data = JSON.parse(jsonStr);

    // Use individual store operations (simpler approach)
    const promises: Promise<void>[] = [];

    if (data.files) {
      for (const f of data.files) {
        promises.push(this.idb.put('files', f));
      }
    }

    if (data.versions) {
      for (const v of data.versions) {
        promises.push(this.idb.put('versions', v));
      }
    }

    if (data.snapshots) {
      for (const s of data.snapshots) {
        promises.push(this.idb.put('snapshots', s));
      }
    }

    if (data.dbProfiles) {
      for (const p of data.dbProfiles) {
        promises.push(this.idb.put('dbProfiles', p));
      }
    }

    if (data.keyValue) {
      for (const kv of data.keyValue) {
        promises.push(this.idb.put('keyValue', kv));
      }
    }

    // Wait for all operations to complete
    await Promise.all(promises);

    // Clear caches after import
    this.kvCache.clear();
    this.fileCache.clear();
    this.versionCache.clear();
  }
}

// ── Storage Monitor & Optimizer ──

export interface StorageStats {
  usedBytes: number;
  availableBytes: number;
  totalBytes: number;
  usedPercentage: number;
  filesCount: number;
  versionsCount: number;
  snapshotsCount: number;
  dbProfilesCount: number;
  oldestData: number;
  newestData: number;
}

export interface CleanupOptions {
  maxAge?: number;
  maxVersions?: number;
  keepLatest?: boolean;
  dryRun?: boolean;
}

export interface CleanupResult {
  deletedFiles: number;
  deletedVersions: number;
  deletedSnapshots: number;
  freedBytes: number;
  errors: string[];
}

export interface ChunkInfo {
  id: string;
  path: string;
  chunkIndex: number;
  totalChunks: number;
  content: string;
  createdAt: number;
}

const CHUNK_SIZE = 1024 * 1024;
const STORAGE_WARNING_THRESHOLD = 0.8;
const STORAGE_CRITICAL_THRESHOLD = 0.95;

class StorageOptimizer {
  private idb: IndexedDBManager;
  private storageService: StorageService;

  constructor(idb: IndexedDBManager, storageService: StorageService) {
    this.idb = idb;
    this.storageService = storageService;
  }

  clearCaches(): void {
    const svc = this.storageService as unknown as { clearCaches: () => void };
    if (typeof svc.clearCaches === 'function') {
      svc.clearCaches();
    }
  }

  async getStorageStats(): Promise<StorageStats> {
    const [files, versions, snapshots, profiles] = await Promise.all([
      this.idb.getAll<FileNode>('files'),
      this.idb.getAll<FileVersion>('versions'),
      this.idb.getAll<PreviewSnapshot>('snapshots'),
      this.idb.getAll<DBConnectionProfile>('dbProfiles'),
    ]);

    const filesSize = this.calculateSize(files);
    const versionsSize = this.calculateSize(versions);
    const snapshotsSize = this.calculateSize(snapshots);
    const profilesSize = this.calculateSize(profiles);

    const usedBytes = filesSize + versionsSize + snapshotsSize + profilesSize;
    const totalBytes = this.estimateStorageLimit();
    const availableBytes = totalBytes - usedBytes;

    const timestamps = [
      ...files.map((f) => f.modifiedAt || 0),
      ...versions.map((v) => v.createdAt || 0),
      ...snapshots.map((s) => s.createdAt || 0),
    ].filter((t) => t > 0);

    return {
      usedBytes,
      availableBytes,
      totalBytes,
      usedPercentage: (usedBytes / totalBytes) * 100,
      filesCount: files.length,
      versionsCount: versions.length,
      snapshotsCount: snapshots.length,
      dbProfilesCount: profiles.length,
      oldestData: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestData: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    };
  }

  async checkStorageHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    recommendation?: string;
  }> {
    const stats = await this.getStorageStats();

    if (stats.usedPercentage >= STORAGE_CRITICAL_THRESHOLD * 100) {
      return {
        status: 'critical',
        message: `存储空间严重不足 (${stats.usedPercentage.toFixed(1)}%)`,
        recommendation: '请立即清理数据或导出备份后删除旧数据',
      };
    }

    if (stats.usedPercentage >= STORAGE_WARNING_THRESHOLD * 100) {
      return {
        status: 'warning',
        message: `存储空间即将满 (${stats.usedPercentage.toFixed(1)}%)`,
        recommendation: '建议清理旧版本或导出备份',
      };
    }

    return {
      status: 'healthy',
      message: `存储空间充足 (${stats.usedPercentage.toFixed(1)}%)`,
    };
  }

  async cleanupOldData(options: CleanupOptions = {}): Promise<CleanupResult> {
    const result: CleanupResult = {
      deletedFiles: 0,
      deletedVersions: 0,
      deletedSnapshots: 0,
      freedBytes: 0,
      errors: [],
    };

    const {
      maxAge = 90 * 24 * 60 * 60 * 1000,
      maxVersions = 20,
      keepLatest = true,
      dryRun = false,
    } = options;

    const cutoffTime = Date.now() - maxAge;

    try {
      const versions = await this.idb.getAll<FileVersion>('versions');
      const versionsByPath = new Map<string, FileVersion[]>();

      for (const version of versions) {
        const existing = versionsByPath.get(version.path) || [];
        existing.push(version);
        versionsByPath.set(version.path, existing);
      }

      for (const [_path, pathVersions] of versionsByPath) {
        const sorted = pathVersions.sort((a, b) => b.createdAt - a.createdAt);
        const toDelete = sorted.slice(keepLatest ? 1 : 0);

        for (const version of toDelete) {
          if (version.createdAt < cutoffTime || sorted.length > maxVersions) {
            if (!dryRun) {
              await this.idb.delete('versions', version.id);
            }
            result.deletedVersions++;
            result.freedBytes += this.calculateSize([version]);
          }
        }
      }

      const snapshots = await this.idb.getAll<PreviewSnapshot>('snapshots');
      for (const snapshot of snapshots) {
        if (snapshot.createdAt < cutoffTime) {
          if (!dryRun) {
            await this.idb.delete('snapshots', snapshot.id);
          }
          result.deletedSnapshots++;
          result.freedBytes += this.calculateSize([snapshot]);
        }
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : '清理失败');
    }

    return result;
  }

  async saveLargeFile(
    path: string,
    content: string,
    metadata?: Partial<FileNode>
  ): Promise<FileNode> {
    if (content.length <= CHUNK_SIZE) {
      const node: FileNode = {
        path,
        name: path.split('/').pop() || path,
        type: 'file',
        size: content.length,
        modifiedAt: Date.now(),
        ...metadata,
      };
      await this.storageService.saveFile(node);
      return node;
    }

    const chunks = this.splitIntoChunks(content);
    const chunkIds: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${path}:chunk:${i}`;
      const chunk: ChunkInfo = {
        id: chunkId,
        path,
        chunkIndex: i,
        totalChunks: chunks.length,
        content: chunks[i],
        createdAt: Date.now(),
      };
      await this.idb.put('keyValue', { key: chunkId, value: chunk, updatedAt: Date.now() });
      chunkIds.push(chunkId);
    }

    const node: FileNode = {
      path,
      name: path.split('/').pop() || path,
      type: 'file',
      size: content.length,
      modifiedAt: Date.now(),
      ...metadata,
    };

    await this.storageService.saveFile(node);
    return node;
  }

  async readLargeFile(path: string): Promise<string> {
    const file = await this.storageService.getFile(path);

    if (!file) {
      throw new Error(`文件不存在: ${path}`);
    }

    return '';
  }

  async deleteLargeFile(path: string): Promise<void> {
    const file = await this.storageService.getFile(path);

    if (!file) return;

    await this.storageService.deleteFile(path);
  }

  async optimizeStorage(): Promise<{
    beforeBytes: number;
    afterBytes: number;
    freedBytes: number;
    operations: string[];
  }> {
    const operations: string[] = [];
    const statsBefore = await this.getStorageStats();

    operations.push('清理孤立版本数据');
    const cleanupResult = await this.cleanupOldData({ maxAge: 30 * 24 * 60 * 60 * 1000 });
    operations.push(`删除 ${cleanupResult.deletedVersions} 个旧版本`);
    operations.push(`删除 ${cleanupResult.deletedSnapshots} 个旧快照`);

    operations.push('压缩缓存');
    this.clearCaches();
    operations.push('缓存已清空');

    const statsAfter = await this.getStorageStats();

    return {
      beforeBytes: statsBefore.usedBytes,
      afterBytes: statsAfter.usedBytes,
      freedBytes: statsBefore.usedBytes - statsAfter.usedBytes,
      operations,
    };
  }

  private calculateSize(data: unknown[]): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private estimateStorageLimit(): number {
    return 50 * 1024 * 1024;
  }

  private splitIntoChunks(content: string): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += CHUNK_SIZE) {
      chunks.push(content.slice(i, i + CHUNK_SIZE));
    }
    return chunks;
  }
}

// ── Extended Storage Service ──

export class ExtendedStorageService extends StorageService {
  private optimizer: StorageOptimizer;
  private idbManager: IndexedDBManager;

  constructor() {
    super();
    this.idbManager = new IndexedDBManager();
    this.optimizer = new StorageOptimizer(this.idbManager, this);
  }

  getOptimizer(): StorageOptimizer {
    return this.optimizer;
  }

  clearCaches(): void {
    this['kvCache'].clear();
    this['fileCache'].clear();
    this['versionCache'].clear();
  }
}

// ── Singleton ──
export const storageService = new ExtendedStorageService();
export const storageOptimizer = storageService.getOptimizer();
