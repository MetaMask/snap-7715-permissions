import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import { UserInputEventType } from '@metamask/snaps-sdk';

import { DialogInterface } from '../../src/core/dialogInterface';
import { PermissionIntroductionService } from '../../src/core/permissionIntroduction';
import type { StateManager } from '../../src/stateManagement';
import { UserEventDispatcher } from '../../src/userEventDispatcher';

describe('PermissionIntroductionService', () => {
  const mockSnapsProvider = createMockSnapsProvider();
  let mockStateManager: jest.Mocked<StateManager>;
  let userEventDispatcher: UserEventDispatcher;
  let service: PermissionIntroductionService;
  let dialogInterface: DialogInterface;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSnapsProvider.request.mockReset();

    mockStateManager = {
      getState: jest.fn(),
      setState: jest.fn(),
    };

    userEventDispatcher = new UserEventDispatcher();

    service = new PermissionIntroductionService({
      stateManager: mockStateManager,
      userEventDispatcher,
    });

    dialogInterface = new DialogInterface(mockSnapsProvider);
  });

  describe('shouldShowIntroduction', () => {
    it('should return true when permission type has not been seen', async () => {
      mockStateManager.getState.mockResolvedValue({
        profileSyncAuthenticationSession: null,
        profileSyncUserStorageKey: null,
        seenPermissionIntroductions: [],
      });

      const result = await service.shouldShowIntroduction(
        'erc20-token-periodic',
      );

      expect(result).toBe(true);
      expect(mockStateManager.getState).toHaveBeenCalled();
    });

    it('should return false when permission type has already been seen', async () => {
      mockStateManager.getState.mockResolvedValue({
        profileSyncAuthenticationSession: null,
        profileSyncUserStorageKey: null,
        seenPermissionIntroductions: ['erc20-token-periodic'],
      });

      const result = await service.shouldShowIntroduction(
        'erc20-token-periodic',
      );

      expect(result).toBe(false);
    });

    it('should return true for unseen permission type when other types have been seen', async () => {
      mockStateManager.getState.mockResolvedValue({
        profileSyncAuthenticationSession: null,
        profileSyncUserStorageKey: null,
        seenPermissionIntroductions: ['erc20-token-stream'],
      });

      const result = await service.shouldShowIntroduction(
        'erc20-token-periodic',
      );

      expect(result).toBe(true);
    });
  });

  describe('markIntroductionAsSeen', () => {
    it('should add permission type to seen introductions', async () => {
      mockStateManager.getState.mockResolvedValue({
        profileSyncAuthenticationSession: null,
        profileSyncUserStorageKey: null,
        seenPermissionIntroductions: [],
      });
      mockStateManager.setState.mockResolvedValue(undefined);

      await service.markIntroductionAsSeen('erc20-token-periodic');

      expect(mockStateManager.setState).toHaveBeenCalledWith({
        profileSyncAuthenticationSession: null,
        profileSyncUserStorageKey: null,
        seenPermissionIntroductions: ['erc20-token-periodic'],
      });
    });

    it('should not duplicate permission type if already seen', async () => {
      mockStateManager.getState.mockResolvedValue({
        profileSyncAuthenticationSession: null,
        profileSyncUserStorageKey: null,
        seenPermissionIntroductions: ['erc20-token-periodic'],
      });

      await service.markIntroductionAsSeen('erc20-token-periodic');

      expect(mockStateManager.setState).not.toHaveBeenCalled();
    });

    it('should preserve existing seen introductions when adding new one', async () => {
      mockStateManager.getState.mockResolvedValue({
        profileSyncAuthenticationSession: null,
        profileSyncUserStorageKey: null,
        seenPermissionIntroductions: ['erc20-token-stream'],
      });
      mockStateManager.setState.mockResolvedValue(undefined);

      await service.markIntroductionAsSeen('erc20-token-periodic');

      expect(mockStateManager.setState).toHaveBeenCalledWith({
        profileSyncAuthenticationSession: null,
        profileSyncUserStorageKey: null,
        seenPermissionIntroductions: [
          'erc20-token-stream',
          'erc20-token-periodic',
        ],
      });
    });
  });

  describe('showIntroduction', () => {
    const mockInterfaceId = 'intro-interface-123';

    it('should return wasCancelled false for unknown permission types', async () => {
      const result = await service.showIntroduction(
        dialogInterface,
        'unknown-permission-type',
      );

      expect(result).toStrictEqual({
        wasCancelled: false,
      });
      expect(mockSnapsProvider.request).not.toHaveBeenCalled();
    });

    it('should use DialogInterface to show content and return success on confirmation', async () => {
      // Mock snap_createInterface, snap_dialog
      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          // Simulate dialog being shown - we'll resolve via button click
          return new Promise(() => {
            // Promise never resolves - button handler will resolve first
          });
        }
        return null;
      });

      // Start showIntroduction (will wait for user interaction)
      const showPromise = service.showIntroduction(
        dialogInterface,
        'erc20-token-periodic',
      );

      // Wait for interface to be created
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate user clicking the confirm button
      const handleEvent = userEventDispatcher.createUserInputEventHandler();
      await handleEvent({
        event: {
          type: UserInputEventType.ButtonClickEvent,
          name: 'permission-introduction-confirm',
        },
        id: mockInterfaceId,
      });

      const result = await showPromise;

      expect(result).toStrictEqual({
        wasCancelled: false,
      });
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_createInterface',
        params: {
          ui: expect.any(Object),
          context: {},
        },
      });
    });

    it('should return wasCancelled true when dialog is dismissed', async () => {
      // Mock snap_createInterface and snap_dialog (returns null when dismissed)
      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          // Simulate dialog being dismissed (returns null)
          return null;
        }
        return null;
      });

      const result = await service.showIntroduction(
        dialogInterface,
        'erc20-token-periodic',
      );

      expect(result).toStrictEqual({
        wasCancelled: true,
      });
    });

    it('should return wasCancelled true when dialog throws error', async () => {
      // Mock snap_createInterface and snap_dialog (dialog throws error)
      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          throw new Error('Dialog error');
        }
        return null;
      });

      const result = await service.showIntroduction(
        dialogInterface,
        'erc20-token-periodic',
      );

      expect(result).toStrictEqual({
        wasCancelled: true,
      });
    });
  });

  describe('buildIntroductionContent', () => {
    it('should build introduction content for page 1', () => {
      const config = {
        page1: {
          headerImageSvg: 'base64-image-1',
          title: 'Page 1 Title',
          bulletPoints: [
            { icon: 'info' as const, title: 'Point 1', description: 'Desc 1' },
          ],
        },
        page2: {
          headerImageSvg: 'base64-image-2',
          title: 'Page 2 Title',
          bulletPoints: [
            { icon: 'edit' as const, title: 'Point 2', description: 'Desc 2' },
          ],
        },
      };

      const result = service.buildIntroductionContent(config, 1);

      expect(result).toBeDefined();
      expect(result.type).toBe('Container');
    });

    it('should build introduction content for page 2', () => {
      const config = {
        page1: {
          headerImageSvg: 'base64-image-1',
          title: 'Page 1 Title',
          bulletPoints: [
            { icon: 'info' as const, title: 'Point 1', description: 'Desc 1' },
          ],
        },
        page2: {
          headerImageSvg: 'base64-image-2',
          title: 'Page 2 Title',
          bulletPoints: [
            { icon: 'edit' as const, title: 'Point 2', description: 'Desc 2' },
          ],
        },
      };

      const result = service.buildIntroductionContent(config, 2);

      expect(result).toBeDefined();
      expect(result.type).toBe('Container');
    });
  });
});
