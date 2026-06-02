/**
 * @file terminal-service.ts
 * @description YYC³ 终端功能增强服务 - 多终端与命令历史管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [service],[terminal],[shell],[history],[multi-session]
 *
 * @brief 终端功能增强服务，实现多终端与命令历史管理
 *
 * @details
 * - 多终端会话管理
 * - 命令历史记录
 * - 输出过滤与搜索
 * - 终端主题定制
 * - 快捷命令别名
 */

export interface TerminalSession {
  id: string;
  name: string;
  type: TerminalType;
  status: TerminalStatus;
  createdAt: number;
  lastActivityAt: number;
  cwd: string;
  environment: Record<string, string>;
  history: CommandHistoryEntry[];
  output: OutputLine[];
  scrollback: number;
}

export type TerminalType = 'bash' | 'zsh' | 'powershell' | 'cmd' | 'sh';

export type TerminalStatus = 'running' | 'idle' | 'suspended' | 'closed';

export interface CommandHistoryEntry {
  id: string;
  command: string;
  timestamp: number;
  exitCode?: number;
  duration?: number;
  sessionId: string;
  cwd: string;
  output?: string;
}

export interface OutputLine {
  id: string;
  content: string;
  type: OutputType;
  timestamp: number;
  sessionId: string;
}

export type OutputType = 'stdout' | 'stderr' | 'stdin' | 'system' | 'error';

export interface TerminalTheme {
  id: string;
  name: string;
  colors: {
    background: string;
    foreground: string;
    cursor: string;
    selection: string;
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    brightBlack: string;
    brightRed: string;
    brightGreen: string;
    brightYellow: string;
    brightBlue: string;
    brightMagenta: string;
    brightCyan: string;
    brightWhite: string;
  };
  fontSize: number;
  fontFamily: string;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
}

export interface CommandAlias {
  name: string;
  command: string;
  description?: string;
}

export interface OutputFilter {
  id: string;
  name: string;
  pattern: string;
  type: 'include' | 'exclude' | 'highlight';
  enabled: boolean;
}

const DEFAULT_THEME: TerminalTheme = {
  id: 'default',
  name: '默认主题',
  colors: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#ffffff',
    selection: '#264f78',
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#e5e510',
    blue: '#2472c8',
    magenta: '#bc3fbc',
    cyan: '#11a8cd',
    white: '#e5e5e5',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#ffffff',
  },
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, "Courier New", monospace',
  cursorStyle: 'block',
  cursorBlink: true,
};

const DEFAULT_ALIASES: CommandAlias[] = [
  { name: 'll', command: 'ls -la', description: '详细列表' },
  { name: 'la', command: 'ls -A', description: '显示隐藏文件' },
  { name: 'cls', command: 'clear', description: '清屏' },
  { name: '..', command: 'cd ..', description: '上级目录' },
  { name: '...', command: 'cd ../..', description: '上两级目录' },
  { name: 'grep', command: 'grep --color=auto', description: '彩色grep' },
  { name: 'ports', command: 'netstat -tulanp', description: '显示端口' },
  { name: 'myip', command: 'curl -s ifconfig.me', description: '显示公网IP' },
];

class TerminalService {
  private sessions: Map<string, TerminalSession> = new Map();
  private globalHistory: CommandHistoryEntry[] = [];
  private themes: Map<string, TerminalTheme> = new Map();
  private aliases: Map<string, CommandAlias> = new Map();
  private filters: Map<string, OutputFilter> = new Map();
  private currentSessionId: string | null = null;
  private maxHistorySize = 1000;
  private maxScrollback = 10000;

  constructor() {
    this.initializeDefaults();
    this.loadFromStorage();
  }

  private initializeDefaults(): void {
    this.themes.set(DEFAULT_THEME.id, DEFAULT_THEME);
    DEFAULT_ALIASES.forEach((alias) => {
      this.aliases.set(alias.name, alias);
    });
  }

  createSession(options?: {
    name?: string;
    type?: TerminalType;
    cwd?: string;
    environment?: Record<string, string>;
  }): TerminalSession {
    const session: TerminalSession = {
      id: this.generateId(),
      name: options?.name || `终端 ${this.sessions.size + 1}`,
      type: options?.type || this.detectDefaultShell(),
      status: 'idle',
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      cwd: options?.cwd || process.cwd?.() || '/',
      environment: options?.environment || {},
      history: [],
      output: [],
      scrollback: this.maxScrollback,
    };

    this.sessions.set(session.id, session);
    this.currentSessionId = session.id;
    this.saveToStorage();

    return session;
  }

  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  getCurrentSession(): TerminalSession | undefined {
    if (!this.currentSessionId) return undefined;
    return this.sessions.get(this.currentSessionId);
  }

  getAllSessions(): TerminalSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  }

  setCurrentSession(sessionId: string): boolean {
    if (this.sessions.has(sessionId)) {
      this.currentSessionId = sessionId;
      return true;
    }
    return false;
  }

  closeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = 'closed';
    this.sessions.delete(sessionId);

    if (this.currentSessionId === sessionId) {
      const remaining = this.getAllSessions();
      this.currentSessionId = remaining.length > 0 ? remaining[0].id : null;
    }

    this.saveToStorage();
    return true;
  }

  executeCommand(sessionId: string, command: string): CommandHistoryEntry {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`会话不存在: ${sessionId}`);
    }

    const resolvedCommand = this.resolveAlias(command);

    const entry: CommandHistoryEntry = {
      id: this.generateId(),
      command: resolvedCommand,
      timestamp: Date.now(),
      sessionId,
      cwd: session.cwd,
    };

    session.history.push(entry);
    session.lastActivityAt = Date.now();
    session.status = 'running';

    this.globalHistory.push(entry);
    if (this.globalHistory.length > this.maxHistorySize) {
      this.globalHistory.shift();
    }

    this.saveToStorage();
    return entry;
  }

  completeCommand(sessionId: string, commandId: string, exitCode: number, duration: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const entry = session.history.find((h) => h.id === commandId);
    if (entry) {
      entry.exitCode = exitCode;
      entry.duration = duration;
    }

    session.status = 'idle';
    session.lastActivityAt = Date.now();
    this.saveToStorage();
  }

  addOutput(sessionId: string, content: string, type: OutputType): OutputLine {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`会话不存在: ${sessionId}`);
    }

    const line: OutputLine = {
      id: this.generateId(),
      content,
      type,
      timestamp: Date.now(),
      sessionId,
    };

    session.output.push(line);

    if (session.output.length > session.scrollback) {
      session.output.shift();
    }

    return line;
  }

  getHistory(sessionId?: string): CommandHistoryEntry[] {
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      return session ? [...session.history] : [];
    }
    return [...this.globalHistory];
  }

  searchHistory(query: string, sessionId?: string): CommandHistoryEntry[] {
    const history = this.getHistory(sessionId);
    const lowerQuery = query.toLowerCase();
    return history.filter((entry) => entry.command.toLowerCase().includes(lowerQuery));
  }

  clearHistory(sessionId?: string): void {
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.history = [];
      }
    } else {
      this.globalHistory = [];
      this.sessions.forEach((session) => {
        session.history = [];
      });
    }
    this.saveToStorage();
  }

  getOutput(sessionId: string, filter?: OutputFilter): OutputLine[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    let output = [...session.output];

    if (filter && filter.enabled) {
      const regex = new RegExp(filter.pattern, 'gi');
      switch (filter.type) {
        case 'include':
          output = output.filter((line) => regex.test(line.content));
          break;
        case 'exclude':
          output = output.filter((line) => !regex.test(line.content));
          break;
        case 'highlight':
          break;
      }
    }

    return output;
  }

  clearOutput(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.output = [];
    }
  }

  getTheme(themeId: string): TerminalTheme | undefined {
    return this.themes.get(themeId);
  }

  getAllThemes(): TerminalTheme[] {
    return Array.from(this.themes.values());
  }

  addTheme(theme: TerminalTheme): void {
    this.themes.set(theme.id, theme);
    this.saveToStorage();
  }

  removeTheme(themeId: string): boolean {
    if (themeId === 'default') return false;
    return this.themes.delete(themeId);
  }

  getAlias(name: string): CommandAlias | undefined {
    return this.aliases.get(name);
  }

  getAllAliases(): CommandAlias[] {
    return Array.from(this.aliases.values());
  }

  addAlias(alias: CommandAlias): void {
    this.aliases.set(alias.name, alias);
    this.saveToStorage();
  }

  removeAlias(name: string): boolean {
    return this.aliases.delete(name);
  }

  resolveAlias(command: string): string {
    const parts = command.trim().split(/\s+/);
    const alias = this.aliases.get(parts[0]);

    if (alias) {
      parts[0] = alias.command;
      return parts.join(' ');
    }

    return command;
  }

  addFilter(filter: OutputFilter): void {
    this.filters.set(filter.id, filter);
    this.saveToStorage();
  }

  getFilter(filterId: string): OutputFilter | undefined {
    return this.filters.get(filterId);
  }

  getAllFilters(): OutputFilter[] {
    return Array.from(this.filters.values());
  }

  removeFilter(filterId: string): boolean {
    return this.filters.delete(filterId);
  }

  getStatistics(): {
    totalSessions: number;
    activeSessions: number;
    totalCommands: number;
    averageCommandsPerSession: number;
    mostUsedCommands: Array<{ command: string; count: number }>;
  } {
    const sessions = this.getAllSessions();
    const activeSessions = sessions.filter((s) => s.status !== 'closed').length;
    const totalCommands = this.globalHistory.length;

    const commandCounts: Record<string, number> = {};
    this.globalHistory.forEach((entry) => {
      const cmd = entry.command.split(' ')[0];
      commandCounts[cmd] = (commandCounts[cmd] || 0) + 1;
    });

    const mostUsedCommands = Object.entries(commandCounts)
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSessions: sessions.length,
      activeSessions,
      totalCommands,
      averageCommandsPerSession: sessions.length > 0 ? totalCommands / sessions.length : 0,
      mostUsedCommands,
    };
  }

  private detectDefaultShell(): TerminalType {
    if (typeof process !== 'undefined') {
      const platform = process.platform;
      if (platform === 'win32') return 'powershell';
      if (platform === 'darwin') return 'zsh';
      return 'bash';
    }
    return 'bash';
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private saveToStorage(): void {
    try {
      const data = {
        sessions: Array.from(this.sessions.entries()),
        globalHistory: this.globalHistory.slice(-this.maxHistorySize),
        themes: Array.from(this.themes.entries()),
        aliases: Array.from(this.aliases.entries()),
        filters: Array.from(this.filters.entries()),
      };
      localStorage.setItem('yyc3_terminal_data', JSON.stringify(data));
    } catch (error) {
      console.warn('保存终端数据失败:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('yyc3_terminal_data');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.sessions) {
          data.sessions.forEach(([id, session]: [string, TerminalSession]) => {
            this.sessions.set(id, session);
          });
        }
        if (data.globalHistory) {
          this.globalHistory = data.globalHistory;
        }
        if (data.themes) {
          data.themes.forEach(([id, theme]: [string, TerminalTheme]) => {
            this.themes.set(id, theme);
          });
        }
        if (data.aliases) {
          data.aliases.forEach(([name, alias]: [string, CommandAlias]) => {
            this.aliases.set(name, alias);
          });
        }
        if (data.filters) {
          data.filters.forEach(([id, filter]: [string, OutputFilter]) => {
            this.filters.set(id, filter);
          });
        }
      }
    } catch (error) {
      console.warn('加载终端数据失败:', error);
    }
  }
}

export const terminalService = new TerminalService();

export default TerminalService;
