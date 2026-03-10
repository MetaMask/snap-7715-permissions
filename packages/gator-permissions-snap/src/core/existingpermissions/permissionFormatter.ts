import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import { hexToNumber } from '@metamask/utils';

import { t } from '../../utils/i18n';
import { shortenAddress } from '../../utils/string';
import { nameAndExplorerUrlByChainId } from '../chainMetadata';

/**
 * Represents formatted permission details as an object.
 */
export type PermissionDetail = {
  [key: string]: string;
};

/**
 * Formats permission response into human-readable details.
 *
 * @param permission - The permission response to format.
 * @returns Object of formatted permission details.
 */
export function formatPermissionDetails(
  permission: PermissionResponse,
): PermissionDetail {
  const details: PermissionDetail = {};

  // Extract permission type
  const permissionType = extractDescriptorName(permission.permission.type);
  details[t('permissionTypeLabel')] = permissionType;

  // Extract chain information
  const chainMetadata =
    nameAndExplorerUrlByChainId[hexToNumber(permission.chainId)];
  if (chainMetadata) {
    details[t('chainLabel')] = chainMetadata.name;
  } else {
    // If chain metadata is not available, show the chain ID
    details[t('chainLabel')] = permission.chainId;
  }

  // Extract delegate address
  if (permission.to) {
    details[t('delegateAddressLabel')] = shortenAddress(permission.to);
  }

  // Extract permission details based on permission type
  const permissionData = permission.permission.data as Record<string, unknown>;
  if (permissionData && typeof permissionData === 'object') {
    // For subscription-type permissions
    if ('interval' in permissionData && 'maxAmount' in permissionData) {
      const { maxAmount, interval } = permissionData;

      if (maxAmount !== undefined) {
        details[t('maxAmountLabel')] = String(maxAmount);
      }

      if (interval !== undefined) {
        details[t('intervalLabel')] = String(interval);
      }
    }

    // For stream-type permissions
    if ('maxAmount' in permissionData && 'startTime' in permissionData) {
      const { maxAmount, startTime } = permissionData;

      if (maxAmount !== undefined) {
        details[t('maxAmountLabel')] = String(maxAmount);
      }

      if (startTime !== undefined) {
        details[t('startTimeLabel')] = formatTimestamp(Number(startTime));
      }
    }
  }

  return details;
}

/**
 * Formats a Unix timestamp for display.
 *
 * @param timestamp - The Unix timestamp to format.
 * @returns Formatted date string.
 */
function formatTimestamp(timestamp: number): string {
  try {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  } catch {
    return String(timestamp);
  }
}
