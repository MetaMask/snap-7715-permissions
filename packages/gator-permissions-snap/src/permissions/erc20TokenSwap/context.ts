import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import type { Hex } from '@metamask/delegation-core';
import { InvalidInputError } from '@metamask/snaps-sdk';
import {
  bigIntToHex,
  parseCaipAccountId,
  toCaipAccountId,
  toCaipAssetType,
} from '@metamask/utils';

import type { PermissionBuildServices } from '../../core/permission/PermissionModule';
import type { TokenMetadataService } from '../../services/tokenMetadataService';
import { parseUnits, formatUnitsFromHex } from '../../utils/value';
import { validateAndParseAmount, validateExpiry } from '../contextValidation';
import {
  applyExpiryRule,
  applyRedeemerRule,
  getRedeemerAddressesFromRules,
} from '../rules';
import type {
  Erc20TokenSwapContext,
  Erc20TokenSwapMetadata,
  Erc20TokenSwapPermission,
  Erc20TokenSwapPermissionRequest,
  PopulatedErc20TokenSwapPermission,
} from './types';

const ASSET_NAMESPACE = 'erc20';
const CHAIN_NAMESPACE = 'eip155';

/**
 * Construct an amended permission request from context edits.
 *
 * The swapped tokens are always delivered to the granting account, so both
 * `from` and `data.recipient` are derived from the account selected in the
 * confirmation. The allow-listed contracts and functions are never editable
 * and are copied from the original request.
 * @param options - The options object containing the context and original request.
 * @param options.context - Context with formatted amounts and the selected account.
 * @param options.originalRequest - Original request.
 * @returns Request with hex amounts, the resolved recipient, and merged expiry and redeemer rules.
 */
export async function applyContext({
  context,
  originalRequest,
}: {
  context: Erc20TokenSwapContext;
  originalRequest: Erc20TokenSwapPermissionRequest;
}): Promise<Erc20TokenSwapPermissionRequest> {
  const {
    permissionDetails,
    tokenMetadata: { decimals: spendDecimals },
    receiveTokenMetadata: { decimals: receiveDecimals },
  } = context;

  const expiryMerged = applyExpiryRule(context, originalRequest);
  const { rules } = applyRedeemerRule(originalRequest, expiryMerged);

  const { address } = parseCaipAccountId(context.accountAddressCaip10);
  const recipient = address as Hex;

  const { spend, receive, via, justification } =
    originalRequest.permission.data;

  return {
    ...originalRequest,
    from: recipient,
    permission: {
      type: 'erc20-token-swap',
      data: {
        justification,
        spend: {
          tokenAddress: spend.tokenAddress,
          maxAmount: bigIntToHex(
            parseUnits({
              formatted: permissionDetails.maxSpendAmount,
              decimals: spendDecimals,
            }),
          ),
        },
        receive: {
          tokenAddress: receive.tokenAddress,
          minAmount: bigIntToHex(
            parseUnits({
              formatted: permissionDetails.minReceiveAmount,
              decimals: receiveDecimals,
            }),
          ),
        },
        via: {
          targets: [...via.targets],
          selectors: [...via.selectors],
        },
        recipient,
      },
      isAdjustmentAllowed: originalRequest.permission.isAdjustmentAllowed,
    },
    rules,
  };
}

/**
 * Populate optional permission fields before signing.
 * @param options - The options object containing the permission to populate.
 * @param options.permission - Permission after applyContext.
 * @returns Permission with the recipient guaranteed to be present.
 * @throws {InvalidInputError} If the recipient was not resolved by applyContext.
 */
export async function populatePermission({
  permission,
}: {
  permission: Erc20TokenSwapPermission;
}): Promise<PopulatedErc20TokenSwapPermission> {
  const { recipient } = permission.data;

  if (!recipient) {
    throw new InvalidInputError(
      'Invalid recipient: must be resolved to the granting account before the permission is populated',
    );
  }

  return {
    ...permission,
    data: {
      ...permission.data,
      recipient,
    },
  };
}

/**
 * Fetches the metadata and icon for a single ERC-20 token.
 * @param options - The options object.
 * @param options.tokenMetadataService - Service for fetching token metadata.
 * @param options.chainId - The chain the token lives on.
 * @param options.account - The account whose balance is fetched alongside the metadata.
 * @param options.assetAddress - The token contract address.
 * @returns The token metadata in the shape used by the confirmation context.
 */
async function resolveTokenMetadata({
  tokenMetadataService,
  chainId,
  account,
  assetAddress,
}: {
  tokenMetadataService: TokenMetadataService;
  chainId: number;
  account: Hex;
  assetAddress: Hex;
}): Promise<Erc20TokenSwapContext['tokenMetadata']> {
  const { decimals, symbol, iconUrl } =
    await tokenMetadataService.getTokenBalanceAndMetadata({
      chainId,
      account,
      assetAddress,
    });

  const iconDataResponse =
    await tokenMetadataService.fetchIconDataAsBase64(iconUrl);

  return {
    decimals,
    symbol,
    iconDataBase64: iconDataResponse.ok
      ? iconDataResponse.imageDataBase64
      : null,
  };
}

/**
 * Converts a permission request into a context object that can be used to render the UI
 * and manage the permission state.
 * @param permissionRequest - The ERC-20 token swap permission request to convert.
 * @param services - Services required to build permission context.
 * @param services.tokenMetadataService - Service for fetching token metadata.
 * @returns A context object containing the formatted permission details and account information.
 */
export async function buildContext(
  permissionRequest: Erc20TokenSwapPermissionRequest,
  services: PermissionBuildServices,
): Promise<Erc20TokenSwapContext> {
  const { tokenMetadataService } = services;
  const chainId = Number(permissionRequest.chainId);
  const {
    from,
    permission: { data, isAdjustmentAllowed },
  } = permissionRequest;

  if (!from) {
    throw new InvalidInputError(
      'PermissionRequest.address was not found. This should be resolved within the buildContextHandler function in PermissionHandler.',
    );
  }

  const [spendTokenMetadata, receiveTokenMetadata] = await Promise.all([
    resolveTokenMetadata({
      tokenMetadataService,
      chainId,
      account: from,
      assetAddress: data.spend.tokenAddress,
    }),
    resolveTokenMetadata({
      tokenMetadataService,
      chainId,
      account: from,
      assetAddress: data.receive.tokenAddress,
    }),
  ]);

  const expiryRule = permissionRequest.rules?.find(
    (rule) => extractDescriptorName(rule.type) === 'expiry',
  );

  const expiry = expiryRule
    ? {
        timestamp: expiryRule.data.timestamp,
      }
    : undefined;

  const redeemerAddresses = getRedeemerAddressesFromRules(
    permissionRequest.rules,
  );

  const maxSpendAmount = formatUnitsFromHex({
    value: data.spend.maxAmount,
    allowNull: false,
    decimals: spendTokenMetadata.decimals,
  });

  const minReceiveAmount = formatUnitsFromHex({
    value: data.receive.minAmount,
    allowNull: false,
    decimals: receiveTokenMetadata.decimals,
  });

  const tokenAddressCaip19 = toCaipAssetType(
    CHAIN_NAMESPACE,
    chainId.toString(),
    ASSET_NAMESPACE,
    data.spend.tokenAddress,
  );

  const receiveTokenAddressCaip19 = toCaipAssetType(
    CHAIN_NAMESPACE,
    chainId.toString(),
    ASSET_NAMESPACE,
    data.receive.tokenAddress,
  );

  const accountAddressCaip10 = toCaipAccountId(
    CHAIN_NAMESPACE,
    chainId.toString(),
    from,
  );

  return {
    expiry,
    ...(redeemerAddresses === undefined ? {} : { redeemerAddresses }),
    justification: data.justification,
    isAdjustmentAllowed,
    accountAddressCaip10,
    tokenAddressCaip19,
    tokenMetadata: spendTokenMetadata,
    receiveTokenAddressCaip19,
    receiveTokenMetadata,
    permissionDetails: {
      maxSpendAmount,
      minReceiveAmount,
      targets: [...data.via.targets],
      selectors: [...data.via.selectors],
    },
  };
}

/**
 * Derive validation metadata for the confirmation UI.
 * @param options - The options object containing the context to create metadata for.
 * @param options.context - Built context.
 * @returns Metadata with validation errors for rules.
 */
export async function deriveMetadata({
  context,
}: {
  context: Erc20TokenSwapContext;
}): Promise<Erc20TokenSwapMetadata> {
  const {
    permissionDetails,
    expiry,
    tokenMetadata: { decimals: spendDecimals },
    receiveTokenMetadata: { decimals: receiveDecimals },
  } = context;

  const validationErrors: Erc20TokenSwapMetadata['validationErrors'] = {};

  const maxSpendAmountResult = validateAndParseAmount(
    permissionDetails.maxSpendAmount,
    spendDecimals,
    'max spend amount',
  );
  if (maxSpendAmountResult.error) {
    validationErrors.maxSpendAmountError = maxSpendAmountResult.error;
  }

  const minReceiveAmountResult = validateAndParseAmount(
    permissionDetails.minReceiveAmount,
    receiveDecimals,
    'min receive amount',
  );
  if (minReceiveAmountResult.error) {
    validationErrors.minReceiveAmountError = minReceiveAmountResult.error;
  }

  if (expiry) {
    const expiryError = validateExpiry(expiry.timestamp);
    if (expiryError) {
      validationErrors.expiryError = expiryError;
    }
  }

  return {
    validationErrors,
  };
}
