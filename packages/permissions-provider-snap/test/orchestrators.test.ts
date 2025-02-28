import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/test';
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

    it('should orchestrate after passing validation', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockSnapProvider,
        mockAccountController,
      );

      await orchestrator.validate(mockPartialPermissionRequest);

      const permissionTypeAsserted =
        mockPartialPermissionRequest.permission as PermissionTypeMapping[typeof mockPermissionType];

      const res = await orchestrator.orchestrate(permissionTypeAsserted, {
        chainId: mockPartialPermissionRequest.chainId,
        delegate: mockPartialPermissionRequest.signer.data.address,
        origin: 'http://localhost:3000',
        expiry: 1,
      });

      expect(res).toBeNull();
    });

    it('should throw error if trying to orchestrate before passing validation', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockSnapProvider,
        mockAccountController,
      );

      const permissionTypeAsserted =
        mockPartialPermissionRequest.permission as PermissionTypeMapping[typeof mockPermissionType];

      await expect(
        orchestrator.orchestrate(permissionTypeAsserted, {
          chainId: mockPartialPermissionRequest.chainId,
          delegate: mockPartialPermissionRequest.signer.data.address,
          origin: 'http://localhost:3000',
          expiry: 1,
        }),
      ).rejects.toThrow(
        'Permission has not been validated, call validate before orchestrate',
      );
    });
  });
});
