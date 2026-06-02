/**
 * @file CommandPalette.tsx
 * @description YYC³便携式智能AI系统 - 命令面板
 * Command Palette (cmdk-powered)
 * Universal quick-action overlay with fuzzy search, keyboard navigation,
 * and grouped commands (Navigation, Actions, Themes, Tools).
 * Triggered via Ctrl+K or Ctrl+P.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,command-palette,ui,keyboard
 */

import { Command } from 'cmdk';
import {
  Home,
  Eye,
  Code,
  Search,
  Terminal,
  Settings,
  Palette,
  Folder,
  Bell,
  Rocket,
  Share,
  Github,
  Keyboard,
  Languages,
  Sun,
  Moon,
  TreePine,
  Sunset,
  Star,
  Play,
  TestTube,
  GitBranch,
  X,
  Sparkles,
  Brain,
  Activity,
  Gauge,
  LayoutGrid,
  HardDrive,
  Database,
  PenTool,
  FlaskConical,
  BookOpen,
  Pencil,
  GitFork,
  Code2,
  Puzzle,
  Wifi,
  BarChart3,
  AppWindow,
  Users,
  Box,
  TableProperties,
} from 'lucide-react';
import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { useAppStore } from '../store';
import { getI18n, resolveKey } from '../utils/i18n';
import { getThemeTokens, THEME_PRESETS } from '../utils/theme';

const THEME_ICONS: Record<string, React.FC<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  midnight: Star,
  forest: TreePine,
  sunset: Sunset,
};

export function CommandPalette() {
  const navigate = useNavigate();
  const {
    theme,
    setTheme,
    language,
    toggleLanguage,
    commandPaletteOpen,
    setCommandPaletteOpen,
    setViewMode,
    toggleTerminal,
    openThemeCustomizer,
    openModelSettings,
    setShortcutsDialogOpen,
    setSearchPanelOpen,
    setNotificationCenterOpen,
    addProject,
  } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  // Global shortcut: Ctrl+K or Ctrl+P opens palette
  const handleGlobalKey = useCallback(
    (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    },
    [commandPaletteOpen, setCommandPaletteOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [handleGlobalKey]);

  if (!commandPaletteOpen) return null;

  const close = () => setCommandPaletteOpen(false);

  const run = (fn: () => void) => {
    fn();
    close();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm" onClick={close} />

      {/* Palette */}
      <div className="fixed inset-0 z-[71] flex items-start justify-center pt-[15vh]">
        <div
          className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl ${t.surface.popover} ${t.border.popover}`}
        >
          <Command className="flex flex-col" label={i.cpPlaceholder}>
            {/* Input */}
            <div className={`flex items-center px-4 border-b ${t.border.subtle}`}>
              <Search className={`w-4 h-4 flex-shrink-0 ${t.text.muted}`} />
              <Command.Input
                placeholder={i.cpPlaceholder}
                className={`flex-1 bg-transparent border-none outline-none px-3 py-3.5 text-[14px] ${t.text.primary} placeholder:${t.text.dimmed}`}
                autoFocus
              />
              <button
                onClick={close}
                className={`p-1 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Results */}
            <Command.List className={`max-h-[50vh] overflow-y-auto p-2 ${t.scrollbar}`}>
              <Command.Empty className={`py-8 text-center text-[13px] ${t.text.muted}`}>
                {i.cpNoResults}
              </Command.Empty>

              {/* ── Navigation ── */}
              <Command.Group heading={i.cpNavigation}>
                <PaletteItem
                  icon={<Home className="w-4 h-4" />}
                  label={i.home}
                  shortcut="Esc"
                  onSelect={() => run(() => navigate('/'))}
                  t={t}
                />
                <PaletteItem
                  icon={<Eye className="w-4 h-4" />}
                  label={i.preview}
                  shortcut="Ctrl+1"
                  onSelect={() => run(() => setViewMode('preview'))}
                  t={t}
                />
                <PaletteItem
                  icon={<Code className="w-4 h-4" />}
                  label={i.code}
                  shortcut="Ctrl+2"
                  onSelect={() => run(() => setViewMode('code'))}
                  t={t}
                />
              </Command.Group>

              {/* ── Actions ── */}
              <Command.Group heading={i.cpActions}>
                <PaletteItem
                  icon={<Search className="w-4 h-4" />}
                  label={i.search}
                  shortcut="Ctrl+Shift+F"
                  onSelect={() => run(() => setSearchPanelOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<Bell className="w-4 h-4" />}
                  label={i.notifications}
                  shortcut="Ctrl+Shift+N"
                  onSelect={() => run(() => setNotificationCenterOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<Terminal className="w-4 h-4" />}
                  label={i.toggleTerminal}
                  shortcut="Ctrl+Shift+T"
                  onSelect={() => run(() => toggleTerminal())}
                  t={t}
                />
                <PaletteItem
                  icon={<Folder className="w-4 h-4" />}
                  label={i.newProject}
                  onSelect={() =>
                    run(() => {
                      addProject({
                        name: `Project ${Date.now() % 1000}`,
                        description: 'projDescDashboard',
                        updatedAt: Date.now(),
                        status: 'draft',
                        color: '#6366f1',
                      });
                      toast.success(i.toastProjectCreated);
                    })
                  }
                  t={t}
                />
                <PaletteItem
                  icon={<Play className="w-4 h-4" />}
                  label={i.runBuild}
                  onSelect={() => run(() => toast.success(i.toastBuildStarted))}
                  t={t}
                />
                <PaletteItem
                  icon={<TestTube className="w-4 h-4" />}
                  label={i.runTests}
                  onSelect={() => run(() => toast.info(i.toastTestsRunning))}
                  t={t}
                />
                <PaletteItem
                  icon={<GitBranch className="w-4 h-4" />}
                  label={i.gitCommit}
                  onSelect={() => run(() => toast.success(i.toastAllCommitted))}
                  t={t}
                />
                <PaletteItem
                  icon={<Github className="w-4 h-4" />}
                  label={i.githubPush}
                  onSelect={() => run(() => toast.success(i.toastCodePushed))}
                  t={t}
                />
                <PaletteItem
                  icon={<Share className="w-4 h-4" />}
                  label={i.shareCopyLink}
                  onSelect={() =>
                    run(() => {
                      navigator.clipboard.writeText('https://yyc3.app/project/demo');
                      toast.success(i.toastLinkCopied);
                    })
                  }
                  t={t}
                />
                <PaletteItem
                  icon={<Rocket className="w-4 h-4" />}
                  label={i.deployPreview}
                  onSelect={() => run(() => toast.success(i.toastPreviewDeploy))}
                  t={t}
                />
              </Command.Group>

              {/* ── Themes ── */}
              <Command.Group heading={i.cpThemes}>
                {THEME_PRESETS.map((preset) => {
                  const Icon = THEME_ICONS[preset.id] || Palette;
                  return (
                    <PaletteItem
                      key={preset.id}
                      icon={<Icon className="w-4 h-4" />}
                      label={resolveKey(i, preset.labelKey)}
                      active={theme === preset.id}
                      onSelect={() =>
                        run(() => {
                          setTheme(preset.id);
                          toast.success(`${i.toastSwitchedTo} ${resolveKey(i, preset.labelKey)}`);
                        })
                      }
                      t={t}
                    />
                  );
                })}
                <PaletteItem
                  icon={<Palette className="w-4 h-4" />}
                  label={i.themeCustomize}
                  shortcut="Ctrl+,"
                  onSelect={() => run(() => openThemeCustomizer())}
                  t={t}
                />
              </Command.Group>

              {/* ── Tools ── */}
              <Command.Group heading={i.cpTools}>
                <PaletteItem
                  icon={<Brain className="w-4 h-4" />}
                  label={i.aciTitle}
                  onSelect={() => run(() => useAppStore.getState().setAiCodeIntelOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<GitBranch className="w-4 h-4" />}
                  label={i.gpTitle}
                  shortcut="Ctrl+Shift+G"
                  onSelect={() => run(() => useAppStore.getState().setGitPanelOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<Activity className="w-4 h-4" />}
                  label={i.atTitle}
                  onSelect={() => run(() => useAppStore.getState().setActivityTimelineOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<Gauge className="w-4 h-4" />}
                  label={i.pmTitle}
                  onSelect={() => run(() => useAppStore.getState().setPerformanceMonitorOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<Sparkles className="w-4 h-4" />}
                  label={i.modelManagement}
                  shortcut="Ctrl+Shift+A"
                  onSelect={() => run(() => openModelSettings())}
                  t={t}
                />
                <PaletteItem
                  icon={<Keyboard className="w-4 h-4" />}
                  label={i.shortcuts}
                  onSelect={() => run(() => setShortcutsDialogOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<Languages className="w-4 h-4" />}
                  label={i.language}
                  shortcut="Ctrl+Shift+L"
                  onSelect={() =>
                    run(() => {
                      toggleLanguage();
                      toast.info(i.toastLanguageSwitched);
                    })
                  }
                  t={t}
                />
                <PaletteItem
                  icon={<Settings className="w-4 h-4" />}
                  label={i.settings}
                  shortcut="Ctrl+,"
                  onSelect={() => run(() => openThemeCustomizer())}
                  t={t}
                />
                <PaletteItem
                  icon={<PenTool className="w-4 h-4" />}
                  label={i.erTitle}
                  onSelect={() => run(() => useAppStore.getState().setErDiagramOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<FlaskConical className="w-4 h-4" />}
                  label={i.apiTitle}
                  onSelect={() => run(() => useAppStore.getState().setApiTesterOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<BookOpen className="w-4 h-4" />}
                  label={i.dgTitle}
                  onSelect={() => run(() => useAppStore.getState().setDocGeneratorOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<HardDrive className="w-4 h-4" />}
                  label={i.wmTitle}
                  onSelect={() => run(() => useAppStore.getState().setWorkspaceManagerOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<Database className="w-4 h-4" />}
                  label={i.dbTitle}
                  onSelect={() => run(() => useAppStore.getState().setDatabaseManagerOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<LayoutGrid className="w-4 h-4" />}
                  label={i.lmTitle}
                  onSelect={() => run(() => useAppStore.getState().setLayoutManagerOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<Pencil className="w-4 h-4" />}
                  label={i.wbTitle}
                  onSelect={() => run(() => useAppStore.getState().setWhiteboardOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<GitFork className="w-4 h-4" />}
                  label={i.dpTitle}
                  onSelect={() => run(() => useAppStore.getState().setDependencyGraphOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<Code2 className="w-4 h-4" />}
                  label={i.snTitle}
                  onSelect={() => run(() => useAppStore.getState().setSnippetManagerOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<Puzzle className="w-4 h-4" />}
                  label={i.plTitle}
                  onSelect={() => run(() => useAppStore.getState().setPluginSystemOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<Wifi className="w-4 h-4" />}
                  label={i.swTitle}
                  onSelect={() => run(() => useAppStore.getState().setOfflineCacheOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<BarChart3 className="w-4 h-4" />}
                  label={i.sdTitle}
                  onSelect={() => run(() => useAppStore.getState().setSystemDashboardOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<Palette className="w-4 h-4" />}
                  label={i.tmTitle}
                  onSelect={() => run(() => useAppStore.getState().setThemeManagerOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<AppWindow className="w-4 h-4" />}
                  label={i.mwTitle}
                  onSelect={() => run(() => useAppStore.getState().setMultiWindowOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<Users className="w-4 h-4" />}
                  label={i.rcTitle}
                  onSelect={() =>
                    run(() => useAppStore.getState().setRealtimeCollabEnhancedOpen(true))
                  }
                  t={t}
                />
                <PaletteItem
                  icon={<Box className="w-4 h-4" />}
                  label={i.sbTitle}
                  onSelect={() => run(() => useAppStore.getState().setCodeSandboxOpen(true))}
                  t={t}
                />
                <PaletteItem
                  icon={<TableProperties className="w-4 h-4" />}
                  label={i.vqTitle}
                  onSelect={() => run(() => useAppStore.getState().setVisualQueryBuilderOpen(true))}
                  t={t}
                />
              </Command.Group>
            </Command.List>

            {/* Footer hint */}
            <div
              className={`flex items-center justify-between px-4 py-2 border-t ${t.border.subtle} text-[10px] ${t.text.dimmed}`}
            >
              <div className="flex items-center space-x-3">
                <span>
                  <kbd className={`px-1 py-0.5 rounded ${t.kbd}`}>↑↓</kbd> navigate
                </span>
                <span>
                  <kbd className={`px-1 py-0.5 rounded ${t.kbd}`}>Enter</kbd> select
                </span>
                <span>
                  <kbd className={`px-1 py-0.5 rounded ${t.kbd}`}>Esc</kbd> close
                </span>
              </div>
              <span>Ctrl+K</span>
            </div>
          </Command>
        </div>
      </div>
    </>
  );
}

/* ── Individual palette item ── */
function PaletteItem({
  icon,
  label,
  shortcut,
  active,
  onSelect,
  t,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  onSelect: () => void;
  t: ReturnType<typeof getThemeTokens>;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] ${t.transition}
        ${active ? `${t.accent.activeBg} ${t.accent.activeText}` : ''}
        ${t.isDark ? 'data-[selected=true]:bg-slate-700/40' : 'data-[selected=true]:bg-slate-100'}
        ${t.isDark ? 'text-slate-200' : 'text-slate-700'}
      `}
      style={{ fontWeight: active ? 500 : 400 }}
    >
      <span className={`flex-shrink-0 ${active ? t.accent.primary : t.text.muted}`}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {shortcut && (
        <div className="flex items-center space-x-0.5 flex-shrink-0">
          {shortcut.split('+').map((k, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className={`text-[9px] mx-0.5 ${t.text.dimmed}`}>+</span>}
              <kbd
                className={`px-1.5 py-0.5 rounded text-[9px] ${t.kbd}`}
                style={{ fontWeight: 500 }}
              >
                {k}
              </kbd>
            </React.Fragment>
          ))}
        </div>
      )}
    </Command.Item>
  );
}
