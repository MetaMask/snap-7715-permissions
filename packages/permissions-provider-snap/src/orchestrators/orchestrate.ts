import { fromHex, type Hex } from 'viem';

import type { MockAccountController } from '../accountController.mock';
import type { PermissionConfirmationContext } from '../ui';
import type {
  Orchestrate,
  OrchestrateMeta,
  OrchestrateResult,
  Orchestrator,
  SupportedPermissionTypes,
} from './types';

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

export const orchestrate: Orchestrate = async (
  accountController: MockAccountController,
  orchestrator: Orchestrator<SupportedPermissionTypes>,
  orchestrateMeta: OrchestrateMeta<SupportedPermissionTypes>,
) => {
  const { chainId, sessionAccount, origin, expiry, permission } =
    orchestrateMeta;
  const chainIdNum = fromHex(chainId, 'number');

  // Get the user account details
  const [account, balance] = await prepareAccountDetails(
    accountController,
    fromHex(chainId, 'number'),
  );

  // Prepare specific context object and confirmation page for the permission type
  const uiContext: PermissionConfirmationContext<SupportedPermissionTypes> = {
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
    await orchestrator.getConfirmedAttenuatedPermission(
      uiContext,
      confirmationPage,
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
