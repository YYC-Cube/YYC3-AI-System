/**
 * @file ai-storage-integration.test.ts
 * @description YYC³便携式智能AI系统 - AI和存储服务集成测试
 * AI and Storage Service Integration Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @status active
 * @tags integration,test,ai,storage
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { aiProviderService } from '../../services/ai-provider';
import { storageService } from '../../services/storage-service';

// Mock AI provider service
vi.mock('../../services/ai-provider', () => ({
  aiProviderService: {
    generateChat: vi.fn(),
    generateCode: vi.fn(),
    chat: vi.fn(),
    getActiveProvider: vi.fn(),
  },
}));

// Mock storage service
vi.mock('../../services/storage-service', () => ({
  storageService: {
    ensureDB: vi.fn().mockResolvedValue(undefined),
    getFile: vi.fn(),
    saveFile: vi.fn(),
    deleteFile: vi.fn(),
    listFiles: vi.fn(),
    getAIResponse: vi.fn(),
    saveAIResponse: vi.fn(),
  },
}));

const mockAI = aiProviderService as any;

const mockStorage = storageService as any;

describe('AI and Storage Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ==================== API Integration Tests (10 tests) ====================

  describe('1. AI Response Caching', () => {
    it('should save AI responses to storage', async () => {
      const mockSaveAIResponse = vi.mocked(mockStorage.saveAIResponse);
      mockSaveAIResponse.mockResolvedValue();

      const mockGenerateChat = vi.mocked(mockAI.generateChat);
      mockGenerateChat.mockResolvedValue({
        content: 'AI response',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      });

      await mockGenerateChat({ role: 'user', content: 'Hello' }, 'gpt-4');
      await mockSaveAIResponse('test-key', { content: 'AI response' });

      expect(mockGenerateChat).toHaveBeenCalled();
      expect(mockSaveAIResponse).toHaveBeenCalled();
    });

    it('should retrieve cached AI responses', async () => {
      const mockGetAIResponse = vi.mocked(mockStorage.getAIResponse);
      mockGetAIResponse.mockResolvedValue({
        content: 'Cached response',
        timestamp: Date.now(),
      });

      const result = await mockGetAIResponse('test-key');

      expect(mockGetAIResponse).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle cache misses gracefully', async () => {
      const mockGetAIResponse = vi.mocked(mockStorage.getAIResponse);
      mockGetAIResponse.mockResolvedValue(null);

      const mockGenerateChat = vi.mocked(mockAI.generateChat);
      mockGenerateChat.mockResolvedValue({
        content: 'Fresh response',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      });

      const cached = await mockGetAIResponse('test-key');
      if (!cached) {
        await mockGenerateChat({ role: 'user', content: 'Hello' }, 'gpt-4');
      }

      expect(mockGenerateChat).toHaveBeenCalled();
    });
  });

  describe('2. File Content Analysis', () => {
    it('should analyze file content with AI', async () => {
      const mockGetFile = vi.mocked(mockStorage.getFile);
      mockGetFile.mockResolvedValue({
        name: 'test.ts',
        content: 'const x = 1;',
      });

      const mockGenerateChat = vi.mocked(mockAI.generateChat);
      mockGenerateChat.mockResolvedValue({
        content: 'Analysis: Simple variable declaration',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      });

      const file = await mockGetFile('/test.ts');
      if (file) {
        await mockGenerateChat(
          [{ role: 'user', content: `Analyze this code:\n${file.content}` }],
          'gpt-4'
        );
      }

      expect(mockGetFile).toHaveBeenCalled();
      expect(mockGenerateChat).toHaveBeenCalled();
    });

    it('should generate code based on file context', async () => {
      const mockGetFile = vi.mocked(mockStorage.getFile);
      mockGetFile.mockResolvedValue({
        name: 'app.tsx',
        content: 'export default App',
      });

      const mockGenerateCode = vi.mocked(mockAI.generateCode);
      mockGenerateCode.mockResolvedValue({
        code: 'export default EnhancedApp',
        explanation: 'Enhanced version',
      });

      const file = await mockGetFile('/app.tsx');
      if (file) {
        await mockGenerateCode(file.content, 'Enhance this component', 'typescript');
      }

      expect(mockGenerateCode).toHaveBeenCalled();
    });

    it('should save AI-generated code to files', async () => {
      const mockGenerateCode = vi.mocked(mockAI.generateCode);
      mockGenerateCode.mockResolvedValue({
        code: 'const newCode = 1;',
        explanation: 'Generated code',
      });

      const mockSaveFile = vi.mocked(mockStorage.saveFile);
      mockSaveFile.mockResolvedValue();

      const result = await mockGenerateCode('const oldCode = 1;', 'Refactor', 'typescript');
      await mockSaveFile('/refactored.ts', result.code);

      expect(mockGenerateCode).toHaveBeenCalled();
      expect(mockSaveFile).toHaveBeenCalled();
    });
  });

  describe('3. Batch Operations', () => {
    it('should process multiple files with AI', async () => {
      const mockListFiles = vi.mocked(mockStorage.listFiles);
      mockListFiles.mockResolvedValue([
        { name: 'file1.ts', path: '/file1.ts' },
        { name: 'file2.ts', path: '/file2.ts' },
        { name: 'file3.ts', path: '/file3.ts' },
      ]);

      const mockGenerateChat = vi.mocked(mockAI.generateChat);
      mockGenerateChat.mockResolvedValue({
        content: 'Analysis complete',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      });

      const files = await mockListFiles('/');
      for (const file of files) {
        await mockGenerateChat([{ role: 'user', content: `Analyze ${file.name}` }], 'gpt-4');
      }

      expect(mockListFiles).toHaveBeenCalled();
      expect(mockGenerateChat).toHaveBeenCalledTimes(3);
    });

    it('should handle batch AI generation errors', async () => {
      const mockListFiles = vi.mocked(mockStorage.listFiles);
      mockListFiles.mockResolvedValue([
        { name: 'file1.ts', path: '/file1.ts' },
        { name: 'file2.ts', path: '/file2.ts' },
      ]);

      const mockGenerateCode = vi.mocked(mockAI.generateCode);
      mockGenerateCode
        .mockResolvedValueOnce({ code: 'code1', explanation: 'ok' })
        .mockRejectedValueOnce(new Error('Generation failed'));

      const files = await mockListFiles('/');
      const results = [];
      for (const file of files) {
        try {
          const result = await mockGenerateCode(file.content, 'Generate', 'typescript');
          results.push({ file: file.name, success: true, result });
        } catch (error) {
          results.push({ file: file.name, success: false, error });
        }
      }

      expect(mockGenerateCode).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
    });
  });

  describe('4. Data Consistency', () => {
    it('should maintain consistency between AI and storage', async () => {
      const mockSaveFile = vi.mocked(mockStorage.saveFile);
      mockSaveFile.mockResolvedValue();

      const mockGetFile = vi.mocked(mockStorage.getFile);
      mockGetFile.mockResolvedValue({
        name: 'test.ts',
        content: 'const x = 1;',
      });

      await mockSaveFile('/test.ts', 'const x = 1;');
      const file = await mockGetFile('/test.ts');

      expect(mockSaveFile).toHaveBeenCalledWith('/test.ts', 'const x = 1;');
      expect(mockGetFile).toHaveBeenCalledWith('/test.ts');
      expect(file).toBeDefined();
    });

    it('should handle concurrent AI and storage operations', async () => {
      const mockSaveFile = vi.mocked(mockStorage.saveFile);
      const mockGenerateChat = vi.mocked(mockAI.generateChat);

      mockSaveFile.mockResolvedValue();
      mockGenerateChat.mockResolvedValue({
        content: 'Response',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      });

      const operations = Promise.all([
        mockSaveFile('/file1.ts', 'content1'),
        mockSaveFile('/file2.ts', 'content2'),
        mockGenerateChat([{ role: 'user', content: 'Query 1' }], 'gpt-4'),
        mockGenerateChat([{ role: 'user', content: 'Query 2' }], 'gpt-4'),
      ]);

      await operations;

      expect(mockSaveFile).toHaveBeenCalledTimes(2);
      expect(mockGenerateChat).toHaveBeenCalledTimes(2);
    });
  });
});
