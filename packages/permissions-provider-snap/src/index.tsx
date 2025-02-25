import type {
  Json,
  OnInstallHandler,
  OnUpdateHandler,
  OnUserInputHandler,
  UserInputEvent,
} from '@metamask/snaps-sdk';
import {
  UserInputEventType,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';
import type { Address, Hex } from 'viem';
import { getAddress } from 'viem';

import type { PermissionsRequestIterator } from './iterator';
import { createPermissionsRequestIterator } from './iterator';
import { hasPermission, InternalMethod } from './permissions';
import { saveInterfaceIdState, getInterfaceIdState } from './stateManagement';
import type { GrantPermissionsContext } from './ui';
import {
  ACCOUNT_SELECTOR,
  GRANT_BUTTON,
  GrantPermissionsPage,
  CANCEL_BUTTON,
  NEXT_BUTTON,
  PREVIOUS_BUTTON,
} from './ui';
import { updateAccountsOrder, validatePermissionRequestParam } from './utils';
import { Logger, LogLevel } from './logger';
import { Signer } from './account/signer';
import { AccountController } from './account/accountController';
import { sepolia } from 'viem/chains';

// Global iterator to keep track of the current permission request create on each request
let permissionsRequestIterator: PermissionsRequestIterator =
  createPermissionsRequestIterator([]);

const logger = new Logger({
  threshold: LogLevel.DEBUG,
});

const accountController = new AccountController({
  snapsProvider: snap,
  signer: new Signer({
    snapsProvider: snap,
    logger,
  }),
  supportedChains: [sepolia],
  deploymentSalt: '0x',
  logger,
});

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

      permissionsRequestIterator =
        createPermissionsRequestIterator(permissionsRequest);
      permissionsRequestIterator.first();

      // TODO: Intepret the permissions data(by type) and reject if token data is not valid

      // Request access to view users extension accounts
      const res = await ethereum.request<Hex[]>({
        method: 'eth_requestAccounts',
      });
      if (!res || res.length === 0) {
        throw new Error('No accounts found');
      }
      const userAccounts: Address[] = res
        .filter((account) => account !== undefined)
        .map(getAddress);

      // Render permission picker UI
      const interfaceId = await snap.request({
        method: 'snap_createInterface',
        params: {
          context: {
            siteOrigin,
            accounts: userAccounts,
          } as GrantPermissionsContext,
          ui: (
            <GrantPermissionsPage
              permissionRequestIteratorItem={permissionsRequestIterator.currentItem()}
              accounts={userAccounts}
              siteOrigin={siteOrigin}
              areAllSettled={
                permissionsRequestIterator.areAllSettled() ||
                permissionsRequestIterator.isLast()
              }
              iteratorItemMetadata={{
                isFirst: permissionsRequestIterator.isFirst(),
                isLast: permissionsRequestIterator.isLast(),
                permissionIndex: permissionsRequestIterator.currentIndex(),
              }}
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
 * Handle input change events to update the interface.
 *
 * @param event - The input change event.
 */
const inputChangeEventHandler = (event: UserInputEvent) => {
  if (event.type !== UserInputEventType.InputChangeEvent) {
    throw new Error('Invalid event type');
  }

  if (
    event.name ===
      `${ACCOUNT_SELECTOR}-${permissionsRequestIterator.currentIndex()}` &&
    event.value &&
    typeof event.value === 'string'
  ) {
    permissionsRequestIterator.updateCurrentItem((item) => {
      return {
        ...item,
        permissionRequest: {
          ...item.permissionRequest,
          account: getAddress(event.value as string),
        },
      };
    });
  }
};

/**
 * Handle button click events to update the interface.
 *
 * @param event - The button click event.
 * @param activeInterfaceId - The active interface id.
 */
const buttonClickEventHandler = async (
  event: UserInputEvent,
  activeInterfaceId: string,
) => {
  if (event.type !== UserInputEventType.ButtonClickEvent) {
    throw new Error('Invalid event type');
  }

  if (event.name === CANCEL_BUTTON) {
    await snap.request({
      method: 'snap_resolveInterface',
      params: {
        id: activeInterfaceId,
        value: null,
      },
    });
    return;
  }

  if (event.name === GRANT_BUTTON) {
    const grantResponses = permissionsRequestIterator.getItems();
    await snap.request({
      method: 'snap_resolveInterface',
      params: {
        id: activeInterfaceId,
        value: grantResponses as Json[],
      },
    });
    return;
  }

  if (event.name === NEXT_BUTTON) {
    permissionsRequestIterator.settleAndMoveNext();
  } else if (event.name === PREVIOUS_BUTTON) {
    permissionsRequestIterator.settleAndMovePrevious();
  }
};

/**
 * Handle incoming user input events to update the interface.
 *
 * @param args - The user input handler args as object.
 * @param args.id - The id of the interface.
 * @param args.event - The user input event.
 */
export const onUserInput: OnUserInputHandler = async ({ id, event }) => {
  const activeInterfaceId = await getInterfaceIdState();
  const context = await snap.request({
    method: 'snap_getInterfaceContext',
    params: {
      id: activeInterfaceId,
    },
  });

  if (id === activeInterfaceId && context) {
    switch (event.type) {
      case UserInputEventType.InputChangeEvent: {
        inputChangeEventHandler(event);
        break;
      }

      case UserInputEventType.ButtonClickEvent: {
        await buttonClickEventHandler(event, activeInterfaceId);
        break;
      }
      default: {
        return;
      }
    }

    const { siteOrigin, accounts } = context as GrantPermissionsContext;
    const updatedAccountsOrder: Address[] = updateAccountsOrder(
      accounts,
      permissionsRequestIterator.currentItem(),
    );

    await snap.request({
      method: 'snap_updateInterface',
      params: {
        id,
        context,
        ui: (
          <GrantPermissionsPage
            permissionRequestIteratorItem={permissionsRequestIterator.currentItem()}
            siteOrigin={siteOrigin}
            accounts={updatedAccountsOrder}
            areAllSettled={
              permissionsRequestIterator.areAllSettled() ||
              permissionsRequestIterator.isLast()
            }
            iteratorItemMetadata={{
              isFirst: permissionsRequestIterator.isFirst(),
              isLast: permissionsRequestIterator.isLast(),
              permissionIndex: permissionsRequestIterator.currentIndex(),
            }}
          />
        ),
      },
    });
  }
};
