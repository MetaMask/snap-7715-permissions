import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import type { SnapsProvider } from '@metamask/snaps-sdk';

import type {
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../src/orchestrators';
import { createPermissionOrchestrator } from '../src/orchestrators';

describe('Orchestrators', () => {
  const mockAccountController = {};
  let mockSnapProvider: SnapsProvider = {} as SnapsProvider;

  beforeEach(() => {
    mockSnapProvider = createMockSnapsProvider();

    jest.clearAllMocks();
  });

  describe('native-token-stream Orchestrator', () => {
    const mockPartialPermissionRequest: PermissionRequest = {
      chainId: '0x1',
      expiry: 1,
      signer: {
        type: 'account',
        data: {
          address: '0x016562aA41A8697720ce0943F003141f5dEAe006',
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

    it('should return a PermissionOrchestrator when given native-token-stream permission type', () => {
      const orchestrator = createPermissionOrchestrator<'native-token-stream'>(
        mockSnapProvider,
        mockAccountController,
      );

      expect(orchestrator).toBeDefined();
      expect(orchestrator.validate).toBeInstanceOf(Function);
      expect(orchestrator.orchestrate).toBeInstanceOf(Function);
    });

    it('should orchestrate', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockSnapProvider,
        mockAccountController,
      );

      await orchestrator.validate(mockPartialPermissionRequest);

      const permissionTypeAsserted =
        mockPartialPermissionRequest.permission as PermissionTypeMapping[typeof mockPermissionType];

      const res = await orchestrator.orchestrate({
        permission: permissionTypeAsserted,
        chainId: mockPartialPermissionRequest.chainId,
        delegate: mockPartialPermissionRequest.signer.data.address,
        origin: 'http://localhost:3000',
        expiry: 1,
      });

      expect(res).toBeNull();
    });

    it('should return true when validate called with valid permission that is supported', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockSnapProvider,
        mockAccountController,
      );

      const res = await orchestrator.validate(mockPartialPermissionRequest);

      expect(res).toBe(true);
    });

    it('should throw error when validate called with permission type that is not supported', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockSnapProvider,
        mockAccountController,
      );

      await expect(
        orchestrator.validate({
          ...mockPartialPermissionRequest,
          permission: {
            ...mockPartialPermissionRequest.permission,
            type: 'unsupported-permission-type',
          },
        }),
      ).rejects.toThrow(
        `Validation for Permission type unsupported-permission-type is not supported`,
      );
    });

    it('should throw error when validate called with permission that is not valid', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockSnapProvider,
        mockAccountController,
      );

      await expect(
        orchestrator.validate({
          ...mockPartialPermissionRequest,
          permission: {},
        } as any),
      ).rejects.toThrow(
        'Validation for Permission type undefined is not supported',
      );
    });
  });
});
