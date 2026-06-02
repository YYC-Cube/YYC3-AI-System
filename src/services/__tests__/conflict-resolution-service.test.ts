/**
 * @file conflict-resolution-service.test.ts
 * @description YYC³便携式智能AI系统 - 冲突解决服务测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,conflict,merge
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  ConflictType,
  type SyncOperation,
  type SyncOperationType,
  type SyncPriority,
  type SyncOperationStatus,
} from '../../types/sync';
import { ConflictResolutionService } from '../conflict-resolution-service';

describe('ConflictResolutionService', () => {
  let conflictService: ConflictResolutionService;

  beforeEach(() => {
    conflictService = ConflictResolutionService.getInstance();
  });

  describe('初始化', () => {
    it('应该是单例模式', () => {
      const instance1 = ConflictResolutionService.getInstance();
      const instance2 = ConflictResolutionService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('应该初始化默认策略', () => {
      const resolutions = conflictService.getAvailableResolutions(ConflictType.VERSION);
      expect(resolutions.length).toBeGreaterThan(0);
    });
  });

  describe('冲突检测', () => {
    const createMockOperation = (data: Record<string, unknown>): SyncOperation => ({
      id: 'op-1',
      type: 'update' as SyncOperationType,
      priority: 'normal' as SyncPriority,
      status: 'pending' as SyncOperationStatus,
      resourceType: 'files',
      resourceId: 'file-1',
      localData: data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      requiresConfirmation: false,
    });

    it('应该检测版本冲突', () => {
      const localData = { version: 1, content: 'local' };
      const serverData = { version: 2, content: 'server' };

      const operation = createMockOperation(localData);
      const conflict = conflictService.detectConflict(operation, serverData);

      expect(conflict).toBeTruthy();
      expect(conflict?.type).toBe(ConflictType.VERSION);
      expect(conflict?.localVersion.version).toBe(1);
      expect(conflict?.serverVersion.version).toBe(2);
    });

    it('应该检测内容冲突', () => {
      const localData = { content: 'local' };
      const serverData = { content: 'server' };

      const operation = createMockOperation(localData);
      const conflict = conflictService.detectConflict(operation, serverData);

      expect(conflict).toBeTruthy();
      expect(conflict?.type).toBe(ConflictType.CONTENT);
    });

    it('应该检测并发编辑', () => {
      const timestamp = Date.now();
      const localData = { updatedAt: timestamp };
      const serverData = { updatedAt: timestamp + 500 }; // 500ms内

      const operation = createMockOperation(localData);
      const conflict = conflictService.detectConflict(operation, serverData);

      expect(conflict).toBeTruthy();
      expect(conflict?.type).toBe(ConflictType.CONCURRENT_EDIT);
    });

    it('不应该检测无冲突', () => {
      const data = { version: 1, content: 'same' };
      const operation = createMockOperation(data);
      const conflict = conflictService.detectConflict(operation, data);

      expect(conflict).toBeNull();
    });
  });

  describe('冲突解决', () => {
    const createMockConflict = (
      localData: Record<string, unknown>,
      serverData: Record<string, unknown>
    ) => ({
      id: 'conflict-1',
      type: ConflictType.VERSION,
      resourceType: 'files',
      resourceId: 'file-1',
      localVersion: {
        id: 'local-1',
        version: 1,
        timestamp: Date.now(),
        data: localData,
      },
      serverVersion: {
        id: 'server-1',
        version: 2,
        timestamp: Date.now(),
        data: serverData,
      },
      description: '版本冲突',
      suggestedResolution: 'local' as const,
      autoResolve: true,
    });

    it('应该解决为本地版本', async () => {
      const localData = { content: 'local' };
      const serverData = { content: 'server' };
      const conflict = createMockConflict(localData, serverData);

      const resolved = await conflictService.resolveConflict(conflict, 'local');
      expect(resolved).toEqual(localData);
    });

    it('应该解决为服务器版本', async () => {
      const localData = { content: 'local' };
      const serverData = { content: 'server' };
      const conflict = createMockConflict(localData, serverData);

      const resolved = await conflictService.resolveConflict(conflict, 'server');
      expect(resolved).toEqual(serverData);
    });

    it('应该合并版本', async () => {
      const localData = { version: 1, content: 'local', extra: 'local-extra' };
      const serverData = { version: 2, content: 'server', other: 'server-extra' };
      const conflict = createMockConflict(localData, serverData);

      const resolved = await conflictService.resolveConflict(conflict, 'merge');
      expect(resolved.content).toBe('server'); // 服务器内容优先
      expect(resolved.extra).toBe('local-extra'); // 本地额外字段
      expect(resolved.other).toBe('server-extra'); // 服务器额外字段
      expect(resolved.version).toBe(3); // 版本增加
    });

    it('应该自动解决可自动解决的冲突', async () => {
      const localData = { version: 1, content: 'local' };
      const serverData = { version: 2, content: 'server' };
      const conflict = createMockConflict(localData, serverData);
      conflict.autoResolve = true;

      const resolved = await conflictService.autoResolveConflict(conflict);
      expect(resolved).toBeTruthy();
    });

    it('不应该自动解决不可自动解决的冲突', async () => {
      const localData = { content: 'local' };
      const serverData = { content: 'server' };
      const conflict = createMockConflict(localData, serverData);
      conflict.autoResolve = false;

      await expect(conflictService.autoResolveConflict(conflict)).rejects.toThrow();
    });
  });

  describe('差异计算', () => {
    it('应该正确计算差异', () => {
      const localData = {
        field1: 'value1',
        field2: 'value2',
        field3: 'same',
      };
      const serverData = {
        field1: 'value1-modified',
        field2: 'value2',
        field4: 'value4',
      };

      const diff = conflictService.getConflictDiff(localData, serverData);

      expect(diff.added).toHaveProperty('field4');
      expect(diff.removed).toHaveProperty('field3');
      expect(diff.modified).toHaveProperty('field1');
      expect(diff.modified.field1.local).toBe('value1');
      expect(diff.modified.field1.server).toBe('value1-modified');
    });

    it('应该处理空差异', () => {
      const data = { field1: 'value1' };
      const diff = conflictService.getConflictDiff(data, data);

      expect(Object.keys(diff.added)).toHaveLength(0);
      expect(Object.keys(diff.removed)).toHaveLength(0);
      expect(Object.keys(diff.modified)).toHaveLength(0);
    });
  });

  describe('批量检测', () => {
    it('应该批量检测冲突', () => {
      const localData1 = { version: 1, content: 'local1' };
      const localData2 = { version: 2, content: 'local2' };
      const serverData1 = { version: 2, content: 'server1' };
      const serverData2 = { version: 3, content: 'server2' };

      const operations = [
        {
          id: 'op-1',
          type: 'update' as SyncOperationType,
          priority: 'normal' as SyncPriority,
          status: 'pending' as SyncOperationStatus,
          resourceType: 'files',
          resourceId: 'file-1',
          localData: localData1,
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: 3,
          requiresConfirmation: false,
        },
        {
          id: 'op-2',
          type: 'update' as SyncOperationType,
          priority: 'normal' as SyncPriority,
          status: 'pending' as SyncOperationStatus,
          resourceType: 'files',
          resourceId: 'file-2',
          localData: localData2,
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: 3,
          requiresConfirmation: false,
        },
      ];

      const serverDataMap = new Map([
        ['file-1', serverData1],
        ['file-2', serverData2],
      ]);

      const conflicts = conflictService.detectMultipleConflicts(operations, serverDataMap);
      expect(conflicts).toHaveLength(2);
    });
  });

  describe('策略注册', () => {
    it('应该注册自定义检测策略', () => {
      const initialStrategies = conflictService['detectionStrategies'].length;

      conflictService.registerDetectionStrategy({
        name: 'custom-strategy',
        detect: () => false,
        type: ConflictType.CONTENT,
        priority: 99,
      });

      expect(conflictService['detectionStrategies'].length).toBe(initialStrategies + 1);
    });

    it('应该注册自定义解决策略', () => {
      conflictService.registerResolutionStrategy(ConflictType.CONTENT, {
        name: 'custom-resolution',
        resolve: (local) => local,
        description: '自定义解决',
      });

      const resolutions = conflictService.getAvailableResolutions(ConflictType.CONTENT);
      expect(resolutions.some((r) => r.name === 'custom-resolution')).toBe(true);
    });
  });

  describe('冲突统计', () => {
    it('应该获取冲突统计', () => {
      const stats = conflictService.getConflictStatistics();

      expect(stats).toHaveProperty('totalConflicts');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('autoResolved');
      expect(stats).toHaveProperty('manuallyResolved');
    });
  });
});
