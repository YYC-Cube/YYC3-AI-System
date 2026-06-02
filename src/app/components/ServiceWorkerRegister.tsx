/**
 * @file ServiceWorkerRegister.tsx
 * @description Service Worker注册组件,在应用启动时自动注册并管理更新
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service-worker,pwa,register,component,critical
 */

import { useEffect, useState } from 'react';

interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isWaiting: boolean;
  isActive: boolean;
  version: string | null;
  error: Error | null;
}

interface ServiceWorkerRegisterProps {
  /** Service Worker文件路径,默认为/sw.ts构建后的文件 */
  swPath?: string;
  /** 是否显示更新提示,默认为true */
  showUpdatePrompt?: boolean;
  /** 是否自动跳过等待,默认为false */
  autoSkipWaiting?: boolean;
  /** 注册成功回调 */
  onRegistered?: (registration: ServiceWorkerRegistration) => void;
  /** 更新可用回调 */
  onUpdateAvailable?: (registration: ServiceWorkerRegistration) => void;
  /** 更新完成回调 */
  onUpdateReady?: (registration: ServiceWorkerRegistration) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * Service Worker注册组件
 *
 * 功能:
 * - 自动检测浏览器支持
 * - 注册Service Worker
 * - 检测并提示更新
 * - 管理Service Worker生命周期
 *
 * @example
 * ```tsx
 * <ServiceWorkerRegister
 *   showUpdatePrompt={true}
 *   onRegistered={(reg) => console.log('Registered:', reg)}
 *   onUpdateAvailable={(reg) => console.log('Update available:', reg)}
 *   onUpdateReady={(reg) => {
 *     // 用户点击更新按钮后调用
 *     reg.waiting?.postMessage({ type: 'SKIP_WAITING' })
 *   }}
 * />
 * ```
 */
export function ServiceWorkerRegister({
  swPath = '/sw.js',
  showUpdatePrompt = true,
  autoSkipWaiting = false,
  onRegistered,
  onUpdateAvailable,
  onUpdateReady,
  onError,
}: ServiceWorkerRegisterProps) {
  const [_status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isWaiting: false,
    isActive: false,
    version: null,
    error: null,
  });

  const [_showUpdatePromptState, setShowUpdatePromptState] = useState(false);

  useEffect(() => {
    // 检查Service Worker支持
    if (!('serviceWorker' in navigator)) {
      setStatus((prev) => ({
        ...prev,
        isSupported: false,
        error: new Error('Service Worker not supported'),
      }));
      onError?.(new Error('Service Worker not supported'));
      console.warn('[SW] Service Worker not supported');
      return;
    }

    // 开发模式下禁用Service Worker注册
    if (import.meta.env.DEV) {
      console.log('[SW] Service Worker disabled in development mode');
      setStatus((prev) => ({
        ...prev,
        isSupported: true,
        isRegistered: false,
      }));
      return;
    }

    setStatus((prev) => ({ ...prev, isSupported: true }));

    // 注册Service Worker
    registerServiceWorker();

    // 监听控制器变化
    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  /**
   * 注册Service Worker
   */
  const registerServiceWorker = async () => {
    try {
      // 等待页面加载完成
      if (document.readyState === 'loading') {
        await new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // 注册Service Worker
      const registration = await navigator.serviceWorker.register(swPath, {
        updateViaCache: 'none', // 避免浏览器缓存Service Worker
      });

      console.log('[SW] Service Worker registered:', registration);

      setStatus((prev) => ({
        ...prev,
        isRegistered: true,
        isActive: !!registration.active,
        version: (registration.active as any)?.__SW_VERSION__ || null,
      }));

      onRegistered?.(registration);

      // 检查更新
      registration.addEventListener('updatefound', () => {
        console.log('[SW] Update found');
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 新的Service Worker已安装,但旧的还在使用中
              console.log('[SW] New service worker available');
              setStatus((prev) => ({ ...prev, isWaiting: true }));
              setShowUpdatePromptState(true);
              onUpdateAvailable?.(registration);

              if (showUpdatePrompt) {
                console.log('[SW] New version available, prompt user to update');
              }

              // 自动跳过等待
              if (autoSkipWaiting) {
                updateServiceWorker(registration);
              }
            } else if (newWorker.state === 'activated') {
              // 新的Service Worker已激活
              console.log('[SW] Service worker activated');
              setStatus((prev) => ({
                ...prev,
                isWaiting: false,
                isActive: true,
              }));
              setShowUpdatePromptState(false);
              onUpdateReady?.(registration);
            }
          });
        }
      });

      // 检查是否有等待中的Service Worker
      if (registration.waiting) {
        console.log('[SW] Waiting service worker found');
        setStatus((prev) => ({ ...prev, isWaiting: true }));
        setShowUpdatePromptState(true);
        onUpdateAvailable?.(registration);

        if (autoSkipWaiting) {
          updateServiceWorker(registration);
        }
      }

      // 获取Service Worker版本信息
      if (registration.active) {
        const channel = new MessageChannel();
        registration.active.postMessage({ type: 'GET_VERSION' }, [channel.port2]);

        channel.port1.onmessage = (event) => {
          console.log('[SW] Service Worker version:', event.data.version);
          setStatus((prev) => ({ ...prev, version: event.data.version }));
        };
      }
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
      setStatus((prev) => ({
        ...prev,
        error: error as Error,
      }));
      onError?.(error as Error);
    }
  };

  /**
   * 更新Service Worker
   */
  const updateServiceWorker = (registration: ServiceWorkerRegistration) => {
    console.log('[SW] Updating service worker');
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    console.log('[SW] Updating to new version...');
  };

  // 不渲染任何UI,只提供状态和方法
  return null;
}

/**
 * Service Worker状态Hook
 *
 * @example
 * ```tsx
 * const swStatus = useServiceWorkerStatus()
 * if (swStatus.isWaiting) {
 *   <button onClick={swStatus.update}>更新应用</button>
 * }
 * ```
 */
export function useServiceWorkerStatus() {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isWaiting: false,
    isActive: false,
    version: null,
    error: null,
  });

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setStatus((prev) => ({ ...prev, isSupported: false }));
      return;
    }

    setStatus((prev) => ({ ...prev, isSupported: true }));

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        setStatus((prev) => ({
          ...prev,
          isRegistered: true,
          isActive: !!registration.active,
          isWaiting: !!registration.waiting,
          version: (registration.active as any)?.__SW_VERSION__ || null,
        }));

        registration.addEventListener('updatefound', () => {
          setStatus((prev) => ({ ...prev, isWaiting: true }));
        });
      }
    });
  }, []);

  /**
   * 更新Service Worker
   */
  const update = async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  /**
   * 清除缓存
   */
  const clearCache = async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;

    const channel = new MessageChannel();
    registration.active?.postMessage({ type: 'CLEAR_CACHE' }, [channel.port2]);
  };

  return {
    ...status,
    update,
    clearCache,
  };
}

/**
 * 离线检测Hook
 *
 * @example
 * ```tsx
 * const { isOnline, isOffline } = useOfflineDetection()
 * if (isOffline) {
 *   <p>当前处于离线状态</p>
 * }
 * ```
 */
export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[SW] Online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[SW] Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}
