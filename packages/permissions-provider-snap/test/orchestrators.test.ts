import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import type { Permission } from '@metamask/7715-permissions-shared/types';
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
    const mockbasePermission: Permission = {
      type: 'native-token-stream',
      data: {
        justification: 'shh...permission 2',
      },
    };
    const mockPermissionType = extractPermissionName(
      mockbasePermission.type,
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

      await orchestrator.parseAndValidate(mockbasePermission);

      const permissionTypeAsserted =
        mockbasePermission as PermissionTypeMapping[typeof mockPermissionType];

      const res = await orchestrator.orchestrate({
        permission: permissionTypeAsserted,
        chainId: '0x1',
        delegate: '0x016562aA41A8697720ce0943F003141f5dEAe006',
        origin: 'http://localhost:3000',
        expiry: 1,
      });

      expect(res).toStrictEqual({ response: {}, success: true });
    });

    it('should return true when validate called with valid permission that is supported', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockSnapProvider,
        mockAccountController,
        mockPermissionType,
      );

      const res = await orchestrator.parseAndValidate(mockbasePermission);

      expect(res).toStrictEqual({
        data: { justification: 'shh...permission 2' },
        type: 'native-token-stream',
      });
    });

    it('should throw error when validate called with permission type that is not supported', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockSnapProvider,
        mockAccountController,
        'unsupported-permission-type' as keyof PermissionTypeMapping,
      );

      await expect(
        orchestrator.parseAndValidate({
          ...mockbasePermission,
          type: 'unsupported-permission-type',
        }),
      ).rejects.toThrow(
        `Validation for Permission type unsupported-permission-type is not supported`,
      );
    });

    it('should throw error when validate called with permission that is not valid', async () => {
      const orchestrator = createPermissionOrchestrator(
        mockSnapProvider,
        mockAccountController,
        mockPermissionType,
      );

      await expect(
        orchestrator.parseAndValidate({
          ...mockbasePermission,
          data: {},
        } as unknown as Permission),
      ).rejects.toThrow('Failed type validation: data.justification: Required');
    });
  });
});
