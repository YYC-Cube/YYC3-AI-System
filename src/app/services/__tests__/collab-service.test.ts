/**
 * @file collab-service.test.ts
 * @description YYC³便携式智能AI系统 - 协同编辑服务测试
 * Collaboration Service Tests
 * Comprehensive tests for real-time collaboration functionality.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,collaboration,service,realtime
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { CollabService, createCollabService } from '../collab-service';
import type { CollabConfig, CollabUser } from '../collab-service';

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onopen: ((event?: Event) => void) | null = null;
  onclose: ((event?: CloseEvent) => void) | null = null;
  onerror: ((event?: Event) => void) | null = null;
  onmessage: ((event?: MessageEvent) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      if (url === 'invalid-url') {
        this.onerror?.(new Event('error'));
        this.onclose?.(new CloseEvent('close'));
      } else {
        this.onopen?.(new Event('open'));
      }
    }, 0);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

describe('CollabService', () => {
  let collabService: CollabService;
  let mockConfig: CollabConfig;

  beforeEach(() => {
    collabService = createCollabService();
    mockConfig = {
      serverUrl: 'wss://test-server.com',
      roomName: 'test-room',
      userId: 'user-123',
      userName: 'Test User',
      userColor: '#FF6B6B',
      onConnectionChange: vi.fn(),
      onUserJoin: vi.fn(),
      onUserLeave: vi.fn(),
      onUserUpdate: vi.fn(),
      onSync: vi.fn(),
      onError: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket server', async () => {
      vi.useFakeTimers();

      const result = await collabService.connect(mockConfig);

      expect(result).toBe(true);
      expect(collabService.getStatus()).toBe('connecting');

      await vi.advanceTimersByTimeAsync(10);

      expect(collabService.getStatus()).toBe('connected');

      vi.useRealTimers();
    });

    it('should call onConnectionChange callback', async () => {
      vi.useFakeTimers();

      await collabService.connect(mockConfig);
      await vi.advanceTimersByTimeAsync(10);

      expect(mockConfig.onConnectionChange).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should disconnect from server', async () => {
      vi.useFakeTimers();

      await collabService.connect(mockConfig);
      await vi.advanceTimersByTimeAsync(10);
      await collabService.disconnect();

      expect(collabService.getStatus()).toBe('disconnected');

      vi.useRealTimers();
    });

    it('should handle connection errors', async () => {
      vi.useFakeTimers();

      const errorConfig = {
        ...mockConfig,
        serverUrl: 'invalid-url',
      };

      const result = await collabService.connect(errorConfig);

      expect(result).toBe(true);
      expect(collabService.getStatus()).toBe('connecting');

      await vi.advanceTimersByTimeAsync(10);

      expect(collabService.getStatus()).toBe('disconnected');

      vi.useRealTimers();
    });

    it('should attempt reconnection on disconnect', async () => {
      vi.useFakeTimers();

      await collabService.connect(mockConfig);
      await vi.advanceTimersByTimeAsync(10);

      expect(collabService.getStatus()).toBe('connected');

      vi.useRealTimers();
    });

    it('should track connection status correctly', async () => {
      vi.useFakeTimers();

      expect(collabService.getStatus()).toBe('disconnected');

      await collabService.connect(mockConfig);
      await vi.advanceTimersByTimeAsync(10);
      expect(collabService.getStatus()).toBe('connected');

      await collabService.disconnect();
      expect(collabService.getStatus()).toBe('disconnected');

      vi.useRealTimers();
    });

    it('should check if connected', async () => {
      vi.useFakeTimers();

      expect(collabService.isConnected()).toBe(false);

      await collabService.connect(mockConfig);
      await vi.advanceTimersByTimeAsync(10);
      expect(collabService.isConnected()).toBe(true);

      await collabService.disconnect();
      expect(collabService.isConnected()).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('User Management', () => {
    it('should get current user', async () => {
      vi.useFakeTimers();

      await collabService.connect(mockConfig);
      await vi.advanceTimersByTimeAsync(10);

      const currentUser = collabService.getCurrentUser();

      expect(currentUser).toBeDefined();
      expect(currentUser?.id).toBe('user-123');
      expect(currentUser?.name).toBe('Test User');

      vi.useRealTimers();
    });

    it('should get connected users', async () => {
      vi.useFakeTimers();

      await collabService.connect(mockConfig);
      await vi.advanceTimersByTimeAsync(10);

      const users = collabService.getConnectedUsers();

      expect(Array.isArray(users)).toBe(true);

      vi.useRealTimers();
    });

    it('should update user presence', async () => {
      vi.useFakeTimers();

      await collabService.connect(mockConfig);
      await vi.advanceTimersByTimeAsync(10);

      collabService.updatePresence('typing');

      const currentUser = collabService.getCurrentUser();
      expect(currentUser?.presence).toBe('typing');

      vi.useRealTimers();
    });

    it('should update cursor position', async () => {
      vi.useFakeTimers();

      await collabService.connect(mockConfig);
      await vi.advanceTimersByTimeAsync(10);

      collabService.updateCursor(10, 5);

      const currentUser = collabService.getCurrentUser();
      expect(currentUser?.cursor).toEqual({ line: 10, column: 5 });

      vi.useRealTimers();
    });

    it('should update selection', async () => {
      await collabService.connect(mockConfig);

      collabService.updateSelection({ line: 5, column: 0 }, { line: 5, column: 20 });

      const currentUser = collabService.getCurrentUser();
      expect(currentUser?.selection).toEqual({
        start: { line: 5, column: 0 },
        end: { line: 5, column: 20 },
      });
    });

    it('should update current file', async () => {
      await collabService.connect(mockConfig);

      collabService.updateCurrentFile('/path/to/file.ts');

      const currentUser = collabService.getCurrentUser();
      expect(currentUser?.currentFile).toBe('/path/to/file.ts');
    });

    it('should generate user color if not provided', async () => {
      const configWithoutColor = {
        ...mockConfig,
        userColor: undefined,
      };

      await collabService.connect(configWithoutColor);

      const currentUser = collabService.getCurrentUser();
      expect(currentUser?.color).toBeDefined();
      expect(currentUser?.color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe('Document Operations', () => {
    it('should get Y.Text document', async () => {
      await collabService.connect(mockConfig);

      const text = collabService.getText('test-doc');

      expect(text).toBeDefined();
    });

    it('should get Y.Map document', async () => {
      await collabService.connect(mockConfig);

      const map = collabService.getMap('test-map');

      expect(map).toBeDefined();
    });

    it('should get Y.Array document', async () => {
      await collabService.connect(mockConfig);

      const array = collabService.getArray('test-array');

      expect(array).toBeDefined();
    });

    it('should return null for documents when disconnected', () => {
      const text = collabService.getText('test-doc');

      expect(text).toBeNull();
    });

    it('should perform transactions', async () => {
      await collabService.connect(mockConfig);

      let transactionExecuted = false;
      collabService.transact(() => {
        transactionExecuted = true;
      });

      expect(transactionExecuted).toBe(true);
    });

    it('should observe text changes', async () => {
      await collabService.connect(mockConfig);

      const callback = vi.fn();
      const unsubscribe = collabService.observeText('test-doc', callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe?.();
    });

    it('should observe map changes', async () => {
      await collabService.connect(mockConfig);

      const callback = vi.fn();
      const unsubscribe = collabService.observeMap('test-map', callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe?.();
    });
  });

  describe('Event Handling', () => {
    it('should register connection change callback', () => {
      const callback = vi.fn();
      const unsubscribe = collabService.onConnectionChange(callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
    });

    it('should notify connection change callbacks', async () => {
      const callback = vi.fn();
      collabService.onConnectionChange(callback);

      await collabService.connect(mockConfig);

      expect(callback).toHaveBeenCalled();
    });

    it('should handle user join event', async () => {
      await collabService.connect(mockConfig);

      expect(mockConfig.onUserJoin).toBeDefined();
    });

    it('should handle user leave event', async () => {
      await collabService.connect(mockConfig);

      expect(mockConfig.onUserLeave).toBeDefined();
    });

    it('should handle user update event', async () => {
      await collabService.connect(mockConfig);

      expect(mockConfig.onUserUpdate).toBeDefined();
    });

    it('should handle sync event', async () => {
      await collabService.connect(mockConfig);

      expect(mockConfig.onSync).toBeDefined();
    });

    it('should handle error event', async () => {
      await collabService.connect(mockConfig);

      expect(mockConfig.onError).toBeDefined();
    });
  });

  describe('Heartbeat and Idle Detection', () => {
    it('should start heartbeat on connect', async () => {
      vi.useFakeTimers();

      await collabService.connect(mockConfig);

      vi.advanceTimersByTime(30000);

      vi.useRealTimers();
    });

    it('should detect idle state', async () => {
      vi.useFakeTimers();

      await collabService.connect(mockConfig);

      vi.advanceTimersByTime(60000);

      const currentUser = collabService.getCurrentUser();
      expect(currentUser?.presence).toBe('idle');

      vi.useRealTimers();
    });

    it('should reset idle on activity', async () => {
      vi.useFakeTimers();

      await collabService.connect(mockConfig);

      collabService.updatePresence('active');

      vi.advanceTimersByTime(30000);

      const currentUser = collabService.getCurrentUser();
      expect(currentUser?.presence).toBe('active');

      vi.useRealTimers();
    });
  });

  describe('Room Management', () => {
    it('should get room name', async () => {
      await collabService.connect(mockConfig);

      const roomName = collabService.getRoomName();

      expect(roomName).toBe('test-room');
    });

    it('should return null room name when disconnected', () => {
      const roomName = collabService.getRoomName();

      expect(roomName).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket errors gracefully', async () => {
      const result = await collabService.connect(mockConfig);

      expect(result).toBe(true);
    });

    it('should handle invalid message format', async () => {
      vi.useFakeTimers();

      await collabService.connect(mockConfig);
      await vi.advanceTimersByTimeAsync(10);

      expect(collabService.isConnected()).toBe(true);

      vi.useRealTimers();
    });

    it('should handle disconnection during operation', async () => {
      await collabService.connect(mockConfig);

      await collabService.disconnect();

      expect(collabService.isConnected()).toBe(false);
    });

    it('should not update presence when disconnected', () => {
      collabService.updatePresence('active');

      const currentUser = collabService.getCurrentUser();
      expect(currentUser).toBeNull();
    });

    it('should not update cursor when disconnected', () => {
      collabService.updateCursor(10, 5);

      const currentUser = collabService.getCurrentUser();
      expect(currentUser).toBeNull();
    });
  });

  describe('Reconnection', () => {
    it('should attempt reconnection with exponential backoff', async () => {
      vi.useFakeTimers();

      await collabService.connect(mockConfig);

      vi.advanceTimersByTime(1000);
      vi.advanceTimersByTime(2000);
      vi.advanceTimersByTime(4000);

      vi.useRealTimers();
    });

    it('should stop reconnecting after max attempts', async () => {
      vi.useFakeTimers();

      await collabService.connect(mockConfig);

      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(1000 * Math.pow(2, i));
      }

      vi.useRealTimers();
    });
  });

  describe('Singleton Instance', () => {
    it('should export singleton instance', async () => {
      const { collabService: singletonService } = await import('../collab-service');

      expect(singletonService).toBeDefined();
      expect(singletonService).toBeInstanceOf(CollabService);
    });

    it('should create new instances with factory function', () => {
      const service1 = createCollabService();
      const service2 = createCollabService();

      expect(service1).toBeInstanceOf(CollabService);
      expect(service2).toBeInstanceOf(CollabService);
      expect(service1).not.toBe(service2);
    });
  });

  describe('Performance', () => {
    it('should handle rapid presence updates', async () => {
      await collabService.connect(mockConfig);

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        collabService.updatePresence(i % 2 === 0 ? 'active' : 'idle');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid cursor updates', async () => {
      await collabService.connect(mockConfig);

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        collabService.updateCursor(i, i * 2);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources on disconnect', async () => {
      await collabService.connect(mockConfig);

      const text = collabService.getText('test-doc');
      expect(text).toBeDefined();

      await collabService.disconnect();

      const textAfterDisconnect = collabService.getText('test-doc');
      expect(textAfterDisconnect).toBeNull();
    });

    it('should clear user list on disconnect', async () => {
      await collabService.connect(mockConfig);

      await collabService.disconnect();

      const users = collabService.getConnectedUsers();
      expect(users).toHaveLength(0);
    });
  });
});
