import type { UserInputEvent, UserInputEventType } from '@metamask/snaps-sdk';

type UserEventHandler = (event: UserInputEvent) => void | Promise<void>;

/**
 * Class responsible for dispatching user input events to registered handlers.
 * Provides a way to register, deregister, and dispatch event handlers
 * based on event type. Handlers can internally filter by event name if needed.
 */
export class UserEventDispatcher {
  /**
   * Map of event types to array of event handlers
   */
  readonly #eventHandlers = {} as Record<
    UserInputEventType,
    UserEventHandler[]
  >;

  constructor() {}

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
    handler: UserEventHandler;
  }): UserEventDispatcher {
    const { eventType, handler } = args;

    if (!this.#eventHandlers[eventType]) {
      this.#eventHandlers[eventType] = [handler];
    } else {
      this.#eventHandlers[eventType].push(handler);
    }

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
    handler: UserEventHandler;
  }): UserEventDispatcher {
    const { eventType, handler } = args;

    const handlers = this.#eventHandlers[eventType];

    if (!handlers?.length) {
      return this;
    }

    const index = handlers.indexOf(handler);

    if (index !== -1) {
      handlers.splice(index, 1);
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
  public async handleUserInputEvent(args: {
    event: UserInputEvent;
  }): Promise<void> {
    const { event } = args;

    const handlers = this.#eventHandlers[event.type];

    if (!handlers?.length) {
      return;
    }

    const handlersExecutions = handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        // Error in event handler
      }
    });

    await Promise.all(handlersExecutions);
  }
}
