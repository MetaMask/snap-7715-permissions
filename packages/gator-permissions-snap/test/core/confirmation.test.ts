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
  const mockInterfaceId = 'test-interface-id';

  const mockUi = Text({
    children: 'Test Title',
  }) as unknown as SnapElement;

  const defaultProps = {
    ui: mockUi,
  };

  beforeEach(() => {
    mockSnaps = {
      request: jest.fn().mockImplementation(async () => Promise.resolve()),
    } as unknown as jest.Mocked<SnapsProvider>;

    mockUserEventDispatcher = {
      on: jest.fn(),
      off: jest.fn(),
    } as unknown as jest.Mocked<UserEventDispatcher>;

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

    it('should clean up event listeners after decision', async () => {
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

      await awaitingUserDecision;

      expect(mockUserEventDispatcher.off).toHaveBeenCalledTimes(2); // Grant, Cancel
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
