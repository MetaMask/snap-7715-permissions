import { createRootDelegation } from '@metamask-private/delegator-core-viem';
import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import { fromHex, getAddress } from 'viem';

import { createMockAccountController } from '../src/accountContoller.mock';
import type {
  OrchestrateMeta,
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../src/orchestrators';
import {
  createPermissionOrchestrator,
  prepareAccountDetails,
} from '../src/orchestrators';
import type {
  PermissionConfirmationContext,
  PermissionConfirmationRenderHandler,
} from '../src/ui';
import { convertToDelegationInTransit } from '../src/utils';

describe('Orchestrators', () => {
  const mockAccountController = createMockAccountController();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('native-token-stream Orchestrator', () => {
    const mockPartialPermissionRequest: PermissionRequest = {
      chainId: '0xaa36a7', // Sepolia
      expiry: 1,
      signer: {
        type: 'account',
        data: {
          address: getAddress('0x016562aA41A8697720ce0943F003141f5dEAe006'),
        },
      },
      permission: {
        type: 'native-token-stream',
        data: {
          justification: 'shh...permission 2',
        },
      },
    };
    const mockPermissionType = extractPermissionName(
      mockPartialPermissionRequest.permission.type,
    ) as SupportedPermissionTypes;
    const mockPermissionConfirmationRenderHandler = {
      renderPermissionConfirmation: jest.fn(),
    } as unknown as jest.Mocked<
      PermissionConfirmationRenderHandler<typeof mockPermissionType>
    >;

    it('should return a PermissionOrchestrator when given native-token-stream permission type', () => {
      const orchestrator = createPermissionOrchestrator<
        typeof mockPermissionType
      >(mockAccountController, mockPermissionConfirmationRenderHandler);

      expect(orchestrator).toBeDefined();
      expect(orchestrator.validate).toBeInstanceOf(Function);
      expect(orchestrator.orchestrate).toBeInstanceOf(Function);
    });

    it('should orchestrate after passing validation and return valid 7715 response', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockAccountController,
        mockPermissionConfirmationRenderHandler,
      );
      const orchestrateMeta: OrchestrateMeta = {
        chainId: mockPartialPermissionRequest.chainId,
        delegate: mockPartialPermissionRequest.signer.data.address,
        origin: 'http://localhost:3000',
        expiry: 1,
      };

      // prepare mock user confirmation context
      const chainId = fromHex(orchestrateMeta.chainId, 'number');
      const [delegator, balance] = await prepareAccountDetails(
        mockAccountController,
        chainId,
      );
      const permissionTypeAsserted =
        mockPartialPermissionRequest.permission as PermissionTypeMapping[typeof mockPermissionType];

      mockPermissionConfirmationRenderHandler.renderPermissionConfirmation.mockResolvedValueOnce(
        {
          permission: permissionTypeAsserted,
          siteOrigin: orchestrateMeta.origin,
          balance,
          chainId,
          expiry: orchestrateMeta.expiry,
          delegation: convertToDelegationInTransit(
            createRootDelegation(
              mockPartialPermissionRequest.signer.data.address,
              delegator,
              [],
            ),
          ),
        } as PermissionConfirmationContext<typeof mockPermissionType>,
      );

      // first validate the permission
      await orchestrator.validate(mockPartialPermissionRequest);

      // then orchestrate
      const res = await orchestrator.orchestrate(
        permissionTypeAsserted,
        orchestrateMeta,
      );

      expect(res).toStrictEqual({
        account: '0x1234567890123456789012345678901234567890',
        accountMeta: [
          {
            factory: '0x1234567890123456789012345678901234567890',
            factoryData: '0x000000000000000000000000000000_factory_data',
          },
        ],
        chainId: '0xaa36a7',
        context:
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000016562aa41a8697720ce0943f003141f5deae0060000000000000000000000001234567890123456789012345678901234567890ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000_SIGNED_DELEGATION00000000000000000000000000000000',
        expiry: 1,
        permission: {
          data: { justification: 'shh...permission 2' },
          type: 'native-token-stream',
        },
        signer: {
          data: { address: '0x016562aA41A8697720ce0943F003141f5dEAe006' },
          type: 'account',
        },
        signerMeta: { delegationManager: '0x000000_delegation_manager' },
      });
    });

    it('should throw error if trying to orchestrate before passing validation', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockAccountController,
        mockPermissionConfirmationRenderHandler,
      );

      const permissionTypeAsserted =
        mockPartialPermissionRequest.permission as PermissionTypeMapping[typeof mockPermissionType];

      await expect(
        orchestrator.orchestrate(permissionTypeAsserted, {
          chainId: mockPartialPermissionRequest.chainId,
          delegate: mockPartialPermissionRequest.signer.data.address,
          origin: 'http://localhost:3000',
          expiry: 1,
        }),
      ).rejects.toThrow(
        'Permission has not been validated, call validate before orchestrate',
      );
    });
  });
});
