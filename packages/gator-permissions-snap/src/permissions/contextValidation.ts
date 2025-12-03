import type { TimePeriod } from '../core/types';
import { t } from '../utils/i18n';
import { getStartOfTodayLocal, TIME_PERIOD_TO_SECONDS } from '../utils/time';
import { parseUnits, formatUnits } from '../utils/value';

export type ValidationErrors = {
  [key: string]: string;
};

/**
 * Converts a string to sentence case, capitalizing the first letter, and lowercasing the rest.
 * @param str - The string to convert.
 * @returns The converted string.
 */
const toSentenceCase = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
  amount: string | null,
  decimals: number,
  fieldName: string,
  allowZero = false,
): { amount: bigint | null; error: string | null } {
  if (amount === null || amount === undefined) {
    return { amount: null, error: null };
  }

  try {
    const parsedAmount = parseUnits({ formatted: amount, decimals });
    if (!allowZero && parsedAmount <= 0n) {
      return {
        amount: null,
        error: t('errorAmountMustBeGreaterThanZero', [
          toSentenceCase(fieldName),
        ]),
      };
    }
    if (allowZero && parsedAmount < 0n) {
      return {
        amount: null,
        error: t('errorAmountMustBeGreaterThanOrEqualToZero', [
          toSentenceCase(fieldName),
        ]),
      };
    }
    return { amount: parsedAmount, error: null };
  } catch (error) {
    return { amount: null, error: t('errorInvalidAmount', [fieldName]) };
  }
}

/**
 * Validates a start time to ensure it's today or later.
 * @param startTime - The start time number to validate. Start time -1 is used to indicate that something is wrong with the start time date field.
 * @returns Validation error message or undefined if valid.
 */
export function validateStartTime(startTime: number): string | undefined {
  if (startTime === -1) {
    return t('errorInvalidStartTime');
  }

  try {
    if (startTime < getStartOfTodayLocal()) {
      return t('errorStartTimeMustBeTodayOrLater');
    }
    return undefined;
  } catch (error) {
    return t('errorInvalidStartTime');
  }
}

/**
 * Validates an expiry time to ensure it's in the future.
 * @param expiry - The expiry time to validate. Expiry -1 is used to indicate that something is wrong with the expiry date field.
 * @returns Validation error message or undefined if valid.
 */
export function validateExpiry(expiry: number): string | undefined {
  if (expiry === -1) {
    return t('errorInvalidExpiry');
  }

  try {
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (expiry < nowSeconds) {
      return t('errorExpiryMustBeInFuture');
    }
    return undefined;
  } catch (error) {
    return t('errorInvalidExpiry');
  }
}

/**
 * Validates that start time is before expiry.
 * @param startTime - The start time string to validate.
 * @param expiry - The expiry time string to validate.
 * @returns Validation error message or undefined if valid.
 */
export function validateStartTimeVsExpiry(
  startTime: number,
  expiry: number,
): string | undefined {
  try {
    if (startTime >= expiry) {
      return t('errorStartTimeMustBeBeforeExpiry');
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Validates that max amount is greater than initial amount.
 * @param maxAmount - The maximum amount as BigInt.
 * @param initialAmount - The initial amount as BigInt.
 * @returns Validation error message or undefined if valid.
 */
export function validateMaxAmountVsInitialAmount(
  maxAmount: bigint | null,
  initialAmount: bigint | null,
): string | null {
  if (
    maxAmount !== null &&
    initialAmount !== null &&
    maxAmount < initialAmount
  ) {
    return t('errorMaxAmountMustBeGreaterThanInitialAmount');
  }
  return null;
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
export function validatePeriodDuration(periodDuration: number): {
  duration: number | undefined;
  error: string | undefined;
} {
  try {
    const duration = periodDuration;
    if (isNaN(duration) || duration <= 0) {
      return {
        duration: undefined,
        error: t('errorPeriodDurationMustBeGreaterThanZero'),
      };
    }
    return { duration, error: undefined };
  } catch (error) {
    return { duration: undefined, error: t('errorInvalidPeriodDuration') };
  }
}
