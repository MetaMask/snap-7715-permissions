import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import type { NativeTokenStreamPermission } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import { getAddress } from 'viem';

import type {
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../src/orchestrators';
import type { PermissionConfirmationContext } from '../src/ui';
import { createPermissionConfirmationRenderHandler } from '../src/ui';
import { NativeTokenStreamConfirmationPage } from '../src/ui/confirmations';

describe('Permission Confirmation Render Handler', () => {
  const mockSnapProvider = createMockSnapsProvider();
  const address = getAddress('0x016562aA41A8697720ce0943F003141f5dEAe008');
  const permission: NativeTokenStreamPermission = {
    type: 'native-token-stream',
    data: {
      justification: 'shh...permission 2',
      initialAmount: '0x1',
      amountPerSecond: '0x1',
      startTime: 1000,
      endTime: 1000 + 1000,
      maxAmount: '0x2',
    },
  };
  const mockPermissionType = extractPermissionName(
    permission.type,
  ) as SupportedPermissionTypes;
  const mockContext: PermissionConfirmationContext<typeof mockPermissionType> =
    {
      permission:
        permission as PermissionTypeMapping[typeof mockPermissionType],
      address,
      siteOrigin: 'http://localhost:3000',
      balance: '0x1',
      expiry: 1,
      chainId: 11155111,
    };

  const mockPage = (
    <NativeTokenStreamConfirmationPage
      siteOrigin={mockContext.siteOrigin}
      address={mockContext.address}
      permission={mockContext.permission}
      balance={mockContext.balance}
      expiry={mockContext.expiry}
      chainId={mockContext.chainId}
    />
  );

  beforeEach(() => {
    mockSnapProvider.request.mockReset();
  });

  describe('getConfirmedAttenuatedPermission - native-token-stream', () => {
    it('should render the confirmation screen and return attenuated results after user confirms', async () => {
      const permissionConfirmationRenderHandler =
        createPermissionConfirmationRenderHandler(mockSnapProvider);

      // mock the snap dialog user interaction
      const mockInterfaceId = 'mockInterfaceId';
      mockSnapProvider.request
        .mockResolvedValueOnce(mockInterfaceId) // mock snap_createInterface
        .mockResolvedValueOnce({
          attenuatedPermission: mockContext.permission,
          attenuatedExpiry: mockContext.expiry,
          isConfirmed: true,
        }); // mock snap_dialog resolves with type AttenuatedResponse

      // render the permission confirmation page
      const attenuatedRes =
        await permissionConfirmationRenderHandler.getConfirmedAttenuatedPermission(
          mockContext,
          mockPage,
          mockPermissionType,
        );

      expect(mockSnapProvider.request).toHaveBeenCalledTimes(2);
      expect(mockSnapProvider.request).toHaveBeenNthCalledWith(1, {
        method: 'snap_createInterface',
        params: {
          context: mockContext,
          ui: mockPage,
        },
      });
      expect(mockSnapProvider.request).toHaveBeenNthCalledWith(2, {
        method: 'snap_dialog',
        params: { id: mockInterfaceId },
      });

      expect(attenuatedRes).toStrictEqual({
        attenuatedPermission: mockContext.permission,
        attenuatedExpiry: mockContext.expiry,
        isConfirmed: true,
      });
    });

    it('should throw error when user cancels confirmation screen', async () => {
      const permissionConfirmationRenderHandler =
        createPermissionConfirmationRenderHandler(mockSnapProvider);

      // mock the snap dialog user interaction
      const mockInterfaceId = 'mockInterfaceId';
      mockSnapProvider.request
        .mockResolvedValueOnce(mockInterfaceId) // mock snap_createInterface
        .mockResolvedValueOnce({
          attenuatedPermission: mockContext.permission,
          attenuatedExpiry: mockContext.expiry,
          isConfirmed: false,
        }); // mock snap_dialog resolves with type AttenuatedResponse

      const attenuatedRes =
        await permissionConfirmationRenderHandler.getConfirmedAttenuatedPermission(
          mockContext,
          mockPage,
          mockPermissionType,
        );

      expect(attenuatedRes).toStrictEqual({
        attenuatedPermission: mockContext.permission,
        attenuatedExpiry: mockContext.expiry,
        isConfirmed: false,
      });
    });
  });
});
