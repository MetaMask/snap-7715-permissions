import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import type {
  PermissionRequest,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import type { Json } from '@metamask/snaps-sdk';

import type { OrchestratorFactory } from '../../src/core/orchestratorFactory';
import type { ProfileSyncManager } from '../../src/profileSync';
import { createRpcHandler, type RpcHandler } from '../../src/rpc/rpcHandler';

type OrchestrateFunction = (args: { origin: string }) => Promise<{
  success: boolean;
  response?: PermissionResponse;
  reason?: string;
}>;

type Orchestrator = {
  orchestrate: OrchestrateFunction;
};

const TEST_ADDRESS = '0x1234567890123456789012345678901234567890' as const;
const TEST_SITE_ORIGIN = 'https://example.com';
const TEST_CHAIN_ID = '0x1' as const;
const TEST_EXPIRY = 1234567890;
const TEST_CONTEXT = '0xabcd' as const;

const VALID_PERMISSION_REQUEST: PermissionRequest = {
  chainId: TEST_CHAIN_ID,
  expiry: TEST_EXPIRY,
  signer: {
    type: 'account',
    data: { address: TEST_ADDRESS },
  },
  permission: {
    type: 'test-permission',
    data: {
      justification: 'Testing permission request',
    },
  },
};

const VALID_REQUEST: Json = {
  permissionsRequest: [VALID_PERMISSION_REQUEST] as unknown as Json[],
  siteOrigin: TEST_SITE_ORIGIN,
};

const VALID_PERMISSION_RESPONSE: PermissionResponse = {
  chainId: TEST_CHAIN_ID,
  expiry: TEST_EXPIRY,
  signer: {
    type: 'account',
    data: { address: TEST_ADDRESS },
  },
  permission: {
    type: 'test-permission',
    data: { justification: 'Testing permission request' },
  },
  context: TEST_CONTEXT,
  signerMeta: {
    delegationManager: TEST_ADDRESS,
  },
};

const MOCK_SUCCESS_RESPONSE = {
  success: true,
  response: VALID_PERMISSION_RESPONSE,
} as const;

describe('RpcHandler', () => {
  let handler: RpcHandler;
  let mockOrchestrator: jest.Mocked<Orchestrator>;
  let mockOrchestratorFactory: jest.Mocked<OrchestratorFactory>;

  beforeEach(() => {
    mockOrchestrator = {
      orchestrate: jest.fn<OrchestrateFunction>(),
    };

    mockOrchestratorFactory = {
      createOrchestrator: jest.fn().mockReturnValue(mockOrchestrator),
    } as unknown as jest.Mocked<OrchestratorFactory>;
    const mockProfileSyncManager = {
      revokeGrantedPermission: jest.fn(),
      storeGrantedPermission: jest.fn(),
      storeGrantedPermissionBatch: jest.fn(),
      getGrantedPermission: jest.fn(),
      getAllGrantedPermissions: jest.fn(),
      getUserProfile: jest.fn(),
    } as unknown as jest.Mocked<ProfileSyncManager>;

    handler = createRpcHandler({
      orchestratorFactory: mockOrchestratorFactory,
      profileSyncManager: mockProfileSyncManager,
    });
  });

  describe('grantPermission', () => {
    it('should handle a single permission request successfully', async () => {
      mockOrchestrator.orchestrate.mockImplementation(
        async () => MOCK_SUCCESS_RESPONSE,
      );

      const result = await handler.grantPermission(VALID_REQUEST);

      expect(mockOrchestratorFactory.createOrchestrator).toHaveBeenCalledTimes(
        1,
      );

      expect(mockOrchestratorFactory.createOrchestrator).toHaveBeenCalledWith(
        VALID_PERMISSION_REQUEST,
      );

      expect(mockOrchestrator.orchestrate).toHaveBeenCalledTimes(1);
      expect(mockOrchestrator.orchestrate).toHaveBeenCalledWith({
        origin: TEST_SITE_ORIGIN,
      });

      expect(result).toStrictEqual([VALID_PERMISSION_RESPONSE]);
    });

    it('should throw an error if no parameters are provided', async () => {
      await expect(handler.grantPermission()).rejects.toThrow(
        'Failed type validation: : Required',
      );
    });

    it('should throw an error if permissionsRequest is missing', async () => {
      await expect(
        handler.grantPermission({
          siteOrigin: TEST_SITE_ORIGIN,
        } as unknown as Json),
      ).rejects.toThrow('Failed type validation: permissionsRequest: Required');
    });

    it('should throw an error if siteOrigin is missing', async () => {
      await expect(
        handler.grantPermission({
          ...VALID_REQUEST,
          siteOrigin: undefined,
        } as unknown as Json),
      ).rejects.toThrow('Failed type validation: siteOrigin: Required');
    });

    it('should resolve to an empty response if permissionsRequest is empty array', async () => {
      expect(
        await handler.grantPermission({
          permissionsRequest: [],
          siteOrigin: TEST_SITE_ORIGIN,
        } as unknown as Json),
      ).toStrictEqual([]);
    });

    it('should handle multiple permission requests in parallel', async () => {
      const secondPermissionRequest = {
        ...VALID_PERMISSION_REQUEST,
        chainId: '0x2' as const,
      };

      const secondResponse = {
        ...VALID_PERMISSION_RESPONSE,
        chainId: '0x2' as const,
      };

      const request: Json = {
        permissionsRequest: [
          VALID_PERMISSION_REQUEST,
          secondPermissionRequest,
        ] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      mockOrchestrator.orchestrate
        .mockImplementationOnce(async () => MOCK_SUCCESS_RESPONSE)
        .mockImplementationOnce(async () => ({
          success: true,
          response: secondResponse,
        }));

      const result = await handler.grantPermission(request);

      expect(mockOrchestratorFactory.createOrchestrator).toHaveBeenCalledTimes(
        2,
      );
      expect(
        mockOrchestratorFactory.createOrchestrator,
      ).toHaveBeenNthCalledWith(1, VALID_PERMISSION_REQUEST);
      expect(
        mockOrchestratorFactory.createOrchestrator,
      ).toHaveBeenNthCalledWith(2, secondPermissionRequest);

      expect(mockOrchestrator.orchestrate).toHaveBeenCalledTimes(2);
      expect(mockOrchestrator.orchestrate).toHaveBeenCalledWith({
        origin: TEST_SITE_ORIGIN,
      });

      expect(result).toStrictEqual([VALID_PERMISSION_RESPONSE, secondResponse]);
    });

    it('should handle mixed success/failure responses for multiple requests', async () => {
      const secondPermissionRequest = {
        ...VALID_PERMISSION_REQUEST,
        chainId: '0x2' as const,
      };

      const request: Json = {
        permissionsRequest: [
          VALID_PERMISSION_REQUEST,
          secondPermissionRequest,
        ] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      mockOrchestrator.orchestrate
        .mockImplementationOnce(async () => MOCK_SUCCESS_RESPONSE)
        .mockImplementationOnce(async () => ({
          success: false,
          reason: 'User rejected the permissions request',
        }));

      await expect(handler.grantPermission(request)).rejects.toThrow(
        'User rejected the permissions request',
      );

      expect(mockOrchestratorFactory.createOrchestrator).toHaveBeenCalledTimes(
        2,
      );
      expect(mockOrchestrator.orchestrate).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if orchestrator creation fails', async () => {
      mockOrchestratorFactory.createOrchestrator.mockImplementation(() => {
        throw new Error('Failed to create orchestrator');
      });

      await expect(handler.grantPermission(VALID_REQUEST)).rejects.toThrow(
        'Failed to create orchestrator',
      );
    });

    it('should throw an error if orchestration fails', async () => {
      mockOrchestrator.orchestrate.mockImplementation(async () => ({
        success: false,
        reason: 'Orchestration failed',
      }));

      await expect(handler.grantPermission(VALID_REQUEST)).rejects.toThrow(
        'Orchestration failed',
      );
    });

    it('should handle orchestrator returning undefined response', async () => {
      const mockResponseWithUndefined: {
        success: boolean;
        response?: PermissionResponse;
      } = {
        success: true,
        response: undefined as unknown as PermissionResponse,
      };

      mockOrchestrator.orchestrate.mockImplementation(
        async () => mockResponseWithUndefined,
      );

      const result = await handler.grantPermission(VALID_REQUEST);
      expect(result).toStrictEqual([]);
    });

    it('should handle permission requests with optional fields missing', async () => {
      const requestWithoutOptionals = {
        ...VALID_PERMISSION_REQUEST,
        isAdjustmentAllowed: undefined,
      };

      const request: Json = {
        permissionsRequest: [requestWithoutOptionals] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      mockOrchestrator.orchestrate.mockImplementation(
        async () => MOCK_SUCCESS_RESPONSE,
      );

      const result = await handler.grantPermission(request);
      expect(result).toStrictEqual([VALID_PERMISSION_RESPONSE]);
    });

    it('should handle permission requests with all optional fields present', async () => {
      const requestWithOptionals = {
        ...VALID_PERMISSION_REQUEST,
        isAdjustmentAllowed: true,
        address: TEST_ADDRESS,
      };

      const request: Json = {
        permissionsRequest: [requestWithOptionals] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      mockOrchestrator.orchestrate.mockImplementation(
        async () => MOCK_SUCCESS_RESPONSE,
      );

      const result = await handler.grantPermission(request);
      expect(result).toStrictEqual([VALID_PERMISSION_RESPONSE]);
    });

    it('should handle requests with different permission types', async () => {
      const differentPermissionRequest = {
        ...VALID_PERMISSION_REQUEST,
        permission: {
          type: 'different-permission',
          data: {
            justification: 'Testing different permission type',
          },
        },
      };

      const differentResponse = {
        ...VALID_PERMISSION_RESPONSE,
        permission: {
          type: 'different-permission',
          data: {
            justification: 'Testing different permission type',
          },
        },
      };

      const request: Json = {
        permissionsRequest: [differentPermissionRequest] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      mockOrchestrator.orchestrate.mockImplementation(async () => ({
        success: true,
        response: differentResponse,
      }));

      const result = await handler.grantPermission(request);
      expect(result).toStrictEqual([differentResponse]);
    });

    // Response processing tests
    it('should properly filter undefined responses', async () => {
      const request: Json = {
        permissionsRequest: [
          VALID_PERMISSION_REQUEST,
          VALID_PERMISSION_REQUEST,
        ] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      const mockResponseWithUndefined: {
        success: boolean;
        response?: PermissionResponse;
      } = {
        success: true,
        response: undefined as unknown as PermissionResponse,
      };

      mockOrchestrator.orchestrate
        .mockImplementationOnce(async () => mockResponseWithUndefined)
        .mockImplementationOnce(async () => MOCK_SUCCESS_RESPONSE);

      const result = await handler.grantPermission(request);
      expect(result).toStrictEqual([VALID_PERMISSION_RESPONSE]);
    });

    it('should maintain response order matching request order', async () => {
      const secondPermissionRequest = {
        ...VALID_PERMISSION_REQUEST,
        chainId: '0x2' as const,
      };

      const secondResponse = {
        ...VALID_PERMISSION_RESPONSE,
        chainId: '0x2' as const,
      };

      const request: Json = {
        permissionsRequest: [
          VALID_PERMISSION_REQUEST,
          secondPermissionRequest,
        ] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      // Simulate async responses resolving in reverse order
      mockOrchestrator.orchestrate
        .mockImplementationOnce(
          async () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(MOCK_SUCCESS_RESPONSE), 100),
            ),
        )
        .mockImplementationOnce(async () => ({
          success: true,
          response: secondResponse,
        }));

      const result = await handler.grantPermission(request);
      expect(result).toStrictEqual([VALID_PERMISSION_RESPONSE, secondResponse]);
    });
  });
});
