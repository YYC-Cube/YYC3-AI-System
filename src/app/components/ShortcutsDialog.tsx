/**
 * @file ShortcutsDialog.tsx
 * @description YYC³便携式智能AI系统 - 键盘快捷键对话框
 * Keyboard Shortcuts Dialog
 * Full keyboard shortcut reference overlay
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,shortcuts,keyboard,dialog
 */

import { X, Keyboard } from 'lucide-react';
import React from 'react';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; desc: string }[];
}

export function ShortcutsDialog() {
  const { theme, language, shortcutsDialogOpen, setShortcutsDialogOpen } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  if (!shortcutsDialogOpen) return null;

  const groups: ShortcutGroup[] = [
    {
      title: i.scViewSwitch,
      shortcuts: [
        { keys: 'Esc', desc: i.scBackToCode },
        { keys: 'Ctrl+1', desc: i.scSwitchPreview },
        { keys: 'Ctrl+2', desc: i.scSwitchCode },
      ],
    },
    {
      title: i.scTerminalPanel,
      shortcuts: [
        { keys: 'Ctrl+K', desc: i.scCommandPalette },
        { keys: 'Ctrl+Shift+T', desc: i.scToggleTerminal },
        { keys: 'Ctrl+Shift+F', desc: i.scGlobalSearch },
        { keys: 'Ctrl+,', desc: i.scOpenSettings },
      ],
    },
    {
      title: i.scProjectOps,
      shortcuts: [
        { keys: 'Ctrl+Shift+P', desc: i.scProjectMgmt },
        { keys: 'Ctrl+Shift+N', desc: i.scNotifications },
        { keys: 'Ctrl+Shift+G', desc: i.scGithub },
        { keys: 'Ctrl+Shift+S', desc: i.scShareProject },
        { keys: 'Ctrl+Shift+D', desc: i.scDeploy },
        { keys: 'Ctrl+Shift+Q', desc: i.scQuickActions },
      ],
    },
    {
      title: i.scEditor,
      shortcuts: [
        { keys: 'Ctrl+Shift+L', desc: i.scSwitchLang },
        { keys: 'Ctrl+Shift+A', desc: i.modelManagement },
        { keys: 'Ctrl+Shift+M', desc: i.scMoreMenu },
        { keys: 'Ctrl+Tab', desc: i.tsCycleNext },
        { keys: 'Ctrl+Shift+Tab', desc: i.tsCyclePrev },
      ],
    },
    {
      title: i.cpTools,
      shortcuts: [
        { keys: 'Ctrl+Shift+E', desc: i.erTitle },
        { keys: 'Ctrl+Shift+R', desc: i.apiTitle },
        { keys: 'Ctrl+Shift+I', desc: i.dgTitle },
        { keys: 'Ctrl+Shift+W', desc: i.mwTitle },
        { keys: 'Ctrl+Shift+B', desc: i.dbTitle },
        { keys: 'Ctrl+Shift+Y', desc: i.tmTitle },
        { keys: 'Ctrl+Shift+J', desc: i.wbTitle },
        { keys: 'Ctrl+Shift+K', desc: i.dpTitle },
        { keys: 'Ctrl+Shift+U', desc: i.snTitle },
        { keys: 'Ctrl+Shift+O', desc: i.plTitle },
        { keys: 'Ctrl+Shift+H', desc: i.swTitle },
        { keys: 'Ctrl+Shift+X', desc: i.sdTitle },
        { keys: 'Ctrl+Alt+R', desc: i.rcTitle },
        { keys: 'Ctrl+Alt+S', desc: i.sbTitle },
        { keys: 'Ctrl+Alt+Q', desc: i.vqTitle },
      ],
    },
    {
      title: i.scChat,
      shortcuts: [
        { keys: 'Enter', desc: i.scSendMessage },
        { keys: 'Shift+Enter', desc: i.scNewline },
        { keys: '/', desc: i.scSlashCommands },
      ],
    },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={() => setShortcutsDialogOpen(false)}
      />
      <div className={`fixed inset-0 z-[61] flex items-center justify-center p-4`}>
        <div
          className={`w-full max-w-lg max-h-[80vh] rounded-2xl overflow-hidden ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-6 py-4 border-b ${t.border.subtle}`}
          >
            <div className="flex items-center space-x-2.5">
              <Keyboard className={`w-5 h-5 ${t.accent.primary}`} />
              <span className="text-[15px]" style={{ fontWeight: 600 }}>
                {i.shortcuts}
              </span>
            </div>
            <button
              onClick={() => setShortcutsDialogOpen(false)}
              className={`p-1.5 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-72px)] space-y-5">
            {groups.map((group) => (
              <div key={group.title}>
                <h3
                  className={`text-[11px] uppercase tracking-wider mb-2 ${t.text.muted}`}
                  style={{ fontWeight: 600 }}
                >
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.shortcuts.map((s) => (
                    <div
                      key={s.keys}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg ${t.isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}
                    >
                      <span className={`text-[12px] ${t.text.secondary}`}>{s.desc}</span>
                      <div className="flex items-center space-x-1">
                        {s.keys.split('+').map((key, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && <span className={`text-[10px] ${t.text.dimmed}`}>+</span>}
                            <kbd
                              className={`px-2 py-0.5 rounded text-[10px] ${t.kbd}`}
                              style={{ fontWeight: 500 }}
                            >
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
