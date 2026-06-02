/**
 * @file error-handler.ts
 * @description YYC³ 错误处理框架 - 统一错误分类与智能恢复
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [service],[error-handling],[recovery],[classification]
 *
 * @brief 错误处理框架，实现统一错误分类与智能恢复
 *
 * @details
 * - 统一错误分类
 * - 智能错误恢复
 * - 错误知识库
 * - 错误日志记录
 * - 错误上报机制
 */

export enum ErrorCategory {
  NETWORK = 'network',
  STORAGE = 'storage',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  RUNTIME = 'runtime',
  AI_SERVICE = 'ai_service',
  FILE_SYSTEM = 'file_system',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AppError {
  id: string;
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: number;
  context?: Record<string, unknown>;
  stack?: string;
  recoverable: boolean;
  recoveryOptions?: RecoveryOption[];
  userMessage: string;
  suggestedAction?: string;
}

export interface RecoveryOption {
  id: string;
  label: string;
  action: () => Promise<boolean> | boolean;
  isDefault?: boolean;
}

export interface ErrorLogEntry {
  error: AppError;
  resolved: boolean;
  resolvedAt?: number;
  resolution?: string;
}

export interface ErrorHandlerOptions {
  enableLogging?: boolean;
  enableRecovery?: boolean;
  maxLogSize?: number;
  onUnhandledError?: (error: AppError) => void;
}

const DEFAULT_OPTIONS: Required<ErrorHandlerOptions> = {
  enableLogging: true,
  enableRecovery: true,
  maxLogSize: 100,
  onUnhandledError: (error) => console.error('[ErrorHandler]', error),
};

const ERROR_KNOWLEDGE_BASE: Record<
  string,
  {
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoverable: boolean;
    userMessage: string;
    suggestedAction?: string;
  }
> = {
  NETWORK_ERROR: {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    userMessage: '网络连接失败，请检查网络设置',
    suggestedAction: '请检查网络连接后重试',
  },
  STORAGE_QUOTA_EXCEEDED: {
    category: ErrorCategory.STORAGE,
    severity: ErrorSeverity.HIGH,
    recoverable: true,
    userMessage: '存储空间不足',
    suggestedAction: '请清理旧数据或导出备份后删除',
  },
  VALIDATION_ERROR: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    recoverable: true,
    userMessage: '输入数据验证失败',
    suggestedAction: '请检查输入数据格式',
  },
  AI_API_KEY_INVALID: {
    category: ErrorCategory.AI_SERVICE,
    severity: ErrorSeverity.HIGH,
    recoverable: true,
    userMessage: 'AI服务API密钥无效',
    suggestedAction: '请检查API密钥配置',
  },
  AI_RATE_LIMIT: {
    category: ErrorCategory.AI_SERVICE,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    userMessage: 'AI服务请求频率超限',
    suggestedAction: '请稍后重试',
  },
  FILE_NOT_FOUND: {
    category: ErrorCategory.FILE_SYSTEM,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    userMessage: '文件不存在',
    suggestedAction: '请检查文件路径',
  },
  FILE_TOO_LARGE: {
    category: ErrorCategory.FILE_SYSTEM,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    userMessage: '文件过大',
    suggestedAction: '请选择较小的文件',
  },
  PERMISSION_DENIED: {
    category: ErrorCategory.PERMISSION,
    severity: ErrorSeverity.HIGH,
    recoverable: false,
    userMessage: '权限不足',
    suggestedAction: '请联系管理员',
  },
  UNKNOWN_ERROR: {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    recoverable: false,
    userMessage: '发生未知错误',
    suggestedAction: '请刷新页面或联系支持',
  },
};

class ErrorHandler {
  private options: Required<ErrorHandlerOptions>;
  private errorLog: ErrorLogEntry[] = [];
  private errorIdCounter = 0;
  private recoveryStrategies: Map<string, () => Promise<boolean> | boolean> = new Map();

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.setupGlobalHandlers();
  }

  handle(error: unknown, context?: Record<string, unknown>): AppError {
    const appError = this.normalizeError(error, context);

    if (this.options.enableLogging) {
      this.logError(appError);
    }

    if (this.options.onUnhandledError) {
      this.options.onUnhandledError(appError);
    }

    return appError;
  }

  async attemptRecovery(error: AppError, recoveryId?: string): Promise<boolean> {
    if (!this.options.enableRecovery || !error.recoverable) {
      return false;
    }

    const option = recoveryId
      ? error.recoveryOptions?.find((o) => o.id === recoveryId)
      : error.recoveryOptions?.find((o) => o.isDefault);

    if (!option) {
      return false;
    }

    try {
      const result = await Promise.resolve(option.action());
      if (result) {
        this.markResolved(error.id);
      }
      return result;
    } catch (recoveryError) {
      console.error('[ErrorHandler] Recovery failed:', recoveryError);
      return false;
    }
  }

  registerRecoveryStrategy(errorCode: string, strategy: () => Promise<boolean> | boolean): void {
    this.recoveryStrategies.set(errorCode, strategy);
  }

  getErrorLog(resolved?: boolean): ErrorLogEntry[] {
    if (resolved === undefined) {
      return [...this.errorLog];
    }
    return this.errorLog.filter((entry) => entry.resolved === resolved);
  }

  getUnresolvedErrors(): AppError[] {
    return this.errorLog.filter((e) => !e.resolved).map((e) => e.error);
  }

  markResolved(errorId: string, resolution?: string): boolean {
    const entry = this.errorLog.find((e) => e.error.id === errorId);
    if (entry) {
      entry.resolved = true;
      entry.resolvedAt = Date.now();
      entry.resolution = resolution;
      return true;
    }
    return false;
  }

  clearLog(): void {
    this.errorLog = [];
  }

  createError(
    code: string,
    message: string,
    options?: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      context?: Record<string, unknown>;
      recoverable?: boolean;
      userMessage?: string;
      suggestedAction?: string;
    }
  ): AppError {
    const knowledge = ERROR_KNOWLEDGE_BASE[code] || ERROR_KNOWLEDGE_BASE['UNKNOWN_ERROR'];

    return {
      id: `err-${++this.errorIdCounter}`,
      code,
      message,
      category: options?.category ?? knowledge.category,
      severity: options?.severity ?? knowledge.severity,
      timestamp: Date.now(),
      context: options?.context,
      recoverable: options?.recoverable ?? knowledge.recoverable,
      userMessage: options?.userMessage ?? knowledge.userMessage,
      suggestedAction: options?.suggestedAction ?? knowledge.suggestedAction,
    };
  }

  wrapAsync<T>(fn: () => Promise<T>, context?: Record<string, unknown>): Promise<T | AppError> {
    return fn().catch((error) => this.handle(error, context));
  }

  private normalizeError(error: unknown, context?: Record<string, unknown>): AppError {
    if (this.isAppError(error)) {
      return error;
    }

    let code = 'UNKNOWN_ERROR';
    let message = 'An unknown error occurred';
    let category = ErrorCategory.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;

    if (error instanceof Error) {
      message = error.message;

      if (error.message.includes('network') || error.message.includes('fetch')) {
        code = 'NETWORK_ERROR';
        category = ErrorCategory.NETWORK;
      } else if (error.message.includes('storage') || error.message.includes('quota')) {
        code = 'STORAGE_QUOTA_EXCEEDED';
        category = ErrorCategory.STORAGE;
        severity = ErrorSeverity.HIGH;
      } else if (error.message.includes('validation') || error.message.includes('invalid')) {
        code = 'VALIDATION_ERROR';
        category = ErrorCategory.VALIDATION;
        severity = ErrorSeverity.LOW;
      } else if (error.message.includes('API key') || error.message.includes('api_key')) {
        code = 'AI_API_KEY_INVALID';
        category = ErrorCategory.AI_SERVICE;
        severity = ErrorSeverity.HIGH;
      } else if (error.message.includes('rate limit')) {
        code = 'AI_RATE_LIMIT';
        category = ErrorCategory.AI_SERVICE;
      } else if (error.message.includes('file not found') || error.message.includes('ENOENT')) {
        code = 'FILE_NOT_FOUND';
        category = ErrorCategory.FILE_SYSTEM;
      } else if (error.message.includes('too large')) {
        code = 'FILE_TOO_LARGE';
        category = ErrorCategory.FILE_SYSTEM;
      } else if (error.message.includes('permission') || error.message.includes('denied')) {
        code = 'PERMISSION_DENIED';
        category = ErrorCategory.PERMISSION;
        severity = ErrorSeverity.HIGH;
      }
    }

    const knowledge = ERROR_KNOWLEDGE_BASE[code] || ERROR_KNOWLEDGE_BASE['UNKNOWN_ERROR'];
    const recoveryOptions = this.getRecoveryOptions(code);

    return {
      id: `err-${++this.errorIdCounter}`,
      code,
      message,
      category,
      severity,
      timestamp: Date.now(),
      context,
      stack: error instanceof Error ? error.stack : undefined,
      recoverable: knowledge.recoverable,
      recoveryOptions,
      userMessage: knowledge.userMessage,
      suggestedAction: knowledge.suggestedAction,
    };
  }

  private getRecoveryOptions(code: string): RecoveryOption[] {
    const options: RecoveryOption[] = [];
    const strategy = this.recoveryStrategies.get(code);

    if (strategy) {
      options.push({
        id: 'auto-retry',
        label: '自动重试',
        action: strategy,
        isDefault: true,
      });
    }

    switch (code) {
      case 'NETWORK_ERROR':
        options.push({
          id: 'retry',
          label: '重试',
          action: () => true,
          isDefault: !strategy,
        });
        break;

      case 'STORAGE_QUOTA_EXCEEDED':
        options.push({
          id: 'cleanup',
          label: '清理旧数据',
          action: () => true,
        });
        break;

      case 'AI_API_KEY_INVALID':
        options.push({
          id: 'configure',
          label: '配置API密钥',
          action: () => true,
        });
        break;
    }

    return options;
  }

  private logError(error: AppError): void {
    this.errorLog.push({
      error,
      resolved: false,
    });

    if (this.errorLog.length > this.options.maxLogSize) {
      this.errorLog.shift();
    }
  }

  private isAppError(error: unknown): error is AppError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'id' in error &&
      'code' in error &&
      'category' in error &&
      'severity' in error
    );
  }

  private setupGlobalHandlers(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handle(event.error, { type: 'global', filename: event.filename });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handle(event.reason, { type: 'unhandledrejection' });
      });
    }
  }
}

export const errorHandler = new ErrorHandler({
  enableLogging: true,
  enableRecovery: true,
  maxLogSize: 100,
});

export function handleError(error: unknown, context?: Record<string, unknown>): AppError {
  return errorHandler.handle(error, context);
}

export function createError(
  code: string,
  message: string,
  options?: Parameters<ErrorHandler['createError']>[2]
): AppError {
  return errorHandler.createError(code, message, options);
}

export function wrapAsync<T>(
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T | AppError> {
  return errorHandler.wrapAsync(fn, context);
}

export default ErrorHandler;
