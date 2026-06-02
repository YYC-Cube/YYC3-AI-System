/**
 * @file theme.ts
 * @description YYC³便携式智能AI系统 - 统一主题令牌系统
 * Unified Theme Token System
 * Single source of truth for all theme-aware color tokens.
 * Supports: light, dark, midnight (blue), forest (green), sunset (warm)
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,theme,tokens,styling
 */

// ── Theme Mode Types ──
export type ThemeMode = 'light' | 'dark' | 'midnight' | 'forest' | 'sunset'

/** All available themes for UI selection */
export const THEME_PRESETS: { id: ThemeMode, labelKey: string, icon: string, accent: string }[] = [
  { id: 'light',    labelKey: 'themeLight',    icon: '☀️', accent: '#6366f1' },
  { id: 'dark',     labelKey: 'themeDark',     icon: '🌙', accent: '#818cf8' },
  { id: 'midnight', labelKey: 'themeMidnight', icon: '🌌', accent: '#60a5fa' },
  { id: 'forest',   labelKey: 'themeForest',   icon: '🌲', accent: '#34d399' },
  { id: 'sunset',   labelKey: 'themeSunset',   icon: '🌅', accent: '#fb923c' },
]

// ── Internal palette helper ──
interface Palette {
  /** Is the theme dark-based? */
  dark: boolean
  /** Base neutral scale name for bg surfaces */
  base: 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone'
  /** Brand accent hue for interactive elements */
  accentName: 'indigo' | 'blue' | 'emerald' | 'orange' | 'amber'
  /** App-level radial gradient blobs */
  appGradientFrom: string
  appGradientTo: string
  /** Second ambient blob */
  ambientBlob: string
}

function getPalette(theme: ThemeMode): Palette {
  switch (theme) {
    case 'light':
      return { dark: false, base: 'slate', accentName: 'indigo', appGradientFrom: 'rgba(120,119,198,0.15)', appGradientTo: 'rgba(255,255,255,0)', ambientBlob: 'bg-indigo-400/20' }
    case 'dark':
      return { dark: true, base: 'slate', accentName: 'indigo', appGradientFrom: 'rgba(120,119,198,0.3)', appGradientTo: 'rgba(255,255,255,0)', ambientBlob: 'bg-indigo-600/15' }
    case 'midnight':
      return { dark: true, base: 'slate', accentName: 'blue', appGradientFrom: 'rgba(59,130,246,0.25)', appGradientTo: 'rgba(255,255,255,0)', ambientBlob: 'bg-blue-600/20' }
    case 'forest':
      return { dark: true, base: 'slate', accentName: 'emerald', appGradientFrom: 'rgba(16,185,129,0.2)', appGradientTo: 'rgba(255,255,255,0)', ambientBlob: 'bg-emerald-600/15' }
    case 'sunset':
      return { dark: false, base: 'stone', accentName: 'orange', appGradientFrom: 'rgba(251,146,60,0.15)', appGradientTo: 'rgba(255,255,255,0)', ambientBlob: 'bg-orange-400/15' }
  }
}

// Accent color mappings
const accentMap = {
  indigo: {
    text: 'text-indigo-500',
    textLight: 'text-indigo-400',
    textDark: 'text-indigo-600',
    bgSoft: (d: boolean) => d ? 'bg-indigo-500/20' : 'bg-indigo-500/10',
    bgHover: (d: boolean) => d ? 'bg-indigo-500/30' : 'bg-indigo-500/20',
    badge: (d: boolean) => d ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-500/10 text-indigo-600',
    link: (d: boolean) => d ? 'text-indigo-400' : 'text-indigo-600',
    ring: 'focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20',
    focusBorder: 'focus:border-indigo-500/40',
    activeBg: (d: boolean) => d ? 'bg-indigo-500/15' : 'bg-indigo-50',
    activeText: (d: boolean) => d ? 'text-indigo-400' : 'text-indigo-600',
    solidBtn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25',
    gradient: 'from-indigo-500 via-blue-500 to-cyan-500',
  },
  blue: {
    text: 'text-blue-500',
    textLight: 'text-blue-400',
    textDark: 'text-blue-600',
    bgSoft: (d: boolean) => d ? 'bg-blue-500/20' : 'bg-blue-500/10',
    bgHover: (d: boolean) => d ? 'bg-blue-500/30' : 'bg-blue-500/20',
    badge: (d: boolean) => d ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600',
    link: (d: boolean) => d ? 'text-blue-400' : 'text-blue-600',
    ring: 'focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20',
    focusBorder: 'focus:border-blue-500/40',
    activeBg: (d: boolean) => d ? 'bg-blue-500/15' : 'bg-blue-50',
    activeText: (d: boolean) => d ? 'text-blue-400' : 'text-blue-600',
    solidBtn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25',
    gradient: 'from-blue-500 via-cyan-500 to-sky-400',
  },
  emerald: {
    text: 'text-emerald-500',
    textLight: 'text-emerald-400',
    textDark: 'text-emerald-600',
    bgSoft: (d: boolean) => d ? 'bg-emerald-500/20' : 'bg-emerald-500/10',
    bgHover: (d: boolean) => d ? 'bg-emerald-500/30' : 'bg-emerald-500/20',
    badge: (d: boolean) => d ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600',
    link: (d: boolean) => d ? 'text-emerald-400' : 'text-emerald-600',
    ring: 'focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20',
    focusBorder: 'focus:border-emerald-500/40',
    activeBg: (d: boolean) => d ? 'bg-emerald-500/15' : 'bg-emerald-50',
    activeText: (d: boolean) => d ? 'text-emerald-400' : 'text-emerald-600',
    solidBtn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-400',
  },
  orange: {
    text: 'text-orange-500',
    textLight: 'text-orange-400',
    textDark: 'text-orange-600',
    bgSoft: (d: boolean) => d ? 'bg-orange-500/20' : 'bg-orange-500/10',
    bgHover: (d: boolean) => d ? 'bg-orange-500/30' : 'bg-orange-500/20',
    badge: (d: boolean) => d ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-500/10 text-orange-600',
    link: (d: boolean) => d ? 'text-orange-400' : 'text-orange-600',
    ring: 'focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20',
    focusBorder: 'focus:border-orange-500/40',
    activeBg: (d: boolean) => d ? 'bg-orange-500/15' : 'bg-orange-50',
    activeText: (d: boolean) => d ? 'text-orange-400' : 'text-orange-600',
    solidBtn: 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/25',
    gradient: 'from-orange-500 via-amber-500 to-yellow-400',
  },
  amber: {
    text: 'text-amber-500',
    textLight: 'text-amber-400',
    textDark: 'text-amber-600',
    bgSoft: (d: boolean) => d ? 'bg-amber-500/20' : 'bg-amber-500/10',
    bgHover: (d: boolean) => d ? 'bg-amber-500/30' : 'bg-amber-500/20',
    badge: (d: boolean) => d ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/10 text-amber-600',
    link: (d: boolean) => d ? 'text-amber-400' : 'text-amber-600',
    ring: 'focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20',
    focusBorder: 'focus:border-amber-500/40',
    activeBg: (d: boolean) => d ? 'bg-amber-500/15' : 'bg-amber-50',
    activeText: (d: boolean) => d ? 'text-amber-400' : 'text-amber-600',
    solidBtn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25',
    gradient: 'from-amber-500 via-orange-500 to-rose-400',
  },
}

/** Shared transition class for smooth theme switching */
export const TRANSITION = 'transition-colors duration-300'

/** Get a full set of resolved theme tokens for the current mode */
export function getThemeTokens(theme: ThemeMode) {
  const p = getPalette(theme)
  const d = p.dark
  const a = accentMap[p.accentName]

  return {
    isDark: d,
    palette: p,
    transition: TRANSITION,

    // ── Surface & Container ──
    surface: {
      /** Primary app background */
      app: d
        ? 'bg-slate-950 text-slate-100'
        : (theme === 'sunset'
          ? 'bg-gradient-to-br from-orange-50 via-white to-amber-50 text-stone-900'
          : 'bg-indigo-50 text-slate-900'),
      /** App-level radial gradient */
      appGradient: `bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,${p.appGradientFrom},${p.appGradientTo})]`,
      /** Liquid Glass panels */
      glass: d
        ? 'bg-slate-900/40 backdrop-blur-xl'
        : 'bg-white/50 backdrop-blur-xl',
      /** Slightly more opaque glass for headers / toolbars */
      glassHeader: d
        ? 'bg-slate-900/60 backdrop-blur-xl'
        : 'bg-white/60 backdrop-blur-xl',
      /** Toolbar / status bar strip */
      toolbar: d ? 'bg-slate-800/50' : 'bg-slate-50/60',
      /** Card / elevated surface */
      card: d ? 'bg-slate-800/60' : 'bg-white/70',
      /** Popover / dropdown / modal */
      popover: d
        ? 'bg-slate-800/95 backdrop-blur-xl'
        : 'bg-white/95 backdrop-blur-xl',
      /** Subtle inset area */
      inset: d ? 'bg-black/20' : 'bg-white/30',
      /** Report / dashboard widget container */
      widget: d
        ? 'bg-slate-800/40 border border-white/8'
        : 'bg-white/60 border border-slate-200/40',
      /** Chat bubble AI / system */
      chatBubble: d ? 'bg-slate-800/50' : 'bg-white/80',
      chatBubbleSystem: d ? 'bg-slate-800/70' : 'bg-slate-100/80',
      /** Chat bubble user */
      chatBubbleUser: 'bg-indigo-600/90 text-white',
      /** Modal overlay */
      modalBackdrop: d ? 'bg-black/60' : 'bg-slate-900/40',
      /** Modal container */
      modal: d
        ? 'bg-slate-900/95 border border-white/8'
        : 'bg-white/95 border border-slate-200/80',
    },

    // ── Border ──
    border: {
      subtle: d ? 'border-white/8' : 'border-slate-200/40',
      medium: d ? 'border-white/10' : 'border-slate-200/50',
      strong: d ? 'border-white/15' : 'border-slate-300/50',
      popover: d ? 'border border-white/10' : 'border border-slate-200',
      divider: d ? 'bg-slate-700/50' : 'bg-slate-300/50',
      /** Divider element (px width) */
      dividerV: d ? 'bg-slate-700' : 'bg-slate-300',
    },

    // ── Text ──
    text: {
      primary: d ? 'text-slate-100' : 'text-slate-900',
      secondary: d ? 'text-slate-300' : 'text-slate-600',
      tertiary: d ? 'text-slate-400' : 'text-slate-500',
      muted: d ? 'text-slate-500' : 'text-slate-400',
      dimmed: d ? 'text-slate-600' : 'text-slate-300',
      inverse: d ? 'text-white' : 'text-slate-800',
      label: d ? 'text-white/30' : 'text-slate-400',
      placeholder: d ? 'placeholder:text-slate-500' : 'placeholder:text-slate-400',
    },

    // ── Interactive (buttons, icons) ──
    interactive: {
      icon: d
        ? 'text-slate-500 hover:text-slate-300'
        : 'text-slate-400 hover:text-slate-600',
      iconBtn: d
        ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/40'
        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/40',
      iconActive: `${d ? 'bg-slate-700/80' : 'bg-white/70 shadow-sm'} ${a.activeText(d)}`,
      headerBtn: d
        ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'
        : 'hover:bg-slate-200/50 text-slate-500 hover:text-slate-700',
      /** Context menu / dropdown item */
      menuItem: d
        ? 'hover:bg-slate-700/50 text-slate-300'
        : 'hover:bg-slate-50 text-slate-600',
      /** Hover bg only (for folders, etc.) */
      hoverBg: d ? 'hover:bg-slate-600/50' : 'hover:bg-slate-200',
    },

    // ── Input ──
    input: {
      base: `${d ? 'bg-slate-800/60 border border-slate-700/50 text-slate-200' : 'bg-white/60 border border-slate-200 text-slate-700'} ${a.focusBorder}`,
      search: `${d ? 'bg-slate-800/80 border border-slate-600/50 text-slate-200 placeholder:text-slate-500' : 'bg-white/80 border border-slate-300/50 text-slate-700 placeholder:text-slate-400'} ${a.focusBorder.replace('focus:border', 'focus:border')}`,
      chat: `${d ? 'bg-black/25 border border-slate-700/40 text-slate-200 placeholder:text-slate-500' : 'bg-white/60 border border-slate-200/60 text-slate-800 placeholder:text-slate-400'} ${a.ring}`,
      select: d
        ? 'bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60'
        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100',
    },

    // ── Semantic / Status Colors ──
    status: {
      error: d ? 'text-red-400' : 'text-red-500',
      errorBg: d ? 'bg-red-500/8' : 'bg-red-50',
      errorBadge: d ? 'bg-red-900/60 text-red-300' : 'bg-red-100 text-red-600',
      warning: d ? 'text-amber-400' : 'text-amber-500',
      warningBg: d ? 'bg-amber-500/5' : 'bg-amber-50',
      warningBadge: d ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700',
      info: d ? 'text-blue-400' : 'text-blue-500',
      infoBadge: d ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700',
      success: d ? 'text-emerald-400' : 'text-emerald-600',
      successBg: d ? 'bg-emerald-500/15' : 'bg-emerald-50',
      online: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]',
      offline: d ? 'bg-white/15' : 'bg-slate-300',
    },

    // ── Accent / Brand (theme-dependent) ──
    accent: {
      primary: a.text,
      primaryBg: a.bgSoft(d),
      primaryText: a.activeText(d),
      primaryHover: a.bgHover(d),
      badge: a.badge(d),
      link: a.link(d),
      activeBg: a.activeBg(d),
      activeText: a.activeText(d),
      solidBtn: a.solidBtn,
      gradient: a.gradient,
      ring: a.ring,
      focusBorder: a.focusBorder,
    },

    // ── Syntax Highlighting (code editor) ──
    syntax: {
      keyword: d ? 'text-purple-400' : 'text-purple-600',
      declaration: d ? 'text-blue-400' : 'text-blue-600',
      type: d ? 'text-cyan-400' : 'text-cyan-600',
      builtin: d ? 'text-amber-300' : 'text-amber-600',
      string: d ? 'text-emerald-400' : 'text-emerald-600',
      number: d ? 'text-amber-400' : 'text-amber-600',
      function: d ? 'text-yellow-300' : 'text-yellow-600',
      component: d ? 'text-teal-300' : 'text-teal-600',
      comment: d ? 'text-emerald-600/80' : 'text-emerald-700',
      commentTag: d ? 'text-emerald-500/70' : 'text-emerald-600',
      default: d ? 'text-slate-300' : 'text-slate-700',
    },

    // ── File Type Icon Colors ──
    fileIcon: {
      tsx: d ? 'text-blue-400' : 'text-blue-500',
      ts: d ? 'text-blue-400' : 'text-blue-500',
      css: d ? 'text-pink-400' : 'text-pink-500',
      json: d ? 'text-amber-400' : 'text-amber-500',
      md: d ? 'text-slate-400' : 'text-slate-500',
      svg: d ? 'text-emerald-400' : 'text-emerald-500',
      folder: d ? 'text-sky-400' : 'text-sky-500',
      folderClosed: d ? 'text-sky-500/70' : 'text-sky-500/60',
      default: 'opacity-60',
    },

    // ── Terminal ──
    terminal: {
      prompt: d ? 'text-emerald-400' : 'text-emerald-600',
      command: d ? 'text-white' : 'text-slate-800',
      output: d ? 'text-slate-400' : 'text-slate-600',
      error: d ? 'text-red-400' : 'text-red-600',
      success: d ? 'text-emerald-300' : 'text-emerald-600',
      caret: d ? 'text-white caret-white' : 'text-slate-800 caret-slate-800',
      gitBranch: d ? 'text-emerald-500' : 'text-emerald-600',
    },

    // ── Shadow ──
    shadow: {
      popover: d ? 'shadow-2xl' : 'shadow-xl',
      card: d ? 'shadow-xl shadow-black/20' : 'shadow-lg shadow-slate-200/50',
      modal: d
        ? '0 0 0 1px rgba(255,255,255,0.06), 0 25px 60px -12px rgba(0,0,0,0.6)'
        : '0 25px 60px -12px rgba(0,0,0,0.15)',
    },

    // ── Kbd / shortcut hint ──
    kbd: d ? 'bg-slate-800' : 'bg-slate-100',

    // ── Scrollbar class ──
    scrollbar: 'custom-scrollbar',

    // ── Recharts / chart helpers ──
    chart: {
      gridStroke: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      axisStroke: d ? '#64748b' : '#94a3b8',
      tooltipBg: d ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.95)',
      tooltipBorder: d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      tooltipText: d ? '#e2e8f0' : '#334155',
    },

    // ── Code block (markdown chat) ──
    codeBlock: {
      bg: d ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
      inlineClass: d ? 'bg-white/10' : 'bg-black/8',
    },
  } as const
}

/** Shorthand type for the resolved tokens object */
export type ThemeTokens = ReturnType<typeof getThemeTokens>

/** Helper: cycle to the next theme (for quick toggle) */
export function nextTheme(current: ThemeMode): ThemeMode {
  const order: ThemeMode[] = ['light', 'dark', 'midnight', 'forest', 'sunset']
  const idx = order.indexOf(current)
  return order[(idx + 1) % order.length]
}