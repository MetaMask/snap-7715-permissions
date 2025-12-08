import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import type {
  PermissionRequest,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import {
  decodeDelegations,
  hashDelegation,
  type Hex,
} from '@metamask/delegation-core';
import {
  ChainDisconnectedError,
  InvalidInputError,
  ResourceUnavailableError,
  type Json,
} from '@metamask/snaps-sdk';

import type { BlockchainTokenMetadataClient } from '../../src/clients/blockchainMetadataClient';
import type { PermissionHandlerFactory } from '../../src/core/permissionHandlerFactory';
import type { PermissionHandlerType } from '../../src/core/types';
import type {
  ProfileSyncManager,
  StoredGrantedPermission,
} from '../../src/profileSync';
import { createRpcHandler, type RpcHandler } from '../../src/rpc/rpcHandler';

// Mock the delegation-core functions
jest.mock('@metamask/delegation-core', () => ({
  decodeDelegations: jest.fn(),
  hashDelegation: jest.fn(),
}));

const TEST_ADDRESS = '0x1234567890123456789012345678901234567890' as const;
const TEST_SITE_ORIGIN = 'https://example.com';
const TEST_CHAIN_ID = '0x1' as const;
const TEST_EXPIRY = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
const TEST_CONTEXT = '0xabcd' as const;
const TEST_VALID_TX_HASH =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hex;
const TEST_EMPTY_TX_HASH = '0x' as Hex;

const VALID_PERMISSION_REQUEST: PermissionRequest = {
  chainId: TEST_CHAIN_ID,
  rules: [
    {
      type: 'expiry',
      data: {
        timestamp: TEST_EXPIRY,
      },
      isAdjustmentAllowed: true,
    },
  ],
  signer: {
    type: 'account',
    data: { address: TEST_ADDRESS },
  },
  permission: {
    type: 'test-permission',
    data: {
      justification: 'Testing permission request',
    },
    isAdjustmentAllowed: true,
  },
};

const VALID_REQUEST: Json = {
  permissionsRequest: [VALID_PERMISSION_REQUEST] as unknown as Json[],
  siteOrigin: TEST_SITE_ORIGIN,
};

const VALID_PERMISSION_RESPONSE: PermissionResponse = {
  chainId: TEST_CHAIN_ID,
  rules: [
    {
      type: 'expiry',
      data: {
        timestamp: TEST_EXPIRY,
      },
      isAdjustmentAllowed: true,
    },
  ],
  signer: {
    type: 'account',
    data: { address: TEST_ADDRESS },
  },
  permission: {
    type: 'test-permission',
    data: { justification: 'Testing permission request' },
    isAdjustmentAllowed: true,
  },
  context: TEST_CONTEXT,
  dependencyInfo: [],
  signerMeta: {
    delegationManager: TEST_ADDRESS,
  },
};

const MOCK_SUCCESS_RESPONSE = {
  approved: true,
  response: VALID_PERMISSION_RESPONSE,
} as const;

describe('RpcHandler', () => {
  let handler: RpcHandler;
  let mockHandler: jest.Mocked<PermissionHandlerType>;
  let mockHandlerFactory: jest.Mocked<PermissionHandlerFactory>;
  let mockProfileSyncManager: jest.Mocked<ProfileSyncManager>;
  let mockBlockchainMetadataClient: jest.Mocked<BlockchainTokenMetadataClient>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup delegation-core mocks
    (
      decodeDelegations as jest.MockedFunction<typeof decodeDelegations>
    ).mockReturnValue([
      {
        /* mock delegation */
      },
    ] as any);
    (
      hashDelegation as jest.MockedFunction<typeof hashDelegation>
    ).mockReturnValue(
      '0x1234567890123456789012345678901234567890123456789012345678901234' as any,
    );

    mockHandler = {
      handlePermissionRequest: jest.fn(),
    } as unknown as jest.Mocked<PermissionHandlerType>;

    mockHandlerFactory = {
      createPermissionHandler: jest.fn().mockReturnValue(mockHandler),
    } as unknown as jest.Mocked<PermissionHandlerFactory>;
    mockProfileSyncManager = {
      revokeGrantedPermission: jest.fn(),
      storeGrantedPermission: jest.fn(),
      storeGrantedPermissionBatch: jest.fn(),
      getGrantedPermission: jest.fn(),
      getAllGrantedPermissions: jest.fn(),
      getUserProfile: jest.fn(),
      updatePermissionRevocationStatus: jest.fn(),
    } as unknown as jest.Mocked<ProfileSyncManager>;

    mockBlockchainMetadataClient = {
      checkDelegationDisabledOnChain: jest.fn(),
      getTokenBalanceAndMetadata: jest.fn(),
    } as unknown as jest.Mocked<BlockchainTokenMetadataClient>;

    handler = createRpcHandler({
      permissionHandlerFactory: mockHandlerFactory,
      profileSyncManager: mockProfileSyncManager,
      blockchainMetadataClient: mockBlockchainMetadataClient,
    });
  });

  describe('grantPermission', () => {
    it('should handle a single permission request successfully', async () => {
      mockHandler.handlePermissionRequest.mockImplementation(
        async () => MOCK_SUCCESS_RESPONSE,
      );

      const result = await handler.grantPermission(VALID_REQUEST);

      expect(mockHandlerFactory.createPermissionHandler).toHaveBeenCalledTimes(
        1,
      );

      expect(mockHandlerFactory.createPermissionHandler).toHaveBeenCalledWith(
        VALID_PERMISSION_REQUEST,
      );

      expect(mockHandler.handlePermissionRequest).toHaveBeenCalledTimes(1);
      expect(mockHandler.handlePermissionRequest).toHaveBeenCalledWith(
        TEST_SITE_ORIGIN,
      );

      expect(result).toStrictEqual([VALID_PERMISSION_RESPONSE]);
    });

    it('should handle a permission request with a different supported chainId successfully', async () => {
      const differentSupportedChainId = '0x10';
      const permissionRequestWithDifferentSupportedChainId = {
        ...VALID_PERMISSION_REQUEST,
        chainId: differentSupportedChainId,
      };

      const requestWithDifferentSupportedChainId = {
        permissionsRequest: [
          permissionRequestWithDifferentSupportedChainId,
        ] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      const responseWithDifferentSupportedChainId = {
        approved: true,
        response: {
          ...VALID_PERMISSION_RESPONSE,
          chainId: differentSupportedChainId,
        },
      } as const;

      mockHandler.handlePermissionRequest.mockImplementation(
        async () => responseWithDifferentSupportedChainId,
      );

      const result = await handler.grantPermission(
        requestWithDifferentSupportedChainId,
      );

      expect(mockHandlerFactory.createPermissionHandler).toHaveBeenCalledTimes(
        1,
      );

      expect(mockHandlerFactory.createPermissionHandler).toHaveBeenCalledWith(
        permissionRequestWithDifferentSupportedChainId,
      );

      expect(mockHandler.handlePermissionRequest).toHaveBeenCalledTimes(1);
      expect(mockHandler.handlePermissionRequest).toHaveBeenCalledWith(
        TEST_SITE_ORIGIN,
      );

      expect(result).toStrictEqual([
        responseWithDifferentSupportedChainId.response,
      ]);
    });

    it('should throw an error if no parameters are provided', async () => {
      await expect(handler.grantPermission()).rejects.toThrow(
        'Failed type validation: Required',
      );
    });

    it('should handle permission request with null justification and return default message', async () => {
      const requestWithNullJustification: Json = {
        permissionsRequest: [
          {
            ...VALID_PERMISSION_REQUEST,
            permission: {
              ...VALID_PERMISSION_REQUEST.permission,
              data: {
                ...VALID_PERMISSION_REQUEST.permission.data,
                justification: null,
              },
            },
          },
        ] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      const expectedResponseWithDefaultJustification = {
        ...VALID_PERMISSION_RESPONSE,
        permission: {
          ...VALID_PERMISSION_RESPONSE.permission,
          data: {
            ...VALID_PERMISSION_RESPONSE.permission.data,
            justification: 'No justification was provided for the permission',
          },
        },
      };

      const mockSuccessResponseWithDefaultJustification = {
        approved: true as const,
        response: expectedResponseWithDefaultJustification,
      };

      mockHandler.handlePermissionRequest.mockImplementation(
        async () => mockSuccessResponseWithDefaultJustification,
      );

      const result = await handler.grantPermission(
        requestWithNullJustification,
      );

      expect(mockHandlerFactory.createPermissionHandler).toHaveBeenCalledTimes(
        1,
      );
      expect(mockHandler.handlePermissionRequest).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual([expectedResponseWithDefaultJustification]);
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
        chainId: TEST_CHAIN_ID,
      };

      const secondResponse = {
        ...VALID_PERMISSION_RESPONSE,
        chainId: TEST_CHAIN_ID,
      };

      const request: Json = {
        permissionsRequest: [
          VALID_PERMISSION_REQUEST,
          secondPermissionRequest,
        ] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      mockHandler.handlePermissionRequest
        .mockImplementationOnce(async () => MOCK_SUCCESS_RESPONSE)
        .mockImplementationOnce(async () => ({
          approved: true,
          response: secondResponse,
        }));

      const result = await handler.grantPermission(request);

      expect(mockHandlerFactory.createPermissionHandler).toHaveBeenCalledTimes(
        2,
      );
      expect(
        mockHandlerFactory.createPermissionHandler,
      ).toHaveBeenNthCalledWith(1, VALID_PERMISSION_REQUEST);
      expect(
        mockHandlerFactory.createPermissionHandler,
      ).toHaveBeenNthCalledWith(2, secondPermissionRequest);

      expect(mockHandler.handlePermissionRequest).toHaveBeenCalledTimes(2);
      expect(mockHandler.handlePermissionRequest).toHaveBeenCalledWith(
        TEST_SITE_ORIGIN,
      );

      expect(result).toStrictEqual([VALID_PERMISSION_RESPONSE, secondResponse]);
    });

    it('should handle mixed success/failure responses for multiple requests', async () => {
      const secondPermissionRequest = {
        ...VALID_PERMISSION_REQUEST,
        chainId: TEST_CHAIN_ID,
      };

      const request: Json = {
        permissionsRequest: [
          VALID_PERMISSION_REQUEST,
          secondPermissionRequest,
        ] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      mockHandler.handlePermissionRequest
        .mockImplementationOnce(async () => MOCK_SUCCESS_RESPONSE)
        .mockImplementationOnce(async () => ({
          approved: false,
          reason: 'User rejected the permissions request',
        }));

      await expect(handler.grantPermission(request)).rejects.toThrow(
        'User rejected the permissions request',
      );

      expect(mockHandlerFactory.createPermissionHandler).toHaveBeenCalledTimes(
        2,
      );
      expect(mockHandler.handlePermissionRequest).toHaveBeenCalledTimes(2);
    });

    it('should process multiple permission requests sequentially (no concurrency)', async () => {
      const secondPermissionRequest = {
        ...VALID_PERMISSION_REQUEST,
        chainId: TEST_CHAIN_ID,
      };

      const secondResponse = {
        ...VALID_PERMISSION_RESPONSE,
        chainId: TEST_CHAIN_ID,
      };

      const request: Json = {
        permissionsRequest: [
          VALID_PERMISSION_REQUEST,
          secondPermissionRequest,
        ] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      let resolveFirst: (value: unknown) => void;
      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      const firstMockHandler: jest.Mocked<PermissionHandlerType> = {
        handlePermissionRequest: jest
          .fn()
          .mockImplementation(
            async () => firstPromise as unknown as Promise<any>,
          ),
      } as unknown as jest.Mocked<PermissionHandlerType>;

      const secondMockHandler: jest.Mocked<PermissionHandlerType> = {
        handlePermissionRequest: jest.fn().mockImplementation(async () => ({
          approved: true,
          response: secondResponse,
        })),
      } as unknown as jest.Mocked<PermissionHandlerType>;

      mockHandlerFactory.createPermissionHandler
        .mockImplementationOnce(() => firstMockHandler)
        .mockImplementationOnce(() => secondMockHandler);

      const resultPromise = handler.grantPermission(request);

      // Yield to allow the first await to be hit
      await Promise.resolve();
      expect(secondMockHandler.handlePermissionRequest).not.toHaveBeenCalled();

      // Resolve the first request and then ensure the second starts
      // @ts-expect-error - resolveFirst is assigned above
      resolveFirst({ approved: true, response: VALID_PERMISSION_RESPONSE });
      const result = await resultPromise;

      expect(firstMockHandler.handlePermissionRequest).toHaveBeenCalledTimes(1);
      expect(secondMockHandler.handlePermissionRequest).toHaveBeenCalledTimes(
        1,
      );
      expect(result).toStrictEqual([VALID_PERMISSION_RESPONSE, secondResponse]);
    });

    it('should throw an error if orchestrator creation fails', async () => {
      mockHandlerFactory.createPermissionHandler.mockImplementation(() => {
        throw new Error('Failed to create orchestrator');
      });

      await expect(handler.grantPermission(VALID_REQUEST)).rejects.toThrow(
        'Failed to create orchestrator',
      );
    });

    it('should throw an error if orchestration fails', async () => {
      mockHandler.handlePermissionRequest.mockImplementation(async () => ({
        approved: false,
        reason: 'Orchestration failed',
      }));

      await expect(handler.grantPermission(VALID_REQUEST)).rejects.toThrow(
        'Orchestration failed',
      );
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

      mockHandler.handlePermissionRequest.mockImplementation(
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

      mockHandler.handlePermissionRequest.mockImplementation(
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
          isAdjustmentAllowed: true,
        },
      };

      const differentResponse = {
        ...VALID_PERMISSION_RESPONSE,
        permission: {
          type: 'different-permission',
          data: {
            justification: 'Testing different permission type',
          },
          isAdjustmentAllowed: true,
        },
      };

      const request: Json = {
        permissionsRequest: [differentPermissionRequest] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      mockHandler.handlePermissionRequest.mockImplementation(async () => ({
        approved: true,
        response: differentResponse,
      }));

      const result = await handler.grantPermission(request);
      expect(result).toStrictEqual([differentResponse]);
    });

    it('should maintain response order matching request order', async () => {
      const secondPermissionRequest = {
        ...VALID_PERMISSION_REQUEST,
        chainId: TEST_CHAIN_ID,
      };

      const secondResponse = {
        ...VALID_PERMISSION_RESPONSE,
        chainId: TEST_CHAIN_ID,
      };

      const request: Json = {
        permissionsRequest: [
          VALID_PERMISSION_REQUEST,
          secondPermissionRequest,
        ] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      // Simulate async responses resolving in reverse order
      mockHandler.handlePermissionRequest
        .mockImplementationOnce(
          async () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(MOCK_SUCCESS_RESPONSE), 100),
            ),
        )
        .mockImplementationOnce(async () => ({
          approved: true,
          response: secondResponse,
        }));

      const result = await handler.grantPermission(request);
      expect(result).toStrictEqual([VALID_PERMISSION_RESPONSE, secondResponse]);
    });
  });

  describe('getPermissionOffers', () => {
    it('should return the default permission offers', async () => {
      const result = await handler.getPermissionOffers();
      expect(result).toStrictEqual([
        {
          proposedName: 'Native Token Stream',
          type: 'native-token-stream',
        },
        {
          proposedName: 'Native Token Periodic Transfer',
          type: 'native-token-periodic',
        },
        {
          proposedName: 'ERC20 Token Stream',
          type: 'erc20-token-stream',
        },
        {
          proposedName: 'ERC20 Token Periodic Transfer',
          type: 'erc20-token-periodic',
        },
        {
          proposedName: 'ERC20 Token Revocation',
          type: 'erc20-token-revocation',
        },
      ]);
    });
  });

  describe('getGrantedPermissions', () => {
    it('should return all granted permissions successfully', async () => {
      const mockGrantedPermissions: StoredGrantedPermission[] = [
        {
          permissionResponse: {
            chainId: TEST_CHAIN_ID,
            rules: [
              {
                type: 'expiry',
                data: {
                  timestamp: TEST_EXPIRY,
                },
                isAdjustmentAllowed: true,
              },
            ],
            signer: {
              type: 'account' as const,
              data: { address: TEST_ADDRESS },
            },
            permission: {
              type: 'test-permission',
              data: { justification: 'Testing permission request' },
              isAdjustmentAllowed: true,
            },
            context: TEST_CONTEXT,
            dependencyInfo: [],
            signerMeta: {
              delegationManager: TEST_ADDRESS,
            },
          },
          siteOrigin: TEST_SITE_ORIGIN,
          isRevoked: false,
          metadata: {
            txHash: TEST_EMPTY_TX_HASH,
          },
        },
        {
          permissionResponse: {
            chainId: TEST_CHAIN_ID,
            rules: [
              {
                type: 'expiry',
                data: {
                  timestamp: TEST_EXPIRY + 1000,
                },
                isAdjustmentAllowed: true,
              },
            ],
            signer: {
              type: 'account' as const,
              data: {
                address: '0x0987654321098765432109876543210987654321' as const,
              },
            },
            permission: {
              type: 'different-permission',
              data: { justification: 'Another permission' },
              isAdjustmentAllowed: true,
            },
            context: '0xefgh' as const,
            dependencyInfo: [],
            signerMeta: {
              delegationManager:
                '0x0987654321098765432109876543210987654321' as const,
            },
          },
          siteOrigin: 'https://another-example.com',
          isRevoked: false,
          metadata: {
            txHash: TEST_EMPTY_TX_HASH,
          },
        },
      ];

      mockProfileSyncManager.getAllGrantedPermissions.mockResolvedValue(
        mockGrantedPermissions,
      );

      const result = await handler.getGrantedPermissions();

      expect(
        mockProfileSyncManager.getAllGrantedPermissions,
      ).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual(mockGrantedPermissions);
    });

    it('should return empty array when no permissions are granted', async () => {
      mockProfileSyncManager.getAllGrantedPermissions.mockResolvedValue([]);

      const result = await handler.getGrantedPermissions();

      expect(
        mockProfileSyncManager.getAllGrantedPermissions,
      ).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual([]);
    });

    it('should handle errors from profile sync manager', async () => {
      const errorMessage = 'Failed to retrieve granted permissions';
      mockProfileSyncManager.getAllGrantedPermissions.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(handler.getGrantedPermissions()).rejects.toThrow(
        errorMessage,
      );
      expect(
        mockProfileSyncManager.getAllGrantedPermissions,
      ).toHaveBeenCalledTimes(1);
    });

    describe('filtering options', () => {
      const mockGrantedPermissions = [
        {
          permissionResponse: {
            chainId: TEST_CHAIN_ID,
            rules: [
              {
                type: 'expiry',
                data: {
                  timestamp: TEST_EXPIRY,
                },
                isAdjustmentAllowed: true,
              },
            ],
            signer: {
              type: 'account' as const,
              data: { address: TEST_ADDRESS },
            },
            permission: {
              type: 'test-permission',
              data: { justification: 'Testing permission request' },
              isAdjustmentAllowed: true,
            },
            context: TEST_CONTEXT,
            dependencyInfo: [],
            signerMeta: {
              delegationManager: TEST_ADDRESS,
            },
          },
          siteOrigin: TEST_SITE_ORIGIN,
          isRevoked: false,
        },
        {
          permissionResponse: {
            chainId: '0x2' as const,
            rules: [
              {
                type: 'expiry',
                data: {
                  timestamp: TEST_EXPIRY + 1000,
                },
                isAdjustmentAllowed: true,
              },
            ],
            signer: {
              type: 'account' as const,
              data: {
                address: '0x0987654321098765432109876543210987654321' as const,
              },
            },
            permission: {
              type: 'different-permission',
              data: { justification: 'Another permission' },
              isAdjustmentAllowed: true,
            },
            context: '0xefgh' as const,
            dependencyInfo: [],
            signerMeta: {
              delegationManager:
                '0x0987654321098765432109876543210987654321' as const,
            },
          },
          siteOrigin: 'https://another-example.com',
          isRevoked: true,
          metadata: {
            txHash: TEST_VALID_TX_HASH,
          },
        },
        {
          permissionResponse: {
            chainId: TEST_CHAIN_ID,
            rules: [
              {
                type: 'expiry',
                data: {
                  timestamp: TEST_EXPIRY,
                },
                isAdjustmentAllowed: true,
              },
            ],
            signer: {
              type: 'account' as const,
              data: { address: TEST_ADDRESS },
            },
            permission: {
              type: 'third-permission',
              data: { justification: 'Third permission' },
              isAdjustmentAllowed: true,
            },
            context: '0xijkl' as const,
            dependencyInfo: [],
            signerMeta: {
              delegationManager:
                '0x1111111111111111111111111111111111111111' as const,
            },
          },
          siteOrigin: TEST_SITE_ORIGIN,
          isRevoked: false,
          metadata: {
            txHash: TEST_EMPTY_TX_HASH,
          },
        },
      ];

      beforeEach(() => {
        mockProfileSyncManager.getAllGrantedPermissions.mockResolvedValue(
          mockGrantedPermissions,
        );
      });

      it('should filter by isRevoked=true', async () => {
        const result = await handler.getGrantedPermissions({ isRevoked: true });

        expect(
          mockProfileSyncManager.getAllGrantedPermissions,
        ).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(1);
        expect((result as any[])[0].isRevoked).toBe(true);
      });

      it('should filter by isRevoked=false', async () => {
        const result = await handler.getGrantedPermissions({
          isRevoked: false,
        });

        expect(
          mockProfileSyncManager.getAllGrantedPermissions,
        ).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(2);
        expect(
          (result as any[]).every(
            (permission) => permission.isRevoked === false,
          ),
        ).toBe(true);
      });

      it('should filter by siteOrigin', async () => {
        const result = await handler.getGrantedPermissions({
          siteOrigin: TEST_SITE_ORIGIN,
        });

        expect(
          mockProfileSyncManager.getAllGrantedPermissions,
        ).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(2);
        expect(
          (result as any[]).every(
            (permission) => permission.siteOrigin === TEST_SITE_ORIGIN,
          ),
        ).toBe(true);
      });

      it('should filter by chainId', async () => {
        const result = await handler.getGrantedPermissions({
          chainId: TEST_CHAIN_ID,
        });

        expect(
          mockProfileSyncManager.getAllGrantedPermissions,
        ).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(2);
        expect(
          (result as any[]).every(
            (permission) =>
              permission.permissionResponse.chainId === TEST_CHAIN_ID,
          ),
        ).toBe(true);
      });

      it('should filter by delegationManager', async () => {
        const result = await handler.getGrantedPermissions({
          delegationManager: TEST_ADDRESS,
        });

        expect(
          mockProfileSyncManager.getAllGrantedPermissions,
        ).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(1);
        expect(
          (result as any[])[0].permissionResponse.signerMeta.delegationManager,
        ).toBe(TEST_ADDRESS);
      });

      it('should combine multiple filters', async () => {
        const result = await handler.getGrantedPermissions({
          isRevoked: false,
          siteOrigin: TEST_SITE_ORIGIN,
          chainId: TEST_CHAIN_ID,
          delegationManager: TEST_ADDRESS,
        });

        expect(
          mockProfileSyncManager.getAllGrantedPermissions,
        ).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(1);
        const permission = (result as any[])[0];
        expect(permission.isRevoked).toBe(false);
        expect(permission.siteOrigin).toBe(TEST_SITE_ORIGIN);
        expect(permission.permissionResponse.chainId).toBe(TEST_CHAIN_ID);
        expect(permission.permissionResponse.signerMeta.delegationManager).toBe(
          TEST_ADDRESS,
        );
      });

      it('should return empty array when no permissions match filters', async () => {
        const result = await handler.getGrantedPermissions({
          isRevoked: true,
          siteOrigin: 'https://nonexistent.com',
        });

        expect(
          mockProfileSyncManager.getAllGrantedPermissions,
        ).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(0);
      });

      it('should ignore invalid filter values', async () => {
        const result = await handler.getGrantedPermissions({
          isRevoked: 'invalid' as any,
          siteOrigin: 123 as any,
          chainId: null as any,
          delegationManager: undefined as any,
        });

        expect(
          mockProfileSyncManager.getAllGrantedPermissions,
        ).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(3); // All permissions returned since filters are ignored
      });

      it('should handle empty params object', async () => {
        const result = await handler.getGrantedPermissions({});

        expect(
          mockProfileSyncManager.getAllGrantedPermissions,
        ).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(3); // All permissions returned
      });

      it('should handle null params', async () => {
        const result = await handler.getGrantedPermissions(null as any);

        expect(
          mockProfileSyncManager.getAllGrantedPermissions,
        ).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(3); // All permissions returned
      });

      it('should handle undefined params', async () => {
        const result = await handler.getGrantedPermissions(undefined as any);

        expect(
          mockProfileSyncManager.getAllGrantedPermissions,
        ).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(3); // All permissions returned
      });
    });
  });

  describe('submitRevocation', () => {
    const validRevocationParams = {
      permissionContext: TEST_CONTEXT,
      txHash: TEST_VALID_TX_HASH,
    };

    it('should successfully submit revocation with valid parameters', async () => {
      const mockPermission = {
        permissionResponse: {
          chainId: TEST_CHAIN_ID,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: TEST_EXPIRY,
              },
              isAdjustmentAllowed: true,
            },
          ],
          signer: {
            type: 'account' as const,
            data: { address: TEST_ADDRESS },
          },
          permission: {
            type: 'test-permission',
            data: { justification: 'Testing permission request' },
            isAdjustmentAllowed: true,
          },
          context: TEST_CONTEXT,
          dependencyInfo: [],
          signerMeta: {
            delegationManager: TEST_ADDRESS,
          },
        },
        siteOrigin: TEST_SITE_ORIGIN,
        isRevoked: false,
        metadata: {
          txHash: TEST_EMPTY_TX_HASH,
        },
      };

      mockProfileSyncManager.getGrantedPermission.mockResolvedValueOnce(
        mockPermission,
      );
      mockBlockchainMetadataClient.checkDelegationDisabledOnChain.mockResolvedValueOnce(
        true,
      );

      const result = await handler.submitRevocation(validRevocationParams);

      expect(result).toStrictEqual({ success: true });
      expect(mockProfileSyncManager.getGrantedPermission).toHaveBeenCalledWith(
        validRevocationParams.permissionContext,
      );
      expect(
        mockBlockchainMetadataClient.checkDelegationDisabledOnChain,
      ).toHaveBeenCalled();
      expect(
        mockProfileSyncManager.updatePermissionRevocationStatus,
      ).toHaveBeenCalledWith(TEST_CONTEXT, true, TEST_VALID_TX_HASH);
    });

    it('should throw InvalidInputError when permissionContext is invalid', async () => {
      const invalidParams = {
        ...validRevocationParams,
        permissionContext: 'invalid-context',
      };

      await expect(handler.submitRevocation(invalidParams)).rejects.toThrow(
        'Failed type validation: permissionContext: Invalid hex value',
      );
    });

    it('should throw InvalidInputError when permissionContext is wrong format', async () => {
      const invalidParams = {
        ...validRevocationParams,
        permissionContext: 'not-hex-string', // Invalid format
      };

      await expect(handler.submitRevocation(invalidParams)).rejects.toThrow(
        'Failed type validation: permissionContext: Invalid hex value',
      );
    });

    it('should throw InvalidInputError when params is null', async () => {
      await expect(handler.submitRevocation(null)).rejects.toThrow(
        'Parameters are required',
      );
    });

    it('should throw InvalidInputError when params is undefined', async () => {
      await expect(handler.submitRevocation(undefined as any)).rejects.toThrow(
        'Parameters are required',
      );
    });

    it('should throw InvalidInputError when params is not an object', async () => {
      await expect(handler.submitRevocation('invalid')).rejects.toThrow(
        'Parameters are required',
      );
    });

    it('should throw InvalidInputError when permissionContext is missing', async () => {
      const invalidParams = {};

      await expect(handler.submitRevocation(invalidParams)).rejects.toThrow(
        'Required',
      );
    });

    it('should propagate errors from updatePermissionRevocationStatus', async () => {
      const mockPermission = {
        permissionResponse: {
          chainId: TEST_CHAIN_ID,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: TEST_EXPIRY,
              },
              isAdjustmentAllowed: true,
            },
          ],
          signer: {
            type: 'account' as const,
            data: { address: TEST_ADDRESS },
          },
          permission: {
            type: 'test-permission',
            data: { justification: 'Testing permission request' },
            isAdjustmentAllowed: true,
          },
          context: TEST_CONTEXT,
          dependencyInfo: [],
          signerMeta: {
            delegationManager: TEST_ADDRESS,
          },
        },
        siteOrigin: TEST_SITE_ORIGIN,
        isRevoked: false,
        metadata: {
          txHash: TEST_EMPTY_TX_HASH,
        },
      };

      const profileSyncError = new Error('Update failed');
      mockProfileSyncManager.getGrantedPermission.mockResolvedValueOnce(
        mockPermission,
      );
      mockBlockchainMetadataClient.checkDelegationDisabledOnChain.mockResolvedValueOnce(
        true,
      );
      mockProfileSyncManager.updatePermissionRevocationStatus.mockRejectedValueOnce(
        profileSyncError,
      );

      await expect(
        handler.submitRevocation(validRevocationParams),
      ).rejects.toThrow('Update failed');

      expect(
        mockProfileSyncManager.updatePermissionRevocationStatus,
      ).toHaveBeenCalledWith(TEST_CONTEXT, true, TEST_VALID_TX_HASH);
    });

    it('should handle hex values with uppercase letters', async () => {
      const upperCaseParams = {
        permissionContext: '0x1234567890ABCDEF1234567890ABCDEF',
        txHash: TEST_VALID_TX_HASH,
      };

      const mockPermission = {
        permissionResponse: {
          chainId: '0xAA36A7' as const,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: TEST_EXPIRY,
              },
              isAdjustmentAllowed: true,
            },
          ],
          signer: {
            type: 'account' as const,
            data: { address: TEST_ADDRESS },
          },
          permission: {
            type: 'test-permission',
            data: { justification: 'Testing permission request' },
            isAdjustmentAllowed: true,
          },
          context: TEST_CONTEXT,
          dependencyInfo: [],
          signerMeta: {
            delegationManager: TEST_ADDRESS,
          },
        },
        siteOrigin: TEST_SITE_ORIGIN,
        isRevoked: false,
        metadata: {
          txHash: TEST_EMPTY_TX_HASH,
        },
      };

      mockProfileSyncManager.getGrantedPermission.mockResolvedValueOnce(
        mockPermission,
      );
      mockBlockchainMetadataClient.checkDelegationDisabledOnChain.mockResolvedValueOnce(
        true,
      );
      mockProfileSyncManager.updatePermissionRevocationStatus.mockResolvedValueOnce(
        undefined,
      );

      const result = await handler.submitRevocation(upperCaseParams);

      expect(result).toStrictEqual({ success: true });
      expect(mockProfileSyncManager.getGrantedPermission).toHaveBeenCalledWith(
        upperCaseParams.permissionContext,
      );
    });

    it('should handle different chain configurations', async () => {
      const testParams = {
        ...validRevocationParams,
      };

      const mockPermission = {
        permissionResponse: {
          chainId: '0xaa36a7' as const,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: TEST_EXPIRY,
              },
              isAdjustmentAllowed: true,
            },
          ],
          signer: {
            type: 'account' as const,
            data: { address: TEST_ADDRESS },
          },
          permission: {
            type: 'test-permission',
            data: { justification: 'Testing permission request' },
            isAdjustmentAllowed: true,
          },
          context: TEST_CONTEXT,
          dependencyInfo: [],
          signerMeta: {
            delegationManager: TEST_ADDRESS,
          },
        },
        siteOrigin: TEST_SITE_ORIGIN,
        isRevoked: false,
        metadata: {
          txHash: TEST_EMPTY_TX_HASH,
        },
      };

      mockProfileSyncManager.getGrantedPermission.mockResolvedValueOnce(
        mockPermission,
      );
      mockBlockchainMetadataClient.checkDelegationDisabledOnChain.mockResolvedValueOnce(
        true,
      );
      mockProfileSyncManager.updatePermissionRevocationStatus.mockResolvedValueOnce(
        undefined,
      );

      const result = await handler.submitRevocation(testParams);

      expect(result).toStrictEqual({ success: true });
      expect(mockProfileSyncManager.getGrantedPermission).toHaveBeenCalledWith(
        testParams.permissionContext,
      );
    });

    it('should throw InvalidInputError when delegation is not disabled on-chain', async () => {
      const mockPermission = {
        permissionResponse: {
          chainId: TEST_CHAIN_ID,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: TEST_EXPIRY,
              },
              isAdjustmentAllowed: true,
            },
          ],
          signer: {
            type: 'account' as const,
            data: { address: TEST_ADDRESS },
          },
          permission: {
            type: 'test-permission',
            data: { justification: 'Testing permission request' },
            isAdjustmentAllowed: true,
          },
          context: TEST_CONTEXT,
          dependencyInfo: [],
          signerMeta: {
            delegationManager: TEST_ADDRESS,
          },
        },
        siteOrigin: TEST_SITE_ORIGIN,
        isRevoked: false,
        metadata: {
          txHash: TEST_EMPTY_TX_HASH,
        },
      };

      mockProfileSyncManager.getGrantedPermission.mockResolvedValueOnce(
        mockPermission,
      );
      mockBlockchainMetadataClient.checkDelegationDisabledOnChain.mockResolvedValueOnce(
        false,
      );

      await expect(
        handler.submitRevocation(validRevocationParams),
      ).rejects.toThrow('is not disabled on-chain');

      expect(
        mockBlockchainMetadataClient.checkDelegationDisabledOnChain,
      ).toHaveBeenCalled();
      expect(
        mockProfileSyncManager.updatePermissionRevocationStatus,
      ).not.toHaveBeenCalled();
    });

    it('should propagate ResourceUnavailableError when on-chain check fails', async () => {
      const mockPermission = {
        permissionResponse: {
          chainId: TEST_CHAIN_ID,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: TEST_EXPIRY,
              },
              isAdjustmentAllowed: true,
            },
          ],
          signer: {
            type: 'account' as const,
            data: { address: TEST_ADDRESS },
          },
          permission: {
            type: 'test-permission',
            data: { justification: 'Testing permission request' },
            isAdjustmentAllowed: true,
          },
          context: TEST_CONTEXT,
          dependencyInfo: [],
          signerMeta: {
            delegationManager: TEST_ADDRESS,
          },
        },
        siteOrigin: TEST_SITE_ORIGIN,
        isRevoked: false,
        metadata: {
          txHash: TEST_EMPTY_TX_HASH,
        },
      };

      const resourceUnavailableError = new ResourceUnavailableError(
        'Unable to determine delegation disabled status',
      );

      mockProfileSyncManager.getGrantedPermission.mockResolvedValueOnce(
        mockPermission,
      );
      mockBlockchainMetadataClient.checkDelegationDisabledOnChain.mockRejectedValueOnce(
        resourceUnavailableError,
      );

      await expect(
        handler.submitRevocation(validRevocationParams),
      ).rejects.toThrow('Unable to determine delegation disabled status');

      expect(
        mockBlockchainMetadataClient.checkDelegationDisabledOnChain,
      ).toHaveBeenCalled();
      expect(
        mockProfileSyncManager.updatePermissionRevocationStatus,
      ).not.toHaveBeenCalled();
    });

    it('should propagate ChainDisconnectedError when on-chain check fails due to wrong chain', async () => {
      const mockPermission = {
        permissionResponse: {
          chainId: TEST_CHAIN_ID,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: TEST_EXPIRY,
              },
              isAdjustmentAllowed: true,
            },
          ],
          signer: {
            type: 'account' as const,
            data: { address: TEST_ADDRESS },
          },
          permission: {
            type: 'test-permission',
            data: { justification: 'Testing permission request' },
            isAdjustmentAllowed: true,
          },
          context: TEST_CONTEXT,
          dependencyInfo: [],
          signerMeta: {
            delegationManager: TEST_ADDRESS,
          },
        },
        siteOrigin: TEST_SITE_ORIGIN,
        isRevoked: false,
        metadata: {
          txHash: TEST_EMPTY_TX_HASH,
        },
      };

      const chainDisconnectedError = new ChainDisconnectedError(
        'Selected chain does not match the requested chain',
      );

      mockProfileSyncManager.getGrantedPermission.mockResolvedValueOnce(
        mockPermission,
      );
      mockBlockchainMetadataClient.checkDelegationDisabledOnChain.mockRejectedValueOnce(
        chainDisconnectedError,
      );

      await expect(
        handler.submitRevocation(validRevocationParams),
      ).rejects.toThrow('Selected chain does not match the requested chain');

      expect(
        mockBlockchainMetadataClient.checkDelegationDisabledOnChain,
      ).toHaveBeenCalled();
      expect(
        mockProfileSyncManager.updatePermissionRevocationStatus,
      ).not.toHaveBeenCalled();
    });

    it('should propagate InvalidInputError from on-chain check', async () => {
      const mockPermission = {
        permissionResponse: {
          chainId: TEST_CHAIN_ID,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: TEST_EXPIRY,
              },
              isAdjustmentAllowed: true,
            },
          ],
          signer: {
            type: 'account' as const,
            data: { address: TEST_ADDRESS },
          },
          permission: {
            type: 'test-permission',
            data: { justification: 'Testing permission request' },
            isAdjustmentAllowed: true,
          },
          context: TEST_CONTEXT,
          dependencyInfo: [],
          signerMeta: {
            delegationManager: TEST_ADDRESS,
          },
        },
        siteOrigin: TEST_SITE_ORIGIN,
        isRevoked: false,
        metadata: {
          txHash: TEST_EMPTY_TX_HASH,
        },
      };

      const invalidInputError = new InvalidInputError(
        'No delegation hash provided',
      );

      mockProfileSyncManager.getGrantedPermission.mockResolvedValueOnce(
        mockPermission,
      );
      mockBlockchainMetadataClient.checkDelegationDisabledOnChain.mockRejectedValueOnce(
        invalidInputError,
      );

      await expect(
        handler.submitRevocation(validRevocationParams),
      ).rejects.toThrow('No delegation hash provided');

      expect(
        mockBlockchainMetadataClient.checkDelegationDisabledOnChain,
      ).toHaveBeenCalled();
      expect(
        mockProfileSyncManager.updatePermissionRevocationStatus,
      ).not.toHaveBeenCalled();
    });
  });
});
