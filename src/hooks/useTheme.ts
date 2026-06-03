/**
 * @file useTheme.ts
 * @description 全局主题钩子 - 暗黑模式自动跟随系统 + 手动切换
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-06-03
 * @tags hooks,theme,system-preference
 */

import { useEffect, useState, useCallback } from 'react';

import type { ThemeMode } from '../app/utils/theme';
import { resolveTheme } from '../app/utils/theme';

const THEME_STORAGE_KEY = 'yyc3-theme-mode';

export function useTheme() {
  const [mode, setModeRaw] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    const cached = localStorage.getItem(THEME_STORAGE_KEY);
    return (cached as ThemeMode) || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(mode));

  // Watch system preference changes when mode === 'system'
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setResolvedTheme(resolveTheme(mode, media));
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [mode]);

  // Toggle 'dark' class on <html> for Tailwind dark: variant
  useEffect(() => {
    const isDark = resolvedTheme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, [resolvedTheme]);

  const setMode = useCallback((v: ThemeMode) => {
    setModeRaw(v);
    localStorage.setItem(THEME_STORAGE_KEY, v);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeRaw((prev) => {
      const order: ThemeMode[] = ['light', 'dark', 'system'];
      const idx = order.indexOf(prev);
      const next = order[(idx + 1) % order.length];
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  return {
    mode,
    setMode,
    toggleTheme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
  };
}
