import type { ButtonClickEvent } from '@metamask/snaps-sdk';
import {
  UserInputEventType,
  type ComponentOrElement,
  type SnapsProvider,
} from '@metamask/snaps-sdk';
import { Container, type GenericSnapElement } from '@metamask/snaps-sdk/jsx';

import type { SupportedPermissionTypes } from '../../orchestrators';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../../userEventDispatcher';
import { ConfirmationFooter } from '../components';
import type { PermissionConfirmationContext } from '../types';
import { CANCEL_BUTTON, GRANT_BUTTON } from '../userInputConstant';

export type DialogContentEventHandlers = {
  eventType: UserInputEventType;
  handler: UserEventHandler<UserInputEventType>;
};

export type PermissionConfirmationRenderHandler = {
  /**
   * Render the permission confirmation page and get the attenuated context data after the user confirms the permission request.
   *
   * @param context - The permission confirmation context.
   * @param ui - The UI component or element to render.
   * @param permissionType - The permission type.
   * @returns The attenuated context data after the user confirms the permission request.
   */
  createConfirmationDialog: <TPermissionType extends SupportedPermissionTypes>(
    context: PermissionConfirmationContext<TPermissionType>,
    dialogContent: ComponentOrElement,
    permissionType: TPermissionType,
    dialogContentEventHandlers: DialogContentEventHandlers[],
  ) => Promise<{
    interfaceId: string;
    confirmationResult: Promise<boolean>;
  }>;

  /**
   * Cleanup the dialog content event handlers.
   *
   * @param interfaceId - The interface ID of the dialog.
   * @param dialogContentEventHandlers - The dialog content event handlers to cleanup.
   */
  cleanupDialogContentEventHandlers: (
    interfaceId: string,
    dialogContentEventHandlers: DialogContentEventHandlers[],
  ) => void;
};

/**
 * Creates a permission confirmation render handler for a specific permission type.
 *
 * @param options - The options object.
 * @param options.snapsProvider - A snaps provider instance.
 * @param options.userEventDispatcher - A user event dispatcher instance.
 * @returns The permission confirmation render handler for the specific permission type.
 */
export const createPermissionConfirmationRenderHandler = ({
  snapsProvider,
  userEventDispatcher,
}: {
  snapsProvider: SnapsProvider;
  userEventDispatcher: UserEventDispatcher;
}): PermissionConfirmationRenderHandler => {
  return {
    createConfirmationDialog: async <
      TPermissionType extends SupportedPermissionTypes,
    >(
      context: PermissionConfirmationContext<TPermissionType>,
      dialogContent: ComponentOrElement,
      _: TPermissionType,
      dialogContentEventHandlers: DialogContentEventHandlers[],
    ) => {
      // append the confirmation footer here to the dialog provided by the specific permission implementation
      const ui = (
        <Container>
          {dialogContent as GenericSnapElement}
          <ConfirmationFooter />
        </Container>
      );

      const interfaceId = await snapsProvider.request({
        method: 'snap_createInterface',
        params: {
          context,
          ui,
        },
      });

      const confirmationResult = new Promise<boolean>((resolve, reject) => {
        const onButtonClick = ({ event }: { event: ButtonClickEvent }) => {
          let isConfirmationAccepted = false;
          switch (event.name) {
            case GRANT_BUTTON:
              isConfirmationAccepted = true;
              break;
            case CANCEL_BUTTON:
              isConfirmationAccepted = false;
              break;
            default:
              return;
          }

          userEventDispatcher.off({
            eventType: UserInputEventType.ButtonClickEvent,
            interfaceId,
            handler: onButtonClick,
          });

          snapsProvider
            .request({
              method: 'snap_resolveInterface',
              params: {
                id: interfaceId,
                value: {},
              },
            })
            .catch((error) => {
              const reason = error as Error;
              reject(reason);
            });

          resolve(isConfirmationAccepted);
        };

        userEventDispatcher.on({
          eventType: UserInputEventType.ButtonClickEvent,
          interfaceId,
          handler: onButtonClick,
        });

        // Register event handlers for dialog content events
        if (dialogContentEventHandlers.length > 0) {
          dialogContentEventHandlers.forEach(({ eventType, handler }) => {
            userEventDispatcher.on({
              eventType,
              interfaceId,
              handler,
            });
          });
        }

        snapsProvider
          .request({
            method: 'snap_dialog',
            params: {
              id: interfaceId,
            },
          })
          .catch((error) => {
            const reason = error as Error;
            reject(reason);
          });
      });

      return {
        interfaceId,
        confirmationResult,
      };
    },
    cleanupDialogContentEventHandlers: (
      interfaceId: string,
      dialogContentEventHandlers: DialogContentEventHandlers[],
    ) => {
      if (!dialogContentEventHandlers.length) {
        return;
      }
      dialogContentEventHandlers.forEach(({ eventType, handler }) => {
        userEventDispatcher.off({
          eventType,
          interfaceId,
          handler,
        });
      });
    },
  };
};
