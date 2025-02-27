import type { SnapsProvider } from '@metamask/snaps-sdk';

import type { SupportedPermissionTypes } from '../../orchestrators/orchestrator.types';
import { saveInterfaceIdState } from '../../stateManagement';
import { permissionConfirmationPageFactory } from '../ui.factory';
import type {
  PermissionConfirmationContext,
  PreparePermissionConfirmationMeta,
} from '../ui.types';

/**
 * Render the permission confirmation page.
 * @param snapsProvider - The snaps provider instance.
 * @param preparePermissionConfirmationMeta - The meta data required to prepare the permission confirmation page.
 * @returns The granted permission response.
 */
export const renderPermissionConfirmation = async <
  TPermissionType extends SupportedPermissionTypes,
>(
  snapsProvider: SnapsProvider,
  preparePermissionConfirmationMeta: PreparePermissionConfirmationMeta<TPermissionType>,
) => {
  const [context, permissionConfirmationPage] =
    permissionConfirmationPageFactory(preparePermissionConfirmationMeta);

  const interfaceId = await snapsProvider.request({
    method: 'snap_createInterface',
    params: {
      context,
      ui: permissionConfirmationPage,
    },
  });

  await saveInterfaceIdState(interfaceId);

  // The snap_dialog will resolve with the context data after the user confirms
  const attenuatedContext = await snap.request({
    method: 'snap_dialog',
    params: {
      id: interfaceId,
    },
  });

  await saveInterfaceIdState('');

  // If user click cancel, the response will be undefined
  if (!attenuatedContext) {
    throw new Error('User rejected the permissions request');
  }

  // TODO: Validate the response to ensure all confimation return data in the expected format with correct permission type
  return attenuatedContext as PermissionConfirmationContext<TPermissionType>;
};
