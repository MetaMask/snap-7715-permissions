import { InvalidInputError } from '@metamask/snaps-sdk';
import {
  bigIntToHex,
  parseCaipAccountId,
  toCaipAccountId,
  toCaipAssetType,
  type Hex,
} from '@metamask/utils';

import { TimePeriod } from '../../core/types';
import type { TokenMetadataService } from '../../services/tokenMetadataService';
import { TIME_PERIOD_TO_SECONDS } from '../../utils/time';
import { parseUnits, formatUnitsFromHex } from '../../utils/value';
import {
  validateAndParseAmount,
  validateStartTime,
  validateExpiry,
  validatePeriodDuration,
  validateStartTimeVsExpiry,
} from '../contextValidation';
import type {
  NativeTokenPeriodicContext,
  NativeTokenPeriodicPermissionRequest,
  NativeTokenPeriodicMetadata,
  PopulatedNativeTokenPeriodicPermission,
  NativeTokenPeriodicPermission,
} from './types';

const ASSET_NAMESPACE = 'slip44';
const CHAIN_NAMESPACE = 'eip155';
const ASSET_REFERENCE = '60';

/**
 * Construct an amended NativeTokenPeriodicPermissionRequest, based on the specified request,
 * with the changes made by the specified context.
 * @param options0 - The options object containing the context and original request.
 * @param options0.context - The native token periodic context containing the updated permission details.
 * @param options0.originalRequest - The original permission request to be amended.
 * @returns A new permission request with the context changes applied.
 */
export async function applyContext({
  context,
  originalRequest,
}: {
  context: NativeTokenPeriodicContext;
  originalRequest: NativeTokenPeriodicPermissionRequest;
}): Promise<NativeTokenPeriodicPermissionRequest> {
  const {
    permissionDetails,
    tokenMetadata: { decimals },
  } = context;

  const expiry = context.expiry.timestamp;

  let isExpiryRuleFound = false;

  const rules: NativeTokenPeriodicPermissionRequest['rules'] =
    originalRequest.rules?.map((rule) => {
      if (rule.type === 'expiry') {
        isExpiryRuleFound = true;
        return {
          ...rule,
          data: { ...rule.data, timestamp: expiry },
        };
      }
      return rule;
    }) ?? [];

  if (!isExpiryRuleFound) {
    throw new InvalidInputError(
      'Expiry rule not found. An expiry is required on all permissions.',
    );
  }

  const permissionData = {
    periodAmount: bigIntToHex(
      parseUnits({ formatted: permissionDetails.periodAmount, decimals }),
    ),
    periodDuration: parseInt(permissionDetails.periodDuration, 10),
    startTime: permissionDetails.startTime,
    justification: originalRequest.permission.data.justification,
  };

  const { address } = parseCaipAccountId(context.accountAddressCaip10);

  return {
    ...originalRequest,
    address: address as Hex,
    permission: {
      type: 'native-token-periodic',
      data: permissionData,
      isAdjustmentAllowed: originalRequest.permission.isAdjustmentAllowed,
    },
    rules,
  };
}

/**
 * Populate a native token periodic permission.
 * @param options0 - The options object containing the permission to populate.
 * @param options0.permission - The native token periodic permission to populate.
 * @returns A populated native token periodic permission.
 */
export async function populatePermission({
  permission,
}: {
  permission: NativeTokenPeriodicPermission;
}): Promise<PopulatedNativeTokenPeriodicPermission> {
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
 * @param args - The options object containing the request and required services.
 * @param args.permissionRequest - The native token periodic permission request to convert.
 * @param args.tokenMetadataService - Service for fetching token metadata.
 * @returns A context object containing the formatted permission details and account information.
 */
export async function buildContext({
  permissionRequest,
  tokenMetadataService,
}: {
  permissionRequest: NativeTokenPeriodicPermissionRequest;
  tokenMetadataService: TokenMetadataService;
}): Promise<NativeTokenPeriodicContext> {
  const chainId = Number(permissionRequest.chainId);

  const {
    address,
    permission: { data, isAdjustmentAllowed },
  } = permissionRequest;

  if (!address) {
    throw new InvalidInputError(
      'PermissionRequest.address was not found. This should be resolved within the buildContextHandler function in PermissionHandler.',
    );
  }

  const { decimals, symbol, iconUrl } =
    await tokenMetadataService.getTokenBalanceAndMetadata({
      chainId,
      account: address,
    });

  const iconDataResponse =
    await tokenMetadataService.fetchIconDataAsBase64(iconUrl);

  const iconDataBase64 = iconDataResponse.success
    ? iconDataResponse.imageDataBase64
    : null;

  const expiryRule = permissionRequest.rules?.find(
    (rule) => rule.type === 'expiry',
  );

  if (!expiryRule) {
    throw new InvalidInputError(
      'Expiry rule not found. An expiry is required on all permissions.',
    );
  }

  const expiry = {
    timestamp: expiryRule.data.timestamp,
    isAdjustmentAllowed: expiryRule.isAdjustmentAllowed ?? true,
  };

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
 * Creates metadata for the native token periodic context, including validation.
 * @param options0 - The options object containing the context to create metadata for.
 * @param options0.context - The native token periodic context to validate and create metadata from.
 * @returns Metadata object containing validation errors.
 */
export async function deriveMetadata({
  context,
}: {
  context: NativeTokenPeriodicContext;
}): Promise<NativeTokenPeriodicMetadata> {
  const {
    permissionDetails,
    expiry,
    tokenMetadata: { decimals },
  } = context;

  const validationErrors: NativeTokenPeriodicMetadata['validationErrors'] = {};

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
  const expiryError = validateExpiry(expiry.timestamp);
  if (expiryError) {
    validationErrors.expiryError = expiryError;
  }

  // Validate start time vs expiry (only if individual validations passed)
  if (!validationErrors.startTimeError && !validationErrors.expiryError) {
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
