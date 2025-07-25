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
      const handler = jest.fn<() => void>();

      handler.mockImplementation(() => {
        throw new Error('Test error');
      });

      userEventDispatcher.on({
        elementName,
        eventType,
        interfaceId,
        handler,
      });

      const handleEvent = userEventDispatcher.createUserInputEventHandler();

      await handleEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: interfaceId,
      });

      expect(handler).toHaveBeenCalled();
    });

    it('should gracefully handle errors in async event handlers', async () => {
      const handler = createAsyncHandlerMock();

      handler.mockImplementation(async () => {
        throw new Error('Test error');
      });

      userEventDispatcher.on({
        elementName,
        eventType,
        interfaceId,
        handler,
      });

      const handleEvent = userEventDispatcher.createUserInputEventHandler();

      await handleEvent({
        event: {
          type: eventType,
          name: elementName,
        },
        id: interfaceId,
      });

      expect(handler).toHaveBeenCalled();
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

      expect(
        await handleEvent({
          event: {
            type: eventType,
            name: elementName,
          },
          id: interfaceId,
        }),
      ).toBeUndefined();
    });

    describe('debouncing', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
        userEventDispatcher.clearDebounceTimers();
      });

      it('should debounce input change events', async () => {
        const handler = createHandlerMock();
        const handleEvent = userEventDispatcher.createUserInputEventHandler();

        userEventDispatcher.on({
          elementName: 'test-input',
          eventType: UserInputEventType.InputChangeEvent,
          interfaceId,
          handler,
        });

        // Trigger multiple input change events rapidly
        await handleEvent({
          event: {
            type: UserInputEventType.InputChangeEvent,
            name: 'test-input',
            value: '1',
          },
          id: interfaceId,
        });

        await handleEvent({
          event: {
            type: UserInputEventType.InputChangeEvent,
            name: 'test-input',
            value: '12',
          },
          id: interfaceId,
        });

        await handleEvent({
          event: {
            type: UserInputEventType.InputChangeEvent,
            name: 'test-input',
            value: '123',
          },
          id: interfaceId,
        });

        // Handler should not be called immediately
        expect(handler).not.toHaveBeenCalled();

        // Fast-forward time to trigger the debounced handler
        jest.advanceTimersByTime(300);

        // Handler should be called once with the last event
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith({
          event: {
            type: UserInputEventType.InputChangeEvent,
            name: 'test-input',
            value: '123',
          },
          interfaceId,
        });
      });

      it('should execute non-input-change events immediately', async () => {
        const handler = createHandlerMock();
        const handleEvent = userEventDispatcher.createUserInputEventHandler();

        userEventDispatcher.on({
          elementName,
          eventType: UserInputEventType.ButtonClickEvent,
          interfaceId,
          handler,
        });

        await handleEvent({
          event: {
            type: UserInputEventType.ButtonClickEvent,
            name: elementName,
          },
          id: interfaceId,
        });

        // Handler should be called immediately for button click events
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith({
          event: {
            type: UserInputEventType.ButtonClickEvent,
            name: elementName,
          },
          interfaceId,
        });
      });

      it('should handle debounced events for different input fields separately', async () => {
        const handler1 = createHandlerMock();
        const handler2 = createHandlerMock();
        const handleEvent = userEventDispatcher.createUserInputEventHandler();

        userEventDispatcher.on({
          elementName: 'input1',
          eventType: UserInputEventType.InputChangeEvent,
          interfaceId,
          handler: handler1,
        });

        userEventDispatcher.on({
          elementName: 'input2',
          eventType: UserInputEventType.InputChangeEvent,
          interfaceId,
          handler: handler2,
        });

        // Trigger events on different inputs
        await handleEvent({
          event: {
            type: UserInputEventType.InputChangeEvent,
            name: 'input1',
            value: 'a',
          },
          id: interfaceId,
        });

        await handleEvent({
          event: {
            type: UserInputEventType.InputChangeEvent,
            name: 'input2',
            value: 'b',
          },
          id: interfaceId,
        });

        // Fast-forward time
        jest.advanceTimersByTime(300);

        // Both handlers should be called
        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler2).toHaveBeenCalledTimes(1);
      });

      it('should clear debounce timers when clearDebounceTimers is called', async () => {
        const handler = createHandlerMock();
        const handleEvent = userEventDispatcher.createUserInputEventHandler();

        userEventDispatcher.on({
          elementName: 'test-input',
          eventType: UserInputEventType.InputChangeEvent,
          interfaceId,
          handler,
        });

        await handleEvent({
          event: {
            type: UserInputEventType.InputChangeEvent,
            name: 'test-input',
            value: 'test',
          },
          id: interfaceId,
        });

        // Clear timers before they can execute
        userEventDispatcher.clearDebounceTimers();

        // Fast-forward time
        jest.advanceTimersByTime(300);

        // Handler should not be called because timer was cleared
        expect(handler).not.toHaveBeenCalled();
      });
    });
  });
});
