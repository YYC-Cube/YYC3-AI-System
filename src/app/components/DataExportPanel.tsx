/**
 * @file DataExportPanel.tsx
 * @description YYC³ 数据导出/导入面板 - 用户数据完全自主可控
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [component],[export],[import],[data-sovereignty],[backup]
 */

'use client';

import {
  Download,
  Upload,
  Shield,
  CheckCircle,
  AlertTriangle,
  Trash2,
  RefreshCw,
  FileJson,
  Archive,
} from 'lucide-react';
import React, { useState, useCallback, useEffect } from 'react';

import {
  dataExportService,
  type ExportOptions,
  type ImportResult,
} from '../services/data-export-service';
import {
  dataIntegrityService,
  type IntegrityCheckResult,
} from '../services/data-integrity-service';
import { storageOptimizer, type StorageStats } from '../services/storage-service';
import { useAppStore } from '../store';

interface DataExportPanelProps {
  onClose?: () => void;
}

const i18n = {
  zh: {
    dataManagement: '数据管理',
    export: '导出',
    import: '导入',
    integrityCheck: '完整性',
    storageStats: '存储',
    exportFormat: '导出格式',
    exportContent: '导出内容',
    files: '文件',
    versionHistory: '版本历史',
    snapshots: '快照',
    dbProfiles: '数据库配置',
    settings: '设置',
    messages: '消息记录',
    projects: '项目',
    startExport: '开始导出',
    exporting: '导出中...',
    importData: '导入数据',
    importDescription: '选择之前导出的备份文件进行恢复',
    selectFile: '选择文件',
    importing: '导入中...',
    importSuccess: '导入成功',
    importFailed: '导入失败',
    importedFiles: '已导入文件',
    importedVersions: '已导入版本',
    importedSettings: '已导入设置',
    startIntegrityCheck: '开始完整性检查',
    checking: '检查中...',
    dataHealthy: '数据健康',
    dataIssues: '发现问题',
    totalItems: '总项目',
    healthyItems: '健康项目',
    corruptedItems: '损坏项目',
    orphanedItems: '孤立项目',
    issues: '问题列表',
    recommendations: '建议',
    storageUsage: '存储使用情况',
    usedSpace: '已使用',
    versions: '版本',
    dataRange: '数据时间范围',
    oldestData: '最早数据',
    newestData: '最新数据',
    cleanupOldData: '清理旧数据',
    confirmCleanup: '确定要清理旧数据吗？此操作不可撤销。',
    cleanupComplete: '清理完成',
    deletedVersions: '删除版本',
    freedSpace: '释放空间',
    exportFailed: '导出失败',
    dataSovereigntyNote: '您的数据完全由您自己掌控，所有数据仅存储在本地浏览器中。',
  },
  en: {
    dataManagement: 'Data Management',
    export: 'Export',
    import: 'Import',
    integrityCheck: 'Integrity',
    storageStats: 'Storage',
    exportFormat: 'Export Format',
    exportContent: 'Export Content',
    files: 'Files',
    versionHistory: 'Version History',
    snapshots: 'Snapshots',
    dbProfiles: 'DB Profiles',
    settings: 'Settings',
    messages: 'Messages',
    projects: 'Projects',
    startExport: 'Start Export',
    exporting: 'Exporting...',
    importData: 'Import Data',
    importDescription: 'Select a previously exported backup file to restore',
    selectFile: 'Select File',
    importing: 'Importing...',
    importSuccess: 'Import Successful',
    importFailed: 'Import Failed',
    importedFiles: 'Imported Files',
    importedVersions: 'Imported Versions',
    importedSettings: 'Imported Settings',
    startIntegrityCheck: 'Start Integrity Check',
    checking: 'Checking...',
    dataHealthy: 'Data Healthy',
    dataIssues: 'Issues Found',
    totalItems: 'Total Items',
    healthyItems: 'Healthy Items',
    corruptedItems: 'Corrupted Items',
    orphanedItems: 'Orphaned Items',
    issues: 'Issues',
    recommendations: 'Recommendations',
    storageUsage: 'Storage Usage',
    usedSpace: 'Used Space',
    versions: 'Versions',
    dataRange: 'Data Time Range',
    oldestData: 'Oldest Data',
    newestData: 'Newest Data',
    cleanupOldData: 'Cleanup Old Data',
    confirmCleanup: 'Are you sure you want to clean up old data? This action cannot be undone.',
    cleanupComplete: 'Cleanup Complete',
    deletedVersions: 'Deleted Versions',
    freedSpace: 'Freed Space',
    exportFailed: 'Export Failed',
    dataSovereigntyNote:
      'Your data is completely under your control, all data is stored locally in your browser.',
  },
};

type Language = 'zh' | 'en' | 'ja' | 'ko';

export const DataExportPanel: React.FC<DataExportPanelProps> = ({ onClose }) => {
  const { theme, language } = useAppStore();
  const t = i18n[(language as Language) === 'zh' ? 'zh' : 'en'];

  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'integrity' | 'storage'>(
    'export'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'zip'>('json');
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [integrityResult, setIntegrityResult] = useState<IntegrityCheckResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeFiles: true,
    includeVersions: true,
    includeSnapshots: false,
    includeDBProfiles: true,
    includeSettings: true,
    includeMessages: true,
    includeProjects: true,
  });

  useEffect(() => {
    loadStorageStats();
  }, []);

  const loadStorageStats = async () => {
    try {
      const stats = await storageOptimizer.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('加载存储统计失败:', error);
    }
  };

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const options = { ...exportOptions, format: exportFormat };
      const blob = await dataExportService.exportData(options);
      const filename = dataExportService.generateExportFilename(exportFormat);
      dataExportService.downloadExport(blob, filename);
    } catch (error) {
      console.error('导出失败:', error);
      alert(t.exportFailed);
    } finally {
      setIsExporting(false);
    }
  }, [exportOptions, exportFormat, t]);

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await dataExportService.importData(file, {
        mergeStrategy: 'merge',
        validateChecksum: true,
        skipIncompatible: false,
      });
      setImportResult(result);

      if (result.success) {
        loadStorageStats();
      }
    } catch (error) {
      console.error('导入失败:', error);
      setImportResult({
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
        errors: [error instanceof Error ? error.message : '导入失败'],
        warnings: [],
        skippedItems: [],
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  }, []);

  const handleIntegrityCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await dataIntegrityService.performFullCheck();
      setIntegrityResult(result);
    } catch (error) {
      console.error('完整性检查失败:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const handleCleanup = useCallback(async () => {
    if (!confirm(t.confirmCleanup)) return;

    try {
      const result = await storageOptimizer.cleanupOldData({
        maxAge: 30 * 24 * 60 * 60 * 1000,
        maxVersions: 10,
        keepLatest: true,
      });
      alert(
        `${t.cleanupComplete}: ${t.deletedVersions} ${result.deletedVersions}, ${t.freedSpace} ${(result.freedBytes / 1024).toFixed(2)} KB`
      );
      loadStorageStats();
    } catch (error) {
      console.error('清理失败:', error);
    }
  }, [t]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US');
  };

  const isDark = theme === 'dark' || theme === 'midnight';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm`}
    >
      <div
        className={`w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
      >
        <div className={`p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-indigo-500" />
              <h2 className="text-xl font-bold">{t.dataManagement}</h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            {[
              { id: 'export', label: t.export, icon: Download },
              { id: 'import', label: t.import, icon: Upload },
              { id: 'integrity', label: t.integrityCheck, icon: CheckCircle },
              { id: 'storage', label: t.storageStats, icon: Archive },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-500 text-white'
                    : isDark
                      ? 'hover:bg-slate-800'
                      : 'hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <h3 className="font-medium mb-3">{t.exportFormat}</h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      checked={exportFormat === 'json'}
                      onChange={() => setExportFormat('json')}
                      className="text-indigo-500"
                    />
                    <FileJson className="w-4 h-4" />
                    JSON
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      checked={exportFormat === 'zip'}
                      onChange={() => setExportFormat('zip')}
                      className="text-indigo-500"
                    />
                    <Archive className="w-4 h-4" />
                    ZIP
                  </label>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <h3 className="font-medium mb-3">{t.exportContent}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'includeFiles', label: t.files },
                    { key: 'includeVersions', label: t.versionHistory },
                    { key: 'includeSnapshots', label: t.snapshots },
                    { key: 'includeDBProfiles', label: t.dbProfiles },
                    { key: 'includeSettings', label: t.settings },
                    { key: 'includeMessages', label: t.messages },
                    { key: 'includeProjects', label: t.projects },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportOptions[item.key as keyof ExportOptions] as boolean}
                        onChange={(e) =>
                          setExportOptions({ ...exportOptions, [item.key]: e.target.checked })
                        }
                        className="text-indigo-500 rounded"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t.exporting}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {t.startExport}
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <h3 className="font-medium mb-3">{t.importData}</h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t.importDescription}
                </p>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-indigo-500">
                  <Upload className="w-8 h-8 mb-2 text-slate-400" />
                  <span className="text-sm text-slate-400">
                    {isImporting ? t.importing : t.selectFile}
                  </span>
                  <input
                    type="file"
                    accept=".json,.zip"
                    onChange={handleImport}
                    disabled={isImporting}
                    className="hidden"
                  />
                </label>
              </div>

              {importResult && (
                <div
                  className={`p-4 rounded-lg ${importResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}
                >
                  <h3
                    className={`font-medium mb-2 ${importResult.success ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {importResult.success ? t.importSuccess : t.importFailed}
                  </h3>
                  <div className="text-sm space-y-1">
                    <p>
                      {t.importedFiles}: {importResult.importedItems.files}
                    </p>
                    <p>
                      {t.importedVersions}: {importResult.importedItems.versions}
                    </p>
                    <p>
                      {t.importedSettings}: {importResult.importedItems.settings}
                    </p>
                    {importResult.errors.length > 0 && (
                      <div className="mt-2 text-red-500">
                        {importResult.errors.map((err, i) => (
                          <p key={i}>• {err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'integrity' && (
            <div className="space-y-6">
              <button
                onClick={handleIntegrityCheck}
                disabled={isChecking}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t.checking}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {t.startIntegrityCheck}
                  </>
                )}
              </button>

              {integrityResult && (
                <div
                  className={`p-4 rounded-lg ${integrityResult.isHealthy ? 'bg-green-500/10 border border-green-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {integrityResult.isHealthy ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                    <h3 className="font-medium">
                      {integrityResult.isHealthy ? t.dataHealthy : t.dataIssues}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <p>
                      {t.totalItems}: {integrityResult.summary.totalItems}
                    </p>
                    <p>
                      {t.healthyItems}: {integrityResult.summary.healthyItems}
                    </p>
                    <p>
                      {t.corruptedItems}: {integrityResult.summary.corruptedItems}
                    </p>
                    <p>
                      {t.orphanedItems}: {integrityResult.summary.orphanedItems}
                    </p>
                  </div>

                  {integrityResult.details.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">{t.issues}</h4>
                      {integrityResult.details.slice(0, 5).map((issue, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded text-sm ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}
                        >
                          <p className="font-medium">{issue.description}</p>
                          <p className="text-xs text-slate-400">{issue.location}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {integrityResult.recommendations.length > 0 && (
                    <div className="mt-4 space-y-1">
                      <h4 className="font-medium text-sm">{t.recommendations}</h4>
                      {integrityResult.recommendations.map((rec, i) => (
                        <p key={i} className="text-sm text-slate-400">
                          • {rec}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'storage' && storageStats && (
            <div className="space-y-6">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <h3 className="font-medium mb-3">{t.storageUsage}</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t.usedSpace}</span>
                    <span>
                      {formatBytes(storageStats.usedBytes)} / {formatBytes(storageStats.totalBytes)}
                    </span>
                  </div>
                  <div
                    className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        storageStats.usedPercentage > 80
                          ? 'bg-red-500'
                          : storageStats.usedPercentage > 60
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(storageStats.usedPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p>
                    {t.files}: {storageStats.filesCount}
                  </p>
                  <p>
                    {t.versions}: {storageStats.versionsCount}
                  </p>
                  <p>
                    {t.snapshots}: {storageStats.snapshotsCount}
                  </p>
                  <p>
                    {t.dbProfiles}: {storageStats.dbProfilesCount}
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <h3 className="font-medium mb-3">{t.dataRange}</h3>
                <div className="text-sm space-y-1">
                  <p>
                    {t.oldestData}:{' '}
                    {storageStats.oldestData > 0 ? formatDate(storageStats.oldestData) : '-'}
                  </p>
                  <p>
                    {t.newestData}:{' '}
                    {storageStats.newestData > 0 ? formatDate(storageStats.newestData) : '-'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCleanup}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {t.cleanupOldData}
              </button>
            </div>
          )}
        </div>

        <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <p className={`text-xs text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {t.dataSovereigntyNote}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataExportPanel;
