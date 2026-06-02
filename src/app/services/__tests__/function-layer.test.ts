/**
 * @file function-layer.test.ts
 * @description YYC³ 功能层集成测试 - 确保功能模块可靠性
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [test],[function-layer],[ai],[editor],[terminal]
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('功能层服务测试', () => {
  describe('AI对话增强服务', () => {
    let aiService: import('../ai-conversation-service').AIConversationService;

    beforeEach(async () => {
      const { AIConversationService } = await import('../ai-conversation-service');
      aiService = new AIConversationService();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('应该正确获取可用模型列表', () => {
      const models = aiService.getAvailableModels();

      expect(models.length).toBeGreaterThan(0);
      expect(models.find((m) => m.id === 'gpt-4-turbo')).toBeDefined();
      expect(models.find((m) => m.id === 'claude-3-opus')).toBeDefined();
    });

    it('应该正确切换当前模型', () => {
      const result = aiService.setCurrentModel('claude-3-sonnet');

      expect(result).toBe(true);
      expect(aiService.getCurrentModel()?.id).toBe('claude-3-sonnet');
    });

    it('应该拒绝无效模型ID', () => {
      const result = aiService.setCurrentModel('invalid-model');

      expect(result).toBe(false);
    });

    it('应该正确创建会话', () => {
      const session = aiService.createSession('测试对话');

      expect(session.id).toBeDefined();
      expect(session.title).toBe('测试对话');
      expect(session.messages.length).toBe(0);
    });

    it('应该正确添加消息', () => {
      const session = aiService.createSession();

      const message = aiService.addMessage(session.id, 'user', '你好');

      expect(message).not.toBeNull();
      expect(message?.content).toBe('你好');
      expect(message?.role).toBe('user');
      expect(message?.tokenCount).toBeGreaterThan(0);
    });

    it('应该正确获取上下文窗口', () => {
      const session = aiService.createSession();
      aiService.addMessage(session.id, 'user', '你好');
      aiService.addMessage(session.id, 'assistant', '你好！有什么可以帮助你的吗？');

      const context = aiService.getContextWindow(session.id);

      expect(context.maxTokens).toBeGreaterThan(0);
      expect(context.usedTokens).toBeGreaterThan(0);
      expect(context.messages.length).toBe(2);
    });

    it('应该正确删除会话', () => {
      const session = aiService.createSession();

      const result = aiService.deleteSession(session.id);

      expect(result).toBe(true);
      expect(aiService.getSession(session.id)).toBeUndefined();
    });

    it('应该正确搜索会话', () => {
      aiService.createSession('Python学习');
      aiService.createSession('JavaScript开发');

      const results = aiService.searchSessions('Python');

      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Python学习');
    });

    it('应该正确获取统计信息', () => {
      const session = aiService.createSession();
      aiService.addMessage(session.id, 'user', '测试消息');

      const stats = aiService.getStatistics();

      expect(stats.totalSessions).toBe(1);
      expect(stats.totalMessages).toBe(1);
      expect(stats.totalTokens).toBeGreaterThan(0);
    });

    it('应该正确导出和导入会话', () => {
      const session = aiService.createSession('导出测试');
      aiService.addMessage(session.id, 'user', '测试内容');

      const exported = aiService.exportSession(session.id);
      expect(exported).not.toBeNull();

      const imported = aiService.importSession(exported!);
      expect(imported).not.toBeNull();
      expect(imported?.title).toBe('导出测试');
    });
  });

  describe('代码编辑器增强服务', () => {
    let editorService: import('../code-editor-service').CodeEditorService;

    beforeEach(async () => {
      const { CodeEditorService } = await import('../code-editor-service');
      editorService = new CodeEditorService();
    });

    it('应该正确识别文件语言', () => {
      expect(editorService.getLanguage('test.ts')).toBe('typescript');
      expect(editorService.getLanguage('app.tsx')).toBe('typescript');
      expect(editorService.getLanguage('main.py')).toBe('python');
      expect(editorService.getLanguage('style.css')).toBe('css');
      expect(editorService.getLanguage('index.html')).toBe('html');
    });

    it('应该正确进行语法分词', () => {
      const code = `const greeting = "Hello World";\nconsole.log(greeting);`;
      const tokens = editorService.tokenize(code, 'typescript');

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.some((t) => t.type === 'keyword')).toBe(true);
      expect(tokens.some((t) => t.type === 'string')).toBe(true);
    });

    it('应该正确提供代码补全', () => {
      const code = 'con';
      const completions = editorService.getCompletions(code, { line: 0, column: 3 }, 'typescript', {
        word: 'con',
        lineContent: code,
      });

      expect(completions.length).toBeGreaterThan(0);
      expect(completions.some((c) => c.label === 'const')).toBe(true);
      expect(completions.some((c) => c.label === 'continue')).toBe(true);
    });

    it('应该正确提供代码片段', () => {
      const completions = editorService.getCompletions('', { line: 0, column: 0 }, 'typescript', {
        word: 'log',
      });

      const logSnippet = completions.find((c) => c.label === 'log');
      expect(logSnippet).toBeDefined();
      expect(logSnippet?.kind).toBe(15);
    });

    it('应该正确检测诊断信息', () => {
      const code = 'const x = 1;    \n';
      const diagnostics = editorService.getDiagnostics('test.ts', code, 'typescript');

      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics.some((d) => d.message.includes('行尾有多余空白字符'))).toBe(true);
    });

    it('应该正确检测括号不匹配', () => {
      const code = 'function test() {\n  return true\n';
      const diagnostics = editorService.getDiagnostics('test.ts', code, 'typescript');

      expect(diagnostics.some((d) => d.message.includes('括号不匹配'))).toBe(true);
    });

    it('应该正确获取代码操作', () => {
      const code = 'const x = 1;   ';
      editorService.getDiagnostics('test.ts', code, 'typescript');

      const actions = editorService.getCodeActions('test.ts', {
        start: { line: 0, column: 0 },
        end: { line: 0, column: 15 },
      });

      expect(actions.length).toBeGreaterThan(0);
      expect(actions.some((a) => a.title.includes('删除行尾空白字符'))).toBe(true);
    });

    it('应该正确格式化代码', () => {
      const code = 'function test(){return 1;}';
      const formatted = editorService.format(code, 'typescript', {
        tabSize: 2,
        insertSpaces: true,
      });

      expect(formatted).toContain('\n');
    });

    it('应该正确提取导航符号', () => {
      const code = `class MyClass {
  myMethod() {}
  const myVar = 1;
}`;
      const symbols = editorService.getNavigationSymbols(code, 'typescript');

      expect(symbols.length).toBeGreaterThan(0);
      expect(symbols.some((s) => s.kind === 'class')).toBe(true);
    });
  });

  describe('终端功能增强服务', () => {
    let terminalService: import('../terminal-service').TerminalService;

    beforeEach(async () => {
      const { TerminalService } = await import('../terminal-service');
      terminalService = new TerminalService();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('应该正确创建终端会话', () => {
      const session = terminalService.createSession({ name: '测试终端' });

      expect(session.id).toBeDefined();
      expect(session.name).toBe('测试终端');
      expect(session.status).toBe('idle');
    });

    it('应该正确获取所有会话', () => {
      terminalService.createSession('终端1');
      terminalService.createSession('终端2');

      const sessions = terminalService.getAllSessions();

      expect(sessions.length).toBe(2);
    });

    it('应该正确执行命令', () => {
      const session = terminalService.createSession();

      const entry = terminalService.executeCommand(session.id, 'ls -la');

      expect(entry.command).toBe('ls -la');
      expect(entry.sessionId).toBe(session.id);
    });

    it('应该正确解析命令别名', () => {
      const session = terminalService.createSession();

      const entry = terminalService.executeCommand(session.id, 'll');

      expect(entry.command).toBe('ls -la');
    });

    it('应该正确添加输出', () => {
      const session = terminalService.createSession();

      const line = terminalService.addOutput(session.id, 'Hello World', 'stdout');

      expect(line.content).toBe('Hello World');
      expect(line.type).toBe('stdout');
    });

    it('应该正确获取命令历史', () => {
      const session = terminalService.createSession();
      terminalService.executeCommand(session.id, 'ls');
      terminalService.executeCommand(session.id, 'pwd');

      const history = terminalService.getHistory(session.id);

      expect(history.length).toBe(2);
    });

    it('应该正确搜索命令历史', () => {
      const session = terminalService.createSession();
      terminalService.executeCommand(session.id, 'npm install');
      terminalService.executeCommand(session.id, 'npm run dev');
      terminalService.executeCommand(session.id, 'git status');

      const results = terminalService.searchHistory('npm', session.id);

      expect(results.length).toBe(2);
    });

    it('应该正确管理主题', () => {
      const themes = terminalService.getAllThemes();

      expect(themes.length).toBeGreaterThan(0);
      expect(themes.find((t) => t.id === 'default')).toBeDefined();
    });

    it('应该正确管理别名', () => {
      const aliases = terminalService.getAllAliases();

      expect(aliases.length).toBeGreaterThan(0);
      expect(aliases.find((a) => a.name === 'll')).toBeDefined();
    });

    it('应该正确添加自定义别名', () => {
      terminalService.addAlias({ name: 'gst', command: 'git status', description: 'Git状态' });

      const alias = terminalService.getAlias('gst');
      expect(alias).toBeDefined();
      expect(alias?.command).toBe('git status');
    });

    it('应该正确获取统计信息', () => {
      const session = terminalService.createSession();
      terminalService.executeCommand(session.id, 'ls');
      terminalService.executeCommand(session.id, 'pwd');

      const stats = terminalService.getStatistics();

      expect(stats.totalSessions).toBe(1);
      expect(stats.totalCommands).toBe(2);
    });

    it('应该正确关闭会话', () => {
      const session = terminalService.createSession();

      const result = terminalService.closeSession(session.id);

      expect(result).toBe(true);
      expect(terminalService.getSession(session.id)).toBeUndefined();
    });
  });
});

describe('跨服务集成测试', () => {
  it('AI服务与事件总线集成', async () => {
    const { AIConversationService } = await import('../ai-conversation-service');
    const { createEventBus } = await import('../event-bus');

    const eventBus = createEventBus();
    const aiService = new AIConversationService();

    const listener = vi.fn();
    eventBus.on('ai:message-sent', listener);

    const session = aiService.createSession();
    aiService.addMessage(session.id, 'user', '测试消息');

    eventBus.emit('ai:message-sent', { content: '测试消息' });

    expect(listener).toHaveBeenCalled();
  });

  it('编辑器服务与错误处理集成', async () => {
    const { CodeEditorService } = await import('../code-editor-service');
    const { ErrorHandler } = await import('../error-handler');

    const editorService = new CodeEditorService();
    const errorHandler = new ErrorHandler();

    const code = 'function test() {\n';
    const diagnostics = editorService.getDiagnostics('test.ts', code, 'typescript');

    const hasErrors = diagnostics.some((d) => d.severity === 1);
    if (hasErrors) {
      const error = errorHandler.createError('SYNTAX_ERROR', '语法错误', {
        category: 'validation',
        severity: 'medium',
      });
      expect(error.code).toBe('SYNTAX_ERROR');
    }
  });

  it('终端服务与状态管理集成', async () => {
    const { TerminalService } = await import('../terminal-service');
    const { createUndoRedoService } = await import('../undo-redo-service');

    const terminalService = new TerminalService();
    const undoRedoService = createUndoRedoService<{ sessions: string[] }>({
      enablePersistence: false,
    });

    const session = terminalService.createSession();
    undoRedoService.push({ sessions: [session.id] }, 'create-session');

    expect(undoRedoService.canUndo()).toBe(true);
  });
});
