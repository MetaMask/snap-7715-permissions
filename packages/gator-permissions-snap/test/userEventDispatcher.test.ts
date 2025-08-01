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
  });

  describe('sequential event processing and race condition mitigation', () => {
    it('processes events sequentially to prevent race conditions', async () => {
      const handleEvent = userEventDispatcher.createUserInputEventHandler();
      const executionOrder: string[] = [];

      // Register handlers that track execution order
      userEventDispatcher.on({
        elementName: 'input1',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: async () => {
          executionOrder.push('handler1-start');
          await new Promise((resolve) => setTimeout(resolve, 50));
          executionOrder.push('handler1-end');
        },
      });

      userEventDispatcher.on({
        elementName: 'input2',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: async () => {
          executionOrder.push('handler2-start');
          await new Promise((resolve) => setTimeout(resolve, 30));
          executionOrder.push('handler2-end');
        },
      });

      // Trigger events rapidly
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      const event1Promise = handleEvent({
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: 'input1',
          value: 'value1',
        },
        id: 'test-interface',
      });

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      const event2Promise = handleEvent({
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: 'input2',
          value: 'value2',
        },
        id: 'test-interface',
      });

      // Wait for both events to complete
      await Promise.all([event1Promise, event2Promise]);

      // Verify that events were processed sequentially
      // Each event should complete fully before the next one starts
      expect(executionOrder).toStrictEqual([
        'handler1-start',
        'handler1-end',
        'handler2-start',
        'handler2-end',
      ]);
    });

    it('handles concurrent events from different interfaces without interference', async () => {
      const handleEvent = userEventDispatcher.createUserInputEventHandler();
      const interface1Events: string[] = [];
      const interface2Events: string[] = [];

      // Register handlers for different interfaces
      userEventDispatcher.on({
        elementName: 'input1',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'interface1',
        handler: async () => {
          interface1Events.push('start');
          await new Promise((resolve) => setTimeout(resolve, 50));
          interface1Events.push('end');
        },
      });

      userEventDispatcher.on({
        elementName: 'input2',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'interface2',
        handler: async () => {
          interface2Events.push('start');
          await new Promise((resolve) => setTimeout(resolve, 30));
          interface2Events.push('end');
        },
      });

      // Trigger events for different interfaces
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      const event1Promise = handleEvent({
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: 'input1',
          value: 'value1',
        },
        id: 'interface1',
      });

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      const event2Promise = handleEvent({
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: 'input2',
          value: 'value2',
        },
        id: 'interface2',
      });

      // Wait for both events to complete
      await Promise.all([event1Promise, event2Promise]);

      // Verify that each interface's events were processed correctly
      expect(interface1Events).toStrictEqual(['start', 'end']);
      expect(interface2Events).toStrictEqual(['start', 'end']);
    });

    it('executes multiple handlers for the same event sequentially to prevent race conditions', async () => {
      const handleEvent = userEventDispatcher.createUserInputEventHandler();
      const executionOrder: string[] = [];

      // Register multiple handlers for the same event
      userEventDispatcher.on({
        elementName: 'test-input',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: async () => {
          executionOrder.push('handler1-start');
          await new Promise((resolve) => setTimeout(resolve, 30));
          executionOrder.push('handler1-end');
        },
      });

      userEventDispatcher.on({
        elementName: 'test-input',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: async () => {
          executionOrder.push('handler2-start');
          await new Promise((resolve) => setTimeout(resolve, 20));
          executionOrder.push('handler2-end');
        },
      });

      userEventDispatcher.on({
        elementName: 'test-input',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: async () => {
          executionOrder.push('handler3-start');
          await new Promise((resolve) => setTimeout(resolve, 10));
          executionOrder.push('handler3-end');
        },
      });

      // Trigger a single event that will execute all three handlers
      await handleEvent({
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: 'test-input',
          value: 'test-value',
        },
        id: 'test-interface',
      });

      // Verify that handlers were executed sequentially (not concurrently)
      // Each handler should complete fully before the next one starts
      expect(executionOrder).toStrictEqual([
        'handler1-start',
        'handler1-end',
        'handler2-start',
        'handler2-end',
        'handler3-start',
        'handler3-end',
      ]);
    });

    it('handles errors gracefully without breaking sequential processing', async () => {
      const handleEvent = userEventDispatcher.createUserInputEventHandler();
      const executionOrder: string[] = [];

      // Register handlers - one that throws an error, one that succeeds
      userEventDispatcher.on({
        elementName: 'input1',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: async () => {
          executionOrder.push('handler1-start');
          throw new Error('Test error');
        },
      });

      userEventDispatcher.on({
        elementName: 'input2',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: async () => {
          executionOrder.push('handler2-start');
          await new Promise((resolve) => setTimeout(resolve, 30));
          executionOrder.push('handler2-end');
        },
      });

      // Trigger events
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      const event1Promise = handleEvent({
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: 'input1',
          value: 'value1',
        },
        id: 'test-interface',
      });

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      const event2Promise = handleEvent({
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: 'input2',
          value: 'value2',
        },
        id: 'test-interface',
      });

      // Wait for both events to complete
      await Promise.all([event1Promise, event2Promise]);

      // Verify that processing continued despite the error
      expect(executionOrder).toStrictEqual([
        'handler1-start',
        'handler2-start',
        'handler2-end',
      ]);
    });
  });

  describe('waitForPendingHandlers integration', () => {
    it('waits for all pending events before resolving', async () => {
      const testDispatcher = new UserEventDispatcher();
      const handleEvent = testDispatcher.createUserInputEventHandler();

      // Track event processing state
      let event1Completed = false;
      let event2Completed = false;
      let waitForPendingHandlersResolved = false;

      // Register slow event handlers
      testDispatcher.on({
        elementName: 'input1',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          event1Completed = true;
        },
      });

      testDispatcher.on({
        elementName: 'input2',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          event2Completed = true;
        },
      });

      // Trigger events
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      const event1Promise = handleEvent({
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: 'input1',
          value: 'value1',
        },
        id: 'test-interface',
      });

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      const event2Promise = handleEvent({
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: 'input2',
          value: 'value2',
        },
        id: 'test-interface',
      });

      // Wait a bit to ensure events are processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify events are still processing
      expect(event1Completed).toBe(false);
      expect(event2Completed).toBe(false);

      // Call waitForPendingHandlers (this should wait for all events to complete)
      const waitPromise = testDispatcher.waitForPendingHandlers().then(() => {
        waitForPendingHandlersResolved = true;
      });

      // Wait for waitForPendingHandlers to resolve
      await waitPromise;

      // Verify all events completed
      expect(event1Completed).toBe(true);
      expect(event2Completed).toBe(true);
      expect(waitForPendingHandlersResolved).toBe(true);

      // Clean up
      await Promise.all([event1Promise, event2Promise]);
    });

    it('handles the case where no events are pending', async () => {
      const testDispatcher = new UserEventDispatcher();
      // waitForPendingHandlers should resolve immediately when no events are pending
      const result = await testDispatcher.waitForPendingHandlers();
      expect(result).toBeUndefined();
    });

    it('works correctly with error handling in event handlers', async () => {
      const testDispatcher = new UserEventDispatcher();
      const handleEvent = testDispatcher.createUserInputEventHandler();

      let eventCompleted = false;
      let errorThrown = false;

      // Register a handler that throws an error
      testDispatcher.on({
        elementName: 'error-input',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          errorThrown = true;
          throw new Error('Test error');
        },
      });

      // Register a handler that completes successfully
      testDispatcher.on({
        elementName: 'success-input',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          eventCompleted = true;
        },
      });

      // Trigger both events
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      const errorEventPromise = handleEvent({
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: 'error-input',
          value: 'error-value',
        },
        id: 'test-interface',
      });

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      const successEventPromise = handleEvent({
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: 'success-input',
          value: 'success-value',
        },
        id: 'test-interface',
      });

      // Wait a bit to ensure events are processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(errorThrown).toBe(false);
      expect(eventCompleted).toBe(false);
      // waitForPendingHandlers should still wait for all events to complete
      await testDispatcher.waitForPendingHandlers();

      // Verify both events completed (even though one threw an error)
      expect(errorThrown).toBe(true);
      expect(eventCompleted).toBe(true);

      // Clean up - both promises should resolve because errors are caught and logged
      await Promise.all([errorEventPromise, successEventPromise]);
    });
  });
});
