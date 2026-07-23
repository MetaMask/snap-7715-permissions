import type { Permission } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';

import { ExistingPermissionsCoordinator } from '../../../src/core/coordinators/ExistingPermissionsCoordinator';
import type { DialogInterface } from '../../../src/core/dialogInterface';
import {
  ExistingPermissionsService,
  ExistingPermissionsState,
} from '../../../src/core/existingpermissions/existingPermissionsService';
import type { StoredGrantedPermission } from '../../../src/profileSync/profileSync';

const mockPermission: Permission = {
  type: 'native-token-stream',
  data: {},
  isAdjustmentAllowed: true,
};

const mockSnapshot: StoredGrantedPermission[] = [];

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

    mockExistingPermissionsService = {
      getExistingPermissions: jest.fn().mockResolvedValue(mockSnapshot),
      getExistingPermissionsStatusFromList: jest.fn(),
      showExistingPermissions: jest.fn().mockResolvedValue(undefined),
    };

    mockExistingPermissionsService.getExistingPermissionsStatusFromList.mockImplementation(
      (_list, _permission) => ExistingPermissionsState.None,
    );

    coordinator = new ExistingPermissionsCoordinator({
      existingPermissionsService:
        mockExistingPermissionsService as unknown as ExistingPermissionsService,
    });
  });

  describe('prefetch()', () => {
    it('loads existing permissions once and derives banner status from the snapshot', async () => {
      coordinator.prefetch('https://example.com', mockPermission);

      expect(
        mockExistingPermissionsService.getExistingPermissions,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockExistingPermissionsService.getExistingPermissions,
      ).toHaveBeenCalledWith('https://example.com');

      await expect(coordinator.getStatus()).resolves.toBe(
        ExistingPermissionsState.None,
      );
      expect(
        mockExistingPermissionsService.getExistingPermissionsStatusFromList,
      ).toHaveBeenCalledWith(mockSnapshot, mockPermission);
    });

    it('returns ExistingPermissionsState.None when status derivation fails', async () => {
      mockExistingPermissionsService.getExistingPermissionsStatusFromList.mockImplementation(
        () => {
          throw new Error('status failed');
        },
      );

      coordinator.prefetch('https://example.com', mockPermission);

      await expect(coordinator.getStatus()).resolves.toBe(
        ExistingPermissionsState.None,
      );
      expect(logger.error).toHaveBeenCalledWith(
        'ExistingPermissionsCoordinator: existing permissions status from snapshot failed',
        expect.objectContaining({ origin: 'https://example.com' }),
      );
    });

    it('throws if prefetch is called more than once', () => {
      coordinator.prefetch('https://example.com', mockPermission);

      expect(() =>
        coordinator.prefetch('https://example.com', mockPermission),
      ).toThrow(
        'ExistingPermissionsCoordinator.prefetch() called more than once',
      );
    });
  });

  describe('getStatus()', () => {
    it('rejects if called before prefetch', async () => {
      await expect(coordinator.getStatus()).rejects.toThrow(
        'ExistingPermissionsCoordinator.getStatus() called before prefetch()',
      );
    });
  });

  describe('showSubview()', () => {
    const dialogInterface = {} as DialogInterface;

    beforeEach(() => {
      coordinator.prefetch('https://example.com', mockPermission);
    });

    it('throws if called before prefetch', async () => {
      const freshCoordinator = new ExistingPermissionsCoordinator({
        existingPermissionsService:
          mockExistingPermissionsService as unknown as ExistingPermissionsService,
      });

      await expect(
        freshCoordinator.showSubview({
          dialogInterface,
        }),
      ).rejects.toThrow(
        'ExistingPermissionsCoordinator.showSubview() called before prefetch()',
      );
    });

    it('shows the subview', async () => {
      await coordinator.showSubview({
        dialogInterface,
      });

      expect(
        mockExistingPermissionsService.showExistingPermissions,
      ).toHaveBeenCalledWith(dialogInterface, mockSnapshot);
    });
  });
});
