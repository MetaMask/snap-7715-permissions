import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';

import { SnapsMetricsService } from '../../src/services/snapsMetricsService';

// Mock the logger
jest.mock('@metamask/7715-permissions-shared/utils', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('SnapsMetricsService', () => {
  let snapsMetricsService: SnapsMetricsService;
  const mockSnap = createMockSnapsProvider();

  beforeEach(() => {
    jest.clearAllMocks();
    snapsMetricsService = new SnapsMetricsService(mockSnap);
  });

  describe('trackPermissionRequestStarted', () => {
    it('should track permission request started event with basic properties', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackPermissionRequestStarted({
        origin: 'https://example.com',
        permissionType: 'native-token-stream',
        chainId: '0x1',
        permissionData: {},
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Permission Request Started',
            properties: {
              message: 'User initiated permission request',
              origin: 'https://example.com',
              permission_type: 'native-token-stream',
              chain_id: '0x1',
            },
          },
        },
      });
    });

    it('should track permission request with full permission value details', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackPermissionRequestStarted({
        origin: 'https://dapp.example',
        permissionType: 'erc20-token-periodic',
        chainId: '0x1',
        permissionData: {
          periodAmount: '0xde0b6b3a7640000',
          periodDuration: 2592000,
          startTime: 1762379896,
          tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        },
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Permission Request Started',
            properties: {
              message: 'User initiated permission request',
              origin: 'https://dapp.example',
              permission_type: 'erc20-token-periodic',
              chain_id: '0x1',
              period_amount: '0xde0b6b3a7640000',
              period_duration: 2592000,
              start_time: 1762379896,
              token_address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            },
          },
        },
      });
    });

    it('should track permission request with native token', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackPermissionRequestStarted({
        origin: 'https://example.com',
        permissionType: 'native-token-periodic',
        chainId: '0x1',
        permissionData: {
          periodAmount: '0xde0b6b3a7640000',
          periodDuration: 2592000,
          startTime: 1762379518,
        },
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Permission Request Started',
            properties: {
              message: 'User initiated permission request',
              origin: 'https://example.com',
              permission_type: 'native-token-periodic',
              chain_id: '0x1',
              period_amount: '0xde0b6b3a7640000',
              period_duration: 2592000,
              start_time: 1762379518,
            },
          },
        },
      });
    });
  });

  describe('trackPermissionDialogShown', () => {
    it('should track permission dialog shown event', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackPermissionDialogShown({
        origin: 'https://example.com',
        permissionType: 'erc20-token-stream',
        chainId: '0x89',
        permissionData: {},
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Permission Dialog Shown',
            properties: {
              message: 'Permission confirmation dialog displayed',
              origin: 'https://example.com',
              permission_type: 'erc20-token-stream',
              chain_id: '0x89',
            },
          },
        },
      });
    });
  });

  describe('trackPermissionRejected', () => {
    it('should track permission rejected event', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackPermissionRejected({
        origin: 'https://example.com',
        permissionType: 'native-token-stream',
        chainId: '0x1',
        permissionData: {},
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Permission Rejected',
            properties: {
              message: 'User rejected permission request',
              origin: 'https://example.com',
              permission_type: 'native-token-stream',
              chain_id: '0x1',
            },
          },
        },
      });
    });
  });

  describe('trackPermissionGranted', () => {
    it('should track permission granted event', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackPermissionGranted({
        origin: 'https://example.com',
        permissionType: 'erc20-token-stream',
        chainId: '0x1',
        permissionData: {
          tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          amountPerSecond: '0x7a120',
          initialAmount: '0x7a120',
          maxAmount: '0x2625a0',
          startTime: 1762379839,
        },
        isAdjustmentAllowed: false,
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Permission Granted',
            properties: {
              message: 'Permission successfully granted',
              origin: 'https://example.com',
              permission_type: 'erc20-token-stream',
              is_adjustment_allowed: false,
              chain_id: '0x1',
              token_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              amount_per_second: '0x7a120',
              initial_amount: '0x7a120',
              max_amount: '0x2625a0',
              start_time: 1762379839,
            },
          },
        },
      });
    });
  });

  describe('trackSmartAccountUpgraded', () => {
    it('should track successful smart account upgrade', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackSmartAccountUpgraded({
        origin: 'https://example.com',
        accountAddress: '0x1234567890123456789012345678901234567890',
        chainId: '0x1',
        success: true,
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Smart Account Upgraded',
            properties: {
              message: 'Smart account successfully upgraded',
              origin: 'https://example.com',
              account_address: '0x1234567890123456789012345678901234567890',
              chain_id: '0x1',
              success: true,
            },
          },
        },
      });
    });

    it('should track failed smart account upgrade', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackSmartAccountUpgraded({
        origin: 'https://example.com',
        accountAddress: '0x1234567890123456789012345678901234567890',
        chainId: '0x89',
        success: false,
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Smart Account Upgraded',
            properties: {
              message: 'Smart account upgrade failed',
              origin: 'https://example.com',
              account_address: '0x1234567890123456789012345678901234567890',
              chain_id: '0x89',
              success: false,
            },
          },
        },
      });
    });
  });

  describe('trackDelegationSigning', () => {
    it('should track successful delegation signing', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackDelegationSigning({
        origin: 'https://example.com',
        permissionType: 'native-token-periodic',
        success: true,
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Delegation Signing',
            properties: {
              message: 'Delegation signed successfully',
              origin: 'https://example.com',
              permission_type: 'native-token-periodic',
              success: true,
            },
          },
        },
      });
    });

    it('should track failed delegation signing with error message', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackDelegationSigning({
        origin: 'https://example.com',
        permissionType: 'erc20-token-stream',
        success: false,
        errorMessage: 'User denied transaction signature',
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Delegation Signing',
            properties: {
              message: 'Delegation signing failed',
              origin: 'https://example.com',
              permission_type: 'erc20-token-stream',
              success: false,
              error_message: 'User denied transaction signature',
            },
          },
        },
      });
    });
  });

  describe('trackProfileSync', () => {
    it('should track successful store operation', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackProfileSync({
        operation: 'store',
        success: true,
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Profile Sync',
            properties: {
              message: 'Profile sync store successful',
              operation: 'store',
              success: true,
            },
          },
        },
      });
    });

    it('should track successful retrieve operation', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackProfileSync({
        operation: 'retrieve',
        success: true,
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Profile Sync',
            properties: {
              message: 'Profile sync retrieve successful',
              operation: 'retrieve',
              success: true,
            },
          },
        },
      });
    });

    it('should track successful batch_store operation', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackProfileSync({
        operation: 'batch_store',
        success: true,
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Profile Sync',
            properties: {
              message: 'Profile sync batch_store successful',
              operation: 'batch_store',
              success: true,
            },
          },
        },
      });
    });

    it('should track failed profile sync with error message', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackProfileSync({
        operation: 'store',
        success: false,
        errorMessage: 'Network timeout',
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Profile Sync',
            properties: {
              message: 'Profile sync store failed',
              operation: 'store',
              success: false,
              error_message: 'Network timeout',
            },
          },
        },
      });
    });
  });

  describe('concurrent tracking', () => {
    it('should handle multiple concurrent tracking calls', async () => {
      mockSnap.request.mockResolvedValue(null);

      await Promise.all([
        snapsMetricsService.trackPermissionRequestStarted({
          origin: 'https://example1.com',
          permissionType: 'native-token-stream',
          chainId: '0x1',
          permissionData: {},
        }),
        snapsMetricsService.trackPermissionDialogShown({
          origin: 'https://example2.com',
          permissionType: 'erc20-token-periodic',
          chainId: '0x1',
          permissionData: {},
        }),
        snapsMetricsService.trackPermissionGranted({
          origin: 'https://example3.com',
          permissionType: 'native-token-periodic',
          chainId: '0x1',
          permissionData: {},
          isAdjustmentAllowed: false,
        }),
      ]);

      expect(mockSnap.request).toHaveBeenCalledTimes(3);
    });
  });

  describe('permission value formatting', () => {
    it('should format empty permission value', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackPermissionRequestStarted({
        origin: 'https://example.com',
        permissionType: 'native-token-stream',
        chainId: '0x1',
        permissionData: {},
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Permission Request Started',
            properties: {
              message: 'User initiated permission request',
              origin: 'https://example.com',
              permission_type: 'native-token-stream',
              chain_id: '0x1',
            },
          },
        },
      });
    });

    it('should only include provided permission value fields', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      await snapsMetricsService.trackPermissionRequestStarted({
        origin: 'https://example.com',
        permissionType: 'erc20-token-periodic',
        chainId: '0x1',
        permissionData: {
          periodDuration: 3600,
          periodAmount: '0xf4240',
        },
      });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Permission Request Started',
            properties: {
              message: 'User initiated permission request',
              origin: 'https://example.com',
              permission_type: 'erc20-token-periodic',
              chain_id: '0x1',
              period_duration: 3600,
              period_amount: '0xf4240',
            },
          },
        },
      });
    });
  });
});
