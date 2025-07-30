import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import {
  decodeDelegations,
  ROOT_AUTHORITY,
  createTimestampTerms,
} from '@metamask/delegation-core';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { bytesToHex } from '@metamask/utils';
import type { NonceCaveatService } from 'src/services/nonceCaveatService';

import type { AccountController } from '../../src/accountController';
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

const mockContext = {
  expiry: '2024-12-31',
  isAdjustmentAllowed: true,
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
const mockPermissionRequest = {
  chainId: '0x1',
  expiry: Math.floor(Date.now() / 1000 + 3600),
  signer: {
    type: 'account',
    data: {
      address: requestingAccountAddress,
    },
  },
  permission: {
    type: 'test-permission',
    data: {},
  },
} as PermissionRequest;

const mockResolvedPermissionRequest = {
  ...mockPermissionRequest,
  permission: {
    ...mockPermissionRequest.permission,
    data: { resolved: true },
  },
};

const mockPopulatedPermission = {
  ...mockResolvedPermissionRequest.permission,
  data: { populated: true },
};

const grantingAccountAddress = randomAddress();

const mockAccountMetadata = {
  factory: randomAddress(),
  factoryData: '0xabc',
} as const;

const mockAccountController = {
  getAccountAddress: jest.fn(),
  getAccountMetadata: jest.fn(),
  signDelegation: jest.fn(),
} as unknown as jest.Mocked<AccountController>;

const mockConfirmationDialog = {
  createInterface: jest.fn(),
  displayConfirmationDialogAndAwaitUserDecision: jest.fn(),
  updateContent: jest.fn(),
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

    mockAccountController.getAccountAddress.mockResolvedValue(
      grantingAccountAddress,
    );
    mockAccountController.getAccountMetadata.mockResolvedValue(
      mockAccountMetadata,
    );

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

    mockNonceCaveatService.getNonce.mockResolvedValue(0);

    permissionRequestLifecycleOrchestrator =
      new PermissionRequestLifecycleOrchestrator({
        accountController: mockAccountController,
        confirmationDialogFactory: mockConfirmationDialogFactory,
        userEventDispatcher: mockUserEventDispatcher,
        nonceCaveatService: mockNonceCaveatService,
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
          accountMeta: [mockAccountMetadata],
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

        const {
          contracts: {
            enforcers: { TimestampEnforcer },
          },
        } = getChainMetadata({
          chainId: Number(mockPermissionRequest.chainId),
        });

        const expectedDelegation = {
          delegate: requestingAccountAddress.toLowerCase(),
          delegator: grantingAccountAddress.toLowerCase(),
          authority: ROOT_AUTHORITY,
          caveats: [
            {
              enforcer: TimestampEnforcer.toLowerCase(),
              args: '0x',
              terms: createTimestampTerms({
                timestampAfterThreshold: 0,
                timestampBeforeThreshold: mockPermissionRequest.expiry,
              }),
            },
          ],
          salt: expect.any(BigInt),
          signature: mockSignature,
        };

        expect(delegationsArray).toStrictEqual([expectedDelegation]);
        expect(delegationsArray[0]?.salt).not.toBe(0n);
      });

      it('correctly sets up the onConfirmationCreated hook to update the context', async () => {
        const initialContext = {
          foo: 'original',
          expiry: '2024-12-31',
          isAdjustmentAllowed: true,
        };
        const modifiedContext = {
          foo: 'updated',
          expiry: '2025-01-01',
          isAdjustmentAllowed: true,
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
          isAdjustmentAllowed: false,
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
       * 6. Retrieves account information.
       * 7. Appends caveats to the permission.
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
       * 6. Retrieves account information.
       */
      it('retrieves account information', async () => {
        expect(mockAccountController.getAccountAddress).toHaveBeenCalledWith({
          chainId: 1,
        });
        expect(mockAccountController.getAccountMetadata).toHaveBeenCalledWith({
          chainId: 1,
        });
      });

      /*
       * 7. Appends caveats to the permission.
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
