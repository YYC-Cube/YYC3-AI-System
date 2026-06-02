/**
 * @file CicdPipeline.tsx
 * @description YYC³便携式智能AI系统 - AI驱动的CI/CD流水线配置与可视化
 * AI-Driven CI/CD Pipeline Configuration & Visualization
 * Visual pipeline editor with stages (Lint→Build→Test→Deploy), per-job status,
 * AI-suggested optimizations, YAML preview, and run controls.
 * Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,cicd,pipeline,devops,automation
 */

import {
  Workflow, X, Play, RotateCcw,
  CheckCircle2, XCircle, Loader2, Clock, SkipForward, Ban,
  Rocket, TestTube2, FileSearch, Package, Server,
  Terminal, Eye, Zap, ArrowRight, Copy, Code, Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import React, { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '../store'
import { getI18n } from '../utils/i18n'
import { getThemeTokens } from '../utils/theme'

/* ── Types ── */
type JobStatus = 'passed' | 'failed' | 'running' | 'pending' | 'skipped' | 'cancelled'
type TriggerType = 'push' | 'merge' | 'manual' | 'scheduled'
type EnvType = 'dev' | 'staging' | 'prod'

interface PipelineJob {
  id: string
  name: string
  icon: typeof Package
  status: JobStatus
  duration: number // seconds
  logs: string[]
  env?: EnvType
}

interface PipelineStage {
  id: string
  name: string
  labelKey: string
  jobs: PipelineJob[]
}

interface Pipeline {
  id: string
  name: string
  trigger: TriggerType
  branch: string
  commitHash: string
  startedAt: number
  stages: PipelineStage[]
  aiSuggestions: string[]
}

/* ── Status config ── */
const STATUS_CONFIG: Record<JobStatus, { icon: typeof CheckCircle2; color: string; labelKey: string }> = {
  passed:    { icon: CheckCircle2, color: '#10b981', labelKey: 'ciPassed' },
  failed:    { icon: XCircle,      color: '#ef4444', labelKey: 'ciFailed' },
  running:   { icon: Loader2,      color: '#6366f1', labelKey: 'ciRunning' },
  pending:   { icon: Clock,        color: '#f59e0b', labelKey: 'ciPending' },
  skipped:   { icon: SkipForward,  color: '#94a3b8', labelKey: 'ciSkipped' },
  cancelled: { icon: Ban,          color: '#ef4444', labelKey: 'ciCancelled' },
}

const ENV_COLORS: Record<EnvType, string> = { dev: '#10b981', staging: '#f59e0b', prod: '#ef4444' }

/* ── Mock pipeline ── */
const createMockPipeline = (): Pipeline => ({
  id: 'pipe-1',
  name: 'YYC3 Main Pipeline',
  trigger: 'push',
  branch: 'main',
  commitHash: 'a1b2c3d',
  startedAt: Date.now() - 180000,
  stages: [
    {
      id: 's1', name: 'Lint', labelKey: 'ciLint',
      jobs: [
        { id: 'j1', name: 'ESLint', icon: FileSearch, status: 'passed', duration: 12, logs: ['> eslint --ext .ts,.tsx src/', '✓ 0 errors, 0 warnings', '✓ 147 files checked'] },
        { id: 'j2', name: 'TypeCheck', icon: Code, status: 'passed', duration: 8, logs: ['> tsc --noEmit', '✓ No type errors found', '✓ 862 i18n keys verified'] },
        { id: 'j3', name: 'Prettier', icon: FileSearch, status: 'passed', duration: 5, logs: ['> prettier --check "src/**/*.{ts,tsx}"', '✓ All files formatted'] },
      ],
    },
    {
      id: 's2', name: 'Build', labelKey: 'ciBuild',
      jobs: [
        { id: 'j4', name: 'Vite Build', icon: Package, status: 'passed', duration: 45, logs: ['> vite build', 'transforming (248) ...', '✓ 248 modules transformed', 'dist/index.js  284.2 kB gzip', '✓ built in 42.3s'] },
        { id: 'j5', name: 'Bundle Analysis', icon: Eye, status: 'passed', duration: 8, logs: ['> source-map-explorer dist/*.js', 'Total: 892 kB', 'React: 128 kB (14.3%)', 'Monaco: 342 kB (38.3%)', '✓ No unexpected size increases'] },
      ],
    },
    {
      id: 's3', name: 'Test', labelKey: 'ciTest',
      jobs: [
        { id: 'j6', name: 'Unit Tests', icon: TestTube2, status: 'passed', duration: 38, logs: ['> vitest run', 'Test Files  24 passed (24)', 'Tests       147 passed (147)', 'Coverage:   87.3%', '✓ All tests passed'] },
        { id: 'j7', name: 'Integration', icon: TestTube2, status: 'running', duration: 22, logs: ['> vitest run --config vitest.integration.ts', 'Running 12 test suites...', '��� CollabSync: running...', '▸ WebSocket: passed'] },
        { id: 'j8', name: 'E2E', icon: TestTube2, status: 'pending', duration: 0, logs: [] },
      ],
    },
    {
      id: 's4', name: 'Deploy', labelKey: 'ciDeploy',
      jobs: [
        { id: 'j9',  name: 'Dev', icon: Server, status: 'pending', duration: 0, logs: [], env: 'dev' },
        { id: 'j10', name: 'Staging', icon: Server, status: 'pending', duration: 0, logs: [], env: 'staging' },
        { id: 'j11', name: 'Production', icon: Rocket, status: 'pending', duration: 0, logs: [], env: 'prod' },
      ],
    },
  ],
  aiSuggestions: [
    'Consider adding a cache step for node_modules to reduce build time by ~40%',
    'Integration tests can run in parallel with unit tests to save ~30s',
    'Add a Docker image scanning stage before production deployment',
    'Enable incremental TypeScript compilation for faster type checks',
  ],
})

/* ── YAML generator ── */
function generateYAML(pipeline: Pipeline): string {
  const lines: string[] = [
    `name: ${pipeline.name}`,
    '',
    'on:',
    `  push:`,
    `    branches: [${pipeline.branch}]`,
    `  pull_request:`,
    `    branches: [${pipeline.branch}]`,
    '',
    'jobs:',
  ]

  pipeline.stages.forEach(stage => {
    stage.jobs.forEach(job => {
      lines.push(`  ${job.name.toLowerCase().replace(/\s+/g, '-')}:`)
      lines.push(`    name: "${job.name}"`)
      lines.push(`    runs-on: ubuntu-latest`)
      if (job.env) {
        lines.push(`    environment: ${job.env}`)
      }
      lines.push(`    steps:`)
      lines.push(`      - uses: actions/checkout@v4`)
      lines.push(`      - uses: actions/setup-node@v4`)
      lines.push(`        with:`)
      lines.push(`          node-version: 20`)
      lines.push(`      - run: pnpm install`)
      lines.push(`      - run: pnpm ${job.name.toLowerCase().replace(/\s+/g, ':')}`)
      lines.push('')
    })
  })

  return lines.join('\n')
}

/* ══════════════════════════════════════════ */
/*  CicdPipeline Component                    */
/* ══════════════════════════════════════════ */

interface CicdPipelineProps { open: boolean; onClose: () => void }

export function CicdPipeline({ open, onClose }: CicdPipelineProps) {
  const { theme, language } = useAppStore()
  const t = getThemeTokens(theme)
  const i = getI18n(language)

  const [pipeline, setPipeline] = useState<Pipeline>(() => createMockPipeline())
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [showYaml, setShowYaml] = useState(false)
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)

  const yaml = useMemo(() => generateYAML(pipeline), [pipeline])

  const overallStatus = useMemo(() => {
    const allJobs = pipeline.stages.flatMap(s => s.jobs)
    if (allJobs.some(j => j.status === 'failed')) return 'failed'
    if (allJobs.some(j => j.status === 'running')) return 'running'
    if (allJobs.every(j => j.status === 'passed' || j.status === 'skipped')) return 'passed'
    return 'pending'
  }, [pipeline])

  const totalDuration = useMemo(() =>
    pipeline.stages.flatMap(s => s.jobs).reduce((sum, j) => sum + j.duration, 0),
  [pipeline])

  const retryJob = useCallback((jobId: string) => {
    setPipeline(prev => ({
      ...prev,
      stages: prev.stages.map(s => ({
        ...s,
        jobs: s.jobs.map(j => j.id === jobId ? { ...j, status: 'running' as JobStatus, duration: 0, logs: ['Retrying...'] } : j),
      })),
    }))
    // Simulate completion
    setTimeout(() => {
      setPipeline(prev => ({
        ...prev,
        stages: prev.stages.map(s => ({
          ...s,
          jobs: s.jobs.map(j => j.id === jobId ? { ...j, status: 'passed' as JobStatus, duration: 15, logs: [...j.logs, '✓ Retry successful'] } : j),
        })),
      }))
    }, 2000)
    toast.success(i.ciRetry)
  }, [i])

  const cancelJob = useCallback((jobId: string) => {
    setPipeline(prev => ({
      ...prev,
      stages: prev.stages.map(s => ({
        ...s,
        jobs: s.jobs.map(j => j.id === jobId ? { ...j, status: 'cancelled' as JobStatus } : j),
      })),
    }))
  }, [])

  const runPipeline = useCallback(() => {
    setPipeline(prev => ({
      ...prev,
      startedAt: Date.now(),
      stages: prev.stages.map(s => ({
        ...s,
        jobs: s.jobs.map(j => ({ ...j, status: 'pending' as JobStatus, duration: 0, logs: [] })),
      })),
    }))
    // Progressive simulation
    let delay = 500
    const allJobs = pipeline.stages.flatMap(s => s.jobs)
    allJobs.forEach((job, _idx) => {
      setTimeout(() => {
        setPipeline(prev => ({
          ...prev,
          stages: prev.stages.map(s => ({
            ...s,
            jobs: s.jobs.map(j => j.id === job.id ? { ...j, status: 'running' as JobStatus } : j),
          })),
        }))
      }, delay)
      delay += 800
      setTimeout(() => {
        const newStatus: JobStatus = Math.random() > 0.1 ? 'passed' : 'failed'
        setPipeline(prev => ({
          ...prev,
          stages: prev.stages.map(s => ({
            ...s,
            jobs: s.jobs.map(j => j.id === job.id ? { ...j, status: newStatus, duration: Math.floor(Math.random() * 40 + 5), logs: [`✓ ${job.name} completed`] } : j),
          })),
        }))
      }, delay)
      delay += 400
    })
    toast.success(i.ciRunPipeline)
  }, [pipeline, i])

  const sel = useMemo(() => pipeline.stages.flatMap(s => s.jobs).find(j => j.id === selectedJob), [pipeline, selectedJob])

  const formatDuration = (s: number) => s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-6xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-3 border-b ${t.border.subtle}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.isDark ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20' : 'bg-gradient-to-br from-emerald-50 to-cyan-50'}`}>
                <Workflow className={`w-4 h-4 ${t.isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 700 }}>{i.ciTitle}</h2>
                  {(() => {
                    const sc = STATUS_CONFIG[overallStatus]
                    const SIcon = sc.icon
                    return (
                      <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.color + '20', color: sc.color }}>
                        <SIcon className={`w-2.5 h-2.5 ${overallStatus === 'running' ? 'animate-spin' : ''}`} />
                        {(i as unknown as Record<string, string>)[sc.labelKey]}
                      </span>
                    )
                  })()}
                </div>
                <p className={`text-[10px] ${t.text.dimmed}`}>{i.ciSubtitle} · {i.ciDuration}: {formatDuration(totalDuration)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAiSuggestions(!showAiSuggestions)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] ${t.transition} ${showAiSuggestions ? t.accent.activeText : ''} ${t.interactive.iconBtn}`}>
                <Sparkles className="w-3 h-3" /> {i.ciAiSuggest}
              </button>
              <button onClick={() => setShowYaml(!showYaml)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] ${t.transition} ${showYaml ? t.accent.activeText : ''} ${t.interactive.iconBtn}`}>
                <Code className="w-3 h-3" /> {i.ciYamlPreview}
              </button>
              <button onClick={runPipeline}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] ${t.transition} ${t.accent.solidBtn} text-white`} style={{ fontWeight: 600 }}>
                <Play className="w-3 h-3" /> {i.ciRunPipeline}
              </button>
              <button onClick={onClose} className={`p-2 rounded-xl ${t.transition} ${t.interactive.iconBtn}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Pipeline visual */}
            <div className={`flex-1 overflow-auto p-6 ${t.scrollbar}`}>
              {/* AI suggestions */}
              <AnimatePresence>
                {showAiSuggestions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`mb-4 rounded-xl overflow-hidden border ${t.isDark ? 'bg-violet-500/5 border-violet-500/15' : 'bg-violet-50/50 border-violet-200/50'}`}
                  >
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className={`w-3.5 h-3.5 ${t.isDark ? 'text-violet-400' : 'text-violet-500'}`} />
                        <span className={`text-[10px] ${t.text.primary}`} style={{ fontWeight: 600 }}>{i.ciAiSuggest}</span>
                      </div>
                      <div className="space-y-1.5">
                        {pipeline.aiSuggestions.map((sug, _idx) => (
                          <div key={_idx} className={`flex items-start gap-2 text-[9px] ${t.text.muted}`}>
                            <Zap className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                            <span>{sug}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stages flow */}
              <div className="flex items-start gap-4 min-w-max">
                {pipeline.stages.map((stage, sIdx) => {
                  const stageStatus = stage.jobs.some(j => j.status === 'failed') ? 'failed'
                    : stage.jobs.some(j => j.status === 'running') ? 'running'
                    : stage.jobs.every(j => j.status === 'passed' || j.status === 'skipped') ? 'passed'
                    : 'pending'
                  const sc = STATUS_CONFIG[stageStatus]

                  return (
                    <React.Fragment key={stage.id}>
                      {sIdx > 0 && (
                        <div className="flex items-center pt-8 flex-shrink-0">
                          <ArrowRight className={`w-5 h-5 ${stageStatus === 'pending' ? t.text.dimmed : ''}`} style={{ color: stageStatus !== 'pending' ? sc.color : undefined }} />
                        </div>
                      )}
                      <div className={`w-52 rounded-xl border ${t.isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white/60 border-slate-200/60'}`}>
                        {/* Stage header */}
                        <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border.subtle}`}>
                          <div className="flex items-center gap-1.5">
                            {(() => { const SI = sc.icon; return <SI className={`w-3 h-3 ${stageStatus === 'running' ? 'animate-spin' : ''}`} style={{ color: sc.color }} /> })()}
                            <span className={`text-[10px] ${t.text.primary}`} style={{ fontWeight: 600 }}>{(i as unknown as Record<string, string>)[stage.labelKey] || stage.name}</span>
                          </div>
                          <span className={`text-[7px] ${t.text.dimmed}`}>{stage.jobs.length} {i.ciJob}</span>
                        </div>

                        {/* Jobs */}
                        <div className="p-1.5 space-y-1">
                          {stage.jobs.map(job => {
                            const jsc = STATUS_CONFIG[job.status]
                            const JIcon = jsc.icon
                            const JobTypeIcon = job.icon
                            const isSelected = selectedJob === job.id

                            return (
                              <button
                                key={job.id}
                                onClick={() => setSelectedJob(isSelected ? null : job.id)}
                                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left ${t.transition} ${
                                  isSelected ? (t.isDark ? 'bg-white/[0.06]' : 'bg-slate-100') : t.interactive.menuItem
                                }`}
                              >
                                <JobTypeIcon className={`w-3 h-3 flex-shrink-0 ${t.text.muted}`} />
                                <div className="flex-1 min-w-0">
                                  <span className={`text-[9px] truncate block ${t.text.primary}`} style={{ fontWeight: 500 }}>{job.name}</span>
                                  {job.env && (
                                    <span className="text-[7px] px-1 rounded" style={{ backgroundColor: ENV_COLORS[job.env] + '20', color: ENV_COLORS[job.env] }}>
                                      {(i as unknown as Record<string, string>)[job.env === 'dev' ? 'ciEnvDev' : job.env === 'staging' ? 'ciEnvStaging' : 'ciEnvProd']}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {job.duration > 0 && <span className={`text-[7px] ${t.text.dimmed}`}>{formatDuration(job.duration)}</span>}
                                  <JIcon className={`w-3 h-3 ${job.status === 'running' ? 'animate-spin' : ''}`} style={{ color: jsc.color }} />
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </React.Fragment>
                  )
                })}
              </div>
            </div>

            {/* Right panel: Logs / YAML */}
            <div className={`w-72 flex-shrink-0 border-l ${t.border.subtle} flex flex-col overflow-hidden`}>
              {showYaml ? (
                <div className="flex flex-col h-full">
                  <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border.subtle}`}>
                    <div className="flex items-center gap-1.5">
                      <Code className={`w-3 h-3 ${t.accent.primary}`} />
                      <span className={`text-[10px] ${t.text.primary}`} style={{ fontWeight: 600 }}>{i.ciYamlPreview}</span>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(yaml); toast.success(i.codeCopied) }} className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}>
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <pre className={`flex-1 overflow-auto p-3 font-mono text-[8px] ${t.isDark ? 'text-emerald-300/70' : 'text-slate-600'} ${t.scrollbar}`}>
                    {yaml}
                  </pre>
                </div>
              ) : sel ? (
                <div className="flex flex-col h-full">
                  <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border.subtle}`}>
                    <div className="flex items-center gap-1.5">
                      <Terminal className={`w-3 h-3 ${t.accent.primary}`} />
                      <span className={`text-[10px] ${t.text.primary}`} style={{ fontWeight: 600 }}>{sel.name} · {i.ciLogs}</span>
                    </div>
                    <div className="flex gap-1">
                      {(sel.status === 'failed' || sel.status === 'cancelled') && (
                        <button onClick={() => retryJob(sel.id)} className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] ${t.transition} ${t.interactive.iconBtn}`}>
                          <RotateCcw className="w-2.5 h-2.5" /> {i.ciRetry}
                        </button>
                      )}
                      {sel.status === 'running' && (
                        <button onClick={() => cancelJob(sel.id)} className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] text-red-400 ${t.transition} ${t.interactive.iconBtn}`}>
                          <Ban className="w-2.5 h-2.5" /> {i.ciCancel}
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Status */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 border-b ${t.border.subtle}`}>
                    {(() => { const SI = STATUS_CONFIG[sel.status].icon; return <SI className={`w-3 h-3 ${sel.status === 'running' ? 'animate-spin' : ''}`} style={{ color: STATUS_CONFIG[sel.status].color }} /> })()}
                    <span className="text-[9px]" style={{ color: STATUS_CONFIG[sel.status].color, fontWeight: 500 }}>
                      {(i as unknown as Record<string, string>)[STATUS_CONFIG[sel.status].labelKey]}
                    </span>
                    {sel.duration > 0 && <span className={`text-[8px] ${t.text.dimmed}`}>{i.ciDuration}: {formatDuration(sel.duration)}</span>}
                  </div>
                  {/* Log output */}
                  <div className={`flex-1 overflow-auto p-3 font-mono text-[8px] ${t.isDark ? 'bg-[#0a0f1f] text-slate-400' : 'bg-slate-50 text-slate-600'} ${t.scrollbar}`}>
                    {sel.logs.length === 0 ? (
                      <span className={t.text.dimmed}>{i.ciPending}...</span>
                    ) : (
                      sel.logs.map((line, _idx) => (
                        <div key={_idx} className={`py-0.5 ${line.startsWith('✓') ? 'text-emerald-400' : line.startsWith('✗') ? 'text-red-400' : ''}`}>
                          {line}
                        </div>
                      ))
                    )}
                    {sel.status === 'running' && (
                      <div className="flex items-center gap-1 mt-2 text-indigo-400">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> {i.ciRunning}...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center h-full gap-2 ${t.text.dimmed}`}>
                  <Terminal className="w-6 h-6 opacity-20" />
                  <span className="text-[10px]">Select a job to view logs</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
