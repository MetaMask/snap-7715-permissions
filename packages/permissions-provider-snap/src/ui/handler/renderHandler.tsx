import { logger } from '@metamask/7715-permissions-shared/utils';
import type { UserInputEvent } from '@metamask/snaps-sdk';
import {
  UserInputEventType,
  type ComponentOrElement,
  type SnapsProvider,
} from '@metamask/snaps-sdk';
import { Container } from '@metamask/snaps-sdk/jsx';

import type {
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../../orchestrators';
import type { UserEventDispatcher } from '../../userEventDispatcher';
import { ConfirmationFooter } from '../components';
import type { PermissionConfirmationContext } from '../types';
import { CANCEL_BUTTON, GRANT_BUTTON } from '../userInputConstant';

/**
 * The attenuated response after the user confirms the permission request.
 */
export type AttenuatedResponse<
  TPermissionType extends SupportedPermissionTypes,
> = {
  isConfirmed: boolean;
  attenuatedPermission: PermissionTypeMapping[TPermissionType];
  attenuatedExpiry: number;
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
  getConfirmedAttenuatedPermission: <
    TPermissionType extends SupportedPermissionTypes,
  >(
    context: PermissionConfirmationContext<TPermissionType>,
    ui: ComponentOrElement,
    permissionType: TPermissionType,
  ) => Promise<AttenuatedResponse<TPermissionType>>;
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
    getConfirmedAttenuatedPermission: async <
      TPermissionType extends SupportedPermissionTypes,
    >(
      context: PermissionConfirmationContext<TPermissionType>,
      permissionDialog: ComponentOrElement,
      _: TPermissionType,
    ) => {
      // append the confirmation footer here to the dialog provided by the specific permission implementation
      const ui = (
        <Container>
          {permissionDialog as any}
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

      const attenuatedPermission = new Promise<
        AttenuatedResponse<TPermissionType>
      >((resolve, reject) => {
        const onButtonClick = async (event: UserInputEvent) => {
          logger.debug('onButtonClick', { buttonName: event.name });

          if (event.name === GRANT_BUTTON) {
            logger.debug('onButtonClick - GRANT_BUTTON');

            const activeContext = await snapsProvider.request({
              method: 'snap_getInterfaceContext',
              params: {
                id: interfaceId,
              },
            });

            if (!activeContext) {
              reject(new Error('No active context found'));
              return;
            }

            if (!activeContext.permission) {
              reject(new Error('No permission found'));
              return;
            }

            const { permission } = activeContext;

            resolve({
              isConfirmed: true,
              attenuatedPermission:
                permission as PermissionTypeMapping[TPermissionType],
              attenuatedExpiry: activeContext.expiry as number,
            });
          } else if (event.name === CANCEL_BUTTON) {
            logger.debug('onButtonClick - CANCEL_BUTTON');

            reject(new Error('User rejected permission request'));
          }

          userEventDispatcher.off({
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
              logger.error('Error resolving interface', { error });
              reject(error);
            });
        };

        userEventDispatcher.on({
          eventType: UserInputEventType.ButtonClickEvent,
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
            logger.error('Error dialog', { error });
            reject(error);
          });
      });

      return attenuatedPermission;
    },
  };
};
