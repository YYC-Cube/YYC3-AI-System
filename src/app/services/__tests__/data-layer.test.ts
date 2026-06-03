/**
 * @file data-layer.test.ts
 * @description YYC³ 数据层单元测试 - 确保数据服务可靠性
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [test],[data-layer],[export],[integrity],[storage]
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('数据层服务测试', () => {
  describe('数据导出服务', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('应该正确生成导出文件名', async () => {
      const { dataExportService } = await import('../data-export-service');

      const filename = dataExportService.generateExportFilename('json');
      expect(filename).toMatch(/^yyc3-backup-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/);

      const filenameZip = dataExportService.generateExportFilename('zip');
      expect(filenameZip).toMatch(/\.zip$/);
    });

    it('应该正确计算数据哈希', async () => {
      const { dataExportService } = await import('../data-export-service');

      const content = 'test content';
      const hash = await (
        dataExportService as unknown as { calculateChecksum: (data: unknown) => Promise<string> }
      ).calculateChecksum({ test: content });

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64);
    });

    it('应该正确验证版本兼容性', async () => {
      const { dataExportService } = await import('../data-export-service');

      const service = dataExportService as unknown as {
        checkCompatibility: (version: string) => { compatible: boolean; reason: string };
      };

      const result1 = service.checkCompatibility('1.0.0');
      expect(result1.compatible).toBe(true);

      const result2 = service.checkCompatibility('99.0.0');
      expect(result2.compatible).toBe(false);
      expect(result2.reason).toContain('版本过高');
    });
  });

  describe('数据完整性服务', () => {
    it('应该正确执行快速检查', async () => {
      const { dataIntegrityService } = await import('../data-integrity-service');

      const mockStorageService = {
        getAllFiles: vi
          .fn()
          .mockResolvedValue([{ path: 'test.ts', content: 'test', modifiedAt: Date.now() }]),
      };

      await dataIntegrityService.init(mockStorageService as unknown as never);
      const result = await dataIntegrityService.quickCheck();

      expect(result).toHaveProperty('isHealthy');
      expect(result).toHaveProperty('issues');
    });

    it('应该正确生成迁移计划', async () => {
      const { dataIntegrityService } = await import('../data-integrity-service');

      const plan = await dataIntegrityService.createMigrationPlan('1.0.0', '1.1.0');

      expect(plan.fromVersion).toBe('1.0.0');
      expect(plan.toVersion).toBe('1.1.0');
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.backupRequired).toBe(true);
    });

    it('应该正确计算数据哈希', async () => {
      const { dataIntegrityService } = await import('../data-integrity-service');

      const hash = await dataIntegrityService.calculateDataHash('test.ts', 'test content');

      expect(hash).toBeDefined();
      expect(hash.path).toBe('test.ts');
      expect(hash.hash).toBeDefined();
      expect(hash.timestamp).toBeGreaterThan(0);
    });
  });

  describe('存储优化器', () => {
    it('应该正确格式化字节大小', () => {
      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('应该正确分割大文件', () => {
      const CHUNK_SIZE = 100;
      const splitIntoChunks = (content: string): string[] => {
        const chunks: string[] = [];
        for (let i = 0; i < content.length; i += CHUNK_SIZE) {
          chunks.push(content.slice(i, i + CHUNK_SIZE));
        }
        return chunks;
      };

      const smallContent = 'a'.repeat(50);
      expect(splitIntoChunks(smallContent).length).toBe(1);

      const largeContent = 'a'.repeat(250);
      const chunks = splitIntoChunks(largeContent);
      expect(chunks.length).toBe(3);
      expect(chunks[0].length).toBe(100);
      expect(chunks[2].length).toBe(50);
    });
  });

  describe('LRU缓存', () => {
    it('应该正确缓存和获取数据', async () => {
      const { storageService } = await import('../storage-service');

      const testKey = 'test-cache-key';
      const testValue = { data: 'test' };

      await storageService.set(testKey, testValue);
      const cached = await storageService.get<typeof testValue>(testKey);

      expect(cached).toEqual(testValue);
    });

    it('应该正确删除缓存', async () => {
      const { storageService } = await import('../storage-service');

      const testKey = 'test-delete-key';
      await storageService.set(testKey, 'test');
      await storageService.delete(testKey);
      const cached = await storageService.get(testKey);

      expect(cached).toBeNull();
    });
  });

  describe('文件操作', () => {
    it('应该正确保存和获取文件', async () => {
      const { storageService } = await import('../storage-service');
      const { FileNode } = await import('../../types');

      const testFile = {
        path: '/test/file.ts',
        name: 'file.ts',
        type: 'file' as const,
        content: 'console.log("test")',
        modifiedAt: Date.now(),
      };

      await storageService.saveFile(testFile);
      const retrieved = await storageService.getFile('/test/file.ts');

      expect(retrieved).toBeDefined();
      expect(retrieved?.content).toBe('console.log("test")');
    });

    it('应该正确删除文件', async () => {
      const { storageService } = await import('../storage-service');

      const testFile = {
        path: '/test/delete-me.ts',
        name: 'delete-me.ts',
        type: 'file' as const,
        content: 'delete me',
        modifiedAt: Date.now(),
      };

      await storageService.saveFile(testFile);
      await storageService.deleteFile('/test/delete-me.ts');
      const retrieved = await storageService.getFile('/test/delete-me.ts');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('版本历史', () => {
    it('应该正确保存和获取版本', async () => {
      const { storageService } = await import('../storage-service');

      const testVersion = {
        id: 'version-1',
        path: '/test/file.ts',
        content: 'version 1 content',
        createdAt: Date.now(),
        message: 'Initial version',
      };

      await storageService.saveVersion(testVersion);
      const versions = await storageService.getVersions('/test/file.ts');

      expect(versions.length).toBeGreaterThan(0);
      expect(versions[0].content).toBe('version 1 content');
    });
  });

  describe('快照操作', () => {
    it('应该正确保存和获取快照', async () => {
      const { storageService } = await import('../storage-service');

      const testSnapshot = {
        id: 'snapshot-1',
        name: 'Test Snapshot',
        createdAt: Date.now(),
        files: [],
      };

      await storageService.saveSnapshot(testSnapshot);
      const snapshots = await storageService.getSnapshots();

      expect(snapshots.length).toBeGreaterThan(0);
      expect(snapshots.find((s) => s.id === 'snapshot-1')).toBeDefined();
    });
  });

  describe('数据库配置', () => {
    it('应该正确保存和获取数据库配置', async () => {
      const { storageService } = await import('../storage-service');

      const testProfile = {
        id: 'profile-1',
        name: 'Test Database',
        type: 'postgres' as const,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'test',
        password: '',
      };

      await storageService.saveDBProfile(testProfile);
      const profiles = await storageService.getDBProfiles();

      expect(profiles.length).toBeGreaterThan(0);
      expect(profiles.find((p) => p.id === 'profile-1')).toBeDefined();
    });
  });

  describe('导入导出', () => {
    it('应该正确导出所有数据', async () => {
      const { storageService } = await import('../storage-service');

      const exported = await storageService.exportAll();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty('files');
      expect(parsed).toHaveProperty('versions');
      expect(parsed).toHaveProperty('snapshots');
      expect(parsed).toHaveProperty('dbProfiles');
    });

    it('应该正确导入数据', async () => {
      const { storageService } = await import('../storage-service');

      const testData = JSON.stringify({
        files: [
          {
            path: '/imported/file.ts',
            name: 'file.ts',
            type: 'file',
            content: 'imported',
            modifiedAt: Date.now(),
          },
        ],
        versions: [],
        snapshots: [],
        dbProfiles: [],
        keyValue: [],
      });

      await storageService.importAll(testData);
      const file = await storageService.getFile('/imported/file.ts');

      expect(file).toBeDefined();
      expect(file?.content).toBe('imported');
    });
  });
});

describe('存储健康检查', () => {
  it('应该正确检测存储状态', async () => {
    const { storageOptimizer } = await import('../storage-service');

    const health = await storageOptimizer.checkStorageHealth();

    expect(health).toHaveProperty('status');
    expect(['healthy', 'warning', 'critical']).toContain(health.status);
    expect(health).toHaveProperty('message');
  });

  it('应该正确获取存储统计', async () => {
    const { storageOptimizer } = await import('../storage-service');

    const stats = await storageOptimizer.getStorageStats();

    expect(stats).toHaveProperty('usedBytes');
    expect(stats).toHaveProperty('totalBytes');
    expect(stats).toHaveProperty('usedPercentage');
    expect(stats).toHaveProperty('filesCount');
    expect(stats).toHaveProperty('versionsCount');
  });
});
