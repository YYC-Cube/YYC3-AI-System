/**
 * @file OfflineCache.tsx
 * @description YYC³便携式智能AI系统 - 离线缓存管理器
 * Offline Cache Manager
 * Service Worker strategy config, asset precaching, online/offline status
 * indicator, cache size monitoring (per Guidelines §Offline-First)
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,offline,cache,service-worker
 */

import {
  X,
  Wifi,
  WifiOff,
  HardDrive,
  RefreshCw,
  Trash2,
  FileCode,
  Image,
  Type,
  Database,
  Shield,
  CheckCircle,
  Download,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate';

interface CacheCategory {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  strategy: CacheStrategy;
  enabled: boolean;
  itemCount: number;
  size: number; // bytes
}

export function OfflineCache({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, language } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swEnabled, setSwEnabled] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [precaching, setPrecaching] = useState(false);
  const [lastSync, setLastSync] = useState(Date.now() - 300000);

  const [categories, setCategories] = useState<CacheCategory[]>([
    {
      id: 'assets',
      name: '',
      icon: FileCode,
      strategy: 'cache-first',
      enabled: true,
      itemCount: 142,
      size: 3_200_000,
    },
    {
      id: 'api',
      name: '',
      icon: Database,
      strategy: 'network-first',
      enabled: true,
      itemCount: 38,
      size: 450_000,
    },
    {
      id: 'fonts',
      name: '',
      icon: Type,
      strategy: 'cache-first',
      enabled: true,
      itemCount: 8,
      size: 820_000,
    },
    {
      id: 'images',
      name: '',
      icon: Image,
      strategy: 'stale-while-revalidate',
      enabled: true,
      itemCount: 56,
      size: 5_600_000,
    },
  ]);

  // Resolve names based on i18n
  const getCatName = (id: string) => {
    switch (id) {
      case 'assets':
        return i.swAssets;
      case 'api':
        return i.swApi;
      case 'fonts':
        return i.swFonts;
      case 'images':
        return i.swImages;
      default:
        return id;
    }
  };

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const totalCacheSize = categories.reduce((sum, c) => sum + (c.enabled ? c.size : 0), 0);
  const totalItems = categories.reduce((sum, c) => sum + (c.enabled ? c.itemCount : 0), 0);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    return `${Math.floor(diff / 3600000)}h`;
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSync(Date.now());
      toast.success(i.swCacheCleared.replace('cleared', 'synced'));
    }, 2000);
  };

  const handlePrecache = () => {
    setPrecaching(true);
    setTimeout(() => {
      setPrecaching(false);
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          itemCount: c.itemCount + Math.floor(Math.random() * 10),
          size: c.size + Math.floor(Math.random() * 100000),
        }))
      );
      toast.success(i.swPrecache);
    }, 3000);
  };

  const handleClearCache = () => {
    setCategories((prev) => prev.map((c) => ({ ...c, itemCount: 0, size: 0 })));
    toast.success(i.swCacheCleared);
  };

  const toggleCategory = (id: string) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
  };

  const updateStrategy = (id: string, strategy: CacheStrategy) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, strategy } : c)));
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed inset-0 z-[61] flex items-center justify-center p-8`}>
        <div
          className={`w-full max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-5 py-3 border-b ${t.border.subtle} flex-shrink-0`}
          >
            <div className="flex items-center space-x-2.5">
              <HardDrive className={`w-5 h-5 ${t.accent.primary}`} />
              <div>
                <span className="text-[14px]" style={{ fontWeight: 600 }}>
                  {i.swTitle}
                </span>
                <span className={`ml-2 text-[11px] ${t.text.muted}`}>{i.swSubtitle}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Online/Offline indicator */}
              <div
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] ${
                  isOnline ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                }`}
                style={{ fontWeight: 500 }}
              >
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{isOnline ? i.swOnline : i.swOffline}</span>
              </div>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto p-5 space-y-5 ${t.scrollbar}`}>
            {/* Overview cards */}
            <div className="grid grid-cols-4 gap-3">
              <div className={`p-3 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                <div className={`text-[10px] ${t.text.dimmed}`}>{i.swStatus}</div>
                <div className="flex items-center space-x-1.5 mt-1">
                  {swEnabled ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <X className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-[13px]" style={{ fontWeight: 600 }}>
                    {swEnabled ? i.swEnabled : i.swDisabled}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                <div className={`text-[10px] ${t.text.dimmed}`}>{i.swCacheSize}</div>
                <div className="text-[13px] mt-1" style={{ fontWeight: 600 }}>
                  {formatSize(totalCacheSize)}
                </div>
              </div>
              <div className={`p-3 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                <div className={`text-[10px] ${t.text.dimmed}`}>{i.swCached}</div>
                <div className="text-[13px] mt-1" style={{ fontWeight: 600 }}>
                  {totalItems} items
                </div>
              </div>
              <div className={`p-3 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                <div className={`text-[10px] ${t.text.dimmed}`}>{i.swLastSync}</div>
                <div className="text-[13px] mt-1" style={{ fontWeight: 600 }}>
                  {timeAgo(lastSync)} ago
                </div>
              </div>
            </div>

            {/* SW toggle + actions */}
            <div
              className={`flex items-center justify-between p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}
            >
              <div className="flex items-center space-x-3">
                <Shield className={`w-5 h-5 ${swEnabled ? 'text-indigo-400' : t.text.dimmed}`} />
                <div>
                  <div className="text-[12px]" style={{ fontWeight: 500 }}>
                    Service Worker
                  </div>
                  <div className={`text-[10px] ${t.text.dimmed}`}>Workbox Runtime Caching</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrecache}
                  disabled={precaching}
                  className={`px-3 py-1.5 rounded-lg text-[11px] flex items-center space-x-1.5 ${t.transition} ${t.interactive.iconBtn}`}
                >
                  {precaching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{precaching ? i.swPrecaching : i.swPrecache}</span>
                </button>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className={`px-3 py-1.5 rounded-lg text-[11px] flex items-center space-x-1.5 ${t.transition} ${t.interactive.iconBtn}`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? i.swSyncing : i.swSyncNow}</span>
                </button>
                <button
                  onClick={handleClearCache}
                  className={`px-3 py-1.5 rounded-lg text-[11px] flex items-center space-x-1.5 ${t.transition} hover:bg-red-500/15 text-red-400`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{i.swClearCache}</span>
                </button>
                <button
                  onClick={() => setSwEnabled(!swEnabled)}
                  className={`p-1 rounded ${t.transition}`}
                >
                  {swEnabled ? (
                    <ToggleRight className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Cache categories */}
            <div>
              <div
                className={`text-[11px] uppercase tracking-wider mb-3 ${t.text.muted}`}
                style={{ fontWeight: 600 }}
              >
                {i.swStrategy}
              </div>
              <div className="space-y-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div
                      key={cat.id}
                      className={`p-4 rounded-xl ${t.isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2.5">
                          <Icon
                            className={`w-4 h-4 ${cat.enabled ? 'text-indigo-400' : t.text.dimmed}`}
                          />
                          <span className="text-[12px]" style={{ fontWeight: 500 }}>
                            {getCatName(cat.id)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-[10px] ${t.text.dimmed}`}>
                            {cat.itemCount} items · {formatSize(cat.size)}
                          </span>
                          <button
                            onClick={() => toggleCategory(cat.id)}
                            className={`p-0.5 rounded ${t.transition}`}
                          >
                            {cat.enabled ? (
                              <ToggleRight className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Strategy selector */}
                      <div className="flex items-center space-x-1.5">
                        {[
                          { id: 'cache-first' as CacheStrategy, label: i.swCacheFirst },
                          { id: 'network-first' as CacheStrategy, label: i.swNetworkFirst },
                          {
                            id: 'stale-while-revalidate' as CacheStrategy,
                            label: i.swStaleRevalidate,
                          },
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => updateStrategy(cat.id, s.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] ${t.transition} ${
                              cat.strategy === s.id
                                ? `${t.accent.activeBg} ${t.accent.activeText}`
                                : t.interactive.iconBtn
                            }`}
                            style={{ fontWeight: cat.strategy === s.id ? 500 : 400 }}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div
                        className={`mt-2.5 h-1.5 rounded-full overflow-hidden ${t.isDark ? 'bg-slate-700/40' : 'bg-slate-200'}`}
                      >
                        <div
                          className="h-full rounded-full bg-indigo-500/60 transition-all"
                          style={{ width: `${Math.min(100, (cat.size / 6_000_000) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workbox config preview */}
            <div>
              <div
                className={`text-[11px] uppercase tracking-wider mb-2 ${t.text.muted}`}
                style={{ fontWeight: 600 }}
              >
                Workbox Config
              </div>
              <pre
                className={`p-4 rounded-xl text-[11px] font-mono overflow-x-auto ${t.isDark ? 'bg-slate-900/60 text-slate-300' : 'bg-slate-100 text-slate-700'}`}
              >{`// sw.js (Workbox Runtime Caching)
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

${categories
  .filter((c) => c.enabled)
  .map((c) => {
    const strategyMap: Record<CacheStrategy, string> = {
      'cache-first': 'CacheFirst',
      'network-first': 'NetworkFirst',
      'stale-while-revalidate': 'StaleWhileRevalidate',
    };
    return `registerRoute(
  ({request}) => request.destination === '${c.id}',
  new ${strategyMap[c.strategy]}({ cacheName: 'yyc3-${c.id}' })
)`;
  })
  .join('\n\n')}`}</pre>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
