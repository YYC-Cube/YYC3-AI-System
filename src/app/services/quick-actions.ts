/**
 * @file quick-actions.ts
 * @description YYC³便携式智能AI系统 - 快速操作服务层
 * Quick Actions Service Layer
 * Unified service for intelligent one-click code, document, text, and AI operations.
 * Provides clipboard history, context-aware actions, and AI-powered transformations.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,quick-actions,ai,clipboard,code-operations
 */

import { useAppStore } from '../store';

import { buildSystemPromptWithRules } from './settings-integration';

// ── Types ──

export type ActionType =
  | 'copy'
  | 'copy-markdown'
  | 'copy-html'
  | 'replace'
  | 'refactor'
  | 'optimize'
  | 'format'
  | 'convert'
  | 'summarize'
  | 'translate'
  | 'rewrite'
  | 'explain'
  | 'test-generate'
  | 'document-generate'
  | 'find-issues'
  | 'add-comments'
  | 'expand'
  | 'correct';

export type ActionTarget = 'code' | 'text' | 'document' | 'file';

export type ActionStatus = 'idle' | 'processing' | 'success' | 'error';

export type ActionCategory = 'code' | 'document' | 'text' | 'ai';

export interface QuickAction {
  id: string;
  type: ActionType;
  category: ActionCategory;
  target: ActionTarget;
  titleKey: string;
  descKey: string;
  icon: string;
  shortcut?: string;
  requiresAI: boolean;
  requiresSelection: boolean;
}

export interface ActionContext {
  selection: {
    text: string;
    startLine?: number;
    endLine?: number;
  };
  file?: {
    path: string;
    name: string;
    language: string;
  };
}

export interface ActionResult {
  type: ActionType;
  status: ActionStatus;
  content?: string;
  explanation?: string;
  error?: string;
  duration: number;
}

export interface ClipboardHistoryItem {
  id: string;
  content: string;
  type: 'text' | 'code' | 'markdown' | 'html';
  copiedAt: number;
  sourceFile?: string;
  language?: string;
  size: number;
  preview: string;
}

// ── Action Registry ──

export const QUICK_ACTIONS: QuickAction[] = [
  // Code Actions
  {
    id: 'copy-code',
    type: 'copy',
    category: 'code',
    target: 'code',
    titleKey: 'qaCopyCode',
    descKey: 'qaCopyCodeDesc',
    icon: 'Copy',
    requiresAI: false,
    requiresSelection: true,
  },
  {
    id: 'copy-markdown',
    type: 'copy-markdown',
    category: 'code',
    target: 'code',
    titleKey: 'qaCopyMarkdown',
    descKey: 'qaCopyMarkdownDesc',
    icon: 'FileCode',
    requiresAI: false,
    requiresSelection: true,
  },
  {
    id: 'copy-html',
    type: 'copy-html',
    category: 'code',
    target: 'code',
    titleKey: 'qaCopyHtml',
    descKey: 'qaCopyHtmlDesc',
    icon: 'FileType',
    requiresAI: false,
    requiresSelection: true,
  },
  {
    id: 'format-code',
    type: 'format',
    category: 'code',
    target: 'code',
    titleKey: 'qaFormatCode',
    descKey: 'qaFormatCodeDesc',
    icon: 'AlignLeft',
    shortcut: 'Shift+Alt+F',
    requiresAI: false,
    requiresSelection: true,
  },
  {
    id: 'refactor-code',
    type: 'refactor',
    category: 'code',
    target: 'code',
    titleKey: 'qaRefactorCode',
    descKey: 'qaRefactorCodeDesc',
    icon: 'RefreshCw',
    requiresAI: true,
    requiresSelection: true,
  },
  {
    id: 'optimize-code',
    type: 'optimize',
    category: 'code',
    target: 'code',
    titleKey: 'qaOptimizeCode',
    descKey: 'qaOptimizeCodeDesc',
    icon: 'Zap',
    requiresAI: true,
    requiresSelection: true,
  },

  // Document Actions
  {
    id: 'format-doc',
    type: 'format',
    category: 'document',
    target: 'document',
    titleKey: 'qaFormatDoc',
    descKey: 'qaFormatDocDesc',
    icon: 'FileText',
    requiresAI: true,
    requiresSelection: true,
  },
  {
    id: 'summarize-doc',
    type: 'summarize',
    category: 'document',
    target: 'document',
    titleKey: 'qaSummarize',
    descKey: 'qaSummarizeDesc',
    icon: 'ListCollapse',
    requiresAI: true,
    requiresSelection: true,
  },
  {
    id: 'convert-doc',
    type: 'convert',
    category: 'document',
    target: 'document',
    titleKey: 'qaConvert',
    descKey: 'qaConvertDesc',
    icon: 'ArrowRightLeft',
    requiresAI: true,
    requiresSelection: true,
  },

  // Text Actions
  {
    id: 'translate-text',
    type: 'translate',
    category: 'text',
    target: 'text',
    titleKey: 'qaTranslate',
    descKey: 'qaTranslateDesc',
    icon: 'Languages',
    requiresAI: true,
    requiresSelection: true,
  },
  {
    id: 'rewrite-text',
    type: 'rewrite',
    category: 'text',
    target: 'text',
    titleKey: 'qaRewrite',
    descKey: 'qaRewriteDesc',
    icon: 'Pencil',
    requiresAI: true,
    requiresSelection: true,
  },
  {
    id: 'expand-text',
    type: 'expand',
    category: 'text',
    target: 'text',
    titleKey: 'qaExpand',
    descKey: 'qaExpandDesc',
    icon: 'Maximize2',
    requiresAI: true,
    requiresSelection: true,
  },
  {
    id: 'correct-text',
    type: 'correct',
    category: 'text',
    target: 'text',
    titleKey: 'qaCorrect',
    descKey: 'qaCorrectDesc',
    icon: 'SpellCheck',
    requiresAI: true,
    requiresSelection: true,
  },

  // AI Actions
  {
    id: 'explain-code',
    type: 'explain',
    category: 'ai',
    target: 'code',
    titleKey: 'qaExplain',
    descKey: 'qaExplainDesc',
    icon: 'HelpCircle',
    requiresAI: true,
    requiresSelection: true,
  },
  {
    id: 'generate-tests',
    type: 'test-generate',
    category: 'ai',
    target: 'code',
    titleKey: 'qaGenTests',
    descKey: 'qaGenTestsDesc',
    icon: 'TestTube',
    requiresAI: true,
    requiresSelection: true,
  },
  {
    id: 'generate-docs',
    type: 'document-generate',
    category: 'ai',
    target: 'code',
    titleKey: 'qaGenDocs',
    descKey: 'qaGenDocsDesc',
    icon: 'BookOpen',
    requiresAI: true,
    requiresSelection: true,
  },
  {
    id: 'find-issues',
    type: 'find-issues',
    category: 'ai',
    target: 'code',
    titleKey: 'qaFindIssues',
    descKey: 'qaFindIssuesDesc',
    icon: 'Bug',
    requiresAI: true,
    requiresSelection: true,
  },
  {
    id: 'add-comments',
    type: 'add-comments',
    category: 'ai',
    target: 'code',
    titleKey: 'qaAddComments',
    descKey: 'qaAddCommentsDesc',
    icon: 'MessageSquarePlus',
    requiresAI: true,
    requiresSelection: true,
  },
];

// ── Clipboard History Manager ──

const CLIPBOARD_STORAGE_KEY = 'yyc3-clipboard-history';
const MAX_CLIPBOARD_ITEMS = 50;

export function getClipboardHistory(): ClipboardHistoryItem[] {
  try {
    const raw = localStorage.getItem(CLIPBOARD_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToClipboardHistory(
  item: Omit<ClipboardHistoryItem, 'id' | 'copiedAt' | 'size' | 'preview'>
): void {
  const history = getClipboardHistory();
  const newItem: ClipboardHistoryItem = {
    ...item,
    id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    copiedAt: Date.now(),
    size: item.content.length,
    preview: item.content.substring(0, 120).replace(/\n/g, ' '),
  };
  history.unshift(newItem);
  if (history.length > MAX_CLIPBOARD_ITEMS) history.length = MAX_CLIPBOARD_ITEMS;
  try {
    localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(history));
  } catch {
    /* storage full */
  }
}

export function clearClipboardHistory(): void {
  localStorage.removeItem(CLIPBOARD_STORAGE_KEY);
}

export function removeClipboardItem(id: string): void {
  const history = getClipboardHistory().filter((h) => h.id !== id);
  localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(history));
}

// ── HTML Escape Utility ──

function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (c) => map[c]);
}

// ── Quick Actions Service ──

export class QuickActionsService {
  /**
   * Execute a quick action and return the result.
   * Uses the active AI model from appStore for AI-powered actions,
   * or falls back to mock/simulated responses in browser sandbox.
   */
  async executeAction(
    action: QuickAction,
    context: ActionContext,
    params?: Record<string, string>
  ): Promise<ActionResult> {
    const start = Date.now();

    try {
      let content: string | undefined;
      let explanation: string | undefined;

      switch (action.type) {
        case 'copy':
          await navigator.clipboard.writeText(context.selection.text);
          addToClipboardHistory({
            content: context.selection.text,
            type: 'code',
            language: context.file?.language,
            sourceFile: context.file?.path,
          });
          return { type: action.type, status: 'success', duration: Date.now() - start };

        case 'copy-markdown': {
          const lang = context.file?.language || 'text';
          const md = `\`\`\`${lang}\n${context.selection.text}\n\`\`\``;
          await navigator.clipboard.writeText(md);
          addToClipboardHistory({
            content: md,
            type: 'markdown',
            language: lang,
            sourceFile: context.file?.path,
          });
          return { type: action.type, status: 'success', duration: Date.now() - start };
        }

        case 'copy-html': {
          const lang = context.file?.language || 'text';
          const html = `<pre><code class="language-${lang}">${escapeHTML(context.selection.text)}</code></pre>`;
          await navigator.clipboard.writeText(html);
          addToClipboardHistory({
            content: html,
            type: 'html',
            language: lang,
            sourceFile: context.file?.path,
          });
          return { type: action.type, status: 'success', duration: Date.now() - start };
        }

        case 'format':
          content = await this.aiAction(context, 'format', params);
          break;
        case 'refactor':
          content = await this.aiAction(context, 'refactor', params);
          break;
        case 'optimize': {
          const result = await this.aiAction(context, 'optimize', params);
          // Try to parse structured output
          const codeMatch = result.match(/```[\w]*\n([\s\S]*?)\n```/);
          content = codeMatch?.[1] || result;
          const explMatch = result.match(/(?:explanation|说明|解释)[:\n]\s*([\s\S]*)/i);
          explanation = explMatch?.[1]?.trim();
          break;
        }
        case 'summarize':
          content = await this.aiAction(context, 'summarize', params);
          break;
        case 'convert':
          content = await this.aiAction(context, 'convert', params);
          break;
        case 'translate':
          content = await this.aiAction(context, 'translate', params);
          break;
        case 'rewrite':
          content = await this.aiAction(context, 'rewrite', params);
          break;
        case 'expand':
          content = await this.aiAction(context, 'expand', params);
          break;
        case 'correct':
          content = await this.aiAction(context, 'correct', params);
          break;
        case 'explain':
          content = await this.aiAction(context, 'explain', params);
          break;
        case 'test-generate':
          content = await this.aiAction(context, 'test-generate', params);
          break;
        case 'document-generate':
          content = await this.aiAction(context, 'document-generate', params);
          break;
        case 'find-issues':
          content = await this.aiAction(context, 'find-issues', params);
          break;
        case 'add-comments':
          content = await this.aiAction(context, 'add-comments', params);
          break;
        default:
          return {
            type: action.type,
            status: 'error',
            error: 'Unknown action type',
            duration: Date.now() - start,
          };
      }

      return {
        type: action.type,
        status: 'success',
        content,
        explanation,
        duration: Date.now() - start,
      };
    } catch (err: unknown) {
      return {
        type: action.type,
        status: 'error',
        error: (err as Error).message || 'Action failed',
        duration: Date.now() - start,
      };
    }
  }

  /**
   * Attempt a real AI API call; fall back to simulated response.
   */
  private async aiAction(
    context: ActionContext,
    action: string,
    params?: Record<string, string>
  ): Promise<string> {
    const { aiModels, activeModelId } = useAppStore.getState();
    const activeModel = activeModelId ? aiModels.find((m) => m.id === activeModelId) : null;
    const lang = context.file?.language || 'text';
    const code = context.selection.text;

    const systemPrompts: Record<string, string> = {
      format:
        'You are a code formatter. Format the code following best practices. Output ONLY the formatted code.',
      refactor:
        'You are a refactoring specialist. Improve readability, reduce duplication, apply patterns. Output ONLY the refactored code.',
      optimize:
        'You are a performance optimizer. Optimize for speed and memory. Output the optimized code in a code block, then EXPLANATION: with a brief summary.',
      summarize:
        'You are a document summarizer. Create a concise Markdown summary with main points and key insights.',
      convert: `You are a format converter. Convert the content to ${params?.toFormat || 'markdown'}. Output ONLY the converted content.`,
      translate: `You are a translator. Translate accurately to ${params?.toLanguage || 'English'}, preserving tone. Output ONLY the translation.`,
      rewrite: `You are a writer. Rewrite for clarity and impact${params?.style ? ` in ${params.style} style` : ''}. Output ONLY the rewritten text.`,
      expand:
        'You are a writer. Expand with relevant details and examples. Output ONLY the expanded text.',
      correct:
        'You are an editor. Correct grammar, spelling, and punctuation. Output ONLY the corrected text.',
      explain:
        'You are a code educator. Explain the code clearly in Markdown: purpose, key components, how it works, patterns used, potential improvements.',
      'test-generate': `You are a test engineer using ${params?.framework || 'Vitest'}. Generate comprehensive unit tests (including edge cases). Output ONLY test code.`,
      'document-generate':
        'You are a technical writer. Generate Markdown documentation with descriptions, params, return values, examples, and limitations.',
      'find-issues':
        'You are a code reviewer. Find bugs, security issues, performance problems, and code smells. Format as Markdown list with severity, location, description, and fix.',
      'add-comments':
        'You are a code commenter. Add clear JSDoc/TSDoc comments to functions, complex logic, and important lines. Output ONLY the commented code.',
    };

    const systemBase = systemPrompts[action] || 'You are a helpful coding assistant.';
    const systemPrompt = buildSystemPromptWithRules(systemBase);
    const userPrompt = `Language: ${lang}\n\nContent:\n\`\`\`${lang}\n${code}\n\`\`\``;

    // Try real API if model is connected
    if (activeModel && activeModel.status === 'connected' && activeModel.apiKey) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const isClaude = activeModel.endpoint.includes('anthropic.com');

        if (isClaude) {
          headers['x-api-key'] = activeModel.apiKey;
          headers['anthropic-version'] = '2023-06-01';
          headers['anthropic-dangerous-direct-browser-access'] = 'true';
        } else {
          headers['Authorization'] = `Bearer ${activeModel.apiKey}`;
        }

        const messages = isClaude
          ? [{ role: 'user' as const, content: userPrompt }]
          : [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: userPrompt },
          ];

        const body = isClaude
          ? { model: activeModel.name, system: systemPrompt, messages, max_tokens: 4096 }
          : activeModel.provider === 'ollama'
            ? {
              model: activeModel.name,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              stream: false,
            }
            : { model: activeModel.name, messages, max_tokens: 4096 };

        const resp = await fetch(activeModel.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30000),
        });

        if (resp.ok) {
          const data = await resp.json();
          // OpenAI / compatible
          const openaiContent = data?.choices?.[0]?.message?.content;
          // Claude
          const claudeContent = data?.content?.[0]?.text;
          // Ollama
          const ollamaContent = data?.message?.content;
          const result = openaiContent || claudeContent || ollamaContent;
          if (result) return result;
        }
      } catch {
        // Fall through to simulation
      }
    }

    // Simulated fallback — provide useful mock responses
    return this.simulateAction(action, code, lang);
  }

  private simulateAction(action: string, code: string, lang: string): string {
    const lineCount = code.split('\n').length;
    const charCount = code.length;

    switch (action) {
      case 'format':
        return code; // Return as-is for format (no AI available)
      case 'refactor':
        return `// Refactored (${lineCount} lines)\n${code}\n// TODO: Connect an AI model for real refactoring suggestions`;
      case 'optimize':
        return `\`\`\`${lang}\n${code}\n\`\`\`\n\nEXPLANATION:\nCode analyzed (${lineCount} lines, ${charCount} chars). Connect an AI model in Settings > Models to get real optimization suggestions.`;
      case 'summarize':
        return `## Summary\n\n- **Lines**: ${lineCount}\n- **Characters**: ${charCount}\n- **Language**: ${lang}\n\n> Connect an AI model for detailed content summarization.`;
      case 'translate':
        return `[Translation of ${charCount} characters]\n\n${code.substring(0, 200)}...\n\n> Connect an AI model for accurate translation.`;
      case 'rewrite':
        return code;
      case 'expand':
        return `${code}\n\n// Additional details would be generated by AI.\n// Connect a model in Settings > Models.`;
      case 'correct':
        return code;
      case 'explain':
        return `## Code Explanation\n\n**Language**: ${lang}\n**Lines**: ${lineCount}\n\nThis code block contains ${lineCount} lines of ${lang} code.\n\n> Connect an AI model for a detailed explanation.`;
      case 'test-generate':
        return `import { describe, it, expect } from 'vitest'\n\ndescribe('Generated Tests', () => {\n  it('should pass basic test', () => {\n    // TODO: Connect AI model for real test generation\n    expect(true).toBe(true)\n  })\n})`;
      case 'document-generate':
        return `## Documentation\n\n**File**: ${lang} module\n**Lines**: ${lineCount}\n\n> Connect an AI model for comprehensive documentation generation.`;
      case 'find-issues':
        return `## Code Review\n\n- **Lines scanned**: ${lineCount}\n- **Issues found**: 0 (simulated)\n\n> Connect an AI model for real code analysis.`;
      case 'add-comments':
        return `// Auto-commented (${lineCount} lines)\n${code}`;
      default:
        return code;
    }
  }
}

// ── Singleton ──
export const quickActionsService = new QuickActionsService();
