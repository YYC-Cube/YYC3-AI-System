/**
 * @file store.ts
 * @description YYC³便携式智能AI系统 - 全局状态管理
 * Zustand store with persist middleware for LocalStorage
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags store,zustand,state-management,persist
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { AIModel, AIModelStatus, ChatSession, DesignRoot, Message, PanelSpec } from './types';
import { debounce } from './utils/debounce';
import { Language, getI18n, nextLanguage } from './utils/i18n';
import { ThemeMode, nextTheme } from './utils/theme';

export type { AIModel, Message } from './types';

export type ViewMode = 'code' | 'preview' | 'fullscreen';

export interface CustomThemeConfig {
  name: string;
  type: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    card: string;
    border: string;
  };
  fonts: {
    sans: string;
    mono: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  branding: {
    appName: string;
    slogan: string;
    subSlogan: string;
  };
}

export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  updatedAt: number;
  status: 'active' | 'archived' | 'draft';
  color: string;
}

interface AppState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;

  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  selectedFile: string | null;
  setSelectedFile: (file: string | null) => void;

  terminalVisible: boolean;
  toggleTerminal: () => void;
  terminalHeight: number;
  setTerminalHeight: (h: number) => void;

  messages: Message[];
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  quoteContent: string | null;
  setQuoteContent: (content: string | null) => void;
  activeMsgId: string | null;
  setActiveMsgId: (id: string | null) => void;

  // ── Multi-Session Chat ──
  chatSessions: ChatSession[];
  currentSessionId: string;
  loadSession: (sid: string) => void;
  createChatSession: () => string;
  deleteChatSession: (sid: string) => void;
  syncMessagesToSession: () => void;

  // ── Global Search ──
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: { sid: string; msg: Message }[];
  doGlobalSearch: () => void;

  designRoot: DesignRoot;
  updatePanel: (panelId: string, updates: Partial<PanelSpec>) => void;

  recentProjects: ProjectMeta[];
  addProject: (project: Omit<ProjectMeta, 'id'>) => void;
  removeProject: (id: string) => void;

  // ── AI Model Management ──
  aiModels: AIModel[];
  activeModelId: string | null;
  modelSettingsOpen: boolean;
  openModelSettings: () => void;
  closeModelSettings: () => void;
  addAIModel: (model: Omit<AIModel, 'id'>) => void;
  removeAIModel: (id: string) => void;
  updateAIModel: (id: string, updates: Partial<AIModel>) => void;
  activateAIModel: (id: string) => void;
  setModelStatus: (id: string, status: AIModelStatus, result?: string) => void;
  syncAIModelsFromProvider: (models: AIModel[], activeModelId: string | null) => void;

  // ── Theme Customizer ──
  themeCustomizerOpen: boolean;
  openThemeCustomizer: () => void;
  closeThemeCustomizer: () => void;
  customThemeConfig: CustomThemeConfig;
  updateCustomThemeConfig: (updates: Partial<CustomThemeConfig>) => void;
  updateCustomColors: (colors: Partial<CustomThemeConfig['colors']>) => void;
  resetCustomThemeConfig: () => void;

  // ── Peel Transition ──
  peelTransition: { active: boolean; x: number; y: number } | null;
  triggerPeelTransition: (x: number, y: number) => void;

  // ── Panel Layout Map ──
  panelMap: { left: string; middle: string; right: string };
  setPanelMap: (map: { left: string; middle: string; right: string }) => void;
  swapPanels: (from: 'left' | 'middle' | 'right', to: 'left' | 'middle' | 'right') => void;

  // ── Layout Manager ──
  savedLayouts: {
    id: string;
    name: string;
    panelMap: { left: string; middle: string; right: string };
    viewMode: ViewMode;
    isDefault: boolean;
    createdAt: number;
  }[];
  activeLayoutId: string | null;
  layoutAutoSave: boolean;
  saveLayout: (name: string) => void;
  loadLayout: (id: string) => void;
  deleteLayout: (id: string) => void;
  renameLayout: (id: string, name: string) => void;
  setDefaultLayout: (id: string) => void;
  setLayoutAutoSave: (on: boolean) => void;

  // ── Tab File States ──
  modifiedFiles: string[];
  errorFiles: string[];
  readOnlyFiles: string[];
  setFileModified: (file: string, modified: boolean) => void;
  setFileError: (file: string, hasError: boolean) => void;
  setFileReadOnly: (file: string, readOnly: boolean) => void;

  // ── Collaboration Presence (yjs-driven) ──
  collaborators: {
    id: string;
    name: string;
    color: string;
    cursor: { file: string; line: number } | null;
    online: boolean;
  }[];
  setCollaborators: (
    c: {
      id: string;
      name: string;
      color: string;
      cursor: { file: string; line: number } | null;
      online: boolean;
    }[]
  ) => void;

  // ── Code Injection (AI → CodeEditor) ──
  pendingCodeInjection: { filename: string; code: string; language: string } | null;
  injectCode: (filename: string, code: string, language: string) => void;
  clearCodeInjection: () => void;

  // ── Dialogs & Panels ──
  shortcutsDialogOpen: boolean;
  setShortcutsDialogOpen: (open: boolean) => void;
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

  // ── File Tabs ──
  openTabs: string[];
  pinnedTabs: string[];
  addOpenTab: (file: string) => void;
  removeOpenTab: (file: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  closeOtherTabs: (file: string) => void;
  closeRightTabs: (file: string) => void;
  closeAllTabs: () => void;
  togglePinTab: (file: string) => void;

  // ── Git Diff Viewer ──
  gitDiffFile: string | null;
  setGitDiffFile: (file: string | null) => void;

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

  // ── Sandbox ↔ Preview Sync ──
  sandboxPreviewCode: string | null;
  sandboxPreviewLang: string | null;
  setSandboxPreviewCode: (code: string | null, lang: string | null) => void;

  // ── Database Connection ──
  realDbConnectionEnabled: boolean;
  enableRealDbConnection: (enabled: boolean) => void;
  activeDbConnection: string | null;
  setActiveDbConnection: (id: string | null) => void;
}

const _createDebouncedSetter = <T>(
  set: (partial: Partial<AppState>) => void,
  key: keyof AppState,
  delay: number = 50
) => {
  const debouncedFn = debounce(
    (value: T) => {
      set({ [key]: value } as Partial<AppState>);
    },
    { delay, leading: true, trailing: true }
  );

  return (value: T) => {
    debouncedFn(value);
  };
};
void _createDebouncedSetter;

let debouncedTerminalHeightUpdate: ((h: number) => void) | null = null;
let debouncedPanelUpdate: ((panelId: string, updates: Partial<PanelSpec>) => void) | null = null;
let debouncedThemeConfigUpdate: ((updates: Partial<CustomThemeConfig>) => void) | null = null;
let debouncedColorsUpdate: ((colors: Partial<CustomThemeConfig['colors']>) => void) | null = null;

const initialDesignRoot: DesignRoot = {
  version: '1.0.0',
  theme: 'dark',
  tokens: '',
  panels: [
    {
      id: 'left-panel',
      type: 'container',
      layout: { x: 0, y: 0, w: 25, h: 100, minW: 15, maxW: 40 },
      style: {},
    },
    {
      id: 'mid-panel',
      type: 'container',
      layout: { x: 25, y: 0, w: 45, h: 100, minW: 25, maxW: 60 },
      style: {},
    },
    {
      id: 'right-panel',
      type: 'container',
      layout: { x: 70, y: 0, w: 30, h: 100, minW: 20, maxW: 50 },
      style: {},
    },
  ],
  components: [],
  styles: { tokens: {}, theme: {}, components: {} },
};

const defaultProjects: ProjectMeta[] = [
  {
    id: 'p1',
    name: 'CloudPivot Dashboard',
    description: 'projDescDashboard',
    updatedAt: Date.now() - 3600000,
    status: 'active',
    color: '#6366f1',
  },
  {
    id: 'p2',
    name: 'YYC3 Design System',
    description: 'projDescDesignSystem',
    updatedAt: Date.now() - 86400000,
    status: 'active',
    color: '#3b82f6',
  },
  {
    id: 'p3',
    name: 'AI Chat Module',
    description: 'projDescAiChat',
    updatedAt: Date.now() - 172800000,
    status: 'draft',
    color: '#14b8a6',
  },
  {
    id: 'p4',
    name: 'Code Generator',
    description: 'projDescCodeGen',
    updatedAt: Date.now() - 604800000,
    status: 'archived',
    color: '#f59e0b',
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: nextTheme(state.theme) })),

      language: 'zh',
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => set((state) => ({ language: nextLanguage(state.language) })),

      viewMode: 'code',
      setViewMode: (mode) => set({ viewMode: mode }),

      selectedFile: 'ChatInterface.tsx',
      setSelectedFile: (file) => set({ selectedFile: file }),

      terminalVisible: false,
      toggleTerminal: () => set((state) => ({ terminalVisible: !state.terminalVisible })),
      terminalHeight: 200,
      setTerminalHeight: (h) => {
        const clampedH = Math.max(100, Math.min(400, h));
        if (!debouncedTerminalHeightUpdate) {
          debouncedTerminalHeightUpdate = debounce(
            (height: number) => {
              set({ terminalHeight: height });
            },
            { delay: 50, leading: true, trailing: true }
          );
        }
        debouncedTerminalHeightUpdate(clampedH);
      },

      messages: [
        { id: '1', role: 'ai', content: getI18n('zh').initialAiMessage, timestamp: Date.now() },
      ],
      addMessage: (msg) =>
        set((state) => {
          const newMessage = {
            ...msg,
            id: Math.random().toString(36).substring(2, 11),
            timestamp: Date.now(),
          };
          // Limit to last 100 messages to prevent localStorage overflow
          const newMessages = [...state.messages, newMessage].slice(-100);
          return { messages: newMessages };
        }),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      clearMessages: () => set({ messages: [] }),
      quoteContent: null,
      setQuoteContent: (content) => set({ quoteContent: content }),
      activeMsgId: null,
      setActiveMsgId: (id) => set({ activeMsgId: id }),

      // ── Multi-Session Chat ──
      chatSessions: [],
      currentSessionId: '',
      loadSession: (sid) =>
        set((state) => {
          const session = state.chatSessions.find((s) => s.sid === sid);
          return {
            currentSessionId: sid,
            messages: session?.messages ?? [],
          };
        }),
      createChatSession: () => {
        const sid = Math.random().toString(36).substring(2, 11);
        const now = new Date();
        const newSession: ChatSession = {
          sid,
          title: `${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
          createAt: Date.now(),
          updateAt: Date.now(),
          messages: [],
        };
        set((state) => ({
          chatSessions: [...state.chatSessions, newSession],
          currentSessionId: sid,
          messages: [],
        }));
        return sid;
      },
      deleteChatSession: (sid) =>
        set((state) => {
          const next = state.chatSessions.filter((s) => s.sid !== sid);
          if (state.currentSessionId === sid) {
            if (next.length > 0) {
              return {
                chatSessions: next,
                currentSessionId: next[next.length - 1].sid,
                messages: next[next.length - 1].messages,
              };
            }
            return { chatSessions: next, currentSessionId: '', messages: [] };
          }
          return { chatSessions: next };
        }),
      syncMessagesToSession: () =>
        set((state) => {
          const updated = state.chatSessions.map((s) => {
            if (s.sid === state.currentSessionId) {
              const firstUser = state.messages.find((m) => m.role === 'user');
              return {
                ...s,
                messages: state.messages,
                updateAt: Date.now(),
                title: firstUser
                  ? firstUser.content.slice(0, 30) + (firstUser.content.length > 30 ? '...' : '')
                  : s.title,
              };
            }
            return s;
          });
          return { chatSessions: updated };
        }),

      // ── Global Search ──
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),
      searchResults: [],
      doGlobalSearch: () =>
        set((state) => {
          if (!state.searchQuery.trim()) return { searchResults: [] };
          const q = state.searchQuery.toLowerCase();
          const results: { sid: string; msg: Message }[] = [];
          state.chatSessions.forEach((s) => {
            s.messages.forEach((msg) => {
              if (msg.content.toLowerCase().includes(q)) {
                results.push({ sid: s.sid, msg });
              }
            });
          });
          return { searchResults: results.slice(0, 50) };
        }),

      designRoot: initialDesignRoot,
      updatePanel: (panelId, updates) => {
        if (!debouncedPanelUpdate) {
          debouncedPanelUpdate = debounce(
            (pid: string, upd: Partial<PanelSpec>) => {
              set((state) => ({
                designRoot: {
                  ...state.designRoot,
                  panels: state.designRoot.panels.map((p) => (p.id === pid ? { ...p, ...upd } : p)),
                },
              }));
            },
            { delay: 30, leading: true, trailing: true }
          );
        }
        debouncedPanelUpdate(panelId, updates);
      },

      recentProjects: defaultProjects,
      addProject: (project) =>
        set((state) => ({
          recentProjects: [
            { ...project, id: Math.random().toString(36).substring(2, 11) },
            ...state.recentProjects,
          ],
        })),
      removeProject: (id) =>
        set((state) => ({ recentProjects: state.recentProjects.filter((p) => p.id !== id) })),

      // ── AI Model Management ──
      // Note: These are now passive mirrors synced from aiProviderService
      // Do not directly modify - use syncAIModelsFromProvider() from settings-integration.ts
      aiModels: [],
      activeModelId: null,
      modelSettingsOpen: false,
      openModelSettings: () => set({ modelSettingsOpen: true }),
      closeModelSettings: () => set({ modelSettingsOpen: false }),
      // These methods are now wrappers that delegate to aiProviderService via settings-integration
      addAIModel: (model) => {
        // Delegate to aiProviderService - use the model's provider as the provider ID
        const { aiProviderService } = require('./services/ai-provider');
        const providerId = model.provider || 'custom';
        // Generate stable ID based on provider and model name (not random)
        const stableId = providerId + '-' + model.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        aiProviderService.addModel(providerId, { ...model, id: stableId });
      },
      removeAIModel: (id) => {
        // Delegate to aiProviderService
        const { aiProviderService } = require('./services/ai-provider');
        const provider = aiProviderService.getActiveProvider();
        if (provider) aiProviderService.removeModel(provider.id, id);
      },
      updateAIModel: (id, updates) => {
        // Delegate to aiProviderService
        const { aiProviderService } = require('./services/ai-provider');
        const provider = aiProviderService.getActiveProvider();
        if (provider) {
          const model = provider.models.find((m: AIModel) => m.id === id);
          if (model) aiProviderService.addModel(provider.id, { ...model, ...updates });
        }
      },
      activateAIModel: (id) => {
        // Update local mirror
        set((state) => {
          // Sync active model ID to aiProviderService
          try {
            const { aiProviderService } = require('./services/ai-provider');
            const model = state.aiModels.find((m) => m.id === id);
            if (model) {
              // Sync the model ID (not name) to aiProviderService
              aiProviderService.setActiveModel(id);
            }
          } catch (e) {
            console.warn('Failed to sync to aiProviderService:', e);
          }
          return {
            aiModels: state.aiModels.map((m) => ({ ...m, isActive: m.id === id })),
            activeModelId: id,
          };
        });
      },
      setModelStatus: (id, status, result) => {
        // Update local mirror only - actual status is managed by aiProviderService
        set((state) => ({
          aiModels: state.aiModels.map((m) =>
            m.id === id
              ? {
                ...m,
                status,
                lastTestResult: result ?? m.lastTestResult,
                lastTestTime: Date.now(),
              }
              : m
          ),
        }));
      },
      // New: Sync method to update local mirror from aiProviderService
      syncAIModelsFromProvider: (models: AIModel[], activeModelId: string | null) => {
        set({ aiModels: models, activeModelId });
      },

      // ── Theme Customizer ──
      themeCustomizerOpen: false,
      openThemeCustomizer: () => set({ themeCustomizerOpen: true }),
      closeThemeCustomizer: () => set({ themeCustomizerOpen: false }),
      customThemeConfig: {
        name: getI18n('zh').defaultThemeName,
        type: 'dark',
        colors: {
          primary: '#6366f1',
          secondary: '#3b82f6',
          accent: '#f97316',
          background: '#0f172a',
          card: '#1e293b',
          border: '#334155',
        },
        fonts: {
          sans: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          mono: "'Fira Code', monospace",
        },
        radius: { sm: '8px', md: '12px', lg: '16px' },
        branding: {
          appName: 'YYC³ CloudPivot Intelli-Matrix',
          slogan: '言启象限 | 语枢未来',
          subSlogan: 'Words Initiate Quadrants, Language Serves as Core for Future',
        },
      },
      updateCustomThemeConfig: (updates) => {
        if (!debouncedThemeConfigUpdate) {
          debouncedThemeConfigUpdate = debounce(
            (upd: Partial<CustomThemeConfig>) => {
              set((state) => ({ customThemeConfig: { ...state.customThemeConfig, ...upd } }));
            },
            { delay: 100, leading: true, trailing: true }
          );
        }
        debouncedThemeConfigUpdate(updates);
      },
      updateCustomColors: (colors) => {
        if (!debouncedColorsUpdate) {
          debouncedColorsUpdate = debounce(
            (cols: Partial<CustomThemeConfig['colors']>) => {
              set((state) => ({
                customThemeConfig: {
                  ...state.customThemeConfig,
                  colors: { ...state.customThemeConfig.colors, ...cols },
                },
              }));
            },
            { delay: 100, leading: true, trailing: true }
          );
        }
        debouncedColorsUpdate(colors);
      },
      resetCustomThemeConfig: () =>
        set(() => ({
          customThemeConfig: {
            name: getI18n('zh').defaultThemeName,
            type: 'dark',
            colors: {
              primary: '#6366f1',
              secondary: '#3b82f6',
              accent: '#f97316',
              background: '#0f172a',
              card: '#1e293b',
              border: '#334155',
            },
            fonts: {
              sans: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              mono: "'Fira Code', monospace",
            },
            radius: { sm: '8px', md: '12px', lg: '16px' },
            branding: {
              appName: 'YYC³ CloudPivot Intelli-Matrix',
              slogan: '言启象限 | 语枢未来',
              subSlogan: 'Words Initiate Quadrants, Language Serves as Core for Future',
            },
          },
        })),

      // ── Peel Transition ──
      peelTransition: null,
      triggerPeelTransition: (x, y) => set(() => ({ peelTransition: { active: true, x, y } })),

      // ── Panel Layout Map ──
      panelMap: { left: 'chat', middle: 'files', right: 'code' },
      setPanelMap: (map) => set({ panelMap: map }),
      swapPanels: (from, to) =>
        set((state) => {
          const next = { ...state.panelMap };
          const temp = next[from];
          next[from] = next[to];
          next[to] = temp;
          return { panelMap: next };
        }),

      // ── Layout Manager ──
      savedLayouts: [],
      activeLayoutId: null,
      layoutAutoSave: false,
      saveLayout: (name) =>
        set((state) => {
          const layout = {
            id: 'layout-' + Date.now(),
            name,
            panelMap: { ...state.panelMap },
            viewMode: state.viewMode,
            isDefault: state.savedLayouts.length === 0,
            createdAt: Date.now(),
          };
          return { savedLayouts: [...state.savedLayouts, layout], activeLayoutId: layout.id };
        }),
      loadLayout: (id) =>
        set((state) => {
          const layout = state.savedLayouts.find((l) => l.id === id);
          if (!layout) return state;
          return {
            panelMap: { ...layout.panelMap },
            viewMode: layout.viewMode,
            activeLayoutId: id,
          };
        }),
      deleteLayout: (id) =>
        set((state) => ({
          savedLayouts: state.savedLayouts.filter((l) => l.id !== id),
          activeLayoutId: state.activeLayoutId === id ? null : state.activeLayoutId,
        })),
      renameLayout: (id, name) =>
        set((state) => ({
          savedLayouts: state.savedLayouts.map((l) => (l.id === id ? { ...l, name } : l)),
        })),
      setDefaultLayout: (id) =>
        set((state) => ({
          savedLayouts: state.savedLayouts.map((l) => ({ ...l, isDefault: l.id === id })),
        })),
      setLayoutAutoSave: (on) => set({ layoutAutoSave: on }),

      // ── Tab File States ──
      modifiedFiles: ['store.ts', 'ChatInterface.tsx'],
      errorFiles: [],
      readOnlyFiles: ['package.json'],
      setFileModified: (file, modified) =>
        set((state) => ({
          modifiedFiles: modified
            ? state.modifiedFiles.includes(file)
              ? state.modifiedFiles
              : [...state.modifiedFiles, file]
            : state.modifiedFiles.filter((f) => f !== file),
        })),
      setFileError: (file, hasError) =>
        set((state) => ({
          errorFiles: hasError
            ? state.errorFiles.includes(file)
              ? state.errorFiles
              : [...state.errorFiles, file]
            : state.errorFiles.filter((f) => f !== file),
        })),
      setFileReadOnly: (file, readOnly) =>
        set((state) => ({
          readOnlyFiles: readOnly
            ? state.readOnlyFiles.includes(file)
              ? state.readOnlyFiles
              : [...state.readOnlyFiles, file]
            : state.readOnlyFiles.filter((f) => f !== file),
        })),

      // ── Collaboration Presence ──
      collaborators: [],
      setCollaborators: (c) => set({ collaborators: c }),

      // ── Code Injection ──
      pendingCodeInjection: null,
      injectCode: (filename, code, language) =>
        set({ pendingCodeInjection: { filename, code, language } }),
      clearCodeInjection: () => set({ pendingCodeInjection: null }),

      // ── Dialogs & Panels ──
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

      // ── Command Palette ──
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // ── Notification Center ──
      notificationCenterOpen: false,
      setNotificationCenterOpen: (open) => set({ notificationCenterOpen: open }),

      // ── Advanced Feature Panels ──
      aiCodeIntelOpen: false,
      setAiCodeIntelOpen: (open) => set({ aiCodeIntelOpen: open }),
      activityTimelineOpen: false,
      setActivityTimelineOpen: (open) => set({ activityTimelineOpen: open }),
      performanceMonitorOpen: false,
      setPerformanceMonitorOpen: (open) => set({ performanceMonitorOpen: open }),

      // ── File Tabs ──
      openTabs: ['ChatInterface.tsx'],
      pinnedTabs: [],
      addOpenTab: (file) =>
        set((state) => ({
          openTabs: state.openTabs.includes(file) ? state.openTabs : [...state.openTabs, file],
        })),
      removeOpenTab: (file) =>
        set((state) => ({ openTabs: state.openTabs.filter((tab) => tab !== file) })),
      reorderTabs: (fromIndex, toIndex) =>
        set((state) => {
          const nextTabs = [...state.openTabs];
          const [movedTab] = nextTabs.splice(fromIndex, 1);
          nextTabs.splice(toIndex, 0, movedTab);
          return { openTabs: nextTabs };
        }),
      closeOtherTabs: (file) =>
        set((state) => ({ openTabs: state.openTabs.filter((tab) => tab === file) })),
      closeRightTabs: (file) =>
        set((state) => ({ openTabs: state.openTabs.slice(0, state.openTabs.indexOf(file) + 1) })),
      closeAllTabs: () => set(() => ({ openTabs: [], pinnedTabs: [] })),
      togglePinTab: (file) =>
        set((state) => ({
          pinnedTabs: state.pinnedTabs.includes(file)
            ? state.pinnedTabs.filter((tab) => tab !== file)
            : [...state.pinnedTabs, file],
        })),

      // ── Git Diff Viewer ──
      gitDiffFile: null,
      setGitDiffFile: (file) => set({ gitDiffFile: file }),

      // ── Feature Panels ──
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
      sandboxPreviewCode: null,
      sandboxPreviewLang: null,
      setSandboxPreviewCode: (code, lang) =>
        set({ sandboxPreviewCode: code, sandboxPreviewLang: lang }),

      // ── Database Connection ──
      realDbConnectionEnabled: false,
      enableRealDbConnection: (enabled) => {
        set({ realDbConnectionEnabled: enabled });
        const { dbService } = require('./services/db-service');
        dbService.enableRealConnection(enabled);
      },
      activeDbConnection: null,
      setActiveDbConnection: (id) => set({ activeDbConnection: id }),
    }),
    {
      name: 'yyc3-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        viewMode: state.viewMode,
        selectedFile: state.selectedFile,
        terminalVisible: state.terminalVisible,
        terminalHeight: state.terminalHeight,
        messages: state.messages,
        recentProjects: state.recentProjects,
        aiModels: state.aiModels,
        activeModelId: state.activeModelId,
        customThemeConfig: state.customThemeConfig,
        panelMap: state.panelMap,
        openTabs: state.openTabs,
        pinnedTabs: state.pinnedTabs,
        savedLayouts: state.savedLayouts,
        activeLayoutId: state.activeLayoutId,
        layoutAutoSave: state.layoutAutoSave,
        modifiedFiles: state.modifiedFiles,
        realDbConnectionEnabled: state.realDbConnectionEnabled,
        activeDbConnection: state.activeDbConnection,
      }),
    }
  )
);
