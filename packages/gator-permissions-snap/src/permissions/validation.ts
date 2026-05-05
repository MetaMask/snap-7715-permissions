import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import type { Hex } from '@metamask/delegation-core';
import { InvalidInputError } from '@metamask/snaps-sdk';

export const MULTIPLE_ERC20_PAYEES_UNSUPPORTED_ERROR =
  'Multiple payee addresses are not currently supported for ERC20 permissions.';

/**
 * Validates a hex integer value with configurable constraints.
 * @param params - The validation parameters.
 * @param params.name - The name of the value being validated, used in error messages.
 * @param params.value - The hex value to validate.
 * @param params.allowZero - Whether zero values are allowed.
 * @param params.required - Whether the value is required (must be defined).
 * @throws {Error} If the value fails validation
 */
export function validateHexInteger({
  name,
  value,
  allowZero,
  required,
}: {
  name: string;
  value: Hex | undefined | null;
  allowZero: boolean;
  required: boolean;
}): void {
  if (value === undefined || value === null) {
    if (!required) {
      return;
    }

    throw new InvalidInputError(`Invalid ${name}: must be defined`);
  }
  let parsedValue: bigint;

  try {
    parsedValue = BigInt(value);
  } catch {
    throw new InvalidInputError(`Invalid ${name}: must be a valid hex integer`);
  }

  if (parsedValue === 0n && !allowZero) {
    throw new InvalidInputError(`Invalid ${name}: must be greater than 0`);
  }
}

/**
 * Validates the redeemer rule, if present, has a non-empty addresses array.
 * @param rules - The rules of the permission request.
 * @throws {InvalidInputError} If a redeemer rule exists with missing or empty addresses.
 */
export function validateRedeemerRule(
  rules: PermissionRequest['rules'] | undefined,
): void {
  const redeemerRule = rules?.find(
    (rule) => extractDescriptorName(rule.type) === 'redeemer',
  );
  if (!redeemerRule) {
    return;
  }

  const { addresses } = redeemerRule.data;
  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new InvalidInputError(
      'Invalid redeemer rule: must include a non-empty addresses array',
    );
  }
}

/**
 * Validates the payee rule, if present, has a non-empty addresses array.
 * @param rules - The rules of the permission request.
 * @param options - Payee validation options.
 * @param options.allowMultiplePayees - Whether more than one payee address is supported.
 * @throws {InvalidInputError} If a payee rule exists with missing or empty addresses.
 */
export function validatePayeeRule(
  rules: PermissionRequest['rules'] | undefined,
  {
    allowMultiplePayees = true,
  }: {
    allowMultiplePayees?: boolean;
  } = {},
): void {
  const payeeRule = rules?.find(
    (rule) => extractDescriptorName(rule.type) === 'payee',
  );
  if (!payeeRule) {
    return;
  }

  const { addresses } = payeeRule.data;
  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new InvalidInputError(
      'Invalid payee rule: must include a non-empty addresses array',
    );
  }

  if (!allowMultiplePayees && addresses.length > 1) {
    throw new InvalidInputError(MULTIPLE_ERC20_PAYEES_UNSUPPORTED_ERROR);
  }
}

/**
 * Validates a start time to ensure it's before expiry.
 * @param startTime - The start time number to validate.
 * @param rules - The rules of the permission request.
 * @throws {Error} If the start time fails validation
 */
export function validateStartTime(
  startTime: number | undefined | null,
  rules: PermissionRequest['rules'],
): void {
  const expiryRule = rules?.find(
    (rule) => extractDescriptorName(rule.type) === 'expiry',
  );
  // If there is no expiry rule, skip validating startTime vs expiry.
  if (!expiryRule) {
    return;
  }
  const expiry = expiryRule.data.timestamp as number;

  // If startTime is not provided it defaults to Date.now(). If expiry is specified, the startTime must be before expiry.
  if (startTime && startTime >= expiry) {
    throw new InvalidInputError('Invalid startTime: must be before expiry');
  }
}
