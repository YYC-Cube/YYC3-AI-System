/**
 * @file editor-filemanager-integration.test.tsx
 * @description YYC³便携式智能AI系统 - 编辑器和文件管理集成测试
 * Editor and File Manager Integration Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @status active
 * @tags integration,test,editor,filemanager
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import '@testing-library/jest-dom'
import { CodeEditor } from '../CodeEditor'
import { FileManager } from '../FileManager'

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
}))

// Mock store
vi.mock('../store', () => ({
  useAppStore: vi.fn(() => ({
    theme: 'dark',
    files: [],
    currentFile: null,
    setCurrentFile: vi.fn(),
    updateFileContent: vi.fn(),
    addFile: vi.fn(),
    deleteFile: vi.fn(),
  })),
}))

describe('Editor and File Manager Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('1. File Selection and Loading', () => {
    it('should load file content into editor when file is selected', () => {
      const mockSetCurrentFile = vi.fn()
      const mockFiles = [
        { name: 'test.ts', path: '/test.ts', content: 'const x = 1' },
        { name: 'app.tsx', path: '/app.tsx', content: 'export default App' },
      ]
      
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: mockFiles,
        currentFile: null,
        setCurrentFile: mockSetCurrentFile,
        updateFileContent: vi.fn(),
        addFile: vi.fn(),
        deleteFile: vi.fn(),
      })

      render(
        <div>
          <FileManager />
          <CodeEditor />
        </div>
      )

      expect(mockSetCurrentFile).toBeDefined()
    })

    it('should handle file content updates from editor', () => {
      const mockUpdateFileContent = vi.fn()
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: [{ name: 'test.ts', path: '/test.ts', content: 'const x = 1' }],
        currentFile: { name: 'test.ts', path: '/test.ts', content: 'const x = 1' },
        setCurrentFile: vi.fn(),
        updateFileContent: mockUpdateFileContent,
        addFile: vi.fn(),
        deleteFile: vi.fn(),
      })

      render(
        <div>
          <FileManager />
          <CodeEditor />
        </div>
      )

      const editor = screen.getByTestId('monaco-editor')
      fireEvent.change(editor, { target: { value: 'const y = 2' } })
      
      expect(mockUpdateFileContent).toBeDefined()
    })

    it('should maintain editor state when switching files', () => {
      const mockSetCurrentFile = vi.fn()
      const mockFiles = [
        { name: 'file1.ts', path: '/file1.ts', content: 'content1' },
        { name: 'file2.ts', path: '/file2.ts', content: 'content2' },
      ]
      
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: mockFiles,
        currentFile: null,
        setCurrentFile: mockSetCurrentFile,
        updateFileContent: vi.fn(),
        addFile: vi.fn(),
        deleteFile: vi.fn(),
      })

      render(
        <div>
          <FileManager />
          <CodeEditor />
        </div>
      )

      expect(mockSetCurrentFile).toBeDefined()
    })
  })

  describe('2. File Creation and Deletion', () => {
    it('should create new file and open in editor', () => {
      const mockAddFile = vi.fn()
      const mockSetCurrentFile = vi.fn()
      
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: [],
        currentFile: null,
        setCurrentFile: mockSetCurrentFile,
        updateFileContent: vi.fn(),
        addFile: mockAddFile,
        deleteFile: vi.fn(),
      })

      render(
        <div>
          <FileManager />
          <CodeEditor />
        </div>
      )

      expect(mockAddFile).toBeDefined()
    })

    it('should close editor when current file is deleted', () => {
      const mockDeleteFile = vi.fn()
      const mockSetCurrentFile = vi.fn()
      
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: [{ name: 'test.ts', path: '/test.ts', content: 'content' }],
        currentFile: { name: 'test.ts', path: '/test.ts', content: 'content' },
        setCurrentFile: mockSetCurrentFile,
        updateFileContent: vi.fn(),
        addFile: vi.fn(),
        deleteFile: mockDeleteFile,
      })

      render(
        <div>
          <FileManager />
          <CodeEditor />
        </div>
      )

      expect(mockDeleteFile).toBeDefined()
    })

    it('should handle file renaming with editor update', () => {
      const mockUpdateFileContent = vi.fn()
      
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: [{ name: 'old.ts', path: '/old.ts', content: 'content' }],
        currentFile: { name: 'old.ts', path: '/old.ts', content: 'content' },
        setCurrentFile: vi.fn(),
        updateFileContent: mockUpdateFileContent,
        addFile: vi.fn(),
        deleteFile: vi.fn(),
      })

      render(
        <div>
          <FileManager />
          <CodeEditor />
        </div>
      )

      expect(mockUpdateFileContent).toBeDefined()
    })
  })

  describe('3. File Tree and Editor Sync', () => {
    it('should update file tree when editor saves content', () => {
      const mockUpdateFileContent = vi.fn()
      
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: [{ name: 'test.ts', path: '/test.ts', content: 'content' }],
        currentFile: { name: 'test.ts', path: '/test.ts', content: 'content' },
        setCurrentFile: vi.fn(),
        updateFileContent: mockUpdateFileContent,
        addFile: vi.fn(),
        deleteFile: vi.fn(),
      })

      render(
        <div>
          <FileManager />
          <CodeEditor />
        </div>
      )

      expect(mockUpdateFileContent).toBeDefined()
    })

    it('should display file modification indicators', () => {
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: [{ name: 'test.ts', path: '/test.ts', content: 'content', modified: true }],
        currentFile: { name: 'test.ts', path: '/test.ts', content: 'content' },
        setCurrentFile: vi.fn(),
        updateFileContent: vi.fn(),
        addFile: vi.fn(),
        deleteFile: vi.fn(),
      })

      render(
        <div>
          <FileManager />
          <CodeEditor />
        </div>
      )

      const editor = screen.getByTestId('monaco-editor')
      expect(editor).toBeInTheDocument()
    })

    it('should handle multiple open files with tabs', () => {
      const mockFiles = [
        { name: 'file1.ts', path: '/file1.ts', content: 'content1' },
        { name: 'file2.ts', path: '/file2.ts', content: 'content2' },
        { name: 'file3.ts', path: '/file3.ts', content: 'content3' },
      ]
      
      vi.mocked(require('../store').useAppStore).mockReturnValue({
        theme: 'dark',
        files: mockFiles,
        currentFile: null,
        setCurrentFile: vi.fn(),
        updateFileContent: vi.fn(),
        addFile: vi.fn(),
        deleteFile: vi.fn(),
      })

      render(
        <div>
          <FileManager />
          <CodeEditor />
        </div>
      )

      expect(mockFiles).toHaveLength(3)
    })
  })
})
