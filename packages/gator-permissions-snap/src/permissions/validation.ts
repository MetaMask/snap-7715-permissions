import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
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
}) {
  if (value === undefined || value === null) {
    if (!required) {
      return;
    }

    throw new InvalidInputError(`Invalid ${name}: must be defined`);
  }
  let parsedValue: bigint;

  try {
    parsedValue = BigInt(value);
  } catch (error) {
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
) {
  const expiryRule = rules?.find((rule) => rule.type === 'expiry');
  // expiry rule is validated by the zod schema, but we need the expiry in order
  // to validate the startTime
  if (!expiryRule) {
    throw new InvalidInputError('Expiry rule is required');
  }
  const expiry = expiryRule.data.timestamp as number;

  // If startTime is not provided it default to Date.now(), expiry is always in the future so no need to check.
  if (startTime && startTime >= expiry) {
    throw new InvalidInputError('Invalid startTime: must be before expiry');
  }
}
