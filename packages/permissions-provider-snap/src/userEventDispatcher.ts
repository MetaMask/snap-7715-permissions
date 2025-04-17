import { logger } from '@metamask/7715-permissions-shared/utils';
import type {
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
 */
export class UserEventDispatcher {
  /**
   * Map of event types to array of event handlers
   */
  readonly #eventHandlers = {} as {
    [userInputEventKey: string]: UserEventHandler<UserInputEventType>[];
  };

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
   * Process a user input event and trigger all registered handlers for that event type.
   * Handlers are responsible for filtering by event name if needed.
   *
   * @param args - The event handler arguments as object.
   * @param args.event - The event object containing type and name information.
   * @param args.id - The id of the interface.
   * @param args.context - The interface context object that can be modified by handlers.
   */
  public async handleUserInputEvent(args: {
    event: UserInputEvent;
    id: string;
  }): Promise<void> {
    const { event, id } = args;

    const eventKey = getUserInputEventKey({
      elementName: event.name ?? '',
      eventType: event.type,
      interfaceId: id,
    });

    const handlers = this.#eventHandlers[eventKey];

    if (!handlers?.length) {
      return;
    }

    const handlersExecutions = handlers.map(async (handler) => {
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
    });

    await Promise.all(handlersExecutions);
  }
}
