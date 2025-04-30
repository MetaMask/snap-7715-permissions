import { formatEther, maxUint256, parseEther, toHex } from 'viem';
import { AccountController } from 'src/accountController';
import { TokenPricesService } from '../../services/tokenPricesService';
import type {
  NativeTokenStreamContext,
  NativeTokenStreamPermissionRequest,
  NativeTokenStreamMetadata,
  HydratedNativeTokenStreamPermissionRequest,
} from './types';
import {
  convertReadableDateToTimestamp,
  convertTimestampToReadableDate,
  getStartOfTodayUTC,
} from '../../utils/time';
import { formatEtherFromString } from '../../utils/balance';
import { TimePeriod } from './types';

const DEFAULT_MAX_AMOUNT = toHex(maxUint256);
const DEFAULT_INITIAL_AMOUNT = '0x0';

/**
 * Construct an amended HydratedNativeTokenStreamPermissionRequest, based on the specified request,
 * with the changes made by the specified context.
 */
export function contextToPermissionRequest({
  context,
  originalRequest,
}: {
  context: NativeTokenStreamContext;
  originalRequest: NativeTokenStreamPermissionRequest;
}): NativeTokenStreamPermissionRequest {
  const { permissionDetails } = context;
  const expiry = convertReadableDateToTimestamp(context.expiry);

  const permissionData = {
    maxAmount: permissionDetails.maxAmount
      ? toHex(parseEther(permissionDetails.maxAmount))
      : undefined,
    initialAmount: permissionDetails.initialAmount
      ? toHex(parseEther(permissionDetails.initialAmount))
      : undefined,
    amountPerSecond: toHex(
      parseEther(permissionDetails.amountPerPeriod) /
        TIME_PERIOD_TO_SECONDS[permissionDetails.timePeriod],
    ),
    startTime: convertReadableDateToTimestamp(permissionDetails.startTime),
    justification: originalRequest.permission.data.justification,
  };

  return {
    ...originalRequest,
    expiry,
    permission: {
      type: 'native-token-stream',
      data: permissionData,
      rules: originalRequest.permission.rules || {},
    },
  };
}

export function hydratePermissionRequest({
  permissionRequest,
}: {
  permissionRequest: NativeTokenStreamPermissionRequest;
}): HydratedNativeTokenStreamPermissionRequest {
  return {
    ...permissionRequest,
    isAdjustmentAllowed: permissionRequest.isAdjustmentAllowed ?? true,
    permission: {
      ...permissionRequest.permission,
      data: {
        ...permissionRequest.permission.data,
        initialAmount:
          permissionRequest.permission.data.initialAmount ??
          DEFAULT_INITIAL_AMOUNT,
        maxAmount:
          permissionRequest.permission.data.maxAmount ?? DEFAULT_MAX_AMOUNT,
      },
      rules: permissionRequest.permission.rules ?? {},
    },
  };
}

/**
 * A mapping of time periods to their equivalent seconds.
 */
export const TIME_PERIOD_TO_SECONDS: Record<TimePeriod, bigint> = {
  [TimePeriod.DAILY]: 60n * 60n * 24n, // 86,400(seconds)
  [TimePeriod.WEEKLY]: 60n * 60n * 24n * 7n, // 604,800(seconds)
  // Monthly is difficult because months are not consistent in length.
  // We approximate by calculating the number of seconds in 1/12th of a year.
  [TimePeriod.MONTHLY]: (60n * 60n * 24n * 365n) / 12n, // 2,629,760(seconds)
};

export async function permissionRequestToContext({
  permissionRequest,
  tokenPricesService,
  accountController,
}: {
  permissionRequest: NativeTokenStreamPermissionRequest;
  tokenPricesService: TokenPricesService;
  accountController: AccountController;
}): Promise<NativeTokenStreamContext> {
  const chainId = Number(permissionRequest.chainId);

  const address = await accountController.getAccountAddress({
    chainId,
  });

  const balance = await accountController.getAccountBalance({
    chainId,
  });

  const balanceFormatted = await tokenPricesService.getCryptoToFiatConversion(
    `eip155:1/slip44:60`,
    balance,
  );

  const expiry = convertTimestampToReadableDate(permissionRequest.expiry);

  const initialAmount = formatEtherFromString(
    permissionRequest.permission.data.initialAmount,
    true,
  );

  const maxAmount = formatEtherFromString(
    permissionRequest.permission.data.maxAmount,
    true,
  );

  const timePeriod = TimePeriod.WEEKLY;

  const amountPerSecond = BigInt(
    permissionRequest.permission.data.amountPerSecond,
  );

  // It may seem strange to convert the amount per second to amount per period, format, and then convert back to amount per second.
  // The user is inputting amount per period, and we derive amount per second, so it makes sense for the context to contain the amount per period.
  const amountPerPeriod = formatEther(
    amountPerSecond * TIME_PERIOD_TO_SECONDS[timePeriod],
  );

  const startTime = convertTimestampToReadableDate(
    permissionRequest.permission.data.startTime,
  );

  return {
    expiry,
    isAdjustmentAllowed: permissionRequest.isAdjustmentAllowed ?? true,
    accountDetails: {
      account: {
        address,
        balance,
        valueFormattedAsCurrency: balanceFormatted,
      },
      senderDetails: {
        title: 'Stream from',
        tooltip: 'The account that the token stream comes from.',
      },
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

export async function createContextMetadata({
  context,
}: {
  context: NativeTokenStreamContext;
}): Promise<NativeTokenStreamMetadata> {
  const { permissionDetails, expiry } = context;

  const validationErrors: NativeTokenStreamMetadata['validationErrors'] = {};

  let maxAmountBigInt: bigint | undefined;
  let initialAmountBigInt: bigint | undefined;

  if (permissionDetails.maxAmount) {
    try {
      maxAmountBigInt = parseEther(permissionDetails.maxAmount);
      if (maxAmountBigInt < 0n) {
        validationErrors.maxAmountError = 'Max amount must be greater than 0';
      }
    } catch (error) {
      validationErrors.maxAmountError = 'Invalid max amount';
    }
  }

  if (permissionDetails.initialAmount) {
    try {
      initialAmountBigInt = parseEther(permissionDetails.initialAmount);
      if (initialAmountBigInt < 0n) {
        validationErrors.initialAmountError =
          'Initial amount must be greater than 0';
      }
    } catch (error) {
      validationErrors.initialAmountError = 'Invalid initial amount';
    }
  }

  let amountPerSecondBigInt: bigint;
  let amountPerSecond: string = 'Unknown';
  try {
    amountPerSecondBigInt = parseEther(permissionDetails.amountPerPeriod);
    if (amountPerSecondBigInt <= 0n) {
      validationErrors.amountPerPeriodError =
        'Amount per period must be greater than 0';
    } else {
      amountPerSecond = formatEther(
        amountPerSecondBigInt /
          TIME_PERIOD_TO_SECONDS[permissionDetails.timePeriod],
      );
    }
  } catch (error) {
    validationErrors.amountPerPeriodError = 'Invalid amount per period';
  }

  try {
    const startTimeDate = convertReadableDateToTimestamp(
      permissionDetails.startTime,
    );

    if (startTimeDate < getStartOfTodayUTC()) {
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

  if (maxAmountBigInt !== undefined && initialAmountBigInt !== undefined) {
    if (maxAmountBigInt < initialAmountBigInt) {
      validationErrors.maxAmountError =
        'Max amount must be greater than initial amount';
    }
  }

  return {
    amountPerSecond,
    validationErrors,
  };
}
