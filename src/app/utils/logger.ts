/**
 * @file logger.ts
 * @description YYC³ 结构化日志工具 — 统一替换 console 调用
 * 生产环境自动静默，开发环境保留调试输出
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

const isDev =
  typeof window !== 'undefined'
    ? window.location.hostname === 'localhost'
    : process.env.NODE_ENV === 'development';

function shouldLog(level: LogLevel): boolean {
  if (level === 'error') return true;
  return isDev;
}

function formatArgs(entry: Partial<LogEntry>, ...args: unknown[]): unknown[] {
  const prefix = `[YYC3|${entry.module}] ${entry.message || ''}`;
  const filtered = args.filter((a) => a !== undefined);
  return filtered.length > 0 ? [prefix, ...filtered] : [prefix];
}

function createLogger(module: string) {
  return {
    debug(...args: unknown[]) {
      if (!shouldLog('debug')) return;
      const msg = typeof args[0] === 'string' ? args[0] : '';
      const rest = typeof args[0] === 'string' ? args.slice(1) : args;
      console.debug(...formatArgs({ module, message: msg }, ...rest));
    },
    info(...args: unknown[]) {
      if (!shouldLog('info')) return;
      const msg = typeof args[0] === 'string' ? args[0] : '';
      const rest = typeof args[0] === 'string' ? args.slice(1) : args;
      console.info(...formatArgs({ module, message: msg }, ...rest));
    },
    warn(...args: unknown[]) {
      if (!shouldLog('warn')) return;
      const msg = typeof args[0] === 'string' ? args[0] : '';
      const rest = typeof args[0] === 'string' ? args.slice(1) : args;
      console.warn(...formatArgs({ module, message: msg }, ...rest));
    },
    error(...args: unknown[]) {
      const msg = typeof args[0] === 'string' ? args[0] : '';
      const rest = typeof args[0] === 'string' ? args.slice(1) : args;
      console.error(...formatArgs({ module, message: msg }, ...rest));
    },
  };
}

export { createLogger };
export type { LogEntry, LogLevel };
