import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import { UserInputEventType } from '@metamask/snaps-sdk';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import { type SnapElement, Text } from '@metamask/snaps-sdk/jsx';

import { ConfirmationDialog } from '../../src/core/confirmation';
import { type TimeoutFactory } from '../../src/core/timeoutFactory';
import type { UserEventDispatcher } from '../../src/userEventDispatcher';

describe('ConfirmationDialog', () => {
  let mockSnaps: jest.Mocked<SnapsProvider>;
  let mockUserEventDispatcher: jest.Mocked<UserEventDispatcher>;
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

  const defaultProps = {
    ui: mockUi,
    onBeforeGrant: mockOnBeforeGrant,
  };

  beforeEach(() => {
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

    mockSnaps = {
      request: jest.fn().mockImplementation(async () => Promise.resolve()),
    } as unknown as jest.Mocked<SnapsProvider>;

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

    confirmationDialog = new ConfirmationDialog({
      ...defaultProps,
      snaps: mockSnaps,
      userEventDispatcher: mockUserEventDispatcher,
      isGrantDisabled: false,
      timeoutFactory: mockTimeoutFactory,
    });
  });

  describe('createInterface()', () => {
    it('should create a new interface if one does not exist', async () => {
      mockSnaps.request.mockResolvedValueOnce(mockInterfaceId);

      const result = await confirmationDialog.createInterface();

      expect(result).toBe(mockInterfaceId);
      expect(mockSnaps.request).toHaveBeenCalledWith({
        method: 'snap_createInterface',
        params: {
          context: {},
          ui: expect.any(Object),
        },
      });
    });

    it('should return existing interface id if already created', async () => {
      mockSnaps.request.mockResolvedValueOnce(mockInterfaceId);

      // Create interface first time
      await confirmationDialog.createInterface();
      mockSnaps.request.mockClear();

      // Create interface second time
      const result = await confirmationDialog.createInterface();

      expect(result).toBe(mockInterfaceId);
      expect(mockSnaps.request).not.toHaveBeenCalled();
    });
  });

  describe('displayConfirmationDialogAndAwaitUserDecision()', () => {
    beforeEach(async () => {
      mockSnaps.request.mockResolvedValueOnce(mockInterfaceId);
      await confirmationDialog.createInterface();
      mockSnaps.request.mockClear();
    });

    it('should throw error if interface not created', async () => {
      const newDialog = new ConfirmationDialog({
        ...defaultProps,
        snaps: mockSnaps,
        userEventDispatcher: mockUserEventDispatcher,
        isGrantDisabled: false,
        timeoutFactory: mockTimeoutFactory,
      });

      await expect(
        newDialog.displayConfirmationDialogAndAwaitUserDecision(),
      ).rejects.toThrow(
        'Interface not yet created. Call createInterface() first.',
      );
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
      const grantButtonHandler = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === 'cancel-button',
      )?.[0]?.handler;

      if (grantButtonHandler === undefined) {
        throw new Error('Grant button handler is undefined');
      }

      await grantButtonHandler({
        event: { type: UserInputEventType.ButtonClickEvent },
        interfaceId: mockInterfaceId,
      });

      const result = await awaitingUserDecision;
      expect(result).toStrictEqual({ isConfirmationGranted: false });
    });

    it('should resolve with false when dialog is closed', async () => {
      // Simulate dialog closure
      mockSnaps.request.mockResolvedValueOnce(null);

      const awaitingUserDecision =
        confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();
      expect(mockTimeoutFactory.register).toHaveBeenCalledTimes(1);

      expect(mockUserEventDispatcher.on).toHaveBeenCalledTimes(2);
      expect(mockUnbindFunctions).toHaveLength(2);

      const result = await awaitingUserDecision;

      mockUnbindFunctions.forEach((mockUnbindFn) => {
        expect(mockUnbindFn).toHaveBeenCalledTimes(1);
      });

      expect(result).toStrictEqual({ isConfirmationGranted: false });
      expect(mockCancel).toHaveBeenCalledTimes(1);
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

      expect(mockSnaps.request).toHaveBeenCalledWith({
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

      expect(mockSnaps.request).toHaveBeenCalledWith({
        method: 'snap_resolveInterface',
        params: {
          id: mockInterfaceId,
          value: {},
        },
      });
    });
  });

  describe('closeWithError()', () => {
    it('should clean up, resolve interface, and reject pending decision', async () => {
      mockSnaps.request.mockResolvedValueOnce(mockInterfaceId);
      await confirmationDialog.createInterface();
      mockSnaps.request.mockClear();

      const awaitingUserDecision =
        confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();

      // Handlers registered (grant + cancel)
      expect(mockUserEventDispatcher.on).toHaveBeenCalledTimes(2);

      const reason = new Error('Test failure');
      await confirmationDialog.closeWithError(reason);

      await expect(awaitingUserDecision).rejects.toThrow('Test failure');

      // All listeners unbound
      mockUnbindFunctions.forEach((mockUnbindFn) => {
        expect(mockUnbindFn).toHaveBeenCalledTimes(1);
      });

      // Dialog interface resolved and timeout cancelled
      expect(mockSnaps.request).toHaveBeenCalledWith({
        method: 'snap_resolveInterface',
        params: {
          id: mockInterfaceId,
          value: {},
        },
      });
      expect(mockCancel).toHaveBeenCalledTimes(1);
    });

    it('should be safe to call multiple times', async () => {
      mockSnaps.request.mockResolvedValueOnce(mockInterfaceId);
      await confirmationDialog.createInterface();
      mockSnaps.request.mockClear();

      const awaitingUserDecision =
        confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();

      const reason = new Error('Second failure');
      await confirmationDialog.closeWithError(reason);
      await expect(awaitingUserDecision).rejects.toThrow('Second failure');

      // Calling again should not throw
      const result = await confirmationDialog.closeWithError(reason);

      expect(result).toBeUndefined();
    });
  });

  describe('updateContent()', () => {
    it('should throw error if interface not created', async () => {
      const updatedUi = Text({
        children: 'Updated content',
      }) as unknown as SnapElement;

      await expect(
        confirmationDialog.updateContent({
          ui: updatedUi,
          isGrantDisabled: false,
        }),
      ).rejects.toThrow(
        'Interface not yet created. Call createInterface() first.',
      );
    });

    it('should update interface content', async () => {
      mockSnaps.request.mockResolvedValueOnce(mockInterfaceId);
      await confirmationDialog.createInterface();
      mockSnaps.request.mockClear();

      const updatedUi = Text({
        children: 'Updated content',
      }) as unknown as SnapElement;

      await confirmationDialog.updateContent({
        ui: updatedUi,
        isGrantDisabled: false,
      });

      expect(mockSnaps.request).toHaveBeenCalledWith({
        method: 'snap_updateInterface',
        params: {
          id: mockInterfaceId,
          context: {},
          ui: expect.any(Object),
        },
      });
    });
  });
});
