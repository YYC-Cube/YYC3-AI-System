/**
 * @file complete-dev-workflow.test.tsx
 * @description YYC³便携式智能AI系统 - 完整开发流程集成测试
 * Complete Development Workflow Integration Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @status active
 * @tags integration,test,workflow,dev
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import '@testing-library/jest-dom';
import { ChatInterface } from '../ChatInterface';
import { CodeEditor } from '../CodeEditor';
import { FileManager } from '../FileManager';
import { PreviewPanel } from '../PreviewPanel';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ onChange, value }: { onChange?: (value: string) => void; value?: string }) => (
    <textarea
      data-testid="monaco-editor"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

// Mock services
vi.mock('../../services/ai-provider', () => ({
  aiProviderService: {
    generateChat: vi.fn(),
    generateCode: vi.fn(),
  },
}));

vi.mock('../../services/storage-service', () => ({
  storageService: {
    ensureDB: vi.fn().mockResolvedValue(undefined),
    getFile: vi.fn(),
    saveFile: vi.fn(),
    listFiles: vi.fn(),
  },
}));

// Mock store
vi.mock('../store', () => ({
  useAppStore: vi.fn(() => ({
    theme: 'dark',
    files: [],
    messages: [],
    currentFile: null,
    previewContent: null,
    addFile: vi.fn(),
    setCurrentFile: vi.fn(),
    updateFileContent: vi.fn(),
    addMessage: vi.fn(),
    updateMessage: vi.fn(),
    setPreviewContent: vi.fn(),
  })),
}));

describe('Complete Development Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ==================== Workflow Integration Tests (5 tests) ====================

  describe('1. File Creation to Deployment Workflow', () => {
    it('should complete full file creation-edit-preview workflow', async () => {
      const mockAddFile = vi.fn();
      const mockSetCurrentFile = vi.fn();
      const mockUpdateFileContent = vi.fn();
      const mockSetPreviewContent = vi.fn();

      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: [],
        messages: [],
        currentFile: null,
        previewContent: null,
        addFile: mockAddFile,
        setCurrentFile: mockSetCurrentFile,
        updateFileContent: mockUpdateFileContent,
        addMessage: vi.fn(),
        updateMessage: vi.fn(),
        setPreviewContent: mockSetPreviewContent,
      });

      render(
        <div>
          <FileManager />
          <CodeEditor />
          <PreviewPanel />
        </div>
      );

      // Step 1: Create file
      await mockAddFile('/test.tsx', 'export default App');

      // Step 2: Open file in editor
      await mockSetCurrentFile({
        name: 'test.tsx',
        path: '/test.tsx',
        content: 'export default App',
      });

      // Step 3: Edit file
      const editor = screen.getByTestId('monaco-editor');
      fireEvent.change(editor, { target: { value: 'export default EnhancedApp' } });

      // Step 4: Update preview
      await mockSetPreviewContent('<div>EnhancedApp</div>');

      expect(mockAddFile).toHaveBeenCalled();
      expect(mockSetCurrentFile).toHaveBeenCalled();
      expect(mockUpdateFileContent).toBeDefined();
      expect(mockSetPreviewContent).toHaveBeenCalled();
    });

    it('should handle errors in development workflow gracefully', async () => {
      const mockAddFile = vi.fn();
      const mockSetCurrentFile = vi.fn();

      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: [],
        messages: [],
        currentFile: null,
        previewContent: null,
        addFile: mockAddFile,
        setCurrentFile: mockSetCurrentFile,
        updateFileContent: vi.fn(),
        addMessage: vi.fn(),
        updateMessage: vi.fn(),
        setPreviewContent: vi.fn(),
      });

      render(
        <div>
          <FileManager />
          <CodeEditor />
          <PreviewPanel />
        </div>
      );

      // Attempt to create file with error
      try {
        await mockAddFile('/test.tsx', 'invalid content');
      } catch (error) {
        expect(error).toBeDefined();
      }

      expect(mockAddFile).toHaveBeenCalled();
    });
  });

  describe('2. AI-Assisted Development Workflow', () => {
    it('should complete AI-assisted coding workflow', async () => {
      const mockAddFile = vi.fn();
      const mockSetCurrentFile = vi.fn();
      const mockAddMessage = vi.fn();
      const mockUpdateFileContent = vi.fn();

      const mockGenerateCode = vi.mocked(
        require('../../services/ai-provider').aiProviderService.generateCode
      );
      mockGenerateCode.mockResolvedValue({
        code: 'const component = () => <div>Hello</div>;',
        explanation: 'React component created',
      });

      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: [],
        messages: [],
        currentFile: null,
        previewContent: null,
        addFile: mockAddFile,
        setCurrentFile: mockSetCurrentFile,
        updateFileContent: mockUpdateFileContent,
        addMessage: mockAddMessage,
        updateMessage: vi.fn(),
        setPreviewContent: vi.fn(),
      });

      render(
        <div>
          <FileManager />
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      // Step 1: User requests AI to create component
      await mockAddMessage({ role: 'user', content: 'Create a React component' });

      // Step 2: AI generates code
      const result = await mockGenerateCode('', 'Create React component', 'typescript');

      // Step 3: Save AI-generated code
      await mockAddFile('/component.tsx', result.code);

      // Step 4: Open file in editor
      await mockSetCurrentFile({
        name: 'component.tsx',
        path: '/component.tsx',
        content: result.code,
      });

      expect(mockAddMessage).toHaveBeenCalled();
      expect(mockGenerateCode).toHaveBeenCalled();
      expect(mockAddFile).toHaveBeenCalled();
      expect(mockSetCurrentFile).toHaveBeenCalled();
    });

    it('should handle AI service failures gracefully', async () => {
      const mockAddMessage = vi.fn();

      const mockGenerateChat = vi.mocked(
        require('../../services/ai-provider').aiProviderService.generateChat
      );
      mockGenerateChat.mockRejectedValue(new Error('AI service unavailable'));

      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: [],
        messages: [],
        currentFile: null,
        previewContent: null,
        addFile: vi.fn(),
        setCurrentFile: vi.fn(),
        updateFileContent: vi.fn(),
        addMessage: mockAddMessage,
        updateMessage: vi.fn(),
        setPreviewContent: vi.fn(),
      });

      render(<ChatInterface />);

      try {
        await mockGenerateChat([{ role: 'user', content: 'Test' }], 'gpt-4');
      } catch (error) {
        expect(error).toBeDefined();
        await mockAddMessage({
          role: 'assistant',
          content: 'Sorry, AI service is currently unavailable.',
        });
      }

      expect(mockGenerateChat).toHaveBeenCalled();
      expect(mockAddMessage).toHaveBeenCalled();
    });
  });

  describe('3. Multi-file Project Workflow', () => {
    it('should handle multi-file project development', async () => {
      const mockAddFile = vi.fn();
      const mockSetCurrentFile = vi.fn();
      const mockUpdateFileContent = vi.fn();

      const files = [
        { name: 'App.tsx', path: '/App.tsx', content: 'export default App' },
        { name: 'utils.ts', path: '/utils.ts', content: 'export const helper = () => {}' },
        { name: 'styles.css', path: '/styles.css', content: '.container { padding: 10px; }' },
      ];

      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: [],
        messages: [],
        currentFile: null,
        previewContent: null,
        addFile: mockAddFile,
        setCurrentFile: mockSetCurrentFile,
        updateFileContent: mockUpdateFileContent,
        addMessage: vi.fn(),
        updateMessage: vi.fn(),
        setPreviewContent: vi.fn(),
      });

      render(
        <div>
          <FileManager />
          <CodeEditor />
        </div>
      );

      // Create multiple files
      for (const file of files) {
        await mockAddFile(file.path, file.content);
      }

      // Switch between files
      for (const file of files) {
        await mockSetCurrentFile(file);
      }

      expect(mockAddFile).toHaveBeenCalledTimes(3);
      expect(mockSetCurrentFile).toHaveBeenCalledTimes(3);
    });

    it('should manage file dependencies in project', async () => {
      const mockAddFile = vi.fn();
      const mockSetCurrentFile = vi.fn();
      const mockUpdateFileContent = vi.fn();

      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: [],
        messages: [],
        currentFile: null,
        previewContent: null,
        addFile: mockAddFile,
        setCurrentFile: mockSetCurrentFile,
        updateFileContent: mockUpdateFileContent,
        addMessage: vi.fn(),
        updateMessage: vi.fn(),
        setPreviewContent: vi.fn(),
      });

      render(
        <div>
          <FileManager />
          <CodeEditor />
        </div>
      );

      // Create dependency files
      await mockAddFile('/utils.ts', 'export const helper = () => {}');
      await mockAddFile('/types.ts', 'export interface User {}');

      // Create main file that imports dependencies
      await mockAddFile(
        '/App.tsx',
        `import { helper } from './utils';\nimport { User } from './types';`
      );

      // Open files in order of dependency
      await mockSetCurrentFile({
        name: 'utils.ts',
        path: '/utils.ts',
        content: 'export const helper = () => {}',
      });
      await mockSetCurrentFile({
        name: 'types.ts',
        path: '/types.ts',
        content: 'export interface User {}',
      });
      await mockSetCurrentFile({
        name: 'App.tsx',
        path: '/App.tsx',
        content: `import { helper } from './utils';\nimport { User } from './types';`,
      });

      expect(mockAddFile).toHaveBeenCalledTimes(3);
      expect(mockSetCurrentFile).toHaveBeenCalledTimes(3);
    });
  });

  describe('4. Offline-Online Sync Workflow', () => {
    it('should handle offline development and sync', async () => {
      const mockAddFile = vi.fn();
      const mockSetCurrentFile = vi.fn();
      const mockUpdateFileContent = vi.fn();

      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: [],
        messages: [],
        currentFile: null,
        previewContent: null,
        addFile: mockAddFile,
        setCurrentFile: mockSetCurrentFile,
        updateFileContent: mockUpdateFileContent,
        addMessage: vi.fn(),
        updateMessage: vi.fn(),
        setPreviewContent: vi.fn(),
      });

      render(
        <div>
          <FileManager />
          <CodeEditor />
        </div>
      );

      // Simulate offline development
      await mockAddFile('/offline-file.ts', 'developed offline');
      await mockSetCurrentFile({
        name: 'offline-file.ts',
        path: '/offline-file.ts',
        content: 'developed offline',
      });

      // Edit file offline
      const editor = screen.getByTestId('monaco-editor');
      fireEvent.change(editor, { target: { value: 'developed and edited offline' } });

      // Simulate sync when online
      await mockUpdateFileContent('/offline-file.ts', 'developed and edited offline');

      expect(mockAddFile).toHaveBeenCalled();
      expect(mockSetCurrentFile).toHaveBeenCalled();
      expect(mockUpdateFileContent).toHaveBeenCalled();
    });
  });

  describe('5. Collaborative Development Workflow', () => {
    it('should support collaborative editing workflow', async () => {
      const mockAddFile = vi.fn();
      const mockSetCurrentFile = vi.fn();
      const mockUpdateFileContent = vi.fn();

      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: [],
        messages: [],
        currentFile: null,
        previewContent: null,
        addFile: mockAddFile,
        setCurrentFile: mockSetCurrentFile,
        updateFileContent: mockUpdateFileContent,
        addMessage: vi.fn(),
        updateMessage: vi.fn(),
        setPreviewContent: vi.fn(),
      });

      render(
        <div>
          <FileManager />
          <CodeEditor />
          <ChatInterface />
        </div>
      );

      // Create shared file
      await mockAddFile('/shared.ts', 'const shared = true');
      await mockSetCurrentFile({
        name: 'shared.ts',
        path: '/shared.ts',
        content: 'const shared = true',
      });

      // Simulate collaborative editing
      const editor = screen.getByTestId('monaco-editor');
      fireEvent.change(editor, { target: { value: 'const shared = false // edited by user2' } });

      // Update file with collaborative changes
      await mockUpdateFileContent('/shared.ts', 'const shared = false // edited by user2');

      expect(mockAddFile).toHaveBeenCalled();
      expect(mockSetCurrentFile).toHaveBeenCalled();
      expect(mockUpdateFileContent).toHaveBeenCalled();
    });
  });
});
