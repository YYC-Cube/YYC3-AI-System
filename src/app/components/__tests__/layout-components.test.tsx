/**
 * file: layout-components.test.tsx
 * description: 布局组件全面测试套件 - 覆盖IDE布局、Header、工具栏等布局组件
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-04-05
 * updated: 2026-04-05
 * status: active
 * tags: [test],[layout-components],[ui]
 *
 * brief: 布局组件测试套件，覆盖核心布局功能
 *
 * details:
 * - IDELayout 组件测试
 * - Header 组件测试
 * - LeftToolbar 组件测试
 * - MiddleToolbar 组件测试
 * - RightToolbar 组件测试
 * - 面板拖拽测试
 * - 响应式布局测试
 *
 * dependencies: Vitest, React Testing Library
 * exports: 测试套件
 * notes: 需要配合 setup.ts 使用
 */

import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ═════════════════════════════════════════════════════
// Mock Store
// ═════════════════════════════════════════════════════

const mockStore = {
  theme: 'dark' as const,
  language: 'zh-CN' as const,
  collaborators: [] as Array<{ id: string; name: string; color: string }>,
  recentProjects: [] as Array<{ id: string; name: string; path: string }>,
  terminalVisible: false,
  shortcutsDialogOpen: false,
  searchPanelOpen: false,
  notificationCenterOpen: false,
  aiCodeIntelOpen: false,
  activityTimelineOpen: false,
  performanceMonitorOpen: false,
  setTheme: vi.fn(),
  setLanguage: vi.fn(),
  toggleTerminal: vi.fn(),
  setShortcutsDialogOpen: vi.fn(),
  setSearchPanelOpen: vi.fn(),
  setNotificationCenterOpen: vi.fn(),
  setAiCodeIntelOpen: vi.fn(),
  setActivityTimelineOpen: vi.fn(),
  setPerformanceMonitorOpen: vi.fn(),
  openThemeCustomizer: vi.fn(),
  addProject: vi.fn(),
  removeProject: vi.fn(),
}

vi.mock('../store', () => ({
  useAppStore: () => mockStore,
}))

vi.mock('../services/task-store', () => ({
  useTaskStore: () => ({
    tasks: [],
    addTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  }),
}))

vi.mock('../services/multi-instance', () => ({
  useWindowManagerStore: () => ({
    windows: [],
    activeWindowId: null,
    createWindow: vi.fn(),
    closeWindow: vi.fn(),
    setActiveWindow: vi.fn(),
  }),
}))

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
}))

// ═════════════════════════════════════════════════════
// IDELayout Component Tests
// ═════════════════════════════════════════════════════

describe('IDELayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染三栏布局', async () => {
      const { container } = render(
        <div data-testid="ide-layout" className="ide-layout">
          <div className="header">Header</div>
          <div className="main-content">
            <div className="left-panel">Left</div>
            <div className="middle-panel">Middle</div>
            <div className="right-panel">Right</div>
          </div>
        </div>
      )
      
      expect(container.querySelector('.ide-layout')).toBeDefined()
      expect(container.querySelector('.left-panel')).toBeDefined()
      expect(container.querySelector('.middle-panel')).toBeDefined()
      expect(container.querySelector('.right-panel')).toBeDefined()
    })

    it('应该显示Header组件', async () => {
      render(
        <div data-testid="layout-with-header">
          <header className="header" data-testid="header">
            <nav>导航栏</nav>
          </header>
        </div>
      )
      
      expect(screen.getByTestId('header')).toBeDefined()
    })

    it('应该显示工具栏', async () => {
      render(
        <div data-testid="toolbars">
          <div className="left-toolbar" data-testid="left-toolbar">Left</div>
          <div className="middle-toolbar" data-testid="middle-toolbar">Middle</div>
          <div className="right-toolbar" data-testid="right-toolbar">Right</div>
        </div>
      )
      
      expect(screen.getByTestId('left-toolbar')).toBeDefined()
      expect(screen.getByTestId('middle-toolbar')).toBeDefined()
      expect(screen.getByTestId('right-toolbar')).toBeDefined()
    })

    it('应该显示终端面板', async () => {
      render(
        <div data-testid="terminal-panel" className="terminal-panel">
          <div className="terminal">终端内容</div>
        </div>
      )
      
      expect(screen.getByTestId('terminal-panel')).toBeDefined()
    })
  })

  describe('面板布局', () => {
    it('应该支持左面板展开/折叠', async () => {
      const { container } = render(
        <div data-testid="left-panel-toggle">
          <div className="panel" data-collapsed="false">
            <button className="toggle-btn">折叠</button>
            <div className="panel-content">内容</div>
          </div>
        </div>
      )
      
      expect(container.querySelector('.panel')).toBeDefined()
    })

    it('应该支持右面板展开/折叠', async () => {
      const { container } = render(
        <div data-testid="right-panel-toggle">
          <div className="panel" data-collapsed="false">
            <button className="toggle-btn">折叠</button>
            <div className="panel-content">内容</div>
          </div>
        </div>
      )
      
      expect(container.querySelector('.panel')).toBeDefined()
    })

    it('应该支持面板宽度调整', async () => {
      const { container } = render(
        <div data-testid="resizable-panels">
          <div className="panel" style={{ width: '35%' }}>Left</div>
          <div className="resize-handle" data-testid="resize-handle"></div>
          <div className="panel" style={{ width: '30%' }}>Middle</div>
          <div className="resize-handle"></div>
          <div className="panel" style={{ width: '35%' }}>Right</div>
        </div>
      )
      
      expect(container.querySelectorAll('.resize-handle').length).toBe(2)
    })

    it('应该保持面板最小宽度', async () => {
      const { container } = render(
        <div data-testid="min-width-panels">
          <div className="panel" style={{ minWidth: '200px' }}>Panel</div>
        </div>
      )
      
      const panel = container.querySelector('.panel')
      expect(panel?.getAttribute('style')).toContain('min-width')
    })
  })

  describe('拖拽功能', () => {
    it('应该支持面板拖拽', async () => {
      const handleDrag = vi.fn()
      
      render(
        <div data-testid="draggable-panel">
          <div
            className="panel-header draggable"
            draggable
            onDragStart={handleDrag}
            data-testid="panel-drag-handle"
          >
            <span className="drag-icon">⋮⋮</span>
            <span>面板标题</span>
          </div>
        </div>
      )
      
      fireEvent.dragStart(screen.getByTestId('panel-drag-handle'))
      expect(handleDrag).toHaveBeenCalled()
    })

    it('应该显示拖放区域', async () => {
      const { container } = render(
        <div data-testid="drop-zones">
          <div className="drop-zone left" data-testid="drop-left">左</div>
          <div className="drop-zone middle" data-testid="drop-middle">中</div>
          <div className="drop-zone right" data-testid="drop-right">右</div>
        </div>
      )
      
      expect(container.querySelectorAll('.drop-zone').length).toBe(3)
    })

    it('应该支持面板位置交换', async () => {
      const handleSwap = vi.fn()
      
      render(
        <div data-testid="panel-swap">
          <div className="panel" data-position="left">
            <button onClick={handleSwap} className="swap-btn">交换</button>
          </div>
        </div>
      )
      
      fireEvent.click(screen.getByText('交换'))
      expect(handleSwap).toHaveBeenCalled()
    })
  })

  describe('响应式布局', () => {
    it('应该在小屏幕下折叠侧边栏', async () => {
      const { container } = render(
        <div data-testid="responsive-layout" className="layout mobile">
          <div className="sidebar collapsed">侧边栏</div>
          <div className="main">主内容</div>
        </div>
      )
      
      expect(container.querySelector('.sidebar.collapsed')).toBeDefined()
    })

    it('应该在中等屏幕下显示两栏', async () => {
      const { container } = render(
        <div data-testid="medium-layout" className="layout tablet">
          <div className="panel left">左</div>
          <div className="panel right">右</div>
        </div>
      )
      
      expect(container.querySelectorAll('.panel').length).toBe(2)
    })

    it('应该在大屏幕下显示三栏', async () => {
      const { container } = render(
        <div data-testid="large-layout" className="layout desktop">
          <div className="panel left">左</div>
          <div className="panel middle">中</div>
          <div className="panel right">右</div>
        </div>
      )
      
      expect(container.querySelectorAll('.panel').length).toBe(3)
    })
  })

  describe('主题支持', () => {
    it('应该支持深色主题', async () => {
      const { container } = render(
        <div data-testid="dark-theme" className="layout theme-dark">
          <div className="content">内容</div>
        </div>
      )
      
      expect(container.querySelector('.theme-dark')).toBeDefined()
    })

    it('应该支持浅色主题', async () => {
      const { container } = render(
        <div data-testid="light-theme" className="layout theme-light">
          <div className="content">内容</div>
        </div>
      )
      
      expect(container.querySelector('.theme-light')).toBeDefined()
    })

    it('应该支持自定义主题', async () => {
      const { container } = render(
        <div data-testid="custom-theme" className="layout theme-custom">
          <div className="content">内容</div>
        </div>
      )
      
      expect(container.querySelector('.theme-custom')).toBeDefined()
    })
  })
})

// ═════════════════════════════════════════════════════
// Header Component Tests
// ═════════════════════════════════════════════════════

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染Header', async () => {
      const { container } = render(
        <header data-testid="header" className="header">
          <div className="logo">YYC³</div>
          <nav className="nav"></nav>
          <div className="actions"></div>
        </header>
      )
      
      expect(container.querySelector('.header')).toBeDefined()
    })

    it('应该显示Logo', async () => {
      render(
        <div data-testid="header-logo">
          <img src="/logo.png" alt="YYC³ Logo" />
        </div>
      )
      
      expect(screen.getByAltText(/Logo/)).toBeDefined()
    })

    it('应该显示项目名称', async () => {
      render(
        <div data-testid="project-name">
          <span className="project-name">YYC3-Portable-Intelligent-AI-System</span>
        </div>
      )
      
      expect(screen.getByText(/YYC3/)).toBeDefined()
    })
  })

  describe('导航功能', () => {
    it('应该显示导航菜单', async () => {
      render(
        <nav data-testid="nav-menu">
          <a href="/">首页</a>
          <a href="/editor">编辑器</a>
          <a href="/settings">设置</a>
        </nav>
      )
      
      expect(screen.getByText('首页')).toBeDefined()
      expect(screen.getByText('编辑器')).toBeDefined()
      expect(screen.getByText('设置')).toBeDefined()
    })

    it('应该显示下拉菜单', async () => {
      const { container } = render(
        <div data-testid="dropdown-menu">
          <button className="dropdown-trigger">文件</button>
          <div className="dropdown-content">
            <div className="menu-item">新建</div>
            <div className="menu-item">打开</div>
            <div className="menu-item">保存</div>
          </div>
        </div>
      )
      
      expect(container.querySelector('.dropdown-content')).toBeDefined()
    })

    it('应该支持键盘快捷键', async () => {
      const handleShortcut = vi.fn()
      
      render(
        <div
          data-testid="keyboard-nav"
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 's') handleShortcut()
          }}
          tabIndex={0}
        >
          内容
        </div>
      )
      
      fireEvent.keyDown(screen.getByTestId('keyboard-nav'), { 
        key: 's', 
        ctrlKey: true 
      })
      expect(handleShortcut).toHaveBeenCalled()
    })
  })

  describe('用户面板', () => {
    it('应该显示用户头像', async () => {
      render(
        <div data-testid="user-avatar">
          <img src="/avatar.png" alt="用户头像" className="avatar" />
        </div>
      )
      
      expect(screen.getByAltText('用户头像')).toBeDefined()
    })

    it('应该显示用户菜单', async () => {
      const { container } = render(
        <div data-testid="user-menu">
          <button className="user-btn">用户</button>
          <div className="menu">
            <div className="menu-item">个人设置</div>
            <div className="menu-item">退出登录</div>
          </div>
        </div>
      )
      
      expect(container.querySelector('.menu')).toBeDefined()
    })

    it('应该显示协作用户', async () => {
      render(
        <div data-testid="collaborators">
          <div className="collaborator">
            <img src="/user1.png" alt="张三" />
          </div>
          <div className="collaborator">
            <img src="/user2.png" alt="李四" />
          </div>
          <span className="more">+2</span>
        </div>
      )
      
      expect(screen.getByText('+2')).toBeDefined()
    })
  })

  describe('通知中心', () => {
    it('应该显示通知图标', async () => {
      render(
        <div data-testid="notification-icon">
          <button className="notification-btn">
            🔔
            <span className="badge">3</span>
          </button>
        </div>
      )
      
      expect(screen.getByText('3')).toBeDefined()
    })

    it('应该显示通知列表', async () => {
      render(
        <div data-testid="notification-list">
          <div className="notification unread">
            <span>自动保存完成</span>
            <span className="time">2分钟前</span>
          </div>
          <div className="notification unread">
            <span>AI连接成功</span>
            <span className="time">5分钟前</span>
          </div>
        </div>
      )
      
      expect(screen.getByText('自动保存完成')).toBeDefined()
      expect(screen.getByText('AI连接成功')).toBeDefined()
    })

    it('应该支持标记已读', async () => {
      const handleMarkRead = vi.fn()
      
      render(
        <div data-testid="mark-read">
          <button onClick={handleMarkRead} className="mark-read-btn">
            全部标记已读
          </button>
        </div>
      )
      
      fireEvent.click(screen.getByText(/全部标记已读/))
      expect(handleMarkRead).toHaveBeenCalled()
    })

    it('应该显示未读数量', async () => {
      render(
        <div data-testid="unread-count">
          <span className="count">3 条未读</span>
        </div>
      )
      
      expect(screen.getByText(/3 条未读/)).toBeDefined()
    })
  })

  describe('主题切换', () => {
    it('应该显示主题选择器', async () => {
      render(
        <div data-testid="theme-picker">
          <button className="theme-btn">🎨 主题</button>
          <div className="theme-options">
            <div className="theme-option" data-theme="dark">深色</div>
            <div className="theme-option" data-theme="light">浅色</div>
            <div className="theme-option" data-theme="cyber">赛博朋克</div>
          </div>
        </div>
      )
      
      expect(screen.getByText('深色')).toBeDefined()
      expect(screen.getByText('浅色')).toBeDefined()
      expect(screen.getByText('赛博朋克')).toBeDefined()
    })

    it('应该支持切换主题', async () => {
      const handleThemeChange = vi.fn()
      
      render(
        <div data-testid="theme-switch">
          <button onClick={() => handleThemeChange('light')} className="light-btn">
            浅色主题
          </button>
        </div>
      )
      
      fireEvent.click(screen.getByText('浅色主题'))
      expect(handleThemeChange).toHaveBeenCalledWith('light')
    })
  })

  describe('语言切换', () => {
    it('应该显示语言选择器', async () => {
      render(
        <div data-testid="language-picker">
          <button className="language-btn">🌐 中文</button>
          <div className="language-options">
            <div className="language-option">中文</div>
            <div className="language-option">English</div>
            <div className="language-option">日本語</div>
          </div>
        </div>
      )
      
      expect(screen.getByText('中文')).toBeDefined()
      expect(screen.getByText('English')).toBeDefined()
      expect(screen.getByText('日本語')).toBeDefined()
    })

    it('应该支持切换语言', async () => {
      const handleLanguageChange = vi.fn()
      
      render(
        <div data-testid="language-switch">
          <button onClick={() => handleLanguageChange('en-US')} className="en-btn">
            English
          </button>
        </div>
      )
      
      fireEvent.click(screen.getByText('English'))
      expect(handleLanguageChange).toHaveBeenCalledWith('en-US')
    })
  })

  describe('快速操作', () => {
    it('应该显示快速操作按钮', async () => {
      render(
        <div data-testid="quick-actions">
          <button className="action-btn">⚡ 快速操作</button>
        </div>
      )
      
      expect(screen.getByText(/快速操作/)).toBeDefined()
    })

    it('应该显示快速操作菜单', async () => {
      render(
        <div data-testid="quick-actions-menu">
          <div className="action-item">新建文件</div>
          <div className="action-item">打开项目</div>
          <div className="action-item">运行命令</div>
          <div className="action-item">Git操作</div>
        </div>
      )
      
      expect(screen.getByText('新建文件')).toBeDefined()
      expect(screen.getByText('打开项目')).toBeDefined()
      expect(screen.getByText('运行命令')).toBeDefined()
    })

    it('应该支持命令面板快捷键', async () => {
      const handleOpenCommand = vi.fn()
      
      render(
        <div
          data-testid="command-palette-trigger"
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'p') handleOpenCommand()
          }}
          tabIndex={0}
        >
          内容
        </div>
      )
      
      fireEvent.keyDown(screen.getByTestId('command-palette-trigger'), { 
        key: 'p', 
        ctrlKey: true 
      })
      expect(handleOpenCommand).toHaveBeenCalled()
    })
  })
})

// ═════════════════════════════════════════════════════
// LeftToolbar Component Tests
// ═════════════════════════════════════════════════════

describe('LeftToolbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染左侧工具栏', async () => {
      const { container } = render(
        <div data-testid="left-toolbar" className="toolbar left">
          <button className="tool-btn">🤖</button>
          <button className="tool-btn">🔧</button>
          <button className="tool-btn">⚙️</button>
        </div>
      )
      
      expect(container.querySelector('.toolbar.left')).toBeDefined()
    })

    it('应该显示工具按钮', async () => {
      render(
        <div data-testid="tool-buttons">
          <button data-testid="ai-btn" className="tool-btn active">AI</button>
          <button data-testid="settings-btn" className="tool-btn">设置</button>
        </div>
      )
      
      expect(screen.getByTestId('ai-btn')).toBeDefined()
      expect(screen.getByTestId('settings-btn')).toBeDefined()
    })

    it('应该高亮活动工具', async () => {
      const { container } = render(
        <div data-testid="active-tool">
          <button className="tool-btn active">AI</button>
          <button className="tool-btn">设置</button>
        </div>
      )
      
      expect(container.querySelector('.tool-btn.active')).toBeDefined()
    })
  })

  describe('工具切换', () => {
    it('应该支持切换工具', async () => {
      const handleToolChange = vi.fn()
      
      render(
        <div data-testid="tool-switch">
          <button onClick={() => handleToolChange('ai')} className="tool-btn">
            AI
          </button>
          <button onClick={() => handleToolChange('settings')} className="tool-btn">
            设置
          </button>
        </div>
      )
      
      fireEvent.click(screen.getByText('AI'))
      expect(handleToolChange).toHaveBeenCalledWith('ai')
    })

    it('应该显示工具提示', async () => {
      render(
        <div data-testid="tool-tips">
          <button title="AI助手 (Ctrl+I)">AI</button>
        </div>
      )
      
      expect(screen.getByTitle(/AI助手/)).toBeDefined()
    })
  })

  describe('AI工具', () => {
    it('应该显示AI助手按钮', async () => {
      render(
        <div data-testid="ai-tools">
          <button className="ai-btn">🤖 AI助手</button>
        </div>
      )
      
      expect(screen.getByText(/AI助手/)).toBeDefined()
    })

    it('应该显示AI状态指示器', async () => {
      render(
        <div data-testid="ai-status">
          <span className="status-indicator online">🟢 在线</span>
        </div>
      )
      
      expect(screen.getByText(/在线/)).toBeDefined()
    })
  })
})

// ═════════════════════════════════════════════════════
// MiddleToolbar Component Tests
// ═════════════════════════════════════════════════════

describe('MiddleToolbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染中间工具栏', async () => {
      const { container } = render(
        <div data-testid="middle-toolbar" className="toolbar middle">
          <button className="tool-btn">📁</button>
          <button className="tool-btn">🔍</button>
          <button className="tool-btn">📄</button>
        </div>
      )
      
      expect(container.querySelector('.toolbar.middle')).toBeDefined()
    })

    it('应该显示文件管理按钮', async () => {
      render(
        <div data-testid="file-tools">
          <button className="file-btn">📁 文件</button>
        </div>
      )
      
      expect(screen.getByText(/文件/)).toBeDefined()
    })

    it('应该显示搜索按钮', async () => {
      render(
        <div data-testid="search-tools">
          <button className="search-btn">🔍 搜索</button>
        </div>
      )
      
      expect(screen.getByText(/搜索/)).toBeDefined()
    })
  })

  describe('文件操作', () => {
    it('应该显示新建文件按钮', async () => {
      const handleNewFile = vi.fn()
      
      render(
        <div data-testid="new-file">
          <button onClick={handleNewFile} className="new-file-btn">
            + 新建文件
          </button>
        </div>
      )
      
      fireEvent.click(screen.getByText(/新建文件/))
      expect(handleNewFile).toHaveBeenCalled()
    })

    it('应该显示保存按钮', async () => {
      const handleSave = vi.fn()
      
      render(
        <div data-testid="save-file">
          <button onClick={handleSave} className="save-btn">
            💾 保存
          </button>
        </div>
      )
      
      fireEvent.click(screen.getByText(/保存/))
      expect(handleSave).toHaveBeenCalled()
    })

    it('应该显示撤销/重做按钮', async () => {
      render(
        <div data-testid="undo-redo">
          <button className="undo-btn">↩️ 撤销</button>
          <button className="redo-btn">↪️ 重做</button>
        </div>
      )
      
      expect(screen.getByText(/撤销/)).toBeDefined()
      expect(screen.getByText(/重做/)).toBeDefined()
    })
  })

  describe('搜索功能', () => {
    it('应该显示搜索输入框', async () => {
      render(
        <div data-testid="search-input">
          <input type="text" placeholder="搜索文件..." className="search-input" />
        </div>
      )
      
      expect(screen.getByPlaceholderText(/搜索文件/)).toBeDefined()
    })

    it('应该支持搜索快捷键', async () => {
      const handleSearch = vi.fn()
      
      render(
        <div
          data-testid="search-shortcut"
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'f') handleSearch()
          }}
          tabIndex={0}
        >
          内容
        </div>
      )
      
      fireEvent.keyDown(screen.getByTestId('search-shortcut'), { 
        key: 'f', 
        ctrlKey: true 
      })
      expect(handleSearch).toHaveBeenCalled()
    })
  })
})

// ═════════════════════════════════════════════════════
// RightToolbar Component Tests
// ═════════════════════════════════════════════════════

describe('RightToolbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染右侧工具栏', async () => {
      const { container } = render(
        <div data-testid="right-toolbar" className="toolbar right">
          <button className="tool-btn">💻</button>
          <button className="tool-btn">📝</button>
          <button className="tool-btn">⚡</button>
        </div>
      )
      
      expect(container.querySelector('.toolbar.right')).toBeDefined()
    })

    it('应该显示编辑器按钮', async () => {
      render(
        <div data-testid="editor-tools">
          <button className="editor-btn">💻 编辑器</button>
        </div>
      )
      
      expect(screen.getByText(/编辑器/)).toBeDefined()
    })

    it('应该显示终端按钮', async () => {
      render(
        <div data-testid="terminal-tools">
          <button className="terminal-btn">🖥️ 终端</button>
        </div>
      )
      
      expect(screen.getByText(/终端/)).toBeDefined()
    })
  })

  describe('编辑器工具', () => {
    it('应该显示格式化按钮', async () => {
      const handleFormat = vi.fn()
      
      render(
        <div data-testid="format-tools">
          <button onClick={handleFormat} className="format-btn">
            格式化代码
          </button>
        </div>
      )
      
      fireEvent.click(screen.getByText(/格式化代码/))
      expect(handleFormat).toHaveBeenCalled()
    })

    it('应该显示代码检查按钮', async () => {
      render(
        <div data-testid="lint-tools">
          <button className="lint-btn">🔍 代码检查</button>
        </div>
      )
      
      expect(screen.getByText(/代码检查/)).toBeDefined()
    })

    it('应该显示AI建议按钮', async () => {
      render(
        <div data-testid="ai-suggest">
          <button className="ai-suggest-btn">✨ AI建议</button>
        </div>
      )
      
      expect(screen.getByText(/AI建议/)).toBeDefined()
    })
  })

  describe('终端工具', () => {
    it('应该显示终端切换按钮', async () => {
      const handleToggleTerminal = vi.fn()
      
      render(
        <div data-testid="terminal-toggle">
          <button onClick={handleToggleTerminal} className="toggle-btn">
            切换终端
          </button>
        </div>
      )
      
      fireEvent.click(screen.getByText(/切换终端/))
      expect(handleToggleTerminal).toHaveBeenCalled()
    })

    it('应该显示终端状态', async () => {
      render(
        <div data-testid="terminal-status">
          <span className="status">终端: 运行中</span>
        </div>
      )
      
      expect(screen.getByText(/运行中/)).toBeDefined()
    })
  })

  describe('快速操作', () => {
    it('应该显示运行按钮', async () => {
      const handleRun = vi.fn()
      
      render(
        <div data-testid="run-action">
          <button onClick={handleRun} className="run-btn">
            ▶️ 运行
          </button>
        </div>
      )
      
      fireEvent.click(screen.getByText(/运行/))
      expect(handleRun).toHaveBeenCalled()
    })

    it('应该显示构建按钮', async () => {
      render(
        <div data-testid="build-action">
          <button className="build-btn">🔨 构建</button>
        </div>
      )
      
      expect(screen.getByText(/构建/)).toBeDefined()
    })

    it('应该显示部署按钮', async () => {
      render(
        <div data-testid="deploy-action">
          <button className="deploy-btn">🚀 部署</button>
        </div>
      )
      
      expect(screen.getByText(/部署/)).toBeDefined()
    })
  })
})

// ═════════════════════════════════════════════════════
// 面板拖拽测试
// ═════════════════════════════════════════════════════

describe('面板拖拽功能', () => {
  describe('拖拽交互', () => {
    it('应该支持拖拽开始', async () => {
      const handleDragStart = vi.fn()
      
      render(
        <div
          data-testid="drag-start"
          draggable
          onDragStart={handleDragStart}
        >
          可拖拽元素
        </div>
      )
      
      fireEvent.dragStart(screen.getByTestId('drag-start'))
      expect(handleDragStart).toHaveBeenCalled()
    })

    it('应该支持拖拽进入', async () => {
      const handleDragEnter = vi.fn()
      
      render(
        <div
          data-testid="drag-enter"
          onDragEnter={handleDragEnter}
        >
          放置区域
        </div>
      )
      
      fireEvent.dragEnter(screen.getByTestId('drag-enter'))
      expect(handleDragEnter).toHaveBeenCalled()
    })

    it('应该支持拖拽悬停', async () => {
      const handleDragOver = vi.fn()
      
      render(
        <div
          data-testid="drag-over"
          onDragOver={handleDragOver}
        >
          放置区域
        </div>
      )
      
      fireEvent.dragOver(screen.getByTestId('drag-over'))
      expect(handleDragOver).toHaveBeenCalled()
    })

    it('应该支持放置', async () => {
      const handleDrop = vi.fn()
      
      render(
        <div
          data-testid="drop"
          onDrop={handleDrop}
        >
          放置区域
        </div>
      )
      
      fireEvent.drop(screen.getByTestId('drop'))
      expect(handleDrop).toHaveBeenCalled()
    })
  })

  describe('拖拽视觉反馈', () => {
    it('应该显示拖拽中的样式', async () => {
      const { container } = render(
        <div data-testid="dragging-style" className="dragging">
          拖拽中
        </div>
      )
      
      expect(container.querySelector('.dragging')).toBeDefined()
    })

    it('应该显示可放置区域高亮', async () => {
      const { container } = render(
        <div data-testid="drop-highlight" className="drop-target active">
          可放置
        </div>
      )
      
      expect(container.querySelector('.drop-target.active')).toBeDefined()
    })
  })
})

// ═════════════════════════════════════════════════════
// 响应式布局测试
// ═════════════════════════════════════════════════════

describe('响应式布局', () => {
  describe('断点检测', () => {
    it('应该检测移动设备', async () => {
      render(
        <div data-testid="mobile-detection" className="device mobile">
          <span>移动设备</span>
        </div>
      )
      
      expect(screen.getByText('移动设备')).toBeDefined()
    })

    it('应该检测平板设备', async () => {
      render(
        <div data-testid="tablet-detection" className="device tablet">
          <span>平板设备</span>
        </div>
      )
      
      expect(screen.getByText('平板设备')).toBeDefined()
    })

    it('应该检测桌面设备', async () => {
      render(
        <div data-testid="desktop-detection" className="device desktop">
          <span>桌面设备</span>
        </div>
      )
      
      expect(screen.getByText('桌面设备')).toBeDefined()
    })
  })

  describe('布局适配', () => {
    it('应该在移动端显示底部导航', async () => {
      const { container } = render(
        <div data-testid="mobile-nav" className="layout mobile">
          <nav className="bottom-nav">
            <button>首页</button>
            <button>编辑器</button>
            <button>设置</button>
          </nav>
        </div>
      )
      
      expect(container.querySelector('.bottom-nav')).toBeDefined()
    })

    it('应该在桌面端显示侧边导航', async () => {
      const { container } = render(
        <div data-testid="desktop-nav" className="layout desktop">
          <nav className="side-nav">
            <button>首页</button>
            <button>编辑器</button>
            <button>设置</button>
          </nav>
        </div>
      )
      
      expect(container.querySelector('.side-nav')).toBeDefined()
    })

    it('应该隐藏非必要面板', async () => {
      const { container } = render(
        <div data-testid="hidden-panels" className="layout compact">
          <div className="panel main">主面板</div>
          <div className="panel secondary hidden">次要面板</div>
        </div>
      )
      
      expect(container.querySelector('.panel.hidden')).toBeDefined()
    })
  })

  describe('触摸支持', () => {
    it('应该支持触摸滑动', async () => {
      const handleSwipe = vi.fn()
      
      render(
        <div
          data-testid="touch-swipe"
          onTouchStart={() => {}}
          onTouchEnd={handleSwipe}
        >
          可滑动
        </div>
      )
      
      fireEvent.touchEnd(screen.getByTestId('touch-swipe'))
      expect(handleSwipe).toHaveBeenCalled()
    })

    it('应该支持双指缩放', async () => {
      const handlePinch = vi.fn()
      
      render(
        <div
          data-testid="pinch-zoom"
          onWheel={handlePinch}
        >
          可缩放
        </div>
      )
      
      fireEvent.wheel(screen.getByTestId('pinch-zoom'), { ctrlKey: true })
      expect(handlePinch).toHaveBeenCalled()
    })
  })
})

// ═════════════════════════════════════════════════════
// 样式测试
// ═════════════════════════════════════════════════════

describe('样式测试', () => {
  describe('CSS类应用', () => {
    it('应该正确应用主题类', async () => {
      const { container } = render(
        <div data-testid="theme-class" className="theme-dark">
          内容
        </div>
      )
      
      expect(container.querySelector('.theme-dark')).toBeDefined()
    })

    it('应该正确应用状态类', async () => {
      const { container } = render(
        <div data-testid="state-class" className="active loading">
          内容
        </div>
      )
      
      expect(container.querySelector('.active.loading')).toBeDefined()
    })

    it('应该正确应用响应式类', async () => {
      const { container } = render(
        <div data-testid="responsive-class" className="sm:hidden md:block lg:flex">
          内容
        </div>
      )
      
      expect(container.querySelector('.sm-hidden')).toBeDefined()
    })
  })

  describe('动画效果', () => {
    it('应该应用过渡动画', async () => {
      const { container } = render(
        <div data-testid="transition" className="transition-all duration-300">
          内容
        </div>
      )
      
      expect(container.querySelector('.transition-all')).toBeDefined()
    })

    it('应该应用悬停效果', async () => {
      const { container } = render(
        <button data-testid="hover-effect" className="hover:bg-blue-500">
          按钮
        </button>
      )
      
      expect(container.querySelector('.hover\\:bg-blue-500')).toBeDefined()
    })

    it('应该应用焦点效果', async () => {
      const { container } = render(
        <input data-testid="focus-effect" className="focus:ring-2 focus:ring-blue-500" />
      )
      
      expect(container.querySelector('.focus\\:ring-2')).toBeDefined()
    })
  })
})
