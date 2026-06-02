/**
 * @file ai-completion.ts
 * @description YYC³便携式智能AI系统 - Monaco AI内联完成提供器
 * Monaco AI Inline Completion Provider
 * Registers a ghost-text inline completion provider for Monaco Editor.
 * Simulates AI suggestions based on current file context and cursor position.
 * In production, replace with real API calls to LLM endpoints.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,ai,completion,monaco
 */

import type { editor as MonacoEditor, languages, Position, CancellationToken } from 'monaco-editor';

/* ── Context-aware suggestion database ── */
const SUGGESTIONS: Record<string, string[]> = {
  // React patterns
  'import React': [
    ", { useState, useEffect, useCallback, useMemo } from 'react'",
    ", { useRef, useContext, useReducer } from 'react'",
  ],
  'const [': [
    'isLoading, setIsLoading] = useState(false)',
    'data, setData] = useState<unknown>(null)',
    'error, setError] = useState<string | null>(null)',
  ],
  'useEffect(': [
    '() => {\n    // Side effect logic\n    return () => {\n      // Cleanup\n    }\n  }, [])',
  ],
  useState: ['<boolean>(false)', "<string>('')", '<number>(0)'],
  'function ': [
    'handleSubmit(e: React.FormEvent) {\n    e.preventDefault()\n    // Handle form submission\n  }',
    'handleChange(value: string) {\n    // Handle value change\n  }',
  ],
  'interface ': [
    'Props {\n  /** Component title */\n  title: string\n  /** Optional description */\n  description?: string\n  /** Click handler */\n  onClick?: () => void\n  /** Children elements */\n  children?: React.ReactNode\n}',
  ],
  'export function': [
    ' Component({ title, children }: Props) {\n  const [isOpen, setIsOpen] = useState(false)\n\n  return (\n    <div className="flex flex-col gap-2">\n      <h2>{title}</h2>\n      {children}\n    </div>\n  )\n}',
  ],
  'return (': [
    '\n    <div className="flex flex-col gap-4 p-4">\n      <h2 className="text-lg font-semibold">{title}</h2>\n      <div className="flex-1">{children}</div>\n    </div>\n  )',
  ],
  'className="': [
    'flex items-center justify-between gap-2 p-4 rounded-xl border"',
    'grid grid-cols-2 gap-4 p-6"',
    'relative overflow-hidden backdrop-blur-xl"',
  ],
  'console.': ["log('Debug:', { data })", "error('Error:', error)", "warn('Warning:', message)"],
  'async function': [
    " fetchData() {\n  try {\n    const response = await fetch('/api/data')\n    if (!response.ok) throw new Error('Network error')\n    const data = await response.json()\n    return data\n  } catch (error) {\n    console.error('Fetch failed:', error)\n    throw error\n  }\n}",
  ],
  'try {': [
    "\n    const result = await operation()\n    return result\n  } catch (error) {\n    console.error('Operation failed:', error)\n    throw error\n  } finally {\n    cleanup()\n  }",
  ],
  '// TODO': [
    ': Implement error boundary for graceful error handling',
    ': Add loading skeleton while data is being fetched',
    ': Optimize re-renders with React.memo and useMemo',
  ],
  const: [
    ' handleClick = useCallback(() => {\n    // Handle click event\n  }, [])',
    ' memoizedValue = useMemo(() => {\n    return computeExpensiveValue(a, b)\n  }, [a, b])',
  ],
  'type ': [
    "Status = 'idle' | 'loading' | 'success' | 'error'",
    "Theme = 'light' | 'dark' | 'system'",
  ],
};

/* ── Fallback suggestions based on language ── */
const LANGUAGE_SUGGESTIONS: Record<string, string[]> = {
  typescript: [
    '// YYC3 AI: Consider adding type annotations for better type safety',
    'export type Result<T> = { success: true; data: T } | { success: false; error: string }',
  ],
  javascript: ['// YYC3 AI: Consider migrating to TypeScript for better DX'],
  css: [
    '/* YYC3 AI: Consider using CSS custom properties for theming */',
    'backdrop-filter: blur(12px);',
  ],
};

/**
 * Find the best matching suggestion for the current line context
 */
function findSuggestion(lineContent: string, _language: string): string | null {
  // Trim whitespace for matching
  const trimmed = lineContent.trimStart();

  // Check direct prefix matches (longest match first)
  const sortedKeys = Object.keys(SUGGESTIONS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (trimmed.endsWith(key) || trimmed.includes(key)) {
      const options = SUGGESTIONS[key];
      // Deterministic but varied selection based on line content hash
      const hash = lineContent.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return options[hash % options.length];
    }
  }

  // Fallback to language-specific suggestions
  const langSuggestions = LANGUAGE_SUGGESTIONS[_language];
  if (langSuggestions && Math.random() > 0.7) {
    return langSuggestions[Math.floor(Math.random() * langSuggestions.length)];
  }

  return null;
}

/**
 * Register the YYC3 AI inline completion provider for Monaco Editor
 * Returns a disposable to clean up the registration
 */
export function registerAICompletionProvider(
  monaco: typeof import('monaco-editor'),
  options?: { enabled?: boolean; debounceMs?: number }
): { dispose: () => void; setEnabled: (enabled: boolean) => void } {
  let isEnabled = options?.enabled ?? true;
  const debounceMs = options?.debounceMs ?? 500;

  const provider: languages.InlineCompletionsProvider = {
    provideInlineCompletions: async (
      model: MonacoEditor.ITextModel,
      position: Position,
      _context: languages.InlineCompletionContext,
      _token: CancellationToken
    ): Promise<languages.InlineCompletions> => {
      if (!isEnabled) return { items: [] };

      // Get current line content up to cursor
      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeCursor = lineContent.substring(0, position.column - 1);

      if (textBeforeCursor.trim().length < 3) return { items: [] };

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, debounceMs));

      // Check if cancelled
      if (_token.isCancellationRequested) return { items: [] };

      const language = model.getLanguageId();
      const suggestion = findSuggestion(textBeforeCursor, language);

      if (!suggestion) return { items: [] };

      return {
        items: [
          {
            insertText: suggestion,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
          },
        ],
      };
    },
    disposeInlineCompletions: () => {
      // Nothing to dispose
    },
  };

  // Register for TypeScript/JavaScript files
  const disposables = [
    monaco.languages.registerInlineCompletionsProvider('typescript', provider),
    monaco.languages.registerInlineCompletionsProvider('javascript', provider),
    monaco.languages.registerInlineCompletionsProvider('css', provider),
    monaco.languages.registerInlineCompletionsProvider('json', provider),
  ];

  return {
    dispose: () => disposables.forEach((d) => d.dispose()),
    setEnabled: (enabled: boolean) => {
      isEnabled = enabled;
    },
  };
}
