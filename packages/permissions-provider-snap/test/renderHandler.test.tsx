import { createRootDelegation } from '@metamask-private/delegator-core-viem';
import type { MockSnapRequest } from '@metamask/7715-permissions-shared/testing';
import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import type { NativeTokenStreamPermission } from '@metamask/7715-permissions-shared/types';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import { getAddress } from 'viem';

import type {
  PermissionConfirmationContext,
  PermissionConfirmationMeta,
} from '../src/ui';
import { createPermissionConfirmationRenderHandler } from '../src/ui';
import { NativeTokenStreamConfirmationPage } from '../src/ui/confirmations';
import { convertToSerializableDelegation } from '../src/utils';

describe('Permission Confirmation Render Handler', () => {
  let mockSnapProvider: SnapsProvider;

  beforeEach(() => {
    mockSnapProvider = createMockSnapsProvider();

    jest.clearAllMocks();
  });

  describe('renderPermissionConfirmation - native-token-stream', () => {
    const permission: NativeTokenStreamPermission = {
      type: 'native-token-stream',
      data: {
        justification: 'shh...permission 2',
      },
    };
    const delegator = getAddress('0x016562aA41A8697720ce0943F003141f5dEAe008');
    const delegate = getAddress('0x016562aA41A8697720ce0943F003141f5dEAe009');
    const mockDelegation = convertToSerializableDelegation(
      createRootDelegation(delegate, delegator, []),
    );
    const mockConfirmationMeta: PermissionConfirmationMeta<'native-token-stream'> =
      {
        permission,
        delegator,
        delegate,
        siteOrigin: 'http://localhost:3000',
        balance: '0x1',
        expiry: 1,
        chainId: 11155111,
      };

    it('should render the confirmation screen and return context after user confirms', async () => {
      const permissionConfirmationRenderHandler =
        createPermissionConfirmationRenderHandler(mockSnapProvider);

      const mockAttenuatedContext: PermissionConfirmationContext<'native-token-stream'> =
        {
          permission,
          siteOrigin: 'http://localhost:3000',
          balance: '0x1',
          expiry: 1,
          chainId: 11155111,
          delegation: mockDelegation,
        };

      // mock the snap dialog user interaction
      const mockInterfaceId = 'mockInterfaceId';
      (mockSnapProvider.request as MockSnapRequest)
        .mockResolvedValueOnce(mockInterfaceId) // mock snap_createInterface
        .mockResolvedValueOnce(mockAttenuatedContext); // mock snap_dialog

      // render the permission confirmation page
      const attenuatedContextRes =
        await permissionConfirmationRenderHandler.renderPermissionConfirmation(
          mockConfirmationMeta,
        );

      expect(mockSnapProvider.request).toHaveBeenCalledTimes(2);
      expect(mockSnapProvider.request).toHaveBeenNthCalledWith(1, {
        method: 'snap_createInterface',
        params: {
          context: mockAttenuatedContext,
          ui: (
            <NativeTokenStreamConfirmationPage
              siteOrigin={mockConfirmationMeta.siteOrigin}
              permission={mockConfirmationMeta.permission}
              balance={mockConfirmationMeta.balance}
              expiry={mockConfirmationMeta.expiry}
              chainId={mockConfirmationMeta.chainId}
              delegation={mockDelegation}
            />
          ),
        },
      });
      expect(
        mockSnapProvider.request as MockSnapRequest,
      ).toHaveBeenNthCalledWith(2, {
        method: 'snap_dialog',
        params: { id: mockInterfaceId },
      });

      expect(attenuatedContextRes).toStrictEqual(mockAttenuatedContext);
    });

    it('should throw error when user cancels confirmation screen', async () => {
      const permissionConfirmationRenderHandler =
        createPermissionConfirmationRenderHandler(mockSnapProvider);

      // mock the snap dialog user interaction
      const mockInterfaceId = 'mockInterfaceId';
      (mockSnapProvider.request as MockSnapRequest)
        .mockResolvedValueOnce(mockInterfaceId) // mock snap_createInterface
        .mockResolvedValueOnce(null); // mock snap_dialog - user cancels

      await expect(
        permissionConfirmationRenderHandler.renderPermissionConfirmation(
          mockConfirmationMeta,
        ),
      ).rejects.toThrow('User rejected the permissions request');
    });
  });
});
