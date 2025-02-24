import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/test';
import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import type { SnapsProvider } from '@metamask/snaps-sdk';

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

  const mockAccountController = {};

  beforeEach(() => {
    // @ts-expect-error Mocking Snap global object
    // eslint-disable-next-line no-restricted-globals
    global.snap = createMockSnapsProvider();

    // Clear mock call history to ensure no interference between tests
    jest.clearAllMocks();
  });

  describe('native-token-transfer permission type', () => {
    it('should return a Erc20PermissionTypePermissionOrchestrator when given native-token-transfer permission type', () => {
      const erc20Orchestrator =
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
          snap as SnapsProvider,
          mockAccountController,
        );

      expect(erc20Orchestrator).toBeDefined();
      expect(erc20Orchestrator.permissionType).toBe('native-token-transfer');
      expect(erc20Orchestrator.validate).toBeInstanceOf(Function);
      expect(erc20Orchestrator.orchestrate).toBeInstanceOf(Function);
    });
  });

  describe('erc-20-token-transfer permission type', () => {
    it('should return a Erc20PermissionTypePermissionOrchestrator when given erc-20-token-transfer permission type', () => {
      const erc20Orchestrator =
        createPermissionOrchestratorFactory<'erc-20-token-transfer'>(
          {
            ...mockPartialPermissionRequest,
            permission: {
              type: 'erc-20-token-transfer',
              data: {
                justification: 'shh...permission 2',
                address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
                allowance: '0x1DCD6500',
              },
            },
          } as PermissionRequest,
          snap as SnapsProvider,
          mockAccountController,
        );

      expect(erc20Orchestrator).toBeDefined();
      expect(erc20Orchestrator.permissionType).toBe('erc-20-token-transfer');
      expect(erc20Orchestrator.validate).toBeInstanceOf(Function);
      expect(erc20Orchestrator.orchestrate).toBeInstanceOf(Function);
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
        snap as SnapsProvider,
        mockAccountController,
      ),
    ).toThrow('Permission type is not supported');
  });
});
