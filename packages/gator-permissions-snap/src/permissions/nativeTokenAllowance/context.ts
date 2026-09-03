import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import { InvalidInputError, InternalError } from '@metamask/snaps-sdk';
import {
  bigIntToHex,
  parseCaipAccountId,
  toCaipAccountId,
  toCaipAssetType,
} from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type { TokenMetadataCoordinator } from '../../core/coordinators/TokenMetadataCoordinator';
import type { PermissionBuildServices } from '../../core/permission/PermissionModule';
import { getTokenDecimals } from '../../core/token/tokenSelectors';
import { parseUnits, formatUnitsFromHex } from '../../utils/value';
import {
  validateAndParseAmount,
  validateStartTime,
  validateExpiry,
  validateStartTimeVsExpiry,
} from '../contextValidation';
import {
  applyExpiryRule,
  applyPayeeRule,
  applyRedeemerRule,
  getPayeeAddressesFromRulesIfPresent,
  getRedeemerAddressesFromRules,
} from '../rules';
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
 * @param options.tokenMetadata - Coordinator providing token metadata.
 * @returns Request with hex allowance and merged expiry rule (optional, like other types).
 */
export async function applyContext({
  context,
  originalRequest,
  tokenMetadata,
}: {
  context: NativeTokenAllowanceContext;
  originalRequest: NativeTokenAllowancePermissionRequest;
  tokenMetadata: TokenMetadataCoordinator;
}): Promise<NativeTokenAllowancePermissionRequest> {
  const { permissionDetails } = context;
  const decimals = getTokenDecimals(tokenMetadata, context.primaryTokenCaip19);
  if (decimals === undefined) {
    throw new InternalError('Token metadata not available for applyContext');
  }

  const expiryMerged = applyExpiryRule(context, originalRequest);
  const redeemerMerged = applyRedeemerRule(originalRequest, expiryMerged);
  const { rules } = applyPayeeRule(originalRequest, redeemerMerged);

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
 * Converts a permission request into a context object that can be used to render the UI
 * and manage the permission state.
 * @param permissionRequest - The native token allowance permission request to convert.
 * @param services - Services required to build permission context.
 * @param services.tokenMetadataCoordinator - Coordinator for token metadata.
 * @returns A context object containing the formatted permission details and account information.
 */
export async function buildContext(
  permissionRequest: NativeTokenAllowancePermissionRequest,
  services: PermissionBuildServices,
): Promise<NativeTokenAllowanceContext> {
  const { tokenMetadataCoordinator } = services;
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

  const accountAddressCaip10 = toCaipAccountId(
    CHAIN_NAMESPACE,
    chainId.toString(),
    from,
  );

  const primaryTokenCaip19 = toCaipAssetType(
    CHAIN_NAMESPACE,
    chainId.toString(),
    ASSET_NAMESPACE,
    ASSET_REFERENCE,
  );

  const { decimals } = await tokenMetadataCoordinator.ensureMetadata({
    caip19: primaryTokenCaip19,
  });

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

  const payeeAddresses = getPayeeAddressesFromRulesIfPresent(
    permissionRequest.rules,
  );

  const allowanceAmount = formatUnitsFromHex({
    value: data.allowanceAmount,
    allowNull: false,
    decimals,
  });

  const startTime = data.startTime ?? Math.floor(Date.now() / 1000);

  return {
    expiry,
    ...(redeemerAddresses === undefined ? {} : { redeemerAddresses }),
    ...(payeeAddresses === undefined ? {} : { payeeAddresses }),
    justification: data.justification,
    isAdjustmentAllowed,
    accountAddressCaip10,
    primaryTokenCaip19,
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
 * @param options.tokenMetadata - Coordinator providing token metadata.
 * @returns Metadata with validation errors for rules.
 */
export async function deriveMetadata({
  context,
  tokenMetadata,
}: {
  context: NativeTokenAllowanceContext;
  tokenMetadata: TokenMetadataCoordinator;
}): Promise<NativeTokenAllowanceMetadata> {
  const { permissionDetails, expiry } = context;
  const decimals = getTokenDecimals(tokenMetadata, context.primaryTokenCaip19);
  if (decimals === undefined) {
    return { validationErrors: {} };
  }

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
