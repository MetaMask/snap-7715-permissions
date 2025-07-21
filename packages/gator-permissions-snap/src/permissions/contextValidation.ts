import type { TimePeriod } from '../core/types';
import {
  convertReadableDateToTimestamp,
  getStartOfTodayUTC,
  getStartOfTodayLocal,
  TIME_PERIOD_TO_SECONDS,
} from '../utils/time';
import { parseUnits, formatUnits } from '../utils/value';

export type ValidationErrors = {
  [key: string]: string;
};

/**
 * Validates and parses a token amount string to BigInt.
 * @param amount - The amount string to validate.
 * @param decimals - Token decimals.
 * @param fieldName - Name of the field for error messages.
 * @param allowZero - Whether zero values are allowed (default: false).
 * @returns Object containing the parsed amount and any validation error.
 */
export function validateAndParseAmount(
  amount: string | undefined,
  decimals: number,
  fieldName: string,
  allowZero = false,
): { amount: bigint | undefined; error: string | undefined } {
  if (!amount) {
    return { amount: undefined, error: undefined };
  }

  try {
    const parsedAmount = parseUnits({ formatted: amount, decimals });
    if (!allowZero && parsedAmount <= 0n) {
      return {
        amount: undefined,
        error: `${fieldName} must be greater than 0`,
      };
    }
    if (allowZero && parsedAmount < 0n) {
      return {
        amount: undefined,
        error: `${fieldName} must be greater than or equal to 0`,
      };
    }
    return { amount: parsedAmount, error: undefined };
  } catch (error) {
    return { amount: undefined, error: `Invalid ${fieldName.toLowerCase()}` };
  }
}

/**
 * Validates a start time to ensure it's today or later.
 * @param startTime - The start time string to validate.
 * @returns Validation error message or undefined if valid.
 */
export function validateStartTime(startTime: string): string | undefined {
  try {
    console.log('validateStartTime', startTime);
    const startTimeDate = convertReadableDateToTimestamp(startTime);
    console.log('startTimeDate', startTimeDate);
   
    if (startTimeDate < getStartOfTodayLocal()) {
      return 'Start time must be today or later';
    }
    return undefined;
  } catch (error) {
    console.log('error', error);
    return 'Invalid start time';
  }
}

/**
 * Validates an expiry time to ensure it's in the future.
 * @param expiry - The expiry time string to validate.
 * @returns Validation error message or undefined if valid.
 */
export function validateExpiry(expiry: string): string | undefined {
  try {
    const expiryDate = convertReadableDateToTimestamp(expiry);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (expiryDate < nowSeconds) {
      return 'Expiry must be in the future';
    }
    return undefined;
  } catch (error) {
    return 'Invalid expiry';
  }
}

/**
 * Validates that max amount is greater than initial amount.
 * @param maxAmount - The maximum amount as BigInt.
 * @param initialAmount - The initial amount as BigInt.
 * @returns Validation error message or undefined if valid.
 */
export function validateMaxAmountVsInitialAmount(
  maxAmount: bigint | undefined,
  initialAmount: bigint | undefined,
): string | undefined {
  if (
    maxAmount !== undefined &&
    initialAmount !== undefined &&
    maxAmount < initialAmount
  ) {
    return 'Max amount must be greater than initial amount';
  }
  return undefined;
}

/**
 * Calculates amount per second from amount per period.
 * @param amountPerPeriod - The amount per period as BigInt.
 * @param timePeriod - The time period.
 * @param decimals - Token decimals.
 * @returns Formatted amount per second string.
 */
export function calculateAmountPerSecond(
  amountPerPeriod: bigint,
  timePeriod: TimePeriod,
  decimals: number,
): string {
  return formatUnits({
    value: amountPerPeriod / TIME_PERIOD_TO_SECONDS[timePeriod],
    decimals,
  });
}

/**
 * Validates a period duration (for periodic permissions).
 * @param periodDuration - The period duration string to validate.
 * @returns Object containing parsed duration and any validation error.
 */
export function validatePeriodDuration(periodDuration: string): {
  duration: number | undefined;
  error: string | undefined;
} {
  try {
    const duration = parseInt(periodDuration, 10);
    if (isNaN(duration) || duration <= 0) {
      return {
        duration: undefined,
        error: 'Period duration must be greater than 0',
      };
    }
    return { duration, error: undefined };
  } catch (error) {
    return { duration: undefined, error: 'Invalid period duration' };
  }
}
