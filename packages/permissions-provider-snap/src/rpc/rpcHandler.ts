import type { Json } from '@metamask/snaps-sdk';
import type { Logger } from '@metamask/7715-permissions-shared';
import type { SnapsProvider } from '@metamask/snaps-sdk';

export class RpcHandler {
  #snapsProvider: SnapsProvider;
  #accountController: {};
  #logger: Logger;

  constructor(params: {
    snapsProvider: SnapsProvider;
    accountController: Object;
    logger: Logger;
  }) {
    this.#snapsProvider = params.snapsProvider;
    this.#accountController = params.accountController;
    this.#logger = params.logger;
  }

  public async ping(_?: Json) {
    return 'pong';
  }
}
