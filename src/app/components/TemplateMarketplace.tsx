/**
 * @file TemplateMarketplace.tsx
 * @description YYC³便携式智能AI系统 - 项目模板市场浏览器
 * Project Template Marketplace Browser
 * Full-screen overlay marketplace with category filtering, search, preview,
 * and one-click template instantiation. Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,template,marketplace,project
 */

import {
  X, Search, Star, Download,
  Layout, ShoppingCart, Briefcase, Shield, Rocket, PenLine,
  Cloud, Smartphone, Sparkles, Clock, User, Package,
  ArrowRight, Check, Eye
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

import { ImageWithFallback } from './figma/ImageWithFallback'

/* ── Category config ── */
type Category = 'all' | 'dashboard' | 'ecommerce' | 'portfolio' | 'admin' | 'landing' | 'blog' | 'saas' | 'mobile'

const CATEGORY_ICONS: Record<Category, typeof Layout> = {
  all: Package,
  dashboard: Layout,
  ecommerce: ShoppingCart,
  portfolio: Briefcase,
  admin: Shield,
  landing: Rocket,
  blog: PenLine,
  saas: Cloud,
  mobile: Smartphone,
}

/* ── Template data ── */
interface Template {
  id: string
  name: string
  description: string
  category: Category
  thumbnail: string
  author: string
  version: string
  stars: number
  downloads: number
  updatedAt: string
  premium: boolean
  featured: boolean
  isNew: boolean
  techStack: string[]
  colors: string[]
}

const TEMPLATES: Template[] = [
  {
    id: 't1', name: 'CloudPivot Dashboard', description: 'Modern analytics dashboard with real-time data visualization, dark mode, and responsive grid layout.',
    category: 'dashboard', thumbnail: 'https://images.unsplash.com/photo-1761593280919-766a4acbcfca?w=400&h=250&fit=crop',
    author: 'YYC\u00B3 Team', version: '2.1.0', stars: 1847, downloads: 12400, updatedAt: '2026-03-10',
    premium: false, featured: true, isNew: false, techStack: ['React', 'TypeScript', 'Recharts', 'Tailwind'], colors: ['#6366f1', '#3b82f6'],
  },
  {
    id: 't2', name: 'ShopFlow E-Commerce', description: 'Full-featured e-commerce storefront with cart, checkout, product filtering, and payment integration.',
    category: 'ecommerce', thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop',
    author: 'DesignCraft', version: '1.8.0', stars: 1203, downloads: 8900, updatedAt: '2026-03-05',
    premium: true, featured: true, isNew: false, techStack: ['React', 'TypeScript', 'Stripe', 'Zustand'], colors: ['#ec4899', '#f59e0b'],
  },
  {
    id: 't3', name: 'DevFolio Pro', description: 'Stunning developer portfolio with project showcase, blog, and contact form. Glassmorphism design.',
    category: 'portfolio', thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop',
    author: 'GlassUI', version: '3.0.0', stars: 2156, downloads: 15600, updatedAt: '2026-03-12',
    premium: false, featured: false, isNew: true, techStack: ['React', 'Motion', 'Tailwind', 'MDX'], colors: ['#8b5cf6', '#06b6d4'],
  },
  {
    id: 't4', name: 'AdminStack', description: 'Enterprise-grade admin panel with RBAC, data tables, forms, charts, and audit logging.',
    category: 'admin', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
    author: 'YYC\u00B3 Team', version: '1.5.0', stars: 986, downloads: 6200, updatedAt: '2026-02-28',
    premium: true, featured: false, isNew: false, techStack: ['React', 'TypeScript', 'AG Grid', 'React Query'], colors: ['#14b8a6', '#334155'],
  },
  {
    id: 't5', name: 'LaunchPad', description: 'High-converting landing page with hero section, features grid, pricing table, and testimonials.',
    category: 'landing', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
    author: 'PixelPerfect', version: '2.0.0', stars: 1567, downloads: 11200, updatedAt: '2026-03-08',
    premium: false, featured: true, isNew: false, techStack: ['React', 'Tailwind', 'Motion', 'Lucide'], colors: ['#f97316', '#0ea5e9'],
  },
  {
    id: 't6', name: 'InkPress Blog', description: 'Minimal blog platform with MDX support, syntax highlighting, tag filtering, and RSS feed.',
    category: 'blog', thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=250&fit=crop',
    author: 'WriterDev', version: '1.2.0', stars: 743, downloads: 4300, updatedAt: '2026-03-01',
    premium: false, featured: false, isNew: true, techStack: ['React', 'MDX', 'Tailwind', 'Shiki'], colors: ['#22c55e', '#a855f7'],
  },
  {
    id: 't7', name: 'SaaSKit Pro', description: 'Complete SaaS starter with auth, billing, team management, API dashboard, and onboarding flow.',
    category: 'saas', thumbnail: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=250&fit=crop',
    author: 'YYC\u00B3 Team', version: '1.0.0', stars: 2341, downloads: 18700, updatedAt: '2026-03-13',
    premium: true, featured: true, isNew: true, techStack: ['React', 'TypeScript', 'Supabase', 'Stripe'], colors: ['#6366f1', '#ec4899'],
  },
  {
    id: 't8', name: 'MobileFirst UI', description: 'Mobile-optimized UI kit with gesture navigation, bottom sheets, and adaptive layouts.',
    category: 'mobile', thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop',
    author: 'AppForge', version: '1.3.0', stars: 654, downloads: 3800, updatedAt: '2026-02-20',
    premium: false, featured: false, isNew: false, techStack: ['React', 'Tailwind', 'Motion', 'PWA'], colors: ['#10b981', '#3b82f6'],
  },
]

/* ══════════════════════════════════════════ */
/*  TemplateMarketplace Component            */
/* ══════════════════════════════════════════ */

interface TemplateMarketplaceProps {
  open: boolean
  onClose: () => void
}

export function TemplateMarketplace({ open, onClose }: TemplateMarketplaceProps) {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category>('all')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set())

  const categories: { key: Category; labelKey: keyof ReturnType<typeof getI18n> }[] = [
    { key: 'all', labelKey: 'tmpAll' },
    { key: 'dashboard', labelKey: 'tmpDashboard' },
    { key: 'ecommerce', labelKey: 'tmpEcommerce' },
    { key: 'portfolio', labelKey: 'tmpPortfolio' },
    { key: 'admin', labelKey: 'tmpAdmin' },
    { key: 'landing', labelKey: 'tmpLanding' },
    { key: 'blog', labelKey: 'tmpBlog' },
    { key: 'saas', labelKey: 'tmpSaaS' },
    { key: 'mobile', labelKey: 'tmpMobile' },
  ]

  const filteredTemplates = useMemo(() => {
    let list = TEMPLATES
    if (selectedCategory !== 'all') list = list.filter(t => t.category === selectedCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.techStack.some(ts => ts.toLowerCase().includes(q))
      )
    }
    return list
  }, [selectedCategory, searchQuery])

  const handleUseTemplate = useCallback((template: Template) => {
    setInstalledIds(prev => new Set([...prev, template.id]))
    toast.success(`${i.tmpUseTemplate}: ${template.name}`)
  }, [i])

  const previewTemplate = previewId ? TEMPLATES.find(t => t.id === previewId) : null

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* ── Header ── */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${t.border.subtle}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.isDark ? 'bg-gradient-to-br from-violet-500/20 to-cyan-500/20' : 'bg-gradient-to-br from-violet-50 to-cyan-50'}`}>
                <Sparkles className={`w-4 h-4 ${t.isDark ? 'text-violet-400' : 'text-violet-500'}`} />
              </div>
              <div>
                <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 700 }}>{i.tmpTitle}</h2>
                <p className={`text-[10px] ${t.text.dimmed}`}>{i.tmpSubtitle}</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl ${t.transition} ${t.interactive.iconBtn}`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* ── Sidebar: Categories ── */}
            <div className={`w-44 flex-shrink-0 border-r ${t.border.subtle} p-3 space-y-0.5 overflow-y-auto`}>
              <div className={`text-[9px] uppercase tracking-wider px-2 py-1 ${t.text.dimmed}`} style={{ fontWeight: 600 }}>{i.tmpCategories}</div>
              {categories.map(cat => {
                const Icon = CATEGORY_ICONS[cat.key]
                const isActive = selectedCategory === cat.key
                const count = cat.key === 'all' ? TEMPLATES.length : TEMPLATES.filter(t => t.category === cat.key).length
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] ${t.transition} ${
                      isActive
                        ? `${t.accent.primaryBg} ${t.accent.primary}`
                        : t.interactive.menuItem
                    }`}
                    style={{ fontWeight: isActive ? 600 : 400 }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="flex-1 text-left">{i[cat.labelKey]}</span>
                    <span className={`text-[8px] px-1 py-0.5 rounded ${t.isDark ? 'bg-white/[0.06]' : 'bg-slate-100'} ${t.text.dimmed}`}>{count}</span>
                  </button>
                )
              })}
            </div>

            {/* ── Main content ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search bar */}
              <div className={`px-4 py-3 border-b ${t.border.subtle}`}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${t.isDark ? 'bg-white/[0.04]' : 'bg-slate-100/80'}`}>
                  <Search className={`w-3.5 h-3.5 ${t.text.muted}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={i.tmpSearchPlaceholder}
                    className={`flex-1 bg-transparent outline-none text-[12px] ${t.text.primary}`}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className={`p-0.5 ${t.interactive.iconBtn}`}>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Template grid */}
              <div className={`flex-1 overflow-y-auto ${t.scrollbar} p-4`}>
                {filteredTemplates.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center gap-3 py-16 ${t.text.dimmed}`}>
                    <Search className="w-8 h-8 opacity-20" />
                    <span className="text-[12px]">No templates found</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map(template => {
                      const isInstalled = installedIds.has(template.id)
                      return (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`group rounded-xl overflow-hidden border ${t.transition} hover:shadow-lg ${
                            t.isDark ? 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]' : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="relative h-32 overflow-hidden">
                            <ImageWithFallback
                              src={template.thumbnail}
                              alt={template.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {/* Badges */}
                            <div className="absolute top-2 left-2 flex gap-1">
                              {template.featured && (
                                <span className="px-1.5 py-0.5 rounded text-[7px] bg-violet-500/80 text-white backdrop-blur-sm" style={{ fontWeight: 700 }}>{i.tmpFeatured}</span>
                              )}
                              {template.isNew && (
                                <span className="px-1.5 py-0.5 rounded text-[7px] bg-emerald-500/80 text-white backdrop-blur-sm" style={{ fontWeight: 700 }}>{i.tmpNew}</span>
                              )}
                              {template.premium && (
                                <span className="px-1.5 py-0.5 rounded text-[7px] bg-amber-500/80 text-white backdrop-blur-sm" style={{ fontWeight: 700 }}>{i.tmpPremium}</span>
                              )}
                            </div>
                            {/* Preview overlay on hover */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={() => setPreviewId(template.id)}
                                className="px-3 py-1.5 rounded-lg text-[10px] bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                                style={{ fontWeight: 600 }}
                              >
                                <Eye className="w-3 h-3 inline mr-1" /> {i.tmpPreview}
                              </button>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-3 space-y-2">
                            <div>
                              <h3 className={`text-[11px] ${t.text.primary}`} style={{ fontWeight: 600 }}>{template.name}</h3>
                              <p className={`text-[9px] mt-0.5 line-clamp-2 ${t.text.muted}`}>{template.description}</p>
                            </div>

                            {/* Tech stack */}
                            <div className="flex flex-wrap gap-1">
                              {template.techStack.map(tech => (
                                <span key={tech} className={`px-1.5 py-0.5 rounded text-[7px] ${t.isDark ? 'bg-white/[0.06] text-white/50' : 'bg-slate-100 text-slate-500'}`}>
                                  {tech}
                                </span>
                              ))}
                            </div>

                            {/* Stats + action */}
                            <div className="flex items-center justify-between">
                              <div className={`flex items-center gap-3 text-[8px] ${t.text.dimmed}`}>
                                <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5" /> {template.stars.toLocaleString()}</span>
                                <span className="flex items-center gap-0.5"><Download className="w-2.5 h-2.5" /> {template.downloads.toLocaleString()}</span>
                              </div>
                              <button
                                onClick={() => handleUseTemplate(template)}
                                disabled={isInstalled}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] ${t.transition} ${
                                  isInstalled
                                    ? `${t.isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} cursor-default`
                                    : t.accent.solidBtn
                                }`}
                                style={{ fontWeight: 600 }}
                              >
                                {isInstalled ? <><Check className="w-2.5 h-2.5" /> Installed</> : <><ArrowRight className="w-2.5 h-2.5" /> {i.tmpUseTemplate}</>}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Preview overlay ── */}
          <AnimatePresence>
            {previewTemplate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex flex-col bg-black/80 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPreviewId(null)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <h3 className="text-white text-[13px]" style={{ fontWeight: 600 }}>{previewTemplate.name}</h3>
                    <span className="text-white/50 text-[10px]">v{previewTemplate.version} · {previewTemplate.author}</span>
                  </div>
                  <button
                    onClick={() => { handleUseTemplate(previewTemplate); setPreviewId(null) }}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-500 text-white text-[11px] hover:bg-violet-600 transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    <ArrowRight className="w-3.5 h-3.5" /> {i.tmpUseTemplate}
                  </button>
                </div>
                <div className="flex-1 overflow-hidden p-6 pt-0">
                  <div className="w-full h-full rounded-xl overflow-hidden border border-white/10">
                    <ImageWithFallback
                      src={previewTemplate.thumbnail}
                      alt={previewTemplate.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                {/* Detail bar */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-white/10">
                  <div className="flex items-center gap-4 text-white/50 text-[9px]">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {previewTemplate.author}</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {previewTemplate.stars.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {previewTemplate.downloads.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {previewTemplate.updatedAt}</span>
                  </div>
                  <div className="flex gap-1">
                    {previewTemplate.techStack.map(tech => (
                      <span key={tech} className="px-1.5 py-0.5 rounded text-[7px] bg-white/10 text-white/60">{tech}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}
