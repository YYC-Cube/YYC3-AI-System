/**
 * @file FileManager.tsx
 * @description YYC³便携式智能AI系统 - 文件管理器(树形视图与文件选择)
 * File Manager with tree view and file selection
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,file-manager,tree-view,explorer
 */

import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  MoreVertical,
  FileCode2,
  Image as ImageIcon,
  FileText,
  FolderPlus,
  Trash2,
  Edit3,
  Copy,
  FileJson,
  Paintbrush,
  Clock,
  RotateCcw,
} from 'lucide-react';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import { storageService } from '../services/storage-service';
import { syncService } from '../services/sync-service';
import { useAppStore } from '../store';
import { validateFileName } from '../utils/file-validator';
import { getI18n } from '../utils/i18n';
import { getThemeTokens, type ThemeMode } from '../utils/theme';

import { TanstackVirtualListDynamic } from './TanstackVirtualList';

type FileNode = {
  name: string;
  type: 'folder' | 'file';
  expanded?: boolean;
  children?: FileNode[];
  language?: string;
};

const initialFiles: FileNode[] = [
  {
    name: 'src',
    type: 'folder',
    expanded: true,
    children: [
      {
        name: 'app',
        type: 'folder',
        expanded: true,
        children: [
          { name: 'App.tsx', type: 'file', language: 'tsx' },
          { name: 'store.ts', type: 'file', language: 'ts' },
          { name: 'types.ts', type: 'file', language: 'ts' },
          { name: 'routes.ts', type: 'file', language: 'ts' },
          {
            name: 'components',
            type: 'folder',
            expanded: true,
            children: [
              { name: 'ChatInterface.tsx', type: 'file', language: 'tsx' },
              { name: 'FileManager.tsx', type: 'file', language: 'tsx' },
              { name: 'CodeEditor.tsx', type: 'file', language: 'tsx' },
              { name: 'IntegratedTerminal.tsx', type: 'file', language: 'tsx' },
              { name: 'Header.tsx', type: 'file', language: 'tsx' },
              { name: 'HomePage.tsx', type: 'file', language: 'tsx' },
              { name: 'IDELayout.tsx', type: 'file', language: 'tsx' },
              { name: 'PreviewPanel.tsx', type: 'file', language: 'tsx' },
              { name: 'ModelSettings.tsx', type: 'file', language: 'tsx' },
              { name: 'ThemeCustomizer.tsx', type: 'file', language: 'tsx' },
              { name: 'SystemReport.tsx', type: 'file', language: 'tsx' },
              {
                name: 'toolbars',
                type: 'folder',
                children: [
                  { name: 'LeftToolbar.tsx', type: 'file', language: 'tsx' },
                  { name: 'MiddleToolbar.tsx', type: 'file', language: 'tsx' },
                  { name: 'RightToolbar.tsx', type: 'file', language: 'tsx' },
                ],
              },
            ],
          },
          {
            name: 'utils',
            type: 'folder',
            children: [
              { name: 'theme.ts', type: 'file', language: 'ts' },
              { name: 'i18n.ts', type: 'file', language: 'ts' },
              { name: 'ai-simulator.ts', type: 'file', language: 'ts' },
              { name: 'collaboration.ts', type: 'file', language: 'ts' },
            ],
          },
        ],
      },
      {
        name: 'styles',
        type: 'folder',
        children: [
          { name: 'theme.css', type: 'file', language: 'css' },
          { name: 'fonts.css', type: 'file', language: 'css' },
          { name: 'index.css', type: 'file', language: 'css' },
        ],
      },
      {
        name: 'docs',
        type: 'folder',
        children: [
          { name: '01-YYC3-机制总结-核心设计.md', type: 'file', language: 'md' },
          { name: '02-YYC3-系统架构-技术栈规范.md', type: 'file', language: 'md' },
          { name: '03-YYC3-首页设计-品牌与交互.md', type: 'file', language: 'md' },
          { name: '04-YYC3-编程模式-多联式布局.md', type: 'file', language: 'md' },
          { name: '05-YYC3-图标系统-设计规范.md', type: 'file', language: 'md' },
          { name: '06-YYC3-技术实现-开发规范.md', type: 'file', language: 'md' },
          { name: '07-YYC3-数据模型-架构设计.md', type: 'file', language: 'md' },
        ],
      },
      {
        name: 'assets',
        type: 'folder',
        children: [{ name: 'logo.svg', type: 'file', language: 'svg' }],
      },
    ],
  },
  { name: 'package.json', type: 'file', language: 'json' },
  { name: 'tsconfig.json', type: 'file', language: 'json' },
  { name: 'README.md', type: 'file', language: 'md' },
  { name: 'Guidelines.md', type: 'file', language: 'md' },
];

const getFileIcon = (_name: string, language?: string, theme: ThemeMode = 'dark') => {
  const t = getThemeTokens(theme);
  if (language === 'tsx' || language === 'ts')
    return <FileCode2 className={`w-4 h-4 ${t.fileIcon.tsx}`} />;
  if (language === 'css') return <Paintbrush className={`w-4 h-4 ${t.fileIcon.css}`} />;
  if (language === 'json') return <FileJson className={`w-4 h-4 ${t.fileIcon.json}`} />;
  if (language === 'md') return <FileText className={`w-4 h-4 ${t.fileIcon.md}`} />;
  if (language === 'svg') return <ImageIcon className={`w-4 h-4 ${t.fileIcon.svg}`} />;
  return <File className={`w-4 h-4 ${t.fileIcon.default}`} />;
};

export function FileManager() {
  const { theme, language, selectedFile, setSelectedFile } = useAppStore();
  const t = getThemeTokens(theme);
  const ii = getI18n(language);
  const [files, setFiles] = useState(initialFiles);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(
    null
  );
  const [showVersions, setShowVersions] = useState(false);
  const [fileVersions, setFileVersions] = useState<
    { id: string; path: string; createdAt: number; createdBy: string }[]
  >([]);
  const [versionLoading, setVersionLoading] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [targetNode, setTargetNode] = useState<FileNode | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);

  // Track file selection in IndexedDB + sync service
  useEffect(() => {
    if (!selectedFile) return;
    syncService.trackChange('file', selectedFile, 'update');
    // Load version history for selected file
    if (showVersions) {
      setVersionLoading(true);
      storageService
        .getVersions(selectedFile)
        .then((v) => {
          setFileVersions(
            v.map((vv) => ({
              id: vv.id,
              path: vv.path,
              createdAt: vv.createdAt,
              createdBy: vv.createdBy,
            }))
          );
          setVersionLoading(false);
        })
        .catch(() => setVersionLoading(false));
    }
  }, [selectedFile, showVersions]);

  const toggleFolder = useCallback((path: number[]) => {
    setFiles((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      let node = next;
      for (let i = 0; i < path.length - 1; i++) {
        node = node[path[i]].children;
      }
      const target = node[path[path.length - 1]];
      if (target.type === 'folder') {
        target.expanded = !target.expanded;
      }
      return next;
    });
  }, []);

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleNewFile = (parentFolder: FileNode) => {
    setTargetNode(parentFolder);
    setNewFileName('');
    setValidationError(null);
    setShowNewFileDialog(true);
    setContextMenu(null);
  };

  const handleRename = (node: FileNode) => {
    setTargetNode(node);
    setNewFileName(node.name);
    setValidationError(null);
    setShowRenameDialog(true);
    setContextMenu(null);
  };

  const handleFileNameChange = (value: string) => {
    setNewFileName(value);
    const result = validateFileName(value, { allowNoExtension: false });
    setValidationError(result.valid ? null : result.error || null);
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) {
      setValidationError('文件名不能为空');
      return;
    }

    const result = validateFileName(newFileName, { allowNoExtension: false });
    if (!result.valid) {
      setValidationError(result.error || '文件名无效');
      return;
    }

    const fileName = result.sanitizedName || newFileName;

    if (targetNode && targetNode.type === 'folder') {
      const newFile: FileNode = {
        name: fileName,
        type: 'file',
        language: getFileExtension(fileName),
      };

      setFiles((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        const findAndAdd = (nodes: FileNode[]): boolean => {
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node === targetNode) {
              if (!node.children) node.children = [];
              node.children.push(newFile);
              return true;
            }
            if (node.children && findAndAdd(node.children)) {
              return true;
            }
          }
          return false;
        };
        findAndAdd(next);
        return next;
      });

      toast.success(`文件 "${fileName}" 创建成功`);
      syncService.trackChange('file', fileName, 'create');
    }

    setShowNewFileDialog(false);
    setNewFileName('');
    setValidationError(null);
    setTargetNode(null);
  };

  const handleConfirmRename = () => {
    if (!newFileName.trim()) {
      setValidationError('文件名不能为空');
      return;
    }

    const result = validateFileName(newFileName, { allowNoExtension: false });
    if (!result.valid) {
      setValidationError(result.error || '文件名无效');
      return;
    }

    const fileName = result.sanitizedName || newFileName;

    if (targetNode) {
      const oldName = targetNode.name;
      targetNode.name = fileName;

      setFiles((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        const findAndRename = (nodes: FileNode[]): boolean => {
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i] === targetNode) {
              nodes[i].name = fileName;
              return true;
            }
            if (nodes[i].children && findAndRename(nodes[i].children!)) {
              return true;
            }
          }
          return false;
        };
        findAndRename(next);
        return next;
      });

      toast.success(`重命名成功: ${oldName} → ${fileName}`);
      syncService.trackChange('file', fileName, 'update');
    }

    setShowRenameDialog(false);
    setNewFileName('');
    setValidationError(null);
    setTargetNode(null);
  };

  const getFileExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      ts: 'ts',
      tsx: 'tsx',
      js: 'js',
      jsx: 'jsx',
      css: 'css',
      scss: 'scss',
      html: 'html',
      json: 'json',
      md: 'md',
      py: 'py',
      go: 'go',
      rs: 'rs',
      java: 'java',
      vue: 'vue',
      svg: 'svg',
    };
    return languageMap[ext] || ext;
  };

  const toggleFileSelection = (fileName: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileName)) {
        next.delete(fileName);
      } else {
        next.add(fileName);
      }
      return next;
    });
  };

  const selectAllFiles = () => {
    const allFiles = new Set<string>();
    const collectFiles = (nodes: FileNode[]) => {
      nodes.forEach((node) => {
        if (node.type === 'file') {
          allFiles.add(node.name);
        }
        if (node.children) {
          collectFiles(node.children);
        }
      });
    };
    collectFiles(files);
    setSelectedFiles(allFiles);
    toast.success(`已选择 ${allFiles.size} 个文件`);
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
    setBatchMode(false);
  };

  const batchDeleteFiles = () => {
    if (selectedFiles.size === 0) {
      toast.warning('请先选择要删除的文件');
      return;
    }

    const count = selectedFiles.size;
    setFiles((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const deleteSelected = (nodes: FileNode[]): FileNode[] => {
        return nodes.filter((node) => {
          if (node.type === 'file' && selectedFiles.has(node.name)) {
            return false;
          }
          if (node.children) {
            node.children = deleteSelected(node.children);
          }
          return true;
        });
      };
      return deleteSelected(next);
    });

    toast.success(`已删除 ${count} 个文件`);
    selectedFiles.forEach((file) => {
      syncService.trackChange('file', file, 'delete');
    });
    clearSelection();
  };

  const batchDuplicateFiles = () => {
    if (selectedFiles.size === 0) {
      toast.warning('请先选择要复制的文件');
      return;
    }

    let duplicatedCount = 0;
    setFiles((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const duplicateSelected = (nodes: FileNode[]) => {
        nodes.forEach((node) => {
          if (node.type === 'file' && selectedFiles.has(node.name)) {
            const parent = findParentNode(next, node.name);
            if (parent && parent.children) {
              const newName = `${node.name.replace(/\.[^.]+$/, '')}-copy.${getFileExtension(node.name)}`;
              parent.children.push({
                ...node,
                name: newName,
              });
              duplicatedCount++;
            }
          }
          if (node.children) {
            duplicateSelected(node.children);
          }
        });
      };
      duplicateSelected(next);
      return next;
    });

    toast.success(`已复制 ${duplicatedCount} 个文件`);
    clearSelection();
  };

  const findParentNode = (nodes: FileNode[], targetName: string): FileNode | null => {
    for (const node of nodes) {
      if (node.children) {
        if (node.children.some((child) => child.type === 'file' && child.name === targetName)) {
          return node;
        }
        const found = findParentNode(node.children, targetName);
        if (found) return found;
      }
    }
    return null;
  };

  const _batchMoveToFolder = (targetFolderName: string) => {
    if (selectedFiles.size === 0) {
      toast.warning('请先选择要移动的文件');
      return;
    }

    let movedCount = 0;
    setFiles((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const targetFolder = findFolderByName(next, targetFolderName);
      if (!targetFolder) {
        toast.error('目标文件夹不存在');
        return prev;
      }

      const filesToMove: FileNode[] = [];
      const removeSelected = (nodes: FileNode[]): FileNode[] => {
        return nodes.filter((node) => {
          if (node.type === 'file' && selectedFiles.has(node.name)) {
            filesToMove.push({ ...node });
            movedCount++;
            return false;
          }
          if (node.children) {
            node.children = removeSelected(node.children);
          }
          return true;
        });
      };

      removeSelected(next);
      if (!targetFolder.children) {
        targetFolder.children = [];
      }
      targetFolder.children.push(...filesToMove);
      return next;
    });

    if (movedCount > 0) {
      toast.success(`已移动 ${movedCount} 个文件到 ${targetFolderName}`);
      clearSelection();
    }
  };
  void _batchMoveToFolder;

  const findFolderByName = (nodes: FileNode[], name: string): FileNode | null => {
    for (const node of nodes) {
      if (node.type === 'folder' && node.name === name) {
        return node;
      }
      if (node.children) {
        const found = findFolderByName(node.children, name);
        if (found) return found;
      }
    }
    return null;
  };

  const _getAllFolders = (): string[] => {
    const folders: string[] = [];
    const collectFolders = (nodes: FileNode[]) => {
      nodes.forEach((node) => {
        if (node.type === 'folder') {
          folders.push(node.name);
        }
        if (node.children) {
          collectFolders(node.children);
        }
      });
    };
    collectFolders(files);
    return folders;
  };
  void _getAllFolders;

  const matchesSearch = (node: FileNode): boolean => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (node.name.toLowerCase().includes(q)) return true;
    if (node.children) return node.children.some((c) => matchesSearch(c));
    return false;
  };

  // ── Flatten tree for virtual scrolling (used when tree > 50 nodes) ──
  interface FlatNode {
    key: string;
    node: FileNode;
    level: number;
    path: number[];
  }

  const flattenTree = useCallback(
    (nodes: FileNode[], level = 0, path: number[] = []): FlatNode[] => {
      const result: FlatNode[] = [];
      nodes
        .filter((n) => matchesSearch(n))
        .forEach((node, i) => {
          const currentPath = [...path, i];
          result.push({ key: `${level}-${i}-${node.name}`, node, level, path: currentPath });
          if (node.type === 'folder' && node.expanded && node.children) {
            result.push(...flattenTree(node.children, level + 1, currentPath));
          }
        });
      return result;
    },
    [searchQuery]
  );

  const flatNodes = useMemo(() => flattenTree(files), [files, flattenTree]);
  const useVirtualScroll = flatNodes.length > 50; // Threshold for using virtual scroll

  const renderTree = (nodes: FileNode[], level = 0, path: number[] = []) => {
    return nodes
      .filter((node) => matchesSearch(node))
      .map((node, i) => {
        const currentPath = [...path, i];
        const isSelected = node.type === 'file' && node.name === selectedFile;
        const isBatchSelected = node.type === 'file' && selectedFiles.has(node.name);

        return (
          <div key={`${level}-${i}-${node.name}`}>
            <div
              className={`flex items-center space-x-1 py-[5px] px-2 cursor-pointer rounded-md text-[13px] ${t.transition} group ${
                isSelected
                  ? `${t.accent.activeBg} ${t.accent.activeText}`
                  : isBatchSelected
                    ? `${t.isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'} ${t.text.primary}`
                    : `${t.isDark ? 'hover:bg-slate-700/40' : 'hover:bg-slate-100'} ${t.text.secondary}`
              }`}
              style={{ paddingLeft: `${level * 14 + 8}px`, fontWeight: isSelected ? 500 : 400 }}
              onClick={() => {
                if (batchMode && node.type === 'file') {
                  toggleFileSelection(node.name);
                } else if (node.type === 'folder') {
                  toggleFolder(currentPath);
                } else {
                  setSelectedFile(node.name);
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, node)}
            >
              {batchMode && node.type === 'file' && (
                <div
                  className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                    isBatchSelected
                      ? `${t.accent.primaryBg} border-transparent`
                      : `${t.isDark ? 'border-slate-500' : 'border-slate-300'}`
                  }`}
                >
                  {isBatchSelected && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              )}
              {node.type === 'folder' ? (
                node.expanded ? (
                  <ChevronDown className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                )
              ) : (
                !batchMode && <div className="w-3.5 flex-shrink-0" />
              )}
              {node.type === 'folder' ? (
                <Folder
                  className={`w-4 h-4 flex-shrink-0 ${
                    node.expanded ? t.fileIcon.folder : t.fileIcon.folderClosed
                  }`}
                />
              ) : (
                getFileIcon(node.name, node.language, theme as ThemeMode)
              )}
              <span className="truncate">{node.name}</span>

              {/* Hover actions */}
              {!batchMode && (
                <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 flex-shrink-0">
                  {node.type === 'folder' && (
                    <button
                      className={`p-0.5 rounded ${t.interactive.hoverBg}`}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      title={ii.newFile}
                      style={{ fontSize: '11px' }}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    className={`p-0.5 rounded ${t.interactive.hoverBg}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, node);
                    }}
                    style={{ fontSize: '11px' }}
                  >
                    <MoreVertical className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            {node.type === 'folder' && node.expanded && node.children && (
              <div>{renderTree(node.children, level + 1, currentPath)}</div>
            )}
          </div>
        );
      });
  };

  return (
    <div
      className={`flex flex-col h-full relative overflow-hidden rounded-xl ${t.surface.glass} ${t.isDark ? 'border border-white/8' : 'border border-slate-200/40'} shadow-inner`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-3 py-2.5 border-b ${t.border.subtle} ${t.surface.inset}`}
      >
        <div className="flex items-center space-x-2">
          <Folder className={`w-4 h-4 ${t.accent.primary}`} />
          <span className="text-[13px] tracking-wide" style={{ fontWeight: 600 }}>
            {ii.explorer}
          </span>
          {batchMode && selectedFiles.size > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${t.accent.primaryBg} ${t.accent.primaryText}`}
            >
              {selectedFiles.size} 已选
            </span>
          )}
        </div>
        <div className="flex space-x-0.5">
          <button
            onClick={() => {
              setBatchMode(!batchMode);
              if (batchMode) {
                clearSelection();
              }
            }}
            className={`p-1.5 rounded ${t.transition} ${
              batchMode ? `${t.accent.primaryBg} ${t.accent.primary}` : t.interactive.iconBtn
            }`}
            title={batchMode ? '退出批量选择' : '批量选择'}
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded ${t.transition} ${
              showSearch ? `${t.accent.primaryBg} ${t.accent.primary}` : t.interactive.iconBtn
            }`}
            title={ii.search}
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            className={`p-1.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
            title={ii.newFile}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            className={`p-1.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
            title={ii.newFolder}
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowVersions(!showVersions)}
            className={`p-1.5 rounded ${t.transition} ${showVersions ? `${t.accent.primaryBg} ${t.accent.primary}` : t.interactive.iconBtn}`}
            title="版本历史"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Batch Actions Toolbar */}
      {batchMode && (
        <div
          className={`flex items-center justify-between px-3 py-2 border-b ${t.border.subtle} ${t.isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}
        >
          <div className="flex items-center space-x-2">
            <button
              onClick={selectAllFiles}
              className={`px-2 py-1 text-[11px] rounded ${t.interactive.menuItem}`}
            >
              全选
            </button>
            <button
              onClick={clearSelection}
              className={`px-2 py-1 text-[11px] rounded ${t.interactive.menuItem}`}
            >
              取消选择
            </button>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={batchDuplicateFiles}
              disabled={selectedFiles.size === 0}
              className={`px-2 py-1 text-[11px] rounded ${t.interactive.menuItem} disabled:opacity-50`}
              title="复制选中的文件"
            >
              <Copy className="w-3 h-3 inline mr-1" />
              复制
            </button>
            <button
              onClick={batchDeleteFiles}
              disabled={selectedFiles.size === 0}
              className={`px-2 py-1 text-[11px] rounded ${t.status.error} hover:bg-red-500/10 disabled:opacity-50`}
              title="删除选中的文件"
            >
              <Trash2 className="w-3 h-3 inline mr-1" />
              删除
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {showSearch && (
        <div className={`px-3 py-2 border-b ${t.border.subtle}`}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={ii.searchFiles}
            className={`w-full h-7 px-2.5 rounded-md text-[12px] outline-none ${t.input.base} ${t.text.placeholder}`}
            autoFocus
            style={{ fontWeight: 400 }}
          />
        </div>
      )}

      {/* File Tree */}
      <div className={`flex-1 overflow-y-auto py-1.5 px-1 ${t.scrollbar}`}>
        {useVirtualScroll ? (
          <TanstackVirtualListDynamic
            items={flatNodes}
            overscan={8}
            className="h-full"
            getKey={(item) => item.key}
            renderItem={({ node, level, path }) => {
              const isSelected = node.type === 'file' && node.name === selectedFile;
              return (
                <div
                  className={`flex items-center space-x-1 px-2 cursor-pointer rounded-md text-[13px] py-[5px] ${t.transition} group ${
                    isSelected
                      ? `${t.accent.activeBg} ${t.accent.activeText}`
                      : `${t.isDark ? 'hover:bg-slate-700/40' : 'hover:bg-slate-100'} ${t.text.secondary}`
                  }`}
                  style={{ paddingLeft: `${level * 14 + 8}px`, fontWeight: isSelected ? 500 : 400 }}
                  onClick={() => {
                    if (node.type === 'folder') toggleFolder(path);
                    else setSelectedFile(node.name);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, node)}
                >
                  {node.type === 'folder' ? (
                    node.expanded ? (
                      <ChevronDown className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                    )
                  ) : (
                    <div className="w-3.5 flex-shrink-0" />
                  )}
                  {node.type === 'folder' ? (
                    <Folder
                      className={`w-4 h-4 flex-shrink-0 ${node.expanded ? t.fileIcon.folder : t.fileIcon.folderClosed}`}
                    />
                  ) : (
                    getFileIcon(node.name, node.language, theme as ThemeMode)
                  )}
                  <span className="truncate">{node.name}</span>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 flex-shrink-0">
                    <button
                      className={`p-0.5 rounded ${t.interactive.hoverBg}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, node);
                      }}
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            }}
          />
        ) : (
          renderTree(files)
        )}
      </div>

      {/* File Count Footer */}
      <div className={`px-3 py-1.5 border-t text-[10px] ${t.border.subtle} ${t.text.dimmed}`}>
        {selectedFile ? `${ii.selectedFile}: ${selectedFile}` : ii.noFileSelected} &middot;{' '}
        {ii.totalFiles.replace('{n}', '22')}
      </div>

      {/* Version History Panel (collapsible) */}
      {showVersions && selectedFile && (
        <div className={`border-t ${t.border.subtle} max-h-[200px] overflow-y-auto`}>
          <div className={`flex items-center justify-between px-3 py-1.5 ${t.surface.inset}`}>
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3 h-3 ${t.accent.primary}`} />
              <span className={`text-[10px] ${t.text.secondary}`} style={{ fontWeight: 500 }}>
                版本历史
              </span>
            </div>
            <span className={`text-[9px] ${t.text.dimmed}`}>{fileVersions.length} 版本</span>
          </div>
          {versionLoading ? (
            <div className={`text-[9px] ${t.text.dimmed} text-center py-3`}>加载中...</div>
          ) : fileVersions.length === 0 ? (
            <div className={`text-[9px] ${t.text.dimmed} text-center py-3`}>
              暂无版本记录 — 编辑文件后自动创建
            </div>
          ) : (
            <div className="px-2 pb-2 space-y-0.5">
              {fileVersions.slice(0, 10).map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center justify-between px-2 py-1 rounded text-[9px] ${t.isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'} ${t.transition} cursor-pointer`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={t.text.dimmed}>
                      {new Date(v.createdAt).toLocaleTimeString()}
                    </span>
                    <span className={`${t.text.secondary} truncate`}>{v.createdBy}</span>
                  </div>
                  <button
                    className={`p-0.5 rounded ${t.interactive.iconBtn}`}
                    title="恢复此版本"
                    onClick={() => toast.info(`恢复版本 ${v.id.slice(0, 8)}`)}
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className={`fixed z-50 w-44 rounded-xl overflow-hidden p-1 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.node.type === 'folder' && (
              <>
                <button
                  onClick={() => handleNewFile(contextMenu.node)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
                  style={{ fontWeight: 400 }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{ii.newFile}</span>
                </button>
                <button
                  onClick={() => setContextMenu(null)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
                  style={{ fontWeight: 400 }}
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>{ii.newFolder}</span>
                </button>
                <div className={`my-1 h-px mx-2 ${t.border.divider}`} />
              </>
            )}
            <button
              onClick={() => handleRename(contextMenu.node)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
              style={{ fontWeight: 400 }}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{ii.rename}</span>
            </button>
            <button
              onClick={() => setContextMenu(null)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
              style={{ fontWeight: 400 }}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{ii.copy}</span>
            </button>
            <button
              onClick={() => setContextMenu(null)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
              style={{ fontWeight: 400 }}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{ii.copyPath}</span>
            </button>
            <div className={`my-1 h-px mx-2 ${t.border.divider}`} />
            <button
              onClick={() => setContextMenu(null)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.status.error} hover:bg-red-500/10`}
              style={{ fontWeight: 400 }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{ii.delete}</span>
            </button>
          </div>
        </>
      )}

      {/* New File Dialog */}
      {showNewFileDialog && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowNewFileDialog(false)}
          />
          <div
            className={`fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 rounded-xl p-4 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
          >
            <h3 className={`text-sm font-medium mb-3 ${t.text.primary}`}>新建文件</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => handleFileNameChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
              placeholder="输入文件名 (例如: index.tsx)"
              className={`w-full h-9 px-3 rounded-lg text-[13px] outline-none ${t.input.base} ${t.text.primary}`}
              autoFocus
            />
            {validationError && (
              <p className={`text-[11px] mt-2 ${t.status.error}`}>{validationError}</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNewFileDialog(false)}
                className={`px-3 py-1.5 text-[12px] rounded-lg ${t.interactive.menuItem}`}
              >
                取消
              </button>
              <button
                onClick={handleCreateFile}
                disabled={!!validationError || !newFileName.trim()}
                className={`px-3 py-1.5 text-[12px] rounded-lg ${t.accent.primaryBg} ${t.accent.primaryText} disabled:opacity-50`}
              >
                创建
              </button>
            </div>
          </div>
        </>
      )}

      {/* Rename Dialog */}
      {showRenameDialog && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowRenameDialog(false)}
          />
          <div
            className={`fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 rounded-xl p-4 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
          >
            <h3 className={`text-sm font-medium mb-3 ${t.text.primary}`}>重命名</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => handleFileNameChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmRename()}
              placeholder="输入新文件名"
              className={`w-full h-9 px-3 rounded-lg text-[13px] outline-none ${t.input.base} ${t.text.primary}`}
              autoFocus
            />
            {validationError && (
              <p className={`text-[11px] mt-2 ${t.status.error}`}>{validationError}</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowRenameDialog(false)}
                className={`px-3 py-1.5 text-[12px] rounded-lg ${t.interactive.menuItem}`}
              >
                取消
              </button>
              <button
                onClick={handleConfirmRename}
                disabled={!!validationError || !newFileName.trim()}
                className={`px-3 py-1.5 text-[12px] rounded-lg ${t.accent.primaryBg} ${t.accent.primaryText} disabled:opacity-50`}
              >
                确认
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
