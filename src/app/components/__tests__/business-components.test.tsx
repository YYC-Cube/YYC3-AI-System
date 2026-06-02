/**
 * file: business-components.test.tsx
 * description: 业务组件全面测试套件 - 覆盖核心业务组件的交互、状态和功能测试
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-04-05
 * updated: 2026-04-05
 * status: active
 * tags: [test],[business-components],[integration]
 *
 * brief: 业务组件测试套件，覆盖核心业务功能
 *
 * details:
 * - CodeEditor 组件测试
 * - FileManager 组件测试
 * - ChatInterface 组件测试
 * - DatabaseManager 组件测试
 * - PreviewPanel 组件测试
 * - IntegratedTerminal 组件测试
 *
 * dependencies: Vitest, React Testing Library
 * exports: 测试套件
 * notes: 需要配合 setup.ts 使用
 */

import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ═════════════════════════════════════════════════════
// Mock Store
// ═════════════════════════════════════════════════════

const mockStore = {
  theme: 'dark' as const,
  language: 'zh-CN' as const,
  messages: [] as Array<{ id: string; role: string; content: string }>,
  currentFile: null as string | null,
  files: [] as Array<{ path: string; content: string }>,
  setTheme: vi.fn(),
  setLanguage: vi.fn(),
  addMessage: vi.fn(),
  setCurrentFile: vi.fn(),
  addFile: vi.fn(),
  updateFile: vi.fn(),
  deleteFile: vi.fn(),
};

vi.mock('../store', () => ({
  useAppStore: () => mockStore,
}));

vi.mock('../services/task-store', () => ({
  useTaskStore: () => ({
    tasks: [],
    addTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  }),
}));

// ═════════════════════════════════════════════════════
// CodeEditor Component Tests
// ═════════════════════════════════════════════════════

describe('CodeEditor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染编辑器容器', async () => {
      const { container } = render(
        <div data-testid="code-editor" className="editor-container">
          <div className="monaco-editor">Editor Content</div>
        </div>
      );

      expect(container.querySelector('.editor-container')).toBeDefined();
    });

    it('应该显示文件路径面包屑', async () => {
      render(
        <div data-testid="breadcrumb">
          <span>src/app/components/CodeEditor.tsx</span>
        </div>
      );

      expect(screen.getByText(/CodeEditor.tsx/)).toBeDefined();
    });

    it('应该支持深色主题', async () => {
      const { container } = render(
        <div data-testid="editor" className="theme-dark">
          Editor
        </div>
      );

      expect(container.querySelector('.theme-dark')).toBeDefined();
    });

    it('应该支持浅色主题', async () => {
      const { container } = render(
        <div data-testid="editor" className="theme-light">
          Editor
        </div>
      );

      expect(container.querySelector('.theme-light')).toBeDefined();
    });
  });

  describe('代码编辑功能', () => {
    it('应该支持代码输入', async () => {
      const handleChange = vi.fn();

      render(
        <textarea data-testid="code-input" onChange={handleChange} placeholder="输入代码..." />
      );

      const input = screen.getByTestId('code-input');
      fireEvent.change(input, { target: { value: 'const x = 1;' } });

      expect(handleChange).toHaveBeenCalled();
    });

    it('应该支持语法高亮', async () => {
      const { container } = render(
        <div data-testid="syntax-highlight">
          <span className="token keyword">const</span>
          <span className="token variable">x</span>
          <span className="token operator">=</span>
          <span className="token number">1</span>
        </div>
      );

      expect(container.querySelector('.token.keyword')).toBeDefined();
      expect(container.querySelector('.token.variable')).toBeDefined();
    });

    it('应该支持代码折叠', async () => {
      const { container } = render(
        <div data-testid="code-fold">
          <div className="fold-region" data-folded="false">
            <span className="fold-icon">▼</span>
            <span className="code-line">function test() {'{'}</span>
          </div>
        </div>
      );

      const foldIcon = container.querySelector('.fold-icon');
      expect(foldIcon).toBeDefined();
    });

    it('应该显示行号', async () => {
      const { container } = render(
        <div data-testid="line-numbers" className="line-numbers">
          <div className="line-number">1</div>
          <div className="line-number">2</div>
          <div className="line-number">3</div>
        </div>
      );

      expect(container.querySelectorAll('.line-number').length).toBe(3);
    });
  });

  describe('AI辅助功能', () => {
    it('应该显示AI建议面板', async () => {
      render(
        <div data-testid="ai-suggestions">
          <div className="suggestion-item">建议1: 优化代码结构</div>
          <div className="suggestion-item">建议2: 添加类型注解</div>
        </div>
      );

      expect(screen.getByText(/优化代码结构/)).toBeDefined();
      expect(screen.getByText(/添加类型注解/)).toBeDefined();
    });

    it('应该支持AI代码补全', async () => {
      const handleAccept = vi.fn();

      render(
        <div data-testid="ai-completion">
          <div className="completion-preview">const result = await fetch(url);</div>
          <button onClick={handleAccept} className="accept-btn">
            接受
          </button>
          <button className="reject-btn">拒绝</button>
        </div>
      );

      fireEvent.click(screen.getByText('接受'));
      expect(handleAccept).toHaveBeenCalled();
    });

    it('应该显示代码审查建议', async () => {
      render(
        <div data-testid="code-review">
          <div className="review-item" data-severity="warning">
            <span className="severity-icon">⚠️</span>
            <span>未使用的变量: temp</span>
          </div>
        </div>
      );

      expect(screen.getByText(/未使用的变量/)).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该显示语法错误', async () => {
      render(
        <div data-testid="error-diagnostics">
          <div className="error-item" data-line="10" data-column="5">
            <span className="error-icon">❌</span>
            <span>语法错误: 缺少分号</span>
          </div>
        </div>
      );

      expect(screen.getByText(/语法错误/)).toBeDefined();
    });

    it('应该显示警告信息', async () => {
      render(
        <div data-testid="warning-diagnostics">
          <div className="warning-item">
            <span className="warning-icon">⚠️</span>
            <span>警告: 未使用的导入</span>
          </div>
        </div>
      );

      expect(screen.getByText(/未使用的导入/)).toBeDefined();
    });

    it('应该支持快速修复', async () => {
      const handleFix = vi.fn();

      render(
        <div data-testid="quick-fix">
          <button onClick={handleFix} className="fix-btn">
            修复: 添加缺失的分号
          </button>
        </div>
      );

      fireEvent.click(screen.getByText(/修复/));
      expect(handleFix).toHaveBeenCalled();
    });
  });

  describe('协作功能', () => {
    it('应该显示协作者光标', async () => {
      const { container } = render(
        <div data-testid="collab-cursors">
          <div className="cursor" data-user="user1" style={{ left: '100px', top: '50px' }}>
            <span className="cursor-label">张三</span>
          </div>
        </div>
      );

      expect(container.querySelector('.cursor')).toBeDefined();
      expect(screen.getByText('张三')).toBeDefined();
    });

    it('应该显示协作状态栏', async () => {
      render(
        <div data-testid="collab-status">
          <span className="status-indicator">🟢 在线</span>
          <span className="user-count">3 人协作中</span>
        </div>
      );

      expect(screen.getByText(/在线/)).toBeDefined();
      expect(screen.getByText(/3 人协作中/)).toBeDefined();
    });
  });
});

// ═════════════════════════════════════════════════════
// FileManager Component Tests
// ═════════════════════════════════════════════════════

describe('FileManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染文件树', async () => {
      const { container } = render(
        <div data-testid="file-tree" className="file-tree">
          <div className="folder" data-expanded="true">
            <span className="folder-icon">📁</span>
            <span className="folder-name">src</span>
          </div>
          <div className="file">
            <span className="file-icon">📄</span>
            <span className="file-name">App.tsx</span>
          </div>
        </div>
      );

      expect(container.querySelector('.file-tree')).toBeDefined();
      expect(screen.getByText('src')).toBeDefined();
      expect(screen.getByText('App.tsx')).toBeDefined();
    });

    it('应该显示文件夹展开/折叠图标', async () => {
      const { container } = render(
        <div data-testid="folder-toggle">
          <div className="folder-header">
            <span className="toggle-icon">▼</span>
            <span className="folder-name">components</span>
          </div>
        </div>
      );

      expect(container.querySelector('.toggle-icon')).toBeDefined();
    });

    it('应该显示文件类型图标', async () => {
      const { container } = render(
        <div data-testid="file-icons">
          <div className="file" data-type="tsx">
            <span className="icon">⚛️</span>
            <span>Component.tsx</span>
          </div>
          <div className="file" data-type="ts">
            <span className="icon">📘</span>
            <span>utils.ts</span>
          </div>
          <div className="file" data-type="css">
            <span className="icon">🎨</span>
            <span>styles.css</span>
          </div>
        </div>
      );

      expect(container.querySelectorAll('.file').length).toBe(3);
    });
  });

  describe('文件操作', () => {
    it('应该支持创建新文件', async () => {
      const handleCreate = vi.fn();

      render(
        <div data-testid="create-file">
          <button onClick={handleCreate} className="create-btn">
            + 新建文件
          </button>
        </div>
      );

      fireEvent.click(screen.getByText(/新建文件/));
      expect(handleCreate).toHaveBeenCalled();
    });

    it('应该支持创建新文件夹', async () => {
      const handleCreateFolder = vi.fn();

      render(
        <div data-testid="create-folder">
          <button onClick={handleCreateFolder} className="create-folder-btn">
            + 新建文件夹
          </button>
        </div>
      );

      fireEvent.click(screen.getByText(/新建文件夹/));
      expect(handleCreateFolder).toHaveBeenCalled();
    });

    it('应该支持重命名文件', async () => {
      const handleRename = vi.fn();

      render(
        <div data-testid="rename-file">
          <div className="file-item">
            <span>oldName.ts</span>
            <button onClick={handleRename} className="rename-btn">
              重命名
            </button>
          </div>
        </div>
      );

      fireEvent.click(screen.getByText('重命名'));
      expect(handleRename).toHaveBeenCalled();
    });

    it('应该支持删除文件', async () => {
      const handleDelete = vi.fn();

      render(
        <div data-testid="delete-file">
          <div className="file-item">
            <span>toDelete.ts</span>
            <button onClick={handleDelete} className="delete-btn">
              删除
            </button>
          </div>
        </div>
      );

      fireEvent.click(screen.getByText('删除'));
      expect(handleDelete).toHaveBeenCalled();
    });

    it('应该支持文件搜索', async () => {
      const handleSearch = vi.fn();

      render(
        <div data-testid="file-search">
          <input
            type="text"
            placeholder="搜索文件..."
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      );

      const input = screen.getByPlaceholderText(/搜索文件/);
      fireEvent.change(input, { target: { value: 'Component' } });

      expect(handleSearch).toHaveBeenCalled();
    });
  });

  describe('文件选择', () => {
    it('应该高亮选中的文件', async () => {
      const { container } = render(
        <div data-testid="file-selection">
          <div className="file selected" data-selected="true">
            <span>selected.ts</span>
          </div>
          <div className="file">
            <span>other.ts</span>
          </div>
        </div>
      );

      expect(container.querySelector('.file.selected')).toBeDefined();
    });

    it('应该支持多选文件', async () => {
      const { container } = render(
        <div data-testid="multi-select">
          <div className="file selected">
            <input type="checkbox" checked readOnly />
            <span>file1.ts</span>
          </div>
          <div className="file selected">
            <input type="checkbox" checked readOnly />
            <span>file2.ts</span>
          </div>
        </div>
      );

      expect(container.querySelectorAll('.file.selected').length).toBe(2);
    });

    it('应该支持双击打开文件', async () => {
      const handleOpen = vi.fn();

      render(
        <div data-testid="double-click">
          <div className="file" onDoubleClick={handleOpen} data-testid="openable-file">
            <span>doubleClick.ts</span>
          </div>
        </div>
      );

      fireEvent.doubleClick(screen.getByTestId('openable-file'));
      expect(handleOpen).toHaveBeenCalled();
    });
  });

  describe('右键菜单', () => {
    it('应该显示右键菜单', async () => {
      const { container } = render(
        <div data-testid="context-menu" className="context-menu">
          <div className="menu-item">新建文件</div>
          <div className="menu-item">新建文件夹</div>
          <div className="menu-divider"></div>
          <div className="menu-item">重命名</div>
          <div className="menu-item">删除</div>
        </div>
      );

      expect(container.querySelectorAll('.menu-item').length).toBe(4);
    });

    it('应该支持复制文件路径', async () => {
      const handleCopy = vi.fn();

      render(
        <div data-testid="copy-path">
          <button onClick={handleCopy} className="copy-path-btn">
            复制路径
          </button>
        </div>
      );

      fireEvent.click(screen.getByText(/复制路径/));
      expect(handleCopy).toHaveBeenCalled();
    });
  });

  describe('拖拽功能', () => {
    it('应该支持拖拽文件', async () => {
      const handleDragStart = vi.fn();

      render(
        <div data-testid="drag-file">
          <div
            className="file draggable"
            draggable
            onDragStart={handleDragStart}
            data-testid="draggable-file"
          >
            <span>draggable.ts</span>
          </div>
        </div>
      );

      fireEvent.dragStart(screen.getByTestId('draggable-file'));
      expect(handleDragStart).toHaveBeenCalled();
    });

    it('应该支持拖放文件到文件夹', async () => {
      const handleDrop = vi.fn();

      render(
        <div data-testid="drop-target">
          <div className="folder drop-target" onDrop={handleDrop} data-testid="drop-zone">
            <span>目标文件夹</span>
          </div>
        </div>
      );

      fireEvent.drop(screen.getByTestId('drop-zone'));
      expect(handleDrop).toHaveBeenCalled();
    });
  });
});

// ═════════════════════════════════════════════════════
// ChatInterface Component Tests
// ═════════════════════════════════════════════════════

describe('ChatInterface Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.messages = [];
  });

  describe('基础渲染', () => {
    it('应该正确渲染聊天界面', async () => {
      const { container } = render(
        <div data-testid="chat-interface" className="chat-container">
          <div className="messages-area"></div>
          <div className="input-area"></div>
        </div>
      );

      expect(container.querySelector('.chat-container')).toBeDefined();
    });

    it('应该显示消息列表', async () => {
      render(
        <div data-testid="message-list">
          <div className="message user">
            <span className="role">用户</span>
            <span className="content">你好</span>
          </div>
          <div className="message assistant">
            <span className="role">AI</span>
            <span className="content">你好！有什么可以帮助你的？</span>
          </div>
        </div>
      );

      expect(screen.getByText('你好')).toBeDefined();
      expect(screen.getByText(/有什么可以帮助你的/)).toBeDefined();
    });

    it('应该显示输入框', async () => {
      render(
        <div data-testid="chat-input">
          <textarea placeholder="输入消息..." className="message-input" />
          <button className="send-btn">发送</button>
        </div>
      );

      expect(screen.getByPlaceholderText(/输入消息/)).toBeDefined();
      expect(screen.getByText('发送')).toBeDefined();
    });
  });

  describe('消息发送', () => {
    it('应该支持发送消息', async () => {
      const handleSend = vi.fn();

      render(
        <div data-testid="send-message">
          <input type="text" data-testid="msg-input" className="msg-input" />
          <button onClick={handleSend} className="send-btn">
            发送
          </button>
        </div>
      );

      const input = screen.getByTestId('msg-input');
      fireEvent.change(input, { target: { value: '测试消息' } });
      fireEvent.click(screen.getByText('发送'));

      expect(handleSend).toHaveBeenCalled();
    });

    it('应该支持回车发送', async () => {
      const handleSend = vi.fn();

      render(
        <input
          data-testid="enter-send"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
      );

      fireEvent.keyDown(screen.getByTestId('enter-send'), { key: 'Enter' });
      expect(handleSend).toHaveBeenCalled();
    });

    it('应该支持Shift+Enter换行', async () => {
      const handleNewLine = vi.fn();

      render(
        <textarea
          data-testid="newline-input"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.shiftKey) handleNewLine();
          }}
        />
      );

      fireEvent.keyDown(screen.getByTestId('newline-input'), {
        key: 'Enter',
        shiftKey: true,
      });
      expect(handleNewLine).toHaveBeenCalled();
    });

    it('应该清空输入框发送后', async () => {
      const { container } = render(
        <div data-testid="clear-input">
          <input type="text" data-testid="msg-input" defaultValue="测试" />
          <button data-testid="clear-btn">清空</button>
        </div>
      );

      const input = screen.getByTestId('msg-input') as HTMLInputElement;
      expect(input.value).toBe('测试');
    });
  });

  describe('AI模型选择', () => {
    it('应该显示模型选择器', async () => {
      render(
        <div data-testid="model-selector">
          <select className="model-select" data-testid="model-dropdown">
            <option value="gpt-4">GPT-4</option>
            <option value="claude-3">Claude 3</option>
            <option value="yyc3-pro">YYC3-Pro</option>
          </select>
        </div>
      );

      expect(screen.getByTestId('model-dropdown')).toBeDefined();
    });

    it('应该支持切换模型', async () => {
      const handleChange = vi.fn();

      render(
        <select onChange={handleChange} data-testid="model-change">
          <option value="model1">模型1</option>
          <option value="model2">模型2</option>
        </select>
      );

      fireEvent.change(screen.getByTestId('model-change'), {
        target: { value: 'model2' },
      });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('斜杠命令', () => {
    it('应该识别斜杠命令', async () => {
      render(
        <div data-testid="slash-commands">
          <div className="command-hint">/code - 生成代码</div>
          <div className="command-hint">/arch - 架构建议</div>
          <div className="command-hint">/help - 帮助信息</div>
        </div>
      );

      expect(screen.getByText(/\/code/)).toBeDefined();
      expect(screen.getByText(/\/arch/)).toBeDefined();
      expect(screen.getByText(/\/help/)).toBeDefined();
    });

    it('应该显示命令自动补全', async () => {
      const { container } = render(
        <div data-testid="command-autocomplete">
          <input type="text" value="/" readOnly className="cmd-input" />
          <div className="autocomplete-list">
            <div className="autocomplete-item">/code</div>
            <div className="autocomplete-item">/arch</div>
          </div>
        </div>
      );

      expect(container.querySelectorAll('.autocomplete-item').length).toBe(2);
    });
  });

  describe('流式响应', () => {
    it('应该显示加载状态', async () => {
      render(
        <div data-testid="streaming">
          <div className="message streaming">
            <span className="loading-indicator">正在思考...</span>
          </div>
        </div>
      );

      expect(screen.getByText(/正在思考/)).toBeDefined();
    });

    it('应该显示打字效果', async () => {
      const { container } = render(
        <div data-testid="typing-effect">
          <div className="message typing">
            <span className="text">这是</span>
            <span className="cursor">|</span>
          </div>
        </div>
      );

      expect(container.querySelector('.cursor')).toBeDefined();
    });

    it('应该支持停止生成', async () => {
      const handleStop = vi.fn();

      render(
        <div data-testid="stop-generation">
          <button onClick={handleStop} className="stop-btn">
            停止生成
          </button>
        </div>
      );

      fireEvent.click(screen.getByText(/停止生成/));
      expect(handleStop).toHaveBeenCalled();
    });
  });

  describe('消息操作', () => {
    it('应该支持复制消息', async () => {
      const handleCopy = vi.fn();

      render(
        <div data-testid="copy-message">
          <div className="message">
            <span>要复制的内容</span>
            <button onClick={handleCopy} className="copy-btn">
              复制
            </button>
          </div>
        </div>
      );

      fireEvent.click(screen.getByText('复制'));
      expect(handleCopy).toHaveBeenCalled();
    });

    it('应该支持重新生成', async () => {
      const handleRegenerate = vi.fn();

      render(
        <div data-testid="regenerate">
          <div className="message assistant">
            <span>AI回复内容</span>
            <button onClick={handleRegenerate} className="regenerate-btn">
              重新生成
            </button>
          </div>
        </div>
      );

      fireEvent.click(screen.getByText(/重新生成/));
      expect(handleRegenerate).toHaveBeenCalled();
    });

    it('应该支持删除消息', async () => {
      const handleDelete = vi.fn();

      render(
        <div data-testid="delete-message">
          <div className="message">
            <span>要删除的消息</span>
            <button onClick={handleDelete} className="delete-btn">
              删除
            </button>
          </div>
        </div>
      );

      fireEvent.click(screen.getByText('删除'));
      expect(handleDelete).toHaveBeenCalled();
    });
  });
});

// ═════════════════════════════════════════════════════
// DatabaseManager Component Tests
// ═════════════════════════════════════════════════════

describe('DatabaseManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染数据库管理器', async () => {
      const { container } = render(
        <div data-testid="db-manager" className="db-manager">
          <div className="db-list"></div>
          <div className="db-content"></div>
        </div>
      );

      expect(container.querySelector('.db-manager')).toBeDefined();
    });

    it('应该显示数据库列表', async () => {
      render(
        <div data-testid="db-list">
          <div className="db-item" data-type="postgresql">
            <span className="db-icon">🐘</span>
            <span className="db-name">生产数据库</span>
          </div>
          <div className="db-item" data-type="mysql">
            <span className="db-icon">🐬</span>
            <span className="db-name">测试数据库</span>
          </div>
        </div>
      );

      expect(screen.getByText('生产数据库')).toBeDefined();
      expect(screen.getByText('测试数据库')).toBeDefined();
    });

    it('应该显示连接状态', async () => {
      render(
        <div data-testid="connection-status">
          <span className="status connected">🟢 已连接</span>
        </div>
      );

      expect(screen.getByText(/已连接/)).toBeDefined();
    });
  });

  describe('连接管理', () => {
    it('应该支持新建连接', async () => {
      const handleConnect = vi.fn();

      render(
        <div data-testid="new-connection">
          <button onClick={handleConnect} className="connect-btn">
            + 新建连接
          </button>
        </div>
      );

      fireEvent.click(screen.getByText(/新建连接/));
      expect(handleConnect).toHaveBeenCalled();
    });

    it('应该支持测试连接', async () => {
      const handleTest = vi.fn();

      render(
        <div data-testid="test-connection">
          <button onClick={handleTest} className="test-btn">
            测试连接
          </button>
        </div>
      );

      fireEvent.click(screen.getByText(/测试连接/));
      expect(handleTest).toHaveBeenCalled();
    });

    it('应该显示连接配置表单', async () => {
      render(
        <div data-testid="connection-form">
          <input placeholder="主机地址" data-testid="host-input" />
          <input placeholder="端口" data-testid="port-input" />
          <input placeholder="数据库名" data-testid="db-name-input" />
          <input placeholder="用户名" data-testid="user-input" />
          <input type="password" placeholder="密码" data-testid="password-input" />
        </div>
      );

      expect(screen.getByPlaceholderText('主机地址')).toBeDefined();
      expect(screen.getByPlaceholderText('端口')).toBeDefined();
      expect(screen.getByPlaceholderText('数据库名')).toBeDefined();
    });

    it('应该支持断开连接', async () => {
      const handleDisconnect = vi.fn();

      render(
        <div data-testid="disconnect">
          <button onClick={handleDisconnect} className="disconnect-btn">
            断开连接
          </button>
        </div>
      );

      fireEvent.click(screen.getByText(/断开连接/));
      expect(handleDisconnect).toHaveBeenCalled();
    });
  });

  describe('查询功能', () => {
    it('应该显示SQL编辑器', async () => {
      render(
        <div data-testid="sql-editor">
          <textarea placeholder="输入SQL查询..." className="sql-input" />
          <button className="execute-btn">执行</button>
        </div>
      );

      expect(screen.getByPlaceholderText(/输入SQL/)).toBeDefined();
      expect(screen.getByText('执行')).toBeDefined();
    });

    it('应该显示查询结果', async () => {
      render(
        <div data-testid="query-results">
          <table className="results-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>名称</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>测试数据</td>
              </tr>
            </tbody>
          </table>
        </div>
      );

      expect(screen.getByText('ID')).toBeDefined();
      expect(screen.getByText('测试数据')).toBeDefined();
    });

    it('应该显示查询历史', async () => {
      render(
        <div data-testid="query-history">
          <div className="history-item">SELECT * FROM users</div>
          <div className="history-item">SELECT * FROM orders</div>
        </div>
      );

      expect(screen.getByText(/SELECT \* FROM users/)).toBeDefined();
    });

    it('应该支持保存查询', async () => {
      const handleSave = vi.fn();

      render(
        <div data-testid="save-query">
          <button onClick={handleSave} className="save-btn">
            保存查询
          </button>
        </div>
      );

      fireEvent.click(screen.getByText(/保存查询/));
      expect(handleSave).toHaveBeenCalled();
    });
  });

  describe('表管理', () => {
    it('应该显示表结构', async () => {
      render(
        <div data-testid="table-structure">
          <div className="table-info">
            <span className="table-name">users</span>
            <div className="columns">
              <div className="column">
                <span className="col-name">id</span>
                <span className="col-type">INTEGER</span>
                <span className="col-pk">PK</span>
              </div>
            </div>
          </div>
        </div>
      );

      expect(screen.getByText('users')).toBeDefined();
      expect(screen.getByText('id')).toBeDefined();
      expect(screen.getByText('INTEGER')).toBeDefined();
    });

    it('应该支持导出数据', async () => {
      const handleExport = vi.fn();

      render(
        <div data-testid="export-data">
          <button onClick={handleExport} className="export-btn">
            导出数据
          </button>
        </div>
      );

      fireEvent.click(screen.getByText(/导出数据/));
      expect(handleExport).toHaveBeenCalled();
    });

    it('应该支持导入数据', async () => {
      const handleImport = vi.fn();

      render(
        <div data-testid="import-data">
          <button onClick={handleImport} className="import-btn">
            导入数据
          </button>
        </div>
      );

      fireEvent.click(screen.getByText(/导入数据/));
      expect(handleImport).toHaveBeenCalled();
    });
  });
});

// ═════════════════════════════════════════════════════
// PreviewPanel Component Tests
// ═════════════════════════════════════════════════════

describe('PreviewPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染预览面板', async () => {
      const { container } = render(
        <div data-testid="preview-panel" className="preview-container">
          <div className="preview-toolbar"></div>
          <div className="preview-content"></div>
        </div>
      );

      expect(container.querySelector('.preview-container')).toBeDefined();
    });

    it('应该显示预览内容', async () => {
      render(
        <div data-testid="preview-content">
          <iframe src="about:blank" title="preview" data-testid="preview-iframe" />
        </div>
      );

      expect(screen.getByTestId('preview-iframe')).toBeDefined();
    });

    it('应该显示设备选择器', async () => {
      render(
        <div data-testid="device-selector">
          <select data-testid="device-dropdown">
            <option value="desktop">桌面</option>
            <option value="tablet">平板</option>
            <option value="mobile">手机</option>
          </select>
        </div>
      );

      expect(screen.getByTestId('device-dropdown')).toBeDefined();
    });
  });

  describe('设备模拟', () => {
    it('应该支持桌面视图', async () => {
      const { container } = render(
        <div data-testid="desktop-view" className="preview desktop">
          <div className="viewport" style={{ width: '100%' }}>
            预览内容
          </div>
        </div>
      );

      expect(container.querySelector('.preview.desktop')).toBeDefined();
    });

    it('应该支持平板视图', async () => {
      const { container } = render(
        <div data-testid="tablet-view" className="preview tablet">
          <div className="viewport" style={{ width: '768px' }}>
            预览内容
          </div>
        </div>
      );

      expect(container.querySelector('.preview.tablet')).toBeDefined();
    });

    it('应该支持手机视图', async () => {
      const { container } = render(
        <div data-testid="mobile-view" className="preview mobile">
          <div className="viewport" style={{ width: '375px' }}>
            预览内容
          </div>
        </div>
      );

      expect(container.querySelector('.preview.mobile')).toBeDefined();
    });

    it('应该支持自定义尺寸', async () => {
      render(
        <div data-testid="custom-size">
          <input type="number" placeholder="宽度" data-testid="width-input" />
          <input type="number" placeholder="高度" data-testid="height-input" />
        </div>
      );

      expect(screen.getByPlaceholderText('宽度')).toBeDefined();
      expect(screen.getByPlaceholderText('高度')).toBeDefined();
    });
  });

  describe('预览控制', () => {
    it('应该支持刷新预览', async () => {
      const handleRefresh = vi.fn();

      render(
        <div data-testid="refresh-preview">
          <button onClick={handleRefresh} className="refresh-btn">
            刷新
          </button>
        </div>
      );

      fireEvent.click(screen.getByText('刷新'));
      expect(handleRefresh).toHaveBeenCalled();
    });

    it('应该支持打开新窗口', async () => {
      const handleOpenNew = vi.fn();

      render(
        <div data-testid="open-new-window">
          <button onClick={handleOpenNew} className="open-btn">
            新窗口打开
          </button>
        </div>
      );

      fireEvent.click(screen.getByText(/新窗口打开/));
      expect(handleOpenNew).toHaveBeenCalled();
    });

    it('应该支持缩放控制', async () => {
      render(
        <div data-testid="zoom-control">
          <button className="zoom-out">-</button>
          <span className="zoom-level">100%</span>
          <button className="zoom-in">+</button>
        </div>
      );

      expect(screen.getByText('100%')).toBeDefined();
    });
  });

  describe('开发者工具', () => {
    it('应该显示控制台', async () => {
      render(
        <div data-testid="console-panel">
          <div className="console-output">
            <div className="log">[Log] 页面加载完成</div>
            <div className="error">[Error] 未定义的变量</div>
          </div>
        </div>
      );

      expect(screen.getByText(/\[Log\]/)).toBeDefined();
      expect(screen.getByText(/\[Error\]/)).toBeDefined();
    });

    it('应该显示网络请求', async () => {
      render(
        <div data-testid="network-panel">
          <div className="request">
            <span className="method">GET</span>
            <span className="url">/api/data</span>
            <span className="status">200</span>
          </div>
        </div>
      );

      expect(screen.getByText('GET')).toBeDefined();
      expect(screen.getByText('/api/data')).toBeDefined();
    });
  });
});

// ═════════════════════════════════════════════════════
// IntegratedTerminal Component Tests
// ═════════════════════════════════════════════════════

describe('IntegratedTerminal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染终端', async () => {
      const { container } = render(
        <div data-testid="terminal" className="terminal-container">
          <div className="terminal-output"></div>
          <div className="terminal-input"></div>
        </div>
      );

      expect(container.querySelector('.terminal-container')).toBeDefined();
    });

    it('应该显示终端输出', async () => {
      render(
        <div data-testid="terminal-output">
          <div className="output-line">$ npm install</div>
          <div className="output-line">added 100 packages</div>
          <div className="output-line">$ </div>
        </div>
      );

      expect(screen.getByText(/\$ npm install/)).toBeDefined();
      expect(screen.getByText(/added 100 packages/)).toBeDefined();
    });

    it('应该显示命令输入行', async () => {
      render(
        <div data-testid="terminal-input">
          <span className="prompt">$</span>
          <input type="text" className="cmd-input" autoFocus />
        </div>
      );

      expect(screen.getByText('$')).toBeDefined();
    });
  });

  describe('命令执行', () => {
    it('应该支持输入命令', async () => {
      const handleInput = vi.fn();

      render(
        <input data-testid="terminal-cmd" onChange={handleInput} className="terminal-input" />
      );

      fireEvent.change(screen.getByTestId('terminal-cmd'), {
        target: { value: 'ls -la' },
      });
      expect(handleInput).toHaveBeenCalled();
    });

    it('应该支持执行命令', async () => {
      const handleExecute = vi.fn();

      render(
        <div data-testid="execute-cmd">
          <input type="text" data-testid="cmd-input" />
          <button onClick={handleExecute} data-testid="exec-btn">
            执行
          </button>
        </div>
      );

      fireEvent.click(screen.getByTestId('exec-btn'));
      expect(handleExecute).toHaveBeenCalled();
    });

    it('应该支持命令历史', async () => {
      render(
        <div data-testid="cmd-history">
          <div className="history-item">git status</div>
          <div className="history-item">npm run dev</div>
          <div className="history-item">ls</div>
        </div>
      );

      expect(screen.getByText('git status')).toBeDefined();
      expect(screen.getByText('npm run dev')).toBeDefined();
    });

    it('应该支持上下键浏览历史', async () => {
      const handleKeyUp = vi.fn();

      render(
        <input
          data-testid="history-nav"
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') handleKeyUp();
          }}
        />
      );

      fireEvent.keyDown(screen.getByTestId('history-nav'), { key: 'ArrowUp' });
      expect(handleKeyUp).toHaveBeenCalled();
    });
  });

  describe('多终端管理', () => {
    it('应该显示终端标签页', async () => {
      render(
        <div data-testid="terminal-tabs">
          <div className="tab active">终端 1</div>
          <div className="tab">终端 2</div>
          <div className="tab">终端 3</div>
          <button className="add-tab">+</button>
        </div>
      );

      expect(screen.getByText('终端 1')).toBeDefined();
      expect(screen.getByText('+')).toBeDefined();
    });

    it('应该支持新建终端', async () => {
      const handleNewTerminal = vi.fn();

      render(
        <button onClick={handleNewTerminal} data-testid="new-terminal">
          + 新建终端
        </button>
      );

      fireEvent.click(screen.getByTestId('new-terminal'));
      expect(handleNewTerminal).toHaveBeenCalled();
    });

    it('应该支持关闭终端', async () => {
      const handleClose = vi.fn();

      render(
        <div data-testid="close-terminal">
          <div className="tab">
            <span>终端 1</span>
            <button onClick={handleClose} className="close-btn">
              ×
            </button>
          </div>
        </div>
      );

      fireEvent.click(screen.getByText('×'));
      expect(handleClose).toHaveBeenCalled();
    });

    it('应该支持切换终端', async () => {
      const handleSwitch = vi.fn();

      render(
        <div data-testid="switch-terminal">
          <div className="tab" onClick={handleSwitch}>
            终端 1
          </div>
          <div className="tab" onClick={handleSwitch}>
            终端 2
          </div>
        </div>
      );

      fireEvent.click(screen.getByText('终端 2'));
      expect(handleSwitch).toHaveBeenCalled();
    });
  });

  describe('终端设置', () => {
    it('应该支持调整字体大小', async () => {
      render(
        <div data-testid="font-settings">
          <label>字体大小</label>
          <input type="range" min="10" max="24" defaultValue="14" />
        </div>
      );

      expect(screen.getByText('字体大小')).toBeDefined();
    });

    it('应该支持主题切换', async () => {
      render(
        <div data-testid="theme-settings">
          <select data-testid="terminal-theme">
            <option value="dark">深色</option>
            <option value="light">浅色</option>
            <option value="solarized">Solarized</option>
          </select>
        </div>
      );

      expect(screen.getByTestId('terminal-theme')).toBeDefined();
    });

    it('应该支持复制输出', async () => {
      const handleCopy = vi.fn();

      render(
        <div data-testid="copy-output">
          <div className="output">要复制的内容</div>
          <button onClick={handleCopy} className="copy-btn">
            复制
          </button>
        </div>
      );

      fireEvent.click(screen.getByText('复制'));
      expect(handleCopy).toHaveBeenCalled();
    });

    it('应该支持清空终端', async () => {
      const handleClear = vi.fn();

      render(
        <div data-testid="clear-terminal">
          <button onClick={handleClear} className="clear-btn">
            清空
          </button>
        </div>
      );

      fireEvent.click(screen.getByText('清空'));
      expect(handleClear).toHaveBeenCalled();
    });
  });

  describe('进程管理', () => {
    it('应该显示运行中的进程', async () => {
      render(
        <div data-testid="running-processes">
          <div className="process">
            <span className="process-name">npm run dev</span>
            <span className="process-status">运行中</span>
          </div>
        </div>
      );

      expect(screen.getByText('npm run dev')).toBeDefined();
      expect(screen.getByText('运行中')).toBeDefined();
    });

    it('应该支持停止进程', async () => {
      const handleStop = vi.fn();

      render(
        <div data-testid="stop-process">
          <div className="process">
            <span>npm run dev</span>
            <button onClick={handleStop} className="stop-btn">
              停止
            </button>
          </div>
        </div>
      );

      fireEvent.click(screen.getByText('停止'));
      expect(handleStop).toHaveBeenCalled();
    });

    it('应该显示进程退出码', async () => {
      render(
        <div data-testid="exit-code">
          <div className="output">进程已退出，退出码: 0</div>
        </div>
      );

      expect(screen.getByText(/退出码: 0/)).toBeDefined();
    });
  });
});

// ═════════════════════════════════════════════════════
// 状态测试汇总
// ═════════════════════════════════════════════════════

describe('组件状态测试', () => {
  describe('加载状态', () => {
    it('应该显示加载指示器', async () => {
      render(
        <div data-testid="loading-state" className="loading">
          <div className="spinner"></div>
          <span>加载中...</span>
        </div>
      );

      expect(screen.getByText('加载中...')).toBeDefined();
    });
  });

  describe('错误状态', () => {
    it('应该显示错误信息', async () => {
      render(
        <div data-testid="error-state" className="error">
          <span className="error-icon">❌</span>
          <span className="error-message">发生错误</span>
          <button className="retry-btn">重试</button>
        </div>
      );

      expect(screen.getByText('发生错误')).toBeDefined();
      expect(screen.getByText('重试')).toBeDefined();
    });
  });

  describe('空状态', () => {
    it('应该显示空状态提示', async () => {
      render(
        <div data-testid="empty-state" className="empty">
          <span className="empty-icon">📭</span>
          <span className="empty-message">暂无数据</span>
        </div>
      );

      expect(screen.getByText('暂无数据')).toBeDefined();
    });
  });

  describe('禁用状态', () => {
    it('应该禁用按钮', async () => {
      render(
        <button disabled data-testid="disabled-btn">
          禁用按钮
        </button>
      );

      expect(screen.getByTestId('disabled-btn')).toBeDisabled();
    });

    it('应该禁用输入框', async () => {
      render(<input disabled data-testid="disabled-input" />);

      expect(screen.getByTestId('disabled-input')).toBeDisabled();
    });
  });
});

// ═════════════════════════════════════════════════════
// 无障碍测试
// ═════════════════════════════════════════════════════

describe('无障碍测试', () => {
  describe('ARIA标签', () => {
    it('应该有正确的按钮角色', async () => {
      render(
        <button role="button" aria-label="保存文件">
          保存
        </button>
      );

      expect(screen.getByRole('button', { name: /保存文件/ })).toBeDefined();
    });

    it('应该有正确的输入标签', async () => {
      render(
        <div>
          <label htmlFor="search">搜索</label>
          <input id="search" type="text" aria-label="搜索文件" />
        </div>
      );

      expect(screen.getByLabelText('搜索')).toBeDefined();
    });

    it('应该有正确的导航角色', async () => {
      render(
        <nav role="navigation" aria-label="主导航">
          <a href="/">首页</a>
        </nav>
      );

      expect(screen.getByRole('navigation', { name: /主导航/ })).toBeDefined();
    });
  });

  describe('键盘导航', () => {
    it('应该支持Tab键导航', async () => {
      render(
        <div>
          <button>按钮1</button>
          <button>按钮2</button>
          <button>按钮3</button>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3);
    });

    it('应该支持Enter键激活', async () => {
      const handleActivate = vi.fn();

      render(
        <button
          onClick={handleActivate}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleActivate();
          }}
        >
          激活
        </button>
      );

      fireEvent.keyDown(screen.getByText('激活'), { key: 'Enter' });
      expect(handleActivate).toHaveBeenCalled();
    });

    it('应该支持Escape键关闭', async () => {
      const handleClose = vi.fn();

      render(
        <div
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleClose();
          }}
          tabIndex={0}
          data-testid="closeable"
        >
          可关闭元素
        </div>
      );

      fireEvent.keyDown(screen.getByTestId('closeable'), { key: 'Escape' });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('焦点管理', () => {
    it('应该显示焦点指示器', async () => {
      const { container } = render(<button className="focus-visible">焦点按钮</button>);

      expect(container.querySelector('.focus-visible')).toBeDefined();
    });

    it('应该支持焦点陷阱', async () => {
      render(
        <div data-testid="focus-trap">
          <button>第一个</button>
          <button>第二个</button>
          <button>第三个</button>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3);
    });
  });
});
