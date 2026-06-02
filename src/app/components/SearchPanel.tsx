/**
 * @file SearchPanel.tsx
 * @description YYC³便携式智能AI系统 - 全局搜索面板
 * Global Search Panel
 * Full-featured search overlay with file/code search, filters (case sensitive,
 * regex, whole word), and grouped results with line-number context.
 * Triggered via Ctrl+Shift+F.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,search,ui,panel
 */

import {
  Search,
  X,
  CaseSensitive,
  Regex,
  WholeWord,
  ChevronDown,
  ChevronRight,
  File,
  Replace,
  ReplaceAll,
  ChevronUp,
  Filter,
  FolderOpen,
  Check,
} from 'lucide-react';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

import { VirtualList } from './VirtualList';

/** Mock file content for search simulation */
const MOCK_FILES: Record<string, string[]> = {
  'App.tsx': [
    'import React from "react"',
    'import { RouterProvider } from "react-router"',
    'import { Toaster } from "sonner"',
    'import { router } from "./routes"',
    'export default function App() {',
    '  const theme = useAppStore((s) => s.theme)',
    '  return <RouterProvider router={router} />',
    '}',
  ],
  'store.ts': [
    'import { create } from "zustand"',
    'import { persist } from "zustand/middleware"',
    'export type ViewMode = "code" | "preview" | "fullscreen"',
    'export const useAppStore = create<AppState>()()',
    '  theme: "dark",',
    '  language: "zh",',
    '  viewMode: "code",',
    '  panelMap: { left: "chat", middle: "files", right: "code" },',
  ],
  'types.ts': [
    'export interface DesignRoot {',
    '  version: string',
    '  theme: "light" | "dark"',
    '  panels: PanelSpec[]',
    '  components: ComponentSpec[]',
    '}',
    'export interface PanelSpec {',
    '  id: string',
    '  type: "container" | "content" | "preview"',
    '}',
  ],
  'routes.ts': [
    'import { createBrowserRouter } from "react-router"',
    'import { HomePage } from "./components/HomePage"',
    'import { IDELayout } from "./components/IDELayout"',
    'export const router = createBrowserRouter([',
    '  { path: "/", Component: HomePage },',
    '  { path: "/ide", Component: IDELayout },',
    '])',
  ],
  'ChatInterface.tsx': [
    'import React, { useState } from "react"',
    'import ReactMarkdown from "react-markdown"',
    'import { motion, AnimatePresence } from "motion/react"',
    'export function ChatInterface() {',
    '  const [input, setInput] = useState("")',
    '  const handleSend = () => { ... }',
    '  return <div className="flex flex-col h-full">...</div>',
    '}',
  ],
  'FileManager.tsx': [
    'import React, { useState } from "react"',
    'export function FileManager() {',
    '  const [expandedFolders, setExpandedFolders] = useState<Set<string>>()',
    '  const [searchTerm, setSearchTerm] = useState("")',
    '  return <div className="flex flex-col h-full">...</div>',
    '}',
  ],
  'CodeEditor.tsx': [
    'import React, { useState, useEffect } from "react"',
    'import Editor from "@monaco-editor/react"',
    'export function CodeEditor() {',
    '  const { selectedFile, theme } = useAppStore()',
    '  return <Editor theme={theme === "dark" ? "vs-dark" : "light"} />',
    '}',
  ],
  'theme.ts': [
    'export type ThemeMode = "light" | "dark" | "midnight" | "forest" | "sunset"',
    'export const THEME_PRESETS = [...]',
    'export function getThemeTokens(theme: ThemeMode) { ... }',
  ],
  'i18n.ts': [
    'export type Language = "zh" | "en"',
    'export interface I18nStrings { ... }',
    'export function resolveKey(i: I18nStrings, key: string): string { ... }',
  ],
};

interface SearchResult {
  file: string;
  line: number;
  text: string;
  matchStart: number;
  matchEnd: number;
}

export function SearchPanel() {
  const { theme, language, searchPanelOpen, setSearchPanelOpen, setSelectedFile } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [searchMode, setSearchMode] = useState<'files' | 'code'>('code');

  // Replace state
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceValue, setReplaceValue] = useState('');
  const [preserveCase, setPreserveCase] = useState(false);
  const [includeFilter, setIncludeFilter] = useState('');
  const [excludeFilter, setExcludeFilter] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [replacedItems, setReplacedItems] = useState<Set<string>>(new Set());

  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (searchPanelOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchPanelOpen]);

  // Search logic
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const matches: SearchResult[] = [];
    try {
      const pattern = useRegex
        ? new RegExp(wholeWord ? `\\b${query}\\b` : query, caseSensitive ? 'g' : 'gi')
        : new RegExp(
            wholeWord
              ? `\\b${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`
              : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            caseSensitive ? 'g' : 'gi'
          );

      for (const [file, lines] of Object.entries(MOCK_FILES)) {
        if (searchMode === 'files') {
          // Search file names only
          if (pattern.test(file)) {
            matches.push({ file, line: 0, text: file, matchStart: 0, matchEnd: file.length });
          }
        } else {
          // Search code content
          lines.forEach((lineText, idx) => {
            const match = pattern.exec(lineText);
            if (match) {
              matches.push({
                file,
                line: idx + 1,
                text: lineText,
                matchStart: match.index,
                matchEnd: match.index + match[0].length,
              });
            }
            pattern.lastIndex = 0; // reset for global regex
          });
        }
      }
    } catch {
      // Invalid regex — ignore
    }
    return matches;
  }, [query, caseSensitive, useRegex, wholeWord, searchMode]);

  // Group results by file
  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of results) {
      if (!map.has(r.file)) map.set(r.file, []);
      map.get(r.file)!.push(r);
    }
    return map;
  }, [results]);

  // Auto-expand all files when results change
  useEffect(() => {
    setExpandedFiles(new Set(grouped.keys()));
  }, [grouped]);

  const toggleFile = (file: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file);
      else next.add(file);
      return next;
    });
  };

  const handleResultClick = (file: string) => {
    setSelectedFile(file);
    setSearchPanelOpen(false);
  };

  // ── Flatten grouped results for VirtualList ──
  type FlatResultItem =
    | { kind: 'header'; file: string; count: number }
    | { kind: 'result'; result: SearchResult; isReplaced: boolean };

  const flatResults = useMemo<FlatResultItem[]>(() => {
    const items: FlatResultItem[] = [];
    for (const [file, fileResults] of grouped.entries()) {
      items.push({ kind: 'header', file, count: fileResults.length });
      if (expandedFiles.has(file)) {
        for (const r of fileResults) {
          const itemKey = `${r.file}:${r.line}`;
          items.push({ kind: 'result', result: r, isReplaced: replacedItems.has(itemKey) });
        }
      }
    }
    return items;
  }, [grouped, expandedFiles, replacedItems]);

  const useVirtual = flatResults.length > 30;

  if (!searchPanelOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={() => setSearchPanelOpen(false)}
      />
      <div className="fixed inset-0 z-[61] flex items-start justify-center pt-[10vh]">
        <div
          className={`w-full max-w-2xl max-h-[70vh] rounded-2xl overflow-hidden flex flex-col ${t.surface.popover} ${t.border.popover} shadow-2xl`}
        >
          {/* ── Header with search input ── */}
          <div className={`px-4 py-3 border-b ${t.border.subtle}`}>
            <div className="flex items-center space-x-2">
              <Search className={`w-4 h-4 flex-shrink-0 ${t.text.muted}`} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={i.spPlaceholder}
                className={`flex-1 bg-transparent border-none outline-none text-[14px] ${t.text.primary} placeholder:${t.text.dimmed}`}
              />
              <button
                onClick={() => setSearchPanelOpen(false)}
                className={`p-1 rounded-lg ${t.transition} ${t.interactive.iconBtn}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Replace input row ── */}
            <div className="flex items-center space-x-2 mt-2">
              <button
                onClick={() => {
                  setReplaceOpen(!replaceOpen);
                  if (!replaceOpen) setTimeout(() => replaceInputRef.current?.focus(), 50);
                }}
                className={`p-1 rounded-lg flex-shrink-0 ${t.transition} ${replaceOpen ? t.accent.primary : ''} ${t.interactive.iconBtn}`}
                title={i.srReplace}
              >
                {replaceOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <Replace className="w-3.5 h-3.5" />
                )}
              </button>
              {replaceOpen && (
                <>
                  <input
                    ref={replaceInputRef}
                    type="text"
                    value={replaceValue}
                    onChange={(e) => setReplaceValue(e.target.value)}
                    placeholder={i.srReplacePlaceholder}
                    className={`flex-1 bg-transparent border rounded-lg px-2 py-1 outline-none text-[13px] ${t.text.primary} ${t.border.subtle} placeholder:${t.text.dimmed}`}
                  />
                  <button
                    onClick={() => {
                      if (!query.trim() || !replaceValue) return;
                      const count = results.filter(
                        (r) => !replacedItems.has(`${r.file}:${r.line}`)
                      ).length;
                      const allKeys = results.map((r) => `${r.file}:${r.line}`);
                      setReplacedItems(new Set(allKeys));
                      toast.success(i.srReplaceCount.replace('{n}', String(count)));
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] flex-shrink-0 ${t.transition} ${t.accent.solidBtn}`}
                    title={i.srReplaceAll}
                    style={{ fontWeight: 600 }}
                  >
                    <ReplaceAll className="w-3 h-3" /> {i.srReplaceAll}
                  </button>
                  <FilterToggle
                    icon={<CaseSensitive className="w-3 h-3" />}
                    label={i.srPreserveCase}
                    active={preserveCase}
                    onToggle={() => setPreserveCase(!preserveCase)}
                    t={t}
                  />
                  <button
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className={`p-1 rounded-lg flex-shrink-0 ${t.transition} ${filtersOpen ? t.accent.primary : ''} ${t.interactive.iconBtn}`}
                    title={i.srIncludeFiles}
                  >
                    <Filter className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* ── Include/Exclude file filters ── */}
            {replaceOpen && filtersOpen && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 flex items-center gap-1">
                  <FolderOpen className={`w-3 h-3 flex-shrink-0 ${t.text.muted}`} />
                  <input
                    type="text"
                    value={includeFilter}
                    onChange={(e) => setIncludeFilter(e.target.value)}
                    placeholder={i.srIncludeFiles + ' (*.tsx, *.ts)'}
                    className={`flex-1 bg-transparent border rounded-lg px-2 py-0.5 outline-none text-[10px] ${t.text.primary} ${t.border.subtle}`}
                  />
                </div>
                <div className="flex-1 flex items-center gap-1">
                  <X className={`w-3 h-3 flex-shrink-0 ${t.text.muted}`} />
                  <input
                    type="text"
                    value={excludeFilter}
                    onChange={(e) => setExcludeFilter(e.target.value)}
                    placeholder={i.srExcludeFiles + ' (node_modules)'}
                    className={`flex-1 bg-transparent border rounded-lg px-2 py-0.5 outline-none text-[10px] ${t.text.primary} ${t.border.subtle}`}
                  />
                </div>
              </div>
            )}

            {/* ── Filter toggles ── */}
            <div className="flex items-center space-x-2 mt-2">
              {/* Mode tabs */}
              <div
                className={`flex rounded-lg overflow-hidden ${t.isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}
              >
                <button
                  onClick={() => setSearchMode('code')}
                  className={`px-2.5 py-1 text-[11px] ${t.transition} ${
                    searchMode === 'code'
                      ? `${t.accent.primaryBg} ${t.accent.primary}`
                      : t.text.muted
                  }`}
                  style={{ fontWeight: searchMode === 'code' ? 600 : 400 }}
                >
                  {i.spCode}
                </button>
                <button
                  onClick={() => setSearchMode('files')}
                  className={`px-2.5 py-1 text-[11px] ${t.transition} ${
                    searchMode === 'files'
                      ? `${t.accent.primaryBg} ${t.accent.primary}`
                      : t.text.muted
                  }`}
                  style={{ fontWeight: searchMode === 'files' ? 600 : 400 }}
                >
                  {i.spFiles}
                </button>
              </div>

              <div className={`w-px h-4 ${t.border.dividerV}`} />

              {/* Toggle buttons */}
              <FilterToggle
                icon={<CaseSensitive className="w-3.5 h-3.5" />}
                label={i.spCaseSensitive}
                active={caseSensitive}
                onToggle={() => setCaseSensitive(!caseSensitive)}
                t={t}
              />
              <FilterToggle
                icon={<Regex className="w-3.5 h-3.5" />}
                label={i.spRegex}
                active={useRegex}
                onToggle={() => setUseRegex(!useRegex)}
                t={t}
              />
              <FilterToggle
                icon={<WholeWord className="w-3.5 h-3.5" />}
                label={i.spWholeWord}
                active={wholeWord}
                onToggle={() => setWholeWord(!wholeWord)}
                t={t}
              />
            </div>
          </div>

          {/* ── Results ── */}
          <div className={`flex-1 overflow-y-auto ${t.scrollbar}`}>
            {query.trim() && results.length === 0 && (
              <div className={`py-12 text-center text-[13px] ${t.text.muted}`}>
                <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                {i.spNoResults}
              </div>
            )}

            {!query.trim() && (
              <div className={`py-12 text-center text-[13px] ${t.text.dimmed}`}>
                <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                Ctrl+Shift+F
              </div>
            )}

            {results.length > 0 && (
              <div className="p-2">
                {/* Results count */}
                <div className={`px-3 py-1.5 text-[11px] ${t.text.dimmed}`}>
                  {i.spResultsCount.replace('{n}', String(results.length))}
                </div>

                {/* Grouped by file */}
                {useVirtual ? (
                  <VirtualList
                    items={flatResults}
                    itemHeight={28}
                    overscan={8}
                    className="h-[400px]"
                    getKey={(item, idx) =>
                      item.kind === 'header'
                        ? `hdr-${item.file}`
                        : `res-${item.result.file}-${item.result.line}-${idx}`
                    }
                    onItemActivate={(item) => {
                      if (item.kind === 'header') {
                        toggleFile(item.file);
                      } else {
                        handleResultClick(item.result.file);
                      }
                    }}
                    focusedClassName={
                      t.isDark ? 'bg-indigo-500/10 rounded-lg' : 'bg-indigo-50 rounded-lg'
                    }
                    renderItem={(item, _idx, _isFocused) => {
                      if (item.kind === 'header') {
                        return (
                          <button
                            onClick={() => toggleFile(item.file)}
                            className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[12px] ${t.transition} ${t.interactive.menuItem}`}
                            style={{ fontWeight: 500 }}
                          >
                            {expandedFiles.has(item.file) ? (
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-3 h-3 flex-shrink-0" />
                            )}
                            <File className={`w-3.5 h-3.5 flex-shrink-0 ${t.accent.primary}`} />
                            <span className="truncate">{item.file}</span>
                            <span
                              className={`ml-auto flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px] ${t.isDark ? 'bg-slate-700/50' : 'bg-slate-200/80'} ${t.text.dimmed}`}
                            >
                              {item.count}
                            </span>
                          </button>
                        );
                      } else {
                        const r = item.result;
                        const itemKey = `${r.file}:${r.line}`;
                        const isReplaced = item.isReplaced;
                        return (
                          <div
                            key={`${r.file}-${r.line}`}
                            className={`group flex items-center space-x-2 px-3 py-1.5 rounded-lg text-left ${t.transition} ${
                              isReplaced ? `opacity-40 line-through` : ''
                            } ${t.interactive.menuItem}`}
                          >
                            <button
                              onClick={() => handleResultClick(r.file)}
                              className="flex-1 flex items-center space-x-2 min-w-0"
                            >
                              <span
                                className={`flex-shrink-0 text-[10px] w-6 text-right font-mono ${t.text.dimmed}`}
                              >
                                {r.line}
                              </span>
                              <span className="flex-1 text-[12px] font-mono truncate">
                                {r.text.substring(0, r.matchStart)}
                                <span
                                  className={`${t.isDark ? 'bg-amber-500/30 text-amber-200' : 'bg-amber-200 text-amber-800'} rounded px-0.5`}
                                >
                                  {r.text.substring(r.matchStart, r.matchEnd)}
                                </span>
                                {replaceOpen && replaceValue && !isReplaced && (
                                  <span
                                    className={`${t.isDark ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'} rounded px-0.5 ml-0.5`}
                                  >
                                    {replaceValue}
                                  </span>
                                )}
                                {r.text.substring(r.matchEnd)}
                              </span>
                            </button>
                            {/* Per-item replace buttons */}
                            {replaceOpen && replaceValue && !isReplaced && (
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                                <button
                                  onClick={() => {
                                    setReplacedItems((prev) => new Set([...prev, itemKey]));
                                    toast.success(i.srReplaceCount.replace('{n}', '1'));
                                  }}
                                  className={`p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
                                  title={i.srReplace}
                                >
                                  <Replace className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    /* skip */
                                  }}
                                  className={`p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
                                  title={i.srSkip}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            {isReplaced && (
                              <Check className={`w-3 h-3 flex-shrink-0 ${t.status.success}`} />
                            )}
                          </div>
                        );
                      }
                    }}
                  />
                ) : (
                  Array.from(grouped.entries()).map(([file, fileResults]) => (
                    <div key={file} className="mb-1">
                      {/* File header */}
                      <button
                        onClick={() => toggleFile(file)}
                        className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[12px] ${t.transition} ${t.interactive.menuItem}`}
                        style={{ fontWeight: 500 }}
                      >
                        {expandedFiles.has(file) ? (
                          <ChevronDown className="w-3 h-3 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        )}
                        <File className={`w-3.5 h-3.5 flex-shrink-0 ${t.accent.primary}`} />
                        <span className="truncate">{file}</span>
                        <span
                          className={`ml-auto flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px] ${t.isDark ? 'bg-slate-700/50' : 'bg-slate-200/80'} ${t.text.dimmed}`}
                        >
                          {fileResults.length}
                        </span>
                      </button>

                      {/* File results */}
                      {expandedFiles.has(file) && (
                        <div className="ml-5 space-y-0.5">
                          {fileResults.map((r, idx) => {
                            const itemKey = `${r.file}:${r.line}`;
                            const isReplaced = replacedItems.has(itemKey);
                            return (
                              <div
                                key={`${r.file}-${r.line}-${idx}`}
                                className={`group flex items-center space-x-2 px-3 py-1.5 rounded-lg text-left ${t.transition} ${
                                  isReplaced ? `opacity-40 line-through` : ''
                                } ${t.interactive.menuItem}`}
                              >
                                <button
                                  onClick={() => handleResultClick(r.file)}
                                  className="flex-1 flex items-center space-x-2 min-w-0"
                                >
                                  <span
                                    className={`flex-shrink-0 text-[10px] w-6 text-right font-mono ${t.text.dimmed}`}
                                  >
                                    {r.line}
                                  </span>
                                  <span className="flex-1 text-[12px] font-mono truncate">
                                    {r.text.substring(0, r.matchStart)}
                                    <span
                                      className={`${t.isDark ? 'bg-amber-500/30 text-amber-200' : 'bg-amber-200 text-amber-800'} rounded px-0.5`}
                                    >
                                      {r.text.substring(r.matchStart, r.matchEnd)}
                                    </span>
                                    {replaceOpen && replaceValue && !isReplaced && (
                                      <span
                                        className={`${t.isDark ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'} rounded px-0.5 ml-0.5`}
                                      >
                                        {replaceValue}
                                      </span>
                                    )}
                                    {r.text.substring(r.matchEnd)}
                                  </span>
                                </button>
                                {/* Per-item replace buttons */}
                                {replaceOpen && replaceValue && !isReplaced && (
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                                    <button
                                      onClick={() => {
                                        setReplacedItems((prev) => new Set([...prev, itemKey]));
                                        toast.success(i.srReplaceCount.replace('{n}', '1'));
                                      }}
                                      className={`p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
                                      title={i.srReplace}
                                    >
                                      <Replace className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        /* skip */
                                      }}
                                      className={`p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
                                      title={i.srSkip}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                                {isReplaced && (
                                  <Check className={`w-3 h-3 flex-shrink-0 ${t.status.success}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className={`flex items-center justify-between px-4 py-2 border-t ${t.border.subtle} text-[10px] ${t.text.dimmed}`}
          >
            <div className="flex items-center space-x-3">
              <span>
                <kbd className={`px-1 py-0.5 rounded ${t.kbd}`}>↑↓</kbd> navigate
              </span>
              <span>
                <kbd className={`px-1 py-0.5 rounded ${t.kbd}`}>Enter</kbd> open
              </span>
              <span>
                <kbd className={`px-1 py-0.5 rounded ${t.kbd}`}>Esc</kbd> close
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Filter toggle button ── */
function FilterToggle({
  icon,
  label,
  active,
  onToggle,
  t,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onToggle: () => void;
  t: ReturnType<typeof getThemeTokens>;
}) {
  return (
    <button
      onClick={onToggle}
      className={`p-1.5 rounded-lg ${t.transition} ${
        active ? `${t.accent.primaryBg} ${t.accent.primary}` : t.interactive.iconBtn
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}
