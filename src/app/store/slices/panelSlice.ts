/**
 * @file panelSlice.ts
 * @description YYC³ - 面板开关切片 (~35 面板)
 * 从 store.ts 提取，按 Zustand Slice 模式组织
 */

import type { StateCreator } from 'zustand';

export interface PanelSliceState {
  // ── Dialog ──
  shortcutsDialogOpen: boolean;
  setShortcutsDialogOpen: (open: boolean) => void;
  // ── Panels ──
  projectsPanelOpen: boolean;
  setProjectsPanelOpen: (open: boolean) => void;
  githubPanelOpen: boolean;
  setGithubPanelOpen: (open: boolean) => void;
  sharePanelOpen: boolean;
  setSharePanelOpen: (open: boolean) => void;
  deployPanelOpen: boolean;
  setDeployPanelOpen: (open: boolean) => void;
  quickActionsPanelOpen: boolean;
  setQuickActionsPanelOpen: (open: boolean) => void;
  helpPanelOpen: boolean;
  setHelpPanelOpen: (open: boolean) => void;
  pluginPanelOpen: boolean;
  setPluginPanelOpen: (open: boolean) => void;
  gitPanelOpen: boolean;
  setGitPanelOpen: (open: boolean) => void;
  searchPanelOpen: boolean;
  setSearchPanelOpen: (open: boolean) => void;
  // ── Command Palette ──
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  // ── Notification Center ──
  notificationCenterOpen: boolean;
  setNotificationCenterOpen: (open: boolean) => void;
  // ── Advanced Feature Panels ──
  aiCodeIntelOpen: boolean;
  setAiCodeIntelOpen: (open: boolean) => void;
  activityTimelineOpen: boolean;
  setActivityTimelineOpen: (open: boolean) => void;
  performanceMonitorOpen: boolean;
  setPerformanceMonitorOpen: (open: boolean) => void;
  // ── Template Marketplace ──
  templateMarketOpen: boolean;
  setTemplateMarketOpen: (open: boolean) => void;
  // ── Visual Canvas ──
  visualCanvasOpen: boolean;
  setVisualCanvasOpen: (open: boolean) => void;
  // ── Conflict Resolver ──
  conflictResolverOpen: boolean;
  setConflictResolverOpen: (open: boolean) => void;
  // ── Collab Replay Timeline ──
  collabReplayOpen: boolean;
  setCollabReplayOpen: (open: boolean) => void;
  // ── RBAC Panel ──
  rbacPanelOpen: boolean;
  setRbacPanelOpen: (open: boolean) => void;
  // ── Git Graph ──
  gitGraphOpen: boolean;
  setGitGraphOpen: (open: boolean) => void;
  // ── CI/CD Pipeline ──
  cicdPipelineOpen: boolean;
  setCicdPipelineOpen: (open: boolean) => void;
  // ── Flame Graph ──
  flameGraphOpen: boolean;
  setFlameGraphOpen: (open: boolean) => void;
  // ── Environment Variables ──
  envVarsOpen: boolean;
  setEnvVarsOpen: (open: boolean) => void;
  // ── AI Code Translator ──
  codeTranslatorOpen: boolean;
  setCodeTranslatorOpen: (open: boolean) => void;
  // ── ER Diagram ──
  erDiagramOpen: boolean;
  setErDiagramOpen: (open: boolean) => void;
  // ── API Tester ──
  apiTesterOpen: boolean;
  setApiTesterOpen: (open: boolean) => void;
  // ── AI Doc Generator ──
  docGeneratorOpen: boolean;
  setDocGeneratorOpen: (open: boolean) => void;
  // ── Workspace Manager ──
  workspaceManagerOpen: boolean;
  setWorkspaceManagerOpen: (open: boolean) => void;
  // ── Database Manager ──
  databaseManagerOpen: boolean;
  setDatabaseManagerOpen: (open: boolean) => void;
  // ── Layout Manager Panel ──
  layoutManagerOpen: boolean;
  setLayoutManagerOpen: (open: boolean) => void;
  // ── Whiteboard ──
  whiteboardOpen: boolean;
  setWhiteboardOpen: (open: boolean) => void;
  // ── Dependency Graph ──
  dependencyGraphOpen: boolean;
  setDependencyGraphOpen: (open: boolean) => void;
  // ── Snippet Manager ──
  snippetManagerOpen: boolean;
  setSnippetManagerOpen: (open: boolean) => void;
  // ── Plugin System ──
  pluginSystemOpen: boolean;
  setPluginSystemOpen: (open: boolean) => void;
  // ── Offline Cache ──
  offlineCacheOpen: boolean;
  setOfflineCacheOpen: (open: boolean) => void;
  // ── System Dashboard ──
  systemDashboardOpen: boolean;
  setSystemDashboardOpen: (open: boolean) => void;
  // ── Theme Manager ──
  themeManagerOpen: boolean;
  setThemeManagerOpen: (open: boolean) => void;
  // ── Multi-Window Manager ──
  multiWindowOpen: boolean;
  setMultiWindowOpen: (open: boolean) => void;
  // ── Realtime Collab Enhanced ──
  realtimeCollabEnhancedOpen: boolean;
  setRealtimeCollabEnhancedOpen: (open: boolean) => void;
  // ── Code Sandbox ──
  codeSandboxOpen: boolean;
  setCodeSandboxOpen: (open: boolean) => void;
  // ── Visual Query Builder ──
  visualQueryBuilderOpen: boolean;
  setVisualQueryBuilderOpen: (open: boolean) => void;
  // ── Task Board ──
  taskBoardOpen: boolean;
  setTaskBoardOpen: (open: boolean) => void;
  // ── Multi-Instance Panel ──
  multiInstancePanelOpen: boolean;
  setMultiInstancePanelOpen: (open: boolean) => void;
  // ── Terminal ──
  terminalVisible: boolean;
  toggleTerminal: () => void;
  terminalHeight: number;
  setTerminalHeight: (h: number) => void;
}

export const createPanelSlice: StateCreator<PanelSliceState, [], [], PanelSliceState> = (set) => ({
  shortcutsDialogOpen: false,
  setShortcutsDialogOpen: (open) => set({ shortcutsDialogOpen: open }),
  projectsPanelOpen: false,
  setProjectsPanelOpen: (open) => set({ projectsPanelOpen: open }),
  githubPanelOpen: false,
  setGithubPanelOpen: (open) => set({ githubPanelOpen: open }),
  sharePanelOpen: false,
  setSharePanelOpen: (open) => set({ sharePanelOpen: open }),
  deployPanelOpen: false,
  setDeployPanelOpen: (open) => set({ deployPanelOpen: open }),
  quickActionsPanelOpen: false,
  setQuickActionsPanelOpen: (open) => set({ quickActionsPanelOpen: open }),
  helpPanelOpen: false,
  setHelpPanelOpen: (open) => set({ helpPanelOpen: open }),
  pluginPanelOpen: false,
  setPluginPanelOpen: (open) => set({ pluginPanelOpen: open }),
  gitPanelOpen: false,
  setGitPanelOpen: (open) => set({ gitPanelOpen: open }),
  searchPanelOpen: false,
  setSearchPanelOpen: (open) => set({ searchPanelOpen: open }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  notificationCenterOpen: false,
  setNotificationCenterOpen: (open) => set({ notificationCenterOpen: open }),
  aiCodeIntelOpen: false,
  setAiCodeIntelOpen: (open) => set({ aiCodeIntelOpen: open }),
  activityTimelineOpen: false,
  setActivityTimelineOpen: (open) => set({ activityTimelineOpen: open }),
  performanceMonitorOpen: false,
  setPerformanceMonitorOpen: (open) => set({ performanceMonitorOpen: open }),
  templateMarketOpen: false,
  setTemplateMarketOpen: (open) => set({ templateMarketOpen: open }),
  visualCanvasOpen: false,
  setVisualCanvasOpen: (open) => set({ visualCanvasOpen: open }),
  conflictResolverOpen: false,
  setConflictResolverOpen: (open) => set({ conflictResolverOpen: open }),
  collabReplayOpen: false,
  setCollabReplayOpen: (open) => set({ collabReplayOpen: open }),
  rbacPanelOpen: false,
  setRbacPanelOpen: (open) => set({ rbacPanelOpen: open }),
  gitGraphOpen: false,
  setGitGraphOpen: (open) => set({ gitGraphOpen: open }),
  cicdPipelineOpen: false,
  setCicdPipelineOpen: (open) => set({ cicdPipelineOpen: open }),
  flameGraphOpen: false,
  setFlameGraphOpen: (open) => set({ flameGraphOpen: open }),
  envVarsOpen: false,
  setEnvVarsOpen: (open) => set({ envVarsOpen: open }),
  codeTranslatorOpen: false,
  setCodeTranslatorOpen: (open) => set({ codeTranslatorOpen: open }),
  erDiagramOpen: false,
  setErDiagramOpen: (open) => set({ erDiagramOpen: open }),
  apiTesterOpen: false,
  setApiTesterOpen: (open) => set({ apiTesterOpen: open }),
  docGeneratorOpen: false,
  setDocGeneratorOpen: (open) => set({ docGeneratorOpen: open }),
  workspaceManagerOpen: false,
  setWorkspaceManagerOpen: (open) => set({ workspaceManagerOpen: open }),
  databaseManagerOpen: false,
  setDatabaseManagerOpen: (open) => set({ databaseManagerOpen: open }),
  layoutManagerOpen: false,
  setLayoutManagerOpen: (open) => set({ layoutManagerOpen: open }),
  whiteboardOpen: false,
  setWhiteboardOpen: (open) => set({ whiteboardOpen: open }),
  dependencyGraphOpen: false,
  setDependencyGraphOpen: (open) => set({ dependencyGraphOpen: open }),
  snippetManagerOpen: false,
  setSnippetManagerOpen: (open) => set({ snippetManagerOpen: open }),
  pluginSystemOpen: false,
  setPluginSystemOpen: (open) => set({ pluginSystemOpen: open }),
  offlineCacheOpen: false,
  setOfflineCacheOpen: (open) => set({ offlineCacheOpen: open }),
  systemDashboardOpen: false,
  setSystemDashboardOpen: (open) => set({ systemDashboardOpen: open }),
  themeManagerOpen: false,
  setThemeManagerOpen: (open) => set({ themeManagerOpen: open }),
  multiWindowOpen: false,
  setMultiWindowOpen: (open) => set({ multiWindowOpen: open }),
  realtimeCollabEnhancedOpen: false,
  setRealtimeCollabEnhancedOpen: (open) => set({ realtimeCollabEnhancedOpen: open }),
  codeSandboxOpen: false,
  setCodeSandboxOpen: (open) => set({ codeSandboxOpen: open }),
  visualQueryBuilderOpen: false,
  setVisualQueryBuilderOpen: (open) => set({ visualQueryBuilderOpen: open }),
  taskBoardOpen: false,
  setTaskBoardOpen: (open) => set({ taskBoardOpen: open }),
  multiInstancePanelOpen: false,
  setMultiInstancePanelOpen: (open) => set({ multiInstancePanelOpen: open }),
  terminalVisible: false,
  toggleTerminal: () => set((state) => ({ terminalVisible: !state.terminalVisible })),
  terminalHeight: 200,
  setTerminalHeight: (h) => set({ terminalHeight: Math.max(100, Math.min(400, h)) }),
});
