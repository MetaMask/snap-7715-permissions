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

import { isSnapRpcError } from '../../src/utils/error';

describe('isSnapRpcError', () => {
  it('should return true for SnapError', () => {
    const error = new SnapError('Test SnapError');
    expect(isSnapRpcError(error as any)).toBe(true);
  });

  it('should return true for MethodNotFoundError', () => {
    const error = new MethodNotFoundError('Test MethodNotFoundError');
    expect(isSnapRpcError(error as any)).toBe(true);
  });

  it('should return true for MethodNotSupportedError', () => {
    const error = new MethodNotSupportedError('Test MethodNotSupportedError');
    expect(isSnapRpcError(error as any)).toBe(true);
  });

  it('should return true for ParseError', () => {
    const error = new ParseError('Test ParseError');
    expect(isSnapRpcError(error as any)).toBe(true);
  });

  it('should return true for UnauthorizedError', () => {
    const error = new UnauthorizedError('Test UnauthorizedError');
    expect(isSnapRpcError(error as any)).toBe(true);
  });

  it('should return true for InternalError', () => {
    const error = new InternalError('Test InternalError');
    expect(isSnapRpcError(error as any)).toBe(true);
  });

  it('should return true for InvalidParamsError', () => {
    const error = new InvalidParamsError('Test InvalidParamsError');
    expect(isSnapRpcError(error as any)).toBe(true);
  });

  it('should return true for InvalidRequestError', () => {
    const error = new InvalidRequestError('Test InvalidRequestError');
    expect(isSnapRpcError(error as any)).toBe(true);
  });

  it('should return true for UserRejectedRequestError', () => {
    const error = new UserRejectedRequestError('Test UserRejectedRequestError');
    expect(isSnapRpcError(error as any)).toBe(true);
  });

  it('should return false for a non-Snap error', () => {
    const error = new Error('Generic error');
    expect(isSnapRpcError(error as any)).toBe(false);
  });

  it('should return false for an unknown error type', () => {
    const error = new TypeError('Test TypeError');
    expect(isSnapRpcError(error as any)).toBe(false);
  });
});
