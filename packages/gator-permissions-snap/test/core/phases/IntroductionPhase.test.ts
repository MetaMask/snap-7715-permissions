import type { Permission } from '@metamask/7715-permissions-shared/types';

import type { DialogInterface } from '../../../src/core/dialogInterface';
import type { PermissionIntroductionService } from '../../../src/core/permissionIntroduction';
import { IntroductionPhase } from '../../../src/core/phases/IntroductionPhase';
import type { SnapsMetricsService } from '../../../src/services/snapsMetricsService';

const mockDialogInterface = {} as DialogInterface;

const mockPermission: Permission = {
  type: 'test-permission',
  data: { amount: '0x1' },
};

const mockPermissionIntroductionService = {
  shouldShowIntroduction: jest.fn().mockResolvedValue(false),
  showIntroduction: jest.fn().mockResolvedValue({ wasCancelled: false }),
  markIntroductionAsSeen: jest.fn().mockResolvedValue(undefined),
} as unknown as jest.Mocked<PermissionIntroductionService>;

const mockSnapsMetricsService = {
  trackPermissionRejected: jest.fn().mockResolvedValue(undefined),
} as unknown as jest.Mocked<SnapsMetricsService>;

describe('IntroductionPhase', () => {
  let introductionPhase: IntroductionPhase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPermissionIntroductionService.shouldShowIntroduction.mockResolvedValue(
      false,
    );
    mockPermissionIntroductionService.showIntroduction.mockResolvedValue({
      wasCancelled: false,
    });

    introductionPhase = new IntroductionPhase({
      permissionIntroductionService: mockPermissionIntroductionService,
      snapsMetricsService: mockSnapsMetricsService,
    });
  });

  it('delegates shouldShow to the permission introduction service', async () => {
    mockPermissionIntroductionService.shouldShowIntroduction.mockResolvedValueOnce(
      true,
    );

    const result = await introductionPhase.shouldShow('native-token-stream');

    expect(result).toBe(true);
    expect(
      mockPermissionIntroductionService.shouldShowIntroduction,
    ).toHaveBeenCalledWith('native-token-stream');
  });

  it('marks introduction as seen after a successful intro', async () => {
    const result = await introductionPhase.run({
      dialogInterface: mockDialogInterface,
      permissionType: 'native-token-stream',
      origin: 'test-origin',
      chainId: '0x1',
      permission: mockPermission,
    });

    expect(result).toStrictEqual({ cancelled: false });
    expect(
      mockPermissionIntroductionService.markIntroductionAsSeen,
    ).toHaveBeenCalledWith('native-token-stream');
  });

  it('tracks rejection metrics and returns cancelled when intro is dismissed', async () => {
    mockPermissionIntroductionService.showIntroduction.mockResolvedValueOnce({
      wasCancelled: true,
    });

    const result = await introductionPhase.run({
      dialogInterface: mockDialogInterface,
      permissionType: 'native-token-stream',
      origin: 'test-origin',
      chainId: '0x1',
      permission: mockPermission,
    });

    expect(result).toStrictEqual({ cancelled: true });
    expect(
      mockSnapsMetricsService.trackPermissionRejected,
    ).toHaveBeenCalledWith({
      origin: 'test-origin',
      permissionType: 'native-token-stream',
      chainId: '0x1',
      permissionData: mockPermission.data,
    });
    expect(
      mockPermissionIntroductionService.markIntroductionAsSeen,
    ).not.toHaveBeenCalled();
  });
});
