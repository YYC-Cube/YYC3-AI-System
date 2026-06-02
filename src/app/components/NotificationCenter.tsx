/**
 * @file NotificationCenter.tsx
 * @description YYC³便携式智能AI系统 - 完整通知中心面板
 * Full Notification Center Panel
 * Slide-in panel with categorized notifications (System, Build, Collaboration, AI),
 * read/unread state, dismiss, mark-all-read, and clear-all actions.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,notifications,ui,alerts
 */

import {
  X,
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Monitor,
  Hammer,
  Users,
  Sparkles,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Info,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '../store';
import { getI18n, resolveKey } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

import { VirtualList } from './VirtualList';

type NotifCategory = 'system' | 'build' | 'collaboration' | 'ai';
type NotifLevel = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  category: NotifCategory;
  level: NotifLevel;
  titleKey: string;
  descKey: string;
  timestamp: number;
  read: boolean;
}

const CATEGORY_ICONS: Record<NotifCategory, React.FC<{ className?: string }>> = {
  system: Monitor,
  build: Hammer,
  collaboration: Users,
  ai: Sparkles,
};

const LEVEL_ICONS: Record<NotifLevel, React.FC<{ className?: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: AlertCircle,
};

const LEVEL_COLORS: Record<NotifLevel, { dot: string; icon: string }> = {
  info: { dot: 'bg-blue-500', icon: 'text-blue-400' },
  success: { dot: 'bg-emerald-500', icon: 'text-emerald-400' },
  warning: { dot: 'bg-amber-500', icon: 'text-amber-400' },
  error: { dot: 'bg-red-500', icon: 'text-red-400' },
};

/** Mock notification data with i18n keys */
function createMockNotifications(): Notification[] {
  const now = Date.now();
  return [
    {
      id: 'n1',
      category: 'system',
      level: 'success',
      titleKey: 'notifSystemReady',
      descKey: 'ncSystem',
      timestamp: now - 60000,
      read: false,
    },
    {
      id: 'n2',
      category: 'system',
      level: 'info',
      titleKey: 'notifUpdateAvailable',
      descKey: 'ncSystem',
      timestamp: now - 300000,
      read: false,
    },
    {
      id: 'n3',
      category: 'build',
      level: 'success',
      titleKey: 'notifBuildComplete',
      descKey: 'ncBuild',
      timestamp: now - 600000,
      read: false,
    },
    {
      id: 'n4',
      category: 'ai',
      level: 'success',
      titleKey: 'notifAiConnected',
      descKey: 'ncAi',
      timestamp: now - 1800000,
      read: false,
    },
    {
      id: 'n5',
      category: 'collaboration',
      level: 'info',
      titleKey: 'notifSyncComplete',
      descKey: 'ncCollaboration',
      timestamp: now - 3600000,
      read: true,
    },
    {
      id: 'n6',
      category: 'build',
      level: 'info',
      titleKey: 'notifDashboardBuild',
      descKey: 'ncBuild',
      timestamp: now - 7200000,
      read: true,
    },
    {
      id: 'n7',
      category: 'system',
      level: 'info',
      titleKey: 'notifAutoSaved',
      descKey: 'ncSystem',
      timestamp: now - 86400000,
      read: true,
    },
  ];
}

export function NotificationCenter() {
  const { theme, language, notificationCenterOpen, setNotificationCenterOpen } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const [notifications, setNotifications] = useState<Notification[]>(createMockNotifications);
  const [filterCategory, setFilterCategory] = useState<NotifCategory | 'all'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['today', 'earlier'])
  );

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // ── Listen for task-reminder CustomEvents from ReminderService ──
  useEffect(() => {
    const handler = (e: Event) => {
      const { reminder, task } = (e as CustomEvent).detail;
      const newNotif: Notification = {
        id: `task-${reminder.id}-${Date.now()}`,
        category: 'ai',
        level: reminder.type === 'deadline' ? 'warning' : 'info',
        titleKey: task.title,
        descKey: reminder.message,
        timestamp: Date.now(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
      toast.warning(reminder.message, { description: task.title });
    };
    window.addEventListener('task-reminder', handler);
    return () => window.removeEventListener('task-reminder', handler);
  }, []);

  const filtered = useMemo(() => {
    if (filterCategory === 'all') return notifications;
    return notifications.filter((n) => n.category === filterCategory);
  }, [notifications, filterCategory]);

  // Separate today vs earlier
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTs = todayStart.getTime();

  const todayNotifs = filtered.filter((n) => n.timestamp >= todayTs);
  const earlierNotifs = filtered.filter((n) => n.timestamp < todayTs);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success(i.toastAllRead);
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success(i.ncClearAll);
  };

  const dismissNotif = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const toggleSection = (section: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const categories: { key: NotifCategory | 'all'; labelKey: string }[] = [
    { key: 'all', labelKey: 'notifications' },
    { key: 'system', labelKey: 'ncSystem' },
    { key: 'build', labelKey: 'ncBuild' },
    { key: 'collaboration', labelKey: 'ncCollaboration' },
    { key: 'ai', labelKey: 'ncAi' },
  ];

  if (!notificationCenterOpen) return null;

  const renderSection = (title: string, sectionKey: string, notifs: Notification[]) => {
    if (notifs.length === 0) return null;
    const isExpanded = expandedCategories.has(sectionKey);
    return (
      <div key={sectionKey} className="mb-2">
        <button
          onClick={() => toggleSection(sectionKey)}
          className={`w-full flex items-center space-x-2 px-3 py-1.5 text-[11px] uppercase tracking-wider ${t.text.muted}`}
          style={{ fontWeight: 600 }}
        >
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span>{title}</span>
          <span
            className={`ml-auto px-1.5 py-0.5 rounded-full text-[9px] ${t.isDark ? 'bg-slate-700/50' : 'bg-slate-200'}`}
          >
            {notifs.length}
          </span>
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-1 px-1">
                {notifs.map((n) => (
                  <NotifItem
                    key={n.id}
                    notif={n}
                    t={t}
                    i={i}
                    onDismiss={dismissNotif}
                    onRead={markRead}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={() => setNotificationCenterOpen(false)}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`fixed right-0 top-0 bottom-0 z-[61] w-full max-w-sm flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl border-l`}
      >
        {/* ── Header ── */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${t.border.subtle}`}>
          <div className="flex items-center space-x-2.5">
            <Bell className={`w-5 h-5 ${t.accent.primary}`} />
            <span className="text-[15px]" style={{ fontWeight: 600 }}>
              {i.ncTitle}
            </span>
            {unreadCount > 0 && (
              <span
                className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px]"
                style={{ fontWeight: 700 }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={markAllRead}
              className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
              title={i.ncMarkAllRead}
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button
              onClick={clearAll}
              className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
              title={i.ncClearAll}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setNotificationCenterOpen(false)}
              className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Category filter tabs ── */}
        <div
          className={`flex items-center space-x-1 px-3 py-2 border-b ${t.border.subtle} overflow-x-auto`}
        >
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap ${t.transition} ${
                filterCategory === cat.key
                  ? `${t.accent.primaryBg} ${t.accent.primary}`
                  : t.interactive.headerBtn
              }`}
              style={{ fontWeight: filterCategory === cat.key ? 600 : 400 }}
            >
              {i[cat.labelKey as keyof typeof i] as string}
            </button>
          ))}
        </div>

        {/* ── Notification list ── */}
        <div className={`flex-1 overflow-hidden p-2 ${t.scrollbar}`}>
          {filtered.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center h-full text-center ${t.text.muted}`}
            >
              <BellOff className="w-10 h-10 mb-3 opacity-30" />
              <span className="text-[13px]">{i.ncNoNotifications}</span>
            </div>
          ) : filtered.length > 20 ? (
            /* Virtual scrolling for large notification lists */
            <VirtualList
              items={filtered}
              itemHeight={56}
              overscan={5}
              className="h-full"
              getKey={(n) => n.id}
              onItemActivate={(n) => markRead(n.id)}
              focusedClassName={
                t.isDark ? 'bg-indigo-500/8 rounded-xl' : 'bg-indigo-50/50 rounded-xl'
              }
              renderItem={(n, _idx, _isFocused) => (
                <NotifItem notif={n} t={t} i={i} onDismiss={dismissNotif} onRead={markRead} />
              )}
            />
          ) : (
            <div className="overflow-y-auto h-full">
              {renderSection(i.ncToday, 'today', todayNotifs)}
              {renderSection(i.ncEarlier, 'earlier', earlierNotifs)}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

/* ── Individual notification item ── */
function NotifItem({
  notif,
  t,
  i,
  onDismiss,
  onRead,
}: {
  notif: Notification;
  t: ReturnType<typeof getThemeTokens>;
  i: ReturnType<typeof getI18n>;
  onDismiss: (id: string) => void;
  onRead: (id: string) => void;
}) {
  const CatIcon = CATEGORY_ICONS[notif.category];
  const LvlIcon = LEVEL_ICONS[notif.level];
  const colors = LEVEL_COLORS[notif.level];

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return '< 1m';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  const titleText = resolveKey(i, notif.titleKey);

  return (
    <div
      onClick={() => onRead(notif.id)}
      className={`group flex items-start space-x-3 px-3 py-2.5 rounded-xl cursor-pointer ${t.transition} ${
        notif.read
          ? t.isDark
            ? 'bg-transparent hover:bg-slate-800/30'
            : 'bg-transparent hover:bg-slate-50'
          : t.isDark
            ? 'bg-slate-800/40 hover:bg-slate-700/40'
            : 'bg-indigo-50/40 hover:bg-indigo-50/60'
      }`}
    >
      {/* Level indicator */}
      <div className="flex flex-col items-center mt-1 space-y-1 flex-shrink-0">
        <LvlIcon className={`w-4 h-4 ${colors.icon}`} />
        {!notif.read && <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span
            className={`text-[12px] truncate ${notif.read ? t.text.muted : t.text.secondary}`}
            style={{ fontWeight: notif.read ? 400 : 500 }}
          >
            {titleText}
          </span>
          <span className={`text-[9px] flex-shrink-0 ml-2 ${t.text.dimmed}`}>
            {formatTime(notif.timestamp)}
          </span>
        </div>
        <div className="flex items-center space-x-1.5 mt-0.5">
          <CatIcon className={`w-3 h-3 ${t.text.dimmed}`} />
          <span className={`text-[10px] ${t.text.dimmed}`}>{resolveKey(i, notif.descKey)}</span>
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notif.id);
        }}
        className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 ${t.transition} ${t.interactive.iconBtn} flex-shrink-0`}
        title={i.ncDismiss}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
