/**
 * @file Skeleton.tsx
 * @description YYC³便携式智能AI系统 - 骨架屏加载组件
 * Skeleton Loading Components for Better Perceived Performance
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,ui,skeleton,loading
 */

import React from 'react'

import { getThemeTokens } from '../utils/theme'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  animate?: boolean
  theme?: 'light' | 'dark'
}

export function Skeleton({
  className = '',
  width,
  height,
  borderRadius,
  animate = true,
  theme = 'dark',
}: SkeletonProps) {
  const _t = getThemeTokens(theme)
  void _t

  const style: React.CSSProperties = {
    width: width,
    height: height,
    borderRadius: borderRadius || 8,
  }

  return (
    <div
      className={`${animate ? 'animate-pulse' : ''} ${className}`}
      style={{
        ...style,
        background: theme === 'dark'
          ? 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)'
          : 'linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.05) 75%)',
        backgroundSize: '200% 100%',
      }}
    />
  )
}

export function TextSkeleton({
  lines = 3,
  lineHeight = 16,
  lineHeightLast = '60%',
  className = '',
  theme = 'dark',
}: {
  lines?: number
  lineHeight?: number
  lineHeightLast?: string | number
  className?: string
  theme?: 'light' | 'dark'
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? lineHeightLast : '100%'}
          theme={theme}
        />
      ))}
    </div>
  )
}

export function AvatarSkeleton({
  size = 40,
  className = '',
  theme = 'dark',
}: {
  size?: number
  className?: string
  theme?: 'light' | 'dark'
}) {
  return (
    <Skeleton
      className={className}
      width={size}
      height={size}
      borderRadius="50%"
      theme={theme}
    />
  )
}

export function CardSkeleton({
  className = '',
  showHeader = true,
  showAvatar = false,
  lines = 3,
  theme = 'dark',
}: {
  className?: string
  showHeader?: boolean
  showAvatar?: boolean
  lines?: number
  theme?: 'light' | 'dark'
}) {
  const _t = getThemeTokens(theme)
  void _t

  return (
    <div
      className={`p-4 rounded-xl ${className}`}
      style={{
        background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
      }}
    >
      {showHeader && (
        <div className="flex items-center gap-3 mb-4">
          {showAvatar && <AvatarSkeleton theme={theme} />}
          <div className="flex-1">
            <Skeleton height={14} width="40%" theme={theme} />
            <Skeleton height={12} width="60%" className="mt-1.5" theme={theme} />
          </div>
        </div>
      )}
      <TextSkeleton lines={lines} theme={theme} />
    </div>
  )
}

export function FileTreeSkeleton({
  items = 5,
  className = '',
  theme = 'dark',
}: {
  items?: number
  className?: string
  theme?: 'light' | 'dark'
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5">
          <Skeleton width={16} height={16} borderRadius={4} theme={theme} />
          <Skeleton height={14} width={`${60 + Math.random() * 30}%`} theme={theme} />
        </div>
      ))}
    </div>
  )
}

export function CodeEditorSkeleton({
  className = '',
  theme = 'dark',
}: {
  className?: string
  theme?: 'light' | 'dark'
}) {
  return (
    <div
      className={`p-4 ${className}`}
      style={{
        background: theme === 'dark' ? '#0d1117' : '#ffffff',
      }}
    >
      <div className="flex gap-4">
        <div className="flex flex-col items-end pr-4 select-none" style={{ color: theme === 'dark' ? '#484f58' : '#8b949e' }}>
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="text-xs leading-6 font-mono">{i + 1}</div>
          ))}
        </div>
        <div className="flex-1 font-mono text-sm">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="flex items-center h-6 gap-2">
              <Skeleton
                height={12}
                width={`${20 + Math.random() * 60}%`}
                borderRadius={2}
                theme={theme}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ChatSkeleton({
  messages = 3,
  className = '',
  theme = 'dark',
}: {
  messages?: number
  className?: string
  theme?: 'light' | 'dark'
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: messages }).map((_, i) => (
        <div
          key={i}
          className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}
        >
          <AvatarSkeleton size={32} theme={theme} />
          <div
            className={`max-w-[70%] p-3 rounded-xl ${
              i % 2 === 0
                ? theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'
                : theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-50'
            }`}
          >
            <TextSkeleton lines={1 + Math.floor(Math.random() * 2)} lineHeight={14} theme={theme} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PanelSkeleton({
  className = '',
  theme = 'dark',
}: {
  className?: string
  theme?: 'light' | 'dark'
}) {
  return (
    <div
      className={`rounded-xl overflow-hidden ${className}`}
      style={{
        background: theme === 'dark' ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.8)',
        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <Skeleton height={16} width={100} theme={theme} />
        <div className="flex gap-1.5">
          <Skeleton height={20} width={20} borderRadius={4} theme={theme} />
          <Skeleton height={20} width={20} borderRadius={4} theme={theme} />
        </div>
      </div>
      <div className="p-3">
        <TextSkeleton lines={5} theme={theme} />
      </div>
    </div>
  )
}

export function IDELayoutSkeleton({ theme = 'dark' }: { theme?: 'light' | 'dark' }) {
  return (
    <div className="h-screen flex flex-col" style={{ background: theme === 'dark' ? '#0f172a' : '#f8fafc' }}>
      <div
        className="h-12 flex items-center justify-between px-4"
        style={{
          borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <Skeleton height={24} width={150} theme={theme} />
        <div className="flex gap-2">
          <Skeleton height={28} width={28} borderRadius={6} theme={theme} />
          <Skeleton height={28} width={28} borderRadius={6} theme={theme} />
          <Skeleton height={28} width={28} borderRadius={6} theme={theme} />
        </div>
      </div>

      <div className="flex-1 flex">
        <div
          className="w-12 flex flex-col items-center py-2 gap-2"
          style={{
            borderRight: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={32} width={32} borderRadius={8} theme={theme} />
          ))}
        </div>

        <div className="flex-1 flex">
          <div className="w-[30%] border-r" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
            <PanelSkeleton theme={theme} />
          </div>
          <div className="w-[35%] border-r" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
            <PanelSkeleton theme={theme} />
          </div>
          <div className="flex-1">
            <PanelSkeleton theme={theme} />
          </div>
        </div>
      </div>
    </div>
  )
}
