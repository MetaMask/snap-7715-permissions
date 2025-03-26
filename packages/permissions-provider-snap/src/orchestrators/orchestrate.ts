import { createCaveatBuilder } from '@metamask-private/delegator-core-viem';
import { fromHex, type Hex } from 'viem';

import type { AccountControllerInterface } from '../accountController';
import type {
  PermissionConfirmationContext,
  PermissionConfirmationRenderHandler,
} from '../ui';
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
  } = orchestrateArgs;
  const { chainId, sessionAccount, origin, expiry, permission } =
    orchestrateMeta;
  const chainIdNum = fromHex(chainId, 'number');

  // Get the user account details
  const [address, balance] = await prepareAccountDetails(
    accountController,
    fromHex(chainId, 'number'),
  );

  // Prepare specific context object and confirmation page for the permission type
  const uiContext: PermissionConfirmationContext<TPermissionType> = {
    permission,
    permissionRules: {},
    address,
    siteOrigin: origin,
    balance,
    chainId: chainIdNum,
    expiry,
  };

  const permissionDialog = orchestrator.buildPermissionConfirmation(uiContext);

  const { confirmationResult } =
    await permissionConfirmationRenderHandler.createConfirmationDialog(
      uiContext,
      permissionDialog,
      permissionType,
    );

  const isConfirmationAccepted = await confirmationResult;

  const { permission: attenuatedPermission, expiry: attenuatedExpiry } =
    await orchestrator.resolveAttenuatedPermission({
      requestedPermission: permission,
      requestedExpiry: expiry,
    });

  if (!isConfirmationAccepted) {
    return {
      success: false,
      reason: 'User rejected the permissions request',
    };
  }

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

  return {
    success: true,
    response: {
      chainId,
      address,
      expiry: attenuatedExpiry,
      signer: {
        type: 'account',
        data: {
          address: sessionAccount,
        },
      },
      permissions: [attenuatedPermission],
      context: permissionContext,
      accountMeta:
        accountMeta.factory && accountMeta.factoryData
          ? [accountMeta]
          : undefined,
      signerMeta: {
        delegationManager,
      },
    },
  } as OrchestrateResult;
};
