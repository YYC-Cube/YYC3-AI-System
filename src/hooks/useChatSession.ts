/**
 * @file useChatSession.ts
 * @description 多会话管理 Hook - 新建/切换/删除 + localStorage 持久化
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-06-03
 * @tags hooks,chat,session,persistence
 */

import { useCallback, useEffect, useState } from 'react';

import type { Message } from '../app/types';

export interface ChatSession {
  sid: string;
  title: string;
  createAt: number;
  updateAt: number;
  messages: Message[];
}

const SESSION_STORE_KEY = 'yyc3-chat-sessions';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function useChatSession() {
  const [sessionList, setSessionList] = useState<ChatSession[]>([]);
  const [currentSid, setCurrentSid] = useState<string>('');

  // Initialize from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_STORE_KEY);
      const arr: ChatSession[] = raw ? JSON.parse(raw) : [];
      setSessionList(arr);
      if (arr.length > 0) {
        setCurrentSid(arr[0].sid);
      } else {
        createNewSessionInternal(arr);
      }
    } catch {
      createNewSessionInternal([]);
    }
  }, []);

  const saveLocal = useCallback((list: ChatSession[]) => {
    try {
      localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to persist sessions:', e);
    }
    setSessionList(list);
  }, []);

  const createNewSessionInternal = useCallback(
    (baseList?: ChatSession[]) => {
      const list = baseList ?? sessionList;
      const sid = generateId();
      const now = new Date();
      const newItem: ChatSession = {
        sid,
        title: `${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
        createAt: Date.now(),
        updateAt: Date.now(),
        messages: [],
      };
      const next = [...list, newItem];
      saveLocal(next);
      setCurrentSid(sid);
    },
    [sessionList, saveLocal]
  );

  const createNewSession = useCallback(() => {
    createNewSessionInternal();
  }, [createNewSessionInternal]);

  const deleteSession = useCallback(
    (sid: string) => {
      const next = sessionList.filter((s) => s.sid !== sid);
      saveLocal(next);
      if (currentSid === sid) {
        if (next.length > 0) {
          setCurrentSid(next[next.length - 1].sid);
        } else {
          createNewSessionInternal(next);
        }
      }
    },
    [sessionList, currentSid, saveLocal, createNewSessionInternal]
  );

  /** Get current session messages */
  const getCurrentMessages = useCallback((): Message[] => {
    const cur = sessionList.find((s) => s.sid === currentSid);
    return cur?.messages ?? [];
  }, [sessionList, currentSid]);

  /** Update current session messages (persist to localStorage) */
  const updateCurrentMessages = useCallback(
    (newMessages: Message[]) => {
      const next = sessionList.map((s) => {
        if (s.sid === currentSid) {
          const firstUserMsg = newMessages.find((m) => m.role === 'user');
          return {
            ...s,
            messages: newMessages,
            updateAt: Date.now(),
            title: firstUserMsg
              ? firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '')
              : s.title,
          };
        }
        return s;
      });
      saveLocal(next);
    },
    [sessionList, currentSid, saveLocal]
  );

  return {
    sessionList,
    currentSid,
    setCurrentSid,
    createNewSession,
    deleteSession,
    getCurrentMessages,
    updateCurrentMessages,
  };
}
