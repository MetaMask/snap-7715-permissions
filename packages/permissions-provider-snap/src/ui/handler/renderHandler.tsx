import type { SnapsProvider } from '@metamask/snaps-sdk';

import type { SupportedPermissionTypes } from '../../orchestrators';
import { permissionConfirmationPageFactory } from '../confirmationFactory';
import type {
  PermissionConfirmationContext,
  PermissionConfirmationMeta,
} from '../types';

export type PermissionConfirmationRenderHandler = {
  /**
   * Render the permission confirmation page.
   * @param permissionConfirmationMeta - The meta data required to prepare the permission confirmation page.
   * @returns The attenuated context data after the user confirms the permission request.
   */
  renderPermissionConfirmation: <
    TPermissionType extends SupportedPermissionTypes,
  >(
    permissionConfirmationMeta: PermissionConfirmationMeta<TPermissionType>,
  ) => Promise<PermissionConfirmationContext<TPermissionType>>;
};

/**
 * Creates a permission confirmation render handler for a specific permission type.
 *
 * @param snapsProvider - A snaps provider instance.
 * @returns The permission confirmation render handler for the specific permission type.
 */
export const createPermissionConfirmationRenderHandler = (
  snapsProvider: SnapsProvider,
): PermissionConfirmationRenderHandler => {
  return {
    renderPermissionConfirmation: async <
      TPermissionType extends SupportedPermissionTypes,
    >(
      permissionConfirmationMeta: PermissionConfirmationMeta<TPermissionType>,
    ) => {
      const [context, permissionConfirmationPage] =
        permissionConfirmationPageFactory<TPermissionType>(
          permissionConfirmationMeta,
        );

      const interfaceId = await snapsProvider.request({
        method: 'snap_createInterface',
        params: {
          context,
          ui: permissionConfirmationPage,
        },
      });

      // The snap_dialog will resolve with the context data after the user confirms
      const attenuatedContext = await snapsProvider.request({
        method: 'snap_dialog',
        params: {
          id: interfaceId,
        },
      });

      // If user click cancel, the response will be undefined
      if (!attenuatedContext) {
        throw new Error('User rejected the permissions request');
      }

      // TODO: Validate the response to ensure all confimation return data in the expected format with correct permission type
      return attenuatedContext as PermissionConfirmationContext<TPermissionType>;
    },
  };
};
