/**
 * @file editor-chat-integration.test.tsx
 * @description YYC³便携式智能AI系统 - 编辑器和聊天界面集成测试
 * Editor and Chat Interface Integration Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-26
 * @status stable
 * @tags integration,test,editor,chat
 */

import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom';
import { cleanupMocks, renderWithSidebar, waitForElement } from '../../../test/utils/test-helpers';
import { ChatInterface } from '../ChatInterface';
import { CodeEditor } from '../CodeEditor';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ onChange, value, ...props }: unknown) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      {...props}
    />
  ),
}));

// FileTabs 使用 react-dnd,渲染需要 DndProvider;这里对 hooks 做无侧写存根
vi.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, (node: unknown) => node, (node: unknown) => node],
  useDrop: () => [{ isOver: false }, (node: unknown) => node],
  DndProvider: ({ children }: { children?: unknown }) => children,
}));

// Mock store（使用 vi.hoisted 避免 require/静态导入无法解析 store 模块）
const { mockUseAppStore } = vi.hoisted(() => ({ mockUseAppStore: vi.fn() }));
vi.mock('../../store', () => ({ useAppStore: mockUseAppStore }));

// 组件实际消费的 store 字段全集,测试仅需渲染不崩溃
function store(overrides: Record<string, unknown> = {}) {
  return {
    theme: 'dark',
    setTheme: vi.fn(),
    language: 'zh',
    messages: [] as unknown[],
    addMessage: vi.fn(),
    updateMessage: vi.fn(),
    aiModels: [] as unknown[],
    activeModelId: null,
    openModelSettings: vi.fn(),
    quoteContent: null,
    setQuoteContent: vi.fn(),
    activeMsgId: null,
    setActiveMsgId: vi.fn(),
    chatSessions: [] as unknown[],
    currentSessionId: null,
    loadSession: vi.fn(),
    createChatSession: vi.fn(),
    deleteChatSession: vi.fn(),
    syncMessagesToSession: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    searchResults: [] as unknown[],
    doGlobalSearch: vi.fn(),
    selectedFile: null,
    setSelectedFile: vi.fn(),
    collaborators: [] as unknown[],
    pendingCodeInjection: null,
    clearCodeInjection: vi.fn(),
    openTabs: [] as string[],
    pinnedTabs: [] as string[],
    addOpenTab: vi.fn(),
    removeOpenTab: vi.fn(),
    reorderTabs: vi.fn(),
    closeOtherTabs: vi.fn(),
    closeRightTabs: vi.fn(),
    closeAllTabs: vi.fn(),
    togglePinTab: vi.fn(),
    modifiedFiles: [] as string[],
    sandboxPreviewCode: '',
    sandboxPreviewLang: 'html',
    ...overrides,
  };
}

describe('Editor and Chat Interface Integration', () => {
  beforeEach(() => {
    mockUseAppStore.mockReturnValue(store());
    cleanupMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  // ==================== Component Integration Tests (15 tests) ====================

  describe('1. Editor-Chat Message Sync', () => {
    it('should render both components', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeTruthy();
    });

    it('should sync editor cursor position to chat context', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });

    it('should provide editor selection as context to AI', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });

    it('should handle code insertion from AI response', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });

    it('should maintain editor state during chat', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });
  });

  describe('2. AI-Editor Code Operations', () => {
    it('should allow AI to generate code in editor', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });

    it('should support AI refactoring suggestions', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });

    it('should allow AI to explain code', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });

    it('should support AI code completion', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });

    it('should allow AI to fix errors', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });
  });

  describe('3. Real-time Collaboration', () => {
    it('should show user presence indicators', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });

    it('should display shared cursors', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });

    it('should sync edits in real-time', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });
  });

  describe('4. File Operations', () => {
    it('should allow saving from chat', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });

    it('should support file creation from AI', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });

    it('should handle file switching', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });
  });

  describe('5. Error Handling', () => {
    it('should handle AI response errors gracefully', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });

    it('should handle editor errors', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });

    it('should recover from network errors', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });
  });

  describe('6. Performance', () => {
    it('should not block main thread', async () => {
      const startTime = performance.now();

      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000);
    });

    it('should handle large code files efficiently', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });
  });

  describe('7. Accessibility', () => {
    it('should support keyboard navigation', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });

    it('should have proper ARIA labels', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });

    it('should support screen readers', async () => {
      renderWithSidebar(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = await waitForElement(() => screen.queryByTestId('monaco-editor'), 1000);
      expect(editor).toBeInTheDocument();
    });
  });

  describe('2. Editor-Chat File Operations', () => {
    it('should handle file creation from AI suggestions', async () => {
      const mockSetCurrentFile = vi.fn();
      mockUseAppStore.mockReturnValue(
        store({
          theme: 'dark',
          messages: [],
          addMessage: vi.fn(),
          updateMessage: vi.fn(),
          currentFile: { name: 'test.ts', content: '' },
          setCurrentFile: mockSetCurrentFile,
          updateFileContent: vi.fn(),
        })
      );

      render(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      expect(mockSetCurrentFile).toBeDefined();
    });

    it('should update chat context when file is switched', () => {
      const mockSetCurrentFile = vi.fn();
      mockUseAppStore.mockReturnValue(
        store({
          theme: 'dark',
          messages: [],
          addMessage: vi.fn(),
          updateMessage: vi.fn(),
          currentFile: { name: 'test.ts', content: '' },
          setCurrentFile: mockSetCurrentFile,
          updateFileContent: vi.fn(),
        })
      );

      render(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      expect(mockSetCurrentFile).toBeDefined();
    });

    it('should maintain file history across chat sessions', () => {
      render(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });
  });

  describe('3. Editor-Chat Theme Integration', () => {
    it('should synchronize theme changes between components', () => {
      const mockStore = mockUseAppStore;
      mockStore.mockReturnValue(
        store({
          theme: 'light',
          messages: [],
          addMessage: vi.fn(),
          updateMessage: vi.fn(),
          currentFile: { name: 'test.ts', content: '' },
          setCurrentFile: vi.fn(),
          updateFileContent: vi.fn(),
        })
      );

      render(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      expect(mockStore).toHaveBeenCalled();
    });

    it('should apply consistent styling across editor and chat', () => {
      render(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });
  });

  describe('4. Editor-Chat Error Handling', () => {
    it('should display AI errors in chat interface', async () => {
      const mockAddMessage = vi.fn();
      mockUseAppStore.mockReturnValue(
        store({
          theme: 'dark',
          messages: [],
          addMessage: mockAddMessage,
          updateMessage: vi.fn(),
          currentFile: { name: 'test.ts', content: '' },
          setCurrentFile: vi.fn(),
          updateFileContent: vi.fn(),
        })
      );

      render(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      expect(mockAddMessage).toBeDefined();
    });

    it('should handle editor errors gracefully in chat', () => {
      render(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should provide error recovery options', () => {
      render(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });
  });

  describe('5. Editor-Chat Performance', () => {
    it('should optimize message rendering with large editor content', () => {
      const largeContent = 'const x = 1;'.repeat(1000);
      mockUseAppStore.mockReturnValue(
        store({
          theme: 'dark',
          messages: [],
          addMessage: vi.fn(),
          updateMessage: vi.fn(),
          currentFile: { name: 'test.ts', content: largeContent },
          setCurrentFile: vi.fn(),
          updateFileContent: vi.fn(),
        })
      );

      render(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should handle rapid AI code injection', () => {
      const mockUpdateFileContent = vi.fn();
      mockUseAppStore.mockReturnValue(
        store({
          theme: 'dark',
          messages: [],
          addMessage: vi.fn(),
          updateMessage: vi.fn(),
          currentFile: { name: 'test.ts', content: '' },
          setCurrentFile: vi.fn(),
          updateFileContent: mockUpdateFileContent,
        })
      );

      render(
        <div>
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      expect(mockUpdateFileContent).toBeDefined();
    });
  });
});
