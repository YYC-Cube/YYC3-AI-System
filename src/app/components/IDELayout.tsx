/**
 * @file IDELayout.tsx
 * @description YYC³便携式智能AI系统 - 多面板IDE布局
 * Multi-panel IDE Layout (Wireframe-aligned)
 *
 * Layout structure per Guidelines §三栏式布局架构 + wireframe:
 * ┌──────────────────────────────────────────────────────────────┐
 * │  Header (full width)                                          │
 * ├────────────┬──────────────────────┬──────────────────────────┤
 * │ LeftToolbar│ MiddleToolbar        │ RightToolbar             │
 * │ 🤖🔧⚙️     │ ◀👁⌨️ | 🔍📁📄        │ 💻📝⚡🐙                  │
 * ├────────────┼──────────────────────┼──────────────────────────┤
 * │            │                      │                          │
 * │  AI对话    │  文件资源管理器       │  代码编辑器              │
 * │  面板      │  项目结构            │  语法高亮                │
 * │            │  文件列表            │  智能提示                │
 * │            │  搜索过滤            │  代码折叠                │
 * │            │                      │                          │
 * │────────────│──────────────────────┴──────────────────────────│
 * │ ✏️用户输入  │  集成终端 🖥️ 命令行📋 | ⚡命令执行/快速操作       │
 * └────────────┴─────────────────────────────────────────────────┘
 *
 * Column widths: Left 35% | Middle 30% | Right 35%
 *
 * Terminal behavior per Guidelines §智能终端切换功能:
 * - Code/Edit mode: terminal spans mid+right columns bottom
 * - Preview mode: terminal spans merged preview area bottom
 * - Terminal visibility persists across mode switches
 *
 * DnD: Panels can be swapped via draggable handle → drop zone overlay
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,layout,ide,panel
 */

import { GripVertical, Loader2 } from 'lucide-react';
import React, { useEffect, useCallback, Suspense, lazy } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { useAppStore } from '../store';
import { collabManager } from '../utils/collaboration';
import { getI18n, type Language } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

import { ChatInterface } from './ChatInterface';
import { CommandPalette } from './CommandPalette';
import { FileManager } from './FileManager';
import { Header } from './Header';
const CodeEditor = lazy(() => import('./CodeEditor').then((m) => ({ default: m.CodeEditor })));
import { IntegratedTerminal } from './IntegratedTerminal';
import { LayoutManager, PanelTypeSelector } from './LayoutManager';
import { PreviewPanel } from './PreviewPanel';
import { ShortcutsDialog } from './ShortcutsDialog';
import { LeftToolbar } from './toolbars/LeftToolbar';
import { MiddleToolbar } from './toolbars/MiddleToolbar';
import { RightToolbar } from './toolbars/RightToolbar';

/* ── Lazy-loaded feature panels (React.lazy code splitting) ── */
const ModelSettings = lazy(() =>
  import('./ModelSettings').then((m) => ({ default: m.ModelSettings }))
);
const ThemeCustomizer = lazy(() =>
  import('./ThemeCustomizer').then((m) => ({ default: m.ThemeCustomizer }))
);
const SearchPanel = lazy(() => import('./SearchPanel').then((m) => ({ default: m.SearchPanel })));
const NotificationCenter = lazy(() =>
  import('./NotificationCenter').then((m) => ({ default: m.NotificationCenter }))
);
const AiCodeIntel = lazy(() => import('./AiCodeIntel').then((m) => ({ default: m.AiCodeIntel })));
const GitPanel = lazy(() => import('./GitPanel').then((m) => ({ default: m.GitPanel })));
const ActivityTimeline = lazy(() =>
  import('./ActivityTimeline').then((m) => ({ default: m.ActivityTimeline }))
);
const PerformanceMonitor = lazy(() =>
  import('./PerformanceMonitor').then((m) => ({ default: m.PerformanceMonitor }))
);
const GitDiffViewer = lazy(() =>
  import('./GitDiffViewer').then((m) => ({ default: m.GitDiffViewer }))
);
const TemplateMarketplace = lazy(() =>
  import('./TemplateMarketplace').then((m) => ({ default: m.TemplateMarketplace }))
);
const VisualCanvas = lazy(() =>
  import('./VisualCanvas').then((m) => ({ default: m.VisualCanvas }))
);
const ConflictResolver = lazy(() =>
  import('./ConflictResolver').then((m) => ({ default: m.ConflictResolver }))
);
const CollabReplayTimeline = lazy(() =>
  import('./CollabReplayTimeline').then((m) => ({ default: m.CollabReplayTimeline }))
);
const RbacPanel = lazy(() => import('./RbacPanel').then((m) => ({ default: m.RbacPanel })));
const GitGraph = lazy(() => import('./GitGraph').then((m) => ({ default: m.GitGraph })));
const CicdPipeline = lazy(() =>
  import('./CicdPipeline').then((m) => ({ default: m.CicdPipeline }))
);
const FlameGraph = lazy(() => import('./FlameGraph').then((m) => ({ default: m.FlameGraph })));
const EnvVarsPanel = lazy(() =>
  import('./EnvVarsPanel').then((m) => ({ default: m.EnvVarsPanel }))
);
const CodeTranslator = lazy(() =>
  import('./CodeTranslator').then((m) => ({ default: m.CodeTranslator }))
);
const ErDiagram = lazy(() => import('./ErDiagram').then((m) => ({ default: m.ErDiagram })));
const ApiTester = lazy(() => import('./ApiTester').then((m) => ({ default: m.ApiTester })));
const DocGenerator = lazy(() =>
  import('./DocGenerator').then((m) => ({ default: m.DocGenerator }))
);
const WorkspaceManager = lazy(() =>
  import('./WorkspaceManager').then((m) => ({ default: m.WorkspaceManager }))
);
const DatabaseManager = lazy(() =>
  import('./DatabaseManager').then((m) => ({ default: m.DatabaseManager }))
);
const Whiteboard = lazy(() => import('./Whiteboard').then((m) => ({ default: m.Whiteboard })));
const DependencyGraph = lazy(() =>
  import('./DependencyGraph').then((m) => ({ default: m.DependencyGraph }))
);
const SnippetManager = lazy(() =>
  import('./SnippetManager').then((m) => ({ default: m.SnippetManager }))
);
const PluginSystem = lazy(() =>
  import('./PluginSystem').then((m) => ({ default: m.PluginSystem }))
);
const OfflineCache = lazy(() =>
  import('./OfflineCache').then((m) => ({ default: m.OfflineCache }))
);
const SystemDashboard = lazy(() =>
  import('./SystemDashboard').then((m) => ({ default: m.SystemDashboard }))
);
const ThemeManager = lazy(() =>
  import('./ThemeManager').then((m) => ({ default: m.ThemeManager }))
);
const MultiWindowManager = lazy(() =>
  import('./MultiWindowManager').then((m) => ({ default: m.MultiWindowManager }))
);
const RealtimeCollabEnhanced = lazy(() =>
  import('./RealtimeCollabEnhanced').then((m) => ({ default: m.RealtimeCollabEnhanced }))
);
const CodeSandbox = lazy(() => import('./CodeSandbox').then((m) => ({ default: m.CodeSandbox })));
const VisualQueryBuilder = lazy(() =>
  import('./VisualQueryBuilder').then((m) => ({ default: m.VisualQueryBuilder }))
);
const QuickActionsPanel = lazy(() =>
  import('./QuickActionsPanel').then((m) => ({ default: m.QuickActionsPanel }))
);
const TaskBoard = lazy(() => import('./TaskBoard').then((m) => ({ default: m.TaskBoard })));
const MultiInstancePanel = lazy(() =>
  import('./MultiInstancePanel').then((m) => ({ default: m.MultiInstancePanel }))
);

/* ── Resize handles ── */
const HResizeHandle = () => (
  <PanelResizeHandle className="w-1 hover:w-1.5 bg-transparent hover:bg-indigo-500/40 active:bg-indigo-500 transition-all cursor-col-resize flex items-center justify-center relative z-10">
    <div className="w-px h-8 bg-slate-500/20 rounded-full" />
  </PanelResizeHandle>
);

const VResizeHandle = () => (
  <PanelResizeHandle className="h-1 hover:h-1.5 bg-transparent hover:bg-indigo-500/40 active:bg-indigo-500 transition-all cursor-row-resize flex items-center justify-center relative z-10">
    <div className="h-px w-12 bg-slate-500/20 rounded-full" />
  </PanelResizeHandle>
);

/* ── DnD types ── */
const PANEL_DND_TYPE = 'PANEL_SWAP';
type PanelSlot = 'left' | 'middle' | 'right';

interface DragItem {
  type: typeof PANEL_DND_TYPE;
  slot: PanelSlot;
}

/* ── DraggableHandle — grip icon on each panel header ── */
function DragHandle({
  slot,
  isDark,
  language,
}: {
  slot: PanelSlot;
  isDark: boolean;
  language: string;
}) {
  const i18n = getI18n(language as Language);
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: PANEL_DND_TYPE,
      item: { type: PANEL_DND_TYPE, slot } as DragItem,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [slot]
  );

  return (
    <div
      ref={drag}
      className={`cursor-grab active:cursor-grabbing p-0.5 rounded transition-all ${
        isDragging
          ? 'opacity-50 scale-90'
          : isDark
            ? 'text-white/15 hover:text-white/40 hover:bg-white/5'
            : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
      }`}
      title={i18n.dragToSwap}
    >
      <GripVertical className="w-3.5 h-3.5" />
    </div>
  );
}

/* ── DropZone — overlay on each panel that accepts drops ── */
function DropZone({
  slot,
  onSwap,
  children,
  isDark,
}: {
  slot: PanelSlot;
  onSwap: (from: PanelSlot, to: PanelSlot) => void;
  children: React.ReactNode;
  isDark: boolean;
}) {
  const { language } = useAppStore();
  const ii = getI18n(language);
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: PANEL_DND_TYPE,
      drop: (item: DragItem) => {
        if (item.slot !== slot) onSwap(item.slot, slot);
      },
      canDrop: (item: DragItem) => item.slot !== slot,
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [slot, onSwap]
  );

  return (
    <div ref={drop} className="relative h-full">
      {children}
      {isOver && canDrop && (
        <div className="absolute inset-0 z-30 pointer-events-none rounded-xl border-2 border-dashed border-indigo-400/50 bg-indigo-500/[0.08] backdrop-blur-[1px] flex items-center justify-center">
          <div
            className={`px-4 py-2 rounded-xl ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'} text-[12px] shadow-lg`}
            style={{ fontWeight: 500 }}
          >
            {ii.releaseToSwap}
          </div>
        </div>
      )}
      {!isOver && canDrop && (
        <div className="absolute inset-0 z-30 pointer-events-none rounded-lg border border-dashed border-indigo-400/20" />
      )}
    </div>
  );
}

/* ── Panel content mapping ── */
type ContentType = 'chat' | 'files' | 'code' | 'preview' | 'terminal' | 'workspace' | 'database';

// CodeEditor懒加载包装组件
const CodeEditorWithLazy: React.FC = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center h-full bg-slate-900/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <div className="text-sm text-slate-400">正在加载编辑器...</div>
          <div className="text-xs text-slate-500">Monaco Editor懒加载中</div>
        </div>
      </div>
    }
  >
    <CodeEditor />
  </Suspense>
);

const CONTENT_COMPONENTS: Record<ContentType, React.FC> = {
  chat: ChatInterface,
  files: FileManager,
  code: CodeEditorWithLazy,
  preview: PreviewPanel,
  terminal: IntegratedTerminal,
  workspace: FileManager,
  database: FileManager,
};

const TOOLBAR_COMPONENTS: Record<ContentType, React.FC> = {
  chat: LeftToolbar,
  files: MiddleToolbar,
  code: RightToolbar,
  preview: MiddleToolbar,
  terminal: RightToolbar,
  workspace: MiddleToolbar,
  database: MiddleToolbar,
};

/* ══════════════════════════════════════════════════ */
/*  IDELayout — Main Component                       */
/* ═════════════════════════════════════════════════ */

export function IDELayout() {
  const {
    theme,
    viewMode,
    setViewMode,
    terminalVisible,
    designRoot,
    updatePanel,
    panelMap: storedPanelMap,
    swapPanels,
    setCollaborators,
    language,
    toggleLanguage,
    openThemeCustomizer,
    toggleTerminal,
    openModelSettings,
    setShortcutsDialogOpen,
    setSearchPanelOpen,
    templateMarketOpen,
    setTemplateMarketOpen,
    visualCanvasOpen,
    setVisualCanvasOpen,
    conflictResolverOpen,
    setConflictResolverOpen,
    collabReplayOpen,
    setCollabReplayOpen,
    rbacPanelOpen,
    setRbacPanelOpen,
    gitGraphOpen,
    setGitGraphOpen,
    cicdPipelineOpen,
    setCicdPipelineOpen,
    flameGraphOpen,
    setFlameGraphOpen,
    envVarsOpen,
    setEnvVarsOpen,
    codeTranslatorOpen,
    setCodeTranslatorOpen,
    erDiagramOpen,
    setErDiagramOpen,
    apiTesterOpen,
    setApiTesterOpen,
    docGeneratorOpen,
    setDocGeneratorOpen,
    workspaceManagerOpen,
    setWorkspaceManagerOpen,
    databaseManagerOpen,
    setDatabaseManagerOpen,
    layoutManagerOpen,
    setLayoutManagerOpen,
    whiteboardOpen,
    setWhiteboardOpen,
    dependencyGraphOpen,
    setDependencyGraphOpen,
    snippetManagerOpen,
    setSnippetManagerOpen,
    pluginSystemOpen,
    setPluginSystemOpen,
    offlineCacheOpen,
    setOfflineCacheOpen,
    systemDashboardOpen,
    setSystemDashboardOpen,
    themeManagerOpen,
    setThemeManagerOpen,
    multiWindowOpen,
    setMultiWindowOpen,
    realtimeCollabEnhancedOpen,
    setRealtimeCollabEnhancedOpen,
    codeSandboxOpen,
    setCodeSandboxOpen,
    visualQueryBuilderOpen,
    setVisualQueryBuilderOpen,
    setPanelMap,
  } = useAppStore();

  // Category A: self-managed panels need their open state for conditional lazy rendering
  const modelSettingsOpen = useAppStore((s) => s.modelSettingsOpen);
  const themeCustomizerOpen = useAppStore((s) => s.themeCustomizerOpen);
  const searchPanelOpen = useAppStore((s) => s.searchPanelOpen);
  const notificationCenterOpen = useAppStore((s) => s.notificationCenterOpen);
  const aiCodeIntelOpen = useAppStore((s) => s.aiCodeIntelOpen);
  const gitPanelOpen = useAppStore((s) => s.gitPanelOpen);
  const activityTimelineOpen = useAppStore((s) => s.activityTimelineOpen);
  const performanceMonitorOpen = useAppStore((s) => s.performanceMonitorOpen);
  const gitDiffFile = useAppStore((s) => s.gitDiffFile);
  const quickActionsPanelOpen = useAppStore((s) => s.quickActionsPanelOpen);
  const setQuickActionsPanelOpen = useAppStore((s) => s.setQuickActionsPanelOpen);
  const taskBoardOpen = useAppStore((s) => s.taskBoardOpen);
  const setTaskBoardOpen = useAppStore((s) => s.setTaskBoardOpen);
  const multiInstancePanelOpen = useAppStore((s) => s.multiInstancePanelOpen);
  const setMultiInstancePanelOpen = useAppStore((s) => s.setMultiInstancePanelOpen);

  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const panelMap = storedPanelMap as Record<PanelSlot, ContentType>;

  // ── Initialize yjs collaboration engine ──
  useEffect(() => {
    const FILE_CONTENTS_FOR_COLLAB: Record<string, string> = {
      'ChatInterface.tsx': '// ChatInterface.tsx\nimport React from "react"\n// ...',
      'App.tsx': '// App.tsx\nimport React from "react"\n// ...',
      'store.ts': '// store.ts\nimport { create } from "zustand"\n// ...',
      'types.ts': '// types.ts\nexport interface DesignRoot { ... }',
      'routes.ts': '// routes.ts\nimport { createBrowserRouter } from "react-router"',
    };

    collabManager.init(
      { id: 'local-user', name: 'You', color: '#818cf8', cursor: null, online: true },
      FILE_CONTENTS_FOR_COLLAB
    );

    const syncInterval = window.setInterval(() => {
      const users = collabManager.getUsers();
      const collabs = users
        .filter((u) => u.id !== 'local-user')
        .map((u) => ({
          id: u.id,
          name: u.name,
          color: u.color,
          cursor: u.cursor ? { file: u.cursor.file, line: u.cursor.line } : null,
          online: u.online,
        }));
      setCollaborators(collabs);
    }, 2000);

    const handler = () => {
      const users = collabManager.getUsers();
      const collabs = users
        .filter((u) => u.id !== 'local-user')
        .map((u) => ({
          id: u.id,
          name: u.name,
          color: u.color,
          cursor: u.cursor ? { file: u.cursor.file, line: u.cursor.line } : null,
          online: u.online,
        }));
      setCollaborators(collabs);
    };
    collabManager.awareness.on('change', handler);

    return () => {
      window.clearInterval(syncInterval);
      collabManager.awareness.off('change', handler);
    };
  }, [setCollaborators]);

  const handlePanelSwap = useCallback(
    (from: PanelSlot, to: PanelSlot) => {
      swapPanels(from, to);
    },
    [swapPanels]
  );

  // ── Global keyboard shortcuts (Guidelines §快捷键) ──
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      if (e.key === 'Escape') {
        setViewMode('code');
        return;
      }

      if (ctrl && !shift) {
        if (e.key === '1') {
          e.preventDefault();
          setViewMode('preview');
        } else if (e.key === '2') {
          e.preventDefault();
          setViewMode('code');
        } else if (e.key === ',') {
          e.preventDefault();
          openThemeCustomizer();
        }
      }

      if (ctrl && shift) {
        switch (e.key.toLowerCase()) {
          case 'f':
            e.preventDefault();
            setSearchPanelOpen(true);
            break;
          case 'l':
            e.preventDefault();
            toggleLanguage();
            break;
          case 'p':
            e.preventDefault();
            useAppStore.getState().setProjectsPanelOpen(true);
            break;
          case 'n':
            e.preventDefault();
            useAppStore.getState().setNotificationCenterOpen(true);
            break;
          case 'g':
            e.preventDefault();
            useAppStore.getState().setGithubPanelOpen(true);
            break;
          case 's':
            e.preventDefault();
            useAppStore.getState().setSharePanelOpen(true);
            break;
          case 'd':
            e.preventDefault();
            useAppStore.getState().setDeployPanelOpen(true);
            break;
          case 'q':
            e.preventDefault();
            useAppStore.getState().setQuickActionsPanelOpen(true);
            break;
          case 'b':
            e.preventDefault();
            useAppStore.getState().setTaskBoardOpen(true);
            break;
          case 'i':
            e.preventDefault();
            useAppStore.getState().setMultiInstancePanelOpen(true);
            break;
          case 'm':
            e.preventDefault();
            break;
          case 'a':
            e.preventDefault();
            openModelSettings();
            break;
          case 't':
            e.preventDefault();
            toggleTerminal();
            break;
        }
      }

      // Ctrl+Alt shortcuts for new feature panels
      if (ctrl && e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'r':
            e.preventDefault();
            setRealtimeCollabEnhancedOpen(true);
            break;
          case 's':
            e.preventDefault();
            setCodeSandboxOpen(true);
            break;
          case 'q':
            e.preventDefault();
            setVisualQueryBuilderOpen(true);
            break;
        }
      }
    },
    [
      setViewMode,
      openThemeCustomizer,
      toggleLanguage,
      openModelSettings,
      toggleTerminal,
      setShortcutsDialogOpen,
      setSearchPanelOpen,
      setRealtimeCollabEnhancedOpen,
      setCodeSandboxOpen,
      setVisualQueryBuilderOpen,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Start task reminder service ──
  useEffect(() => {
    let svc: { start: () => void; stop: () => void } | null = null;
    import('../services/task-reminder').then((mod) => {
      svc = mod.reminderService;
      svc.start();
    });
    return () => {
      svc?.stop();
    };
  }, []);

  // ── Render panel content by slot ──
  const renderPanel = (slot: PanelSlot) => {
    const contentType = panelMap[slot] as ContentType;
    const Content = CONTENT_COMPONENTS[contentType] || CONTENT_COMPONENTS.code;
    const Toolbar = TOOLBAR_COMPONENTS[contentType] || TOOLBAR_COMPONENTS.code;
    return (
      <DropZone slot={slot} onSwap={handlePanelSwap} isDark={t.isDark}>
        <div className="flex flex-col h-full">
          <div className="flex items-center">
            <DragHandle slot={slot} isDark={t.isDark} language={language} />
            <PanelTypeSelector
              current={contentType}
              onChange={(type) => {
                const next = { ...storedPanelMap, [slot]: type };
                setPanelMap(next as { left: string; middle: string; right: string });
              }}
              t={t}
              i={i}
            />
            <div className="flex-1 min-w-0">
              <Toolbar />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <Content />
          </div>
        </div>
      </DropZone>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className={`h-screen w-screen flex flex-col font-sans overflow-hidden ${t.transition} ${t.surface.app} ${t.surface.appGradient}`}
      >
        {/* ═══ Layer 1: Header (full width) ═══ */}
        <Header />

        {/* ── Always-mounted lightweight modals (register global keyboard listeners) ── */}
        <ShortcutsDialog />
        <CommandPalette />

        {/* ── Lazy-loaded modals: conditional mount triggers dynamic import only when opened ── */}
        {modelSettingsOpen && (
          <Suspense fallback={null}>
            <ModelSettings />
          </Suspense>
        )}
        {themeCustomizerOpen && (
          <Suspense fallback={null}>
            <ThemeCustomizer />
          </Suspense>
        )}
        {searchPanelOpen && (
          <Suspense fallback={null}>
            <SearchPanel />
          </Suspense>
        )}
        {notificationCenterOpen && (
          <Suspense fallback={null}>
            <NotificationCenter />
          </Suspense>
        )}
        {aiCodeIntelOpen && (
          <Suspense fallback={null}>
            <AiCodeIntel />
          </Suspense>
        )}
        {gitPanelOpen && (
          <Suspense fallback={null}>
            <GitPanel />
          </Suspense>
        )}
        {activityTimelineOpen && (
          <Suspense fallback={null}>
            <ActivityTimeline />
          </Suspense>
        )}
        {performanceMonitorOpen && (
          <Suspense fallback={null}>
            <PerformanceMonitor />
          </Suspense>
        )}
        {gitDiffFile && (
          <Suspense fallback={null}>
            <GitDiffViewer />
          </Suspense>
        )}
        {templateMarketOpen && (
          <Suspense fallback={null}>
            <TemplateMarketplace
              open={templateMarketOpen}
              onClose={() => setTemplateMarketOpen(false)}
            />
          </Suspense>
        )}
        {visualCanvasOpen && (
          <Suspense fallback={null}>
            <VisualCanvas open={visualCanvasOpen} onClose={() => setVisualCanvasOpen(false)} />
          </Suspense>
        )}
        {conflictResolverOpen && (
          <Suspense fallback={null}>
            <ConflictResolver
              open={conflictResolverOpen}
              onClose={() => setConflictResolverOpen(false)}
            />
          </Suspense>
        )}
        {collabReplayOpen && (
          <Suspense fallback={null}>
            <CollabReplayTimeline
              open={collabReplayOpen}
              onClose={() => setCollabReplayOpen(false)}
            />
          </Suspense>
        )}
        {rbacPanelOpen && (
          <Suspense fallback={null}>
            <RbacPanel open={rbacPanelOpen} onClose={() => setRbacPanelOpen(false)} />
          </Suspense>
        )}
        {gitGraphOpen && (
          <Suspense fallback={null}>
            <GitGraph open={gitGraphOpen} onClose={() => setGitGraphOpen(false)} />
          </Suspense>
        )}
        {cicdPipelineOpen && (
          <Suspense fallback={null}>
            <CicdPipeline open={cicdPipelineOpen} onClose={() => setCicdPipelineOpen(false)} />
          </Suspense>
        )}
        {flameGraphOpen && (
          <Suspense fallback={null}>
            <FlameGraph open={flameGraphOpen} onClose={() => setFlameGraphOpen(false)} />
          </Suspense>
        )}
        {envVarsOpen && (
          <Suspense fallback={null}>
            <EnvVarsPanel open={envVarsOpen} onClose={() => setEnvVarsOpen(false)} />
          </Suspense>
        )}
        {codeTranslatorOpen && (
          <Suspense fallback={null}>
            <CodeTranslator
              open={codeTranslatorOpen}
              onClose={() => setCodeTranslatorOpen(false)}
            />
          </Suspense>
        )}
        {erDiagramOpen && (
          <Suspense fallback={null}>
            <ErDiagram open={erDiagramOpen} onClose={() => setErDiagramOpen(false)} />
          </Suspense>
        )}
        {apiTesterOpen && (
          <Suspense fallback={null}>
            <ApiTester open={apiTesterOpen} onClose={() => setApiTesterOpen(false)} />
          </Suspense>
        )}
        {docGeneratorOpen && (
          <Suspense fallback={null}>
            <DocGenerator open={docGeneratorOpen} onClose={() => setDocGeneratorOpen(false)} />
          </Suspense>
        )}
        {workspaceManagerOpen && (
          <Suspense fallback={null}>
            <WorkspaceManager
              open={workspaceManagerOpen}
              onClose={() => setWorkspaceManagerOpen(false)}
            />
          </Suspense>
        )}
        {databaseManagerOpen && (
          <Suspense fallback={null}>
            <DatabaseManager
              open={databaseManagerOpen}
              onClose={() => setDatabaseManagerOpen(false)}
            />
          </Suspense>
        )}
        {layoutManagerOpen && (
          <Suspense fallback={null}>
            <LayoutManager open={layoutManagerOpen} onClose={() => setLayoutManagerOpen(false)} />
          </Suspense>
        )}
        {whiteboardOpen && (
          <Suspense fallback={null}>
            <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
          </Suspense>
        )}
        {dependencyGraphOpen && (
          <Suspense fallback={null}>
            <DependencyGraph
              open={dependencyGraphOpen}
              onClose={() => setDependencyGraphOpen(false)}
            />
          </Suspense>
        )}
        {snippetManagerOpen && (
          <Suspense fallback={null}>
            <SnippetManager
              open={snippetManagerOpen}
              onClose={() => setSnippetManagerOpen(false)}
            />
          </Suspense>
        )}
        {pluginSystemOpen && (
          <Suspense fallback={null}>
            <PluginSystem open={pluginSystemOpen} onClose={() => setPluginSystemOpen(false)} />
          </Suspense>
        )}
        {offlineCacheOpen && (
          <Suspense fallback={null}>
            <OfflineCache open={offlineCacheOpen} onClose={() => setOfflineCacheOpen(false)} />
          </Suspense>
        )}
        {systemDashboardOpen && (
          <Suspense fallback={null}>
            <SystemDashboard
              open={systemDashboardOpen}
              onClose={() => setSystemDashboardOpen(false)}
            />
          </Suspense>
        )}
        {themeManagerOpen && (
          <Suspense fallback={null}>
            <ThemeManager open={themeManagerOpen} onClose={() => setThemeManagerOpen(false)} />
          </Suspense>
        )}
        {multiWindowOpen && (
          <Suspense fallback={null}>
            <MultiWindowManager open={multiWindowOpen} onClose={() => setMultiWindowOpen(false)} />
          </Suspense>
        )}
        {realtimeCollabEnhancedOpen && (
          <Suspense fallback={null}>
            <RealtimeCollabEnhanced
              open={realtimeCollabEnhancedOpen}
              onClose={() => setRealtimeCollabEnhancedOpen(false)}
            />
          </Suspense>
        )}
        {codeSandboxOpen && (
          <Suspense fallback={null}>
            <CodeSandbox open={codeSandboxOpen} onClose={() => setCodeSandboxOpen(false)} />
          </Suspense>
        )}
        {visualQueryBuilderOpen && (
          <Suspense fallback={null}>
            <VisualQueryBuilder
              open={visualQueryBuilderOpen}
              onClose={() => setVisualQueryBuilderOpen(false)}
            />
          </Suspense>
        )}
        {quickActionsPanelOpen && (
          <Suspense fallback={null}>
            <QuickActionsPanel
              open={quickActionsPanelOpen}
              onClose={() => setQuickActionsPanelOpen(false)}
            />
          </Suspense>
        )}
        {taskBoardOpen && (
          <Suspense fallback={null}>
            <TaskBoard open={taskBoardOpen} onClose={() => setTaskBoardOpen(false)} />
          </Suspense>
        )}
        {multiInstancePanelOpen && (
          <Suspense fallback={null}>
            <MultiInstancePanel
              open={multiInstancePanelOpen}
              onClose={() => setMultiInstancePanelOpen(false)}
            />
          </Suspense>
        )}

        {/* ═══ Layer 2: Three-column layout with per-column toolbars ═══ */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'fullscreen' ? (
            /* ── Fullscreen Preview ── */
            <div className="h-full w-full">
              <PreviewPanel fullscreen />
            </div>
          ) : (
            <PanelGroup direction="horizontal" className="h-full w-full">
              {/* ═══ Left Column (35%) — AI Chat + User Input ═══ */}
              <Panel
                defaultSize={35}
                minSize={20}
                maxSize={50}
                onResize={(size) =>
                  updatePanel('left-panel', { layout: { ...designRoot.panels[0].layout, w: size } })
                }
              >
                {renderPanel('left')}
              </Panel>

              <HResizeHandle />

              {/* ═══ Middle + Right Area (65%) ═══ */}
              {viewMode === 'preview' ? (
                /* ── Preview Mode: Mid+Right merged into preview ── */
                <Panel defaultSize={65} minSize={35}>
                  <PanelGroup direction="vertical" className="h-full">
                    {/* Merged preview area */}
                    <Panel defaultSize={terminalVisible ? 70 : 100} minSize={30}>
                      <div className="flex flex-col h-full">
                        <div className="flex flex-shrink-0">
                          <div className="flex-1">
                            <MiddleToolbar />
                          </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <PreviewPanel />
                        </div>
                      </div>
                    </Panel>

                    {/* Terminal spans merged mid+right in preview mode */}
                    {terminalVisible && (
                      <>
                        <VResizeHandle />
                        <Panel defaultSize={30} minSize={10} maxSize={60}>
                          <IntegratedTerminal />
                        </Panel>
                      </>
                    )}
                  </PanelGroup>
                </Panel>
              ) : (
                /* ── Code/Edit Mode: Mid + Right side-by-side, terminal at bottom spanning both ── */
                <Panel defaultSize={65} minSize={35}>
                  <PanelGroup direction="vertical" className="h-full">
                    {/* Top section: Middle (~46%) + Right (~54%) side-by-side → 30%/35% overall */}
                    <Panel defaultSize={terminalVisible ? 70 : 100} minSize={30}>
                      <PanelGroup direction="horizontal" className="h-full">
                        {/* Middle Column — 文件资源管理器 (30% of total) */}
                        <Panel
                          defaultSize={46}
                          minSize={25}
                          maxSize={70}
                          onResize={(size) =>
                            updatePanel('mid-panel', {
                              layout: { ...designRoot.panels[1].layout, w: size },
                            })
                          }
                        >
                          {renderPanel('middle')}
                        </Panel>

                        <HResizeHandle />

                        {/* Right Column — 代码编辑器 (35% of total) */}
                        <Panel
                          defaultSize={54}
                          minSize={25}
                          maxSize={75}
                          onResize={(size) =>
                            updatePanel('right-panel', {
                              layout: { ...designRoot.panels[2].layout, w: size },
                            })
                          }
                        >
                          {renderPanel('right')}
                        </Panel>
                      </PanelGroup>
                    </Panel>

                    {/* ── Terminal — spans mid+right at bottom (per wireframe) ── */}
                    {terminalVisible && (
                      <>
                        <VResizeHandle />
                        <Panel defaultSize={30} minSize={10} maxSize={60}>
                          <IntegratedTerminal />
                        </Panel>
                      </>
                    )}
                  </PanelGroup>
                </Panel>
              )}
            </PanelGroup>
          )}
        </div>
      </div>
    </DndProvider>
  );
}
