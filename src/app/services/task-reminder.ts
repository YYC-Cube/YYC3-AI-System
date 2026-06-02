/**
 * file: task-reminder.ts
 * description: 任务提醒服务 - 基于定时器的提醒系统，支持浏览器通知API
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-03-19
 * updated: 2026-04-01
 * status: active
 * tags: [service],[reminder],[notification]
 *
 * brief: 任务提醒服务，支持多种提醒类型
 *
 * details:
 * - 基于定时器的提醒系统
 * - 浏览器通知API集成
 * - 自定义事件分发
 * - 支持截止日期提醒
 * - 支持依赖关系提醒
 * - 支持阻塞状态提醒
 * - 支持进度提醒
 *
 * dependencies: Task Store, Notification API
 * exports: reminderService, ReminderService
 * notes: 需要用户授权通知权限
 */

import { useTaskStore, type Reminder, type Task } from './task-store'

class ReminderService {
  private checkInterval: ReturnType<typeof setInterval> | null = null
  private isRunning = false

  /** Start reminder polling loop (every 30 s) */
  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.requestNotificationPermission()
    this.checkReminders()
    this.checkInterval = setInterval(() => this.checkReminders(), 30_000)
  }

  /** Stop the reminder polling loop */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.isRunning = false
  }

  /** Core check loop */
  private checkReminders(): void {
    const { reminders, tasks, markReminderRead } = useTaskStore.getState()
    const now = Date.now()

    for (const reminder of reminders) {
      if (reminder.isTriggered || reminder.isRead) continue
      if (reminder.remindAt > now) continue

      const task = tasks.find(t => t.id === reminder.taskId)
      if (!task) continue

      this.triggerReminder(reminder, task)
      markReminderRead(reminder.id)
    }

    // Auto-check overdue tasks without reminders
    this.checkOverdueTasks(tasks, reminders)
  }

  /** Fire a reminder — dispatch CustomEvent + show browser notification */
  private triggerReminder(reminder: Reminder, task: Task): void {
    // Dispatch for in-app notification center
    window.dispatchEvent(new CustomEvent('task-reminder', {
      detail: { reminder, task },
    }))

    // Browser notification
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(task.title, {
          body: reminder.message,
          tag: reminder.id,
          icon: '/icons/yyc3-icon.png',
        })
      } catch {
        // Notification not available in this context
      }
    }
  }

  /** Auto-create deadline reminders for overdue tasks */
  private checkOverdueTasks(tasks: Task[], reminders: Reminder[]): void {
    const now = Date.now()
    const { addReminder } = useTaskStore.getState()

    for (const task of tasks) {
      if (task.isArchived || task.status === 'done') continue
      if (!task.dueDate) continue

      // Overdue: create a one-time reminder if not already exists
      if (task.dueDate < now) {
        const exists = reminders.some(r => r.taskId === task.id && r.type === 'deadline' && !r.isRead)
        if (!exists) {
          addReminder({
            taskId: task.id,
            type: 'deadline',
            message: `任务已过期: ${task.title}`,
            remindAt: now,
          })
        }
      }
      // Approaching deadline (< 24 h)
      else if (task.dueDate - now < 86400000) {
        const exists = reminders.some(r => r.taskId === task.id && r.type === 'deadline' && !r.isRead)
        if (!exists) {
          addReminder({
            taskId: task.id,
            type: 'deadline',
            message: `任务即将在 24 小时内到期: ${task.title}`,
            remindAt: now,
          })
        }
      }
    }
  }

  /** Manually create a deadline reminder */
  createDeadlineReminder(taskId: string, dueDate: number): void {
    const remindAt = dueDate - 86400000 // 24h before
    useTaskStore.getState().addReminder({
      taskId,
      type: 'deadline',
      message: '任务即将在 24 小时后到期',
      remindAt: Math.max(remindAt, Date.now()),
    })
  }

  /** Create a dependency-completed reminder */
  createDependencyReminder(taskId: string, dependencyTitle: string): void {
    useTaskStore.getState().addReminder({
      taskId,
      type: 'dependency',
      message: `依赖任务 "${dependencyTitle}" 已完成`,
      remindAt: Date.now(),
    })
  }

  /** Create a blocking reminder */
  createBlockingReminder(taskId: string, blockingTitle: string): void {
    useTaskStore.getState().addReminder({
      taskId,
      type: 'blocking',
      message: `任务被 "${blockingTitle}" 阻塞`,
      remindAt: Date.now(),
    })
  }

  /** Get unread reminder count */
  getUnreadCount(): number {
    return useTaskStore.getState().reminders.filter(r => !r.isRead && !r.isTriggered).length
  }

  /** Send a notification */
  sendNotification(message: string): void {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('YYC³', {
          body: message,
          icon: '/icons/yyc3-icon.png',
        })
      } catch {
        // Notification not available in this context
      }
    }
  }

  /** Request notification permission */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof Notification === 'undefined') {
      return 'denied' as NotificationPermission
    }
    if (Notification.permission === 'granted') {
      return 'granted'
    }
    const permission = await Notification.requestPermission()
    return permission
  }

  /** Check if notifications are supported */
  hasNotificationSupport(): boolean {
    return typeof Notification !== 'undefined'
  }
}

export const reminderService = new ReminderService()
