/**
 * @file preload.ts
 * @description YYC³便携式智能AI系统 - 资源预加载策略
 * Resource Preloading Strategy for Performance Optimization
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,performance,preload,lazy-loading
 */

export interface PreloadConfig {
  priority: 'high' | 'low' | 'idle'
  timeout?: number
}

const preloadQueue: Array<() => Promise<unknown>> = []
let isProcessing = false

export function preloadComponent(
  importFn: () => Promise<{ default: React.ComponentType }>,
  config: PreloadConfig = { priority: 'idle' }
): void {
  const task = async () => {
    try {
      await importFn()
    } catch (error) {
      console.warn('[Preload] Failed to preload component:', error)
    }
  }

  if (config.priority === 'high') {
    task()
  } else if (config.priority === 'low') {
    setTimeout(task, 100)
  } else {
    preloadQueue.push(task)
    processQueue()
  }
}

async function processQueue(): Promise<void> {
  if (isProcessing || preloadQueue.length === 0) return

  isProcessing = true

  while (preloadQueue.length > 0) {
    const task = preloadQueue.shift()
    if (task) {
      await task()
      await new Promise(resolve => requestIdleCallback(resolve, { timeout: 50 }))
    }
  }

  isProcessing = false
}

export function preloadRoute(routeName: string): void {
  const routeModules: Record<string, () => Promise<unknown>> = {
    'ide': () => import('../components/IDELayout'),
    'settings': () => import('../components/SettingsPage'),
    'home': () => import('../components/HomePage'),
  }

  const moduleLoader = routeModules[routeName]
  if (moduleLoader) {
    preloadComponent(moduleLoader as () => Promise<{ default: React.ComponentType }>, { priority: 'low' })
  }
}

export function preloadCriticalResources(): void {
  preloadComponent(
    () => import('../components/CodeEditor').then(m => ({ default: m.CodeEditor })),
    { priority: 'high' }
  )

  preloadComponent(
    () => import('../components/ChatInterface').then(m => ({ default: m.ChatInterface })),
    { priority: 'high' }
  )

  preloadComponent(
    () => import('../components/FileManager').then(m => ({ default: m.FileManager })),
    { priority: 'high' }
  )
}

export function preloadSecondaryResources(): void {
  const secondaryModules = [
    () => import('../components/ModelSettings').then(m => ({ default: m.ModelSettings })),
    () => import('../components/SearchPanel').then(m => ({ default: m.SearchPanel })),
    () => import('../components/NotificationCenter').then(m => ({ default: m.NotificationCenter })),
    () => import('../components/GitPanel').then(m => ({ default: m.GitPanel })),
    () => import('../components/PerformanceMonitor').then(m => ({ default: m.PerformanceMonitor })),
  ]

  secondaryModules.forEach(importFn => {
    preloadComponent(importFn, { priority: 'idle' })
  })
}

export function prefetchOnHover(href: string): void {
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = href
  link.as = 'document'
  document.head.appendChild(link)
}

export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function preloadFonts(fonts: string[]): Promise<void[]> {
  return Promise.all(
    fonts.map(font => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'font'
      link.href = font
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
      return Promise.resolve()
    })
  )
}

export function initializePreloading(): void {
  if (document.readyState === 'complete') {
    schedulePreloading()
  } else {
    window.addEventListener('load', schedulePreloading)
  }
}

function schedulePreloading(): void {
  setTimeout(() => {
    preloadCriticalResources()
  }, 100)

  setTimeout(() => {
    preloadSecondaryResources()
  }, 2000)
}

if (typeof window !== 'undefined') {
  initializePreloading()
}

declare function requestIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number

interface IdleRequestCallback {
  (deadline: IdleDeadline): void
}

interface IdleDeadline {
  didTimeout: boolean
  timeRemaining(): number
}

interface IdleRequestOptions {
  timeout?: number
}
