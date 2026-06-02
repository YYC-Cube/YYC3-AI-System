/**
 * @file sync-manager-service.test.ts
 * @description YYC³便携式智能AI系统 - 同步管理服务测试
 * Sync Manager Service Test
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-26
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,service,sync,manager
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

import { SyncManagerService } from '../sync-manager-service';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('SyncManagerService - Singleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  test('should return same instance', () => {
    const instance1 = SyncManagerService.getInstance();
    const instance2 = SyncManagerService.getInstance();

    expect(instance1).toBe(instance2);
  });

  test('should be a class instance', () => {
    const instance = SyncManagerService.getInstance();
    expect(instance).toBeInstanceOf(SyncManagerService);
  });
});

describe('SyncManagerService - Sync Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置配置到默认值
    const service = SyncManagerService.getInstance();
    service.updateConfig({
      autoSync: true,
      syncInterval: 5 * 60 * 1000,
      maxConcurrentSyncs: 3,
      syncTimeout: 30 * 1000,
    });
  });

  test('should have default config', () => {
    const service = SyncManagerService.getInstance();
    const config = service.getConfig();

    expect(config).toBeDefined();
    expect(config).toHaveProperty('autoSync');
    expect(config).toHaveProperty('syncInterval');
    expect(config).toHaveProperty('maxConcurrentSyncs');
    expect(config).toHaveProperty('syncTimeout');
    expect(config).toHaveProperty('priorityWeights');
  });

  test('should update config', () => {
    const service = SyncManagerService.getInstance();
    const newConfig = {
      autoSync: false,
      syncInterval: 10 * 60 * 1000,
      maxConcurrentSyncs: 5,
      syncTimeout: 60 * 1000,
    };

    expect(() => service.updateConfig(newConfig)).not.toThrow();
  });

  test('should handle autoSync config', () => {
    const service = SyncManagerService.getInstance();

    const config = service.getConfig();
    expect(config.autoSync).toBe(true);

    service.updateConfig({ autoSync: false });
    const updatedConfig = service.getConfig();
    expect(updatedConfig.autoSync).toBe(false);

    // 恢复默认
    service.updateConfig({ autoSync: true });
  });
});

describe('SyncManagerService - Sync Statistics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should have initial statistics', () => {
    const service = SyncManagerService.getInstance();
    const stats = service.getStatistics();

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty('totalSyncs');
    expect(stats).toHaveProperty('successCount');
    expect(stats).toHaveProperty('failureCount');
    expect(stats).toHaveProperty('conflictCount');
    expect(stats).toHaveProperty('averageSyncTime');
    expect(stats).toHaveProperty('lastSyncTime');
    expect(stats).toHaveProperty('pendingOperations');

    expect(stats.totalSyncs).toBe(0);
    expect(stats.successCount).toBe(0);
    expect(stats.failureCount).toBe(0);
    expect(stats.conflictCount).toBe(0);
  });
});

describe('SyncManagerService - Priority Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should respect priority weights', () => {
    const service = SyncManagerService.getInstance();
    const config = service.getConfig();

    expect(config.priorityWeights).toBeDefined();
    expect(config.priorityWeights).toHaveProperty('critical');
    expect(config.priorityWeights).toHaveProperty('high');
    expect(config.priorityWeights).toHaveProperty('normal');
    expect(config.priorityWeights).toHaveProperty('low');

    expect(config.priorityWeights.critical).toBeGreaterThan(config.priorityWeights.high);
    expect(config.priorityWeights.high).toBeGreaterThan(config.priorityWeights.normal);
    expect(config.priorityWeights.normal).toBeGreaterThan(config.priorityWeights.low);
  });
});

describe('SyncManagerService - Sync Status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  test('should track sync status', async () => {
    const service = SyncManagerService.getInstance();

    const status = service.getSyncStatus();

    expect(status).toBeDefined();
    expect(status).toHaveProperty('isOnline');
    expect(status).toHaveProperty('isSyncing');
    expect(status).toHaveProperty('pendingCount');
  });
});

describe('SyncManagerService - Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should destroy service without error', () => {
    const service = SyncManagerService.getInstance();

    expect(() => service.destroy()).not.toThrow();
  });
});
