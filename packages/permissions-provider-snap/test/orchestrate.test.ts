import { getDeleGatorEnvironment } from '@metamask-private/delegator-core-viem';
import type { NativeTokenStreamPermission } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import { toHex, getAddress, parseUnits } from 'viem';
import { sepolia } from 'viem/chains';

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
import type { PermissionsContextBuilder } from '../src/orchestrators/permissionsContextBuilder';
import type {
  PermissionConfirmationContext,
  PermissionConfirmationRenderHandler,
} from '../src/ui';
import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';

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
        startTime: 1000,
        maxAmount: '0x2',
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
      getEnvironment: jest.fn(),
    } as jest.Mocked<AccountControllerInterface>;
    const mockPermissionConfirmationRenderHandler = {
      createConfirmationDialog: jest.fn(),
    } as jest.Mocked<PermissionConfirmationRenderHandler>;
    const mockPermissionsContextBuilder = {
      buildPermissionsContext: jest.fn(),
    } as jest.Mocked<PermissionsContextBuilder>;
    const orchestrator = createPermissionOrchestrator(mockPermissionType);
    const mockSnapsProvider = createMockSnapsProvider();

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
      permissionsContextBuilder: mockPermissionsContextBuilder,
      snapsProvider: mockSnapsProvider,
    };

    it('should orchestrate and return a successfuly 7715 response when user confirms', async () => {
      // prepare mock user confirmation context
      mockPermissionConfirmationRenderHandler.createConfirmationDialog.mockResolvedValueOnce(
        {
          interfaceId: 'mock-interface-id',
          confirmationResult: Promise.resolve(true),
        },
      );

      // prepare mock permissions context builder
      mockPermissionsContextBuilder.buildPermissionsContext.mockResolvedValueOnce(
        '0x00_some_permission_context',
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
      mockAccountController.getEnvironment.mockResolvedValueOnce(
        getDeleGatorEnvironment(sepolia.id),
      );
      mockSnapsProvider.request.mockResolvedValueOnce({
        expiry: '1',
      });

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
          context: '0x00_some_permission_context',
          expiry: 1,
          permissions: [
            {
              data: {
                justification: 'shh...permission 2',
                amountPerSecond: '0x1',
                initialAmount: '0x1',
                startTime: 1000,
                maxAmount: '0x2',
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
      mockPermissionConfirmationRenderHandler.createConfirmationDialog.mockResolvedValueOnce(
        {
          interfaceId: 'mock-interface-id',
          confirmationResult: Promise.resolve(false),
        },
      );

      // prepare mock permissions context builder
      mockPermissionsContextBuilder.buildPermissionsContext.mockResolvedValueOnce(
        '0x00_some_permission_context',
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
      mockAccountController.getEnvironment.mockResolvedValueOnce(
        getDeleGatorEnvironment(sepolia.id),
      );
      mockSnapsProvider.request.mockResolvedValueOnce({
        expiry: '1',
      });

      const res = await orchestrate(orchestrateArgs);

      expect(res).toStrictEqual({
        success: false,
        reason: 'User rejected the permissions request',
      });
    });
  });
});
