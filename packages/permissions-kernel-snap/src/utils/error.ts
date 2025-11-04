import {
  MethodNotFoundError,
  MethodNotSupportedError,
  ParseError,
  UnauthorizedError,
  InternalError,
  InvalidParamsError,
  InvalidRequestError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';

type SnapErrorClass =
  | typeof UserRejectedRequestError
  | typeof ParseError
  | typeof InvalidRequestError
  | typeof MethodNotFoundError
  | typeof InvalidParamsError
  | typeof InternalError
  | typeof MethodNotSupportedError
  | typeof UnauthorizedError;

/**
 * Map of standard JSON-RPC 2.0 and EIP-1193 error codes to their Snap error constructors.
 * These codes are defined by the JSON-RPC 2.0 specification and EIP-1193 provider API.
 */
const ERROR_CODE_TO_CONSTRUCTOR_MAP = new Map<number, SnapErrorClass>([
  [4001, UserRejectedRequestError],
  [-32700, ParseError],
  [-32600, InvalidRequestError],
  [-32601, MethodNotFoundError],
  [-32602, InvalidParamsError],
  [-32603, InternalError],
  [-32004, MethodNotSupportedError],
  [4100, UnauthorizedError],
]);

/**
 * Deserializes an error object from inter-snap communication into a proper Snap RPC error.
 * When errors cross snap boundaries via wallet_invokeSnap, they get serialized and lose
 * their type information. This function reconstructs them based on their error code,
 * preserving the message, stack trace, and any additional data.
 *
 * @param error - The serialized error object to deserialize.
 * @returns A proper Snap RPC error instance, or null if the error code is not recognized.
 */
export function deserializeSnapError(
  error: unknown,
): InstanceType<SnapErrorClass> | null {
  // Check if error is an object with a code property
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  const { code } = error;

  // Ensure code is a number
  if (typeof code !== 'number') {
    return null;
  }

  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message
      : 'Unknown error';

  // Look up the error constructor by code
  const ErrorConstructor = ERROR_CODE_TO_CONSTRUCTOR_MAP.get(code);
  if (ErrorConstructor) {
    const reconstructedError = new ErrorConstructor(message);

    // Preserve stack trace if available (useful for debugging)
    if ('stack' in error && typeof error.stack === 'string') {
      Object.defineProperty(reconstructedError, 'stack', {
        value: error.stack,
        writable: true,
        enumerable: false,
        configurable: true,
      });
    }

    // Preserve additional data if available
    // Note: Not all error types may use this, but it won't cause issues if they don't
    if (
      'data' in error &&
      error.data !== null &&
      typeof error.data === 'object'
    ) {
      Object.defineProperty(reconstructedError, 'data', {
        value: error.data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    return reconstructedError;
  }

  return null;
}
