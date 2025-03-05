import { createRootDelegation } from '@metamask-private/delegator-core-viem';
import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import { getAddress } from 'viem';

import { createMockAccountController } from '../src/accountController.mock';
import type {
  OrchestrateMeta,
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../src/orchestrators';
import { createPermissionOrchestrator } from '../src/orchestrators';
import type {
  PermissionConfirmationContext,
  PermissionConfirmationRenderHandler,
} from '../src/ui';
import { NativeTokenStreamConfirmationPage } from '../src/ui/confirmations';
import { convertToSerializableDelegation } from '../src/utils';

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
      getConfirmedAttenuatedPermission: jest.fn(),
      getPermissionConfirmationPage: jest.fn(),
    } as unknown as jest.Mocked<PermissionConfirmationRenderHandler>;

    const delegator = getAddress('0x016562aA41A8697720ce0943F003141f5dEAe008');
    const delegate = getAddress('0x016562aA41A8697720ce0943F003141f5dEAe009');
    const mockDelegation = convertToSerializableDelegation(
      createRootDelegation(delegate, delegator, []),
    );
    const mockAttenuatedContext: PermissionConfirmationContext<
      typeof mockPermissionType
    > = {
      permission:
        mockPartialPermissionRequest.permission as PermissionTypeMapping[typeof mockPermissionType],
      delegator,
      delegate,
      siteOrigin: 'http://localhost:3000',
      balance: '0x1',
      expiry: 1,
      chainId: 11155111,
      delegation: mockDelegation,
    };

    const mockPage = (
      <NativeTokenStreamConfirmationPage
        siteOrigin={mockAttenuatedContext.siteOrigin}
        permission={
          mockAttenuatedContext.permission as PermissionTypeMapping['native-token-stream']
        }
        balance={mockAttenuatedContext.balance}
        expiry={mockAttenuatedContext.expiry}
        chainId={mockAttenuatedContext.chainId}
        delegation={mockDelegation}
      />
    );

    it('should return a PermissionOrchestrator when given native-token-stream permission type', () => {
      const orchestrator = createPermissionOrchestrator(
        mockAccountController,
        mockPermissionConfirmationRenderHandler,
        mockPermissionType,
      );

      expect(orchestrator).toBeDefined();
      expect(orchestrator.parseAndValidate).toBeInstanceOf(Function);
      expect(orchestrator.orchestrate).toBeInstanceOf(Function);
    });

    it('should orchestrate and return a valide 7715 response', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockAccountController,
        mockPermissionConfirmationRenderHandler,
        mockPermissionType,
      );
      const permissionTypeAsserted =
        mockPartialPermissionRequest.permission as PermissionTypeMapping[typeof mockPermissionType];

      const orchestrateMeta: OrchestrateMeta<typeof mockPermissionType> = {
        permission: permissionTypeAsserted,
        chainId: mockPartialPermissionRequest.chainId,
        delegate: mockPartialPermissionRequest.signer.data.address,
        origin: 'http://localhost:3000',
        expiry: 1,
      };

      // prepare mock permission confirmation page
      mockPermissionConfirmationRenderHandler.getPermissionConfirmationPage.mockReturnValueOnce(
        [mockAttenuatedContext, mockPage],
      );

      // prepare mock user confirmation context
      mockPermissionConfirmationRenderHandler.getConfirmedAttenuatedPermission.mockResolvedValueOnce(
        {
          isConfirmed: true,
          attenuatedDelegation: mockAttenuatedContext.delegation,
          attenuatedExpiry: mockAttenuatedContext.expiry,
          attenuatedPermission: mockAttenuatedContext.permission,
        },
      );

      // first validate the permission
      await orchestrator.parseAndValidate(mockPartialPermissionRequest);

      // then orchestrate
      const res = await orchestrator.orchestrate(orchestrateMeta);

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
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000016562aa41a8697720ce0943f003141f5deae009000000000000000000000000016562aa41a8697720ce0943f003141f5deae008ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000_SIGNED_DELEGATION00000000000000000000000000000000',
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
  });
});
