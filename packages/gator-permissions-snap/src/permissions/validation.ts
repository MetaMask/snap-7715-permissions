import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import type { Hex } from '@metamask/delegation-core';
import { InvalidInputError } from '@metamask/snaps-sdk';

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
