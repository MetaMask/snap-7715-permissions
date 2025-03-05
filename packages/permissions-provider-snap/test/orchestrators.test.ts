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
      const orchestrator = createPermissionOrchestrator(
        mockSnapProvider,
        mockAccountController,
        mockPermissionType,
      );

      expect(orchestrator).toBeDefined();
      expect(orchestrator.parseAndValidate).toBeInstanceOf(Function);
      expect(orchestrator.orchestrate).toBeInstanceOf(Function);
    });

    it('should orchestrate', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockSnapProvider,
        mockAccountController,
        mockPermissionType,
      );

      await orchestrator.parseAndValidate(mockPartialPermissionRequest);

      const permissionTypeAsserted =
        mockPartialPermissionRequest.permission as PermissionTypeMapping[typeof mockPermissionType];

      const res = await orchestrator.orchestrate({
        permission: permissionTypeAsserted,
        chainId: mockPartialPermissionRequest.chainId,
        delegate: mockPartialPermissionRequest.signer.data.address,
        origin: 'http://localhost:3000',
        expiry: 1,
      });

      expect(res).toStrictEqual({ response: {}, success: true });
    });
  });
});
