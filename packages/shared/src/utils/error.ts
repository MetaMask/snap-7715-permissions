import type { ZodIssue } from 'zod';

/**
 * Determines if a path should be simplified in error messages.
 *
 * Simplifies paths that are:
 * - Array element validations (e.g., [0, 'rules'] becomes just the message)
 * - Top-level custom validations with no meaningful path context
 *
 * Business rationale: Array indices like "0.rules" are confusing to end users
 * because they don't know which item in the array failed, and the custom error
 * message typically provides better context (e.g., "Expiry rule is required").
 *
 * @param path - The Zod error path segments.
 * @param code - The Zod error code.
 * @returns True if the path should be simplified (message only), false otherwise.
 */
const shouldSimplifyPath = (
  path: (string | number)[],
  code: string,
): boolean => {
  // Only simplify custom validation errors
  if (code !== 'custom') {
    return false;
  }

  // Empty path - already just the message
  if (path.length === 0) {
    return true;
  }

  // Pattern: [arrayIndex, fieldName] - e.g., [0, 'rules']
  // This represents a refinement on an array element's field
  if (path.length === 2 && typeof path[0] === 'number') {
    return true;
  }

  // Pattern: [arrayIndex, fieldName, nestedIndex] - e.g., [0, 'rules', 1]
  // This represents a refinement on nested array elements
  if (
    path.length === 3 &&
    typeof path[0] === 'number' &&
    typeof path[2] === 'number'
  ) {
    return true;
  }

  return false;
};

/**
 * Extracts and formats Zod validation errors into a human-readable string.
 *
 * For standard validation errors (type mismatches, regex failures, etc.), the full
 * field path is included to help identify the exact field that failed.
 *
 * For custom validation errors (refinements), array indices are often omitted
 * because they provide poor UX - the custom error message typically contains
 * better context about what went wrong.
 *
 * @param zodIssue - Array of Zod validation issues.
 * @returns A formatted error message string.
 *
 * @example
 * // Standard validation error with path
 * extractZodError([{
 *   code: 'invalid_string',
 *   path: ['permission', 'data', 'tokenAddress'],
 *   message: 'Invalid hex value'
 * }])
 * // Returns: "Failed type validation: permission.data.tokenAddress: Invalid hex value"
 *
 * @example
 * // Custom validation error with array index (simplified)
 * extractZodError([{
 *   code: 'custom',
 *   path: [0, 'rules'],
 *   message: 'Expiry rule is required'
 * }])
 * // Returns: "Failed type validation: Expiry rule is required"
 */
export const extractZodError = (zodIssue: ZodIssue[]): string => {
  const errorsWithPaths = zodIssue.map((zodErr) => {
    // Check if we should simplify this path based on structure
    if (shouldSimplifyPath(zodErr.path, zodErr.code)) {
      return zodErr.message;
    }

    // For all other cases, include the full path with the message
    const pathString = zodErr.path.join('.');
    if (pathString) {
      return `${pathString}: ${zodErr.message}`;
    }

    // If no path, just return the message
    return zodErr.message;
  });

  return `Failed type validation: ${errorsWithPaths.join(', ')}`;
};
