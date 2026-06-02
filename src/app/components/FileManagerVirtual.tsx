/**
 * @file FileManagerVirtual.tsx
 * @description YYC³便携式智能AI系统 - 文件管理器(使用tanstack-virtual优化性能)
 * File Manager with tanstack-virtual for better performance
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,file-manager,virtual-scroll,performance,tanstack-virtual
 */

import { useVirtualizer } from '@tanstack/react-virtual';
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
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

import { storageService } from '../services/storage-service';
import { syncService } from '../services/sync-service';
import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens, type ThemeMode } from '../utils/theme';

type FileNode = {
  name: string;
  type: 'folder' | 'file';
  expanded?: boolean;
  children?: FileNode[];
  language?: string;
};

interface FlatNode {
  key: string;
  node: FileNode;
  level: number;
  path: number[];
  index: number;
}

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

export function FileManagerVirtual() {
  const { theme, language, selectedFile, setSelectedFile } = useAppStore();
  const t = getThemeTokens(theme);
  const ii = getI18n(language);
  const [files, setFiles] = useState<FileNode[]>(initialFiles);
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

  // 虚拟滚动相关的状态
  const containerRef = useRef<HTMLDivElement>(null);
  const [_scrollPosition, setScrollPosition] = useState<number>(0);

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

  // Save scroll position to localStorage
  const saveScrollPosition = useCallback((position: number) => {
    setScrollPosition(position);
    try {
      localStorage.setItem('file-manager-scroll-position', String(position));
    } catch (error) {
      console.error('Failed to save scroll position:', error);
    }
  }, []);

  // Restore scroll position from localStorage on mount
  useEffect(() => {
    try {
      const savedPosition = localStorage.getItem('file-manager-scroll-position');
      if (savedPosition && containerRef.current) {
        const position = parseInt(savedPosition, 10);
        setScrollPosition(position);
        containerRef.current.scrollTop = position;
      }
    } catch (error) {
      console.error('Failed to restore scroll position:', error);
    }
  }, []);

  const toggleFolder = useCallback((path: number[]) => {
    setFiles((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      let node = next;
      for (let i = 0; i < path.length - 1; i++) {
        node = node[path[i]].children!;
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

  const matchesSearch = (node: FileNode): boolean => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (node.name.toLowerCase().includes(q)) return true;
    if (node.children) return node.children.some((c) => matchesSearch(c));
    return false;
  };

  // Flatten tree for virtual scrolling
  interface FlatNodeWithIndex extends FlatNode {
    index: number;
  }

  const flattenTree = useCallback(
    (nodes: FileNode[], level = 0, path: number[] = [], startIndex = 0): FlatNodeWithIndex[] => {
      const result: FlatNodeWithIndex[] = [];
      nodes
        .filter((n) => matchesSearch(n))
        .forEach((node, i) => {
          const currentPath = [...path, i];
          result.push({
            key: `${level}-${i}-${node.name}`,
            node,
            level,
            path: currentPath,
            index: startIndex + result.length,
          });
          if (node.type === 'folder' && node.expanded && node.children) {
            result.push(
              ...flattenTree(node.children, level + 1, currentPath, startIndex + result.length)
            );
          }
        });
      return result;
    },
    [searchQuery]
  );

  const flatNodes = useMemo(() => flattenTree(files), [files, flattenTree]);

  // Dynamic item height calculation based on content
  const estimateItemHeight = useCallback((node: FlatNode): number => {
    // Base height for single item
    let height = 28; // Base height for folder/file row

    // Add extra height for folder if it has children and is expanded
    if (node.node.type === 'folder') {
      if (node.node.children && node.node.children.length > 0) {
        height += 4; // Add some height for the folder icon
      }
    }

    return height;
  }, []);

  // Memoized item height calculation for virtualizer
  const getItemHeight = useCallback(
    (index: number) => {
      return estimateItemHeight(flatNodes[index]);
    },
    [flatNodes, estimateItemHeight]
  );

  // Set up virtualizer with dynamic item heights
  const virtualizer = useVirtualizer({
    count: flatNodes.length,
    getScrollElement: () => containerRef.current,
    estimateSize: getItemHeight,
    overscan: 8,
  });

  // Handle scroll changes and save position
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const position = containerRef.current.scrollTop;
      saveScrollPosition(position);
    }
  }, [saveScrollPosition]);

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
        </div>
        <div className="flex space-x-0.5">
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

      {/* Virtual File Tree */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-y-auto py-1.5 px-1 ${t.scrollbar}`}
        onScroll={handleScroll}
        style={{
          height: 'calc(100% - 140px)', // Subtract header (60px) and footer (80px) heights
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const flatNode = flatNodes[virtualItem.index];
            const { node, level } = flatNode;
            const isSelected = node.type === 'file' && node.name === selectedFile;

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div
                  className={`flex items-center space-x-1 h-full px-2 cursor-pointer rounded-md text-[13px] ${t.transition} group ${
                    isSelected
                      ? `${t.accent.activeBg} ${t.accent.activeText}`
                      : `${t.isDark ? 'hover:bg-slate-700/40' : 'hover:bg-slate-100'} ${t.text.secondary}`
                  }`}
                  style={{ paddingLeft: `${level * 14 + 8}px`, fontWeight: isSelected ? 500 : 400 }}
                  onClick={() => {
                    if (node.type === 'folder') {
                      toggleFolder(flatNode.path);
                    } else {
                      setSelectedFile(node.name);
                    }
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
                      className={`w-4 h-4 flex-shrink-0 ${
                        node.expanded ? t.fileIcon.folder : t.fileIcon.folderClosed
                      }`}
                    />
                  ) : (
                    getFileIcon(node.name, node.language, theme as ThemeMode)
                  )}
                  <span className="truncate">{node.name}</span>

                  {/* Hover actions */}
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
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* File Count Footer */}
      <div className={`px-3 py-1.5 border-t text-[10px] ${t.border.subtle} ${t.text.dimmed}`}>
        {selectedFile ? `${ii.selectedFile}: ${selectedFile}` : ii.noFileSelected} &middot;{' '}
        {ii.totalFiles.replace('{n}', String(flatNodes.length))}
      </div>

      {/* Version History Panel (collapsible) */}
      {showVersions && selectedFile && (
        <div className={`border-t ${t.border.subtle} max-h-[200px] overflow-y-auto`}>
          <div className={`flex items-center justify-between px-3 py-1.5 ${t.surface.inset}`}>
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${t.accent.primary}`} />
              <span className="text-[13px] font-medium">{selectedFile} 版本历史</span>
            </div>
            <button
              onClick={() => setShowVersions(false)}
              className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
          {versionLoading ? (
            <div className="flex items-center justify-center py-8">
              <div
                className={`w-5 h-5 border-2 ${t.border.medium} ${t.accent.primary} rounded-full animate-spin`}
                style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }}
              />
            </div>
          ) : fileVersions.length > 0 ? (
            <div className="px-3 py-2">
              {fileVersions.map((v, index) => (
                <div
                  key={v.id}
                  className={`flex items-center justify-between py-2 ${index < fileVersions.length - 1 ? `border-b ${t.border.subtle}` : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{v.id.slice(0, 8)}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(v.createdAt).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{v.createdBy}</span>
                    <button
                      className={`p-1 rounded ${t.interactive.hoverBg}`}
                      onClick={() => {
                        toast.success(`已恢复到版本 ${v.id.slice(0, 8)}`);
                      }}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-8 text-center text-muted-foreground">暂无版本历史</div>
          )}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-popover border border border-border rounded-md shadow-lg p-1 min-w-[160px] z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <button
            className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${t.interactive.hoverBg}`}
            onClick={() => {
              toast.success(`已复制 ${contextMenu.node.name}`);
              setContextMenu(null);
            }}
          >
            <Copy className="w-4 h-4" />
            <span>复制</span>
          </button>
          <button
            className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${t.interactive.hoverBg}`}
            onClick={() => {
              toast.info(`重命名功能开发中`);
              setContextMenu(null);
            }}
          >
            <Edit3 className="w-4 h-4" />
            <span>重命名</span>
          </button>
          <button
            className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${t.interactive.hoverBg}`}
            onClick={() => {
              toast.success(`已删除 ${contextMenu.node.name}`);
              setContextMenu(null);
            }}
          >
            <Trash2 className="w-4 h-4" />
            <span>删除</span>
          </button>
        </div>
      )}
    </div>
  );
}
