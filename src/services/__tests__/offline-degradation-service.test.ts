/**
 * @file offline-degradation-service.test.ts
 * @description YYC³便携式智能AI系统 - 离线降级服务测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-26
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,offline,degradation,service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies before importing the service
vi.mock('../storage-service', () => ({
  StorageService: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      ensureDB: vi.fn().mockResolvedValue(undefined),
      saveSession: vi.fn().mockResolvedValue(undefined),
      getSession: vi.fn().mockResolvedValue(null),
      getAllSessions: vi.fn().mockResolvedValue([]),
    })),
  },
}));

vi.mock('../websocket-service', () => ({
  WebSocketService: {
    getInstance: vi.fn(() => ({
      on: vi.fn(),
      off: vi.fn(),
      getState: vi.fn(() => 'CONNECTED'),
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
  },
}));

vi.mock('../sync-queue-service', () => ({
  SyncQueueService: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      getPendingOperations: vi.fn().mockResolvedValue([]),
      markAsSuccess: vi.fn().mockResolvedValue(undefined),
      markAsFailed: vi.fn().mockResolvedValue(undefined),
      clearQueue: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

import {
  OfflineState,
  DegradationStrategy,
  OfflineOperationType,
  OfflineEventType,
  FeatureAvailability,
} from '../../types/offline';
import { OfflineDegradationService } from '../offline-degradation-service';

describe('OfflineDegradationService', () => {
  let service: OfflineDegradationService;

  beforeEach(() => {
    // Reset singleton
    (OfflineDegradationService as unknown).instance = undefined;
    service = OfflineDegradationService.getInstance();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('初始化', () => {
    it('应该成功初始化服务', async () => {
      await service.initialize();

      const status = service.getOfflineState();
      expect(status).toBe(OfflineState.ONLINE);
    });

    it('应该支持重复初始化', async () => {
      await service.initialize();
      await service.initialize();

      const status = service.getOfflineState();
      expect(status).toBe(OfflineState.ONLINE);
    });
  });

  describe('状态管理', () => {
    it('应该正确获取离线状态', async () => {
      await service.initialize();

      const state = service.getOfflineState();
      expect(state).toBe(OfflineState.ONLINE);
    });

    it('应该正确获取离线状态信息', async () => {
      await service.initialize();

      const status = service.getOfflineStatus();

      expect(status).toBeDefined();
      expect(status.state).toBe(OfflineState.ONLINE);
      expect(status.isOnline).toBe(true);
      expect(status.queuedOperations).toBeGreaterThanOrEqual(0);
      expect(status.succeededOperations).toBeGreaterThanOrEqual(0);
      expect(status.failedOperations).toBeGreaterThanOrEqual(0);
      expect(status.lastUpdated).toBeGreaterThan(0);
    });

    it('应该正确检查功能可用性', async () => {
      await service.initialize();

      const availability = service.checkFeatureAvailability('test-feature');
      expect([FeatureAvailability.AVAILABLE, FeatureAvailability.UNAVAILABLE]).toContain(
        availability
      );
    });
  });

  describe('配置管理', () => {
    it('应该正确获取默认配置', async () => {
      await service.initialize();

      const config = service.getConfig();

      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
      expect(config.autoDetectOnline).toBe(true);
      expect(config.onlineCheckInterval).toBe(5000);
      expect(config.maxQueueSize).toBe(100);
      expect(config.maxRetryCount).toBe(3);
      expect(config.retryInterval).toBe(3000);
      expect(config.autoSyncEnabled).toBe(true);
      expect(config.autoSyncInterval).toBe(30000);
      expect(config.defaultDegradationStrategy).toBe(DegradationStrategy.QUEUE);
    });

    it('应该正确更新配置', async () => {
      await service.initialize();

      await service.updateConfig({
        maxQueueSize: 200,
        maxRetryCount: 5,
        autoSyncEnabled: false,
      });

      const config = service.getConfig();
      expect(config.maxQueueSize).toBe(200);
      expect(config.maxRetryCount).toBe(5);
      expect(config.autoSyncEnabled).toBe(false);
    });
  });

  describe('统计信息', () => {
    it('应该正确获取统计信息', async () => {
      await service.initialize();

      const statistics = service.getStatistics();

      expect(statistics).toBeDefined();
      expect(statistics.totalOfflineTime).toBeGreaterThanOrEqual(0);
      expect(statistics.totalOfflineCount).toBeGreaterThanOrEqual(0);
      expect(statistics.totalQueueOperations).toBeGreaterThanOrEqual(0);
      expect(statistics.successOperations).toBeGreaterThanOrEqual(0);
      expect(statistics.failedOperations).toBeGreaterThanOrEqual(0);
    });
  });

  describe('离线操作处理', () => {
    it('应该正确处理在线时的操作', async () => {
      await service.initialize();

      const result = await service.handleOfflineOperation(
        OfflineOperationType.CREATE,
        'test-resource',
        { data: 'test' }
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.degraded).toBe(false);
    });

    it('应该正确处理在线时带策略参数的操作（忽略策略）', async () => {
      await service.initialize();

      const result = await service.handleOfflineOperation(
        OfflineOperationType.QUERY,
        'test-resource',
        { data: 'test' },
        {
          strategy: DegradationStrategy.SILENT,
        }
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.degraded).toBe(false);
    });

    it('应该正确处理在线时带错误策略参数的操作（忽略策略）', async () => {
      await service.initialize();

      const result = await service.handleOfflineOperation(
        OfflineOperationType.DELETE,
        'test-resource',
        { data: 'test' },
        {
          strategy: DegradationStrategy.ERROR,
        }
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.degraded).toBe(false);
    });
  });

  describe('事件系统', () => {
    it('应该正确添加事件监听器', async () => {
      await service.initialize();

      const listener = vi.fn();
      expect(() => service.on(OfflineEventType.ONLINE, listener)).not.toThrow();
    });

    it('应该正确移除事件监听器', async () => {
      await service.initialize();

      const listener = vi.fn();
      service.on(OfflineEventType.ONLINE, listener);
      expect(() => service.off(OfflineEventType.ONLINE, listener)).not.toThrow();
    });
  });

  describe('队列管理', () => {
    it('应该正确清空队列', async () => {
      await service.initialize();

      service.clearQueue();

      const status = service.getOfflineStatus();
      expect(status.queuedOperations).toBe(0);
    });

    it('应该正确触发同步', async () => {
      await service.initialize();

      const syncPromise = service.syncNow();
      expect(syncPromise).toBeInstanceOf(Promise);
    });
  });

  describe('销毁', () => {
    it('应该正确销毁服务', async () => {
      await service.initialize();

      expect(() => service.destroy()).not.toThrow();
    });
  });
});
