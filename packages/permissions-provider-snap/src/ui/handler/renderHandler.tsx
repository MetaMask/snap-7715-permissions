import {
  UserInputEventType,
  type SnapsProvider,
  type UserInputEvent,
} from '@metamask/snaps-sdk';
import { Container, type GenericSnapElement } from '@metamask/snaps-sdk/jsx';

import type {
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../../orchestrators';
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
    permissionConfirmation: GenericSnapElement,
    permissionType: TPermissionType,
  ) => Promise<AttenuatedResponse<TPermissionType>>;

  /**
   * Handle button click events to determine if the interface should resolve.
   * If the interface resolves, the handler should call snap_resolveInterface.
   *
   * @param event - The button click event.
   * @param activeInterfaceId - The active interface id.
   * @param activeContext - The active context.
   * @param snapsProvider - The snap object.
   * @returns True if snap_resolveInterface is called to resolve the interface.
   */
  handleInterfaceResolution: (
    event: UserInputEvent,
    activeInterfaceId: string,
    activeContext: PermissionConfirmationContext<SupportedPermissionTypes>,
  ) => Promise<boolean>;

  /**
   * Update the interface with the new context and UI specific to the permission type.
   *
   * @param id - The interface id.
   * @param context - The permission confirmation context.
   * @param permissionConfirmation - The UI component or element to render.
   */
  updateInterface: (
    id: string,
    context: PermissionConfirmationContext<SupportedPermissionTypes>,
    permissionConfirmation: GenericSnapElement,
  ) => Promise<void>;
};

/**
 * Builds an interactive confirmation dialog for the user to confirm or cancel a permission request.
 *
 * @param permissionConfirmation - The permission confirmation dialog to render.
 * @returns The interactive confirmation page.
 */
const buildInterfaceUi = (
  permissionConfirmation: GenericSnapElement,
): JSX.Element => (
  <Container>
    {permissionConfirmation}
    <ConfirmationFooter />
  </Container>
);

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
      permissionConfirmation: GenericSnapElement,
      permissionType: TPermissionType,
    ) => {
      const interfaceId = await snapsProvider.request({
        method: 'snap_createInterface',
        params: {
          context,
          ui: buildInterfaceUi(permissionConfirmation),
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
    handleInterfaceResolution: async (
      event: UserInputEvent,
      activeInterfaceId: string,
      activeContext: PermissionConfirmationContext<SupportedPermissionTypes>,
    ): Promise<boolean> => {
      if (event.type !== UserInputEventType.ButtonClickEvent) {
        return false;
      }

      const attenuatedResponse: AttenuatedResponse<SupportedPermissionTypes> = {
        attenuatedPermission: activeContext.permission,
        attenuatedExpiry: activeContext.expiry,
        isConfirmed: false,
      };
      let didInterfaceResolve = false;

      if (event.name === CANCEL_BUTTON) {
        await snapsProvider.request({
          method: 'snap_resolveInterface',
          params: {
            id: activeInterfaceId,
            value: attenuatedResponse,
          },
        });
        didInterfaceResolve = true;
      } else if (event.name === GRANT_BUTTON) {
        await snapsProvider.request({
          method: 'snap_resolveInterface',
          params: {
            id: activeInterfaceId,
            value: {
              ...attenuatedResponse,
              isConfirmed: true,
            },
          },
        });
        didInterfaceResolve = true;
      }

      return didInterfaceResolve;
    },
    updateInterface: async (
      id: string,
      context: PermissionConfirmationContext<SupportedPermissionTypes>,
      permissionConfirmation: GenericSnapElement,
    ) => {
      await snapsProvider.request({
        method: 'snap_updateInterface',
        params: {
          id,
          context,
          ui: buildInterfaceUi(permissionConfirmation),
        },
      });
    },
  };
};
