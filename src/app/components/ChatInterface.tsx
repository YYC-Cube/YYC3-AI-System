/**
 * @file ChatInterface.tsx
 * @description YYC³便携式智能AI系统 - 左侧面板AI聊天界面
 * Fixed: removed react-syntax-highlighter deep ESM subpath imports
 * that caused "Failed to fetch dynamically imported module" in Vite + pnpm.
 * Now uses lazy-loaded SyntaxHighlighter with inline theme objects as fallback.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,chat,ai,interface
 */

import {
  AlertCircle,
  Bot,
  Clipboard,
  Code,
  Download,
  ExternalLink,
  FileUp,
  Github,
  Image as ImageIcon,
  MessageSquarePlus,
  Moon,
  Palette,
  Plus,
  Search,
  Send,
  Sparkles,
  Square,
  Sun,
  Terminal,
  Trash2
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

import { aiProviderService } from '../services/ai-provider';
import { buildSystemPromptWithRules } from '../services/settings-integration';
import type { Message } from '../store';
import { useAppStore } from '../store';
import { cn } from '../utils/cn';
import { getI18n } from '../utils/i18n';
import { getSyntaxHighlighter } from '../utils/syntax-highlighter';
import { getThemeTokens, type ThemeMode } from '../utils/theme';

import { ChatMessageBubble } from './ChatMessageBubble';

import { useStreamText } from '@/hooks/useStreamText';

// ── Slash Commands ──
const SLASH_COMMANDS = [
  { command: '/code', description: 'cmdCodeDesc', icon: Code },
  { command: '/arch', description: 'cmdArchDesc', icon: Terminal },
  { command: '/help', description: 'cmdHelpDesc', icon: Sparkles },
];

// ── Real API call helper ──
async function callModelAPI(
  model: { provider: string; endpoint: string; apiKey: string; name: string },
  userMessage: string,
  history: { role: string; content: string }[],
  emptyLabel = '(empty response)'
): Promise<string> {
  const BASE_PROMPT =
    "You are YYC³ AI, a helpful coding assistant. Respond concisely in the user's language. Use Markdown.";
  const systemPrompt = buildSystemPromptWithRules(BASE_PROMPT);
  const msgs = [
    { role: 'system', content: systemPrompt },
    ...history
      .slice(-6)
      .map((m) => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  // Get real config from aiProviderService if modelId matches
  const providerConfig = aiProviderService.getActiveProvider();
  const apiKey = providerConfig?.apiKey || model.apiKey;
  // Use model.endpoint (already correct per provider from buildEndpoint)
  // Only fallback to providerConfig if model.endpoint is missing
  const endpoint = model.endpoint || (providerConfig?.baseURL
    ? model.provider === 'ollama'
      ? `${providerConfig.baseURL}/api/chat`
      : `${providerConfig.baseURL}/chat/completions`
    : '');

  if (model.provider === 'ollama') {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model.name, messages: msgs, stream: false }),
      signal: AbortSignal.timeout(120000),
    });
    if (!resp.ok) throw new Error(`Ollama HTTP ${resp.status}`);
    const data = await resp.json();
    return data?.message?.content || emptyLabel;
  } else {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: model.name, messages: msgs, stream: false, max_tokens: 2048 }),
      signal: AbortSignal.timeout(120000),
    });
    if (!resp.ok) throw new Error(`API HTTP ${resp.status}`);
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content || emptyLabel;
  }
}

// ── SSE Streaming API call ──
async function callModelAPIStream(
  model: { provider: string; endpoint: string; apiKey: string; name: string },
  userMessage: string,
  history: { role: string; content: string }[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const BASE_PROMPT =
    "You are YYC³ AI, a helpful coding assistant. Respond concisely in the user's language. Use Markdown.";
  const systemPrompt = buildSystemPromptWithRules(BASE_PROMPT);
  const msgs = [
    { role: 'system', content: systemPrompt },
    ...history
      .slice(-6)
      .map((m) => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  // Get real config from aiProviderService
  const providerConfig = aiProviderService.getActiveProvider();
  const apiKey = providerConfig?.apiKey || model.apiKey;
  const endpoint = model.endpoint || (providerConfig?.baseURL
    ? model.provider === 'ollama'
      ? `${providerConfig.baseURL}/api/chat`
      : `${providerConfig.baseURL}/chat/completions`
    : '');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  // Claude uses different headers and response format
  const isClaude = endpoint.includes('anthropic.com');
  if (isClaude) {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
    delete headers['Authorization'];
  }

  const body =
    model.provider === 'ollama'
      ? JSON.stringify({ model: model.name, messages: msgs, stream: true })
      : isClaude
        ? JSON.stringify({
          model: model.name,
          messages: msgs.filter((m) => m.role !== 'system'),
          system: msgs[0].content,
          max_tokens: 2048,
          stream: true,
        })
        : JSON.stringify({ model: model.name, messages: msgs, stream: true, max_tokens: 2048 });

  const resp = await fetch(endpoint, { method: 'POST', headers, body, signal });
  if (!resp.ok) throw new Error(`API HTTP ${resp.status}`);
  if (!resp.body) throw new Error('No stream body');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Parse SSE lines
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // keep incomplete line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;

      if (model.provider === 'ollama') {
        // Ollama streams JSON per line (no "data: " prefix)
        try {
          const json = JSON.parse(trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed);
          // Ollama sends { done: true } as final message
          if (json?.done) break;
          const content = json?.message?.content || json?.response || '';
          if (content) onChunk(content);
        } catch {
          /* skip malformed */
        }
      } else if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          // OpenAI format
          const content = json?.choices?.[0]?.delta?.content;
          // Claude format
          const claudeContent =
            json?.delta?.text || (json?.type === 'content_block_delta' ? json?.delta?.text : '');
          const chunk = content || claudeContent || '';
          if (chunk) onChunk(chunk);
        } catch {
          /* skip */
        }
      } else if (trimmed.startsWith('event: ')) {
        // Claude SSE events — skip, data line follows
      } else {
        // Try parsing as raw JSON (Ollama format)
        try {
          const json = JSON.parse(trimmed);
          if (json?.done) break;
          const content = json?.message?.content || json?.response || '';
          if (content) onChunk(content);
        } catch {
          /* skip */
        }
      }
    }
  }
}

// ── Mock streaming simulator ──
async function mockStreamResponse(
  text: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const words = text.split('');
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) break;
    onChunk(words[i]);
    await new Promise((r) => setTimeout(r, 12 + Math.random() * 18));
  }
}

// ══════════════════════════════════════════
// ── ChatInterface Component ──
// ══════════════════════════════════════════
export function ChatInterface() {
  const {
    theme, setTheme, language, messages, addMessage, updateMessage,
    aiModels, activeModelId, openModelSettings,
    quoteContent, setQuoteContent, activeMsgId, setActiveMsgId,
    chatSessions, currentSessionId, loadSession, createChatSession,
    deleteChatSession, syncMessagesToSession,
    searchQuery, setSearchQuery, searchResults, doGlobalSearch,
  } =
    useAppStore();
  const { renderText, setRenderText, startStream: _startStream, fastFinish: _fastFinish, abort: abortStream } = useStreamText();
  const t = getThemeTokens(theme);
  const i = getI18n(language);
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showSessionBar, setShowSessionBar] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [, forceUpdate] = useState(0); // for re-render after lazy load
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Quote auto-fill: when quoteContent changes, fill input with quoted text
  useEffect(() => {
    if (quoteContent) {
      const quoted = `> ${quoteContent.replace(/\n/g, '\n> ')}\n\n`;
      setInput(quoted);
      setQuoteContent(null);
      inputRef.current?.focus();
    }
  }, [quoteContent, setQuoteContent]);

  // Message anchor: auto-scroll to active message
  useEffect(() => {
    if (activeMsgId && msgRefs.current[activeMsgId]) {
      msgRefs.current[activeMsgId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveMsgId(null);
    }
  }, [activeMsgId, setActiveMsgId]);

  // Handle image upload
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error(i.toastInvalidImage);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const imageMarkdown = `![${file.name}](${dataUrl})\n`;
        setInput((prev) => prev + imageMarkdown);
        toast.success(i.toastImageUploaded);
        inputRef.current?.focus();
      };
      reader.onerror = () => toast.error(i.toastImageUploadFailed);
      reader.readAsDataURL(file);

      e.target.value = '';
    },
    [i]
  );

  // Handle file import
  const handleFileImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';

        let formattedContent = '';
        if (
          [
            'js',
            'jsx',
            'ts',
            'tsx',
            'json',
            'css',
            'html',
            'py',
            'java',
            'go',
            'rs',
            'c',
            'cpp',
            'h',
          ].includes(ext)
        ) {
          formattedContent = `\`\`\`${ext}\n${content}\n\`\`\`\n`;
        } else {
          formattedContent = `\`\`\`\n${content}\n\`\`\`\n`;
        }

        setInput((prev) => prev + formattedContent);
        toast.success(i.toastFileImported);
        inputRef.current?.focus();
      };
      reader.onerror = () => toast.error(i.toastFileImportFailed);
      reader.readAsText(file);

      e.target.value = '';
    },
    [i]
  );

  // Get active model info
  const activeModel = aiModels.find((m) => m.id === activeModelId);

  // Kick off lazy load of SyntaxHighlighter on mount
  useEffect(() => {
    getSyntaxHighlighter();
    // Re-render once loaded so code blocks pick it up
    const timer = setTimeout(() => forceUpdate((n) => n + 1), 500);
    return () => clearTimeout(timer);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, renderText]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val === '/') {
      setShowCommands(true);
    } else if (showCommands && !val.startsWith('/')) {
      setShowCommands(false);
    }
  };

  const handleCommandSelect = (command: string) => {
    setInput(command + ' ');
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const processMessage = useCallback(
    async (text: string) => {
      addMessage({ role: 'user', content: text });
      setIsStreaming(true);
      setRenderText('');

      const trimmedText = text.trim();

      // Handle slash commands locally
      if (trimmedText === '/help') {
        addMessage({ role: 'system', content: i.ciHelpContent });
        setIsStreaming(false);
        return;
      }
      if (trimmedText === '/arch') {
        addMessage({ role: 'system', content: i.ciArchContent });
        setIsStreaming(false);
        return;
      }

      // Try real model API if active model exists and has valid endpoint
      const activeModel = activeModelId ? aiModels.find((m) => m.id === activeModelId) : null;
      if (activeModel && activeModel.endpoint) {
        const controller = new AbortController();
        abortRef.current = controller;
        let accumulated = '';
        try {
          const history = messages
            .filter((m) => m.role === 'user' || m.role === 'ai')
            .map((m) => ({ role: m.role, content: m.content }));

          if (activeModel.provider === 'ollama') {
            // Ollama: use non-streaming to avoid CORS/streaming issues
            const reply = await callModelAPI(activeModel, text, history, i.ciEmptyResponse);
            // Simulate streaming by revealing text progressively
            await mockStreamResponse(reply, (chunk) => {
              accumulated += chunk;
              setRenderText(accumulated);
            });
            addMessage({ role: 'ai', content: accumulated });
          } else {
            // Other providers: use SSE streaming
            await callModelAPIStream(
              activeModel,
              text,
              history,
              (chunk) => {
                accumulated += chunk;
                setRenderText(accumulated);
              },
              controller.signal
            );
            if (accumulated) {
              addMessage({ role: 'ai', content: accumulated });
            } else {
              addMessage({ role: 'ai', content: i.ciEmptyResponse });
            }
          }

          // Auto-extract tasks from AI response
          try {
            const { aiTaskIntegration } = await import('../services/task-ai-integration');
            aiTaskIntegration.extractTasksFromMessages(
              [
                { role: 'user', content: text },
                { role: 'assistant', content: accumulated },
              ],
              { minConfidence: 0.75, autoAdd: true }
            );
          } catch {
            /* task extraction is best-effort */
          }
        } catch (err: unknown) {
          const error = err as Error;
          if (error.name === 'AbortError') {
            if (accumulated)
              addMessage({ role: 'ai', content: accumulated + '\n\n' + i.ciInterrupted });
          } else {
            addMessage({
              role: 'system',
              content: `${i.ciModelCallFailed}: ${error.message || i.ciUnknownError}`,
            });
            addMessage({
              role: 'ai',
              content: `${i.ciReceived}：**${text}**\n\n${i.ciAnalyzing}`,
            });
          }
        }
        abortRef.current = null;
      } else {
        // Fallback: simulated streaming response
        let mockText = '';
        if (trimmedText.startsWith('/code')) {
          mockText =
            '```tsx\nexport function GlassButton({ children, onClick }) {\n  return (\n    <button\n      onClick={onClick}\n      className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-6 py-3 text-white shadow-xl hover:bg-white/30 transition-all active:scale-95"\n    >\n      {children}\n    </button>\n  )\n}\n```\n\n' +
            i.ciCodeSynced;
        } else {
          const noModelHint =
            aiModels.length === 0
              ? '\n\n' + i.ciNoModelHint
              : '';
          mockText = `${i.ciReceived}：**${text}**\n\n${i.ciAnalyzingFull}${noModelHint}`;
        }

        // Stream the mock response character by character
        let accumulated = '';
        await mockStreamResponse(mockText, (chunk) => {
          accumulated += chunk;
          setRenderText(accumulated);
        });
        addMessage({ role: 'ai', content: accumulated });
      }
      setIsStreaming(false);
      setRenderText('');
    },
    [addMessage, aiModels, activeModelId, messages, i]
  );

  const handleSend = () => {
    if (!input.trim()) return;
    if (isStreaming) {
      // Stop current streaming
      if (abortRef.current) abortRef.current.abort();
      abortStream();
      setIsStreaming(false);
      setRenderText('');
      return;
    }
    const currentInput = input;
    setInput('');
    setShowCommands(false);
    processMessage(currentInput);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Theme Toggle ──
  const handleThemeToggle = useCallback(() => {
    const order: ThemeMode[] = ['system', 'light', 'dark', 'midnight', 'forest', 'sunset'];
    const idx = order.indexOf(theme);
    const next = order[(idx + 1) % order.length];
    setTheme(next);
  }, [theme, setTheme]);

  // ── Session Management ──
  const handleNewSession = useCallback(() => {
    syncMessagesToSession();
    createChatSession();
  }, [syncMessagesToSession, createChatSession]);

  const handleSwitchSession = useCallback(
    (sid: string) => {
      syncMessagesToSession();
      loadSession(sid);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [syncMessagesToSession, loadSession]
  );

  const handleDeleteSession = useCallback(
    (sid: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (chatSessions.length <= 1) {
        toast.info('Must have at least one session');
        return;
      }
      deleteChatSession(sid);
    },
    [chatSessions.length, deleteChatSession, i]
  );

  // ── Global Search ──
  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      doGlobalSearch();
    },
    [setSearchQuery, doGlobalSearch]
  );

  const handleSearchResultClick = useCallback(
    (sid: string, msgId: string) => {
      if (sid !== currentSessionId) {
        syncMessagesToSession();
        loadSession(sid);
      }
      setActiveMsgId(msgId);
      setShowSearch(false);
      // Scroll to message after render
      setTimeout(() => {
        const el = msgRefs.current[msgId];
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    },
    [syncMessagesToSession, loadSession, currentSessionId, setActiveMsgId]
  );

  // ── Export ──
  const exportChat = useCallback(
    (format: 'md' | 'json') => {
      if (format === 'json') {
        const payload = { exportedAt: new Date().toISOString(), sessionId: currentSessionId, messages };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yyc3-chat-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Export completed successfully');
      } else {
        let md = `# YYC³ AI Chat Export\n> ${new Date().toLocaleString()}\n\n`;
        messages.forEach((m) => {
          md += m.role === 'user' ? `### 🧑 User\n\n${m.content}\n\n` : `### 🤖 AI\n\n${m.content}\n\n---\n\n`;
        });
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yyc3-chat-${new Date().toISOString().slice(0, 10)}.md`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Export completed successfully');
      }
    },
    [messages, currentSessionId, i]
  );

  // ── Regenerate AI message ──
  const handleRegenerate = useCallback(
    async (msg: Message) => {
      const idx = messages.findIndex((m) => m.id === msg.id);
      if (idx < 1) return;
      const userMsg = messages[idx - 1];
      if (!userMsg || userMsg.role !== 'user') return;

      const { aiModels, activeModelId } = useAppStore.getState();
      const activeModel = activeModelId ? aiModels.find((m) => m.id === activeModelId) : null;
      if (!activeModel || !activeModel.endpoint) return;

      updateMessage(msg.id, { content: '...' });
      try {
        const history = messages
          .filter((m) => m.role === 'user' || m.role === 'ai')
          .slice(0, idx - 1)
          .map((m) => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content }));

        const reply = await callModelAPI(activeModel, userMsg.content, history, '(empty response)');
        updateMessage(msg.id, { content: reply });
      } catch (err: unknown) {
        const error = err as Error;
        updateMessage(msg.id, { content: `Regeneration failed: ${error.message}` });
      }
    },
    [messages, updateMessage]
  );

  return (
    <div
      className={`flex flex-col h-full relative overflow-hidden ${t.isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}
    >
      {/* ── Toolbar: Session | Theme | Search | Export ── */}
      <div className={`flex items-center justify-between px-2 py-1.5 border-b ${t.isDark ? 'border-slate-700/40' : 'border-slate-200/50'}`}>
        <div className="flex items-center gap-0.5">
          {/* Session toggle */}
          <button
            onClick={() => setShowSessionBar(!showSessionBar)}
            className={`p-1 rounded ${t.transition} ${showSessionBar ? t.interactive.iconActive : t.interactive.iconBtn}`}
            title="Sessions"
            type="button"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
          </button>
          {/* New session */}
          <button
            onClick={handleNewSession}
            className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}
            title="New session"
            type="button"
          >
            <Plus className="w-3 h-3" />
          </button>
          {/* Search */}
          <button
            onClick={() => { setShowSearch(!showSearch); showSearch && setSearchQuery(''); }}
            className={`p-1 rounded ${t.transition} ${showSearch ? t.interactive.iconActive : t.interactive.iconBtn}`}
            title="Search messages"
            type="button"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          {/* Theme toggle */}
          <button
            onClick={handleThemeToggle}
            className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}
            title={`Theme: ${theme}`}
            type="button"
          >
            {theme === 'system' ? (
              <span className="text-[10px]">🔄</span>
            ) : theme === 'light' ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>
          {/* Export MD */}
          <button
            onClick={() => exportChat('md')}
            className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}
            title="Export Markdown"
            type="button"
          >
            <Download className="w-3 h-3" />
          </button>
          {/* Export JSON */}
          <button
            onClick={() => exportChat('json')}
            className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn}`}
            title="Export JSON"
            type="button"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`px-2 py-2 border-b ${t.isDark ? 'border-slate-700/40 bg-slate-800/60' : 'border-slate-200/50 bg-slate-50'}`}>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search across all sessions..."
                className={`w-full px-2.5 py-1.5 rounded-lg text-[12px] outline-none border ${t.isDark ? 'bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'} focus:ring-1 focus:ring-indigo-500/50`}
                autoFocus
              />
              {searchResults.length > 0 && (
                <div className="mt-1.5 max-h-40 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {searchResults.map((r) => {
                    const session = chatSessions.find((s) => s.sid === r.sid);
                    return (
                      <button
                        key={r.msg.id}
                        onClick={() => handleSearchResultClick(r.sid, r.msg.id)}
                        className={`w-full text-left px-2 py-1.5 rounded text-[11px] truncate ${t.transition} ${t.isDark ? 'hover:bg-slate-700/50 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
                        type="button"
                      >
                        <span className="font-medium text-[10px] text-indigo-400">
                          {session?.title || r.sid.slice(0, 8)}
                        </span>
                        <span className="mx-1.5 text-slate-500">—</span>
                        {r.msg.content.slice(0, 80)}...
                      </button>
                    );
                  })}
                </div>
              )}
              {searchQuery && searchResults.length === 0 && (
                <p className={`text-[11px] mt-1 ${t.text.muted}`}>No results found.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Session Sidebar + Main Content ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Session sidebar overlay */}
        <AnimatePresence>
          {showSessionBar && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-10 bg-black/20"
                onClick={() => setShowSessionBar(false)}
              />
              <motion.div
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -200, opacity: 0 }}
                className={`absolute left-0 top-0 bottom-0 w-[200px] z-20 overflow-y-auto custom-scrollbar border-r p-2 ${t.isDark ? 'bg-slate-900/95 border-slate-700/40' : 'bg-white/95 border-slate-200/50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-semibold ${t.text.secondary}`}>
                    Sessions ({chatSessions.length})
                  </span>
                  <button
                    onClick={handleNewSession}
                    className={`p-0.5 rounded ${t.transition} ${t.interactive.iconBtn}`}
                    title="New session"
                    type="button"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-0.5">
                  {chatSessions.map((s) => (
                    <div
                      key={s.sid}
                      onClick={() => { handleSwitchSession(s.sid); setShowSessionBar(false); }}
                      className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] cursor-pointer ${t.transition} ${s.sid === currentSessionId
                        ? t.isDark
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-indigo-50 text-indigo-600'
                        : t.isDark
                          ? 'hover:bg-slate-700/40 text-slate-400'
                          : 'hover:bg-slate-100 text-slate-600'
                        }`}
                    >
                      <div className="truncate flex-1 min-w-0">
                        <div className="truncate">{s.title}</div>
                        <div className={`text-[9px] ${t.text.muted}`}>
                          {new Date(s.updateAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(s.sid, e)}
                        className={`p-0.5 rounded opacity-0 group-hover:opacity-100 ${t.transition} ${t.interactive.iconBtn} text-red-400 hover:text-red-300`}
                        title="Delete"
                        type="button"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar scroll-smooth"
          role="log"
          aria-live="polite"
        >
          <AnimatePresence>
            {messages.map((msg) => (
              <div
                key={msg.id}
                ref={(el) => { msgRefs.current[msg.id] = el; }}
              >
                <ChatMessageBubble msg={msg} theme={theme} onRegenerate={handleRegenerate} />
              </div>
            ))}
          </AnimatePresence>

          {/* Streaming indicator */}
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start space-x-2"
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${t.accent.primaryBg}`}
              >
                <Bot className={`w-3.5 h-3.5 ${t.accent.primary}`} />
              </div>
              <div
                className={`rounded-xl rounded-tl-sm px-3 py-2.5 max-w-[85%] ${t.surface.chatBubble} border ${t.isDark ? 'border-white/5' : 'border-slate-200/50'}`}
              >
                {renderText ? (
                  <div>
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
                        {renderText}
                      </ReactMarkdown>
                      <span className="inline-block w-0.5 h-4 bg-current opacity-60 animate-pulse ml-0.5 -mb-0.5" />
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((dotIdx) => (
                      <motion.div
                        key={dotIdx}
                        className={`w-1.5 h-1.5 rounded-full ${t.isDark ? 'bg-slate-400' : 'bg-slate-500'}`}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: dotIdx * 0.12 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Close new wrapper */}
      </div>

      {/* Input Area */}
      <div
        className={`p-3 border-t relative ${t.border.subtle} ${t.isDark ? 'bg-slate-900/50' : 'bg-white/30'} backdrop-blur-md z-10`}
      >
        {/* MD Quick Insert Toolbar */}
        <div className="flex items-center gap-0.5 mb-2 px-1">
          <span className={`text-[9px] mr-1 ${t.text.dimmed}`}>快捷:</span>
          {[
            { label: 'B', insert: '**粗体**', tip: '粗体' },
            { label: 'I', insert: '*斜体*', tip: '斜体' },
            { label: 'Code', insert: '`代码`', tip: '行内代码' },
            { label: 'Block', insert: '\n```tsx\n\n```\n', tip: '代码块' },
            { label: 'List', insert: '\n- 列表项\n- 列表项\n', tip: '列表' },
            { label: 'Table', insert: '\n| 列1 | 列2 |\n|------|------|\n| 值1 | 值2 |\n', tip: '表格' },
            { label: 'H2', insert: '\n## 标题\n', tip: '标题' },
            { label: 'Link', insert: '[链接](url)', tip: '链接' },
          ].map(({ label, insert, tip }) => (
            <button
              key={label}
              onClick={() => { setInput((prev) => prev + insert); inputRef.current?.focus(); }}
              className={`px-1.5 py-0.5 rounded text-[9px] ${t.isDark ? 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'} transition-colors`}
              title={tip}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Model Status Indicator */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            {activeModel ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-white/60">{activeModel.name}</span>
                <span className="text-[9px] text-white/30">({activeModel.provider})</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[10px] text-amber-400/80">No AI Model Configured</span>
              </>
            )}
          </div>
          {!activeModel && (
            <button
              onClick={openModelSettings}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 text-[9px] hover:bg-indigo-500/25 transition-all"
            >
              <AlertCircle className="w-2.5 h-2.5" />
              Configure
            </button>
          )}
        </div>

        {/* Slash Command Popover */}
        <AnimatePresence>
          {showCommands && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className={`fixed z-[201] left-4 bottom-20 right-4 rounded-xl overflow-hidden p-1 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
            >
              <div
                className={`px-3 py-1.5 text-[10px] uppercase tracking-wider ${t.text.muted}`}
                style={{ fontWeight: 600 }}
              >
                {i.slashCommands}
              </div>
              {SLASH_COMMANDS.map((cmd) => (
                <button
                  key={cmd.command}
                  onClick={() => handleCommandSelect(cmd.command)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left text-[12px] rounded-lg ${t.transition} ${t.isDark ? 'hover:bg-indigo-500/15 text-slate-200' : 'hover:bg-indigo-50 text-slate-700'}`}
                >
                  <cmd.icon className={`w-3.5 h-3.5 ${t.accent.primary}`} />
                  <span className="font-mono" style={{ fontWeight: 500 }}>
                    {cmd.command}
                  </span>
                  <span className={`text-[11px] ${t.text.muted}`}>
                    {i[cmd.description as keyof typeof i]}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-end gap-1">
          {/* Left icon buttons */}
          <div className="flex-shrink-0 flex items-center space-x-0.5 pb-2 z-10">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAttachMenu(!showAttachMenu);
                }}
                className={`p-1 rounded ${t.transition} ${showAttachMenu ? t.interactive.iconActive : t.interactive.iconBtn} cursor-pointer`}
                aria-label={i.addAttachment}
                type="button"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {showAttachMenu && (
                  <>
                    <div className="fixed inset-0 z-[200]" onClick={() => setShowAttachMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      className={`fixed z-[201] left-4 bottom-20 w-48 rounded-xl overflow-hidden p-1 ${t.surface.popover} ${t.border.popover} ${t.shadow.popover}`}
                    >
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md,.json,.js,.jsx,.ts,.tsx,.css,.html,.py,.java,.go,.rs,.c,.cpp,.h"
                        onChange={handleFileImport}
                        className="hidden"
                      />
                      {[
                        {
                          label: i.attachImage,
                          icon: ImageIcon,
                          action: () => imageInputRef.current?.click(),
                        },
                        {
                          label: i.attachFile,
                          icon: FileUp,
                          action: () => fileInputRef.current?.click(),
                        },
                        {
                          label: i.attachGithub,
                          icon: Github,
                          action: () => toast.info(i.toastGithubLinkOpened),
                        },
                        {
                          label: i.attachFigma,
                          icon: Palette,
                          action: () => toast.info(i.toastFigmaImport),
                        },
                        {
                          label: i.attachCode,
                          icon: Code,
                          action: () => {
                            setInput(input + '```tsx\n\n```');
                            inputRef.current?.focus();
                          },
                        },
                        {
                          label: i.attachClipboard,
                          icon: Clipboard,
                          action: () => {
                            navigator.clipboard
                              .readText()
                              .then((text) => {
                                if (text) {
                                  setInput(input + text);
                                  toast.success(i.toastClipboardPasted);
                                }
                              })
                              .catch(() => toast.error(i.toastClipboardError));
                          },
                        },
                      ].map(({ label, icon: Icon, action }) => (
                        <button
                          key={label}
                          onClick={() => {
                            action();
                            setShowAttachMenu(false);
                          }}
                          className={`w-full flex items-center space-x-2.5 px-3 py-1.5 text-[12px] rounded-lg ${t.transition} ${t.interactive.menuItem}`}
                          style={{ fontWeight: 400 }}
                          type="button"
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                imageInputRef.current?.click();
              }}
              className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn} cursor-pointer`}
              aria-label={i.uploadImage}
              type="button"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const snippet = '```tsx\n// Your code here\n```';
                setInput(input + snippet);
                inputRef.current?.focus();
                toast.info(i.toastCodeTemplateInserted);
              }}
              className={`p-1 rounded ${t.transition} ${t.interactive.iconBtn} cursor-pointer`}
              aria-label={i.insertCode}
              type="button"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? i.chatStreamingPlaceholder : i.chatPlaceholder}
            readOnly={isStreaming}
            aria-label={i.ciInputLabel}
            className={`flex-1 h-20 resize-none py-2.5 px-3 rounded-xl outline-none text-[13px] ${t.transition} ${t.input.chat} read-only:opacity-60`}
            style={{ fontWeight: 400 }}
          />

          {/* Send / Stop button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSend();
            }}
            disabled={!isStreaming && !input.trim()}
            className={`flex-shrink-0 p-2 mb-2 ${isStreaming ? 'bg-red-500 hover:bg-red-600' : t.accent.solidBtn} disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg shadow-lg ${t.transition} flex items-center justify-center cursor-pointer`}
            aria-label={isStreaming ? 'Stop' : i.ciSendLabel}
            type="button"
          >
            {isStreaming ? <Square className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Hints */}
        <div className="flex items-center justify-center mt-1.5">
          <p className={`text-[10px] ${t.text.dimmed}`}>
            <kbd className={`px-1 py-0.5 rounded text-[9px] ${t.kbd}`}>Enter</kbd> {i.enterToSend} ·{' '}
            <kbd className={`px-1 py-0.5 rounded text-[9px] ${t.kbd}`}>Shift+Enter</kbd>{' '}
            {i.shiftEnterNewline} ·{' '}
            <kbd className={`px-1 py-0.5 rounded text-[9px] ${t.kbd}`}>/</kbd> {i.slashShortcut}
          </p>
        </div>
      </div>
    </div>
  );
}
