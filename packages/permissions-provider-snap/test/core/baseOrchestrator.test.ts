import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import {
  DELEGATION_ABI_TYPE_COMPONENTS,
  ROOT_AUTHORITY,
  type Caveat,
  type CaveatBuilder,
  type DeleGatorEnvironment,
} from '@metamask/delegation-toolkit';
import { UserInputEventType } from '@metamask/snaps-sdk';
import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { decodeAbiParameters } from 'viem';
import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts';

import type { AccountController } from '../../src/accountController';
import { PermissionRequestLifecycleOrchestrator } from '../../src/core/baseOrchestrator';
import type { ConfirmationDialog } from '../../src/core/confirmation';
import type { ConfirmationDialogFactory } from '../../src/core/confirmationFactory';
import type { StateChangeHandler, DeepRequired } from '../../src/core/types';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../../src/userEventDispatcher';

const randomAddress = () => privateKeyToAddress(generatePrivateKey());

const mockSignature = '0x1234';
const mockInterfaceId = 'test-interface-id';
const mockCaveats = [
  {
    enforcer: randomAddress(),
    args: '0x',
    terms: '0x1234',
  },
] as Caveat[];

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

const mockEnvironment = {
  DelegationManager: randomAddress(),
  caveatEnforcers: {
    TimestampEnforcer: randomAddress(),
  },
  implementations: {},
  EntryPoint: randomAddress(),
  SimpleFactory: randomAddress(),
} as DeleGatorEnvironment;

const mockCaveatBuilder = {
  addCaveat: jest.fn().mockReturnThis(),
  build: jest.fn(),
} as unknown as jest.Mocked<CaveatBuilder>;

const mockAccountController = {
  getAccountAddress: jest.fn(),
  getAccountMetadata: jest.fn(),
  getDelegationManager: jest.fn(),
  getEnvironment: jest.fn(),
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
} as unknown as jest.Mocked<UserEventDispatcher>;

type TestOrchestratorMocks = {
  getStateChangeHandlers: jest.Mock;
  buildPermissionContext: jest.Mock;
  createContextMetadata: jest.Mock;
  resolvePermissionRequest: jest.Mock;
  createUiContent: jest.Mock;
  populatePermission: jest.Mock;
  appendCaveats: jest.Mock;
};

// Test implementation of BaseOrchestrator
class TestOrchestrator extends PermissionRequestLifecycleOrchestrator {
  readonly #mocks: TestOrchestratorMocks;

  constructor(mocks: TestOrchestratorMocks) {
    super({
      accountController: mockAccountController,
      permissionRequest: mockPermissionRequest,
      confirmationDialogFactory: mockConfirmationDialogFactory,
      userEventDispatcher: mockUserEventDispatcher,
    });
    this.#mocks = mocks;
  }

  protected get stateChangeHandlers(): StateChangeHandler<any, any>[] {
    return this.#mocks.getStateChangeHandlers();
  }

  protected async buildPermissionContext(args: {
    permissionRequest: PermissionRequest;
  }): Promise<any> {
    return this.#mocks.buildPermissionContext(args);
  }

  protected async createContextMetadata(context: any): Promise<any> {
    return this.#mocks.createContextMetadata(context);
  }

  protected async resolvePermissionRequest(args: {
    context: any;
    originalRequest: PermissionRequest;
  }): Promise<PermissionRequest> {
    return this.#mocks.resolvePermissionRequest(args);
  }

  protected async createUiContent(args: {
    context: any;
    metadata: any;
    origin: string;
    chainId: number;
  }): Promise<GenericSnapElement> {
    return this.#mocks.createUiContent(args);
  }

  protected async populatePermission(args: {
    permission: DeepRequired<PermissionRequest['permission']>;
  }): Promise<any> {
    return this.#mocks.populatePermission(args);
  }

  protected async appendCaveats(
    permissionRequest: DeepRequired<PermissionRequest['permission']>,
    caveatBuilder: CaveatBuilder,
  ): Promise<CaveatBuilder> {
    return this.#mocks.appendCaveats(permissionRequest, caveatBuilder);
  }
}

describe('BaseOrchestrator', () => {
  let testOrchestrator: TestOrchestrator;
  let mocks: TestOrchestratorMocks;

  beforeEach(() => {
    jest.clearAllMocks();

    mocks = {
      getStateChangeHandlers: jest.fn().mockReturnValue([]),
      buildPermissionContext: jest.fn().mockResolvedValue(mockContext),
      createContextMetadata: jest.fn().mockResolvedValue(mockMetadata),
      resolvePermissionRequest: jest
        .fn()
        .mockResolvedValue(mockResolvedPermissionRequest),
      createUiContent: jest.fn().mockResolvedValue(mockUiContent),
      populatePermission: jest.fn().mockResolvedValue(mockPopulatedPermission),
      appendCaveats: jest.fn().mockResolvedValue(mockCaveatBuilder),
    };

    mockCaveatBuilder.build.mockReturnValue(mockCaveats);

    mockAccountController.getAccountAddress.mockResolvedValue(
      grantingAccountAddress,
    );
    mockAccountController.getAccountMetadata.mockResolvedValue(
      mockAccountMetadata,
    );
    mockAccountController.getDelegationManager.mockResolvedValue(
      mockEnvironment.DelegationManager,
    );
    mockAccountController.getEnvironment.mockResolvedValue(mockEnvironment);
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

    testOrchestrator = new TestOrchestrator(mocks);
  });

  describe('orchestrate', () => {
    describe('functional tests', () => {
      it('should successfully orchestrate a permission request', async () => {
        const result = await testOrchestrator.orchestrate({
          origin: 'test-origin',
        });

        expect(result.success).toBe(true);
        expect(result.response).toStrictEqual({
          ...mockPermissionRequest,
          ...mockAccountMetadata,
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
            delegationManager: mockEnvironment.DelegationManager,
          },
        });
      });

      it('returns failure if user rejects the request', async () => {
        mockConfirmationDialog.awaitUserDecision.mockResolvedValueOnce({
          isConfirmationGranted: false,
        });
        const result = await testOrchestrator.orchestrate({
          origin: 'test-origin',
        });
        expect(result.success).toBe(false);
        expect(result.reason).toBe('User rejected the permissions request');
      });

      it('should return a context encoding the expected delegation', async () => {
        const result = await testOrchestrator.orchestrate({
          origin: 'test-origin',
        });

        expect(result.response).toBeDefined();

        // delegationsArray is a 2 dimensional array with a single element [ [ delegation ] ]
        const delegationsArray = (decodeAbiParameters as any)(
          [
            {
              components: DELEGATION_ABI_TYPE_COMPONENTS,
              name: 'delegations',
              type: 'tuple[]',
            },
          ],
          result.response?.context,
        );

        expect(delegationsArray).toHaveLength(1);
        const delegations = delegationsArray[0];

        expect(delegations).toHaveLength(1);
        const delegation = delegations[0];

        const expectedDelegation = {
          delegate: requestingAccountAddress,
          delegator: grantingAccountAddress,
          authority: ROOT_AUTHORITY,
          caveats: mockCaveats,
          salt: 0n,
          signature: mockSignature,
        };

        expect(delegation).toStrictEqual(expectedDelegation);
      });

      it('should reflect changes from a stateChangeHandler', async () => {
        const initialContext = {
          foo: 'bar',
          expiry: '2024-12-31',
          isAdjustmentAllowed: true,
        };
        const modifiedContext = {
          foo: 'baz',
          expiry: '2025-01-01',
          isAdjustmentAllowed: false,
        };
        const initialMetadata = { meta: 'initial' };
        const modifiedMetadata = { meta: 'modified' };

        let handleEvent: UserEventHandler<
          UserInputEventType.InputChangeEvent
        > = () => {
          throw new Error('handleEvent should have been reassigned');
        };
        mockUserEventDispatcher.on.mockImplementation(({ handler }) => {
          handleEvent = handler;
          return mockUserEventDispatcher;
        });

        // this is a little janky, but we're waiting for the orchestrator to be ready for user input
        // and providing a mechanism to indicate the user's decision.
        let resolveUserDecision: (
          isConfirmationGranted: boolean,
        ) => void = () => {
          throw new Error('resolveUserDecision should have been reassigned');
        };

        const awaitingUserDecision = new Promise<void>(
          (resolveAwaitingUserDecision) => {
            mockConfirmationDialog.awaitUserDecision.mockImplementation(
              async () => {
                resolveAwaitingUserDecision();
                const isConfirmationGranted = await new Promise<boolean>(
                  (resolveIsConfirmationGranted) =>
                    (resolveUserDecision = resolveIsConfirmationGranted),
                );
                return { isConfirmationGranted };
              },
            );
          },
        );

        mocks.buildPermissionContext.mockResolvedValueOnce(initialContext);
        mocks.createContextMetadata.mockImplementation(async (context) => {
          return context === modifiedContext
            ? modifiedMetadata
            : initialMetadata;
        });

        mocks.createUiContent.mockImplementation(
          async ({ context, metadata }) => {
            return { context, metadata };
          },
        );

        mocks.resolvePermissionRequest.mockImplementation(
          async ({ context, originalRequest }) => {
            return { ...originalRequest, context };
          },
        );

        const stateChangeHandler = {
          eventType: UserInputEventType.InputChangeEvent,
          elementName: 'test-element',
          contextMapper: jest.fn(() => modifiedContext),
        };
        mocks.getStateChangeHandlers.mockReturnValue([stateChangeHandler]);

        const orchestratePromise = testOrchestrator.orchestrate({
          origin: 'test-origin',
        });

        await awaitingUserDecision;

        await handleEvent({
          event: {
            type: UserInputEventType.InputChangeEvent,
            name: 'test-element',
            value: 'test-value',
          },
          interfaceId: mockInterfaceId,
        });

        expect(stateChangeHandler.contextMapper).toHaveBeenCalledWith({
          context: initialContext,
          metadata: initialMetadata,
          event: {
            type: UserInputEventType.InputChangeEvent,
            name: 'test-element',
            value: 'test-value',
          },
        });

        // ensure that the UI has been updated with the modified context and metadata
        expect(mockConfirmationDialog.updateContent).toHaveBeenCalledWith({
          ui: { context: modifiedContext, metadata: modifiedMetadata },
        });

        if (resolveUserDecision === undefined) {
          throw new Error('resolveUserDecision is undefined');
        }

        // resolve the confirmation
        resolveUserDecision(true);
        // and wait for the result
        await orchestratePromise;

        // ensure that the changes made by the user have been reflected when resolving the permission request
        expect(mocks.resolvePermissionRequest).toHaveBeenCalledWith({
          context: modifiedContext,
          originalRequest: mockPermissionRequest,
        });

        expect(mocks.appendCaveats).toHaveBeenCalledWith(
          mockPopulatedPermission,
          expect.any(Object),
        );
      });
    });

    describe('nominal path', () => {
      /*
       * The BaseOrchestrator orchestrates a permission request by performing the following steps:
       *
       * 1. Builds the initial permission context from the incoming permission request.
       * 2. Prepares the UI for user confirmation, including context metadata and content.
       * 3. Binds state change handlers to allow dynamic updates to the context and UI based on user events. *
       * 4. Presents a confirmation dialog to the user and waits for their decision.
       * 5. Resolves the permission request, possibly adjusting it based on the context.
       * 6. Populates the permission with any required default values.
       * 7. Gathers account address, metadata, and delegation manager information.
       * 8. Builds a caveat builder with a timestamp caveat and appends any permission-specific caveats.
       * 9. Creates and signs a delegation for the permission using the account controller.
       */

      beforeEach(async () => {
        await testOrchestrator.orchestrate({ origin: 'test-origin' });
      });
      /*
       * 1. Builds the initial permission context from the incoming permission request.
       */
      it('calls buildPermissionContext with the permission request', async () => {
        expect(mocks.buildPermissionContext).toHaveBeenCalledWith({
          permissionRequest: mockPermissionRequest,
        });
      });

      /*
       * 2. Prepares the UI for user confirmation, including context metadata and content.
       */
      it('calls createUiContent and createContextMetadata with the context and metadata', async () => {
        expect(mocks.createContextMetadata).toHaveBeenCalledWith(mockContext);
        expect(mocks.createUiContent).toHaveBeenCalledWith({
          context: mockContext,
          metadata: mockMetadata,
          origin: 'test-origin',
          chainId: 1,
        });
      });

      /*
       * 4. Presents a confirmation dialog to the user and waits for their decision.
       */
      it('calls confirmationDialog.awaitUserDecision', async () => {
        expect(mockConfirmationDialog.awaitUserDecision).toHaveBeenCalled();
      });

      /*
       * 5. Resolves the permission request, possibly adjusting it based on the context.
       */
      it('calls resolvePermissionRequest with the context and original request', async () => {
        expect(mocks.resolvePermissionRequest).toHaveBeenCalledWith({
          context: mockContext,
          originalRequest: mockPermissionRequest,
        });
      });

      /*
       * 6. Populates the permission with any required default values.
       */
      it('calls populatePermission with the resolved permission', async () => {
        expect(mocks.populatePermission).toHaveBeenCalledWith({
          permission: mockResolvedPermissionRequest.permission,
        });
      });

      /*
       * 7. Gathers account address, metadata, and delegation manager information.
       */
      it('calls getAccountAddress, getAccountMetadata, and getDelegationManager', async () => {
        expect(mockAccountController.getAccountAddress).toHaveBeenCalledWith({
          chainId: 1,
        });
        expect(mockAccountController.getAccountMetadata).toHaveBeenCalledWith({
          chainId: 1,
        });
        expect(mockAccountController.getDelegationManager).toHaveBeenCalledWith(
          { chainId: 1 },
        );
      });

      /*
       * 8. Builds a caveat builder with a timestamp caveat and appends any permission-specific caveats.
       */
      it('calls appendCaveats with the populated permission and caveatBuilder', async () => {
        expect(mocks.appendCaveats).toHaveBeenCalledWith(
          mockPopulatedPermission,
          expect.any(Object),
        );
      });

      /*
       * 9. Creates and signs a delegation for the permission using the account controller.
       */
      it('calls signDelegation with the correct delegation', async () => {
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
