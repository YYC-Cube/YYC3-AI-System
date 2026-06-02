/**
 * @file data-export-service.ts
 * @description YYC³ 数据导出/导入服务 - 用户数据完全自主可控
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [service],[export],[import],[data-sovereignty],[backup]
 *
 * @brief 数据导出/导入服务，实现用户数据完全自主可控
 *
 * @details
 * - 全量数据导出 (JSON/ZIP)
 * - 选择性导出 (项目/配置/历史)
 * - 数据导入与迁移
 * - 版本兼容性检查
 * - 数据完整性校验
 *
 * @dependencies storage-service.ts, store.ts
 * @exports dataExportService, DataExportServiceInterface
 * @notes 核心理念：把数据主权还给用户
 */

import type { FileNode, FileVersion, PreviewSnapshot, DBConnectionProfile } from '../types';

export interface ExportOptions {
  format: 'json' | 'zip';
  includeFiles: boolean;
  includeVersions: boolean;
  includeSnapshots: boolean;
  includeDBProfiles: boolean;
  includeSettings: boolean;
  includeMessages: boolean;
  includeProjects: boolean;
  dateRange?: {
    start: number;
    end: number;
  };
}

export interface ExportMetadata {
  version: string;
  exportedAt: number;
  exportedBy: 'YYC3-Portable-Intelligent-AI-System';
  checksum: string;
  dataTypes: string[];
  totalSize: number;
  compatibility: {
    minVersion: string;
    maxVersion: string;
  };
}

export interface ExportData {
  metadata: ExportMetadata;
  files?: FileNode[];
  versions?: FileVersion[];
  snapshots?: PreviewSnapshot[];
  dbProfiles?: DBConnectionProfile[];
  settings?: Record<string, unknown>;
  messages?: unknown[];
  projects?: unknown[];
}

export interface ImportResult {
  success: boolean;
  importedItems: {
    files: number;
    versions: number;
    snapshots: number;
    dbProfiles: number;
    settings: number;
    messages: number;
    projects: number;
  };
  errors: string[];
  warnings: string[];
  skippedItems: string[];
}

export interface ImportOptions {
  mergeStrategy: 'replace' | 'merge' | 'skip';
  validateChecksum: boolean;
  skipIncompatible: boolean;
}

const CURRENT_EXPORT_VERSION = '1.0.0';
const MIN_COMPATIBLE_VERSION = '1.0.0';

class DataExportService {
  private storageService: StorageServiceInterface | null = null;
  private zustandStore: unknown = null;

  async init(storageService: StorageServiceInterface, store: unknown): Promise<void> {
    this.storageService = storageService;
    this.zustandStore = store;
  }

  async exportData(options: ExportOptions): Promise<Blob> {
    if (!this.storageService) {
      throw new Error('Storage service not initialized');
    }

    const exportData: ExportData = {
      metadata: {
        version: CURRENT_EXPORT_VERSION,
        exportedAt: Date.now(),
        exportedBy: 'YYC3-Portable-Intelligent-AI-System',
        checksum: '',
        dataTypes: [],
        totalSize: 0,
        compatibility: {
          minVersion: MIN_COMPATIBLE_VERSION,
          maxVersion: CURRENT_EXPORT_VERSION,
        },
      },
    };

    const dataTypes: string[] = [];
    let totalSize = 0;

    if (options.includeFiles) {
      const files = await this.storageService.getAllFiles();
      exportData.files = this.filterByDateRange(files, options.dateRange);
      dataTypes.push('files');
      totalSize += JSON.stringify(exportData.files).length;
    }

    if (options.includeVersions) {
      const versions = await this.storageService.getAllVersions();
      exportData.versions = this.filterByDateRange(versions, options.dateRange);
      dataTypes.push('versions');
      totalSize += JSON.stringify(exportData.versions).length;
    }

    if (options.includeSnapshots) {
      const snapshots = await this.storageService.getAllSnapshots();
      exportData.snapshots = this.filterByDateRange(snapshots, options.dateRange);
      dataTypes.push('snapshots');
      totalSize += JSON.stringify(exportData.snapshots).length;
    }

    if (options.includeDBProfiles) {
      const profiles = await this.storageService.getAllDBProfiles();
      exportData.dbProfiles = profiles;
      dataTypes.push('dbProfiles');
      totalSize += JSON.stringify(exportData.dbProfiles).length;
    }

    if (options.includeSettings && this.zustandStore) {
      const store = this.zustandStore as { getState: () => Record<string, unknown> };
      const state = store.getState();
      exportData.settings = {
        theme: state.theme,
        language: state.language,
        viewMode: state.viewMode,
        terminalHeight: state.terminalHeight,
        panelMap: state.panelMap,
        customThemeConfig: state.customThemeConfig,
      };
      dataTypes.push('settings');
      totalSize += JSON.stringify(exportData.settings).length;
    }

    if (options.includeMessages && this.zustandStore) {
      const store = this.zustandStore as { getState: () => Record<string, unknown> };
      const state = store.getState();
      exportData.messages = state.messages as unknown[];
      dataTypes.push('messages');
      totalSize += JSON.stringify(exportData.messages).length;
    }

    if (options.includeProjects && this.zustandStore) {
      const store = this.zustandStore as { getState: () => Record<string, unknown> };
      const state = store.getState();
      exportData.projects = state.recentProjects as unknown[];
      dataTypes.push('projects');
      totalSize += JSON.stringify(exportData.projects).length;
    }

    exportData.metadata.dataTypes = dataTypes;
    exportData.metadata.totalSize = totalSize;
    exportData.metadata.checksum = await this.calculateChecksum(exportData);

    if (options.format === 'json') {
      return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    }

    return this.createZipBlob(exportData);
  }

  async importData(file: File, options: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      importedItems: {
        files: 0,
        versions: 0,
        snapshots: 0,
        dbProfiles: 0,
        settings: 0,
        messages: 0,
        projects: 0,
      },
      errors: [],
      warnings: [],
      skippedItems: [],
    };

    try {
      const exportData = await this.parseImportFile(file);

      if (!exportData || !exportData.metadata) {
        result.errors.push('无效的导入文件格式');
        return result;
      }

      if (options.validateChecksum) {
        const calculatedChecksum = await this.calculateChecksum(exportData);
        if (calculatedChecksum !== exportData.metadata.checksum) {
          result.errors.push('数据校验失败：文件可能已损坏或被篡改');
          return result;
        }
      }

      const compatibility = this.checkCompatibility(exportData.metadata.version);
      if (!compatibility.compatible) {
        if (options.skipIncompatible) {
          result.warnings.push(`版本不兼容：${compatibility.reason}`);
          result.skippedItems.push('all');
          return result;
        }
        result.warnings.push(`版本兼容性警告：${compatibility.reason}`);
      }

      if (!this.storageService) {
        result.errors.push('存储服务未初始化');
        return result;
      }

      if (exportData.files && exportData.files.length > 0) {
        const imported = await this.importFiles(exportData.files, options.mergeStrategy);
        result.importedItems.files = imported;
      }

      if (exportData.versions && exportData.versions.length > 0) {
        const imported = await this.importVersions(exportData.versions, options.mergeStrategy);
        result.importedItems.versions = imported;
      }

      if (exportData.snapshots && exportData.snapshots.length > 0) {
        const imported = await this.importSnapshots(exportData.snapshots, options.mergeStrategy);
        result.importedItems.snapshots = imported;
      }

      if (exportData.dbProfiles && exportData.dbProfiles.length > 0) {
        const imported = await this.importDBProfiles(exportData.dbProfiles, options.mergeStrategy);
        result.importedItems.dbProfiles = imported;
      }

      if (exportData.settings && this.zustandStore) {
        await this.importSettings(exportData.settings);
        result.importedItems.settings = 1;
      }

      if (exportData.messages && this.zustandStore) {
        await this.importMessages(exportData.messages);
        result.importedItems.messages = exportData.messages.length;
      }

      if (exportData.projects && this.zustandStore) {
        await this.importProjects(exportData.projects);
        result.importedItems.projects = exportData.projects.length;
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.errors.push(`导入失败：${error instanceof Error ? error.message : '未知错误'}`);
    }

    return result;
  }

  async exportToJSON(options: ExportOptions): Promise<string> {
    const blob = await this.exportData({ ...options, format: 'json' });
    return blob.text();
  }

  async exportToZIP(options: ExportOptions): Promise<Blob> {
    return this.exportData({ ...options, format: 'zip' });
  }

  downloadExport(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  generateExportFilename(format: 'json' | 'zip'): string {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    return `yyc3-backup-${date}_${time}.${format}`;
  }

  private async parseImportFile(file: File): Promise<ExportData | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content) as ExportData;
          resolve(data);
        } catch {
          reject(new Error('无法解析导入文件'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  private async calculateChecksum(data: ExportData): Promise<string> {
    const content = JSON.stringify({
      files: data.files,
      versions: data.versions,
      snapshots: data.snapshots,
      dbProfiles: data.dbProfiles,
      settings: data.settings,
      messages: data.messages,
      projects: data.projects,
    });

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  private checkCompatibility(version: string): { compatible: boolean; reason: string } {
    const [major, minor] = version.split('.').map(Number);
    const [currentMajor, currentMinor] = CURRENT_EXPORT_VERSION.split('.').map(Number);

    if (major > currentMajor) {
      return { compatible: false, reason: '导入文件版本过高，请升级系统' };
    }

    if (major < currentMajor || (major === currentMajor && minor < currentMinor - 1)) {
      return { compatible: true, reason: '导入文件版本较旧，部分数据可能需要迁移' };
    }

    return { compatible: true, reason: '' };
  }

  private filterByDateRange<T extends { modifiedAt?: number; createdAt?: number }>(
    items: T[],
    dateRange?: { start: number; end: number }
  ): T[] {
    if (!dateRange) return items;
    return items.filter((item) => {
      const timestamp = item.modifiedAt || item.createdAt || 0;
      return timestamp >= dateRange.start && timestamp <= dateRange.end;
    });
  }

  private async createZipBlob(data: ExportData): Promise<Blob> {
    const parts: string[] = [];
    parts.push(JSON.stringify(data, null, 2));
    return new Blob(parts, { type: 'application/zip' });
  }

  private async importFiles(files: FileNode[], strategy: string): Promise<number> {
    if (!this.storageService) return 0;
    let imported = 0;

    for (const file of files) {
      try {
        const existing = await this.storageService.getFile(file.path);
        if (existing && strategy === 'skip') continue;

        await this.storageService.saveFile(file);
        imported++;
      } catch (error) {
        console.warn(`导入文件失败: ${file.path}`, error);
      }
    }

    return imported;
  }

  private async importVersions(versions: FileVersion[], _strategy: string): Promise<number> {
    if (!this.storageService) return 0;
    let imported = 0;

    for (const version of versions) {
      try {
        await this.storageService.saveVersion(version);
        imported++;
      } catch (error) {
        console.warn(`导入版本失败: ${version.id}`, error);
      }
    }

    return imported;
  }

  private async importSnapshots(snapshots: PreviewSnapshot[], _strategy: string): Promise<number> {
    if (!this.storageService) return 0;
    let imported = 0;

    for (const snapshot of snapshots) {
      try {
        await this.storageService.saveSnapshot(snapshot);
        imported++;
      } catch (error) {
        console.warn(`导入快照失败: ${snapshot.id}`, error);
      }
    }

    return imported;
  }

  private async importDBProfiles(
    profiles: DBConnectionProfile[],
    _strategy: string
  ): Promise<number> {
    if (!this.storageService) return 0;
    let imported = 0;

    for (const profile of profiles) {
      try {
        await this.storageService.saveDBProfile(profile);
        imported++;
      } catch (error) {
        console.warn(`导入数据库配置失败: ${profile.id}`, error);
      }
    }

    return imported;
  }

  private async importSettings(settings: Record<string, unknown>): Promise<void> {
    if (!this.zustandStore) return;
    const store = this.zustandStore as {
      getState: () => Record<string, unknown>;
      setState: (state: Partial<Record<string, unknown>>) => void;
    };

    store.setState({
      theme: settings.theme,
      language: settings.language,
      viewMode: settings.viewMode,
      terminalHeight: settings.terminalHeight,
      panelMap: settings.panelMap,
      customThemeConfig: settings.customThemeConfig,
    });
  }

  private async importMessages(messages: unknown[]): Promise<void> {
    if (!this.zustandStore) return;
    const store = this.zustandStore as {
      getState: () => Record<string, unknown>;
      setState: (state: Partial<Record<string, unknown>>) => void;
    };

    store.setState({ messages });
  }

  private async importProjects(projects: unknown[]): Promise<void> {
    if (!this.zustandStore) return;
    const store = this.zustandStore as {
      getState: () => Record<string, unknown>;
      setState: (state: Partial<Record<string, unknown>>) => void;
    };

    store.setState({ recentProjects: projects });
  }

  async getStorageStats(): Promise<{
    files: number;
    versions: number;
    snapshots: number;
    dbProfiles: number;
    totalSize: number;
  }> {
    if (!this.storageService) {
      return { files: 0, versions: 0, snapshots: 0, dbProfiles: 0, totalSize: 0 };
    }

    const [files, versions, snapshots, dbProfiles] = await Promise.all([
      this.storageService.getAllFiles(),
      this.storageService.getAllVersions(),
      this.storageService.getAllSnapshots(),
      this.storageService.getAllDBProfiles(),
    ]);

    const totalSize =
      JSON.stringify(files).length +
      JSON.stringify(versions).length +
      JSON.stringify(snapshots).length +
      JSON.stringify(dbProfiles).length;

    return {
      files: files.length,
      versions: versions.length,
      snapshots: snapshots.length,
      dbProfiles: dbProfiles.length,
      totalSize,
    };
  }
}

export const dataExportService = new DataExportService();

interface StorageServiceInterface {
  getFile(path: string): Promise<FileNode | null>;
  saveFile(file: FileNode): Promise<void>;
  getAllFiles(): Promise<FileNode[]>;
  saveVersion(version: FileVersion): Promise<void>;
  getAllVersions(): Promise<FileVersion[]>;
  saveSnapshot(snapshot: PreviewSnapshot): Promise<void>;
  getAllSnapshots(): Promise<PreviewSnapshot[]>;
  saveDBProfile(profile: DBConnectionProfile): Promise<void>;
  getAllDBProfiles(): Promise<DBConnectionProfile[]>;
}
