/**
 * @file undo-redo-service.ts
 * @description YYC³ 撤销/重做服务 - 状态历史管理与回溯
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [service],[undo],[redo],[history],[state-management]
 *
 * @brief 撤销/重做服务，实现状态历史管理与回溯
 *
 * @details
 * - 状态快照管理
 * - 撤销/重做栈
 * - 批量操作合并
 * - 历史记录持久化
 * - 内存优化策略
 */

export interface HistoryEntry<T> {
  id: string;
  timestamp: number;
  state: T;
  action: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface UndoRedoOptions {
  maxHistorySize?: number;
  enablePersistence?: boolean;
  persistenceKey?: string;
  debounceMs?: number;
  groupSimilarActions?: boolean;
}

export interface UndoRedoState<_T = unknown> {
  canUndo: boolean;
  canRedo: boolean;
  historySize: number;
  currentIndex: number;
  currentAction?: string;
}

const DEFAULT_OPTIONS: Required<UndoRedoOptions> = {
  maxHistorySize: 50,
  enablePersistence: true,
  persistenceKey: 'yyc3_undo_redo_history',
  debounceMs: 300,
  groupSimilarActions: true,
};

class UndoRedoService<T> {
  private undoStack: HistoryEntry<T>[] = [];
  private redoStack: HistoryEntry<T>[] = [];
  private options: Required<UndoRedoOptions>;
  private currentState: T | null = null;
  private lastActionTime = 0;
  private pendingSnapshot: NodeJS.Timeout | null = null;
  private listeners: Set<(state: UndoRedoState<T>) => void> = new Set();

  constructor(options: UndoRedoOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    if (this.options.enablePersistence) {
      this.loadFromPersistence();
    }
  }

  push(state: T, action: string, description?: string, metadata?: Record<string, unknown>): void {
    const now = Date.now();
    const shouldGroup =
      this.options.groupSimilarActions &&
      this.undoStack.length > 0 &&
      now - this.lastActionTime < this.options.debounceMs &&
      this.undoStack[this.undoStack.length - 1].action === action;

    if (shouldGroup) {
      this.undoStack[this.undoStack.length - 1] = {
        id: this.generateId(),
        timestamp: now,
        state,
        action,
        description,
        metadata,
      };
    } else {
      const entry: HistoryEntry<T> = {
        id: this.generateId(),
        timestamp: now,
        state,
        action,
        description,
        metadata,
      };

      this.undoStack.push(entry);
      this.lastActionTime = now;

      if (this.undoStack.length > this.options.maxHistorySize) {
        this.undoStack.shift();
      }
    }

    this.redoStack = [];
    this.currentState = state;
    this.notifyListeners();
    this.saveToPersistence();
  }

  pushDebounced(
    state: T,
    action: string,
    description?: string,
    metadata?: Record<string, unknown>
  ): void {
    if (this.pendingSnapshot) {
      clearTimeout(this.pendingSnapshot);
    }

    this.pendingSnapshot = setTimeout(() => {
      this.push(state, action, description, metadata);
      this.pendingSnapshot = null;
    }, this.options.debounceMs);
  }

  undo(): T | null {
    if (!this.canUndo()) return null;

    const entry = this.undoStack.pop()!;

    // Save current state to redo stack for redo capability
    if (this.currentState !== null) {
      this.redoStack.push({
        id: this.generateId(),
        timestamp: Date.now(),
        state: this.currentState,
        action: entry.action,
        description: entry.description,
        metadata: entry.metadata,
      });
    }

    // Restore to the previous state (entry before the popped one, or null)
    const restoredState =
      this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1].state : null;

    this.currentState = restoredState;
    this.notifyListeners();
    this.saveToPersistence();

    return restoredState;
  }

  redo(): T | null {
    if (!this.canRedo()) return null;

    const entry = this.redoStack.pop()!;
    if (this.currentState !== null) {
      this.undoStack.push({
        id: this.generateId(),
        timestamp: Date.now(),
        state: this.currentState,
        action: entry.action,
        description: entry.description,
        metadata: entry.metadata,
      });
    }

    this.currentState = entry.state;
    this.notifyListeners();
    this.saveToPersistence();

    return entry.state;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getCurrentState(): T | null {
    return this.currentState;
  }

  getHistory(): HistoryEntry<T>[] {
    return [...this.undoStack];
  }

  getRedoHistory(): HistoryEntry<T>[] {
    return [...this.redoStack];
  }

  getState(): UndoRedoState<T> {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      historySize: this.undoStack.length,
      currentIndex: this.undoStack.length - 1,
      currentAction: this.undoStack[this.undoStack.length - 1]?.action,
    };
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.currentState = null;
    this.notifyListeners();
    this.clearPersistence();
  }

  jumpTo(index: number): T | null {
    if (index < 0 || index >= this.undoStack.length) return null;

    const targetEntry = this.undoStack[index];
    const entriesToMove = this.undoStack.splice(index + 1);

    for (const entry of entriesToMove.reverse()) {
      this.redoStack.push(entry);
    }

    this.currentState = targetEntry.state;
    this.notifyListeners();
    this.saveToPersistence();

    return targetEntry.state;
  }

  getEntryAt(index: number): HistoryEntry<T> | null {
    if (index < 0 || index >= this.undoStack.length) return null;
    return this.undoStack[index];
  }

  searchHistory(query: string): HistoryEntry<T>[] {
    const lowerQuery = query.toLowerCase();
    return this.undoStack.filter(
      (entry) =>
        entry.action.toLowerCase().includes(lowerQuery) ||
        entry.description?.toLowerCase().includes(lowerQuery)
    );
  }

  subscribe(listener: (state: UndoRedoState<T>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  exportHistory(): string {
    return JSON.stringify({
      undoStack: this.undoStack,
      redoStack: this.redoStack,
      currentState: this.currentState,
      exportedAt: Date.now(),
    });
  }

  importHistory(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (data.undoStack && Array.isArray(data.undoStack)) {
        this.undoStack = data.undoStack;
      }
      if (data.redoStack && Array.isArray(data.redoStack)) {
        this.redoStack = data.redoStack;
      }
      if (data.currentState) {
        this.currentState = data.currentState;
      }
      this.notifyListeners();
      return true;
    } catch {
      console.error('导入历史记录失败');
      return false;
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  private saveToPersistence(): void {
    if (!this.options.enablePersistence) return;

    try {
      const data = this.exportHistory();
      localStorage.setItem(this.options.persistenceKey, data);
    } catch (error) {
      console.warn('保存历史记录失败:', error);
    }
  }

  private loadFromPersistence(): void {
    if (!this.options.enablePersistence) return;

    try {
      const data = localStorage.getItem(this.options.persistenceKey);
      if (data) {
        this.importHistory(data);
      }
    } catch (error) {
      console.warn('加载历史记录失败:', error);
    }
  }

  private clearPersistence(): void {
    if (!this.options.enablePersistence) return;

    try {
      localStorage.removeItem(this.options.persistenceKey);
    } catch (error) {
      console.warn('清除历史记录失败:', error);
    }
  }
}

export function createUndoRedoService<T>(options?: UndoRedoOptions): UndoRedoService<T> {
  return new UndoRedoService<T>(options);
}

export const globalUndoRedoService = createUndoRedoService<Record<string, unknown>>({
  maxHistorySize: 100,
  enablePersistence: true,
});

export default UndoRedoService;
