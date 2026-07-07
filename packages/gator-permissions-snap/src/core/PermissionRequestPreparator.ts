import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import {
  extractDescriptorName,
  logger,
} from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError, ResourceNotFoundError } from '@metamask/snaps-sdk';
import { hexToNumber } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type { AccountController } from './accountController';
import { getChainMetadata } from './chainMetadata';
import { normalizePermissionRequestWithSentinelRedeemerRule } from './sentinelRedeemer';
import type { PermissionRequestResult } from './types';
import type { SnapsMetricsService } from '../services/snapsMetricsService';

/**
 * Outcome of preparing a permission request before confirmation UI.
 */
export type PermissionRequestPreparationResult<
  TRequest extends PermissionRequest,
> =
  | {
      ok: true;
      normalizedRequest: TRequest;
      chainId: number;
      permissionType: string;
    }
  | { ok: false; result: PermissionRequestResult };

/**
 * Validates chain support, parses the request, applies sentinel redeemer rules,
 * resolves the granting address, and records request-start metrics.
 */
export class PermissionRequestPreparator {
  readonly #accountController: AccountController;

  readonly #snapsMetricsService: SnapsMetricsService;

  constructor({
    accountController,
    snapsMetricsService,
  }: {
    accountController: AccountController;
    snapsMetricsService: SnapsMetricsService;
  }) {
    this.#accountController = accountController;
    this.#snapsMetricsService = snapsMetricsService;
  }

  /**
   * Prepares a permission request before confirmation UI.
   *
   * @param args - Origin, raw request, and permission-specific parse/validate handler.
   * @param args.origin - Site origin for the permission request.
   * @param args.permissionRequest - Raw permission request from the RPC handler.
   * @param args.parseAndValidate - Permission-specific parse and validate function.
   * @returns Normalized request metadata or a rejected result.
   */
  async prepare<TRequest extends PermissionRequest>(args: {
    origin: string;
    permissionRequest: PermissionRequest;
    parseAndValidate: (request: PermissionRequest) => TRequest;
  }): Promise<PermissionRequestPreparationResult<TRequest>> {
    const { origin, permissionRequest, parseAndValidate } = args;

    const chainId = hexToNumber(permissionRequest.chainId);
    this.#assertIsSupportedChainId(chainId);

    const permissionType = extractDescriptorName(
      permissionRequest.permission.type,
    );

    await this.#snapsMetricsService.trackPermissionRequestStarted({
      origin,
      permissionType,
      chainId: permissionRequest.chainId,
      permissionData: permissionRequest.permission.data,
    });

    const validatedPermissionRequest = parseAndValidate(permissionRequest);
    const normalizedPermissionRequest =
      normalizePermissionRequestWithSentinelRedeemerRule({
        origin,
        permissionRequest: validatedPermissionRequest,
        chainId,
      });

    const requestWithFrom = await this.#resolveFromAddress(
      normalizedPermissionRequest,
    );

    return {
      ok: true,
      normalizedRequest: requestWithFrom,
      chainId,
      permissionType,
    };
  }

  /**
   * Asserts that the specified chain ID is supported.
   *
   * @param chainId - The chain ID to validate.
   * @throws If the chain ID is not supported.
   */
  #assertIsSupportedChainId(chainId: number): void {
    try {
      getChainMetadata({ chainId });
    } catch (error) {
      logger.error(
        'PermissionRequestPreparator:assertIsSupportedChainId() - unsupported chainId',
        {
          chainId,
          error,
        },
      );
      throw new InvalidParamsError(`Unsupported ChainId: ${chainId}`);
    }
  }

  /**
   * Resolves and validates the granting address on the permission request.
   *
   * @param request - Validated permission request.
   * @returns Request with `from` set to a valid account address.
   * @throws If a requested address is not available for the account.
   */
  async #resolveFromAddress<TRequest extends PermissionRequest>(
    request: TRequest,
  ): Promise<TRequest> {
    const requestedAddressLowercase = request.from?.toLowerCase() as
      | Hex
      | undefined;

    const allAvailableAddresses =
      await this.#accountController.getAccountAddresses();

    let from: Hex;

    if (requestedAddressLowercase) {
      if (
        !allAvailableAddresses.some(
          (availableAddress) =>
            availableAddress.toLowerCase() === requestedAddressLowercase,
        )
      ) {
        throw new ResourceNotFoundError('Requested address not found');
      }
      from = request.from as Hex;
    } else {
      from = allAvailableAddresses[0];
    }

    return { ...request, from };
  }
}
