import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { UserInputEventType } from '@metamask/snaps-sdk';

import { UserEventDispatcher } from '../src/userEventDispatcher';

describe('UserEventDispatcher', () => {
  let userEventDispatcher: UserEventDispatcher;
  const eventType = UserInputEventType.ButtonClickEvent;
  const elementName = 'test-button';
  const createHandlerMock = () => jest.fn<() => void>();
  const createAsyncHandlerMock = () => jest.fn<() => Promise<void>>();
  const interfaceId = '123';

  beforeEach(() => {
    jest.clearAllMocks();
    userEventDispatcher = new UserEventDispatcher();
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

    it('should call the handler when the event is triggered', async () => {
      const handler = createHandlerMock();
      const handleEvent = userEventDispatcher.createUserInputEventHandler();

      userEventDispatcher.on({ elementName, eventType, interfaceId, handler });

      await handleEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: interfaceId,
      });

      expect(handler).toHaveBeenCalled();
    });

    it('should call the async handler when the event is triggered', async () => {
      const handler = createAsyncHandlerMock();
      const handleEvent = userEventDispatcher.createUserInputEventHandler();

      userEventDispatcher.on({ elementName, eventType, interfaceId, handler });

      await handleEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: interfaceId,
      });

      expect(handler).toHaveBeenCalled();
    });

    it('should await async handlers before resolving', async () => {
      const handler = createAsyncHandlerMock();
      const handleEvent = userEventDispatcher.createUserInputEventHandler();

      userEventDispatcher.on({ elementName, eventType, interfaceId, handler });

      const eventHandledMock = jest.fn();
      await handleEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: interfaceId,
      }).then(eventHandledMock);

      expect(eventHandledMock).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();

      expect(eventHandledMock.mock.invocationCallOrder[0]).toBeGreaterThan(
        handler.mock.invocationCallOrder[0] ?? 0,
      );
    });

    it('should support multiple handlers for the same event type and interface', async () => {
      const handler1 = createHandlerMock();
      const handler2 = createHandlerMock();
      const handleEvent = userEventDispatcher.createUserInputEventHandler();

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

      await handleEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: interfaceId,
      });

      expect(handler1).toHaveBeenCalledWith({
        event: { type: eventType, name: elementName },
        interfaceId,
      });
      expect(handler2).toHaveBeenCalledWith({
        event: { type: eventType, name: elementName },
        interfaceId,
      });
    });

    it('should not call handlers for different interface ids', async () => {
      const handler = createHandlerMock();
      const handleEvent = userEventDispatcher.createUserInputEventHandler();

      userEventDispatcher.on({
        elementName,
        eventType,
        interfaceId: '123',
        handler,
      });

      await handleEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: '456',
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should gracefully handle errors in event handlers', async () => {
      userEventDispatcher.on({
        elementName,
        eventType,
        interfaceId,
        handler: () => {
          throw new Error('Test error');
        },
      });

      const handleEvent = userEventDispatcher.createUserInputEventHandler();
      await expect(
        handleEvent({
          event: {
            type: eventType,
            name: elementName,
          },
          id: interfaceId,
        }),
      ).resolves.not.toThrow();
    });

    it('should gracefully handle errors in async event handlers', async () => {
      userEventDispatcher.on({
        elementName,
        eventType,
        interfaceId,
        handler: async () => {
          throw new Error('Test error');
        },
      });

      const handleEvent = userEventDispatcher.createUserInputEventHandler();
      await expect(
        handleEvent({
          event: {
            type: eventType,
            name: elementName,
          },
          id: interfaceId,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('off()', () => {
    it('should remove a registered event handler', async () => {
      const handler = createHandlerMock();
      const handleEvent = userEventDispatcher.createUserInputEventHandler();

      userEventDispatcher.on({
        elementName,
        eventType,
        interfaceId,
        handler,
      });

      const result = userEventDispatcher.off({
        elementName,
        eventType,
        interfaceId,
        handler,
      });

      expect(result).toBe(userEventDispatcher);

      await handleEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: interfaceId,
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should leave other handlers intact when removing a specific handler', async () => {
      const handler1 = createHandlerMock();
      const handler2 = createHandlerMock();
      const handleEvent = userEventDispatcher.createUserInputEventHandler();

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

      userEventDispatcher.off({
        elementName,
        eventType,
        interfaceId,
        handler: handler1,
      });

      await handleEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: interfaceId,
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith({
        event: { type: eventType, name: elementName },
        interfaceId,
      });
    });

    it('should handle removing non-existent handlers gracefully', () => {
      const handler = createHandlerMock();

      const result = userEventDispatcher.off({
        elementName,
        eventType,
        interfaceId,
        handler,
      });

      expect(result).toBe(userEventDispatcher);
    });
  });

  describe('createUserInputEventHandler', () => {
    it('should throw error when creating multiple handlers', () => {
      userEventDispatcher.createUserInputEventHandler();

      expect(() => {
        userEventDispatcher.createUserInputEventHandler();
      }).toThrow('User input event handler has already been created');
    });

    it('should do nothing when no handlers are registered', async () => {
      const handleEvent = userEventDispatcher.createUserInputEventHandler();

      await expect(
        handleEvent({
          event: {
            type: eventType,
            name: elementName,
          },
          id: interfaceId,
        }),
      ).resolves.toBeUndefined();
    });
  });
});
