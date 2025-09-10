/* eslint-disable no-restricted-globals */
import type { GetSnapsResponse } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import {
  AuthType,
  JwtBearerAuth,
  Platform,
  UserStorage,
} from '@metamask/profile-sync-controller/sdk';
import {
  type OnInstallHandler,
  type Json,
  type JsonRpcParams,
  type OnRpcRequestHandler,
  type OnUserInputHandler,
  MethodNotFoundError,
  InvalidRequestError,
  InternalError,
} from '@metamask/snaps-sdk';

import { AccountApiClient } from './clients/accountApiClient';
import { BlockchainTokenMetadataClient } from './clients/blockchainMetadataClient';
import { NonceCaveatClient } from './clients/nonceCaveatClient';
import { PriceApiClient } from './clients/priceApiClient';
import { AccountController } from './core/accountController';
import { ConfirmationDialogFactory } from './core/confirmationFactory';
import { PermissionHandlerFactory } from './core/permissionHandlerFactory';
import { PermissionRequestLifecycleOrchestrator } from './core/permissionRequestLifecycleOrchestrator';
import {
  createProfileSyncOptions,
  getProfileSyncSdkEnv,
  createProfileSyncManager,
} from './profileSync';
import { isMethodAllowedForOrigin } from './rpc/permissions';
import { createRpcHandler } from './rpc/rpcHandler';
import { RpcMethod } from './rpc/rpcMethod';
import { NonceCaveatService } from './services/nonceCaveatService';
import { TokenMetadataService } from './services/tokenMetadataService';
import { TokenPricesService } from './services/tokenPricesService';
import { createStateManager } from './stateManagement';
import { UserEventDispatcher } from './userEventDispatcher';

const isStorePermissionsFeatureEnabled =
  process.env.STORE_PERMISSIONS_ENABLED === 'true';

const snapEnv = process.env.SNAP_ENV;

const accountApiBaseUrl = process.env.ACCOUNT_API_BASE_URL;

if (!accountApiBaseUrl) {
  throw new InternalError('ACCOUNT_API_BASE_URL is not set');
}

const priceApiBaseUrl = process.env.PRICE_API_BASE_URL;
if (!priceApiBaseUrl) {
  throw new InternalError('PRICE_API_BASE_URL is not set');
}

const supportedChainsString = process.env.SUPPORTED_CHAINS;
if (!supportedChainsString) {
  throw new InternalError('SUPPORTED_CHAINS is not set');
}

const messageSigningSnapId = process.env.MESSAGE_SIGNING_SNAP_ID;
if (!messageSigningSnapId) {
  throw new InternalError('MESSAGE_SIGNING_SNAP_ID is not set');
}

const supportedChains = supportedChainsString.split(',').map(Number);

// set up dependencies

const accountApiClient = new AccountApiClient({
  baseUrl: accountApiBaseUrl,
});

const tokenMetadataClient = new BlockchainTokenMetadataClient({
  ethereumProvider: ethereum,
});

const tokenMetadataService = new TokenMetadataService({
  accountApiClient,
  tokenMetadataClient,
});

const nonceCaveatClient = new NonceCaveatClient({
  ethereumProvider: ethereum,
});

const nonceCaveatService = new NonceCaveatService({
  nonceCaveatClient,
});

const accountController = new AccountController({
  snapsProvider: snap,
  ethereumProvider: ethereum,
});

const stateManager = createStateManager(snap);

const profileSyncOptions = createProfileSyncOptions(
  stateManager,
  snap,
  messageSigningSnapId,
);

const profileSyncSdkEnv = getProfileSyncSdkEnv(snapEnv);

const auth = new JwtBearerAuth(
  {
    type: AuthType.SRP,
    platform: Platform.EXTENSION,
    env: profileSyncSdkEnv,
  },
  {
    storage: profileSyncOptions.authStorageOptions,
    signing: profileSyncOptions.authSigningOptions,
  },
);

const profileSyncManager = createProfileSyncManager({
  isFeatureEnabled: isStorePermissionsFeatureEnabled,
  auth,
  userStorage: new UserStorage(
    {
      auth,
      env: profileSyncSdkEnv,
    },
    {
      storage: profileSyncOptions.keyStorageOptions,
    },
  ),
});

const userEventDispatcher = new UserEventDispatcher();

const priceApiClient = new PriceApiClient(priceApiBaseUrl);

const tokenPricesService = new TokenPricesService(priceApiClient, snap);

const confirmationDialogFactory = new ConfirmationDialogFactory({
  snap,
  userEventDispatcher,
});

const orchestrator = new PermissionRequestLifecycleOrchestrator({
  accountController,
  confirmationDialogFactory,
  userEventDispatcher,
  nonceCaveatService,
  supportedChains,
});

const permissionHandlerFactory = new PermissionHandlerFactory({
  accountController,
  tokenPricesService,
  tokenMetadataService,
  userEventDispatcher,
  orchestrator,
});

const rpcHandler = createRpcHandler({
  permissionHandlerFactory,
  profileSyncManager,
});

// configure RPC methods bindings
const boundRpcHandlers: {
  [RpcMethod: string]: (params?: JsonRpcParams) => Promise<Json>;
} = {
  [RpcMethod.PermissionProviderGrantPermissions]:
    rpcHandler.grantPermission.bind(rpcHandler),
  [RpcMethod.PermissionProviderGetPermissionOffers]:
    rpcHandler.getPermissionOffers.bind(rpcHandler),
  [RpcMethod.PermissionProviderGetGrantedPermissions]:
    rpcHandler.getGrantedPermissions.bind(rpcHandler),
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
  logger.debug(`RPC request (origin="${origin}"): method="${request.method}"`);

  if (!isMethodAllowedForOrigin(origin, request.method)) {
    throw new InvalidRequestError(
      `Origin '${origin}' is not allowed to call '${request.method}'`,
    );
  }

  const handler = boundRpcHandlers[request.method];

  if (!handler) {
    throw new MethodNotFoundError(`Method ${request.method} not found.`);
  }

  const result = await handler(request.params);

  return result;
};

/**
 * Handle incoming user input events.
 *
 * @param args - The user input handler args as object.
 * @param args.id - The id of the interface.
 * @param args.event - The user input event.
 * @returns Resolves once any registered event handlers have completed.
 */
export const onUserInput: OnUserInputHandler =
  userEventDispatcher.createUserInputEventHandler();

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
if (snapEnv === 'local') {
  const installHandler: OnInstallHandler = async () => {
    if (isStorePermissionsFeatureEnabled) {
      const installedSnaps = (await snap.request({
        method: 'wallet_getSnaps',
      })) as unknown as GetSnapsResponse;
      if (!installedSnaps[messageSigningSnapId]) {
        logger.debug('Installing local message signing snap');
        await snap.request({
          method: 'wallet_requestSnaps',
          params: {
            [messageSigningSnapId]: {},
          },
        });
      }
    }
  };

  // Export onInstall for local development only
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).onInstall = installHandler;
}
