import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import { hexToNumber } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type { FormattedPermissionForDisplay } from './types';
import { DEFAULT_MAX_AMOUNT } from '../../permissions/erc20TokenStream/context';
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
 * Formats a token amount value using token metadata (decimals and symbol).
 * @param amount - The amount in hex format.
 * @param decimals - The token decimals.
 * @param symbol - The token symbol.
 * @returns The formatted amount with symbol, or 'Unlimited' if amount is null/undefined.
 */
function formatTokenAmountWithMetadata(
  amount: Hex | undefined | null,
  decimals: number,
  symbol: string,
): string {
  if (amount === undefined || amount === null) {
    return t('unlimited');
  }

  const formattedAmount = formatUnitsFromHex({
    value: amount,
    allowNull: false,
    decimals,
  });

  return `${formattedAmount} ${symbol}`;
}

/**
 * Extracts permission details into a display-friendly format.
 * Converts a permission (response or display-formatted) into a key-value object for UI rendering.
 * Note: Token amounts (periodAmount, maxAmount) should be pre-formatted with metadata by formatPermissionWithTokenMetadata.
 *
 * @param permission - The permission to extract details from (should be pre-formatted with token metadata).
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
    // For periodic-type permissions
    else if (
      permissionType === 'erc20-token-periodic' ||
      permissionType === 'native-token-periodic'
    ) {
      const { periodAmount, periodDuration, justification } = permissionData;

      if (periodAmount !== undefined && periodAmount !== null) {
        // periodAmount is already formatted with token metadata by formatPermissionWithTokenMetadata
        // eslint-disable-next-line @typescript-eslint/no-base-to-string -- display value from permission data
        details[t('amountLabel')] = String(periodAmount);
      }

      if (periodDuration !== undefined && periodDuration !== null) {
        const timePeriod = getClosestTimePeriod(Number(periodDuration));
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
    else if (
      permissionType === 'erc20-token-stream' ||
      permissionType === 'native-token-stream'
    ) {
      const { maxAmount, startTime, justification } = permissionData;

      if (maxAmount !== undefined && maxAmount !== null) {
        // maxAmount is already formatted with token metadata by formatPermissionWithTokenMetadata
        // eslint-disable-next-line @typescript-eslint/no-base-to-string -- display value from permission data
        details[t('maxAmountLabel')] = String(maxAmount);
      }

      if (startTime !== undefined && startTime !== null) {
        const date = new Date(Number(startTime) * 1000);
        details[t('startTimeLabel')] = date.toLocaleString(undefined, {
          timeZone: 'UTC',
        });
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
): Record<Hex, PermissionDetail[]> {
  const result: Record<Hex, PermissionDetail[]> = {};

  for (const permission of permissions) {
    const { from, chainId } = permission;

    // Skip permissions without required fields
    if (!from || !chainId) {
      continue;
    }

    // Initialize array if key doesn't exist
    result[from] ??= [];

    // Extract and add permission details
    result[from].push(extractPermissionDetails(permission));
  }

  return result;
}

/**
 * Formats a permission with token metadata for display.
 * Fetches token metadata (including for native tokens when assetAddress is undefined)
 * and replaces token amount fields (periodAmount, maxAmount in Hex) with human-readable strings (e.g. "1.5 ETH").
 * The result is for UI display only; do not use it where raw Hex is expected.
 *
 * @param permission - The permission response to format.
 * @param tokenMetadataService - Service for fetching token metadata.
 * @returns The permission with display-formatted token amounts; typed as FormattedPermissionForDisplay to prevent misuse.
 */
export async function formatPermissionWithTokenMetadata(
  permission: PermissionResponse,
  tokenMetadataService: TokenMetadataService,
): Promise<FormattedPermissionForDisplay> {
  const permissionData = permission.permission.data as Record<string, unknown>;

  if (!permissionData || typeof permissionData !== 'object') {
    return permission;
  }

  // Check if this permission has token amount fields that need formatting
  const hasTokenAmountFields =
    'maxAmount' in permissionData || 'periodAmount' in permissionData;

  if (!hasTokenAmountFields) {
    return permission;
  }

  // Extract token address for metadata lookup
  const tokenAddress = permissionData.tokenAddress as string | undefined;

  try {
    const chainId = hexToNumber(permission.chainId);
    const options: Parameters<typeof tokenMetadataService.getTokenMetadata>[0] =
      {
        chainId,
        account: permission.from as `0x${string}`,
      };

    if (tokenAddress && typeof tokenAddress === 'string') {
      options.assetAddress = tokenAddress as `0x${string}`;
    }

    const { decimals, symbol } =
      await tokenMetadataService.getTokenMetadata(options);

    // Format all token amount fields with token metadata
    const formattedData = { ...permissionData };

    // Format maxAmount if present (stream-type permissions)
    if ('maxAmount' in permissionData) {
      if (
        (permissionData.maxAmount as string).toLowerCase() ===
        DEFAULT_MAX_AMOUNT
      ) {
        formattedData.maxAmount = t('unlimited');
      } else {
        formattedData.maxAmount = formatTokenAmountWithMetadata(
          permissionData.maxAmount as Hex | null | undefined,
          decimals,
          symbol,
        );
      }
    }

    // Format periodAmount if present (periodic-type permissions)
    if ('periodAmount' in permissionData) {
      formattedData.periodAmount = formatTokenAmountWithMetadata(
        permissionData.periodAmount as Hex | null | undefined,
        decimals,
        symbol,
      );
    }

    // Return permission with formatted token amounts
    return {
      ...permission,
      permission: {
        ...permission.permission,
        data: formattedData,
      },
    };
  } catch {
    // If token metadata fetch fails, return original permission
    return permission;
  }
}
