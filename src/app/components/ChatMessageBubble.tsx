/**
 * @file ChatMessageBubble.tsx
 * @description Chat message bubble component — extracted from ChatInterface
 * Renders a single message with code highlighting, fold/quote/regenerate actions.
 */

import { ArrowUpRight, Bot, Terminal, User } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { Message } from '../store';
import { useAppStore } from '../store';
import { cn } from '../utils/cn';
import { DARK_CODE_THEME, LIGHT_CODE_THEME } from '../utils/code-themes';
import { getI18n } from '../utils/i18n';
import { getSyntaxHighlighter } from '../utils/syntax-highlighter';
import { getThemeTokens, type ThemeMode } from '../utils/theme';

interface ChatMessageBubbleProps {
  msg: Message;
  theme: string;
  onRegenerate: (msg: Message) => void;
}

export function ChatMessageBubble({ msg, theme, onRegenerate }: ChatMessageBubbleProps) {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';
  const t = getThemeTokens(theme as ThemeMode);
  const { injectCode, language, setQuoteContent } = useAppStore();
  const i = getI18n(language);

  const SynHL = getSyntaxHighlighter();

  // Fold logic: auto-fold long messages or code blocks
  const needFold = msg.content.length > 800 || (msg.content.match(/```/g)?.length || 0) >= 2;
  const [isFolded, setIsFolded] = useState(msg.folded ?? needFold);

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

  // Quote: fill input with quoted content
  const handleQuote = useCallback(() => {
    const excerpt = msg.content.length > 200 ? msg.content.slice(0, 200) + '...' : msg.content;
    setQuoteContent(excerpt);
  }, [msg.content, setQuoteContent]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
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
            'rounded-xl p-3 text-[13px] group',
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
          <div
            className={`prose-sm max-w-none leading-relaxed relative ${isFolded ? 'max-h-[200px] overflow-hidden' : ''}`}
            style={{ fontSize: '13px' }}
          >
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
            {/* Fold overlay gradient */}
            {isFolded && needFold && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-transparent to-transparent flex justify-center items-end pb-1">
                <button
                  onClick={() => setIsFolded(false)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  展开全部 ▼
                </button>
              </div>
            )}
          </div>
          {/* Action bar: fold/quote/regenerate (AI messages only) */}
          {!isUser && !isSystem && (
            <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
              {needFold && (
                <button
                  onClick={() => setIsFolded(!isFolded)}
                  className={`text-[9px] px-1.5 py-0.5 rounded ${t.isDark ? 'bg-slate-700/50 text-slate-400 hover:text-slate-300' : 'bg-slate-100 text-slate-500 hover:text-slate-700'} transition-colors`}
                >
                  {isFolded ? '展开' : '折叠'}
                </button>
              )}
              <button
                onClick={handleQuote}
                className={`text-[9px] px-1.5 py-0.5 rounded ${t.isDark ? 'bg-slate-700/50 text-slate-400 hover:text-slate-300' : 'bg-slate-100 text-slate-500 hover:text-slate-700'} transition-colors`}
              >
                引用
              </button>
              <button
                onClick={() => onRegenerate(msg)}
                className={`text-[9px] px-1.5 py-0.5 rounded ${t.isDark ? 'bg-slate-700/50 text-slate-400 hover:text-slate-300' : 'bg-slate-100 text-slate-500 hover:text-slate-700'} transition-colors`}
              >
                重新生成
              </button>
            </div>
          )}
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
    </motion.div>
  );
}
