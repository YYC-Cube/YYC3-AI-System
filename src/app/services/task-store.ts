/**
 * @file task-store.ts
 * @description YYC³便携式智能AI系统 - 任务看板Zustand存储
 * Task Board Zustand Store
 * Persistent task management state with Kanban board, subtasks, reminders,
 * AI inference tracking, and batch operations.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags store,task-board,kanban,zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ──

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskType = 'feature' | 'bug' | 'refactor' | 'test' | 'documentation' | 'other';
export type ReminderType = 'deadline' | 'dependency' | 'blocking' | 'progress' | 'custom';

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  createdAt: number;
  updatedAt: number;
  dueDate?: number;
  estimatedHours?: number;
  actualHours?: number;
  relatedMessageId?: string;
  relatedFiles?: string[];
  tags?: string[];
  subtasks?: SubTask[];
  dependencies?: string[];
  blocking?: string[];
  assigneeId?: string;
  isArchived: boolean;
  source: 'manual' | 'ai-inferred' | 'imported' | 'code-comment';
  confidence?: number;
  metadata?: {
    lineNumber?: number;
    filePath?: string;
  };
}

export interface Reminder {
  id: string;
  taskId: string;
  type: ReminderType;
  message: string;
  remindAt: number;
  isTriggered: boolean;
  isRead: boolean;
  createdAt: number;
}

export type TaskSortBy = 'priority' | 'dueDate' | 'createdAt' | 'updatedAt' | 'title';

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  tags?: string[];
  search?: string;
  showArchived?: boolean;
}

// ── Store Interface ──

interface TaskState {
  tasks: Task[];
  reminders: Reminder[];
  filter: TaskFilter;
  sortBy: TaskSortBy;
  sortOrder: 'asc' | 'desc';
  selectedTaskIds: string[];
  viewMode: 'kanban' | 'list' | 'timeline';
  /** Undo/redo stack for date changes (timeline drag) */
  dateUndoStack: DateChangeRecord[];
  dateRedoStack: DateChangeRecord[];
}

/** Records a single date field change for undo/redo */
export interface DateChangeRecord {
  taskId: string;
  field: 'dueDate' | 'createdAt';
  oldValue: number | undefined;
  newValue: number | undefined;
  timestamp: number;
}

interface TaskActions {
  addTask: (
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'> & { source?: Task['source'] }
  ) => string;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  archiveTask: (taskId: string) => void;
  unarchiveTask: (taskId: string) => void;
  duplicateTask: (taskId: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;

  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'isTriggered' | 'isRead'>) => void;
  markReminderRead: (reminderId: string) => void;
  markAllTriggeredRemindersRead: () => void;
  deleteReminder: (reminderId: string) => void;

  setFilter: (filter: Partial<TaskFilter>) => void;
  clearFilter: () => void;
  setSortBy: (sortBy: TaskSortBy) => void;
  toggleSortOrder: () => void;

  selectTask: (taskId: string) => void;
  deselectTask: (taskId: string) => void;
  clearSelection: () => void;
  toggleTaskSelection: (taskId: string) => void;

  batchUpdateStatus: (taskIds: string[], status: TaskStatus) => void;
  batchDelete: (taskIds: string[]) => void;
  batchArchive: (taskIds: string[]) => void;
  batchSetPriority: (taskIds: string[], priority: TaskPriority) => void;

  setViewMode: (mode: TaskState['viewMode']) => void;

  /** Push a date change record for undo support */
  pushDateChange: (record: Omit<DateChangeRecord, 'timestamp'>) => void;
  /** Undo the last date change */
  undoDateChange: () => void;
  /** Redo the last undone date change */
  redoDateChange: () => void;

  getFilteredTasks: () => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTaskStats: () => {
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    done: number;
    blocked: number;
    overdue: number;
  };
}

// ── Priority Order ──
const PRIORITY_ORDER: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

// ── Default Sample Tasks ──
const now = Date.now();
const sampleTasks: Task[] = [
  {
    id: 'task-sample-1',
    title: '完善 AI 代码生成服务闭环',
    description: '确保 buildSystemPromptWithRules() 正确接入 ChatInterface 的 AI 请求流程',
    status: 'done',
    priority: 'high',
    type: 'feature',
    createdAt: now - 86400000 * 3,
    updatedAt: now - 86400000,
    isArchived: false,
    source: 'manual',
    tags: ['ai', 'core'],
    relatedFiles: ['ChatInterface.tsx', 'settings-integration.ts'],
    subtasks: [
      {
        id: 'st-1',
        title: '集成 system prompt rules',
        isCompleted: true,
        createdAt: now - 86400000 * 2,
      },
      { id: 'st-2', title: '端到端测试', isCompleted: true, createdAt: now - 86400000 },
    ],
  },
  {
    id: 'task-sample-2',
    title: '升级 validateApiKey 为真实端点探测',
    description: '将 API 密钥验证从模拟改为调用 /models endpoint',
    status: 'done',
    priority: 'high',
    type: 'feature',
    createdAt: now - 86400000 * 2,
    updatedAt: now - 3600000 * 6,
    isArchived: false,
    source: 'manual',
    tags: ['ai', 'settings'],
    relatedFiles: ['SettingsPage.tsx'],
  },
  {
    id: 'task-sample-3',
    title: '自定义快捷键编辑器 UI',
    description: '扩展 Custom 方案：按键录制、冲突检测、重置功能',
    status: 'in-progress',
    priority: 'medium',
    type: 'feature',
    createdAt: now - 86400000,
    updatedAt: now - 3600000,
    isArchived: false,
    source: 'manual',
    tags: ['settings', 'ux'],
    estimatedHours: 4,
    dependencies: ['task-sample-1'],
    subtasks: [
      { id: 'st-3', title: '按键录制组件', isCompleted: true, createdAt: now - 86400000 },
      { id: 'st-4', title: '冲突检测逻辑', isCompleted: true, createdAt: now - 86400000 },
      { id: 'st-5', title: '重置功能', isCompleted: false, createdAt: now - 3600000 * 6 },
    ],
  },
  {
    id: 'task-sample-4',
    title: '全局深度审核 — TypeScript & ESLint',
    description: '排查 50+ 组件文件的类型问题、ESLint 违规、Console 警告',
    status: 'in-progress',
    priority: 'critical',
    type: 'refactor',
    createdAt: now - 3600000 * 12,
    updatedAt: now - 1800000,
    isArchived: false,
    source: 'manual',
    tags: ['audit', 'quality'],
    estimatedHours: 8,
  },
  {
    id: 'task-sample-5',
    title: 'P1 AI Quick Actions 面板',
    description: '实现代码/文档/文本/AI 一键操作 + 剪贴板历史',
    status: 'done',
    priority: 'high',
    type: 'feature',
    createdAt: now - 3600000 * 6,
    updatedAt: now - 1800000,
    isArchived: false,
    source: 'manual',
    tags: ['p1', 'ai', 'quick-actions'],
    relatedFiles: ['QuickActionsPanel.tsx', 'quick-actions.ts'],
  },
  {
    id: 'task-sample-6',
    title: 'P1 AI 任务看板交互',
    description: '实现智能任务推理、Kanban 面板、提醒系统、AI 集成',
    status: 'in-progress',
    priority: 'high',
    type: 'feature',
    createdAt: now - 3600000,
    updatedAt: now,
    isArchived: false,
    source: 'manual',
    tags: ['p1', 'task-board', 'kanban'],
    dependencies: ['task-sample-5', 'task-sample-4'],
  },
  {
    id: 'task-sample-7',
    title: '添加 @file JSDoc 头注释到所有组件',
    description: '确保 50+ 组件文件符合 YYC3 Code Header 规范',
    status: 'todo',
    priority: 'medium',
    type: 'documentation',
    createdAt: now - 3600000 * 2,
    updatedAt: now - 3600000 * 2,
    isArchived: false,
    source: 'ai-inferred',
    confidence: 0.85,
    tags: ['audit', 'documentation'],
  },
  {
    id: 'task-sample-8',
    title: '清理死代码和未使用导入',
    description: '移除已确认的未使用变量、导入和函数',
    status: 'todo',
    priority: 'low',
    type: 'refactor',
    createdAt: now - 7200000,
    updatedAt: now - 7200000,
    isArchived: false,
    source: 'ai-inferred',
    confidence: 0.9,
    tags: ['audit', 'cleanup'],
    dependencies: ['task-sample-7'],
  },
];

// Export sample tasks for testing and initialization
export { sampleTasks };

// ── Store ──

export const useTaskStore = create<TaskState & TaskActions>()(
  persist(
    (set, get) => ({
      tasks: sampleTasks,
      reminders: [],
      filter: {},
      sortBy: 'priority',
      sortOrder: 'asc',
      selectedTaskIds: [],
      viewMode: 'kanban',
      dateUndoStack: [],
      dateRedoStack: [],

      addTask: (taskInput) => {
        const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const newTask: Task = {
          ...taskInput,
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isArchived: false,
          source: taskInput.source || 'manual',
        };
        set((s) => ({ tasks: [...s.tasks, newTask] }));
        return id;
      },

      updateTask: (taskId, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates, updatedAt: Date.now() } : t
          ),
        })),

      deleteTask: (taskId) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== taskId),
          reminders: s.reminders.filter((r) => r.taskId !== taskId),
          selectedTaskIds: s.selectedTaskIds.filter((id) => id !== taskId),
        })),

      archiveTask: (taskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, isArchived: true, updatedAt: Date.now() } : t
          ),
        })),

      unarchiveTask: (taskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, isArchived: false, updatedAt: Date.now() } : t
          ),
        })),

      duplicateTask: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;
        get().addTask({
          ...task,
          title: `${task.title} (副本)`,
          status: 'todo',
          subtasks: task.subtasks?.map((st) => ({
            ...st,
            id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            isCompleted: false,
          })),
        });
      },

      moveTask: (taskId, newStatus) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, status: newStatus, updatedAt: Date.now() } : t
          ),
        })),

      addSubtask: (taskId, title) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: [
                    ...(t.subtasks || []),
                    {
                      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                      title,
                      isCompleted: false,
                      createdAt: Date.now(),
                    },
                  ],
                  updatedAt: Date.now(),
                }
              : t
          ),
        })),

      toggleSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks?.map((st) =>
                    st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
                  ),
                  updatedAt: Date.now(),
                }
              : t
          ),
        })),

      deleteSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks?.filter((st) => st.id !== subtaskId),
                  updatedAt: Date.now(),
                }
              : t
          ),
        })),

      addReminder: (reminder) =>
        set((s) => ({
          reminders: [
            ...s.reminders,
            {
              ...reminder,
              id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              createdAt: Date.now(),
              isTriggered: false,
              isRead: false,
            },
          ],
        })),

      markReminderRead: (reminderId) =>
        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === reminderId ? { ...r, isRead: true, isTriggered: true } : r
          ),
        })),

      markAllTriggeredRemindersRead: () =>
        set((s) => ({
          reminders: s.reminders.map((r) => (r.isTriggered ? { ...r, isRead: true } : r)),
        })),

      deleteReminder: (reminderId) =>
        set((s) => ({ reminders: s.reminders.filter((r) => r.id !== reminderId) })),

      setFilter: (filter) => set((s) => ({ filter: { ...s.filter, ...filter } })),
      clearFilter: () => set({ filter: {} }),
      setSortBy: (sortBy) => set({ sortBy }),
      toggleSortOrder: () => set((s) => ({ sortOrder: s.sortOrder === 'asc' ? 'desc' : 'asc' })),

      selectTask: (taskId) =>
        set((s) => ({
          selectedTaskIds: s.selectedTaskIds.includes(taskId)
            ? s.selectedTaskIds
            : [...s.selectedTaskIds, taskId],
        })),
      deselectTask: (taskId) =>
        set((s) => ({ selectedTaskIds: s.selectedTaskIds.filter((id) => id !== taskId) })),
      clearSelection: () => set({ selectedTaskIds: [] }),
      toggleTaskSelection: (taskId) =>
        set((s) => ({
          selectedTaskIds: s.selectedTaskIds.includes(taskId)
            ? s.selectedTaskIds.filter((id) => id !== taskId)
            : [...s.selectedTaskIds, taskId],
        })),

      batchUpdateStatus: (taskIds, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            taskIds.includes(t.id) ? { ...t, status, updatedAt: Date.now() } : t
          ),
        })),

      batchDelete: (taskIds) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => !taskIds.includes(t.id)),
          reminders: s.reminders.filter((r) => !taskIds.includes(r.taskId)),
          selectedTaskIds: s.selectedTaskIds.filter((id) => !taskIds.includes(id)),
        })),

      batchArchive: (taskIds) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            taskIds.includes(t.id) ? { ...t, isArchived: true, updatedAt: Date.now() } : t
          ),
        })),

      batchSetPriority: (taskIds, priority) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            taskIds.includes(t.id) ? { ...t, priority, updatedAt: Date.now() } : t
          ),
        })),

      setViewMode: (mode) => set({ viewMode: mode }),

      /** Push a date change record for undo support */
      pushDateChange: (record) =>
        set((s) => ({
          dateUndoStack: [...s.dateUndoStack, { ...record, timestamp: Date.now() }],
          dateRedoStack: [],
        })),

      /** Undo the last date change */
      undoDateChange: () =>
        set((s) => {
          const lastRecord = s.dateUndoStack.pop();
          if (!lastRecord) return s;
          const { taskId, field, oldValue } = lastRecord;
          const task = s.tasks.find((t) => t.id === taskId);
          if (!task) return s;
          const updatedTask = { ...task, [field]: oldValue };
          return {
            tasks: s.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
            dateRedoStack: [...s.dateRedoStack, lastRecord],
          };
        }),

      /** Redo the last undone date change */
      redoDateChange: () =>
        set((s) => {
          const lastRecord = s.dateRedoStack.pop();
          if (!lastRecord) return s;
          const { taskId, field, newValue } = lastRecord;
          const task = s.tasks.find((t) => t.id === taskId);
          if (!task) return s;
          const updatedTask = { ...task, [field]: newValue };
          return {
            tasks: s.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
            dateUndoStack: [...s.dateUndoStack, lastRecord],
          };
        }),

      getFilteredTasks: () => {
        const { tasks, filter, sortBy, sortOrder } = get();
        let filtered = tasks.filter((t) => !t.isArchived || filter.showArchived);
        if (filter.status) filtered = filtered.filter((t) => t.status === filter.status);
        if (filter.priority) filtered = filtered.filter((t) => t.priority === filter.priority);
        if (filter.type) filtered = filtered.filter((t) => t.type === filter.type);
        if (filter.tags?.length)
          filtered = filtered.filter((t) => filter.tags!.some((tag) => t.tags?.includes(tag)));
        if (filter.search) {
          const q = filter.search.toLowerCase();
          filtered = filtered.filter(
            (t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
          );
        }

        filtered.sort((a, b) => {
          let cmp = 0;
          switch (sortBy) {
            case 'priority':
              cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
              break;
            case 'dueDate':
              cmp = (a.dueDate || Infinity) - (b.dueDate || Infinity);
              break;
            case 'createdAt':
              cmp = a.createdAt - b.createdAt;
              break;
            case 'updatedAt':
              cmp = a.updatedAt - b.updatedAt;
              break;
            case 'title':
              cmp = a.title.localeCompare(b.title);
              break;
          }
          return sortOrder === 'asc' ? cmp : -cmp;
        });
        return filtered;
      },

      getTasksByStatus: (status) =>
        get()
          .getFilteredTasks()
          .filter((t) => t.status === status),

      getTaskStats: () => {
        const tasks = get().tasks.filter((t) => !t.isArchived);
        const now = Date.now();
        return {
          total: tasks.length,
          todo: tasks.filter((t) => t.status === 'todo').length,
          inProgress: tasks.filter((t) => t.status === 'in-progress').length,
          review: tasks.filter((t) => t.status === 'review').length,
          done: tasks.filter((t) => t.status === 'done').length,
          blocked: tasks.filter((t) => t.status === 'blocked').length,
          overdue: tasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== 'done').length,
        };
      },
    }),
    {
      name: 'yyc3-task-board',
      partialize: (state) => ({
        tasks: state.tasks,
        reminders: state.reminders,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        viewMode: state.viewMode,
      }),
    }
  )
);
