/**
 * @file IntegratedTerminal.tsx
 * @description YYC³便携式智能AI系统 - 跨越中右列的集成终端
 * Integrated Terminal spanning middle + right columns
 * Features: multi-tab with shell types, rename, search output, process indicators,
 * split view, kill process, maximize/restore, drag-reorder tabs, Liquid Glass styling.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,terminal,shell,cli
 */

import {
  Terminal,
  Plus,
  X,
  Zap,
  GitBranch,
  Maximize2,
  Minimize2,
  Search,
  Square,
  Columns,
} from 'lucide-react';
import React, { useState, useRef, useCallback, KeyboardEvent, useEffect } from 'react';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import type { I18nStrings } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

/* ── Shell types ── */
type ShellType = 'bash' | 'zsh' | 'node' | 'python';

const SHELL_CONFIG: Record<
  ShellType,
  { label: string; labelKey: keyof I18nStrings; prompt: string; color: string }
> = {
  bash: { label: 'Bash', labelKey: 'tmBash', prompt: '➜  yyc3-app git:(main) ✗', color: '#10b981' },
  zsh: { label: 'Zsh', labelKey: 'tmZsh', prompt: '➜  yyc3-app git:(main) ✗', color: '#6366f1' },
  node: { label: 'Node', labelKey: 'tmNode', prompt: '>', color: '#f59e0b' },
  python: { label: 'Python', labelKey: 'tmPython', prompt: '>>>', color: '#3b82f6' },
};

interface TerminalTab {
  id: string;
  name: string;
  shell: ShellType;
  lines: TerminalLine[];
  isRunning: boolean;
  pid: number;
}

interface TerminalLine {
  type: 'prompt' | 'command' | 'output' | 'error' | 'success';
  text: string;
}

const INITIAL_LINES: TerminalLine[] = [
  { type: 'output', text: '  VITE v5.0.0  ready in 120 ms' },
  { type: 'output', text: '' },
  { type: 'output', text: '  ➜  Local:   http://localhost:5173/' },
  { type: 'output', text: '  ➜  Network: use --host to expose' },
  { type: 'output', text: '  ➜  press h to show help' },
  { type: 'output', text: '' },
];

const QUICK_COMMANDS = [
  { label: 'dev', cmd: 'pnpm dev', icon: '▶' },
  { label: 'build', cmd: 'pnpm build', icon: '📦' },
  { label: 'lint', cmd: 'pnpm lint', icon: '🔍' },
  { label: 'test', cmd: 'pnpm test', icon: '🧪' },
  { label: 'git status', cmd: 'git status', icon: '📋' },
];

export function IntegratedTerminal() {
  const { theme, language } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const [tabs, setTabs] = useState<TerminalTab[]>([
    {
      id: 'main',
      name: 'bash',
      shell: 'bash',
      lines: [...INITIAL_LINES],
      isRunning: true,
      pid: 1024,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState('main');
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [splitTabId, setSplitTabId] = useState<string | null>(null);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState(0);

  // Rename state
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(
    null
  );

  // Shell selector
  const [shellSelectorOpen, setShellSelectorOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0];
  const splitTab = isSplit && splitTabId ? tabs.find((tab) => tab.id === splitTabId) : null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeTab?.lines]);

  // Search highlighting
  useEffect(() => {
    if (!searchQuery || !activeTab) {
      setSearchMatches(0);
      return;
    }
    const matches = activeTab.lines.filter((l) =>
      l.text.toLowerCase().includes(searchQuery.toLowerCase())
    ).length;
    setSearchMatches(matches);
  }, [searchQuery, activeTab]);

  const addOutput = useCallback((tabId: string, newLines: TerminalLine[]) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, lines: [...tab.lines, ...newLines] } : tab))
    );
  }, []);

  const executeCommand = useCallback(
    (cmd: string) => {
      const tabId = activeTabId;
      const tab = tabs.find((t) => t.id === tabId);
      const shellPrompt = tab ? SHELL_CONFIG[tab.shell].prompt : '➜  yyc3-app git:(main) ✗';

      addOutput(tabId, [{ type: 'prompt', text: `${shellPrompt} ${cmd}` }]);

      setCommandHistory((prev) => [cmd, ...prev.slice(0, 49)]);
      setHistoryIndex(-1);

      if (cmd === 'clear') {
        setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, lines: [] } : t)));
        return;
      }

      // Simulate long-running process for dev/test
      if (['pnpm dev', 'pnpm test', 'npm start'].includes(cmd)) {
        setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, isRunning: true } : t)));
      }

      setTimeout(() => {
        const response = getCommandResponse(cmd, i);
        addOutput(tabId, response);
      }, 100);
    },
    [activeTabId, tabs, addOutput, i]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && input.trim()) {
        executeCommand(input.trim());
        setInput('');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          const next = historyIndex + 1;
          setHistoryIndex(next);
          setInput(commandHistory[next]);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
          const next = historyIndex - 1;
          setHistoryIndex(next);
          setInput(commandHistory[next]);
        } else {
          setHistoryIndex(-1);
          setInput('');
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const parts = input.split(' ');
        const last = parts[parts.length - 1];
        const commands = [
          'pnpm',
          'git',
          'npm',
          'node',
          'clear',
          'ls',
          'cd',
          'cat',
          'echo',
          'pwd',
          'mkdir',
          'tree',
          'help',
          'whoami',
          'date',
          'which',
        ];
        const filePaths = [
          'src/',
          'src/app/',
          'src/app/components/',
          'src/styles/',
          'package.json',
          'tsconfig.json',
          'README.md',
          'vite.config.ts',
        ];
        const gitSubs = [
          'status',
          'log',
          'add',
          'commit',
          'push',
          'pull',
          'branch',
          'checkout',
          'diff',
          'stash',
        ];
        const pnpmSubs = ['dev', 'build', 'lint', 'test', 'install', 'add', 'remove'];

        let candidates: string[] = [];
        if (parts.length === 1) {
          candidates = commands.filter((c) => c.startsWith(last));
        } else if (parts[0] === 'git') {
          candidates = gitSubs
            .filter((c) => c.startsWith(last))
            .map((c) => parts.slice(0, -1).join(' ') + ' ' + c);
        } else if (parts[0] === 'pnpm' || parts[0] === 'npm') {
          candidates = pnpmSubs
            .filter((c) => c.startsWith(last))
            .map((c) => parts.slice(0, -1).join(' ') + ' ' + c);
        } else if (['cd', 'cat', 'ls'].includes(parts[0])) {
          candidates = filePaths
            .filter((c) => c.startsWith(last))
            .map((c) => parts.slice(0, -1).join(' ') + ' ' + c);
        } else {
          candidates = commands.filter((c) => c.startsWith(last));
        }

        if (candidates.length === 1) {
          setInput(parts.length === 1 ? candidates[0] + ' ' : candidates[0]);
        } else if (candidates.length > 1) {
          addOutput(activeTabId, [
            { type: 'output', text: candidates.map((c) => c.split(' ').pop()).join('  ') },
          ]);
        }
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, lines: [] } : t)));
      } else if (e.key === 'f' && e.ctrlKey) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    },
    [input, historyIndex, commandHistory, executeCommand, activeTabId, addOutput]
  );

  const addTab = (shell: ShellType = 'bash') => {
    const id = `tab-${Date.now()}`;
    const name = SHELL_CONFIG[shell].label.toLowerCase();
    setTabs((prev) => [
      ...prev,
      {
        id,
        name,
        shell,
        lines: [],
        isRunning: false,
        pid: Math.floor(Math.random() * 9000) + 1000,
      },
    ]);
    setActiveTabId(id);
    setShellSelectorOpen(false);
  };

  const removeTab = (id: string) => {
    if (tabs.length <= 1) return;
    setTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeTabId === id) {
      const remaining = tabs.filter((t) => t.id !== id);
      setActiveTabId(remaining[0]?.id || '');
    }
    if (splitTabId === id) {
      setIsSplit(false);
      setSplitTabId(null);
    }
  };

  const killProcess = (tabId: string) => {
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, isRunning: false } : t)));
    addOutput(tabId, [
      { type: 'error', text: '^C' },
      { type: 'output', text: '' },
    ]);
  };

  const startRename = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      setRenamingTabId(tabId);
      setRenameValue(tab.name);
    }
    setContextMenu(null);
  };

  const finishRename = () => {
    if (renamingTabId && renameValue.trim()) {
      setTabs((prev) =>
        prev.map((t) => (t.id === renamingTabId ? { ...t, name: renameValue.trim() } : t))
      );
    }
    setRenamingTabId(null);
  };

  const handleSplit = () => {
    if (tabs.length < 2) {
      addTab('bash');
    }
    if (tabs.length >= 2) {
      const other = tabs.find((t) => t.id !== activeTabId);
      if (other) {
        setIsSplit(true);
        setSplitTabId(other.id);
      }
    }
    setContextMenu(null);
  };

  const handleTabContext = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId });
  };

  const shellPrompt = SHELL_CONFIG[activeTab.shell].prompt;

  /* ── Render a terminal pane ── */
  const renderPane = (tab: TerminalTab, isMain: boolean) => (
    <div
      className={`flex flex-col ${isMain ? 'flex-1' : 'flex-1 border-l'} overflow-hidden ${t.border.subtle}`}
    >
      <div
        ref={isMain ? scrollRef : undefined}
        className={`flex-1 overflow-auto font-mono text-[12px] px-3 py-1 cursor-text ${t.scrollbar} ${t.isDark ? 'bg-transparent' : 'bg-slate-50/80'}`}
        onClick={() => isMain && inputRef.current?.focus()}
      >
        {tab.lines.map((line, _idx) => {
          const isHighlighted =
            searchQuery && line.text.toLowerCase().includes(searchQuery.toLowerCase());
          return (
            <div
              key={_idx}
              style={{ lineHeight: '19px' }}
              className={isHighlighted ? `${t.isDark ? 'bg-yellow-500/15' : 'bg-yellow-100'}` : ''}
            >
              {line.type === 'prompt' && <span className={t.terminal.prompt}>{line.text}</span>}
              {line.type === 'command' && <span className={t.terminal.command}>{line.text}</span>}
              {line.type === 'output' && (
                <span className={t.terminal.output}>{line.text || '\u00A0'}</span>
              )}
              {line.type === 'error' && <span className={t.terminal.error}>{line.text}</span>}
              {line.type === 'success' && <span className={t.terminal.success}>{line.text}</span>}
            </div>
          );
        })}

        {/* Current input line (main pane only) */}
        {isMain && (
          <div className="flex items-center" style={{ lineHeight: '19px' }}>
            <span className={`whitespace-nowrap ${t.terminal.prompt}`}>{shellPrompt} </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`flex-1 bg-transparent outline-none text-[12px] ${t.terminal.caret}`}
              spellCheck={false}
              autoComplete="off"
              style={{ fontWeight: 400 }}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`flex flex-col h-full overflow-hidden border-t ${t.transition} ${t.surface.glass} ${t.border.subtle}`}
    >
      {/* Terminal Header */}
      <div
        className={`h-7 flex items-center justify-between px-1 flex-shrink-0 ${t.surface.toolbar}`}
      >
        {/* Left: Terminal tabs */}
        <div className="flex items-center space-x-0 overflow-x-auto min-w-0">
          <div className="flex items-center mr-1.5 px-1">
            <Terminal className={`w-3 h-3 ${t.text.muted}`} />
          </div>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center space-x-1 px-2 py-0.5 rounded-t text-[11px] cursor-pointer ${t.transition} whitespace-nowrap ${
                activeTabId === tab.id
                  ? `${t.isDark ? 'bg-slate-900/60' : 'bg-white/60'} ${t.text.secondary}`
                  : t.interactive.iconBtn
              }`}
              onClick={() => setActiveTabId(tab.id)}
              onDoubleClick={() => startRename(tab.id)}
              onContextMenu={(e) => handleTabContext(e, tab.id)}
              style={{ fontWeight: activeTabId === tab.id ? 500 : 400 }}
            >
              {/* Shell color dot */}
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: SHELL_CONFIG[tab.shell].color }}
              />

              {/* Name or rename input */}
              {renamingTabId === tab.id ? (
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={finishRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishRename();
                    if (e.key === 'Escape') setRenamingTabId(null);
                  }}
                  className={`w-14 bg-transparent outline-none text-[11px] border-b ${t.border.subtle}`}
                  autoFocus
                />
              ) : (
                <span>{tab.name}</span>
              )}

              {/* Running indicator */}
              {tab.isRunning && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              )}

              {/* Close button */}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTab(tab.id);
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-0 ${t.interactive.iconBtn} ${t.transition}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}

          {/* New tab button with shell selector */}
          <div className="relative">
            <button
              onClick={() => setShellSelectorOpen(!shellSelectorOpen)}
              className={`p-0.5 ${t.transition} ${t.interactive.icon}`}
              title={i.newTerminal}
            >
              <Plus className="w-3 h-3" />
            </button>
            {shellSelectorOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShellSelectorOpen(false)} />
                <div
                  className={`absolute left-0 top-full mt-1 z-50 rounded-lg overflow-hidden min-w-[100px] ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
                >
                  <div
                    className={`px-2 py-1 text-[9px] uppercase tracking-wider ${t.text.dimmed}`}
                    style={{ fontWeight: 600 }}
                  >
                    {i.tmSelectShell}
                  </div>
                  {(Object.keys(SHELL_CONFIG) as ShellType[]).map((shell) => (
                    <button
                      key={shell}
                      onClick={() => addTab(shell)}
                      className={`w-full flex items-center gap-2 px-2 py-1 text-[10px] ${t.transition} ${t.interactive.menuItem}`}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: SHELL_CONFIG[shell].color }}
                      />
                      <span>{SHELL_CONFIG[shell].label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Quick actions + controls */}
        <div className="flex items-center space-x-0.5 flex-shrink-0">
          {QUICK_COMMANDS.slice(0, 3).map(({ label, cmd }) => (
            <button
              key={label}
              onClick={() => executeCommand(cmd)}
              className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] ${t.transition} whitespace-nowrap ${t.interactive.iconBtn}`}
              title={cmd}
            >
              <Zap className="w-2.5 h-2.5" />
              <span>{label}</span>
            </button>
          ))}

          <div className={`w-px h-3 mx-0.5 ${t.border.divider}`} />

          {/* Search toggle */}
          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className={`p-0.5 rounded ${t.transition} ${searchOpen ? t.accent.activeText : ''} ${t.interactive.iconBtn}`}
            title={i.tmSearch}
          >
            <Search className="w-2.5 h-2.5" />
          </button>

          {/* Split toggle */}
          <button
            onClick={() => {
              if (isSplit) {
                setIsSplit(false);
                setSplitTabId(null);
              } else handleSplit();
            }}
            className={`p-0.5 rounded ${t.transition} ${isSplit ? t.accent.activeText : ''} ${t.interactive.iconBtn}`}
            title={i.tmSplit}
          >
            <Columns className="w-2.5 h-2.5" />
          </button>

          {/* Kill process */}
          {activeTab.isRunning && (
            <button
              onClick={() => killProcess(activeTab.id)}
              className={`p-0.5 rounded ${t.transition} ${t.status.error} ${t.interactive.iconBtn}`}
              title={i.tmKillProcess}
            >
              <Square className="w-2.5 h-2.5" />
            </button>
          )}

          {/* Maximize */}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className={`p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
            title={isMaximized ? i.tmRestore : i.tmMaximize}
          >
            {isMaximized ? (
              <Minimize2 className="w-2.5 h-2.5" />
            ) : (
              <Maximize2 className="w-2.5 h-2.5" />
            )}
          </button>

          <div className={`w-px h-3 mx-0.5 ${t.border.divider}`} />

          {/* Git branch */}
          <span className={`flex items-center space-x-1 px-1 text-[10px] ${t.terminal.gitBranch}`}>
            <GitBranch className="w-2.5 h-2.5" />
            <span>main</span>
          </span>

          {/* PID */}
          <span className={`text-[9px] px-1 ${t.text.dimmed}`}>PID:{activeTab.pid}</span>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div
          className={`h-6 flex items-center px-2 gap-2 border-b ${t.border.subtle} ${t.surface.toolbar}`}
        >
          <Search className={`w-3 h-3 ${t.text.muted}`} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={i.tmSearchPlaceholder}
            className={`flex-1 bg-transparent outline-none text-[10px] ${t.text.primary}`}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchOpen(false);
                setSearchQuery('');
              }
            }}
          />
          {searchQuery && (
            <span className={`text-[9px] ${t.text.dimmed}`}>{searchMatches} matches</span>
          )}
          <button
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
            }}
            className={`p-0.5 ${t.interactive.iconBtn}`}
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      )}

      {/* Terminal Content (single or split) */}
      <div className={`flex ${isSplit ? 'flex-row' : 'flex-col'} flex-1 overflow-hidden`}>
        {renderPane(activeTab, true)}
        {isSplit && splitTab && renderPane(splitTab, false)}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className={`fixed z-50 rounded-lg overflow-hidden py-1 min-w-[140px] ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {[
              { label: i.tmRename, action: () => startRename(contextMenu.tabId) },
              {
                label: i.tmSplit,
                action: () => {
                  setIsSplit(true);
                  setSplitTabId(contextMenu.tabId);
                  setContextMenu(null);
                },
              },
              {
                label: i.tmKillProcess,
                action: () => {
                  killProcess(contextMenu.tabId);
                  setContextMenu(null);
                },
              },
              null,
              {
                label: i.tmClearAll,
                action: () => {
                  setTabs((prev) =>
                    prev.map((t) => (t.id === contextMenu.tabId ? { ...t, lines: [] } : t))
                  );
                  setContextMenu(null);
                },
              },
              {
                label: i.ftClose,
                action: () => {
                  removeTab(contextMenu.tabId);
                  setContextMenu(null);
                },
              },
            ].map((item, _idx) =>
              item === null ? (
                <div key={_idx} className={`my-0.5 h-px mx-2 ${t.border.divider}`} />
              ) : (
                <button
                  key={_idx}
                  onClick={item.action}
                  className={`w-full text-left px-3 py-1 text-[10px] ${t.transition} ${t.interactive.menuItem}`}
                >
                  {item.label}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Command Response Simulator ──
function getCommandResponse(cmd: string, i: I18nStrings): TerminalLine[] {
  if (cmd === 'ls' || cmd === 'ls -la') {
    return [
      { type: 'output', text: 'drwxr-xr-x  src/' },
      { type: 'output', text: 'drwxr-xr-x  node_modules/' },
      { type: 'output', text: '-rw-r--r--  package.json' },
      { type: 'output', text: '-rw-r--r--  tsconfig.json' },
      { type: 'output', text: '-rw-r--r--  vite.config.ts' },
      { type: 'output', text: '-rw-r--r--  README.md' },
    ];
  }
  if (cmd.startsWith('git status')) {
    return [
      { type: 'output', text: 'On branch main' },
      { type: 'output', text: 'Changes not staged for commit:' },
      { type: 'output', text: '  (use "git add <file>..." to update)' },
      { type: 'output', text: '' },
      { type: 'error', text: '  modified:   src/app/components/ChatInterface.tsx' },
      { type: 'error', text: '  modified:   src/app/store.ts' },
      { type: 'output', text: '' },
      { type: 'output', text: 'no changes added to commit' },
    ];
  }
  if (cmd === 'git log --oneline -5') {
    return [
      { type: 'success', text: 'a1b2c3d feat: add code folding to editor' },
      { type: 'output', text: 'e4f5g6h fix: toolbar icon alignment' },
      { type: 'output', text: 'i7j8k9l feat: integrated terminal' },
      { type: 'output', text: 'm0n1o2p refactor: split toolbar components' },
      { type: 'output', text: 'q3r4s5t init: project setup' },
    ];
  }
  if (cmd === 'pnpm dev') {
    return [
      { type: 'output', text: '' },
      { type: 'success', text: '  VITE v5.0.0  ready in 120 ms' },
      { type: 'output', text: '' },
      { type: 'output', text: '  ➜  Local:   http://localhost:5173/' },
      { type: 'output', text: '  ➜  Network: use --host to expose' },
    ];
  }
  if (cmd === 'pnpm build') {
    return [
      { type: 'output', text: '> yyc3-portaisys build' },
      { type: 'output', text: '> vite build' },
      { type: 'output', text: '' },
      { type: 'success', text: '✓ 42 modules transformed.' },
      { type: 'output', text: 'dist/index.html      0.46 kB │ gzip:  0.30 kB' },
      { type: 'output', text: 'dist/assets/index.js 186.24 kB │ gzip: 58.12 kB' },
      { type: 'success', text: '✓ built in 1.24s' },
    ];
  }
  if (cmd === 'pnpm lint') {
    return [
      { type: 'output', text: '> yyc3-portaisys lint' },
      { type: 'output', text: '> eslint src/' },
      { type: 'output', text: '' },
      {
        type: 'error',
        text: "src/app/store.ts:35  error  'initialDesignRoot' is not defined  no-undef",
      },
      { type: 'output', text: '' },
      { type: 'output', text: '✖ 1 problem (1 error, 0 warnings)' },
    ];
  }
  if (cmd === 'pnpm test') {
    return [
      { type: 'output', text: '> yyc3-portaisys test' },
      { type: 'output', text: '> vitest run' },
      { type: 'output', text: '' },
      { type: 'success', text: ' ✓ src/app/store.test.ts (3 tests) 12ms' },
      { type: 'success', text: ' ✓ src/app/utils/ai-simulator.test.ts (5 tests) 8ms' },
      { type: 'output', text: '' },
      { type: 'success', text: ' Test Files  2 passed (2)' },
      { type: 'success', text: ' Tests       8 passed (8)' },
    ];
  }
  if (cmd === 'node -v') {
    return [{ type: 'output', text: 'v20.11.0' }];
  }
  if (cmd === 'pwd') {
    return [{ type: 'output', text: '/home/user/yyc3-portaisys' }];
  }
  if (cmd.startsWith('echo ')) {
    return [{ type: 'output', text: cmd.slice(5) }];
  }
  if (cmd === 'help') {
    return [
      { type: 'output', text: 'Available commands:' },
      { type: 'output', text: '  ls [-la]    - List files' },
      { type: 'output', text: '  cd <dir>    - Change directory' },
      { type: 'output', text: '  cat <file>  - View file contents' },
      { type: 'output', text: '  tree        - Show file tree' },
      { type: 'output', text: '  pwd         - Print working directory' },
      { type: 'output', text: '  whoami      - Current user' },
      { type: 'output', text: '  date        - Current date/time' },
      { type: 'output', text: '  which <cmd> - Locate command' },
      { type: 'output', text: '  echo <text> - Print text' },
      { type: 'output', text: '  git status  - Show git status' },
      { type: 'output', text: '  git log     - Show recent commits' },
      { type: 'output', text: '  pnpm dev    - Start dev server' },
      { type: 'output', text: '  pnpm build  - Build project' },
      { type: 'output', text: '  pnpm lint   - Lint code' },
      { type: 'output', text: '  pnpm test   - Run tests' },
      { type: 'output', text: '  clear       - Clear terminal (or Ctrl+L)' },
      { type: 'output', text: '  ssh user@host - SSH remote connection' },
      { type: 'output', text: '  ssh-keygen   - Generate SSH key pair' },
      { type: 'output', text: '  scp src dst  - Secure copy files' },
      { type: 'output', text: '  rsync        - Remote sync files' },
    ];
  }
  if (cmd === 'whoami') {
    return [{ type: 'output', text: 'yyc3-developer' }];
  }
  if (cmd === 'date') {
    return [{ type: 'output', text: new Date().toString() }];
  }
  if (cmd.startsWith('which ')) {
    const target = cmd.slice(6).trim();
    const known: Record<string, string> = {
      node: '/usr/local/bin/node',
      pnpm: '/usr/local/bin/pnpm',
      git: '/usr/bin/git',
      npm: '/usr/local/bin/npm',
      tsc: '/usr/local/bin/tsc',
      vite: './node_modules/.bin/vite',
    };
    return [
      { type: known[target] ? 'output' : 'error', text: known[target] || `${target} not found` },
    ];
  }
  if (cmd === 'tree') {
    return [
      { type: 'output', text: '.' },
      { type: 'output', text: '├── src/' },
      { type: 'output', text: '│   ├── app/' },
      { type: 'output', text: '│   │   ├── components/' },
      { type: 'output', text: '│   │   │   ├── ChatInterface.tsx' },
      { type: 'output', text: '│   │   │   ├── CodeEditor.tsx' },
      { type: 'output', text: '│   │   │   ├��─ FileManager.tsx' },
      { type: 'output', text: '│   │   │   ├── Header.tsx' },
      { type: 'output', text: '│   │   │   ├── HomePage.tsx' },
      { type: 'output', text: '│   │   │   ├── IDELayout.tsx' },
      { type: 'output', text: '│   │   │   ├── IntegratedTerminal.tsx' },
      { type: 'output', text: '│   │   │   ├── ModelSettings.tsx' },
      { type: 'output', text: '│   │   │   ├── PreviewPanel.tsx' },
      { type: 'output', text: '│   │   │   └── ThemeCustomizer.tsx' },
      { type: 'output', text: '│   │   ├── App.tsx' },
      { type: 'output', text: '│   │   ├── store.ts' },
      { type: 'output', text: '│   │   ├── types.ts' },
      { type: 'output', text: '│   │   └── routes.ts' },
      { type: 'output', text: '│   └── styles/' },
      { type: 'output', text: '│       ├── theme.css' },
      { type: 'output', text: '│       └── fonts.css' },
      { type: 'output', text: '├── package.json' },
      { type: 'output', text: '├── tsconfig.json' },
      { type: 'output', text: '├── vite.config.ts' },
      { type: 'output', text: '└── README.md' },
      { type: 'output', text: '' },
      { type: 'success', text: '3 directories, 18 files' },
    ];
  }
  if (cmd.startsWith('cat ')) {
    const file = cmd.slice(4).trim();
    if (file === 'package.json') {
      return [
        { type: 'output', text: '{' },
        { type: 'output', text: '  "name": "yyc3-portaisys",' },
        { type: 'output', text: '  "version": "1.0.0",' },
        { type: 'output', text: '  "private": true,' },
        { type: 'output', text: '  "type": "module",' },
        { type: 'output', text: '  "scripts": {' },
        { type: 'output', text: '    "dev": "vite",' },
        { type: 'output', text: '    "build": "tsc && vite build",' },
        { type: 'output', text: '    "lint": "eslint src/",' },
        { type: 'output', text: '    "test": "vitest run"' },
        { type: 'output', text: '  }' },
        { type: 'output', text: '}' },
      ];
    }
    if (file === 'README.md') {
      return [
        { type: 'output', text: '# YYC³ PortAISys' },
        { type: 'output', text: '' },
        { type: 'output', text: `> ${i.brandSlogan}` },
        { type: 'output', text: '' },
        { type: 'output', text: 'Portable Intelligent AI System with Liquid Glass UI' },
      ];
    }
    return [{ type: 'error', text: `cat: ${file}: No such file or directory` }];
  }
  if (cmd.startsWith('cd ')) {
    const dir = cmd.slice(3).trim();
    if (['src', 'src/', 'src/app', 'src/app/', 'src/app/components', '..', '.'].includes(dir)) {
      return [{ type: 'output', text: '' }];
    }
    return [{ type: 'error', text: `cd: no such file or directory: ${dir}` }];
  }
  if (cmd.startsWith('mkdir ')) {
    return [{ type: 'output', text: '' }];
  }
  if (cmd.startsWith('git log')) {
    return [
      { type: 'success', text: 'a1b2c3d feat: add search/replace to code editor' },
      { type: 'output', text: 'e4f5g6h feat: enhanced preview panel' },
      { type: 'output', text: 'i7j8k9l feat: theme token system v2' },
      { type: 'output', text: 'm0n1o2p fix: ESM dynamic import error' },
      { type: 'output', text: 'q3r4s5t feat: model settings modal' },
      { type: 'output', text: 'u6v7w8x feat: integrated terminal' },
      { type: 'output', text: 'y9z0a1b init: project setup' },
    ];
  }
  if (cmd.startsWith('git branch')) {
    return [
      { type: 'success', text: '* main' },
      { type: 'output', text: '  develop' },
      { type: 'output', text: '  feature/liquid-glass' },
    ];
  }
  if (cmd.startsWith('git diff')) {
    return [
      { type: 'output', text: 'diff --git a/src/app/components/ChatInterface.tsx' },
      { type: 'success', text: '+++ b/src/app/components/ChatInterface.tsx' },
      { type: 'error', text: '--- a/src/app/components/ChatInterface.tsx' },
      { type: 'output', text: '@@ -1,5 +1,7 @@' },
      { type: 'success', text: "+import { motion, AnimatePresence } from 'motion/react'" },
      { type: 'success', text: "+import { getThemeTokens } from '../utils/theme'" },
    ];
  }
  // ── SSH simulation ──
  if (cmd.startsWith('ssh ')) {
    const target = cmd.slice(4).trim();
    if (target.includes('@')) {
      const [user, host] = target.split('@');
      return [
        { type: 'output', text: `ssh: Connecting to ${host}...` },
        {
          type: 'output',
          text: `The authenticity of host '${host} (${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)})' can't be established.`,
        },
        {
          type: 'output',
          text: 'ED25519 key fingerprint is SHA256:xKf3j8R2m5dPqZ7nB4hY9vL1wA6sC0eG8iU2tR4pO1M.',
        },
        {
          type: 'output',
          text: 'Are you sure you want to continue connecting (yes/no/[fingerprint])?',
        },
        {
          type: 'success',
          text: "Warning: Permanently added '" + host + "' (ED25519) to the list of known hosts.",
        },
        { type: 'output', text: `${user}@${host}'s password: ` },
        {
          type: 'success',
          text: `Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)`,
        },
        { type: 'output', text: '' },
        { type: 'output', text: ` * Documentation:  https://help.ubuntu.com` },
        { type: 'output', text: ` * Management:     https://landscape.canonical.com` },
        { type: 'output', text: '' },
        {
          type: 'output',
          text: `Last login: ${new Date().toUTCString()} from 192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        },
        { type: 'success', text: `${user}@${host.split('.')[0]}:~$ ` },
      ];
    }
    return [
      { type: 'error', text: 'ssh: Could not resolve hostname: Name or service not known' },
      { type: 'output', text: 'Usage: ssh user@hostname [-p port]' },
    ];
  }
  if (cmd === 'ssh-keygen') {
    return [
      { type: 'output', text: 'Generating public/private ed25519 key pair.' },
      {
        type: 'output',
        text: 'Enter file in which to save the key (/home/yyc3-developer/.ssh/id_ed25519):',
      },
      { type: 'output', text: 'Enter passphrase (empty for no passphrase):' },
      { type: 'output', text: 'Enter same passphrase again:' },
      {
        type: 'success',
        text: 'Your identification has been saved in /home/yyc3-developer/.ssh/id_ed25519',
      },
      {
        type: 'success',
        text: 'Your public key has been saved in /home/yyc3-developer/.ssh/id_ed25519.pub',
      },
      { type: 'output', text: 'The key fingerprint is:' },
      {
        type: 'output',
        text: 'SHA256:xKf3j8R2m5dPqZ7nB4hY9vL1wA6sC0eG8iU2tR4pO1M yyc3-developer@yyc3-portaisys',
      },
    ];
  }
  if (cmd.startsWith('scp ')) {
    const parts = cmd.split(' ');
    const source = parts[1] || 'file';
    const dest = parts[2] || 'remote';
    return [
      { type: 'output', text: `${source}    100%  42KB  1.2MB/s   00:00` },
      { type: 'success', text: `Transferred ${source} → ${dest}` },
    ];
  }
  if (cmd.startsWith('rsync ')) {
    return [
      { type: 'output', text: 'sending incremental file list' },
      { type: 'output', text: 'src/' },
      { type: 'output', text: 'src/app/components/ChatInterface.tsx' },
      { type: 'output', text: 'src/app/store.ts' },
      { type: 'output', text: '' },
      { type: 'success', text: 'sent 4,218 bytes  received 85 bytes  8,606.00 bytes/sec' },
      { type: 'success', text: 'total size is 186,240  speedup is 43.26' },
    ];
  }
  if (cmd === 'ssh-add -l') {
    return [
      {
        type: 'output',
        text: '256 SHA256:xKf3j8R2m5dPqZ7nB4hY9vL1wA6sC0eG8iU2tR4pO1M yyc3-developer@yyc3-portaisys (ED25519)',
      },
    ];
  }
  return [{ type: 'error', text: `zsh: command not found: ${cmd.split(' ')[0]}` }];
}
