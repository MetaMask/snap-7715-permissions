import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/test';
import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import type { SnapsProvider } from '@metamask/snaps-sdk';

import { createMockAccountController } from '../src/accountController';
import { createPermissionOrchestratorFactory } from '../src/orchestrators';

describe('PermissionOrchestratorFactory', () => {
  const mockPartialPermissionRequest: Partial<PermissionRequest> = {
    chainId: '0x1',
    expiry: 1,
    signer: {
      type: 'account',
      data: {
        address: '0x016562aA41A8697720ce0943F003141f5dEAe006',
      },
    },
  };

  const mockAccountController = createMockAccountController();
  let mockSnapProvider: SnapsProvider = {} as SnapsProvider;

  beforeEach(() => {
    mockSnapProvider = createMockSnapsProvider();

    jest.clearAllMocks();
  });

  describe('native-token-transfer permission type', () => {
    it('should return a NativeTokenStreamPermissionOrchestrator when given native-token-transfer permission type', () => {
      const nativeTokenTransferOrchestrator =
        createPermissionOrchestratorFactory<'native-token-transfer'>(
          {
            ...mockPartialPermissionRequest,
            permission: {
              type: 'native-token-transfer',
              data: {
                justification: 'shh...permission',
                address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
                allowance: '0x1DCD6500',
              },
            },
          } as PermissionRequest,
          mockSnapProvider,
          mockAccountController,
        );

      expect(nativeTokenTransferOrchestrator).toBeDefined();
      expect(nativeTokenTransferOrchestrator.permissionType).toBe(
        'native-token-transfer',
      );
      expect(nativeTokenTransferOrchestrator.validate).toBeInstanceOf(Function);
      expect(nativeTokenTransferOrchestrator.orchestrate).toBeInstanceOf(
        Function,
      );
    });
  });

  describe('native-token-stream permission type', () => {
    it('should return a NativeTokenStreamPermissionOrchestrator when given native-token-stream permission type', () => {
      const nativeTokenStreamOrchestrator =
        createPermissionOrchestratorFactory<'native-token-stream'>(
          {
            ...mockPartialPermissionRequest,
            permission: {
              type: 'native-token-stream',
              data: {
                justification: 'shh...permission 2',
                address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
                allowance: '0x1DCD6500',
              },
            },
          } as PermissionRequest,
          mockSnapProvider,
          mockAccountController,
        );

      expect(nativeTokenStreamOrchestrator).toBeDefined();
      expect(nativeTokenStreamOrchestrator.permissionType).toBe(
        'native-token-stream',
      );
      expect(nativeTokenStreamOrchestrator.validate).toBeInstanceOf(Function);
      expect(nativeTokenStreamOrchestrator.orchestrate).toBeInstanceOf(
        Function,
      );
    });
  });

  it('should throw error when given a permission type that is not supported', () => {
    const nonSupportedPermissionType: any = 'non-supported-permission';
    expect(() =>
      createPermissionOrchestratorFactory<typeof nonSupportedPermissionType>(
        {
          ...mockPartialPermissionRequest,
          permission: {
            type: nonSupportedPermissionType,
            data: {
              justification: 'shh...permission',
              address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
              allowance: '0x1DCD6500',
            },
          },
        } as PermissionRequest,
        mockSnapProvider,
        mockAccountController,
      ),
    ).toThrow('Permission type is not supported');
  });
});
