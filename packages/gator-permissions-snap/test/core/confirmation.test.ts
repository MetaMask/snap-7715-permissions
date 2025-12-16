import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import { UserInputEventType } from '@metamask/snaps-sdk';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import { type SnapElement, Text } from '@metamask/snaps-sdk/jsx';

import { ConfirmationDialog } from '../../src/core/confirmation';
import type { UserEventDispatcher } from '../../src/userEventDispatcher';

describe('ConfirmationDialog', () => {
  let mockSnaps: jest.Mocked<SnapsProvider>;
  let mockUserEventDispatcher: jest.Mocked<UserEventDispatcher>;
  let confirmationDialog: ConfirmationDialog;
  let mockUnbindFunctions: jest.MockedFunction<() => void>[];
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

    it('should update interface and return existing id if already created', async () => {
      mockSnaps.request.mockResolvedValueOnce(mockInterfaceId);

      // Create interface first time
      await confirmationDialog.createInterface();
      mockSnaps.request.mockClear();

      // Create interface second time - should update existing interface
      const result = await confirmationDialog.createInterface();

      expect(result).toBe(mockInterfaceId);
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
    });

    it('should resolve with false when cancel button clicked', async () => {
      const awaitingUserDecision =
        confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();
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

      expect(mockUserEventDispatcher.on).toHaveBeenCalledTimes(2);
      expect(mockUnbindFunctions).toHaveLength(2);

      const result = await awaitingUserDecision;

      mockUnbindFunctions.forEach((mockUnbindFn) => {
        expect(mockUnbindFn).toHaveBeenCalledTimes(1);
      });

      expect(result).toStrictEqual({ isConfirmationGranted: false });
    });

    it('should clean up event listeners after decision', async () => {
      const awaitingUserDecision =
        confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();
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
