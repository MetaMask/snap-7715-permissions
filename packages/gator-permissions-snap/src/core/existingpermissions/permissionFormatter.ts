import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import { CaipAccountId, hexToNumber, toCaipAccountId } from '@metamask/utils';

import { t } from '../../utils/i18n';
import { shortenAddress } from '../../utils/string';
import { timestampToISO8601 } from '../../utils/time';
import { nameAndExplorerUrlByChainId } from '../chainMetadata';

/**
 * Safely converts a value to string, handling various types.
 *
 * @param value - The value to convert.
 * @returns The string representation of the value.
 */
function safeToString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  return String(value);
}

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

      if (maxAmount !== undefined && maxAmount !== null) {
        details[t('maxAmountLabel')] = safeToString(maxAmount);
      }

      if (interval !== undefined && interval !== null) {
        details[t('intervalLabel')] = safeToString(interval);
      }
    }

    // For stream-type permissions
    if ('maxAmount' in permissionData && 'startTime' in permissionData) {
      const { maxAmount, startTime } = permissionData;

      if (maxAmount !== undefined && maxAmount !== null) {
        details[t('maxAmountLabel')] = safeToString(maxAmount);
      }

      if (startTime !== undefined && startTime !== null) {
        details[t('startTimeLabel')] = timestampToISO8601(Number(startTime));
      }
    }
  }

  return details;
}

/**
 * Converts existingPermissions array to an object keyed by CAIP-10 from address.
 *
 * @param permissions - The permission responses to convert.
 * @returns Object with CAIP-10 addresses as keys and arrays of permission details as values.
 */
export function groupPermissionsByFromAddress(
  permissions: PermissionResponse[],
): Record<CaipAccountId, PermissionDetail[]> {
  const result: Record<CaipAccountId, PermissionDetail[]> = {};

  for (const permission of permissions) {
    const { from, chainId } = permission;

    // Skip permissions without required fields
    if (!from || !chainId) {
      continue;
    }

    // Convert to CAIP-10 format
    const caip10Address = toCaipAccountId('eip155', chainId, from);

    // Initialize array if key doesn't exist
    result[caip10Address] ??= [];

    // Add formatted permission details
    result[caip10Address].push(formatPermissionDetails(permission));
  }

  return result;
}
