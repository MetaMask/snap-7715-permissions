import { fromHex, type Hex } from 'viem';

import type { MockAccountController } from '../accountController.mock';
import type {
  PermissionConfirmationContext,
  PermissionConfirmationRenderHandler,
} from '../ui';
import type { SupportedPermissionTypes } from './orchestrator';
import type { OrchestrateMeta, OrchestrateResult, Orchestrator } from './types';

/**
 * Prepare the account details for the permission picker UI.
 * @param accountController - An account controller instance.
 * @param chainId - The chain ID.
 * @returns The account address, balance.
 */
const prepareAccountDetails = async (
  accountController: MockAccountController,
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
 * @param permissionType - The permission type.
 * @param accountController - An account controller instance.
 * @param orchestrator - The permission orchestrator.
 * @param orchestrateMeta - The permission orchestration metadata.
 * @param permissionConfirmationRenderHandler - The permission confirmation render handler.
 * @returns The permission response.
 * @throws If the permission request cannot be orchestrated(ie. user denies the request, internal error, etc).
 */
export const orchestrate = async <
  TPermissionType extends SupportedPermissionTypes,
>(
  permissionType: TPermissionType,
  accountController: MockAccountController,
  orchestrator: Orchestrator<TPermissionType>,
  orchestrateMeta: OrchestrateMeta<TPermissionType>,
  permissionConfirmationRenderHandler: PermissionConfirmationRenderHandler,
): Promise<OrchestrateResult> => {
  const { chainId, sessionAccount, origin, expiry, permission } =
    orchestrateMeta;
  const chainIdNum = fromHex(chainId, 'number');

  // Get the user account details
  const [account, balance] = await prepareAccountDetails(
    accountController,
    fromHex(chainId, 'number'),
  );

  // Prepare specific context object and confirmation page for the permission type
  const uiContext: PermissionConfirmationContext<TPermissionType> = {
    permission,
    account,
    siteOrigin: origin,
    balance,
    expiry,
    chainId: chainIdNum,
  };

  const confirmationPage =
    orchestrator.buildPermissionConfirmationPage(uiContext);

  // Wait for the successful permission confirmation reponse from the user
  const { attenuatedPermission, attenuatedExpiry, isConfirmed } =
    await permissionConfirmationRenderHandler.getConfirmedAttenuatedPermission(
      uiContext,
      confirmationPage,
      permissionType,
    );

  if (!isConfirmed) {
    return {
      success: false,
      reason: 'User rejected the permissions request',
    };
  }

  const permissionContext = await orchestrator.buildPermissionContext(
    account,
    sessionAccount,
    chainIdNum,
    attenuatedPermission,
  );

  const accountMeta = await accountController.getAccountMetadata({
    chainId: chainIdNum,
  });

  return {
    success: true,
    response: {
      chainId,
      account,
      expiry: attenuatedExpiry,
      signer: {
        type: 'account',
        data: {
          address: sessionAccount,
        },
      },
      permission: attenuatedPermission,
      context: permissionContext,
      accountMeta:
        accountMeta.factory && accountMeta.factoryData
          ? [accountMeta]
          : undefined,
      signerMeta: {
        delegationManager: '0x000000_delegation_manager', // TODO: Update to use actual values instead of mock values
      },
    },
  } as OrchestrateResult;
};
