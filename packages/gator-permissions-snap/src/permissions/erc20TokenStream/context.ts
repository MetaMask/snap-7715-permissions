import { bigIntToHex } from '@metamask/utils';

import type { AccountController } from '../../accountController';
import { TimePeriod } from '../../core/types';
import type { TokenMetadataService } from '../../services/tokenMetadataService';
import type { TokenPricesService } from '../../services/tokenPricesService';
import {
  convertReadableDateToTimestamp,
  convertTimestampToReadableDate,
  TIME_PERIOD_TO_SECONDS,
} from '../../utils/time';
import { parseUnits, formatUnits, formatUnitsFromHex } from '../../utils/value';
import {
  validateAndParseAmount,
  validateStartTime,
  validateExpiry,
  validateMaxAmountVsInitialAmount,
  calculateAmountPerSecond,
} from '../contextValidation';
import type {
  Erc20TokenStreamContext,
  Erc20TokenStreamPermissionRequest,
  Erc20TokenStreamMetadata,
  PopulatedErc20TokenStreamPermission,
  Erc20TokenStreamPermission,
} from './types';

const DEFAULT_MAX_AMOUNT =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
const DEFAULT_INITIAL_AMOUNT = '0x0';

/**
 * Construct an amended Erc20TokenStreamPermissionRequest, based on the specified request,
 * with the changes made by the specified context.
 * @param options0 - The options object containing the context and original request.
 * @param options0.context - The Erc20 token stream context containing the updated permission details.
 * @param options0.originalRequest - The original permission request to be amended.
 * @returns A new permission request with the context changes applied.
 */
export async function applyContext({
  context,
  originalRequest,
}: {
  context: Erc20TokenStreamContext;
  originalRequest: Erc20TokenStreamPermissionRequest;
}): Promise<Erc20TokenStreamPermissionRequest> {
  const {
    permissionDetails,
    tokenMetadata: { decimals },
  } = context;
  const expiry = convertReadableDateToTimestamp(context.expiry);

  const permissionData = {
    maxAmount: permissionDetails.maxAmount
      ? bigIntToHex(
          parseUnits({ formatted: permissionDetails.maxAmount, decimals }),
        )
      : undefined,
    initialAmount: permissionDetails.initialAmount
      ? bigIntToHex(
          parseUnits({ formatted: permissionDetails.initialAmount, decimals }),
        )
      : undefined,
    amountPerSecond: bigIntToHex(
      parseUnits({
        formatted: permissionDetails.amountPerPeriod,
        decimals,
      }) / TIME_PERIOD_TO_SECONDS[permissionDetails.timePeriod],
    ),
    startTime: convertReadableDateToTimestamp(permissionDetails.startTime),
    justification: originalRequest.permission.data.justification,
    tokenAddress: originalRequest.permission.data.tokenAddress,
  };

  return {
    ...originalRequest,
    expiry,
    permission: {
      type: 'erc20-token-stream',
      data: permissionData,
      rules: originalRequest.permission.rules ?? {},
    },
  };
}

/**
 * Populate an Erc20 token stream permission by filling in default values for optional fields.
 * @param options0 - The options object containing the permission to populate.
 * @param options0.permission - The Erc20 token stream permission to populate with default values.
 * @returns A populated Erc20 token stream permission with all required fields populated.
 */
export async function populatePermission({
  permission,
}: {
  permission: Erc20TokenStreamPermission;
}): Promise<PopulatedErc20TokenStreamPermission> {
  return {
    ...permission,
    data: {
      ...permission.data,
      initialAmount: permission.data.initialAmount ?? DEFAULT_INITIAL_AMOUNT,
      maxAmount: permission.data.maxAmount ?? DEFAULT_MAX_AMOUNT,
    },
    rules: permission.rules ?? {},
  };
}

/**
 * Converts a permission request into a context object that can be used to render the UI
 * and manage the permission state.
 * @param options0 - The options object containing the request and required services.
 * @param options0.permissionRequest - The Erc20 token stream permission request to convert.
 * @param options0.tokenPricesService - Service for fetching token price information.
 * @param options0.accountController - Controller for managing account operations.
 * @param options0.tokenMetadataService - Service for fetching token metadata.
 * @returns A context object containing the formatted permission details and account information.
 */
export async function buildContext({
  permissionRequest,
  tokenPricesService,
  accountController,
  tokenMetadataService,
}: {
  permissionRequest: Erc20TokenStreamPermissionRequest;
  tokenPricesService: TokenPricesService;
  accountController: AccountController;
  tokenMetadataService: TokenMetadataService;
}): Promise<Erc20TokenStreamContext> {
  const chainId = Number(permissionRequest.chainId);
  const { tokenAddress } = permissionRequest.permission.data;

  const address = await accountController.getAccountAddress({
    chainId,
  });

  const {
    balance: rawBalance,
    decimals,
    symbol,
    iconUrl,
  } = await tokenMetadataService.getTokenBalanceAndMetadata({
    chainId,
    account: address,
    assetAddress: tokenAddress,
  });

  const iconDataResponse =
    await tokenMetadataService.fetchIconDataAsBase64(iconUrl);

  const iconDataBase64 = iconDataResponse.success
    ? iconDataResponse.imageDataBase64
    : null;

  const balanceFormatted = await tokenPricesService.getCryptoToFiatConversion(
    `eip155:${chainId}/erc20:${tokenAddress}`,
    bigIntToHex(rawBalance),
    decimals,
  );

  const expiry = convertTimestampToReadableDate(permissionRequest.expiry);

  const initialAmount = formatUnitsFromHex({
    value: permissionRequest.permission.data.initialAmount,
    allowUndefined: true,
    decimals,
  });

  const timePeriod = TimePeriod.WEEKLY;

  const maxAmount = formatUnitsFromHex({
    value: permissionRequest.permission.data.maxAmount,
    allowUndefined: true,
    decimals,
  });

  const amountPerSecond = BigInt(
    permissionRequest.permission.data.amountPerSecond,
  );

  // It may seem strange to convert the amount per second to amount per period, format, and then convert back to amount per second.
  // The user is inputting amount per period, and we derive amount per second, so it makes sense for the context to contain the amount per period.
  const amountPerPeriod = formatUnits({
    value: amountPerSecond * TIME_PERIOD_TO_SECONDS[timePeriod],
    decimals,
  });

  const startTime = convertTimestampToReadableDate(
    permissionRequest.permission.data.startTime,
  );

  const balance = bigIntToHex(rawBalance);

  return {
    expiry,
    justification: permissionRequest.permission.data.justification,
    isAdjustmentAllowed: permissionRequest.isAdjustmentAllowed ?? true,
    accountDetails: {
      address,
      balance,
      balanceFormattedAsCurrency: balanceFormatted,
    },
    tokenMetadata: {
      symbol,
      decimals,
      iconDataBase64,
    },
    permissionDetails: {
      initialAmount,
      maxAmount,
      timePeriod,
      startTime,
      amountPerPeriod,
    },
  };
}

/**
 * Creates metadata for the Erc20 token stream context, including validation of amounts and timestamps.
 * @param options0 - The options object containing the context to create metadata for.
 * @param options0.context - The Erc20 token stream context to validate and create metadata from.
 * @returns Metadata object containing derived values and validation errors.
 */
export async function deriveMetadata({
  context,
}: {
  context: Erc20TokenStreamContext;
}): Promise<Erc20TokenStreamMetadata> {
  const {
    permissionDetails,
    expiry,
    tokenMetadata: { decimals },
  } = context;

  const validationErrors: Erc20TokenStreamMetadata['validationErrors'] = {};

  // Validate max amount
  const maxAmountResult = validateAndParseAmount(
    permissionDetails.maxAmount,
    decimals,
    'max amount',
    false, // Disallow zero for max amount
  );
  if (maxAmountResult.error) {
    validationErrors.maxAmountError = maxAmountResult.error;
  }

  // Validate initial amount
  const initialAmountResult = validateAndParseAmount(
    permissionDetails.initialAmount,
    decimals,
    'initial amount',
    true, // Allow zero for initial amount
  );
  if (initialAmountResult.error) {
    validationErrors.initialAmountError = initialAmountResult.error;
  }

  // Validate amount per period
  const amountPerPeriodResult = validateAndParseAmount(
    permissionDetails.amountPerPeriod,
    decimals,
    'amount per period',
  );
  let amountPerSecond = 'Unknown';
  if (amountPerPeriodResult.error) {
    validationErrors.amountPerPeriodError = amountPerPeriodResult.error;
  } else if (amountPerPeriodResult.amount) {
    amountPerSecond = calculateAmountPerSecond(
      amountPerPeriodResult.amount,
      permissionDetails.timePeriod,
      decimals,
    );
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

  // Validate max amount vs initial amount
  const maxVsInitialError = validateMaxAmountVsInitialAmount(
    maxAmountResult.amount,
    initialAmountResult.amount,
  );
  if (maxVsInitialError) {
    validationErrors.maxAmountError = maxVsInitialError;
  }

  return {
    amountPerSecond,
    validationErrors,
  };
}
