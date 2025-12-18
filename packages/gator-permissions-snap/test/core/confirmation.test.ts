import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import { UserInputEventType } from '@metamask/snaps-sdk';
import { type SnapElement, Text } from '@metamask/snaps-sdk/jsx';

import { ConfirmationDialog } from '../../src/core/confirmation';
import { DialogInterface } from '../../src/core/dialogInterface';
import { type TimeoutFactory } from '../../src/core/timeoutFactory';
import type { UserEventDispatcher } from '../../src/userEventDispatcher';

describe('ConfirmationDialog', () => {
  const mockSnapsProvider = createMockSnapsProvider();
  let mockUserEventDispatcher: jest.Mocked<UserEventDispatcher>;
  let dialogInterface: DialogInterface;
  let confirmationDialog: ConfirmationDialog;
  let mockUnbindFunctions: jest.MockedFunction<() => void>[];
  let mockTimeoutFactory: jest.Mocked<TimeoutFactory>;
  let mockCancel: jest.MockedFunction<() => void>;
  let triggerTimeout: (() => void | Promise<void>) | undefined;
  const mockInterfaceId = 'test-interface-id';

  const mockUi = Text({
    children: 'Test Title',
  }) as unknown as SnapElement;

  const mockOnBeforeGrant = jest.fn<() => Promise<boolean>>();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSnapsProvider.request.mockReset();

    // Reset the array of mock unbind functions for each test
    mockUnbindFunctions = [];
    mockCancel = jest.fn();
    const registerImpl: TimeoutFactory['register'] = (({ onTimeout }) => {
      // Do not auto-invoke onTimeout by default; tests control when it fires
      triggerTimeout = onTimeout;
      return { cancel: mockCancel };
    }) as TimeoutFactory['register'];
    mockTimeoutFactory = {
      register: jest.fn(registerImpl) as jest.MockedFunction<
        TimeoutFactory['register']
      >,
    } as unknown as jest.Mocked<TimeoutFactory>;

    mockUserEventDispatcher = {
      on: jest.fn().mockImplementation(() => {
        // Create a new mock unbind function for each call to on()
        const mockUnbind = jest.fn<() => void>();
        mockUnbindFunctions.push(mockUnbind);
        return { unbind: mockUnbind, dispatcher: mockUserEventDispatcher };
      }),
      off: jest.fn(),
    } as unknown as jest.Mocked<UserEventDispatcher>;

    // Reset and configure mock to return true by default (validation passes)
    mockOnBeforeGrant.mockClear();
    mockOnBeforeGrant.mockResolvedValue(true);

    dialogInterface = new DialogInterface(mockSnapsProvider);

    confirmationDialog = new ConfirmationDialog({
      dialogInterface,
      ui: mockUi,
      userEventDispatcher: mockUserEventDispatcher,
      onBeforeGrant: mockOnBeforeGrant,
      timeoutFactory: mockTimeoutFactory,
    });
  });

  describe('initialize()', () => {
    it('should use DialogInterface to show content', async () => {
      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          return new Promise(() => {
            // Dialog stays open
          });
        }
        return null;
      });

      const result = await confirmationDialog.initialize();

      expect(result).toBe(mockInterfaceId);
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_createInterface',
        params: {
          context: {},
          ui: expect.any(Object),
        },
      });
    });

    it('should update interface on subsequent initialize calls', async () => {
      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          return new Promise(() => {
            // Dialog stays open
          });
        }
        if (params.method === 'snap_updateInterface') {
          return null;
        }
        return null;
      });

      // Initialize first time
      await confirmationDialog.initialize();

      // Initialize second time - should update existing interface
      const result = await confirmationDialog.initialize();

      expect(result).toBe(mockInterfaceId);
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_updateInterface',
        params: {
          id: mockInterfaceId,
          context: {},
          ui: expect.any(Object),
        },
      });
    });
  });

  describe('displayConfirmationDialogAndAwaitUserDecision()', () => {
    beforeEach(async () => {
      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          return new Promise(() => {
            // Dialog stays open
          });
        }
        if (params.method === 'snap_resolveInterface') {
          return null;
        }
        return null;
      });
      await confirmationDialog.initialize();
    });

    it('should throw error if interface not initialized', async () => {
      const newDialogInterface = new DialogInterface(mockSnapsProvider);
      const newDialog = new ConfirmationDialog({
        dialogInterface: newDialogInterface,
        ui: mockUi,
        userEventDispatcher: mockUserEventDispatcher,
        onBeforeGrant: mockOnBeforeGrant,
        timeoutFactory: mockTimeoutFactory,
      });

      await expect(
        newDialog.displayConfirmationDialogAndAwaitUserDecision(),
      ).rejects.toThrow('Interface not yet created. Call initialize() first.');
    });

    it('should resolve with true when grant button clicked', async () => {
      const awaitingUserDecision =
        confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();
      expect(mockTimeoutFactory.register).toHaveBeenCalledTimes(1);

      const grantButtonHandler = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === 'grant-button',
      )?.[0]?.handler;

      if (grantButtonHandler === undefined) {
        throw new Error('Grant button handler is undefined');
      }

      await grantButtonHandler({
        event: { type: UserInputEventType.ButtonClickEvent },
        interfaceId: mockInterfaceId,
      });

      const result = await awaitingUserDecision;
      expect(result).toStrictEqual({ isConfirmationGranted: true });
      expect(mockCancel).toHaveBeenCalledTimes(1);
    });

    it('should resolve with false when cancel button clicked', async () => {
      const awaitingUserDecision =
        confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();
      expect(mockTimeoutFactory.register).toHaveBeenCalledTimes(1);
      const cancelButtonHandler = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === 'cancel-button',
      )?.[0]?.handler;

      if (cancelButtonHandler === undefined) {
        throw new Error('Cancel button handler is undefined');
      }

      await cancelButtonHandler({
        event: { type: UserInputEventType.ButtonClickEvent },
        interfaceId: mockInterfaceId,
      });

      const result = await awaitingUserDecision;
      expect(result).toStrictEqual({ isConfirmationGranted: false });
    });

    it('should clean up event listeners after decision', async () => {
      const awaitingUserDecision =
        confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();
      expect(mockTimeoutFactory.register).toHaveBeenCalledTimes(1);
      const grantButtonHandler = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === 'grant-button',
      )?.[0]?.handler;

      if (grantButtonHandler === undefined) {
        throw new Error('Grant button handler is undefined');
      }

      // Verify that event handlers were registered (should be 2: grant and cancel buttons)
      expect(mockUserEventDispatcher.on).toHaveBeenCalledTimes(2);
      expect(mockUnbindFunctions).toHaveLength(2);

      await grantButtonHandler({
        event: { type: UserInputEventType.ButtonClickEvent },
        interfaceId: mockInterfaceId,
      });

      await awaitingUserDecision;

      // Verify that all unbind functions were called to clean up event listeners
      mockUnbindFunctions.forEach((mockUnbindFn) => {
        expect(mockUnbindFn).toHaveBeenCalledTimes(1);
      });

      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_resolveInterface',
        params: {
          id: mockInterfaceId,
          value: {},
        },
      });
      expect(mockCancel).toHaveBeenCalledTimes(1);
    });

    it('should reject with timeout error when no user action occurs', async () => {
      const awaitingUserDecision =
        confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();

      await triggerTimeout?.();

      await expect(awaitingUserDecision).rejects.toThrow(
        'Timeout waiting for user decision',
      );

      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_resolveInterface',
        params: {
          id: mockInterfaceId,
          value: {},
        },
      });
    });

    it('should ignore cancel click after timeout has fired', async () => {
      const awaitingUserDecision =
        confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();
      expect(mockTimeoutFactory.register).toHaveBeenCalledTimes(1);

      const cancelButtonHandler = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === 'cancel-button',
      )?.[0]?.handler;

      if (cancelButtonHandler === undefined) {
        throw new Error('Cancel button handler is undefined');
      }

      // Fire timeout first
      await triggerTimeout?.();

      // Then simulate cancel click after timeout
      await cancelButtonHandler({
        event: { type: UserInputEventType.ButtonClickEvent },
        interfaceId: mockInterfaceId,
      });

      await expect(awaitingUserDecision).rejects.toThrow(
        'Timeout waiting for user decision',
      );

      // Listeners unbound once by timeout cleanup
      mockUnbindFunctions.forEach((mockUnbindFn) => {
        expect(mockUnbindFn).toHaveBeenCalledTimes(1);
      });

      expect(mockCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateContent()', () => {
    it('should use DialogInterface to update content', async () => {
      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          return new Promise(() => {
            // Dialog stays open
          });
        }
        if (params.method === 'snap_updateInterface') {
          return null;
        }
        return null;
      });

      await confirmationDialog.initialize();

      const updatedUi = Text({
        children: 'Updated content',
      }) as unknown as SnapElement;

      await confirmationDialog.updateContent({
        ui: updatedUi,
        isGrantDisabled: false,
      });

      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_updateInterface',
        params: {
          id: mockInterfaceId,
          context: {},
          ui: expect.any(Object),
        },
      });
    });
  });

  describe('closeWithError()', () => {
    it('should close dialog and reject pending decision', async () => {
      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          return new Promise(() => {
            // Dialog stays open
          });
        }
        if (params.method === 'snap_resolveInterface') {
          return null;
        }
        return null;
      });

      await confirmationDialog.initialize();

      const decisionPromise =
        confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();

      const error = new Error('Test error');
      await confirmationDialog.closeWithError(error);

      await expect(decisionPromise).rejects.toThrow('Test error');

      // All listeners unbound
      mockUnbindFunctions.forEach((mockUnbindFn) => {
        expect(mockUnbindFn).toHaveBeenCalledTimes(1);
      });

      // Dialog interface resolved and timeout cancelled
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_resolveInterface',
        params: {
          id: mockInterfaceId,
          value: {},
        },
      });
      expect(mockCancel).toHaveBeenCalledTimes(1);
    });

    it('should be safe to call multiple times', async () => {
      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          return new Promise(() => {
            // Dialog stays open
          });
        }
        if (params.method === 'snap_resolveInterface') {
          return null;
        }
        return null;
      });

      await confirmationDialog.initialize();

      const decisionPromise =
        confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();

      const error = new Error('Test error');
      await confirmationDialog.closeWithError(error);
      await expect(decisionPromise).rejects.toThrow('Test error');

      // Calling again should not throw
      await confirmationDialog.closeWithError(error);

      // Verify resolveInterface was called (at least once)
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_resolveInterface',
        params: {
          id: mockInterfaceId,
          value: {},
        },
      });
    });
  });
});
