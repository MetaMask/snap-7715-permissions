import type { ButtonClickEvent } from '@metamask/snaps-sdk';
import {
  UserInputEventType,
  type ComponentOrElement,
  type SnapsProvider,
} from '@metamask/snaps-sdk';
import { Container, type GenericSnapElement } from '@metamask/snaps-sdk/jsx';

import type { UserEventDispatcher, UserEventHandler } from '../../core';
import type { SupportedPermissionTypes } from '../../permissions';
import { ConfirmationFooter } from '../components';
import type { PermissionConfirmationContext } from '../types';
import { CANCEL_BUTTON, GRANT_BUTTON } from '../userInputConstant';

export type ConfirmationResult = {
  isConfirmationAccepted: boolean;
  attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
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
    ui: ComponentOrElement,
    permissionType: TPermissionType,
  ) => Promise<{
    interfaceId: string;
    confirmationResult: Promise<ConfirmationResult>;
  }>;

  /**
   * Updates the interface of the snap with the given interface ID and dialog content.
   *
   * @param interfaceId - The ID of the interface to update.
   * @param context - The permission confirmation context.
   * @param dialogContent - The new dialog content to set for the interface.
   */
  updateInterface: (
    interfaceId: string,
    context: PermissionConfirmationContext<SupportedPermissionTypes>,
    dialogContent: ComponentOrElement,
  ) => Promise<void>;
};

/**
 * Builds an interactive confirmation dialog for the user to confirm or cancel a permission request.
 *
 * @param dialogContent - The permission confirmation dialog to render.
 * @returns The interactive confirmation page.
 */
export const buildConfirmationDialog = (
  dialogContent: ComponentOrElement,
): JSX.Element => (
  <Container>
    {dialogContent as GenericSnapElement}
    <ConfirmationFooter />
  </Container>
);

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
    ) => {
      const interfaceId = await snapsProvider.request({
        method: 'snap_createInterface',
        params: {
          context,
          ui: buildConfirmationDialog(dialogContent),
        },
      });

      const confirmationResult = new Promise<ConfirmationResult>(
        (resolve, reject) => {
          const onButtonClick: UserEventHandler<
            UserInputEventType.ButtonClickEvent
          > = ({
            event,
            attenuatedContext,
          }: {
            event: ButtonClickEvent;
            attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
          }) => {
            let isConfirmationAccepted = false;
            switch (event.name) {
              case GRANT_BUTTON:
                isConfirmationAccepted = true;
                break;
              case CANCEL_BUTTON:
                isConfirmationAccepted = false;
                break;
              default:
                throw new Error(
                  `Unexpected event name. Expected ${GRANT_BUTTON} or ${CANCEL_BUTTON}.`,
                );
            }

            userEventDispatcher.off({
              elementName: event.name,
              interfaceId,
              eventType: UserInputEventType.ButtonClickEvent,
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

            resolve({
              isConfirmationAccepted,
              attenuatedContext,
            });
          };

          userEventDispatcher.on({
            elementName: GRANT_BUTTON,
            eventType: UserInputEventType.ButtonClickEvent,
            interfaceId,
            handler: onButtonClick,
          });

          userEventDispatcher.on({
            elementName: CANCEL_BUTTON,
            eventType: UserInputEventType.ButtonClickEvent,
            interfaceId,
            handler: onButtonClick,
          });

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
        },
      );

      return {
        interfaceId,
        confirmationResult,
      };
    },
    updateInterface: async (
      interfaceId: string,
      context: PermissionConfirmationContext<SupportedPermissionTypes>,
      dialogContent: ComponentOrElement,
    ) => {
      await snapsProvider.request({
        method: 'snap_updateInterface',
        params: {
          id: interfaceId,
          context,
          ui: buildConfirmationDialog(dialogContent),
        },
      });
    },
  };
};
