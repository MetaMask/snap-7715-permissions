import { createRootDelegation } from '@metamask-private/delegator-core-viem';
import type { NativeTokenStreamPermission } from '@metamask/7715-permissions-shared/types';
import { getAddress } from 'viem';

import {
  permissionConfirmationPageFactory,
  type PermissionConfirmationMeta,
} from '../src/ui';
import type { PermissionConfirmationContext } from '../src/ui';
import { NativeTokenStreamConfirmationPage } from '../src/ui/confirmations';
import { convertToDelegationInTransit } from '../src/utils';

describe('permissionConfirmationPageFactory', () => {
  const delegator = getAddress('0x016562aA41A8697720ce0943F003141f5dEAe008');
  const delegate = getAddress('0x016562aA41A8697720ce0943F003141f5dEAe009');
  const mockDelegation = convertToDelegationInTransit(
    createRootDelegation(delegate, delegator, []),
  );

  describe('native-token-stream Confirmation page', () => {
    it('should return a NativeTokenStreamPermissionOrchestrator when given native-token-stream permission type', () => {
      const permission: NativeTokenStreamPermission = {
        type: 'native-token-stream',
        data: {
          justification: 'shh...permission 2',
        },
      };
      const mockConfirmationMeta: PermissionConfirmationMeta<'native-token-stream'> =
        {
          permission: {
            type: 'native-token-stream',
            data: {
              justification: 'shh...permission 2',
            },
          },
          delegator,
          delegate,
          siteOrigin: 'http://localhost:3000',
          balance: '0x1',
          expiry: 1,
          chainId: 11155111,
        };

      const res = permissionConfirmationPageFactory(mockConfirmationMeta);

      expect(res).toStrictEqual([
        {
          permission,
          siteOrigin: 'http://localhost:3000',
          balance: '0x1',
          expiry: 1,
          chainId: 11155111,
          delegation: mockDelegation,
        } as PermissionConfirmationContext<'native-token-stream'>,
        <NativeTokenStreamConfirmationPage
          siteOrigin={mockConfirmationMeta.siteOrigin}
          permission={mockConfirmationMeta.permission}
          balance={mockConfirmationMeta.balance}
          expiry={mockConfirmationMeta.expiry}
          chainId={mockConfirmationMeta.chainId}
          delegation={mockDelegation}
        />,
      ]);
    });
  });

  it('should throw error when given a permission type that is not supported', () => {
    const nonSupportedPermissionType: any = 'non-supported-permission';

    const nonSupportedPermission = {
      type: nonSupportedPermissionType,
      data: {
        justification: 'shh...permission 2',
      },
    };
    const mockConfirmationMeta: PermissionConfirmationMeta<
      typeof nonSupportedPermissionType
    > = {
      permission: nonSupportedPermission,
      delegator,
      delegate,
      siteOrigin: 'http://localhost:3000',
      balance: '0x1',
      expiry: 1,
      chainId: 11155111,
    };

    expect(() =>
      permissionConfirmationPageFactory(mockConfirmationMeta),
    ).toThrow('Permission confirmation screen not found');
  });
});
