import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { bytesToHex } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type { AccountController } from '../../src/core/accountController';
import type { ConfirmationDialog } from '../../src/core/confirmation';
import { ConfirmationSession } from '../../src/core/confirmation/ConfirmationSession';
import type { ConfirmationDialogFactory } from '../../src/core/confirmationFactory';
import { ExistingPermissionsCoordinator } from '../../src/core/coordinators/ExistingPermissionsCoordinator';
import { TrustSignalsCoordinator } from '../../src/core/coordinators/TrustSignalsCoordinator';
import type { DialogInterfaceFactory } from '../../src/core/dialogInterfaceFactory';
import type { ExistingPermissionsService } from '../../src/core/existingpermissions/existingPermissionsService';
import { GrantedPermissionResolutionService } from '../../src/core/grant/GrantedPermissionResolutionService';
import { PermissionGrantPipeline } from '../../src/core/PermissionGrantPipeline';
import { PermissionGrantPreparator } from '../../src/core/PermissionGrantPreparator';
import type { PermissionIntroductionService } from '../../src/core/permissionIntroduction';
import { IntroductionPhase } from '../../src/core/phases/IntroductionPhase';
import type { NonceCaveatService } from '../../src/services/nonceCaveatService';
import type { SnapsMetricsService } from '../../src/services/snapsMetricsService';

const randomAddress = (): Hex => {
  const randomBytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256);
  }
  return bytesToHex(randomBytes);
};

const grantingAccountAddress = randomAddress();
const requestingAccountAddress = randomAddress();

const mockContext = {
  expiry: '2024-12-31',
  isAdjustmentAllowed: true,
  from: grantingAccountAddress,
  accountAddressCaip10: `eip155:1:${grantingAccountAddress}`,
};

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

const mockUiContent = { type: 'ui-content' } as SnapElement;
const mockSkeletonUiContent = { type: 'skeleton' } as SnapElement;

const mockAccountController = {
  signDelegation: jest.fn(),
  getAccountAddresses: jest.fn(),
  getAccountUpgradeStatus: jest.fn(async () => ({ isUpgraded: true })),
  upgradeAccount: jest.fn(),
} as unknown as jest.Mocked<AccountController>;

const mockDialogInterfaceFactory = {
  createDialogInterface: jest.fn().mockReturnValue({}),
} as unknown as jest.Mocked<DialogInterfaceFactory>;

const mockConfirmationDialog = {
  initialize: jest.fn().mockResolvedValue('interface-id'),
  displayConfirmationDialogAndAwaitUserDecision: jest
    .fn()
    .mockResolvedValue({ isConfirmationGranted: true }),
  updateContent: jest.fn().mockResolvedValue(undefined),
  closeWithError: jest.fn(),
} as unknown as jest.Mocked<ConfirmationDialog>;

const mockConfirmationDialogFactory = {
  createConfirmation: jest.fn().mockReturnValue(mockConfirmationDialog),
} as unknown as jest.Mocked<ConfirmationDialogFactory>;

const mockSnapsMetricsService = {
  trackPermissionRequestStarted: jest.fn().mockResolvedValue(undefined),
  trackPermissionDialogShown: jest.fn().mockResolvedValue(undefined),
  trackPermissionGranted: jest.fn().mockResolvedValue(undefined),
  trackPermissionRejected: jest.fn().mockResolvedValue(undefined),
  trackDelegationSigning: jest.fn().mockResolvedValue(undefined),
} as unknown as jest.Mocked<SnapsMetricsService>;

const mockPermissionIntroductionService = {
  shouldShowIntroduction: jest.fn().mockResolvedValue(false),
  showIntroduction: jest.fn().mockResolvedValue({ wasCancelled: false }),
  markIntroductionAsSeen: jest.fn().mockResolvedValue(undefined),
} as unknown as jest.Mocked<PermissionIntroductionService>;

const mockExistingPermissionsService = {
  getExistingPermissions: jest.fn().mockResolvedValue([]),
  getExistingPermissionsStatusFromList: jest
    .fn()
    .mockReturnValue({ state: 'none' }),
  showExistingPermissions: jest.fn().mockResolvedValue(undefined),
} as unknown as jest.Mocked<ExistingPermissionsService>;

const mockTrustSignalsClient = {
  scanDappUrl: jest.fn().mockResolvedValue({ isComplete: false }),
  fetchAddressScan: jest
    .fn()
    .mockResolvedValue({ resultType: 'benign', label: '' }),
} as unknown as jest.Mocked<{
  scanDappUrl: jest.Mock;
  fetchAddressScan: jest.Mock;
}>;

const mockNonceCaveatService = {
  getNonce: jest.fn().mockResolvedValue(0n),
} as unknown as jest.Mocked<NonceCaveatService>;

describe('PermissionGrantPipeline', () => {
  let pipeline: PermissionGrantPipeline;
  let lifecycleHandlerMocks: {
    parseAndValidatePermission: jest.Mock;
    buildContext: jest.Mock;
    deriveMetadata: jest.Mock;
    createSkeletonConfirmationContent: jest.Mock;
    createConfirmationContent: jest.Mock;
    applyContext: jest.Mock;
    populatePermission: jest.Mock;
    createPermissionCaveats: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAccountController.getAccountAddresses.mockResolvedValue([
      grantingAccountAddress,
    ]);
    mockExistingPermissionsService.getExistingPermissions.mockResolvedValue([]);
    mockExistingPermissionsService.getExistingPermissionsStatusFromList.mockReturnValue(
      { state: 'none' } as never,
    );
    mockConfirmationDialogFactory.createConfirmation.mockReturnValue(
      mockConfirmationDialog,
    );
    mockConfirmationDialog.initialize.mockResolvedValue('interface-id');
    mockConfirmationDialog.displayConfirmationDialogAndAwaitUserDecision.mockResolvedValue(
      { isConfirmationGranted: true },
    );
    mockTrustSignalsClient.scanDappUrl.mockResolvedValue({ isComplete: false });
    mockTrustSignalsClient.fetchAddressScan.mockResolvedValue({
      resultType: 'benign',
      label: '',
    });
    mockNonceCaveatService.getNonce.mockResolvedValue(0n);
    mockAccountController.signDelegation.mockImplementation(
      async ({ delegation }) => ({
        ...delegation,
        signature: '0x1234',
      }),
    );

    lifecycleHandlerMocks = {
      parseAndValidatePermission: jest.fn().mockImplementation((req) => req),
      buildContext: jest.fn().mockResolvedValue(mockContext),
      deriveMetadata: jest.fn().mockResolvedValue({}),
      createSkeletonConfirmationContent: jest
        .fn()
        .mockResolvedValue(mockSkeletonUiContent),
      createConfirmationContent: jest.fn().mockResolvedValue(mockUiContent),
      applyContext: jest.fn().mockImplementation(({ originalRequest }) => ({
        ...originalRequest,
        from: grantingAccountAddress,
      })),
      populatePermission: jest.fn().mockImplementation(({ permission }) => ({
        ...permission,
        data: { populated: true },
      })),
      createPermissionCaveats: jest.fn().mockReturnValue([]),
    };

    const introductionPhase = new IntroductionPhase({
      permissionIntroductionService: mockPermissionIntroductionService,
      snapsMetricsService: mockSnapsMetricsService,
    });

    const existingPermissionsCoordinator = new ExistingPermissionsCoordinator({
      existingPermissionsService: mockExistingPermissionsService,
    });

    const trustSignalsCoordinator = new TrustSignalsCoordinator({
      trustSignalsClient: mockTrustSignalsClient as never,
    });

    const confirmationSession = new ConfirmationSession({
      dialogInterfaceFactory: mockDialogInterfaceFactory,
      confirmationDialogFactory: mockConfirmationDialogFactory,
      introductionPhase,
      existingPermissionsCoordinator,
      trustSignalsCoordinator,
      accountController: mockAccountController,
      snapsMetricsService: mockSnapsMetricsService,
    });

    const grantedPermissionResolutionService =
      new GrantedPermissionResolutionService({
        accountController: mockAccountController,
        nonceCaveatService: mockNonceCaveatService,
        snapsMetricsService: mockSnapsMetricsService,
      });

    const permissionGrantPreparator = new PermissionGrantPreparator({
      accountController: mockAccountController,
      snapsMetricsService: mockSnapsMetricsService,
    });

    pipeline = new PermissionGrantPipeline({
      permissionGrantPreparator,
      introductionPhase,
      confirmationSession,
      grantedPermissionResolutionService,
    });
  });

  it('runs preparation, confirmation session, and grant resolution in sequence', async () => {
    const result = await pipeline.run({
      origin: 'test-origin',
      permissionRequest: mockPermissionRequest,
      lifecycleHandlers: lifecycleHandlerMocks,
    });

    expect(result.approved).toBe(true);
    expect(
      mockSnapsMetricsService.trackPermissionRequestStarted,
    ).toHaveBeenCalled();
    expect(
      lifecycleHandlerMocks.parseAndValidatePermission,
    ).toHaveBeenCalledWith(mockPermissionRequest);
    expect(lifecycleHandlerMocks.buildContext).toHaveBeenCalledWith({
      ...mockPermissionRequest,
      from: grantingAccountAddress,
    });
    expect(mockAccountController.signDelegation).toHaveBeenCalled();
  });

  it('returns rejection when the confirmation session is denied', async () => {
    mockConfirmationDialog.displayConfirmationDialogAndAwaitUserDecision.mockResolvedValueOnce(
      { isConfirmationGranted: false },
    );

    const result = await pipeline.run({
      origin: 'test-origin',
      permissionRequest: mockPermissionRequest,
      lifecycleHandlers: lifecycleHandlerMocks,
    });

    expect(result).toStrictEqual({
      approved: false,
      reason: 'Permission request denied at confirmation screen',
    });
    expect(mockAccountController.signDelegation).not.toHaveBeenCalled();
  });
});
