/**
 * @file GitGraph.tsx
 * @description YYC³便携式智能AI系统 - 代码版本历史Git图可视化
 * Code Version History Git Graph Visualization
 * SVG-based commit graph with branch lines, merge commits, tags, HEAD pointer,
 * commit detail panel with diff stats. Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,git,visualization,history
 */

import { GitBranch, GitCommit, GitMerge, Tag, X, FileCode, Plus, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

/* ── Types ── */
interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  authorColor: string;
  date: number;
  branch: string;
  parents: string[];
  isMerge: boolean;
  tag?: string;
  files: { name: string; insertions: number; deletions: number }[];
}

interface Branch {
  name: string;
  color: string;
  column: number;
  labelKey: string;
}

/* ── Branch definitions ── */
const BRANCHES: Branch[] = [
  { name: 'main', color: '#6366f1', column: 0, labelKey: 'ggMain' },
  { name: 'develop', color: '#10b981', column: 1, labelKey: 'ggDevelop' },
  { name: 'feature/canvas', color: '#f59e0b', column: 2, labelKey: 'ggFeature' },
  { name: 'hotfix/auth', color: '#ef4444', column: 3, labelKey: 'ggHotfix' },
];

/* ── Mock commit data ── */
const MOCK_COMMITS: Commit[] = [
  {
    hash: 'a1b2c3d',
    shortHash: 'a1b2c3d',
    message: 'feat: add visual canvas editor with drag-and-drop',
    author: 'You',
    authorColor: '#818cf8',
    date: Date.now() - 1800000,
    branch: 'main',
    parents: ['e4f5g6h'],
    isMerge: false,
    tag: 'v2.4.0',
    files: [
      { name: 'VisualCanvas.tsx', insertions: 340, deletions: 0 },
      { name: 'CanvasCodeSync.tsx', insertions: 210, deletions: 0 },
      { name: 'store.ts', insertions: 12, deletions: 2 },
    ],
  },
  {
    hash: 'e4f5g6h',
    shortHash: 'e4f5g6h',
    message: "Merge branch 'feature/canvas' into main",
    author: 'Alice',
    authorColor: '#6366f1',
    date: Date.now() - 3600000,
    branch: 'main',
    parents: ['i7j8k9l', 'b3c4d5e'],
    isMerge: true,
    files: [{ name: 'IDELayout.tsx', insertions: 8, deletions: 2 }],
  },
  {
    hash: 'b3c4d5e',
    shortHash: 'b3c4d5e',
    message: 'feat: implement bidirectional canvas-code sync',
    author: 'You',
    authorColor: '#818cf8',
    date: Date.now() - 7200000,
    branch: 'feature/canvas',
    parents: ['f6g7h8i'],
    isMerge: false,
    files: [{ name: 'CanvasCodeSync.tsx', insertions: 185, deletions: 12 }],
  },
  {
    hash: 'f6g7h8i',
    shortHash: 'f6g7h8i',
    message: 'feat: add inline AI chat bubble for Monaco editor',
    author: 'Bob',
    authorColor: '#f59e0b',
    date: Date.now() - 10800000,
    branch: 'feature/canvas',
    parents: ['j9k0l1m'],
    isMerge: false,
    files: [
      { name: 'InlineAIChat.tsx', insertions: 280, deletions: 0 },
      { name: 'CodeEditor.tsx', insertions: 18, deletions: 4 },
    ],
  },
  {
    hash: 'i7j8k9l',
    shortHash: 'i7j8k9l',
    message: 'fix: resolve auth token expiration handling',
    author: 'Carol',
    authorColor: '#10b981',
    date: Date.now() - 14400000,
    branch: 'main',
    parents: ['m2n3o4p'],
    isMerge: false,
    files: [{ name: 'auth.ts', insertions: 25, deletions: 8 }],
  },
  {
    hash: 'j9k0l1m',
    shortHash: 'j9k0l1m',
    message: 'feat: canvas element palette with 8 component types',
    author: 'You',
    authorColor: '#818cf8',
    date: Date.now() - 18000000,
    branch: 'feature/canvas',
    parents: ['n4o5p6q'],
    isMerge: false,
    files: [{ name: 'VisualCanvas.tsx', insertions: 120, deletions: 0 }],
  },
  {
    hash: 'm2n3o4p',
    shortHash: 'm2n3o4p',
    message: 'refactor: extract collaboration manager to utility',
    author: 'Dave',
    authorColor: '#ec4899',
    date: Date.now() - 21600000,
    branch: 'develop',
    parents: ['q7r8s9t'],
    isMerge: false,
    files: [
      { name: 'ws-collab.ts', insertions: 95, deletions: 180 },
      { name: 'collaboration.ts', insertions: 200, deletions: 0 },
    ],
  },
  {
    hash: 'n4o5p6q',
    shortHash: 'n4o5p6q',
    message: 'chore: update i18n keys for canvas editor (+34 keys)',
    author: 'Alice',
    authorColor: '#6366f1',
    date: Date.now() - 25200000,
    branch: 'develop',
    parents: ['u1v2w3x'],
    isMerge: false,
    files: [
      { name: 'i18n.ts', insertions: 34, deletions: 0 },
      { name: 'i18n-data.ts', insertions: 68, deletions: 0 },
    ],
  },
  {
    hash: 'q7r8s9t',
    shortHash: 'q7r8s9t',
    message: 'hotfix: critical XSS vulnerability in chat input',
    author: 'Bob',
    authorColor: '#f59e0b',
    date: Date.now() - 28800000,
    branch: 'hotfix/auth',
    parents: ['u1v2w3x'],
    isMerge: false,
    tag: 'v2.3.1',
    files: [{ name: 'ChatInterface.tsx', insertions: 15, deletions: 3 }],
  },
  {
    hash: 'u1v2w3x',
    shortHash: 'u1v2w3x',
    message: 'release: v2.3.0 - multi-panel IDE layout',
    author: 'You',
    authorColor: '#818cf8',
    date: Date.now() - 86400000,
    branch: 'main',
    parents: [],
    isMerge: false,
    tag: 'v2.3.0',
    files: [
      { name: 'IDELayout.tsx', insertions: 450, deletions: 120 },
      { name: 'store.ts', insertions: 80, deletions: 30 },
    ],
  },
];

const HEAD_HASH = 'a1b2c3d';

/* ══════════════════════════════════════════ */
/*  GitGraph Component                        */
/* ══════════════════════════════════════════ */

interface GitGraphProps {
  open: boolean;
  onClose: () => void;
}

export function GitGraph({ open, onClose }: GitGraphProps) {
  const { theme, language } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [filterBranch, setFilterBranch] = useState<string | null>(null);

  const filteredCommits = useMemo(
    () => (filterBranch ? MOCK_COMMITS.filter((c) => c.branch === filterBranch) : MOCK_COMMITS),
    [filterBranch]
  );

  const selected = useMemo(
    () => MOCK_COMMITS.find((c) => c.hash === selectedCommit),
    [selectedCommit]
  );

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatRelative = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const getBranch = (name: string) => BRANCHES.find((b) => b.name === name);

  /* ── SVG graph rendering ── */
  const CELL_H = 48;
  const COL_W = 24;
  const DOT_R = 5;
  const LEFT_PAD = 20;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-6 py-3 border-b ${t.border.subtle}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.isDark ? 'bg-gradient-to-br from-indigo-500/20 to-cyan-500/20' : 'bg-gradient-to-br from-indigo-50 to-cyan-50'}`}
              >
                <GitBranch
                  className={`w-4 h-4 ${t.isDark ? 'text-indigo-400' : 'text-indigo-500'}`}
                />
              </div>
              <div>
                <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 700 }}>
                  {i.ggTitle}
                </h2>
                <p className={`text-[10px] ${t.text.dimmed}`}>
                  {i.ggSubtitle} · {MOCK_COMMITS.length} {i.ggCommit}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Branch filter */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterBranch(null)}
                  className={`px-2 py-0.5 rounded text-[8px] ${t.transition} ${!filterBranch ? t.accent.primaryBg + ' ' + t.accent.primary : t.interactive.iconBtn}`}
                >
                  All
                </button>
                {BRANCHES.map((b) => (
                  <button
                    key={b.name}
                    onClick={() => setFilterBranch(filterBranch === b.name ? null : b.name)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] ${t.transition} ${filterBranch === b.name ? t.accent.primaryBg + ' ' + t.accent.primary : t.interactive.iconBtn}`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                    {b.name.split('/').pop()}
                  </button>
                ))}
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl ${t.transition} ${t.interactive.iconBtn}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Graph + commit list */}
            <div className={`flex-1 overflow-y-auto ${t.scrollbar}`}>
              {filteredCommits.map((commit, _idx) => {
                const branch = getBranch(commit.branch);
                const col = branch?.column ?? 0;
                const isHead = commit.hash === HEAD_HASH;
                const isSelected = selectedCommit === commit.hash;

                return (
                  <button
                    key={commit.hash}
                    onClick={() => setSelectedCommit(isSelected ? null : commit.hash)}
                    className={`w-full flex items-center text-left px-2 py-0 border-b ${t.border.subtle} ${t.transition} ${
                      isSelected
                        ? t.isDark
                          ? 'bg-indigo-500/10'
                          : 'bg-indigo-50/80'
                        : t.interactive.menuItem
                    }`}
                    style={{ height: CELL_H }}
                  >
                    {/* SVG graph column */}
                    <div
                      className="flex-shrink-0"
                      style={{ width: LEFT_PAD + BRANCHES.length * COL_W }}
                    >
                      <svg width={LEFT_PAD + BRANCHES.length * COL_W} height={CELL_H}>
                        {/* Vertical lines for active branches */}
                        {BRANCHES.map((b) => (
                          <line
                            key={b.name}
                            x1={LEFT_PAD + b.column * COL_W}
                            y1={0}
                            x2={LEFT_PAD + b.column * COL_W}
                            y2={CELL_H}
                            stroke={b.color}
                            strokeWidth={1.5}
                            strokeOpacity={0.25}
                          />
                        ))}
                        {/* Merge lines */}
                        {commit.isMerge &&
                          commit.parents.length > 1 &&
                          (() => {
                            const parentCommit = MOCK_COMMITS.find(
                              (c) => c.hash === commit.parents[1]
                            );
                            const parentBranch = parentCommit
                              ? getBranch(parentCommit.branch)
                              : null;
                            if (!parentBranch) return null;
                            return (
                              <line
                                x1={LEFT_PAD + col * COL_W}
                                y1={CELL_H / 2}
                                x2={LEFT_PAD + parentBranch.column * COL_W}
                                y2={CELL_H / 2}
                                stroke={parentBranch.color}
                                strokeWidth={1.5}
                                strokeOpacity={0.5}
                                strokeDasharray="4 2"
                              />
                            );
                          })()}
                        {/* Commit dot */}
                        <circle
                          cx={LEFT_PAD + col * COL_W}
                          cy={CELL_H / 2}
                          r={commit.isMerge ? DOT_R + 1 : DOT_R}
                          fill={branch?.color || '#888'}
                          stroke={isHead ? '#fff' : 'transparent'}
                          strokeWidth={isHead ? 2 : 0}
                        />
                        {commit.isMerge && (
                          <circle
                            cx={LEFT_PAD + col * COL_W}
                            cy={CELL_H / 2}
                            r={DOT_R - 2}
                            fill={t.isDark ? '#0f172a' : '#fff'}
                          />
                        )}
                      </svg>
                    </div>

                    {/* Commit info */}
                    <div className="flex-1 min-w-0 flex items-center gap-2 pr-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isHead && (
                            <span
                              className={`text-[7px] px-1 py-0 rounded ${t.isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}
                              style={{ fontWeight: 700 }}
                            >
                              HEAD
                            </span>
                          )}
                          {commit.tag && (
                            <span
                              className={`flex items-center gap-0.5 text-[7px] px-1 py-0 rounded ${t.isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}
                            >
                              <Tag className="w-2 h-2" /> {commit.tag}
                            </span>
                          )}
                          {commit.isMerge && (
                            <GitMerge className="w-3 h-3 text-violet-400 flex-shrink-0" />
                          )}
                          <span
                            className={`text-[10px] truncate ${t.text.primary}`}
                            style={{ fontWeight: 500 }}
                          >
                            {commit.message}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`font-mono text-[8px] ${t.isDark ? 'text-cyan-400/60' : 'text-cyan-600/60'}`}
                          >
                            {commit.shortHash}
                          </span>
                          <span
                            className={`text-[8px]`}
                            style={{ color: commit.authorColor, fontWeight: 500 }}
                          >
                            {commit.author}
                          </span>
                          <span className={`text-[8px] ${t.text.dimmed}`}>
                            {formatRelative(commit.date)} ago
                          </span>
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: branch?.color }}
                          />
                          <span className={`text-[7px] ${t.text.dimmed}`}>{commit.branch}</span>
                        </div>
                      </div>
                      {/* Stats mini */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="flex items-center gap-0.5 text-[8px] text-emerald-400">
                          <Plus className="w-2 h-2" />
                          {commit.files.reduce((s, f) => s + f.insertions, 0)}
                        </span>
                        <span className="flex items-center gap-0.5 text-[8px] text-red-400">
                          <Minus className="w-2 h-2" />
                          {commit.files.reduce((s, f) => s + f.deletions, 0)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail panel */}
            {selected && (
              <div
                className={`w-72 flex-shrink-0 border-l ${t.border.subtle} overflow-y-auto ${t.scrollbar}`}
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <GitCommit className={`w-4 h-4 ${t.accent.primary}`} />
                    <span className={`text-[11px] ${t.text.primary}`} style={{ fontWeight: 700 }}>
                      {i.ggCommit}
                    </span>
                  </div>

                  {/* Hash */}
                  <div>
                    <label
                      className={`text-[7px] uppercase tracking-wider ${t.text.dimmed}`}
                      style={{ fontWeight: 600 }}
                    >
                      {i.ggHash}
                    </label>
                    <p
                      className={`font-mono text-[10px] mt-0.5 ${t.isDark ? 'text-cyan-400' : 'text-cyan-600'}`}
                    >
                      {selected.hash}
                    </p>
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      className={`text-[7px] uppercase tracking-wider ${t.text.dimmed}`}
                      style={{ fontWeight: 600 }}
                    >
                      {i.ggMessage}
                    </label>
                    <p className={`text-[10px] mt-0.5 ${t.text.primary}`}>{selected.message}</p>
                  </div>

                  {/* Author & date */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        className={`text-[7px] uppercase tracking-wider ${t.text.dimmed}`}
                        style={{ fontWeight: 600 }}
                      >
                        {i.ggAuthor}
                      </label>
                      <p
                        className="text-[9px] mt-0.5"
                        style={{ color: selected.authorColor, fontWeight: 500 }}
                      >
                        {selected.author}
                      </p>
                    </div>
                    <div>
                      <label
                        className={`text-[7px] uppercase tracking-wider ${t.text.dimmed}`}
                        style={{ fontWeight: 600 }}
                      >
                        {i.ggDate}
                      </label>
                      <p className={`text-[9px] mt-0.5 ${t.text.muted}`}>
                        {formatDate(selected.date)}
                      </p>
                    </div>
                  </div>

                  {/* Branch */}
                  <div>
                    <label
                      className={`text-[7px] uppercase tracking-wider ${t.text.dimmed}`}
                      style={{ fontWeight: 600 }}
                    >
                      {i.ggBranch}
                    </label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getBranch(selected.branch)?.color }}
                      />
                      <span className={`text-[9px] ${t.text.primary}`}>{selected.branch}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {selected.tag && (
                    <div>
                      <label
                        className={`text-[7px] uppercase tracking-wider ${t.text.dimmed}`}
                        style={{ fontWeight: 600 }}
                      >
                        {i.ggTag}
                      </label>
                      <div
                        className={`flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-lg w-fit ${t.isDark ? 'bg-amber-500/15' : 'bg-amber-50'}`}
                      >
                        <Tag className="w-2.5 h-2.5 text-amber-400" />
                        <span className="text-[9px] text-amber-400" style={{ fontWeight: 600 }}>
                          {selected.tag}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Files changed */}
                  <div className={`border-t pt-3 ${t.border.subtle}`}>
                    <label
                      className={`text-[7px] uppercase tracking-wider ${t.text.dimmed}`}
                      style={{ fontWeight: 600 }}
                    >
                      {i.ggFilesChanged} ({selected.files.length})
                    </label>
                    <div className="mt-1.5 space-y-1">
                      {selected.files.map((f, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${t.isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}
                        >
                          <FileCode className={`w-3 h-3 flex-shrink-0 ${t.text.muted}`} />
                          <span className={`flex-1 text-[9px] truncate ${t.text.primary}`}>
                            {f.name}
                          </span>
                          <span className="text-[8px] text-emerald-400">+{f.insertions}</span>
                          <span className="text-[8px] text-red-400">-{f.deletions}</span>
                        </div>
                      ))}
                    </div>
                    {/* Total stats */}
                    <div
                      className={`flex items-center justify-between mt-2 px-2 py-1 rounded-lg ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}
                    >
                      <span className={`text-[8px] ${t.text.dimmed}`}>Total</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-emerald-400" style={{ fontWeight: 600 }}>
                          +{selected.files.reduce((s, f) => s + f.insertions, 0)} {i.ggInsertions}
                        </span>
                        <span className="text-[8px] text-red-400" style={{ fontWeight: 600 }}>
                          -{selected.files.reduce((s, f) => s + f.deletions, 0)} {i.ggDeletions}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
