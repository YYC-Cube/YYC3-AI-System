/**
 * @file LeftToolbar.tsx
 * @description YYC³便携式智能AI系统 - 左侧工具栏(AI模型选择器+实用图标)
 * Left column toolbar - AI model selector + utility icons (all functional)
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,toolbar,left,ai-models
 */

import {
  Bot,
  Puzzle,
  Settings,
  HelpCircle,
  Loader2,
  BookOpen,
  MessageSquare,
  Zap,
  Download,
  Star,
  Info,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '../../store';
import { getI18n } from '../../utils/i18n';
import { getThemeTokens } from '../../utils/theme';

export function LeftToolbar() {
  const { theme, language, aiModels, activeModelId, activateAIModel, openModelSettings } =
    useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);
  const [showPlugins, setShowPlugins] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const activeModel = aiModels.find((m) => m.id === activeModelId);

  const pluginItems = [
    { name: 'Code Analyzer', desc: i.pluginCodeAnalyzer, installed: true },
    { name: 'Design Sync', desc: i.pluginDesignSync, installed: true },
    { name: 'Test Generator', desc: i.pluginTestGenerator, installed: false },
    { name: 'Doc Writer', desc: i.pluginDocWriter, installed: false },
  ];

  const helpItems = [
    { label: i.helpDocs, icon: BookOpen, action: () => toast.info(i.toastDocsOpened) },
    {
      label: i.shortcuts,
      icon: Zap,
      action: () => useAppStore.getState().setShortcutsDialogOpen(true),
    },
    { label: i.helpFeedback, icon: MessageSquare, action: () => toast.info(i.toastFeedbackSent) },
    {
      label: i.helpAbout,
      icon: Info,
      action: () => toast.info(`YYC³ PortAISys v1.0.0\n${i.brandTagline}`),
    },
  ];

  return (
    <div
      className={`h-8 flex items-center justify-between px-2 flex-shrink-0 border-b ${t.transition} ${t.border.subtle} ${t.surface.glassHeader}`}
    >
      {/* Left: AI icon + model selector + connectivity dot */}
      <div className="flex items-center space-x-1.5 min-w-0">
        <div
          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${t.accent.primaryBg}`}
        >
          <Bot className={`w-3 h-3 ${t.accent.primary}`} />
        </div>

        {aiModels.length > 0 ? (
          <>
            <select
              value={activeModelId || ''}
              onChange={(e) => {
                if (e.target.value) {
                  activateAIModel(e.target.value);
                  const model = aiModels.find((m) => m.id === e.target.value);
                  toast.success(`${i.toastSwitchedTo} ${model?.name}`);
                }
              }}
              className={`text-[11px] px-1.5 py-0.5 rounded outline-none cursor-pointer ${t.transition} min-w-0 max-w-[120px] ${t.input.select}`}
              style={{ fontWeight: 500 }}
            >
              {!activeModelId && <option value="">{i.selectModel}</option>}
              {aiModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            {/* Real-time connectivity indicator */}
            {activeModel && (
              <div
                className="flex items-center flex-shrink-0"
                title={
                  activeModel.lastTestResult ||
                  (activeModel.status === 'connected'
                    ? i.toastConnected
                    : activeModel.status === 'error'
                      ? i.toastConnectionFailed
                      : i.toastNotTested)
                }
              >
                {activeModel.status === 'testing' ? (
                  <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                ) : activeModel.status === 'connected' ? (
                  <div className={`w-2 h-2 rounded-full ${t.status.online}`} />
                ) : activeModel.status === 'error' ? (
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                ) : (
                  <div className={`w-2 h-2 rounded-full ${t.status.offline}`} />
                )}
              </div>
            )}
          </>
        ) : (
          <button
            onClick={openModelSettings}
            className={`text-[11px] px-1.5 py-0.5 rounded ${t.transition} ${t.text.label} hover:${t.text.tertiary}`}
          >
            {i.configModel}
          </button>
        )}
      </div>

      {/* Right: Utility icons */}
      <div className="flex items-center space-x-0.5 flex-shrink-0">
        {/* Plugin Extensions */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPlugins(!showPlugins);
              setShowHelp(false);
            }}
            className={`p-1 rounded ${t.transition} ${showPlugins ? t.interactive.iconActive : t.interactive.iconBtn}`}
            title={i.pluginExtensions}
          >
            <Puzzle className="w-3.5 h-3.5" />
          </button>
          {showPlugins && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPlugins(false)} />
              <div
                className={`absolute left-0 top-full mt-1 w-56 rounded-xl overflow-hidden z-50 p-1.5 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
              >
                <div
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-wider ${t.text.muted}`}
                  style={{ fontWeight: 600 }}
                >
                  {i.pluginExtensions}
                </div>
                {pluginItems.map((p) => (
                  <div
                    key={p.name}
                    className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg ${t.transition} ${t.interactive.menuItem}`}
                  >
                    <Puzzle className="w-3.5 h-3.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] truncate" style={{ fontWeight: 500 }}>
                        {p.name}
                      </p>
                      <p className={`text-[10px] ${t.text.dimmed}`}>{p.desc}</p>
                    </div>
                    {p.installed ? (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400"
                        style={{ fontWeight: 500 }}
                      >
                        {i.pluginInstalled}
                      </span>
                    ) : (
                      <button
                        onClick={() => toast.success(`${p.name} ${i.toastPluginInstalled}`)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25"
                        style={{ fontWeight: 500 }}
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <div className={`my-1 h-px mx-2 ${t.border.divider}`} />
                <button
                  onClick={() => {
                    toast.info(i.pluginMarket);
                    setShowPlugins(false);
                  }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
                  style={{ fontWeight: 400 }}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>{i.pluginMarket}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Model Settings */}
        <button
          onClick={openModelSettings}
          className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}
          title={i.modelManagement}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Help Guide */}
        <div className="relative">
          <button
            onClick={() => {
              setShowHelp(!showHelp);
              setShowPlugins(false);
            }}
            className={`p-1 rounded ${t.transition} ${showHelp ? t.interactive.iconActive : t.interactive.iconBtn}`}
            title={i.helpGuide}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          {showHelp && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowHelp(false)} />
              <div
                className={`absolute right-0 top-full mt-1 w-48 rounded-xl overflow-hidden z-50 p-1 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
              >
                <div
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-wider ${t.text.muted}`}
                  style={{ fontWeight: 600 }}
                >
                  {i.helpCenter}
                </div>
                {helpItems.map(({ label, icon: Icon, action }) => (
                  <button
                    key={label}
                    onClick={() => {
                      action();
                      setShowHelp(false);
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
                    style={{ fontWeight: 400 }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
