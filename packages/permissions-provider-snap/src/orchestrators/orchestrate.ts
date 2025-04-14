import { createCaveatBuilder } from '@metamask/delegation-toolkit';
import { fromHex, type Hex } from 'viem';

import type { AccountControllerInterface } from '../accountController';
import type { TokenPricesService } from '../services';
import {
  type PermissionConfirmationContext,
  type PermissionConfirmationRenderHandler,
} from '../ui';
import type { UserEventDispatcher } from '../userEventDispatcher';
import type { SupportedPermissionTypes } from './orchestrator';
import type { PermissionsContextBuilder } from './permissionsContextBuilder';
import type {
  OrchestrateMeta,
  OrchestrateResult,
  Orchestrator,
  PermissionContextMeta,
} from './types';

/**
 * Arguments for running the orchestrate function.
 */
export type OrchestrateArgs<TPermissionType extends SupportedPermissionTypes> =
  {
    permissionType: TPermissionType;
    accountController: AccountControllerInterface;
    orchestrator: Orchestrator<TPermissionType>;
    orchestrateMeta: OrchestrateMeta<TPermissionType>;
    permissionConfirmationRenderHandler: PermissionConfirmationRenderHandler;
    permissionsContextBuilder: PermissionsContextBuilder;
    tokenPricesService: TokenPricesService;
    userEventDispatcher: UserEventDispatcher;
  };

/**
 * Prepare the account details for the permission picker UI.
 * @param accountController - An account controller instance.
 * @param chainId - The chain ID.
 * @returns The account address, balance.
 */
const prepareAccountDetails = async (
  accountController: AccountControllerInterface,
  chainId: number,
): Promise<[Hex, Hex]> => {
  return await Promise.all([
    accountController.getAccountAddress({
      chainId,
    }),
    accountController.getAccountBalance({
      chainId,
    }),
  ]);
};

/**
 * Orchestrates the permission request for the permission type.
 *
 * @param orchestrateArgs - The orchestrate arguments.
 * @returns The permission response.
 * @throws If the permission request cannot be orchestrated(ie. user denies the request, internal error, etc).
 */
export const orchestrate = async <
  TPermissionType extends SupportedPermissionTypes,
>(
  orchestrateArgs: OrchestrateArgs<TPermissionType>,
): Promise<OrchestrateResult> => {
  const {
    permissionType,
    accountController,
    orchestrator,
    orchestrateMeta,
    permissionConfirmationRenderHandler,
    permissionsContextBuilder,
    tokenPricesService,
    userEventDispatcher,
  } = orchestrateArgs;
  const {
    chainId,
    sessionAccount,
    origin,
    expiry,
    permission,
    isAdjustmentAllowed,
  } = orchestrateMeta;
  const chainIdNum = fromHex(chainId, 'number');
  const caipAssetType = orchestrator.getTokenCaipAssetType(
    permission,
    chainIdNum,
  );

  const [address, balance] = await prepareAccountDetails(
    accountController,
    fromHex(chainId, 'number'),
  );

  const valueFormattedAsCurrency =
    await tokenPricesService.getCryptoToFiatConversion(caipAssetType, balance);

  // Prepare specific context object and confirmation page for the permission type
  const { state, dialogContentEventHandlers } =
    orchestrator.getConfirmationDialogEventHandlers(permission, expiry);

  const uiContext: PermissionConfirmationContext<TPermissionType> = {
    permissionType,
    justification: permission.data.justification,
    address,
    siteOrigin: origin,
    balance,
    chainId: chainIdNum,
    expiry,
    valueFormattedAsCurrency,
    state,
    isAdjustmentAllowed,
  };

  const permissionDialog = orchestrator.buildPermissionConfirmation(uiContext);

  const { confirmationResult, interfaceId } =
    await permissionConfirmationRenderHandler.createConfirmationDialog(
      uiContext,
      permissionDialog,
      permissionType,
    );

  // Register event handlers for confirmation dialog
  if (dialogContentEventHandlers.length > 0) {
    dialogContentEventHandlers.forEach(
      ({ elementName, eventType, handler }) => {
        userEventDispatcher.on({
          elementName,
          eventType,
          interfaceId,
          handler,
        });
      },
    );
  }

  // Wait for the user to accept or reject the permission request
  const { isConfirmationAccepted, attenuatedContext } =
    await confirmationResult;

  if (dialogContentEventHandlers.length > 0) {
    dialogContentEventHandlers.forEach(
      ({ elementName, eventType, handler }) => {
        userEventDispatcher.off({
          elementName,
          eventType,
          interfaceId,
          handler,
        });
      },
    );
  }

  if (!isConfirmationAccepted) {
    return {
      success: false,
      reason: 'User rejected the permissions request',
    };
  }

  // User accepted the permission request, build the response
  const { attenuatedPermission, expiry: attenuatedExpiry } =
    await orchestrator.resolveAttenuatedPermission(
      permission,
      attenuatedContext as PermissionConfirmationContext<TPermissionType>,
    );

  const deleGatorEnvironment = await accountController.getEnvironment({
    chainId: chainIdNum,
  });

  const permissionContextMeta: PermissionContextMeta<TPermissionType> = {
    address,
    sessionAccount,
    chainId: chainIdNum,
    attenuatedPermission,
    caveatBuilder: createCaveatBuilder(deleGatorEnvironment),
  };

  const [updatedCaveatBuilder, accountMeta, delegationManager] =
    await Promise.all([
      orchestrator.appendPermissionCaveats(permissionContextMeta),
      accountController.getAccountMetadata({
        chainId: chainIdNum,
      }),
      accountController.getDelegationManager({
        chainId: chainIdNum,
      }),
    ]);

  // By deferring building the caveats, we can add global caveats such as Expiry
  updatedCaveatBuilder.addCaveat(
    'timestamp',
    0, // timestampAfter
    attenuatedExpiry, // timestampBefore
  );

  const permissionContext =
    await permissionsContextBuilder.buildPermissionsContext({
      address,
      sessionAccount,
      caveats: updatedCaveatBuilder.build(),
      chainId: chainIdNum,
    });

  // todo: RPC failure attempting to serialize response if accountMeta is undefined
  const accountMetaObject =
    accountMeta.factory && accountMeta.factoryData
      ? {
          accountMeta: [accountMeta],
        }
      : {};

  return {
    success: true,
    response: {
      chainId,
      address,
      expiry: attenuatedExpiry,
      isAdjustmentAllowed,
      signer: {
        type: 'account',
        data: {
          address: sessionAccount,
        },
      },
      permission: attenuatedPermission,
      context: permissionContext,
      ...accountMetaObject,
      signerMeta: {
        delegationManager,
      },
    },
  } as OrchestrateResult;
};
