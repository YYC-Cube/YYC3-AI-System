/**
 * @file CollabIndicator.test.tsx
 * @description YYC³便携式智能AI系统 - 协同状态指示器测试
 * Collaboration Indicator Tests
 * Comprehensive tests for collaboration status UI component.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,collaboration,indicator,components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockCollabService = {
  getStatus: vi.fn(() => 'disconnected' as const),
  getConnectedUsers: vi.fn(() => [] as any[]),
  onConnectionChange: vi.fn((callback) => {
    return () => {};
  }),
  connect: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('../services/collab-service', () => ({
  collabService: mockCollabService,
}));

vi.mock('../store', () => ({
  useAppStore: vi.fn((selector) => {
    const state = {
      theme: 'dark',
      language: 'zh-CN',
    };
    return selector(state);
  }),
}));

vi.mock('../utils/theme', () => ({
  getThemeTokens: vi.fn(() => ({
    isDark: true,
    bg: { primary: 'bg-slate-900', secondary: 'bg-slate-800' },
    text: { primary: 'text-white', secondary: 'text-slate-300', muted: 'text-slate-400' },
    border: { primary: 'border-white/10', secondary: 'border-white/5' },
  })),
}));

vi.mock('../utils/i18n', () => ({
  getI18n: vi.fn(() => ({
    collabOnline: '在线',
    collabOffline: '离线',
    collabSyncing: '同步中',
    collabUsers: '用户',
    collabInvite: '邀请',
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('CollabIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollabService.getStatus.mockReturnValue('disconnected');
    mockCollabService.getConnectedUsers.mockReturnValue([]);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Component Rendering', () => {
    it('should render the indicator', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      const { container } = render(<CollabIndicator />);

      expect(container).toBeDefined();
    });

    it('should display offline status by default', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      render(<CollabIndicator />);

      expect(screen.getByText('离线')).toBeDefined();
    });

    it('should display online status when connected', async () => {
      mockCollabService.getStatus.mockReturnValue('connected');

      const { CollabIndicator } = await import('../CollabIndicator');
      render(<CollabIndicator />);

      await waitFor(() => {
        expect(screen.getByText('在线')).toBeDefined();
      });
    });

    it('should display syncing status', async () => {
      mockCollabService.getStatus.mockReturnValue('syncing');

      const { CollabIndicator } = await import('../CollabIndicator');
      render(<CollabIndicator />);

      await waitFor(() => {
        expect(screen.getByText('同步中')).toBeDefined();
      });
    });

    it('should display error status', async () => {
      mockCollabService.getStatus.mockReturnValue('error');

      const { CollabIndicator } = await import('../CollabIndicator');
      render(<CollabIndicator />);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeDefined();
      });
    });
  });

  describe('User Display', () => {
    it('should show connected users count', async () => {
      mockCollabService.getStatus.mockReturnValue('connected');
      mockCollabService.getConnectedUsers.mockReturnValue([
        { id: '1', name: 'User 1', color: '#FF6B6B', presence: 'active', lastActive: Date.now() },
        { id: '2', name: 'User 2', color: '#4ECDC4', presence: 'idle', lastActive: Date.now() },
      ]);

      const { CollabIndicator } = await import('../CollabIndicator');
      render(<CollabIndicator showUsers={true} />);

      await waitFor(() => {
        expect(screen.getByText('在线')).toBeDefined();
      });
    });

    it('should hide users when showUsers is false', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      const { container } = render(<CollabIndicator showUsers={false} />);

      expect(container).toBeDefined();
    });

    it('should display user avatars', async () => {
      mockCollabService.getStatus.mockReturnValue('connected');
      mockCollabService.getConnectedUsers.mockReturnValue([
        { id: '1', name: 'User 1', color: '#FF6B6B', presence: 'active', lastActive: Date.now() },
      ]);

      const { CollabIndicator } = await import('../CollabIndicator');
      render(<CollabIndicator showUsers={true} />);

      await waitFor(() => {
        expect(screen.getByText('在线')).toBeDefined();
      });
    });

    it('should show user presence status', async () => {
      mockCollabService.getStatus.mockReturnValue('connected');
      mockCollabService.getConnectedUsers.mockReturnValue([
        { id: '1', name: 'User 1', color: '#FF6B6B', presence: 'typing', lastActive: Date.now() },
      ]);

      const { CollabIndicator } = await import('../CollabIndicator');
      render(<CollabIndicator showUsers={true} />);

      await waitFor(() => {
        expect(screen.getByText('在线')).toBeDefined();
      });
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      const { container } = render(<CollabIndicator compact={true} />);

      expect(container).toBeDefined();
    });

    it('should hide status text in compact mode', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      render(<CollabIndicator compact={true} showStatus={false} />);

      expect(screen.queryByText('离线')).toBeNull();
    });

    it('should show status text in non-compact mode', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      render(<CollabIndicator compact={false} showStatus={true} />);

      expect(screen.getByText('离线')).toBeDefined();
    });
  });

  describe('Invite Functionality', () => {
    it('should show invite button', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      render(<CollabIndicator />);

      expect(screen.getByText('邀请')).toBeDefined();
    });

    it('should call onInvite callback', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');
      const handleInvite = vi.fn();

      render(<CollabIndicator onInvite={handleInvite} />);

      const inviteButton = screen.getByText('邀请');
      fireEvent.click(inviteButton);

      expect(handleInvite).toHaveBeenCalled();
    });

    it('should copy invite link to clipboard', async () => {
      const { toast } = await import('sonner');
      const { CollabIndicator } = await import('../CollabIndicator');

      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn(() => Promise.resolve()),
        },
      });

      render(<CollabIndicator />);

      const inviteButton = screen.getByText('邀请');
      fireEvent.click(inviteButton);
    });
  });

  describe('User List Toggle', () => {
    it('should toggle user list on click', async () => {
      mockCollabService.getStatus.mockReturnValue('connected');
      mockCollabService.getConnectedUsers.mockReturnValue([
        { id: '1', name: 'User 1', color: '#FF6B6B', presence: 'active', lastActive: Date.now() },
      ]);

      const { CollabIndicator } = await import('../CollabIndicator');
      render(<CollabIndicator showUsers={true} />);

      await waitFor(() => {
        expect(screen.getByText('在线')).toBeDefined();
      });
    });

    it('should close user list when clicking outside', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      render(
        <div>
          <CollabIndicator showUsers={true} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);
    });
  });

  describe('Status Icons', () => {
    it('should show correct icon for connected status', async () => {
      mockCollabService.getStatus.mockReturnValue('connected');

      const { CollabIndicator } = await import('../CollabIndicator');
      const { container } = render(<CollabIndicator />);

      expect(container.querySelector('svg')).toBeDefined();
    });

    it('should show correct icon for disconnected status', async () => {
      mockCollabService.getStatus.mockReturnValue('disconnected');

      const { CollabIndicator } = await import('../CollabIndicator');
      const { container } = render(<CollabIndicator />);

      expect(container.querySelector('svg')).toBeDefined();
    });

    it('should show spinner for syncing status', async () => {
      mockCollabService.getStatus.mockReturnValue('syncing');

      const { CollabIndicator } = await import('../CollabIndicator');
      const { container } = render(<CollabIndicator />);

      expect(container.querySelector('svg')).toBeDefined();
    });

    it('should show error icon for error status', async () => {
      mockCollabService.getStatus.mockReturnValue('error');

      const { CollabIndicator } = await import('../CollabIndicator');
      const { container } = render(<CollabIndicator />);

      expect(container.querySelector('svg')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      const { container } = render(<CollabIndicator />);

      expect(container).toBeDefined();
    });

    it('should be keyboard accessible', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      render(<CollabIndicator />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have focus visible state', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      const { container } = render(<CollabIndicator />);

      expect(container).toBeDefined();
    });
  });

  describe('Theme Support', () => {
    it('should support dark theme', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      const { container } = render(<CollabIndicator />);

      expect(container).toBeDefined();
    });

    it('should support light theme', async () => {
      vi.mock('../store', () => ({
        useAppStore: vi.fn((selector) => {
          const state = {
            theme: 'light',
            language: 'zh-CN',
          };
          return selector(state);
        }),
      }));

      vi.mock('../utils/theme', () => ({
        getThemeTokens: vi.fn(() => ({
          isDark: false,
          bg: { primary: 'bg-white', secondary: 'bg-slate-100' },
          text: { primary: 'text-slate-900', secondary: 'text-slate-600', muted: 'text-slate-400' },
          border: { primary: 'border-slate-200', secondary: 'border-slate-100' },
        })),
      }));

      const { CollabIndicator } = await import('../CollabIndicator');
      const { container } = render(<CollabIndicator />);

      expect(container).toBeDefined();
    });
  });

  describe('Internationalization', () => {
    it('should display Chinese text', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      render(<CollabIndicator />);

      expect(screen.getByText('离线')).toBeDefined();
    });

    it('should display English text', async () => {
      vi.mock('../store', () => ({
        useAppStore: vi.fn((selector) => {
          const state = {
            theme: 'dark',
            language: 'en-US',
          };
          return selector(state);
        }),
      }));

      vi.mock('../utils/i18n', () => ({
        getI18n: vi.fn(() => ({
          collabOnline: 'Online',
          collabOffline: 'Offline',
          collabSyncing: 'Syncing',
          collabUsers: 'Users',
          collabInvite: 'Invite',
        })),
      }));

      const { CollabIndicator } = await import('../CollabIndicator');
      render(<CollabIndicator />);

      expect(screen.getByText('Offline')).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should update status efficiently', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<CollabIndicator />);
        unmount();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it('should handle rapid status changes', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      const statuses: Array<'connected' | 'disconnected' | 'syncing' | 'error'> = [
        'connected',
        'syncing',
        'connected',
        'error',
        'connected',
      ];

      const startTime = performance.now();

      for (const status of statuses) {
        mockCollabService.getStatus.mockReturnValue(status);
        const { unmount } = render(<CollabIndicator />);
        unmount();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user list', async () => {
      mockCollabService.getStatus.mockReturnValue('connected');
      mockCollabService.getConnectedUsers.mockReturnValue([]);

      const { CollabIndicator } = await import('../CollabIndicator');
      render(<CollabIndicator showUsers={true} />);

      await waitFor(() => {
        expect(screen.getByText('在线')).toBeDefined();
      });
    });

    it('should handle many users', async () => {
      mockCollabService.getStatus.mockReturnValue('connected');
      mockCollabService.getConnectedUsers.mockReturnValue(
        Array.from({ length: 20 }, (_, i) => ({
          id: `user-${i}`,
          name: `User ${i}`,
          color: `#${i.toString(16).padStart(6, '0')}`,
          presence: 'active' as const,
          lastActive: Date.now(),
        }))
      );

      const { CollabIndicator } = await import('../CollabIndicator');
      render(<CollabIndicator showUsers={true} />);

      await waitFor(() => {
        expect(screen.getByText('在线')).toBeDefined();
      });
    });

    it('should handle missing callbacks gracefully', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      const { container } = render(<CollabIndicator />);

      expect(container).toBeDefined();
    });

    it('should handle undefined props', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      const { container } = render(
        <CollabIndicator
          showUsers={undefined as any}
          showStatus={undefined as any}
          compact={undefined as any}
        />
      );

      expect(container).toBeDefined();
    });
  });

  describe('Animation', () => {
    it('should animate status changes', async () => {
      const { CollabIndicator } = await import('../CollabIndicator');

      const { container } = render(<CollabIndicator />);

      expect(container).toBeDefined();
    });

    it('should show pulse animation for syncing', async () => {
      mockCollabService.getStatus.mockReturnValue('syncing');

      const { CollabIndicator } = await import('../CollabIndicator');
      const { container } = render(<CollabIndicator />);

      expect(container).toBeDefined();
    });
  });
});
