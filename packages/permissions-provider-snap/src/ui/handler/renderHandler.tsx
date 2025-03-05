import type { ComponentOrElement, SnapsProvider } from '@metamask/snaps-sdk';

import type {
  PermissionCaseHandler,
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../../orchestrators';
import { handlePermissionCase } from '../../utils';
import { NativeTokenStreamConfirmationPage } from '../confirmations';
import type {
  PermissionConfirmationContext,
  SerializableDelegation,
} from '../types';

export type AttenuatedResponse<
  TPermissionType extends SupportedPermissionTypes,
> = {
  isConfirmed: boolean;
  attenuatedPermission: PermissionTypeMapping[TPermissionType];
  attenuatedDelegation: SerializableDelegation;
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

  /**
   * Get the permission confirmation page component for a specific permission type.
   *
   * @param context - The permission confirmation context to include in the permission confirmation page.
   * @param permissionType - The permission type.
   * @returns The permission confirmation context and the permission confirmation page component for the specific permission type.
   */
  getPermissionConfirmationPage: <
    TPermissionType extends SupportedPermissionTypes,
  >(
    context: PermissionConfirmationContext<TPermissionType>,
    permissionType: TPermissionType,
  ) => [PermissionConfirmationContext<TPermissionType>, ComponentOrElement];
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
    getConfirmedAttenuatedPermission: async <
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
    getPermissionConfirmationPage: <
      TPermissionType extends SupportedPermissionTypes,
    >(
      context: PermissionConfirmationContext<TPermissionType>,
      permissionType: TPermissionType,
    ) => {
      const caseHandlers: PermissionCaseHandler<
        TPermissionType,
        ComponentOrElement
      > = {
        'native-token-stream': (per) => (
          <NativeTokenStreamConfirmationPage
            siteOrigin={context.siteOrigin}
            permission={per as PermissionTypeMapping['native-token-stream']}
            balance={context.balance}
            expiry={context.expiry}
            chainId={context.chainId}
            delegation={context.delegation}
          />
        ),
        'native-token-transfer': (_per) => {
          throw new Error('Permission confirmation screen not found');
        },
      };

      const confirmationScreen = handlePermissionCase(
        permissionType,
        context.permission,
        caseHandlers,
        'Permission confirmation screen not found',
      );

      return [context, confirmationScreen];
    },
  };
};
