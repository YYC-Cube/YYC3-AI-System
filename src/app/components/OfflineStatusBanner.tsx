/**
 * @file OfflineStatusBanner.tsx
 * @description YYC³便携式智能AI系统 - 离线状态提示组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,offline,pwa,ui,critical
 */

import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useOfflineDetection } from './ServiceWorkerRegister';

/**
 * 离线状态类型
 */
type OfflineStatus = 'online' | 'offline' | 'reconnecting';

/**
 * 离线状态提示组件
 *
 * 功能:
 * - 实时显示网络状态
 * - 离线时显示提示
 * - 重新连接时自动刷新
 * - 支持手动刷新
 *
 * @example
 * ```tsx
 * <OfflineStatusBanner />
 * ```
 */
export function OfflineStatusBanner() {
  const [status, setStatus] = useState<OfflineStatus>('online');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isOffline } = useOfflineDetection();

  // 监听网络状态变化
  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineBanner] Network status: online');
      setStatus('online');
      console.log('[OfflineBanner] Network restored');

      // 3秒后清除提示
      setTimeout(() => {
        setStatus('online');
      }, 3000);
    };

    const handleOffline = () => {
      console.log('[OfflineBanner] Network status: offline');
      setStatus('offline');
      console.warn('[OfflineBanner] App switched to offline mode');
    };

    // 检查初始状态
    if (isOffline) {
      setStatus('offline');
    }

    // 监听网络事件
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOffline]);

  // 手动刷新
  const handleRefresh = async () => {
    if (navigator.onLine) {
      setIsRefreshing(true);
      try {
        window.location.reload();
      } catch (error) {
        console.error('[OfflineBanner] Refresh failed:', error);
        setIsRefreshing(false);
      }
    }
  };

  // 如果在线且不是正在重新连接状态，不显示提示
  if (status === 'online' && !isOffline) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 shadow-lg transition-all duration-300 ${
        isOffline ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* 左侧：状态图标和消息 */}
        <div className="flex items-center gap-3">
          {isOffline ? <WifiOff className="h-5 w-5 animate-pulse" /> : <Wifi className="h-5 w-5" />}
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{isOffline ? '离线模式' : '网络已恢复'}</span>
            <span className="text-xs opacity-90">
              {isOffline ? '应用正在使用缓存数据，部分功能可能受限' : '所有功能已恢复正常'}
            </span>
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          {isOffline ? (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="刷新页面"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>
          ) : (
            <span className="text-xs opacity-90" />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 离线状态指示器组件（小型）
 *
 * 适用于页面顶部导航栏或其他需要状态指示的位置
 */
export function OfflineIndicator() {
  const { isOffline } = useOfflineDetection();

  if (!isOffline) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium"
      role="status"
      aria-label="离线状态"
    >
      <WifiOff className="h-3 w-3" />
      <span>离线</span>
    </div>
  );
}

/**
 * 离线警告组件
 *
 * 当用户尝试执行需要网络的操作时显示
 */
export function OfflineWarning({
  message = '此功能需要网络连接',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const { isOffline } = useOfflineDetection();

  if (!isOffline) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <WifiOff className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-amber-900 mb-1">网络连接不可用</h4>
          <p className="text-sm text-amber-700 mb-2">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm font-medium text-amber-900 hover:text-amber-700 underline"
            >
              重试
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 获取网络状态
 *
 * 工具函数，用于在非React组件中检查网络状态
 */
export function getNetworkStatus(): {
  isOnline: boolean;
  isOffline: boolean;
  type: string | null;
  effectiveType: string | null;
} {
  const nav = navigator as Navigator & {
    connection?: { type?: string; effectiveType?: string };
    mozConnection?: { type?: string; effectiveType?: string };
    webkitConnection?: { type?: string; effectiveType?: string };
  };
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  return {
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    type: connection?.type || null,
    effectiveType: connection?.effectiveType || null,
  };
}

/**
 * 监听网络状态变化
 *
 * 工具函数，用于在非React组件中监听网络状态
 */
export function listenNetworkStatus(onOnline: () => void, onOffline: () => void): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
