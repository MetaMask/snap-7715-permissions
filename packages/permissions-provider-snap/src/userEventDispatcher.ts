import { logger } from '@metamask/7715-permissions-shared/utils';
import type { UserInputEvent, UserInputEventType } from '@metamask/snaps-sdk';

/**
 * Class responsible for dispatching user input events to registered handlers.
 * Provides a way to register, deregister, and dispatch event handlers
 * based on event type. Handlers can internally filter by event name if needed.
 */
export class UserEventDispatcher {
  /**
   * Map of event types to array of event handlers
   */
  readonly #eventHandlers: Map<string, ((event: UserInputEvent) => void)[]> =
    new Map();

  constructor() {
    logger.debug('userEventDispatcher:constructor()');
  }

  /**
   * Register an event handler for a specific event type.
   *
   * @param args - The event handler arguments as object.
   * @param args.eventType - The type of event to listen for.
   * @param args.handler - The callback function to execute when the event occurs.
   * @returns A reference to this instance for method chaining.
   */
  public on(args: {
    eventType: UserInputEventType;
    handler: (event: UserInputEvent) => void;
  }): UserEventDispatcher {
    const { eventType, handler } = args;
    logger.debug('userEventDispatcher:on()', {
      eventType,
    });

    if (!this.#eventHandlers.has(eventType)) {
      logger.debug('userEventDispatcher:on() - creating new handlers array', {
        eventType,
      });
      this.#eventHandlers.set(eventType, []);
    }

    const handlers = this.#eventHandlers.get(eventType);
    if (!handlers) {
      throw new Error('Handlers array not found');
    }

    handlers.push(handler);

    logger.debug('userEventDispatcher:on() - handler registered', {
      eventType,
      handlersCount: handlers.length,
    });

    return this;
  }

  /**
   * Deregister an event handler for a specific event type.
   *
   * @param args - The event handler arguments as object.
   * @param args.eventType - The type of event to stop listening for.
   * @param args.handler - The callback function to remove.
   * @returns A reference to this instance for method chaining.
   */
  public off(args: {
    eventType: UserInputEventType;
    handler: (event: UserInputEvent) => void;
  }): UserEventDispatcher {
    const { eventType, handler } = args;

    logger.debug('userEventDispatcher:off()', {
      eventType,
    });

    if (!this.#eventHandlers.has(eventType)) {
      logger.debug('userEventDispatcher:off() - no handlers for event type', {
        eventType,
      });
      return this;
    }

    const handlers = this.#eventHandlers.get(eventType);

    if (!handlers) {
      throw new Error('Handlers array not found');
    }

    const index = handlers.indexOf(handler);

    if (index === -1) {
      logger.debug('userEventDispatcher:off() - handler not found', {
        eventType,
      });
    } else {
      logger.debug('userEventDispatcher:off() - removing handler', {
        eventType,
        handlerIndex: index,
      });
      handlers.splice(index, 1);
    }

    if (handlers.length === 0) {
      logger.debug('userEventDispatcher:off() - removing empty event type', {
        eventType,
      });
      this.#eventHandlers.delete(eventType);
    }

    return this;
  }

  /**
   * Process a user input event and trigger all registered handlers for that event type.
   * Handlers are responsible for filtering by event name if needed.
   *
   * @param args - The event handler arguments as object.
   * @param args.event - The event object containing type and name information.
   */
  public handleUserInputEvent(args: { event: UserInputEvent }): void {
    const { event } = args;

    logger.debug('userEventDispatcher:handleUserInputEvent()', {
      eventType: event.type,
      name: event.name,
    });

    if (!this.#eventHandlers.has(event.type)) {
      logger.debug(
        'userEventDispatcher:handleUserInputEvent() - no handlers for event type',
        {
          eventType: event.type,
        },
      );
      return;
    }

    const handlers = this.#eventHandlers.get(event.type);

    if (!handlers) {
      throw new Error('Handlers array not found');
    }

    if (handlers.length === 0) {
      logger.debug(
        'userEventDispatcher:handleUserInputEvent() - handlers array empty',
        {
          eventType: event.type,
        },
      );
      return;
    }

    logger.debug(
      'userEventDispatcher:handleUserInputEvent() - executing handlers',
      {
        eventType: event.type,
        name: event.name,
        handlerCount: handlers.length,
      },
    );

    handlers.forEach((handler, index) => {
      try {
        logger.debug(
          'userEventDispatcher:handleUserInputEvent() - executing handler',
          {
            eventType: event.type,
            name: event.name,
            handlerIndex: index,
          },
        );
        handler(event);
      } catch (error) {
        logger.error(
          `Error in event handler for ${event.type}${
            event.name ? ` on element ${event.name}` : ''
          }:`,
          error,
        );
      }
    });

    logger.debug(
      'userEventDispatcher:handleUserInputEvent() - handlers executed successfully',
      {
        eventType: event.type,
        name: event.name,
      },
    );
  }
}
