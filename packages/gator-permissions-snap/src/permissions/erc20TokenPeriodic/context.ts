import {
  bigIntToHex,
  parseCaipAccountId,
  toCaipAssetType,
  toCaipAccountId,
  type Hex,
} from '@metamask/utils';

import { TimePeriod } from '../../core/types';
import type { TokenMetadataService } from '../../services/tokenMetadataService';
import {
  convertReadableDateToTimestamp,
  TIME_PERIOD_TO_SECONDS,
} from '../../utils/time';
import { parseUnits, formatUnitsFromHex } from '../../utils/value';
import {
  validateAndParseAmount,
  validateStartTime,
  validateExpiry,
  validatePeriodDuration,
} from '../contextValidation';
import type {
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicPermissionRequest,
  Erc20TokenPeriodicMetadata,
  PopulatedErc20TokenPeriodicPermission,
  Erc20TokenPeriodicPermission,
} from './types';

const ASSET_NAMESPACE = 'erc20';
const CHAIN_NAMESPACE = 'eip155';

/**
 * Construct an amended Erc20TokenPeriodicPermissionRequest, based on the specified request,
 * with the changes made by the specified context.
 * @param options0 - The options object containing the context and original request.
 * @param options0.context - The ERC20 token periodic context containing the updated permission details.
 * @param options0.originalRequest - The original permission request to be amended.
 * @returns A new permission request with the context changes applied.
 */
export async function applyContext({
  context,
  originalRequest,
}: {
  context: Erc20TokenPeriodicContext;
  originalRequest: Erc20TokenPeriodicPermissionRequest;
}): Promise<Erc20TokenPeriodicPermissionRequest> {
  const {
    permissionDetails,
    tokenMetadata: { decimals },
  } = context;
  const expiry = convertReadableDateToTimestamp(context.expiry);

  const permissionData = {
    periodAmount: bigIntToHex(
      parseUnits({ formatted: permissionDetails.periodAmount, decimals }),
    ),
    periodDuration: parseInt(permissionDetails.periodDuration, 10),
    startTime: convertReadableDateToTimestamp(permissionDetails.startTime),
    justification: originalRequest.permission.data.justification,
    tokenAddress: originalRequest.permission.data.tokenAddress,
  };

  const { address } = parseCaipAccountId(context.accountAddressCaip10);

  return {
    ...originalRequest,
    address: address as Hex,
    expiry,
    permission: {
      type: 'erc20-token-periodic',
      data: permissionData,
      rules: originalRequest.permission.rules ?? {},
    },
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
    rules: permission.rules ?? {},
  };
}

/**
 * Converts a permission request into a context object that can be used to render the UI
 * and manage the permission state.
 * @param args - The options object containing the request and required services.
 * @param args.permissionRequest - The ERC20 token periodic permission request to convert.
 * @param args.tokenMetadataService - Service for fetching token metadata.
 * @returns A context object containing the formatted permission details and account information.
 */
export async function buildContext({
  permissionRequest,
  tokenMetadataService,
}: {
  permissionRequest: Erc20TokenPeriodicPermissionRequest;
  tokenMetadataService: TokenMetadataService;
}): Promise<Erc20TokenPeriodicContext> {
  const chainId = Number(permissionRequest.chainId);
  const {
    address,
    isAdjustmentAllowed = true,
    permission: { data },
  } = permissionRequest;

  if (address === undefined) {
    throw new Error('Address is required');
  }

  const { decimals, symbol, iconUrl } =
    await tokenMetadataService.getTokenBalanceAndMetadata({
      chainId,
      account: address,
      assetAddress: data.tokenAddress,
    });

  const iconDataResponse =
    await tokenMetadataService.fetchIconDataAsBase64(iconUrl);

  const iconDataBase64 = iconDataResponse.success
    ? iconDataResponse.imageDataBase64
    : null;

  const expiry = permissionRequest.expiry.toString();

  const periodAmount = formatUnitsFromHex({
    value: data.periodAmount,
    allowUndefined: false,
    decimals,
  });

  const periodDuration = data.periodDuration.toString();

  // Determine the period type based on the duration
  let periodType: TimePeriod | 'Other';
  if (periodDuration === TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY].toString()) {
    periodType = TimePeriod.DAILY;
  } else if (
    periodDuration === TIME_PERIOD_TO_SECONDS[TimePeriod.WEEKLY].toString()
  ) {
    periodType = TimePeriod.WEEKLY;
  } else {
    periodType = 'Other';
  }

  const startTime = data.startTime.toString();

  const tokenAddressCaip19 = toCaipAssetType(
    CHAIN_NAMESPACE,
    chainId.toString(),
    ASSET_NAMESPACE,
    data.tokenAddress,
  );

  const accountAddressCaip10 = toCaipAccountId(
    CHAIN_NAMESPACE,
    chainId.toString(),
    address,
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
      periodAmount,
      periodType,
      periodDuration,
      startTime,
    },
  };
}

/**
 * Creates metadata for the ERC20 token periodic context, including validation.
 * @param options0 - The options object containing the context to create metadata for.
 * @param options0.context - The ERC20 token periodic context to validate and create metadata from.
 * @returns Metadata object containing validation errors.
 */
export async function deriveMetadata({
  context,
}: {
  context: Erc20TokenPeriodicContext;
}): Promise<Erc20TokenPeriodicMetadata> {
  const {
    permissionDetails,
    expiry,
    tokenMetadata: { decimals },
  } = context;

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

  // Validate expiry
  const expiryError = validateExpiry(expiry);
  if (expiryError) {
    validationErrors.expiryError = expiryError;
  }

  return {
    validationErrors,
  };
}
