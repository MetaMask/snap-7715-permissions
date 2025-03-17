import {
  createCaveatBuilder,
  getDeleGatorEnvironment,
} from '@metamask-private/delegator-core-viem';
import type { Permission } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import { getAddress, toHex } from 'viem';
import { sepolia } from 'viem/chains';

import type {
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../src/orchestrators';
import { createPermissionOrchestrator } from '../src/orchestrators';
import type { PermissionConfirmationContext } from '../src/ui';
import { NativeTokenStreamConfirmationPage } from '../src/ui/confirmations';

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

  const address = getAddress('0x016562aA41A8697720ce0943F003141f5dEAe008');
  const sessionAccount = getAddress(
    '0x016562aA41A8697720ce0943F003141f5dEAe006',
  );
  const mockUiContext: PermissionConfirmationContext<
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
      siteOrigin={mockUiContext.siteOrigin}
      address={mockUiContext.address}
      permission={mockUiContext.permission}
      balance={mockUiContext.balance}
      expiry={mockUiContext.expiry}
      chainId={mockUiContext.chainId}
    />
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseAndValidate', () => {
    it('should return as parsed permission when parseAndValidate called with valid permission that is supported', async () => {
      const orchestrator = createPermissionOrchestrator(mockPermissionType);

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

    it('should throw error when validate called with permission that is not valid', async () => {
      const orchestrator = createPermissionOrchestrator(mockPermissionType);

      await expect(
        orchestrator.parseAndValidate({
          ...mockbasePermission,
          data: {},
        } as unknown as Permission),
      ).rejects.toThrow('Failed type validation: data.justification: Required');
    });
  });

  describe('buildPermissionConfirmationPage', () => {
    it('should return the native-token-stream confirmation page', async () => {
      const orchestrator = createPermissionOrchestrator(mockPermissionType);

      const res = orchestrator.buildPermissionConfirmationPage(mockUiContext);

      expect(res).toStrictEqual(mockPage);
    });
  });

  describe('appendPermissionCaveats', () => {
    it('should return a caveat builder with caveats added for the attenuated permission', async () => {
      const orchestrator = createPermissionOrchestrator(mockPermissionType);

      const updatedCaveatBuilder = await orchestrator.appendPermissionCaveats({
        address,
        sessionAccount,
        chainId: 11155111,
        attenuatedPermission:
          mockbasePermission as PermissionTypeMapping[typeof mockPermissionType],
        caveatBuilder: createCaveatBuilder(getDeleGatorEnvironment(sepolia.id)),
      });

      expect(updatedCaveatBuilder.build()).toStrictEqual([
        {
          args: '0x',
          enforcer: '0xcfD1BD7922D123Caa194597BF7A0073899a284Df',
          terms:
            '0x0000000000000000000000000000000000000000000000000000000000000001',
        },
      ]);
    });
  });
});
