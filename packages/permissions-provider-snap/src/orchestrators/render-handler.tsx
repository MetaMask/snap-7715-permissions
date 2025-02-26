import type { SnapsProvider } from '@metamask/snaps-sdk';

import { saveInterfaceIdState } from '../stateManagement';
import type { PermissionConfirmationContext } from '../ui';
import { PermissionConfirmationPage } from '../ui';

export const handleConfirmationRender = async (
  snapsProvider: SnapsProvider,
  context: PermissionConfirmationContext,
) => {
  const interfaceId = await snapsProvider.request({
    method: 'snap_createInterface',
    params: {
      context,
      ui: (
        <PermissionConfirmationPage
          siteOrigin={context.siteOrigin}
          permission={context.permission as any}
          balance={context.balance}
          expiry={context.expiry}
          delegation={context.delegation}
        />
      ),
    },
  });

  await saveInterfaceIdState(interfaceId);

  const permissionsRes = await snap.request({
    method: 'snap_dialog',
    params: {
      id: interfaceId,
    },
  });

  if (!permissionsRes) {
    throw new Error('User rejected the permissions request');
  }

  return permissionsRes;
};
