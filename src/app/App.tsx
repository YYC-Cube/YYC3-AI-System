/**
 * @file App.tsx
 * @description YYC³便携式智能AI系统 - 主应用组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags app,react,main-component,entry-point
 */

import { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'

import { ErrorBoundary } from './components/ErrorBoundary'
import { router } from './routes'
import { syncAIModelsToAppStore } from './services/settings-integration'
import { useAppStore } from './store'
import { getThemeTokens } from './utils/theme'

export default function App() {
  const theme = useAppStore((s) => s.theme)
  const customThemeConfig = useAppStore((s) => s.customThemeConfig)

  // Sync AI models from aiProviderService on app mount
  useEffect(() => {
    syncAIModelsToAppStore()
  }, [])

  // Apply dark class for Tailwind
  useEffect(() => {
    const t = getThemeTokens(theme)
    if (t.isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Apply customThemeConfig colors to CSS variables for runtime override
  useEffect(() => {
    if (!customThemeConfig) return
    const root = document.documentElement
    const c = customThemeConfig.colors
    const f = customThemeConfig.fonts
    const r = customThemeConfig.radius

    if (c) {
      if (c.primary) root.style.setProperty('--yyc3-primary', c.primary)
      if (c.secondary) root.style.setProperty('--yyc3-secondary', c.secondary)
      if (c.accent) root.style.setProperty('--yyc3-accent', c.accent)
      if (c.background) root.style.setProperty('--yyc3-background', c.background)
      if (c.card) root.style.setProperty('--yyc3-card', c.card)
      if (c.border) root.style.setProperty('--yyc3-border', c.border)
      // Derived alpha shades for glass effects
      if (c.primary) {
        root.style.setProperty('--yyc3-primary-10', c.primary + '1a')
        root.style.setProperty('--yyc3-primary-20', c.primary + '33')
      }
      if (c.accent) {
        root.style.setProperty('--yyc3-accent-10', c.accent + '1a')
        root.style.setProperty('--yyc3-accent-20', c.accent + '33')
      }
    }
    if (f) {
      if (f.sans) root.style.setProperty('--yyc3-font-sans', f.sans)
      if (f.mono) root.style.setProperty('--yyc3-font-mono', f.mono)
    }
    if (r) {
      if (r.sm) root.style.setProperty('--yyc3-radius-sm', r.sm)
      if (r.md) root.style.setProperty('--yyc3-radius-md', r.md)
      if (r.lg) root.style.setProperty('--yyc3-radius-lg', r.lg)
    }
  }, [customThemeConfig])

  const t = getThemeTokens(theme)

  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        richColors
        closeButton
        theme={t.isDark ? 'dark' : 'light'}
        duration={3000}
        toastOptions={{
          style: {
            background: t.isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            border: t.isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            color: t.isDark ? '#e2e8f0' : '#1e293b',
            fontSize: '13px',
            cursor: 'pointer',
            userSelect: 'none',
          },
        }}
      />
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.8);
        }
        @keyframes peelReveal {
          0% { clip-path: circle(0%); opacity: 1; }
          60% { clip-path: circle(100%); opacity: 0.6; }
          100% { clip-path: circle(150%); opacity: 0; }
        }
      `}</style>
    </ErrorBoundary>
  )
}