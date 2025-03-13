import { createRootDelegation } from '@metamask-private/delegator-core-viem';
import type { NativeTokenStreamPermission } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import { toHex, getAddress, parseUnits } from 'viem';

import type { AccountControllerInterface } from '../src/accountController';
import type {
  SupportedPermissionTypes,
  PermissionTypeMapping,
  OrchestrateArgs,
} from '../src/orchestrators';
import {
  createPermissionOrchestrator,
  orchestrate,
} from '../src/orchestrators';
import type {
  PermissionConfirmationContext,
  PermissionConfirmationRenderHandler,
} from '../src/ui';

describe('Orchestrate', () => {
  const address = getAddress('0x1234567890123456789012345678901234567890');
  const sessionAccount = getAddress(
    '0x1234567890123456789012345678901234567890',
  );

  describe('native-token-stream', () => {
    const nativeTokenStreamPermission: NativeTokenStreamPermission = {
      type: 'native-token-stream',
      data: {
        justification: 'shh...permission 2',
        initialAmount: '0x1',
        amountPerSecond: '0x1',
        startTime: toHex(BigInt(1000)),
        endTime: toHex(BigInt(1000 + 1000)),
      },
    };
    const mockPermissionType = extractPermissionName(
      nativeTokenStreamPermission.type,
    ) as SupportedPermissionTypes;
    const mockAccountController = {
      getAccountAddress: jest.fn(),
      signDelegation: jest.fn(),
      getAccountMetadata: jest.fn(),
      getAccountBalance: jest.fn(),
      getDelegationManager: jest.fn(),
    } as jest.Mocked<AccountControllerInterface>;
    const mockPermissionConfirmationRenderHandler = {
      getConfirmedAttenuatedPermission: jest.fn(),
    } as jest.Mocked<PermissionConfirmationRenderHandler>;
    const orchestrator = createPermissionOrchestrator(mockPermissionType);

    const orchestrateArgs: OrchestrateArgs<typeof mockPermissionType> = {
      permissionType: mockPermissionType,
      accountController: mockAccountController,
      orchestrator,
      orchestrateMeta: {
        permission:
          nativeTokenStreamPermission as PermissionTypeMapping[typeof mockPermissionType],
        chainId: '0xaa36a7',
        sessionAccount,
        origin: 'http://localhost:3000',
        expiry: 1,
      },
      permissionConfirmationRenderHandler:
        mockPermissionConfirmationRenderHandler,
    };

    const mockAttenuatedContext: PermissionConfirmationContext<
      typeof mockPermissionType
    > = {
      permission:
        nativeTokenStreamPermission as PermissionTypeMapping[typeof mockPermissionType],
      address,
      siteOrigin: 'http://localhost:3000',
      balance: '0x1',
      expiry: 1,
      chainId: 11155111,
    };

    it('should orchestrate and return a successfuly 7715 response when user confirms', async () => {
      // prepare mock user confirmation context
      mockPermissionConfirmationRenderHandler.getConfirmedAttenuatedPermission.mockResolvedValueOnce(
        {
          isConfirmed: true,
          attenuatedExpiry: mockAttenuatedContext.expiry,
          attenuatedPermission: mockAttenuatedContext.permission,
        },
      );

      // prepare mock account controller
      mockAccountController.getAccountAddress.mockResolvedValueOnce(address);
      mockAccountController.getAccountBalance.mockResolvedValueOnce(
        toHex(parseUnits('1', 18)),
      );
      mockAccountController.getAccountMetadata.mockResolvedValueOnce({
        factory: '0x1234567890123456789012345678901234567890',
        factoryData: '0x000000000000000000000000000000_factory_data',
      });
      mockAccountController.getDelegationManager.mockResolvedValueOnce(
        '0x000000_delegation_manager',
      );
      mockAccountController.signDelegation.mockResolvedValueOnce(
        createRootDelegation(sessionAccount, address, []),
      );

      const res = await orchestrate(orchestrateArgs);

      expect(res).toStrictEqual({
        success: true,
        response: {
          address,
          accountMeta: [
            {
              factory: '0x1234567890123456789012345678901234567890',
              factoryData: '0x000000000000000000000000000000_factory_data',
            },
          ],
          chainId: '0xaa36a7',
          context:
            '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000012345678901234567890123456789012345678900000000000000000000000001234567890123456789012345678901234567890ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
          expiry: 1,
          permissions: [
            {
              data: {
                justification: 'shh...permission 2',
                amountPerSecond: '0x1',
                endTime: '0x7d0',
                initialAmount: '0x1',
                startTime: '0x3e8',
              },
              type: 'native-token-stream',
            },
          ],
          signer: {
            data: { address: sessionAccount },
            type: 'account',
          },
          signerMeta: { delegationManager: '0x000000_delegation_manager' },
        },
      });
    });

    it('should orchestrate and return a unsuccessfuly 7715 response when user rejects', async () => {
      // prepare mock user confirmation context
      mockPermissionConfirmationRenderHandler.getConfirmedAttenuatedPermission.mockResolvedValueOnce(
        {
          isConfirmed: false,
          attenuatedExpiry: mockAttenuatedContext.expiry,
          attenuatedPermission: mockAttenuatedContext.permission,
        },
      );

      // prepare mock account controller
      mockAccountController.getAccountAddress.mockResolvedValueOnce(address);
      mockAccountController.getAccountBalance.mockResolvedValueOnce(
        toHex(parseUnits('1', 18)),
      );
      mockAccountController.getAccountMetadata.mockResolvedValueOnce({
        factory: '0x1234567890123456789012345678901234567890',
        factoryData: '0x000000000000000000000000000000_factory_data',
      });
      mockAccountController.getDelegationManager.mockResolvedValueOnce(
        '0x000000_delegation_manager',
      );
      mockAccountController.signDelegation.mockResolvedValueOnce(
        createRootDelegation(sessionAccount, address, []),
      );

      const res = await orchestrate(orchestrateArgs);

      expect(res).toStrictEqual({
        success: false,
        reason: 'User rejected the permissions request',
      });
    });
  });
});
