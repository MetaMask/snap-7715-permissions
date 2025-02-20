import type {
  InterfaceContext,
  OnInstallHandler,
  OnUpdateHandler,
  OnUserInputHandler,
} from '@metamask/snaps-sdk';
import {
  UserInputEventType,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';
import type { Address } from 'viem';
import { getAddress } from 'viem';

import { logger } from './logger';
import { hasPermission, InternalMethod } from './permissions';
import { saveInterfaceIdState } from './stateManagement';
import type { GrantPermissionContext } from './ui';
import { GrantPermissonPage } from './ui';
import {
  buttonClickEventHandler,
  getActiveInterfaceContext,
  validatePermissionRequestParam,
} from './utils';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of the request.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  logger.info(
    `Custom request (origin="${origin}"):`,
    JSON.stringify(request, undefined, 2),
  );

  if (!hasPermission(origin, request.method)) {
    throw new Error(
      `Origin '${origin}' is not allowed to call '${request.method}'`,
    );
  }

  switch (request.method) {
    case InternalMethod.PermissionProviderGrantAttenuatedPermissions: {
      const { permissionsRequest, siteOrigin } = validatePermissionRequestParam(
        request.params,
      );

      const firstRequest = permissionsRequest[0];
      if (!firstRequest) {
        throw new Error('No permission request found');
      }

      const userAccounts: Address[] = [
        getAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8'),
      ];
      const context: GrantPermissionContext = {
        siteOrigin,
        accounts: userAccounts,
        permissionRequest: firstRequest,
      };

      // Render permission picker UI mock
      const interfaceId = await snap.request({
        method: 'snap_createInterface',
        params: {
          context: context as InterfaceContext,
          ui: (
            <GrantPermissonPage
              accounts={context.accounts}
              siteOrigin={context.siteOrigin}
              permission={context.permissionRequest.permission}
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

      await saveInterfaceIdState('');
      return permissionsRes;
    }
    default: {
      throw new Error(request.method);
    }
  }
};

/**
 * OnInstall is called when the snap installs and it used to offer its cryptographic abilities as permissions to the kernel snap.
 */
export const onInstall: OnInstallHandler = async () => {
  //
};

/**
 * OnUpdate is called when the snap version updates and it used to update cryptographic abilities as permissions its to the kernel snap.
 */
export const onUpdate: OnUpdateHandler = async () => {
  //
};

/**
 * Handle incoming user input events to update the interface.
 *
 * @param args - The user input handler args as object.
 * @param args.id - The id of the interface.
 * @param args.event - The user input event.
 */
export const onUserInput: OnUserInputHandler = async ({ id, event }) => {
  const { activeInterfaceId, context } = await getActiveInterfaceContext();
  if (id === activeInterfaceId && context) {
    switch (event.type) {
      case UserInputEventType.ButtonClickEvent: {
        await buttonClickEventHandler(event, activeInterfaceId);
        break;
      }
      default: {
        return;
      }
    }

    await snap.request({
      method: 'snap_updateInterface',
      params: {
        id,
        context: context as InterfaceContext,
        ui: (
          <GrantPermissonPage
            accounts={context.accounts}
            siteOrigin={context.siteOrigin}
            permission={context.permissionRequest.permission}
          />
        ),
      },
    });
  }
};
