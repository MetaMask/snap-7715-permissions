import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { bytesToHex } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type {
  FetchAddressScanResult,
  ScanDappUrlResult,
  TrustSignalsClient,
} from '../../../src/clients/trustSignalsClient';
import {
  AddressScanResultType,
  RecommendedAction,
} from '../../../src/clients/trustSignalsClient';
import type { AccountController } from '../../../src/core/accountController';
import type { ConfirmationDialog } from '../../../src/core/confirmation';
import { ConfirmationSession } from '../../../src/core/confirmation/ConfirmationSession';
import type { ConfirmationSessionResult } from '../../../src/core/confirmation/ConfirmationSession';
import type { ConfirmationDialogFactory } from '../../../src/core/confirmationFactory';
import { ExistingPermissionsCoordinator } from '../../../src/core/coordinators/ExistingPermissionsCoordinator';
import { TrustSignalsCoordinator } from '../../../src/core/coordinators/TrustSignalsCoordinator';
import type { DialogInterfaceFactory } from '../../../src/core/dialogInterfaceFactory';
import { ExistingPermissionsService } from '../../../src/core/existingpermissions/existingPermissionsService';
import { ExistingPermissionsState } from '../../../src/core/existingpermissions/existingPermissionsState';
import type { PermissionIntroductionService } from '../../../src/core/permissionIntroduction';
import type { BaseContext } from '../../../src/core/types';
import type { ProfileSyncManager } from '../../../src/profileSync/profileSync';
import type { SnapsMetricsService } from '../../../src/services/snapsMetricsService';
import type { TokenMetadataService } from '../../../src/services/tokenMetadataService';

const randomAddress = (): Hex => {
  const randomBytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256);
  }
  return bytesToHex(randomBytes);
};

const mockInterfaceId = 'test-interface-id';
const grantingAccountAddress = randomAddress();
const fixedCaip10Address = `eip155:1:${grantingAccountAddress}`;

const mockContext = {
  expiry: '2024-12-31',
  isAdjustmentAllowed: true,
  from: grantingAccountAddress,
  accountAddressCaip10: fixedCaip10Address,
  justification: 'test justification',
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

const mockPermissionRequest: PermissionRequest = {
  chainId: '0x1',
  to: requestingAccountAddress,
  permission: {
    type: 'test-permission',
    data: {},
    isAdjustmentAllowed: true,
  },
  rules: [],
};

const mockAccountController = {
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

const mockSnapsMetricsService = {
  trackPermissionDialogShown: jest.fn().mockResolvedValue(undefined),
  trackPermissionRejected: jest.fn().mockResolvedValue(undefined),
  trackSmartAccountUpgraded: jest.fn().mockResolvedValue(undefined),
} as unknown as jest.Mocked<SnapsMetricsService>;

const mockPermissionIntroductionService = {
  markIntroductionAsSeen: jest.fn().mockResolvedValue(undefined),
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
  buildContext: jest.Mock;
  deriveMetadata: jest.Mock;
  createSkeletonConfirmationContent: jest.Mock;
  createConfirmationContent: jest.Mock;
  onConfirmationCreated?: jest.Mock;
  onConfirmationResolved?: jest.Mock;
};

describe('ConfirmationSession', () => {
  let confirmationSession: ConfirmationSession;
  let existingPermissionsCoordinator: ExistingPermissionsCoordinator;
  let trustSignalsCoordinator: TrustSignalsCoordinator;
  let lifecycleHandlerMocks: TestLifecycleHandlersMocks;

  const runSession = async (
    overrides: {
      shouldShowIntroduction?: boolean;
      normalizedRequest?: PermissionRequest;
    } = {},
  ): Promise<ConfirmationSessionResult<BaseContext>> =>
    confirmationSession.run({
      origin: 'test-origin',
      permissionType: 'test-permission',
      normalizedRequest: overrides.normalizedRequest ?? mockPermissionRequest,
      chainId: 1,
      lifecycleHandlers: lifecycleHandlerMocks as never,
      shouldShowIntroduction: overrides.shouldShowIntroduction ?? false,
    });

  beforeEach(() => {
    jest.clearAllMocks();

    existingPermissionsCoordinator = new ExistingPermissionsCoordinator({
      existingPermissionsService: mockExistingPermissionsService,
    });

    trustSignalsCoordinator = new TrustSignalsCoordinator({
      trustSignalsClient: mockTrustSignalsClient,
    });

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
      buildContext: jest.fn().mockResolvedValue(mockContext),
      deriveMetadata: jest.fn().mockResolvedValue(mockMetadata),
      createSkeletonConfirmationContent: jest
        .fn()
        .mockResolvedValue(mockSkeletonUiContent),
      createConfirmationContent: jest.fn().mockResolvedValue(mockUiContent),
      onConfirmationCreated: jest.fn(),
      onConfirmationResolved: jest.fn(),
    };

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

    mockTrustSignalsClient.scanDappUrl.mockResolvedValue({
      isComplete: false,
    });
    mockTrustSignalsClient.fetchAddressScan.mockResolvedValue(
      mockScanAddressResult,
    );

    mockPermissionIntroductionService.showIntroduction.mockResolvedValue({
      wasCancelled: false,
    });
    mockPermissionIntroductionService.markIntroductionAsSeen.mockResolvedValue(
      undefined,
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
  });

  it('creates a shared dialog interface once per request', async () => {
    await runSession();

    expect(
      mockDialogInterfaceFactory.createDialogInterface,
    ).toHaveBeenCalledTimes(1);
  });

  it('loads existing permissions from profile sync only once per request', async () => {
    await runSession();

    expect(
      mockExistingPermissionsService.getExistingPermissions,
    ).toHaveBeenCalledTimes(1);
    expect(
      mockExistingPermissionsService.getExistingPermissions,
    ).toHaveBeenCalledWith('test-origin');
  });

  it('creates a skeleton confirmation before the context is resolved', async () => {
    const contextPromise = new Promise<BaseContext>((_resolve) => {
      console.log('Arrow function cannot be empty');
    });

    lifecycleHandlerMocks.buildContext.mockReturnValue(contextPromise);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    runSession();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockConfirmationDialog.updateContent).not.toHaveBeenCalled();
    expect(
      lifecycleHandlerMocks.createSkeletonConfirmationContent,
    ).toHaveBeenCalledTimes(1);
    expect(
      lifecycleHandlerMocks.createConfirmationContent,
    ).not.toHaveBeenCalled();
  });

  it('creates the confirmation dialog with onBeforeGrant validation', async () => {
    const contextPromise = new Promise<BaseContext>((_resolve) => {
      console.log('Arrow function cannot be empty');
    });

    lifecycleHandlerMocks.buildContext.mockReturnValue(contextPromise);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    runSession();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      mockConfirmationDialogFactory.createConfirmation,
    ).toHaveBeenCalledWith({
      dialogInterface: expect.any(Object),
      ui: mockSkeletonUiContent,
      onBeforeGrant: expect.any(Function),
    });
  });

  it('returns approved with context when the user grants', async () => {
    const result = await runSession();

    expect(result).toStrictEqual({
      isApproved: true,
      context: mockContext,
    });
  });

  it('returns rejected when the user denies at confirmation', async () => {
    mockConfirmationDialog.displayConfirmationDialogAndAwaitUserDecision.mockResolvedValueOnce(
      {
        isConfirmationGranted: false,
      },
    );

    const result = await runSession();

    expect(result).toStrictEqual({
      isApproved: false,
      reason: 'Permission request denied at confirmation screen',
      phase: 'confirmation',
    });
    expect(mockSnapsMetricsService.trackPermissionRejected).toHaveBeenCalled();
  });

  it('returns rejected when the user cancels at introduction', async () => {
    mockPermissionIntroductionService.showIntroduction.mockResolvedValueOnce({
      wasCancelled: true,
    });

    const result = await runSession({ shouldShowIntroduction: true });

    expect(result).toStrictEqual({
      isApproved: false,
      reason: 'Permission request denied at introduction screen',
      phase: 'introduction',
    });
    expect(mockSnapsMetricsService.trackPermissionRejected).toHaveBeenCalled();
    expect(mockConfirmationDialog.initialize).not.toHaveBeenCalled();
  });

  it('marks introduction as seen after a successful intro', async () => {
    await runSession({ shouldShowIntroduction: true });

    expect(
      mockPermissionIntroductionService.markIntroductionAsSeen,
    ).toHaveBeenCalledWith('test-permission');
  });

  it('invokes onConfirmationResolved after the session completes', async () => {
    await runSession();

    expect(lifecycleHandlerMocks.onConfirmationResolved).toHaveBeenCalledTimes(
      1,
    );
  });

  it('checks account upgrade status and triggers upgrade when needed', async () => {
    mockAccountController.getAccountUpgradeStatus.mockResolvedValueOnce({
      isUpgraded: false,
    });

    const result = await runSession();

    expect(mockAccountController.getAccountUpgradeStatus).toHaveBeenCalledWith({
      account: grantingAccountAddress,
      chainId: '0x1',
    });
    expect(mockAccountController.upgradeAccount).toHaveBeenCalledWith({
      account: grantingAccountAddress,
      chainId: '0x1',
    });
    expect(result.isApproved).toBe(true);
  });

  it('does not trigger upgrade when account is already upgraded', async () => {
    mockAccountController.getAccountUpgradeStatus.mockResolvedValueOnce({
      isUpgraded: true,
    });

    await runSession();

    expect(mockAccountController.upgradeAccount).not.toHaveBeenCalled();
    expect(
      mockSnapsMetricsService.trackSmartAccountUpgraded,
    ).not.toHaveBeenCalled();
  });

  it('prevents race condition when grant is clicked before debounced validation completes', async () => {
    let validationErrorsState = {};

    lifecycleHandlerMocks.deriveMetadata.mockImplementation(async () => ({
      test: 'metadata',
      validationErrors: validationErrorsState,
    }));

    const sessionPromise = runSession();

    await new Promise((resolve) => setTimeout(resolve, 0));

    const createConfirmationCall =
      mockConfirmationDialogFactory.createConfirmation.mock.calls[0]?.[0];

    if (!createConfirmationCall?.onBeforeGrant) {
      throw new Error('Expected onBeforeGrant to be defined');
    }

    const beforeGrantCallback = createConfirmationCall.onBeforeGrant;

    validationErrorsState = {};
    expect(await beforeGrantCallback()).toBe(true);

    validationErrorsState = { amount: 'Amount must be positive' };
    expect(await beforeGrantCallback()).toBe(false);

    validationErrorsState = {};
    expect(await beforeGrantCallback()).toBe(true);

    await sessionPromise;
  });

  it('shows the existing permissions subview when updateContext sets showExistingPermissions', async () => {
    const subviewContext: BaseContext = {
      ...mockContext,
      showExistingPermissions: true,
      justification: '',
      expiry: { timestamp: 1733088000 },
      accountAddressCaip10: fixedCaip10Address,
      tokenAddressCaip19: 'eip155:1:0x1234',
      tokenMetadata: {
        decimals: 18,
        symbol: 'TEST',
        iconDataBase64: null,
      },
    };

    let capturedParams:
      | {
          updateContext: (args: {
            updatedContext: BaseContext;
          }) => Promise<void>;
        }
      | undefined;

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
        const isConfirmationGranted = await new Promise<boolean>((resolve) => {
          resolveUserDecision = resolve;
        });
        return { isConfirmationGranted };
      },
    );

    const sessionPromise = runSession();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(capturedParams).toBeDefined();

    const createContentCallsBefore =
      lifecycleHandlerMocks.createConfirmationContent.mock.calls.length;

    await capturedParams?.updateContext({ updatedContext: subviewContext });

    expect(
      mockExistingPermissionsService.showExistingPermissions,
    ).toHaveBeenCalledWith(expect.any(Object), []);
    expect(
      lifecycleHandlerMocks.createConfirmationContent,
    ).toHaveBeenCalledTimes(createContentCallsBefore);

    resolveUserDecision(true);
    await sessionPromise;
  });

  it('does not re-render confirmation content when trust signals resolve while the existing permissions subview is open', async () => {
    let resolveDappScan: (result: ScanDappUrlResult) => void = (_) => {
      throw new Error('resolveDappScan not set');
    };

    mockTrustSignalsClient.scanDappUrl.mockImplementation(
      async () =>
        new Promise<ScanDappUrlResult>((resolve) => {
          resolveDappScan = resolve;
        }),
    );
    mockTrustSignalsClient.fetchAddressScan.mockImplementation(
      async () => new Promise<FetchAddressScanResult>(() => {}),
    );

    const subviewContext: BaseContext = {
      ...mockContext,
      showExistingPermissions: true,
      justification: '',
      expiry: { timestamp: 1733088000 },
      accountAddressCaip10: fixedCaip10Address,
      tokenAddressCaip19: 'eip155:1:0x1234',
      tokenMetadata: {
        decimals: 18,
        symbol: 'TEST',
        iconDataBase64: null,
      },
    };

    let capturedParams:
      | {
          updateContext: (args: {
            updatedContext: BaseContext;
          }) => Promise<void>;
        }
      | undefined;

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
        const isConfirmationGranted = await new Promise<boolean>((resolve) => {
          resolveUserDecision = resolve;
        });
        return { isConfirmationGranted };
      },
    );

    const sessionPromise = runSession();

    await new Promise((resolve) => setTimeout(resolve, 0));

    await capturedParams?.updateContext({ updatedContext: subviewContext });

    const createContentCallsAfterSubview =
      lifecycleHandlerMocks.createConfirmationContent.mock.calls.length;
    const updateContentCallsAfterSubview =
      mockConfirmationDialog.updateContent.mock.calls.length;

    resolveDappScan({
      isComplete: true,
      recommendedAction: RecommendedAction.WARN,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(
      lifecycleHandlerMocks.createConfirmationContent,
    ).toHaveBeenCalledTimes(createContentCallsAfterSubview);
    expect(mockConfirmationDialog.updateContent).toHaveBeenCalledTimes(
      updateContentCallsAfterSubview,
    );

    resolveUserDecision(true);
    await sessionPromise;
  });

  it('tracks permission dialog shown after the first successful confirmation render', async () => {
    await runSession();

    expect(
      mockSnapsMetricsService.trackPermissionDialogShown,
    ).toHaveBeenCalledWith({
      origin: 'test-origin',
      permissionType: 'test-permission',
      chainId: '0x1',
      permissionData: {},
      justification: mockContext.justification,
    });
  });

  it('passes the same dialog interface to intro and confirmation', async () => {
    let capturedIntroDialogInterface: unknown;

    mockPermissionIntroductionService.showIntroduction.mockImplementation(
      async ({ dialogInterface }) => {
        capturedIntroDialogInterface = dialogInterface;
        return { wasCancelled: false };
      },
    );

    await runSession({ shouldShowIntroduction: true });

    expect(
      mockPermissionIntroductionService.showIntroduction,
    ).toHaveBeenCalled();
    expect(
      mockConfirmationDialogFactory.createConfirmation,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        dialogInterface: capturedIntroDialogInterface,
      }),
    );
  });

  it('enables the grant button when updating the confirmation with the resolved context', async () => {
    const sessionPromise = runSession();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockConfirmationDialog.updateContent).toHaveBeenCalledWith({
      ui: mockUiContent,
    });

    await sessionPromise;
  });

  it('tracks smart account upgrade success when upgrade is successful', async () => {
    mockAccountController.getAccountUpgradeStatus.mockResolvedValueOnce({
      isUpgraded: false,
    });
    mockAccountController.upgradeAccount.mockResolvedValueOnce({
      transactionHash: '0xabc123',
    });

    const result = await runSession();

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
    expect(result.isApproved).toBe(true);
  });

  it('tracks smart account upgrade failure when upgrade fails', async () => {
    mockAccountController.getAccountUpgradeStatus.mockResolvedValueOnce({
      isUpgraded: false,
    });
    mockAccountController.upgradeAccount.mockRejectedValueOnce(
      new Error('Upgrade failed'),
    );

    const result = await runSession();

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
    expect(result.isApproved).toBe(true);
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

    let capturedParams:
      | {
          interfaceId: string;
          initialContext: BaseContext;
          updateContext: (args: {
            updatedContext: BaseContext;
          }) => Promise<void>;
        }
      | undefined;

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
        const isConfirmationGranted = await new Promise<boolean>((resolve) => {
          resolveUserDecision = resolve;
        });
        return { isConfirmationGranted };
      },
    );

    const sessionPromise = runSession();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(lifecycleHandlerMocks.onConfirmationCreated).toHaveBeenCalled();
    expect(capturedParams).toBeDefined();
    expect(capturedParams?.interfaceId).toBe(mockInterfaceId);
    expect(capturedParams?.initialContext).toStrictEqual(initialContext);
    expect(typeof capturedParams?.updateContext).toBe('function');

    await capturedParams?.updateContext({ updatedContext: modifiedContext });

    expect(mockConfirmationDialog.updateContent).toHaveBeenCalled();

    resolveUserDecision(true);

    const result = await sessionPromise;

    expect(result).toStrictEqual({
      isApproved: true,
      context: modifiedContext,
    });
  });

  it('serializes consecutive updateConfirmation calls so they run in order and do not overwrite each other', async () => {
    mockTrustSignalsClient.scanDappUrl.mockImplementationOnce(
      async (): Promise<ScanDappUrlResult> =>
        new Promise<ScanDappUrlResult>(() => {}),
    );

    const contextWithMarker = (
      marker: string,
    ): BaseContext & { foo?: string } => ({
      ...mockContext,
      foo: marker,
      justification: '',
      expiry: { timestamp: 1733088000 },
      isAdjustmentAllowed: true,
      accountAddressCaip10: 'caip:10:address',
      tokenAddressCaip19: 'caip:19/asset:address',
      tokenMetadata: {
        decimals: 18,
        symbol: 'TEST',
        iconDataBase64: null,
      },
    });

    const delay = async (ms: number): Promise<void> =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    lifecycleHandlerMocks.createConfirmationContent.mockImplementation(
      async ({
        context,
      }: {
        context: BaseContext & { foo?: string };
      }): Promise<SnapElement> => {
        await delay(10);
        return {
          ...mockUiContent,
          contextMarker: context.foo,
        } as SnapElement;
      },
    );

    let resolveUserDecision: (decision: boolean) => void = (_) => {
      throw new Error('resolveUserDecision not set');
    };
    mockConfirmationDialog.displayConfirmationDialogAndAwaitUserDecision.mockImplementation(
      async () => {
        const isConfirmationGranted = await new Promise<boolean>((resolve) => {
          resolveUserDecision = resolve;
        });
        return { isConfirmationGranted };
      },
    );

    const onConfirmationCreatedPromise = new Promise<{
      updateContext: (args: {
        updatedContext: BaseContext & { foo?: string };
      }) => Promise<void>;
    }>((resolve) => {
      lifecycleHandlerMocks.onConfirmationCreated?.mockImplementation(
        (params) => {
          resolve(params);
        },
      );
    });

    const sessionPromise = runSession();

    const { updateContext } = await onConfirmationCreatedPromise;

    const contextFirst = contextWithMarker('first');
    const contextSecond = contextWithMarker('second');
    const contextThird = contextWithMarker('third');

    const initialUpdateContentCalls =
      mockConfirmationDialog.updateContent.mock.calls.length;

    const promise1 = updateContext({ updatedContext: contextFirst });
    const promise2 = updateContext({ updatedContext: contextSecond });
    const promise3 = updateContext({ updatedContext: contextThird });

    await Promise.all([promise1, promise2, promise3]);

    const updateContentCalls = mockConfirmationDialog.updateContent.mock.calls;
    expect(updateContentCalls.length).toBeGreaterThanOrEqual(
      initialUpdateContentCalls + 3,
    );

    const lastThreeCalls = updateContentCalls.slice(-3);
    const firstUpdateUi = lastThreeCalls[0]?.[0]?.ui as SnapElement & {
      contextMarker?: string;
    };
    const secondUpdateUi = lastThreeCalls[1]?.[0]?.ui as SnapElement & {
      contextMarker?: string;
    };
    const thirdUpdateUi = lastThreeCalls[2]?.[0]?.ui as SnapElement & {
      contextMarker?: string;
    };

    expect(firstUpdateUi.contextMarker).toBe('first');
    expect(secondUpdateUi.contextMarker).toBe('second');
    expect(thirdUpdateUi.contextMarker).toBe('third');

    resolveUserDecision(true);
    await sessionPromise;
  });

  describe('nominal path', () => {
    beforeEach(async () => {
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

      await runSession();
    });

    it('creates the confirmation dialog with skeleton UI content', () => {
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

    it('builds context, derives metadata and updates the UI content for confirmation', async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));

      expect(lifecycleHandlerMocks.buildContext).toHaveBeenCalledWith(
        mockPermissionRequest,
      );

      expect(lifecycleHandlerMocks.deriveMetadata).toHaveBeenCalledWith({
        context: mockContext,
      });

      expect(
        lifecycleHandlerMocks.createConfirmationContent,
      ).toHaveBeenCalledTimes(3);

      expect(
        lifecycleHandlerMocks.createConfirmationContent,
      ).toHaveBeenNthCalledWith(1, {
        context: mockContext,
        metadata: mockMetadata,
        origin: 'test-origin',
        chainId: 1,
        scanDappUrlResult: null,
        scanAddressResult: null,
        existingPermissionsStatus: ExistingPermissionsState.None,
        isGrantDisabled: false,
      });

      expect(
        lifecycleHandlerMocks.createConfirmationContent,
      ).toHaveBeenNthCalledWith(3, {
        context: mockContext,
        metadata: mockMetadata,
        origin: 'test-origin',
        chainId: 1,
        scanDappUrlResult: { isComplete: false },
        scanAddressResult: mockScanAddressResult,
        existingPermissionsStatus: ExistingPermissionsState.None,
        isGrantDisabled: false,
      });

      expect(mockTrustSignalsClient.fetchAddressScan).toHaveBeenCalledWith(
        mockPermissionRequest.chainId,
        mockPermissionRequest.to,
      );

      expect(mockConfirmationDialog.updateContent).toHaveBeenCalledWith({
        ui: mockUiContent,
      });
    });
  });
});
