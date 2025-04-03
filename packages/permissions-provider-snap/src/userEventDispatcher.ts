import type { Permission } from '@metamask/7715-permissions-shared/types';
import {
  extractPermissionName,
  logger,
} from '@metamask/7715-permissions-shared/utils';
import type {
  ButtonClickEvent,
  FileUploadEvent,
  FormSubmitEvent,
  InputChangeEvent,
  InterfaceContext,
  SnapsProvider,
  UserInputEvent,
  UserInputEventType,
} from '@metamask/snaps-sdk';

import {
  createPermissionOrchestrator,
  type SupportedPermissionTypes,
} from './orchestrators';
import {
  buildConfirmationDialog,
  type PermissionConfirmationContext,
} from './ui';

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
  interfaceId,
}: {
  eventName: string;
  interfaceId: string;
}) => `${eventName}:${interfaceId}`;
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

  readonly #snapsProvider: SnapsProvider;

  constructor(snapsProvider: SnapsProvider) {
    this.#snapsProvider = snapsProvider;
  }

  /**
   * Register an event handler for a specific event type.
   *
   * @param args - The event handler arguments as object.
   * @param args.eventName - The name that will be sent to onUserInput when a user interacts with the interface.
   * @param args.interfaceId - The id of the interface to listen for events on.
   * @param args.handler - The callback function to execute when the event occurs.
   * @returns A reference to this instance for method chaining.
   */
  public on<TUserInputEventType extends UserInputEventType>(args: {
    eventName: string;
    interfaceId: string;
    handler: UserEventHandler<TUserInputEventType>;
  }): UserEventDispatcher {
    const { eventName, handler, interfaceId } = args;

    const eventKey = getUserInputEventKey({
      eventName,
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
   * @param args.eventName - The name that will be sent to onUserInput when a user interacts with the interface.
   * @param args.interfaceId - The id of the interface.
   * @param args.handler - The callback function to remove.
   * @returns A reference to this instance for method chaining.
   */
  public off<TUserInputEventType extends UserInputEventType>(args: {
    eventName: string;
    interfaceId: string;
    handler: UserEventHandler<TUserInputEventType>;
  }): UserEventDispatcher {
    const { eventName, handler, interfaceId } = args;

    const eventKey = getUserInputEventKey({
      eventName,
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
    context: InterfaceContext | null;
  }): Promise<void> {
    const { event, id, context } = args;

    if (!event.name) {
      return;
    }

    if (!context) {
      return;
    }

    if (!('permission' in context)) {
      return;
    }

    const eventKey = getUserInputEventKey({
      eventName: event.name,
      interfaceId: id,
    });

    const handlers = this.#eventHandlers[eventKey];

    if (!handlers?.length) {
      return;
    }

    const permissionType = extractPermissionName(
      (context.permission as Permission).type,
    ) as SupportedPermissionTypes;

    const handlersExecutions = handlers.map(async (handler) => {
      try {
        const updatedContext = await handler({
          event,
          attenuatedContext: context as PermissionConfirmationContext<
            typeof permissionType
          >,
        });
        if (updatedContext) {
          await this.#snapsProvider.request({
            method: 'snap_updateInterface',
            params: {
              id,
              ui: buildConfirmationDialog(
                createPermissionOrchestrator(
                  permissionType,
                ).buildPermissionConfirmation(updatedContext),
              ),
            },
          });
        }
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
