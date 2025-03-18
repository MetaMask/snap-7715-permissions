import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { UserInputEventType } from '@metamask/snaps-sdk';

import { UserEventDispatcher } from '../src/userEventDispatcher';

describe('UserEventDispatcher', () => {
  let userEventDispatcher: UserEventDispatcher;
  const eventType = UserInputEventType.ButtonClickEvent;
  const createHandlerMock = () => jest.fn<() => void>();

  beforeEach(() => {
    jest.clearAllMocks();
    userEventDispatcher = new UserEventDispatcher();
  });

  describe('on()', () => {
    it('should register an event handler for a specific event type', () => {
      const handler = createHandlerMock();

      const result = userEventDispatcher.on({
        eventType,
        handler,
      });

      expect(result).toBe(userEventDispatcher);
    });

    it('should register multiple handlers for the same event type', async () => {
      const handler1 = createHandlerMock();
      const handler2 = createHandlerMock();

      userEventDispatcher.on({
        eventType,
        handler: handler1,
      });

      userEventDispatcher.on({
        eventType,
        handler: handler2,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
        },
      });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should not handlers for a different event type', async () => {
      const handlerMatchingEventType = createHandlerMock();
      const handlerMismatchingEventType = createHandlerMock();

      userEventDispatcher.on({
        eventType,
        handler: handlerMatchingEventType,
      });

      userEventDispatcher.on({
        eventType: UserInputEventType.FileUploadEvent,
        handler: handlerMismatchingEventType,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
        },
      });

      expect(handlerMatchingEventType).toHaveBeenCalled();
      expect(handlerMismatchingEventType).not.toHaveBeenCalled();
    });

    it('should support method chaining', async () => {
      const handler1 = createHandlerMock();
      const handler2 = createHandlerMock();

      const result = userEventDispatcher
        .on({
          eventType,
          handler: handler1,
        })
        .on({
          eventType,
          handler: handler2,
        });

      expect(result).toBe(userEventDispatcher);

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
        },
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
        handler,
      });

      jest.clearAllMocks();

      const result = userEventDispatcher.off({
        eventType,
        handler,
      });

      expect(result).toBe(userEventDispatcher);

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
        },
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should do nothing when removing an unregistered handler', async () => {
      const registeredHandler = createHandlerMock();
      const unregisteredHandler = createHandlerMock();

      userEventDispatcher.on({
        eventType,
        handler: registeredHandler,
      });

      jest.clearAllMocks();

      userEventDispatcher.off({
        eventType,
        handler: unregisteredHandler,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
        },
      });

      expect(registeredHandler).toHaveBeenCalled();
      expect(unregisteredHandler).not.toHaveBeenCalled();
    });

    it('should do nothing when removing a handler for an unregistered event type', async () => {
      const handler = createHandlerMock();

      jest.clearAllMocks();

      userEventDispatcher.off({
        eventType,
        handler,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
        },
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should leave other handlers intact when removing a specific handler', async () => {
      const handler1 = createHandlerMock();
      const handler2 = createHandlerMock();

      userEventDispatcher
        .on({
          eventType,
          handler: handler1,
        })
        .on({
          eventType,
          handler: handler2,
        });

      jest.clearAllMocks();

      userEventDispatcher.off({
        eventType,
        handler: handler1,
      });

      await userEventDispatcher.handleUserInputEvent({
        event: {
          type: eventType,
        },
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });
});
