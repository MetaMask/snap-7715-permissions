import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import type { NativeTokenStreamPermission } from '@metamask/7715-permissions-shared/types';
import type { UserInputEvent } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';
import { getAddress } from 'viem';

import type {
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../src/orchestrators';
import type { PermissionConfirmationContext } from '../src/ui';
import { createPermissionConfirmationRenderHandler } from '../src/ui';
import { NativeTokenStreamConfirmationPage } from '../src/ui/confirmations';
import { CANCEL_BUTTON, GRANT_BUTTON } from '../src/ui/userInputConstant';
import { UserEventDispatcher } from '../src/userEventDispatcher';

jest.mock('../src/userEventDispatcher');

describe('Permission Confirmation Render Handler', () => {
  const mockSnapProvider = createMockSnapsProvider();
  const mockUserEventDispatcher = new UserEventDispatcher();

  let onButtonClickHandlerPromise: Promise<
    (args: { event: UserInputEvent }) => Promise<void>
  >;

  (mockUserEventDispatcher.off as jest.Mock).mockImplementation(
    () => mockUserEventDispatcher,
  );

  const address = getAddress('0x016562aA41A8697720ce0943F003141f5dEAe008');
  const permission: NativeTokenStreamPermission = {
    type: 'native-token-stream',
    data: {
      justification: 'shh...permission 2',
      initialAmount: '0x1',
      amountPerSecond: '0x1',
      startTime: 1000,
      maxAmount: '0x2',
    },
  };
  const mockPermissionType = 'mock-permission-type' as SupportedPermissionTypes;

  const mockContext: PermissionConfirmationContext<typeof mockPermissionType> =
    {
      permission:
        permission as PermissionTypeMapping[typeof mockPermissionType],
      address,
      siteOrigin: 'http://localhost:3000',
      balance: '0x1',
      expiry: 1,
      chainId: 11155111,
      permissionSpecificRules: {
        maxAllowance: 'Unlimited',
      },
    };

  const mockPage = (
    <NativeTokenStreamConfirmationPage
      siteOrigin={mockContext.siteOrigin}
      address={mockContext.address}
      permission={mockContext.permission}
      balance={mockContext.balance}
      expiry={mockContext.expiry}
      chainId={mockContext.chainId}
      permissionSpecificRules={mockContext.permissionSpecificRules}
    />
  );

  beforeEach(() => {
    mockSnapProvider.request.mockReset();
    mockSnapProvider.request.mockResolvedValue('OK');
    (mockUserEventDispatcher.on as jest.Mock).mockClear();
    (mockUserEventDispatcher.off as jest.Mock).mockClear();

    onButtonClickHandlerPromise = new Promise<
      (args: { event: UserInputEvent }) => Promise<void>
    >((resolve, _) => {
      (mockUserEventDispatcher.on as jest.Mock).mockImplementation(
        ({ eventType, handler }) => {
          if (eventType === UserInputEventType.ButtonClickEvent) {
            resolve(handler);
          }
          return mockUserEventDispatcher;
        },
      );
    });
  });

  describe('createConfirmationDialog()', () => {
    it('should handle user approving a permission request', async () => {
      const mockInterfaceId = 'mock-interface-id';
      mockSnapProvider.request
        .mockResolvedValueOnce(mockInterfaceId) // snap_createInterface
        .mockResolvedValueOnce({}) // snap_dialog
        .mockResolvedValueOnce({}); // snap_resolveInterface

      const permissionConfirmationRenderHandler =
        createPermissionConfirmationRenderHandler({
          snapsProvider: mockSnapProvider,
          userEventDispatcher: mockUserEventDispatcher,
        });

      const { interfaceId, confirmationResult } =
        await permissionConfirmationRenderHandler.createConfirmationDialog(
          mockContext,
          mockPage,
          mockPermissionType,
        );

      expect(interfaceId).toEqual(mockInterfaceId);

      if (onButtonClickHandlerPromise === null) {
        throw new Error('Expected onButtonClickHandler to be set');
      }

      const onButtonClickHandler = await onButtonClickHandlerPromise;

      // simulate clicking the grant button
      await onButtonClickHandler({
        event: {
          type: UserInputEventType.ButtonClickEvent,
          name: GRANT_BUTTON,
        },
      });

      await expect(confirmationResult).resolves.toEqual(true);

      expect(mockSnapProvider.request).toHaveBeenCalledWith({
        method: 'snap_createInterface',
        params: expect.objectContaining({
          context: mockContext,
          ui: expect.any(Object),
        }),
      });

      expect(mockSnapProvider.request).toHaveBeenCalledWith({
        method: 'snap_dialog',
        params: { id: mockInterfaceId },
      });

      // close dialog and cleanup

      expect(mockSnapProvider.request).toHaveBeenCalledWith({
        method: 'snap_resolveInterface',
        params: { id: mockInterfaceId, value: {} },
      });

      expect(mockUserEventDispatcher.off).toHaveBeenCalledWith({
        eventType: UserInputEventType.ButtonClickEvent,
        handler: expect.any(Function),
        interfaceId: mockInterfaceId,
      });
    });

    it('should handle user rejecting a permission request', async () => {
      const mockInterfaceId = 'mock-interface-id';
      mockSnapProvider.request
        .mockResolvedValueOnce(mockInterfaceId) // snap_createInterface
        .mockResolvedValueOnce({}) // snap_dialog
        .mockResolvedValueOnce({}); // snap_resolveInterface

      const permissionConfirmationRenderHandler =
        createPermissionConfirmationRenderHandler({
          snapsProvider: mockSnapProvider,
          userEventDispatcher: mockUserEventDispatcher,
        });

      const { interfaceId, confirmationResult } =
        await permissionConfirmationRenderHandler.createConfirmationDialog(
          mockContext,
          mockPage,
          mockPermissionType,
        );

      expect(interfaceId).toEqual(mockInterfaceId);

      if (onButtonClickHandlerPromise === null) {
        throw new Error('Expected onButtonClickHandler to be set');
      }

      const onButtonClickHandler = await onButtonClickHandlerPromise;

      // simulate clicking the cancel button
      await onButtonClickHandler({
        event: {
          type: UserInputEventType.ButtonClickEvent,
          name: CANCEL_BUTTON,
        },
      });

      await expect(confirmationResult).resolves.toEqual(false);

      expect(mockSnapProvider.request).toHaveBeenCalledWith({
        method: 'snap_createInterface',
        params: expect.objectContaining({
          context: mockContext,
          ui: expect.any(Object),
        }),
      });

      expect(mockSnapProvider.request).toHaveBeenCalledWith({
        method: 'snap_dialog',
        params: { id: mockInterfaceId },
      });

      // close dialog and cleanup

      expect(mockSnapProvider.request).toHaveBeenCalledWith({
        method: 'snap_resolveInterface',
        params: { id: mockInterfaceId, value: {} },
      });

      expect(mockUserEventDispatcher.off).toHaveBeenCalledWith({
        eventType: UserInputEventType.ButtonClickEvent,
        handler: expect.any(Function),
        interfaceId: mockInterfaceId,
      });
    });
  });
});
