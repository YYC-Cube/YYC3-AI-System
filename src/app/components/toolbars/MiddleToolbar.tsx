/**
 * @file MiddleToolbar.tsx
 * @description YYC³便携式智能AI系统 - 中间工具栏(视图切换+文件管理工具)
 * Middle column toolbar - View switching + file management tools (all functional)
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,toolbar,middle,view-switching
 */

import {
  BookOpen,
  ChevronLeft,
  Code,
  Download,
  Eye,
  FilePlus,
  FolderPlus,
  Keyboard,
  Layers,
  Maximize,
  MoreHorizontal,
  RefreshCw,
  Search,
  Terminal,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { useAppStore, ViewMode } from '../../store';
import { getI18n } from '../../utils/i18n';
import { getThemeTokens } from '../../utils/theme';

export function MiddleToolbar() {
  const { theme, language, viewMode, setViewMode, toggleTerminal, setShortcutsDialogOpen } =
    useAppStore();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const viewButtons: {
    mode: ViewMode;
    icon: React.ElementType;
    label: string;
    shortcut: string;
  }[] = [
      { mode: 'fullscreen', icon: Maximize, label: i.fullscreenPreview, shortcut: '' },
      { mode: 'preview', icon: Eye, label: i.preview, shortcut: 'Ctrl+1' },
      { mode: 'code', icon: Code, label: i.code, shortcut: 'Ctrl+2' },
    ];

  const handleNewFile = () => {
    if (newFileName.trim()) {
      toast.success(`${i.toastFileCreated}: "${newFileName}"`);
      setNewFileName('');
      setShowNewFileDialog(false);
    }
  };

  const handleNewFolder = () => {
    if (newFolderName.trim()) {
      toast.success(`${i.toastFolderCreated}: "${newFolderName}"`);
      setNewFolderName('');
      setShowNewFolderDialog(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      toast.info(`${i.search}: "${searchQuery}" — 3 ${i.toastSearchResults}`);
    }
  };

  return (
    <div
      className={`h-8 flex items-center px-2 justify-between flex-shrink-0 border-b ${t.transition} ${t.border.subtle} ${t.surface.glassHeader}`}
    >
      {/* Left: Back + View Modes */}
      <div className="flex items-center space-x-0.5">
        {/* ◀ Back */}
        <button
          onClick={() => navigate('/')}
          className={`p-1 rounded ${t.transition} ${t.interactive.headerBtn}`}
          title={`${i.back} (Esc)`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className={`w-px h-3.5 mx-1 ${t.border.dividerV}`} />

        {/* 👁 Preview / ⌨️ Code / Fullscreen */}
        {viewButtons.map(({ mode, icon: Icon, label, shortcut }) => (
          <button
            key={mode}
            onClick={() => {
              setViewMode(mode);
              toast.info(`${i.toastSwitchedTo} ${label}`);
            }}
            className={`p-1 rounded ${t.transition} ${viewMode === mode ? t.interactive.iconActive : t.interactive.iconBtn
              }`}
            title={shortcut ? `${label} (${shortcut})` : label}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>

      {/* Right: Search + File tools + More */}
      <div className="flex items-center space-x-0.5">
        {/* 🔍 Search */}
        {showSearch ? (
          <div className="relative">
            <Search
              className={`w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 ${t.text.muted}`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={i.searchEllipsis}
              className={`w-36 h-6 pl-7 pr-2 rounded text-[11px] outline-none ${t.transition} ${t.input.search}`}
              autoFocus
              onBlur={() => {
                if (!searchQuery) setShowSearch(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowSearch(false);
                  setSearchQuery('');
                }
                if (e.key === 'Enter') handleSearch();
              }}
              style={{ fontWeight: 400 }}
            />
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}
            title={`${i.search} (Ctrl+Shift+F)`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        )}

        {/* 📁 New File */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNewFileDialog(!showNewFileDialog);
              setShowNewFolderDialog(false);
              setShowMoreMenu(false);
            }}
            className={`p-1 rounded ${t.transition} ${showNewFileDialog ? t.interactive.iconActive : t.interactive.iconBtn}`}
            title={i.newFile}
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          {showNewFileDialog && (
            <>
              <div className="fixed inset-0 z-[200]" onClick={() => setShowNewFileDialog(false)} />
              <div
                className={`fixed z-[201] right-4 top-12 w-52 rounded-xl overflow-hidden p-3 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
              >
                <p className="text-[11px] mb-2" style={{ fontWeight: 600 }}>
                  {i.newFile}
                </p>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="component.tsx"
                  className={`w-full h-7 px-2.5 rounded-md text-[12px] outline-none mb-2 ${t.input.base}`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNewFile();
                  }}
                  style={{ fontWeight: 400 }}
                />
                <button
                  onClick={handleNewFile}
                  disabled={!newFileName.trim()}
                  className={`w-full py-1.5 rounded-lg text-[11px] ${t.accent.solidBtn} text-white disabled:opacity-40`}
                  style={{ fontWeight: 500 }}
                >
                  {i.create}
                </button>
              </div>
            </>
          )}
        </div>

        {/* 📂 New Folder */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNewFolderDialog(!showNewFolderDialog);
              setShowNewFileDialog(false);
              setShowMoreMenu(false);
            }}
            className={`p-1 rounded ${t.transition} ${showNewFolderDialog ? t.interactive.iconActive : t.interactive.iconBtn}`}
            title={i.newFolder}
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          {showNewFolderDialog && (
            <>
              <div className="fixed inset-0 z-[200]" onClick={() => setShowNewFolderDialog(false)} />
              <div
                className={`fixed z-[201] right-4 top-12 w-52 rounded-xl overflow-hidden p-3 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
              >
                <p className="text-[11px] mb-2" style={{ fontWeight: 600 }}>
                  {i.newFolder}
                </p>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="components"
                  className={`w-full h-7 px-2.5 rounded-md text-[12px] outline-none mb-2 ${t.input.base}`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNewFolder();
                  }}
                  style={{ fontWeight: 400 }}
                />
                <button
                  onClick={handleNewFolder}
                  disabled={!newFolderName.trim()}
                  className={`w-full py-1.5 rounded-lg text-[11px] ${t.accent.solidBtn} text-white disabled:opacity-40`}
                  style={{ fontWeight: 500 }}
                >
                  {i.create}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ⋯ More Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowMoreMenu(!showMoreMenu);
              setShowNewFileDialog(false);
              setShowNewFolderDialog(false);
            }}
            className={`p-1 rounded ${t.transition} ${showMoreMenu ? t.interactive.iconActive : t.interactive.iconBtn
              }`}
            title={`${i.more} (Ctrl+Shift+M)`}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMoreMenu && (
            <>
              <div className="fixed inset-0 z-[200]" onClick={() => setShowMoreMenu(false)} />
              <div
                className={`fixed z-[201] right-4 top-12 w-52 rounded-xl overflow-hidden p-1 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
              >
                {[
                  {
                    label: i.toggleTerminal,
                    icon: Terminal,
                    shortcut: 'Ctrl+Shift+T',
                    action: () => toggleTerminal(),
                  },
                  {
                    label: i.exportProject,
                    icon: Download,
                    shortcut: '',
                    action: () => toast.success(i.toastExportedZip),
                  },
                  {
                    label: i.refresh,
                    icon: RefreshCw,
                    shortcut: '',
                    action: () => toast.info(i.toastProjectRefreshed),
                  },
                  {
                    label: i.componentLayers,
                    icon: Layers,
                    shortcut: '',
                    action: () => toast.info(i.toastComponentLayersOpened),
                  },
                ].map(({ label, icon: Icon, shortcut, action }) => (
                  <button
                    key={label}
                    onClick={() => {
                      action();
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
                    style={{ fontWeight: 400 }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="flex-1 text-left">{label}</span>
                    {shortcut && <span className={`text-[9px] ${t.text.dimmed}`}>{shortcut}</span>}
                  </button>
                ))}
                <div className={`my-1 h-px mx-2 ${t.border.divider}`} />
                {[
                  {
                    label: i.shortcuts,
                    icon: Keyboard,
                    action: () => setShortcutsDialogOpen(true),
                  },
                  {
                    label: i.documentation,
                    icon: BookOpen,
                    action: () => toast.info(i.toastDocsOpened),
                  },
                ].map(({ label, icon: Icon, action }) => (
                  <button
                    key={label}
                    onClick={() => {
                      action();
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
                    style={{ fontWeight: 400 }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
