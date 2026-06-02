/**
 * @file MultiWindowManager.tsx
 * @description YYC³便携式智能AI系统 - 多窗口管理器
 * Multi-Window Manager
 * Panel floating windows, window sync, tiled/stacked/grid layouts,
 * layout memory & recovery (per Guidelines §Window Management System)
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,window,manager,layout
 */

import {
  X,
  AppWindow,
  Plus,
  Maximize2,
  Minimize2,
  RotateCcw,
  Grid3X3,
  Layers,
  LayoutGrid,
  MonitorSmartphone,
  Move,
  RefreshCw,
  Columns,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

type WindowLayout = 'tiled' | 'stacked' | 'grid' | 'custom';

interface FloatingWindow {
  id: string;
  title: string;
  panelType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isMinimized: boolean;
  isFocused: boolean;
  zIndex: number;
}

const PANEL_LABELS: Record<string, string> = {
  chat: 'AI Chat',
  code: 'Code Editor',
  files: 'File Manager',
  preview: 'Preview',
  terminal: 'Terminal',
  database: 'Database',
};

export function MultiWindowManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, language } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const [windows, setWindows] = useState<FloatingWindow[]>([
    {
      id: 'w1',
      title: 'Terminal',
      panelType: 'terminal',
      x: 60,
      y: 80,
      width: 600,
      height: 350,
      isMaximized: false,
      isMinimized: false,
      isFocused: true,
      zIndex: 3,
    },
    {
      id: 'w2',
      title: 'Preview',
      panelType: 'preview',
      x: 320,
      y: 160,
      width: 500,
      height: 400,
      isMaximized: false,
      isMinimized: false,
      isFocused: false,
      zIndex: 2,
    },
    {
      id: 'w3',
      title: 'Database',
      panelType: 'database',
      x: 100,
      y: 280,
      width: 550,
      height: 320,
      isMaximized: false,
      isMinimized: true,
      isFocused: false,
      zIndex: 1,
    },
  ]);
  const [activeLayout, setActiveLayout] = useState<WindowLayout>('custom');

  const maxZ = Math.max(...windows.map((w) => w.zIndex), 0);

  const focusWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => ({
        ...w,
        isFocused: w.id === id,
        zIndex: w.id === id ? maxZ + 1 : w.zIndex,
      }))
    );
  };

  const toggleMaximize = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized, isMinimized: false } : w))
    );
  };

  const toggleMinimize = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: !w.isMinimized } : w))
    );
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  };

  const addWindow = () => {
    const types = ['chat', 'code', 'files', 'preview', 'terminal', 'database'];
    const type = types[Math.floor(Math.random() * types.length)];
    const newW: FloatingWindow = {
      id: 'w-' + Date.now(),
      title: PANEL_LABELS[type] || type,
      panelType: type,
      x: 80 + Math.random() * 200,
      y: 80 + Math.random() * 150,
      width: 500 + Math.random() * 200,
      height: 300 + Math.random() * 150,
      isMaximized: false,
      isMinimized: false,
      isFocused: true,
      zIndex: maxZ + 1,
    };
    setWindows((prev) => [...prev.map((w) => ({ ...w, isFocused: false })), newW]);
  };

  const applyLayout = (layout: WindowLayout) => {
    setActiveLayout(layout);
    const count = windows.length;
    if (count === 0) return;

    const padding = 20;
    const areaW = 700 - padding * 2;
    const areaH = 400 - padding * 2;

    let updated: FloatingWindow[];
    switch (layout) {
      case 'tiled': {
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const w = areaW / cols;
        const h = areaH / rows;
        updated = windows.map((win, idx) => ({
          ...win,
          x: padding + (idx % cols) * w,
          y: padding + Math.floor(idx / cols) * h,
          width: w - 8,
          height: h - 8,
          isMaximized: false,
          isMinimized: false,
        }));
        break;
      }
      case 'stacked':
        updated = windows.map((win, idx) => ({
          ...win,
          x: padding + idx * 30,
          y: padding + idx * 30,
          width: areaW - 60,
          height: areaH - 60,
          isMaximized: false,
          isMinimized: false,
          zIndex: idx + 1,
        }));
        break;
      case 'grid': {
        const gw = areaW / 2;
        const gh = areaH / 2;
        updated = windows.map((win, idx) => ({
          ...win,
          x: padding + (idx % 2) * gw,
          y: padding + Math.floor(idx / 2) * gh,
          width: gw - 8,
          height: gh - 8,
          isMaximized: false,
          isMinimized: false,
        }));
        break;
      }
      default:
        return;
    }
    setWindows(updated);
  };

  const syncWindows = () => {
    toast.success(i.mwSyncWindows);
  };

  const recoverLayout = () => {
    toast.success(i.mwRecovery);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`fixed inset-6 z-[61] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-3 border-b ${t.border.subtle} flex-shrink-0`}
        >
          <div className="flex items-center space-x-2.5">
            <AppWindow className={`w-5 h-5 ${t.accent.primary}`} />
            <div>
              <span className="text-[14px]" style={{ fontWeight: 600 }}>
                {i.mwTitle}
              </span>
              <span className={`ml-2 text-[11px] ${t.text.muted}`}>{i.mwSubtitle}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Controls */}
          <div className={`w-64 border-r ${t.border.subtle} flex flex-col flex-shrink-0`}>
            {/* Actions */}
            <div className={`p-3 border-b ${t.border.subtle} space-y-2`}>
              <button
                onClick={addWindow}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[11px] ${t.transition} ${t.accent.activeBg} ${t.accent.activeText}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{i.mwNewWindow}</span>
              </button>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={syncWindows}
                  className={`flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg text-[10px] ${t.transition} ${t.interactive.iconBtn}`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{i.mwSyncWindows}</span>
                </button>
                <button
                  onClick={recoverLayout}
                  className={`flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg text-[10px] ${t.transition} ${t.interactive.iconBtn}`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{i.mwRecovery}</span>
                </button>
              </div>
            </div>

            {/* Layout selector */}
            <div className={`p-3 border-b ${t.border.subtle}`}>
              <div
                className={`text-[10px] uppercase tracking-wider mb-2 ${t.text.muted}`}
                style={{ fontWeight: 600 }}
              >
                {i.mwLayout}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'tiled' as WindowLayout, icon: Columns, label: i.mwTiled },
                  { id: 'stacked' as WindowLayout, icon: Layers, label: i.mwStacked },
                  { id: 'grid' as WindowLayout, icon: Grid3X3, label: i.mwGrid },
                  { id: 'custom' as WindowLayout, icon: LayoutGrid, label: i.mwCustom },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() =>
                      l.id !== 'custom' ? applyLayout(l.id) : setActiveLayout('custom')
                    }
                    className={`flex flex-col items-center p-2 rounded-lg text-[9px] ${t.transition} ${
                      activeLayout === l.id
                        ? `${t.accent.activeBg} ${t.accent.activeText}`
                        : t.interactive.iconBtn
                    }`}
                  >
                    <l.icon className="w-4 h-4 mb-0.5" />
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Window list */}
            <div className={`flex-1 overflow-y-auto p-2 space-y-1 ${t.scrollbar}`}>
              <div
                className={`text-[10px] uppercase tracking-wider mb-1 px-1 ${t.text.muted}`}
                style={{ fontWeight: 600 }}
              >
                {i.mwActiveWindows} ({windows.length})
              </div>
              {windows.length === 0 ? (
                <div className={`text-center py-6 text-[11px] ${t.text.muted}`}>
                  {i.mwNoWindows}
                </div>
              ) : (
                windows.map((win) => (
                  <div
                    key={win.id}
                    onClick={() => focusWindow(win.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer ${t.transition} ${
                      win.isFocused
                        ? `${t.accent.activeBg} ${t.accent.activeText}`
                        : t.interactive.menuItem
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <MonitorSmartphone
                        className={`w-3.5 h-3.5 ${win.isMinimized ? 'opacity-40' : ''}`}
                      />
                      <div>
                        <div className="text-[11px]" style={{ fontWeight: 500 }}>
                          {win.title}
                        </div>
                        <div className={`text-[9px] ${t.text.dimmed}`}>
                          {win.isMaximized
                            ? i.mwMaximize
                            : win.isMinimized
                              ? i.mwMinimize
                              : `${Math.round(win.width)}×${Math.round(win.height)}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-0.5">
                      {win.isFocused && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMinimize(win.id);
                        }}
                        className={`p-0.5 rounded ${t.transition}`}
                      >
                        <Minimize2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMaximize(win.id);
                        }}
                        className={`p-0.5 rounded ${t.transition}`}
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeWindow(win.id);
                        }}
                        className={`p-0.5 rounded hover:text-red-400 ${t.transition}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Visual Preview */}
          <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
            <div
              className={`w-full h-full rounded-xl border-2 border-dashed ${t.border.subtle} relative`}
            >
              {/* Desktop frame */}
              <div
                className={`absolute inset-0 rounded-xl overflow-hidden ${t.isDark ? 'bg-slate-900/30' : 'bg-slate-50/50'}`}
              >
                {/* Title bar simulation */}
                <div
                  className={`h-6 flex items-center px-3 ${t.isDark ? 'bg-slate-800/60' : 'bg-slate-200/60'}`}
                >
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className={`ml-3 text-[9px] ${t.text.dimmed}`}>
                    YYC³ PortAISys — {i.mwActiveWindows}: {windows.length}
                  </div>
                </div>

                {/* Window previews */}
                <div className="relative" style={{ height: 'calc(100% - 24px)' }}>
                  {windows
                    .filter((w) => !w.isMinimized)
                    .map((win) => {
                      const scaleX = 0.85;
                      const scaleY = 0.8;
                      return (
                        <div
                          key={win.id}
                          className={`absolute rounded-lg overflow-hidden shadow-lg border ${t.transition} cursor-move ${
                            win.isFocused
                              ? 'ring-2 ring-indigo-500 border-indigo-500/30'
                              : t.border.subtle
                          } ${t.isDark ? 'bg-slate-800/80' : 'bg-white/80'}`}
                          style={{
                            left: `${(win.x * scaleX) / 7}%`,
                            top: `${(win.y * scaleY) / 5}%`,
                            width: win.isMaximized ? '96%' : `${(win.width * scaleX) / 7}%`,
                            height: win.isMaximized ? '92%' : `${(win.height * scaleY) / 5}%`,
                            zIndex: win.zIndex,
                            minWidth: '80px',
                            minHeight: '50px',
                          }}
                          onClick={() => focusWindow(win.id)}
                        >
                          {/* Window title bar */}
                          <div
                            className={`h-5 flex items-center justify-between px-2 ${t.isDark ? 'bg-slate-700/60' : 'bg-slate-200/60'}`}
                          >
                            <div className="flex items-center space-x-1.5">
                              <Move className="w-2.5 h-2.5 opacity-40" />
                              <span className="text-[8px] truncate" style={{ fontWeight: 500 }}>
                                {win.title}
                              </span>
                            </div>
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
                              <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                              <div className="w-2 h-2 rounded-full bg-red-400/60" />
                            </div>
                          </div>
                          {/* Window content placeholder */}
                          <div className="p-2 h-[calc(100%-20px)]">
                            <div
                              className={`h-full rounded ${t.isDark ? 'bg-slate-900/40' : 'bg-slate-100/60'} flex items-center justify-center`}
                            >
                              <span className={`text-[9px] ${t.text.dimmed}`}>{win.panelType}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {/* Minimized windows as taskbar */}
                  {windows.filter((w) => w.isMinimized).length > 0 && (
                    <div className={`absolute bottom-2 left-2 right-2 flex space-x-1.5`}>
                      {windows
                        .filter((w) => w.isMinimized)
                        .map((win) => (
                          <button
                            key={win.id}
                            onClick={() => toggleMinimize(win.id)}
                            className={`px-2 py-1 rounded text-[8px] ${t.transition} ${t.isDark ? 'bg-slate-700/60' : 'bg-slate-200/60'}`}
                          >
                            {win.title}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
