/**
 * @file MultiDevicePreview.tsx
 * @description YYC³便携式智能AI系统 - 多设备并行预览面板
 * Multi-Device Parallel Preview Panel
 * Shows preview rendered simultaneously across multiple device viewports.
 * Supports scroll sync, device selection, and snapshot comparison.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,preview,multi-device,responsive
 */

import {
  Monitor, Tablet, Smartphone, X,
  Camera, ArrowUpDown
} from 'lucide-react'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

import { storageService } from '../services/storage-service'
import { useAppStore } from '../store'
import { compileToHtml, PREVIEW_DEVICES, type PreviewLanguage } from '../utils/preview-engine'
import { getThemeTokens } from '../utils/theme'


const DEVICE_ICONS: Record<string, React.ElementType> = {
  desktop: Monitor, laptop: Monitor,
  tablet: Tablet, 'tablet-landscape': Tablet,
  mobile: Smartphone, 'mobile-se': Smartphone, 'mobile-pro': Smartphone, android: Smartphone,
}

interface MultiDevicePreviewProps {
  code: string
  language: PreviewLanguage
  open: boolean
  onClose: () => void
}

export function MultiDevicePreview({ code, language, open, onClose }: MultiDevicePreviewProps) {
  const { theme } = useAppStore()
  const t = getThemeTokens(theme)

  const [selectedDevices, setSelectedDevices] = useState<string[]>(['desktop', 'tablet', 'mobile'])
  const [html, setHtml] = useState('')
  const [syncScroll, setSyncScroll] = useState(true)
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({})

  // Compile code on change
  useEffect(() => {
    if (!open) return
    const { html: compiled } = compileToHtml(code, language, t.isDark)
    setHtml(compiled)
  }, [code, language, t.isDark, open])

  const toggleDevice = (id: string) => {
    setSelectedDevices(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    )
  }

  const takeSnapshot = useCallback(async () => {
    try {
      await storageService.saveSnapshot({
        id: `snap-${Date.now()}`,
        name: `Multi-device ${new Date().toLocaleTimeString()}`,
        content: code,
        createdAt: Date.now(),
        createdBy: 'local-user',
        tags: selectedDevices,
        size: new Blob([code]).size,
        isAuto: false,
        metadata: {
          filePath: undefined,
          deviceConfig: { id: 'multi', name: 'Multi-Device', type: 'custom', width: 0, height: 0, dpr: 1 },
          performanceMetrics: undefined,
        },
      })
      toast.success('快照已保存')
    } catch {
      toast.error('快照保存失败')
    }
  }, [code, selectedDevices])

  if (!open) return null

  const activeDevices = PREVIEW_DEVICES.filter(d => selectedDevices.includes(d.id))

  return (
    <div className="fixed inset-0 z-[90] flex flex-col">
      <div className={`absolute inset-0 ${t.surface.modalBackdrop} backdrop-blur-md`} onClick={onClose} />
      <div className={`relative flex flex-col h-full max-h-[95vh] m-4 ${t.surface.modal} rounded-2xl overflow-hidden backdrop-blur-xl`}
        style={{ boxShadow: t.shadow.modal }}>

        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${t.border.subtle}`}>
          <div className="flex items-center gap-3">
            <Monitor className={`w-4 h-4 ${t.accent.primary}`} />
            <span className={`text-[13px] ${t.text.primary}`} style={{ fontWeight: 600 }}>多设备并行预览</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.isDark ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500'}`}>
              {activeDevices.length} 设备
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSyncScroll(!syncScroll)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] ${t.transition} ${syncScroll ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : t.interactive.iconBtn}`}>
              <ArrowUpDown className="w-3 h-3" />
              滚动同步 {syncScroll ? 'ON' : 'OFF'}
            </button>
            <button onClick={takeSnapshot}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] ${t.transition} ${t.interactive.iconBtn}`}>
              <Camera className="w-3 h-3" />
              快照
            </button>
            <button onClick={onClose} className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Device selector strip */}
        <div className={`flex items-center gap-1 px-4 py-2 border-b ${t.border.subtle} overflow-x-auto`}>
          {PREVIEW_DEVICES.map(d => {
            const Icon = DEVICE_ICONS[d.id] || Monitor
            const active = selectedDevices.includes(d.id)
            return (
              <button key={d.id} onClick={() => toggleDevice(d.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] whitespace-nowrap ${t.transition} ${
                  active ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : `${t.text.dimmed} ${t.interactive.iconBtn}`
                }`}>
                <Icon className="w-3 h-3" />
                {d.name}
                <span className={`${t.text.dimmed}`}>{d.width}x{d.height}</span>
              </button>
            )
          })}
        </div>

        {/* Preview viewports */}
        <div className="flex-1 overflow-auto p-4">
          <div className="flex gap-4 items-start justify-center flex-wrap">
            {activeDevices.map(device => {
              const scale = Math.min(1, 350 / device.width, 500 / device.height)
              return (
                <div key={device.id} className="flex flex-col items-center gap-2">
                  {/* Device label */}
                  <div className={`text-[10px] ${t.text.dimmed} flex items-center gap-1.5`}>
                    {React.createElement(DEVICE_ICONS[device.id] || Monitor, { className: 'w-3 h-3' })}
                    {device.name}
                    <span className={`px-1.5 py-0.5 rounded text-[8px] ${t.isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                      {device.width}×{device.height}
                    </span>
                  </div>
                  {/* Viewport frame */}
                  <div className={`rounded-xl overflow-hidden border-2 ${t.isDark ? 'border-white/10' : 'border-slate-200'}`}
                    style={{ width: device.width * scale, height: device.height * scale }}>
                    <iframe
                      ref={el => { iframeRefs.current[device.id] = el }}
                      srcDoc={html}
                      sandbox="allow-scripts"
                      className="w-full h-full bg-white"
                      style={{
                        width: device.width,
                        height: device.height,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        border: 'none',
                      }}
                      title={`Preview - ${device.name}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
