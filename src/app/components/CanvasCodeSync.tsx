/**
 * @file CanvasCodeSync.tsx
 * @description YYC³便携式智能AI系统 - 画布与代码双向同步面板
 * Canvas ↔ Code Bidirectional Sync Panel
 * Shows live-generated JSX from canvas elements and allows editing code
 * that syncs back to canvas. Auto-sync or manual sync modes.
 * Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,sync,canvas,code-generation
 */

import {
  RefreshCw,
  Check,
  AlertTriangle,
  Code,
  ArrowRightLeft,
  ToggleLeft,
  ToggleRight,
  Copy,
  ChevronDown,
  ChevronRight,
  Play,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

/* ── Canvas element type (shared with VisualCanvas) ── */
export interface SyncCanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  props: {
    bgColor: string;
    borderRadius: number;
    padding: number;
    fontSize: number;
    textAlign: string;
  };
}

/* ── Code generation from canvas ── */
function generateJSX(elements: SyncCanvasElement[]): string {
  if (elements.length === 0) return '// Empty canvas — drag components to start\n';

  const lines: string[] = [
    'import React from "react"',
    '',
    'export function CanvasLayout() {',
    '  return (',
    '    <div className="relative w-full h-full">',
  ];

  elements.forEach((el, _idx) => {
    const style = [
      `position: 'absolute'`,
      `left: ${el.x}`,
      `top: ${el.y}`,
      `width: ${el.w}`,
      `height: ${el.h}`,
      `backgroundColor: '${el.props.bgColor}'`,
      `borderRadius: ${el.props.borderRadius}`,
      `padding: ${el.props.padding}`,
      `fontSize: ${el.props.fontSize}`,
      `textAlign: '${el.props.textAlign}'`,
    ].join(', ');

    switch (el.type) {
      case 'button':
        lines.push(`      <button style={{ ${style} }}>${el.label}</button>`);
        break;
      case 'input':
        lines.push(`      <input style={{ ${style} }} placeholder="${el.label}" />`);
        break;
      case 'text':
        lines.push(`      <span style={{ ${style} }}>${el.label}</span>`);
        break;
      case 'image':
        lines.push(`      <img style={{ ${style} }} alt="${el.label}" />`);
        break;
      case 'divider':
        lines.push(`      <hr style={{ ${style} }} />`);
        break;
      default:
        lines.push(`      <div style={{ ${style} }}>{/* ${el.type}: ${el.label} */}</div>`);
    }
  });

  lines.push('    </div>');
  lines.push('  )');
  lines.push('}');

  return lines.join('\n');
}

/* ── Parse JSX back to elements (simplified regex parser) ── */
function parseJSXToElements(code: string): { elements: SyncCanvasElement[]; error: string | null } {
  const elements: SyncCanvasElement[] = [];
  const tagRegex = /<(button|input|span|img|hr|div)\s+style=\{\{([^}]+)\}\}[^>]*>([^<]*)<\/\1?>/g;
  let match;
  let id = 0;

  try {
    while ((match = tagRegex.exec(code)) !== null) {
      const [, tag, styleStr, content] = match;
      const props: Record<string, string | number> = {};

      // Parse style props
      const propRegex = /(\w+):\s*(?:'([^']*)'|(\d+))/g;
      let pm;
      while ((pm = propRegex.exec(styleStr)) !== null) {
        const [, key, strVal, numVal] = pm;
        props[key] = numVal ? Number(numVal) : strVal || '';
      }

      const typeMap: Record<string, string> = {
        button: 'button',
        input: 'input',
        span: 'text',
        img: 'image',
        hr: 'divider',
        div: 'container',
      };

      elements.push({
        id: `parsed-${id++}`,
        type: typeMap[tag] || 'container',
        x: Number(props.left) || 0,
        y: Number(props.top) || 0,
        w: Number(props.width) || 120,
        h: Number(props.height) || 40,
        label: content?.trim() || tag,
        props: {
          bgColor: String(props.backgroundColor || 'transparent'),
          borderRadius: Number(props.borderRadius) || 0,
          padding: Number(props.padding) || 0,
          fontSize: Number(props.fontSize) || 14,
          textAlign: String(props.textAlign || 'center'),
        },
      });
    }
    return { elements, error: null };
  } catch (e) {
    return { elements: [], error: String(e) };
  }
}

/* ══════════════════════════════════════════ */
/*  CanvasCodeSync Component                  */
/* ══════════════════════════════════════════ */

interface CanvasCodeSyncProps {
  elements: SyncCanvasElement[];
  onElementsUpdate: (elements: SyncCanvasElement[]) => void;
}

export function CanvasCodeSync({ elements, onElementsUpdate }: CanvasCodeSyncProps) {
  const { theme, language } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const [autoSync, setAutoSync] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [editableCode, setEditableCode] = useState('');
  const [codeExpanded, setCodeExpanded] = useState(true);
  const [direction, setDirection] = useState<'canvas-to-code' | 'code-to-canvas'>('canvas-to-code');
  const codeRef = useRef<HTMLTextAreaElement>(null);

  // Generate code from canvas elements
  const generatedCode = useMemo(() => generateJSX(elements), [elements]);

  // Auto-sync: update code when canvas changes
  useEffect(() => {
    if (autoSync && direction === 'canvas-to-code') {
      setEditableCode(generatedCode);
      setSyncStatus('synced');
      setLastSyncTime(Date.now());
    }
  }, [generatedCode, autoSync, direction]);

  // Manual sync: canvas → code
  const syncCanvasToCode = useCallback(() => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setEditableCode(generatedCode);
      setSyncStatus('synced');
      setLastSyncTime(Date.now());
      toast.success(i.bsCanvasToCode);
    }, 300);
  }, [generatedCode, i]);

  // Manual sync: code → canvas
  const syncCodeToCanvas = useCallback(() => {
    setSyncStatus('syncing');
    setTimeout(() => {
      const { elements: parsed, error } = parseJSXToElements(editableCode);
      if (error) {
        setSyncStatus('error');
        toast.error(i.bsParseError);
      } else {
        onElementsUpdate(parsed);
        setSyncStatus('synced');
        setLastSyncTime(Date.now());
        toast.success(i.bsCodeToCanvas);
      }
    }, 400);
  }, [editableCode, onElementsUpdate, i]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(editableCode || generatedCode);
    toast.success(i.codeCopied);
  }, [editableCode, generatedCode, i]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const statusIcon =
    syncStatus === 'synced' ? (
      <Check className="w-2.5 h-2.5 text-emerald-400" />
    ) : syncStatus === 'syncing' ? (
      <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-400" />
    ) : (
      <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
    );

  const statusLabel =
    syncStatus === 'synced' ? i.bsSynced : syncStatus === 'syncing' ? i.bsSyncing : i.bsOutOfSync;

  return (
    <div className={`flex flex-col h-full overflow-hidden border-t ${t.border.subtle}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-1.5 border-b ${t.border.subtle}`}>
        <div className="flex items-center gap-2">
          <ArrowRightLeft className={`w-3 h-3 ${t.isDark ? 'text-cyan-400' : 'text-cyan-500'}`} />
          <span className={`text-[9px] ${t.text.secondary}`} style={{ fontWeight: 600 }}>
            {i.bsTitle}
          </span>
          <span
            className={`flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full ${
              syncStatus === 'synced'
                ? t.isDark
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-emerald-50 text-emerald-600'
                : syncStatus === 'error'
                  ? t.isDark
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-red-50 text-red-600'
                  : t.isDark
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-amber-50 text-amber-600'
            }`}
          >
            {statusIcon} {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Auto/Manual toggle */}
          <button
            onClick={() => setAutoSync(!autoSync)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] ${t.transition} ${autoSync ? t.accent.activeText : ''} ${t.interactive.iconBtn}`}
            title={autoSync ? i.bsAutoSync : i.bsManualSync}
          >
            {autoSync ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
            <span>{autoSync ? i.bsAutoSync : i.bsManualSync}</span>
          </button>
          {/* Sync direction */}
          <button
            onClick={() =>
              setDirection((d) => (d === 'canvas-to-code' ? 'code-to-canvas' : 'canvas-to-code'))
            }
            className={`px-1.5 py-0.5 rounded text-[7px] ${t.transition} ${t.interactive.iconBtn}`}
          >
            {direction === 'canvas-to-code' ? i.bsCanvasToCode : i.bsCodeToCanvas}
          </button>
          {/* Manual sync button */}
          {!autoSync && (
            <button
              onClick={direction === 'canvas-to-code' ? syncCanvasToCode : syncCodeToCanvas}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] ${t.transition} ${t.accent.solidBtn}`}
              style={{ fontWeight: 600 }}
            >
              <Play className="w-2.5 h-2.5" /> {i.bsSyncNow}
            </button>
          )}
          <button
            onClick={handleCopyCode}
            className={`p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className={`flex items-center justify-between px-3 py-1 text-[7px] ${t.text.dimmed}`}>
        <span>
          {i.bsElementCount}: {elements.length}
        </span>
        <span>
          {i.bsLastSync}: {formatTime(lastSyncTime)}
        </span>
      </div>

      {/* Code panel */}
      <button
        onClick={() => setCodeExpanded(!codeExpanded)}
        className={`flex items-center gap-1 px-3 py-1 text-[8px] ${t.text.muted} ${t.interactive.menuItem}`}
      >
        {codeExpanded ? (
          <ChevronDown className="w-2.5 h-2.5" />
        ) : (
          <ChevronRight className="w-2.5 h-2.5" />
        )}
        <Code className="w-2.5 h-2.5" />
        <span style={{ fontWeight: 500 }}>{i.bsCodePreview}</span>
      </button>

      {codeExpanded && (
        <div className={`flex-1 overflow-hidden p-2`}>
          <textarea
            ref={codeRef}
            value={editableCode || generatedCode}
            onChange={(e) => {
              setEditableCode(e.target.value);
              if (!autoSync) setSyncStatus('error'); // Mark out of sync
            }}
            className={`w-full h-full font-mono text-[9px] p-2 rounded-lg outline-none resize-none ${
              t.isDark ? 'bg-[#0a0f1f] text-emerald-300/80' : 'bg-slate-50 text-slate-700'
            } border ${t.border.subtle}`}
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}
