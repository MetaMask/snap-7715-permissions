import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import {
  decodeDelegations,
  ROOT_AUTHORITY,
  createTimestampTerms,
  createNonceTerms,
  createRedeemerTerms,
} from '@metamask/delegation-core';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { bigIntToHex, bytesToHex } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type {
  FetchAddressScanResult,
  ScanDappUrlResult,
  TrustSignalsClient,
} from '../../src/clients/trustSignalsClient';
import { AddressScanResultType } from '../../src/clients/trustSignalsClient';
import type { AccountController } from '../../src/core/accountController';
import { getChainMetadata } from '../../src/core/chainMetadata';
import type { ConfirmationDialog } from '../../src/core/confirmation';
import { ConfirmationSession } from '../../src/core/confirmation/ConfirmationSession';
import type { ConfirmationDialogFactory } from '../../src/core/confirmationFactory';
import { ExistingPermissionsCoordinator } from '../../src/core/coordinators/ExistingPermissionsCoordinator';
import { TrustSignalsCoordinator } from '../../src/core/coordinators/TrustSignalsCoordinator';
import type { DialogInterfaceFactory } from '../../src/core/dialogInterfaceFactory';
import { ExistingPermissionsService } from '../../src/core/existingpermissions/existingPermissionsService';
import { GrantedPermissionResolutionService } from '../../src/core/grant/GrantedPermissionResolutionService';
import type { PermissionIntroductionService } from '../../src/core/permissionIntroduction';
import { PermissionRequestLifecycleOrchestrator } from '../../src/core/permissionRequestLifecycleOrchestrator';
import { SENTINEL_REDEEMER_ADDRESSES } from '../../src/core/sentinelRedeemer';
import type { ProfileSyncManager } from '../../src/profileSync/profileSync';
import type { NonceCaveatService } from '../../src/services/nonceCaveatService';
import type { SnapsMetricsService } from '../../src/services/snapsMetricsService';
import type { TokenMetadataService } from '../../src/services/tokenMetadataService';

const randomAddress = (): Hex => {
  const randomBytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256);
  }
  return bytesToHex(randomBytes);
};

const mockSignature = '0x1234';
const mockInterfaceId = 'test-interface-id';
const grantingAccountAddress = randomAddress();
const fixedCaip10Address = `eip155:1:${grantingAccountAddress}`;

const mockContext = {
  expiry: '2024-12-31',
  isAdjustmentAllowed: true,
  from: grantingAccountAddress,
  accountAddressCaip10: fixedCaip10Address,
};

const mockMetadata = {
  test: 'metadata',
};

const mockUiContent = {
  type: 'ui-content',
} as SnapElement;

const mockSkeletonUiContent = {
  type: 'skeleton',
} as SnapElement;

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
  getAccountAddresses: jest.fn(),
  getAccountUpgradeStatus: jest.fn(async () => ({ isUpgraded: false })),
  upgradeAccount: jest.fn().mockResolvedValue(undefined),
} as unknown as jest.Mocked<AccountController>;

const mockDialogInterfaceFactory = {
  createDialogInterface: jest.fn().mockReturnValue({}),
} as unknown as jest.Mocked<DialogInterfaceFactory>;

const mockConfirmationDialog = {
  initialize: jest.fn(),
  displayConfirmationDialogAndAwaitUserDecision: jest.fn(),
  updateContent: jest.fn(),
  closeWithError: jest.fn(),
} as unknown as jest.Mocked<ConfirmationDialog>;

const mockConfirmationDialogFactory = {
  createConfirmation: jest.fn(),
} as unknown as jest.Mocked<ConfirmationDialogFactory>;

const mockNonceCaveatService = {
  getNonce: jest.fn(),
} as unknown as jest.Mocked<NonceCaveatService>;

const mockSnapsMetricsService = {
  trackPermissionRequestStarted: jest.fn().mockResolvedValue(undefined),
  trackPermissionDialogShown: jest.fn().mockResolvedValue(undefined),
  trackPermissionRejected: jest.fn().mockResolvedValue(undefined),
  trackPermissionGranted: jest.fn().mockResolvedValue(undefined),
  trackSmartAccountUpgraded: jest.fn().mockResolvedValue(undefined),
  trackDelegationSigning: jest.fn().mockResolvedValue(undefined),
  trackProfileSync: jest.fn().mockResolvedValue(undefined),
} as unknown as jest.Mocked<SnapsMetricsService>;

const mockPermissionIntroductionService = {
  shouldShowIntroduction: jest.fn().mockResolvedValue(false),
  markIntroductionAsSeen: jest.fn().mockResolvedValue(undefined),
  buildIntroductionContent: jest.fn().mockReturnValue({ type: 'intro-ui' }),
  showIntroduction: jest.fn().mockResolvedValue({ wasCancelled: false }),
} as unknown as jest.Mocked<PermissionIntroductionService>;

const existingPermissionsStatusHelper = new ExistingPermissionsService({
  profileSyncManager: {
    getAllGrantedPermissions: jest.fn(),
  } as unknown as ProfileSyncManager,
  tokenMetadataService: {} as unknown as TokenMetadataService,
});

const mockExistingPermissionsService = {
  getExistingPermissions: jest.fn(),
  getExistingPermissionsStatusFromList: jest.fn(),
  showExistingPermissions: jest.fn(),
} as unknown as jest.Mocked<ExistingPermissionsService>;

// Set default mock implementations for existing permissions service
mockExistingPermissionsService.getExistingPermissions.mockResolvedValue([]);
mockExistingPermissionsService.getExistingPermissionsStatusFromList.mockImplementation(
  (list, perm) =>
    existingPermissionsStatusHelper.getExistingPermissionsStatusFromList(
      list,
      perm,
    ),
);
mockExistingPermissionsService.showExistingPermissions.mockResolvedValue(
  undefined,
);

const mockScanAddressResult: FetchAddressScanResult = {
  resultType: AddressScanResultType.Benign,
  label: '',
};

const mockTrustSignalsClient = {
  scanDappUrl: jest.fn().mockResolvedValue({ isComplete: false }),
  fetchAddressScan: jest.fn().mockResolvedValue(mockScanAddressResult),
} as unknown as jest.Mocked<TrustSignalsClient>;

type TestLifecycleHandlersMocks = {
  parseAndValidatePermission: jest.Mock;
  buildContext: jest.Mock;
  deriveMetadata: jest.Mock;
  createSkeletonConfirmationContent: jest.Mock;
  createConfirmationContent: jest.Mock;
  applyContext: jest.Mock;
  populatePermission: jest.Mock;
  createPermissionCaveats: jest.Mock;
  onConfirmationCreated?: jest.Mock;
  onConfirmationResolved?: jest.Mock;
};

describe('PermissionRequestLifecycleOrchestrator', () => {
  let permissionRequestLifecycleOrchestrator: PermissionRequestLifecycleOrchestrator;
  let confirmationSession: ConfirmationSession;
  let grantedPermissionResolutionService: GrantedPermissionResolutionService;
  let existingPermissionsCoordinator: ExistingPermissionsCoordinator;
  let trustSignalsCoordinator: TrustSignalsCoordinator;
  let lifecycleHandlerMocks: TestLifecycleHandlersMocks;

  beforeEach(() => {
    jest.clearAllMocks();

    grantedPermissionResolutionService = new GrantedPermissionResolutionService(
      {
        accountController: mockAccountController,
        nonceCaveatService: mockNonceCaveatService,
        snapsMetricsService: mockSnapsMetricsService,
      },
    );

    existingPermissionsCoordinator = new ExistingPermissionsCoordinator({
      existingPermissionsService: mockExistingPermissionsService,
    });

    trustSignalsCoordinator = new TrustSignalsCoordinator({
      trustSignalsClient: mockTrustSignalsClient,
    });

    // Reset existing permissions service mocks after clearing
    mockExistingPermissionsService.getExistingPermissions.mockResolvedValue([]);
    mockExistingPermissionsService.getExistingPermissionsStatusFromList.mockImplementation(
      (list, perm) =>
        existingPermissionsStatusHelper.getExistingPermissionsStatusFromList(
          list,
          perm,
        ),
    );
    mockExistingPermissionsService.showExistingPermissions.mockResolvedValue(
      undefined,
    );

    lifecycleHandlerMocks = {
      parseAndValidatePermission: jest.fn().mockImplementation((req) => req),
      buildContext: jest.fn().mockResolvedValue(mockContext),
      deriveMetadata: jest.fn().mockResolvedValue(mockMetadata),
      createSkeletonConfirmationContent: jest
        .fn()
        .mockResolvedValue(mockSkeletonUiContent),
      createConfirmationContent: jest.fn().mockResolvedValue(mockUiContent),
      applyContext: jest.fn().mockResolvedValue(mockResolvedPermissionRequest),
      populatePermission: jest.fn().mockResolvedValue(mockPopulatedPermission),
      onConfirmationCreated: jest.fn(),
      onConfirmationResolved: jest.fn(),
      createPermissionCaveats: jest.fn(() => []),
    };

    mockAccountController.signDelegation.mockImplementation(
      async ({ delegation }) => ({
        ...delegation,
        signature: mockSignature,
      }),
    );

    mockAccountController.getAccountUpgradeStatus.mockImplementation(
      async () => ({ isUpgraded: false }),
    );

    mockConfirmationDialogFactory.createConfirmation.mockReturnValue(
      mockConfirmationDialog,
    );
    mockConfirmationDialog.initialize.mockResolvedValue(mockInterfaceId);
    mockConfirmationDialog.displayConfirmationDialogAndAwaitUserDecision.mockResolvedValue(
      {
        isConfirmationGranted: true,
      },
    );
    mockConfirmationDialog.updateContent.mockResolvedValue(undefined);

    mockNonceCaveatService.getNonce.mockResolvedValue(0n);

    mockTrustSignalsClient.scanDappUrl.mockResolvedValue({
      isComplete: false,
    });

    mockTrustSignalsClient.fetchAddressScan.mockResolvedValue(
      mockScanAddressResult,
    );

    mockDialogInterfaceFactory.createDialogInterface.mockReturnValue({});

    confirmationSession = new ConfirmationSession({
      dialogInterfaceFactory: mockDialogInterfaceFactory,
      confirmationDialogFactory: mockConfirmationDialogFactory,
      permissionIntroductionService: mockPermissionIntroductionService,
      existingPermissionsCoordinator,
      trustSignalsCoordinator,
      accountController: mockAccountController,
      snapsMetricsService: mockSnapsMetricsService,
    });

    permissionRequestLifecycleOrchestrator =
      new PermissionRequestLifecycleOrchestrator({
        snapsMetricsService: mockSnapsMetricsService,
        permissionIntroductionService: mockPermissionIntroductionService,
        confirmationSession,
        grantedPermissionResolutionService,
      });
  });

  describe('constructor', () => {
    it('should create an instance with valid supported chains', () => {
      const instance = new PermissionRequestLifecycleOrchestrator({
        snapsMetricsService: mockSnapsMetricsService,
        permissionIntroductionService: mockPermissionIntroductionService,
        confirmationSession,
        grantedPermissionResolutionService,
      });
      expect(instance).toBeInstanceOf(PermissionRequestLifecycleOrchestrator);
    });
  });

  describe('orchestrate', () => {
    describe('functional tests', () => {
      it('successfully orchestrates a permission request', async () => {
        const result = await permissionRequestLifecycleOrchestrator.orchestrate(
          'test-origin',
          mockPermissionRequest,
          lifecycleHandlerMocks,
        );

        const {
          contracts: { delegationManager },
        } = getChainMetadata({
          chainId: Number(mockPermissionRequest.chainId),
        });

        expect(result.approved).toBe(true);
        expect(result.approved && result.response).toStrictEqual({
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

      it('returns failure if user rejects the request', async () => {
        mockConfirmationDialog.displayConfirmationDialogAndAwaitUserDecision.mockResolvedValueOnce(
          {
            isConfirmationGranted: false,
          },
        );
        const result = await permissionRequestLifecycleOrchestrator.orchestrate(
          'test-origin',
          mockPermissionRequest,
          lifecycleHandlerMocks,
        );
        expect(result.approved).toBe(false);
        expect(!result.approved && result.reason).toBe(
          'Permission request denied at confirmation screen',
        );
      });

      it('returns a context encoding the expected delegation', async () => {
        const result = await permissionRequestLifecycleOrchestrator.orchestrate(
          'test-origin',
          mockPermissionRequest,
          lifecycleHandlerMocks,
        );
        expect(result.approved).toBe(true);
        if (!result.approved) {
          throw new Error('Expected the permission request to be approved');
        }

        const delegationsArray = decodeDelegations(result.response.context);

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

        const result = await permissionRequestLifecycleOrchestrator.orchestrate(
          'test-origin',
          mockResolvedPermissionRequest,
          lifecycleHandlerMocks,
        );

        expect(result.approved).toBe(true);
        if (!result.approved) {
          throw new Error('Expected the permission request to be approved');
        }

        const delegationsArray = decodeDelegations(result.response.context);

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

      it('does not reject permission request for unknown chain', async () => {
        const chainRequestWithUnknownChain = {
          ...mockPermissionRequest,
          chainId: '0x9999999' as Hex, // non-existent chain
        };

        const result = await permissionRequestLifecycleOrchestrator.orchestrate(
          'test-origin',
          chainRequestWithUnknownChain,
          lifecycleHandlerMocks,
        );

        expect(result).toBeDefined();
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

        const orchestrationPromise =
          permissionRequestLifecycleOrchestrator.orchestrate(
            'test-origin',
            mockPermissionRequestWithRandomRule,
            lifecycleHandlerMocks,
          );

        const result = await orchestrationPromise;
        expect(result).toBeDefined();
      });

      it('does not throw an error when rules are not defined', async () => {
        const mockPermissionRequestWithRandomRule = {
          ...mockPermissionRequest,
          rules: undefined,
        } as unknown as PermissionRequest;

        lifecycleHandlerMocks.applyContext.mockImplementation(
          ({ originalRequest }) => ({
            ...mockResolvedPermissionRequest,
            rules: originalRequest.rules,
          }),
        );

        const orchestrationPromise =
          permissionRequestLifecycleOrchestrator.orchestrate(
            'test-origin',
            mockPermissionRequestWithRandomRule,
            lifecycleHandlerMocks,
          );

        const result = await orchestrationPromise;

        expect(result).toBeDefined();
      });

      it('adds the sentinel redeemer rule for uniswap.org requests with no redeemer rule', async () => {
        const requestWithoutRedeemerRule = {
          ...mockPermissionRequest,
          rules: [mockPermissionRequest.rules[0]],
        };

        lifecycleHandlerMocks.applyContext.mockImplementation(
          ({ originalRequest }) => ({
            ...mockResolvedPermissionRequest,
            rules: originalRequest.rules,
          }),
        );

        const result = await permissionRequestLifecycleOrchestrator.orchestrate(
          'https://app.uniswap.org',
          requestWithoutRedeemerRule,
          lifecycleHandlerMocks,
        );

        expect(lifecycleHandlerMocks.buildContext).toHaveBeenCalledWith({
          ...requestWithoutRedeemerRule,
          rules: [
            requestWithoutRedeemerRule.rules[0],
            {
              type: 'redeemer',
              data: { addresses: SENTINEL_REDEEMER_ADDRESSES },
            },
          ],
        });

        expect(result.approved).toBe(true);
        if (!result.approved) {
          throw new Error('Expected the permission request to be approved');
        }

        const delegationsArray = decodeDelegations(result.response.context);
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

      it('preserves a uniswap.org redeemer rule that only contains sentinel addresses', async () => {
        const requestedRedeemerRule = {
          type: 'redeemer',
          data: { addresses: [SENTINEL_REDEEMER_ADDRESSES[0]] },
        };
        const requestWithSentinelRedeemerRule = {
          ...mockPermissionRequest,
          rules: [mockPermissionRequest.rules[0], requestedRedeemerRule],
        };

        lifecycleHandlerMocks.applyContext.mockImplementation(
          ({ originalRequest }) => ({
            ...mockResolvedPermissionRequest,
            rules: originalRequest.rules,
          }),
        );

        await permissionRequestLifecycleOrchestrator.orchestrate(
          'https://uniswap.org',
          requestWithSentinelRedeemerRule,
          lifecycleHandlerMocks,
        );

        expect(lifecycleHandlerMocks.buildContext).toHaveBeenCalledWith(
          requestWithSentinelRedeemerRule,
        );
      });

      it('rejects uniswap.org redeemer rules with non-sentinel addresses', async () => {
        const requestWithUnsupportedRedeemerRule = {
          ...mockPermissionRequest,
          rules: [
            mockPermissionRequest.rules[0],
            {
              type: 'redeemer',
              data: {
                addresses: [
                  SENTINEL_REDEEMER_ADDRESSES[0],
                  '0x1111111111111111111111111111111111111111',
                ],
              },
            },
          ],
        };

        await expect(
          permissionRequestLifecycleOrchestrator.orchestrate(
            'https://app.uniswap.org',
            requestWithUnsupportedRedeemerRule,
            lifecycleHandlerMocks,
          ),
        ).rejects.toThrow(
          'Redeemer rule includes addresses other than allowed values: 0x1111111111111111111111111111111111111111. Permissions granted on this domain may only be redeemed via MetaMask Sentinel.',
        );

        expect(lifecycleHandlerMocks.buildContext).not.toHaveBeenCalled();
      });
    });

    describe('nominal path', () => {
      /*
       * End-to-end orchestrator path after Stage 5: preflight and grant resolution
       * remain here; confirmation UI lifecycle is owned by ConfirmationSession.
       *
       * 1. Validates and builds the initial permission request.
       * 2. Applies context to resolve the permission request.
       * 3. Populates the permission with required values.
       * 4. Appends caveats to the permission.
       * 5. Signs the delegation for the permission.
       */

      beforeEach(async () => {
        // Delay scan resolution so the initial createConfirmationContent runs with null scan results
        mockTrustSignalsClient.scanDappUrl.mockImplementation(
          async () =>
            new Promise<ScanDappUrlResult>((resolve) =>
              setTimeout(() => resolve({ isComplete: false }), 50),
            ),
        );
        mockTrustSignalsClient.fetchAddressScan.mockImplementation(
          async () =>
            new Promise<FetchAddressScanResult>((resolve) =>
              setTimeout(() => resolve(mockScanAddressResult), 50),
            ),
        );

        await permissionRequestLifecycleOrchestrator.orchestrate(
          'test-origin',
          mockPermissionRequest,
          lifecycleHandlerMocks,
        );
      });

      /*
       * 1. Validates and builds the initial permission request.
       */
      it('validates and builds the initial permission request', async () => {
        expect(
          lifecycleHandlerMocks.parseAndValidatePermission,
        ).toHaveBeenCalledWith(mockPermissionRequest);
      });

      /*
       * 2. Applies context to resolve the permission request.
       */
      it('applies context to resolve the permission request', async () => {
        expect(lifecycleHandlerMocks.applyContext).toHaveBeenCalledWith({
          context: mockContext,
          originalRequest: mockPermissionRequest,
        });
      });

      /*
       * 3. Populates the permission with required values.
       */
      it('populates the permission with required values', async () => {
        expect(lifecycleHandlerMocks.populatePermission).toHaveBeenCalledWith({
          permission: mockResolvedPermissionRequest.permission,
        });
      });

      /*
       * 4. Appends caveats to the permission.
       */
      it('appends caveats to the permission', async () => {
        expect(
          lifecycleHandlerMocks.createPermissionCaveats,
        ).toHaveBeenCalledWith({
          permission: mockPopulatedPermission,
          contracts: expect.any(Object),
        });
      });

      /*
       * 5. Signs the delegation for the permission.
       */
      it('signs the delegation for the permission', async () => {
        expect(mockAccountController.signDelegation).toHaveBeenCalledWith(
          expect.objectContaining({
            chainId: 1,
            delegation: expect.any(Object),
          }),
        );
      });
    });
  });
});
