import type { ComponentOrElement, SnapsProvider } from '@metamask/snaps-sdk';

import type {
  AttenuatedResponse,
  SupportedPermissionTypes,
} from '../../orchestrators';
import type { PermissionConfirmationContext } from '../types';

export type PermissionConfirmationRenderHandler = {
  /**
   * Render the permission confirmation page and get the attenuated context data after the user confirms the permission request.
   *
   * @param context - The permission confirmation context.
   * @param ui - The UI component or element to render.
   * @param permissionType - The permission type.
   * @returns The attenuated context data after the user confirms the permission request.
   */
  handlePermissionConfirmationRender: <
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
 * @param snapsProvider - A snaps provider instance.
 * @returns The permission confirmation render handler for the specific permission type.
 */
export const createPermissionConfirmationRenderHandler = (
  snapsProvider: SnapsProvider,
): PermissionConfirmationRenderHandler => {
  return {
    handlePermissionConfirmationRender: async <
      TPermissionType extends SupportedPermissionTypes,
    >(
      context: PermissionConfirmationContext<TPermissionType>,
      ui: ComponentOrElement,
      permissionType: TPermissionType,
    ) => {
      const interfaceId = await snapsProvider.request({
        method: 'snap_createInterface',
        params: {
          context,
          ui,
        },
      });

      // The snap_dialog will resolve with the context data after the user confirms
      // The onUserInput handlers should always snap_resolveInterface with type AttenuatedResponse for cancel or confirm
      const attenuatedResponse = await snapsProvider.request({
        method: 'snap_dialog',
        params: {
          id: interfaceId,
        },
      });

      // TODO: Validate the response to ensure all confimation return data in the expected format with correct permission type (extra sanity check)
      return attenuatedResponse as AttenuatedResponse<typeof permissionType>;
    },
  };
};
