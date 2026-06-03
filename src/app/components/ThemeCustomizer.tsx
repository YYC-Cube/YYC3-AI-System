/**
 * @file ThemeCustomizer.tsx
 * @description YYC³便携式智能AI系统 - 主题自定义设置面板
 * Follows YYC3-theme-design-system.md guidelines
 * Features: preset themes, color/font/radius customization,
 * real-time preview, import/export JSON, peel reveal transition
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,theme,customization,settings
 */

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  Moon,
  Palette,
  Radius,
  RotateCcw,
  Sparkles,
  Sun,
  Type,
  Upload,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useAppStore, type CustomThemeConfig } from '../store';
import { getI18n, resolveKey } from '../utils/i18n';
import { THEME_PRESETS, getThemeTokens, type ThemeMode } from '../utils/theme';

// ── Design System Presets (from YYC3-theme-design-system.md) ──
interface DesignPreset {
  id: string;
  nameKey: string;
  nameEn: string;
  type: 'light' | 'dark';
  colors: CustomThemeConfig['colors'];
  icon: string;
}

const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: 'basic-light',
    nameKey: 'tcPresetBase',
    nameEn: 'Basic Light',
    type: 'light',
    colors: {
      primary: '#4f46e5',
      secondary: '#0ea5e9',
      accent: '#f97316',
      background: '#f8fafc',
      card: '#ffffff',
      border: '#cbd5e1',
    },
    icon: '🎨',
  },
  {
    id: 'cosmic-night',
    nameKey: 'tcPresetCosmic',
    nameEn: 'Cosmic Night',
    type: 'dark',
    colors: {
      primary: '#818cf8',
      secondary: '#38bdf8',
      accent: '#fb923c',
      background: '#0f172a',
      card: '#1e293b',
      border: '#334155',
    },
    icon: '🌌',
  },
  {
    id: 'soft-pop',
    nameKey: 'tcPresetPastel',
    nameEn: 'Soft Pop',
    type: 'light',
    colors: {
      primary: '#e879f9',
      secondary: '#34d399',
      accent: '#fb923c',
      background: '#fdf4ff',
      card: '#ffffff',
      border: '#f0abfc',
    },
    icon: '🩷',
  },
  {
    id: 'cyberpunk',
    nameKey: 'tcPresetCyber',
    nameEn: 'Cyberpunk',
    type: 'dark',
    colors: {
      primary: '#c084fc',
      secondary: '#22d3ee',
      accent: '#facc15',
      background: '#0c0a1d',
      card: '#1a1538',
      border: '#2e1065',
    },
    icon: '🔮',
  },
  {
    id: 'minimal',
    nameKey: 'tcPresetMinimal',
    nameEn: 'Modern Minimal',
    type: 'light',
    colors: {
      primary: '#18181b',
      secondary: '#71717a',
      accent: '#52525b',
      background: '#fafafa',
      card: '#ffffff',
      border: '#e4e4e7',
    },
    icon: '⬜',
  },
  {
    id: 'future-tech',
    nameKey: 'tcPresetFuture',
    nameEn: 'Future Tech',
    type: 'dark',
    colors: {
      primary: '#06b6d4',
      secondary: '#10b981',
      accent: '#8b5cf6',
      background: '#0a1628',
      card: '#162032',
      border: '#1e3a5f',
    },
    icon: '🚀',
  },
];

const COLOR_LABEL_KEYS: Record<keyof CustomThemeConfig['colors'], string> = {
  primary: 'tcColorPrimary',
  secondary: 'tcColorSecondary',
  accent: 'tcColorAccent',
  background: 'tcColorBackground',
  card: 'tcColorCard',
  border: 'tcColorBorder',
};

const FONT_OPTIONS = [
  { value: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', labelKey: 'tcFontRecommended' },
  { value: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", label: 'Segoe UI' },
  { value: 'system-ui, -apple-system, sans-serif', label: 'System UI' },
  { value: 'Georgia, serif', label: 'Georgia (Serif)' },
];

const MONO_FONT_OPTIONS = [
  { value: "'Fira Code', monospace", label: 'Fira Code' },
  { value: "'Consolas', 'Monaco', monospace", label: 'Consolas' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
];

const RADIUS_OPTION_KEYS = [
  { labelKey: 'tcRadiusNone', sm: '0', md: '0', lg: '0' },
  { labelKey: 'tcRadiusSm', sm: '4px', md: '6px', lg: '8px' },
  { labelKey: 'tcRadiusMd', sm: '8px', md: '12px', lg: '16px' },
  { labelKey: 'tcRadiusLg', sm: '12px', md: '16px', lg: '24px' },
  { labelKey: 'tcRadiusFull', sm: '9999px', md: '9999px', lg: '9999px' },
];

export function ThemeCustomizer() {
  const {
    theme,
    setTheme,
    language,
    themeCustomizerOpen,
    closeThemeCustomizer,
    customThemeConfig,
    updateCustomThemeConfig,
    updateCustomColors,
    resetCustomThemeConfig,
    peelTransition,
    triggerPeelTransition,
  } = useAppStore();

  const t = getThemeTokens(theme);
  const isDark = t.isDark;
  const i = getI18n(language);

  const [activeTab, setActiveTab] = useState<
    'presets' | 'colors' | 'fonts' | 'layout' | 'brand' | 'export'
  >('presets');
  const [exportCopied, setExportCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Peel/Reveal Transition Effect ──
  const peelOverlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (peelTransition?.active) {
      const timer = setTimeout(() => {
        useAppStore.setState({ peelTransition: null });
      }, 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [peelTransition]);

  const handleThemeSwitch = useCallback(
    (newTheme: ThemeMode, e?: React.MouseEvent) => {
      if (e) {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        triggerPeelTransition(rect.left + rect.width / 2, rect.top + rect.height / 2);
        // Delay actual theme change for the peel animation
        requestAnimationFrame(() => {
          setTimeout(() => setTheme(newTheme), 50);
        });
      } else {
        setTheme(newTheme);
      }
    },
    [setTheme, triggerPeelTransition]
  );

  // ── Export ──
  const handleExport = useCallback(() => {
    const exportData = {
      version: '2.0.0',
      name: customThemeConfig.name,
      type: customThemeConfig.type,
      created: new Date().toISOString(),
      activeTheme: theme,
      colors: customThemeConfig.colors,
      fonts: customThemeConfig.fonts,
      layout: { radius: customThemeConfig.radius },
      branding: customThemeConfig.branding,
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yyc3-theme-${customThemeConfig.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [customThemeConfig, theme]);

  const handleCopyJson = useCallback(() => {
    const exportData = {
      version: '2.0.0',
      name: customThemeConfig.name,
      type: customThemeConfig.type,
      created: new Date().toISOString(),
      activeTheme: theme,
      colors: customThemeConfig.colors,
      fonts: customThemeConfig.fonts,
      layout: { radius: customThemeConfig.radius },
      branding: customThemeConfig.branding,
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  }, [customThemeConfig, theme]);

  // ── Import ──
  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImportError(null);
      setImportSuccess(false);

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (!data.colors || !data.name) {
            throw new Error('Invalid theme file: missing required fields');
          }
          updateCustomThemeConfig({
            name: data.name,
            type: data.type || 'dark',
            colors: { ...customThemeConfig.colors, ...data.colors },
            fonts: data.fonts
              ? { ...customThemeConfig.fonts, ...data.fonts }
              : customThemeConfig.fonts,
            radius: data.layout?.radius
              ? { ...customThemeConfig.radius, ...data.layout.radius }
              : customThemeConfig.radius,
            branding: data.branding
              ? { ...customThemeConfig.branding, ...data.branding }
              : customThemeConfig.branding,
          });
          if (
            data.activeTheme &&
            ['light', 'dark', 'midnight', 'forest', 'sunset'].includes(data.activeTheme)
          ) {
            setTheme(data.activeTheme);
          }
          setImportSuccess(true);
          setTimeout(() => setImportSuccess(false), 3000);
        } catch (err: unknown) {
          setImportError((err as Error).message || i.tcParseError);
        }
      };
      reader.readAsText(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [customThemeConfig, updateCustomThemeConfig, setTheme, i]
  );

  const handleApplyPreset = useCallback(
    (preset: DesignPreset) => {
      const resolvedName = resolveKey(i, preset.nameKey);
      updateCustomThemeConfig({
        name: resolvedName,
        type: preset.type,
        colors: { ...preset.colors },
      });
    },
    [updateCustomThemeConfig, i]
  );

  if (!themeCustomizerOpen) return null;

  const tabs = [
    { key: 'presets' as const, label: i.tcPresets, icon: Sparkles },
    { key: 'colors' as const, label: i.tcColors, icon: Palette },
    { key: 'fonts' as const, label: i.tcFonts, icon: Type },
    { key: 'layout' as const, label: i.tcLayout, icon: Radius },
    { key: 'brand' as const, label: i.tcBrand, icon: Eye },
    { key: 'export' as const, label: i.tcImportExport, icon: Download },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${isDark ? 'bg-black/60' : 'bg-slate-900/40'} backdrop-blur-md`}
        onClick={closeThemeCustomizer}
      />

      {/* Peel Reveal Overlay */}
      {peelTransition?.active && (
        <div
          ref={peelOverlayRef}
          className="fixed inset-0 z-[200] pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(circle at center, rgba(99,102,241,0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(99,102,241,0.1) 0%, transparent 70%)',
            clipPath: `circle(0% at ${peelTransition.x}px ${peelTransition.y}px)`,
            animation: 'peelReveal 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards',
          }}
        />
      )}

      {/* Modal */}
      <div
        className={`relative w-[760px] max-h-[85vh] rounded-2xl flex flex-col overflow-hidden ${isDark
            ? 'bg-slate-900/95 border border-white/8'
            : 'bg-white/95 border border-slate-200/80'
          } backdrop-blur-xl`}
        style={{
          boxShadow: isDark
            ? '0 0 0 1px rgba(255,255,255,0.06), 0 25px 60px -12px rgba(0,0,0,0.6), 0 0 120px -40px rgba(99,102,241,0.15)'
            : '0 25px 60px -12px rgba(0,0,0,0.15), 0 0 80px -30px rgba(99,102,241,0.1)',
        }}
      >
        {/* Header */}
        <div
          className={`flex items-center gap-3 px-5 py-4 border-b ${isDark ? 'border-white/6' : 'border-slate-200/60'}`}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center">
            <Palette className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <div
              className={`text-[14px] ${isDark ? 'text-white/90' : 'text-slate-800'}`}
              style={{ fontWeight: 600 }}
            >
              {i.tcTitle}
            </div>
            <div className={`text-[11px] ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
              {i.tcSubtitle}
            </div>
          </div>
          <button
            onClick={closeThemeCustomizer}
            className={`p-2 rounded-lg transition-all ${isDark ? 'text-white/20 hover:text-white/60 hover:bg-white/6' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Theme Switcher Bar */}
        <div
          className={`flex items-center gap-2 px-5 py-2.5 border-b ${isDark ? 'border-white/6' : 'border-slate-200/40'}`}
        >
          <span
            className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-white/25' : 'text-slate-400'}`}
            style={{ fontWeight: 600 }}
          >
            {i.tcActiveTheme}
          </span>
          <div className="flex gap-1 ml-2">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={(e) => handleThemeSwitch(preset.id, e)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${theme === preset.id
                    ? `${t.accent.activeBg} ${t.accent.activeText}`
                    : isDark
                      ? 'text-white/40 hover:text-white/70 hover:bg-white/5'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                style={{ fontWeight: theme === preset.id ? 500 : 400 }}
              >
                <span className="text-[12px]">{preset.icon}</span>
                <span>{resolveKey(i, preset.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div
          className={`flex gap-0.5 px-5 pt-2 pb-0 border-b overflow-x-auto ${isDark ? 'border-white/6' : 'border-slate-200/40'}`}
        >
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[11px] transition-all border-b-2 -mb-px whitespace-nowrap ${activeTab === key
                  ? `${t.accent.activeText} border-current ${isDark ? 'bg-white/3' : 'bg-slate-50'}`
                  : isDark
                    ? 'text-white/30 border-transparent hover:text-white/50'
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              style={{ fontWeight: activeTab === key ? 500 : 400 }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0 custom-scrollbar">
          {/* ═══ Presets Tab ═══ */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div
                className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-white/25' : 'text-slate-400'}`}
                style={{ fontWeight: 600 }}
              >
                {i.tcDesignPresets}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {DESIGN_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`group relative rounded-xl border p-4 text-left transition-all ${customThemeConfig.name === resolveKey(i, preset.nameKey)
                        ? isDark
                          ? 'border-purple-500/30 bg-purple-500/5'
                          : 'border-purple-300/50 bg-purple-50/50'
                        : isDark
                          ? 'border-white/6 bg-white/2 hover:border-white/12'
                          : 'border-slate-200/60 bg-white/60 hover:border-slate-300'
                      }`}
                  >
                    {/* Color preview bar */}
                    <div className="flex gap-1 mb-3">
                      {Object.values(preset.colors)
                        .slice(0, 4)
                        .map((color, i) => (
                          <div
                            key={i}
                            className="h-4 flex-1 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px]">{preset.icon}</span>
                      <span
                        className={`text-[12px] ${isDark ? 'text-white/80' : 'text-slate-700'}`}
                        style={{ fontWeight: 500 }}
                      >
                        {resolveKey(i, preset.nameKey)}
                      </span>
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-white/25' : 'text-slate-400'}`}>
                      {preset.nameEn} · {preset.type === 'dark' ? i.tcDark : i.tcLight}
                    </div>
                    {customThemeConfig.name === resolveKey(i, preset.nameKey) && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Live Preview */}
              <div
                className={`rounded-xl border p-4 ${isDark ? 'border-white/6 bg-white/2' : 'border-slate-200/60 bg-white/60'}`}
              >
                <div
                  className={`text-[10px] uppercase tracking-wider mb-3 ${isDark ? 'text-white/25' : 'text-slate-400'}`}
                  style={{ fontWeight: 600 }}
                >
                  {i.tcLivePreview}
                </div>
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: customThemeConfig.colors.background,
                    borderColor: customThemeConfig.colors.border,
                  }}
                >
                  <div
                    className="rounded-lg p-3 mb-3"
                    style={{
                      backgroundColor: customThemeConfig.colors.card,
                      borderColor: customThemeConfig.colors.border,
                      border: '1px solid',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: customThemeConfig.colors.primary }}
                      />
                      <span
                        className="text-[11px]"
                        style={{
                          color: customThemeConfig.type === 'dark' ? '#e2e8f0' : '#1e293b',
                          fontWeight: 600,
                        }}
                      >
                        {customThemeConfig.branding.appName}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div
                        className="h-2 rounded-full flex-[3]"
                        style={{ backgroundColor: customThemeConfig.colors.primary, opacity: 0.3 }}
                      />
                      <div
                        className="h-2 rounded-full flex-[2]"
                        style={{
                          backgroundColor: customThemeConfig.colors.secondary,
                          opacity: 0.3,
                        }}
                      />
                      <div
                        className="h-2 rounded-full flex-[1]"
                        style={{ backgroundColor: customThemeConfig.colors.accent, opacity: 0.3 }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div
                      className="px-3 py-1.5 rounded-lg text-[10px] text-white"
                      style={{ backgroundColor: customThemeConfig.colors.primary, fontWeight: 500 }}
                    >
                      {i.tcPrimaryBtn}
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-lg text-[10px] border"
                      style={{
                        borderColor: customThemeConfig.colors.border,
                        color: customThemeConfig.type === 'dark' ? '#94a3b8' : '#64748b',
                      }}
                    >
                      {i.tcSecondaryBtn}
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-lg text-[10px] text-white"
                      style={{ backgroundColor: customThemeConfig.colors.accent, fontWeight: 500 }}
                    >
                      {i.tcAccentBtn}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Colors Tab ═══ */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div
                className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-white/25' : 'text-slate-400'}`}
                style={{ fontWeight: 600 }}
              >
                {i.tcCustomColors}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(COLOR_LABEL_KEYS) as Array<keyof typeof COLOR_LABEL_KEYS>).map(
                  (key) => (
                    <div
                      key={key}
                      className={`rounded-xl border p-3 ${isDark ? 'border-white/6 bg-white/2' : 'border-slate-200/60 bg-white/60'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[11px] ${isDark ? 'text-white/60' : 'text-slate-600'}`}
                          style={{ fontWeight: 500 }}
                        >
                          {resolveKey(i, COLOR_LABEL_KEYS[key])}
                        </span>
                        <span
                          className={`text-[10px] font-mono ${isDark ? 'text-white/25' : 'text-slate-400'}`}
                        >
                          {customThemeConfig.colors[key]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="relative cursor-pointer">
                          <div
                            className="w-10 h-10 rounded-lg border-2 shadow-sm"
                            style={{
                              backgroundColor: customThemeConfig.colors[key],
                              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            }}
                          />
                          <input
                            type="color"
                            value={customThemeConfig.colors[key]}
                            onChange={(e) => updateCustomColors({ [key]: e.target.value })}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </label>
                        <input
                          type="text"
                          value={customThemeConfig.colors[key]}
                          onChange={(e) => updateCustomColors({ [key]: e.target.value })}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-mono ${isDark
                              ? 'bg-white/4 border border-white/8 text-white/70 focus:border-purple-500/40'
                              : 'bg-slate-50 border border-slate-200 text-slate-600 focus:border-purple-500/40'
                            } focus:outline-none`}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-[10px] ${isDark ? 'text-white/20' : 'text-slate-400'}`}
                  style={{ fontWeight: 500 }}
                >
                  {i.tcThemeMode}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateCustomThemeConfig({ type: 'light' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all border ${customThemeConfig.type === 'light'
                        ? 'border-amber-400/30 bg-amber-500/10 text-amber-500'
                        : isDark
                          ? 'border-white/8 text-white/30 hover:bg-white/5'
                          : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                      }`}
                  >
                    <Sun className="w-3.5 h-3.5" /> {i.tcLight}
                  </button>
                  <button
                    onClick={() => updateCustomThemeConfig({ type: 'dark' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all border ${customThemeConfig.type === 'dark'
                        ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-400'
                        : isDark
                          ? 'border-white/8 text-white/30 hover:bg-white/5'
                          : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                      }`}
                  >
                    <Moon className="w-3.5 h-3.5" /> {i.tcDark}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Fonts Tab ═══ */}
          {activeTab === 'fonts' && (
            <div className="space-y-4">
              <div
                className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-white/25' : 'text-slate-400'}`}
                style={{ fontWeight: 600 }}
              >
                {i.tcFontConfig}
              </div>

              {/* Sans-serif */}
              <div
                className={`rounded-xl border p-4 ${isDark ? 'border-white/6 bg-white/2' : 'border-slate-200/60 bg-white/60'}`}
              >
                <div
                  className={`text-[11px] mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}
                  style={{ fontWeight: 500 }}
                >
                  {i.tcSansSerif}
                </div>
                <div className={`text-[10px] mb-3 ${isDark ? 'text-white/20' : 'text-slate-400'}`}>
                  {i.tcSansUsage}
                </div>
                <div className="space-y-1.5">
                  {FONT_OPTIONS.map((font) => (
                    <button
                      key={font.value}
                      onClick={() =>
                        updateCustomThemeConfig({
                          fonts: { ...customThemeConfig.fonts, sans: font.value },
                        })
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] transition-all ${customThemeConfig.fonts.sans === font.value
                          ? isDark
                            ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                            : 'bg-purple-50 text-purple-600 border border-purple-200/40'
                          : isDark
                            ? 'text-white/50 hover:bg-white/5'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                      <span style={{ fontFamily: font.value }}>
                        {'labelKey' in font ? resolveKey(i, font.labelKey || '') : font.label}
                      </span>
                      <span
                        style={{ fontFamily: font.value }}
                        className={`text-[11px] ${isDark ? 'text-white/20' : 'text-slate-300'}`}
                      >
                        Aa Bb Cc 0123
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Monospace */}
              <div
                className={`rounded-xl border p-4 ${isDark ? 'border-white/6 bg-white/2' : 'border-slate-200/60 bg-white/60'}`}
              >
                <div
                  className={`text-[11px] mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}
                  style={{ fontWeight: 500 }}
                >
                  {i.tcMonospace}
                </div>
                <div className={`text-[10px] mb-3 ${isDark ? 'text-white/20' : 'text-slate-400'}`}>
                  {i.tcMonoUsage}
                </div>
                <div className="space-y-1.5">
                  {MONO_FONT_OPTIONS.map((font) => (
                    <button
                      key={font.value}
                      onClick={() =>
                        updateCustomThemeConfig({
                          fonts: { ...customThemeConfig.fonts, mono: font.value },
                        })
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] transition-all ${customThemeConfig.fonts.mono === font.value
                          ? isDark
                            ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                            : 'bg-purple-50 text-purple-600 border border-purple-200/40'
                          : isDark
                            ? 'text-white/50 hover:bg-white/5'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                      <span
                        style={{ fontFamily: font.value }}
                        className={`text-[11px] ${isDark ? 'text-white/20' : 'text-slate-300'}`}
                      >
                        {'const x = 42;'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ Layout Tab ═══ */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              <div
                className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-white/25' : 'text-slate-400'}`}
                style={{ fontWeight: 600 }}
              >
                {i.tcRadiusLayout}
              </div>

              <div
                className={`rounded-xl border p-4 ${isDark ? 'border-white/6 bg-white/2' : 'border-slate-200/60 bg-white/60'}`}
              >
                <div
                  className={`text-[11px] mb-3 ${isDark ? 'text-white/60' : 'text-slate-600'}`}
                  style={{ fontWeight: 500 }}
                >
                  {i.tcRadiusPresets}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {RADIUS_OPTION_KEYS.map((opt) => {
                    const isActive = customThemeConfig.radius.md === opt.md;
                    return (
                      <button
                        key={opt.labelKey}
                        onClick={() =>
                          updateCustomThemeConfig({
                            radius: { sm: opt.sm, md: opt.md, lg: opt.lg },
                          })
                        }
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${isActive
                            ? isDark
                              ? 'border-purple-500/30 bg-purple-500/8'
                              : 'border-purple-300/50 bg-purple-50/50'
                            : isDark
                              ? 'border-white/6 hover:border-white/12'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <div
                          className="w-10 h-10 border-2"
                          style={{
                            borderRadius: opt.md,
                            borderColor: isActive
                              ? customThemeConfig.colors.primary
                              : isDark
                                ? 'rgba(255,255,255,0.15)'
                                : 'rgba(0,0,0,0.15)',
                            backgroundColor: isActive
                              ? customThemeConfig.colors.primary + '15'
                              : 'transparent',
                          }}
                        />
                        <span
                          className={`text-[10px] ${isActive ? (isDark ? 'text-purple-300' : 'text-purple-600') : isDark ? 'text-white/30' : 'text-slate-400'}`}
                        >
                          {resolveKey(i, opt.labelKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom radius inputs */}
              <div
                className={`rounded-xl border p-4 ${isDark ? 'border-white/6 bg-white/2' : 'border-slate-200/60 bg-white/60'}`}
              >
                <div
                  className={`text-[11px] mb-3 ${isDark ? 'text-white/60' : 'text-slate-600'}`}
                  style={{ fontWeight: 500 }}
                >
                  {i.tcCustomRadius}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(['sm', 'md', 'lg'] as const).map((size) => (
                    <div key={size}>
                      <label
                        className={`text-[10px] uppercase tracking-wider mb-1 block ${isDark ? 'text-white/25' : 'text-slate-400'}`}
                      >
                        radius-{size}
                      </label>
                      <input
                        type="text"
                        value={customThemeConfig.radius[size]}
                        onChange={(e) =>
                          updateCustomThemeConfig({
                            radius: { ...customThemeConfig.radius, [size]: e.target.value },
                          })
                        }
                        className={`w-full px-3 py-2 rounded-lg text-[11px] font-mono ${isDark
                            ? 'bg-white/4 border border-white/8 text-white/70 focus:border-purple-500/40'
                            : 'bg-slate-50 border border-slate-200 text-slate-600 focus:border-purple-500/40'
                          } focus:outline-none`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ Brand Tab ═══ */}
          {activeTab === 'brand' && (
            <div className="space-y-4">
              <div
                className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-white/25' : 'text-slate-400'}`}
                style={{ fontWeight: 600 }}
              >
                {i.tcBrandCustomize}
              </div>

              <div
                className={`rounded-xl border p-4 space-y-3 ${isDark ? 'border-white/6 bg-white/2' : 'border-slate-200/60 bg-white/60'}`}
              >
                <div>
                  <label
                    className={`text-[10px] uppercase tracking-wider mb-1 block ${isDark ? 'text-white/25' : 'text-slate-400'}`}
                  >
                    {i.tcAppName}
                  </label>
                  <input
                    type="text"
                    value={customThemeConfig.branding.appName}
                    onChange={(e) =>
                      updateCustomThemeConfig({
                        branding: { ...customThemeConfig.branding, appName: e.target.value },
                      })
                    }
                    maxLength={50}
                    className={`w-full px-3 py-2 rounded-lg text-[12px] ${isDark
                        ? 'bg-white/4 border border-white/8 text-white/80 focus:border-purple-500/40'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 focus:border-purple-500/40'
                      } focus:outline-none`}
                  />
                </div>
                <div>
                  <label
                    className={`text-[10px] uppercase tracking-wider mb-1 block ${isDark ? 'text-white/25' : 'text-slate-400'}`}
                  >
                    {i.tcMainSlogan}{' '}
                    <span className={isDark ? 'text-white/15' : 'text-slate-300'}>
                      {i.tcMaxChars50}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={customThemeConfig.branding.slogan}
                    onChange={(e) =>
                      updateCustomThemeConfig({
                        branding: { ...customThemeConfig.branding, slogan: e.target.value },
                      })
                    }
                    maxLength={50}
                    className={`w-full px-3 py-2 rounded-lg text-[12px] ${isDark
                        ? 'bg-white/4 border border-white/8 text-white/80 focus:border-purple-500/40'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 focus:border-purple-500/40'
                      } focus:outline-none`}
                  />
                </div>
                <div>
                  <label
                    className={`text-[10px] uppercase tracking-wider mb-1 block ${isDark ? 'text-white/25' : 'text-slate-400'}`}
                  >
                    {i.tcSubSlogan}{' '}
                    <span className={isDark ? 'text-white/15' : 'text-slate-300'}>
                      {i.tcMaxChars100}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={customThemeConfig.branding.subSlogan}
                    onChange={(e) =>
                      updateCustomThemeConfig({
                        branding: { ...customThemeConfig.branding, subSlogan: e.target.value },
                      })
                    }
                    maxLength={100}
                    className={`w-full px-3 py-2 rounded-lg text-[12px] ${isDark
                        ? 'bg-white/4 border border-white/8 text-white/80 focus:border-purple-500/40'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 focus:border-purple-500/40'
                      } focus:outline-none`}
                  />
                </div>
              </div>

              {/* Brand Preview Card */}
              <div
                className={`rounded-xl border p-4 ${isDark ? 'border-white/6 bg-white/2' : 'border-slate-200/60 bg-white/60'}`}
              >
                <div
                  className={`text-[10px] uppercase tracking-wider mb-3 ${isDark ? 'text-white/25' : 'text-slate-400'}`}
                  style={{ fontWeight: 600 }}
                >
                  {i.tcBrandPreview}
                </div>
                <div
                  className="rounded-xl p-6 text-center"
                  style={{
                    backgroundColor: customThemeConfig.colors.background,
                    borderColor: customThemeConfig.colors.border,
                    border: '1px solid',
                  }}
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg"
                      style={{ backgroundColor: customThemeConfig.colors.primary }}
                    />
                    <span
                      className="text-[16px]"
                      style={{
                        color: customThemeConfig.type === 'dark' ? '#e2e8f0' : '#1e293b',
                        fontWeight: 700,
                        fontFamily: customThemeConfig.fonts.sans,
                      }}
                    >
                      {customThemeConfig.branding.appName}
                    </span>
                  </div>
                  <p
                    className="text-[12px] mb-1"
                    style={{
                      color: customThemeConfig.type === 'dark' ? '#94a3b8' : '#64748b',
                      fontFamily: customThemeConfig.fonts.sans,
                    }}
                  >
                    {customThemeConfig.branding.slogan}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{
                      color: customThemeConfig.type === 'dark' ? '#64748b' : '#94a3b8',
                      fontFamily: customThemeConfig.fonts.sans,
                    }}
                  >
                    {customThemeConfig.branding.subSlogan}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Export/Import Tab ═══ */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div
                className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-white/25' : 'text-slate-400'}`}
                style={{ fontWeight: 600 }}
              >
                {i.tcImportExport}
              </div>

              {/* Theme Name */}
              <div
                className={`rounded-xl border p-4 ${isDark ? 'border-white/6 bg-white/2' : 'border-slate-200/60 bg-white/60'}`}
              >
                <label
                  className={`text-[10px] uppercase tracking-wider mb-1 block ${isDark ? 'text-white/25' : 'text-slate-400'}`}
                >
                  {i.tcThemeName}
                </label>
                <input
                  type="text"
                  value={customThemeConfig.name}
                  onChange={(e) => updateCustomThemeConfig({ name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg text-[12px] ${isDark
                      ? 'bg-white/4 border border-white/8 text-white/80 focus:border-purple-500/40'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 focus:border-purple-500/40'
                    } focus:outline-none`}
                />
              </div>

              {/* Export actions */}
              <div
                className={`rounded-xl border p-4 space-y-3 ${isDark ? 'border-white/6 bg-white/2' : 'border-slate-200/60 bg-white/60'}`}
              >
                <div
                  className={`text-[11px] ${isDark ? 'text-white/60' : 'text-slate-600'}`}
                  style={{ fontWeight: 500 }}
                >
                  {i.tcExportConfig}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-500/15 text-purple-400 text-[11px] hover:bg-purple-500/25 transition-all border border-purple-500/20"
                  >
                    <Download className="w-3.5 h-3.5" /> {i.tcDownloadJson}
                  </button>
                  <button
                    onClick={handleCopyJson}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] transition-all border ${exportCopied
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                        : isDark
                          ? 'text-white/40 border-white/10 hover:bg-white/5'
                          : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    {exportCopied ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {exportCopied ? i.tcCopied : i.tcCopyJson}
                  </button>
                </div>
              </div>

              {/* Import */}
              <div
                className={`rounded-xl border p-4 space-y-3 ${isDark ? 'border-white/6 bg-white/2' : 'border-slate-200/60 bg-white/60'}`}
              >
                <div
                  className={`text-[11px] ${isDark ? 'text-white/60' : 'text-slate-600'}`}
                  style={{ fontWeight: 500 }}
                >
                  {i.tcImportConfig}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] transition-all border border-dashed ${isDark
                      ? 'border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
                      : 'border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400'
                    }`}
                >
                  <Upload className="w-3.5 h-3.5" /> {i.tcSelectJsonFile}
                </button>
                {importError && (
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] ${isDark ? 'bg-red-500/8 text-red-300 border border-red-500/15' : 'bg-red-50 text-red-600 border border-red-200'}`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> {importError}
                  </div>
                )}
                {importSuccess && (
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] ${isDark ? 'bg-emerald-500/8 text-emerald-300 border border-emerald-500/15' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> {i.tcImportSuccess}
                  </div>
                )}
              </div>

              {/* JSON Preview */}
              <div
                className={`rounded-xl border p-4 ${isDark ? 'border-white/6 bg-white/2' : 'border-slate-200/60 bg-white/60'}`}
              >
                <div
                  className={`text-[10px] uppercase tracking-wider mb-2 ${isDark ? 'text-white/25' : 'text-slate-400'}`}
                  style={{ fontWeight: 600 }}
                >
                  {i.tcJsonPreview}
                </div>
                <pre
                  className={`text-[10px] font-mono p-3 rounded-lg overflow-x-auto max-h-48 custom-scrollbar ${isDark ? 'bg-black/20 text-white/50' : 'bg-slate-50 text-slate-600'}`}
                >
                  {JSON.stringify(
                    {
                      version: '2.0.0',
                      name: customThemeConfig.name,
                      type: customThemeConfig.type,
                      activeTheme: theme,
                      colors: customThemeConfig.colors,
                      fonts: customThemeConfig.fonts,
                      layout: { radius: customThemeConfig.radius },
                      branding: customThemeConfig.branding,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between px-5 py-3 border-t ${isDark ? 'border-white/6 bg-white/1' : 'border-slate-200/40 bg-slate-50/50'}`}
        >
          <button
            onClick={resetCustomThemeConfig}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all ${isDark ? 'text-white/30 hover:text-white/50 hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> {i.tcResetDefault}
          </button>
          <button
            onClick={closeThemeCustomizer}
            className={`px-4 py-1.5 rounded-lg text-[11px] transition-all ${isDark ? 'bg-white/6 text-white/50 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {i.msDone}
          </button>
        </div>
      </div>

      {/* Peel Reveal Animation Keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes peelReveal {
          0% { clip-path: circle(0% at var(--peel-x, 50%) var(--peel-y, 50%)); opacity: 1; }
          60% { clip-path: circle(100% at var(--peel-x, 50%) var(--peel-y, 50%)); opacity: 0.8; }
          100% { clip-path: circle(150% at var(--peel-x, 50%) var(--peel-y, 50%)); opacity: 0; }
        }
      `,
        }}
      />
    </div>
  );
}
