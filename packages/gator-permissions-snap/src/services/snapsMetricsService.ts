import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Json, SnapsProvider } from '@metamask/snaps-sdk';
import type { Hex } from '@metamask/utils';

/**
 * Base parameters shared by all permission tracking methods.
 */
export type BasePermissionTrackingParams = {
  /** The origin of the request */
  origin: string;
  /** The type of permission */
  permissionType: string;
};

/**
 * Parameters for tracking permission request started.
 */
export type TrackPermissionRequestStartedParams =
  BasePermissionTrackingParams & {
    /** Chain ID */
    chainId: Hex;
    /** Permission data */
    permissionData: Record<string, unknown>;
  };

/**
 * Parameters for tracking permission dialog shown.
 */
export type TrackPermissionDialogShownParams = BasePermissionTrackingParams & {
  /** Chain ID */
  chainId: Hex;
  /** Permission data */
  permissionData: Record<string, unknown>;
  /** Optional justification text */
  justification?: string;
};

/**
 * Parameters for tracking permission rejected.
 */
export type TrackPermissionRejectedParams = BasePermissionTrackingParams & {
  /** Chain ID */
  chainId: Hex;
  /** Permission data */
  permissionData: Record<string, unknown>;
  /** Optional justification text */
  justification?: string;
};

/**
 * Parameters for tracking permission granted.
 */
export type TrackPermissionGrantedParams = BasePermissionTrackingParams & {
  /** Whether the permission adjustment was allowed */
  isAdjustmentAllowed: boolean;
  /** Chain ID */
  chainId: string;
  /** Permission data */
  permissionData: Record<string, unknown>;
  /** Optional justification text */
  justification?: string;
};

/**
 * Parameters for tracking smart account upgrade.
 */
export type TrackSmartAccountUpgradedParams = {
  /** The origin of the request */
  origin: string;
  /** The account address that was upgraded */
  accountAddress: string;
  /** The chain ID where the upgrade occurred */
  chainId: string;
  /** Whether the upgrade was successful */
  success: boolean;
};

/**
 * Parameters for tracking delegation signing.
 */
export type TrackDelegationSigningParams = BasePermissionTrackingParams & {
  /** Whether the signing was successful */
  success: boolean;
  /** Optional error message if signing failed */
  errorMessage?: string;
};

/**
 * Parameters for tracking profile sync operations.
 */
export type TrackProfileSyncParams = {
  /** The type of operation (store, retrieve, etc.) */
  operation: 'store' | 'retrieve' | 'batch_store';
  /** Whether the operation was successful */
  success: boolean;
  /** Optional error message if operation failed */
  errorMessage?: string;
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
      logger.debug(`SnapsMetricsService: Tracking event ${event}`, properties);
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
   * @param params - The tracking parameters.
   */
  async trackPermissionRequestStarted(
    params: TrackPermissionRequestStartedParams,
  ): Promise<void> {
    await this.#trackEvent('Permission Request Started', {
      message: 'User initiated permission request',
      origin: params.origin,
      permission_type: params.permissionType,
      ...this.#formatPermissionData({
        chainId: params.chainId,
        permissionData: params.permissionData,
      }),
    });
  }

  /**
   * Track when a permission dialog is displayed to the user.
   * @param params - The tracking parameters.
   */
  async trackPermissionDialogShown(
    params: TrackPermissionDialogShownParams,
  ): Promise<void> {
    await this.#trackEvent('Permission Dialog Shown', {
      message: 'Permission confirmation dialog displayed',
      origin: params.origin,
      permission_type: params.permissionType,
      ...this.#formatPermissionData({
        chainId: params.chainId,
        permissionData: params.permissionData,
        ...(params.justification && { justification: params.justification }),
      }),
    });
  }

  /**
   * Track when a user rejects a permission request.
   * @param params - The tracking parameters.
   */
  async trackPermissionRejected(
    params: TrackPermissionRejectedParams,
  ): Promise<void> {
    await this.#trackEvent('Permission Rejected', {
      message: 'User rejected permission request',
      origin: params.origin,
      permission_type: params.permissionType,
      ...this.#formatPermissionData({
        chainId: params.chainId,
        permissionData: params.permissionData,
        ...(params.justification && { justification: params.justification }),
      }),
    });
  }

  /**
   * Track when a permission is successfully granted.
   * @param params - The tracking parameters.
   */
  async trackPermissionGranted(
    params: TrackPermissionGrantedParams,
  ): Promise<void> {
    await this.#trackEvent('Permission Granted', {
      message: 'Permission successfully granted',
      origin: params.origin,
      permission_type: params.permissionType,
      is_adjustment_allowed: params.isAdjustmentAllowed,
      ...this.#formatPermissionData({
        chainId: params.chainId,
        permissionData: params.permissionData,
        ...(params.justification && { justification: params.justification }),
      }),
    });
  }

  /**
   * Track when a smart account is upgraded (7702 account).
   * @param params - The tracking parameters.
   */
  async trackSmartAccountUpgraded(
    params: TrackSmartAccountUpgradedParams,
  ): Promise<void> {
    await this.#trackEvent('Smart Account Upgraded', {
      message: params.success
        ? 'Smart account successfully upgraded'
        : 'Smart account upgrade failed',
      origin: params.origin,
      account_address: params.accountAddress,
      chain_id: params.chainId,
      success: params.success,
    });
  }

  /**
   * Track delegation signing events.
   * @param params - The tracking parameters.
   */
  async trackDelegationSigning(
    params: TrackDelegationSigningParams,
  ): Promise<void> {
    await this.#trackEvent('Delegation Signing', {
      message: params.success
        ? 'Delegation signed successfully'
        : 'Delegation signing failed',
      origin: params.origin,
      permission_type: params.permissionType,
      success: params.success,
      ...(params.errorMessage ? { error_message: params.errorMessage } : {}),
    });
  }

  /**
   * Track profile sync operations.
   * @param params - The tracking parameters.
   */
  async trackProfileSync(params: TrackProfileSyncParams): Promise<void> {
    await this.#trackEvent('Profile Sync', {
      message: params.success
        ? `Profile sync ${params.operation} successful`
        : `Profile sync ${params.operation} failed`,
      operation: params.operation,
      success: params.success,
      ...(params.errorMessage ? { error_message: params.errorMessage } : {}),
    });
  }

  /**
   * Formats permission data for analytics.
   * @param params - The formatting parameters.
   * @param params.chainId - The chain ID for the permission.
   * @param params.permissionData - The permission data to format.
   * @param params.justification - Optional justification text provided by the user.
   * @returns Formatted properties for tracking.
   */
  #formatPermissionData(params: {
    chainId: string;
    permissionData: Record<string, unknown>;
    justification?: string;
  }): Record<string, Json> {
    const formatted: Record<string, Json> = {
      chain_id: params.chainId,
    };

    const { permissionData } = params;

    if (permissionData.periodAmount !== undefined) {
      formatted.period_amount = permissionData.periodAmount as string;
    }
    if (permissionData.periodDuration !== undefined) {
      formatted.period_duration = permissionData.periodDuration as number;
    }
    if (permissionData.startTime !== undefined) {
      formatted.start_time = permissionData.startTime as number;
    }
    if (permissionData.tokenAddress !== undefined) {
      formatted.token_address = permissionData.tokenAddress as string;
    }
    if (permissionData.amountPerSecond !== undefined) {
      formatted.amount_per_second = permissionData.amountPerSecond as string;
    }
    if (permissionData.initialAmount !== undefined) {
      formatted.initial_amount = permissionData.initialAmount as string;
    }
    if (permissionData.maxAmount !== undefined) {
      formatted.max_amount = permissionData.maxAmount as string;
    }

    // Add justification if provided
    if (params.justification) {
      formatted.justification = params.justification;
    }

    return formatted;
  }
}
