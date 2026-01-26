import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import {
  decodeDelegations,
  ROOT_AUTHORITY,
  createTimestampTerms,
  createNonceTerms,
} from '@metamask/delegation-core';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { bigIntToHex, bytesToHex } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type { AccountController } from '../../src/core/accountController';
import { getChainMetadata } from '../../src/core/chainMetadata';
import type { ConfirmationDialog } from '../../src/core/confirmation';
import type { ConfirmationDialogFactory } from '../../src/core/confirmationFactory';
import type { DialogInterfaceFactory } from '../../src/core/dialogInterfaceFactory';
import type { PermissionIntroductionService } from '../../src/core/permissionIntroduction';
import { PermissionRequestLifecycleOrchestrator } from '../../src/core/permissionRequestLifecycleOrchestrator';
import type { BaseContext } from '../../src/core/types';
import type { SnapsMetricsService } from '../../src/services/snapsMetricsService';
import type { NonceCaveatService } from 'src/services/nonceCaveatService';

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
  let lifecycleHandlerMocks: TestLifecycleHandlersMocks;

  beforeEach(() => {
    jest.clearAllMocks();

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

    mockDialogInterfaceFactory.createDialogInterface.mockReturnValue({});

    permissionRequestLifecycleOrchestrator =
      new PermissionRequestLifecycleOrchestrator({
        accountController: mockAccountController,
        confirmationDialogFactory: mockConfirmationDialogFactory,
        nonceCaveatService: mockNonceCaveatService,
        snapsMetricsService: mockSnapsMetricsService,
        permissionIntroductionService: mockPermissionIntroductionService,
        dialogInterfaceFactory: mockDialogInterfaceFactory,
      });
  });

  describe('constructor', () => {
    it('should create an instance with valid supported chains', () => {
      const instance = new PermissionRequestLifecycleOrchestrator({
        accountController: mockAccountController,
        confirmationDialogFactory: mockConfirmationDialogFactory,
        nonceCaveatService: mockNonceCaveatService,
        snapsMetricsService: mockSnapsMetricsService,
        permissionIntroductionService: mockPermissionIntroductionService,
        dialogInterfaceFactory: mockDialogInterfaceFactory,
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

      it('creates a skeleton confirmation before the context is resolved', async () => {
        // this never resolves, because we are testing the behavior _before_ the context is returned.
        const contextPromise = new Promise<BaseContext>((_resolve) => {
          console.log('Arrow function cannot be empty');
        });

        lifecycleHandlerMocks.buildContext.mockReturnValue(contextPromise);

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        permissionRequestLifecycleOrchestrator.orchestrate(
          'test-origin',
          mockPermissionRequest,
          lifecycleHandlerMocks,
        );

        // allow the call to getAccountAddresses to complete
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockConfirmationDialog.updateContent).not.toHaveBeenCalled();

        expect(
          lifecycleHandlerMocks.createSkeletonConfirmationContent,
        ).toHaveBeenCalledTimes(1);

        expect(
          lifecycleHandlerMocks.createConfirmationContent,
        ).not.toHaveBeenCalled();
      });

      it('creates the confirmation dialog with a disabled grant button', async () => {
        // this never resolves, because we are testing the behavior _before_ the context is returned.
        const contextPromise = new Promise<BaseContext>((_resolve) => {
          console.log('Arrow function cannot be empty');
        });

        lifecycleHandlerMocks.buildContext.mockReturnValue(contextPromise);

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        permissionRequestLifecycleOrchestrator.orchestrate(
          'test-origin',
          mockPermissionRequest,
          lifecycleHandlerMocks,
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockConfirmationDialog.updateContent).not.toHaveBeenCalled();
        expect(
          mockConfirmationDialogFactory.createConfirmation,
        ).toHaveBeenCalledWith({
          dialogInterface: expect.any(Object),
          ui: mockSkeletonUiContent,
          onBeforeGrant: expect.any(Function),
        });
      });

      it('enables the grant button when updating the confirmation with the resolved context', async () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        permissionRequestLifecycleOrchestrator.orchestrate(
          'test-origin',
          mockPermissionRequest,
          lifecycleHandlerMocks,
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockConfirmationDialog.updateContent).toHaveBeenCalledWith({
          ui: mockUiContent,
          isGrantDisabled: false,
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
          'Permission request denied',
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
                timestampAfterThreshold: 0,
                timestampBeforeThreshold: expiryTimestamp,
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
                timestampAfterThreshold: 0,
                timestampBeforeThreshold: expiryTimestamp,
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

      it('checks account upgrade status and triggers upgrade when needed', async () => {
        mockAccountController.getAccountUpgradeStatus.mockResolvedValueOnce({
          isUpgraded: false,
        });

        const result = await permissionRequestLifecycleOrchestrator.orchestrate(
          'test-origin',
          mockPermissionRequest,
          lifecycleHandlerMocks,
        );

        expect(
          mockAccountController.getAccountUpgradeStatus,
        ).toHaveBeenCalledWith({
          account: grantingAccountAddress,
          chainId: '0x1',
        });
        expect(mockAccountController.upgradeAccount).toHaveBeenCalledWith({
          account: grantingAccountAddress,
          chainId: '0x1',
        });
        expect(result.approved).toBe(true);
      });

      it('does not trigger upgrade when account is already upgraded', async () => {
        mockAccountController.getAccountUpgradeStatus.mockResolvedValueOnce({
          isUpgraded: true,
        });

        const result = await permissionRequestLifecycleOrchestrator.orchestrate(
          'test-origin',
          mockPermissionRequest,
          lifecycleHandlerMocks,
        );

        expect(
          mockAccountController.getAccountUpgradeStatus,
        ).toHaveBeenCalledWith({
          account: grantingAccountAddress,
          chainId: '0x1',
        });
        expect(mockAccountController.upgradeAccount).not.toHaveBeenCalled();
        expect(result.approved).toBe(true);
      });

      it('tracks smart account upgrade success when upgrade is successful', async () => {
        mockAccountController.getAccountUpgradeStatus.mockResolvedValueOnce({
          isUpgraded: false,
        });
        mockAccountController.upgradeAccount.mockResolvedValueOnce({
          transactionHash: '0xabc123',
        });

        const result = await permissionRequestLifecycleOrchestrator.orchestrate(
          'test-origin',
          mockPermissionRequest,
          lifecycleHandlerMocks,
        );

        expect(mockAccountController.upgradeAccount).toHaveBeenCalledWith({
          account: grantingAccountAddress,
          chainId: '0x1',
        });
        expect(
          mockSnapsMetricsService.trackSmartAccountUpgraded,
        ).toHaveBeenCalledWith({
          origin: 'test-origin',
          accountAddress: grantingAccountAddress,
          chainId: '0x1',
          success: true,
        });
        expect(result.approved).toBe(true);
      });

      it('tracks smart account upgrade failure when upgrade fails', async () => {
        mockAccountController.getAccountUpgradeStatus.mockResolvedValueOnce({
          isUpgraded: false,
        });
        mockAccountController.upgradeAccount.mockRejectedValueOnce(
          new Error('Upgrade failed'),
        );

        // The permission request should still succeed despite upgrade failure
        const result = await permissionRequestLifecycleOrchestrator.orchestrate(
          'test-origin',
          mockPermissionRequest,
          lifecycleHandlerMocks,
        );

        expect(mockAccountController.upgradeAccount).toHaveBeenCalledWith({
          account: grantingAccountAddress,
          chainId: '0x1',
        });
        expect(
          mockSnapsMetricsService.trackSmartAccountUpgraded,
        ).toHaveBeenCalledWith({
          origin: 'test-origin',
          accountAddress: grantingAccountAddress,
          chainId: '0x1',
          success: false,
        });
        expect(result.approved).toBe(true);
      });

      it('does not track smart account upgrade when account is already upgraded', async () => {
        mockAccountController.getAccountUpgradeStatus.mockResolvedValueOnce({
          isUpgraded: true,
        });

        await permissionRequestLifecycleOrchestrator.orchestrate(
          'test-origin',
          mockPermissionRequest,
          lifecycleHandlerMocks,
        );

        expect(mockAccountController.upgradeAccount).not.toHaveBeenCalled();
        expect(
          mockSnapsMetricsService.trackSmartAccountUpgraded,
        ).not.toHaveBeenCalled();
      });

      it('correctly sets up the onConfirmationCreated hook to update the context', async () => {
        const initialContext = {
          foo: 'original',
          expiry: '2024-12-31',
          isAdjustmentAllowed: true,
          accountAddressCaip10: fixedCaip10Address,
          tokenAddressCaip19: 'eip155:1:0x1234',
          tokenMetadata: {
            decimals: 18,
            symbol: 'TEST',
            iconDataBase64: null,
          },
        };
        const modifiedContext = {
          foo: 'updated',
          expiry: '2025-01-01',
          isAdjustmentAllowed: true,
          accountAddressCaip10: fixedCaip10Address,
          tokenAddressCaip19: 'eip155:1:0x1234',
          tokenMetadata: {
            decimals: 18,
            symbol: 'TEST',
            iconDataBase64: null,
          },
        };

        lifecycleHandlerMocks.buildContext.mockResolvedValue(initialContext);

        let capturedParams: any;

        lifecycleHandlerMocks.onConfirmationCreated?.mockImplementation(
          (params) => {
            capturedParams = params;
          },
        );

        let resolveUserDecision: (decision: boolean) => void = (_) => {
          throw new Error('resolveUserDecision not set');
        };
        mockConfirmationDialog.displayConfirmationDialogAndAwaitUserDecision.mockImplementation(
          async () => {
            const isConfirmationGranted = await new Promise<boolean>(
              (resolve) => {
                resolveUserDecision = resolve;
              },
            );
            return { isConfirmationGranted };
          },
        );

        const orchestrationPromise =
          permissionRequestLifecycleOrchestrator.orchestrate(
            'test-origin',
            mockPermissionRequest,
            lifecycleHandlerMocks,
          );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(lifecycleHandlerMocks.onConfirmationCreated).toHaveBeenCalled();
        expect(capturedParams).toBeDefined();
        expect(capturedParams.interfaceId).toBe(mockInterfaceId);
        expect(capturedParams.initialContext).toStrictEqual(initialContext);
        expect(typeof capturedParams.updateContext).toBe('function');

        await capturedParams.updateContext({ updatedContext: modifiedContext });

        expect(mockConfirmationDialog.updateContent).toHaveBeenCalled();

        resolveUserDecision(true);

        await orchestrationPromise;

        expect(lifecycleHandlerMocks.applyContext).toHaveBeenCalledWith({
          context: modifiedContext,
          originalRequest: mockPermissionRequest,
        });
      });

      it('prevents race condition when grant is clicked before debounced validation completes', async () => {
        // This test simulates the race condition scenario:
        // 1. User types invalid input → validation debounced (500ms delay)
        // 2. User clicks Grant before debounce completes (button still enabled)
        // 3. beforeGrantCallback validates fresh state → detects errors → prevents grant

        let validationErrorsState = {};

        // Mock deriveMetadata to return our controlled validation state
        lifecycleHandlerMocks.deriveMetadata.mockImplementation(async () => ({
          test: 'metadata',
          validationErrors: validationErrorsState,
        }));

        // Start orchestration
        const orchestrationPromise =
          permissionRequestLifecycleOrchestrator.orchestrate(
            'test-origin',
            mockPermissionRequest,
            lifecycleHandlerMocks,
          );

        // Wait for initial setup
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Extract the onBeforeGrant callback that was passed to createConfirmation
        expect(
          mockConfirmationDialogFactory.createConfirmation,
        ).toHaveBeenCalledTimes(1);
        const createConfirmationCall =
          mockConfirmationDialogFactory.createConfirmation.mock.calls[0]?.[0];

        if (!createConfirmationCall?.onBeforeGrant) {
          throw new Error('Expected onBeforeGrant to be defined');
        }

        const beforeGrantCallback = createConfirmationCall.onBeforeGrant;

        // Valid state: grant should be allowed
        validationErrorsState = {};
        let result = await beforeGrantCallback();
        expect(result).toBe(true);

        // Invalid state (simulating user typed invalid input before debounce completed)
        validationErrorsState = { amount: 'Amount must be positive' };
        result = await beforeGrantCallback();
        expect(result).toBe(false); // Should prevent grant

        // Back to valid state
        validationErrorsState = {};
        result = await beforeGrantCallback();
        expect(result).toBe(true); // Should allow grant

        await orchestrationPromise;
      });
    });

    describe('nominal path', () => {
      /*
       * The PermissionRequestLifecycleOrchestrator orchestrates a permission request by performing the following steps:
       *
       * 1. Validates and builds the initial permission request.
       * 2. Creates the confirmation dialog with skeleton UI content.
       * 3. Builds context, derives metadata and updates the UI content for confirmation.
       * 4. Applies context to resolve the permission request.
       * 5. Populates the permission with required values.
       * 6. Appends caveats to the permission.
       * 7. Checks and upgrades account if necessary.
       * 8. Signs the delegation for the permission.
       */

      beforeEach(async () => {
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
       * 2. Creates the confirmation dialog with skeleton UI content
       */
      it('creates the confirmation dialog with skeleton UI content', async () => {
        expect(
          lifecycleHandlerMocks.createSkeletonConfirmationContent,
        ).toHaveBeenCalled();

        expect(
          mockConfirmationDialogFactory.createConfirmation,
        ).toHaveBeenCalledWith({
          dialogInterface: expect.any(Object),
          ui: mockSkeletonUiContent,
          onBeforeGrant: expect.any(Function),
        });

        expect(mockConfirmationDialog.initialize).toHaveBeenCalled();

        expect(
          mockConfirmationDialog.displayConfirmationDialogAndAwaitUserDecision,
        ).toHaveBeenCalled();
      });

      /*
       * 3. Builds context, derives metadata and updates the UI content for confirmation.
       */
      it('builds context, derives metadata and updates the UI content for confirmation', async () => {
        expect(lifecycleHandlerMocks.buildContext).toHaveBeenCalledWith(
          mockPermissionRequest,
        );

        expect(lifecycleHandlerMocks.deriveMetadata).toHaveBeenCalledWith({
          context: mockContext,
        });

        expect(
          lifecycleHandlerMocks.createConfirmationContent,
        ).toHaveBeenCalledWith({
          context: mockContext,
          metadata: mockMetadata,
          origin: 'test-origin',
          chainId: 1,
        });

        expect(mockConfirmationDialog.updateContent).toHaveBeenCalledWith({
          ui: mockUiContent,
          isGrantDisabled: false,
        });
      });

      /*
       * 4. Applies context to resolve the permission request.
       */
      it('applies context to resolve the permission request', async () => {
        expect(lifecycleHandlerMocks.applyContext).toHaveBeenCalledWith({
          context: mockContext,
          originalRequest: mockPermissionRequest,
        });
      });

      /*
       * 5. Populates the permission with required values.
       */
      it('populates the permission with required values', async () => {
        expect(lifecycleHandlerMocks.populatePermission).toHaveBeenCalledWith({
          permission: mockResolvedPermissionRequest.permission,
        });
      });

      /*
       * 6. Appends caveats to the permission.
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
       * 7. Checks and upgrades account if necessary.
       */
      it('checks account upgrade status before processing permission', async () => {
        expect(
          mockAccountController.getAccountUpgradeStatus,
        ).toHaveBeenCalledWith({
          account: grantingAccountAddress,
          chainId: '0x1',
        });
      });

      /*
       * 8. Signs the delegation for the permission.
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
