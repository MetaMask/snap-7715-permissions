import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import { InvalidInputError } from '@metamask/snaps-sdk';
import {
  bigIntToHex,
  parseCaipAccountId,
  toCaipAccountId,
  toCaipAssetType,
} from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type { TokenMetadataService } from '../../services/tokenMetadataService';
import { formatUnitsFromHex } from '../../utils/value';
import { validateAndParseAmount, validateExpiry } from '../contextValidation';
import { applyExpiryRule } from '../rules';
import type {
  NativeTokenSwapContext,
  NativeTokenSwapMetadata,
  NativeTokenSwapPermission,
  NativeTokenSwapPermissionRequest,
  PopulatedNativeTokenSwapPermission,
} from './types';

const ASSET_NAMESPACE = 'slip44';
const CHAIN_NAMESPACE = 'eip155';
const ASSET_REFERENCE = '60';

/**
 * Applies UI context back onto the permission request.
 *
 * @param args - Arguments for applying the context.
 * @param args.context - Context from the confirmation UI.
 * @param args.originalRequest - Original request.
 * @returns Updated permission request.
 */
export async function applyContext({
  context,
  originalRequest,
}: {
  context: NativeTokenSwapContext;
  originalRequest: NativeTokenSwapPermissionRequest;
}): Promise<NativeTokenSwapPermissionRequest> {
  const {
    permissionDetails,
    tokenMetadata: { decimals },
  } = context;

  const { rules } = applyExpiryRule(context, originalRequest);

  const { amount, error } = validateAndParseAmount(
    permissionDetails.maxSwapAmount,
    decimals,
    'max allowance',
  );
  if (error || amount === null) {
    throw new InvalidInputError(error ?? 'Invalid max allowance');
  }

  const permissionData = {
    maxNativeSwapAmount: bigIntToHex(amount),
    whitelistedTokensOnly: permissionDetails.whitelistedTokensOnly,
    justification: originalRequest.permission.data.justification,
  };

  const { address } = parseCaipAccountId(context.accountAddressCaip10);

  return {
    ...originalRequest,
    from: address as Hex,
    permission: {
      type: 'native-token-swap',
      data: permissionData,
      isAdjustmentAllowed: originalRequest.permission.isAdjustmentAllowed,
    },
    rules,
  };
}

/**
 * Populates defaults on the permission before caveat creation.
 *
 * @param args - Arguments for populating the permission.
 * @param args.permission - Permission to populate.
 * @returns Populated permission.
 */
export async function populatePermission({
  permission,
}: {
  permission: NativeTokenSwapPermission;
}): Promise<PopulatedNativeTokenSwapPermission> {
  return {
    ...permission,
  };
}

/**
 * Builds dialog context from a validated permission request.
 *
 * @param args - Arguments for building the context.
 * @param args.permissionRequest - Validated request.
 * @param args.tokenMetadataService - Token metadata (native asset).
 * @returns Context for confirmation UI.
 */
export async function buildContext({
  permissionRequest,
  tokenMetadataService,
}: {
  permissionRequest: NativeTokenSwapPermissionRequest;
  tokenMetadataService: TokenMetadataService;
}): Promise<NativeTokenSwapContext> {
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

  const { decimals, symbol, iconUrl } =
    await tokenMetadataService.getTokenBalanceAndMetadata({
      chainId,
      account: from,
    });

  const iconDataResponse =
    await tokenMetadataService.fetchIconDataAsBase64(iconUrl);

  const iconDataBase64 = iconDataResponse.success
    ? iconDataResponse.imageDataBase64
    : null;

  const expiryRule = permissionRequest.rules?.find(
    (rule) => extractDescriptorName(rule.type) === 'expiry',
  );

  const expiry = expiryRule
    ? {
        timestamp: expiryRule.data.timestamp,
      }
    : undefined;

  const maxSwapAmount = formatUnitsFromHex({
    value: data.maxNativeSwapAmount,
    allowNull: false,
    decimals,
  });

  const tokenAddressCaip19 = toCaipAssetType(
    CHAIN_NAMESPACE,
    chainId.toString(),
    ASSET_NAMESPACE,
    ASSET_REFERENCE,
  );

  const accountAddressCaip10 = toCaipAccountId(
    CHAIN_NAMESPACE,
    chainId.toString(),
    from,
  );

  return {
    expiry,
    justification: data.justification,
    isAdjustmentAllowed,
    accountAddressCaip10,
    tokenAddressCaip19,
    tokenMetadata: {
      symbol,
      decimals,
      iconDataBase64,
    },
    permissionDetails: {
      maxSwapAmount,
      whitelistedTokensOnly: data.whitelistedTokensOnly,
    },
  };
}

/**
 * Derives validation metadata for the confirmation UI.
 *
 * @param args - Arguments for deriving the metadata.
 * @param args.context - Current context.
 * @returns Metadata including field errors.
 */
export async function deriveMetadata({
  context,
}: {
  context: NativeTokenSwapContext;
}): Promise<NativeTokenSwapMetadata> {
  const {
    permissionDetails,
    expiry,
    tokenMetadata: { decimals },
  } = context;

  const validationErrors: NativeTokenSwapMetadata['validationErrors'] = {};

  const maxAmountResult = validateAndParseAmount(
    permissionDetails.maxSwapAmount,
    decimals,
    'max allowance',
  );
  if (maxAmountResult.error) {
    validationErrors.maxNativeSwapAmountError = maxAmountResult.error;
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
