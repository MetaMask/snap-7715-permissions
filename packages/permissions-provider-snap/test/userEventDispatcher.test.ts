import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import { UserInputEventType } from '@metamask/snaps-sdk';
import { getAddress } from 'viem';

import {
  NativeTokenStreamDialogElementNames,
  TimePeriod,
  type PermissionConfirmationContext,
} from '../src/ui';
import { UserEventDispatcher } from '../src/userEventDispatcher';

describe('UserEventDispatcher', () => {
  let userEventDispatcher: UserEventDispatcher;
  const eventType = UserInputEventType.ButtonClickEvent;
  const elementName = 'buttonClickEvent-name';
  const createHandlerMock = () => jest.fn<() => void>();
  const interfaceId = '123';
  const mockContext: PermissionConfirmationContext<'native-token-stream'> = {
    permissionType: 'native-token-stream',
    justification: 'shh...permission 2',
    address: getAddress('0x016562aA41A8697720ce0943F003141f5dEAe008'),
    siteOrigin: 'http://localhost:3000',
    balance: '0x1',
    expiry: 1,
    chainId: 11155111,
    valueFormattedAsCurrency: '$1,000.00',
    state: {
      [NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded]:
        false,
      [NativeTokenStreamDialogElementNames.MaxAmountInput]: '0x2',
      [NativeTokenStreamDialogElementNames.PeriodInput]: TimePeriod.WEEKLY,
      [NativeTokenStreamDialogElementNames.MaxAllowanceRule]: 'Unlimited',
      [NativeTokenStreamDialogElementNames.InitialAmountRule]: '0x1',
      [NativeTokenStreamDialogElementNames.StartTimeRule]: 1234,
      [NativeTokenStreamDialogElementNames.ExpiryRule]: 1,
      [NativeTokenStreamDialogElementNames.AddMoreRulesToggle]: false,
    },
  };
  const mockSnapsProvider = createMockSnapsProvider();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSnapsProvider.request.mockReset();
    userEventDispatcher = new UserEventDispatcher(mockSnapsProvider);
  });

  describe('on()', () => {
    it('should register an event handler for a specific event type', () => {
      const handler = createHandlerMock();

      const result = userEventDispatcher.on({
        elementName,
        eventType,
        interfaceId,
        handler,
      });

      expect(result).toBe(userEventDispatcher);
    });

    it('should not handlers for a different event name', async () => {
      const handlerMatchingEventType = createHandlerMock();
      const handlerMismatchingEventType = createHandlerMock();

      userEventDispatcher.on({
        elementName,
        eventType,
        interfaceId,
        handler: handlerMatchingEventType,
      });

      userEventDispatcher.on({
        elementName: 'fileUploadEvent-name',
        eventType,
        interfaceId,
        handler: handlerMismatchingEventType,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: interfaceId,
        context: mockContext,
      });

      expect(handlerMatchingEventType).toHaveBeenCalled();
      expect(handlerMismatchingEventType).not.toHaveBeenCalled();
    });

    it('should not handlers for different interface ids', async () => {
      const handler = createHandlerMock();

      userEventDispatcher.on({
        elementName,
        eventType,
        interfaceId: '123',
        handler,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: '456',
        context: mockContext,
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should support method chaining', async () => {
      const handler1 = createHandlerMock();
      const handler2 = createHandlerMock();

      const result = userEventDispatcher
        .on({
          elementName,
          eventType,
          interfaceId,
          handler: handler1,
        })
        .on({
          elementName,
          eventType,
          interfaceId,
          handler: handler2,
        });

      expect(result).toBe(userEventDispatcher);

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: interfaceId,
        context: mockContext,
      });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('off()', () => {
    it('should remove a registered event handler', async () => {
      const handler = createHandlerMock();

      userEventDispatcher.on({
        elementName,
        eventType,
        interfaceId,
        handler,
      });

      jest.clearAllMocks();

      const result = userEventDispatcher.off({
        elementName,
        eventType,
        interfaceId,
        handler,
      });

      expect(result).toBe(userEventDispatcher);

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: interfaceId,
        context: mockContext,
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should do nothing when removing an unregistered handler', async () => {
      const registeredHandler = createHandlerMock();
      const unregisteredHandler = createHandlerMock();

      userEventDispatcher.on({
        elementName,
        eventType,
        interfaceId,
        handler: registeredHandler,
      });

      jest.clearAllMocks();

      userEventDispatcher.off({
        elementName: 'unregisteredEvent-name',
        eventType,
        interfaceId,
        handler: unregisteredHandler,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: interfaceId,
        context: mockContext,
      });

      expect(registeredHandler).toHaveBeenCalled();
      expect(unregisteredHandler).not.toHaveBeenCalled();
    });

    it('should do nothing when removing a handler for an unregistered event type', async () => {
      const handler = createHandlerMock();

      jest.clearAllMocks();

      userEventDispatcher.off({
        elementName,
        eventType,
        interfaceId,
        handler,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: interfaceId,
        context: mockContext,
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should leave other handlers intact when removing a specific handler', async () => {
      const handler1 = createHandlerMock();
      const handler2 = createHandlerMock();

      userEventDispatcher
        .on({
          elementName,
          eventType,
          interfaceId,
          handler: handler1,
        })
        .on({
          elementName,
          eventType,
          interfaceId,
          handler: handler2,
        });

      jest.clearAllMocks();

      userEventDispatcher.off({
        elementName,
        eventType,
        interfaceId,
        handler: handler1,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: interfaceId,
        context: mockContext,
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });
});
