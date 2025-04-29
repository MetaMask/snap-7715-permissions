import { formatEther, parseEther, toHex } from 'viem';
import { AccountController } from 'src/accountController';
import { TokenPricesService } from '../../services/tokenPricesService';
import type {
  NativeTokenStreamContext,
  ValidatedNativeTokenStreamPermissionRequest,
  NativeTokenStreamMetadata,
} from './types';
import {
  convertReadableDateToTimestamp,
  convertTimestampToReadableDate,
} from '../../utils/time';
import { TimePeriod } from './types';
/**
 * Builds the granted permission based on user adjustments.
 */
export function contextToPermissionRequest({
  permissionRequest,
  context,
}: {
  context: NativeTokenStreamContext;
  permissionRequest: ValidatedNativeTokenStreamPermissionRequest;
}): ValidatedNativeTokenStreamPermissionRequest {
  const maxAmount = parseEther(context.permissionDetails.maxAmount);
  const amountPerSecond =
    parseEther(context.permissionDetails.amountPerPeriod) /
    TIME_PERIOD_TO_SECONDS[context.permissionDetails.timePeriod];
  const initialAmount = parseEther(context.permissionDetails.initialAmount);
  const startTime = convertReadableDateToTimestamp(
    context.permissionDetails.startTime,
  );
  const expiry = convertReadableDateToTimestamp(context.expiry);

  return {
    ...permissionRequest,
    expiry: expiry,
    permission: {
      type: 'native-token-stream',
      data: {
        maxAmount: toHex(maxAmount),
        amountPerSecond: toHex(amountPerSecond),
        initialAmount: toHex(initialAmount),
        startTime,
        justification: permissionRequest.permission.data.justification,
      },
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
  permissionRequest: ValidatedNativeTokenStreamPermissionRequest;
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

  // todo: do better handling of maximum / undefined
  const initialAmount = formatEther(
    BigInt(permissionRequest.permission.data.initialAmount),
  );

  const maxAmount = formatEther(
    BigInt(permissionRequest.permission.data.maxAmount),
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
    isAdjustmentAllowed: permissionRequest.isAdjustmentAllowed,
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

  // todo: we could do some better validation here.
  const validationErrors: NativeTokenStreamMetadata['validationErrors'] = {};

  let maxAmountBigInt: bigint | undefined;
  let initialAmountBigInt: bigint | undefined;

  try {
    maxAmountBigInt = parseEther(permissionDetails.maxAmount);
  } catch (error) {
    validationErrors.maxAmountError = 'Invalid max amount';
  }

  try {
    initialAmountBigInt = parseEther(permissionDetails.initialAmount);
  } catch (error) {
    validationErrors.initialAmountError = 'Invalid initial amount';
  }

  let amountPerSecondBigInt: bigint;
  try {
    amountPerSecondBigInt = parseEther(permissionDetails.amountPerPeriod);
  } catch (error) {
    validationErrors.amountPerPeriodError = 'Invalid amount per period';
  }

  try {
    convertReadableDateToTimestamp(permissionDetails.startTime);
  } catch (error) {
    validationErrors.startTimeError = 'Invalid start time';
  }

  try {
    convertReadableDateToTimestamp(expiry);
  } catch (error) {
    validationErrors.expiryError = 'Invalid expiry';
  }

  if (maxAmountBigInt !== undefined && initialAmountBigInt !== undefined) {
    if (maxAmountBigInt < initialAmountBigInt) {
      validationErrors.maxAmountError =
        'Max amount must be greater than initial amount';
    }
  }

  const amountPerSecond = formatEther(
    amountPerSecondBigInt /
      TIME_PERIOD_TO_SECONDS[permissionDetails.timePeriod],
  );

  return {
    amountPerSecond,
    validationErrors,
  };
}
