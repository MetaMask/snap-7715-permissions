/* eslint-disable @typescript-eslint/naming-convention */
import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Json, SnapsProvider } from '@metamask/snaps-sdk';

/**
 * Permission type identifiers for analytics tracking.
 */
export type PermissionType =
  | 'native-token-stream'
  | 'native-token-periodic'
  | 'erc20-token-stream'
  | 'erc20-token-periodic';

/**
 * Permission value details for analytics.
 */
export type PermissionValue = {
  /** The period in seconds (for periodic permissions) */
  period?: number;
  /** The amount in the token's base unit */
  amount?: string;
  /** The token address (0x0 for native tokens) */
  token?: string;
  /** The chain ID */
  chainId?: string;
  /** Duration/expiry in seconds */
  duration?: number;
};

/**
 * Service for tracking Snaps metrics events in the snap.
 * Uses the snap_trackEvent API to send events to MetaMask.
 */
export class SnapsMetricsService {
  readonly #snap: SnapsProvider;

  constructor(snap: SnapsProvider) {
    this.#snap = snap;
  }

  /**
   * Track a generic event with custom properties.
   * @param event - The event name.
   * @param properties - Additional properties to include with the event.
   */
  async #trackEvent(
    event: string,
    properties: Record<string, Json>,
  ): Promise<void> {
    try {
      logger.info(`SnapsMetricsService: Tracking event ${event}`, properties);
      await this.#snap.request({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: `${event}`,
            properties,
          },
        },
      });
    } catch (error) {
      logger.error(`SnapsMetricsService: Failed to track event ${event}`, {
        error,
        event,
        properties,
      });
    }
  }

  /**
   * Track when a permission request is initiated.
   * @param origin - The origin of the request.
   * @param permissionType - The type of permission being requested.
   * @param permissionValue - The permission value details.
   */
  async trackPermissionRequestStarted(
    origin: string,
    permissionType: PermissionType,
    permissionValue?: PermissionValue,
  ): Promise<void> {
    await this.#trackEvent('Permission Request Started', {
      message: 'User initiated permission request',
      origin,
      permission_type: permissionType,
      ...this.#formatPermissionValue(permissionValue),
    });
  }

  /**
   * Track when a permission dialog is displayed to the user.
   * @param origin - The origin of the request.
   * @param permissionType - The type of permission being requested.
   * @param permissionValue - The permission value details.
   */
  async trackPermissionDialogShown(
    origin: string,
    permissionType: PermissionType,
    permissionValue?: PermissionValue,
  ): Promise<void> {
    await this.#trackEvent('Permission Dialog Shown', {
      message: 'Permission confirmation dialog displayed',
      origin,
      permission_type: permissionType,
      ...this.#formatPermissionValue(permissionValue),
    });
  }

  /**
   * Track when a user rejects a permission request.
   * @param origin - The origin of the request.
   * @param permissionType - The type of permission being requested.
   * @param permissionValue - The permission value details.
   */
  async trackPermissionRejected(
    origin: string,
    permissionType: PermissionType,
    permissionValue?: PermissionValue,
  ): Promise<void> {
    await this.#trackEvent('Permission Rejected', {
      message: 'User rejected permission request',
      origin,
      permission_type: permissionType,
      ...this.#formatPermissionValue(permissionValue),
    });
  }

  /**
   * Track when a permission is successfully granted.
   * @param origin - The origin of the request.
   * @param permissionType - The type of permission being requested.
   * @param permissionValue - The permission value details.
   * @param isAdjustmentAllowed - Whether the permission adjustment was allowed.
   */
  async trackPermissionGranted(
    origin: string,
    permissionType: PermissionType,
    permissionValue: PermissionValue,
    isAdjustmentAllowed: boolean,
  ): Promise<void> {
    await this.#trackEvent('Permission Granted', {
      message: 'Permission successfully granted',
      origin,
      permission_type: permissionType,
      is_adjustment_allowed: isAdjustmentAllowed,
      ...this.#formatPermissionValue(permissionValue),
    });
  }

  /**
   * Track when a smart account is upgraded (7702 account).
   * @param origin - The origin of the request.
   * @param accountAddress - The account address that was upgraded.
   * @param chainId - The chain ID where the upgrade occurred.
   * @param success - Whether the upgrade was successful.
   */
  async trackSmartAccountUpgraded(
    origin: string,
    accountAddress: string,
    chainId: string,
    success: boolean,
  ): Promise<void> {
    await this.#trackEvent('Smart Account Upgraded', {
      message: success
        ? 'Smart account successfully upgraded'
        : 'Smart account upgrade failed',
      origin,
      account_address: accountAddress,
      chain_id: chainId,
      success,
    });
  }

  /**
   * Track delegation signing events.
   * @param origin - The origin of the request.
   * @param permissionType - The type of permission.
   * @param success - Whether the signing was successful.
   * @param errorMessage - Optional error message if signing failed.
   */
  async trackDelegationSigning(
    origin: string,
    permissionType: PermissionType,
    success: boolean,
    errorMessage?: string,
  ): Promise<void> {
    await this.#trackEvent('Delegation Signing', {
      message: success
        ? 'Delegation signed successfully'
        : 'Delegation signing failed',
      origin,
      permission_type: permissionType,
      success,
      ...(errorMessage ? { error_message: errorMessage } : {}),
    });
  }

  /**
   * Track profile sync operations.
   * @param operation - The type of operation (store, retrieve, etc.).
   * @param success - Whether the operation was successful.
   * @param errorMessage - Optional error message if operation failed.
   */
  async trackProfileSync(
    operation: 'store' | 'retrieve' | 'batch_store',
    success: boolean,
    errorMessage?: string,
  ): Promise<void> {
    await this.#trackEvent('Profile Sync', {
      message: success
        ? `Profile sync ${operation} successful`
        : `Profile sync ${operation} failed`,
      operation,
      success,
      ...(errorMessage ? { error_message: errorMessage } : {}),
    });
  }

  /**
   * Format permission value for analytics.
   * @param permissionValue - The permission value to format.
   * @returns Formatted properties for tracking.
   */
  #formatPermissionValue(
    permissionValue?: PermissionValue,
  ): Record<string, Json> {
    if (!permissionValue) {
      return {};
    }

    const formatted: Record<string, Json> = {};

    if (permissionValue.period !== undefined) {
      formatted.period_seconds = permissionValue.period;
    }

    if (permissionValue.amount !== undefined) {
      formatted.amount = permissionValue.amount;
    }

    if (permissionValue.token !== undefined) {
      formatted.token = permissionValue.token;
    }

    if (permissionValue.chainId !== undefined) {
      formatted.chain_id = permissionValue.chainId;
    }

    if (permissionValue.duration !== undefined) {
      formatted.duration_seconds = permissionValue.duration;
    }

    return formatted;
  }
}
