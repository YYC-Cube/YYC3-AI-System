/**
 * @file conflict-resolution-service.ts
 * @description YYC³便携式智能AI系统 - 冲突解决服务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,conflict,merge,sync,critical
 */

import { ConflictType } from '../types/sync';
import type { ConflictInfo, SyncOperation } from '../types/sync';

/**
 * 冲突检测策略
 */
export interface ConflictDetectionStrategy {
  /** 检测方法名称 */
  name: string;
  /** 检测函数 */
  detect: (local: Record<string, unknown>, server: Record<string, unknown>) => boolean;
  /** 冲突类型 */
  type: ConflictType;
  /** 优先级 */
  priority: number;
}

/**
 * 冲突解决策略
 */
export interface ConflictResolutionStrategy {
  /** 解决方法名称 */
  name: string;
  /** 解决函数 */
  resolve: (
    local: Record<string, unknown>,
    server: Record<string, unknown>
  ) => Record<string, unknown>;
  /** 描述 */
  description: string;
}

/**
 * 冲突解决服务类
 * 检测和解决数据同步冲突
 */
export class ConflictResolutionService {
  private static instance: ConflictResolutionService;

  // 冲突检测策略
  private detectionStrategies: ConflictDetectionStrategy[] = [];

  // 冲突解决策略
  private resolutionStrategies: Map<ConflictType, ConflictResolutionStrategy[]> = new Map();

  private constructor() {
    this.initializeStrategies();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ConflictResolutionService {
    if (!ConflictResolutionService.instance) {
      ConflictResolutionService.instance = new ConflictResolutionService();
    }
    return ConflictResolutionService.instance;
  }

  /**
   * 初始化检测和解决策略
   */
  private initializeStrategies(): void {
    // 注册检测策略
    this.registerDetectionStrategy({
      name: 'version-conflict',
      detect: (local, server) => {
        const localVersion = local.version as number;
        const serverVersion = server.version as number;
        return (
          localVersion !== undefined &&
          serverVersion !== undefined &&
          localVersion !== serverVersion
        );
      },
      type: ConflictType.VERSION,
      priority: 1,
    });

    this.registerDetectionStrategy({
      name: 'content-conflict',
      detect: (local, server) => {
        const localCopy = { ...local };
        const serverCopy = { ...server };
        delete localCopy.updatedAt;
        delete serverCopy.updatedAt;
        const localContent = JSON.stringify(localCopy);
        const serverContent = JSON.stringify(serverCopy);
        return localContent !== serverContent;
      },
      type: ConflictType.CONTENT,
      priority: 2,
    });

    this.registerDetectionStrategy({
      name: 'concurrent-edit',
      detect: (local, server) => {
        const localUpdatedAt = local.updatedAt as number;
        const serverUpdatedAt = server.updatedAt as number;
        if (!localUpdatedAt || !serverUpdatedAt) {
          return false;
        }
        const timeDiff = Math.abs(localUpdatedAt - serverUpdatedAt);
        return timeDiff < 1000;
      },
      type: ConflictType.CONCURRENT_EDIT,
      priority: 3,
    });

    // 注册解决策略
    this.registerResolutionStrategy(ConflictType.VERSION, {
      name: 'latest-version',
      resolve: (local, server) => {
        const localVersion = local.version as number;
        const serverVersion = server.version as number;
        return localVersion > serverVersion ? local : server;
      },
      description: '使用最新版本',
    });

    this.registerResolutionStrategy(ConflictType.VERSION, {
      name: 'merge-version',
      resolve: (local, server) => {
        // 简单合并策略
        const merged = { ...local, ...server };
        merged.version =
          Math.max((local.version as number) || 0, (server.version as number) || 0) + 1;
        merged.updatedAt = Date.now();
        return merged;
      },
      description: '合并版本',
    });

    this.registerResolutionStrategy(ConflictType.CONTENT, {
      name: 'latest-timestamp',
      resolve: (local, server) => {
        const localUpdatedAt = local.updatedAt as number;
        const serverUpdatedAt = server.updatedAt as number;
        return localUpdatedAt > serverUpdatedAt ? local : server;
      },
      description: '使用最新时间戳的版本',
    });

    this.registerResolutionStrategy(ConflictType.CONCURRENT_EDIT, {
      name: 'local-priority',
      resolve: (local) => {
        return local;
      },
      description: '优先使用本地版本',
    });
  }

  /**
   * 注册检测策略
   */
  registerDetectionStrategy(strategy: ConflictDetectionStrategy): void {
    this.detectionStrategies.push(strategy);
    // 按优先级排序
    this.detectionStrategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 注册解决策略
   */
  registerResolutionStrategy(
    conflictType: ConflictType,
    strategy: ConflictResolutionStrategy
  ): void {
    if (!this.resolutionStrategies.has(conflictType)) {
      this.resolutionStrategies.set(conflictType, []);
    }
    this.resolutionStrategies.get(conflictType)!.push(strategy);
  }

  /**
   * 检测冲突
   */
  detectConflict(
    operation: SyncOperation,
    serverData: Record<string, unknown>
  ): ConflictInfo | null {
    const { localData, resourceType, resourceId, timestamp } = operation;

    // 按优先级检测冲突
    for (const strategy of this.detectionStrategies) {
      if (strategy.detect(localData, serverData)) {
        return {
          id: `conflict-${operation.id}`,
          type: strategy.type,
          resourceType,
          resourceId,
          localVersion: {
            id: operation.id,
            version: (localData.version as number) || 0,
            timestamp,
            data: localData,
          },
          serverVersion: {
            id: resourceId,
            version: (serverData.version as number) || 0,
            timestamp: (serverData.updatedAt as number) || Date.now(),
            data: serverData,
          },
          description: this.getConflictDescription(strategy.type, localData, serverData),
          suggestedResolution: this.getSuggestedResolution(strategy.type),
          autoResolve: this.canAutoResolve(strategy.type),
        };
      }
    }

    return null;
  }

  /**
   * 获取冲突描述
   */
  private getConflictDescription(
    type: ConflictType,
    local: Record<string, unknown>,
    server: Record<string, unknown>
  ): string {
    switch (type) {
      case ConflictType.VERSION:
        return `版本冲突: 本地版本 ${local.version} vs 服务器版本 ${server.version}`;
      case ConflictType.CONTENT:
        return '内容冲突: 本地和服务器的内容不一致';
      case ConflictType.CONCURRENT_EDIT:
        return '并发编辑: 检测到同时编辑';
      case ConflictType.DELETE_CONFLICT:
        return '删除冲突: 一方删除了资源，另一方修改了资源';
      case ConflictType.REFERENCE:
        return '引用冲突: 资源被其他资源引用';
      default:
        return '未知冲突类型';
    }
  }

  /**
   * 获取建议的解决方案
   */
  private getSuggestedResolution(type: ConflictType): 'local' | 'server' | 'merge' {
    switch (type) {
      case ConflictType.VERSION:
        return 'merge';
      case ConflictType.CONTENT:
        return 'server';
      case ConflictType.CONCURRENT_EDIT:
        return 'local';
      default:
        return 'server';
    }
  }

  /**
   * 判断是否可以自动解决
   */
  private canAutoResolve(type: ConflictType): boolean {
    // 某些冲突类型可以自动解决
    return type === ConflictType.VERSION || type === ConflictType.CONCURRENT_EDIT;
  }

  /**
   * 解决冲突
   */
  async resolveConflict(
    conflict: ConflictInfo,
    resolution: 'local' | 'server' | 'merge',
    strategyName?: string
  ): Promise<Record<string, unknown>> {
    let resolvedData: Record<string, unknown>;

    switch (resolution) {
      case 'local':
        resolvedData = conflict.localVersion.data;
        break;
      case 'server':
        resolvedData = conflict.serverVersion.data;
        break;
      case 'merge':
        // 使用指定的合并策略，或默认合并策略
        const strategies = this.resolutionStrategies.get(conflict.type) || [];
        const strategy = strategyName
          ? strategies.find((s) => s.name === strategyName)
          : strategies.find((s) => s.name.includes('merge'));
        if (strategy) {
          resolvedData = strategy.resolve(conflict.localVersion.data, conflict.serverVersion.data);
        } else {
          // 默认合并
          resolvedData = this.defaultMerge(conflict.localVersion.data, conflict.serverVersion.data);
        }
        break;
      default:
        throw new Error(`不支持的解决方式: ${resolution}`);
    }

    return resolvedData;
  }

  /**
   * 默认合并策略
   */
  private defaultMerge(
    local: Record<string, unknown>,
    server: Record<string, unknown>
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...local, ...server };

    merged.version = Math.max((local.version as number) || 0, (server.version as number) || 0) + 1;
    merged.updatedAt = Date.now();

    return merged;
  }

  /**
   * 自动解决冲突
   */
  async autoResolveConflict(conflict: ConflictInfo): Promise<Record<string, unknown>> {
    if (!conflict.autoResolve) {
      throw new Error('此冲突不能自动解决，需要手动选择');
    }

    // 使用建议的解决方式
    return this.resolveConflict(conflict, conflict.suggestedResolution);
  }

  /**
   * 批量检测冲突
   */
  detectMultipleConflicts(
    operations: SyncOperation[],
    serverDataMap: Map<string, Record<string, unknown>>
  ): ConflictInfo[] {
    const conflicts: ConflictInfo[] = [];

    operations.forEach((operation) => {
      const serverData = serverDataMap.get(operation.resourceId);
      if (serverData) {
        const conflict = this.detectConflict(operation, serverData);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    });

    return conflicts;
  }

  /**
   * 获取可用的解决策略
   */
  getAvailableResolutions(conflictType: ConflictType): ConflictResolutionStrategy[] {
    return this.resolutionStrategies.get(conflictType) || [];
  }

  /**
   * 获取冲突差异
   */
  getConflictDiff(
    local: Record<string, unknown>,
    server: Record<string, unknown>
  ): {
    added: Record<string, unknown>;
    removed: Record<string, unknown>;
    modified: Record<string, { local: unknown; server: unknown }>;
  } {
    const added: Record<string, unknown> = {};
    const removed: Record<string, unknown> = {};
    const modified: Record<string, { local: unknown; server: unknown }> = {};

    const allKeys = new Set([...Object.keys(local), ...Object.keys(server)]);

    allKeys.forEach((key) => {
      const localValue = local[key];
      const serverValue = server[key];

      if (localValue === undefined) {
        added[key] = serverValue;
      } else if (serverValue === undefined) {
        removed[key] = localValue;
      } else if (localValue !== serverValue) {
        modified[key] = { local: localValue, server: serverValue };
      }
    });

    return { added, removed, modified };
  }

  /**
   * 获取冲突统计
   */
  getConflictStatistics(): {
    totalConflicts: number;
    byType: Record<ConflictType, number>;
    autoResolved: number;
    manuallyResolved: number;
  } {
    // 这里简化实现，实际应该从存储中读取统计
    return {
      totalConflicts: 0,
      byType: {
        [ConflictType.VERSION]: 0,
        [ConflictType.CONTENT]: 0,
        [ConflictType.DELETE_CONFLICT]: 0,
        [ConflictType.CONCURRENT_EDIT]: 0,
        [ConflictType.REFERENCE]: 0,
      },
      autoResolved: 0,
      manuallyResolved: 0,
    };
  }
}
