import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import {
  decodeDelegations,
  ROOT_AUTHORITY,
  createTimestampTerms,
} from '@metamask/delegation-core';
import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { bytesToHex } from '@metamask/utils';

import type { AccountController } from '../../src/accountController';
import { getChainMetadata } from '../../src/core/chainMetadata';
import type { ConfirmationDialog } from '../../src/core/confirmation';
import type { ConfirmationDialogFactory } from '../../src/core/confirmationFactory';
import { PermissionRequestLifecycleOrchestrator } from '../../src/core/permissionRequestLifecycleOrchestrator';
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
  type: 'panel',
} as GenericSnapElement;

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
  awaitUserDecision: jest.fn(),
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

type TestLifecycleHandlersMocks = {
  parseAndValidatePermission: jest.Mock;
  buildContext: jest.Mock;
  deriveMetadata: jest.Mock;
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
    mockConfirmationDialog.awaitUserDecision.mockResolvedValue({
      isConfirmationGranted: true,
    });
    mockConfirmationDialog.updateContent.mockResolvedValue(undefined);

    permissionRequestLifecycleOrchestrator =
      new PermissionRequestLifecycleOrchestrator({
        accountController: mockAccountController,
        confirmationDialogFactory: mockConfirmationDialogFactory,
        userEventDispatcher: mockUserEventDispatcher,
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

      it('returns failure if user rejects the request', async () => {
        mockConfirmationDialog.awaitUserDecision.mockResolvedValueOnce({
          isConfirmationGranted: false,
        });
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
        mockConfirmationDialog.awaitUserDecision.mockImplementation(
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

      it('throws error when adjustment is not allowed', async () => {
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

        expect(mockConfirmationDialog.updateContent).not.toHaveBeenCalled();

        mockConfirmationDialog.awaitUserDecision.mockResolvedValue({
          isConfirmationGranted: true,
        });

        await orchestrationPromise;
      });
    });

    describe('nominal path', () => {
      /*
       * The PermissionRequestLifecycleOrchestrator orchestrates a permission request by performing the following steps:
       *
       * 1. Validates and builds the initial permission context from the incoming permission request.
       * 2. Prepares the UI for user confirmation, including context metadata and content.
       * 3. Registers the onConfirmationCreated handler to allow dynamic updates to the context and UI.
       * 4. Presents a confirmation dialog to the user and waits for their decision.
       * 5. Resolves the permission request, possibly adjusting it based on the context.
       * 6. Populates the permission with any required default values.
       * 7. Gathers account address, metadata, and delegation manager information.
       * 8. Builds a caveat builder and appends any permission-specific caveats.
       * 9. Creates and signs a delegation for the permission using the account controller.
       */

      beforeEach(async () => {
        await permissionRequestLifecycleOrchestrator.orchestrate(
          'test-origin',
          mockPermissionRequest,
          lifecycleHandlerMocks,
        );
      });

      /*
       * 1. Validates and builds the initial permission context from the incoming permission request.
       */
      it('validates and builds the initial context with the permission request', async () => {
        expect(
          lifecycleHandlerMocks.parseAndValidatePermission,
        ).toHaveBeenCalledWith(mockPermissionRequest);
        expect(lifecycleHandlerMocks.buildContext).toHaveBeenCalledWith(
          mockPermissionRequest,
        );
      });

      /*
       * 2. Prepares the UI for user confirmation, including context metadata and content.
       */
      it('derives metadata and creates UI content for confirmation', async () => {
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
      });

      /*
       * 4. Presents a confirmation dialog to the user and waits for their decision.
       */
      it('creates and awaits user decision on the confirmation dialog', async () => {
        expect(
          mockConfirmationDialogFactory.createConfirmation,
        ).toHaveBeenCalledWith({
          ui: mockUiContent,
        });
        expect(mockConfirmationDialog.createInterface).toHaveBeenCalled();
        expect(mockConfirmationDialog.awaitUserDecision).toHaveBeenCalled();
      });

      /*
       * 5. Resolves the permission request, possibly adjusting it based on the context.
       */
      it('applies context to resolve the permission request', async () => {
        expect(lifecycleHandlerMocks.applyContext).toHaveBeenCalledWith({
          context: mockContext,
          originalRequest: mockPermissionRequest,
        });
      });

      /*
       * 6. Populates the permission with any required default values.
       */
      it('populates the permission with required values', async () => {
        expect(lifecycleHandlerMocks.populatePermission).toHaveBeenCalledWith({
          permission: mockResolvedPermissionRequest.permission,
        });
      });

      /*
       * 7. Gathers account address, metadata, and delegation manager information.
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
       * 8. Builds a caveat builder and appends any permission-specific caveats.
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
       * 9. Creates and signs a delegation for the permission using the account controller.
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
