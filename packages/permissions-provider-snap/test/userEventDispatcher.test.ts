import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import { UserInputEventType } from '@metamask/snaps-sdk';
import { getAddress } from 'viem';

import type { PermissionTypeMapping } from '../src/orchestrators';
import {
  NativeTokenStreamDialogEventNames,
  type PermissionConfirmationContext,
} from '../src/ui';
import { UserEventDispatcher } from '../src/userEventDispatcher';

describe('UserEventDispatcher', () => {
  let userEventDispatcher: UserEventDispatcher;
  const eventType = UserInputEventType.ButtonClickEvent;
  const eventName = 'buttonClickEvent-name';
  const createHandlerMock = () => jest.fn<() => void>();
  const interfaceId = '123';
  const mockContext: PermissionConfirmationContext<'native-token-stream'> = {
    permission: {
      type: 'native-token-stream',
      data: {
        justification: 'shh...permission 2',
        initialAmount: '0x1',
        amountPerSecond: '0x1',
        startTime: 1000,
        maxAmount: '0x2',
      },
    } as PermissionTypeMapping['native-token-stream'],
    address: getAddress('0x016562aA41A8697720ce0943F003141f5dEAe008'),
    siteOrigin: 'http://localhost:3000',
    balance: '0x1',
    expiry: 1,
    chainId: 11155111,
    valueFormattedAsCurrency: '$1,000.00',
    permissionSpecificRules: {
      maxAllowance: 'Unlimited',
    },
    state: {
      [NativeTokenStreamDialogEventNames.ShowMoreButton]: false,
    },
  };
  const mockSnapProvider = createMockSnapsProvider();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSnapProvider.request.mockReset();
    userEventDispatcher = new UserEventDispatcher(mockSnapProvider);
  });

  describe('on()', () => {
    it('should register an event handler for a specific event type', () => {
      const handler = createHandlerMock();

      const result = userEventDispatcher.on({
        eventName,
        interfaceId,
        handler,
      });

      expect(result).toBe(userEventDispatcher);
    });

    it('should register multiple handlers for the same event type', async () => {
      const handler1 = createHandlerMock();
      const handler2 = createHandlerMock();

      userEventDispatcher.on({
        eventName,
        interfaceId,
        handler: handler1,
      });

      userEventDispatcher.on({
        eventName,
        interfaceId,
        handler: handler2,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: eventName,
        },
        id: interfaceId,
        context: mockContext,
      });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should not handlers for a different event name', async () => {
      const handlerMatchingEventType = createHandlerMock();
      const handlerMismatchingEventType = createHandlerMock();

      userEventDispatcher.on({
        eventName,
        interfaceId,
        handler: handlerMatchingEventType,
      });

      userEventDispatcher.on({
        eventName: 'fileUploadEvent-name',
        interfaceId,
        handler: handlerMismatchingEventType,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: eventName,
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
        eventName,
        interfaceId: '123',
        handler,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: eventName,
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
          eventName,
          interfaceId,
          handler: handler1,
        })
        .on({
          eventName,
          interfaceId,
          handler: handler2,
        });

      expect(result).toBe(userEventDispatcher);

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: eventName,
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
        eventName,
        interfaceId,
        handler,
      });

      jest.clearAllMocks();

      const result = userEventDispatcher.off({
        eventName,
        interfaceId,
        handler,
      });

      expect(result).toBe(userEventDispatcher);

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: eventName,
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
        eventName,
        interfaceId,
        handler: registeredHandler,
      });

      jest.clearAllMocks();

      userEventDispatcher.off({
        eventName: 'unregisteredEvent-name',
        interfaceId,
        handler: unregisteredHandler,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: eventName,
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
        eventName,
        interfaceId,
        handler,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: eventName,
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
          eventName,
          interfaceId,
          handler: handler1,
        })
        .on({
          eventName,
          interfaceId,
          handler: handler2,
        });

      jest.clearAllMocks();

      userEventDispatcher.off({
        eventName,
        interfaceId,
        handler: handler1,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: eventName,
        },
        id: interfaceId,
        context: mockContext,
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('handleUserInputEvent()', () => {
    it('should not process the event if the context is empty', async () => {
      const handler1 = createHandlerMock();
      const handler2 = createHandlerMock();

      userEventDispatcher.on({
        eventName,
        interfaceId,
        handler: handler1,
      });

      userEventDispatcher.on({
        eventName,
        interfaceId,
        handler: handler2,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: eventName,
        },
        id: interfaceId,
        context: null,
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should not process the event if the event name is empty', async () => {
      const handler1 = createHandlerMock();
      const handler2 = createHandlerMock();

      userEventDispatcher.on({
        eventName: '',
        interfaceId,
        handler: handler1,
      });

      userEventDispatcher.on({
        eventName: '',
        interfaceId,
        handler: handler2,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
          name: eventName,
        },
        id: interfaceId,
        context: null,
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });
});
