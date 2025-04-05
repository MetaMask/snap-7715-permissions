import type { Permission } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import type {
  ButtonClickEvent,
  FileUploadEvent,
  FormSubmitEvent,
  InputChangeEvent,
  InterfaceContext,
  UserInputEvent,
  UserInputEventType,
} from '@metamask/snaps-sdk';

import { type SupportedPermissionTypes } from './orchestrators';
import { type PermissionConfirmationContext } from './ui';

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
    attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
  }) => void | Promise<PermissionConfirmationContext<SupportedPermissionTypes>>;

const getUserInputEventKey = ({
  eventName,
  eventType,
  interfaceId,
}: {
  eventName: string;
  eventType: UserInputEventType;
  interfaceId: string;
}) => `${eventName}:${eventType}${interfaceId}`;
/**
 * Class responsible for dispatching user input events to registered handlers.
 * Provides a way to register, deregister, and dispatch event handlers
 * based on event type. Handlers can internally filter by event name if needed.
 */
export class UserEventDispatcher {
  /**
   * Map of userInputEventKey(eventName-eventType) to an event handler
   */
  readonly #eventHandlers = {} as {
    [userInputEventKey: string]: UserEventHandler<UserInputEventType>;
  };

  /**
   * Register an event handler for a specific event type.
   *
   * @param args - The event handler arguments as object.
   * @param args.eventName - The name that will be sent to onUserInput when a user interacts with the interface.
   * @param args.eventType - The type of event to listen for.
   * @param args.interfaceId - The id of the interface to listen for events on.
   * @param args.handler - The callback function to execute when the event occurs.
   * @returns A reference to this instance for method chaining.
   */
  public on<TUserInputEventType extends UserInputEventType>(args: {
    eventName: string;
    eventType: UserInputEventType;
    interfaceId: string;
    handler: UserEventHandler<TUserInputEventType>;
  }): UserEventDispatcher {
    const { eventName, eventType, handler, interfaceId } = args;

    const eventKey = getUserInputEventKey({
      eventName,
      eventType,
      interfaceId,
    });

    this.#eventHandlers[eventKey] =
      handler as UserEventHandler<UserInputEventType>;

    return this;
  }

  /**
   * Deregister an event handler for a specific event type.
   *
   * @param args - The event handler arguments as object.
   * @param args.eventName - The name that will be sent to onUserInput when a user interacts with the interface.
   * @param args.eventType - The type of event to stop listening for.
   * @param args.interfaceId - The id of the interface.
   * @returns A reference to this instance for method chaining.
   */
  public off(args: {
    eventName: string;
    eventType: UserInputEventType;
    interfaceId: string;
  }): UserEventDispatcher {
    const { eventName, eventType, interfaceId } = args;

    const eventKey = getUserInputEventKey({
      eventName,
      eventType,
      interfaceId,
    });

    const handler = this.#eventHandlers[eventKey];

    if (!handler) {
      return this;
    }

    delete this.#eventHandlers[eventKey];

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
   * @returns A promise that resolves to the updated context or void.
   */
  public async handleUserInputEvent(args: {
    event: UserInputEvent;
    id: string;
    context: InterfaceContext | null;
  }): Promise<null | PermissionConfirmationContext<SupportedPermissionTypes>> {
    const { event, id, context } = args;

    const eventKey = getUserInputEventKey({
      eventName: event.name ?? '',
      eventType: event.type,
      interfaceId: id,
    });

    const handler = this.#eventHandlers[eventKey];

    if (!handler) {
      return null;
    }

    const permissionType = extractPermissionName(
      (context?.permission as Permission).type,
    ) as SupportedPermissionTypes;

    const updatedContext = await handler({
      event,
      attenuatedContext: context as PermissionConfirmationContext<
        typeof permissionType
      >,
    });

    return updatedContext ?? null;
  }
}
