/**
 * @file InlineAIChat.tsx
 * @description YYC³便携式智能AI系统 - Monaco编辑器内联AI聊天气泡
 * Monaco Editor Inline AI Chat Bubble
 * Floating AI conversation widget anchored to specific code lines.
 * Supports quick actions (explain, refactor, test, fix), multi-turn chat,
 * and one-click code application. Liquid Glass aesthetic, fully i18n-driven.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,ai,chat,inline
 */

import {
  Bot,
  X,
  Send,
  Copy,
  Check,
  Loader2,
  Code,
  Wand2,
  TestTube2,
  FileText,
  Bug,
  Zap,
  MessageCircle,
  Plus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '../store';
import { getI18n } from '../utils/i18n';
import { getThemeTokens } from '../utils/theme';

/* ── Chat message ── */
interface InlineChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  codeBlock?: string;
}

/* ── Quick action ── */
interface QuickAction {
  id: string;
  icon: typeof Code;
  labelKey: string;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'explain',
    icon: MessageCircle,
    labelKey: 'icExplain',
    prompt: 'Explain this code in detail.',
  },
  {
    id: 'refactor',
    icon: Wand2,
    labelKey: 'icRefactor',
    prompt: 'Refactor this code for better readability and performance.',
  },
  {
    id: 'test',
    icon: TestTube2,
    labelKey: 'icAddTests',
    prompt: 'Generate comprehensive unit tests for this code.',
  },
  {
    id: 'docs',
    icon: FileText,
    labelKey: 'icAddDocs',
    prompt: 'Add JSDoc documentation to this code.',
  },
  {
    id: 'fix',
    icon: Bug,
    labelKey: 'icFixError',
    prompt: 'Find and fix potential bugs in this code.',
  },
  {
    id: 'optimize',
    icon: Zap,
    labelKey: 'icOptimize',
    prompt: 'Optimize this code for better performance.',
  },
];

/* ── AI response simulator ── */
const AI_RESPONSES: Record<string, (context: string) => { text: string; codeBlock?: string }> = {
  explain: (_ctx) => ({
    text: `This code defines a React component that:\n\n1. **State Management**: Uses \`useState\` for local state and \`useAppStore\` for global Zustand state.\n2. **Side Effects**: The \`useEffect\` hook handles auto-scrolling and message subscription.\n3. **Event Handling**: \`handleSend\` processes user input, supports slash commands (/code, /arch, /help).\n4. **Rendering**: Returns a flex column layout with scrollable message area and input textarea.`,
  }),
  refactor: (_ctx) => ({
    text: `Here's a refactored version with improved structure:`,
    codeBlock: `// Extract command handler to a separate map\nconst COMMANDS: Record<string, () => void> = {\n  '/code': () => addMessage({ role: 'system', content: 'Generating code...' }),\n  '/arch': () => addMessage({ role: 'system', content: 'Loading architecture...' }),\n  '/help': () => addMessage({ role: 'system', content: HELP_TEXT }),\n}\n\nconst processCommand = (cmd: string) => {\n  const handler = COMMANDS[cmd.split(' ')[0]]\n  handler ? handler() : addMessage({ role: 'system', content: \`Unknown: \${cmd}\` })\n  setInput('')\n}`,
  }),
  test: (_ctx) => ({
    text: `Generated test suite for the component:`,
    codeBlock: `import { render, screen, fireEvent } from '@testing-library/react'\nimport { ChatInterface } from './ChatInterface'\n\ndescribe('ChatInterface', () => {\n  it('renders message input', () => {\n    render(<ChatInterface />)\n    expect(screen.getByPlaceholderText('Ask AI anything...')).toBeInTheDocument()\n  })\n\n  it('sends message on Enter', () => {\n    render(<ChatInterface />)\n    const input = screen.getByPlaceholderText('Ask AI anything...')\n    fireEvent.change(input, { target: { value: 'Hello AI' } })\n    fireEvent.keyDown(input, { key: 'Enter' })\n    expect(input).toHaveValue('')\n  })\n\n  it('processes slash commands', () => {\n    render(<ChatInterface />)\n    const input = screen.getByPlaceholderText('Ask AI anything...')\n    fireEvent.change(input, { target: { value: '/code' } })\n    fireEvent.keyDown(input, { key: 'Enter' })\n    // Verify system message was added\n  })\n})`,
  }),
  docs: (_ctx) => ({
    text: `Added comprehensive JSDoc documentation:`,
    codeBlock: `/**\n * ChatInterface component - Main AI interaction panel\n * \n * @component\n * @description Provides a chat-based interface for AI interaction.\n * Supports slash commands, markdown rendering, and streaming responses.\n * \n * @example\n * <ChatInterface />\n * \n * @requires useAppStore - Global state for theme, messages\n * @fires addMessage - Dispatches new messages to the store\n * \n * @see {@link Message} for message type definition\n * @see {@link AI_MODELS} for available AI model options\n */`,
  }),
  fix: (_ctx) => ({
    text: `Found 2 potential issues:\n\n1. **Missing error handling** in \`simulateAIResponse\` — async function without try-catch.\n2. **Potential null reference** — \`scrollRef.current\` could be null during unmount.\n\nHere's the fix:`,
    codeBlock: `const simulateAIResponse = async (userInput: string) => {\n  try {\n    await new Promise(r => setTimeout(r, 500))\n    addMessage({\n      role: 'ai',\n      content: \`Based on your request: "\${userInput}"\\n\\nHere is my analysis...\`\n    })\n  } catch (error) {\n    console.error('AI response failed:', error)\n    addMessage({ role: 'system', content: 'Error: AI response failed' })\n  }\n}\n\n// Safe scroll with optional chaining\nuseEffect(() => {\n  scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })\n}, [messages])`,
  }),
  optimize: (_ctx) => ({
    text: `Performance optimizations applied:\n\n1. **Memoized** message list to prevent unnecessary re-renders.\n2. **Debounced** input handler for better keystroke performance.\n3. **Virtualized** message list for large conversation histories.`,
    codeBlock: `// Memoize filtered messages\nconst visibleMessages = useMemo(() => \n  messages.filter(m => m.role !== 'system' || showSystemMessages),\n  [messages, showSystemMessages]\n)\n\n// Debounce input for performance\nconst debouncedInput = useDebouncedCallback(\n  (value: string) => setInput(value),\n  150\n)`,
  }),
};

/* ══════════════════════════════════════════ */
/*  InlineAIChat Component                    */
/* ══════════════════════════════════════════ */

interface InlineAIChatProps {
  visible: boolean;
  onClose: () => void;
  anchorLine: number;
  selectedCode?: string;
  currentFile: string;
}

export function InlineAIChat({
  visible,
  onClose,
  anchorLine,
  selectedCode,
  currentFile,
}: InlineAIChatProps) {
  const { theme, language } = useAppStore();
  const t = getThemeTokens(theme);
  const i = getI18n(language);

  const [messages, setMessages] = useState<InlineChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when visible
  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      const userMsg: InlineChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: `${action.prompt}${selectedCode ? `\n\n\`\`\`\n${selectedCode.slice(0, 200)}${selectedCode.length > 200 ? '\n...' : ''}\n\`\`\`` : ''}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setThinking(true);

      setTimeout(
        () => {
          const resp = AI_RESPONSES[action.id];
          const { text, codeBlock } = resp
            ? resp(selectedCode || '')
            : { text: 'I can help with that! Let me analyze the code...', codeBlock: undefined };
          const aiMsg: InlineChatMessage = {
            id: `a-${Date.now()}`,
            role: 'ai',
            text,
            timestamp: Date.now(),
            codeBlock,
          };
          setMessages((prev) => [...prev, aiMsg]);
          setThinking(false);
        },
        1200 + Math.random() * 800
      );
    },
    [selectedCode]
  );

  const handleSend = useCallback(() => {
    if (!input.trim() || thinking) return;
    const userMsg: InlineChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: input.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    // Generic AI response
    setTimeout(
      () => {
        const aiMsg: InlineChatMessage = {
          id: `a-${Date.now()}`,
          role: 'ai',
          text: `Based on the code at line ${anchorLine} in ${currentFile}, here's my analysis:\n\nThe code structure follows React best practices with proper hook usage. Consider extracting complex logic into custom hooks for better reusability.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setThinking(false);
      },
      1000 + Math.random() * 800
    );
  }, [input, thinking, anchorLine, currentFile]);

  const handleCopyCode = useCallback(
    (id: string, code: string) => {
      navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success(i.icCopyResponse);
    },
    [i]
  );

  const handleApplyCode = useCallback(
    (code: string) => {
      const { injectCode } = useAppStore.getState();
      injectCode(currentFile, code, 'typescript');
      toast.success(i.icApplySuggestion);
    },
    [currentFile, i]
  );

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setInput('');
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`absolute z-30 right-2 rounded-2xl overflow-hidden shadow-2xl ${
        t.isDark
          ? 'bg-[#0f1729]/95 border border-white/[0.08]'
          : 'bg-white/95 border border-slate-200'
      } backdrop-blur-xl`}
      style={{ top: `${Math.max(40, (anchorLine - 1) * 20)}px`, width: 360, maxHeight: 480 }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border.subtle}`}>
        <div className="flex items-center gap-2">
          <div
            className={`w-5 h-5 rounded-lg flex items-center justify-center ${t.isDark ? 'bg-violet-500/20' : 'bg-violet-50'}`}
          >
            <Sparkles className={`w-3 h-3 ${t.isDark ? 'text-violet-400' : 'text-violet-500'}`} />
          </div>
          <span className={`text-[10px] ${t.text.primary}`} style={{ fontWeight: 600 }}>
            {i.icTitle}
          </span>
          {selectedCode && (
            <span
              className={`text-[8px] px-1.5 py-0.5 rounded ${t.isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}
            >
              L{anchorLine} · {i.icSelectedLines}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewChat}
            className={`p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
            title={i.icNewChat}
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className={`p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick actions (shown when no messages) */}
      {messages.length === 0 && (
        <div className={`px-3 py-2 border-b ${t.border.subtle}`}>
          <div
            className={`text-[7px] uppercase tracking-wider mb-1.5 ${t.text.dimmed}`}
            style={{ fontWeight: 600 }}
          >
            {i.icAskAbout}
          </div>
          <div className="flex flex-wrap gap-1">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] ${t.transition} ${t.isDark ? 'bg-white/[0.04] hover:bg-white/[0.08] text-white/70' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                  style={{ fontWeight: 500 }}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {(i as unknown as Record<string, string>)[action.labelKey] || action.id}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className={`overflow-y-auto ${t.scrollbar}`} style={{ maxHeight: 300 }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`px-3 py-2 ${msg.role === 'ai' ? (t.isDark ? 'bg-white/[0.02]' : 'bg-slate-50/50') : ''}`}
          >
            <div className="flex items-start gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  msg.role === 'ai'
                    ? t.isDark
                      ? 'bg-violet-500/20'
                      : 'bg-violet-50'
                    : t.isDark
                      ? 'bg-indigo-500/20'
                      : 'bg-indigo-50'
                }`}
              >
                {msg.role === 'ai' ? (
                  <Bot
                    className={`w-2.5 h-2.5 ${t.isDark ? 'text-violet-400' : 'text-violet-500'}`}
                  />
                ) : (
                  <span
                    className={`text-[7px] ${t.isDark ? 'text-indigo-400' : 'text-indigo-500'}`}
                    style={{ fontWeight: 700 }}
                  >
                    Y
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[9px] whitespace-pre-wrap ${t.text.primary}`}>{msg.text}</p>
                {msg.codeBlock && (
                  <div className="mt-1.5 relative group">
                    <pre
                      className={`text-[8px] p-2 rounded-lg overflow-x-auto font-mono ${
                        t.isDark
                          ? 'bg-[#0a0f1f] text-emerald-300/70 border border-emerald-500/10'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {msg.codeBlock}
                    </pre>
                    <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopyCode(msg.id, msg.codeBlock!)}
                        className={`p-1 rounded text-[7px] ${t.isDark ? 'bg-slate-700/80 text-white/60 hover:text-white' : 'bg-white/80 text-slate-500 hover:text-slate-700'}`}
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-2.5 h-2.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleApplyCode(msg.codeBlock!)}
                        className={`flex items-center gap-0.5 p-1 rounded text-[7px] ${
                          t.isDark
                            ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                            : 'bg-violet-50 text-violet-500 hover:bg-violet-100'
                        }`}
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {thinking && (
          <div className={`px-3 py-2 ${t.isDark ? 'bg-white/[0.02]' : 'bg-slate-50/50'}`}>
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center ${t.isDark ? 'bg-violet-500/20' : 'bg-violet-50'}`}
              >
                <Loader2
                  className={`w-2.5 h-2.5 animate-spin ${t.isDark ? 'text-violet-400' : 'text-violet-500'}`}
                />
              </div>
              <span className={`text-[9px] ${t.text.muted}`}>{i.icThinking}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className={`flex items-center gap-1.5 px-3 py-2 border-t ${t.border.subtle}`}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={i.icPlaceholder}
          disabled={thinking}
          className={`flex-1 text-[10px] bg-transparent outline-none ${t.text.primary} disabled:opacity-50`}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || thinking}
          className={`p-1 rounded-lg ${t.transition} ${input.trim() && !thinking ? t.accent.solidBtn : 'opacity-30 cursor-not-allowed'}`}
        >
          <Send className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}
