import type { Permission } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';

import { ExistingPermissionsCoordinator } from '../../../src/core/coordinators/ExistingPermissionsCoordinator';
import type { DialogInterface } from '../../../src/core/dialogInterface';
import {
  ExistingPermissionsService,
  ExistingPermissionsState,
} from '../../../src/core/existingpermissions/existingPermissionsService';
import type { BaseContext } from '../../../src/core/types';
import type { StoredGrantedPermission } from '../../../src/profileSync/profileSync';

const mockPermission: Permission = {
  type: 'native-token-stream',
  data: {},
  isAdjustmentAllowed: true,
};

const mockSnapshot: StoredGrantedPermission[] = [];

const mockContext: BaseContext = {
  tokenAddressCaip19: 'eip155:1:0x1234/erc20:0x1234',
  expiry: { timestamp: 1717987200 },
  isAdjustmentAllowed: true,
  accountAddressCaip10: 'eip155:1:0x1234',
  justification: 'Justification',
  tokenMetadata: {
    decimals: 18,
    symbol: 'TKN',
    iconDataBase64: null,
  },
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

  describe('maybeShowSubview()', () => {
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
        freshCoordinator.maybeShowSubview({
          dialogInterface,
          context: { ...mockContext, showExistingPermissions: true },
          enteringSubview: true,
        }),
      ).rejects.toThrow(
        'ExistingPermissionsCoordinator.maybeShowSubview() called before prefetch()',
      );
    });

    it('shows the subview when entering for the first time', async () => {
      const result = await coordinator.maybeShowSubview({
        dialogInterface,
        context: { ...mockContext, showExistingPermissions: true },
        enteringSubview: true,
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
      });

      expect(result).toStrictEqual({ handled: false });
      expect(
        mockExistingPermissionsService.showExistingPermissions,
      ).not.toHaveBeenCalled();
    });
  });
});
