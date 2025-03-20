import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { UserInputEventType } from '@metamask/snaps-sdk';

import { UserEventDispatcher } from '../src/userEventDispatcher';

describe('UserEventDispatcher', () => {
  let userEventDispatcher: UserEventDispatcher;
  const eventType = UserInputEventType.ButtonClickEvent;
  const createHandlerMock = () => jest.fn<() => void>();
  const interfaceId = '123';

  beforeEach(() => {
    jest.clearAllMocks();
    userEventDispatcher = new UserEventDispatcher();
  });

  describe('on()', () => {
    it('should register an event handler for a specific event type', () => {
      const handler = createHandlerMock();

      const result = userEventDispatcher.on({
        eventType,
        interfaceId,
        handler,
      });

      expect(result).toBe(userEventDispatcher);
    });

    it('should register multiple handlers for the same event type', async () => {
      const handler1 = createHandlerMock();
      const handler2 = createHandlerMock();

      userEventDispatcher.on({
        eventType,
        interfaceId,
        handler: handler1,
      });

      userEventDispatcher.on({
        eventType,
        interfaceId,
        handler: handler2,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
        },
        id: interfaceId,
        context: null,
      });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should not handlers for a different event type', async () => {
      const handlerMatchingEventType = createHandlerMock();
      const handlerMismatchingEventType = createHandlerMock();

      userEventDispatcher.on({
        eventType,
        interfaceId,
        handler: handlerMatchingEventType,
      });

      userEventDispatcher.on({
        eventType: UserInputEventType.FileUploadEvent,
        interfaceId,
        handler: handlerMismatchingEventType,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
        },
        id: interfaceId,
        context: null,
      });

      expect(handlerMatchingEventType).toHaveBeenCalled();
      expect(handlerMismatchingEventType).not.toHaveBeenCalled();
    });

    it('should not handlers for different interface ids', async () => {
      const handler = createHandlerMock();

      userEventDispatcher.on({
        eventType,
        interfaceId: '123',
        handler,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: { type: eventType },
        id: '456',
        context: null,
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should support method chaining', async () => {
      const handler1 = createHandlerMock();
      const handler2 = createHandlerMock();

      const result = userEventDispatcher
        .on({
          eventType,
          interfaceId,
          handler: handler1,
        })
        .on({
          eventType,
          interfaceId,
          handler: handler2,
        });

      expect(result).toBe(userEventDispatcher);

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
        },
        id: interfaceId,
        context: null,
      });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('off()', () => {
    it('should remove a registered event handler', async () => {
      const handler = createHandlerMock();

      userEventDispatcher.on({
        eventType,
        interfaceId,
        handler,
      });

      jest.clearAllMocks();

      const result = userEventDispatcher.off({
        eventType,
        interfaceId,
        handler,
      });

      expect(result).toBe(userEventDispatcher);

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
        },
        id: interfaceId,
        context: null,
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should do nothing when removing an unregistered handler', async () => {
      const registeredHandler = createHandlerMock();
      const unregisteredHandler = createHandlerMock();

      userEventDispatcher.on({
        eventType,
        interfaceId,
        handler: registeredHandler,
      });

      jest.clearAllMocks();

      userEventDispatcher.off({
        eventType,
        interfaceId,
        handler: unregisteredHandler,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
        },
        id: interfaceId,
        context: null,
      });

      expect(registeredHandler).toHaveBeenCalled();
      expect(unregisteredHandler).not.toHaveBeenCalled();
    });

    it('should do nothing when removing a handler for an unregistered event type', async () => {
      const handler = createHandlerMock();

      jest.clearAllMocks();

      userEventDispatcher.off({
        eventType,
        interfaceId,
        handler,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
        },
        id: interfaceId,
        context: null,
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should leave other handlers intact when removing a specific handler', async () => {
      const handler1 = createHandlerMock();
      const handler2 = createHandlerMock();

      userEventDispatcher
        .on({
          eventType,
          interfaceId,
          handler: handler1,
        })
        .on({
          eventType,
          interfaceId,
          handler: handler2,
        });

      jest.clearAllMocks();

      userEventDispatcher.off({
        eventType,
        interfaceId,
        handler: handler1,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
        },
        id: interfaceId,
        context: null,
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });
});
