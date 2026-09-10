import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
import {
  extractDescriptorName,
  logger,
} from '@metamask/7715-permissions-shared/utils';
import { hexToNumber } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import { DEFAULT_MAX_AMOUNT } from '../../permissions/erc20TokenStream/context';
import { formatSelectorForDisplay } from '../../permissions/erc20TokenSwap/selectors';
import { TOKEN_APPROVAL_REVOCATION_PRIMITIVES } from '../../permissions/tokenApprovalRevocation/types';
import type { TokenMetadataService } from '../../services/tokenMetadataService';
import { t } from '../../utils/i18n';
import { shortenAddress } from '../../utils/string';
import { getClosestTimePeriod } from '../../utils/time';
import { formatUnitsFromHex } from '../../utils/value';
import { nameAndExplorerUrlByChainId } from '../chainMetadata';

/**
 * Represents formatted permission details as an object.
 */
export type PermissionDetail = {
  [key: string]: {
    label: string;
    value: string;
  };
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
 * Extracts display details for an ERC-20 token swap permission.
 * Note: Token amounts (spend.maxAmount, receive.minAmount) should be pre-formatted with metadata by formatPermissionWithTokenMetadata.
 *
 * @param permissionData - The permission data of an erc20-token-swap permission.
 * @returns Object of swap details with label and value for each field.
 */
function extractErc20TokenSwapDetails(
  permissionData: Record<string, unknown>,
): PermissionDetail {
  const details: PermissionDetail = {};

  const spend = permissionData.spend as { maxAmount?: unknown } | undefined;
  const receive = permissionData.receive as { minAmount?: unknown } | undefined;
  const via = permissionData.via as
    | { targets?: unknown; selectors?: unknown }
    | undefined;

  if (typeof spend?.maxAmount === 'string') {
    details.maxSpendAmount = {
      label: t('maxSpendAmountLabel'),
      value: spend.maxAmount,
    };
  }

  if (typeof receive?.minAmount === 'string') {
    details.minReceiveAmount = {
      label: t('minReceiveAmountLabel'),
      value: receive.minAmount,
    };
  }

  if (Array.isArray(via?.targets) && via.targets.length > 0) {
    details.allowedContracts = {
      label: t('allowedContractsLabel'),
      value: via.targets
        .map((target) => shortenAddress(String(target)))
        .join(', '),
    };
  }

  if (Array.isArray(via?.selectors) && via.selectors.length > 0) {
    details.allowedFunctions = {
      label: t('allowedFunctionsLabel'),
      value: via.selectors
        .map((selector) => formatSelectorForDisplay(String(selector)))
        .join(', '),
    };
  }

  return details;
}

/**
 * Extracts permission details into a display-friendly format.
 * Converts a permission (response or display-formatted) into a structured object with translated labels and formatted values.
 * Note: Token amounts (periodAmount, maxAmount) should be pre-formatted with metadata by formatPermissionWithTokenMetadata.
 *
 * @param permission - The permission to extract details from (should be pre-formatted with token metadata).
 * @returns Object of permission details with label, value, and key for each field.
 */
function extractPermissionDetails(
  permission: PermissionResponse,
): PermissionDetail {
  const details: PermissionDetail = {};

  const permissionType = extractDescriptorName(permission.permission.type);

  // Extract chain information
  const chainMetadata =
    nameAndExplorerUrlByChainId[hexToNumber(permission.chainId)];
  const chainLabel = t('chainLabel');
  const chainValue = chainMetadata ? chainMetadata.name : permission.chainId;
  details.chainId = {
    label: chainLabel,
    value: chainValue,
  };

  // Extract permission details based on permission type
  const permissionData = permission.permission.data;

  if (permissionData && typeof permissionData === 'object') {
    if ('justification' in permissionData) {
      const { justification } = permissionData;
      if (typeof justification === 'string') {
        details.justification = {
          label: t('justificationLabel'),
          value: justification,
        };
      }
    }

    // For revocation-type permissions
    if (permissionType === 'token-approval-revocation') {
      const revokeLabel = t('revokeTokenApprovalsLabel');
      const revocationPrimitives = TOKEN_APPROVAL_REVOCATION_PRIMITIVES.filter(
        ({ key }) => permissionData[key] === true,
      ).map(({ labelKey }) => t(labelKey));
      if (revocationPrimitives.length > 0) {
        const revokeValue =
          revocationPrimitives.length ===
          TOKEN_APPROVAL_REVOCATION_PRIMITIVES.length
            ? t('allApprovalRevocationPrimitivesLabel')
            : revocationPrimitives.join(', ');
        details.tokenApprovals = {
          label: revokeLabel,
          value: revokeValue,
        };
      }
    }
    // For ERC-20 token swap permissions
    else if (permissionType === 'erc20-token-swap') {
      Object.assign(details, extractErc20TokenSwapDetails(permissionData));
    }
    // For periodic-type permissions
    else if (
      permissionType === 'erc20-token-periodic' ||
      permissionType === 'native-token-periodic'
    ) {
      const { periodAmount, periodDuration } = permissionData;

      if (periodAmount !== undefined && periodAmount !== null) {
        const amountLabel = t('amountLabel');
        // periodAmount is already formatted with token metadata by formatPermissionWithTokenMetadata
        details.periodAmount = {
          label: amountLabel,
          value: String(periodAmount),
        };
      }

      if (periodDuration !== undefined && periodDuration !== null) {
        const timePeriod = getClosestTimePeriod(Number(periodDuration));
        const durationLabel = t('periodDurationLabel');
        const durationValue = t(
          timePeriod.toLowerCase() as
            | 'hourly'
            | 'daily'
            | 'weekly'
            | 'biweekly'
            | 'monthly'
            | 'yearly',
        );
        details.periodDuration = {
          label: durationLabel,
          value: durationValue,
        };
      }
    } else if (
      permissionType === 'erc20-token-allowance' ||
      permissionType === 'native-token-allowance'
    ) {
      const { allowanceAmount, startTime } = permissionData;

      if (allowanceAmount !== undefined && allowanceAmount !== null) {
        const amountLabel = t('amountLabel');
        details.allowanceAmount = {
          label: amountLabel,
          value: String(allowanceAmount),
        };
      }

      if (startTime !== undefined && startTime !== null) {
        const startTimeLabel = t('startTimeLabel');
        const date = new Date(Number(startTime) * 1000);
        const startTimeValue = date.toLocaleString(undefined, {
          timeZone: 'UTC',
        });
        details.startTime = {
          label: startTimeLabel,
          value: startTimeValue,
        };
      }
    }
    // For stream-type permissions
    else if (
      permissionType === 'erc20-token-stream' ||
      permissionType === 'native-token-stream'
    ) {
      const { maxAmount, startTime } = permissionData;

      if (maxAmount !== undefined && maxAmount !== null) {
        const maxAmountLabel = t('maxAmountLabel');
        // maxAmount is already formatted with token metadata by formatPermissionWithTokenMetadata
        details.maxAmount = {
          label: maxAmountLabel,
          value: String(maxAmount),
        };
      }

      if (startTime !== undefined && startTime !== null) {
        const startTimeLabel = t('startTimeLabel');
        const date = new Date(Number(startTime) * 1000);
        const startTimeValue = date.toLocaleString(undefined, {
          timeZone: 'UTC',
        });
        details.startTime = {
          label: startTimeLabel,
          value: startTimeValue,
        };
      }
    }
  }

  return details;
}

/**
 * Converts permissions to an object keyed by CAIP-10 `from` address.
 * Callers should pass responses that have been through {@link formatPermissionWithTokenMetadata}
 * when token amounts should appear human-readable in the UI.
 *
 * @param permissions - Permission responses to group (entries without `from`/`chainId` are skipped).
 * @returns Object with CAIP-10 addresses as keys and arrays of permission details as values.
 */
export function groupPermissionsByFromAddress(
  permissions: PermissionResponse[],
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
 * @returns The same permission shape with display-formatted token amounts in `data`; still typed as
 *   `PermissionResponse`, so treat `data` as UI-only after this call (not raw hex for on-chain math).
 */
export async function formatPermissionWithTokenMetadata(
  permission: PermissionResponse,
  tokenMetadataService: TokenMetadataService,
): Promise<PermissionResponse> {
  const permissionData = permission.permission.data as Record<string, unknown>;

  if (!permissionData || typeof permissionData !== 'object') {
    return permission;
  }

  if (
    extractDescriptorName(permission.permission.type) === 'erc20-token-swap'
  ) {
    return formatErc20TokenSwapPermissionWithTokenMetadata(
      permission,
      tokenMetadataService,
    );
  }

  // Check if this permission has token amount fields that need formatting
  const hasTokenAmountFields =
    'maxAmount' in permissionData ||
    'periodAmount' in permissionData ||
    'allowanceAmount' in permissionData;

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
      const { maxAmount } = permissionData;
      if (
        maxAmount !== undefined &&
        maxAmount !== null &&
        typeof maxAmount === 'string' &&
        maxAmount.toLowerCase() === DEFAULT_MAX_AMOUNT
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

    if ('allowanceAmount' in permissionData) {
      formattedData.allowanceAmount = formatTokenAmountWithMetadata(
        permissionData.allowanceAmount as Hex | null | undefined,
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
  } catch (error) {
    logger.debug(
      'formatPermissionWithTokenMetadata: token metadata fetch failed, using raw permission data',
      {
        chainId: permission.chainId,
        error: error instanceof Error ? error.message : error,
      },
    );
    return permission;
  }
}

/**
 * Formats an ERC-20 token swap permission with metadata for both tokens.
 * Replaces spend.maxAmount and receive.minAmount (Hex) with human-readable strings.
 *
 * @param permission - The erc20-token-swap permission response to format.
 * @param tokenMetadataService - Service for fetching token metadata.
 * @returns The same permission shape with display-formatted token amounts in `data`.
 */
async function formatErc20TokenSwapPermissionWithTokenMetadata(
  permission: PermissionResponse,
  tokenMetadataService: TokenMetadataService,
): Promise<PermissionResponse> {
  const permissionData = permission.permission.data as Record<string, unknown>;
  const spend = permissionData.spend as
    | { tokenAddress?: Hex; maxAmount?: Hex }
    | undefined;
  const receive = permissionData.receive as
    | { tokenAddress?: Hex; minAmount?: Hex }
    | undefined;

  if (!spend?.tokenAddress || !receive?.tokenAddress) {
    return permission;
  }

  try {
    const chainId = hexToNumber(permission.chainId);
    const account = permission.from as `0x${string}`;

    const [spendMetadata, receiveMetadata] = await Promise.all([
      tokenMetadataService.getTokenMetadata({
        chainId,
        account,
        assetAddress: spend.tokenAddress,
      }),
      tokenMetadataService.getTokenMetadata({
        chainId,
        account,
        assetAddress: receive.tokenAddress,
      }),
    ]);

    return {
      ...permission,
      permission: {
        ...permission.permission,
        data: {
          ...permissionData,
          spend: {
            ...spend,
            maxAmount: formatTokenAmountWithMetadata(
              spend.maxAmount,
              spendMetadata.decimals,
              spendMetadata.symbol,
            ),
          },
          receive: {
            ...receive,
            minAmount: formatTokenAmountWithMetadata(
              receive.minAmount,
              receiveMetadata.decimals,
              receiveMetadata.symbol,
            ),
          },
        },
      },
    };
  } catch (error) {
    logger.debug(
      'formatErc20TokenSwapPermissionWithTokenMetadata: token metadata fetch failed, using raw permission data',
      {
        chainId: permission.chainId,
        error: error instanceof Error ? error.message : error,
      },
    );
    return permission;
  }
}
