import type { Permission } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';

import { ExistingPermissionsCoordinator } from '../../../src/core/coordinators/ExistingPermissionsCoordinator';
import type { DialogInterface } from '../../../src/core/dialogInterface';
import {
  ExistingPermissionsService,
  ExistingPermissionsState,
} from '../../../src/core/existingpermissions/existingPermissionsService';
import type { BaseContext } from '../../../src/core/types';
import type {
  ProfileSyncManager,
  StoredGrantedPermission,
} from '../../../src/profileSync/profileSync';
import type { TokenMetadataService } from '../../../src/services/tokenMetadataService';

const mockPermission: Permission = {
  type: 'native-token-stream',
  data: {},
  isAdjustmentAllowed: true,
};

const mockSnapshot: StoredGrantedPermission[] = [];

const mockContext: BaseContext = {
  expiry: '2024-12-31',
  isAdjustmentAllowed: true,
  from: '0x1234',
  accountAddressCaip10: 'eip155:1:0x1234',
  justification: '',
};

describe('ExistingPermissionsCoordinator', () => {
  let mockExistingPermissionsService: jest.Mocked<
    Pick<
      ExistingPermissionsService,
      | 'getExistingPermissions'
      | 'getExistingPermissionsStatusFromList'
      | 'showExistingPermissions'
    >
  >;
  let coordinator: ExistingPermissionsCoordinator;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    const statusHelper = new ExistingPermissionsService({
      profileSyncManager: {
        getAllGrantedPermissions: jest.fn(),
      } as unknown as ProfileSyncManager,
      tokenMetadataService: {} as unknown as TokenMetadataService,
    });

    mockExistingPermissionsService = {
      getExistingPermissions: jest.fn().mockResolvedValue(mockSnapshot),
      getExistingPermissionsStatusFromList: jest.fn(),
      showExistingPermissions: jest.fn().mockResolvedValue(undefined),
    };

    mockExistingPermissionsService.getExistingPermissionsStatusFromList.mockImplementation(
      (list, permission) =>
        statusHelper.getExistingPermissionsStatusFromList(list, permission),
    );

    coordinator = new ExistingPermissionsCoordinator({
      existingPermissionsService:
        mockExistingPermissionsService as unknown as ExistingPermissionsService,
    });
  });

  describe('prefetch()', () => {
    it('loads existing permissions once and derives banner status from the snapshot', async () => {
      const { snapshotPromise, statusPromise } = coordinator.prefetch(
        'https://example.com',
        mockPermission,
      );

      expect(
        mockExistingPermissionsService.getExistingPermissions,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockExistingPermissionsService.getExistingPermissions,
      ).toHaveBeenCalledWith('https://example.com');

      await expect(snapshotPromise).resolves.toStrictEqual(mockSnapshot);
      await expect(statusPromise).resolves.toBe(ExistingPermissionsState.None);
      expect(
        mockExistingPermissionsService.getExistingPermissionsStatusFromList,
      ).toHaveBeenCalledWith(mockSnapshot, mockPermission);
    });

    it('returns ExistingPermissionsState.None when status derivation fails', async () => {
      mockExistingPermissionsService.getExistingPermissionsStatusFromList.mockRejectedValue(
        new Error('status failed'),
      );

      const { statusPromise } = coordinator.prefetch(
        'https://example.com',
        mockPermission,
      );

      await expect(statusPromise).resolves.toBe(ExistingPermissionsState.None);
      expect(logger.error).toHaveBeenCalledWith(
        'ExistingPermissionsCoordinator: existing permissions status from snapshot failed',
        expect.objectContaining({ origin: 'https://example.com' }),
      );
    });
  });

  describe('maybeShowSubview()', () => {
    const dialogInterface = {} as DialogInterface;

    it('shows the subview when entering for the first time', async () => {
      const snapshotPromise = Promise.resolve(mockSnapshot);

      const result = await coordinator.maybeShowSubview({
        dialogInterface,
        context: { ...mockContext, showExistingPermissions: true },
        enteringSubview: true,
        snapshotPromise,
      });

      expect(result).toStrictEqual({ handled: true });
      expect(
        mockExistingPermissionsService.showExistingPermissions,
      ).toHaveBeenCalledWith(dialogInterface, mockSnapshot);
    });

    it('does not re-show the subview when already entered', async () => {
      const result = await coordinator.maybeShowSubview({
        dialogInterface,
        context: { ...mockContext, showExistingPermissions: true },
        enteringSubview: false,
        snapshotPromise: Promise.resolve(mockSnapshot),
      });

      expect(result).toStrictEqual({ handled: true });
      expect(
        mockExistingPermissionsService.showExistingPermissions,
      ).not.toHaveBeenCalled();
    });

    it('returns handled false when the subview is not requested', async () => {
      const result = await coordinator.maybeShowSubview({
        dialogInterface,
        context: { ...mockContext, showExistingPermissions: false },
        enteringSubview: false,
        snapshotPromise: Promise.resolve(mockSnapshot),
      });

      expect(result).toStrictEqual({ handled: false });
      expect(
        mockExistingPermissionsService.showExistingPermissions,
      ).not.toHaveBeenCalled();
    });

    it('returns handled false when showExistingPermissions is null', async () => {
      const result = await coordinator.maybeShowSubview({
        dialogInterface,
        context: { ...mockContext, showExistingPermissions: null },
        enteringSubview: false,
        snapshotPromise: Promise.resolve(mockSnapshot),
      });

      expect(result).toStrictEqual({ handled: false });
      expect(
        mockExistingPermissionsService.showExistingPermissions,
      ).not.toHaveBeenCalled();
    });
  });
});
