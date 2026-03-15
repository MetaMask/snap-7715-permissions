import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import { CaipAccountId, hexToNumber, toCaipAccountId } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type { FormattedPermissionForDisplay } from './types';
import type { TokenMetadataService } from '../../services/tokenMetadataService';
import { t } from '../../utils/i18n';
import { getClosestTimePeriod } from '../../utils/time';
import { formatUnitsFromHex } from '../../utils/value';
import { nameAndExplorerUrlByChainId } from '../chainMetadata';

/**
 * Represents formatted permission details as an object.
 */
export type PermissionDetail = {
  [key: string]: string;
};

/**
 * Formats a maxAmount value using token metadata (decimals and symbol).
 * @param maxAmount - The amount in hex format.
 * @param decimals - The token decimals.
 * @param symbol - The token symbol.
 * @returns The formatted amount with symbol, or 'Unlimited' if maxAmount is null/undefined.
 */
function formatMaxAmountWithMetadata(
  maxAmount: Hex | undefined | null,
  decimals: number,
  symbol: string,
): string {
  if (maxAmount === undefined || maxAmount === null) {
    return t('unlimited');
  }

  const formattedAmount = formatUnitsFromHex({
    value: maxAmount,
    allowNull: false,
    decimals,
  });

  return `${formattedAmount} ${symbol}`;
}

/**
 * Extracts permission details into a display-friendly format.
 * Converts a permission (response or display-formatted) into a key-value object for UI rendering.
 *
 * @param permission - The permission to extract details from (raw or formatted for display).
 * @returns Object of permission details for display.
 */
function extractPermissionDetails(
  permission: FormattedPermissionForDisplay,
): PermissionDetail {
  const details: PermissionDetail = {};

  const permissionType = extractDescriptorName(permission.permission.type);

  // Extract chain information
  const chainMetadata =
    nameAndExplorerUrlByChainId[hexToNumber(permission.chainId)];
  if (chainMetadata) {
    details[t('chainLabel')] = chainMetadata.name;
  } else {
    details[t('chainLabel')] = permission.chainId;
  }

  // Extract permission details based on permission type
  const permissionData = permission.permission.data;
  if (permissionData && typeof permissionData === 'object') {
    // For revocation-type permissions
    if (permissionType === 'erc20-token-revocation') {
      details[t('revokeTokenApprovalsLabel')] = t('allTokens');

      // Add justification if available
      if ('justification' in permissionData) {
        const { justification } = permissionData;
        if (justification !== undefined && justification !== null) {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string -- display value from permission data
          details[t('justificationLabel')] = String(justification);
        }
      }
    }
    // For subscription-type permissions
    else if ('interval' in permissionData && 'maxAmount' in permissionData) {
      const { maxAmount, interval, justification } = permissionData;

      if (maxAmount !== undefined && maxAmount !== null) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string -- display value from permission data
        details[t('maxAmountLabel')] = String(maxAmount);
      }

      if (interval !== undefined && interval !== null) {
        const timePeriod = getClosestTimePeriod(Number(interval));
        details[t('periodDurationLabel')] = t(
          timePeriod.toLowerCase() as
            | 'hourly'
            | 'daily'
            | 'weekly'
            | 'biweekly'
            | 'monthly'
            | 'yearly',
        );
      }

      if (justification !== undefined && justification !== null) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string -- display value from permission data
        details[t('justificationLabel')] = String(justification);
      }
    }
    // For stream-type permissions
    else if ('maxAmount' in permissionData && 'startTime' in permissionData) {
      const { maxAmount, startTime, justification } = permissionData;

      if (maxAmount !== undefined && maxAmount !== null) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string -- display value from permission data
        details[t('maxAmountLabel')] = String(maxAmount);
      }

      if (startTime !== undefined && startTime !== null) {
        const date = new Date(Number(startTime) * 1000);
        details[t('startTimeLabel')] = date.toLocaleString();
      }

      if (justification !== undefined && justification !== null) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string -- display value from permission data
        details[t('justificationLabel')] = String(justification);
      }
    }
  }

  return details;
}

/**
 * Converts existingPermissions array to an object keyed by CAIP-10 from address.
 * Groups already-formatted permissions by account address.
 *
 * @param permissions - The display-formatted permissions to group.
 * @returns Object with CAIP-10 addresses as keys and arrays of permission details as values.
 */
export function groupPermissionsByFromAddress(
  permissions: FormattedPermissionForDisplay[],
): Record<CaipAccountId, PermissionDetail[]> {
  const result: Record<CaipAccountId, PermissionDetail[]> = {};

  for (const permission of permissions) {
    const { from, chainId } = permission;

    // Skip permissions without required fields
    if (!from || !chainId) {
      continue;
    }

    // Convert to CAIP-10 format (eip155 expects decimal chain id, not hex)
    const caip10Address = toCaipAccountId(
      'eip155',
      hexToNumber(chainId).toString(),
      from,
    );

    // Initialize array if key doesn't exist
    result[caip10Address] ??= [];

    // Extract and add permission details
    result[caip10Address].push(extractPermissionDetails(permission));
  }

  return result;
}

/**
 * Formats a permission with token metadata for display.
 * Fetches token metadata (including for native tokens when assetAddress is undefined)
 * and replaces maxAmount (Hex) with a human-readable string (e.g. "1.5 ETH").
 * The result is for UI display only; do not use it where raw Hex is expected.
 *
 * @param permission - The permission response to format.
 * @param tokenMetadataService - Service for fetching token metadata.
 * @returns The permission with display-formatted maxAmount; typed as FormattedPermissionForDisplay to prevent misuse.
 */
export async function formatPermissionWithTokenMetadata(
  permission: PermissionResponse,
  tokenMetadataService: TokenMetadataService,
): Promise<FormattedPermissionForDisplay> {
  const permissionData = permission.permission.data as Record<string, unknown>;

  if (!permissionData || typeof permissionData !== 'object') {
    return permission;
  }

  // Check if this permission has a maxAmount field
  if (
    'maxAmount' in permissionData &&
    ('interval' in permissionData || 'startTime' in permissionData)
  ) {
    const { maxAmount, tokenAddress } = permissionData;

    try {
      const chainId = hexToNumber(permission.chainId);
      const options: Parameters<
        typeof tokenMetadataService.getTokenBalanceAndMetadata
      >[0] = {
        chainId,
        account: permission.from as `0x${string}`,
      };

      if (tokenAddress && typeof tokenAddress === 'string') {
        options.assetAddress = tokenAddress as `0x${string}`;
      }

      const { decimals, symbol } =
        await tokenMetadataService.getTokenBalanceAndMetadata(options);

      // Format the maxAmount with decimals and symbol
      const formattedMaxAmount = formatMaxAmountWithMetadata(
        maxAmount as Hex | null | undefined,
        decimals,
        symbol,
      );

      // Return permission with formatted maxAmount
      return {
        ...permission,
        permission: {
          ...permission.permission,
          data: {
            ...permissionData,
            maxAmount: formattedMaxAmount,
          },
        },
      };
    } catch {
      // If token metadata fetch fails, return original permission
      return permission;
    }
  }

  return permission;
}
