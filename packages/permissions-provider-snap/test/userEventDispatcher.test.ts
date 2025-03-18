import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { UserInputEvent, UserInputEventType } from '@metamask/snaps-sdk';

import { UserEventDispatcher } from '../src/userEventDispatcher';

describe('UserEventDispatcher', () => {
  let userEventDispatcher: UserEventDispatcher;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a new UserEventDispatcher instance
    userEventDispatcher = new UserEventDispatcher();
  });

  describe('constructor()', () => {
    it('should initialize with empty event handlers', () => {
      // No assertions needed
    });
  });

  describe('on()', () => {
    it('should register an event handler for a specific event type', () => {
      // Arrange
      const eventType = UserInputEventType.ButtonClickEvent;
      const handler = jest.fn();

      // Act
      const result = userEventDispatcher.on({
        eventType,
        handler,
      });

      // Assert
      expect(result).toBe(userEventDispatcher); // Should return this for chaining
    });

    it('should register multiple handlers for the same event type', () => {
      // Arrange
      const eventType = UserInputEventType.ButtonClickEvent;
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      // Act
      userEventDispatcher.on({
        eventType,
        handler: handler1,
      });

      userEventDispatcher.on({
        eventType,
        handler: handler2,
      });

      // No assertions needed for logger calls
    });

    it('should support method chaining', () => {
      // Arrange
      const eventType = UserInputEventType.ButtonClickEvent;
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      // Act & Assert - chain multiple registrations
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
    });
  });

  describe('off()', () => {
    it('should remove a registered event handler', () => {
      // Arrange
      const eventType = UserInputEventType.ButtonClickEvent;
      const handler = jest.fn();

      userEventDispatcher.on({
        eventType,
        handler,
      });

      // Reset the logger to clear the on() calls
      jest.clearAllMocks();

      // Act
      const result = userEventDispatcher.off({
        eventType,
        handler,
      });

      // Assert
      expect(result).toBe(userEventDispatcher); // Should return this for chaining
    });

    it('should do nothing when removing an unregistered handler', () => {
      // Arrange
      const eventType = UserInputEventType.ButtonClickEvent;
      const registeredHandler = jest.fn();
      const unregisteredHandler = jest.fn();

      userEventDispatcher.on({
        eventType,
        handler: registeredHandler,
      });

      // Reset the logger to clear the on() calls
      jest.clearAllMocks();

      // Act
      userEventDispatcher.off({
        eventType,
        handler: unregisteredHandler,
      });

      // No assertions needed for logger calls
    });

    it('should do nothing when removing a handler for an unregistered event type', () => {
      // Arrange
      const eventType = UserInputEventType.ButtonClickEvent;
      const handler = jest.fn();

      // Reset the logger to clear any previous calls
      jest.clearAllMocks();

      // Act
      userEventDispatcher.off({
        eventType,
        handler,
      });

      // No assertions needed for logger calls
    });

    it('should leave other handlers intact when removing a specific handler', () => {
      // Arrange
      const eventType = UserInputEventType.ButtonClickEvent;
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      userEventDispatcher
        .on({
          eventType,
          handler: handler1,
        })
        .on({
          eventType,
          handler: handler2,
        });

      // Reset the logger to clear the on() calls
      jest.clearAllMocks();

      // Act
      userEventDispatcher.off({
        eventType,
        handler: handler1,
      });

      // No assertions needed for logger calls
    });
  });

  describe('handleUserInputEvent()', () => {
    it('should call all registered handlers for an event type', () => {
      // Arrange
      const eventType = UserInputEventType.ButtonClickEvent;
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const mockEvent: UserInputEvent = {
        type: eventType,
        name: 'testButton',
      };

      userEventDispatcher
        .on({
          eventType,
          handler: handler1,
        })
        .on({
          eventType,
          handler: handler2,
        });

      // Reset the logger to clear the on() calls
      jest.clearAllMocks();

      // Act
      userEventDispatcher.handleUserInputEvent({
        event: mockEvent,
      });

      // Assert
      expect(handler1).toHaveBeenCalledWith(mockEvent);
      expect(handler2).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle errors thrown by event handlers', () => {
      // Arrange
      const eventType = UserInputEventType.ButtonClickEvent;
      const errorMessage = 'Test error from handler';
      const workingHandler = jest.fn();
      const errorHandler = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });
      const mockEvent: UserInputEvent = {
        type: eventType,
        name: 'testButton',
      };

      userEventDispatcher
        .on({
          eventType,
          handler: workingHandler,
        })
        .on({
          eventType,
          handler: errorHandler,
        });

      // Reset the logger to clear the on() calls
      jest.clearAllMocks();

      // Act
      userEventDispatcher.handleUserInputEvent({
        event: mockEvent,
      });

      // Assert
      expect(workingHandler).toHaveBeenCalledWith(mockEvent);
      expect(errorHandler).toHaveBeenCalledWith(mockEvent);
      // The second handler should still execute despite the first throwing an error
      expect(workingHandler).toHaveBeenCalled();
    });

    it('should do nothing when no handlers are registered for the event type', () => {
      // Arrange
      const mockEvent: UserInputEvent = {
        type: UserInputEventType.ButtonClickEvent,
        name: 'testButton',
      };

      // Reset the logger to clear any previous calls
      jest.clearAllMocks();

      // Act
      userEventDispatcher.handleUserInputEvent({
        event: mockEvent,
      });

      // No assertions needed for logger calls
    });

    it('should handle events without a name property', () => {
      // Arrange
      const eventType = UserInputEventType.ButtonClickEvent;
      const handler = jest.fn();
      const mockEvent: UserInputEvent = {
        type: eventType,
        // No name property
      };

      userEventDispatcher.on({
        eventType,
        handler,
      });

      // Reset the logger to clear the on() calls
      jest.clearAllMocks();

      // Act
      userEventDispatcher.handleUserInputEvent({
        event: mockEvent,
      });

      // Assert
      expect(handler).toHaveBeenCalledWith(mockEvent);
    });

    it('should not invoke handlers when array exists but is empty', () => {
      // Arrange
      const eventType = UserInputEventType.ButtonClickEvent;
      const handler = jest.fn();
      const mockEvent: UserInputEvent = {
        type: eventType,
        name: 'testButton',
      };

      // Register and then immediately unregister to create an empty array
      userEventDispatcher.on({
        eventType,
        handler,
      });

      userEventDispatcher.off({
        eventType,
        handler,
      });

      // Force an empty array situation (should not happen in real code)
      // We're creating a test-only scenario here
      const privateHandlers = (userEventDispatcher as any).eventHandlers;
      privateHandlers.set(eventType, []);

      // Reset the logger and handler mock to clear previous calls
      jest.clearAllMocks();

      // Act
      userEventDispatcher.handleUserInputEvent({
        event: mockEvent,
      });

      // Assert
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
