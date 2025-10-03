import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import {
  decodeDelegations,
  ROOT_AUTHORITY,
  createTimestampTerms,
  createNonceTerms,
} from '@metamask/delegation-core';
import { InvalidParamsError } from '@metamask/snaps-sdk';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { bigIntToHex, bytesToHex } from '@metamask/utils';
import type { Hex } from '@metamask/utils';
import type { NonceCaveatService } from 'src/services/nonceCaveatService';

import type { AccountController } from '../../src/core/accountController';
import { getChainMetadata } from '../../src/core/chainMetadata';
import type { ConfirmationDialog } from '../../src/core/confirmation';
import type { ConfirmationDialogFactory } from '../../src/core/confirmationFactory';
import { PermissionRequestLifecycleOrchestrator } from '../../src/core/permissionRequestLifecycleOrchestrator';
import type { BaseContext } from '../../src/core/types';
import type { UserEventDispatcher } from '../../src/userEventDispatcher';

const randomAddress = () => {
  /* eslint-disable no-restricted-globals */
  const randomBytes = crypto.getRandomValues(new Uint8Array(20));
  return bytesToHex(randomBytes);
};

const mockSignature = '0x1234';
const mockInterfaceId = 'test-interface-id';
const grantingAccountAddress = randomAddress();

const mockContext = {
  expiry: '2024-12-31',
  isAdjustmentAllowed: true,
  address: grantingAccountAddress,
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
  signer: {
    type: 'account',
    data: {
      address: requestingAccountAddress,
    },
  },
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
      isAdjustmentAllowed: true,
    },
  ],
};

const mockResolvedPermissionRequest = {
  ...mockPermissionRequest,
  address: grantingAccountAddress,
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
} as unknown as jest.Mocked<AccountController>;

const mockConfirmationDialog = {
  createInterface: jest.fn(),
  displayConfirmationDialogAndAwaitUserDecision: jest.fn(),
  updateContent: jest.fn(),
  closeWithError: jest.fn(),
} as unknown as jest.Mocked<ConfirmationDialog>;

const mockConfirmationDialogFactory = {
  createConfirmation: jest.fn(),
} as unknown as jest.Mocked<ConfirmationDialogFactory>;

const mockUserEventDispatcher = {
  on: jest.fn(),
  off: jest.fn(),
  createUserInputEventHandler: jest.fn(),
  waitForPendingHandlers: jest.fn().mockResolvedValue(undefined),
} as unknown as jest.Mocked<UserEventDispatcher>;

const mockNonceCaveatService = {
  getNonce: jest.fn(),
} as unknown as jest.Mocked<NonceCaveatService>;

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

    mockConfirmationDialogFactory.createConfirmation.mockReturnValue(
      mockConfirmationDialog,
    );
    mockConfirmationDialog.createInterface.mockResolvedValue(mockInterfaceId);
    mockConfirmationDialog.displayConfirmationDialogAndAwaitUserDecision.mockResolvedValue(
      {
        isConfirmationGranted: true,
      },
    );
    mockConfirmationDialog.updateContent.mockResolvedValue(undefined);

    mockNonceCaveatService.getNonce.mockResolvedValue(0n);

    permissionRequestLifecycleOrchestrator =
      new PermissionRequestLifecycleOrchestrator({
        accountController: mockAccountController,
        confirmationDialogFactory: mockConfirmationDialogFactory,
        userEventDispatcher: mockUserEventDispatcher,
        nonceCaveatService: mockNonceCaveatService,
      });
  });

  describe('constructor', () => {
    it('should create an instance with valid supported chains', () => {
      const instance = new PermissionRequestLifecycleOrchestrator({
        accountController: mockAccountController,
        confirmationDialogFactory: mockConfirmationDialogFactory,
        userEventDispatcher: mockUserEventDispatcher,
        nonceCaveatService: mockNonceCaveatService,
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
          dependencyInfo: [],
          permission: mockPopulatedPermission,
          address: grantingAccountAddress,
          context: expect.stringMatching(/^0x[0-9a-fA-F]+$/u),
          isAdjustmentAllowed: true,
          signer: {
            data: {
              address: requestingAccountAddress,
            },
            type: 'account',
          },
          signerMeta: {
            delegationManager,
          },
        });
      });

      it('creates a skeleton confirmation before the context is resolved', async () => {
        // this never resolves, because we are testing the behaviour _before_ the context is returned.
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
        // this never resolves, because we are testing the behaviour _before_ the context is returned.
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
          ui: mockSkeletonUiContent,
          isGrantDisabled: true,
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

        await expect(
          permissionRequestLifecycleOrchestrator.orchestrate(
            'test-origin',
            chainRequestWithUnknownChain,
            lifecycleHandlerMocks,
          ),
        ).resolves.not.toThrow();
      });

      it('throws an error when expiry rule is not present', async () => {
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

        await expect(orchestrationPromise).rejects.toThrow(
          'Expiry rule not found. An expiry is required on all permissions.',
        );
      });

      it('throws an error when rules are not defined', async () => {
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

        await expect(orchestrationPromise).rejects.toThrow(
          'Expiry rule not found. An expiry is required on all permissions.',
        );
      });
      it('correctly sets up the onConfirmationCreated hook to update the context', async () => {
        const initialContext = {
          foo: 'original',
          expiry: '2024-12-31',
          isAdjustmentAllowed: true,
          accountAddressCaip10: grantingAccountAddress,
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
          accountAddressCaip10: grantingAccountAddress,
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

      it('throws an error when adjustment is not allowed', async () => {
        const initialContext = {
          foo: 'bar',
          expiry: '2024-12-31',
          isAdjustmentAllowed: false, // Adjustment not allowed
        };

        const mockPermissionRequestWithAdjustmentNotAllowed = {
          ...mockPermissionRequest,
          permission: {
            ...mockPermissionRequest.permission,
            isAdjustmentAllowed: false,
          },
        };

        lifecycleHandlerMocks.buildContext.mockResolvedValue(initialContext);

        let updateContextHandler: any;
        expect(lifecycleHandlerMocks.onConfirmationCreated).toBeDefined();
        lifecycleHandlerMocks.onConfirmationCreated?.mockImplementation(
          ({ updateContext }) => {
            updateContextHandler = updateContext;
          },
        );

        const orchestrationPromise =
          permissionRequestLifecycleOrchestrator.orchestrate(
            'test-origin',
            mockPermissionRequestWithAdjustmentNotAllowed,
            lifecycleHandlerMocks,
          );

        await new Promise((resolve) => setTimeout(resolve, 0));

        await expect(
          updateContextHandler({
            updatedContext: { ...initialContext, foo: 'updated' },
          }),
        ).rejects.toThrow('Adjustment is not allowed');

        // this is called once when the context is first resolved
        expect(mockConfirmationDialog.updateContent).toHaveBeenCalledTimes(1);

        mockConfirmationDialog.displayConfirmationDialogAndAwaitUserDecision.mockResolvedValue(
          {
            isConfirmationGranted: true,
          },
        );

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
       * 7. Signs the delegation for the permission.
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
          ui: mockSkeletonUiContent,
          isGrantDisabled: true,
        });

        expect(mockConfirmationDialog.createInterface).toHaveBeenCalled();

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
       * 7. Signs the delegation for the permission.
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
