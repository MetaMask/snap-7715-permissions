import { logger } from '@metamask/7715-permissions-shared/utils';
import {
  ButtonClickEvent,
  FileUploadEvent,
  FormSubmitEvent,
  InputChangeEvent,
  UserInputEvent,
  UserInputEventType,
} from '@metamask/snaps-sdk';

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
 * Class responsible for dispatching user input events to registered handlers.
 * Provides a way to register, deregister, and dispatch event handlers
 * based on event type. Handlers can internally filter by event name if needed.
 * Includes debouncing for input change events to prevent cursor jumping during editing.
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
   * Map to store debounce timers for input change events
   */
  readonly #debounceTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Debounce delay in milliseconds for input change events
   */
  readonly #debounceDelay = 500;

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
    eventType: UserInputEventType;
    interfaceId: string;
    handler: UserEventHandler<TUserInputEventType>;
  }): UserEventDispatcher {
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

    return this;
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
   * Executes handlers for a given event key with debouncing for input change events.
   *
   * @param eventKey - The event key to execute handlers for.
   * @param event - The user input event.
   * @param interfaceId - The interface ID.
   */
  private async executeHandlers(
    eventKey: string,
    event: UserInputEvent,
    interfaceId: string,
  ): Promise<void> {
    const handlers = this.#eventHandlers[eventKey];

    if (!handlers?.length) {
      return;
    }

    const handlersExecutions = handlers.map(async (handler) => {
      try {
        await handler({
          event,
          interfaceId,
        });
      } catch (error) {
        logger.error(
          `Error in event handler for event type ${event.type} and interface id ${interfaceId}:`,
          error,
        );
      }
    });

    await Promise.all(handlersExecutions);
  }

  /**
   * Creates a user input event handler function that can only be retrieved once.
   * This ensures that only one component (the ConfirmationDialogFactory) can handle user input events.
   * Includes debouncing for input change events to prevent cursor jumping during editing.
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

      // Apply debouncing only for input change events
      if (event.type === UserInputEventType.InputChangeEvent) {
        // Clear existing timer for this event key
        const existingTimer = this.#debounceTimers.get(eventKey);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Set new timer
        const timer = setTimeout(async () => {
          await this.executeHandlers(eventKey, event, id);
          this.#debounceTimers.delete(eventKey);
        }, this.#debounceDelay);

        this.#debounceTimers.set(eventKey, timer);
      } else {
        // For non-input-change events, execute immediately
        await this.executeHandlers(eventKey, event, id);
      }
    };
  }

  /**
   * Clears all debounce timers. Useful for cleanup when the dispatcher is no longer needed.
   */
  public clearDebounceTimers(): void {
    this.#debounceTimers.forEach((timer) => clearTimeout(timer));
    this.#debounceTimers.clear();
  }
}
