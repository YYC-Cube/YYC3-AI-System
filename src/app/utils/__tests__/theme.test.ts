/**
 * @file theme.test.ts
 * @description YYC³便携式智能AI系统 - 主题系统测试
 * Theme System Test
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,utils,theme,tokens,styling
 */

import { describe, test, expect } from 'vitest';

import { getThemeTokens, THEME_PRESETS, TRANSITION } from '../theme';
import type { ThemeMode } from '../theme';

describe('Theme System - getThemeTokens', () => {
  test('should return tokens for light theme', () => {
    const tokens = getThemeTokens('light');
    expect(tokens).toBeDefined();
    expect(tokens.isDark).toBe(false);
    expect(tokens.transition).toBe(TRANSITION);
  });

  test('should return tokens for dark theme', () => {
    const tokens = getThemeTokens('dark');
    expect(tokens).toBeDefined();
    expect(tokens.isDark).toBe(true);
    expect(tokens.transition).toBe(TRANSITION);
  });

  test('should return tokens for midnight theme', () => {
    const tokens = getThemeTokens('midnight');
    expect(tokens).toBeDefined();
    expect(tokens.isDark).toBe(true);
    expect(tokens.palette.base).toBe('slate');
  });

  test('should return tokens for forest theme', () => {
    const tokens = getThemeTokens('forest');
    expect(tokens).toBeDefined();
    expect(tokens.isDark).toBe(true);
    expect(tokens.palette.base).toBe('slate');
  });

  test('should return tokens for sunset theme', () => {
    const tokens = getThemeTokens('sunset');
    expect(tokens).toBeDefined();
    expect(tokens.isDark).toBe(false);
    expect(tokens.palette.base).toBe('stone');
  });

  test('all themes should have required properties', () => {
    const themes: ThemeMode[] = ['light', 'dark', 'midnight', 'forest', 'sunset'];

    themes.forEach((theme) => {
      const tokens = getThemeTokens(theme);
      expect(tokens).toHaveProperty('isDark');
      expect(tokens).toHaveProperty('palette');
      expect(tokens).toHaveProperty('transition');
      expect(tokens).toHaveProperty('surface');
      expect(tokens).toHaveProperty('border');
      expect(tokens).toHaveProperty('text');
      expect(tokens).toHaveProperty('accent');
      expect(tokens).toHaveProperty('input');
      expect(tokens).toHaveProperty('status');
    });
  });

  test('light theme should have correct accent colors', () => {
    const tokens = getThemeTokens('light');
    expect(tokens.accent.primary).toContain('indigo');
  });

  test('dark theme should have correct accent colors', () => {
    const tokens = getThemeTokens('dark');
    expect(tokens.accent.primary).toContain('indigo');
  });

  test('midnight theme should have blue accent', () => {
    const tokens = getThemeTokens('midnight');
    expect(tokens.accent.primary).toContain('blue');
  });

  test('forest theme should have emerald accent', () => {
    const tokens = getThemeTokens('forest');
    expect(tokens.accent.primary).toContain('emerald');
  });

  test('sunset theme should have orange accent', () => {
    const tokens = getThemeTokens('sunset');
    expect(tokens.accent.primary).toContain('orange');
  });
});

describe('Theme System - THEME_PRESETS', () => {
  test('should have all 5 theme presets', () => {
    expect(THEME_PRESETS).toHaveLength(5);
  });

  test('should have light theme preset', () => {
    const preset = THEME_PRESETS.find((p) => p.id === 'light');
    expect(preset).toBeDefined();
    expect(preset?.labelKey).toBe('themeLight');
    expect(preset?.icon).toBe('☀️');
    expect(preset?.accent).toBe('#6366f1');
  });

  test('should have dark theme preset', () => {
    const preset = THEME_PRESETS.find((p) => p.id === 'dark');
    expect(preset).toBeDefined();
    expect(preset?.labelKey).toBe('themeDark');
    expect(preset?.icon).toBe('🌙');
    expect(preset?.accent).toBe('#818cf8');
  });

  test('should have midnight theme preset', () => {
    const preset = THEME_PRESETS.find((p) => p.id === 'midnight');
    expect(preset).toBeDefined();
    expect(preset?.labelKey).toBe('themeMidnight');
    expect(preset?.icon).toBe('🌌');
    expect(preset?.accent).toBe('#60a5fa');
  });

  test('should have forest theme preset', () => {
    const preset = THEME_PRESETS.find((p) => p.id === 'forest');
    expect(preset).toBeDefined();
    expect(preset?.labelKey).toBe('themeForest');
    expect(preset?.icon).toBe('🌲');
    expect(preset?.accent).toBe('#34d399');
  });

  test('should have sunset theme preset', () => {
    const preset = THEME_PRESETS.find((p) => p.id === 'sunset');
    expect(preset).toBeDefined();
    expect(preset?.labelKey).toBe('themeSunset');
    expect(preset?.icon).toBe('🌅');
    expect(preset?.accent).toBe('#fb923c');
  });

  test('all presets should have required properties', () => {
    THEME_PRESETS.forEach((preset) => {
      expect(preset).toHaveProperty('id');
      expect(preset).toHaveProperty('labelKey');
      expect(preset).toHaveProperty('icon');
      expect(preset).toHaveProperty('accent');
      expect(typeof preset.id).toBe('string');
      expect(typeof preset.labelKey).toBe('string');
      expect(typeof preset.icon).toBe('string');
      expect(typeof preset.accent).toBe('string');
    });
  });

  test('preset IDs should be unique', () => {
    const ids = THEME_PRESETS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  test('preset icons should be emojis', () => {
    THEME_PRESETS.forEach((preset) => {
      const isEmoji = /^[\p{Emoji}]/u.test(preset.icon);
      expect(isEmoji).toBe(true);
    });
  });

  test('preset accents should be valid hex colors', () => {
    THEME_PRESETS.forEach((preset) => {
      const isHex = /^#[0-9A-Fa-f]{6}$/.test(preset.accent);
      expect(isHex).toBe(true);
    });
  });
});

describe('Theme System - TRANSITION', () => {
  test('TRANSITION should be defined', () => {
    expect(TRANSITION).toBe('transition-colors duration-300');
  });

  test('all themes should use same TRANSITION', () => {
    const themes: ThemeMode[] = ['light', 'dark', 'midnight', 'forest', 'sunset'];
    themes.forEach((theme) => {
      const tokens = getThemeTokens(theme);
      expect(tokens.transition).toBe(TRANSITION);
    });
  });
});

describe('Theme System - Color Consistency', () => {
  test('dark-based themes should have isDark true', () => {
    const darkThemes: ThemeMode[] = ['dark', 'midnight', 'forest'];
    darkThemes.forEach((theme) => {
      const tokens = getThemeTokens(theme);
      expect(tokens.isDark).toBe(true);
    });
  });

  test('light-based themes should have isDark false', () => {
    const lightThemes: ThemeMode[] = ['light', 'sunset'];
    lightThemes.forEach((theme) => {
      const tokens = getThemeTokens(theme);
      expect(tokens.isDark).toBe(false);
    });
  });

  test('accent colors should be consistent within theme', () => {
    const tokens = getThemeTokens('dark');
    const accentPrimary = tokens.accent.primary;
    expect(accentPrimary).toMatch(/text-.*-500/);
  });
});

describe('Theme System - Token Structure', () => {
  test('theme tokens should have nested structure', () => {
    const tokens = getThemeTokens('dark');
    expect(typeof tokens.surface).toBe('object');
    expect(typeof tokens.border).toBe('object');
    expect(typeof tokens.text).toBe('object');
    expect(typeof tokens.accent).toBe('object');
  });

  test('surface tokens should include main surfaces', () => {
    const tokens = getThemeTokens('dark');
    expect(tokens.surface).toHaveProperty('app');
    expect(tokens.surface).toHaveProperty('glass');
    expect(tokens.surface).toHaveProperty('card');
    expect(tokens.surface).toHaveProperty('popover');
  });

  test('text tokens should include different shades', () => {
    const tokens = getThemeTokens('dark');
    expect(tokens.text).toHaveProperty('primary');
    expect(tokens.text).toHaveProperty('secondary');
    expect(tokens.text).toHaveProperty('muted');
  });

  test('accent tokens should include interactive states', () => {
    const tokens = getThemeTokens('dark');
    expect(tokens.accent).toHaveProperty('primary');
    expect(tokens.accent).toHaveProperty('primaryBg');
    expect(tokens.accent).toHaveProperty('primaryHover');
  });

  test('status tokens should include semantic colors', () => {
    const tokens = getThemeTokens('dark');
    expect(tokens.status).toHaveProperty('error');
    expect(tokens.status).toHaveProperty('warning');
    expect(tokens.status).toHaveProperty('success');
    expect(tokens.status).toHaveProperty('info');
  });
});
