/**
 * @file opfs-storage.ts
 * @description YYC³便携式智能AI系统 - OPFS本地存储服务
 * Origin Private File System (OPFS) storage service
 *
 * @design_philosophy Local-First 自主权架构
 *   - 一户一端：数据存储在用户本机浏览器
 *   - 零跟踪：无云端、无第三方、无遥测
 *   - 用户自主权：用户拥有数据完全控制
 *   - 突破 LocalStorage 5MB 限制（OPFS 配额按用户磁盘算，通常 GB 级）
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-06-02
 * @updated 2026-06-02
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,storage,opfs,local-first
 */

/**
 * OPFS Storage Quota Info
 */
export interface StorageQuota {
  usage: number;
  quota: number;
  percentage: number;
}

/**
 * OPFS Storage Service
 *
 * Provides persistent, large-capacity local storage using the
 * Origin Private File System. All data stays on the user's device.
 *
 * Browser support: Chrome 102+, Firefox 111+, Safari 15.2+
 */
class OPFSStorageService {
  private root: FileSystemDirectoryHandle | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize OPFS - must be called before any operation
   */
  async init(): Promise<void> {
    if (this.root) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    if (typeof window === 'undefined' || !('storage' in navigator)) {
      console.warn('[OPFS] Storage API not available');
      return;
    }

    try {
      this.root = await navigator.storage.getDirectory();
    } catch (e) {
      console.warn('[OPFS] Failed to get root directory:', e);
    }
  }

  /**
   * Check if OPFS is supported in current browser
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'storage' in navigator &&
      typeof navigator.storage.getDirectory === 'function'
    );
  }

  /**
   * Request persistent storage to prevent browser auto-eviction
   * Returns true if storage is granted persistent status
   */
  async requestPersistent(): Promise<boolean> {
    if (!navigator.storage?.persist) return false;

    if (await navigator.storage.persisted()) return true;

    return await navigator.storage.persist();
  }

  /**
   * Get current storage quota and usage
   */
  async getQuota(): Promise<StorageQuota> {
    if (!navigator.storage?.estimate) {
      return { usage: 0, quota: 0, percentage: 0 };
    }

    const est = await navigator.storage.estimate();
    const usage = est.usage ?? 0;
    const quota = est.quota ?? 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, percentage };
  }

  /**
   * Write a file to OPFS
   */
  async writeFile(path: string, content: string): Promise<void> {
    await this.init();
    if (!this.root) throw new Error('OPFS not initialized');

    const segments = path.split('/').filter(Boolean);
    const fileName = segments.pop();
    if (!fileName) throw new Error(`Invalid path: ${path}`);

    // Navigate/create intermediate directories
    let currentDir = this.root;
    for (const segment of segments) {
      currentDir = await currentDir.getDirectoryHandle(segment, { create: true });
    }

    const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
    const writable = await (
      fileHandle as FileSystemFileHandle & {
        createWritable: () => Promise<FileSystemWritableFileStream>;
      }
    ).createWritable();
    await writable.write(content);
    await writable.close();
  }

  /**
   * Read a file from OPFS
   */
  async readFile(path: string): Promise<string> {
    await this.init();
    if (!this.root) throw new Error('OPFS not initialized');

    const segments = path.split('/').filter(Boolean);
    const fileName = segments.pop();
    if (!fileName) throw new Error(`Invalid path: ${path}`);

    let currentDir = this.root;
    for (const segment of segments) {
      currentDir = await currentDir.getDirectoryHandle(segment);
    }

    const fileHandle = await currentDir.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return file.text();
  }

  /**
   * Read a file as Uint8Array (for binary data)
   */
  async readFileBytes(path: string): Promise<Uint8Array> {
    await this.init();
    if (!this.root) throw new Error('OPFS not initialized');

    const segments = path.split('/').filter(Boolean);
    const fileName = segments.pop();
    if (!fileName) throw new Error(`Invalid path: ${path}`);

    let currentDir = this.root;
    for (const segment of segments) {
      currentDir = await currentDir.getDirectoryHandle(segment);
    }

    const fileHandle = await currentDir.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    const buffer = await file.arrayBuffer();
    return new Uint8Array(buffer);
  }

  /**
   * Delete a file from OPFS
   */
  async deleteFile(path: string): Promise<void> {
    await this.init();
    if (!this.root) throw new Error('OPFS not initialized');

    const segments = path.split('/').filter(Boolean);
    const fileName = segments.pop();
    if (!fileName) throw new Error(`Invalid path: ${path}`);

    let currentDir = this.root;
    for (const segment of segments) {
      currentDir = await currentDir.getDirectoryHandle(segment);
    }

    await currentDir.removeEntry(fileName);
  }

  /**
   * Check if a file exists
   */
  async exists(path: string): Promise<boolean> {
    await this.init();
    if (!this.root) return false;

    try {
      const segments = path.split('/').filter(Boolean);
      const fileName = segments.pop();
      if (!fileName) return false;

      let currentDir = this.root;
      for (const segment of segments) {
        currentDir = await currentDir.getDirectoryHandle(segment);
      }

      await currentDir.getFileHandle(fileName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(dirPath: string): Promise<string[]> {
    await this.init();
    if (!this.root) return [];

    try {
      let currentDir = this.root;
      if (dirPath && dirPath !== '/') {
        const segments = dirPath.split('/').filter(Boolean);
        for (const segment of segments) {
          currentDir = await currentDir.getDirectoryHandle(segment);
        }
      }

      const files: string[] = [];
      // @ts-expect-error - values() is part of the FileSystemDirectoryHandle spec
      for await (const [name, handle] of currentDir.entries()) {
        if (handle.kind === 'file') {
          files.push(name);
        }
      }
      return files;
    } catch (e) {
      console.warn(`[OPFS] Failed to list ${dirPath}:`, e);
      return [];
    }
  }

  /**
   * Clear all data in OPFS (nuclear option - use with caution)
   */
  async clear(): Promise<void> {
    await this.init();
    if (!this.root) return;

    try {
      // @ts-expect-error - values() is part of the FileSystemDirectoryHandle spec
      for await (const [name] of this.root.entries()) {
        await this.root.removeEntry(name, { recursive: true });
      }
    } catch (e) {
      console.warn('[OPFS] Failed to clear:', e);
    }
  }
}

// Export singleton instance
export const opfsStorage = new OPFSStorageService();

// Export class for testing
export { OPFSStorageService };
