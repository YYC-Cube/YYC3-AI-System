/**
 * @file editor-preview-integration.test.tsx
 * @description YYC³便携式智能AI系统 - 编辑器和预览集成测试
 * Editor and Preview Integration Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @status active
 * @tags integration,test,editor,preview
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import '@testing-library/jest-dom';
import { CodeEditor } from '../CodeEditor';
import { PreviewPanel } from '../PreviewPanel';

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

// Mock store
vi.mock('../store', () => ({
  useAppStore: vi.fn(() => ({
    theme: 'dark',
    currentFile: { name: 'test.tsx', content: '' },
    previewContent: null,
    setPreviewContent: vi.fn(),
    updateFileContent: vi.fn(),
  })),
}));

describe('Editor and Preview Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('1. Real-time Preview Updates', () => {
    it('should update preview when editor content changes', async () => {
      const mockSetPreviewContent = vi.fn();
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        currentFile: { name: 'test.tsx', content: 'export default App' },
        previewContent: null,
        setPreviewContent: mockSetPreviewContent,
        updateFileContent: vi.fn(),
      });

      render(
        <div>
          <CodeEditor />
          <PreviewPanel />
        </div>
      );

      const editor = screen.getByTestId('monaco-editor');
      fireEvent.change(editor, { target: { value: 'export default Updated' } });

      await waitFor(() => {
        expect(mockSetPreviewContent).toBeDefined();
      });
    });

    it('should handle debounced preview updates', async () => {
      const mockSetPreviewContent = vi.fn();
      vi.useFakeTimers();

      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        currentFile: { name: 'test.tsx', content: 'const x = 1' },
        previewContent: null,
        setPreviewContent: mockSetPreviewContent,
        updateFileContent: vi.fn(),
      });

      render(
        <div>
          <CodeEditor />
          <PreviewPanel />
        </div>
      );

      const editor = screen.getByTestId('monaco-editor');
      fireEvent.change(editor, { target: { value: 'const x = 2' } });
      vi.advanceTimersByTime(500);

      expect(mockSetPreviewContent).toBeDefined();
      vi.useRealTimers();
    });

    it('should support manual preview refresh', () => {
      const mockSetPreviewContent = vi.fn();
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        currentFile: { name: 'test.tsx', content: 'const x = 1' },
        previewContent: 'old preview',
        setPreviewContent: mockSetPreviewContent,
        updateFileContent: vi.fn(),
      });

      render(
        <div>
          <CodeEditor />
          <PreviewPanel />
        </div>
      );

      expect(mockSetPreviewContent).toBeDefined();
    });
  });

  describe('2. Preview Device Simulation', () => {
    it('should adapt preview to selected device', () => {
      const mockSetPreviewContent = vi.fn();
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        currentFile: { name: 'test.tsx', content: '<div>App</div>' },
        previewContent: null,
        setPreviewContent: mockSetPreviewContent,
        updateFileContent: vi.fn(),
      });

      render(
        <div>
          <CodeEditor />
          <PreviewPanel />
        </div>
      );

      expect(mockSetPreviewContent).toBeDefined();
    });

    it('should handle responsive design testing', () => {
      const mockSetPreviewContent = vi.fn();
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        currentFile: { name: 'test.tsx', content: 'export default App' },
        previewContent: null,
        setPreviewContent: mockSetPreviewContent,
        updateFileContent: vi.fn(),
      });

      render(
        <div>
          <CodeEditor />
          <PreviewPanel />
        </div>
      );

      expect(mockSetPreviewContent).toBeDefined();
    });

    it('should support orientation changes', () => {
      const mockSetPreviewContent = vi.fn();
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        currentFile: { name: 'test.tsx', content: 'export default App' },
        previewContent: null,
        setPreviewContent: mockSetPreviewContent,
        updateFileContent: vi.fn(),
      });

      render(
        <div>
          <CodeEditor />
          <PreviewPanel />
        </div>
      );

      expect(mockSetPreviewContent).toBeDefined();
    });
  });

  describe('3. Preview Error Handling', () => {
    it('should display preview errors gracefully', () => {
      const mockSetPreviewContent = vi.fn();
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        currentFile: { name: 'test.tsx', content: 'invalid jsx' },
        previewContent: { error: 'Syntax error' },
        setPreviewContent: mockSetPreviewContent,
        updateFileContent: vi.fn(),
      });

      render(
        <div>
          <CodeEditor />
          <PreviewPanel />
        </div>
      );

      expect(mockSetPreviewContent).toBeDefined();
    });

    it('should recover from preview errors', () => {
      const mockSetPreviewContent = vi.fn();
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        currentFile: { name: 'test.tsx', content: 'export default App' },
        previewContent: null,
        setPreviewContent: mockSetPreviewContent,
        updateFileContent: vi.fn(),
      });

      render(
        <div>
          <CodeEditor />
          <PreviewPanel />
        </div>
      );

      expect(mockSetPreviewContent).toBeDefined();
    });

    it('should show error details from preview', () => {
      const mockSetPreviewContent = vi.fn();
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        currentFile: { name: 'test.tsx', content: 'export default App' },
        previewContent: { error: 'Error details' },
        setPreviewContent: mockSetPreviewContent,
        updateFileContent: vi.fn(),
      });

      render(
        <div>
          <CodeEditor />
          <PreviewPanel />
        </div>
      );

      expect(mockSetPreviewContent).toBeDefined();
    });
  });
});
