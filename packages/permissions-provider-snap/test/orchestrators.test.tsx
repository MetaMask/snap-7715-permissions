import type { Permission } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import { getAddress, toHex } from 'viem';

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

describe('Orchestrators', () => {
  const mockAccountController = createMockAccountController();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('native-token-stream Orchestrator', () => {
    const mockbasePermission: Permission = {
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
      mockbasePermission.type,
    ) as SupportedPermissionTypes;

    const mockPermissionConfirmationRenderHandler = {
      getConfirmedAttenuatedPermission: jest.fn(),
      getPermissionConfirmationPage: jest.fn(),
    } as jest.Mocked<PermissionConfirmationRenderHandler>;

    const address = getAddress('0x016562aA41A8697720ce0943F003141f5dEAe008');
    const mockAttenuatedContext: PermissionConfirmationContext<
      typeof mockPermissionType
    > = {
      permission:
        mockbasePermission as PermissionTypeMapping[typeof mockPermissionType],
      address,
      siteOrigin: 'http://localhost:3000',
      balance: '0x1',
      expiry: 1,
      chainId: 11155111,
    };

    const mockPage = (
      <NativeTokenStreamConfirmationPage
        siteOrigin={mockAttenuatedContext.siteOrigin}
        address={mockAttenuatedContext.address}
        permission={
          mockAttenuatedContext.permission as PermissionTypeMapping['native-token-stream']
        }
        balance={mockAttenuatedContext.balance}
        expiry={mockAttenuatedContext.expiry}
        chainId={mockAttenuatedContext.chainId}
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

    it('should orchestrate and return a successfuly 7715 response when user confirms', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockAccountController,
        mockPermissionConfirmationRenderHandler,
        mockPermissionType,
      );
      const permissionTypeAsserted =
        mockbasePermission as PermissionTypeMapping[typeof mockPermissionType];

      const orchestrateMeta: OrchestrateMeta<typeof mockPermissionType> = {
        permission: permissionTypeAsserted,
        chainId: '0xaa36a7',
        sessionAccount: '0x016562aA41A8697720ce0943F003141f5dEAe006',
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
          attenuatedExpiry: mockAttenuatedContext.expiry,
          attenuatedPermission: mockAttenuatedContext.permission,
        },
      );

      // first validate the permission
      await orchestrator.parseAndValidate(mockbasePermission);

      // then orchestrate
      const res = await orchestrator.orchestrate(orchestrateMeta);

      expect(res).toStrictEqual({
        success: true,
        response: {
          address: '0x1234567890123456789012345678901234567890',
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
            data: { address: '0x016562aA41A8697720ce0943F003141f5dEAe006' },
            type: 'account',
          },
          signerMeta: { delegationManager: '0x000000_delegation_manager' },
        },
      });
    });

    it('should orchestrate and return a unsuccessfuly 7715 response when user rejects', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockAccountController,
        mockPermissionConfirmationRenderHandler,
        mockPermissionType,
      );
      const permissionTypeAsserted =
        mockbasePermission as PermissionTypeMapping[typeof mockPermissionType];

      const orchestrateMeta: OrchestrateMeta<typeof mockPermissionType> = {
        permission: permissionTypeAsserted,
        chainId: '0xaa36a7',
        sessionAccount: '0x016562aA41A8697720ce0943F003141f5dEAe006',
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
          isConfirmed: false,
          attenuatedExpiry: mockAttenuatedContext.expiry,
          attenuatedPermission: mockAttenuatedContext.permission,
        },
      );

      // first validate the permission
      await orchestrator.parseAndValidate(mockbasePermission);

      // then orchestrate
      const res = await orchestrator.orchestrate(orchestrateMeta);

      expect(res).toStrictEqual({
        success: false,
        reason: 'User rejected the permissions request',
      });
    });

    it('should return as parsed permission when parseAndValidate called with valid permission that is supported', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockAccountController,
        mockPermissionConfirmationRenderHandler,
        mockPermissionType,
      );

      const res = await orchestrator.parseAndValidate(mockbasePermission);

      expect(res).toStrictEqual({
        data: {
          justification: 'shh...permission 2',
          amountPerSecond: '0x1',
          endTime: '0x7d0',
          initialAmount: '0x1',
          startTime: '0x3e8',
        },
        type: 'native-token-stream',
      });
    });

    it('should throw error when validate called with permission type that is not supported', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockAccountController,
        mockPermissionConfirmationRenderHandler,
        'unsupported-permission-type' as keyof PermissionTypeMapping,
      );

      await expect(
        orchestrator.parseAndValidate({
          ...mockbasePermission,
          type: 'unsupported-permission-type',
        }),
      ).rejects.toThrow(
        `Validation for Permission type unsupported-permission-type is not supported`,
      );
    });

    it('should throw error when validate called with permission that is not valid', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockAccountController,
        mockPermissionConfirmationRenderHandler,
        mockPermissionType,
      );

      await expect(
        orchestrator.parseAndValidate({
          ...mockbasePermission,
          data: {},
        } as unknown as Permission),
      ).rejects.toThrow('Failed type validation: data.justification: Required');
    });
  });
});
