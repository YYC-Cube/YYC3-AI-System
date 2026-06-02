/**
 * @file code-editor-service.ts
 * @description YYC³ 代码编辑器增强服务 - 语法高亮与智能补全
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [service],[editor],[syntax],[completion],[diagnostics]
 *
 * @brief 代码编辑器增强服务，实现语法高亮与智能补全
 *
 * @details
 * - 语法高亮增强
 * - 代码补全
 * - 错误诊断
 * - 代码格式化
 * - 代码导航
 */

export interface EditorPosition {
  line: number;
  column: number;
}

export interface EditorRange {
  start: EditorPosition;
  end: EditorPosition;
}

export interface SyntaxToken {
  type: string;
  value: string;
  range: EditorRange;
}

export interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText: string;
  sortText?: string;
  filterText?: string;
}

export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Keyword = 14,
  Snippet = 15,
  File = 17,
  Folder = 19,
}

export interface Diagnostic {
  id: string;
  severity: DiagnosticSeverity;
  message: string;
  range: EditorRange;
  source?: string;
  code?: string;
  suggestions?: string[];
}

export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

export interface CodeAction {
  title: string;
  kind: CodeActionKind;
  edit?: {
    changes: Array<{
      range: EditorRange;
      newText: string;
    }>;
  };
  isPreferred?: boolean;
}

export enum CodeActionKind {
  QuickFix = 'quickfix',
  Refactor = 'refactor',
  RefactorExtract = 'refactor.extract',
  RefactorInline = 'refactor.inline',
  Source = 'source',
  SourceOrganizeImports = 'source.organizeImports',
}

export interface FormattingOptions {
  tabSize: number;
  insertSpaces: boolean;
  semicolons?: boolean;
  singleQuote?: boolean;
  trailingComma?: 'none' | 'es5' | 'all';
  printWidth?: number;
}

export interface NavigationItem {
  name: string;
  kind: string;
  range: EditorRange;
  children?: NavigationItem[];
}

const LANGUAGE_CONFIG: Record<
  string,
  {
    extensions: string[];
    aliases: string[];
    tokenizer?: RegExp[];
  }
> = {
  typescript: {
    extensions: ['.ts', '.tsx'],
    aliases: ['ts', 'tsx'],
  },
  javascript: {
    extensions: ['.js', '.jsx', '.mjs', '.cjs'],
    aliases: ['js', 'jsx'],
  },
  python: {
    extensions: ['.py', '.pyw'],
    aliases: ['py'],
  },
  json: {
    extensions: ['.json', '.jsonc'],
    aliases: [],
  },
  css: {
    extensions: ['.css', '.scss', '.sass', '.less'],
    aliases: ['scss', 'sass', 'less'],
  },
  html: {
    extensions: ['.html', '.htm', '.vue', '.svelte'],
    aliases: ['htm', 'vue', 'svelte'],
  },
  markdown: {
    extensions: ['.md', '.markdown'],
    aliases: ['md'],
  },
  yaml: {
    extensions: ['.yaml', '.yml'],
    aliases: ['yml'],
  },
  sql: {
    extensions: ['.sql'],
    aliases: [],
  },
  shell: {
    extensions: ['.sh', '.bash', '.zsh'],
    aliases: ['bash', 'zsh'],
  },
};

const KEYWORDS: Record<string, string[]> = {
  typescript: [
    'abstract',
    'any',
    'as',
    'asserts',
    'async',
    'await',
    'bigint',
    'boolean',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'constructor',
    'continue',
    'debugger',
    'declare',
    'default',
    'delete',
    'do',
    'else',
    'enum',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'from',
    'function',
    'get',
    'if',
    'implements',
    'import',
    'in',
    'infer',
    'instanceof',
    'interface',
    'is',
    'keyof',
    'let',
    'module',
    'namespace',
    'never',
    'new',
    'null',
    'number',
    'object',
    'package',
    'private',
    'protected',
    'public',
    'readonly',
    'require',
    'global',
    'return',
    'set',
    'static',
    'string',
    'super',
    'switch',
    'symbol',
    'this',
    'throw',
    'true',
    'try',
    'type',
    'typeof',
    'undefined',
    'unique',
    'unknown',
    'var',
    'void',
    'while',
    'with',
    'yield',
    'async',
    'await',
  ],
  python: [
    'False',
    'None',
    'True',
    'and',
    'as',
    'assert',
    'async',
    'await',
    'break',
    'class',
    'continue',
    'def',
    'del',
    'elif',
    'else',
    'except',
    'finally',
    'for',
    'from',
    'global',
    'if',
    'import',
    'in',
    'is',
    'lambda',
    'nonlocal',
    'not',
    'or',
    'pass',
    'raise',
    'return',
    'try',
    'while',
    'with',
    'yield',
  ],
  javascript: [
    'async',
    'await',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'let',
    'new',
    'null',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'undefined',
    'var',
    'void',
    'while',
    'with',
    'yield',
  ],
};

class CodeEditorService {
  private diagnostics: Map<string, Diagnostic[]> = new Map();
  private _completionCache: Map<string, CompletionItem[]> = new Map();

  constructor() {
    void this._completionCache;
  }

  getLanguage(filePath: string): string {
    const ext = '.' + filePath.split('.').pop()?.toLowerCase();
    for (const [language, config] of Object.entries(LANGUAGE_CONFIG)) {
      if (config.extensions.includes(ext)) {
        return language;
      }
    }
    return 'plaintext';
  }

  tokenize(content: string, language: string): SyntaxToken[] {
    const tokens: SyntaxToken[] = [];
    const lines = content.split('\n');

    const keywords = KEYWORDS[language] || [];
    const keywordPattern =
      keywords.length > 0 ? new RegExp(`\\b(${keywords.join('|')})\\b`, 'g') : null;

    lines.forEach((line, lineIndex) => {
      if (keywordPattern) {
        let match;
        while ((match = keywordPattern.exec(line)) !== null) {
          tokens.push({
            type: 'keyword',
            value: match[1],
            range: {
              start: { line: lineIndex, column: match.index },
              end: { line: lineIndex, column: match.index + match[1].length },
            },
          });
        }
      }

      const stringPattern = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g;
      let stringMatch;
      while ((stringMatch = stringPattern.exec(line)) !== null) {
        tokens.push({
          type: 'string',
          value: stringMatch[0],
          range: {
            start: { line: lineIndex, column: stringMatch.index },
            end: { line: lineIndex, column: stringMatch.index + stringMatch[0].length },
          },
        });
      }

      const numberPattern = /\b(\d+\.?\d*)\b/g;
      let numberMatch;
      while ((numberMatch = numberPattern.exec(line)) !== null) {
        tokens.push({
          type: 'number',
          value: numberMatch[1],
          range: {
            start: { line: lineIndex, column: numberMatch.index },
            end: { line: lineIndex, column: numberMatch.index + numberMatch[1].length },
          },
        });
      }

      const commentPattern = language === 'python' ? /(#.*)$/g : /(\/\/.*$|\/\*[\s\S]*?\*\/)/g;
      let commentMatch;
      while ((commentMatch = commentPattern.exec(line)) !== null) {
        tokens.push({
          type: 'comment',
          value: commentMatch[1],
          range: {
            start: { line: lineIndex, column: commentMatch.index },
            end: { line: lineIndex, column: commentMatch.index + commentMatch[1].length },
          },
        });
      }
    });

    return tokens;
  }

  getCompletions(
    _content: string,
    _position: EditorPosition,
    language: string,
    context?: { word?: string; lineContent?: string }
  ): CompletionItem[] {
    const items: CompletionItem[] = [];
    const keywords = KEYWORDS[language] || [];
    const word = context?.word || '';

    keywords.forEach((keyword) => {
      if (!word || keyword.startsWith(word)) {
        items.push({
          label: keyword,
          kind: CompletionItemKind.Keyword,
          insertText: keyword,
          sortText: `1_${keyword}`,
          filterText: keyword,
        });
      }
    });

    const snippets = this.getSnippets(language);
    snippets.forEach((snippet) => {
      if (!word || snippet.label.toLowerCase().includes(word.toLowerCase())) {
        items.push(snippet);
      }
    });

    return items.sort((a, b) => (a.sortText || '').localeCompare(b.sortText || ''));
  }

  getDiagnostics(filePath: string, content: string, language: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      const trailingWhitespace = line.match(/\s+$/);
      if (trailingWhitespace) {
        diagnostics.push({
          id: `trailing-${lineIndex}`,
          severity: DiagnosticSeverity.Hint,
          message: '行尾有多余空白字符',
          range: {
            start: { line: lineIndex, column: line.length - trailingWhitespace[0].length },
            end: { line: lineIndex, column: line.length },
          },
          source: 'editor',
          suggestions: ['删除行尾空白字符'],
        });
      }

      if (line.length > 120) {
        diagnostics.push({
          id: `line-length-${lineIndex}`,
          severity: DiagnosticSeverity.Warning,
          message: `行长度超过120字符 (${line.length})`,
          range: {
            start: { line: lineIndex, column: 120 },
            end: { line: lineIndex, column: line.length },
          },
          source: 'editor',
        });
      }
    });

    if (language === 'typescript' || language === 'javascript') {
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        diagnostics.push({
          id: 'brace-mismatch',
          severity: DiagnosticSeverity.Error,
          message: `括号不匹配: { ${openBraces} 个, } ${closeBraces} 个`,
          range: {
            start: { line: 0, column: 0 },
            end: { line: lines.length - 1, column: lines[lines.length - 1].length },
          },
          source: 'editor',
        });
      }
    }

    this.diagnostics.set(filePath, diagnostics);
    return diagnostics;
  }

  getCodeActions(filePath: string, range: EditorRange): CodeAction[] {
    const diagnostics = this.diagnostics.get(filePath) || [];
    const actions: CodeAction[] = [];

    const relevantDiagnostics = diagnostics.filter(
      (d) => d.range.start.line >= range.start.line && d.range.end.line <= range.end.line
    );

    for (const diagnostic of relevantDiagnostics) {
      if (diagnostic.id.startsWith('trailing-')) {
        actions.push({
          title: '删除行尾空白字符',
          kind: CodeActionKind.QuickFix,
          isPreferred: true,
          edit: {
            changes: [
              {
                range: diagnostic.range,
                newText: '',
              },
            ],
          },
        });
      }
    }

    return actions;
  }

  format(content: string, _language: string, options: FormattingOptions): string {
    const formatted = content;
    const lines = formatted.split('\n');

    const indentStr = options.insertSpaces ? ' '.repeat(options.tabSize) : '\t';

    let indentLevel = 0;
    const formattedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const formattedLine = indentStr.repeat(indentLevel) + trimmed;

      const openBraces = (trimmed.match(/{|\[|\(/g) || []).length;
      const closeBraces = (trimmed.match(/}|\]|\)/g) || []).length;
      indentLevel += openBraces - closeBraces;

      return formattedLine;
    });

    return formattedLines.join('\n');
  }

  getNavigationSymbols(content: string, language: string): NavigationItem[] {
    const symbols: NavigationItem[] = [];
    const lines = content.split('\n');

    if (language === 'typescript' || language === 'javascript') {
      lines.forEach((line, lineIndex) => {
        const classMatch = line.match(/class\s+(\w+)/);
        if (classMatch) {
          symbols.push({
            name: classMatch[1],
            kind: 'class',
            range: {
              start: { line: lineIndex, column: 0 },
              end: { line: lineIndex, column: line.length },
            },
          });
        }

        const functionMatch = line.match(
          /(?:function\s+(\w+)|(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*{)/
        );
        if (functionMatch) {
          symbols.push({
            name: functionMatch[1] || functionMatch[2],
            kind: 'function',
            range: {
              start: { line: lineIndex, column: 0 },
              end: { line: lineIndex, column: line.length },
            },
          });
        }

        const constMatch = line.match(/const\s+(\w+)\s*=/);
        if (constMatch) {
          symbols.push({
            name: constMatch[1],
            kind: 'variable',
            range: {
              start: { line: lineIndex, column: 0 },
              end: { line: lineIndex, column: line.length },
            },
          });
        }
      });
    }

    return symbols;
  }

  private getSnippets(language: string): CompletionItem[] {
    const snippets: CompletionItem[] = [];

    if (language === 'typescript' || language === 'javascript') {
      snippets.push(
        {
          label: 'log',
          kind: CompletionItemKind.Snippet,
          detail: 'console.log',
          insertText: 'console.log($1)',
          sortText: '0_log',
        },
        {
          label: 'func',
          kind: CompletionItemKind.Snippet,
          detail: '函数声明',
          insertText: 'function ${1:name}(${2:params}) {\n\t$3\n}',
          sortText: '0_func',
        },
        {
          label: 'arrow',
          kind: CompletionItemKind.Snippet,
          detail: '箭头函数',
          insertText: 'const ${1:name} = (${2:params}) => {\n\t$3\n}',
          sortText: '0_arrow',
        },
        {
          label: 'try',
          kind: CompletionItemKind.Snippet,
          detail: 'try-catch',
          insertText: 'try {\n\t$1\n} catch (error) {\n\t$2\n}',
          sortText: '0_try',
        },
        {
          label: 'import',
          kind: CompletionItemKind.Snippet,
          detail: '导入语句',
          insertText: "import { $2 } from '$1'",
          sortText: '0_import',
        }
      );
    }

    if (language === 'python') {
      snippets.push(
        {
          label: 'def',
          kind: CompletionItemKind.Snippet,
          detail: '函数定义',
          insertText: 'def ${1:name}(${2:params}):\n\t${3:pass}',
          sortText: '0_def',
        },
        {
          label: 'class',
          kind: CompletionItemKind.Snippet,
          detail: '类定义',
          insertText: 'class ${1:Name}:\n\tdef __init__(self, ${2:params}):\n\t\t${3:pass}',
          sortText: '0_class',
        },
        {
          label: 'if',
          kind: CompletionItemKind.Snippet,
          detail: 'if语句',
          insertText: 'if ${1:condition}:\n\t${2:pass}',
          sortText: '0_if',
        }
      );
    }

    return snippets;
  }
}

export const codeEditorService = new CodeEditorService();

export default CodeEditorService;
