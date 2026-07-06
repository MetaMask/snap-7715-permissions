import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import {
  decodeDelegations,
  ROOT_AUTHORITY,
  createTimestampTerms,
  createNonceTerms,
  createRedeemerTerms,
} from '@metamask/delegation-core';
import { InvalidInputError } from '@metamask/snaps-sdk';
import { bigIntToHex, bytesToHex } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type { AccountController } from '../../../src/core/accountController';
import { getChainMetadata } from '../../../src/core/chainMetadata';
import { GrantedPermissionResolutionService } from '../../../src/core/grant/GrantedPermissionResolutionService';
import { SENTINEL_REDEEMER_ADDRESSES } from '../../../src/core/sentinelRedeemer';
import type { BaseContext } from '../../../src/core/types';
import type { NonceCaveatService } from '../../../src/services/nonceCaveatService';
import type { SnapsMetricsService } from '../../../src/services/snapsMetricsService';

const randomAddress = (): Hex => {
  const randomBytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256);
  }
  return bytesToHex(randomBytes);
};

const mockSignature = '0x1234';
const grantingAccountAddress = randomAddress();
const fixedCaip10Address = `eip155:1:${grantingAccountAddress}`;

const mockContext: BaseContext = {
  expiry: '2024-12-31',
  isAdjustmentAllowed: true,
  from: grantingAccountAddress,
  accountAddressCaip10: fixedCaip10Address,
  justification: '',
};

const requestingAccountAddress = randomAddress();
const expiryTimestamp = Math.floor(Date.now() / 1000 + 3600);
const mockPermissionRequest: PermissionRequest = {
  chainId: '0x1',
  to: requestingAccountAddress,
  permission: {
    type: 'test-permission',
    data: {},
    isAdjustmentAllowed: true,
  },
  rules: [
    {
      type: 'expiry',
      data: {
        timestamp: expiryTimestamp,
      },
    },
  ],
};

const mockResolvedPermissionRequest = {
  ...mockPermissionRequest,
  from: grantingAccountAddress,
  permission: {
    ...mockPermissionRequest.permission,
    data: { resolved: true },
  },
};

const mockPopulatedPermission = {
  ...mockResolvedPermissionRequest.permission,
  data: { populated: true },
};

const mockAccountController = {
  signDelegation: jest.fn(),
} as unknown as jest.Mocked<AccountController>;

const mockNonceCaveatService = {
  getNonce: jest.fn(),
} as unknown as jest.Mocked<NonceCaveatService>;

const mockSnapsMetricsService = {
  trackDelegationSigning: jest.fn().mockResolvedValue(undefined),
  trackPermissionGranted: jest.fn().mockResolvedValue(undefined),
} as unknown as jest.Mocked<SnapsMetricsService>;

type ResolutionHandlerMocks = {
  applyContext: jest.Mock;
  populatePermission: jest.Mock;
  createPermissionCaveats: jest.Mock;
};

describe('GrantedPermissionResolutionService', () => {
  let grantedPermissionResolutionService: GrantedPermissionResolutionService;
  let lifecycleHandlerMocks: ResolutionHandlerMocks;

  beforeEach(() => {
    jest.clearAllMocks();

    lifecycleHandlerMocks = {
      applyContext: jest.fn().mockResolvedValue(mockResolvedPermissionRequest),
      populatePermission: jest.fn().mockResolvedValue(mockPopulatedPermission),
      createPermissionCaveats: jest.fn(() => []),
    };

    mockAccountController.signDelegation.mockImplementation(
      async ({ delegation }) => ({
        ...delegation,
        signature: mockSignature,
      }),
    );

    mockNonceCaveatService.getNonce.mockResolvedValue(0n);

    grantedPermissionResolutionService = new GrantedPermissionResolutionService(
      {
        accountController: mockAccountController,
        nonceCaveatService: mockNonceCaveatService,
        snapsMetricsService: mockSnapsMetricsService,
      },
    );
  });

  describe('resolve', () => {
    it('returns a permission response with encoded delegation context', async () => {
      const response = await grantedPermissionResolutionService.resolve({
        origin: 'test-origin',
        chainId: 1,
        originalRequest: mockPermissionRequest,
        modifiedContext: mockContext,
        isAdjustmentAllowed: true,
        lifecycleHandlers: lifecycleHandlerMocks,
      });

      const {
        contracts: { delegationManager },
      } = getChainMetadata({
        chainId: Number(mockPermissionRequest.chainId),
      });

      expect(response).toStrictEqual({
        ...mockPermissionRequest,
        dependencies: [],
        permission: mockPopulatedPermission,
        from: grantingAccountAddress,
        context: expect.stringMatching(/^0x[0-9a-fA-F]+$/u),
        isAdjustmentAllowed: true,
        to: requestingAccountAddress,
        delegationManager,
      });
    });

    it('returns a context encoding the expected delegation', async () => {
      const response = await grantedPermissionResolutionService.resolve({
        origin: 'test-origin',
        chainId: 1,
        originalRequest: mockPermissionRequest,
        modifiedContext: mockContext,
        isAdjustmentAllowed: true,
        lifecycleHandlers: lifecycleHandlerMocks,
      });

      const delegationsArray = decodeDelegations(response.context);

      const { contracts } = getChainMetadata({
        chainId: Number(mockPermissionRequest.chainId),
      });

      const expectedDelegation = {
        delegate: requestingAccountAddress.toLowerCase(),
        delegator: grantingAccountAddress.toLowerCase(),
        authority: ROOT_AUTHORITY,
        caveats: [
          {
            enforcer: contracts.timestampEnforcer.toLowerCase(),
            args: '0x',
            terms: createTimestampTerms({
              afterThreshold: 0,
              beforeThreshold: expiryTimestamp,
            }),
          },
          {
            enforcer: contracts.nonceEnforcer.toLowerCase(),
            args: '0x',
            terms: createNonceTerms({
              nonce: bigIntToHex(0n),
            }),
          },
        ],
        salt: expect.any(BigInt),
        signature: mockSignature,
      };

      expect(delegationsArray).toStrictEqual([expectedDelegation]);
      expect(delegationsArray[0]?.salt).not.toBe(0n);
    });

    it('adds timestamp enforcer when expiry rule is present', async () => {
      lifecycleHandlerMocks.applyContext.mockImplementation(
        ({ originalRequest }) => ({
          ...mockResolvedPermissionRequest,
          rules: originalRequest.rules,
        }),
      );

      const response = await grantedPermissionResolutionService.resolve({
        origin: 'test-origin',
        chainId: 1,
        originalRequest: mockResolvedPermissionRequest,
        modifiedContext: mockContext,
        isAdjustmentAllowed: true,
        lifecycleHandlers: lifecycleHandlerMocks,
      });

      const delegationsArray = decodeDelegations(response.context);

      const { contracts } = getChainMetadata({
        chainId: Number(mockResolvedPermissionRequest.chainId),
      });

      const expectedDelegation = {
        delegate: requestingAccountAddress.toLowerCase(),
        delegator: grantingAccountAddress.toLowerCase(),
        authority: ROOT_AUTHORITY,
        caveats: [
          {
            enforcer: contracts.timestampEnforcer.toLowerCase(),
            args: '0x',
            terms: createTimestampTerms({
              afterThreshold: 0,
              beforeThreshold: expiryTimestamp,
            }),
          },
          {
            enforcer: contracts.nonceEnforcer.toLowerCase(),
            args: '0x',
            terms: createNonceTerms({
              nonce: bigIntToHex(0n),
            }),
          },
        ],
        salt: expect.any(BigInt),
        signature: mockSignature,
      };

      expect(delegationsArray).toStrictEqual([expectedDelegation]);
      expect(delegationsArray[0]?.salt).not.toBe(0n);
    });

    it('does not throw an error when expiry rule is not present', async () => {
      const mockPermissionRequestWithRandomRule = {
        ...mockPermissionRequest,
        rules: [
          {
            type: 'random-rule',
            isAdjustmentAllowed: true,
            data: {},
          },
        ],
      };

      lifecycleHandlerMocks.applyContext.mockImplementation(
        ({ originalRequest }) => ({
          ...mockResolvedPermissionRequest,
          rules: originalRequest.rules,
        }),
      );

      const response = await grantedPermissionResolutionService.resolve({
        origin: 'test-origin',
        chainId: 1,
        originalRequest: mockPermissionRequestWithRandomRule,
        modifiedContext: mockContext,
        isAdjustmentAllowed: true,
        lifecycleHandlers: lifecycleHandlerMocks,
      });

      expect(response).toBeDefined();
    });

    it('does not throw an error when rules are not defined', async () => {
      const mockPermissionRequestWithoutRules = {
        ...mockPermissionRequest,
        rules: undefined,
      } as unknown as PermissionRequest;

      lifecycleHandlerMocks.applyContext.mockImplementation(
        ({ originalRequest }) => ({
          ...mockResolvedPermissionRequest,
          rules: originalRequest.rules,
        }),
      );

      const response = await grantedPermissionResolutionService.resolve({
        origin: 'test-origin',
        chainId: 1,
        originalRequest: mockPermissionRequestWithoutRules,
        modifiedContext: mockContext,
        isAdjustmentAllowed: true,
        lifecycleHandlers: lifecycleHandlerMocks,
      });

      expect(response).toBeDefined();
    });

    it('adds redeemer caveat when redeemer rule is present', async () => {
      const requestWithRedeemerRule = {
        ...mockPermissionRequest,
        rules: [
          mockPermissionRequest.rules[0],
          {
            type: 'redeemer',
            data: { addresses: SENTINEL_REDEEMER_ADDRESSES },
          },
        ],
      };

      lifecycleHandlerMocks.applyContext.mockImplementation(
        ({ originalRequest }) => ({
          ...mockResolvedPermissionRequest,
          rules: originalRequest.rules,
        }),
      );

      const response = await grantedPermissionResolutionService.resolve({
        origin: 'test-origin',
        chainId: 1,
        originalRequest: requestWithRedeemerRule,
        modifiedContext: mockContext,
        isAdjustmentAllowed: true,
        lifecycleHandlers: lifecycleHandlerMocks,
      });

      const delegationsArray = decodeDelegations(response.context);
      const { contracts } = getChainMetadata({
        chainId: Number(mockPermissionRequest.chainId),
      });

      expect(delegationsArray[0]?.caveats).toContainEqual({
        enforcer: contracts.redeemerEnforcer.toLowerCase(),
        args: '0x',
        terms: createRedeemerTerms({
          redeemers: SENTINEL_REDEEMER_ADDRESSES.map(
            (address) => address.toLowerCase() as Hex,
          ),
        }),
      });
    });

    it('applies context to resolve the permission request', async () => {
      await grantedPermissionResolutionService.resolve({
        origin: 'test-origin',
        chainId: 1,
        originalRequest: mockPermissionRequest,
        modifiedContext: mockContext,
        isAdjustmentAllowed: true,
        lifecycleHandlers: lifecycleHandlerMocks,
      });

      expect(lifecycleHandlerMocks.applyContext).toHaveBeenCalledWith({
        context: mockContext,
        originalRequest: mockPermissionRequest,
      });
    });

    it('populates the permission with required values', async () => {
      await grantedPermissionResolutionService.resolve({
        origin: 'test-origin',
        chainId: 1,
        originalRequest: mockPermissionRequest,
        modifiedContext: mockContext,
        isAdjustmentAllowed: true,
        lifecycleHandlers: lifecycleHandlerMocks,
      });

      expect(lifecycleHandlerMocks.populatePermission).toHaveBeenCalledWith({
        permission: mockResolvedPermissionRequest.permission,
      });
    });

    it('appends caveats to the permission', async () => {
      await grantedPermissionResolutionService.resolve({
        origin: 'test-origin',
        chainId: 1,
        originalRequest: mockPermissionRequest,
        modifiedContext: mockContext,
        isAdjustmentAllowed: true,
        lifecycleHandlers: lifecycleHandlerMocks,
      });

      expect(
        lifecycleHandlerMocks.createPermissionCaveats,
      ).toHaveBeenCalledWith({
        permission: mockPopulatedPermission,
        contracts: expect.any(Object),
      });
    });

    it('signs the delegation for the permission', async () => {
      await grantedPermissionResolutionService.resolve({
        origin: 'test-origin',
        chainId: 1,
        originalRequest: mockPermissionRequest,
        modifiedContext: mockContext,
        isAdjustmentAllowed: true,
        lifecycleHandlers: lifecycleHandlerMocks,
      });

      expect(mockAccountController.signDelegation).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: 1,
          delegation: expect.any(Object),
        }),
      );
    });

    it('tracks delegation signing success', async () => {
      await grantedPermissionResolutionService.resolve({
        origin: 'test-origin',
        chainId: 1,
        originalRequest: mockPermissionRequest,
        modifiedContext: mockContext,
        isAdjustmentAllowed: true,
        lifecycleHandlers: lifecycleHandlerMocks,
      });

      expect(
        mockSnapsMetricsService.trackDelegationSigning,
      ).toHaveBeenCalledWith({
        origin: 'test-origin',
        permissionType: 'test-permission',
        success: true,
      });
    });

    it('tracks delegation signing failure', async () => {
      mockAccountController.signDelegation.mockRejectedValueOnce(
        new Error('Signing failed'),
      );

      await expect(
        grantedPermissionResolutionService.resolve({
          origin: 'test-origin',
          chainId: 1,
          originalRequest: mockPermissionRequest,
          modifiedContext: mockContext,
          isAdjustmentAllowed: true,
          lifecycleHandlers: lifecycleHandlerMocks,
        }),
      ).rejects.toThrow('Signing failed');

      expect(
        mockSnapsMetricsService.trackDelegationSigning,
      ).toHaveBeenCalledWith({
        origin: 'test-origin',
        permissionType: 'test-permission',
        success: false,
        errorMessage: 'Signing failed',
      });
    });

    it('tracks successful permission grant', async () => {
      await grantedPermissionResolutionService.resolve({
        origin: 'test-origin',
        chainId: 1,
        originalRequest: mockPermissionRequest,
        modifiedContext: mockContext,
        isAdjustmentAllowed: true,
        lifecycleHandlers: lifecycleHandlerMocks,
      });

      expect(
        mockSnapsMetricsService.trackPermissionGranted,
      ).toHaveBeenCalledWith({
        origin: 'test-origin',
        permissionType: 'test-permission',
        chainId: '0x1',
        permissionData: mockPopulatedPermission.data,
        justification: mockContext.justification,
        isAdjustmentAllowed: true,
      });
    });

    it('throws when from address is undefined', async () => {
      lifecycleHandlerMocks.applyContext.mockResolvedValueOnce({
        ...mockResolvedPermissionRequest,
        from: undefined,
      });

      await expect(
        grantedPermissionResolutionService.resolve({
          origin: 'test-origin',
          chainId: 1,
          originalRequest: mockPermissionRequest,
          modifiedContext: mockContext,
          isAdjustmentAllowed: true,
          lifecycleHandlers: lifecycleHandlerMocks,
        }),
      ).rejects.toThrow(new InvalidInputError('Address is undefined'));
    });

    it('throws when delegate address is undefined', async () => {
      lifecycleHandlerMocks.applyContext.mockResolvedValueOnce({
        ...mockResolvedPermissionRequest,
        to: undefined,
      });

      await expect(
        grantedPermissionResolutionService.resolve({
          origin: 'test-origin',
          chainId: 1,
          originalRequest: mockPermissionRequest,
          modifiedContext: mockContext,
          isAdjustmentAllowed: true,
          lifecycleHandlers: lifecycleHandlerMocks,
        }),
      ).rejects.toThrow(new InvalidInputError('Delegate address is undefined'));
    });
  });
});
