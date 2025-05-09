/* eslint-disable no-restricted-globals */
import { MESSAGE_SIGNING_SNAP_ID } from '@metamask/7715-permissions-shared/constants';
import { logger } from '@metamask/7715-permissions-shared/utils';
import {
  AuthType,
  JwtBearerAuth,
  Platform,
  UserStorage,
} from '@metamask/profile-sync-controller/sdk';
import type {
  OnHomePageHandler,
  OnInstallHandler,
  Json,
  JsonRpcParams,
  OnRpcRequestHandler,
  OnUserInputHandler,
} from '@metamask/snaps-sdk';
import { lineaSepolia, sepolia } from 'viem/chains';

import { AccountController } from './accountController';
import { PriceApiClient } from './clients';
import { HomePage } from './homepage';
import { createPermissionsContextBuilder } from './orchestrators';
import {
  createProfileSyncManager,
  createProfileSyncOptions,
  getProfileSyncSdkEnv,
} from './profileSync';
import { isMethodAllowedForOrigin } from './rpc/permissions';
import { createRpcHandler } from './rpc/rpcHandler';
import { RpcMethod } from './rpc/rpcMethod';
import { TokenPricesService } from './services';
import { createStateManager } from './stateManagement';
import { createPermissionConfirmationRenderHandler } from './ui';
import { UserEventDispatcher } from './userEventDispatcher';

// set up dependencies
const accountController = new AccountController({
  snapsProvider: snap,
  supportedChains: [sepolia, lineaSepolia],
  deploymentSalt: '0x',
});

const stateManager = createStateManager(snap);
const profileSyncOptions = createProfileSyncOptions(stateManager, snap);

const auth = new JwtBearerAuth(
  {
    type: AuthType.SRP,
    platform: Platform.EXTENSION,
    env: getProfileSyncSdkEnv(process.env.SNAP_ENV),
  },
  {
    storage: profileSyncOptions.authStorageOptions,
    signing: profileSyncOptions.authSigningOptions,
  },
);

const profileSyncManager = createProfileSyncManager({
  auth,
  userStorage: new UserStorage(
    {
      auth,
      env: getProfileSyncSdkEnv(process.env.SNAP_ENV),
    },
    {
      storage: profileSyncOptions.keyStorageOptions,
    },
  ),
});

const homepage = new HomePage({
  accountController,
  snapsProvider: snap,
  profileSyncManager,
});

const userEventDispatcher = new UserEventDispatcher();

const permissionConfirmationRenderHandler =
  createPermissionConfirmationRenderHandler({
    snapsProvider: snap,
    userEventDispatcher,
  });

// eslint-disable-next-line no-restricted-globals
const priceApiClient = new PriceApiClient(process.env.PRICE_API_BASE_URL ?? '');
const tokenPricesService = new TokenPricesService(priceApiClient, snap);

const rpcHandler = createRpcHandler({
  accountController,
  permissionConfirmationRenderHandler,
  permissionsContextBuilder: createPermissionsContextBuilder(accountController),
  tokenPricesService,
  userEventDispatcher,
  profileSyncManager,
});

// configure RPC methods bindings
const boundRpcHandlers: {
  [RpcMethod: string]: (params?: JsonRpcParams) => Promise<Json>;
} = {
  [RpcMethod.PermissionProviderGrantAttenuatedPermissions]:
    rpcHandler.grantPermission.bind(rpcHandler),
};

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of the request.
 * @throws If the request method is not valid for this snap, or the origin is not allowed to call the method.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  logger.debug(
    `RPC request (origin="${origin}"):`,
    JSON.stringify(request, undefined, 2),
  );

  if (!isMethodAllowedForOrigin(origin, request.method)) {
    throw new Error(
      `Origin '${origin}' is not allowed to call '${request.method}'`,
    );
  }

  const handler = boundRpcHandlers[request.method];

  if (!handler) {
    throw new Error(`Method ${request.method} not found.`);
  }

  return await handler(request.params);
};

/**
 * Handle incoming user input events.
 *
 * @param args - The user input handler args as object.
 * @param args.id - The id of the interface.
 * @param args.event - The user input event.
 * @returns Resolves once any registered event handlers have completed.
 */
export const onUserInput: OnUserInputHandler = async (args) =>
  userEventDispatcher.handleUserInputEvent(args);

export const onHomePage: OnHomePageHandler = async () => {
  return {
    content: await homepage.buildHomepage(),
  };
};

export const onInstall: OnInstallHandler = async () => {
  /**
   * Local Development Only
   *
   * The message signing snap must be installed and the gator permissions snap must
   * have permission to communicate with the message signing snap, or the request is rejected.
   *
   * Since the message signing snap is preinstalled in production, and has
   * initialConnections configured to automatically connect to the gator snap, this is not needed in production.
   */
  // eslint-disable-next-line no-restricted-globals
  if (process.env.SNAP_ENV === 'local') {
    const installedSnaps = (await snap.request({
      method: 'wallet_getSnaps',
    })) as unknown as any;
    if (!installedSnaps[MESSAGE_SIGNING_SNAP_ID]) {
      logger.debug('Installing local message signing snap');
      await snap.request({
        method: 'wallet_requestSnaps',
        params: {
          [MESSAGE_SIGNING_SNAP_ID]: {},
        },
      });
    }
  }

  await homepage.showWelcomeScreen();
};
