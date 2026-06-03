/**
 * @file TaskBoard.tsx
 * @description YYC³便携式智能AI系统 - AI任务看板面板(液态玻璃看板)
 * AI Task Board Panel (Liquid Glass Kanban)
 * Kanban-style task management with AI inference, drag status transitions,
 * subtasks, reminders, batch ops, and full i18n 4-language support.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,task-board,kanban,ai
 */

import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Ban,
  Bot,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Circle,
  Copy,
  Download,
  Eye,
  FileText,
  GanttChart,
  GitBranch,
  LayoutGrid,
  Link,
  Link2,
  List,
  Loader2,
  Pencil,
  Plus,
  Redo2,
  Save,
  Search,
  Sparkles,
  Square,
  Tag,
  Timer,
  Trash2,
  TrendingDown,
  Undo2,
  X,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { toast } from 'sonner';

import {
  useTaskStore,
  type Task,
  type TaskPriority,
  type TaskSortBy,
  type TaskStatus,
  type TaskType,
} from '../services/task-store';
import { useAppStore } from '../store';
import { getI18n, type I18nStrings } from '../utils/i18n';
import { getThemeTokens, type ThemeTokens } from '../utils/theme';

import {
  PRIORITY_CONFIG,
  STATUS_COLUMNS,
  TASK_DND_TYPE,
  TYPE_CONFIG,
  priorityLabel,
  statusLabel,
  typeLabel,
} from './task-board-utils';

// ── Status Icon ──
function StatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case 'todo':
      return <Circle className="w-3.5 h-3.5 text-slate-400" />;
    case 'in-progress':
      return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
    case 'review':
      return <Eye className="w-3.5 h-3.5 text-amber-400" />;
    case 'done':
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    case 'blocked':
      return <Ban className="w-3.5 h-3.5 text-red-400" />;
  }
}

// ── Main Panel ──

export function TaskBoard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, language } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const {
    viewMode,
    setViewMode,
    filter,
    setFilter,
    clearFilter,
    sortBy,
    setSortBy,
    sortOrder,
    toggleSortOrder,
    selectedTaskIds,
    clearSelection,
    batchUpdateStatus,
    batchDelete,
    batchArchive,
    getFilteredTasks,
    getTaskStats,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    duplicateTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    toggleTaskSelection,
  } = useTaskStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [addTitle, setAddTitle] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addPriority, setAddPriority] = useState<TaskPriority>('medium');
  const [addType, setAddType] = useState<TaskType>('feature');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const filteredTasks = useMemo(
    () => getFilteredTasks(),
    [getFilteredTasks, filter, sortBy, sortOrder, useTaskStore((s) => s.tasks)]
  );
  const stats = useMemo(() => getTaskStats(), [useTaskStore((s) => s.tasks)]);

  const handleAddTask = useCallback(() => {
    if (!addTitle.trim()) return;
    addTask({
      title: addTitle.trim(),
      description: addDesc.trim() || undefined,
      status: 'todo',
      priority: addPriority,
      type: addType,
      source: 'manual',
    });
    setAddTitle('');
    setAddDesc('');
    setAddPriority('medium');
    setAddType('feature');
    setShowAddForm(false);
    toast.success(i.tbTaskAdded || 'Task added!');
  }, [addTitle, addDesc, addPriority, addType, addTask, i]);

  const handleQuickMove = useCallback(
    (taskId: string, targetStatus: TaskStatus) => {
      moveTask(taskId, targetStatus);
      toast.success(`→ ${statusLabel(targetStatus, i)}`);
    },
    [moveTask, i]
  );

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[960px] max-w-[95vw] max-h-[88vh] rounded-2xl overflow-hidden border flex flex-col ${
              t.isDark
                ? 'bg-slate-900/95 border-white/10 shadow-2xl shadow-black/40'
                : 'bg-white/95 border-slate-200 shadow-2xl shadow-slate-300/30'
            } backdrop-blur-xl`}
          >
            {/* ── Header ── */}
            <div
              className={`flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0 ${t.isDark ? 'border-white/8' : 'border-slate-200/60'}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg ${t.isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}
                >
                  <CheckSquare
                    className={`w-4.5 h-4.5 ${t.isDark ? 'text-indigo-400' : 'text-indigo-600'}`}
                  />
                </div>
                <div>
                  <h2
                    className={`text-[15px] ${t.isDark ? 'text-white' : 'text-slate-900'}`}
                    style={{ fontWeight: 600 }}
                  >
                    {i.tbTitle || 'AI Task Board'}
                  </h2>
                  <p className={`text-[11px] ${t.text.muted}`}>
                    {i.tbSubtitle || 'Intelligent task tracking & Kanban management'}
                  </p>
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-2">
                {[
                  {
                    label: stats.total,
                    color: t.isDark
                      ? 'bg-slate-700/50 text-slate-300'
                      : 'bg-slate-100 text-slate-600',
                    tip: 'Total',
                  },
                  {
                    label: stats.inProgress,
                    color: t.isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-600',
                    tip: 'In Progress',
                  },
                  {
                    label: stats.done,
                    color: t.isDark
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-emerald-50 text-emerald-600',
                    tip: 'Done',
                  },
                  ...(stats.overdue > 0
                    ? [
                        {
                          label: stats.overdue,
                          color: t.isDark ? 'bg-red-500/15 text-red-300' : 'bg-red-50 text-red-600',
                          tip: 'Overdue',
                        },
                      ]
                    : []),
                ].map((b, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-md text-[10px] ${b.color}`}
                    style={{ fontWeight: 600 }}
                    title={b.tip}
                  >
                    {b.label}
                  </span>
                ))}
                <button onClick={onClose} className={`p-1.5 rounded-lg ${t.interactive.iconBtn}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Toolbar ── */}
            <div
              className={`flex items-center gap-2 px-5 py-2.5 border-b flex-shrink-0 ${t.isDark ? 'border-white/5' : 'border-slate-100'}`}
            >
              {/* Search */}
              <div className="relative flex-1 max-w-52">
                <Search
                  className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 ${t.text.muted}`}
                />
                <input
                  type="text"
                  value={filter.search || ''}
                  onChange={(e) => setFilter({ search: e.target.value || undefined })}
                  placeholder={i.tbSearch || 'Search tasks...'}
                  className={`w-full pl-7 pr-3 py-1.5 rounded-lg text-[11px] outline-none ${
                    t.isDark
                      ? 'bg-white/5 text-slate-200 placeholder-slate-500 border border-white/8'
                      : 'bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200'
                  }`}
                />
              </div>

              {/* Priority filter */}
              <select
                value={filter.priority || ''}
                onChange={(e) =>
                  setFilter({ priority: (e.target.value || undefined) as TaskPriority | undefined })
                }
                className={`text-[11px] px-2 py-1.5 rounded-lg outline-none ${t.isDark ? 'bg-white/5 text-slate-200 border border-white/8' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}
              >
                <option value="">{i.tbAllPriority || 'All Priority'}</option>
                {(['critical', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {priorityLabel(p, i)}
                  </option>
                ))}
              </select>

              {/* Type filter */}
              <select
                value={filter.type || ''}
                onChange={(e) =>
                  setFilter({ type: (e.target.value || undefined) as TaskType | undefined })
                }
                className={`text-[11px] px-2 py-1.5 rounded-lg outline-none ${t.isDark ? 'bg-white/5 text-slate-200 border border-white/8' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}
              >
                <option value="">{i.tbAllType || 'All Type'}</option>
                {(
                  ['feature', 'bug', 'refactor', 'test', 'documentation', 'other'] as TaskType[]
                ).map((tp) => (
                  <option key={tp} value={tp}>
                    {typeLabel(tp, i)}
                  </option>
                ))}
              </select>

              {filter.search || filter.priority || filter.type ? (
                <button
                  onClick={clearFilter}
                  className={`text-[10px] px-2 py-1 rounded-md ${t.isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}
                >
                  {i.tbClearFilter || 'Clear'}
                </button>
              ) : null}

              <div className="flex-1" />

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as TaskSortBy)}
                className={`text-[11px] px-2 py-1.5 rounded-lg outline-none ${t.isDark ? 'bg-white/5 text-slate-200 border border-white/8' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}
              >
                <option value="priority">{i.tbSortPriority || 'Priority'}</option>
                <option value="dueDate">{i.tbSortDue || 'Due Date'}</option>
                <option value="createdAt">{i.tbSortCreated || 'Created'}</option>
                <option value="updatedAt">{i.tbSortUpdated || 'Updated'}</option>
                <option value="title">{i.tbSortTitle || 'Title'}</option>
              </select>
              <button
                onClick={toggleSortOrder}
                className={`p-1.5 rounded-lg ${t.interactive.iconBtn}`}
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? (
                  <ArrowUp className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5" />
                )}
              </button>

              {/* View mode */}
              <div
                className={`flex rounded-lg overflow-hidden border ${t.isDark ? 'border-white/8' : 'border-slate-200'}`}
              >
                {[
                  { mode: 'kanban' as const, icon: LayoutGrid },
                  { mode: 'list' as const, icon: List },
                  { mode: 'timeline' as const, icon: GanttChart },
                ].map((v) => (
                  <button
                    key={v.mode}
                    onClick={() => setViewMode(v.mode)}
                    className={`p-1.5 ${
                      viewMode === v.mode
                        ? t.isDark
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-indigo-50 text-indigo-600'
                        : t.isDark
                          ? 'text-slate-400 hover:bg-white/5'
                          : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <v.icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>

              {/* Add Task */}
              <button
                onClick={() => setShowAddForm(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] ${
                  t.isDark
                    ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
                style={{ fontWeight: 600 }}
              >
                <Plus className="w-3.5 h-3.5" />
                {i.tbAddTask || 'Add Task'}
              </button>

              {/* AI Infer Tasks from Chat */}
              <button
                onClick={async () => {
                  try {
                    const { taskInferenceEngine } = await import('../services/task-inference');
                    // Grab last 10 chat messages from app store (if available)
                    const appState = useAppStore.getState();
                    const messages = appState.messages || [];
                    const lastMessages = messages
                      .slice(-10)
                      .map((m) => ({ role: m.role || 'user', content: m.content || '' }));
                    if (lastMessages.length === 0) {
                      toast.info(i.tbNoChat || 'No chat messages to analyze');
                      return;
                    }
                    const inferred = taskInferenceEngine.inferTasksFromConversation(lastMessages);
                    if (inferred.length === 0) {
                      toast.info(i.tbNoInferred || 'No tasks inferred from recent chat');
                      return;
                    }
                    let count = 0;
                    for (const inf of inferred) {
                      addTask({
                        title: inf.task.title,
                        description: inf.task.description,
                        status: 'todo',
                        priority: inf.task.priority || 'medium',
                        type: inf.task.type || 'feature',
                        source: 'ai-inferred',
                        confidence: inf.confidence,
                        tags: inf.task.tags,
                      });
                      count++;
                    }
                    toast.success(
                      `${i.tbInferred || 'AI inferred'} ${count} ${i.tbTasks || 'tasks'}`
                    );
                  } catch {
                    toast.error(i.tbInferError || 'AI inference failed');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] ${
                  t.isDark
                    ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                    : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}
                style={{ fontWeight: 600 }}
                title={i.tbAiInfer || 'AI Infer Tasks from Chat'}
              >
                <Bot className="w-3.5 h-3.5" />
                {i.tbAiInfer || 'AI Infer'}
              </button>
            </div>

            {/* ── Batch Actions (if selected) ── */}
            {selectedTaskIds.length > 0 && (
              <div
                className={`flex items-center gap-2 px-5 py-2 border-b flex-shrink-0 ${t.isDark ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-indigo-50/50 border-indigo-100'}`}
              >
                <span
                  className={`text-[11px] ${t.isDark ? 'text-indigo-300' : 'text-indigo-600'}`}
                  style={{ fontWeight: 600 }}
                >
                  {selectedTaskIds.length} {i.tbSelected || 'selected'}
                </span>
                <button
                  onClick={() => batchUpdateStatus(selectedTaskIds, 'done')}
                  className={`text-[10px] px-2 py-1 rounded-md ${t.isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}
                >
                  <CheckCircle2 className="w-3 h-3 inline mr-1" />
                  {i.tbMarkDone || 'Done'}
                </button>
                <button
                  onClick={() => batchArchive(selectedTaskIds)}
                  className={`text-[10px] px-2 py-1 rounded-md ${t.isDark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-600'}`}
                >
                  <Archive className="w-3 h-3 inline mr-1" />
                  {i.tbArchive || 'Archive'}
                </button>
                <button
                  onClick={() => {
                    batchDelete(selectedTaskIds);
                    toast.success(i.tbDeleted || 'Deleted');
                  }}
                  className={`text-[10px] px-2 py-1 rounded-md ${t.isDark ? 'bg-red-500/10 text-red-300' : 'bg-red-50 text-red-600'}`}
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />
                  {i.tbDelete || 'Delete'}
                </button>
                <button
                  onClick={clearSelection}
                  className={`text-[10px] px-2 py-1 rounded-md ${t.isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {i.tbClearSelection || 'Clear'}
                </button>
              </div>
            )}

            {/* ── Content: Kanban or List ── */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              {viewMode === 'kanban' ? (
                <div
                  className="flex gap-3 p-4 min-h-full"
                  style={{ minWidth: STATUS_COLUMNS.length * 200 }}
                >
                  {STATUS_COLUMNS.map((col) => (
                    <KanbanColumn
                      key={col.status}
                      status={col.status}
                      tasks={filteredTasks.filter((ft) => ft.status === col.status)}
                      t={t}
                      i={i}
                      selectedTaskIds={selectedTaskIds}
                      expandedTaskId={expandedTaskId}
                      onMove={handleQuickMove}
                      onToggleSelect={toggleTaskSelection}
                      onExpand={(id) => setExpandedTaskId(expandedTaskId === id ? null : id)}
                      onDelete={(id) => {
                        deleteTask(id);
                        toast.success(i.tbDeleted || 'Deleted');
                      }}
                      onDuplicate={(id) => {
                        duplicateTask(id);
                        toast.success(i.tbDuplicated || 'Duplicated');
                      }}
                      onToggleSubtask={toggleSubtask}
                      onAddSubtask={addSubtask}
                      onDeleteSubtask={deleteSubtask}
                    />
                  ))}
                </div>
              ) : viewMode === 'timeline' ? (
                <TimelineView
                  tasks={filteredTasks}
                  t={t}
                  i={i}
                  _onEdit={(task) => setEditingTask(task)}
                />
              ) : (
                /* ── List View ── */
                <div className="p-4 space-y-1">
                  {filteredTasks.map((task) => (
                    <TaskListRow
                      key={task.id}
                      task={task}
                      t={t}
                      i={i}
                      isSelected={selectedTaskIds.includes(task.id)}
                      onToggleSelect={() => toggleTaskSelection(task.id)}
                      onMove={(status) => handleQuickMove(task.id, status)}
                      onDelete={() => {
                        deleteTask(task.id);
                        toast.success(i.tbDeleted || 'Deleted');
                      }}
                    />
                  ))}
                  {filteredTasks.length === 0 && (
                    <div className={`text-center py-12 text-[12px] ${t.text.muted}`}>
                      {i.tbNoTasks || 'No tasks match filters'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div
              className={`flex items-center justify-between px-5 py-2.5 border-t text-[10px] flex-shrink-0 ${t.isDark ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'}`}
            >
              <span>
                {i.tbFooter ||
                  'Drag tasks between columns or use quick actions. AI-inferred tasks shown with'}{' '}
                <Bot className="w-3 h-3 inline text-purple-400" />
              </span>
              <span>
                {stats.total} {i.tbTotalTasks || 'tasks'} · {stats.done}{' '}
                {i.tbCompleted || 'completed'}
              </span>
            </div>

            {/* ── Add Task Modal ── */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/30 flex items-center justify-center z-10"
                  onClick={() => setShowAddForm(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 10 }}
                    className={`w-[400px] rounded-xl border p-5 ${t.isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3
                      className={`text-[14px] mb-4 ${t.isDark ? 'text-white' : 'text-slate-900'}`}
                      style={{ fontWeight: 600 }}
                    >
                      {i.tbAddTask || 'Add Task'}
                    </h3>
                    <div className="space-y-3">
                      <input
                        autoFocus
                        value={addTitle}
                        onChange={(e) => setAddTitle(e.target.value)}
                        placeholder={i.tbTitlePlaceholder || 'Task title...'}
                        className={`w-full px-3 py-2 rounded-lg text-[12px] outline-none ${t.isDark ? 'bg-white/5 text-slate-200 border border-white/10' : 'bg-slate-50 text-slate-800 border border-slate-200'}`}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      />
                      <textarea
                        value={addDesc}
                        onChange={(e) => setAddDesc(e.target.value)}
                        placeholder={i.tbDescPlaceholder || 'Description (optional)...'}
                        rows={2}
                        className={`w-full px-3 py-2 rounded-lg text-[12px] outline-none resize-none ${t.isDark ? 'bg-white/5 text-slate-200 border border-white/10' : 'bg-slate-50 text-slate-800 border border-slate-200'}`}
                      />
                      <div className="flex gap-2">
                        <select
                          value={addPriority}
                          onChange={(e) => setAddPriority(e.target.value as TaskPriority)}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] outline-none ${t.isDark ? 'bg-white/5 text-slate-200 border border-white/10' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}
                        >
                          {(['critical', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                            <option key={p} value={p}>
                              {priorityLabel(p, i)}
                            </option>
                          ))}
                        </select>
                        <select
                          value={addType}
                          onChange={(e) => setAddType(e.target.value as TaskType)}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] outline-none ${t.isDark ? 'bg-white/5 text-slate-200 border border-white/10' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}
                        >
                          {(
                            [
                              'feature',
                              'bug',
                              'refactor',
                              'test',
                              'documentation',
                              'other',
                            ] as TaskType[]
                          ).map((tp) => (
                            <option key={tp} value={tp}>
                              {typeLabel(tp, i)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowAddForm(false)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] ${t.isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                          {i.tbCancel || 'Cancel'}
                        </button>
                        <button
                          onClick={handleAddTask}
                          disabled={!addTitle.trim()}
                          className={`px-4 py-1.5 rounded-lg text-[11px] ${t.isDark ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-40' : 'bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40'}`}
                          style={{ fontWeight: 600 }}
                        >
                          {i.tbCreate || 'Create'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Edit Task Modal ── */}
            <AnimatePresence>
              {editingTask && (
                <EditTaskModal
                  task={editingTask}
                  t={t}
                  i={i}
                  onSave={(updates) => {
                    updateTask(editingTask.id, updates);
                    setEditingTask(null);
                    toast.success(i.tbSaved || 'Saved');
                  }}
                  onClose={() => setEditingTask(null)}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Kanban Column ──

function KanbanColumn({
  status,
  tasks,
  t,
  i,
  selectedTaskIds,
  expandedTaskId,
  onMove,
  onToggleSelect,
  onExpand,
  onDelete,
  onDuplicate,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}: {
  status: TaskStatus;
  tasks: Task[];
  t: ThemeTokens;
  i: I18nStrings;
  selectedTaskIds: string[];
  expandedTaskId: string | null;
  onMove: (taskId: string, targetStatus: TaskStatus) => void;
  onToggleSelect: (taskId: string) => void;
  onExpand: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
}) {
  const col = STATUS_COLUMNS.find((c) => c.status === status);
  if (!col) return null;

  const [{ isOver }, dropRef] = useDrop({
    accept: TASK_DND_TYPE,
    drop: (item: { taskId: string }) => {
      onMove(item.taskId, status);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={dropRef as unknown as React.Ref<HTMLDivElement>}
      key={status}
      className={`flex-1 min-w-[180px] rounded-xl border p-2.5 flex flex-col transition-all ${
        isOver
          ? t.isDark
            ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20'
            : 'bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-200'
          : t.isDark
            ? 'bg-slate-800/30 border-white/5'
            : 'bg-slate-50/50 border-slate-200/50'
      }`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <StatusIcon status={status} />
        <span
          className={`text-[11px] ${t.isDark ? 'text-slate-200' : 'text-slate-700'}`}
          style={{ fontWeight: 600 }}
        >
          {statusLabel(status, i)}
        </span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-md ${t.isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            t={t}
            i={i}
            isSelected={selectedTaskIds.includes(task.id)}
            isExpanded={expandedTaskId === task.id}
            onToggleSelect={() => onToggleSelect(task.id)}
            onExpand={() => onExpand(task.id)}
            onMove={(status) => onMove(task.id, status)}
            onDelete={() => onDelete(task.id)}
            onDuplicate={() => onDuplicate(task.id)}
            onToggleSubtask={(stId) => onToggleSubtask(task.id, stId)}
            onAddSubtask={(title) => onAddSubtask(task.id, title)}
            onDeleteSubtask={(stId) => onDeleteSubtask(task.id, stId)}
          />
        ))}
        {tasks.length === 0 && (
          <div className={`text-center py-6 text-[10px] ${t.text.dimmed}`}>
            {i.tbEmpty || 'No tasks'}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Timeline View ──

function TimelineView({
  tasks,
  t,
  i,
  _onEdit,
}: {
  tasks: Task[];
  t: ThemeTokens;
  i: I18nStrings;
  _onEdit: (task: Task) => void;
}) {
  const now = Date.now();
  const DAY_MS = 86400000;
  const LABEL_W = 200;
  const ROW_H = 30;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const {
    updateTask,
    pushDateChange,
    undoDateChange,
    redoDateChange,
    dateUndoStack,
    dateRedoStack,
  } = useTaskStore();

  // Zoom: day/week/month
  type ZoomLevel = 'day' | 'week' | 'month';
  const [zoom, setZoom] = useState<ZoomLevel>('day');
  const zoomConfig: Record<
    ZoomLevel,
    { pxPerDay: number; labelEvery: number; labelFn: (ts: number) => string }
  > = {
    day: {
      pxPerDay: 32,
      labelEvery: 1,
      labelFn: (ts) => {
        const d = new Date(ts);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      },
    },
    week: {
      pxPerDay: 12,
      labelEvery: 7,
      labelFn: (ts) => {
        const d = new Date(ts);
        return `W${Math.ceil(d.getDate() / 7)} ${d.getMonth() + 1}月`;
      },
    },
    month: {
      pxPerDay: 4,
      labelEvery: 30,
      labelFn: (ts) => {
        const d = new Date(ts);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      },
    },
  };
  const zc = zoomConfig[zoom];

  const sortedTasks = useMemo(() => {
    return tasks
      .filter((tk) => !tk.isArchived)
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [tasks]);

  const rangeStart = useMemo(() => {
    const earliest =
      sortedTasks.length > 0 ? Math.min(...sortedTasks.map((tk) => tk.createdAt)) : now;
    return earliest - DAY_MS;
  }, [sortedTasks, now]);

  const rangeEnd = useMemo(() => {
    const latestDue = sortedTasks.filter((tk) => tk.dueDate).map((tk) => tk.dueDate!);
    const latest = latestDue.length > 0 ? Math.max(...latestDue) : now + 14 * DAY_MS;
    return Math.max(latest, now) + (zoom === 'month' ? 30 : zoom === 'week' ? 14 : 2) * DAY_MS;
  }, [sortedTasks, now, zoom]);

  const totalDays = Math.max(Math.ceil((rangeEnd - rangeStart) / DAY_MS), 7);

  const headerLabels = useMemo(() => {
    const labels: { label: string; leftPx: number; widthPx: number; isToday: boolean }[] = [];
    const todayDate = new Date(now);
    for (let d = 0; d < totalDays; d += zc.labelEvery) {
      const ts = rangeStart + d * DAY_MS;
      const date = new Date(ts);
      const isToday =
        zc.labelEvery === 1 &&
        date.getFullYear() === todayDate.getFullYear() &&
        date.getMonth() === todayDate.getMonth() &&
        date.getDate() === todayDate.getDate();
      labels.push({
        label: zc.labelFn(ts),
        leftPx: d * zc.pxPerDay,
        widthPx: zc.labelEvery * zc.pxPerDay,
        isToday,
      });
    }
    return labels;
  }, [totalDays, rangeStart, now, zc]);

  const todayPx = useMemo(() => ((now - rangeStart) / DAY_MS) * zc.pxPerDay, [now, rangeStart, zc]);

  const PRIORITY_BAR_COLORS: Record<TaskPriority, string> = {
    critical: t.isDark ? 'bg-red-500/70' : 'bg-red-400',
    high: t.isDark ? 'bg-orange-500/70' : 'bg-orange-400',
    medium: t.isDark ? 'bg-blue-500/60' : 'bg-blue-400',
    low: t.isDark ? 'bg-emerald-500/60' : 'bg-emerald-400',
  };

  // ── Drag tooltip state ──
  const [dragTooltip, setDragTooltip] = useState<{ x: number; y: number; label: string } | null>(
    null
  );

  // Drag resize dueDate (right edge) or startDate (left edge)
  const [resizingTaskId, setResizingTaskId] = useState<string | null>(null);
  const resizeRef = useRef<{
    startX: number;
    origTs: number;
    taskId: string;
    edge: 'left' | 'right';
  } | null>(null);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, taskId: string, origTs: number, edge: 'left' | 'right') => {
      e.stopPropagation();
      e.preventDefault();
      resizeRef.current = { startX: e.clientX, origTs, taskId, edge };
      setResizingTaskId(taskId);

      const handleMove = (me: MouseEvent) => {
        if (!resizeRef.current) return;
        const deltaPx = me.clientX - resizeRef.current.startX;
        const deltaDays = deltaPx / zc.pxPerDay;
        // Snap-to-day: round to nearest full day boundary
        const snappedDays = Math.round(deltaDays);
        const newTs = resizeRef.current.origTs + snappedDays * DAY_MS;
        const clamped = Math.round(Math.max(newTs, now - 365 * DAY_MS));
        if (resizeRef.current.edge === 'right') {
          updateTask(resizeRef.current.taskId, { dueDate: clamped });
        } else {
          updateTask(resizeRef.current.taskId, { createdAt: clamped });
        }
        // Update drag tooltip
        const d = new Date(clamped);
        const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setDragTooltip({ x: me.clientX, y: me.clientY, label });
      };

      const handleUp = () => {
        if (resizeRef.current) {
          const msg =
            resizeRef.current.edge === 'right'
              ? i.tbDueDateUpdated || 'Due date updated'
              : i.tbStartDateUpdated || 'Start date updated';
          toast.success(msg);
          // Push undo record
          const task = useTaskStore
            .getState()
            .tasks.find((tk) => tk.id === resizeRef.current!.taskId);
          if (task) {
            const field =
              resizeRef.current.edge === 'right' ? ('dueDate' as const) : ('createdAt' as const);
            const newValue = field === 'dueDate' ? task.dueDate : task.createdAt;
            pushDateChange({
              taskId: resizeRef.current.taskId,
              field,
              oldValue: resizeRef.current.origTs,
              newValue,
            });
          }
        }
        setDragTooltip(null);
        setResizingTaskId(null);
        resizeRef.current = null;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [zc.pxPerDay, updateTask, now, i, pushDateChange]
  );

  // ── Ctrl+Z / Ctrl+Y keyboard handler ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoDateChange();
        toast.info(i.tbUndone || 'Undo date change');
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redoDateChange();
        toast.info(i.tbRedone || 'Redo date change');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undoDateChange, redoDateChange, i]);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // ── Critical path computation (longest path in DAG) ──
  const criticalPathIds = useMemo(() => {
    if (sortedTasks.length === 0) return new Set<string>();
    const taskMap = new Map(sortedTasks.map((tk) => [tk.id, tk]));
    const getEndTs = (tk: Task) => tk.dueDate || tk.createdAt + (tk.estimatedHours || 8) * 3600000;
    const getDuration = (tk: Task) => getEndTs(tk) - tk.createdAt;
    const adjList = new Map<string, string[]>();
    const inDeg = new Map<string, number>();
    for (const tk of sortedTasks) {
      adjList.set(tk.id, []);
      inDeg.set(tk.id, 0);
    }
    for (const tk of sortedTasks) {
      if (tk.dependencies?.length) {
        for (const depId of tk.dependencies) {
          if (taskMap.has(depId)) {
            adjList.get(depId)!.push(tk.id);
            inDeg.set(tk.id, (inDeg.get(tk.id) || 0) + 1);
          }
        }
      }
    }
    const dist = new Map<string, number>();
    const pred = new Map<string, string | null>();
    for (const tk of sortedTasks) {
      dist.set(tk.id, getDuration(tk));
      pred.set(tk.id, null);
    }
    const q: string[] = [];
    for (const [id, d] of inDeg) {
      if (d === 0) q.push(id);
    }
    while (q.length > 0) {
      const node = q.shift()!;
      for (const next of adjList.get(node) || []) {
        const nd = (dist.get(node) || 0) + getDuration(taskMap.get(next)!);
        if (nd > (dist.get(next) || 0)) {
          dist.set(next, nd);
          pred.set(next, node);
        }
        inDeg.set(next, (inDeg.get(next) || 1) - 1);
        if (inDeg.get(next) === 0) q.push(next);
      }
    }
    let maxD = 0,
      endN: string | null = null;
    for (const [id, d] of dist) {
      if (d > maxD) {
        maxD = d;
        endN = id;
      }
    }
    const cpSet = new Set<string>();
    let cur = endN;
    while (cur) {
      cpSet.add(cur);
      cur = pred.get(cur) || null;
    }
    return cpSet;
  }, [sortedTasks]);

  const [showCriticalPath, setShowCriticalPath] = useState(true);

  // ── Dependency editing state ──
  const [depEditMode, setDepEditMode] = useState(false);
  const [connectSource, setConnectSource] = useState<string | null>(null);

  // ── Drag-to-connect state ──
  const [dragConnect, setDragConnect] = useState<{
    fromId: string;
    fromX: number;
    fromY: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const timelineAreaRef = useRef<HTMLDivElement>(null);

  const handleDeleteDependency = useCallback(
    (fromId: string, toId: string) => {
      const task = useTaskStore.getState().tasks.find((tk) => tk.id === toId);
      if (task) {
        updateTask(toId, { dependencies: (task.dependencies || []).filter((d) => d !== fromId) });
        toast.success(i.tbDepRemoved || 'Dependency removed');
      }
    },
    [updateTask, i]
  );

  const [cycleWarning, setCycleWarning] = useState<{ fromId: string; toId: string } | null>(null);

  /** Build SVG string for timeline export */
  // Timeline SVG constants
  const buildTimelineSvg = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      toast.error('No timeline to export');
      return null;
    }

    // Build SVG from current timeline DOM
    const svgWidth = LABEL_W + totalDays * zc.pxPerDay;
    const svgHeight = sortedTasks.length * ROW_H + 30; // +30 for header
    const isDark = t.isDark;

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" style="background:${isDark ? '#0f172a' : '#ffffff'};font-family:sans-serif">`;

    // Header row
    svgContent += `<g transform="translate(${LABEL_W}, 0)">`;
    let hx = 0;
    for (let d = 0; d < totalDays; d++) {
      const dayTs = rangeStart + d * DAY_MS;
      const date = new Date(dayTs);
      if (d % zc.labelEvery === 0) {
        svgContent += `<text x="${hx + zc.pxPerDay / 2}" y="12" text-anchor="middle" font-size="8" fill="${isDark ? '#64748b' : '#94a3b8'}">${date.getMonth() + 1}/${date.getDate()}</text>`;
      }
      hx += zc.pxPerDay;
    }
    svgContent += `</g>`;

    // Today line
    const todayOffset = Math.max(0, ((now - rangeStart) / DAY_MS) * zc.pxPerDay);
    svgContent += `<line x1="${LABEL_W + todayOffset}" y1="18" x2="${LABEL_W + todayOffset}" y2="${svgHeight}" stroke="${isDark ? '#818cf8' : '#6366f1'}" stroke-width="1" stroke-dasharray="3 3" opacity="0.5"/>`;

    // Task rows
    sortedTasks.forEach((task, idx) => {
      const y = 20 + idx * ROW_H;
      const startTs = task.createdAt;
      const endTs = task.dueDate || startTs + (task.estimatedHours || 8) * 3600000;
      const leftPx = Math.max(0, ((startTs - rangeStart) / DAY_MS) * zc.pxPerDay);
      const widthPx = Math.max(8, ((endTs - startTs) / DAY_MS) * zc.pxPerDay);
      const colors: Record<string, string> = {
        critical: '#ef4444',
        high: '#f97316',
        medium: '#3b82f6',
        low: '#22c55e',
      };
      const barColor = colors[task.priority] || '#3b82f6';
      const isCp = criticalPathIds.has(task.id);

      // Label
      svgContent += `<text x="4" y="${y + ROW_H / 2 + 3}" font-size="9" fill="${isDark ? '#cbd5e1' : '#334155'}">${task.title.length > 22 ? task.title.substring(0, 22) + '...' : task.title}</text>`;

      // Bar
      svgContent += `<rect x="${LABEL_W + leftPx}" y="${y + 4}" width="${widthPx}" height="${ROW_H - 8}" rx="3" fill="${barColor}" opacity="0.8"/>`;
      if (isCp) {
        svgContent += `<rect x="${LABEL_W + leftPx - 1}" y="${y + 3}" width="${widthPx + 2}" height="${ROW_H - 6}" rx="4" fill="none" stroke="#fbbf24" stroke-width="1.5"/>`;
      }
    });

    // Dependency arrows
    depArrows.forEach((arrow) => {
      const dx = arrow.toX - arrow.fromX;
      const cpOff = Math.min(Math.abs(dx) * 0.4, 60);
      const isCp = criticalPathIds.has(arrow.fromId) && criticalPathIds.has(arrow.toId);
      const color = isCp ? '#fbbf24' : isDark ? '#818cf8' : '#6366f1';
      // Offset arrows by header height
      const fy = arrow.fromY + 20,
        ty = arrow.toY + 20;
      svgContent += `<path d="M ${arrow.fromX} ${fy} C ${arrow.fromX + cpOff} ${fy}, ${arrow.toX - cpOff} ${ty}, ${arrow.toX} ${ty}" fill="none" stroke="${color}" stroke-width="1.5" ${isCp ? '' : 'stroke-dasharray="4 2"'} opacity="0.6"/>`;
    });

    svgContent += `</svg>`;
    return { svgContent, svgWidth, svgHeight };
  }, [
    scrollContainerRef,
    totalDays,
    zc,
    sortedTasks,
    rangeStart,
    DAY_MS,
    now,
    t,
    criticalPathIds,
    LABEL_W,
    ROW_H,
  ]);

  const handleExportSvg = useCallback(() => {
    const result = buildTimelineSvg();
    if (!result) return;
    const blob = new Blob([result.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yyc3-timeline-${new Date().toISOString().slice(0, 10)}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(i.tbExportedSvg || 'Timeline exported as SVG');
  }, [buildTimelineSvg, i]);

  const handleExportPng = useCallback(() => {
    const result = buildTimelineSvg();
    if (!result) return;
    const { svgContent, svgWidth, svgHeight } = result;
    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth * scale;
      canvas.height = svgHeight * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `yyc3-timeline-${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
        toast.success(i.tbExportedPng || 'Timeline exported as PNG');
      }, 'image/png');
    };
    img.src = svgUrl;
  }, [buildTimelineSvg, i]);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDepGraph, setShowDepGraph] = useState(false);

  const handleAddDependency = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId) {
        setConnectSource(null);
        return;
      }
      // ── Cycle detection: DFS from toId along existing+tentative edges ──
      const allTasks = useTaskStore.getState().tasks;
      const adj = new Map<string, string[]>();
      for (const tk of allTasks) {
        for (const depId of tk.dependencies || []) {
          const list = adj.get(depId) || [];
          list.push(tk.id);
          adj.set(depId, list);
        }
      }
      const tmp = adj.get(fromId) || [];
      tmp.push(toId);
      adj.set(fromId, tmp);
      const visited = new Set<string>();
      const stack = [toId];
      let hasCycle = false;
      while (stack.length > 0) {
        const node = stack.pop()!;
        if (node === fromId) {
          hasCycle = true;
          break;
        }
        if (visited.has(node)) continue;
        visited.add(node);
        for (const next of adj.get(node) || []) stack.push(next);
      }
      if (hasCycle) {
        setCycleWarning({ fromId, toId });
        toast.error(i.tbCycleDetected || 'Circular dependency detected! Cannot add this link.');
        setConnectSource(null);
        setTimeout(() => setCycleWarning(null), 3000);
        return;
      }
      const task = allTasks.find((tk) => tk.id === toId);
      if (task) {
        const deps = task.dependencies || [];
        if (!deps.includes(fromId)) {
          updateTask(toId, { dependencies: [...deps, fromId] });
          toast.success(i.tbDepAdded || 'Dependency added');
        }
      }
      setConnectSource(null);
    },
    [updateTask, i]
  );

  const handleDragConnectStart = useCallback(
    (e: React.MouseEvent, taskId: string, barRightX: number, barCenterY: number) => {
      e.stopPropagation();
      e.preventDefault();
      const rect = timelineAreaRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDragConnect({
        fromId: taskId,
        fromX: barRightX,
        fromY: barCenterY,
        mouseX: e.clientX - rect.left,
        mouseY: e.clientY - rect.top,
      });

      const onMove = (me: MouseEvent) => {
        if (!timelineAreaRef.current) return;
        const r = timelineAreaRef.current.getBoundingClientRect();
        setDragConnect((prev) =>
          prev ? { ...prev, mouseX: me.clientX - r.left, mouseY: me.clientY - r.top } : null
        );
      };
      const onUp = (me: MouseEvent) => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        const el = document.elementFromPoint(me.clientX, me.clientY);
        const targetBar = el?.closest('[data-task-bar-id]') as HTMLElement | null;
        if (targetBar) {
          const targetId = targetBar.getAttribute('data-task-bar-id');
          if (targetId && targetId !== taskId) {
            handleAddDependency(taskId, targetId);
          }
        }
        setDragConnect(null);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [handleAddDependency]
  );

  // ── AI Critical Path Optimization Suggestions ──
  const [showAiOptimize, setShowAiOptimize] = useState(false);

  const aiOptimizationSuggestions = useMemo(() => {
    if (criticalPathIds.size < 2) return [];
    const suggestions: { icon: string; title: string; description: string; taskIds: string[] }[] =
      [];
    const cpTasks = sortedTasks.filter((tk) => criticalPathIds.has(tk.id));

    // Find bottleneck (longest duration task in critical path)
    let longestTask: Task | null = null;
    let longestDur = 0;
    for (const tk of cpTasks) {
      const dur = (tk.dueDate || tk.createdAt + (tk.estimatedHours || 8) * 3600000) - tk.createdAt;
      if (dur > longestDur) {
        longestDur = dur;
        longestTask = tk;
      }
    }
    if (longestTask) {
      suggestions.push({
        icon: 'bottleneck',
        title: i.tbAiBottleneck || 'Bottleneck Detected',
        description: `"${longestTask.title}" ${i.tbAiBottleneckDesc || 'is the longest task on the critical path. Consider splitting it into subtasks or allocating more resources.'}`,
        taskIds: [longestTask.id],
      });
    }

    // Find parallelizable tasks
    const nonCpTasks = sortedTasks.filter(
      (tk) => !criticalPathIds.has(tk.id) && tk.status !== 'done'
    );
    if (nonCpTasks.length > 0 && cpTasks.length > 1) {
      suggestions.push({
        icon: 'parallel',
        title: i.tbAiParallel || 'Parallelization Opportunity',
        description: `${nonCpTasks.length} ${i.tbAiParallelDesc || 'tasks can run in parallel with the critical path. Prioritize critical-path tasks to reduce total project duration.'}`,
        taskIds: [],
      });
    }

    // Overdue tasks on critical path
    const overdueCp = cpTasks.filter(
      (tk) => tk.dueDate && tk.dueDate < now && tk.status !== 'done'
    );
    if (overdueCp.length > 0) {
      suggestions.push({
        icon: 'overdue',
        title: i.tbAiOverdue || 'Overdue Critical Tasks',
        description: `${overdueCp.length} ${i.tbAiOverdueDesc || 'critical-path tasks are overdue. These directly delay the entire project.'}`,
        taskIds: overdueCp.map((tk) => tk.id),
      });
    }

    // Blocked tasks
    const blockedCp = cpTasks.filter((tk) => tk.status === 'blocked');
    if (blockedCp.length > 0) {
      suggestions.push({
        icon: 'blocked',
        title: i.tbAiBlocked || 'Blocked Critical Tasks',
        description: `${blockedCp.length} ${i.tbAiBlockedDesc || 'critical-path tasks are blocked. Resolve blockers immediately to unblock the project.'}`,
        taskIds: blockedCp.map((tk) => tk.id),
      });
    }

    return suggestions;
  }, [criticalPathIds, sortedTasks, now, i]);

  // ── Minimap state ──
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScr = () => {
      setScrollLeft(el.scrollLeft);
      setContainerWidth(el.clientWidth);
    };
    onScr();
    el.addEventListener('scroll', onScr);
    window.addEventListener('resize', onScr);
    return () => {
      el.removeEventListener('scroll', onScr);
      window.removeEventListener('resize', onScr);
    };
  }, [sortedTasks.length]);

  const totalContentWidth = LABEL_W + totalDays * zc.pxPerDay;
  const MINIMAP_W = 280;
  const minimapScale = totalContentWidth > 0 ? MINIMAP_W / totalContentWidth : 1;
  const minimapViewportW = Math.max(8, containerWidth * minimapScale);
  const minimapViewportX = scrollLeft * minimapScale;

  const handleMinimapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const targetScroll = (clickX / MINIMAP_W) * totalContentWidth - containerWidth / 2;
      scrollContainerRef.current?.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
    },
    [totalContentWidth, containerWidth]
  );

  const handleMinimapDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      const startX = e.clientX;
      const startScroll = scrollLeft;
      const onMove = (me: MouseEvent) => {
        const dx = me.clientX - startX;
        scrollContainerRef.current?.scrollTo({
          left: Math.max(0, startScroll + dx / minimapScale),
        });
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [scrollLeft, minimapScale]
  );

  // ── Compute dependency arrows ──
  const depArrows = useMemo(() => {
    const arrows: {
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      fromId: string;
      toId: string;
    }[] = [];
    const taskIndex = new Map<string, number>();
    sortedTasks.forEach((tk, idx) => taskIndex.set(tk.id, idx));

    for (const task of sortedTasks) {
      if (!task.dependencies?.length) continue;
      const toIdx = taskIndex.get(task.id);
      if (toIdx === undefined) continue;
      const toStartTs = task.createdAt;
      const toLeftPx = Math.max(0, ((toStartTs - rangeStart) / DAY_MS) * zc.pxPerDay);

      for (const depId of task.dependencies) {
        const fromIdx = taskIndex.get(depId);
        if (fromIdx === undefined) continue;
        const fromTask = sortedTasks[fromIdx];
        const fromEndTs =
          fromTask.dueDate || fromTask.createdAt + (fromTask.estimatedHours || 8) * 3600000;
        const fromRightPx = Math.max(0, ((fromEndTs - rangeStart) / DAY_MS) * zc.pxPerDay);

        arrows.push({
          fromX: LABEL_W + fromRightPx,
          fromY: fromIdx * ROW_H + ROW_H / 2,
          toX: LABEL_W + toLeftPx,
          toY: toIdx * ROW_H + ROW_H / 2,
          fromId: depId,
          toId: task.id,
        });
      }
    }
    return arrows;
  }, [sortedTasks, rangeStart, zc.pxPerDay]);

  return (
    <div className="p-4 overflow-auto custom-scrollbar">
      {/* Zoom & undo/redo controls */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] ${t.text.muted}`} style={{ fontWeight: 600 }}>
          <GanttChart className="w-3 h-3 inline mr-1" />
          {i.tbTimeline || 'Timeline'}
        </span>
        <div
          className={`flex rounded-lg overflow-hidden border ${t.isDark ? 'border-white/8' : 'border-slate-200'}`}
        >
          {(['day', 'week', 'month'] as ZoomLevel[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-2.5 py-1 text-[10px] ${
                zoom === z
                  ? t.isDark
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'bg-indigo-50 text-indigo-600'
                  : t.isDark
                    ? 'text-slate-400 hover:bg-white/5'
                    : 'text-slate-500 hover:bg-slate-50'
              }`}
              style={{ fontWeight: zoom === z ? 600 : 400 }}
            >
              {z === 'day'
                ? i.tbDay || 'Day'
                : z === 'week'
                  ? i.tbWeek || 'Week'
                  : i.tbMonth || 'Month'}
            </button>
          ))}
        </div>
        {/* Undo / Redo buttons */}
        <button
          onClick={() => {
            undoDateChange();
            toast.info(i.tbUndone || 'Undo date change');
          }}
          disabled={dateUndoStack.length === 0}
          className={`p-1 rounded ${dateUndoStack.length > 0 ? (t.isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100') : 'text-slate-400/40 cursor-not-allowed'}`}
          title={`${i.tbUndo || 'Undo'} (Ctrl+Z)`}
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            redoDateChange();
            toast.info(i.tbRedone || 'Redo date change');
          }}
          disabled={dateRedoStack.length === 0}
          className={`p-1 rounded ${dateRedoStack.length > 0 ? (t.isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100') : 'text-slate-400/40 cursor-not-allowed'}`}
          title={`${i.tbRedo || 'Redo'} (Ctrl+Y)`}
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        {/* Critical path toggle */}
        <button
          onClick={() => setShowCriticalPath((v) => !v)}
          className={`px-2 py-0.5 rounded text-[10px] ${
            showCriticalPath
              ? t.isDark
                ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
              : t.isDark
                ? 'text-slate-400 hover:bg-white/5'
                : 'text-slate-500 hover:bg-slate-50'
          }`}
          style={{ fontWeight: 500 }}
          title={i.tbCriticalPath || 'Critical Path'}
        >
          {i.tbCriticalPath || 'Critical Path'}{' '}
          {showCriticalPath ? `(${criticalPathIds.size})` : ''}
        </button>
        {/* Dep edit mode toggle */}
        <button
          onClick={() => {
            setDepEditMode((v) => !v);
            setConnectSource(null);
          }}
          className={`px-2 py-0.5 rounded text-[10px] ${
            depEditMode
              ? t.isDark
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30'
                : 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200'
              : t.isDark
                ? 'text-slate-400 hover:bg-white/5'
                : 'text-slate-500 hover:bg-slate-50'
          }`}
          style={{ fontWeight: 500 }}
          title={i.tbDepEdit || 'Edit Dependencies'}
        >
          <Link className="w-3 h-3 inline mr-0.5" />
          {i.tbDepEdit || 'Deps'}
        </button>
        {/* Dependency Graph toggle */}
        <button
          onClick={() => setShowDepGraph((v) => !v)}
          className={`px-2 py-0.5 rounded text-[10px] ${
            showDepGraph
              ? t.isDark
                ? 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30'
                : 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
              : t.isDark
                ? 'text-slate-400 hover:bg-white/5'
                : 'text-slate-500 hover:bg-slate-50'
          }`}
          style={{ fontWeight: 500 }}
          title={i.tbDepGraph || 'Dependency Graph'}
        >
          <GitBranch className="w-3 h-3 inline mr-0.5" />
          {i.tbDepGraph || 'Graph'}
        </button>
        {/* AI Optimize */}
        {showCriticalPath && criticalPathIds.size > 1 && (
          <button
            onClick={() => setShowAiOptimize((v) => !v)}
            className={`px-2 py-0.5 rounded text-[10px] ${
              showAiOptimize
                ? t.isDark
                  ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30'
                  : 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'
                : t.isDark
                  ? 'text-slate-400 hover:bg-white/5'
                  : 'text-slate-500 hover:bg-slate-50'
            }`}
            style={{ fontWeight: 500 }}
            title={i.tbAiOptimize || 'AI Optimize'}
          >
            <Zap className="w-3 h-3 inline mr-0.5" />
            {i.tbAiOptimize || 'AI Optimize'}
          </button>
        )}
        {/* Timeline Export */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu((v) => !v)}
            className={`px-2 py-0.5 rounded text-[10px] ${t.isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'}`}
            style={{ fontWeight: 500 }}
            title={i.tbExport || 'Export'}
          >
            <Download className="w-3 h-3 inline mr-0.5" />
            {i.tbExport || 'Export'}
            <ChevronDown className="w-2.5 h-2.5 inline ml-0.5" />
          </button>
          {showExportMenu && (
            <div
              className={`absolute top-full mt-1 right-0 z-50 rounded-lg py-1 min-w-[120px] border shadow-lg ${t.isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}
            >
              <button
                onClick={() => {
                  handleExportSvg();
                  setShowExportMenu(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[10px] ${t.isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
                style={{ fontWeight: 500 }}
              >
                SVG {i.tbVector || '(Vector)'}
              </button>
              <button
                onClick={() => {
                  handleExportPng();
                  setShowExportMenu(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[10px] ${t.isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
                style={{ fontWeight: 500 }}
              >
                PNG {i.tbRaster || '(Raster 2x)'}
              </button>
            </div>
          )}
        </div>
        <span className={`text-[9px] ${t.text.dimmed} ml-2`}>
          {depEditMode
            ? connectSource
              ? i.tbDepClickTarget || 'Click a task bar to set target'
              : i.tbDepClickSource || 'Click a task bar to set source'
            : i.tbDragResize || 'Drag bar edges to adjust dates'}
        </span>
      </div>

      {/* Cycle warning banner */}
      {cycleWarning && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-2 animate-pulse ${t.isDark ? 'bg-red-500/15 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}
        >
          <AlertTriangle
            className={`w-4 h-4 flex-shrink-0 ${t.isDark ? 'text-red-400' : 'text-red-600'}`}
          />
          <span
            className={`text-[11px] ${t.isDark ? 'text-red-300' : 'text-red-700'}`}
            style={{ fontWeight: 600 }}
          >
            {i.tbCycleDetected || 'Circular dependency detected!'}{' '}
            <span style={{ fontWeight: 400 }}>
              {i.tbCycleDesc ||
                'Adding this dependency would create a cycle. Dependency graphs must be acyclic (DAG).'}
            </span>
          </span>
          <button
            onClick={() => setCycleWarning(null)}
            className={`ml-auto p-0.5 rounded ${t.isDark ? 'hover:bg-white/10' : 'hover:bg-red-100'}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Dependency Force-Directed Graph Panel */}
      {showDepGraph && (
        <DependencyGraph
          tasks={sortedTasks}
          criticalPathIds={criticalPathIds}
          t={t}
          i={i}
          _onEdit={_onEdit}
        />
      )}

      {sortedTasks.length === 0 ? (
        <div className={`text-center py-12 text-[12px] ${t.text.muted}`}>
          {i.tbNoTasks || 'No tasks match filters'}
        </div>
      ) : (
        <div
          className="relative"
          ref={(el) => {
            (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            (timelineAreaRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }}
          data-timeline-area
          style={{ overflowX: 'auto' }}
        >
          {/* Header row */}
          <div className="flex" style={{ paddingLeft: 200 }}>
            {headerLabels.map((hl, idx) => (
              <div
                key={idx}
                className={`text-center text-[8px] border-r flex-shrink-0 ${
                  hl.isToday
                    ? t.isDark
                      ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                      : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    : t.isDark
                      ? 'text-slate-500 border-white/5'
                      : 'text-slate-400 border-slate-100'
                }`}
                style={{ width: hl.widthPx, fontWeight: hl.isToday ? 700 : 400 }}
              >
                {hl.label}
              </div>
            ))}
          </div>

          {/* SVG dependency arrows overlay */}
          {depArrows.length > 0 && (
            <svg
              className={`absolute top-0 left-0 ${depEditMode ? '' : 'pointer-events-none'}`}
              style={{
                width: LABEL_W + totalDays * zc.pxPerDay,
                height: sortedTasks.length * ROW_H,
              }}
            >
              <defs>
                <marker
                  id="dep-arrowhead"
                  markerWidth="6"
                  markerHeight="4"
                  refX="6"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 6 2, 0 4" fill={t.isDark ? '#818cf8' : '#6366f1'} />
                </marker>
                <marker
                  id="dep-arrowhead-cp"
                  markerWidth="6"
                  markerHeight="4"
                  refX="6"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 6 2, 0 4" fill={t.isDark ? '#fbbf24' : '#d97706'} />
                </marker>
              </defs>
              {depArrows.map((arrow, idx) => {
                const dx = arrow.toX - arrow.fromX;
                const cpOffset = Math.min(Math.abs(dx) * 0.4, 60);
                const pathD = `M ${arrow.fromX} ${arrow.fromY} C ${arrow.fromX + cpOffset} ${arrow.fromY}, ${arrow.toX - cpOffset} ${arrow.toY}, ${arrow.toX} ${arrow.toY}`;
                const isCpArrow =
                  showCriticalPath &&
                  criticalPathIds.has(arrow.fromId) &&
                  criticalPathIds.has(arrow.toId);
                return (
                  <g key={`${arrow.fromId}-${arrow.toId}-${idx}`}>
                    {/* Wider invisible hitbox for click */}
                    {depEditMode && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="12"
                        className="cursor-pointer"
                        onClick={() => handleDeleteDependency(arrow.fromId, arrow.toId)}
                      />
                    )}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={
                        isCpArrow
                          ? t.isDark
                            ? '#fbbf24'
                            : '#d97706'
                          : t.isDark
                            ? '#818cf8'
                            : '#6366f1'
                      }
                      strokeWidth={isCpArrow ? 2 : 1.5}
                      strokeOpacity={depEditMode ? 0.8 : 0.5}
                      strokeDasharray={isCpArrow ? 'none' : '4 2'}
                      markerEnd={isCpArrow ? 'url(#dep-arrowhead-cp)' : 'url(#dep-arrowhead)'}
                      className={depEditMode ? 'cursor-pointer hover:stroke-red-400' : ''}
                      style={depEditMode ? { pointerEvents: 'none' } : {}}
                    />
                    {/* Delete indicator on hover (via hitbox) */}
                    {depEditMode && (
                      <text
                        x={(arrow.fromX + arrow.toX) / 2}
                        y={(arrow.fromY + arrow.toY) / 2 - 6}
                        fill={t.isDark ? '#f87171' : '#ef4444'}
                        fontSize="8"
                        textAnchor="middle"
                        className="pointer-events-none opacity-0 hover-show"
                      >
                        ✕
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {/* Drag-connect visual line */}
          {dragConnect && (
            <svg
              className="absolute top-0 left-0 pointer-events-none z-20"
              style={{ width: '100%', height: sortedTasks.length * ROW_H }}
            >
              <line
                x1={dragConnect.fromX}
                y1={dragConnect.fromY}
                x2={dragConnect.mouseX}
                y2={dragConnect.mouseY}
                stroke={t.isDark ? '#34d399' : '#10b981'}
                strokeWidth="2"
                strokeDasharray="6 3"
              />
              <circle
                cx={dragConnect.fromX}
                cy={dragConnect.fromY}
                r="4"
                fill={t.isDark ? '#34d399' : '#10b981'}
              />
              <circle
                cx={dragConnect.mouseX}
                cy={dragConnect.mouseY}
                r="4"
                fill={t.isDark ? '#34d399' : '#10b981'}
                opacity="0.6"
              />
            </svg>
          )}

          {/* Task rows */}
          {sortedTasks.map((task) => (
            <TimelineRow
              key={task.id}
              task={task}
              rangeStart={rangeStart}
              DAY_MS={DAY_MS}
              zc={zc}
              now={now}
              totalDays={totalDays}
              todayPx={todayPx}
              zoom={zoom}
              t={t}
              PRIORITY_BAR_COLORS={PRIORITY_BAR_COLORS}
              resizingTaskId={resizingTaskId}
              _onEdit={_onEdit}
              handleResizeStart={handleResizeStart}
              formatDate={formatDate}
              isCriticalPath={showCriticalPath && criticalPathIds.has(task.id)}
              depEditMode={depEditMode}
              connectSource={connectSource}
              onDepConnect={(taskId) => {
                if (!connectSource) setConnectSource(taskId);
                else {
                  handleAddDependency(connectSource, taskId);
                }
              }}
              onDragConnectStart={handleDragConnectStart}
            />
          ))}
        </div>
      )}

      {/* Minimap navigation */}
      {sortedTasks.length > 0 && (
        <div className="flex items-center gap-2 mt-2 px-1">
          <span className={`text-[8px] ${t.text.dimmed}`} style={{ fontWeight: 500 }}>
            {i.tbMinimap || 'Minimap'}
          </span>
          <div
            className={`relative rounded cursor-pointer ${t.isDark ? 'bg-slate-800/60 border border-white/5' : 'bg-slate-100 border border-slate-200'}`}
            style={{ width: MINIMAP_W, height: 28 }}
            onClick={handleMinimapClick}
          >
            {/* Mini task bars */}
            {sortedTasks.map((tk, idx) => {
              const startTs = tk.createdAt;
              const endTs = tk.dueDate || startTs + (tk.estimatedHours || 8) * 3600000;
              const left =
                Math.max(0, ((startTs - rangeStart) / DAY_MS) * zc.pxPerDay + LABEL_W) *
                minimapScale;
              const width = Math.max(1, ((endTs - startTs) / DAY_MS) * zc.pxPerDay * minimapScale);
              const top = (idx / sortedTasks.length) * 22 + 3;
              const isCp = showCriticalPath && criticalPathIds.has(tk.id);
              return (
                <div
                  key={tk.id}
                  className={`absolute rounded-sm ${isCp ? 'bg-amber-400/80' : t.isDark ? 'bg-indigo-400/40' : 'bg-indigo-400/50'}`}
                  style={{ left, width: Math.min(width, MINIMAP_W - left), top, height: 2 }}
                />
              );
            })}
            {/* Today marker */}
            <div
              className={`absolute top-0 bottom-0 w-px ${t.isDark ? 'bg-indigo-400/50' : 'bg-indigo-500/40'}`}
              style={{ left: (todayPx + LABEL_W) * minimapScale }}
            />
            {/* Viewport indicator */}
            <div
              className={`absolute top-0 bottom-0 rounded border ${t.isDark ? 'bg-white/5 border-white/20' : 'bg-indigo-500/10 border-indigo-300/50'}`}
              style={{
                left: minimapViewportX,
                width: Math.min(minimapViewportW, MINIMAP_W - minimapViewportX),
                cursor: 'grab',
              }}
              onMouseDown={handleMinimapDrag}
            />
          </div>
          {showCriticalPath && criticalPathIds.size > 0 && (
            <span className={`text-[8px] ${t.isDark ? 'text-amber-400/70' : 'text-amber-600/70'}`}>
              ★ {i.tbCriticalPathLabel || 'Critical'}: {criticalPathIds.size} {i.tbTasks || 'tasks'}
            </span>
          )}
        </div>
      )}

      {/* AI Optimization Suggestions */}
      {showAiOptimize && aiOptimizationSuggestions.length > 0 && (
        <div
          className={`mt-3 rounded-xl border p-3 ${t.isDark ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className={`w-3.5 h-3.5 ${t.isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            <span
              className={`text-[11px] ${t.isDark ? 'text-purple-300' : 'text-purple-700'}`}
              style={{ fontWeight: 600 }}
            >
              {i.tbAiOptTitle || 'AI Critical Path Optimization'}
            </span>
          </div>
          <div className="space-y-2">
            {aiOptimizationSuggestions.map((sug, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 p-2 rounded-lg ${t.isDark ? 'bg-slate-800/40' : 'bg-white'}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {sug.icon === 'bottleneck' && (
                    <TrendingDown
                      className={`w-3.5 h-3.5 ${t.isDark ? 'text-amber-400' : 'text-amber-600'}`}
                    />
                  )}
                  {sug.icon === 'parallel' && (
                    <Sparkles
                      className={`w-3.5 h-3.5 ${t.isDark ? 'text-green-400' : 'text-green-600'}`}
                    />
                  )}
                  {sug.icon === 'overdue' && (
                    <AlertTriangle
                      className={`w-3.5 h-3.5 ${t.isDark ? 'text-red-400' : 'text-red-600'}`}
                    />
                  )}
                  {sug.icon === 'blocked' && (
                    <Ban
                      className={`w-3.5 h-3.5 ${t.isDark ? 'text-orange-400' : 'text-orange-600'}`}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-[10px] block ${t.isDark ? 'text-white' : 'text-slate-800'}`}
                    style={{ fontWeight: 600 }}
                  >
                    {sug.title}
                  </span>
                  <span className={`text-[9px] block mt-0.5 ${t.text.dimmed}`}>
                    {sug.description}
                  </span>
                  {sug.taskIds.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {sug.taskIds.map((tid) => {
                        const tk = sortedTasks.find((t) => t.id === tid);
                        return tk ? (
                          <button
                            key={tid}
                            onClick={() => _onEdit(tk)}
                            className={`text-[8px] px-1.5 py-0.5 rounded ${t.isDark ? 'bg-white/5 text-indigo-300 hover:bg-white/10' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                          >
                            {tk.title.length > 20 ? tk.title.substring(0, 20) + '...' : tk.title}
                          </button>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drag date tooltip */}
      {dragTooltip && (
        <div
          className={`fixed z-[9999] px-2 py-1 rounded-md text-[10px] pointer-events-none shadow-lg ${
            t.isDark
              ? 'bg-slate-800 text-indigo-300 border border-indigo-500/30'
              : 'bg-white text-indigo-700 border border-indigo-200'
          }`}
          style={{ left: dragTooltip.x + 12, top: dragTooltip.y - 28, fontWeight: 600 }}
        >
          {dragTooltip.label}
        </div>
      )}
    </div>
  );
}

// ── Timeline Row (extracted for virtualization) ──

function TimelineRow({
  task,
  style,
  rangeStart,
  DAY_MS,
  zc,
  now,
  totalDays,
  todayPx,
  zoom,
  t,
  PRIORITY_BAR_COLORS,
  resizingTaskId,
  _onEdit,
  handleResizeStart,
  formatDate,
  isCriticalPath,
  depEditMode,
  connectSource,
  onDepConnect,
  onDragConnectStart,
}: {
  task: Task;
  style?: React.CSSProperties;
  rangeStart: number;
  DAY_MS: number;
  zc: { pxPerDay: number; labelEvery: number };
  now: number;
  totalDays: number;
  todayPx: number;
  zoom: string;
  t: ThemeTokens;
  PRIORITY_BAR_COLORS: Record<string, string>;
  resizingTaskId: string | null;
  _onEdit: (task: Task) => void;
  handleResizeStart: (
    e: React.MouseEvent,
    taskId: string,
    origTs: number,
    edge: 'left' | 'right'
  ) => void;
  formatDate: (ts: number) => string;
  isCriticalPath?: boolean;
  depEditMode?: boolean;
  connectSource?: string | null;
  onDepConnect?: (taskId: string) => void;
  onDragConnectStart?: (
    e: React.MouseEvent,
    taskId: string,
    barRightX: number,
    barCenterY: number
  ) => void;
}) {
  const startTs = task.createdAt;
  const endTs = task.dueDate || startTs + (task.estimatedHours || 8) * 3600000;
  const leftPx = Math.max(0, ((startTs - rangeStart) / DAY_MS) * zc.pxPerDay);
  const widthPx = Math.max(zc.pxPerDay, ((endTs - startTs) / DAY_MS) * zc.pxPerDay);
  const isOverdue = task.dueDate && task.dueDate < now && task.status !== 'done';

  return (
    <div
      style={style}
      className={`flex items-center border-b h-8 ${t.isDark ? 'border-white/5' : 'border-slate-100'}`}
    >
      <div
        className={`flex-shrink-0 flex items-center gap-1.5 px-2 truncate cursor-pointer ${t.isDark ? 'text-slate-300' : 'text-slate-700'}`}
        style={{ width: 200 }}
        onClick={() => _onEdit(task)}
        title={task.title}
      >
        <StatusIcon status={task.status} />
        <span
          className={`text-[10px] truncate ${task.status === 'done' ? 'line-through opacity-50' : ''}`}
          style={{ fontWeight: 500 }}
        >
          {task.title}
        </span>
        {task.source === 'ai-inferred' && (
          <Bot className="w-2.5 h-2.5 text-purple-400 flex-shrink-0" />
        )}
        {isCriticalPath && <span className="text-[7px] text-amber-400 flex-shrink-0">★</span>}
      </div>
      <div className="flex-1 relative h-full" style={{ minWidth: totalDays * zc.pxPerDay }}>
        <div
          className={`absolute top-0 bottom-0 w-px ${t.isDark ? 'bg-indigo-400/30' : 'bg-indigo-300/50'}`}
          style={{ left: todayPx }}
        />
        <div
          data-task-bar-id={task.id}
          className={`absolute top-1.5 h-5 rounded-md cursor-pointer transition-colors hover:brightness-110 group/bar ${PRIORITY_BAR_COLORS[task.priority]} ${isOverdue ? 'ring-1 ring-red-500/50' : ''} ${resizingTaskId === task.id ? 'ring-2 ring-indigo-400/50' : ''} ${isCriticalPath ? 'ring-2 ring-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.4)]' : ''} ${depEditMode && connectSource === task.id ? 'ring-2 ring-cyan-400 animate-pulse' : ''} ${depEditMode && connectSource && connectSource !== task.id ? 'ring-1 ring-cyan-400/40' : ''}`}
          style={{ left: leftPx, width: Math.min(widthPx, totalDays * zc.pxPerDay - leftPx) }}
          onClick={() => (depEditMode && onDepConnect ? onDepConnect(task.id) : _onEdit(task))}
          title={`${task.title}\n${formatDate(startTs)} → ${formatDate(endTs)}${isOverdue ? ' (Overdue!)' : ''}`}
        >
          {zoom !== 'month' && (
            <span
              className="text-[8px] text-white px-1 truncate block leading-5"
              style={{ fontWeight: 600 }}
            >
              {task.title.length > widthPx / 5
                ? task.title.substring(0, Math.floor(widthPx / 5)) + '…'
                : task.title}
            </span>
          )}
          {/* Left resize */}
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize group/left"
            onMouseDown={(e) => handleResizeStart(e, task.id, startTs, 'left')}
          >
            <div
              className={`absolute left-0 top-1 bottom-1 w-0.5 rounded-full opacity-0 group-hover/left:opacity-100 transition-opacity ${t.isDark ? 'bg-white/60' : 'bg-slate-600/60'}`}
            />
          </div>
          {/* Left dot — dep drop target */}
          <div
            data-task-bar-id={task.id}
            className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 opacity-0 group-hover/bar:opacity-100 transition-opacity z-10 ${t.isDark ? 'bg-cyan-400 border-cyan-300' : 'bg-cyan-500 border-cyan-400'}`}
          />
          {/* Right resize */}
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize group/right"
            onMouseDown={(e) => handleResizeStart(e, task.id, endTs, 'right')}
          >
            <div
              className={`absolute right-0 top-1 bottom-1 w-0.5 rounded-full opacity-0 group-hover/right:opacity-100 transition-opacity ${t.isDark ? 'bg-white/60' : 'bg-slate-600/60'}`}
            />
          </div>
          {/* Right dot — drag source for dep connect */}
          <div
            className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 opacity-0 group-hover/bar:opacity-100 transition-opacity cursor-crosshair z-10 ${t.isDark ? 'bg-emerald-400 border-emerald-300' : 'bg-emerald-500 border-emerald-400'}`}
            title="Drag to connect"
            onMouseDown={(e) => {
              if (onDragConnectStart) {
                const barEl = e.currentTarget.parentElement;
                const area = barEl?.closest('[data-timeline-area]');
                if (barEl && area) {
                  const br = barEl.getBoundingClientRect();
                  const ar = area.getBoundingClientRect();
                  onDragConnectStart(
                    e,
                    task.id,
                    br.right - ar.left,
                    br.top + br.height / 2 - ar.top
                  );
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Task Card (Kanban) ──

function TaskCard({
  task,
  t,
  i,
  isSelected,
  isExpanded,
  onToggleSelect,
  onExpand,
  onMove,
  onDelete,
  onDuplicate,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}: {
  task: Task;
  t: ThemeTokens;
  i: I18nStrings;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onExpand: () => void;
  onMove: (status: TaskStatus) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleSubtask: (stId: string) => void;
  onAddSubtask: (title: string) => void;
  onDeleteSubtask: (stId: string) => void;
}) {
  const PriorityIcon = PRIORITY_CONFIG[task.priority].icon;
  const TypeIcon = TYPE_CONFIG[task.type].icon;
  const [subInput, setSubInput] = useState('');
  const completedSubs = task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const totalSubs = task.subtasks?.length || 0;

  const [{ isDragging }, dragRef] = useDrag({
    type: TASK_DND_TYPE,
    item: { taskId: task.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={dragRef as unknown as React.Ref<HTMLDivElement>}
      className={`rounded-lg border p-2.5 cursor-grab active:cursor-grabbing transition-all ${
        isDragging
          ? 'opacity-40 scale-95'
          : isSelected
            ? t.isDark
              ? 'bg-indigo-500/10 border-indigo-500/30'
              : 'bg-indigo-50 border-indigo-300'
            : t.isDark
              ? 'bg-slate-900/40 border-white/5 hover:border-white/10'
              : 'bg-white border-slate-200/60 hover:border-slate-300'
      }`}
      onClick={onExpand}
    >
      {/* Top row */}
      <div className="flex items-start gap-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className="mt-0.5 flex-shrink-0"
        >
          {isSelected ? (
            <CheckSquare
              className={`w-3.5 h-3.5 ${t.isDark ? 'text-indigo-400' : 'text-indigo-500'}`}
            />
          ) : (
            <Square className={`w-3.5 h-3.5 ${t.text.dimmed}`} />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p
            className={`text-[11px] leading-snug ${t.isDark ? 'text-slate-200' : 'text-slate-800'} ${task.status === 'done' ? 'line-through opacity-60' : ''}`}
            style={{ fontWeight: 500 }}
          >
            {task.title}
          </p>
        </div>
        {task.source === 'ai-inferred' && <Bot className="w-3 h-3 text-purple-400 flex-shrink-0" />}
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        <span
          className={`inline-flex items-center gap-0.5 text-[9px] ${PRIORITY_CONFIG[task.priority].color}`}
        >
          <PriorityIcon className="w-2.5 h-2.5" />
          {priorityLabel(task.priority, i)}
        </span>
        <span
          className={`inline-flex items-center gap-0.5 text-[9px] ${TYPE_CONFIG[task.type].color}`}
        >
          <TypeIcon className="w-2.5 h-2.5" />
        </span>
        {totalSubs > 0 && (
          <span className={`text-[9px] ${t.text.dimmed}`}>
            {completedSubs}/{totalSubs}
          </span>
        )}
        {task.tags?.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className={`text-[8px] px-1 py-0.5 rounded ${t.isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div
          className={`mt-2 pt-2 border-t space-y-2 ${t.isDark ? 'border-white/5' : 'border-slate-100'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {task.description && <p className={`text-[10px] ${t.text.muted}`}>{task.description}</p>}

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-1">
              {task.subtasks.map((st) => (
                <div key={st.id} className="flex items-center gap-1.5 group">
                  <button onClick={() => onToggleSubtask(st.id)}>
                    {st.isCompleted ? (
                      <CheckSquare className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Square className={`w-3 h-3 ${t.text.dimmed}`} />
                    )}
                  </button>
                  <span
                    className={`text-[10px] flex-1 ${st.isCompleted ? 'line-through opacity-50' : t.isDark ? 'text-slate-300' : 'text-slate-600'}`}
                  >
                    {st.title}
                  </span>
                  <button
                    onClick={() => onDeleteSubtask(st.id)}
                    className={`opacity-0 group-hover:opacity-100 ${t.isDark ? 'text-red-400' : 'text-red-500'}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add subtask */}
          <div className="flex items-center gap-1.5">
            <input
              value={subInput}
              onChange={(e) => setSubInput(e.target.value)}
              placeholder={i.tbAddSubtask || 'Add subtask...'}
              className={`flex-1 px-2 py-1 rounded text-[10px] outline-none ${t.isDark ? 'bg-white/5 text-slate-300 placeholder-slate-600' : 'bg-slate-50 text-slate-700 placeholder-slate-400'}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && subInput.trim()) {
                  onAddSubtask(subInput.trim());
                  setSubInput('');
                }
              }}
            />
            <button
              onClick={() => {
                if (subInput.trim()) {
                  onAddSubtask(subInput.trim());
                  setSubInput('');
                }
              }}
              className={`p-1 rounded ${t.isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Quick move & actions */}
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_COLUMNS.filter((c) => c.status !== task.status).map((c) => (
              <button
                key={c.status}
                onClick={() => onMove(c.status)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] ${t.isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                <ArrowRight className="w-2.5 h-2.5" />
                {statusLabel(c.status, i)}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={onDuplicate}
              className={`p-1 rounded ${t.isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-50 text-slate-500'}`}
              title={i.tbDuplicate || 'Duplicate'}
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={onDelete}
              className={`p-1 rounded ${t.isDark ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
              title={i.tbDelete || 'Delete'}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Task List Row ──

function TaskListRow({
  task,
  t,
  i,
  isSelected,
  onToggleSelect,
  onMove,
  onDelete,
}: {
  task: Task;
  t: ThemeTokens;
  i: I18nStrings;
  isSelected: boolean;
  onToggleSelect: () => void;
  onMove: (status: TaskStatus) => void;
  onDelete: () => void;
}) {
  const PriorityIcon = PRIORITY_CONFIG[task.priority].icon;
  const TypeIcon = TYPE_CONFIG[task.type].icon;
  const completedSubs = task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const totalSubs = task.subtasks?.length || 0;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
        isSelected
          ? t.isDark
            ? 'bg-indigo-500/10 border-indigo-500/20'
            : 'bg-indigo-50 border-indigo-200'
          : t.isDark
            ? 'bg-slate-800/20 border-white/5 hover:bg-slate-800/40'
            : 'bg-white/60 border-slate-200/50 hover:bg-white'
      }`}
    >
      <button onClick={onToggleSelect} className="flex-shrink-0">
        {isSelected ? (
          <CheckSquare
            className={`w-3.5 h-3.5 ${t.isDark ? 'text-indigo-400' : 'text-indigo-500'}`}
          />
        ) : (
          <Square className={`w-3.5 h-3.5 ${t.text.dimmed}`} />
        )}
      </button>

      <StatusIcon status={task.status} />

      <div className="flex-1 min-w-0">
        <span
          className={`text-[12px] ${t.isDark ? 'text-slate-200' : 'text-slate-800'} ${task.status === 'done' ? 'line-through opacity-60' : ''}`}
          style={{ fontWeight: 500 }}
        >
          {task.title}
        </span>
        {task.description && (
          <span className={`text-[10px] ml-2 ${t.text.dimmed} truncate`}>{task.description}</span>
        )}
      </div>

      {task.source === 'ai-inferred' && <Bot className="w-3 h-3 text-purple-400 flex-shrink-0" />}

      {totalSubs > 0 && (
        <span className={`text-[9px] ${t.text.dimmed}`}>
          {completedSubs}/{totalSubs}
        </span>
      )}

      <span
        className={`inline-flex items-center gap-0.5 text-[9px] ${PRIORITY_CONFIG[task.priority].color}`}
      >
        <PriorityIcon className="w-3 h-3" />
      </span>

      <span className={`inline-flex items-center text-[9px] ${TYPE_CONFIG[task.type].color}`}>
        <TypeIcon className="w-3 h-3" />
      </span>

      {task.tags?.slice(0, 1).map((tag) => (
        <span
          key={tag}
          className={`text-[8px] px-1 py-0.5 rounded ${t.isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}
        >
          {tag}
        </span>
      ))}

      {/* Status move dropdown */}
      <select
        value={task.status}
        onChange={(e) => onMove(e.target.value as TaskStatus)}
        onClick={(e) => e.stopPropagation()}
        className={`text-[10px] px-1.5 py-0.5 rounded outline-none ${t.isDark ? 'bg-white/5 text-slate-300 border border-white/8' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}
      >
        {STATUS_COLUMNS.map((c) => (
          <option key={c.status} value={c.status}>
            {statusLabel(c.status, i)}
          </option>
        ))}
      </select>

      <button
        onClick={onDelete}
        className={`p-1 rounded flex-shrink-0 ${t.isDark ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Dependency Force-Directed Graph ──

function DependencyGraph({
  tasks,
  criticalPathIds,
  t,
  i,
  _onEdit,
}: {
  tasks: Task[];
  criticalPathIds: Set<string>;
  t: ThemeTokens;
  i: I18nStrings;
  _onEdit: (task: Task) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<
    Map<string, { x: number; y: number; vx: number; vy: number; task: Task }>
  >(new Map());
  const animRef = useRef<number>(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const PRI_COLORS: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#3b82f6',
    low: '#22c55e',
  };
  const STA_COLORS: Record<string, string> = {
    todo: '#94a3b8',
    'in-progress': '#3b82f6',
    review: '#f59e0b',
    done: '#22c55e',
    blocked: '#ef4444',
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const cw = canvas.offsetWidth,
      ch = canvas.offsetHeight;
    const nodes = nodesRef.current;
    const existingIds = new Set(nodes.keys());
    const newIds = new Set(tasks.map((tk) => tk.id));
    for (const eid of existingIds) {
      if (!newIds.has(eid)) nodes.delete(eid);
    }
    for (const tk of tasks) {
      if (!nodes.has(tk.id)) {
        nodes.set(tk.id, {
          x: cw / 2 + (Math.random() - 0.5) * cw * 0.6,
          y: ch / 2 + (Math.random() - 0.5) * ch * 0.6,
          vx: 0,
          vy: 0,
          task: tk,
        });
      } else {
        nodes.get(tk.id)!.task = tk;
      }
    }
    const edges: { from: string; to: string }[] = [];
    for (const tk of tasks) {
      for (const depId of tk.dependencies || []) {
        if (nodes.has(depId)) edges.push({ from: depId, to: tk.id });
      }
    }
    let iter = 0;
    const maxIter = 300;
    const simulate = () => {
      if (iter > maxIter) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      iter++;
      const alpha = 0.1 * Math.max(0, 1 - iter / maxIter);
      const na = Array.from(nodes.values());
      for (let ii = 0; ii < na.length; ii++) {
        for (let jj = ii + 1; jj < na.length; jj++) {
          const a = na[ii],
            b = na[jj];
          const dx = b.x - a.x,
            dy = b.y - a.y,
            dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const f = 8000 / (dist * dist),
            fx = (dx / dist) * f,
            fy = (dy / dist) * f;
          a.vx -= fx * alpha;
          a.vy -= fy * alpha;
          b.vx += fx * alpha;
          b.vy += fy * alpha;
        }
      }
      for (const e of edges) {
        const a = nodes.get(e.from),
          b = nodes.get(e.to);
        if (!a || !b) continue;
        const dx = b.x - a.x,
          dy = b.y - a.y,
          dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (dist - 120) * 0.01,
          fx = (dx / dist) * f,
          fy = (dy / dist) * f;
        a.vx += fx * alpha;
        a.vy += fy * alpha;
        b.vx -= fx * alpha;
        b.vy -= fy * alpha;
      }
      for (const n of na) {
        n.vx += (cw / 2 - n.x) * 0.001;
        n.vy += (ch / 2 - n.y) * 0.001;
        n.vx *= 0.85;
        n.vy *= 0.85;
        if (!dragRef.current || dragRef.current.id !== n.task.id) {
          n.x += n.vx;
          n.y += n.vy;
        }
        n.x = Math.max(30, Math.min(cw - 30, n.x));
        n.y = Math.max(30, Math.min(ch - 30, n.y));
      }
      draw();
      animRef.current = requestAnimationFrame(simulate);
    };
    const draw = () => {
      if (!ctx) return;
      const isDark = t.isDark;
      ctx.clearRect(0, 0, cw, ch);
      for (const e of edges) {
        const a = nodes.get(e.from),
          b = nodes.get(e.to);
        if (!a || !b) continue;
        const isCp = criticalPathIds.has(e.from) && criticalPathIds.has(e.to);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        const mx = (a.x + b.x) / 2,
          my = (a.y + b.y) / 2 - 20;
        ctx.quadraticCurveTo(mx, my, b.x, b.y);
        ctx.strokeStyle = isCp
          ? '#fbbf24'
          : isDark
            ? 'rgba(129,140,248,0.4)'
            : 'rgba(99,102,241,0.3)';
        ctx.lineWidth = isCp ? 2.5 : 1.5;
        if (!isCp) ctx.setLineDash([4, 3]);
        else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);
        const angle = Math.atan2(b.y - my, b.x - mx);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - 8 * Math.cos(angle - 0.3), b.y - 8 * Math.sin(angle - 0.3));
        ctx.lineTo(b.x - 8 * Math.cos(angle + 0.3), b.y - 8 * Math.sin(angle + 0.3));
        ctx.closePath();
        ctx.fillStyle = isCp ? '#fbbf24' : isDark ? '#818cf8' : '#6366f1';
        ctx.fill();
      }
      for (const [nid, n] of nodes) {
        const r = hovered === nid ? 22 : 18,
          isCp = criticalPathIds.has(nid);
        if (isCp) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(251,191,36,0.15)';
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        const sc = STA_COLORS[n.task.status] || '#94a3b8';
        ctx.fillStyle = sc + (isDark ? '40' : '30');
        ctx.fill();
        ctx.strokeStyle = sc;
        ctx.lineWidth = hovered === nid ? 2.5 : 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = PRI_COLORS[n.task.priority] || '#3b82f6';
        ctx.fill();
        ctx.fillStyle = isDark ? '#e2e8f0' : '#334155';
        ctx.font = `${hovered === nid ? 600 : 500} 9px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(
          n.task.title.length > 16 ? n.task.title.substring(0, 16) + '..' : n.task.title,
          n.x,
          n.y + r + 12
        );
      }
    };
    simulate();
    return () => cancelAnimationFrame(animRef.current);
  }, [tasks, criticalPathIds, t, hovered]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect(),
      mx = e.clientX - rect.left,
      my = e.clientY - rect.top;
    if (dragRef.current) {
      const n = nodesRef.current.get(dragRef.current.id);
      if (n) {
        n.x = mx;
        n.y = my;
      }
      return;
    }
    let found: string | null = null;
    for (const [id, n] of nodesRef.current) {
      if ((n.x - mx) ** 2 + (n.y - my) ** 2 < 400) {
        found = id;
        break;
      }
    }
    setHovered(found);
  }, []);
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect(),
      mx = e.clientX - rect.left,
      my = e.clientY - rect.top;
    for (const [id, n] of nodesRef.current) {
      if ((n.x - mx) ** 2 + (n.y - my) ** 2 < 400) {
        dragRef.current = { id, offsetX: n.x - mx, offsetY: n.y - my };
        break;
      }
    }
  }, []);
  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);
  const handleDblClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect(),
        mx = e.clientX - rect.left,
        my = e.clientY - rect.top;
      for (const [, n] of nodesRef.current) {
        if ((n.x - mx) ** 2 + (n.y - my) ** 2 < 400) {
          _onEdit(n.task);
          break;
        }
      }
    },
    [_onEdit]
  );

  return (
    <div
      className={`mb-3 rounded-xl border overflow-hidden ${t.isDark ? 'bg-slate-900/50 border-white/8' : 'bg-white/80 border-slate-200/60'}`}
    >
      <div
        className={`flex items-center gap-2 px-3 py-1.5 border-b ${t.isDark ? 'border-white/5' : 'border-slate-100'}`}
      >
        <GitBranch className={`w-3.5 h-3.5 ${t.isDark ? 'text-violet-400' : 'text-violet-500'}`} />
        <span
          className={`text-[11px] ${t.isDark ? 'text-slate-200' : 'text-slate-700'}`}
          style={{ fontWeight: 600 }}
        >
          {i.tbDepGraph || 'Dependency Graph'}
        </span>
        <span className={`text-[9px] ${t.text.dimmed}`}>
          {tasks.length} nodes · Dbl-click edit · Drag to move
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full cursor-grab active:cursor-grabbing"
        style={{ height: 320 }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDblClick}
      />
    </div>
  );
}

// ── Edit Task Modal ──

function EditTaskModal({
  task,
  t,
  i,
  onSave,
  onClose,
}: {
  task: Task;
  t: ThemeTokens;
  i: I18nStrings;
  onSave: (updates: Partial<Task>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description || '');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [type, setType] = useState<TaskType>(task.type);
  const [tags, setTags] = useState(task.tags?.join(', ') || '');
  const [estimatedHours, setEstimatedHours] = useState(task.estimatedHours?.toString() || '');
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().substring(0, 16) : ''
  );

  const inputCls = `w-full px-3 py-2 rounded-lg text-[12px] outline-none ${t.isDark ? 'bg-white/5 text-slate-200 border border-white/10' : 'bg-slate-50 text-slate-800 border border-slate-200'}`;
  const selectCls = `flex-1 px-2 py-1.5 rounded-lg text-[11px] outline-none ${t.isDark ? 'bg-white/5 text-slate-200 border border-white/10' : 'bg-slate-50 text-slate-700 border border-slate-200'}`;

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: desc.trim() || undefined,
      status,
      priority,
      type,
      tags: tags
        ? tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/30 flex items-center justify-center z-10"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className={`w-[480px] max-h-[70vh] rounded-xl border p-5 overflow-y-auto ${t.isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-[14px] ${t.isDark ? 'text-white' : 'text-slate-900'}`}
            style={{ fontWeight: 600 }}
          >
            <Pencil className="w-3.5 h-3.5 inline mr-1.5" />
            {i.tbEditTask || 'Edit Task'}
          </h3>
          {task.source === 'ai-inferred' && (
            <span className="flex items-center gap-1 text-[9px] text-purple-400">
              <Bot className="w-3 h-3" />
              AI · {task.confidence ? `${Math.round(task.confidence * 100)}%` : ''}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {/* Title */}
          <div>
            <label className={`text-[10px] mb-1 block ${t.text.muted}`}>
              {i.tbTitlePlaceholder || 'Title'}
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div>
            <label className={`text-[10px] mb-1 block ${t.text.muted}`}>
              {i.tbDescPlaceholder || 'Description'}
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Status + Priority + Type */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={`text-[10px] mb-1 block ${t.text.muted}`}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className={selectCls}
              >
                {STATUS_COLUMNS.map((c) => (
                  <option key={c.status} value={c.status}>
                    {statusLabel(c.status, i)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className={`text-[10px] mb-1 block ${t.text.muted}`}>
                {i.tbSortPriority || 'Priority'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={selectCls}
              >
                {(['critical', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {priorityLabel(p, i)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className={`text-[10px] mb-1 block ${t.text.muted}`}>
                {i.tbAllType || 'Type'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className={selectCls}
              >
                {(
                  ['feature', 'bug', 'refactor', 'test', 'documentation', 'other'] as TaskType[]
                ).map((tp) => (
                  <option key={tp} value={tp}>
                    {typeLabel(tp, i)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date + Estimated Hours */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={`text-[10px] mb-1 block ${t.text.muted}`}>
                <Calendar className="w-3 h-3 inline mr-1" />
                {i.tbSortDue || 'Due Date'}
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className={`text-[10px] mb-1 block ${t.text.muted}`}>
                <Timer className="w-3 h-3 inline mr-1" />
                {i.tbEstimated || 'Estimated (h)'}
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={`text-[10px] mb-1 block ${t.text.muted}`}>
              <Tag className="w-3 h-3 inline mr-1" />
              Tags (comma separated)
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="p1, ai, core"
              className={inputCls}
            />
          </div>

          {/* Related files */}
          {task.relatedFiles && task.relatedFiles.length > 0 && (
            <div>
              <label className={`text-[10px] mb-1 block ${t.text.muted}`}>
                <Link2 className="w-3 h-3 inline mr-1" />
                Related Files
              </label>
              <div className="flex flex-wrap gap-1">
                {task.relatedFiles.map((f) => (
                  <span
                    key={f}
                    className={`text-[9px] px-1.5 py-0.5 rounded ${t.isDark ? 'bg-cyan-500/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700'}`}
                  >
                    <FileText className="w-2.5 h-2.5 inline mr-0.5" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div
            className={`flex gap-4 text-[9px] pt-2 border-t ${t.isDark ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'}`}
          >
            <span>Created: {new Date(task.createdAt).toLocaleString('zh-CN')}</span>
            <span>Updated: {new Date(task.updatedAt).toLocaleString('zh-CN')}</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg text-[11px] ${t.isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {i.tbCancel || 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] ${t.isDark ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-40' : 'bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40'}`}
              style={{ fontWeight: 600 }}
            >
              <Save className="w-3 h-3" />
              {i.tbSave || 'Save'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
