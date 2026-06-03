/**
 * @file chatSlice.ts
 * @description YYC³ - 聊天/会话/搜索切片
 * 从 store.ts 提取，按 Zustand Slice 模式组织
 */

import type { StateCreator } from 'zustand';

import type { ChatSession, Message } from '../../types';
import { getI18n } from '../../utils/i18n';

export interface ChatSliceState {
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  quoteContent: string | null;
  setQuoteContent: (content: string | null) => void;
  activeMsgId: string | null;
  setActiveMsgId: (id: string | null) => void;

  // ── Multi-Session Chat ──
  chatSessions: ChatSession[];
  currentSessionId: string;
  loadSession: (sid: string) => void;
  createChatSession: () => string;
  deleteChatSession: (sid: string) => void;
  syncMessagesToSession: () => void;

  // ── Global Search ──
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: { sid: string; msg: Message }[];
  doGlobalSearch: () => void;
}

export const createChatSlice: StateCreator<ChatSliceState, [], [], ChatSliceState> = (set) => ({
  messages: [
    { id: '1', role: 'ai', content: getI18n('zh').initialAiMessage, timestamp: Date.now() },
  ],
  addMessage: (msg) =>
    set((state) => {
      const newMessage = {
        ...msg,
        id: Math.random().toString(36).substring(2, 11),
        timestamp: Date.now(),
      };
      const newMessages = [...state.messages, newMessage].slice(-100);
      return { messages: newMessages };
    }),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  clearMessages: () => set({ messages: [] }),
  quoteContent: null,
  setQuoteContent: (content) => set({ quoteContent: content }),
  activeMsgId: null,
  setActiveMsgId: (id) => set({ activeMsgId: id }),

  // ── Multi-Session Chat ──
  chatSessions: [],
  currentSessionId: '',
  loadSession: (sid) =>
    set((state) => {
      const session = state.chatSessions.find((s) => s.sid === sid);
      return {
        currentSessionId: sid,
        messages: session?.messages ?? [],
      };
    }),
  createChatSession: () => {
    const sid = Math.random().toString(36).substring(2, 11);
    const now = new Date();
    const newSession: ChatSession = {
      sid,
      title: `${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
      createAt: Date.now(),
      updateAt: Date.now(),
      messages: [],
    };
    set((state) => ({
      chatSessions: [...state.chatSessions, newSession],
      currentSessionId: sid,
      messages: [],
    }));
    return sid;
  },
  deleteChatSession: (sid) =>
    set((state) => {
      const next = state.chatSessions.filter((s) => s.sid !== sid);
      if (state.currentSessionId === sid) {
        if (next.length > 0) {
          return {
            chatSessions: next,
            currentSessionId: next[next.length - 1].sid,
            messages: next[next.length - 1].messages,
          };
        }
        return { chatSessions: next, currentSessionId: '', messages: [] };
      }
      return { chatSessions: next };
    }),
  syncMessagesToSession: () =>
    set((state) => {
      const updated = state.chatSessions.map((s) => {
        if (s.sid === state.currentSessionId) {
          const firstUser = state.messages.find((m) => m.role === 'user');
          return {
            ...s,
            messages: state.messages,
            updateAt: Date.now(),
            title: firstUser
              ? firstUser.content.slice(0, 30) + (firstUser.content.length > 30 ? '...' : '')
              : s.title,
          };
        }
        return s;
      });
      return { chatSessions: updated };
    }),

  // ── Global Search ──
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  searchResults: [],
  doGlobalSearch: () =>
    set((state) => {
      if (!state.searchQuery.trim()) return { searchResults: [] };
      const q = state.searchQuery.toLowerCase();
      const results: { sid: string; msg: Message }[] = [];
      state.chatSessions.forEach((s) => {
        s.messages.forEach((msg) => {
          if (msg.content.toLowerCase().includes(q)) {
            results.push({ sid: s.sid, msg });
          }
        });
      });
      return { searchResults: results.slice(0, 50) };
    }),
});
