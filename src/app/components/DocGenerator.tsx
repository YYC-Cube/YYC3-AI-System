/**
 * @file DocGenerator.tsx
 * @description YYC³便携式智能AI系统 - AI驱动的自动文档生成器
 * AI-Driven Automatic Documentation Generator
 * Scans project files, generates Markdown/JSDoc/TSDoc documentation,
 * coverage metrics, undocumented items list, export/copy.
 * Liquid Glass aesthetic, fully i18n-driven. Prefix: dg*
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,documentation,ai,generator
 */

import {
  BookOpen,
  X,
  Sparkles,
  Copy,
  Download,
  Loader2,
  FileText,
  Code,
  Package,
  Globe,
  ChevronRight,
  Check,
  AlertTriangle,
  BarChart3,
  Eye,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

import { RichTextEditor } from './RichTextEditor';

/* ── Simple Markdown to HTML converter ── */
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    .replace(/^---$/gm, '<hr />')
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/g, '').replace(/```/g, '');
      return `<pre><code>${code}</code></pre>`;
    })
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[huplob])/gm, (line) => (line ? `<p>${line}</p>` : ''))
    .replace(/<p><\/p>/g, '');
}

/* ── Types ── */
type DocFormat = 'markdown' | 'jsdoc' | 'tsdoc';
type DocType = 'component' | 'function' | 'module' | 'api' | 'readme' | 'changelog';

interface DocItem {
  id: string;
  name: string;
  type: DocType;
  file: string;
  documented: boolean;
  coverage: number; // 0-100
}

/* ── Mock file analysis ── */
const MOCK_ITEMS: DocItem[] = [
  {
    id: 'd1',
    name: 'IDELayout',
    type: 'component',
    file: 'IDELayout.tsx',
    documented: true,
    coverage: 85,
  },
  {
    id: 'd2',
    name: 'ChatInterface',
    type: 'component',
    file: 'ChatInterface.tsx',
    documented: true,
    coverage: 72,
  },
  {
    id: 'd3',
    name: 'CodeEditor',
    type: 'component',
    file: 'CodeEditor.tsx',
    documented: false,
    coverage: 45,
  },
  {
    id: 'd4',
    name: 'FileManager',
    type: 'component',
    file: 'FileManager.tsx',
    documented: true,
    coverage: 90,
  },
  {
    id: 'd5',
    name: 'useAppStore',
    type: 'function',
    file: 'store.ts',
    documented: false,
    coverage: 30,
  },
  {
    id: 'd6',
    name: 'getThemeTokens',
    type: 'function',
    file: 'theme.ts',
    documented: true,
    coverage: 95,
  },
  { id: 'd7', name: 'getI18n', type: 'function', file: 'i18n.ts', documented: true, coverage: 88 },
  {
    id: 'd8',
    name: 'collabManager',
    type: 'module',
    file: 'collaboration.ts',
    documented: false,
    coverage: 20,
  },
  {
    id: 'd9',
    name: 'wsCollab',
    type: 'module',
    file: 'ws-collab.ts',
    documented: false,
    coverage: 15,
  },
  {
    id: 'd10',
    name: 'aiCompletion',
    type: 'module',
    file: 'ai-completion.ts',
    documented: true,
    coverage: 78,
  },
  {
    id: 'd11',
    name: '/api/v2/users',
    type: 'api',
    file: 'routes.ts',
    documented: false,
    coverage: 0,
  },
  {
    id: 'd12',
    name: '/api/v2/projects',
    type: 'api',
    file: 'routes.ts',
    documented: false,
    coverage: 0,
  },
  {
    id: 'd13',
    name: 'FlameGraph',
    type: 'component',
    file: 'FlameGraph.tsx',
    documented: true,
    coverage: 82,
  },
  {
    id: 'd14',
    name: 'ErDiagram',
    type: 'component',
    file: 'ErDiagram.tsx',
    documented: true,
    coverage: 80,
  },
  {
    id: 'd15',
    name: 'ApiTester',
    type: 'component',
    file: 'ApiTester.tsx',
    documented: true,
    coverage: 76,
  },
];

/* ── Mock generated docs ── */
const MOCK_DOCS: Record<string, string> = {
  IDELayout: `# IDELayout Component

## Overview
The \`IDELayout\` component is the main layout container for YYC3 PortAISys IDE.
It implements a three-column resizable panel system with drag-and-drop panel swapping.

## Props
This component takes no external props. All state is managed via \`useAppStore\`.

## Layout Structure
\`\`\`
┌─────────────────────────────────────────────────┐
│  Header (full width)                              │
├────────────┬──────────────┬──────────────────────┤
│  Left 35%  │  Middle 30%  │  Right 35%           │
│  AI Chat   │  File Manager│  Code Editor         │
├────────────┴──────────────┴──────────────────────┤
│  Integrated Terminal (collapsible)                │
└──────────────────────────────────────────────────┘
\`\`\`

## Features
- **Resizable panels** via \`react-resizable-panels\`
- **Drag-and-drop** panel swapping via \`react-dnd\`
- **View modes**: Code, Preview, Fullscreen
- **Keyboard shortcuts**: Ctrl+1 (Preview), Ctrl+2 (Code), Esc (Back)
- **Terminal**: Toggleable, spans mid+right columns

## Dependencies
- \`react-resizable-panels\` - Panel layout engine
- \`react-dnd\` + \`react-dnd-html5-backend\` - DnD system
- \`zustand\` - State management via \`useAppStore\`

## Example
\`\`\`tsx
import { IDELayout } from './components/IDELayout'

function App() {
  return <IDELayout />
}
\`\`\``,

  useAppStore: `# useAppStore (Zustand Store)

## Overview
Global state management store for YYC3 PortAISys, built with Zustand + persist middleware.

## State Shape

### Core State
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`theme\` | \`ThemeMode\` | \`'dark'\` | Current theme mode |
| \`language\` | \`Language\` | \`'zh'\` | Current UI language |
| \`viewMode\` | \`ViewMode\` | \`'code'\` | Active view mode |
| \`selectedFile\` | \`string \\| null\` | \`'ChatInterface.tsx'\` | Currently open file |
| \`terminalVisible\` | \`boolean\` | \`false\` | Terminal panel visibility |
| \`messages\` | \`Message[]\` | \`[]\` | Chat message history |

### AI Model Management
| Property | Type | Description |
|----------|------|-------------|
| \`aiModels\` | \`AIModel[]\` | Registered AI model providers |
| \`activeModelId\` | \`string \\| null\` | Currently active model |
| \`modelSettingsOpen\` | \`boolean\` | Model settings dialog state |

### Persistence
The store persists the following keys to LocalStorage under key \`'yyc3-storage'\`:
- \`theme\`, \`language\`, \`viewMode\`, \`selectedFile\`
- \`terminalVisible\`, \`terminalHeight\`, \`messages\`
- \`recentProjects\`, \`aiModels\`, \`activeModelId\`
- \`customThemeConfig\`, \`panelMap\`, \`openTabs\`, \`pinnedTabs\`

## Usage
\`\`\`tsx
import { useAppStore } from '../store'

function MyComponent() {
  const { theme, toggleTheme, language } = useAppStore()
  return <button onClick={toggleTheme}>{theme}</button>
}
\`\`\``,

  collabManager: `# collabManager Module

## Overview
WebSocket-based real-time collaboration manager using Yjs CRDT data structures.
Manages multi-user presence, file locking, cursor synchronization, and operation broadcasting.

## API

### \`collabManager.init(localUser, files)\`
Initialize the collaboration engine.

| Param | Type | Description |
|-------|------|-------------|
| \`localUser\` | \`CollabUser\` | Local user identity |
| \`files\` | \`Record<string, string>\` | Initial file contents |

### \`collabManager.getUsers()\`
Returns all connected users with their presence state.

**Returns:** \`CollabUser[]\`

### \`collabManager.awareness\`
Yjs Awareness instance for real-time presence updates.

## Events
- \`'change'\` - Fired when any user's awareness state changes
- \`'update'\` - Fired when document content is modified

## Connection Lifecycle
1. WebSocket connection with exponential backoff retry
2. Heartbeat keepalive (30s interval)
3. Automatic reconnection on disconnect
4. Graceful cleanup on unmount`,
};

const TYPE_ICONS: Record<DocType, typeof FileText> = {
  component: Code,
  function: FileText,
  module: Package,
  api: Globe,
  readme: BookOpen,
  changelog: BarChart3,
};
const TYPE_COLORS: Record<DocType, string> = {
  component: '#6366f1',
  function: '#10b981',
  module: '#f59e0b',
  api: '#ef4444',
  readme: '#3b82f6',
  changelog: '#8b5cf6',
};

/* ═════════════════════════════════════════ */

interface DocGeneratorProps {
  open: boolean;
  onClose: () => void;
}

export function DocGenerator({ open, onClose }: DocGeneratorProps) {
  const { theme, language } = useAppStore();
  const t = getThemeTokens(theme);
  const ii = getI18n(language);

  const [items] = useState<DocItem[]>(MOCK_ITEMS);
  const [filterType, setFilterType] = useState<DocType | 'all'>('all');
  const [format, setFormat] = useState<DocFormat>('markdown');
  const [generating, setGenerating] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [viewMode, setViewMode] = useState<'source' | 'rich'>('source');

  const filtered = useMemo(
    () => (filterType === 'all' ? items : items.filter((it) => it.type === filterType)),
    [items, filterType]
  );

  const overallCoverage = useMemo(() => {
    const total = items.reduce((s, it) => s + it.coverage, 0);
    return Math.round(total / items.length);
  }, [items]);

  const undocumentedCount = useMemo(() => items.filter((it) => !it.documented).length, [items]);

  const generateDoc = useCallback(
    (itemId: string) => {
      const item = items.find((it) => it.id === itemId);
      if (!item) return;
      setGenerating(true);
      setSelectedItem(itemId);
      setGeneratedDoc(null);

      setTimeout(
        () => {
          const doc =
            MOCK_DOCS[item.name] ||
            `# ${item.name}\n\n## Overview\nAuto-generated documentation for \`${item.name}\` (${item.type}).\n\n## File\n\`${item.file}\`\n\n## Status\n- Coverage: ${item.coverage}%\n- Documented: ${item.documented ? 'Yes' : 'No'}\n\n> Generated by YYC3 AI Doc Generator`;
          setGeneratedDoc(doc);
          setGenerating(false);
        },
        1200 + Math.random() * 800
      );
    },
    [items]
  );

  const generateAll = useCallback(() => {
    setGenerating(true);
    setSelectedItem(null);
    setGeneratedDoc(null);
    setTimeout(() => {
      const allDocs = items
        .map((it) => {
          const doc =
            MOCK_DOCS[it.name] || `# ${it.name}\n\nAuto-generated doc for \`${it.name}\`.`;
          return `---\n\n${doc}`;
        })
        .join('\n\n');
      setGeneratedDoc(allDocs);
      setGenerating(false);
      toast.success(ii.dgGenerate);
    }, 2500);
  }, [items, ii]);

  const copyDoc = useCallback(() => {
    if (!generatedDoc) return;
    navigator.clipboard.writeText(generatedDoc);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2000);
    toast.success(ii.dgCopy);
  }, [generatedDoc, ii]);

  const coverageColor = (c: number) => (c >= 80 ? '#10b981' : c >= 50 ? '#f59e0b' : '#ef4444');

  const DOC_TYPES: { type: DocType | 'all'; labelKey: string }[] = [
    { type: 'all', labelKey: 'tmpAll' },
    { type: 'component', labelKey: 'dgComponent' },
    { type: 'function', labelKey: 'dgFunction' },
    { type: 'module', labelKey: 'dgModule' },
    { type: 'api', labelKey: 'dgApi' },
  ];

  const FORMATS: { fmt: DocFormat; labelKey: string }[] = [
    { fmt: 'markdown', labelKey: 'dgMarkdown' },
    { fmt: 'jsdoc', labelKey: 'dgJsdoc' },
    { fmt: 'tsdoc', labelKey: 'dgTsdoc' },
  ];

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
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
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.isDark ? 'bg-gradient-to-br from-blue-500/20 to-violet-500/20' : 'bg-gradient-to-br from-blue-50 to-violet-50'}`}
              >
                <BookOpen className={`w-4 h-4 ${t.isDark ? 'text-blue-400' : 'text-blue-500'}`} />
              </div>
              <div>
                <h2 className={`text-[14px] ${t.text.primary}`} style={{ fontWeight: 700 }}>
                  {ii.dgTitle}
                </h2>
                <p className={`text-[10px] ${t.text.dimmed}`}>
                  {ii.dgSubtitle} · {items.length} items
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Coverage badge */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${t.isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}
              >
                <BarChart3 className="w-3 h-3" style={{ color: coverageColor(overallCoverage) }} />
                <span
                  className="text-[9px]"
                  style={{ color: coverageColor(overallCoverage), fontWeight: 700 }}
                >
                  {ii.dgCoverage}: {overallCoverage}%
                </span>
                <span className={`text-[8px] ${t.text.dimmed}`}>
                  · {undocumentedCount} {ii.dgUndocumented}
                </span>
              </div>
              <button
                onClick={generateAll}
                disabled={generating}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] ${t.transition} ${generating ? 'opacity-50' : t.accent.solidBtn + ' text-white'}`}
                style={{ fontWeight: 600 }}
              >
                {generating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                {generating ? ii.dgGenerating : ii.dgGenerate + ' All'}
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl ${t.transition} ${t.interactive.iconBtn}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter + format bar */}
          <div className={`flex items-center gap-2 px-6 py-2 border-b ${t.border.subtle}`}>
            {DOC_TYPES.map((dt) => (
              <button
                key={dt.type}
                onClick={() => setFilterType(dt.type)}
                className={`px-2 py-1 rounded-lg text-[9px] ${t.transition} ${filterType === dt.type ? t.accent.primaryBg + ' ' + t.accent.primary : t.interactive.iconBtn}`}
              >
                {(ii as unknown as Record<string, string>)[dt.labelKey]}
              </button>
            ))}
            <div className="flex-1" />
            {FORMATS.map((f) => (
              <button
                key={f.fmt}
                onClick={() => setFormat(f.fmt)}
                className={`px-2 py-1 rounded-lg text-[8px] ${t.transition} ${format === f.fmt ? t.accent.primaryBg + ' ' + t.accent.primary : t.interactive.iconBtn}`}
              >
                {(ii as unknown as Record<string, string>)[f.labelKey]}
              </button>
            ))}
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Item list */}
            <div
              className={`w-72 flex-shrink-0 border-r ${t.border.subtle} overflow-y-auto ${t.scrollbar}`}
            >
              {filtered.map((item) => {
                const TIcon = TYPE_ICONS[item.type];
                const isSel = selectedItem === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => generateDoc(item.id)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left border-b ${t.border.subtle} ${t.transition} ${
                      isSel
                        ? t.isDark
                          ? 'bg-indigo-500/10'
                          : 'bg-indigo-50/80'
                        : t.interactive.menuItem
                    }`}
                  >
                    <TIcon
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: TYPE_COLORS[item.type] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] truncate ${t.text.primary}`}
                          style={{ fontWeight: 500 }}
                        >
                          {item.name}
                        </span>
                        {!item.documented && (
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[8px] ${t.text.dimmed}`}>{item.file}</span>
                        <div
                          className={`flex-1 h-1 rounded-full overflow-hidden ${t.isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.coverage}%`,
                              backgroundColor: coverageColor(item.coverage),
                            }}
                          />
                        </div>
                        <span
                          className="text-[7px]"
                          style={{ color: coverageColor(item.coverage), fontWeight: 600 }}
                        >
                          {item.coverage}%
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-3 h-3 flex-shrink-0 ${t.text.dimmed}`} />
                  </button>
                );
              })}
            </div>

            {/* Generated doc preview */}
            <div className="flex-1 flex flex-col">
              {generatedDoc && (
                <div
                  className={`flex items-center justify-between px-4 py-1.5 border-b ${t.border.subtle}`}
                >
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] ${t.text.muted}`} style={{ fontWeight: 600 }}>
                      {format.toUpperCase()} {ii.apiPreview}
                    </span>
                    <div
                      className={`flex items-center ml-2 rounded-lg overflow-hidden ${t.isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}
                    >
                      <button
                        onClick={() => setViewMode('source')}
                        className={`px-2 py-0.5 text-[8px] ${t.transition} ${viewMode === 'source' ? (t.isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600') : t.text.dimmed}`}
                      >
                        <Code className="w-3 h-3 inline mr-0.5" /> Source
                      </button>
                      <button
                        onClick={() => setViewMode('rich')}
                        className={`px-2 py-0.5 text-[8px] ${t.transition} ${viewMode === 'rich' ? (t.isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600') : t.text.dimmed}`}
                      >
                        <Eye className="w-3 h-3 inline mr-0.5" /> Rich Edit
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={copyDoc}
                      className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}
                    >
                      {copiedDoc ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([generatedDoc], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'documentation.md';
                        a.click();
                      }}
                      className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              <div className={`flex-1 overflow-auto ${t.scrollbar}`}>
                {generating ? (
                  <div
                    className={`flex flex-col items-center justify-center h-full gap-3 ${t.text.dimmed}`}
                  >
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    <span className="text-[11px]">{ii.dgGenerating}</span>
                  </div>
                ) : generatedDoc ? (
                  viewMode === 'source' ? (
                    <pre
                      className={`p-6 font-mono text-[9px] whitespace-pre-wrap ${t.isDark ? 'text-slate-300' : 'text-slate-700'}`}
                    >
                      {generatedDoc}
                    </pre>
                  ) : (
                    <RichTextEditor
                      content={markdownToHtml(generatedDoc)}
                      onChange={() => {}}
                      isDark={t.isDark}
                      placeholder="Documentation content..."
                      editable={true}
                      className="h-full"
                      themeTokens={t}
                      collaboration={{
                        enabled: true,
                        fragmentName: `doc-${selectedItem || 'all'}`,
                        userName: 'You',
                        userColor: '#6366f1',
                      }}
                    />
                  )
                ) : (
                  <div
                    className={`flex flex-col items-center justify-center h-full gap-2 ${t.text.dimmed}`}
                  >
                    <BookOpen className="w-6 h-6 opacity-20" />
                    <span className="text-[10px]">Select an item to generate documentation</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
