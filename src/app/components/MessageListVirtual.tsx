/**
 * @file MessageListVirtual.tsx
 * @description YYC³便携式智能AI系统 - 虚拟滚动消息列表组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,chat,virtual,scroll
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { clsx, type ClassValue } from 'clsx';
import { Terminal, Bot, User, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { twMerge } from 'tailwind-merge';

import type { Message } from '../store';
import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens, type ThemeMode } from '../utils/theme';

// ── Utility ──
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Inline syntax themes (avoid deep ESM subpath imports) ──
const DARK_CODE_THEME: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': {
    color: '#d4d4d4',
    background: 'transparent',
    fontFamily: "'Fira Code', Consolas, Monaco, monospace",
    fontSize: '12px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.6',
    tabSize: 4,
  },
  'pre[class*="language-"]': {
    color: '#d4d4d4',
    background: 'rgba(0,0,0,0.3)',
    fontFamily: "'Fira Code', Consolas, Monaco, monospace",
    fontSize: '12px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.6',
    tabSize: 4,
    padding: '1em',
    margin: '0',
    overflow: 'auto',
    borderRadius: '8px',
  },
  comment: { color: '#6a9955' },
  prolog: { color: '#6a9955' },
  doctype: { color: '#6a9955' },
  cdata: { color: '#6a9955' },
  punctuation: { color: '#d4d4d4' },
  property: { color: '#9cdcfe' },
  tag: { color: '#569cd6' },
  boolean: { color: '#569cd6' },
  number: { color: '#b5cea8' },
  constant: { color: '#9cdcfe' },
  symbol: { color: '#b5cea8' },
  deleted: { color: '#ce9178' },
  selector: { color: '#d7ba7d' },
  'attr-name': { color: '#9cdcfe' },
  string: { color: '#ce9178' },
  char: { color: '#ce9178' },
  builtin: { color: '#4ec9b0' },
  inserted: { color: '#b5cea8' },
  operator: { color: '#d4d4d4' },
  entity: { color: '#569cd6' },
  url: { color: '#9cdcfe' },
  atrule: { color: '#c586c0' },
  'attr-value': { color: '#ce9178' },
  keyword: { color: '#c586c0' },
  function: { color: '#dcdcaa' },
  'class-name': { color: '#4ec9b0' },
  regex: { color: '#d16969' },
  important: { color: '#569cd6', fontWeight: 'bold' },
  variable: { color: '#9cdcfe' },
};

const LIGHT_CODE_THEME: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': {
    color: '#000000',
    background: 'transparent',
    fontFamily: "'Fira Code', Consolas, Monaco, monospace",
    fontSize: '12px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.6',
    tabSize: 4,
  },
  'pre[class*="language-"]': {
    color: '#000000',
    background: 'rgba(0,0,0,0.04)',
    fontFamily: "'Fira Code', Consolas, Monaco, monospace",
    fontSize: '12px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.6',
    tabSize: 4,
    padding: '1em',
    margin: '0',
    overflow: 'auto',
    borderRadius: '8px',
  },
  comment: { color: '#008000' },
  prolog: { color: '#008000' },
  doctype: { color: '#008000' },
  cdata: { color: '#008000' },
  punctuation: { color: '#393a34' },
  property: { color: '#001080' },
  tag: { color: '#800000' },
  boolean: { color: '#0000ff' },
  number: { color: '#098658' },
  constant: { color: '#001080' },
  symbol: { color: '#098658' },
  deleted: { color: '#a31515' },
  selector: { color: '#800000' },
  'attr-name': { color: '#e50000' },
  string: { color: '#a31515' },
  char: { color: '#a31515' },
  builtin: { color: '#267f99' },
  inserted: { color: '#098658' },
  operator: { color: '#000000' },
  entity: { color: '#0000ff' },
  url: { color: '#001080' },
  atrule: { color: '#af00db' },
  'attr-value': { color: '#a31515' },
  keyword: { color: '#af00db' },
  function: { color: '#795e26' },
  'class-name': { color: '#267f99' },
  regex: { color: '#811f3f' },
  important: { color: '#0000ff', fontWeight: 'bold' },
  variable: { color: '#001080' },
};

// ── Lazy-load SyntaxHighlighter ──
let _SyntaxHL: React.ComponentType<any> | null = null;
let _loadPromise: Promise<void> | null = null;

function getSyntaxHighlighter(): React.ComponentType<Record<string, unknown>> | null {
  if (_SyntaxHL) return _SyntaxHL;
  if (!_loadPromise) {
    _loadPromise = import('react-syntax-highlighter')
      .then((mod) => {
        _SyntaxHL =
          (
            mod as unknown as {
              Prism?: React.ComponentType<Record<string, unknown>>;
              default?: React.ComponentType<Record<string, unknown>>;
            }
          ).Prism || mod.default;
      })
      .catch(() => {
        /* fallback to <pre><code> */
      });
  }
  return null;
}

// ── Estimate message height based on content ──
function estimateMessageHeight(content: string, _role: string): number {
  const baseHeight = 80; // Base height for message bubble
  const lineCount = Math.max(1, Math.ceil(content.length / 80)); // Approximate line count
  const codeBlockCount = (content.match(/```/g) || []).length / 2;
  const codeBlockHeight = codeBlockCount * 100; // Each code block adds ~100px

  return baseHeight + lineCount * 20 + codeBlockHeight + 20; // Add padding
}

// ── MessageBubble Sub-component ──
function MessageBubble({ msg, theme }: { msg: Message; theme: string }) {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';
  const t = getThemeTokens(theme as ThemeMode);
  const { injectCode, language } = useAppStore();
  const i = getI18n(language);

  const SynHL = getSyntaxHighlighter();

  // Extract code blocks from message for "Apply to Editor" functionality
  const handleApplyCode = useCallback(
    (code: string, lang: string) => {
      const filenameMap: Record<string, string> = {
        tsx: 'ChatInterface.tsx',
        ts: 'store.ts',
        css: 'theme.css',
        jsx: 'App.tsx',
        json: 'package.json',
        javascript: 'App.tsx',
        typescript: 'store.ts',
      };
      const filename = filenameMap[lang] || `snippet.${lang || 'tsx'}`;
      injectCode(filename, code, lang);
    },
    [injectCode]
  );

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div className="flex items-start space-x-2 max-w-[90%]">
        {!isUser && (
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
              isSystem ? (t.isDark ? 'bg-cyan-500/20' : 'bg-cyan-500/10') : t.accent.primaryBg
            }`}
          >
            {isSystem ? (
              <Terminal className="w-3.5 h-3.5 text-cyan-500" />
            ) : (
              <Bot className={`w-3.5 h-3.5 ${t.accent.primary}`} />
            )}
          </div>
        )}

        <div
          className={cn(
            'rounded-xl p-3 text-[13px]',
            isUser
              ? `${t.surface.chatBubbleUser} rounded-tr-sm`
              : isSystem
                ? `${t.surface.chatBubbleSystem} rounded-tl-sm border ${t.isDark ? 'border-slate-700/50 text-slate-200' : 'border-slate-200 text-slate-700'}`
                : `${t.surface.chatBubble} rounded-tl-sm border ${t.isDark ? 'border-white/5 text-slate-200' : 'border-slate-200/50 text-slate-800'}`
          )}
        >
          {!isUser && (
            <div className="flex items-center space-x-1.5 mb-1.5">
              <span
                className={cn('text-[10px]', isSystem ? 'text-cyan-500' : t.accent.primary)}
                style={{ fontWeight: 600 }}
              >
                {isSystem ? 'System' : 'YYC³ AI'}
              </span>
            </div>
          )}
          <div className="prose-sm max-w-none leading-relaxed" style={{ fontSize: '13px' }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code(props) {
                  const { children, className } = props as {
                    children?: React.ReactNode;
                    className?: string;
                  };
                  const match = /language-(\w+)/.exec(className || '');
                  const codeStr = String(children).replace(/\n$/, '');
                  if (match && SynHL) {
                    return (
                      <div className="relative group/code">
                        <SynHL
                          PreTag="div"
                          language={match[1]}
                          style={t.isDark ? DARK_CODE_THEME : LIGHT_CODE_THEME}
                          customStyle={{
                            margin: '8px 0',
                            borderRadius: '8px',
                            background: t.codeBlock.bg,
                            fontSize: '12px',
                          }}
                        >
                          {codeStr}
                        </SynHL>
                        <button
                          onClick={() => handleApplyCode(codeStr, match[1])}
                          className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] opacity-0 group-hover/code:opacity-100 transition-all ${
                            t.isDark
                              ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/20'
                              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                          }`}
                          title={i.ciApplyToEditor}
                        >
                          <ArrowUpRight className="w-3 h-3" /> {i.ciApplyToEditor}
                        </button>
                      </div>
                    );
                  }
                  if (match) {
                    return (
                      <div className="relative group/code">
                        <pre
                          style={{
                            margin: '8px 0',
                            borderRadius: '8px',
                            padding: '1em',
                            overflow: 'auto',
                            background: t.codeBlock.bg,
                            fontSize: '12px',
                            lineHeight: '1.6',
                          }}
                        >
                          <code>{children}</code>
                        </pre>
                        <button
                          onClick={() => handleApplyCode(codeStr, match[1])}
                          className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] opacity-0 group-hover/code:opacity-100 transition-all ${
                            t.isDark
                              ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/20'
                              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                          }`}
                          title={i.ciApplyToEditor}
                        >
                          <ArrowUpRight className="w-3 h-3" /> {i.ciApplyToEditor}
                        </button>
                      </div>
                    );
                  }
                  return (
                    <code
                      className={cn(
                        t.codeBlock.inlineClass,
                        'rounded px-1 py-0.5 text-[12px]',
                        className
                      )}
                    >
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return (
                    <p className="mb-2 last:mb-0" style={{ lineHeight: '1.6' }}>
                      {children}
                    </p>
                  );
                },
                ul({ children }) {
                  return <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>;
                },
                li({ children }) {
                  return <li style={{ lineHeight: '1.5' }}>{children}</li>;
                },
                strong({ children }) {
                  return <strong style={{ fontWeight: 600 }}>{children}</strong>;
                },
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
          <div
            className={cn(
              'text-[9px] mt-1.5 text-right',
              isUser ? 'text-indigo-200' : t.text.muted
            )}
          >
            {new Intl.DateTimeFormat(
              language === 'en'
                ? 'en-US'
                : language === 'ja'
                  ? 'ja-JP'
                  : language === 'ko'
                    ? 'ko-KR'
                    : 'zh-CN',
              { hour: '2-digit', minute: '2-digit' }
            ).format(msg.timestamp)}
          </div>
        </div>

        {isUser && (
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ── MessageListVirtual Component ──
// ══════════════════════════════════════════
interface MessageListVirtualProps {
  messages: Message[];
  streamingContent?: string;
  isStreaming?: boolean;
}

export function MessageListVirtual({
  messages,
  streamingContent = '',
  isStreaming = false,
}: MessageListVirtualProps) {
  const { theme, language } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState(0);

  // Kick off lazy load of SyntaxHighlighter on mount
  useEffect(() => {
    getSyntaxHighlighter();
    const timer = setTimeout(() => forceUpdate((n) => n + 1), 500);
    return () => clearTimeout(timer);
  }, []);

  // Estimate heights for virtualization
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const msg = messages[index];
      return estimateMessageHeight(msg.content, msg.role);
    },
    overscan: 10, // Render 10 extra items for smooth scrolling
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Scroll to bottom manually
  const scrollToBottom = useCallback(() => {
    if (parentRef.current) {
      parentRef.current.scrollTo({
        top: parentRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <div className="flex-1 overflow-hidden relative">
      <div
        ref={parentRef}
        className="h-full overflow-y-auto custom-scrollbar scroll-smooth"
        style={{ contain: 'strict' }}
      >
        <div
          ref={scrollRef}
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
            }}
          >
            <AnimatePresence>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const msg = messages[virtualRow.index];
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="p-3">
                      <MessageBubble msg={msg} theme={theme} />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Streaming indicator */}
            {isStreaming && streamingContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start space-x-2 p-3"
                style={{
                  position: 'absolute',
                  top: `${rowVirtualizer.getTotalSize()}px`,
                  left: 0,
                  width: '100%',
                }}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${t.accent.primaryBg}`}
                >
                  <Bot className={`w-3.5 h-3.5 ${t.accent.primary}`} />
                </div>
                <div
                  className={`rounded-xl rounded-tl-sm px-3 py-2.5 max-w-[85%] ${t.surface.chatBubble} border ${t.isDark ? 'border-white/5' : 'border-slate-200/50'}`}
                >
                  <div className="flex items-center space-x-1.5 mb-1.5">
                    <span
                      className={cn('text-[10px]', t.accent.primary)}
                      style={{ fontWeight: 600 }}
                    >
                      YYC³ AI
                    </span>
                    <span className="text-[9px] text-amber-400/60 animate-pulse">
                      {i.ciStreaming}
                    </span>
                  </div>
                  <div
                    className={`prose-sm max-w-none leading-relaxed text-[13px] ${t.isDark ? 'text-slate-200' : 'text-slate-800'}`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p({ children }) {
                          return (
                            <p className="mb-2 last:mb-0" style={{ lineHeight: '1.6' }}>
                              {children}
                            </p>
                          );
                        },
                        code({ children, className }) {
                          const match = /language-(\w+)/.exec(className || '');
                          if (match) {
                            return (
                              <pre
                                style={{
                                  margin: '8px 0',
                                  borderRadius: '8px',
                                  padding: '1em',
                                  overflow: 'auto',
                                  background: t.codeBlock.bg,
                                  fontSize: '12px',
                                  lineHeight: '1.6',
                                }}
                              >
                                <code>{children}</code>
                              </pre>
                            );
                          }
                          return (
                            <code
                              className={cn(
                                t.codeBlock.inlineClass,
                                'rounded px-1 py-0.5 text-[12px]',
                                className
                              )}
                            >
                              {children}
                            </code>
                          );
                        },
                        strong({ children }) {
                          return <strong style={{ fontWeight: 600 }}>{children}</strong>;
                        },
                      }}
                    >
                      {streamingContent}
                    </ReactMarkdown>
                    <span className="inline-block w-0.5 h-4 bg-current opacity-60 animate-pulse ml-0.5 -mb-0.5" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll to bottom button */}
      <button
        onClick={scrollToBottom}
        className={`absolute bottom-4 right-4 p-2 rounded-full ${t.accent.solidBtn} text-white shadow-lg ${t.transition} z-10`}
        title="Scroll to bottom"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>
    </div>
  );
}

// ── Performance monitoring hook ──
export function useMessageListPerformance(messages: Message[]) {
  const renderedCount = messages.length;
  const totalHeight = messages.reduce(
    (sum, msg) => sum + estimateMessageHeight(msg.content, msg.role),
    0
  );
  const avgHeight = renderedCount > 0 ? totalHeight / renderedCount : 0;

  return {
    renderedCount,
    totalHeight,
    avgHeight,
    virtualizationEnabled: renderedCount > 50, // Enable virtualization for 50+ messages
  };
}
