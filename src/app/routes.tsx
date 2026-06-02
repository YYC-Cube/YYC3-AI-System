/**
 * file: routes.tsx
 * description: 应用路由配置 - 定义应用的路由结构和代码分割
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-03-20
 * updated: 2026-04-01
 * status: active
 * tags: [routing],[react-router],[app-configuration],[code-splitting]
 *
 * brief: 应用路由配置，支持代码分割和懒加载
 *
 * details:
 * - 路由结构定义
 * - 首页路由
 * - IDE布局路由
 * - 设置页面路由
 * - 路由级代码分割
 * - 加载状态处理
 *
 * dependencies: React, React Router
 * exports: router
 * notes: 使用React.lazy()实现代码分割
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';

import { IDELayoutSkeleton } from './components/Skeleton';

const HomePage = lazy(() => import('./components/HomePage').then((m) => ({ default: m.HomePage })));
const IDELayout = lazy(() =>
  import('./components/IDELayout').then((m) => ({ default: m.IDELayout }))
);
const SettingsPage = lazy(() =>
  import('./components/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

function LoadingFallback({ type = 'default' }: { type?: 'default' | 'ide' | 'settings' }) {
  if (type === 'ide') {
    return <IDELayoutSkeleton theme="dark" />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 dark">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm">加载中...</p>
      </div>
    </div>
  );
}

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <HomePage />
      </Suspense>
    ),
  },
  {
    path: '/ide',
    element: (
      <Suspense fallback={<LoadingFallback type="ide" />}>
        <IDELayout />
      </Suspense>
    ),
  },
  {
    path: '/settings',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <SettingsPage />
      </Suspense>
    ),
  },
]);
