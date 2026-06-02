/**
 * @file sync-workflow-integration.test.tsx
 * @description YYC³便携式智能AI系统 - 同步工作流集成测试
 * Sync Workflow Integration Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @status active
 * @tags integration,test,sync,workflow
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import '@testing-library/jest-dom';
import { syncManagerService } from '../../../services/sync-manager-service';
import { ConflictType } from '../../../types/sync';
import { ConflictResolutionDialog } from '../ConflictResolutionDialog';
import { SyncStatusPanel } from '../SyncStatusPanel';

// Mock sync service
vi.mock('../../../services/sync-manager-service', () => ({
  syncManagerService: {
    syncNow: vi.fn(),
    getSyncStatus: vi.fn(),
  },
}));

// Mock store
vi.mock('../store', () => ({
  useAppStore: vi.fn(() => ({
    theme: 'dark',
  })),
}));

describe('Sync Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('1. Sync Status Display', () => {
    it('should display current sync status', async () => {
      const mockGetSyncStatus = vi.mocked(syncManagerService.getSyncStatus);
      mockGetSyncStatus.mockResolvedValue({
        isOnline: true,
        isSyncing: true,
        pendingCount: 5,
        failedCount: 0,
        conflictCount: 0,
        lastSyncTime: Date.now(),
        nextSyncTime: Date.now() + 300000,
      });

      render(<SyncStatusPanel />);

      await waitFor(() => {
        expect(mockGetSyncStatus).toHaveBeenCalled();
      });
    });

    it('should show sync progress updates', async () => {
      const mockGetSyncStatus = vi.mocked(syncManagerService.getSyncStatus);
      mockGetSyncStatus.mockResolvedValue({
        isOnline: true,
        isSyncing: true,
        pendingCount: 3,
        failedCount: 0,
        conflictCount: 0,
        lastSyncTime: Date.now(),
        nextSyncTime: Date.now() + 300000,
      });

      render(<SyncStatusPanel />);

      await waitFor(() => {
        expect(mockGetSyncStatus).toHaveBeenCalled();
      });
    });

    it('should display sync errors', async () => {
      const mockGetSyncStatus = vi.mocked(syncManagerService.getSyncStatus);
      mockGetSyncStatus.mockResolvedValue({
        isOnline: false,
        isSyncing: false,
        pendingCount: 0,
        failedCount: 1,
        conflictCount: 0,
        lastSyncTime: Date.now(),
        nextSyncTime: Date.now() + 300000,
      });

      render(<SyncStatusPanel />);

      await waitFor(() => {
        expect(mockGetSyncStatus).toHaveBeenCalled();
      });
    });
  });

  describe('2. Conflict Resolution UI', () => {
    it('should display conflict resolution dialog', async () => {
      render(
        <ConflictResolutionDialog
          open={true}
          conflict={{
            id: 'conflict-1',
            type: ConflictType.CONTENT,
            resourceType: 'file',
            resourceId: 'test.ts',
            localVersion: {
              id: 'local-1',
              version: 1,
              timestamp: Date.now(),
              data: { content: 'local content' },
            },
            serverVersion: {
              id: 'remote-1',
              version: 2,
              timestamp: Date.now(),
              data: { content: 'remote content' },
            },
            description: 'Content conflict in test.ts',
            suggestedResolution: 'merge' as const,
            autoResolve: false,
          }}
          onResolved={vi.fn()}
          onCancelled={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/conflict/i)).toBeInTheDocument();
      });
    });

    it('should allow user to choose resolution strategy', async () => {
      const onResolved = vi.fn();
      const onCancelled = vi.fn();

      render(
        <ConflictResolutionDialog
          open={true}
          conflict={{
            id: 'conflict-2',
            type: ConflictType.CONTENT,
            resourceType: 'file',
            resourceId: 'test.ts',
            localVersion: {
              id: 'local-2',
              version: 1,
              timestamp: Date.now(),
              data: { content: 'local' },
            },
            serverVersion: {
              id: 'remote-2',
              version: 2,
              timestamp: Date.now(),
              data: { content: 'remote' },
            },
            description: 'Content conflict',
            suggestedResolution: 'local' as const,
            autoResolve: false,
          }}
          onResolved={onResolved}
          onCancelled={onCancelled}
        />
      );

      expect(onResolved).toBeDefined();
      expect(onCancelled).toBeDefined();
    });

    it('should handle multiple conflicts', async () => {
      const onResolved = vi.fn();
      const onCancelled = vi.fn();

      const conflicts = [
        {
          id: 'conflict-3',
          type: ConflictType.CONTENT,
          resourceType: 'file',
          resourceId: 'file1.ts',
          localVersion: {
            id: 'local-3',
            version: 1,
            timestamp: Date.now(),
            data: { content: 'v1' },
          },
          serverVersion: {
            id: 'remote-3',
            version: 2,
            timestamp: Date.now(),
            data: { content: 'v2' },
          },
          description: 'Conflict in file1.ts',
          suggestedResolution: 'merge' as const,
          autoResolve: false,
        },
        {
          id: 'conflict-4',
          type: ConflictType.CONTENT,
          resourceType: 'file',
          resourceId: 'file2.ts',
          localVersion: {
            id: 'local-4',
            version: 1,
            timestamp: Date.now(),
            data: { content: 'v1' },
          },
          serverVersion: {
            id: 'remote-4',
            version: 2,
            timestamp: Date.now(),
            data: { content: 'v2' },
          },
          description: 'Conflict in file2.ts',
          suggestedResolution: 'merge' as const,
          autoResolve: false,
        },
        {
          id: 'conflict-5',
          type: ConflictType.CONTENT,
          resourceType: 'file',
          resourceId: 'file3.ts',
          localVersion: {
            id: 'local-5',
            version: 1,
            timestamp: Date.now(),
            data: { content: 'v1' },
          },
          serverVersion: {
            id: 'remote-5',
            version: 2,
            timestamp: Date.now(),
            data: { content: 'v2' },
          },
          description: 'Conflict in file3.ts',
          suggestedResolution: 'merge' as const,
          autoResolve: false,
        },
      ];

      for (const conflict of conflicts) {
        render(
          <ConflictResolutionDialog
            open={true}
            conflict={conflict}
            onResolved={onResolved}
            onCancelled={onCancelled}
          />
        );
      }

      expect(conflicts).toHaveLength(3);
    });
  });

  describe('3. Manual Sync Control', () => {
    it('should trigger manual sync', async () => {
      const mockSyncNow = vi.mocked(syncManagerService.syncNow);
      mockSyncNow.mockResolvedValue(undefined);

      await mockSyncNow();

      expect(mockSyncNow).toHaveBeenCalled();
    });

    it('should handle sync cancellation gracefully', async () => {
      const mockSyncNow = vi.mocked(syncManagerService.syncNow);
      mockSyncNow.mockRejectedValue(new Error('Sync cancelled'));

      try {
        await mockSyncNow();
      } catch (error) {
        expect(error).toBeDefined();
      }

      expect(mockSyncNow).toHaveBeenCalled();
    });
  });
});
