/**
 * @file themeSlice.ts
 * @description YYC³ - 主题/语言/自定义皮肤切片
 * 从 store.ts 提取，按 Zustand Slice 模式组织
 */

import type { StateCreator } from 'zustand';

import type { CustomThemeConfig } from '../../store';
import { debounce } from '../../utils/debounce';
import type { Language } from '../../utils/i18n';
import { getI18n, nextLanguage } from '../../utils/i18n';
import type { ThemeMode } from '../../utils/theme';
import { nextTheme } from '../../utils/theme';

let debouncedThemeConfigUpdate: ((upd: Partial<CustomThemeConfig>) => void) | null = null;
let debouncedColorsUpdate: ((colors: Partial<CustomThemeConfig['colors']>) => void) | null = null;

export interface ThemeSliceState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;

  // ── Theme Customizer ──
  themeCustomizerOpen: boolean;
  openThemeCustomizer: () => void;
  closeThemeCustomizer: () => void;
  customThemeConfig: CustomThemeConfig;
  updateCustomThemeConfig: (updates: Partial<CustomThemeConfig>) => void;
  updateCustomColors: (colors: Partial<CustomThemeConfig['colors']>) => void;
  resetCustomThemeConfig: () => void;
}

export const createThemeSlice: StateCreator<ThemeSliceState, [], [], ThemeSliceState> = (set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: nextTheme(state.theme) })),

  language: 'zh',
  setLanguage: (lang) => set({ language: lang }),
  toggleLanguage: () => set((state) => ({ language: nextLanguage(state.language) })),

  // ── Theme Customizer ──
  themeCustomizerOpen: false,
  openThemeCustomizer: () => set({ themeCustomizerOpen: true }),
  closeThemeCustomizer: () => set({ themeCustomizerOpen: false }),
  customThemeConfig: {
    name: getI18n('zh').defaultThemeName,
    type: 'dark',
    colors: {
      primary: '#6366f1',
      secondary: '#3b82f6',
      accent: '#f97316',
      background: '#0f172a',
      card: '#1e293b',
      border: '#334155',
    },
    fonts: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      mono: "'Fira Code', monospace",
    },
    radius: { sm: '8px', md: '12px', lg: '16px' },
    branding: {
      appName: 'YYC³ CloudPivot Intelli-Matrix',
      slogan: '言启象限 | 语枢未来',
      subSlogan: 'Words Initiate Quadrants, Language Serves as Core for Future',
    },
  },
  updateCustomThemeConfig: (updates) => {
    if (!debouncedThemeConfigUpdate) {
      debouncedThemeConfigUpdate = debounce(
        (upd: Partial<CustomThemeConfig>) => {
          set((state) => ({ customThemeConfig: { ...state.customThemeConfig, ...upd } }));
        },
        { delay: 100, leading: true, trailing: true }
      );
    }
    debouncedThemeConfigUpdate(updates);
  },
  updateCustomColors: (colors) => {
    if (!debouncedColorsUpdate) {
      debouncedColorsUpdate = debounce(
        (cols: Partial<CustomThemeConfig['colors']>) => {
          set((state) => ({
            customThemeConfig: {
              ...state.customThemeConfig,
              colors: { ...state.customThemeConfig.colors, ...cols },
            },
          }));
        },
        { delay: 100, leading: true, trailing: true }
      );
    }
    debouncedColorsUpdate(colors);
  },
  resetCustomThemeConfig: () =>
    set(() => ({
      customThemeConfig: {
        name: getI18n('zh').defaultThemeName,
        type: 'dark',
        colors: {
          primary: '#6366f1',
          secondary: '#3b82f6',
          accent: '#f97316',
          background: '#0f172a',
          card: '#1e293b',
          border: '#334155',
        },
        fonts: {
          sans: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          mono: "'Fira Code', monospace",
        },
        radius: { sm: '8px', md: '12px', lg: '16px' },
        branding: {
          appName: 'YYC³ CloudPivot Intelli-Matrix',
          slogan: '言启象限 | 语枢未来',
          subSlogan: 'Words Initiate Quadrants, Language Serves as Core for Future',
        },
      },
    })),
});
