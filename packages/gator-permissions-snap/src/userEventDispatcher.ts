import { logger } from '@metamask/7715-permissions-shared/utils';
import type {
  ButtonClickEvent,
  FileUploadEvent,
  FormSubmitEvent,
  InputChangeEvent,
  UserInputEvent,
} from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';

export type DialogContentEventHandlers = {
  elementName: string;
  eventType: UserInputEventType;
  handler: UserEventHandler<UserInputEventType>;
};

export type UserInputEventByType<
  TUserInputEventType extends UserInputEventType,
> = {
  [UserInputEventType.ButtonClickEvent]: ButtonClickEvent;
  [UserInputEventType.FormSubmitEvent]: FormSubmitEvent;
  [UserInputEventType.InputChangeEvent]: InputChangeEvent;
  [UserInputEventType.FileUploadEvent]: FileUploadEvent;
}[TUserInputEventType];

export type UserEventHandler<TUserInputEventType extends UserInputEventType> =
  (args: {
    event: UserInputEventByType<TUserInputEventType>;
    interfaceId: string;
  }) => void | Promise<void>;

const getUserInputEventKey = ({
  elementName,
  eventType,
  interfaceId,
}: {
  elementName: string;
  eventType: UserInputEventType;
  interfaceId: string;
}) => `${elementName}:${eventType}:${interfaceId}`;

/**
 * Debounce configuration
 */
const DEBOUNCE_DELAY = 500; // 500ms debounce delay

/**
 * Class responsible for dispatching user input events to registered handlers.
 * Provides a way to register, deregister, and dispatch event handlers
 * based on event type. Handlers can internally filter by event name if needed.
 *
 * Key features:
 * - Debouncing logic to prevent rapid successive calls of the same input change event
 * - Sequential event processing to prevent race conditions
 * - Proper ordering: pending debounced events are processed before non-debounced events
 * - Support for both synchronous and asynchronous event handlers
 */
export class UserEventDispatcher {
  /**
   * Map of event types to array of event handlers
   */
  readonly #eventHandlers = {} as {
    [userInputEventKey: string]: UserEventHandler<UserInputEventType>[];
  };

  /**
   * Flag to ensure only one component can get the event handler
   */
  #hasEventHandler = false;

  /**
   * Queue for processing events sequentially to prevent race conditions
   */
  #eventQueue: Promise<void> = Promise.resolve();

  /**
   * Map to track debounce timers for each event key
   */
  readonly #debounceTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Map to track the latest event data for each debounced event key
   * This ensures we always process the most recent event data
   */
  readonly #pendingDebouncedEvents = new Map<
    string,
    {
      event: UserInputEvent;
      id: string;
      eventKey: string;
    }
  >();

  /**
   * Register an event handler for a specific event type.
   *
   * @param args - The event handler arguments as object.
   * @param args.elementName - The name that will be sent to onUserInput when a user interacts with the interface.
   * @param args.eventType - The type of event to listen for.
   * @param args.interfaceId - The id of the interface to listen for events on.
   * @param args.handler - The callback function to execute when the event occurs.
   * @returns A reference to this instance for method chaining.
   */
  public on<TUserInputEventType extends UserInputEventType>(args: {
    elementName: string;
    eventType: TUserInputEventType;
    interfaceId: string;
    handler: UserEventHandler<TUserInputEventType>;
  }): { dispatcher: UserEventDispatcher; unbind: () => void } {
    const { elementName, eventType, handler, interfaceId } = args;

    const eventKey = getUserInputEventKey({
      elementName,
      eventType,
      interfaceId,
    });

    if (this.#eventHandlers[eventKey]) {
      this.#eventHandlers[eventKey]?.push(
        handler as UserEventHandler<UserInputEventType>,
      );
    } else {
      this.#eventHandlers[eventKey] = [
        handler as UserEventHandler<UserInputEventType>,
      ];
    }

    return {
      dispatcher: this,
      unbind: () => {
        this.off<TUserInputEventType>(args);
      },
    };
  }

  /**
   * Deregister an event handler for a specific event type.
   *
   * @param args - The event handler arguments as object.
   * @param args.elementName - The name that will be sent to onUserInput when a user interacts with the interface.
   * @param args.eventType - The type of event to stop listening for.
   * @param args.interfaceId - The id of the interface.
   * @param args.handler - The callback function to remove.
   * @returns A reference to this instance for method chaining.
   */
  public off<TUserInputEventType extends UserInputEventType>(args: {
    elementName: string;
    eventType: TUserInputEventType;
    interfaceId: string;
    handler: UserEventHandler<TUserInputEventType>;
  }): UserEventDispatcher {
    const { eventType, handler, interfaceId, elementName } = args;

    const eventKey = getUserInputEventKey({
      elementName,
      eventType,
      interfaceId,
    });

    const handlers = this.#eventHandlers[eventKey];

    if (!handlers?.length) {
      return this;
    }

    const index = handlers.indexOf(
      handler as UserEventHandler<UserInputEventType>,
    );

    if (index !== -1) {
      handlers.splice(index, 1);
    }

    return this;
  }

  /**
   * Processes an event by executing all registered handlers sequentially.
   * This is the core logic shared between debounced and non-debounced event processing.
   * Handlers are executed one after another to prevent race conditions where multiple handlers
   * might overwrite each other's context changes.
   * @param event - The user input event to process.
   * @param id - The interface ID for the event.
   * @param eventKey - The unique key identifying the event.
   * @returns Promise that resolves when all handlers have been executed.
   */
  async #processEvent(
    event: UserInputEvent,
    id: string,
    eventKey: string,
  ): Promise<void> {
    return this.#eventQueue.then(async () => {
      const handlers = this.#eventHandlers[eventKey];

      if (!handlers?.length) {
        return;
      }

      // Execute handlers sequentially to prevent race conditions where multiple handlers
      // might overwrite each other's context changes
      for (const handler of handlers) {
        try {
          await handler({
            event,
            interfaceId: id,
          });
        } catch (error) {
          logger.error(
            `Error in event handler for event type ${event.type} and interface id ${id}:`,
            error,
          );
        }
      }
    });
  }

  /**
   * Creates a user input event handler function that can only be retrieved once.
   * This ensures that only one component (the ConfirmationDialogFactory) can handle user input events.
   * The returned function processes events with debouncing for input change events and immediate processing
   * for other event types, while maintaining proper ordering and sequential execution.
   *
   * @returns A function that handles user input events.
   * @throws If the handler has already been created.
   */
  public createUserInputEventHandler(): (args: {
    event: UserInputEvent;
    id: string;
  }) => Promise<void> {
    if (this.#hasEventHandler) {
      throw new Error('User input event handler has already been created');
    }
    this.#hasEventHandler = true;

    return async (args: { event: UserInputEvent; id: string }) => {
      const { event, id } = args;

      const eventKey = getUserInputEventKey({
        elementName: event.name ?? '',
        eventType: event.type,
        interfaceId: id,
      });

      // Only debounce input change events
      if (event.type === UserInputEventType.InputChangeEvent) {
        // Store the latest event data (this will overwrite any previous event for the same key)
        this.#pendingDebouncedEvents.set(eventKey, { event, id, eventKey });

        // Clear existing debounce timer for this event key
        const existingTimer = this.#debounceTimers.get(eventKey);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Set up new debounce timer
        const timer = setTimeout(() => {
          // Get the latest event data for this key
          const pendingEvent = this.#pendingDebouncedEvents.get(eventKey);
          if (pendingEvent) {
            // Remove from pending events
            this.#pendingDebouncedEvents.delete(eventKey);

            // Process the event and chain it to the queue
            this.#eventQueue = this.#processEvent(
              pendingEvent.event,
              pendingEvent.id,
              pendingEvent.eventKey,
            );
          }
        }, DEBOUNCE_DELAY);

        // Store the timer for potential cancellation
        this.#debounceTimers.set(eventKey, timer);
      } else {
        // For non-input events, first process any pending debounced events immediately
        // This ensures proper ordering: any pending debounced events are processed before the current non-debounced event
        const pendingEventKeys = Array.from(
          this.#pendingDebouncedEvents.keys(),
        );
        if (pendingEventKeys.length > 0) {
          // Process all pending debounced events sequentially to maintain proper ordering
          for (const pendingEventKey of pendingEventKeys) {
            const pendingEvent =
              this.#pendingDebouncedEvents.get(pendingEventKey);
            if (pendingEvent) {
              // Clear the debounce timer for this event
              const timer = this.#debounceTimers.get(pendingEventKey);
              if (timer) {
                clearTimeout(timer);
                this.#debounceTimers.delete(pendingEventKey);
              }

              // Remove from pending events
              this.#pendingDebouncedEvents.delete(pendingEventKey);

              // Process the event and chain it to the queue
              this.#eventQueue = this.#processEvent(
                pendingEvent.event,
                pendingEvent.id,
                pendingEvent.eventKey,
              );

              // Wait for this specific event to complete before processing the next
              await this.#eventQueue;
            }
          }
        }

        // Now process the current non-debounced event and chain it to the queue
        this.#eventQueue = this.#processEvent(event, id, eventKey);

        // Wait for this specific event to complete
        await this.#eventQueue;
      }
    };
  }

  /**
   * Clears all active debounce timers and pending debounced events.
   * This method is primarily used for testing purposes to ensure clean state
   * between tests.
   */
  public clearDebounceTimers(): void {
    // Clear all active timers
    for (const timer of this.#debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.#debounceTimers.clear();

    // Clear pending debounced events
    this.#pendingDebouncedEvents.clear();
  }

  /**
   * Waits for all pending event handler updates to complete.
   * This includes both events currently being processed in the event queue and events that are debounced
   * but haven't executed yet. All pending debounced events are processed immediately when this method is called.
   *
   * @returns Promise that resolves when all pending updates are complete.
   */
  async waitForPendingHandlers(): Promise<void> {
    // Wait for the event queue to be empty (all events processed)
    await this.#eventQueue;

    // Wait for all pending debounced events to complete
    const pendingEventKeys = Array.from(this.#pendingDebouncedEvents.keys());
    if (pendingEventKeys.length > 0) {
      // Clear all debounce timers since we're processing immediately
      for (const eventKey of pendingEventKeys) {
        const timer = this.#debounceTimers.get(eventKey);
        if (timer) {
          clearTimeout(timer);
          this.#debounceTimers.delete(eventKey);
        }
      }

      // Process all pending debounced events sequentially to maintain proper ordering
      for (const eventKey of pendingEventKeys) {
        const pendingEvent = this.#pendingDebouncedEvents.get(eventKey);
        if (pendingEvent) {
          // Remove from pending events
          this.#pendingDebouncedEvents.delete(eventKey);

          // Process the event and chain it to the queue
          this.#eventQueue = this.#processEvent(
            pendingEvent.event,
            pendingEvent.id,
            pendingEvent.eventKey,
          );

          // Wait for this specific event to complete before processing the next
          await this.#eventQueue;
        }
      }
    }
  }
}
