/**
 * @file task-board-utils.ts
 * @description TaskBoard 共享常量、配置与工具函数
 */

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Bug,
  Circle,
  FileCode,
  Minus,
  Sparkles,
  TestTube,
} from 'lucide-react';

import type { TaskPriority, TaskStatus, TaskType } from '../services/task-store';
import type { I18nStrings } from '../utils/i18n';

// ── DnD ──

export const TASK_DND_TYPE = 'TASK_CARD';

// ── Status Column Config ──

export const STATUS_COLUMNS: {
  status: TaskStatus;
  colorClass: string;
  iconDark: string;
  iconLight: string;
}[] = [
  {
    status: 'todo',
    colorClass: 'text-slate-400',
    iconDark: 'bg-slate-500/15',
    iconLight: 'bg-slate-100',
  },
  {
    status: 'in-progress',
    colorClass: 'text-blue-400',
    iconDark: 'bg-blue-500/15',
    iconLight: 'bg-blue-50',
  },
  {
    status: 'review',
    colorClass: 'text-amber-400',
    iconDark: 'bg-amber-500/15',
    iconLight: 'bg-amber-50',
  },
  {
    status: 'done',
    colorClass: 'text-emerald-400',
    iconDark: 'bg-emerald-500/15',
    iconLight: 'bg-emerald-50',
  },
  {
    status: 'blocked',
    colorClass: 'text-red-400',
    iconDark: 'bg-red-500/15',
    iconLight: 'bg-red-50',
  },
];

// ── Priority Config ──

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { icon: React.ComponentType<any>; color: string; label: string }
> = {
  critical: { icon: AlertTriangle, color: 'text-red-500', label: '紧急' },
  high: { icon: ArrowUp, color: 'text-orange-400', label: '高' },
  medium: { icon: Minus, color: 'text-yellow-400', label: '中' },
  low: { icon: ArrowDown, color: 'text-green-400', label: '低' },
};

// ── Type Config ──

export const TYPE_CONFIG: Record<TaskType, { icon: React.ComponentType<any>; color: string }> = {
  feature: { icon: Sparkles, color: 'text-indigo-400' },
  bug: { icon: Bug, color: 'text-red-400' },
  refactor: { icon: FileCode, color: 'text-cyan-400' },
  test: { icon: TestTube, color: 'text-green-400' },
  documentation: { icon: BookOpen, color: 'text-amber-400' },
  other: { icon: Circle, color: 'text-slate-400' },
};

// ── Label Helpers ──

export function statusLabel(status: TaskStatus, i: I18nStrings): string {
  const map: Record<TaskStatus, string> = {
    todo: i.tbTodo || 'To Do',
    'in-progress': i.tbInProgress || 'In Progress',
    review: i.tbReview || 'Review',
    done: i.tbDone || 'Done',
    blocked: i.tbBlocked || 'Blocked',
  };
  return map[status];
}

export function priorityLabel(p: TaskPriority, i: I18nStrings): string {
  const map: Record<TaskPriority, string> = {
    critical: i.tbCritical || 'Critical',
    high: i.tbHigh || 'High',
    medium: i.tbMedium || 'Medium',
    low: i.tbLow || 'Low',
  };
  return map[p];
}

export function typeLabel(t: TaskType, i: I18nStrings): string {
  const map: Record<TaskType, string> = {
    feature: i.tbFeature || 'Feature',
    bug: i.tbBug || 'Bug',
    refactor: i.tbRefactor || 'Refactor',
    test: i.tbTest || 'Test',
    documentation: i.tbDocumentation || 'Docs',
    other: i.tbOther || 'Other',
  };
  return map[t];
}
