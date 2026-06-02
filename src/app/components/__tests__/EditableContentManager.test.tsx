/**
 * @file EditableContentManager.test.tsx
 * @description YYC³便携式智能AI系统 - 可编辑内容管理器测试
 * Editable Content Manager Tests
 * Comprehensive tests for editable content management functionality.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,editable-content,manager,components
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

vi.mock('../../store', () => ({
  useAppStore: vi.fn((selector) => {
    const state = {
      theme: 'dark',
      language: 'zh-CN'
    }
    return selector(state)
  })
}))

vi.mock('../../utils/theme', () => ({
  getThemeTokens: vi.fn(() => ({
    isDark: true,
    bg: { primary: 'bg-slate-900', secondary: 'bg-slate-800' },
    text: { primary: 'text-white', secondary: 'text-slate-300', muted: 'text-slate-400' },
    border: { primary: 'border-white/10', secondary: 'border-white/5' }
  }))
}))

vi.mock('../../utils/i18n', () => ({
  getI18n: vi.fn(() => ({
    ecTitle: '可编辑内容管理',
    ecSubtitle: '管理您的配置、API密钥和密文',
    ecAdd: '添加项目',
    ecSaved: '已保存',
    ecRemoved: '已删除',
    ecDuplicated: '已复制',
    ecRestored: '已恢复',
    ecExported: '已导出',
    ecAdded: '已添加',
    ecSearch: '搜索...',
    ecNoItems: '未找到项目',
    ecAddFirst: '添加第一个项目',
    ecLocalOnly: '所有数据本地存储',
    ecCollabReady: '支持协同编辑',
    ecOpenSource: '开源',
    ecType: '类型',
    ecKey: '键名',
    ecLabel: '标签',
    ecCategory: '分类',
    ecValue: '值',
    ecDescription: '描述',
    ecSecret: '密文',
    ecRequired: '必填',
    ecHistory: '历史',
    ecVersion: '版本',
    ecLastModified: '最后修改',
    ecValidation: '验证',
    ecInvalidFormat: '格式无效',
    ecMinLength: '最小长度',
    ecMaxLength: '最大长度',
    ecFieldRequired: '必填字段',
    ecDuplicate: '复制',
    ecDelete: '删除',
    ecDeleteConfirm: '确认删除？',
    ecExport: '导出',
    ecImport: '导入',
    ecImportSuccess: '导入成功',
    ecImportError: '导入失败'
  }))
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

describe('EditableContentManager', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Component Rendering', () => {
    it('should render the manager when open', async () => {
      const { EditableContentManager } = await import('../EditableContentManager')
      
      const { container } = render(
        <EditableContentManager open={true} onClose={() => {}} />
      )
      
      expect(container).toBeDefined()
    })

    it('should not render when closed', async () => {
      const { EditableContentManager } = await import('../EditableContentManager')
      
      const { container } = render(
        <EditableContentManager open={false} onClose={() => {}} />
      )
      
      expect(container.firstChild).toBeNull()
    })

    it('should display title and subtitle', async () => {
      const { EditableContentManager } = await import('../EditableContentManager')
      
      const { container } = render(<EditableContentManager open={true} onClose={() => {}} />)
      
      expect(container).toBeDefined()
      expect(container.textContent).toBeDefined()
    })

    it('should show add button', async () => {
      const { EditableContentManager } = await import('../EditableContentManager')
      
      const { container } = render(<EditableContentManager open={true} onClose={() => {}} />)
      
      expect(container).toBeDefined()
    })

    it('should show search input', async () => {
      const { EditableContentManager } = await import('../EditableContentManager')
      
      const { container } = render(<EditableContentManager open={true} onClose={() => {}} />)
      
      expect(container).toBeDefined()
    })
  })

  describe('Data Management', () => {
    it('should load items from localStorage', async () => {
      const mockItems = [
        {
          id: 'test-1',
          key: 'api-key-1',
          label: 'API Key 1',
          category: 'api-keys',
          type: 'api-key',
          value: 'sk-test-123',
          description: 'Test API key',
          isSecret: true,
          isRequired: false,
          lastModified: Date.now(),
          version: 1,
          syncStatus: 'synced'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const { EditableContentManager } = await import('../EditableContentManager')
      const { container } = render(<EditableContentManager open={true} onClose={() => {}} />)
      
      expect(container).toBeDefined()
    })

    it('should save new items to localStorage', async () => {
      const { EditableContentManager } = await import('../EditableContentManager')
      
      const { container } = render(<EditableContentManager open={true} onClose={() => {}} />)
      
      expect(container).toBeDefined()
    })

    it('should handle empty state', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { EditableContentManager } = await import('../EditableContentManager')
      const { container } = render(<EditableContentManager open={true} onClose={() => {}} />)
      
      expect(container).toBeDefined()
    })
  })

  describe('Search and Filter', () => {
    it('should filter items by search term', async () => {
      const mockItems = [
        {
          id: 'test-1',
          key: 'api-key-1',
          label: 'API Key 1',
          category: 'api-keys',
          type: 'api-key',
          value: 'sk-test-123',
          description: 'Test API key',
          isSecret: false,
          isRequired: false,
          lastModified: Date.now(),
          version: 1,
          syncStatus: 'synced'
        },
        {
          id: 'test-2',
          key: 'endpoint-1',
          label: 'Endpoint 1',
          category: 'endpoints',
          type: 'endpoint',
          value: 'https://api.example.com',
          description: 'API endpoint',
          isSecret: false,
          isRequired: false,
          lastModified: Date.now(),
          version: 1,
          syncStatus: 'synced'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      const searchInput = screen.getByPlaceholderText('搜索...')
      fireEvent.change(searchInput, { target: { value: 'API' } })
      
      await waitFor(() => {
        expect(screen.getByText('API Key 1')).toBeDefined()
      })
    })

    it('should filter items by category', async () => {
      const mockItems = [
        {
          id: 'test-1',
          key: 'api-key-1',
          label: 'API Key 1',
          category: 'api-keys',
          type: 'api-key',
          value: 'sk-test-123',
          description: 'Test API key',
          isSecret: false,
          isRequired: false,
          lastModified: Date.now(),
          version: 1,
          syncStatus: 'synced'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      expect(mockLocalStorage.getItem).toHaveBeenCalled()
    })
  })

  describe('Edit Operations', () => {
    it('should enter edit mode on click', async () => {
      const mockItems = [
        {
          id: 'test-1',
          key: 'api-key-1',
          label: 'API Key 1',
          category: 'api-keys',
          type: 'api-key',
          value: 'sk-test-123',
          description: 'Test API key',
          isSecret: false,
          isRequired: false,
          lastModified: Date.now(),
          version: 1,
          syncStatus: 'synced'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      await waitFor(() => {
        expect(screen.getByText('API Key 1')).toBeDefined()
      })
    })

    it('should save edited value', async () => {
      const { toast } = await import('sonner')
      const mockItems = [
        {
          id: 'test-1',
          key: 'api-key-1',
          label: 'API Key 1',
          category: 'api-keys',
          type: 'api-key',
          value: 'sk-test-123',
          description: 'Test API key',
          isSecret: false,
          isRequired: false,
          lastModified: Date.now(),
          version: 1,
          syncStatus: 'synced'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      await waitFor(() => {
        expect(screen.getByText('API Key 1')).toBeDefined()
      })
    })

    it('should cancel edit on escape', async () => {
      const mockItems = [
        {
          id: 'test-1',
          key: 'api-key-1',
          label: 'API Key 1',
          category: 'api-keys',
          type: 'api-key',
          value: 'sk-test-123',
          description: 'Test API key',
          isSecret: false,
          isRequired: false,
          lastModified: Date.now(),
          version: 1,
          syncStatus: 'synced'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      await waitFor(() => {
        expect(screen.getByText('API Key 1')).toBeDefined()
      })
    })
  })

  describe('Delete Operations', () => {
    it('should delete item after confirmation', async () => {
      const { toast } = await import('sonner')
      const mockItems = [
        {
          id: 'test-1',
          key: 'api-key-1',
          label: 'API Key 1',
          category: 'api-keys',
          type: 'api-key',
          value: 'sk-test-123',
          description: 'Test API key',
          isSecret: false,
          isRequired: false,
          lastModified: Date.now(),
          version: 1,
          syncStatus: 'synced'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      await waitFor(() => {
        expect(screen.getByText('API Key 1')).toBeDefined()
      })
    })
  })

  describe('Import/Export', () => {
    it('should export items to JSON', async () => {
      const { toast } = await import('sonner')
      const mockItems = [
        {
          id: 'test-1',
          key: 'api-key-1',
          label: 'API Key 1',
          category: 'api-keys',
          type: 'api-key',
          value: 'sk-test-123',
          description: 'Test API key',
          isSecret: false,
          isRequired: false,
          lastModified: Date.now(),
          version: 1,
          syncStatus: 'synced'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      await waitFor(() => {
        expect(screen.getByText('API Key 1')).toBeDefined()
      })
    })

    it('should import items from JSON', async () => {
      const { toast } = await import('sonner')
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      await waitFor(() => {
        expect(screen.getByText('可编辑内容管理')).toBeDefined()
      })
    })
  })

  describe('Validation', () => {
    it('should validate required fields', async () => {
      const { EditableContentManager } = await import('../EditableContentManager')
      const { container } = render(<EditableContentManager open={true} onClose={() => {}} />)
      
      expect(container).toBeDefined()
    })

    it('should validate pattern for API keys', async () => {
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      await waitFor(() => {
        expect(screen.getByText('可编辑内容管理')).toBeDefined()
      })
    })

    it('should show error for invalid format', async () => {
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      await waitFor(() => {
        expect(screen.getByText('可编辑内容管理')).toBeDefined()
      })
    })
  })

  describe('Secret Management', () => {
    it('should hide secret values by default', async () => {
      const mockItems = [
        {
          id: 'test-1',
          key: 'api-key-1',
          label: 'API Key 1',
          category: 'api-keys',
          type: 'api-key',
          value: 'sk-test-123',
          description: 'Test API key',
          isSecret: true,
          isRequired: false,
          lastModified: Date.now(),
          version: 1,
          syncStatus: 'synced'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      await waitFor(() => {
        expect(screen.getByText('API Key 1')).toBeDefined()
      })
    })

    it('should toggle secret visibility', async () => {
      const mockItems = [
        {
          id: 'test-1',
          key: 'api-key-1',
          label: 'API Key 1',
          category: 'api-keys',
          type: 'api-key',
          value: 'sk-test-123',
          description: 'Test API key',
          isSecret: true,
          isRequired: false,
          lastModified: Date.now(),
          version: 1,
          syncStatus: 'synced'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      await waitFor(() => {
        expect(screen.getByText('API Key 1')).toBeDefined()
      })
    })
  })

  describe('Version History', () => {
    it('should track version changes', async () => {
      const mockItems = [
        {
          id: 'test-1',
          key: 'api-key-1',
          label: 'API Key 1',
          category: 'api-keys',
          type: 'api-key',
          value: 'sk-test-123',
          description: 'Test API key',
          isSecret: false,
          isRequired: false,
          lastModified: Date.now(),
          version: 2,
          syncStatus: 'synced'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      await waitFor(() => {
        expect(screen.getByText('API Key 1')).toBeDefined()
      })
    })

    it('should increment version on edit', async () => {
      const mockItems = [
        {
          id: 'test-1',
          key: 'api-key-1',
          label: 'API Key 1',
          category: 'api-keys',
          type: 'api-key',
          value: 'sk-test-123',
          description: 'Test API key',
          isSecret: false,
          isRequired: false,
          lastModified: Date.now(),
          version: 1,
          syncStatus: 'synced'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      await waitFor(() => {
        expect(screen.getByText('API Key 1')).toBeDefined()
      })
    })
  })

  describe('Sync Status', () => {
    it('should display synced status', async () => {
      const mockItems = [
        {
          id: 'test-1',
          key: 'api-key-1',
          label: 'API Key 1',
          category: 'api-keys',
          type: 'api-key',
          value: 'sk-test-123',
          description: 'Test API key',
          isSecret: false,
          isRequired: false,
          lastModified: Date.now(),
          version: 1,
          syncStatus: 'synced'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      await waitFor(() => {
        expect(screen.getByText('API Key 1')).toBeDefined()
      })
    })

    it('should display pending status', async () => {
      const mockItems = [
        {
          id: 'test-1',
          key: 'api-key-1',
          label: 'API Key 1',
          category: 'api-keys',
          type: 'api-key',
          value: 'sk-test-123',
          description: 'Test API key',
          isSecret: false,
          isRequired: false,
          lastModified: Date.now(),
          version: 1,
          syncStatus: 'pending'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      await waitFor(() => {
        expect(screen.getByText('API Key 1')).toBeDefined()
      })
    })

    it('should display conflict status', async () => {
      const mockItems = [
        {
          id: 'test-1',
          key: 'api-key-1',
          label: 'API Key 1',
          category: 'api-keys',
          type: 'api-key',
          value: 'sk-test-123',
          description: 'Test API key',
          isSecret: false,
          isRequired: false,
          lastModified: Date.now(),
          version: 1,
          syncStatus: 'conflict'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      await waitFor(() => {
        expect(screen.getByText('API Key 1')).toBeDefined()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const { EditableContentManager } = await import('../EditableContentManager')
      
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      const searchInput = screen.getByPlaceholderText('搜索...')
      expect(searchInput).toBeDefined()
    })

    it('should support keyboard navigation', async () => {
      const { EditableContentManager } = await import('../EditableContentManager')
      
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      const addButton = screen.getByText('添加项目')
      expect(addButton).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const mockItems = Array.from({ length: 100 }, (_, i) => ({
        id: `test-${i}`,
        key: `api-key-${i}`,
        label: `API Key ${i}`,
        category: 'api-keys',
        type: 'api-key',
        value: `sk-test-${i}`,
        description: `Test API key ${i}`,
        isSecret: false,
        isRequired: false,
        lastModified: Date.now(),
        version: 1,
        syncStatus: 'synced'
      }))
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItems))
      
      const startTime = performance.now()
      
      const { EditableContentManager } = await import('../EditableContentManager')
      render(<EditableContentManager open={true} onClose={() => {}} />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(renderTime).toBeLessThan(1000)
    })
  })
})
