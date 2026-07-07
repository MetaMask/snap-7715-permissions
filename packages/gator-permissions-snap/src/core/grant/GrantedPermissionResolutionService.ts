import type {
  Dependency,
  PermissionRequest,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import type { Delegation } from '@metamask/delegation-core';
import {
  createNonceTerms,
  encodeDelegations,
  ROOT_AUTHORITY,
} from '@metamask/delegation-core';
import { InvalidInputError } from '@metamask/snaps-sdk';
import { bigIntToHex, bytesToHex, numberToHex } from '@metamask/utils';

import type { NonceCaveatService } from '../../services/nonceCaveatService';
import type { SnapsMetricsService } from '../../services/snapsMetricsService';
import type { AccountController } from '../accountController';
import { getChainMetadata } from '../chainMetadata';
import { appendExpiryCaveatIfPresent } from '../expiryCaveat';
import { appendPayeeCaveatIfPresent } from '../payeeCaveat';
import type { PermissionGrantLifecycleHandlers } from '../permission/PermissionGrantLifecycleHandlers';
import { appendRedeemerCaveatIfPresent } from '../redeemerCaveat';
import type { BaseContext, DeepRequired } from '../types';

/**
 * Resolves an approved permission request into a signed delegation response.
 */
export class GrantedPermissionResolutionService {
  readonly #accountController: AccountController;

  readonly #nonceCaveatService: NonceCaveatService;

  readonly #snapsMetricsService: SnapsMetricsService;

  constructor({
    accountController,
    nonceCaveatService,
    snapsMetricsService,
  }: {
    accountController: AccountController;
    nonceCaveatService: NonceCaveatService;
    snapsMetricsService: SnapsMetricsService;
  }) {
    this.#accountController = accountController;
    this.#nonceCaveatService = nonceCaveatService;
    this.#snapsMetricsService = snapsMetricsService;
  }

  /**
   * Resolves a permission request into a final permission response.
   * @template TRequest - Type of permission request
   * @template TContext - Type of context for the permission request.
   * @template TMetadata - Type of metadata associated with the permission request.
   * @template TPermission - Type of permission being requested.
   * @template TPopulatedPermission - Type of fully populated permission with all required fields.
   * @param args - Parameters for resolving the response.
   * @param args.originalRequest - The original unmodified permission request.
   * @param args.modifiedContext - The possibly modified context after user interaction.
   * @param args.isAdjustmentAllowed - Whether the permission can be adjusted.
   * @param args.chainId - The chain ID for the permission.
   * @param args.origin - The origin of the permission request.
   * @param args.lifecycleHandlers - Handlers for the permission lifecycle.
   * @returns The resolved permission response.
   */
  async resolve<
    TRequest extends PermissionRequest,
    TContext extends BaseContext,
    TMetadata extends object,
    TPermission extends TRequest['permission'],
    TPopulatedPermission extends DeepRequired<TPermission>,
  >({
    originalRequest,
    modifiedContext,
    isAdjustmentAllowed,
    chainId,
    origin,
    lifecycleHandlers,
  }: {
    origin: string;
    chainId: number;
    originalRequest: TRequest;
    modifiedContext: TContext;
    isAdjustmentAllowed: boolean;
    lifecycleHandlers: Pick<
      PermissionGrantLifecycleHandlers<
        TRequest,
        TContext,
        TMetadata,
        TPermission,
        TPopulatedPermission
      >,
      'applyContext' | 'populatePermission' | 'createPermissionCaveats'
    >;
  }): Promise<PermissionResponse> {
    const permissionType = extractDescriptorName(
      originalRequest.permission.type,
    );

    // apply the changes made to the context to the request
    const resolvedRequest = await lifecycleHandlers.applyContext({
      context: modifiedContext,
      originalRequest,
    });

    // populate optional values of the permission
    const populatedPermission = await lifecycleHandlers.populatePermission({
      permission: resolvedRequest.permission as TPermission,
    });

    // the actual permission being granted
    const grantedPermissionRequest = {
      ...resolvedRequest,
      permission: populatedPermission,
      isAdjustmentAllowed,
    };

    const { from, to } = grantedPermissionRequest;
    if (!from) {
      throw new InvalidInputError('Address is undefined');
    }
    if (!to) {
      throw new InvalidInputError('Delegate address is undefined');
    }

    const { contracts } = getChainMetadata({ chainId });

    const caveats = await lifecycleHandlers.createPermissionCaveats({
      permission: populatedPermission,
      contracts,
    });

    appendExpiryCaveatIfPresent({
      rules: resolvedRequest.rules,
      contracts,
      caveats,
    });

    appendRedeemerCaveatIfPresent({
      rules: resolvedRequest.rules,
      contracts,
      caveats,
    });

    appendPayeeCaveatIfPresent({
      rules: resolvedRequest.rules,
      contracts,
      caveats,
      permissionType,
    });

    const nonce = await this.#nonceCaveatService.getNonce({
      chainId,
      account: from,
    });

    caveats.push({
      enforcer: contracts.nonceEnforcer,
      terms: createNonceTerms({
        nonce: bigIntToHex(nonce),
      }),
      args: '0x',
    });

    // eslint-disable-next-line no-restricted-globals
    const saltBytes = crypto.getRandomValues(new Uint8Array(32));
    const salt = bytesToHex(saltBytes);

    const delegation = {
      delegate: to,
      authority: ROOT_AUTHORITY,
      delegator: from,
      caveats,
      salt: BigInt(salt),
    } as const;

    const { justification } = modifiedContext;

    let signedDelegation: Delegation;
    let signingSuccess = false;
    let signingError: Error | undefined;
    try {
      signedDelegation = await this.#accountController.signDelegation({
        chainId,
        delegation,
        address: from,
        origin,
        justification,
      });
      signingSuccess = true;
    } catch (error) {
      signingError = error as Error;
      throw error;
    } finally {
      // Track delegation signing result
      await this.#snapsMetricsService.trackDelegationSigning({
        origin,
        permissionType,
        success: signingSuccess,
        ...(signingError && { errorMessage: signingError.message }),
      });
    }

    const context = encodeDelegations([signedDelegation], { out: 'hex' });

    // dependencies is always empty for EIP-7702 accounts
    const dependencies: Dependency[] = [];

    const response: PermissionResponse = {
      ...grantedPermissionRequest,
      chainId: numberToHex(chainId),
      from,
      dependencies,
      context,
      delegationManager: contracts.delegationManager,
    };

    // Track successful permission grant
    await this.#snapsMetricsService.trackPermissionGranted({
      origin,
      permissionType,
      chainId: numberToHex(chainId),
      permissionData: populatedPermission.data,
      justification: modifiedContext.justification,
      isAdjustmentAllowed,
    });

    return response;
  }
}
