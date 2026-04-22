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
import { parseUnits, formatUnitsFromHex } from '../../utils/value';
import {
  validateAndParseAmount,
  validateStartTime,
  validateExpiry,
  validateStartTimeVsExpiry,
} from '../contextValidation';
import { applyExpiryRule } from '../rules';
import type {
  NativeTokenAllowanceContext,
  NativeTokenAllowancePermissionRequest,
  NativeTokenAllowanceMetadata,
  PopulatedNativeTokenAllowancePermission,
  NativeTokenAllowancePermission,
} from './types';

const ASSET_NAMESPACE = 'slip44';
const CHAIN_NAMESPACE = 'eip155';
const ASSET_REFERENCE = '60';

/**
 * Construct an amended permission request from context edits.
 * @param options - The options object containing the context and original request.
 * @param options.context - Context with formatted allowance and times.
 * @param options.originalRequest - Original request.
 * @returns Request with hex allowance and merged expiry rule (optional, like other types).
 */
export async function applyContext({
  context,
  originalRequest,
}: {
  context: NativeTokenAllowanceContext;
  originalRequest: NativeTokenAllowancePermissionRequest;
}): Promise<NativeTokenAllowancePermissionRequest> {
  const {
    permissionDetails,
    tokenMetadata: { decimals },
  } = context;

  const { rules } = applyExpiryRule(context, originalRequest);

  const permissionData = {
    allowanceAmount: bigIntToHex(
      parseUnits({ formatted: permissionDetails.allowanceAmount, decimals }),
    ),
    startTime: permissionDetails.startTime,
    justification: originalRequest.permission.data.justification,
  };

  const { address } = parseCaipAccountId(context.accountAddressCaip10);

  return {
    ...originalRequest,
    from: address as Hex,
    permission: {
      type: 'native-token-allowance',
      data: permissionData,
      isAdjustmentAllowed: originalRequest.permission.isAdjustmentAllowed,
    },
    rules,
  };
}

/**
 * Populate optional permission fields before signing.
 * @param options - The options object containing the permission to populate.
 * @param options.permission - Permission after applyContext.
 * @returns Permission with defaulted start time when missing.
 */
export async function populatePermission({
  permission,
}: {
  permission: NativeTokenAllowancePermission;
}): Promise<PopulatedNativeTokenAllowancePermission> {
  return {
    ...permission,
    data: {
      ...permission.data,
      startTime: permission.data.startTime ?? Math.floor(Date.now() / 1000),
    },
  };
}

/**
 * Build UI context from a validated permission request.
 * @param args - The options object containing the request and required services.
 * @param args.permissionRequest - Request for this permission type.
 * @param args.tokenMetadataService - Token metadata service.
 * @returns Context for confirmation UI and validation.
 */
export async function buildContext({
  permissionRequest,
  tokenMetadataService,
}: {
  permissionRequest: NativeTokenAllowancePermissionRequest;
  tokenMetadataService: TokenMetadataService;
}): Promise<NativeTokenAllowanceContext> {
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

  const allowanceAmount = formatUnitsFromHex({
    value: data.allowanceAmount,
    allowNull: false,
    decimals,
  });

  const startTime = data.startTime ?? Math.floor(Date.now() / 1000);

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
      allowanceAmount,
      startTime,
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
  context: NativeTokenAllowanceContext;
}): Promise<NativeTokenAllowanceMetadata> {
  const {
    permissionDetails,
    expiry,
    tokenMetadata: { decimals },
  } = context;

  const validationErrors: NativeTokenAllowanceMetadata['validationErrors'] = {};

  const allowanceAmountResult = validateAndParseAmount(
    permissionDetails.allowanceAmount,
    decimals,
    'allowance amount',
  );
  if (allowanceAmountResult.error) {
    validationErrors.allowanceAmountError = allowanceAmountResult.error;
  }

  const startTimeError = validateStartTime(permissionDetails.startTime);
  if (startTimeError) {
    validationErrors.startTimeError = startTimeError;
  }

  if (expiry) {
    const expiryError = validateExpiry(expiry.timestamp);
    if (expiryError) {
      validationErrors.expiryError = expiryError;
    }
  }

  if (
    expiry &&
    !validationErrors.startTimeError &&
    !validationErrors.expiryError
  ) {
    const startTimeVsExpiryError = validateStartTimeVsExpiry(
      permissionDetails.startTime,
      expiry.timestamp,
    );
    if (startTimeVsExpiryError) {
      validationErrors.startTimeError = startTimeVsExpiryError;
    }
  }

  return {
    validationErrors,
  };
}
