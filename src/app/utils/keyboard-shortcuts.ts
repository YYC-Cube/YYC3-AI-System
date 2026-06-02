/**
 * @file keyboard-shortcuts.ts
 * @description YYC³便携式智能AI系统 - 自定义快捷键映射系统
 * Custom Keyboard Shortcuts Mapping System
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,keyboard,shortcuts,hotkeys
 */

export interface ShortcutDefinition {
  id: string;
  name: string;
  description: string;
  category: 'navigation' | 'editor' | 'file' | 'ai' | 'terminal' | 'ui' | 'system';
  defaultKey: string;
  currentKey?: string;
  action: () => void;
  when?: () => boolean;
  icon?: string;
}

export interface ShortcutBinding {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

export interface ShortcutCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  { id: 'navigation', name: '导航', description: '页面和面板导航快捷键', icon: '🧭' },
  { id: 'editor', name: '编辑器', description: '代码编辑相关快捷键', icon: '📝' },
  { id: 'file', name: '文件', description: '文件操作快捷键', icon: '📁' },
  { id: 'ai', name: 'AI功能', description: 'AI辅助功能快捷键', icon: '🤖' },
  { id: 'terminal', name: '终端', description: '终端操作快捷键', icon: '💻' },
  { id: 'ui', name: '界面', description: '界面控制快捷键', icon: '🎨' },
  { id: 'system', name: '系统', description: '系统级快捷键', icon: '⚙️' },
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const _META_KEY = isMac ? 'metaKey' : 'ctrlKey';
void _META_KEY;

function parseKeyBinding(binding: string): ShortcutBinding {
  const parts = binding.toLowerCase().split('+');
  const result: ShortcutBinding = { key: '' };

  for (const part of parts) {
    switch (part) {
      case 'ctrl':
      case 'cmd':
      case 'command':
        result.ctrl = true;
        result.meta = isMac;
        break;
      case 'alt':
      case 'option':
        result.alt = true;
        break;
      case 'shift':
        result.shift = true;
        break;
      default:
        result.key = part;
    }
  }

  return result;
}

function formatKeyBinding(binding: ShortcutBinding): string {
  const parts: string[] = [];

  if (binding.ctrl || binding.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (binding.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (binding.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }

  const keyMap: Record<string, string> = {
    enter: '↵',
    escape: 'Esc',
    space: '␣',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
    backspace: '⌫',
    delete: '⌦',
    tab: '⇥',
  };

  parts.push(keyMap[binding.key.toLowerCase()] || binding.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}

class KeyboardShortcutsManager {
  private shortcuts: Map<string, ShortcutDefinition> = new Map();
  private keyBindings: Map<string, string> = new Map();
  private enabled = true;
  private listeners: Set<(event: KeyboardEvent) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }

  register(shortcut: ShortcutDefinition): void {
    this.shortcuts.set(shortcut.id, shortcut);
    const key = shortcut.currentKey || shortcut.defaultKey;
    this.keyBindings.set(this.normalizeKey(key), shortcut.id);
  }

  unregister(id: string): void {
    const shortcut = this.shortcuts.get(id);
    if (shortcut) {
      const key = shortcut.currentKey || shortcut.defaultKey;
      this.keyBindings.delete(this.normalizeKey(key));
      this.shortcuts.delete(id);
    }
  }

  updateBinding(id: string, newKey: string): boolean {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return false;

    const oldKey = shortcut.currentKey || shortcut.defaultKey;
    this.keyBindings.delete(this.normalizeKey(oldKey));

    const conflictId = this.keyBindings.get(this.normalizeKey(newKey));
    if (conflictId && conflictId !== id) {
      return false;
    }

    shortcut.currentKey = newKey;
    this.keyBindings.set(this.normalizeKey(newKey), id);
    this.saveToStorage();

    return true;
  }

  resetBinding(id: string): void {
    const shortcut = this.shortcuts.get(id);
    if (shortcut) {
      const currentKey = shortcut.currentKey || shortcut.defaultKey;
      this.keyBindings.delete(this.normalizeKey(currentKey));
      shortcut.currentKey = undefined;
      this.keyBindings.set(this.normalizeKey(shortcut.defaultKey), id);
      this.saveToStorage();
    }
  }

  resetAll(): void {
    this.shortcuts.forEach((shortcut, id) => {
      const currentKey = shortcut.currentKey || shortcut.defaultKey;
      this.keyBindings.delete(this.normalizeKey(currentKey));
      shortcut.currentKey = undefined;
      this.keyBindings.set(this.normalizeKey(shortcut.defaultKey), id);
    });
    this.saveToStorage();
  }

  getShortcut(id: string): ShortcutDefinition | undefined {
    return this.shortcuts.get(id);
  }

  getAllShortcuts(): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcutsByCategory(category: string): ShortcutDefinition[] {
    return this.getAllShortcuts().filter((s) => s.category === category);
  }

  getFormattedKey(id: string): string {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return '';

    const binding = parseKeyBinding(shortcut.currentKey || shortcut.defaultKey);
    return formatKeyBinding(binding);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  addListener(listener: (event: KeyboardEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = this.eventToKey(event);
    const shortcutId = this.keyBindings.get(key);

    if (shortcutId) {
      const shortcut = this.shortcuts.get(shortcutId);
      if (shortcut && (!shortcut.when || shortcut.when())) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();

        this.listeners.forEach((listener) => listener(event));
      }
    }
  }

  private eventToKey(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');

    parts.push(event.key.toLowerCase());

    return parts.join('+');
  }

  private normalizeKey(binding: string): string {
    const parsed = parseKeyBinding(binding);
    const parts: string[] = [];

    if (parsed.ctrl || parsed.meta) parts.push('ctrl');
    if (parsed.alt) parts.push('alt');
    if (parsed.shift) parts.push('shift');
    parts.push(parsed.key.toLowerCase());

    return parts.join('+');
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;

    const bindings: Record<string, string> = {};
    this.shortcuts.forEach((shortcut, id) => {
      if (shortcut.currentKey) {
        bindings[id] = shortcut.currentKey;
      }
    });

    localStorage.setItem('yyc3-shortcuts', JSON.stringify(bindings));
  }

  loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem('yyc3-shortcuts');
      if (stored) {
        const bindings: Record<string, string> = JSON.parse(stored);
        Object.entries(bindings).forEach(([id, key]) => {
          const shortcut = this.shortcuts.get(id);
          if (shortcut) {
            const oldKey = shortcut.currentKey || shortcut.defaultKey;
            this.keyBindings.delete(this.normalizeKey(oldKey));
            shortcut.currentKey = key;
            this.keyBindings.set(this.normalizeKey(key), id);
          }
        });
      }
    } catch (e) {
      console.warn('[KeyboardShortcuts] Failed to load shortcuts from storage:', e);
    }
  }

  exportBindings(): string {
    const bindings: Record<string, string> = {};
    this.shortcuts.forEach((shortcut, id) => {
      bindings[id] = shortcut.currentKey || shortcut.defaultKey;
    });
    return JSON.stringify(bindings, null, 2);
  }

  importBindings(json: string): void {
    try {
      const bindings: Record<string, string> = JSON.parse(json);
      Object.entries(bindings).forEach(([id, key]) => {
        this.updateBinding(id, key);
      });
    } catch (e) {
      console.warn('[KeyboardShortcuts] Failed to import bindings:', e);
    }
  }
}

export const keyboardShortcuts = new KeyboardShortcutsManager();

export function initializeDefaultShortcuts(): void {
  const defaultShortcuts: ShortcutDefinition[] = [
    {
      id: 'command-palette',
      name: '命令面板',
      description: '打开命令面板快速执行命令',
      category: 'navigation',
      defaultKey: 'ctrl+shift+p',
      action: () => {
        const store = require('../store').useAppStore.getState();
        store.setCommandPaletteOpen(true);
      },
    },
    {
      id: 'quick-search',
      name: '快速搜索',
      description: '在项目中快速搜索文件和内容',
      category: 'navigation',
      defaultKey: 'ctrl+p',
      action: () => {
        const store = require('../store').useAppStore.getState();
        store.setSearchPanelOpen(true);
      },
    },
    {
      id: 'toggle-terminal',
      name: '切换终端',
      description: '显示/隐藏集成终端',
      category: 'terminal',
      defaultKey: 'ctrl+`',
      action: () => {
        const store = require('../store').useAppStore.getState();
        store.toggleTerminal();
      },
    },
    {
      id: 'toggle-sidebar',
      name: '切换侧边栏',
      description: '显示/隐藏侧边栏',
      category: 'ui',
      defaultKey: 'ctrl+b',
      action: () => {
        console.log('Toggle sidebar');
      },
    },
    {
      id: 'new-file',
      name: '新建文件',
      description: '创建新文件',
      category: 'file',
      defaultKey: 'ctrl+n',
      action: () => {
        console.log('New file');
      },
    },
    {
      id: 'save-file',
      name: '保存文件',
      description: '保存当前文件',
      category: 'file',
      defaultKey: 'ctrl+s',
      action: () => {
        console.log('Save file');
      },
    },
    {
      id: 'save-all',
      name: '保存全部',
      description: '保存所有打开的文件',
      category: 'file',
      defaultKey: 'ctrl+shift+s',
      action: () => {
        console.log('Save all');
      },
    },
    {
      id: 'close-tab',
      name: '关闭标签页',
      description: '关闭当前标签页',
      category: 'ui',
      defaultKey: 'ctrl+w',
      action: () => {
        console.log('Close tab');
      },
    },
    {
      id: 'format-code',
      name: '格式化代码',
      description: '格式化当前文件代码',
      category: 'editor',
      defaultKey: 'alt+shift+f',
      action: () => {
        console.log('Format code');
      },
    },
    {
      id: 'ai-assist',
      name: 'AI助手',
      description: '打开AI助手面板',
      category: 'ai',
      defaultKey: 'ctrl+i',
      action: () => {
        console.log('AI assist');
      },
    },
    {
      id: 'ai-code-complete',
      name: 'AI代码补全',
      description: '触发AI代码补全建议',
      category: 'ai',
      defaultKey: 'alt+\\',
      action: () => {
        console.log('AI code complete');
      },
    },
    {
      id: 'go-to-definition',
      name: '跳转到定义',
      description: '跳转到符号定义位置',
      category: 'navigation',
      defaultKey: 'f12',
      action: () => {
        console.log('Go to definition');
      },
    },
    {
      id: 'go-to-line',
      name: '跳转到行',
      description: '跳转到指定行号',
      category: 'navigation',
      defaultKey: 'ctrl+g',
      action: () => {
        console.log('Go to line');
      },
    },
    {
      id: 'find',
      name: '查找',
      description: '在当前文件中查找',
      category: 'editor',
      defaultKey: 'ctrl+f',
      action: () => {
        console.log('Find');
      },
    },
    {
      id: 'find-replace',
      name: '查找替换',
      description: '在当前文件中查找并替换',
      category: 'editor',
      defaultKey: 'ctrl+h',
      action: () => {
        console.log('Find and replace');
      },
    },
    {
      id: 'find-in-files',
      name: '在文件中查找',
      description: '在所有文件中搜索',
      category: 'editor',
      defaultKey: 'ctrl+shift+f',
      action: () => {
        const store = require('../store').useAppStore.getState();
        store.setSearchPanelOpen(true);
      },
    },
    {
      id: 'toggle-theme',
      name: '切换主题',
      description: '在明暗主题之间切换',
      category: 'ui',
      defaultKey: 'ctrl+shift+t',
      action: () => {
        const store = require('../store').useAppStore.getState();
        store.toggleTheme();
      },
    },
    {
      id: 'settings',
      name: '设置',
      description: '打开设置页面',
      category: 'system',
      defaultKey: 'ctrl+,',
      action: () => {
        window.location.href = '/settings';
      },
    },
    {
      id: 'help',
      name: '帮助',
      description: '显示快捷键帮助',
      category: 'system',
      defaultKey: 'f1',
      action: () => {
        const store = require('../store').useAppStore.getState();
        store.setShortcutsDialogOpen(true);
      },
    },
  ];

  defaultShortcuts.forEach((shortcut) => {
    keyboardShortcuts.register(shortcut);
  });

  keyboardShortcuts.loadFromStorage();
}

if (typeof window !== 'undefined') {
  initializeDefaultShortcuts();
}
