import {
  SnapError,
  MethodNotFoundError,
  MethodNotSupportedError,
  ParseError,
  UnauthorizedError,
  InternalError,
  InvalidParamsError,
  InvalidRequestError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';

/**
 * Determines if the given error is a Snap RPC error.
 *
 * @param error - The error instance to be checked.
 * @returns A boolean indicating whether the error is a Snap RPC error.
 */
export function isSnapRpcError(error: Error): boolean {
  const snapRpcErrorTypes = [
    SnapError,
    UserRejectedRequestError,
    MethodNotSupportedError,
    MethodNotFoundError,
    ParseError,
    UnauthorizedError,
    InternalError,
    InvalidParamsError,
    InvalidRequestError,
  ];
  return snapRpcErrorTypes.some((errType) => error instanceof errType);
}
