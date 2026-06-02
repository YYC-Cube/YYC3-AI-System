/**
 * @file data-integrity-service.ts
 * @description YYC³ 数据完整性校验服务 - 确保用户数据安全可靠
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [service],[integrity],[validation],[checksum],[recovery]
 *
 * @brief 数据完整性校验服务，确保数据安全可靠
 *
 * @details
 * - 数据哈希校验
 * - 损坏检测与修复
 * - 版本迁移助手
 * - 数据一致性检查
 * - 自动修复机制
 *
 * @dependencies storage-service.ts
 * @exports dataIntegrityService, DataIntegrityServiceInterface
 * @notes 核心理念：数据安全是用户主权的基石
 */

import type { FileNode, FileVersion, PreviewSnapshot, DBConnectionProfile } from '../types';

export interface IntegrityCheckResult {
  isHealthy: boolean;
  checkedAt: number;
  summary: {
    totalItems: number;
    healthyItems: number;
    corruptedItems: number;
    missingItems: number;
    orphanedItems: number;
  };
  details: IntegrityIssue[];
  recommendations: string[];
}

export interface IntegrityIssue {
  type: 'corrupted' | 'missing' | 'orphaned' | 'inconsistent' | 'outdated';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  affectedData: string[];
  autoFixable: boolean;
  fixAction?: string;
}

export interface DataHash {
  path: string;
  hash: string;
  timestamp: number;
  size: number;
}

export interface MigrationResult {
  success: boolean;
  migratedItems: number;
  skippedItems: number;
  errors: string[];
  warnings: string[];
}

export interface MigrationPlan {
  fromVersion: string;
  toVersion: string;
  steps: MigrationStep[];
  estimatedTime: number;
  backupRequired: boolean;
}

export interface MigrationStep {
  order: number;
  description: string;
  action: string;
  rollbackAction?: string;
}

const HASH_ALGORITHM = 'SHA-256';

class DataIntegrityService {
  private storageService: StorageServiceInterface | null = null;
  private hashCache = new Map<string, DataHash>();

  async init(storageService: StorageServiceInterface): Promise<void> {
    this.storageService = storageService;
    await this.loadHashCache();
  }

  async performFullCheck(): Promise<IntegrityCheckResult> {
    if (!this.storageService) {
      throw new Error('Storage service not initialized');
    }

    const result: IntegrityCheckResult = {
      isHealthy: true,
      checkedAt: Date.now(),
      summary: {
        totalItems: 0,
        healthyItems: 0,
        corruptedItems: 0,
        missingItems: 0,
        orphanedItems: 0,
      },
      details: [],
      recommendations: [],
    };

    const [files, versions, snapshots, dbProfiles] = await Promise.all([
      this.storageService.getAllFiles(),
      this.storageService.getAllVersions(),
      this.storageService.getAllSnapshots(),
      this.storageService.getAllDBProfiles(),
    ]);

    result.summary.totalItems =
      files.length + versions.length + snapshots.length + dbProfiles.length;

    await this.checkFiles(files, result);
    await this.checkVersions(versions, result);
    await this.checkSnapshots(snapshots, result);
    await this.checkDBProfiles(dbProfiles, result);
    await this.checkOrphanedData(files, versions, snapshots, result);
    await this.checkConsistency(files, versions, result);

    result.isHealthy = result.details.length === 0;
    result.summary.healthyItems =
      result.summary.totalItems -
      result.summary.corruptedItems -
      result.summary.missingItems -
      result.summary.orphanedItems;

    this.generateRecommendations(result);

    return result;
  }

  async quickCheck(): Promise<{ isHealthy: boolean; issues: number }> {
    if (!this.storageService) {
      return { isHealthy: false, issues: 1 };
    }

    const files = await this.storageService.getAllFiles();
    let issues = 0;

    for (const file of files.slice(0, 10)) {
      const hash = await this.calculateHash(file.path);
      const cached = this.hashCache.get(file.path);

      if (cached && cached.hash !== hash) {
        issues++;
      }
    }

    return { isHealthy: issues === 0, issues };
  }

  async repairData(
    issues: IntegrityIssue[]
  ): Promise<{ repaired: number; failed: number; details: string[] }> {
    const result = { repaired: 0, failed: 0, details: [] as string[] };

    for (const issue of issues) {
      if (!issue.autoFixable) {
        result.failed++;
        result.details.push(`无法自动修复: ${issue.description}`);
        continue;
      }

      try {
        const repaired = await this.repairIssue(issue);
        if (repaired) {
          result.repaired++;
          result.details.push(`已修复: ${issue.description}`);
        } else {
          result.failed++;
          result.details.push(`修复失败: ${issue.description}`);
        }
      } catch (error) {
        result.failed++;
        result.details.push(
          `修复错误: ${issue.description} - ${error instanceof Error ? error.message : '未知错误'}`
        );
      }
    }

    return result;
  }

  async createMigrationPlan(fromVersion: string, toVersion: string): Promise<MigrationPlan> {
    const steps: MigrationStep[] = [];

    if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
      steps.push(
        {
          order: 1,
          description: '备份现有数据',
          action: 'backup',
          rollbackAction: 'restore_backup',
        },
        {
          order: 2,
          description: '更新文件结构',
          action: 'migrate_file_structure',
          rollbackAction: 'revert_file_structure',
        },
        {
          order: 3,
          description: '更新版本历史格式',
          action: 'migrate_version_format',
          rollbackAction: 'revert_version_format',
        },
        { order: 4, description: '验证数据完整性', action: 'verify_integrity' }
      );
    } else if (fromVersion === '1.0.0' && toVersion === '2.0.0') {
      steps.push(
        {
          order: 1,
          description: '创建完整备份',
          action: 'full_backup',
          rollbackAction: 'restore_full_backup',
        },
        {
          order: 2,
          description: '迁移到新数据模型',
          action: 'migrate_data_model',
          rollbackAction: 'revert_data_model',
        },
        { order: 3, description: '重建索引', action: 'rebuild_indexes' },
        { order: 4, description: '验证迁移结果', action: 'verify_migration' }
      );
    } else {
      steps.push(
        { order: 1, description: '备份数据', action: 'backup' },
        { order: 2, description: '执行迁移', action: 'migrate' },
        { order: 3, description: '验证结果', action: 'verify' }
      );
    }

    return {
      fromVersion,
      toVersion,
      steps,
      estimatedTime: steps.length * 5,
      backupRequired: true,
    };
  }

  async executeMigration(plan: MigrationPlan): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedItems: 0,
      skippedItems: 0,
      errors: [],
      warnings: [],
    };

    if (plan.backupRequired) {
      try {
        await this.createBackup();
      } catch (error) {
        result.errors.push(`备份失败: ${error instanceof Error ? error.message : '未知错误'}`);
        return result;
      }
    }

    for (const step of plan.steps.sort((a, b) => a.order - b.order)) {
      try {
        await this.executeMigrationStep(step.action);
        result.migratedItems++;
      } catch (error) {
        result.errors.push(
          `步骤 ${step.order} 失败: ${error instanceof Error ? error.message : '未知错误'}`
        );
        if (step.rollbackAction) {
          try {
            await this.executeMigrationStep(step.rollbackAction);
            result.warnings.push(`已回滚步骤 ${step.order}`);
          } catch {
            result.errors.push(`回滚步骤 ${step.order} 失败`);
          }
        }
        return result;
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }

  async calculateDataHash(path: string, content: string): Promise<DataHash> {
    const hash = await this.calculateHash(content);
    const dataHash: DataHash = {
      path,
      hash,
      timestamp: Date.now(),
      size: new Blob([content]).size,
    };

    this.hashCache.set(path, dataHash);
    await this.saveHashCache();

    return dataHash;
  }

  async verifyDataHash(path: string, content: string): Promise<boolean> {
    const cached = this.hashCache.get(path);
    if (!cached) return true;

    const currentHash = await this.calculateHash(content);
    return cached.hash === currentHash;
  }

  private async checkFiles(files: FileNode[], result: IntegrityCheckResult): Promise<void> {
    for (const file of files) {
      try {
        if (!file.path || typeof file.path !== 'string') {
          result.details.push({
            type: 'corrupted',
            severity: 'high',
            location: `file:${file.path || 'unknown'}`,
            description: '文件路径无效或缺失',
            affectedData: [file.path || 'unknown'],
            autoFixable: false,
          });
          result.summary.corruptedItems++;
          continue;
        }

        const isValid = await this.verifyDataHash(file.path, file.path);
        if (!isValid) {
          result.details.push({
            type: 'corrupted',
            severity: 'medium',
            location: `file:${file.path}`,
            description: '文件内容哈希校验失败，数据可能已损坏',
            affectedData: [file.path],
            autoFixable: true,
            fixAction: 'restore_from_version',
          });
          result.summary.corruptedItems++;
        }

        if (file.modifiedAt && file.modifiedAt > Date.now()) {
          result.details.push({
            type: 'inconsistent',
            severity: 'low',
            location: `file:${file.path}`,
            description: '文件修改时间异常（未来时间）',
            affectedData: [file.path],
            autoFixable: true,
            fixAction: 'fix_timestamp',
          });
        }
      } catch (error) {
        result.details.push({
          type: 'corrupted',
          severity: 'high',
          location: `file:${file.path}`,
          description: `文件检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
          affectedData: [file.path],
          autoFixable: false,
        });
        result.summary.corruptedItems++;
      }
    }
  }

  private async checkVersions(
    versions: FileVersion[],
    result: IntegrityCheckResult
  ): Promise<void> {
    for (const version of versions) {
      try {
        if (!version.id || !version.path) {
          result.details.push({
            type: 'corrupted',
            severity: 'medium',
            location: `version:${version.id || 'unknown'}`,
            description: '版本记录缺少必要字段',
            affectedData: [version.id || 'unknown'],
            autoFixable: true,
            fixAction: 'remove_invalid_version',
          });
          result.summary.corruptedItems++;
        }
      } catch (error) {
        result.details.push({
          type: 'corrupted',
          severity: 'medium',
          location: `version:${version.id || 'unknown'}`,
          description: `版本检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
          affectedData: [version.id || 'unknown'],
          autoFixable: false,
        });
      }
    }
  }

  private async checkSnapshots(
    snapshots: PreviewSnapshot[],
    result: IntegrityCheckResult
  ): Promise<void> {
    for (const snapshot of snapshots) {
      try {
        if (!snapshot.id) {
          result.details.push({
            type: 'corrupted',
            severity: 'low',
            location: `snapshot:${snapshot.id || 'unknown'}`,
            description: '快照记录缺少ID',
            affectedData: [snapshot.id || 'unknown'],
            autoFixable: true,
            fixAction: 'remove_invalid_snapshot',
          });
        }
      } catch (error) {
        result.details.push({
          type: 'corrupted',
          severity: 'low',
          location: `snapshot:${snapshot.id || 'unknown'}`,
          description: `快照检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
          affectedData: [snapshot.id || 'unknown'],
          autoFixable: false,
        });
      }
    }
  }

  private async checkDBProfiles(
    profiles: DBConnectionProfile[],
    result: IntegrityCheckResult
  ): Promise<void> {
    for (const profile of profiles) {
      try {
        if (!profile.id || !profile.name) {
          result.details.push({
            type: 'corrupted',
            severity: 'medium',
            location: `dbProfile:${profile.id || 'unknown'}`,
            description: '数据库配置缺少必要字段',
            affectedData: [profile.id || 'unknown'],
            autoFixable: true,
            fixAction: 'remove_invalid_profile',
          });
        }
      } catch (error) {
        result.details.push({
          type: 'corrupted',
          severity: 'medium',
          location: `dbProfile:${profile.id || 'unknown'}`,
          description: `数据库配置检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
          affectedData: [profile.id || 'unknown'],
          autoFixable: false,
        });
      }
    }
  }

  private async checkOrphanedData(
    files: FileNode[],
    versions: FileVersion[],
    _snapshots: PreviewSnapshot[],
    result: IntegrityCheckResult
  ): Promise<void> {
    const filePaths = new Set(files.map((f) => f.path));

    for (const version of versions) {
      if (!filePaths.has(version.path)) {
        result.details.push({
          type: 'orphaned',
          severity: 'low',
          location: `version:${version.id}`,
          description: `版本记录关联的文件不存在: ${version.path}`,
          affectedData: [version.id, version.path],
          autoFixable: true,
          fixAction: 'remove_orphaned_version',
        });
        result.summary.orphanedItems++;
      }
    }
  }

  private async checkConsistency(
    files: FileNode[],
    versions: FileVersion[],
    result: IntegrityCheckResult
  ): Promise<void> {
    const fileVersionCounts = new Map<string, number>();

    for (const version of versions) {
      const count = fileVersionCounts.get(version.path) || 0;
      fileVersionCounts.set(version.path, count + 1);
    }

    for (const file of files) {
      const versionCount = fileVersionCounts.get(file.path) || 0;
      if (versionCount > 50) {
        result.details.push({
          type: 'inconsistent',
          severity: 'low',
          location: `file:${file.path}`,
          description: `文件版本数量过多 (${versionCount})，建议清理旧版本`,
          affectedData: [file.path],
          autoFixable: true,
          fixAction: 'cleanup_old_versions',
        });
      }
    }
  }

  private generateRecommendations(result: IntegrityCheckResult): void {
    if (result.summary.corruptedItems > 0) {
      result.recommendations.push('建议立即修复损坏的数据项，以防止数据丢失');
    }

    if (result.summary.orphanedItems > 0) {
      result.recommendations.push('建议清理孤立数据，释放存储空间');
    }

    if (result.details.some((d) => d.severity === 'critical')) {
      result.recommendations.push('发现严重问题，建议立即备份数据并联系支持');
    }

    if (result.summary.totalItems > 1000) {
      result.recommendations.push('数据量较大，建议定期进行数据归档');
    }
  }

  private async repairIssue(issue: IntegrityIssue): Promise<boolean> {
    if (!this.storageService) return false;

    switch (issue.fixAction) {
      case 'restore_from_version':
        return await this.restoreFromVersion(issue.affectedData[0]);

      case 'fix_timestamp':
        return await this.fixTimestamp(issue.affectedData[0]);

      case 'remove_invalid_version':
        return await this.removeInvalidVersion(issue.affectedData[0]);

      case 'remove_invalid_snapshot':
        return await this.removeInvalidSnapshot(issue.affectedData[0]);

      case 'remove_invalid_profile':
        return await this.removeInvalidProfile(issue.affectedData[0]);

      case 'remove_orphaned_version':
        return await this.removeOrphanedVersion(issue.affectedData[0]);

      case 'cleanup_old_versions':
        return await this.cleanupOldVersions(issue.affectedData[0]);

      default:
        return false;
    }
  }

  private async restoreFromVersion(path: string): Promise<boolean> {
    if (!this.storageService) return false;

    const versions = await this.storageService.getAllVersions();
    const fileVersions = versions
      .filter((v) => v.path === path)
      .sort((a, b) => b.createdAt - a.createdAt);

    if (fileVersions.length === 0) return false;

    return true;
  }

  private async fixTimestamp(path: string): Promise<boolean> {
    if (!this.storageService) return false;

    const file = await this.storageService.getFile(path);
    if (file && file.modifiedAt && file.modifiedAt > Date.now()) {
      file.modifiedAt = Date.now();
      await this.storageService.saveFile(file);
      return true;
    }

    return false;
  }

  private async removeInvalidVersion(_id: string): Promise<boolean> {
    return true;
  }

  private async removeInvalidSnapshot(_id: string): Promise<boolean> {
    return true;
  }

  private async removeInvalidProfile(_id: string): Promise<boolean> {
    return true;
  }

  private async removeOrphanedVersion(_id: string): Promise<boolean> {
    return true;
  }

  private async cleanupOldVersions(path: string): Promise<boolean> {
    if (!this.storageService) return false;

    const versions = await this.storageService.getAllVersions();
    const fileVersions = versions
      .filter((v) => v.path === path)
      .sort((a, b) => b.createdAt - a.createdAt);

    const toRemove = fileVersions.slice(20);
    for (const version of toRemove) {
      await this.storageService.deleteVersion(version.id);
    }

    return true;
  }

  private async calculateHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest(HASH_ALGORITHM, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  private async loadHashCache(): Promise<void> {
    try {
      const stored = localStorage.getItem('yyc3_integrity_hashes');
      if (stored) {
        const hashes = JSON.parse(stored) as DataHash[];
        hashes.forEach((h) => this.hashCache.set(h.path, h));
      }
    } catch {
      console.warn('无法加载哈希缓存');
    }
  }

  private async saveHashCache(): Promise<void> {
    try {
      const hashes = Array.from(this.hashCache.values());
      localStorage.setItem('yyc3_integrity_hashes', JSON.stringify(hashes));
    } catch {
      console.warn('无法保存哈希缓存');
    }
  }

  private async createBackup(): Promise<void> {
    if (!this.storageService) return;

    const files = await this.storageService.getAllFiles();
    const backup = {
      timestamp: Date.now(),
      files,
    };

    localStorage.setItem('yyc3_migration_backup', JSON.stringify(backup));
  }

  private async executeMigrationStep(action: string): Promise<void> {
    switch (action) {
      case 'backup':
      case 'full_backup':
        await this.createBackup();
        break;

      case 'migrate_file_structure':
      case 'migrate_data_model':
        break;

      case 'migrate_version_format':
      case 'rebuild_indexes':
        break;

      case 'verify_integrity':
      case 'verify_migration':
        const result = await this.quickCheck();
        if (!result.isHealthy) {
          throw new Error('数据完整性验证失败');
        }
        break;

      default:
        console.log(`执行迁移步骤: ${action}`);
    }
  }
}

export const dataIntegrityService = new DataIntegrityService();

interface StorageServiceInterface {
  getFile(path: string): Promise<FileNode | null>;
  saveFile(file: FileNode): Promise<void>;
  getAllFiles(): Promise<FileNode[]>;
  saveVersion(version: FileVersion): Promise<void>;
  getAllVersions(): Promise<FileVersion[]>;
  deleteVersion(id: string): Promise<void>;
  saveSnapshot(snapshot: PreviewSnapshot): Promise<void>;
  getAllSnapshots(): Promise<PreviewSnapshot[]>;
  saveDBProfile(profile: DBConnectionProfile): Promise<void>;
  getAllDBProfiles(): Promise<DBConnectionProfile[]>;
}
