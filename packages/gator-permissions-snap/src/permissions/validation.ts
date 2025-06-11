import type { Hex } from 'viem';

/**
 * Validates a hex integer value with configurable constraints.
 *
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
  value: Hex | undefined;
  allowZero: boolean;
  required: boolean;
}) {
  if (value === undefined || value === null) {
    if (!required) {
      return;
    }

    throw new Error(`Invalid ${name}: must be defined`);
  }
  let parsedValue: bigint;

  try {
    parsedValue = BigInt(value);
  } catch (error) {
    throw new Error(`Invalid ${name}: must be a valid hex integer`);
  }

  if (parsedValue === 0n && !allowZero) {
    throw new Error(`Invalid ${name}: must be greater than 0`);
  }
}
