import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Json, SnapsProvider } from '@metamask/snaps-sdk';

import type { AccountControllerInterface } from '../accountController';
import type { GrantPermissionContext } from '../ui/grant-permission';
import { GrantPermissonPage } from '../ui/grant-permission';

export class RpcHandler {
  #orchestratorFactory: Record<string, never>;

  #accountController: AccountControllerInterface;

  #snapsProvider: SnapsProvider;

  constructor(params: {
    accountController: AccountControllerInterface;
    orchestratorFactory: Record<string, never>;
    snapsProvider: SnapsProvider;
  }) {
    this.#accountController = params.accountController;
    this.#orchestratorFactory = params.orchestratorFactory;
    this.#snapsProvider = params.snapsProvider;
  }

  public async ping(_?: Json): Promise<Json> {
    logger.debug('ping');
    return 'pong';
  }

  public async grantPermission(params?: Json): Promise<Json> {
    // todo: in reality the majority of this method would be something like:
    // const responses = permissionRequest.permissionsRequest.map(async (request) =>
    //  createPermissionOrchestrator(request.permission.type)
    //  .orchestrate(request))

    logger.debug('grantPermissions()', params);

    const { permissionsRequest, siteOrigin } = params as unknown as any;

    const firstRequest = permissionsRequest[0];
    if (!firstRequest) {
      throw new Error('No permission request found');
    }

    const context: GrantPermissionContext = {
      siteOrigin,
      permissionRequest: firstRequest,
    };

    const chainId = Number(firstRequest.chainId);

    const accountAddress = await this.#accountController.getAccountAddress({
      chainId,
    });

    const didUserGrantPermission = await this.#snapsProvider.request({
      method: 'snap_dialog',
      params: {
        type: 'confirmation',
        content: GrantPermissonPage({
          siteOrigin: context.siteOrigin,
          permission: context.permissionRequest.permission,
          accountAddress,
          chainId,
        }),
      },
    });

    logger.debug('isPermissionGranted', didUserGrantPermission);

    // just a placeholder for now
    return (
      didUserGrantPermission ? context : { isPermissionGranted: false }
    ) as Json;
  }
}
