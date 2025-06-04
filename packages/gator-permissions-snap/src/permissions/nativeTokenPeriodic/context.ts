import { parseEther, toHex } from 'viem';

import type { AccountController } from '../../accountController';
import { TimePeriod } from '../../core/types';
import type { TokenMetadataService } from '../../services/tokenMetadataService';
import type { TokenPricesService } from '../../services/tokenPricesService';
import { formatUnitsFromString } from '../../utils/balance';
import {
  convertReadableDateToTimestamp,
  convertTimestampToReadableDate,
  getStartOfTodayUTC,
  TIME_PERIOD_TO_SECONDS,
} from '../../utils/time';
import type {
  NativeTokenPeriodicContext,
  NativeTokenPeriodicPermissionRequest,
  NativeTokenPeriodicMetadata,
  PopulatedNativeTokenPeriodicPermission,
  NativeTokenPeriodicPermission,
} from './types';

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
  const { permissionDetails } = context;
  const expiry = convertReadableDateToTimestamp(context.expiry);

  const permissionData = {
    periodAmount: toHex(parseEther(permissionDetails.periodAmount)),
    periodDuration: parseInt(permissionDetails.periodDuration, 10),
    startTime: convertReadableDateToTimestamp(permissionDetails.startTime),
    justification: originalRequest.permission.data.justification,
  };

  return {
    ...originalRequest,
    expiry,
    permission: {
      type: 'native-token-periodic',
      data: permissionData,
      rules: originalRequest.permission.rules ?? {},
    },
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
    rules: permission.rules ?? {},
  };
}

/**
 * Converts a permission request into a context object that can be used to render the UI
 * and manage the permission state.
 * @param args - The options object containing the request and required services.
 * @param args.permissionRequest - The native token periodic permission request to convert.
 * @param args.tokenPricesService - Service for fetching token price information.
 * @param args.accountController - Controller for managing account operations.
 * @param args.tokenMetadataService - Service for fetching token metadata.
 * @returns A context object containing the formatted permission details and account information.
 */
export async function buildContext({
  permissionRequest,
  tokenPricesService,
  accountController,
  tokenMetadataService,
}: {
  permissionRequest: NativeTokenPeriodicPermissionRequest;
  tokenPricesService: TokenPricesService;
  accountController: AccountController;
  tokenMetadataService: TokenMetadataService;
}): Promise<NativeTokenPeriodicContext> {
  const chainId = Number(permissionRequest.chainId);

  const address = await accountController.getAccountAddress({
    chainId,
  });

  const {
    balance: rawBalance,
    decimals,
    symbol,
  } = await tokenMetadataService.getTokenBalanceAndMetadata({
    chainId,
    account: address,
  });

  const balanceFormatted = await tokenPricesService.getCryptoToFiatConversion(
    `eip155:1/slip44:60`,
    toHex(rawBalance),
    decimals,
  );

  // todo: this should just be BigInt
  const balance = toHex(rawBalance);

  const expiry = convertTimestampToReadableDate(permissionRequest.expiry);

  const periodAmount = formatUnitsFromString({
    value: permissionRequest.permission.data.periodAmount,
    allowUndefined: false,
    decimals,
  });

  const periodDuration =
    permissionRequest.permission.data.periodDuration.toString();

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

  const startTime = convertTimestampToReadableDate(
    permissionRequest.permission.data.startTime,
  );

  return {
    expiry,
    justification: permissionRequest.permission.data.justification,
    isAdjustmentAllowed: permissionRequest.isAdjustmentAllowed ?? true,
    accountDetails: {
      address,
      balance,
      balanceFormattedAsCurrency: balanceFormatted,
      symbol,
      decimals,
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
  const { permissionDetails, expiry } = context;

  const validationErrors: NativeTokenPeriodicMetadata['validationErrors'] = {};

  try {
    const periodAmountBigInt = parseEther(permissionDetails.periodAmount);
    if (periodAmountBigInt <= 0n) {
      validationErrors.periodAmountError =
        'Period amount must be greater than 0';
    }
  } catch (error) {
    validationErrors.periodAmountError = 'Invalid period amount';
  }

  try {
    const periodDuration = parseInt(permissionDetails.periodDuration, 10);
    if (isNaN(periodDuration) || periodDuration <= 0) {
      validationErrors.periodDurationError =
        'Period duration must be greater than 0';
    }
  } catch (error) {
    validationErrors.periodDurationError = 'Invalid period duration';
  }

  try {
    const startTimeTimestamp = convertReadableDateToTimestamp(
      permissionDetails.startTime,
    );

    if (startTimeTimestamp < getStartOfTodayUTC()) {
      validationErrors.startTimeError = 'Start time must be today or later';
    }
  } catch (error) {
    validationErrors.startTimeError = 'Invalid start time';
  }

  try {
    const expiryDate = convertReadableDateToTimestamp(expiry);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (expiryDate < nowSeconds) {
      validationErrors.expiryError = 'Expiry must be in the future';
    }
  } catch (error) {
    validationErrors.expiryError = 'Invalid expiry';
  }

  return {
    validationErrors,
  };
}
