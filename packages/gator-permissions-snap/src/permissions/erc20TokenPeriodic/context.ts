import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import { InvalidInputError, InternalError } from '@metamask/snaps-sdk';
import {
  bigIntToHex,
  parseCaipAccountId,
  toCaipAssetType,
  toCaipAccountId,
} from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type {
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicPermissionRequest,
  Erc20TokenPeriodicMetadata,
  PopulatedErc20TokenPeriodicPermission,
  Erc20TokenPeriodicPermission,
} from './types';
import type { TokenMetadataCoordinator } from '../../core/coordinators/TokenMetadataCoordinator';
import type { PermissionBuildServices } from '../../core/permission/PermissionModule';
import { parseUnits, formatUnitsFromHex } from '../../utils/value';
import {
  validateAndParseAmount,
  validateStartTime,
  validateExpiry,
  validatePeriodDuration,
  validateStartTimeVsExpiry,
} from '../contextValidation';
import {
  applyExpiryRule,
  applyPayeeRule,
  applyRedeemerRule,
  getPayeeAddressesFromRulesIfPresent,
  getRedeemerAddressesFromRules,
} from '../rules';

const ASSET_NAMESPACE = 'erc20';
const CHAIN_NAMESPACE = 'eip155';

/**
 * Construct an amended Erc20TokenPeriodicPermissionRequest, based on the specified request,
 * with the changes made by the specified context.
 * @param options - The options object containing the context and original request.
 * @param options.context - The ERC20 token periodic context containing the updated permission details.
 * @param options.originalRequest - The original permission request to be amended.
 * @param options.tokenMetadata - Coordinator providing token metadata.
 * @returns A new permission request with the context changes applied.
 */
export async function applyContext({
  context,
  originalRequest,
  tokenMetadata,
}: {
  context: Erc20TokenPeriodicContext;
  originalRequest: Erc20TokenPeriodicPermissionRequest;
  tokenMetadata: TokenMetadataCoordinator;
}): Promise<Erc20TokenPeriodicPermissionRequest> {
  const { permissionDetails } = context;
  const decimals = tokenMetadata.getMetadata(
    context.primaryTokenCaip19,
  )?.decimals;
  if (decimals === undefined) {
    throw new InternalError('Token metadata not available for applyContext');
  }

  const expiryMerged = applyExpiryRule(context, originalRequest);
  const redeemerMerged = applyRedeemerRule(originalRequest, expiryMerged);
  const { rules } = applyPayeeRule(originalRequest, redeemerMerged);

  const permissionData = {
    periodAmount: bigIntToHex(
      parseUnits({ formatted: permissionDetails.periodAmount, decimals }),
    ),
    periodDuration: permissionDetails.periodDuration,
    startTime: permissionDetails.startTime,
    justification: originalRequest.permission.data.justification,
    tokenAddress: originalRequest.permission.data.tokenAddress,
  };

  const { address } = parseCaipAccountId(context.accountAddressCaip10);

  return {
    ...originalRequest,
    from: address as Hex,
    permission: {
      type: 'erc20-token-periodic',
      data: permissionData,
      isAdjustmentAllowed: originalRequest.permission.isAdjustmentAllowed,
    },
    rules,
  };
}

/**
 * Populate an ERC20 token periodic permission.
 * @param options0 - The options object containing the permission to populate.
 * @param options0.permission - The ERC20 token periodic permission to populate.
 * @returns A populated ERC20 token periodic permission.
 */
export async function populatePermission({
  permission,
}: {
  permission: Erc20TokenPeriodicPermission;
}): Promise<PopulatedErc20TokenPeriodicPermission> {
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
 * @param permissionRequest - The ERC20 token periodic permission request to convert.
 * @param services - Services required to build permission context.
 * @param services.tokenMetadataCoordinator - Coordinator for token metadata.
 * @returns A context object containing the formatted permission details and account information.
 */
export async function buildContext(
  permissionRequest: Erc20TokenPeriodicPermissionRequest,
  services: PermissionBuildServices,
): Promise<Erc20TokenPeriodicContext> {
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
    data.tokenAddress,
  );

  const { decimals } = await tokenMetadataCoordinator.ensureMetadata({
    caip19: primaryTokenCaip19,
    accountCaip10: accountAddressCaip10,
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

  const periodAmount = formatUnitsFromHex({
    value: data.periodAmount,
    allowNull: false,
    decimals,
  });

  const { periodDuration } = data;

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
      periodAmount,
      periodDuration,
      startTime,
    },
  };
}

/**
 * Creates metadata for the ERC20 token periodic context, including validation.
 * @param options0 - The options object containing the context to create metadata for.
 * @param options0.context - The ERC20 token periodic context to validate and create metadata from.
 * @param options0.tokenMetadata - Coordinator providing token metadata.
 * @returns Metadata object containing validation errors.
 */
export async function deriveMetadata({
  context,
  tokenMetadata,
}: {
  context: Erc20TokenPeriodicContext;
  tokenMetadata: TokenMetadataCoordinator;
}): Promise<Erc20TokenPeriodicMetadata> {
  const { permissionDetails, expiry } = context;
  const decimals = tokenMetadata.getMetadata(
    context.primaryTokenCaip19,
  )?.decimals;
  if (decimals === undefined) {
    return { validationErrors: {} };
  }

  const validationErrors: Erc20TokenPeriodicMetadata['validationErrors'] = {};

  // Validate period amount
  const periodAmountResult = validateAndParseAmount(
    permissionDetails.periodAmount,
    decimals,
    'period amount',
  );
  if (periodAmountResult.error) {
    validationErrors.periodAmountError = periodAmountResult.error;
  }

  // Validate period duration
  const periodDurationResult = validatePeriodDuration(
    permissionDetails.periodDuration,
  );
  if (periodDurationResult.error) {
    validationErrors.periodDurationError = periodDurationResult.error;
  }

  // Validate start time
  const startTimeError = validateStartTime(permissionDetails.startTime);
  if (startTimeError) {
    validationErrors.startTimeError = startTimeError;
  }

  // Validate expiry if present
  if (expiry) {
    const expiryError = validateExpiry(expiry.timestamp);
    if (expiryError) {
      validationErrors.expiryError = expiryError;
    }
  }

  // Validate start time vs expiry (only if individual validations passed and expiry present)
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
