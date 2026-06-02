/**
 * @file BreadcrumbNav.tsx
 * @description YYC³便携式智能AI系统 - 文件路径面包屑导航
 * File Path Breadcrumb Navigation
 * Interactive breadcrumb showing current file path with clickable segments.
 * Segments can open file tree navigation at that directory level.
 * Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,breadcrumb,navigation,ui
 */

import { ChevronRight, Folder, FileCode, Home, Copy, Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

/* ── Path mapping for known files ── */
const FILE_PATHS: Record<string, string> = {
  'ChatInterface.tsx': 'src/app/components',
  'App.tsx': 'src/app',
  'store.ts': 'src/app',
  'types.ts': 'src/app',
  'routes.ts': 'src/app',
  'IDELayout.tsx': 'src/app/components',
  'Header.tsx': 'src/app/components',
  'FileManager.tsx': 'src/app/components',
  'CodeEditor.tsx': 'src/app/components',
  'PreviewPanel.tsx': 'src/app/components',
  'IntegratedTerminal.tsx': 'src/app/components',
  'ModelSettings.tsx': 'src/app/components',
  'ThemeCustomizer.tsx': 'src/app/components',
  'ShortcutsDialog.tsx': 'src/app/components',
  'CommandPalette.tsx': 'src/app/components',
  'SearchPanel.tsx': 'src/app/components',
  'NotificationCenter.tsx': 'src/app/components',
  'AiCodeIntel.tsx': 'src/app/components',
  'GitPanel.tsx': 'src/app/components',
  'ActivityTimeline.tsx': 'src/app/components',
  'PerformanceMonitor.tsx': 'src/app/components',
  'FileTabs.tsx': 'src/app/components',
  'BreadcrumbNav.tsx': 'src/app/components',
  'SystemReport.tsx': 'src/app/components',
  'HomePage.tsx': 'src/app/components',
  'LeftToolbar.tsx': 'src/app/components/toolbars',
  'MiddleToolbar.tsx': 'src/app/components/toolbars',
  'RightToolbar.tsx': 'src/app/components/toolbars',
  'theme.ts': 'src/app/utils',
  'i18n.ts': 'src/app/utils',
  'i18n-data.ts': 'src/app/utils',
  'collaboration.ts': 'src/app/utils',
};

/* ══════════════════════════════════════════════════ */
/*  BreadcrumbNav — Main Component                   */
/* ══════════════════════════════════════════════════ */

export function BreadcrumbNav() {
  const { theme, language, selectedFile } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);
  const [copied, setCopied] = useState(false);

  const currentFile = selectedFile || 'ChatInterface.tsx';
  const basePath = FILE_PATHS[currentFile] || 'src/app/components';

  const segments = useMemo(() => {
    const parts = basePath.split('/');
    return parts.map((part, idx) => ({
      name: part,
      fullPath: parts.slice(0, idx + 1).join('/'),
      isLast: false,
    }));
  }, [basePath]);

  const allSegments = useMemo(
    () => [
      ...segments,
      { name: currentFile, fullPath: `${basePath}/${currentFile}`, isLast: true },
    ],
    [segments, currentFile, basePath]
  );

  const copyPath = () => {
    const fullPath = `${basePath}/${currentFile}`;
    navigator.clipboard.writeText(fullPath);
    setCopied(true);
    toast.success(`${i.codeCopied}: ${fullPath}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-0 min-w-0 overflow-hidden">
      {/* Root icon */}
      <button
        className={`flex-shrink-0 p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
        title={i.bcRoot}
      >
        <Home className="w-3 h-3" />
      </button>

      {allSegments.map((seg, _idx) => (
        <div key={seg.fullPath} className="flex items-center min-w-0">
          <ChevronRight className={`w-2.5 h-2.5 flex-shrink-0 mx-0.5 ${t.text.dimmed}`} />
          {seg.isLast ? (
            <div className="flex items-center gap-1 min-w-0">
              <FileCode className={`w-3 h-3 flex-shrink-0 ${t.accent.primary}`} />
              <span
                className={`text-[10px] truncate ${t.text.primary}`}
                style={{ fontWeight: 500 }}
                title={seg.fullPath}
              >
                {seg.name}
              </span>
            </div>
          ) : (
            <button
              className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] min-w-0 truncate ${t.transition} ${t.text.muted} ${t.interactive.hoverBg}`}
              style={{ fontWeight: 400 }}
              title={seg.fullPath}
            >
              <Folder className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{seg.name}</span>
            </button>
          )}
        </div>
      ))}

      {/* Copy path button */}
      <button
        onClick={copyPath}
        className={`flex-shrink-0 ml-1.5 p-0.5 rounded opacity-0 hover:opacity-100 focus:opacity-100 ${t.transition} ${t.interactive.iconBtn}`}
        title={i.copyPath}
      >
        {copied ? (
          <Check className={`w-2.5 h-2.5 ${t.status.success}`} />
        ) : (
          <Copy className="w-2.5 h-2.5" />
        )}
      </button>
    </div>
  );
}
